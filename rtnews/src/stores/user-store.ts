import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────

export interface BookmarkItem {
  id: string;
  slug?: string;
  title: string;
  titleAr?: string;
  translatedTitle?: string;
  summary?: string;
  source: string;
  category: string;
  sentiment: string;
  impactLevel: string;
  url?: string;
  imageUrl?: string;
  savedAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  titleAr?: string;
  translatedTitle?: string;
  source: string;
  category: string;
  readAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'breaking' | 'price_alert' | 'analysis' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface UserState {
  // Hydration guard — prevents React #310 during Zustand persist rehydration
  _hasHydrated: boolean;

  // Bookmarks
  bookmarks: BookmarkItem[];
  addBookmark: (item: Omit<BookmarkItem, 'savedAt'>) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;

  // Reading History
  readingHistory: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'readAt'>) => void;
  clearHistory: () => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: () => number;

  // Preferences
  preferredCategories: string[];
  setPreferredCategories: (cats: string[]) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // ── Hydration guard ──
      _hasHydrated: false,

      // ── Bookmarks ──
      bookmarks: [],

      addBookmark: (item) => {
        set((state) => {
          // Avoid duplicates
          if (state.bookmarks.some(b => b.id === item.id)) return state;
          const newItem: BookmarkItem = { ...item, savedAt: new Date().toISOString() };
          // Limit to 200 items (remove oldest if exceeded)
          const updated = [newItem, ...state.bookmarks];
          if (updated.length > 200) updated.pop();
          return { bookmarks: updated };
        });
        dispatchBookmarkChange();
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => b.id !== id),
        }));
        dispatchBookmarkChange();
      },

      isBookmarked: (id) => get().bookmarks.some(b => b.id === id),

      // ── Reading History ──
      readingHistory: [],

      addToHistory: (item) => set((state) => {
        // Remove existing entry for same article (to update readAt)
        const filtered = state.readingHistory.filter(h => h.id !== item.id);
        const newItem: HistoryItem = { ...item, readAt: new Date().toISOString() };
        const updated = [newItem, ...filtered];
        // Limit to 100 items
        if (updated.length > 100) updated.splice(100);
        return { readingHistory: updated };
      }),

      clearHistory: () => set({ readingHistory: [] }),

      // ── Notifications ──
      notifications: [],

      addNotification: (notif) => set((state) => {
        const newItem: NotificationItem = {
          ...notif,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        // Keep latest 50 notifications
        const updated = [newItem, ...state.notifications].slice(0, 50);
        return { notifications: updated };
      }),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      })),

      unreadCount: () => get().notifications.filter(n => !n.read).length,

      // ── Preferences ──
      preferredCategories: [],
      setPreferredCategories: (cats) => set({ preferredCategories: cats }),

      fontSize: 'medium',
      setFontSize: (size) => set({ fontSize: size }),

      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'rouaa-user-store',
      // Only persist specific fields (NOT _hasHydrated — it should always start as false)
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        readingHistory: state.readingHistory,
        notifications: state.notifications,
        preferredCategories: state.preferredCategories,
        fontSize: state.fontSize,
        notificationsEnabled: state.notificationsEnabled,
      }),
      // Mark hydration as complete AFTER the store has been rehydrated.
      // This prevents React #310 ("Cannot update a component while rendering
      // a different component") caused by Zustand persist triggering store
      // state updates during React's render phase.
      onRehydrateStorage: () => {
        return (_state, _error) => {
          // Use setTimeout to defer the hydration flag to the next macrotask,
          // ensuring it doesn't trigger during the current render cycle.
          // setTimeout is safer than queueMicrotask because it runs after
          // all microtasks and React render cycles are complete.
          setTimeout(() => {
            useUserStore.setState({ _hasHydrated: true });
          }, 0);
        };
      },
    }
  )
);

// ── Hydration-safe hook for components that depend on persisted state ──
// Returns false until Zustand persist has rehydrated from localStorage.
// Uses a MODULE-LEVEL flag to prevent React #310.
// No polling — just checks once on mount and listens for the store's
// _hasHydrated flag to be set by the onRehydrateStorage callback.
let _globalHydrated = false;

export function useUserStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    // Check synchronously on first render — if already hydrated, use true
    if (_globalHydrated) return true;
    if (typeof window !== 'undefined' && useUserStore.getState()._hasHydrated) {
      _globalHydrated = true;
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (_globalHydrated) return; // Already hydrated globally, no need to subscribe

    // Subscribe to store changes — when _hasHydrated becomes true,
    // update the local state. The subscription callback runs outside
    // of React's render phase, so it's safe.
    const unsub = useUserStore.subscribe((state) => {
      if (state._hasHydrated && !_globalHydrated) {
        _globalHydrated = true;
        // Use setTimeout to ensure the setState doesn't happen during
        // another component's render cycle
        setTimeout(() => setHydrated(true), 0);
      }
    });

    // Also check immediately in case hydration completed between
    // the initial render and this effect
    if (useUserStore.getState()._hasHydrated && !_globalHydrated) {
      _globalHydrated = true;
      setHydrated(true);
    }

    return unsub;
  }, []);

  return hydrated;
}

// ── Safe bookmark status hook ──
// Does NOT use real-time store subscriptions to prevent React #310.
// Instead, it reads from the store on mount and after hydration,
// and listens for bookmark changes via a custom event.
// This ensures no setState is ever called during another component's render.
const BOOKMARK_CHANGE_EVENT = 'rouaa-bookmark-change';

// Dispatch a custom event when bookmarks change (called from addBookmark/removeBookmark)
// Uses setTimeout(0) to ensure it fires AFTER the current render cycle,
// preventing React #310 "Cannot update a component while rendering a different component"
function dispatchBookmarkChange() {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(BOOKMARK_CHANGE_EVENT));
    }, 0);
  }
}

export function useIsBookmarked(articleId: string): boolean {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const hydrated = useUserStoreHydrated();

  useEffect(() => {
    if (!hydrated) return;

    // Read current value from store
    const check = () => {
      const newValue = useUserStore.getState().bookmarks.some(b => b.id === articleId);
      setIsBookmarked(prev => prev === newValue ? prev : newValue);
    };
    check();

    // Listen for bookmark changes via custom event instead of store subscription
    window.addEventListener(BOOKMARK_CHANGE_EVENT, check);
    return () => window.removeEventListener(BOOKMARK_CHANGE_EVENT, check);
  }, [hydrated, articleId]);

  return isBookmarked;
}
