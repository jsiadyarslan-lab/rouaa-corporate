// ─── Shared Turkish Labels for NewsList, PersonalizedGreeting, TradingOpsDashboard ──
// Follows the same dot-namespacing pattern as src/lib/i18n/stock/
// Keys are grouped by component: newsList.*, greeting.*, ops.*

const tr: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════
  // ── NewsList ──
  // ════════════════════════════════════════════════════════════════

  'newsList.heading': 'Son Haberler',
  'newsList.viewAll': 'Tümünü Gör →',
  'newsList.archiveCount': 'arşivdeki makale',
  'newsList.loadMore': 'Daha Fazla Yükle',
  'newsList.loadMoreRemaining': 'arşivde kalan',
  'newsList.loading': 'Yükleniyor...',
  'newsList.archiveComplete': 'Tüm arşiv haberleri gösterildi',
  'newsList.newsUnit': 'makale',
  'newsList.defaultCategory': 'Haberler',

  // Category labels — aligned with NEWS_CATEGORIES
  'newsList.cat.economy': 'Ekonomi',
  'newsList.cat.stocks': 'Hisseler',
  'newsList.cat.forex': 'Döviz',
  'newsList.cat.crypto': 'Kripto',
  'newsList.cat.energy': 'Enerji',
  'newsList.cat.oil': 'Petrol',
  'newsList.cat.commodities': 'Emtia',
  'newsList.cat.metals': 'Metaller',
  'newsList.cat.bonds': 'Tahviller',
  'newsList.cat.centralBanks': 'Merkez Bankaları',
  'newsList.cat.technology': 'Teknoloji',
  'newsList.cat.technicalAnalysis': 'Teknik Analiz',
  'newsList.cat.earnings': 'Kazançlar',
  'newsList.cat.realEstate': 'Gayrimenkul',
  'newsList.cat.arabMarkets': 'Arap Pazarları',
  'newsList.cat.strategic': 'Jeopolitik',
  'newsList.cat.banking': 'Bankacılık',
  'newsList.cat.macro': 'Makro',
  'newsList.cat.fed': 'Fed',

  // Sentiment labels
  'newsList.sentiment.positive': 'Yükseliş',
  'newsList.sentiment.negative': 'Düşüş',
  'newsList.sentiment.neutral': 'Nötr',

  // Time abbreviations
  'newsList.time.now': 'şimdi',
  'newsList.time.min': 'dk',
  'newsList.time.hour': 'sa',
  'newsList.time.day': 'g',
  'newsList.time.month': 'A',

  // ════════════════════════════════════════════════════════════════
  // ── PersonalizedGreeting ──
  // ════════════════════════════════════════════════════════════════

  'greeting.hello': 'Merhaba',
  'greeting.subtitle': 'Bugünkü tavsiyeler yatırım profilinize dayanmaktadır',
  'greeting.advisorPanel': 'Danışman Paneli',
  'greeting.loadingRecs': 'Kişiselleştirilmiş tavsiyeler yükleniyor...',
  'greeting.fallbackTitle': 'Yatırım tavsiyesi',

  // Action labels
  'greeting.action.buy': 'Al',
  'greeting.action.sell': 'Sat',
  'greeting.action.watch': 'İzle',

  // Logged-out CTA
  'greeting.cta.heading': 'Kişiselleştirilmiş yatırım tavsiyeleri alın',
  'greeting.cta.subtitle': 'Şimdi kaydolun ve yatırım profilinize dayalı yapay zeka destekli analiz ve tavsiyeler alın',
  'greeting.cta.signUp': 'Hemen Kaydolun',

  // ════════════════════════════════════════════════════════════════
  // ── TradingOpsDashboard ──
  // ════════════════════════════════════════════════════════════════

  // Quick Summary Strip
  'ops.criticalEvents': 'Kritik Olaylar',
  'ops.activeSignals': 'Aktif Sinyaller',
  'ops.mostVolatile': 'En Oynak',

  // Card 1: Trading Sessions
  'ops.sessions.heading': 'İşlem Oturumları',
  'ops.sessions.open': 'Açık',
  'ops.sessions.closed': 'Kapalı',
  'ops.sessions.tokyo': 'Tokyo',
  'ops.sessions.saudi': 'Suudi Arabistan',
  'ops.sessions.london': 'Londra',
  'ops.sessions.newyork': 'New York',
  'ops.sessions.sydney': 'Sidney',

  // Card 2: Currency Strength
  'ops.currency.heading': 'Para Birimi Gücü',
  'ops.currency.category': 'Para Birimleri',

  // Card 3: Economic Calendar
  'ops.calendar.heading': 'Ekonomik Takvim',
  'ops.calendar.all': 'Tümü',
  'ops.calendar.forecast': 'Tah: ',
  'ops.calendar.loading': 'Yükleniyor...',
  'ops.calendar.empty': 'Bugün yüksek etkili olay yok',

  // Card 4: Council Signals
  'ops.signals.heading': 'Konsey Sinyalleri',
  'ops.signals.all': 'Tümü',
  'ops.signals.buy': 'Al',
  'ops.signals.sell': 'Sat',
  'ops.signals.entry': 'Giriş',
  'ops.signals.target': 'Hedef',
  'ops.signals.stop': 'Stop',
  'ops.signals.confidence': 'Güv.',
  'ops.signals.loading': 'Yükleniyor...',
  'ops.signals.empty': 'Şu anda aktif sinyal yok',

  // Time abbreviations (ops-specific)
  'ops.time.now': 'Şimdi',
  'ops.time.min': 'dk',
  'ops.time.hour': 'sa',
  'ops.time.day': 'g',
};

export default tr;
