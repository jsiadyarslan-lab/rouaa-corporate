// ═══════════════════════════════════════════════════════════════
// Video Script Engine — LLM-powered report → structured scenes
//
// Uses the project's AI provider chain (chatCompletion from @/lib/ai-provider)
// instead of z-ai directly. This works on Railway because all providers
// (Bedrock Claude, Gemini, OpenRouter, Grok, GLM) are already configured
// via existing env vars.
//
// Pipeline:
//   report → pre-compute N → LLM batch generate → per-scene validate+repair
//         → duration check → shorten if needed → final scenes array
//
// Design principles:
//   1. N calculated programmatically (NOT by LLM)
//   2. duration calculated programmatically (NOT by LLM)
//   3. motionDirection derived from sceneType (NOT by LLM)
//   4. narrationText ≠ displayText (enforced)
//   5. Per-scene repair, not batch retry
//   6. One retry max on batch failure
//   7. imagePrompts: SUBJECT + ACTION + COMPOSITION + LIGHTING/MOOD + MOTION
// ═══════════════════════════════════════════════════════════════

import { chatCompletion } from './ai-provider';
import type { ChatMessage } from './ai-provider';

// ═══ Types ═══
export type SceneType = 'hook' | 'context' | 'data' | 'impact' | 'resolution';
export type MotionDirection = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'static';

export interface VideoScene {
  id: number;
  sceneTitle: string;
  sceneType: SceneType;
  narrationText: string;
  displayText: string;
  imagePrompt: string;
  motionDirection: MotionDirection;
  duration: number;
  placeholder?: boolean;
}

export interface VideoScriptResult {
  success: boolean;
  scenes?: VideoScene[];
  N?: number;
  totalDuration?: number;
  brokenCount?: number;
  action?: string;
  elapsed?: number;
  error?: string;
}

// ═══ Config ═══
const WORD_BUDGET: Record<string, { min: number; max: number }> = {
  ar: { min: 20, max: 35 },
  en: { min: 25, max: 50 },
  fr: { min: 25, max: 50 },
  tr: { min: 25, max: 50 },
  es: { min: 25, max: 50 },
};

const WORDS_PER_SECOND: Record<string, number> = {
  ar: 2.0,
  en: 2.5,
  fr: 2.5,
  tr: 2.5,
  es: 2.5,
};

const MOTION_MAP: Record<SceneType, MotionDirection> = {
  hook: 'zoom-in',
  context: 'pan-right',
  data: 'static',
  impact: 'zoom-in',
  resolution: 'zoom-out',
};

const MIN_TOTAL_DURATION = 45;
const MAX_TOTAL_DURATION = 130;
const SHORTEN_FACTOR = 0.7;
const BROKEN_RATIO_THRESHOLD = 0.3;

// ═══ Utilities ═══
function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function stripMarkdown(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSceneCount(content: string): number {
  const words = countWords(content);
  if (words < 800) return 4 + Math.floor(words / 200);
  if (words < 2000) return 6 + Math.floor((words - 800) / 400);
  return 8 + Math.min(2, Math.floor((words - 2000) / 800));
}

function calculateDuration(narrationText: string, lang: string): number {
  const words = countWords(narrationText);
  const wps = WORDS_PER_SECOND[lang] || WORDS_PER_SECOND.ar;
  return Math.ceil(words / wps) + 1;
}

function autoTruncate(narrationText: string, displayText: string): string {
  const narrationWords = countWords(narrationText);
  const targetCount = Math.max(3, Math.round(0.4 * narrationWords));
  const displayWords = String(displayText).trim().split(/\s+/).filter(Boolean);
  if (displayWords.length <= targetCount) return displayWords.join(' ');
  return displayWords.slice(0, targetCount).join(' ') + '…';
}

function deriveMotion(sceneType: SceneType): MotionDirection {
  return MOTION_MAP[sceneType] || 'static';
}

function extractJSON(text: string): any {
  if (!text) return null;
  let cleaned = String(text).trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try { return JSON.parse(cleaned); } catch {}
  const firstBrace = cleaned.indexOf('[');
  const lastBrace = cleaned.lastIndexOf(']');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); } catch {}
  }
  const firstCurly = cleaned.indexOf('{');
  const lastCurly = cleaned.lastIndexOf('}');
  if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
    try { return JSON.parse(cleaned.slice(firstCurly, lastCurly + 1)); } catch {}
  }
  return null;
}

// ═══ Prompt Builders ═══
function buildSystemPrompt(N: number, lang: string, budget: { min: number; max: number }): string {
  const langName: Record<string, string> = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' };
  const langLabel = langName[lang] || 'Arabic';

  return `You are a senior news video editor. Convert the report into exactly ${N} cinematic scenes for a ${langLabel} financial news video.

CRITICAL: ALL output fields (sceneTitle, narrationText, displayText) MUST be in ${langLabel}. Translate if needed. imagePrompt is always English.

OUTPUT: strict JSON array of ${N} scene objects. No prose, no markdown fences.

SCHEMA per scene:
{
  "id": <1-indexed integer>,
  "sceneTitle": "<3-7 words, ${langLabel}>",
  "sceneType": "<hook|context|data|impact|resolution>",
  "narrationText": "<${budget.min}-${budget.max} words, ${langLabel}>",
  "displayText": "<≤40% of narrationText length, bullets separated by |>",
  "imagePrompt": "<ENGLISH, 25-50 words, ABSTRACT financial scene, NO PEOPLE, NO FACES>"
}

IMAGE PROMPT RULES (CRITICAL):
- Subject MUST be: buildings, skylines, charts, graphs, gold bars, coins, currency, market scenes, technology, data visualizations, abstract concepts
- FORBIDDEN: people, faces, humans, persons, women, men, characters, portraits, crowds
- FORBIDDEN: text, words, letters, numbers, UI, screenshots, watermarks
- Style: cinematic, dark, dramatic lighting, photorealistic, vertical composition
- Example: "golden gold bars stacked in dramatic lighting, dark background, cinematic, photorealistic, no people, no text"

RULES:
1. Scene #1 = hook, Scene #${N} = resolution. Middle = context/data/impact.
2. narrationText ≠ displayText (never repeat).

Output ONLY valid JSON array.`;
}

function buildUserPrompt(report: any, N: number, lang: string): string {
  const parts: string[] = [];
  parts.push(`REPORT TITLE: ${report.title || '(untitled)'}`);
  if (report.summary) parts.push(`SUMMARY: ${report.summary}`);
  if (report.locale) parts.push(`LANGUAGE: ${report.locale}`);
  if (report.market_impact) parts.push(`MARKET IMPACT: ${report.market_impact}`);

  if (Array.isArray(report.stats) && report.stats.length) {
    parts.push(`KEY STATS:\n${report.stats.map((s: any) => `- ${s.label}: ${s.value} (${s.description || ''})`).join('\n')}`);
  }
  if (Array.isArray(report.key_points) && report.key_points.length) {
    parts.push(`KEY POINTS:\n${report.key_points.map((p: string) => `- ${p}`).join('\n')}`);
  }
  if (Array.isArray(report.root_causes) && report.root_causes.length) {
    parts.push(`ROOT CAUSES:\n${report.root_causes.map((c: any) => `- ${c.title}: ${c.description}`).join('\n')}`);
  }
  if (Array.isArray(report.scenarios) && report.scenarios.length) {
    parts.push(`SCENARIOS:\n${report.scenarios.map((s: any) => `- ${s.title} (${s.probability}): ${s.result}`).join('\n')}`);
  }
  if (Array.isArray(report.benefiting_assets) && report.benefiting_assets.length) {
    parts.push(`BENEFITING ASSETS: ${report.benefiting_assets.map((a: any) => `${a.name} (${a.symbol})`).join(', ')}`);
  }
  if (Array.isArray(report.harmed_assets) && report.harmed_assets.length) {
    parts.push(`HARMED ASSETS: ${report.harmed_assets.map((a: any) => `${a.name} (${a.symbol})`).join(', ')}`);
  }
  if (Array.isArray(report.recommendations) && report.recommendations.length) {
    parts.push(`RECOMMENDATIONS:\n${report.recommendations.map((r: any) => `- ${r.asset}: ${r.action}${r.entry ? ` (entry: ${r.entry}${r.stopLoss ? ', SL: ' + r.stopLoss : ''}${r.target ? ', TP: ' + r.target : ''})` : ''}`).join('\n')}`);
  }
  if (report.content) {
    parts.push(`FULL CONTENT:\n${report.content}`);
  }

  parts.push(`\n---\nTASK: Convert this report into exactly ${N} cinematic scenes as a JSON array. Remember: scene #1 = hook, scene #${N} = resolution. Use the priority rules.`);

  return parts.join('\n\n');
}

function buildRepairPrompt(scene: any, reason: string, lang: string, budget: { min: number; max: number }): string {
  const langName: Record<string, string> = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' };
  const langLabel = langName[lang] || 'Arabic';

  let constraint = '';
  if (reason === 'narration_equals_display') {
    constraint = `CRITICAL: displayText must be ≤40% of narrationText length AND use bullet points or numbers (not prose). narrationText and displayText must NOT be similar.`;
  } else if (reason === 'too_short') {
    constraint = `CRITICAL: narrationText must be at least ${budget.min} words.`;
  } else if (reason === 'too_long') {
    constraint = `CRITICAL: narrationText must be at most ${budget.max} words.`;
  } else if (reason === 'missing_field') {
    constraint = `CRITICAL: All 5 fields (sceneTitle, sceneType, narrationText, displayText, imagePrompt) must be present and non-empty.`;
  } else if (reason === 'generic_title') {
    constraint = `CRITICAL: sceneTitle is generic/placeholder. Replace with a punchy journalistic title (2-7 words) that reflects THIS scene's content. FORBIDDEN: "المشهد N", "Scene N", "الجزء N", "تحليل", "مقدمة". Example: "ارتفاع الذهب 8%", "توصية: شراء", "السيناريو الأسود".`;
  }

  return `Rewrite scene #${scene.id} of a ${langLabel} financial news video.

CURRENT (broken) SCENE:
${JSON.stringify(scene, null, 2)}

REASON FOR REPAIR: ${reason}
${constraint}

Output ONLY a single JSON object (not an array) with the same schema:
{
  "id": ${scene.id},
  "sceneTitle": "...",
  "sceneType": "${scene.sceneType}",
  "narrationText": "...",
  "displayText": "...",
  "imagePrompt": "..."
}

Keep sceneType unchanged. Keep imagePrompt in English. Output JSON only.`;
}

function buildShortenPrompt(scene: any, lang: string): string {
  const langName: Record<string, string> = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' };
  const langLabel = langName[lang] || 'Arabic';
  const currentWords = countWords(scene.narrationText);
  const targetWords = Math.round(currentWords * SHORTEN_FACTOR);

  return `Rewrite the narrationText for this ${langLabel} video scene. Target: ${targetWords} words (30% shorter).

CURRENT SCENE:
${JSON.stringify({
  id: scene.id,
  sceneTitle: scene.sceneTitle,
  sceneType: scene.sceneType,
  narrationText: scene.narrationText,
}, null, 2)}

RULES:
- Rewrite ONLY narrationText. DO NOT change sceneTitle, sceneType, displayText, or imagePrompt.
- Keep ALL facts and numbers. Remove only adjectives, elaboration, and filler.
- Keep the same language (${langLabel}).
- Target length: ${targetWords} words (±5).

Output ONLY a JSON object: {"narrationText": "..."}`;
}

// ═══ LLM Call (uses project's chatCompletion) ═══
async function callLLM(systemPrompt: string, userPrompt: string, locale: string, label: string = 'llm'): Promise<string> {
  const t0 = Date.now();
  console.log(`  [LLM:${label}] calling chatCompletion (locale=${locale})...`);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const result = await chatCompletion(messages, {
      temperature: 0.4,
      maxTokens: 4000,
      maxRetries: 3,
      priority: 'generation',
      locale: locale as any,
      allowFallback: true,
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (!result || !result.content || result.content.trim().length === 0) {
      console.error(`  [LLM:${label}] ✗ empty content after ${elapsed}s (provider: ${result?.provider || 'unknown'})`);
      return '';
    }
    console.log(`  [LLM:${label}] ✓ ${elapsed}s via ${result.provider}/${result.model}, ${countWords(result.content)} words returned`);
    return result.content;
  } catch (err: any) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.error(`  [LLM:${label}] ✗ failed after ${elapsed}s: ${err.message?.slice(0, 200)}`);
    return '';
  }
}

// ═══ Validation ═══
function validateScene(scene: any, lang: string, budget: { min: number; max: number }): string[] {
  const issues: string[] = [];

  if (!scene.sceneTitle || !String(scene.sceneTitle).trim()) issues.push('missing_field');
  if (!scene.sceneType || !['hook', 'context', 'data', 'impact', 'resolution'].includes(scene.sceneType)) issues.push('missing_field');
  if (!scene.narrationText || !String(scene.narrationText).trim()) issues.push('missing_field');
  if (!scene.displayText || !String(scene.displayText).trim()) issues.push('missing_field');
  if (!scene.imagePrompt || !String(scene.imagePrompt).trim()) issues.push('missing_field');

  if (issues.length) return issues;

  const titleStr = String(scene.sceneTitle).trim();
  const genericPatterns = [
    /^المشهد\s*\d+/i, /^Scene\s*\d+/i, /^الجزء\s/i, /^Part\s/i,
    /^القسم\s/i, /^Section\s/i, /^مشهد\s*\d+/, /^تحليل$/, /^Analysis$/i,
    /^مقدمة$/, /^Introduction$/i, /^خاتمة$/, /^Conclusion$/i,
  ];
  if (genericPatterns.some(re => re.test(titleStr))) issues.push('generic_title');
  if (countWords(titleStr) < 2) issues.push('generic_title');

  const nWords = countWords(scene.narrationText);
  if (nWords < budget.min) issues.push('too_short');
  if (nWords > budget.max) issues.push('too_long');

  const nNorm = stripMarkdown(scene.narrationText).toLowerCase();
  const dNorm = stripMarkdown(scene.displayText).toLowerCase();
  if (nNorm === dNorm) issues.push('narration_equals_display');
  if (nNorm.length > 0 && dNorm.length > 0) {
    const shorter = Math.min(nNorm.length, dNorm.length);
    const longer = Math.max(nNorm.length, dNorm.length);
    if (shorter / longer > 0.8 && (nNorm.includes(dNorm) || dNorm.includes(nNorm))) {
      issues.push('narration_equals_display');
    }
  }

  return issues;
}

// ═══ Per-scene Repair ═══
async function repairScene(scene: any, lang: string, budget: { min: number; max: number }, attempt: number = 1): Promise<{ scene: any; placeholder?: boolean; reason?: string }> {
  const issues = validateScene(scene, lang, budget);
  if (!issues.length) return { scene };

  const reason = issues[0];
  console.log(`  [Engine] Scene #${scene.id} needs repair: ${reason} (attempt ${attempt})`);

  if (attempt > 2) {
    console.warn(`  [Engine] Scene #${scene.id} giving up after ${attempt - 1} repairs → placeholder`);
    return {
      scene: {
        id: scene.id,
        sceneTitle: scene.sceneTitle || `المشهد ${scene.id}`,
        sceneType: scene.sceneType || 'context',
        narrationText: scene.narrationText || 'المشهد غير متاح مؤقتاً.',
        displayText: scene.displayText || '—',
        imagePrompt: scene.imagePrompt || 'dark abstract background, cinematic, no text',
        placeholder: true,
      },
      placeholder: true,
      reason,
    };
  }

  const prompt = buildRepairPrompt(scene, reason, lang, budget);
  const raw = await callLLM('You are a video script repair editor. Fix the broken scene.', prompt, lang, `repair-${scene.id}`);

  if (!raw) {
    if (reason === 'narration_equals_display') {
      const fixedDisplay = autoTruncate(scene.narrationText, scene.narrationText);
      const fixedScene = { ...scene, displayText: fixedDisplay };
      return repairScene(fixedScene, lang, budget, attempt + 1);
    }
    return repairScene(scene, lang, budget, attempt + 1);
  }

  const repaired = extractJSON(raw);
  if (!repaired || typeof repaired !== 'object') {
    return repairScene(scene, lang, budget, attempt + 1);
  }

  const merged = { ...scene, ...repaired, id: scene.id };
  merged.sceneTitle = stripMarkdown(merged.sceneTitle);
  merged.narrationText = stripMarkdown(merged.narrationText);
  merged.displayText = stripMarkdown(merged.displayText);

  const stillIssues = validateScene(merged, lang, budget);
  if (stillIssues.includes('narration_equals_display')) {
    merged.displayText = autoTruncate(merged.narrationText, merged.displayText);
  }

  return repairScene(merged, lang, budget, attempt + 1);
}

async function shortenScene(scene: any, lang: string): Promise<any> {
  console.log(`  [Engine] Shortening scene #${scene.id} (currently ${countWords(scene.narrationText)} words)`);
  const prompt = buildShortenPrompt(scene, lang);
  const raw = await callLLM('You are a video script editor. Shorten the narration.', prompt, lang, `shorten-${scene.id}`);
  if (!raw) return scene;

  const parsed = extractJSON(raw);
  if (!parsed || !parsed.narrationText) return scene;

  const shortened = stripMarkdown(parsed.narrationText);
  if (countWords(shortened) < countWords(scene.narrationText)) {
    return { ...scene, narrationText: shortened };
  }
  return scene;
}

// ═══ Post-processing ═══
function postProcessScenes(scenes: any[], lang: string): VideoScene[] {
  return scenes.map((scene, idx) => {
    const id = idx + 1;
    let displayText = stripMarkdown(scene.displayText || '');
    
    // Fix 1: Remove duplicate items in displayText (e.g. "الأسهم|الأسهم" → "الأسهم")
    const items = displayText.split(/\s*[|›]\s*/).map(s => s.trim()).filter(s => s.length > 0);
    const uniqueItems = [...new Set(items)]; // deduplicate
    displayText = uniqueItems.join(' | ');
    
    // Fix 2: If displayText is empty, use first sentence of narrationText
    if (!displayText || displayText.length < 3) {
      const firstSentence = stripMarkdown(scene.narrationText || '').split(/[.।!؟?]/)[0];
      displayText = firstSentence ? firstSentence.trim() : '';
    }
    
    const cleaned: VideoScene = {
      id,
      sceneTitle: stripMarkdown(scene.sceneTitle || `المشهد ${id}`),
      sceneType: (scene.sceneType || 'context') as SceneType,
      narrationText: stripMarkdown(scene.narrationText || ''),
      displayText,
      imagePrompt: (scene.imagePrompt || 'cinematic background, no text').trim(),
      motionDirection: deriveMotion((scene.sceneType || 'context') as SceneType),
      duration: 0,
    };
    cleaned.duration = calculateDuration(cleaned.narrationText, lang);
    if (scene.placeholder) cleaned.placeholder = true;
    return cleaned;
  });
}

// ═══ Batch Generation ═══
async function generateScenesBatch(report: any, lang: string, isRetry: boolean = false): Promise<{ scenes: any[] | null; N: number; error?: string }> {
  const content = report.content || [report.summary, ...(report.key_points || []), ...(report.stats || []).map((s: any) => `${s.label}: ${s.value}`)].join(' ');
  const N = calculateSceneCount(content);
  const budget = WORD_BUDGET[lang] || WORD_BUDGET.ar;

  console.log(`\n[Engine] Batch generate: N=${N}, lang=${lang}, budget=${budget.min}-${budget.max} words/scene${isRetry ? ' (RETRY)' : ''}`);

  const systemPrompt = buildSystemPrompt(N, lang, budget);
  const userPrompt = buildUserPrompt(report, N, lang);

  const raw = await callLLM(systemPrompt, userPrompt, lang, 'batch');
  if (!raw) {
    console.error('[Engine] Batch LLM returned empty.');
    return { scenes: null, N, error: 'empty_response' };
  }

  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed)) {
    console.error('[Engine] Batch LLM did not return a JSON array.');
    console.error('[Engine] Raw (first 500 chars):', raw.slice(0, 500));
    return { scenes: null, N, error: 'invalid_json' };
  }

  console.log(`[Engine] Batch returned ${parsed.length} scenes (target was ${N})`);
  return { scenes: parsed, N };
}

// ═══ Deterministic Fallback (no LLM — used when all providers fail) ═══
// Generates basic scenes directly from the report content.
// Quality is lower than LLM-generated, but the video will still render.
function generateDeterministicScenes(report: any, lang: string): any[] {
  console.log('[Engine] Deterministic fallback — extracting content directly from report');

  const langName: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français', tr: 'Türkçe', es: 'Español' };
  const langLabel = langName[lang] || 'Arabic';

  // Extract key facts from report
  const title = report.title || 'Financial Report';
  const summary = report.summary || '';
  const content = report.content || '';

  // Parse stats from content (look for patterns like "X: Y%" or "X: Y")
  const statPattern = /([A-Za-z\u0600-\u06FF\s]{3,30}):\s*([+\-]?[\d.]+%?)/g;
  const stats: { label: string; value: string }[] = [];
  let match;
  while ((match = statPattern.exec(content)) !== null && stats.length < 5) {
    stats.push({ label: match[1].trim(), value: match[2] });
  }

  // Parse benefiting/harmed assets
  const benefiting = report.benefiting_assets || [];
  const harmed = report.harmed_assets || [];

  // Parse recommendations
  const recommendations = report.recommendations || [];

  // Build 5 scenes: hook → context → data → impact → resolution
  const scenes: any[] = [];

  // Scene 1: HOOK — title + first stat
  const hookStat = stats[0] || { label: '', value: '' };
  scenes.push({
    id: 1,
    sceneTitle: title.slice(0, 60),
    sceneType: 'hook',
    narrationText: `${title}. ${summary ? summary.slice(0, 200) + '.' : ''} ${hookStat.label ? `${hookStat.label}: ${hookStat.value}.` : ''}`.trim().slice(0, 300),
    displayText: hookStat.value ? `${hookStat.label}: ${hookStat.value}` : title.slice(0, 40),
    imagePrompt: `financial market scene, dramatic lighting, cinematic, professional, dark background, no text, no words, no letters, vertical portrait composition, photorealistic`,
  });

  // Scene 2: CONTEXT — summary
  const contextText = summary || content.slice(0, 300);
  scenes.push({
    id: 2,
    sceneTitle: lang === 'ar' ? 'السياق' : lang === 'fr' ? 'Contexte' : lang === 'tr' ? 'Bağlam' : lang === 'es' ? 'Contexto' : 'Context',
    sceneType: 'context',
    narrationText: contextText.slice(0, 250),
    displayText: contextText.slice(0, 100).split(/[.।!؟?]/)[0],
    imagePrompt: `financial analysis dashboard, charts and graphs, professional, cinematic, dark background, no text, no words, no letters, vertical portrait composition, photorealistic`,
  });

  // Scene 3: DATA — stats
  const dataStats = stats.slice(0, 4);
  const dataNarration = dataStats.length > 0
    ? dataStats.map(s => `${s.label}: ${s.value}`).join('. ')
    : (content.slice(0, 200) || 'Key market data.');
  scenes.push({
    id: 3,
    sceneTitle: lang === 'ar' ? 'الأرقام' : lang === 'fr' ? 'Chiffres' : lang === 'tr' ? 'Rakamlar' : lang === 'es' ? 'Números' : 'Numbers',
    sceneType: 'data',
    narrationText: dataNarration.slice(0, 250),
    displayText: dataStats.map(s => `${s.label}: ${s.value}`).join(' | '),
    imagePrompt: `stock market data visualization, charts, numbers, professional, cinematic, dark background, no text, no words, no letters, vertical portrait composition, photorealistic`,
  });

  // Scene 4: IMPACT — benefiting/harmed
  const benList = benefiting.map((a: any) => a.name || a).slice(0, 3);
  const harList = harmed.map((a: any) => a.name || a).slice(0, 3);
  const impactNarration = benList.length > 0 || harList.length > 0
    ? `${lang === 'ar' ? 'يستفيد' : 'Benefiting'}: ${benList.join(', ') || '—'}. ${lang === 'ar' ? 'يتضرر' : 'Harmed'}: ${harList.join(', ') || '—'}.`
    : content.slice(200, 400) || 'Market impact analysis.';
  scenes.push({
    id: 4,
    sceneTitle: lang === 'ar' ? 'التأثير' : lang === 'fr' ? 'Impact' : lang === 'tr' ? 'Etki' : lang === 'es' ? 'Impacto' : 'Impact',
    sceneType: 'impact',
    narrationText: impactNarration.slice(0, 250),
    displayText: `يستفيد: ${benList.join(', ') || '—'} | يتضرر: ${harList.join(', ') || '—'}`,
    imagePrompt: `market impact visualization, up and down arrows, stocks, professional, cinematic, dark background, no text, no words, no letters, vertical portrait composition, photorealistic`,
  });

  // Scene 5: RESOLUTION — recommendations
  const recText = recommendations.length > 0
    ? recommendations.map((r: any) => `${r.asset || r.name}: ${r.action || 'hold'}`).join('. ')
    : (lang === 'ar' ? 'يُنصح بمراقبة السوق وتنويع المحفظة.' : 'Monitor the market and diversify your portfolio.');
  scenes.push({
    id: 5,
    sceneTitle: lang === 'ar' ? 'التوصية' : lang === 'fr' ? 'Action' : lang === 'tr' ? 'Eylem' : lang === 'es' ? 'Acción' : 'Action',
    sceneType: 'resolution',
    narrationText: recText.slice(0, 250),
    displayText: recommendations.length > 0
      ? recommendations.map((r: any) => `${r.asset}: ${r.action}`).join(' | ')
      : (lang === 'ar' ? 'تنويع المحفظة | مراقبة السوق' : 'Diversify | Monitor'),
    imagePrompt: `investment strategy concept, portfolio, growth, professional, cinematic, dark background, no text, no words, no letters, vertical portrait composition, photorealistic`,
  });

  return scenes;
}

// ═══ Main Orchestrator ═══
export async function generateVideoScript(report: any, options: { lang?: string } = {}): Promise<VideoScriptResult> {
  const lang = report.locale || options.lang || 'ar';
  const startTime = Date.now();
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[Engine] START — title: "${report.title?.slice(0, 50)}..." | lang: ${lang}`);
  console.log(`${'═'.repeat(70)}`);

  let { scenes: rawScenes, N, error } = await generateScenesBatch(report, lang);

  if (!rawScenes) {
    console.warn(`[Engine] Batch failed (error: ${error}) → retrying once`);
    const retry = await generateScenesBatch(report, lang, true);
    rawScenes = retry.scenes;
    if (!rawScenes) {
      console.error(`[Engine] Batch retry also failed (first: ${error}, retry: ${retry.error})`);
      console.warn(`[Engine] Using DETERMINISTIC FALLBACK — generating scenes from report content without LLM`);
      rawScenes = generateDeterministicScenes(report, lang);
      if (!rawScenes || rawScenes.length === 0) {
        return { success: false, error: `batch_failed_twice (first: ${error}, retry: ${retry.error}) and deterministic fallback produced no scenes`, N };
      }
      console.log(`[Engine] Deterministic fallback generated ${rawScenes.length} scenes`);
    }
  }

  let scenes = postProcessScenes(rawScenes, lang);
  console.log(`\n[Engine] Post-processed ${scenes.length} scenes:`);
  scenes.forEach(s => {
    console.log(`  #${s.id} [${s.sceneType}/${s.motionDirection}] "${s.sceneTitle.slice(0, 40)}" — ${s.duration}s, ${countWords(s.narrationText)}w narration`);
  });

  console.log(`\n[Engine] Per-scene validation + repair:`);
  const budget = WORD_BUDGET[lang] || WORD_BUDGET.ar;
  const repairedScenes: any[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const result = await repairScene(scenes[i], lang, budget);
    repairedScenes.push(result.scene);
    if (result.placeholder) {
      console.warn(`  [Engine] Scene #${scenes[i].id} became PLACEHOLDER (reason: ${result.reason})`);
    }
  }
  scenes = postProcessScenes(repairedScenes, lang);

  // Duration validation
  let total = scenes.reduce((sum, s) => sum + s.duration, 0);
  console.log(`\n[Engine] Total duration: ${total}s (target: 45-130s)`);

  if (total > MAX_TOTAL_DURATION) {
    console.log(`[Engine] Over by ${total - MAX_TOTAL_DURATION}s → shortening longest scene`);
    let longestIdx = -1;
    let longestDur = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].placeholder) continue;
      if (scenes[i].duration > longestDur) {
        longestDur = scenes[i].duration;
        longestIdx = i;
      }
    }
    if (longestIdx >= 0) {
      scenes[longestIdx] = { ...scenes[longestIdx], narrationText: (await shortenScene(scenes[longestIdx], lang)).narrationText };
      scenes[longestIdx].duration = calculateDuration(scenes[longestIdx].narrationText, lang);
      console.log(`  [Engine] After shorten: ${scenes[longestIdx].duration}s (was ${longestDur}s)`);
    }
  }

  let action = 'accept';
  const brokenCount = scenes.filter(s => s.placeholder).length;
  if (total < MIN_TOTAL_DURATION) {
    if (brokenCount > scenes.length * BROKEN_RATIO_THRESHOLD) {
      action = 'batch_retry';
    } else {
      action = 'accept_short';
    }
  }

  total = scenes.reduce((sum, s) => sum + s.duration, 0);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`[Engine] DONE in ${elapsed}s`);
  console.log(`[Engine] Scenes: ${scenes.length} | Duration: ${total}s | Broken: ${brokenCount}`);
  console.log(`[Engine] Action: ${action}`);
  console.log(`${'─'.repeat(70)}\n`);

  return {
    success: true,
    scenes,
    N,
    totalDuration: total,
    brokenCount,
    action,
    elapsed: parseFloat(elapsed),
  };
}
