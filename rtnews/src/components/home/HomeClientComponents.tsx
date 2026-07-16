// ─── Home Client Components V6 ────────────────────────────────────────
// SearchCommand and BackToTop are now in root layout.tsx (work on ALL pages)
// This component only renders the MobileBottomTab

'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Locale-specific bottom tabs
const MobileBottomTab = dynamic(() => import('@/components/rouaa/MobileBottomTab'), { ssr: false });
const EnMobileBottomTab = dynamic(() => import('@/components/en/EnMobileBottomTab'), { ssr: false });
const FrMobileBottomTab = dynamic(() => import('@/components/fr/FrMobileBottomTab'), { ssr: false });
const TrMobileBottomTab = dynamic(() => import('@/components/tr/TrMobileBottomTab'), { ssr: false });
const EsMobileBottomTab = dynamic(() => import('@/components/es/EsMobileBottomTab'), { ssr: false });

export default function HomeClientComponents() {
  const pathname = usePathname();
  const isEn = pathname.startsWith('/en');
  const isFr = pathname.startsWith('/fr');
  const isTr = pathname.startsWith('/tr');
  const isEs = pathname.startsWith('/es');

  const BottomTab = isEn ? EnMobileBottomTab : isFr ? FrMobileBottomTab : isTr ? TrMobileBottomTab : isEs ? EsMobileBottomTab : MobileBottomTab;

  return (
    <>
      <BottomTab />
    </>
  );
}
