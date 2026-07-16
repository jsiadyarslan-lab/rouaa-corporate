// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// Patent Pending: "System for Automated Generation of
// Interactive Financial Infographics from News Content"
// ═══════════════════════════════════════════════════════════════
// ─── Infographic Slide Types ───────────────────────────────
// V5: Revolutionary prompt — 6-slide structure with new types
// Backward compatible: old types (stat, comparison, timeline, list, chart, quote, summary)
// still supported for existing infographics in the database

// ─── Legacy Types (kept for backward compatibility) ───────
export interface StatItem {
  label: string;
  value: string;
  change?: string;
  direction?: 'up' | 'down';
}

export interface ComparisonData {
  left: { label: string; items: string[] };
  right: { label: string; items: string[] };
}

export interface TimelineStep {
  label: string;
  description: string;
  date?: string;
}

export interface ListItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'gauge';
  labels: string[];
  values: number[];
  unit?: string;
}

export interface QuoteData {
  text: string;
  author?: string;
}

// ─── New V5 Types ─────────────────────────────────────────

export interface HeroContent {
  heroNumber?: string;    // الرقم الصادم الكبير
  heroUnit?: string;      // وحدة القياس
  tag?: string;           // تاج القطاع (طاقة/تقنية/ذهب...)
  status?: string;        // عاجل/مهم/فرصة/تحذير
  color?: string;         // red|green|orange|blue
}

export interface StoryElement {
  label: string;
  description?: string;
  icon?: string;
}

export interface StoryContent {
  pattern: 'A' | 'B' | 'C' | 'D';  // تدفق/مقارنة/خريطة/تسلسل
  elements: StoryElement[];
  leftLabel?: string;   // For pattern B (comparison)
  rightLabel?: string;
  beforeHeader?: string;
  afterHeader?: string;
  beforeItems?: string[];
  afterItems?: string[];
  changeItems?: string[];
}

export interface DataIndicator {
  name: string;        // اسم الأصل
  symbol?: string;     // الرمز البورصي
  value: string;       // القيمة
  direction: 'up' | 'down' | 'neutral';
  reason?: string;     // السبب
}

export interface DataContent {
  indicators: DataIndicator[];
}

export interface ScenarioItem {
  type: 'optimistic' | 'neutral' | 'pessimistic';
  emoji?: string;        // 🟢 🟡 🔴
  name: string;          // اسم السيناريو
  condition: string;     // الشرط
  result?: string;       // النتيجة المتوقعة
  price?: string | null; // السعر المتوقع
  probability: string;   // عالية/متوسطة/منخفضة
}

export interface ScenariosContent {
  scenarios: ScenarioItem[];
}

export interface AssetItem {
  name: string;     // اسم الأصل
  symbol: string;   // الرمز البورصي
  reason: string;   // السبب
  expected_move?: string | null;  // النسبة المتوقعة
}

export interface AssetsContent {
  benefiting: AssetItem[];  // تستفيد
  harmed: AssetItem[];      // تتضرر
}

export interface TradeRecommendation {
  asset: string;
  symbol?: string;    // الرمز البورصي
  action: string;     // شراء/بيع/مراقبة
  entry?: string | null;     // سعر الدخول
  target?: string | null;    // هدف
  stop?: string | null;      // وقف خسارة
  horizon?: string;   // أفق زمني
  timeframe?: string; // يومي/ساعي/4ساعات
  allocation?: string | null; // نسبة المحفظة
  reason?: string;    // السبب
}

export interface RecommendationsContent {
  daily?: TradeRecommendation;
  medium?: TradeRecommendation;
  long?: TradeRecommendation;
  summary: string[];  // 3 نقاط فقط
}

// ─── Chart Config Type (ECharts) ─────────────────────────
export interface ChartConfig {
  type: 'gauge' | 'bar' | 'line' | 'pie' | 'slope' | 'funnel' | 'treemap';
  // Gauge
  value?: number;
  max?: number;
  unit?: string;
  label?: string;
  // Bar
  categories?: string[];
  values?: number[];
  orientation?: 'horizontal' | 'vertical';
  colors?: string[];
  // Line
  labels?: string[];
  series?: { name: string; data: number[]; color?: string }[];
  // Pie
  data?: { name: string; value: number; color?: string }[];
  // Slope
  leftLabel?: string;
  rightLabel?: string;
  items?: { name: string; leftValue: number; rightValue: number; color?: string }[];
}

// ─── Unified Slide Type ──────────────────────────────────

export type SlideType = 
  // V5 new types
  | 'hero' | 'story' | 'data' | 'scenarios' | 'assets' | 'recommendations'
  // Legacy types (backward compat)
  | 'stat' | 'comparison' | 'timeline' | 'list' | 'chart' | 'quote' | 'summary';

export interface InfographicSlide {
  id?: string;
  number?: number;              // V5: Slide number (1-6)
  type: SlideType;
  title: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  color?: string;               // V5: red|green|orange|blue
  // V5: Image fields (AI-generated via Pollinations.ai)
  // V162: Renamed conceptually — 'unsplash_query' is kept for backward compat but now serves as AI image prompt
  unsplash_query?: string;      // كلمة بحث الصورة (AI prompt)
  image_position?: 'background-full' | 'right-30' | null;  // موقع الصورة
  image_overlay?: number;       // شفافية overlay (0-1)
  image_url?: string;           // رابط الصورة النهائي (AI-generated via Pollinations.ai)
  content: {
    // V5 new content types
    heroNumber?: string;
    heroUnit?: string;
    tag?: string;
    status?: string;
    pattern?: 'A' | 'B' | 'C' | 'D';
    elements?: any;  // Story elements (flexible — object or array)
    from?: string;   // Pattern A
    event?: string;
    to?: string;
    impact?: string;
    leftLabel?: string;
    rightLabel?: string;
    beforeHeader?: string;
    afterHeader?: string;
    beforeItems?: string[];
    afterItems?: string[];
    changeItems?: string[];
    indicators?: DataIndicator[];
    scenarios?: ScenarioItem[];
    benefiting?: AssetItem[];
    harmed?: AssetItem[];
    daily?: TradeRecommendation;
    medium?: TradeRecommendation;
    long?: TradeRecommendation;
    recommendations?: any;  // Full recommendations object
    summary?: string[];
    cta?: string;           // CTA button text
    // Legacy content types
    stats?: StatItem[];
    comparison?: ComparisonData;
    steps?: TimelineStep[];
    items?: ListItem[];
    chartData?: ChartData;
    quote?: QuoteData;
  };
  imageUrl?: string;  // Legacy — backward compat
  chart_config?: ChartConfig;  // V6: ECharts configuration
  image_prompt?: string;  // V6: AI image generation prompt
}

export interface InfographicData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  sourceType: string;
  sourceId?: string;
  sourceTitle?: string;
  category?: string;
  slides: InfographicSlide[];
  impactScore?: number;
  viewCount: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

// ─── Category → Primary Accent Color (V12 — only 5 functional colors) ────────
export const CATEGORY_COLORS: Record<string, string> = {
  'طاقة': '#10B981',
  'نفط': '#10B981',
  'غاز': '#10B981',
  'سلع': '#D4AF37',
  'ذهب': '#D4AF37',
  'اقتصاد كلي': '#3B82F6',
  'اقتصاد': '#3B82F6',
  'أسهم': '#3B82F6',
  'بورصة': '#3B82F6',
  'عملات': '#3B82F6',
  'فوركس': '#3B82F6',
  'تشفير': '#D4AF37',
  'كريبتو': '#D4AF37',
  'عقارات': '#D4AF37',
  'بنوك': '#3B82F6',
  'تقنية': '#3B82F6',
  'سياسة': '#EF4444',
  'حروب': '#EF4444',
  'دفاع': '#3B82F6',
};

// V12: Unified accent colors — only 5 functional colors
export const ACCENT_COLORS: Record<string, string> = {
  green: '#10B981',
  red: '#EF4444',
  gold: '#D4AF37',
  blue: '#3B82F6',
  orange: '#F59E0B',
};

// V10: Status color mapping — unified with DESIGN_TOKENS
export const STATUS_COLORS: Record<string, string> = {
  'عاجل': '#EF4444',
  'مهم': '#3B82F6',
  'فرصة': '#10B981',
  'تحذير': '#F59E0B',
};

// V5: Color name to hex mapping
export const COLOR_MAP: Record<string, string> = {
  red: '#EF4444',
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6',
};

// V13: Enhanced Design System — RTL-first + confidence colors + tabular-nums + empty states
// Key changes: RTL enforced, confidence bar color gradient, tabular-nums for data, empty state presets
export const DESIGN_TOKENS = {
  // ─── RTL (mandatory for Arabic content) ───
  direction: 'rtl' as const,
  textAlign: 'right' as const,
  // ─── Backgrounds (8px grid aligned) ───
  bgDeep: '#0A0E1A',             // أسود فضائي أعمق
  bgSlide: '#0F1424',            // خلفية شريحة موحدة
  bgCard: '#111827',             // رمادي غامق موحد
  bgCardHover: '#1A2035',        // عند التحويم
  bgGlass: 'rgba(10,14,26,0.80)', // خلفية شبه شفافة
  bgGlassBorder: 'rgba(255,255,255,0.06)',

  // ─── Text (WCAG AA compliant — minimum 4.5:1 contrast on #0A0E1A) ───
  textPrimary: '#F9FAFB',        // أبيض نقي (15.4:1)
  textSecondary: '#9CA3AF',      // رمادي محايد (5.7:1)
  textMuted: '#6B7280',          // رمادي هادئ (3.9:1 — labels only)
  textData: '#F3F4F6',           // بيانات/أرقام (14.8:1)
  textLabel: '#D1D5DB',          // تسميات ووصف (9.6:1)
  textSymbol: '#9CA3AF',         // رموز بورصية (5.7:1)

  // ─── Borders (unified) ───
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderDefault: '#1F2937',
  borderAccent: (color: string) => `${color}25`,

  // ─── Functional Colors (ONLY 5 — the key to consistency) ───
  success: '#10B981',            // أخضر زمردي (إيجابي/صعود)
  warning: '#F59E0B',            // كهرماني (محايد/تحذير)
  danger: '#EF4444',             // أحمر مرجاني (سلبي/هبوط)
  info: '#3B82F6',               // أزرق كهربائي (معلومات)
  gold: '#D4AF37',               // ذهبي فاخر (تصنيف فقط)
  cyan: '#00BCD4',               // سماوي (للمعلومات والإبراز)

  // ─── Removed colors (use functional colors instead) ───
  // purple → use info (#3B82F6) for stocks/banks, gold (#D4AF37) for commodities
  // cyan → use info (#3B82F6) for forex, gold (#D4AF37) for crypto highlight

  // ─── Shadows (subtle, unified) ───
  shadowCard: '0 4px 12px rgba(0,0,0,0.35)',
  shadowGlow: (color: string, intensity = 20) => `0 0 16px ${color}${intensity.toString(16).padStart(2,'0')}`,
  shadowInner: (color: string) => `inset 0 1px 0 ${color}08`,

  // ─── Border Radius (8px grid) ───
  radiusCard: '12px',
  radiusButton: '8px',
  radiusBadge: '8px',
  radiusIcon: '50%',

  // ─── Typography (strict hierarchy) ───
  // Readex Pro: all Arabic text | Inter: numbers/data ONLY
  // V214: Readex Pro replaces IBM Plex Sans Arabic as primary font
  // CSS variable first (next/font/google), literal name second (Google Fonts CDN <link>), Cairo third
  fontTitle: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif",
  fontData: "var(--font-jetbrains-mono), 'Inter', 'JetBrains Mono', monospace",
  fontChart: "var(--font-jetbrains-mono), 'Inter', monospace",
  fontBody: "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif",

  // ─── Font Feature Settings ───
  // V13: tabular-nums ensures numbers align vertically in data columns
  fontFeatureNumeric: 'tnum' as const,
  fontFeatureSettings: '"tnum"' as const,

  // ─── Confidence Bar Color Gradient (V13) ───
  // Maps confidence value to semantic color
  confidenceColor: (value: number) => {
    if (value < 30) return '#EF4444'; // red — low confidence
    if (value <= 70) return '#F59E0B'; // orange — medium confidence
    return '#10B981'; // green — high confidence
  },
  confidenceBg: (value: number, opacity = 0.10) => {
    const color = value < 30 ? '#EF4444' : value <= 70 ? '#F59E0B' : '#10B981';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  },

  // ─── Font Size Scale (8px grid aligned) ───
  fontSize: {
    hero: '56px',        // الرقم الصادم
    h1: '28px',          // عنوان شريحة
    h2: '22px',          // عنوان فرعي
    h3: '17px',          // عنوان بطاقة
    body: '14px',        // نص عادي
    data: '16px',        // بيانات/أرقام
    label: '12px',       // تسميات
    caption: '11px',     // تعليقات صغيرة
    badge: '10px',       // شارات
  },

  // ─── Spacing Scale (8px grid) ───
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // ─── Slide-Type Gradients (refined — more character) ───
  slideGradients: {
    hero: (color: string) => `linear-gradient(160deg, ${color}15 0%, ${color}08 30%, #0A0E1A 50%, #0A0E1A 100%)`,
    story: (color: string) => `linear-gradient(180deg, ${color}08 0%, ${color}04 20%, #0A0E1A 80%, #0A0E1A 100%)`,
    data: (color: string) => `linear-gradient(180deg, ${color}08 0%, #0F1424 25%, #0A0E1A 100%)`,
    scenarios: () => `linear-gradient(180deg, rgba(16,185,129,0.06) 0%, #0A0E1A 25%, rgba(245,158,11,0.04) 65%, #0A0E1A 100%)`,
    assets: () => `linear-gradient(180deg, rgba(16,185,129,0.06) 0%, #0A0E1A 45%, rgba(239,68,68,0.05) 100%)`,
    recommendations: (color: string) => `linear-gradient(180deg, ${color}08 0%, #0A0E1A 45%, ${color}05 100%)`,
  },

  // ─── Chart Container (refined — more contrast) ───
  chartContainer: {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '16px',
  },

  // ─── Glass Card Preset (simplified — less blur) ───
  glassCard: (borderAccent?: string) => ({
    background: 'rgba(17,24,39,0.85)',
    border: `1px solid ${borderAccent || 'rgba(255,255,255,0.06)'}`,
    borderRadius: '12px',
  }),

  // ─── Text Shadow Presets ───
  textShadowOverImage: '0 2px 8px rgba(0,0,0,0.8)',
  textShadowDefault: undefined as string | undefined,

  // ─── Empty State Preset (V13) ───
  emptyState: {
    background: 'rgba(17,24,39,0.60)',
    color: '#6B7280',
    iconSize: '32px',
    fontSize: '14px',
    padding: '48px 24px',
    borderRadius: '12px',
  },

  // ─── Navigation Bar Preset (V13) ───
  navBar: {
    height: '48px',
    background: 'rgba(10,14,26,0.92)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '0 16px',
  },

  // ─── Footer Preset (V13) ───
  footer: {
    background: 'rgba(10,14,26,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '16px',
    color: '#6B7280',
    fontSize: '11px',
  },

  // ─── Recommendation Card Preset (V13) ───
  recCard: {
    padding: '16px 20px',
    borderStartWidth: '3px',
    borderRadius: '0px', // No rounded corners on side-bordered cards
    descriptionColor: '#9CA3AF',
  },
} as const;

export function getCategoryColor(category?: string): string {
  if (!category) return '#3B82F6';
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key) || key.includes(category)) return color;
  }
  return '#3b82f6';
}

export function getAccentBg(color: string, opacity = 0.1): string {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
}

// V10: Direction color helper — single source of truth for up/down/neutral
export function getDirectionColor(direction?: string): string {
  if (direction === 'up') return DESIGN_TOKENS.success;
  if (direction === 'down') return DESIGN_TOKENS.danger;
  return DESIGN_TOKENS.textMuted;
}

// V10: Direction rgba helper for backgrounds
export function getDirectionBg(direction?: string, opacity = 0.08): string {
  const color = getDirectionColor(direction);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// V10: Hex to rgba converter
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Slide Content Validation ─────────────────────────────
// V5: Validates both new and legacy slide types
export function isSlideContentValid(slide: InfographicSlide): boolean {
  if (!slide || !slide.type) return false;
  if (!slide.title || slide.title.trim().length === 0) return false;

  const c = slide.content || {};
  switch (slide.type) {
    // V5 new types
    case 'hero':
      return true; // Hero always valid if title exists
    case 'story': {
      // V5: elements can be an array (legacy) OR an object (V5 AI output like {from, event, to, impact})
      if (!c.elements) return false;
      if (Array.isArray(c.elements)) return c.elements.length > 0 && c.elements.some(e => e.label && e.label.trim().length > 0);
      // Object-based elements (V5 pattern A/B/C/D)
      return Object.keys(c.elements).length > 0 && Object.values(c.elements).some(v => typeof v === 'string' && v.trim().length > 0);
    }
    case 'data':
      return Array.isArray(c.indicators) && c.indicators.length > 0 && c.indicators.some(i => i.name && i.name.trim().length > 0);
    case 'scenarios':
      return Array.isArray(c.scenarios) && c.scenarios.length > 0 && c.scenarios.some(s => s.name && s.name.trim().length > 0);
    case 'assets':
      return (Array.isArray(c.benefiting) && c.benefiting.length > 0) || (Array.isArray(c.harmed) && c.harmed.length > 0);
    case 'recommendations': {
      // V5: recommendations can have daily/medium/long objects + summary array
      const hasRecs = c.recommendations?.daily || c.recommendations?.medium || c.recommendations?.long || c.daily || c.medium || c.long;
      const hasSummary = Array.isArray(c.summary) && c.summary.length > 0 && c.summary.some(s => s && s.trim().length > 0);
      return hasRecs || hasSummary;
    }
    // Legacy types
    case 'stat':
      return Array.isArray(c.stats) && c.stats.length > 0 && c.stats.some(s => s.value && s.value.trim().length > 0);
    case 'comparison':
      return c.comparison?.left?.items?.length > 0 && c.comparison?.right?.items?.length > 0;
    case 'timeline':
      return Array.isArray(c.steps) && c.steps.length > 0 && c.steps.some(s => s.label && s.label.trim().length > 0);
    case 'list':
      return Array.isArray(c.items) && c.items.length > 0 && c.items.some(i => i.title && i.title.trim().length > 0);
    case 'chart': {
      if (!c.chartData?.values?.length || !c.chartData?.labels?.length) return false;
      if (c.chartData.values.length < 2 || c.chartData.labels.length < 2) return false;
      const validNums = c.chartData.values.filter((v: number) => typeof v === 'number' && !isNaN(v));
      return validNums.length >= 2;
    }
    case 'quote': {
      const quoteText = (c.quote?.text || '').replace(/[«»\u00AB\u00BB"]/g, '').trim();
      return quoteText.length >= 5 && !!c.quote?.author && c.quote.author.trim().length > 0;
    }
    case 'summary':
      return Array.isArray(c.summary) && c.summary.length > 0 && c.summary.some(s => s && s.trim().length > 0);
    default:
      return true;
  }
}
