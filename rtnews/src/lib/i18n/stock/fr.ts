// ─── Shared French Labels for Stock Analysis Feature ──────────────
// Merged from: StockAnalysisClient, StockDetailClient, ScreenerClient
// Keys with identical translations across components are at root level.
// Keys that differ between components use dot-namespacing (analysis.*, detail.*, screener.*).

const fr: Record<string, string> = {
  // ── Shared (identical across Analysis & Detail; Screener uses screener.* for conflicts) ──
  signal: 'Signal',
  bullish: 'Haussier',
  bearish: 'Baissier',
  neutral: 'Neutre',
  sector: 'Secteur',
  marketCap: 'Cap. Boursière',
  confidence: 'Confiance',
  riskLevel: 'Niveau de Risque',
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  retry: 'Réessayer',
  disclaimer:
    "Ce contenu est généré par IA à titre informatif uniquement. Non un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Consultez un conseiller financier agréé avant de prendre des décisions d'investissement.",
  companyProfile: "Profil de l'Entreprise",
  exchange: 'Bourse',
  industry: 'Industrie',
  country: 'Pays',
  eps: 'BPA',

  // ════════════════════════════════════════════════════════════════
  // ── Analysis (StockAnalysisClient) ──
  // ════════════════════════════════════════════════════════════════

  'analysis.pageTitle': 'Analyse Actions',
  'analysis.pageDesc':
    "Analyses complètes alimentées par l'IA, meilleurs performeurs, aperçus sectoriels et outils de comparaison pour des décisions d'investissement éclairées",
  'analysis.tabToday': 'Analyses du Jour',
  'analysis.tabActive': 'Actions les Plus Actives',
  'analysis.tabProfile': 'Profil Entreprise',
  'analysis.tabCompare': 'Comparer les Actions',
  'analysis.tabAI': 'Analyse IA',

  // Today tab
  'analysis.publishedToday': "Publié Aujourd'hui",
  'analysis.analysisCount': 'analyses',
  'analysis.readMore': 'Lire la Suite',
  'analysis.noAnalyses': 'Aucune analyse disponible',
  'analysis.noAnalysesDesc': 'De nouvelles analyses seront publiées bientôt. Revenez plus tard.',

  // Active tab – table columns
  'analysis.colSymbol': 'Symbole',
  'analysis.colName': 'Nom',
  'analysis.colPrice': 'Prix',
  'analysis.colChange': 'Variation',
  'analysis.colVolume': 'Volume',
  'analysis.colMarketCap': 'Cap. Boursière',
  'analysis.colSector': 'Secteur',

  // Profile tab
  'analysis.searchPlaceholder': 'Rechercher par symbole (ex: AAPL)...',
  'analysis.searchBtn': 'Rechercher',
  'analysis.fundamentals': 'Fondamentaux',
  'analysis.pe': 'P/E',
  'analysis.dividend': 'Rend. Dividende',
  'analysis.technicals': 'Indicateurs Techniques',
  'analysis.rsi': 'RSI',
  'analysis.macd': 'MACD',
  'analysis.signalStrength': 'Force du Signal',
  'analysis.currentPrice': 'Prix Actuel',
  'analysis.noData': 'Aucune donnée disponible',
  'analysis.enterSymbol': 'Entrez un symbole pour rechercher',

  // Compare tab
  'analysis.addSymbol': 'Ajouter symbole',
  'analysis.compareBtn': 'Comparer',
  'analysis.removeSymbol': 'Retirer',
  'analysis.comparing': 'Comparaison',
  'analysis.stocks': 'actions',
  'analysis.addMoreStocks': "Ajoutez plus d'actions à comparer (max 4)",

  // AI tab
  'analysis.aiPlaceholder': 'Posez une question sur les actions...',
  'analysis.aiBestGrowth': 'Meilleures actions de croissance',
  'analysis.aiAnalyzeAAPL': 'Analyser AAPL',
  'analysis.aiCompareMSFTGOOGL': 'Comparer MSFT vs GOOGL',
  'analysis.aiThinking': 'Réflexion...',
  'analysis.aiError': "Une erreur est survenue lors de l'analyse",
  'analysis.aiUnavailable': 'Le service IA est actuellement indisponible',

  // Search
  'analysis.searchStocks': 'Rechercher des actions...',
  'analysis.noResults': 'Aucun résultat',

  // Pagination
  'analysis.pageOf': 'Page {0} sur {1}',
  'analysis.loadMore': 'Charger plus',

  // Filters
  'analysis.filters': 'Filtres',
  'analysis.showFilters': 'Afficher les filtres',
  'analysis.hideFilters': 'Masquer les filtres',
  'analysis.filterSector': 'Secteur',
  'analysis.filterMarket': 'Type de marché',
  'analysis.filterAllSectors': 'Tous les secteurs',
  'analysis.filterAllMarkets': 'Tous les marchés',
  'analysis.filterAll': 'Tous',
  'analysis.filterBullish': 'Haussier',
  'analysis.filterBearish': 'Baissier',
  'analysis.filterNeutral': 'Neutre',

  // Watchlist
  'analysis.watchlist': 'Ma Watchlist',

  // Common (analysis-specific wording)
  'analysis.loading': 'Chargement...',
  'analysis.error': 'Échec du chargement',

  // ════════════════════════════════════════════════════════════════
  // ── Detail (StockDetailClient) ──
  // ════════════════════════════════════════════════════════════════

  'detail.backToStocks': "Retour à l'Analyse Actions",

  // Technical analysis
  'detail.technicalAnalysis': 'Analyse Technique',
  'detail.rsi': 'RSI (14)',
  'detail.macdSignal': 'Signal MACD',
  'detail.bollingerBands': 'Bandes de Bollinger',
  'detail.support': 'Support',
  'detail.resistance': 'Résistance',
  'detail.ma50': 'MM 50 jours',
  'detail.ma200': 'MM 200 jours',
  'detail.adx': 'ADX',
  'detail.stochastic': 'Stochastique',
  'detail.atr': 'ATR',

  // Fundamentals
  'detail.fundamentalData': 'Données Fondamentales',
  'detail.pe': 'Ratio P/E',
  'detail.dividendYield': 'Rend. Dividende',
  'detail.roe': 'ROE',
  'detail.roa': 'ROA',

  // Trade setup
  'detail.tradeSetup': 'Configuration de Trading',
  'detail.entry': "Prix d'Entrée",
  'detail.stopLoss': 'Stop Loss',
  'detail.takeProfit': 'Take Profit',
  'detail.riskReward': 'Risque / Rendement',

  // AI
  'detail.aiAnalysis': 'Analyse IA',
  'detail.confidence': 'Score de Confiance',

  // Signal / risk (detail-specific variants)
  'detail.overbought': 'Surachat',
  'detail.oversold': 'Survente',

  // Chart types
  'detail.candlestick': 'Bougie',
  'detail.line': 'Ligne',
  'detail.upper': 'Supérieur',
  'detail.lower': 'Inférieur',

  // Loading / error
  'detail.loading': 'Chargement des données...',
  'detail.error': 'Échec du chargement',
  'detail.notFound': 'Action introuvable',
  'detail.goBack': 'Retour',

  // Price details
  'detail.priceDetails': 'Détails du Prix',
  'detail.open': 'Ouverture',
  'detail.dayHigh': 'Plus Haut',
  'detail.dayLow': 'Plus Bas',
  'detail.close': 'Clôture',
  'detail.volume': 'Volume',
  'detail.prevClose': 'Clôture Préc.',
  'detail.publishedAt': 'Publié le',
  'detail.validUntil': "Valide jusqu'au",

  // Level 1 tabs & sections
  'detail.overview': 'Aperçu',
  'detail.financials': 'Finances',
  'detail.technical': 'Technique',
  'detail.comparison': 'Comparer',
  'detail.scorecard': 'Carte de Score',
  'detail.priceChart': 'Graphique',
  'detail.period1D': '1J',
  'detail.period1W': '1S',
  'detail.period1M': '1M',
  'detail.period3M': '3M',
  'detail.sma20': 'MM 20',
  'detail.sma50': 'MM 50',

  // Financial statements
  'detail.incomeStatement': 'Compte de Résultat',
  'detail.balanceSheet': 'Bilan',
  'detail.cashFlow': 'Flux de Trésorerie',
  'detail.revenue': "Chiffre d'affaires",
  'detail.grossProfit': 'Bénéfice Brut',
  'detail.operatingIncome': "Résultat d'Exploitation",
  'detail.netIncome': 'Bénéfice Net',
  'detail.totalAssets': 'Total Actifs',
  'detail.totalLiabilities': 'Total Passifs',
  'detail.totalEquity': 'Capitaux Propres',
  'detail.cash': 'Trésorerie',
  'detail.totalDebt': 'Dette Totale',
  'detail.operatingCF': "Flux d'Exploitation",
  'detail.capEx': "Dépenses d'Investissement",
  'detail.freeCashFlow': 'Flux de Trésorerie Libre',

  // Peers
  'detail.addSymbol': 'Ajouter Symbole',
  'detail.noPeers': 'Aucune donnée de pairs disponible',
  'detail.peersList': 'Pairs du Secteur',
  'detail.fiscalYear': 'Exercice',
  'detail.noFinancialData': 'Aucune donnée financière disponible',

  // Analyst
  'detail.analystRating': 'Évaluation Analystes',
  'detail.priceTarget': 'Objectif de Prix',
  'detail.targetLow': 'Objectif Bas',
  'detail.targetMedian': 'Objectif Médian',
  'detail.targetHigh': 'Objectif Haut',
  'detail.fairValue': 'Valeur Juste',
  'detail.vsCurrent': 'vs Actuel',
  'detail.direction': 'Direction',
  'detail.long': 'Long',
  'detail.short': 'Short',
  'detail.wait': 'Attendre',
  'detail.beta': 'Bêta',
  'detail.weekRange52': 'Plage 52 Semaines',

  // Margins & ratios
  'detail.grossMargin': 'Marge Brute',
  'detail.operatingMargin': "Marge d'Exploitation",
  'detail.netMargin': 'Marge Nette',
  'detail.debtToEquity': 'Dette/Fonds Propres',
  'detail.currentRatio': 'Ratio de Liquidité',

  // Scores
  'detail.technicalScore': 'Score Tech',
  'detail.fundamentalScore': 'Score Fond.',
  'detail.extreme': 'Extrême',

  // Chart
  'detail.noChartData': 'Aucune donnée de graphique disponible',
  'detail.loadingComparison': 'Chargement de la comparaison...',

  // Level 2 tabs
  'detail.insights': 'Insights',
  'detail.tools': 'Outils',
  'detail.sentimentAnalysis': 'Analyse de Sentiment',
  'detail.aiRecommendation': 'Recommandation IA',
  'detail.swotAnalysis': 'Analyse SWOT',
  'detail.fairValueCalc': 'Calculateur de Valeur Juste',
  'detail.paperTrading': 'Trading Papier',
  'detail.smartAlerts': 'Alertes Intelligentes',
  'detail.sectorAnalysis': 'Analyse Sectorielle',

  // ════════════════════════════════════════════════════════════════
  // ── Screener (ScreenerClient) ──
  // ════════════════════════════════════════════════════════════════

  'screener.title': 'Scanner Boursier',
  'screener.subtitle': 'Scannez les actions par signal, secteur, capitalisation et plus',
  'screener.marketType': 'Marché',
  'screener.peRange': 'Plage P/E',
  'screener.all': 'Tous',
  'screener.neutral': 'Neutre',
  'screener.reset': 'Réinitialiser',
  'screener.results': 'Résultats',
  'screener.noResults': 'Aucune action ne correspond aux filtres',
  'screener.price': 'Prix',
  'screener.change': 'Variation %',
  'screener.pe': 'P/E',
  'screener.page': 'Page',
  'screener.of': 'de',
  'screener.symbol': 'Symbole',
  'screener.name': 'Nom',
  'screener.sectorCol': 'Secteur',
  'screener.marketCapCol': 'Cap. Bours.',
  'screener.sortBy': 'Trier par',
  "screener.backToAnalysis": "← Retour à l'analyse",
};

export default fr;
