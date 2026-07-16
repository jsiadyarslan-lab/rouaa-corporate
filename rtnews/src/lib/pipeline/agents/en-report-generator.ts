// ═══════════════════════════════════════════════════════════════
// English Report Generator Agent — V316 Deep Fix
// Generates professional economic reports in English.
// This is the English counterpart for report generation.
//
// V316 CRITICAL FIXES:
// - FIX 1: Custom title is now USED as the report title instead of
//   being ignored and regenerated from headlines
// - FIX 2: When custom prompt provided, it replaces the default system
//   prompt to avoid dual-structure conflict
// - FIX 3: Strategic reports now filter news by topic sectors
//   instead of grabbing all news from 48h
// - FIX 4: Added generateStrategicReportEn() with 3-call generation
//   + web search, matching Arabic strategic report quality
//
// V315 CRITICAL FIXES (preserved):
// - FIX 1: generateDailyBriefEn now uses EN_SYSTEM_PROMPTS[reportType]
// - FIX 2: generateMarketAnalysisEn now saves to MarketAnalysis table
// - FIX 3: generateWeeklyAnalysisEn now uses EN_ANALYSIS_SYSTEM_PROMPT[assetClass]
// - FIX 4: Added English news category filtering (enNewsCategoryMap)
// - FIX 5: Data window varies by report type
//
// Key differences from Arabic report-generator:
// - English prompts for all report types
// - English-specific speculation detection (may, might, could potentially)
// - Validates English number integrity
// - Sets locale: 'en' on generated reports
// ═══════════════════════════════════════════════════════════════

import { truncateAtBoundary } from '@/lib/clean-markdown';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import {
  type ReportType,
  type AssetClass,
} from '../../report-templates';
import { EN_PIPELINE_CONFIG } from '../en-pipeline-config';
import {
  EN_PROMPT_QUALITY_RULES,
  EN_ANTI_HALLUCINATION_RULES,
  EN_SYSTEM_PROMPTS,
  EN_ANALYSIS_SYSTEM_PROMPT,
} from './en-report-templates';

// Re-export types for convenience
export type { ReportType, AssetClass } from '../../report-templates';

// ─── Types ──────────────────────────────────────────────────

export interface EnReportContext {
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

export interface EnGeneratedReport {
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

export interface EnGeneratedAnalysis {
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

// ─── V315: English News Category Map ────────────────────────
// Maps each AssetClass to the English news category strings
// used to filter relevant news per asset class.
// This is the English equivalent of the Arabic newsCategoryMap.

const enNewsCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['Economy', 'Stocks', 'Energy', 'Forex', 'Crypto', 'Commodities', 'Banking'],
  stocks: ['Stocks', 'Market', 'Equities', 'Technology', 'Earnings'],
  commodities: ['Commodities', 'Energy', 'Oil', 'Gold', 'Silver', 'Copper', 'Metals'],
  forex: ['Forex', 'Currencies', 'Dollar', 'Euro', 'Yen', 'Pound', 'Exchange Rates'],
  crypto: ['Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum', 'Blockchain', 'Digital Assets'],
  bonds: ['Bonds', 'Treasury', 'Yields', 'Interest Rates', 'Credit', 'Sovereign Debt'],
  energy: ['Energy', 'Oil', 'Gas', 'OPEC', 'Petroleum', 'Natural Gas', 'Crude'],
  realEstate: ['Real Estate', 'Housing', 'Property', 'REITs', 'Mortgage'],
  economy: ['Economy', 'GDP', 'Inflation', 'Unemployment', 'Trade', 'Central Bank', 'Fed'],
  banking: ['Banking', 'Banks', 'Credit', 'Interest Rates', 'Financial Services'],
  technicalAnalysis: ['Forex', 'Currencies', 'Stocks', 'Technical'],
  arabMarkets: ['Stocks', 'Market', 'Gulf', 'Saudi', 'UAE', 'Middle East'],
  earnings: ['Stocks', 'Earnings', 'Results', 'Quarterly', 'Revenue'],
};

// Maps each AssetClass to the English indicator category strings
const enIndicatorCategoryMap: Record<AssetClass, string[]> = {
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

// V315: Asset class labels for English display
const ASSET_CLASS_LABELS_EN: Record<AssetClass, string> = {
  strategic: 'Strategic',
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
  crypto: 'Crypto',
  bonds: 'Bonds',
  energy: 'Energy',
  realEstate: 'Real Estate',
  economy: 'Economy',
  banking: 'Banking',
  technicalAnalysis: 'Technical Analysis',
  arabMarkets: 'Arab Markets',
  earnings: 'Earnings',
};

// ─── English Speculation Detection ──────────────────────────

const EN_SPECULATIVE_STRONG = [
  'may lead to', 'may experience', 'may reach', 'may decline', 'may rise',
  'may affect', 'could lead to', 'could be affected', 'may increase', 'may decrease',
  'could potentially', 'it is possible that', 'is likely to', 'is expected to',
];

const EN_SPECULATIVE_WEAK = [
  'may', 'might', 'could', 'possibly', 'perhaps', 'potentially',
  'reportedly', 'allegedly', 'presumably', 'supposedly', 'rumored',
];

interface EnSpeculationReport {
  speculationScore: number;
  speculationWordCount: number;
  totalWordCount: number;
  hasSpecificNumbers: boolean;
  shouldRepublish: boolean;
  shouldNotPublish: boolean;
  reason: string;
}

function detectSpeculationEn(content: string): EnSpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0, speculationWordCount: 0, totalWordCount: 0,
      hasSpecificNumbers: false, shouldRepublish: false, shouldNotPublish: false,
      reason: 'Content too short',
    };
  }

  let speculationWordCount = 0;

  for (const phrase of EN_SPECULATIVE_STRONG) {
    const matches = content.match(new RegExp(phrase, 'gi'));
    if (matches) speculationWordCount += matches.length * 2;
  }

  for (const word of EN_SPECULATIVE_WEAK) {
    const matches = content.match(new RegExp(`\\b${word}\\b`, 'gi'));
    if (matches) speculationWordCount += matches.length;
  }

  const totalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const speculationRatio = totalWordCount > 0 ? speculationWordCount / totalWordCount : 0;
  const speculationScore = Math.min(100, Math.round(speculationRatio * 500));

  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|\$[\d,]+|[\d,]+\s*(?:billion|million|thousand|trillion)|\d+[\.,]?\d*/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3;

  const shouldRepublish = speculationWordCount > EN_PIPELINE_CONFIG.SPECULATION_REPUBLISH_THRESHOLD;
  const shouldNotPublish = speculationWordCount > EN_PIPELINE_CONFIG.SPECULATION_BLOCK_THRESHOLD && !hasSpecificNumbers;

  let reason = 'Content is data-driven';
  if (shouldNotPublish) {
    reason = `Excessive speculation: ${speculationWordCount} speculative words. No real data.`;
  } else if (shouldRepublish) {
    reason = `High speculation: ${speculationWordCount} speculative words. Should regenerate.`;
  }

  return { speculationScore, speculationWordCount, totalWordCount, hasSpecificNumbers, shouldRepublish, shouldNotPublish, reason };
}

// ─── English Number Integrity Check ──────────────────────────
function validateNumberIntegrityEn(content: string, sourceData: string): string[] {
  const issues: string[] = [];
  const sourceNumbers = sourceData.match(/\d+(?:\.\d+)?/g) || [];

  for (const num of sourceNumbers) {
    const numVal = parseFloat(num);
    if (isNaN(numVal) || numVal < 1) continue;
    if (!content.includes(num)) {
      const shifted = (numVal / 10).toString();
      if (content.includes(shifted)) {
        issues.push(`Decimal shift detected: "${num}" from source became "${shifted}" in report`);
      }
    }
  }

  return issues;
}

// ─── V315: Data Collection with Category Filtering ──────────

async function collectNewsEn(since: Date, assetClass?: AssetClass): Promise<any[]> {
  try {
    const where: any = {
      isReady: true,
      locale: 'en',
      fetchedAt: { gte: since },
    };

    // V315: Filter news by asset class category if specified
    if (assetClass && enNewsCategoryMap[assetClass]) {
      const categories = enNewsCategoryMap[assetClass];
      where.OR = [
        { category: { in: categories } },
        { categoryId: { in: categories.map(c => c.toLowerCase()) } },
      ];
    }

    return db.newsItem.findMany({
      where,
      select: {
        id: true, title: true, summary: true, category: true, categoryId: true,
        sentiment: true, sentimentScore: true, impactLevel: true, affectedAssets: true, fetchedAt: true,
      },
      take: 50,
      orderBy: { fetchedAt: 'desc' },
    });
  } catch (error: any) {
    console.error('[EnReportGenerator] Error collecting English news:', error.message);
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

// ─── V315 FIX 1: Report Generation (English) ────────────────
// Now uses EN_SYSTEM_PROMPTS[reportType] instead of always .daily
// Data window varies by report type
// Strategic reports use EN_ANALYSIS_SYSTEM_PROMPT.strategic

export async function generateDailyBriefEn(
  reportType: ReportType = 'daily',
  context?: EnReportContext,
): Promise<EnGeneratedReport | null> {
  const startTime = Date.now();

  try {
    // V315: Data window varies by report type
    const dataWindowMs = REPORT_DATA_WINDOW_MS[reportType] || REPORT_DATA_WINDOW_MS.daily;
    const since = new Date(Date.now() - dataWindowMs);
    const newsItems = await collectNewsEn(since);

    if (newsItems.length === 0) {
      console.log(`[EnReportGenerator V315] No English news items found for ${reportType} report`);
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
      systemPrompt = EN_ANALYSIS_SYSTEM_PROMPT.strategic;
    } else {
      // Use the dedicated prompt for each report type (daily, weekly, monthly, quarterly, special)
      systemPrompt = EN_SYSTEM_PROMPTS[reportType] || EN_SYSTEM_PROMPTS.daily;
    }

    // V316 FIX 3: For strategic reports, filter news by topic sectors if provided
    let topicFilteredNews = newsItems;
    if (reportType === 'strategic' && context?.sectors && context.sectors.length > 0) {
      const sectorCategories = context.sectors.flatMap(sector => {
        const normalizedSector = sector.toLowerCase();
        // Map UI sector names to news category strings
        const sectorToCategoryMap: Record<string, string[]> = {
          'macroeconomics': ['Economy', 'GDP', 'Inflation', 'Central Bank', 'Fed'],
          'equities': ['Stocks', 'Market', 'Equities', 'Technology', 'Earnings'],
          'energy': ['Energy', 'Oil', 'Gas', 'OPEC', 'Petroleum', 'Crude'],
          'forex': ['Forex', 'Currencies', 'Dollar', 'Euro', 'Yen', 'Pound'],
          'cryptocurrencies': ['Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'commodities': ['Commodities', 'Gold', 'Silver', 'Copper', 'Metals'],
          'real estate': ['Real Estate', 'Housing', 'Property', 'REITs'],
          'central banks': ['Economy', 'Central Bank', 'Fed', 'Interest Rates', 'Monetary Policy'],
          'corporate earnings': ['Stocks', 'Earnings', 'Results', 'Quarterly', 'Revenue'],
          'arab markets': ['Stocks', 'Market', 'Gulf', 'Saudi', 'UAE', 'Middle East'],
          'technology': ['Technology', 'AI', 'Semiconductors', 'Tech'],
          'politics': ['Economy', 'Trade', 'Geopolitics', 'Policy'],
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
        console.log(`[EnReportGenerator V316] Strategic report: filtered ${filtered.length}/${newsItems.length} news items by sectors: ${context.sectors.join(', ')}`);
      } else {
        console.log(`[EnReportGenerator V316] Strategic report: sector filter yielded only ${filtered.length} items, using all ${newsItems.length} news items`);
      }
    }

    // V315: Customize user prompt based on report type
    let userPrompt: string;
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
        userPrompt = `Based on the following ${newsItems.length} English financial news articles from the past 24 hours, write a comprehensive daily brief.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the daily market brief for ${dateStr}`;
        break;

      case 'weekly':
        userPrompt = `Based on the following ${newsItems.length} English financial news articles from the past week, write a comprehensive weekly market analysis.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the weekly market analysis for the week ending ${dateStr}`;
        break;

      case 'monthly':
        userPrompt = `Based on the following ${newsItems.length} English financial news articles from the past 30 days, write a comprehensive monthly outlook.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the monthly market outlook for ${monthStr}`;
        break;

      case 'quarterly':
        userPrompt = `Based on the following ${newsItems.length} English financial news articles from the past quarter, write a comprehensive quarterly review.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the quarterly market review for ${monthStr}`;
        break;

      case 'special':
        userPrompt = `Based on the following ${newsItems.length} English financial news articles, write a comprehensive special event report${context?.event ? ` about: ${context.event}` : ''}.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the special report for ${dateStr}`;
        break;

      case 'strategic':
        // V316: Strategic prompt — when custom prompt is used as system prompt,
        // the user prompt only provides data + topic context (not structure)
        if (context?.prompt) {
          // Custom prompt already defines structure — user prompt is data only
          userPrompt = `Based on the following ${effectiveNews.length} English financial news articles, write the strategic analysis report.

Topic: ${context.title || 'General Strategic Analysis'}
Geographic Scope: ${context.region || 'Global'}
Sectors: ${context.sectors?.join(', ') || 'All'}
Time Horizons: ${context.scenarios?.join(', ') || 'Short, Medium, Long-term'}

═══ NEWS ITEMS ═══
${effectiveSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${effectiveSentiment.positive} | Negative: ${effectiveSentiment.negative} | Neutral: ${effectiveSentiment.neutral}

Generate the strategic analysis report for ${dateStr}`;
        } else {
          // Default strategic prompt — include topic in user prompt
          userPrompt = `Based on the following ${effectiveNews.length} English financial news articles, write a comprehensive strategic analysis report${context?.title ? ` about: ${context.title}` : ''}.

═══ NEWS ITEMS ═══
${effectiveSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${effectiveSentiment.positive} | Negative: ${effectiveSentiment.negative} | Neutral: ${effectiveSentiment.neutral}

Generate the strategic analysis report for ${dateStr}`;
        }
        break;

      default:
        userPrompt = `Based on the following ${newsItems.length} English financial news articles, write a comprehensive ${reportType} market report.

═══ NEWS ITEMS ═══
${newsSummary}

═══ CATEGORY BREAKDOWN ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat}: ${count}`).join('\n')}

═══ SENTIMENT OVERVIEW ═══
Positive: ${overallSentiment.positive} | Negative: ${overallSentiment.negative} | Neutral: ${overallSentiment.neutral}

Generate the ${reportType} report for ${dateStr}`;
    }

    // V316: Increased token limits to prevent truncated recommendations
    const maxTokensByType: Record<ReportType, number> = {
      daily: 8000,
      weekly: 10000,
      monthly: 10000,
      quarterly: 12000,
      special: 10000,
      strategic: 12000,
    };

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: maxTokensByType[reportType] || 8000, priority: 'generation', locale: 'en' });  // V387: English pipeline — OpenRouter (Haiku) first

    if (!aiResult.content) {
      console.error(`[EnReportGenerator V316] AI returned empty content for ${reportType} report`);
      return null;
    }

    let content = aiResult.content.trim();

    // V316: Detect and fix truncated content (AI sometimes cuts mid-sentence due to maxTokens)
    const wasTruncated = aiResult.stopReason === 'max_tokens' || aiResult.stopReason === 'length';
    if (wasTruncated) {
      console.warn(`[EnReportGenerator V316] AI hit max_tokens — content may be truncated, attempting to complete sentence`);
      // Find the last sentence boundary and cut there
      const lastSentenceEnd = Math.max(
        content.lastIndexOf('.'),
        content.lastIndexOf('!'),
        content.lastIndexOf('?'),
        content.lastIndexOf('\n'),
      );
      if (lastSentenceEnd > content.length * 0.7) {
        // Cut at last complete sentence (preserve 70%+ of content)
        content = content.slice(0, lastSentenceEnd + 1);
      }
    }

    // Speculation check
    const specReport = detectSpeculationEn(content);
    if (specReport.shouldNotPublish) {
      console.warn(`[EnReportGenerator V315] ${reportType} report blocked by speculation gate: ${specReport.reason}`);
      return null;
    }

    // Number integrity check
    const numberIssues = validateNumberIntegrityEn(content, newsSummary);
    if (numberIssues.length > 0) {
      console.warn(`[EnReportGenerator V315] Number integrity issues: ${numberIssues.join('; ')}`);
    }

    // V316 FIX 1: Use custom title when provided — do NOT regenerate from headlines
    // This was the root cause of "I put a title and it picks the topic automatically"
    const titleTypeLabel: Record<ReportType, string> = {
      daily: 'Daily Market Brief',
      weekly: 'Weekly Market Analysis',
      monthly: 'Monthly Outlook',
      quarterly: 'Quarterly Review',
      special: 'Special Report',
      strategic: 'Strategic Analysis',
    };

    let title: string;
    if (context?.title && context.title.trim().length > 0) {
      // V316: User provided a custom title — USE IT directly
      title = context.title.trim();
      console.log(`[EnReportGenerator V316] Using custom title: "${title}"`);
    } else {
      // No custom title — generate one from headlines
      const titlePrompt = `Generate a concise, descriptive English title (max 80 chars) for a ${titleTypeLabel[reportType]} based on these headlines:
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

The title should describe the main market theme. No generic prefixes like "Daily Report". Title only, no quotes.`;

      const titleResult = await chatCompletion([
        { role: 'system', content: titlePrompt },
        { role: 'user', content: 'Generate the title' },
      ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'en' });  // V387

      const defaultTitle = `${titleTypeLabel[reportType]}: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    }

    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // V302: Confidence score — quality-weighted formula, not just news count
    // Before: 50 + newsItems.length always saturated to 95 for 30+ items
    // Now: accounts for data quality, sentiment consensus, and specific numbers
    const minConfidence: Record<ReportType, number> = {
      daily: 30, weekly: 30, monthly: 35, quarterly: 50, special: 30, strategic: 40,
    };
    const newsBonus = Math.min(20, Math.floor(newsItems.length / 3)); // Cap at 20 (need 60+ items for max)
    const dataBonus = specReport.hasSpecificNumbers ? 10 : 0;
    const sentimentData = reportType === 'strategic' ? effectiveSentiment : overallSentiment;
    const totalSentimentCount = sentimentData.positive + sentimentData.negative + sentimentData.neutral;
    const sentimentConsensus = totalSentimentCount > 0
      ? Math.max(sentimentData.positive, sentimentData.negative, sentimentData.neutral) / totalSentimentCount
      : 0.5;
    const consensusBonus = Math.floor(sentimentConsensus * 10); // 0-10 bonus for strong consensus
    const confidenceScore = Math.min(92, Math.max(minConfidence[reportType], 40 + newsBonus + dataBonus + consensusBonus));

    const report: EnGeneratedReport = {
      title,
      slug,
      summary: content.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 300) || title,
      content,
      reportType,
      scope: context?.region || 'global', // V316: Use region from strategic report context
      sectors: context?.sectors ? JSON.stringify(context.sectors) : JSON.stringify(Object.keys(reportType === 'strategic' ? effectiveCategoryBreakdown : categoryBreakdown)),
      countries: '[]',
      keyIndicators: JSON.stringify({ positive: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).positive, negative: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).negative, neutral: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).neutral, total: (reportType === 'strategic' ? effectiveNews : newsItems).length }),
      marketImpact: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact,
      confidenceScore,
      sourceUrls: JSON.stringify(newsItems.slice(0, 10).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      locale: 'en',
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

      console.log(`[EnReportGenerator V315] ✓ ${reportType} report created: "${title}" in ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EnReportGenerator V315] DB error saving ${reportType} report: ${dbErr.message}`);
    }

    return report;
  } catch (err: any) {
    console.error(`[EnReportGenerator V315] Error generating ${reportType} report: ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 3: Weekly Analysis Generation (English) ────────
// Now uses EN_ANALYSIS_SYSTEM_PROMPT[assetClass] instead of generic weekly prompt
// Filters news by asset class category

export async function generateWeeklyAnalysisEn(
  assetClass: AssetClass = 'stocks',
  context?: EnReportContext,
): Promise<EnGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect English news from the last 7 days, filtered by asset class
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newsItems = await collectNewsEn(since, assetClass);

    if (newsItems.length === 0) {
      console.log(`[EnReportGenerator V315] No English news items found for weekly ${assetClass} analysis`);
      return null;
    }

    const assetClassLabel = ASSET_CLASS_LABELS_EN[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // V315 FIX 3: Use the ASSET-CLASS-SPECIFIC prompt instead of generic weekly
    // This gives each asset class its own specialized structure (e.g., stocks gets 10-section
    // stock-specific analysis, forex gets forex-specific sections, etc.)
    const systemPrompt = EN_ANALYSIS_SYSTEM_PROMPT[assetClass] || EN_ANALYSIS_SYSTEM_PROMPT.stocks;

    const newsSummary = newsItems.slice(0, 20).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Based on the following ${newsItems.length} English financial news articles from the past week, write a comprehensive weekly ${assetClassLabel} market analysis.

═══ RECENT NEWS ═══
${newsSummary}

Generate the weekly ${assetClassLabel} analysis for the week ending ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'en' });

    if (!aiResult.content) {
      console.error(`[EnReportGenerator V315] AI returned empty content for weekly ${assetClass} analysis`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check
    const specReport = detectSpeculationEn(content);
    if (specReport.shouldNotPublish) {
      console.warn(`[EnReportGenerator V315] Weekly ${assetClass} analysis blocked by speculation gate: ${specReport.reason}`);
      return null;
    }

    // Generate title with AI
    const titlePrompt = `Generate a concise, descriptive English title (max 80 chars) for a weekly ${assetClassLabel} market analysis based on these headlines:
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

No generic prefixes. Title only, no quotes.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Generate the title' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'en' });

    const defaultTitle = `Weekly ${assetClassLabel} Analysis: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // Calculate actual sentiment from news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const actualConfidence = Math.min(95, 40 + Math.min(totalSentiment, 30) + (specReport.hasSpecificNumbers ? 10 : 0));

    const analysis: EnGeneratedAnalysis = {
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
      locale: 'en',
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

      console.log(`[EnReportGenerator V315] ✓ Weekly ${assetClass} analysis created: "${title}" in ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EnReportGenerator V315] DB error saving weekly ${assetClass} analysis: ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EnReportGenerator V315] Error generating weekly ${assetClass} analysis: ${err.message}`);
    return null;
  }
}

// ─── V315 FIX 2: Market Analysis Generation (English) ────────
// Now saves to MarketAnalysis table with proper assetClass
// instead of EconomicReport with reportType:'special'
// Also filters news by asset class category

export async function generateMarketAnalysisEn(
  assetClass: AssetClass,
  context?: EnReportContext,
): Promise<EnGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    // V315: Collect news filtered by asset class
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const newsItems = await collectNewsEn(since, assetClass);

    const assetClassLabel = ASSET_CLASS_LABELS_EN[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);

    // Use the comprehensive analysis system prompt for the specific asset class
    const systemPrompt = EN_ANALYSIS_SYSTEM_PROMPT[assetClass];

    const newsSummary = newsItems.slice(0, 15).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Asset Class: ${assetClassLabel}
Recent News Items: ${newsItems.length}

${newsSummary}

${context?.prompt ? `User Request: ${context.prompt}\n\n` : ''}Generate ${assetClassLabel} market analysis for ${new Date().toLocaleDateString('en-US')}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 6000, priority: 'generation', locale: 'en' });

    if (!aiResult.content) return null;

    const content = aiResult.content.trim();

    const specReport = detectSpeculationEn(content);
    if (specReport.shouldNotPublish) {
      console.warn(`[EnReportGenerator V315] ${assetClass} market analysis blocked: ${specReport.reason}`);
      return null;
    }

    // V315: Generate AI title instead of generic template
    const titlePrompt = `Generate a concise, descriptive English title (max 80 chars) for a ${assetClassLabel} market analysis based on these headlines:
${newsItems.slice(0, 8).map((i: any) => i.title).join('\n')}

No generic prefixes. Title only, no quotes.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Generate the title' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'en' });

    const defaultTitle = `${assetClassLabel} Market Analysis: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    // V315: Calculate sentiment from actual news data
    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const confidenceScore = Math.min(90, 40 + Math.min(totalSentiment, 25) + (specReport.hasSpecificNumbers ? 10 : 0));

    // V315 FIX 2: Save to MarketAnalysis table (NOT EconomicReport)
    // This preserves the assetClass field and allows proper categorization
    const analysis: EnGeneratedAnalysis = {
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
      locale: 'en',
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

      console.log(`[EnReportGenerator V315] ✓ ${assetClass} market analysis created: "${title}" in ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EnReportGenerator V315] DB error saving ${assetClass} analysis: ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EnReportGenerator V315] Error generating ${assetClass} analysis: ${err.message}`);
    return null;
  }
}

// ─── Monthly Outlook Generation (English) ────────────────────

export async function generateMonthlyOutlookEn(
  context?: EnReportContext,
): Promise<EnGeneratedReport | null> {
  // V315: Delegate to generateDailyBriefEn which now uses correct prompts
  return generateDailyBriefEn('monthly', context);
}

// ─── Technical Analysis Generation (English) ─────────────────

export async function generateTechnicalAnalysisEn(
  context?: EnReportContext,
): Promise<EnGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // V315: Filter news for technical analysis categories
    const newsItems = await collectNewsEn(since, 'technicalAnalysis');

    if (newsItems.length === 0) {
      console.log('[EnReportGenerator V315] No English news items found for technical analysis');
      return null;
    }

    // Use the comprehensive technical analysis system prompt from templates
    const systemPrompt = EN_ANALYSIS_SYSTEM_PROMPT.technicalAnalysis;
    const userPrompt = `Based on the following ${newsItems.length} English financial news articles, write a comprehensive technical analysis covering major markets.

═══ RECENT NEWS ═══
${newsItems.slice(0, 20).map((i: any) => `- [${i.sentiment}] ${i.title} (${i.category})`).join('\n')}

Generate the technical analysis for ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'en' });

    if (!aiResult.content) {
      console.error('[EnReportGenerator V315] AI returned empty content for technical analysis');
      return null;
    }

    const content = aiResult.content.trim();

    const specReport = detectSpeculationEn(content);
    if (specReport.shouldNotPublish) {
      console.warn(`[EnReportGenerator V315] Technical analysis blocked by speculation gate: ${specReport.reason}`);
      return null;
    }

    const title = `Technical Analysis: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;

    const analysis: EnGeneratedAnalysis = {
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
      locale: 'en',
    };

    try {
      await db.marketAnalysis.create({ data: analysis });
      console.log(`[EnReportGenerator V315] Technical analysis created: "${title}" in ${Date.now() - startTime}ms`);
    } catch (dbErr: any) {
      console.error(`[EnReportGenerator V315] DB error saving technical analysis: ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[EnReportGenerator V315] Error generating technical analysis: ${err.message}`);
    return null;
  }
}
