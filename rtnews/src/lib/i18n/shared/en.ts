// ─── Shared English Labels for NewsList, PersonalizedGreeting, TradingOpsDashboard ──
// Follows the same dot-namespacing pattern as src/lib/i18n/stock/
// Keys are grouped by component: newsList.*, greeting.*, ops.*

const en: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════
  // ── NewsList ──
  // ════════════════════════════════════════════════════════════════

  'newsList.heading': 'Latest News',
  'newsList.viewAll': 'View All →',
  'newsList.archiveCount': 'articles in archive',
  'newsList.loadMore': 'Load More',
  'newsList.loadMoreRemaining': 'remaining in archive',
  'newsList.loading': 'Loading...',
  'newsList.archiveComplete': 'All archived news displayed',
  'newsList.newsUnit': 'articles',
  'newsList.defaultCategory': 'News',

  // Category labels — aligned with NEWS_CATEGORIES
  'newsList.cat.economy': 'Economy',
  'newsList.cat.stocks': 'Stocks',
  'newsList.cat.forex': 'Forex',
  'newsList.cat.crypto': 'Crypto',
  'newsList.cat.energy': 'Energy',
  'newsList.cat.oil': 'Oil',
  'newsList.cat.commodities': 'Commodities',
  'newsList.cat.metals': 'Metals',
  'newsList.cat.bonds': 'Bonds',
  'newsList.cat.centralBanks': 'Central Banks',
  'newsList.cat.technology': 'Technology',
  'newsList.cat.technicalAnalysis': 'Technical Analysis',
  'newsList.cat.earnings': 'Earnings',
  'newsList.cat.realEstate': 'Real Estate',
  'newsList.cat.arabMarkets': 'Arab Markets',
  'newsList.cat.strategic': 'Geopolitics',
  'newsList.cat.banking': 'Banking',
  'newsList.cat.macro': 'Macro',
  'newsList.cat.fed': 'Fed',

  // Sentiment labels
  'newsList.sentiment.positive': 'Bullish',
  'newsList.sentiment.negative': 'Bearish',
  'newsList.sentiment.neutral': 'Neutral',

  // Time abbreviations
  'newsList.time.now': 'now',
  'newsList.time.min': 'm',
  'newsList.time.hour': 'h',
  'newsList.time.day': 'd',
  'newsList.time.month': 'M',

  // ════════════════════════════════════════════════════════════════
  // ── PersonalizedGreeting ──
  // ════════════════════════════════════════════════════════════════

  'greeting.hello': 'Hello',
  'greeting.subtitle': "Today's recommendations are based on your investment profile",
  'greeting.advisorPanel': 'Advisor Panel',
  'greeting.loadingRecs': 'Loading personalized recommendations...',
  'greeting.fallbackTitle': 'Investment recommendation',

  // Action labels
  'greeting.action.buy': 'Buy',
  'greeting.action.sell': 'Sell',
  'greeting.action.watch': 'Watch',

  // Logged-out CTA
  'greeting.cta.heading': 'Get personalized investment recommendations',
  'greeting.cta.subtitle': 'Sign up now and get AI-driven analysis and recommendations based on your investment profile',
  'greeting.cta.signUp': 'Sign Up Now',

  // ════════════════════════════════════════════════════════════════
  // ── TradingOpsDashboard ──
  // ════════════════════════════════════════════════════════════════

  // Quick Summary Strip
  'ops.criticalEvents': 'Critical Events',
  'ops.activeSignals': 'Active Signals',
  'ops.mostVolatile': 'Most Volatile',

  // Card 1: Trading Sessions
  'ops.sessions.heading': 'Trading Sessions',
  'ops.sessions.open': 'Open',
  'ops.sessions.closed': 'Closed',
  'ops.sessions.tokyo': 'Tokyo',
  'ops.sessions.saudi': 'Saudi Arabia',
  'ops.sessions.london': 'London',
  'ops.sessions.newyork': 'New York',
  'ops.sessions.sydney': 'Sydney',

  // Card 2: Currency Strength
  'ops.currency.heading': 'Currency Strength',
  'ops.currency.category': 'Currencies',

  // Card 3: Economic Calendar
  'ops.calendar.heading': 'Economic Calendar',
  'ops.calendar.all': 'All',
  'ops.calendar.forecast': 'Fcst: ',
  'ops.calendar.loading': 'Loading...',
  'ops.calendar.empty': 'No high-impact events today',

  // Card 4: Council Signals
  'ops.signals.heading': 'Council Signals',
  'ops.signals.all': 'All',
  'ops.signals.buy': 'Buy',
  'ops.signals.sell': 'Sell',
  'ops.signals.entry': 'Entry',
  'ops.signals.target': 'Target',
  'ops.signals.stop': 'Stop',
  'ops.signals.confidence': 'Conf.',
  'ops.signals.loading': 'Loading...',
  'ops.signals.empty': 'No active signals at the moment',

  // Time abbreviations (ops-specific)
  'ops.time.now': 'Now',
  'ops.time.min': 'm',
  'ops.time.hour': 'h',
  'ops.time.day': 'd',
};

export default en;
