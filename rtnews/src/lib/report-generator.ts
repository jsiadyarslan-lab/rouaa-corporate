// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── AI-Powered Report Generation Engine V223 ────────────────
// Generates professional economic reports using AI (via ai-provider).
// Each generator collects relevant data, builds specialized Arabic
// system prompts, calls AI, parses the response into a structured
// report format, calculates confidence scores, and returns an object
// ready for DB insertion.
//
// V86: Fabricated number detection + transliteration in titles:
//   - NEW: After detectHallucinations, cross-reference numbers in
//     recommendations against the source news data (ported from analyzer V88)
//   - NEW: fixMixedArabicTitle now TRANSLITERATES instead of deleting
//     "باركلAYS" → "باركليز" (not "باركل" — broken!)
//     Added dictionary of well-known company/bank names
// V85: Deduplication + title formatting:
//   - detectHallucinations now also detects and removes repeated sentences
//     with Jaccard similarity > 0.75 (Barclays problem — same sentence 4-6 times)
//   - generateDescriptiveTitle now fixes mixed Arabic/Latin in titles
//   - Core principle: "سطران من الكود يحلان مشكلة التنظيف"
// V83: Anti-hallucination + translation fixes + tighter news filtering — TRULY DYNAMIC SECTIONS:
// - Removed ALL forced section mandates ("لا تترك القسم فارغاً" DELETED)
// - Removed minimum word count per section (was forcing hallucination)
// - Multi-pass generator now SKIPS sections with no data instead of padding
// - "لا تتوفر بيانات" sections are DELETED entirely (not kept as filler)
// - AI is told to DELETE sections it can't support with real data
// - Special report prompt: removed "أنتج التقرير كاملاً بدون اختصار أو تخطي"
// - "لا تطلب من النموذج أكثر مما يعرف" — the core principle
// - No minimum word count anywhere — quality over quantity
// - Reports can be 3 honest sections instead of 7 hallucinated ones
//
// V70: Enhanced prompt quality + title-based deduplication:
// - Prompts enforce specific numbers (percentages, prices, dates)
// - No repeated sentences across sections
// - Disclaimer appended to every report
// - h3 sub-headings required within analysis sections
// - Descriptive titles: event + impact, no generic prefixes
// - Title-based deduplication prevents duplicate reports
//
// V69: Descriptive titles + hourly generation:
// - Titles are AI-generated descriptive (event + impact), NOT generic
// - No "تقرير يومي" or "تحليل أسهم" prefixes — title = event + impact
// - Slug always includes timestamp for hourly uniqueness
// - Removed "same type today" dedup — allow multiple reports/day
// - Each hourly generation creates a NEW unique report
//
// V67: Overhauled report generation pipeline:
// - Fixed: Arabic text spaces no longer destroyed in post-processing
// - Fixed: generateMarketAnalysis now uses Markdown parsing (not JSON keys)
// - Increased maxTokens for richer content
// - Enhanced prompts for deeper financial analysis
// - Better fallback content for empty reports

import { truncateAtBoundary } from '@/lib/clean-markdown';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import {
  type ReportType,
  type AssetClass,
  SYSTEM_PROMPTS,
  ANALYSIS_SYSTEM_PROMPT,
  PROMPT_QUALITY_RULES,
  REPORT_TEMPLATES,
  REPORT_TYPE_LABELS,
  ASSET_CLASS_LABELS,
  V223_CONTEXTUAL_REPORT_SUPPLEMENT,
  V223_DATA_REPORT_SUPPLEMENT,
} from './report-templates';

// V164: z-ai-web-dev-sdk for real-time web search (current market prices)
let ZAI: any = null;
async function getZAI() {
  if (!ZAI) {
    const { default: ZAISdk } = await import('z-ai-web-dev-sdk');
    ZAI = await ZAISdk.create();
  }
  return ZAI;
}

// Re-export types for convenience
export type { ReportType, AssetClass } from './report-templates';

// ─── V164: Asset-class-specific web search queries ──────────
// Used to fetch current market prices before AI generation,
// preventing stale or hallucinated prices in reports.
const ASSET_CLASS_SEARCH_QUERIES: Record<AssetClass, string[]> = {
  bonds: [
    'US Treasury yields 2Y 10Y 30Y today 2026',
    'German Bund 10Y yield UK Gilt current',
    'credit spreads investment grade high yield today',
  ],
  energy: [
    'Brent WTI crude oil price today 2026',
    'natural gas price OPEC+ production latest',
    'energy stocks oil inventory EIA report',
  ],
  crypto: [
    'Bitcoin BTC price today Ethereum ETH 2026',
    'cryptocurrency market cap altcoins latest',
    'crypto ETF flows institutional Bitcoin',
  ],
  forex: [
    'US dollar DXY index today 2026',
    'EUR USD GBP USD exchange rate current',
    'central bank interest rate decisions latest',
  ],
  commodities: [
    'gold silver price today 2026 precious metals',
    'copper industrial metals commodities latest',
    'agricultural commodities wheat corn price',
  ],
  stocks: [
    'S&P 500 Nasdaq Dow Jones today 2026',
    'stock market earnings major indices',
    'technology stocks semiconductor AI stocks latest',
  ],
  banking: [
    'bank stocks financial sector interest rates 2026',
    'banking earnings JPMorgan BofA latest',
    'central bank policy lending rates',
  ],
  realEstate: [
    'real estate market REITs mortgage rates today 2026',
    'housing market prices commercial real estate',
    'property investment trends latest',
  ],
  economy: [
    'US GDP inflation unemployment data latest 2026',
    'global economic indicators PMI manufacturing',
    'trade war tariffs economic outlook',
  ],
  strategic: [
    'global markets economic analysis latest 2026',
    'geopolitical risk financial markets impact',
  ],
  technicalAnalysis: [
    'forex technical analysis support resistance 2026',
    'major currency pairs technical levels gold',
  ],
  arabMarkets: [
    'Saudi Tadawul Dubai Abu Dhabi stock market today 2026',
    'Gulf markets GCC equities latest',
    'Arab stock exchanges trading volume',
  ],
  earnings: [
    'earnings reports today after hours pre-market 2026',
    'company quarterly results S&P 500 earnings',
    'revenue profit expectations analyst estimates',
  ],
};

// V164: Web search for current market prices using z-ai-web-dev-sdk
async function searchWebForAssetClassPrices(assetClass: AssetClass): Promise<string> {
  try {
    const zai = await getZAI();
    const queries = ASSET_CLASS_SEARCH_QUERIES[assetClass] || ASSET_CLASS_SEARCH_QUERIES.economy;
    const allResults: string[] = [];

    // Run searches in parallel for speed
    const searchPromises = queries.map(async (query) => {
      try {
        const results = await zai.functions.invoke('web_search', {
          query,
          num: 5,
        });

        if (Array.isArray(results)) {
          return results
            .filter((r: any) => r.snippet && r.name)
            .map((r: any) => `- ${r.name}: ${r.snippet}${r.date ? ` (${r.date})` : ''}`);
        }
        return [];
      } catch (searchErr: any) {
        console.warn(`[ReportGenerator V164] Web search failed: "${query}" — ${searchErr.message}`);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    for (const batch of searchResults) {
      allResults.push(...batch);
    }

    if (allResults.length === 0) {
      console.warn(`[ReportGenerator V164] No web search results for ${assetClass} prices`);
      return '';
    }

    // Deduplicate by snippet prefix
    const unique = allResults.filter((result, idx, arr) =>
      arr.findIndex(r => r.slice(0, 60) === result.slice(0, 60)) === idx
    );

    console.log(`[ReportGenerator V164] Found ${unique.length} web results for ${assetClass} prices`);
    return `\n\nأسعار السوق الحالية من الإنترنت (${unique.length} نتيجة):\n${unique.join('\n')}`;
  } catch (error: any) {
    console.error('[ReportGenerator V164] Web search error:', error.message);
    return '';
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface ReportContext {
  event?: string;           // For special reports: event name
  assetClass?: AssetClass;  // For market analyses
  force?: boolean;          // Force generation even if one exists today
  scope?: string;           // global | arabic | regional
  wordCount?: number;       // Target word count for the report (overrides default maxTokens)
  prompt?: string;          // V68: Custom topic/prompt to base the report on
  title?: string;           // V68: Custom title for the report
}

export interface GeneratedReport {
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
  locale: string;  // 'ar' | 'en' | 'fr' — locale of the report content
}

export interface GeneratedAnalysis {
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
  locale: string;  // 'ar' | 'en' | 'fr' — locale of the analysis content
}

// ─── Data Collection Helpers ────────────────────────────────

interface CollectedNews {
  items: any[];
  categoryBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  avgSentimentScore: number;
}

interface CollectedIndicators {
  global: any[];
  arabic: any[];
  all: any[];
}

async function collectNews(since: Date, locale: string = 'ar'): Promise<CollectedNews> {
  try {
    const items = await db.newsItem.findMany({
      where: {
        isReady: true,
        locale,
        fetchedAt: { gte: since },
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        category: true,
        sentiment: true,
        sentimentScore: true,
        impactLevel: true,
        affectedAssets: true,
        fetchedAt: true,
      },
      take: 100, // V162: Increased from 60 to 100 for comprehensive report generation
      orderBy: { fetchedAt: 'desc' },
    });

    const categoryBreakdown: Record<string, number> = {};
    const sentimentBreakdown: Record<string, number> = {};
    let totalSentiment = 0;

    for (const item of items) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
      sentimentBreakdown[item.sentiment] = (sentimentBreakdown[item.sentiment] || 0) + 1;
      totalSentiment += item.sentimentScore;
    }

    return {
      items,
      categoryBreakdown,
      sentimentBreakdown,
      avgSentimentScore: items.length > 0 ? Math.round(totalSentiment / items.length) : 50,
    };
  } catch (error: any) {
    console.error('[ReportGenerator] Error collecting news:', error.message);
    return { items: [], categoryBreakdown: {}, sentimentBreakdown: {}, avgSentimentScore: 50 };
  }
}

async function collectIndicators(): Promise<CollectedIndicators> {
  try {
    const all = await db.marketIndicator.findMany({
      orderBy: { lastUpdated: 'desc' },
    });

    return {
      global: all.filter(i => i.region === 'global'),
      arabic: all.filter(i => i.region === 'arabic'),
      all,
    };
  } catch (error: any) {
    console.error('[ReportGenerator] Error collecting indicators:', error.message);
    return { global: [], arabic: [], all: [] };
  }
}

async function collectCalendarEvents(since: Date, until?: Date): Promise<any[]> {
  try {
    const where: any = { eventDate: { gte: since } };
    if (until) where.eventDate.lte = until;

    return db.calendarEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      take: 20,
    });
  } catch (error: any) {
    console.error('[ReportGenerator] Error collecting calendar events:', error.message);
    return [];
  }
}

async function collectAnalyses(since: Date, locale: string = 'ar'): Promise<any[]> {
  try {
    return db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        locale,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (error: any) {
    console.error('[ReportGenerator] Error collecting analyses:', error.message);
    return [];
  }
}

async function collectPreviousReports(reportType: string, since: Date, locale: string = 'ar'): Promise<any[]> {
  try {
    return db.economicReport.findMany({
      where: {
        reportType,
        isPublished: true,
        locale,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        summary: true,
        marketImpact: true,
        confidenceScore: true,
        keyIndicators: true,
        createdAt: true,
      },
    });
  } catch (error: any) {
    console.error('[ReportGenerator] Error collecting previous reports:', error.message);
    return [];
  }
}

// ─── V81: Anti-Hallucination Validation ─────────────────────
// Post-processing checks to detect and remove hallucinated content.

interface HallucinationReport {
  isClean: boolean;
  issues: string[];
  cleanedContent: string;
}

function detectHallucinations(content: string): HallucinationReport {
  const issues: string[] = [];
  let cleaned = content;

  // [1] Detect uniform increments in tables (e.g., +1.07 on every row)
  // Pattern: multiple rows where the difference between two adjacent numbers is the same
  const tableRows = cleaned.match(/\|[^|]+\|[^|]+\|[^|]+\|/g);
  if (tableRows && tableRows.length >= 3) {
    const diffs: number[] = [];
    for (const row of tableRows) {
      const nums = row.match(/\d+\.?\d*/g);
      if (nums && nums.length >= 2) {
        const diff = parseFloat(nums[nums.length - 1]) - parseFloat(nums[nums.length - 2]);
        if (!isNaN(diff)) diffs.push(Math.round(diff * 100) / 100);
      }
    }
    // If 3+ rows have the same diff, it's likely fabricated
    if (diffs.length >= 3) {
      const diffCounts: Record<string, number> = {};
      for (const d of diffs) {
        const key = d.toFixed(2);
        diffCounts[key] = (diffCounts[key] || 0) + 1;
      }
      for (const [diff, count] of Object.entries(diffCounts)) {
        if (count >= 3 && parseFloat(diff) !== 0) {
          issues.push(`Uniform increment detected: +${diff} added to ${count} rows — likely fabricated`);
        }
      }
    }
  }

  // [2] Detect repeated identical tables
  const tables = cleaned.match(/\|[^\n]+\n\|[-:\s|]+\n(\|[^\n]+\n)+/g);
  if (tables) {
    const seen = new Set<string>();
    for (const table of tables) {
      const normalized = table.replace(/\s+/g, ' ').trim();
      if (seen.has(normalized)) {
        issues.push('Identical table repeated — same data used for different events');
      }
      seen.add(normalized);
    }
  }

  // [3] Detect circular/repetitive recommendations
  const recSection = cleaned.match(/## توصيات رؤى[\s\S]*?(?=##|$)/i);
  if (recSection) {
    const recLines = recSection[0].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
    for (let i = 0; i < recLines.length; i++) {
      for (let j = i + 1; j < recLines.length; j++) {
        const similarity = stringSimilarity(recLines[i], recLines[j]);
        if (similarity > 0.8) {
          issues.push(`Circular recommendations: lines ${i+1} and ${j+1} are ${Math.round(similarity*100)}% similar`);
        }
      }
    }
  }

  // [4] Detect fabricated historical statistics pattern
  // Pattern: "في عام YYYY، [فعل] إلى X%" repeated for consecutive years
  const yearPattern = /في عام (?:20\d{2}|1\d{3})،.*?(?:إلى|انخفض|ارتفع).*?(\d+\.?\d*%)/g;
  const yearMatches = [...cleaned.matchAll(yearPattern)];
  if (yearMatches.length >= 3) {
    const values = yearMatches.map(m => parseFloat(m[1]));
    const years = yearMatches.map(m => m[0]);
    // Check if values look too convenient (round numbers, perfect trend)
    const allRound = values.every(v => v === Math.round(v * 10) / 10);
    if (allRound && values.length >= 3) {
      issues.push(`Fabricated historical statistics: ${values.length} consecutive years with suspiciously round values`);
    }
  }

  // [5] Remove sections that say "لا تتوفر بيانات" — they add no value
  cleaned = cleaned.replace(/##\s+[^\n]+\n+\s*لا تتوفر بيانات كافية حالياً\.?\s*/g, '');
  cleaned = cleaned.replace(/##\s+[^\n]+\n+\s*لم تُنشر آراء خبراء حول هذا الموضوع بعد\.?\s*/g, '');
  // V82: Also remove sections that are mostly generic filler
  cleaned = cleaned.replace(/##\s+[^\n]+\n+\s*لم تتوفر بيانات كافية لإنشاء هذا القسم[^\n]*\s*/g, '');
  cleaned = cleaned.replace(/##\s+[^\n]+\n+\s*يتم تحديث هذا القسم[^\n]*\s*/g, '');
  cleaned = cleaned.replace(/##\s+[^\n]+\n+\s*يرجى الرجوع إلى الأقسام الأخرى[^\n]*\s*/g, '');

  // V85: Detect similar (not just identical) repeated sentences across sections
  // Barclays problem: same idea repeated 4-6 times with minor rewording
  // Uses Jaccard word similarity — if >75% word overlap, it's essentially the same idea
  const similaritySentenceCounts: Record<string, number> = {};
  const allSentences2 = cleaned.split(/[.؟!؛]+/).map(s => s.trim()).filter(s => s.length > 20);
  const seenNorms: string[] = [];

  for (const s of allSentences2) {
    const normalized = s.replace(/\s+/g, ' ').replace(/[\u064B-\u065F]/g, '').trim();
    if (normalized.length < 20) continue;

    let matchedExisting = false;
    for (const existing of seenNorms) {
      if (Math.abs(existing.length - normalized.length) > normalized.length * 0.4) continue;
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existing.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      if (jaccard > 0.75) {
        // This is a near-duplicate of an existing sentence
        const key = existing.slice(0, 60);
        similaritySentenceCounts[key] = (similaritySentenceCounts[key] || 1) + 1;
        matchedExisting = true;
        break;
      }
    }

    if (!matchedExisting) {
      seenNorms.push(normalized);
    }
  }

  for (const [key, count] of Object.entries(similaritySentenceCounts)) {
    if (count >= 3) {
      issues.push(`Repeated similar sentence (${count}x, >75% word overlap): "${key}..."`);
    }
  }

  // V86: Fix mixed Arabic/Latin in content — TRANSLITERATE instead of delete
  // "باركلAYS" → "باركليز" (not "باركل" — broken!)
  if (/[\u0600-\u06FF]/.test(cleaned) && /[a-zA-Z]{2,}/.test(cleaned)) {
    // Step 1: Transliterate known company names
    const sortedNames = Object.keys(COMPANY_TRANSLITERATIONS).sort((a, b) => b.length - a.length);
    for (const engName of sortedNames) {
      const araName = COMPANY_TRANSLITERATIONS[engName];
      if (new RegExp(engName, 'i').test(cleaned)) {
        cleaned = cleaned.replace(new RegExp(engName, 'gi'), araName);
        issues.push(`Mixed Arabic/Latin text: transliterated "${engName}" → "${araName}"`);
      }
    }

    // Step 2: Remove remaining Latin runs attached to Arabic (not in dictionary)
    const validAbbr = new Set([
      'GDP', 'S&P', 'AI', 'ETF', 'IPO', 'OTC', 'EPS', 'PE', 'EBITDA',
      'NYMEX', 'COMEX', 'ICE', 'NYSE', 'NASDAQ', 'LSE', 'TSE', 'ASX',
      'CME', 'CBOT', 'FOMC', 'CPI', 'PMI',
      'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
      'WTI', 'BZ', 'CL', 'NG', 'GC', 'SI', 'XAU', 'XAG',
      'VIX', 'DXY', 'SPX', 'NDX', 'DAX', 'CAC', 'FTSE', 'NKY',
      'BTC', 'ETH', 'USDT', 'USDC', 'HSBC', 'FED', 'OPEC', 'IMF',
      'RSI', 'MACD', 'EMA', 'SMA',
    ]);

    const latinRuns = cleaned.match(/[a-zA-Z]+/g) || [];
    for (const run of latinRuns) {
      const isAttachedToArabic = new RegExp(`[\\u0600-\\u06FF]${run}|${run}[\\u0600-\\u06FF]`).test(cleaned);
      const isValid = validAbbr.has(run.toUpperCase());
      if (isAttachedToArabic && !isValid) {
        cleaned = cleaned.replace(new RegExp(run, 'g'), '');
        issues.push(`Mixed Arabic/Latin text: removed "${run}" embedded in Arabic (no transliteration found)`);
      }
    }
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  }

  // Clean up excessive newlines left by removed sections
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n');

  // V400: Remove email addresses from content (journalist email leaks)
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = cleaned.match(emailPattern);
  if (emailMatches && emailMatches.length > 0) {
    issues.push(`Email addresses leaked in content (${emailMatches.length} found): removed`);
    cleaned = cleaned.replace(emailPattern, '');
  }

  // V400: Remove AI filler words ("حسناً" acknowledgment token)
  if (/حسناً|حسنا،/.test(cleaned)) {
    issues.push('AI filler word "حسناً" detected — removed');
    cleaned = cleaned.replace(/\bحسناً[،.]?\s*/g, '');
    cleaned = cleaned.replace(/\bحسنا،\s*/g, '');
    cleaned = cleaned.replace(/\bحسنا\b/g, '');
  }

  // V400: Remove Devanagari/Hindi characters from Arabic text
  const devanagariPattern = /[\u0900-\u097F]+/g;
  if (devanagariPattern.test(cleaned)) {
    issues.push('Devanagari/Hindi characters detected in Arabic text — removed');
    cleaned = cleaned.replace(devanagariPattern, '');
  }

  // V400: Decode HTML entities
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&#x27;/g, "'");
  cleaned = cleaned.replace(/&quot;/g, '"');

  // V400: Detect and remove glitch phrase loops (same phrase repeated 3+ times)
  const lines = cleaned.split('\n');
  const filteredLines: string[] = [];
  let repeatCount = 0;
  let lastNormalizedLine = '';
  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, ' ');
    if (normalized === lastNormalizedLine && normalized.length > 10) {
      repeatCount++;
      if (repeatCount >= 2) {
        if (repeatCount === 2) {
          issues.push(`Glitch phrase loop detected: "${normalized.slice(0, 60)}..." repeated 3+ times — duplicates removed`);
        }
        continue; // Skip 3rd and subsequent repetitions
      }
    } else {
      repeatCount = 0;
    }
    lastNormalizedLine = normalized;
    filteredLines.push(line);
  }
  cleaned = filteredLines.join('\n');

  // V400: Remove common untranslated English financial terms in Arabic context
  const arabicContextTerms: [RegExp, string][] = [
    [/(?<=[\u0600-\u06FF])\s+dividend\s*(?=[\u0600-\u06FF])/gi, ' توزيعات أرباح '],
    [/(?<=[\u0600-\u06FF])\s+fund\s*(?=[\u0600-\u06FF])/gi, ' صندوق '],
    [/(?<=[\u0600-\u06FF])\s+declares\s*(?=[\u0600-\u06FF])/gi, ' يعلن '],
  ];
  for (const [pattern, replacement] of arabicContextTerms) {
    if (pattern.test(cleaned)) {
      issues.push(`Untranslated English term in Arabic context — replaced with Arabic`);
      cleaned = cleaned.replace(pattern, replacement);
    }
  }

  // V76: Detect catastrophic mistranslations
  if (/هشامات/.test(cleaned)) {
    issues.push('Catastrophic mistranslation: "هشامات" should be "رقائق إلكترونية" (chips/semiconductors)');
    cleaned = cleaned.replace(/الهشامات/g, 'الرقائق الإلكترونية');
    cleaned = cleaned.replace(/هشامات/g, 'رقائق إلكترونية');
  }

  // V76: Detect Spanish words leaking into Arabic
  if (/sesión|sesiones|pero|para(?!\s*م)/.test(cleaned)) {
    issues.push('Foreign (Spanish) words detected in Arabic text');
    cleaned = cleaned.replace(/sesión/gi, 'جلسة');
    cleaned = cleaned.replace(/sesiones/gi, 'جلسات');
  }

  // V85: Detect repeated identical sentences across sections
  // This happens when AI fills sections with generic filler instead of unique content
  const allSentences = cleaned.split(/[.؟!؛]+/).map(s => s.trim()).filter(s => s.length > 30);
  const sentenceCounts: Record<string, number> = {};
  for (const s of allSentences) {
    const normalized = s.replace(/\s+/g, ' ').trim();
    if (normalized.length > 30) {
      sentenceCounts[normalized] = (sentenceCounts[normalized] || 0) + 1;
    }
  }
  for (const [sentence, count] of Object.entries(sentenceCounts)) {
    if (count >= 3) {
      issues.push(`Repeated identical sentence (${count}x): "${sentence.slice(0, 80)}..."`);
      // Keep only first occurrence, remove subsequent duplicates
      let firstFound = false;
      cleaned = cleaned.split(/[.؟!؛]+/).map(part => {
        const trimmed = part.trim().replace(/\s+/g, ' ');
        if (trimmed === sentence) {
          if (firstFound) return ''; // Remove duplicate
          firstFound = true;
        }
        return part;
      }).filter(p => p.trim()).join('.');
    }
  }

  // V85: Fix "ضوء اليوم" — literal mistranslation of "Highlight"
  cleaned = cleaned.replace(/ضوء اليوم/g, 'أبرز الأحداث');
  cleaned = cleaned.replace(/أضواء اليوم/g, 'أبرز الأحداث');
  // V85: Fix "indicating overbought conditions" and similar English phrase leaks
  cleaned = cleaned.replace(/indicating overbought conditions/gi, 'مُشيراً إلى ظروف شرائية مفرطة');
  cleaned = cleaned.replace(/indicating oversold conditions/gi, 'مُشيراً إلى ظروف بيعية مفرطة');
  cleaned = cleaned.replace(/indicating\s+/gi, 'مُشيراً إلى ');
  // V85: Fix other common English phrases leaking
  cleaned = cleaned.replace(/overbought conditions/gi, 'ظروف شرائية مفرطة');
  cleaned = cleaned.replace(/oversold conditions/gi, 'ظروف بيعية مفرطة');

  // V219: Arabic spell check — common AI typos
  cleaned = cleaned.replace(/تكاليس/g, 'تكاليف');
  cleaned = cleaned.replace(/التكاليس/g, 'التكاليف');
  cleaned = cleaned.replace(/الإستهلاك/g, 'الاستهلاك');
  cleaned = cleaned.replace(/إقتصادي/g, 'اقتصادي');
  cleaned = cleaned.replace(/الإقتصادي/g, 'الاقتصادي');
  cleaned = cleaned.replace(/إستثمار/g, 'استثمار');
  cleaned = cleaned.replace(/الإستثمار/g, 'الاستثمار');
  cleaned = cleaned.replace(/إستراتيجية/g, 'استراتيجية');
  cleaned = cleaned.replace(/الإستراتيجية/g, 'الاستراتيجية');
  cleaned = cleaned.replace(/إستقرار/g, 'استقرار');
  cleaned = cleaned.replace(/الإستقرار/g, 'الاستقرار');

  // V76: Detect dinar used instead of dollar in US market context
  if (/دينار أمريكي/.test(cleaned)) {
    issues.push('Mistranslation: "دينار أمريكي" should be "دولار أمريكي"');
    cleaned = cleaned.replace(/دينار أمريكي/g, 'دولار أمريكي');
  }

  // V76: Detect inverted economic logic (production cut → price drop)
  if ((/خفض الإنتاج/.test(cleaned) || /خفض العرض/.test(cleaned)) && 
      (/تراجع الأسعار|انخفاض الأسعار|هبوط الأسعار/.test(cleaned))) {
    const beforeLen = cleaned.length;
    cleaned = cleaned.replace(/تراجع أسعار (النفط|السلع|الذهب) بسبب خفض الإنتاج/g, 'ارتفعت أسعار $1 بسبب خفض الإنتاج');
    cleaned = cleaned.replace(/انخفاض أسعار (النفط|السلع|الذهب) بسبب خفض الإنتاج/g, 'ارتفعت أسعار $1 بسبب خفض الإنتاج');
    cleaned = cleaned.replace(/تراجع الأسعار بسبب خفض العرض/g, 'ارتفعت الأسعار بسبب خفض العرض');
    if (cleaned.length !== beforeLen) {
      issues.push('Inverted economic logic: production/supply cut does NOT lower prices — it raises them');
    }
  }

  // Clean up excessive newlines left by removed sections
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n');

  // V85: Remove known filler sentences that AI uses to pad sections
  const fillerSentences = [
    /يعد هذا العامل من أبرز المحركات المؤثرة على السوق حالياً[،.]/g,
    /يؤثر بشكل مباشر على قرارات المستثمرين وتحركات رؤوس الأموال[،.]/g,
    /من أبرز العوامل المؤثرة على السوق في الوقت الراهن[،.]/g,
    /يُعد من أهم العوامل التي تؤثر على توجهات السوق[،.]/g,
  ];
  for (const pattern of fillerSentences) {
    if (pattern.test(cleaned)) {
      issues.push(`Filler sentence detected and removed: ${pattern.source.slice(0, 60)}...`);
      cleaned = cleaned.replace(pattern, '');
    }
  }
  // Clean up again after filler removal
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n');

  return {
    isClean: issues.length === 0,
    issues,
    cleanedContent: cleaned,
  };
}

// ─── V227: Speculation Detection Gate ───────────────────────
// Prevents publishing reports that are filled with speculative language
// (قد, محتمل, ربما, يتوقع, قد يؤدي) when there isn't enough real data.
// The AI fills the gap with speculation instead of admitting insufficient data.
// Solution: count speculative words, require specific numbers per section.

interface SpeculationReport {
  speculationScore: number;       // 0-100, higher = more speculative
  speculationWordCount: number;   // Total count of speculative words
  totalWordCount: number;         // Total word count for context
  speculativeSections: string[];  // Section keys that are purely speculative
  hasSpecificNumbers: boolean;    // Whether the content contains concrete data
  shouldRepublish: boolean;       // True if speculation > 15 → regenerate
  shouldNotPublish: boolean;      // True if speculation > 25 → don't publish
  reason: string;
}

// V234: Split speculation detection into two tiers:
// - STRONG speculative phrases: clearly speculative language (counts as 2)
// - WEAK speculative words: "قد" etc. which can be used legitimately (counts as 1)
// "قد" is one of the most common Arabic words — it means "may/might" but also
// "already/has" (e.g., "السوق قد شهد تراجعاً" = "the market has already seen a decline").
// Counting every "قد" as a speculative word was causing 25+ count false positives.
const STRONG_SPECULATIVE_PHRASES = [
  'قد يؤدي', 'قد يشهد', 'قد يصل', 'قد يتراجع', 'قد يرتفع',
  'قد يؤثر', 'قد تؤدي', 'قد تتأثر', 'قد يزداد', 'قد تنخفض',
  'قد يحصل', 'قد يحدث', 'من المحتمل', 'من المتوقع',
  'من المرجح', 'يُرجح', 'يُتوقع أن', 'يمكن أن',
];
const WEAK_SPECULATIVE_WORDS = [
  'قد', 'محتمل', 'ربما', 'يتوقع', 'يحتمل', 'يُتوقع', 'يتردد', 'يُحتمل',
];

function detectSpeculation(
  content: string,
  sectionKeys?: string[],
): SpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0,
      speculationWordCount: 0,
      totalWordCount: 0,
      speculativeSections: [],
      hasSpecificNumbers: false,
      shouldRepublish: false,
      shouldNotPublish: false,
      reason: 'Content too short for speculation analysis',
    };
  }

  // V234: Count speculative words with two-tier system.
  // Strong phrases (like "قد يؤدي") count as 2 because they're clearly speculative.
  // Weak words (like "قد" alone) count as 1 because they can be legitimate.
  // We also don't count "قد" when it's part of a strong phrase (avoid double-counting).
  let speculationWordCount = 0;
  
  // First, count strong phrases (each counts as 2)
  for (const phrase of STRONG_SPECULATIVE_PHRASES) {
    const regex = new RegExp(phrase, 'g');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length * 2;
    }
  }
  
  // Then, count weak words ONLY when not already part of a strong phrase
  // For "قد": only count standalone uses (not followed by a verb = speculative)
  // "قد شهد" (has already witnessed) is NOT speculative — it's a completed action
  // "قد يرتفع" (might rise) IS speculative — followed by present tense verb
  for (const word of WEAK_SPECULATIVE_WORDS) {
    if (word === 'قد') {
      // Count "قد" only when followed by a present/imperfect tense verb (يـ/تـ/أ/نـ prefix)
      // "قد يرتفع" (might rise) = speculative → count
      // "قد شهد" (has witnessed) = completed action → don't count
      // "قد وصل" (has arrived) = completed action → don't count
      const speculativeQadRegex = /قد\s+[يأتن]/g;
      const speculativeQadMatches = content.match(speculativeQadRegex);
      if (speculativeQadMatches) {
        // Subtract those already counted as part of strong phrases
        let doubleCounted = 0;
        for (const phrase of STRONG_SPECULATIVE_PHRASES) {
          if (phrase.startsWith('قد')) {
            const phraseRegex = new RegExp(phrase, 'g');
            const phraseMatches = content.match(phraseRegex);
            if (phraseMatches) doubleCounted += phraseMatches.length;
          }
        }
        speculationWordCount += Math.max(0, speculativeQadMatches.length - doubleCounted);
      }
    } else {
      // Other weak words — count normally
      const regex = new RegExp(word, 'g');
      const matches = content.match(regex);
      speculationWordCount += matches ? matches.length : 0;
    }
  }

  // Total word count
  const totalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  // Speculation score: ratio of speculative words to total words, scaled to 0-100
  // Normal content has <5% speculative words. Bad content has >10%.
  const speculationRatio = totalWordCount > 0 ? speculationWordCount / totalWordCount : 0;
  const speculationScore = Math.min(100, Math.round(speculationRatio * 500)); // 5% = score 25, 10% = score 50

  // Check for specific numbers (digits, percentages, currency amounts)
  // A report with real data has: prices (100.5), percentages (3.2%), currency ($50B), etc.
  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|\$[\d,]+|[\d,]+\s*(?:مليار|مليون|ألف|تريليون|دولار|جنيه|ريال|درهم)|\d+[\.,]?\d*/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3; // At least 3 specific numbers

  // Check per-section speculation (if sectionKeys provided)
  const speculativeSections: string[] = [];
  if (sectionKeys && sectionKeys.length > 0) {
    for (const key of sectionKeys) {
      // Try to find section content by heading or key
      const sectionRegex = new RegExp(`(?:##\\s*[^\\n]*${key}|##\\s*[^\\n]*\\n)((?:(?!##)[^\\n]+\\n?)*)`, 'gi');
      const sectionMatch = content.match(sectionRegex);
      if (sectionMatch) {
        const sectionContent = sectionMatch.join(' ');
        let sectionSpecCount = 0;
        // V234: Use the combined speculation word lists for section-level check
        const allSpecWords = [...STRONG_SPECULATIVE_PHRASES, ...WEAK_SPECULATIVE_WORDS];
        for (const word of allSpecWords) {
          const matches = sectionContent.match(new RegExp(word, 'g'));
          sectionSpecCount += matches ? matches.length : 0;
        }
        // A section is speculative if >10 speculative words (higher threshold with V234 counting)
        if (sectionSpecCount > 10) {
          speculativeSections.push(key);
        }
      }
    }
  }

  // V235: Further relaxed thresholds — Arabic financial writing NATURALLY uses
  // speculative language (قد، محتمل، من المتوقع) which is professional, not problematic.
  // The old thresholds (20/35) were blocking virtually ALL reports from publishing.
  // A daily report covering 100 news items will have ~25-40 speculative phrases
  // simply from describing market expectations and analyst opinions.
  // Only block if the report is TRULY hollow (no numbers, all speculation).
  const shouldRepublish = speculationWordCount > 60;
  const shouldNotPublish = speculationWordCount > 90 && !hasSpecificNumbers;

  let reason = 'Content is data-driven';
  if (shouldNotPublish) {
    reason = `Excessive speculation: ${speculationWordCount} speculative words (>25 threshold). Content lacks real data.`;
  } else if (shouldRepublish) {
    reason = `High speculation: ${speculationWordCount} speculative words (>15 threshold). Should regenerate with more data.`;
  } else if (!hasSpecificNumbers) {
    reason = `Low speculation count (${speculationWordCount}) but no specific numbers found — content may be vague.`;
  }

  return {
    speculationScore,
    speculationWordCount,
    totalWordCount,
    speculativeSections,
    hasSpecificNumbers,
    shouldRepublish,
    shouldNotPublish,
    reason,
  };
}

/**
 * V227: Check if a section contains at least one specific number/figure.
 * Sections without any concrete data are filled with speculation.
 */
function sectionHasSpecificData(sectionContent: string): boolean {
  if (!sectionContent || sectionContent.trim().length < 20) return false;

  // Look for:
  // 1. Percentages: 3.2%, ٥٠٪
  // 2. Prices: $100, ٥٠٠٠ ريال
  // 3. Numbers with units: 2.5 مليون, 100 مليار
  // 4. Point values: 4,500, 3.14
  const hasPercentage = /\d+[\.,]?\d*\s*[%٪]/.test(sectionContent);
  const hasPriceAmount = /[\$€£¥]\s*[\d,]+/.test(sectionContent) || /\d+[\.,]?\d*\s*(?:ريال|دولار|درهم|جنيه|يورو|دينار)/.test(sectionContent);
  const hasQuantity = /\d+[\.,]?\d*\s*(?:مليون|مليار|تريليون|ألف)/.test(sectionContent);
  const hasPointValue = /\d{1,3}(?:,\d{3})+/.test(sectionContent) || /\d+\.\d{1,2}/.test(sectionContent);
  const hasArabicNumber = /[٠-٩]{2,}/.test(sectionContent);

  return hasPercentage || hasPriceAmount || hasQuantity || hasPointValue || hasArabicNumber;
}

// ─── V221: Content Substantiality Gate ──────────────────────
// Prevents saving/publishing reports with empty/placeholder content.
// The AI sometimes returns content that is structurally present but
// substantively empty — just dots, percentages, empty parentheses,
// or fragment patterns (e.g., ". . .", "(.% )", "** **").
// This function detects such content and marks it as not publishable.

interface ContentSubstantialityResult {
  isSubstantial: boolean;
  reason?: string;
  arabicWordCount: number;
  placeholderRatio: number;
}

function isContentSubstantial(content: string, assetClass?: string): ContentSubstantialityResult {
  if (!content || typeof content !== 'string') {
    return { isSubstantial: false, reason: 'Content is empty or not a string', arabicWordCount: 0, placeholderRatio: 1 };
  }

  // Strip markdown formatting to get raw text
  const rawText = content
    .replace(/^#{1,6}\s+.*$/gm, '')   // Remove markdown headings
    .replace(/\|[^\n]*\|/g, '')         // Remove table rows
    .replace(/[-*•]\s*/g, '')           // Remove bullet markers
    .replace(/\*\*([^*]*)\*\*/g, '$1') // Remove bold markers
    .replace(/\*([^*]*)\*/g, '$1')     // Remove italic markers
    .replace(/`[^`]*`/g, '')             // Remove inline code
    .replace(/^---+$/gm, '')             // Remove horizontal rules
    .trim();

  if (rawText.length < 50) {
    return { isSubstantial: false, reason: `Raw text too short: ${rawText.length} chars`, arabicWordCount: 0, placeholderRatio: 1 };
  }

  // Count Arabic words (3+ consecutive Arabic chars = a word)
  const arabicWords = rawText.match(/[\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{2,})*/g) || [];
  const arabicWordCount = arabicWords.length;

  // V235: Lowered Arabic word thresholds — the old thresholds were too strict
  // and caused legitimate reports to be blocked. A report with 10 Arabic words
  // plus lots of data tables and numbers is still substantial.
  const ASSET_CLASS_MIN_WORDS: Record<string, number> = {
    crypto: 5,               // BTC, ETH, IBIT, ETF flows — lots of English numbers
    forex: 5,                // EUR/USD, JPY, DXY — currency pairs are English
    technicalAnalysis: 5,    // RSI, MACD, Fibonacci — technical terms are English
    energy: 6,               // WTI, Brent, EIA, API — mixed but more Arabic
    stocks: 6,               // SPX, NDX, QQQ — some English tickers
    commodities: 6,          // XAU, XAG — some English
    bonds: 7,                // US10Y, Bund — moderate English
    banking: 7,              // Mix of Arabic/English
    economy: 9,              // Mostly Arabic content
    arabMarkets: 9,          // Mostly Arabic content
    realEstate: 9,           // Mostly Arabic content
    earnings: 6,             // EPS, P/E — some English
    strategic: 9,            // Mostly Arabic content
  };
  const minArabicWords = assetClass ? (ASSET_CLASS_MIN_WORDS[assetClass] || 15) : 15;

  // Count placeholder patterns — these indicate empty/template content
  const placeholderPatterns = [
    /\.\.\./g,                           // Three dots
    /\.\s*\.\s*\./g,                     // Dots with spaces
    /\(\s*\)/g,                          // Empty parentheses
    /\(\s*\.%\s*\)/g,                    // Empty percentage in parens
    /\*\*\s*\*\*/g,                      // Empty bold markers
    /\s{10,}/g,                           // Excessive whitespace
    /^[.\s%-]+$/gm,                      // Lines that are only dots/spaces/percentages
  ];

  let placeholderCharCount = 0;
  for (const pattern of placeholderPatterns) {
    const matches = rawText.match(pattern) || [];
    for (const m of matches) {
      placeholderCharCount += m.length;
    }
  }

  // Also count lines that are ONLY numbers/symbols (no Arabic text)
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  let emptyLines = 0;
  for (const line of lines) {
    const lineArabicChars = (line.match(/[\u0600-\u06FF]/g) || []).length;
    const lineLatinChars = (line.match(/[a-zA-Z]/g) || []).length;
    if (lineArabicChars < 3 && lineLatinChars < 3) {
      emptyLines++;
    }
  }

  const totalTextLen = Math.max(rawText.length, 1);
  const placeholderRatio = (placeholderCharCount + emptyLines * 5) / totalTextLen;

  // Content is NOT substantial if:
  // 1. Very few Arabic words in a report that should have hundreds
  // V222: Dynamic threshold — crypto/forex need fewer Arabic words
  if (arabicWordCount < minArabicWords) {
    return {
      isSubstantial: false,
      reason: `Too few Arabic words: ${arabicWordCount} (minimum ${minArabicWords} required for ${assetClass || 'unknown'} asset class)`,
      arabicWordCount,
      placeholderRatio,
    };
  }

  // 2. High ratio of placeholder patterns (> 30% of text)
  if (placeholderRatio > 0.3) {
    return {
      isSubstantial: false,
      reason: `High placeholder ratio: ${(placeholderRatio * 100).toFixed(1)}% (max 30% allowed)`,
      arabicWordCount,
      placeholderRatio,
    };
  }

  // 3. More than 60% of lines are empty/symbol-only
  if (lines.length > 5 && emptyLines / lines.length > 0.6) {
    return {
      isSubstantial: false,
      reason: `Too many empty lines: ${emptyLines}/${lines.length} (${(emptyLines / lines.length * 100).toFixed(1)}%)`,
      arabicWordCount,
      placeholderRatio,
    };
  }

  return { isSubstantial: true, arabicWordCount, placeholderRatio };
}

// ─── V219: Expert Hallucination Detector — CODE-LEVEL enforcement ──
// The AI still invents expert names despite prompt rules because the
// alternative ("لم تُنشر آراء خبراء") isn't compelling enough.
// This function EXTRACTS expert names from the generated content
// and CROSS-REFERENCES them against the source news data.
// Any expert not found in source data is stripped.

interface ExpertVerificationResult {
  cleanedContent: string;
  hallucinatedExperts: string[];
  verifiedExperts: string[];
}

function verifyExpertsAgainstSource(
  content: string,
  sourceNewsItems: any[],
): ExpertVerificationResult {
  const hallucinatedExperts: string[] = [];
  const verifiedExperts: string[] = [];

  // Build a set of all person names mentioned in source news
  // These are the ONLY experts allowed in the report
  const sourceNames = new Set<string>();
  for (const item of sourceNewsItems) {
    const text = `${item.title || ''} ${item.summary || ''} ${item.titleAr || ''} ${item.summaryAr || ''} ${item.contentAr || ''}`;
    // Extract Arabic names (3+ consecutive Arabic words starting with "ال" or a known name pattern)
    // Pattern: "د. فلان الفلاني" or "محمد فلان" or "أحمد فلان الفلاني"
    const namePatterns = [
      // Pattern with Dr. title
      /(?:د\.|دكتور|بروفيسور)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
      // Pattern with title then name
      /(?:السيد|السيدة|الأستاذ|الشيخ|المهندس)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
      // Name with institution pattern — captures names BEFORE institution keywords
      /([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,2})[,\s،]*(?:من|في|رئيس|مدير|محلل|خبير|اقتصادي)/g,
    ];
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length >= 6) {
          sourceNames.add(name);
        }
      }
    }
  }

  // If no source names found at all, that means no experts were in the data
  const hasSourceExperts = sourceNames.size > 0;

  // Find the "آراء الخبراء" section in the generated content
  const expertSectionMatch = content.match(
    /##?\s*(?:آراء|آراء الخبراء|خبراء| Expert|Experts)[\s\S]*?(?=##?\s|$)/i
  );

  if (!expertSectionMatch) {
    // No expert section found — nothing to verify
    return { cleanedContent: content, hallucinatedExperts: [], verifiedExperts: [] };
  }

  const expertSection = expertSectionMatch[0];

  // Extract expert names from the generated content
  const generatedExpertPatterns = [
    /(?:د\.|دكتور|بروفيسور)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
    /(?:السيد|السيدة|الأستاذ|الشيخ|المهندس)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
    // Names followed by positions like "— كبير الاقتصاديين" or "، محلل مالي"
    /([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,2})[,\s،]*—?\s*(?:(?:كبير|رئيس|مدير|محلل|خبير|اقتصادي|مستشار|نائب))/g,
    // Bullet point expert entries: "- محمد الفايد — معهد..."
    /[-•*]\s*([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,2})[,\s،]*—?\s*(?:(?:كبير|رئيس|مدير|محلل|خبير|اقتصادي|مستشار|نائب|من|في))/g,
  ];

  const generatedExperts = new Map<string, string>(); // name → full line
  for (const pattern of generatedExpertPatterns) {
    let match;
    const sectionText = expertSection;
    while ((match = pattern.exec(sectionText)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length >= 6) {
        // Capture the full line containing this name
        const lineStart = sectionText.lastIndexOf('\n', match.index) + 1;
        const lineEnd = sectionText.indexOf('\n', match.index);
        const fullLine = sectionText.slice(lineStart, lineEnd > 0 ? lineEnd : sectionText.length).trim();
        generatedExperts.set(name, fullLine);
      }
    }
  }

  // If no source experts exist, ALL generated experts are hallucinated
  if (!hasSourceExperts) {
    let cleaned = content;
    for (const [name, line] of generatedExperts) {
      hallucinatedExperts.push(name);
      // Remove the line containing this fabricated expert
      const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`^${escapedLine}$`, 'gm'), '');
    }

    // Replace the entire expert section with the honest statement
    if (hallucinatedExperts.length > 0) {
      cleaned = cleaned.replace(
        /##?\s*(?:آراء|آراء الخبراء|خبراء)[^\n]*\n[\s\S]*?(?=##?\s|$)/i,
        '## آراء الخبراء\nلم تُنشر آراء خبراء حول هذا الموضوع بعد.\n\n'
      );
      console.warn(`[ReportGenerator V219] 🚨 STRIPPED ${hallucinatedExperts.length} HALLUCINATED EXPERTS (no experts in source data): ${hallucinatedExperts.join(', ')}`);
    }

    return { cleanedContent: cleaned, hallucinatedExperts, verifiedExperts: [] };
  }

  // If source experts exist, check each generated expert against them
  let cleaned = content;
  for (const [name, line] of generatedExperts) {
    let isVerified = false;
    // Check if any part of the name appears in source names (fuzzy match)
    const nameWords = name.split(/\s+/).filter(w => w.length > 3);
    for (const sourceName of sourceNames) {
      const sourceWords = sourceName.split(/\s+/).filter(w => w.length > 3);
      // If at least 2 words match, consider it verified
      const matchCount = nameWords.filter(nw =>
        sourceWords.some(sw => stringSimilarity(nw, sw) > 0.8)
      ).length;
      if (matchCount >= Math.min(2, nameWords.length)) {
        isVerified = true;
        break;
      }
    }

    if (isVerified) {
      verifiedExperts.push(name);
    } else {
      hallucinatedExperts.push(name);
      const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`^${escapedLine}$`, 'gm'), '');
    }
  }

  if (hallucinatedExperts.length > 0) {
    console.warn(`[ReportGenerator V219] 🚨 STRIPPED ${hallucinatedExperts.length} HALLUCINATED EXPERTS: ${hallucinatedExperts.join(', ')}`);
    console.log(`[ReportGenerator V219] ✓ VERIFIED ${verifiedExperts.length} experts: ${verifiedExperts.join(', ')}`);
  }

  // Clean up empty lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return { cleanedContent: cleaned, hallucinatedExperts, verifiedExperts };
}

// ─── V222: "لا تنشر" Publish Gate — CODE-LEVEL enforcement ──
// The AI writes "تصنيف النشر: لا تنشر" when confidence ≤ 6/10,
// but the code previously IGNORED this text and published anyway.
// This function scans the content for "لا تنشر" or low-confidence
// indicators and returns whether the report should be suppressed.
// Applies to ALL report categories (stocks, crypto, commodities, etc.)

interface DoNotPublishResult {
  shouldSuppress: boolean;
  reason?: string;
  extractedConfidence?: number; // 1-10 scale from AI text
}

function checkDoNotPublishDirective(content: string, rawAiContent?: string): DoNotPublishResult {
  // Check both the structured content and raw AI content
  const textToCheck = `${content} ${rawAiContent || ''}`;

  // V234: Fixed overly broad "لا تنشر" gate.
  // The old pattern /لا\s*تنشر/i matched ANY occurrence of "لا تنشر"
  // in Arabic text — even legitimate uses like "لا تنشر الفوضى"
  // (don't spread chaos), "لا تنشر المعلومات" (don't share information), etc.
  //
  // Now we ONLY match the EXACT AI directive format:
  // - "تصنيف النشر: لا تنشر" (classification: do not publish)
  // - "لا تنشر — يحتاج مراجعة" (do not publish — needs review)
  // - "لا تنشر - يحتاج مراجعة" (with dash variant)
  //
  // We EXCLUDE matches where "لا تنشر" is followed by a normal Arabic word
  // (indicating it's a general negative imperative, not a publishing directive).
  const doNotPublishPatterns = [
    /تصنيف\s*النشر\s*:\s*لا\s*تنشر(?:\s*[—\-–]*\s*يحتاج\s*مراجعة)?\s*$/im, // End of line — directive only
    /تصنيف\s*النشر\s*:\s*لا\s*تنشر\s*[—\-–]/im,  // Followed by dash — needs review
    /^\s*لا\s*تنشر\s*[—\-–]*\s*يحتاج\s*مراجعة\s*$/im, // Standalone "لا تنشر — يحتاج مراجعة"
  ];
  for (const pattern of doNotPublishPatterns) {
    if (pattern.test(textToCheck)) {
      return {
        shouldSuppress: true,
        reason: 'AI issued explicit "لا تنشر" directive in content',
      };
    }
  }

  // Pattern 2: Extract AI confidence score from text (X/10 format)
  const confidencePatterns = [
    /مستوى\s*الثقة\s*[:\s]*(\d+)\s*\/\s*10/i,
    /ثقة\s*[:\s]*(\d+)\s*\/\s*10/i,
    /تصنيف\s*الثقة\s*[:\s]*(\d+)\s*\/\s*10/i,
    /confidence\s*[:\s]*(\d+)\s*\/\s*10/i,
  ];
  for (const pattern of confidencePatterns) {
    const match = textToCheck.match(pattern);
    if (match) {
      const score = parseInt(match[1], 10);
      if (score >= 1 && score <= 10) {
        if (score <= 6) {
          return {
            shouldSuppress: true,
            reason: `AI confidence ${score}/10 is at or below threshold (6/10 = do not publish)`,
            extractedConfidence: score,
          };
        }
        // Return extracted confidence even if publishable (useful for score correction)
        return { shouldSuppress: false, extractedConfidence: score };
      }
    }
  }

  // Pattern 3: Check for "ثقة: 3/10" or similar in executive summary
  const lowConfidenceInSummary = textToCheck.match(/ثقة\s*[:\s]*(\d+)\s*\/\s*10/gi);
  if (lowConfidenceInSummary) {
    for (const match of lowConfidenceInSummary) {
      const numMatch = match.match(/(\d+)\s*\/\s*10/);
      if (numMatch) {
        const score = parseInt(numMatch[1], 10);
        if (score <= 6) {
          return {
            shouldSuppress: true,
            reason: `Low confidence ${score}/10 detected in report content`,
            extractedConfidence: score,
          };
        }
      }
    }
  }

  return { shouldSuppress: false };
}

// ─── V219: Arabic Spell Check Dictionary ──────────────────
// Common Arabic typos and their corrections that the AI makes.
// Applied as a post-processing step before publishing.
const ARABIC_SPELL_CORRECTIONS: [RegExp, string][] = [
  // تكاليس → تكاليف (AI consistently misspells this)
  [/تكاليس/g, 'تكاليف'],
  [/التكاليس/g, 'التكاليف'],
  // Other common AI typos
  [/الإستهلاك/g, 'الاستهلاك'],
  [/إقتصادي/g, 'اقتصادي'],
  [/الإقتصادي/g, 'الاقتصادي'],
  [/إستثمار/g, 'استثمار'],
  [/الإستثمار/g, 'الاستثمار'],
  [/إستراتيجية/g, 'استراتيجية'],
  [/الإستراتيجية/g, 'الاستراتيجية'],
  [/إستقرار/g, 'استقرار'],
  [/الإستقرار/g, 'الاستقرار'],
  // Common confused words
  [/بأثر\s+راجع/g, 'بأثر رجعي'],
  [/سياسات\s+نقدية\s+توسعية/g, 'سياسات نقدية توسّعية'],
  // V221: More common AI typos
  [/إستخدام/g, 'استخدام'],        // Not إستخدام but استخدام
  [/الإستخدام/g, 'الاستخدام'],
  [/إستجابة/g, 'استجابة'],        // Not إستجابة but استجابة
  [/الإستجابة/g, 'الاستجابة'],
  [/إستمرار/g, 'استمرار'],        // Not إستمرار but استمرار
  [/الإستمرار/g, 'الاستمرار'],
  [/إستبعاد/g, 'استبعاد'],        // Not إستبعاد but استبعاد
  [/الإستبعاد/g, 'الاستبعاد'],
  [/إستفادة/g, 'استفادة'],        // Not إستفادة but استفادة
  [/الإستفادة/g, 'الاستفادة'],
  // V221: Common financial term typos
  [/تضخمم/g, 'تضخم'],             // Double mim
  [/إرتفع/g, 'ارتفع'],            // Not إرتفع but ارتفع
  [/إرتفاع/g, 'ارتفاع'],          // Not إرتفاع but ارتفاع
  [/الإرتفاع/g, 'الارتفاع'],
  [/إحتياطي/g, 'احتياطي'],        // Not إحتياطي but احتياطي
  [/الإحتياطي/g, 'الاحتياطي'],
  // Number formatting
  [/(\d),(\d{3})/g, '$1,$2'],  // Ensure proper number formatting
];

function applyArabicSpellCheck(content: string): string {
  let corrected = content;
  let changeCount = 0;
  for (const [pattern, replacement] of ARABIC_SPELL_CORRECTIONS) {
    const before = corrected;
    corrected = corrected.replace(pattern, replacement);
    if (corrected !== before) changeCount++;
  }
  if (changeCount > 0) {
    console.log(`[ReportGenerator V219] Arabic spell check: ${changeCount} corrections applied`);
  }
  return corrected;
}

// ─── V219: Title-Content Alignment Check ──────────────────
// Verifies that the report title actually reflects the main content.
// If the title focuses on one minor data point but the content
// covers a broader topic, flag it and suggest a better title.

interface TitleAlignmentResult {
  isAligned: boolean;
  reason?: string;
  suggestedTitle?: string;
}

function checkTitleContentAlignment(
  title: string,
  content: string,
): TitleAlignmentResult {
  if (!title || !content) return { isAligned: true };

  // Extract key entities/numbers from the title
  const titleWords = title.split(/\s+/).filter(w => w.length > 2);
  const titleNumbers = (title.match(/\d+\.?\d*/g) || []).filter(n => parseFloat(n) >= 5);

  // Count how many title keywords appear in the first 500 chars of content
  const contentStart = content.slice(0, 2000);
  let titleKeywordHits = 0;
  for (const word of titleWords) {
    if (contentStart.includes(word)) titleKeywordHits++;
  }

  // Check if title numbers appear in content
  let titleNumberHits = 0;
  for (const num of titleNumbers) {
    if (content.includes(num)) titleNumberHits++;
  }

  // If the title references a specific number/percentage but the content
  // barely mentions it (< 2 occurrences), the title is likely misaligned
  const titleNumberFrequency = titleNumbers.length > 0
    ? titleNumbers.reduce((count, num) => count + (content.split(num).length - 1), 0) / titleNumbers.length
    : 0;

  // If title keywords have very low hit rate in content, title is misaligned
  const keywordHitRate = titleWords.length > 0 ? titleKeywordHits / titleWords.length : 0;

  // If title mentions a specific country/topic that's only a small part of content
  const titleSpecificPatterns = [
    /سلطنة\s+عمان/, /في\s+عمان/, /العماني/,
    /الكويت/, /في\s+الكويت/, /الكويتي/,
    /البحرين/, /في\s+البحرين/, /البحريني/,
  ];
  let titleIsSpecificToMinorTopic = false;
  for (const pattern of titleSpecificPatterns) {
    if (pattern.test(title)) {
      // Count how many times this country appears in content
      const matches = content.match(new RegExp(pattern.source, 'g')) || [];
      // If mentioned less than 3 times in a long report, it's a minor topic
      if (matches.length < 3 && content.split(/\s+/).length > 300) {
        titleIsSpecificToMinorTopic = true;
      }
    }
  }

  if (keywordHitRate < 0.3 && titleWords.length > 3) {
    return {
      isAligned: false,
      reason: `Title keywords hit rate only ${Math.round(keywordHitRate * 100)}% in content — title may not reflect main content`,
    };
  }

  if (titleNumberFrequency < 1 && titleNumbers.length > 0) {
    return {
      isAligned: false,
      reason: `Title references number(s) "${titleNumbers.join(', ')}" that barely appear in content — likely a minor data point`,
    };
  }

  if (titleIsSpecificToMinorTopic) {
    return {
      isAligned: false,
      reason: `Title focuses on a specific country/topic that's only a minor part of the broader content`,
    };
  }

  return { isAligned: true };
}

// ─── V223: Title-Content Number Contradiction Detection ──────
// Catches cases like "تراجع الذهب دون مستوى ألف دولار" when content
// says gold is at $2,380. The AI misunderstood "خسائر تتجاوز ألف دولار"
// (losses exceeding $1000) as "fell below $1000" — a directional reversal.
// This function extracts numbers + directional context from the title
// and checks if they logically contradict numbers in the content.

interface TitleNumberContradictionResult {
  hasContradiction: boolean;
  reason?: string;
  titleDirection?: 'below' | 'above';
  titleNumber?: number;
  contentNumber?: number;
}

function checkTitleNumberContradiction(title: string, content: string): TitleNumberContradictionResult {
  if (!title || !content) return { hasContradiction: false };

  // ── Step 1: Convert Arabic number words to digits in title ──
  const arabicNumberWords: [RegExp, number][] = [
    [/تريليون/g, 1e12],
    [/مليار/g, 1e9],
    [/مليون/g, 1e6],
    [/(?:ألف|الف)/g, 1e3],
  ];

  let normalizedTitle = title;
  for (const [pattern, multiplier] of arabicNumberWords) {
    normalizedTitle = normalizedTitle.replace(pattern, String(multiplier));
  }

  // ── Step 2: Extract directional patterns from title ──
  // "below/under" direction = title claims value is BELOW a threshold
  const belowPatterns = [
    /دون\s*(?:مستوى\s*)?([\d,.]+)/,
    /أقل\s*(?:من\s*)?(?:مستوى\s*)?([\d,.]+)/,
    /تحت\s*(?:مستوى\s*)?([\d,.]+)/,
    /أسفل\s*(?:مستوى\s*)?([\d,.]+)/,
    /انخفض\s*(?:إلى\s*)?(?:ما\s*)?(?:دون\s*)?([\d,.]+)/,
    /هبوط\s*(?:إلى\s*)?(?:ما\s*)?(?:دون\s*)?([\d,.]+)/,
    /تراجع\s*(?:إلى\s*)?(?:ما\s*)?(?:دون\s*)?([\d,.]+)/,
  ];

  // "above/exceeding" direction = title claims value is ABOVE a threshold
  const abovePatterns = [
    /فوق\s*(?:مستوى\s*)?([\d,.]+)/,
    /أعلى\s*(?:من\s*)?(?:مستوى\s*)?([\d,.]+)/,
    /تجاوز\s*(?:مستوى\s*)?([\d,.]+)/,
    /تخطى\s*(?:مستوى\s*)?([\d,.]+)/,
    /ارتفع\s*(?:إلى\s*)?(?:ما\s*)?(?:فوق\s*)?([\d,.]+)/,
    /قفز\s*(?:إلى\s*)?(?:ما\s*)?(?:فوق\s*)?([\d,.]+)/,
  ];

  let titleDirection: 'below' | 'above' | null = null;
  let titleThreshold: number | null = null;

  for (const pattern of belowPatterns) {
    const match = normalizedTitle.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        titleDirection = 'below';
        titleThreshold = num;
        break;
      }
    }
  }

  if (!titleDirection) {
    for (const pattern of abovePatterns) {
      const match = normalizedTitle.match(pattern);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(num) && num > 0) {
          titleDirection = 'above';
          titleThreshold = num;
          break;
        }
      }
    }
  }

  if (!titleDirection || titleThreshold === null) {
    return { hasContradiction: false };
  }

  // ── Step 3: Extract significant numbers from content ──
  // Look for prices, values, and amounts in the content
  const contentNumberPatterns = [
    // Pattern: number followed by currency/units
    /([\d,]+(?:\.\d+)?)\s*(?:دولار|د\.م|يورو|جنيه|ر\.س|درهم|دينار|$|USD|EUR)/g,
    // Pattern: "عند" or "سعر" followed by number
    /(?:عند|سعر|بـ|بحوالي|حوالي|بنحو)\s*([\d,]+(?:\.\d+)?)/g,
  ];

  const contentNumbers: number[] = [];
  for (const pattern of contentNumberPatterns) {
    let match;
    const tempStr = content;
    while ((match = pattern.exec(tempStr)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0 && num !== titleThreshold) {
        contentNumbers.push(num);
      }
    }
  }

  if (contentNumbers.length === 0) {
    return { hasContradiction: false };
  }

  // ── Step 4: Check for logical contradictions ──
  // If title says "below X" but content has a number Y >> X, that's a contradiction
  // If title says "above X" but content has a number Y << X, that's a contradiction
  const THRESHOLD_RATIO = 1.5; // Content number must be 50%+ different to flag

  for (const contentNum of contentNumbers) {
    if (titleDirection === 'below' && contentNum > titleThreshold * THRESHOLD_RATIO) {
      return {
        hasContradiction: true,
        reason: `Title says "${titleDirection === 'below' ? 'below' : 'above'} ${titleThreshold}" but content contains ${contentNum} which contradicts it`,
        titleDirection,
        titleNumber: titleThreshold,
        contentNumber: contentNum,
      };
    }
    if (titleDirection === 'above' && contentNum < titleThreshold / THRESHOLD_RATIO && contentNum > 0) {
      return {
        hasContradiction: true,
        reason: `Title says "above ${titleThreshold}" but content contains ${contentNum} which contradicts it`,
        titleDirection,
        titleNumber: titleThreshold,
        contentNumber: contentNum,
      };
    }
  }

  return { hasContradiction: false };
}

// ─── V223: Disabled Asset Classes ───────────────────────────
// Categories suspended due to chronic quality issues — insufficient
// specialized data sources lead to hallucination in these categories.
// V335: Re-enabled arabMarkets — data sources now sufficient
const V223_DISABLED_ASSET_CLASSES: AssetClass[] = ['realEstate'];

// ─── V223: Topic deduplication (7-day window) ──────────────
// Prevents generating reports on the same topic within 7 days.
// Uses keyword overlap to detect same-topic reports.

async function isDuplicateTopic(title: string, assetClass: AssetClass, locale: string = 'ar'): Promise<boolean> {
  try {
    // Extract significant words from the title (ignore common words)
    const stopWordsAr = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'بعد', 'خلال', 'بين', 'عند', 'حول', 'وسط', 'أمام', 'أكثر', 'أقل', 'دون', 'فوق', 'تحت', 'التى', 'الذى']);
    const stopWordsEn = new Set(['the','and','for','that','this','with','from','are','was','were','been','have','has','had','will','would','could','should','may','might','shall','can','not','but','its','our','their','his','her','over','into','about','after','before','between']);
    const stopWords = locale === 'ar' ? stopWordsAr : stopWordsEn;
    const titleWords = title.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .map(w => locale === 'ar' ? w.replace(/^[الو]+/, '').slice(0, 6) : w.toLowerCase().slice(0, 6));

    if (titleWords.length < 2) return false;

    // Check for reports with similar titles in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = await db.marketAnalysis.findMany({
      where: {
        assetClass,
        locale,
        createdAt: { gte: sevenDaysAgo },
        isPublished: true,
      },
      select: { title: true },
      take: 20,
    });

    for (const report of recentReports) {
      const reportWords = report.title.split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .map(w => locale === 'ar' ? w.replace(/^[الو]+/, '').slice(0, 6) : w.toLowerCase().slice(0, 6));

      // Count overlapping significant words
      const overlap = titleWords.filter(tw => reportWords.some(rw => rw === tw)).length;
      const similarity = overlap / Math.max(titleWords.length, reportWords.length);

      // If >60% word overlap, it's likely the same topic
      if (similarity > 0.6) {
        console.log(`[ReportGenerator V223] 🔄 Duplicate topic detected: "${title}" ↔ "${report.title}" (${Math.round(similarity * 100)}% overlap)`);
        return true;
      }
    }

    // Locale-filtered to avoid cross-locale dedup
    // Also check EconomicReport for the same asset class
    const recentEconReports = await db.economicReport.findMany({
      where: {
        reportType: assetClass === 'economy' ? 'daily' : undefined,
        locale,
        createdAt: { gte: sevenDaysAgo },
        isPublished: true,
      },
      select: { title: true },
      take: 10,
    });

    for (const report of recentEconReports) {
      const reportWords = report.title.split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .map(w => locale === 'ar' ? w.replace(/^[الو]+/, '').slice(0, 6) : w.toLowerCase().slice(0, 6));

      const overlap = titleWords.filter(tw => reportWords.some(rw => rw === tw)).length;
      const similarity = overlap / Math.max(titleWords.length, reportWords.length);

      if (similarity > 0.6) {
        console.log(`[ReportGenerator V223] 🔄 Duplicate topic detected (econ): "${title}" ↔ "${report.title}" (${Math.round(similarity * 100)}% overlap)`);
        return true;
      }
    }

    return false;
  } catch (err: any) {
    console.warn(`[ReportGenerator V223] Duplicate topic check failed: ${err.message}`);
    return false; // Don't block on error
  }
}

// Simple string similarity (Levenshtein-based ratio)
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// ─── V84: Strip English-only sentences from Arabic report text ──
// A sentence is "English" if >60% of its alphabetic characters are Latin.
// Preserves technical terms like RSI, MACD, USD/JPY that appear within Arabic text.
function stripEnglishFromArabicReport(text: string): string {
  if (!text || typeof text !== 'string') return text;

  const paragraphs = text.split('\n');
  const filtered: string[] = [];

  for (const para of paragraphs) {
    // Don't touch table rows, headers, or lines with Arabic
    const trimmed = para.trim();
    if (!trimmed) { filtered.push(para); continue; }

    // Keep markdown headers, table separators, and lines with significant Arabic content
    const arabicChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const totalAlpha = arabicChars + latinChars;

    if (totalAlpha === 0) { filtered.push(para); continue; } // Numbers/symbols only
    if (arabicChars > 0) { filtered.push(para); continue; }  // Has Arabic — keep
    if (trimmed.startsWith('|')) { filtered.push(para); continue; } // Table row
    if (trimmed.startsWith('#')) { filtered.push(para); continue; } // Markdown header
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) { filtered.push(para); continue; }

    // Pure English sentence — check if it's just a technical term or a full sentence
    const englishRatio = latinChars / totalAlpha;
    if (englishRatio > 0.6) {
      // This is a predominantly English line — strip it if it looks like a sentence (>20 chars)
      if (trimmed.length > 20) {
        console.warn(`[ReportGenerator V84] Stripped English sentence: "${trimmed.slice(0, 60)}..."`);
        continue; // Skip this line
      }
      // Short English (<20 chars) — could be a symbol or abbreviation, keep it
      filtered.push(para);
    } else {
      filtered.push(para);
    }
  }

  return filtered.join('\n');
}

// ─── V152: Strip non-Arabic script characters (CJK, Cyrillic, etc.) ──
// AI sometimes injects Chinese (顾), Korean, Japanese, Cyrillic, or other
// non-Arabic script characters into Arabic text. This function removes them
// while preserving Arabic, Latin (for tickers like NVDA, EUR/USD), numbers, and punctuation.
function stripForeignScripts(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Unicode ranges to KEEP:
  // - Arabic: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  // - Latin: \u0000-\u007F (ASCII — letters, digits, punctuation)
  // - Latin-1 Supplement: \u0080-\u00FF (accented chars, ±, etc.)
  // - Latin Extended: \u0100-\u024F
  // - General Punctuation: \u2000-\u206F (dashes, quotes, brackets)
  // - Superscripts/Subscripts: \u2070-\u209F
  // - Currency Symbols: \u20A0-\u20CF
  // - Letterlike Symbols: \u2100-\u214F (ℓ, ℮, etc.)
  // - Arrows & Math: \u2190-\u22FF
  // - Box Drawing: \u2500-\u257F
  // - Geometric Shapes: \u25A0-\u25FF
  // - Miscellaneous Technical: \u2300-\u23FF
  // - Arabic Presentation Forms A/B: already covered above
  // - Variation Selectors: \uFE00-\uFE0F
  // - Specials (RTL/LTR marks): \u200E-\u200F, \u202A-\u202E

  // REMOVE: CJK Unified Ideographs, Hiragana, Katakana, Hangul, Cyrillic, Thai, Devanagari, etc.
  const cleaned = text.replace(/[\u0400-\u04FF]/g, '')     // Cyrillic (Russian, etc.)
    .replace(/[\u0E00-\u0E7F]/g, '')     // Thai
    .replace(/[\u0900-\u097F]/g, '')     // Devanagari (Hindi, etc.)
    .replace(/[\u3040-\u309F]/g, '')     // Hiragana (Japanese)
    .replace(/[\u30A0-\u30FF]/g, '')     // Katakana (Japanese)
    .replace(/[\uAC00-\uD7AF]/g, '')     // Hangul (Korean)
    .replace(/[\u4E00-\u9FFF]/g, '')     // CJK Unified Ideographs (Chinese)
    .replace(/[\u3400-\u4DBF]/g, '')     // CJK Extension A
    .replace(/[\u20000-\u2A6DF]/g, '')   // CJK Extension B
    .replace(/[\u2A700-\u2B73F]/g, '')   // CJK Extension C
    .replace(/[\u2B740-\u2B81F]/g, '')   // CJK Extension D
    .replace(/[\uF900-\uFAFF]/g, '')     // CJK Compatibility Ideographs
    .replace(/[\u2F800-\u2FA1F]/g, '')   // CJK Compatibility Supplement
    .replace(/[\u0C00-\u0C7F]/g, '')     // Telugu
    .replace(/[\u0B80-\u0BFF]/g, '')     // Tamil
    .replace(/[\u0A80-\u0AFF]/g, '')     // Gujarati
    .replace(/[\u0A00-\u0A7F]/g, '')     // Gurmukhi
    .replace(/[\u0B00-\u0B7F]/g, '')     // Oriya
    .replace(/[\u0C80-\u0CFF]/g, '')     // Kannada
    .replace(/[\u0D00-\u0D7F]/g, '')     // Malayalam
    .replace(/[\u0980-\u09FF]/g, '')     // Bengali
    .replace(/[\u0A00-\u0A7F]/g, '')     // Gurmukhi (duplicate range, safe)
    .replace(/[\u1100-\u11FF]/g, '')     // Hangul Jamo
    .replace(/[\u3130-\u318F]/g, '');     // Hangul Compatibility Jamo

  if (cleaned !== text) {
    const removedChars = text.length - cleaned.length;
    if (removedChars > 0) {
      console.log(`[ReportGenerator V152] Stripped ${removedChars} foreign script character(s) from text`);
    }
  }
  return cleaned;
}

// ─── V137: Strip AI Internal Comment Leaks from published text ──
// AI sometimes leaks internal generation comments into the published output,
// especially in multi-pass generation where pass boundaries are noted.
// This function removes those comments before publishing.
export function stripAICommentLeaks(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  // Pattern 1: Lines containing AI self-references about stopping/continuing
  const aiCommentPatterns = [
    // "توقفت هنا عند القسم الرابع كما هو مطلوب"
    /توقفت\s+هنا\s+عند\s+القسم\s+.*$/gm,
    // "أكمل من حيث توقفت"
    /أكمل\s+من\s+حيث\s+توقفت.*$/gm,
    // "ملاحظة:" followed by AI internal notes
    /^[\s]*ملاحظة[\s:]*(للمراجع|للناشر|للقارئ|للمحرر|للمدقق)?[\s:]*.*$/gm,
    // "ملاحظة للمراجع" or similar
    /^[\s]*ملاحظة\s+ل(لمراجع|لناشر|لقارئ|لمحرر|لمدقق).*$/gm,
    // "سأكمل عند الطلب"
    /سأكمل\s+عند\s+الطلب.*$/gm,
    // "هذا الجزء يتضمن..." as internal comment
    /^[\s]*هذا\s+الجزء\s+يتضمن.*$/gm,
    // "[ملاحظة]" in brackets
    /\[ملاحظة[^\]]*\]/g,
    // "(ملاحظة:" in parentheses
    /\(ملاحظة[^)]*\)/g,
    // "كما هو مطلوب" — AI acknowledging instructions
    /كما\s+هو\s+مطلوب.*$/gm,
    // "بناءً على التعليمات" — AI referencing its instructions
    /بناءً?\s+على\s+التعليمات.*$/gm,
    // Lines that are just "---" boundary markers between passes (but keep proper HR)
    /^---\s*$/gm,
    // "سأقوم بـ" — AI describing its own process
    /^[\s]*سأقوم\s+ب.*$/gm,
    // "الآن سأكتب" — AI describing its own writing process
    /^[\s]*الآن\s+سأكتب.*$/gm,
    // "الآن أكمل" — AI continuation markers
    /^[\s]*الآن\s+أكمل.*$/gm,
    // "بناء على الطلب" — AI acknowledging request
    /بناء\s+على\s+الطلب.*$/gm,
    // "كما طلبت" — AI acknowledging user request
    /كما\s+طلبت.*$/gm,
  ];

  for (const pattern of aiCommentPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // V139: Strip internal data source references — (البند N), (انظر قسم X)
  const internalRefPatterns = [
    /\(البند\s+\d+\)/g,
    /\(البند\s+[^\)]*\)/g,
    /\(انظر\s+قسم\s+[^\)]*\)/g,
    /\(المصدر\s+الداخلي\s+[^\)]*\)/g,
    /\(مرجع\s+داخلي\s*[^\)]*\)/g,
  ];
  for (const pattern of internalRefPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // V139: Strip "لا توجد بيانات محددة حول" internal comments
  cleaned = cleaned.replace(/^[\s]*لا\s+توجد\s+بيانات\s+محددة\s+حول.*$/gm, '');

  // Remove resulting double blank lines (from removed comments)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// ─── V137: Detect Duplicate Sections ──────────────────────
// Checks if two sections (e.g., strategicRecommendations and rouaaRecommendations)
// are too similar, which indicates copy-paste between them.
// Uses Jaccard similarity on word-level tokens.
export function detectDuplicateSections(
  section1: string,
  section2: string,
  threshold: number = 0.6,
): { isDuplicate: boolean; similarity: number } {
  if (!section1 || !section2) return { isDuplicate: false, similarity: 0 };

  // Tokenize: split into words, normalize, remove common stop words
  const stopWords = new Set([
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
    'أن', 'إن', 'لا', 'لم', 'لن', 'قد', 'كان', 'كانت', 'يكون', 'تكون',
    'هو', 'هي', 'هم', 'هن', 'نحن', 'أنا', 'أنت', 'و', 'أو', 'ثم', 'بل',
    'لكن', 'حتى', 'إذا', 'عند', 'بين', 'خلال', 'بعد', 'قبل', 'كل', 'بعض',
  ]);

  const tokenize = (text: string): Set<string> => {
    const words = text
      .replace(/[*#\-\[\](){}|]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  };

  const set1 = tokenize(section1);
  const set2 = tokenize(section2);

  if (set1.size === 0 || set2.size === 0) return { isDuplicate: false, similarity: 0 };

  // Jaccard similarity: |A ∩ B| / |A ∪ B|
  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  const similarity = union > 0 ? intersection / union : 0;

  return { isDuplicate: similarity >= threshold, similarity };
}

// ─── V137: Validate Exchange Rate Sanity ──────────────────
// Checks for known exchange rate pairs and validates their values
// are within reasonable ranges. Fixes or removes invalid values.
export function validateExchangeRates(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Known exchange rate sanity ranges (approximate as of 2026)
  const exchangeRateSanity: Record<string, { min: number; max: number; hint: string }> = {
    'الدولار مقابل الجنيه المصري': { min: 30, max: 70, hint: '≈ 50 جنيه' },
    'USD/EGP': { min: 30, max: 70, hint: '≈ 50' },
    'اليورو مقابل الدولار': { min: 0.9, max: 1.3, hint: '≈ 1.05-1.15' },
    'EUR/USD': { min: 0.9, max: 1.3, hint: '≈ 1.05-1.15' },
    'الجنيه الإسترليني مقابل الدولار': { min: 1.1, max: 1.5, hint: '≈ 1.20-1.35' },
    'GBP/USD': { min: 1.1, max: 1.5, hint: '≈ 1.20-1.35' },
    'الدولار مقابل الين': { min: 100, max: 170, hint: '≈ 140-155' },
    'USD/JPY': { min: 100, max: 170, hint: '≈ 140-155' },
    'الدولار مقابل الفرنك': { min: 0.8, max: 1.0, hint: '≈ 0.85-0.95' },
    'USD/CHF': { min: 0.8, max: 1.0, hint: '≈ 0.85-0.95' },
  };

  let cleaned = text;

  // For each rate, find patterns like "انخفض إلى 1.26" or "= 1.26" near the rate name
  for (const [rateName, sanity] of Object.entries(exchangeRateSanity)) {
    // Look for the rate name followed by a number within 100 chars
    const ratePattern = new RegExp(
      `${rateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\d]{0,100}?(\\d+\\.?\\d*)`,
      'g'
    );

    let match;
    while ((match = ratePattern.exec(cleaned)) !== null) {
      const value = parseFloat(match[1]);
      if (value >= sanity.min && value <= sanity.max) continue; // Value is OK

      // Invalid value found — flag it
      console.warn(`[V137] Exchange rate sanity check: ${rateName} = ${value} is outside range [${sanity.min}-${sanity.max}] (${sanity.hint}). Stripping.`);

      // Replace the number with "غير متوفر" or remove the claim
      const fullMatch = match[0];
      const fixed = fullMatch.replace(match[1], 'غير متوفر');
      cleaned = cleaned.replace(fullMatch, fixed);
    }
  }

  return cleaned;
}

// ─── V81: Data Sufficiency Gate ─────────────────────────────
// Checks if there's enough real data to generate a meaningful report.
// Returns: 'full' | 'brief' | 'skip'

type DataSufficiency = 'full' | 'brief' | 'skip';

function assessDataSufficiency(
  newsCount: number,
  indicatorsCount: number,
  relevantNewsCount: number,
  assetClass?: AssetClass,
  forceFull?: boolean,
): DataSufficiency {
  // V163: forceFull parameter — when user manually requests a report,
  // always generate a full AI-powered report regardless of data quantity.
  // The user wants a comprehensive report, not a brief news list.
  if (forceFull) {
    console.log(`[ReportGenerator V163] forceFull=true — overriding dataSufficiency to 'full'`);
    return 'full';
  }

  // V84: Economy reports require higher data quality to prevent hallucination
  // Economy data is more abstract and prone to fabrication when insufficient
  const isEconomyLike = assetClass === 'economy' || assetClass === 'banking' || assetClass === 'realEstate';

  if (isEconomyLike) {
    // V163: Lowered from 8 to 5 — too strict, causing brief bulletins instead of reports
    if (relevantNewsCount >= 5 && indicatorsCount >= 2) return 'full';
    // Brief: 2-4 relevant news — AI-assisted brief report
    if (relevantNewsCount >= 2) return 'brief';
    // Skip: fewer than 2 relevant news — economy data too thin for any analysis
    return 'skip';
  }

  // V163: Lowered thresholds — was too strict (6+ required), causing most
  // earnings/stocks/sector reports to fall into brief mode. With 3+ relevant
  // news, AI can generate a meaningful focused analysis.
  if (relevantNewsCount >= 3 && indicatorsCount >= 1) return 'full';
  // Brief bulletin: 1-2 relevant news items (AI-assisted brief report)
  if (relevantNewsCount >= 1) return 'brief';
  // Skip: no relevant news at all
  if (relevantNewsCount < 1 && newsCount < 3) return 'skip';
  // Brief if total news exists but relevant is very thin
  return 'brief';
}

// Build a brief factual bulletin instead of a full report (V81)
// V163: Enhanced to use AI for generating brief content instead of just listing news.
// Even with limited data, AI can write a meaningful short analysis.
async function buildBriefBulletin(
  assetClass: AssetClass,
  relevantNews: any[],
  indicators: any[],
  allNews?: any[],
): Promise<string> {
  const assetLabel = ASSET_CLASS_LABELS[assetClass]?.nameAr || assetClass;

  // V163: Try AI-powered brief generation first — much better than just listing news
  try {
    const newsContext = relevantNews.slice(0, 10).map(item => {
      const title = item.titleAr || item.title;
      const summary = item.summaryAr || item.summary || '';
      const sentiment = item.sentiment || 'neutral';
      return `- ${title} | المشاعر: ${sentiment}${summary ? ` | ${summary.slice(0, 120)}` : ''}`;
    }).join('\n');

    const indicatorContext = indicators.slice(0, 5).map(ind => {
      const name = ind.nameAr || ind.name;
      const direction = ind.changePercent >= 0 ? '▲' : '▼';
      const absChange = Math.abs(ind.changePercent).toFixed(2);
      return `- ${name}: ${ind.value} ${direction}${absChange}%`;
    }).join('\n');

    const nowDateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    const result = await chatCompletion([
      {
        role: 'system',
        content: `أنت محرر صحفي مالي تكتب لمنصة "رؤى". مهمتك: كتابة تحليل موجز لكن مفيد بالعربية الفصحى.
البيانات محدودة لكن يجب أن تكتب تحليلاً حقيقياً — لا مجرد قائمة أخبار.
اجمع الأخبار المترابطة وحلّلها كموضوع واحد. اذكر الأرقام المتاحة. لا تخترع بيانات.
وسّع التحليل بقدر ما تستطيع — كل قسم عدة فقرات. لا تختصر.
اكتب بتنسيق Markdown. 500-800 كلمة.`,
      },
      {
        role: 'user',
        content: `التاريخ: ${nowDateStr}
تصنيف: ${assetLabel}

الأخبار المتاحة:
${newsContext || 'لا أخبار متاحة'}

المؤشرات:
${indicatorContext || 'لا مؤشرات متاحة'}

اكتب تحليلاً موجزاً يجمع هذه الأخبار ويربط بينها:`,
      },
    ], {
      temperature: 0.4,
      maxTokens: 8000,
      priority: 'generation',
    });

    const content = result.content?.trim() || '';
    if (content.split(/\s+/).length >= 100) {
      console.log(`[ReportGenerator V163] AI brief bulletin generated: ${content.split(/\s+/).length} words`);
      return content;
    }
  } catch (error: any) {
    console.warn(`[ReportGenerator V163] AI brief generation failed: ${error.message}, falling back to list`);
  }

  // Fallback: simple factual listing (original V81 behavior)
  const parts: string[] = [];

  // V85: Translate sentiment to Arabic — no English words in Arabic report
  const sentimentAr: Record<string, string> = {
    positive: 'إيجابي',
    negative: 'سلبي',
    neutral: 'محايد',
    bullish: 'صعودي',
    bearish: 'هبوطي',
  };

  parts.push(`## ${assetLabel} — ملخص سريع\n`);
  parts.push(`⚠️ بيانات محدودة — لا تتوفر معلومات كافية لتحليل معمّق. إليك أبرز ما ورد:\n`);

  // List the news items factually — with Arabic sentiment
  if (relevantNews.length > 0) {
    parts.push(`### أبرز الأخبار`);
    for (const item of relevantNews.slice(0, 5)) {
      const title = item.titleAr || item.title;
      const sentiment = sentimentAr[item.sentiment] || 'محايد';
      parts.push(`- ${title} (${sentiment})`);
    }
  }

  // List indicators if available
  if (indicators.length > 0) {
    parts.push(`\n### المؤشرات المتاحة`);
    for (const ind of indicators.slice(0, 5)) {
      const name = ind.nameAr || ind.name;
      const direction = ind.changePercent >= 0 ? '▲' : '▼';
      const absChange = Math.abs(ind.changePercent).toFixed(2);
      parts.push(`- ${name}: ${ind.value} ${direction}${absChange}%`);
    }
  }

  // V85: Explicit honest disclaimer instead of vague promise of future update
  parts.push(`\n*البيانات الحالية غير كافية لإنشاء تحليل مفصل أو تقديم توصيات محددة. سيتم إنشاء تحليل مفصل عند توفر بيانات إضافية.*`);

  return parts.join('\n');
}

// ─── V69: AI-Generated Descriptive Title ────────────────────
// Instead of generic titles like "التقرير اليومي — 5/5/2026",
// generates a descriptive title that summarizes the main event/impact.
// Example: "تصاعد التوتر بعد استهداف إيران لناقلة نفط، وتداعياته على سوق النفط"
// The title itself prevents duplication — each event = unique title.

async function generateDescriptiveTitle(
  newsHeadlines: string[],
  assetClassLabel: string,
  assetClass?: AssetClass,
  sectorInfo?: { newsCount: number; sectors: string[]; sentiment: number },
): Promise<string> {
  if (newsHeadlines.length === 0) {
    // No news — return a minimal title with timestamp to keep it unique
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    return `${assetClassLabel} — آخر تحديث ${timeStr}`;
  }

  // Build a compact prompt asking AI to generate a descriptive title
  // V232→V234: For daily reports with sector info, use a comprehensive title prompt
  // that summarizes the overall market picture, not just one article.
  // V234: Pass MORE headlines (15 instead of 6) and include sector distribution
  // so the AI has better context about the overall market picture.
  const headlinesText = newsHeadlines.slice(0, 15).join('\n- ');

  // V232→V235: Determine if this is a multi-sector daily report
  // Lowered threshold from 10 to 5 news items — even smaller daily reports
  // should get comprehensive titles, not single-article titles.
  const isDailyMultiSector = sectorInfo && sectorInfo.newsCount >= 5 && sectorInfo.sectors.length >= 2;

  // Build the system and user prompts based on report type
  let systemPrompt: string;
  let userPrompt: string;

  if (isDailyMultiSector) {
    // V232→V234: Daily report covering multiple sectors — title must reflect the OVERALL market picture
    const sectorList = sectorInfo.sectors.slice(0, 10).join('، ');
    const sentimentDir = sectorInfo.sentiment >= 60 ? 'صعودي' : sectorInfo.sentiment <= 40 ? 'هبوطي' : 'مختلط';
    // V234: Include top headlines from DIFFERENT sectors (not just the first 6 from one sector)
    const sectorHeadlines: string[] = [];
    const seenSectors = new Set<string>();
    for (const h of newsHeadlines) {
      if (sectorHeadlines.length >= 10) break;
      // Try to diversify — pick headlines that mention different sectors
      const hasNewSector = !seenSectors.size || ![...seenSectors].some(s => h.includes(s));
      if (sectorHeadlines.length < 3 || hasNewSector) {
        sectorHeadlines.push(h);
        // Try to extract sector keyword from headline
        const sectorKeywords = ['أسهم', 'نفط', 'ذهب', 'دولار', 'يورو', 'بيتكوين', 'سندات', 'فائدة', 'تضخم', 'بنك', 'أسعار', 'أسواق', 'اقتصاد'];
        for (const kw of sectorKeywords) {
          if (h.includes(kw)) seenSectors.add(kw);
        }
      }
    }
    const diversifiedHeadlines = sectorHeadlines.length >= 5
      ? sectorHeadlines.join('\n- ')
      : headlinesText; // Fallback to regular headlines if not enough diversity

    systemPrompt = `أنت محرر مالي محترف تكتب عنوان التقرير اليومي الشامل لمنصة رؤى المالية.
القواعد الصارمة:
1. هذا تقرير يومي شامل يغطي ${sectorInfo.newsCount} خبراً في ${sectorInfo.sectors.length} قطاعاً
2. العنوان يجب أن يلخص الاتجاه العام للأسواق — NOT picks one article
3. ⚠️ ممنوع اختيار عنوان خبر واحد فقط — العنوان يجب أن يعكس الصورة الكاملة
4. اكتب بالعربية الفصحى المتخصصة
5. أمثلة صحيحة لتقرير يومي شامل:
   - "ارتفاع الأسهم الأمريكية والأوروبية مع تراجع الدولار وثبات النفط"
   - "مزاج متفائل في الأسواق: أسهم وذهب يرتفعان وسندات ودولار يتراجعان"
   - "ضغوط بيعية تشمل الأسهم والسلع مع تصاعد المخاطر الجيوسياسية"
   - "أسواق مختلطة: تقنية وكيبتو تتراجعان بينما النفط والذهب يرتفعان"
6. أمثلة خاطئة (عنوان خبر واحد لا يمثل التقرير):
   - "ستاربكس ترفع سقف شراء الديون" ✗ (خبر واحد هامشي)
   - "أبل تطلق هاتف جديد" ✗ (لا علاقة له ببقية التقرير)
7. أجب بالعنوان فقط — لا تضف أي شيء آخر
8. طول العنوان: لا أكثر من 10 كلمات — جملة واحدة تعكس الموضوع المحوري
9. قواعد نحوية: بعد أن أعلن وليس بعد تعلن
10. مصطلحات: الدولار وليس الدينار أبدا - اليورو وليس الإيورو`;
    userPrompt = `التقرير اليومي يغطي ${sectorInfo.newsCount} خبراً في ${sectorInfo.sectors.length} قطاعاً:
القطاعات: ${sectorList}
الاتجاه العام: ${sentimentDir}

عناوين من قطاعات مختلفة:
- ${diversifiedHeadlines}

⚠️ اكتب عنواناً يلخص الاتجاه العام للأسواق — لا تختار عنوان خبر واحد:`;
  } else {
    // Original prompt for single-sector or non-daily reports
    systemPrompt = `أنت محرر مالي محترف. مهمتك: كتابة عنوان تقرير مالي واحد فقط.
القواعد الصارمة:
1. العنوان يجب أن يلخص الحدث الرئيسي + تأثيره على السوق
2. اكتب بالعربية الفصحى المتخصصة
3. لا تبدأ بـ "تقرير يومي" أو "تحليل" أو "تقرير" — ابدأ مباشرة بالحدث
4. العنوان يجب أن يكون جملة واحدة واضحة ومفيدة
5. مثال: "تصاعد التوتر بعد استهداف إيران لناقلة نفط في ميناء إماراتي، وتداعياته على سوق النفط"
6. مثال: "تراجع الدولار بعد بيانات التضخم الأمريكية، وارتفاع اليورو مقابل العملات الرئيسية"
7. مثال: "قفزة أسعار البيتكوين فوق 100 ألف دولار عقب موافقة صناديق استثمار جديدة"
8. أجب بالعنوان فقط — لا تضف أي شيء آخر
9. ⚠️ طول العنوان: لا أكثر من 10 كلمات — جملة واحدة تعكس الموضوع المحوري
10. قواعد نحوية: بعد أن أعلن وليس بعد تعلن
11. مصطلحات: الدولار وليس الدينار أبدا - اليورو وليس الإيورو
12. ⚠️ ممنوع الربط بين أحداث غير مرتبطة — لا تربط حدثاً بآخر بدون علاقة سببية مباشرة`;
    userPrompt = `أهم الأخبار في تصنيف "${assetClassLabel}":
- ${headlinesText}

اكتب عنوان التقرير:`;
  }

  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ], {
      temperature: 0.6,
      maxTokens: 200,
      priority: 'translation', // Use faster/cheaper model for title generation
    });

    let title = result.content?.trim() || '';
    // Clean up: remove quotes, extra whitespace, trailing punctuation
    title = title.replace(/^["]+|["\n]+$/g, '').trim();
    title = title.replace(/^[#\-*]+\s*/, ''); // Remove markdown artifacts
    // Remove prefix patterns like "العنوان:" or "عنوان التقرير:"
    title = title.replace(/^(?:العنوان|عنوان التقرير|التقرير|تحليل)\s*:\s*/i, '');
    // V83: Fix common AI translation errors in titles
    title = title.replace(/الدينار\s+الأمريكي/g, 'الدولار الأمريكي');
    title = title.replace(/انخفضت قيمة الدينار الأمريكي/g, 'انخفضت قيمة الدولار الأمريكي');
    title = title.replace(/الإيورو/g, 'اليورو');
    title = title.replace(/بعد\s+تعلن/g, 'بعد أن أعلن');
    title = title.replace(/الجنيه\s+البريطاني/g, 'الجنيه الإسترليني');

    // V86: Fix mixed Arabic/Latin in title — TRANSLITERATE instead of delete
    // "باركلAYS" → "باركليز" (not "باركل" — broken!)
    title = fixMixedArabicTitleWithTransliteration(title);

    // V217: Enforce 5-12 words for titles — short punchy Bloomberg/Reuters style
    const wordCount = title.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 12) {
      // Truncate at last comma/conjunction before word 12
      const words = title.split(/\s+/);
      const truncated = words.slice(0, 12).join(' ');
      // Try to end at a comma or conjunction
      const lastComma = truncated.lastIndexOf('،');
      const lastAnd = truncated.lastIndexOf(' و');
      const cutPoint = Math.max(lastComma, lastAnd);
      if (cutPoint > truncated.length * 0.5) {
        title = truncated.slice(0, cutPoint).replace(/[،\s]+$/, '');
      } else {
        title = truncated;
      }
      console.log(`[ReportGenerator V217] Title truncated: ${wordCount} words → ${title.split(/\s+/).length} words`);
    }
    // V218: Also enforce minimum 5 words — titles too short are vague
    if (wordCount < 5 && newsHeadlines.length > 0) {
      // Title too short — try again with explicit length instruction
      console.log(`[ReportGenerator V218] Title too short (${wordCount} words), retrying with length instruction`);
      try {
        const retryResult = await chatCompletion([
          {
            role: 'system',
            content: `أنت محرر مالي. اكتب عنوان تقرير واحد فقط. القواعد:
1. العنوان = الحدث + تأثيره
2. 5-12 كلمة فقط
3. لا تبدأ بـ "تقرير" أو "تحليل"
4. أجب بالعنوان فقط`,
          },
          {
            role: 'user',
            content: `اكتب عنوان تقرير (5-12 كلمة) عن: ${newsHeadlines.slice(0, 3).join('. ')}`,
          },
        ], { temperature: 0.5, maxTokens: 100, priority: 'translation' });
        const retryTitle = retryResult.content?.trim().replace(/^["]+|["\n]+$/g, '').replace(/^[#\-*]+\s*/, '').replace(/^(?:العنوان|عنوان التقرير|التقرير|تحليل)\s*:\s*/i, '');
        if (retryTitle && retryTitle.split(/\s+/).filter(w => w.length > 0).length >= 5) {
          title = retryTitle;
        }
      } catch { /* keep original short title */ }
    }

    // V224: Validate title isn't broken (missing words, double commas, trailing prepositions)
    const brokenPatterns = [
      /\sفي\s*[،,.]/,     // "في ،" — missing word after preposition
      /\sعن\s*[،,.]/,     // "عن ،" — missing word
      /\sمن\s*[،,.]/,     // "من ،" — missing word
      /\sإلى\s*[،,.]/,    // "إلى ،" — missing word
      /،\s*،/,            // Double comma
      /،\s*وتأثيره?\s*$/, // "، وتأثيره" at end — hallucinated continuation
    ];
    const isBrokenTitle = brokenPatterns.some(p => p.test(title));
    if (isBrokenTitle) {
      console.warn(`[ReportGenerator V224] ⚠️ Broken title detected: "${title}" — attempting fix`);
      // Try to fix: remove trailing broken parts
      title = title.replace(/\s*(في|عن|من|إلى)\s*[،,.]\s*/g, ' ');
      title = title.replace(/،\s*،/g, '،');
      title = title.replace(/،\s*وتأثيره?\s*$/g, '');
      title = title.replace(/\s+/g, ' ').trim();
      // If still broken after fix, try regenerating
      if (brokenPatterns.some(p => p.test(title)) || title.split(/\s+/).length < 3) {
        console.warn(`[ReportGenerator V224] Title still broken after fix: "${title}" — using fallback`);
        // Use first headline as fallback
        const headline = newsHeadlines[0] || `${assetClassLabel} — تقرير تحليلي`;
        return headline.length > 8 ? headline : `${assetClassLabel} — تقرير تحليلي`;
      }
      console.log(`[ReportGenerator V224] Title fixed: "${title}"`);
    }

    if (title.length >= 8 && title.length <= 200) {
      // V227: Validate title has a specific number or concrete action verb
      // Vague titles like "التوترات الإقليمية وتأثيرها" are useless —
      // they could be about anything. A good title has either:
      // 1. A specific number: "تراجع النفط 3.2%", "فوق 100 ألف دولار"
      // 2. A concrete action verb: "استهدف", "أعلن", "فرض", "رفع", "خفض"
      const titleHasNumber = /\d+[\.,]?\d*/.test(title) || /[٠-٩]{1,}/.test(title);
      const CONCRETE_VERBS = ['استهدف', 'أعلن', 'فرض', 'رفع', 'خفض', 'تراجع', 'ارتفع', 'تجاوز', 'هبط', 'قفز', 'انهار', 'ألغى', 'وافق', 'رفض', 'أطلق', 'اشترى', 'باع', 'أقر', 'صادر', 'حظر', 'عطل', 'استحوذ', 'أصدر', 'علق', 'فرض', 'مدد', 'جدد', 'خفض', 'رفع', 'حقق', 'سجل'];
      const titleHasConcreteVerb = CONCRETE_VERBS.some(v => title.includes(v));

      if (!titleHasNumber && !titleHasConcreteVerb) {
        console.warn(`[ReportGenerator V227] ⚠️ Title too vague (no number or concrete verb): "${title}" — retrying with specific instruction`);
        try {
          const specificTitleResult = await chatCompletion([
            {
              role: 'system',
              content: `أنت محرر مالي. اكتب عنوان تقرير واحد فقط.
القواعد:
1. العنوان يجب أن يحتوي على رقم محدد أو فعل حركة محدد (ارتفع، تراجع، أعلن، فرض...)
2. العناوين العامة مثل "التوترات وتأثيرها" مرفوضة — كن محدداً
3. 5-12 كلمة فقط
4. لا تبدأ بـ "تقرير" أو "تحليل"
5. أجب بالعنوان فقط`,
            },
            {
              role: 'user',
              content: `اكتب عنواناً محدداً (يجب أن يحتوي على رقم أو فعل حركة) عن: ${newsHeadlines.slice(0, 3).join('. ')}`,
            },
          ], { temperature: 0.5, maxTokens: 100, priority: 'translation' });
          const specificTitle = specificTitleResult.content?.trim().replace(/^["]+|["\n]+$/g, '').replace(/^[#\-*]+\s*/, '').replace(/^(?:العنوان|عنوان التقرير|التقرير|تحليل)\s*:\s*/i, '');
          if (specificTitle && specificTitle.split(/\s+/).filter(w => w.length > 0).length >= 5) {
            const specificHasNumber = /\d+[\.,]?\d*/.test(specificTitle) || /[٠-٩]{1,}/.test(specificTitle);
            const specificHasVerb = CONCRETE_VERBS.some(v => specificTitle.includes(v));
            if (specificHasNumber || specificHasVerb) {
              title = specificTitle;
              console.log(`[ReportGenerator V227] Title regenerated with specific content: "${title}"`);
            }
          }
        } catch { /* keep original title */ }
      }

      // V232→V234: For daily multi-sector reports, reject titles that are clearly about
      // a single company/event instead of the overall market picture.
      // A daily report covering 35+ sectors should NOT have a title about "Starbucks"
      if (isDailyMultiSector && sectorInfo) {
        // Single-company title detection: if the title mentions a specific company
        // but doesn't mention broader market terms, it's probably a single-article title
        const MARKET_TERMS = ['أسواق', 'سوق', 'أسهم', 'قطاعات', 'عملات', 'سلع', 'سندات', 'نفط', 'ذهب', 'دولار', 'فائدة', 'تضخم', 'مؤشرات', 'بورصة', 'محافظ', 'استثمار', 'اقتصاد', 'عالمية', 'أمريكية', 'أوروبية', 'آسيوية'];
        const hasMarketTerm = MARKET_TERMS.some(t => title.includes(t));
        // V234: Also check for conjunctions that indicate a multi-topic title
        // Good titles use "،" or "و" to join multiple topics: "ارتفاع الأسهم والذهب، وتراجع الدولار"
        const hasMultiTopicConjunction = (title.match(/،/g) || []).length >= 1 || (title.match(/\sو\s/g) || []).length >= 1;
        // If title has no market terms AND no multi-topic structure, it's likely a single-article headline
        if (!hasMarketTerm && !hasMultiTopicConjunction) {
          console.warn(`[ReportGenerator V232] ⚠️ Daily title looks like single-article headline: "${title}" — retrying with market-summary prompt`);
          try {
            const retryResult = await chatCompletion([
              {
                role: 'system',
                content: `أنت محرر مالي تكتب عنوان التقرير اليومي الشامل.
⚠️ ممنوع كتابة عنوان عن شركة أو حدث واحد فقط!
يجب أن يلخص الاتجاه العام للأسواق عبر عدة قطاعات.
أمثلة صحيحة:
- "ارتفاع الأسهم مع تراجع الدولار وثبات النفط"
- "أسواق مختلطة: تقنية وكيبتو تتراجعان بينما السلع ترتفع"
- "مزاج متحفظ: أسهم أوروبا تتراجع والذهب يستقر"
5-12 كلمة. أجب بالعنوان فقط.`,
              },
              {
                role: 'user',
                content: `اكتب عنوان التقرير اليومي (${sectorInfo.newsCount} خبر، ${sectorInfo.sectors.length} قطاع، اتجاه ${sectorInfo.sentiment >= 60 ? 'صعودي' : sectorInfo.sentiment <= 40 ? 'هبوطي' : 'مختلط'}):`,
              },
            ], { temperature: 0.5, maxTokens: 100, priority: 'translation' });
            const retryTitle = retryResult.content?.trim().replace(/^["]+|["\n]+$/g, '').replace(/^[#\-*]+\s*/, '').replace(/^(?:العنوان|عنوان التقرير|التقرير|تحليل)\s*:\s*/i, '');
            if (retryTitle && retryTitle.split(/\s+/).filter(w => w.length > 0).length >= 5) {
              const retryHasMarketTerm = MARKET_TERMS.some(t => retryTitle.includes(t));
              if (retryHasMarketTerm) {
                title = retryTitle;
                console.log(`[ReportGenerator V232] Title regenerated as market summary: "${title}"`);
              }
            }
          } catch { /* keep original title */ }
        }
      }

      console.log(`[ReportGenerator V69/V217/V232: Generated descriptive title: "${title}" (${title.split(/\s+/).length} words)`);
      return title;
    }
  } catch (error: any) {
    console.error('[ReportGenerator] V69: Title generation failed:', error.message);
  }

  // Fallback: use first headline with cleanup
  const fallback = newsHeadlines[0];
  console.log(`[ReportGenerator] V69: Using headline as fallback title: "${fallback}"`);
  return fallback;
}

// ─── V86: Company Name Transliteration Dictionary ──────────
// Instead of deleting Latin chars embedded in Arabic ("باركلAYS" → "باركل" — broken),
// we transliterate to the correct Arabic name ("باركليز").
const COMPANY_TRANSLITERATIONS: Record<string, string> = {
  // Major banks & financial institutions
  'Barclays': 'باركليز',
  'JPMorgan': 'جي بي مورغان',
  'Goldman': 'غولدمان',
  'Sachs': 'ساكس',
  'Morgan': 'مورغان',
  'Stanley': 'ستانلي',
  'Deutsche': 'دويتشه',
  'Citigroup': 'سيتي غروب',
  'Wells': 'ويلز',
  'Fargo': 'فارغو',
  'UBS': 'يوبس',
  'Credit': 'كريدي',
  'Suisse': 'سويس',
  'BNP': 'بي إن بي',
  'Paribas': 'باريبا',
  'Standard': 'ستاندرد',
  'Chartered': 'تشارترد',
  // Tech companies
  'Apple': 'أبل',
  'Microsoft': 'مايكروسوفت',
  'Google': 'غوغل',
  'Amazon': 'أمازون',
  'Meta': 'ميتا',
  'Tesla': 'تسلا',
  'Nvidia': 'إنفيديا',
  'Intel': 'إنتل',
  'Samsung': 'سامسونغ',
  'Oracle': 'أوراكل',
  'Netflix': 'نتفليكس',
  // Other well-known entities
  'Berkshire': 'بيركشاير',
  'Hathaway': 'هاثاواي',
  'Visa': 'فيزا',
  'Mastercard': 'ماستركارد',
  'PayPal': 'باي بال',
  'Boeing': 'بوينغ',
  'Caterpillar': 'كاتربيلر',
  'Chevron': 'شيفرون',
  'Exxon': 'إكسون',
  'Mobil': 'موبايل',
  'Shell': 'شل',
  'Total': 'توتال',
  'Energies': 'إنرجيز',
  'Pfizer': 'فايزر',
  'Johnson': 'جونسون',
  'Walmart': 'وول مارت',
  'Disney': 'ديزني',
  'Nike': 'نايكي',
  'Coca': 'كوكا',
  'Cola': 'كولا',
  'Procter': 'بروكتير',
  'Gamble': 'غامبل',
  'United': 'يونايتد',
  'Health': 'هيلث',
  'American': 'أمريكان',
  'Express': 'إكسبرس',
};

// Sell/Buy keyword detection for fabricated number checks
const REPORT_SELL_KEYWORDS = [
  'مركز بيعي', 'بيع', 'بيعي', 'تشميل', 'قم بالبيع',
  'استهدف الانخفاض', 'اتخذ مركز بيعي', 'بيع على المكشوف',
];
const REPORT_BUY_KEYWORDS = [
  'مركز شرائي', 'شراء', 'شرائي', 'قم بالشراء',
  'استهدف الارتفاع', 'اتخذ مركز شرائي', 'اشترِ',
];

// ─── V86: Improved fixMixedArabicTitle — TRANSLITERATE instead of delete ───
// Old behavior: "باركلAYS" → "باركل" (broken)
// New behavior: "باركلAYS" → "باركليز" (correct transliteration)
function fixMixedArabicTitleWithTransliteration(title: string): string {
  if (!title || typeof title !== 'string') return title;

  const hasArabic = /[\u0600-\u06FF]/.test(title);
  if (!hasArabic) return title;

  const hasMixedLatin = /[a-zA-Z]{2,}/.test(title);
  if (!hasMixedLatin) return title;

  // Valid financial abbreviations that should be preserved as-is
  const validAbbreviations = new Set([
    'GDP', 'S&P', 'AI', 'ETF', 'IPO', 'OTC', 'EPS', 'PE', 'EBITDA',
    'NYMEX', 'COMEX', 'ICE', 'NYSE', 'NASDAQ', 'LSE', 'TSE', 'ASX',
    'CME', 'CBOT', 'FOMC', 'CPI', 'PMI',
    'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
    'WTI', 'BZ', 'CL', 'NG', 'GC', 'SI', 'XAU', 'XAG',
    'VIX', 'DXY', 'SPX', 'NDX', 'DAX', 'CAC', 'FTSE', 'NKY',
    'BTC', 'ETH', 'USDT', 'USDC',
    'HSBC', 'FED', 'OPEC', 'IMF',
    'RSI', 'MACD', 'EMA', 'SMA',
  ]);

  // Step 1: Try to match full company names first (longer matches first)
  // Sort by length descending so "JPMorgan" matches before "Morgan"
  const sortedCompanyNames = Object.keys(COMPANY_TRANSLITERATIONS)
    .sort((a, b) => b.length - a.length);

  let fixedTitle = title;
  for (const engName of sortedCompanyNames) {
    const araName = COMPANY_TRANSLITERATIONS[engName];
    if (new RegExp(engName, 'i').test(fixedTitle)) {
      // Replace the English company name with Arabic transliteration
      fixedTitle = fixedTitle.replace(new RegExp(engName, 'gi'), araName);
      console.log(`[ReportGenerator V86] Transliterated "${engName}" → "${araName}" in title`);
    }
  }

  // Step 2: For remaining Latin runs attached to Arabic (not matched by dictionary)
  const latinRuns = fixedTitle.match(/[a-zA-Z]+/g) || [];
  for (const run of latinRuns) {
    const runUpper = run.toUpperCase();
    const isValidAbbr = validAbbreviations.has(runUpper);
    const isAtWordBoundary = new RegExp(`(?:\\s|\\(|\\))${run}(?:\\s|\\)|\\.|$)`).test(fixedTitle);
    const isAttachedToArabic = new RegExp(`[\\u0600-\\u06FF]${run}|${run}[\\u0600-\\u06FF]`).test(fixedTitle);

    if (isAttachedToArabic && !isValidAbbr) {
      // Still attached to Arabic and not a valid abbreviation — remove
      fixedTitle = fixedTitle.replace(new RegExp(run, 'g'), '');
      console.warn(`[ReportGenerator V86] Removed mixed Latin "${run}" from title (no transliteration found): "${title}"`);
    }
  }

  // Clean up
  fixedTitle = fixedTitle.replace(/\s{2,}/g, ' ').trim();
  fixedTitle = fixedTitle.replace(/ال\s/g, ''); // orphaned Arabic prefix

  return fixedTitle || title;
}

// ─── Confidence Score Calculator ────────────────────────────

function calculateConfidenceScore(params: {
  newsCount: number;
  indicatorsCount: number;
  aiSucceeded: boolean;
  hasCalendarData: boolean;
  hasAnalyses: boolean;
  hasPreviousReports: boolean;
}): number {
  let score = 0;

  // News availability (0-30 points)
  if (params.newsCount >= 30) score += 30;
  else if (params.newsCount >= 15) score += 20;
  else if (params.newsCount >= 5) score += 10;
  else if (params.newsCount > 0) score += 5;

  // Indicator availability (0-20 points)
  if (params.indicatorsCount >= 10) score += 20;
  else if (params.indicatorsCount >= 5) score += 15;
  else if (params.indicatorsCount > 0) score += 10;

  // AI generation succeeded (0-25 points)
  if (params.aiSucceeded) score += 25;
  else score += 5; // Partial report from data only

  // Calendar data (0-10 points)
  if (params.hasCalendarData) score += 10;

  // Previous analyses (0-10 points)
  if (params.hasAnalyses) score += 10;

  // Historical reports (0-5 points)
  if (params.hasPreviousReports) score += 5;

  return Math.min(100, score);
}

// V242: Fixed marketImpact — was always returning 'neutral' because avgSentiment
// is typically 45-55 for most news batches (a narrow band around 50).
// The old thresholds (>60 bullish, <40 bearish) were too extreme.
// New thresholds are calibrated to actual sentiment distribution:
//   - avgSentiment 55+ → bullish (slight positive lean in financial news)
//   - avgSentiment 45- → bearish (slight negative lean)
//   - 46-54 → neutral (truly mixed signals)
function determineMarketImpact(avgSentiment: number): 'bullish' | 'bearish' | 'neutral' {
  if (avgSentiment >= 55) return 'bullish';
  if (avgSentiment <= 45) return 'bearish';
  return 'neutral';
}

// ─── Build User Prompt from Data ────────────────────────────

// ─── V223: Live Price Injection for Price-Dependent Categories ──
// Categories that REQUIRE live prices for meaningful analysis.
// Without real prices, these reports risk hallucinating price data.
const PRICE_DEPENDENT_ASSET_CLASSES: AssetClass[] = ['forex', 'commodities', 'energy', 'crypto', 'technicalAnalysis'];

// Fetches live prices from financial-apis and formats them for prompt injection.
// Falls back gracefully if API keys aren't configured.
async function fetchLivePricesForPrompt(assetClass?: AssetClass): Promise<string> {
  if (!assetClass || !PRICE_DEPENDENT_ASSET_CLASSES.includes(assetClass)) {
    return ''; // Only for price-dependent categories
  }

  try {
    const { getMarketOverview, hasApiKeys } = await import('@/lib/financial-apis');
    if (!hasApiKeys()) {
      console.log('[ReportGenerator V223] No financial API keys — skipping live price fetch');
      return '';
    }

    const overview = await getMarketOverview();
    const priceLines: string[] = [];

    // Select relevant category based on asset class
    const categoryMap: Record<string, string> = {
      forex: 'currencies',
      commodities: 'commodities',
      energy: 'commodities',
      crypto: 'crypto',
      technicalAnalysis: 'currencies',
    };
    const category = categoryMap[assetClass] || 'commodities';
    const categoryData = (overview as any)[category];

    if (categoryData && typeof categoryData === 'object') {
      for (const [symbol, data] of Object.entries(categoryData)) {
        if (data && typeof data === 'object') {
          const d = data as any;
          if (d.price) {
            const change = d.changePercent ? ` (${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%)` : '';
            priceLines.push(`${symbol}: ${d.price}${change}`);
          }
        }
      }
    }

    // Also include indices for context (always useful)
    const indices = (overview as any).indices;
    if (indices && typeof indices === 'object') {
      for (const [symbol, data] of Object.entries(indices)) {
        if (data && typeof data === 'object') {
          const d = data as any;
          if (d.price) {
            const change = d.changePercent ? ` (${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%)` : '';
            priceLines.push(`${symbol}: ${d.price}${change}`);
          }
        }
      }
    }

    if (priceLines.length === 0) {
      return '';
    }

    console.log(`[ReportGenerator V223] ✅ Fetched ${priceLines.length} live prices for ${assetClass}`);
    return `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nأسعار السوق اللحظية (مصدر: APIs مباشرة):\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${priceLines.join('\n')}\n⚠️ هذه أسعار حقيقية — استخدمها في التقرير. لا تخترع أسعاراً مختلفة.`;
  } catch (err: any) {
    console.warn(`[ReportGenerator V223] Live price fetch failed: ${err.message}`);
    return '';
  }
}

function buildUserDataPrompt(params: {
  news: CollectedNews;
  indicators: CollectedIndicators;
  calendarEvents: any[];
  analyses?: any[];
  previousReports?: any[];
  reportType: ReportType;
  event?: string;
}): string {
  const { news, indicators, calendarEvents, analyses, previousReports, reportType, event } = params;
  const parts: string[] = [];

  // Report type context
  const typeLabel = REPORT_TYPE_LABELS[reportType]?.nameAr || reportType;
  parts.push(`نوع التقرير: ${typeLabel}`);

  // Special event context
  if (event) {
    parts.push(`\nالحدث الخاص: ${event}`);
  }

  // V72: Richer data context for deeper AI analysis
  // V162: Include up to 30 news items for custom-prompt reports (was 15)
  // News data (top 30 with summaries for deep analysis)
  if (news.items.length > 0) {
    parts.push(`\nأهم الأخبار (${news.items.length} خبر):`);
    for (const item of news.items.slice(0, 30)) {
      const title = item.titleAr || item.title;
      const summary = item.summaryAr || item.summary;
      const sentiment = item.sentiment || 'neutral';
      const impact = item.impactLevel || 'medium';
      parts.push(`- ${title} | المشاعر: ${sentiment} | التأثير: ${impact}${summary ? ` | الملخص: ${summary.slice(0, 150)}` : ''}`);
    }
    parts.push(`\nتوزيع الفئات: ${Object.entries(news.categoryBreakdown).map(([k,v]) => `${k}(${v})`).join(', ')}`);
    parts.push(`المشاعر: إيجابي ${news.sentimentBreakdown.positive || 0}، محايد ${news.sentimentBreakdown.neutral || 0}، سلبي ${news.sentimentBreakdown.negative || 0}`);
    parts.push(`متوسط المشاعر: ${news.avgSentimentScore}/100`);
  } else {
    parts.push('\nلا توجد أخبار متاحة.');
  }

  // Market indicators (top 15 with more detail)
  if (indicators.all.length > 0) {
    parts.push(`\nالمؤشرات (${indicators.all.length}):`);
    for (const ind of indicators.all.slice(0, 15)) {
      const direction = ind.changePercent >= 0 ? '▲' : '▼';
      const absChange = Math.abs(ind.changePercent).toFixed(2);
      parts.push(`- ${ind.nameAr || ind.name}: ${ind.value} ${direction}${absChange}%${ind.category ? ` (${ind.category})` : ''}`);
    }
  } else {
    parts.push('\nلا توجد مؤشرات متاحة.');
  }

  // Calendar events (top 10 with more detail)
  if (calendarEvents.length > 0) {
    parts.push(`\nأحداث قادمة (${calendarEvents.length}):`);
    for (const evt of calendarEvents.slice(0, 10)) {
      const date = evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('ar-SA') : '';
      parts.push(`- ${evt.eventNameAr || evt.eventName} (${evt.country})${date ? ` — ${date}` : ''}${evt.importance ? ` | أهمية: ${evt.importance}` : ''}`);
    }
  }

  // Previous analyses (top 3 only)
  if (analyses && analyses.length > 0) {
    parts.push(`\nتحليلات سابقة:`);
    for (const a of analyses.slice(0, 3)) {
      parts.push(`- ${a.title} (${a.sentiment})`);
    }
  }

  // V202: Changed from "عناوين ## لكل قسم" to explicit V200-compliant instruction.
  // The system uses ## internally to parse sections — the AI must NOT write # or ##.
  parts.push('\nاكتب التقرير الآن بتنسيق Markdown. ⚠️ ممنوع استخدام # أو ## — استخدم ### فقط للعناوين الفرعية. النظام يحدد الأقسام تلقائياً.');

  return parts.join('\n');
}

// ─── Section Key Mapping (V63) ─────────────────────────────
// Maps report type + section index to the section key used by ReportDetailClient.
// V63: Added 'introduction' (first) and 'rouaRecommendations' (last) to each report type.
function getSectionKey(type: ReportType, sectionIndex: number): string {
  const keyMap: Record<ReportType, string[]> = {
    daily: ['introduction', 'keyMovers', 'affectedAssets', 'direction', 'whatWeWatching', 'recommendations', 'confidenceAssessment'],
    weekly: ['introduction', 'weeklyOverview', 'sectorPerformance', 'sentimentAnalysis', 'technicalOutlook', 'strategicRecommendations', 'eventCalendar', 'confidenceAssessment', 'rouaRecommendations'],
    monthly: ['introduction', 'economicOverview', 'monetaryPolicy', 'commodities', 'regionalFocus', 'riskAssessment', 'monthlyForecast', 'confidenceAssessment', 'rouaRecommendations'],
    quarterly: ['introduction', 'quarterlyOverview', 'macroAnalysis', 'sectorDeepDive', 'policyReview', 'riskFactors', 'nextQuarterForecast', 'confidenceAssessment', 'rouaRecommendations'],
    special: ['introduction', 'executiveSummary', 'marketImpact', 'historicalContext', 'expertOpinions', 'outlook', 'comparisonTable', 'detailedBreakdown', 'keyAnalysisPoints', 'confidenceAssessment', 'rouaRecommendations'],
    strategic: ['executiveSummary', 'introduction', 'context', 'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets', 'strategicRecommendations', 'rouaRecommendations', 'followUpIndicators', 'sources'],
  };
  return keyMap[type]?.[sectionIndex] || `section${sectionIndex + 1}`;
}

// ─── Parse Plain Text Report (V65) ──────────────────────────
// Parses a plain text AI response with ## headers into structured sections
function parsePlainTextReport(text: string, type: ReportType): Record<string, string> | null {
  if (!text || text.trim().length === 0) return null;
  
  const template = REPORT_TEMPLATES[type];
  if (!template) {
    console.error(`[ReportGenerator] No template found for report type: ${type} in parsePlainTextReport`);
    return null;
  }
  const sections: Record<string, string> = {};
  
  // Split by ## headers (markdown section headers)
  const parts = text.split(/^##\s+/m);
  
  if (parts.length <= 1) {
    // No ## headers found - try splitting by numbered headers or ## without space
    const altParts = text.split(/^(?:##\s*|\d+\.\s+)/m);
    if (altParts.length > 1) {
      // Try to match each part to a section title
      for (let i = 0; i < altParts.length; i++) {
        const part = altParts[i].trim();
        if (!part) continue;
        const key = getSectionKey(type, i > 0 ? i - 1 : 0);
        sections[key] = part;
      }
    } else {
      // No headers at all - put everything in the first section
      sections[getSectionKey(type, 0)] = text.trim();
    }
  } else {
    // Parse ## sections
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // First line is the section title, rest is content
      const lines = part.split('\n');
      const titleLine = lines[0].trim();
      const contentLines = lines.slice(1).join('\n').trim();
      
      // Match title to section key
      let matched = false;
      for (let j = 0; j < template.sections.length; j++) {
        const sectionTitle = template.sections[j].titleAr;
        if (titleLine.includes(sectionTitle) || sectionTitle.includes(titleLine)) {
          sections[getSectionKey(type, j)] = contentLines || titleLine;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // Use positional mapping if title doesn't match
        const sectionIndex = i - 1;
        if (sectionIndex < template.sections.length) {
          sections[getSectionKey(type, sectionIndex)] = contentLines || part;
        } else {
          // V84: Use Arabic title from content as key instead of generic "section8"
          // Extract a slug-like key from the Arabic title (remove non-word chars, limit length)
          const titleSlug = titleLine
            .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 4)
            .join('_')
            .slice(0, 40);
          const safeKey = titleSlug || `section_${i}`;
          sections[safeKey] = part;
        }
      }
    }
    
    // If there's content before the first ##, it's the intro/first section
    if (parts[0].trim()) {
      const introKey = getSectionKey(type, 0);
      if (!sections[introKey]) {
        sections[introKey] = parts[0].trim();
      }
    }
  }
  
  // If we still have no sections, put the entire content as rawContent
  if (Object.keys(sections).length === 0) {
    sections.rawContent = text.trim();
  }
  
  // V202: Strip ALL #/## markdown headings from section content
  // The UI renders section titles — any # or ## heading is redundant.
  // ### and #### are kept for sub-section rendering.
  for (const key of Object.keys(sections)) {
    if (typeof sections[key] === 'string') {
      let cleaned = sections[key];
      // Remove ## headings (but NOT ### or ####)
      cleaned = cleaned.replace(/^\s*[\u200F\u200E]*##(?!#)\s*.*$/gm, '');
      // Remove # headings (but NOT ## or ###)
      cleaned = cleaned.replace(/^\s*[\u200F\u200E]*#(?!#)\s*.*$/gm, '');
      // Remove orphaned # markers
      cleaned = cleaned.replace(/^\s*[\u200F\u200E]*#{1,6}\s*$/gm, '');
      // Remove inline ## before Arabic text
      cleaned = cleaned.replace(/(?<!#)##(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF]/g, m => m.replace(/##\s*(?:\d+[\.\s]*)?/, ''));
      cleaned = cleaned.replace(/(?<![#!])#(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF]/g, m => m.replace(/#\s*(?:\d+[\.\s]*)?/, ''));
      // Collapse excessive newlines
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      sections[key] = cleaned.trim();
    }
  }
  
  return sections;
}

// ─── Parse AI JSON Response ─────────────────────────────────

function parseAIJsonResponse(rawContent: string): Record<string, string> | null {
  if (!rawContent) return null;

  try {
    // Try to extract JSON from the response (AI may wrap it in markdown code blocks)
    let jsonStr = rawContent.trim();

    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>;
    }
  } catch (e) {
    console.warn('[ReportGenerator] Failed to parse AI JSON response, using raw content');
  }

  // If JSON parsing fails, wrap the raw content as a single section
  return { rawContent };
}

// ─── V66: Multi-Pass Section Generator ──────────────────────
// Generates a single section of a report with a dedicated AI call.
// Each section gets its own prompt with full data context, allowing
// the AI to focus deeply on one aspect of the report.

async function generateSectionContent(
  sectionKey: string,
  sectionTitleAr: string,
  type: ReportType,
  dataContext: string,
  wordsPerSection: number
): Promise<string> {
  const sectionPrompts: Record<string, string> = {
    // Introduction (all report types) — V218: Aligned with V170 (60-word narrative, no numbered points)
    introduction: `⚠️ هذا قسم إلزامي — لا تتركه فارغاً أبداً!

اكتب المقدمة في 3 جمل فقط:
- الجملة 1: ماذا يحدث؟ (الفاعل + الحدث + الرقم إن وُجد)
- الجملة 2: لماذا يهم المتداول؟ (التأثير على قرار التداول)
- الجملة 3: ما الاتجاه العام؟

قواعد صارمة:
- ممنوع النقاط المرقمة — سرد قصصي فقط
- لا تبدأ بـ "في ظل..." أو "وسط..." — ابدأ بالفاعل مباشرة
- كل جملة تكتمل — لا جمل مقطوعة
- الحد الأقصى 3 جمل — لا تزد أبداً
- ليست إعادة صياغة للعنوان — بل سياق تحليلي مختصر
- مثال صحيح: "رفع الفيدرالي الفائدة 0.25% في قرار مفاجئ مدفوعاً بتضخم أعلى من المتوقع، مما ضغط على أسهم التكنولوجيا وعزز الدولار."`,
    // Daily sections
    executiveSummary: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة محددة وقابلة للقياس تمثل خلاصة التقرير بلغة صحفية مالية احترافية. أرقام ونسب فقط — بدون سرد أو سياق.',
    keyMovers: `اكتب قسم المحركات الرئيسية: أخبار اليوم المرتبطة بالموضوع المحوري فقط.

⚠️ القواعد الصارمة:
- اختر الموضوع الأكثر تأثيراً وتماسكاً اليوم
- اذكر أخبار اليوم المرتبطة بهذا الموضوع فقط
- لكل محرك: ماذا حدث + الرقم المحدد من الأخبار + التأثير على السوق
- لا تضف أحداثاً من خارج الأخبار المقدمة
- حجم التحليل يتناسب مع حجم البيانات:
  • أخبار قليلة → تحليل مكثف لا يتجاوز 400 كلمة
  • أخبار متوسطة → تحليل متوازن
  • أخبار كثيرة → تحليل شامل منظم
- مستوى الربط بالمنطقة العربية:
  • صلة مباشرة بالخليج أو النفط أو الدولار → فقرة كاملة للتأثير الإقليمي
  • صلة غير مباشرة → جملة واحدة فقط
  • لا صلة حقيقية → لا تفتعل الربط`,
    todayCalendar: 'اكتب قسم أحداث اليوم وأخبار الشركات: عرض مفصل للأحداث الاقتصادية المهمة وأخبار الشركات المؤثرة مع أهميتها وتأثيرها المحتمل على الأسواق.',
    direction: `اكتب قسم "الاتجاه": هل الوضع يتصاعد، يتراجع، أم يتحول؟

⚠️ قواعد صارمة:
- جملتان فقط — لا تخمين
- لا تضف توقعات بعيدة — فقط الاتجاه الحالي بناءً على البيانات
- أكمل كل جملة كاملاً — ممنوع الجمل المقطوعة`,
    whatWeWatching: `اكتب قسم "ما نراقبه": مؤشر أو حدث واحد أو اثنان فقط.

⚠️ قواعد صارمة:
- كل نقطة يجب أن تكون بتاريخ أو مستوى محدد
- ممنوع: "راقب التطورات" — كن محدداً أو احذف القسم
- اذكر فقط أحداثاً حقيقية مذكورة في الأخبار أو المؤشرات المقدمة
- إذا لم تملك أحداثاً حقيقية → اكتب 1 أو 2 فقط — لا تخترع أحداثاً`,
    scenarios: `اكتب قسم "السيناريوهات" — 3 سيناريوهات محتملة للأسواق بناءً على الأخبار والبيانات المقدمة.

### السيناريو المتفائل
- احتمالية: X% (قدّر نسبة واقعية بناءً على البيانات)
- وصف: ماذا يحدث إذا سارت الأمور بإيجابية؟ ذكر المحفزات المحددة
- الأصول المستفيدة: اذكر أصولاً محددة (مثل: الذهب، S&P 500، النفط)

### السيناريو المحايد
- احتمالية: X%
- وصف: ماذا يحدث إذا استمر الوضع على ما هو عليه؟
- الأصول المستقرة: اذكر أصولاً محددة

### السيناريو المتشائم
- احتمالية: X%
- وصف: ماذا يحدث إذا ساءت الأمور؟ ذكر المخاطر المحددة
- الأصول المهددة: اذكر أصولاً محددة

⚠️ قواعد صارمة:
- الاحتمالات الثلاث يجب أن يكون مجموعها 100%
- لا تخترع أحداثاً — استند إلى الأخبار والمؤشرات المقدمة فقط
- كن محدداً في الأصول: لا تقل "الأسهم" بل قل "S&P 500" أو "أسهم التكنولوجيا"
- كل سيناريو يجب أن يكون مرتبطاً بأخبار فعلية مذكورة في البيانات`,
    confidenceAssessment: `اكتب قسم "مستوى الثقة":

أعطِ مستوى الثقة بهذا التنسيق بالضبط:
- مستوى الثقة: X/10
- التبرير: جملة واحدة تبرر الرقم بناءً على:
  • عدد الأخبار الداعمة
  • وجود أرقام محددة
  • تنوع المصادر
- إذا الثقة 6 أو أقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"
- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"

⚠️ الثقة تُحسب فعلاً بناءً على:
• عدد الأخبار الداعمة
• وجود أرقام محددة
• تنوع المصادر
• لا يكون رقماً ثابتاً في كل تقرير`,
    // Weekly sections
    weeklyOverview: 'اكتب النظرة الأسبوعية الشاملة: تحليل معمق لأداء الأسواق خلال الأسبوع مع مقارنة بالأسبوع السابق وأرقام محددة. وسّع التحليل — عدة فقرات طويلة ومفصلة.',
    sectorPerformance: 'اكتب قسم أداء القطاعات: تحليل مفصل لكل قطاع مع أفضل وأسوأ القطاعات وأسباب الأداء وجدول مقارنة. وسّع التحليل.',
    sentimentAnalysis: 'اكتب قسم تحليل المشاعر السوقية: تحليل معمق لمشاعر المستثمرين ومؤشرات الخوف والطمع مع بيانات محددة.',
    technicalOutlook: 'اكتب قسم النظرة الفنية: تحليل فني للمؤشرات الرئيسية مع مستويات الدعم والمقاومة والأنماط الفنية والأهداف السعرية.',
    strategicRecommendations: 'اكتب قسم التوصيات الاستراتيجية: توصيات محددة مبنية على تحليل مع نطاق زمني ومستوى مخاطرة. ممنوع التوصية بجملة واحدة بدون سياق.',
    eventCalendar: 'اكتب قسم تقويم الأحداث القادمة: عرض مفصل لأهم الأحداث الاقتصادية القادمة مع أهميتها وتأثيرها المحتمل.',
    // Monthly sections
    economicOverview: 'اكتب النظرة العامة الاقتصادية: تحليل شامل للناتج المحلي والتضخم والنمو والبطالة مع أرقام محددة ومصادر موثوقة.',
    monetaryPolicy: 'اكتب قسم السياسة النقدية: تحليل مفصل لسياسات البنوك المركزية وتأثيرها مع آراء 3 خبراء على الأقل.',
    commodities: 'اكتب قسم السلع والطاقة: تحليل معمق لأسواق النفط والذهب والغاز مع أرقام محددة وتحليل العرض والطلب.',
    regionalFocus: 'اكتب قسم التركيز الإقليمي: تحليل مفصل للأسواق العربية مع أرقام ومقارنات وجدول مقارنة.',
    riskAssessment: 'اكتب قسم تقييم المخاطر: تحليل شامل للمخاطر الجيوسياسية والاقتصادية مع تقييم احتمالية كل خطر وتأثيره.',
    monthlyForecast: 'اكتب قسم التوقعات الشهرية: 3 سيناريوهات (متفائل/محايد/متشائم) مع احتمالية كل سيناريو ومؤشراته وأهداف سعرية.',
    // Affected assets (strategic reports)
    affectedAssets: `اكتب قسم "الأصول المتأثرة" — قسّم إلى فئتين واضحتين:

### أصول تستفيد
لكل أصل: الاسم + الرمز (مثل XAU/USD) + سبب محدد للاستفادة
⚠️ لا تذكر أصلاً إلا إذا ذُكر في الأخبار أو له ارتباط مباشر موثق

### أصول تتضرر
لكل أصل: الاسم + الرمز + سبب محدد للتضرر
⚠️ لا تذكر أصلاً إلا إذا ذُكر في الأخبار أو له ارتباط مباشر موثق

⚠️ قواعد صارمة:
- لا تكرر نفس الأصل في الفئتين
- كل أصل مرتبط بحدث أو بيانات مذكورة في الأخبار
- لا تخترع أسباباً — استند إلى الأخبار المقدمة فقط
- مثال: "الذهب (XAU/USD) — يستفيد من تراجع الدولار وارتفاع المخاطر الجيوسياسية"
- مثال: "الدولار (DXY) — يتضرر من ضغوط الديون الفيدرالية"`,
    // Quarterly sections
    quarterlyOverview: 'اكتب النظرة الربع سنوية الشاملة: تحليل معمق لأداء الربع مع مقارنة بالأرباع السابقة وأرقام محددة وجدول مقارنة.',
    macroAnalysis: 'اكتب قسم التحليل الاقتصادي الكلي: تحليل معمق للمؤشرات الكلية مع توقعات اقتصادية وسيناريوهات.',
    sectorDeepDive: 'اكتب قسم التعمق القطاعي: تحليل مفصل لكل قطاع رئيسي مع أداء الشركات القيادية وجدول مقارنة.',
    policyReview: 'اكتب قسم مراجعة السياسات: تحليل شامل للسياسات النقدية والمالية والتنظيمية وتأثيرها مع آراء خبراء.',
    riskFactors: 'اكتب قسم عوامل الخطر: تحليل مفصل لعوامل الخطر الرئيسية مع احتمالية الحدوث والتأثير المحتمل.',
    nextQuarterForecast: 'اكتب قسم توقعات الربع القادم: 3 سيناريوهات مفصلة مع احتمالاتها ومؤشراتها وتوصيات استراتيجية.',
    // Special sections (V80: 10 sections)
    marketImpact: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأسعار الأسهم وأسعار الصرف وحجم التداولات والقطاعات المتأثرة مع أرقام محددة ومصادر.',
    historicalContext: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ محددة ونتائجها.',
    expertOpinions: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل مع الاسم والمنصب والمؤسسة وموقف كل منهم وتحليل لماذا رأيه ذو صلة.',
    outlook: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات (متفائل/محايد/متشائم) مع احتمالية كل سيناريو ومؤشراته.',
    comparisonTable: 'اكتب قسم جدول مقارنة: جدول Markdown ببيانات حقيقية ومتسقة مع وحدة القياس في رأس الجدول. لا تضع نفس الكيان تحت اسمين مختلفين.',
    detailedBreakdown: 'اكتب قسم القائمة التفصيلية: قائمة أو جدول ثانٍ بتفاصيل إضافية مهمة مع أرقام واقعية.',
    keyAnalysisPoints: 'اكتب قسم النقاط التحليلية: نقاط تحليلية أو مقارنة إضافية مع أرقام وتحليل معمق.',
    // Roua Recommendations (all report types)
    // Daily recommendations — 3 only with specific format (aligned with new daily prompt)
    recommendations: `اكتب قسم "التوصيات": 3 توصيات فقط — لا أكثر.

لكل توصية حدد بالضبط:
- **الأصل**: اسم محدد (مثال: XAU/USD، EUR/USD، S&P 500)
- **سعر الدخول**: رقم محدد مستند لما في الأخبار
- **وقف الخسارة**: سعر محدد
- **الهدف**: سعر مستهدف

⚠️ قواعد صارمة:
- 3 توصيات فقط — لا أكثر
- كل رقم مستند لما في الأخبار المقدمة
- ممنوع توصيات استثمارية تتجاوز 3
- ممنوع أرقام مخترعة — استند إلى البيانات المتاحة فقط`,
    rouaRecommendations: `اكتب قسم توصيات رؤى — قرارات عملية قابلة للتنفيذ فوراً. صيغة المخاطبة المباشرة ("اشترِ..." / "بع..." / "جمّع..." / "راقب..."). مقسم لثلاث شرائح:

### المتداول اليومي (أفق أسبوع أو أقل)
لكل توصية حدد:
- **الأصل**: اسم محدد (مثال: XAU/USD، BTC/USDT، WTI نفط)
- **الإجراء**: شراء / بيع / تجميع / مراقبة
- **سعر الدخول**: رقم محدد (مثال: 3320 دولار)
- **الهدف**: سعر مستهدف (مثال: 3380 دولار)
- **وقف الخسارة**: سعر محدد (مثال: 3290 دولار)
- **نسبة التخصيص**: نسبة من رأس المال (مثال: 5%)

### المستثمر متوسط الأجل (1-6 أشهر)
لكل توصية حدد:
- **الأصل**: اسم محدد مع السبب الجوهري
- **الإجراء**: شراء / بيع / تقليل / زيادة
- **نطاق الدخول**: نطاق سعري
- **الهدف**: سعر مستهدف ونسبة صعود متوقعة
- **وقف الخسارة**: مستوى الخروج
- **نسبة التخصيص**: نسبة من المحفظة

### المستثمر طويل الأجل (6 أشهر فأكثر)
استراتيجيات بناء محفظة مع:
- **القطاع**: قطاع محدد مع سبب الاختيار
- **التخصيص**: نسبة من المحفظة الكلية
- **المرجع**: مؤشر أو حدث يعيد تقييم الاستراتيجية

⚠️ قواعد صارمة:
- كل توصية = أصل محدد + إجراء محدد + أرقام محددة
- ممنوع صيغة المحلل المحايد ("يُتوقع أن..." / "قد يشهد..." / "من المحتمل أن...")
- ممنوع نسخ أي جملة من أقسام التحليل
- إذا البيانات لا تكفي لتوصية محددة → اكتب "لا تتوفر بيانات كافية لتوصية محددة في هذه الشريحة" فقط
- لا تخترع أسعار — استند إلى البيانات والمؤشرات المقدمة فقط`,
  };

  const sectionInstruction = sectionPrompts[sectionKey] || `اكتب قسم "${sectionTitleAr}" بتفصيل شامل ومعمق.`;

  // V165: INCREASED data context from 2000 → 6000 chars
  // The 2000 char limit was starving the AI of data, causing short/shallow sections.
  // 6000 chars ≈ 1500 tokens — well within model limits while providing rich context.
  const truncatedContext = dataContext.length > 6000
    ? dataContext.slice(0, 6000) + '\n... (بيانات إضافية محذوفة للإيجاز)'
    : dataContext;

  // V84: Include current date in data context to prevent year errors
  const nowDateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateEnforcedContext = `التاريخ اليوم: ${nowDateStr}\n\n${truncatedContext}`;

  // V66.2: Single attempt per section (no retries) to stay within Railway proxy timeout
  // Each section takes ~8-12s, so 6 sections = ~50-70s total
  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `أنت محرر صحفي متخصص في التحليل المالي والاقتصادي، تكتب لجمهور عربي مهتم بالأسواق المالية العالمية.

القواعد الصارمة (V158/V232) — لا تخالفها أبداً:
1. لا تكرار — كل فقرة يجب أن تضيف معلومة جديدة مختلفة تماماً.
2. لا حشو — ابدأ مباشرة بالمعلومة دون مقدمات فارغة. ممنوع "في هذا السياق" و"هذا الإنجاز يعتبر إنجازاً كبيراً".
3. أرقام محددة — إذا وُجدت أرقام في البيانات، اذكرها. إذا لم توجد: لا تخترع أرقاماً.
4. ممنوع التكرار — هذا قسم محدد من تقرير أكبر. لا تكرر أي معلومة من أقسام أخرى.
   ⚠️ V232: كل قسم يتناول زاوية مختلفة من نفس البيانات — لا تعد كتابة نفس الفكرة بصياغة مختلفة!
   المقدمة = سياق سردي | الملخص = أرقام ونسب | المحركات = تحليل عميق | الاتجاه = توقعات
5. عناوين فرعية — استخدم ### للعناوين الفرعية داخل القسم.
6. أسماء أقسام وصفية بالعربية وليس "section8" أو "قسم 3".
7. وسّع التحليل بقدر ما تستطيع — استخدم كل البيانات المتاحة. إذا البيانات لا تكفي: وسّع التحليل في ما هو متاح بدلاً من كتابة "لا تتوفر بيانات".
8. Markdown فقط — لا JSON. جداول للمقارنات. **للعريض**.
9. لا تبدأ العناوين بـ "تقرير يومي" أو "تحليل" — ابدأ بالحدث مباشرة.
10. اربط التحليل بالبيانات المقدمة: اذكر الأخبار والمؤشرات بالاسم.
11. لا تكتب عبارات عامة مثل "يعد هذا العامل من أبرز المحركات" — كن محدداً بأرقام وأسماء وتواريخ.
12. القسم الشامل المبني على بيانات حقيقية أفضل من القسم المختصر الفقير — وسّع ولا تختصر.
13. ممنوع جمل مقطوعة — كل جملة تكتمل قبل الانتقال للجملة التالية.
14. لا تخترع أسماء خبراء — إذا لم يُذكر خبير: اكتب "لم تُنشر آراء خبراء حول هذا الموضوع بعد".
15. قواعد اقتصادية: خفض الإنتاج = ارتفاع الأسعار (ليس العكس). زيادة العرض = انخفاض الأسعار.
16. V232: ممنوع الجمل القالبية المتكررة عبر الأقسام مثل:
    - "يعد هذا العامل من أبرز المحركات المؤثرة" — ممنوعة تماماً
    - "يؤثر بشكل مباشر على قرارات المستثمرين" — ممنوعة تماماً
    - "من المتوقع أن يؤثر على السوق" — قل ماذا التأثير بالرقم
    - "تشهد الأسواق تحركات مهمة" — أي تحركات؟ كن محدداً
    إذا وجدت نفسك تكتب جملة عامة → احذفها واستبدلها بمعطى محدد

المصطلحات الإلزامية:
• futures = عقود آجلة | chips/semiconductors = رقائق إلكترونية | session = جلسة
• dollar = دولار (ليس دينار) | tariffs = تعريفات جمركية | الفيدرالي = الفيدرالي
• أسماء الشركات: تعريب صوتي + الإنجليزي بين قوسين أول مرة فقط

مستوى الربط بالمنطقة العربية:
• صلة مباشرة بالخليج أو النفط أو الدولار → فقرة كاملة للتأثير الإقليمي
• صلة غير مباشرة → جملة واحدة فقط
• لا صلة حقيقية → لا تفتعل الربط`,
      },
      {
        role: 'user',
        content: `${sectionInstruction}\n\nالبيانات:\n${dateEnforcedContext}\n\n*** اكتب القسم الآن. لا تكرر معلومات من أقسام أخرى. وسّع التحليل — لا تختصر. اكتب عدة فقرات طويلة ومفصلة. ***`,
      },
    ], {
      temperature: 0.4,
      maxTokens: Math.min(8192, Math.max(4000, Math.ceil(wordsPerSection * 8))), // V226: increased min from 2500→4000, multiplier 5→8 for Arabic
      priority: 'generation',
    });

    const content = result.content?.trim() || '';
    const wc = content.split(/\s+/).length;
    const wasTruncatedByProvider = result.stopReason === 'max_tokens' || result.stopReason === 'length'; // V226
    console.log(`[ReportGenerator] Section "${sectionKey}": ${wc} words (${result.provider}, ${result.duration}ms${wasTruncatedByProvider ? ', ⚠️ TRUNCATED BY PROVIDER' : ''})`);

    // V82→V164: Only skip section if the ENTIRE content is just "لا تتوفر بيانات"
    // If the AI wrote actual content but mentioned this phrase, keep the content
    const contentWithoutPhrase = content.replace(/لا تتوفر بيانات كافية حالياً\.?/g, '').replace(/لا تتوفر بيانات\.?/g, '').trim();
    if (contentWithoutPhrase.length < 20 && (content.includes('لا تتوفر بيانات كافية') || content.includes('لا تتوفر بيانات'))) {
      console.log(`[ReportGenerator V82] Section "${sectionKey}": Model reported insufficient data AND no other content — skipping section`);
      return ''; // Skip this section entirely — truly no data
    }

    // V159→V226: Detect and fix truncated sentences (AI sometimes cuts mid-sentence due to maxTokens)
    // Check if the content ends abruptly without a proper sentence-ending character
    const lastChar = content.trim().slice(-1);
    const sentenceEnders = ['.', '؟', '!', '۔', ':', '"', ')', ']', '}', '»', '؛', '،']; // V226: added Arabic semicolon ؛ and comma ،
    const endsWithSentenceEnder = sentenceEnders.includes(lastChar);
    const endsWithListNumber = /[٠-٩\d]\.$/.test(content.trim().slice(-3)); // e.g. "٣."
    const looksTruncated = wasTruncatedByProvider || (!endsWithSentenceEnder && !endsWithListNumber && content.length > 50); // V226: also detect via provider stopReason

    if (looksTruncated) {
      // Try to find the last complete sentence
      let lastEndIdx = -1;
      for (const ender of sentenceEnders) {
        const idx = content.lastIndexOf(ender);
        if (idx > lastEndIdx) lastEndIdx = idx;
      }
      if (lastEndIdx > content.length * 0.3) { // V226: relaxed threshold from 50% to 30%
        // Cut at the last complete sentence (preserve at least 30% of content)
        const fixedContent = content.slice(0, lastEndIdx + 1).trim();
        console.warn(`[ReportGenerator V226] Section "${sectionKey}": Truncated content detected — trimmed to last complete sentence (${content.length} → ${fixedContent.length} chars)`);
        if (fixedContent.split(/\s+/).length >= 20) {
          return fixedContent;
        }
      } else {
        console.warn(`[ReportGenerator V226] Section "${sectionKey}": Truncated content detected but no good sentence boundary found (lastEnd at ${lastEndIdx}/${content.length}). Keeping as-is to avoid data loss.`);
      }
    }

    if (wc >= 20) {
      return content;
    }
  } catch (error: any) {
    console.error(`[ReportGenerator] Section "${sectionKey}" failed:`, error.message);
  }

  // One retry with minimal prompt
  try {
    const result = await chatCompletion([
      { role: 'system', content: 'أنت محلل مالي عربي. اكتب بالعربية.' },
      { role: 'user', content: `اكتب تحليلاً عن "${sectionTitleAr}":\n${truncatedContext.slice(0, 800)}` },
    ], { temperature: 0.5, maxTokens: 3000, priority: 'generation' }); // V226: increased from 2000 to 3000
    const content = result.content?.trim() || '';
    if (content.split(/\s+/).length >= 15) return content;
  } catch { /* give up */ }

  return '';
}

// ─── V66: Multi-Pass Long Report Generator ──────────────────
// For wordCount > 800, generates each section in a separate AI call.
// This avoids timeout/empty-content issues with long single-pass generation.

async function generateReportMultiPass(
  type: ReportType,
  context: ReportContext,
  news: CollectedNews,
  indicators: CollectedIndicators,
  calendarEvents: any[],
  analyses: any[],
  previousReports: any[]
): Promise<{ aiContent: Record<string, string>; aiSucceeded: boolean }> {
  const template = REPORT_TEMPLATES[type];
  if (!template) {
    console.error(`[ReportGenerator] No template found for report type: ${type}`);
    return { aiContent: {}, aiSucceeded: false };
  }
  const targetWordCount = context.wordCount || 0;
  const sectionCount = template.sections.length;

  // V73: Distribute words across sections with minimum 80 words per section.
  // For 500-word reports with 7-8 sections: ~65-70 words each, rounded up to 80.
  // Introduction and recommendations get fewer words; analysis sections get more.
  const baseWordsPerSection = Math.max(80, Math.ceil(targetWordCount / sectionCount));
  const wordsPerSection = baseWordsPerSection;

  // Build a compact data context for section prompts
  const dataContext = buildUserDataPrompt({
    news,
    indicators,
    calendarEvents,
    analyses,
    previousReports,
    reportType: type,
    event: context.event,
  });

  console.log(`[ReportGenerator] V66 Multi-pass: Generating ${sectionCount} sections, ~${wordsPerSection} words each for ${targetWordCount} word report...`);

  const aiContent: Record<string, string> = {};
  let sectionsSucceeded = 0;

  // Generate sections sequentially to avoid rate limiting
  for (let i = 0; i < sectionCount; i++) {
    const section = template.sections[i];
    const sectionKey = getSectionKey(type, i);

    console.log(`[ReportGenerator] V66 Multi-pass: Generating section ${i + 1}/${sectionCount} "${sectionKey}" (${section.titleAr})...`);

    const content = await generateSectionContent(
      sectionKey,
      section.titleAr,
      type,
      dataContext,
      wordsPerSection
    );

    if (content && content.trim().length > 20) {
      aiContent[sectionKey] = content;
      sectionsSucceeded++;
    }
    // V218: Introduction is MANDATORY — if AI returned <20 chars, retry with simpler prompt
    if (sectionKey === 'introduction' && (!content || content.trim().length <= 20)) {
      console.log(`[ReportGenerator V218] Introduction empty/short — retrying with simplified prompt`);
      try {
        const nowDateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
        const retryResult = await chatCompletion([
          { role: 'system', content: 'أنت محرر صحفي مالي تكتب بالعربية. اكتب فقرة سردية واحدة (2-3 جمل، 60 كلمة كحد أقصى) تضع الحدث في سياقه. لا نقاط مرقمة — سرد فقط.' },
          { role: 'user', content: `اكتب مقدمة مختصرة (2-3 جمل) عن أهم حدث مالي اليوم.\n\nالتاريخ: ${nowDateStr}\n\nالبيانات:\n${dataContext.slice(0, 2000)}` },
        ], { temperature: 0.4, maxTokens: 200, priority: 'generation' });
        const retryContent = retryResult.content?.trim() || '';
        if (retryContent.length > 20) {
          aiContent[sectionKey] = retryContent;
          sectionsSucceeded++;
          console.log(`[ReportGenerator V218] Introduction retry succeeded: ${retryContent.split(/\s+/).length} words`);
        }
      } catch (retryErr: any) {
        console.error(`[ReportGenerator V218] Introduction retry failed: ${retryErr.message}`);
      }
    }
    // V82: Skip sections with insufficient data — don't generate fake fallback content
    // Previously we would create a generic "لم تتوفر بيانات" placeholder, but that adds no value.
    // Better to have fewer sections with real content than padded sections with filler.
  }

  const aiSucceeded = sectionsSucceeded >= Math.ceil(sectionCount / 2); // At least half the sections must succeed
  console.log(`[ReportGenerator] V66 Multi-pass: ${sectionsSucceeded}/${sectionCount} sections generated successfully`);

  // V232: Cross-section deduplication — remove sentences that appear in multiple sections
  // This prevents the AI from repeating the same analysis across sections
  const sectionKeys = Object.keys(aiContent);
  if (sectionKeys.length > 1) {
    const seenSentences = new Map<string, string>(); // sentence → sectionKey where it first appeared
    let duplicatesRemoved = 0;

    for (const key of sectionKeys) {
      const content = aiContent[key];
      if (!content || content.length < 50) continue;

      const sentences = content.split(/(?<=[.؟!۔؛])\s+/);
      const dedupedSentences: string[] = [];

      for (const sentence of sentences) {
        const normalized = sentence.replace(/[#*_\-\s]/g, '').trim();
        if (normalized.length < 20) {
          // Too short to be a meaningful duplicate — keep it
          dedupedSentences.push(sentence);
          continue;
        }

        // Check if this sentence (or a very similar one) appeared in another section
        let isDuplicate = false;
        const existingEntries = Array.from(seenSentences.entries());
        for (const [existingNorm, existingKey] of existingEntries) {
          if (existingKey === key) continue; // Same section — OK
          // Check for high overlap (>=70% of chars match)
          if (normalized.length >= existingNorm.length * 0.7 &&
              existingNorm.length >= normalized.length * 0.7) {
            const shorterLen = Math.min(normalized.length, existingNorm.length);
            let matchChars = 0;
            for (let ci = 0; ci < shorterLen; ci++) {
              if (normalized[ci] === existingNorm[ci]) matchChars++;
            }
            if (matchChars / shorterLen >= 0.7) {
              isDuplicate = true;
              duplicatesRemoved++;
              break;
            }
          }
        }

        if (!isDuplicate) {
          dedupedSentences.push(sentence);
          seenSentences.set(normalized, key);
        }
      }

      if (dedupedSentences.length < sentences.length) {
        const newContent = dedupedSentences.join(' ').trim();
        if (newContent.split(/\s+/).length >= 15) {
          aiContent[key] = newContent;
        }
      }
    }

    if (duplicatesRemoved > 0) {
      console.log(`[ReportGenerator V232] Cross-section deduplication: ${duplicatesRemoved} duplicate sentences removed`);
    }
  }

  return { aiContent, aiSucceeded };
}

// ─── V165: Multi-Pass Analysis Generator ───────────────────
// Generates each section of a market analysis with a dedicated AI call.
// This is the KEY fix for the "short reports" problem:
// Previously, generateMarketAnalysis used a single AI call for the entire
// report, which produced short/shallow content. Now each section gets
// its own AI call, allowing deep focused analysis per section.

interface AnalysisSectionDef {
  key: string;            // Section key for storage
  titleAr: string;       // Section title in Arabic
  instruction: string;   // What the AI should write for this section
  minWords: number;      // Minimum word count for this section
}

// V165: Section definitions for each asset class
// Each asset class has its own set of sections tailored to its domain.
const ANALYSIS_SECTIONS: Record<AssetClass, AnalysisSectionDef[]> = {
  strategic: [
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة محددة وقابلة للقياس تمثل خلاصة التحليل الاستراتيجي. أرقام ونسب فقط — بدون سرد أو سياق.', minWords: 60 },
    { key: 'introduction', titleAr: 'مقدمة التقرير', instruction: 'اكتب مقدمة التقرير: فقرة سردية كاملة (3-4 جمل) تضع الحدث في سياقه الزمني والمكاني. من؟ ماذا؟ متى؟ لماذا يهم الآن؟ ممنوع النقاط المرقمة — سرد قصصي فقط.', minWords: 50 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: قارن الحدث الحالي بأحداث مشابهة سابقة مع تواريخ وأرقام محددة. إذا لم تعرف سياقاً تاريخياً حقيقياً → اختر حدثاً مرتبطاً معقولاً. وسّع التحليل — عدة فقرات.', minWords: 100 },
    { key: 'economicImpact', titleAr: 'التداعيات الاقتصادية المباشرة', instruction: 'اكتب قسم التداعيات الاقتصادية: قسّم حسب القطاعات. لكل قطاع: التأثير + حجمه + مدته المتوقعة. وسّع التحليل بقدر ما تستطيع.', minWords: 150 },
    { key: 'marketImpact', titleAr: 'تأثير على أسواق المال', instruction: 'اكتب قسم التأثير على أسواق المال: اذكر المؤشرات والأصول بأسمائها الحقيقية ورموزها. لا تذكر أرقاماً إلا إذا كانت موثوقة. وسّع التحليل — عدة فقرات مفصلة.', minWords: 150 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: ⚠️ ممنوع اختراع أسماء خبراء! إذا وُجد خبراء في البيانات: الاسم + المنصب + المؤسسة + الموقف. إذا لم يُذكر أي خبير: اكتب "لم تُنشر آراء خبراء حول هذا الموضوع بعد." فقط.', minWords: 40 },
    { key: 'scenarios', titleAr: 'السيناريوهات', instruction: 'اكتب قسم السيناريوهات: 3 سيناريوهات (متفائل/محايد/متشائم). لكل سيناريو: الاحتمالية + الافتراضات + التأثير المتوقع + الأصول المتأثرة. مجموع الاحتمالات = 100%.', minWords: 150 },
    { key: 'affectedAssets', titleAr: 'أصول تستفيد وأصول تتضرر', instruction: 'اكتب قسم الأصول المتأثرة: قسّم إلى فئتين. أصول تستفيد: الاسم + الرمز + السبب + مستوى مراقبة. أصول تتضرر: الاسم + الرمز + السبب + مستوى مراقبة. وسّع التحليل — عدة فقرات لكل فئة.', minWords: 100 },
    { key: 'strategicRecommendations', titleAr: 'التوصيات الاستراتيجية', instruction: 'اكتب قسم التوصيات الاستراتيجية: تحليل أكاديمي موضوعي — ماذا تقول البيانات؟ مقسم حسب: أفراد / مؤسسات / متداولون. صيغة الغائب. كل فئة: التوجه + الأصول المرجعية + مستوى الدخول التقريبي + الهدف + وقف الخسارة. وسّع التحليل.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح: المتداول اليومي / المستثمر متوسط الأجل / المستثمر طويل الأجل. كل توصية = أصل + إجراء + رقم (دخول/وقف/هدف). صيغة المخاطبة المباشرة. ممنوع نسخ أي جملة من التوصيات الاستراتيجية.', minWords: 120 },
    { key: 'monitoringIndicators', titleAr: 'مؤشرات المتابعة', instruction: 'اكتب قسم مؤشرات المتابعة: 5 مؤشرات محددة يجب مراقبتها لتحديث هذا التقرير. كل مؤشر: الاسم + القيمة الحالية + ما الذي سيغير التوصيات إذا تغير.', minWords: 80 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  stocks: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لسوق الأسهم والحدث الأبرز. ممنوع النقاط المرقمة — سرد قصصي فقط.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط بدون سرد.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأسعار الأسهم وحجم التداولات والقطاعات المتأثرة مع أرقام محددة ومصادر. وسّع التحليل — عدة فقرات.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ محددة. وسّع التحليل — لا تختصر.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل مع الاسم والمنصب والمؤسسة وموقف كل منهم.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية مبني كل منها على بيانات أو حدث محدد. كل سيناريو: الاحتمالية + الوصف + الأصول المتأثرة.', minWords: 150 },
    { key: 'comparisonTable', titleAr: 'جدول مقارنة أداء القطاعات', instruction: 'اكتب قسم جدول مقارنة: جدول Markdown بأداء القطاعات أو المؤشرات الرئيسية مع أرقام واقعية من البيانات فقط.', minWords: 80 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة: نقاط تحليلية مبنية على بيانات فعلية مع مستويات دعم ومقاومة إن وُجدت. وسّع التحليل.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح: المتداول اليومي / المستثمر متوسط الأجل / المستثمر طويل الأجل. كل توصية = أصل + إجراء + رقم.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  commodities: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لأسواق السلع والحدث الأبرز. ما السلعة الأبرز حركة؟ ما المحرك الرئيسي (عرض/طلب/دولار/جيوسياسة)؟', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5-7 نقاط مرقمة — أرقام ونسب فقط: أسعار الذهب والفضة والنحاس والسلع الأخرى مع التغيرات.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'تحليل الذهب والمعادن', instruction: 'اكتب تحليل مفصل للذهب والفضة والبلاتين: السعر الحالي + التغير + العوامل المحركة (العوائد الحقيقية، الدولار، التضخم، الطلب المركزي). فقرة كاملة لكل معدن.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'المعادن الصناعية والزراعية', instruction: 'اكتب تحليل النحاس والحديد والليثيوم والسلع الزراعية: الطلب الصيني + المخزونات + سلسلة التوريد. اربط بدورة النمو العالمي.', minWords: 150 },
    { key: 'expertOpinions', titleAr: 'العرض والطلب والدولار', instruction: 'اكتب تحليل قوى العرض والطلب العالمية + تأثير مؤشر الدولار DXY على السلع. أرقام محددة لمستويات المخزونات والإنتاج.', minWords: 120 },
    { key: 'scenarios', titleAr: 'السيناريوهات', instruction: 'اكتب 3 سيناريوهات واقعية: صعودي (25-35%) / عرضي (40-50%) / هبوطي (20-30%). كل سيناريو: الاحتمالية + الافتراضات + مستويات سعرية مستهدفة للذهب والنحاس + المحفزات. مجموع الاحتمالات = 100%.', minWords: 150 },
    { key: 'comparisonTable', titleAr: 'جدول مقارنة أسعار السلع', instruction: 'اكتب جدول Markdown بأسعار السلع الرئيسية (الذهب، الفضة، النحاس، الحديد، القمح) مع السعر الحالي والتغير اليومي والأسبوعي. فقط من البيانات المقدمة أو أسعار الإنترنت.', minWords: 80 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب نقاط تحليلية مبنية على بيانات فعلية: مستويات دعم ومقاومة للذهب والنحاس + إشارات فنية + توقعات قصيرة الأجل.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب توصيات رؤى بأسعار تنفيذية محددة. مقسم لثلاث شرائح: للمتداول اليومي (السلعة | الإجراء | مستوى الدخول | وقف الخسارة | الهدف | السبب) — للمستثمر متوسط الأجل (نسبة من المحفظة + نقطة دخول + أفق) — للمستثمر طويل الأجل (استراتيجية هيكلية + وزن المحفظة). ⚠️ كل توصية يجب أن تحتوي على أرقام أسعار تنفيذية!', minWords: 150 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  forex: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لسوق العملات والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأزواج العملات الرئيسية والسياسات النقدية مع أرقام محددة ومصادر.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ محددة.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل مع الاسم والمنصب والمؤسسة وموقف كل منهم.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية مبني كل منها على شرط أو حدث محدد.', minWords: 150 },
    { key: 'comparisonTable', titleAr: 'جدول مقارنة أداء العملات', instruction: 'اكتب قسم جدول مقارنة: جدول Markdown بأداء أزواج العملات الرئيسية من البيانات المقدمة فقط.', minWords: 80 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة: نقاط تحليلية مبنية على بيانات فعلية مع مستويات فنية إن وُجدت.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  crypto: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لسوق العملات الرقمية والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأسعار العملات الرقمية وحجم التداولات والسيولة مع أرقام محددة.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ محددة.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'comparisonTable', titleAr: 'جدول مقارنة', instruction: 'اكتب قسم جدول مقارنة: جدول Markdown بأسعار العملات الرئيسية والتغيرات.', minWords: 80 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  bonds: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لسوق السندات والعوائد والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لعوائد السندات ومنحنى العائد مع أرقام محددة ومصادر.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
  ],
  energy: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لأسواق الطاقة والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأسعار النفط والغاز والعرض والطلب مع أرقام محددة.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث مماثلة سابقة مع أرقام وتواريخ.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'comparisonTable', titleAr: 'جدول مقارنة', instruction: 'اكتب قسم جدول مقارنة: جدول Markdown بأسعار الطاقة والتغيرات.', minWords: 80 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  realEstate: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام لسوق العقارات والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لسوق العقارات والأسعار والطلب مع أرقام محددة.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  economy: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام للاقتصاد والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي للمؤشرات الاقتصادية والناتج المحلي والتضخم مع أرقام محددة.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي: مقارنة مع أحداث اقتصادية سابقة مشابهة.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  banking: [
    { key: 'introduction', titleAr: 'مقدمة التحليل', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة (3-4 جمل) تصف الاتجاه العام للقطاع المصرفي والحدث الأبرز.', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط مرقمة — أرقام ونسب فقط.', minWords: 60 },
    { key: 'marketImpact', titleAr: 'التأثير على السوق', instruction: 'اكتب قسم التأثير على السوق: تحليل تفصيلي لأداء البنوك وأسعار الفائدة مع أرقام محددة.', minWords: 150 },
    { key: 'historicalContext', titleAr: 'السياق التاريخي', instruction: 'اكتب قسم السياق التاريخي.', minWords: 100 },
    { key: 'expertOpinions', titleAr: 'آراء الخبراء', instruction: 'اكتب قسم آراء الخبراء: 3 خبراء على الأقل.', minWords: 120 },
    { key: 'scenarios', titleAr: 'التوقعات والسيناريوهات', instruction: 'اكتب قسم التوقعات والسيناريوهات: 3 سيناريوهات واقعية.', minWords: 150 },
    { key: 'keyAnalysisPoints', titleAr: 'نقاط تحليلية معمقة', instruction: 'اكتب قسم النقاط التحليلية المعمقة.', minWords: 120 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة. مقسم لثلاث شرائح.', minWords: 120 },
  ],
  technicalAnalysis: [
    { key: 'introduction', titleAr: 'مقدمة التحليل الفني', instruction: 'اكتب مقدمة التحليل: فقرة سردية كاملة تصف الاتجاه العام والأداة المالية محل التحليل.', minWords: 50 },
    { key: 'trendAnalysis', titleAr: 'تحليل الاتجاه', instruction: 'اكتب قسم تحليل الاتجاه: تحليل مفصل للاتجاه على الإطار اليومي والأسبوعي مع أرقام محددة.', minWords: 150 },
    { key: 'supportResistance', titleAr: 'مستويات الدعم والمقاومة', instruction: 'اكتب قسم مستويات الدعم والمقاومة: مستويات محددة مع أرقام من البيانات المتاحة.', minWords: 100 },
    { key: 'technicalIndicators', titleAr: 'المؤشرات الفنية', instruction: 'اكتب قسم المؤشرات الفنية: RSI, MACD, المتوسطات المتحركة, بولينجر — مع قراءات محددة.', minWords: 150 },
    { key: 'scenarios', titleAr: 'سيناريوهات التداول', instruction: 'اكتب قسم سيناريوهات التداول: 3 سيناريوهات (صاعد/عرضي/هابط) مع نقاط دخول وخروج ووقف خسارة.', minWords: 150 },
    { key: 'riskManagement', titleAr: 'إدارة المخاطر', instruction: 'اكتب قسم إدارة المخاطر: حجم المركز ونسبة المخاطرة/العائد وتوصيات إدارة رأس المال.', minWords: 80 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب قسم توصيات رؤى: قرارات عملية مباشرة مع مستويات سعرية محددة. مقسم لثلاث شرائح.', minWords: 120 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
  arabMarkets: [
    { key: 'introduction', titleAr: 'مقدمة التقرير', instruction: 'اكتب مقدمة التقرير: فقرة سردية مختصرة (2-3 جمل، 60 كلمة كحد أقصى) تصف مشهد الأسواق العربية اليوم. ما السوق الأبرز؟ ما المحرك الرئيسي؟', minWords: 50 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5-7 نقاط مرقمة — أرقام فقط: تداول + دبي + أبوظبي + مصر + برنت.', minWords: 60 },
    { key: 'saudiMarket', titleAr: 'السوق السعودي — تداول', instruction: 'اكتب تحليل معمّق للسوق السعودية: المؤشر الرئيسي + أرامكو + القطاعات الرائدة + أبرز حركات الأسهم + التدفقات الأجنبية. أكبر سوق عربي — وسّع التحليل!', minWords: 150 },
    { key: 'dubaiMarket', titleAr: 'سوق دبي المالي', instruction: 'اكتب تحليل مفصل لسوق دبي: المؤشر + العقارات (إعمار، ديكار) + البنوك + الطروحات.', minWords: 120 },
    { key: 'abuDhabiMarket', titleAr: 'سوق أبوظبي', instruction: 'اكتب تحليل سوق أبوظبي: المؤشر + أدنوك + البنوك + المشاريع الحكومية.', minWords: 100 },
    { key: 'egyptKuwaitMarkets', titleAr: 'الأسواق المصرية والكويتية', instruction: 'اكتب تحليل بورصة مصر (المؤشر + سعر الصرف + الاستثمار الأجنبي) وبورصة الكويت (البنوك + المشاريع التنموية) والبحرين وعُمان إن توفرت بيانات.', minWords: 120 },
    { key: 'regionalGlobalImpact', titleAr: 'التأثير الإقليمي والعالمي', instruction: 'اكتب تحليل تأثير العوامل الخارجية: النفط + الفائدة الأمريكية + التوترات الجيوسياسية + الأسواق العالمية.', minWords: 120 },
    { key: 'ipoActivity', titleAr: 'الطروحات الأولية (IPOs)', instruction: 'اكتب تحليل نشاط الطروحات: الحالية + القادمة + مقارنة إقليمية. إن لم تتوفر أخبار طروحات → وسّع تحليل الأسواق.', minWords: 80 },
    { key: 'scenarios', titleAr: 'السيناريوهات', instruction: 'اكتب 3 سيناريوهات: صعودي (25-35%) / عرضي (40-50%) / هبوطي (20-30%). لكل سيناريو: الاحتمالية + الأسواق المستفيدة/المهددة + المحفزات.', minWords: 150 },
    { key: 'rouaRecommendations', titleAr: 'توصيات رؤى', instruction: 'اكتب توصيات رؤى بأسعار تنفيذية محددة. مقسم لثلاث شرائح: المتداول اليومي / المستثمر متوسط الأجل / المستثمر طويل الأجل. كل توصية = سهم/مؤشر + إجراء + رقم تنفيذي.', minWords: 150 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم تقييم الثقة: مستوى الثقة X/10 + التبرير سطر واحد + تصنيف النشر: انشر / لا تنشر', minWords: 30 },
  ],
  earnings: [
    { key: 'introduction', titleAr: 'مقدمة التقرير', instruction: 'اكتب مقدمة التقرير: فقرة كاملة (3-4 جمل) تصف المشهد العام لأسواق اليوم وأبرز ما يميز جلسة التداول الحالية. ⚠️ فقرة سردية كاملة — ممنوع جملة واحدة فقط! ⚠️ ليست إعادة صياغة للعنوان — بل سياق أوسع يربط بين الأحداث.', minWords: 60 },
    { key: 'executiveSummary', titleAr: 'الملخص التنفيذي', instruction: 'اكتب الملخص التنفيذي: 5 نقاط رئيسية — أهم ما يجب أن يعرفه المتداول اليوم. كل نقطة: فكرة واحدة + رقم واحد + جملتان كحد أقصى. ⚠️ نقاط كمية محددة — أرقام ونسب فقط.', minWords: 80 },
    { key: 'indicatorPerformance', titleAr: 'أداء المؤشرات الرئيسية', instruction: 'اكتب قسم أداء المؤشرات الرئيسية: جدول بالمؤشرات المتاحة (المؤشر | القيمة | التغير | الاتجاه). اذكر فقط المؤشرات التي لديك بيانات حقيقية عنها. لا تخترع أرقاماً. ⚠️ قسم كامل بجدول — ممنوع جملة واحدة فقط!', minWords: 80 },
    { key: 'earningsAnnouncements', titleAr: 'أبرز إعلانات الأرباح', instruction: 'اكتب قسم أبرز إعلانات الأرباح: لكل شركة: الاسم والرمز + موعد الإعلان + التوقعات إن وُجدت + التأثير المتوقع على السهم + الربط مع أخبار أخرى ذات صلة. ⚠️ قسم تفصيلي — اربط بين إعلانات الشركات المترابطة (قطاع التقنية، قطاع البنوك، إلخ).', minWords: 200 },
    { key: 'economicContext', titleAr: 'السياق الاقتصادي والجيوسياسي', instruction: 'اكتب قسم السياق الاقتصادي والجيوسياسي: فقرة كاملة عن الأحداث المؤثرة على الأسواق اليوم وكيف تؤثر على أرباح الشركات المذكورة. ⚠️ فقرة كاملة — ممنوع جملة واحدة فقط!', minWords: 100 },
    { key: 'regionalMarkets', titleAr: 'أداء الأسواق الإقليمية', instruction: 'اكتب قسم أداء الأسواق الإقليمية: قسّم إلى الأسواق الخليجية والأسواق الأوروبية والآسيوية إن توفرت بيانات. لا تذكر سوقاً ليس لديك بيانات عنه. ⚠️ قسم تفصيلي — ممنوع اختصاره لجملة واحدة!', minWords: 100 },
    { key: 'scenarios', titleAr: 'السيناريوهات', instruction: 'اكتب قسم السيناريوهات: 3 سيناريوهات (متفائل/محايد/متشائم). لكل سيناريو: الاحتمالية + المحفزات أو المخاطر + الأصول المستفيدة أو المهددة. مجموع الاحتمالات = 100%. ⚠️ كل سيناريو مرتبط بأخبار فعلية مذكورة في البيانات.', minWords: 150 },
    { key: 'rouaRecommendations', titleAr: 'التوصيات', instruction: 'اكتب قسم التوصيات مقسماً لثلاث شرائح: للمتداول اليومي (لكل توصية: الأصل | الإجراء | المستوى | الهدف | وقف الخسارة | السبب) — للمستثمر متوسط الأجل (لكل توصية: الأصل | الإجراء | الأفق الزمني | السبب) — للمستثمر طويل الأجل (لكل توصية: الأصل | الإجراء | الأفق الزمني | السبب). ⚠️ كل شريحة يجب أن تحتوي على 2-3 توصيات محددة بأصول وأرقام!', minWords: 150 },
    { key: 'monitoringIndicators', titleAr: 'مؤشرات المتابعة', instruction: 'اكتب قسم مؤشرات المتابعة: 5 مؤشرات محددة يجب مراقبتها غداً. كل مؤشر: الاسم + ما الذي سيغير التوصيات إذا تغير.', minWords: 60 },
    { key: 'confidenceAssessment', titleAr: 'تقييم الثقة', instruction: 'اكتب قسم "تقييم الثقة":\n\nأعطِ مستوى الثقة بهذا التنسيق بالضبط:\n- مستوى الثقة: X/10\n- التبرير: سطر واحد يشرح لماذا هذا الرقم (بناءً على: عدد المصادر، وجود أرقام محددة، تنوع الأخبار)\n- إذا الثقة 6 فأقل → أضف: "تصنيف النشر: لا تنشر — يحتاج مراجعة"\n- إذا الثقة أعلى من 6 → أضف: "تصنيف النشر: انشر"\n\n⚠️ الثقة تُحسب فعلاً بناءً على:\n• عدد المصادر المتاحة\n• وجود أرقام وبيانات محددة\n• تنوع الأخبار وعمقها\n• لا يكون رقماً ثابتاً في كل تقرير', minWords: 30 },
  ],
};

async function generateAnalysisMultiPass(
  assetClass: AssetClass,
  dataContext: string,
  systemPrompt: string,
  customPrompt?: string,
  webSearchContext?: string,   // V164: Web search data for current prices
): Promise<{ aiContent: Record<string, string>; aiSucceeded: boolean; rawContent: string }> {
  const sections = ANALYSIS_SECTIONS[assetClass] || ANALYSIS_SECTIONS.stocks;
  const sectionCount = sections.length;

  console.log(`[ReportGenerator V165] Multi-pass analysis: Generating ${sectionCount} sections for ${assetClass}...`);

  const aiContent: Record<string, string> = {};
  let sectionsSucceeded = 0;
  let fullRawContent = '';

  const nowDateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  // V165: Use full data context (not truncated) for analysis sections — this is the key fix.
  // The 6000 char limit in generateSectionContent is for report sections,
  // but for analysis sections we can afford to send more context since each section
  // has its own focused prompt.
  const analysisDataContext = dataContext.length > 8000
    ? dataContext.slice(0, 8000) + '\n... (بيانات إضافية محذوفة للإيجاز)'
    : dataContext;

  // Generate sections sequentially to avoid rate limiting
  for (let i = 0; i < sectionCount; i++) {
    const section = sections[i];
    console.log(`[ReportGenerator V165] Generating section ${i + 1}/${sectionCount} "${section.key}" (${section.titleAr}) for ${assetClass}...`);

    // Build section-specific instruction with custom prompt context
    let sectionInstruction = section.instruction;

    // If custom prompt is provided, add it as context to each section
    if (customPrompt) {
      sectionInstruction = `*** موضوع التحليل: ${customPrompt} ***\n\n${sectionInstruction}\n\n⚠️ اكتب عن الموضوع المطلوب تحديداً — لا تتجاهله وتكتب عن موضوع آخر. وسّع التحليل — لا تختصر.`;
    }

    // V164: Include web search data (current prices) in the context for each section
    const dateEnforcedContext = `التاريخ اليوم: ${nowDateStr}\n\n${analysisDataContext}${webSearchContext || ''}`;

    try {
      const result = await chatCompletion([
        {
          role: 'system',
          content: systemPrompt + '\n\nقواعد إضافية (V165):\n1. هذا قسم محدد من تحليل أكبر — اكتبه بتفصيل شامل ومعمق.\n2. وسّع التحليل بقدر ما تستطيع — كل قسم عدة فقرات طويلة ومفصلة.\n3. لا تختصر — إذا وُجدت بيانات فوسّع التحليل فيها.\n4. لا تكرر معلومات من أقسام أخرى — كل قسم يحتوي على معلومات فريدة.\n5. اربط التحليل بالبيانات المقدمة: اذكر الأخبار والمؤشرات بالاسم.\n6. Markdown فقط — لا JSON. جداول للمقارنات.',
        },
        {
          role: 'user',
          content: `## ${section.titleAr}\n\n${sectionInstruction}\n\nالبيانات:\n${dateEnforcedContext}\n\n*** اكتب القسم الآن بتفصيل شامل. لا تختصر. وسّع التحليل — عدة فقرات طويلة ومفصلة. ***`,
        },
      ], {
        temperature: 0.4,
        maxTokens: Math.min(8192, Math.max(4000, Math.ceil(section.minWords * 10))), // V226: increased min 2500→4000, multiplier 8→10 for Arabic
        priority: 'generation',
      });

      const content = result.content?.trim() || '';
      const wc = content.split(/\s+/).length;
      const wasTruncatedByProvider = result.stopReason === 'max_tokens' || result.stopReason === 'length'; // V226

      // Only skip section if the ENTIRE content is just "لا تتوفر بيانات"
      const contentWithoutPhrase = content.replace(/لا تتوفر بيانات كافية حالياً\.?/g, '').replace(/لا تتوفر بيانات\.?/g, '').trim();
      if (contentWithoutPhrase.length < 20 && (content.includes('لا تتوفر بيانات كافية') || content.includes('لا تتوفر بيانات'))) {
        console.log(`[ReportGenerator V165] Section "${section.key}": insufficient data — skipping`);
        continue;
      }

      // V226: Fix truncated content in multi-pass sections too
      let finalContent = content;
      if (wasTruncatedByProvider || wc >= 15) {
        const lastChar = content.trim().slice(-1);
        const sentenceEnders = ['.', '؟', '!', '۔', ':', '"', ')', ']', '}', '»', '؛'];
        const endsWithSentenceEnder = sentenceEnders.includes(lastChar);
        const endsWithListNumber = /[٠-٩\d]\.$/.test(content.trim().slice(-3));
        const looksTruncated = wasTruncatedByProvider || (!endsWithSentenceEnder && !endsWithListNumber && content.length > 50);

        if (looksTruncated) {
          let lastEndIdx = -1;
          for (const ender of sentenceEnders) {
            const idx = content.lastIndexOf(ender);
            if (idx > lastEndIdx) lastEndIdx = idx;
          }
          if (lastEndIdx > content.length * 0.3) {
            const fixedContent = content.slice(0, lastEndIdx + 1).trim();
            if (fixedContent.split(/\s+/).length >= 15) {
              finalContent = fixedContent;
              console.warn(`[ReportGenerator V226] Multi-pass section "${section.key}": Truncated — trimmed to last complete sentence (${content.length} → ${fixedContent.length} chars)`);
            }
          }
        }
      }

      if (wc >= 15) {
        aiContent[section.key] = finalContent;
        fullRawContent += `\n\n## ${section.titleAr}\n\n${finalContent}`;
        sectionsSucceeded++;
        console.log(`[ReportGenerator V165] Section "${section.key}": ${wc} words${wasTruncatedByProvider ? ' (⚠️ was truncated)' : ''} ✓`);
      } else {
        console.warn(`[ReportGenerator V165] Section "${section.key}": only ${wc} words — too short, skipping`);
      }
    } catch (error: any) {
      console.error(`[ReportGenerator V165] Section "${section.key}" failed:`, error.message);
    }

    // V218: Introduction is MANDATORY for analysis reports — retry if empty
    if (section.key === 'introduction' && !aiContent[section.key]) {
      console.log(`[ReportGenerator V218] Analysis introduction empty — retrying with simplified prompt`);
      try {
        const retryResult = await chatCompletion([
          { role: 'system', content: 'أنت محرر صحفي مالي تكتب بالعربية. اكتب فقرة سردية واحدة (2-3 جمل، 60 كلمة كحد أقصى). لا نقاط مرقمة — سرد فقط.' },
          { role: 'user', content: `اكتب مقدمة مختصرة (2-3 جمل) عن: ${customPrompt || 'أهم حدث مالي'}\n\nالتاريخ: ${nowDateStr}\n\nالبيانات:\n${analysisDataContext.slice(0, 2000)}` },
        ], { temperature: 0.4, maxTokens: 200, priority: 'generation' });
        const retryContent = retryResult.content?.trim() || '';
        if (retryContent.length > 20) {
          aiContent[section.key] = retryContent;
          fullRawContent += `\n\n## ${section.titleAr}\n\n${retryContent}`;
          sectionsSucceeded++;
          console.log(`[ReportGenerator V218] Analysis introduction retry succeeded: ${retryContent.split(/\s+/).length} words`);
        }
      } catch (retryErr: any) {
        console.error(`[ReportGenerator V218] Analysis introduction retry failed: ${retryErr.message}`);
      }
    }
  }

  const aiSucceeded = sectionsSucceeded >= Math.ceil(sectionCount / 2);
  console.log(`[ReportGenerator V165] Multi-pass analysis: ${sectionsSucceeded}/${sectionCount} sections generated for ${assetClass}`);

  return { aiContent, aiSucceeded, rawContent: fullRawContent.trim() };
}

// ─── Main Generator Function ────────────────────────────────

export async function generateReport(
  type: ReportType,
  context?: ReportContext
): Promise<GeneratedReport> {
  const now = new Date();
  const template = REPORT_TEMPLATES[type];
  if (!template) {
    console.error(`[ReportGenerator] No template found for report type: ${type} in generateReport`);
    return {
      title: `تقرير ${type}`,
      slug: `${type}-error-${Date.now()}`,
      reportType: type,
      scope: 'global',
      summary: 'خطأ في توليد التقرير: نوع التقرير غير معروف',
      sections: [],
      marketImpact: { overall: 'neutral', score: 50 },
      confidenceScore: 0,
      isPublished: false,
    } as any;
  }
  const targetWordCount = context?.wordCount && context.wordCount > 0 ? context.wordCount : 0;

  // Determine time range based on report type
  let since = new Date();
  switch (type) {
    case 'daily':
      since.setDate(now.getDate() - 1);
      break;
    case 'weekly':
      since.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      since.setMonth(now.getMonth() - 1);
      break;
    case 'quarterly':
      since.setMonth(now.getMonth() - 3);
      break;
    case 'special':
      since.setDate(now.getDate() - 3); // Last 3 days for context
      break;
  }

  // 1. Collect relevant data
  console.log(`[ReportGenerator] Collecting data for ${type} report${targetWordCount ? ` (${targetWordCount} words target)` : ''}...`);
  const [news, indicators, calendarEvents, analyses, previousReports] = await Promise.all([
    collectNews(since),
    collectIndicators(),
    collectCalendarEvents(since, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    type !== 'daily' ? collectAnalyses(since) : Promise.resolve([]),
    type === 'monthly' || type === 'quarterly' ? collectPreviousReports(type, since) : Promise.resolve([]),
  ]);

  // 2. Build the system and user prompts
  const systemPrompt = SYSTEM_PROMPTS[type];
  let userPrompt = buildUserDataPrompt({
    news,
    indicators,
    calendarEvents,
    analyses,
    previousReports,
    reportType: type,
    event: context?.event,
  });

  // V68: If custom prompt is provided, prepend it to the user prompt
  // V162: Enhanced custom prompt instruction for comprehensive output
  if (context?.prompt) {
    userPrompt = `*** موضوع التقرير المطلوب: ${context.prompt} ***

*** تعليمات إلزامية للموضوع المطلوب:
- هذا التقرير مطلوب خصيصاً عن الموضوع أعلاه — لا تتجاهله وتكتب عن موضوع آخر
- اجمع كل الأخبار المرتبطة بهذا الموضوع من البيانات المقدمة
- اربط بين الأخبار المترابطة التي تتحدث عن ذات الموضوع
- وسّع التحليل واعمقه — لا تختصر — المستخدم طلب تقريراً مفصلاً
- كل قسم يجب أن يكون عدة فقرات طويلة ومفصلة
- التقرير يجب أن يكون شاملاً ومعمقاً وليس ملخصاً موجزاً
***

${userPrompt}`;
  }

  // 3. Call AI to generate the report
  let aiContent: Record<string, string> | null = null;
  let aiSucceeded = false;
  let rawContent = '';

  // V73: Always use multi-pass for ALL reports to prevent repetition and ensure quality.
  // Single-pass causes: repeated sections, thin content, empty sections.
  // Multi-pass generates each section independently with dedicated prompts.
  const useMultiPass = true;

  if (useMultiPass) {
    // ── Multi-pass: generate each section separately ──
    console.log(`[ReportGenerator] V66: Using multi-pass generation for ${targetWordCount} word report`);
    const multiPassResult = await generateReportMultiPass(
      type,
      { ...context, wordCount: targetWordCount } as ReportContext,
      news,
      indicators,
      calendarEvents,
      analyses,
      previousReports
    );
    aiContent = multiPassResult.aiContent;
    aiSucceeded = multiPassResult.aiSucceeded;
  } else {
    // ── Single-pass: original generation for short reports ──
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      console.log(`[ReportGenerator] Calling AI for ${type} report${targetWordCount ? ` (${targetWordCount} words target)` : ''}...`);

      // Calculate maxTokens — V67→V226: Increased defaults for richer Arabic content
      let maxTokens: number;
      if (targetWordCount > 0) {
        maxTokens = Math.min(16384, Math.max(6000, Math.ceil(targetWordCount * 6))); // V226: min 6000 (was 8192 cap), multiplier 3.5→6
      } else {
        maxTokens = 8000;
      }

      // Add word count instruction to user prompt if specified
      if (targetWordCount > 0) {
        const wordCountInstruction = `\n\n*** تعليمات هامة حول طول التقرير: يجب أن يكون التقرير طويلاً ومفصلاً بحيث لا يقل عن ${targetWordCount} كلمة عربية. اكتب كل قسم بتفصيل شامل مع أمثلة وتحليلات معمقة وبيانات داعمة. لا تختصر أي قسم بل وسّع في الشرح والتحليل حتى تصل إلى الطول المطلوب. كل قسم يجب أن يكون عدة فقرات طويلة ومفصلة. ***`;
        messages[1] = { ...messages[1], content: messages[1].content + wordCountInstruction };
      }

      const result = await chatCompletion(messages, {
        temperature: 0.4,
        maxTokens,
        priority: 'generation',
      });

      rawContent = result.content;
      aiContent = parseAIJsonResponse(rawContent);
      aiSucceeded = !!aiContent && Object.keys(aiContent).length > 1;

      // V226: Detect single-pass truncation and fix section content
      const wasTruncatedByProvider = result.stopReason === 'max_tokens' || result.stopReason === 'length';
      if (wasTruncatedByProvider) {
        console.warn(`[ReportGenerator V226] Single-pass AI hit max_tokens — content may be truncated!`);
        // Fix each section's content if it looks truncated
        if (aiContent && typeof aiContent === 'object') {
          for (const key of Object.keys(aiContent)) {
            const val = aiContent[key];
            if (typeof val !== 'string' || val.length < 50) continue;
            const lastChar = val.trim().slice(-1);
            const sentenceEnders = ['.', '؟', '!', '۔', ':', '"', ')', ']', '}', '»', '؛'];
            const endsWithSentenceEnder = sentenceEnders.includes(lastChar);
            const endsWithListNumber = /[٠-٩\d]\.$/.test(val.trim().slice(-3));
            if (!endsWithSentenceEnder && !endsWithListNumber) {
              let lastEndIdx = -1;
              for (const ender of sentenceEnders) {
                const idx = val.lastIndexOf(ender);
                if (idx > lastEndIdx) lastEndIdx = idx;
              }
              if (lastEndIdx > val.length * 0.3) {
                const fixed = val.slice(0, lastEndIdx + 1).trim();
                if (fixed.split(/\s+/).length >= 15) {
                  aiContent[key] = fixed;
                  console.warn(`[ReportGenerator V226] Fixed truncated section "${key}": ${val.length} → ${fixed.length} chars`);
                }
              }
            }
          }
        }
      }

      // If JSON parsing failed but we have raw content, try plain text parsing
      if (!aiSucceeded && rawContent.trim().length > 50) {
        console.log(`[ReportGenerator] JSON parsing failed, trying plain text parsing...`);
        const plainSections = parsePlainTextReport(rawContent, type);
        if (plainSections && Object.keys(plainSections).length > 0) {
          aiContent = plainSections;
          aiSucceeded = true;
          console.log(`[ReportGenerator] Plain text parsing succeeded: ${Object.keys(plainSections).length} sections`);
        } else {
          // Last resort: use raw content as a single section
          aiContent = { rawContent };
          aiSucceeded = true;
          console.log(`[ReportGenerator] Using raw content as fallback`);
        }
      }

      console.log(`[ReportGenerator] AI generation ${aiSucceeded ? 'succeeded' : 'returned partial data'} (provider: ${result.provider}, duration: ${result.duration}ms)`);
    } catch (error: any) {
      console.error(`[ReportGenerator] AI generation failed for ${type} report:`, error.message);
      aiSucceeded = false;

      // V66: Fallback — if single-pass fails and we have enough data, try multi-pass as rescue
      if (targetWordCount > 0 || type !== 'daily') {
        console.log(`[ReportGenerator] V66: Single-pass failed, attempting multi-pass rescue...`);
        try {
          const multiPassResult = await generateReportMultiPass(
            type,
            { ...context, wordCount: targetWordCount || 1000 } as ReportContext,
            news,
            indicators,
            calendarEvents,
            analyses,
            previousReports
          );
          if (multiPassResult.aiSucceeded) {
            aiContent = multiPassResult.aiContent;
            aiSucceeded = true;
            console.log(`[ReportGenerator] V66: Multi-pass rescue succeeded`);
          }
        } catch (rescueError: any) {
          console.error(`[ReportGenerator] V66: Multi-pass rescue also failed:`, rescueError.message);
        }
      }
    }
  }

  // 4. Calculate confidence score
  const algorithmicConfidence = calculateConfidenceScore({
    newsCount: news.items.length,
    indicatorsCount: indicators.all.length,
    aiSucceeded,
    hasCalendarData: calendarEvents.length > 0,
    hasAnalyses: analyses.length > 0,
    hasPreviousReports: previousReports.length > 0,
  });

  // V159: Extract AI-generated confidence from the confidenceAssessment section
  // If the AI gave a X/10 score, use it (scaled to 0-100) as the primary confidence.
  // This fixes the mismatch where header shows "55%" but AI section shows "7/10".
  let aiConfidenceScore: number | null = null;
  const confidenceSection = aiContent?.confidenceAssessment || '';
  const confidenceMatch = confidenceSection.match(/مستوى الثقة[:\s]*(\d+)\s*\/\s*10/);
  if (confidenceMatch) {
    const aiScore = parseInt(confidenceMatch[1], 10);
    if (aiScore >= 1 && aiScore <= 10) {
      aiConfidenceScore = aiScore * 10; // Scale 1-10 → 10-100
      console.log(`[ReportGenerator V159] AI confidence: ${aiScore}/10 → ${aiConfidenceScore}% (algorithmic: ${algorithmicConfidence}%)`);
    }
  }

  // Use AI confidence if available (more accurate), otherwise fall back to algorithmic
  let confidenceScore = aiConfidenceScore !== null ? aiConfidenceScore : algorithmicConfidence;

  console.log(`[ReportGenerator] Confidence score: ${confidenceScore}${aiConfidenceScore !== null ? ' (AI-derived)' : ' (algorithmic)'}`);

  // V222: "لا تنشر" gate — scan AI content for explicit "do not publish" directive
  // This applies to ALL EconomicReport types (daily, weekly, monthly, etc.)
  if (aiContent) {
    const contentStr = typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent);
    const doNotPublish = checkDoNotPublishDirective(contentStr);
    if (doNotPublish.shouldSuppress) {
      console.warn(`[ReportGenerator V222] 🚫 "لا تنشر" GATE for ${type} report: ${doNotPublish.reason}`);
      confidenceScore = doNotPublish.extractedConfidence
        ? Math.min(confidenceScore, doNotPublish.extractedConfidence * 10)
        : Math.min(confidenceScore, 15);
    }
  }

  // 5. Build the structured report
  const marketImpact = determineMarketImpact(news.avgSentimentScore);
  const typeLabel = REPORT_TYPE_LABELS[type].nameAr;
  const dateStr = now.toLocaleDateString('ar-SA');

  // V69: Build title — AI-generated descriptive title (event + impact)
  let title: string;
  if (context?.title) {
    // V68: Use custom title if provided
    title = context.title;
  } else if (type === 'special' && context?.event) {
    title = context.event;
  } else {
    // V69: Generate a descriptive title from the news headlines
    const headlines = news.items.map(n => n.titleAr || n.title);
    // V232: For daily reports, extract sector/theme context for a comprehensive title
    // Daily reports cover 50-100+ news across many sectors — the title must reflect
    // the overall market picture, NOT pick one marginal headline.
    const sectorInfo = type === 'daily' ? {
      newsCount: news.items.length,
      sectors: [...new Set(news.items.map(n => n.category).filter(Boolean))],
      sentiment: news.avgSentimentScore,
    } : undefined;
    title = await generateDescriptiveTitle(headlines, typeLabel, undefined, sectorInfo);
  }

  // V223: Title-Content Number Contradiction Check for EconomicReport too
  if (aiSucceeded && aiContent && title) {
    const aiContentStr = typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent);
    const numberContradiction = checkTitleNumberContradiction(title, aiContentStr);
    if (numberContradiction.hasContradiction) {
      console.warn(`[ReportGenerator V223] 🚨 NUMBER CONTRADICTION in ${type} report: "${title}". ${numberContradiction.reason}`);
      // Regenerate title with contradiction-aware prompt
      try {
        const headlines = news.items.map(n => n.titleAr || n.title).filter(t => t.length > 5);
        const fixResult = await chatCompletion([
          {
            role: 'system',
            content: `أنت محرر مالي. اكتب عنواناً واحداً فقط لتقرير مالي.
القواعد:
1. العنوان يجب أن يلخص الحدث بدقة — بلا تحريف
2. ⚠️ لا تقل "دون مستوى X" إلا إذا كان السعر فعلاً أقل من X
3. إذا لم تكن متأكداً — استخدم وصفاً نوعياً
4. 5-12 كلمة فقط
5. أجب بالعنوان فقط`,
          },
          {
            role: 'user',
            content: `الأخبار:
- ${headlines.slice(0, 5).join('\n- ')}

المحتوى الفعلي يذكر: ${numberContradiction.contentNumber}
اكتب عنواناً لا يتعارض مع هذا الرقم:`,
          },
        ], { temperature: 0.3, maxTokens: 200, priority: 'translation' });

        let fixedTitle = fixResult.content?.trim() || '';
        fixedTitle = fixedTitle.replace(/^["]+|["\n]+$/g, '').trim();
        fixedTitle = fixedTitle.replace(/^[#\-*]+\s*/, '');

        if (fixedTitle && fixedTitle !== title) {
          const recheck = checkTitleNumberContradiction(fixedTitle, aiContentStr);
          if (!recheck.hasContradiction) {
            console.log(`[ReportGenerator V223] ✅ Title fixed: "${title}" → "${fixedTitle}"`);
            title = fixedTitle;
          } else {
            console.warn(`[ReportGenerator V223] ⚠️ Fixed title still contradicts. Penalizing confidence.`);
            confidenceScore = Math.min(confidenceScore, 30);
          }
        }
      } catch (fixErr: any) {
        console.warn(`[ReportGenerator V223] Title fix failed: ${fixErr.message}`);
        confidenceScore = Math.min(confidenceScore, 30);
      }
    }
  }

  // V69: Build slug — ALWAYS include timestamp for hourly uniqueness
  const timeSuffix = '-' + now.getTime().toString(36);
  const slugBase = `${type}-report-${now.toISOString().split('T')[0]}${timeSuffix}${type === 'special' && context?.event ? '-' + context.event.replace(/\s+/g, '-').slice(0, 30) : ''}`;
  const slug = generateSlug(slugBase);

  // Build summary — clean JSON code blocks from AI responses
  // V67: Fixed to NOT destroy Arabic word spacing
  const cleanSummaryText = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/```(?:json)?\s*/gi, '');
    // If the text is a JSON object, extract readable text from it
    if (cleaned.trim().startsWith('{') || cleaned.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(cleaned.trim());
        if (typeof parsed === 'object' && parsed !== null) {
          const extractText = (obj: any): string[] => {
            const parts: string[] = [];
            if (typeof obj === 'string') { if (obj.length > 10) parts.push(obj); }
            else if (Array.isArray(obj)) { for (const item of obj) parts.push(...extractText(item)); }
            else if (typeof obj === 'object' && obj !== null) {
              for (const val of Object.values(obj)) {
                if (typeof val === 'string' && val.length > 10) parts.push(val);
                else if (typeof val === 'object' && val !== null) parts.push(...extractText(val));
              }
            }
            return parts;
          };
          const textParts = extractText(parsed);
          if (textParts.length > 0) return textParts.slice(0, 3).join('. ');
        }
      } catch { /* not JSON */ }
    }
    // V67: Return text with Arabic spaces preserved
    // V225: Use smart truncation at word/sentence boundary instead of blind .slice(0, 500)
    return truncateAtBoundary(cleaned, 500);
  };

  // V242: Detect generic/boilerplate summary patterns that indicate AI failed
  const isGenericSummary = (text: string): boolean => {
    const GENERIC_PATTERNS = [
      /تقرير\s+\S+\s+يغطي\s+\d+\s+خبر\s+اقتصادي/i,
      /متوسط\s+مشاعر\s+السوق\s*:\s*\d+\s*\/\s*100/i,
      /تقرير\s+يومي\s+يغطي/i,
      /تقرير\s+أسبوعي\s+يغطي/i,
      /تقرير\s+شهري\s+يغطي/i,
    ];
    return GENERIC_PATTERNS.some(p => p.test(text));
  };

  let summary: string;
  let summaryIsGeneric = false;  // V242: Track if summary is generic
  if (aiContent?.introduction) {
    summary = cleanSummaryText(aiContent.introduction);
  } else if (aiContent?.executiveSummary || aiContent?.weeklyOverview || aiContent?.economicOverview || aiContent?.quarterlyOverview || aiContent?.eventAnalysis) {
    summary = cleanSummaryText(aiContent.executiveSummary || aiContent.weeklyOverview || aiContent.economicOverview || aiContent.quarterlyOverview || aiContent.eventAnalysis || '');
  } else if (aiContent?.rawContent) {
    summary = cleanSummaryText(truncateAtBoundary(aiContent.rawContent, 500)); // V226: use truncateAtBoundary instead of raw .slice(0, 500)
  } else {
    summary = `تقرير ${typeLabel} يغطي ${news.items.length} خبر اقتصادي. متوسط مشاعر السوق: ${news.avgSentimentScore}/100`;
    summaryIsGeneric = true;  // V242: Mark as generic
  }

  // V242: If the AI-generated summary is also generic, penalize confidence
  if (!summaryIsGeneric && isGenericSummary(summary)) {
    summaryIsGeneric = true;
    console.warn(`[ReportGenerator V242] ⚠️ AI returned generic/boilerplate summary — penalizing confidence`);
  }

  // V67: Separate cleaner for section content — does NOT truncate!
  // cleanSummaryText truncates to 500 chars (for the summary field only).
  // Section content must be preserved in full.
  const cleanSectionText = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/```(?:json|markdown)?\s*/gi, '');
    // Remove escaped quotes
    cleaned = cleaned.replace(/\\"/g, '"');
    // Collapse excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    // Remove JSON key-value patterns
    cleaned = cleaned.replace(/"[a-zA-Z_]+":\s*"/g, '');
    // Remove trailing quote+comma artifacts
    cleaned = cleaned.replace(/",?\s*$/gm, '');
    // Remove stray commas at end of lines
    cleaned = cleaned.replace(/,\s*$/gm, '');
    // Fix double punctuation
    cleaned = cleaned.replace(/([.!؟،])\1+/g, '$1');
    // DO NOT truncate — return full content with Arabic spaces preserved
    return cleaned.trim();
  };

  // V70: Add disclaimer to every report
  const DISCLAIMER = '\n\n---\n\n> **إخلاء مسؤولية**: هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي وهو لأغراض إعلامية فقط ولا يُعد نصيحة استثمارية. يُرجى استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية. الأرقام والنسب المذكورة مستندة إلى البيانات المتاحة وقت الإنشاء وقد لا تعكس الوضع الحالي.';

  // Build sections with disclaimer appended
  const processedSections = aiContent ? Object.fromEntries(
    Object.entries(aiContent).map(([k, v]) => {
      const cleaned = typeof v === 'string' ? cleanSectionText(v) : v;
      // V70: Append disclaimer to rouaRecommendations (last section)
      if (k === 'rouaRecommendations' && typeof cleaned === 'string') {
        return [k, cleaned + DISCLAIMER];
      }
      return [k, cleaned];
    })
  ) : { rawContent: (rawContent || summary) + DISCLAIMER };

  // V218: Introduction quality gate — enforce 60-word max (V170 aligned)
  // V170: Introduction = 2-3 sentences, 60 words max, narrative only
  // Note: executiveSummary has different rules (numbered points, no word limit)
  const MAX_INTRO_WORDS = 60;
  const introKey = Object.keys(processedSections).find(k => k === 'introduction');
  if (introKey && typeof processedSections[introKey] === 'string') {
    const introText = processedSections[introKey] as string;
    const words = introText.split(/\s+/).filter(w => w.length > 0);
    if (words.length > MAX_INTRO_WORDS) {
      // Truncate at sentence boundary to avoid cutting mid-sentence
      const truncated = words.slice(0, MAX_INTRO_WORDS).join(' ');
      // Find the last sentence-ending character (Arabic + English)
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('۔'),
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('؟'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('،'),  // V159: Arabic comma as fallback boundary
      );
      // V159: Lowered threshold from 0.7 to 0.5 — Arabic text has shorter sentences
      const finalIntro = lastSentenceEnd > truncated.length * 0.5
        ? truncated.slice(0, lastSentenceEnd + 1).trim()
        : truncated.trim();
      processedSections[introKey] = finalIntro;
      console.warn(`[ReportGenerator V159] Introduction truncated: ${words.length} → ${finalIntro.split(/\s+/).length} words (max ${MAX_INTRO_WORDS})`);
    }
  }

  // Build full content JSON
  const contentData: Record<string, unknown> = {
    type,
    generatedAt: now.toISOString(),
    confidenceScore,
    marketImpact,
    dataQuality: {
      newsCount: news.items.length,
      indicatorsCount: indicators.all.length,
      calendarEventsCount: calendarEvents.length,
      aiGenerated: aiSucceeded,
    },
    // V70: Use processedSections with disclaimer
    sections: processedSections,
    metadata: {
      categoryBreakdown: news.categoryBreakdown,
      sentimentBreakdown: news.sentimentBreakdown,
      avgSentimentScore: news.avgSentimentScore,
    },
  };

  // Extract countries from news and indicators
  const countries = new Set<string>();
  for (const item of news.items) {
    try {
      const assets = JSON.parse(item.affectedAssets || '[]');
      for (const a of assets) {
        if (a.country) countries.add(a.country);
      }
    } catch { /* ignore */ }
  }
  countries.add('SA');
  countries.add('AE');
  countries.add('US');

  // Extract sectors from category breakdown
  const sectors = Object.keys(news.categoryBreakdown);

  // Key indicators summary
  const keyIndicatorsData: Record<string, unknown> = {
    avgSentiment: news.avgSentimentScore,
    totalNews: news.items.length,
    indicators: indicators.all.slice(0, 10).map(i => ({
      name: i.nameAr || i.name,
      value: i.value,
      change: i.changePercent,
    })),
  };

  // Build source URLs from news
  const sourceUrls = news.items.slice(0, 10).map(n => n.id);

  // V363 FIX: Generic summary should penalize confidence but NOT block publication entirely.
  // OLD V242 logic: isPublished = false whenever summaryIsGeneric=true, even if confidence=70.
  // This was causing ALL daily/weekly/monthly reports to be unpublished since May 17!
  // The AI often produces good content but a generic introduction/summary.
  // NEW LOGIC: Cap confidence at 40 for generic summaries (instead of 35), but still
  // allow publication if the capped confidence exceeds the template threshold.
  // This means: daily/weekly (threshold=30) → published at 40. monthly (threshold=35) → published at 40.
  // Only truly bad reports (confidence < 25) are blocked.
  if (summaryIsGeneric) {
    confidenceScore = Math.min(confidenceScore, 40);  // V363: Was 35, now 40 — allows publication for most report types
    console.warn(`[ReportGenerator V363] ⚠️ Generic summary detected — capping confidence at 40 (was higher). Report will still be published if confidence >= template threshold.`);
  }

  // V242→V363: Absolute minimum confidence for publication — 25.
  // Anything below this threshold is not publishable regardless of other factors.
  const V242_MIN_PUBLISH_CONFIDENCE = 25;

  // V363 FIX: Removed `&& !summaryIsGeneric` from isPublished check.
  // The old logic blocked ALL reports with generic summaries from being published,
  // even when the actual content was good (confidence=70). This caused a complete
  // halt of daily/weekly/monthly Arabic report production since May 17.
  // The confidence cap above (40 max for generic) already penalizes quality.
  const meetsPublishThreshold = confidenceScore >= Math.max(template.minConfidenceScore, V242_MIN_PUBLISH_CONFIDENCE);

  const report: GeneratedReport = {
    title,
    slug,
    summary,
    content: JSON.stringify(contentData),
    reportType: type,
    scope: context?.scope || 'global',
    sectors: JSON.stringify(sectors),
    countries: JSON.stringify([...countries]),
    keyIndicators: JSON.stringify(keyIndicatorsData),
    marketImpact,
    confidenceScore,
    sourceUrls: JSON.stringify(sourceUrls),
    locale: 'ar',  // Arabic report generator always produces Arabic content
    // V363: Publish if confidence meets threshold. Generic summary only penalizes confidence,
    // it no longer blocks publication entirely.
    isPublished: meetsPublishThreshold,
    publishedAt: meetsPublishThreshold ? now : new Date(0),
  };

  return report;
}

// ─── Generate Daily Market Brief ────────────────────────────

export async function generateDailyBrief(
  newsItems?: any[],
  indicators?: any[],
  wordCount?: number
): Promise<GeneratedReport> {
  return generateReport('daily', { wordCount: wordCount || 1200 }); // V162: Increased from 500 to 1200
}

// ─── Generate Weekly Deep Analysis ──────────────────────────

export async function generateWeeklyAnalysis(
  newsItems?: any[],
  indicators?: any[],
  analyses?: any[],
  wordCount?: number
): Promise<GeneratedReport> {
  return generateReport('weekly', { wordCount: wordCount || 1500 }); // V162: Increased from 500 to 1500
}

// ─── Generate Monthly Economic Outlook ──────────────────────

export async function generateMonthlyOutlook(
  newsItems?: any[],
  indicators?: any[],
  analyses?: any[],
  wordCount?: number
): Promise<GeneratedReport> {
  return generateReport('monthly', { wordCount: wordCount || 2000 }); // V162: Increased from 500 to 2000
}

// ─── Generate Special Event Report ──────────────────────────

export async function generateSpecialReport(
  event: string,
  newsItems?: any[],
  indicators?: any[]
): Promise<GeneratedReport> {
  return generateReport('special', { event });
}

// ─── Currency Pairs for Technical Analysis Rotation ─────────
// Rotates through major, minor, and exotic pairs each hour.
const CURRENCY_PAIRS = [
  { symbol: 'EUR/USD', nameAr: 'اليورو/الدولار', type: 'major' },
  { symbol: 'GBP/USD', nameAr: 'الجنيه الإسترليني/الدولار', type: 'major' },
  { symbol: 'USD/JPY', nameAr: 'الدولار/الين الياباني', type: 'major' },
  { symbol: 'USD/CHF', nameAr: 'الدولار/الفرنك السويسري', type: 'major' },
  { symbol: 'AUD/USD', nameAr: 'الدولار الأسترالي/الدولار', type: 'major' },
  { symbol: 'USD/CAD', nameAr: 'الدولار/الدولار الكندي', type: 'major' },
  { symbol: 'NZD/USD', nameAr: 'الدولار النيوزيلندي/الدولار', type: 'major' },
  { symbol: 'EUR/GBP', nameAr: 'اليورو/الجنيه الإسترليني', type: 'minor' },
  { symbol: 'EUR/JPY', nameAr: 'اليورو/الين الياباني', type: 'minor' },
  { symbol: 'GBP/JPY', nameAr: 'الجنيه الإسترليني/الين الياباني', type: 'minor' },
  { symbol: 'XAU/USD', nameAr: 'الذهب/الدولار', type: 'commodity' },
  { symbol: 'XAG/USD', nameAr: 'الفضة/الدولار', type: 'commodity' },
  { symbol: 'BTC/USD', nameAr: 'البيتكوين/الدولار', type: 'crypto' },
  { symbol: 'ETH/USD', nameAr: 'الإيثريوم/الدولار', type: 'crypto' },
  { symbol: 'USOIL', nameAr: 'النفط الخام الأمريكي', type: 'commodity' },
] as const;

/**
 * Get the currency pair for the current hour (rotates through the list).
 * Each hour picks a different pair so all pairs get analyzed over time.
 */
export function getCurrentPair(): typeof CURRENCY_PAIRS[number] {
  const hourIndex = Math.floor(Date.now() / (60 * 60 * 1000)) % CURRENCY_PAIRS.length;
  return CURRENCY_PAIRS[hourIndex];
}

// ─── Generate Technical Analysis for a Currency Pair ────────
// Generates a detailed technical analysis for a specific pair,
// rotating through the CURRENCY_PAIRS list each hour.
// Uses the market analysis infrastructure with the technicalAnalysis
// asset class and a custom prompt specifying the pair.

export async function generateTechnicalAnalysis(
  specificPair?: string
): Promise<GeneratedAnalysis> {
  const pair = specificPair
    ? CURRENCY_PAIRS.find(p => p.symbol === specificPair) || CURRENCY_PAIRS[0]
    : getCurrentPair();

  console.log(`[ReportGenerator] Generating technical analysis for ${pair.symbol} (${pair.nameAr})...`);

  // Use generateMarketAnalysis with technicalAnalysis asset class and custom prompt
  return generateMarketAnalysis(
    'technicalAnalysis',
    undefined,
    undefined,
    `اكتب تحليلاً فنياً شاملاً ومعمقاً لزوج ${pair.nameAr} (${pair.symbol}). يجب أن يتضمن التحليل:
1. تحليل الاتجاه على الإطار اليومي والأسبوعي
2. مستويات الدعم والمقاومة الرئيسية مع أرقام محددة
3. المؤشرات الفنية: RSI, MACD, المتوسطات المتحركة (SMA 20, 50, 200), بولينجر
4. أنماط شموع وأنماط سعرية محددة
5. 3 سيناريوهات تداول: صاعد، عرضي، هابط — مع نقاط دخول وخروج ووقف خسارة
6. إدارة المخاطر: حجم المركز ونسبة المخاطرة/العائد
7. توصيات عملية واضحة مع مستويات سعرية محددة`,
    `تحليل فني: ${pair.nameAr} (${pair.symbol})`
  );
}

// ─── Generate Market Analysis for a Specific Asset Class ────

export async function generateMarketAnalysis(
  assetClass: AssetClass,
  newsItems?: any[],
  indicators?: any[],
  prompt?: string,       // V68: Custom prompt
  customTitle?: string,  // V68: Custom title
  forceFull?: boolean,   // V163: Force full mode for manual generation
): Promise<GeneratedAnalysis> {
  const now = new Date();

  // V223: Block disabled asset classes — chronic quality issues due to
  // insufficient specialized data sources (hallucination-prone categories)
  if (V223_DISABLED_ASSET_CLASSES.includes(assetClass)) {
    console.warn(`[ReportGenerator V223] 🚫 Asset class "${assetClass}" is DISABLED — insufficient data sources lead to chronic quality issues. Returning skip analysis.`);
    const assetLabel = ASSET_CLASS_LABELS[assetClass]?.nameAr || assetClass;
    const timeSuffix = '-' + now.getTime().toString(36);
    const slug = generateSlug(`${assetClass}-analysis-${now.toISOString().split('T')[0]}${timeSuffix}-disabled`);
    return {
      title: `${assetLabel} — هذا التصنيف معلق مؤقتاً`,
      slug,
      assetClass,
      analysisType: 'fundamental',
      timeFrame: 'daily',
      content: JSON.stringify({
        assetClass,
        generatedAt: now.toISOString(),
        disabled: true,
        disabledReason: 'insufficient_specialized_data',
        sections: { overview: 'هذا التصنيف معلق مؤقتاً بسبب عدم توفر مصادر بيانات متخصصة كافية. سيتم إعادة تفعيله عند توفر بيانات أفضل.' },
      }),
      indicators: '{}',
      priceTarget: '{}',
      riskLevel: 'extreme',
      sentiment: 'neutral',
      confidenceScore: 5,
      relatedNewsIds: '[]',
      isPublished: false,
      publishedAt: new Date(0),
      validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      locale: 'ar',
    };
  }

  // V162: Extend time range to 72h when custom prompt is provided (was 24h)
  // V163: Always use 72h for manual generation (forceFull) — broader data collection
  const sinceHours = (prompt || forceFull) ? 72 : 24;
  const since = new Date(now.getTime() - sinceHours * 60 * 60 * 1000);

  // Collect data filtered for the asset class
  let news: CollectedNews;
  let allIndicators: CollectedIndicators;

  try {
    // Map asset class to indicator categories
    const categoryMap: Record<AssetClass, string[]> = {
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

    news = await collectNews(since);
    allIndicators = await collectIndicators();

    // Filter indicators by asset class
    const relevantCategories = categoryMap[assetClass] || [];
    const filteredIndicators = {
      ...allIndicators,
      all: allIndicators.all.filter(i => relevantCategories.includes(i.category)),
      global: allIndicators.global.filter(i => relevantCategories.includes(i.category)),
      arabic: allIndicators.arabic.filter(i => relevantCategories.includes(i.category)),
    };

    // V162: When a custom prompt is provided, use broader keyword-based news matching
    // to find ALL related news on the user's requested topic, not just category-filtered ones.
    // This ensures comprehensive reports when users request specific topics.

    // V164: Tightened news categories — removed broad 'اقتصاد كلي' from
    // specialized asset classes to prevent off-topic content (Cuba crisis,
    // Trump fund, AI stories leaking into bonds reports, etc.)
    const newsCategoryMap: Record<AssetClass, string[]> = {
      strategic: ['اقتصاد كلي', 'أسهم', 'طاقة', 'فوركس', 'كريبتو', 'سلع', 'بنوك'],
      stocks: ['أسهم', 'بورصة', 'مؤشرات أسهم', 'تقنية'],
      commodities: ['سلع', 'طاقة', 'نفط', 'ذهب', 'فضة', 'نحاس'],
      forex: ['فوركس', 'عملات', 'أسعار صرف', 'دولار', 'يورو'],
      crypto: ['كريبتو', 'عملات رقمية', 'بتكوين', 'تشفير', 'إيثريوم'],
      bonds: ['سندات', 'فائدة', 'عوائد', 'خزانة', 'سندات خزانة', 'منحنى العائد', 'فروقات ائتمان'],
      energy: ['طاقة', 'نفط', 'غاز', 'أوبك', 'بترول'],
      realEstate: ['عقارات', 'إسكان', 'تطوير عقاري', 'REITs'],
      economy: ['اقتصاد كلي', 'ناتج محلي', 'تضخم', 'بطالة', 'تجارة'],
      banking: ['بنوك', 'فائدة', 'قروض', 'إسلامي', 'مصارف'],
      technicalAnalysis: ['فوركس', 'عملات', 'كريبتو', 'عملات رقمية', 'أسهم', 'ذهب', 'نفط'],
      arabMarkets: ['أسواق عربية', 'تداول', 'دبي', 'أبوظبي', 'السعودية', 'مصر', 'الكويت'],
      earnings: ['أرباح', 'أسهم', 'شركات', 'تقنية', 'تقارير أرباح', 'أرباح الشركات', 'نتائج ربعية', 'نتائج سنوية', 'إيرادات', 'أرباح وتوزيعات', 'نتائج مالية', 'ميزانيات', 'إعلانات شبكات'],
    };
    const relevantNewsCategories = newsCategoryMap[assetClass] || [];

    // V162: Category-based filtering
    const categoryFilteredNews = relevantNewsCategories.length > 0
      ? news.items.filter(n =>
          relevantNewsCategories.some(cat => {
            const newsCat = n.category.toLowerCase().trim();
            const catLower = cat.toLowerCase();
            return newsCat === catLower || newsCat.startsWith(catLower + '/') || newsCat.startsWith(catLower + ' ');
          })
        )
      : news.items;

    // V162: When custom prompt is provided, also find news by keyword matching
    // Extract meaningful keywords from the prompt (3+ char Arabic/Latin words)
    let keywordFilteredNews: any[] = [];
    if (prompt) {
      const promptKeywords = prompt
        .replace(/[*#\[\](){}|]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3)
        .filter(w => !['عن', 'على', 'في', 'من', 'إلى', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'واكتب', 'تقرير', 'تحليل', 'مفصل', 'شامل'].includes(w));

      if (promptKeywords.length > 0) {
        keywordFilteredNews = news.items.filter(n => {
          const newsText = `${n.title || ''} ${n.titleAr || ''} ${n.summary || ''} ${n.summaryAr || ''} ${n.category || ''}`.toLowerCase();
          // V164: Tighter keyword matching — require at least 2 keyword matches
          // and 20%+ of prompt keywords must match (was 1 match at 10%)
          const matchCount = promptKeywords.filter(kw => newsText.includes(kw.toLowerCase())).length;
          return matchCount >= 2 && (matchCount / promptKeywords.length) >= 0.2;
        });
        // V164: Also filter keyword-matched news by asset class category
        // to prevent off-topic news from entering specialized reports
        keywordFilteredNews = keywordFilteredNews.filter(n => {
          const newsCat = (n.category || '').toLowerCase().trim();
          const matchesAssetClass = relevantNewsCategories.some(cat => {
            const catLower = cat.toLowerCase();
            return newsCat === catLower || newsCat.startsWith(catLower + '/') || newsCat.startsWith(catLower + ' ');
          });
          // Keep news if it matches the asset class category OR has no specific category
          return matchesAssetClass || !newsCat;
        });
        console.log(`[ReportGenerator V164] Keyword matching found ${keywordFilteredNews.length} news items for ${assetClass} (keywords: ${promptKeywords.slice(0, 10).join(', ')}...)`);
      }
    }

    // V162: Merge category-filtered and keyword-filtered news, deduplicate by ID
    const mergedNewsMap = new Map<string, any>();
    // Add category-filtered news first
    for (const item of categoryFilteredNews) {
      mergedNewsMap.set(item.id, item);
    }
    // V164: Keyword-filtered news already filtered by asset class category above
    // Only add items that haven't been added yet
    for (const item of keywordFilteredNews) {
      if (!mergedNewsMap.has(item.id)) {
        mergedNewsMap.set(item.id, item);
      }
    }

    const filteredNews = {
      ...news,
      items: [...mergedNewsMap.values()],
    };

    console.log(`[ReportGenerator V162] News for ${assetClass}: ${categoryFilteredNews.length} category-matched + ${keywordFilteredNews.length} keyword-matched = ${filteredNews.items.length} total`);

    // V164: Search the web for current market prices BEFORE AI generation.
    // This gives the AI real-time price data (gold, oil, yields, etc.)
    // preventing hallucinated or stale prices (e.g., gold at $2,320 vs actual $4,700+).
    console.log(`[ReportGenerator V164] Searching web for ${assetClass} current prices...`);
    const webSearchData = await searchWebForAssetClassPrices(assetClass);

    // V223: Fetch live prices from financial APIs for price-dependent categories
    // This supplements web search with structured, real-time price data
    const livePriceData = await fetchLivePricesForPrompt(assetClass);

    // Build the prompt
    const systemPromptBase = ANALYSIS_SYSTEM_PROMPT[assetClass];

    // V164: ALWAYS use filtered news — never send ALL unfiltered news to the AI.
    // The old V162 logic (prompt ? news : filteredNews) allowed off-topic news
    // (Cuba crisis, Trump fund, AI) to leak into specialized reports like bonds.
    // Now keyword-matched news is already filtered by asset class category above,
    // so filteredNews contains both category-matched AND relevant keyword-matched news.
    const newsForPrompt = filteredNews;

    let userPrompt = buildUserDataPrompt({
      news: newsForPrompt,
      indicators: filteredIndicators,
      calendarEvents: await collectCalendarEvents(since, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      reportType: 'daily', // Analysis uses daily context
    });

    // V164: Append web search results (current prices) to the prompt
    if (webSearchData) {
      userPrompt += webSearchData;
    }

    // V223: Append live prices from financial APIs
    if (livePriceData) {
      userPrompt += livePriceData;
    }

    // V320: For earnings reports, fetch and inject real financial data
    // This ensures the AI uses actual EPS, Revenue, and Beat/Miss data
    if (assetClass === 'earnings') {
      try {
        const { getEarningsFinancialData, formatEarningsDataForPrompt } = await import('@/lib/financial-apis');
        // Extract stock symbols from news titles to fetch relevant data
        const symbolMatches = filteredNews.items.flatMap(n => {
          const text = `${n.title || ''} ${n.titleAr || ''} ${n.summary || ''} ${n.summaryAr || ''}`;
          const matches = text.match(/\b[A-Z]{2,5}\b/g) || [];
          return matches.filter(s => !['THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'WAS', 'HAS', 'HIS', 'HER', 'ALL', 'NEW', 'OLD', 'OUR', 'OUT', 'ITS', 'WHO', 'HOW', 'WHY', 'CAN', 'CEO', 'CFO', 'CTO', 'GDP', 'EPS', 'USA', 'UAE', 'USD', 'ETF', 'IPO', 'SEC'].includes(s));
        });
        const uniqueSymbols = [...new Set(symbolMatches)].slice(0, 5);

        // Fetch financial data for each symbol found
        for (const symbol of uniqueSymbols) {
          const earningsData = await getEarningsFinancialData(symbol);
          if (earningsData) {
            const dataBlock = formatEarningsDataForPrompt(earningsData);
            userPrompt += dataBlock;
            console.log(`[ReportGenerator V320] Injected earnings data for ${symbol}: Price=$${earningsData.currentPrice}, EPS=${earningsData.reportedEPS}, Rev=${earningsData.latestRevenue}`);
          }
        }
      } catch (err: any) {
        console.warn(`[ReportGenerator V320] Failed to fetch earnings financial data:`, err?.message?.slice(0, 100));
      }
    }

    // V68: If custom prompt is provided, prepend it with strong emphasis
    // V162: Enhanced custom prompt instruction to ensure comprehensive output
    if (prompt) {
      userPrompt = `*** موضوع التحليل المطلوب: ${prompt} ***

*** تعليمات إلزامية للموضوع المطلوب:
- هذا التقرير مطلوب خصيصاً عن الموضوع أعلاه — لا تتجاهله وتكتب عن موضوع آخر
- اجمع كل الأخبار المرتبطة بهذا الموضوع من البيانات المقدمة
- اربط بين الأخبار المترابطة التي تتحدث عن ذات الموضوع
- وسّع التحليل واعمقه — لا تختصر — المستخدم طلب تقريراً مفصلاً
- كل قسم يجب أن يكون عدة فقرات طويلة ومفصلة
- لا تقل «لا تتوفر بيانات» — استخدم كل البيانات المتاحة وأضف تحليلك
- التقرير يجب أن يكون شاملاً ومعمقاً وليس ملخصاً موجزاً
***

${userPrompt}`;
    }

    // ── V81: Data Sufficiency Gate ──────────────────────────
    const relevantNewsCount = filteredNews.items.length;
    // V163: Pass forceFull to always generate full AI reports for manual requests
    let dataSufficiency = assessDataSufficiency(
      news.items.length,
      filteredIndicators.all.length,
      relevantNewsCount,
      assetClass,  // V84: Pass assetClass for economy-specific stricter gate
      forceFull,   // V163: Force full mode for manual generation
    );

    // V162: When a custom prompt is provided, ALWAYS force 'full' mode.
    // The user explicitly requested a report on a specific topic — we must generate
    // a comprehensive report, not a brief bulletin. Use ALL available news as context.
    if (prompt && dataSufficiency !== 'full') {
      console.log(`[ReportGenerator V162] Custom prompt provided — overriding dataSufficiency from '${dataSufficiency}' to 'full' (user requested comprehensive report on: "${prompt.slice(0, 80)}...")`);
      dataSufficiency = 'full';
    }

    console.log(`[ReportGenerator V81] ${assetClass} data sufficiency: ${dataSufficiency} (relevant: ${relevantNewsCount} news, ${filteredIndicators.all.length} indicators)`);

    // V223: Determine report mode — contextual (3+ related news) vs data (fewer news)
    // This changes the AI's approach: narrative analysis vs indicator-driven briefing
    const isContextualReport = relevantNewsCount >= 3 && filteredNews.items.length >= 3;
    const reportMode = isContextualReport ? 'contextual' : 'data';
    const modeSupplement = isContextualReport
      ? V223_CONTEXTUAL_REPORT_SUPPLEMENT
      : V223_DATA_REPORT_SUPPLEMENT;
    const systemPrompt = systemPromptBase + modeSupplement;
    console.log(`[ReportGenerator V223] ${assetClass} report mode: ${reportMode} (${relevantNewsCount} relevant news)`);

    // If data is completely insufficient, return a minimal skip analysis
    // V162: But NOT when a custom prompt is provided (handled above)
    if (dataSufficiency === 'skip') {
      console.log(`[ReportGenerator V81] Skipping ${assetClass} analysis — insufficient data (${relevantNewsCount} relevant news)`);

      const assetLabel = ASSET_CLASS_LABELS[assetClass].nameAr;
      const timeSuffix = '-' + now.getTime().toString(36);
      const slug = generateSlug(`${assetClass}-analysis-${now.toISOString().split('T')[0]}${timeSuffix}-skip`);

      return {
        title: `${assetLabel} — لا تتوفر بيانات كافية حالياً`,
        slug,
        assetClass,
        analysisType: 'fundamental',
        timeFrame: 'daily',
        content: JSON.stringify({
          assetClass,
          generatedAt: now.toISOString(),
          skipped: true,
          skipReason: 'insufficient_data',
          relevantNewsCount,
          indicatorsCount: filteredIndicators.all.length,
          sections: { overview: 'لا تتوفر بيانات كافية لإنشاء تحليل مفصل حالياً. سيتم إنشاء التحليل عند توفر بيانات إضافية.' },
        }),
        indicators: '[]',
        priceTarget: '{}',
        riskLevel: 'extreme',
        sentiment: 'neutral',
        confidenceScore: 5,
        relatedNewsIds: '[]',
        isPublished: false,
        publishedAt: new Date(0),
        validUntil: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        locale: 'ar',
      };
    }

    // If data is thin, generate a brief factual bulletin instead of full AI analysis
    if (dataSufficiency === 'brief') {
      console.log(`[ReportGenerator V81] Generating brief bulletin for ${assetClass} — limited data (${relevantNewsCount} relevant news)`);

      const briefContent = await buildBriefBulletin(assetClass, filteredNews.items, filteredIndicators.all, news.items);
      const assetLabel = ASSET_CLASS_LABELS[assetClass].nameAr;
      const headlines = filteredNews.items.map(n => n.titleAr || n.title);
      let title: string;
      if (customTitle) {
        title = customTitle;
      } else {
        title = await generateDescriptiveTitle(headlines, assetLabel, assetClass);
      }
      const timeSuffix = '-' + now.getTime().toString(36);
      const slug = generateSlug(`${assetClass}-analysis-${now.toISOString().split('T')[0]}${timeSuffix}-brief`);

      const confidenceScore = calculateConfidenceScore({
        newsCount: filteredNews.items.length,
        indicatorsCount: filteredIndicators.all.length,
        aiSucceeded: false,
        hasCalendarData: true,
        hasAnalyses: false,
        hasPreviousReports: false,
      });

      return {
        title,
        slug,
        assetClass,
        analysisType: assetClass === 'technicalAnalysis' ? 'technical' : 'fundamental',
        timeFrame: 'daily',
        content: JSON.stringify({
          assetClass,
          generatedAt: now.toISOString(),
          isBrief: true,
          confidenceScore,
          sections: { overview: briefContent },
          newsCount: filteredNews.items.length,
          indicatorsCount: filteredIndicators.all.length,
          news: filteredNews.items.slice(0, 5).map(n => ({
            title: n.titleAr || n.title,
            sentiment: n.sentiment || 'neutral',
            category: n.category,
          })),
          dataQuality: { newsCount: filteredNews.items.length, indicatorsCount: filteredIndicators.all.length, aiGenerated: false },
        }),
        indicators: JSON.stringify(filteredIndicators.all.slice(0, 5).map(i => ({ name: i.nameAr || i.name, value: i.value, change: i.changePercent }))),
        priceTarget: '{}',
        riskLevel: confidenceScore >= 50 ? 'medium' : 'high',
        sentiment: determineMarketImpact(filteredNews.avgSentimentScore),
        confidenceScore: Math.max(15, confidenceScore),
        relatedNewsIds: JSON.stringify(filteredNews.items.slice(0, 5).map(n => n.id)),
        isPublished: confidenceScore >= 30,  // V240: Lowered from 40 — empty market_indicators penalizes confidence
        publishedAt: confidenceScore >= 30 ? now : new Date(0),
        validUntil: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        locale: 'ar',
      };
    }

    // ── Full AI generation (dataSufficiency === 'full') ──
    // V82→V84: Stronger anti-hallucination — no forced sections, no minimum word count
    // V162: But when custom prompt is provided, emphasize comprehensive output
    const nowDateStr = now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    // V162: Different enhanced prompts depending on whether custom prompt was provided
    const enhancedUserPrompt = prompt
      ? `${userPrompt}

*** تعليمات إلزامية (V162 — تقرير مخصص):
- التاريخ اليوم: ${nowDateStr} — استخدم هذا التاريخ فقط في التقرير
- اكتب عن الموضوع المطلوب تحديداً — لا تتجاهله وتكتب عن موضوع آخر
- اجمع كل الأخبار المرتبطة بالموضوع المطلوب من البيانات المقدمة واربط بينها
- وسّع التحليل واعمقه — كل قسم يجب أن يكون عدة فقرات طويلة ومفصلة
- التقرير يجب أن يكون شاملاً ومعمقاً — لا تختصر أو توجز
- كل رقم تذكره يجب أن يأتي من البيانات المقدمة — لا تخترع أرقاماً
- الأسعار والمستويات السعرية: استخدم فقط الأرقام من قسم المؤشرات أعلاه
- لا تخترع أسماء خبراء أو أحداثاً ثانوية من خيالك
- لا تُكرر نفس الجدول أو نفس الجملة في أقسام مختلفة
- اكتب بالعربية الفصحى فقط — لا JSON — لا كلمات إنجليزية أو إسبانية
- إذا لا توجد بيانات كافية لقسم معين: اكتب ما تستطيع من البيانات المتاحة بدلاً من حذف القسم
- المقدمة والملخص التنفيذي يجب أن يكونا مختلفين
- التوصيات يجب أن تكون مرتبطة بالحدث المذكور
- كل جملة إنجليزية في النص يجب أن تُترجم للعربية أو تُحذف
***`
      : `${userPrompt}

*** تعليمات إلزامية — تقرير شامل ومفصل:
- التاريخ اليوم: ${nowDateStr} — استخدم هذا التاريخ فقط في التقرير، لا تستخدم أي سنة أخرى
- اكتب فقط عن الأحداث المذكورة صراحةً في البيانات أعلاه
- كل رقم تذكره يجب أن يأتي من البيانات المقدمة — لا تخترع أرقاماً
- الأسعار والمستويات السعرية: استخدم فقط الأرقام من قسم المؤشرات أعلاه — لا تخترع أسعاراً أو مستويات فنية من خيالك
- ⚠️ وسّع التحليل في كل قسم — لا تحذف أي قسم بل وسّعه بتحليل أعمق للبيانات المتاحة
- ⚠️ كل قسم يجب أن يكون عدة فقرات طويلة ومفصلة (3-5 فقرات على الأقل لكل قسم)
- ⚠️ التقرير الشامل المبني على بيانات حقيقية أفضل من التقرير المختصر الفقير
- ⚠️ لا تختصر — إذا وُجدت بيانات فوسّع التحليل فيها
- لا تخترع أسماء خبراء أو أحداثاً ثانوية أو بيانات بطالة أو تضخم من خيالك
- إذا لم يُذكر خبير حقيقي: اكتب "لم تُنشر آراء خبراء حول هذا الموضوع بعد." — ممنوع اختراع أسماء خبراء
- لا تُكرر نفس الجدول لحدثين مختلفين
- لا تضيف نفس القيمة على كل المؤشرات
- اكتب بالعربية الفصحى فقط — لا JSON — لا كلمات إنجليزية أو إسبانية
- ممنوع تكرار نفس الجملة في أقسام مختلفة — كل قسم يجب أن يحتوي على معلومات فريدة مختلفة تماماً
- ممنوع كتابة جمل عامة مثل "يعد هذا العامل من أبرز المحركات المؤثرة على السوق" — هذه حشو فارغ
- المقدمة والملخص التنفيذي يجب أن يكونا مختلفين: المقدمة = سياق الحدث (3-4 جمل)، الملخص = نقاط كمية محددة (5-7 نقاط)
- التوصيات يجب أن تكون مرتبطة بالحدث المذكور في البيانات — لا توصيات عامة مثل "تنويع المحفظة"
- ركز على الحدث الرئيسي المذكور في البيانات — لا تتجاهله وتكتب عن موضوع آخر
- اربط بين الأخبار المترابطة — لا تكتب كل خبر بمعزل عن الآخر
- كل جملة إنجليزية في النص يجب أن تُترجم للعربية أو تُحذف
***`;

    // ── V165: Use MULTI-PASS generation instead of single-pass ──
    // This is the KEY fix for the "short reports" problem.
    // Previously: one AI call for the entire report → shallow/short content.
    // Now: each section gets its own AI call → deep/focused/comprehensive content.
    let aiContent: Record<string, string> | null = null;
    let rawAiContent = '';
    let aiSucceeded = false;

    console.log(`[ReportGenerator V165] Using MULTI-PASS generation for ${assetClass} analysis...`);

    try {
      const multiPassResult = await generateAnalysisMultiPass(
        assetClass,
        userPrompt,
        systemPrompt,
        prompt,
        webSearchData,   // V164: Pass web search data for current prices
      );

      aiContent = multiPassResult.aiContent;
      rawAiContent = multiPassResult.rawContent;
      aiSucceeded = multiPassResult.aiSucceeded;

      if (aiSucceeded && Object.keys(aiContent).length > 0) {
        console.log(`[ReportGenerator V165] Multi-pass analysis succeeded for ${assetClass}: ${Object.keys(aiContent).length} sections`);
      } else {
        console.warn(`[ReportGenerator V165] Multi-pass analysis produced insufficient content for ${assetClass} — falling back to single-pass`);
        // Fallback: try single-pass generation
        try {
          const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedUserPrompt },
          ];
          const maxTokensForAnalysis = prompt ? 16000 : 12000;
          const result = await chatCompletion(messages, {
            temperature: 0.4,
            maxTokens: maxTokensForAnalysis,
            priority: 'generation',
          });
          rawAiContent = result.content;
          const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
          if (markdownSections && Object.keys(markdownSections).length > 1) {
            aiContent = markdownSections;
            aiSucceeded = true;
          } else {
            aiContent = parseAIJsonResponse(rawAiContent);
            aiSucceeded = !!aiContent && Object.keys(aiContent).length > 1;
          }
          console.log(`[ReportGenerator V165] Single-pass fallback ${aiSucceeded ? 'succeeded' : 'failed'} for ${assetClass}`);
        } catch (fallbackError: any) {
          console.error(`[ReportGenerator V165] Single-pass fallback also failed for ${assetClass}:`, fallbackError.message);
        }
      }
    } catch (error: any) {
      console.error(`[ReportGenerator V165] Multi-pass analysis failed for ${assetClass}:`, error.message);
      aiSucceeded = false;
    }

    // V83→V84: Fix common AI translation errors in generated content
    if (rawAiContent) {
      rawAiContent = rawAiContent.replace(/الدينار\s+الأمريكي/g, 'الدولار الأمريكي');
      rawAiContent = rawAiContent.replace(/انخفضت قيمة الدينار الأمريكي/g, 'انخفضت قيمة الدولار الأمريكي');
      rawAiContent = rawAiContent.replace(/الإيورو/g, 'اليورو');
      rawAiContent = rawAiContent.replace(/بعد\s+تعلن/g, 'بعد أن أعلن');
      rawAiContent = rawAiContent.replace(/الجنيه\s+البريطاني/g, 'الجنيه الإسترليني');
      // V84: Fix "الهشامات" catastrophic mistranslation (chips → رقائق إلكترونية)
      rawAiContent = rawAiContent.replace(/الهشامات/g, 'الرقائق الإلكترونية');
      rawAiContent = rawAiContent.replace(/هشامات/g, 'رقائق إلكترونية');
      // V84: Fix Spanish words leaking into Arabic text
      rawAiContent = rawAiContent.replace(/sesión/gi, 'جلسة');
      rawAiContent = rawAiContent.replace(/sesiones/gi, 'جلسات');
      // V84: Strip English-only sentences from Arabic text
      rawAiContent = stripEnglishFromArabicReport(rawAiContent);
      // V85: Fix "ضوء اليوم" — literal mistranslation of "Highlight"
      rawAiContent = rawAiContent.replace(/ضوء اليوم/g, 'أبرز الأحداث');
      rawAiContent = rawAiContent.replace(/أضواء اليوم/g, 'أبرز الأحداث');
      // V85: Fix English phrases leaking into Arabic text
      rawAiContent = rawAiContent.replace(/indicating overbought conditions/gi, 'مُشيراً إلى ظروف شرائية مفرطة');
      rawAiContent = rawAiContent.replace(/indicating oversold conditions/gi, 'مُشيراً إلى ظروف بيعية مفرطة');
      rawAiContent = rawAiContent.replace(/overbought conditions/gi, 'ظروف شرائية مفرطة');
      rawAiContent = rawAiContent.replace(/oversold conditions/gi, 'ظروف بيعية مفرطة');
      // V85: Remove (neutral)/(positive)/(negative) English sentiment labels in Arabic text
      rawAiContent = rawAiContent.replace(/\s*\(neutral\)/g, ' (محايد)');
      rawAiContent = rawAiContent.replace(/\s*\(positive\)/g, ' (إيجابي)');
      rawAiContent = rawAiContent.replace(/\s*\(negative\)/g, ' (سلبي)');
      rawAiContent = rawAiContent.replace(/\s*\(bullish\)/g, ' (صعودي)');
      rawAiContent = rawAiContent.replace(/\s*\(bearish\)/g, ' (هبوطي)');
      // V86: Fix "الماصة" — catastrophic mistranslation of "synthetic" (NOT absorbent!)
      rawAiContent = rawAiContent.replace(/الماصة/g, 'الاصطناعية');
      rawAiContent = rawAiContent.replace(/التokens/g, 'التوكنات');
      rawAiContent = rawAiContent.replace(/تokens/g, 'توكنات');
      rawAiContent = rawAiContent.replace(/التوكنات الماصة/g, 'التوكنات الاصطناعية');
      rawAiContent = rawAiContent.replace(/رموز الماصة/g, 'الرموز الاصطناعية');

      // V137: Strip AI internal comment leaks
      rawAiContent = stripAICommentLeaks(rawAiContent);

      // V161: Remove banned filler phrases that AI sometimes generates despite rules
      const bannedFillerPatterns = [
        /يعد هذا العامل من أبرز المحركات المؤثرة على السوق حالياً[،.]?/g,
        /يؤثر بشكل مباشر على قرارات المستثمرين وتحركات رؤوس الأموال[،.]?/g,
        /من أبرز العوامل المؤثرة على السوق في الوقت الراهن[،.]?/g,
        /يُعد من أهم العوامل التي تؤثر على توجهات السوق[،.]?/g,
      ];
      for (const pattern of bannedFillerPatterns) {
        rawAiContent = rawAiContent.replace(pattern, '');
      }

      // V152: Strip foreign script characters (Chinese, Cyrillic, Korean, etc.)
      rawAiContent = stripForeignScripts(rawAiContent);

      // V137: Validate exchange rate sanity for economy reports
      if (assetClass === 'economy' || assetClass === 'forex') {
        rawAiContent = validateExchangeRates(rawAiContent);
      }
    }

    // ── V81: Anti-Hallucination Validation ─────────────────
    if (aiSucceeded && rawAiContent) {
      const hallucinationReport = detectHallucinations(rawAiContent);
      if (!hallucinationReport.isClean) {
        console.warn(`[ReportGenerator V81] ⚠️ Hallucination detected in ${assetClass} analysis:`);
        for (const issue of hallucinationReport.issues) {
          console.warn(`  - ${issue}`);
        }
        // Replace rawAiContent with cleaned version
        rawAiContent = hallucinationReport.cleanedContent;

        // Re-parse the cleaned content
        const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
        if (markdownSections && Object.keys(markdownSections).length > 1) {
          aiContent = markdownSections;
        } else {
          aiContent = parseAIJsonResponse(rawAiContent);
        }

        console.log(`[ReportGenerator V81] Content cleaned — ${hallucinationReport.issues.length} hallucination issues addressed`);
      }
    }

    // ── V227: Speculation Detection Gate ──────────────────────
    // Count speculative words (قد, محتمل, ربما). If too many → the report
    // is filling gaps with speculation instead of real data.
    // Note: Confidence penalty applied later after finalConfidence is defined.
    let speculationPenalty = 0; // 0 = none, 1 = high (>15 words), 2 = excessive (>25 words)
    let speculationReport: SpeculationReport | null = null;
    if (aiSucceeded && rawAiContent) {
      speculationReport = detectSpeculation(rawAiContent);
      console.log(`[ReportGenerator V227] Speculation check: ${speculationReport.speculationWordCount} speculative words / ${speculationReport.totalWordCount} total (score: ${speculationReport.speculationScore}, hasNumbers: ${speculationReport.hasSpecificNumbers})`);

      if (speculationReport.shouldNotPublish) {
        console.warn(`[ReportGenerator V227] 🚫 EXCESSIVE SPECULATION: ${speculationReport.reason}`);
        speculationPenalty = 2;
      } else if (speculationReport.shouldRepublish) {
        console.warn(`[ReportGenerator V227] ⚠️ HIGH SPECULATION: ${speculationReport.reason}`);
        speculationPenalty = 1;
      }

      // V227: Check each section for specific data — remove sections with no numbers
      if (aiContent && typeof aiContent === 'object') {
        const sectionsToRemove: string[] = [];
        const DATA_SECTIONS = ['marketImpact', 'historicalContext', 'keyAnalysisPoints', 'scenarios', 'executiveSummary']; // Sections that MUST have data
        for (const [key, value] of Object.entries(aiContent)) {
          if (typeof value !== 'string' || value.trim().length < 30) continue;
          if (!DATA_SECTIONS.includes(key)) continue;
          if (!sectionHasSpecificData(value)) {
            // Check if the section is also highly speculative
            let sectionSpecCount = 0;
            // V234: Use combined speculation lists for section-level check
            const allSpecWords = [...STRONG_SPECULATIVE_PHRASES, ...WEAK_SPECULATIVE_WORDS];
            for (const word of allSpecWords) {
              const matches = value.match(new RegExp(word, 'g'));
              sectionSpecCount += matches ? matches.length : 0;
            }
            if (sectionSpecCount > 6) {
              console.warn(`[ReportGenerator V227] Section "${key}" has NO specific data AND ${sectionSpecCount} speculative words — replacing with brief note`);
              aiContent[key] = 'لا تتوفر بيانات كافية لتحليل هذا القسم بدقة.';
              sectionsToRemove.push(key);
            }
          }
        }
        if (sectionsToRemove.length > 0) {
          // Rebuild rawAiContent from updated aiContent
          rawAiContent = Object.entries(aiContent)
            .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
            .map(([k, v]) => `## ${k}\n\n${v}`)
            .join('\n\n');
        }
      }
    }
    // CODE-LEVEL enforcement: extract expert names from generated content
    // and cross-reference against source news data. Strip any experts
    // not mentioned in the source data.
    if (aiSucceeded && rawAiContent) {
      const expertResult = verifyExpertsAgainstSource(rawAiContent, filteredNews.items);
      if (expertResult.hallucinatedExperts.length > 0) {
        rawAiContent = expertResult.cleanedContent;
        // Re-parse the cleaned content
        const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
        if (markdownSections && Object.keys(markdownSections).length > 1) {
          aiContent = markdownSections;
        } else {
          aiContent = parseAIJsonResponse(rawAiContent);
        }
      }
    }

    // ── V219: Arabic Spell Check ──────────
    // Apply Arabic typo corrections (تكاليس→تكاليف, etc.)
    if (aiSucceeded && rawAiContent) {
      rawAiContent = applyArabicSpellCheck(rawAiContent);
    }

    // ── V221: Content Substantiality Gate ──────────
    // Check if the generated content is actually meaningful or just
    // empty placeholders (dots, empty parens, percentages without context).
    // This prevents publishing empty/placeholder reports like the crypto
    // report that had ". . ." as summary and empty sections.
    if (aiSucceeded && rawAiContent) {
      const substantiality = isContentSubstantial(rawAiContent, assetClass);
      if (!substantiality.isSubstantial) {
        console.error(`[ReportGenerator V221] 🚨 CONTENT NOT SUBSTANTIAL: ${substantiality.reason} — Arabic words: ${substantiality.arabicWordCount}, placeholder ratio: ${(substantiality.placeholderRatio * 100).toFixed(1)}%`);

        // V221: Try ONE retry with simplified prompt — sometimes the AI
        // generates placeholder content because the prompt is too complex
        // or the data is too thin. A simpler prompt may produce real content.
        try {
          console.log(`[ReportGenerator V221] Retrying ${assetClass} analysis with simplified prompt...`);
          const simplifiedMessages: ChatMessage[] = [
            {
              role: 'system',
              content: systemPrompt + '\n\n⚠️ اكتب تحليلاً مفصلاً بالعربية فقط. لا تترك أي قسم فارغاً. كل قسم يجب أن يحتوي على عدة جمل عربية كاملة. لا تستخدم نقاط (...) أو أقواس فارغة.',
            },
            {
              role: 'user',
              content: `اكتب تحليلاً شاملاً لسوق ${ASSET_CLASS_LABELS[assetClass].nameAr} بناءً على البيانات التالية:\n\n${userPrompt.slice(0, 4000)}${webSearchData || ''}\n\n⚠️ اكتب محتوى حقيقياً فقط — لا نقاط فارغة ولا أقواس فارغة.`,
            },
          ];
          const retryResult = await chatCompletion(simplifiedMessages, {
            temperature: 0.5,
            maxTokens: 8000,
            priority: 'generation',
          });
          const retryContent = retryResult.content?.trim() || '';
          const retrySubstantiality = isContentSubstantial(retryContent, assetClass);

          if (retrySubstantiality.isSubstantial) {
            console.log(`[ReportGenerator V221] Retry succeeded — ${retrySubstantiality.arabicWordCount} Arabic words, placeholder ratio ${(retrySubstantiality.placeholderRatio * 100).toFixed(1)}%`);
            rawAiContent = applyArabicSpellCheck(retryContent);
            const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
            if (markdownSections && Object.keys(markdownSections).length > 1) {
              aiContent = markdownSections;
            } else {
              aiContent = parseAIJsonResponse(rawAiContent);
            }
          } else {
            console.error(`[ReportGenerator V221] Retry also not substantial: ${retrySubstantiality.reason}`);
            // Mark as not publishable — the content is garbage
            aiSucceeded = false;
          }
        } catch (retryErr: any) {
          console.error(`[ReportGenerator V221] Retry failed: ${retryErr.message}`);
          aiSucceeded = false;
        }
      } else {
        console.log(`[ReportGenerator V221] ✓ Content substantial: ${substantiality.arabicWordCount} Arabic words, placeholder ratio ${(substantiality.placeholderRatio * 100).toFixed(1)}%`);
      }
    }

    // ── V86: Fabricated number detection in recommendations ────
    // Ported from analyzer V88: cross-reference numbers in the AI output
    // against the actual source news data. If numbers appear in the report
    // that don't exist in any source news item, they're likely fabricated.
    if (aiSucceeded && rawAiContent) {
      // Collect all numbers from source news items (ground truth)
      const sourceNumbers = new Set<string>();
      for (const newsItem of filteredNews.items) {
        const newsText = `${newsItem.title || ''} ${newsItem.summary || ''} ${newsItem.titleAr || ''} ${newsItem.summaryAr || ''}`;
        const nums = newsText.match(/\d+\.?\d*/g) || [];
        for (const n of nums) sourceNumbers.add(n);
      }
      // Also add numbers from indicators
      for (const ind of filteredIndicators.all) {
        const indText = `${ind.name || ''} ${ind.nameAr || ''} ${String(ind.value || '')} ${String(ind.changePercent || '')}`;
        const nums = indText.match(/\d+\.?\d*/g) || [];
        for (const n of nums) sourceNumbers.add(n);
      }

      // Extract numbers from the generated AI content
      const aiNumbers = rawAiContent.match(/\d+\.?\d*/g) || [];
      const fabricatedNumbers: string[] = [];

      for (const aiNum of aiNumbers) {
        const numVal = parseFloat(aiNum);
        // Skip small numbers (dates, percentages < 100, section numbers, etc.)
        if (numVal < 5) continue;
        // Skip obvious non-price numbers (years 2000-2099, percentages)
        if (numVal >= 2000 && numVal <= 2099) continue;
        if (aiNum.includes('.') && numVal < 100) continue; // Likely a percentage

        if (!sourceNumbers.has(aiNum)) {
          // This number doesn't appear in any source — potentially fabricated
          // Only flag if it looks like a price level (round thousands, or specific decimal)
          const looksLikePrice = numVal >= 100 || /^\d{2,},/.test(aiNum) || /^\d{4,5}$/.test(aiNum);
          if (looksLikePrice) {
            fabricatedNumbers.push(aiNum);
          }
        }
      }

      if (fabricatedNumbers.length >= 2) {
        // Two or more fabricated price-like numbers → strong sign of fabrication
        console.error(`[ReportGenerator V86] 🚨 FABRICATED NUMBERS: ${fabricatedNumbers.join(', ')} in ${assetClass} analysis not found in source data — stripping price targets!`);

        // Strip price targets from recommendations sections
        rawAiContent = rawAiContent
          .replace(/مع وقف خسارة[^.؟\n]*[.؟\n]?/g, '')
          .replace(/استهدافاً?[^.؟\n]*[.؟\n]?/g, '')
          .replace(/عند\s*\d+\.?\d*\s*(?:دولار|وون|يورو|ين|جنيه|ريال|درهم)?/g, '')
          .replace(/وقف\s+الخسارة\s+عند\s*\d+\.?\d*/g, '')
          .replace(/هدف\s+سعري\s+عند\s*\d+\.?\d*/g, '');

        // Re-parse after stripping
        const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
        if (markdownSections && Object.keys(markdownSections).length > 1) {
          aiContent = markdownSections;
        } else {
          aiContent = parseAIJsonResponse(rawAiContent);
        }
      }

      // V86: Also check — does the report say "insufficient data" but have specific recommendations?
      const saysInsufficient = /غير كافي|شحيحة|غير كافية|لا تتوفر بيانات|لا يمكن تقديم/.test(rawAiContent);
      const hasSpecificRec = REPORT_SELL_KEYWORDS.some(kw => rawAiContent.includes(kw)) ||
                             REPORT_BUY_KEYWORDS.some(kw => rawAiContent.includes(kw));
      const hasPriceTargets = /وقف خسارة[^0-9]*[0-9.,]+|استهداف[اً]*[^0-9]*[0-9.,]+/.test(rawAiContent);

      if (saysInsufficient && hasPriceTargets) {
        console.error(`[ReportGenerator V86] 🚨 CONTRADICTION: Report says "insufficient data" but has price targets for ${assetClass} — removing!`);
        rawAiContent = rawAiContent
          .replace(/مع وقف خسارة[^.؟\n]*[.؟\n]?/g, '')
          .replace(/استهدافاً?[^.؟\n]*[.؟\n]?/g, '')
          .replace(/عند\s*\d+\.?\d*\s*(?:دولار|وون|يورو|ين|جنيه|ريال|درهم)?/g, '');

        const markdownSections = parsePlainTextReport(rawAiContent, 'daily');
        if (markdownSections && Object.keys(markdownSections).length > 1) {
          aiContent = markdownSections;
        } else {
          aiContent = parseAIJsonResponse(rawAiContent);
        }
      }
    }

    // Calculate confidence
    const algorithmicConfidence = calculateConfidenceScore({
      newsCount: filteredNews.items.length,
      indicatorsCount: filteredIndicators.all.length,
      aiSucceeded,
      hasCalendarData: true,
      hasAnalyses: false,
      hasPreviousReports: false,
    });

    // V222: Extract AI-generated confidence from content (like generateReport does)
    // If the AI gave a X/10 score in a confidenceAssessment section, use it
    // instead of the algorithmic score — AI self-assessment is more accurate.
    let aiDerivedConfidence: number | null = null;
    if (rawAiContent) {
      const aiConfMatch = rawAiContent.match(/مستوى\s*الثقة\s*[:\s]*(\d+)\s*\/\s*10/);
      if (aiConfMatch) {
        const aiScore = parseInt(aiConfMatch[1], 10);
        if (aiScore >= 1 && aiScore <= 10) {
          aiDerivedConfidence = aiScore * 10; // Scale 1-10 → 10-100
          console.log(`[ReportGenerator V222] ${assetClass} AI confidence: ${aiScore}/10 → ${aiDerivedConfidence}% (algorithmic: ${algorithmicConfidence}%)`);
        }
      }
    }

    let confidenceScore = aiDerivedConfidence !== null ? aiDerivedConfidence : algorithmicConfidence;

    // Determine sentiment and risk
    const sentiment: 'bullish' | 'bearish' | 'neutral' = aiContent?.marketTrend === 'bullish'
      ? 'bullish'
      : aiContent?.marketTrend === 'bearish'
        ? 'bearish'
        : determineMarketImpact(filteredNews.avgSentimentScore);

    const riskLevel: 'low' | 'medium' | 'high' | 'extreme' = confidenceScore >= 70
      ? 'low'
      : confidenceScore >= 50
        ? 'medium'
        : confidenceScore >= 30
          ? 'high'
          : 'extreme';

    // V69: Build title — AI-generated descriptive title (event + impact)
    const assetLabel = ASSET_CLASS_LABELS[assetClass].nameAr;
    let title: string;
    if (customTitle) {
      title = customTitle;
    } else {
      const headlines = filteredNews.items.map(n => n.titleAr || n.title);
      title = await generateDescriptiveTitle(headlines, assetLabel, assetClass);
    }
    // V219: Title-Content Alignment — verify title reflects main content
    if (aiSucceeded && rawAiContent && title) {
      const alignment = checkTitleContentAlignment(title, rawAiContent);
      if (!alignment.isAligned) {
        console.warn(`[ReportGenerator V219] ⚠️ Title-Content misalignment: ${alignment.reason}`);
        try {
          const allHeadlines = filteredNews.items.slice(0, 6).map(
            (n: any) => n.titleAr || n.title || ''
          ).filter((t: string) => t.length > 5);
          const newTitle = await generateDescriptiveTitle(allHeadlines, assetLabel, assetClass);
          if (newTitle && newTitle !== title) {
            console.log(`[ReportGenerator V219] Title regenerated: "${title}" → "${newTitle}"`);
            title = newTitle;
          }
        } catch (titleErr: any) {
          console.warn(`[ReportGenerator V219] Title regeneration failed: ${titleErr.message}`);
        }
      }

      // V223: Title-Content Number Contradiction Check
      // Catches cases like "تراجع الذهب دون ألف دولار" when content says gold is at $2,380
      const numberContradiction = checkTitleNumberContradiction(title, rawAiContent);
      if (numberContradiction.hasContradiction) {
        console.warn(`[ReportGenerator V223] 🚨 NUMBER CONTRADICTION: Title "${title}" contradicts content. ${numberContradiction.reason}`);
        // Force regenerate title from headlines (which contain factual data)
        try {
          const allHeadlines = filteredNews.items.slice(0, 6).map(
            (n: any) => n.titleAr || n.title || ''
          ).filter((t: string) => t.length > 5);

          // Use a stricter prompt that avoids number misinterpretation
          const contradictionFixResult = await chatCompletion([
            {
              role: 'system',
              content: `أنت محرر مالي. اكتب عنواناً واحداً فقط لتقرير مالي.
القواعد الصارمة:
1. العنوان يجب أن يلخص الحدث بدقة — بلا مبالغة أو تحريف
2. ⚠️ احذر من تحريف الأرقام: "خسائر تتجاوز ألف دولار" لا تعني "تراجع دون ألف دولار"
3. لا تقل "دون مستوى X" إلا إذا كان السعر فعلاً أقل من X
4. لا تقل "فوق مستوى X" إلا إذا كان السعر فعلاً أعلى من X
5. إذا لم تكن متأكداً من رقم محدد — استخدم وصفاً نوعياً (ارتفاع كبير / تراجع حاد)
6. 5-12 كلمة فقط
7. أجب بالعنوان فقط`,
            },
            {
              role: 'user',
              content: `أهم الأخبار في تصنيف "${assetLabel}":
- ${allHeadlines.join('\n- ')}

المحتوى الفعلي يذكر: ${numberContradiction.contentNumber}
اكتب عنواناً لا يتعارض مع هذا الرقم:`,
            },
          ], { temperature: 0.3, maxTokens: 200, priority: 'translation' });

          let fixedTitle = contradictionFixResult.content?.trim() || '';
          fixedTitle = fixedTitle.replace(/^["]+|["\n]+$/g, '').trim();
          fixedTitle = fixedTitle.replace(/^[#\-*]+\s*/, '');

          if (fixedTitle && fixedTitle !== title) {
            // Verify the fixed title doesn't still have a contradiction
            const recheck = checkTitleNumberContradiction(fixedTitle, rawAiContent);
            if (!recheck.hasContradiction) {
              console.log(`[ReportGenerator V223] ✅ Title fixed after number contradiction: "${title}" → "${fixedTitle}"`);
              title = fixedTitle;
            } else {
              console.warn(`[ReportGenerator V223] ⚠️ Regenerated title STILL has number contradiction: "${fixedTitle}". Penalizing confidence.`);
              confidenceScore = Math.min(confidenceScore, 30);
            }
          }
        } catch (fixErr: any) {
          console.warn(`[ReportGenerator V223] Title fix failed: ${fixErr.message}. Penalizing confidence.`);
          confidenceScore = Math.min(confidenceScore, 30);
        }
      }
    }

    // V223: Duplicate topic check (7-day window)
    if (title) {
      const isDup = await isDuplicateTopic(title, assetClass);
      if (isDup) {
        console.warn(`[ReportGenerator V223] 🔄 Duplicate topic — same subject published within 7 days. Penalizing confidence.`);
        confidenceScore = Math.min(confidenceScore, 25);
      }
    }

    // V411: Validate title matches asset class domain — prevent oil-price title on arabMarkets report
    const ASSET_CLASS_TITLE_KEYWORDS: Record<string, string[]> = {
      arabMarkets: ['تداول', 'دبي', 'أبوظبي', 'السعودية', 'مصر', 'الكويت', 'الخليج', 'عربي', 'DFM', 'ADX', 'EGX', 'اكتتاب', 'أسواق'],
      energy: ['نفط', 'غاز', 'طاقة', 'أوبك', 'برنت', 'خام'],
      forex: ['دولار', 'يورو', 'ين', 'عملات', 'فوركس', 'فائدة'],
      stocks: ['أسهم', 'بورصة', 'داو', 'ناسداك', 'S&P'],
      crypto: ['بيتكوين', 'إيثيريوم', 'عملات رقمية', 'كتشين'],
      commodities: ['ذهب', 'فضة', 'نحاس', 'سلع'],
      economy: ['اقتصاد', 'تضخم', 'نمو', 'ركود', 'بنك مركزي'],
    };
    const titleKeywords = ASSET_CLASS_TITLE_KEYWORDS[assetClass];
    if (titleKeywords && !titleKeywords.some(kw => title.includes(kw))) {
      // Title doesn't match asset class — prefix with asset class context
      const assetClassNameAr: Record<string, string> = {
        arabMarkets: 'الأسواق العربية',
        energy: 'أسواق الطاقة',
        forex: 'سوق العملات',
        stocks: 'أسواق الأسهم',
        crypto: 'العملات الرقمية',
        commodities: 'أسواق السلع',
        economy: 'الاقتصاد الكلي',
      };
      const classPrefix = assetClassNameAr[assetClass] || '';
      if (classPrefix && !title.includes(classPrefix)) {
        title = `${classPrefix}: ${title}`;
      }
    }

    // V69: Always include timestamp in slug for hourly uniqueness
    const timeSuffix = '-' + now.getTime().toString(36);
    const slug = generateSlug(`${assetClass}-analysis-${now.toISOString().split('T')[0]}${timeSuffix}`);

    // V67: Build content from AI sections — supports both Markdown-parsed
    // and JSON-parsed formats. Markdown sections use keys like:
    //   introduction, executiveSummary, marketPulse, rouaRecommendations, etc.
    // JSON sections use keys like:
    //   summary, currencyPairsAnalysis, recommendations, etc.
    const summary = aiContent?.summary || aiContent?.executiveSummary || aiContent?.introduction
      || `تحليل سوق ${assetLabel} بناءً على ${filteredNews.items.length} خبر و${filteredIndicators.all.length} مؤشر`;

    // Build sections object — prioritize Markdown-parsed sections,
    // then fall back to JSON-specific keys
    const buildSections: Record<string, string> = {};

    // Map Markdown-parsed section keys (from parsePlainTextReport)
    if (aiContent) {
      for (const [key, value] of Object.entries(aiContent)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          buildSections[key] = value;
        }
      }
    }

    // Ensure key sections exist (fallback mapping for JSON-format AI responses)
    if (!buildSections.introduction && !buildSections.overview && (aiContent?.summary || summary)) {
      buildSections.introduction = aiContent?.summary || summary;
    }
    if (!buildSections.detailedAnalysis && !buildSections.marketPulse) {
      buildSections.detailedAnalysis = aiContent?.currencyPairsAnalysis || aiContent?.supplyDemandAnalysis
        || aiContent?.sectorBreakdown || aiContent?.yieldCurveAnalysis || aiContent?.oilAnalysis
        || aiContent?.residentialMarket || aiContent?.gdpAnalysis || aiContent?.bankEarnings
        || aiContent?.detailedAnalysis || '';
    }
    if (!buildSections.technicalOutlook) {
      buildSections.technicalOutlook = aiContent?.keyLevels
        ? `مستوى الدعم: ${(aiContent.keyLevels as any)?.support || 'غير محدد'}\nمستوى المقاومة: ${(aiContent.keyLevels as any)?.resistance || 'غير محدد'}`
        : (aiContent?.technicalAnalysis || '');
    }
    if (!buildSections.rouaRecommendations && !buildSections.strategicRecommendations) {
      buildSections.strategicRecommendations = aiContent?.recommendations || '';
    }
    if (!buildSections.riskAssessment) {
      buildSections.riskAssessment = aiContent?.riskFactors || '';
    }

    // If we have rawContent but no structured sections, put it as overview
    if (Object.values(buildSections).filter(v => v.trim().length > 20).length === 0 && rawAiContent) {
      buildSections.overview = rawAiContent;
    }

    const contentData = {
      type: 'analysis',  // V134: Unified format — all content follows {type, generatedAt, confidenceScore, sections, metadata, dataQuality}
      assetClass,
      generatedAt: now.toISOString(),
      confidenceScore,
      sections: buildSections,
      // V134: aiContent kept in metadata for backward compatibility with display layer
      metadata: {
        sentimentBreakdown: filteredNews.sentimentBreakdown,
        categoryBreakdown: filteredNews.categoryBreakdown,
        avgSentimentScore: filteredNews.avgSentimentScore,
        aiContent: aiContent || {},  // V134: Moved from top-level — display layer may read from here
        news: filteredNews.items.slice(0, 10).map(n => ({
          title: n.titleAr || n.title,
          sentiment: n.sentiment || 'neutral',
          behavior: n.behavior || n.sentiment || 'neutral',
          category: n.category,
        })),
        categories: filteredIndicators.all.slice(0, 8).map(i => ({ name: i.nameAr || i.name, category: i.category, sentiment: i.value > 0 ? 65 : 35 })),
      },
      dataQuality: {
        newsCount: filteredNews.items.length,
        indicatorsCount: filteredIndicators.all.length,
        calendarEventsCount: 0,
        aiGenerated: aiSucceeded,
      },
    };

    // Build indicators JSON
    const indicatorsData = filteredIndicators.all.slice(0, 10).map(i => ({
      name: i.nameAr || i.name,
      symbol: i.symbol,
      value: i.value,
      change: i.changePercent,
    }));

    // ── V135: Build price target — match indicator to asset class ──
    // OLD BUG: filteredIndicators.all[0] was always the SAME indicator regardless
    // of the asset being analyzed (e.g., BTC price showing as "current" for AUD/USD).
    // FIX: Find the most relevant indicator based on the asset class.
    const ASSET_INDICATOR_MAP: Record<string, string[]> = {
      forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF', 'EURGBP'],
      crypto: ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'],
      commodities: ['XAU', 'XAG', 'WTI', 'COPPER', 'OANDA:XAU_USD', 'OANDA:XAG_USD'],
      energy: ['WTI', 'BRENT', 'NATURALGAS', 'XAU'],
      stocks: ['SPX', 'NDX', 'DJI', 'FTSE', 'NKY'],
      bonds: ['US10Y', 'US2Y', 'US5Y', 'DE10Y'],
      economy: ['SPX', 'EURUSD', 'XAU'],
      technicalAnalysis: ['EURUSD', 'GBPUSD', 'USDJPY', 'BTC', 'XAU', 'BINANCE:BTCUSDT', 'OANDA:EUR_USD', 'OANDA:GBP_USD', 'OANDA:XAU_USD'],
      arabMarkets: ['TASI', 'DFM', 'EGX', 'KSE'],
      earnings: ['SPX', 'NDX'],
      banking: ['SPX', 'US10Y'],
      realEstate: ['SPX', 'US10Y'],
      strategic: ['SPX', 'EURUSD', 'XAU'],
    };

    const preferredSymbols = ASSET_INDICATOR_MAP[assetClass] || [];
    let matchedIndicator = filteredIndicators.all.find(i =>
      preferredSymbols.some(ps => i.symbol?.toUpperCase() === ps.toUpperCase())
    );
    // Fallback: try partial match (OANDA:EUR_USD matches EURUSD)
    if (!matchedIndicator) {
      matchedIndicator = filteredIndicators.all.find(i => {
        const sym = i.symbol?.toUpperCase() || '';
        return preferredSymbols.some(ps =>
          sym.includes(ps.toUpperCase()) || ps.toUpperCase().includes(sym.replace(/[^A-Z]/g, ''))
        );
      });
    }
    // Last resort: first indicator with a reasonable value (>0 and not obviously wrong)
    if (!matchedIndicator) {
      matchedIndicator = filteredIndicators.all.find(i => i.value > 0);
    }

    // V135: Try to extract target/stopLoss from AI content
    let extractedTarget: number | null = null;
    let extractedStopLoss: number | null = null;
    if (rawAiContent && matchedIndicator) {
      // Look for patterns like "استهداف 0.68" or "هدف 103,500" or "وقف خسارة عند 0.62"
      const targetPatterns = [
        /(?:استهداف|هدف\s*(?:سعري|ربحي)?)\s*(?:عند\s*)?(\d+[\.,]?\d*)/g,
        /(?:هدف)\s*(?:السعر|الوصول)\s*(?:إلى|عند)\s*(\d+[\.,]?\d*)/g,
      ];
      const stopPatterns = [
        /(?:وقف\s*خسارة|وقف\s*الخسارة)\s*(?:عند\s*)?(\d+[\.,]?\d*)/g,
        /(?:stop\s*loss)\s*(?:at\s*)?(\d+[\.,]?\d*)/gi,
      ];
      const currentValue = matchedIndicator.value;
      for (const pat of targetPatterns) {
        const match = pat.exec(rawAiContent);
        if (match) {
          const val = parseFloat(match[1].replace(',', ''));
          // Sanity: target should be within ±30% of current price for forex/crypto, ±50% for stocks
          const maxDeviation = ['forex', 'crypto', 'technicalAnalysis'].includes(assetClass) ? 0.3 : 0.5;
          if (val > 0 && Math.abs(val - currentValue) / Math.max(currentValue, 1) <= maxDeviation) {
            extractedTarget = val;
            break;
          }
        }
      }
      for (const pat of stopPatterns) {
        const match = pat.exec(rawAiContent);
        if (match) {
          const val = parseFloat(match[1].replace(',', ''));
          if (val > 0 && Math.abs(val - currentValue) / Math.max(currentValue, 1) <= 0.3) {
            extractedStopLoss = val;
            break;
          }
        }
      }
    }

    const priceTargetData = {
      current: matchedIndicator?.value || 0,
      target: extractedTarget,
      stopLoss: extractedStopLoss,
      symbol: matchedIndicator?.symbol || null,
      analysisDate: now.toISOString(),
    };

    // ── V217: Forex Data Gate ──
    // If this is a forex report and the content contains NO exchange rate data
    // (no currency pair prices like EUR/USD 1.08xx), don't publish as "forex".
    // A forex report without exchange rates is misleading — it may contain
    // off-topic content (food security, politics) disguised as forex analysis.
    let forexDataGatePassed = true;
    if (assetClass === 'forex') {
      const contentText = rawAiContent || '';
      // Check for actual exchange rate patterns: EUR/USD 1.08, USD/JPY 154, etc.
      const exchangeRatePattern = /(?:EUR\/USD|GBP\/USD|USD\/JPY|USD\/CHF|AUD\/USD|USD\/CAD|NZD\/USD|EUR\/GBP|DXY)\s*:?\s*\d+[\.,]?\d*/i;
      const hasCurrencyPairPrice = exchangeRatePattern.test(contentText);
      // Also check for Arabic patterns: "اليورو مقابل الدولار عند 1.08"
      const arabicRatePattern = /(?:اليورو|الدولار|الجنيه|الين)\s*(?:مقابل|أمام|عند|سجل|وصل)\s*\d+[\.,]?\d*/;
      const hasArabicRate = arabicRatePattern.test(contentText);
      // Check for numeric price-like data (1.0xxx for EUR/USD, 15x for USD/JPY)
      const hasRateLevel = /\b1\.\d{2,4}\b/.test(contentText) || /\b1\d{2}\.\d{1,2}\b/.test(contentText);

      if (!hasCurrencyPairPrice && !hasArabicRate && !hasRateLevel) {
        console.warn(`[ReportGenerator V217] ⚠️ FOREX DATA GATE FAILED: No exchange rate data found in forex report. Treating as 'economy' instead.`);
        forexDataGatePassed = false;
      }
    }

    // V135: Sanity check — if "current" price doesn't match the asset class, log warning and zero it
    // (e.g., AUD/USD should be ~0.65, not 27000)
    if (priceTargetData.current > 0) {
      const SANITY_RANGES: Record<string, [number, number]> = {
        forex: [0.01, 300],       // Currency pairs: 0.01 (exotic) to 300 (USD/JPY-type)
        crypto: [0.001, 500000],  // Crypto: anything
        commodities: [1, 50000],  // Gold, silver, oil
        energy: [1, 500],         // Oil, gas
        stocks: [100, 100000],    // Indices
        bonds: [0.1, 10],         // Bond yields (%)
        technicalAnalysis: [0.01, 500000], // Can be anything
      };
      const range = SANITY_RANGES[assetClass];
      if (range && (priceTargetData.current < range[0] || priceTargetData.current > range[1])) {
        console.warn(`[ReportGenerator V135] ⚠️ Price sanity check FAILED: ${assetClass} current=${priceTargetData.current} (expected ${range[0]}-${range[1]}). Symbol: ${priceTargetData.symbol}. Zeroing priceTarget.`);
        priceTargetData.current = 0;
        priceTargetData.target = null;
        priceTargetData.stopLoss = null;
      }
    }

    // Related news IDs
    const relatedNewsIds = filteredNews.items.slice(0, 10).map(n => n.id);

    // ── V135: Title-Price Sanity Check ──
    // If the title mentions a specific asset (e.g., "AUD/USD") but the
    // priceTarget.current is 0 (failed sanity check) or clearly wrong,
    // reduce confidence significantly and don't auto-publish.
    let titlePricePenalty = 0;
    if (assetClass === 'forex' || assetClass === 'technicalAnalysis') {
      const titleLower = title.toLowerCase();
      const forexPairs = ['eur/usd', 'gbp/usd', 'usd/jpy', 'aud/usd', 'usd/cad', 'nzd/usd', 'usd/chf', 'eur/gbp'];
      const mentionsForexPair = forexPairs.some(pair => titleLower.includes(pair));
      if (mentionsForexPair && priceTargetData.current === 0) {
        // Title says forex pair but we have no valid price data for it
        titlePricePenalty = 30;
        console.warn(`[ReportGenerator V135] ⚠️ Title mentions forex pair but no valid price data. Confidence penalty: -30`);
      }
    }
    const adjustedConfidence = Math.max(5, confidenceScore - titlePricePenalty);

    // V217: If forex data gate failed, reclassify as 'economy' and reduce confidence
    let finalAssetClass: AssetClass = assetClass;
    let finalTitle = title;
    let finalConfidence = adjustedConfidence;
    if (!forexDataGatePassed) {
      // Reclassify from forex → economy (content is macro/economic, not forex-specific)
      finalAssetClass = 'economy';
      // Prefix title to clarify it's not forex-specific
      if (!title.includes('اقتصاد') && !title.includes('اقتصادي')) {
        finalTitle = title; // Keep title as-is but change the assetClass label
      }
      // Severe confidence penalty — the report was misclassified
      finalConfidence = Math.max(15, adjustedConfidence - 25);
      console.warn(`[ReportGenerator V217] Forex report reclassified as 'economy'. Confidence: ${adjustedConfidence} → ${finalConfidence}`);
    }

    // V227: Apply speculation penalty to final confidence
    if (speculationPenalty === 2) {
      // Excessive speculation — don't publish, cap at 15%
      finalConfidence = Math.min(finalConfidence, 15);
      console.warn(`[ReportGenerator V227] Confidence capped at 15% due to excessive speculation`);
    } else if (speculationPenalty === 1) {
      // High speculation — penalize but allow publishing
      finalConfidence = Math.min(finalConfidence, Math.max(40, finalConfidence - 20));
      console.warn(`[ReportGenerator V227] Confidence penalized by 20 points due to high speculation (now: ${finalConfidence})`);
    }

    // V224: AI Apology Detection — catches AI refusal messages published as titles
    // Example: "أعتذر، لكن الأخبار المقدمة تتعلق بالرياضة وليس بالأسواق المالية..."
    if (finalTitle) {
      const apologyPatterns = [
        /أعتذر/,
        /لا يمكنني/,
        /لا أستطيع/,
        /لا أملك/,
        /ليس من اختصاصي/,
        /غير قادر على/,
        /I apologize/i,
        /I cannot/i,
        /I'm unable/i,
        /I'm sorry/i,
        /يتعلق بالرياضة/,
        /ليس بالأسواق المالية/,
        /يرجى تقديم خبر/,
      ];
      const isApology = apologyPatterns.some(p => p.test(finalTitle));
      if (isApology) {
        console.warn(`[ReportGenerator V224] 🚫 AI APOLOGY in title: "${finalTitle}". Suppressing publication.`);
        finalConfidence = 0;
      }
    }

    // V224: Incomplete Title Detection — catches titles with missing words
    // Example: "بلاك روك تدرس استثمار مليارات الدولارات في ، وتأثيره على سوق الأسهم"
    if (finalTitle) {
      const incompletePatterns = [
        /في\s*،/,          // "في ،" — preposition followed by comma without noun
        /من\s*،/,          // "من ،" — same pattern
        /على\s*،/,         // "على ،" — same pattern
        /إلى\s*،/,         // "إلى ،" — same pattern
        /عن\s*،/,          // "عن ،" — same pattern
        /في\s*و/,          // "في و" — preposition + conjunction without noun
        /\s،\sو\s/,        // " ، و " — comma + conjunction (missing item between)
      ];
      const isIncomplete = incompletePatterns.some(p => p.test(finalTitle));
      if (isIncomplete) {
        console.warn(`[ReportGenerator V224] ⚠️ INCOMPLETE TITLE detected: "${finalTitle}". Penalizing confidence and attempting fix.`);
        finalConfidence = Math.min(finalConfidence, 20);
        // Try to fix by removing the incomplete clause
        let fixedIncomplete = finalTitle;
        for (const pattern of incompletePatterns) {
          fixedIncomplete = fixedIncomplete.replace(pattern, '');
        }
        fixedIncomplete = fixedIncomplete.replace(/\s+/g, ' ').trim();
        if (fixedIncomplete.length > 10 && fixedIncomplete !== finalTitle) {
          console.log(`[ReportGenerator V224] Title cleaned: "${finalTitle}" → "${fixedIncomplete}"`);
          finalTitle = fixedIncomplete;
        }
      }
    }

    // V221: Content substantiality hard gate — NEVER publish empty/placeholder content
    // This is the FINAL check before saving. Even if all other checks pass,
    // if the content is not substantial, don't publish.
    if (!aiSucceeded || !rawAiContent) {
      finalConfidence = Math.min(finalConfidence, 15); // Cap at 15%
      console.warn(`[ReportGenerator V221] AI generation failed or empty — capping confidence at 15%`);
    } else {
      const finalSubstantiality = isContentSubstantial(rawAiContent, assetClass);
      if (!finalSubstantiality.isSubstantial) {
        finalConfidence = Math.min(finalConfidence, 15);
        console.warn(`[ReportGenerator V221] FINAL GATE: Content not substantial — ${finalSubstantiality.reason} — capping confidence at 15%`);
      }
    }

    // V222: "لا تنشر" gate — scan AI content for explicit "do not publish" directive
    // The AI writes "تصنيف النشر: لا تنشر" when confidence ≤ 6/10.
    // This MUST be enforced at the generation level, not just the save level.
    if (rawAiContent) {
      const doNotPublish = checkDoNotPublishDirective('', rawAiContent);
      if (doNotPublish.shouldSuppress) {
        console.warn(`[ReportGenerator V222] 🚫 "لا تنشر" GATE at generation level for ${assetClass}: ${doNotPublish.reason}`);
        finalConfidence = doNotPublish.extractedConfidence
          ? Math.min(finalConfidence, doNotPublish.extractedConfidence * 10)
          : Math.min(finalConfidence, 15);
      }
    }

    const analysis: GeneratedAnalysis = {
      title: finalTitle,
      slug,
      assetClass: finalAssetClass,
      analysisType: finalAssetClass === 'technicalAnalysis' ? 'technical' : 'fundamental',  // V135: Fix analysisType for technical analysis
      timeFrame: 'daily',
      content: JSON.stringify(contentData),
      indicators: JSON.stringify(indicatorsData),
      priceTarget: JSON.stringify(priceTargetData),
      riskLevel,
      sentiment,
      confidenceScore: finalConfidence,  // V217: Use final confidence (penalized if forex gate failed)
      relatedNewsIds: JSON.stringify(relatedNewsIds),
      isPublished: finalConfidence >= 30,  // V240: Lowered from 40 — empty market_indicators penalizes confidence
      publishedAt: finalConfidence >= 30 ? now : new Date(0),
      validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Valid for 24h
      locale: 'ar',  // Arabic report generator always produces Arabic content
    };

    return analysis;
  } catch (error: any) {
    console.error(`[ReportGenerator] Error generating ${assetClass} analysis:`, error.message);

    // Return a minimal analysis on error — V69: use descriptive-style title with time
    const assetLabel = ASSET_CLASS_LABELS[assetClass].nameAr;
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const timeSuffix = '-' + now.getTime().toString(36);
    return {
      title: `${assetLabel} — آخر تحديث ${timeStr} (محدود)`,
      slug: generateSlug(`${assetClass}-analysis-${now.toISOString().split('T')[0]}${timeSuffix}-partial`),
      assetClass,
      analysisType: assetClass === 'technicalAnalysis' ? 'technical' : 'fundamental',
      timeFrame: 'daily',
      content: JSON.stringify({ error: error.message, generatedAt: now.toISOString(), partial: true }),
      indicators: '{}',
      priceTarget: '{}',
      riskLevel: 'extreme',
      sentiment: 'neutral',
      confidenceScore: 10,
      relatedNewsIds: '[]',
      isPublished: false,
      publishedAt: new Date(0),
      validUntil: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      locale: 'ar',
    };
  }
}

// ─── Save Report to Database ────────────────────────────────

export async function saveReportToDb(report: GeneratedReport, force: boolean = false): Promise<{ id: string; title: string; slug: string } | null> {
  try {
    // V242→V363: Generic summary gate — cap confidence but do NOT block publication entirely.
    // The old V242 logic set isPublished=false for generic summaries, which caused a
    // complete halt of daily/weekly/monthly Arabic reports since May 17.
    // V363 FIX: Only penalize confidence (cap at 40). The report will still be published
    // if the capped confidence meets the template threshold.
    if (!force && report.summary) {
      const GENERIC_SUMMARY_PATTERNS = [
        /تقرير\s+\S+\s+يغطي\s+\d+\s+خبر\s+اقتصادي/i,
        /متوسط\s+مشاعر\s+السوق\s*:\s*\d+\s*\/\s*100/i,
      ];
      const isGenericSummary = GENERIC_SUMMARY_PATTERNS.some(p => p.test(report.summary));
      if (isGenericSummary) {
        console.warn(`[ReportGenerator V363] ⚠️ Generic summary in saveReportToDb — capping confidence at 40 (NOT unpublishing). Summary: "${report.summary.slice(0, 80)}"`);
        report.confidenceScore = Math.min(report.confidenceScore, 40);
        // V363: Do NOT set isPublished=false. The confidence cap is sufficient penalty.
      }
    }

    // V222→V235→V242: "لا تنشر" gate — block auto-generated flagged content.
    // When force=true (manual trigger from dashboard), the admin explicitly requested
    // this report — respect their decision and publish it.
    if (report.content && !force) {
      const doNotPublish = checkDoNotPublishDirective(report.content);
      if (doNotPublish.shouldSuppress) {
        console.warn(`[ReportGenerator V242] ⚠️ "لا تنشر" GATE: ${doNotPublish.reason}. Auto-generated: isPublished=false.`);
        report.isPublished = false;
        if (doNotPublish.extractedConfidence) {
          report.confidenceScore = Math.min(report.confidenceScore, doNotPublish.extractedConfidence * 10);
        } else {
          report.confidenceScore = Math.min(report.confidenceScore, 25);
        }
      }
    } else if (report.content && force) {
      // V235: For manual generation, check but don't block — just warn
      const doNotPublish = checkDoNotPublishDirective(report.content);
      if (doNotPublish.shouldSuppress) {
        console.warn(`[ReportGenerator V235] ⚠️ "لا تنشر" noted but force=true — publishing anyway. Reason: ${doNotPublish.reason}`);
        if (doNotPublish.extractedConfidence) {
          report.confidenceScore = Math.min(report.confidenceScore, Math.max(report.confidenceScore, doNotPublish.extractedConfidence * 10));
        }
      }
    }

    // V221→V235→V242: Content substantiality gate — only unpublish for auto-generated.
    // V242: Stricter — confidence below 40 = unpublished (was 25 before).
    if (report.content && !force) {
      try {
        const contentObj = JSON.parse(report.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 50) {
          const reportAssetClass = contentObj?.assetClass || report.scope || undefined;
          const substantiality = isContentSubstantial(allContent, reportAssetClass);
          if (!substantiality.isSubstantial) {
            console.warn(`[ReportGenerator V242] ⚠️ Content not substantial (auto): ${substantiality.reason}. isPublished=false.`);
            report.isPublished = false;
            report.confidenceScore = Math.min(report.confidenceScore, 40);
          }
        }
      } catch (parseErr: any) {
        if (report.content.length > 50) {
          const substantiality = isContentSubstantial(report.content, report.scope || undefined);
          if (!substantiality.isSubstantial) {
            console.warn(`[ReportGenerator V242] ⚠️ Content not substantial (auto, raw): ${substantiality.reason}. isPublished=false.`);
            report.isPublished = false;
            report.confidenceScore = Math.min(report.confidenceScore, 40);
          }
        }
      }
    } else if (report.content && force) {
      // V235: Manual generation — check but don't block, just log warning
      try {
        const contentObj = JSON.parse(report.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 50) {
          const reportAssetClass = contentObj?.assetClass || report.scope || undefined;
          const substantiality = isContentSubstantial(allContent, reportAssetClass);
          if (!substantiality.isSubstantial) {
            console.warn(`[ReportGenerator V235] ⚠️ Content marginal (manual, force=true): ${substantiality.reason}. Publishing anyway.`);
          }
        }
      } catch { /* ignore */ }
    }

    // V227→V235: Speculation gate — only unpublish for auto-generated reports.
    // Manual (force=true) generation bypasses this gate — admin wants the report published.
    if (report.content && report.isPublished && !force) {
      try {
        const contentObj = JSON.parse(report.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 100) {
          const specReport = detectSpeculation(allContent);
          if (specReport.shouldNotPublish) {
            console.warn(`[ReportGenerator V235] ⚠️ SPECULATION GATE (auto): ${specReport.speculationWordCount} speculative words — unpublishing. ${specReport.reason}`);
            report.isPublished = false;
            report.confidenceScore = Math.min(report.confidenceScore, 25);
          }
        }
      } catch { /* not JSON */ }
      if (report.isPublished && report.content.length > 100) {
        const specReport = detectSpeculation(report.content);
        if (specReport.shouldNotPublish) {
          console.warn(`[ReportGenerator V235] ⚠️ SPECULATION GATE (auto, raw): ${specReport.speculationWordCount} speculative words — unpublishing. ${specReport.reason}`);
          report.isPublished = false;
          report.confidenceScore = Math.min(report.confidenceScore, 25);
        }
      }
    } else if (report.content && report.isPublished && force) {
      // V235: Manual generation — log speculation warning but don't block
      try {
        const contentObj = JSON.parse(report.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 100) {
          const specReport = detectSpeculation(allContent);
          if (specReport.shouldNotPublish) {
            console.warn(`[ReportGenerator V235] ⚠️ High speculation (${specReport.speculationWordCount} words) but force=true — publishing manual report anyway.`);
          }
        }
      } catch { /* ignore */ }
    }

    // V240: When force=true (admin/manual trigger), ensure the report gets published.
    // The report may have been born with isPublished=false because confidenceScore
    // was below minConfidenceScore (e.g., 35 < 40). But if the admin explicitly
    // requested generation with force=true, we should publish it anyway.
    if (force && !report.isPublished && report.confidenceScore >= 20) {
      console.warn(`[ReportGenerator V240] Force-publishing report (force=true, confidence=${report.confidenceScore})`);
      report.isPublished = true;
      report.publishedAt = new Date();
    }

    // Check for duplicate slug+locale (V369 FIX: was findUnique({slug}) which broke after V256 changed to @@unique([slug,locale]))
    const existing = await db.economicReport.findFirst({ where: { slug: report.slug, locale: report.locale || 'ar' } });
    if (existing) {
      // V160.2: If force=true, always update the existing report with new content
      // Previously, force only updated when content was empty — this prevented
      // report regeneration from picking up template changes (e.g., new scenarios section)
      if (force) {
        try {
          console.log(`[ReportGenerator V160.2] Force-updating existing report (slug: ${report.slug}, id: ${existing.id})`);
          const updated = await db.economicReport.update({
            where: { id: existing.id },
            data: {
              title: report.title,
              summary: report.summary,
              content: report.content,
              confidenceScore: report.confidenceScore,
              marketImpact: report.marketImpact,
              isPublished: report.isPublished,
              publishedAt: report.isPublished ? report.publishedAt : undefined,
            },
          });
          return { id: updated.id, title: updated.title, slug: updated.slug };
        } catch (updateErr: any) {
          console.warn(`[ReportGenerator] Error updating existing report:`, updateErr.message);
        }
      }
      console.log(`[ReportGenerator] Report with slug "${report.slug}" already exists (id: ${existing.id})`);
      return { id: existing.id, title: existing.title, slug: existing.slug };
    }

    // V70: Title-based deduplication — prevent reports with identical or very similar titles
    // Check if a report with the same title already exists (exact match or normalized match)
    const normalizedTitle = report.title.trim().replace(/\s+/g, ' ').slice(0, 80);
    const existingWithTitle = await db.economicReport.findFirst({
      where: {
        title: { contains: normalizedTitle.slice(0, 40) },
        reportType: report.reportType,
        locale: report.locale || 'ar',  // V337: Dedup within same locale only
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Within last 2 hours
      },
      select: { id: true, title: true },
    });
    if (existingWithTitle) {
      // Check similarity — if first 30 chars match, it's likely a duplicate
      const existingNorm = existingWithTitle.title.trim().replace(/\s+/g, ' ').slice(0, 30);
      const newNorm = normalizedTitle.slice(0, 30);
      if (existingNorm === newNorm) {
        console.log(`[ReportGenerator] V70: Duplicate title detected, skipping. Existing: "${existingWithTitle.title}" vs New: "${report.title}"`);
        // V107: Fetch the full record to get the slug for correct URL in response
        const fullExisting = await db.economicReport.findUnique({ where: { id: existingWithTitle.id } });
        return { id: existingWithTitle.id, title: existingWithTitle.title, slug: fullExisting?.slug || report.slug };
      }
    }

    const saved = await db.economicReport.create({
      data: {
        title: report.title,
        slug: report.slug,
        summary: report.summary,
        content: report.content,
        reportType: report.reportType,
        scope: report.scope,
        locale: report.locale || 'ar',
        sectors: report.sectors,
        countries: report.countries,
        keyIndicators: report.keyIndicators,
        marketImpact: report.marketImpact,
        confidenceScore: report.confidenceScore,
        sourceUrls: report.sourceUrls,
        isPublished: report.isPublished,
        publishedAt: report.isPublished ? report.publishedAt : null,
      },
    });

    console.log(`[ReportGenerator] Saved ${report.reportType} report: id=${saved.id}, title="${saved.title}", confidence=${report.confidenceScore}, published=${report.isPublished}`);
    return { id: saved.id, title: saved.title, slug: saved.slug };
  } catch (error: any) {
    console.error('[ReportGenerator] Error saving report to DB:', error.message);
    return null;
  }
}

// ─── Save Analysis to Database ──────────────────────────────

export async function saveAnalysisToDb(analysis: GeneratedAnalysis, force: boolean = false): Promise<{ id: string; title: string; slug: string } | null> {
  try {
    // V242→V363: Generic content gate for analyses — cap confidence, do NOT block publication
    if (!force && analysis.content) {
      const GENERIC_PATTERNS = [
        /تقرير\s+\S+\s+يغطي\s+\d+\s+خبر\s+اقتصادي/i,
        /متوسط\s+مشاعر\s+السوق\s*:\s*\d+\s*\/\s*100/i,
      ];
      const hasGenericContent = GENERIC_PATTERNS.some(p => p.test(analysis.content));
      if (hasGenericContent) {
        console.warn(`[ReportGenerator V363] ⚠️ Generic content in ${analysis.assetClass} analysis — capping confidence at 40 (NOT unpublishing).`);
        analysis.confidenceScore = Math.min(analysis.confidenceScore, 40);
        // V363: Do NOT set isPublished=false. The confidence cap is sufficient penalty.
      }
    }

    // V222→V235→V242: "لا تنشر" gate for analyses — only block auto-generated.
    if (analysis.content && !force) {
      const doNotPublish = checkDoNotPublishDirective(analysis.content);
      if (doNotPublish.shouldSuppress) {
        console.warn(`[ReportGenerator V242] ⚠️ "لا تنشر" GATE (auto) for ${analysis.assetClass}: ${doNotPublish.reason}. isPublished=false.`);
        analysis.isPublished = false;
        if (doNotPublish.extractedConfidence) {
          analysis.confidenceScore = Math.min(analysis.confidenceScore, doNotPublish.extractedConfidence * 10);
        } else {
          analysis.confidenceScore = Math.min(analysis.confidenceScore, 25);
        }
      }
    } else if (analysis.content && force) {
      const doNotPublish = checkDoNotPublishDirective(analysis.content);
      if (doNotPublish.shouldSuppress) {
        console.warn(`[ReportGenerator V235] ⚠️ "لا تنشر" noted but force=true for ${analysis.assetClass} — publishing anyway.`);
      }
    }

    // V221→V235→V242: Content substantiality gate for analyses — only block auto-generated.
    // V242: Stricter — cap confidence at 40 (was 25).
    if (analysis.content && !force) {
      try {
        const contentObj = JSON.parse(analysis.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 50) {
          const substantiality = isContentSubstantial(allContent, analysis.assetClass);
          if (!substantiality.isSubstantial) {
            console.warn(`[ReportGenerator V242] ⚠️ Analysis not substantial (auto): ${substantiality.reason}. isPublished=false.`);
            analysis.isPublished = false;
            analysis.confidenceScore = Math.min(analysis.confidenceScore, 40);
          }
        }
      } catch (parseErr: any) {
        if (analysis.content.length > 50) {
          const substantiality = isContentSubstantial(analysis.content, analysis.assetClass);
          if (!substantiality.isSubstantial) {
            console.warn(`[ReportGenerator V242] ⚠️ Analysis not substantial (auto, raw): ${substantiality.reason}. isPublished=false.`);
            analysis.isPublished = false;
            analysis.confidenceScore = Math.min(analysis.confidenceScore, 40);
          }
        }
      }
    }

    // V227→V235: Speculation gate for analyses — only block auto-generated.
    if (analysis.content && analysis.isPublished && !force) {
      try {
        const contentObj = JSON.parse(analysis.content);
        const sections = contentObj?.sections || {};
        const sectionValues = Object.values(sections).filter((v: any) => typeof v === 'string' && v.trim().length > 0);
        const allContent = sectionValues.join('\n\n');
        if (allContent.length > 100) {
          const specReport = detectSpeculation(allContent);
          if (specReport.shouldNotPublish) {
            console.warn(`[ReportGenerator V235] ⚠️ SPECULATION GATE (auto): ${specReport.speculationWordCount} words in ${analysis.assetClass} — unpublishing.`);
            analysis.isPublished = false;
            analysis.confidenceScore = Math.min(analysis.confidenceScore, 25);
          }
        }
      } catch { /* not JSON */ }
      if (analysis.isPublished && analysis.content.length > 100) {
        const specReport = detectSpeculation(analysis.content);
        if (specReport.shouldNotPublish) {
          console.warn(`[ReportGenerator V235] ⚠️ SPECULATION GATE (auto, raw): ${specReport.speculationWordCount} words — unpublishing.`);
          analysis.isPublished = false;
          analysis.confidenceScore = Math.min(analysis.confidenceScore, 25);
        }
      }
    }

    // V240: When force=true, ensure analysis gets published (same logic as reports)
    if (force && !analysis.isPublished && analysis.confidenceScore >= 20) {
      console.warn(`[ReportGenerator V240] Force-publishing analysis (force=true, confidence=${analysis.confidenceScore}, asset=${analysis.assetClass})`);
      analysis.isPublished = true;
      analysis.publishedAt = new Date();
    }

    // Check for duplicate slug+locale (V369 FIX: was findUnique({slug}) which broke after V256 changed to @@unique([slug,locale]))
    const existing = await db.marketAnalysis.findFirst({ where: { slug: analysis.slug, locale: analysis.locale || 'ar' } });
    if (existing) {
      if (force) {
        // V67: Force update existing analysis with new content
        try {
          const existingContent = JSON.parse(existing.content || '{}');
          const sections = existingContent.sections || {};
          const hasEmptyContent = Object.values(sections).every((v: any) => !v || (typeof v === 'string' && v.trim().length < 50));
          if (hasEmptyContent) {
            console.log(`[ReportGenerator] V67: Updating existing analysis with thin content (slug: ${analysis.slug})`);
            const updated = await db.marketAnalysis.update({
              where: { id: existing.id },
              data: {
                title: analysis.title,
                content: analysis.content,
                indicators: analysis.indicators,
                priceTarget: analysis.priceTarget,
                riskLevel: analysis.riskLevel,
                sentiment: analysis.sentiment,
                confidenceScore: analysis.confidenceScore,
                isPublished: analysis.isPublished,
                publishedAt: analysis.isPublished ? analysis.publishedAt : undefined,
              },
            });
            return { id: updated.id, title: updated.title, slug: updated.slug };
          }
        } catch (parseErr: any) {
          console.warn(`[ReportGenerator] Error parsing existing analysis content:`, parseErr.message);
        }
        // Even if content is not empty, update with force
        console.log(`[ReportGenerator] V67: Force-updating existing analysis (slug: ${analysis.slug})`);
        const updated = await db.marketAnalysis.update({
          where: { id: existing.id },
          data: {
            title: analysis.title,
            content: analysis.content,
            indicators: analysis.indicators,
            priceTarget: analysis.priceTarget,
            riskLevel: analysis.riskLevel,
            sentiment: analysis.sentiment,
            confidenceScore: analysis.confidenceScore,
            isPublished: analysis.isPublished,
            publishedAt: analysis.isPublished ? analysis.publishedAt : undefined,
            validUntil: analysis.validUntil,
          },
        });
        return { id: updated.id, title: updated.title, slug: updated.slug };
      }
      console.log(`[ReportGenerator] Analysis with slug "${analysis.slug}" already exists (id: ${existing.id})`);
      return { id: existing.id, title: existing.title, slug: existing.slug };
    }

    // V92: Title-based deduplication for analyses — prevent near-duplicate analyses
    const normalizedTitle = analysis.title.trim().replace(/\s+/g, ' ').slice(0, 80);
    const existingWithTitle = await db.marketAnalysis.findFirst({
      where: {
        title: { contains: normalizedTitle.slice(0, 40) },
        assetClass: analysis.assetClass,
        locale: analysis.locale || 'ar',  // V337: Dedup within same locale only
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // Within last 2 hours
      },
      select: { id: true, title: true },
    });
    if (existingWithTitle) {
      const existingNorm = existingWithTitle.title.trim().replace(/\s+/g, ' ').slice(0, 30);
      const newNorm = normalizedTitle.slice(0, 30);
      if (existingNorm === newNorm) {
        console.log(`[ReportGenerator] V92: Duplicate analysis title detected, skipping. Existing: "${existingWithTitle.title}" vs New: "${analysis.title}"`);
        // V107: Fetch the full record to get the slug for correct URL in response
        const fullExistingAnalysis = await db.marketAnalysis.findUnique({ where: { id: existingWithTitle.id } });
        return { id: existingWithTitle.id, title: existingWithTitle.title, slug: fullExistingAnalysis?.slug || analysis.slug };
      }
    }

    const saved = await db.marketAnalysis.create({
      data: {
        title: analysis.title,
        slug: analysis.slug,
        assetClass: analysis.assetClass,
        analysisType: analysis.analysisType,
        timeFrame: analysis.timeFrame,
        locale: analysis.locale || 'ar',
        content: analysis.content,
        indicators: analysis.indicators,
        priceTarget: analysis.priceTarget,
        riskLevel: analysis.riskLevel,
        sentiment: analysis.sentiment,
        confidenceScore: analysis.confidenceScore,
        relatedNewsIds: analysis.relatedNewsIds,
        isPublished: analysis.isPublished,
        publishedAt: analysis.isPublished ? analysis.publishedAt : null,
        validUntil: analysis.validUntil,
      },
    });

    console.log(`[ReportGenerator] Saved ${analysis.assetClass} analysis: id=${saved.id}, title="${saved.title}", confidence=${analysis.confidenceScore}, published=${analysis.isPublished}`);
    return { id: saved.id, title: saved.title, slug: saved.slug };
  } catch (error: any) {
    console.error('[ReportGenerator] Error saving analysis to DB:', error.message);
    return null;
  }
}
