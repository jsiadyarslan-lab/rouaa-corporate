// ─── Unified News Category Definitions ────────────────────────
// Shared across all news-related components and pages.
// Matches the REPORT_CATEGORIES design pattern from reports section
// but adapted for news-specific needs (time-based, impact-based).

export const NEWS_CATEGORIES = [
  { id: 'economy', nameAr: 'اقتصاد كلي', nameEn: 'Economy', nameFr: 'Économie', nameEs: 'Economía', nameTr: 'Ekonomi', icon: '🏛️', color: '#FF6B85', colorBg: 'rgba(239,83,80,.12)', colorBorder: 'rgba(239,83,80,.22)', dbCategories: ['اقتصاد كلي', 'اقتصاد أمريكي', 'اقتصاد', 'اقتصادي كلي', 'economy', 'Economy', 'Macro Economy', 'Macroeconomics', 'Économie', 'Economía', 'Ekonomi', 'Makro Ekonomi'] },
  { id: 'stocks', nameAr: 'أسهم', nameEn: 'Stocks', nameFr: 'Actions', nameEs: 'Acciones', nameTr: 'Hisseler', icon: '📈', color: '#5B8DEF', colorBg: 'rgba(91,141,239,.14)', colorBorder: 'rgba(91,141,239,.3)', dbCategories: ['أسهم', 'بورصة', 'stocks', 'Stocks', 'Actions', 'Acciones', 'Renta Variable', 'Hisseler', 'Hisse Senetleri'] },
  { id: 'forex', nameAr: 'فوركس', nameEn: 'Forex', nameFr: 'Devises', nameEs: 'Divisas', nameTr: 'Döviz', icon: '💱', color: '#3BA7F0', colorBg: 'rgba(59,167,240,.14)', colorBorder: 'rgba(59,167,240,.3)', dbCategories: ['عملات', 'فوركس', 'أسواق العملات الأجنبية', 'forex', 'Forex', 'Currencies', 'Devises', 'Divisas', 'Döviz'] },
  { id: 'crypto', nameAr: 'كريبتو', nameEn: 'Crypto', nameFr: 'Crypto', nameEs: 'Criptomonedas', nameTr: 'Kripto', icon: '₿', color: '#A78BFA', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)', dbCategories: ['كريبتو', 'تشفير', 'عملات رقمية', 'أصول رقمية', 'crypto', 'Crypto', 'Criptomonedas', 'Kripto'] },
  { id: 'energy', nameAr: 'طاقة', nameEn: 'Energy', nameFr: 'Énergie', nameEs: 'Energía', nameTr: 'Enerji', icon: '⚡', color: '#E8824A', colorBg: 'rgba(232,130,74,.16)', colorBorder: 'rgba(232,130,74,.3)', dbCategories: ['طاقة', 'نفط', 'خام', 'الطاقة', 'الطاقة والسلع', 'energy', 'Energy', 'Oil & Gas', 'Énergie', 'Energía', 'Enerji'] },
  { id: 'commodities', nameAr: 'سلع', nameEn: 'Commodities', nameFr: 'Matières Premières', nameEs: 'Materias Primas', nameTr: 'Emtia', icon: '🥇', color: '#F0A500', colorBg: 'rgba(240,165,0,.18)', colorBorder: 'rgba(240,165,0,.35)', dbCategories: ['سلع', 'معادن', 'commodities', 'Commodities', 'Metals', 'Matières Premières', 'Materias Primas', 'Emtia', 'Emtialar'] },
  { id: 'bonds', nameAr: 'سندات', nameEn: 'Bonds', nameFr: 'Obligations', nameEs: 'Bonos', nameTr: 'Tahviller', icon: '📜', color: '#7C83FF', colorBg: 'rgba(124,131,255,.14)', colorBorder: 'rgba(124,131,255,.3)', dbCategories: ['سندات', 'bonds', 'Bonds', 'Obligations', 'Bonos', 'Renta Fija', 'Tahviller'] },
  { id: 'technology', nameAr: 'تقنية', nameEn: 'Technology', nameFr: 'Technologie', nameEs: 'Tecnología', nameTr: 'Teknoloji', icon: '💻', color: '#06B6D4', colorBg: 'rgba(6,182,212,.14)', colorBorder: 'rgba(6,182,212,.3)', dbCategories: ['تقنية', 'تكنولوجيا', 'القطاع التكنولوجي', 'technology', 'Technology', 'Tech', 'Technologie', 'Tecnología', 'Teknoloji'] },
  { id: 'technicalAnalysis', nameAr: 'تحليل فني', nameEn: 'Technical Analysis', nameFr: 'Analyse Technique', nameEs: 'Análisis Técnico', nameTr: 'Teknik Analiz', icon: '📊', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)', dbCategories: ['تحليل فني', 'technicalAnalysis', 'Technical Analysis', 'Analyse Technique', 'Análisis Técnico', 'Teknik Analiz'] },
  { id: 'earnings', nameAr: 'أرباح الشركات', nameEn: 'Earnings', nameFr: 'Résultats', nameEs: 'Resultados', nameTr: 'Kazançlar', icon: '💰', color: '#FFB800', colorBg: 'rgba(255,184,0,.12)', colorBorder: 'rgba(255,184,0,.25)', dbCategories: ['أرباح شركات', 'earnings', 'Earnings', 'Corporate Earnings', 'Résultats', 'Resultados', 'Mali Tablolar', 'Kazançlar', 'Şirket Kazançları'] },
  { id: 'realEstate', nameAr: 'عقارات', nameEn: 'Real Estate', nameFr: 'Immobilier', nameEs: 'Inmobiliario', nameTr: 'Gayrimenkul', icon: '🏗️', color: '#4CC38A', colorBg: 'rgba(76,195,138,.14)', colorBorder: 'rgba(76,195,138,.3)', dbCategories: ['عقارات', 'realEstate', 'Real Estate', 'Immobilier', 'Inmobiliario', 'Bienes Raíces', 'Gayrimenkul'] },
  { id: 'arabMarkets', nameAr: 'أسواق عربية', nameEn: 'Arab Markets', nameFr: 'Marchés Arabes', nameEs: 'Mercados Árabes', nameTr: 'Arap Pazarları', icon: '🕌', color: '#00C9A7', colorBg: 'rgba(0,201,167,.12)', colorBorder: 'rgba(0,201,167,.25)', dbCategories: ['أسواق عربية', 'خليج', 'سعودي', 'إمارات', 'مصر بورصة', 'أبوظبي مالي', 'arabMarkets', 'Arab Markets', 'Marchés Arabes', 'Mercados Árabes', 'Arap Pazarları'] },
  { id: 'strategic', nameAr: 'جيوسياسي', nameEn: 'Geopolitics', nameFr: 'Géopolitique', nameEs: 'Geopolítica', nameTr: 'Jeopolitik', icon: '🌍', color: '#F43F5E', colorBg: 'rgba(244,63,94,.12)', colorBorder: 'rgba(244,63,94,.25)', dbCategories: ['جيوسياسي', 'سياسة', 'strategic', 'Strategic', 'Geopolitics', 'Politics', 'Géopolitique', 'Geopolítica', 'Estratégico', 'Jeopolitik', 'Siyaset'] },
  { id: 'banking', nameAr: 'بنوك', nameEn: 'Banking', nameFr: 'Banque', nameEs: 'Banca', nameTr: 'Bankacılık', icon: '🏦', color: '#6366F1', colorBg: 'rgba(99,102,241,.12)', colorBorder: 'rgba(99,102,241,.22)', dbCategories: ['بنوك', 'بنوك مركزية', 'banking', 'Banking', 'Banks', 'Central Banks', 'Banque', 'Banca', 'Bankacılık'] },
] as const;

export type NewsCategoryId = typeof NEWS_CATEGORIES[number]['id'];

// Map a DB category string to our unified category ID
// This handles the mismatch between DB categories and display categories
const DB_TO_CATEGORY_ID: Record<string, NewsCategoryId> = {};
for (const cat of NEWS_CATEGORIES) {
  for (const dbCat of cat.dbCategories) {
    DB_TO_CATEGORY_ID[dbCat] = cat.id;
  }
}

export function getNewsCategoryId(dbCategory: string): NewsCategoryId {
  return DB_TO_CATEGORY_ID[dbCategory] || 'economy';
}

export function getNewsCategoryById(id: string): typeof NEWS_CATEGORIES[number] | undefined {
  return NEWS_CATEGORIES.find(c => c.id === id);
}

/**
 * Get a category's display name for a given locale.
 * Central source of truth — all components should use this instead of
 * accessing nameEn/nameFr/nameEs/nameTr directly.
 */
export function getCategoryNameByLocale(cat: typeof NEWS_CATEGORIES[number], locale: string): string {
  if (locale === 'ar') return cat.nameAr;
  if (locale === 'fr') return cat.nameFr;
  if (locale === 'es') return cat.nameEs;
  if (locale === 'tr') return cat.nameTr;
  return cat.nameEn;
}

/**
 * Get a category's display name by its ID and locale.
 */
export function getCategoryNameById(categoryId: string, locale: string): string {
  const cat = NEWS_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return categoryId;
  return getCategoryNameByLocale(cat, locale);
}

// ─── Sentiment / Impact Configs ──────────────────────────────────

export const IMPACT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'عالي', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  medium: { label: 'متوسط', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: 'منخفض', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
};

export const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'إيجابي', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
  negative: { label: 'سلبي', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)' },
  neutral: { label: 'محايد', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

// ─── Time Helpers ─────────────────────────────────────────────────

export function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'الآن';
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  } catch {
    return 'الآن';
  }
}
