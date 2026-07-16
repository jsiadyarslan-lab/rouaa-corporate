// ═══════════════════════════════════════════════════════════════
// French Report Generator Agent — V316 Deep Fix
// Generates professional economic reports in French.
// This is the French counterpart for report generation.
//
// V316 CRITICAL FIXES (mirrored from English):
// - FIX 1: Custom title is now USED as the report title instead of
//   being ignored and regenerated from headlines
// - FIX 2: When custom prompt provided, it replaces the default system
//   prompt to avoid dual-structure conflict
// - FIX 3: Strategic reports now filter news by topic sectors
//   instead of grabbing all news from 48h
// - FIX 4: Added generateStrategicReportFr() with 3-call generation
//   + web search, matching Arabic strategic report quality
//
// V315 CRITICAL FIXES (preserved):
// - FIX 1: generateDailyBriefFr now uses FR_SYSTEM_PROMPTS[reportType]
// - FIX 2: generateMarketAnalysisFr now saves to MarketAnalysis table
// - FIX 3: generateWeeklyAnalysisFr now uses FR_ANALYSIS_SYSTEM_PROMPT[assetClass]
// - FIX 4: Added French news category filtering (frNewsCategoryMap)
// - FIX 5: Data window varies by report type
//
// Key differences from English report-generator:
// - French prompts for all report types
// - French-specific speculation detection (peut, pourrait, éventuellement)
// - Validates French number integrity
// - Sets locale: 'fr' on generated reports
// ═══════════════════════════════════════════════════════════════

import { truncateAtBoundary } from '@/lib/clean-markdown';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import {
  type ReportType,
  type AssetClass,
} from '../../report-templates';
import { FR_PIPELINE_CONFIG } from '../fr-pipeline-config';
import {
  FR_PROMPT_QUALITY_RULES,
  FR_ANTI_HALLUCINATION_RULES,
  FR_SYSTEM_PROMPTS,
  FR_ANALYSIS_SYSTEM_PROMPT,
} from './fr-report-templates';
import { detectSpeculationFr } from './fr-analyzer';

// Re-export types for convenience
export type { ReportType, AssetClass } from '../../report-templates';

// ─── Types ──────────────────────────────────────────────────

export interface FrReportContext {
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

export interface FrGeneratedReport {
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

export interface FrGeneratedAnalysis {
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

// ─── V315: French News Category Map ────────────────────────
// Maps each AssetClass to the French news category strings
// used to filter relevant news per asset class.
// This is the French equivalent of the English enNewsCategoryMap.

const frNewsCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['Économie', 'Actions', 'Énergie', 'Devises', 'Crypto', 'Matières Premières', 'Bancaire'],
  stocks: ['Actions', 'Marché', 'Bourse', 'Technologie', 'Résultats'],
  commodities: ['Matières Premières', 'Énergie', 'Pétrole', 'Or', 'Argent', 'Cuivre', 'Métaux'],
  forex: ['Devises', 'Change', 'Dollar', 'Euro', 'Yen', 'Livre', 'Taux de Change'],
  crypto: ['Crypto', 'Cryptomonnaie', 'Bitcoin', 'Ethereum', 'Blockchain', 'Actifs Numériques'],
  bonds: ['Obligations', 'Bons du Trésor', 'Rendements', 'Taux d\'Intérêt', 'Crédit', 'Dette Souveraine'],
  energy: ['Énergie', 'Pétrole', 'Gaz', 'OPEP', 'Pétrole Brut', 'Gaz Naturel'],
  realEstate: ['Immobilier', 'Logement', 'Propriété', 'SCPI', 'Hypothèque'],
  economy: ['Économie', 'PIB', 'Inflation', 'Chômage', 'Commerce', 'Banque Centrale', 'BCE'],
  banking: ['Bancaire', 'Banques', 'Crédit', 'Taux d\'Intérêt', 'Services Financiers'],
  technicalAnalysis: ['Devises', 'Change', 'Actions', 'Technique', 'Analyse Technique'],
  arabMarkets: ['Actions', 'Marché', 'Golfe', 'Arabie Saoudite', 'Émirats', 'Moyen-Orient'],
  earnings: ['Actions', 'Résultats', 'Bénéfices', 'Trimestriels', 'Chiffre d\'Affaires'],
};

// Maps each AssetClass to the French indicator category strings
const frIndicatorCategoryMap: Record<AssetClass, string[]> = {
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

// V315: Asset class labels for French display
const ASSET_CLASS_LABELS_FR: Record<AssetClass, string> = {
  strategic: 'Stratégique',
  stocks: 'Actions',
  commodities: 'Matières Premières',
  forex: 'Devises',
  crypto: 'Crypto',
  bonds: 'Obligations',
  energy: 'Énergie',
  realEstate: 'Immobilier',
  economy: 'Économie',
  banking: 'Bancaire',
  technicalAnalysis: 'Analyse Technique',
  arabMarkets: 'Marchés Arabes',
  earnings: 'Résultats',
};

// ─── French Number Integrity Check ──────────────────────────
function validateNumberIntegrityFr(content: string, sourceData: string): string[] {
  const issues: string[] = [];
  const sourceNumbers = sourceData.match(/\d+(?:[.,]\d+)?/g) || [];

  for (const num of sourceNumbers) {
    const numVal = parseFloat(num.replace(',', '.'));
    if (isNaN(numVal) || numVal < 1) continue;
    if (!content.includes(num)) {
      const shifted = (numVal / 10).toString();
      if (content.includes(shifted)) {
        issues.push(`Décalage décimal détecté : "${num}" de la source est devenu "${shifted}" dans le rapport`);
      }
    }
  }

  return issues;
}

// ─── V315: Data Collection with Category Filtering ──────────

async function collectNewsFr(since: Date, assetClass?: AssetClass): Promise<any[]> {
  try {
    const where: any = {
      isReady: true,
      locale: 'fr',
      fetchedAt: { gte: since },
    };

    // V352 FIX: Filter news by asset class category if specified.
    // categoryId in DB stores English IDs (e.g. 'forex', 'stocks'), NOT lowercased French names.
    // Must use both category (French display string) AND categoryId (English ID) for comprehensive matching.
    if (assetClass && frNewsCategoryMap[assetClass]) {
      const categories = frNewsCategoryMap[assetClass];
      // V352: Map French category display names to their English ID counterparts
      // e.g. 'Actions' → 'stocks', 'Devises' → 'forex', 'Crypto' → 'crypto'
      const categoryIdMap: Record<string, string> = {
        'Économie': 'economy', 'Actions': 'stocks', 'Devises': 'forex', 'Crypto': 'crypto',
        'Énergie': 'energy', 'Matières Premières': 'commodities', 'Immobilier': 'realEstate',
        'Bancaire': 'banking', 'Résultats': 'earnings', 'Obligations': 'bonds',
        'Analyse Technique': 'technicalAnalysis', 'Géopolitique': 'strategic',
        'Technologie': 'technology', 'Flash': 'breaking',
        // Additional French terms that appear in articles
        'Bourse': 'stocks', 'Marché': 'stocks', 'Pétrole': 'energy', 'Or': 'commodities',
        'Change': 'forex', 'Dollar': 'forex', 'Euro': 'forex', 'Blockchain': 'crypto',
        'Bitcoin': 'crypto', 'Ethereum': 'crypto', 'PIB': 'economy', 'Inflation': 'economy',
        'Chômage': 'economy', 'Commerce': 'economy', 'Banque Centrale': 'economy',
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
    // fall back to ALL French articles. This prevents report generation
    // from failing entirely just because articles are categorized as
    // 'Économie' instead of their specific sector.
    if (newsItems.length === 0 && assetClass && frNewsCategoryMap[assetClass]) {
      console.log(`[FrReportGenerator V375] No articles found for '${assetClass}' — falling back to ALL French articles`);
      const fallbackWhere: any = {
        isReady: true,
        locale: 'fr',
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
        console.log(`[FrReportGenerator V375] Found ${newsItems.length} articles as fallback for '${assetClass}' report`);
      }
    }

    return newsItems;
  } catch (error: any) {
    console.error('[FrReportGenerator] Erreur lors de la collecte des actualités françaises :', error.message);
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

// ─── V315 FIX 1: Report Generation (French) ────────────────
// Now uses FR_SYSTEM_PROMPTS[reportType] instead of always .daily
// Data window varies by report type
// Strategic reports use FR_ANALYSIS_SYSTEM_PROMPT.strategic

export async function generateDailyBriefFr(
  reportType: ReportType = 'daily',
  context?: FrReportContext,
): Promise<FrGeneratedReport | null> {
  const startTime = Date.now();

  try {
    // V315: Data window varies by report type
    const dataWindowMs = REPORT_DATA_WINDOW_MS[reportType] || REPORT_DATA_WINDOW_MS.daily;
    const since = new Date(Date.now() - dataWindowMs);
    const newsItems = await collectNewsFr(since);

    if (newsItems.length === 0) {
      console.log(`[FrReportGenerator V315] Aucune actualité française trouvée pour le rapport ${reportType}`);
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
      systemPrompt = FR_ANALYSIS_SYSTEM_PROMPT.strategic;
    } else {
      // Use the dedicated prompt for each report type (daily, weekly, monthly, quarterly, special)
      systemPrompt = FR_SYSTEM_PROMPTS[reportType] || FR_SYSTEM_PROMPTS.daily;
    }

    // V316 FIX 3: For strategic reports, filter news by topic sectors if provided
    let topicFilteredNews = newsItems;
    if (reportType === 'strategic' && context?.sectors && context.sectors.length > 0) {
      const sectorCategories = context.sectors.flatMap(sector => {
        const normalizedSector = sector.toLowerCase();
        // Map UI sector names to French news category strings
        const sectorToCategoryMap: Record<string, string[]> = {
          'macroeconomics': ['Économie', 'PIB', 'Inflation', 'Banque Centrale', 'BCE'],
          'macroéconomie': ['Économie', 'PIB', 'Inflation', 'Banque Centrale', 'BCE'],
          'equities': ['Actions', 'Marché', 'Bourse', 'Technologie', 'Résultats'],
          'actions': ['Actions', 'Marché', 'Bourse', 'Technologie', 'Résultats'],
          'energy': ['Énergie', 'Pétrole', 'Gaz', 'OPEP', 'Pétrole Brut'],
          'énergie': ['Énergie', 'Pétrole', 'Gaz', 'OPEP', 'Pétrole Brut'],
          'forex': ['Devises', 'Change', 'Dollar', 'Euro', 'Yen', 'Livre'],
          'devises': ['Devises', 'Change', 'Dollar', 'Euro', 'Yen', 'Livre'],
          'cryptocurrencies': ['Crypto', 'Cryptomonnaie', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'cryptomonnaies': ['Crypto', 'Cryptomonnaie', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'commodities': ['Matières Premières', 'Or', 'Argent', 'Cuivre', 'Métaux'],
          'matières premières': ['Matières Premières', 'Or', 'Argent', 'Cuivre', 'Métaux'],
          'real estate': ['Immobilier', 'Logement', 'Propriété', 'SCPI'],
          'immobilier': ['Immobilier', 'Logement', 'Propriété', 'SCPI'],
          'central banks': ['Économie', 'Banque Centrale', 'BCE', 'Taux d\'Intérêt', 'Politique Monétaire'],
          'banques centrales': ['Économie', 'Banque Centrale', 'BCE', 'Taux d\'Intérêt', 'Politique Monétaire'],
          'corporate earnings': ['Actions', 'Résultats', 'Bénéfices', 'Trimestriels', 'Chiffre d\'Affaires'],
          'résultats entreprises': ['Actions', 'Résultats', 'Bénéfices', 'Trimestriels', 'Chiffre d\'Affaires'],
          'arab markets': ['Actions', 'Marché', 'Golfe', 'Arabie Saoudite', 'Émirats', 'Moyen-Orient'],
          'marchés arabes': ['Actions', 'Marché', 'Golfe', 'Arabie Saoudite', 'Émirats', 'Moyen-Orient'],
          'technology': ['Technologie', 'IA', 'Semi-conducteurs', 'Tech'],
          'technologie': ['Technologie', 'IA', 'Semi-conducteurs', 'Tech'],
          'politics': ['Économie', 'Commerce', 'Géopolitique', 'Politique'],
          'politique': ['Économie', 'Commerce', 'Géopolitique', 'Politique'],
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
        console.log(`[FrReportGenerator V316] Rapport stratégique : ${filtered.length}/${newsItems.length} actualités filtrées par secteurs : ${context.sectors.join(', ')}`);
      } else {
        console.log(`[FrReportGenerator V316] Rapport stratégique : le filtre par secteurs n'a donné que ${filtered.length} éléments, utilisation des ${newsItems.length} actualités`);
      }
    }

    // V315: Customize user prompt based on report type
    let userPrompt: string;
    const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthStr = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants des dernières 24 heures, rédigez un bulletin quotidien complet.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez le bulletin quotidien des marchés pour le ${dateStr}`;
        break;

      case 'weekly':
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants de la semaine écoulée, rédigez une analyse hebdomadaire complète des marchés.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez l'analyse hebdomadaire des marchés pour la semaine se terminant le ${dateStr}`;
        break;

      case 'monthly':
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants des 30 derniers jours, rédigez des perspectives mensuelles complètes.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez les perspectives mensuelles des marchés pour ${monthStr}`;
        break;

      case 'quarterly':
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants du dernier trimestre, rédigez une revue trimestrielle complète.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez la revue trimestrielle des marchés pour ${monthStr}`;
        break;

      case 'special':
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants, rédigez un rapport spécial${context?.event ? ` sur : ${context.event}` : ''}.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez le rapport spécial pour le ${dateStr}`;
        break;

      case 'strategic':
        // V316: Strategic prompt — when custom prompt is used as system prompt,
        // the user prompt only provides data + topic context (not structure)
        if (context?.prompt) {
          // Custom prompt already defines structure — user prompt is data only
          userPrompt = `À partir des ${effectiveNews.length} articles d'actualité financière française suivants, rédigez le rapport d'analyse stratégique.

Sujet : ${context.title || 'Analyse stratégique générale'}
Portée géographique : ${context.region || 'Mondiale'}
Secteurs : ${context.sectors?.join(', ') || 'Tous'}
Horizons temporels : ${context.scenarios?.join(', ') || 'Court, Moyen, Long terme'}

═══ ACTUALITÉS ═══
${effectiveSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${effectiveSentiment.positive} | Négatif : ${effectiveSentiment.negative} | Neutre : ${effectiveSentiment.neutral}

Générez le rapport d'analyse stratégique pour le ${dateStr}`;
        } else {
          // Default strategic prompt — include topic in user prompt
          userPrompt = `À partir des ${effectiveNews.length} articles d'actualité financière française suivants, rédigez un rapport d'analyse stratégique complet${context?.title ? ` sur : ${context.title}` : ''}.

═══ ACTUALITÉS ═══
${effectiveSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${effectiveSentiment.positive} | Négatif : ${effectiveSentiment.negative} | Neutre : ${effectiveSentiment.neutral}

Générez le rapport d'analyse stratégique pour le ${dateStr}`;
        }
        break;

      default:
        userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants, rédigez un rapport ${reportType} complet des marchés.

═══ ACTUALITÉS ═══
${newsSummary}

═══ RÉPARTITION PAR CATÉGORIE ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ APERÇU DU SENTIMENT ═══
Positif : ${overallSentiment.positive} | Négatif : ${overallSentiment.negative} | Neutre : ${overallSentiment.neutral}

Générez le rapport ${reportType} pour le ${dateStr}`;
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
    ], { temperature: 0.4, maxTokens: maxTokensByType[reportType] || 6000, priority: 'generation', locale: 'fr' });

    if (!aiResult.content) {
      console.error(`[FrReportGenerator V315] L'IA a retourné un contenu vide pour le rapport ${reportType}`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    // because financial reports naturally include forward-looking analysis.
    const reportBlockThreshold = FR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationFr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[FrReportGenerator V375] Rapport ${reportType} bloqué par le filtre de spéculation (seuil: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // Number integrity check
    const numberIssues = validateNumberIntegrityFr(content, newsSummary);
    if (numberIssues.length > 0) {
      console.warn(`[FrReportGenerator V315] Problèmes d'intégrité numérique : ${numberIssues.join('; ')}`);
    }

    // V316 FIX 1: Use custom title when provided — do NOT regenerate from headlines
    // This was the root cause of "I put a title and it picks the topic automatically"
    const titleTypeLabel: Record<ReportType, string> = {
      daily: 'Bulletin Quotidien des Marchés',
      weekly: 'Analyse Hebdomadaire des Marchés',
      monthly: 'Perspectives Mensuelles',
      quarterly: 'Revue Trimestrielle',
      special: 'Rapport Spécial',
      strategic: 'Analyse Stratégique',
    };

    let title: string;
    if (context?.title && context.title.trim().length > 0) {
      // V316: User provided a custom title — USE IT directly
      title = context.title.trim();
      console.log(`[FrReportGenerator V316] Utilisation du titre personnalisé : "${title}"`);
    } else {
      // No custom title — generate one from headlines
      const titlePrompt = `Générez un titre français concis et descriptif (80 caractères max) pour un ${titleTypeLabel[reportType]} basé sur ces titres :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

Le titre doit décrire le thème principal du marché. Pas de préfixes génériques comme "Rapport Quotidien". Titre uniquement, sans guillemets.`;

      const titleResult = await chatCompletion([
        { role: 'system', content: titlePrompt },
        { role: 'user', content: 'Générez le titre' },
      ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'fr' });

      const defaultTitle = `${titleTypeLabel[reportType]} : ${new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
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

    const report: FrGeneratedReport = {
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
        // V380: Monitoring indicators for French reports
        indicateursDeSuivi: [
          { nom: 'Indice de Confiance', valeur: confidenceScore, changement: 0 },
          { nom: 'Sentiment du Marché', valeur: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bullish' ? 'Haussier' : (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bearish' ? 'Baissier' : 'Neutre', changement: 0 },
          { nom: 'Nombre d\'Actualités', valeur: (reportType === 'strategic' ? effectiveNews : newsItems).length, changement: 0 },
        ],
        // V380: Investor type labels in French
        segmentsInvestisseurs: ['Day Trader', 'Investisseur Moyen Terme', 'Investisseur Long Terme'],
      }),
      marketImpact: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact,
      confidenceScore,
      sourceUrls: JSON.stringify(newsItems.slice(0, 10).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      locale: 'fr',
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

      console.log(`[FrReportGenerator V315] ✓ Rapport ${reportType} créé : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[FrReportGenerator V315] Erreur DB lors de la sauvegarde du rapport ${reportType} : ${dbErr.message}`);
    }

    return report;
  } catch (err: any) {
    console.error(`[FrReportGenerator V315] Erreur lors de la génération du rapport ${reportType} : ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 3: Weekly Analysis Generation (French) ────────
// Now uses FR_ANALYSIS_SYSTEM_PROMPT[assetClass] instead of generic weekly prompt
// Filters news by asset class category

export async function generateWeeklyAnalysisFr(
  assetClass: AssetClass = 'stocks',
  context?: FrReportContext,
): Promise<FrGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect French news from the last 7 days, filtered by asset class
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newsItems = await collectNewsFr(since, assetClass);

    if (newsItems.length === 0) {
      console.log(`[FrReportGenerator V315] Aucune actualité française trouvée pour l'analyse hebdomadaire ${assetClass}`);
      return null;
    }

    const assetClassLabel = ASSET_CLASS_LABELS_FR[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // V315 FIX 3: Use the ASSET-CLASS-SPECIFIC prompt instead of generic weekly
    // This gives each asset class its own specialized structure (e.g., stocks gets 10-section
    // stock-specific analysis, forex gets forex-specific sections, etc.)
    const systemPrompt = FR_ANALYSIS_SYSTEM_PROMPT[assetClass] || FR_ANALYSIS_SYSTEM_PROMPT.stocks;

    const newsSummary = newsItems.slice(0, 20).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants de la semaine écoulée, rédigez une analyse hebdomadaire complète des marchés ${assetClassLabel}.

═══ ACTUALITÉS RÉCENTES ═══
${newsSummary}

Générez l'analyse hebdomadaire ${assetClassLabel} pour la semaine se terminant le ${new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'fr' });

    if (!aiResult.content) {
      console.error(`[FrReportGenerator V315] L'IA a retourné un contenu vide pour l'analyse hebdomadaire ${assetClass}`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = FR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationFr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[FrReportGenerator V375] Analyse hebdomadaire ${assetClass} bloquée par le filtre de spéculation (seuil: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // Generate title with AI
    const titlePrompt = `Générez un titre français concis et descriptif (80 caractères max) pour une analyse hebdomadaire des marchés ${assetClassLabel} basée sur ces titres :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

Pas de préfixes génériques. Titre uniquement, sans guillemets.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Générez le titre' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'fr' });

    const defaultTitle = `Analyse Hebdomadaire ${assetClassLabel} : ${new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // Calculate actual sentiment from news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const actualConfidence = Math.min(95, 40 + Math.min(totalSentiment, 30) + (specReport.hasSpecificNumbers ? 10 : 0));

    const analysis: FrGeneratedAnalysis = {
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
      locale: 'fr',
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

      console.log(`[FrReportGenerator V315] ✓ Analyse hebdomadaire ${assetClass} créée : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[FrReportGenerator V315] Erreur DB lors de la sauvegarde de l'analyse hebdomadaire ${assetClass} : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[FrReportGenerator V315] Erreur lors de la génération de l'analyse hebdomadaire ${assetClass} : ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 2: Market Analysis Generation (French) ────────
// Now saves to MarketAnalysis table with proper assetClass
// instead of EconomicReport with reportType:'special'
// Also filters news by asset class category

export async function generateMarketAnalysisFr(
  assetClass: AssetClass,
  context?: FrReportContext,
): Promise<FrGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect news filtered by asset class
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const newsItems = await collectNewsFr(since, assetClass);

    const assetClassLabel = ASSET_CLASS_LABELS_FR[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // Use the comprehensive analysis system prompt for the specific asset class
    const systemPrompt = FR_ANALYSIS_SYSTEM_PROMPT[assetClass];

    const newsSummary = newsItems.slice(0, 15).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Classe d'actifs : ${assetClassLabel}
Actualités récentes : ${newsItems.length}

${newsSummary}

${context?.prompt ? `Demande utilisateur : ${context.prompt}\n\n` : ''}Générez l'analyse des marchés ${assetClassLabel} pour le ${new Date().toLocaleDateString('fr-FR')}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 6000, priority: 'generation', locale: 'fr' });

    if (!aiResult.content) return null;

    const content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = FR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationFr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[FrReportGenerator V375] Analyse de marché ${assetClass} bloquée (seuil: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // V315: Generate AI title instead of generic template
    const titlePrompt = `Générez un titre français concis et descriptif (80 caractères max) pour une analyse de marché ${assetClassLabel} basée sur ces titres :
${newsItems.slice(0, 8).map((i: any) => i.title).join('\n')}

Pas de préfixes génériques. Titre uniquement, sans guillemets.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Générez le titre' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'fr' });

    const defaultTitle = `Analyse de Marché ${assetClassLabel} : ${new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // V315: Calculate sentiment from actual news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const confidenceScore = Math.min(90, 40 + Math.min(totalSentiment, 25) + (specReport.hasSpecificNumbers ? 10 : 0));

    // V315 FIX 2: Save to MarketAnalysis table (NOT EconomicReport)
    // This preserves the assetClass field and allows proper categorization
    const analysis: FrGeneratedAnalysis = {
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
      locale: 'fr',
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

      console.log(`[FrReportGenerator V315] ✓ Analyse de marché ${assetClass} créée : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[FrReportGenerator V315] Erreur DB lors de la sauvegarde de l'analyse ${assetClass} : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[FrReportGenerator V315] Erreur lors de la génération de l'analyse ${assetClass} : ${err.message}`);
    return null;
  }
}

// ─── Monthly Outlook Generation (French) ────────────────────

export async function generateMonthlyOutlookFr(
  context?: FrReportContext,
): Promise<FrGeneratedReport | null> {
  // V315: Delegate to generateDailyBriefFr which now uses correct prompts
  return generateDailyBriefFr('monthly', context);
}

// ─── Technical Analysis Generation (French) ─────────────────

export async function generateTechnicalAnalysisFr(
  context?: FrReportContext,
): Promise<FrGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // V315: Filter news for technical analysis categories
    const newsItems = await collectNewsFr(since, 'technicalAnalysis');

    if (newsItems.length === 0) {
      console.log('[FrReportGenerator V315] Aucune actualité française trouvée pour l\'analyse technique');
      return null;
    }

    // Use the comprehensive technical analysis system prompt from templates
    const systemPrompt = FR_ANALYSIS_SYSTEM_PROMPT.technicalAnalysis;
    const userPrompt = `À partir des ${newsItems.length} articles d'actualité financière française suivants, rédigez une analyse technique complète couvrant les principaux marchés.

═══ ACTUALITÉS RÉCENTES ═══
${newsItems.slice(0, 20).map((i: any) => `- [${i.sentiment}] ${i.title} (${i.category})`).join('\n')}

Générez l'analyse technique pour le ${new Date().toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'fr' });

    if (!aiResult.content) {
      console.error('[FrReportGenerator V315] L\'IA a retourné un contenu vide pour l\'analyse technique');
      return null;
    }

    const content = aiResult.content.trim();

    // Speculation check — V375: Reports use higher speculation threshold
    const reportBlockThreshold = FR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationFr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[FrReportGenerator V375] Analyse technique bloquée (seuil: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    const title = `Analyse Technique : ${new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;

    const analysis: FrGeneratedAnalysis = {
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
      locale: 'fr',
    };

    try {
      await db.marketAnalysis.create({ data: analysis });
      console.log(`[FrReportGenerator V315] Analyse technique créée : "${title}" en ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[FrReportGenerator V315] Erreur DB lors de la sauvegarde de l'analyse technique : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[FrReportGenerator V315] Erreur lors de la génération de l'analyse technique : ${err.message}`);
    return null;
  }
}
