// ═══════════════════════════════════════════════════════════════════
// Technical Analyses — i18n strings for 5 locales
// V2: Expanded with empty state, heatmap, comparison, alerts, RSS
// ═══════════════════════════════════════════════════════════════════

export type TALocale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export interface TAStrings {
  pageTitle: string;
  pageSubtitle: string;
  reportsCount: string;
  backToReports: string;
  filterByAsset: string;
  filterByType: string;
  filterByRisk: string;
  filterBySentiment: string;
  filterByTime: string;
  filterBySymbol: string;
  searchPlaceholder: string;
  all: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  totalAnalyses: string;
  bullishCount: string;
  bearishCount: string;
  highRiskCount: string;
  highConfidenceCount: string;
  readMore: string;
  confidenceLabel: string;
  priceTargetLabel: string;
  currentLabel: string;
  targetLabel: string;
  stopLossLabel: string;
  validUntilLabel: string;
  noAnalyses: string;
  noAnalysesHint: string;
  noAnalysesCta: string;
  noAnalysesCtaHref: string;
  topConfidence: string;
  topConfidenceSubtitle: string;
  latestAnalyses: string;
  shareOn: string;
  shareTwitter: string;
  shareTelegram: string;
  shareWhatsApp: string;
  shareCopy: string;
  copyLinkSuccess: string;
  sourceLocal: string;
  sourceExternal: string;
  loadingAnalyses: string;
  tabCrypto: string;
  tabForex: string;
  tabStocks: string;
  tabCommodities: string;
  tabAll: string;
  heatmapTitle: string;
  heatmapSubtitle: string;
  compareTitle: string;
  compareSubtitle: string;
  compareSelect: string;
  compareButton: string;
  alertTitle: string;
  alertSubtitle: string;
  alertButton: string;
  rssFeed: string;
  dir: 'rtl' | 'ltr';
}

const STRINGS: Record<TALocale, TAStrings> = {
  ar: {
    pageTitle: 'تحليلات فنية متقدمة',
    pageSubtitle: 'تحليلات فنية وأساسية احترافية للأسواق والعملات والأسهم والكريبتو مع نقاط دخول وخروج ومستوى المخاطر',
    reportsCount: '{count} تحليل',
    backToReports: 'مركز التقارير',
    filterByAsset: 'فئة الأصل',
    filterByType: 'نوع التحليل',
    filterByRisk: 'مستوى المخاطر',
    filterBySentiment: 'المشاعر',
    filterByTime: 'المدة الزمنية',
    filterBySymbol: 'الرمز',
    searchPlaceholder: 'ابحث بالعنوان أو الرمز...',
    all: 'الكل',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    totalAnalyses: 'إجمالي التحليلات',
    bullishCount: 'صعودي',
    bearishCount: 'هبوطي',
    highRiskCount: 'مرتفع المخاطر',
    highConfidenceCount: 'عالي الثقة',
    readMore: 'اقرأ المزيد',
    confidenceLabel: 'الثقة',
    priceTargetLabel: 'السعر المستهدف',
    currentLabel: 'الحالي',
    targetLabel: 'الهدف',
    stopLossLabel: 'وقف الخسارة',
    validUntilLabel: 'صالح حتى',
    noAnalyses: 'لا توجد تحليلات فنية حالياً',
    noAnalysesHint: 'يتم إنشاء التحليلات تلقائياً بواسطة الذكاء الاصطناعي كل ساعة',
    noAnalysesCta: 'تصفح التقارير الاستراتيجية',
    noAnalysesCtaHref: '/strategic-reports',
    topConfidence: 'الأعلى ثقة',
    topConfidenceSubtitle: 'تحليلات بثقة ≥ 80%',
    latestAnalyses: 'أحدث التحليلات',
    shareOn: 'مشاركة',
    shareTwitter: 'تويتر',
    shareTelegram: 'تيليجرام',
    shareWhatsApp: 'واتساب',
    shareCopy: 'نسخ الرابط',
    copyLinkSuccess: 'تم نسخ الرابط',
    sourceLocal: 'محلي',
    sourceExternal: 'منصة التداول',
    loadingAnalyses: 'جارٍ تحميل التحليلات…',
    tabCrypto: 'العملات الرقمية',
    tabForex: 'الفوركس',
    tabStocks: 'الأسهم',
    tabCommodities: 'السلع',
    tabAll: 'الكل',
    heatmapTitle: 'خريطة حرارية للأسواق',
    heatmapSubtitle: 'توزيع التحليلات حسب الفئة والمشاعر',
    compareTitle: 'مقارنة الأصول',
    compareSubtitle: 'قارن تحليلين جنباً إلى جنب',
    compareSelect: 'اختر زوجين للمقارنة',
    compareButton: 'قارن',
    alertTitle: 'تنبيهات التحليلات',
    alertSubtitle: 'أعلمني عند نشر تحليل جديد',
    alertButton: 'تفعيل التنبيهات',
    rssFeed: 'RSS',
    dir: 'rtl',
  },
  en: {
    pageTitle: 'Advanced Technical Analyses',
    pageSubtitle: 'Professional technical and fundamental analyses for markets, currencies, stocks, and crypto with entry/exit points and risk levels',
    reportsCount: '{count} analyses',
    backToReports: 'Reports Hub',
    filterByAsset: 'Asset Class',
    filterByType: 'Analysis Type',
    filterByRisk: 'Risk Level',
    filterBySentiment: 'Sentiment',
    filterByTime: 'Time Period',
    filterBySymbol: 'Symbol',
    searchPlaceholder: 'Search by title or symbol...',
    all: 'All',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    totalAnalyses: 'Total Analyses',
    bullishCount: 'Bullish',
    bearishCount: 'Bearish',
    highRiskCount: 'High Risk',
    highConfidenceCount: 'High Confidence',
    readMore: 'Read more',
    confidenceLabel: 'Confidence',
    priceTargetLabel: 'Price Target',
    currentLabel: 'Current',
    targetLabel: 'Target',
    stopLossLabel: 'Stop Loss',
    validUntilLabel: 'Valid until',
    noAnalyses: 'No technical analyses available',
    noAnalysesHint: 'Analyses are auto-generated by AI every hour',
    noAnalysesCta: 'Browse Strategic Reports',
    noAnalysesCtaHref: '/en/strategic-reports',
    topConfidence: 'Top Confidence',
    topConfidenceSubtitle: 'Analyses with confidence ≥ 80%',
    latestAnalyses: 'Latest Analyses',
    shareOn: 'Share',
    shareTwitter: 'Twitter',
    shareTelegram: 'Telegram',
    shareWhatsApp: 'WhatsApp',
    shareCopy: 'Copy Link',
    copyLinkSuccess: 'Link copied',
    sourceLocal: 'Local',
    sourceExternal: 'Trading Platform',
    loadingAnalyses: 'Loading analyses…',
    tabCrypto: 'Crypto',
    tabForex: 'Forex',
    tabStocks: 'Stocks',
    tabCommodities: 'Commodities',
    tabAll: 'All',
    heatmapTitle: 'Market Heatmap',
    heatmapSubtitle: 'Analysis distribution by category and sentiment',
    compareTitle: 'Asset Comparison',
    compareSubtitle: 'Compare two analyses side by side',
    compareSelect: 'Select two pairs to compare',
    compareButton: 'Compare',
    alertTitle: 'Analysis Alerts',
    alertSubtitle: 'Notify me when new analyses are published',
    alertButton: 'Enable Alerts',
    rssFeed: 'RSS',
    dir: 'ltr',
  },
  fr: {
    pageTitle: 'Analyses Techniques Avancées',
    pageSubtitle: 'Analyses techniques et fondamentales professionnelles pour marchés, devises, actions et crypto',
    reportsCount: '{count} analyses',
    backToReports: 'Centre des rapports',
    filterByAsset: 'Classe d\'actif',
    filterByType: 'Type d\'analyse',
    filterByRisk: 'Niveau de risque',
    filterBySentiment: 'Sentiment',
    filterByTime: 'Période',
    filterBySymbol: 'Symbole',
    searchPlaceholder: 'Rechercher par titre ou symbole...',
    all: 'Toutes',
    today: "Aujourd'hui",
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    totalAnalyses: 'Total analyses',
    bullishCount: 'Haussier',
    bearishCount: 'Baissier',
    highRiskCount: 'Risque élevé',
    highConfidenceCount: 'Haute confiance',
    readMore: 'Lire plus',
    confidenceLabel: 'Confiance',
    priceTargetLabel: 'Objectif de prix',
    currentLabel: 'Actuel',
    targetLabel: 'Objectif',
    stopLossLabel: 'Stop loss',
    validUntilLabel: 'Valable jusqu\'au',
    noAnalyses: 'Aucune analyse technique disponible',
    noAnalysesHint: 'Les analyses sont générées par IA toutes les heures',
    noAnalysesCta: 'Voir les rapports stratégiques',
    noAnalysesCtaHref: '/fr/strategic-reports',
    topConfidence: 'Top confiance',
    topConfidenceSubtitle: 'Analyses avec confiance ≥ 80%',
    latestAnalyses: 'Dernières analyses',
    shareOn: 'Partager',
    shareTwitter: 'Twitter',
    shareTelegram: 'Telegram',
    shareWhatsApp: 'WhatsApp',
    shareCopy: 'Copier le lien',
    copyLinkSuccess: 'Lien copié',
    sourceLocal: 'Local',
    sourceExternal: 'Plateforme',
    loadingAnalyses: 'Chargement…',
    tabCrypto: 'Crypto',
    tabForex: 'Forex',
    tabStocks: 'Actions',
    tabCommodities: 'Matières premières',
    tabAll: 'Toutes',
    heatmapTitle: 'Carte thermique',
    heatmapSubtitle: 'Distribution des analyses par catégorie et sentiment',
    compareTitle: 'Comparaison d\'actifs',
    compareSubtitle: 'Comparez deux analyses côte à côte',
    compareSelect: 'Sélectionnez deux paires à comparer',
    compareButton: 'Comparer',
    alertTitle: 'Alertes d\'analyse',
    alertSubtitle: 'Notifiez-moi quand de nouvelles analyses sont publiées',
    alertButton: 'Activer les alertes',
    rssFeed: 'RSS',
    dir: 'ltr',
  },
  tr: {
    pageTitle: 'Gelişmiş Teknik Analizler',
    pageSubtitle: 'Piyasalar, döviz, hisseler ve kripto için profesyonel teknik ve temel analizler',
    reportsCount: '{count} analiz',
    backToReports: 'Rapor Merkezi',
    filterByAsset: 'Varlık sınıfı',
    filterByType: 'Analiz türü',
    filterByRisk: 'Risk seviyesi',
    filterBySentiment: 'Duygu',
    filterByTime: 'Zaman dilimi',
    filterBySymbol: 'Sembol',
    searchPlaceholder: 'Başlık veya sembolle ara...',
    all: 'Tümü',
    today: 'Bugün',
    thisWeek: 'Bu hafta',
    thisMonth: 'Bu ay',
    totalAnalyses: 'Toplam analiz',
    bullishCount: 'Yükseliş',
    bearishCount: 'Düşüş',
    highRiskCount: 'Yüksek risk',
    highConfidenceCount: 'Yüksek güven',
    readMore: 'Devamını oku',
    confidenceLabel: 'Güven',
    priceTargetLabel: 'Fiyat hedefi',
    currentLabel: 'Mevcut',
    targetLabel: 'Hedef',
    stopLossLabel: 'Zarar durdur',
    validUntilLabel: 'Geçerlilik',
    noAnalyses: 'Teknik analiz yok',
    noAnalysesHint: 'Analizler AI tarafından saatlik oluşturulur',
    noAnalysesCta: 'Stratejik raporları gör',
    noAnalysesCtaHref: '/tr/strategic-reports',
    topConfidence: 'En yüksek güven',
    topConfidenceSubtitle: 'Güven ≥ %80 olan analizler',
    latestAnalyses: 'Son analizler',
    shareOn: 'Paylaş',
    shareTwitter: 'Twitter',
    shareTelegram: 'Telegram',
    shareWhatsApp: 'WhatsApp',
    shareCopy: 'Bağlantıyı kopyala',
    copyLinkSuccess: 'Bağlantı kopyalandı',
    sourceLocal: 'Yerel',
    sourceExternal: 'Platform',
    loadingAnalyses: 'Yükleniyor…',
    tabCrypto: 'Kripto',
    tabForex: 'Döviz',
    tabStocks: 'Hisseler',
    tabCommodities: 'Emtia',
    tabAll: 'Tümü',
    heatmapTitle: 'Piyasa haritası',
    heatmapSubtitle: 'Kategori ve duyguya göre analiz dağılımı',
    compareTitle: 'Varlık karşılaştırması',
    compareSubtitle: 'İki analizi yan yana karşılaştırın',
    compareSelect: 'Karşılaştırmak için iki çift seçin',
    compareButton: 'Karşılaştır',
    alertTitle: 'Analiz uyarıları',
    alertSubtitle: 'Yeni analizler yayınlandığında beni bilgilendir',
    alertButton: 'Uyarıları etkinleştir',
    rssFeed: 'RSS',
    dir: 'ltr',
  },
  es: {
    pageTitle: 'Análisis Técnicos Avanzados',
    pageSubtitle: 'Análisis técnicos y fundamentales profesionales para mercados, divisas, acciones y cripto',
    reportsCount: '{count} análisis',
    backToReports: 'Centro de informes',
    filterByAsset: 'Clase de activo',
    filterByType: 'Tipo de análisis',
    filterByRisk: 'Nivel de riesgo',
    filterBySentiment: 'Sentimiento',
    filterByTime: 'Período',
    filterBySymbol: 'Símbolo',
    searchPlaceholder: 'Buscar por título o símbolo...',
    all: 'Todos',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    totalAnalyses: 'Total análisis',
    bullishCount: 'Alcista',
    bearishCount: 'Bajista',
    highRiskCount: 'Alto riesgo',
    highConfidenceCount: 'Alta confianza',
    readMore: 'Leer más',
    confidenceLabel: 'Confianza',
    priceTargetLabel: 'Objetivo de precio',
    currentLabel: 'Actual',
    targetLabel: 'Objetivo',
    stopLossLabel: 'Stop loss',
    validUntilLabel: 'Válido hasta',
    noAnalyses: 'No hay análisis técnicos disponibles',
    noAnalysesHint: 'Los análisis son generados por IA cada hora',
    noAnalysesCta: 'Ver informes estratégicos',
    noAnalysesCtaHref: '/es/strategic-reports',
    topConfidence: 'Mayor confianza',
    topConfidenceSubtitle: 'Análisis con confianza ≥ 80%',
    latestAnalyses: 'Últimos análisis',
    shareOn: 'Compartir',
    shareTwitter: 'Twitter',
    shareTelegram: 'Telegram',
    shareWhatsApp: 'WhatsApp',
    shareCopy: 'Copiar enlace',
    copyLinkSuccess: 'Enlace copiado',
    sourceLocal: 'Local',
    sourceExternal: 'Plataforma',
    loadingAnalyses: 'Cargando…',
    tabCrypto: 'Cripto',
    tabForex: 'Forex',
    tabStocks: 'Acciones',
    tabCommodities: 'Materias primas',
    tabAll: 'Todos',
    heatmapTitle: 'Mapa de calor',
    heatmapSubtitle: 'Distribución de análisis por categoría y sentimiento',
    compareTitle: 'Comparación de activos',
    compareSubtitle: 'Compara dos análisis lado a lado',
    compareSelect: 'Selecciona dos pares para comparar',
    compareButton: 'Comparar',
    alertTitle: 'Alertas de análisis',
    alertSubtitle: 'Notifícame cuando se publiquen nuevos análisis',
    alertButton: 'Activar alertas',
    rssFeed: 'RSS',
    dir: 'ltr',
  },
};

export function getTAStrings(locale: string): TAStrings {
  return STRINGS[locale as TALocale] || STRINGS.ar;
}

export function formatTimeAgoTA(dateStr: string, locale: string): string {
  const s = getTAStrings(locale);
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return s.all;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? "À l'instant" : locale === 'es' ? 'Ahora' : locale === 'tr' ? 'Şimdi' : 'now';
    if (diffMin < 60) return locale === 'ar' ? `منذ ${diffMin} د` : locale === 'fr' ? `il y a ${diffMin}min` : locale === 'es' ? `hace ${diffMin}min` : locale === 'tr' ? `${diffMin}dk önce` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return locale === 'ar' ? `منذ ${diffHr} س` : locale === 'fr' ? `il y a ${diffHr}h` : locale === 'es' ? `hace ${diffHr}h` : locale === 'tr' ? `${diffHr}sa önce` : `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return locale === 'ar' ? `منذ ${diffDay} يوم` : locale === 'fr' ? `il y a ${diffDay}j` : locale === 'es' ? `hace ${diffDay}d` : locale === 'tr' ? `${diffDay}g önce` : `${diffDay}d ago`;
  } catch { return ''; }
}
