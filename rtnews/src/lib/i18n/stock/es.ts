// ─── Shared Spanish Labels for Stock Analysis Feature ──────────────
// Merged from: StockAnalysisClient, StockDetailClient, ScreenerClient
// Keys with identical translations across components are at root level.
// Keys that differ between components use dot-namespacing (analysis.*, detail.*, screener.*).

const es: Record<string, string> = {
  // ── Shared (identical across Analysis & Detail; Screener uses screener.* for conflicts) ──
  signal: 'Señal',
  bullish: 'Alcista',
  bearish: 'Bajista',
  neutral: 'Neutral',
  sector: 'Sector',
  marketCap: 'Cap. de Mercado',
  confidence: 'Confianza',
  riskLevel: 'Nivel de Riesgo',
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  retry: 'Reintentar',
  disclaimer:
    'Este contenido es generado por IA con fines informativos únicamente. No constituye asesoramiento financiero. El rendimiento pasado no garantiza resultados futuros. Consulte a un asesor financiero autorizado antes de tomar decisiones de inversión.',
  companyProfile: 'Perfil de Empresa',
  exchange: 'Bolsa',
  industry: 'Industria',
  country: 'País',
  eps: 'BPA',

  // ════════════════════════════════════════════════════════════════
  // ── Analysis (StockAnalysisClient) ──
  // ════════════════════════════════════════════════════════════════

  'analysis.pageTitle': 'Análisis de Acciones',
  'analysis.pageDesc':
    'Análisis integral impulsado por IA, mejores desempeños, información sectorial y herramientas de comparación para decisiones de inversión inteligentes',
  'analysis.tabToday': 'Análisis de Hoy',
  'analysis.tabActive': 'Acciones Más Activas',
  'analysis.tabProfile': 'Perfil de Empresa',
  'analysis.tabCompare': 'Comparar Acciones',
  'analysis.tabAI': 'Análisis IA',

  // Today tab
  'analysis.publishedToday': 'Publicado Hoy',
  'analysis.analysisCount': 'análisis',
  'analysis.readMore': 'Leer Más',
  'analysis.noAnalyses': 'No hay análisis disponibles',
  'analysis.noAnalysesDesc': 'Se publicarán nuevos análisis pronto. Vuelva más tarde.',

  // Active tab – table columns
  'analysis.colSymbol': 'Símbolo',
  'analysis.colName': 'Nombre',
  'analysis.colPrice': 'Precio',
  'analysis.colChange': 'Cambio',
  'analysis.colVolume': 'Volumen',
  'analysis.colMarketCap': 'Cap. de Mercado',
  'analysis.colSector': 'Sector',

  // Profile tab
  'analysis.searchPlaceholder': 'Buscar por símbolo (ej. AAPL)...',
  'analysis.searchBtn': 'Buscar',
  'analysis.fundamentals': 'Fundamentos',
  'analysis.pe': 'PER',
  'analysis.dividend': 'Rend. Dividendo',
  'analysis.technicals': 'Indicadores Técnicos',
  'analysis.rsi': 'RSI',
  'analysis.macd': 'MACD',
  'analysis.signalStrength': 'Fuerza de Señal',
  'analysis.currentPrice': 'Precio Actual',
  'analysis.noData': 'No hay datos disponibles',
  'analysis.enterSymbol': 'Ingrese un símbolo de acción para buscar',

  // Compare tab
  'analysis.addSymbol': 'Agregar símbolo',
  'analysis.compareBtn': 'Comparar',
  'analysis.removeSymbol': 'Eliminar',
  'analysis.comparing': 'Comparando',
  'analysis.stocks': 'acciones',
  'analysis.addMoreStocks': 'Agregue más acciones para comparar (hasta 4)',

  // AI tab
  'analysis.aiPlaceholder': 'Pregunte sobre acciones...',
  'analysis.aiBestGrowth': 'Mejores acciones de crecimiento',
  'analysis.aiAnalyzeAAPL': 'Analizar AAPL',
  'analysis.aiCompareMSFTGOOGL': 'Comparar MSFT vs GOOGL',
  'analysis.aiThinking': 'Pensando...',
  'analysis.aiError': 'Ocurrió un error durante el análisis',
  'analysis.aiUnavailable': 'El servicio de IA no está disponible actualmente',

  // Search
  'analysis.searchStocks': 'Buscar acciones...',
  'analysis.noResults': 'Sin resultados',

  // Pagination
  'analysis.pageOf': 'Página {0} de {1}',
  'analysis.loadMore': 'Cargar Más',

  // Filters
  'analysis.filters': 'Filtros',
  'analysis.showFilters': 'Mostrar Filtros',
  'analysis.hideFilters': 'Ocultar Filtros',
  'analysis.filterSector': 'Sector',
  'analysis.filterMarket': 'Tipo de Mercado',
  'analysis.filterAllSectors': 'Todos los Sectores',
  'analysis.filterAllMarkets': 'Todos los Mercados',
  'analysis.filterAll': 'Todos',
  'analysis.filterBullish': 'Alcista',
  'analysis.filterBearish': 'Bajista',
  'analysis.filterNeutral': 'Neutral',

  // Watchlist
  'analysis.watchlist': 'Mi Lista de Seguimiento',

  // Common (analysis-specific wording)
  'analysis.loading': 'Cargando...',
  'analysis.error': 'Error al cargar datos',

  // ════════════════════════════════════════════════════════════════
  // ── Detail (StockDetailClient) ──
  // ════════════════════════════════════════════════════════════════

  'detail.backToStocks': 'Volver a Análisis de Acciones',

  // Technical analysis
  'detail.technicalAnalysis': 'Análisis Técnico',
  'detail.rsi': 'RSI (14)',
  'detail.macdSignal': 'Señal MACD',
  'detail.bollingerBands': 'Bandas de Bollinger',
  'detail.support': 'Soporte',
  'detail.resistance': 'Resistencia',
  'detail.ma50': 'MA 50 Días',
  'detail.ma200': 'MA 200 Días',
  'detail.adx': 'ADX',
  'detail.stochastic': 'Estocástico',
  'detail.atr': 'ATR',

  // Fundamentals
  'detail.fundamentalData': 'Datos Fundamentales',
  'detail.pe': 'Ratio PER',
  'detail.dividendYield': 'Rend. Dividendo',
  'detail.roe': 'ROE',
  'detail.roa': 'ROA',

  // Trade setup
  'detail.tradeSetup': 'Configuración de Operación',
  'detail.entry': 'Precio de Entrada',
  'detail.stopLoss': 'Stop Loss',
  'detail.takeProfit': 'Take Profit',
  'detail.riskReward': 'Riesgo / Recompensa',

  // AI
  'detail.aiAnalysis': 'Análisis IA',
  'detail.confidence': 'Puntuación de Confianza',

  // Signal / risk (detail-specific variants)
  'detail.overbought': 'Sobrecomprado',
  'detail.oversold': 'Sobrevendido',

  // Chart types
  'detail.candlestick': 'Vela',
  'detail.line': 'Línea',
  'detail.upper': 'Superior',
  'detail.lower': 'Inferior',

  // Loading / error
  'detail.loading': 'Cargando datos de la acción...',
  'detail.error': 'Error al cargar datos de la acción',
  'detail.notFound': 'Acción no encontrada',
  'detail.goBack': 'Volver',

  // Price details
  'detail.priceDetails': 'Detalles de Precio',
  'detail.open': 'Apertura',
  'detail.dayHigh': 'Máximo',
  'detail.dayLow': 'Mínimo',
  'detail.close': 'Cierre',
  'detail.volume': 'Volumen',
  'detail.prevClose': 'Cierre Anterior',
  'detail.publishedAt': 'Publicado',
  'detail.validUntil': 'Válido Hasta',

  // Level 1 tabs & sections
  'detail.overview': 'Resumen',
  'detail.financials': 'Finanzas',
  'detail.technical': 'Técnico',
  'detail.comparison': 'Comparar',
  'detail.scorecard': 'Panel de Evaluación',
  'detail.priceChart': 'Gráfico de Precios',
  'detail.period1D': '1D',
  'detail.period1W': '1S',
  'detail.period1M': '1M',
  'detail.period3M': '3M',
  'detail.sma20': 'SMA 20',
  'detail.sma50': 'SMA 50',

  // Financial statements
  'detail.incomeStatement': 'Estado de Resultados',
  'detail.balanceSheet': 'Balance General',
  'detail.cashFlow': 'Flujo de Efectivo',
  'detail.revenue': 'Ingresos',
  'detail.grossProfit': 'Beneficio Bruto',
  'detail.operatingIncome': 'Ingreso Operativo',
  'detail.netIncome': 'Beneficio Neto',
  'detail.totalAssets': 'Total de Activos',
  'detail.totalLiabilities': 'Total de Pasivos',
  'detail.totalEquity': 'Capital Total',
  'detail.cash': 'Efectivo y Equivalentes',
  'detail.totalDebt': 'Deuda Total',
  'detail.operatingCF': 'Flujo de Efectivo Operativo',
  'detail.capEx': 'Gasto de Capital',
  'detail.freeCashFlow': 'Flujo de Efectivo Libre',

  // Peers
  'detail.addSymbol': 'Agregar Símbolo',
  'detail.noPeers': 'No hay datos de empresas similares disponibles',
  'detail.peersList': 'Empresas del Sector',
  'detail.fiscalYear': 'Año Fiscal',
  'detail.noFinancialData': 'No hay datos financieros disponibles',

  // Analyst
  'detail.analystRating': 'Calificación de Analistas',
  'detail.priceTarget': 'Precio Objetivo',
  'detail.targetLow': 'Objetivo Bajo',
  'detail.targetMedian': 'Objetivo Mediano',
  'detail.targetHigh': 'Objetivo Alto',
  'detail.fairValue': 'Valor Justo',
  'detail.vsCurrent': 'vs Actual',
  'detail.direction': 'Dirección',
  'detail.long': 'Largo',
  'detail.short': 'Corto',
  'detail.wait': 'Esperar',
  'detail.beta': 'Beta',
  'detail.weekRange52': 'Rango de 52 Semanas',

  // Margins & ratios
  'detail.grossMargin': 'Margen Bruto',
  'detail.operatingMargin': 'Margen Operativo',
  'detail.netMargin': 'Margen Neto',
  'detail.debtToEquity': 'Deuda/Capital',
  'detail.currentRatio': 'Ratio de Liquidez',

  // Scores
  'detail.technicalScore': 'Punt. Técnico',
  'detail.fundamentalScore': 'Punt. Fundamental',
  'detail.extreme': 'Extremo',

  // Chart
  'detail.noChartData': 'No hay datos de gráfico disponibles',
  'detail.loadingComparison': 'Cargando comparación...',

  // Level 2 tabs
  'detail.insights': 'Perspectivas',
  'detail.tools': 'Herramientas',
  'detail.sentimentAnalysis': 'Análisis de Sentimiento',
  'detail.aiRecommendation': 'Recomendación IA',
  'detail.swotAnalysis': 'Análisis DAFO',
  'detail.fairValueCalc': 'Calculadora de Valor Justo',
  'detail.paperTrading': 'Simulación de Trading',
  'detail.smartAlerts': 'Alertas Inteligentes',
  'detail.sectorAnalysis': 'Análisis Sectorial',

  // ════════════════════════════════════════════════════════════════
  // ── Screener (ScreenerClient) ──
  // ════════════════════════════════════════════════════════════════

  'screener.title': 'Escáner de Acciones',
  'screener.subtitle': 'Escanee acciones por señal, sector, capitalización de mercado y más',
  'screener.marketType': 'Mercado',
  'screener.peRange': 'Rango PER',
  'screener.all': 'Todos',
  'screener.neutral': 'Neutral',
  'screener.reset': 'Restablecer',
  'screener.results': 'Resultados',
  'screener.noResults': 'No hay acciones que coincidan con sus filtros',
  'screener.price': 'Precio',
  'screener.change': 'Cambio %',
  'screener.pe': 'PER',
  'screener.page': 'Página',
  'screener.of': 'de',
  'screener.symbol': 'Símbolo',
  'screener.name': 'Nombre',
  'screener.sectorCol': 'Sector',
  'screener.marketCapCol': 'Cap. Mercado',
  'screener.sortBy': 'Ordenar por',
  'screener.backToAnalysis': '← Volver a Análisis de Acciones',
};

export default es;
