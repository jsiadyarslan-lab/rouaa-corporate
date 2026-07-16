'use client';

import { useEffect } from 'react';
import EarningsCalendar from '@/components/rouaa/EarningsCalendar';

export default function EarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">
        <EarningsCalendar />
      </div>
    </main>
  );
}
