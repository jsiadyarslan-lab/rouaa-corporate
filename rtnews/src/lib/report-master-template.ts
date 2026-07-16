// ═══════════════════════════════════════════════════════════════
// Master Report Template — Canonical Structure (V1.0)
// ═══════════════════════════════════════════════════════════════
//
// This is the SINGLE SOURCE OF TRUTH for report structure across
// all three locales (Arabic, English, French). Every report type
// must conform to this structure to ensure 100% consistency.
//
// Usage:
// - Import this template when generating reports (AI prompt templates)
// - Import this template when rendering reports (UI components)
// - Import this template when validating reports (quality gates)
//
// ═══════════════════════════════════════════════════════════════

import type { Locale } from './locale';

// ─── Section Types ──────────────────────────────────────────────

export type SectionPriority = 'mandatory' | 'recommended' | 'optional';
export type SectionVisibility = 'always' | 'data-driven' | 'report-type-specific';

export interface MasterSection {
  /** Unique machine-readable key (never changes) */
  id: string;
  /** Display order (lower = higher in the report) */
  order: number;
  /** Whether this section MUST appear in every report */
  priority: SectionPriority;
  /** When this section should be visible */
  visibility: SectionVisibility;
  /** Report types where this section is relevant (empty = all) */
  reportTypes?: string[];
  /** Asset classes where this section is relevant (empty = all) */
  assetClasses?: string[];
  /** Section title in each locale */
  title: Record<Locale, string>;
  /** ARIA label for accessibility */
  ariaLabel: Record<Locale, string>;
  /** Description of expected content */
  description: string;
  /** Minimum content length (characters) for quality gate */
  minContentLength: number;
  /** Expected content format */
  contentFormat: 'prose' | 'bullets' | 'table' | 'mixed';
}

// ─── Investor Profile Types ─────────────────────────────────────

export interface InvestorProfile {
  id: string;
  /** Display name in each locale */
  name: Record<Locale, string>;
  /** Short description in each locale */
  description: Record<Locale, string>;
  /** Time horizon */
  horizon: Record<Locale, string>;
  /** Execution style */
  style: Record<Locale, string>;
}

// ─── The Canonical Investor Profiles ────────────────────────────

export const INVESTOR_PROFILES: InvestorProfile[] = [
  {
    id: 'day_trader',
    name: { ar: 'المضارب اليومي', en: 'Day Trader', fr: 'Day Trader', tr: 'Day Trader', es: 'Day Trader' },
    description: {
      ar: 'أفق زمني: أسبوع أو أقل — أوامر تنفيذية مباشرة',
      en: 'Time horizon: 1 week or less — Direct execution orders',
      fr: 'Horizon : 1 semaine ou moins — Ordres d\'exécution directs',
      tr: 'Vade: 1 hafta veya daha az — Doğrudan emirler',
      es: 'Horizonte: 1 semana o menos — Órdenes de ejecución directas',
    },
    horizon: { ar: 'ساعات إلى أسبوع', en: 'Hours to 1 week', fr: 'Heures à 1 semaine', tr: 'Saatler ile 1 hafta', es: 'Horas a 1 semana' },
    style: { ar: 'أوامر مباشرة (شراء/بيع/وقف/هدف)', en: 'Direct orders (buy/sell/stop/target)', fr: 'Ordres directs (achat/vente/stop/objectif)', tr: 'Doğrudan emirler (al/sat/durdurma/hedef)', es: 'Órdenes directas (compra/venta/stop/objetivo)' },
  },
  {
    id: 'medium_term',
    name: { ar: 'المستثمر متوسط المدى', en: 'Medium-Term Investor', fr: 'Investisseur Moyen Terme', tr: 'Orta Vadeli Yatırımcı', es: 'Inversionista a Medio Plazo' },
    description: {
      ar: 'أفق زمني: 1-6 أشهر — خطط شهرية مع نقاط إعادة تقييم',
      en: 'Time horizon: 1-6 months — Monthly plans with re-evaluation points',
      fr: 'Horizon : 1-6 mois — Plans mensuels avec points de réévaluation',
      tr: 'Vade: 1-6 ay — Yeniden değerlendirme noktalı aylık planlar',
      es: 'Horizonte: 1-6 meses — Planes mensuales con puntos de reevaluación',
    },
    horizon: { ar: '1-6 أشهر', en: '1-6 months', fr: '1-6 mois', tr: '1-6 ay', es: '1-6 meses' },
    style: { ar: 'تراكم تدريجي مع نقاط مراجعة', en: 'Progressive accumulation with review points', fr: 'Accumulation progressive avec points de revue', tr: 'Gözden geçirme noktalı kademeli birikim', es: 'Acumulación progresiva con puntos de revisión' },
  },
  {
    id: 'long_term',
    name: { ar: 'المستثمر طويل المدى', en: 'Long-Term Investor', fr: 'Investisseur Long Terme', tr: 'Uzun Vadeli Yatırımcı', es: 'Inversionista a Largo Plazo' },
    description: {
      ar: 'أفق زمني: 6 أشهر فأكثر — استراتيجيات هيكلية',
      en: 'Time horizon: 6+ months — Structural strategies',
      fr: 'Horizon : 6 mois et plus — Stratégies structurelles',
      tr: 'Vade: 6+ ay — Yapısal stratejiler',
      es: 'Horizonte: 6+ meses — Estrategias estructurales',
    },
    horizon: { ar: '6 أشهر فأكثر', en: '6+ months', fr: '6 mois et plus', tr: '6 ay ve üzeri', es: '6 meses o más' },
    style: { ar: 'تناوب قطاعي تدريجي وتخصيص طويل الأجل', en: 'Progressive sector rotation and long-term allocation', fr: 'Rotation sectorielle progressive et allocation long terme', tr: 'Kademeli sektör rotasyonu ve uzun vadeli tahsis', es: 'Rotación sectorial progresiva y asignación a largo plazo' },
  },
  {
    id: 'institutional',
    name: { ar: 'المستثمرون المؤسسيون', en: 'Institutional Investors', fr: 'Investisseurs Institutionnels', tr: 'Kurumsal Yatırımcılar', es: 'Inversionistas Institucionales' },
    description: {
      ar: 'أفق زمني: سنوي — استراتيجيات تخصيص رؤوس الأموال الكبرى',
      en: 'Time horizon: Annual — Large capital allocation strategies',
      fr: 'Horizon : Annuel — Stratégies d\'allocation de capitaux importants',
      tr: 'Vade: Yıllık — Büyük sermaye tahsis stratejileri',
      es: 'Horizonte: Anual — Estrategias de asignación de capital grande',
    },
    horizon: { ar: 'سنة فأكثر', en: '1 year+', fr: '1 an et plus', tr: '1 yıl ve üzeri', es: '1 año o más' },
    style: { ar: 'تخصيص استراتيجي ومخاطر مؤسسية', en: 'Strategic allocation and institutional risk management', fr: 'Allocation stratégique et gestion des risques institutionnels', tr: 'Stratejik tahsis ve kurumsal risk yönetimi', es: 'Asignación estratégica y gestión de riesgos institucionales' },
  },
];

// ─── The Canonical Report Sections ──────────────────────────────
// Every report must contain these sections in this exact order.
// The 'priority' field determines if a section can be omitted.

export const MASTER_SECTIONS: MasterSection[] = [
  // ─── 1. HEADER CARD (rendered by UI, not in content) ───
  // This is rendered as a visual card with: confidence, date, sector, type

  // ─── 2. INTRODUCTION ───
  {
    id: 'introduction',
    order: 10,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'مقدمة التقرير',
      en: 'Report Introduction',
      fr: 'Introduction du Rapport',
      tr: 'Rapor Girişi',
      es: 'Introducción del Informe',
    },
    ariaLabel: {
      ar: 'مقدمة التقرير',
      en: 'Report Introduction',
      fr: 'Introduction du Rapport',
      tr: 'Rapor Girişi',
      es: 'Introducción del Informe',
    },
    description: 'Short narrative paragraph (2-3 sentences, max 60 words). Answers: What happened? Why is it important? NO bullet points.',
    minContentLength: 30,
    contentFormat: 'prose',
  },

  // ─── 3. EXECUTIVE SUMMARY ───
  {
    id: 'executiveSummary',
    order: 20,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'الملخص التنفيذي',
      en: 'Executive Summary',
      fr: 'Résumé Exécutif',
      tr: 'Yönetici Özeti',
      es: 'Resumen Ejecutivo',
    },
    ariaLabel: {
      ar: 'الملخص التنفيذي',
      en: 'Executive Summary',
      fr: 'Résumé Exécutif',
      tr: 'Yönetici Özeti',
      es: 'Resumen Ejecutivo',
    },
    description: '5-7 numbered points with quantitative data ONLY (percentages, values, changes). NO narrative or context — numbers and percentages only.',
    minContentLength: 100,
    contentFormat: 'bullets',
  },

  // ─── 4. CONTEXT & BACKGROUND ───
  {
    id: 'context',
    order: 30,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'السياق والخلفية',
      en: 'Context & Background',
      fr: 'Contexte et Antécédents',
      tr: 'Bağlam ve Arka Plan',
      es: 'Contexto y Antecedentes',
    },
    ariaLabel: {
      ar: 'السياق والخلفية',
      en: 'Context and Background',
      fr: 'Contexte et Antécédents',
      tr: 'Bağlam ve Arka Plan',
      es: 'Contexto y Antecedentes',
    },
    description: 'Historical context leading to current situation. How did we get here? What are the underlying factors?',
    minContentLength: 150,
    contentFormat: 'prose',
  },

  // ─── 5. ECONOMIC IMPACT ───
  {
    id: 'economicImpact',
    order: 40,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'الأثر الاقتصادي المباشر',
      en: 'Direct Economic Impact',
      fr: 'Impact Économique Direct',
      tr: 'Doğrudan Ekonomik Etki',
      es: 'Impacto Económico Directo',
    },
    ariaLabel: {
      ar: 'الأثر الاقتصادي المباشر',
      en: 'Direct Economic Impact',
      fr: 'Impact Économique Direct',
      tr: 'Doğrudan Ekonomik Etki',
      es: 'Impacto Económico Directo',
    },
    description: 'Direct economic consequences of the event/situation. Quantified impact on GDP, inflation, trade, etc.',
    minContentLength: 150,
    contentFormat: 'mixed',
  },

  // ─── 6. MARKET IMPACT ───
  {
    id: 'marketImpact',
    order: 50,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'تأثير السوق',
      en: 'Market Impact',
      fr: 'Impact sur le Marché',
      tr: 'Piyasa Etkisi',
      es: 'Impacto en el Mercado',
    },
    ariaLabel: {
      ar: 'تأثير السوق',
      en: 'Market Impact',
      fr: 'Impact sur le Marché',
      tr: 'Piyasa Etkisi',
      es: 'Impacto en el Mercado',
    },
    description: 'Impact on financial markets: stocks, currencies, commodities. Specific price movements and percentage changes.',
    minContentLength: 150,
    contentFormat: 'mixed',
  },

  // ─── 7. SCENARIOS ───
  {
    id: 'scenarios',
    order: 60,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'السيناريوهات',
      en: 'Scenarios',
      fr: 'Scénarios',
      tr: 'Senaryolar',
      es: 'Escenarios',
    },
    ariaLabel: {
      ar: 'السيناريوهات',
      en: 'Scenarios',
      fr: 'Scénarios',
      tr: 'Senaryolar',
      es: 'Escenarios',
    },
    description: 'Exactly 3 scenarios: Bullish/Optimistic (25-35%), Neutral (40-50%), Bearish/Pessimistic (20-30%). Each with: assumptions, expected asset impact, catalysts/risks.',
    minContentLength: 300,
    contentFormat: 'mixed',
  },

  // ─── 8. AFFECTED ASSETS ───
  {
    id: 'affectedAssets',
    order: 70,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'الأصول المتأثرة',
      en: 'Benefiting & Losing Assets',
      fr: 'Actifs Bénéficiaires et Déficitaires',
      tr: 'Kazanan ve Kaybeden Varlıklar',
      es: 'Activos Beneficiarios y Vulnerables',
    },
    ariaLabel: {
      ar: 'الأصول المستفيدة والخاسرة',
      en: 'Benefiting and Losing Assets',
      fr: 'Actifs Bénéficiaires et Déficitaires',
      tr: 'Kazanan ve Kaybeden Varlıklar',
      es: 'Activos Beneficiarios y Vulnerables',
    },
    description: 'Specific assets (stocks, currencies, commodities) that benefit or lose from this situation. With expected percentage moves.',
    minContentLength: 100,
    contentFormat: 'mixed',
  },

  // ─── 9. STRATEGIC RECOMMENDATIONS ───
  {
    id: 'strategicRecommendations',
    order: 80,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'التوصيات الاستراتيجية',
      en: 'Strategic Recommendations',
      fr: 'Recommandations Stratégiques',
      tr: 'Stratejik Öneriler',
      es: 'Recomendaciones Estratégicas',
    },
    ariaLabel: {
      ar: 'التوصيات الاستراتيجية',
      en: 'Strategic Recommendations',
      fr: 'Recommandations Stratégiques',
      tr: 'Stratejik Öneriler',
      es: 'Recomendaciones Estratégicas',
    },
    description: 'Academic/objective analysis: What do the data say? Written in third person. Organized by sectors or categories. NOT directly addressing the reader.',
    minContentLength: 150,
    contentFormat: 'prose',
  },

  // ─── 10. ROUAA RECOMMENDATIONS ───
  {
    id: 'rouaaRecommendations',
    order: 90,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'توصيات رؤى',
      en: 'Rouaa Recommendations',
      fr: 'Recommandations Rouaa',
      tr: 'Rouaa Önerileri',
      es: 'Recomendaciones Rouaa',
    },
    ariaLabel: {
      ar: 'توصيات رؤى',
      en: 'Rouaa Recommendations',
      fr: 'Recommandations Rouaa',
      tr: 'Rouaa Önerileri',
      es: 'Recomendaciones Rouaa',
    },
    description: 'Actionable recommendations by investor profile (Day Trader / Medium-Term / Long-Term / Institutional). Each must include: asset + action + entry + stop + target + allocation + reason.',
    minContentLength: 200,
    contentFormat: 'mixed',
  },

  // ─── 11. FOLLOW-UP INDICATORS ───
  {
    id: 'followUpIndicators',
    order: 100,
    priority: 'mandatory',
    visibility: 'always',
    title: {
      ar: 'مؤشرات المتابعة',
      en: 'Follow-up Indicators',
      fr: 'Indicateurs de Suivi',
      tr: 'Takip Göstergeleri',
      es: 'Indicadores de Seguimiento',
    },
    ariaLabel: {
      ar: 'مؤشرات المتابعة',
      en: 'Follow-up Indicators',
      fr: 'Indicateurs de Suivi',
      tr: 'Takip Göstergeleri',
      es: 'Indicadores de Seguimiento',
    },
    description: 'Key indicators to watch in the coming days/weeks. Specific data releases, events, or thresholds that could change the outlook.',
    minContentLength: 80,
    contentFormat: 'bullets',
  },

  // ─── 12. RISK ASSESSMENT ───
  {
    id: 'riskAssessment',
    order: 110,
    priority: 'recommended',
    visibility: 'always',
    title: {
      ar: 'تقييم المخاطر',
      en: 'Risk Assessment',
      fr: 'Évaluation des Risques',
      tr: 'Risk Değerlendirmesi',
      es: 'Evaluación de Riesgos',
    },
    ariaLabel: {
      ar: 'تقييم المخاطر',
      en: 'Risk Assessment',
      fr: 'Évaluation des Risques',
      tr: 'Risk Değerlendirmesi',
      es: 'Evaluación de Riesgos',
    },
    description: 'Overall risk level with specific risk factors. What could go wrong? Probability assessment.',
    minContentLength: 100,
    contentFormat: 'mixed',
  },

  // ─── 13. EXPERT OPINIONS ───
  {
    id: 'expertOpinions',
    order: 120,
    priority: 'recommended',
    visibility: 'data-driven',
    title: {
      ar: 'آراء الخبراء',
      en: 'Expert Opinions',
      fr: 'Opinions d\'Experts',
      tr: 'Uzman Görüşleri',
      es: 'Opiniones de Expertos',
    },
    ariaLabel: {
      ar: 'آراء الخبراء',
      en: 'Expert Opinions',
      fr: 'Opinions d\'Experts',
      tr: 'Uzman Görüşleri',
      es: 'Opiniones de Expertos',
    },
    description: 'Expert quotes with: name + title + institution + position. If no experts available, write the standard disclaimer.',
    minContentLength: 50,
    contentFormat: 'prose',
  },

  // ─── 14. HISTORICAL CONTEXT ───
  {
    id: 'historicalContext',
    order: 130,
    priority: 'recommended',
    visibility: 'data-driven',
    title: {
      ar: 'السياق التاريخي',
      en: 'Historical Context',
      fr: 'Contexte Historique',
      tr: 'Tarihsel Bağlam',
      es: 'Contexto Histórico',
    },
    ariaLabel: {
      ar: 'السياق التاريخي',
      en: 'Historical Context',
      fr: 'Contexte Historique',
      tr: 'Tarihsel Bağlam',
      es: 'Contexto Histórico',
    },
    description: 'Comparison with past similar events. Must include dates and specific numbers.',
    minContentLength: 80,
    contentFormat: 'prose',
  },

  // ─── 15. OUTLOOK ───
  {
    id: 'outlook',
    order: 140,
    priority: 'recommended',
    visibility: 'always',
    title: {
      ar: 'التوقعات',
      en: 'Outlook',
      fr: 'Perspectives',
      tr: 'Görünüm',
      es: 'Perspectivas',
    },
    ariaLabel: {
      ar: 'التوقعات',
      en: 'Outlook',
      fr: 'Perspectives',
      tr: 'Görünüm',
      es: 'Perspectivas',
    },
    description: 'Forward-looking assessment. What to expect in the short, medium, and long term.',
    minContentLength: 80,
    contentFormat: 'prose',
  },
];

// ─── Report Type Specific Sections ──────────────────────────────
// These sections are added ON TOP of the master sections for
// specific report types.

export const REPORT_TYPE_EXTRA_SECTIONS: Record<string, MasterSection[]> = {
  daily: [
    {
      id: 'keyMovers',
      order: 25,
      priority: 'recommended',
      visibility: 'report-type-specific',
      reportTypes: ['daily'],
      title: { ar: 'المحركات الرئيسية', en: 'Key Movers', fr: 'Moteurs Clés', tr: 'Temel Hareketler', es: 'Motorés Clave' },
      ariaLabel: { ar: 'المحركات الرئيسية', en: 'Key Movers', fr: 'Moteurs Clés', tr: 'Temel Hareketler', es: 'Motorés Clave' },
      description: 'Top 3-5 market movers of the day with specific price changes.',
      minContentLength: 80,
      contentFormat: 'bullets',
    },
    {
      id: 'todayCalendar',
      order: 26,
      priority: 'optional',
      visibility: 'report-type-specific',
      reportTypes: ['daily'],
      title: { ar: 'أحداث اليوم', en: 'Today\'s Events & Corporate News', fr: 'Événements du Jour', tr: 'Bugünkü Etkinlikler ve Kurumsal Haberler', es: 'Eventos del Día y Noticias Corporativas' },
      ariaLabel: { ar: 'أحداث اليوم', en: 'Today\'s Events', fr: 'Événements du Jour', tr: 'Bugünkü Etkinlikler', es: 'Eventos del Día' },
      description: 'Economic calendar events and corporate news scheduled for today.',
      minContentLength: 50,
      contentFormat: 'bullets',
    },
    {
      id: 'tomorrowOutlook',
      order: 145,
      priority: 'optional',
      visibility: 'report-type-specific',
      reportTypes: ['daily'],
      title: { ar: 'توقعات الغد', en: 'Tomorrow\'s Outlook', fr: 'Perspectives du Lendemain', tr: 'Yarının Görünümü', es: 'Perspectivas de Mañana' },
      ariaLabel: { ar: 'توقعات الغد', en: 'Tomorrow\'s Outlook', fr: 'Perspectives du Lendemain', tr: 'Yarının Görünümü', es: 'Perspectivas de Mañana' },
      description: 'What to expect tomorrow based on today\'s market action.',
      minContentLength: 50,
      contentFormat: 'prose',
    },
  ],
  weekly: [
    {
      id: 'weeklyOverview',
      order: 15,
      priority: 'mandatory',
      visibility: 'report-type-specific',
      reportTypes: ['weekly'],
      title: { ar: 'نظرة أسبوعية', en: 'Weekly Overview', fr: 'Aperçu Hebdomadaire', tr: 'Haftalık Genel Bakış', es: 'Resumen Semanal' },
      ariaLabel: { ar: 'نظرة أسبوعية', en: 'Weekly Overview', fr: 'Aperçu Hebdomadaire', tr: 'Haftalık Genel Bakış', es: 'Resumen Semanal' },
      description: 'Summary of the week\'s key developments and their cumulative impact.',
      minContentLength: 150,
      contentFormat: 'prose',
    },
    {
      id: 'sectorPerformance',
      order: 55,
      priority: 'recommended',
      visibility: 'report-type-specific',
      reportTypes: ['weekly'],
      title: { ar: 'أداء القطاعات', en: 'Sector Performance', fr: 'Performance Sectorielle', tr: 'Sektör Performansı', es: 'Rendimiento Sectorial' },
      ariaLabel: { ar: 'أداء القطاعات', en: 'Sector Performance', fr: 'Performance Sectorielle', tr: 'Sektör Performansı', es: 'Rendimiento Sectorial' },
      description: 'Weekly performance comparison across market sectors.',
      minContentLength: 100,
      contentFormat: 'table',
    },
  ],
  monthly: [
    {
      id: 'monthlyForecast',
      order: 145,
      priority: 'recommended',
      visibility: 'report-type-specific',
      reportTypes: ['monthly'],
      title: { ar: 'التوقعات الشهرية', en: 'Monthly Forecast', fr: 'Prévisions Mensuelles', tr: 'Aylık Tahmin', es: 'Pronóstico Mensual' },
      ariaLabel: { ar: 'التوقعات الشهرية', en: 'Monthly Forecast', fr: 'Prévisions Mensuelles', tr: 'Aylık Tahmin', es: 'Pronóstico Mensual' },
      description: 'Month-ahead forecast with key levels to watch.',
      minContentLength: 100,
      contentFormat: 'mixed',
    },
  ],
  quarterly: [
    {
      id: 'quarterlyOverview',
      order: 15,
      priority: 'mandatory',
      visibility: 'report-type-specific',
      reportTypes: ['quarterly'],
      title: { ar: 'نظرة ربع سنوية', en: 'Quarterly Overview', fr: 'Aperçu Trimestriel', tr: 'Üç Aylık Genel Bakış', es: 'Resumen Trimestral' },
      ariaLabel: { ar: 'نظرة ربع سنوية', en: 'Quarterly Overview', fr: 'Aperçu Trimestriel', tr: 'Üç Aylık Genel Bakış', es: 'Resumen Trimestral' },
      description: 'Comprehensive quarterly review of market trends and economic data.',
      minContentLength: 200,
      contentFormat: 'prose',
    },
    {
      id: 'nextQuarterForecast',
      order: 145,
      priority: 'recommended',
      visibility: 'report-type-specific',
      reportTypes: ['quarterly'],
      title: { ar: 'توقعات الربع القادم', en: 'Next Quarter Forecast', fr: 'Prévisions du Prochain Trimestre', tr: 'Gelecek Çeyrek Tahmini', es: 'Pronóstico del Próximo Trimestre' },
      ariaLabel: { ar: 'توقعات الربع القادم', en: 'Next Quarter Forecast', fr: 'Prévisions du Prochain Trimestre', tr: 'Gelecek Çeyrek Tahmini', es: 'Pronóstico del Próximo Trimestre' },
      description: 'Forward-looking quarterly forecast with macro analysis.',
      minContentLength: 150,
      contentFormat: 'mixed',
    },
  ],
  strategic: [
    {
      id: 'eventAnalysis',
      order: 35,
      priority: 'mandatory',
      visibility: 'report-type-specific',
      reportTypes: ['strategic'],
      title: { ar: 'تحليل الحدث', en: 'Event Analysis', fr: 'Analyse de l\'Événement', tr: 'Olay Analizi', es: 'Análisis del Evento' },
      ariaLabel: { ar: 'تحليل الحدث', en: 'Event Analysis', fr: 'Analyse de l\'Événement', tr: 'Olay Analizi', es: 'Análisis del Evento' },
      description: 'Deep-dive into the specific strategic event/topic.',
      minContentLength: 200,
      contentFormat: 'prose',
    },
  ],
};

// ─── Asset Class Specific Sections ──────────────────────────────

export const ASSET_CLASS_EXTRA_SECTIONS: Record<string, MasterSection[]> = {
  energy: [
    {
      id: 'oilAnalysis',
      order: 52,
      priority: 'recommended',
      visibility: 'data-driven',
      assetClasses: ['energy'],
      title: { ar: 'تحليل النفط', en: 'Oil Analysis', fr: 'Analyse du Pétrole', tr: 'Petrol Analizi', es: 'Análisis del Petróleo' },
      ariaLabel: { ar: 'تحليل النفط', en: 'Oil Analysis', fr: 'Analyse du Pétrole', tr: 'Petrol Analizi', es: 'Análisis del Petróleo' },
      description: 'Detailed oil market analysis with WTI and Brent prices.',
      minContentLength: 100,
      contentFormat: 'mixed',
    },
    {
      id: 'gasAnalysis',
      order: 53,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['energy'],
      title: { ar: 'تحليل الغاز', en: 'Gas Analysis', fr: 'Analyse du Gaz', tr: 'Doğal Gaz Analizi', es: 'Análisis del Gas' },
      ariaLabel: { ar: 'تحليل الغاز', en: 'Gas Analysis', fr: 'Analyse du Gaz', tr: 'Doğal Gaz Analizi', es: 'Análisis del Gas' },
      description: 'Natural gas market analysis.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
    {
      id: 'opecImpact',
      order: 54,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['energy'],
      title: { ar: 'تأثير أوبك', en: 'OPEC Impact', fr: 'Impact OPEP', tr: 'OPEC Etkisi', es: 'Impacto de la OPEP' },
      ariaLabel: { ar: 'تأثير أوبك', en: 'OPEC Impact', fr: 'Impact OPEP', tr: 'OPEC Etkisi', es: 'Impacto de la OPEP' },
      description: 'OPEC decisions and their market impact.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
  commodities: [
    {
      id: 'goldAnalysis',
      order: 52,
      priority: 'recommended',
      visibility: 'data-driven',
      assetClasses: ['commodities'],
      title: { ar: 'تحليل الذهب', en: 'Gold & Precious Metals Analysis', fr: 'Analyse de l\'Or et des Métaux Précieux', tr: 'Altın ve Değerli Metaller Analizi', es: 'Análisis del Oro y Metales Preciosos' },
      ariaLabel: { ar: 'تحليل الذهب والمعادن الثمينة', en: 'Gold and Precious Metals Analysis', fr: 'Analyse de l\'Or et des Métaux Précieux', tr: 'Altın ve Değerli Metaller Analizi', es: 'Análisis del Oro y Metales Preciosos' },
      description: 'Gold, silver, and precious metals market analysis.',
      minContentLength: 100,
      contentFormat: 'mixed',
    },
    {
      id: 'industrialMetals',
      order: 53,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['commodities'],
      title: { ar: 'المعادن الصناعية', en: 'Industrial Metals Analysis', fr: 'Analyse des Métaux Industriels', tr: 'Endüstriyel Metaller Analizi', es: 'Análisis de Metales Industriales' },
      ariaLabel: { ar: 'تحليل المعادن الصناعية', en: 'Industrial Metals Analysis', fr: 'Analyse des Métaux Industriels', tr: 'Endüstriyel Metaller Analizi', es: 'Análisis de Metales Industriales' },
      description: 'Copper, aluminum, and industrial metals analysis.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
    {
      id: 'dollarImpact',
      order: 54,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['commodities'],
      title: { ar: 'تأثير الدولار', en: 'Dollar Impact on Commodities', fr: 'Impact du Dollar sur les Matières Premières', tr: 'Doların Emtialara Etkisi', es: 'Impacto del Dólar en Materias Primas' },
      ariaLabel: { ar: 'تأثير الدولار على السلع', en: 'Dollar Impact on Commodities', fr: 'Impact du Dollar sur les Matières Premières', tr: 'Doların Emtialara Etkisi', es: 'Impacto del Dólar en Materias Primas' },
      description: 'How dollar movements affect commodity prices.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
  bonds: [
    {
      id: 'yieldCurveAnalysis',
      order: 52,
      priority: 'recommended',
      visibility: 'data-driven',
      assetClasses: ['bonds'],
      title: { ar: 'تحليل منحنى العائد', en: 'Yield Curve Analysis', fr: 'Analyse de la Courbe des Taux', tr: 'Verim Eğrisi Analizi', es: 'Análisis de la Curva de Rendimientos' },
      ariaLabel: { ar: 'تحليل منحنى العائد', en: 'Yield Curve Analysis', fr: 'Analyse de la Courbe des Taux', tr: 'Verim Eğrisi Analizi', es: 'Análisis de la Curva de Rendimientos' },
      description: 'Yield curve shape analysis and implications.',
      minContentLength: 100,
      contentFormat: 'mixed',
    },
    {
      id: 'creditSpreads',
      order: 53,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['bonds'],
      title: { ar: 'فروقات الائتمان', en: 'Credit Spreads', fr: 'Spreads de Crédit', tr: 'Kredi Spreadleri', es: 'Spreads de Crédito' },
      ariaLabel: { ar: 'فروقات الائتمان', en: 'Credit Spreads', fr: 'Spreads de Crédit', tr: 'Kredi Spreadleri', es: 'Spreads de Crédito' },
      description: 'Credit spread analysis and risk appetite indicators.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
  crypto: [
    {
      id: 'btcDominance',
      order: 52,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['crypto'],
      title: { ar: 'هيمنة بيتكوين', en: 'BTC Dominance', fr: 'Dominance BTC', tr: 'BTC Hakimiyeti', es: 'Dominancia de BTC' },
      ariaLabel: { ar: 'هيمنة بيتكوين', en: 'BTC Dominance', fr: 'Dominance BTC', tr: 'BTC Hakimiyeti', es: 'Dominancia de BTC' },
      description: 'Bitcoin dominance analysis and altcoin market dynamics.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
  forex: [
    {
      id: 'currencyPairsAnalysis',
      order: 52,
      priority: 'recommended',
      visibility: 'data-driven',
      assetClasses: ['forex'],
      title: { ar: 'تحليل أزواج العملات', en: 'Currency Pairs Analysis', fr: 'Analyse des Paires de Devises', tr: 'Döviz Çiftleri Analizi', es: 'Análisis de Pares de Divisas' },
      ariaLabel: { ar: 'تحليل أزواج العملات', en: 'Currency Pairs Analysis', fr: 'Analyse des Paires de Devises', tr: 'Döviz Çiftleri Analizi', es: 'Análisis de Pares de Divisas' },
      description: 'Detailed analysis of major, minor, and exotic currency pairs.',
      minContentLength: 100,
      contentFormat: 'mixed',
    },
  ],
  banking: [
    {
      id: 'bankEarnings',
      order: 52,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['banking'],
      title: { ar: 'أرباح البنوك', en: 'Bank Earnings', fr: 'Résultats Bancaires', tr: 'Banka Kazançları', es: 'Resultados Bancarios' },
      ariaLabel: { ar: 'أرباح البنوك', en: 'Bank Earnings', fr: 'Résultats Bancaires', tr: 'Banka Kazançları', es: 'Resultados Bancarios' },
      description: 'Bank earnings analysis and sector performance.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
    {
      id: 'islamicBanking',
      order: 53,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['banking'],
      title: { ar: 'البنوك الإسلامية', en: 'Islamic Banking', fr: 'Banque Islamique', tr: 'İslami Bankacılık', es: 'Banca Islámica' },
      ariaLabel: { ar: 'البنوك الإسلامية', en: 'Islamic Banking', fr: 'Banque Islamique', tr: 'İslami Bankacılık', es: 'Banca Islámica' },
      description: 'Islamic banking sector analysis.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
  realEstate: [
    {
      id: 'residentialMarket',
      order: 52,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['realEstate'],
      title: { ar: 'السوق السكني', en: 'Residential Market', fr: 'Marché Résidentiel', tr: 'Konut Piyasası', es: 'Mercado Residencial' },
      ariaLabel: { ar: 'السوق السكني', en: 'Residential Market', fr: 'Marché Résidentiel', tr: 'Konut Piyasası', es: 'Mercado Residencial' },
      description: 'Residential real estate market analysis.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
    {
      id: 'reitsPerformance',
      order: 53,
      priority: 'optional',
      visibility: 'data-driven',
      assetClasses: ['realEstate'],
      title: { ar: 'أداء صناديق الاستثمار', en: 'REITs Performance', fr: 'Performance OPCI', tr: 'GYO Performansı', es: 'Rendimiento de SOCIMI' },
      ariaLabel: { ar: 'أداء صناديق الاستثمار العقاري', en: 'REITs Performance', fr: 'Performance OPCI', tr: 'GYO Performansı', es: 'Rendimiento de SOCIMI' },
      description: 'REITs/OPCI performance analysis.',
      minContentLength: 80,
      contentFormat: 'mixed',
    },
  ],
};

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Get all sections for a specific report type and asset class.
 * Returns master sections + report-type extras + asset-class extras,
 * sorted by order.
 */
export function getSectionsForReport(
  reportType: string,
  assetClass?: string,
): MasterSection[] {
  const sections = [...MASTER_SECTIONS];

  // Add report-type specific sections
  const typeExtras = REPORT_TYPE_EXTRA_SECTIONS[reportType] || [];
  sections.push(...typeExtras);

  // Add asset-class specific sections
  if (assetClass) {
    const assetExtras = ASSET_CLASS_EXTRA_SECTIONS[assetClass] || [];
    sections.push(...assetExtras);
  }

  // Sort by order
  return sections.sort((a, b) => a.order - b.order);
}

/**
 * Get the localized title for a section.
 */
export function getSectionTitle(sectionId: string, locale: Locale): string {
  const section = MASTER_SECTIONS.find(s => s.id === sectionId)
    || Object.values(REPORT_TYPE_EXTRA_SECTIONS).flat().find(s => s.id === sectionId)
    || Object.values(ASSET_CLASS_EXTRA_SECTIONS).flat().find(s => s.id === sectionId);

  return section?.title[locale] || section?.title.en || sectionId;
}

/**
 * Get the localized investor profile name.
 */
export function getInvestorProfileName(profileId: string, locale: Locale): string {
  const profile = INVESTOR_PROFILES.find(p => p.id === profileId);
  return profile?.name[locale] || profile?.name.en || profileId;
}

/**
 * Get all investor profile names for a locale.
 */
export function getAllInvestorProfileNames(locale: Locale): Record<string, string> {
  const result: Record<string, string> = {};
  for (const profile of INVESTOR_PROFILES) {
    result[profile.id] = profile.name[locale];
  }
  return result;
}

/**
 * Validate that a report's content conforms to the master template.
 * Returns a list of validation errors (empty = valid).
 */
export function validateReportStructure(
  reportSections: Record<string, string>,
  reportType: string,
  assetClass?: string,
): { errors: string[]; warnings: string[]; coverage: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const templateSections = getSectionsForReport(reportType, assetClass);

  let mandatoryPresent = 0;
  let mandatoryTotal = 0;

  for (const template of templateSections) {
    if (template.priority !== 'mandatory') continue;
    mandatoryTotal++;

    const content = reportSections[template.id];
    if (!content || content.trim().length === 0) {
      errors.push(`Missing mandatory section: ${template.id} (${template.title.en})`);
      continue;
    }
    if (content.trim().length < template.minContentLength) {
      warnings.push(`Section ${template.id} is too short (${content.trim().length} chars, min ${template.minContentLength})`);
    }
    mandatoryPresent++;
  }

  // Check for sections not in the template
  const templateIds = new Set(templateSections.map(s => s.id));
  const KNOWN_FLEXIBLE_KEYS = new Set([
    'highlights', 'keyPoints', 'mainFindings', 'rawContent',
    'overview', 'detailedAnalysis', 'keyFindings',
  ]);
  for (const key of Object.keys(reportSections)) {
    if (!templateIds.has(key) && !KNOWN_FLEXIBLE_KEYS.has(key)) {
      warnings.push(`Unknown section key: ${key}`);
    }
  }

  const coverage = mandatoryTotal > 0 ? Math.round((mandatoryPresent / mandatoryTotal) * 100) : 0;

  return { errors, warnings, coverage };
}

/**
 * Get the master template as a JSON object for documentation/AI prompt injection.
 */
export function getMasterTemplateJSON(
  reportType: string,
  assetClass?: string,
  locale: Locale = 'en',
): Record<string, any> {
  const sections = getSectionsForReport(reportType, assetClass);
  return {
    version: '1.0',
    reportType,
    assetClass: assetClass || 'general',
    locale,
    investorProfiles: INVESTOR_PROFILES.map(p => ({
      id: p.id,
      name: p.name[locale],
      horizon: p.horizon[locale],
      style: p.style[locale],
    })),
    sections: sections.map(s => ({
      id: s.id,
      order: s.order,
      title: s.title[locale],
      priority: s.priority,
      description: s.description,
      minContentLength: s.minContentLength,
      contentFormat: s.contentFormat,
    })),
  };
}
