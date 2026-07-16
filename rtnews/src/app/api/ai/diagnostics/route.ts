// ─── V68 AI Provider Diagnostics Endpoint ────────────────────
// Enhanced diagnostics: shows env vars (masked), actual URLs, provider tests,
// health tracking, and V68 pipeline status.
// Fixes the 404 issue by ensuring this module is properly compiled and exported.

import { NextResponse } from 'next/server';
import { getProviderStatus, testProviderDirectly, getGeminiTier } from '@/lib/ai-provider';
import { getV68ProviderStatus, V68_DEFAULT_MODEL, V68_PROVIDER_PRIORITY, PROVIDER_COSTS } from '@/lib/ai/ai-provider';
import type { AIProvider } from '@/lib/ai-provider';
import { isR2Available } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter
let lastDiagnosticsCall = 0;
const DIAGNOSTICS_COOLDOWN_MS = 5_000; // V395: Reduced from 30s to 5s — debugging needs fast iteration

// Mask a string: show first N chars, rest as ***
function mask(val: string | undefined, show: number = 4): string {
  if (!val) return '(not set)';
  if (val.length <= show) return '***';
  return val.slice(0, show) + '***' + `[len=${val.length}]`;
}

export async function GET() {
  try {
    // Rate limit check
    const now = Date.now();
    if (now - lastDiagnosticsCall < DIAGNOSTICS_COOLDOWN_MS) {
      const waitSecs = Math.ceil((DIAGNOSTICS_COOLDOWN_MS - (now - lastDiagnosticsCall)) / 1000);
      return NextResponse.json({
        status: 'rate_limited',
        message: `Please wait ${waitSecs} seconds between diagnostics calls`,
        retryAfter: waitSecs,
      }, { status: 429 });
    }
    lastDiagnosticsCall = now;

    // ── Collect env var diagnostics (masked) ──
    const envDiagnostics: Record<string, string> = {
      GROQ_API_KEY: mask(process.env.GROQ_API_KEY),
      GEMINI_API_KEY: mask(process.env.GEMINI_API_KEY),
      GOOGLE_AI_STUDIO_API_KEY: mask(process.env.GOOGLE_AI_STUDIO_API_KEY),
      DEEPSEEK_API_KEY: mask(process.env.DEEPSEEK_API_KEY),
      DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || '(not set, using default)',
      GLM_API_KEY: mask(process.env.GLM_API_KEY),
      GLM_BASE_URL: process.env.GLM_BASE_URL || '(not set, using default)',
      HF_API_KEY: mask(process.env.HF_API_KEY),
      HF_API_TOKEN: mask(process.env.HF_API_TOKEN),
      HF_TOKEN: mask(process.env.HF_TOKEN),
      HF_IMAGE_MODEL: process.env.HF_IMAGE_MODEL || '(not set, using black-forest-labs/FLUX.1-schnell)',
      AWS_ACCESS_KEY_ID: mask(process.env.AWS_ACCESS_KEY_ID),
      AWS_SECRET_ACCESS_KEY: mask(process.env.AWS_SECRET_ACCESS_KEY),
      AWS_REGION: process.env.AWS_REGION || '(not set, using us-east-1)',
      AWS_SESSION_TOKEN: mask(process.env.AWS_SESSION_TOKEN),
      BEDROCK_MODEL: process.env.BEDROCK_MODEL || `(not set, using ${V68_DEFAULT_MODEL})`,
      OLLAMA_API_KEY: mask(process.env.OLLAMA_API_KEY),
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || '(not set)',
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || '(not set, using default)',
      ZAI_BASE_URL: process.env.ZAI_BASE_URL || '(not set)',
      ZAI_API_KEY: mask(process.env.ZAI_API_KEY),
      GEMINI_MODEL: process.env.GEMINI_MODEL || '(not set, using default)',
      GEMINI_TIER: process.env.GEMINI_TIER || '(not set, defaults to free — set to "paid" for paid subscriptions)',
      GROQ_MODEL: process.env.GROQ_MODEL || '(not set, using default)',
      CEREBRAS_API_KEY: mask(process.env.CEREBRAS_API_KEY),
      CEREBRAS_MODEL: process.env.CEREBRAS_MODEL || '(not set, using default)',
      MISTRAL_API_KEY: mask(process.env.MISTRAL_API_KEY),
      MISTRAL_MODEL: process.env.MISTRAL_MODEL || '(not set, using default)',
      NVIDIA_API_KEY: mask(process.env.NVIDIA_API_KEY),
      NVIDIA_MODEL: process.env.NVIDIA_MODEL || '(not set, using default)',
      OPENROUTER_API_KEY: mask(process.env.OPENROUTER_API_KEY),
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || '(not set, using default free models)',
      TOGETHER_API_KEY: mask(process.env.TOGETHER_API_KEY),
      TOGETHER_IMAGE_MODEL: process.env.TOGETHER_IMAGE_MODEL || '(not set, using black-forest-labs/FLUX.1-schnell-Free)',
      STABLEHORDE_API_KEY: mask(process.env.STABLEHORDE_API_KEY),
      SAMBANOVA_API_KEY: mask(process.env.SAMBANOVA_API_KEY),
      SAMBANOVA_MODEL: process.env.SAMBANOVA_MODEL || '(not set, using Meta-Llama-3.3-70B-Instruct)',
      COHERE_API_KEY: mask(process.env.COHERE_API_KEY),
      COHERE_MODEL: process.env.COHERE_MODEL || '(not set, using command-a)',
      CLOUDFLARE_API_TOKEN: mask(process.env.CLOUDFLARE_API_TOKEN),
      CLOUDFLARE_ACCOUNT_ID: mask(process.env.CLOUDFLARE_ACCOUNT_ID),
      CLOUDFLARE_MODEL: process.env.CLOUDFLARE_MODEL || '(not set, using @cf/meta/llama-3.3-70b-instruct-fp8-fast)',
      SILICONFLOW_API_KEY: mask(process.env.SILICONFLOW_API_KEY),
      SILICONFLOW_MODEL: process.env.SILICONFLOW_MODEL || '(not set, using deepseek-ai/DeepSeek-V3)',
      DEEPINFRA_API_KEY: mask(process.env.DEEPINFRA_API_KEY),
      DEEPINFRA_MODEL: process.env.DEEPINFRA_MODEL || '(not set, using meta-llama/Llama-3.3-70B-Instruct)',
      XAI_API_KEY: mask(process.env.XAI_API_KEY),
      XAI_MODEL: process.env.XAI_MODEL || '(not set, using grok-3-mini-beta)',
      XAI_API_KEY_COUNT: (() => {
        // V399-fix: Show how many Grok keys are configured
        const keys: string[] = [];
        const mainValue = (process.env.XAI_API_KEY || '').trim();
        if (mainValue) { for (const k of mainValue.split(',')) { const t = k.trim(); if (t) keys.push(t); } }
        for (let i = 1; i <= 10; i++) { const nk = (process.env[`XAI_API_KEY_${i}`] || '').trim(); if (nk && !keys.includes(nk)) keys.push(nk); }
        return `${keys.length} key(s) configured` + (keys.length > 1 ? ' (round-robin rotation enabled)' : '');
      })(),
      XAI_API_KEY_1: mask(process.env.XAI_API_KEY_1),
      XAI_API_KEY_2: mask(process.env.XAI_API_KEY_2),
      XAI_API_KEY_3: mask(process.env.XAI_API_KEY_3),
    };

    // Check for common env var issues
    const envWarnings: string[] = [];
    for (const [key, value] of Object.entries(envDiagnostics)) {
      if (value.includes('len=') && !value.startsWith('(not set)')) {
        const lenMatch = value.match(/len=(\d+)/);
        if (lenMatch) {
          const len = parseInt(lenMatch[1]);
          // Check for suspiciously short keys
          if (len < 10 && !key.includes('MODEL') && !key.includes('BASE_URL') && !key.includes('REGION') && !key.includes('TIER')) {
            envWarnings.push(`${key} is suspiciously short (${len} chars) — might be truncated or incorrectly set`);
          }
          // Check for keys with quotes
          const rawVal = (process.env as any)[key];
          if (rawVal && (rawVal.startsWith('"') || rawVal.startsWith("'") || rawVal.endsWith('"') || rawVal.endsWith("'"))) {
            envWarnings.push(`${key} has quotes around the value — this will cause authentication failures`);
          }
          // Check for keys with trailing whitespace
          if (rawVal && (rawVal !== rawVal.trim())) {
            envWarnings.push(`${key} has leading/trailing whitespace — this will cause authentication failures`);
          }
        }
      }
    }
    // V392: Warn if Gemini key is set but GEMINI_TIER is not configured for paid subscriptions
    const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY);
    const geminiTierSet = !!process.env.GEMINI_TIER;
    if (hasGeminiKey && !geminiTierSet) {
      envWarnings.push('GEMINI_TIER is not set — defaults to "free" tier limits (1,200/day, 28 RPM, 10-min cooldown). If you have a paid Gemini subscription, set GEMINI_TIER=paid for much higher limits (50K/day, 500 RPM, 1-min cooldown).');
    }

    // ── Test each provider ──
    const providers = getProviderStatus();
    const results: Array<{
      provider: string;
      available: boolean;
      model: string;
      directTest: 'success' | 'failed' | 'skipped';
      duration?: number;
      content?: string;
      error?: string;
      actualUrl?: string;
    }> = [];

    for (const provider of providers) {
      const result: any = {
        provider: provider.provider,
        available: provider.available,
        model: provider.model,
        directTest: 'skipped' as const,
      };

      // Show the ACTUAL URL being used
      if (provider.provider === 'groq') result.actualUrl = 'https://api.groq.com/openai/v1/chat/completions';
      if (provider.provider === 'gemini') result.actualUrl = `https://generativelanguage.googleapis.com/{v1beta|v1}/models/${provider.model}:generateContent`;
      if (provider.provider === 'deepseek') result.actualUrl = `${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'}/chat/completions`;
      if (provider.provider === 'glm') result.actualUrl = `${process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'}/chat/completions`;
      if (provider.provider === 'hf') result.actualUrl = 'https://router.huggingface.co/v1/chat/completions';
      if (provider.provider === 'bedrock') result.actualUrl = `bedrock-runtime.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com (Converse API, model: ${provider.model})`;
      if (provider.provider === 'ollama') {
        const ollamaKey = process.env.OLLAMA_API_KEY;
        const ollamaUrl = process.env.OLLAMA_BASE_URL;
        const isRailwayEnv = !!(process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN);
        // V395: Show the ACTUAL endpoint that will be used
        let effectiveUrl = ollamaUrl || '(not set)';
        if (isRailwayEnv && ollamaUrl?.includes('localhost')) {
          effectiveUrl = `https://ollama.com/v1 (V395: localhost overridden on Railway)`;
        } else if (!ollamaUrl && ollamaKey) {
          effectiveUrl = 'https://ollama.com/v1 (V395: auto-detected from API key)';
        }
        result.actualUrl = provider.available ? `${provider.model} @ ${effectiveUrl}` : `UNAVAILABLE — ${effectiveUrl}`;
      }
      if (provider.provider === 'z-ai-sdk') {
        const zaiUrl = process.env.ZAI_BASE_URL;
        const isPrivateIp = zaiUrl && /^https?:\/\/(172\.|10\.|192\.168\.|127\.)/.test(zaiUrl);
        result.actualUrl = `SDK internal (ZAI_BASE_URL=${zaiUrl || 'not set'})${isPrivateIp ? ' ⚠️ PRIVATE IP — not reachable from Railway!' : ''}`;
      }
      if (provider.provider === 'cerebras') result.actualUrl = 'https://api.cerebras.ai/v1/chat/completions';
      if (provider.provider === 'mistral') result.actualUrl = 'https://api.mistral.ai/v1/chat/completions';
      if (provider.provider === 'nvidia') result.actualUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
      if (provider.provider === 'sambanova') result.actualUrl = 'https://api.sambanova.ai/v1/chat/completions';
      if (provider.provider === 'cohere') result.actualUrl = 'https://api.cohere.com/compatibility/v1/chat/completions';
      if (provider.provider === 'cloudflare') result.actualUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID || 'UNKNOWN'}/ai/v1/chat/completions`;
      if (provider.provider === 'siliconflow') result.actualUrl = 'https://api.siliconflow.com/v1/chat/completions'; // V396d: .com not .cn
      if (provider.provider === 'deepinfra') result.actualUrl = 'https://api.deepinfra.com/v1/openai/chat/completions';

      if (provider.available) {
        const testResult = await testProviderDirectly(provider.provider as AIProvider);
        result.directTest = testResult.success ? 'success' : 'failed';
        result.duration = testResult.duration;
        result.content = testResult.content;
        result.error = testResult.error;
      }

      // V392: Force-test Gemini even when unavailable (to see the actual API error)
      if (provider.provider === 'gemini' && !provider.available) {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
        if (geminiKey) {
          try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
            const testStart = Date.now();
            const testRes = await fetch(testUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
                generationConfig: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } },
              }),
              signal: AbortSignal.timeout(15000),
            });
            const testDuration = Date.now() - testStart;
            const testText = await testRes.text();
            result.directTest = testRes.ok ? 'success' : 'failed';
            result.duration = testDuration;
            result.error = `FORCED TEST (HTTP ${testRes.status}): ${testText.substring(0, 500)}`;
            if (testRes.ok) {
              try {
                const testData = JSON.parse(testText);
                result.content = testData.candidates?.[0]?.content?.parts?.[0]?.text || '(empty)';
              } catch { result.content = '(parse error)'; }
            }
          } catch (forceErr: any) {
            result.directTest = 'failed';
            result.error = `FORCED TEST ERROR: ${forceErr.name}: ${forceErr.message}`;
          }
        }
      }

      // V395: Force-test Mistral even when unavailable (to see the actual 401 error)
      if (provider.provider === 'mistral' && !provider.available) {
        const mistralKey = process.env.MISTRAL_API_KEY;
        if (mistralKey) {
          try {
            const testStart = Date.now();
            const testRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${mistralKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [{ role: 'user', content: 'Say OK' }],
                max_tokens: 5,
              }),
              signal: AbortSignal.timeout(15000),
            });
            const testDuration = Date.now() - testStart;
            const testText = await testRes.text();
            result.directTest = testRes.ok ? 'success' : 'failed';
            result.duration = testDuration;
            result.error = `FORCED TEST (HTTP ${testRes.status}): ${testText.substring(0, 500)}`;
            if (testRes.ok) {
              try {
                const testData = JSON.parse(testText);
                result.content = testData.choices?.[0]?.message?.content || '(empty)';
              } catch { result.content = '(parse error)'; }
            }
          } catch (forceErr: any) {
            result.directTest = 'failed';
            result.error = `FORCED TEST ERROR: ${forceErr.name}: ${forceErr.message}`;
          }
        }
      }

      results.push(result);
    }

    // Summary
    const workingProviders = results.filter(r => r.directTest === 'success');
    const failedProviders = results.filter(r => r.directTest === 'failed');
    const unavailableProviders = results.filter(r => !r.available);

    // ── V68 Health Status ──
    const v68Health = getV68ProviderStatus();

    // ── Together AI Image Generation Diagnostics ──
    const togetherDiagnostics: any = {
      apiKeySet: !!process.env.TOGETHER_API_KEY,
      model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
      testResult: 'skipped' as string,
    };

    if (process.env.TOGETHER_API_KEY) {
      try {
        const togetherStart = Date.now();
        const togetherRes = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: 'simple blue square on white background',
            width: 256,
            height: 256,
            steps: 1,
            n: 1,
            response_format: 'b64_json',
          }),
          signal: AbortSignal.timeout(30000),
        });
        const togetherDuration = Date.now() - togetherStart;

        if (togetherRes.ok) {
          const togetherData = await togetherRes.json() as any;
          const hasImage = !!(togetherData.data?.[0]?.b64_json || togetherData.data?.[0]?.url);
          togetherDiagnostics.testResult = hasImage ? 'SUCCESS' : 'FAILED (no image data)';
          togetherDiagnostics.duration = `${togetherDuration}ms`;
          if (togetherData.data?.[0]?.b64_json) {
            togetherDiagnostics.imageSizeKB = Math.round(togetherData.data[0].b64_json.length * 0.75 / 1024);
          }
        } else {
          const errText = await togetherRes.text().catch(() => '');
          togetherDiagnostics.testResult = `FAILED (HTTP ${togetherRes.status})`;
          togetherDiagnostics.error = errText.slice(0, 200);
          togetherDiagnostics.duration = `${togetherDuration}ms`;
          if (togetherRes.status === 401) {
            togetherDiagnostics.troubleshooting = 'Invalid API key — check TOGETHER_API_KEY value on Railway';
          } else if (togetherRes.status === 402) {
            togetherDiagnostics.troubleshooting = 'Payment required — FLUX.1-schnell-Free should be $0, check model name matches exactly';
          } else if (togetherRes.status === 429) {
            togetherDiagnostics.troubleshooting = 'Rate limited — free tier allows ~1 image/2s, this is temporary';
          }
        }
      } catch (togetherErr: any) {
        togetherDiagnostics.testResult = `FAILED (${togetherErr.name || 'error'})`;
        togetherDiagnostics.error = togetherErr.message?.slice(0, 200);
      }
    } else {
      togetherDiagnostics.testResult = 'skipped (TOGETHER_API_KEY not set)';
    }

    // ── Stable Horde Image Generation Diagnostics (V261: Non-blocking) ──
    const stableHordeDiagnostics: any = {
      status: 'skipped' as string,
      note: 'V261: Non-blocking — articles publish instantly with Canvas, AI images replace in background',
      mode: 'background (non-blocking)',
    };

    // V261: Also show count of pending background generations
    try {
      const { getPendingHordeGenerations } = await import('@/lib/pipeline/agents/imager');
      const pending = await getPendingHordeGenerations();
      stableHordeDiagnostics.pendingCount = pending.length;
      if (pending.length > 0) {
        stableHordeDiagnostics.pendingArticles = pending.map(p => ({ articleId: p.articleId, generationId: p.generationId }));
      }
    } catch { /* ignore */ }

    try {
      const hordeStart = Date.now();
      // Use configured API key if available
      const hordeApiKey = (process.env.STABLEHORDE_API_KEY && process.env.STABLEHORDE_API_KEY.length >= 30)
        ? process.env.STABLEHORDE_API_KEY : '0000000000';
      const hordeSubmitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Agent': 'RouaTradingNews-Diag:1.0', 'apikey': hordeApiKey },
        body: JSON.stringify({
          prompt: 'simple blue square on white background',
          params: { width: 256, height: 256, steps: 10, cfg_scale: 7, n: 1 },
          nsfw: false,
          models: ['SDXL 1.0'],
          r2: true,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!hordeSubmitRes.ok) {
        const errText = await hordeSubmitRes.text().catch(() => '');
        stableHordeDiagnostics.status = 'FAILED (submit)';
        stableHordeDiagnostics.httpStatus = hordeSubmitRes.status;
        stableHordeDiagnostics.error = errText.slice(0, 200);
      } else {
        const submitData = await hordeSubmitRes.json() as any;
        const genId = submitData.id;
        if (!genId) {
          stableHordeDiagnostics.status = 'FAILED (no generation ID)';
        } else {
          stableHordeDiagnostics.generationId = genId;
          stableHordeDiagnostics.status = 'SUBMITTED';
          stableHordeDiagnostics.note = 'V261: Diagnostics no longer waits for completion — use /api/cron/horde-poll to check';
          const hordeDuration = Date.now() - hordeStart;
          stableHordeDiagnostics.submitDuration = `${hordeDuration}ms`;
        }
      }
    } catch (hordeErr: any) {
      stableHordeDiagnostics.status = `FAILED (${hordeErr.name || 'error'})`;
      stableHordeDiagnostics.error = hordeErr.message?.slice(0, 200);
    }

    // ── V97 R2 Image Storage Diagnostics ──
    const r2Diagnostics = {
      available: isR2Available(),
      configured: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME),
      hasPublicUrl: !!process.env.R2_PUBLIC_URL,
      envVars: {
        R2_ACCOUNT_ID: mask(process.env.R2_ACCOUNT_ID),
        R2_ACCESS_KEY_ID: mask(process.env.R2_ACCESS_KEY_ID),
        R2_SECRET_ACCESS_KEY: mask(process.env.R2_SECRET_ACCESS_KEY),
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '(not set)',
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '(not set)',
      },
      warnings: [] as string[],
    };
    if (!r2Diagnostics.configured) {
      r2Diagnostics.warnings.push('R2 credentials not fully configured — images will be stored as base64 in DB (causes bloat)');
    }
    if (r2Diagnostics.configured && !r2Diagnostics.hasPublicUrl) {
      r2Diagnostics.warnings.push('R2 credentials set but R2_PUBLIC_URL missing — uploads will succeed but URLs will be unreachable, falling back to base64');
    }
    if (r2Diagnostics.configured && r2Diagnostics.hasPublicUrl && !r2Diagnostics.available) {
      r2Diagnostics.warnings.push('R2 fully configured but recently failed — circuit breaker active, will retry after cooldown');
    }

    // ── V97: Direct R2 connection test ──
    let r2ConnectionTest: any = { tested: false };
    if (r2Diagnostics.configured) {
      try {
        const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const accountId = process.env.R2_ACCOUNT_ID!;
        const testClient = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        const start = Date.now();
        // ListObjectsV2 is more widely supported than HeadBucket on R2
        const result = await testClient.send(new ListObjectsV2Command({ 
          Bucket: process.env.R2_BUCKET_NAME!, 
          MaxKeys: 1 
        }));
        const duration = Date.now() - start;
        r2ConnectionTest = { 
          tested: true, 
          success: true, 
          duration,
          objectCount: result.KeyCount ?? 0,
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          bucket: process.env.R2_BUCKET_NAME,
        };
        testClient.destroy();
      } catch (r2Err: any) {
        // Extract as much error detail as possible
        const errDetails: any = {
          message: r2Err.message,
          name: r2Err.name,
          code: r2Err.Code || r2Err.$metadata?.httpStatusCode,
        };
        if (r2Err.$metadata) {
          errDetails.httpStatusCode = r2Err.$metadata.httpStatusCode;
          errDetails.requestId = r2Err.$metadata.requestId;
          errDetails.extendedRequestId = r2Err.$metadata.extendedRequestId;
        }
        if (r2Err.$response) {
          errDetails.responseStatus = r2Err.$response.status;
        }
        // Check for common issues
        const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        r2ConnectionTest = { 
          tested: true, 
          success: false, 
          error: errDetails,
          endpoint,
          bucket: process.env.R2_BUCKET_NAME,
          troubleshooting: [
            '1. Verify R2_ACCOUNT_ID is your Cloudflare Account ID (found in Cloudflare Dashboard URL)',
            '2. Verify R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are from an R2 API Token (not AWS IAM)',
            '3. Create R2 API Token: Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token',
            '4. Token must have "Object Read & Write" permission on bucket "roua-assets"',
            '5. Verify bucket "roua-assets" exists in your Cloudflare R2 dashboard',
          ],
        };
      }
    }

    // ── Check DB for image storage type distribution ──
    let imageStorageStats = { r2: 0, base64: 0, filesystem: 0, empty: 0, total: 0 };
    try {
      const { db } = await import('@/lib/db');
      const articles = await db.newsItem.findMany({
        where: { isPublished: true },
        // Case C: genuinely needs generatedImage data for storage type distribution stats (admin diagnostic, very low traffic)
      select: { generatedImage: true },
        take: 200,
      });
      imageStorageStats.total = articles.length;
      for (const a of articles) {
        const gi = a.generatedImage || '';
        if (!gi) { imageStorageStats.empty++; continue; }
        if (gi.includes('.r2.dev/') || gi.includes('.r2.cloudflarestorage.com/') || (process.env.R2_PUBLIC_URL && gi.startsWith(process.env.R2_PUBLIC_URL))) {
          imageStorageStats.r2++;
        } else if (gi.startsWith('data:image') || (gi.length > 200 && /^[A-Za-z0-9+/=]+$/.test(gi.slice(gi.indexOf('base64,') > -1 ? gi.indexOf('base64,') + 7 : 0, 100)))) {
          imageStorageStats.base64++;
        } else if (gi.startsWith('/article-images/')) {
          imageStorageStats.filesystem++;
        } else {
          imageStorageStats.base64++; // External URL or other — treat as non-R2
        }
      }
    } catch (dbErr: any) {
      imageStorageStats.total = -1; // Indicates error
    }

    return NextResponse.json({
      version: 'V68',
      v68Config: {
        defaultModel: V68_DEFAULT_MODEL,
        providerPriority: V68_PROVIDER_PRIORITY,
        pipeline: '4-gate (Relevance → Quality → Sentiment → Priority)',
      },
      envDiagnostics,
      envWarnings,
      // V392: Detailed Gemini tier diagnostics
      geminiTierInfo: {
        tier: getGeminiTier(),
        envVar: process.env.GEMINI_TIER || '(not set)',
        effectiveLimits: getGeminiTier() === 'paid'
          ? { dailyLimit: 50000, rpmLimit: 500, cooldownSeconds: 60 }
          : { dailyLimit: 1200, rpmLimit: 28, cooldownSeconds: 600 },
        keyConfigured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY),
        keySource: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_AI_STUDIO_API_KEY ? 'GOOGLE_AI_STUDIO_API_KEY' : 'none',
        recommendation: !process.env.GEMINI_TIER && (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY)
          ? 'Set GEMINI_TIER=paid in Railway env vars to unlock paid-tier limits (50K/day, 500 RPM)'
          : undefined,
      },
      togetherImageGen: togetherDiagnostics,
      stableHordeImageGen: stableHordeDiagnostics,
      r2Storage: r2Diagnostics,
      r2ConnectionTest,
      imageStorageStats,
      summary: {
        total: providers.length,
        available: providers.filter(p => p.available).length,
        working: workingProviders.length,
        failed: failedProviders.length,
        unavailable: unavailableProviders.length,
        pipelineCanFunction: workingProviders.length > 0,
        recommendedProvider: V68_PROVIDER_PRIORITY.find(p =>
          results.find(r => r.provider === p && r.directTest === 'success')
        ) || 'none',
      },
      providers: results,
      v68Health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      version: 'V68',
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
