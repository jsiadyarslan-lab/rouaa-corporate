// ─── Image Generation Test API (V1) ────────────────────────────
// Tests all AI image generation methods and returns detailed diagnostics.
// Call: GET /api/video/test-image-gen
// This helps identify WHY images fail in video renderers on Railway.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local',
    apiKeys: {},
    tests: {},
  };

  // ── Step 1: Check which API keys are configured ──
  const togetherKey = process.env.TOGETHER_API_KEY;
  const hfKey = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;

  results.apiKeys = {
    TOGETHER_API_KEY: togetherKey
      ? `SET (${togetherKey.length} chars, starts: ${togetherKey.slice(0, 6)}..., ends: ...${togetherKey.slice(-4)})`
      : 'NOT SET',
    HF_API_KEY: process.env.HF_API_KEY
      ? `SET (${process.env.HF_API_KEY.length} chars, starts: ${process.env.HF_API_KEY.slice(0, 6)}...)`
      : 'NOT SET',
    HF_API_TOKEN: process.env.HF_API_TOKEN
      ? `SET (${process.env.HF_API_TOKEN.length} chars, starts: ${process.env.HF_API_TOKEN.slice(0, 6)}...)`
      : 'NOT SET',
    HF_TOKEN: process.env.HF_TOKEN
      ? `SET (${process.env.HF_TOKEN.length} chars, starts: ${process.env.HF_TOKEN.slice(0, 6)}...)`
      : 'NOT SET',
    combinedHF: hfKey
      ? `SET (${hfKey.length} chars, starts: ${hfKey.slice(0, 6)}..., ends: ...${hfKey.slice(-4)})`
      : 'NOT SET',
    ZAI_BASE_URL: process.env.ZAI_BASE_URL ? 'SET' : 'NOT SET',
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
  };

  // ── Step 2: Test Together AI ──
  if (togetherKey) {
    const togetherStart = Date.now();
    try {
      const testPrompt = 'A simple blue circle on white background, minimalist, no text';
      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell-Free',
          prompt: testPrompt,
          width: 256,
          height: 256,
          steps: 1,
          n: 1,
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(30000),
      });

      const responseText = await response.text();
      let parsed: any = null;
      try { parsed = JSON.parse(responseText); } catch {}

      results.tests.togetherAI = {
        status: response.status,
        statusText: response.statusText,
        duration: `${Date.now() - togetherStart}ms`,
        hasImageData: !!(parsed?.data?.[0]?.b64_json),
        imageDataLength: parsed?.data?.[0]?.b64_json?.length || 0,
        error: parsed?.error || parsed?.message || null,
        model: 'black-forest-labs/FLUX.1-schnell-Free',
        rawResponse: responseText.slice(0, 500),
      };

      // If free model fails, try paid model
      if (response.status !== 200) {
        const paidStart = Date.now();
        try {
          const paidResponse = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${togetherKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'black-forest-labs/FLUX.1-schnell',
              prompt: testPrompt,
              width: 256,
              height: 256,
              steps: 1,
              n: 1,
              response_format: 'b64_json',
            }),
            signal: AbortSignal.timeout(30000),
          });

          const paidText = await paidResponse.text();
          let paidParsed: any = null;
          try { paidParsed = JSON.parse(paidText); } catch {}

          results.tests.togetherAIPaid = {
            status: paidResponse.status,
            statusText: paidResponse.statusText,
            duration: `${Date.now() - paidStart}ms`,
            hasImageData: !!(paidParsed?.data?.[0]?.b64_json),
            error: paidParsed?.error || paidParsed?.message || null,
            model: 'black-forest-labs/FLUX.1-schnell',
            rawResponse: paidText.slice(0, 500),
          };
        } catch (paidErr: any) {
          results.tests.togetherAIPaid = {
            error: paidErr.message,
            duration: `${Date.now() - paidStart}ms`,
          };
        }
      }
    } catch (err: any) {
      results.tests.togetherAI = {
        error: err.message,
        duration: `${Date.now() - togetherStart}ms`,
      };
    }
  } else {
    results.tests.togetherAI = { skipped: 'TOGETHER_API_KEY not set' };
  }

  // ── Step 3: Test HuggingFace Inference API ──
  if (hfKey) {
    const hfStart = Date.now();
    try {
      const testPrompt = 'A simple blue circle on white background, minimalist, no text';
      const hfUrl = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';
      const response = await fetch(hfUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testPrompt,
          parameters: { width: 256, height: 256, num_inference_steps: 4 },
        }),
        signal: AbortSignal.timeout(60000),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        results.tests.huggingFace = {
          status: response.status,
          duration: `${Date.now() - hfStart}ms`,
          hasImageData: true,
          imageDataLength: buffer.length,
          contentType,
          model: 'black-forest-labs/FLUX.1-schnell',
        };
      } else {
        const text = await response.text();
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch {}
        results.tests.huggingFace = {
          status: response.status,
          duration: `${Date.now() - hfStart}ms`,
          hasImageData: false,
          contentType,
          error: parsed?.error || text.slice(0, 300),
          model: 'black-forest-labs/FLUX.1-schnell',
          isLoading: text.includes('loading'),
          rawResponse: text.slice(0, 500),
        };
      }
    } catch (err: any) {
      results.tests.huggingFace = {
        error: err.message,
        duration: `${Date.now() - hfStart}ms`,
      };
    }
  } else {
    results.tests.huggingFace = { skipped: 'No HF_API_KEY/HF_API_TOKEN/HF_TOKEN set' };
  }

  // ── Step 4: Test Pollinations ──
  const pollStart = Date.now();
  try {
    // Health check first
    const healthRes = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    results.tests.pollinationsHealth = {
      status: healthRes.status,
      ok: healthRes.ok,
      duration: `${Date.now() - pollStart}ms`,
    };

    if (healthRes.ok) {
      const imgStart = Date.now();
      try {
        const imgRes = await fetch('https://image.pollinations.ai/prompt/blue%20circle%20on%20white%20background?width=256&height=256&nologo=true&model=flux', {
          headers: { 'User-Agent': 'RouaTest/1.0', 'Accept': 'image/*' },
          signal: AbortSignal.timeout(30000),
        });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const header = buffer.slice(0, 4).toString('hex');
          results.tests.pollinationsImage = {
            status: imgRes.status,
            ok: true,
            duration: `${Date.now() - imgStart}ms`,
            imageDataLength: buffer.length,
            header,
            isJPEG: header.startsWith('ffd8'),
            isPNG: header.startsWith('89504'),
          };
        } else {
          results.tests.pollinationsImage = {
            status: imgRes.status,
            ok: false,
            duration: `${Date.now() - imgStart}ms`,
          };
        }
      } catch (imgErr: any) {
        results.tests.pollinationsImage = {
          error: imgErr.message,
          duration: `${Date.now() - imgStart}ms`,
        };
      }
    }
  } catch (err: any) {
    results.tests.pollinationsHealth = {
      error: err.message,
      duration: `${Date.now() - pollStart}ms`,
    };
  }

  // ── Summary ──
  const working = Object.entries(results.tests)
    .filter(([_, v]: [string, any]) => v.hasImageData || v.ok)
    .map(([k]) => k);

  results.summary = {
    workingMethods: working,
    totalMethods: 3,
    recommendation: working.length === 0
      ? 'ALL methods failed. Check API keys and network access. Most likely: TOGETHER_API_KEY is not set or invalid on Railway.'
      : `${working.length}/3 methods work. Videos should generate images using: ${working.join(', ')}`,
  };

  return NextResponse.json(results, { status: 200 });
}
