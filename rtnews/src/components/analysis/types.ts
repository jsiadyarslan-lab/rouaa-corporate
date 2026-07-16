// ═══════════════════════════════════════════════════════════════════
// Shared Types & Bilingual Constants for Analysis Components
// Fully bilingual: every constant has ar + en variants
// ═══════════════════════════════════════════════════════════════════

import type { Locale } from '@/components/analysis-v2/locales';

// ─── Data Types ────────────────────────────────────────────────

export interface SentimentData {
  fearGreedIndex: { value: number; label: string; labelAr: string };
  arabSentimentIndex: { value: number; label: string; majorityVote: string; topSearchedAsset: string };
  geopoliticalRiskIndex: {
    value: number;
    label: string;
    description: string;
    impacts: Record<string, { trend: string; value: string }>;
  };
  overall?: number;
  aiPowered: boolean;
  aiSummary: string | null;
  lastUpdate?: string;
  [key: string]: any;
}

export interface MarketAnalysisItem {
  id: string;
  title: string;
  slug: string;
  assetClass: string;
  analysisType: string;
  timeFrame: string;
  riskLevel: string;
  sentiment: string;
  confidenceScore: number;
  priceTarget: any;
  publishedAt: string;
  validUntil: string;
}

export interface NewsWithAnalysis {
  id: string;
  titleAr: string;
  title?: string;
  slug: string;
  category: string;
  sentiment: string;
  impactLevel: string;
  publishedAt: string;
  aiAnalysis: string;
}

export interface ContentAnalysisItem {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  symbols: string[];
  sentiment: string | number;
  impactLevel: string;
  qualityScore: number;
  tags: string[];
  publishedAt: string;
  summary?: string;
}

export interface TradingQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  change24h?: number;
  high: number;
  low: number;
  volume: number;
  source: string;
}

// ─── Bilingual Constants ───────────────────────────────────────

export const PAIRS = ['EUR/USD', 'XAU/USD', 'BTC/USDT', 'GBP/USD', 'USD/JPY', 'ETH/USDT', 'SOL/USD', 'AAPL', 'TSLA', 'SPY'];

export const ANALYSIS_TYPES: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  full: { ar: 'تحليل شامل', en: 'Full Analysis', es: 'Análisis Completo', fr: 'Analyse Complète', tr: 'Tam Analiz' },
  news: { ar: 'تأثير الأخبار', en: 'News Impact', es: 'Impacto de Noticias', fr: 'Impact Actualités', tr: 'Haber Etkisi' },
  outlook: { ar: 'توقعات الأسبوع', en: 'Weekly Outlook', es: 'Perspectiva Semanal', fr: 'Perspectives Hebdomadaires', tr: 'Haftalık Görünüm' },
  risk: { ar: 'تحليل المخاطر', en: 'Risk Analysis', es: 'Análisis de Riesgo', fr: 'Analyse de Risque', tr: 'Risk Analizi' },
  entry: { ar: 'نقاط دخول/خروج', en: 'Entry/Exit Points', es: 'Puntos de Entrada/Salida', fr: "Points d'Entrée/Sortie", tr: 'Giriş/Çıkış Noktaları' },
  technical: { ar: 'تحليل فني', en: 'Technical Analysis', es: 'Análisis Técnico', fr: 'Analyse Technique', tr: 'Teknik Analiz' },
  fundamental: { ar: 'تحليل أساسي', en: 'Fundamental Analysis', es: 'Análisis Fundamental', fr: 'Analyse Fondamentale', tr: 'Temel Analiz' },
};

export const TIMEFRAMES: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  short: { ar: 'قصير · 1-4 ساعات', en: 'Short · 1-4 hours', es: 'Corto · 1-4 horas', fr: 'Court · 1-4 heures', tr: 'Kısa · 1-4 saat' },
  mid: { ar: 'متوسط · 1-7 أيام', en: 'Mid · 1-7 days', es: 'Medio · 1-7 días', fr: 'Moyen · 1-7 jours', tr: 'Orta · 1-7 gün' },
  long: { ar: 'طويل · أسابيع', en: 'Long · Weeks', es: 'Largo · Semanas', fr: 'Long · Semaines', tr: 'Uzun · Haftalar' },
  '1h': { ar: 'ساعة واحدة', en: '1 Hour', es: '1 Hora', fr: '1 Heure', tr: '1 Saat' },
  '4h': { ar: '4 ساعات', en: '4 Hours', es: '4 Horas', fr: '4 Heures', tr: '4 Saat' },
  '1d': { ar: 'يوم واحد', en: '1 Day', es: '1 Día', fr: '1 Jour', tr: '1 Gün' },
  '1w': { ar: 'أسبوع واحد', en: '1 Week', es: '1 Semana', fr: '1 Semaine', tr: '1 Hafta' },
};

export const STYLES: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  pro: { ar: 'احترافي', en: 'Professional', es: 'Profesional', fr: 'Professionnel', tr: 'Profesyonel' },
  simple: { ar: 'مبسّط', en: 'Simplified', es: 'Simplificado', fr: 'Simplifié', tr: 'Basitleştirilmiş' },
  bloomberg: { ar: 'أسلوب Bloomberg', en: 'Bloomberg Style', es: 'Estilo Bloomberg', fr: 'Style Bloomberg', tr: 'Bloomberg Tarzı' },
  detailed: { ar: 'مفصّل', en: 'Detailed', es: 'Detallado', fr: 'Détaillé', tr: 'Detaylı' },
};

export const CHART_PAIRS: Record<string, string> = {
  'EUR/USD': 'FX:EURUSD',
  'XAU/USD': 'OANDA:XAUUSD',
  'BTC/USDT': 'BINANCE:BTCUSDT',
  'GBP/USD': 'FX:GBPUSD',
  'USD/JPY': 'FX:USDJPY',
  'ETH/USDT': 'BINANCE:ETHUSDT',
  'AAPL': 'NASDAQ:AAPL',
  'TSLA': 'NASDAQ:TSLA',
  'SPY': 'AMEX:SPY',
};

export const ASSET_CLASS: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  stocks: { ar: 'الأسهم', en: 'Stocks', es: 'Acciones', fr: 'Actions', tr: 'Hisseler' },
  commodities: { ar: 'السلع', en: 'Commodities', es: 'Materias Primas', fr: 'Matières Premières', tr: 'Emtialar' },
  forex: { ar: 'العملات', en: 'Forex', es: 'Divisas', fr: 'Devises', tr: 'Döviz' },
  crypto: { ar: 'العملات الرقمية', en: 'Crypto', es: 'Criptomonedas', fr: 'Crypto', tr: 'Kripto' },
  bonds: { ar: 'السندات', en: 'Bonds', es: 'Bonos', fr: 'Obligations', tr: 'Tahviller' },
  energy: { ar: 'الطاقة', en: 'Energy', es: 'Energía', fr: 'Énergie', tr: 'Enerji' },
  realEstate: { ar: 'العقارات', en: 'Real Estate', es: 'Bienes Raíces', fr: 'Immobilier', tr: 'Gayrimenkul' },
  economy: { ar: 'الاقتصاد', en: 'Economy', es: 'Economía', fr: 'Économie', tr: 'Ekonomi' },
  banking: { ar: 'البنوك', en: 'Banking', es: 'Banca', fr: 'Banque', tr: 'Bankacılık' },
};

export const RISK_LEVEL: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  low: { ar: 'منخفض', en: 'Low', es: 'Bajo', fr: 'Faible', tr: 'Düşük' },
  medium: { ar: 'متوسط', en: 'Medium', es: 'Medio', fr: 'Moyen', tr: 'Orta' },
  high: { ar: 'مرتفع', en: 'High', es: 'Alto', fr: 'Élevé', tr: 'Yüksek' },
  extreme: { ar: 'شديد', en: 'Extreme', es: 'Extremo', fr: 'Extrême', tr: 'Aşırı' },
};

export const SENTIMENT_LABEL: Record<string, { ar: string; en: string; es: string; fr: string; tr: string }> = {
  bullish: { ar: 'صعودي', en: 'Bullish', es: 'Alcista', fr: 'Haussier', tr: 'Yükseliş' },
  bearish: { ar: 'هبوطي', en: 'Bearish', es: 'Bajista', fr: 'Baissier', tr: 'Düşüş' },
  neutral: { ar: 'محايد', en: 'Neutral', es: 'Neutral', fr: 'Neutre', tr: 'Nötr' },
  positive: { ar: 'إيجابي', en: 'Positive', es: 'Positivo', fr: 'Positif', tr: 'Pozitif' },
  negative: { ar: 'سلبي', en: 'Negative', es: 'Negativo', fr: 'Négatif', tr: 'Negatif' },
};

// ─── Helper: Get localized value from multilingual constant ───────
export function localized(constMap: Record<string, Record<string, string>>, key: string, locale: Locale): string {
  return constMap[key]?.[locale] || constMap[key]?.en || key;
}

// ─── Helpers ──────────────────────────────────────────────────
export function sentimentClass(s: string): 'bullish' | 'bearish' | 'neutral' {
  if (/bull|positive|up|صعود|إيجاب/i.test(s)) return 'bullish';
  if (/bear|negative|down|هبوط|سلب/i.test(s)) return 'bearish';
  return 'neutral';
}

export function sentimentLabel(s: string, locale: Locale): string {
  const cls = sentimentClass(s);
  if (cls === 'bullish') return locale === 'ar' ? 'صعودي' : locale === 'es' ? 'Alcista' : locale === 'fr' ? 'Haussier' : locale === 'tr' ? 'Yükseliş' : 'Bullish';
  if (cls === 'bearish') return locale === 'ar' ? 'هبوطي' : locale === 'es' ? 'Bajista' : locale === 'fr' ? 'Baissier' : locale === 'tr' ? 'Düşüş' : 'Bearish';
  return locale === 'ar' ? 'محايد' : locale === 'es' ? 'Neutral' : locale === 'fr' ? 'Neutre' : locale === 'tr' ? 'Nötr' : 'Neutral';
}

export function riskLabel(level: string, locale: Locale): string {
  return RISK_LEVEL[level]?.[locale] || level;
}

export function assetClassLabel(cls: string, locale: Locale): string {
  return ASSET_CLASS[cls]?.[locale] || cls;
}

export function parseAiAnalysis(raw: string): {
  keyTakeaways?: string[];
  recommendation?: string;
  sentiment?: string;
  impactLevel?: string;
  affectedAssets?: Array<{ symbol: string; name: string; direction: string; reason: string }>;
  fullContent?: string;
} | null {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — Old exports used by legacy components
// These are DEPRECATED. New code should use the bilingual versions above.
// ═══════════════════════════════════════════════════════════════════

/** @deprecated Use ASSET_CLASS with locale instead */
export const ASSET_CLASS_AR: Record<string, string> = Object.fromEntries(
  Object.entries(ASSET_CLASS).map(([k, v]) => [k, v.ar])
);

/** @deprecated Use RISK_LEVEL with locale instead */
export const RISK_AR: Record<string, string> = Object.fromEntries(
  Object.entries(RISK_LEVEL).map(([k, v]) => [k, v.ar])
);

/** @deprecated Use SENTIMENT_LABEL with locale instead */
export const SENTIMENT_AR: Record<string, string> = Object.fromEntries(
  Object.entries(SENTIMENT_LABEL).map(([k, v]) => [k, v.ar])
);

/** @deprecated Use sentimentLabel(s, locale) instead */
export function sentimentAr(s: string): string {
  return SENTIMENT_AR[s] || s;
}

/** @deprecated Use riskLabel(level, locale) instead */
export function riskClass(s: string): string {
  if (/high|مرتفع/i.test(s)) return 'riskHigh';
  if (/medium|متوسط/i.test(s)) return 'riskMedium';
  return 'riskLow';
}

/** @deprecated Use timeAgo(dateStr, locale) from analysis-v2/locales or inline bilingual version instead */
export function timeAgo(dateStr: string, locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es'): string {
  const loc = locale || 'ar';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return loc === 'ar' ? 'الآن' : 'Just now';
  if (mins < 60) return loc === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return loc === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return loc === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
}
