// ─── useIntegrationStream Hook V2 ────────────────────────────
// React hook for consuming the integration SSE stream.
// Provides real-time market data updates to components.
//
// Usage:
//   const { quotes, signalStats, connected, circuitBreakerOpen } = useIntegrationStream();
//
// The hook automatically connects to /api/integration/stream and
// reconnects on disconnection with exponential backoff and max retry limit.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface QuoteUpdate {
  price: number;
  change: number;
  changePercent: number;
  source?: string;
}

interface SignalStatsUpdate {
  total: number;
  active: number;
  expired: number;
  executed: number;
  cancelled: number;
  source?: string;
}

interface IntegrationStreamState {
  quotes: Record<string, QuoteUpdate>;
  signalStats: SignalStatsUpdate | null;
  sparklines: Record<string, number[]>;
  connected: boolean;
  circuitBreakerOpen: boolean;
  lastUpdate: Date | null;
}

const MAX_RETRIES = 5;
const BASE_RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_DELAY = 60000; // 60 seconds

export function useIntegrationStream(feeds: string[] = ['quotes', 'signals', 'sparklines']) {
  const [state, setState] = useState<IntegrationStreamState>({
    quotes: {},
    signalStats: null,
    sparklines: {},
    connected: false,
    circuitBreakerOpen: false,
    lastUpdate: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Don't connect if max retries exceeded
    if (retryCountRef.current >= MAX_RETRIES) {
      return;
    }

    const feedsParam = feeds.join(',');
    const eventSource = new EventSource(`/api/integration/stream?feeds=${feedsParam}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse(e.data);
        // Reset retry count on successful connection
        retryCountRef.current = 0;
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: true,
            circuitBreakerOpen: data.circuitBreakerOpen || false,
          }));
        }
      } catch {}
    });

    eventSource.addEventListener('quotes', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.quotes && mountedRef.current) {
          setState(prev => ({
            ...prev,
            quotes: data.quotes,
            lastUpdate: new Date(),
          }));
        }
      } catch {}
    });

    eventSource.addEventListener('signals', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stats && mountedRef.current) {
          setState(prev => ({
            ...prev,
            signalStats: data.stats,
            lastUpdate: new Date(),
          }));
        }
      } catch {}
    });

    eventSource.addEventListener('sparklines', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.sparklines && mountedRef.current) {
          setState(prev => ({
            ...prev,
            sparklines: data.sparklines,
            lastUpdate: new Date(),
          }));
        }
      } catch {}
    });

    eventSource.addEventListener('disconnect', () => {
      eventSource.close();
      if (mountedRef.current) {
        setState(prev => ({ ...prev, connected: false }));
      }

      // Exponential backoff reconnect
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, retryCountRef.current), MAX_RECONNECT_DELAY);
        retryCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      if (mountedRef.current) {
        setState(prev => ({ ...prev, connected: false }));
      }

      // Exponential backoff reconnect
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, retryCountRef.current), MAX_RECONNECT_DELAY);
        retryCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, [feeds]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return state;
}
