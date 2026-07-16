'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  type SentimentData, type MarketAnalysisItem, type NewsWithAnalysis,
  type ContentAnalysisItem, type TradingQuote,
  ANALYSIS_TYPES, TIMEFRAMES, STYLES, CHART_PAIRS,
  sentimentClass, sentimentLabel, riskLabel, assetClassLabel,
} from './types';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';
import StockScreener from '@/components/analysis/stock/StockScreener';
import AIStockFinder from '@/components/analysis/stock/AIStockFinder';
import s from './AnalysisPage.module.css';

// ─── Dynamic chart (no SSR) ───
const PlatformChart = dynamic(() => import('@/components/rouaa/charts/PlatformChart'), {
  ssr: false,
  loading: () => <div className={s.chartLoading}>Loading chart...</div>,
});

// ─── Tab IDs ───
type TabId = 'ai' | 'screener' | 'ai-stocks' | 'markets' | 'news' | 'analysts';

// ─── Locale text ───
const TEXT = {
  ar: {
    pageTitle: 'مركز التحليل الذكي',
    pageSubtitle: 'تحليل AI فوري · بيانات حية · أدوات احترافية',
    engineLabel: 'ANALYSIS ENGINE v3',
    chatAdvisor: 'ناقش مع مساعد رؤى',
    generateAnalysis: '⚡ توليد تحليل',
    tabAI: 'تحليل AI',
    tabScreener: 'ماسح الأسهم',
    tabAIStocks: 'مساعد AI',
    tabMarkets: 'الأسواق',
    tabNews: 'الأخبار',
    tabAnalysts: 'المحللون',
    totalAnalyses: 'إجمالي التحليلات',
    highImpact: 'تأثير عالي',
    bullish: 'صعودي',
    bearish: 'هبوطي',
    aiGeneratorTitle: 'مولّد التحليل الذكي',
    aiGeneratorSub: 'مدعوم بـ AI · تحليل احترافي مهيكل في ثوانٍ',
    selectAsset: 'اختر الأصل',
    customPair: 'زوج آخر...',
    analysisType: 'نوع التحليل',
    timeframe: 'الإطار الزمني',
    style: 'الأسلوب',
    generate: '⚡ توليد',
    generating: '⏳ يعالج...',
    ready: 'جاهز',
    processing: 'يعالج...',
    complete: 'مكتمل ✓',
    error: 'خطأ',
    analysisResult: 'نتيجة التحليل',
    copy: '📋 نسخ',
    copied: '✓ تم النسخ',
    discussAdvisor: 'ناقش هذا التحليل مع مساعد رؤى',
    chartTitle: '📈 الرسم البياني',
    fromPlatform: 'من المنصة',
    loadingChart: 'جاري تحميل الشارت...',
    sentimentTitle: '📊 مؤشرات المشاعر',
    live: 'مباشر',
    fearGreed: 'مؤشر الخوف والطمع',
    arabSentiment: 'المشاعر العربية',
    positive: 'إيجابي',
    neutral: 'محايد',
    negative: 'سلبي',
    geoRisk: 'المخاطر الجيوسياسية',
    level: 'المستوى',
    riskCalcTitle: 'حاسبة المخاطر',
    riskCalcSub: 'إدارة حجم الصفقة',
    capital: 'رأس المال ($)',
    riskPct: 'نسبة المخاطرة (%)',
    entryPrice: 'سعر الدخول',
    stopLoss: 'وقف الخسارة',
    riskAmount: 'مبلغ المخاطرة',
    lots: 'عدد اللوتات',
    positionSize: 'حجم الصفقة (Units)',
    rewardRisk: 'المكافأة/المخاطرة (1:R)',
    livePrices: 'أسعار حية',
    loadingPrices: 'جارٍ تحميل الأسعار...',
    marketAnalyses: 'تحليلات السوق',
    viewAll: 'عرض الكل ←',
    loading: 'جارٍ التحميل...',
    noAnalyses: 'لا توجد تحليلات سوق متاحة حالياً',
    analysesGenerated: 'يتم إنشاء تحليلات جديدة تلقائياً كل ساعة',
    confidence: 'الثقة',
    newsAnalysis: 'آخر تحليلات AI للأخبار',
    viewAllNews: 'عرض كل الأخبار ←',
    noNews: 'لا توجد أخبار مع تحليل AI متاحة حالياً',
    newsAutoAnalyzed: 'يتم تحليل الأخبار الجديدة تلقائياً بواسطة AI',
    highImpactLabel: 'تأثير عالي',
    mediumImpactLabel: 'تأثير متوسط',
    lowImpactLabel: 'تأثير منخفض',
    aiAnalysis: 'تحليل AI',
    readMore: 'اقرأ المزيد',
    showLess: 'عرض أقل',
    noAgentAnalyses: 'لا توجد تحليلات من وكيل المحتوى حالياً',
    agentAutoGenerates: 'يقوم وكيل المحتوى بإنتاج تحليلات تلقائياً كل ساعة',
    agentAnalyses: 'تحليلات وكيل المحتوى',
    rouaaPlatform: 'منصة رؤى',
    discussCtaTitle: 'ناقش مع مساعد رؤى',
    discussCtaDesc: 'اسأل عن أي أصل مالي، احصل على توصيات مخصصة',
    loadingAnalyses: 'جارٍ تحميل التحليلات...',
  },
  en: {
    pageTitle: 'Smart Analysis Center',
    pageSubtitle: 'Instant AI analysis · Live data · Professional tools',
    engineLabel: 'ANALYSIS ENGINE v3',
    chatAdvisor: 'Chat with Rouaa AI Advisor',
    generateAnalysis: '⚡ Generate Analysis',
    tabAI: 'AI Analysis',
    tabScreener: 'Stock Scanner',
    tabAIStocks: 'AI Assistant',
    tabMarkets: 'Markets',
    tabNews: 'News',
    tabAnalysts: 'Analysts',
    totalAnalyses: 'Total Analyses',
    highImpact: 'High Impact',
    bullish: 'Bullish',
    bearish: 'Bearish',
    aiGeneratorTitle: 'Smart Analysis Generator',
    aiGeneratorSub: 'AI-powered · Professional structured analysis in seconds',
    selectAsset: 'Select Asset',
    customPair: 'Other pair...',
    analysisType: 'Analysis Type',
    timeframe: 'Timeframe',
    style: 'Style',
    generate: '⚡ Generate',
    generating: '⏳ Processing...',
    ready: 'Ready',
    processing: 'Processing...',
    complete: 'Complete ✓',
    error: 'Error',
    analysisResult: 'Analysis Result',
    copy: '📋 Copy',
    copied: '✓ Copied',
    discussAdvisor: 'Discuss this analysis with Rouaa AI',
    chartTitle: '📈 Chart',
    fromPlatform: 'From Platform',
    loadingChart: 'Loading chart...',
    sentimentTitle: '📊 Sentiment Indicators',
    live: 'Live',
    fearGreed: 'Fear & Greed Index',
    arabSentiment: 'Arab Sentiment',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    geoRisk: 'Geopolitical Risk',
    level: 'Level',
    riskCalcTitle: 'Risk Calculator',
    riskCalcSub: 'Position size management',
    capital: 'Capital ($)',
    riskPct: 'Risk (%)',
    entryPrice: 'Entry Price',
    stopLoss: 'Stop Loss',
    riskAmount: 'Risk Amount',
    lots: 'Lots',
    positionSize: 'Position Size (Units)',
    rewardRisk: 'Reward/Risk (1:R)',
    livePrices: 'Live Prices',
    loadingPrices: 'Loading prices...',
    marketAnalyses: 'Market Analyses',
    viewAll: 'View All →',
    loading: 'Loading...',
    noAnalyses: 'No market analyses available',
    analysesGenerated: 'New analyses are generated automatically every hour',
    confidence: 'Confidence',
    newsAnalysis: 'Latest AI News Analysis',
    viewAllNews: 'View All News →',
    noNews: 'No news with AI analysis available',
    newsAutoAnalyzed: 'New articles are analyzed automatically by AI',
    highImpactLabel: 'High Impact',
    mediumImpactLabel: 'Medium Impact',
    lowImpactLabel: 'Low Impact',
    aiAnalysis: 'AI Analysis',
    readMore: 'Read more',
    showLess: 'Show less',
    noAgentAnalyses: 'No content agent analyses available',
    agentAutoGenerates: 'The content agent generates analyses automatically every hour',
    agentAnalyses: 'Content Agent Analyses',
    rouaaPlatform: 'Rouaa Platform',
    discussCtaTitle: 'Chat with Rouaa AI Advisor',
    discussCtaDesc: 'Ask about any financial asset, get personalized recommendations',
    loadingAnalyses: 'Loading analyses...',
  },
  es: {
    pageTitle: 'Centro de Análisis Inteligente',
    pageSubtitle: 'Análisis IA instantáneo · Datos en vivo · Herramientas profesionales',
    engineLabel: 'MOTOR DE ANÁLISIS v3',
    chatAdvisor: 'Chatear con el Asesor IA Rouaa',
    generateAnalysis: '⚡ Generar Análisis',
    tabAI: 'Análisis IA',
    tabScreener: 'Escáner de Acciones',
    tabAIStocks: 'Asistente IA',
    tabMarkets: 'Mercados',
    tabNews: 'Noticias',
    tabAnalysts: 'Analistas',
    totalAnalyses: 'Total de Análisis',
    highImpact: 'Alto Impacto',
    bullish: 'Alcista',
    bearish: 'Bajista',
    aiGeneratorTitle: 'Generador de Análisis Inteligente',
    aiGeneratorSub: 'Impulsado por IA · Análisis profesional estructurado en segundos',
    selectAsset: 'Seleccionar Activo',
    customPair: 'Otro par...',
    analysisType: 'Tipo de Análisis',
    timeframe: 'Horizonte Temporal',
    style: 'Estilo',
    generate: '⚡ Generar',
    generating: '⏳ Procesando...',
    ready: 'Listo',
    processing: 'Procesando...',
    complete: 'Completado ✓',
    error: 'Error',
    analysisResult: 'Resultado del Análisis',
    copy: '📋 Copiar',
    copied: '✓ Copiado',
    discussAdvisor: 'Discutir este análisis con la IA Rouaa',
    chartTitle: '📈 Gráfico',
    fromPlatform: 'De la Plataforma',
    loadingChart: 'Cargando gráfico...',
    sentimentTitle: '📊 Indicadores de Sentimiento',
    live: 'En vivo',
    fearGreed: 'Índice de Miedo y Codicia',
    arabSentiment: 'Sentimiento Árabe',
    positive: 'Positivo',
    neutral: 'Neutral',
    negative: 'Negativo',
    geoRisk: 'Riesgo Geopolítico',
    level: 'Nivel',
    riskCalcTitle: 'Calculadora de Riesgo',
    riskCalcSub: 'Gestión del tamaño de posición',
    capital: 'Capital ($)',
    riskPct: 'Riesgo (%)',
    entryPrice: 'Precio de Entrada',
    stopLoss: 'Límite de Pérdida',
    riskAmount: 'Monto en Riesgo',
    lots: 'Lotes',
    positionSize: 'Tamaño de Posición (Unidades)',
    rewardRisk: 'Recompensa/Riesgo (1:R)',
    livePrices: 'Precios en Vivo',
    loadingPrices: 'Cargando precios...',
    marketAnalyses: 'Análisis de Mercado',
    viewAll: 'Ver Todo →',
    loading: 'Cargando...',
    noAnalyses: 'No hay análisis de mercado disponibles',
    analysesGenerated: 'Se generan nuevos análisis automáticamente cada hora',
    confidence: 'Confianza',
    newsAnalysis: 'Últimos Análisis IA de Noticias',
    viewAllNews: 'Ver Todas las Noticias →',
    noNews: 'No hay noticias con análisis IA disponibles',
    newsAutoAnalyzed: 'Los nuevos artículos se analizan automáticamente por IA',
    highImpactLabel: 'Alto Impacto',
    mediumImpactLabel: 'Impacto Medio',
    lowImpactLabel: 'Bajo Impacto',
    aiAnalysis: 'Análisis IA',
    readMore: 'Leer más',
    showLess: 'Mostrar menos',
    noAgentAnalyses: 'No hay análisis del agente de contenido disponibles',
    agentAutoGenerates: 'El agente de contenido genera análisis automáticamente cada hora',
    agentAnalyses: 'Análisis del Agente de Contenido',
    rouaaPlatform: 'Plataforma Rouaa',
    discussCtaTitle: 'Chatear con el Asesor IA Rouaa',
    discussCtaDesc: 'Pregunta sobre cualquier activo financiero, obtén recomendaciones personalizadas',
    loadingAnalyses: 'Cargando análisis...',
  },
  fr: {
    pageTitle: 'Centre d\'analyse intelligente',
    pageSubtitle: 'Analyse IA instantanée · Données en direct · Outils professionnels',
    engineLabel: 'MOTEUR D\'ANALYSE v3',
    chatAdvisor: 'Discuter avec le conseiller IA Rouaa',
    generateAnalysis: '⚡ Générer l\'analyse',
    tabAI: 'Analyse IA',
    tabScreener: 'Scanner Actions',
    tabAIStocks: 'Assistant IA',
    tabMarkets: 'Marchés',
    tabNews: 'Actualités',
    tabAnalysts: 'Analystes',
    totalAnalyses: 'Analyses totales',
    highImpact: 'Impact élevé',
    bullish: 'Haussier',
    bearish: 'Baissier',
    aiGeneratorTitle: 'Générateur d\'analyse intelligente',
    aiGeneratorSub: 'Propulsé par l\'IA · Analyse professionnelle structurée en secondes',
    selectAsset: 'Sélectionner l\'actif',
    customPair: 'Autre paire...',
    analysisType: 'Type d\'analyse',
    timeframe: 'Horizon temporel',
    style: 'Style',
    generate: '⚡ Générer',
    generating: '⏳ Traitement...',
    ready: 'Prêt',
    processing: 'Traitement...',
    complete: 'Terminé ✓',
    error: 'Erreur',
    analysisResult: 'Résultat de l\'analyse',
    copy: '📋 Copier',
    copied: '✓ Copié',
    discussAdvisor: 'Discuter de cette analyse avec l\'IA Rouaa',
    chartTitle: '📈 Graphique',
    fromPlatform: 'De la plateforme',
    loadingChart: 'Chargement du graphique...',
    sentimentTitle: '📊 Indicateurs de sentiment',
    live: 'En direct',
    fearGreed: 'Indice Peur & Cupidité',
    arabSentiment: 'Sentiment arabe',
    positive: 'Positif',
    neutral: 'Neutre',
    negative: 'Négatif',
    geoRisk: 'Risque géopolitique',
    level: 'Niveau',
    riskCalcTitle: 'Calculateur de risque',
    riskCalcSub: 'Gestion de la taille de position',
    capital: 'Capital ($)',
    riskPct: 'Risque (%)',
    entryPrice: 'Prix d\'entrée',
    stopLoss: 'Stop Loss',
    riskAmount: 'Montant à risque',
    lots: 'Lots',
    positionSize: 'Taille de position (Unités)',
    rewardRisk: 'Récompense/Risque (1:R)',
    livePrices: 'Prix en direct',
    loadingPrices: 'Chargement des prix...',
    marketAnalyses: 'Analyses de marché',
    viewAll: 'Voir tout →',
    loading: 'Chargement...',
    noAnalyses: 'Aucune analyse de marché disponible',
    analysesGenerated: 'De nouvelles analyses sont générées automatiquement chaque heure',
    confidence: 'Confiance',
    newsAnalysis: 'Dernières analyses IA des actualités',
    viewAllNews: 'Voir toutes les actualités →',
    noNews: 'Aucune actualité avec analyse IA disponible',
    newsAutoAnalyzed: 'Les nouveaux articles sont analysés automatiquement par l\'IA',
    highImpactLabel: 'Impact élevé',
    mediumImpactLabel: 'Impact moyen',
    lowImpactLabel: 'Faible impact',
    aiAnalysis: 'Analyse IA',
    readMore: 'Lire la suite',
    showLess: 'Voir moins',
    noAgentAnalyses: 'Aucune analyse d\'agent de contenu disponible',
    agentAutoGenerates: 'L\'agent de contenu génère des analyses automatiquement chaque heure',
    agentAnalyses: 'Analyses de l\'agent de contenu',
    rouaaPlatform: 'Plateforme Rouaa',
    discussCtaTitle: 'Discuter avec le conseiller IA Rouaa',
    discussCtaDesc: 'Posez des questions sur tout actif financier, obtenez des recommandations personnalisées',
    loadingAnalyses: 'Chargement des analyses...',
  },
  tr: {
    pageTitle: 'Akıllı Analiz Merkezi',
    pageSubtitle: 'Anlık AI analizi · Canlı veri · Profesyonel araçlar',
    engineLabel: 'ANALİZ MOTORU v3',
    chatAdvisor: 'Rouaa AI Danışmanı ile sohbet edin',
    generateAnalysis: '⚡ Analiz Üret',
    tabAI: 'AI Analiz',
    tabScreener: 'Hisse Tarayıcı',
    tabAIStocks: 'AI Asistan',
    tabMarkets: 'Piyasalar',
    tabNews: 'Haberler',
    tabAnalysts: 'Analistler',
    totalAnalyses: 'Toplam Analiz',
    highImpact: 'Yüksek Etki',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    aiGeneratorTitle: 'Akıllı Analiz Üreteci',
    aiGeneratorSub: 'AI destekli · Saniyeler içinde profesyonel yapılandırılmış analiz',
    selectAsset: 'Varlık Seç',
    customPair: 'Başka çift...',
    analysisType: 'Analiz Türü',
    timeframe: 'Zaman Çerçevesi',
    style: 'Stil',
    generate: '⚡ Üret',
    generating: '⏳ İşleniyor...',
    ready: 'Hazır',
    processing: 'İşleniyor...',
    complete: 'Tamamlandı ✓',
    error: 'Hata',
    analysisResult: 'Analiz Sonucu',
    copy: '📋 Kopyala',
    copied: '✓ Kopyalandı',
    discussAdvisor: 'Bu analizi Rouaa AI ile tartışın',
    chartTitle: '📈 Grafik',
    fromPlatform: 'Platformdan',
    loadingChart: 'Grafik yükleniyor...',
    sentimentTitle: '📊 Duygu Göstergeleri',
    live: 'Canlı',
    fearGreed: 'Korku ve Açgözlülük Endeksi',
    arabSentiment: 'Piyasa Duygusu',
    positive: 'Pozitif',
    neutral: 'Nötr',
    negative: 'Negatif',
    geoRisk: 'Jeopolitik Risk',
    level: 'Seviye',
    riskCalcTitle: 'Risk Hesaplayıcı',
    riskCalcSub: 'Pozisyon büyüklüğü yönetimi',
    capital: 'Sermaye ($)',
    riskPct: 'Risk (%)',
    entryPrice: 'Giriş Fiyatı',
    stopLoss: 'Zarar Durdur',
    riskAmount: 'Risk Tutarı',
    lots: 'Lot Sayısı',
    positionSize: 'Pozisyon Büyüklüğü (Birim)',
    rewardRisk: 'Ödül/Risk (1:R)',
    livePrices: 'Canlı Fiyatlar',
    loadingPrices: 'Fiyatlar yükleniyor...',
    marketAnalyses: 'Piyasa Analizleri',
    viewAll: 'Tümünü Gör →',
    loading: 'Yükleniyor...',
    noAnalyses: 'Mevcut piyasa analizi bulunmuyor',
    analysesGenerated: 'Yeni analizler her saat otomatik olarak oluşturulur',
    confidence: 'Güven',
    newsAnalysis: 'Son AI Haber Analizleri',
    viewAllNews: 'Tüm Haberleri Gör →',
    noNews: 'AI analizli haber bulunmuyor',
    newsAutoAnalyzed: 'Yeni haberler AI tarafından otomatik analiz edilir',
    highImpactLabel: 'Yüksek Etki',
    mediumImpactLabel: 'Orta Etki',
    lowImpactLabel: 'Düşük Etki',
    aiAnalysis: 'AI Analizi',
    readMore: 'Devamını oku',
    showLess: 'Daha az göster',
    noAgentAnalyses: 'İçerik ajanı analizi bulunmuyor',
    agentAutoGenerates: 'İçerik ajanı her saat otomatik analiz üretir',
    agentAnalyses: 'İçerik Ajanı Analizleri',
    rouaaPlatform: 'Rouaa Platformu',
    discussCtaTitle: 'Rouaa AI Danışmanı ile sohbet edin',
    discussCtaDesc: 'Herhangi bir finansal varlık hakkında soru sorun, kişiselleştirilmiş öneriler alın',
    loadingAnalyses: 'Analizler yükleniyor...',
  },
};

// ─── Sentiment label helpers (API returns Arabic labels, we override per-locale) ───
function fearGreedLabel(value: number, loc: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  if (value <= 25) return loc === 'ar' ? 'خوف شديد' : loc === 'es' ? 'Miedo Extremo' : loc === 'fr' ? 'Peur Extrême' : loc === 'tr' ? 'Aşırı Korku' : 'Extreme Fear';
  if (value <= 40) return loc === 'ar' ? 'خوف' : loc === 'es' ? 'Miedo' : loc === 'fr' ? 'Peur' : loc === 'tr' ? 'Korku' : 'Fear';
  if (value <= 60) return loc === 'ar' ? 'حذر متوسط' : loc === 'es' ? 'Precaución Moderada' : loc === 'fr' ? 'Prudence Modérée' : loc === 'tr' ? 'Orta Dikkat' : 'Moderate Caution';
  if (value <= 75) return loc === 'ar' ? 'طمع' : loc === 'es' ? 'Codicia' : loc === 'fr' ? 'Cupidité' : loc === 'tr' ? 'Açgözlülük' : 'Greed';
  return loc === 'ar' ? 'طمع شديد' : loc === 'es' ? 'Codicia Extrema' : loc === 'fr' ? 'Cupidité Extrême' : loc === 'tr' ? 'Aşırı Açgözlülük' : 'Extreme Greed';
}

function geoRiskLabel(value: number, loc: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  if (value <= 30) return loc === 'ar' ? 'منخفض' : loc === 'es' ? 'Bajo' : loc === 'fr' ? 'Faible' : loc === 'tr' ? 'Düşük' : 'Low';
  if (value <= 60) return loc === 'ar' ? 'متوسط' : loc === 'es' ? 'Medio' : loc === 'fr' ? 'Moyen' : loc === 'tr' ? 'Orta' : 'Medium';
  return loc === 'ar' ? 'مرتفع' : loc === 'es' ? 'Alto' : loc === 'fr' ? 'Élevé' : loc === 'tr' ? 'Yüksek' : 'High';
}

function geoRiskKeyLabel(key: string, loc: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  const MAP: Record<string, Record<string, string>> = {
    gold:   { ar: 'الذهب', en: 'Gold', es: 'Oro', fr: 'Or', tr: 'Altın' },
    oil:    { ar: 'النفط', en: 'Oil', es: 'Petróleo', fr: 'Pétrole', tr: 'Petrol' },
    dollar: { ar: 'الدولار', en: 'Dollar', es: 'Dólar', fr: 'Dollar', tr: 'Dolar' },
  };
  return MAP[key]?.[loc] || key;
}

function translateImpactValue(val: string, loc: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  // API returns "2 خبر" or similar Arabic patterns — extract number and translate
  const numMatch = val.match(/(\d+)/);
  if (!numMatch) return val;
  const num = numMatch[1];
  const newsWord = loc === 'ar' ? 'خبر' : loc === 'es' ? 'noticias' : loc === 'fr' ? 'actualités' : loc === 'tr' ? 'haber' : 'news';
  return `${num} ${newsWord}`;
}

// ─── Error pattern detection ───
const ERROR_PATTERNS = [
  /GLM API error/i, /API error/i, /timeout of \d+ms exceeded/i,
  /ECONNREFUSED/i, /fetch failed/i, /Internal Server Error/i,
  /circuit breaker/i, /rate limit/i,
];

function isErrorArticle(item: ContentAnalysisItem): boolean {
  const fields = [item.title, item.content, item.summary];
  for (const field of fields) {
    if (typeof field !== 'string') continue;
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(field)) return true;
    }
  }
  return false;
}

// ─── Safe JSON reconstruction for malformed upstream data ───
function sanitizeJson(str: string): string {
  // Remove control characters (0x00-0x1F) except tab, newline, carriage return
  return str.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
}

function safeParseSymbols(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : val.split(',').filter(Boolean); }
    catch { return val.split(',').filter(Boolean); }
  }
  return [];
}

function safeParseTags(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

function buildContentItem(data: Record<string, any>, fallback: Record<string, any>): ContentAnalysisItem {
  return {
    id: String(data.id || fallback.id || Math.random()),
    title: String(data.title || data.name || fallback.title || 'Untitled'),
    content: String(data.content || data.body || data.text || fallback.content || ''),
    category: String(data.category || fallback.category || ''),
    type: String(data.type || fallback.type || ''),
    symbols: safeParseSymbols(data.symbols ?? fallback.symbols),
    sentiment: data.sentiment ?? fallback.sentiment ?? 'neutral',
    impactLevel: String(data.impactLevel || fallback.impactLevel || 'MEDIUM'),
    qualityScore: Number(data.qualityScore || data.confidenceScore || fallback.qualityScore || 0),
    tags: safeParseTags(data.tags ?? fallback.tags),
    publishedAt: String(data.publishedAt || data.createdAt || fallback.publishedAt || new Date().toISOString()),
    summary: String(data.summary || fallback.summary || ''),
  };
}

function reconstructArticle(raw: Record<string, any>): ContentAnalysisItem {
  let title = String(raw.title || '');
  let content = String(raw.content || '');

  // Strategy 1: title="{" and content=rest of JSON (most common upstream bug)
  if (title.trim() === '{' && content.length > 2) {
    try {
      const fullJson = sanitizeJson('{' + content);
      const parsed = JSON.parse(fullJson);
      return buildContentItem(parsed, raw);
    } catch {
      // Strategy 2: Regex extract title and content from broken JSON
      const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
      const contentMatch = content.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const summaryMatch = content.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const sentimentMatch = content.match(/"sentiment"\s*:\s*"([^"]+)"/);
      const symbolsMatch = content.match(/"symbols"\s*:\s*\[([^\]]*)\]/);

      if (titleMatch || contentMatch) {
        return {
          id: String(raw.id || Math.random()),
          title: titleMatch ? titleMatch[1] : 'Analysis',
          content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, ' ') : content.slice(0, 500),
          category: String(raw.category || ''),
          type: String(raw.type || ''),
          symbols: symbolsMatch ? symbolsMatch[1].split(',').map(s => s.replace(/"/g, '').trim()).filter(Boolean) : [],
          sentiment: sentimentMatch ? sentimentMatch[1] : 'neutral',
          impactLevel: String(raw.impactLevel || 'MEDIUM'),
          qualityScore: Number(raw.qualityScore || 0),
          tags: [],
          publishedAt: String(raw.publishedAt || new Date().toISOString()),
          summary: summaryMatch ? summaryMatch[1].replace(/\\n/g, ' ') : '',
        };
      }
      // Fallback: strip JSON syntax
      title = content.slice(0, 80).replace(/[{}"]/g, '').trim() || 'Analysis';
      content = content.replace(/[{}"]/g, ' ').trim();
    }
  }

  // Strategy 3: title itself is a JSON string
  if (title.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(sanitizeJson(title));
      if (parsed.title || parsed.name) {
        return buildContentItem(parsed, { ...raw, content });
      }
    } catch {
      // Not valid JSON
    }
  }

  // Strategy 4: content is JSON but title is fine
  if (content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(sanitizeJson(content));
      if (parsed.title) {
        return buildContentItem(parsed, raw);
      }
    } catch {
      // Not valid JSON
    }
  }

  // Normal article
  return buildContentItem({}, raw);
}

// ─── Time ago helper ───
function timeAgo(dateStr: string, locale: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'À l\'instant' : locale === 'es' ? 'Ahora mismo' : 'Just now';
  if (mins < 60) return locale === 'ar' ? `منذ ${mins} دقيقة` : locale === 'fr' ? `Il y a ${mins} min` : locale === 'es' ? `Hace ${mins} min` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === 'ar' ? `منذ ${hours} ساعة` : locale === 'fr' ? `Il y a ${hours}h` : locale === 'es' ? `Hace ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === 'ar' ? `منذ ${days} يوم` : locale === 'fr' ? `Il y a ${days}j` : locale === 'es' ? `Hace ${days}d` : `${days}d ago`;
}

// ─── Format publication time ───
// Returns formatted time like "10:30 ص" or "2:45 PM" alongside the date
function formatPubTime(dateStr: string, locale: 'ar' | 'en' | 'fr' | 'es' | 'tr'): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    if (locale === 'ar') {
      return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
        + ' · '
        + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    const dateLocale = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
      + ' · '
      + date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── Strip markdown ───
function stripMd(text: string): string {
  return text.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\*{1,2}/g, '').replace(/\n{2,}/g, '\n').trim();
}

// ─── Clean title: remove JSON artifacts, markdown, control chars ───
function cleanTitle(raw: string): string {
  let t = String(raw || '').trim();
  // If title starts with { it's broken JSON — try to extract the real title
  if (t.startsWith('{')) {
    try {
      const obj = JSON.parse(t);
      t = String(obj.title || obj.name || '');
    } catch {
      // Try regex extraction
      const m = t.match(/"title"\s*:\s*"([^"]+)"/);
      if (m) t = m[1];
      else t = t.replace(/[{}"]/g, '').trim().slice(0, 80);
    }
  }
  // Strip markdown headings and bold
  t = t.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\*{1,2}/g, '');
  // Remove numbered section prefixes like "[1] ", "[2] " that leak into titles
  t = t.replace(/^\[\d+\]\s*/, '');
  // Remove control characters
  t = t.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
  // Remove stray emoji artifacts like : at start
  t = t.replace(/^[:\-–—]+\s*/, '');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  // Truncate overly long titles (keep under 120 chars)
  if (t.length > 120) t = t.slice(0, 117) + '...';
  return t || 'Analysis';
}

// ═══════════════════════════════════════════════════════════════════
// STOCK TITLE SANITIZER — Transforms template-based titles from the
// trading platform into clean, professional display titles.
//
// Handles patterns like:
//   "Comprehensive Analysis: Bearish C CAT"     → "CAT – Bearish"
//   "Technical Analysis: Bullish B BTC"          → "BTC – Bullish"
//   "Full Analysis: Neutral E ETH"               → "ETH – Neutral"
//   "Comprehensive Analysis: Bearish Caterpillar Inc. (CAT)" → "Caterpillar Inc. (CAT) – Bearish"
// ═══════════════════════════════════════════════════════════════════

// Known analysis-type prefixes that the trading platform prepends
const STOCK_TITLE_PREFIXES = [
  /Comprehensive\s+Analysis\s*:\s*/i,
  /Technical\s+Analysis\s*:\s*/i,
  /Fundamental\s+Analysis\s*:\s*/i,
  /Full\s+Analysis\s*:\s*/i,
  /Risk\s+Analysis\s*:\s*/i,
  /News\s+Impact\s*:\s*/i,
  /Weekly\s+Outlook\s*:\s*/i,
  /Daily\s+Analysis\s*:\s*/i,
  /Market\s+Analysis\s*:\s*/i,
  /Quick\s+Analysis\s*:\s*/i,
  /In-Depth\s+Analysis\s*:\s*/i,
  /Entry\/Exit\s+Analysis\s*:\s*/i,
  /AI\s+Analysis\s*:\s*/i,
  /Analysis\s*:\s*/i,
];

// Known sentiment words that may appear in template titles
const SENTIMENT_WORDS = ['Bullish', 'Bearish', 'Neutral', 'Positive', 'Negative', 'Strong Buy', 'Strong Sell', 'Buy', 'Sell', 'Hold'];

/**
 * Sanitize a stock analysis title from the trading platform.
 * Removes template prefixes and reconstructs a clean title using
 * available symbol and sentiment data.
 */
function sanitizeStockTitle(
  rawTitle: string,
  symbols: string[],
  sentiment: string | number,
  locale: 'ar' | 'en' | 'fr' | 'es' | 'tr'
): string {
  let t = cleanTitle(rawTitle);
  if (!t || t === 'Analysis') return t;

  // Check if the title matches a template pattern (has a known prefix)
  const hasTemplatePrefix = STOCK_TITLE_PREFIXES.some(rx => rx.test(t));

  if (!hasTemplatePrefix) {
    // Not a template title — return as-is after basic cleaning
    return t;
  }

  // Strip the template prefix
  for (const rx of STOCK_TITLE_PREFIXES) {
    t = t.replace(rx, '');
  }
  t = t.trim();

  // Now t should be something like "Bearish C CAT" or "Bullish Caterpillar Inc. (CAT)"
  // Try to extract: [Sentiment] [CompanyName] ([Symbol]) or [Sentiment] [SingleLetter] [Symbol]

  // Determine the sentiment label from the data
  const sClass = sentimentClass(String(sentiment));
  const sLabel = sClass === 'bullish'
    ? (locale === 'ar' ? 'صعودي' : locale === 'fr' ? 'Haussier' : locale === 'es' ? 'Alcista' : 'Bullish')
    : sClass === 'bearish'
    ? (locale === 'ar' ? 'هبوطي' : locale === 'fr' ? 'Baissier' : locale === 'es' ? 'Bajista' : 'Bearish')
    : (locale === 'ar' ? 'محايد' : locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Neutral' : 'Neutral');

  // Remove the sentiment word from the remaining title if present
  for (const sw of SENTIMENT_WORDS) {
    const swRegex = new RegExp(`^${sw}\\s+`, 'i');
    t = t.replace(swRegex, '');
  }

  // Now t should be something like "C CAT" or "Caterpillar Inc. (CAT)" or just "CAT"
  // Detect the "SingleLetter Symbol" pattern (e.g., "C CAT", "B BTC")
  const singleLetterSymbolMatch = t.match(/^([A-Z])\s+([A-Z]{2,5})$/);

  // Get the primary symbol
  const primarySymbol = symbols.length > 0 ? symbols[0] : '';

  if (singleLetterSymbolMatch) {
    // Pattern: "C CAT" → the single letter is a broken first letter, the rest is the symbol
    const actualSymbol = singleLetterSymbolMatch[2];
    // Build clean title: "SYMBOL – Sentiment"
    return locale === 'ar'
      ? `${actualSymbol} – ${sLabel}`
      : `${actualSymbol} – ${sLabel}`;
  }

  // Check if t already contains a proper company name with symbol in parens
  // e.g., "Caterpillar Inc. (CAT)"
  const nameWithSymbolMatch = t.match(/^(.+?)\s*\(([A-Z]{1,5})\)\s*$/);
  if (nameWithSymbolMatch) {
    const companyName = nameWithSymbolMatch[1].trim();
    const sym = nameWithSymbolMatch[2];
    return locale === 'ar'
      ? `${companyName} (${sym}) – ${sLabel}`
      : `${companyName} (${sym}) – ${sLabel}`;
  }

  // If we have a symbol from data, use it
  if (primarySymbol) {
    // Clean the symbol for display
    const displaySymbol = primarySymbol.replace('/USDT', '').replace('/USD', '');
    // Check if t contains anything useful beyond just the symbol
    const remaining = t.replace(new RegExp(`\\b${displaySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '').trim();
    if (remaining && remaining.length > 1 && remaining !== displaySymbol) {
      // There's a company name or description
      return locale === 'ar'
        ? `${remaining} (${displaySymbol}) – ${sLabel}`
        : `${remaining} (${displaySymbol}) – ${sLabel}`;
    }
    // Just symbol + sentiment
    return locale === 'ar'
      ? `${displaySymbol} – ${sLabel}`
      : `${displaySymbol} – ${sLabel}`;
  }

  // Fallback: just use whatever is left after stripping prefix and sentiment
  if (t) {
    return locale === 'ar'
      ? `${t} – ${sLabel}`
      : `${t} – ${sLabel}`;
  }

  return locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyse' : locale === 'es' ? 'Análisis' : 'Analysis';
}

// ═══════════════════════════════════════════════════════════════════
// RICH TEXT RENDERER — Converts plain analysis text into formatted React
// Detects: headings, numbered sections, bullet points, key-value pairs
// ═══════════════════════════════════════════════════════════════════

type LineType = 'heading' | 'subheading' | 'bullet' | 'numbered' | 'kvPair' | 'divider' | 'text';

interface ParsedLine {
  type: LineType;
  content: string;
  key?: string;
  value?: string;
  number?: string;
  icon?: string;
}

function parseAnalysisText(rawText: string): ParsedLine[] {
  const text = stripMd(rawText);
  if (!text) return [];

  const lines = text.split('\n');
  const result: ParsedLine[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      // blank line = potential section divider
      if (result.length > 0 && result[result.length - 1].type !== 'divider') {
        result.push({ type: 'divider', content: '' });
      }
      continue;
    }

    // [N] numbered section heading — e.g. "[1] ملخص الوضع الحالي"
    const sectionMatch = line.match(/^\[(\d+)\]\s*(.+)/);
    if (sectionMatch) {
      result.push({ type: 'heading', content: sectionMatch[2], number: sectionMatch[1], icon: '📋' });
      continue;
    }

    // Markdown headings ### or ## or # (after stripMd these might still appear if malformed)
    const mdHeading = line.match(/^#{1,3}\s+(.+)/);
    if (mdHeading) {
      result.push({ type: 'heading', content: mdHeading[1], icon: '📊' });
      continue;
    }

    // Numbered headings like "1. الرسم البياني اليومي" or "1- الرسم البياني"
    const numHeadingMatch = line.match(/^(\d+)[\.\-]\s+([^\-:]{5,})$/);
    if (numHeadingMatch && !line.includes(':') && numHeadingMatch[2].length > 5) {
      result.push({ type: 'subheading', content: numHeadingMatch[2], number: numHeadingMatch[1], icon: '📈' });
      continue;
    }

    // Bullet points: "- text" or "• text" or "* text"
    const bulletMatch = line.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      // Check if it's a key-value bullet: "- السعر الحالي: 85.75"
      const kvMatch = bulletMatch[1].match(/^(.{3,30}?)\s*[:：]\s*(.+)/);
      if (kvMatch) {
        result.push({ type: 'kvPair', content: line, key: kvMatch[1].trim(), value: kvMatch[2].trim() });
      } else {
        result.push({ type: 'bullet', content: bulletMatch[1] });
      }
      continue;
    }

    // Key-value pairs: "السعر الحالي: 85.75" or "السعر الحالي - 85.75"
    const kvLineMatch = line.match(/^(.{3,35}?)\s*[:：]\s*(.+)/);
    if (kvLineMatch && kvLineMatch[2].length > 0) {
      result.push({ type: 'kvPair', content: line, key: kvLineMatch[1].trim(), value: kvLineMatch[2].trim() });
      continue;
    }

    // Numbered items with nested bullets: "2. مستويات الدعم والمقاومة:"
    const numItemMatch = line.match(/^(\d+)[\.\-)]\s+(.+)/);
    if (numItemMatch) {
      const afterNum = numItemMatch[2];
      const afterKv = afterNum.match(/^(.{3,30}?)\s*[:：]\s*(.*)/);
      if (afterKv) {
        result.push({ type: 'subheading', content: afterKv[1].trim(), number: numItemMatch[1], icon: '📊' });
        if (afterKv[2].trim()) {
          result.push({ type: 'text', content: afterKv[2].trim() });
        }
      } else {
        result.push({ type: 'subheading', content: afterNum, number: numItemMatch[1], icon: '📊' });
      }
      continue;
    }

    // Lines that look like section headings (no punctuation at end, not too short)
    const looksLikeHeading = line.length > 5 && line.length < 80
      && !line.endsWith('.') && !line.endsWith('،') && !line.endsWith(',')
      && !line.endsWith('USDT') && !line.endsWith('USD')
      && !/^\d/.test(line)
      && (/[ا-ي]{3,}/.test(line) || /^[A-Z]{2,}/.test(line));

    if (looksLikeHeading && result.length > 0 && result[result.length - 1].type === 'divider') {
      result.push({ type: 'subheading', content: line, icon: '📌' });
      continue;
    }

    // Default: plain text
    result.push({ type: 'text', content: line });
  }

  return result;
}

// Map keywords to visual styling
function getKvStyle(key: string, value: string): { color: string; icon: string } {
  const k = key.toLowerCase();
  const v = value.toLowerCase();

  // Price levels
  if (/دعم|support/i.test(k)) return { color: 'var(--bull)', icon: '🟢' };
  if (/مقاومة|resistance/i.test(k)) return { color: 'var(--bear)', icon: '🔴' };

  // Sentiment
  if (/صعود|إيجاب|bull|positive|up/i.test(v)) return { color: 'var(--bull)', icon: '📈' };
  if (/هبوط|سلب|bear|negative|down/i.test(v)) return { color: 'var(--bear)', icon: '📉' };

  // Risk
  if (/مخاطر|risk/i.test(k)) return { color: 'var(--gold)', icon: '⚠️' };

  // Price
  if (/سعر|price|usdt|usd/i.test(k) || /usdt|usd/i.test(v)) return { color: 'var(--cyan)', icon: '💲' };

  // EMA / technical
  if (/ema|متحرك|moving/i.test(k)) return { color: 'var(--purple)', icon: '〰️' };

  return { color: 'var(--text2)', icon: '•' };
}

function getHeadingIcon(content: string): string {
  if (/ملخص|summary|وضع/i.test(content)) return '📋';
  if (/مستويات|levels|دعم|مقاومة/i.test(content)) return '📊';
  if (/اتجاه|trend|توقع/i.test(content)) return '📈';
  if (/دخول|خروج|entry|exit|نقاط/i.test(content)) return '🎯';
  if (/مخاطر|risk|إدارة/i.test(content)) return '🛡️';
  if (/توصية|recommendation|ختام|خاتم/i.test(content)) return '💡';
  if (/رسم|chart|بياني/i.test(content)) return '📉';
  if (/سيناريو|scenario/i.test(content)) return '🔮';
  if (/تنبيه|alert|تحذير/i.test(content)) return '⚠️';
  if (/ساعي|hourly/i.test(content)) return '⏱️';
  if (/يومي|daily/i.test(content)) return '📅';
  if (/شهري|monthly/i.test(content)) return '🗓️';
  if (/بيانات|data|سوق/i.test(content)) return '📡';
  return '📌';
}

// ═══════════════════════════════════════════════════════════════════
// RICH TEXT RENDER COMPONENT
// ═══════════════════════════════════════════════════════════════════
function RichAnalysisContent({ text, cssModule }: { text: string; cssModule: typeof s }) {
  const parsed = parseAnalysisText(text);
  if (parsed.length === 0) return null;

  const ss = cssModule;

  return (
    <div className={ss.richContent}>
      {parsed.map((line, i) => {
        switch (line.type) {
          case 'heading':
            return (
              <div key={i} className={ss.richHeading}>
                <span className={ss.richHeadingIcon}>{getHeadingIcon(line.content)}</span>
                {line.number && <span className={ss.richHeadingNum}>{line.number}</span>}
                <span className={ss.richHeadingText}>{line.content}</span>
              </div>
            );
          case 'subheading':
            return (
              <div key={i} className={ss.richSubheading}>
                <span className={ss.richSubheadingDot} />
                {line.number && <span className={ss.richSubheadingNum}>{line.number}</span>}
                <span>{line.content}</span>
              </div>
            );
          case 'bullet':
            return (
              <div key={i} className={ss.richBullet}>
                <span className={ss.richBulletDot} />
                <span>{line.content}</span>
              </div>
            );
          case 'kvPair': {
            const style = getKvStyle(line.key || '', line.value || '');
            return (
              <div key={i} className={ss.richKvRow}>
                <span className={ss.richKvIcon}>{style.icon}</span>
                <span className={ss.richKvKey}>{line.key}</span>
                <span className={ss.richKvValue} style={{ color: style.color }}>{line.value}</span>
              </div>
            );
          }
          case 'divider':
            return <div key={i} className={ss.richDivider} />;
          case 'text':
          default:
            return <div key={i} className={ss.richParagraph}>{line.content}</div>;
        }
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
type LatinLocale = 'en' | 'es' | 'fr' | 'tr';

interface Props {
  locale: 'ar' | 'en' | 'fr' | 'es' | 'tr';
  linkLocale?: string;
}

export default function AnalysisPage({ locale, linkLocale }: Props) {
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const txt = TEXT[locale] || TEXT.en;
  const dir = isAr ? 'rtl' : 'ltr';

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  // ── AI Generator State ──
  const [genLoading, setGenLoading] = useState(false);
  const [genOutput, setGenOutput] = useState<string | null>(null);
  const [genTimestamp, setGenTimestamp] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'ready' | 'processing' | 'complete' | 'error'>('ready');
  const [copied, setCopied] = useState(false);
  const [genPair, setGenPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [genType, setGenType] = useState('full');
  const [genTimeframe, setGenTimeframe] = useState('short');
  const [genStyle, setGenStyle] = useState('pro');

  // ── Chart State ──
  const [chartPair, setChartPair] = useState('EUR/USD');

  // ── Data State ──
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [marketAnalyses, setMarketAnalyses] = useState<MarketAnalysisItem[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [newsWithAnalysis, setNewsWithAnalysis] = useState<NewsWithAnalysis[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [tradingQuotes, setTradingQuotes] = useState<TradingQuote[]>([]);
  const [tradingLoading, setTradingLoading] = useState(true);
  const [contentAnalyses, setContentAnalyses] = useState<ContentAnalysisItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  // ── Risk Calculator State ──
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entryPrice, setEntryPrice] = useState(1.0843);
  const [stopLossVal, setStopLossVal] = useState(1.0800);

  // ── Expanded items ──
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ── Stats ──
  const [stats, setStats] = useState({ totalAnalysis: 0, highImpact: 0, bullish: 0, bearish: 0 });

  // ── UI State ──
  const [showBackTop, setShowBackTop] = useState(false);

  // ── Scroll ──
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Fetch Sentiment ──
  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) setSentimentData(await res.json());
      } catch { /* silent */ }
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch Trading Quotes ──
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setTradingLoading(true);
        const res = await fetch('/api/trading-platform?symbols=BTC/USDT,ETH/USDT,XAU/USD,AAPL,TSLA,SPY', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTradingQuotes(data.data || []);
        }
      } catch { /* silent */ }
      finally { setTradingLoading(false); }
    };
    fetchQuotes();
    const interval = setInterval(() => { if (document.hidden) return; fetchQuotes(); }, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch Content Agent Analyses (with JSON reconstruction) ──
  // V317: Added client-side Arabic filter as defensive layer
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setContentLoading(true);
        const res = await fetch(`/api/trading-platform/analysis?limit=5&locale=${locale}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const articles = (data.articles || [])
            .map((a: Record<string, any>) => reconstructArticle(a))
            .filter((a: ContentAnalysisItem) => !isErrorArticle(a))
            // V317: Client-side defensive filter — reject Arabic content on English page
            .filter((a: ContentAnalysisItem) => {
              if (locale !== 'en') return true;
              const arabicRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
              const titleAr = (a.title || '').match(arabicRe) || [];
              const contentAr = (a.content || '').slice(0, 500).match(arabicRe) || [];
              return titleAr.length < 3 && contentAr.length < 10;
            });
          setContentAnalyses(articles);
        }
      } catch { /* silent */ }
      finally { setContentLoading(false); }
    };
    fetchContent();
  }, [locale]);

  // ── Fetch Market Analyses ──
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setAnalysesLoading(true);
        const res = await fetch(`/api/market-analyses?limit=6&locale=${locale}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMarketAnalyses(data.analyses || []);
        }
      } catch { /* silent */ }
      finally { setAnalysesLoading(false); }
    };
    fetchAnalyses();
  }, []);

  // ── Fetch News ──
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const res = await fetch(`/api/analysis/news?limit=6&locale=${locale}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setNewsWithAnalysis((data.items || []).filter((n: any) => n.aiAnalysis && n.aiAnalysis.length > 50));
        }
      } catch { /* silent */ }
      finally { setNewsLoading(false); }
    };
    fetchNews();
  }, []);

  // ── Compute Stats ──
  useEffect(() => {
    const total = marketAnalyses.length + newsWithAnalysis.length;
    const highImpact = newsWithAnalysis.filter(n => n.impactLevel === 'high').length;
    const bullish = marketAnalyses.filter(a => /bull|positive|up|صعود|إيجاب/i.test(a.sentiment)).length +
      newsWithAnalysis.filter(n => n.sentiment === 'positive').length;
    const bearish = marketAnalyses.filter(a => /bear|negative|down|هبوط|سلب/i.test(a.sentiment)).length +
      newsWithAnalysis.filter(n => n.sentiment === 'negative').length;
    setStats({ totalAnalysis: total, highImpact, bullish, bearish });
  }, [marketAnalyses, newsWithAnalysis]);

  // ── AI Generation Handler ──
  const handleGenerate = useCallback(async () => {
    if (genLoading) return;
    const pair = customPair.trim() || genPair;
    if (!pair) return;
    setGenLoading(true);
    setAiStatus('processing');
    setGenOutput(null);

    try {
      const typeLabel = ANALYSIS_TYPES[genType]?.[locale] || genType;
      const tfLabel = TIMEFRAMES[genTimeframe]?.[locale] || genTimeframe;
      const styleLabel = STYLES[genStyle]?.[locale] || genStyle;

      const prompt = isAr
        ? `أنت محلل أسواق خبير ومستشار استثماري لمنصة "رؤى". قم بتحليل ${pair} — نوع التحليل: ${typeLabel} — الإطار الزمني: ${tfLabel} — الأسلوب: ${styleLabel}.

قدم تحليلاً مهنياً يتبع الهيكل التالي:
## 📋 1 — ملخص الوضع الحالي
[تحليل حركة السعر الحالية والمؤشرات الفنية الرئيسية]

## 📊 2 — المستويات الرئيسية
| المستوى | النوع | القيمة |
|---------|-------|--------|
[دعم ومقاومة مع القيم]

## 📈 3 — الاتجاه المتوقع
[الاتجاه على المدى القصير والمتوسط مع السيناريوهات]

## 🎯 4 — نقاط الدخول والخروج المحتملة
[أسعار الدخول ووقف الخسارة والأهداف]

## 🛡️ 5 — إدارة المخاطر
[حجم الصفقة ونسبة المخاطرة/العائد]

## ✅ 6 — التوصية الختامية
[توصية واضحة مع مستوى الثقة]

---
⚠️ تنبيه المخاطر: المعلومات لأغراض تعليمية ومعلوماتية فقط ولا تعتبر نصيحة استثمارية.

قواعد صارمة:
- أجب بالعربية فقط — لا تستخدم أبداً حروفاً من لغات أخرى (لا تايلندية، لا صينية)
- "تقلب" وليس "عوضية" عند ترجمة volatility
- استخدم تنسيق markdown الاحترافي (##, ###, ---, >, |)
- لا تكرر الأفكار. لا تخترع أرقام. النبرة: مباشرة وتقنية. اكتب بالعربية الفصحى.
- قدم تحليلاً حقيقياً ومفيداً — لا تقل أبداً "لا توجد توصية"`
        : `You are an expert market analyst for the "Rouaa" platform. Analyze ${pair} — Analysis type: ${typeLabel} — Timeframe: ${tfLabel} — Style: ${styleLabel}.

Provide a professional analysis using this structure:
## 📋 1 — Current Situation Summary
[Analyze current price action and key technical indicators]

## 📊 2 — Key Levels
| Level | Type | Value |
|-------|------|-------|
[Support and resistance with values]

## 📈 3 — Expected Trend
[Short and medium-term direction with scenarios]

## 🎯 4 — Potential Entry/Exit Points
[Entry prices, stop-loss, and targets]

## 🛡️ 5 — Risk Management
[Position sizing and risk/reward ratio]

## ✅ 6 — Final Recommendation
[Clear recommendation with confidence level]

---
⚠️ Risk Disclaimer: Information is for educational purposes only and does not constitute investment advice.

Strict rules:
- Use professional markdown formatting (##, ###, ---, >, |)
- No repetition. Don't invent numbers. Direct, technical tone. Professional English.
- Provide REAL, USEFUL analysis — never say "no recommendation available"; always analyze and provide insight`;

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (data.response) {
        setGenOutput(data.response);
        setGenTimestamp(new Date().toLocaleTimeString(isAr ? 'ar-EG' : isFr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
        setAiStatus('complete');
      } else {
        setGenOutput(isAr ? 'عذراً، حدث خطأ في التوليد.' : isFr ? 'Désolé, une erreur est survenue lors de la génération.' : 'Sorry, an error occurred during generation.');
        setAiStatus('error');
      }
    } catch {
      setGenOutput(isAr ? 'عذراً، لم أتمكن من الاتصال بالخادم.' : isFr ? 'Désolé, impossible de se connecter au serveur.' : 'Sorry, could not connect to the server.');
      setAiStatus('error');
    } finally {
      setGenLoading(false);
    }
  }, [genLoading, genPair, customPair, genType, genTimeframe, genStyle, locale, isAr, isFr]);

  // ── Copy handler ──
  const handleCopy = useCallback(() => {
    if (genOutput) {
      navigator.clipboard.writeText(genOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [genOutput]);

  // ── Toggle expand ──
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Risk calculations ──
  const riskDollar = capital * (riskPct / 100);
  const slDistance = Math.abs(entryPrice - stopLossVal);
  const lots = slDistance > 0 ? riskDollar / (slDistance * 100000) : 0;
  const units = lots * 100000;

  // ── Tab definitions ──
  const tabs: Array<{ id: TabId; label: string; icon: string; count: number }> = [
    { id: 'ai', label: txt.tabAI, icon: '🧠', count: 0 },
    { id: 'screener', label: txt.tabScreener, icon: '🔍', count: 0 },
    { id: 'ai-stocks', label: txt.tabAIStocks, icon: '🤖', count: 0 },
    { id: 'markets', label: txt.tabMarkets, icon: '📈', count: marketAnalyses.length },
    { id: 'news', label: txt.tabNews, icon: '📰', count: newsWithAnalysis.length },
    { id: 'analysts', label: txt.tabAnalysts, icon: '📊', count: contentAnalyses.length },
  ];

  // ── Status color ──
  const statusColor = aiStatus === 'complete' ? 'var(--bull)' : aiStatus === 'error' ? 'var(--bear)' : aiStatus === 'processing' ? 'var(--gold)' : 'var(--cyan)';
  const statusText = aiStatus === 'ready' ? txt.ready : aiStatus === 'processing' ? txt.processing : aiStatus === 'complete' ? txt.complete : txt.error;

  // ── Fear & Greed ──
  const fearGreed = sentimentData?.fearGreedIndex || { value: 0, label: '—', labelAr: '—' };
  const fgColor = fearGreed.value >= 60 ? 'var(--bull)' : fearGreed.value >= 40 ? 'var(--gold)' : 'var(--bear)';
  const arabSentiment = sentimentData?.arabSentimentIndex;
  const geoRisk = sentimentData?.geopoliticalRiskIndex;

  // ── Chart symbol map ──
  const CHART_SYMBOL_MAP: Record<string, string> = {
    'EUR/USD': 'EUR', 'XAU/USD': 'XAU', 'BTC/USDT': 'BTC',
    'GBP/USD': 'GBP', 'USD/JPY': 'JPY', 'ETH/USDT': 'ETH',
    'AAPL': 'AAPL', 'TSLA': 'TSLA', 'SPY': 'SPY',
  };

  // ═══ RENDER ═══
  return (
    <main className={s.pageRoot} dir={dir} style={{ background: 'var(--bg)' }}>
      <div className={s.pageContainer}>

        {/* ═══ HEADER ═══ */}
        <header className={s.terminalHeader}>
          <div className={s.terminalHeaderLeft}>
            <div className={s.terminalLogo}>
              <svg className={s.terminalLogoSvg} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className={s.terminalTitleGroup}>
              <div className={s.terminalBadge}>
                <span className={s.terminalBadgeDot} />
                {txt.engineLabel}
              </div>
              <h1 className={s.terminalTitle}>{txt.pageTitle}</h1>
              <p className={s.terminalSubtitle}>{txt.pageSubtitle}</p>
            </div>
          </div>
          <div className={s.terminalHeaderRight}>
            <button
              onClick={() => { setActiveTab('ai'); }}
              className={s.advisorBtnOutline}
            >
              {txt.generateAnalysis}
            </button>
          </div>
        </header>

        {/* ═══ STATS BAR ═══ */}
        <div className={s.statsBar}>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(123,94,167,0.12)' }}>📊</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>{txt.totalAnalyses}</span>
              <span className={s.statValue}>{stats.totalAnalysis}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(212,54,92,0.1)' }}>🔴</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>{txt.highImpact}</span>
              <span className={s.statValue}>{stats.highImpact}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(0,153,107,0.1)' }}>📈</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>{txt.bullish}</span>
              <span className={s.statValue} style={{ color: 'var(--bull)' }}>{stats.bullish}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(212,54,92,0.1)' }}>📉</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>{txt.bearish}</span>
              <span className={s.statValue} style={{ color: 'var(--bear)' }}>{stats.bearish}</span>
            </div>
          </div>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <div className={s.tabBar}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${s.tabButton} ${activeTab === tab.id ? s.tabButtonActive : ''}`}
            >
              <span className={s.tabIcon}>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && <span className={s.tabCount}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className={s.terminalGrid}>

          {/* LEFT — Main Content */}
          <div className={s.mainContent}>
            <div className={s.tabContent} key={activeTab}>

              {/* ═══════════ AI TAB ═══════════ */}
              {activeTab === 'ai' && (
                <>
                  {/* AI Generator */}
                  <div className={s.card}>
                    <div className={s.cardTopBar} />
                    <div className={s.cardBody}>
                      {/* Header */}
                      <div className={s.genPanelHeader}>
                        <div className={s.genPanelIcon}>🧠</div>
                        <div style={{ flex: 1 }}>
                          <div className={s.genPanelTitle}>{txt.aiGeneratorTitle}</div>
                          <div className={s.genPanelSub}>{txt.aiGeneratorSub}</div>
                        </div>
                        <div className={s.genPanelStatus}>
                          <span className={s.statusDot} style={{ background: statusColor }} />
                          <span className={s.statusText} style={{ color: statusColor }}>{statusText}</span>
                        </div>
                      </div>

                      {/* Pair Selector */}
                      <div className={s.pairSection}>
                        <div className={s.pairLabel}>{txt.selectAsset}</div>
                        <div className={s.pairTabs}>
                          {['EUR/USD', 'XAU/USD', 'BTC/USDT', 'GBP/USD', 'USD/JPY', 'ETH/USDT', 'AAPL', 'TSLA', 'SPY'].map(pair => (
                            <button key={pair}
                              onClick={() => { setGenPair(pair); setCustomPair(''); }}
                              className={`${s.pairTab} ${genPair === pair && !customPair ? s.pairTabActive : ''}`}>
                              {pair}
                            </button>
                          ))}
                          <input type="text" value={customPair}
                            onChange={e => { setCustomPair(e.target.value); setGenPair(''); }}
                            placeholder={txt.customPair}
                            className={s.customPairInput} />
                        </div>
                      </div>

                      {/* Controls */}
                      <div className={s.controlsGrid}>
                        <div className={s.controlGroup}>
                          <div className={s.controlLabel}>{txt.analysisType}</div>
                          <select value={genType} onChange={e => setGenType(e.target.value)} className={s.controlSelect}>
                            {Object.entries(ANALYSIS_TYPES).map(([k, v]) => (
                              <option key={k} value={k}>{v[locale]}</option>
                            ))}
                          </select>
                        </div>
                        <div className={s.controlGroup}>
                          <div className={s.controlLabel}>{txt.timeframe}</div>
                          <select value={genTimeframe} onChange={e => setGenTimeframe(e.target.value)} className={s.controlSelect}>
                            {Object.entries(TIMEFRAMES).map(([k, v]) => (
                              <option key={k} value={k}>{v[locale]}</option>
                            ))}
                          </select>
                        </div>
                        <div className={s.controlGroup}>
                          <div className={s.controlLabel}>{txt.style}</div>
                          <select value={genStyle} onChange={e => setGenStyle(e.target.value)} className={s.controlSelect}>
                            {Object.entries(STYLES).map(([k, v]) => (
                              <option key={k} value={k}>{v[locale]}</option>
                            ))}
                          </select>
                        </div>
                        <button onClick={handleGenerate} disabled={genLoading} className={s.genBtn}>
                          {genLoading ? txt.generating : txt.generate}
                        </button>
                      </div>
                    </div>

                    {/* Output */}
                    {genOutput && (
                      <div className={s.outputArea}>
                        <div className={s.outputHeader}>
                          <span className={s.outputIcon}>🧠</span>
                          <span className={s.outputLabel}>{txt.analysisResult}</span>
                          <span className={s.outputMeta}>{customPair || genPair}</span>
                          {genTimestamp && <span className={s.outputTime}>{genTimestamp}</span>}
                          <button className={s.outputCopyBtn} onClick={handleCopy}>
                            {copied ? txt.copied : txt.copy}
                          </button>
                        </div>
                        <RichAnalysisContent text={genOutput || ''} cssModule={s} />
                      </div>
                    )}
                  </div>

                  {/* Chart */}
                  <div className={s.card}>
                    <div className={s.chartHeader}>
                      <div className={s.chartHeaderLeft}>
                        <span className={s.chartTitle}>{txt.chartTitle}</span>
                        <span className={s.chartBadge}>{txt.fromPlatform}</span>
                      </div>
                      <div className={s.chartHeaderRight}>
                        {Object.keys(CHART_PAIRS).slice(0, 6).map(p => (
                          <button key={p} onClick={() => setChartPair(p)}
                            className={`${s.chartPairBtn} ${chartPair === p ? s.chartPairBtnActive : ''}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 420, overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
                      <PlatformChart
                        symbol={CHART_SYMBOL_MAP[chartPair] || 'EUR'}
                        nameAr={chartPair}
                        locale={locale}
                        height={420}
                        showVolume={true}
                        showToolbar={true}
                        defaultInterval="1hour"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ═══════════ STOCK SCREENER TAB ═══════════ */}
              {activeTab === 'screener' && (
                <StockScreener locale={locale} cssModule={s} />
              )}

              {/* ═══════════ AI STOCK ASSISTANT TAB ═══════════ */}
              {activeTab === 'ai-stocks' && (
                <AIStockFinder locale={locale} cssModule={s} />
              )}

              {/* ═══════════ MARKETS TAB ═══════════ */}
              {activeTab === 'markets' && (
                <>
                  {/* Chart */}
                  <div className={s.card}>
                    <div className={s.chartHeader}>
                      <div className={s.chartHeaderLeft}>
                        <span className={s.chartTitle}>{txt.chartTitle}</span>
                        <span className={s.chartBadge}>{txt.fromPlatform}</span>
                      </div>
                      <div className={s.chartHeaderRight}>
                        {Object.keys(CHART_PAIRS).slice(0, 6).map(p => (
                          <button key={p} onClick={() => setChartPair(p)}
                            className={`${s.chartPairBtn} ${chartPair === p ? s.chartPairBtnActive : ''}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 420, overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
                      <PlatformChart
                        symbol={CHART_SYMBOL_MAP[chartPair] || 'EUR'}
                        nameAr={chartPair}
                        locale={locale}
                        height={420}
                        showVolume={true}
                        showToolbar={true}
                        defaultInterval="1hour"
                      />
                    </div>
                  </div>

                  {/* Market Analyses Grid */}
                  <div className={s.sectionHeader}>
                    <div className={s.sectionTitleWrap}>
                      <span className={s.sectionIcon}>📊</span>
                      <span className={s.sectionTitle}>{txt.marketAnalyses}</span>
                      <span className={s.sectionCount}>{marketAnalyses.length}</span>
                    </div>
                    <a href={isAr ? '/reports' : isFr ? '/fr/reports' : '/en/reports'} className={s.sectionLink}>{txt.viewAll}</a>
                  </div>
                  {analysesLoading ? (
                    <div className={s.loadingSpinner}><div className={s.spinnerDot} /><div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} /><div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} /><span>{txt.loading}</span></div>
                  ) : marketAnalyses.length === 0 ? (
                    <div className={s.emptyState}><div className={s.emptyStateIcon}>📊</div><div>{txt.noAnalyses}</div><div className={s.emptyStateSub}>{txt.analysesGenerated}</div></div>
                  ) : (
                    <div className={s.analysisCardsGrid}>
                      {marketAnalyses.map(a => {
                        const sc = sentimentClass(a.sentiment);
                        const sColor = sc === 'bullish' ? 'var(--bull)' : sc === 'bearish' ? 'var(--bear)' : 'var(--gold)';
                        const sBg = sc === 'bullish' ? 'var(--bull2)' : sc === 'bearish' ? 'var(--bear2)' : 'var(--gold2)';
                        const sLabel = sentimentLabel(a.sentiment, locale);
                        const acLabel = assetClassLabel(a.assetClass, locale);
                        const rLabel = riskLabel(a.riskLevel, locale);
                        const isHighRisk = /high|مرتفع|extreme|شديد/i.test(a.riskLevel);
                        const isMedRisk = /medium|متوسط/i.test(a.riskLevel);

                        return (
                          <div key={a.id} className={s.marketCard} style={{ borderInlineStart: `3px solid ${sColor}` }}>
                            <div className={s.cardTopRow}>
                              <div className={s.cardAssetBadge}>
                                <span className={s.cardAssetDot} style={{ background: sColor }} />
                                <span className={s.cardAssetName}>{acLabel}</span>
                              </div>
                              <span className={s.sentimentChip} style={{ background: sBg, color: sColor }}>{sLabel}</span>
                            </div>
                            <div className={s.cardTitle}>{sanitizeStockTitle(a.title, [], a.sentiment, locale)}</div>
                            <div className={s.cardMeta}>
                              <span>{timeAgo(a.publishedAt, locale)}</span>
                              {formatPubTime(a.publishedAt, locale) && <span style={{ opacity: 0.6, fontSize: 10 }}>{formatPubTime(a.publishedAt, locale)}</span>}
                              <span className={s.cardConfidence}>{a.confidenceScore}%</span>
                              <span className={s.cardRiskBadge} style={{ color: isHighRisk ? 'var(--bear)' : isMedRisk ? 'var(--gold)' : 'var(--bull)' }}>{rLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ═══════════ NEWS TAB ═══════════ */}
              {activeTab === 'news' && (
                <>
                  <div className={s.sectionHeader}>
                    <div className={s.sectionTitleWrap}>
                      <span className={s.sectionIcon}>🧠</span>
                      <span className={s.sectionTitle}>{txt.newsAnalysis}</span>
                      <span className={s.sectionCount}>{newsWithAnalysis.length}</span>
                    </div>
                    <a href={isAr ? '/news' : isFr ? '/fr/news' : '/en/news'} className={s.sectionLink}>{txt.viewAllNews}</a>
                  </div>
                  {newsLoading ? (
                    <div className={s.loadingSpinner}><div className={s.spinnerDot} /><div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} /><div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} /><span>{txt.loading}</span></div>
                  ) : newsWithAnalysis.length === 0 ? (
                    <div className={s.emptyState}><div className={s.emptyStateIcon}>🧠</div><div>{txt.noNews}</div><div className={s.emptyStateSub}>{txt.newsAutoAnalyzed}</div></div>
                  ) : (
                    <div className={s.newsCardsGrid}>
                      {newsWithAnalysis.map(n => {
                        const sClass = sentimentClass(n.sentiment);
                        const sColor = sClass === 'bullish' ? 'var(--bull)' : sClass === 'bearish' ? 'var(--bear)' : 'var(--gold)';
                        const sBg = sClass === 'bullish' ? 'var(--bull2)' : sClass === 'bearish' ? 'var(--bear2)' : 'var(--gold2)';
                        const sLabel = sentimentLabel(n.sentiment, locale);
                        const impactColor = /high|عالي/i.test(n.impactLevel) ? 'var(--bear)' : /medium|متوسط/i.test(n.impactLevel) ? 'var(--gold)' : 'var(--bull)';
                        const impactLabel = /high|عالي/i.test(n.impactLevel) ? txt.highImpactLabel : /medium|متوسط/i.test(n.impactLevel) ? txt.mediumImpactLabel : txt.lowImpactLabel;

                        // Parse AI analysis safely
                        let preview = '';
                        try {
                          if (n.aiAnalysis) {
                            const raw = n.aiAnalysis;
                            if (raw.trim().startsWith('{')) {
                              const obj = JSON.parse(raw);
                              preview = obj.summary || obj.recommendation || obj.keyTakeaways?.join(' · ') || '';
                            } else {
                              preview = raw;
                            }
                          }
                        } catch {
                          preview = String(n.aiAnalysis || '').slice(0, 150);
                        }
                        preview = stripMd(preview);
                        if (preview.length > 200) preview = preview.slice(0, 200) + '...';

                        return (
                          <a key={n.id} href={isAr ? `/news/${n.slug || n.id}` : isFr ? `/fr/news/${n.slug || n.id}` : `/en/news/${n.slug || n.id}`} className={s.newsCardLink}>
                            <div className={s.newsCard}>
                              <div className={s.newsCardHeader}>
                                <span className={s.newsCardCategory}>{n.category}</span>
                                <span className={s.newsCardImpact}>
                                  <span className={s.impactDot} style={{ background: impactColor }} />
                                  <span style={{ color: impactColor, fontSize: 10 }}>{impactLabel}</span>
                                </span>
                              </div>
                              <div className={s.newsCardTitle}>{isAr ? (n.titleAr || n.title) : (n.title || n.titleAr)}</div>
                              {preview && (
                                <div className={s.aiBlock}>
                                  <div className={s.aiBlockHeader}>
                                    <span>🧠</span>
                                    <span className={s.aiBlockLabel}>{txt.aiAnalysis}</span>
                                  </div>
                                  <div className={s.aiPreview}>{preview}</div>
                                </div>
                              )}
                              <div className={s.newsCardFooter}>
                                <span className={s.newsCardSentiment} style={{ color: sColor }}>{sLabel}</span>
                                <span className={s.newsCardTime}>{timeAgo(n.publishedAt, locale)}{formatPubTime(n.publishedAt, locale) ? ` · ${formatPubTime(n.publishedAt, locale)}` : ''}</span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ═══════════ ANALYSTS TAB ═══════════ */}
              {activeTab === 'analysts' && (
                <>
                  <div className={s.sectionHeader}>
                    <div className={s.sectionTitleWrap}>
                      <span className={s.sectionIcon}>🤖</span>
                      <span className={s.sectionTitle}>{txt.agentAnalyses}</span>
                      <span className={s.sectionCount}>{contentAnalyses.length}</span>
                      <span className={s.rouaaBadge}>{txt.rouaaPlatform}</span>
                    </div>
                  </div>
                  {contentLoading ? (
                    <div className={s.loadingSpinner}><div className={s.spinnerDot} /><div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} /><div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} /><span>{txt.loadingAnalyses}</span></div>
                  ) : contentAnalyses.length === 0 ? (
                    <div className={s.emptyState}><div className={s.emptyStateIcon}>🤖</div><div>{txt.noAgentAnalyses}</div><div className={s.emptyStateSub}>{txt.agentAutoGenerates}</div></div>
                  ) : (
                    <div className={s.agentCardsList}>
                      {contentAnalyses.map(a => {
                        const sc = sentimentClass(String(a.sentiment));
                        const sColor = sc === 'bullish' ? 'var(--bull)' : sc === 'bearish' ? 'var(--bear)' : 'var(--cyan)';
                        const sBg = sc === 'bullish' ? 'var(--bull2)' : sc === 'bearish' ? 'var(--bear2)' : 'var(--cyan2)';
                        const sLabel = sentimentLabel(String(a.sentiment), locale);
                        const sIcon = sc === 'bullish' ? '▲' : sc === 'bearish' ? '▼' : '◆';
                        const isExpanded = expandedIds.has(a.id);
                        const contentText = stripMd(String(a.content || ''));
                        const isLong = contentText.length > 600;
                        const impColor = a.impactLevel === 'HIGH' ? 'var(--bear)' : a.impactLevel === 'MEDIUM' ? 'var(--gold)' : 'var(--text3)';
                        const impLabel = a.impactLevel === 'HIGH' ? txt.highImpactLabel : a.impactLevel === 'MEDIUM' ? txt.mediumImpactLabel : txt.lowImpactLabel;

                        return (
                          <div key={a.id} className={s.agentCard} style={{ borderInlineStart: `3px solid ${sColor}` }}>
                            <div className={s.agentCardHeader}>
                              <div className={s.agentCardHeaderLeft}>
                                <div className={s.agentCardIcon}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" /><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" /></svg>
                                </div>
                                <div className={s.agentCardTitleGroup}>
                                  <div className={s.agentCardTitle}>{sanitizeStockTitle(a.title, Array.isArray(a.symbols) ? a.symbols : [], a.sentiment, locale)}</div>
                                  <div className={s.agentCardSymbolsRow}>
                                    {(Array.isArray(a.symbols) ? a.symbols : []).slice(0, 4).map((sym, i) => (
                                      <span key={i} className={s.symbolChip}>
                                        {typeof sym === 'string' ? sym.replace('/USDT', '').replace('/USD', '') : sym}
                                      </span>
                                    ))}
                                    {a.category && <span className={s.categoryText}>{a.category}</span>}
                                    {a.publishedAt && <span className={s.categoryText} style={{ opacity: 0.6 }}>⏱ {timeAgo(a.publishedAt, locale)}{formatPubTime(a.publishedAt, locale) ? ` · ${formatPubTime(a.publishedAt, locale)}` : ''}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className={s.agentCardHeaderRight}>
                                <span className={s.sentimentChip} style={{ background: sBg, color: sColor }}>{sIcon} {sLabel}</span>
                                <span className={s.impactLabel} style={{ color: impColor }}>{impLabel}</span>
                              </div>
                            </div>
                            <div className={s.agentCardContent}>
                              {a.summary && <div className={s.summaryText}>{stripMd(a.summary)}</div>}
                              {isLong && !isExpanded ? (
                                <div>
                                  <RichAnalysisContent text={contentText.slice(0, 500)} cssModule={s} />
                                  <button onClick={() => toggleExpand(a.id)} className={s.readMoreBtn}>{txt.readMore}</button>
                                </div>
                              ) : isLong && isExpanded ? (
                                <div>
                                  <RichAnalysisContent text={contentText} cssModule={s} />
                                  <button onClick={() => toggleExpand(a.id)} className={s.readMoreBtn}>{txt.showLess}</button>
                                </div>
                              ) : (
                                <RichAnalysisContent text={contentText} cssModule={s} />
                              )}
                              {Array.isArray(a.tags) && a.tags.length > 0 && (
                                <div className={s.tagsRow}>
                                  {a.tags.slice(0, 5).map((tag, i) => (
                                    <span key={i} className={s.tagChip}>{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className={s.sidebar}>

            {/* Sentiment Panel */}
            <div className={s.card}>
              <div className={s.sentimentHeader}>
                <span className={s.sentimentTitle}>{txt.sentimentTitle}</span>
                <span className={s.sentimentLive}>
                  <span className={s.liveDot} />
                  <span>{txt.live}</span>
                </span>
              </div>
              <div className={s.sentimentBody}>
                {/* Fear & Greed */}
                <div className={s.fearGreedGauge}>
                  <div className={s.gaugeCircle} style={{ background: `conic-gradient(${fgColor} ${fearGreed.value * 3.6}deg, var(--bg4) 0deg)` }}>
                    <div className={s.gaugeInner}>
                      <span className={s.gaugeValue} style={{ color: fgColor }}>{fearGreed.value}</span>
                      <span className={s.gaugeLabel}>{fearGreedLabel(fearGreed.value, locale)}</span>
                    </div>
                  </div>
                  <div className={s.gaugeInfo}>
                    <span className={s.gaugeTitle}>{txt.fearGreed}</span>
                  </div>
                </div>

                {/* Arab Sentiment */}
                {arabSentiment && (() => {
                  const total = newsWithAnalysis.length || 1;
                  const posCount = newsWithAnalysis.filter(n => n.sentiment === 'positive').length;
                  const negCount = newsWithAnalysis.filter(n => n.sentiment === 'negative').length;
                  const neuCount = total - posCount - negCount;
                  return (
                    <div className={s.sentimentBarGroup}>
                      <div className={s.sentimentBarLabel}>{txt.arabSentiment}</div>
                      <div className={s.sentimentBarRow}>
                        <span className={s.sentimentBarName}>{txt.positive}</span>
                        <div className={s.sentimentBarTrack}><div className={s.sentimentBarFill} style={{ width: `${(posCount / total) * 100}%`, background: 'var(--bull)' }} /></div>
                        <span className={s.sentimentBarPct}>{Math.round((posCount / total) * 100)}%</span>
                      </div>
                      <div className={s.sentimentBarRow}>
                        <span className={s.sentimentBarName}>{txt.neutral}</span>
                        <div className={s.sentimentBarTrack}><div className={s.sentimentBarFill} style={{ width: `${(neuCount / total) * 100}%`, background: 'var(--gold)' }} /></div>
                        <span className={s.sentimentBarPct}>{Math.round((neuCount / total) * 100)}%</span>
                      </div>
                      <div className={s.sentimentBarRow}>
                        <span className={s.sentimentBarName}>{txt.negative}</span>
                        <div className={s.sentimentBarTrack}><div className={s.sentimentBarFill} style={{ width: `${(negCount / total) * 100}%`, background: 'var(--bear)' }} /></div>
                        <span className={s.sentimentBarPct}>{Math.round((negCount / total) * 100)}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Geo Risk */}
                {geoRisk && (
                  <div className={s.geoRiskGroup}>
                    <div className={s.geoRiskTitle}>{txt.geoRisk}</div>
                    <div className={s.geoRiskRow}>
                      <span className={s.geoRiskLabel}>{txt.level}</span>
                      <span className={s.geoRiskValue} style={{ color: geoRisk.value >= 70 ? 'var(--bear)' : geoRisk.value >= 40 ? 'var(--gold)' : 'var(--bull)' }}>
                        {geoRiskLabel(geoRisk.value, locale)} · {geoRisk.value}/100
                      </span>
                    </div>
                    {geoRisk.impacts && Object.entries(geoRisk.impacts).slice(0, 3).map(([key, val]: [string, any]) => (
                      <div key={key} className={s.geoRiskRow}>
                        <span className={s.geoRiskLabel}>{geoRiskKeyLabel(key, locale)}</span>
                        <span className={s.geoRiskValue} style={{ color: val.trend === 'up' ? 'var(--bear)' : val.trend === 'down' ? 'var(--bull)' : 'var(--text3)', fontSize: 10 }}>
                          {translateImpactValue(String(val.value), locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Calculator */}
            <div className={s.card}>
              <div className={s.riskPanelHeader}>
                <span className={s.riskPanelIcon}>🛡️</span>
                <div>
                  <div className={s.riskPanelTitle}>{txt.riskCalcTitle}</div>
                  <div className={s.riskPanelSub}>{txt.riskCalcSub}</div>
                </div>
              </div>
              <div className={s.riskFormGrid}>
                <div className={s.riskInputGroup}>
                  <label className={s.riskInputLbl}>{txt.capital}</label>
                  <input type="number" value={capital} onChange={e => setCapital(+e.target.value)} className={s.riskInput} />
                </div>
                <div className={s.riskInputGroup}>
                  <label className={s.riskInputLbl}>{txt.riskPct}</label>
                  <input type="number" value={riskPct} onChange={e => setRiskPct(+e.target.value)} className={s.riskInput} step="0.5" />
                </div>
                <div className={s.riskInputGroup}>
                  <label className={s.riskInputLbl}>{txt.entryPrice}</label>
                  <input type="number" value={entryPrice} onChange={e => setEntryPrice(+e.target.value)} className={s.riskInput} step="0.0001" />
                </div>
                <div className={s.riskInputGroup}>
                  <label className={s.riskInputLbl}>{txt.stopLoss}</label>
                  <input type="number" value={stopLossVal} onChange={e => setStopLossVal(+e.target.value)} className={s.riskInput} step="0.0001" />
                </div>
              </div>
              <div className={s.riskResults}>
                <div className={s.riskResultRow}>
                  <span className={s.riskResultLabel}>{txt.riskAmount}</span>
                  <span className={s.riskResultValue} style={{ color: 'var(--bear)' }}>${riskDollar.toFixed(2)}</span>
                </div>
                <div className={s.riskResultRow}>
                  <span className={s.riskResultLabel}>{txt.lots}</span>
                  <span className={s.riskResultValue}>{lots.toFixed(2)}</span>
                </div>
                <div className={s.riskResultRow}>
                  <span className={s.riskResultLabel}>{txt.positionSize}</span>
                  <span className={s.riskResultValue}>{Math.round(units).toLocaleString()}</span>
                </div>
                <div className={s.riskResultRow}>
                  <span className={s.riskResultLabel}>{txt.rewardRisk}</span>
                  <span className={s.riskResultValue}>{riskDollar > 0 ? `1:${(capital * 0.02 / riskDollar).toFixed(1)}` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Live Prices */}
            <div className={s.card}>
              <div className={s.quotesHeader}>
                <span className={s.quotesHeaderIcon}>💹</span>
                <span className={s.quotesHeaderTitle}>{txt.livePrices}</span>
                <span className={s.liveDot} />
              </div>
              {tradingLoading ? (
                <div className={s.quotesLoading}><span>{txt.loadingPrices}</span></div>
              ) : (
                <div className={s.quotesList}>
                  {tradingQuotes.slice(0, 6).map((q, i) => {
                    const isUp = q.change >= 0;
                    return (
                      <div key={i} className={`${s.quoteRow} ${i < Math.min(tradingQuotes.length, 6) - 1 ? s.quoteRowBorder : ''}`}>
                        <div className={s.quoteLeft}>
                          <span className={s.quoteSymbol} style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                            {q.symbol?.replace('/USDT', '').replace('/USD', '')}
                          </span>
                          <span className={s.quoteName}>{q.name}</span>
                        </div>
                        <div className={s.quoteRight}>
                          <span className={s.quotePrice}>{q.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span className={s.quoteChange} style={{ color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                            {isUp ? '▲' : '▼'} {Math.abs(q.changePercent)?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shared Widgets */}
            <SmartCouncilWidget locale={locale} />
            <MostReadWidget locale={locale} />
            <EconomicCalendarWidget locale={locale} />


          </div>
        </div>
      </div>

      {/* Back to top */}
      {showBackTop && (
        <button className={s.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
      )}
    </main>
  );
}
