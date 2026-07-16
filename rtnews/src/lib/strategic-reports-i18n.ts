// ═══════════════════════════════════════════════════════════════════
// Strategic Reports Center — i18n strings for 5 locales
// ═══════════════════════════════════════════════════════════════════

export type StrategicLocale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export interface StrategicStrings {
  // Header
  pageTitle: string;
  pageSubtitle: string;
  pageDescription: string;   // longer description in the info box
  reportsCount: string;      // {count} reports
  backToReports: string;
  // Filters
  filterByScope: string;
  filterByCategory: string;
  filterByImpact: string;
  searchPlaceholder: string;
  all: string;
  // Scope labels
  scopeGlobal: string;
  scopeArabic: string;
  scopeRegional: string;
  scopeDomestic: string;
  // Category labels (sectors)
  catPolitics: string;
  catEconomy: string;
  catMarkets: string;
  catEnergy: string;
  catCurrencies: string;
  catCrypto: string;
  catBanks: string;
  catCommodities: string;
  catTech: string;
  catGeopolitics: string;
  catFood: string;
  // Impact labels
  impactBullish: string;
  impactBearish: string;
  impactNeutral: string;
  // Card
  strategicBadge: string;
  aiSummaryBadge: string;
  listenButton: string;
  listenLoading: string;
  listenStop: string;
  readMore: string;
  relatedReports: string;
  noRelatedReports: string;
  confidenceLabel: string;
  marketImpactLabel: string;
  // Most read sidebar
  mostReadTitle: string;
  mostReadSubtitle: string;
  thisWeek: string;
  // Time
  now: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  monthsAgo: string;
  // Empty state
  noReports: string;
  noReportsHint: string;
  browseAll: string;
  // Disclaimer
  disclaimerTitle: string;
  disclaimerBody: string;
  // Newsletter
  newsletterTitle: string;
  newsletterSubtitle: string;
  // Direction
  dir: 'rtl' | 'ltr';
}

const STRINGS: Record<StrategicLocale, StrategicStrings> = {
  ar: {
    pageTitle: 'التقارير الاستراتيجية',
    pageSubtitle: 'تحليلات استراتيجية معمقة للتحولات الجيوسياسية والاقتصادية وتأثيرها على الأسواق',
    pageDescription: 'تقدم التقارير الاستراتيجية تحليلاً شاملاً وطويل الأمد للأسواق برؤية استشرافية. تغطي هذه التقارير الاتجاهات الكلية، والتأثيرات الجيوسياسية، والتحولات الهيكلية في الأسواق العالمية، لمساعدتك على اتخاذ قرارات مستنيرة لتموضع متوسط وطويل الأمد.',
    reportsCount: '{count} تقرير',
    backToReports: 'مركز التقارير',
    filterByScope: 'النطاق',
    filterByCategory: 'التصنيف',
    filterByImpact: 'التأثير',
    searchPlaceholder: 'ابحث في التقارير الاستراتيجية...',
    all: 'الكل',
    scopeGlobal: 'عالمي',
    scopeArabic: 'عربي',
    scopeRegional: 'إقليمي',
    scopeDomestic: 'محلي',
    catPolitics: 'سياسة',
    catEconomy: 'اقتصاد كلي',
    catMarkets: 'أسواق',
    catEnergy: 'طاقة',
    catCurrencies: 'عملات',
    catCrypto: 'كريبتو',
    catBanks: 'بنوك',
    catCommodities: 'سلع',
    catTech: 'تقنية',
    catGeopolitics: 'جيوسياسي',
    catFood: 'أمن غذائي',
    impactBullish: 'صعودي',
    impactBearish: 'هبوطي',
    impactNeutral: 'محايد',
    strategicBadge: 'استراتيجي',
    aiSummaryBadge: 'ملخص AI',
    listenButton: 'استمع',
    listenLoading: 'جارٍ التحميل...',
    listenStop: 'إيقاف',
    readMore: 'اقرأ المزيد',
    relatedReports: 'تقارير ذات صلة',
    noRelatedReports: 'لا توجد تقارير ذات صلة بعد',
    confidenceLabel: 'الثقة',
    marketImpactLabel: 'التأثير',
    mostReadTitle: 'الأكثر قراءة',
    mostReadSubtitle: 'الأكثر رواجاً هذا الأسبوع',
    thisWeek: 'هذا الأسبوع',
    now: 'الآن',
    minutesAgo: 'منذ {n} دقيقة',
    hoursAgo: 'منذ {n} ساعة',
    daysAgo: 'منذ {n} يوم',
    monthsAgo: 'منذ {n} شهر',
    noReports: 'لا توجد تقارير استراتيجية حالياً',
    noReportsHint: 'يتم إنشاء التقارير الاستراتيجية تلقائياً بواسطة الذكاء الاصطناعي',
    browseAll: 'تصفح كل التقارير',
    disclaimerTitle: 'إخلاء مسؤولية',
    disclaimerBody: 'التقارير الاستراتيجية مُولّدة بالذكاء الاصطناعي وتقدم تحليلاً استشرافياً بناءً على البيانات المتاحة. لا تُعد نصيحة مالية. قد تتغير ظروف السوق بسرعة وقد تختلف النتائج الفعلية بشكل كبير عن التوقعات. أجرِ بحثك الخاص دائماً قبل اتخاذ قرارات الاستثمار.',
    newsletterTitle: 'النشرة البريدية',
    newsletterSubtitle: 'اشترك لتلقي أحدث التقارير الاستراتيجية مباشرة في بريدك الإلكتروني',
    dir: 'rtl',
  },
  en: {
    pageTitle: 'Strategic Reports',
    pageSubtitle: 'In-depth strategic analysis of geopolitical and economic shifts and their market impact',
    pageDescription: 'Strategic reports provide comprehensive, long-term market analysis with forward-looking insights. These reports cover macro trends, geopolitical impacts, and structural shifts across global markets, helping you make informed decisions for medium to long-term positioning.',
    reportsCount: '{count} reports',
    backToReports: 'Reports Hub',
    filterByScope: 'Scope',
    filterByCategory: 'Category',
    filterByImpact: 'Impact',
    searchPlaceholder: 'Search strategic reports...',
    all: 'All',
    scopeGlobal: 'Global',
    scopeArabic: 'Arabic',
    scopeRegional: 'Regional',
    scopeDomestic: 'Domestic',
    catPolitics: 'Politics',
    catEconomy: 'Macro Economy',
    catMarkets: 'Markets',
    catEnergy: 'Energy',
    catCurrencies: 'Currencies',
    catCrypto: 'Crypto',
    catBanks: 'Banks',
    catCommodities: 'Commodities',
    catTech: 'Technology',
    catGeopolitics: 'Geopolitics',
    catFood: 'Food Security',
    impactBullish: 'Bullish',
    impactBearish: 'Bearish',
    impactNeutral: 'Neutral',
    strategicBadge: 'Strategic',
    aiSummaryBadge: 'AI Summary',
    listenButton: 'Listen',
    listenLoading: 'Loading...',
    listenStop: 'Stop',
    readMore: 'Read more',
    relatedReports: 'Related Reports',
    noRelatedReports: 'No related reports yet',
    confidenceLabel: 'Confidence',
    marketImpactLabel: 'Impact',
    mostReadTitle: 'Most Read',
    mostReadSubtitle: 'Most popular this week',
    thisWeek: 'This Week',
    now: 'now',
    minutesAgo: '{n}m ago',
    hoursAgo: '{n}h ago',
    daysAgo: '{n}d ago',
    monthsAgo: '{n}mo ago',
    noReports: 'No strategic reports available yet',
    noReportsHint: 'Our AI pipeline is generating in-depth strategic analyses. Check back soon.',
    browseAll: 'Browse All Reports',
    disclaimerTitle: 'Disclaimer',
    disclaimerBody: 'Strategic reports are generated by AI and provide forward-looking analysis based on available data. They do not constitute financial advice. Market conditions may change rapidly and actual outcomes may differ significantly from projections. Always conduct your own research before making investment decisions.',
    newsletterTitle: 'Newsletter',
    newsletterSubtitle: 'Subscribe to receive the latest strategic reports directly in your inbox',
    dir: 'ltr',
  },
  fr: {
    pageTitle: 'Rapports Stratégiques',
    pageSubtitle: 'Analyses stratégiques approfondies des mutations géopolitiques et économiques',
    pageDescription: 'Les rapports stratégiques fournissent une analyse complète et à long terme des marchés avec des perspectives prospectives. Ces rapports couvrent les tendances macro, les impacts géopolitiques et les changements structurels sur les marchés mondiaux.',
    reportsCount: '{count} rapports',
    backToReports: 'Centre des rapports',
    filterByScope: 'Portée',
    filterByCategory: 'Catégorie',
    filterByImpact: 'Impact',
    searchPlaceholder: 'Rechercher des rapports stratégiques...',
    all: 'Toutes',
    scopeGlobal: 'Mondial',
    scopeArabic: 'Arabe',
    scopeRegional: 'Régional',
    scopeDomestic: 'National',
    catPolitics: 'Politique',
    catEconomy: 'Économie',
    catMarkets: 'Marchés',
    catEnergy: 'Énergie',
    catCurrencies: 'Devises',
    catCrypto: 'Crypto',
    catBanks: 'Banques',
    catCommodities: 'Matières premières',
    catTech: 'Technologie',
    catGeopolitics: 'Géopolitique',
    catFood: 'Sécurité alimentaire',
    impactBullish: 'Haussier',
    impactBearish: 'Baissier',
    impactNeutral: 'Neutre',
    strategicBadge: 'Stratégique',
    aiSummaryBadge: 'Résumé IA',
    listenButton: 'Écouter',
    listenLoading: 'Chargement...',
    listenStop: 'Arrêter',
    readMore: 'Lire plus',
    relatedReports: 'Rapports associés',
    noRelatedReports: 'Aucun rapport associé',
    confidenceLabel: 'Confiance',
    marketImpactLabel: 'Impact',
    mostReadTitle: 'Plus Lus',
    mostReadSubtitle: 'Plus populaires cette semaine',
    thisWeek: 'Cette semaine',
    now: 'maintenant',
    minutesAgo: 'il y a {n} min',
    hoursAgo: 'il y a {n} h',
    daysAgo: 'il y a {n} j',
    monthsAgo: 'il y a {n} mois',
    noReports: 'Aucun rapport stratégique disponible',
    noReportsHint: 'Notre pipeline IA génère des analyses stratégiques approfondies.',
    browseAll: 'Tous les rapports',
    disclaimerTitle: 'Avertissement',
    disclaimerBody: 'Les rapports stratégiques sont générés par IA et fournissent une analyse prospective basée sur les données disponibles. Ils ne constituent pas un conseil financier. Les conditions du marché peuvent changer rapidement.',
    newsletterTitle: 'Newsletter',
    newsletterSubtitle: 'Abonnez-vous pour recevoir les derniers rapports stratégiques',
    dir: 'ltr',
  },
  tr: {
    pageTitle: 'Stratejik Raporlar',
    pageSubtitle: 'Jeopolitik ve ekonomik dönüşmelerin derinlemesine stratejik analizi',
    pageDescription: 'Stratejik raporlar, ileriye dönük içgörülerle kapsamlı, uzun vadeli piyasa analizi sağlar. Bu raporlar makro eğilimleri, jeopolitik etkileri ve küresel piyasalardaki yapısal değişimleri kapsar.',
    reportsCount: '{count} rapor',
    backToReports: 'Rapor Merkezi',
    filterByScope: 'Kapsam',
    filterByCategory: 'Kategori',
    filterByImpact: 'Etki',
    searchPlaceholder: 'Stratejik raporlarda ara...',
    all: 'Tümü',
    scopeGlobal: 'Küresel',
    scopeArabic: 'Arap',
    scopeRegional: 'Bölgesel',
    scopeDomestic: 'Yerel',
    catPolitics: 'Siyaset',
    catEconomy: 'Makro Ekonomi',
    catMarkets: 'Piyasalar',
    catEnergy: 'Enerji',
    catCurrencies: 'Döviz',
    catCrypto: 'Kripto',
    catBanks: 'Bankalar',
    catCommodities: 'Emtia',
    catTech: 'Teknoloji',
    catGeopolitics: 'Jeopolitik',
    catFood: 'Gıda Güvenliği',
    impactBullish: 'Yükseliş',
    impactBearish: 'Düşüş',
    impactNeutral: 'Nötr',
    strategicBadge: 'Stratejik',
    aiSummaryBadge: 'AI Özeti',
    listenButton: 'Dinle',
    listenLoading: 'Yükleniyor...',
    listenStop: 'Durdur',
    readMore: 'Devamını oku',
    relatedReports: 'İlgili Raporlar',
    noRelatedReports: 'Henüz ilgili rapor yok',
    confidenceLabel: 'Güven',
    marketImpactLabel: 'Etki',
    mostReadTitle: 'En Çok Okunan',
    mostReadSubtitle: 'Bu hafta en popüler',
    thisWeek: 'Bu hafta',
    now: 'şimdi',
    minutesAgo: '{n} dk önce',
    hoursAgo: '{n} sa önce',
    daysAgo: '{n} gün önce',
    monthsAgo: '{n} ay önce',
    noReports: 'Henüz stratejik rapor yok',
    noReportsHint: 'AI hattımız derinlemesine stratejik analizler oluşturuyor.',
    browseAll: 'Tüm raporlar',
    disclaimerTitle: 'Yasal Uyarı',
    disclaimerBody: 'Stratejik raporlar AI tarafından oluşturulur ve veriye dayalı ileriye dönük analiz sağlar. Finansal tavsiye değildir. Piyasa koşulları hızla değişebilir.',
    newsletterTitle: 'Bülten',
    newsletterSubtitle: 'En son stratejik raporları e-postanıza alın',
    dir: 'ltr',
  },
  es: {
    pageTitle: 'Informes Estratégicos',
    pageSubtitle: 'Análisis estratégicos profundos de los cambios geopolíticos y económicos',
    pageDescription: 'Los informes estratégicos proporcionan un análisis integral y a largo plazo del mercado con perspectivas prospectivas. Estos informes cubren tendencias macro, impactos geopolíticos y cambios estructurales en los mercados globales.',
    reportsCount: '{count} informes',
    backToReports: 'Centro de informes',
    filterByScope: 'Alcance',
    filterByCategory: 'Categoría',
    filterByImpact: 'Impacto',
    searchPlaceholder: 'Buscar informes estratégicos...',
    all: 'Todos',
    scopeGlobal: 'Global',
    scopeArabic: 'Árabe',
    scopeRegional: 'Regional',
    scopeDomestic: 'Nacional',
    catPolitics: 'Política',
    catEconomy: 'Economía',
    catMarkets: 'Mercados',
    catEnergy: 'Energía',
    catCurrencies: 'Divisas',
    catCrypto: 'Cripto',
    catBanks: 'Bancos',
    catCommodities: 'Materias primas',
    catTech: 'Tecnología',
    catGeopolitics: 'Geopolítica',
    catFood: 'Seguridad alimentaria',
    impactBullish: 'Alcista',
    impactBearish: 'Bajista',
    impactNeutral: 'Neutral',
    strategicBadge: 'Estratégico',
    aiSummaryBadge: 'Resumen IA',
    listenButton: 'Escuchar',
    listenLoading: 'Cargando...',
    listenStop: 'Detener',
    readMore: 'Leer más',
    relatedReports: 'Informes relacionados',
    noRelatedReports: 'Aún no hay informes relacionados',
    confidenceLabel: 'Confianza',
    marketImpactLabel: 'Impacto',
    mostReadTitle: 'Más leídos',
    mostReadSubtitle: 'Más populares esta semana',
    thisWeek: 'Esta semana',
    now: 'ahora',
    minutesAgo: 'hace {n} min',
    hoursAgo: 'hace {n} h',
    daysAgo: 'hace {n} d',
    monthsAgo: 'hace {n} meses',
    noReports: 'No hay informes estratégicos disponibles',
    noReportsHint: 'Nuestra pipeline de IA está generando análisis estratégicos profundos.',
    browseAll: 'Todos los informes',
    disclaimerTitle: 'Aviso legal',
    disclaimerBody: 'Los informes estratégicos son generados por IA y proporcionan análisis prospectivo basado en datos disponibles. No constituyen asesoramiento financiero.',
    newsletterTitle: 'Boletín',
    newsletterSubtitle: 'Suscríbete para recibir los últimos informes estratégicos',
    dir: 'ltr',
  },
};

export function getStrategicStrings(locale: string): StrategicStrings {
  return STRINGS[locale as StrategicLocale] || STRINGS.ar;
}

// ─── Time-ago formatter (locale-aware) ──────────────────────────
export function formatTimeAgoStrategic(dateStr: string, locale: string): string {
  const s = getStrategicStrings(locale);
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return s.now;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return s.now;
    if (diffMin < 60) return s.minutesAgo.replace('{n}', String(diffMin));
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return s.hoursAgo.replace('{n}', String(diffHr));
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return s.daysAgo.replace('{n}', String(diffDay));
    const diffMonth = Math.floor(diffDay / 30);
    return s.monthsAgo.replace('{n}', String(diffMonth));
  } catch {
    return s.now;
  }
}

// ─── Date formatter (locale-aware) ──────────────────────────────
export function formatDateStrategic(dateStr: string, locale: string): string {
  try {
    const date = new Date(dateStr);
    const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(localeTag, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}
