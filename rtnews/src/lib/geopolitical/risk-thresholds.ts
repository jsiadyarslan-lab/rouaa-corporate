// ─── Risk Level Thresholds and Color Mappings ──────────────────
// Rouaa (رؤى) Geopolitical Risk Assessment
// Uses Cividis-inspired palette that's color-blind safe
// Maps risk scores 0-100 to 5 levels with colors and labels in 5 languages

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export interface RiskThreshold {
  level: RiskLevel;
  minScore: number;
  maxScore: number;
  color: string;       // hex color
  bgClass: string;     // tailwind bg class
  textClass: string;   // tailwind text class
  label: Record<string, string>; // ar, en, fr, tr, es
}

export const RISK_THRESHOLDS: RiskThreshold[] = [
  {
    level: 'low',
    minScore: 0,
    maxScore: 20,
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    label: { ar: 'منخفض', en: 'Low', fr: 'Faible', tr: 'Düşük', es: 'Bajo' },
  },
  {
    level: 'moderate',
    minScore: 21,
    maxScore: 40,
    color: '#eab308',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    label: { ar: 'معتدل', en: 'Moderate', fr: 'Modéré', tr: 'Orta', es: 'Moderado' },
  },
  {
    level: 'elevated',
    minScore: 41,
    maxScore: 60,
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    label: { ar: 'مرتفع', en: 'Elevated', fr: 'Élevé', tr: 'Yüksek', es: 'Elevado' },
  },
  {
    level: 'high',
    minScore: 61,
    maxScore: 80,
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    label: { ar: 'عالي', en: 'High', fr: 'Élevé', tr: 'Çok Yüksek', es: 'Alto' },
  },
  {
    level: 'severe',
    minScore: 81,
    maxScore: 100,
    color: '#7f1d1d',
    bgClass: 'bg-red-900/10',
    textClass: 'text-red-800',
    label: { ar: 'شديد', en: 'Severe', fr: 'Sévère', tr: 'Aşırı', es: 'Grave' },
  },
];

/**
 * Get the risk level string for a given score (0-100).
 * Clamps scores outside 0-100 range.
 */
export function getRiskLevel(score: number): RiskLevel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const threshold = RISK_THRESHOLDS.find(
    (t) => clamped >= t.minScore && clamped <= t.maxScore
  );
  return threshold ? threshold.level : 'low';
}

/**
 * Get the full risk threshold object for a given score (0-100).
 * Returns the matching threshold with level, colors, and labels.
 */
export function getRiskThreshold(score: number): RiskThreshold {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const threshold = RISK_THRESHOLDS.find(
    (t) => clamped >= t.minScore && clamped <= t.maxScore
  );
  return threshold || RISK_THRESHOLDS[0];
}

/**
 * Get the hex color for a given risk score (0-100).
 * Useful for chart rendering and non-Tailwind contexts.
 */
export function getRiskColor(score: number): string {
  const threshold = getRiskThreshold(score);
  return threshold.color;
}

/**
 * Get the localized label for a given risk score.
 * @param score - Risk score 0-100
 * @param locale - Language code: 'ar', 'en', 'fr', 'tr', 'es'
 */
export function getRiskLabel(score: number, locale: string): string {
  const threshold = getRiskThreshold(score);
  return threshold.label[locale] || threshold.label['en'];
}

// ─── Cividis Color Palette (Color-Blind Safe) ──────────────────
// 10-step gradient from dark blue-purple (#222435) to bright yellow (#f3e563)
// Based on the Cividis colormap designed for color-blind accessibility.
// Reference: Nuñez et al. (2018) "Optimizing colormaps for color-blind users"

export const CIVIDIS_SCALE: string[] = [
  '#222435', // 0-10:  Darkest
  '#28354f', // 10-20
  '#2e4a65', // 20-30
  '#2f6078', // 30-40
  '#2d7587', // 40-50
  '#328a8d', // 50-60
  '#47a08c', // 60-70
  '#72b47c', // 70-80
  '#a8c66c', // 80-90
  '#f3e563', // 90-100: Brightest
];

/**
 * Get a Cividis color for a given risk score (0-100).
 * Interpolates between the 10-step Cividis scale for smooth gradients.
 * Results are cached to avoid repeated hex→RGB conversion.
 * @param score - Risk score 0-100
 * @returns Hex color string
 */
const cividisColorCache = new Map<number, string>();

export function getCividisColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  const rounded = Math.round(clamped);

  // Check cache for pre-computed color (exact score match)
  const cached = cividisColorCache.get(rounded);
  if (cached) return cached;

  // Map score to index in the CIVIDIS_SCALE (0-9)
  const scaledIndex = (clamped / 100) * (CIVIDIS_SCALE.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(lowerIndex + 1, CIVIDIS_SCALE.length - 1);
  const fraction = scaledIndex - lowerIndex;

  // Parse hex colors to RGB for interpolation
  const lower = hexToRgb(CIVIDIS_SCALE[lowerIndex]);
  const upper = hexToRgb(CIVIDIS_SCALE[upperIndex]);

  if (!lower || !upper) return CIVIDIS_SCALE[0];

  // Linear interpolation between adjacent scale colors
  const r = Math.round(lower.r + (upper.r - lower.r) * fraction);
  const g = Math.round(lower.g + (upper.g - lower.g) * fraction);
  const b = Math.round(lower.b + (upper.b - lower.b) * fraction);

  const result = rgbToHex(r, g, b);
  cividisColorCache.set(rounded, result);
  return result;
}

/**
 * Parse a hex color string to RGB components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB values to a hex color string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, c));
    const hex = clamped.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Category Labels ──────────────────────────────────────────────

export type RiskCategoryKey =
  | 'conflict'
  | 'trade'
  | 'energy'
  | 'political'
  | 'cyber'
  | 'sanctions';

export interface RiskCategoryMeta {
  key: RiskCategoryKey;
  label: Record<string, string>;
}

export const RISK_CATEGORIES: RiskCategoryMeta[] = [
  { key: 'conflict', label: { ar: 'الصراعات المسلحة', en: 'Armed Conflict', fr: 'Conflit armé', es: 'Conflicto armado', tr: 'Silahlı çatışma' } },
  { key: 'trade', label: { ar: 'الحروب التجارية', en: 'Trade War', fr: 'Guerre commerciale', es: 'Guerra comercial', tr: 'Ticaret savaşı' } },
  { key: 'energy', label: { ar: 'أزمات الطاقة', en: 'Energy Crisis', fr: 'Crise énergétique', es: 'Crisis energética', tr: 'Enerji krizi' } },
  { key: 'political', label: { ar: 'عدم الاستقرار السياسي', en: 'Political Instability', fr: 'Instabilité politique', es: 'Inestabilidad política', tr: 'Siyasi istikrarsızlık' } },
  { key: 'cyber', label: { ar: 'التهديدات السيبرانية', en: 'Cyber Threats', fr: 'Menaces cybernétiques', es: 'Amenazas cibernéticas', tr: 'Siber tehditler' } },
  { key: 'sanctions', label: { ar: 'العقوبات الدولية', en: 'International Sanctions', fr: 'Sanctions internationales', es: 'Sanciones internacionales', tr: 'Uluslararası yaptırımlar' } },
];

export function getCategoryLabel(key: RiskCategoryKey | string, locale: string): string {
  const cat = RISK_CATEGORIES.find((c) => c.key === key);
  if (!cat) return String(key);
  return cat.label[locale] || cat.label['en'];
}

// ─── Country Names ────────────────────────────────────────────────

export const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  RU: { ar: 'روسيا', en: 'Russia', fr: 'Russie', es: 'Rusia', tr: 'Rusya' },
  UA: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', es: 'Ucrania', tr: 'Ukrayna' },
  CN: { ar: 'الصين', en: 'China', fr: 'Chine', es: 'China', tr: 'Çin' },
  US: { ar: 'الولايات المتحدة', en: 'United States', fr: 'États-Unis', es: 'Estados Unidos', tr: 'ABD' },
  IR: { ar: 'إيران', en: 'Iran', fr: 'Iran', es: 'Irán', tr: 'İran' },
  IL: { ar: 'إسرائيل', en: 'Israel', fr: 'Israël', es: 'Israel', tr: 'İsrail' },
  SA: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie saoudite', es: 'Arabia Saudita', tr: 'Suudi Arabistan' },
  IQ: { ar: 'العراق', en: 'Iraq', fr: 'Irak', es: 'Irak', tr: 'Irak' },
  SY: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', es: 'Siria', tr: 'Suriye' },
  YE: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', es: 'Yemen', tr: 'Yemen' },
  TW: { ar: 'تايوان', en: 'Taiwan', fr: 'Taïwan', es: 'Taiwán', tr: 'Tayvan' },
  KP: { ar: 'كوريا الشمالية', en: 'North Korea', fr: 'Corée du Nord', es: 'Corea del Norte', tr: 'Kuzey Kore' },
  VE: { ar: 'فنزويلا', en: 'Venezuela', fr: 'Venezuela', es: 'Venezuela', tr: 'Venezuela' },
  AF: { ar: 'أفغانستان', en: 'Afghanistan', fr: 'Afghanistan', es: 'Afganistán', tr: 'Afganistan' },
  LY: { ar: 'ليبيا', en: 'Libya', fr: 'Libye', es: 'Libia', tr: 'Libya' },
  SD: { ar: 'السودان', en: 'Sudan', fr: 'Soudan', es: 'Sudán', tr: 'Sudan' },
  MM: { ar: 'ميانمار', en: 'Myanmar', fr: 'Myanmar', es: 'Myanmar', tr: 'Myanmar' },
  ET: { ar: 'إثيوبيا', en: 'Ethiopia', fr: 'Éthiopie', es: 'Etiopía', tr: 'Etiyopya' },
  SO: { ar: 'الصومال', en: 'Somalia', fr: 'Somalie', es: 'Somalia', tr: 'Somali' },
  NG: { ar: 'نيجيريا', en: 'Nigeria', fr: 'Nigéria', es: 'Nigeria', tr: 'Nijerya' },
};

export function getCountryName(code: string, locale: string): string {
  const names = COUNTRY_NAMES[code.toUpperCase()];
  if (!names) return code;
  return names[locale] || names['en'] || code;
}
