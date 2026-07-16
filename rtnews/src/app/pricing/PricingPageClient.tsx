'use client';

import { useEffect } from 'react';
import PricingSection from '@/components/rouaa/PricingSection';

export default function PricingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>
      <div className="pt-4">
        <PricingSection />
      </div>
    </main>
  );
}
