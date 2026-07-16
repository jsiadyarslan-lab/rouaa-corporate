'use client';

import { useEffect } from 'react';
import EsEarningsCalendar from '@/components/es/EsEarningsCalendar';

export default function EsEarningsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">
        <EsEarningsCalendar />
      </div>
    </main>
  );
}
