// ═══════════════════════════════════════════════════════════════════
// Smart News Center — i18n strings for 5 locales
// ═══════════════════════════════════════════════════════════════════

export type NewsLocale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export interface NewsStrings {
  // Header
  pageTitle: string;
  pageSubtitle: string;
  liveBadge: string;
  pausedBadge: string;
  newsCount: string;        // {count} خبر
  lastUpdated: string;      // آخر تحديث: {time}
  refresh: string;
  search: string;
  searchPlaceholder: string;
  audioDigest: string;      // استمع للأخبار
  audioDigestLoading: string;
  audioDigestStop: string;

  // Categories
  allCategories: string;

  // Card
  breaking: string;
  impactHigh: string;
  impactMedium: string;
  impactLow: string;
  sentimentPositive: string;
  sentimentNegative: string;
  sentimentNeutral: string;
  marketImpact: string;     // تأثير متوقع
  readMore: string;
  minutesAgo: string;       // منذ {n} دقيقة
  hoursAgo: string;         // منذ {n} ساعة
  daysAgo: string;          // منذ {n} يوم
  now: string;

  // Trust
  trustHigh: string;
  trustMedium: string;
  trustLow: string;
  trustVerified: string;
  trustPending: string;

  // Empty states
  noResults: string;
  noResultsHint: string;
  showAll: string;
  noNews: string;
  noNewsHint: string;
  refreshNow: string;

  // Audio digest player
  digestTitle: string;
  digestHeadlines: string;
  digestFailed: string;
  digestComplete: string;

  // Market sidebar
  marketPulse: string;
  marketSidebarTitle: string;
  marketLoading: string;
  marketUnavailable: string;
  marketLastUpdate: string;

  // AI Insights card
  aiInsightsTitle: string;
  aiInsightsSubtitle: string;
  aiBadge: string;
  marketPositive: string;
  marketNegative: string;
  marketBalanced: string;
  activeCategory: string;
  highImpactEvents: string;
  breakingCount: string;
  aiAnalysisCount: string;

  // Category distribution
  newsDistribution: string;

  // Sections
  mostRead: string;
  economicCalendar: string;
  smartCouncil: string;

  // Load more
  loadMore: string;
  backToTop: string;

  // Related (RAG)
  relatedAnalyses: string;
  noRelated: string;

  // Direction
  dir: 'rtl' | 'ltr';
}

const STRINGS: Record<NewsLocale, NewsStrings> = {
  ar: {
    pageTitle: 'مركز الأخبار الذكي',
    pageSubtitle: 'أخبار مالية فورية مدعومة بالذكاء الاصطناعي — تغطية شاملة للأسواق العالمية والعربية',
    liveBadge: 'مباشر',
    pausedBadge: 'متوقف',
    newsCount: '{count} خبر',
    lastUpdated: 'آخر تحديث: {time}',
    refresh: 'تحديث',
    search: 'بحث',
    searchPlaceholder: 'ابحث في الأخبار...',
    audioDigest: 'استمع للأخبار',
    audioDigestLoading: 'جارٍ التحميل...',
    audioDigestStop: 'إيقاف',
    allCategories: 'الكل',
    breaking: 'عاجل',
    impactHigh: 'تأثير عالي',
    impactMedium: 'تأثير متوسط',
    impactLow: 'تأثير منخفض',
    sentimentPositive: 'إيجابي',
    sentimentNegative: 'سلبي',
    sentimentNeutral: 'محايد',
    marketImpact: 'تأثير متوقع على السوق',
    readMore: 'اقرأ المزيد',
    minutesAgo: 'منذ {n} دقيقة',
    hoursAgo: 'منذ {n} ساعة',
    daysAgo: 'منذ {n} يوم',
    now: 'الآن',
    trustHigh: 'موثوقية عالية',
    trustMedium: 'مصداقية متوسطة',
    trustLow: 'يتطلب تحقق',
    trustVerified: 'موثق',
    trustPending: 'قيد المراجعة',
    noResults: 'لا توجد نتائج',
    noResultsHint: 'لم يتم العثور على أخبار تطابق بحثك',
    showAll: 'عرض الكل',
    noNews: 'لا توجد أخبار حالياً',
    noNewsHint: 'يتم تحديث الأخبار تلقائياً كل بضع دقائق',
    refreshNow: 'تحديث الآن',
    digestTitle: 'الملخص الصوتي',
    digestHeadlines: 'أهم العناوين',
    digestFailed: 'فشل في تحميل الملخص الصوتي',
    digestComplete: 'انتهى الملخص',
    marketPulse: 'نبض السوق',
    marketSidebarTitle: 'الأسعار اللحظية',
    marketLoading: 'جارٍ جلب الأسعار...',
    marketUnavailable: 'الأسعار غير متاحة حالياً',
    marketLastUpdate: 'آخر تحديث',
    aiInsightsTitle: 'مساعد رؤى',
    aiInsightsSubtitle: 'تحليلات ذكية فورية',
    aiBadge: 'AI',
    marketPositive: 'مزاج السوق إيجابي',
    marketNegative: 'تحفظ في الأسواق',
    marketBalanced: 'أسواق متوازنة',
    activeCategory: 'نشاط ملحوظ',
    highImpactEvents: '{count} حدث عالي التأثير',
    breakingCount: '{count} خبر عاجل',
    aiAnalysisCount: '{count} تحليل AI متاح',
    newsDistribution: 'توزيع الأخبار',
    mostRead: 'الأكثر قراءة',
    economicCalendar: 'الروزنامة الاقتصادية',
    smartCouncil: 'المجلس الذكي',
    loadMore: 'عرض المزيد',
    backToTop: 'العودة للأعلى',
    relatedAnalyses: 'تحليلات ذات صلة',
    noRelated: 'لا توجد تحليلات ذات صلة بعد',
    dir: 'rtl',
  },
  en: {
    pageTitle: 'Smart News Center',
    pageSubtitle: 'Real-time AI-powered financial news — comprehensive coverage of global and regional markets',
    liveBadge: 'LIVE',
    pausedBadge: 'PAUSED',
    newsCount: '{count} news',
    lastUpdated: 'Last updated: {time}',
    refresh: 'Refresh',
    search: 'Search',
    searchPlaceholder: 'Search news...',
    audioDigest: 'Listen to News',
    audioDigestLoading: 'Loading...',
    audioDigestStop: 'Stop',
    allCategories: 'All',
    breaking: 'BREAKING',
    impactHigh: 'High Impact',
    impactMedium: 'Medium Impact',
    impactLow: 'Low Impact',
    sentimentPositive: 'Bullish',
    sentimentNegative: 'Bearish',
    sentimentNeutral: 'Neutral',
    marketImpact: 'Expected Market Impact',
    readMore: 'Read more',
    minutesAgo: '{n}m ago',
    hoursAgo: '{n}h ago',
    daysAgo: '{n}d ago',
    now: 'now',
    trustHigh: 'High Reliability',
    trustMedium: 'Medium Credibility',
    trustLow: 'Verification Needed',
    trustVerified: 'Verified',
    trustPending: 'Pending Review',
    noResults: 'No results',
    noResultsHint: 'No news matches your search',
    showAll: 'Show all',
    noNews: 'No news available',
    noNewsHint: 'News is updated automatically every few minutes',
    refreshNow: 'Refresh now',
    digestTitle: 'Audio Digest',
    digestHeadlines: 'Top Headlines',
    digestFailed: 'Failed to load audio digest',
    digestComplete: 'Digest complete',
    marketPulse: 'Market Pulse',
    marketSidebarTitle: 'Live Prices',
    marketLoading: 'Fetching prices...',
    marketUnavailable: 'Prices currently unavailable',
    marketLastUpdate: 'Last update',
    aiInsightsTitle: 'Roua Assistant',
    aiInsightsSubtitle: 'Instant smart insights',
    aiBadge: 'AI',
    marketPositive: 'Bullish Market Mood',
    marketNegative: 'Risk-Off Sentiment',
    marketBalanced: 'Balanced Markets',
    activeCategory: 'Active sector',
    highImpactEvents: '{count} high-impact events',
    breakingCount: '{count} breaking stories',
    aiAnalysisCount: '{count} AI analyses available',
    newsDistribution: 'News Distribution',
    mostRead: 'Most Read',
    economicCalendar: 'Economic Calendar',
    smartCouncil: 'Smart Council',
    loadMore: 'Load more',
    backToTop: 'Back to top',
    relatedAnalyses: 'Related Analyses',
    noRelated: 'No related analyses yet',
    dir: 'ltr',
  },
  fr: {
    pageTitle: 'Centre d\'Actualités Intelligent',
    pageSubtitle: 'Actualités financières en temps réel avec IA — couverture complète des marchés mondiaux et régionaux',
    liveBadge: 'EN DIRECT',
    pausedBadge: 'EN PAUSE',
    newsCount: '{count} actualités',
    lastUpdated: 'Dernière mise à jour : {time}',
    refresh: 'Actualiser',
    search: 'Rechercher',
    searchPlaceholder: 'Rechercher des actualités...',
    audioDigest: 'Écouter les actualités',
    audioDigestLoading: 'Chargement...',
    audioDigestStop: 'Arrêter',
    allCategories: 'Toutes',
    breaking: 'URGENT',
    impactHigh: 'Impact élevé',
    impactMedium: 'Impact moyen',
    impactLow: 'Impact faible',
    sentimentPositive: 'Haussier',
    sentimentNegative: 'Baissier',
    sentimentNeutral: 'Neutre',
    marketImpact: 'Impact marché attendu',
    readMore: 'Lire plus',
    minutesAgo: 'il y a {n} min',
    hoursAgo: 'il y a {n} h',
    daysAgo: 'il y a {n} j',
    now: 'maintenant',
    trustHigh: 'Haute fiabilité',
    trustMedium: 'Crédibilité moyenne',
    trustLow: 'Vérification requise',
    trustVerified: 'Vérifié',
    trustPending: 'En révision',
    noResults: 'Aucun résultat',
    noResultsHint: 'Aucune actualité ne correspond à votre recherche',
    showAll: 'Tout afficher',
    noNews: 'Aucune actualité disponible',
    noNewsHint: 'Les actualités sont mises à jour automatiquement toutes les quelques minutes',
    refreshNow: 'Actualiser maintenant',
    digestTitle: 'Résumé Audio',
    digestHeadlines: 'Titres principaux',
    digestFailed: 'Échec du chargement du résumé audio',
    digestComplete: 'Résumé terminé',
    marketPulse: 'Pouls du Marché',
    marketSidebarTitle: 'Prix en Direct',
    marketLoading: 'Récupération des prix...',
    marketUnavailable: 'Prix actuellement indisponibles',
    marketLastUpdate: 'Dernière mise à jour',
    aiInsightsTitle: 'Assistant Roua',
    aiInsightsSubtitle: 'Analyses intelligentes instantanées',
    aiBadge: 'IA',
    marketPositive: 'Sentiment haussier',
    marketNegative: 'Sentiment de prudence',
    marketBalanced: 'Marchés équilibrés',
    activeCategory: 'Secteur actif',
    highImpactEvents: '{count} événements à fort impact',
    breakingCount: '{count} actualités urgentes',
    aiAnalysisCount: '{count} analyses IA disponibles',
    newsDistribution: 'Distribution des actualités',
    mostRead: 'Plus Lus',
    economicCalendar: 'Calendrier Économique',
    smartCouncil: 'Conseil Intelligent',
    loadMore: 'Charger plus',
    backToTop: 'Haut de page',
    relatedAnalyses: 'Analyses associées',
    noRelated: 'Aucune analyse associée',
    dir: 'ltr',
  },
  tr: {
    pageTitle: 'Akıllı Haber Merkezi',
    pageSubtitle: 'AI destekli gerçek zamanlı finansal haberler — küresel ve bölgesel piyasaları kapsamlı kapsam',
    liveBadge: 'CANLI',
    pausedBadge: 'DURAKLATILDI',
    newsCount: '{count} haber',
    lastUpdated: 'Son güncelleme: {time}',
    refresh: 'Yenile',
    search: 'Ara',
    searchPlaceholder: 'Haberlerde ara...',
    audioDigest: 'Haberleri Dinle',
    audioDigestLoading: 'Yükleniyor...',
    audioDigestStop: 'Durdur',
    allCategories: 'Tümü',
    breaking: 'SON DAKİKA',
    impactHigh: 'Yüksek Etki',
    impactMedium: 'Orta Etki',
    impactLow: 'Düşük Etki',
    sentimentPositive: 'Yükseliş',
    sentimentNegative: 'Düşüş',
    sentimentNeutral: 'Nötr',
    marketImpact: 'Beklenen Piyasa Etkisi',
    readMore: 'Devamını oku',
    minutesAgo: '{n} dk önce',
    hoursAgo: '{n} sa önce',
    daysAgo: '{n} gün önce',
    now: 'şimdi',
    trustHigh: 'Yüksek Güvenilirlik',
    trustMedium: 'Orta Kredi',
    trustLow: 'Doğrulama Gerekli',
    trustVerified: 'Doğrulanmış',
    trustPending: 'İnceleme Bekliyor',
    noResults: 'Sonuç yok',
    noResultsHint: 'Aramanızla eşleşen haber bulunamadı',
    showAll: 'Tümünü göster',
    noNews: 'Haber yok',
    noNewsHint: 'Haberler her birkaç dakikada bir otomatik güncellenir',
    refreshNow: 'Şimdi yenile',
    digestTitle: 'Sesli Özet',
    digestHeadlines: 'Önemli Başlıklar',
    digestFailed: 'Sesli özet yüklenemedi',
    digestComplete: 'Özet tamamlandı',
    marketPulse: 'Piyasa Nabzı',
    marketSidebarTitle: 'Canlı Fiyatlar',
    marketLoading: 'Fiyatlar alınıyor...',
    marketUnavailable: 'Fiyatlar şu anda kullanılamıyor',
    marketLastUpdate: 'Son güncelleme',
    aiInsightsTitle: 'Roua Asistanı',
    aiInsightsSubtitle: 'Anlık akıllı analizler',
    aiBadge: 'AI',
    marketPositive: 'Yükseliş Eğilimi',
    marketNegative: 'Risk-Off Duygusu',
    marketBalanced: 'Dengeli Piyasalar',
    activeCategory: 'Aktif sektör',
    highImpactEvents: '{count} yüksek etki olayı',
    breakingCount: '{count} son dakika haberi',
    aiAnalysisCount: '{count} AI analizi mevcut',
    newsDistribution: 'Haber Dağılımı',
    mostRead: 'En Çok Okunan',
    economicCalendar: 'Ekonomik Takvim',
    smartCouncil: 'Akıllı Konsey',
    loadMore: 'Daha fazla yükle',
    backToTop: 'Başa dön',
    relatedAnalyses: 'İlgili Analizler',
    noRelated: 'Henüz ilgili analiz yok',
    dir: 'ltr',
  },
  es: {
    pageTitle: 'Centro de Noticias Inteligente',
    pageSubtitle: 'Noticias financieras en tiempo real con IA — cobertura integral de mercados globales y regionales',
    liveBadge: 'EN VIVO',
    pausedBadge: 'PAUSADO',
    newsCount: '{count} noticias',
    lastUpdated: 'Última actualización: {time}',
    refresh: 'Actualizar',
    search: 'Buscar',
    searchPlaceholder: 'Buscar noticias...',
    audioDigest: 'Escuchar Noticias',
    audioDigestLoading: 'Cargando...',
    audioDigestStop: 'Detener',
    allCategories: 'Todas',
    breaking: 'URGENTE',
    impactHigh: 'Alto Impacto',
    impactMedium: 'Impacto Medio',
    impactLow: 'Bajo Impacto',
    sentimentPositive: 'Alcista',
    sentimentNegative: 'Bajista',
    sentimentNeutral: 'Neutral',
    marketImpact: 'Impacto de Mercado Esperado',
    readMore: 'Leer más',
    minutesAgo: 'hace {n} min',
    hoursAgo: 'hace {n} h',
    daysAgo: 'hace {n} d',
    now: 'ahora',
    trustHigh: 'Alta Confiabilidad',
    trustMedium: 'Credibilidad Media',
    trustLow: 'Verificación Requerida',
    trustVerified: 'Verificado',
    trustPending: 'En Revisión',
    noResults: 'Sin resultados',
    noResultsHint: 'No se encontraron noticias que coincidan con tu búsqueda',
    showAll: 'Mostrar todo',
    noNews: 'No hay noticias disponibles',
    noNewsHint: 'Las noticias se actualizan automáticamente cada pocos minutos',
    refreshNow: 'Actualizar ahora',
    digestTitle: 'Resumen Audio',
    digestHeadlines: 'Titulares Principales',
    digestFailed: 'Error al cargar el resumen de audio',
    digestComplete: 'Resumen completado',
    marketPulse: 'Pulso del Mercado',
    marketSidebarTitle: 'Precios en Vivo',
    marketLoading: 'Obteniendo precios...',
    marketUnavailable: 'Precios no disponibles',
    marketLastUpdate: 'Última actualización',
    aiInsightsTitle: 'Asistente Roua',
    aiInsightsSubtitle: 'Análisis inteligentes instantáneos',
    aiBadge: 'AI',
    marketPositive: 'Sentimiento Alcista',
    marketNegative: 'Sentimiento de Caución',
    marketBalanced: 'Mercados Equilibrados',
    activeCategory: 'Sector activo',
    highImpactEvents: '{count} eventos de alto impacto',
    breakingCount: '{count} noticias urgentes',
    aiAnalysisCount: '{count} análisis de IA disponibles',
    newsDistribution: 'Distribución de Noticias',
    mostRead: 'Más Leídos',
    economicCalendar: 'Calendario Económico',
    smartCouncil: 'Consejo Inteligente',
    loadMore: 'Cargar más',
    backToTop: 'Volver arriba',
    relatedAnalyses: 'Análisis Relacionados',
    noRelated: 'Aún no hay análisis relacionados',
    dir: 'ltr',
  },
};

export function getNewsStrings(locale: string): NewsStrings {
  return STRINGS[locale as NewsLocale] || STRINGS.ar;
}

/**
 * Format time ago using locale-specific strings.
 */
export function formatTimeAgoLocale(dateStr: string, locale: string): string {
  const s = getNewsStrings(locale);
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return s.now;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return s.now;
    if (diffMinutes < 60) return s.minutesAgo.replace('{n}', String(diffMinutes));
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return s.hoursAgo.replace('{n}', String(diffHours));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return s.daysAgo.replace('{n}', String(diffDays));
    const localeTag = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(localeTag, { month: 'short', day: 'numeric' });
  } catch {
    return s.now;
  }
}
