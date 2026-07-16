'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

const sessions = [
  { label: 'طوكيو', code: 'TKY', tz: 'Asia/Tokyo', openH: 9, closeH: 15 },
  { label: 'لندن', code: 'LDN', tz: 'Europe/London', openH: 8, closeH: 17 },
  { label: 'نيويورك', code: 'NYC', tz: 'America/New_York', openH: 9, closeH: 16 },
];

function isSessionOpen(tz: string, openH: number, closeH: number): boolean {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    const [h] = fmt.format(now).split(':').map(Number);
    return h >= openH && h < closeH;
  } catch {
    return false;
  }
}

function getUTCMinute(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function MarketStatusBar() {
  const [utcTime, setUtcTime] = useState('');
  const [mounted, setMounted] = useState(false);

  const updateTime = useCallback(() => {
    setUtcTime(getUTCMinute());
  }, []);

  useEffect(() => {
    setMounted(true);
    updateTime();
    // Update every 30 seconds instead of every second
    // This avoids 60 unnecessary re-renders per minute
    const interval = setInterval(updateTime, 30_000);
    return () => clearInterval(interval);
  }, [updateTime]);

  // Memoize session status to avoid recalculating on every render
  const sessionStatus = useMemo(() => {
    if (!mounted) return sessions.map(s => ({ ...s, open: false }));
    return sessions.map(s => ({
      ...s,
      open: isSessionOpen(s.tz, s.openH, s.closeH),
    }));
  }, [mounted, utcTime]); // Recalculate when time changes

  return (
    <div
      className="flex items-center justify-between px-4 lg:px-8"
      style={{
        height: '26px',
        background: 'rgba(8,12,22,.95)',
        borderBottom: '1px solid var(--border)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* UTC Clock */}
      <div className="flex items-center gap-2">
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--cyan)',
            letterSpacing: '0.5px',
          }}
        >
          {mounted ? `UTC ${utcTime}` : 'UTC --:--:--'}
        </span>
      </div>

      {/* Session Status */}
      <div className="flex items-center gap-4">
        {sessionStatus.map((s) => (
          <div
            key={s.code}
            className="flex items-center gap-1.5"
            style={{ fontSize: '10px' }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: s.open ? 'var(--bull)' : 'var(--text4)',
                boxShadow: s.open ? '0 0 6px rgba(0,200,150,0.6)' : 'none',
                animation: s.open ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span
              style={{
                color: s.open ? 'var(--bull)' : 'var(--text3)',
                fontWeight: s.open ? 600 : 400,
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                color: 'var(--text3)',
                fontWeight: 500,
                fontSize: '9px',
              }}
            >
              {s.open ? 'مفتوح' : 'مغلق'}
            </span>
          </div>
        ))}
      </div>

      {/* Right side spacer or extra info */}
      <div
        style={{
          fontSize: '9px',
          color: 'var(--text3)',
          fontWeight: 500,
        }}
      >
        الأسواق
      </div>
    </div>
  );
}
