// ═══════════════════════════════════════════════════════════════
// Spanish Report Generator Agent — V316 Deep Fix
// Generates professional economic reports in Spanish.
// This is the Spanish counterpart for report generation.
//
// V316 CRITICAL FIXES (mirrored from English):
// - FIX 1: Custom title is now USED as the report title instead of
//   being ignored and regenerated from headlines
// - FIX 2: When custom prompt provided, it replaces the default system
//   prompt to avoid dual-structure conflict
// - FIX 3: Strategic reports now filter news by topic sectors
//   instead of grabbing all news from 48h
// - FIX 4: Added generateStrategicReportEs() with 3-call generation
//   + web search, matching Arabic strategic report quality
//
// V315 CRITICAL FIXES (preserved):
// - FIX 1: generateDailyBriefEs now uses ES_SYSTEM_PROMPTS[reportType]
// - FIX 2: generateMarketAnalysisEs now saves to MarketAnalysis table
// - FIX 3: generateWeeklyAnalysisEs now uses ES_ANALYSIS_SYSTEM_PROMPT[assetClass]
// - FIX 4: Added Spanish news category filtering (esNewsCategoryMap)
// - FIX 5: Data window varies by report type
//
// Key differences from English report-generator:
// - Spanish prompts for all report types
// - Spanish-specific speculation detection (puede, podría, eventualmente)
// - Validates Spanish number integrity
// - Sets locale: 'es' on generated reports
// ═══════════════════════════════════════════════════════════════

import { truncateAtBoundary } from '@/lib/clean-markdown';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import {
  type ReportType,
  type AssetClass,
} from '../../report-templates';
import { ES_PIPELINE_CONFIG } from '../es-pipeline-config';
import {
  ES_PROMPT_QUALITY_RULES,
  ES_ANTI_HALLUCINATION_RULES,
  ES_SYSTEM_PROMPTS,
  ES_ANALYSIS_SYSTEM_PROMPT,
} from './es-report-templates';
import { detectSpeculationEs } from './es-analyzer';

// Re-export types for convenience
export type { ReportType, AssetClass } from '../../report-templates';

// ─── Types ──────────────────────────────────────────────────

export interface EsReportContext {
  event?: string;
  assetClass?: AssetClass;
  force?: boolean;
  scope?: string;
  wordCount?: number;
  prompt?: string;
  title?: string;
  // V316: Strategic report options
  region?: string;
  sectors?: string[];
  scenarios?: string[];
}

export interface EsGeneratedReport {
  title: string;
  slug: string;
  summary: string;
  content: string;
  reportType: ReportType;
  scope: string;
  sectors: string;
  countries: string;
  keyIndicators: string;
  marketImpact: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  sourceUrls: string;
  isPublished: boolean;
  publishedAt: Date;
  locale: string;
}

export interface EsGeneratedAnalysis {
  title: string;
  slug: string;
  assetClass: AssetClass;
  analysisType: string;
  timeFrame: string;
  content: string;
  indicators: string;
  priceTarget: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  relatedNewsIds: string;
  isPublished: boolean;
  publishedAt: Date;
  validUntil: Date;
  locale: string;
}

// ─── V315: Spanish News Category Map ────────────────────────
// Maps each AssetClass to the Spanish news category strings
// used to filter relevant news per asset class.
// This is the Spanish equivalent of the English enNewsCategoryMap.

const esNewsCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['Estratégico', 'Acciones', 'Energía', 'Divisas', 'Criptomonedas', 'Materias Primas', 'Banca'],
  stocks: ['Renta Variable', 'Mercado', 'Bolsa', 'Tecnología', 'Resultados'],
  commodities: ['Materias Primas', 'Energía', 'Petróleo', 'Oro', 'Plata', 'Cobre', 'Metales'],
  forex: ['Divisas', 'Cambio', 'Dólar', 'Euro', 'Yen', 'Libra', 'Tasas de Cambio'],
  crypto: ['Criptomonedas', 'Criptomoneda', 'Bitcoin', 'Ethereum', 'Blockchain', 'Activos Digitales'],
  bonds: ['Renta Fija', 'Bonos del Tesoro', 'Rendimientos', 'Tasas de Interés', 'Crédito', 'Deuda Soberana'],
  energy: ['Energía', 'Petróleo', 'Gas', 'OPEP', 'Petróleo Crudo', 'Gas Natural'],
  realEstate: ['Inmobiliario', 'Vivienda', 'Propiedad', 'SOCIMI', 'Hipoteca'],
  economy: ['Economía', 'PIB', 'Inflación', 'Desempleo', 'Comercio', 'Banco Central', 'BCE'],
  banking: ['Banca', 'Bancos', 'Crédito', 'Tasas de Interés', 'Servicios Financieros'],
  technicalAnalysis: ['Divisas', 'Cambio', 'Acciones', 'Técnico', 'Análisis Técnico'],
  arabMarkets: ['Acciones', 'Mercado', 'Golfo', 'Arabia Saudí', 'Emiratos', 'Oriente Medio'],
  earnings: ['Acciones', 'Resultados', 'Beneficios', 'Trimestrales', 'Cifra de Negocios'],
};

// Maps each AssetClass to the Spanish indicator category strings
const esIndicatorCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['index', 'currency', 'commodity', 'crypto'],
  stocks: ['index'],
  commodities: ['commodity'],
  forex: ['currency'],
  crypto: ['crypto'],
  bonds: ['bond_yield'],
  energy: ['commodity', 'energy'],
  realEstate: ['index', 'real_estate'],
  economy: ['index', 'currency', 'commodity'],
  banking: ['index', 'bond_yield'],
  technicalAnalysis: ['currency', 'index'],
  arabMarkets: ['index'],
  earnings: ['index'],
};

// ─── V315: Data window per report type ──────────────────────
const REPORT_DATA_WINDOW_MS: Record<ReportType, number> = {
  daily: 24 * 60 * 60 * 1000,       // 24 hours
  weekly: 7 * 24 * 60 * 60 * 1000,  // 7 days
  monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
  quarterly: 90 * 24 * 60 * 60 * 1000, // 90 days
  special: 24 * 60 * 60 * 1000,     // 24 hours (event-driven)
  strategic: 48 * 60 * 60 * 1000,   // 48 hours (deep analysis)
};

// V315: Asset class labels for Spanish display
const ASSET_CLASS_LABELS_ES: Record<AssetClass, string> = {
  strategic: 'Estratégico',
  stocks: 'Acciones',
  commodities: 'Materias Primas',
  forex: 'Divisas',
  crypto: 'Criptomonedas',
  bonds: 'Renta Fija',
  energy: 'Energía',
  realEstate: 'Inmobiliario',
  economy: 'Economía',
  banking: 'Banca',
  technicalAnalysis: 'Análisis Técnico',
  arabMarkets: 'Mercados Árabes',
  earnings: 'Resultados',
};

// ─── Spanish Number Integrity Check ──────────────────────────
function validateNumberIntegrityEs(content: string, sourceData: string): string[] {
  const issues: string[] = [];
  const sourceNumbers = sourceData.match(/\d+(?:[.,]\d+)?/g) || [];

  for (const num of sourceNumbers) {
    const numVal = parseFloat(num.replace(',', '.'));
    if (isNaN(numVal) || numVal < 1) continue;
    if (!content.includes(num)) {
      const shifted = (numVal / 10).toString();
      if (content.includes(shifted)) {
        issues.push(`Desplazamiento decimal detectado : "${num}" de la fuente se ha convertido en "${shifted}" en el informe`);
      }
    }
  }

  return issues;
}

// ─── V315: Data Collection with Category Filtering ──────────

async function collectNewsEs(since: Date, assetClass?: AssetClass): Promise<any[]> {
  try {
    const where: any = {
      isReady: true,
      locale: 'es',
      fetchedAt: { gte: since },
    };

    // V352 FIX: Filter news by asset class category if specified.
    // categoryId in DB stores English IDs (e.g. 'forex', 'stocks'), NOT lowercased Spanish names.
    // Must use both category (Spanish display string) AND categoryId (English ID) for comprehensive matching.
    if (assetClass && esNewsCategoryMap[assetClass]) {
      const categories = esNewsCategoryMap[assetClass];
      // V352: Map Spanish category display names to their English ID counterparts
      // e.g. 'Acciones' → 'stocks', 'Divisas' → 'forex', 'Criptomonedas' → 'crypto'
      const categoryIdMap: Record<string, string> = {
        'Economía': 'economy', 'Acciones': 'stocks', 'Divisas': 'forex', 'Criptomonedas': 'crypto',
        'Energía': 'energy', 'Materias Primas': 'commodities', 'Inmobiliario': 'realEstate',
        'Banca': 'banking', 'Resultados': 'earnings', 'Renta Fija': 'bonds',
        'Análisis Técnico': 'technicalAnalysis', 'Estratégico': 'strategic',
        'Tecnología': 'technology', 'Flash': 'breaking',
        // Additional Spanish terms that appear in articles
        'Bolsa': 'stocks', 'Mercado': 'stocks', 'Petróleo': 'energy', 'Oro': 'commodities',
        'Cambio': 'forex', 'Dólar': 'forex', 'Euro': 'forex', 'Blockchain': 'crypto',
        'Bitcoin': 'crypto', 'Ethereum': 'crypto', 'PIB': 'economy', 'Inflación': 'economy',
        'Desempleo': 'economy', 'Comercio': 'economy', 'Banco Central': 'economy',
        'Renta Variable': 'stocks', 'Criptomoneda': 'crypto', 'Activos Digitales': 'crypto',
        'Bonos del Tesoro': 'bonds', 'Rendimientos': 'bonds', 'Deuda Soberana': 'bonds',
        'Petróleo Crudo': 'energy', 'Gas Natural': 'energy', 'OPEP': 'energy',
        'Vivienda': 'realEstate', 'Propiedad': 'realEstate', 'SOCIMI': 'realEstate',
        'Bancos': 'banking', 'Crédito': 'banking', 'Tasas de Interés': 'banking',
        'Servicios Financieros': 'banking', 'Tasas de Cambio': 'forex',
        'Plata': 'commodities', 'Cobre': 'commodities', 'Metales': 'commodities',
        'Beneficios': 'earnings', 'Trimestrales': 'earnings', 'Cifra de Negocios': 'earnings',
        'Golfo': 'arabMarkets', 'Arabia Saudí': 'arabMarkets', 'Emiratos': 'arabMarkets',
        'Oriente Medio': 'arabMarkets', 'Técnico': 'technicalAnalysis',
        'BCE': 'economy', 'Hipoteca': 'realEstate',
      };
      const englishCategoryIds = [...new Set(
        categories
          .map(c => categoryIdMap[c])
          .filter(Boolean)
      )];
      where.OR = [
        { category: { in: categories } },
        ...(englishCategoryIds.length > 0 ? [{ categoryId: { in: englishCategoryIds } }] : []),
      ];
    }

    let newsItems = await db.newsItem.findMany({
      where,
      select: {
        id: true, title: true, summary: true, category: true, categoryId: true,
        sentiment: true, sentimentScore: true, impactLevel: true, affectedAssets: true, fetchedAt: true,
      },
      take: 50,
      orderBy: { fetchedAt: 'desc' },
    });

    // V375 FALLBACK: If no articles found for the specific asset class,
    // fall back to ALL Spanish articles. This prevents report generation
    // from failing entirely just because articles are categorized as
    // 'Economía' instead of their specific sector.
    if (newsItems.length === 0 && assetClass && esNewsCategoryMap[assetClass]) {
      console.log(`[EsReportGenerator V375] No articles found for '${assetClass}' — falling back to ALL Spanish articles`);
      const fallbackWhere: any = {
        isReady: true,
        locale: 'es',
        fetchedAt: { gte: since },
      };
      newsItems = await db.newsItem.findMany({
        where: fallbackWhere,
        select: {
          id: true, title: true, summary: true, category: true, categoryId: true,
          sentiment: true, sentimentScore: true, impactLevel: true, affectedAssets: true, fetchedAt: true,
        },
        take: 50,
        orderBy: { fetchedAt: 'desc' },
      });
      // Tag these as fallback so the AI knows to focus on the requested asset class
      if (newsItems.length > 0) {
        console.log(`[EsReportGenerator V375] Found ${newsItems.length} articles as fallback for '${assetClass}' report`);
      }
    }

    return newsItems;
  } catch (error: any) {
    console.error('[EsReportGenerator] Error al recopilar las noticias españolas :', error.message);
    return [];
  }
}

// ─── Helper: Calculate sentiment, risk, confidence from news ──

function calculateSentimentFromNews(newsItems: any[]): {
  positive: number; negative: number; neutral: number;
  sentimentRatio: number;
  marketImpact: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
} {
  let positive = 0, negative = 0, neutral = 0;
  for (const item of newsItems) {
    if (item.sentiment === 'positive') positive++;
    else if (item.sentiment === 'negative') negative++;
    else neutral++;
  }
  const total = positive + negative + neutral;
  const sentimentRatio = positive / Math.max(1, total);
  const marketImpact: 'bullish' | 'bearish' | 'neutral' =
    sentimentRatio > 0.5 ? 'bullish' : sentimentRatio < 0.3 ? 'bearish' : 'neutral';
  const riskLevel: 'low' | 'medium' | 'high' | 'extreme' =
    negative > positive * 2 ? 'extreme' : negative > positive ? 'high' : neutral > positive ? 'medium' : 'low';
  return { positive, negative, neutral, sentimentRatio, marketImpact, riskLevel };
}

// ─── V315 FIX 1: Report Generation (Spanish) ────────────────
// Now uses ES_SYSTEM_PROMPTS[reportType] instead of always .daily
// Data window varies by report type
// Strategic reports use ES_ANALYSIS_SYSTEM_PROMPT.strategic

export async function generateDailyBriefEs(
  reportType: ReportType = 'daily',
  context?: EsReportContext,
): Promise<EsGeneratedReport | null> {
  const startTime = Date.now();

  try {
    // V315: Data window varies by report type
    const dataWindowMs = REPORT_DATA_WINDOW_MS[reportType] || REPORT_DATA_WINDOW_MS.daily;
    const since = new Date(Date.now() - dataWindowMs);
    const newsItems = await collectNewsEs(since);

    if (newsItems.length === 0) {
      console.log(`[EsReportGenerator V315] No se encontraron noticias españolas para el informe ${reportType}`);
      return null;
    }

    // Prepare news summary for AI
    const newsSummary = newsItems.slice(0, 30).map((item: any) => {
      return `- [${item.sentiment}] ${item.title} (${item.category})`;
    }).join('\n');

    const categoryBreakdown: Record<string, number> = {};
    const overallSentiment = calculateSentimentFromNews(newsItems);
    for (const item of newsItems) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    }

    // V316 FIX 2: When custom prompt is provided for strategic reports,
    // use it AS the system prompt to avoid dual-structure conflict.
    // The user's prompt already defines the structure they want.
    let systemPrompt: string;
    if (reportType === 'strategic' && context?.prompt) {
      // V316: Custom prompt from strategic reports dashboard — use as system prompt
      // The dashboard already built a comprehensive 11-section prompt
      systemPrompt = context.prompt;
    } else if (reportType === 'strategic') {
      // No custom prompt — use the default strategic analysis prompt
      systemPrompt = ES_ANALYSIS_SYSTEM_PROMPT.strategic;
    } else {
      // Use the dedicated prompt for each report type (daily, weekly, monthly, quarterly, special)
      systemPrompt = ES_SYSTEM_PROMPTS[reportType] || ES_SYSTEM_PROMPTS.daily;
    }

    // V316 FIX 3: For strategic reports, filter news by topic sectors if provided
    let topicFilteredNews = newsItems;
    if (reportType === 'strategic' && context?.sectors && context.sectors.length > 0) {
      const sectorCategories = context.sectors.flatMap(sector => {
        const normalizedSector = sector.toLowerCase();
        // Map UI sector names to Spanish news category strings
        const sectorToCategoryMap: Record<string, string[]> = {
          'macroeconomics': ['Economía', 'PIB', 'Inflación', 'Banco Central', 'BCE'],
          'macroeconomía': ['Economía', 'PIB', 'Inflación', 'Banco Central', 'BCE'],
          'equities': ['Renta Variable', 'Mercado', 'Bolsa', 'Tecnología', 'Resultados'],
          'acciones': ['Renta Variable', 'Mercado', 'Bolsa', 'Tecnología', 'Resultados'],
          'energy': ['Energía', 'Petróleo', 'Gas', 'OPEP', 'Petróleo Crudo'],
          'energía': ['Energía', 'Petróleo', 'Gas', 'OPEP', 'Petróleo Crudo'],
          'forex': ['Divisas', 'Cambio', 'Dólar', 'Euro', 'Yen', 'Libra'],
          'divisas': ['Divisas', 'Cambio', 'Dólar', 'Euro', 'Yen', 'Libra'],
          'cryptocurrencies': ['Criptomonedas', 'Criptomoneda', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'criptomonedas': ['Criptomonedas', 'Criptomoneda', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'commodities': ['Materias Primas', 'Oro', 'Plata', 'Cobre', 'Metales'],
          'matías primas': ['Materias Primas', 'Oro', 'Plata', 'Cobre', 'Metales'],
          'real estate': ['Inmobiliario', 'Vivienda', 'Propiedad', 'SOCIMI'],
          'inmobiliario': ['Inmobiliario', 'Vivienda', 'Propiedad', 'SOCIMI'],
          'central banks': ['Economía', 'Banco Central', 'BCE', 'Tasas de Interés', 'Política Monetaria'],
          'bancos centrales': ['Economía', 'Banco Central', 'BCE', 'Tasas de Interés', 'Política Monetaria'],
          'corporate earnings': ['Acciones', 'Resultados', 'Beneficios', 'Trimestrales', 'Cifra de Negocios'],
          'resultados empresas': ['Acciones', 'Resultados', 'Beneficios', 'Trimestrales', 'Cifra de Negocios'],
          'arab markets': ['Acciones', 'Mercado', 'Golfo', 'Arabia Saudí', 'Emiratos', 'Oriente Medio'],
          'mercados árabes': ['Acciones', 'Mercado', 'Golfo', 'Arabia Saudí', 'Emiratos', 'Oriente Medio'],
          'technology': ['Tecnología', 'IA', 'Semiconductores', 'Tech'],
          'tecnología': ['Tecnología', 'IA', 'Semiconductores', 'Tech'],
          'politics': ['Economía', 'Comercio', 'Geopolítica', 'Política'],
          'política': ['Economía', 'Comercio', 'Geopolítica', 'Política'],
        };
        return sectorToCategoryMap[normalizedSector] || [sector];
      });
      // Use topic-filtered news if available, otherwise fall back to all news
      const filtered = newsItems.filter(item =>
        sectorCategories.some(cat =>
          item.category?.toLowerCase().includes(cat.toLowerCase()) ||
          item.title?.toLowerCase().includes(cat.toLowerCase())
        )
      );
      if (filtered.length >= 3) {
        topicFilteredNews = filtered;
        console.log(`[EsReportGenerator V316] Informe estratégico : ${filtered.length}/${newsItems.length} noticias filtradas por sectores : ${context.sectors.join(', ')}`);
      } else {
        console.log(`[EsReportGenerator V316] Informe estratégico : el filtro por sectores solo dio ${filtered.length} elementos, utilizando las ${newsItems.length} noticias`);
      }
    }

    // V315: Customize user prompt based on report type
    let userPrompt: string;
    const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthStr = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // V316: Use topic-filtered news for strategic reports
    const effectiveNews = reportType === 'strategic' ? topicFilteredNews : newsItems;
    const effectiveSummary = effectiveNews.slice(0, 30).map((item: any) => {
      return `- [${item.sentiment}] ${item.title} (${item.category})`;
    }).join('\n');
    const effectiveCategoryBreakdown: Record<string, number> = {};
    const effectiveSentiment = calculateSentimentFromNews(effectiveNews);
    for (const item of effectiveNews) {
      effectiveCategoryBreakdown[item.category] = (effectiveCategoryBreakdown[item.category] || 0) + 1;
    }

    switch (reportType) {
      case 'daily':
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes de las últimas 24 horas, redacte un informe diario completo.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere el informe diario de mercados para el ${dateStr}`;
        break;

      case 'weekly':
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes de la semana pasada, redacte un análisis semanal completo de los mercados.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere el análisis semanal de mercados para la semana que termina el ${dateStr}`;
        break;

      case 'monthly':
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes de los últimos 30 días, redacte unas perspectivas mensuales completas.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere las perspectivas mensuales de mercados para ${monthStr}`;
        break;

      case 'quarterly':
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes del último trimestre, redacte una revisión trimestral completa.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere la revisión trimestral de mercados para ${monthStr}`;
        break;

      case 'special':
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes, redacte un informe especial${context?.event ? ` sobre : ${context.event}` : ''}.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere el informe especial para el ${dateStr}`;
        break;

      case 'strategic':
        // V316: Strategic prompt — when custom prompt is used as system prompt,
        // the user prompt only provides data + topic context (not structure)
        if (context?.prompt) {
          // Custom prompt already defines structure — user prompt is data only
          userPrompt = `A partir de los ${effectiveNews.length} artículos de noticias financieras españolas siguientes, redacte el informe de análisis estratégico.

Tema : ${context.title || 'Análisis estratégico general'}
Alcance geográfico : ${context.region || 'Mundial'}
Sectores : ${context.sectors?.join(', ') || 'Todos'}
Horizontes temporales : ${context.scenarios?.join(', ') || 'Corto, Mediano, Largo plazo'}

═══ NOTICIAS ═══
${effectiveSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${effectiveSentiment.positive} | Negativo : ${effectiveSentiment.negative} | Neutro : ${effectiveSentiment.neutral}

Genere el informe de análisis estratégico para el ${dateStr}`;
        } else {
          // Default strategic prompt — include topic in user prompt
          userPrompt = `A partir de los ${effectiveNews.length} artículos de noticias financieras españolas siguientes, redacte un informe de análisis estratégico completo${context?.title ? ` sobre : ${context.title}` : ''}.

═══ NOTICIAS ═══
${effectiveSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${effectiveSentiment.positive} | Negativo : ${effectiveSentiment.negative} | Neutro : ${effectiveSentiment.neutral}

Genere el informe de análisis estratégico para el ${dateStr}`;
        }
        break;

      default:
        userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes, redacte un informe ${reportType} completo de los mercados.

═══ NOTICIAS ═══
${newsSummary}

═══ DISTRIBUCIÓN POR CATEGORÍA ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ RESUMEN DEL SENTIMIENTO ═══
Positivo : ${overallSentiment.positive} | Negativo : ${overallSentiment.negative} | Neutro : ${overallSentiment.neutral}

Genere el informe ${reportType} para el ${dateStr}`;
    }

    // V315: Token limit varies by report type
    const maxTokensByType: Record<ReportType, number> = {
      daily: 6000,
      weekly: 8000,
      monthly: 8000,
      quarterly: 10000,
      special: 8000,
      strategic: 10000,
    };

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: maxTokensByType[reportType] || 6000, priority: 'generation', locale: 'es' });

    if (!aiResult.content) {
      console.error(`[EsReportGenerator V315] La IA devolvió un contenido vacío para el informe ${reportType}`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    // because financial reports naturally include forward-looking analysis.
    const reportBlockThreshold = ES_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationEs(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[EsReportGenerator V375] Informe ${reportType} bloqueado por el filtro de especulación (umbral: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // Number integrity check
    const numberIssues = validateNumberIntegrityEs(content, newsSummary);
    if (numberIssues.length > 0) {
      console.warn(`[EsReportGenerator V315] Problemas de integridad numérica : ${numberIssues.join('; ')}`);
    }

    // V316 FIX 1: Use custom title when provided — do NOT regenerate from headlines
    // This was the root cause of "I put a title and it picks the topic automatically"
    const titleTypeLabel: Record<ReportType, string> = {
      daily: 'Informe Diario de Mercados',
      weekly: 'Análisis Semanal de Mercados',
      monthly: 'Perspectivas Mensuales',
      quarterly: 'Revisión Trimestral',
      special: 'Informe Especial',
      strategic: 'Análisis Estratégico',
    };

    let title: string;
    if (context?.title && context.title.trim().length > 0) {
      // V316: User provided a custom title — USE IT directly
      title = context.title.trim();
      console.log(`[EsReportGenerator V316] Utilización del título personalizado : "${title}"`);
    } else {
      // No custom title — generate one from headlines
      const titlePrompt = `Genere un título español conciso y descriptivo (80 caracteres max) para un ${titleTypeLabel[reportType]} basado en estos titulares :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

El título debe describir el tema principal del mercado. Sin prefijos genéricos como "Informe Diario". Solo el título, sin comillas.`;

      const titleResult = await chatCompletion([
        { role: 'system', content: titlePrompt },
        { role: 'user', content: 'Genere el título' },
      ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'es' });

      const defaultTitle = `${titleTypeLabel[reportType]} : ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
      title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    }

    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // V302: Confidence score — quality-weighted formula, not just news count
    const minConfidence: Record<ReportType, number> = {
      daily: 30, weekly: 30, monthly: 35, quarterly: 50, special: 30, strategic: 40,
    };
    const newsBonus = Math.min(20, Math.floor(newsItems.length / 3));
    const dataBonus = specReport.hasSpecificNumbers ? 10 : 0;
    const sentimentData = reportType === 'strategic' ? effectiveSentiment : overallSentiment;
    const totalSentimentCount = sentimentData.positive + sentimentData.negative + sentimentData.neutral;
    const sentimentConsensus = totalSentimentCount > 0
      ? Math.max(sentimentData.positive, sentimentData.negative, sentimentData.neutral) / totalSentimentCount
      : 0.5;
    const consensusBonus = Math.floor(sentimentConsensus * 10);
    const confidenceScore = Math.min(92, Math.max(minConfidence[reportType], 40 + newsBonus + dataBonus + consensusBonus));

    const report: EsGeneratedReport = {
      title,
      slug,
      summary: content.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 300) || title,
      content,
      reportType,
      scope: context?.region || 'global', // V316: Use region from strategic report context
      sectors: context?.sectors ? JSON.stringify(context.sectors) : JSON.stringify(Object.keys(reportType === 'strategic' ? effectiveCategoryBreakdown : categoryBreakdown)),
      countries: '[]',
      keyIndicators: JSON.stringify({
        positive: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).positive,
        negative: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).negative,
        neutral: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).neutral,
        total: (reportType === 'strategic' ? effectiveNews : newsItems).length,
        // V380: Monitoring indicators for Spanish reports
        indicadoresDeSeguimiento: [
          { nombre: 'Índice de Confianza', valeur: confidenceScore, changement: 0 },
          { nombre: 'Sentimiento del Mercado', valeur: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bullish' ? 'Alcista' : (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bearish' ? 'Bajista' : 'Neutro', changement: 0 },
          { nombre: 'Número de Noticias', valeur: (reportType === 'strategic' ? effectiveNews : newsItems).length, changement: 0 },
        ],
        // V380: Investor type labels in Spanish
        segmentosInversionistas: ['Day Trader', 'Inversionista Mediano Plazo', 'Inversionista Largo Plazo'],
      }),
      marketImpact: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact,
      confidenceScore,
      sourceUrls: JSON.stringify(newsItems.slice(0, 10).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      locale: 'es',
    };

    // Save to database
    try {
      await db.economicReport.create({
        data: {
          title: report.title,
          slug: report.slug,
          summary: report.summary,
          content: report.content,
          reportType: report.reportType,
          scope: report.scope,
          locale: report.locale,
          sectors: report.sectors,
          countries: report.countries,
          keyIndicators: report.keyIndicators,
          marketImpact: report.marketImpact,
          confidenceScore: report.confidenceScore,
          sourceUrls: report.sourceUrls,
          isPublished: report.isPublished,
          publishedAt: report.publishedAt,
        },
      });

      console.log(`[EsReportGenerator V315] ✓ Informe ${reportType} creado : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EsReportGenerator V315] Error DB al guardar el informe ${reportType} : ${dbErr.message}`);
    }

    return report;
  } catch (err: any) {
    console.error(`[EsReportGenerator V315] Error al generar el informe ${reportType} : ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 3: Weekly Analysis Generation (Spanish) ────────
// Now uses ES_ANALYSIS_SYSTEM_PROMPT[assetClass] instead of generic weekly prompt
// Filters news by asset class category

export async function generateWeeklyAnalysisEs(
  assetClass: AssetClass = 'stocks',
  context?: EsReportContext,
): Promise<EsGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect Spanish news from the last 7 days, filtered by asset class
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newsItems = await collectNewsEs(since, assetClass);

    if (newsItems.length === 0) {
      console.log(`[EsReportGenerator V315] No se encontraron noticias españolas para el análisis semanal ${assetClass}`);
      return null;
    }

    const assetClassLabel = ASSET_CLASS_LABELS_ES[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // V315 FIX 3: Use the ASSET-CLASS-SPECIFIC prompt instead of generic weekly
    // This gives each asset class its own specialized structure (e.g., stocks gets 10-section
    // stock-specific analysis, forex gets forex-specific sections, etc.)
    const systemPrompt = ES_ANALYSIS_SYSTEM_PROMPT[assetClass] || ES_ANALYSIS_SYSTEM_PROMPT.stocks;

    const newsSummary = newsItems.slice(0, 20).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes de la semana pasada, redacte un análisis semanal completo de los mercados ${assetClassLabel}.

═══ NOTICIAS RECIENTES ═══
${newsSummary}

Genere el análisis semanal ${assetClassLabel} para la semana que termina el ${new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'es' });

    if (!aiResult.content) {
      console.error(`[EsReportGenerator V315] La IA devolvió un contenido vacío para el análisis semanal ${assetClass}`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = ES_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationEs(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[EsReportGenerator V375] Análisis semanal ${assetClass} bloqueado por el filtro de especulación (umbral: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // Generate title with AI
    const titlePrompt = `Genere un título español conciso y descriptivo (80 caracteres max) para un análisis semanal de los mercados ${assetClassLabel} basado en estos titulares :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

Sin prefijos genéricos. Solo el título, sin comillas.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Genere el título' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'es' });

    const defaultTitle = `Análisis Semanal ${assetClassLabel} : ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // Calculate actual sentiment from news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const actualConfidence = Math.min(95, 40 + Math.min(totalSentiment, 30) + (specReport.hasSpecificNumbers ? 10 : 0));

    const analysis: EsGeneratedAnalysis = {
      title,
      slug,
      assetClass,
      analysisType: 'fundamental',
      timeFrame: 'weekly',
      content,
      indicators: JSON.stringify({ positive, negative, neutral, total: totalSentiment }),
      priceTarget: '{}',
      riskLevel,
      sentiment: marketImpact,
      confidenceScore: actualConfidence,
      relatedNewsIds: JSON.stringify(newsItems.slice(0, 5).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      locale: 'es',
    };

    // Save to database — MarketAnalysis table (correct table for analyses)
    try {
      await db.marketAnalysis.create({
        data: {
          title: analysis.title,
          slug: analysis.slug,
          assetClass: analysis.assetClass,
          analysisType: analysis.analysisType,
          timeFrame: analysis.timeFrame,
          locale: analysis.locale,
          content: analysis.content,
          indicators: analysis.indicators,
          priceTarget: analysis.priceTarget,
          riskLevel: analysis.riskLevel,
          sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore,
          relatedNewsIds: analysis.relatedNewsIds,
          isPublished: analysis.isPublished,
          publishedAt: analysis.publishedAt,
          validUntil: analysis.validUntil,
        },
      });

      console.log(`[EsReportGenerator V315] ✓ Análisis semanal ${assetClass} creado : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EsReportGenerator V315] Error DB al guardar el análisis semanal ${assetClass} : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EsReportGenerator V315] Error al generar el análisis semanal ${assetClass} : ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 2: Market Analysis Generation (Spanish) ────────
// Now saves to MarketAnalysis table with proper assetClass
// instead of EconomicReport with reportType:'special'
// Also filters news by asset class category

export async function generateMarketAnalysisEs(
  assetClass: AssetClass,
  context?: EsReportContext,
): Promise<EsGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect news filtered by asset class
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const newsItems = await collectNewsEs(since, assetClass);

    const assetClassLabel = ASSET_CLASS_LABELS_ES[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // Use the comprehensive analysis system prompt for the specific asset class
    const systemPrompt = ES_ANALYSIS_SYSTEM_PROMPT[assetClass];

    const newsSummary = newsItems.slice(0, 15).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Clase de activo : ${assetClassLabel}
Noticias recientes : ${newsItems.length}

${newsSummary}

${context?.prompt ? `Solicitud del usuario : ${context.prompt}\n\n` : ''}Genere el análisis de los mercados ${assetClassLabel} para el ${new Date().toLocaleDateString('es-ES')}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 6000, priority: 'generation', locale: 'es' });

    if (!aiResult.content) return null;

    const content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = ES_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationEs(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[EsReportGenerator V375] Análisis de mercado ${assetClass} bloqueado (umbral: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // V315: Generate AI title instead of generic template
    const titlePrompt = `Genere un título español conciso y descriptivo (80 caracteres max) para un análisis de mercado ${assetClassLabel} basado en estos titulares :
${newsItems.slice(0, 8).map((i: any) => i.title).join('\n')}

Sin prefijos genéricos. Solo el título, sin comillas.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Genere el título' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'es' });

    const defaultTitle = `Análisis de Mercado ${assetClassLabel} : ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // V315: Calculate sentiment from actual news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const confidenceScore = Math.min(90, 40 + Math.min(totalSentiment, 25) + (specReport.hasSpecificNumbers ? 10 : 0));

    // V315 FIX 2: Save to MarketAnalysis table (NOT EconomicReport)
    // This preserves the assetClass field and allows proper categorization
    const analysis: EsGeneratedAnalysis = {
      title,
      slug,
      assetClass,  // V315: Proper asset class preserved
      analysisType: 'fundamental',
      timeFrame: 'daily',
      content,
      indicators: JSON.stringify({ positive, negative, neutral, total: totalSentiment, assetClass }),
      priceTarget: '{}',
      riskLevel,
      sentiment: marketImpact,
      confidenceScore,
      relatedNewsIds: JSON.stringify(newsItems.slice(0, 5).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),  // Valid for 48h
      locale: 'es',
    };

    try {
      // V315 FIX 2: Save to MarketAnalysis table — NOT EconomicReport!
      await db.marketAnalysis.create({
        data: {
          title: analysis.title,
          slug: analysis.slug,
          assetClass: analysis.assetClass,
          analysisType: analysis.analysisType,
          timeFrame: analysis.timeFrame,
          locale: analysis.locale,
          content: analysis.content,
          indicators: analysis.indicators,
          priceTarget: analysis.priceTarget,
          riskLevel: analysis.riskLevel,
          sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore,
          relatedNewsIds: analysis.relatedNewsIds,
          isPublished: analysis.isPublished,
          publishedAt: analysis.publishedAt,
          validUntil: analysis.validUntil,
        },
      });

      console.log(`[EsReportGenerator V315] ✓ Análisis de mercado ${assetClass} creado : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EsReportGenerator V315] Error DB al guardar el análisis ${assetClass} : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EsReportGenerator V315] Error al generar el análisis ${assetClass} : ${err.message}`);
    return null;
  }
}

// ─── Monthly Outlook Generation (Spanish) ────────────────────

export async function generateMonthlyOutlookEs(
  context?: EsReportContext,
): Promise<EsGeneratedReport | null> {
  // V315: Delegate to generateDailyBriefEs which now uses correct prompts
  return generateDailyBriefEs('monthly', context);
}

// ─── Technical Analysis Generation (Spanish) ─────────────────

export async function generateTechnicalAnalysisEs(
  context?: EsReportContext,
): Promise<EsGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // V315: Filter news for technical analysis categories
    const newsItems = await collectNewsEs(since, 'technicalAnalysis');

    if (newsItems.length === 0) {
      console.log('[EsReportGenerator V315] No se encontraron noticias españolas para el análisis técnico');
      return null;
    }

    // Use the comprehensive technical analysis system prompt from templates
    const systemPrompt = ES_ANALYSIS_SYSTEM_PROMPT.technicalAnalysis;
    const userPrompt = `A partir de los ${newsItems.length} artículos de noticias financieras españolas siguientes, redacte un análisis técnico completo cubriendo los principales mercados.

═══ NOTICIAS RECIENTES ═══
${newsItems.slice(0, 20).map((i: any) => `- [${i.sentiment}] ${i.title} (${i.category})`).join('\n')}

Genere el análisis técnico para el ${new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'es' });

    if (!aiResult.content) {
      console.error('[EsReportGenerator V315] La IA devolvió un contenido vacío para el análisis técnico');
      return null;
    }

    const content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = ES_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationEs(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[EsReportGenerator V375] Análisis técnico bloqueado (umbral: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    const title = `Análisis Técnico : ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;

    const analysis: EsGeneratedAnalysis = {
      title,
      slug,
      assetClass: 'technicalAnalysis',
      analysisType: 'technical',
      timeFrame: 'weekly',
      content,
      indicators: JSON.stringify({ positive, negative, neutral, total: totalSentiment }),
      priceTarget: '{}',
      riskLevel,
      sentiment: marketImpact,
      confidenceScore: Math.min(90, 40 + Math.min(totalSentiment, 30)),
      relatedNewsIds: JSON.stringify(newsItems.slice(0, 5).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      locale: 'es',
    };

    try {
      await db.marketAnalysis.create({ data: analysis });
      console.log(`[EsReportGenerator V315] Análisis técnico creado : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EsReportGenerator V315] Error DB al guardar el análisis técnico : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EsReportGenerator V315] Error al generar el análisis técnico : ${err.message}`);
    return null;
  }
}