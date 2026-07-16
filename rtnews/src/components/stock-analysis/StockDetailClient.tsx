'use client';

// ─── Stock Detail Page Client (Enhanced Level 2) ────────────────
// Professional Bloomberg-terminal-style stock analysis page with:
// 1. Interactive Chart with TradingView lightweight-charts (timeframes: 1D/1W/1M/3M/6M/1Y/5Y, chart types, volume, SMA toggles, Bollinger Bands)
// 2. Fundamental Data Panel (tabbed: Overview, Income, Balance, Cash Flow)
// 3. Visual Scorecard (Signal, Confidence gauge, Tech/Fundamental gauges, Risk)
// 4. Comprehensive Data Suite (Price, Technicals, Trade Setup, Analyst, Peers)
// 5. Stock Comparison Tool (up to 6 stocks side by side with winner highlight)
// 6. Watchlist Star Button (localStorage persistence)
// 7. SWOT Analysis with session caching
// 8. Enhanced skeleton loading
// Shared across all locales (EN/AR/FR).

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Locale } from '@/lib/locale';
import { getLocalePath } from '@/lib/locale';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, Minus, ShieldAlert, ShieldCheck,
  Activity, BarChart3, Layers, ArrowUpRight, ArrowDownRight,
  Plus, X, Search, Eye, FileText, Cpu, GitCompareArrows,
  Target, DollarSign, Gauge, AlertTriangle, ChevronLeft,
  ChevronRight, Sparkles, CircleDot, Landmark, Brain, Star,
  Lightbulb, Wallet, Crown,
} from 'lucide-react';

// Level 2: Advanced feature components
import SentimentWidget from './SentimentWidget';
import AIRecommendations from './AIRecommendations';
import SWOTAnalysis from './SWOTAnalysis';
import PaperTrading from './PaperTrading';
import FairValueCalculator from './FairValueCalculator';
import SmartAlerts from './SmartAlerts';
import SectorAnalysisWidget from './SectorAnalysisWidget';

// Dynamic import for lightweight-charts (SSR-incompatible)
const LightweightChart = dynamic(() => import('./LightweightChartWrapper'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 400, background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text3)', fontSize: 13 }}>Loading chart...</span>
    </div>
  ),
});

// ── Locale Labels ──

const LABELS: Record<string, Record<string, string>> = {
  en: {
    backToStocks: 'Back to Stock Analysis',
    companyProfile: 'Company Profile',
    exchange: 'Exchange',
    sector: 'Sector',
    industry: 'Industry',
    country: 'Country',
    technicalAnalysis: 'Technical Analysis',
    rsi: 'RSI (14)',
    macdSignal: 'MACD Signal',
    bollingerBands: 'Bollinger Bands',
    support: 'Support',
    resistance: 'Resistance',
    ma50: '50-Day MA',
    ma200: '200-Day MA',
    adx: 'ADX',
    stochastic: 'Stochastic',
    atr: 'ATR',
    fundamentalData: 'Fundamental Data',
    pe: 'P/E Ratio',
    eps: 'EPS',
    marketCap: 'Market Cap',
    dividendYield: 'Dividend Yield',
    roe: 'ROE',
    roa: 'ROA',
    tradeSetup: 'Trade Setup',
    entry: 'Entry Price',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    riskReward: 'Risk / Reward',
    aiAnalysis: 'AI Analysis',
    confidence: 'Confidence Score',
    signal: 'Signal',
    riskLevel: 'Risk Level',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    overbought: 'Overbought',
    oversold: 'Oversold',
    candlestick: 'Candlestick',
    line: 'Line',
    upper: 'Upper',
    lower: 'Lower',
    loading: 'Loading stock data...',
    error: 'Failed to load stock data',
    retry: 'Retry',
    notFound: 'Stock not found',
    goBack: 'Go back',
    disclaimer: 'This content is AI-generated for informational purposes only. Not financial advice. Past performance does not guarantee future results. Consult a licensed financial advisor before making investment decisions.',
    priceDetails: 'Price Details',
    open: 'Open',
    dayHigh: 'High',
    dayLow: 'Low',
    close: 'Close',
    volume: 'Volume',
    prevClose: 'Prev Close',
    publishedAt: 'Published',
    validUntil: 'Valid Until',
    price: 'Price',
    // Level 1 new labels
    overview: 'Overview',
    financials: 'Financials',
    technical: 'Technical',
    comparison: 'Compare',
    scorecard: 'Scorecard',
    priceChart: 'Price Chart',
    period1D: '1D',
    period1W: '1W',
    period1M: '1M',
    period3M: '3M',
    period6M: '6M',
    period1Y: '1Y',
    period5Y: '5Y',
    sma20: 'SMA 20',
    sma50: 'SMA 50',
    bollingerBandsToggle: 'Bollinger',
    volumeOverlay: 'Volume',
    incomeStatement: 'Income Statement',
    balanceSheet: 'Balance Sheet',
    cashFlow: 'Cash Flow',
    revenue: 'Revenue',
    grossProfit: 'Gross Profit',
    operatingIncome: 'Operating Income',
    netIncome: 'Net Income',
    totalAssets: 'Total Assets',
    totalLiabilities: 'Total Liabilities',
    totalEquity: 'Total Equity',
    cash: 'Cash & Equivalents',
    totalDebt: 'Total Debt',
    operatingCF: 'Operating Cash Flow',
    capEx: 'Capital Expenditure',
    freeCashFlow: 'Free Cash Flow',
    addSymbol: 'Add Symbol',
    noPeers: 'No peer data available',
    peersList: 'Industry Peers',
    fiscalYear: 'Fiscal Year',
    noFinancialData: 'No financial data available',
    analystRating: 'Analyst Rating',
    priceTarget: 'Price Target',
    targetLow: 'Low Target',
    targetMedian: 'Median Target',
    targetHigh: 'High Target',
    fairValue: 'Fair Value',
    vsCurrent: 'vs Current',
    direction: 'Direction',
    long: 'Long',
    short: 'Short',
    wait: 'Wait',
    beta: 'Beta',
    weekRange52: '52-Week Range',
    grossMargin: 'Gross Margin',
    operatingMargin: 'Operating Margin',
    netMargin: 'Net Margin',
    debtToEquity: 'Debt/Equity',
    currentRatio: 'Current Ratio',
    technicalScore: 'Tech Score',
    fundamentalScore: 'Fund. Score',
    extreme: 'Extreme',
    noChartData: 'No chart data available',
    loadingComparison: 'Loading comparison...',
    // Watchlist
    addToWatchlist: 'Add to watchlist',
    removeFromWatchlist: 'Remove from watchlist',
    // Level 2 tab labels
    insights: 'Insights',
    tools: 'Tools',
    sentimentAnalysis: 'Sentiment Analysis',
    aiRecommendation: 'AI Recommendation',
    swotAnalysis: 'SWOT Analysis',
    fairValueCalc: 'Fair Value Calculator',
    paperTrading: 'Paper Trading',
    smartAlerts: 'Smart Alerts',
    sectorAnalysis: 'Sector Analysis',
    // Comparison improvements
    bestValue: 'Best',
    maxStocksReached: 'Max 6 stocks',
    fundamentalsTab: 'Fundamentals',
  },
  ar: {
    backToStocks: 'العودة لتحليل الأسهم',
    companyProfile: 'ملف الشركة',
    exchange: 'البورصة',
    sector: 'القطاع',
    industry: 'الصناعة',
    country: 'الدولة',
    technicalAnalysis: 'التحليل الفني',
    rsi: 'RSI (14)',
    macdSignal: 'إشارة MACD',
    bollingerBands: 'نطاقات بولينجر',
    support: 'الدعم',
    resistance: 'المقاومة',
    ma50: 'المتوسط 50 يوم',
    ma200: 'المتوسط 200 يوم',
    adx: 'ADX',
    stochastic: 'الاستوكاستك',
    atr: 'ATR',
    fundamentalData: 'البيانات الأساسية',
    pe: 'نسبة م/ر',
    eps: 'ربحية السهم',
    marketCap: 'القيمة السوقية',
    dividendYield: 'عائد التوزيعات',
    roe: 'العائد على حقوق الملكية',
    roa: 'العائد على الأصول',
    tradeSetup: 'إعداد التداول',
    entry: 'سعر الدخول',
    stopLoss: 'وقف الخسارة',
    takeProfit: 'جني الأرباح',
    riskReward: 'المخاطرة / العائد',
    aiAnalysis: 'تحليل الذكاء الاصطناعي',
    confidence: 'درجة الثقة',
    signal: 'الإشارة',
    riskLevel: 'مستوى المخاطر',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    bullish: 'صاعد',
    bearish: 'هابط',
    neutral: 'محايد',
    overbought: 'ذوو شراء',
    oversold: 'ذوو بيع',
    candlestick: 'شموع',
    line: 'خطي',
    upper: 'العلوي',
    lower: 'السفلي',
    loading: 'جاري تحميل بيانات السهم...',
    error: 'فشل تحميل بيانات السهم',
    retry: 'إعادة المحاولة',
    notFound: 'السهم غير موجود',
    goBack: 'العودة',
    disclaimer: 'هذا المحتوى مُولّد بالذكاء الاصطناعي لأغراض إعلامية فقط. ليس نصيحة مالية. الأداء السابق لا يضمن النتائج المستقبلية. استشر مستشاراً مالياً مرخصاً قبل اتخاذ أي قرارات استثمارية.',
    priceDetails: 'تفاصيل السعر',
    open: 'الافتتاح',
    dayHigh: 'الأعلى',
    dayLow: 'الأدنى',
    close: 'الإغلاق',
    volume: 'الحجم',
    prevClose: 'إغلاق سابق',
    publishedAt: 'تاريخ النشر',
    validUntil: 'صالح حتى',
    price: 'السعر',
    overview: 'نظرة عامة',
    financials: 'المالية',
    technical: 'الفني',
    comparison: 'مقارنة',
    scorecard: 'بطاقة التقييم',
    priceChart: 'الرسم البياني',
    period1D: '١يوم',
    period1W: '١أسبوع',
    period1M: '١شهر',
    period3M: '٣شهر',
    period6M: '٦شهر',
    period1Y: '١سنة',
    period5Y: '٥سنة',
    sma20: 'المتوسط ٢٠',
    sma50: 'المتوسط ٥٠',
    bollingerBandsToggle: 'بولينجر',
    volumeOverlay: 'الحجم',
    incomeStatement: 'قائمة الدخل',
    balanceSheet: 'الميزانية العمومية',
    cashFlow: 'التدفقات النقدية',
    revenue: 'الإيرادات',
    grossProfit: 'إجمالي الربح',
    operatingIncome: 'الدخل التشغيلي',
    netIncome: 'صافي الدخل',
    totalAssets: 'إجمالي الأصول',
    totalLiabilities: 'إجمالي الالتزامات',
    totalEquity: 'إجمالي حقوق المساهمين',
    cash: 'النقد وما في حكمه',
    totalDebt: 'إجمالي الديون',
    operatingCF: 'التدفق النقدي التشغيلي',
    capEx: 'الإنفاق الرأسمالي',
    freeCashFlow: 'التدفق النقدي الحر',
    addSymbol: 'أضف رمز',
    noPeers: 'لا توجد بيانات نظير متاحة',
    peersList: 'شركات القطاع',
    fiscalYear: 'السنة المالية',
    noFinancialData: 'لا توجد بيانات مالية متاحة',
    analystRating: 'تقييم المحللين',
    priceTarget: 'هدف السعر',
    targetLow: 'الهدف الأدنى',
    targetMedian: 'الهدف الوسيط',
    targetHigh: 'الهدف الأعلى',
    fairValue: 'القيمة العادلة',
    vsCurrent: 'مقابل الحالي',
    direction: 'الاتجاه',
    long: 'شراء',
    short: 'بيع',
    wait: 'انتظار',
    beta: 'بيتا',
    weekRange52: 'نطاق ٥٢ أسبوع',
    grossMargin: 'هامش الربح الإجمالي',
    operatingMargin: 'هامش التشغيل',
    netMargin: 'هامش صافي الربح',
    debtToEquity: 'الدين/حقوق المساهمين',
    currentRatio: 'نسبة التداول',
    technicalScore: 'الدرجة الفنية',
    fundamentalScore: 'الدرجة الأساسية',
    extreme: 'شديد',
    noChartData: 'لا توجد بيانات رسم بياني متاحة',
    loadingComparison: 'جاري تحميل المقارنة...',
    addToWatchlist: 'إضافة للمتابعة',
    removeFromWatchlist: 'إزالة من المتابعة',
    insights: 'رؤى',
    tools: 'أدوات',
    sentimentAnalysis: 'تحليل المشاعر',
    aiRecommendation: 'توصية الذكاء الاصطناعي',
    swotAnalysis: 'تحليل SWOT',
    fairValueCalc: 'حاسبة القيمة العادلة',
    paperTrading: 'التداول الورقي',
    smartAlerts: 'التنبيهات الذكية',
    sectorAnalysis: 'تحليل القطاع',
    bestValue: 'الأفضل',
    maxStocksReached: 'الحد الأقصى ٦ أسهم',
    fundamentalsTab: 'البيانات الأساسية',
  },
  fr: {
    backToStocks: "Retour à l'Analyse Actions",
    companyProfile: "Profil de l'Entreprise",
    exchange: 'Bourse',
    sector: 'Secteur',
    industry: 'Industrie',
    country: 'Pays',
    technicalAnalysis: 'Analyse Technique',
    rsi: 'RSI (14)',
    macdSignal: 'Signal MACD',
    bollingerBands: 'Bandes de Bollinger',
    support: 'Support',
    resistance: 'Résistance',
    ma50: 'MM 50 jours',
    ma200: 'MM 200 jours',
    adx: 'ADX',
    stochastic: 'Stochastique',
    atr: 'ATR',
    fundamentalData: 'Données Fondamentales',
    pe: 'Ratio P/E',
    eps: 'BPA',
    marketCap: 'Cap. Boursière',
    dividendYield: 'Rend. Dividende',
    roe: 'ROE',
    roa: 'ROA',
    tradeSetup: 'Configuration de Trading',
    entry: "Prix d'Entrée",
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    riskReward: 'Risque / Rendement',
    aiAnalysis: 'Analyse IA',
    confidence: 'Score de Confiance',
    signal: 'Signal',
    riskLevel: 'Niveau de Risque',
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    overbought: 'Surachat',
    oversold: 'Survente',
    candlestick: 'Bougie',
    line: 'Ligne',
    upper: 'Supérieur',
    lower: 'Inférieur',
    loading: 'Chargement des données...',
    error: 'Échec du chargement',
    retry: 'Réessayer',
    notFound: 'Action introuvable',
    goBack: 'Retour',
    disclaimer: "Ce contenu est généré par IA à titre informatif uniquement. Non un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Consultez un conseiller financier agréé avant de prendre des décisions d'investissement.",
    priceDetails: 'Détails du Prix',
    open: 'Ouverture',
    dayHigh: 'Plus Haut',
    dayLow: 'Plus Bas',
    close: 'Clôture',
    volume: 'Volume',
    prevClose: 'Clôture Préc.',
    publishedAt: 'Publié le',
    validUntil: "Valide jusqu'au",
    price: 'Prix',
    overview: 'Aperçu',
    financials: 'Finances',
    technical: 'Technique',
    comparison: 'Comparer',
    scorecard: 'Carte de Score',
    priceChart: 'Graphique',
    period1D: '1J',
    period1W: '1S',
    period1M: '1M',
    period3M: '3M',
    period6M: '6M',
    period1Y: '1A',
    period5Y: '5A',
    sma20: 'MM 20',
    sma50: 'MM 50',
    bollingerBandsToggle: 'Bollinger',
    volumeOverlay: 'Volume',
    incomeStatement: 'Compte de Résultat',
    balanceSheet: 'Bilan',
    cashFlow: 'Flux de Trésorerie',
    revenue: "Chiffre d'affaires",
    grossProfit: 'Bénéfice Brut',
    operatingIncome: "Résultat d'Exploitation",
    netIncome: 'Bénéfice Net',
    totalAssets: 'Total Actifs',
    totalLiabilities: 'Total Passifs',
    totalEquity: 'Capitaux Propres',
    cash: 'Trésorerie',
    totalDebt: 'Dette Totale',
    operatingCF: "Flux d'Exploitation",
    capEx: "Dépenses d'Investissement",
    freeCashFlow: 'Flux de Trésorerie Libre',
    addSymbol: 'Ajouter Symbole',
    noPeers: 'Aucune donnée de pairs disponible',
    peersList: 'Pairs du Secteur',
    fiscalYear: 'Exercice',
    noFinancialData: 'Aucune donnée financière disponible',
    analystRating: 'Évaluation Analystes',
    priceTarget: 'Objectif de Prix',
    targetLow: 'Objectif Bas',
    targetMedian: 'Objectif Médian',
    targetHigh: 'Objectif Haut',
    fairValue: 'Valeur Juste',
    vsCurrent: 'vs Actuel',
    direction: 'Direction',
    long: 'Long',
    short: 'Short',
    wait: 'Attendre',
    beta: 'Bêta',
    weekRange52: 'Plage 52 Semaines',
    grossMargin: 'Marge Brute',
    operatingMargin: "Marge d'Exploitation",
    netMargin: 'Marge Nette',
    debtToEquity: 'Dette/Fonds Propres',
    currentRatio: 'Ratio de Liquidité',
    technicalScore: 'Score Tech',
    fundamentalScore: 'Score Fond.',
    extreme: 'Extrême',
    noChartData: 'Aucune donnée de graphique disponible',
    loadingComparison: 'Chargement de la comparaison...',
    addToWatchlist: 'Ajouter à la liste',
    removeFromWatchlist: 'Retirer de la liste',
    insights: 'Insights',
    tools: 'Outils',
    sentimentAnalysis: 'Analyse de Sentiment',
    aiRecommendation: 'Recommandation IA',
    swotAnalysis: 'Analyse SWOT',
    fairValueCalc: 'Calculateur de Valeur Juste',
    paperTrading: 'Trading Papier',
    smartAlerts: 'Alertes Intelligentes',
    sectorAnalysis: 'Analyse Sectorielle',
    bestValue: 'Meilleur',
    maxStocksReached: 'Max 6 actions',
    fundamentalsTab: 'Fondamentaux',
  },
  tr: {
    backToStocks: 'Hisse Analizine Dön',
    companyProfile: 'Şirket Profili',
    exchange: 'Borsa',
    sector: 'Sektör',
    industry: 'Endüstri',
    country: 'Ülke',
    technicalAnalysis: 'Teknik Analiz',
    rsi: 'RSI (14)',
    macdSignal: 'MACD Sinyali',
    bollingerBands: 'Bollinger Bantları',
    support: 'Destek',
    resistance: 'Direnç',
    ma50: '50 Günlük MO',
    ma200: '200 Günlük MO',
    adx: 'ADX',
    stochastic: 'Stokastik',
    atr: 'ATR',
    fundamentalData: 'Temel Veriler',
    pe: 'F/K Oranı',
    eps: 'Hisse Başı Kazanç',
    marketCap: 'Piyasa Değeri',
    dividendYield: 'Temettü Verimi',
    roe: 'Özkaynak Getirisi',
    roa: 'Varlık Getirisi',
    tradeSetup: 'İşlem Kurulumu',
    entry: 'Giriş Fiyatı',
    stopLoss: 'Zarar Durdur',
    takeProfit: 'Kar Al',
    riskReward: 'Risk / Getiri',
    aiAnalysis: 'Yapay Zeka Analizi',
    confidence: 'Güven Skoru',
    signal: 'Sinyal',
    riskLevel: 'Risk Seviyesi',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    neutral: 'Nötr',
    overbought: 'Aşırı Alım',
    oversold: 'Aşırı Satım',
    candlestick: 'Mum',
    line: 'Çizgi',
    upper: 'Üst',
    lower: 'Alt',
    loading: 'Hisse verileri yükleniyor...',
    error: 'Hisse verileri yüklenemedi',
    retry: 'Tekrar Dene',
    notFound: 'Hisse bulunamadı',
    goBack: 'Geri dön',
    disclaimer: 'Bu içerik yalnızca bilgilendirme amaçlı yapay zeka tarafından oluşturulmuştur. Yatırım tavsiyesi niteliği taşımaz. Geçmiş performans gelecekteki sonuçları garanti etmez. Yatırım kararları vermeden önce lisanslı bir finansal danışmana başvurunuz.',
    priceDetails: 'Fiyat Detayları',
    open: 'Açılış',
    dayHigh: 'Yüksek',
    dayLow: 'Düşük',
    close: 'Kapanış',
    volume: 'Hacim',
    prevClose: 'Önceki Kapanış',
    publishedAt: 'Yayınlanma',
    validUntil: 'Geçerlilik',
    price: 'Fiyat',
    overview: 'Genel Bakış',
    financials: 'Finansallar',
    technical: 'Teknik',
    comparison: 'Karşılaştır',
    scorecard: 'Puan Kartı',
    priceChart: 'Fiyat Grafiği',
    period1D: '1G',
    period1W: '1H',
    period1M: '1A',
    period3M: '3A',
    period6M: '6A',
    period1Y: '1Y',
    period5Y: '5Y',
    sma20: 'SMA 20',
    sma50: 'SMA 50',
    bollingerBandsToggle: 'Bollinger',
    volumeOverlay: 'Hacim',
    incomeStatement: 'Gelir Tablosu',
    balanceSheet: 'Bilanço',
    cashFlow: 'Nakit Akışı',
    revenue: 'Gelir',
    grossProfit: 'Brüt Kâr',
    operatingIncome: 'Faaliyet Kârı',
    netIncome: 'Net Kâr',
    totalAssets: 'Toplam Varlıklar',
    totalLiabilities: 'Toplam Yükümlülükler',
    totalEquity: 'Toplam Özkaynak',
    cash: 'Nakit ve Benzerler',
    totalDebt: 'Toplam Borç',
    operatingCF: 'Faaliyet Nakit Akışı',
    capEx: 'Sermaye Harcaması',
    freeCashFlow: 'Serbest Nakit Akışı',
    addSymbol: 'Sembol Ekle',
    noPeers: 'Eşleşme verisi mevcut değil',
    peersList: 'Sektör Eşleşmeleri',
    fiscalYear: 'Mali Yıl',
    noFinancialData: 'Finansal veri mevcut değil',
    analystRating: 'Analist Derecesi',
    priceTarget: 'Fiyat Hedefi',
    targetLow: 'Düşük Hedef',
    targetMedian: 'Medyan Hedef',
    targetHigh: 'Yüksek Hedef',
    fairValue: 'Adil Değer',
    vsCurrent: 'Mevcut ile',
    direction: 'Yön',
    long: 'Long',
    short: 'Short',
    wait: 'Bekle',
    beta: 'Beta',
    weekRange52: '52 Haftalık Aralık',
    grossMargin: 'Brüt Marj',
    operatingMargin: 'Faaliyet Marjı',
    netMargin: 'Net Marj',
    debtToEquity: 'Borç/Özkaynak',
    currentRatio: 'Cari Oran',
    technicalScore: 'Tek. Puan',
    fundamentalScore: 'Tem. Puan',
    extreme: 'Aşırı',
    noChartData: 'Grafik verisi mevcut değil',
    loadingComparison: 'Karşılaştırma yükleniyor...',
    addToWatchlist: 'İzlemeye ekle',
    removeFromWatchlist: 'İzlemeden çıkar',
    insights: 'İçgörüler',
    tools: 'Araçlar',
    sentimentAnalysis: 'Duygu Analizi',
    aiRecommendation: 'Yapay Zeka Tavsiyesi',
    swotAnalysis: 'SWOT Analizi',
    fairValueCalc: 'Adil Değer Hesaplayıcı',
    paperTrading: 'Sanal İşlem',
    smartAlerts: 'Akıllı Uyarılar',
    sectorAnalysis: 'Sektör Analizi',
    bestValue: 'En İyi',
    maxStocksReached: 'Maks 6 hisse',
    fundamentalsTab: 'Temel Veriler',
  },
  es: {
    backToStocks: 'Volver al Análisis de Acciones',
    companyProfile: 'Perfil de Empresa',
    exchange: 'Bolsa',
    sector: 'Sector',
    industry: 'Industria',
    country: 'País',
    technicalAnalysis: 'Análisis Técnico',
    rsi: 'RSI (14)',
    macdSignal: 'Señal MACD',
    bollingerBands: 'Bandas de Bollinger',
    support: 'Soporte',
    resistance: 'Resistencia',
    ma50: 'Media 50 días',
    ma200: 'Media 200 días',
    adx: 'ADX',
    stochastic: 'Estocástico',
    atr: 'ATR',
    fundamentalData: 'Datos Fundamentales',
    pe: 'Ratio P/E',
    eps: 'BPA',
    marketCap: 'Cap. de Mercado',
    dividendYield: 'Rendimiento del Dividendo',
    roe: 'ROE',
    roa: 'ROA',
    tradeSetup: 'Configuración de Trading',
    entry: 'Precio de Entrada',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    riskReward: 'Riesgo / Beneficio',
    aiAnalysis: 'Análisis IA',
    confidence: 'Puntuación de Confianza',
    signal: 'Señal',
    riskLevel: 'Nivel de Riesgo',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    overbought: 'Sobrecomprado',
    oversold: 'Sobrevendido',
    candlestick: 'Vela',
    line: 'Línea',
    upper: 'Superior',
    lower: 'Inferior',
    loading: 'Cargando datos de la acción...',
    error: 'Error al cargar los datos de la acción',
    retry: 'Reintentar',
    notFound: 'Acción no encontrada',
    goBack: 'Volver',
    disclaimer: 'Este contenido es generado por IA con fines informativos únicamente. No constituye asesoramiento financiero. El rendimiento pasado no garantiza resultados futuros. Consulte a un asesor financiero autorizado antes de tomar decisiones de inversión.',
    priceDetails: 'Detalles del Precio',
    open: 'Apertura',
    dayHigh: 'Máximo',
    dayLow: 'Mínimo',
    close: 'Cierre',
    volume: 'Volumen',
    prevClose: 'Cierre Anterior',
    publishedAt: 'Publicado',
    validUntil: 'Válido hasta',
    price: 'Precio',
    overview: 'Resumen',
    financials: 'Finanzas',
    technical: 'Técnico',
    comparison: 'Comparar',
    scorecard: 'Cuadro de Puntuación',
    priceChart: 'Gráfico de Precios',
    period1D: '1D',
    period1W: '1S',
    period1M: '1M',
    period3M: '3M',
    period6M: '6M',
    period1Y: '1A',
    period5Y: '5A',
    sma20: 'SMA 20',
    sma50: 'SMA 50',
    bollingerBandsToggle: 'Bollinger',
    volumeOverlay: 'Volumen',
    incomeStatement: 'Cuenta de Resultados',
    balanceSheet: 'Balance',
    cashFlow: 'Flujo de Caja',
    revenue: 'Ingresos',
    grossProfit: 'Beneficio Bruto',
    operatingIncome: 'Beneficio Operativo',
    netIncome: 'Beneficio Neto',
    totalAssets: 'Total Activos',
    totalLiabilities: 'Total Pasivos',
    totalEquity: 'Patrimonio Neto',
    cash: 'Efectivo y Equivalentes',
    totalDebt: 'Deuda Total',
    operatingCF: 'Flujo de Caja Operativo',
    capEx: 'Gastos de Capital',
    freeCashFlow: 'Flujo de Caja Libre',
    addSymbol: 'Añadir Símbolo',
    noPeers: 'No hay datos de empresas comparables',
    peersList: 'Empresas del Sector',
    fiscalYear: 'Ejercicio Fiscal',
    noFinancialData: 'No hay datos financieros disponibles',
    analystRating: 'Calificación de Analistas',
    priceTarget: 'Precio Objetivo',
    targetLow: 'Objetivo Bajo',
    targetMedian: 'Objetivo Mediano',
    targetHigh: 'Objetivo Alto',
    fairValue: 'Valor Justo',
    vsCurrent: 'vs Actual',
    direction: 'Dirección',
    long: 'Long',
    short: 'Short',
    wait: 'Esperar',
    beta: 'Beta',
    weekRange52: 'Rango de 52 Semanas',
    grossMargin: 'Margen Bruto',
    operatingMargin: 'Margen Operativo',
    netMargin: 'Margen Neto',
    debtToEquity: 'Deuda/Patrimonio',
    currentRatio: 'Ratio de Liquidez',
    technicalScore: 'Punt. Técnico',
    fundamentalScore: 'Punt. Fundam.',
    extreme: 'Extremo',
    noChartData: 'No hay datos de gráfico disponibles',
    loadingComparison: 'Cargando comparación...',
    addToWatchlist: 'Agregar a Lista',
    removeFromWatchlist: 'Eliminar de Lista',
    insights: 'Perspectivas',
    tools: 'Herramientas',
    sentimentAnalysis: 'Análisis de Sentimiento',
    aiRecommendation: 'Recomendación IA',
    swotAnalysis: 'Análisis DAFO',
    fairValueCalc: 'Calculadora de Valor Justo',
    paperTrading: 'Trading en Papel',
    smartAlerts: 'Alertas Inteligentes',
    sectorAnalysis: 'Análisis Sectorial',
    bestValue: 'Mejor',
    maxStocksReached: 'Máx. 6 acciones',
    fundamentalsTab: 'Fundamentales',
  },
};

const SIGNAL_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  bullish: { color: 'var(--bull)', bg: 'var(--bull2)', border: 'rgba(34,197,94,0.3)' },
  bearish: { color: 'var(--bear)', bg: 'var(--bear2)', border: 'rgba(239,83,80,0.3)' },
  neutral: { color: 'var(--gold)', bg: 'var(--gold2)', border: 'rgba(255,184,0,0.3)' },
};

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  low: { color: 'var(--bull)', bg: 'var(--bull2)' },
  medium: { color: 'var(--gold)', bg: 'var(--gold2)' },
  high: { color: 'var(--bear)', bg: 'var(--bear2)' },
  extreme: { color: 'var(--bear)', bg: 'var(--bear2)' },
};

// Signal rank for comparison winner
const SIGNAL_RANK: Record<string, number> = { bullish: 3, neutral: 2, bearish: 1 };

// ── Circular Gauge Component ──
function CircularGauge({ value, maxValue, label, color, size = 100 }: {
  value: number;
  maxValue: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / maxValue));
  const progress = pct * circumference;
  const fillColor = color || (pct >= 0.7 ? 'var(--bull)' : pct >= 0.4 ? 'var(--gold)' : 'var(--bear)');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg4)" strokeWidth="6" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={fillColor} strokeWidth="6"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size >= 120 ? 22 : 18, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
            {typeof value === 'number' ? Math.round(value) : '—'}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

// ── Horizontal Gauge Bar Component ──
function GaugeBar({ value, maxValue, label, leftLabel, rightLabel }: {
  value: number;
  maxValue: number;
  label: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const fillColor = pct >= 70 ? 'var(--bull)' : pct >= 40 ? 'var(--gold)' : 'var(--bear)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: fillColor, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
          {Math.round(value)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--bg4)', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: `${pct}%`, borderRadius: 4,
            background: fillColor,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      {leftLabel && rightLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: 'var(--text3)' }}>{leftLabel}</span>
          <span style={{ fontSize: 9, color: 'var(--text3)' }}>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Mini Score Bar (for comparison) ──
function MiniScoreBar({ value, maxValue, color }: { value: number; maxValue: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const barColor = color || (pct >= 70 ? 'var(--bull)' : pct >= 40 ? 'var(--gold)' : 'var(--bear)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--bg4)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: barColor, fontFamily: 'var(--font-jetbrains-mono), monospace', minWidth: 24 }} suppressHydrationWarning>
        {Math.round(value)}
      </span>
    </div>
  );
}

// ── Arabic → Target Language Translation for AI Analysis Content ──
// When the DB has only Arabic analysis, we translate it for non-Arabic locales.

const AR_TRANSLATE_MAP: Record<string, [RegExp, string][]> = {
  es: [
    // ═══ LONGEST PHRASES FIRST (critical for correct matching) ═══
    // Strategy intro (full sentences)
    [/بناءً على تحليلات المجلس المختلفة، يُنصح بالتوجه إلى استراتيجية/gi, 'Basándose en los diversos análisis del consejo, se recomienda adoptar una estrategia de'],
    [/استنادًا إلى التحليلات المتعددة من مختلف الخبراء، يمكن تلخيص/gi, 'Basándose en los múltiples análisis de diversos expertos, se puede resumir'],
    [/هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية/gi, 'Este análisis es solo con fines educativos y no constituye asesoramiento de inversión'],
    [/التحليل الفني يشير لاتجاه صاعد محتمل/gi, 'El análisis técnico sugiere una tendencia alcista potencial'],
    [/التحليل الفني يشير لاتجاه هابط محتمل/gi, 'El análisis técnico sugiere una tendencia bajista potencial'],
    [/التحليل الفني يشير لفرصة معقولة/gi, 'El análisis técnico sugiere una oportunidad razonable'],
    [/السوق متذبذب بدون اتجاه واضح/gi, 'El mercado es volátil sin dirección clara'],
    [/بيانات غير كافية لتحديد اتجاه واضح/gi, 'Datos insuficientes para determinar una dirección clara'],
    [/ينصح بالانتظار لتأكيد إضافي/gi, 'Se recomienda esperar una confirmación adicional'],
    [/تقاطع المتوسطات المتحركة يؤكد الاتجاه/gi, 'El cruce de medias móviles confirma la dirección'],
    [/تقاطع MACD يدعم الصفقة/gi, 'El cruce MACD respalda la operación'],
    [/السعر عند مستوى دعم\/مقاومة رئيسي/gi, 'El precio en nivel clave de soporte/resistencia'],
    // Detailed analysis phrases (from AI council analysis)
    [/قد يستمر السعر في الانخفاض بشكل كبير/gi, 'El precio puede seguir cayendo significativamente'],
    [/قد تكون المشاعر الزائدة سببًا في انعكاس مفاجئ للاتجاه/gi, 'Los sentimientos excesivos pueden causar un cambio repentino de dirección'],
    [/المشاعر الإيجابية قد تكون متحيزةً/gi, 'Los sentimientos positivos pueden estar sesgados'],
    [/قد تكون المخاطرة مقبولة/gi, 'El riesgo puede ser aceptable'],
    [/المؤشرات الاقتصادية تدعم/gi, 'Los indicadores económicos respaldan'],
    [/استمرار الضعف الاقتصادي قد يؤدي إلى انخفاض أكبر/gi, 'La continuación de la debilidad económica puede llevar a una mayor caída'],
    [/الأنماط الفنية تدعم الهبوط/gi, 'Los patrones técnicos respaldan el descenso'],
    [/قد تستمر الأنماط في الإشارة إلى انخفاض مستمر/gi, 'Los patrones pueden seguir indicando una caída continua'],
    [/قد تكون استراتيجيات التنفيذ متحيزة/gi, 'Las estrategias de ejecución pueden estar sesgadas'],
    [/قد يؤدي تنفيذ الاستراتيجيات إلى خسائر/gi, 'La ejecución de las estrategias puede llevar a pérdidas'],
    [/التباين يشير إلى عدم استقرار وهبوط محتمل/gi, 'La divergencia indica inestabilidad y posible descenso'],
    [/قد يرتفع التباين بشكل كبير مما يؤدي إلى انخفاض سريع/gi, 'La divergencia puede aumentar significativamente, provocando una caída rápida'],
    [/معظم التحليلات تدعم/gi, 'La mayoría de los análisis respaldan'],
    [/مما يشير إلى أن/gi, 'lo que indica que'],
    [/قد يستمر في الهبوط/gi, 'puede seguir cayendo'],
    [/هناك تضارب في التحليلات بين/gi, 'Hay conflicto en los análisis entre'],
    [/يجب الانتباه إلى احتمال انعكاس مفاجئ في المشاعر أو السوق/gi, 'Se debe prestar atención a la posibilidad de un cambio repentino en los sentimientos o el mercado'],
    [/بالنظر إلى غالبية التحليلات التي توصي/gi, 'Teniendo en cuenta la mayoría de los análisis que recomiendan'],
    [/مع التركيز على الاتجاهات السلبية والمخاطر المحتملة/gi, 'con el enfoque en las tendencias negativas y los riesgos potenciales'],
    [/فإن استراتيجية التداول النهائية هي/gi, 'la estrategia de trading final es'],
    [/مع التركيز على المراقبة المستمرة للتغيرات في السوق/gi, 'con el enfoque en la monitorización continua de los cambios en el mercado'],
    [/انخفاض قيمة العملة بشكل غير متوقع/gi, 'Caída inesperada del valor de la moneda'],
    [/إذا لم تتغير السوق بشكل مفاجئ/gi, 'si el mercado no cambia repentinamente'],
    [/خاصة مع وجود تحليلات إيجابية قوية/gi, 'especialmente con análisis positivos fuertes'],
    [/يشير إلى اتجاه هبوطي قوي/gi, 'Indica una tendencia bajista fuerte'],
    [/سابقة بناءً على التحليل الفني \(محلي\)/gi, 'basado en el análisis técnico (local)'],
    // ═══ HEADINGS & STRUCTURE ═══
    [/الملخص التنفيذي/gi, 'Resumen Ejecutivo'],
    [/التحليل الفني/gi, 'Análisis Técnico'],
    [/الدعم والمقاومة|مستويات الدعم والمقاومة|مستويات الدعم/gi, 'Soporte y Resistencia'],
    [/المؤشرات الفنية/gi, 'Indicadores Técnicos'],
    [/لمحة أساسية/gi, 'Perspectiva Fundamental'],
    [/التوقعات السوقية|السيناريو الصعودي/gi, 'Expectativas del Mercado'],
    [/تقييم المخاطر/gi, 'Evaluación de Riesgos'],
    [/التوصية النهائية/gi, 'Recomendación Final'],
    [/تنويه هام/gi, 'Aviso Legal'],
    [/إعداد التداول/gi, 'Configuración de Trading'],
    [/سياق الأخبار/gi, 'Contexto de Noticias'],
    [/تنبيه المخاطر/gi, 'Advertencia de Riesgo'],
    [/تنبيهات المخاطر/gi, 'Alertas de riesgo'],
    [/تحليل شامل/gi, 'Análisis exhaustivo'],
    [/الخلاصة/gi, 'Conclusión'],
    // Strategy
    [/الاستراتيجية النهائية للتداول على/gi, 'Estrategia final de trading en'],
    [/استراتيجية التداول النهائية/gi, 'Estrategia de trading final'],
    [/على زوج/gi, 'en el par'],
    // Council
    [/محلل السيناريوهات/gi, 'Analista de escenarios'],
    [/المحلل الفني/gi, 'Analista técnico'],
    [/محلل المشاعر/gi, 'Analista de sentimiento'],
    [/خبير المخاطر/gi, 'Experto en riesgos'],
    [/خبير الماكرو/gi, 'Experto macroeconómico'],
    [/خبير الأنماط/gi, 'Experto en patrones'],
    [/استراتيجي التنفيذ/gi, 'Estratega de ejecución'],
    [/محلل التباين/gi, 'Analista de divergencia'],
    [/إجماع المجلس/gi, 'Consenso del consejo'],
    [/نماذج/gi, 'modelos'],
    [/بيع واضح/gi, 'VENTA clara'],
    [/شراء واضح/gi, 'COMPRA clara'],
    [/بنسبة ثقة/gi, 'con una confianza de'],
    // Vote descriptions
    [/تأييد لبيع/gi, 'apoyo a la VENTA'],
    [/تأييد لشراء/gi, 'apoyo a la COMPRA'],
    [/تأييد للحفاظ على المركز الحالي \(HOLD\)/gi, 'recomendación de MANTENER'],
    [/تأييد/gi, 'apoyo'],
    [/الذين يفضلون/gi, 'que favorecen'],
    // Signal types
    [/إشارة شراء/gi, 'Señal de compra'],
    [/إشارة بيع/gi, 'Señal de venta'],
    [/إشارة انتظار/gi, 'Señal de espera'],
    [/بيع \(SELL\)/gi, 'VENTA'],
    [/شراء \(BUY\)/gi, 'COMPRA'],
    [/بيع/gi, 'VENTA'],
    [/شراء/gi, 'COMPRA'],
    // Detailed analysis components
    [/عوامل المخاطر/gi, 'Factores de riesgo'],
    [/أسوأ سيناريو/gi, 'Peor escenario'],
    [/يوصي بـ/gi, 'recomienda'],
    [/يشير إلى/gi, 'Indica'],
    [/اتجاه هبوطي قوي/gi, 'tendencia bajista fuerte'],
    [/قد يستمر السعر في/gi, 'El precio puede seguir'],
    [/بشكل كبير/gi, 'significativamente'],
    [/بشكل غير متوقع/gi, 'de forma inesperada'],
    [/المشاعر المتضاربة/gi, 'Sentimientos contradictorios'],
    [/الحالات الاستثنائية/gi, 'Casos excepcionales'],
    [/الاتجاه العام/gi, 'Tendencia general'],
    [/الضعف الاقتصادي/gi, 'debilidad económica'],
    [/الأنماط الفنية/gi, 'Los patrones técnicos'],
    [/استراتيجيات التنفيذ/gi, 'Las estrategias de ejecución'],
    [/عدم استقرار/gi, 'inestabilidad'],
    [/وهبوط محتمل/gi, 'y posible descenso'],
    [/انخفاض قيمة/gi, 'Caída del valor'],
    [/المراقبة المستمرة/gi, 'monitorización continua'],
    [/التغيرات في السوق/gi, 'los cambios en el mercado'],
    [/مع التركيز على/gi, 'con el enfoque en'],
    [/المخاطر المحتملة/gi, 'los riesgos potenciales'],
    [/الاتجاهات السلبية/gi, 'las tendencias negativas'],
    [/تحليلات إيجابية/gi, 'análisis positivos'],
    [/انعكاس مفاجئ/gi, 'cambio repentino'],
    [/للاتجاه/gi, 'de dirección'],
    [/في المشاعر/gi, 'en los sentimientos'],
    [/أو السوق/gi, 'o el mercado'],
    [/قد تكون/gi, 'pueden ser'],
    [/متحيزة/gi, 'sesgadas'],
    [/سببًا في/gi, 'causa de'],
    [/مما يؤدي إلى/gi, 'lo que provoca'],
    [/قد يؤدي إلى/gi, 'puede llevar a'],
    [/إلى خسائر/gi, 'a pérdidas'],
    [/إلى انخفاض أكبر/gi, 'a una mayor caída'],
    [/إلى انخفاض سريع/gi, 'a una caída rápida'],
    [/العملة/gi, 'la moneda'],
    [/بشكل مفاجئ/gi, 'repentinamente'],
    [/كالآتي/gi, 'como sigue'],
    [/يمكن تلخيص/gi, 'se puede resumir'],
    [/فإن/gi, 'por lo tanto'],
    [/خاصة مع وجود/gi, 'especialmente con'],
    [/بالنظر إلى/gi, 'Teniendo en cuenta'],
    // Technical terms
    [/تباعد RSI/gi, 'Divergencia RSI'],
    [/مؤشر انعكاس قوي/gi, 'señal de reversión fuerte'],
    [/دعم/gi, 'soporte'],
    [/مقاومة/gi, 'resistencia'],
    [/متوسط متحرك/gi, 'Media móvil'],
    [/تقاطع/gi, 'cruce'],
    // News context
    [/مشاعر=/gi, 'Sentimiento='],
    [/لا أخبار متاحة/gi, 'No hay noticias disponibles'],
    [/مخاطر=/gi, 'Riesgo='],
    [/نقاط=/gi, 'Puntos='],
    [/خبر حديث/gi, 'noticia reciente'],
    [/محايد/gi, 'neutral'],
    [/إيجابي/gi, 'positivo'],
    [/سلبي/gi, 'negativo'],
    [/مرتفع/gi, 'alto'],
    [/منخفض/gi, 'bajo'],
    // Connectors
    [/بناءً على/gi, 'Basándose en'],
    [/يُنصح/gi, 'Se recomienda'],
    [/يوصي/gi, 'recomienda'],
    [/و/gi, 'y'],
    // General analysis terms
    [/الاتجاه الصعودي|صاعد/gi, 'alcista'],
    [/الاتجاه الهابط|هابط/gi, 'bajista'],
    [/الهبوط/gi, 'el descenso'],
    [/مستوى/gi, 'nivel'],
    [/نقطة/gi, 'punto'],
    [/هدف/gi, 'objetivo'],
    [/إشارة/gi, 'señal'],
    [/تحليل/gi, 'análisis'],
    [/سعر/gi, 'precio'],
    [/حركة/gi, 'movimiento'],
    [/أداء/gi, 'rendimiento'],
    [/نمو/gi, 'crecimiento'],
    [/أرباح/gi, 'ganancias'],
    [/خسارة/gi, 'pérdida'],
    [/مخاطرة/gi, 'riesgo'],
    [/مخاطر/gi, 'riesgos'],
    [/فرصة/gi, 'oportunidad'],
    [/توصية/gi, 'recomendación'],
    [/استراتيجية/gi, 'estrategia'],
    [/محفظة/gi, 'cartera'],
    [/استثمار/gi, 'inversión'],
    [/تداول/gi, 'trading'],
    [/سهم/gi, 'acción'],
    [/سوق/gi, 'mercado'],
    [/قطاع/gi, 'sector'],
    [/شركة/gi, 'empresa'],
    [/إيرادات/gi, 'ingresos'],
    [/أرباح السهم/gi, 'beneficios por acción'],
    [/مكرر الربحية/gi, 'ratio P/E'],
    [/العائد على حقوق المساهمين/gi, 'ROE'],
    [/الهامش/gi, 'margen'],
    [/الديون/gi, 'deuda'],
    [/التدفقات النقدية/gi, 'flujo de caja'],
    // Additional general words (last resort)
    [/السوق/gi, 'el mercado'],
    [/الاتجاه/gi, 'la tendencia'],
    [/المشاعر/gi, 'Los sentimientos'],
    [/المخاطر/gi, 'los riesgos'],
    [/التحليلات/gi, 'los análisis'],
    [/الأنماط/gi, 'Los patrones'],
    [/التباين/gi, 'La divergencia'],
    [/التغيرات/gi, 'los cambios'],
    [/المراقبة/gi, 'la monitorización'],
    [/الاستقرار/gi, 'la estabilidad'],
    [/الضعف/gi, 'la debilidad'],
    [/الاقتصادي/gi, 'económico'],
    [/الاقتصادية/gi, 'económicos'],
    [/المؤشرات/gi, 'Los indicadores'],
    [/الاستثمارية/gi, 'de inversión'],
    [/الاستثمار/gi, 'la inversión'],
    [/الفرصة/gi, 'la oportunidad'],
    [/التوصية/gi, 'la recomendación'],
    [/الاستراتيجية/gi, 'la estrategia'],
    [/النتيجة/gi, 'el resultado'],
    [/الإيجابية/gi, 'positivos'],
    [/السلبية/gi, 'negativos'],
    [/العملات/gi, 'las monedas'],
    [/التداول/gi, 'el trading'],
    [/الأسعار/gi, 'los precios'],
    [/الأرباح/gi, 'las ganancias'],
    [/الخسائر/gi, 'las pérdidas'],
    [/الفنية/gi, 'técnicos'],
    [/الفني/gi, 'técnico'],
    [/المالية/gi, 'financieros'],
    [/المالي/gi, 'financiero'],
    [/السابقة/gi, 'anteriores'],
    [/القادمة/gi, 'próximos'],
    [/الحالية/gi, 'actuales'],
    [/المستقبل/gi, 'futuro'],
    [/الاحتمال/gi, 'la probabilidad'],
    [/التحسن/gi, 'la mejora'],
    [/التراجع/gi, 'el retroceso'],
    [/الارتفاع/gi, 'el aumento'],
    [/الانخفاض/gi, 'la caída'],
    [/النمو/gi, 'el crecimiento'],
    [/الأداء/gi, 'el rendimiento'],
    [/الحركة/gi, 'el movimiento'],
    [/الاتجاهات/gi, 'las tendencias'],
    [/المستويات/gi, 'los niveles'],
    [/المستوى/gi, 'el nivel'],
    [/النقاط/gi, 'los puntos'],
    [/الهدف/gi, 'el objetivo'],
    [/الأهداف/gi, 'los objetivos'],
    [/الإشارة/gi, 'la señal'],
    [/الإشارات/gi, 'las señales'],
    [/الزوج/gi, 'el par'],
    [/الأزواج/gi, 'los pares'],
    [/الإجراء/gi, 'la acción'],
    [/الثقة/gi, 'la confianza'],
    [/الدخول/gi, 'la entrada'],
    [/الوقف/gi, 'el stop'],
    [/الخروج/gi, 'la salida'],
    [/الربح/gi, 'el beneficio'],
    [/الجني/gi, 'la toma'],
    [/الخسارة/gi, 'la pérdida'],
  ],
  en: [
    // Headings & structure
    [/الملخص التنفيذي/gi, 'Executive Summary'],
    [/التحليل الفني/gi, 'Technical Analysis'],
    [/الدعم والمقاومة|مستويات الدعم والمقاومة|مستويات الدعم/gi, 'Support & Resistance'],
    [/المؤشرات الفنية/gi, 'Technical Indicators'],
    [/لمحة أساسية/gi, 'Fundamental Overview'],
    [/التوقعات السوقية|السيناريو الصعودي/gi, 'Market Expectations'],
    [/تقييم المخاطر/gi, 'Risk Assessment'],
    [/التوصية النهائية/gi, 'Final Recommendation'],
    [/تنويه هام/gi, 'Disclaimer'],
    [/إعداد التداول/gi, 'Trade Setup'],
    [/سياق الأخبار/gi, 'News Context'],
    [/تنبيه المخاطر/gi, 'Risk Warning'],
    // Strategy
    [/الاستراتيجية النهائية للتداول على/gi, 'Final Trading Strategy for'],
    [/بناءً على تحليلات المجلس المختلفة، يُنصح بالتوجه إلى استراتيجية/gi, 'Based on various council analyses, it is recommended to adopt a'],
    [/على زوج/gi, 'on pair'],
    // Council
    [/محلل السيناريوهات/gi, 'Scenario Analyst'],
    [/المحلل الفني/gi, 'Technical Analyst'],
    [/خبير المخاطر/gi, 'Risk Expert'],
    [/خبير الأنماط/gi, 'Pattern Expert'],
    [/استراتيجي التنفيذ/gi, 'Execution Strategist'],
    [/محلل التباين/gi, 'Divergence Analyst'],
    [/إجماع المجلس/gi, 'Council Consensus'],
    [/بيع واضح/gi, 'clear SELL'],
    [/شراء واضح/gi, 'clear BUY'],
    // Signal types
    [/إشارة شراء/gi, 'Buy signal'],
    [/إشارة بيع/gi, 'Sell signal'],
    [/إشارة انتظار/gi, 'Wait signal'],
    [/بيع \(SELL\)/gi, 'SELL'],
    [/شراء \(BUY\)/gi, 'BUY'],
    [/بيع/gi, 'SELL'],
    [/شراء/gi, 'BUY'],
    // Analysis phrases
    [/التحليل الفني يشير لاتجاه صاعد محتمل/gi, 'Technical analysis suggests a potential uptrend'],
    [/التحليل الفني يشير لاتجاه هابط محتمل/gi, 'Technical analysis suggests a potential downtrend'],
    [/التحليل الفني يشير لفرصة معقولة/gi, 'Technical analysis suggests a reasonable opportunity'],
    [/السوق متذبذب بدون اتجاه واضح/gi, 'Market is volatile with no clear direction'],
    [/هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية/gi, 'This analysis is for educational purposes only and does not constitute investment advice'],
    // Technical terms
    [/تباعد RSI/gi, 'RSI divergence'],
    [/مؤشر انعكاس قوي/gi, 'strong reversal signal'],
    [/تقاطع المتوسطات المتحركة يؤكد الاتجاه/gi, 'Moving average crossover confirms direction'],
    [/تقاطع MACD يدعم الصفقة/gi, 'MACD crossover supports trade'],
    [/السعر عند مستوى دعم\/مقاومة رئيسي/gi, 'Price at key support/resistance level'],
    [/دعم/gi, 'support'],
    [/مقاومة/gi, 'resistance'],
    [/متوسط متحرك/gi, 'Moving Average'],
    [/تقاطع/gi, 'crossover'],
    // General
    [/الاتجاه الصعودي|صاعد/gi, 'bullish'],
    [/الاتجاه الهابط|هابط/gi, 'bearish'],
    [/محايد/gi, 'neutral'],
    [/إيجابي/gi, 'positive'],
    [/سلبي/gi, 'negative'],
    [/مرتفع/gi, 'high'],
    [/منخفض/gi, 'low'],
    [/مستوى/gi, 'level'],
    [/إشارة/gi, 'signal'],
    [/تحليل/gi, 'analysis'],
    [/سعر/gi, 'price'],
    [/مخاطرة|مخاطر/gi, 'risk'],
    [/فرصة/gi, 'opportunity'],
    [/توصية/gi, 'recommendation'],
    [/استراتيجية/gi, 'strategy'],
    [/استثمار/gi, 'investment'],
    [/تداول/gi, 'trading'],
    [/سهم/gi, 'stock'],
    [/سوق/gi, 'market'],
    [/قطاع/gi, 'sector'],
  ],
  fr: [
    [/الملخص التنفيذي/gi, 'Résumé Exécutif'],
    [/التحليل الفني/gi, 'Analyse Technique'],
    [/الدعم والمقاومة|مستويات الدعم والمقاومة|مستويات الدعم/gi, 'Support et Résistance'],
    [/المؤشرات الفنية/gi, 'Indicateurs Techniques'],
    [/لمحة أساسية/gi, 'Aperçu Fondamental'],
    [/تقييم المخاطر/gi, 'Évaluation des Risques'],
    [/التوصية النهائية/gi, 'Recommandation Finale'],
    [/تنويه هام/gi, 'Avertissement'],
    [/بيع/gi, 'VENTE'],
    [/شراء/gi, 'ACHAT'],
    [/صاعد/gi, 'haussier'],
    [/هابط/gi, 'baissier'],
    [/محايد/gi, 'neutre'],
    [/دعم/gi, 'support'],
    [/مقاومة/gi, 'résistance'],
    [/مخاطر/gi, 'risque'],
    [/إشارة/gi, 'signal'],
    [/تحليل/gi, 'analyse'],
    [/سعر/gi, 'prix'],
    [/فرصة/gi, 'opportunité'],
    [/توصية/gi, 'recommandation'],
    [/استراتيجية/gi, 'stratégie'],
    [/استثمار/gi, 'investissement'],
    [/تداول/gi, 'trading'],
    [/سوق/gi, 'marché'],
    [/قطاع/gi, 'secteur'],
  ],
};

function translateAIContent(content: string, targetLocale: string): string {
  // Only translate if target is not Arabic and content appears to be Arabic
  if (targetLocale === 'ar') return content;
  const hasArabic = /[\u0600-\u06FF]/.test(content);
  if (!hasArabic) return content;

  const map = AR_TRANSLATE_MAP[targetLocale];
  if (!map) return content;

  let result = content;
  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement);
  }

  // Fallback: remove any remaining Arabic characters that weren't translated
  // This prevents garbled mixed-language text from appearing to the user
  result = result.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '').trim();
  // Clean up double spaces and other artifacts from removal
  result = result.replace(/\s{2,}/g, ' ').replace(/\.\s*\./g, '.').replace(/,\s*,/g, ',').replace(/\(\s*\)/g, '').trim();

  return result;
}

// ── AI Analysis Content Renderer (Professional) ──
// Parses structured AI analysis markdown and renders beautiful cards,
// tables, badges, and color-coded sections.

interface AISection {
  id: string;
  title: string;
  icon: string;
  color: string;
  content: string;
  rawLines: string[];
}

function parseAISections(md: string): AISection[] {
  const lines = md.split('\n');
  const sections: AISection[] = [];
  let currentSection: AISection | null = null;
  let sectionIndex = 0;

  // Section detection patterns (Arabic, English, French, Spanish)
  const sectionPatterns: { regex: RegExp; icon: string; color: string }[] = [
    // Executive Summary
    { regex: /الملخص التنفيذي|Executive Summary|Résumé Exécutif|Resumen Ejecutivo/i, icon: '📋', color: 'var(--cyan)' },
    // Technical Analysis
    { regex: /التحليل الفني|Technical Analysis|Analyse Technique|Análisis Técnico/i, icon: '📊', color: 'var(--cyan)' },
    // Support & Resistance
    { regex: /الدعم والمقاومة|مستويات الدعم والمقاومة|Support.*Resistance|Niveaux.*Support.*Résistance|مستويات الدعم|Support Levels|Soporte.*Resistencia|Niveles de Soporte/i, icon: '🎯', color: 'var(--gold)' },
    // Technical Indicators
    { regex: /المؤشرات الفنية|Technical Indicators|Indicateurs Techniques|Key Technical|Indicadores Técnicos/i, icon: '🔬', color: '#8B5CF6' },
    // Fundamental Overview
    { regex: /لمحة أساسية|Fundamental Overview|Aperçu Fondamental|Perspectiva Fundamental/i, icon: '🏢', color: '#3B82F6' },
    // Market Expectations / Forecasts
    { regex: /التوقعات السوقية|Market (Expectations|Forecasts)|Prévisions.*Marché|السيناريو الصعودي|Bullish Scenario|Pronóstico.*Mercado|Expectativas del Mercado|Escenario Alcista/i, icon: '🔮', color: 'var(--gold)' },
    // Risk Assessment
    { regex: /تقييم المخاطر|Risk Assessment|Évaluation.*Risques|Evaluación.*Riesgos/i, icon: '⚠️', color: '#ef5350' },
    // Final Recommendation
    { regex: /التوصية النهائية|Final Recommendation|Recommandation Finale|Recomendación Final/i, icon: '💡', color: '#059669' },
    // Disclaimer
    { regex: /تنويه هام|Disclaimer|Avertissement|Aviso Legal/i, icon: '🛡️', color: '#ffb800' },
    // Trade Setup
    { regex: /إعداد التداول|Trade Setup|Configuration.*Trading|Configuración.*Trading/i, icon: '🎯', color: '#059669' },
  ];

  const getSectionMeta = (title: string): { icon: string; color: string } => {
    for (const p of sectionPatterns) {
      if (p.regex.test(title)) return { icon: p.icon, color: p.color };
    }
    return { icon: '📄', color: 'var(--cyan)' };
  };

  for (const line of lines) {
    // Detect ALL markdown header levels: ##, ###, ####
    // ## and #### create new section cards, ### stays as sub-header inside current section
    const headerMatch = line.match(/^(#{2,4})\s+(.*)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const rawTitle = headerMatch[2].replace(/\*\*/g, '').trim();
      // Remove leading number like "1. " or "2. " from section titles (e.g. "#### 1. الملخص التنفيذي")
      const cleanTitle = rawTitle.replace(/^\d+[\.\)\-]\s*/, '').trim();

      // ### is a sub-header — stays inside the current section as content
      if (level === 3) {
        if (currentSection) {
          currentSection.rawLines.push(line);
        }
        continue;
      }

      // ## or #### = new section boundary
      const meta = getSectionMeta(cleanTitle);
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: `section-${sectionIndex++}`,
        title: cleanTitle,
        icon: meta.icon,
        color: meta.color,
        content: '',
        rawLines: [],
      };
      continue;
    }

    // Also detect bold numbered headers without markdown prefix:
    // "1. **الملخص التنفيذي**" or "2. **Technical Analysis**"
    const boldNumberedMatch = line.match(/^(\d+)\.\s+\*\*(.{5,}?)\*\*\s*$/);
    if (boldNumberedMatch) {
      const title = boldNumberedMatch[2].trim();
      const meta = getSectionMeta(title);
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: `section-${sectionIndex++}`,
        title,
        icon: meta.icon,
        color: meta.color,
        content: '',
        rawLines: [],
      };
      continue;
    }

    // Detect horizontal rules as section separators only if we already have content
    // (--- between sections usually means visual break, not new section)

    if (currentSection) {
      currentSection.rawLines.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// ── Inline Markdown Processor (for individual text lines) ──
function processInlineMarkdown(text: string): string {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-head)">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg);padding:1px 5px;border-radius:3px;font-size:11px;font-family:var(--font-jetbrains-mono),monospace;color:var(--cyan)">$1</code>');
  // Sanitize to prevent XSS — only allow tags/attrs we generate above
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'code', 'span'],
    ALLOWED_ATTR: ['style'],
    FORCE_BODY: true,
  });
}

// ── AI Analysis Renderer Component ──
function AIAnalysisRenderer({ content, locale }: { content: string; locale: string }) {
  const isRTL = locale === 'ar';
  // Translate Arabic content to target locale if needed
  const translatedContent = useMemo(() => translateAIContent(content, locale), [content, locale]);
  const sections = useMemo(() => parseAISections(translatedContent), [translatedContent]);

  // ── Section Card Styles ──
  const sectionCardStyle = (color: string): React.CSSProperties => ({
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '18px 20px',
    marginBottom: 14,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  });

  const sectionHeaderStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  });

  const sectionIconBoxStyle = (color: string): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flexShrink: 0,
  });

  const sectionTitleStyle = (color: string): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 700,
    color,
    letterSpacing: 0.3,
  });

  // ── Render table from markdown pipe rows ──
  const renderTable = (rows: string[], sectionColor: string) => {
    const parsedRows = rows.map(row =>
      row.split('|').map(c => c.trim()).filter(c => c)
    ).filter(row => row.length > 0);

    // Skip separator rows (---)
    const dataRows = parsedRows.filter(row =>
      !row.every(cell => /^[\s\-:]+$/.test(cell))
    );

    if (dataRows.length === 0) return null;

    const headerRow = dataRows[0];
    const bodyRows = dataRows.slice(1);

    return (
      <div key={`tbl-${headerRow.join('-').slice(0, 40)}`} style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {headerRow.map((cell, ci) => (
                <th key={ci} style={{
                  padding: '9px 14px',
                  textAlign: isRTL ? 'right' : 'left',
                  fontWeight: 700,
                  color: sectionColor,
                  borderBottom: '1px solid var(--border2)',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  letterSpacing: 0.3,
                  textTransform: 'uppercase' as const,
                }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(cell) }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {row.map((cell, ci) => {
                  // Color-code signal-like values
                  const lower = cell.toLowerCase();
                  let cellColor = 'var(--text2)';
                  if (lower.includes('buy') || lower.includes('صاعد') || lower.includes('haussier') || lower.includes('bullish') || lower.includes('alcista') || lower.includes('compra')) cellColor = 'var(--bull)';
                  else if (lower.includes('sell') || lower.includes('هابط') || lower.includes('baissier') || lower.includes('bearish') || lower.includes('bajista') || lower.includes('venta')) cellColor = 'var(--bear)';
                  else if (lower.includes('hold') || lower.includes('محايد') || lower.includes('neutre') || lower.includes('neutral') || lower.includes('mantener')) cellColor = 'var(--gold)';
                  else if (lower.includes('overbought') || lower.includes('تشبع') || lower.includes('surachat')) cellColor = '#ef5350';
                  else if (lower.includes('oversold') || lower.includes('تشبع بيعي') || lower.includes('survente')) cellColor = '#22c55e';

                  return (
                    <td key={ci} style={{
                      padding: '7px 14px',
                      color: cellColor,
                      borderBottom: '1px solid var(--border)',
                      fontSize: 12,
                      fontFamily: ci > 0 ? 'var(--font-jetbrains-mono), monospace' : undefined,
                      fontWeight: ci > 0 && cellColor !== 'var(--text2)' ? 700 : 400,
                    }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(cell) }} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Render bullet point ──
  const renderBullet = (text: string, color: string, idx: number) => {
    const processed = processInlineMarkdown(text);
    // Detect if bullet contains a label like "**Label:** value"
    const isLabel = text.match(/^\*\*(.*?)\*\*/);
    // Detect if content is bullish/bearish/signal
    const lower = text.toLowerCase();
    let dotColor = color;
    if (lower.includes('صاعد') || lower.includes('bullish') || lower.includes('haussier') || lower.includes('buy') || lower.includes('alcista') || lower.includes('compra')) dotColor = 'var(--bull)';
    else if (lower.includes('هابط') || lower.includes('bearish') || lower.includes('baissier') || lower.includes('sell') || lower.includes('bajista') || lower.includes('venta')) dotColor = 'var(--bear)';

    return (
      <div key={`b-${idx}`} style={{ display: 'flex', gap: 10, marginTop: 5, alignItems: 'flex-start' }}>
        <span style={{ color: dotColor, fontSize: 8, marginTop: 5, flexShrink: 0 }}>●</span>
        <span style={{ fontSize: 12.5, color: isLabel ? 'var(--text)' : 'var(--text2)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: processed }} />
      </div>
    );
  };

  // ── Render paragraph text ──
  const renderParagraph = (text: string, idx: number) => {
    return (
      <p key={`p-${idx}`} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.85, margin: '6px 0' }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(text) }} />
    );
  };

  // ── Render sub-header (###) ──
  const renderSubHeader = (text: string, color: string, idx: number) => {
    return (
      <div key={`sh-${idx}`} style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-head)',
        marginTop: 14, marginBottom: 6,
        paddingInlineStart: 10,
        borderInlineStart: `2px solid ${color}`,
      }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(text) }} />
    );
  };

  // ── Render content lines within a section ──
  const renderSectionContent = (section: AISection) => {
    const elements: React.ReactNode[] = [];
    const lines = section.rawLines;
    let i = 0;
    let elIdx = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) { i++; continue; }

      // Sub-header ###
      const h3Match = trimmed.match(/^###\s+(.*)/);
      if (h3Match) {
        elements.push(renderSubHeader(h3Match[1], section.color, elIdx++));
        i++; continue;
      }

      // Table detection
      const isTableRow = (l: string) => /^\|.*\|$/.test(l.trim()) || /^\|.*\|/.test(l.trim());
      const isTableSep = (l: string) => /^\|[\s\-:]+\|$/.test(l.trim());

      if (isTableRow(trimmed)) {
        const tableRows: string[] = [];
        while (i < lines.length && isTableRow(lines[i].trim())) {
          tableRows.push(lines[i].trim());
          i++;
          // Skip separator row
          if (i < lines.length && isTableSep(lines[i].trim())) i++;
        }
        if (tableRows.length > 0) {
          elements.push(renderTable(tableRows, section.color));
        }
        continue;
      }

      // Bullet point: "- text" or "* text" or "• text"
      const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        elements.push(renderBullet(bulletMatch[1], section.color, elIdx++));
        i++; continue;
      }

      // Numbered list: "1. text"
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const rest = processInlineMarkdown(numMatch[2]);
        elements.push(
          <div key={`n-${elIdx++}`} style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'flex-start' }}>
            <span style={{
              minWidth: 24, height: 24, borderRadius: '50%',
              background: `${section.color}15`, color: section.color,
              border: `1px solid ${section.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>{num}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: rest }} />
          </div>
        );
        i++; continue;
      }

      // Horizontal rule ---
      if (/^---+$/.test(trimmed)) {
        elements.push(<div key={`hr-${elIdx++}`} style={{ margin: '10px 0', borderBottom: '1px solid var(--border)' }} />);
        i++; continue;
      }

      // Warning/emoji lines
      if (trimmed.startsWith('⚠️') || trimmed.startsWith('🛡️')) {
        elements.push(
          <div key={`warn-${elIdx++}`} style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)',
            fontSize: 12, color: 'var(--gold)', lineHeight: 1.7,
          }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed.replace(/^[⚠️🛡️]\s*/, '')) }} />
        );
        i++; continue;
      }

      if (trimmed.startsWith('💡') || trimmed.startsWith('🏆')) {
        elements.push(
          <div key={`highlight-${elIdx++}`} style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: `${section.color}10`, border: `1px solid ${section.color}30`,
            fontSize: 13, fontWeight: 700, color: section.color, lineHeight: 1.7,
          }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed) }} />
        );
        i++; continue;
      }

      // Labeled line starting with **
      if (trimmed.startsWith('**')) {
        elements.push(
          <div key={`lbl-${elIdx++}`} style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.8, marginTop: 5 }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed) }} />
        );
        i++; continue;
      }

      // Regular paragraph
      elements.push(renderParagraph(trimmed, elIdx++));
      i++;
    }

    return elements;
  };

  if (sections.length === 0) {
    // Fallback: if no ## sections detected, render the content as-is with basic formatting
    return (
      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text2)' }} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content).replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>') }} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sections.map((section) => (
        <div key={section.id} style={sectionCardStyle(section.color)}>
          {/* Decorative gradient orb */}
          <div style={{
            position: 'absolute', top: -30, insetInlineEnd: -30, width: 120, height: 120,
            background: `radial-gradient(circle, ${section.color}10, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Section Header */}
          <div style={sectionHeaderStyle(section.color)}>
            <div style={sectionIconBoxStyle(section.color)}>{section.icon}</div>
            <span style={sectionTitleStyle(section.color)}>{section.title}</span>
          </div>

          {/* Section Content */}
          <div style={{ position: 'relative' }}>
            {renderSectionContent(section)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Financial Formatting ──
function formatFinancialValue(n: number | string | null | undefined): string {
  if (n == null) return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

// ── Watchlist helpers ──
function getWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('stock-watchlist') || '[]');
  } catch { return []; }
}
function setWatchlist(list: string[]) {
  try { localStorage.setItem('stock-watchlist', JSON.stringify(list)); } catch { /* */ }
}

// ── Component ──

interface Props {
  symbol: string;
  locale: Locale;
}

export default function StockDetailClient({ symbol, locale }: Props) {
  const router = useRouter();
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [chartPeriod, setChartPeriod] = useState<string>('3M');
  const [activeTab, setActiveTab] = useState('overview');

  // Chart indicator toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(true);

  // Comparison state (up to 6 stocks now)
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [compareInput, setCompareInput] = useState('');

  // Watchlist state
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // SWOT cache for session persistence
  const [swotCache, setSwotCache] = useState<{ swot: any; generatedAt: string } | null>(null);

  // Stable callback for SWOT generation (prevents infinite re-renders from inline function)
  const handleSwotGenerated = useCallback((result: { swot: any; generatedAt: string }) => {
    setSwotCache({ swot: result.swot, generatedAt: result.generatedAt });
  }, []);

  // Initialize watchlist state
  useEffect(() => {
    setIsWatchlisted(getWatchlist().includes(symbol));
  }, [symbol]);

  // Toggle watchlist
  const toggleWatchlist = useCallback(() => {
    const list = getWatchlist();
    if (list.includes(symbol)) {
      setWatchlist(list.filter((s: string) => s !== symbol));
      setIsWatchlisted(false);
    } else {
      setWatchlist([...list, symbol]);
      setIsWatchlisted(true);
    }
  }, [symbol]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // ── React Query: Stock detail data ──
  const detailQuery = useQuery({
    queryKey: ['stock-detail', symbol, locale],
    queryFn: async () => {
      const res = await fetch(`/api/stock-analysis/${encodeURIComponent(symbol)}?locale=${locale}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('notFound');
        throw new Error('Failed');
      }
      return res.json();
    },
    // Limit retries to prevent infinite re-render loops on persistent 503 errors
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    // Don't refetch on window focus to prevent unnecessary re-renders
    refetchOnWindowFocus: false,
    // Stale time: 2 minutes — don't refetch constantly
    staleTime: 2 * 60 * 1000,
  });

  const data = detailQuery.data ?? null;
  const loading = detailQuery.isLoading;
  const error = detailQuery.error
    ? (detailQuery.error.message === 'notFound' ? t.notFound : t.error)
    : null;

  const signalLabel = (s: string) => {
    if (s === 'bullish') return t.bullish;
    if (s === 'bearish') return t.bearish;
    return t.neutral;
  };

  const riskLabel = (r: string) => {
    const rl = (r || '').toLowerCase();
    if (rl === 'low') return t.low;
    if (rl === 'high') return t.high;
    if (rl === 'extreme') return t.extreme;
    return t.medium;
  };

  const fmt = (n: number | string | null | undefined, dec = 2): string => {
    if (n == null) return '—';
    const num = typeof n === 'string' ? parseFloat(n) : n;
    if (isNaN(num as number)) return '—';
    // Manual formatting to avoid toLocaleString hydration mismatch
    // (server and client may have different locale implementations)
    const fixed = (num as number).toFixed(dec);
    const [intPart, decPart] = fixed.split('.');
    // Add thousand separators
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withCommas}.${decPart}` : withCommas;
  };

  // ── Comparison Logic (6 stocks) ──
  const MAX_COMPARE = 6;
  const addCompareSymbol = useCallback(() => {
    const sym = compareInput.trim().toUpperCase();
    if (sym && !compareSymbols.includes(sym) && compareSymbols.length < MAX_COMPARE) {
      setCompareSymbols(prev => [...prev, sym]);
      setCompareInput('');
    }
  }, [compareInput, compareSymbols]);

  const removeCompareSymbol = useCallback((sym: string) => {
    setCompareSymbols(prev => prev.filter(s => s !== sym));
  }, []);

  // ── React Query: Comparison data ──
  const compareQuery = useQuery({
    queryKey: ['stock-compare-detail', locale, ...compareSymbols],
    queryFn: async () => {
      const symbolsParam = compareSymbols.join(',');
      const res = await fetch(`/api/stock-analysis?action=compare&symbols=${encodeURIComponent(symbolsParam)}&locale=${locale}`);
      if (res.ok) {
        const json = await res.json();
        if (json.comparisons && json.comparisons.length > 0) {
          return json.comparisons;
        }
      }
      // Fallback: individual fetch
      const results = await Promise.allSettled(
        compareSymbols.map(async sym => {
          const r = await fetch(`/api/stock-analysis/${encodeURIComponent(sym)}?locale=${locale}`);
          if (!r.ok) return null;
          return r.json();
        })
      );
      return results.filter(r => r.status === 'fulfilled' && r.value).map(r => (r as any).value);
    },
    enabled: compareSymbols.length >= 1,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });

  const compareData: any[] = compareQuery.data ?? [];
  const compareLoading = compareQuery.isLoading;

  // ── ALL useMemo hooks MUST be before any conditional returns (Rules of Hooks) ──
  // Use stable empty objects to prevent useMemo dependency churn
  const EMPTY_OBJ = useMemo(() => ({}), []);
  const EMPTY_ARR = useMemo(() => [], []);
  const company = useMemo(() => data?.company || EMPTY_OBJ, [data?.company, EMPTY_OBJ]);
  const candlestickData = useMemo(() => data?.candlestickData || EMPTY_ARR, [data?.candlestickData, EMPTY_ARR]);

  const filteredChartData = useMemo(() => {
    if (!candlestickData || candlestickData.length === 0) return [];
    const now = new Date();
    let cutoff: Date;
    switch (chartPeriod) {
      case '1D': cutoff = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
      case '1W': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '1M': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '3M': cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '6M': cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); break;
      case '1Y': cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      case '5Y': cutoff = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); break;
      default: cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    const filtered = candlestickData.filter((d: any) => new Date(d.date) >= cutoff);
    return filtered.length > 0 ? filtered : candlestickData;
  }, [candlestickData, chartPeriod]);

  const fundamentalScore = useMemo(() => {
    const peRatio = company?.peRatio;
    const eps = company?.eps;
    const dividendYield = company?.dividendYield;
    let score = 50;
    if (peRatio) score += peRatio < 15 ? 20 : peRatio < 25 ? 10 : -10;
    if (eps && eps > 0) score += 15;
    if (dividendYield && dividendYield > 0) score += 10;
    return Math.max(0, Math.min(100, score));
  }, [company]);

  // ── ALL data extraction MUST stay before conditional returns (Rules of Hooks) ──
  // Use EMPTY_OBJ instead of {} to keep stable references for useMemo dependencies
  const analysis: any = data?.analysis || EMPTY_OBJ;
  const quote: any = analysis.quote || EMPTY_OBJ;
  const technicalData: any = analysis.technicalData || EMPTY_OBJ;
  const signal: any = analysis.signal || EMPTY_OBJ;
  const tradeSetup: any = analysis.tradeSetup || EMPTY_OBJ;
  const stockQuote: any = data?.stockQuote ?? null;
  const keyMetricsData: any = data?.keyMetrics ?? null;
  const stockRating: any = data?.stockRating ?? null;
  const incomeStatements: any[] = data?.incomeStatements || EMPTY_ARR;
  const balanceSheets: any[] = data?.balanceSheets || EMPTY_ARR;
  const cashFlowStatements: any[] = data?.cashFlowStatements || EMPTY_ARR;
  const peers: any[] = data?.peers || EMPTY_ARR;
  const priceTargetData: any = data?.priceTarget ?? null;

  // ── Resolved key metrics: merge from keyMetricsData → technicalData → stockQuote → company ──
  // Helper: pick first non-null/non-undefined value (treats 0 as valid)
  const coalesce = useCallback((...vals: (number | null | undefined)[]): number | null => {
    for (const v of vals) {
      if (v != null && v !== 0) return v;
    }
    for (const v of vals) {
      if (v === 0) return 0;
    }
    return null;
  }, []);

  const resolvedMetrics = useMemo(() => ({
    grossMargin: coalesce(keyMetricsData?.grossMargin, technicalData?.grossMargin),
    operatingMargin: coalesce(keyMetricsData?.operatingMargin, technicalData?.operatingMargin),
    netMargin: coalesce(keyMetricsData?.netMargin, technicalData?.netMargin),
    debtToEquity: coalesce(keyMetricsData?.debtToEquity, technicalData?.debtToEquity),
    currentRatio: coalesce(keyMetricsData?.currentRatio, technicalData?.currentRatio),
    roe: coalesce(keyMetricsData?.roe, technicalData?.roe, company?.roe),
    roa: coalesce(keyMetricsData?.roa, technicalData?.roa, company?.roa),
    beta: coalesce(keyMetricsData?.beta, technicalData?.beta, stockQuote?.beta, company?.beta),
    peRatio: coalesce(keyMetricsData?.peRatio, keyMetricsData?.per, technicalData?.peRatio, company?.peRatio, stockQuote?.pe),
    eps: coalesce(keyMetricsData?.eps, technicalData?.eps, company?.eps, stockQuote?.eps),
    dividendYield: coalesce(keyMetricsData?.dividendYield, technicalData?.dividendYield, company?.dividendYield, stockQuote?.dividendYield),
    revenueGrowth: coalesce(keyMetricsData?.revenueGrowth, technicalData?.revenueGrowth),
    earningsGrowth: coalesce(keyMetricsData?.earningsGrowth, technicalData?.earningsGrowth),
  }), [keyMetricsData, technicalData, stockQuote, company, coalesce]);

  // ── Enhanced Skeleton Loading State ──
  if (loading) {
    return (
      <main className="min-h-screen pb-16" dir={dir} style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md, 16px)', paddingTop: 20 }}>
          {/* Back nav skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Skeleton style={{ width: 140, height: 28, borderRadius: 8 }} />
          </div>

          {/* Scorecard skeleton */}
          <div style={{ borderRadius: 14, padding: 24, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Skeleton style={{ width: 60, height: 60, borderRadius: 14 }} />
                <div>
                  <Skeleton style={{ width: 120, height: 24, marginBottom: 6 }} />
                  <Skeleton style={{ width: 180, height: 15, marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Skeleton style={{ width: 50, height: 18, borderRadius: 6 }} />
                    <Skeleton style={{ width: 60, height: 18, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Skeleton style={{ width: 160, height: 38, marginBottom: 8 }} />
                <Skeleton style={{ width: 120, height: 20 }} />
              </div>
            </div>
            {/* Gauges skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Skeleton style={{ width: 56, height: 56, borderRadius: '50%' }} />
                  <Skeleton style={{ width: 40, height: 10 }} />
                </div>
              ))}
            </div>
            {/* Price details skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <Skeleton style={{ width: 50, height: 10, margin: '0 auto 4px' }} />
                  <Skeleton style={{ width: 60, height: 14, margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Chart skeleton */}
          <div style={{ borderRadius: 12, padding: 20, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Skeleton style={{ width: 100, height: 16 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton style={{ width: 80, height: 24, borderRadius: 8 }} />
                <Skeleton style={{ width: 160, height: 24, borderRadius: 8 }} />
              </div>
            </div>
            <Skeleton style={{ width: '100%', height: 350, borderRadius: 12 }} />
          </div>

          {/* Fundamentals + Trade Setup skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <Skeleton style={{ width: 120, height: 20, marginBottom: 12 }} />
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} style={{ width: '100%', height: 32, marginBottom: 8, borderRadius: 8 }} />
              ))}
            </div>
            <div style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <Skeleton style={{ width: 120, height: 20, marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Skeleton key={i} style={{ height: 40, borderRadius: 8 }} />
                ))}
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', marginTop: 16 }}>{t.loading}</p>
        </div>
      </main>
    );
  }

  // ── Error / Not Found State ──
  if (error || !data) {
    return (
      <main className="min-h-screen pb-16" dir={dir} style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md, 16px)', paddingTop: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <AlertTriangle className="w-12 h-12 text-amber-400 mb-4 mx-auto" style={{ color: 'var(--gold)' }} />
            <p style={{ color: 'var(--bear)', fontSize: 16, marginBottom: 16 }}>{error || t.notFound}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => detailQuery.refetch()}
                style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--cyan2)', color: 'var(--cyan)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {t.retry}
              </button>
              <button
                onClick={() => router.push(`${getLocalePath(locale)}/stock-analysis`)}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--cyan)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {t.goBack}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Data already extracted above (before conditional returns) via useMemo ──

  const isUp = (quote.changePercent || 0) >= 0;
  const companyName = locale === 'ar' ? (company.nameAr || company.name) : locale === 'fr' ? (company.nameFr || company.name) : company.name;

  // Compute scores for scorecard
  const techScore = signal.score || 0; // -100 to +100
  const techScoreNorm = (techScore + 100) / 2; // 0-100

  // Rating & Price Target
  const rating = stockRating?.ratingRecommendation || stockRating?.rating;
  const dcfFairValue = stockRating?.dcf || stockRating?.dcfFairValue;
  const priceTargetLow = priceTargetData?.targetLow || priceTargetData?.targetLowFwd;
  const priceTargetMedian = priceTargetData?.targetMedian || priceTargetData?.targetMedianFwd;
  const priceTargetHigh = priceTargetData?.targetHigh || priceTargetData?.targetHighFwd;

  const ratingColor = (() => {
    const r = (rating || '').toLowerCase();
    if (r.includes('strong buy')) return 'var(--bull)';
    if (r.includes('buy')) return '#22c55e';
    if (r.includes('hold')) return 'var(--gold)';
    if (r.includes('sell') && !r.includes('strong')) return '#f97316';
    if (r.includes('strong sell')) return 'var(--bear)';
    return 'var(--text3)';
  })();

  // Helper: glass card style
  const gc = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 12,
    padding: 20,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    ...extra,
  });

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{title}</span>
    </div>
  );

  const metricRow = (label: string, value: string, valueColor?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
        {value}
      </span>
    </div>
  );

  const periodOptions = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const;
  const periodLabel = (p: string) => {
    if (p === '1D') return t.period1D;
    if (p === '1W') return t.period1W;
    if (p === '1M') return t.period1M;
    if (p === '3M') return t.period3M;
    if (p === '6M') return t.period6M;
    if (p === '1Y') return t.period1Y;
    if (p === '5Y') return t.period5Y;
    return p;
  };

  // ── Comparison winner detection helper ──
  const getComparisonMetrics = () => [
    { label: t.signal, key: 'signal', type: 'signal' as const, getVal: (d: any) => d.overallSignal || d.analysis?.signal?.overall || 'neutral' },
    { label: t.confidence, key: 'confidence', type: 'number-high' as const, getVal: (d: any) => d.confidenceScore ?? d.analysis?.signal?.confidence ?? 0 },
    { label: t.pe, key: 'pe', type: 'number-low' as const, getVal: (d: any) => d.peRatio ?? d.company?.peRatio ?? null },
    { label: t.eps, key: 'eps', type: 'number-high' as const, getVal: (d: any) => d.eps ?? d.company?.eps ?? null },
    { label: t.marketCap, key: 'marketCap', type: 'number-high' as const, getVal: (d: any) => {
      const mc = d.marketCap ?? d.company?.marketCap;
      return mc ? parseFloat(String(mc)) : null;
    }},
    { label: t.dividendYield, key: 'dividendYield', type: 'number-high' as const, getVal: (d: any) => d.company?.dividendYield ?? null },
    { label: t.price, key: 'price', type: 'number-high' as const, getVal: (d: any) => d.price ?? d.analysis?.quote?.price ?? null },
    { label: t.sector, key: 'sector', type: 'text' as const, getVal: (d: any) => d.sector || d.company?.sector || '—' },
  ];

  const getWinnerIndex = (metric: { type: string; getVal: (d: any) => any }, stocks: any[]) => {
    if (metric.type === 'text') return -1;
    const values = stocks.map(d => metric.getVal(d));
    if (values.every(v => v == null)) return -1;
    if (metric.type === 'signal') {
      let bestIdx = 0;
      let bestRank = 0;
      values.forEach((v, i) => {
        const rank = SIGNAL_RANK[v] || 0;
        if (rank > bestRank) { bestRank = rank; bestIdx = i; }
      });
      return bestIdx;
    }
    if (metric.type === 'number-low') {
      // Lower is better (e.g., PE ratio), but only for positive values
      let bestIdx = -1;
      let bestVal = Infinity;
      values.forEach((v, i) => {
        if (v != null && v > 0 && v < bestVal) { bestVal = v; bestIdx = i; }
      });
      return bestIdx;
    }
    // number-high: higher is better
    let bestIdx = -1;
    let bestVal = -Infinity;
    values.forEach((v, i) => {
      if (v != null && v > bestVal) { bestVal = v; bestIdx = i; }
    });
    return bestIdx;
  };

  const formatCompareVal = (metric: { type: string; key: string; getVal: (d: any) => any }, d: any) => {
    const val = metric.getVal(d);
    if (val == null) return '—';
    if (metric.type === 'signal') return signalLabel(val);
    if (metric.key === 'pe') return fmt(val, 1);
    if (metric.key === 'eps') return `$${fmt(val)}`;
    if (metric.key === 'marketCap') return formatFinancialValue(val);
    if (metric.key === 'dividendYield') return `${fmt(val)}%`;
    if (metric.key === 'price') return `$${fmt(val)}`;
    if (metric.key === 'confidence') return `${val}%`;
    return String(val);
  };

  // ── Indicator toggle pill button style ──
  const pillStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '3px 10px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 12,
    border: `1px solid ${active ? (color || 'var(--cyan)') : 'var(--border)'}`,
    background: active ? `${color || 'var(--cyan)'}18` : 'transparent',
    color: active ? (color || 'var(--cyan)') : 'var(--text3)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: '16px',
  });

  return (
    <main className="min-h-screen pb-16" dir={dir} style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4" style={{ paddingInline: 'var(--space-md, 16px)' }}>

        {/* ═══ BACK NAV ═══ */}
        <button
          onClick={() => router.push(`${getLocalePath(locale)}/stock-analysis`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text3)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s ease',
          }}
        >
          {isRTL ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          {t.backToStocks}
        </button>

        {/* ═══ FEATURE 3: VISUAL SCORECARD + WATCHLIST STAR ═══ */}
        <div className="glass-card" style={{ borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            {/* Left: Company info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14,
                background: 'var(--cyan2)', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: 'var(--cyan)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}>
                {symbol.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-head)' }}>{symbol}</span>
                  {/* Watchlist Star Button */}
                  <button
                    onClick={toggleWatchlist}
                    title={isWatchlisted ? t.removeFromWatchlist : t.addToWatchlist}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <Star
                      className="w-5 h-5"
                      style={{
                        color: isWatchlisted ? 'var(--gold)' : 'var(--text3)',
                        fill: isWatchlisted ? 'var(--gold)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </button>
                </div>
                <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 6 }}>{companyName || symbol}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {company.exchange && (
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--text3)', fontWeight: 600 }}>
                      {company.exchange}
                    </span>
                  )}
                  {company.sector && (
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 6, background: 'var(--cyan2)', color: 'var(--cyan)', fontWeight: 600 }}>
                      {company.sector}
                    </span>
                  )}
                  {company.industry && (
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 6, background: 'var(--purple2)', color: 'var(--purple)', fontWeight: 600 }}>
                      {company.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Price + Change */}
            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
              <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', lineHeight: 1.1 }} suppressHydrationWarning>
                ${fmt(quote.price || 0)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: isRTL ? 'flex-start' : 'flex-end', marginTop: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace', color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                  {isUp ? '+' : ''}{fmt(quote.change || 0)}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 14, fontWeight: 700, background: isUp ? 'var(--bull2)' : 'var(--bear2)', color: isUp ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                  {isUp ? '+' : ''}{fmt(quote.changePercent || 0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Scorecard Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            {/* Overall Signal */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: SIGNAL_COLORS[signal.overall]?.color || 'var(--gold)' }}>
                {signal.overall === 'bullish' ? '▲' : signal.overall === 'bearish' ? '▼' : '◆'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: SIGNAL_COLORS[signal.overall]?.color || 'var(--gold)' }}>
                {signalLabel(signal.overall)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.signal}</span>
            </div>

            {/* Confidence Gauge */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CircularGauge value={signal.confidence || 0} maxValue={100} label={t.confidence} />
            </div>

            {/* Tech Score Gauge Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 120, padding: '8px 0' }}>
              <GaugeBar value={techScoreNorm} maxValue={100} label={t.technicalScore} leftLabel='0' rightLabel='100' />
            </div>

            {/* Fundamental Score Gauge Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 120, padding: '8px 0' }}>
              <GaugeBar value={fundamentalScore} maxValue={100} label={t.fundamentalScore} leftLabel='0' rightLabel='100' />
            </div>

            {/* Risk Level */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: RISK_COLORS[(signal.riskLevel || '').toLowerCase()]?.bg || 'var(--gold2)',
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(signal.riskLevel || '').toLowerCase() === 'low' ? (
                  <ShieldCheck style={{ width: 24, height: 24, color: 'var(--bull)' }} />
                ) : (
                  <ShieldAlert style={{ width: 24, height: 24, color: RISK_COLORS[(signal.riskLevel || '').toLowerCase()]?.color || 'var(--gold)' }} />
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: RISK_COLORS[(signal.riskLevel || '').toLowerCase()]?.color || 'var(--gold)' }}>
                {riskLabel(signal.riskLevel)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{t.riskLevel}</span>
            </div>
          </div>

          {/* Price Details Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[
              { label: t.open, value: `$${fmt(quote.open || 0)}` },
              { label: t.dayHigh, value: `$${fmt(quote.high || 0)}` },
              { label: t.dayLow, value: `$${fmt(quote.low || 0)}` },
              { label: t.prevClose, value: `$${fmt(quote.previousClose || 0)}` },
              { label: t.volume, value: quote.volume ? `${(quote.volume / 1000000).toFixed(1)}M` : '—' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir} style={{ marginBottom: 20 }}>
          <TabsList className="bg-white/5 border border-white/10 h-11 w-full justify-start overflow-x-auto rounded-lg p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="financials" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t.financials}</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">{t.technical}</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <GitCompareArrows className="w-4 h-4" />
              <span className="hidden sm:inline">{t.comparison}</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">{t.insights}</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{t.tools}</span>
            </TabsTrigger>
            {analysis.content && (
              <TabsTrigger value="ai" className="text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-1.5 px-3 sm:px-4">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">{t.aiAnalysis}</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═══════════════════════════════════════════════════
              OVERVIEW TAB — Chart + Trade Setup + Key Metrics
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-5 mt-4">

            {/* FEATURE 1: Interactive Chart */}
            <div className="glass-card" style={gc()}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{t.priceChart}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text3)' }}>{symbol}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Chart type toggle */}
                  <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => setChartType('candlestick')}
                      style={{
                        padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: chartType === 'candlestick' ? 'var(--cyan2)' : 'transparent',
                        color: chartType === 'candlestick' ? 'var(--cyan)' : 'var(--text3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.candlestick}
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      style={{
                        padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: chartType === 'line' ? 'var(--cyan2)' : 'transparent',
                        color: chartType === 'line' ? 'var(--cyan)' : 'var(--text3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.line}
                    </button>
                  </div>
                  {/* Period toggle */}
                  <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {periodOptions.map(p => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        style={{
                          padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: chartPeriod === p ? 'var(--bull2)' : 'transparent',
                          color: chartPeriod === p ? 'var(--bull)' : 'var(--text3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {periodLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Indicator Toggles */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <button onClick={() => setShowSMA20(v => !v)} style={pillStyle(showSMA20, '#f59e0b')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 2, background: '#f59e0b', borderRadius: 1 }} />
                    {t.sma20}
                  </span>
                </button>
                <button onClick={() => setShowSMA50(v => !v)} style={pillStyle(showSMA50, '#8b5cf6')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 2, background: '#8b5cf6', borderRadius: 1 }} />
                    {t.sma50}
                  </span>
                </button>
                <button onClick={() => setShowBollinger(v => !v)} style={pillStyle(showBollinger, '#3b82f6')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 4, background: 'rgba(59,130,246,0.3)', borderTop: '1px solid rgba(59,130,246,0.6)', borderBottom: '1px solid rgba(59,130,246,0.6)', borderRadius: 1 }} />
                    {t.bollingerBandsToggle}
                  </span>
                </button>
                <button onClick={() => setShowVolumeOverlay(v => !v)} style={pillStyle(showVolumeOverlay, 'var(--text3)')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
                    {t.volumeOverlay}
                  </span>
                </button>
              </div>
              {filteredChartData.length > 0 ? (
                <LightweightChart
                  data={filteredChartData}
                  chartType={chartType}
                  showSMA20={showSMA20}
                  showSMA50={showSMA50}
                  showBollinger={showBollinger}
                  showVolume={showVolumeOverlay}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text3)' }}>
                  <BarChart3 className="w-12 h-12 mb-2" style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>{t.noChartData}</p>
                </div>
              )}
            </div>

            {/* Trade Setup + Key Metrics side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

              {/* Trade Setup */}
              <div className="glass-card" style={gc()}>
                {sectionHeader(
                  <Target className="w-3.5 h-3.5" />,
                  t.tradeSetup
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tradeSetup?.direction && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: SIGNAL_COLORS[tradeSetup.direction.toLowerCase()]?.bg || 'var(--gold2)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{t.direction}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: SIGNAL_COLORS[tradeSetup.direction.toLowerCase()]?.color || 'var(--gold)' }}>
                        {tradeSetup.direction.toLowerCase() === 'long' ? t.long : tradeSetup.direction.toLowerCase() === 'short' ? t.short : t.wait}
                      </span>
                    </div>
                  )}
                  {metricRow(t.entry, tradeSetup.entryPrice ? `$${fmt(tradeSetup.entryPrice)}` : tradeSetup.entry ? `$${fmt(tradeSetup.entry)}` : '—', 'var(--cyan)')}
                  {metricRow(t.stopLoss, tradeSetup.stopLoss ? `$${fmt(tradeSetup.stopLoss)}` : '—', 'var(--bear)')}
                  {metricRow(t.takeProfit, tradeSetup.targetPrice ? `$${fmt(tradeSetup.targetPrice)}` : tradeSetup.takeProfit ? `$${fmt(tradeSetup.takeProfit)}` : '—', 'var(--bull)')}
                  {tradeSetup.riskRewardRatio && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.15)' }}>
                      <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{t.riskReward}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        1:{tradeSetup.riskRewardRatio}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feature 2: Key Metrics Overview */}
              <div className="glass-card" style={gc()}>
                {sectionHeader(
                  <DollarSign className="w-3.5 h-3.5" />,
                  t.fundamentalData
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: t.pe, value: resolvedMetrics.peRatio != null ? fmt(resolvedMetrics.peRatio, 1) : '—' },
                    { label: t.eps, value: resolvedMetrics.eps != null ? `$${fmt(resolvedMetrics.eps)}` : '—' },
                    { label: t.marketCap, value: company.marketCap != null ? formatFinancialValue(company.marketCap) : stockQuote?.marketCap != null ? formatFinancialValue(stockQuote.marketCap) : '—' },
                    { label: t.dividendYield, value: resolvedMetrics.dividendYield != null ? `${fmt(resolvedMetrics.dividendYield)}%` : '—' },
                    { label: t.roe, value: resolvedMetrics.roe != null ? `${fmt(resolvedMetrics.roe, 1)}%` : '—' },
                    { label: t.roa, value: resolvedMetrics.roa != null ? `${fmt(resolvedMetrics.roa, 1)}%` : '—' },
                    { label: t.beta, value: resolvedMetrics.beta != null ? fmt(resolvedMetrics.beta, 2) : '—' },
                    { label: t.sector, value: company.sector || '—' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', marginTop: 1 }} suppressHydrationWarning>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyst Rating + Price Target */}
            {(rating || priceTargetMedian) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {rating && (
                  <div className="glass-card" style={gc()}>
                    {sectionHeader(
                      <Star className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />,
                      t.analystRating
                    )}
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{
                        display: 'inline-block', padding: '8px 24px', borderRadius: 10,
                        background: `${ratingColor}15`, border: `1px solid ${ratingColor}40`,
                        fontSize: 18, fontWeight: 800, color: ratingColor,
                      }}>
                        {rating}
                      </div>
                      {dcfFairValue && (
                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{t.fairValue}: </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                            ${fmt(dcfFairValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {priceTargetMedian && (
                  <div className="glass-card" style={gc()}>
                    {sectionHeader(
                      <Target className="w-3.5 h-3.5" style={{ color: 'var(--bull)' }} />,
                      t.priceTarget
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {priceTargetLow && metricRow(t.targetLow, `$${fmt(priceTargetLow)}`, 'var(--bear)')}
                      {priceTargetMedian && metricRow(t.targetMedian, `$${fmt(priceTargetMedian)}`, 'var(--gold)')}
                      {priceTargetHigh && metricRow(t.targetHigh, `$${fmt(priceTargetHigh)}`, 'var(--bull)')}
                      {quote.price && priceTargetMedian && metricRow(t.vsCurrent, `${((priceTargetMedian - quote.price) / quote.price * 100).toFixed(1)}%`, priceTargetMedian > quote.price ? 'var(--bull)' : 'var(--bear)')}
                    </div>
                    {/* Visual range bar */}
                    {priceTargetLow && priceTargetHigh && (
                      <div style={{ marginTop: 16, position: 'relative', height: 8, borderRadius: 4, background: 'var(--bg)' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '10%', right: '10%', borderRadius: 4, background: 'linear-gradient(to right, var(--bear), var(--gold), var(--bull))', opacity: 0.4 }} />
                        {quote.price && (() => {
                          const range = priceTargetHigh - priceTargetLow || 1;
                          const pct = Math.max(0, Math.min(100, ((quote.price - priceTargetLow) / range) * 100));
                          return <div style={{ position: 'absolute', top: -4, bottom: -4, width: 3, borderRadius: 2, background: 'var(--cyan)', left: `${pct}%` }} />;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Peers List */}
            {peers && peers.length > 0 && (
              <div className="glass-card" style={gc()}>
                {sectionHeader(
                  <Layers className="w-3.5 h-3.5" />,
                  t.peersList
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {peers.map((peer: string) => (
                    <button
                      key={peer}
                      onClick={() => router.push(`${getLocalePath(locale)}/stock-analysis/${peer}`)}
                      className="hover-lift"
                      style={{
                        padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        color: 'var(--cyan)', fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {peer}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              FEATURE 2: FINANCIALS TAB
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="financials" className="mt-4">
            <Tabs defaultValue="overview" dir={dir}>
              <TabsList className="bg-white/5 border border-white/10 h-9 mb-4">
                <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  {t.overview}
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  {t.incomeStatement}
                </TabsTrigger>
                <TabsTrigger value="balance" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  {t.balanceSheet}
                </TabsTrigger>
                <TabsTrigger value="cashflow" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  {t.cashFlow}
                </TabsTrigger>
                <TabsTrigger value="fundamentals" className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  {t.fundamentalsTab}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab — Key Fundamental Metrics */}
              <TabsContent value="overview">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {/* Core Metrics Card */}
                  <div className="glass-card" style={gc()}>
                    {sectionHeader(
                      <DollarSign className="w-3.5 h-3.5" />,
                      t.fundamentalData
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {metricRow(t.marketCap, company.marketCap != null ? formatFinancialValue(company.marketCap) : stockQuote?.marketCap != null ? formatFinancialValue(stockQuote.marketCap) : '—', 'var(--cyan)')}
                      {metricRow(t.pe, resolvedMetrics.peRatio != null ? fmt(resolvedMetrics.peRatio, 1) : '—')}
                      {metricRow(t.eps, resolvedMetrics.eps != null ? `$${fmt(resolvedMetrics.eps)}` : '—')}
                      {metricRow(t.dividendYield, resolvedMetrics.dividendYield != null ? `${fmt(resolvedMetrics.dividendYield)}%` : '—')}
                      {metricRow(t.beta, resolvedMetrics.beta != null ? fmt(resolvedMetrics.beta, 2) : '—')}
                    </div>
                  </div>

                  {/* Margins & Ratios Card */}
                  <div className="glass-card" style={gc()}>
                    {sectionHeader(
                      <Gauge className="w-3.5 h-3.5" />,
                      t.fundamentalData
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {metricRow(t.grossMargin, resolvedMetrics.grossMargin != null ? `${fmt(resolvedMetrics.grossMargin, 1)}%` : '—')}
                      {metricRow(t.operatingMargin, resolvedMetrics.operatingMargin != null ? `${fmt(resolvedMetrics.operatingMargin, 1)}%` : '—')}
                      {metricRow(t.netMargin, resolvedMetrics.netMargin != null ? `${fmt(resolvedMetrics.netMargin, 1)}%` : '—')}
                      {metricRow(t.debtToEquity, resolvedMetrics.debtToEquity != null ? fmt(resolvedMetrics.debtToEquity, 2) : '—')}
                      {metricRow(t.currentRatio, resolvedMetrics.currentRatio != null ? fmt(resolvedMetrics.currentRatio, 2) : '—')}
                      {metricRow(t.roe, resolvedMetrics.roe != null ? `${fmt(resolvedMetrics.roe, 1)}%` : '—')}
                    </div>
                  </div>
                </div>

                {/* 52-Week Range */}
                {stockQuote && (stockQuote.yearHigh || stockQuote.yearLow) && (
                  <div className="glass-card" style={gc({ marginTop: 16 })}>
                    <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>{t.weekRange52}</div>
                    <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'var(--bg)' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5%', right: '5%', borderRadius: 5, background: 'linear-gradient(to right, var(--bear), var(--gold), var(--bull))', opacity: 0.4 }} />
                      {quote.price && stockQuote.yearHigh && stockQuote.yearLow && (() => {
                        const range = stockQuote.yearHigh - stockQuote.yearLow || 1;
                        const pct = Math.max(0, Math.min(100, ((quote.price - stockQuote.yearLow) / range) * 100));
                        return (
                          <div style={{ position: 'absolute', top: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--cyan)', border: '3px solid var(--bg2)', left: `calc(${pct}% - 11px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 7, fontWeight: 800, color: 'var(--bg)' }}>$</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--bear)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(stockQuote.yearLow || 0)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-head)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(quote.price || 0)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--bull)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(stockQuote.yearHigh || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Income Statement */}
              <TabsContent value="income">
                <div className="glass-card" style={gc()}>
                  {incomeStatements.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>{t.fiscalYear}</th>
                            {incomeStatements.slice(0, 5).map((stmt: any, i: number) => (
                              <th key={i} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>
                                {(stmt.date || stmt.fiscalDateEnding || '').substring(0, 4)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: t.revenue, key: 'revenue' },
                            { label: t.grossProfit, key: 'grossProfit' },
                            { label: t.operatingIncome, key: 'operatingIncome' },
                            { label: t.netIncome, key: 'netIncome' },
                            { label: t.eps, key: 'eps' },
                          ].map(row => (
                            <tr key={row.key} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600 }}>{row.label}</td>
                              {incomeStatements.slice(0, 5).map((stmt: any, i: number) => (
                                <td key={i} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }} suppressHydrationWarning>
                                  {row.key === 'eps'
                                    ? (stmt[row.key] != null ? `$${stmt[row.key].toFixed(2)}` : '—')
                                    : formatFinancialValue(stmt[row.key])
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{t.noFinancialData}</div>
                  )}
                </div>
              </TabsContent>

              {/* Balance Sheet */}
              <TabsContent value="balance">
                <div className="glass-card" style={gc()}>
                  {balanceSheets.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>{t.fiscalYear}</th>
                            {balanceSheets.slice(0, 5).map((stmt: any, i: number) => (
                              <th key={i} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>
                                {(stmt.date || stmt.fiscalDateEnding || '').substring(0, 4)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: t.totalAssets, key: 'totalAssets' },
                            { label: t.totalLiabilities, key: 'totalLiabilities' },
                            { label: t.totalEquity, keys: ['totalStockholdersEquity', 'totalEquity'] },
                            { label: t.cash, keys: ['cashAndCashEquivalents', 'cash', 'cashAndShortTermInvestments'] },
                            { label: t.totalDebt, keys: ['totalDebt'] },
                          ].map(row => (
                            <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600 }}>{row.label}</td>
                              {balanceSheets.slice(0, 5).map((stmt: any, i: number) => {
                                const val = row.key ? stmt[row.key] : row.keys?.reduce((v: any, k: string) => v ?? stmt[k], null);
                                return (
                                  <td key={i} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }} suppressHydrationWarning>
                                    {formatFinancialValue(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{t.noFinancialData}</div>
                  )}
                </div>
              </TabsContent>

              {/* Cash Flow */}
              <TabsContent value="cashflow">
                <div className="glass-card" style={gc()}>
                  {cashFlowStatements.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>{t.fiscalYear}</th>
                            {cashFlowStatements.slice(0, 5).map((stmt: any, i: number) => (
                              <th key={i} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>
                                {(stmt.date || stmt.fiscalDateEnding || '').substring(0, 4)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: t.operatingCF, keys: ['operatingCashFlow', 'netCashProvidedByOperatingActivities'] },
                            { label: t.capEx, key: 'capitalExpenditure' },
                            { label: t.freeCashFlow, key: 'freeCashFlow' },
                            { label: t.netIncome, key: 'netIncome' },
                          ].map(row => (
                            <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600 }}>{row.label}</td>
                              {cashFlowStatements.slice(0, 5).map((stmt: any, i: number) => {
                                const val = row.key ? stmt[row.key] : row.keys?.reduce((v: any, k: string) => v ?? stmt[k], null);
                                return (
                                  <td key={i} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 11 }} suppressHydrationWarning>
                                    {formatFinancialValue(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>{t.noFinancialData}</div>
                  )}
                </div>
              </TabsContent>

              {/* Fundamentals Tab — All Key Metrics in Detailed Table */}
              <TabsContent value="fundamentals">
                <div className="glass-card" style={gc()}>
                  {sectionHeader(
                    <Gauge className="w-3.5 h-3.5" />,
                    t.fundamentalsTab
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {/* Valuation Metrics */}
                    {[
                      { label: t.pe, value: resolvedMetrics.peRatio != null ? fmt(resolvedMetrics.peRatio, 1) : '—', color: 'var(--cyan)' },
                      { label: t.eps, value: resolvedMetrics.eps != null ? `$${fmt(resolvedMetrics.eps)}` : '—', color: 'var(--cyan)' },
                      { label: t.marketCap, value: (company.marketCap != null) ? formatFinancialValue(company.marketCap) : (stockQuote?.marketCap != null) ? formatFinancialValue(stockQuote.marketCap) : '—', color: 'var(--cyan)' },
                      { label: t.dividendYield, value: resolvedMetrics.dividendYield != null ? `${fmt(resolvedMetrics.dividendYield)}%` : '—' },
                      { label: t.beta, value: resolvedMetrics.beta != null ? fmt(resolvedMetrics.beta, 2) : '—' },
                      { label: t.roe, value: resolvedMetrics.roe != null ? `${fmt(resolvedMetrics.roe, 1)}%` : '—' },
                      { label: t.roa, value: resolvedMetrics.roa != null ? `${fmt(resolvedMetrics.roa, 1)}%` : '—' },
                      { label: t.grossMargin, value: resolvedMetrics.grossMargin != null ? `${fmt(resolvedMetrics.grossMargin, 1)}%` : '—' },
                      { label: t.operatingMargin, value: resolvedMetrics.operatingMargin != null ? `${fmt(resolvedMetrics.operatingMargin, 1)}%` : '—' },
                      { label: t.netMargin, value: resolvedMetrics.netMargin != null ? `${fmt(resolvedMetrics.netMargin, 1)}%` : '—' },
                      { label: t.debtToEquity, value: resolvedMetrics.debtToEquity != null ? fmt(resolvedMetrics.debtToEquity, 2) : '—' },
                      { label: t.currentRatio, value: resolvedMetrics.currentRatio != null ? fmt(resolvedMetrics.currentRatio, 2) : '—' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color || 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Revenue & Earnings Growth */}
                  {(resolvedMetrics.revenueGrowth != null || resolvedMetrics.earningsGrowth != null) && (
                    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {resolvedMetrics.revenueGrowth != null && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: `1px solid ${resolvedMetrics.revenueGrowth >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Revenue Growth</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: resolvedMetrics.revenueGrowth >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                            {resolvedMetrics.revenueGrowth >= 0 ? '+' : ''}{fmt(resolvedMetrics.revenueGrowth, 1)}%
                          </div>
                        </div>
                      )}
                      {resolvedMetrics.earningsGrowth != null && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: `1px solid ${resolvedMetrics.earningsGrowth >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,83,80,0.2)'}` }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Earnings Growth</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: resolvedMetrics.earningsGrowth >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                            {resolvedMetrics.earningsGrowth >= 0 ? '+' : ''}{fmt(resolvedMetrics.earningsGrowth, 1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              FEATURE 4: TECHNICAL TAB
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="technical" className="mt-4 space-y-5">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {/* Technical Indicators */}
              <div className="glass-card" style={gc()}>
                {sectionHeader(
                  <Activity className="w-3.5 h-3.5" />,
                  t.technicalAnalysis
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* RSI */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.rsi}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace', color: 'var(--text)' }} suppressHydrationWarning>
                        {technicalData.rsi ? fmt(technicalData.rsi, 0) : '—'}
                      </span>
                      {technicalData.rsi && (
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                          background: technicalData.rsi > 70 ? 'var(--bear2)' : technicalData.rsi < 30 ? 'var(--bull2)' : 'var(--gold2)',
                          color: technicalData.rsi > 70 ? 'var(--bear)' : technicalData.rsi < 30 ? 'var(--bull)' : 'var(--gold)',
                        }}>
                          {technicalData.rsi > 70 ? t.overbought : technicalData.rsi < 30 ? t.oversold : t.neutral}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* MACD */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.macdSignal}</span>
                    {technicalData.macdSignal ? (() => {
                      const sc = SIGNAL_COLORS[technicalData.macdSignal] || SIGNAL_COLORS.neutral;
                      return <span style={{ fontSize: 12, fontWeight: 700, color: sc.color, padding: '2px 10px', borderRadius: 6, background: sc.bg }}>{signalLabel(technicalData.macdSignal)}</span>;
                    })() : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </div>
                  {/* Bollinger */}
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{t.bollingerBands}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.upper}: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>{technicalData.bollingerUpper ? fmt(technicalData.bollingerUpper) : '—'}</strong></span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.lower}: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>{technicalData.bollingerLower ? fmt(technicalData.bollingerLower) : '—'}</strong></span>
                    </div>
                  </div>
                  {/* Support / Resistance */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <div style={{ fontSize: 10, color: 'var(--bull)', fontWeight: 700 }}>{t.support}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {technicalData.support ? fmt(technicalData.support) : '—'}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bear2)', border: '1px solid rgba(239,83,80,0.1)' }}>
                      <div style={{ fontSize: 10, color: 'var(--bear)', fontWeight: 700 }}>{t.resistance}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {technicalData.resistance ? fmt(technicalData.resistance) : '—'}
                      </div>
                    </div>
                  </div>
                  {/* MA */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>{t.ma50}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {technicalData.ma50 ? fmt(technicalData.ma50) : '—'}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>{t.ma200}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {technicalData.ma200 ? fmt(technicalData.ma200) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics from FMP */}
              <div className="glass-card" style={gc()}>
                {sectionHeader(
                  <Gauge className="w-3.5 h-3.5" />,
                  t.fundamentalData
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: t.pe, value: resolvedMetrics.peRatio != null ? fmt(resolvedMetrics.peRatio, 1) : '—' },
                    { label: t.eps, value: resolvedMetrics.eps != null ? `$${fmt(resolvedMetrics.eps)}` : '—' },
                    { label: t.marketCap, value: company.marketCap != null ? formatFinancialValue(company.marketCap) : stockQuote?.marketCap != null ? formatFinancialValue(stockQuote.marketCap) : '—' },
                    { label: t.dividendYield, value: resolvedMetrics.dividendYield != null ? `${fmt(resolvedMetrics.dividendYield)}%` : '—' },
                    { label: t.grossMargin, value: resolvedMetrics.grossMargin != null ? `${fmt(resolvedMetrics.grossMargin, 1)}%` : '—' },
                    { label: t.operatingMargin, value: resolvedMetrics.operatingMargin != null ? `${fmt(resolvedMetrics.operatingMargin, 1)}%` : '—' },
                    { label: t.netMargin, value: resolvedMetrics.netMargin != null ? `${fmt(resolvedMetrics.netMargin, 1)}%` : '—' },
                    { label: t.debtToEquity, value: resolvedMetrics.debtToEquity != null ? fmt(resolvedMetrics.debtToEquity, 2) : '—' },
                    { label: t.currentRatio, value: resolvedMetrics.currentRatio != null ? fmt(resolvedMetrics.currentRatio, 2) : '—' },
                    { label: t.roe, value: resolvedMetrics.roe != null ? `${fmt(resolvedMetrics.roe, 1)}%` : '—' },
                    { label: t.roa, value: resolvedMetrics.roa != null ? `${fmt(resolvedMetrics.roa, 1)}%` : '—' },
                    { label: t.beta, value: resolvedMetrics.beta != null ? fmt(resolvedMetrics.beta, 2) : '—' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace', marginTop: 1 }} suppressHydrationWarning>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 52-Week Range */}
                {stockQuote && (stockQuote.yearHigh || stockQuote.yearLow) && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 6 }}>{t.weekRange52}</div>
                    <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--bg)' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5%', right: '5%', borderRadius: 4, background: 'linear-gradient(to right, var(--bear), var(--gold), var(--bull))', opacity: 0.4 }} />
                      {quote.price && stockQuote.yearHigh && stockQuote.yearLow && (() => {
                        const range = stockQuote.yearHigh - stockQuote.yearLow || 1;
                        const pct = Math.max(0, Math.min(100, ((quote.price - stockQuote.yearLow) / range) * 100));
                        return <div style={{ position: 'absolute', top: -3, bottom: -3, width: 3, borderRadius: 2, background: 'var(--cyan)', left: `${pct}%` }} />;
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--bear)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(stockQuote.yearLow || 0)}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--bull)', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        ${fmt(stockQuote.yearHigh || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              FEATURE 5: COMPARISON TAB (6 stocks, winner highlight, mini bars)
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="comparison" className="mt-4 space-y-4">
            <div className="glass-card" style={gc()}>
              {sectionHeader(
                <GitCompareArrows className="w-3.5 h-3.5" />,
                t.comparison
              )}
              {/* Add symbol input */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 200 }}>
                  <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <Input
                    value={compareInput}
                    onChange={e => setCompareInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && addCompareSymbol()}
                    placeholder={t.addSymbol}
                    className="pl-8 h-8 text-xs"
                    dir="ltr"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <Button
                  onClick={addCompareSymbol}
                  disabled={!compareInput.trim() || compareSymbols.length >= MAX_COMPARE}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  style={{ border: '1px solid var(--border)', background: 'var(--cyan2)', color: 'var(--cyan)' }}
                >
                  <Plus className="w-3.5 h-3.5" style={{ marginRight: 4 }} />
                  {t.addSymbol}
                </Button>
                {compareSymbols.length >= MAX_COMPARE && (
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{t.maxStocksReached}</span>
                )}
              </div>

              {/* Active symbols chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {compareSymbols.map(sym => (
                  <Badge
                    key={sym}
                    variant="outline"
                    className="text-xs"
                    style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--border2)' }}
                  >
                    {sym}
                    <button onClick={() => removeCompareSymbol(sym)} style={{ marginLeft: 4, cursor: 'pointer', color: 'var(--text3)' }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {peers.slice(0, 4).map(peer => (
                  !compareSymbols.includes(peer) && compareSymbols.length < MAX_COMPARE && (
                    <button
                      key={peer}
                      onClick={() => {
                        if (compareSymbols.length < MAX_COMPARE) setCompareSymbols(prev => [...prev, peer]);
                      }}
                      style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6, cursor: 'pointer',
                        background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text3)',
                      }}
                    >
                      + {peer}
                    </button>
                  )
                ))}
              </div>

              {/* Comparison table with winner highlight + mini bars */}
              {compareLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <p style={{ color: 'var(--text3)', fontSize: 13 }}>{t.loadingComparison}</p>
                </div>
              ) : compareData.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: isRTL ? 'right' : 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 11, background: 'var(--bg)' }}>{t.companyProfile}</th>
                        {compareData.map((d: any, i: number) => {
                          const sym = d.symbol || d.analysis?.symbol || '—';
                          const isCurrent = sym === symbol;
                          return (
                            <th key={i} style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text)', fontWeight: 700, fontSize: 11, background: isCurrent ? 'var(--bull2)' : 'var(--bg)', minWidth: 100 }}>
                              <span style={{ color: isCurrent ? 'var(--bull)' : 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{sym}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {getComparisonMetrics().map(metric => {
                        const winnerIdx = getWinnerIndex(metric, compareData);
                        return (
                          <tr key={metric.key} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 600, fontSize: 11 }}>{metric.label}</td>
                            {compareData.map((d: any, i: number) => {
                              const val = metric.getVal(d);
                              const isWinner = i === winnerIdx && winnerIdx >= 0;
                              const formatted = formatCompareVal(metric, d);
                              // Get numeric value for mini bar (confidence score)
                              const numericVal = metric.key === 'confidence' ? (metric.getVal(d) || 0) : null;
                              return (
                                <td key={i} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, background: isWinner ? 'var(--bull2)' : 'transparent' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <span style={{
                                      fontWeight: isWinner ? 800 : 600,
                                      color: metric.type === 'signal' ? (SIGNAL_COLORS[val]?.color || 'var(--text-head)') : (isWinner ? 'var(--bull)' : 'var(--text-head)'),
                                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                                    }} suppressHydrationWarning>
                                      {formatted}
                                    </span>
                                    {isWinner && (
                                      <Crown className="w-3 h-3" style={{ color: 'var(--gold)' }} />
                                    )}
                                    {numericVal != null && (
                                      <MiniScoreBar value={numericVal} maxValue={100} />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)', fontSize: 13 }}>
                  {t.noPeers}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              INSIGHTS TAB — Sentiment, AI Recommendations, SWOT (with caching), Sector
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="insights" className="mt-4 space-y-5">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Sentiment Analysis */}
              <SentimentWidget
                overallSignal={signal.overall || 'neutral'}
                confidenceScore={signal.confidence || 0}
                technicalScore={techScoreNorm}
                fundamentalScore={fundamentalScore}
                locale={locale}
              />

              {/* AI Recommendations */}
              <AIRecommendations
                stockRating={stockRating}
                priceTarget={priceTargetData}
                currentPrice={quote.price || 0}
                locale={locale}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* SWOT Analysis — with session caching */}
              <SWOTAnalysis
                symbol={symbol}
                locale={locale}
                companyName={companyName || company.name}
                sector={company.sector}
                initialSwot={swotCache?.swot || null}
                initialGeneratedAt={swotCache?.generatedAt || null}
                onSwotGenerated={handleSwotGenerated}
              />

              {/* Sector Analysis */}
              <SectorAnalysisWidget
                symbol={symbol}
                sector={company.sector || ''}
                locale={locale}
              />
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════
              TOOLS TAB — Fair Value, Paper Trading, Smart Alerts
          ═══════════════════════════════════════════════════ */}
          <TabsContent value="tools" className="mt-4 space-y-5">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Fair Value Calculator */}
              <FairValueCalculator
                stockRating={stockRating}
                priceTarget={priceTargetData}
                currentPrice={quote.price || 0}
                fundamentals={{
                  eps: company.eps,
                  peRatio: company.peRatio,
                  sectorPE: keyMetricsData?.sectorPE,
                }}
                locale={locale}
              />

              {/* Smart Alerts */}
              <SmartAlerts
                symbol={symbol}
                currentPrice={quote.price || 0}
                locale={locale}
              />
            </div>

            {/* Paper Trading */}
            <PaperTrading
              symbol={symbol}
              currentPrice={quote.price || 0}
              locale={locale}
            />
          </TabsContent>

          {analysis.content && (
            <TabsContent value="ai" className="mt-4">
              <AIAnalysisRenderer content={analysis.content} locale={locale} />
            </TabsContent>
          )}
        </Tabs>

        {/* ═══ DISCLAIMER ═══ */}
        <div style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 8,
          background: 'var(--bg2)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{t.disclaimer}</span>
        </div>
      </div>
    </main>
  );
}
