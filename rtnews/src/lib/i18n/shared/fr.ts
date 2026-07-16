// ─── Shared French Labels for NewsList, PersonalizedGreeting, TradingOpsDashboard ──
// Follows the same dot-namespacing pattern as src/lib/i18n/stock/
// Keys are grouped by component: newsList.*, greeting.*, ops.*

const fr: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════
  // ── NewsList ──
  // ════════════════════════════════════════════════════════════════

  'newsList.heading': 'Dernières Nouvelles',
  'newsList.viewAll': 'Voir tout →',
  'newsList.archiveCount': 'articles en archive',
  'newsList.loadMore': 'Charger plus',
  'newsList.loadMoreRemaining': 'restants en archive',
  'newsList.loading': 'Chargement...',
  'newsList.archiveComplete': 'Toutes les actualités archivées affichées',
  'newsList.newsUnit': 'articles',
  'newsList.defaultCategory': 'Actualités',

  // Category labels — aligned with NEWS_CATEGORIES
  'newsList.cat.economy': 'Économie',
  'newsList.cat.stocks': 'Actions',
  'newsList.cat.forex': 'Devises',
  'newsList.cat.crypto': 'Crypto',
  'newsList.cat.energy': 'Énergie',
  'newsList.cat.oil': 'Pétrole',
  'newsList.cat.commodities': 'Matières Premières',
  'newsList.cat.metals': 'Métaux',
  'newsList.cat.bonds': 'Obligations',
  'newsList.cat.centralBanks': 'Banques Centrales',
  'newsList.cat.technology': 'Technologie',
  'newsList.cat.technicalAnalysis': 'Analyse Technique',
  'newsList.cat.earnings': 'Résultats',
  'newsList.cat.realEstate': 'Immobilier',
  'newsList.cat.arabMarkets': 'Marchés Arabes',
  'newsList.cat.strategic': 'Géopolitique',
  'newsList.cat.banking': 'Banque',
  'newsList.cat.macro': 'Macro',
  'newsList.cat.fed': 'Fed',

  // Sentiment labels
  'newsList.sentiment.positive': 'Haussier',
  'newsList.sentiment.negative': 'Baissier',
  'newsList.sentiment.neutral': 'Neutre',

  // Time abbreviations
  'newsList.time.now': 'maintenant',
  'newsList.time.min': 'm',
  'newsList.time.hour': 'h',
  'newsList.time.day': 'j',
  'newsList.time.month': 'm',

  // ════════════════════════════════════════════════════════════════
  // ── PersonalizedGreeting ──
  // ════════════════════════════════════════════════════════════════

  'greeting.hello': 'Bonjour',
  'greeting.subtitle': "Les recommandations du jour sont basées sur votre profil d'investissement",
  'greeting.advisorPanel': 'Panneau Conseiller',
  'greeting.loadingRecs': 'Chargement des recommandations personnalisées...',
  'greeting.fallbackTitle': "Recommandation d'investissement",

  // Action labels
  'greeting.action.buy': 'Acheter',
  'greeting.action.sell': 'Vendre',
  'greeting.action.watch': 'Surveiller',

  // Logged-out CTA
  'greeting.cta.heading': "Obtenez des recommandations d'investissement personnalisées",
  'greeting.cta.subtitle': "Inscrivez-vous maintenant et obtenez des analyses et recommandations basées sur l'IA adaptées à votre profil d'investissement",
  'greeting.cta.signUp': "S'inscrire",

  // ════════════════════════════════════════════════════════════════
  // ── TradingOpsDashboard ──
  // ════════════════════════════════════════════════════════════════

  // Quick Summary Strip
  'ops.criticalEvents': 'Événements critiques',
  'ops.activeSignals': 'Signaux actifs',
  'ops.mostVolatile': 'Le plus volatil',

  // Card 1: Trading Sessions
  'ops.sessions.heading': 'Séances de trading',
  'ops.sessions.open': 'Ouvert',
  'ops.sessions.closed': 'Fermé',
  'ops.sessions.tokyo': 'Tokyo',
  'ops.sessions.saudi': 'Arabie Saoudite',
  'ops.sessions.london': 'Londres',
  'ops.sessions.newyork': 'New York',
  'ops.sessions.sydney': 'Sydney',

  // Card 2: Currency Strength
  'ops.currency.heading': 'Force des devises',
  'ops.currency.category': 'Devises',

  // Card 3: Economic Calendar
  'ops.calendar.heading': 'Calendrier économique',
  'ops.calendar.all': 'Tout',
  'ops.calendar.forecast': 'Prév.: ',
  'ops.calendar.loading': 'Chargement...',
  'ops.calendar.empty': "Aucun événement majeur aujourd'hui",

  // Card 4: Council Signals
  'ops.signals.heading': 'Signaux du Conseil',
  'ops.signals.all': 'Tout',
  'ops.signals.buy': 'Acheter',
  'ops.signals.sell': 'Vendre',
  'ops.signals.entry': 'Entrée',
  'ops.signals.target': 'Objectif',
  'ops.signals.stop': 'Stop',
  'ops.signals.confidence': 'Conf.',
  'ops.signals.loading': 'Chargement...',
  'ops.signals.empty': 'Aucun signal actif actuellement',

  // Time abbreviations (ops-specific)
  'ops.time.now': 'Maintenant',
  'ops.time.min': 'm',
  'ops.time.hour': 'h',
  'ops.time.day': 'j',
};

export default fr;
