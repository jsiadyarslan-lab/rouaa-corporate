// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline AI Router V387 ────────────────────────────────
// V387: ALL locales now use OpenRouter (Haiku) as #1 choice.
// The OpenRouter API key provides access to 200+ models.
// Haiku is the primary model — best quality/cost ratio.
// If Haiku fails within OpenRouter, it falls back to the next model
// within the same key. Only if all OpenRouter models fail do we
// fall through to locale-specific providers (Bedrock/Gemini for Arabic,
// Groq/Cerebras/Mistral/NVIDIA for English).

import { chatCompletion, ChatMessage, AIProvider } from '@/lib/ai-provider';

export type TaskType = 'translation' | 'generation' | 'analysis' | 'chat';

// V387: OpenRouter (Haiku) is first for ALL locales.
// The actual provider selection is handled by chatCompletion() with locale parameter.
const TASK_PREFERENCES: Record<TaskType, AIProvider[]> = {
  translation: ['openrouter', 'bedrock', 'gemini'],
  generation: ['openrouter', 'bedrock', 'gemini'],
  analysis: ['openrouter', 'bedrock', 'gemini'],
  chat: ['openrouter', 'bedrock', 'gemini'],
};

export interface RouterResult {
  content: string;
  provider: string;
  duration: number;
  tokensUsed?: number;
}

// Route a chat completion to the best provider for the task
export async function routeChatCompletion(
  messages: ChatMessage[],
  taskType: TaskType = 'translation',
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<RouterResult> {
  const { temperature = 0.3, maxTokens = 800 } = options || {};
  const priority = taskType === 'generation' ? 'generation' as const : 'translation' as const;

  const result = await chatCompletion(messages, {
    temperature,
    maxTokens,
    priority,
    locale: 'ar',  // V387: Default to Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
  });

  return {
    content: result.content,
    provider: result.provider,
    duration: result.duration,
    tokensUsed: result.tokensUsed,
  };
}
