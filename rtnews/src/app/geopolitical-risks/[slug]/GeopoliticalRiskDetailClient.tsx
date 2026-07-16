'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';
import { stripMarkdownHeadings, truncateAtBoundary } from '@/lib/clean-markdown';
import GeopoliticalRiskBadge from '@/components/geopolitical/GeopoliticalRiskBadge';
import GeopoliticalNewsReports from '@/components/home/GeopoliticalNewsReports';

// ─── Types ──────────────────────────────────────────────────────

interface RiskDetail {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  locale: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  aiGprScore: number | null;
  acledEventCount: number;
  acledFatalityCount: number;
  worldBankStability: number | null;
  gdeltTone: number | null;
  affectedRegions: string[];
  affectedCountries: any[];
  affectedAssets: any[];
  scenarios: any;
  tradeRoutes: any[];
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  sourceUrls: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RelatedRisk {
  id: string;
  title: string;
  slug: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  imageUrl: string | null;
  publishedAt: string | null;
}

interface Props {
  risk: RiskDetail;
  related: RelatedRisk[];
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ─── V1054: Multilingual labels ────────────────────────────────
type GeoLocale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

const I18N: Record<GeoLocale, {
  dir: 'rtl' | 'ltr';
  categoryLabels: Record<string, string>;
  categoryIcons: Record<string, string>;
  backLink: string;
  riskLevel: string;
  aiGpr: string;
  events: string;
  published: string;
  tabs: { analysis: string; scenarios: string; assets: string; routes: string; recommendations: string };
  scenarioLabels: [string, string, string];
  scenarioIcons: [string, string, string];
  redHerringTitle: string;
  redHerringText: string;
  assetsTitle: string;
  bullish: string;
  bearish: string;
  neutral: string;
  routesTitle: string;
  statusStable: string;
  statusThreatened: string;
  statusDisrupted: string;
  statusBlocked: string;
  recTitle: string;
  recConservative: string;
  recModerate: string;
  recActive: string;
  riskMetrics: string;
  affectedCountries: string;
  affectedRegions: string;
  sources: string;
  relatedTitle: string;
  noContent: string;
}> = {
  ar: {
    dir: 'rtl',
    categoryLabels: { conflict: 'نزاعات', trade: 'تجارة', energy: 'طاقة', political: 'سياسي', cyber: 'سيبراني', sanctions: 'عقوبات', climate: 'مناخي' },
    categoryIcons: { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' },
    backLink: 'العودة للمخاطر الجيوسياسية',
    riskLevel: 'مستوى الخطر', aiGpr: 'AI-GPR', events: 'أحداث', published: 'النشر',
    tabs: { analysis: '📊 التحليل الكامل', scenarios: '🔮 السيناريوهات', assets: '💰 الأصول المتأثرة', routes: '🚢 طرق التجارة', recommendations: '🎯 التوصيات' },
    scenarioLabels: ['السيناريو الأساسي', 'السيناريو المعاكس', 'السيناريو الحاد'],
    scenarioIcons: ['✅', '⚠️', '🔴'],
    redHerringTitle: 'ما هذا الخطر — وما ليس كذلك',
    redHerringText: 'هذا التحليل يقيّم مخاطر محددة بناءً على البيانات المتاحة. لا يعني هذا حدوث أسوأ سيناريو، ولا يجب تفسيره كتوصية مباشرة بالبيع أو الشراء. السوق قد يكون قد سعّر جزءاً من هذه المخاطر مسبقاً.',
    assetsTitle: 'الأصول المتأثرة وتأثيرها المتوقع',
    bullish: 'صعودي ↑', bearish: 'هبوطي ↓', neutral: 'محايد',
    routesTitle: 'طرق التجارة المتأثرة',
    statusStable: 'مستقر', statusThreatened: 'مهدد', statusDisrupted: 'متأثر', statusBlocked: 'مغلق',
    recTitle: '🎯 ماذا يعني هذا بالنسبة لك؟',
    recConservative: 'للمستثمر المحافظ', recModerate: 'للمستثمر المتوسط', recActive: 'للمتداول النشط',
    riskMetrics: 'مؤشرات الخطر', affectedCountries: 'الدول المتأثرة', affectedRegions: 'المناطق المتأثرة', sources: 'المصادر',
    relatedTitle: 'تحليلات ذات صلة', noContent: 'لا يوجد محتوى تحليلي متاح',
  },
  en: {
    dir: 'ltr',
    categoryLabels: { conflict: 'Conflict', trade: 'Trade', energy: 'Energy', political: 'Political', cyber: 'Cyber', sanctions: 'Sanctions', climate: 'Climate' },
    categoryIcons: { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' },
    backLink: 'Back to Geopolitical Risks',
    riskLevel: 'Risk Level', aiGpr: 'AI-GPR', events: 'Events', published: 'Published',
    tabs: { analysis: '📊 Full Analysis', scenarios: '🔮 Scenarios', assets: '💰 Affected Assets', routes: '🚢 Trade Routes', recommendations: '🎯 Recommendations' },
    scenarioLabels: ['Base Case', 'Adverse Case', 'Severe Case'],
    scenarioIcons: ['✅', '⚠️', '🔴'],
    redHerringTitle: 'What This Risk Is — and Is NOT',
    redHerringText: 'This analysis assesses specific risks based on available data. It does not mean the worst-case scenario will occur, nor should it be interpreted as a direct buy or sell recommendation. Markets may have already priced in part of these risks.',
    assetsTitle: 'Affected Assets & Expected Impact',
    bullish: 'Bullish ↑', bearish: 'Bearish ↓', neutral: 'Neutral',
    routesTitle: 'Affected Trade Routes',
    statusStable: 'Stable', statusThreatened: 'Threatened', statusDisrupted: 'Disrupted', statusBlocked: 'Blocked',
    recTitle: '🎯 What This Means for You',
    recConservative: 'Conservative Investor', recModerate: 'Moderate Investor', recActive: 'Active Trader',
    riskMetrics: 'Risk Metrics', affectedCountries: 'Affected Countries', affectedRegions: 'Affected Regions', sources: 'Sources',
    relatedTitle: 'Related Analyses', noContent: 'No analysis content available',
  },
  fr: {
    dir: 'ltr',
    categoryLabels: { conflict: 'Conflit', trade: 'Commerce', energy: 'Énergie', political: 'Politique', cyber: 'Cyber', sanctions: 'Sanctions', climate: 'Climat' },
    categoryIcons: { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' },
    backLink: 'Retour aux Risques Géopolitiques',
    riskLevel: 'Niveau de Risque', aiGpr: 'AI-GPR', events: 'Événements', published: 'Publié',
    tabs: { analysis: '📊 Analyse Complète', scenarios: '🔮 Scénarios', assets: '💰 Actifs Affectés', routes: '🚢 Routes Commerciales', recommendations: '🎯 Recommandations' },
    scenarioLabels: ['Scénario de Base', 'Scénario Défavorable', 'Scénario Sévère'],
    scenarioIcons: ['✅', '⚠️', '🔴'],
    redHerringTitle: 'Ce Que Ce Risque Est — et N\'Est PAS',
    redHerringText: 'Cette analyse évalue des risques spécifiques sur la base des données disponibles. Cela ne signifie pas que le pire scénario se réalisera, ni qu\'il faut l\'interpréter comme une recommandation directe d\'achat ou de vente. Les marchés peuvent avoir déjà intégré une partie de ces risques.',
    assetsTitle: 'Actifs Affectés et Impact Attendu',
    bullish: 'Haussier ↑', bearish: 'Baissier ↓', neutral: 'Neutre',
    routesTitle: 'Routes Commerciales Affectées',
    statusStable: 'Stable', statusThreatened: 'Menacé', statusDisrupted: 'Perturbé', statusBlocked: 'Bloqué',
    recTitle: '🎯 Ce Que Cela Signifie pour Vous',
    recConservative: 'Investisseur Conservateur', recModerate: 'Investisseur Modéré', recActive: 'Trader Actif',
    riskMetrics: 'Indicateurs de Risque', affectedCountries: 'Pays Affectés', affectedRegions: 'Régions Affectées', sources: 'Sources',
    relatedTitle: 'Analyses Connexes', noContent: 'Aucun contenu d\'analyse disponible',
  },
  tr: {
    dir: 'ltr',
    categoryLabels: { conflict: 'Çatışma', trade: 'Ticaret', energy: 'Enerji', political: 'Siyasi', cyber: 'Siber', sanctions: 'Yaptırımlar', climate: 'İklim' },
    categoryIcons: { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' },
    backLink: 'Jeopolitik Risklere Dön',
    riskLevel: 'Risk Seviyesi', aiGpr: 'AI-GPR', events: 'Olaylar', published: 'Yayın',
    tabs: { analysis: '📊 Tam Analiz', scenarios: '🔮 Senaryolar', assets: '💰 Etkilenen Varlıklar', routes: '🚢 Ticaret Rotaları', recommendations: '🎯 Öneriler' },
    scenarioLabels: ['Temel Senaryo', 'Olumsuz Senaryo', 'Şiddetli Senaryo'],
    scenarioIcons: ['✅', '⚠️', '🔴'],
    redHerringTitle: 'Bu Risk Nedir — ve Nedir DEĞİL',
    redHerringText: 'Bu analiz, mevcut verilere dayanarak belirli riskleri değerlendirir. En kötü senaryonun gerçekleşeceği anlamına gelmez, doğrudan alım veya satım tavsiyesi olarak yorumlanmamalıdır. Piyasalar bu risklerin bir kısmını zaten fiyatlara yansıtmış olabilir.',
    assetsTitle: 'Etkilenen Varlıklar ve Beklenen Etki',
    bullish: 'Yükseliş ↑', bearish: 'Düşüş ↓', neutral: 'Nötr',
    routesTitle: 'Etkilenen Ticaret Rotaları',
    statusStable: 'Stabil', statusThreatened: 'Tehdit Altında', statusDisrupted: 'Etkilenmiş', statusBlocked: 'Engellenmiş',
    recTitle: '🎯 Bu Sizin İçin Ne Anlama Geliyor',
    recConservative: 'Muhafazakar Yatırımcı', recModerate: 'Orta Düzey Yatırımcı', recActive: 'Aktif Trader',
    riskMetrics: 'Risk Göstergeleri', affectedCountries: 'Etkilenen Ülkeler', affectedRegions: 'Etkilenen Bölgeler', sources: 'Kaynaklar',
    relatedTitle: 'İlgili Analizler', noContent: 'Analiz içeriği mevcut değil',
  },
  es: {
    dir: 'ltr',
    categoryLabels: { conflict: 'Conflicto', trade: 'Comercio', energy: 'Energía', political: 'Político', cyber: 'Cibernético', sanctions: 'Sanciones', climate: 'Clima' },
    categoryIcons: { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' },
    backLink: 'Volver a Riesgos Geopolíticos',
    riskLevel: 'Nivel de Riesgo', aiGpr: 'AI-GPR', events: 'Eventos', published: 'Publicado',
    tabs: { analysis: '📊 Análisis Completo', scenarios: '🔮 Escenarios', assets: '💰 Activos Afectados', routes: '🚢 Rutas Comerciales', recommendations: '🎯 Recomendaciones' },
    scenarioLabels: ['Escenario Base', 'Escenario Adverso', 'Escenario Severo'],
    scenarioIcons: ['✅', '⚠️', '🔴'],
    redHerringTitle: 'Lo Que Este Riesgo Es — y NO Es',
    redHerringText: 'Este análisis evalúa riesgos específicos basándose en datos disponibles. No significa que el peor escenario vaya a ocurrir, ni debe interpretarse como una recomendación directa de compra o venta. Los mercados pueden haber ya precioado parte de estos riesgos.',
    assetsTitle: 'Activos Afectados e Impacto Esperado',
    bullish: 'Alcista ↑', bearish: 'Bajista ↓', neutral: 'Neutral',
    routesTitle: 'Rutas Comerciales Afectadas',
    statusStable: 'Estable', statusThreatened: 'Amenazado', statusDisrupted: 'Disruptido', statusBlocked: 'Bloqueado',
    recTitle: '🎯 Qué Significa Esto para Ti',
    recConservative: 'Inversor Conservador', recModerate: 'Inversor Moderado', recActive: 'Trader Activo',
    riskMetrics: 'Indicadores de Riesgo', affectedCountries: 'Países Afectados', affectedRegions: 'Regiones Afectadas', sources: 'Fuentes',
    relatedTitle: 'Análisis Relacionados', noContent: 'No hay contenido de análisis disponible',
  },
};

// V1053: Astro UXDS severity colors (dark theme)
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF3838', severe: '#FF3838', high: '#FFB302',
  elevated: '#FCE83A', moderate: '#FCE83A', low: '#56F000',
};

// V1053: Professional Markdown components — render ALL headings properly
const MARKDOWN_COMPONENTS: Record<string, React.ComponentType<any>> = {
  h1: () => null, // Title is shown in hero, suppress in content
  h2: ({ children }: any) => (
    <h2 style={{
      fontSize: '16px', fontWeight: 700, marginTop: '24px', marginBottom: '10px',
      color: 'var(--text-head)', lineHeight: '1.5',
      paddingBottom: '8px', borderBottom: '1px solid var(--rim)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--text-head)', lineHeight: '1.5' }}>{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 style={{ fontSize: '13px', fontWeight: 600, marginTop: '12px', marginBottom: '6px', color: 'var(--text-head)' }}>{children}</h4>
  ),
  ul: ({ children }: any) => <ul style={{ listStyle: 'disc', paddingRight: '20px', margin: '8px 0' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyle: 'decimal', paddingRight: '20px', margin: '8px 0' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ fontSize: '13px', lineHeight: '1.9', color: 'var(--text2)', marginBottom: '4px' }}>{children}</li>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 700, color: 'var(--text-head)' }}>{children}</strong>,
  p: ({ children }: any) => <p style={{ margin: '10px 0', fontSize: '13px', lineHeight: '2', color: 'var(--text2)' }}>{children}</p>,
  blockquote: ({ children }: any) => (
    <blockquote style={{ borderInlineStart: '3px solid var(--cyan)', paddingInlineStart: '16px', margin: '12px 0', fontStyle: 'italic', color: 'var(--text3)', background: 'rgba(0,229,255,0.03)', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>{children}</blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(128,128,128,0.12)', margin: '20px 0' }} />,
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '12px 0', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.15)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>{children}</table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px', borderBottom: '2px solid rgba(0,229,255,0.2)', color: 'var(--text-head)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</th>
  ),
  td: ({ children }: any) => (
    <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid rgba(128,128,128,0.08)', color: 'var(--text2)', fontSize: '12px' }}>{children}</td>
  ),
  code: ({ children }: any) => (
    <code style={{ background: 'var(--bg4)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{children}</code>
  ),
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(dateStr: string, locale: GeoLocale = 'ar'): string {
  try {
    const date = new Date(dateStr);
    const localeMap: Record<GeoLocale, string> = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR', tr: 'tr-TR', es: 'es-ES' };
    return date.toLocaleDateString(localeMap[locale] || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
}

function timeAgo(dateStr: string, locale: GeoLocale = 'ar'): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const L = I18N[locale];
    if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'now';
    if (diffMin < 60) {
      const labels: Record<GeoLocale, string> = { ar: `${diffMin} دقيقة`, en: `${diffMin}m ago`, fr: `il y a ${diffMin} min`, tr: `${diffMin} dk önce`, es: `hace ${diffMin} min` };
      return labels[locale];
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      const labels: Record<GeoLocale, string> = { ar: `${diffHr} ساعة`, en: `${diffHr}h ago`, fr: `il y a ${diffHr}h`, tr: `${diffHr} saat önce`, es: `hace ${diffHr}h` };
      return labels[locale];
    }
    const diffDay = Math.floor(diffHr / 24);
    const labels: Record<GeoLocale, string> = { ar: `${diffDay} يوم`, en: `${diffDay}d ago`, fr: `il y a ${diffDay}j`, tr: `${diffDay} gün önce`, es: `hace ${diffDay}d` };
    return labels[locale];
  } catch { return ''; }
}

// V1053: Extract structured data from markdown content
function extractStructuredData(content: string) {
  const assets: { symbol: string; name: string; impact: string; direction: string; description: string }[] = [];
  const scenarios: { name: string; probability: number; description: string }[] = [];
  const tradeRoutes: { name: string; status: string; impact: string }[] = [];
  const recommendations: { type: string; text: string }[] = [];

  // Extract assets: - **Name (SYMBOL)**: +5% — direction — description
  const assetRegex = /- \*\*(.+?)\s*\((.+?)\)\*\*:\s*(.+?)\s*[—\-]\s*(.+?)\s*[—\-]\s*(.+)/g;
  let match;
  while ((match = assetRegex.exec(content)) !== null) {
    assets.push({ name: match[1].trim(), symbol: match[2].trim(), impact: match[3].trim(), direction: match[4].trim(), description: match[5].trim() });
  }

  // Extract scenarios: - **Name (XX%)**: description
  const scenarioRegex = /- \*\*(.+?)\s*\((\d+)%\)\*\*:\s*(.+)/g;
  while ((match = scenarioRegex.exec(content)) !== null) {
    scenarios.push({ name: match[1].trim(), probability: parseInt(match[2]), description: match[3].trim() });
  }

  // Extract trade routes: - **Route Name**: status — impact
  const routeRegex = /- \*\*(.+?)\*\*:\s*(.+?)\s*[—\-]\s*(.+)/g;
  while ((match = routeRegex.exec(content)) !== null) {
    const name = match[1].trim();
    // Skip if this was already captured as an asset or scenario
    if (name.includes('%') || assets.some(a => a.name === name)) continue;
    tradeRoutes.push({ name, status: match[2].trim(), impact: match[3].trim() });
  }

  // Extract recommendations — match all 5 locale patterns
  const recRegex = /(للمستثمر المحافظ|للمستثمر المتوسط|للمتداول النشط|Conservative|Moderate|Active trader|Investisseur Conservateur|Investisseur Modéré|Trader Actif|Muhafazakar Yatırımcı|Orta Düzey Yatırımcı|Aktif Trader|Inversor Conservador|Inversor Moderado|Trader Activo)[:\s]*\n([\s\S]+?)(?=\n\n|\n(?:للمستثمر|Conservative|Moderate|Active|Investisseur|Muhafazakar|Orta|Aktif|Inversor|##)|\Z)/gi;
  while ((match = recRegex.exec(content)) !== null) {
    recommendations.push({ type: match[1].trim(), text: match[2].trim() });
  }

  return { assets, scenarios, tradeRoutes, recommendations };
}

// V1053: Risk Gauge — semicircle gauge component
function RiskGauge({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const radius = size / 2 - 8;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 100) * circumference;
  const strokeWidth = 8;

  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 10, flexShrink: 0 }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none" stroke="var(--bg4)" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: size > 100 ? '22px' : '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{score}</div>
        <div style={{ fontSize: '9px', color: 'var(--text4)', marginTop: '-2px' }}>/ 100</div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function GeopoliticalRiskDetailClient({ risk, related, locale: propLocale = 'ar' }: Props) {
  const locale: GeoLocale = propLocale;
  const L = I18N[locale];
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'scenarios' | 'assets' | 'routes' | 'recommendations'>('analysis');
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(new Set([0]));

  useEffect(() => { setMounted(true); window.scrollTo(0, 0); }, []);

  const riskColor = getRiskColor(risk.riskScore);
  const riskLabel = getRiskLabel(risk.riskScore, locale);
  const categoryIcon = L.categoryIcons[risk.riskCategory] || '📌';
  const categoryLabel = L.categoryLabels[risk.riskCategory] || risk.riskCategory;
  const basePath = locale === 'ar' ? '' : `/${locale}`;

  // V1053: Extract structured data from content
  const structured = useMemo(() => extractStructuredData(risk.content || ''), [risk.content]);

  // Merge extracted data with DB data (DB takes priority if non-empty)
  const allAssets = risk.affectedAssets.length > 0 ? risk.affectedAssets : structured.assets;
  const allScenarios = risk.scenarios ? (
    Array.isArray(risk.scenarios) ? risk.scenarios :
    (risk.scenarios.base ? [
      { name: L.scenarioLabels[0], probability: risk.scenarios.base.probability || 50, description: risk.scenarios.base.description || '' },
      { name: L.scenarioLabels[1], probability: risk.scenarios.adverse?.probability || 30, description: risk.scenarios.adverse?.description || '' },
      { name: L.scenarioLabels[2], probability: risk.scenarios.severe?.probability || 20, description: risk.scenarios.severe?.description || '' },
    ] : [])
  ) : structured.scenarios;
  const allRoutes = risk.tradeRoutes.length > 0 ? risk.tradeRoutes : structured.tradeRoutes;
  const allRecs = structured.recommendations.length > 0 ? structured.recommendations : [];

  // V1057: Don't strip headings — render them with MARKDOWN_COMPONENTS
  // Previously used stripMarkdownHeadings which removed ALL ## section titles,
  // turning the content into a wall of text with no structure.
  const cleanedContent = risk.content || '';

  return (
    <main className="min-h-screen pb-mobile-safe" dir={L.dir}>
      {/* ═══ BACK NAV ═══ */}
      <div className="max-w-[1280px] mx-auto pt-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <Link
          href={`${basePath}/geopolitical-risks`}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-4 transition-all"
          style={{ color: 'var(--text3)', background: 'var(--surface-2)', border: '1px solid var(--rim)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {L.dir === 'rtl' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
          </svg>
          {L.backLink}
        </Link>
      </div>

      {/* ═══ V1053: HERO WITH GAUGE ═══ */}
      <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <div className="glass-card mb-6" style={{
          padding: '32px 36px',
          background: `linear-gradient(135deg, ${riskColor}10, var(--surface-1))`,
          borderInlineStart: `4px solid ${riskColor}`,
          borderTop: `1px solid ${riskColor}20`,
        }}>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            {/* Left: Tags + Title + Summary */}
            <div className="flex-1 min-w-0">
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <GeopoliticalRiskBadge score={risk.riskScore} level={risk.riskLevel} locale={locale} />
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{
                  background: `${riskColor}15`, color: riskColor,
                  border: `1px solid ${riskColor}25`,
                }}>
                  {categoryIcon} {categoryLabel}
                </span>
                {risk.publishedAt && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                    background: 'var(--surface-2)', color: 'var(--text4)',
                  }}>
                    {timeAgo(risk.publishedAt || '', locale)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--text-head)', lineHeight: 1.4 }}>
                {risk.title}
              </h1>

              {/* Summary */}
              {risk.summary && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)', lineHeight: 1.8 }}>
                  {risk.summary}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex items-center gap-4 flex-wrap">
                {risk.aiGprScore !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{L.aiGpr}:</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>
                      {risk.aiGprScore.toFixed(1)}
                    </span>
                  </div>
                )}
                {risk.acledEventCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{L.events}:</span>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--bear)' }}>
                      {risk.acledEventCount}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{L.published}:</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }}>
                    {risk.publishedAt ? formatDate(risk.publishedAt, locale) : formatDate(risk.createdAt, locale)}
                  </span>
                </div>
                {/* V1060: Next update indicator */}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)', fontWeight: 600 }}>
                    🔄 {locale === 'ar' ? 'يُحدّث كل 12 ساعة' : locale === 'fr' ? 'Mise à jour toutes les 12h' : locale === 'tr' ? '12 saatte bir güncellenir' : locale === 'es' ? 'Actualizado cada 12h' : 'Updated every 12h'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Risk Gauge */}
            <div className="flex flex-col items-center gap-2">
              <RiskGauge score={risk.riskScore} color={riskColor} size={140} />
              <span className="text-[11px] font-bold" style={{ color: riskColor }}>{riskLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ V1053: TABS ═══ */}
      <div className="max-w-[1280px] mx-auto mb-4" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: 'analysis', label: L.tabs.analysis, show: !!cleanedContent },
            { key: 'scenarios', label: L.tabs.scenarios, show: allScenarios.length > 0 },
            { key: 'assets', label: L.tabs.assets, show: allAssets.length > 0 },
            { key: 'routes', label: L.tabs.routes, show: allRoutes.length > 0 },
            { key: 'recommendations', label: L.tabs.recommendations, show: allRecs.length > 0 },
          ].filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="px-4 py-2 rounded-lg text-[12px] font-bold transition-all"
              style={{
                background: activeTab === tab.key ? `${riskColor}15` : 'var(--bg4)',
                color: activeTab === tab.key ? riskColor : 'var(--text3)',
                border: `1px solid ${activeTab === tab.key ? `${riskColor}25` : 'var(--border)'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CONTENT GRID ═══ */}
      <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── Analysis Tab ── */}
            {activeTab === 'analysis' && cleanedContent && (
              <div className="glass-card" style={{ padding: '28px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {cleanedContent}
                </ReactMarkdown>
              </div>
            )}

            {/* ── Scenarios Tab ── */}
            {activeTab === 'scenarios' && allScenarios.length > 0 && (
              <div className="space-y-3">
                {allScenarios.map((scenario: any, idx: number) => {
                  const sColor = idx === 0 ? 'var(--bull)' : idx === 1 ? 'var(--gold)' : 'var(--bear)';
                  const sLabel = L.scenarioLabels[idx] || scenario.name || '';
                  const sIcon = L.scenarioIcons[idx] || (idx === 0 ? '✅' : idx === 1 ? '⚠️' : '🔴');
                  const isExpanded = expandedScenarios.has(idx);
                  const prob = scenario.probability || (idx === 0 ? 50 : idx === 1 ? 30 : 20);

                  return (
                    <div key={idx} className="glass-card" style={{
                      padding: '20px 24px',
                      borderInlineStart: `3px solid ${sColor}`,
                      background: `linear-gradient(135deg, ${sColor}05, var(--surface-1))`,
                    }}>
                      <button
                        onClick={() => {
                          const next = new Set(expandedScenarios);
                          if (isExpanded) next.delete(idx); else next.add(idx);
                          setExpandedScenarios(next);
                        }}
                        className="w-full flex items-center justify-between gap-3 text-right"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '20px' }}>{sIcon}</span>
                          <div>
                            <div className="text-[14px] font-bold" style={{ color: 'var(--text-head)' }}>{scenario.name || sLabel}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text4)' }}>{sLabel}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--bg4)', overflow: 'hidden' }}>
                            <div style={{ width: `${prob}%`, height: '100%', borderRadius: 3, background: sColor, transition: 'width 0.6s' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: sColor }}>{prob}%</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </button>
                      {isExpanded && scenario.description && (
                        <p className="text-[13px] leading-relaxed mt-3 pt-3" style={{ color: 'var(--text2)', borderTop: '1px solid var(--rim)', lineHeight: 1.9 }}>
                          {scenario.description}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* V1053: Red Herring — Revolutionary feature from Eurasia Group */}
                <div className="glass-card" style={{
                  padding: '20px 24px',
                  background: 'rgba(244,63,94,0.04)',
                  border: '1px solid rgba(244,63,94,0.15)',
                  borderInlineStart: '3px solid #FF3838',
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: '18px' }}>🚫</span>
                    <h3 className="text-[14px] font-bold" style={{ color: '#FF3838' }}>{L.redHerringTitle}</h3>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text3)', lineHeight: 1.8 }}>
                    {L.redHerringText}
                  </p>
                </div>
              </div>
            )}

            {/* ── Assets Tab ── */}
            {activeTab === 'assets' && allAssets.length > 0 && (
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>{L.assetsTitle}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allAssets.map((asset: any, idx: number) => {
                    const direction = asset.direction || '';
                    const isBullish = direction.includes('صعود') || direction.includes('bull') || direction.includes('up') || (asset.impact || '').includes('+');
                    const isBearish = direction.includes('هبوط') || direction.includes('bear') || direction.includes('down') || (asset.impact || '').includes('-');
                    const assetColor = isBullish ? 'var(--bull)' : isBearish ? 'var(--bear)' : 'var(--gold)';
                    const dirLabel = isBullish ? L.bullish : isBearish ? L.bearish : L.neutral;

                    return (
                      <div key={idx} className="text-center p-4 rounded-xl transition-all hover:-translate-y-0.5" style={{
                        background: isBullish ? 'rgba(34,197,94,0.06)' : isBearish ? 'rgba(239,68,68,0.06)' : 'rgba(255,184,0,0.06)',
                        border: `1px solid ${assetColor}20`,
                      }}>
                        <div className="text-[14px] font-bold mb-1" style={{ color: 'var(--text-head)' }}>
                          {asset.symbol || asset.name}
                        </div>
                        <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: assetColor, marginBottom: 2 }}>
                          {asset.impact || ''}
                        </div>
                        <div className="text-[10px] font-semibold" style={{ color: assetColor }}>{dirLabel}</div>
                        {asset.description && (
                          <div className="text-[10px] mt-2" style={{ color: 'var(--text3)', lineHeight: 1.5 }}>{asset.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Routes Tab ── */}
            {activeTab === 'routes' && allRoutes.length > 0 && (
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>{L.routesTitle}</h3>
                <div className="space-y-2">
                  {allRoutes.map((route: any, idx: number) => {
                    const status = (route.status || '').toLowerCase();
                    const routeColor = status.includes('متأثر') || status.includes('disrupt') || status.includes('مغلق') || status.includes('block') ? '#FF3838'
                      : status.includes('مهدد') || status.includes('threat') || status.includes('elevat') ? '#FFB302'
                      : '#56F000';
                    const statusLabel = status.includes('متأثر') || status.includes('disrupt') ? L.statusDisrupted : status.includes('مهدد') || status.includes('threat') ? L.statusThreatened : status.includes('مغلق') || status.includes('block') ? L.statusBlocked : L.statusStable;

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)', borderInlineStart: `3px solid ${routeColor}` }}>
                        <div>
                          <span className="text-[13px] font-bold" style={{ color: 'var(--text-head)' }}>{route.name}</span>
                          {route.impact && <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{route.impact}</p>}
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${routeColor}15`, color: routeColor }}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recommendations Tab — V1061: Actionable cards with Entry/Target/Stop ── */}
            {activeTab === 'recommendations' && allRecs.length > 0 && (
              <div className="space-y-4">
                {/* Investor type recommendation cards */}
                <div className="glass-card" style={{ padding: '24px', background: `linear-gradient(135deg, ${riskColor}05, var(--surface-1))` }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>{L.recTitle}</h3>
                  <div className="space-y-3">
                    {allRecs.map((rec, idx) => {
                      const rIcon = idx === 0 ? '🛡️' : idx === 1 ? '⚖️' : '📈';
                      const rColor = idx === 0 ? 'var(--bull)' : idx === 1 ? 'var(--gold)' : 'var(--cyan)';
                      const recLabels = [
                        locale === 'ar' ? 'للمستثمر المحافظ' : locale === 'fr' ? 'Investisseur Conservateur' : locale === 'tr' ? 'Muhafazakar Yatırımcı' : locale === 'es' ? 'Inversor Conservador' : 'Conservative Investor',
                        locale === 'ar' ? 'للمستثمر المتوسط' : locale === 'fr' ? 'Investisseur Modéré' : locale === 'tr' ? 'Orta Düzey Yatırımcı' : locale === 'es' ? 'Inversor Moderado' : 'Moderate Investor',
                        locale === 'ar' ? 'للمتداول النشط' : locale === 'fr' ? 'Trader Actif' : locale === 'tr' ? 'Aktif Trader' : locale === 'es' ? 'Trader Activo' : 'Active Trader',
                      ];
                      return (
                        <div key={idx} className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', borderInlineStart: `3px solid ${rColor}` }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: '18px' }}>{rIcon}</span>
                            <span className="text-[13px] font-bold" style={{ color: rColor }}>{recLabels[idx] || rec.type}</span>
                          </div>
                          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)', lineHeight: 1.8 }}>{rec.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* V1061: Actionable Trading Cards with Entry/Target/Stop */}
                {allAssets.length > 0 && (() => {
                  const tradeCardLabels = {
                    entry: locale === 'ar' ? 'الدخول' : locale === 'fr' ? 'Entrée' : locale === 'tr' ? 'Giriş' : locale === 'es' ? 'Entrada' : 'Entry',
                    target: locale === 'ar' ? 'الهدف' : locale === 'fr' ? 'Objectif' : locale === 'tr' ? 'Hedef' : locale === 'es' ? 'Objetivo' : 'Target',
                    stop: locale === 'ar' ? 'وقف الخسارة' : locale === 'fr' ? 'Stop' : locale === 'tr' ? 'Stop' : locale === 'es' ? 'Stop' : 'Stop Loss',
                    direction: locale === 'ar' ? 'الاتجاه' : locale === 'fr' ? 'Direction' : locale === 'tr' ? 'Yön' : locale === 'es' ? 'Dirección' : 'Direction',
                  };
                  return (
                    <div className="glass-card" style={{ padding: '24px' }}>
                      <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>
                        🎯 {locale === 'ar' ? 'مستويات تداول محددة' : locale === 'fr' ? 'Niveaux de Trading Spécifiques' : locale === 'tr' ? 'Spesifik İşlem Seviyeleri' : locale === 'es' ? 'Niveles de Trading Específicos' : 'Specific Trading Levels'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allAssets.map((asset: any, idx: number) => {
                          const direction = asset.direction || '';
                          const isBullish = direction.includes('صعود') || direction.includes('bull') || direction.includes('up') || (asset.impact || '').includes('+');
                          const isBearish = direction.includes('هبوط') || direction.includes('bear') || direction.includes('down') || (asset.impact || '').includes('-');
                          const assetColor = isBullish ? 'var(--bull)' : isBearish ? 'var(--bear)' : 'var(--gold)';
                          // Extract entry/target/stop from description if present
                          const desc = asset.description || asset.impact || '';
                          const entryMatch = desc.match(/(?:Entry|Entrée|Giriş|Entrada|الدخول)[:\s]*\$?([\d,.]+)/i);
                          const targetMatch = desc.match(/(?:Target|Objectif|Hedef|Objetivo|الهدف)[:\s]*\$?([\d,.]+)/i);
                          const stopMatch = desc.match(/(?:Stop|وقف)[:\s]*\$?([\d,.]+)/i);

                          return (
                            <div key={idx} className="p-4 rounded-xl" style={{
                              background: isBullish ? 'rgba(34,197,94,0.04)' : isBearish ? 'rgba(239,68,68,0.04)' : 'rgba(255,184,0,0.04)',
                              border: `1px solid ${assetColor}20`,
                            }}>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[14px] font-bold" style={{ color: 'var(--text-head)' }}>{asset.symbol || asset.name}</span>
                                <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: assetColor }}>{asset.impact || ''}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'var(--bg4)' }}>
                                  <div style={{ fontSize: '9px', color: 'var(--text4)', marginBottom: 2 }}>{tradeCardLabels.entry}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-head)' }}>{entryMatch ? `$${entryMatch[1]}` : '—'}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'rgba(34,197,94,0.06)' }}>
                                  <div style={{ fontSize: '9px', color: 'var(--text4)', marginBottom: 2 }}>{tradeCardLabels.target}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--bull)' }}>{targetMatch ? `$${targetMatch[1]}` : '—'}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'rgba(239,68,68,0.06)' }}>
                                  <div style={{ fontSize: '9px', color: 'var(--text4)', marginBottom: 2 }}>{tradeCardLabels.stop}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--bear)' }}>{stopMatch ? `$${stopMatch[1]}` : '—'}</div>
                                </div>
                              </div>
                              {asset.description && (
                                <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>{asset.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* V1053: If no tabs have data, show raw content */}
            {activeTab === 'analysis' && !cleanedContent && (
              <div className="glass-card p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text3)' }}>{L.noContent}</p>
              </div>
            )}
          </div>

          {/* ═══ V1053: SMART SIDEBAR ═══ */}
          <div className="space-y-4">

            {/* Risk Metrics with bars */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>{L.riskMetrics}</h3>
              <div className="space-y-3">
                {[
                  { label: locale === 'ar' ? 'درجة الخطر المركبة' : locale === 'fr' ? 'Score de Risque Composite' : locale === 'tr' ? 'Bileşik Risk Skoru' : locale === 'es' ? 'Puntuación de Riesgo Compuesto' : 'Composite Risk Score', value: risk.riskScore, max: 100, color: riskColor },
                  { label: 'AI-GPR', value: risk.aiGprScore, max: 200, color: 'var(--gold)' },
                  { label: locale === 'ar' ? 'أحداث ACLED' : 'ACLED Events', value: risk.acledEventCount, max: 500, color: 'var(--bear)' },
                  { label: locale === 'ar' ? 'الوفيات' : locale === 'fr' ? 'Victimes' : locale === 'tr' ? 'Kayıplar' : locale === 'es' ? 'Víctimas' : 'Fatalities', value: risk.acledFatalityCount, max: 1000, color: 'var(--bear)' },
                  { label: locale === 'ar' ? 'استقرار البنك الدولي' : locale === 'fr' ? 'Stabilité Banque Mondiale' : locale === 'tr' ? 'Dünya Bankası İstikrarı' : locale === 'es' ? 'Estabilidad Banco Mundial' : 'World Bank Stability', value: risk.worldBankStability, max: 2.5, color: 'var(--bull)' },
                  { label: locale === 'ar' ? 'نبرة GDELT' : 'GDELT Tone', value: risk.gdeltTone, max: 10, color: 'var(--cyan)' },
                ].filter(m => m.value !== null && m.value !== undefined && m.value !== 0).map((metric, idx) => {
                  const pct = typeof metric.max === 'number' && metric.max > 0
                    ? Math.min(100, Math.round(((metric.value as number) / metric.max) * 100))
                    : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{metric.label}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: metric.color }}>
                          {typeof metric.value === 'number' ? (metric.value % 1 === 0 ? metric.value : metric.value.toFixed(1)) : metric.value}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: metric.color, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  );
                })}
                {risk.riskScore === 0 && risk.aiGprScore === null && (
                  <p className="text-[11px] text-center" style={{ color: 'var(--text4)' }}>لا توجد مؤشرات تفصيلية متاحة</p>
                )}
              </div>
            </div>

            {/* Affected Countries */}
            {risk.affectedCountries.length > 0 && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-head)' }}>{L.affectedCountries}</h3>
                <div className="space-y-2">
                  {risk.affectedCountries.map((country: any, idx: number) => {
                    const cScore = country.score || 50;
                    const cColor = getRiskColor(cScore);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <div style={{ width: 32, height: 6, borderRadius: 3, background: 'var(--bg4)', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ width: `${cScore}%`, height: '100%', background: cColor }} />
                        </div>
                        <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text)' }}>
                          {country.name || country.code}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: cColor }}>
                          {cScore}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Affected Regions */}
            {risk.affectedRegions.length > 0 && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-head)' }}>{L.affectedRegions}</h3>
                <div className="flex flex-wrap gap-2">
                  {risk.affectedRegions.map((region: string, idx: number) => (
                    <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full" style={{
                      background: 'var(--cyan2)', color: 'var(--cyan)',
                      border: '1px solid rgba(0,229,255,.12)',
                    }}>
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* V1060: Last update timestamp only in sidebar */}
            <div className="glass-card" style={{ padding: '14px 16px' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {locale === 'ar' ? 'آخر تحديث' : locale === 'fr' ? 'Dernière mise à jour' : locale === 'tr' ? 'Son güncelleme' : locale === 'es' ? 'Última actualización' : 'Last updated'}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>
                  {risk.updatedAt ? formatDate(risk.updatedAt, locale) : (risk.publishedAt ? formatDate(risk.publishedAt, locale) : formatDate(risk.createdAt, locale))}
                </span>
              </div>
            </div>

            {/* V1062: Geopolitical News + Strategic Reports in sidebar */}
            <GeopoliticalNewsReports locale={locale} />
          </div>
        </div>

        {/* ═══ V1061: SOURCES SECTION — at bottom of report (not sidebar) ═══ */}
        <div className="mb-8">
          <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--rim)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>
              📚 {L.sources}
            </h3>
            {risk.sourceUrls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {risk.sourceUrls.map((url: string, idx: number) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg4)] transition-colors"
                    style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { ar: 'مؤشر المخاطر الجيوسياسية (GPR) — الاحتياطي الفيدرالي', en: 'GPR Index — Federal Reserve', fr: 'Indice GPR — Réserve Fédérale', tr: 'GPR Endeksi — Fed', es: 'Índice GPR — Reserva Federal' },
                  { ar: 'قاعدة بيانات ACLED للأحداث المسلحة', en: 'ACLED Armed Conflict Database', fr: 'Base de données ACLED', tr: 'ACLED Çatışma Veritabanı', es: 'Base de datos ACLED' },
                  { ar: 'مشروع GDELT — البيانات العالمية', en: 'GDELT Project — Global Data', fr: 'Projet GDELT — Données mondiales', tr: 'GDELT Projesi — Küresel Veri', es: 'Proyecto GDELT — Datos Globales' },
                  { ar: 'البنك الدولي — مؤشرات الاستقرار السياسي', en: 'World Bank — Political Stability Indicators', fr: 'Banque Mondiale — Indicateurs de stabilité', tr: 'Dünya Bankası — Siyasi İstikrar', es: 'Banco Mundial — Indicadores de Estabilidad' },
                  { ar: 'تحليلات رؤى بالذكاء الاصطناعي', en: 'Rouaa AI Analysis', fr: 'Analyse IA Rouaa', tr: 'Rouaa AI Analizi', es: 'Análisis IA Rouaa' },
                ].map((src, idx) => (
                  <div key={idx} className="text-[11px] flex items-center gap-2 p-2 rounded-lg" style={{ color: 'var(--text3)', background: 'var(--bg4)' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />
                    {src[locale] || src.en}
                  </div>
                ))}
              </div>
            )}
            {/* Methodology note */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--rim)' }}>
              <p className="text-[10px]" style={{ color: 'var(--text4)', lineHeight: 1.6 }}>
                {locale === 'ar'
                  ? 'يستند هذا التحليل إلى بيانات من مؤشر GPR (الاحتياطي الفيدرالي)، قاعدة بيانات ACLED، مشروع GDELT، ومؤشرات البنك الدولي. يتم تحديث التحليل تلقائياً كل 12 ساعة باستخدام الذكاء الاصطناعي.'
                  : locale === 'fr'
                  ? 'Cette analyse est basée sur les données de l\'indice GPR (Réserve Fédérale), de la base ACLED, du projet GDELT et des indicateurs de la Banque Mondiale. Mise à jour automatique toutes les 12 heures par IA.'
                  : locale === 'tr'
                  ? 'Bu analiz GPR Endeksi (Fed), ACLED veritabanı, GDELT projesi ve Dünya Bankası verilerine dayanmaktadır. 12 saatte bir AI ile otomatik güncellenir.'
                  : locale === 'es'
                  ? 'Este análisis se basa en datos del índice GPR (Reserva Federal), base ACLED, proyecto GDELT e indicadores del Banco Mundial. Actualización automática cada 12 horas con IA.'
                  : 'This analysis is based on data from the GPR Index (Federal Reserve), ACLED database, GDELT project, and World Bank indicators. Automatically updated every 12 hours using AI.'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ RELATED ANALYSES ═══ */}
        {related.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-head)' }}>{L.relatedTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((r) => {
                const rColor = getRiskColor(r.riskScore);
                return (
                  <Link key={r.id} href={`${basePath}/geopolitical-risks/${r.slug}`}
                    className="glass-card p-4 transition-all hover:-translate-y-0.5"
                    style={{ textDecoration: 'none', borderInlineStart: `2px solid ${rColor}` }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <GeopoliticalRiskBadge score={r.riskScore} level={r.riskLevel} locale={locale} />
                    </div>
                    <h4 className="text-xs font-bold line-clamp-2 mb-2" style={{ color: 'var(--text)' }}>
                      {r.title}
                    </h4>
                    {r.publishedAt && (
                      <span className="text-[9px]" style={{ color: 'var(--text4)' }}>{timeAgo(r.publishedAt || '', locale)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
