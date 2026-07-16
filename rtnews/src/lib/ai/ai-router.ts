// ─── V68 AI Router & 4-Gate Recommendation Pipeline ──────────
// Routes AI tasks to appropriate providers and implements the
// 4-gate recommendation pipeline for article curation.
//
// 4-Gate Pipeline:
//   Gate 1: Relevance    — Is the article relevant to trading/markets?
//   Gate 2: Quality      — Is the content high quality (not spam/duplicate)?
//   Gate 3: Sentiment    — What is the market sentiment (bullish/bearish/neutral)?
//   Gate 4: Priority     — What priority level for the reader (urgent/important/normal)?
//
// Fallback chain: Bedrock (Haiku) → Gemini → Groq

import { v68ChatCompletion, TASK_CONFIGS, PROVIDER_COSTS } from './ai-provider';
import type { ChatMessage, AITaskType, V68ChatOptions } from './ai-provider';

// ─── Router Configuration ───────────────────────────────────
export interface RouteConfig {
  taskType: AITaskType;
  systemPrompt: string;
  outputFormat: 'text' | 'json';
  maxRetries: number;
  timeoutMs: number;
}

// ─── Gate Definitions ───────────────────────────────────────
export interface GateResult {
  gate: string;
  passed: boolean;
  score: number; // 0-100
  reasoning: string;
  metadata?: Record<string, any>;
}

export interface RecommendationResult {
  articleId?: string;
  articleTitle?: string;
  gates: GateResult[];
  overallScore: number;
  recommended: boolean;
  priority: 'urgent' | 'important' | 'normal' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  summary: string;
  tags: string[];
  provider: string;
  model: string;
  duration: number;
}

// ─── Gate 1: Relevance ──────────────────────────────────────
const RELEVANCE_SYSTEM_PROMPT = `أنت محلل أخبار مالية عربي خبير. قم بتقييم ما إذا كانت المقالة ذات صلة بالتداول والأسواق المالية.

أجب بصيغة JSON فقط:
{
  "relevant": true/false,
  "score": 0-100,
  "reasoning": "سبب التقييم",
  "categories": ["فئة1", "فئة2"],
  "markets": ["سوق1", "سوق2"]
}

معايير الصلة:
- أخبار الأسواق المالية (أسهم، عملات، سلع، عملات رقمية)
- تقارير اقتصادية (نمو، تضخم، بطالة)
- قرارات البنوك المركزية
- أحداث جيوسياسية تؤثر على الأسواق
- تحليلات فنية وأساسية
- أخبار الشركات المدرجة`;

async function gateRelevance(articleTitle: string, articleContent: string): Promise<GateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: RELEVANCE_SYSTEM_PROMPT },
    { role: 'user', content: `عنوان المقالة: ${articleTitle}\n\nمحتوى المقالة:\n${articleContent.slice(0, 3000)}` },
  ];

  try {
    const result = await v68ChatCompletion(messages, { taskType: 'classification' });
    const parsed = parseJsonResponse(result.content);

    return {
      gate: 'relevance',
      passed: parsed.relevant === true && parsed.score >= 40,
      score: parsed.score || 0,
      reasoning: parsed.reasoning || 'No reasoning provided',
      metadata: {
        categories: parsed.categories || [],
        markets: parsed.markets || [],
      },
    };
  } catch (err: any) {
    return {
      gate: 'relevance',
      passed: false,
      score: 0,
      reasoning: `Gate failed: ${err.message?.slice(0, 100)}`,
    };
  }
}

// ─── Gate 2: Quality ────────────────────────────────────────
const QUALITY_SYSTEM_PROMPT = `أنت محرر أخبار مالية عربي خبير. قم بتقييم جودة المقالة الإخبارية.

أجب بصيغة JSON فقط:
{
  "highQuality": true/false,
  "score": 0-100,
  "reasoning": "سبب التقييم",
  "issues": ["مشكلة1", "مشكلة2"],
  "strengths": ["نقطة قوة1"]
}

معايير الجودة:
- مصدر موثوق (ليس شائعات أو إعلانات)
- معلومات دقيقة ومحددة (أرقام وتواريخ)
- لا تكرار أو محتوى منسوخ
- لغة مهنية وليست مبالغ فيها
- يحتوي على بيانات قابلة للتحقق`;

async function gateQuality(articleTitle: string, articleContent: string): Promise<GateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: QUALITY_SYSTEM_PROMPT },
    { role: 'user', content: `عنوان المقالة: ${articleTitle}\n\nمحتوى المقالة:\n${articleContent.slice(0, 3000)}` },
  ];

  try {
    const result = await v68ChatCompletion(messages, { taskType: 'classification' });
    const parsed = parseJsonResponse(result.content);

    return {
      gate: 'quality',
      passed: parsed.highQuality === true && parsed.score >= 50,
      score: parsed.score || 0,
      reasoning: parsed.reasoning || 'No reasoning provided',
      metadata: {
        issues: parsed.issues || [],
        strengths: parsed.strengths || [],
      },
    };
  } catch (err: any) {
    return {
      gate: 'quality',
      passed: false,
      score: 0,
      reasoning: `Gate failed: ${err.message?.slice(0, 100)}`,
    };
  }
}

// ─── Gate 3: Sentiment ──────────────────────────────────────
const SENTIMENT_SYSTEM_PROMPT = `أنت محلل مشاعر السوق المالي. قم بتحليل المشاعر السوقية في المقالة.

أجب بصيغة JSON فقط:
{
  "sentiment": "bullish" | "bearish" | "neutral" | "mixed",
  "score": 0-100,
  "reasoning": "سبب التقييم",
  "confidence": 0-100,
  "affectedAssets": ["أصل1", "أصل2"],
  "keyPhrases": ["عبارة1", "عبارة2"]
}

معايير المشاعر:
- bullish: أخبار إيجابية تشير لارتفاع الأسعار
- bearish: أخبار سلبية تشير لانخفاض الأسعار
- neutral: أخبار محايدة بدون تأثير واضح
- mixed: أخبار مختلطة (إيجابية وسلبية معاً)`;

async function gateSentiment(articleTitle: string, articleContent: string): Promise<GateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
    { role: 'user', content: `عنوان المقالة: ${articleTitle}\n\nمحتوى المقالة:\n${articleContent.slice(0, 3000)}` },
  ];

  try {
    const result = await v68ChatCompletion(messages, { taskType: 'sentiment' });
    const parsed = parseJsonResponse(result.content);

    return {
      gate: 'sentiment',
      passed: true, // Sentiment gate always passes — it's informational
      score: parsed.score || 50,
      reasoning: parsed.reasoning || 'No reasoning provided',
      metadata: {
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 50,
        affectedAssets: parsed.affectedAssets || [],
        keyPhrases: parsed.keyPhrases || [],
      },
    };
  } catch (err: any) {
    return {
      gate: 'sentiment',
      passed: true,
      score: 50,
      reasoning: `Gate defaulted: ${err.message?.slice(0, 100)}`,
      metadata: { sentiment: 'neutral', confidence: 0 },
    };
  }
}

// ─── Gate 4: Priority ───────────────────────────────────────
const PRIORITY_SYSTEM_PROMPT = `أنت محرر أخبار مالية عربي خبير. قم بتحديد أولوية المقالة للقارئ.

أجب بصيغة JSON فقط:
{
  "priority": "urgent" | "important" | "normal" | "low",
  "score": 0-100,
  "reasoning": "سبب التقييم",
  "timeSensitivity": "immediate" | "today" | "this_week" | "evergreen",
  "targetAudience": ["جمهور1", "جمهور2"],
  "summary": "ملخص المقالة في جملة واحدة بالعربية"
}

معايير الأولوية:
- urgent: أحداث تؤثر فوراً على الأسواق (قرارات بنوك مركزية، أزمات مفاجئة)
- important: أخبار مهمة قد تؤثر خلال اليوم (بيانات اقتصادية، أرباح شركات)
- normal: أخبار عامة ذات صلة بالتداول
- low: أخبار ثانوية أو تعليمية`;

async function gatePriority(articleTitle: string, articleContent: string): Promise<GateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: PRIORITY_SYSTEM_PROMPT },
    { role: 'user', content: `عنوان المقالة: ${articleTitle}\n\nمحتوى المقالة:\n${articleContent.slice(0, 3000)}` },
  ];

  try {
    const result = await v68ChatCompletion(messages, { taskType: 'recommendation' });
    const parsed = parseJsonResponse(result.content);

    return {
      gate: 'priority',
      passed: parsed.score >= 30, // Minimum priority threshold
      score: parsed.score || 50,
      reasoning: parsed.reasoning || 'No reasoning provided',
      metadata: {
        priority: parsed.priority || 'normal',
        timeSensitivity: parsed.timeSensitivity || 'evergreen',
        targetAudience: parsed.targetAudience || [],
        summary: parsed.summary || '',
      },
    };
  } catch (err: any) {
    return {
      gate: 'priority',
      passed: true,
      score: 50,
      reasoning: `Gate defaulted: ${err.message?.slice(0, 100)}`,
      metadata: { priority: 'normal', timeSensitivity: 'evergreen' },
    };
  }
}

// ─── Full 4-Gate Pipeline ───────────────────────────────────
export async function runRecommendationPipeline(
  articleTitle: string,
  articleContent: string,
  articleId?: string
): Promise<RecommendationResult> {
  const pipelineStart = Date.now();
  const gates: GateResult[] = [];

  // Gate 1: Relevance — if not relevant, skip remaining gates
  const relevanceResult = await gateRelevance(articleTitle, articleContent);
  gates.push(relevanceResult);

  if (!relevanceResult.passed) {
    return buildPipelineResult(
      articleId, articleTitle, gates,
      'bedrock', 'pipeline', pipelineStart
    );
  }

  // Gate 2: Quality — if low quality, skip remaining gates
  const qualityResult = await gateQuality(articleTitle, articleContent);
  gates.push(qualityResult);

  if (!qualityResult.passed) {
    return buildPipelineResult(
      articleId, articleTitle, gates,
      'bedrock', 'pipeline', pipelineStart
    );
  }

  // Gate 3: Sentiment — always passes (informational)
  const sentimentResult = await gateSentiment(articleTitle, articleContent);
  gates.push(sentimentResult);

  // Gate 4: Priority
  const priorityResult = await gatePriority(articleTitle, articleContent);
  gates.push(priorityResult);

  return buildPipelineResult(
    articleId, articleTitle, gates,
    'bedrock', 'pipeline', pipelineStart
  );
}

// ─── Build Pipeline Result ──────────────────────────────────
function buildPipelineResult(
  articleId: string | undefined,
  articleTitle: string | undefined,
  gates: GateResult[],
  provider: string,
  model: string,
  startTime: number
): RecommendationResult {
  // Calculate overall score (weighted average)
  const weights: Record<string, number> = {
    relevance: 0.35,
    quality: 0.25,
    sentiment: 0.15,
    priority: 0.25,
  };

  let totalWeight = 0;
  let weightedScore = 0;
  for (const gate of gates) {
    const weight = weights[gate.gate] || 0.25;
    weightedScore += gate.score * weight;
    totalWeight += weight;
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  // Determine if recommended (passes relevance + quality gates)
  const relevancePassed = gates.find(g => g.gate === 'relevance')?.passed ?? false;
  const qualityPassed = gates.find(g => g.gate === 'quality')?.passed ?? false;
  const recommended = relevancePassed && qualityPassed && overallScore >= 40;

  // Extract sentiment and priority from gate metadata
  const sentimentGate = gates.find(g => g.gate === 'sentiment');
  const priorityGate = gates.find(g => g.gate === 'priority');

  const sentiment = (sentimentGate?.metadata?.sentiment as string) || 'neutral';
  const priority = (priorityGate?.metadata?.priority as string) || 'normal';

  // Extract tags from relevance gate categories
  const relevanceGate = gates.find(g => g.gate === 'relevance');
  const tags: string[] = [
    ...(relevanceGate?.metadata?.categories || []),
    ...(relevanceGate?.metadata?.markets || []),
    ...(sentimentGate?.metadata?.affectedAssets || []),
  ].filter(Boolean).slice(0, 10);

  // Extract summary from priority gate
  const summary = (priorityGate?.metadata?.summary as string) || '';

  return {
    articleId,
    articleTitle,
    gates,
    overallScore,
    recommended,
    priority: priority as RecommendationResult['priority'],
    sentiment: sentiment as RecommendationResult['sentiment'],
    summary,
    tags: [...new Set(tags)], // Deduplicate
    provider,
    model,
    duration: Date.now() - startTime,
  };
}

// ─── Utility: Parse JSON from AI response ───────────────────
function parseJsonResponse(content: string): Record<string, any> {
  // Try to extract JSON from the response
  // AI sometimes wraps JSON in markdown code blocks
  let jsonStr = content.trim();

  if (!jsonStr) {
    console.warn('[V68-Router] Empty response from AI provider');
    return {};
  }

  // Log raw response for debugging (first 200 chars)
  console.log('[V68-Router] Raw AI response (first 200):', jsonStr.slice(0, 200));

  // Remove markdown code blocks
  const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1].trim();
  }

  // Try direct parse
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to find JSON object in the response
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Fall through
      }
    }

    // V69: Try to extract key-value pairs from non-JSON response
    // Sometimes Claude returns natural text instead of JSON
    const result: Record<string, any> = {};
    
    // Try to extract boolean values
    const relevantMatch = jsonStr.match(/(?:relevant|highQuality)\s*[:=]\s*(true|false)/i);
    if (relevantMatch) result.relevant = relevantMatch[1].toLowerCase() === 'true';
    
    // Try to extract score
    const scoreMatch = jsonStr.match(/score\s*[:=]\s*(\d+)/i);
    if (scoreMatch) result.score = parseInt(scoreMatch[1]);
    
    // Try to extract sentiment
    const sentimentMatch = jsonStr.match(/sentiment\s*[:=]\s*["']?(bullish|bearish|neutral|mixed)["']?/i);
    if (sentimentMatch) result.sentiment = sentimentMatch[1].toLowerCase();
    
    // Try to extract priority
    const priorityMatch = jsonStr.match(/priority\s*[:=]\s*["']?(urgent|important|normal|low)["']?/i);
    if (priorityMatch) result.priority = priorityMatch[1].toLowerCase();
    
    // Try to extract reasoning
    const reasoningMatch = jsonStr.match(/(?:reasoning|reason|سبب)\s*[:=]\s*["']([^"']+)["']/i);
    if (reasoningMatch) result.reasoning = reasoningMatch[1];

    if (Object.keys(result).length > 0) {
      console.log('[V68-Router] Extracted partial data from non-JSON response:', JSON.stringify(result));
      return result;
    }

    // Return empty object if parsing fails
    console.warn('[V68-Router] Failed to parse JSON response, returning empty object. Raw:', jsonStr.slice(0, 300));
    return {};
  }
}

// ─── Quick Route: Single Task ───────────────────────────────
export async function routeTask(
  taskType: AITaskType,
  systemPrompt: string,
  userMessage: string,
  options?: Partial<V68ChatOptions>
): Promise<{ content: string; provider: string; model: string; duration: number }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const result = await v68ChatCompletion(messages, { taskType, ...options });

  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
    duration: result.duration,
  };
}

// ─── Batch Recommendation ───────────────────────────────────
export async function batchRecommend(
  articles: Array<{ id: string; title: string; content: string }>
): Promise<RecommendationResult[]> {
  const results: RecommendationResult[] = [];

  // Process articles sequentially to avoid rate limits
  for (const article of articles) {
    try {
      const result = await runRecommendationPipeline(
        article.title,
        article.content,
        article.id
      );
      results.push(result);
    } catch (err: any) {
      results.push({
        articleId: article.id,
        articleTitle: article.title,
        gates: [],
        overallScore: 0,
        recommended: false,
        priority: 'low',
        sentiment: 'neutral',
        summary: `Pipeline failed: ${err.message?.slice(0, 100)}`,
        tags: [],
        provider: 'none',
        model: 'none',
        duration: 0,
      });
    }
  }

  // Sort by overall score descending
  results.sort((a, b) => b.overallScore - a.overallScore);

  return results;
}

// ─── Default Export ─────────────────────────────────────────
export default {
  runRecommendationPipeline,
  routeTask,
  batchRecommend,
  gateRelevance,
  gateQuality,
  gateSentiment,
  gatePriority,
};
