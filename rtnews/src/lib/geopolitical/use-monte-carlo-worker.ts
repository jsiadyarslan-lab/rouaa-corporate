// ─── useMonteCarloWorker Hook ──────────────────────────────────
// React hook that wraps the Monte Carlo Web Worker, providing
// a Promise-based API and automatic cleanup on unmount.

import { useRef, useCallback, useEffect } from 'react';
import type { ScenarioInput, SimulationResult } from './monte-carlo';

// ─── Types matching worker messages ────────────────────────────

interface SingleResultMessage {
  type: 'result';
  data: SimulationResult[];
}

interface MultiResultMessage {
  type: 'multiResult';
  data: [string, SimulationResult][];
}

type WorkerOutbound = SingleResultMessage | MultiResultMessage;

// ─── Pending promise resolvers ─────────────────────────────────

interface PendingResolvers {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  type: 'single' | 'multi';
}

// ─── Hook return type ──────────────────────────────────────────

interface UseMonteCarloWorkerReturn {
  /** Run simulation for a single scenario */
  runSimulation: (input: ScenarioInput, iterations?: number) => Promise<SimulationResult[]>;
  /** Run simulation for multiple scenarios, returns aggregated results */
  runMultiSimulation: (scenarios: ScenarioInput[], iterations?: number) => Promise<Map<string, SimulationResult>>;
  /** Whether the worker is currently processing a simulation */
  isRunning: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useMonteCarloWorker(): UseMonteCarloWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<PendingResolvers | null>(null);
  const isRunningRef = useRef(false);

  // ── Lazy-init worker ──────────────────────────────────────────

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./monte-carlo-worker.ts', import.meta.url)
      );

      workerRef.current.onmessage = (event: MessageEvent<WorkerOutbound>) => {
        const msg = event.data;
        const pending = pendingRef.current;
        if (!pending) return;

        if (msg.type === 'result' && pending.type === 'single') {
          pending.resolve(msg.data);
          pendingRef.current = null;
          isRunningRef.current = false;
        }

        if (msg.type === 'multiResult' && pending.type === 'multi') {
          // Reconstruct Map from serialized entries
          const map = new Map<string, SimulationResult>(msg.data);
          pending.resolve(map);
          pendingRef.current = null;
          isRunningRef.current = false;
        }
      };

      workerRef.current.onerror = (error: ErrorEvent) => {
        const pending = pendingRef.current;
        if (pending) {
          pending.reject(new Error(`Monte Carlo worker error: ${error.message}`));
          pendingRef.current = null;
          isRunningRef.current = false;
        }
      };
    }

    return workerRef.current;
  }, []);

  // ── Public API ────────────────────────────────────────────────

  const runSimulation = useCallback(
    (input: ScenarioInput, iterations: number = 10000): Promise<SimulationResult[]> => {
      if (pendingRef.current) {
        return Promise.reject(new Error('A simulation is already running'));
      }

      return new Promise<SimulationResult[]>((resolve, reject) => {
        isRunningRef.current = true;
        pendingRef.current = { resolve, reject, type: 'single' };

        const worker = getWorker();
        worker.postMessage({ type: 'run', input, iterations });
      });
    },
    [getWorker]
  );

  const runMultiSimulation = useCallback(
    (scenarios: ScenarioInput[], iterations: number = 10000): Promise<Map<string, SimulationResult>> => {
      if (pendingRef.current) {
        return Promise.reject(new Error('A simulation is already running'));
      }

      return new Promise<Map<string, SimulationResult>>((resolve, reject) => {
        isRunningRef.current = true;
        pendingRef.current = { resolve, reject, type: 'multi' };

        const worker = getWorker();
        worker.postMessage({ type: 'runMulti', scenarios, iterations });
      });
    },
    [getWorker]
  );

  // ── Cleanup on unmount ────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRef.current = null;
      isRunningRef.current = false;
    };
  }, []);

  return {
    runSimulation,
    runMultiSimulation,
    isRunning: isRunningRef.current,
  };
}
