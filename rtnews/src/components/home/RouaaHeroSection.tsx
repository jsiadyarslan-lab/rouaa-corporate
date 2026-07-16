'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getLocalePath } from '@/lib/locale';

/* ══════════════════════════════════════════════════════════════════════
   RouaaHeroSection — Hero carousel matching rouaa_hero_v5.html design
   10 slides with auto-rotation (5.5s), neural network canvas,
   Ken Burns zoom, progress bar, dot nav, parallax, countdown,
   fear/greed bar, geopolitical risk bar, mini cards grid.
   ══════════════════════════════════════════════════════════════════════ */

type Locale = 'ar' | 'en' | 'es' | 'fr' | 'tr';

interface RouaaHeroSectionProps {
  locale: Locale;
}

/* ── Slide Image URLs ── */
const SLIDE_IMAGES = [
  '/hero/slide1-ai-analysis.png',
  '/hero/slide2-smart-council.png',
  '/hero/slide3-stock-analysis.png',
  '/hero/slide4-strategic-reports.png',
  '/hero/slide9-geopolitical.png',
  '/hero/slide6-market-dashboard.png',
  '/hero/slide7-calendar.png',
  '/hero/slide8-community.png',
  '/hero/slide5-operations-room.png',
  '/hero/slide10-telegram.png',
];

/* ── Slide color / path config ── */
const SLIDE_CONFIG = [
  { color: '#3B82F6', primaryPath: '/news', secondaryPath: '/analysis', progressGrad: 'linear-gradient(90deg,#3B82F6,#60A5FA)' },
  { color: '#EF4444', primaryPath: '/signals', secondaryPath: '/advisor', progressGrad: 'linear-gradient(90deg,#EF4444,#F87171)' },
  { color: '#8B5CF6', primaryPath: '/stock-analysis', secondaryPath: '/stock-analysis/screener', progressGrad: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' },
  { color: '#F59E0B', primaryPath: '/strategic-reports', secondaryPath: '/reports', progressGrad: 'linear-gradient(90deg,#F59E0B,#FBBF24)' },
  { color: '#EC4899', primaryPath: '/markets', secondaryPath: '/market-pulse', progressGrad: 'linear-gradient(90deg,#EC4899,#F472B6)' },
  { color: '#10B981', primaryPath: '/markets', secondaryPath: '/calendar', progressGrad: 'linear-gradient(90deg,#10B981,#34D399)' },
  { color: '#F59E0B', primaryPath: '/calendar', secondaryPath: '/signals', progressGrad: 'linear-gradient(90deg,#F59E0B,#FBBF24)' },
  { color: '#A78BFA', primaryPath: '/community', secondaryPath: '/academy', progressGrad: 'linear-gradient(90deg,#A78BFA,#C4B5FD)' },
  { color: '#06B6D4', primaryPath: '/advisor', secondaryPath: '/calendar', progressGrad: 'linear-gradient(90deg,#06B6D4,#22D3EE)' },
  { color: '#3B82F6', primaryPath: '/telegram', secondaryPath: '/telegram', progressGrad: 'linear-gradient(90deg,#3B82F6,#60A5FA)' },
];

/* ── i18n Labels ── */
const LABELS: Record<Locale, Record<string, string>> = {
  ar: {
    /* Slide 1 - AI News */
    s1Tag: '🧠 تحليل AI فوري',
    s1Title: 'ألف تحليل يومياً',
    s1TitleBold: 'مدعوم بالذكاء الاصطناعي',
    s1Desc: 'كل خبر مالي يُحلَّل تلقائياً — تأثيره على السوق، الأصول المتأثرة، 3 سيناريوهات محتملة، وتوصية تداول واضحة في أقل من دقيقتين.',
    s1Stat1V: '650+', s1Stat1L: 'تحليل يومياً',
    s1Stat2V: '50+', s1Stat2L: 'مصدر عالمي',
    s1Stat3V: '<2 د', s1Stat3L: 'من الخبر للتحليل',
    s1Primary: 'اقرأ التحليلات ←', s1Secondary: 'كيف يعمل',
    s1CardIc: 'تحليل AI', s1CardLive: 'مباشر',
    s1CardNum: 'XAU/USD',
    s1CardDesc: 'الذهب يصعد 1.34% بعد بيانات التضخم الأمريكي — 3 سيناريوهات محتملة للجلسة القادمة.',
    s1T1L: 'السعر الحالي', s1T1R: '4,593.00',
    s1T2L: 'التغير', s1T2R: '+60.60 (+1.34%)', s1T2RC: '#10B981',
    s1T3L: 'الاتجاه', s1T3R: '▲ صاعد', s1T3RC: '#10B981',
    s1T4L: 'الثقة', s1T4R: '67%',
    s1Pill1: '3 سيناريوهات', s1Pill2: 'أصول متأثرة', s1Pill3: 'إشارة تداول',

    /* Slide 2 - Smart Council */
    s2Tag: '⚡ المجلس الاستراتيجي الذكي',
    s2Title: '8 نماذج ذكاء اصطناعي',
    s2TitleBold: 'تُصوت على كل توصية',
    s2Desc: 'Claude، Grok، Gemini و5 نماذج متخصصة تُجمع في توصية واحدة عالية الثقة — مع نسبة الإجماع، ومعدل المخاطرة/العائد، ونقاط الدخول والخروج الدقيقة.',
    s2Stat1V: '8', s2Stat1L: 'نماذج AI متخصصة',
    s2Stat2V: '95%', s2Stat2L: 'أعلى إجماع',
    s2Stat3V: 'مباشر', s2Stat3L: 'إجماع حي',
    s2Primary: 'عرض الإشارات ←', s2Secondary: 'كيف يعمل',
    s2CardIc: 'المجلس الذكي', s2CardLive: 'مباشر',
    s2CardNum: '95% شراء',
    s2CardDesc: '8 نماذج اتفقت على إشارة شراء بثقة 95% — مع نقطة دخول، وقف الخسارة، والهدف بمعدل مخاطرة 1:1.67.',
    s2T1L: 'نقطة الدخول', s2T1R: '4,550.00',
    s2T2L: 'وقف الخسارة', s2T2R: '4,480.00', s2T2RC: '#EF4444',
    s2T3L: 'الهدف الأول', s2T3R: '4,650.00', s2T3RC: '#10B981',
    s2T4L: 'نسبة R:R', s2T4R: '1:1.67',
    s2Pill1: 'تصويت إجماعي', s2Pill2: 'R:R محدد', s2Pill3: 'دخول/خروج',

    /* Slide 3 - Stock Analysis */
    s3Tag: '📊 تحليل الأسهم والشركات',
    s3Title: 'تحليل عميق لكل سهم',
    s3TitleBold: 'بالذكاء الاصطناعي فوراً',
    s3Desc: 'SWOT تفصيلي، مؤشرات فنية متقدمة، بيانات مالية شاملة، وتوصية دخول دقيقة — كل شيء في صفحة واحدة لأي سهم أو شركة في العالم. لا حاجة لأكثر من منصة.',
    s3Stat1V: '10,000+', s3Stat1L: 'سهم مغطى عالمياً',
    s3Stat2V: 'فوري', s3Stat2L: 'وقت التحليل',
    s3Stat3V: 'AI', s3Stat3L: 'مدعوم بالذكاء',
    s3Primary: 'ابدأ التحليل ←', s3Secondary: 'تعرف أكثر',
    s3CardIc: 'تحليل الأسهم', s3CardLive: 'مباشر',
    s3CardNum: 'AAPL',
    s3CardDesc: 'تحليل شامل يشمل المؤشرات الفنية، والبيانات المالية، وتوصية دخول دقيقة مبنية على بيانات حية ومحدثة.',
    s3T1L: 'السعر', s3T1R: '195.42',
    s3T2L: 'P/E', s3T2R: '28.5',
    s3T3L: 'RSI', s3T3R: '62.4',
    s3T4L: 'MACD', s3T4R: '▲ صاعد', s3T4RC: '#10B981',
    s3Pill1: 'تحليل فني', s3Pill2: 'بيانات مالية', s3Pill3: 'SWOT',

    /* Slide 4 - Strategic Reports */
    s4Tag: '🛡️ التقارير الاستراتيجية',
    s4Title: 'تقارير معمقة بمستوى',
    s4TitleBold: 'المؤسسات الاستثمارية',
    s4Desc: '8 أقسام شاملة — ملخص تنفيذي، سيناريوهات متعددة، تخصيص محفظة، و20+ مصدر موثق — تُولَّد آلياً في أقل من دقيقة بجودة تنافس أكبر البنوك الاستثمارية.',
    s4Stat1V: '9.5/10', s4Stat1L: 'متوسط الجودة',
    s4Stat2V: '20+', s4Stat2L: 'مصدر لكل تقرير',
    s4Stat3V: '10+', s4Stat3L: 'تقرير يومياً',
    s4Primary: 'اقرأ التقارير ←', s4Secondary: 'مثال تقرير',
    s4CardIc: 'استراتيجي',
    s4CardNum: '9.5/10',
    s4CardDesc: '8 أقسام، 3 آفاق زمنية، جداول تخصيص المحفظة، ومصادر موثقة من Bloomberg وFT وReuters.',
    s4Pill1: '8 أقسام', s4Pill2: 'تخصيص محفظة', s4Pill3: 'عند الطلب',

    /* Slide 5 - Operations Room */
    s9Tag: '🎯 مساعد رؤى — غرفة العمليات',
    s9Title: 'غرفة عمليات المتداول',
    s9TitleBold: 'كل ما تحتاجه في مكان واحد',
    s9Desc: 'الأجندة الاقتصادية، أوقات التداول العالمية، ومؤشر قوة العملات — كل الأدوات التي يحتاجها المتداول اليومي في لوحة تحكم واحدة ذكية.',
    s9Stat1V: '8+', s9Stat1L: 'أحداث يومياً',
    s9Stat2V: '5', s9Stat2L: 'بورصات عالمية',
    s9Stat3V: '10', s9Stat3L: 'عملات مغطاة',
    s9Primary: 'افتح غرفة العمليات ←', s9Secondary: 'استكشف الأدوات',
    s9CardIc: 'غرفة العمليات', s9CardLive: 'مباشر',
    s9CardNum: '5 بورصات',
    s9CardDesc: 'تتبع أوقات فتح وإغلاق البورصات العالمية مع الأحداث الاقتصادية المؤثرة ومؤشر قوة العملات.',
    s9T1L: '🇬🇧 لندن', s9T1R: '08:00–17:00 مفتوحة', s9T1RC: '#10B981',
    s9T2L: '🇺🇸 نيويورك', s9T2R: '13:00–22:00 مفتوحة', s9T2RC: '#10B981',
    s9T3L: '🇯🇵 طوكيو', s9T3R: '00:00–09:00 مغلقة', s9T3RC: 'rgba(255,255,255,.3)',
    s9T4L: '🇸🇦 السعودية', s9T4R: '07:00–12:00 مفتوحة', s9T4RC: '#10B981',
    s9Pill1: 'أوقات التداول', s9Pill2: 'أجندة اقتصادية', s9Pill3: 'قوة العملات',

    /* Slide 6 - Market Dashboard */
    s6Tag: '📊 لوحة الأسواق الحية',
    s6Title: 'تتبع كل الأسواق',
    s6TitleBold: 'في لوحة واحدة متكاملة',
    s6Desc: 'أسعار فورية للذهب والنفط والعملات والعملات الرقمية والمؤشرات العالمية — مع مؤشر الخوف والطمع، وساعات التداول، وأكبر التحركات اليومية.',
    s6Stat1V: '15+', s6Stat1L: 'أصل مالي مغطى',
    s6Stat2V: '24/7', s6Stat2L: 'تحديث مستمر',
    s6Stat3V: '5', s6Stat3L: 'بورصات عالمية',
    s6Primary: 'عرض الأسواق ←', s6Secondary: 'التقويم الاقتصادي',
    s6CardIc: 'الأسواق الحية', s6CardLive: 'مباشر',
    s6CardNum: '49',
    s6CardDesc: 'مؤشر الخوف والطمع — حذر متوسط. توترات جيوسياسية معتدلة مع تأثير محدود على الأسواق.',
    s6FgLeft: 'خوف شديد', s6FgMid: 'محايد', s6FgRight: 'طمع شديد',
    s6T1L: 'الذهب', s6T1R: '4,593 ▲1.34%', s6T1RC: '#10B981',
    s6T2L: 'ناسداك', s6T2R: '30,333 ▲0.36%', s6T2RC: '#10B981',
    s6T3L: 'النفط WTI', s6T3R: '87.36 ▼1.73%', s6T3RC: '#EF4444',
    s6Pill1: 'أسعار حية', s6Pill2: 'مؤشر الخوف', s6Pill3: 'ساعات التداول',

    /* Slide 7 - Economic Calendar */
    s7Tag: '📅 التقويم الاقتصادي',
    s7Title: 'لا تفوّت أي حدث مؤثر',
    s7TitleBold: 'في الأسواق العالمية',
    s7Desc: 'قرارات الفائدة، بيانات التضخم، الوظائف، الناتج المحلي — كل الأحداث المؤثرة مرتبة زمنياً مع التأثير المتوقع والتوقعات السوقية.',
    s7Stat1V: '8+', s7Stat1L: 'أحداث يومياً',
    s7Stat2V: '3', s7Stat2L: 'مستويات تأثير',
    s7Stat3V: 'عالمي', s7Stat3L: 'تغطية شاملة',
    s7Primary: 'عرض التقويم ←', s7Secondary: 'تفعيل التنبيهات',
    s7CardIc: 'الأحداث القادمة', s7CardLive: 'اليوم',
    s7CardNum: 'قرار الفائدة',
    s7CardDesc: 'الحدث الأكثر تأثيراً اليوم — متبقي على الإعلان:',
    s7CdH: 'ساعة', s7CdM: 'دقيقة', s7CdS: 'ثانية',
    s7T1L: '14:30 🇺🇸', s7T1R: 'مؤشر أسعار المستهلكين',
    s7T2L: '15:30 🇺🇸', s7T2R: 'وظائف غير الزراعية',
    s7T3L: '14:30 🇪🇺', s7T3R: 'قرار الفائدة الأوروبي',
    s7Pill1: 'تأثير عالي', s7Pill2: 'توقعات السوق', s7Pill3: 'تنبيهات',

    /* Slide 8 - Community & Academy */
    s8Tag: '💬 المجتمع والتعلم',
    s8Title: 'اعرف السوق وتعلمه',
    s8TitleBold: 'في نفس الوقت',
    s8Desc: 'مؤشرات توجه المتداولين لأهم أزواج العملات، وأكاديمية شاملة تغطي التحليل الفني والأساسي والاقتصاد الكلي — كل شيء بالعربية.',
    s8Stat1V: '4', s8Stat1L: 'أزواج مغطاة',
    s8Stat2V: '3', s8Stat2L: 'مسارات تعليمية',
    s8Stat3V: 'مجاني', s8Stat3L: 'الوصول الأساسي',
    s8Primary: 'استكشف ←', s8Secondary: 'عرض المناهج',
    s8CardIc: 'المجتمع والتعلم', s8CardLive: 'حي',
    s8Mc1Icon: '📊', s8Mc1Title: 'نبض المجتمع', s8Mc1Desc: 'GBP/USD ▲51% شراء',
    s8Mc2Icon: '🎓', s8Mc2Title: 'الأكاديمية', s8Mc2Desc: '3 مسارات تعليمية',
    s8Mc3Icon: '📈', s8Mc3Title: 'P/E Ratio', s8Mc3Desc: 'نسبة السعر للأرباح',
    s8Mc4Icon: '📉', s8Mc4Title: 'RSI', s8Mc4Desc: 'مؤشر القوة النسبية',
    s8Pill1: 'مشاعر السوق', s8Pill2: 'تعلم مجاني', s8Pill3: 'عربي',

    /* Slide 9 - Geopolitical Risk */
    s5Tag: '🌍 مخاطر جيوسياسية',
    s5Title: 'تابع المخاطر العالمية',
    s5TitleBold: 'قبل أن تؤثر على محفظتك',
    s5Desc: 'مؤشر متابعة التوترات الجيوسياسية العالمية مع تقييم التأثير المتوقع على الأسواق المالية والسلع والعملات — تحديث يومي.',
    s5Stat1V: '35', s5Stat1L: 'المستوى الحالي',
    s5Stat2V: 'متوسط', s5Stat2L: 'درجة الخطورة',
    s5Stat3V: 'يومي', s5Stat3L: 'تحديث',
    s5Primary: 'عرض التفاصيل ←', s5Secondary: 'التاريخ',
    s5CardIc: 'المخاطر الجيوسياسية',
    s5CardNum: '35',
    s5CardDesc: 'متوسط — توترات جيوسياسية معتدلة مع تأثير محدود على الأسواق حالياً.',
    s5GrLeft: 'منخفض', s5GrMid: 'متوسط', s5GrRight: 'مرتفع',
    s5T1L: 'الذهب', s5T1R: '4,593 ▲1.34%', s5T1RC: '#10B981',
    s5T2L: 'النفط WTI', s5T2R: '87.36 ▼1.73%', s5T2RC: '#EF4444',
    s5T3L: 'ناسداك', s5T3R: '30,333 ▲0.36%', s5T3RC: '#10B981',
    s5Pill1: 'مخاطر عالمية', s5Pill2: 'تأثير محدود', s5Pill3: 'تحديث يومي',

    /* Slide 10 - Telegram Bot */
    s10Tag: '📱 بوت تيليجرام',
    s10Title: 'الأخبار والتحليلات',
    s10TitleBold: 'تصلك فوراً على تيليجرام',
    s10Desc: 'اشترك مجاناً واحصل على أخبار عاجلة، تحليلات AI لحظية، تنبيهات الأسعار، التقويم الاقتصادي، وملخص يومي — كل شيء في بوت واحد ذكي.',
    s10Stat1V: 'مجاني', s10Stat1L: '100% بدون تكلفة',
    s10Stat2V: 'فوري', s10Stat2L: 'إشعارات لحظية',
    s10Stat3V: '5', s10Stat3L: 'أنواع تنبيهات',
    s10Primary: 'اشترك الآن ←', s10Secondary: 'تعرف على الميزات',
    s10CardIc: 'بوت تيليجرام', s10CardLive: 'نشط',
    s10CardNum: '5 خدمات',
    s10CardDesc: 'بوت ذكي يوفر كل ما تحتاجه من معلومات مالية في مكان واحد — سهل الاستخدام ومجاني بالكامل.',
    s10T1L: '🚨', s10T1R: 'أخبار عاجلة فور النشر',
    s10T2L: '📊', s10T2R: 'تحليلات AI لحظية',
    s10T3L: '💰', s10T3R: 'تنبيهات حركة الأسعار',
    s10T4L: '📅', s10T4R: 'التقويم الاقتصادي',
    s10T5L: '📰', s10T5R: 'ملخص يومي أهم الأحداث',
    s10Pill1: 'مجاني', s10Pill2: 'فوري', s10Pill3: 'سهل الاستخدام',

    brand: 'رؤى Rouaa',
  },
  en: {
    /* Slide 1 */
    s1Tag: '🧠 Instant AI Analysis',
    s1Title: 'A thousand analyses daily',
    s1TitleBold: 'Powered by AI',
    s1Desc: 'Every financial news is analyzed automatically — market impact, affected assets, 3 possible scenarios, and a clear trading recommendation in under 2 minutes.',
    s1Stat1V: '650+', s1Stat1L: 'Daily Analyses',
    s1Stat2V: '50+', s1Stat2L: 'Global Sources',
    s1Stat3V: '<2m', s1Stat3L: 'News to Analysis',
    s1Primary: 'Read Analyses →', s1Secondary: 'How It Works',
    s1CardIc: 'AI Analysis', s1CardLive: 'LIVE',
    s1CardNum: 'XAU/USD',
    s1CardDesc: 'Gold rises 1.34% after US inflation data — 3 possible scenarios for the upcoming session.',
    s1T1L: 'Current Price', s1T1R: '4,593.00',
    s1T2L: 'Change', s1T2R: '+60.60 (+1.34%)', s1T2RC: '#10B981',
    s1T3L: 'Trend', s1T3R: '▲ Bullish', s1T3RC: '#10B981',
    s1T4L: 'Confidence', s1T4R: '67%',
    s1Pill1: '3 Scenarios', s1Pill2: 'Affected Assets', s1Pill3: 'Trade Signal',

    /* Slide 2 */
    s2Tag: '⚡ Smart Strategic Council',
    s2Title: '8 AI models',
    s2TitleBold: 'Vote on every recommendation',
    s2Desc: 'Claude, Grok, Gemini and 5 specialized models combine into one high-confidence recommendation — with consensus ratio, risk/reward rate, and precise entry/exit points.',
    s2Stat1V: '8', s2Stat1L: 'Specialized AI Models',
    s2Stat2V: '95%', s2Stat2L: 'Highest Consensus',
    s2Stat3V: 'Live', s2Stat3L: 'Live Consensus',
    s2Primary: 'View Signals →', s2Secondary: 'How It Works',
    s2CardIc: 'Smart Council', s2CardLive: 'LIVE',
    s2CardNum: '95% Buy',
    s2CardDesc: '8 models agreed on a buy signal with 95% confidence — with entry point, stop loss, and target at 1:1.67 R:R.',
    s2T1L: 'Entry Point', s2T1R: '4,550.00',
    s2T2L: 'Stop Loss', s2T2R: '4,480.00', s2T2RC: '#EF4444',
    s2T3L: 'First Target', s2T3R: '4,650.00', s2T3RC: '#10B981',
    s2T4L: 'R:R Ratio', s2T4R: '1:1.67',
    s2Pill1: 'Consensus Vote', s2Pill2: 'Defined R:R', s2Pill3: 'Entry/Exit',

    /* Slide 3 */
    s3Tag: '📊 Stock & Company Analysis',
    s3Title: 'Deep analysis for every stock',
    s3TitleBold: 'With AI instantly',
    s3Desc: 'Detailed SWOT, advanced technical indicators, comprehensive financial data, and precise entry recommendation — everything on one page for any stock or company worldwide.',
    s3Stat1V: '10,000+', s3Stat1L: 'Global Stocks Covered',
    s3Stat2V: 'Instant', s3Stat2L: 'Analysis Time',
    s3Stat3V: 'AI', s3Stat3L: 'AI Powered',
    s3Primary: 'Start Analysis →', s3Secondary: 'Learn More',
    s3CardIc: 'Stock Analysis', s3CardLive: 'LIVE',
    s3CardNum: 'AAPL',
    s3CardDesc: 'Comprehensive analysis including technical indicators, financial data, and precise entry recommendation based on live, updated data.',
    s3T1L: 'Price', s3T1R: '195.42',
    s3T2L: 'P/E', s3T2R: '28.5',
    s3T3L: 'RSI', s3T3R: '62.4',
    s3T4L: 'MACD', s3T4R: '▲ Bullish', s3T4RC: '#10B981',
    s3Pill1: 'Technical', s3Pill2: 'Financial Data', s3Pill3: 'SWOT',

    /* Slide 4 */
    s4Tag: '🛡️ Strategic Reports',
    s4Title: 'In-depth reports at',
    s4TitleBold: 'Investment Institution Level',
    s4Desc: '8 comprehensive sections — executive summary, multiple scenarios, portfolio allocation, and 20+ cited sources — generated automatically in under a minute at quality rivaling top investment banks.',
    s4Stat1V: '9.5/10', s4Stat1L: 'Avg. Quality',
    s4Stat2V: '20+', s4Stat2L: 'Sources per Report',
    s4Stat3V: '10+', s4Stat3L: 'Daily Reports',
    s4Primary: 'Read Reports →', s4Secondary: 'Sample Report',
    s4CardIc: 'Strategic',
    s4CardNum: '9.5/10',
    s4CardDesc: '8 sections, 3 time horizons, portfolio allocation tables, and cited sources from Bloomberg, FT, and Reuters.',
    s4Pill1: '8 Sections', s4Pill2: 'Portfolio Allocation', s4Pill3: 'On Demand',

    /* Slide 5 */
    s9Tag: "🎯 Ru'aa Assistant — Operations Room",
    s9Title: 'Trader Operations Room',
    s9TitleBold: 'Everything you need in one place',
    s9Desc: 'Economic agenda, global trading hours, and currency strength index — all the tools a daily trader needs in one smart dashboard.',
    s9Stat1V: '8+', s9Stat1L: 'Daily Events',
    s9Stat2V: '5', s9Stat2L: 'Global Exchanges',
    s9Stat3V: '10', s9Stat3L: 'Currencies Covered',
    s9Primary: 'Open Operations Room →', s9Secondary: 'Explore Tools',
    s9CardIc: 'Operations Room', s9CardLive: 'LIVE',
    s9CardNum: '5 Exchanges',
    s9CardDesc: 'Track open/close times of global exchanges along with impactful economic events and currency strength index.',
    s9T1L: '🇬🇧 London', s9T1R: '08:00–17:00 Open', s9T1RC: '#10B981',
    s9T2L: '🇺🇸 New York', s9T2R: '13:00–22:00 Open', s9T2RC: '#10B981',
    s9T3L: '🇯🇵 Tokyo', s9T3R: '00:00–09:00 Closed', s9T3RC: 'rgba(255,255,255,.3)',
    s9T4L: '🇸🇦 Saudi', s9T4R: '07:00–12:00 Open', s9T4RC: '#10B981',
    s9Pill1: 'Trading Hours', s9Pill2: 'Economic Agenda', s9Pill3: 'Currency Strength',

    /* Slide 6 */
    s6Tag: '📊 Live Market Dashboard',
    s6Title: 'Track all markets',
    s6TitleBold: 'In one integrated dashboard',
    s6Desc: 'Real-time prices for gold, oil, forex, crypto and global indices — with Fear & Greed index, trading hours, and biggest daily movers.',
    s6Stat1V: '15+', s6Stat1L: 'Assets Covered',
    s6Stat2V: '24/7', s6Stat2L: 'Continuous Updates',
    s6Stat3V: '5', s6Stat3L: 'Global Exchanges',
    s6Primary: 'View Markets →', s6Secondary: 'Economic Calendar',
    s6CardIc: 'Live Markets', s6CardLive: 'LIVE',
    s6CardNum: '49',
    s6CardDesc: 'Fear & Greed Index — Moderate Caution. Moderate geopolitical tensions with limited market impact.',
    s6FgLeft: 'Extreme Fear', s6FgMid: 'Neutral', s6FgRight: 'Extreme Greed',
    s6T1L: 'Gold', s6T1R: '4,593 ▲1.34%', s6T1RC: '#10B981',
    s6T2L: 'NASDAQ', s6T2R: '30,333 ▲0.36%', s6T2RC: '#10B981',
    s6T3L: 'WTI Oil', s6T3R: '87.36 ▼1.73%', s6T3RC: '#EF4444',
    s6Pill1: 'Live Prices', s6Pill2: 'Fear Index', s6Pill3: 'Trading Hours',

    /* Slide 7 */
    s7Tag: '📅 Economic Calendar',
    s7Title: "Don't miss any impactful event",
    s7TitleBold: 'In global markets',
    s7Desc: 'Interest rate decisions, inflation data, employment, GDP — all impactful events chronologically with expected impact and market forecasts.',
    s7Stat1V: '8+', s7Stat1L: 'Daily Events',
    s7Stat2V: '3', s7Stat2L: 'Impact Levels',
    s7Stat3V: 'Global', s7Stat3L: 'Coverage',
    s7Primary: 'View Calendar →', s7Secondary: 'Enable Alerts',
    s7CardIc: 'Upcoming Events', s7CardLive: 'Today',
    s7CardNum: 'Interest Rate Decision',
    s7CardDesc: 'Most impactful event today — time until announcement:',
    s7CdH: 'Hours', s7CdM: 'Minutes', s7CdS: 'Seconds',
    s7T1L: '14:30 🇺🇸', s7T1R: 'CPI',
    s7T2L: '15:30 🇺🇸', s7T2R: 'Non-Farm Payrolls',
    s7T3L: '14:30 🇪🇺', s7T3R: 'ECB Rate Decision',
    s7Pill1: 'High Impact', s7Pill2: 'Market Forecasts', s7Pill3: 'Alerts',

    /* Slide 8 */
    s8Tag: '💬 Community & Learning',
    s8Title: 'Know the market and learn it',
    s8TitleBold: 'At the same time',
    s8Desc: 'Trader sentiment indicators for major currency pairs, and a comprehensive academy covering technical, fundamental, and macroeconomic analysis.',
    s8Stat1V: '4', s8Stat1L: 'Pairs Covered',
    s8Stat2V: '3', s8Stat2L: 'Learning Paths',
    s8Stat3V: 'Free', s8Stat3L: 'Basic Access',
    s8Primary: 'Explore →', s8Secondary: 'View Curriculum',
    s8CardIc: 'Community & Learning', s8CardLive: 'Active',
    s8Mc1Icon: '📊', s8Mc1Title: 'Community Pulse', s8Mc1Desc: 'GBP/USD ▲51% Buy',
    s8Mc2Icon: '🎓', s8Mc2Title: 'Academy', s8Mc2Desc: '3 learning paths',
    s8Mc3Icon: '📈', s8Mc3Title: 'P/E Ratio', s8Mc3Desc: 'Price-to-Earnings',
    s8Mc4Icon: '📉', s8Mc4Title: 'RSI', s8Mc4Desc: 'Relative Strength Index',
    s8Pill1: 'Market Sentiment', s8Pill2: 'Free Learning', s8Pill3: 'English',

    /* Slide 9 */
    s5Tag: '🌍 Geopolitical Risk',
    s5Title: 'Track global risks',
    s5TitleBold: 'Before they affect your portfolio',
    s5Desc: 'Index tracking global geopolitical tensions with expected impact assessment on financial markets, commodities, and currencies — daily update.',
    s5Stat1V: '35', s5Stat1L: 'Current Level',
    s5Stat2V: 'Medium', s5Stat2L: 'Risk Degree',
    s5Stat3V: 'Daily', s5Stat3L: 'Update',
    s5Primary: 'View Details →', s5Secondary: 'History',
    s5CardIc: 'Geopolitical Risk',
    s5CardNum: '35',
    s5CardDesc: 'Medium — moderate geopolitical tensions with limited market impact currently.',
    s5GrLeft: 'Low', s5GrMid: 'Medium', s5GrRight: 'High',
    s5T1L: 'Gold', s5T1R: '4,593 ▲1.34%', s5T1RC: '#10B981',
    s5T2L: 'WTI Oil', s5T2R: '87.36 ▼1.73%', s5T2RC: '#EF4444',
    s5T3L: 'NASDAQ', s5T3R: '30,333 ▲0.36%', s5T3RC: '#10B981',
    s5Pill1: 'Global Risks', s5Pill2: 'Limited Impact', s5Pill3: 'Daily Update',

    /* Slide 10 */
    s10Tag: '📱 Telegram Bot',
    s10Title: 'News & Analysis',
    s10TitleBold: 'Reaches you instantly on Telegram',
    s10Desc: 'Subscribe for free and get breaking news, instant AI analysis, price alerts, economic calendar, and daily summary — everything in one smart bot.',
    s10Stat1V: 'Free', s10Stat1L: '100% No Cost',
    s10Stat2V: 'Instant', s10Stat2L: 'Instant Notifications',
    s10Stat3V: '5', s10Stat3L: 'Alert Types',
    s10Primary: 'Subscribe Now →', s10Secondary: 'Explore Features',
    s10CardIc: 'Telegram Bot', s10CardLive: 'Active',
    s10CardNum: '5 Services',
    s10CardDesc: 'A smart bot providing all the financial information you need in one place — easy to use and completely free.',
    s10T1L: '🚨', s10T1R: 'Breaking News Alerts',
    s10T2L: '📊', s10T2R: 'Instant AI Analysis',
    s10T3L: '💰', s10T3R: 'Price Movement Alerts',
    s10T4L: '📅', s10T4R: 'Economic Calendar',
    s10T5L: '📰', s10T5R: 'Daily Summary',
    s10Pill1: 'Free', s10Pill2: 'Instant', s10Pill3: 'Easy to Use',

    brand: 'Rouaa',
  },
  es: {
    /* Slide 1 */
    s1Tag: '🧠 Análisis IA Instantáneo',
    s1Title: 'Mil análisis diarios',
    s1TitleBold: 'Impulsados por IA',
    s1Desc: 'Cada noticia financiera se analiza automáticamente — impacto en el mercado, activos afectados, 3 escenarios posibles y una recomendación de trading clara en menos de 2 minutos.',
    s1Stat1V: '650+', s1Stat1L: 'Análisis diarios',
    s1Stat2V: '50+', s1Stat2L: 'Fuentes globales',
    s1Stat3V: '<2m', s1Stat3L: 'De noticia a análisis',
    s1Primary: 'Leer Análisis →', s1Secondary: 'Cómo Funciona',
    s1CardIc: 'Análisis IA', s1CardLive: 'EN VIVO',
    s1CardNum: 'XAU/USD',
    s1CardDesc: 'El oro sube 1.34% tras datos de inflación estadounidense — 3 escenarios posibles para la próxima sesión.',
    s1T1L: 'Precio Actual', s1T1R: '4,593.00',
    s1T2L: 'Cambio', s1T2R: '+60.60 (+1.34%)', s1T2RC: '#10B981',
    s1T3L: 'Tendencia', s1T3R: '▲ Alcista', s1T3RC: '#10B981',
    s1T4L: 'Confianza', s1T4R: '67%',
    s1Pill1: '3 Escenarios', s1Pill2: 'Activos Afectados', s1Pill3: 'Señal de Trading',

    /* Slide 2 */
    s2Tag: '⚡ Consejo Estratégico Inteligente',
    s2Title: '8 modelos de IA',
    s2TitleBold: 'Votan en cada recomendación',
    s2Desc: 'Claude, Grok, Gemini y 5 modelos especializados se combinan en una recomendación de alta confianza — con ratio de consenso, tasa riesgo/recompensa y puntos de entrada/salida precisos.',
    s2Stat1V: '8', s2Stat1L: 'Modelos IA Especializados',
    s2Stat2V: '95%', s2Stat2L: 'Consenso Más Alto',
    s2Stat3V: 'En vivo', s2Stat3L: 'Consenso en Vivo',
    s2Primary: 'Ver Señales →', s2Secondary: 'Cómo Funciona',
    s2CardIc: 'Consejo Inteligente', s2CardLive: 'EN VIVO',
    s2CardNum: '95% Compra',
    s2CardDesc: '8 modelos acordaron señal de compra con 95% de confianza — con punto de entrada, stop loss y objetivo a ratio R:R de 1:1.67.',
    s2T1L: 'Punto de Entrada', s2T1R: '4,550.00',
    s2T2L: 'Stop Loss', s2T2R: '4,480.00', s2T2RC: '#EF4444',
    s2T3L: 'Primer Objetivo', s2T3R: '4,650.00', s2T3RC: '#10B981',
    s2T4L: 'Ratio R:R', s2T4R: '1:1.67',
    s2Pill1: 'Voto de Consenso', s2Pill2: 'R:R Definido', s2Pill3: 'Entrada/Salida',

    /* Slide 3 */
    s3Tag: '📊 Análisis de Acciones y Empresas',
    s3Title: 'Análisis profundo de cada acción',
    s3TitleBold: 'Con IA al instante',
    s3Desc: 'SWOT detallado, indicadores técnicos avanzados, datos financieros completos y recomendación de entrada precisa — todo en una página para cualquier acción o empresa del mundo.',
    s3Stat1V: '10,000+', s3Stat1L: 'Acciones Globales Cubiertas',
    s3Stat2V: 'Instantáneo', s3Stat2L: 'Tiempo de Análisis',
    s3Stat3V: 'IA', s3Stat3L: 'Impulsado por IA',
    s3Primary: 'Iniciar Análisis →', s3Secondary: 'Más Información',
    s3CardIc: 'Análisis de Acciones', s3CardLive: 'EN VIVO',
    s3CardNum: 'AAPL',
    s3CardDesc: 'Análisis completo incluyendo indicadores técnicos, datos financieros y recomendación de entrada precisa basada en datos en vivo y actualizados.',
    s3T1L: 'Precio', s3T1R: '195.42',
    s3T2L: 'P/E', s3T2R: '28.5',
    s3T3L: 'RSI', s3T3R: '62.4',
    s3T4L: 'MACD', s3T4R: '▲ Alcista', s3T4RC: '#10B981',
    s3Pill1: 'Técnico', s3Pill2: 'Datos Financieros', s3Pill3: 'SWOT',

    /* Slide 4 */
    s4Tag: '🛡️ Informes Estratégicos',
    s4Title: 'Informes profundos a nivel de',
    s4TitleBold: 'Instituciones de Inversión',
    s4Desc: '8 secciones completas — resumen ejecutivo, escenarios múltiples, asignación de portafolio y 20+ fuentes citadas — generados automáticamente en menos de un minuto con calidad que rivaliza con los mejores bancos de inversión.',
    s4Stat1V: '9.5/10', s4Stat1L: 'Calidad Promedio',
    s4Stat2V: '20+', s4Stat2L: 'Fuentes por Informe',
    s4Stat3V: '10+', s4Stat3L: 'Informes Diarios',
    s4Primary: 'Leer Informes →', s4Secondary: 'Informe de Ejemplo',
    s4CardIc: 'Estratégico',
    s4CardNum: '9.5/10',
    s4CardDesc: '8 secciones, 3 horizontes temporales, tablas de asignación de portafolio y fuentes citadas de Bloomberg, FT y Reuters.',
    s4Pill1: '8 Secciones', s4Pill2: 'Asignación de Portafolio', s4Pill3: 'Bajo Demanda',

    /* Slide 5 */
    s9Tag: "🎯 Asistente Ru'aa — Sala de Operaciones",
    s9Title: 'Sala de Operaciones del Trader',
    s9TitleBold: 'Todo lo que necesitas en un solo lugar',
    s9Desc: 'Agenda económica, horarios de trading globales e índice de fuerza de divisas — todas las herramientas que necesita el trader diario en un solo panel inteligente.',
    s9Stat1V: '8+', s9Stat1L: 'Eventos Diarios',
    s9Stat2V: '5', s9Stat2L: 'Bolsas Globales',
    s9Stat3V: '10', s9Stat3L: 'Divisas Cubiertas',
    s9Primary: 'Abrir Sala de Operaciones →', s9Secondary: 'Explorar Herramientas',
    s9CardIc: 'Sala de Operaciones', s9CardLive: 'EN VIVO',
    s9CardNum: '5 Bolsas',
    s9CardDesc: 'Rastrea horarios de apertura/cierre de bolsas globales junto con eventos económicos impactantes e índice de fuerza de divisas.',
    s9T1L: '🇬🇧 Londres', s9T1R: '08:00–17:00 Abierta', s9T1RC: '#10B981',
    s9T2L: '🇺🇸 Nueva York', s9T2R: '13:00–22:00 Abierta', s9T2RC: '#10B981',
    s9T3L: '🇯🇵 Tokio', s9T3R: '00:00–09:00 Cerrada', s9T3RC: 'rgba(255,255,255,.3)',
    s9T4L: '🇸🇦 Arabia', s9T4R: '07:00–12:00 Abierta', s9T4RC: '#10B981',
    s9Pill1: 'Horarios de Trading', s9Pill2: 'Agenda Económica', s9Pill3: 'Fuerza de Divisas',

    /* Slide 6 */
    s6Tag: '📊 Panel de Mercados en Vivo',
    s6Title: 'Rastrea todos los mercados',
    s6TitleBold: 'En un panel integrado',
    s6Desc: 'Precios en tiempo real para oro, petróleo, forex, criptomonedas e índices globales — con índice de Miedo y Codicia, horarios de trading y mayores movimientos del día.',
    s6Stat1V: '15+', s6Stat1L: 'Activos Cubiertos',
    s6Stat2V: '24/7', s6Stat2L: 'Actualizaciones Continuas',
    s6Stat3V: '5', s6Stat3L: 'Bolsas Globales',
    s6Primary: 'Ver Mercados →', s6Secondary: 'Calendario Económico',
    s6CardIc: 'Mercados en Vivo', s6CardLive: 'EN VIVO',
    s6CardNum: '49',
    s6CardDesc: 'Índice de Miedo y Codicia — Precaución Moderada. Tensiones geopolíticas moderadas con impacto limitado en los mercados.',
    s6FgLeft: 'Miedo Extremo', s6FgMid: 'Neutral', s6FgRight: 'Codicia Extrema',
    s6T1L: 'Oro', s6T1R: '4,593 ▲1.34%', s6T1RC: '#10B981',
    s6T2L: 'NASDAQ', s6T2R: '30,333 ▲0.36%', s6T2RC: '#10B981',
    s6T3L: 'Petróleo WTI', s6T3R: '87.36 ▼1.73%', s6T3RC: '#EF4444',
    s6Pill1: 'Precios en Vivo', s6Pill2: 'Índice de Miedo', s6Pill3: 'Horarios de Trading',

    /* Slide 7 */
    s7Tag: '📅 Calendario Económico',
    s7Title: 'No te pierdas ningún evento impactante',
    s7TitleBold: 'En los mercados globales',
    s7Desc: 'Decisiones de tasas, datos de inflación, empleo, PIB — todos los eventos impactantes ordenados cronológicamente con impacto esperado y pronósticos de mercado.',
    s7Stat1V: '8+', s7Stat1L: 'Eventos Diarios',
    s7Stat2V: '3', s7Stat2L: 'Niveles de Impacto',
    s7Stat3V: 'Global', s7Stat3L: 'Cobertura',
    s7Primary: 'Ver Calendario →', s7Secondary: 'Activar Alertas',
    s7CardIc: 'Próximos Eventos', s7CardLive: 'Hoy',
    s7CardNum: 'Decisión de Tasa',
    s7CardDesc: 'El evento más impactante de hoy — tiempo restante para el anuncio:',
    s7CdH: 'Horas', s7CdM: 'Minutos', s7CdS: 'Segundos',
    s7T1L: '14:30 🇺🇸', s7T1R: 'IPC',
    s7T2L: '15:30 🇺🇸', s7T2R: 'Nóminas No Agrícolas',
    s7T3L: '14:30 🇪🇺', s7T3R: 'Decisión BCE',
    s7Pill1: 'Alto Impacto', s7Pill2: 'Pronósticos de Mercado', s7Pill3: 'Alertas',

    /* Slide 8 */
    s8Tag: '💬 Comunidad y Aprendizaje',
    s8Title: 'Conoce el mercado y apréndelo',
    s8TitleBold: 'Al mismo tiempo',
    s8Desc: 'Indicadores de sentimiento de traders para los principales pares de divisas y una academia completa que cubre análisis técnico, fundamental y macroeconómico.',
    s8Stat1V: '4', s8Stat1L: 'Pares Cubiertos',
    s8Stat2V: '3', s8Stat2L: 'Rutas de Aprendizaje',
    s8Stat3V: 'Gratis', s8Stat3L: 'Acceso Básico',
    s8Primary: 'Explorar →', s8Secondary: 'Ver Currículo',
    s8CardIc: 'Comunidad y Aprendizaje', s8CardLive: 'Activo',
    s8Mc1Icon: '📊', s8Mc1Title: 'Pulso de la Comunidad', s8Mc1Desc: 'GBP/USD ▲51% Compra',
    s8Mc2Icon: '🎓', s8Mc2Title: 'Academia', s8Mc2Desc: '3 rutas de aprendizaje',
    s8Mc3Icon: '📈', s8Mc3Title: 'Ratio P/E', s8Mc3Desc: 'Precio/Beneficio',
    s8Mc4Icon: '📉', s8Mc4Title: 'RSI', s8Mc4Desc: 'Índice de Fuerza Relativa',
    s8Pill1: 'Sentimiento del Mercado', s8Pill2: 'Aprendizaje Gratis', s8Pill3: 'Español',

    /* Slide 9 */
    s5Tag: '🌍 Riesgo Geopolítico',
    s5Title: 'Rastrea los riesgos globales',
    s5TitleBold: 'Antes de que afecten tu portafolio',
    s5Desc: 'Índice de seguimiento de tensiones geopolíticas globales con evaluación del impacto esperado en mercados financieros, materias primas y divisas — actualización diaria.',
    s5Stat1V: '35', s5Stat1L: 'Nivel Actual',
    s5Stat2V: 'Medio', s5Stat2L: 'Grado de Riesgo',
    s5Stat3V: 'Diario', s5Stat3L: 'Actualización',
    s5Primary: 'Ver Detalles →', s5Secondary: 'Historial',
    s5CardIc: 'Riesgo Geopolítico',
    s5CardNum: '35',
    s5CardDesc: 'Medio — tensiones geopolíticas moderadas con impacto limitado en los mercados actualmente.',
    s5GrLeft: 'Bajo', s5GrMid: 'Medio', s5GrRight: 'Alto',
    s5T1L: 'Oro', s5T1R: '4,593 ▲1.34%', s5T1RC: '#10B981',
    s5T2L: 'Petróleo WTI', s5T2R: '87.36 ▼1.73%', s5T2RC: '#EF4444',
    s5T3L: 'NASDAQ', s5T3R: '30,333 ▲0.36%', s5T3RC: '#10B981',
    s5Pill1: 'Riesgos Globales', s5Pill2: 'Impacto Limitado', s5Pill3: 'Actualización Diaria',

    /* Slide 10 */
    s10Tag: '📱 Bot de Telegram',
    s10Title: 'Noticias y Análisis',
    s10TitleBold: 'Te llegan al instante en Telegram',
    s10Desc: 'Suscríbete gratis y recibe noticias urgentes, análisis IA instantáneos, alertas de precios, calendario económico y resumen diario — todo en un solo bot inteligente.',
    s10Stat1V: 'Gratis', s10Stat1L: '100% Sin Costo',
    s10Stat2V: 'Instantáneo', s10Stat2L: 'Notificaciones Instantáneas',
    s10Stat3V: '5', s10Stat3L: 'Tipos de Alertas',
    s10Primary: 'Suscribirse Ahora →', s10Secondary: 'Explorar Funciones',
    s10CardIc: 'Bot de Telegram', s10CardLive: 'Activo',
    s10CardNum: '5 Servicios',
    s10CardDesc: 'Un bot inteligente que proporciona toda la información financiera que necesitas en un solo lugar — fácil de usar y completamente gratis.',
    s10T1L: '🚨', s10T1R: 'Alertas de Noticias Urgentes',
    s10T2L: '📊', s10T2R: 'Análisis IA Instantáneo',
    s10T3L: '💰', s10T3R: 'Alertas de Movimiento de Precios',
    s10T4L: '📅', s10T4R: 'Calendario Económico',
    s10T5L: '📰', s10T5R: 'Resumen Diario',
    s10Pill1: 'Gratis', s10Pill2: 'Instantáneo', s10Pill3: 'Fácil de Usar',

    brand: 'Rouaa',
  },
  tr: {
    /* Slide 1 */
    s1Tag: '🧠 Anında AI Analizi',
    s1Title: 'Günde bin analiz',
    s1TitleBold: 'Yapay Zeka Destekli',
    s1Desc: 'Her finans haberi otomatik olarak analiz edilir — piyasa etkisi, etkilenen varlıklar, 3 olası senaryo ve 2 dakikadan kısa sürede net bir işlem önerisi.',
    s1Stat1V: '650+', s1Stat1L: 'Günlük Analiz',
    s1Stat2V: '50+', s1Stat2L: 'Küresel Kaynak',
    s1Stat3V: '<2dk', s1Stat3L: 'Haberdan Analize',
    s1Primary: 'Analizleri Oku →', s1Secondary: 'Nasıl Çalışır',
    s1CardIc: 'AI Analizi', s1CardLive: 'CANLI',
    s1CardNum: 'XAU/USD',
    s1CardDesc: 'Altın ABD enflasyon verilerinin ardından %1.34 yükseliyor — yaklaşan oturum için 3 olası senaryo.',
    s1T1L: 'Mevcut Fiyat', s1T1R: '4.593,00',
    s1T2L: 'Değişim', s1T2R: '+60,60 (+%1.34)', s1T2RC: '#10B981',
    s1T3L: 'Trend', s1T3R: '▲ Yükseliş', s1T3RC: '#10B981',
    s1T4L: 'Güven', s1T4R: '%67',
    s1Pill1: '3 Senaryo', s1Pill2: 'Etkilenen Varlıklar', s1Pill3: 'İşlem Sinyali',

    /* Slide 2 */
    s2Tag: '⚡ Akıllı Stratejik Konsey',
    s2Title: '8 yapay zeka modeli',
    s2TitleBold: 'Her öneriye oy veriyor',
    s2Desc: 'Claude, Grok, Gemini ve 5 uzman model tek bir yüksek güvenli öneride birleşiyor — konsensüs oranı, risk/ödül oranı ve kesin giriş/çıkış noktalarıyla.',
    s2Stat1V: '8', s2Stat1L: 'Uzman AI Modeli',
    s2Stat2V: '%95', s2Stat2L: 'En Yüksek Konsensüs',
    s2Stat3V: 'Canlı', s2Stat3L: 'Canlı Konsensüs',
    s2Primary: 'Sinyalleri Görüntüle →', s2Secondary: 'Nasıl Çalışır',
    s2CardIc: 'Akıllı Konsey', s2CardLive: 'CANLI',
    s2CardNum: '%95 Al',
    s2CardDesc: '8 model %95 güvenle alım sinyalinde anlaştı — giriş noktası, zarar durdurma ve 1:1.67 R:R hedefiyle.',
    s2T1L: 'Giriş Noktası', s2T1R: '4.550,00',
    s2T2L: 'Zarar Durdurma', s2T2R: '4.480,00', s2T2RC: '#EF4444',
    s2T3L: 'İlk Hedef', s2T3R: '4.650,00', s2T3RC: '#10B981',
    s2T4L: 'R:R Oranı', s2T4R: '1:1.67',
    s2Pill1: 'Konsensüs Oyu', s2Pill2: 'Tanımlı R:R', s2Pill3: 'Giriş/Çıkış',

    /* Slide 3 */
    s3Tag: '📊 Hisse ve Şirket Analizi',
    s3Title: 'Her hisse için derin analiz',
    s3TitleBold: 'AI ile anında',
    s3Desc: 'Detaylı SWOT, gelişmiş teknik göstergeler, kapsamlı finansal veriler ve kesin giriş önerisi — dünya çapında herhangi bir hisse için tek sayfada.',
    s3Stat1V: '10.000+', s3Stat1L: 'Kapsanan Küresel Hisse',
    s3Stat2V: 'Anında', s3Stat2L: 'Analiz Süresi',
    s3Stat3V: 'AI', s3Stat3L: 'AI Destekli',
    s3Primary: 'Analize Başla →', s3Secondary: 'Daha Fazla Bilgi',
    s3CardIc: 'Hisse Analizi', s3CardLive: 'CANLI',
    s3CardNum: 'AAPL',
    s3CardDesc: 'Teknik göstergeler, finansal veriler ve canlı güncel verilere dayalı kesin giriş önerisi içeren kapsamlı analiz.',
    s3T1L: 'Fiyat', s3T1R: '195,42',
    s3T2L: 'F/K', s3T2R: '28,5',
    s3T3L: 'RSI', s3T3R: '62,4',
    s3T4L: 'MACD', s3T4R: '▲ Yükseliş', s3T4RC: '#10B981',
    s3Pill1: 'Teknik', s3Pill2: 'Finansal Veri', s3Pill3: 'SWOT',

    /* Slide 4 */
    s4Tag: '🛡️ Stratejik Raporlar',
    s4Title: 'Kurumsal düzeyde',
    s4TitleBold: 'Derinlemesine raporlar',
    s4Desc: '8 kapsamlı bölüm — yönetici özeti, çoklu senaryolar, portföy tahsisi ve 20+ kaynaklı alıntı — bir dakikanın altında otomatik üretilen kalite.',
    s4Stat1V: '9.5/10', s4Stat1L: 'Ort. Kalite',
    s4Stat2V: '20+', s4Stat2L: 'Rapor Başına Kaynak',
    s4Stat3V: '10+', s4Stat3L: 'Günlük Rapor',
    s4Primary: 'Raporları Oku →', s4Secondary: 'Örnek Rapor',
    s4CardIc: 'Stratejik',
    s4CardNum: '9.5/10',
    s4CardDesc: '8 bölüm, 3 zaman ufku, portföy tahsis tabloları ve Bloomberg, FT, Reuters kaynakları.',
    s4Pill1: '8 Bölüm', s4Pill2: 'Portföy Tahsisi', s4Pill3: 'İsteğe Bağlı',

    /* Slide 5 */
    s9Tag: '🎯 Ru\'aa Asistanı — Operasyon Odası',
    s9Title: 'Trader Operasyon Odası',
    s9TitleBold: 'İhtiyacınız olan her şey tek yerde',
    s9Desc: 'Ekonomik ajanda, küresel işlem saatleri ve para birimi güç indeksi — günlük traderın ihtiyaç duyduğu tüm araçlar tek akıllı panelde.',
    s9Stat1V: '8+', s9Stat1L: 'Günlük Olay',
    s9Stat2V: '5', s9Stat2L: 'Küresel Borsa',
    s9Stat3V: '10', s9Stat3L: 'Kapsanan Para Birimi',
    s9Primary: 'Operasyon Odasını Aç →', s9Secondary: 'Araçları Keşfet',
    s9CardIc: 'Operasyon Odası', s9CardLive: 'CANLI',
    s9CardNum: '5 Borsa',
    s9CardDesc: 'Küresel borsaların açılış/kapanış saatlerini, etkili ekonomik olayları ve para birimi güç indeksini takip edin.',
    s9T1L: '🇬🇧 Londra', s9T1R: '08:00–17:00 Açık', s9T1RC: '#10B981',
    s9T2L: '🇺🇸 New York', s9T2R: '13:00–22:00 Açık', s9T2RC: '#10B981',
    s9T3L: '🇯🇵 Tokyo', s9T3R: '00:00–09:00 Kapalı', s9T3RC: 'rgba(255,255,255,.3)',
    s9T4L: '🇸🇦 Suudi', s9T4R: '07:00–12:00 Açık', s9T4RC: '#10B981',
    s9Pill1: 'İşlem Saatleri', s9Pill2: 'Ekonomik Ajanda', s9Pill3: 'Para Gücü',

    /* Slide 6 */
    s6Tag: '📊 Canlı Piyasa Paneli',
    s6Title: 'Tüm piyasaları takip edin',
    s6TitleBold: 'Tek entegre panelde',
    s6Desc: 'Altın, petrol, döviz, kripto ve küresel endeksler için anlık fiyatlar — Korku & Açgözlülük indeksi, işlem saatleri ve günün en büyük hareketleriyle.',
    s6Stat1V: '15+', s6Stat1L: 'Kapsanan Varlık',
    s6Stat2V: '7/24', s6Stat2L: 'Sürekli Güncelleme',
    s6Stat3V: '5', s6Stat3L: 'Küresel Borsa',
    s6Primary: 'Piyasaları Görüntüle →', s6Secondary: 'Ekonomik Takvim',
    s6CardIc: 'Canlı Piyasalar', s6CardLive: 'CANLI',
    s6CardNum: '49',
    s6CardDesc: 'Korku & Açgözlülük İndeksi — Orta Dikkat. Orta düzey jeopolitik gerilimler, piyasa üzerinde sınırlı etki.',
    s6FgLeft: 'Aşırı Korku', s6FgMid: 'Nötr', s6FgRight: 'Aşırı Açgözlülük',
    s6T1L: 'Altın', s6T1R: '4.593 ▲%1.34', s6T1RC: '#10B981',
    s6T2L: 'NASDAQ', s6T2R: '30.333 ▲%0.36', s6T2RC: '#10B981',
    s6T3L: 'WTI Petrol', s6T3R: '87,36 ▼%1.73', s6T3RC: '#EF4444',
    s6Pill1: 'Canlı Fiyatlar', s6Pill2: 'Korku İndeksi', s6Pill3: 'İşlem Saatleri',

    /* Slide 7 */
    s7Tag: '📅 Ekonomik Takvim',
    s7Title: 'Hiçbir etkili olayı kaçırmayın',
    s7TitleBold: 'Küresel piyasalarda',
    s7Desc: 'Faiz kararları, enflasyon verileri, istihdam, GSYH — tüm etkili olaylar beklenen etki ve piyasa tahminleriyle kronolojik sırayla.',
    s7Stat1V: '8+', s7Stat1L: 'Günlük Olay',
    s7Stat2V: '3', s7Stat2L: 'Etki Seviyesi',
    s7Stat3V: 'Küresel', s7Stat3L: 'Kapsama',
    s7Primary: 'Takvimi Görüntüle →', s7Secondary: 'Uyarıları Etkinleştir',
    s7CardIc: 'Yaklaşan Olaylar', s7CardLive: 'Bugün',
    s7CardNum: 'Faiz Kararı',
    s7CardDesc: 'Bugünün en etkili olayı — duyuru zamanına kadar:',
    s7CdH: 'Saat', s7CdM: 'Dakika', s7CdS: 'Saniye',
    s7T1L: '14:30 🇺🇸', s7T1R: 'TÜFE',
    s7T2L: '15:30 🇺🇸', s7T2R: 'Tarım Dışı İstihdam',
    s7T3L: '14:30 🇪🇺', s7T3R: 'ECB Faiz Kararı',
    s7Pill1: 'Yüksek Etki', s7Pill2: 'Piyasa Tahminleri', s7Pill3: 'Uyarılar',

    /* Slide 8 */
    s8Tag: '💬 Topluluk ve Öğrenme',
    s8Title: 'Piyasayı tanıyın ve öğrenin',
    s8TitleBold: 'Aynı anda',
    s8Desc: 'Ana döviz çiftleri için trader duygu göstergeleri ve teknik, temel ve makroekonomik analizi kapsayan kapsamlı akademi.',
    s8Stat1V: '4', s8Stat1L: 'Kapsanan Çift',
    s8Stat2V: '3', s8Stat2L: 'Öğrenme Yolu',
    s8Stat3V: 'Ücretsiz', s8Stat3L: 'Temel Erişim',
    s8Primary: 'Keşfet →', s8Secondary: 'Müfredatı Görüntüle',
    s8CardIc: 'Topluluk ve Öğrenme', s8CardLive: 'Aktif',
    s8Mc1Icon: '📊', s8Mc1Title: 'Topluluk Nabzı', s8Mc1Desc: 'GBP/USD ▲%51 Al',
    s8Mc2Icon: '🎓', s8Mc2Title: 'Akademi', s8Mc2Desc: '3 öğrenme yolu',
    s8Mc3Icon: '📈', s8Mc3Title: 'F/K Oranı', s8Mc3Desc: 'Fiyat/Kazanç',
    s8Mc4Icon: '📉', s8Mc4Title: 'RSI', s8Mc4Desc: 'Göreceli Güç İndeksi',
    s8Pill1: 'Piyasa Duygusu', s8Pill2: 'Ücretsiz Öğrenme', s8Pill3: 'Türkçe',

    /* Slide 9 */
    s5Tag: '🌍 Jeopolitik Risk',
    s5Title: 'Küresel riskleri takip edin',
    s5TitleBold: 'Portföyünüzü etkilemeden önce',
    s5Desc: 'Finansal piyasalar, emtia ve para birimleri üzerinde beklenen etki değerlendirmesiyle küresel jeopolitik gerilimleri takip indeksi — günlük güncelleme.',
    s5Stat1V: '35', s5Stat1L: 'Mevcut Seviye',
    s5Stat2V: 'Orta', s5Stat2L: 'Risk Derecesi',
    s5Stat3V: 'Günlük', s5Stat3L: 'Güncelleme',
    s5Primary: 'Detayları Görüntüle →', s5Secondary: 'Geçmiş',
    s5CardIc: 'Jeopolitik Risk',
    s5CardNum: '35',
    s5CardDesc: 'Orta — halihazırda piyasa üzerinde sınırlı etkisi olan orta düzey jeopolitik gerilimler.',
    s5GrLeft: 'Düşük', s5GrMid: 'Orta', s5GrRight: 'Yüksek',
    s5T1L: 'Altın', s5T1R: '4.593 ▲%1.34', s5T1RC: '#10B981',
    s5T2L: 'WTI Petrol', s5T2R: '87,36 ▼%1.73', s5T2RC: '#EF4444',
    s5T3L: 'NASDAQ', s5T3R: '30.333 ▲%0.36', s5T3RC: '#10B981',
    s5Pill1: 'Küresel Riskler', s5Pill2: 'Sınırlı Etki', s5Pill3: 'Günlük Güncelleme',

    /* Slide 10 */
    s10Tag: '📱 Telegram Bot',
    s10Title: 'Haberler ve Analizler',
    s10TitleBold: 'Telegram\'da anında size ulaşır',
    s10Desc: 'Ücretsiz abone olun ve acil haberler, anında AI analizi, fiyat uyarıları, ekonomik takvim ve günlük özet alın — tek akıllı botta her şey.',
    s10Stat1V: 'Ücretsiz', s10Stat1L: '%100 Ücretsiz',
    s10Stat2V: 'Anında', s10Stat2L: 'Anlık Bildirimler',
    s10Stat3V: '5', s10Stat3L: 'Uyarı Türü',
    s10Primary: 'Abone Ol →', s10Secondary: 'Özellikleri Keşfet',
    s10CardIc: 'Telegram Bot', s10CardLive: 'Aktif',
    s10CardNum: '5 Hizmet',
    s10CardDesc: 'İhtiyacınız olan tüm finansal bilgileri tek yerde sağlayan akıllı bot — kullanımı kolay ve tamamen ücretsiz.',
    s10T1L: '🚨', s10T1R: 'Acil Haber Uyarıları',
    s10T2L: '📊', s10T2R: 'Anında AI Analizi',
    s10T3L: '💰', s10T3R: 'Fiyat Hareket Uyarıları',
    s10T4L: '📅', s10T4R: 'Ekonomik Takvim',
    s10T5L: '📰', s10T5R: 'Günlük Özet',
    s10Pill1: 'Ücretsiz', s10Pill2: 'Anında', s10Pill3: 'Kolay Kullanım',

    brand: 'Rouaa',
  },
  fr: {
    /* Slide 1 */
    s1Tag: '🧠 Analyse IA Instantanée',
    s1Title: 'Mille analyses par jour',
    s1TitleBold: "Propulsées par l'IA",
    s1Desc: 'Chaque actualité financière est analysée automatiquement — impact sur le marché, actifs affectés, 3 scénarios possibles, et une recommandation claire en moins de 2 minutes.',
    s1Stat1V: '650+', s1Stat1L: 'Analyses quotidiennes',
    s1Stat2V: '50+', s1Stat2L: 'Sources mondiales',
    s1Stat3V: '<2m', s1Stat3L: 'De la nouvelle à l\'analyse',
    s1Primary: 'Lire les analyses →', s1Secondary: 'Comment ça marche',
    s1CardIc: 'Analyse IA', s1CardLive: 'EN DIRECT',
    s1CardNum: 'XAU/USD',
    s1CardDesc: "L'or monte de 1,34% après les données d'inflation américaine — 3 scénarios possibles pour la prochaine session.",
    s1T1L: 'Prix actuel', s1T1R: '4 593,00',
    s1T2L: 'Variation', s1T2R: '+60,60 (+1,34%)', s1T2RC: '#10B981',
    s1T3L: 'Tendance', s1T3R: '▲ Haussier', s1T3RC: '#10B981',
    s1T4L: 'Confiance', s1T4R: '67%',
    s1Pill1: '3 Scénarios', s1Pill2: 'Actifs affectés', s1Pill3: 'Signal de trading',

    /* Slide 2 */
    s2Tag: '⚡ Conseil Stratégique Intelligent',
    s2Title: '8 modèles IA',
    s2TitleBold: 'Votent sur chaque recommandation',
    s2Desc: "Claude, Grok, Gemini et 5 modèles spécialisés se combinent en une recommandation haute confiance — avec ratio de consensus, taux risque/récompense, et points d'entrée/sortie précis.",
    s2Stat1V: '8', s2Stat1L: 'Modèles IA spécialisés',
    s2Stat2V: '95%', s2Stat2L: 'Consensus le plus élevé',
    s2Stat3V: 'En direct', s2Stat3L: 'Consensus live',
    s2Primary: 'Voir les signaux →', s2Secondary: 'Comment ça marche',
    s2CardIc: 'Conseil Intelligent', s2CardLive: 'EN DIRECT',
    s2CardNum: '95% Achat',
    s2CardDesc: "8 modèles ont convenu d'un signal d'achat à 95% de confiance — avec point d'entrée, stop loss, et objectif au ratio R:R de 1:1,67.",
    s2T1L: "Point d'entrée", s2T1R: '4 550,00',
    s2T2L: 'Stop Loss', s2T2R: '4 480,00', s2T2RC: '#EF4444',
    s2T3L: 'Premier objectif', s2T3R: '4 650,00', s2T3RC: '#10B981',
    s2T4L: 'Ratio R:R', s2T4R: '1:1,67',
    s2Pill1: 'Vote de consensus', s2Pill2: 'R:R défini', s2Pill3: 'Entrée/Sortie',

    /* Slide 3 */
    s3Tag: '📊 Analyse Actions & Entreprises',
    s3Title: 'Analyse approfondie de chaque action',
    s3TitleBold: "Avec l'IA instantanément",
    s3Desc: "SWOT détaillé, indicateurs techniques avancés, données financières complètes, et recommandation d'entrée précise — tout sur une page pour n'importe quelle action mondiale.",
    s3Stat1V: '10 000+', s3Stat1L: 'Actions mondiales couvertes',
    s3Stat2V: 'Instantané', s3Stat2L: "Temps d'analyse",
    s3Stat3V: 'IA', s3Stat3L: "Propulsé par l'IA",
    s3Primary: "Commencer l'analyse →", s3Secondary: 'En savoir plus',
    s3CardIc: 'Analyse Actions', s3CardLive: 'EN DIRECT',
    s3CardNum: 'AAPL',
    s3CardDesc: "Analyse complète incluant indicateurs techniques, données financières, et recommandation d'entrée précise basée sur des données live.",
    s3T1L: 'Prix', s3T1R: '195,42',
    s3T2L: 'P/E', s3T2R: '28,5',
    s3T3L: 'RSI', s3T3R: '62,4',
    s3T4L: 'MACD', s3T4R: '▲ Haussier', s3T4RC: '#10B981',
    s3Pill1: 'Technique', s3Pill2: 'Données financières', s3Pill3: 'SWOT',

    /* Slide 4 */
    s4Tag: '🛡️ Rapports Stratégiques',
    s4Title: 'Rapports approfondis de niveau',
    s4TitleBold: 'Institutions de placement',
    s4Desc: '8 sections complètes — résumé exécutif, scénarios multiples, allocation de portefeuille, et 20+ sources citées — générés automatiquement en moins d\'une minute.',
    s4Stat1V: '9,5/10', s4Stat1L: 'Qualité moyenne',
    s4Stat2V: '20+', s4Stat2L: 'Sources par rapport',
    s4Stat3V: '10+', s4Stat3L: 'Rapports quotidiens',
    s4Primary: 'Lire les rapports →', s4Secondary: 'Exemple de rapport',
    s4CardIc: 'Stratégique',
    s4CardNum: '9,5/10',
    s4CardDesc: '8 sections, 3 horizons temporels, tableaux d\'allocation de portefeuille, et sources citées de Bloomberg, FT et Reuters.',
    s4Pill1: '8 Sections', s4Pill2: 'Allocation portefeuille', s4Pill3: 'Sur demande',

    /* Slide 5 */
    s9Tag: "🎯 Assistant Ru'aa — Salle des Opérations",
    s9Title: 'Salle des opérations du trader',
    s9TitleBold: 'Tout ce dont vous avez besoin en un seul endroit',
    s9Desc: "Agenda économique, heures de trading mondiales, et indice de force des devises — tous les outils du trader quotidien dans un seul tableau de bord intelligent.",
    s9Stat1V: '8+', s9Stat1L: 'Événements quotidiens',
    s9Stat2V: '5', s9Stat2L: 'Bourses mondiales',
    s9Stat3V: '10', s9Stat3L: 'Devises couvertes',
    s9Primary: 'Ouvrir la Salle →', s9Secondary: 'Explorer les outils',
    s9CardIc: 'Salle des Opérations', s9CardLive: 'EN DIRECT',
    s9CardNum: '5 Bourses',
    s9CardDesc: "Suivez les heures d'ouverture/fermeture des bourses mondiales avec les événements économiques et l'indice de force des devises.",
    s9T1L: '🇬🇧 Londres', s9T1R: '08:00–17:00 Ouverte', s9T1RC: '#10B981',
    s9T2L: '🇺🇸 New York', s9T2R: '13:00–22:00 Ouverte', s9T2RC: '#10B981',
    s9T3L: '🇯🇵 Tokyo', s9T3R: '00:00–09:00 Fermée', s9T3RC: 'rgba(255,255,255,.3)',
    s9T4L: '🇸🇦 Arabie', s9T4R: '07:00–12:00 Ouverte', s9T4RC: '#10B981',
    s9Pill1: 'Heures de trading', s9Pill2: 'Agenda économique', s9Pill3: 'Force des devises',

    /* Slide 6 */
    s6Tag: '📊 Tableau de Bord Marchés',
    s6Title: 'Suivez tous les marchés',
    s6TitleBold: 'Dans un tableau de bord intégré',
    s6Desc: "Prix en temps réel pour l'or, le pétrole, le forex, les crypto et les indices mondiaux — avec indice Peur & Cupidité, heures de trading, et plus gros mouvements du jour.",
    s6Stat1V: '15+', s6Stat1L: 'Actifs couverts',
    s6Stat2V: '24/7', s6Stat2L: 'Mises à jour continues',
    s6Stat3V: '5', s6Stat3L: 'Bourses mondiales',
    s6Primary: 'Voir les marchés →', s6Secondary: 'Calendrier économique',
    s6CardIc: 'Marchés en Direct', s6CardLive: 'EN DIRECT',
    s6CardNum: '49',
    s6CardDesc: 'Indice Peur & Cupidité — Prudence modérée. Tensions géopolitiques modérées avec impact limité sur les marchés.',
    s6FgLeft: 'Peur extrême', s6FgMid: 'Neutre', s6FgRight: 'Cupidité extrême',
    s6T1L: 'Or', s6T1R: '4 593 ▲1,34%', s6T1RC: '#10B981',
    s6T2L: 'NASDAQ', s6T2R: '30 333 ▲0,36%', s6T2RC: '#10B981',
    s6T3L: 'Pétrole WTI', s6T3R: '87,36 ▼1,73%', s6T3RC: '#EF4444',
    s6Pill1: 'Prix en direct', s6Pill2: 'Indice Peur', s6Pill3: 'Heures de trading',

    /* Slide 7 */
    s7Tag: '📅 Calendrier Économique',
    s7Title: "Ne manquez aucun événement",
    s7TitleBold: 'Impactant les marchés mondiaux',
    s7Desc: "Décisions de taux, données d'inflation, emploi, PIB — tous les événements impactants classés chronologiquement avec impact attendu et prévisions de marché.",
    s7Stat1V: '8+', s7Stat1L: 'Événements quotidiens',
    s7Stat2V: '3', s7Stat2L: "Niveaux d'impact",
    s7Stat3V: 'Mondial', s7Stat3L: 'Couverture',
    s7Primary: 'Voir le calendrier →', s7Secondary: 'Activer les alertes',
    s7CardIc: 'Événements à venir', s7CardLive: "Aujourd'hui",
    s7CardNum: 'Décision de taux',
    s7CardDesc: "L'événement le plus impactant aujourd'hui — temps restant avant l'annonce :",
    s7CdH: 'Heures', s7CdM: 'Minutes', s7CdS: 'Secondes',
    s7T1L: '14:30 🇺🇸', s7T1R: 'IPC',
    s7T2L: '15:30 🇺🇸', s7T2R: 'Emploi non agricole',
    s7T3L: '14:30 🇪🇺', s7T3R: 'Décision BCE',
    s7Pill1: 'Impact élevé', s7Pill2: 'Prévisions de marché', s7Pill3: 'Alertes',

    /* Slide 8 */
    s8Tag: '💬 Communauté & Apprentissage',
    s8Title: 'Connaissez le marché et apprenez',
    s8TitleBold: 'En même temps',
    s8Desc: "Indicateurs de sentiment des traders pour les principales paires de devises, et une académie complète couvrant l'analyse technique, fondamentale et macroéconomique.",
    s8Stat1V: '4', s8Stat1L: 'Paires couvertes',
    s8Stat2V: '3', s8Stat2L: 'Parcours d\'apprentissage',
    s8Stat3V: 'Gratuit', s8Stat3L: 'Accès de base',
    s8Primary: 'Explorer →', s8Secondary: 'Voir le programme',
    s8CardIc: 'Communauté & Apprentissage', s8CardLive: 'Actif',
    s8Mc1Icon: '📊', s8Mc1Title: 'Pulse Communauté', s8Mc1Desc: 'GBP/USD ▲51% Achat',
    s8Mc2Icon: '🎓', s8Mc2Title: 'Académie', s8Mc2Desc: '3 parcours d\'apprentissage',
    s8Mc3Icon: '📈', s8Mc3Title: 'P/E Ratio', s8Mc3Desc: 'Prix/Bénéfice',
    s8Mc4Icon: '📉', s8Mc4Title: 'RSI', s8Mc4Desc: 'Force Relative',
    s8Pill1: 'Sentiment du marché', s8Pill2: 'Apprentissage gratuit', s8Pill3: 'Français',

    /* Slide 9 */
    s5Tag: '🌍 Risque Géopolitique',
    s5Title: 'Suivez les risques mondiaux',
    s5TitleBold: 'Avant qu\'ils affectent votre portefeuille',
    s5Desc: "Indice de suivi des tensions géopolitiques mondiales avec évaluation de l'impact attendu sur les marchés financiers, les matières premières et les devises — mise à jour quotidienne.",
    s5Stat1V: '35', s5Stat1L: 'Niveau actuel',
    s5Stat2V: 'Moyen', s5Stat2L: 'Degré de risque',
    s5Stat3V: 'Quotidien', s5Stat3L: 'Mise à jour',
    s5Primary: 'Voir les détails →', s5Secondary: 'Historique',
    s5CardIc: 'Risque Géopolitique',
    s5CardNum: '35',
    s5CardDesc: 'Moyen — tensions géopolitiques modérées avec impact limité sur les marchés actuellement.',
    s5GrLeft: 'Faible', s5GrMid: 'Moyen', s5GrRight: 'Élevé',
    s5T1L: 'Or', s5T1R: '4 593 ▲1,34%', s5T1RC: '#10B981',
    s5T2L: 'Pétrole WTI', s5T2R: '87,36 ▼1,73%', s5T2RC: '#EF4444',
    s5T3L: 'NASDAQ', s5T3R: '30 333 ▲0,36%', s5T3RC: '#10B981',
    s5Pill1: 'Risques mondiaux', s5Pill2: 'Impact limité', s5Pill3: 'Mise à jour quotidienne',

    /* Slide 10 */
    s10Tag: '📱 Bot Telegram',
    s10Title: 'Actualités & Analyses',
    s10TitleBold: 'Vous parviennent instantanément sur Telegram',
    s10Desc: "Abonnez-vous gratuitement et recevez des actualités urgentes, analyses IA instantanées, alertes de prix, calendrier économique, et résumé quotidien — tout dans un seul bot intelligent.",
    s10Stat1V: 'Gratuit', s10Stat1L: '100% Sans frais',
    s10Stat2V: 'Instantané', s10Stat2L: 'Notifications instantanées',
    s10Stat3V: '5', s10Stat3L: "Types d'alertes",
    s10Primary: "S'abonner maintenant →", s10Secondary: 'Découvrir les fonctionnalités',
    s10CardIc: 'Bot Telegram', s10CardLive: 'Actif',
    s10CardNum: '5 Services',
    s10CardDesc: "Un bot intelligent fournissant toutes les informations financières en un seul endroit — facile à utiliser et totalement gratuit.",
    s10T1L: '🚨', s10T1R: 'Alertes actualités urgentes',
    s10T2L: '📊', s10T2R: 'Analyses IA instantanées',
    s10T3L: '💰', s10T3R: 'Alertes de mouvement de prix',
    s10T4L: '📅', s10T4R: 'Calendrier économique',
    s10T5L: '📰', s10T5R: 'Résumé quotidien',
    s10Pill1: 'Gratuit', s10Pill2: 'Instantané', s10Pill3: 'Facile à utiliser',

    brand: 'Rouaa',
  },
};

/* ── Floating Particles ── */
const PARTICLES = [
  { top: '12%', left: '18%', delay: '0s' },
  { top: '22%', left: '78%', delay: '1.5s' },
  { top: '55%', left: '12%', delay: '3s' },
  { top: '38%', left: '88%', delay: '4.5s' },
  { top: '68%', left: '48%', delay: '2s' },
  { top: '45%', left: '35%', delay: '5s' },
];

/* ── Primary button gradient per slide ── */
const PRIMARY_GRADIENTS = [
  'linear-gradient(135deg,#3B82F6,#2563EB)',
  'linear-gradient(135deg,#EF4444,#DC2626)',
  'linear-gradient(135deg,#8B5CF6,#7C3AED)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#A78BFA,#8B5CF6)',
  'linear-gradient(135deg,#06B6D4,#0891B2)',
  'linear-gradient(135deg,#3B82F6,#2563EB)',
];

/* ── Pill color configs per slide ── */
const PILL_COLORS = [
  ['#3B82F6', '#10B981', '#EF4444'],
  ['#EF4444', '#10B981', '#3B82F6'],
  ['#8B5CF6', '#10B981', '#F59E0B'],
  ['#F59E0B', '#10B981', '#3B82F6'],
  ['#EC4899', '#F59E0B', '#10B981'],
  ['#10B981', '#3B82F6', '#F59E0B'],
  ['#F59E0B', '#10B981', '#3B82F6'],
  ['#A78BFA', '#10B981', '#3B82F6'],
  ['#06B6D4', '#F59E0B', '#10B981'],
  ['#3B82F6', '#10B981', '#F59E0B'],
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function RouaaHeroSection({ locale }: RouaaHeroSectionProps) {
  const t = LABELS[locale];
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';
  const localePath = getLocalePath(locale);

  // ── State ──
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hoverPause, setHoverPause] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [countdown, setCountdown] = useState({ h: 2, m: 15, s: 30 });
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<any[]>([]);
  const ntRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const totalSlides = SLIDE_CONFIG.length;
  const DUR = 5500; // 5.5s

  // ── Responsive Check ──
  useEffect(() => {
    function checkMobile() { setIsMobile(window.innerWidth < 768); }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Neural Network Canvas (V1023: STATIC — no animation loop) ──
  // V1023: The previous version ran a requestAnimationFrame loop at 20fps
  // with O(n²) distance calculations between 80 nodes = 128,000 calcs/sec.
  // This was the #1 cause of fan spinning / CPU/GPU drain on the homepage.
  // Now we draw the neural network ONCE (static) and never animate it.
  // The visual is preserved (nodes + connections) but frozen — zero CPU cost.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    const nodes: Array<{ x: number; y: number; r: number; c: string; ph: number }> = [];

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      W = canvas!.width = r.width;
      H = canvas!.height = r.height;
      nodes.length = 0;
      // V1023: Reduced from 80 to 30 nodes — enough for visual density
      const cnt = Math.min(Math.floor(W * H / 30000), 30);
      for (let i = 0; i < cnt; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.4 + Math.random() * 1,
          c: ['59,130,246', '16,185,129', '167,139,250', '245,158,11'][Math.floor(Math.random() * 4)],
          ph: Math.random() * Math.PI * 2,
        });
      }
      drawStatic();
    }

    // V1023: Draw the neural network ONCE — no animation loop
    function drawStatic() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const nt = 0; // Static — no time progression
      // Draw connections (same algorithm, but only runs once)
      const CONNECT_DIST = 140;
      const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < CONNECT_DIST_SQ) {
            const d = Math.sqrt(dSq);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / CONNECT_DIST) * 0.12})`;
            ctx.lineWidth = 0.25; ctx.stroke();
          }
        }
        // Draw node (static size — no pulsing)
        const n = nodes[i];
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.c},0.25)`;
        ctx.fill();
      }
    }

    resize();

    // V1023: Only redraw on resize — NO animation loop at all
    const resizeObserver = new ResizeObserver(() => { resize(); });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    return () => {
      resizeObserver.disconnect();
      // No cancelAnimationFrame needed — we never start one
    };
  }, []);

  // ── Countdown Timer (V1024: update every 5s instead of 1s to reduce re-renders) ──
  useEffect(() => {
    let cdSec = 2 * 3600 + 15 * 60 + 30; // 8130 seconds
    const id = setInterval(() => {
      if (document.hidden) return;
      // V1024: Update every 5 seconds instead of every 1 second — 80% fewer re-renders
      cdSec -= 5;
      if (cdSec < 0) cdSec = 8130;
      const h = Math.floor(cdSec / 3600);
      const m = Math.floor((cdSec % 3600) / 60);
      const s = cdSec % 60;
      setCountdown({ h, m, s });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Auto-rotation (V1024: no 200ms interval — use setTimeout instead) ──
  // V1024: The previous 200ms setInterval caused 5 re-renders/second of this
  // 1900-line component. Now we use a single setTimeout that fires only when
  // the slide actually needs to change. Progress bar is CSS-driven.
  const autoRotateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hoverPause) {
      if (autoRotateRef.current) clearTimeout(autoRotateRef.current);
      return;
    }
    // V1024: Single setTimeout — fires once per slide duration, not 5x/second
    autoRotateRef.current = setTimeout(() => {
      if (document.hidden) return;
      setCurrentSlide(prev => (prev + 1) % totalSlides);
      setProgress(0);
    }, DUR);
    return () => { if (autoRotateRef.current) clearTimeout(autoRotateRef.current); };
  }, [hoverPause, totalSlides, currentSlide]); // Re-run when slide changes

  // ── Keyboard Navigation ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = isRTL
          ? (e.key === 'ArrowLeft' ? 1 : -1)
          : (e.key === 'ArrowRight' ? 1 : -1);
        setCurrentSlide(prev => (prev + dir + totalSlides) % totalSlides);
        setProgress(0);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalSlides, isRTL]);

  // ── Inject CSS Keyframes ──
  useEffect(() => {
    const existing = document.getElementById('rouaa-hero-v5-keyframes');
    if (existing) return;
    const style = document.createElement('style');
    style.id = 'rouaa-hero-v5-keyframes';
    style.textContent = `
      @keyframes rouaaFloat { 0%,100% { transform: translateY(0) translateX(0); opacity: 0.05; } 50% { transform: translateY(-30px) translateX(15px); opacity: 0.2; } }
      @keyframes rouaaLivePulse { 0%,100% { opacity: 1; box-shadow: 0 0 6px currentColor; } 50% { opacity: 0.3; box-shadow: 0 0 2px currentColor; } }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('rouaa-hero-v5-keyframes'); if (el) el.remove(); };
  }, []);

  // ── Parallax on mouse move ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - r.left - r.width / 2) / r.width;
    const my = (e.clientY - r.top - r.height / 2) / r.height;
    setMouseOffset({ x: mx * -8, y: my * -8 });
  }, []);

  const goToSlide = useCallback((n: number) => {
    setCurrentSlide((n + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const step = useCallback((d: number) => {
    setCurrentSlide(prev => (prev + d + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const c = SLIDE_CONFIG[currentSlide];
  const pc = PILL_COLORS[currentSlide];

  // ── Helper: render pill ──
  const Pill = ({ color, text }: { color: string; text: string }) => (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
      border: '0.5px solid', color,
      borderColor: color.replace(')', ',0.25)').replace('rgb', 'rgba'),
      background: color.replace(')', ',0.08)').replace('rgb', 'rgba').replace('#', ''),
    }}>
      <span style={{
        color, border: `0.5px solid ${color}40`, background: `${color}14`,
        padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 600,
      }}>
        {text}
      </span>
    </span>
  );

  // Helper: pill with inline colors
  const renderPill = (color: string, text: string) => {
    // Convert hex to rgba for border/bg
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
        border: `0.5px solid ${hexToRgba(color, 0.25)}`,
        background: hexToRgba(color, 0.08),
        color,
      }}>
        {text}
      </span>
    );
  };

  // Helper: table row
  const TRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <tr style={{ transition: 'background 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <td style={{
        padding: '7px 0', fontSize: 11.5, borderBottom: '0.5px solid rgba(255,255,255,0.05)',
//         color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
      }}>
        {label}
      </td>
      <td style={{
        padding: '7px 0', fontSize: 11.5, borderBottom: '0.5px solid rgba(255,255,255,0.05)',
        color: valueColor || 'rgba(255,255,255,0.7)',
        textAlign: isRTL ? 'left' : 'right', fontWeight: 500,
      }}>
        {value}
      </td>
    </tr>
  );

  // ── Render slide card based on slide index ──
  const renderCard = (slideIdx: number) => {
    const n = slideIdx + 1;
    const cfg = SLIDE_CONFIG[slideIdx];
    const pc = PILL_COLORS[slideIdx];
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };
    const cardIcBg = hexToRgba(cfg.color, 0.12);
    const liveDotColor = cfg.color;

    // Slide-specific card content
    switch (slideIdx) {
      case 0: // AI News
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s1CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s1CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s1CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s1CardDesc}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s1T1L} value={t.s1T1R} />
              <TRow label={t.s1T2L} value={t.s1T2R} valueColor={t.s1T2RC} />
              <TRow label={t.s1T3L} value={t.s1T3R} valueColor={t.s1T3RC} />
              <TRow label={t.s1T4L} value={t.s1T4R} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s1Pill1)}{renderPill(pc[1], t.s1Pill2)}{renderPill(pc[2], t.s1Pill3)}
            </div>
          </>
        );

      case 1: // Smart Council
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s2CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s2CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s2CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s2CardDesc}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s2T1L} value={t.s2T1R} />
              <TRow label={t.s2T2L} value={t.s2T2R} valueColor={t.s2T2RC} />
              <TRow label={t.s2T3L} value={t.s2T3R} valueColor={t.s2T3RC} />
              <TRow label={t.s2T4L} value={t.s2T4R} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s2Pill1)}{renderPill(pc[1], t.s2Pill2)}{renderPill(pc[2], t.s2Pill3)}
            </div>
          </>
        );

      case 2: // Stock Analysis
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s3CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveDotColor, boxShadow: `0 0 6px ${liveDotColor}`, animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s3CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s3CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s3CardDesc}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s3T1L} value={t.s3T1R} />
              <TRow label={t.s3T2L} value={t.s3T2R} />
              <TRow label={t.s3T3L} value={t.s3T3R} />
              <TRow label={t.s3T4L} value={t.s3T4R} valueColor={t.s3T4RC} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s3Pill1)}{renderPill(pc[1], t.s3Pill2)}{renderPill(pc[2], t.s3Pill3)}
            </div>
          </>
        );

      case 3: // Strategic Reports (no table, pills only)
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s4CardIc}</span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s4CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s4CardDesc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {renderPill(pc[0], t.s4Pill1)}{renderPill(pc[1], t.s4Pill2)}{renderPill(pc[2], t.s4Pill3)}
            </div>
          </>
        );

      case 4: // Geopolitical Risk with risk bar
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s5CardIc}</span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s5CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s5CardDesc}</div>
            {/* Geopolitical Risk Bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#10B981,#F59E0B,#EF4444)', position: 'relative', margin: '8px 0' }}>
              <div style={{ position: 'absolute', top: -3, left: '35%', width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid #050810', boxShadow: '0 0 8px rgba(255,255,255,0.3)', transform: 'translateX(-50%)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
              <span>{t.s5GrLeft}</span><span>{t.s5GrMid}</span><span>{t.s5GrRight}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s5T1L} value={t.s5T1R} valueColor={t.s5T1RC} />
              <TRow label={t.s5T2L} value={t.s5T2R} valueColor={t.s5T2RC} />
              <TRow label={t.s5T3L} value={t.s5T3R} valueColor={t.s5T3RC} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s5Pill1)}{renderPill(pc[1], t.s5Pill2)}{renderPill(pc[2], t.s5Pill3)}
            </div>
          </>
        );

      case 5: // Market Dashboard with Fear & Greed
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s6CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s6CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s6CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s6CardDesc}</div>
            {/* Fear & Greed Bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#EF4444,#F59E0B,#10B981)', position: 'relative', margin: '8px 0' }}>
              <div style={{ position: 'absolute', top: -3, left: '49%', width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid #050810', boxShadow: '0 0 8px rgba(255,255,255,0.3)', transform: 'translateX(-50%)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
              <span>{t.s6FgLeft}</span><span>{t.s6FgMid}</span><span>{t.s6FgRight}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s6T1L} value={t.s6T1R} valueColor={t.s6T1RC} />
              <TRow label={t.s6T2L} value={t.s6T2R} valueColor={t.s6T2RC} />
              <TRow label={t.s6T3L} value={t.s6T3R} valueColor={t.s6T3RC} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s6Pill1)}{renderPill(pc[1], t.s6Pill2)}{renderPill(pc[2], t.s6Pill3)}
            </div>
          </>
        );

      case 6: // Economic Calendar with Countdown
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s7CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveDotColor, boxShadow: `0 0 6px ${liveDotColor}`, animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s7CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s7CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s7CardDesc}</div>
            {/* Countdown */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '10px 0', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: '#fff', display: 'block' }}>{String(countdown.h).padStart(2, '0')}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{t.s7CdH}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 300 }}>:</span>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: '#fff', display: 'block' }}>{String(countdown.m).padStart(2, '0')}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{t.s7CdM}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 300 }}>:</span>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: '#fff', display: 'block' }}>{String(countdown.s).padStart(2, '0')}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{t.s7CdS}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s7T1L} value={t.s7T1R} />
              <TRow label={t.s7T2L} value={t.s7T2R} />
              <TRow label={t.s7T3L} value={t.s7T3R} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s7Pill1)}{renderPill(pc[1], t.s7Pill2)}{renderPill(pc[2], t.s7Pill3)}
            </div>
          </>
        );

      case 7: // Community with mini cards grid
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s8CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveDotColor, boxShadow: `0 0 6px ${liveDotColor}`, animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s8CardLive}
              </span>
            </div>
            {/* Mini cards grid */}
            <div className="hero-mini-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                { icon: t.s8Mc1Icon, title: t.s8Mc1Title, desc: t.s8Mc1Desc },
                { icon: t.s8Mc2Icon, title: t.s8Mc2Title, desc: t.s8Mc2Desc },
                { icon: t.s8Mc3Icon, title: t.s8Mc3Title, desc: t.s8Mc3Desc },
                { icon: t.s8Mc4Icon, title: t.s8Mc4Title, desc: t.s8Mc4Desc },
              ].map((mc, i) => (
                <div key={i} style={{
                  padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.06)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{mc.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', marginBottom: 2 }}>{mc.title}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{mc.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s8Pill1)}{renderPill(pc[1], t.s8Pill2)}{renderPill(pc[2], t.s8Pill3)}
            </div>
          </>
        );

      case 8: // Operations Room
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s9CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveDotColor, boxShadow: `0 0 6px ${liveDotColor}`, animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s9CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s9CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s9CardDesc}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s9T1L} value={t.s9T1R} valueColor={t.s9T1RC} />
              <TRow label={t.s9T2L} value={t.s9T2R} valueColor={t.s9T2RC} />
              <TRow label={t.s9T3L} value={t.s9T3R} valueColor={t.s9T3RC} />
              <TRow label={t.s9T4L} value={t.s9T4R} valueColor={t.s9T4RC} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s9Pill1)}{renderPill(pc[1], t.s9Pill2)}{renderPill(pc[2], t.s9Pill3)}
            </div>
          </>
        );

      case 9: // Telegram Bot
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', padding: '4px 12px', borderRadius: 8, background: cardIcBg, color: cfg.color }}>{t.s10CardIc}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveDotColor, boxShadow: `0 0 6px ${liveDotColor}`, animation: 'rouaaLivePulse 2s ease-in-out infinite' }} />
                {t.s10CardLive}
              </span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 300, color: '#fff', letterSpacing: '-1px', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{t.s10CardNum}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>{t.s10CardDesc}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <TRow label={t.s10T1L} value={t.s10T1R} />
              <TRow label={t.s10T2L} value={t.s10T2R} />
              <TRow label={t.s10T3L} value={t.s10T3R} />
              <TRow label={t.s10T4L} value={t.s10T4R} />
              <TRow label={t.s10T5L} value={t.s10T5R} />
            </table>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {renderPill(pc[0], t.s10Pill1)}{renderPill(pc[1], t.s10Pill2)}{renderPill(pc[2], t.s10Pill3)}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ── Get localized slide text helpers ──
  const getSlideTexts = (idx: number) => {
    const n = idx + 1;
    return {
      tag: t[`s${n}Tag` as keyof typeof t],
      title: t[`s${n}Title` as keyof typeof t],
      titleBold: t[`s${n}TitleBold` as keyof typeof t],
      desc: t[`s${n}Desc` as keyof typeof t],
      stat1V: t[`s${n}Stat1V` as keyof typeof t],
      stat1L: t[`s${n}Stat1L` as keyof typeof t],
      stat2V: t[`s${n}Stat2V` as keyof typeof t],
      stat2L: t[`s${n}Stat2L` as keyof typeof t],
      stat3V: t[`s${n}Stat3V` as keyof typeof t],
      stat3L: t[`s${n}Stat3L` as keyof typeof t],
      primary: t[`s${n}Primary` as keyof typeof t],
      secondary: t[`s${n}Secondary` as keyof typeof t],
    };
  };

  return (
    <div
      ref={wrapperRef}
      dir={direction}
      style={{
        fontFamily: "var(--font-readex-pro), 'Readex Pro', var(--font-cairo), sans-serif",
        background: '#050810',
        borderRadius: 'var(--r2)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border)',
        boxShadow: 'var(--glow)',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Screen reader heading */}
      <h2 className="sr-only">
        {locale === 'ar' ? 'بطاقة بطل رؤى — منصة الأخبار المالية العربية المدعومة بالذكاء الاصطناعي'
          : locale === 'tr' ? 'Rouaa — Yapay Zeka Destekli Finansal Haberler Platformu'
          : locale === 'fr' ? "Rouaa — Plateforme d'actualités financières propulsée par l'IA"
          : 'Rouaa — AI-Powered Financial News Platform'}
      </h2>

      {/* Neural Network Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat', backgroundSize: 128,
      }} />

      {/* Floating Particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', width: 3, height: 3, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', animation: `rouaaFloat 8s ease-in-out ${p.delay} infinite`,
          pointerEvents: 'none', zIndex: 2, top: p.top, left: p.left,
        }} />
      ))}

      {/* Slides Wrapper */}
      <div style={{ position: 'relative', overflow: 'hidden', height: isMobile ? 360 : 520 }}
        onMouseEnter={() => setHoverPause(true)}
        onMouseLeave={() => setHoverPause(false)}
      >
        {SLIDE_CONFIG.map((cfg, idx) => {
          const isActive = idx === currentSlide;
          const st = getSlideTexts(idx);
          return (
            <div
              key={idx}
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.9s cubic-bezier(0.4,0,0.2,1)',
                pointerEvents: isActive ? 'all' : 'none',
                zIndex: isActive ? 5 : 0,
              }}
            >
              {/* Background Image with Ken Burns */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${SLIDE_IMAGES[idx]})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'transform 12s ease',
                transform: isActive
                  ? `scale(1.02) translate(${mouseOffset.x}px,${mouseOffset.y}px)`
                  : 'scale(1.1)',
              }} />

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'linear-gradient(180deg,rgba(5,8,16,0.88) 0%,rgba(5,8,16,0.7) 35%,rgba(5,8,16,0.4) 65%,rgba(5,8,16,0.9) 100%)',
              }} />

              {/* Content */}
              <div style={{
                position: 'relative', zIndex: 10,
                padding: isMobile ? '24px 20px' : '44px 52px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
                gap: isMobile ? 0 : 44,
                alignItems: 'end',
              }}>
                {/* Left Content */}
                <div>
                  {/* Tag */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
                    padding: '5px 16px', borderRadius: 30,
                    border: `0.5px solid ${cfg.color}4D`,
                    marginBottom: 16,
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'all 0.7s 0.1s',
                    backdropFilter: 'blur(12px)',
                    textTransform: 'uppercase' as const,
                    color: cfg.color,
                    borderColor: `${cfg.color}4D`,
                    background: `${cfg.color}1A`,
                  }}>
                    {st.tag}
                  </div>

                  {/* Title */}
                  <div style={{
                    fontSize: isMobile ? 26 : 38, fontWeight: 300, color: '#fff',
                    lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 14,
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateY(0)' : 'translateY(14px)',
                    transition: 'all 0.7s 0.2s',
                  }}>
                    {st.title}
                    <br />
                    <strong style={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.6) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      {st.titleBold}
                    </strong>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: isMobile ? 13 : 15.5, color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.9, maxWidth: 490, marginBottom: isMobile ? 20 : 28,
                    opacity: isActive ? 1 : 0,
                    transition: 'all 0.7s 0.3s',
                  }}>
                    {st.desc}
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex', gap: isMobile ? 16 : 28, marginBottom: isMobile ? 18 : 26,
                    paddingBottom: isMobile ? 14 : 22,
                    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                    opacity: isActive ? 1 : 0,
                    transition: 'all 0.7s 0.35s',
                  }}>
                    <div>
                      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{st.stat1V}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', marginTop: 5, fontWeight: 600 }}>{st.stat1L}</div>
                    </div>
                    <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
                    <div>
                      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{st.stat2V}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', marginTop: 5, fontWeight: 600 }}>{st.stat2L}</div>
                    </div>
                    <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
                    <div>
                      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>{st.stat3V}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', marginTop: 5, fontWeight: 600 }}>{st.stat3L}</div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{
                    display: 'flex', gap: 12,
                    opacity: isActive ? 1 : 0,
                    transition: 'all 0.7s 0.45s',
                    flexWrap: 'wrap' as const,
                  }}>
                    {/* Primary Button */}
                    <Link
                      href={`${localePath}${cfg.primaryPath}`}
                      style={{
                        fontSize: 13.5, fontWeight: 700, padding: '13px 30px', borderRadius: 12,
                        border: 'none', cursor: 'pointer', color: idx === 3 ? '#050810' : '#fff',
                        transition: 'all 0.3s',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        position: 'relative' as const, overflow: 'hidden',
                        background: PRIMARY_GRADIENTS[idx],
                        textDecoration: 'none',
                      }}
                    >
                      {st.primary}
                    </Link>

                    {/* Secondary Button */}
                    <Link
                      href={`${localePath}${cfg.secondaryPath}`}
                      style={{
                        fontSize: 13.5, fontWeight: 600, padding: '13px 24px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        cursor: 'pointer', transition: 'all 0.3s',
                        display: 'flex', alignItems: 'center', gap: 8,
                        textDecoration: 'none',
                      }}
                    >
                      {st.secondary}
                    </Link>
                  </div>
                </div>

                {/* Right Card (hidden on mobile) */}
                {!isMobile && (
                  <div style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateX(0)' : (isRTL ? 'translateX(-20px)' : 'translateX(20px)'),
                    transition: 'all 0.8s 0.4s',
                    padding: 24, borderRadius: 18,
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.025)',
                    backdropFilter: 'blur(40px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                    position: 'relative' as const,
                  }}>
                    {/* Gradient border pseudo-element via nested div */}
                    <div style={{
                      position: 'absolute', inset: -1, borderRadius: 19, padding: 1,
                      background: isActive ? 'linear-gradient(135deg,rgba(255,255,255,0.08),transparent 50%)' : 'none',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                      pointerEvents: 'none' as const,
                      opacity: isActive ? 1 : 0, transition: 'opacity 0.5s',
                    }} />

                    {renderCard(idx)}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 20, height: '2.5px', background: 'rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  height: '100%', width: isActive ? `${progress}%` : '0%',
                  background: cfg.progressGrad,
                  transition: isActive ? 'width 55ms linear' : 'none',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav Bar (dots, brand, prev/next) — NO rotating market data */}
      <div style={{
        position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 52px',
        background: 'rgba(5,8,16,0.97)',
        borderTop: '0.5px solid rgba(255,255,255,0.04)',
      }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SLIDE_CONFIG.map((cfg, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              style={{
                height: 3.5, borderRadius: i === currentSlide ? 2 : '50%',
                cursor: 'pointer', transition: 'all 0.35s',
                background: i === currentSlide ? cfg.color : 'rgba(255,255,255,0.1)',
                width: i === currentSlide ? 28 : 7,
                border: 'none', padding: 0,
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Brand */}
        <div style={{
          fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: 1,
        }}>
          {isRTL ? (
            <>رؤى <em style={{ fontStyle: 'normal', color: '#3B82F6', fontWeight: 800 }}>Rouaa</em></>
          ) : (
            <><em style={{ fontStyle: 'normal', color: '#3B82F6', fontWeight: 800 }}>Rouaa</em></>
          )}
        </div>

        {/* Prev/Next Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => step(isRTL ? 1 : -1)}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20,
              border: '0.5px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.25s',
              fontFamily: "var(--font-readex-pro), 'Readex Pro', var(--font-cairo), sans-serif",
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = 'rgba(255,255,255,0.8)'; el.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.02)'; el.style.color = 'rgba(255,255,255,0.4)'; el.style.transform = 'scale(1)'; }}
          >
            {isRTL ? '→' : '←'}
          </button>
          <button
            onClick={() => step(isRTL ? -1 : 1)}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20,
              border: '0.5px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.25s',
              fontFamily: "var(--font-readex-pro), 'Readex Pro', var(--font-cairo), sans-serif",
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = 'rgba(255,255,255,0.8)'; el.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.02)'; el.style.color = 'rgba(255,255,255,0.4)'; el.style.transform = 'scale(1)'; }}
          >
            {isRTL ? '←' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
