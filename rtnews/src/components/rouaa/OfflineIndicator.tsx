'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

// Hydration-safe online status check
function getOnlineSnapshot() {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
function getServerSnapshot() {
  return true;
}
function subscribeToOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

interface OfflineIndicatorProps {
  locale?: string;
}

export default function OfflineIndicator({ locale = 'ar' }: OfflineIndicatorProps) {
  const isEn = locale === 'en';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isOnline = useSyncExternalStore(subscribeToOnline, getOnlineSnapshot, getServerSnapshot);
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [mountedLongEnough, setMountedLongEnough] = useState(false);

  // Don't show offline banner during the first 10 seconds after mount
  useEffect(() => {
    const timer = setTimeout(() => setMountedLongEnough(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      const timer = setTimeout(() => {
        if (!navigator.onLine && mountedLongEnough) {
          setIsOffline(true);
          setWasOffline(true);
          setShowReconnected(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      if (wasOffline) {
        setIsOffline(false);
        setShowReconnected(true);
        setWasOffline(false);
        const timer = setTimeout(() => setShowReconnected(false), 3000);
        return () => clearTimeout(timer);
      }
      setIsOffline(false);
    }
  }, [isOnline, wasOffline, mountedLongEnough]);

  return (
    <>
      {/* ── Offline Banner ── */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-in-out ${
          isOffline ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div
          role="alert"
          className="flex items-center justify-center gap-2 py-2.5 px-4 text-[12px] font-bold"
          style={{
            background: 'var(--bear)',
            color: 'white',
            direction: isFr || isEn || isTr ? 'ltr' : 'rtl',
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'white' }} />
          <span>{isFr ? 'Vous êtes hors ligne' : isEn ? 'You are offline' : isTr ? 'Çevrimdışısınız' : 'أنت غير متصل بالإنترنت'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
      </div>

      {/* ── Reconnected Toast ── */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-in-out ${
          showReconnected ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div
          className="flex items-center justify-center gap-2 py-2.5 px-4 text-[12px] font-bold"
          style={{
            background: 'var(--bull)',
            color: 'white',
            direction: isFr || isEn || isTr ? 'ltr' : 'rtl',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{isFr ? 'Connexion rétablie' : isEn ? 'Back online' : isTr ? 'Tekrar çevrimiçi' : 'تم إعادة الاتصال'}</span>
        </div>
      </div>
    </>
  );
}
