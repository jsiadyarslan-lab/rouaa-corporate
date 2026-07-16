'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUserStore, useUserStoreHydrated } from '@/stores/user-store';

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'الآن';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  } catch {
    return 'الآن';
  }
}

function getNotifIcon(type: string) {
  switch (type) {
    case 'breaking':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'price_alert':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
          <polyline points="16,7 22,7 22,13" />
        </svg>
      );
    case 'analysis':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

function getNotifBg(type: string) {
  switch (type) {
    case 'breaking': return 'rgba(244,63,94,0.08)';
    case 'price_alert': return 'rgba(34,197,94,0.08)';
    case 'analysis': return 'rgba(124,111,205,0.08)';
    default: return 'rgba(0,201,167,0.08)';
  }
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const storeHydrated = useUserStoreHydrated();

  // Read notifications from store using getState() + manual sync
  // instead of useUserStore(selector) to prevent React #310
  const [notifications, setNotifications] = useState<any[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Sync from store — called on mount and when dropdown opens
  const syncFromStore = useCallback(() => {
    const state = useUserStore.getState();
    setNotifications(prev => {
      const newNotifs = state.notifications;
      // Only update if actually different
      if (prev.length !== newNotifs.length) return newNotifs;
      if (prev === newNotifs) return prev;
      return newNotifs;
    });
    setCount(state.notifications.filter((n: any) => !n.read).length);
  }, []);

  useEffect(() => {
    if (!mounted || !storeHydrated) return;

    // Initial sync
    syncFromStore();

    // Periodic sync (every 15 seconds) to catch changes from other sources
    // This avoids direct store subscriptions that cause React #310
    const interval = setInterval(syncFromStore, 15000);
    return () => clearInterval(interval);
  }, [mounted, storeHydrated, syncFromStore]);

  // Sync when dropdown opens
  useEffect(() => {
    if (open && mounted && storeHydrated) syncFromStore();
  }, [open, mounted, storeHydrated, syncFromStore]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-[var(--cyan3)] relative"
        style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}
        aria-label={count > 0 ? `الإشعارات (${count} غير مقروء)` : 'الإشعارات'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Unread badge */}
        {mounted && count > 0 && (
          <span
            className="absolute -top-1 -start-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full px-1"
            style={{ background: 'var(--bear)', color: 'white' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full end-0 mt-2 w-[320px] rounded-xl overflow-hidden z-[1100] slide-in-top"
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--glow)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>الإشعارات</span>
            {count > 0 && (
              <button
                onClick={() => { useUserStore.getState().markAllNotificationsRead(); }}
                className="text-[11px] font-medium transition-colors hover:text-[var(--cyan)]"
                style={{ color: 'var(--cyan)' }}
              >
                تعيين الكل كمقروء
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar" style={{ direction: 'rtl' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="text-[12px] mt-3" style={{ color: 'var(--text3)' }}>لا توجد إشعارات</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => { if (!notif.read) useUserStore.getState().markNotificationRead(notif.id); }}
                  className="flex items-start gap-3 px-4 py-3 transition-all cursor-pointer hover:bg-[var(--bg4)]"
                  style={{ borderBottom: '1px solid var(--border)', direction: 'rtl' }}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: getNotifBg(notif.type) }}
                  >
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold truncate" style={{ color: 'var(--text)' }}>
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--cyan)' }} />
                      )}
                    </div>
                    <p className="text-[11px] leading-[1.5] mt-0.5 line-clamp-2" style={{ color: 'var(--text3)' }}>
                      {notif.body}
                    </p>
                    <span className="text-[9px] mt-1 block" style={{ color: 'var(--text4)' }} suppressHydrationWarning>
                      {mounted ? formatTimeAgo(notif.createdAt) : '...'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
