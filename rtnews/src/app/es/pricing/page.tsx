// ─── Spanish Pricing Page ───────────────────────────────────────
// Uses the Spanish-specific PricingSection component with translated content

'use client';

import { useEffect } from 'react';
import EsPricingSection from '@/components/es/EsPricingSection';

export default function EsPricingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }} dir="ltr">
      <div className="pt-4">
        <EsPricingSection />
      </div>
    </main>
  );
}
