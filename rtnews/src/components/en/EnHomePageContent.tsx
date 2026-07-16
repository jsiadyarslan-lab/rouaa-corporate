'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { InfographicData } from '@/components/infographics/types';

// Dynamic import for InfographicCard (echarts) — saves ~200-400KB off homepage bundle
const InfographicCard = dynamic(() => import('@/components/infographics/InfographicCard'));
import StockCompanyAnalysisSection from '@/components/home/StockCompanyAnalysisSection';
import HomeVideosSection from '@/components/home/HomeVideosSection';
import TechnicalAnalysesHomeSection from '@/components/home/TechnicalAnalysesHomeSection';
import QuickInsightCards from '@/components/home/QuickInsightCards';


/* ══════════════════════════════════════════════════════════════════════
   TYPES — All data comes from live APIs
   ══════════════════════════════════════════════════════════════════════ */

interface PriceItem {
  symbol: string;
  displaySymbol: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  change: number;
  changePercent: number;
  category: string;
  decimals: number;
  source: string;
  sparkline?: number[]; // Real sparkline data from trading platform
}

interface SentimentData {
  fearGreedIndex: { value: number; label: string };
  arabSentimentIndex: { value: number; label: string; topSearchedAsset: string; majorityVote: string };
  geopoliticalRiskIndex: { value: number; label: string; description: string; impacts: Record<string, { trend: string; value: string }> };
  aiPowered: boolean;
  aiSummary: string | null;
}

interface ArabMarketItem {
  id: string;
  name: string;
  nameEn: string;
  flag: string;
  country: string;
  region: string;
  value: number;
  change: number;
  sparkline: number[];
  timezone: string;
  openTime: string;
  closeTime: string;
  source: string;
}

interface CalendarEvent {
  id: string;
  event: string;
  eventAr: string;
  country: string;
  time: string;
  impactLevel: number;
  forecast: string;
  previous: string;
  currency: string;
  affectedAssets: { symbol: string; direction: string }[];
}

interface NewsItem {
  id: string;
  slug?: string;
  href?: string;
  kind?: string;
  badge?: string;
  sourceName?: string;
  isOfficialSource?: boolean;
  title: string;
  summary?: string;
  time: string;
  source: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  imageUrl?: string;
}

interface CentralBankItem {
  id: string;
  name: string;
  country: string;
  flag: string;
  currentRate: number;
  previousRate: number;
  nextMeetingDate: string;
  aiPrediction: string;
  aiConfidence: number;
}

interface CouncilBrief {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  analysisSummary?: string;
  issuedAt: string;
}

interface MarketAnalysis {
  id: string;
  title: string;
  slug: string;
  assetClass: string;
  analysisType: string;
  timeFrame: string;
  riskLevel: string;
  sentiment: string;
  confidenceScore: number;
  publishedAt: string;
}

interface EconomicReport {
  id: string;
  title: string;
  slug: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string;
}

interface InfographicItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category?: string;
  thumbnailUrl?: string;
  slides: any[];
  publishedAt?: string;
  createdAt: string;
}

const MONO = `var(--font-jetbrains-mono), monospace`;

/* ══════════════════════════════════════════════════════════════════════
   TEXT DICTIONARY — Locale-aware string translations
   ══════════════════════════════════════════════════════════════════════ */
const TEXT: Record<string, Record<string, string>> = {
  en: {
    // Section headers & UI labels
    latestNews: 'Latest News',
    viewAllArrow: 'View All →',
    viewAll: 'View All',
    strategicReports: 'Strategic Reports',
    reportsAndAnalysis: 'Reports & Analysis',
    topMarketMovers: 'Top Market Movers',
    marketsHub: 'Markets Hub',
    infographics: 'Infographics',
    visualAnalysis: 'Visual Analysis',
    economicCalendar: 'Economic Calendar',
    arabMarkets: 'US Markets',
    marketsTable: 'Markets Table',
    symbol: 'Symbol',
    name: 'Name',
    price: 'Price',
    change: 'Change',
    pctChange: '% Change',
    trend: 'Trend',
    academy: 'Academy',
    centralBanks: 'Central Banks',
    fearGreedIndex: 'Fear & Greed Index',
    extremeFear: 'Extreme Fear',
    neutral: 'Neutral',
    extremeGreed: 'Extreme Greed',
    aiMonitorActiveAssets: '🤖 AI Monitor — Active Assets',
    rising: '▲ Rising',
    falling: '▼ Falling',
    mostActive: '🔥 Most Active',
    // Report/Analysis labels
    bullish: 'Bullish',
    bearish: 'Bearish',
    strategic: 'Strategic',
    arabic: 'Arabic',
    global: 'Global',
    regional: 'Regional',
    report: 'Report',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    daily: 'Daily',
    risk: 'Risk:',
    low: 'low',
    medium: 'medium',
    high: 'high',
    extreme: 'extreme',
    // Central bank labels
    hike: 'Hike',
    cut: 'Cut',
    hold: 'Hold',
    // Empty/no-data messages
    noDataAvailable: 'No data available',
    noNewsAvailable: 'No news available',
    noPriceDataAvailable: 'No price data available',
    noStrategicReportsAvailable: 'No strategic reports available',
    noReportsOrAnalysesAvailable: 'No reports or analyses available',
    noInfographicsAvailable: 'No infographics available',
    noCentralBankDataAvailable: 'No central bank data available',
    noData: 'No data',
    // timeAgo
    now: 'now',
    tm: 'm',
    th: 'h',
    td: 'd',
    // Fear & Greed label mapping
    fear: 'Fear',
    moderateCaution: 'Moderate Caution',
    greed: 'Greed',
    // Geopolitical labels
    geoLow: 'Low',
    geoMedium: 'Medium',
    geoHigh: 'High',
    // Academy items
    priceToEarnings: 'Price to Earnings',
    relativeStrengthIndex: 'Relative Strength Index',
    grossDomesticProduct: 'Gross Domestic Product',
    consumerPriceIndex: 'Consumer Price Index',
    earningsPerShare: 'Earnings Per Share',
    movingAvgConvergenceDivergence: 'Moving Avg Convergence Divergence',
    fundamental: 'Fundamental',
    technical: 'Technical',
    macro: 'Macro',
    // Asset class labels
    stocks: 'Stocks',
    commodities: 'Commodities',
    forex: 'Forex',
    crypto: 'Crypto',
    bonds: 'Bonds',
    energy: 'Energy',
    realEstate: 'Real Estate',
    economy: 'Economy',
    banking: 'Banking',
    earnings: 'Earnings',
    // Tab labels
    all: 'All',
    // Additional section headers
    globalIndices: 'Global Indices',
    tradingHours: 'Trading Hours',
    topMovers: 'Top Movers',
    communityPulse: 'Community Pulse',
    geopoliticalRisk: 'Geopolitical Risk',
    // Market hours
    open: 'Open',
    closed: 'Closed',
    ref: 'Ref.',
    // Why Rouaa
    whyRouaa: 'Why Rouaa',
    instantAiAnalysis: 'Instant AI Analysis',
    realtimeAiAnalytics: 'Real-time AI-powered analytics',
    liveNews247: 'Live News 24/7',
    continuousNewsCoverage: 'Continuous global market news coverage',
    preciseAnalytics: 'Precise Analytics',
    dataDrivenInsights: 'Data-driven insights with key price levels',
    smartAlerts: 'Smart Alerts',
    live: 'LIVE',
  },
  es: {
    // Section headers & UI labels
    latestNews: 'Últimas Noticias',
    viewAllArrow: 'Ver Todo →',
    viewAll: 'Ver Todo',
    strategicReports: 'Informes Estratégicos',
    reportsAndAnalysis: 'Informes y Análisis',
    topMarketMovers: 'Principales Movimientos del Mercado',
    marketsHub: 'Centro de Mercados',
    infographics: 'Infografías',
    visualAnalysis: 'Análisis Visual',
    economicCalendar: 'Calendario Económico',
    arabMarkets: 'Mercados Hispanos',
    marketsTable: 'Tabla de Mercados',
    symbol: 'Símbolo',
    name: 'Nombre',
    price: 'Precio',
    change: 'Cambio',
    pctChange: '% Cambio',
    trend: 'Tendencia',
    academy: 'Academia',
    centralBanks: 'Bancos Centrales',
    fearGreedIndex: 'Índice de Miedo y Codicia',
    extremeFear: 'Miedo Extremo',
    neutral: 'Neutral',
    extremeGreed: 'Codicia Extrema',
    aiMonitorActiveAssets: '🤖 Monitor IA — Activos Activos',
    rising: '▲ En Alza',
    falling: '▼ En Baja',
    mostActive: '🔥 Más Activos',
    // Report/Analysis labels
    bullish: 'Alcista',
    bearish: 'Bajista',
    strategic: 'Estratégico',
    arabic: 'Árabe',
    global: 'Global',
    regional: 'Regional',
    report: 'Informe',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    daily: 'Diario',
    risk: 'Riesgo:',
    low: 'bajo',
    medium: 'medio',
    high: 'alto',
    extreme: 'extremo',
    // Central bank labels
    hike: 'Subida',
    cut: 'Recorte',
    hold: 'Mantener',
    // Empty/no-data messages
    noDataAvailable: 'No hay datos disponibles',
    noNewsAvailable: 'No hay noticias disponibles',
    noPriceDataAvailable: 'No hay datos de precios disponibles',
    noStrategicReportsAvailable: 'No hay informes estratégicos disponibles',
    noReportsOrAnalysesAvailable: 'No hay informes ni análisis disponibles',
    noInfographicsAvailable: 'No hay infografías disponibles',
    noCentralBankDataAvailable: 'No hay datos de bancos centrales disponibles',
    noData: 'Sin datos',
    // timeAgo
    now: 'ahora',
    tm: 'm',
    th: 'h',
    td: 'd',
    // Fear & Greed label mapping
    fear: 'Miedo',
    moderateCaution: 'Caución Moderada',
    greed: 'Codicia',
    // Geopolitical labels
    geoLow: 'Bajo',
    geoMedium: 'Medio',
    geoHigh: 'Alto',
    // Academy items
    priceToEarnings: 'Precio a Ganancias',
    relativeStrengthIndex: 'Índice de Fuerza Relativa',
    grossDomesticProduct: 'Producto Interno Bruto',
    consumerPriceIndex: 'Índice de Precios al Consumidor',
    earningsPerShare: 'Ganancias por Acción',
    movingAvgConvergenceDivergence: 'Convergencia/Divergencia de Media Móvil',
    fundamental: 'Fundamental',
    technical: 'Técnico',
    macro: 'Macro',
    // Asset class labels
    stocks: 'Acciones',
    commodities: 'Materias Primas',
    forex: 'Divisas',
    crypto: 'Criptomonedas',
    bonds: 'Bonos',
    energy: 'Energía',
    realEstate: 'Bienes Raíces',
    economy: 'Economía',
    banking: 'Banca',
    earnings: 'Ganancias',
    // Tab labels
    all: 'Todos',
    // Additional section headers
    globalIndices: 'Índices Globales',
    tradingHours: 'Horario de Negociación',
    topMovers: 'Principales Movimientos',
    communityPulse: 'Pulso de la Comunidad',
    geopoliticalRisk: 'Riesgo Geopolítico',
    // Market hours
    open: 'Abierto',
    closed: 'Cerrado',
    ref: 'Ref.',
    // Why Rouaa
    whyRouaa: 'Por qué Rouaa',
    instantAiAnalysis: 'Análisis IA Instantáneo',
    realtimeAiAnalytics: 'Analítica impulsada por IA en tiempo real',
    liveNews247: 'Noticias en Vivo 24/7',
    continuousNewsCoverage: 'Cobertura continua de noticias de mercados globales',
    preciseAnalytics: 'Análisis Preciso',
    dataDrivenInsights: 'Perspectivas basadas en datos con niveles clave',
    smartAlerts: 'Alertas Inteligentes',
    live: 'EN VIVO',
  },
  ar: {
    // Section headers & UI labels
    latestNews: 'آخر الأخبار',
    viewAllArrow: 'عرض الكل ←',
    viewAll: 'عرض الكل',
    strategicReports: 'تقارير استراتيجية',
    reportsAndAnalysis: 'تقارير وتحليلات',
    topMarketMovers: 'أكبر محركات السوق',
    marketsHub: 'مركز الأسواق',
    infographics: 'إنفوجرافيك',
    visualAnalysis: 'تحليل بصري',
    economicCalendar: 'التقويم الاقتصادي',
    arabMarkets: 'الأسواق الأمريكية',
    marketsTable: 'جدول الأسواق',
    symbol: 'الرمز',
    name: 'الاسم',
    price: 'السعر',
    change: 'التغيير',
    pctChange: '% التغيير',
    trend: 'الاتجاه',
    academy: 'الأكاديمية',
    centralBanks: 'البنوك المركزية',
    fearGreedIndex: 'مؤشر الخوف والطمع',
    extremeFear: 'خوف شديد',
    neutral: 'محايد',
    extremeGreed: 'طمع شديد',
    aiMonitorActiveAssets: '🤖 مراقب AI — أصول نشطة',
    rising: '▲ صاعدة',
    falling: '▼ هابطة',
    mostActive: '🔥 الأكثر نشاطاً',
    // Report/Analysis labels
    bullish: 'صاعد',
    bearish: 'هابط',
    strategic: 'استراتيجي',
    arabic: 'عربي',
    global: 'عالمي',
    regional: 'إقليمي',
    report: 'تقرير',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'فصلي',
    daily: 'يومي',
    risk: 'المخاطر:',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    extreme: 'شديد',
    // Central bank labels
    hike: 'رفع',
    cut: 'خفض',
    hold: 'ثبات',
    // Empty/no-data messages
    noDataAvailable: 'لا توجد بيانات متاحة',
    noNewsAvailable: 'لا توجد أخبار متاحة',
    noPriceDataAvailable: 'لا توجد بيانات أسعار متاحة',
    noStrategicReportsAvailable: 'لا توجد تقارير استراتيجية متاحة',
    noReportsOrAnalysesAvailable: 'لا توجد تقارير أو تحليلات متاحة',
    noInfographicsAvailable: 'لا توجد إنفوجرافيك متاحة',
    noCentralBankDataAvailable: 'لا توجد بيانات بنوك مركزية متاحة',
    noData: 'لا توجد بيانات',
    // timeAgo
    now: 'الآن',
    tm: 'د',
    th: 'س',
    td: 'ي',
    // Fear & Greed label mapping
    fear: 'خوف',
    moderateCaution: 'حذر متوسط',
    greed: 'طمع',
    // Geopolitical labels
    geoLow: 'منخفض',
    geoMedium: 'متوسط',
    geoHigh: 'مرتفع',
    // Academy items
    priceToEarnings: 'السعر إلى الأرباح',
    relativeStrengthIndex: 'مؤشر القوة النسبية',
    grossDomesticProduct: 'الناتج المحلي الإجمالي',
    consumerPriceIndex: 'مؤشر أسعار المستهلكين',
    earningsPerShare: 'الأرباح لكل سهم',
    movingAvgConvergenceDivergence: 'تقارب وتباعد المتوسط المتحرك',
    fundamental: 'أساسي',
    technical: 'فني',
    macro: 'اقتصادي كلي',
    // Asset class labels
    stocks: 'أسهم',
    commodities: 'سلع',
    forex: 'فوركس',
    crypto: 'عملات رقمية',
    bonds: 'سندات',
    energy: 'طاقة',
    realEstate: 'عقارات',
    economy: 'اقتصاد',
    banking: 'مصارف',
    earnings: 'أرباح',
    // Tab labels
    all: 'الكل',
    // Additional section headers
    globalIndices: 'مؤشرات عالمية',
    tradingHours: 'ساعات التداول',
    topMovers: 'أكبر المحركات',
    communityPulse: 'نبض المجتمع',
    geopoliticalRisk: 'المخاطر الجيوسياسية',
    // Market hours
    open: 'مفتوح',
    closed: 'مغلق',
    ref: 'مرجع',
    // Why Rouaa
    whyRouaa: 'لماذا رؤية',
    instantAiAnalysis: 'تحليل AI فوري',
    realtimeAiAnalytics: 'تحليلات AI في الوقت الحقيقي',
    liveNews247: 'أخبار مباشرة 24/7',
    continuousNewsCoverage: 'تغطية إخبارية مستمرة للأسواق العالمية',
    preciseAnalytics: 'تحليلات دقيقة',
    dataDrivenInsights: 'رؤى مبنية على البيانات مع مستويات أسعار رئيسية',
    smartAlerts: 'تنبيهات ذكية',
    live: 'مباشر',
  },
  fr: {
    // Section headers & UI labels
    latestNews: 'Dernières actualités',
    viewAllArrow: 'Voir tout →',
    viewAll: 'Voir tout',
    strategicReports: 'Rapports stratégiques',
    reportsAndAnalysis: 'Rapports et Analyse',
    topMarketMovers: 'Principaux mouvements du marché',
    marketsHub: 'Centre des marchés',
    infographics: 'Infographies',
    visualAnalysis: 'Analyse visuelle',
    economicCalendar: 'Calendrier économique',
    arabMarkets: 'Marchés américains',
    marketsTable: 'Tableau des marchés',
    symbol: 'Symbole',
    name: 'Nom',
    price: 'Prix',
    change: 'Variation',
    pctChange: '% Variation',
    trend: 'Tendance',
    academy: 'Académie',
    centralBanks: 'Banques centrales',
    fearGreedIndex: 'Indice Peur & Cupidité',
    extremeFear: 'Peur extrême',
    neutral: 'Neutre',
    extremeGreed: 'Cupidité extrême',
    aiMonitorActiveAssets: '🤖 Moniteur IA — Actifs actifs',
    rising: '▲ En hausse',
    falling: '▼ En baisse',
    mostActive: '🔥 Plus actifs',
    // Report/Analysis labels
    bullish: 'Haussier',
    bearish: 'Baissier',
    strategic: 'Stratégique',
    arabic: 'Arabe',
    global: 'Mondial',
    regional: 'Régional',
    report: 'Rapport',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    daily: 'Quotidien',
    risk: 'Risque :',
    low: 'faible',
    medium: 'moyen',
    high: 'élevé',
    extreme: 'extrême',
    // Central bank labels
    hike: 'Hausse',
    cut: 'Baisse',
    hold: 'Maintien',
    // Empty/no-data messages
    noDataAvailable: 'Aucune donnée disponible',
    noNewsAvailable: 'Aucune actualité disponible',
    noPriceDataAvailable: 'Aucune donnée de prix disponible',
    noStrategicReportsAvailable: 'Aucun rapport stratégique disponible',
    noReportsOrAnalysesAvailable: 'Aucun rapport ou analyse disponible',
    noInfographicsAvailable: 'Aucune infographie disponible',
    noCentralBankDataAvailable: 'Aucune donnée de banque centrale disponible',
    noData: 'Aucune donnée',
    // timeAgo
    now: 'maintenant',
    tm: 'm',
    th: 'h',
    td: 'j',
    // Fear & Greed label mapping
    fear: 'Peur',
    moderateCaution: 'Prudence modérée',
    greed: 'Cupidité',
    // Geopolitical labels
    geoLow: 'Faible',
    geoMedium: 'Moyen',
    geoHigh: 'Élevé',
    // Academy items
    priceToEarnings: 'Prix par bénéfice',
    relativeStrengthIndex: 'Indice de force relative',
    grossDomesticProduct: 'Produit intérieur brut',
    consumerPriceIndex: 'Indice des prix à la consommation',
    earningsPerShare: 'Bénéfice par action',
    movingAvgConvergenceDivergence: 'Convergence/Divergence de moyenne mobile',
    fundamental: 'Fondamental',
    technical: 'Technique',
    macro: 'Macro',
    // Asset class labels
    stocks: 'Actions',
    commodities: 'Matières premières',
    forex: 'Forex',
    crypto: 'Crypto',
    bonds: 'Obligations',
    energy: 'Énergie',
    realEstate: 'Immobilier',
    economy: 'Économie',
    banking: 'Banque',
    earnings: 'Résultats',
    // Tab labels
    all: 'Tout',
    // Additional section headers
    globalIndices: 'Indices mondiaux',
    tradingHours: 'Heures de trading',
    topMovers: 'Principaux mouvements',
    communityPulse: 'Pulse de la communauté',
    geopoliticalRisk: 'Risque géopolitique',
    // Market hours
    open: 'Ouvert',
    closed: 'Fermé',
    ref: 'Réf.',
    // Why Rouaa
    whyRouaa: 'Pourquoi Rouaa',
    instantAiAnalysis: 'Analyse IA instantanée',
    realtimeAiAnalytics: 'Analytique en temps réel alimentée par l\'IA',
    liveNews247: 'Actualités en direct 24/7',
    continuousNewsCoverage: 'Couverture continue des actualités des marchés mondiaux',
    preciseAnalytics: 'Analyses précises',
    dataDrivenInsights: 'Perspectives basées sur les données avec niveaux de prix clés',
    smartAlerts: 'Alertes intelligentes',
    live: 'EN DIRECT',
  },
  tr: {
    // Section headers & UI labels
    latestNews: 'Son Haberler',
    viewAllArrow: 'Tümünü Gör →',
    viewAll: 'Tümünü Gör',
    strategicReports: 'Stratejik Raporlar',
    reportsAndAnalysis: 'Raporlar ve Analiz',
    topMarketMovers: 'En Çok Hareket Edenler',
    marketsHub: 'Piyasa Merkezi',
    infographics: 'İnfografikler',
    visualAnalysis: 'Görsel Analiz',
    economicCalendar: 'Ekonomik Takvim',
    arabMarkets: 'ABD Piyasaları',
    marketsTable: 'Piyasa Tablosu',
    symbol: 'Sembol',
    name: 'Ad',
    price: 'Fiyat',
    change: 'Değişim',
    pctChange: '% Değişim',
    trend: 'Trend',
    academy: 'Akademi',
    centralBanks: 'Merkez Bankaları',
    fearGreedIndex: 'Korku & Açgözlülük Endeksi',
    extremeFear: 'Aşırı Korku',
    neutral: 'Nötr',
    extremeGreed: 'Aşırı Açgözlülük',
    aiMonitorActiveAssets: '🤖 AI Monitörü — Aktif Varlıklar',
    rising: '▲ Yükselen',
    falling: '▼ Düşen',
    mostActive: '🔥 En Aktif',
    // Report/Analysis labels
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    strategic: 'Stratejik',
    arabic: 'Arapça',
    global: 'Küresel',
    regional: 'Bölgesel',
    report: 'Rapor',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: 'Üç Aylık',
    daily: 'Günlük',
    risk: 'Risk:',
    low: 'düşük',
    medium: 'orta',
    high: 'yüksek',
    extreme: 'aşırı',
    // Central bank labels
    hike: 'Artış',
    cut: 'İndirim',
    hold: 'Bekleme',
    // Empty/no-data messages
    noDataAvailable: 'Veri mevcut değil',
    noNewsAvailable: 'Haber mevcut değil',
    noPriceDataAvailable: 'Fiyat verisi mevcut değil',
    noStrategicReportsAvailable: 'Stratejik rapor mevcut değil',
    noReportsOrAnalysesAvailable: 'Rapor veya analiz mevcut değil',
    noInfographicsAvailable: 'İnfografik mevcut değil',
    noCentralBankDataAvailable: 'Merkez bankası verisi mevcut değil',
    noData: 'Veri yok',
    // timeAgo
    now: 'şimdi',
    tm: 'dk',
    th: 'sa',
    td: 'g',
    // Fear & Greed label mapping
    fear: 'Korku',
    moderateCaution: 'Orta Dikkat',
    greed: 'Açgözlülük',
    // Geopolitical labels
    geoLow: 'Düşük',
    geoMedium: 'Orta',
    geoHigh: 'Yüksek',
    // Academy items
    priceToEarnings: 'Fiyat/Kazanç',
    relativeStrengthIndex: 'Güçlü Göreli Endeks',
    grossDomesticProduct: 'Gayri Safi Yurt İçi Hasıla',
    consumerPriceIndex: 'Tüketici Fiyat Endeksi',
    earningsPerShare: 'Hisse Başı Kazanç',
    movingAvgConvergenceDivergence: 'Hareketli Ortalama Yakınsama/Iraksama',
    fundamental: 'Temel',
    technical: 'Teknik',
    macro: 'Makro',
    // Asset class labels
    stocks: 'Hisse Senetleri',
    commodities: 'Emtia',
    forex: 'Forex',
    crypto: 'Kripto',
    bonds: 'Tahviller',
    energy: 'Enerji',
    realEstate: 'Gayrimenkul',
    economy: 'Ekonomi',
    banking: 'Bankacılık',
    earnings: 'Kazançlar',
    // Tab labels
    all: 'Tümü',
    // Additional section headers
    globalIndices: 'Küresel Endeksler',
    tradingHours: 'İşlem Saatleri',
    topMovers: 'En Çok Hareket Edenler',
    communityPulse: 'Topluluk Nabzı',
    geopoliticalRisk: 'Jeopolitik Risk',
    // Market hours
    open: 'Açık',
    closed: 'Kapalı',
    ref: 'Ref.',
    // Why Rouaa
    whyRouaa: 'Neden Rouaa',
    instantAiAnalysis: 'Anlık AI Analizi',
    realtimeAiAnalytics: 'Gerçek zamanlı AI destekli analitik',
    liveNews247: 'Canlı Haber 24/7',
    continuousNewsCoverage: 'Kesintisiz küresel piyasa haber kapsamı',
    preciseAnalytics: 'Hassas Analizler',
    dataDrivenInsights: 'Veri odaklı içgörüler ve temel fiyat seviyeleri',
    smartAlerts: 'Akıllı Uyarılar',
    live: 'CANLI',
  },
};

/* Arabic-to-English category mapping for the English page */
const CATEGORY_MAP: Record<string, string> = {
  'أسهم': 'Stocks',
  'عملات': 'Forex',
  'كريبتو': 'Crypto',
  'سلع': 'Commodities',
  'طاقة': 'Energy',
};

function translateCategory(cat: string): string {
  return CATEGORY_MAP[cat] || cat;
}

/* Arabic-to-English central bank name mapping */
const CENTRAL_BANK_NAME_MAP: Record<string, string> = {
  'البنك المركزي السعودي': 'Saudi Central Bank (SAMA)',
  'البنك المركزي الإماراتي': 'UAE Central Bank',
  'البنك المركزي المصري': 'Central Bank of Egypt',
  'البنك المركزي الكويتي': 'Central Bank of Kuwait',
  'البنك المركزي القطري': 'Qatar Central Bank',
  'البنك المركزي البحريني': 'Central Bank of Bahrain',
  'البنك المركزي العماني': 'Central Bank of Oman',
  'البنك المركزي الأردني': 'Central Bank of Jordan',
  'بنك المغرب': 'Bank Al-Maghrib',
  'الاحتياطي الفيدرالي الأمريكي': 'Federal Reserve (Fed)',
  'البنك المركزي الأوروبي': 'European Central Bank (ECB)',
  'بنك إنجلترا': 'Bank of England (BoE)',
  'بنك اليابان': 'Bank of Japan (BoJ)',
  'البنك الوطني السويسري': 'Swiss National Bank (SNB)',
  'البنك الشعبي الصيني': "People's Bank of China (PBoC)",
};

/* Arabic-to-English sentiment label mapping */
const FEAR_GREED_LABEL_MAP: Record<string, Record<string, string>> = {
  en: {
    'خوف شديد': 'Extreme Fear',
    'خوف': 'Fear',
    'حذر متوسط': 'Moderate Caution',
    'طمع': 'Greed',
    'طمع شديد': 'Extreme Greed',
    'لا توجد بيانات': 'No data',
  },
  es: {
    'خوف شديد': 'Miedo Extremo',
    'خوف': 'Miedo',
    'حذر متوسط': 'Caución Moderada',
    'طمع': 'Codicia',
    'طمع شديد': 'Codicia Extrema',
    'لا توجد بيانات': 'Sin datos',
  },
};

const GEOPOLITICAL_LABEL_MAP: Record<string, Record<string, string>> = {
  en: {
    'منخفض': 'Low',
    'متوسط': 'Medium',
    'مرتفع': 'High',
  },
  es: {
    'منخفض': 'Bajo',
    'متوسط': 'Medio',
    'مرتفع': 'Alto',
  },
};

const GEOPOLITICAL_DESC_MAP: Record<string, string> = {
  'تصاعد التوترات الجيوسياسية يؤثر على أسواق الطاقة والمعادن الثمينة': 'Escalating geopolitical tensions impacting energy and precious metals markets',
  'توترات جيوسياسية معتدلة مع تأثير محدود على الأسواق': 'Moderate geopolitical tensions with limited market impact',
};

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

function fmtPrice(p: number, d: number) {
  return p.toFixed(d);
}

function stripStrategicPrefix(title: string): string {
  return title.replace(/^Report Strategic:\s*/i, '').replace(/^Report Strategic\s*[-–—:]\s*/i, '');
}

function timeAgo(dateStr: string | null | undefined, loc: string = 'en'): string {
  const tl = TEXT[loc] || TEXT.en;
  try {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return tl.now;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return tl.now;
    if (diffMin < 60) return `${diffMin}${tl.tm}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}${tl.th}`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}${tl.td}`;
  } catch {
    return '';
  }
}

/** Format publication time for English — e.g. "May 15 · 10:30 AM" */
function formatPubTimeEn(dateStr: string | null | undefined): string {
  try {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      + ' · '
      + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatEventTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  } catch {
    return '--:--';
  }
}

/** Convert real sparkline data (array of numbers) to SVG points string */
function realSparklinePoints(data: number[]): string {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const step = w / (data.length - 1);
  return data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
}

/**
 * Generate a simple trend line (no fake randomness — just a directional indicator)
 * Used when real sparkline data is unavailable from the trading platform.
 */
function trendLinePoints(positive: boolean): string {
  const w = 80;
  const h = 28;
  const mid = h / 2;
  const dir = positive ? -1 : 1;
  // Generate a realistic-looking 8-point trend with minor oscillations
  const pts: [number, number][] = [];
  for (let i = 0; i <= 7; i++) {
    const x = (i / 7) * w;
    const baseY = mid + dir * (i / 7) * 8;
    // Add small deterministic "noise" (sin-based so it's consistent)
    const noise = Math.sin(i * 1.7) * 2.5;
    pts.push([x, baseY + noise]);
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function Sparkline({ positive, data }: { positive: boolean; data?: number[] }) {
  const points = useMemo(() => {
    if (data && data.length >= 2) return realSparklinePoints(data);
    return trendLinePoints(positive);
  }, [data, positive]);

  if (!points) return null;

  const hasRealData = data && data.length >= 2;
  const color = positive ? 'var(--bull)' : 'var(--bear)';
  const colorRgb = positive ? '34,197,94' : '239,83,80';

  return (
    <svg viewBox="0 0 80 28" style={{ width: 80, height: 28 }}>
      {/* Subtle area fill under the line */}
      <polygon
        fill={`rgba(${colorRgb},0.08)`}
        points={`0,28 ${points} 80,28`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={hasRealData ? 1.5 : 1}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={hasRealData ? 'none' : '4 2'}
        points={points}
      />
    </svg>
  );
}

/* Loading skeleton */
function Skeleton({ w, h }: { w: string; h: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--r)' }} />;
}

/* NoData placeholder — compact to avoid unjustified empty space */
function NoData({ message }: { message?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
      {message || TEXT.en.noDataAvailable}
    </div>
  );
}

/* Section Header — gradient left border with title + optional link */
function SectionHeader({ title, linkText, linkHref }: { title: string; linkText?: string; linkHref?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)', letterSpacing: 0.3 }}>{title}</span>
      </div>
      {linkText && linkHref && (
        <a href={linkHref} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85, transition: 'opacity .15s' }}>
          {linkText} →
        </a>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Fetches ALL data from live APIs
   ══════════════════════════════════════════════════════════════════════ */

// V60: Accept ALL server-fetched data for instant SSR rendering
// No more client-side waterfall — users see a fully populated page immediately.
interface HomePageContentProps {
  initialNews?: any[];
  initialPrices?: any[];
  initialSparklines?: Record<string, number[]>;
  initialSentiment?: any;
  initialArabMarkets?: any[];
  initialCalendar?: any[];
  initialCentralBanks?: any[];
  initialCouncilBriefs?: any[];
  initialAnalyses?: any[];
  initialReports?: any[];
  initialStrategicReports?: any[];
  initialInfographics?: any[];
  /** Locale for link generation — defaults to 'en' */
  locale?: 'en' | 'es' | 'fr' | 'tr';
}

// Helper to merge sparklines into price items
function enrichPricesWithSparklines(prices: any[], sparklines: Record<string, number[]>): PriceItem[] {
  const tpSymbolMap: Record<string, string> = {
    'BTC': 'BTC-USDT', 'ETH': 'ETH-USDT', 'SOL': 'SOL-USDT',
    'XAU': 'XAU-USD', 'XAG': 'XAG-USD', 'WTI': 'CL-USD',
    'EUR': 'EUR-USD', 'GBP': 'GBP-USD', 'JPY': 'USD-JPY',
    'DXY': 'DXY-USD',
  };
  return prices.map((p: any) => {
    const tpSymbol = tpSymbolMap[p.symbol];
    const sparkline = tpSymbol ? sparklines[tpSymbol] : undefined;
    return { ...p, category: translateCategory(p.category), sparkline: sparkline && sparkline.length >= 2 ? sparkline : undefined } as PriceItem;
  });
}

// ── Isolated UTC Clock — prevents re-rendering entire page every second ──
const UtcClock = memo(function UtcClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--cyan)' }}>UTC {time}</span>;
});

export default function HomePageContent({
  initialNews = [],
  initialPrices = [],
  initialSparklines = {},
  initialSentiment = null,
  initialArabMarkets = [],
  initialCalendar = [],
  initialCentralBanks = [],
  initialCouncilBriefs = [],
  initialAnalyses = [],
  initialReports = [],
  initialStrategicReports = [],
  initialInfographics = [],
  locale = 'en',
}: HomePageContentProps = {}) {
  // ── Locale-aware text & maps ──
  const t = TEXT[locale] || TEXT.en;
  const fearGreedLabelMap = FEAR_GREED_LABEL_MAP[locale] || FEAR_GREED_LABEL_MAP.en;
  const geopoliticalLabelMap = GEOPOLITICAL_LABEL_MAP[locale] || GEOPOLITICAL_LABEL_MAP.en;

  // ── State for all live data — initialized from SSR data ──
  const [prices, setPrices] = useState<PriceItem[]>(() =>
    initialPrices.length > 0 ? enrichPricesWithSparklines(initialPrices, initialSparklines) : []
  );
  const [sentiment, setSentiment] = useState<SentimentData | null>(initialSentiment);
  const [arabMarkets, setArabMarkets] = useState<ArabMarketItem[]>(initialArabMarkets);
  const [calendar, setCalendar] = useState<CalendarEvent[]>(initialCalendar);
  const [news, setNews] = useState<NewsItem[]>(() => {
    if (initialNews && initialNews.length > 0) {
      return initialNews.map((n: any) => ({
        id: n.id, slug: n.slug, newsType: n.newsType || 'live',
        title: n.title || '',
        summary: n.summary || '',
        category: n.category || 'Macro',
        sentiment: n.sentiment || 'neutral', sentimentScore: n.sentimentScore || 55,
        impactLevel: n.impactLevel || 'low', source: n.source || '',
        sourceName: n.sourceName || n.source || '',
        url: n.url || '', imageUrl: n.imageUrl,
        href: n.href, kind: n.kind, badge: n.badge, isOfficialSource: n.isOfficialSource,
        time: n.time || n.fetchedAt,
        hasFullContent: n.hasFullContent ?? true, aiAnalysis: n.aiAnalysis,
      }));
    }
    return [];
  });
  const [centralBanks, setCentralBanks] = useState<CentralBankItem[]>(initialCentralBanks);
  const [councilBriefs, setCouncilBriefs] = useState<CouncilBrief[]>(initialCouncilBriefs);
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>(initialAnalyses);
  const [reports, setReports] = useState<EconomicReport[]>(initialReports);
  const [infographics, setInfographics] = useState<InfographicItem[]>(initialInfographics);
  const [strategicReports, setStrategicReports] = useState<EconomicReport[]>(initialStrategicReports);
  // V60: If we have SSR data, DON'T show loading state — data is already there!
  const hasServerData = initialNews.length > 0 || initialPrices.length > 0;
  const [loading, setLoading] = useState(!hasServerData);

  // ── UI state ──
  const [screenerTab, setScreenerTab] = useState<'buy' | 'sell' | 'hot'>('buy');
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');
  const [newsSlide, setNewsSlide] = useState(0);
  const [utcHour, setUtcHour] = useState(-1);
  const [marketTab, setMarketTab] = useState<string>('All');

  // ── Clock for market hours (only hour, updates every minute) ──
  useEffect(() => {
    const h = new Date().getUTCHours();
    setUtcHour(h);
    const id = setInterval(() => setUtcHour(new Date().getUTCHours()), 60000); // update every minute
    return () => clearInterval(id);
  }, []);

  // ── Background refresh — only if we don't have SSR data yet, or periodically ──
  // V60: With SSR, the page already has ALL data. This useEffect is for:
  // 1. Refreshing data every 2 minutes (stays fresh)
  // 2. Fallback if SSR failed (no server data)
  // No loading skeleton needed — SSR data is already displayed!
  useEffect(() => {
    let cancelled = false;
    const FETCH_TIMEOUT = 12_000; // 12 seconds

    async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
      return fetch(url, { signal: AbortSignal.timeout(timeout) });
    }

    async function fetchAllData() {
      // Only show loading skeleton if we have NO server data at all
      if (!hasServerData) setLoading(true);
      try {
        const [pricesRes, sentimentRes, arabRes, calendarRes, newsRes, banksRes, councilRes, analysesRes, reportsRes, strategicRes, infographicsRes] = await Promise.allSettled([
          fetchWithTimeout('/api/markets/prices?include=sparklines'),
          fetchWithTimeout('/api/markets/sentiment'),
          fetchWithTimeout(`/api/markets/arab?region=${locale === 'es' ? 'hispanic' : 'us'}&locale=${locale}`),
          fetchWithTimeout(`/api/markets/calendar?locale=${locale}`),
          fetchWithTimeout(`/api/${locale}/news?limit=10`),
          fetchWithTimeout('/api/markets/central-banks'),
          fetchWithTimeout('/api/integration/council?mode=briefs'),
          fetchWithTimeout(`/api/${locale}/reports?limit=6`),
          fetchWithTimeout(`/api/${locale}/reports?limit=3`),
          fetchWithTimeout(`/api/${locale}/reports?type=strategic&limit=4`),
          fetchWithTimeout(`/api/${locale}/infographics?published=true&limit=4`),
        ]);

        if (!cancelled) {
          // Prices — includes sparklines
          if (pricesRes.status === 'fulfilled' && pricesRes.value.ok) {
            try {
              const data = await pricesRes.value.json();
              if (data.prices) {
                const enriched = enrichPricesWithSparklines(data.prices, data.sparklines || {});
                setPrices(enriched);
              }
            } catch (err) { console.error('[HomePageContent] Prices parse error:', err); }
          }

          if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
            try { const data = await sentimentRes.value.json(); setSentiment(data); } catch {}
          }
          if (arabRes.status === 'fulfilled' && arabRes.value.ok) {
            try { const data = await arabRes.value.json(); if (data.markets) setArabMarkets(data.markets); } catch {}
          }
          if (calendarRes.status === 'fulfilled' && calendarRes.value.ok) {
            try { const data = await calendarRes.value.json(); if (data.events) setCalendar(data.events); } catch {}
          }
          if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
            try { const data = await newsRes.value.json(); if (data.news) {
              // LOCALE GUARD: Filter out any articles with Arabic-only titles.
              // The API already filters by locale='en', but this prevents edge cases.
              const ARABIC_REGEX = /[\u0600-\u06FF]/;
              setNews(data.news.filter((n: any) => !ARABIC_REGEX.test(n.title || '')));
            } } catch {}
          }
          if (banksRes.status === 'fulfilled' && banksRes.value.ok) {
            try { const data = await banksRes.value.json(); if (data.banks) setCentralBanks(data.banks); } catch {}
          }
          if (councilRes.status === 'fulfilled' && councilRes.value.ok) {
            try {
              const data = await councilRes.value.json();
              const briefList = data?.data?.active || data?.active || data?.data || [];
              if (Array.isArray(briefList)) setCouncilBriefs(briefList);
            } catch {}
          }
          if (analysesRes.status === 'fulfilled' && analysesRes.value.ok) {
            try {
              const data = await analysesRes.value.json();
              // /api/en/reports returns 'reports' key, convert to analyses format
              // Exclude strategic reports — they belong in the strategic card only
              const items = (data.analyses || data.reports || []).filter((r: any) => r.reportType !== 'strategic');
              if (Array.isArray(items)) setAnalyses(items);
            } catch {}
          }
          if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
            try {
              const data = await reportsRes.value.json();
              // Exclude strategic reports from regular reports — they belong in the strategic card only
              if (data.reports) setReports(data.reports.filter((r: any) => r.reportType !== 'strategic'));
            } catch {}
          }
          if (strategicRes.status === 'fulfilled' && strategicRes.value.ok) {
            try {
              const data = await strategicRes.value.json();
              if (data.reports) {
                // SAFETY FILTER: Only accept entries with reportType==='strategic'.
                // Prevents regular reports or market analyses from leaking into the strategic card.
                setStrategicReports(data.reports.filter((r: any) => r.reportType === 'strategic' && !r.isAnalysis));
              }
            } catch {}
          }
          if (infographicsRes.status === 'fulfilled' && infographicsRes.value.ok) {
            try { const data = await infographicsRes.value.json(); if (data.infographics) setInfographics(data.infographics); } catch {}
          }
        }
      } catch (err) {
        console.error('[HomePageContent] Background refresh error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllData();

    // Auto-refresh every 2 minutes (background, no loading flicker)
    const interval = setInterval(fetchAllData, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const SLIDE_DURATION = 5000; // 5 seconds per slide
  useEffect(() => {
    if (news.length === 0) return;
    const id = setInterval(() => {
      setNewsSlide(s => (s + 1) % Math.min(news.length, 5));
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [news.length]);

  const handlePrevSlide = useCallback(() => {
    if (news.length === 0) return;
    const maxSlide = Math.min(news.length, 5);
    setNewsSlide(s => (s - 1 + maxSlide) % maxSlide);
  }, [news.length]);

  const handleNextSlide = useCallback(() => {
    if (news.length === 0) return;
    const maxSlide = Math.min(news.length, 5);
    setNewsSlide(s => (s + 1) % maxSlide);
  }, [news.length]);

  // ── Derived data from prices ──
  const forexPrices = useMemo(() => prices.filter(p => p.category === 'Forex'), [prices]);
  const metalsPrices = useMemo(() => prices.filter(p => p.category === 'Commodities'), [prices]);
  const cryptoPrices = useMemo(() => prices.filter(p => p.category === 'Crypto'), [prices]);
  const indicesPrices = useMemo(() => prices.filter(p => p.category === 'Stocks'), [prices]);
  const energyPrices = useMemo(() => prices.filter(p => p.category === 'Energy'), [prices]);

  // Quick markets sidebar (all available prices)
  const quickMarkets = prices;

  // Market indicators for Row 1 pulse cards
  const marketPulseCards = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ ...p, sparkline: p.sparkline })),
    [prices]
  );

  // Most traded
  const mostTraded = useMemo(() =>
    [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6)
      .map(p => ({ s: p.displaySymbol, c: p.changePercent, p: p.price, d: p.decimals, sparkline: p.sparkline })),
    [prices]
  );

  // Commodities
  const commodities = useMemo(() =>
    [...metalsPrices, ...energyPrices].map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [metalsPrices, energyPrices]
  );

  // Arab indices — show all markets, including reference data (V230)
  const arabIndices = useMemo(() =>
    arabMarkets.map(m => ({ s: m.name || m.nameEn, p: m.value, d: 2, c: m.change, i: m.flag, sparkline: m.sparkline, src: m.source })),
    [arabMarkets]
  );

  // Global indices
  const globalIndices = useMemo(() =>
    indicesPrices.map(p => ({ s: p.displaySymbol, p: p.price, d: p.decimals, c: p.changePercent })),
    [indicesPrices]
  );

  // Screener data derived from prices
  const screenerData = useMemo(() => {
    const buy = prices.filter(p => p.changePercent > 0.3).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: 'buy' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const sell = prices.filter(p => p.changePercent < -0.3).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: 'sell' as const, conf: Math.min(95, 60 + Math.abs(p.changePercent) * 5)
    }));
    const hot = [...prices].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 8).map(p => ({
      sym: p.displaySymbol, name: p.displaySymbol, p: p.price, c: p.changePercent, signal: (p.changePercent >= 0 ? 'buy' : 'sell') as 'buy' | 'sell', conf: Math.min(95, 55 + Math.abs(p.changePercent) * 4)
    }));
    return { buy, sell, hot };
  }, [prices]);

  // Market sessions
  const sessions = [
    { name: 'London', flag: '🇬🇧', open: 8, close: 17 },
    { name: 'New York', flag: '🇺🇸', open: 13, close: 22 },
    { name: 'Tokyo', flag: '🇯🇵', open: 0, close: 9 },
    { name: 'Sydney', flag: '🇦🇺', open: 22, close: 7 },
    { name: 'Saudi Arabia', flag: '🇸🇦', open: 7, close: 12 },
  ];



  // Top movers
  const gainers = useMemo(() =>
    [...prices].filter(p => p.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
    [prices]
  );
  const losers = useMemo(() =>
    [...prices].filter(p => p.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    [prices]
  );

  // Academy items (static educational content)
  const academyItems = [
    { abbr: 'P/E', full: t.priceToEarnings, icon: '📊', cat: t.fundamental },
    { abbr: 'RSI', full: t.relativeStrengthIndex, icon: '📈', cat: t.technical },
    { abbr: 'GDP', full: t.grossDomesticProduct, icon: '🌍', cat: t.macro },
    { abbr: 'CPI', full: t.consumerPriceIndex, icon: '💰', cat: t.macro },
    { abbr: 'EPS', full: t.earningsPerShare, icon: '💵', cat: t.fundamental },
    { abbr: 'MACD', full: t.movingAvgConvergenceDivergence, icon: '📉', cat: t.technical },
  ];

  // Fear & Greed value for the marker position
  const fgValue = sentiment?.fearGreedIndex?.value ?? 50;

  // Market table tab filter
  const marketTabLabels: Record<string, string> = {
    'All': t.all, 'Forex': t.forex, 'Commodities': t.commodities, 'Crypto': t.crypto, 'Energy': t.energy,
  };
  const marketTabs = ['All', 'Forex', 'Commodities', 'Crypto', 'Energy'];
  const filteredMarketPrices = useMemo(() => {
    if (marketTab === 'All') return prices;
    return prices.filter(p => p.category === marketTab);
  }, [prices, marketTab]);

  // Top news for the slider (max 5)
  const topNews = news.slice(0, 5);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 var(--space-md) var(--space-xl)' }}>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 1: MARKET PULSE CARDS — Full Width, elevated glass cards
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        {loading ? (
          <div className="home-pulse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                <Skeleton w="50%" h="14px" />
                <Skeleton w="70%" h="24px" />
                <Skeleton w="100%" h="28px" />
              </div>
            ))}
          </div>
        ) : marketPulseCards.length > 0 ? (
          <div className="home-pulse-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(marketPulseCards.length, 6)}, 1fr)`, gap: 'var(--space-sm)' }}>
            {marketPulseCards.map((p, i) => {
              const positive = p.changePercent >= 0;
              const gradBorder = positive
                ? 'linear-gradient(180deg, var(--bull), rgba(34,197,94,.2))'
                : 'linear-gradient(180deg, var(--bear), rgba(239,83,80,.2))';
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r2)',
                    padding: 'var(--space-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(0,229,255,0.05)',
                    borderInlineStart: `3px solid transparent`,
                    borderImage: `${gradBorder} 1`,
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = positive ? '0 4px 24px rgba(34,197,94,.12)' : '0 4px 24px rgba(239,83,80,.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.05)'; }}
                >
                  {/* Subtle glow background */}
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 60, height: 60, borderRadius: '50%', background: positive ? 'rgba(34,197,94,.06)' : 'rgba(239,83,80,.06)', filter: 'blur(20px)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, position: 'relative' }}>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', display: 'block' }}>{p.displaySymbol}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{p.displaySymbol}</span>
                    </div>
                    <span className="font-mono-price" style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r)',
                      background: positive ? 'rgba(34,197,94,.1)' : 'rgba(239,83,80,.1)',
                      color: positive ? 'var(--bull)' : 'var(--bear)',
                    }}>
                      {positive ? '+' : ''}{p.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="font-mono-price" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 8 }}>
                    {fmtPrice(p.price, p.decimals)}
                  </span>
                  <Sparkline positive={positive} data={p.sparkline} />
                </div>
              );
            })}
          </div>
        ) : (
          <NoData message={t.noPriceDataAvailable} />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2: NEWS — Sidebar + Featured Card
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-news-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Sidebar: Latest News */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
            <span className="sh-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.latestNews}</span>
            <div className="live-dot" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 380, overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Skeleton w="32px" h="32px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton w="100%" h="13px" />
                    <Skeleton w="60%" h="11px" />
                  </div>
                </div>
              ))
            ) : news.length > 0 ? (
              news.slice(0, 8).map((n, i) => {
                const title = n.title;
                const isActive = i === newsSlide;
                return (
                  <a
                    key={n.id}
                    href={n.href || (n.slug ? `/${locale}/news/${n.slug}` : n.id ? `/${locale}/news/${n.id}` : '#')}
                    onClick={e => { if (!n.slug && !n.id) e.preventDefault(); else return; setNewsSlide(Math.min(i, 4)); }}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 8px',
                      borderRadius: 'var(--r)',
                      background: isActive ? 'rgba(0,229,255,.04)' : 'transparent',
                      borderInlineStart: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                      textDecoration: 'none',
                      transition: 'background .2s',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Thumbnail — V230: Use gradient fallback instead of hiding on error */}
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg4)', position: 'relative' }}>
                      {/* V400: Use <img> instead of <Image> for article-image API — avoids 400 errors from Next.js image optimizer */}
                      <img
                        src={`/api/article-image/${n.id}`}
                        alt={title}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        onError={e => { const el = e.target as HTMLImageElement; el.style.opacity = '0'; }}
                        onLoad={e => { const el = e.target as HTMLImageElement; el.style.opacity = '1'; }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--text-head)' : 'var(--text)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{title}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{n.source}</span>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>•</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(n.time, locale)}</span>
                      </div>
                    </div>
                  </a>
                );
              })
            ) : (
              <NoData message={t.noNewsAvailable} />
            )}
          </div>

          <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
            <a href={`/${locale}/news`} style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none' }}>{t.viewAllArrow}</a>
          </div>
        </div>

        {/* Middle: Strategic Reports */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(139,92,246,0.08)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>🛡️</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.strategicReports}</span>
              </div>
              <a href={`/${locale}/strategic-reports`} style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>{t.viewAllArrow}</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : strategicReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {strategicReports.map((r) => {
                  const scopeLabel = r.scope === 'arabic' ? t.arabic : r.scope === 'global' ? t.global : t.regional;
                  const impactColor = r.marketImpact === 'bullish' ? 'var(--bull)' : r.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--text3)';
                  const impactLabel = r.marketImpact === 'bullish' ? t.bullish : r.marketImpact === 'bearish' ? t.bearish : t.neutral;
                  return (
                    <a
                      key={r.id}
                      href={`/${locale}/reports/${r.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 'var(--r)', background: 'var(--bg4)',
                        borderInlineStart: '3px solid #8B5CF6',
                        textDecoration: 'none', cursor: 'pointer',
                        transition: 'background .2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(139,92,246,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>🛡️</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{stripStrategicPrefix(r.title)}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(139,92,246,.1)', color: '#8B5CF6', fontWeight: 700 }}>{t.strategic}</span>
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{scopeLabel}</span>
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>•</span>
                          <span style={{ fontSize: 10, color: impactColor }}>{impactLabel}</span>
                          {r.confidenceScore > 0 && <span style={{ fontSize: 10, color: '#8B5CF6' }}>{r.confidenceScore}%</span>}
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(r.publishedAt, locale)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>{t.noStrategicReportsAvailable}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Reports & Analysis */}
        <div className="glass-card" style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 24px rgba(0,229,255,0.06)' }}>
          <div style={{ flex: 1, padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.reportsAndAnalysis}</span>
              </div>
              <a href={`/${locale}/reports`} style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none', opacity: 0.85 }}>{t.viewAllArrow}</a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="56px" />)}
              </div>
            ) : (analyses.length > 0 || reports.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', maxHeight: 360 }} className="custom-scrollbar">
                {/* Reports Section — excludes strategic reports */}
                {reports.filter(r => r.reportType !== 'strategic').length > 0 && (
                  <>
                    {reports.filter(r => r.reportType !== 'strategic').map((r) => {
                      const typeLabel = r.reportType === 'weekly' ? t.weekly : r.reportType === 'monthly' ? t.monthly : r.reportType === 'quarterly' ? t.quarterly : t.daily;
                      const scopeLabel = r.scope === 'arabic' ? t.arabic : r.scope === 'global' ? t.global : t.regional;
                      const impactColor = r.marketImpact === 'bullish' ? 'var(--bull)' : r.marketImpact === 'bearish' ? 'var(--bear)' : 'var(--text3)';
                      return (
                        <a
                          key={r.id}
                          href={`/${locale}/reports/${r.slug}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                            borderRadius: 'var(--r)', background: 'var(--bg4)',
                            borderInlineStart: '3px solid var(--gold)',
                            textDecoration: 'none', cursor: 'pointer',
                            transition: 'background .2s',
                          }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(212,175,55,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{r.title}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(212,175,55,.1)', color: 'var(--gold)', fontWeight: 700 }}>{t.report} {typeLabel}</span>
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{scopeLabel}</span>
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>•</span>
                              <span style={{ fontSize: 10, color: impactColor }}>{r.marketImpact === 'bullish' ? t.bullish : r.marketImpact === 'bearish' ? t.bearish : t.neutral}</span>
                              {r.confidenceScore > 0 && <span style={{ fontSize: 10, color: 'var(--purple)' }}>{r.confidenceScore}%</span>}
                              <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(r.publishedAt, locale)}</span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </>
                )}

                {/* Analyses Section */}
                {analyses.map((a) => {
                  const assetLabels: Record<string, string> = {
                    strategic: t.strategic, stocks: t.stocks, commodities: t.commodities, forex: t.forex, crypto: t.crypto,
                    bonds: t.bonds, energy: t.energy, realEstate: t.realEstate, economy: t.economy,
                    banking: t.banking, technicalAnalysis: t.technical, arabMarkets: t.arabMarkets, earnings: t.earnings,
                  };
                  const riskColors: Record<string, string> = { low: 'var(--bull)', medium: 'var(--gold)', high: 'var(--orange)', extreme: 'var(--bear)' };
                  const sentimentColors: Record<string, string> = { bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--text3)' };
                  const sentimentLabels: Record<string, string> = { bullish: t.bullish, bearish: t.bearish, neutral: t.neutral };
                  return (
                    <a
                      key={a.id}
                      href={`/${locale}/reports/${a.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 'var(--r)', background: 'var(--bg4)',
                        borderInlineStart: `3px solid ${sentimentColors[a.sentiment] || 'var(--text4)'}`,
                        textDecoration: 'none', cursor: 'pointer',
                        transition: 'background .2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'rgba(0,229,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', margin: 0, lineHeight: 1.5, display: '-webkit-box' as const, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{a.title}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,229,255,.06)', color: 'var(--cyan)', fontWeight: 700 }}>{assetLabels[a.assetClass] || a.assetClass}</span>
                          <span style={{ fontSize: 10, color: sentimentColors[a.sentiment] || 'var(--text4)' }}>{sentimentLabels[a.sentiment] || a.sentiment}</span>
                          <span style={{ fontSize: 10, color: riskColors[a.riskLevel] || 'var(--text4)' }}>{t.risk} {a.riskLevel === 'low' ? t.low : a.riskLevel === 'medium' ? t.medium : a.riskLevel === 'high' ? t.high : t.extreme}</span>
                          {a.confidenceScore > 0 && <span style={{ fontSize: 10, color: 'var(--purple)' }}>{a.confidenceScore}%</span>}
                          <span style={{ fontSize: 10, color: 'var(--text4)' }}>{timeAgo(a.publishedAt, locale)}</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' as const }}>{t.noReportsOrAnalysesAvailable}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 2.5: STOCK & COMPANY ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
      <StockCompanyAnalysisSection locale={locale} />
      <HomeVideosSection locale={locale} />
      <TechnicalAnalysesHomeSection locale={locale} />
      <QuickInsightCards locale={locale} />

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3: MARKET MOVERS — Compact, 4-column
          Shows real price movements from live market data.
          Reduced size (~25% smaller) — compact horizontal cards.
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 8px rgba(0,229,255,.3)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{t.topMarketMovers}</span>
            <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'var(--cyan2)', color: 'var(--cyan)', letterSpacing: 0.5 }}>{t.live}</span>
          </div>
          <a href={`/${locale}/markets`} style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 'var(--r)', padding: '4px 12px', color: 'var(--purple)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s' }}>{t.marketsHub}</a>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 8 }}>
                <Skeleton w="50%" h="12px" />
                <Skeleton w="100%" h="28px" />
              </div>
            ))}
          </div>
        ) : prices.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {prices.filter(p => Math.abs(p.changePercent) > 0.1).slice(0, 4).map((p, i) => {
              const isUp = p.changePercent >= 0;
              return (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    background: 'var(--bg3)',
                    borderRadius: 'var(--r)',
                    padding: '8px 10px',
                    borderInlineStart: `2px solid ${isUp ? 'var(--bull)' : 'var(--bear)'}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = isUp ? '0 2px 12px rgba(34,197,94,.08)' : '0 2px 12px rgba(239,83,80,.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 14 }}>{(p as any).icon || '📊'}</span>
                      <div>
                        <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', display: 'block', lineHeight: 1.2 }}>{p.displaySymbol}</span>
                        <span style={{ fontSize: 9, color: 'var(--text4)', lineHeight: 1 }}>{p.displaySymbol}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: isUp ? 'rgba(34,197,94,.12)' : 'rgba(239,83,80,.12)', color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                      {isUp ? '▲' : '▼'} {Math.abs(p.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span className="font-mono-price" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{fmtPrice(p.price, p.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 10, fontWeight: 600, color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                      {isUp ? '+' : ''}{p.change?.toFixed(p.decimals || 2)}
                    </span>
                  </div>
                  {p.sparkline && p.sparkline.length > 0 && (
                    <div style={{ height: 20, marginBottom: 2 }}>
                      <Sparkline positive={isUp} data={p.sparkline} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <NoData message={t.noDataAvailable} />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 3.5: INFOGRAPHICS — Latest 4 published infographics
          V228: Redesigned — bigger cards, responsive grid, InfographicCard
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, #d4af37, #059669)', boxShadow: '0 0 10px rgba(212,175,55,.35)' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>{t.infographics}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginRight: 4 }}>{t.visualAnalysis}</span>
          </div>
          <a href={`/${locale}/infographics`} style={{ background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 'var(--r)', padding: '6px 14px', color: '#d4af37', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s', minHeight: 36, display: 'flex', alignItems: 'center' }}>{t.viewAllArrow}</a>
        </div>

        {loading ? (
          <div className="home-infographic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
                <Skeleton w="100%" h="180px" />
                <div style={{ padding: 12 }}>
                  <Skeleton w="80%" h="16px" />
                  <Skeleton w="50%" h="12px" />
                </div>
              </div>
            ))}
          </div>
        ) : infographics.length > 0 ? (
          <div className="home-infographic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {infographics.map((ig) => (
              <InfographicCard key={ig.id} infographic={ig as InfographicData} locale={locale} />
            ))}
          </div>
        ) : (
          <NoData message={t.noInfographicsAvailable} />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 4: CALENDAR + ARAB MARKETS — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-calendar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Left: Economic Calendar */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.economicCalendar} linkText={t.viewAll} linkHref={`/${locale}/calendar`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="36px" />)
            ) : calendar.length > 0 ? (
              calendar.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent', alignItems: 'center' }}>
                  <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', minWidth: 44 }}>{formatEventTime(ev.time)}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ev.country}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ev.event || (ev.eventAr && /[\u0600-\u06FF]/.test(ev.eventAr) ? '' : ev.eventAr) || '—'}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.impactLevel >= 3 ? 'var(--bear)' : ev.impactLevel >= 2 ? 'var(--gold)' : 'var(--text4)', flexShrink: 0, boxShadow: ev.impactLevel >= 3 ? '0 0 8px rgba(239,83,80,.4)' : 'none' }} />
                </div>
              ))
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>

        {/* Right: Regional Markets */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.arabMarkets} linkText={t.viewAll} linkHref={`/${locale}/markets`} />
          <div className="home-arab-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="64px" />)
            ) : arabIndices.length > 0 ? (
              arabIndices.slice(0, 6).map((a, i) => (
                <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{a.i}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.s}</span>
                    </div>
                    <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: a.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                      {a.src === 'reference' ? '—' : <>{a.c >= 0 ? '+' : ''}{a.c.toFixed(2)}%</>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="font-mono-price" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>{fmtPrice(a.p, a.d)}</span>
                    {a.src === 'reference' && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(234,179,8,.12)', color: '#eab308', fontWeight: 600 }}>{t.ref}</span>
                    )}
                  </div>
                  {a.sparkline && a.sparkline.length > 0 ? (
                    <Sparkline positive={a.c >= 0} data={a.sparkline} />
                  ) : null}
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <NoData message={t.noDataAvailable} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 5: QUICK MARKETS TABLE — Full Width with tabs
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title={t.marketsTable} linkText={t.viewAll} linkHref={`/${locale}/markets`} />

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)' }}>
          {marketTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setMarketTab(tab)}
              style={{
                padding: '6px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: marketTab === tab ? 'rgba(0,229,255,.1)' : 'var(--bg4)',
                border: marketTab === tab ? '1px solid rgba(0,229,255,.25)' : '1px solid var(--border)',
                color: marketTab === tab ? 'var(--cyan)' : 'var(--text3)',
                transition: 'all .2s',
              }}
            >
              {marketTabLabels[tab] || tab}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div className="home-table-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 100px', gap: 0, padding: '12px 16px', background: 'var(--bg4)', borderBottom: '1px solid var(--border)' }}>
            <span className="home-table-col-symbol" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.symbol}</span>
            <span className="home-table-col-name" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.name}</span>
            <span className="home-table-col-price" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.price}</span>
            <span className="home-table-col-change" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.change}</span>
            <span className="home-table-col-pct" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.pctChange}</span>
            <span className="home-table-col-trend" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' as const }}>{t.trend}</span>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 100px 100px', padding: '10px 16px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                  <Skeleton w="50px" h="14px" />
                  <Skeleton w="80px" h="14px" />
                  <Skeleton w="70px" h="14px" />
                  <Skeleton w="60px" h="14px" />
                  <Skeleton w="50px" h="14px" />
                  <Skeleton w="60px" h="14px" />
                </div>
              ))
            ) : filteredMarketPrices.length > 0 ? (
              filteredMarketPrices.map((m, i) => {
                const positive = m.changePercent >= 0;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px 100px 100px 100px',
                      padding: '12px 16px',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)'}
                  >
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{m.displaySymbol}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{m.nameEn || m.displaySymbol || (m.nameAr && !/[\u0600-\u06FF]/.test(m.nameAr) ? m.nameAr : '') || '—'}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{fmtPrice(m.price, m.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, color: positive ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>
                      {m.change >= 0 ? '+' : ''}{fmtPrice(m.change, m.decimals)}
                    </span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: positive ? 'var(--bull)' : 'var(--bear)' }}>
                      {positive ? '+' : ''}{m.changePercent.toFixed(2)}%
                    </span>
                    <Sparkline positive={positive} data={m.sparkline} />
                  </div>
                );
              })
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 6: ACADEMY — Full Width, 6 items in a row
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.academy} linkText={t.viewAll} linkHref={`/${locale}/academy`} />
          <div className="home-academy-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
            {academyItems.map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--space-sm)',
                  textAlign: 'center' as const,
                  cursor: 'pointer',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{item.icon}</span>
                <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', display: 'block', marginBottom: 2 }}>{item.abbr}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4, display: 'block' }}>{item.full}</span>
                <span style={{ fontSize: 10, color: 'var(--text4)', marginTop: 3, padding: '1px 6px', background: 'var(--bg3)', borderRadius: 'var(--r)', display: 'inline-block' }}>{item.cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 6B: CENTRAL BANKS — Full Width, Horizontal Cards Grid
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <SectionHeader title={t.centralBanks} linkText={t.viewAll} linkHref={`/${locale}/central-banks`} />
        {loading ? (
          <div className="home-banks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h="120px" />)}
          </div>
        ) : centralBanks.length > 0 ? (
          <div className="home-banks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
            {centralBanks.map((b, i) => {
              const rateChange = (b.currentRate ?? 0) - (b.previousRate ?? 0);
              const predLabel = b.aiPrediction === 'raise' ? t.hike : b.aiPrediction === 'cut' ? t.cut : t.hold;
              const predColor = b.aiPrediction === 'raise' ? 'var(--bear)' : b.aiPrediction === 'cut' ? 'var(--bull)' : 'var(--text3)';
              const predBg = b.aiPrediction === 'raise' ? 'rgba(239,83,80,.08)' : b.aiPrediction === 'cut' ? 'rgba(34,197,94,.08)' : 'rgba(100,116,139,.08)';
              return (
                <a
                  key={i}
                  href={`/${locale}/central-banks`}
                  className="glass-card"
                  style={{
                    background: 'var(--bg3)',
                    borderRadius: 'var(--r2)',
                    padding: 'var(--space-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    borderInlineStart: `3px solid ${predColor}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${b.aiPrediction === 'raise' ? 'rgba(239,83,80,.1)' : b.aiPrediction === 'cut' ? 'rgba(34,197,94,.1)' : 'rgba(0,229,255,.06)'}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Top: Flag + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{b.flag}</span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)', display: 'block', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{CENTRAL_BANK_NAME_MAP[b.name] || (/[؀-ۿ]/.test(b.name) ? b.country : b.name)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>{b.country}</span>
                    </div>
                  </div>

                  {/* Rate */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="font-mono-price" style={{ fontSize: 22, fontWeight: 700, color: 'var(--cyan)' }}>{b.currentRate}%</span>
                    {rateChange !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: rateChange > 0 ? 'var(--bear)' : 'var(--bull)' }}>
                        {rateChange > 0 ? '▲' : '▼'} {Math.abs(rateChange).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* AI Prediction Badge */}
                  {b.aiPrediction && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--r)', background: predBg, color: predColor, fontWeight: 700, border: `1px solid ${predColor}22` }}>
                        {predLabel}
                      </span>
                      {b.aiConfidence > 0 && (
                        <span className="font-mono-price" style={{ fontSize: 10, color: 'var(--purple)' }}>{b.aiConfidence}%</span>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        ) : (
          <NoData message={t.noCentralBankDataAvailable} />
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 7: FEAR & GREED — Full Width (Council signals moved to HeroSection)
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="home-fear-greed" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', alignItems: 'center' }}>
          {/* Fear & Greed Gauge */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--bear), var(--gold), var(--bull))' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.fearGreedIndex}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, var(--bear), var(--orange), var(--gold), #84CC16, var(--bull))', position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', top: -5, left: `${Math.min(95, Math.max(5, fgValue))}%`, width: 20, height: 20, borderRadius: '50%', background: 'var(--text-head)', border: '3px solid var(--bg3)', transform: 'translateX(-50%)', transition: 'left 0.5s ease', boxShadow: '0 0 12px rgba(255,255,255,.2)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--bear)' }}>{t.extremeFear}</span>
              <span style={{ fontSize: 11, color: 'var(--gold)' }}>{t.neutral}</span>
              <span style={{ fontSize: 11, color: 'var(--bull)' }}>{t.extremeGreed}</span>
            </div>
          </div>
          {/* Value + Label */}
          <div style={{ textAlign: 'center' }}>
            {loading ? (
              <Skeleton w="80px" h="40px" />
            ) : (
              <span className="font-mono-price" style={{ fontSize: 48, fontWeight: 700, color: fgValue <= 25 ? 'var(--bear)' : fgValue <= 40 ? 'var(--orange)' : fgValue <= 60 ? 'var(--gold)' : fgValue <= 75 ? '#84CC16' : 'var(--bull)', display: 'block' }}>{fgValue}</span>
            )}
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)' }}>
              {loading ? '...' : (fearGreedLabelMap[sentiment?.fearGreedIndex?.label] || (/[؀-ۿ]/.test(sentiment?.fearGreedIndex?.label || '') ? t.noData : sentiment?.fearGreedIndex?.label) || t.noData)}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 8: AI SCREENER + WHY ROUAA — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section className="home-screener-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* AI Screener */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.aiMonitorActiveAssets} />
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)' }}>
            {(['buy', 'sell', 'hot'] as const).map(tab => (
              <button key={tab} onClick={() => setScreenerTab(tab)} style={{
                padding: '7px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: screenerTab === tab
                  ? (tab === 'buy' ? 'rgba(34,197,94,.12)' : tab === 'sell' ? 'rgba(239,83,80,.12)' : 'rgba(255,184,0,.12)')
                  : 'var(--bg4)',
                border: screenerTab === tab
                  ? (tab === 'buy' ? '1px solid rgba(34,197,94,.3)' : tab === 'sell' ? '1px solid rgba(239,83,80,.3)' : '1px solid rgba(255,184,0,.3)')
                  : '1px solid var(--border)',
                color: screenerTab === tab
                  ? (tab === 'buy' ? 'var(--bull)' : tab === 'sell' ? 'var(--bear)' : 'var(--gold)')
                  : 'var(--text3)',
                transition: 'all .2s',
              }}>
                {tab === 'buy' ? t.rising : tab === 'sell' ? t.falling : t.mostActive}
              </button>
            ))}
          </div>
          {/* Screener rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="36px" />)
            ) : screenerData[screenerTab].length > 0 ? (
              screenerData[screenerTab].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="font-mono-price" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text4)', width: 20 }}>{i + 1}</span>
                    <div>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{row.sym}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 8 }}>{row.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{row.p.toFixed(row.p < 10 ? 4 : row.p < 1000 ? 2 : 0)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: row.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{row.c >= 0 ? '+' : ''}{row.c.toFixed(2)}%</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r)', background: row.signal === 'buy' ? 'rgba(34,197,94,.1)' : 'rgba(239,83,80,.1)', color: row.signal === 'buy' ? 'var(--bull)' : 'var(--bear)' }}>
                      {row.signal === 'buy' ? `▲ ${t.rising.replace('▲ ', '')}` : `▼ ${t.falling.replace('▼ ', '')}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 90 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${row.conf}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))', height: '100%' }} />
                      </div>
                      <span className="font-mono-price" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{Math.round(row.conf)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>

        {/* Why Rouaa */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.whyRouaa} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            {[
              { icon: '🧠', title: t.instantAiAnalysis, desc: t.realtimeAiAnalytics },
              { icon: '📡', title: t.liveNews247, desc: t.continuousNewsCoverage },
              { icon: '📊', title: t.preciseAnalytics, desc: t.dataDrivenInsights },
              { icon: '🔔', title: t.smartAlerts, desc: t.instantNotifications },
            ].map((f, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r2)',
                  padding: 'var(--space-md)',
                  textAlign: 'center' as const,
                  transition: 'transform 0.25s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 8 }}>{f.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 4 }}>{f.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 9: MARKET HOURS + TOP MOVERS — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Market Hours */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>{t.tradingHours}</span>
            </div>
            <UtcClock />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sessions.map((s, i) => {
              // V302: Handle utcHour=-1 (SSR/loading) gracefully
              const isOpen = utcHour >= 0
                ? (s.open < s.close
                  ? (utcHour >= s.open && utcHour < s.close)
                  : (utcHour >= s.open || utcHour < s.close))
                : false;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{s.flag}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="font-mono-price" style={{ fontSize: 12, color: 'var(--text3)' }}>{String(s.open).padStart(2, '0')}:00–{String(s.close).padStart(2, '0')}:00</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r)',
                      background: utcHour < 0 ? 'rgba(100,116,139,.06)' : isOpen ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.08)',
                      color: utcHour < 0 ? 'var(--text3)' : isOpen ? 'var(--bull)' : 'var(--text3)',
                      border: `1px solid ${isOpen ? 'rgba(34,197,94,.25)' : 'transparent'}`,
                    }}>
                      {utcHour < 0 ? '--:--' : isOpen ? t.open : t.closed}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Movers */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 12px rgba(0,229,255,.35)' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-head)' }}>{t.topMovers}</span>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-sm)' }}>
            {(['gainers', 'losers'] as const).map(tab => (
              <button key={tab} onClick={() => setMoversTab(tab)} style={{
                padding: '6px 18px',
                borderRadius: 'var(--r)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: moversTab === tab ? (tab === 'gainers' ? 'rgba(34,197,94,.12)' : 'rgba(239,83,80,.12)') : 'var(--bg4)',
                border: moversTab === tab ? (tab === 'gainers' ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(239,83,80,.3)') : '1px solid var(--border)',
                color: moversTab === tab ? (tab === 'gainers' ? 'var(--bull)' : 'var(--bear)') : 'var(--text3)',
                transition: 'all .2s',
              }}>
                {tab === 'gainers' ? `▲ ${t.rising.replace('▲ ', '')}` : `▼ ${t.falling.replace('▼ ', '')}`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : (moversTab === 'gainers' ? gainers : losers).length > 0 ? (
              (moversTab === 'gainers' ? gainers : losers).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{m.displaySymbol}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(m.price, m.decimals)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: m.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 10: COMMUNITY PULSE + GEOPOLITICAL RISK
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Community Pulse */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.communityPulse} />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="60px" />)}
            </div>
          ) : prices.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
              {prices.filter(p => p.category === 'Forex').slice(0, 4).map((p, i) => {
                const bullPercent = p.changePercent >= 0 ? 50 + Math.abs(p.changePercent) * 5 : 50 - Math.abs(p.changePercent) * 5;
                const clampedBull = Math.min(90, Math.max(10, bullPercent));
                return (
                  <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)' }}>{p.displaySymbol}</span>
                    </div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${clampedBull}%`, background: 'var(--bull)', borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                      <div style={{ width: `${100 - clampedBull}%`, background: 'var(--bear)', borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="font-mono-price" style={{ fontSize: 11, color: 'var(--bull)', fontWeight: 700 }}>▲ {Math.round(clampedBull)}%</span>
                      <span className="font-mono-price" style={{ fontSize: 11, color: 'var(--bear)', fontWeight: 700 }}>▼ {Math.round(100 - clampedBull)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoData message={t.noDataAvailable} />
          )}
        </div>

        {/* Geopolitical Risk */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.geopoliticalRisk} />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton w="60px" h="40px" />
              <Skeleton w="100%" h="14px" />
              <Skeleton w="80%" h="14px" />
            </div>
          ) : sentiment?.geopoliticalRiskIndex && sentiment.geopoliticalRiskIndex.value > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
              <span className="font-mono-price" style={{ fontSize: 36, fontWeight: 700, color: sentiment.geopoliticalRiskIndex.value > 60 ? 'var(--bear)' : sentiment.geopoliticalRiskIndex.value > 30 ? 'var(--gold)' : 'var(--bull)', flexShrink: 0 }}>
                {sentiment.geopoliticalRiskIndex.value}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)', display: 'block', marginBottom: 6 }}>{geopoliticalLabelMap[sentiment.geopoliticalRiskIndex.label] || (/[؀-ۿ]/.test(sentiment.geopoliticalRiskIndex.label || '') ? 'N/A' : sentiment.geopoliticalRiskIndex.label)}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{GEOPOLITICAL_DESC_MAP[sentiment.geopoliticalRiskIndex.description] || (/[؀-ۿ]/.test(sentiment.geopoliticalRiskIndex.description || '') ? '' : sentiment.geopoliticalRiskIndex.description)}</span>
              </div>
            </div>
          ) : (
            <NoData message={t.noData} />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ROW 11: COMMODITIES + GLOBAL INDICES — Two Columns
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {/* Commodities */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.commodities} linkText={t.viewAll} linkHref={`/${locale}/markets`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : commodities.length > 0 ? (
              commodities.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{c.s}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(c.p, c.d)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: c.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{c.c >= 0 ? '+' : ''}{c.c.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>

        {/* Global Indices */}
        <div className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', padding: 'var(--space-md)' }}>
          <SectionHeader title={t.globalIndices} linkText={t.viewAll} linkHref={`/${locale}/markets`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="28px" />)
            ) : globalIndices.length > 0 ? (
              globalIndices.map((idx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--r)', background: i % 2 === 0 ? 'var(--bg4)' : 'transparent' }}>
                  <span className="font-mono-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{idx.s}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="font-mono-price" style={{ fontSize: 13, color: 'var(--text)' }}>{fmtPrice(idx.p, idx.d)}</span>
                    <span className="font-mono-price" style={{ fontSize: 13, fontWeight: 700, color: idx.c >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{idx.c >= 0 ? '+' : ''}{idx.c.toFixed(2)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <NoData message={t.noDataAvailable} />
            )}
          </div>
        </div>
      </section>

      {/* RESPONSIVE STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ROW 1: Pulse Cards - 6 -> 3 -> 2 -> 1 */
        .home-pulse-grid { grid-template-columns: repeat(6, 1fr) !important; }
        @media (max-width: 1024px) { .home-pulse-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 640px) { .home-pulse-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 400px) { .home-pulse-grid { grid-template-columns: 1fr !important; } }

        /* ROW 2: News - sidebar + strategic + featured -> stack on mobile */
        .home-news-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        @media (max-width: 1100px) { .home-news-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 900px) { .home-news-grid { grid-template-columns: 1fr !important; } }

        /* News slider image - stack on mobile */
        .home-news-content { flex-direction: row !important; }
        @media (max-width: 768px) {
          .home-news-content { flex-direction: column !important; }
          .home-news-image { width: 100% !important; min-height: 140px !important; }
        }

        /* ROW 3: Movers - 3 -> 2 -> 1 */
        .home-movers-grid { grid-template-columns: repeat(3, 1fr) !important; }
        @media (max-width: 768px) { .home-movers-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .home-movers-grid { grid-template-columns: 1fr !important; } }

        /* ROW 4: Calendar + Arab - 2 -> 1 */
        .home-calendar-grid { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 768px) { .home-calendar-grid { grid-template-columns: 1fr !important; } }

        /* Arab inner - 2 -> 1 */
        @media (max-width: 400px) { .home-arab-inner { grid-template-columns: 1fr !important; } }

        /* ROW 5: Table - responsive columns */
        .home-table-row { grid-template-columns: 80px 1fr 120px 100px 100px 100px !important; }
        @media (max-width: 900px) {
          .home-table-row { grid-template-columns: 60px 1fr 80px !important; }
          .home-table-col-name, .home-table-col-trend { display: none !important; }
        }
        @media (max-width: 640px) {
          .home-table-row { grid-template-columns: 50px 1fr 60px !important; }
          .home-table-col-change { display: none !important; }
        }

        /* ROW 6: Academy - 6 items in a row, responsive */
        .home-academy-inner { grid-template-columns: repeat(6, 1fr) !important; }
        @media (max-width: 768px) { .home-academy-inner { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 480px) { .home-academy-inner { grid-template-columns: repeat(2, 1fr) !important; } }

        /* ROW 6B: Banks grid - auto-fill responsive */
        .home-banks-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; }
        @media (max-width: 640px) { .home-banks-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; } }

        /* ROW 7: Fear & Greed - 2 -> 1 */
        .home-fear-greed { grid-template-columns: 1fr 1fr !important; }
        @media (max-width: 640px) { .home-fear-greed { grid-template-columns: 1fr !important; } }

        /* ROW 8: Screener - 1fr 340px -> 1fr */
        .home-screener-grid { grid-template-columns: 1fr 340px !important; }
        @media (max-width: 900px) { .home-screener-grid { grid-template-columns: 1fr !important; } }
      `}} />

    </div>
  );
}