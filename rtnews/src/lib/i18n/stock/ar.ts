// ─── Shared Arabic Labels for Stock Analysis Feature ──────────────
// Merged from: StockAnalysisClient, StockDetailClient, ScreenerClient
// Keys with identical translations across components are at root level.
// Keys that differ between components use dot-namespacing (analysis.*, detail.*, screener.*).

const ar: Record<string, string> = {
  // ── Shared (identical across Analysis & Detail; Screener uses screener.* for conflicts) ──
  signal: 'الإشارة',
  bullish: 'صاعد',
  bearish: 'هابط',
  neutral: 'محايد',
  sector: 'القطاع',
  marketCap: 'القيمة السوقية',
  confidence: 'الثقة',
  riskLevel: 'مستوى المخاطر',
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  retry: 'إعادة المحاولة',
  disclaimer:
    'هذا المحتوى مُولّد بالذكاء الاصطناعي لأغراض إعلامية فقط. ليس نصيحة مالية. الأداء السابق لا يضمن النتائج المستقبلية. استشر مستشاراً مالياً مرخصاً قبل اتخاذ أي قرارات استثمارية.',
  companyProfile: 'ملف الشركة',
  exchange: 'البورصة',
  industry: 'الصناعة',
  country: 'الدولة',
  eps: 'ربحية السهم',

  // ════════════════════════════════════════════════════════════════
  // ── Analysis (StockAnalysisClient) ──
  // ════════════════════════════════════════════════════════════════

  'analysis.pageTitle': 'تحليل الأسهم',
  'analysis.pageDesc':
    'تحليلات شاملة مدعومة بالذكاء الاصطناعي، أفضل الأسهم أداءً، نظرة على القطاعات، وأدوات مقارنة لاتخاذ قرارات استثمارية ذكية',
  'analysis.tabToday': 'تحليلات اليوم',
  'analysis.tabActive': 'الأسهم الأكثر نشاطاً',
  'analysis.tabProfile': 'ملف الشركة',
  'analysis.tabCompare': 'مقارنة الأسهم',
  'analysis.tabAI': 'تحليل AI',

  // Today tab
  'analysis.publishedToday': 'منشور اليوم',
  'analysis.analysisCount': 'تحليل',
  'analysis.readMore': 'اقرأ المزيد',
  'analysis.noAnalyses': 'لا توجد تحليلات متاحة حالياً',
  'analysis.noAnalysesDesc': 'سيتم نشر تحليلات جديدة قريباً. تحقق لاحقاً.',

  // Active tab – table columns
  'analysis.colSymbol': 'الرمز',
  'analysis.colName': 'الاسم',
  'analysis.colPrice': 'السعر',
  'analysis.colChange': 'التغيير',
  'analysis.colVolume': 'الحجم',
  'analysis.colMarketCap': 'القيمة السوقية',
  'analysis.colSector': 'القطاع',

  // Profile tab
  'analysis.searchPlaceholder': 'ابحث برمز السهم (مثال: AAPL)...',
  'analysis.searchBtn': 'بحث',
  'analysis.fundamentals': 'البيانات الأساسية',
  'analysis.pe': 'م/ر',
  'analysis.dividend': 'عائد التوزيعات',
  'analysis.technicals': 'المؤشرات الفنية',
  'analysis.rsi': 'RSI',
  'analysis.macd': 'MACD',
  'analysis.signalStrength': 'قوة الإشارة',
  'analysis.currentPrice': 'السعر الحالي',
  'analysis.noData': 'لا توجد بيانات متاحة',
  'analysis.enterSymbol': 'أدخل رمز السهم للبحث',

  // Compare tab
  'analysis.addSymbol': 'أضف رمز سهم',
  'analysis.compareBtn': 'مقارنة',
  'analysis.removeSymbol': 'إزالة',
  'analysis.comparing': 'مقارنة',
  'analysis.stocks': 'أسهم',
  'analysis.addMoreStocks': 'أضف المزيد من الأسهم للمقارنة (حتى 4)',

  // AI tab
  'analysis.aiPlaceholder': 'اسأل عن الأسهم...',
  'analysis.aiBestGrowth': 'أفضل أسهم النمو',
  'analysis.aiAnalyzeAAPL': 'تحليل AAPL',
  'analysis.aiCompareMSFTGOOGL': 'مقارنة MSFT و GOOGL',
  'analysis.aiThinking': 'يفكر...',
  'analysis.aiError': 'حدث خطأ في التحليل',
  'analysis.aiUnavailable': 'خدمة AI غير متاحة حالياً',

  // Search
  'analysis.searchStocks': 'بحث الأسهم...',
  'analysis.noResults': 'لا توجد نتائج',

  // Pagination
  'analysis.pageOf': 'صفحة {0} من {1}',
  'analysis.loadMore': 'تحميل المزيد',

  // Filters
  'analysis.filters': 'الفلاتر',
  'analysis.showFilters': 'عرض الفلاتر',
  'analysis.hideFilters': 'إخفاء الفلاتر',
  'analysis.filterSector': 'القطاع',
  'analysis.filterMarket': 'نوع السوق',
  'analysis.filterAllSectors': 'جميع القطاعات',
  'analysis.filterAllMarkets': 'جميع الأسواق',
  'analysis.filterAll': 'الكل',
  'analysis.filterBullish': 'صاعد',
  'analysis.filterBearish': 'هابط',
  'analysis.filterNeutral': 'محايد',

  // Watchlist
  'analysis.watchlist': 'مفضلتي',

  // Common (analysis-specific wording)
  'analysis.loading': 'جاري التحميل...',
  'analysis.error': 'فشل تحميل البيانات',

  // ════════════════════════════════════════════════════════════════
  // ── Detail (StockDetailClient) ──
  // ════════════════════════════════════════════════════════════════

  'detail.backToStocks': 'العودة لتحليل الأسهم',

  // Technical analysis
  'detail.technicalAnalysis': 'التحليل الفني',
  'detail.rsi': 'RSI (14)',
  'detail.macdSignal': 'إشارة MACD',
  'detail.bollingerBands': 'نطاقات بولينجر',
  'detail.support': 'الدعم',
  'detail.resistance': 'المقاومة',
  'detail.ma50': 'المتوسط 50 يوم',
  'detail.ma200': 'المتوسط 200 يوم',
  'detail.adx': 'ADX',
  'detail.stochastic': 'الاستوكاستك',
  'detail.atr': 'ATR',

  // Fundamentals
  'detail.fundamentalData': 'البيانات الأساسية',
  'detail.pe': 'نسبة م/ر',
  'detail.dividendYield': 'عائد التوزيعات',
  'detail.roe': 'العائد على حقوق الملكية',
  'detail.roa': 'العائد على الأصول',

  // Trade setup
  'detail.tradeSetup': 'إعداد التداول',
  'detail.entry': 'سعر الدخول',
  'detail.stopLoss': 'وقف الخسارة',
  'detail.takeProfit': 'جني الأرباح',
  'detail.riskReward': 'المخاطرة / العائد',

  // AI
  'detail.aiAnalysis': 'تحليل الذكاء الاصطناعي',
  'detail.confidence': 'درجة الثقة',

  // Signal / risk (detail-specific variants)
  'detail.overbought': 'ذوو شراء',
  'detail.oversold': 'ذوو بيع',

  // Chart types
  'detail.candlestick': 'شموع',
  'detail.line': 'خطي',
  'detail.upper': 'العلوي',
  'detail.lower': 'السفلي',

  // Loading / error
  'detail.loading': 'جاري تحميل بيانات السهم...',
  'detail.error': 'فشل تحميل بيانات السهم',
  'detail.notFound': 'السهم غير موجود',
  'detail.goBack': 'العودة',

  // Price details
  'detail.priceDetails': 'تفاصيل السعر',
  'detail.open': 'الافتتاح',
  'detail.dayHigh': 'الأعلى',
  'detail.dayLow': 'الأدنى',
  'detail.close': 'الإغلاق',
  'detail.volume': 'الحجم',
  'detail.prevClose': 'إغلاق سابق',
  'detail.publishedAt': 'تاريخ النشر',
  'detail.validUntil': 'صالح حتى',

  // Level 1 tabs & sections
  'detail.overview': 'نظرة عامة',
  'detail.financials': 'المالية',
  'detail.technical': 'الفني',
  'detail.comparison': 'مقارنة',
  'detail.scorecard': 'بطاقة التقييم',
  'detail.priceChart': 'الرسم البياني',
  'detail.period1D': '١يوم',
  'detail.period1W': '١أسبوع',
  'detail.period1M': '١شهر',
  'detail.period3M': '٣شهر',
  'detail.sma20': 'المتوسط ٢٠',
  'detail.sma50': 'المتوسط ٥٠',

  // Financial statements
  'detail.incomeStatement': 'قائمة الدخل',
  'detail.balanceSheet': 'الميزانية العمومية',
  'detail.cashFlow': 'التدفقات النقدية',
  'detail.revenue': 'الإيرادات',
  'detail.grossProfit': 'إجمالي الربح',
  'detail.operatingIncome': 'الدخل التشغيلي',
  'detail.netIncome': 'صافي الدخل',
  'detail.totalAssets': 'إجمالي الأصول',
  'detail.totalLiabilities': 'إجمالي الالتزامات',
  'detail.totalEquity': 'إجمالي حقوق المساهمين',
  'detail.cash': 'النقد وما في حكمه',
  'detail.totalDebt': 'إجمالي الديون',
  'detail.operatingCF': 'التدفق النقدي التشغيلي',
  'detail.capEx': 'الإنفاق الرأسمالي',
  'detail.freeCashFlow': 'التدفق النقدي الحر',

  // Peers
  'detail.addSymbol': 'أضف رمز',
  'detail.noPeers': 'لا توجد بيانات نظير متاحة',
  'detail.peersList': 'شركات القطاع',
  'detail.fiscalYear': 'السنة المالية',
  'detail.noFinancialData': 'لا توجد بيانات مالية متاحة',

  // Analyst
  'detail.analystRating': 'تقييم المحللين',
  'detail.priceTarget': 'هدف السعر',
  'detail.targetLow': 'الهدف الأدنى',
  'detail.targetMedian': 'الهدف الوسيط',
  'detail.targetHigh': 'الهدف الأعلى',
  'detail.fairValue': 'القيمة العادلة',
  'detail.vsCurrent': 'مقابل الحالي',
  'detail.direction': 'الاتجاه',
  'detail.long': 'شراء',
  'detail.short': 'بيع',
  'detail.wait': 'انتظار',
  'detail.beta': 'بيتا',
  'detail.weekRange52': 'نطاق ٥٢ أسبوع',

  // Margins & ratios
  'detail.grossMargin': 'هامش الربح الإجمالي',
  'detail.operatingMargin': 'هامش التشغيل',
  'detail.netMargin': 'هامش صافي الربح',
  'detail.debtToEquity': 'الدين/حقوق المساهمين',
  'detail.currentRatio': 'نسبة التداول',

  // Scores
  'detail.technicalScore': 'الدرجة الفنية',
  'detail.fundamentalScore': 'الدرجة الأساسية',
  'detail.extreme': 'شديد',

  // Chart
  'detail.noChartData': 'لا توجد بيانات رسم بياني متاحة',
  'detail.loadingComparison': 'جاري تحميل المقارنة...',

  // Level 2 tabs
  'detail.insights': 'رؤى',
  'detail.tools': 'أدوات',
  'detail.sentimentAnalysis': 'تحليل المشاعر',
  'detail.aiRecommendation': 'توصية الذكاء الاصطناعي',
  'detail.swotAnalysis': 'تحليل SWOT',
  'detail.fairValueCalc': 'حاسبة القيمة العادلة',
  'detail.paperTrading': 'التداول الورقي',
  'detail.smartAlerts': 'التنبيهات الذكية',
  'detail.sectorAnalysis': 'تحليل القطاع',

  // ════════════════════════════════════════════════════════════════
  // ── Screener (ScreenerClient) ──
  // ════════════════════════════════════════════════════════════════

  'screener.title': 'ماسح الأسهم',
  'screener.subtitle': 'قم بمسح الأسهم حسب الإشارة والقطاع والقيمة السوقية والمزيد',
  'screener.marketType': 'السوق',
  'screener.peRange': 'نطاق السعر للربح',
  'screener.all': 'الكل',
  'screener.neutral': 'عرضي',
  'screener.reset': 'إعادة تعيين',
  'screener.results': 'النتائج',
  'screener.noResults': 'لا توجد أسهم تطابق الفلاتر',
  'screener.price': 'السعر',
  'screener.change': 'التغير %',
  'screener.pe': 'السعر/الربح',
  'screener.page': 'صفحة',
  'screener.of': 'من',
  'screener.symbol': 'الرمز',
  'screener.name': 'الاسم',
  'screener.sectorCol': 'القطاع',
  'screener.marketCapCol': 'القيمة',
  'screener.sortBy': 'ترتيب حسب',
  'screener.backToAnalysis': '→ العودة لتحليل الأسهم',
};

export default ar;
