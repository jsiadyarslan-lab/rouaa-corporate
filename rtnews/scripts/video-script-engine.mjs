#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Video Script Engine — LLM-powered report → structured scenes
//
// Pipeline:
//   report → pre-compute N → LLM batch generate → per-scene validate+repair
//         → duration check → shorten/lengthen → final scenes JSON
//
// Design principles:
//   1. N calculated programmatically (NOT by LLM)
//   2. duration calculated programmatically (NOT by LLM)
//   3. motionDirection derived from sceneType (NOT by LLM)
//   4. narrationText ≠ displayText (enforced)
//   5. Per-scene repair, not batch retry
//   6. One retry max on batch failure
//   7. imagePrompts follow SUBJECT + ACTION + COMPOSITION + LIGHTING/MOOD structure
//   8. imagePrompts include MOTION cues (captured mid-action, dynamic)
// ═══════════════════════════════════════════════════════════════

import ZAI from 'z-ai-web-dev-sdk';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

// ═══ CONFIG ═══
const WORD_BUDGET = {
  ar: { min: 25, max: 50 },
  en: { min: 30, max: 65 },
  fr: { min: 30, max: 65 },
  tr: { min: 30, max: 65 },
  es: { min: 30, max: 65 },
};

const WORDS_PER_SECOND = {
  ar: 2.0,
  en: 2.5,
  fr: 2.5,
  tr: 2.5,
  es: 2.5,
};

const MOTION_MAP = {
  hook:       'zoom-in',
  context:    'pan-right',
  data:       'static',
  impact:     'zoom-in',
  resolution: 'zoom-out',
};

const MIN_TOTAL_DURATION = 45;
const MAX_TOTAL_DURATION = 130;
const SHORTEN_FACTOR = 0.7;
const BROKEN_RATIO_THRESHOLD = 0.3;

// ═══ UTILITIES ═══
function countWords(text) {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function stripMarkdown(text) {
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

function calculateSceneCount(content) {
  const words = countWords(content);
  if (words < 800) return 4 + Math.floor(words / 200);
  if (words < 2000) return 6 + Math.floor((words - 800) / 400);
  return 8 + Math.min(2, Math.floor((words - 2000) / 800));
}

function calculateDuration(narrationText, lang) {
  const words = countWords(narrationText);
  const wps = WORDS_PER_SECOND[lang] || WORDS_PER_SECOND.ar;
  return Math.ceil(words / wps) + 1;
}

function autoTruncate(narrationText, displayText) {
  const narrationWords = countWords(narrationText);
  const targetCount = Math.max(3, Math.round(0.4 * narrationWords));
  const displayWords = String(displayText).trim().split(/\s+/).filter(Boolean);
  if (displayWords.length <= targetCount) return displayWords.join(' ');
  return displayWords.slice(0, targetCount).join(' ') + '…';
}

function deriveMotion(sceneType) {
  return MOTION_MAP[sceneType] || 'static';
}

// ═══ LLM PROVIDER ═══
let _zaiInstance = null;
async function getZAI() {
  if (!_zaiInstance) _zaiInstance = await ZAI.create();
  return _zaiInstance;
}

function extractJSON(text) {
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

// ═══ PROMPT BUILDERS ═══
function buildSystemPrompt(N, lang, budget) {
  const langName = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' }[lang] || 'Arabic';
  const dir = lang === 'ar' ? 'RTL (right-to-left)' : 'LTR (left-to-right)';

  return `You are a senior news video editor for a financial news channel. You convert analytical reports into cinematic video scripts.

OUTPUT LANGUAGE: ${langName} (${dir}).
OUTPUT FORMAT: strict JSON array of exactly ${N} scene objects. No prose before or after the array.

SCHEMA (each scene object):
{
  "id": <integer, 1-indexed>,
  "sceneTitle": "<short title, 3-7 words, ${langName}>",
  "sceneType": "<one of: hook | context | data | impact | resolution>",
  "narrationText": "<what the voiceover reads, ${langName}, ${budget.min}-${budget.max} words, narrative prose>",
  "displayText": "<what appears on screen, ${langName}, ≤40% of narrationText length, bullet points or numbers NOT prose>",
  "imagePrompt": "<ENGLISH ONLY, see IMAGE PROMPT RULES below>"
}

MANDATORY RULES:
1. Scene #1 MUST have sceneType="hook" — opens with the triggering event, dramatic.
2. Scene #${N} MUST have sceneType="resolution" — final recommendation + CTA.
3. Middle scenes (2 to ${N-1}) use sceneType from: context, data, impact — in narrative order.
4. narrationText ≠ displayText. NEVER repeat the same text. narrationText = narrative prose for the ear. displayText = condensed visual cues for the eye (numbers, names, short phrases).
5. Each narrationText: between ${budget.min} and ${budget.max} words.
6. imagePrompt MUST be in ENGLISH, scene-specific (not generic). See full rules below.
7. Output ONLY valid JSON. No markdown fences, no commentary.

CONTENT PRIORITY (when space-constrained, KEEP first):
1. The triggering event (the hook)
2. The 2-3 biggest numbers in the report
3. Market impact (which assets benefit / suffer)
4. Final recommendation / call to action

DELETE FIRST (when space-constrained):
- Multiple scenarios → merge into one sentence
- Methodology, sources, references
- Multi-audience recommendations → keep only the primary audience
- Definitions and background explanations

QUALITY BAR:
- sceneTitle: punchy, journalistic, descriptive of THIS scene's content. NEVER use generic placeholders like "المشهد N", "Scene N", "الجزء N", "Part N", or just a number. Each sceneTitle must reflect what THAT scene actually says. Examples of GOOD titles: "انهيار الليرة", "ارتفاع الذهب 8%", "توصية: شراء", "السيناريو الأسود". Examples of BAD titles (FORBIDDEN): "المشهد 2", "Scene 3", "الجزء الثاني", "تحليل".
- narrationText: present-tense, active voice, dramatic but factual, like a Bloomberg anchor. Verify spelling of common Arabic financial words (يستفيد not يستفذ, الأسواق not الاسواق).
- displayText: use "|" to separate items, or "›" for bullets, or just numbers

═══════════════════════════════════════════════════════════════════════
IMAGE PROMPT RULES — CRITICAL (this is the most important field)
═══════════════════════════════════════════════════════════════════════

The imagePrompt is fed directly to an AI image generator (FLUX/SDXL). It MUST produce a cinematic, scene-specific image that feels like a still from a high-budget documentary — NOT a generic stock photo.

STRUCTURE (every imagePrompt MUST contain all 4 parts):
  [SUBJECT] + [ACTION/STATE] + [COMPOSITION] + [LIGHTING/MOOD]

PART 1 — SUBJECT (concrete, specific to THIS scene):
  ✓ GOOD: "a deep-sea mining robot collecting mineral nodules"
  ✓ GOOD: "stacks of gold bars in a vault with price ticker reflection"
  ✗ BAD: "something about the ocean"
  ✗ BAD: "financial concept"
  ✗ BAD: "abstract representation of growth"

PART 2 — ACTION/STATE (verb or descriptor that creates movement):
  ✓ GOOD: "the robot's mechanical arm reaching toward the seabed"
  ✓ GOOD: "gold bars glowing under warm light while numbers flicker"
  ✗ BAD: "is shown"
  ✗ BAD: "in a scene"

PART 3 — COMPOSITION (camera angle + framing):
  Pick ONE explicit option:
    - "extreme close-up shot" (for objects, hands, screens)
    - "close-up shot" (for faces, single objects)
    - "medium shot" (for people, action)
    - "wide shot" (for environments, scale)
    - "aerial drone view" (for geography, scope)
    - "low angle shot" (for power, dominance)
    - "high angle shot" (for vulnerability, overview)
    - "over-the-shoulder shot" (for involvement)

PART 4 — LIGHTING/MOOD (cinematic, specific):
  Lighting options:
    - "golden hour lighting" (warm, dramatic)
    - "blue hour lighting" (cold, tense)
    - "dramatic spotlight" (focused, intense)
    - "soft diffused lighting" (calm, professional)
    - "high-contrast chiaroscuro" (dramatic, dark)
    - "neon-lit" (modern, tech)
    - "natural overcast lighting" (documentary, real)
  Mood options:
    - "tense atmosphere" / "mysterious atmosphere" / "hopeful mood" / "urgent mood" / "somber mood" / "triumphant mood"

EXAMPLES OF GOOD imagePrompts:
✓ "A deep-sea mining robot's mechanical arm reaching toward manganese nodules on the dark ocean floor, extreme close-up shot, dramatic spotlight cutting through black water, tense atmosphere, photorealistic, 8k detail"
✓ "Stacks of gold bars in a Zurich bank vault with a glowing price ticker reflecting on their surface, close-up shot, warm golden hour lighting, hopeful mood, photorealistic"
✓ "A solitary trader's silhouette in front of massive stock market screens showing red downward arrows, wide shot, high-contrast chiaroscuro lighting, somber mood, cinematic"

FORBIDDEN in imagePrompt:
  ✗ Words: "something", "things", "abstract", "concept", "representation", "idea", "metaphor"
  ✗ Phrases: "is shown", "in a scene", "depicts", "represents"
  ✗ Text in image: NEVER ask for text, words, letters, numbers in the image itself
  ✗ People's faces: avoid detailed facial features (use silhouettes, back views, hands)
  ✗ Multiple subjects: one focal subject only
  ✗ Generic backgrounds: every element must be specified

LENGTH: 25-50 words. Longer is better than shorter. Every word must add visual information.

═══════════════════════════════════════════════════════════════════════
MOTION & DYNAMISM — CRITICAL (image must feel alive, not static)
═══════════════════════════════════════════════════════════════════════

The image will be used in a video with subtle motion (Ken Burns effect). But the IMAGE ITSELF must look like a frozen moment of action, NOT a posed still life.

MANDATORY MOTION CUES (pick at least ONE for every imagePrompt):
  - "captured mid-action" (subject in motion)
  - "dynamic composition with motion blur" (suggesting movement)
  - "frozen moment of action"
  - "subject in motion"
  - "active scene with implied movement"
  - "split-second capture"

AVOID STATIC CUES:
  ✗ "posed", "still life", "arranged", "displayed", "shown", "presented"

ADD SPECIFIC MOTION DETAILS based on scene type:
  - hook: "action frozen mid-moment", "intense activity", "rapid motion captured"
  - context: "ambient activity in background", "subtle movement of people/objects"
  - data: "numbers flickering", "screens refreshing", "live data update captured"
  - impact: "subject reacting to event", "consequence unfolding"
  - resolution: "forward-looking activity", "preparation for action"

SCENE-TYPE GUIDANCE:
  - hook: dramatic, visually striking, "the moment of crisis" — extreme close-up or aerial
  - context: environmental, "where this is happening" — wide shot or aerial
  - data: close-ups of objects/screens showing numbers, "the evidence"
  - impact: human element + consequence, "who is affected" — medium shot
  - resolution: forward-looking, hopeful or warning, "what to do next" — wide shot with light

ALWAYS END imagePrompt with: ", photorealistic, cinematic, high detail, no text, no words, no letters"`;
}

function buildUserPrompt(report, N, lang) {
  const parts = [];
  parts.push(`REPORT TITLE: ${report.title || '(untitled)'}`);
  if (report.summary) parts.push(`SUMMARY: ${report.summary}`);
  if (report.locale) parts.push(`LANGUAGE: ${report.locale}`);
  if (report.market_impact) parts.push(`MARKET IMPACT: ${report.market_impact}`);

  if (Array.isArray(report.stats) && report.stats.length) {
    parts.push(`KEY STATS:\n${report.stats.map(s => `- ${s.label}: ${s.value} (${s.description || ''})`).join('\n')}`);
  }
  if (Array.isArray(report.key_points) && report.key_points.length) {
    parts.push(`KEY POINTS:\n${report.key_points.map(p => `- ${p}`).join('\n')}`);
  }
  if (Array.isArray(report.root_causes) && report.root_causes.length) {
    parts.push(`ROOT CAUSES:\n${report.root_causes.map(c => `- ${c.title}: ${c.description}`).join('\n')}`);
  }
  if (Array.isArray(report.scenarios) && report.scenarios.length) {
    parts.push(`SCENARIOS:\n${report.scenarios.map(s => `- ${s.title} (${s.probability}): ${s.result}`).join('\n')}`);
  }
  if (Array.isArray(report.benefiting_assets) && report.benefiting_assets.length) {
    parts.push(`BENEFITING ASSETS: ${report.benefiting_assets.map(a => `${a.name} (${a.symbol})`).join(', ')}`);
  }
  if (Array.isArray(report.harmed_assets) && report.harmed_assets.length) {
    parts.push(`HARMED ASSETS: ${report.harmed_assets.map(a => `${a.name} (${a.symbol})`).join(', ')}`);
  }
  if (Array.isArray(report.recommendations) && report.recommendations.length) {
    parts.push(`RECOMMENDATIONS:\n${report.recommendations.map(r => `- ${r.asset}: ${r.action}${r.entry ? ` (entry: ${r.entry}${r.stopLoss ? ', SL: ' + r.stopLoss : ''}${r.target ? ', TP: ' + r.target : ''})` : ''}`).join('\n')}`);
  }
  if (report.content) {
    parts.push(`FULL CONTENT:\n${report.content}`);
  }

  parts.push(`\n---\nTASK: Convert this report into exactly ${N} cinematic scenes as a JSON array. Remember: scene #1 = hook, scene #${N} = resolution. Use the priority rules.`);

  return parts.join('\n\n');
}

function buildRepairPrompt(scene, reason, lang, budget) {
  const langName = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' }[lang] || 'Arabic';

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

  return `Rewrite scene #${scene.id} of a ${langName} financial news video.

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

function buildShortenPrompt(scene, lang) {
  const langName = { ar: 'Arabic', en: 'English', fr: 'French', tr: 'Turkish', es: 'Spanish' }[lang] || 'Arabic';
  const currentWords = countWords(scene.narrationText);
  const targetWords = Math.round(currentWords * SHORTEN_FACTOR);

  return `Rewrite the narrationText for this ${langName} video scene. Target: ${targetWords} words (30% shorter).

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
- Keep the same language (${langName}).
- Target length: ${targetWords} words (±5).

Output ONLY a JSON object: {"narrationText": "..."}`;
}

// ═══ LLM CALL HELPERS ═══
async function callLLM(systemPrompt, userPrompt, label = 'llm') {
  const zai = await getZAI();
  const t0 = Date.now();
  console.log(`  [LLM:${label}] calling...`);
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });
    const content = completion.choices[0]?.message?.content;
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  [LLM:${label}] ✓ ${elapsed}s, ${countWords(content || '')} words returned`);
    return content || '';
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.error(`  [LLM:${label}] ✗ failed after ${elapsed}s: ${err.message}`);
    return '';
  }
}

// ═══ BATCH GENERATION ═══
async function generateScenesBatch(report, lang) {
  const content = report.content || [report.summary, ...(report.key_points || []), ...(report.stats || []).map(s => `${s.label}: ${s.value}`)].join(' ');
  const N = calculateSceneCount(content);
  const budget = WORD_BUDGET[lang] || WORD_BUDGET.ar;

  console.log(`\n[Engine] Batch generate: N=${N}, lang=${lang}, budget=${budget.min}-${budget.max} words/scene`);

  const systemPrompt = buildSystemPrompt(N, lang, budget);
  const userPrompt = buildUserPrompt(report, N, lang);

  const raw = await callLLM(systemPrompt, userPrompt, 'batch');
  if (!raw) {
    console.error('[Engine] Batch LLM returned empty.');
    return { scenes: null, N, error: 'empty_response' };
  }

  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed)) {
    console.error('[Engine] Batch LLM did not return a JSON array.');
    console.error('[Engine] Raw (first 500 chars):', raw.slice(0, 500));
    return { scenes: null, N, error: 'invalid_json', raw };
  }

  console.log(`[Engine] Batch returned ${parsed.length} scenes (target was ${N})`);
  return { scenes: parsed, N, error: null };
}

// ═══ PER-SCENE VALIDATION + REPAIR ═══
function validateScene(scene, lang, budget) {
  const issues = [];

  if (!scene.sceneTitle || !String(scene.sceneTitle).trim()) issues.push('missing_field');
  if (!scene.sceneType || !['hook', 'context', 'data', 'impact', 'resolution'].includes(scene.sceneType)) issues.push('missing_field');
  if (!scene.narrationText || !String(scene.narrationText).trim()) issues.push('missing_field');
  if (!scene.displayText || !String(scene.displayText).trim()) issues.push('missing_field');
  if (!scene.imagePrompt || !String(scene.imagePrompt).trim()) issues.push('missing_field');

  if (issues.length) return issues;

  // Generic title detection
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

async function repairScene(scene, lang, budget, attempt = 1) {
  const issues = validateScene(scene, lang, budget);
  if (!issues.length) return { scene, repaired: false, reason: null };

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
      repaired: false,
      reason,
      placeholder: true,
    };
  }

  const prompt = buildRepairPrompt(scene, reason, lang, budget);
  const raw = await callLLM('You are a video script repair editor. Fix the broken scene.', prompt, `repair-${scene.id}`);
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

async function shortenScene(scene, lang) {
  console.log(`  [Engine] Shortening scene #${scene.id} (currently ${countWords(scene.narrationText)} words)`);
  const prompt = buildShortenPrompt(scene, lang);
  const raw = await callLLM('You are a video script editor. Shorten the narration.', prompt, `shorten-${scene.id}`);
  if (!raw) return scene;

  const parsed = extractJSON(raw);
  if (!parsed || !parsed.narrationText) return scene;

  const shortened = stripMarkdown(parsed.narrationText);
  if (countWords(shortened) < countWords(scene.narrationText)) {
    return { ...scene, narrationText: shortened };
  }
  return scene;
}

function postProcessScenes(scenes, lang) {
  return scenes.map((scene, idx) => {
    const id = idx + 1;
    const cleaned = {
      id,
      sceneTitle: stripMarkdown(scene.sceneTitle || `المشهد ${id}`),
      sceneType: scene.sceneType || 'context',
      narrationText: stripMarkdown(scene.narrationText || ''),
      displayText: stripMarkdown(scene.displayText || ''),
      imagePrompt: (scene.imagePrompt || 'cinematic background, no text').trim(),
    };
    cleaned.motionDirection = deriveMotion(cleaned.sceneType);
    cleaned.duration = calculateDuration(cleaned.narrationText, lang);
    if (scene.placeholder) cleaned.placeholder = true;
    return cleaned;
  });
}

async function validateTotalDuration(scenes, lang) {
  const total = scenes.reduce((sum, s) => sum + s.duration, 0);
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
      scenes[longestIdx] = await shortenScene(scenes[longestIdx], lang);
      scenes[longestIdx].duration = calculateDuration(scenes[longestIdx].narrationText, lang);
      console.log(`  [Engine] After shorten: ${scenes[longestIdx].duration}s (was ${longestDur}s)`);
    }
  }

  if (total < MIN_TOTAL_DURATION) {
    const brokenCount = scenes.filter(s => s.placeholder).length;
    if (brokenCount > scenes.length * BROKEN_RATIO_THRESHOLD) {
      console.warn(`[Engine] ${brokenCount}/${scenes.length} scenes broken (>30%) → flag for batch retry`);
      return { scenes, action: 'batch_retry', brokenCount };
    } else if (brokenCount > 0) {
      console.warn(`[Engine] ${brokenCount} scenes broken but below threshold → accept short video`);
      return { scenes, action: 'accept_short', brokenCount };
    } else {
      console.log(`[Engine] Short but no broken scenes → accept (short report)`);
      return { scenes, action: 'accept_short', brokenCount: 0 };
    }
  }

  return { scenes, action: 'accept', brokenCount: 0 };
}

// ═══ MAIN ORCHESTRATOR ═══
export async function generateVideoScript(report, options = {}) {
  const lang = report.locale || options.lang || 'ar';
  const startTime = Date.now();
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[Engine] START — title: "${report.title?.slice(0, 50)}..." | lang: ${lang}`);
  console.log(`${'═'.repeat(70)}`);

  let { scenes: rawScenes, N, error } = await generateScenesBatch(report, lang);

  if (!rawScenes && !options._isRetry) {
    console.warn(`[Engine] Batch failed (${error}) → retrying once`);
    const retry = await generateScenesBatch(report, lang);
    rawScenes = retry.scenes;
    if (!rawScenes) {
      console.error(`[Engine] Batch retry also failed. Aborting.`);
      return { success: false, error: 'batch_failed_twice', N };
    }
  }
  if (!rawScenes) {
    return { success: false, error: 'batch_failed', N };
  }

  let scenes = postProcessScenes(rawScenes, lang);
  console.log(`\n[Engine] Post-processed ${scenes.length} scenes:`);
  scenes.forEach(s => {
    console.log(`  #${s.id} [${s.sceneType}/${s.motionDirection}] "${s.sceneTitle.slice(0, 40)}" — ${s.duration}s, ${countWords(s.narrationText)}w narration, ${countWords(s.imagePrompt)}w prompt`);
  });

  console.log(`\n[Engine] Per-scene validation + repair:`);
  const budget = WORD_BUDGET[lang] || WORD_BUDGET.ar;
  const repairedScenes = [];
  for (let i = 0; i < scenes.length; i++) {
    const result = await repairScene(scenes[i], lang, budget);
    repairedScenes.push(result.scene);
    if (result.placeholder) {
      console.warn(`  [Engine] Scene #${scenes[i].id} became PLACEHOLDER (reason: ${result.reason})`);
    }
  }
  scenes = postProcessScenes(repairedScenes, lang);

  const durationResult = await validateTotalDuration(scenes, lang);
  scenes = durationResult.scenes;

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const brokenCount = scenes.filter(s => s.placeholder).length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`[Engine] DONE in ${elapsed}s`);
  console.log(`[Engine] Scenes: ${scenes.length} | Duration: ${totalDuration}s | Broken: ${brokenCount}`);
  console.log(`[Engine] Action: ${durationResult.action}`);
  console.log(`${'─'.repeat(70)}\n`);

  return {
    success: true,
    scenes,
    N,
    totalDuration,
    brokenCount,
    action: durationResult.action,
    elapsed: parseFloat(elapsed),
  };
}

// ═══ CLI ENTRY ═══
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let inputPath = '', outputPath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) inputPath = args[++i];
    if (args[i] === '--output' && args[i + 1]) outputPath = args[++i];
  }
  if (!inputPath || !outputPath) {
    console.error('Usage: node video-script-engine.mjs --input report.json --output scenes.json');
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(inputPath, 'utf-8'));
  generateVideoScript(report).then(result => {
    if (!result.success) {
      console.error('FAILED:', result.error);
      process.exit(1);
    }
    const videoScript = {
      title: report.title,
      locale: report.locale || 'ar',
      outroText: report.locale === 'ar'
        ? 'تابعنا لمزيد من التحليلات الاستراتيجية. رؤى — حيث يلتقي المال بالمعرفة.'
        : 'Follow us for more strategic insights. Rouaa — where money meets knowledge.',
      scenes: result.scenes.map(s => ({
        title: s.sceneTitle,
        sceneType: s.sceneType,
        motionDirection: s.motionDirection,
        narrationText: s.narrationText,
        displayText: s.displayText,
        imagePrompt: s.imagePrompt,
        duration: s.duration,
      })),
      _meta: {
        N: result.N,
        totalDuration: result.totalDuration,
        brokenCount: result.brokenCount,
        action: result.action,
        elapsed: result.elapsed,
        generatedAt: new Date().toISOString(),
      },
    };
    mkdirSync(outputPath.split('/').slice(0, -1).join('/'), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(videoScript, null, 2), 'utf-8');
    console.log(`\n[Engine] Output written: ${outputPath}`);
    console.log(`[Engine] ${result.scenes.length} scenes, ${result.totalDuration}s total`);
  }).catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
