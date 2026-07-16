// ─── V68/V315 AI Provider System ──────────────────────────────
// Modular AI provider management with Bedrock Claude 4.5 Haiku as primary provider.
// V315: Bedrock & Gemini are ARABIC ONLY — too expensive for English pipeline.
//       English pipeline uses Groq/Cerebras/Mistral/NVIDIA (free/cheap, excellent English).
// V258: Fixed Gemini 2.5 Flash thinking mode (thinkingBudget=0, thought-part handling).
// V257: Gemini added as fallback — Bedrock primary, Gemini backup for Arabic pipeline.
// Groq, Cerebras, Mistral, DeepSeek, GLM, z-ai-sdk, NVIDIA, HF are still disabled
// (they produce bad Arabic content).

import {
  chatCompletion as _chatCompletion,
  getProviderStatus as _getProviderStatus,
  testProviderDirectly as _testProviderDirectly,
} from '@/lib/ai-provider';
import type { ChatMessage, ChatCompletionResult, AIProvider } from '@/lib/ai-provider';

// ─── V68 Provider Priority Configuration ─────────────────────
// Default model: us.anthropic.claude-haiku-4-5-20251001-v1:0 (Claude 4.5 Haiku, cross-region inference required)
// V315: Bedrock + Gemini are ARABIC ONLY. English pipeline uses Groq/Cerebras/Mistral/NVIDIA.
// Arabic fallback chain: Bedrock (Claude 4.5 Haiku cross-region) → Gemini (2.5 Flash)

export const V68_DEFAULT_MODEL = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

// V315: These providers are ONLY used for Arabic pipeline (via chatCompletion with allowFallback=false).
// English pipeline (allowFallback=true) is handled entirely by the base ai-provider.ts
// which now skips Bedrock/Gemini and goes directly to Groq/Cerebras/Mistral/NVIDIA.
export const V68_PROVIDER_PRIORITY: AIProvider[] = [
  'bedrock',   // #1: Claude via Bedrock — PRIMARY for Arabic (best Arabic quality)
  'gemini',    // #2: Gemini — FALLBACK for Arabic pipeline (second-best Arabic quality)
];

// ─── Task-Type Routing ──────────────────────────────────────
// V315: These configs apply ONLY to the Arabic pipeline (Bedrock → Gemini).
// English pipeline is handled by the base ai-provider.ts chatCompletion()
// which routes directly to Groq/Cerebras/Mistral/NVIDIA.
// Different tasks benefit from different providers.
// For example, translation is lightweight (Haiku sufficient),
// while deep analysis benefits from Sonnet.

export type AITaskType =
  | 'translation'      // Lightweight: translate content to Arabic
  | 'classification'   // Lightweight: categorize articles
  | 'summarization'    // Medium: summarize articles
  | 'analysis'         // Heavy: financial analysis, trading signals
  | 'recommendation'   // Heavy: 4-gate recommendation pipeline
  | 'sentiment'        // Medium: sentiment analysis
  | 'chat'             // General: conversational AI
  | 'embedding';       // Vector embedding generation

export interface TaskProviderConfig {
  preferredProvider: AIProvider;
  fallbackChain: AIProvider[];
  temperature: number;
  maxTokens: number;
  description: string;
}

export const TASK_CONFIGS: Record<AITaskType, TaskProviderConfig> = {
  translation: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.1,
    maxTokens: 500,
    description: 'Translate content to Arabic — low temperature for accuracy',
  },
  classification: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.1,
    maxTokens: 500,
    description: 'Classify articles by category — low temperature for consistency',
  },
  summarization: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.3,
    maxTokens: 800,
    description: 'Summarize article content — moderate temperature for readability',
  },
  analysis: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.3,
    maxTokens: 2000,
    description: 'Financial analysis and trading signals — needs quality reasoning',
  },
  recommendation: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.3,
    maxTokens: 800,
    description: '4-gate recommendation pipeline — complex multi-step reasoning',
  },
  sentiment: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.2,
    maxTokens: 600,
    description: 'Sentiment analysis — low temperature for objective scoring',
  },
  chat: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Conversational AI — higher temperature for natural responses',
  },
  embedding: {
    preferredProvider: 'bedrock',
    fallbackChain: ['gemini'], // V257: Gemini as fallback
    temperature: 0,
    maxTokens: 100,
    description: 'Vector embedding generation — zero temperature for determinism',
  },
};

// ─── Provider Health Tracking ───────────────────────────────
interface ProviderHealth {
  provider: AIProvider;
  successCount: number;
  failureCount: number;
  lastSuccess: number | null;
  lastFailure: number | null;
  avgLatencyMs: number;
  consecutiveFailures: number;
  isHealthy: boolean;
}

const providerHealthMap = new Map<AIProvider, ProviderHealth>();

function getOrCreateHealth(provider: AIProvider): ProviderHealth {
  if (!providerHealthMap.has(provider)) {
    providerHealthMap.set(provider, {
      provider,
      successCount: 0,
      failureCount: 0,
      lastSuccess: null,
      lastFailure: null,
      avgLatencyMs: 0,
      consecutiveFailures: 0,
      isHealthy: true,
    });
  }
  return providerHealthMap.get(provider)!;
}

function recordSuccess(provider: string, durationMs: number): void {
  const health = getOrCreateHealth(provider as AIProvider);
  health.successCount++;
  health.lastSuccess = Date.now();
  health.consecutiveFailures = 0;
  health.isHealthy = true;
  // Running average
  health.avgLatencyMs = health.avgLatencyMs === 0
    ? durationMs
    : Math.round((health.avgLatencyMs * 0.8) + (durationMs * 0.2));
  // V113: Reset cascade failure state when a provider succeeds
  resetCascadeState();
}

function recordFailure(provider: string): void {
  const health = getOrCreateHealth(provider as AIProvider);
  health.failureCount++;
  health.lastFailure = Date.now();
  health.consecutiveFailures++;
  // V113: Mark unhealthy after 3 consecutive failures (was already 3, but clarify)
  if (health.consecutiveFailures >= 3) {
    health.isHealthy = false;
  }
}

// ─── V113: Cascade Failure Protection ─────────────────────────
// When multiple providers fail (especially due to rate limits), falling
// through to Groq produces bad Arabic output that the publisher rejects.
// Instead, we detect cascade failure and signal the orchestrator to pause.
const CASCADE_FAILURE_WINDOW_MS = 5 * 60 * 1000; // 5 min window
const CASCADE_FAILURE_THRESHOLD = 5; // 5+ failures across providers = cascade

interface CascadeFailureEvent {
  provider: string;
  timestamp: number;
  isRateLimit: boolean;
}

const recentFailures: CascadeFailureEvent[] = [];

function recordCascadeFailure(provider: string, errorMessage: string): void {
  const isRateLimit = /rate.?limit|throttl|quota|429|daily.?limit|too.?many/i.test(errorMessage);
  recentFailures.push({ provider, timestamp: Date.now(), isRateLimit });
  // Prune old entries
  const cutoff = Date.now() - CASCADE_FAILURE_WINDOW_MS;
  while (recentFailures.length > 0 && recentFailures[0].timestamp < cutoff) {
    recentFailures.shift();
  }
}

// Check if we're experiencing a cascade failure (multiple providers failing)
// Returns true when we should pause processing rather than use weak providers
export function isCascadeFailure(): boolean {
  const cutoff = Date.now() - CASCADE_FAILURE_WINDOW_MS;
  const recentRelevantFailures = recentFailures.filter(f => f.timestamp >= cutoff);

  // Need multiple different providers failing = cascade
  const failedProviders = new Set(recentRelevantFailures.map(f => f.provider));
  const rateLimitFailures = recentRelevantFailures.filter(f => f.isRateLimit).length;

  // Cascade: 2+ different providers failed with rate limits, or 5+ total failures
  if ((failedProviders.size >= 2 && rateLimitFailures >= 2) || recentRelevantFailures.length >= CASCADE_FAILURE_THRESHOLD) {
    return true;
  }

  // Also check: are the two STRONG providers (bedrock + gemini) both unhealthy?
  const bedrockHealth = getOrCreateHealth('bedrock');
  const geminiHealth = getOrCreateHealth('gemini');
  if (!bedrockHealth.isHealthy && !geminiHealth.isHealthy) {
    return true; // Both strong providers down = don't fall through to Groq
  }

  return false;
}

// Reset cascade failure state (called when a provider succeeds)
function resetCascadeState(): void {
  recentFailures.length = 0;
}

// ─── V68 Smart Chat Completion ──────────────────────────────
// Routes to the best provider based on task type and health.
// Falls back through the priority chain automatically.

export interface V68ChatOptions {
  taskType?: AITaskType;
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: AIProvider;
}

export async function v68ChatCompletion(
  messages: ChatMessage[],
  options: V68ChatOptions = {}
): Promise<ChatCompletionResult> {
  const { taskType = 'chat', preferredProvider } = options;
  const taskConfig = TASK_CONFIGS[taskType];

  const temperature = options.temperature ?? taskConfig.temperature;
  const maxTokens = options.maxTokens ?? taskConfig.maxTokens;

  // V257: Bedrock primary + Gemini fallback — when Bedrock fails, try Gemini
  // before giving up. Gemini is the only allowed fallback (second-best Arabic quality).
  // Groq, Cerebras, Mistral, DeepSeek are still excluded (bad Arabic).
  const providerChain: AIProvider[] = ['bedrock', 'gemini']; // V257: Bedrock → Gemini

  // Try each provider in the chain
  const errors: string[] = [];
  for (const provider of providerChain) {
    const health = getOrCreateHealth(provider);
    // Skip unhealthy providers unless they're the only option
    if (!health.isHealthy && providerChain.some(p => getOrCreateHealth(p).isHealthy)) {
      console.log(`[V68] Skipping unhealthy provider: ${provider}`);
      continue;
    }

    try {
      // V122: Pass the provider explicitly so base chatCompletion uses our Bedrock→Gemini chain
      const result = await _chatCompletion(messages, { temperature, maxTokens, provider });
      recordSuccess(result.provider || provider, result.duration);
      return {
        ...result,
        // Attach V68 metadata
        content: result.content,
        provider: result.provider || provider,
        model: result.model,
        duration: result.duration,
        tokensUsed: result.tokensUsed,
      };
    } catch (err: any) {
      recordFailure(provider);
      recordCascadeFailure(provider, err.message || '');
      errors.push(`${provider}: ${err.message?.slice(0, 100)}`);
      console.warn(`[V68/V122] Provider ${provider} failed: ${err.message?.slice(0, 100)}`);
      // V122: Continue to next provider in chain (bedrock → gemini only)
    }
  }

  throw new Error(`All V68 providers failed: ${errors.join('; ')}`);
}

// ─── Re-exports from existing provider ──────────────────────
// Keep backward compatibility with existing code that imports from @/lib/ai-provider

export { _chatCompletion as chatCompletion };
export { _getProviderStatus as getProviderStatus };
export { _testProviderDirectly as testProviderDirectly };
export type { ChatMessage, ChatCompletionResult, AIProvider };

// ─── V68 Provider Status (enhanced) ─────────────────────────
export interface V68ProviderStatus {
  provider: string;
  available: boolean;
  model: string;
  healthy: boolean;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
  lastSuccess: string | null;
  lastFailure: string | null;
}

export function getV68ProviderStatus(): V68ProviderStatus[] {
  const baseStatus = _getProviderStatus();
  return baseStatus.map(p => {
    const health = getOrCreateHealth(p.provider as AIProvider);
    return {
      provider: p.provider,
      available: p.available,
      model: p.model,
      healthy: health.isHealthy,
      successCount: health.successCount,
      failureCount: health.failureCount,
      avgLatencyMs: health.avgLatencyMs,
      consecutiveFailures: health.consecutiveFailures,
      lastSuccess: health.lastSuccess ? new Date(health.lastSuccess).toISOString() : null,
      lastFailure: health.lastFailure ? new Date(health.lastFailure).toISOString() : null,
    };
  });
}

// ─── Cost Estimates (per 1M tokens) ─────────────────────────
export interface ProviderCost {
  provider: string;
  model: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  currency: string;
  notes: string;
}

export const PROVIDER_COSTS: ProviderCost[] = [
  {
    provider: 'bedrock',
    model: 'Claude 4.5 Haiku',
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
    currency: 'USD',
    notes: 'V315: ARABIC ONLY. Best Arabic quality per dollar. Too expensive for English pipeline.',
  },
  {
    provider: 'bedrock',
    model: 'Claude Sonnet 4',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    currency: 'USD',
    notes: 'V315: ARABIC ONLY. Premium quality for complex analysis via BEDROCK_MODEL env var.',
  },
  {
    provider: 'gemini',
    model: 'Gemini 2.5 Flash',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V315: ARABIC ONLY. FREE tier: ~1,500 req/day. Good Arabic quality. Arabic fallback.',
  },
  {
    provider: 'groq',
    model: 'Llama 3.3 70B',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V315: ENGLISH PRIMARY. FREE tier. Ultra-fast (106ms). Excellent English quality.',
  },
  {
    provider: 'cerebras',
    model: 'Llama 3.3 70B',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V315: ENGLISH BACKUP. FREE tier. Fastest inference. Excellent English quality.',
  },
  {
    provider: 'mistral',
    model: 'Mistral Small',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60,
    currency: 'USD',
    notes: 'V315: ENGLISH BACKUP. Good multilingual, excellent English. Cheap.',
  },
  {
    provider: 'nvidia',
    model: 'Llama 3.1 8B',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V315: ENGLISH BACKUP. Free credits available. Good for simple tasks.',
  },
  {
    provider: 'deepseek',
    model: 'DeepSeek Chat',
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    currency: 'USD',
    notes: 'Very cheap. Good quality when paid. Free tier available. Not in active pipeline.',
  },
  {
    provider: 'sambanova',
    model: 'Llama 3.3 70B',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V396: FREE for developers. Ultra-fast SN40L silicon. Excellent English/Arabic. Added to all pipelines.',
  },
  {
    provider: 'cohere',
    model: 'Command R+',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V396: FREE tier (1000 calls/month). Good multilingual including Arabic/French/Spanish. Native multilingual.',
  },
  {
    provider: 'cloudflare',
    model: 'Llama 3.3 70B (Workers AI)',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V396: FREE 10K neurons/day. Requires Cloudflare account + Workers AI. Good backup.',
  },
  {
    provider: 'siliconflow',
    model: 'DeepSeek V3',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V396: FREE 15 RPM. DeepSeek-V3/Qwen-2.5-72B. Excellent Chinese/English. Good backup.',
  },
  {
    provider: 'deepinfra',
    model: 'Llama 3.3 70B',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V396: FREE 100 req/hour. Multiple strong models. Good multilingual backup.',
  },
  {
    provider: 'acytoo',
    model: 'GPT-4o-mini',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    currency: 'USD',
    notes: 'V800: FREE ~100 req/day. GPT-4o-mini, GPT-3.5-turbo. No API key needed for basic access.',
  },
];

// ─── Default Export ─────────────────────────────────────────
export default {
  chatCompletion: v68ChatCompletion,
  getProviderStatus: getV68ProviderStatus,
  getProviderCosts: () => PROVIDER_COSTS,
  TASK_CONFIGS,
  V68_DEFAULT_MODEL,
  V68_PROVIDER_PRIORITY,
};
