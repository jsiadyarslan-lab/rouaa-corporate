// ─── Shared English Labels for Stock Analysis Feature ──────────────
// Merged from: StockAnalysisClient, StockDetailClient, ScreenerClient
// Keys with identical translations across components are at root level.
// Keys that differ between components use dot-namespacing (analysis.*, detail.*, screener.*).

const en: Record<string, string> = {
  // ── Shared (identical across Analysis & Detail; Screener uses screener.* for conflicts) ──
  signal: 'Signal',
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  sector: 'Sector',
  marketCap: 'Market Cap',
  confidence: 'Confidence',
  riskLevel: 'Risk Level',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  retry: 'Retry',
  disclaimer:
    'This content is AI-generated for informational purposes only. Not financial advice. Past performance does not guarantee future results. Consult a licensed financial advisor before making investment decisions.',
  companyProfile: 'Company Profile',
  exchange: 'Exchange',
  industry: 'Industry',
  country: 'Country',
  eps: 'EPS',

  // ════════════════════════════════════════════════════════════════
  // ── Analysis (StockAnalysisClient) ──
  // ════════════════════════════════════════════════════════════════

  'analysis.pageTitle': 'Stock Analysis',
  'analysis.pageDesc':
    'AI-powered comprehensive analysis, top performers, sector insights, and comparison tools for smart investing decisions',
  'analysis.tabToday': "Today's Analyses",
  'analysis.tabActive': 'Most Active Stocks',
  'analysis.tabProfile': 'Company Profile',
  'analysis.tabCompare': 'Compare Stocks',
  'analysis.tabAI': 'AI Analysis',

  // Today tab
  'analysis.publishedToday': 'Published Today',
  'analysis.analysisCount': 'analyses',
  'analysis.readMore': 'Read More',
  'analysis.noAnalyses': 'No analyses available',
  'analysis.noAnalysesDesc': 'New analyses will be published soon. Check back later.',

  // Active tab – table columns
  'analysis.colSymbol': 'Symbol',
  'analysis.colName': 'Name',
  'analysis.colPrice': 'Price',
  'analysis.colChange': 'Change',
  'analysis.colVolume': 'Volume',
  'analysis.colMarketCap': 'Market Cap',
  'analysis.colSector': 'Sector',

  // Profile tab
  'analysis.searchPlaceholder': 'Search by symbol (e.g. AAPL)...',
  'analysis.searchBtn': 'Search',
  'analysis.fundamentals': 'Fundamentals',
  'analysis.pe': 'P/E',
  'analysis.dividend': 'Div. Yield',
  'analysis.technicals': 'Technical Indicators',
  'analysis.rsi': 'RSI',
  'analysis.macd': 'MACD',
  'analysis.signalStrength': 'Signal Strength',
  'analysis.currentPrice': 'Current Price',
  'analysis.noData': 'No data available',
  'analysis.enterSymbol': 'Enter a stock symbol to search',

  // Compare tab
  'analysis.addSymbol': 'Add symbol',
  'analysis.compareBtn': 'Compare',
  'analysis.removeSymbol': 'Remove',
  'analysis.comparing': 'Comparing',
  'analysis.stocks': 'stocks',
  'analysis.addMoreStocks': 'Add more stocks to compare (up to 4)',

  // AI tab
  'analysis.aiPlaceholder': 'Ask about stocks...',
  'analysis.aiBestGrowth': 'Best growth stocks',
  'analysis.aiAnalyzeAAPL': 'Analyze AAPL',
  'analysis.aiCompareMSFTGOOGL': 'Compare MSFT vs GOOGL',
  'analysis.aiThinking': 'Thinking...',
  'analysis.aiError': 'An error occurred during analysis',
  'analysis.aiUnavailable': 'AI service is currently unavailable',

  // Search
  'analysis.searchStocks': 'Search stocks...',
  'analysis.noResults': 'No results',

  // Pagination
  'analysis.pageOf': 'Page {0} of {1}',
  'analysis.loadMore': 'Load More',

  // Filters
  'analysis.filters': 'Filters',
  'analysis.showFilters': 'Show Filters',
  'analysis.hideFilters': 'Hide Filters',
  'analysis.filterSector': 'Sector',
  'analysis.filterMarket': 'Market Type',
  'analysis.filterAllSectors': 'All Sectors',
  'analysis.filterAllMarkets': 'All Markets',
  'analysis.filterAll': 'All',
  'analysis.filterBullish': 'Bullish',
  'analysis.filterBearish': 'Bearish',
  'analysis.filterNeutral': 'Neutral',

  // Watchlist
  'analysis.watchlist': 'My Watchlist',

  // Common (analysis-specific wording)
  'analysis.loading': 'Loading...',
  'analysis.error': 'Failed to load data',

  // ════════════════════════════════════════════════════════════════
  // ── Detail (StockDetailClient) ──
  // ════════════════════════════════════════════════════════════════

  'detail.backToStocks': 'Back to Stock Analysis',

  // Technical analysis
  'detail.technicalAnalysis': 'Technical Analysis',
  'detail.rsi': 'RSI (14)',
  'detail.macdSignal': 'MACD Signal',
  'detail.bollingerBands': 'Bollinger Bands',
  'detail.support': 'Support',
  'detail.resistance': 'Resistance',
  'detail.ma50': '50-Day MA',
  'detail.ma200': '200-Day MA',
  'detail.adx': 'ADX',
  'detail.stochastic': 'Stochastic',
  'detail.atr': 'ATR',

  // Fundamentals
  'detail.fundamentalData': 'Fundamental Data',
  'detail.pe': 'P/E Ratio',
  'detail.dividendYield': 'Dividend Yield',
  'detail.roe': 'ROE',
  'detail.roa': 'ROA',

  // Trade setup
  'detail.tradeSetup': 'Trade Setup',
  'detail.entry': 'Entry Price',
  'detail.stopLoss': 'Stop Loss',
  'detail.takeProfit': 'Take Profit',
  'detail.riskReward': 'Risk / Reward',

  // AI
  'detail.aiAnalysis': 'AI Analysis',
  'detail.confidence': 'Confidence Score',

  // Signal / risk (detail-specific variants)
  'detail.overbought': 'Overbought',
  'detail.oversold': 'Oversold',

  // Chart types
  'detail.candlestick': 'Candlestick',
  'detail.line': 'Line',
  'detail.upper': 'Upper',
  'detail.lower': 'Lower',

  // Loading / error
  'detail.loading': 'Loading stock data...',
  'detail.error': 'Failed to load stock data',
  'detail.notFound': 'Stock not found',
  'detail.goBack': 'Go back',

  // Price details
  'detail.priceDetails': 'Price Details',
  'detail.open': 'Open',
  'detail.dayHigh': 'High',
  'detail.dayLow': 'Low',
  'detail.close': 'Close',
  'detail.volume': 'Volume',
  'detail.prevClose': 'Prev Close',
  'detail.publishedAt': 'Published',
  'detail.validUntil': 'Valid Until',

  // Level 1 tabs & sections
  'detail.overview': 'Overview',
  'detail.financials': 'Financials',
  'detail.technical': 'Technical',
  'detail.comparison': 'Compare',
  'detail.scorecard': 'Scorecard',
  'detail.priceChart': 'Price Chart',
  'detail.period1D': '1D',
  'detail.period1W': '1W',
  'detail.period1M': '1M',
  'detail.period3M': '3M',
  'detail.sma20': 'SMA 20',
  'detail.sma50': 'SMA 50',

  // Financial statements
  'detail.incomeStatement': 'Income Statement',
  'detail.balanceSheet': 'Balance Sheet',
  'detail.cashFlow': 'Cash Flow',
  'detail.revenue': 'Revenue',
  'detail.grossProfit': 'Gross Profit',
  'detail.operatingIncome': 'Operating Income',
  'detail.netIncome': 'Net Income',
  'detail.totalAssets': 'Total Assets',
  'detail.totalLiabilities': 'Total Liabilities',
  'detail.totalEquity': 'Total Equity',
  'detail.cash': 'Cash & Equivalents',
  'detail.totalDebt': 'Total Debt',
  'detail.operatingCF': 'Operating Cash Flow',
  'detail.capEx': 'Capital Expenditure',
  'detail.freeCashFlow': 'Free Cash Flow',

  // Peers
  'detail.addSymbol': 'Add Symbol',
  'detail.noPeers': 'No peer data available',
  'detail.peersList': 'Industry Peers',
  'detail.fiscalYear': 'Fiscal Year',
  'detail.noFinancialData': 'No financial data available',

  // Analyst
  'detail.analystRating': 'Analyst Rating',
  'detail.priceTarget': 'Price Target',
  'detail.targetLow': 'Low Target',
  'detail.targetMedian': 'Median Target',
  'detail.targetHigh': 'High Target',
  'detail.fairValue': 'Fair Value',
  'detail.vsCurrent': 'vs Current',
  'detail.direction': 'Direction',
  'detail.long': 'Long',
  'detail.short': 'Short',
  'detail.wait': 'Wait',
  'detail.beta': 'Beta',
  'detail.weekRange52': '52-Week Range',

  // Margins & ratios
  'detail.grossMargin': 'Gross Margin',
  'detail.operatingMargin': 'Operating Margin',
  'detail.netMargin': 'Net Margin',
  'detail.debtToEquity': 'Debt/Equity',
  'detail.currentRatio': 'Current Ratio',

  // Scores
  'detail.technicalScore': 'Tech Score',
  'detail.fundamentalScore': 'Fund. Score',
  'detail.extreme': 'Extreme',

  // Chart
  'detail.noChartData': 'No chart data available',
  'detail.loadingComparison': 'Loading comparison...',

  // Level 2 tabs
  'detail.insights': 'Insights',
  'detail.tools': 'Tools',
  'detail.sentimentAnalysis': 'Sentiment Analysis',
  'detail.aiRecommendation': 'AI Recommendation',
  'detail.swotAnalysis': 'SWOT Analysis',
  'detail.fairValueCalc': 'Fair Value Calculator',
  'detail.paperTrading': 'Paper Trading',
  'detail.smartAlerts': 'Smart Alerts',
  'detail.sectorAnalysis': 'Sector Analysis',

  // ════════════════════════════════════════════════════════════════
  // ── Screener (ScreenerClient) ──
  // ════════════════════════════════════════════════════════════════

  'screener.title': 'Stock Scanner',
  'screener.subtitle': 'Scan stocks by signal, sector, market cap, and more',
  'screener.marketType': 'Market',
  'screener.peRange': 'P/E Range',
  'screener.all': 'All',
  'screener.neutral': 'Neutral',
  'screener.reset': 'Reset',
  'screener.results': 'Results',
  'screener.noResults': 'No stocks match your filters',
  'screener.price': 'Price',
  'screener.change': 'Change %',
  'screener.pe': 'P/E',
  'screener.page': 'Page',
  'screener.of': 'of',
  'screener.symbol': 'Symbol',
  'screener.name': 'Name',
  'screener.sectorCol': 'Sector',
  'screener.marketCapCol': 'Mkt Cap',
  'screener.sortBy': 'Sort by',
  'screener.backToAnalysis': '← Back to Stock Analysis',
};

export default en;
