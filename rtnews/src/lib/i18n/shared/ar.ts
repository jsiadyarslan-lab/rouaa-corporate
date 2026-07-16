// ─── Shared Arabic Labels for NewsList, PersonalizedGreeting, TradingOpsDashboard ──
// Follows the same dot-namespacing pattern as src/lib/i18n/stock/
// Keys are grouped by component: newsList.*, greeting.*, ops.*

const ar: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════
  // ── NewsList ──
  // ════════════════════════════════════════════════════════════════

  'newsList.heading': 'آخر الأخبار',
  'newsList.viewAll': 'عرض الكل ←',
  'newsList.archiveCount': 'خبر في الأرشيف',
  'newsList.loadMore': 'عرض المزيد',
  'newsList.loadMoreRemaining': 'خبر متبقي في الأرشيف',
  'newsList.loading': 'جاري التحميل...',
  'newsList.archiveComplete': 'تم عرض جميع الأخبار المؤرشفة',
  'newsList.newsUnit': 'خبر',
  'newsList.defaultCategory': 'أخبار',

  // Category labels — aligned with NEWS_CATEGORIES
  'newsList.cat.economy': 'اقتصاد',
  'newsList.cat.stocks': 'أسهم',
  'newsList.cat.forex': 'فوركس',
  'newsList.cat.crypto': 'كريبتو',
  'newsList.cat.energy': 'طاقة',
  'newsList.cat.oil': 'نفط',
  'newsList.cat.commodities': 'سلع',
  'newsList.cat.metals': 'معادن',
  'newsList.cat.bonds': 'سندات',
  'newsList.cat.centralBanks': 'بنوك مركزية',
  'newsList.cat.technology': 'تقنية',
  'newsList.cat.technicalAnalysis': 'تحليل فني',
  'newsList.cat.earnings': 'أرباح الشركات',
  'newsList.cat.realEstate': 'عقارات',
  'newsList.cat.arabMarkets': 'أسواق عربية',
  'newsList.cat.strategic': 'جيوسياسي',
  'newsList.cat.banking': 'بنوك',
  'newsList.cat.macro': 'ماكرو',
  'newsList.cat.fed': 'فيدرالي',

  // Sentiment labels
  'newsList.sentiment.positive': 'صعودي',
  'newsList.sentiment.negative': 'هبوطي',
  'newsList.sentiment.neutral': 'محايد',

  // Time abbreviations
  'newsList.time.now': 'الآن',
  'newsList.time.min': 'د',
  'newsList.time.hour': 'س',
  'newsList.time.day': 'ي',
  'newsList.time.month': 'ش',

  // ════════════════════════════════════════════════════════════════
  // ── PersonalizedGreeting ──
  // ════════════════════════════════════════════════════════════════

  'greeting.hello': 'مرحباً',
  'greeting.subtitle': 'توصيات اليوم مبنية على ملفك الاستثماري',
  'greeting.advisorPanel': 'لوحة المستشار',
  'greeting.loadingRecs': 'جارٍ تحميل التوصيات المخصصة...',
  'greeting.fallbackTitle': 'توصية استثمارية',

  // Action labels
  'greeting.action.buy': 'شراء',
  'greeting.action.sell': 'بيع',
  'greeting.action.watch': 'مراقبة',

  // Logged-out CTA
  'greeting.cta.heading': 'احصل على توصيات استثمارية مخصصة لك',
  'greeting.cta.subtitle': 'سجل الآن واحصل على تحليلات وتوصيات بناءً على ملفك الاستثماري',
  'greeting.cta.signUp': 'سجّل الآن',

  // ════════════════════════════════════════════════════════════════
  // ── TradingOpsDashboard ──
  // ════════════════════════════════════════════════════════════════

  // Quick Summary Strip
  'ops.criticalEvents': 'أحداث حرجة',
  'ops.activeSignals': 'إشارات نشطة',
  'ops.mostVolatile': 'الأكثر تحركاً',

  // Card 1: Trading Sessions
  'ops.sessions.heading': 'أوقات التداول',
  'ops.sessions.open': 'مفتوح',
  'ops.sessions.closed': 'مغلق',
  'ops.sessions.tokyo': 'طوكيو',
  'ops.sessions.saudi': 'السعودية',
  'ops.sessions.london': 'لندن',
  'ops.sessions.newyork': 'نيويورك',
  'ops.sessions.sydney': 'سيدني',

  // Card 2: Currency Strength
  'ops.currency.heading': 'قوة العملات',
  'ops.currency.category': 'عملات',

  // Card 3: Economic Calendar
  'ops.calendar.heading': 'الأجندة الاقتصادية',
  'ops.calendar.all': 'الكل',
  'ops.calendar.forecast': 'توقع: ',
  'ops.calendar.loading': 'جاري التحميل...',
  'ops.calendar.empty': 'لا توجد أحداث مؤثرة اليوم',

  // Card 4: Council Signals
  'ops.signals.heading': 'إشارات المجلس',
  'ops.signals.all': 'الكل',
  'ops.signals.buy': 'شراء',
  'ops.signals.sell': 'بيع',
  'ops.signals.entry': 'دخول',
  'ops.signals.target': 'هدف',
  'ops.signals.stop': 'وقف',
  'ops.signals.confidence': 'ثقة',
  'ops.signals.loading': 'جاري التحميل...',
  'ops.signals.empty': 'لا توجد إشارات نشطة حالياً',

  // Time abbreviations (ops-specific)
  'ops.time.now': 'الآن',
  'ops.time.min': 'د',
  'ops.time.hour': 'س',
  'ops.time.day': 'ي',
};

export default ar;
