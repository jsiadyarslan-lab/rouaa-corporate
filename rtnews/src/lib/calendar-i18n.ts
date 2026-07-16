// ═══════════════════════════════════════════════════════════════════
// Smart Calendar Center — i18n strings for 5 locales
// ═══════════════════════════════════════════════════════════════════

export type CalendarLocale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export interface CalendarStrings {
  // Header
  pageTitle: string;
  pageSubtitle: string;
  liveBadge: string;
  refresh: string;
  lastUpdate: string;
  audioSummary: string;
  audioSummaryLoading: string;
  audioSummaryStop: string;
  audioSummaryFailed: string;

  // Filters
  all: string;
  today: string;
  thisWeek: string;
  nextWeek: string;
  thisMonth: string;
  importance: string;
  country: string;
  allCountries: string;
  allImportance: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  filterByDate: string;
  filterByImpact: string;

  // Stats
  totalEvents: string;
  criticalEvents: string;
  upcomingEvents: string;
  releasedToday: string;

  // Event card
  forecast: string;
  previous: string;
  actual: string;
  released: string;
  upcoming: string;
  startsIn: string;
  endedAgo: string;
  now: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;

  // Asset impact matrix
  assetImpactTitle: string;
  assetImpactSubtitle: string;
  gold: string;
  oil: string;
  btc: string;
  sp500: string;
  dxy: string;
  eurusd: string;
  expectedUp: string;
  expectedDown: string;
  expectedNeutral: string;
  noImpactData: string;

  // Pre-Impact Score
  preImpactTitle: string;
  preImpactHigh: string;
  preImpactMedium: string;
  preImpactLow: string;
  historicalImpact: string;
  confidenceScore: string;

  // Related reports (RAG)
  relatedReports: string;
  noRelatedReports: string;
  viewAnalysis: string;

  // Event tracker sidebar
  nextEventTitle: string;
  nextEventSubtitle: string;
  noUpcomingEvent: string;
  liveTracker: string;
  eventsNext24h: string;
  eventsNext7d: string;

  // Empty state
  noEvents: string;
  noEventsHint: string;
  retryButton: string;
  loadingEvents: string;

  // Days
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;

  // Direction
  dir: 'rtl' | 'ltr';
}

const STRINGS: Record<CalendarLocale, CalendarStrings> = {
  ar: {
    pageTitle: 'مركز التخطيط الاقتصادي',
    pageSubtitle: 'تتبع الأحداث الاقتصادية العالمية مع تنبؤ تأثير رؤى المسبق وربط بذاكرة المنصة التحليلية',
    liveBadge: 'مباشر',
    refresh: 'تحديث',
    lastUpdate: 'آخر تحديث',
    audioSummary: 'استمع للأسبوع الاقتصادي',
    audioSummaryLoading: 'جارٍ التحميل...',
    audioSummaryStop: 'إيقاف',
    audioSummaryFailed: 'فشل تحميل الملخص الصوتي',
    all: 'الكل',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    nextWeek: 'الأسبوع القادم',
    thisMonth: 'هذا الشهر',
    importance: 'الأهمية',
    country: 'الدولة',
    allCountries: 'كل الدول',
    allImportance: 'كل المستويات',
    critical: 'حرج',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض',
    filterByDate: 'تصفية حسب التاريخ',
    filterByImpact: 'تصفية حسب التأثير',
    totalEvents: 'إجمالي الأحداث',
    criticalEvents: 'أحداث حرجة',
    upcomingEvents: 'أحداث قادمة',
    releasedToday: 'صدر اليوم',
    forecast: 'التوقع',
    previous: 'السابق',
    actual: 'الفعلي',
    released: 'صدر',
    upcoming: 'قادم',
    startsIn: 'يبدأ بعد',
    endedAgo: 'انتهى منذ',
    now: 'الآن',
    days: 'يوم',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    assetImpactTitle: 'مصفوفة التأثير على الأصول',
    assetImpactSubtitle: 'التأثير المتوقع لكل حدث على الأصول الرئيسية',
    gold: 'الذهب',
    oil: 'النفط',
    btc: 'البيتكوين',
    sp500: 'S&P 500',
    dxy: 'مؤشر الدولار',
    eurusd: 'يورو/دولار',
    expectedUp: 'ارتفاع متوقع',
    expectedDown: 'انخفاض متوقع',
    expectedNeutral: 'تأثير محايد',
    noImpactData: 'لا توجد بيانات',
    preImpactTitle: 'مؤشر رؤى المسبق للتأثير',
    preImpactHigh: 'تأثير عالي متوقع',
    preImpactMedium: 'تأثير متوسط متوقع',
    preImpactLow: 'تأثير منخفض متوقع',
    historicalImpact: 'التأثير التاريخي',
    confidenceScore: 'درجة الثقة',
    relatedReports: 'تحليلات وتقارير ذات صلة',
    noRelatedReports: 'لا توجد تحليلات ذات صلة بعد',
    viewAnalysis: 'عرض التحليل',
    nextEventTitle: 'الحدث القادم',
    nextEventSubtitle: 'العد التنازلي للحدث الأهم',
    noUpcomingEvent: 'لا توجد أحداث قادمة',
    liveTracker: 'متتبع الأحداث الحية',
    eventsNext24h: 'أحداث الـ24 ساعة القادمة',
    eventsNext7d: 'أحداث الـ7 أيام القادمة',
    noEvents: 'لا توجد أحداث',
    noEventsHint: 'لم يتم العثور على أحداث مطابقة للفلاتر',
    retryButton: 'إعادة المحاولة',
    loadingEvents: 'جارٍ تحميل الأحداث...',
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    dir: 'rtl',
  },
  en: {
    pageTitle: 'Economic Planning Center',
    pageSubtitle: 'Track global economic events with Pre-Impact Roua Score and RAG-linked analysis memory',
    liveBadge: 'Live',
    refresh: 'Refresh',
    lastUpdate: 'Last update',
    audioSummary: 'Listen to Economic Week',
    audioSummaryLoading: 'Loading...',
    audioSummaryStop: 'Stop',
    audioSummaryFailed: 'Failed to load audio summary',
    all: 'All',
    today: 'Today',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    thisMonth: 'This Month',
    importance: 'Importance',
    country: 'Country',
    allCountries: 'All Countries',
    allImportance: 'All Importance',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    filterByDate: 'Filter by date',
    filterByImpact: 'Filter by impact',
    totalEvents: 'Total Events',
    criticalEvents: 'Critical Events',
    upcomingEvents: 'Upcoming',
    releasedToday: 'Released Today',
    forecast: 'Forecast',
    previous: 'Previous',
    actual: 'Actual',
    released: 'Released',
    upcoming: 'Upcoming',
    startsIn: 'Starts in',
    endedAgo: 'Ended',
    now: 'now',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    assetImpactTitle: 'Asset Impact Matrix',
    assetImpactSubtitle: 'Expected impact of each event on key assets',
    gold: 'Gold',
    oil: 'Oil',
    btc: 'Bitcoin',
    sp500: 'S&P 500',
    dxy: 'Dollar Index',
    eurusd: 'EUR/USD',
    expectedUp: 'Expected up',
    expectedDown: 'Expected down',
    expectedNeutral: 'Neutral impact',
    noImpactData: 'No data',
    preImpactTitle: 'Pre-Impact Roua Score',
    preImpactHigh: 'High impact expected',
    preImpactMedium: 'Medium impact expected',
    preImpactLow: 'Low impact expected',
    historicalImpact: 'Historical impact',
    confidenceScore: 'Confidence',
    relatedReports: 'Related Analyses & Reports',
    noRelatedReports: 'No related analyses yet',
    viewAnalysis: 'View analysis',
    nextEventTitle: 'Next Event',
    nextEventSubtitle: 'Countdown to the most important event',
    noUpcomingEvent: 'No upcoming events',
    liveTracker: 'Live Event Tracker',
    eventsNext24h: 'Events in next 24h',
    eventsNext7d: 'Events in next 7d',
    noEvents: 'No events',
    noEventsHint: 'No events match your filters',
    retryButton: 'Retry',
    loadingEvents: 'Loading events...',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    dir: 'ltr',
  },
  fr: {
    pageTitle: 'Centre de Planification Économique',
    pageSubtitle: 'Suivez les événements économiques mondiaux avec le score pré-impact Roua et la mémoire RAG',
    liveBadge: 'En direct',
    refresh: 'Actualiser',
    lastUpdate: 'Dernière mise à jour',
    audioSummary: 'Écouter la semaine économique',
    audioSummaryLoading: 'Chargement...',
    audioSummaryStop: 'Arrêter',
    audioSummaryFailed: 'Échec du chargement du résumé audio',
    all: 'Toutes',
    today: "Aujourd'hui",
    thisWeek: 'Cette semaine',
    nextWeek: 'Semaine prochaine',
    thisMonth: 'Ce mois',
    importance: 'Importance',
    country: 'Pays',
    allCountries: 'Tous les pays',
    allImportance: 'Toutes importances',
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
    filterByDate: 'Filtrer par date',
    filterByImpact: 'Filtrer par impact',
    totalEvents: 'Total événements',
    criticalEvents: 'Événements critiques',
    upcomingEvents: 'À venir',
    releasedToday: 'Publiés aujourd\'hui',
    forecast: 'Prévision',
    previous: 'Précédent',
    actual: 'Actuel',
    released: 'Publié',
    upcoming: 'À venir',
    startsIn: 'Commence dans',
    endedAgo: 'Terminé il y a',
    now: 'maintenant',
    days: 'j',
    hours: 'h',
    minutes: 'min',
    seconds: 's',
    assetImpactTitle: 'Matrice d\'Impact sur les Actifs',
    assetImpactSubtitle: 'Impact attendu de chaque événement sur les actifs clés',
    gold: 'Or',
    oil: 'Pétrole',
    btc: 'Bitcoin',
    sp500: 'S&P 500',
    dxy: 'Indice $',
    eurusd: 'EUR/USD',
    expectedUp: 'Hausse attendue',
    expectedDown: 'Baisse attendue',
    expectedNeutral: 'Impact neutre',
    noImpactData: 'Pas de données',
    preImpactTitle: 'Score Pré-Impact Roua',
    preImpactHigh: 'Impact élevé attendu',
    preImpactMedium: 'Impact moyen attendu',
    preImpactLow: 'Impact faible attendu',
    historicalImpact: 'Impact historique',
    confidenceScore: 'Confiance',
    relatedReports: 'Analyses et rapports associés',
    noRelatedReports: 'Aucune analyse associée',
    viewAnalysis: 'Voir l\'analyse',
    nextEventTitle: 'Événement suivant',
    nextEventSubtitle: 'Compte à rebours de l\'événement le plus important',
    noUpcomingEvent: 'Aucun événement à venir',
    liveTracker: 'Suivi en direct',
    eventsNext24h: 'Événements dans 24h',
    eventsNext7d: 'Événements dans 7j',
    noEvents: 'Aucun événement',
    noEventsHint: 'Aucun événement ne correspond à vos filtres',
    retryButton: 'Réessayer',
    loadingEvents: 'Chargement des événements...',
    sunday: 'Dimanche',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    dir: 'ltr',
  },
  tr: {
    pageTitle: 'Ekonomik Planlama Merkezi',
    pageSubtitle: 'Ön Etki Roua Skoru ve RAG belleği ile küresel ekonomik olayları takip edin',
    liveBadge: 'Canlı',
    refresh: 'Yenile',
    lastUpdate: 'Son güncelleme',
    audioSummary: 'Ekonomik Haftayı Dinle',
    audioSummaryLoading: 'Yükleniyor...',
    audioSummaryStop: 'Durdur',
    audioSummaryFailed: 'Sesli özet yüklenemedi',
    all: 'Tümü',
    today: 'Bugün',
    thisWeek: 'Bu hafta',
    nextWeek: 'Önümüzdeki hafta',
    thisMonth: 'Bu ay',
    importance: 'Önem',
    country: 'Ülke',
    allCountries: 'Tüm ülkeler',
    allImportance: 'Tüm önem',
    critical: 'Kritik',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    filterByDate: 'Tarihe göre filtrele',
    filterByImpact: 'Etkiye göre filtrele',
    totalEvents: 'Toplam olay',
    criticalEvents: 'Kritik olaylar',
    upcomingEvents: 'Yaklaşan',
    releasedToday: 'Bugün yayınlanan',
    forecast: 'Tahmin',
    previous: 'Önceki',
    actual: 'Gerçekleşen',
    released: 'Yayınlandı',
    upcoming: 'Yaklaşan',
    startsIn: 'Başlıyor',
    endedAgo: 'Bitti',
    now: 'şimdi',
    days: 'g',
    hours: 'sa',
    minutes: 'dk',
    seconds: 'sn',
    assetImpactTitle: 'Varlık Etki Matrisi',
    assetImpactSubtitle: 'Her olayın temel varlıklara beklenen etkisi',
    gold: 'Altın',
    oil: 'Petrol',
    btc: 'Bitcoin',
    sp500: 'S&P 500',
    dxy: 'Dolar Endeksi',
    eurusd: 'EUR/USD',
    expectedUp: 'Yükseliş bekleniyor',
    expectedDown: 'Düşüş bekleniyor',
    expectedNeutral: 'Nötr etki',
    noImpactData: 'Veri yok',
    preImpactTitle: 'Ön Etki Roua Skoru',
    preImpactHigh: 'Yüksek etki bekleniyor',
    preImpactMedium: 'Orta etki bekleniyor',
    preImpactLow: 'Düşük etki bekleniyor',
    historicalImpact: 'Tarihsel etki',
    confidenceScore: 'Güven',
    relatedReports: 'İlgili Analizler ve Raporlar',
    noRelatedReports: 'Henüz ilgili analiz yok',
    viewAnalysis: 'Analizi gör',
    nextEventTitle: 'Sonraki olay',
    nextEventSubtitle: 'En önemli olay için geri sayım',
    noUpcomingEvent: 'Yaklaşan olay yok',
    liveTracker: 'Canlı Olay Takibi',
    eventsNext24h: 'Önümüzdeki 24s olayları',
    eventsNext7d: 'Önümüzdeki 7g olayları',
    noEvents: 'Olay yok',
    noEventsHint: 'Filtrelerle eşleşen olay yok',
    retryButton: 'Tekrar dene',
    loadingEvents: 'Olaylar yükleniyor...',
    sunday: 'Pazar',
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    dir: 'ltr',
  },
  es: {
    pageTitle: 'Centro de Planificación Económica',
    pageSubtitle: 'Sigue eventos económicos globales con la puntuación Pre-Impacto Roua y memoria RAG',
    liveBadge: 'En vivo',
    refresh: 'Actualizar',
    lastUpdate: 'Última actualización',
    audioSummary: 'Escuchar Semana Económica',
    audioSummaryLoading: 'Cargando...',
    audioSummaryStop: 'Detener',
    audioSummaryFailed: 'Error al cargar el resumen de audio',
    all: 'Todos',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    nextWeek: 'Próxima semana',
    thisMonth: 'Este mes',
    importance: 'Importancia',
    country: 'País',
    allCountries: 'Todos los países',
    allImportance: 'Toda importancia',
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Medio',
    low: 'Bajo',
    filterByDate: 'Filtrar por fecha',
    filterByImpact: 'Filtrar por impacto',
    totalEvents: 'Total eventos',
    criticalEvents: 'Eventos críticos',
    upcomingEvents: 'Próximos',
    releasedToday: 'Publicados hoy',
    forecast: 'Pronóstico',
    previous: 'Anterior',
    actual: 'Actual',
    released: 'Publicado',
    upcoming: 'Próximo',
    startsIn: 'Empieza en',
    endedAgo: 'Terminó hace',
    now: 'ahora',
    days: 'd',
    hours: 'h',
    minutes: 'min',
    seconds: 's',
    assetImpactTitle: 'Matriz de Impacto en Activos',
    assetImpactSubtitle: 'Impacto esperado de cada evento en activos clave',
    gold: 'Oro',
    oil: 'Petróleo',
    btc: 'Bitcoin',
    sp500: 'S&P 500',
    dxy: 'Índice Dólar',
    eurusd: 'EUR/USD',
    expectedUp: 'Subida esperada',
    expectedDown: 'Bajada esperada',
    expectedNeutral: 'Impacto neutro',
    noImpactData: 'Sin datos',
    preImpactTitle: 'Puntuación Pre-Impacto Roua',
    preImpactHigh: 'Impacto alto esperado',
    preImpactMedium: 'Impacto medio esperado',
    preImpactLow: 'Impacto bajo esperado',
    historicalImpact: 'Impacto histórico',
    confidenceScore: 'Confianza',
    relatedReports: 'Análisis e informes relacionados',
    noRelatedReports: 'Aún no hay análisis relacionados',
    viewAnalysis: 'Ver análisis',
    nextEventTitle: 'Próximo evento',
    nextEventSubtitle: 'Cuenta regresiva para el evento más importante',
    noUpcomingEvent: 'No hay eventos próximos',
    liveTracker: 'Seguimiento en vivo',
    eventsNext24h: 'Eventos en 24h',
    eventsNext7d: 'Eventos en 7d',
    noEvents: 'No hay eventos',
    noEventsHint: 'Ningún evento coincide con tus filtros',
    retryButton: 'Reintentar',
    loadingEvents: 'Cargando eventos...',
    sunday: 'Domingo',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    dir: 'ltr',
  },
};

export function getCalendarStrings(locale: string): CalendarStrings {
  return STRINGS[locale as CalendarLocale] || STRINGS.ar;
}

// ─── Time formatting ────────────────────────────────────────────
export function formatCountdown(
  targetDate: string | Date,
  locale: string,
  now: number = Date.now(),
): { text: string; isPast: boolean; isSoon: boolean } {
  const s = getCalendarStrings(locale);
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    const pastDiff = -diff;
    const pastMin = Math.floor(pastDiff / 60000);
    if (pastMin < 1) return { text: s.now, isPast: true, isSoon: false };
    if (pastMin < 60) return { text: `${s.endedAgo} ${pastMin} ${s.minutes}`, isPast: true, isSoon: false };
    const pastHr = Math.floor(pastMin / 60);
    if (pastHr < 24) return { text: `${s.endedAgo} ${pastHr} ${s.hours}`, isPast: true, isSoon: false };
    const pastDay = Math.floor(pastHr / 24);
    return { text: `${s.endedAgo} ${pastDay} ${s.days}`, isPast: true, isSoon: false };
  }

  const isSoon = diff < 60 * 60 * 1000; // < 1 hour = soon
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${s.days}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${s.hours}`);
  if (days === 0) parts.push(`${minutes}${s.minutes}`);
  if (days === 0 && hours === 0) parts.push(`${seconds}${s.seconds}`);

  return { text: `${s.startsIn} ${parts.join(' ')}`, isPast: false, isSoon };
}
