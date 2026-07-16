// ═══════════════════════════════════════════════════════════════
// LLM Client — uses project's ai-provider.ts (22+ providers)
// ═══════════════════════════════════════════════════════════════
// Uses the existing chatCompletion from src/lib/ai-provider.ts.
// This gives us access to ALL 22+ providers configured in the
// project: OpenRouter, Bedrock, Gemini, Groq, Cerebras, Mistral,
// NVIDIA, GLM, DeepSeek, Cohere, SambaNova, SiliconFlow, DeepInfra,
// HuggingFace, Ollama, Grok, z-ai-sdk, zukijourney, nagaai, acytoo.
//
// No separate API keys needed — uses whatever the project already
// has configured.
// ═══════════════════════════════════════════════════════════════

import { chatCompletion as projectChatCompletion, type ChatMessage } from '@/lib/ai-provider';

export type { ChatMessage };

export interface LLMResponse {
  content: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  locale?: string;
  category?: string;  // V1201: For category-based model routing
}

/**
 * V1210: REAL category-based provider routing.
 * FIX: V1201 was fake — both branches returned the SAME provider list.
 *
 * Complex content (economy, central_banks, geopolitical) needs STRONGER reasoning.
 * Available strong models:
 *   - DeepSeek (deepseek-chat): best reasoning, but needs DEEPSEEK_API_KEY
 *   - HF Qwen2.5-72B: best Arabic, 72B params
 *   - OpenRouter: can access DeepSeek-V3, Qwen, etc. via free tier
 *   - Cerebras gpt-oss-120b: 120B params, ultra-fast
 *
 * Simple content (stocks, sectors, crypto) works fine with:
 *   - HF Qwen2.5-72B: best Arabic for financial data
 *   - Groq llama-3.3-70b: fast, 70B
 *   - Cerebras: fast
 */
function getPreferredProviders(category?: string): string[] {
  const complexCategories = ['economy', 'central_banks', 'geopolitical', 'macro'];

  if (complexCategories.includes(category || '')) {
    // V1210: Complex content — prefer providers with strongest reasoning models
    // OpenRouter first: can route to DeepSeek-V3 / Qwen-72B / Nemotron-120B
    // HF second: Qwen2.5-72B (strong Arabic + reasoning)
    // Cerebras third: gpt-oss-120b (120B params)
    console.log(`[Agency LLM V1210] Complex category="${category}" → strong reasoning providers`);
    return ['openrouter', 'hf', 'cerebras', 'groq', 'nvidia', 'ollama'];
  }

  // V1210: Default (stocks, sectors, crypto) — prefer HF Qwen2.5-72B for best Arabic
  // Groq/Cerebras for speed when HF is rate-limited
  console.log(`[Agency LLM V1210] Default category="${category || 'default'}" → fast Arabic providers`);
  return ['hf', 'groq', 'cerebras', 'nvidia', 'openrouter', 'ollama'];
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<LLMResponse> {
  const preferredProviders = getPreferredProviders(options.category);
  console.log(`[Agency LLM V1201] Category="${options.category || 'default'}" → providers: [${preferredProviders.join(',')}]`);

  // V1193+V1201: Try preferred providers first (category-aware)
  try {
    const result = await projectChatCompletion(
      messages,
      {
        temperature: options.temperature ?? 0.4,
        maxTokens: options.maxTokens ?? 2000,
        priority: 'generation',
        locale: (options.locale as any) || 'ar',
        allowFallback: true,
        maxRetries: 3,
        preferProviders: preferredProviders as any,
      }
    );

    if (result && result.content && result.content.trim().length > 0) {
      return {
        content: result.content,
        provider: result.provider || 'unknown',
        inputTokens: (result as any).inputTokens,
        outputTokens: (result as any).outputTokens,
      };
    }
  } catch (err: any) {
    console.warn(`[Agency LLM] Preferred providers (${preferredProviders.join('/')}) failed: ${err.message?.slice(0, 100)}`);
  }

  // Fallback: try all providers (if preferred all failed)
  console.warn('[Agency LLM] Falling back to all providers...');
  const result = await projectChatCompletion(
    messages,
    {
      temperature: options.temperature ?? 0.4,
      maxTokens: options.maxTokens ?? 2000,
      priority: 'generation',
      locale: (options.locale as any) || 'ar',
      allowFallback: true,
      maxRetries: 3,
    }
  );

  if (!result || !result.content || result.content.trim().length === 0) {
    throw new Error('LLM returned empty content');
  }

  return {
    content: result.content,
    provider: result.provider || 'unknown',
    inputTokens: (result as any).inputTokens,
    outputTokens: (result as any).outputTokens,
  };
}
