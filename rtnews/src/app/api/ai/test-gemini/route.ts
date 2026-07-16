// V392: Direct Gemini test endpoint for debugging key/tier issues
import { NextResponse } from 'next/server';
import { getGeminiTier, resetGeminiQuota } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
  const tier = getGeminiTier();
  const model = process.env.GEMINI_MODEL || '(not set)';

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'No Gemini API key configured (GEMINI_API_KEY or GOOGLE_AI_STUDIO_API_KEY)',
      tier,
      model,
    }, { status: 400 });
  }

  // First, reset quota to ensure we can test
  resetGeminiQuota();

  const results: any = {
    tier,
    model,
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 4),
    tests: [],
  };

  // Test 1: List models endpoint (lightweight, no token cost)
  try {
    const listStart = Date.now();
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl, { signal: AbortSignal.timeout(10000) });
    const listDuration = Date.now() - listStart;
    const listText = await listRes.text();

    results.tests.push({
      name: 'list_models',
      url: listUrl.replace(apiKey, '***'),
      status: listRes.status,
      duration: listDuration,
      ok: listRes.ok,
      response: listText.substring(0, 500),
    });
  } catch (err: any) {
    results.tests.push({
      name: 'list_models',
      error: err.message,
      errorName: err.name,
    });
  }

  // Test 2: Generate content with gemini-2.5-flash (primary model)
  try {
    const genStart = Date.now();
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const genRes = await fetch(genUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
        generationConfig: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const genDuration = Date.now() - genStart;
    const genText = await genRes.text();

    results.tests.push({
      name: 'generate_2.5_flash',
      url: genUrl.replace(apiKey, '***'),
      status: genRes.status,
      duration: genDuration,
      ok: genRes.ok,
      response: genText.substring(0, 800),
    });
  } catch (err: any) {
    results.tests.push({
      name: 'generate_2.5_flash',
      error: err.message,
      errorName: err.name,
    });
  }

  // Test 3: Generate content with gemini-2.0-flash (fallback model)
  try {
    const gen2Start = Date.now();
    const gen2Url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const gen2Res = await fetch(gen2Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const gen2Duration = Date.now() - gen2Start;
    const gen2Text = await gen2Res.text();

    results.tests.push({
      name: 'generate_2.0_flash',
      url: gen2Url.replace(apiKey, '***'),
      status: gen2Res.status,
      duration: gen2Duration,
      ok: gen2Res.ok,
      response: gen2Text.substring(0, 800),
    });
  } catch (err: any) {
    results.tests.push({
      name: 'generate_2.0_flash',
      error: err.message,
      errorName: err.name,
    });
  }

  // Summary
  const successCount = results.tests.filter((t: any) => t.ok).length;
  results.summary = {
    totalTests: results.tests.length,
    successCount,
    failedCount: results.tests.length - successCount,
    geminiWorking: successCount > 0,
  };

  return NextResponse.json(results);
}
