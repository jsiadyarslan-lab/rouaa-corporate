// ─── Global Client Components ──────────────────────────────────────
// Wrapper for client-only components that must render in the root layout.
// layout.tsx is a Server Component, so ssr:false dynamic imports are not allowed there.
// This file is a Client Component that can use ssr:false dynamic imports.

'use client';

import dynamic from 'next/dynamic';

// SearchCommand — must be available on ALL pages, not just homepage
const SearchCommand = dynamic(() => import('@/components/rouaa/SearchCommand'), { ssr: false });

// BackToTop — must be available on ALL pages
const BackToTop = dynamic(() => import('@/components/rouaa/BackToTop'), { ssr: false });

export default function GlobalClientComponents() {
  return (
    <>
      <SearchCommand />
      <BackToTop />
    </>
  );
}
