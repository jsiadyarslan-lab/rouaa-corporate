// ─── Ollama Quick Test Endpoint ────────────────────────────────
// Tests the primary Ollama Cloud model only (fast, single request).

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.OLLAMA_API_KEY;
  const baseUrl = process.env.OLLAMA_BASE_URL || '';
  const envModel = process.env.OLLAMA_MODEL || 'gemma3:12b';

  const results: any = {
    envVars: {
      OLLAMA_API_KEY: apiKey ? `${apiKey.slice(0, 4)}***[len=${apiKey.length}]` : '(not set)',
      OLLAMA_BASE_URL: baseUrl || '(not set)',
      OLLAMA_MODEL: envModel,
    },
    test: null as any,
  };

  if (!apiKey) {
    results.test = { error: 'OLLAMA_API_KEY not set' };
    return NextResponse.json(results, { status: 200 });
  }

  // Normalize URL
  let effectiveUrl = baseUrl;
  if (effectiveUrl.includes('api.ollama.com')) {
    effectiveUrl = effectiveUrl.replace('api.ollama.com', 'ollama.com');
  }
  if (effectiveUrl.includes('ollama.com') && !effectiveUrl.includes('/v1')) {
    effectiveUrl = effectiveUrl.replace(/\/?$/, '/v1');
  }
  const endpoint = effectiveUrl || 'https://ollama.com/v1';

  // Test primary model
  const testStart = Date.now();
  try {
    const https = await import('https');
    const url = new URL(`${endpoint}/chat/completions`);
    const body = JSON.stringify({
      model: envModel,
      messages: [{ role: 'user', content: 'Say OK' }],
      temperature: 0,
      max_tokens: 5,
    });

    const result = await new Promise<any>((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 20000,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(body);
      req.end();
    });

    const duration = Date.now() - testStart;
    let data: any = null;
    try { data = JSON.parse(result.body); } catch {}

    results.test = {
      model: envModel,
      status: result.status,
      duration,
      success: result.status === 200 && !!data?.choices?.[0]?.message?.content,
      content: data?.choices?.[0]?.message?.content?.slice(0, 50) || undefined,
      error: result.status === 403 ? 'Subscription required for this model' :
             result.status === 404 ? 'Model not found' :
             result.status !== 200 ? result.body.slice(0, 100) : undefined,
    };
  } catch (err: any) {
    results.test = {
      model: envModel,
      duration: Date.now() - testStart,
      success: false,
      error: `${err.message} (code: ${err.code || 'unknown'})`,
    };
  }

  return NextResponse.json(results, { status: 200 });
}
