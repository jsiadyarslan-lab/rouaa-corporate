'use client';

// ─── Stock Analysis Main Page Client ──────────────────────────────
// Comprehensive stock analysis page with 5 tabs:
// 1. Today's Analyses (analysis cards grid)
// 2. Most Active Stocks (table)
// 3. Company Profile (search + fundamentals)
// 4. Compare Stocks (multi-stock comparison)
// 5. AI Analysis (Groq-powered chat)
// Shared across all locales (EN/AR/FR).

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@/lib/locale';
import { getLocalePath, formatTimeAgoLocale, translateSectorToLocale } from '@/lib/locale';
import { sanitizeMarkdown, extractCleanCompanyName, extractShortName, formatMarketCap as _fmtMC, formatVolume as _fmtVol } from '@/lib/string-utils';
// V1042: Rouaa Assistant integration for AI analysis
import { askAssistant } from '@/lib/assistant/global-bridge';

// ── Types ──

type TabId = 'today' | 'active' | 'profile' | 'compare' | 'tabAI';

interface AnalysisItem {
  id: string;
  symbol: string;
  slug?: string;
  title: string;
  summary: string;
  locale: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: string;
  marketType: string;
  tradeSetup: any;
  publishedAt: string;
  validUntil: string;
  createdAt: string;
  volume?: string | null;
  marketCap?: string | null;
  sector?: string | null;
  // New fields from API (Phase 1 fix)
  effectiveSector?: string | null;
  effectiveMarketType?: string | null;
  company?: {
    name?: string;
    nameAr?: string;
    nameFr?: string;
    sector?: string | null;
    logoUrl?: string | null;
    country?: string | null;
  } | null;
}

interface ActiveStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string | null;
  marketCap: string | null;
  sector: string;
}

interface SearchSuggestion {
  symbol: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  analysisData?: any; // Structured data from analyze-stock API
}

// ── Locale Labels ──

const LABELS: Record<string, Record<string, string>> = {
  ar: {
    pageTitle: 'تحليل الأسهم',
    pageDesc: 'تحليلات شاملة مدعومة بالذكاء الاصطناعي، أفضل الأسهم أداءً، نظرة على القطاعات، وأدوات مقارنة لاتخاذ قرارات استثمارية ذكية',
    tabToday: 'تحليلات اليوم',
    tabActive: 'الأسهم الأكثر نشاطاً',
    tabProfile: 'ملف الشركة',
    tabCompare: 'مقارنة الأسهم',
    tabAI: 'تحليل AI',
    // Today tab
    publishedToday: 'منشور اليوم',
    analysisCount: 'تحليل',
    signal: 'الإشارة',
    bullish: 'صاعد',
    bearish: 'هابط',
    neutral: 'محايد',
    confidence: 'الثقة',
    riskLevel: 'مستوى المخاطر',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    readMore: 'اقرأ المزيد',
    noAnalyses: 'لا توجد تحليلات متاحة حالياً',
    noAnalysesDesc: 'سيتم نشر تحليلات جديدة قريباً. تحقق لاحقاً.',
    // Active tab
    colSymbol: 'الرمز',
    colName: 'الاسم',
    colPrice: 'السعر',
    colChange: 'التغيير',
    colVolume: 'الحجم',
    colMarketCap: 'القيمة السوقية',
    colSector: 'القطاع',
    // Profile tab
    searchPlaceholder: 'ابحث برمز السهم (مثال: AAPL)...',
    searchBtn: 'بحث',
    companyProfile: 'ملف الشركة',
    fundamentals: 'البيانات الأساسية',
    pe: 'م/ر',
    eps: 'ربحية السهم',
    marketCap: 'القيمة السوقية',
    dividend: 'عائد التوزيعات',
    sector: 'القطاع',
    exchange: 'البورصة',
    industry: 'الصناعة',
    country: 'الدولة',
    technicals: 'المؤشرات الفنية',
    rsi: 'RSI',
    macd: 'MACD',
    signalStrength: 'قوة الإشارة',
    currentPrice: 'السعر الحالي',
    noData: 'لا توجد بيانات متاحة',
    enterSymbol: 'أدخل رمز السهم للبحث',
    // Compare tab
    addSymbol: 'أضف رمز سهم',
    compareBtn: 'مقارنة',
    removeSymbol: 'إزالة',
    comparing: 'مقارنة',
    stocks: 'أسهم',
    addMoreStocks: 'أضف المزيد من الأسهم للمقارنة (حتى 4)',
    // AI tab
    aiPlaceholder: 'اسأل عن الأسهم...',
    aiBestGrowth: 'أفضل أسهم النمو',
    aiAnalyzeStock: 'تحليل سهم',
    aiAnalyzeStockPlaceholder: 'أدخل رمز السهم (مثل: TSLA)...',
    aiCompareMSFTGOOGL: 'مقارنة MSFT و GOOGL',
    aiPersonalized: 'أي سهم تنصحني؟',
    aiAnalyzeBtn: 'حلّل',
    aiThinking: 'يفكر...',
    aiError: 'حدث خطأ في التحليل',
    aiUnavailable: 'خدمة AI غير متاحة حالياً',
    rouaaAssistantAnalyze: '🤖 تحليل بواسطة مساعد رؤى',
    // Search
    searchStocks: 'بحث الأسهم...',
    noResults: 'لا توجد نتائج',
    // Pagination
    pageOf: 'صفحة {0} من {1}',
    loadMore: 'تحميل المزيد',
    // Filters
    filters: 'الفلاتر',
    showFilters: 'عرض الفلاتر',
    hideFilters: 'إخفاء الفلاتر',
    filterSector: 'القطاع',
    filterMarket: 'نوع السوق',
    filterAllSectors: 'جميع القطاعات',
    filterAllMarkets: 'جميع الأسواق',
    // Watchlist
    watchlist: 'مفضلتي',
    // Common
    loading: 'جاري التحميل...',
    error: 'فشل تحميل البيانات',
    retry: 'إعادة المحاولة',
    disclaimer: 'هذا المحتوى مُولّد بالذكاء الاصطناعي لأغراض إعلامية فقط. ليس نصيحة مالية. الأداء السابق لا يضمن النتائج المستقبلية. استشر مستشاراً مالياً مرخصاً قبل اتخاذ أي قرارات استثمارية.',
    filterAll: 'الكل',
    filterBullish: 'صاعد',
    filterBearish: 'هابط',
    filterNeutral: 'محايد',
  },
  en: {
    pageTitle: 'Stock Analysis',
    pageDesc: 'AI-powered comprehensive analysis, top performers, sector insights, and comparison tools for smart investing decisions',
    tabToday: "Today's Analyses",
    tabActive: 'Most Active Stocks',
    tabProfile: 'Company Profile',
    tabCompare: 'Compare Stocks',
    tabAI: 'AI Analysis',
    publishedToday: 'Published Today',
    analysisCount: 'analyses',
    signal: 'Signal',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    confidence: 'Confidence',
    riskLevel: 'Risk Level',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    readMore: 'Read More',
    noAnalyses: 'No analyses available',
    noAnalysesDesc: 'New analyses will be published soon. Check back later.',
    colSymbol: 'Symbol',
    colName: 'Name',
    colPrice: 'Price',
    colChange: 'Change',
    colVolume: 'Volume',
    colMarketCap: 'Market Cap',
    colSector: 'Sector',
    searchPlaceholder: 'Search by symbol (e.g. AAPL)...',
    searchBtn: 'Search',
    companyProfile: 'Company Profile',
    fundamentals: 'Fundamentals',
    pe: 'P/E',
    eps: 'EPS',
    marketCap: 'Market Cap',
    dividend: 'Div. Yield',
    sector: 'Sector',
    exchange: 'Exchange',
    industry: 'Industry',
    country: 'Country',
    technicals: 'Technical Indicators',
    rsi: 'RSI',
    macd: 'MACD',
    signalStrength: 'Signal Strength',
    currentPrice: 'Current Price',
    noData: 'No data available',
    enterSymbol: 'Enter a stock symbol to search',
    addSymbol: 'Add symbol',
    compareBtn: 'Compare',
    removeSymbol: 'Remove',
    comparing: 'Comparing',
    stocks: 'stocks',
    addMoreStocks: 'Add more stocks to compare (up to 4)',
    aiPlaceholder: 'Ask about stocks...',
    aiBestGrowth: 'Best growth stocks',
    aiAnalyzeStock: 'Analyze Stock',
    aiAnalyzeStockPlaceholder: 'Enter symbol (e.g. TSLA)...',
    aiCompareMSFTGOOGL: 'Compare MSFT vs GOOGL',
    aiPersonalized: 'Which stock for me?',
    aiAnalyzeBtn: 'Analyze',
    aiThinking: 'Thinking...',
    aiError: 'An error occurred during analysis',
    aiUnavailable: 'AI service is currently unavailable',
    rouaaAssistantAnalyze: '🤖 Analyze with Rouaa Assistant',
    searchStocks: 'Search stocks...',
    noResults: 'No results',
    pageOf: 'Page {0} of {1}',
    loadMore: 'Load More',
    filters: 'Filters',
    showFilters: 'Show Filters',
    hideFilters: 'Hide Filters',
    filterSector: 'Sector',
    filterMarket: 'Market Type',
    filterAllSectors: 'All Sectors',
    filterAllMarkets: 'All Markets',
    watchlist: 'My Watchlist',
    loading: 'Loading...',
    error: 'Failed to load data',
    retry: 'Retry',
    disclaimer: 'This content is AI-generated for informational purposes only. Not financial advice. Past performance does not guarantee future results. Consult a licensed financial advisor before making investment decisions.',
    filterAll: 'All',
    filterBullish: 'Bullish',
    filterBearish: 'Bearish',
    filterNeutral: 'Neutral',
  },
  fr: {
    pageTitle: 'Analyse Actions',
    pageDesc: 'Analyses complètes alimentées par l\'IA, meilleurs performeurs, aperçus sectoriels et outils de comparaison pour des décisions d\'investissement éclairées',
    tabToday: 'Analyses du Jour',
    tabActive: 'Actions les Plus Actives',
    tabProfile: 'Profil Entreprise',
    tabCompare: 'Comparer les Actions',
    tabAI: 'Analyse IA',
    publishedToday: 'Publié Aujourd\'hui',
    analysisCount: 'analyses',
    signal: 'Signal',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    confidence: 'Confiance',
    riskLevel: 'Niveau de Risque',
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    readMore: 'Lire la Suite',
    noAnalyses: 'Aucune analyse disponible',
    noAnalysesDesc: 'De nouvelles analyses seront publiées bientôt. Revenez plus tard.',
    colSymbol: 'Symbole',
    colName: 'Nom',
    colPrice: 'Prix',
    colChange: 'Variation',
    colVolume: 'Volume',
    colMarketCap: 'Cap. Boursière',
    colSector: 'Secteur',
    searchPlaceholder: 'Rechercher par symbole (ex: AAPL)...',
    searchBtn: 'Rechercher',
    companyProfile: 'Profil de l\'Entreprise',
    fundamentals: 'Fondamentaux',
    pe: 'P/E',
    eps: 'BPA',
    marketCap: 'Cap. Boursière',
    dividend: 'Rend. Dividende',
    sector: 'Secteur',
    exchange: 'Bourse',
    industry: 'Industrie',
    country: 'Pays',
    technicals: 'Indicateurs Techniques',
    rsi: 'RSI',
    macd: 'MACD',
    signalStrength: 'Force du Signal',
    currentPrice: 'Prix Actuel',
    noData: 'Aucune donnée disponible',
    enterSymbol: 'Entrez un symbole pour rechercher',
    addSymbol: 'Ajouter symbole',
    compareBtn: 'Comparer',
    removeSymbol: 'Retirer',
    comparing: 'Comparaison',
    stocks: 'actions',
    addMoreStocks: 'Ajoutez plus d\'actions à comparer (max 4)',
    aiPlaceholder: 'Posez une question sur les actions...',
    aiBestGrowth: 'Meilleures actions de croissance',
    aiAnalyzeStock: 'Analyser une action',
    aiAnalyzeStockPlaceholder: 'Entrez le symbole (ex: TSLA)...',
    aiCompareMSFTGOOGL: 'Comparer MSFT vs GOOGL',
    aiPersonalized: 'Quelle action pour moi?',
    aiAnalyzeBtn: 'Analyser',
    aiThinking: 'Réflexion...',
    aiError: 'Une erreur est survenue lors de l\'analyse',
    aiUnavailable: 'Le service IA est actuellement indisponible',
    rouaaAssistantAnalyze: '🤖 Analyser avec Assistant Rouaa',
    searchStocks: 'Rechercher des actions...',
    noResults: 'Aucun résultat',
    pageOf: 'Page {0} sur {1}',
    loadMore: 'Charger plus',
    filters: 'Filtres',
    showFilters: 'Afficher les filtres',
    hideFilters: 'Masquer les filtres',
    filterSector: 'Secteur',
    filterMarket: 'Type de marché',
    filterAllSectors: 'Tous les secteurs',
    filterAllMarkets: 'Tous les marchés',
    watchlist: 'Ma Watchlist',
    loading: 'Chargement...',
    error: 'Échec du chargement',
    retry: 'Réessayer',
    disclaimer: 'Ce contenu est généré par IA à titre informatif uniquement. Non un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Consultez un conseiller financier agréé avant de prendre des décisions d\'investissement.',
    filterAll: 'Tous',
    filterBullish: 'Haussier',
    filterBearish: 'Baissier',
    filterNeutral: 'Neutre',
  },
  tr: {
    pageTitle: 'Hisse Analizi',
    pageDesc: 'Yapay zeka destekli kapsamlı analizler, en iyi performans gösterenler, sektör öngörüleri ve akıllı yatırım kararları için karşılaştırma araçları',
    tabToday: 'Günün Analizleri',
    tabActive: 'En Aktif Hisseler',
    tabProfile: 'Şirket Profili',
    tabCompare: 'Hisse Karşılaştırma',
    tabAI: 'AI Analizi',
    publishedToday: 'Bugün Yayınlanan',
    analysisCount: 'analiz',
    signal: 'Sinyal',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    neutral: 'Nötr',
    confidence: 'Güven',
    riskLevel: 'Risk Seviyesi',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    readMore: 'Devamını Oku',
    noAnalyses: 'Analiz mevcut değil',
    noAnalysesDesc: 'Yeni analizler yakında yayınlanacak. Daha sonra tekrar kontrol edin.',
    colSymbol: 'Sembol',
    colName: 'Ad',
    colPrice: 'Fiyat',
    colChange: 'Değişim',
    colVolume: 'Hacim',
    colMarketCap: 'Piy. Değeri',
    colSector: 'Sektör',
    searchPlaceholder: 'Sembol ile ara (örn: AAPL)...',
    searchBtn: 'Ara',
    companyProfile: 'Şirket Profili',
    fundamentals: 'Temel Veriler',
    pe: 'F/K',
    eps: 'Hisse Başına Kazanç',
    marketCap: 'Piyasa Değeri',
    dividend: 'Tem. Getiri',
    sector: 'Sektör',
    exchange: 'Borsa',
    industry: 'Sektör',
    country: 'Ülke',
    technicals: 'Teknik Göstergeler',
    rsi: 'RSI',
    macd: 'MACD',
    signalStrength: 'Sinyal Gücü',
    currentPrice: 'Mevcut Fiyat',
    noData: 'Veri mevcut değil',
    enterSymbol: 'Aramak için hisse sembolü girin',
    addSymbol: 'Sembol ekle',
    compareBtn: 'Karşılaştır',
    removeSymbol: 'Kaldır',
    comparing: 'Karşılaştırma',
    stocks: 'hisse',
    addMoreStocks: 'Karşılaştırmak için daha fazla hisse ekleyin (maks. 4)',
    aiPlaceholder: 'Hisseler hakkında soru sorun...',
    aiBestGrowth: 'En iyi büyüme hisseleri',
    aiAnalyzeStock: 'Hisse Analiz Et',
    aiAnalyzeStockPlaceholder: 'Sembol girin (örn: TSLA)...',
    aiCompareMSFTGOOGL: 'MSFT ve GOOGL Karşılaştır',
    aiPersonalized: 'Benim için hangi hisse?',
    aiAnalyzeBtn: 'Analiz Et',
    aiThinking: 'Düşünüyor...',
    aiError: 'Analiz sırasında bir hata oluştu',
    aiUnavailable: 'AI hizmeti şu anda mevcut değil',
    rouaaAssistantAnalyze: '🤖 Rouaa Asistanı ile Analiz Et',
    searchStocks: 'Hisse ara...',
    noResults: 'Sonuç yok',
    pageOf: 'Sayfa {0} / {1}',
    loadMore: 'Daha Fazla Yükle',
    filters: 'Filtreler',
    showFilters: 'Filtreleri Göster',
    hideFilters: 'Filtreleri Gizle',
    filterSector: 'Sektör',
    filterMarket: 'Piyasa Türü',
    filterAllSectors: 'Tüm Sektörler',
    filterAllMarkets: 'Tüm Piyasalar',
    watchlist: 'İzleme Listem',
    loading: 'Yükleniyor...',
    error: 'Veri yüklenemedi',
    retry: 'Tekrar Dene',
    disclaimer: 'Bu içerik yalnızca bilgilendirme amacıyla AI tarafından oluşturulmuştur. Finansal tavsiye değildir. Geçmiş performans gelecek sonuçları garanti etmez. Yatırım kararları vermeden önce lisanslı bir finansal danışmana başvurun.',
    filterAll: 'Tümü',
    filterBullish: 'Yükseliş',
    filterBearish: 'Düşüş',
    filterNeutral: 'Nötr',
  },
  es: {
    pageTitle: 'Análisis de Acciones',
    pageDesc: 'Análisis integrales con IA, mejores rendimiento, perspectivas sectoriales y herramientas de comparación para decisiones de inversión inteligentes',
    tabToday: 'Análisis de Hoy',
    tabActive: 'Más Activas',
    tabProfile: 'Perfil de Empresa',
    tabCompare: 'Comparar Acciones',
    tabAI: 'Análisis IA',
    publishedToday: 'Publicado Hoy',
    analysisCount: 'análisis',
    signal: 'Señal',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    confidence: 'Confianza',
    riskLevel: 'Nivel de Riesgo',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    readMore: 'Leer Más',
    noAnalyses: 'No hay análisis disponibles',
    noAnalysesDesc: 'Se publicarán nuevos análisis pronto. Vuelve más tarde.',
    colSymbol: 'Símbolo',
    colName: 'Nombre',
    colPrice: 'Precio',
    colChange: 'Cambio',
    colVolume: 'Volumen',
    colMarketCap: 'Cap. de Mercado',
    colSector: 'Sector',
    searchPlaceholder: 'Buscar por símbolo (ej: AAPL)...',
    searchBtn: 'Buscar',
    companyProfile: 'Perfil de Empresa',
    fundamentals: 'Fundamentales',
    pe: 'Ratio P/E',
    eps: 'BPA',
    marketCap: 'Cap. de Mercado',
    dividend: 'Rend. Dividendo',
    sector: 'Sector',
    exchange: 'Bolsa',
    industry: 'Industria',
    country: 'País',
    technicals: 'Indicadores Técnicos',
    rsi: 'RSI',
    macd: 'MACD',
    signalStrength: 'Fuerza de Señal',
    currentPrice: 'Precio Actual',
    noData: 'No hay datos disponibles',
    enterSymbol: 'Ingrese un símbolo para buscar',
    addSymbol: 'Agregar símbolo',
    compareBtn: 'Comparar',
    removeSymbol: 'Eliminar',
    comparing: 'Comparando',
    stocks: 'acciones',
    addMoreStocks: 'Agregue más acciones para comparar (máx. 4)',
    aiPlaceholder: 'Pregunte sobre acciones...',
    aiBestGrowth: 'Mejores acciones de crecimiento',
    aiAnalyzeStock: 'Analizar Acción',
    aiAnalyzeStockPlaceholder: 'Ingrese símbolo (ej: TSLA)...',
    aiCompareMSFTGOOGL: 'Comparar MSFT vs GOOGL',
    aiPersonalized: '¿Qué acción para mí?',
    aiAnalyzeBtn: 'Analizar',
    aiThinking: 'Pensando...',
    aiError: 'Ocurrió un error durante el análisis',
    aiUnavailable: 'El servicio de IA no está disponible actualmente',
    rouaaAssistantAnalyze: '🤖 Analizar con Asistente Rouaa',
    searchStocks: 'Buscar acciones...',
    noResults: 'No se encontraron resultados',
    pageOf: 'Página {0} de {1}',
    loadMore: 'Cargar Más',
    filters: 'Filtros',
    showFilters: 'Mostrar Filtros',
    hideFilters: 'Ocultar Filtros',
    filterSector: 'Sector',
    filterMarket: 'Tipo de Mercado',
    filterAllSectors: 'Todos los Sectores',
    filterAllMarkets: 'Todos los Mercados',
    watchlist: 'Mi Lista de Seguimiento',
    loading: 'Cargando...',
    error: 'Error al cargar datos',
    retry: 'Reintentar',
    disclaimer: 'Este contenido es generado por IA con fines informativos únicamente. No es asesoramiento financiero. El rendimiento pasado no garantiza resultados futuros. Consulte a un asesor financiero con licencia antes de tomar decisiones de inversión.',
    filterAll: 'Todo',
    filterBullish: 'Alcista',
    filterBearish: 'Bajista',
    filterNeutral: 'Neutral',
  },
};

// ── Signal Colors ──

const SIGNAL_CONFIG: Record<string, { color: string; bg: string; border: string; leftBorder: string }> = {
  bullish: { color: 'var(--bull)', bg: 'var(--bull2)', border: 'rgba(34,197,94,0.3)', leftBorder: '#22c55e' },
  bearish: { color: 'var(--bear)', bg: 'var(--bear2)', border: 'rgba(239,83,80,0.3)', leftBorder: '#ef5350' },
  neutral: { color: 'var(--gold)', bg: 'var(--gold2)', border: 'rgba(255,184,0,0.3)', leftBorder: '#ffb800' },
};

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: 'var(--bull)', bg: 'var(--bull2)' },
  medium: { color: 'var(--gold)', bg: 'var(--gold2)' },
  high: { color: 'var(--bear)', bg: 'var(--bear2)' },
};

const MARKET_TYPES = [
  { value: 'sp500', label: { ar: 'إس آند بي 500', en: 'S&P 500', fr: 'S&P 500', tr: 'S&P 500' } },
  { value: 'cac40', label: { ar: 'CAC 40', en: 'CAC 40', fr: 'CAC 40', tr: 'CAC 40' } },
  { value: 'tadawul', label: { ar: 'تداول', en: 'Tadawul', fr: 'Tadawul', tr: 'Tadawul' } },
  { value: 'dax', label: { ar: 'داكس', en: 'DAX', fr: 'DAX', tr: 'DAX' } },
  { value: 'ftse', label: { ar: 'فوتسي', en: 'FTSE 100', fr: 'FTSE 100', tr: 'FTSE 100' } },
  { value: 'nikkei', label: { ar: 'نيكي', en: 'Nikkei 225', fr: 'Nikkei 225', tr: 'Nikkei 225' } },
];

// ── Helpers ──

// extractCompanyName is now imported from @/lib/string-utils as extractCleanCompanyName
// This local wrapper keeps backward compatibility while using the improved sanitizer
function extractCompanyName(rawTitle: string, symbol: string): string {
  return extractCleanCompanyName(rawTitle, symbol);
}

function formatMarketCap(val: number | null | undefined): string { return _fmtMC(val); }
function formatVolume(val: number | null | undefined): string { return _fmtVol(val); }

function getWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('stock-watchlist') || '[]');
  } catch { return []; }
}

function setWatchlist(symbols: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('stock-watchlist', JSON.stringify(symbols));
  } catch { /* ignore */ }
}

// ── Confidence Bar Component ──

function ConfidenceBar({ value, locale }: { value: number; locale: string }) {
  const t = LABELS[locale] || LABELS.en;
  const barColor = value >= 70 ? 'var(--bull)' : value >= 40 ? 'var(--gold)' : 'var(--bear)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{t.confidence}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
          {value}%
        </span>
      </div>
      <div className="confidence-bar" style={{ width: '100%' }}>
        <div className="confidence-fill" style={{ width: `${value}%`, background: barColor }} />
      </div>
    </div>
  );
}

// ── Skeleton Loader ──

function AnalysisSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card" style={{ padding: 20, borderRadius: 12 }}>
          <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: '45%', marginBottom: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 6, width: '100%', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
      ))}
    </div>
  );
}

// ── Ticker Tape Component ──

function TickerTape({ analyses, locale }: { analyses: AnalysisItem[]; locale: string }) {
  const t = LABELS[locale] || LABELS.en;
  const items = analyses.slice(0, 20);
  if (items.length === 0) return null;

  const tickerItems = [...items, ...items]; // Duplicate for seamless scroll

  return (
    <div
      style={{
        overflow: 'hidden',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '6px 0',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          animation: ticker 40s linear infinite;
          width: max-content;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track">
        {tickerItems.map((item, idx) => {
          const isUp = item.changePercent >= 0;
          return (
            <div
              key={`${item.symbol}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 16px',
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{item.symbol}</span>
              <span style={{ color: 'var(--text2)' }}>${item.price?.toFixed(2) ?? '—'}</span>
              <span style={{ color: isUp ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>
                {isUp ? '+' : ''}{item.changePercent?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sector Heatmap Component ──

function SectorHeatmap({ analyses, locale, onSectorClick }: { analyses: AnalysisItem[]; locale: string; onSectorClick: (sector: string) => void }) {
  const t = LABELS[locale] || LABELS.en;

  const sectorData = useMemo(() => {
    const map: Record<string, { count: number; totalChange: number; signals: Record<string, number> }> = {};
    for (const a of analyses) {
      // Use effectiveSector (company profile) instead of marketType
      const sec = a.effectiveSector || a.sector || a.company?.sector || a.marketType || 'Other';
      if (!map[sec]) map[sec] = { count: 0, totalChange: 0, signals: {} };
      map[sec].count++;
      map[sec].totalChange += a.changePercent || 0;
      const sig = a.overallSignal || 'neutral';
      map[sec].signals[sig] = (map[sec].signals[sig] || 0) + 1;
    }
    return Object.entries(map).map(([sector, data]) => ({
      sector,
      count: data.count,
      avgChange: data.count > 0 ? data.totalChange / data.count : 0,
      dominantSignal: Object.entries(data.signals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral',
    })).sort((a, b) => b.count - a.count);
  }, [analyses]);

  if (sectorData.length === 0) return null;

  const getColor = (signal: string, avgChange: number) => {
    if (signal === 'bullish' || avgChange > 1) return 'rgba(34,197,94,0.25)';
    if (signal === 'bearish' || avgChange < -1) return 'rgba(239,83,80,0.25)';
    return 'rgba(255,184,0,0.2)';
  };

  const getBorderColor = (signal: string) => {
    if (signal === 'bullish') return 'rgba(34,197,94,0.5)';
    if (signal === 'bearish') return 'rgba(239,83,80,0.5)';
    return 'rgba(255,184,0,0.4)';
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {t.filterSector}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {sectorData.map(s => (
          <div
            key={s.sector}
            onClick={() => onSectorClick(s.sector)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              background: getColor(s.dominantSignal, s.avgChange),
              border: `1px solid ${getBorderColor(s.dominantSignal)}`,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text2)',
              transition: 'all 0.15s ease',
              minWidth: Math.max(60, s.count * 10),
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'var(--text)' }}>{translateSectorToLocale(s.sector, locale as any)}</span>
            <span style={{ marginInlineStart: 4, color: s.avgChange >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
              {s.avgChange >= 0 ? '+' : ''}{s.avgChange.toFixed(1)}%
            </span>
            <span style={{ marginInlineStart: 4, color: 'var(--text4)', fontSize: 9 }}>({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

interface Props {
  locale: Locale;
}

export default function StockAnalysisClient({ locale }: Props) {
  const router = useRouter();
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  // ── State ──
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [signalFilter, setSignalFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');
  const [marketTypeFilter, setMarketTypeFilter] = useState('');

  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [searchSymbol, setSearchSymbol] = useState('');
  const [shouldSearchProfile, setShouldSearchProfile] = useState(false);

  // Compare state
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [compareInput, setCompareInput] = useState('');

  // AI tab state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiAnalyzeSymbol, setAiAnalyzeSymbol] = useState('');

  // ── Init ──
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    setWatchlist(getWatchlist());
  }, []);

  // ── Click outside search suggestions ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── React Query: Fetch analyses with pagination & filters ──
  const analysesQuery = useQuery({
    queryKey: ['stock-analyses', locale, page, signalFilter, sectorFilter, marketTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'list',
        locale,
        limit: '20',
        page: String(page),
      });
      if (signalFilter && signalFilter !== 'all') params.set('signal', signalFilter);
      if (sectorFilter) params.set('sector', sectorFilter);
      if (marketTypeFilter) params.set('marketType', marketTypeFilter);

      const res = await fetch(`/api/stock-analysis?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const analyses: AnalysisItem[] = analysesQuery.data?.analyses || [];
  const totalPages: number = analysesQuery.data?.totalPages || 1;
  const loading = analysesQuery.isLoading;
  const error = analysesQuery.error ? t.error : null;

  // ── React Query: Active stocks (50 stocks for Active tab) ──
  const activeStocksQuery = useQuery({
    queryKey: ['stock-active', locale],
    queryFn: async () => {
      const res = await fetch(`/api/stock-analysis?action=list&locale=${locale}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: activeTab === 'active',
  });

  const activeStocks: ActiveStock[] = useMemo(() => {
    const source = activeTab === 'active' && activeStocksQuery.data?.analyses
      ? activeStocksQuery.data.analyses
      : analyses;

    // Deduplicate by symbol — keep the first (most recent) entry for each symbol
    const seen = new Set<string>();
    const deduped = (source || []).filter((a: AnalysisItem) => {
      if (seen.has(a.symbol)) return false;
      seen.add(a.symbol);
      return true;
    });

    return deduped.map((a: AnalysisItem) => {
      // Use effectiveSector from API (company profile sector) instead of marketType
      const sectorName = a.effectiveSector || a.sector || a.company?.sector || null;
      // Format volume/marketCap: the DB may store them as strings or numbers
      const volNum = a.volume ? (typeof a.volume === 'number' ? a.volume : parseFloat(String(a.volume).replace(/[^0-9.-]/g, ''))) : null;
      const mcNum = a.marketCap ? (typeof a.marketCap === 'number' ? a.marketCap : parseFloat(String(a.marketCap).replace(/[^0-9.-]/g, ''))) : null;

      return {
        symbol: a.symbol,
        name: extractShortName(extractCleanCompanyName(a.title, a.symbol)),
        price: a.price,
        change: a.change,
        changePercent: a.changePercent,
        volume: volNum && !isNaN(volNum) ? formatVolume(volNum) : (a.volume || null),
        marketCap: mcNum && !isNaN(mcNum) ? formatMarketCap(mcNum) : (a.marketCap || null),
        sector: sectorName ? translateSectorToLocale(sectorName, locale as any) : '—',
      };
    });
  }, [analyses, activeTab, activeStocksQuery.data]);

  // ── React Query: Sectors list ──
  const sectorsQuery = useQuery({
    queryKey: ['stock-sectors', locale],
    queryFn: async () => {
      const res = await fetch(`/api/stock-analysis/sectors?locale=${locale}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const sectors: { sector: string; stockCount: number; avgChange: number }[] = sectorsQuery.data?.sectors || [];

  // ── React Query: Companies search (autocomplete) ──
  const companiesQuery = useQuery({
    queryKey: ['stock-companies', locale, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/stock-analysis?action=companies&search=${encodeURIComponent(searchQuery.trim())}&limit=5&locale=${locale}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!searchQuery && searchQuery.trim().length >= 2,
  });

  const searchSuggestions: SearchSuggestion[] = useMemo(() => {
    if (!companiesQuery.data?.companies) return [];
    return companiesQuery.data.companies.map((c: any) => ({
      symbol: c.symbol,
      name: locale === 'ar' ? (c.nameAr || c.name) : (locale === 'fr' ? (c.nameFr || c.name) : c.name),
      nameAr: c.nameAr,
      nameFr: c.nameFr,
    }));
  }, [companiesQuery.data, locale]);

  // Show suggestions when query results come in
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    } else if (searchQuery.trim().length < 2) {
      setShowSuggestions(false);
    }
  }, [searchSuggestions, searchQuery]);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionClick = useCallback((symbol: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    // Navigate to the stock detail page which works for ANY stock
    router.push(`${getLocalePath(locale)}/stock-analysis/${symbol}`);
  }, [locale, router]);

  const handleSuggestionAnalyze = useCallback((symbol: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowSuggestions(false);
    setSearchQuery('');
    // Switch to AI tab and set the symbol for analysis
    setActiveTab('tabAI');
    setAiAnalyzeSymbol(symbol);
  }, [locale]);

  // ── Watchlist toggle ──
  const toggleWatchlist = useCallback((symbol: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setWatchlist(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      return next;
    });
  }, []);

  useEffect(() => {
    if (watchlist.length > 0 || getWatchlist().length > 0) {
      setWatchlist(getWatchlist());
    }
  }, []);

  // ── React Query: Profile search ──
  const profileQuery = useQuery({
    queryKey: ['stock-profile', locale, searchSymbol],
    queryFn: async () => {
      const res = await fetch(`/api/stock-analysis/${encodeURIComponent(searchSymbol.trim().toUpperCase())}?locale=${locale}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('notFound');
        throw new Error('Failed');
      }
      return res.json();
    },
    enabled: shouldSearchProfile && !!searchSymbol.trim(),
  });

  const profileData = profileQuery.data ?? null;
  const profileLoading = profileQuery.isLoading && shouldSearchProfile;
  const profileError = profileQuery.error
    ? (profileQuery.error.message === 'notFound' ? t.noData : t.error)
    : null;

  const handleProfileSearch = useCallback(() => {
    if (!searchSymbol.trim()) return;
    setShouldSearchProfile(true);
  }, [searchSymbol]);

  // Reset shouldSearchProfile when searchSymbol changes
  useEffect(() => {
    setShouldSearchProfile(false);
  }, [searchSymbol]);

  // ── Compare state management ──
  const addCompareSymbol = useCallback(() => {
    const sym = compareInput.trim().toUpperCase();
    if (sym && !compareSymbols.includes(sym) && compareSymbols.length < 4) {
      setCompareSymbols(prev => [...prev, sym]);
      setCompareInput('');
    }
  }, [compareInput, compareSymbols]);

  const removeCompareSymbol = useCallback((sym: string) => {
    setCompareSymbols(prev => prev.filter(s => s !== sym));
  }, []);

  // ── React Query: Compare stocks ──
  const compareQuery = useQuery({
    queryKey: ['stock-compare', locale, ...compareSymbols],
    queryFn: async () => {
      // Use batch compare endpoint
      const res = await fetch(`/api/stock-analysis?action=compare&symbols=${compareSymbols.join(',')}&locale=${locale}`);
      if (res.ok) {
        const data = await res.json();
        if (data.comparisons && data.comparisons.length > 0) {
          return data.comparisons;
        }
      }
      // Fallback: individual fetch
      const results = await Promise.all(
        compareSymbols.map(async sym => {
          const r = await fetch(`/api/stock-analysis/${encodeURIComponent(sym)}?locale=${locale}`);
          if (!r.ok) return null;
          return r.json();
        })
      );
      return results.filter(Boolean);
    },
    enabled: compareSymbols.length >= 2,
  });

  const compareData: any[] = compareQuery.data ?? [];
  const compareLoading = compareQuery.isLoading;

  // ── React Query: AI Chat (useMutation) ──
  const aiMutation = useMutation({
    mutationFn: async ({ message, actionType }: { message: string; actionType?: string }) => {
      const userMsg = message.trim() || '';
      let body: any = { locale };
      if (actionType === 'find-best-stocks') {
        body.action = 'find-best-stocks';
        body.criteria = 'growth';
        body.count = 5;
      } else if (actionType === 'analyze-stock') {
        body.action = 'analyze-stock';
        // Extract symbol from the user message (e.g. "تحليل TSLA" or "Analyze AAPL")
        const symbolMatch = userMsg.match(/\b([A-Z]{1,5})\b/);
        body.symbol = symbolMatch ? symbolMatch[1] : userMsg.trim().toUpperCase();
      } else if (actionType === 'compare-stocks') {
        body.action = 'compare-stocks';
        body.symbols = ['MSFT', 'GOOGL'];
      } else if (actionType === 'personalized-recommendation') {
        body.action = 'personalized-recommendation';
        body.userQuestion = userMsg;
      } else {
        // Parse the user message to determine action
        const symbolMatch = userMsg.match(/\b([A-Z]{1,5})\b/);
        const compareMatch = userMsg.match(/compare\s+(\w+)\s+(?:vs|and|&)\s+(\w+)/i);
        const arCompareMatch = userMsg.match(/مقارنة\s+(\w+)\s+(?:و|بـ)\s+(\w+)/i);
        if (compareMatch) {
          body.action = 'compare-stocks';
          body.symbols = [compareMatch[1].toUpperCase(), compareMatch[2].toUpperCase()];
        } else if (arCompareMatch) {
          body.action = 'compare-stocks';
          body.symbols = [arCompareMatch[1].toUpperCase(), arCompareMatch[2].toUpperCase()];
        } else if (symbolMatch && userMsg.match(/analyz|analyse|تحليل|فحص|دراس/i)) {
          body.action = 'analyze-stock';
          body.symbol = symbolMatch[1];
        } else if (userMsg.match(/best|top|أفضل|meilleur/i)) {
          body.action = 'find-best-stocks';
          body.criteria = 'growth';
          body.count = 5;
        } else if (userMsg.match(/which|أي سهم|أنصح|نصيحة|recommend|advise|conseil|تنصح/i)) {
          // Personalized recommendation for questions like "which stock should I buy?"
          body.action = 'personalized-recommendation';
          body.userQuestion = userMsg;
        } else if (symbolMatch) {
          // If the message contains a stock symbol but no specific action keyword,
          // default to analyzing that stock (most common user intent)
          body.action = 'analyze-stock';
          body.symbol = symbolMatch[1];
        } else {
          body.action = 'find-best-stocks';
          body.criteria = 'growth';
          body.count = 5;
        }
      }

      const res = await fetch('/api/stock-analysis/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorMsg = t.aiError;
        try {
          const errData = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      let content = '';
      let analysisData: any = undefined;

      // ── Handle "find-best-stocks" response ──
      if (data.stocks && Array.isArray(data.stocks) && data.stocks.length > 0) {
        content = data.stocks.map((s: any, i: number) =>
          `${i + 1}. **${s.symbol}** — ${s.companyName}\n   Signal: ${s.signal} | Confidence: ${s.confidence}% | Target: ${s.priceTarget}\n   Risk: ${s.riskLevel || '—'} | ${s.timeframe || ''}\n   ${s.rationale || ''}`
        ).join('\n\n');
      }
      // ── Handle "find-best-stocks" with empty stocks but rawAnalysis ──
      else if (data.stocks && Array.isArray(data.stocks) && data.stocks.length === 0 && data.rawAnalysis) {
        content = data.rawAnalysis;
      }
      // ── Handle "analyze-stock" response (structured) ──
      else if (data.analysis && !data.analysis.rawText) {
        // Store the full structured data for the beautiful component
        analysisData = data.analysis;
        // Also create fallback text content
        const a = data.analysis;
        content = `**${a.symbol || ''} ${a.companyName || ''}**\n\n${a.executiveSummary || a.currentAssessment || ''}`;
      }
      // ── Handle "analyze-stock" with rawText fallback ──
      else if (data.analysis?.rawText) {
        content = data.analysis.rawText;
      }
      // ── Handle "compare-stocks" response (always { comparison: [...], winner?, rationale? }) ──
      else if (data.comparison) {
        const c = data.comparison;
        // API now normalizes to { comparison: [...], winner?, rationale? }
        if (c.comparison && Array.isArray(c.comparison) && c.comparison.length > 0) {
          content = c.comparison.map((s: any, i: number) =>
            `${i + 1}. **${s.symbol}** — ${s.companyName} (Score: ${s.score || '—'})\n   **Signal:** ${s.signal || '—'}\n   **Strengths:** ${(s.strengths || []).join(', ')}\n   **Weaknesses:** ${(s.weaknesses || []).join(', ')}\n   ${s.verdict || ''}`
          ).join('\n\n');
          if (c.winner) content += `\n\n🏆 **Winner: ${c.winner}** — ${c.rationale || ''}`;
        }
        // Handle rawText fallback
        else if (c.rawText) {
          content = c.rawText;
        }
        // Handle if comparison is somehow a flat array (defensive)
        else if (Array.isArray(c) && c.length > 0 && c[0]?.symbol) {
          content = c.map((s: any, i: number) =>
            `${i + 1}. **${s.symbol}** — ${s.companyName} (Score: ${s.score || '—'})\n   **Signal:** ${s.signal || '—'}\n   **Strengths:** ${(s.strengths || []).join(', ')}\n   **Weaknesses:** ${(s.weaknesses || []).join(', ')}\n   ${s.verdict || ''}`
          ).join('\n\n');
        }
        else {
          content = JSON.stringify(c, null, 2);
        }
      }
      // ── Handle sector analysis ──
      else if (data.sectorAnalysis) {
        const sa = data.sectorAnalysis;
        if (sa.rawText) {
          content = sa.rawText;
        } else {
          content = `**${sa.sector || ''}** — Outlook: ${sa.overallOutlook || ''} | Confidence: ${sa.confidence || ''}%`;
          if (sa.topStocks?.length) {
            content += '\n\n**Top Picks:**\n' + sa.topStocks.map((s: any) => `- **${s.symbol}** ${s.name}: ${s.signal} — ${s.reason}`).join('\n');
          }
          if (sa.keyDrivers?.length) content += '\n\n**Key Drivers:** ' + sa.keyDrivers.join(', ');
          if (sa.risks?.length) content += '\n**Risks:** ' + sa.risks.join(', ');
          if (sa.summary) content += '\n\n' + sa.summary;
        }
      }
      // ── Handle personalized recommendation ──
      else if (data.personalized) {
        const p = data.personalized;
        if (p.rawText) {
          content = p.rawText;
        } else if (p.needsMoreInfo) {
          // AI is asking follow-up questions — display them interactively
          content = p.friendlyMessage || '';
          if (p.questions && p.questions.length > 0) {
            content += '\n\n';
            p.questions.forEach((q: string, i: number) => {
              content += `${i + 1}. ${q}\n`;
            });
            content += '\n' + (locale === 'ar' ? '💡 أجب على هذه الأسئلة وسأقدم لك توصيات مخصصة!' : locale === 'fr' ? '💡 Répondez à ces questions et je vous donnerai des recommandations personnalisées!' : '💡 Answer these questions and I\'ll give you personalized recommendations!');
          }
        } else if (p.recommendations && p.recommendations.length > 0) {
          content = p.recommendations.map((r: any, i: number) =>
            `${i + 1}. **${r.symbol}** — ${r.companyName} (${r.sector || ''})\n   ${locale === 'ar' ? 'السعر الحالي' : 'Current Price'}: ${r.currentPrice || '—'} | ${locale === 'ar' ? 'الهدف' : 'Target'}: ${r.priceTarget || '—'}\n   **${locale === 'ar' ? 'الإشارة' : 'Signal'}:** ${r.signal || '—'} | **${locale === 'ar' ? 'الثقة' : 'Confidence'}:** ${r.confidence || '—'}% | **${locale === 'ar' ? 'المخاطرة' : 'Risk'}:** ${r.riskLevel || '—'}\n   ${locale === 'ar' ? '💡 لماذا لك:' : '💡 Why for you:'} ${r.whyForYou || r.rationale || ''}`
          ).join('\n\n');
          if (p.overallAdvice) {
            content += `\n\n**${locale === 'ar' ? 'نصيحة عامة' : locale === 'fr' ? 'Conseil général' : 'Overall Advice'}:** ${p.overallAdvice}`;
          }
          if (p.riskDisclaimer) {
            content += `\n\n⚠️ ${p.riskDisclaimer}`;
          }
        }
      }
      // ── Handle rawAnalysis at root level ──
      else if (data.rawAnalysis) {
        content = data.rawAnalysis;
      }
      // ── Fallback: show raw JSON ──
      else {
        content = JSON.stringify(data, null, 2);
      }

      // If content is still empty after all checks, show a generic message
      if (!content.trim()) {
        content = locale === 'ar' ? 'لم يتم الحصول على نتيجة. حاول مرة أخرى.' : locale === 'fr' ? 'Aucun résultat obtenu. Veuillez réessayer.' : 'No result obtained. Please try again.';
      }

      setAiMessages(prev => [...prev, { role: 'assistant', content, analysisData }]);
    },
    onError: (error: any) => {
      // Show the actual error message from the API if available
      const errMsg = error?.message || t.aiError;
      setAiMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errMsg}` }]);
    },
  });

  const aiLoading = aiMutation.isPending;

  // V1043: Route ALL AI analysis through the Rouaa Assistant (global floating widget)
  // The old /api/stock-analysis/groq endpoint was returning "AI analysis temporarily
  // unavailable" errors. Instead of fixing that endpoint, we now route every AI
  // button in this tab through the Rouaa Assistant — which is more capable
  // (real-time market data, multi-language, deep search) and already integrated
  // globally via src/lib/assistant/global-bridge.ts.
  const sendAIMessage = useCallback((message: string, actionType?: string) => {
    if (!message.trim() && !actionType) return;
    const userMsg = message.trim() || '';

    // Show the user's message in the local chat area for context
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    // Build a richer prompt based on the action type
    let prompt = userMsg;
    if (actionType === 'analyze-stock') {
      // userMsg is like "Analyze TSLA" — make it more comprehensive
      const symbol = userMsg.replace(/^(Analyze|Analyser|Analizar|Analiz Et|تحليل)\s+/i, '').trim();
      prompt = locale === 'ar' ? `حلل سهم ${symbol} بشكل شامل: الأساسيات، التحليل الفني، التوصيات، والمستقبل القريب` :
              locale === 'fr' ? `Analyse complète de l'action ${symbol} : fondamentaux, analyse technique, recommandations et perspectives` :
              locale === 'tr' ? `${symbol} hissesini kapsamlı şekilde analiz et: temel analiz, teknik analiz, tavsiyeler ve yakın gelecek` :
              locale === 'es' ? `Analiza la acción ${symbol} de forma completa: fundamentos, análisis técnico, recomendaciones y perspectivas` :
              `Analyze ${symbol} stock comprehensively: fundamentals, technical analysis, recommendations, and near-term outlook`;
    } else if (actionType === 'find-best-stocks') {
      prompt = locale === 'ar' ? 'ما هي أفضل أسهم النمو حالياً؟ قدم قائمة بأفضل 5 أسهم مع التوصيات والأسباب' :
              locale === 'fr' ? 'Quelles sont les meilleures actions de croissance actuellement ? Donne le top 5 avec recommandations et raisons' :
              locale === 'tr' ? 'Şu anki en iyi büyüme hisseleri neler? En iyi 5 hisseyi tavsiyeler ve nedenleriyle ver' :
              locale === 'es' ? '¿Cuáles son las mejores acciones de crecimiento actualmente? Da el top 5 con recomendaciones y razones' :
              'What are the best growth stocks right now? Give me the top 5 with recommendations and reasons';
    } else if (actionType === 'compare-stocks') {
      prompt = locale === 'ar' ? 'قارن بين سهمي MSFT و GOOGL: الأساسيات، الأداء، التقييم، والتوصية أيهما أفضل للاستثمار' :
              locale === 'fr' ? 'Compare les actions MSFT et GOOGL : fondamentaux, performance, valorisation, et recommandation laquelle est meilleure' :
              locale === 'tr' ? 'MSFT ve GOOGL hisselerini karşılaştır: temel analiz, performans, değerleme ve hangisi daha iyi投资 tavsiyesi' :
              locale === 'es' ? 'Compara las acciones MSFT y GOOGL: fundamentos, rendimiento, valoración y recomendación de cuál es mejor' :
              'Compare MSFT and GOOGL stocks: fundamentals, performance, valuation, and recommendation on which is better';
    } else if (actionType === 'personalized-recommendation') {
      prompt = locale === 'ar' ? 'أي سهم تنصحني أن أشتري؟ قدم توصية مخصصة مع شرح الأسباب ومستوى المخاطر' :
              locale === 'fr' ? 'Quelle action me conseillez-vous d\'acheter ? Donne une recommandation personnalisée avec les raisons et le niveau de risque' :
              locale === 'tr' ? 'Hangi hisseyi almamı önerirsin? Nedenleri ve risk seviyesiyle kişiselleştirilmiş tavsiye ver' :
              locale === 'es' ? '¿Qué acción me recomiendas comprar? Da una recomendación personalizada con razones y nivel de riesgo' :
              'Which stock should I buy? Give me a personalized recommendation with reasons and risk level';
    }

    // Show an informational message in the local chat area
    const infoMsg = locale === 'ar' ? '🔄 تم توجيه طلبك إلى مساعد رؤى. انظر إلى نافذة المساعد في الزاوية...' :
                    locale === 'fr' ? '🔄 Votre demande a été transmise à Assistant Rouaa. Regardez la fenêtre de l\'assistant...' :
                    locale === 'tr' ? '🔄 Talebiniz Rouaa Asistanına iletildi. Asistan penceresine bakın...' :
                    locale === 'es' ? '🔄 Tu solicitud ha sido enviada al Asistente Rouaa. Mira la ventana del asistente...' :
                    '🔄 Your request has been routed to Rouaa Assistant. Look at the assistant panel...';
    setAiMessages(prev => [...prev, { role: 'assistant', content: infoMsg }]);

    // Send to the global Rouaa Assistant (opens the floating panel + sends the prompt)
    askAssistant(prompt, { reportType: 'stock-analysis', deepSearch: true });
  }, [locale]);

  // ── Filtered analyses (with deduplication by symbol) ──
  const filteredAnalyses = useMemo(() => {
    let items = analyses;

    // Signal filter
    if (signalFilter === 'watchlist') {
      items = items.filter(a => watchlist.includes(a.symbol));
    } else if (signalFilter !== 'all') {
      items = items.filter(a => a.overallSignal === signalFilter);
    }

    // Sector filter (client-side backup for API filter)
    // Match both analysis.sector and company.sector (effectiveSector)
    if (sectorFilter) {
      items = items.filter(a => {
        const effectiveSector = a.effectiveSector || a.sector || a.company?.sector || null;
        return effectiveSector === sectorFilter;
      });
    }

    // Market type filter (client-side backup for API filter)
    if (marketTypeFilter) {
      items = items.filter(a => {
        const effectiveMarketType = a.effectiveMarketType || a.marketType || null;
        return effectiveMarketType === marketTypeFilter;
      });
    }

    // Deduplicate by symbol — keep the first (most recent) entry
    const seen = new Set<string>();
    return items.filter(a => {
      if (seen.has(a.symbol)) return false;
      seen.add(a.symbol);
      return true;
    });
  }, [analyses, signalFilter, watchlist, sectorFilter, marketTypeFilter]);

  // ── Helper: format number ──
  const fmt = (n: number, dec = 2) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // ── Signal label ──
  const signalLabel = (s: string) => {
    if (s === 'bullish') return t.bullish;
    if (s === 'bearish') return t.bearish;
    return t.neutral;
  };

  const riskLabel = (r: string) => {
    const rl = (r || '').toLowerCase();
    if (rl === 'low') return t.low;
    if (rl === 'high') return t.high;
    return t.medium;
  };

  // ── Sector heatmap click handler ──
  const handleSectorClick = useCallback((sector: string) => {
    setSectorFilter(sector);
    setShowFilters(true);
    setPage(1);
  }, []);

  // ── Render Analysis Card ──
  const renderAnalysisCard = (item: AnalysisItem) => {
    const isUp = item.changePercent >= 0;
    const sigCfg = SIGNAL_CONFIG[item.overallSignal] || SIGNAL_CONFIG.neutral;
    const riskCfg = RISK_CONFIG[(item.riskLevel || 'medium').toLowerCase()] || RISK_CONFIG.medium;
    const companySymbol = item.symbol;
    // Use company profile name first (like Compare section does), then fall back to extracting from title
    const companyProfileName = locale === 'ar'
      ? (item.company?.nameAr || item.company?.name)
      : locale === 'fr'
        ? (item.company?.nameFr || item.company?.name)
        : item.company?.name;
    const extractedName = extractCompanyName(item.title, companySymbol);
    const companyName = companyProfileName ? sanitizeMarkdown(companyProfileName) : extractedName;
    const isWatched = watchlist.includes(companySymbol);

    const publishedTimeAgo = item.publishedAt ? formatTimeAgoLocale(item.publishedAt, locale) : '';
    const publishedTime = item.publishedAt
      ? new Date(item.publishedAt).toLocaleTimeString(
          locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US',
          { hour: '2-digit', minute: '2-digit' }
        )
      : '';

    return (
      <div
        key={item.id}
        className="glass-card hover-lift"
        style={{
          borderRadius: 12,
          padding: 16,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          borderLeft: `3px solid ${sigCfg.leftBorder}`,
        }}
        onClick={() => router.push(`${getLocalePath(locale)}/stock-analysis/${companySymbol}`)}
      >
        {/* Header: Name + Symbol + Star */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'var(--cyan2)', border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--cyan)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              {companySymbol.charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {companyName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                  {companySymbol}
                </span>
                {publishedTimeAgo && (
                  <span style={{ fontSize: 9, color: 'var(--text4)' }}>
                    · {publishedTimeAgo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {/* Star / Watchlist */}
            <button
              onClick={(e) => toggleWatchlist(companySymbol, e)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 2, fontSize: 14, lineHeight: 1,
                color: isWatched ? '#ffb800' : 'var(--text4)',
                transition: 'color 0.15s ease',
              }}
              aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isWatched ? '★' : '☆'}
            </button>
            {/* Signal Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 5,
              fontSize: 10, fontWeight: 700,
              background: sigCfg.bg, color: sigCfg.color,
              border: `1px solid ${sigCfg.border}`,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: sigCfg.color }} />
              {signalLabel(item.overallSignal)}
            </span>
          </div>
        </div>

        {/* Price + Change */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
            ${fmt(item.price)}
          </span>
          <span style={{
            padding: '2px 7px', borderRadius: 4,
            fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            background: isUp ? 'var(--bull2)' : 'var(--bear2)',
            color: isUp ? 'var(--bull)' : 'var(--bear)',
          }} suppressHydrationWarning>
            {isUp ? '+' : ''}{fmt(item.changePercent)}%
          </span>
        </div>

        {/* Confidence Bar */}
        <ConfidenceBar value={item.confidenceScore || 0} locale={locale} />

        {/* Risk + Read More */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 3, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
              background: riskCfg.bg, color: riskCfg.color,
            }}>
              {riskLabel(item.riskLevel)}
            </span>
            {publishedTime && (
              <span style={{ fontSize: 9, color: 'var(--text4)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {publishedTime}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--cyan)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {t.readMore}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {isRTL ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
            </svg>
          </span>
        </div>
      </div>
    );
  };

  // ── Beautiful Stock Analysis Report Component ──
  const AIStockAnalysisReport = ({ data }: { data: any }) => {
    const isAr = locale === 'ar';
    const isFr = locale === 'fr';

    // Signal badge config
    const getSignalConfig = (signal: string) => {
      const s = (signal || '').toLowerCase();
      if (s.includes('strong buy')) return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)', color: '#22c55e', icon: '▲▲' };
      if (s.includes('buy')) return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: '▲' };
      if (s.includes('strong sell')) return { bg: 'rgba(239,83,80,0.15)', border: 'rgba(239,83,80,0.5)', color: '#ef5350', icon: '▼▼' };
      if (s.includes('sell')) return { bg: 'rgba(239,83,80,0.1)', border: 'rgba(239,83,80,0.3)', color: '#ef5350', icon: '▼' };
      return { bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.3)', color: '#ffb800', icon: '◆' };
    };

    const getTrendColor = (direction: string) => {
      const d = (direction || '').toLowerCase();
      if (d.includes('bullish') || d.includes('صاعد') || d.includes('haussier')) return '#22c55e';
      if (d.includes('bearish') || d.includes('هابط') || d.includes('baissier')) return '#ef5350';
      return '#ffb800';
    };

    const sigCfg = getSignalConfig(data.signal || '');
    const trendColor = getTrendColor(data.trendDirection || '');

    // Section card style
    const sectionStyle: React.CSSProperties = {
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 12,
    };

    const sectionHeaderStyle = (color: string): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingInlineStart: 0,
    });

    const sectionTitleStyle = (color: string): React.CSSProperties => ({
      fontSize: 14,
      fontWeight: 700,
      color: color,
      letterSpacing: 0.3,
    });

    const sectionIconStyle = (color: string): React.CSSProperties => ({
      width: 28,
      height: 28,
      borderRadius: 7,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      flexShrink: 0,
    });

    // Sub-label for table-style rows
    const labelStyle: React.CSSProperties = {
      fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
    };
    const valueStyle: React.CSSProperties = {
      fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontWeight: 600,
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* ═══ HEADER: Symbol + Company + Price + Signal ═══ */}
        <div style={{
          ...sectionStyle,
          background: `linear-gradient(135deg, var(--bg2) 0%, ${sigCfg.bg} 100%)`,
          border: `1px solid ${sigCfg.border}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative gradient orb */}
          <div style={{
            position: 'absolute', top: -20, insetInlineEnd: -20, width: 120, height: 120,
            background: `radial-gradient(circle, ${sigCfg.color}15, transparent 70%)`,
            borderRadius: '50%',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 22, fontWeight: 800, color: 'var(--cyan)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}>{data.symbol}</span>
                <span style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: sigCfg.bg, border: `1px solid ${sigCfg.border}`,
                  fontSize: 11, fontWeight: 700, color: sigCfg.color,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}>
                  {sigCfg.icon} {data.signal}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600, marginBottom: 6 }}>
                {data.companyName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                  {data.currentPrice}
                </span>
                {data.priceChange && (
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: data.priceChange.includes('-') || data.priceChange.includes('−') ? 'var(--bear)' : 'var(--bull)',
                    background: data.priceChange.includes('-') || data.priceChange.includes('−') ? 'var(--bear2)' : 'var(--bull2)',
                    padding: '2px 8px', borderRadius: 4,
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}>
                    {data.priceChange}
                  </span>
                )}
              </div>
            </div>
            {/* Confidence gauge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {isAr ? 'الثقة' : isFr ? 'Confiance' : 'Confidence'}
              </div>
              <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto' }}>
                <svg viewBox="0 0 36 36" style={{ width: 56, height: 56, transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={sigCfg.color} strokeWidth="2.5" strokeDasharray={`${data.confidence || 0}, 100`} strokeLinecap="round" />
                </svg>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontWeight: 800, color: sigCfg.color, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                  {data.confidence || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ EXECUTIVE SUMMARY ═══ */}
        {data.executiveSummary && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('var(--cyan)')}>
              <div style={sectionIconStyle('var(--cyan)')}>📋</div>
              <span style={sectionTitleStyle('var(--cyan)')}>
                {isAr ? 'الملخص التنفيذي' : isFr ? 'Résumé Exécutif' : 'Executive Summary'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, margin: 0 }}>
              {data.executiveSummary}
            </p>
          </div>
        )}

        {/* ═══ TECHNICAL ANALYSIS ═══ */}
        {(data.trendDirection || data.movingAverages) && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('var(--cyan)')}>
              <div style={sectionIconStyle('var(--cyan)')}>📊</div>
              <span style={sectionTitleStyle('var(--cyan)')}>
                {isAr ? 'التحليل الفني' : isFr ? 'Analyse Technique' : 'Technical Analysis'}
              </span>
            </div>

            {/* Trend Direction */}
            {data.trendDirection && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${trendColor}10`, border: `1px solid ${trendColor}30` }}>
                <span style={{ fontSize: 16, color: trendColor }}>
                  {trendColor === '#22c55e' ? '📈' : trendColor === '#ef5350' ? '📉' : '➡️'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
                    {isAr ? 'الاتجاه العام' : isFr ? 'Tendance Générale' : 'Overall Trend'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: trendColor }}>{data.trendDirection}</span>
                    {data.trendStrength && (
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                        ({isAr ? 'قوة' : isFr ? 'Force' : 'Strength'}: {data.trendStrength}%)
                      </span>
                    )}
                  </div>
                </div>
                {data.trendStrength && (
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${data.trendStrength}%`, height: '100%', borderRadius: 3, background: trendColor }} />
                  </div>
                )}
              </div>
            )}

            {/* Moving Averages */}
            {data.movingAverages && data.movingAverages.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>
                  {isAr ? 'المتوسطات المتحركة' : isFr ? 'Moyennes Mobiles' : 'Moving Averages'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.movingAverages.map((ma: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100,
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>MA {ma.period}</span>
                      <span style={{ ...valueStyle, fontSize: 12 }}>{ma.price}</span>
                      <span style={{ fontSize: 9, color: ma.note?.includes('support') || ma.note?.includes('دعم') ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>{ma.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SUPPORT & RESISTANCE LEVELS ═══ */}
        {(data.supportLevels || data.resistanceLevels) && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('var(--gold)')}>
              <div style={sectionIconStyle('var(--gold)')}>🎯</div>
              <span style={sectionTitleStyle('var(--gold)')}>
                {isAr ? 'مستويات الدعم والمقاومة' : isFr ? 'Niveaux de Support et Résistance' : 'Support & Resistance Levels'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Support */}
              {data.supportLevels && data.supportLevels.length > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ ...labelStyle, color: 'var(--bull)', marginBottom: 6, textAlign: 'center' }}>
                    {isAr ? 'الدعم' : isFr ? 'Support' : 'Support'}
                  </div>
                  {data.supportLevels.map((s: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: idx < data.supportLevels.length - 1 ? '1px solid rgba(34,197,94,0.1)' : 'none' }}>
                      <span style={{ ...valueStyle, fontSize: 12, color: 'var(--bull)' }}>{s.price}</span>
                      {s.note && <span style={{ fontSize: 9, color: 'var(--text3)' }}>{s.note}</span>}
                    </div>
                  ))}
                </div>
              )}
              {/* Resistance */}
              {data.resistanceLevels && data.resistanceLevels.length > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,83,80,0.05)', border: '1px solid rgba(239,83,80,0.15)' }}>
                  <div style={{ ...labelStyle, color: 'var(--bear)', marginBottom: 6, textAlign: 'center' }}>
                    {isAr ? 'المقاومة' : isFr ? 'Résistance' : 'Resistance'}
                  </div>
                  {data.resistanceLevels.map((r: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: idx < data.resistanceLevels.length - 1 ? '1px solid rgba(239,83,80,0.1)' : 'none' }}>
                      <span style={{ ...valueStyle, fontSize: 12, color: 'var(--bear)' }}>{r.price}</span>
                      {r.note && <span style={{ fontSize: 9, color: 'var(--text3)' }}>{r.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TECHNICAL INDICATORS ═══ */}
        {data.indicators && data.indicators.length > 0 && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('#8B5CF6')}>
              <div style={sectionIconStyle('#8B5CF6')}>🔬</div>
              <span style={sectionTitleStyle('#8B5CF6')}>
                {isAr ? 'المؤشرات الفنية الرئيسية' : isFr ? 'Indicateurs Techniques Clés' : 'Key Technical Indicators'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.indicators.map((ind: any, idx: number) => {
                const assessmentColor = (ind.assessment || '').toLowerCase().includes('overbought') || (ind.assessment || '').toLowerCase().includes('تشبع') || (ind.assessment || '').toLowerCase().includes('surachat')
                  ? '#ef5350'
                  : (ind.assessment || '').toLowerCase().includes('bullish') || (ind.assessment || '').toLowerCase().includes('صاعد') || (ind.assessment || '').toLowerCase().includes('haussier')
                    ? '#22c55e'
                    : '#ffb800';
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{ind.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{ind.assessment}</span>
                    </div>
                    <span style={{
                      ...valueStyle, fontSize: 14, color: assessmentColor,
                      padding: '4px 10px', borderRadius: 6,
                      background: `${assessmentColor}15`, border: `1px solid ${assessmentColor}30`,
                    }}>
                      {ind.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ FUNDAMENTAL OVERVIEW ═══ */}
        {data.fundamentalOverview && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('#3B82F6')}>
              <div style={sectionIconStyle('#3B82F6')}>🏢</div>
              <span style={sectionTitleStyle('#3B82F6')}>
                {isAr ? 'لمحة أساسية' : isFr ? 'Aperçu Fondamental' : 'Fundamental Overview'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {data.fundamentalOverview.sector && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={labelStyle}>{isAr ? 'القطاع' : isFr ? 'Secteur' : 'Sector'}</div>
                  <div style={{ ...valueStyle, fontSize: 12, marginTop: 2 }}>{data.fundamentalOverview.sector}</div>
                </div>
              )}
              {data.fundamentalOverview.marketCap && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={labelStyle}>{isAr ? 'القيمة السوقية' : isFr ? 'Cap. Boursière' : 'Market Cap'}</div>
                  <div style={{ ...valueStyle, fontSize: 12, marginTop: 2 }}>{data.fundamentalOverview.marketCap}</div>
                </div>
              )}
              {data.fundamentalOverview.pe && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={labelStyle}>{isAr ? 'م/ر (P/E)' : 'P/E'}</div>
                  <div style={{ ...valueStyle, fontSize: 12, marginTop: 2 }}>{data.fundamentalOverview.pe}</div>
                </div>
              )}
              {data.fundamentalOverview.eps && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div style={labelStyle}>{isAr ? 'ربحية السهم' : isFr ? 'BPA' : 'EPS'}</div>
                  <div style={{ ...valueStyle, fontSize: 12, marginTop: 2 }}>{data.fundamentalOverview.eps}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ MARKET FORECASTS ═══ */}
        {(data.bullishScenario || data.bearishScenario || data.realisticTarget) && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('var(--gold)')}>
              <div style={sectionIconStyle('var(--gold)')}>🔮</div>
              <span style={sectionTitleStyle('var(--gold)')}>
                {isAr ? 'التوقعات السوقية' : isFr ? 'Prévisions de Marché' : 'Market Forecasts'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: data.bullishScenario && data.bearishScenario ? '1fr 1fr' : '1fr', gap: 10 }}>
              {/* Bullish */}
              {data.bullishScenario && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>📈</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bull)' }}>
                      {isAr ? 'السيناريو الصعودي' : isFr ? 'Scénario Haussier' : 'Bullish Scenario'}
                    </span>
                  </div>
                  <div style={{ ...valueStyle, fontSize: 16, color: 'var(--bull)', marginBottom: 6 }}>{data.bullishScenario.targetPrice}</div>
                  {data.bullishScenario.drivers && data.bullishScenario.drivers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {data.bullishScenario.drivers.map((d: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--bull)', fontSize: 8, marginTop: 4 }}>●</span>
                          <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.bullishScenario.timeframe && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontWeight: 600 }}>
                      ⏱ {data.bullishScenario.timeframe}
                    </div>
                  )}
                </div>
              )}
              {/* Bearish */}
              {data.bearishScenario && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(239,83,80,0.06)', border: '1px solid rgba(239,83,80,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>📉</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bear)' }}>
                      {isAr ? 'السيناريو الهبوطي' : isFr ? 'Scénario Baissier' : 'Bearish Scenario'}
                    </span>
                  </div>
                  <div style={{ ...valueStyle, fontSize: 16, color: 'var(--bear)', marginBottom: 6 }}>{data.bearishScenario.targetPrice}</div>
                  {data.bearishScenario.drivers && data.bearishScenario.drivers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {data.bearishScenario.drivers.map((d: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--bear)', fontSize: 8, marginTop: 4 }}>●</span>
                          <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.bearishScenario.timeframe && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontWeight: 600 }}>
                      ⏱ {data.bearishScenario.timeframe}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Realistic Target */}
            {data.realisticTarget && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
                  {isAr ? 'السعر المستهدف الواقعي' : isFr ? 'Objectif Réaliste' : 'Realistic Target'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...valueStyle, fontSize: 14, color: 'var(--gold)' }}>{data.realisticTarget.price}</span>
                  {data.realisticTarget.probability && (
                    <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{data.realisticTarget.probability}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ RISK ASSESSMENT ═══ */}
        {(data.companyRisks || data.technicalRisks) && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle('#ef5350')}>
              <div style={sectionIconStyle('#ef5350')}>⚠️</div>
              <span style={sectionTitleStyle('#ef5350')}>
                {isAr ? 'تقييم المخاطر' : isFr ? 'Évaluation des Risques' : 'Risk Assessment'}
              </span>
            </div>
            {data.companyRisks && data.companyRisks.length > 0 && (
              <div style={{ marginBottom: data.technicalRisks ? 10 : 0 }}>
                <div style={{ ...labelStyle, color: '#ef5350', marginBottom: 6 }}>
                  {isAr ? 'مخاطر الشركة' : isFr ? 'Risques Entreprise' : 'Company Risks'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {data.companyRisks.map((risk: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}>
                      <span style={{ color: '#ef5350', fontSize: 9, marginTop: 4, flexShrink: 0 }}>●</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.technicalRisks && data.technicalRisks.length > 0 && (
              <div>
                <div style={{ ...labelStyle, color: '#ffb800', marginBottom: 6 }}>
                  {isAr ? 'مخاطر فنية' : isFr ? 'Risques Techniques' : 'Technical Risks'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {data.technicalRisks.map((risk: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}>
                      <span style={{ color: '#ffb800', fontSize: 9, marginTop: 4, flexShrink: 0 }}>●</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ FINAL RECOMMENDATION ═══ */}
        {(data.shortTermRec || data.mediumTermRec) && (
          <div style={{
            ...sectionStyle,
            background: `linear-gradient(135deg, var(--bg2) 0%, ${sigCfg.bg} 100%)`,
            border: `1px solid ${sigCfg.border}`,
          }}>
            <div style={sectionHeaderStyle(sigCfg.color)}>
              <div style={sectionIconStyle(sigCfg.color)}>💡</div>
              <span style={sectionTitleStyle(sigCfg.color)}>
                {isAr ? 'التوصية النهائية' : isFr ? 'Recommandation Finale' : 'Final Recommendation'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: data.shortTermRec && data.mediumTermRec ? '1fr 1fr' : '1fr', gap: 10 }}>
              {data.shortTermRec && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    {isAr ? 'الأجل القصير (1-4 أسابيع)' : isFr ? 'Court Terme (1-4 semaines)' : 'Short Term (1-4 weeks)'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isAr ? 'الإجراء' : isFr ? 'Action' : 'Action'}</span>
                      <span style={{ ...valueStyle, fontSize: 13, color: sigCfg.color }}>{data.shortTermRec.action}</span>
                    </div>
                    {data.shortTermRec.entryPrice && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isAr ? 'سعر الدخول' : isFr ? "Prix d'entrée" : 'Entry'}</span>
                        <span style={{ ...valueStyle, fontSize: 12 }}>{data.shortTermRec.entryPrice}</span>
                      </div>
                    )}
                    {data.shortTermRec.target && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isAr ? 'الهدف' : isFr ? 'Objectif' : 'Target'}</span>
                        <span style={{ ...valueStyle, fontSize: 12, color: 'var(--bull)' }}>{data.shortTermRec.target}</span>
                      </div>
                    )}
                    {data.shortTermRec.stopLoss && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isAr ? 'وقف الخسارة' : isFr ? 'Stop Loss' : 'Stop Loss'}</span>
                        <span style={{ ...valueStyle, fontSize: 12, color: 'var(--bear)' }}>{data.shortTermRec.stopLoss}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {data.mediumTermRec && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    {isAr ? 'الأجل المتوسط (1-3 أشهر)' : isFr ? 'Moyen Terme (1-3 mois)' : 'Medium Term (1-3 months)'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isAr ? 'الإجراء' : isFr ? 'Action' : 'Action'}</span>
                      <span style={{ ...valueStyle, fontSize: 13, color: sigCfg.color }}>{data.mediumTermRec.action}</span>
                    </div>
                    {data.mediumTermRec.condition && (
                      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{data.mediumTermRec.condition}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ DISCLAIMER ═══ */}
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginTop: 4,
          background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6 }}>
            {isAr
              ? '⚠️ هذا المحتوى مُولّد بالذكاء الاصطناعي لأغراض إعلامية فقط. ليس نصيحة مالية. استشر مستشاراً مالياً مرخصاً قبل اتخاذ أي قرارات استثمارية.'
              : isFr
                ? '⚠️ Ce contenu est généré par IA à titre informatif uniquement. Non un conseil financier. Consultez un conseiller financier agréé avant de prendre des décisions d\'investissement.'
                : '⚠️ This content is AI-generated for informational purposes only. Not financial advice. Consult a licensed financial advisor before making investment decisions.'}
          </span>
        </div>
      </div>
    );
  };

  // ── Render markdown-like content for AI (enhanced) ──
  const renderAIContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    // Inline bold processing helper (sanitized to prevent XSS)
    const bold = (text: string) => {
      const html = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>');
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['strong', 'span'],
        ALLOWED_ATTR: ['style'],
        FORCE_BODY: true,
      });
    };

    // Check if a line is a table row (contains | delimiters)
    const isTableRow = (line: string) => /^\|.*\|$/.test(line.trim());
    const isTableSeparator = (line: string) => /^\|[\s\-:]+\|$/.test(line.trim());

    while (i < lines.length) {
      const line = lines[i];

      // Empty line → paragraph gap
      if (!line.trim()) {
        i++;
        continue;
      }

      // ── Table detection and rendering ──
      if (isTableRow(line) && i + 1 < lines.length && (isTableSeparator(lines[i + 1]) || isTableRow(lines[i + 1]))) {
        const tableRows: string[][] = [];
        // Collect header row
        const headerCells = line.trim().split('|').filter(c => c.trim()).map(c => c.trim());
        tableRows.push(headerCells);
        i++;
        // Skip separator row
        if (i < lines.length && isTableSeparator(lines[i])) i++;
        // Collect data rows
        while (i < lines.length && isTableRow(lines[i])) {
          const dataCells = lines[i].trim().split('|').filter(c => c.trim()).map(c => c.trim());
          tableRows.push(dataCells);
          i++;
        }
        // Render the table
        elements.push(
          <div key={`tbl-${i}`} style={{ overflowX: 'auto', margin: '8px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {tableRows[0].map((cell, ci) => (
                    <th key={ci} style={{ padding: '8px 12px', textAlign: locale === 'ar' ? 'right' : 'left', fontWeight: 700, color: 'var(--cyan)', borderBottom: '1px solid var(--border2)', fontSize: 11, whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: bold(cell) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--bg2)' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '6px 12px', color: 'var(--text2)', borderBottom: '1px solid var(--border)', fontSize: 12 }} dangerouslySetInnerHTML={{ __html: bold(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Numbered list item: "1. **SYMBOL** — Company"
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const rest = bold(numberedMatch[2]);
        elements.push(
          <div key={`n-${i}`} style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'flex-start' }}>
            <span style={{
              minWidth: 22, height: 22, borderRadius: '50%',
              background: 'var(--cyan2)', color: 'var(--cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>{num}</span>
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: rest }} />
          </div>
        );
        // Collect sub-items (indented lines that follow)
        i++;
        while (i < lines.length && lines[i].match(/^\s{2,}[-*•]\s/) || (i < lines.length && lines[i].match(/^\s{3,}/) && lines[i].trim())) {
          const subLine = lines[i].trim().replace(/^[-*•]\s*/, '');
          elements.push(
            <div key={`sub-${i}`} style={{ marginInlineStart: 30, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, paddingInlineStart: 8, borderInlineStart: '2px solid var(--border)' }} dangerouslySetInnerHTML={{ __html: bold(subLine) }} />
          );
          i++;
        }
        continue;
      }

      // Bullet point: "- text" or "* text" or "• text"
      const bulletMatch = line.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        const bulletText = bold(bulletMatch[1]);
        // Check if it's a labeled bullet like "**Pros:**" or "**Cons:**"
        const isLabel = bulletMatch[1].match(/^\*\*(.*?)\*\*/);
        elements.push(
          <div key={`b-${i}`} style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'flex-start' }}>
            <span style={{ color: isLabel ? 'var(--cyan)' : 'var(--text3)', fontSize: 10, marginTop: 4, flexShrink: 0 }}>●</span>
            <span style={{ fontSize: 12, color: isLabel ? 'var(--text)' : 'var(--text2)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: bulletText }} />
          </div>
        );
        i++;
        continue;
      }

      // Trophy/winner line: "🏆 **Winner:**"
      if (line.startsWith('🏆')) {
        const processed = bold(line);
        elements.push(
          <div key={`win-${i}`} style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)',
            fontSize: 14, fontWeight: 700, color: 'var(--gold)',
          }} dangerouslySetInnerHTML={{ __html: processed }} />
        );
        i++;
        continue;
      }

      // Error line: "❌ ..."
      if (line.startsWith('❌')) {
        elements.push(
          <div key={`err-${i}`} style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.3)',
            fontSize: 13, color: 'var(--bear)',
          }} dangerouslySetInnerHTML={{ __html: bold(line.replace('❌ ', '')) }} />
        );
        i++;
        continue;
      }

      // Warning line: "⚠️ ..."
      if (line.startsWith('⚠️')) {
        elements.push(
          <div key={`warn-${i}`} style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.3)',
            fontSize: 12, color: 'var(--gold)', lineHeight: 1.6,
          }} dangerouslySetInnerHTML={{ __html: bold(line.replace('⚠️ ', '')) }} />
        );
        i++;
        continue;
      }

      // Lightbulb line: "💡 ..."
      if (line.startsWith('💡')) {
        elements.push(
          <div key={`tip-${i}`} style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: 'var(--cyan2)', border: '1px solid var(--border2)',
            fontSize: 12, color: 'var(--cyan)', lineHeight: 1.6,
          }} dangerouslySetInnerHTML={{ __html: bold(line.replace('💡 ', '')) }} />
        );
        i++;
        continue;
      }

      // Header: "# text" or "## text" — with colored left border accent
      const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const size = level === 1 ? 16 : level === 2 ? 14 : 13;
        const paddingInline = level === 1 ? 12 : 10;
        const borderSize = level === 1 ? 3 : 2;
        const borderColor = level === 1 ? 'var(--cyan)' : level === 2 ? 'var(--gold)' : '#8B5CF6';
        elements.push(
          <div key={`h-${i}`} style={{
            fontSize: size, fontWeight: 700, color: 'var(--text-head)',
            marginTop: 14, marginBottom: 4,
            paddingInlineStart: paddingInline,
            borderInlineStart: `${borderSize}px solid ${borderColor}`,
          }} dangerouslySetInnerHTML={{ __html: bold(headerMatch[2]) }} />
        );
        i++;
        continue;
      }

      // Horizontal rule: "---"
      if (/^---+$/.test(line.trim())) {
        elements.push(
          <div key={`hr-${i}`} style={{ margin: '10px 0', borderBottom: '1px solid var(--border)' }} />
        );
        i++;
        continue;
      }

      // Labeled line like "**Signal:** Buy | **Confidence:** 80%"
      if (line.match(/^\*\*/)) {
        elements.push(
          <div key={`lbl-${i}`} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8, marginTop: 6 }} dangerouslySetInnerHTML={{ __html: bold(line) }} />
        );
        i++;
        continue;
      }

      // Regular text paragraph
      elements.push(
        <div key={`p-${i}`} style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginTop: 4 }} dangerouslySetInnerHTML={{ __html: bold(line) || '&nbsp;' }} />
      );
      i++;
    }

    return <div style={{ padding: '4px 0' }}>{elements}</div>;
  };

  // ── Render ──
  return (
    <main className="min-h-screen pb-16" dir={dir} style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md, 16px)' }}>

        {/* ═══ TICKER TAPE ═══ */}
        {!loading && analyses.length > 0 && <TickerTape analyses={analyses} locale={locale} />}

        {/* ═══ SECTOR HEATMAP ═══ */}
        {!loading && analyses.length > 0 && (
          <SectorHeatmap analyses={analyses} locale={locale} onSectorClick={handleSectorClick} />
        )}

        {/* ═══ PAGE HEADER + SEARCH ═══ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--cyan2)', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h1 className="font-heading" style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 700, color: 'var(--text-head)' }}>
                {t.pageTitle}
              </h1>
            </div>

            {/* Smart Search */}
            <div ref={searchRef} style={{ position: 'relative', width: 280, flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 14px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder={t.searchStocks}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', minWidth: 0,
                  }}
                />
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--bg2)', border: '1px solid var(--border2)',
                  borderRadius: 8, marginTop: 4, zIndex: 50,
                  maxHeight: 240, overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  {searchSuggestions.map(s => (
                    <div
                      key={s.symbol}
                      onClick={() => handleSuggestionClick(s.symbol)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--cyan3)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12 }}>
                        {s.symbol}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {s.name}
                      </span>
                      <button
                        onClick={(e) => handleSuggestionAnalyze(s.symbol, e)}
                        style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: 'var(--bull2)', color: 'var(--bull)', border: '1px solid rgba(34,197,94,0.3)',
                          cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        {locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyser' : 'AI'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 650, lineHeight: 1.6 }}>{t.pageDesc}</p>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {([
            { id: 'today' as TabId, label: t.tabToday, icon: '📊' },
            { id: 'active' as TabId, label: t.tabActive, icon: '🔥' },
            { id: 'profile' as TabId, label: t.tabProfile, icon: '🏢' },
            { id: 'compare' as TabId, label: t.tabCompare, icon: '⚖️' },
            { id: 'tabAI' as TabId, label: t.tabAI, icon: '🤖' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10,
                border: `1px solid ${activeTab === tab.id ? 'var(--border2)' : 'var(--border)'}`,
                background: activeTab === tab.id ? 'var(--cyan2)' : 'transparent',
                color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text3)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ LOADING STATE ═══ */}
        {loading && (
          <div>
            {activeTab === 'today' && <AnalysisSkeleton />}
            {activeTab === 'active' && <TableSkeleton />}
            {activeTab === 'profile' && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>{t.loading}</p>
              </div>
            )}
            {activeTab === 'compare' && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>{t.loading}</p>
              </div>
            )}
            {activeTab === 'tabAI' && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>{t.loading}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ ERROR STATE ═══ */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ color: 'var(--bear)', fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => analysesQuery.refetch()}
              style={{
                padding: '10px 28px', borderRadius: 8,
                border: '1px solid var(--border2)', background: 'var(--cyan2)',
                color: 'var(--cyan)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* ═══ TAB 1: TODAY'S ANALYSES ═══ */}
        {!loading && !error && activeTab === 'today' && (
          <div>
            {/* Advanced Filters Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: showFilters ? 'var(--cyan2)' : 'transparent',
                  color: showFilters ? 'var(--cyan)' : 'var(--text3)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {showFilters ? t.hideFilters : t.showFilters}
              </button>
              <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                {t.pageOf.replace('{0}', String(page)).replace('{1}', String(totalPages))}
              </span>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
              <div className="glass-card" style={{ padding: 16, borderRadius: 10, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Sector Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{t.filterSector}</label>
                  <select
                    value={sectorFilter}
                    onChange={e => { setSectorFilter(e.target.value); setPage(1); }}
                    style={{
                      background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none',
                    }}
                  >
                    <option value="">{t.filterAllSectors}</option>
                    {sectors.map(s => (
                      <option key={s.sector} value={s.sector}>{s.sector} ({s.stockCount})</option>
                    ))}
                  </select>
                </div>

                {/* Market Type Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{t.filterMarket}</label>
                  <select
                    value={marketTypeFilter}
                    onChange={e => { setMarketTypeFilter(e.target.value); setPage(1); }}
                    style={{
                      background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none',
                    }}
                  >
                    <option value="">{t.filterAllMarkets}</option>
                    {MARKET_TYPES.map(m => (
                      <option key={m.value} value={m.value}>{m.label[locale]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Signal filter chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['all', 'bullish', 'bearish', 'neutral', 'watchlist'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => { setSignalFilter(filter); setPage(1); }}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: `1px solid ${signalFilter === filter ? 'var(--border2)' : 'var(--border)'}`,
                    background: signalFilter === filter ? 'var(--cyan2)' : 'transparent',
                    color: signalFilter === filter ? 'var(--cyan)' : 'var(--text3)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filter === 'all' ? t.filterAll : filter === 'watchlist' ? `☆ ${t.watchlist}` : signalLabel(filter)}
                </button>
              ))}
              <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', marginInlineStart: 8 }}>
                {filteredAnalyses.length} {t.analysisCount}
              </span>
            </div>

            {filteredAnalyses.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {filteredAnalyses.map(item => renderAnalysisCard(item))}
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
                  {page < totalPages && (
                    <button
                      onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        padding: '10px 28px', borderRadius: 8,
                        border: '1px solid var(--border2)', background: 'var(--cyan2)',
                        color: 'var(--cyan)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {t.loadMore}
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {t.pageOf.replace('{0}', String(page)).replace('{1}', String(totalPages))}
                  </span>
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p style={{ color: 'var(--text3)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t.noAnalyses}</p>
                <p style={{ color: 'var(--text4)', fontSize: 13 }}>{t.noAnalysesDesc}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 2: MOST ACTIVE STOCKS (Bloomberg-style) ═══ */}
        {!loading && !error && activeTab === 'active' && (
          <div className="glass-card" style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 600 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    {[
                      t.colSymbol, t.colName, t.colPrice, t.colChange,
                      t.colVolume, t.colMarketCap, t.colSector,
                    ].map((label, idx) => (
                      <th key={idx} style={{
                        padding: '8px 10px',
                        textAlign: isRTL ? 'right' : 'left',
                        color: 'var(--text3)', fontWeight: 700,
                        whiteSpace: 'nowrap', fontSize: 10,
                        background: 'var(--bg2)',
                        borderBottom: '2px solid var(--border)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStocks.map((stock, idx) => {
                    const isUp = stock.changePercent >= 0;
                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => router.push(`${getLocalePath(locale)}/stock-analysis/${stock.symbol}`)}
                        style={{
                          borderBottom: idx < activeStocks.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer', transition: 'background 0.15s ease',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cyan3)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
                      >
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }}>
                          {stock.symbol}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text2)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                          {stock.name}
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }} suppressHydrationWarning>
                          ${fmt(stock.price)}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{
                            display: 'inline-block', padding: '1px 6px', borderRadius: 3,
                            fontSize: 10, fontWeight: 700,
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            background: isUp ? 'var(--bull2)' : 'var(--bear2)',
                            color: isUp ? 'var(--bull)' : 'var(--bear)',
                          }} suppressHydrationWarning>
                            {isUp ? '+' : ''}{fmt(stock.changePercent)}%
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: stock.volume ? 'var(--text2)' : 'var(--text4)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }}>
                          {stock.volume || '—'}
                        </td>
                        <td style={{ padding: '6px 10px', color: stock.marketCap ? 'var(--text2)' : 'var(--text4)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }}>
                          {stock.marketCap || '—'}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text3)', fontSize: 10 }}>
                          {stock.sector}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB 3: COMPANY PROFILE ═══ */}
        {!loading && !error && activeTab === 'profile' && (
          <div>
            {/* Search Bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchSymbol}
                  onChange={e => setSearchSymbol(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleProfileSearch()}
                  placeholder={t.searchPlaceholder}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: 'var(--text)', fontFamily: 'inherit',
                  }}
                />
              </div>
              <button
                onClick={handleProfileSearch}
                disabled={profileLoading}
                style={{
                  padding: '10px 24px', borderRadius: 10,
                  border: 'none', background: 'var(--cyan)', color: 'var(--bg)',
                  fontSize: 14, fontWeight: 700, cursor: profileLoading ? 'wait' : 'pointer',
                  opacity: profileLoading ? 0.7 : 1, transition: 'all 0.2s ease',
                }}
              >
                {profileLoading ? t.loading : t.searchBtn}
              </button>
            </div>

            {/* Profile Results */}
            {profileData && profileData.analysis && (
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Company Header */}
                <div className="glass-card" style={{ borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                        {t.companyProfile}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 12,
                          background: 'var(--cyan2)', border: '1px solid var(--border2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22, fontWeight: 700, color: 'var(--cyan)',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                        }}>
                          {(profileData.symbol || searchSymbol).charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)' }}>
                            {profileData.company?.name || profileData.symbol}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>
                            {profileData.symbol}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        {t.currentPrice}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(profileData.analysis.quote?.price || 0)}
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                        fontSize: 13, fontWeight: 700,
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        background: (profileData.analysis.quote?.changePercent || 0) >= 0 ? 'var(--bull2)' : 'var(--bear2)',
                        color: (profileData.analysis.quote?.changePercent || 0) >= 0 ? 'var(--bull)' : 'var(--bear)',
                      }} suppressHydrationWarning>
                        {(profileData.analysis.quote?.changePercent || 0) >= 0 ? '+' : ''}{fmt(profileData.analysis.quote?.changePercent || 0)}%
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    {profileData.company?.exchange && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--text3)', fontWeight: 600 }}>
                        {profileData.company.exchange}
                      </span>
                    )}
                    {profileData.company?.sector && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'var(--cyan2)', color: 'var(--cyan)', fontWeight: 600 }}>
                        {profileData.company.sector}
                      </span>
                    )}
                    {profileData.analysis.signal?.overall && (
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600,
                        ...(() => {
                          const sc = SIGNAL_CONFIG[profileData.analysis.signal.overall] || SIGNAL_CONFIG.neutral;
                          return { background: sc.bg, color: sc.color };
                        })(),
                      }}>
                        {signalLabel(profileData.analysis.signal.overall)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fundamentals + Technicals Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                  {/* Fundamentals Card */}
                  <div className="glass-card" style={{ borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                      {t.fundamentals}
                    </div>
                    {[
                      { label: t.pe, value: profileData.company?.peRatio || profileData.analysis.peRatio },
                      { label: t.eps, value: profileData.company?.eps || profileData.analysis.eps },
                      { label: t.marketCap, value: profileData.company?.marketCap ? formatMarketCap(profileData.company.marketCap) : '—' },
                      { label: t.dividend, value: profileData.company?.dividendYield ? `${(profileData.company.dividendYield * 100).toFixed(2)}%` : '—' },
                      { label: t.sector, value: profileData.company?.sector || '—' },
                      { label: t.exchange, value: profileData.company?.exchange || '—' },
                      { label: t.industry, value: profileData.company?.industry || '—' },
                      { label: t.country, value: profileData.company?.country || '—' },
                    ].map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Technicals Card */}
                  <div className="glass-card" style={{ borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                      {t.technicals}
                    </div>
                    {profileData.analysis.technicalData ? (
                      [
                        { label: t.rsi, value: profileData.analysis.technicalData.rsi?.toFixed(1) },
                        { label: t.macd, value: profileData.analysis.technicalData.macd?.toFixed(2) },
                        { label: t.signalStrength, value: profileData.analysis.technicalData.signalStrength },
                        { label: 'SMA 50', value: profileData.analysis.technicalData.sma50?.toFixed(2) },
                        { label: 'SMA 200', value: profileData.analysis.technicalData.sma200?.toFixed(2) },
                        { label: 'Beta', value: profileData.analysis.technicalData.beta?.toFixed(2) },
                      ].map((row, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{row.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{row.value ?? '—'}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text4)', fontSize: 12 }}>{t.noData}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No profile data yet */}
            {!profileData && !profileLoading && !profileError && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>{t.enterSymbol}</p>
              </div>
            )}

            {/* Profile Error */}
            {profileError && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px', borderRadius: 12 }}>
                <p style={{ color: 'var(--bear)', fontSize: 14 }}>{profileError}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 4: COMPARE STOCKS ═══ */}
        {!loading && !error && activeTab === 'compare' && (
          <div>
            {/* Symbol input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <input
                  type="text"
                  value={compareInput}
                  onChange={e => setCompareInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && addCompareSymbol()}
                  placeholder={t.addSymbol}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}
                />
              </div>
              <button
                onClick={addCompareSymbol}
                disabled={compareSymbols.length >= 4}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: '1px solid var(--border2)', background: 'var(--cyan2)',
                  color: 'var(--cyan)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  opacity: compareSymbols.length >= 4 ? 0.5 : 1,
                }}
              >
                +
              </button>
            </div>

            {/* Selected symbols */}
            {compareSymbols.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {compareSymbols.map(sym => (
                  <span key={sym} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: 'var(--cyan2)', border: '1px solid var(--border2)',
                    fontSize: 12, fontWeight: 700, color: 'var(--cyan)',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}>
                    {sym}
                    <button
                      onClick={() => removeCompareSymbol(sym)}
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {compareSymbols.length >= 2 && (
                  <button
                    onClick={() => compareQuery.refetch()}
                    disabled={compareLoading}
                    style={{
                      padding: '8px 20px', borderRadius: 8,
                      border: 'none', background: 'var(--cyan)', color: 'var(--bg)',
                      fontSize: 13, fontWeight: 700, cursor: compareLoading ? 'wait' : 'pointer',
                      opacity: compareLoading ? 0.7 : 1,
                    }}
                  >
                    {compareLoading ? t.loading : t.compareBtn}
                  </button>
                )}
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>{t.addMoreStocks}</span>
              </div>
            )}

            {/* Compare Results */}
            {compareLoading && <TableSkeleton />}
            {!compareLoading && compareData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(compareData.length, 4)}, 1fr)`, gap: 12 }}>
                {compareData.map((item: any) => {
                  const sig = item.overallSignal || item.analysis?.signal?.overall || 'neutral';
                  const sigCfg = SIGNAL_CONFIG[sig] || SIGNAL_CONFIG.neutral;
                  const sym = item.symbol || '';
                  const price = item.price || item.analysis?.quote?.price || 0;
                  const changeP = item.changePercent || item.analysis?.quote?.changePercent || 0;
                  const isUp = changeP >= 0;
                  const name = item.company?.name ? sanitizeMarkdown(item.company.name) : item.title ? extractShortName(extractCleanCompanyName(item.title, sym)) : sym;

                  return (
                    <div key={sym} className="glass-card" style={{ borderRadius: 10, padding: 16, borderLeft: `3px solid ${sigCfg.leftBorder}` }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace', marginBottom: 4 }}>
                        {sym}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', marginBottom: 4 }} suppressHydrationWarning>
                        ${fmt(price)}
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                        fontSize: 11, fontWeight: 700,
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        background: isUp ? 'var(--bull2)' : 'var(--bear2)',
                        color: isUp ? 'var(--bull)' : 'var(--bear)',
                        marginBottom: 8,
                      }} suppressHydrationWarning>
                        {isUp ? '+' : ''}{fmt(changeP)}%
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: sigCfg.bg, color: sigCfg.color, fontWeight: 700 }}>
                          {signalLabel(sig)}
                        </span>
                        {item.confidenceScore != null && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--text3)', fontWeight: 600 }}>
                            {t.confidence}: {item.confidenceScore}%
                          </span>
                        )}
                      </div>
                      {item.sector && <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 6 }}>{item.sector}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty Compare State */}
            {!compareLoading && compareData.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12 }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>⚖️</span>
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>{t.addMoreStocks}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 5: AI ANALYSIS ═══ */}
        {!loading && !error && activeTab === 'tabAI' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            {/* Quick Actions + Stock Analyze Input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Dynamic Stock Analysis Input */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '4px 4px 4px 12px', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <input
                  type="text"
                  value={aiAnalyzeSymbol}
                  onChange={e => setAiAnalyzeSymbol(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && aiAnalyzeSymbol.trim()) {
                      sendAIMessage(`${locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyser' : 'Analyze'} ${aiAnalyzeSymbol.trim()}`, 'analyze-stock');
                      setAiAnalyzeSymbol('');
                    }
                  }}
                  placeholder={t.aiAnalyzeStockPlaceholder}
                  disabled={aiLoading}
                  style={{
                    width: 110, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace',
                    opacity: aiLoading ? 0.5 : 1,
                  }}
                />
                <button
                  onClick={() => {
                    if (aiAnalyzeSymbol.trim()) {
                      sendAIMessage(`${locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyser' : 'Analyze'} ${aiAnalyzeSymbol.trim()}`, 'analyze-stock');
                      setAiAnalyzeSymbol('');
                    }
                  }}
                  disabled={aiLoading || !aiAnalyzeSymbol.trim()}
                  style={{
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none', background: 'var(--bull)', color: '#fff',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    opacity: aiLoading || !aiAnalyzeSymbol.trim() ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.aiAnalyzeBtn}
                </button>
              </div>
              {/* Quick action buttons */}
              <button
                onClick={() => sendAIMessage(t.aiBestGrowth, 'find-best-stocks')}
                disabled={aiLoading}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'var(--cyan2)',
                  color: 'var(--cyan)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  opacity: aiLoading ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                🚀 {t.aiBestGrowth}
              </button>
              <button
                onClick={() => sendAIMessage(t.aiCompareMSFTGOOGL, 'compare-stocks')}
                disabled={aiLoading}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid var(--border2)', background: 'var(--gold2)',
                  color: 'var(--gold)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  opacity: aiLoading ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                ⚖️ {t.aiCompareMSFTGOOGL}
              </button>
              <button
                onClick={() => sendAIMessage(locale === 'ar' ? 'أي سهم تنصحني أن أشتري؟' : locale === 'fr' ? 'Quelle action me conseillez-vous?' : 'Which stock should I buy?', 'personalized-recommendation')}
                disabled={aiLoading}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.15)',
                  color: '#8B5CF6', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  opacity: aiLoading ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                🎯 {t.aiPersonalized}
              </button>
              {/* V1043: All buttons above now route through the Rouaa Assistant.
                  The separate "🤖 Analyze with Rouaa Assistant" button has been
                  removed because sendAIMessage() now calls askAssistant() for
                  every action. */}
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 340px)', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              padding: 16, marginBottom: 12,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {aiMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                    🤖
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    {locale === 'ar' ? 'تحليل ذكي للأسهم عبر مساعد رؤى' : locale === 'fr' ? 'Analyse intelligente des actions via Assistant Rouaa' : locale === 'tr' ? 'Rouaa Asistanı ile Akıllı Hisse Analizi' : locale === 'es' ? 'Análisis inteligente de acciones con Asistente Rouaa' : 'Smart Stock Analysis via Rouaa Assistant'}
                  </p>
                  <p style={{ color: 'var(--text3)', fontSize: 12, maxWidth: 350, margin: '0 auto', lineHeight: 1.6 }}>
                    {locale === 'ar' ? 'أدخل رمز السهم أعلاه أو استخدم الأزرار السريعة. سيقوم مساعد رؤى بفتح نافذته وتحليل الطلب بشكل شامل.' :
                     locale === 'fr' ? 'Entrez le symbole ci-dessus ou utilisez les raccourcis. Assistant Rouaa ouvrira son panneau et analysera votre demande.' :
                     locale === 'tr' ? 'Yukarıya sembol girin veya kısayolları kullanın. Rouaa Asistanı panelini açacak ve talebinizi analiz edecek.' :
                     locale === 'es' ? 'Ingresa el símbolo arriba o usa los accesos rápidos. El Asistente Rouaa abrirá su panel y analizará tu solicitud.' :
                     'Enter a stock symbol above or use quick actions. The Rouaa Assistant will open its panel and analyze your request comprehensively.'}
                  </p>
                </div>
              )}
              {aiMessages.map((msg, idx) => (
                <div key={idx} style={{
                  alignSelf: msg.role === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : 'stretch',
                  maxWidth: msg.role === 'user' ? '80%' : '100%',
                }}>
                  <div style={{
                    padding: msg.role === 'assistant' && msg.analysisData ? '0' : '10px 14px',
                    borderRadius: msg.role === 'assistant' && msg.analysisData ? 0 : 10,
                    background: msg.role === 'user' ? 'var(--cyan2)' : 'transparent',
                    border: msg.role === 'user' ? '1px solid var(--border2)' : 'none',
                  }}>
                    {msg.role === 'assistant' ? (
                      msg.analysisData ? <AIStockAnalysisReport data={msg.analysisData} /> : renderAIContent(msg.content)
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'stretch' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                      <span className="inline-flex gap-1">
                        <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>●</span>
                        <span style={{ animation: 'pulse 1s ease-in-out 0.2s infinite' }}>●</span>
                        <span style={{ animation: 'pulse 1s ease-in-out 0.4s infinite' }}>●</span>
                      </span>{' '}
                      {t.aiThinking}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && aiInput.trim()) {
                      e.preventDefault();
                      sendAIMessage(aiInput);
                      setAiInput('');
                    }
                  }}
                  placeholder={t.aiPlaceholder}
                  disabled={aiLoading}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: 'var(--text)', fontFamily: 'inherit',
                    opacity: aiLoading ? 0.5 : 1,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (aiInput.trim()) {
                    sendAIMessage(aiInput);
                    setAiInput('');
                  }
                }}
                disabled={aiLoading || !aiInput.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: 'none', background: 'var(--cyan)', color: 'var(--bg)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: aiLoading || !aiInput.trim() ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {isRTL ? <path d="M21 12H3M12 3l-9 9 9 9" /> : <path d="M3 12h18M12 3l9 9-9 9" />}
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══ DISCLAIMER ═══ */}
        <div style={{ marginTop: 40, padding: '12px 16px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>{t.disclaimer}</span>
        </div>
      </div>
    </main>
  );
}
