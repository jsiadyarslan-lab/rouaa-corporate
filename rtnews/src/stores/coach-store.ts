import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────

export interface CoachMessage {
  id: string;
  text: string;
  type: 'user' | 'bot';
  timestamp: string;
}

interface CoachState {
  // Chat Messages
  messages: CoachMessage[];
  addMessage: (msg: Omit<CoachMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // UI State
  hasOpenedBefore: boolean;
  setHasOpenedBefore: () => void;
}

// ─── Store ────────────────────────────────────────────────────

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      // ── Messages ──
      messages: [],

      addMessage: (msg) => set((state) => {
        const newMsg: CoachMessage = {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
        };
        // Keep latest 100 messages
        const updated = [...state.messages, newMsg];
        if (updated.length > 100) updated.splice(0, updated.length - 100);
        return { messages: updated };
      }),

      clearMessages: () => set({ messages: [] }),

      // ── UI State ──
      hasOpenedBefore: false,
      setHasOpenedBefore: () => set({ hasOpenedBefore: true }),
    }),
    {
      name: 'rouaa-coach-store',
      partialize: (state) => ({
        messages: state.messages,
        hasOpenedBefore: state.hasOpenedBefore,
      }),
    }
  )
);
