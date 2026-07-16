'use client';

import { useState, useEffect, useMemo } from 'react';
import { getLocalePath } from '@/lib/locale';
import {
  calculateSupplyChainResilience,
  getTrackedCountries,
  type SupplyChainResilience,
} from '@/lib/geopolitical/supply-chain-resilience';
import {
  TRADE_ROUTES,
  getDisruptedRoutes,
  getTotalTradeAtRisk,
  getTotalOilTradeAtRisk,
  getRouteStatusColor,
  type TradeRoute,
} from '@/lib/geopolitical/trade-routes-data';
import { getCountryName } from '@/lib/geopolitical/geojson-countries';

/* ══════════════════════════════════════════════════════════════════════
   GeopoliticalRisksHomeSection — 4 cards below stock cards
   Same layout/size as StockCompanyAnalysisSection (glass-card columns).

   Cards:
   1. مؤشر مرونة سلاسل التوريد — Supply Chain Resilience Index
   2. أحدث التحليلات — Latest Geopolitical Analyses
   3. حالة الطرق التجارية — Trade Routes Status
   4. تدفقات النفط العالمية — Global Oil Flows

   Supports 5 locales: ar, en, fr, tr, es
   ══════════════════════════════════════════════════════════════════════ */

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

// ── Labels ──
const LABELS: Record<Locale, Record<string, string>> = {
  ar: {
    sectionTitle: 'المخاطر الجيوسياسية',
    sectionTag: 'رصد وتحليل المخاطر العالمية',
    viewAll: 'عرض الكل',
    arrowLeft: '←',

    // Card 1: Supply Chain Resilience
    supplyChainTitle: 'مرونة سلاسل التوريد',
    supplyChainSubtitle: 'مؤشر مرونة سلاسل التوريد العالمية',
    compositeScore: 'الدرجة المركبة',
    riskLevel: 'مستوى المخاطر',
    critical: 'حرج',
    low: 'منخفض',
    moderate: 'معتدل',
    high: 'مرتفع',
    hhi: 'تركيز نقاط الاختناق',
    alternativeScore: 'مسارات بديلة',
    adaptationCapacity: 'قدرة التكيف',
    noData: 'لا توجد بيانات',

    // Card 2: Latest Analyses
    analysesTitle: 'أحدث التحليلات',
    analysesSubtitle: 'تحليلات المخاطر الجيوسياسية',
    riskScore: 'درجة المخاطر',
    affectedAssets: 'الأصول المتأثرة',
    loading: 'جاري التحميل...',
    noAnalyses: 'لا توجد تحليلات متاحة',

    // Card 3: Trade Routes Status
    tradeRoutesTitle: 'حالة الطرق التجارية',
    tradeRoutesSubtitle: 'نقاط الاختناق العالمية',
    statusNormal: 'طبيعي',
    statusDisrupted: 'معطّل',
    statusThreatened: 'مهدّد',
    statusBlocked: 'مغلق',
    disruptionRisk: 'خطر التعطيل',
    globalShare: 'الحصة العالمية',
    noRoutes: 'لا توجد بيانات طرق',

    // Card 4: Oil Flows
    oilFlowsTitle: 'تدفقات النفط العالمية',
    oilFlowsSubtitle: 'حركة النفط عبر الممرات الحيوية',
    oilShare: 'حصة النفط',
    dailyVolume: 'الحجم اليومي',
    tradeAtRisk: 'التجارة المهددة',
    oilAtRisk: 'النفط المهدد',
    routes: 'طرق',
  },
  en: {
    sectionTitle: 'Geopolitical Risks',
    sectionTag: 'Global risk monitoring & analysis',
    viewAll: 'View All',
    arrowLeft: '→',

    supplyChainTitle: 'Supply Chain Resilience',
    supplyChainSubtitle: 'Global supply chain resilience index',
    compositeScore: 'Composite Score',
    riskLevel: 'Risk Level',
    critical: 'Critical',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    hhi: 'Chokepoint Concentration',
    alternativeScore: 'Alternative Routes',
    adaptationCapacity: 'Adaptation Capacity',
    noData: 'No data',

    analysesTitle: 'Latest Analyses',
    analysesSubtitle: 'Geopolitical risk analyses',
    riskScore: 'Risk Score',
    affectedAssets: 'Affected Assets',
    loading: 'Loading...',
    noAnalyses: 'No analyses available',

    tradeRoutesTitle: 'Trade Routes Status',
    tradeRoutesSubtitle: 'Global chokepoints',
    statusNormal: 'Normal',
    statusDisrupted: 'Disrupted',
    statusThreatened: 'Threatened',
    statusBlocked: 'Blocked',
    disruptionRisk: 'Disruption Risk',
    globalShare: 'Global Share',
    noRoutes: 'No route data',

    oilFlowsTitle: 'Global Oil Flows',
    oilFlowsSubtitle: 'Oil movement through vital corridors',
    oilShare: 'Oil Share',
    dailyVolume: 'Daily Volume',
    tradeAtRisk: 'Trade at Risk',
    oilAtRisk: 'Oil at Risk',
    routes: 'routes',
  },
  fr: {
    sectionTitle: 'Risques Géopolitiques',
    sectionTag: 'Surveillance et analyse des risques mondiaux',
    viewAll: 'Voir Tout',
    arrowLeft: '→',

    supplyChainTitle: 'Résilience Chaîne d\'Approvisionnement',
    supplyChainSubtitle: 'Indice de résilience mondial',
    compositeScore: 'Score Composite',
    riskLevel: 'Niveau de Risque',
    critical: 'Critique',
    low: 'Faible',
    moderate: 'Modéré',
    high: 'Élevé',
    hhi: 'Concentration Goulots',
    alternativeScore: 'Routes Alternatives',
    adaptationCapacity: 'Capacité d\'Adaptation',
    noData: 'Aucune donnée',

    analysesTitle: 'Dernières Analyses',
    analysesSubtitle: 'Analyses des risques géopolitiques',
    riskScore: 'Score de Risque',
    affectedAssets: 'Actifs Affectés',
    loading: 'Chargement...',
    noAnalyses: 'Aucune analyse disponible',

    tradeRoutesTitle: 'État des Routes Commerciales',
    tradeRoutesSubtitle: 'Goulots d\'étranglement mondiaux',
    statusNormal: 'Normal',
    statusDisrupted: 'Perturbé',
    statusThreatened: 'Menacé',
    statusBlocked: 'Bloqué',
    disruptionRisk: 'Risque de Perturbation',
    globalShare: 'Part Mondiale',
    noRoutes: 'Aucune donnée de route',

    oilFlowsTitle: 'Flux Pétroliers Mondiaux',
    oilFlowsSubtitle: 'Mouvement du pétrole via les couloirs vitaux',
    oilShare: 'Part Pétrolière',
    dailyVolume: 'Volume Quotidien',
    tradeAtRisk: 'Commerce Menacé',
    oilAtRisk: 'Pétrole Menacé',
    routes: 'routes',
  },
  tr: {
    sectionTitle: 'Jeopolitik Riskler',
    sectionTag: 'Küresel risk izleme ve analizi',
    viewAll: 'Tümünü Görüntüle',
    arrowLeft: '→',

    supplyChainTitle: 'Tedarik Zinciri Dayanıklılığı',
    supplyChainSubtitle: 'Küresel tedarik zinciri dayanıklılık endeksi',
    compositeScore: 'Bileşik Skor',
    riskLevel: 'Risk Seviyesi',
    critical: 'Kritik',
    low: 'Düşük',
    moderate: 'Orta',
    high: 'Yüksek',
    hhi: 'Darboğaz Konsantrasyonu',
    alternativeScore: 'Alternatif Rotalar',
    adaptationCapacity: 'Uyum Kapasitesi',
    noData: 'Veri yok',

    analysesTitle: 'Son Analizler',
    analysesSubtitle: 'Jeopolitik risk analizleri',
    riskScore: 'Risk Skoru',
    affectedAssets: 'Etkilenen Varlıklar',
    loading: 'Yükleniyor...',
    noAnalyses: 'Analiz mevcut değil',

    tradeRoutesTitle: 'Ticaret Yolları Durumu',
    tradeRoutesSubtitle: 'Küresel darboğazlar',
    statusNormal: 'Normal',
    statusDisrupted: 'Bozuk',
    statusThreatened: 'Tehdit Altında',
    statusBlocked: 'Engelli',
    disruptionRisk: 'Bozulma Riski',
    globalShare: 'Küresel Pay',
    noRoutes: 'Rota verisi yok',

    oilFlowsTitle: 'Küresel Petrol Akışları',
    oilFlowsSubtitle: 'Hayati koridorlardan petrol hareketi',
    oilShare: 'Petrol Payı',
    dailyVolume: 'Günlük Hacim',
    tradeAtRisk: 'Risk Altındaki Ticaret',
    oilAtRisk: 'Risk Altındaki Petrol',
    routes: 'rota',
  },
  es: {
    sectionTitle: 'Riesgos Geopolíticos',
    sectionTag: 'Monitoreo y análisis de riesgos globales',
    viewAll: 'Ver Todo',
    arrowLeft: '→',

    supplyChainTitle: 'Resiliencia Cadena de Suministro',
    supplyChainSubtitle: 'Índice de resiliencia global',
    compositeScore: 'Puntuación Compuesta',
    riskLevel: 'Nivel de Riesgo',
    critical: 'Crítico',
    low: 'Bajo',
    moderate: 'Moderado',
    high: 'Alto',
    hhi: 'Concentración Cuellos de Botella',
    alternativeScore: 'Rutas Alternativas',
    adaptationCapacity: 'Capacidad de Adaptación',
    noData: 'Sin datos',

    analysesTitle: 'Últimos Análisis',
    analysesSubtitle: 'Análisis de riesgos geopolíticos',
    riskScore: 'Puntuación de Riesgo',
    affectedAssets: 'Activos Afectados',
    loading: 'Cargando...',
    noAnalyses: 'No hay análisis disponibles',

    tradeRoutesTitle: 'Estado Rutas Comerciales',
    tradeRoutesSubtitle: 'Cuellos de botella globales',
    statusNormal: 'Normal',
    statusDisrupted: 'Disruptido',
    statusThreatened: 'Amenazado',
    statusBlocked: 'Bloqueado',
    disruptionRisk: 'Riesgo de Disrupción',
    globalShare: 'Participación Global',
    noRoutes: 'Sin datos de rutas',

    oilFlowsTitle: 'Flujos Petroleros Globales',
    oilFlowsSubtitle: 'Movimiento de petróleo por corredores vitales',
    oilShare: 'Participación Petrolera',
    dailyVolume: 'Volumen Diario',
    tradeAtRisk: 'Comercio en Riesgo',
    oilAtRisk: 'Petróleo en Riesgo',
    routes: 'rutas',
  },
};

// ── Status Config ──
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; labelKey: string }> = {
  normal:     { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', labelKey: 'statusNormal' },
  disrupted:  { color: '#ef4444', bg: 'rgba(239,68,80,0.1)', border: 'rgba(239,68,80,0.25)', labelKey: 'statusDisrupted' },
  threatened: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', labelKey: 'statusThreatened' },
  blocked:    { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)', labelKey: 'statusBlocked' },
};

const RISK_LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string; labelKey: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,80,0.1)', border: 'rgba(239,68,80,0.25)', labelKey: 'critical' },
  low:      { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', labelKey: 'low' },
  moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', labelKey: 'moderate' },
  high:     { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', labelKey: 'high' },
};

interface GeopoliticalRisksHomeSectionProps {
  locale?: Locale;
}

// ── Skeleton Row ──
function SkeletonRow({ w = '60%' }: { w?: string }) {
  return <div className="skeleton" style={{ width: w, height: 14, borderRadius: 'var(--r)', marginBottom: 10 }} />;
}

// ════════════════════════════════════════════════════════════════════
// Card 1: Supply Chain Resilience Index
// ════════════════════════════════════════════════════════════════════
function SupplyChainCard({ locale }: { locale: Locale }) {
  const t = LABELS[locale];
  const [data, setData] = useState<SupplyChainResilience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tracked = getTrackedCountries();
    const results = tracked.slice(0, 5).map(code => calculateSupplyChainResilience(code));
    setData(results);
    setLoading(false);
  }, []);

  return (
    <div className="glass-card" style={{
      background: 'var(--bg2)', borderRadius: 'var(--r2)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 24px rgba(236,72,153,0.06)',
    }}>
      <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{t.supplyChainTitle}</span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t.supplyChainSubtitle}</span>
            </div>
          </div>
          <a href={`${getLocalePath(locale)}/geopolitical-risks`} style={{ fontSize: 12, color: '#EC4899', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
            {t.viewAll} {t.arrowLeft}
          </a>
        </div>

        {/* Country items */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : data.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {data.map((item) => {
              const cfg = RISK_LEVEL_CONFIG[item.riskLevel] || RISK_LEVEL_CONFIG.moderate;
              const countryName = getCountryName(item.countryCode, locale);
              return (
                <div key={item.countryCode} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 'var(--r)',
                  background: 'var(--bg4)',
                  borderInlineStart: `3px solid ${cfg.color}`,
                  transition: 'background .15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)', minWidth: 60 }}>
                    {countryName}
                  </span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Score bar */}
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg4)', overflow: 'hidden' }}>
                      <div style={{ width: `${item.compositeScore}%`, height: '100%', borderRadius: 2, background: cfg.color, transition: 'width .5s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, fontFamily: 'var(--font-jetbrains-mono), monospace', minWidth: 24, textAlign: 'right' as const }}>
                      {item.compositeScore}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {t[cfg.labelKey as keyof typeof t]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)' }}>{t.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Card 2: Latest Geopolitical Analyses
// ════════════════════════════════════════════════════════════════════
interface GeoRiskItem {
  id: string;
  title: string;
  slug: string;
  riskCategory: string;
  riskLevel: string; // low | moderate | elevated | high | severe
  riskScore: number;
  // affectedAssets may come as string[] OR as {symbol,impact,direction}[] from the API.
  affectedAssets: any[] | null;
  publishedAt: string;
}

function LatestAnalysesCard({ locale }: { locale: Locale }) {
  const t = LABELS[locale];
  const [risks, setRisks] = useState<GeoRiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRisks() {
      try {
        const res = await fetch(`/api/geopolitical-risks?locale=${locale}&limit=5`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        // V1043: API returns { data: [...], pagination: {...} } — NOT { risks: [...] }.
        // Previously we read data.risks which is always undefined, so the card
        // always showed "no analyses available" even when the DB had data.
        const list = data?.data ?? data?.risks ?? [];
        if (mounted && Array.isArray(list)) setRisks(list);
      } catch {
        // Silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRisks();
    return () => { mounted = false; };
  }, [locale]);

  const RISK_CATEGORY_ICONS: Record<string, string> = {
    conflict: '⚔️', sanctions: '🛡️', energy: '⛽', trade: '🚢',
    political: '🏛️', military: '🎖️', cyber: '💻', climate: '🌡️',
  };

  return (
    <div className="glass-card" style={{
      background: 'var(--bg2)', borderRadius: 'var(--r2)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 24px rgba(245,158,11,0.06)',
    }}>
      <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{t.analysesTitle}</span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t.analysesSubtitle}</span>
            </div>
          </div>
          <a href={`${getLocalePath(locale)}/geopolitical-risks/reports`} style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
            {t.viewAll} {t.arrowLeft}
          </a>
        </div>

        {/* Risk items */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : risks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {risks.map((risk) => {
              // V1043: schema riskLevel values are: low | moderate | elevated | high | severe
              const levelColor = risk.riskLevel === 'severe' || risk.riskLevel === 'critical' ? '#ef4444' :
                risk.riskLevel === 'high' ? '#f97316' :
                risk.riskLevel === 'elevated' ? '#f59e0b' :
                risk.riskLevel === 'moderate' ? '#eab308' : '#22c55e';
              const icon = RISK_CATEGORY_ICONS[risk.riskCategory] || '🌍';
              // V1043: affectedAssets may be string[] OR {symbol,impact,direction}[]. Extract a readable label.
              const assetLabels: string[] = Array.isArray(risk.affectedAssets)
                ? risk.affectedAssets.slice(0, 2).map((a: any) => {
                    if (typeof a === 'string') return a;
                    if (a && typeof a === 'object') return a.symbol || a.name || a.asset || '';
                    return '';
                  }).filter(Boolean)
                : [];
              return (
                <a
                  key={risk.id}
                  href={`${getLocalePath(locale)}/geopolitical-risks/${risk.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 'var(--r)',
                    background: 'var(--bg4)',
                    borderInlineStart: `3px solid ${levelColor}`,
                    textDecoration: 'none',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text-head)',
                      display: '-webkit-box' as const, WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                      lineHeight: 1.4,
                    }}>
                      {risk.title}
                    </span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                      {/* V1053: Mini risk gauge bar */}
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--bg3)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: `${risk.riskScore}%`, height: '100%', borderRadius: 2, background: levelColor, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: levelColor, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        {risk.riskScore}
                      </span>
                      {assetLabels.length > 0 && (
                        <span style={{ fontSize: 9, color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {assetLabels.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={levelColor} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </a>
              );
            })}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)' }}>{t.noAnalyses}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Card 3: Trade Routes Status
// ════════════════════════════════════════════════════════════════════
function TradeRoutesCard({ locale }: { locale: Locale }) {
  const t = LABELS[locale];

  const routes = TRADE_ROUTES.slice(0, 5).map(route => ({
    ...route,
    name: route.nameAr && locale === 'ar' ? route.nameAr :
          route.nameEn && locale === 'en' ? route.nameEn :
          route.nameFr && locale === 'fr' ? route.nameFr :
          route.nameTr && locale === 'tr' ? route.nameTr :
          route.nameEs && locale === 'es' ? route.nameEs : route.nameEn,
    dailyVol: route.dailyVolume[locale] || route.dailyVolume.en,
  }));

  return (
    <div className="glass-card" style={{
      background: 'var(--bg2)', borderRadius: 'var(--r2)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 24px rgba(6,182,212,0.06)',
    }}>
      <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{t.tradeRoutesTitle}</span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t.tradeRoutesSubtitle}</span>
            </div>
          </div>
          <a href={`${getLocalePath(locale)}/geopolitical-risks/trade-routes`} style={{ fontSize: 12, color: '#06B6D4', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
            {t.viewAll} {t.arrowLeft}
          </a>
        </div>

        {/* Route items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {routes.map((route) => {
            const sc = STATUS_CONFIG[route.status] || STATUS_CONFIG.normal;
            return (
              <div key={route.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 'var(--r)',
                background: 'var(--bg4)',
                borderInlineStart: `3px solid ${sc.color}`,
                transition: 'background .15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>
                      {route.name}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {t[sc.labelKey as keyof typeof t]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 9, color: 'var(--text4)' }}>{t.globalShare}: {route.globalTradeShare}%</span>
                    <span style={{ fontSize: 9, color: 'var(--text4)' }}>{t.disruptionRisk}: {route.disruptionRisk}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Card 4: Global Oil Flows
// ════════════════════════════════════════════════════════════════════
function OilFlowsCard({ locale }: { locale: Locale }) {
  const t = LABELS[locale];



  // Sort routes by oil trade share (descending)
  const oilRoutes = useMemo(() =>
    [...TRADE_ROUTES].sort((a, b) => b.oilTradeShare - a.oilTradeShare).map(route => ({
      ...route,
      name: route.nameAr && locale === 'ar' ? route.nameAr :
            route.nameEn && locale === 'en' ? route.nameEn :
            route.nameFr && locale === 'fr' ? route.nameFr :
            route.nameTr && locale === 'tr' ? route.nameTr :
            route.nameEs && locale === 'es' ? route.nameEs : route.nameEn,
      dailyVol: route.dailyVolume[locale] || route.dailyVolume.en,
    })),
    [locale]
  );

  const tradeAtRisk = getTotalTradeAtRisk();
  const oilAtRisk = getTotalOilTradeAtRisk();
  const disruptedCount = getDisruptedRoutes().length;

  return (
    <div className="glass-card" style={{
      background: 'var(--bg2)', borderRadius: 'var(--r2)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 24px rgba(34,197,94,0.06)',
    }}>
      <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22V8l6-6 6 6v14" /><path d="M15 22v-4a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v4" /><circle cx="18" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{t.oilFlowsTitle}</span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{t.oilFlowsSubtitle}</span>
            </div>
          </div>
          <a href={`${getLocalePath(locale)}/geopolitical-risks/trade-routes`} style={{ fontSize: 12, color: '#22C55E', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>
            {t.viewAll} {t.arrowLeft}
          </a>
        </div>

        {/* Summary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
          marginBottom: 10, padding: '8px 10px', borderRadius: 'var(--r)',
          background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.08)',
        }}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--bull)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              {tradeAtRisk}%
            </div>
            <div style={{ fontSize: 8, color: 'var(--text4)', fontWeight: 600 }}>{t.tradeAtRisk}</div>
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              {oilAtRisk}%
            </div>
            <div style={{ fontSize: 8, color: 'var(--text4)', fontWeight: 600 }}>{t.oilAtRisk}</div>
          </div>
        </div>

        {/* Oil route items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {oilRoutes.slice(0, 4).map((route) => {
            const sc = STATUS_CONFIG[route.status] || STATUS_CONFIG.normal;
            return (
              <div key={route.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 'var(--r)',
                background: 'var(--bg4)',
                borderInlineStart: `3px solid ${sc.color}`,
                transition: 'background .15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-head)' }}>
                      {route.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                      {route.oilTradeShare}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    {/* Oil share bar */}
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--bg4)', overflow: 'hidden' }}>
                      <div style={{ width: `${route.oilTradeShare}%`, height: '100%', borderRadius: 2, background: sc.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 8, color: 'var(--text4)', marginTop: 1, display: 'block' }}>
                    {route.dailyVol}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════
export default function QuickInsightCards({ locale = 'ar' }: GeopoliticalRisksHomeSectionProps) {
  const t = LABELS[locale];

  return (
    <section style={{ marginBottom: 'var(--space-lg)' }}>
      {/* Section Header — same style as StockCompanyAnalysisSection */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 4, height: 22, borderRadius: 2,
            background: 'linear-gradient(180deg, #EC4899, #F59E0B)',
            boxShadow: '0 0 12px rgba(236,72,153,.35)',
          }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)', letterSpacing: 0.3 }}>{t.sectionTitle}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginRight: 4, marginLeft: 4 }}>{t.sectionTag}</span>
          </div>
        </div>
        <a href={`${getLocalePath(locale)}/geopolitical-risks`} style={{ background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.25)', borderRadius: 'var(--r)', padding: '4px 12px', color: '#EC4899', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s' }}>
          {t.viewAll} {t.arrowLeft}
        </a>
      </div>

      {/* 4-column grid — same layout style as stock cards */}
      <div className="geo-risks-grid-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}>
        <SupplyChainCard locale={locale} />
        <LatestAnalysesCard locale={locale} />
        <TradeRoutesCard locale={locale} />
        <OilFlowsCard locale={locale} />
      </div>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1100px) {
          .geo-risks-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .geo-risks-grid-4 {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />
    </section>
  );
}
