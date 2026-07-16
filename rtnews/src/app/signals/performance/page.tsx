// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════

import { Metadata } from 'next';
import PerformancePageClient from './PerformancePageClient';

export const metadata: Metadata = {
  title: 'أداء الإشارات | رؤى للأخبار المالية',
  description: 'إحصائيات أداء إشارات التداول — نسبة النجاح، متوسط الأرباح، وتحليل الأداء حسب الفئة',
  keywords: 'أداء الإشارات, نسبة النجاح, تحليل, تداول, عملات رقمية, فوركس, سلع',
};

export default function PerformancePage() {
  return <PerformancePageClient />;
}
