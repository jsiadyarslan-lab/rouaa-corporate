'use client';

import { useEffect } from 'react';
import TrEarningsCalendar from '@/components/tr/TrEarningsCalendar';

export default function TrEarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">
        <TrEarningsCalendar />
      </div>
    </main>
  );
}
