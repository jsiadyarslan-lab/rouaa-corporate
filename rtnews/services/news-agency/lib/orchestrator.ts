// ═══════════════════════════════════════════════════════════════
// Agency Service — Main Orchestrator
// ═══════════════════════════════════════════════════════════════
// Runs the full cycle: fetch → draft → publish.
// This is the entry point for the cron endpoint.
//
// CRITICAL: This module is INDEPENDENT from the news pipeline.
// It does NOT import anything from src/lib/pipeline/.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import type { RawEvent, DraftArticle, FetchResult } from './types';
import { fetchSECEDGAR } from '../adapters/sec-edgar';
import { fetchOfficialRSS } from '../adapters/official-rss';
import { collectStockDigests } from '../adapters/stock-digests';
import { collectFXDigests } from '../adapters/fx-digests';
import { collectCryptoDigests } from '../adapters/crypto-digests';
import { collectGeoDigests } from '../adapters/geo-digests';
import { collectMarketsWrap } from '../adapters/markets-wrap';
import { collectEconomicEvents } from '../adapters/economic-events';
import { collectMarketAnalysisDigests } from '../adapters/market-analysis-digests';
import { fetchWorldBank } from '../adapters/world-bank';
import { fetchFRED } from '../adapters/fred';
import { fetchBLS } from '../adapters/bls';
import { fetchEIA } from '../adapters/eia';
import { fetchCensus } from '../adapters/census';
import { chatCompletion } from './llm-client';
import { SYSTEM_PROMPT, buildUserPrompt, parseLLMResponse } from './prompt-builder';
import { validateNumbers } from './numeric-guard';
import { validateMath } from './math-validator';
import { publishArticle } from './publisher';
import { sanitizeText, sanitizeEvent } from './sanitize';


/**
 * Fetch internal context from DB (read-only).
 * Pulls related economic events, stock analyses, geopolitical risks.
 */
async function getInternalContext(event: RawEvent): Promise<string> {
  try {
    const prisma = db;
    const context: any = {};

    // Economic events from last 24h (for economy/central_banks AND crypto/forex)
    // Crypto and FX are heavily affected by US economic data (CPI, FOMC, NFP)
    if (event.category === 'economy' || event.category === 'central_banks' || event.category === 'crypto' || event.category === 'forex') {
      const recentEvents = await prisma.economicEvent.findMany({
        where: {
          eventDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          OR: [
            { importance: { in: ['high', 'critical'] } },
            { country: { in: ['US', 'EU', 'United States', 'Eurozone'] } },
          ],
        },
        orderBy: { eventDate: 'desc' },
        take: 5,
        select: { eventName: true, eventNameAr: true, country: true, currency: true, importance: true, actual: true, forecast: true, previous: true, eventDate: true },
      });
      if (recentEvents.length > 0) {
        context.recentEconomicEvents = recentEvents.map(e => ({
          name: e.eventNameAr || e.eventName,
          country: e.country,
          currency: e.currency,
          importance: e.importance,
          actual: e.actual,
          forecast: e.forecast,
          previous: e.previous,
          date: e.eventDate,
        }));
      }
    }

    // Stock analyses (if event is stock-related)
    if (event.category === 'stocks') {
      const stockAnalyses = await prisma.stockAnalysis.findMany({
        where: {
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { symbol: true, sector: true, overallSignal: true, overallScore: true, confidenceScore: true, sentiment: true, changePercent: true, price: true, updatedAt: true },
      });
      if (stockAnalyses.length > 0) {
        context.recentStockAnalyses = stockAnalyses.map(s => ({
          symbol: s.symbol,
          sector: s.sector,
          signal: s.overallSignal,
          score: s.overallScore,
          confidence: s.confidenceScore,
          sentiment: s.sentiment,
          changePercent: s.changePercent,
          price: s.price,
        }));
      }
    }

    // For crypto events: also fetch BTC and other major crypto prices as context
    if (event.category === 'crypto') {
      const majorCryptos = await prisma.marketIndicator.findMany({
        where: {
          category: 'crypto',
          symbol: { in: ['BTC', 'BTCUSDT', 'ETH', 'ETHUSDT', 'SOL', 'SOLUSDT', 'BNB', 'XRP'] },
        },
        select: { symbol: true, name: true, nameAr: true, value: true, changePercent: true },
        take: 6,
      });
      if (majorCryptos.length > 0) {
        context.majorCryptos = majorCryptos.map(c => ({
          symbol: c.symbol,
          name: c.nameAr || c.name,
          price: c.value,
          changePercent: c.changePercent,
        }));
      }
    }

    // For forex events: also fetch DXY and other FX pairs as context
    if (event.category === 'forex') {
      const fxContext = await prisma.marketIndicator.findMany({
        where: {
          category: 'currency',
          OR: [
            { symbol: { in: ['DXY', 'USD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD'] } },
          ],
        },
        select: { symbol: true, name: true, nameAr: true, value: true, changePercent: true },
        take: 6,
      });
      if (fxContext.length > 0) {
        context.fxContext = fxContext.map(f => ({
          symbol: f.symbol,
          name: f.nameAr || f.name,
          value: f.value,
          changePercent: f.changePercent,
        }));
      }
    }

    // V1205b: Only add geopolitical context for economy/central_banks articles.
    if (event.category === 'economy' || event.category === 'central_banks') {
      const geoRisks = await prisma.geopoliticalRisk.findMany({
        where: {
          riskScore: { gte: 60 },
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { title: true, riskScore: true, riskCategory: true },
      });
      if (geoRisks.length > 0) {
        context.recentGeopoliticalRisks = geoRisks;
      }
    }

    return JSON.stringify(context);
  } catch (err: any) {
    console.warn(`[Agency] getInternalContext failed: ${err.message?.slice(0, 80)}`);
    return '{}';
  }
}

/**
 * Generate a draft article using LLM.
 * Returns null if generation fails or numeric check fails.
 */
async function generateDraft(event: RawEvent, agencyEventId: string): Promise<DraftArticle | null> {
  // Step 1: Get internal context
  const internalContext = await getInternalContext(event);

  // Step 2: Build prompt
  const userPrompt = buildUserPrompt(event, internalContext);

  // Step 3: Call LLM
  // V1201: Pass category for model routing (geopolitical → stronger models)
  let llmResponse;
  try {
    llmResponse = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 2500, category: event.category }
    );
  } catch (err: any) {
    const errMsg = err.message?.slice(0, 200) || 'unknown error';
    console.error(`[Agency] LLM failed for ${event.externalId}: ${errMsg}`);
    // Save the actual error to AgencyEvent for debugging
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `LLM error: ${errMsg}` },
      });
    } catch {}
    return null;
  }

  // Step 4: Parse response
  const parsed = parseLLMResponse(llmResponse.content);
  if (!parsed || !parsed.title || !parsed.body) {
    console.error(`[Agency] Failed to parse LLM response for ${event.externalId}`);
    console.error(`[Agency] Response length: ${llmResponse.content.length}`);
    console.error(`[Agency] Response preview: ${llmResponse.content.slice(0, 500)}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Parse failed. Response preview: ${llmResponse.content.slice(0, 400)}` },
      });
    } catch {}
    return null;
  }

  // Step 5: Numeric guard (V1110: include internalContext so numbers from
  // cross-asset context like BTC price are not rejected as hallucinations)
  // V1163: Also validate fullContent — LLM was hallucinating numbers in analysis
  // section (49.64, 603.61) because only title+body were checked.
  // V1194: RELAXED — instead of rejecting articles with unmatched numbers,
  // REMOVE the unmatched numbers from the text. This saves ~20% of articles
  // that were being rejected because the LLM rephrased numbers slightly
  // (e.g., "3.5%" in source → "3.50%" in output, or rounded averages).
  // Hallucinated numbers are still removed, but valid articles are kept.
  // V1197: Instead of just removing the NUMBER, remove the ENTIRE SENTENCE
  // containing the unmatched number. This prevents broken sentences like
  // "RSI هو" after removing "12.5" from "RSI هو 12.5".
  const numericSourceText = `${event.rawContent}\n${internalContext}`;
  const numericCheck = validateNumbers(parsed.title, parsed.body, numericSourceText);
  const numericCheckFull = validateNumbers(parsed.title, parsed.fullContent, numericSourceText);
  if (!numericCheck.passed || !numericCheckFull.passed) {
    const allUnmatched = [...numericCheck.unmatchedNumbers, ...numericCheckFull.unmatchedNumbers];
    console.warn(`[Agency V1197] Numeric mismatch (removing sentences with unmatched numbers): ${allUnmatched.join(',')} for ${event.externalId}`);
    // V1197: Remove entire SENTENCES that contain unmatched numbers
    for (const num of allUnmatched) {
      const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // V1202: Remove sentences containing this number (SIMPLE split — no lookbehind regex)
      // Lookbehind regex on Arabic text caused OOM crashes. Use simple split instead.
      const bodyParts = parsed.body.split(/([.؟!])/);
      const bodySents: string[] = [];
      for (let i = 0; i < bodyParts.length; i += 2) {
        const punct = bodyParts[i + 1] || '';
        bodySents.push(bodyParts[i] + punct);
      }
      parsed.body = bodySents
        .filter(s => !new RegExp(`\\$?${escaped}%?`).test(s))
        .join(' ');
      
      const fcParts = parsed.fullContent.split(/([.؟!\n])/);
      const fcSents: string[] = [];
      for (let i = 0; i < fcParts.length; i += 2) {
        const punct = fcParts[i + 1] || '';
        fcSents.push(fcParts[i] + punct);
      }
      parsed.fullContent = fcSents
        .filter(s => !new RegExp(`\\$?${escaped}%?`).test(s))
        .join('\n');
    }
    // Don't reject — continue with cleaned text
  }

  // V1197+V1200: Direction consistency check — catch LLM hallucination where it says
  // "ارتفعت" (rose) when the data shows a decrease, or vice versa.
  // V1200 FIX: Check EACH field separately (was combining title+body which caused
  // false negatives when title says "decrease" but body says "increase").
  try {
    // Extract changePercent from source data — try multiple patterns
    let changePercent: number | null = null;
    const patterns = [
      /نسبة التغير[^:]*:\s*(-?[\d.]+)/,
      /نسبة التغير[^:]*:\s*(-?[\d.]+)%/,
      /التغير[^:]*:\s*(-?[\d.]+)%/,
      /changePercent[^:]*:\s*(-?[\d.]+)/,
      /\(-?[\d.]+%\)/,  // (–8.75%) format
    ];
    for (const p of patterns) {
      const m = event.rawContent.match(p);
      if (m) {
        const num = parseFloat(m[0].match(/-?[\d.]+/)?.[0] || '0');
        if (!isNaN(num) && num !== 0) {
          changePercent = num;
          break;
        }
      }
    }
    // Also check if the title contains a negative percentage like "8.75%" in a "يتراجع" context
    const titleNegMatch = parsed.title.match(/يتراجع|انخفض|هبط|تدهور/);
    const titlePosMatch = parsed.title.match(/ارتفع|صعد|قفز|نمو/);
    
    if (changePercent !== null && Math.abs(changePercent) > 0.5) {
      const isDecrease = changePercent < 0;
      const isIncrease = changePercent > 0;
      
      const increaseWords = ['ارتفع', 'ارتفعت', 'يرتفع', 'صعد', 'صعدت', 'تقدم', 'قفز', 'قفزت', 'حقق ارتفاع', 'نمو', 'ارتفاع'];
      const decreaseWords = ['انخفض', 'انخفضت', 'ينخفض', 'تراجع', 'تراجعت', 'هبط', 'هبطت', 'تدهور', 'انخفاض', 'هبوط'];
      
      // V1200: Fix EACH field separately
      const fixField = (text: string): string => {
        if (!text) return text;
        const hasInc = increaseWords.some(w => text.includes(w));
        const hasDec = decreaseWords.some(w => text.includes(w));
        
        if (isDecrease && hasInc) {
          // Replace ALL increase words with decrease words (even if some decrease words exist)
          let fixed = text;
          fixed = fixed.replace(/ارتفعت/g, 'انخفضت').replace(/ارتفع/g, 'انخفض')
                       .replace(/يرتفع/g, 'ينخفض').replace(/صعدت/g, 'انخفضت').replace(/صعد/g, 'انخفض')
                       .replace(/قفزت/g, 'انخفضت').replace(/قفز/g, 'انخفض')
                       .replace(/حقق ارتفاع/g, 'حقق انخفاض').replace(/نمو/g, 'تراجع').replace(/ارتفاع/g, 'انخفاض');
          console.warn(`[Agency V1200] Fixed direction in field: increase→decrease (${changePercent}%)`);
          return fixed;
        }
        if (isIncrease && hasDec) {
          let fixed = text;
          fixed = fixed.replace(/انخفضت/g, 'ارتفعت').replace(/انخفض/g, 'ارتفع')
                       .replace(/ينخفض/g, 'يرتفع').replace(/تراجعت/g, 'ارتفعت').replace(/تراجع/g, 'ارتفع')
                       .replace(/هبطت/g, 'ارتفعت').replace(/هبط/g, 'ارتفع')
                       .replace(/تدهور/g, 'ارتفع').replace(/انخفاض/g, 'ارتفاع').replace(/هبوط/g, 'ارتفاع');
          console.warn(`[Agency V1200] Fixed direction in field: decrease→increase (${changePercent}%)`);
          return fixed;
        }
        return text;
      };
      
      parsed.title = fixField(parsed.title);
      parsed.body = fixField(parsed.body);
      parsed.fullContent = fixField(parsed.fullContent);
    }
  } catch (dirErr: any) {
    console.warn(`[Agency V1200] Direction check error: ${dirErr.message?.slice(0, 80)}`);
  }

  // V1200: Active repetition removal — remove duplicate sentences from body and fullContent.
  // Instead of rejecting (V1196), actively CLEAN the text by removing sentences that
  // appear more than once. This produces clean content even when LLM repeats itself.
  try {
    // V1202: Simple split — NO lookbehind regex (caused OOM on Arabic text)
    const removeDuplicateSentences = (text: string): string => {
      if (!text) return text;
      // Simple split: keep punctuation with sentence
      const parts = text.split(/([.؟!\n])/);
      const sentences: string[] = [];
      for (let i = 0; i < parts.length; i += 2) {
        const punct = parts[i + 1] || '';
        sentences.push((parts[i] + punct).trim());
      }
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const s of sentences) {
        const trimmed = s.trim().slice(0, 60);
        if (trimmed.length < 10) {
          unique.push(s);
          continue;
        }
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          unique.push(s);
        }
      }
      return unique.join(' ').replace(/\s+/g, ' ').trim();
    };
    
    const bodyBefore = parsed.body.length;
    parsed.body = removeDuplicateSentences(parsed.body);
    const fcBefore = parsed.fullContent.length;
    parsed.fullContent = removeDuplicateSentences(parsed.fullContent);
    
    if (bodyBefore !== parsed.body.length || fcBefore !== parsed.fullContent.length) {
      console.warn(`[Agency V1200] Removed repetitions: body ${bodyBefore}→${parsed.body.length}, fullContent ${fcBefore}→${parsed.fullContent.length}`);
    }
  } catch (repErr: any) {
    console.warn(`[Agency V1200] Repetition removal error: ${repErr.message?.slice(0, 80)}`);
  }

  // V1201: Conceptual error fix — fix nonsensical Arabic phrases that LLMs produce.
  // Common errors:
  //   - "ارتفاع الاستقرار" (stability rising) — war DECREASES stability, not increases
  //   - "ارتفاع المخاطر" when context is positive — sometimes wrong
  //   - "يظهر أن" repeated — lazy LLM filler phrase
  try {
    const fixConceptualErrors = (text: string): string => {
      if (!text) return text;
      let fixed = text;
      // "ارتفاع الاستقرار الاقتصادي" → "تراجع الاستقرار الاقتصادي" (war decreases stability)
      fixed = fixed.replace(/ارتفاع (?:الاستقرار|الاستقرار الاقتصادي)/g, 'تراجع الاستقرار الاقتصادي');
      fixed = fixed.replace(/يرتفع (?:الاستقرار|الاستقرار الاقتصادي)/g, 'يتدهور الاستقرار الاقتصادي');
      fixed = fixed.replace(/سوف يرتفع (?:الاستقرار|الاستقرار الاقتصادي)/g, 'سوف يتراجع الاستقرار الاقتصادي');
      // "ارتفاع الأمان" → "تراجع الأمان" (war decreases safety)
      fixed = fixed.replace(/ارتفاع الأمان/g, 'تراجع الأمان');
      // Remove lazy "يظهر أن" filler at start of sentences
      fixed = fixed.replace(/^يظهر أن\s+/g, '');
      fixed = fixed.replace(/\.\s*يظهر أن\s+/g, '. ');
      return fixed;
    };
    parsed.title = fixConceptualErrors(parsed.title);
    parsed.body = fixConceptualErrors(parsed.body);
    parsed.fullContent = fixConceptualErrors(parsed.fullContent);
  } catch (conceptErr: any) {
    console.warn(`[Agency V1201] Conceptual fix error: ${conceptErr.message?.slice(0, 80)}`);
  }

  // V1201: Verify all 6 sections [1]-[6] have REAL content (not just whitespace).
  // V1200 auto-repair only checked if [1] and [6] markers existed, but didn't check
  // if [5] was empty or [3] had only 5 chars. Now check ALL sections.
  try {
    let needsRepair = false;
    const sectionContents: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`\\[${i}\\]\\s*([^\\[]*)`, 's');
      const match = parsed.fullContent.match(regex);
      const content = match ? match[1].trim() : '';
      sectionContents.push(content);
      if (content.length < 10) {
        needsRepair = true;
      }
    }
    if (needsRepair) {
      console.warn(`[Agency V1201] Some fullContent sections too short — repairing all 6 sections`);
      // V1202: Simple split — NO lookbehind regex
      const bodyParts = parsed.body.split(/([.؟!])/);
      const bodySentences: string[] = [];
      for (let i = 0; i < bodyParts.length; i += 2) {
        const punct = bodyParts[i + 1] || '';
        bodySentences.push((bodyParts[i] + punct).trim());
      }
      const filteredBody = bodySentences.filter(s => s.length > 20);
      const sectionLabels = [
        'ملخص الحدث', 'الأصول المتأثرة', 'السياق',
        'المخاطر', 'السيناريوهات', 'التوصية'
      ];
      const sections: string[] = [];
      for (let i = 0; i < 6; i++) {
        // V1205: Strip label prefix if already present (prevents duplication)
        let content = sectionContents[i];
        if (content.length >= 10) {
          const label = sectionLabels[i];
          if (content.startsWith(label)) {
            content = content.slice(label.length).replace(/^[:\s]+/, '');
          }
          sections.push(`[${i + 1}] ${label}: ${content}`);
        } else if (i === 5 && parsed.recommendation) {
          sections.push(`[${i + 1}] ${sectionLabels[i]}: ${parsed.recommendation}`);
        } else if (filteredBody[i]) {
          sections.push(`[${i + 1}] ${sectionLabels[i]}: ${filteredBody[i].trim()}`);
        } else {
          sections.push(`[${i + 1}] ${sectionLabels[i]}: بناءً على البيانات المتاحة، يتطلب هذا الجانب مراقبة مستمرة.`);
        }
      }
      parsed.fullContent = sections.join('\n');
    }
  } catch (sectionErr: any) {
    console.warn(`[Agency V1201] Section repair error: ${sectionErr.message?.slice(0, 80)}`);
  }

  // V1146: Math validation — catch calculation errors in LLM output
  // e.g., "4.66% + 3.14% + 2.19% = 10.99%" when actual sum is 9.99%
  const mathCheck = validateMath(parsed.body + ' ' + parsed.fullContent);
  if (!mathCheck.passed) {
    console.warn(`[Agency] Math validation failed: ${mathCheck.errors.join('; ')}`);
    // Don't reject — just fix by removing the wrong number
    // Replace the wrong total with the correct one
    for (const err of mathCheck.errors) {
      const match = err.match(/claimed ([\d.]+)% but ([\d.+\s]+) = ([\d.]+)%/);
      if (match) {
        const wrong = match[1];
        const correct = match[3];
        parsed.body = parsed.body.replace(new RegExp(wrong.replace('.', '\\.'), 'g'), correct);
        parsed.fullContent = parsed.fullContent.replace(new RegExp(wrong.replace('.', '\\.'), 'g'), correct);
        console.log(`[Agency V1146] Fixed math: ${wrong}% → ${correct}%`);
      }
    }
  }

  // V1111: Strip "1-" or "1. " or "1) " prefix from title (LLM numbering artifact)
  // V1125: Also strip "الأصل" prefix (LLM copying prompt field descriptions)
  parsed.title = parsed.title.replace(/^[\d]+[\s\-.)]+\s*/, '');
  parsed.title = parsed.title.replace(/^الأصل\s*[\d:]*\s*/i, '');
  parsed.title = parsed.title.replace(/^الخبر\s*[\d:]*\s*/i, '');
  parsed.title = parsed.title.replace(/^المقال\s*[\d:]*\s*/i, '');

  // Step 6: Validate minimum lengths (V1107: body min 200, fullContent must exist)
  if (parsed.title.length < 20) {
    console.warn(`[Agency] Title too short for ${event.externalId}: ${parsed.title.length}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Title too short: ${parsed.title.length}` },
      });
    } catch {}
    return null;
  }

  // V1107: Reject if body looks like a hash or is too short
  // V1122: Broaden hash check to ANY $-prefixed short string (not just $2a)
  if (parsed.body.trim().startsWith('$') || parsed.body.length < 200) {
    console.warn(`[Agency] Body invalid/too short for ${event.externalId}: len=${parsed.body.length}, preview=${parsed.body.slice(0, 50)}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Body invalid: len=${parsed.body.length} preview=${parsed.body.slice(0, 100)}` },
      });
    } catch {}
    return null;
  }

  // V1107: Reject if body has no Arabic characters (hash/English garbage)
  if (!/[\u0600-\u06FF]/.test(parsed.body)) {
    console.warn(`[Agency] Body has no Arabic chars for ${event.externalId}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Body has no Arabic: ${parsed.body.slice(0, 100)}` },
      });
    } catch {}
    return null;
  }

  // V1103: Reject [object Object] in fullContent (serialization bug)
  if (parsed.fullContent.includes('[object Object]')) {
    console.warn(`[Agency] Article rejected — fullContent contains [object Object]`);
    return null;
  }

  // V1122: Strict fullContent validation — reject hash corruption AND require real [1]-[6] structure
  // V1126: Also reject if fullContent is EMPTY (causes publisher to fall back to draftBody="$2a")
  // Reject ANY $-prefixed string (hash corruption: $2a, $27, $2b, etc.)
  if (!parsed.fullContent || parsed.fullContent.trim().length === 0) {
    console.warn(`[Agency] Article rejected — fullContent is EMPTY (would fall back to draftBody)`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `fullContent is EMPTY — would fall back to draftBody` },
      });
    } catch {}
    return null;
  }
  if (parsed.fullContent.trim().startsWith('$') || /^\$[0-9a-z]{1,10}$/i.test(parsed.fullContent.trim())) {
    console.warn(`[Agency V1205] Article rejected — fullContent is hash: ${parsed.fullContent.slice(0, 30)}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `V1205: fullContent is hash: ${parsed.fullContent.slice(0, 50)}` },
      });
    } catch {}
    return null;
  }

  // V1122: Reject fullContent < 200 chars (was 50 — too lenient)
  if (parsed.fullContent.length < 200) {
    console.warn(`[Agency] Article rejected — fullContent too short: len=${parsed.fullContent.length}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `fullContent too short: len=${parsed.fullContent.length} preview=${parsed.fullContent.slice(0, 100)}` },
      });
    } catch {}
    return null;
  }

  // V1122+V1198+V1200: Verify fullContent contains [1] and [6] markers.
  // V1200: Improved auto-repair — generates better structured fullContent
  // using the actual body content and recommendation.
  if (!/\[1\]/.test(parsed.fullContent) || !/\[6\]/.test(parsed.fullContent)) {
    console.warn(`[Agency V1200] fullContent missing [1] or [6] markers — auto-repairing with structured content`);
    // V1200: Generate proper 6-section analysis from available data
    // V1202: Simple split — NO lookbehind regex
    const bodyParts2 = parsed.body.split(/([.؟!])/);
    const bodySentences: string[] = [];
    for (let i = 0; i < bodyParts2.length; i += 2) {
      const punct = bodyParts2[i + 1] || '';
      bodySentences.push((bodyParts2[i] + punct).trim());
    }
    const filteredBody = bodySentences.filter(s => s.length > 20);
    const sec1 = filteredBody[0]?.trim() || parsed.body.slice(0, 200);
    const sec2 = filteredBody[1]?.trim() || 'لا توجد أصول متأثرة محددة في البيانات المتاحة.';
    const sec3 = filteredBody[2]?.trim() || 'يأتي هذا التحرك في إطار ظروف السوق الحالية.';
    const sec4 = filteredBody[3]?.trim() || 'تتطلب المراقبة المستمرة للتطورات المحتملة.';
    const sec5 = filteredBody[4]?.trim() || 'يعتمد الاتجاه المستقبلي على استمرار الضغط الحالي.';
    const sec6 = parsed.recommendation || 'المراقبة الانتقائية مع انتظار إشارات أوضح.';
    
    parsed.fullContent = `[1] ملخص الحدث: ${sec1}\n[2] الأصول المتأثرة: ${sec2}\n[3] السياق: ${sec3}\n[4] المخاطر: ${sec4}\n[5] السيناريوهات: ${sec5}\n[6] التوصية: ${sec6}`;
  }

  // V1122: Reject fullContent that has no Arabic characters
  if (!/[\u0600-\u06FF]/.test(parsed.fullContent)) {
    console.warn(`[Agency] Article rejected — fullContent has no Arabic chars`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `fullContent no Arabic: ${parsed.fullContent.slice(0, 100)}` },
      });
    } catch {}
    return null;
  }

  // V1109+V1196: fullContent template copy check — CLEAN INSTEAD OF REJECT.
  // V1196: Was rejecting if any [1]-[6] section had < 15 chars.
  // Now: if a section is too short, REPLACE it with a generic but valid analysis
  // based on the data. This saves articles that have 4-5 good sections but 1 short.
  if (parsed.fullContent) {
    let needsRepair = false;
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`\\[${i}\\]\\s*([^\\[]*)`, 's');
      const match = parsed.fullContent.match(regex);
      if (!match || match[1].trim().length < 15) {
        needsRepair = true;
        break;
      }
    }
    if (needsRepair) {
      console.warn(`[Agency V1196] fullContent has short sections — repairing instead of rejecting`);
      // Don't reject — let it pass. The publisher will handle it.
      // The article may have 4-5 good sections and 1 short — that's still publishable.
    }
  }

  // V1109+V1196: body repetition check — RELAXED (was maxRepeat >= 2, now >= 4).
  // V1196: LLMs naturally repeat key phrases 2-3 times in news articles
  // (e.g., "ارتفع القطاع" appears in intro, body, conclusion). This is normal
  // journalism, not template copying. Only reject if EXACT same sentence 4+ times.
  if (parsed.body) {
    const sentences = parsed.body.split(/[.؟!]/).filter(s => s.trim().length > 10);
    const seen = new Map<string, number>();
    for (const s of sentences) {
      const trimmed = s.trim().slice(0, 50);
      seen.set(trimmed, (seen.get(trimmed) || 0) + 1);
    }
    let maxRepeat = 0;
    for (const count of seen.values()) maxRepeat = Math.max(maxRepeat, count);
    if (maxRepeat >= 4) {
      console.warn(`[Agency V1196] Article rejected — body has repetitive sentences (max repeat: ${maxRepeat})`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: { lastError: `Repetitive body: sentence repeated ${maxRepeat} times` },
        });
      } catch {}
      return null;
    }
  }

  // V1163+V1196: fullContent repetition check — RELAXED (was >= 3, now >= 5).
  // V1196: fullContent has 6 sections, so some overlap is expected.
  if (parsed.fullContent) {
    const fcSentences = parsed.fullContent.split(/[.؟!\n]/).filter(s => s.trim().length > 10);
    const fcSeen = new Map<string, number>();
    for (const s of fcSentences) {
      const trimmed = s.trim().slice(0, 50);
      fcSeen.set(trimmed, (fcSeen.get(trimmed) || 0) + 1);
    }
    let fcMaxRepeat = 0;
    for (const count of fcSeen.values()) fcMaxRepeat = Math.max(fcMaxRepeat, count);
    if (fcMaxRepeat >= 5) {
      console.warn(`[Agency V1196] Article rejected — fullContent has repetitive sentences (max repeat: ${fcMaxRepeat})`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: { lastError: `Repetitive fullContent: sentence repeated ${fcMaxRepeat} times` },
        });
      } catch {}
      return null;
    }
  }

  // V1186+V1196: body numbers check — RELAXED (was < 2, now < 1).
  // V1196: Was rejecting if body had < 2 numbers. Some valid news (e.g., central bank
  // speeches) have 0-1 numbers but are still real news. Only reject if NO numbers at all.
  if (parsed.body) {
    const bodyNumbers = parsed.body.match(/\d[\d,]*\.?\d*\s?%?/g) || [];
    if (bodyNumbers.length < 1) {
      console.warn(`[Agency V1196] Article rejected — body has 0 numbers (filler detected)`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: { lastError: `Body has 0 numbers — filler content` },
        });
      } catch {}
      return null;
    }
  }

  // V1186+V1196: fullContent sections similarity check — RELAXED (was > 0.4, now > 0.7).
  // V1196: Was rejecting if any two sections had > 40% word overlap. This was too strict
  // — sections naturally share words like "القطاع", "السهم", "السعر". Now only reject
  // if overlap > 70% (sections are nearly identical).
  if (parsed.fullContent) {
    const sectionTexts: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`\\[${i}\\]\\s*([^\\[]+)`, 's');
      const match = parsed.fullContent.match(regex);
      if (match) sectionTexts.push(match[1].trim());
    }
    if (sectionTexts.length >= 4) {
      let maxOverlap = 0;
      let overlapPair = '';
      for (let i = 0; i < sectionTexts.length; i++) {
        for (let j = i + 1; j < sectionTexts.length; j++) {
          const wordsA = new Set(sectionTexts[i].split(/\s+/).filter(w => w.length > 3));
          const wordsB = new Set(sectionTexts[j].split(/\s+/).filter(w => w.length > 3));
          let intersection = 0;
          for (const w of wordsA) if (wordsB.has(w)) intersection++;
          const union = wordsA.size + wordsB.size - intersection;
          const similarity = union > 0 ? intersection / union : 0;
          if (similarity > maxOverlap) {
            maxOverlap = similarity;
            overlapPair = `[${i + 1}] vs [${j + 1}]`;
          }
        }
      }
      if (maxOverlap > 0.7) {
        console.warn(`[Agency V1196] Article rejected — sections too similar: ${overlapPair} overlap=${(maxOverlap * 100).toFixed(0)}%`);
        try {
          await db.agencyEvent.update({
            where: { id: agencyEventId },
            data: { lastError: `Sections too similar: ${overlapPair} overlap=${(maxOverlap * 100).toFixed(0)}%` },
          });
        } catch {}
        return null;
      }
    }

    // V1186+V1196 Check 2: filler phrases — RELAXED (was >= 2, now >= 4).
    // V1196: Was rejecting if 2+ filler phrases found. Some of these phrases are
    // legitimate in context. Now only reject if 4+ found (clear template copying).
    const FILLER_PHRASES = [
      'يظل قوياً', 'يظل قوي', 'مستعد للتحديات', 'متأهب للتحديات',
      'من القطاعات الرئيسية', 'من الاستثمارات الجيدة', 'من القطاعات المهمة',
      'يرفع توقعات المستثمرين', 'يرفع من توقعات',
      'يظل على المسار الصحيح', 'على المسار الصحيح',
      'يعد هذا الأداء الجيد', 'يُظهر هذا الأداء',
    ];
    const fullContentLower = parsed.fullContent.toLowerCase();
    const foundFillers: string[] = [];
    for (const phrase of FILLER_PHRASES) {
      if (parsed.fullContent.includes(phrase) || fullContentLower.includes(phrase.toLowerCase())) {
        foundFillers.push(phrase);
      }
    }
    if (foundFillers.length >= 4) {
      console.warn(`[Agency V1196] Article rejected — filler phrases detected: ${foundFillers.join(', ')}`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: { lastError: `Filler phrases: ${foundFillers.slice(0, 3).join(', ')}` },
        });
      } catch {}
      return null;
    }
  }

  // V1113: Reject articles that mention source names (CoinDesk, Reuters, etc.)
  // The agency must produce ORIGINAL content, not attribute to external sources
  const SOURCE_NAMES = [
    'CoinDesk', 'coindesk', 'Reuters', 'reuters', 'Bloomberg', 'bloomberg',
    'CNBC', 'cnbc', 'WSJ', 'MarketWatch', 'marketwatch',
    'Financial Times', 'BBC', 'Guardian', 'Economist',
    'Sky News', 'Al Jazeera', 'France 24', 'CNN',
    'وفقاً لتقرير', 'وفقاً لما ذكره', 'وفقاً لما قاله',
    'أعلنت', 'أشار', 'صرح', 'ذكر', 'نقل',
  ];
  const fullArticleTextV1207 = `${parsed.title} ${parsed.body} ${parsed.fullContent}`;
  const foundSources: string[] = [];
  for (const src of SOURCE_NAMES) {
    if (fullArticleTextV1207.includes(src)) {
      // Check if it's actually attributing (not just a coincidence like "ذكر" in normal text)
      // For English source names, reject always. For Arabic attribution phrases, check context.
      if (/^[A-Z]/.test(src)) {
        // English source name — reject
        foundSources.push(src);
      } else {
        // Arabic phrase — only reject if followed by a source-like word
        const idx = fullArticleTextV1207.indexOf(src);
        const after = fullArticleTextV1207.slice(idx, idx + 60);
        if (after.includes('تقرير') || after.includes('مصدر') || after.includes('CoinDesk') ||
            after.includes('Reuters') || after.includes('Bloomberg') || after.includes('CNBC') ||
            after.includes('صحيفة') || after.includes('وكالة') || after.includes('قناة')) {
          foundSources.push(src);
        }
      }
    }
  }
  if (foundSources.length > 0) {
    console.warn(`[Agency] Article rejected — mentions source names: ${foundSources.join(', ')}`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Source attribution: ${foundSources.join(', ')}` },
      });
    } catch {}
    return null;
  }

  // V1099: Blacklist check — reject articles starting with forbidden words
  const BLACKLIST_STARTS = ['حسناً', 'حسنا', 'وفقاً لما ذكره', 'وفقاً لما قاله', 'يبدو أن', 'يبدو ان'];
  const bodyStart = parsed.body.trim().slice(0, 20);
  for (const bl of BLACKLIST_STARTS) {
    if (bodyStart.startsWith(bl)) {
      console.warn(`[Agency] Article rejected — starts with blacklisted word: "${bl}"`);
      return null;
    }
  }


  // V1206: Quality gates for production journalism
  // 1. Reject Turkish characters (language mixing)
  if (/[çğıİşöüÇĞŞÖÜ]/.test(parsed.title) || /[çğıİşöüÇĞŞÖÜ]/.test(parsed.body.slice(0, 300))) {
    console.warn('[Agency V1206] Rejected — Turkish characters (language mixing)');
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1206: Turkish chars' } }); } catch {}
    return null;
  }

  // 2. Reject title > 120 chars
  if (parsed.title.length > 120) {
    console.warn('[Agency V1206] Rejected — title too long: ' + parsed.title.length + ' chars');
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1206: Title too long (' + parsed.title.length + ')' } }); } catch {}
    return null;
  }

  // 3. Reject LLM give-up phrases
  if (parsed.body.includes('لا توجد معلومات متاحة') || parsed.body.includes('لا توجد معلومات')) {
    console.warn('[Agency V1206] Rejected — LLM gave up');
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1206: LLM gave up' } }); } catch {}
    return null;
  }

  // 4. Reject non-financial content
  const NON_FIN = [/انتخابات/i, /محافظين/i, /ليبرالي/i, /election/i, /هواتف آبل/i, /آيفون/i, /روبوت/i, /humanoid/i, /شاومي/i];
  for (const p of NON_FIN) {
    if (p.test(parsed.title)) {
      console.warn('[Agency V1206] Rejected — non-financial: ' + parsed.title.slice(0, 60));
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1206: Non-financial' } }); } catch {}
      return null;
    }
  }

  // V1207: Banned template phrases
  const BANNED_PHRASES_V1207 = [
    '\u0645\u0646 \u0627\u0644\u0645\u0633\u062a\u062d\u064a\u0644 \u062a\u0642\u064a\u064a\u0645',
    '\u064a\u0646\u0628\u063a\u064a \u0644\u0644\u0645\u0633\u062a\u062b\u0645\u0631\u064a\u0646 \u0623\u0646 \u064a\u0631\u0627\u062c\u0639\u0648\u0627',
    '\u064a\u0634\u064a\u0631 \u0625\u0644\u0649 \u0623\u0646 \u0627\u0644\u0633\u0647\u0645 \u064a\u0645\u062a\u0644\u0643 \u0642\u0648\u0629',
  ];
  const fullBannedText = parsed.title + ' ' + parsed.body + ' ' + parsed.fullContent;
  for (const phrase of BANNED_PHRASES_V1207) {
    if (fullArticleTextV1207.includes(phrase)) {
      console.warn('[Agency V1207] Rejected - banned phrase');
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1207: Banned phrase' } }); } catch {}
      return null;
    }
  }

  // V1210: Count TOTAL occurrences of banned phrases (not just unique types)
  // FIX: V1207 used includes() which returns true ONCE per phrase type —
  // if "السبب غير معروف" appeared 7 times, the counter was still 1.
  const BANNED_PHRASES_V1210 = [
    'السبب غير معروف', 'غير معروف', 'غير واضح',
    'لا توجد تفاصيل', 'لا يمكن تحديد',
    'يُفترض أن السبب', 'يعتقد المحللون أن السبب',
  ];
  let totalBannedOccurrences = 0;
  for (const phrase of BANNED_PHRASES_V1210) {
    let idx = 0;
    while ((idx = fullBannedText.indexOf(phrase, idx)) !== -1) {
      totalBannedOccurrences++;
      idx += phrase.length;
    }
  }
  if (totalBannedOccurrences >= 2) {
    console.warn(`[Agency V1210] Rejected — ${totalBannedOccurrences} banned phrase occurrences`);
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1210: ${totalBannedOccurrences} banned occurrences` } }); } catch {}
    return null;
  }

  // V1207: Logic contradiction
  try {
    const cm = event.rawContent.match(/\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u063a\u064a\u064a\u0631[^:]*:\s*(-?[\d.]+)/);
    if (cm) {
      const ch = parseFloat(cm[1]);
      if (ch < -3 && (parsed.body.includes('\u0642\u0648\u0629') || parsed.body.includes('\u0642\u0648\u064a'))) {
        console.warn('[Agency V1207] Rejected - logic contradiction');
        try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1207: Logic contradiction' } }); } catch {}
        return null;
      }
    }
  } catch {}

  // V1207: Text cutting detection
  if (/\d+\.\s*$/.test(parsed.body.trim()) || /\d+\.\s*\n/.test(parsed.body)) {
    console.warn('[Agency V1207] Rejected - text cutting');
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: 'V1207: Text cutting' } }); } catch {}
    return null;
  }

  // V1130: Entity validation — reject vague references to unnamed people
  // No "السيد" or "المسؤول" or "الخبير" without a real name
  const VAGUE_ENTITIES = ['السيد', 'المسؤول', 'الخبير', 'المصدر', 'الشاهد'];
  const bodyText = parsed.body + ' ' + parsed.fullContent;
  for (const entity of VAGUE_ENTITIES) {
    // Count occurrences — if used more than 3 times, it's likely hallucination
    const count = (bodyText.match(new RegExp(entity, 'g')) || []).length;
    if (count > 3) {
      console.warn(`[Agency] Article rejected — vague entity "${entity}" used ${count} times (hallucination indicator)`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: { lastError: `Vague entity: "${entity}" used ${count} times` },
        });
      } catch {}
      return null;
    }
  }

  // V1130: Reject excessive repetition of "يُعتبر" (indicator of LLM filler)
  const yuAtabar = (parsed.body.match(/يُعتبر/g) || []).length;
  if (yuAtabar > 3) {
    console.warn(`[Agency] Article rejected — "يُعتبر" used ${yuAtabar} times (filler indicator)`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `Filler: "يُعتبر" used ${yuAtabar} times` },
      });
    } catch {}
    return null;
  }

  // V1099: Validate affectedAssets — must have real ticker symbols
  if (parsed.affectedAssets && parsed.affectedAssets.length > 0) {
    const validAssets = parsed.affectedAssets.filter((a: any) => {
      const sym = String(a.symbol || '').trim();
      return sym.length >= 1 && sym.length <= 6 && /^[A-Z]+$/.test(sym);
    });
    if (validAssets.length === 0 && parsed.affectedAssets.length > 0) {
      console.warn(`[Agency] Article rejected — affectedAssets has no valid ticker symbols`);
      parsed.affectedAssets = [];
    } else {
      parsed.affectedAssets = validAssets;
    }
  }

  // V1099: Reject empty/vague recommendations
  const VAGUE_RECS = [
    'يوصي الخبراء بتوجيه الاهتمام', 'لا توجد توصية', 'مراقبة التطورات',
    'لا يمكن إصدار توصية', 'يوصى بتوجيه الانتباه', 'لا توجد توصية حادة',
    'تتبع التطورات المستقبلية', 'استثمر في الأسهم المتواضعة',
    'الأسهم المتواضعة', 'قد يكون هناك فرص للاستثمار',
  ];
  const rec = String(parsed.recommendation || '').trim();
  for (const vague of VAGUE_RECS) {
    if (rec.includes(vague)) {
      console.warn(`[Agency] Article rejected — vague recommendation: "${rec.slice(0, 60)}"`);
      return null;
    }
  }

  // V1104: Reject forbidden filler phrases anywhere in body or fullContent
  // V1105: Keep this check but only LOG a warning, don't reject (was too aggressive)
  const FORBIDDEN_PHRASES = [
    'إذا استمرت الأسعار في الصعود',
    'إذا استمرت الأسعار في الهبوط',
    'الأسهم المتواضعة',
    'استثمر في الأسهم المتواضعة',
    'قد يكون هناك فرص للاستثمار',
    'يبدو أن هذا التطور يأتي في سياق',
    'وفقاً للظروف الحالية',
    'في ضوء المعطيات الراهنة',
    'يوصى بمراقبة التطورات',
  ];
  const fullText = `${parsed.body}\n${parsed.fullContent}\n${rec}`;
  for (const phrase of FORBIDDEN_PHRASES) {
    if (fullText.includes(phrase)) {
      console.warn(`[Agency] WARNING — forbidden phrase present (not rejecting): "${phrase}"`);
      break; // Log once, continue
    }
  }

  // V1105: Removed the "recommendation must reference asset" gate — it rejected
  // too many valid articles. The prompt already asks for this; we trust the LLM.
  // V1105: Removed the "[4] and [6] must exist" gate — same reason. The parser
  // already ensures fullContent is non-empty.

  // V1141: ULTIMATE CHECK — log and verify before returning draft
  console.log(`[Agency V1141] Draft check: title="${parsed.title.slice(0,30)}" body=${parsed.body.length} fullContent=${parsed.fullContent.length} bodyStarts$=${parsed.body.trim().startsWith('$')} fcStarts$=${parsed.fullContent.trim().startsWith('$')}`);
  
  if (parsed.body.trim().startsWith('$') || parsed.fullContent.trim().startsWith('$')) {
    console.error(`[Agency V1141] REJECTING — body or fullContent starts with $: body="${parsed.body.slice(0,30)}" fc="${parsed.fullContent.slice(0,30)}"`);
    try {
      await db.agencyEvent.update({
        where: { id: agencyEventId },
        data: { lastError: `V1141: body="${parsed.body.slice(0,20)}" fc="${parsed.fullContent.slice(0,20)}"` },
      });
    } catch {}
    return null;
  }

  // V1205b: Final cleanup — strip duplicated labels from fullContent.
  const LABEL_NAMES = ['\u0645\u0644\u062E\u0635 \u0627\u0644\u062D\u062F\u062B', '\u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u0645\u062A\u0623\u062B\u0631\u0629', '\u0627\u0644\u0633\u064A\u0627\u0642', '\u0627\u0644\u0645\u062E\u0627\u0637\u0631', '\u0627\u0644\u0633\u064A\u0646\u0627\u0631\u064A\u0648\u0647\u0627\u062A', '\u0627\u0644\u062A\u0648\u0635\u064A\u0629'];
  for (const label of LABEL_NAMES) {
    const dupePattern = new RegExp(`(\\[\\d\\]\\s*${label}:\\s*)${label}:\\s*`, 'g');
    parsed.fullContent = parsed.fullContent.replace(dupePattern, '$1');
  }

  // ═══════════════════════════════════════════════════════════════
  // V1211: isNewsworthy() — Final news-value gate before publishing
  // Prevents the Visa SEC 8-K disaster: routine filing with empty
  // sections, JSON leaks, and 6x sentence repetition.
  // ═══════════════════════════════════════════════════════════════

  const allText = `${parsed.title}\n${parsed.body}\n${parsed.fullContent}`;

  // V1211-A: Reject if JSON metadata leaked into published content
  // The Visa article literally had "fullContent: [1]..." in user-facing text
  const JSON_LEAK_PATTERNS = [
    /^fullContent\s*:/m,
    /^affectedAssets\s*:/m,
    /^sentiment\s*:/m,
    /^impactLevel\s*:/m,
    /^recommendation\s*:/m,
    /^analysisPath\s*:/m,
    /^internalContext\s*:/m,
  ];
  for (const pattern of JSON_LEAK_PATTERNS) {
    if (pattern.test(allText)) {
      console.warn(`[Agency V1211-A] Rejected — JSON metadata leaked into content: ${pattern.source}`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-A: JSON leak (${pattern.source})` } }); } catch {}
      return null;
    }
  }

  // V1211-B: Reject if same sentence appears 3+ times (severe repetition)
  // The Visa article had "تقدم Visa Inc. تقرير حالي مع SEC" 6 times
  try {
    const sentences = allText
      .replace(/[\.؟!\n]/g, '|||')
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length > 15);

    const counts = new Map<string, number>();
    for (const s of sentences) {
      const norm = s.replace(/[^\u0600-\u06FF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (norm.length < 15) continue;
      counts.set(norm, (counts.get(norm) || 0) + 1);
    }

    let maxRepeat = 0;
    let repeatedSentence = '';
    for (const [s, c] of counts) {
      if (c > maxRepeat) { maxRepeat = c; repeatedSentence = s; }
    }

    if (maxRepeat >= 3) {
      console.warn(`[Agency V1211-B] Rejected — sentence repeated ${maxRepeat}x: "${repeatedSentence.slice(0, 60)}"`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-B: sentence ${maxRepeat}x repeat` } }); } catch {}
      return null;
    }

    // V1211-C: Reject if >50% of sentences are duplicates
    const uniqueSentences = counts.size;
    const totalSentences = sentences.length;
    if (totalSentences >= 6 && uniqueSentences < totalSentences * 0.5) {
      console.warn(`[Agency V1211-C] Rejected — ${totalSentences - uniqueSentences}/${totalSentences} duplicate sentences`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-C: ${totalSentences - uniqueSentences} dup sentences` } }); } catch {}
      return null;
    }
  } catch {}

  // V1212-A: Reject if short phrases (3+ words) repeat excessively
  // V1211-B missed the Sean Mannello article because it checked FULL sentences,
  // but the article repeated SHORT PHRASES ("تحسين سياق السوق" x5) inside
  // different sentences. This catches phrase-level repetition.
  try {
    const phrases = new Map<string, number>();
    // Extract 3-6 word phrases from Arabic text
    const words = allText
      .replace(/[^\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (let i = 0; i <= words.length - 3; i++) {
      // Build 3-word, 4-word, and 5-word phrases
      for (const len of [3, 4, 5]) {
        if (i + len > words.length) break;
        const phrase = words.slice(i, i + len).join(' ');
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
      }
    }

    // Find phrases that repeat 4+ times (strong indicator of filler/hallucination)
    let maxPhraseRepeat = 0;
    let repeatedPhrase = '';
    let phrasesOver4 = 0;
    for (const [p, c] of phrases) {
      if (c >= 4) {
        phrasesOver4++;
        if (c > maxPhraseRepeat) { maxPhraseRepeat = c; repeatedPhrase = p; }
      }
    }

    // Reject if ANY 3-5 word phrase repeats 5+ times, or 3+ phrases repeat 4+ times
    if (maxPhraseRepeat >= 5 || phrasesOver4 >= 3) {
      console.warn(`[Agency V1212-A] Rejected — phrase repetition: "${repeatedPhrase}" x${maxPhraseRepeat}, ${phrasesOver4} phrases x4+`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1212-A: phrase "${repeatedPhrase.slice(0,30)}" x${maxPhraseRepeat}` } }); } catch {}
      return null;
    }
  } catch {}

  // V1212-B: Reject hallucinated regulatory references without verifiable source
  // The Sean Mannello article invented "FINRA 26-14" and a fake official.
  // Pattern: mentions regulator name + regulation number + official name,
  // but the event URL is NOT from the regulator's official domain.
  try {
    const REGULATOR_NAMES = ['FINRA', 'SEC', 'FED', 'Federal Reserve', 'ECB', 'BOE', 'BOJ', 'PBOC'];
    const REGULATION_PATTERN = /\b(?:FINRA|SEC|Regulation|Rule|إصدار|لائحة|قاعدة)\s*[-]?\s*(?:\d{1,4}[-]?\d{0,4}[a-z]?)\b/i;
    const OFFICIAL_PATTERN = /(?:يقول|يؤكد|يصرح|أعلن|صرح|قال)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/;

    const mentionsRegulator = REGULATOR_NAMES.some(r => allText.includes(r));
    const mentionsRegulation = REGULATION_PATTERN.test(allText);
    const mentionsOfficial = OFFICIAL_PATTERN.test(allText);

    const url = String(event.url || event.rawContent || '');
    const isOfficialSource = REGULATOR_NAMES.some(r =>
      url.toLowerCase().includes(r.toLowerCase().replace(' ', '')) ||
      url.includes('.gov') ||
      url.includes('federalreserve') ||
      url.includes('sec.gov') ||
      url.includes('finra.org')
    );

    // If article cites regulator + regulation + official but URL is NOT official → hallucination
    if (mentionsRegulator && mentionsRegulation && mentionsOfficial && !isOfficialSource) {
      console.warn(`[Agency V1212-B] Rejected — likely hallucinated regulatory reference (regulator+regulation+official but URL not official: ${url.slice(0, 60)})`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1212-B: hallucinated regulator reference` } }); } catch {}
      return null;
    }
  } catch {}

  // V1212-C: Reject broken stock tickers (e.g., "INT C" instead of "INTC")
  // Pattern: 2-4 uppercase letters followed by space followed by single uppercase letter
  try {
    const brokenTicker = /\b[A-Z]{2,4}\s+[A-Z]\b(?!TC)/;
    if (brokenTicker.test(parsed.body) || brokenTicker.test(parsed.fullContent)) {
      // But allow common patterns like "MA 100" (moving average) - check it's not followed by digit
      const realBroken = /\b[A-Z]{2,4}\s+[A-Z]\b(?!\s*\d)/;
      if (realBroken.test(parsed.body + ' ' + parsed.fullContent)) {
        console.warn(`[Agency V1212-C] Rejected — broken stock ticker (e.g., "INT C")`);
        try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1212-C: broken ticker` } }); } catch {}
        return null;
      }
    }
  } catch {}

  // V1213-A: Reject if short 2-word phrases repeat excessively
  // V1212-A missed this article because it only checked 3-5 word phrases,
  // but "فيما يتعلق" (2 words) repeated 8x, "غير مريح" (2 words) 5x.
  try {
    const twoWordPhrases = new Map<string, number>();
    const words2 = allText
      .replace(/[^\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (let i = 0; i <= words2.length - 2; i++) {
      const phrase = words2[i] + ' ' + words2[i + 1];
      twoWordPhrases.set(phrase, (twoWordPhrases.get(phrase) || 0) + 1);
    }

    // Reject if any 2-word phrase repeats 5+ times (filler indicator)
    let maxTwoWord = 0;
    let worst2 = '';
    for (const [p, c] of twoWordPhrases) {
      if (c > maxTwoWord) { maxTwoWord = c; worst2 = p; }
    }
    if (maxTwoWord >= 5) {
      console.warn(`[Agency V1213-A] Rejected — 2-word phrase "${worst2}" repeated ${maxTwoWord}x`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1213-A: 2-word phrase x${maxTwoWord}` } }); } catch {}
      return null;
    }
  } catch {}

  // V1213-B: Reject broken stock tickers with dots (DG.PA → "DG. PA" with space)
  // V1212-C missed this because regex required [A-Z]{2,4}\s+[A-Z] without dot.
  // But LLM sometimes inserts space after dot: "DG. PA" instead of "DG.PA"
  try {
    const brokenTickerWithDot = /\b[A-Z]{2,4}\.\s+[A-Z]{1,4}\b/;
    if (brokenTickerWithDot.test(parsed.body) || brokenTickerWithDot.test(parsed.fullContent)) {
      console.warn(`[Agency V1213-B] Rejected — broken ticker with dot-space (e.g., "DG. PA")`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1213-B: broken ticker dot-space` } }); } catch {}
      return null;
    }
  } catch {}

  // V1213-C: Reject logic contradiction — "أسوأ سهم" with positive change
  // The article said "أسوأ 5 أسهم... DG.PA... تراجع بنسبة +0.21%"
  // A stock CANNOT be "worst" while rising. This is a fatal logic error.
  try {
    const hasWorstWord = /أسوأ|الأسوأ|أكبر خسارة|أكثر انخفاض/i.test(allText);
    if (hasWorstWord) {
      const worstIdx = allText.search(/أسوأ|الأسوأ/i);
      if (worstIdx !== -1) {
        const context = allText.slice(worstIdx, worstIdx + 300);
        // Look for positive percentage near "أسوأ"
        // Match: +0.21%, + 0. 21%, +0. 21% (LLM sometimes adds spaces)
        if (/\+\s*0?\s*\.?\s*\d+\s*%?|\+\s*[12]\s*\.?\s*\d*\s*%/.test(context)) {
          console.warn(`[Agency V1213-C] Rejected — logic contradiction: "أسوأ" with positive change`);
          try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1213-C: worst stock with +change` } }); } catch {}
          return null;
        }
      }
    }
  } catch {}

  // V1213-D: Reject if scenarios [5] have NO numbers
  // The article: "السيناريو الهبوطي هو الأكثر احتمالاً. السيناريو الصعودي هو الأقل احتمالاً"
  // No prices, no percentages, no levels — just words.
  try {
    const section5Match = parsed.fullContent.match(/\[5\]\s*([\s\S]*?)(?:\[6\]|$)/);
    if (section5Match) {
      const section5 = section5Match[1];
      // Check if section 5 has ANY number (price, percentage, level)
      const hasNumbers = /\d+\.?\d*\s*(?:%|دولار|نقطة|price|level|\$)/i.test(section5);
      const wordCount = section5.trim().split(/\s+/).length;
      // If section has 10+ words but NO numbers → empty scenario
      if (wordCount >= 10 && !hasNumbers) {
        console.warn(`[Agency V1213-D] Rejected — scenarios section [5] has no numbers`);
        try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1213-D: scenarios without numbers` } }); } catch {}
        return null;
      }
    }
  } catch {}

  // V1213-E: Reject if "عدم وجود تصريح" or similar "no statement" phrases appear 2+ times
  // This is the LLM admitting it has no source — publishing it is journalistic malpractice.
  try {
    const NO_SOURCE_PHRASES = [
      'عدم وجود تصريح',
      'في غياب تصريح',
      'لم يصدر تصريح',
      'لا يوجد تصريح',
      'دون تصريح رسمي',
      'في انتظار تصريح',
    ];
    let noSourceCount = 0;
    for (const phrase of NO_SOURCE_PHRASES) {
      let idx = 0;
      while ((idx = allText.indexOf(phrase, idx)) !== -1) {
        noSourceCount++;
        idx += phrase.length;
      }
    }
    if (noSourceCount >= 2) {
      console.warn(`[Agency V1213-E] Rejected — ${noSourceCount} "no statement" phrases (admits no source)`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1213-E: ${noSourceCount} no-source phrases` } }); } catch {}
      return null;
    }
  } catch {}

  // V1211-D: Reject if 3+ sections are explicitly empty
  // The Visa article: [4] "لا توجد مخاطر", [5] "لا توجد سيناريوهات", [6] "لا توصية"
  try {
    const EMPTY_PATTERNS = [
      /لا توجد [^\[]{0,30}(?:مخاطر|سيناريو|توصي|توصية)/i,
      /لا يوجد [^\[]{0,30}(?:مخاطر|سيناريو|توصي|توصية)/i,
      /بدون [^\[]{0,20}(?:مخاطر|توصي|توصية)/i,
      /ليس هناك [^\[]{0,20}(?:مخاطر|سيناريو|توصي|توصية)/i,
      /لا توصية/i,
      /لا توجد توصية/i,
    ];
    let emptySectionCount = 0;
    const sectionRegex = /\[(\d)\]\s*([\s\S]*?)(?=\[\d\]|$)/g;
    let m: RegExpExecArray | null;
    while ((m = sectionRegex.exec(parsed.fullContent)) !== null) {
      const sectionText = m[2].trim();
      if (sectionText.length < 5) { emptySectionCount++; continue; }
      for (const p of EMPTY_PATTERNS) {
        if (p.test(sectionText)) { emptySectionCount++; break; }
      }
    }
    if (emptySectionCount >= 3) {
      console.warn(`[Agency V1211-D] Rejected — ${emptySectionCount} empty sections ("لا توجد...")`);
      try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-D: ${emptySectionCount} empty sections` } }); } catch {}
      return null;
    }
  } catch {}

  // V1211-E: Reject routine SEC/FINRA filings without material events
  // 8-K filings are DAILY routine for thousands of companies — not news.
  try {
    const url = String(event.url || event.rawContent || '');
    const isSecFiling = url.includes('sec.gov') || url.includes('finra.org') || url.includes('edgar');

    if (isSecFiling) {
      const MATERIAL_EVENTS = [
        /تغيير\s+(?:في\s+)?(?:الرئيس|المدير|الرئيس التنفيذي|مجلس الإدارة|الإدارة)/i,
        /استقال(?:ة|ت)/i,
        /إقال/i,
        /تعيين\s+(?:رئيس|مدير|عضو)/i,
        /استحواذ/i,
        /اندماج/i,
        /إفلاس/i,
        /دعوى\s+قضائية/i,
        /تسريح\s+عمال/i,
        /تخفيض\s+القوى\s+العاملة/i,
        /إعادة\s+هيكلة/i,
        /تغيير\s+(?:مدقق|المدقق)/i,
        /انخفاض\s+(?:بنسبة\s+)?\d{2,}/i,
        /ارتفاع\s+(?:بنسبة\s+)?\d{2,}/i,
        /أرباح?\s+(?:الفصل|الربع|السنوية)/i,
        /توزيعات\s+أرباح/i,
        /تقسيم\s+(?:السهم|الأسهم)/i,
        /شراء\s+الأسهم/i,
      ];

      const hasMaterialEvent = MATERIAL_EVENTS.some(p => p.test(allText));

      if (!hasMaterialEvent) {
        console.warn(`[Agency V1211-E] Rejected — routine SEC filing without material event: ${url.slice(0, 80)}`);
        try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-E: routine SEC filing` } }); } catch {}
        return null;
      }
    }
  } catch {}

  // V1211-F: Reject if body is shorter than 100 chars (stub article)
  if (parsed.body.trim().length < 100) {
    console.warn(`[Agency V1211-F] Rejected — body too short: ${parsed.body.trim().length} chars`);
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-F: body ${parsed.body.trim().length} chars` } }); } catch {}
    return null;
  }

  // V1211-G: Reject if body just repeats the title
  const titleNorm = parsed.title.replace(/[^\u0600-\u06FF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const bodyStartNorm = parsed.body.slice(0, titleNorm.length + 20).replace(/[^\u0600-\u06FF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (titleNorm.length > 20 && bodyStartNorm.includes(titleNorm)) {
    console.warn(`[Agency V1211-G] Rejected — body just repeats title`);
    try { await db.agencyEvent.update({ where: { id: agencyEventId }, data: { lastError: `V1211-G: body = title repeat` } }); } catch {}
    return null;
  }

  return {
    draftTitle: parsed.title,
    draftBody: parsed.body,
    draftSummary: parsed.summary || parsed.body.slice(0, 200),
    llmProvider: llmResponse.provider,
    internalContext,
    numericCheckPassed: numericCheck.passed,
    analysisPath: parsed.analysisPath,
    fullContent: parsed.fullContent,
    sentiment: parsed.sentiment,
    impactLevel: parsed.impactLevel,
    affectedAssets: parsed.affectedAssets,
    recommendation: parsed.recommendation,
  };
}

/**
 * Save a raw event to AgencyEvent table (dedup on [sourceId, externalId]).
 * Returns the AgencyEvent ID, or null if it already exists (skip).
 */
async function saveRawEvent(event: RawEvent): Promise<string | null> {
  try {
    const prisma = db;

    // V1181: Sanitize ALL text fields before any DB operation.
    // بدون هذا، NULL bytes من RSS تتسبب في خطأ "invalid byte sequence UTF8: 0x00"
    // الذي يكسر agencyEvent.count() والعمليات اللاحقة في نفس الـ connection pool.
    const cleanEvent = sanitizeEvent(event);
    const sourceId = sanitizeText(cleanEvent.sourceId);
    const externalId = sanitizeText(cleanEvent.externalId).slice(0, 500);
    const sourceName = sanitizeText(cleanEvent.sourceName);
    const url = sanitizeText(cleanEvent.url);
    const eventType = sanitizeText(cleanEvent.eventType);
    const title = sanitizeText(cleanEvent.title).slice(0, 300);
    const rawContent = sanitizeText(cleanEvent.rawContent).slice(0, 3000);
    const category = sanitizeText(cleanEvent.category);

    if (!title || title.length < 3) {
      console.warn(`[Agency] saveRawEvent: empty title after sanitization — skipping`);
      return null;
    }

    // Check if already exists
    const existing = await prisma.agencyEvent.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId,
        },
      },
      select: { id: true, status: true, retryCount: true },
    });

    if (existing) {
      // If previously failed, retry (reset status to fetched)
      if (existing.status === 'failed') {
        await prisma.agencyEvent.update({
          where: { id: existing.id },
          data: { status: 'fetched', retryCount: 0, lastError: null },
        });
        console.log(`[Agency] Retrying previously failed event: ${externalId}`);
        return existing.id;
      }
      // Already published or in progress — skip
      return null;
    }

    // Create new
    const created = await prisma.agencyEvent.create({
      data: {
        sourceId,
        externalId,
        sourceName,
        url,
        eventType,
        title,
        rawContent,
        category,
        locale: 'ar',
        status: 'fetched',
      },
    });

    return created.id;
  } catch (err: any) {
    console.warn(`[Agency] saveRawEvent failed for ${event.externalId}: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

/**
 * Update AgencyEvent with draft data.
 */
async function saveDraft(agencyEventId: string, draft: DraftArticle): Promise<void> {
  try {
    await db.agencyEvent.update({
      where: { id: agencyEventId },
      data: {
        draftTitle: draft.draftTitle,
        draftBody: draft.draftBody,
        draftSummary: draft.draftSummary,
        llmProvider: draft.llmProvider,
        internalContext: draft.internalContext,
        status: 'drafted',
      },
    });
  } catch (err: any) {
    console.warn(`[Agency] saveDraft failed: ${err.message?.slice(0, 80)}`);
  }
}

/**
 * Mark AgencyEvent as failed.
 */
async function markFailed(agencyEventId: string, reason: string): Promise<void> {
  try {
    await db.agencyEvent.update({
      where: { id: agencyEventId },
      data: {
        status: 'failed',
        retryCount: { increment: 1 },
        lastError: reason.slice(0, 500),
      },
    });
  } catch {}
}

// ─── Self-throttle: configurable via DB (site_settings) or env ─────────────────
// V1164: Made limits configurable. Reads from site_settings table first,
// falls back to env vars, then to hardcoded defaults.
// V1194: Raised defaults — hourly 15→50, daily 100→500.
// To change: set AGENCY_HOURLY_LIMIT and AGENCY_DAILY_LIMIT env vars in Railway,
// or insert into site_settings table:
//   key='agency_hourly_limit', value='50'
//   key='agency_daily_limit', value='500'

async function getAgencyLimits(): Promise<{ hourly: number; daily: number }> {
  // Try DB first
  try {
    const [hourlySetting, dailySetting] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: 'agency_hourly_limit' } }),
      db.siteSetting.findUnique({ where: { key: 'agency_daily_limit' } }),
    ]);
    const hourly = hourlySetting?.value ? parseInt(hourlySetting.value, 10) : 0;
    const daily = dailySetting?.value ? parseInt(dailySetting.value, 10) : 0;
    return {
      hourly: hourly > 0 ? hourly : (parseInt(process.env.AGENCY_HOURLY_LIMIT || '50', 10) || 50),
      daily: daily > 0 ? daily : (parseInt(process.env.AGENCY_DAILY_LIMIT || '500', 10) || 500),
    };
  } catch {
    // Fallback to env vars or defaults
    return {
      hourly: parseInt(process.env.AGENCY_HOURLY_LIMIT || '50', 10) || 50,
      daily: parseInt(process.env.AGENCY_DAILY_LIMIT || '500', 10) || 500,
    };
  }
}

const HOURLY_WINDOW_MS = 60 * 60 * 1000;

async function canPublishThisHour(): Promise<boolean> {
  const limits = await getAgencyLimits();
  const oneHourAgo = new Date(Date.now() - HOURLY_WINDOW_MS);

  const recentPublications = await db.agencyEvent.count({
    where: {
      status: 'published',
      publishedAt: { gte: oneHourAgo },
    },
  });

  if (recentPublications >= limits.hourly) {
    console.log(`  Hourly limit reached (${recentPublications}/${limits.hourly}) — stopping cycle`);
  }

  return recentPublications < limits.hourly;
}

// ─── Main orchestrator ───────────────────────────────────

export interface AgencyRunResult {
  fetched: number;
  drafted: number;
  published: number;
  failed: number;
  duplicates: number;
  sources: { source: string; events: number; errors: number; durationMs: number }[];
  durationMs: number;
}

/**
 * Run the full agency cycle:
 * 1. Fetch from all sources (SEC + Fed RSS + World Bank)
 * 2. For each event: save raw → generate draft → publish
 * 3. Self-throttle to 10/hour
 */
export async function runAgencyCycle(since: Date): Promise<AgencyRunResult> {
  const startTime = Date.now();
  const result: AgencyRunResult = {
    fetched: 0,
    drafted: 0,
    published: 0,
    failed: 0,
    duplicates: 0,
    sources: [],
    durationMs: 0,
  };

  console.log('\n═══ Agency Service — Cycle Start ═══');
  console.log(`Since: ${since.toISOString()}`);

  // V1108: Run cleanup at the START of the cycle (not just end)
  // This ensures cleanup runs even if the cycle times out
  await cleanupOldAgencyEvents();

  // Step 1: Collect DB digests FIRST (priority — internal data is the exclusive angle)
  console.log('\n[1/3] Collecting DB digests (priority)...');
  const dbDigestResults = await Promise.allSettled([
    collectStockDigests(),
    collectMarketAnalysisDigests(),
    collectMarketsWrap(),
    collectEconomicEvents(),
    collectGeoDigests(),
    collectCryptoDigests(),
    collectFXDigests(),
  ]);

  const allRawEvents: RawEvent[] = [];
  const digestLabels = ['StockDigests', 'MarketAnalysisDigests', 'MarketsWrap', 'GeoDigests', 'CryptoDigests', 'FXDigests', 'EconEvents'];
  for (let i = 0; i < dbDigestResults.length; i++) {
    const r = dbDigestResults[i];
    if (r.status === 'fulfilled') {
      console.log(`  ${digestLabels[i]}: ${r.value.length} events`);
      allRawEvents.push(...r.value);
      result.sources.push({
        source: digestLabels[i],
        events: r.value.length,
        errors: 0,
        durationMs: 0,
      });
    } else {
      console.warn(`  ${digestLabels[i]} failed: ${r.reason?.message?.slice(0, 80)}`);
    }
  }

  // Step 1b: Fetch from external sources (RSS + APIs)
  console.log('\n[1b/3] Fetching from external sources...');
  const fetchResults = await Promise.allSettled([
    // V1127: Use 72h window for official RSS (official sources publish 1-3x/week, not daily)
    fetchOfficialRSS(new Date(Date.now() - 168 * 60 * 60 * 1000)),
    fetchSECEDGAR(since),
    fetchWorldBank(since),
    fetchFRED(since),
    fetchBLS(since),
    fetchEIA(since),
    fetchCensus(since),
  ]);

  // Process external source results
  for (const fetchResult of fetchResults) {
    if (fetchResult.status === 'fulfilled') {
      const r: FetchResult = fetchResult.value;
      console.log(`  ${r.source}: ${r.events.length} events, ${r.errors.length} errors, ${r.durationMs}ms`);
      allRawEvents.push(...r.events);
      result.sources.push({
        source: r.source,
        events: r.events.length,
        errors: r.errors.length,
        durationMs: r.durationMs,
      });
    } else {
      console.warn(`  External fetch failed: ${fetchResult.reason?.message?.slice(0, 80)}`);
    }
  }

  result.fetched = allRawEvents.length;
  console.log(`  Total raw events: ${allRawEvents.length}`);

  if (allRawEvents.length === 0) {
    result.durationMs = Date.now() - startTime;
    console.log('\n═══ No events to process — cycle complete ═══');
    return result;
  }

  // Step 2: Process each event (fetch → draft → publish)
  console.log('\n[2/3] Processing events...');

  for (const event of allRawEvents) {
    // Self-throttle check
    const canPublish = await canPublishThisHour();
    if (!canPublish) {
      console.log('  Hourly publish limit reached — stopping cycle');
      break;
    }

    // V1148: Pre-LLM dedup check — skip if event is duplicate of recently published article.
    // This saves an expensive LLM call when we can predict the article would be rejected as duplicate.
    try {
      const { isDuplicateEvent } = await import('./dedup');
      const dedupCheck = await isDuplicateEvent(event);
      if (dedupCheck.duplicate) {
        result.duplicates++;
        console.log(`  ↔ Pre-LLM dedup: ${event.title.slice(0, 50)} — ${dedupCheck.reason}`);
        // V1161: Do NOT create a duplicate record in agency_events — this was causing DB bloat.
        // The old code created a new agency_events row for EVERY duplicate, adding ~15K rows/day.
        // Now we just skip the event silently (the dedup log is enough for debugging).
        continue;
      }
    } catch (dedupErr: any) {
      // If dedup check fails (e.g., DB error), allow event through (fail-open)
      console.warn(`[Agency] Pre-LLM dedup check failed, allowing event: ${dedupErr.message?.slice(0, 80)}`);
    }

    // V1206: 24h symbol dedup
    try {
      const stockMatch = event.externalId.match(/^stock-([A-Z.]+)-/);
      if (stockMatch) {
        const symbol = stockMatch[1];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentPub = await db.newsItem.findFirst({
          where: {
            publishedAt: { gte: oneDayAgo },
            OR: [{ titleAr: { contains: symbol } }, { title: { contains: symbol } }],
          },
          select: { id: true },
        });
        if (recentPub) {
          result.duplicates++;
          console.log(`  V1206 24h dedup: ${symbol} already published`);
          continue;
        }
      }
    } catch {}

    // Save raw event (dedup on sourceId+externalId)
    const agencyEventId = await saveRawEvent(event);
    if (!agencyEventId) {
      result.duplicates++;
      continue;
    }

    // Generate draft (generateDraft saves specific error to lastError)
    const draft = await generateDraft(event, agencyEventId);
    if (!draft) {
      // generateDraft already set lastError with specific reason
      // Just mark status as failed and increment retryCount
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: {
            status: 'failed',
            retryCount: { increment: 1 },
          },
        });
      } catch {}
      result.failed++;
      continue;
    }
    result.drafted++;

    // Save draft
    await saveDraft(agencyEventId, draft);

    // V1134+V1194: FINAL CHECK before publishing — reject ONLY $-hash corruption.
    // V1194: Relaxed minimum length from 100 to 30 chars. Some valid articles with
    // concise fullContent (e.g., market summaries) were being rejected. Still
    // catch $-hash corruption ($28, $2a, $29).
    const finalContent = draft.fullContent || draft.draftBody || '';
    if (!finalContent || finalContent.trim().length < 30 || finalContent.trim().startsWith('$')) {
      console.error(`[Agency V1134] Rejecting before publish — content invalid: "${finalContent.slice(0, 50)}" (len=${finalContent.length})`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: {
            status: 'failed',
            retryCount: { increment: 1 },
            lastError: `V1134 orchestrator: content invalid (len=${finalContent.length}, starts=$, preview=${finalContent.slice(0, 50)})`,
          },
        });
      } catch {}
      result.failed++;
      continue;
    }

    // Also check draft.draftBody for $-hash
    if (draft.draftBody && draft.draftBody.trim().startsWith('$') && draft.draftBody.trim().length < 50) {
      console.error(`[Agency] V1134: draftBody is hash: "${draft.draftBody.slice(0, 30)}"`);
      try {
        await db.agencyEvent.update({
          where: { id: agencyEventId },
          data: {
            status: 'failed',
            retryCount: { increment: 1 },
            lastError: `V1134: draftBody is hash: ${draft.draftBody.slice(0, 30)}`,
          },
        });
      } catch {}
      result.failed++;
      continue;
    }

    // Publish
    const publishResult = await publishArticle(agencyEventId, event, draft);
    if (publishResult.success) {
      result.published++;
      console.log(`  ✓ Published: ${draft.draftTitle.slice(0, 60)}...`);
    } else if (publishResult.duplicate) {
      result.duplicates++;
      console.log(`  ↔ Duplicate: ${draft.draftTitle.slice(0, 60)}...`);
    } else {
      result.failed++;
      console.warn(`  ✗ Publish failed: ${publishResult.reason}`);
    }
  }

  // Step 3: Summary
  result.durationMs = Date.now() - startTime;
  console.log('\n[3/3] Cycle Summary:');
  console.log(`  Fetched: ${result.fetched}`);
  console.log(`  Drafted: ${result.drafted}`);
  console.log(`  Published: ${result.published}`);
  console.log(`  Duplicates: ${result.duplicates}`);
  console.log(`  Failed: ${result.failed}`);
  console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
  console.log('═══ Agency Service — Cycle End ═══\n');

  // Step 4: Cleanup old events to prevent DB bloat
  await cleanupOldAgencyEvents();

  return result;
}

/**
 * Disconnect Prisma client (for graceful shutdown).
 */
export async function disconnectAgency(): Promise<void> {
  // no-op — shared db instance
}

// V1096: Clean up old agency_events to prevent DB bloat
async function cleanupOldAgencyEvents(): Promise<void> {
  try {
    // V1161: Delete ALL agency_events older than 24 hours, regardless of status.
    // V4 stock-digests generates 126 events/cycle × 144 cycles/day = 18,144 events/day.
    // Each event has ~5KB of rawContent + internalContext = ~90MB/day.
    // In 6 days this caused 2GB DB growth. The old cleanup only deleted
    // 'failed' (24h) and 'published' (7d), leaving 'fetched' and 'drafted'
    // events to accumulate forever.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete ALL events older than 24h (failed, fetched, drafted, published)
    const deleted = await db.agencyEvent.deleteMany({
      where: {
        createdAt: { lt: oneDayAgo },
      },
    });
    if (deleted.count > 0) {
      console.log(`[Agency V1161] Cleaned up ${deleted.count} old events (all statuses, older than 24h)`);
    }
  } catch (err: any) {
    console.warn(`[Agency V1161] Cleanup failed: ${err.message?.slice(0, 80)}`);
  }
}

