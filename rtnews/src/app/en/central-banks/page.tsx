'use client';

import { useEffect } from 'react';
import EnArabCentralBanks from '@/components/en/EnArabCentralBanks';

export default function EnCentralBanksPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">
        <EnArabCentralBanks />
      </div>
    </main>
  );
}
