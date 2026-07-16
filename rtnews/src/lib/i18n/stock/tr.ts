// ─── Shared Turkish Labels for Stock Analysis Feature ──────────────
// Merged from: StockAnalysisClient, StockDetailClient, ScreenerClient
// Keys with identical translations across components are at root level.
// Keys that differ between components use dot-namespacing (analysis.*, detail.*, screener.*).

const tr: Record<string, string> = {
  // ── Shared (identical across Analysis & Detail; Screener uses screener.* for conflicts) ──
  signal: 'Sinyal',
  bullish: 'Yükseliş',
  bearish: 'Düşüş',
  neutral: 'Nötr',
  sector: 'Sektör',
  marketCap: 'Piyasa Değeri',
  confidence: 'Güven',
  riskLevel: 'Risk Seviyesi',
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  retry: 'Tekrar Dene',
  disclaimer:
    'Bu içerik yalnızca bilgilendirme amacıyla yapay zeka tarafından oluşturulmuştur. Finansal tavsiye niteliği taşımaz. Geçmiş performans gelecekteki sonuçları garanti etmez. Yatırım kararları almadan önce lisanslı bir finansal danışmana başvurun.',
  companyProfile: 'Şirket Profili',
  exchange: 'Borsa',
  industry: 'Sektör',
  country: 'Ülke',
  eps: 'HBE',

  // ════════════════════════════════════════════════════════════════
  // ── Analysis (StockAnalysisClient) ──
  // ════════════════════════════════════════════════════════════════

  'analysis.pageTitle': 'Hisse Analizi',
  'analysis.pageDesc':
    'Yapay zeka destekli kapsamlı analizler, en iyi performans gösterenler, sektör özetleri ve bilinçli yatırım kararları için karşılaştırma araçları',
  'analysis.tabToday': 'Günün Analizleri',
  'analysis.tabActive': 'En Aktif Hisseler',
  'analysis.tabProfile': 'Şirket Profili',
  'analysis.tabCompare': 'Hisse Karşılaştır',
  'analysis.tabAI': 'YZ Analizi',

  // Today tab
  'analysis.publishedToday': 'Bugün Yayınlanan',
  'analysis.analysisCount': 'analiz',
  'analysis.readMore': 'Devamını Oku',
  'analysis.noAnalyses': 'Kullanılabilir analiz yok',
  'analysis.noAnalysesDesc': 'Yeni analizler yakında yayınlanacak. Lütfen daha sonra tekrar kontrol edin.',

  // Active tab – table columns
  'analysis.colSymbol': 'Sembol',
  'analysis.colName': 'Ad',
  'analysis.colPrice': 'Fiyat',
  'analysis.colChange': 'Değişim',
  'analysis.colVolume': 'Hacim',
  'analysis.colMarketCap': 'Piyasa Değeri',
  'analysis.colSector': 'Sektör',

  // Profile tab
  'analysis.searchPlaceholder': 'Sembol ile ara (ör: AAPL)...',
  'analysis.searchBtn': 'Ara',
  'analysis.fundamentals': 'Temel Analiz',
  'analysis.pe': 'F/K',
  'analysis.dividend': 'Tem. Verim',
  'analysis.technicals': 'Teknik Göstergeler',
  'analysis.rsi': 'RSI',
  'analysis.macd': 'MACD',
  'analysis.signalStrength': 'Sinyal Gücü',
  'analysis.currentPrice': 'Güncel Fiyat',
  'analysis.noData': 'Kullanılabilir veri yok',
  'analysis.enterSymbol': 'Arama yapmak için sembol girin',

  // Compare tab
  'analysis.addSymbol': 'Sembol ekle',
  'analysis.compareBtn': 'Karşılaştır',
  'analysis.removeSymbol': 'Kaldır',
  'analysis.comparing': 'Karşılaştırma',
  'analysis.stocks': 'hisse',
  'analysis.addMoreStocks': 'Karşılaştırmak için daha fazla hisse ekleyin (maks 4)',

  // AI tab
  'analysis.aiPlaceholder': 'Hisseler hakkında bir soru sorun...',
  'analysis.aiBestGrowth': 'En iyi büyüme hisseleri',
  'analysis.aiAnalyzeAAPL': 'AAPL analiz et',
  'analysis.aiCompareMSFTGOOGL': 'MSFT vs GOOGL karşılaştır',
  'analysis.aiThinking': 'Düşünüyor...',
  'analysis.aiError': 'Analiz sırasında bir hata oluştu',
  'analysis.aiUnavailable': 'YZ hizmeti şu anda kullanılamıyor',

  // Search
  'analysis.searchStocks': 'Hisse ara...',
  'analysis.noResults': 'Sonuç bulunamadı',

  // Pagination
  'analysis.pageOf': 'Sayfa {0} / {1}',
  'analysis.loadMore': 'Daha fazla yükle',

  // Filters
  'analysis.filters': 'Filtreler',
  'analysis.showFilters': 'Filtreleri göster',
  'analysis.hideFilters': 'Filtreleri gizle',
  'analysis.filterSector': 'Sektör',
  'analysis.filterMarket': 'Pazar türü',
  'analysis.filterAllSectors': 'Tüm sektörler',
  'analysis.filterAllMarkets': 'Tüm pazarlar',
  'analysis.filterAll': 'Tümü',
  'analysis.filterBullish': 'Yükseliş',
  'analysis.filterBearish': 'Düşüş',
  'analysis.filterNeutral': 'Nötr',

  // Watchlist
  'analysis.watchlist': 'İzleme Listem',

  // Common (analysis-specific wording)
  'analysis.loading': 'Yükleniyor...',
  'analysis.error': 'Yükleme başarısız',

  // ════════════════════════════════════════════════════════════════
  // ── Detail (StockDetailClient) ──
  // ════════════════════════════════════════════════════════════════

  'detail.backToStocks': 'Hisse Analizine Dön',

  // Technical analysis
  'detail.technicalAnalysis': 'Teknik Analiz',
  'detail.rsi': 'RSI (14)',
  'detail.macdSignal': 'MACD Sinyali',
  'detail.bollingerBands': 'Bollinger Bantları',
  'detail.support': 'Destek',
  'detail.resistance': 'Direnç',
  'detail.ma50': '50 Günlük MO',
  'detail.ma200': '200 Günlük MO',
  'detail.adx': 'ADX',
  'detail.stochastic': 'Stokastik',
  'detail.atr': 'ATR',

  // Fundamentals
  'detail.fundamentalData': 'Temel Veriler',
  'detail.pe': 'F/K Oranı',
  'detail.dividendYield': 'Tem. Verim',
  'detail.roe': 'Özkay. Karlılığı',
  'detail.roa': 'Varlık Karlılığı',

  // Trade setup
  'detail.tradeSetup': 'İşlem Kurulumu',
  'detail.entry': 'Giriş Fiyatı',
  'detail.stopLoss': 'Zarar Durdur',
  'detail.takeProfit': 'Kâr Al',
  'detail.riskReward': 'Risk / Getiri',

  // AI
  'detail.aiAnalysis': 'YZ Analizi',
  'detail.confidence': 'Güven Skoru',

  // Signal / risk (detail-specific variants)
  'detail.overbought': 'Aşırı Alım',
  'detail.oversold': 'Aşırı Satım',

  // Chart types
  'detail.candlestick': 'Mum',
  'detail.line': 'Çizgi',
  'detail.upper': 'Üst',
  'detail.lower': 'Alt',

  // Loading / error
  'detail.loading': 'Veriler yükleniyor...',
  'detail.error': 'Yükleme başarısız',
  'detail.notFound': 'Hisse bulunamadı',
  'detail.goBack': 'Geri',

  // Price details
  'detail.priceDetails': 'Fiyat Detayları',
  'detail.open': 'Açılış',
  'detail.dayHigh': 'Günlük Yüksek',
  'detail.dayLow': 'Günlük Düşük',
  'detail.close': 'Kapanış',
  'detail.volume': 'Hacim',
  'detail.prevClose': 'Önceki Kapanış',
  'detail.publishedAt': 'Yayın tarihi',
  'detail.validUntil': 'Geçerlilik tarihi',

  // Level 1 tabs & sections
  'detail.overview': 'Genel Bakış',
  'detail.financials': 'Finansallar',
  'detail.technical': 'Teknik',
  'detail.comparison': 'Karşılaştır',
  'detail.scorecard': 'Puan Kartı',
  'detail.priceChart': 'Grafik',
  'detail.period1D': '1G',
  'detail.period1W': '1H',
  'detail.period1M': '1A',
  'detail.period3M': '3A',
  'detail.sma20': '20 MO',
  'detail.sma50': '50 MO',

  // Financial statements
  'detail.incomeStatement': 'Gelir Tablosu',
  'detail.balanceSheet': 'Bilanço',
  'detail.cashFlow': 'Nakit Akışı',
  'detail.revenue': 'Gelir',
  'detail.grossProfit': 'Brüt Kâr',
  'detail.operatingIncome': 'Faaliyet Kârı',
  'detail.netIncome': 'Net Kâr',
  'detail.totalAssets': 'Toplam Varlıklar',
  'detail.totalLiabilities': 'Toplam Yükümlülükler',
  'detail.totalEquity': 'Özkaynaklar',
  'detail.cash': 'Nakit',
  'detail.totalDebt': 'Toplam Borç',
  'detail.operatingCF': 'Faaliyet Nakit Akışı',
  'detail.capEx': 'Sermaye Harcaması',
  'detail.freeCashFlow': 'Serbest Nakit Akışı',

  // Peers
  'detail.addSymbol': 'Sembol Ekle',
  'detail.noPeers': 'Sektör karşılığı verisi yok',
  'detail.peersList': 'Sektör Karşılıkları',
  'detail.fiscalYear': 'Mali Yıl',
  'detail.noFinancialData': 'Finansal veri mevcut değil',

  // Analyst
  'detail.analystRating': 'Analist Değerlendirmesi',
  'detail.priceTarget': 'Fiyat Hedefi',
  'detail.targetLow': 'Düşük Hedef',
  'detail.targetMedian': 'Medyan Hedef',
  'detail.targetHigh': 'Yüksek Hedef',
  'detail.fairValue': 'Adil Değer',
  'detail.vsCurrent': 'Mevcut Fiyatla',
  'detail.direction': 'Yön',
  'detail.long': 'Long',
  'detail.short': 'Short',
  'detail.wait': 'Bekle',
  'detail.beta': 'Beta',
  'detail.weekRange52': '52 Haftalık Aralık',

  // Margins & ratios
  'detail.grossMargin': 'Brüt Kar Marjı',
  'detail.operatingMargin': 'Faaliyet Marjı',
  'detail.netMargin': 'Net Kar Marjı',
  'detail.debtToEquity': 'Borç/Özkaynak',
  'detail.currentRatio': 'Cari Oran',

  // Scores
  'detail.technicalScore': 'Tek. Puan',
  'detail.fundamentalScore': 'Tem. Puan',
  'detail.extreme': 'Aşırı',

  // Chart
  'detail.noChartData': 'Grafik verisi mevcut değil',
  'detail.loadingComparison': 'Karşılaştırma yükleniyor...',

  // Level 2 tabs
  'detail.insights': 'Görüşler',
  'detail.tools': 'Araçlar',
  'detail.sentimentAnalysis': 'Duygu Analizi',
  'detail.aiRecommendation': 'YZ Tavsiyesi',
  'detail.swotAnalysis': 'SWOT Analizi',
  'detail.fairValueCalc': 'Adil Değer Hesaplayıcı',
  'detail.paperTrading': 'Simülasyon İşlem',
  'detail.smartAlerts': 'Akıllı Uyarılar',
  'detail.sectorAnalysis': 'Sektör Analizi',

  // ════════════════════════════════════════════════════════════════
  // ── Screener (ScreenerClient) ──
  // ════════════════════════════════════════════════════════════════

  'screener.title': 'Hisse Tarayıcı',
  'screener.subtitle': 'Hisseleri sinyal, sektör, piyasa değeri ve daha fazlasına göre tarayın',
  'screener.marketType': 'Pazar',
  'screener.peRange': 'F/K Aralığı',
  'screener.all': 'Tümü',
  'screener.neutral': 'Nötr',
  'screener.reset': 'Sıfırla',
  'screener.results': 'Sonuçlar',
  'screener.noResults': 'Filtrelere uyan hisse bulunamadı',
  'screener.price': 'Fiyat',
  'screener.change': 'Değişim %',
  'screener.pe': 'F/K',
  'screener.page': 'Sayfa',
  'screener.of': '/',
  'screener.symbol': 'Sembol',
  'screener.name': 'Ad',
  'screener.sectorCol': 'Sektör',
  'screener.marketCapCol': 'Piy. Değ.',
  'screener.sortBy': 'Sırala',
  'screener.backToAnalysis': '← Analize dön',
};

export default tr;
