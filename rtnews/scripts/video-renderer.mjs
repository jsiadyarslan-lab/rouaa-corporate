#!/usr/bin/env node
// ─── Professional Video Renderer V5 ──────────────────────────────
// FPS-based Playwright pipeline for Bloomberg/CNBC-style Arabic trading news videos
//
// V339 CRITICAL FIX: Register unhandled rejection handler IMMEDIATELY at top level.
// SDK (z-ai-web-dev-sdk) can throw 429 "Too many requests" errors internally
// that crash the process if not caught. This must be registered before any imports.
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[V339] Unhandled rejection (suppressed): ${String(reason)?.slice(0, 200)}`);
  // Don't exit — SDK 429 errors are handled by Promise.allSettled in generateAIImage
});
//
// Architecture:
//   - Each "pulse" (scene) renders at 24 FPS using frame-by-frame screenshots
//   - HTML includes a window.setAnimationProgress(p) function (0→1) that updates all animated elements
//   - Playwright sets the HTML once per pulse, calls page.evaluate() to advance animation per frame, then screenshots
//   - FFmpeg stitches PNG frames at 24fps + voiceover into final video
//   - AI images via Cloudflare Workers AI (PRIMARY) → Together AI → Pollinations → HuggingFace
//
// 6 Pulses (V21: max 130s / ~2min, compressed):
//   1. Ignition  (0-5s,     120 frames)  — FAST title + impact badge flash
//   2. Shock     (5-35s,    720 frames)  — Key stats + gauge + key points — THE core
//   3. Race      (35-60s,   600 frames)  — Technical indicators + analysis chart
//   4. Alert     (60-85s,   600 frames)  — Scenarios with probabilities
//   5. Takeaway  (85-110s,  600 frames)  — Strategic takeaways + recommendations
//   6. Harvest   (110-130s, 480 frames)  — Quick closing + brand fade out
//
// Usage:
//   node scripts/video-renderer-v5.mjs --input /path/to/data.json --output /path/to/output.mp4

import { chromium } from 'playwright';
import { execSync, spawnSync, execFile } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync, rmSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// ─── Download image from URL (for article images from R2) ─────────
// Downloads an image from a URL and returns a Buffer, or null on failure.
// This is used to reuse article images instead of generating new AI images.
async function downloadImageFromUrl(url) {
  try {
    console.log(`[V5]   Downloading article image from: ${url.slice(0, 80)}...`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RouaVideoRenderer/1.0', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      console.warn(`[V5]   Download failed: HTTP ${response.status}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) {
      console.warn(`[V5]   Downloaded image too small (${buffer.length} bytes)`);
      return null;
    }
    console.log(`[V5]   Article image downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);
    return buffer;
  } catch (err) {
    console.warn(`[V5]   Download error: ${err.message}`);
    return null;
  }
}

// ─── AI Image Generation (V350: Cloudflare Workers AI primary) ─────────
// V350: Cloudflare Workers AI as PRIMARY (same API key that works for news & infographics)
// Priority: Cloudflare AI (FREE, fast 5-15s) → Together AI → Pollinations → HuggingFace
// Removed: Pexels, SDK, CLI, Gradient — user wants AI-generated images ONLY

// V342: Pollinations health check cache — same as news imager (imager.ts)
let _pollinationsLastCheck = 0;
let _pollinationsAvailable = true;
const POLLINATIONS_CHECK_INTERVAL_MS = 120_000; // Check every 2 minutes

async function isPollinationsAvailable() {
  const now = Date.now();
  if (now - _pollinationsLastCheck < POLLINATIONS_CHECK_INTERVAL_MS) {
    return _pollinationsAvailable;
  }
  _pollinationsLastCheck = now;
  try {
    // V348: Use GET instead of HEAD — HEAD returns 200 on cloud IPs but GET returns 402
    // This properly detects when Pollinations blocks cloud/datacenter IPs
    const res = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true', {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    _pollinationsAvailable = res.ok && res.headers.get('content-type')?.startsWith('image/');
  } catch {
    _pollinationsAvailable = false;
  }
  if (!_pollinationsAvailable) {
    console.warn('[V342] ⚠ Pollinations appears to be DOWN/402 — will use fallbacks');
  }
  return _pollinationsAvailable;
}

async function generateImagePollinations(prompt, width, height) {
  // V346: Pollinations is the PRIMARY working method (Together AI out of credits, HF fetch fails)
  // Health check confirms Pollinations is UP (200 OK), but image generation needs >30s.
  // Try multiple strategies with increasing patience:
  //   1. model=flux (best quality) with 120s timeout
  //   2. default model (faster) with 90s timeout
  //   3. model=flux with smaller dimensions (faster generation)
  const pollUp = await isPollinationsAvailable();
  if (!pollUp) {
    console.warn('[V346]   Pollinations: skipped (health check failed)');
    return null;
  }

  // Strip non-ASCII characters (Arabic etc.) — Pollinations works best with English-only prompts
  let cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  const shortPrompt = cleanPrompt.length > 200 ? cleanPrompt.substring(0, 197) + '...' : cleanPrompt;

  // V346: Multiple strategies — flux is slow but high quality, default is faster, smaller dims also faster
  const strategies = [
    { name: 'flux', model: 'flux', w: width, h: height, timeout: 120000 },
    { name: 'default', model: null, w: width, h: height, timeout: 90000 },
    { name: 'flux-small', model: 'flux', w: 1024, h: 576, timeout: 90000 },
  ];

  for (const strategy of strategies) {
    try {
      const seed = Date.now() + Math.floor(Math.random() * 10000);
      let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=${strategy.w}&height=${strategy.h}&nologo=true&seed=${seed}`;
      if (strategy.model) url += `&model=${strategy.model}`;

      console.log(`[V346]   Pollinations (${strategy.name}): ${shortPrompt.length} chars, timeout=${strategy.timeout/1000}s...`);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RouaVideoRenderer/1.0', 'Accept': 'image/*' },
        signal: AbortSignal.timeout(strategy.timeout),
      });
      if (!response.ok) {
        console.warn(`[V346]   Pollinations (${strategy.name}): HTTP ${response.status}`);
        if (response.status === 402 || response.status === 429) {
          _pollinationsAvailable = false;
          return null; // Rate-limited — don't try other strategies
        }
        continue; // Try next strategy
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 5000) {
        console.warn(`[V346]   Pollinations (${strategy.name}): image too small (${buffer.length} bytes)`);
        continue;
      }
      // Validate it's actually an image (not an HTML error page)
      const header = buffer.slice(0, 4).toString('hex');
      const isJPEG = header.startsWith('ffd8');
      const isPNG = header.startsWith('89504');
      const isWebP = header.startsWith('5249');
      if (!isJPEG && !isPNG && !isWebP) {
        console.warn(`[V346]   Pollinations (${strategy.name}): not a valid image (header: ${header})`);
        continue;
      }
      console.log(`[V346]   Pollinations (${strategy.name}): SUCCESS (${(buffer.length / 1024).toFixed(0)}KB, ${isJPEG ? 'JPEG' : isPNG ? 'PNG' : 'WebP'})`);
      return buffer;
    } catch (err) {
      console.warn(`[V346]   Pollinations (${strategy.name}): ${err.message?.slice(0, 80)}`);
      // Continue to next strategy
    }
  }

  console.warn(`[V346]   Pollinations: ALL strategies failed`);
  return null;
}

// V350: Removed generateImageSDK, generateImageCLI, generateImagePexels, generateGradientFallback
// User wants ONLY AI-generated images: Cloudflare → Together → Pollinations → HuggingFace

// ─── Together AI — FLUX.1-schnell-Free ($0 forever) ─────────────
// V345: Improved — tries multiple models if first fails, better error handling
let _togetherLastRequestTime = 0;
const TOGETHER_MIN_INTERVAL_MS = 3000;
const TOGETHER_MODEL_FALLBACKS = [
  'black-forest-labs/FLUX.1-schnell-Free',  // FREE forever — should always work
  'black-forest-labs/FLUX.1-schnell',        // Paid — fallback if Free model is overloaded
  'stabilityai/stable-diffusion-xl-base-1.0', // Alternative — different provider
];

async function generateImageTogether(prompt, width, height) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log(`[V345]   Together: skipped (TOGETHER_API_KEY not set)`);
    return null;
  }
  try {
    const timeSinceLast = Date.now() - _togetherLastRequestTime;
    if (timeSinceLast < TOGETHER_MIN_INTERVAL_MS) {
      await new Promise(r => setTimeout(r, TOGETHER_MIN_INTERVAL_MS - timeSinceLast));
    }
    _togetherLastRequestTime = Date.now();

    // V345: Try multiple models — Free first, then paid fallbacks
    for (const model of TOGETHER_MODEL_FALLBACKS) {
      const isFree = model.includes('-Free');
      console.log(`[V345]   Together AI: trying ${model}${isFree ? ' (FREE)' : ''}...`);
      try {
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt,
            width: 1344,
            height: 768,
            steps: 4,
            n: 1,
            response_format: 'b64_json',
          }),
          signal: AbortSignal.timeout(90000),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn(`[V345]   Together ${model}: HTTP ${response.status} — ${errText.slice(0, 80)}`);
          if (response.status === 402) {
            if (isFree) {
              console.warn(`[V345]   Together Free model 402 — trying paid fallback...`);
              continue; // Try next model
            }
            return null; // All models 402
          }
          if (response.status === 429) {
            console.warn(`[V345]   Together rate limited — waiting 5s before next model...`);
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          continue; // Try next model for other errors too
        }

        const result = await response.json();
        if (result.data?.[0]?.b64_json) {
          const buffer = Buffer.from(result.data[0].b64_json, 'base64');
          if (buffer.length < 5000) { console.warn(`[V345]   Together ${model}: image too small`); continue; }
          console.log(`[V345]   Together ${model}: SUCCESS (${(buffer.length / 1024).toFixed(0)}KB)`);
          return buffer;
        }
        if (result.data?.[0]?.url) {
          const imgRes = await fetch(result.data[0].url, { signal: AbortSignal.timeout(30000) });
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            if (buffer.length > 5000) { console.log(`[V345]   Together ${model}: SUCCESS via URL (${(buffer.length / 1024).toFixed(0)}KB)`); return buffer; }
          }
        }
        console.warn(`[V345]   Together ${model}: unexpected response format`);
        continue;
      } catch (modelErr) {
        console.warn(`[V345]   Together ${model}: ${modelErr.message?.slice(0, 80)}`);
        continue;
      }
    }
    console.warn(`[V345]   Together: ALL models failed`);
    return null;
  } catch (err) {
    console.warn(`[V345]   Together failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

// ─── HuggingFace Inference API (V345) ─────────────
// Uses HF_API_TOKEN that IS configured on Railway — this WORKS for news imager!
// V345: Improved — longer cold-start waits (up to 120s), more retries, better logging
const HF_MODEL_FALLBACKS = [
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
];

async function generateImageHuggingFace(prompt, width, height) {
  const hfToken = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  if (!hfToken || hfToken.length < 10) {
    console.log(`[V345]   HuggingFace: skipped (no HF_API_TOKEN)`);
    return null;
  }
  try {
    const cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();

    for (const model of HF_MODEL_FALLBACKS) {
      const hfUrl = `https://api-inference.huggingface.co/models/${model}`;
      const isFluxModel = model.includes('FLUX');
      console.log(`[V345]   HuggingFace: trying ${model}...`);

      try {
        const response = await fetch(hfUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: cleanPrompt,
            parameters: {
              width: Math.min(width, 1024), // HF max is usually 1024 for free
              height: Math.min(height, 1024),
              num_inference_steps: isFluxModel ? 4 : 20,
            },
          }),
          signal: AbortSignal.timeout(90000), // V345: Increased from 60s to 90s
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          if (response.status === 402) {
            console.warn(`[V345]   HuggingFace ${model}: 402 (credits depleted) — trying next model`);
            continue;
          }
          if (response.status === 503 && errText.includes('loading')) {
            // V345: Increased wait time from 20s to 60s for model cold-start
            const wait = Math.min(60, parseInt(errText.match(/estimated_time.*?(\d+\.?\d*)/)?.[1] || '30'));
            console.log(`[V345]   HuggingFace ${model}: model cold-starting, waiting ${wait}s...`);
            await new Promise(r => setTimeout(r, wait * 1000));
            // V345: Retry up to 2 times with longer waits
            for (let retry = 1; retry <= 2; retry++) {
              console.log(`[V345]   HuggingFace ${model}: retry ${retry}/2...`);
              const retryRes = await fetch(hfUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: cleanPrompt, parameters: { width: Math.min(width, 1024), height: Math.min(height, 1024), num_inference_steps: isFluxModel ? 4 : 20 } }),
                signal: AbortSignal.timeout(90000),
              });
              if (retryRes.ok) {
                const retryBuf = Buffer.from(await retryRes.arrayBuffer());
                if (retryBuf.length > 5000) {
                  const header = retryBuf.slice(0, 4).toString('hex');
                  const isJPEG = header.startsWith('ffd8');
                  const isPNG = header.startsWith('89504');
                  if (isJPEG || isPNG) {
                    console.log(`[V345]   HuggingFace ${model}: SUCCESS after retry ${retry} (${(retryBuf.length/1024).toFixed(0)}KB)`);
                    return retryBuf;
                  }
                  console.warn(`[V345]   HuggingFace ${model}: not a valid image after retry (header: ${header})`);
                  continue;
                }
              }
              if (retryRes.status === 503) {
                console.log(`[V345]   HuggingFace ${model}: still loading, waiting 30s more...`);
                await new Promise(r => setTimeout(r, 30000));
                continue;
              }
              console.warn(`[V345]   HuggingFace ${model}: retry ${retry} failed (${retryRes.status})`);
            }
            continue;
          }
          if (response.status === 429) {
            console.warn(`[V345]   HuggingFace: rate limited — skipping`);
            return null;
          }
          console.warn(`[V345]   HuggingFace ${model}: HTTP ${response.status} — ${errText.slice(0, 100)}`);
          continue;
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        if (imageBuffer.length > 5000) {
          // Validate it's an image
          const header = imageBuffer.slice(0, 4).toString('hex');
          const isJPEG = header.startsWith('ffd8');
          const isPNG = header.startsWith('89504');
          if (isJPEG || isPNG) {
            console.log(`[V343]   HuggingFace ${model}: SUCCESS (${(imageBuffer.length/1024).toFixed(0)}KB, ${isJPEG ? 'JPEG' : 'PNG'})`);
            return imageBuffer;
          }
          console.warn(`[V343]   HuggingFace ${model}: not a valid image (header: ${header})`);
          continue;
        }
        console.warn(`[V343]   HuggingFace ${model}: image too small (${imageBuffer.length} bytes)`);
        continue;
      } catch (modelErr) {
        console.warn(`[V343]   HuggingFace ${model}: ${modelErr.message?.slice(0, 80)}`);
        continue;
      }
    }
    console.warn(`[V343]   HuggingFace: all models failed`);
    return null;
  } catch (err) {
    console.warn(`[V343]   HuggingFace failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

// ── V347: Pollinations rate limiter — prevent 429 from too many concurrent requests ──
// Pollinations with model=flux generates in ~1s, but concurrent requests cause rate limiting.
// Enforce 3s between Pollinations image requests to avoid 429 errors.
let _pollinationsLastImageRequest = 0;
const POLLINATIONS_IMAGE_MIN_INTERVAL_MS = 3000; // 3s between image requests

async function pollinationsRateLimitWait() {
  const timeSinceLast = Date.now() - _pollinationsLastImageRequest;
  if (timeSinceLast < POLLINATIONS_IMAGE_MIN_INTERVAL_MS) {
    const waitMs = POLLINATIONS_IMAGE_MIN_INTERVAL_MS - timeSinceLast;
    console.log(`[V347]   Pollinations rate limit: waiting ${waitMs}ms...`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  _pollinationsLastImageRequest = Date.now();
}

// V347: Cache Together AI 402 status — don't keep retrying a broken API
let _together402Cached = false;
let _together402Time = 0;
const TOGETHER_402_CACHE_MS = 300_000; // Cache 402 for 5 minutes

// V347: Cache HuggingFace failure status
let _hfFailedCached = false;
let _hfFailedTime = 0;
const HF_FAILED_CACHE_MS = 300_000; // Cache failure for 5 minutes

// ─── Cloudflare Workers AI (V350: PRIMARY method — same key that works for news & infographics) ─────────
// Uses CLOUDFLARE_API_TOKEN + R2_ACCOUNT_ID (already configured on Railway)
// Free tier: ~100-500 images/day, fast 5-15s
let _cf402Cached = false;
let _cf402Time = 0;
const CF_402_CACHE_MS = 300_000; // Cache Cloudflare failure for 5 minutes

async function generateImageCloudflareAI(prompt, width, height) {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.R2_ACCOUNT_ID;
  if (!cfApiToken || !cfAccountId) {
    console.log(`[V350]   Cloudflare AI: skipped (${!cfApiToken ? 'CLOUDFLARE_API_TOKEN' : 'R2_ACCOUNT_ID'} not set)`);
    return null;
  }

  // Skip if recently failed
  const now = Date.now();
  if (_cf402Cached && (now - _cf402Time) < CF_402_CACHE_MS) {
    console.log(`[V350]   Cloudflare AI: skipped (failure cached for ${Math.round((CF_402_CACHE_MS - (now - _cf402Time)) / 1000)}s)`);
    return null;
  }

  try {
    const cfModel = process.env.CF_IMAGE_MODEL || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

    console.log(`[V350]   Cloudflare Workers AI: trying ${cfModel}...`);

    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 500),
        num_steps: 20,
        width: Math.min(width, 1024),
        height: Math.min(height, 1024),
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[V350]   Cloudflare AI failed (${response.status}): ${errText.slice(0, 100)}`);
      if (response.status === 402 || response.status === 429) {
        _cf402Cached = true;
        _cf402Time = Date.now();
      }
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let imgBuffer;

    if (contentType.includes('image/')) {
      imgBuffer = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes('json')) {
      const jsonData = await response.json();
      if (jsonData.image) {
        imgBuffer = Buffer.from(jsonData.image, 'base64');
      } else if (jsonData.data?.[0]) {
        const b64 = jsonData.data[0].b64_json || jsonData.data[0];
        imgBuffer = Buffer.from(typeof b64 === 'string' ? b64 : JSON.stringify(b64), 'base64');
      } else {
        console.warn(`[V350]   Cloudflare AI unexpected JSON: ${JSON.stringify(jsonData).slice(0, 150)}`);
        return null;
      }
    } else {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength < 1000) {
        console.warn(`[V350]   Cloudflare AI response too small (${arrayBuf.byteLength} bytes)`);
        return null;
      }
      imgBuffer = Buffer.from(arrayBuf);
    }

    if (imgBuffer.length < 2000) {
      console.warn(`[V350]   Cloudflare AI image too small (${imgBuffer.length} bytes)`);
      return null;
    }

    console.log(`[V350]   ✓ Cloudflare Workers AI generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
    return imgBuffer;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[V350]   Cloudflare AI request timed out`);
    } else {
      console.warn(`[V350]   Cloudflare AI failed: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

async function generateAIImage(prompt, width = 1344, height = 768, marketImpact = 'neutral') {
  // ── V350: Cloudflare Workers AI PRIMARY — same key that works for news & infographics ──
  //
  // V350 STRATEGY: Sequential with caching
  //   1. Cloudflare Workers AI (PRIMARY — FREE, fast 5-15s, works on Railway)
  //   2. Together AI (FREE tier, may get 402)
  //   3. Pollinations (may get 402 on cloud IPs)
  //   4. HuggingFace (may fail with cold starts)
  //
  // Removed: Pexels (generic photos, irrelevant to content), SDK, CLI, Gradient

  console.log(`[V350] 🎨 AI Image Generation — Cloudflare-first...`);
  console.log(`[V350]   Prompt: "${prompt.slice(0, 80)}..."`);

  // ── METHOD 1 (PRIMARY): Cloudflare Workers AI ──
  let buffer = await generateImageCloudflareAI(prompt, width, height);
  if (buffer) { console.log(`[V350] ✓✓✓ AI Image via Cloudflare Workers AI (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }

  // ── METHOD 2: Together AI (skip if cached 402) ──
  const now = Date.now();
  if (!_together402Cached || (now - _together402Time) > TOGETHER_402_CACHE_MS) {
    buffer = await generateImageTogether(prompt, width, height);
    if (buffer) { console.log(`[V350] ✓ AI Image via Together AI (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }
    const togetherKey = process.env.TOGETHER_API_KEY;
    if (togetherKey) { _together402Cached = true; _together402Time = now; }
  } else {
    console.log(`[V350]   Together AI: skipped (402 cached for ${Math.round((TOGETHER_402_CACHE_MS - (now - _together402Time)) / 1000)}s)`);
  }

  // ── METHOD 3: Pollinations (skip if recently failed) ──
  await pollinationsRateLimitWait();
  buffer = await generateImagePollinations(prompt, width, height);
  if (buffer) { console.log(`[V350] ✓ AI Image via Pollinations (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }

  // ── METHOD 4: HuggingFace (skip if cached failure) ──
  if (!_hfFailedCached || (now - _hfFailedTime) > HF_FAILED_CACHE_MS) {
    buffer = await generateImageHuggingFace(prompt, width, height);
    if (buffer) { console.log(`[V350] ✓ AI Image via HuggingFace (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }
    const hfKey = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
    if (hfKey) { _hfFailedCached = true; _hfFailedTime = now; }
  } else {
    console.log(`[V350]   HuggingFace: skipped (failure cached for ${Math.round((HF_FAILED_CACHE_MS - (now - _hfFailedTime)) / 1000)}s)`);
  }

  // ── ALL AI METHODS FAILED ──
  console.error(`[V350] ✗✗✗ ALL AI image methods failed (Cloudflare + Together + Pollinations + HuggingFace)`);
  console.error(`[V350] DIAGNOSTICS: CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN ? 'SET' : 'NOT_SET'} R2_ACCOUNT_ID=${process.env.R2_ACCOUNT_ID ? 'SET' : 'NOT_SET'} TOGETHER_API_KEY=${process.env.TOGETHER_API_KEY ? 'SET' : 'NOT_SET'} HF_API_TOKEN=${(process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN) ? 'SET' : 'NOT_SET'}`);
  return null;
}

// ─── Constants ────────────────────────────────────────────────────
const RENDER_WIDTH = 1280;   // Render at 720p for memory efficiency (Railway ~512MB-1GB)
const RENDER_HEIGHT = 720;
const OUTPUT_WIDTH = 1920;   // FFmpeg upscales to 1080p for final output
const OUTPUT_HEIGHT = 1080;
const OUTPUT_FPS = 30;  // Final video FPS (V13: 30fps for smoother output)
// V7 FIX: Use IIFE to determine RENDER_FPS — avoids 'Assignment to constant variable' error
// that occurs on Railway when memory is low and we try to reassign a let variable
const RENDER_FPS = (() => {
  // V339: Use 12fps for all environments — 24fps doubles rendering time with no visible quality gain
  // since FFmpeg outputs at 30fps via frame duplication anyway.
  // This saves ~50% rendering time (1572 frames instead of 3143 = ~4min instead of ~8min)
  const mem = process.memoryUsage();
  const rssMB = mem.rss / 1024 / 1024;
  const heapMB = mem.heapTotal / 1024 / 1024;
  console.log(`[V339] Memory: RSS=${rssMB.toFixed(0)}MB, Heap=${heapMB.toFixed(0)}MB`);
  if (global.gc) { global.gc(); console.log('[V339] GC triggered at startup'); }
  // V339: Node.js starts at ~130MB RSS normally — only reduce FPS for actual low memory
  if (rssMB < 150 && heapMB < 200) {
    console.warn(`[V339] Very low memory (${rssMB.toFixed(0)}MB RSS), reducing FPS to 10`);
    return 10;
  }
  // V339: Always use 12fps for rendering — FFmpeg outputs at 30fps via frame duplication
  // 12fps is smooth enough for financial data animations (charts, counters, text)
  console.log(`[V339] Using 12fps render → 30fps output (optimized for speed)`);
  return 12;
})();
const FPS = RENDER_FPS;
// Legacy aliases for compatibility with pulse HTML generators
const WIDTH = RENDER_WIDTH;
const HEIGHT = RENDER_HEIGHT;

const COLORS = {
  bgDark: '#0A0E17',          // Deep black-navy — true broadcast dark
  bgCard: '#0F1629',          // Card background — subtle lift
  bgCardLight: '#141D33',     // Card hover
  accentBlue: '#2563EB',      // Primary brand blue — confident
  accentCyan: '#06B6D4',      // Accent teal — data highlights
  accentGreen: '#22C55E',     // Positive green — clear and readable
  accentRed: '#EF4444',       // Negative red — broadcast standard
  accentYellow: '#EAB308',    // Caution amber — muted
  accentGold: '#CA8A04',      // Premium gold — refined
  accentPurple: '#8B5CF6',    // Deep purple — analytical
  textWhite: '#F8FAFC',       // Near-white — clean, not harsh
  textGray: '#94A3B8',        // Secondary text
  textLight: '#CBD5E1',       // Light text
  textDim: '#475569',         // Dimmed text
  borderBlue: 'rgba(37,99,235,0.15)',   // Subtle borders
  glowBlue: 'rgba(37,99,235,0.20)',     // Subtle glow
  // Premium gradient accents
  gradientBlue: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(15,22,41,0.95) 0%, rgba(10,14,23,0.98) 100%)',
  // Data visualization colors (consistent, accessible)
  chartBlue: '#3B82F6',
  chartGreen: '#22C55E',
  chartRed: '#EF4444',
  chartAmber: '#F59E0B',
  chartPurple: '#8B5CF6',
  chartCyan: '#06B6D4',
};

// Content area dimensions (between ticker and news bar)
const TICKER_HEIGHT = 0; // V23: Ticker bar removed — was showing fake data
const NEWSBAR_HEIGHT = 36;
const CONTENT_HEIGHT = HEIGHT - TICKER_HEIGHT - NEWSBAR_HEIGHT; // 996px

// Pulse definitions: [name, startSec, endSec]
// V21: Compressed to 6 pulses, max 3 minutes — direct, punchy, not documentary
// Removed: roots, history, deal — keep only the most impactful sections
const PULSE_DEFS = [
  ['ignition',  0,   5],   // FAST intro — title + impact badge flash
  ['shock',     5,   30],  // Key stats + gauge + key points
  ['roots',     30,  50],  // Root causes — V1049: RESTORED (was removed in V21)
  ['race',      50,  70],  // Technical indicators + analysis chart
  ['alert',     70,  90],  // Scenarios (bullish/bearish/neutral) with probabilities
  ['takeaway',  90,  110], // Strategic takeaways + recommendations
  ['harvest',   110, 130], // Quick closing — recommendations ticker + brand
];

// Arabic numeral mapping for pulse counter
const AR_NUMERALS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabicNumeral(n) {
  return String(n).split('').map(d => AR_NUMERALS[parseInt(d)] || d).join('');
}

// ─── CLI Argument Parsing ────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      parsed[key] = args[i + 1] || true;
      i++;
    }
  }
  return parsed;
}

// ─── Utility Functions ────────────────────────────────────────────
function getImpactColor(marketImpact) {
  if (['bullish', 'positive'].includes(marketImpact)) return COLORS.accentGreen;
  if (['bearish', 'negative'].includes(marketImpact)) return COLORS.accentRed;
  return COLORS.accentGold;
}

function getImpactLabel(marketImpact, locale) {
  if (['bullish', 'positive'].includes(marketImpact)) {
    return locale === 'ar' ? 'صعودي' : locale === 'tr' ? 'Yükseliş' : 'Bullish';
  }
  if (['bearish', 'negative'].includes(marketImpact)) {
    return locale === 'ar' ? 'هبوطي' : locale === 'tr' ? 'Düşüş' : 'Bearish';
  }
  return locale === 'ar' ? 'محايد' : locale === 'tr' ? 'Nötr' : 'Neutral';
}

function getImpactArrow(marketImpact) {
  if (['bullish', 'positive'].includes(marketImpact)) return '↑';
  if (['bearish', 'negative'].includes(marketImpact)) return '↓';
  return '→';
}

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (typeof num === 'string') return num;
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed ? num.toFixed(1) : String(num);
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Strip Markdown Formatting (V24) ──────────────────────────────
// Removes ALL markdown syntax from text before sending to TTS
// Prevents the narrator from reading stars (*), hashes (#), brackets, etc.
function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`...`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold+italic (***text*** or ___text___)
    .replace(/(\*{3}|_{3})(.+?)\1/g, '$2')
    // Remove bold (**text** or __text__)
    .replace(/(\*{2}|_{2})(.+?)\1/g, '$2')
    // Remove italic (*text* or _text_)
    .replace(/(\*|_)(.+?)\1/g, '$2')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Remove headings (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules (--- or *** or ___)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove bullet points (- or * or + at line start)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Remove numbered lists (1. 2. etc.)
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove links [text](url) → keep text only
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url) → keep alt text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove reference-style links [text][ref]
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    // Remove superscript/subscript markers
    .replace(/\^\((.+?)\)/g, '$1')
    // Remove blockquote markers (>)
    .replace(/^\s*>\s+/gm, '')
    // Remove table pipes and dividers
    .replace(/^\|.*\|$/gm, (line) => line.replace(/\|/g, ' ').replace(/[-:]+/g, ''))
    // Clean up multiple spaces
    .replace(/[ \t]+/g, ' ')
    // Clean up multiple newlines
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function easeInOutCubic(t) {
  const p = Math.max(0, Math.min(1, t));
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function easeOutElastic(t) {
  const p = Math.max(0, Math.min(1, t));
  if (p === 0 || p === 1) return p;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function segmentProgress(p, start, end) {
  return clamp((p - start) / (end - start), 0, 1);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Voiceover Generation (V10: Premium Female Arabic Voices) ─────
// Priority: ar-AE-FatimaNeural → ar-EG-SalmaNeural → ar-SA-ZariyahNeural
// Fatima (UAE) has the clearest, most professional female Arabic voice
// Salma (Egypt) is widely understood across the Arab world
// Zariyah (Saudi) is the fallback — still female but less expressive
const ARABIC_FEMALE_VOICES = [
  'ar-AE-FatimaNeural',     // Best: clear, professional, modern
  'ar-EG-SalmaNeural',      // Excellent: widely understood Egyptian dialect
  'ar-SA-ZariyahNeural',    // Good: formal MSA, Saudi accent
  'ar-JO-SanaNeural',       // Backup: Jordanian, clear diction
  'ar-KW-NouraNeural',      // Backup: Kuwaiti, warm tone
];
const ENGLISH_FEMALE_VOICES = [
  'en-US-JennyNeural',
  'en-US-AriaNeural',
];
// V5 FIX: French TTS voices for edge-tts
const FRENCH_FEMALE_VOICES = [
  'fr-FR-DeniseNeural',
  'fr-FR-EloiseNeural',
  'fr-CA-SylvieNeural',
];
// V348: Turkish TTS voices for edge-tts
const TURKISH_FEMALE_VOICES = [
  'tr-TR-EmelNeural',      // Best: clear, professional Turkish female
  'tr-TR-GamzeNeural',     // Good: warm, natural Turkish female
];

// V5 FIX: Check Python + edge-tts availability ONCE at startup
let pythonAvailable = null;
function isPythonEdgeTTS() {
  if (pythonAvailable !== null) return pythonAvailable;
  try {
    const result = spawnSync('python3', ['-c', 'import edge_tts; print("ok")'], {
      encoding: 'utf-8',
      timeout: 10000,
    });
    pythonAvailable = result.status === 0 && result.stdout?.trim() === 'ok';
    if (!pythonAvailable) {
      console.warn('[TTS V5] Python3 + edge_tts NOT available — will use Groq TTS fallback');
    } else {
      console.log('[TTS V5] Python3 + edge_tts available');
    }
  } catch {
    pythonAvailable = false;
    console.warn('[TTS V5] Python3 not found — will use Groq TTS fallback');
  }
  return pythonAvailable;
}

function generateVoiceover(text, outputPath, locale) {
  const voiceList = locale === 'en' ? ENGLISH_FEMALE_VOICES
    : locale === 'fr' ? FRENCH_FEMALE_VOICES
    : locale === 'tr' ? TURKISH_FEMALE_VOICES
    : ARABIC_FEMALE_VOICES;
  const cleanedText = stripMarkdown(text);
  const truncated = cleanedText.length > 2000 ? cleanedText.slice(0, 1997) + '...' : cleanedText;

  const tmpTextFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpTextFile, truncated, 'utf-8');

  // V1047: Groq TTS is now PRIMARY — Hiba-MSA has correct Arabic pronunciation
  // edge-tts is FALLBACK only (it mispronounces financial terms unpredictably)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groqVoice = locale === 'ar' ? 'Hiba-MSA' : 'Fritz-PlayAI';
      console.log(`[TTS V1047] Trying Groq TTS PRIMARY (voice: ${groqVoice})...`);
      const curlResult = spawnSync('curl', [
        '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
        '-H', `Authorization: Bearer ${groqKey}`,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({ model: 'playai-tts', input: truncated, voice: groqVoice, response_format: 'mp3', speed: 1.0 }),
        '-o', outputPath,
      ], { encoding: 'utf-8', timeout: 60000 });

      if (existsSync(outputPath)) {
        const stat = statSync(outputPath);
        if (stat.size > 1000) {
          try { unlinkSync(tmpTextFile); } catch {}
          console.log(`[TTS V1047] Groq TTS: SUCCESS (voice: ${groqVoice}, ${(stat.size/1024).toFixed(0)}KB)`);
          return true;
        }
      }
      console.warn(`[TTS V1047] Groq TTS failed — falling back to edge-tts`);
    } catch (groqErr) {
      console.warn(`[TTS V1047] Groq TTS error: ${groqErr.message?.slice(0, 80)} — falling back to edge-tts`);
    }
  }

  // FALLBACK: edge-tts (only if Groq fails or no GROQ_API_KEY)
  if (!isPythonEdgeTTS()) {
    try { unlinkSync(tmpTextFile); } catch {}
    console.error(`[TTS V1047] ALL TTS methods failed (Groq failed, no Python/edge-tts)`);
    return false;
  }

  for (const voice of voiceList) {
    try {
      const pythonCode = `
import asyncio, edge_tts
async def main():
    text = open("${tmpTextFile}", "r", encoding="utf-8").read()
    comm = edge_tts.Communicate(text, "${voice}", rate="+0%", pitch="+0Hz")
    await comm.save("${outputPath}")
asyncio.run(main())
`;
      const result = spawnSync('python3', ['-c', pythonCode], {
        encoding: 'utf-8', timeout: 120000, maxBuffer: 10 * 1024 * 1024,
      });
      if (result.status === 0 && existsSync(outputPath)) {
        try { unlinkSync(tmpTextFile); } catch {}
        console.log(`[TTS V1047] edge-tts fallback: ${voice} — SUCCESS`);
        return true;
      }
    } catch (err) {
      console.warn(`[TTS V1047] edge-tts ${voice} failed: ${err.message?.slice(0, 80)}`);
    }
  }

  try { unlinkSync(tmpTextFile); } catch {}
  console.error(`[TTS V1047] ALL TTS methods failed`);
  return false;
}

// ─── Audio Duration Detection ────────────────────────────────────
function getAudioDuration(path) {
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path
    ], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(result.stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

// ─── Background Music Generation (V10: Professional Multi-Layer Ambient) ──────
// Generates a professional ambient corporate/news music track using FFmpeg synthesis
// Creates a rich, warm ambient pad with multiple harmonics and gentle modulation
// This is NOT just sine waves — it uses complex wave shaping for musical quality
function generateBackgroundMusic(outputPath, durationSeconds) {
  const dur = Math.ceil(durationSeconds) + 5;
  console.log(`[V13]   Generating professional ambient background music (${dur}s)...`);

  try {
    // Professional ambient pad with chord progression
    // Am → F → C → G (every ~16 bars at 65bpm)
    const bpm = 65; // Slow, contemplative
    const barDur = 60 / bpm * 4;
    const chordDuration = barDur * 8; // 8 bars per chord
    
    // Chord frequencies (A minor key progression)
    const chords = [
      [110, 130.81, 164.81, 220],     // Am with octave
      [87.31, 110, 130.81, 174.61],    // F with octave
      [65.41, 82.41, 98, 130.81],      // C with octave
      [98, 123.47, 146.83, 196],       // G with octave
    ];
    
    // Build layered FFmpeg filter for professional ambient music
    const inputs = [];
    
    // Sub bass drone
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=55:duration=${dur}`);
    // Root notes for each chord (we'll use a single sustained Am for simplicity)
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=110:duration=${dur}`);
    // Minor third
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=130.81:duration=${dur}`);
    // Perfect fifth
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=164.81:duration=${dur}`);
    // Octave shimmer
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=220:duration=${dur}`);
    // High texture
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=440:duration=${dur}`);
    // Very high air (A5, very quiet)
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=880:duration=${dur}`);
    
    const filterComplex = [
      // Individual volume levels for professional balance
      '[0:a]volume=0.025[sub]',
      '[1:a]volume=0.035[root]',
      '[2:a]volume=0.025[third]',
      '[3:a]volume=0.018[fifth]',
      '[4:a]volume=0.012[octave]',
      '[5:a]volume=0.006[texture]',
      '[6:a]volume=0.003[air]',
      // Mix all layers
      '[sub][root][third][fifth][octave][texture][air]amix=7:duration=longest:dropout_transition=5[mixed]',
      // Gentle LFO tremolo for musical movement
      '[mixed]tremolo=f=0.25:d=0.35[trem]',
      // Low-pass for dark cinematic warmth (V350: removed poles=4 — causes "Numerical result out of range" on some FFmpeg builds)
      '[trem]lowpass=f=500[lp]',
      // High-pass to remove rumble
      '[lp]highpass=f=35[hp]',
      // Compression for even level
      '[hp]acompressor=threshold=0.06:ratio=3:attack=5:release=120[comp]',
      // Smooth 5-second fade in
      '[comp]afade=t=in:st=0:d=5[fin]',
      // Smooth 10-second fade out
      `[fin]afade=t=out:st=${dur - 10}:d=10[final]`,
    ].join(',');

    const result = spawnSync('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[final]',
      '-c:a', 'libmp3lame', '-b:a', '192k',
      '-ar', '48000',  // V14: 48kHz for broadcast quality
      '-ac', '2',      // V14: Stereo
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0) {
      console.warn(`[V13]   Background music generation failed: ${result.stderr?.slice(-200)}`);
      return false;
    }

    const success = existsSync(outputPath);
    if (success) {
      const size = statSync(outputPath).size;
      console.log(`[V13]   Background music generated: ${(size / 1024).toFixed(0)}KB`);
    }
    return success;
  } catch (err) {
    console.warn(`[V13]   Background music error: ${err.message}`);
    return false;
  }
}

// ─── Mix narration with background music (V12: Simplified, Reliable) ──────
// Simpler approach with fade-in/fade-out — more reliable than sidechain compression
function mixAudioWithMusic(narrationPath, musicPath, outputPath, musicVolume = 0.18) {
  console.log(`[V12]   Mixing narration + background music (simplified reliable approach)...`);

  try {
    const totalDuration = getAudioDuration(narrationPath) || 120;
    const filterComplex = [
      `[1:a]volume=${musicVolume},afade=t=in:st=0:d=5,afade=t=out:st=${totalDuration - 8}:d=8[music]`,
      `[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`,
    ].join(';');

    const result = spawnSync('ffmpeg', [
      '-y',
      '-i', narrationPath,
      '-i', musicPath,
      '-filter_complex', filterComplex,
      '-map', '[aout]',
      '-c:a', 'libmp3lame', '-b:a', '192k',
      '-ar', '48000',  // V14: 48kHz broadcast standard
      '-ac', '2',      // V14: Stereo output
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0) {
      // Fallback: even simpler mix without fades
      console.warn(`[V12]   Primary mix failed, falling back to basic mix...`);
      const simpleFilter = `[1:a]volume=${musicVolume}[music];[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`;
      const fallbackResult = spawnSync('ffmpeg', [
        '-y',
        '-i', narrationPath,
        '-i', musicPath,
        '-filter_complex', simpleFilter,
        '-map', '[aout]',
        '-c:a', 'libmp3lame', '-b:a', '192k',
        '-ar', '48000',  // V14: 48kHz broadcast standard
        '-ac', '2',      // V14: Stereo output
        outputPath,
      ], { encoding: 'utf-8', timeout: 60000 });

      if (fallbackResult.status !== 0) {
        console.warn(`[V12]   Basic mix also failed: ${fallbackResult.stderr?.slice(-200)}`);
        return false;
      }
    }

    const success = existsSync(outputPath);
    if (success) {
      const duration = getAudioDuration(outputPath);
      console.log(`[V10]   Mixed audio: ${duration.toFixed(2)}s`);
    }
    return success;
  } catch (err) {
    console.warn(`[V10]   Audio mixing error: ${err.message}`);
    return false;
  }
}

// ─── Per-Pulse Narration Text Generation (V21: Compressed, Direct, Punchy) ──────
// Generates contextual narration text for each of the 6 pulses
// V22: LLM-powered narration — coherent, flowing Arabic (not mechanical concatenation)
// Uses z-ai-web-dev-sdk to generate professional news anchor style narration
// Falls back to improved template-based narration if LLM fails
// Each narration matches exactly what's displayed visually in that pulse

async function generatePerPulseNarrationLLM(data) {
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';

  // V1048: Use Groq API instead of ZAI SDK (ZAI doesn't work on Railway)
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn('[V1048] No GROQ_API_KEY — falling back to template narration');
    return generatePerPulseNarrationTemplate(data);
  }

  try {
    const impactLabel = getImpactLabel(data.market_impact, locale);
    const impactArrow = getImpactArrow(data.market_impact);

    const stats = (data.stats || []).map(s => `${s.label}: ${s.value}`).join('، ');
    const keyPoints = (data.key_points || []).slice(0, 5).join('. ');
    const rootCauses = (data.root_causes || []).map(r => `${r.title}: ${r.description}`).join('. ');
    const scenarios = (data.scenarios || []).map(s => `${s.title} (${s.probability}): ${s.result}`).join('. ');
    const takeaways = (data.strategic_takeaways || []).map(t => `${t.title}: ${t.detail}`).join('. ');
    const benAssets = (data.benefiting_assets || []).map(a => a.name).join('، ');
    const harmAssets = (data.harmed_assets || []).map(a => a.name).join('، ');
    const recs = (data.recommendations || []).map(r => `${r.asset}: ${r.action}`).join('. ');

    const systemPrompt = isAr
      ? `أنت مذيعة أخبار مالية محترفة في قناة اقتصادية عربية. مهمتك كتابة نص تعليق صوتي لتقرير فيديو مالي قصير (أقل من 3 دقائق).

القواعد الصارمة:
1. اكتب بلغة عربية فصحى سلسة وطبيعية — كأنك تقرأ نشرة أخبار وليس قاعدة بيانات
2. لا تستخدم أي كلمات إنجليزية — ترجم كل شيء: sentiment=مشاعر السوق، avg=متوسط، news=أخبار
3. استخدم الأرقام العربية (٪) بدل كتابة الأرقام حروفاً
4. كل نبضة يجب أن تكون 2-4 جمل فقط — مختصرة ومركزة
5. لا تقل "في هذا التقرير" أو "سنستعرض" — ادخل في الموضوع مباشرة
6. ربط بين الأفكار بعبارات طبيعية مثل: "وعلى صعيد المتابعة"، "وفي السياق ذاته"، "أما على صعيد التوقعات"
7. لا تستخدم أي تنسيق Markdown نهائياً — لا نجوم ولا هاشتاغ ولا أقواس مربعة — اكتب نصاً عادياً فقط لأنه سيُقرأ صوتياً`
      : locale === 'tr'
      ? `Sen profesyonel bir finans haber spikerisin. Kısa bir finansal video raporu (3 dakikanın altında) için seslendirme metni yazacaksın.

Kurallar:
1. Temiz, doğal Türkçe yaz — bir veritabanı değil, haber bülteni okur gibi
2. Her bölümü 2-4 cümle ile sınırla — kısa ve odaklı
3. "Bu raporda" veya "ele alacağız" deme — doğrudan konuya gir
4. Fikirleri doğal geçişlerle bağla
5. Hiçbir Markdown biçimlendirmesi kullanma — yıldız, kare, parantez yok — sadece düz metin çünkü sesli okunacak`
      : locale === 'fr'
      ? `Vous êtes une présentatrice professionnelle de nouvelles financières. Rédigez une narration pour un court rapport vidéo financier (moins de 3 minutes).

Règles:
1. Écrivez en français clair et naturel — comme un bulletin d'information, pas une base de données
2. Chaque partie doit faire 2-4 phrases — concis et ciblé
3. Ne dites pas "Dans ce rapport" — allez droit au but
4. Reliez les idées avec des transitions naturelles
5. N'utilisez AUCUN formatage Markdown — texte brut uniquement car il sera lu à voix haute`
      : `You are a professional financial news anchor. Write a voiceover narration for a short financial video report (under 3 minutes).

Rules:
1. Write in clear, natural English — like reading a news bulletin, not a database
2. Keep each pulse to 2-4 sentences — concise and focused
3. Don't say "In this report" or "We will cover" — get straight to the point
4. Connect ideas naturally with transitions
5. Do NOT use any Markdown formatting — no stars, hashes, brackets, or special characters — write plain text only because it will be read aloud by a narrator`;

    const userPrompt = isAr
      ? `اكتب 7 فقرات تعليق صوتي لتقرير مالي بعنوان: "${data.title || 'تقرير اقتصادي'}"
تأثير السوق: ${impactArrow} ${impactLabel}

الفقرة 1 (الاشتعال - 5 ثوانٍ): العنوان وتأثيره — جملتان فقط
الفقرة 2 (الصدمة - 25 ثانية): أبرز الأرقام والنقاط الرئيسية — البيانات: ${stats}. النقاط: ${keyPoints}
الفقرة 3 (الجذور - 20 ثانية): الأسباب الجذرية والمحفزات — ${rootCauses || 'تطورات فنية في المؤشرات'}
الفقرة 4 (السباق - 20 ثانية): المؤشرات الفنية والتحليل — تطورات فنية في المؤشرات
الفقرة 5 (التنبيه - 20 ثانية): السيناريوهات المحتملة — ${scenarios || 'الاتجاه العام ' + impactLabel}
الفقرة 6 (الخلاصة - 20 ثانية): الاستنتاجات والأصول المتأثرة — المستفيدة: ${benAssets || 'غير محددة'}. المتضررة: ${harmAssets || 'غير محددة'}. النقاط: ${takeaways}
الفقرة 7 (الحصاد - 20 ثانية): توصيات سريعة والختام — التوصيات: ${recs || 'إدارة المخاطر أولاً'}. اختم بـ: شكراً لمتابعتكم تقرير رؤى

أجب بهذا الشكل فقط:
P1: ...
P2: ...
P3: ...
P4: ...
P5: ...
P6: ...
P7: ...`
      : locale === 'tr'
      ? `"${data.title || 'Ekonomik Rapor'}" başlıklı finans raporu için 7 seslendirme paragrafı yaz
Piyasa etkisi: ${impactArrow} ${impactLabel}

P1 (Ateşleme - 5s): Başlık ve etki — sadece iki cümle
P2 (Şok - 25s): Temel veriler ve ana noktalar — Veriler: ${stats}. Noktalar: ${keyPoints}
P3 (Kökler - 20s): Temel nedenler ve itici güçler — ${rootCauses || 'Teknik gelişmeler'}
P4 (Yarış - 20s): Teknik göstergeler ve analiz
P5 (Uyarı - 20s): Olası senaryolar — ${scenarios || 'Genel yön: ' + impactLabel}
P6 (Çıkarım - 20s): Sonuçlar ve etkilenen varlıklar — Yararlanan: ${benAssets || 'Belirsiz'}. Zarar gören: ${harmAssets || 'Belirsiz'}. Noktalar: ${takeaways}
P7 (Hasat - 20s): Hızlı öneriler ve kapanış — Öneriler: ${recs || 'Önce risk yönetimi'}. Şununla bitir: Roua Raporunu izlediğiniz için teşekkürler

SADECE bu formatta cevap ver:
P1: ...
P2: ...
P3: ...
P4: ...
P5: ...
P6: ...
P7: ...`
      : locale === 'fr'
      ? `Écrivez 7 paragraphes de narration pour un rapport financier titré: "${data.title || 'Rapport Économique'}"
Impact marché: ${impactArrow} ${impactLabel}

P1 (Allumage - 5s): Titre et impact — deux phrases seulement
P2 (Choc - 25s): Statistiques clés et points principaux — Données: ${stats}. Points: ${keyPoints}
P3 (Racines - 20s): Causes fondamentales et moteurs — ${rootCauses || 'Développements techniques'}
P4 (Course - 20s): Indicateurs techniques et analyse
P5 (Alerte - 20s): Scénarios probables — ${scenarios || 'Direction générale: ' + impactLabel}
P6 (Conclusion - 20s): Conclusions et actifs affectés — Bénéficiaires: ${benAssets || 'N/A'}. Affectés: ${harmAssets || 'N/A'}. Points: ${takeaways}
P7 (Récolte - 20s): Recommandations rapides et clôture — Recs: ${recs || 'Gestion des risques'}. Terminez par: Merci de suivre le rapport Rouaa

Répondez UNIQUEMENT dans ce format:
P1: ...
P2: ...
P3: ...
P4: ...
P5: ...
P6: ...
P7: ...`
      : `Write 7 voiceover paragraphs for a financial report titled: "${data.title || 'Economic Report'}"
Market impact: ${impactArrow} ${impactLabel}

P1 (Ignition - 5s): Title and impact — two sentences only
P2 (Shock - 25s): Key stats and main points — Data: ${stats}. Points: ${keyPoints}
P3 (Roots - 20s): Root causes and drivers — ${rootCauses || 'Technical developments in indicators'}
P4 (Race - 20s): Technical indicators and analysis
P5 (Alert - 20s): Likely scenarios — ${scenarios || 'Overall direction: ' + impactLabel}
P6 (Takeaway - 20s): Conclusions and affected assets — Benefiting: ${benAssets || 'TBD'}. Harmed: ${harmAssets || 'TBD'}. Points: ${takeaways}
P7 (Harvest - 20s): Quick recommendations and closing — Recs: ${recs || 'Risk management first'}. End with: Thank you for watching the Roua Report

Answer ONLY in this format:
P1: ...
P2: ...
P3: ...
P4: ...
P5: ...
P6: ...
P7: ...`;

    console.log('[V1048]   Calling Groq LLM for professional narration...');
    const requestBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = spawnSync('curl', [
      '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/chat/completions',
      '-H', `Authorization: Bearer ${groqKey}`,
      '-H', 'Content-Type: application/json',
      '-d', requestBody,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0 || !result.stdout) {
      throw new Error('Groq API request failed');
    }

    const completion = JSON.parse(result.stdout);
    const rawText = completion.choices?.[0]?.message?.content || '';
    console.log(`[V1048]   Groq LLM response: ${rawText.length} chars`);

    // Parse P1-P6 from the response
    const parts = [];
    for (let i = 1; i <= 7; i++) {  // V1049: 7 pulses
      const regex = new RegExp(`P${i}\\s*:\\s*(.+?)(?=P${i + 1}\\s*:|$)`, 's');
      const match = rawText.match(regex);
      if (match) {
        const text = stripMarkdown(match[1].trim().replace(/\n+/g, ' '));
        parts.push(text);
      } else {
        console.warn(`[V1048]   P${i} not found in LLM response, using fallback`);
        parts.push(null);
      }
    }

    // Fill any missing parts with template fallback
    const templateParts = generatePerPulseNarrationTemplate(data);
    for (let i = 0; i < 7; i++) {  // V1049: 7 pulses
      if (!parts[i] || parts[i].length < 10) {
        parts[i] = templateParts[i];
      }
    }

    console.log('[V1048]   Groq LLM narration generated successfully');
    return parts;

  } catch (err) {
    console.warn(`[V1048]   Groq LLM narration failed: ${err.message?.slice(0, 100)}`);
    console.log('[V1048]   Falling back to template-based narration');
    return generatePerPulseNarrationTemplate(data);
  }
}

// V22: Improved template fallback — cleaner Arabic, no raw English terms
function generatePerPulseNarrationTemplate(data) {
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';
  const parts = [];

  // Pulse 1: Ignition — FAST headline + impact
  const impactLabel = getImpactLabel(data.market_impact, locale);
  const impactArrow = getImpactArrow(data.market_impact);
  if (isAr) {
    parts.push(`${data.title || 'تقرير اقتصادي عاجل'}. تأثير السوق: ${impactArrow} ${impactLabel}`);
  } else if (locale === 'tr') {
    parts.push(`${data.title || 'Acil Ekonomik Rapor'}. Piyasa etkisi: ${impactArrow} ${impactLabel}`);
  } else {
    parts.push(`${data.title || 'Breaking Economic Report'}. Market impact: ${impactArrow} ${impactLabel}`);
  }

  // Pulse 2: Shock — Key stats + key points (natural flowing Arabic)
  const stats = data.stats || [];
  const keyPoints = data.key_points || [];
  if (isAr) {
    let p2 = '';
    if (stats.length > 0) {
      p2 += 'أبرز المؤشرات: ' + stats.map(s => `${s.label} عند ${s.value}`).join('، ');
    }
    if (keyPoints.length > 0) {
      p2 += (p2 ? '. وعلى صعيد التطورات، ' : '') + keyPoints.slice(0, 3).join('. ');
    }
    if (!p2) p2 = 'البيانات تشير إلى تطورات مهمة تستوجب المتابعة';
    parts.push(p2);
  } else if (locale === 'tr') {
    let p2 = '';
    if (stats.length > 0) {
      p2 += 'Temel göstergeler: ' + stats.map(s => `${s.label}: ${s.value}`).join(', ');
    }
    if (keyPoints.length > 0) {
      p2 += (p2 ? '. Gelişmeler konusunda, ' : '') + keyPoints.slice(0, 3).join('. ');
    }
    if (!p2) p2 = 'Veriler izlemeye değer önemli gelişmelere işaret ediyor';
    parts.push(p2);
  } else {
    let p2 = '';
    if (stats.length > 0) {
      p2 += 'Key indicators: ' + stats.map(s => `${s.label} at ${s.value}`).join(', ');
    }
    if (keyPoints.length > 0) {
      p2 += (p2 ? '. On developments, ' : '') + keyPoints.slice(0, 3).join('. ');
    }
    if (!p2) p2 = 'Data points to significant developments worth monitoring';
    parts.push(p2);
  }

  // Pulse 3: Race — Root causes (natural Arabic)
  const rootCauses = data.root_causes || [];
  if (isAr) {
    let p3 = '';
    if (rootCauses.length > 0) {
      p3 += 'من أبرز المحفزات: ' + rootCauses.map(r => `${r.title} حيث ${r.description}`).join('. ');
    }
    if (keyPoints.length > 3) {
      p3 += (p3 ? '. وعلاوة على ذلك، ' : '') + keyPoints.slice(3, 5).join('. ');
    }
    if (!p3) p3 = 'المؤشرات الفنية تكشف عن مستويات دعم ومقاومة حرجة تستدعي الحذر';
    parts.push(p3);
  } else if (locale === 'tr') {
    let p3 = '';
    if (rootCauses.length > 0) {
      p3 += 'Temel itici güçler: ' + rootCauses.map(r => `${r.title} — ${r.description}`).join('. ');
    }
    if (keyPoints.length > 3) {
      p3 += (p3 ? '. Ayrıca, ' : '') + keyPoints.slice(3, 5).join('. ');
    }
    if (!p3) p3 = 'Teknik göstergeler kritik destek ve direnç seviyelerini ortaya koyuyor';
    parts.push(p3);
  } else {
    let p3 = '';
    if (rootCauses.length > 0) {
      p3 += 'Key drivers: ' + rootCauses.map(r => `${r.title} — ${r.description}`).join('. ');
    }
    if (keyPoints.length > 3) {
      p3 += (p3 ? '. Additionally, ' : '') + keyPoints.slice(3, 5).join('. ');
    }
    if (!p3) p3 = 'Technical indicators reveal critical support and resistance levels';
    parts.push(p3);
  }

  // Pulse 4: Alert — Scenarios with probabilities (natural Arabic)
  const scenarios = data.scenarios || [];
  if (isAr) {
    if (scenarios.length > 0) {
      parts.push('أما السيناريوهات المحتملة فتتمثل في: ' + scenarios.map(s => `سيراريو ${s.title} باحتمالية ${s.probability} ونتيجته ${s.result}`).join('. '));
    } else {
      const impactWord = data.market_impact === 'bullish' || data.market_impact === 'positive'
        ? 'صعودي' : data.market_impact === 'bearish' || data.market_impact === 'negative'
        ? 'هبوطي' : 'محايد';
      parts.push(`الاتجاه العام يتجه نحو المسار ${impactWord}. يجب وضع خطة لكل سيناريو محتمل`);
    }
  } else if (locale === 'tr') {
    if (scenarios.length > 0) {
      parts.push('Olası senaryolar: ' + scenarios.map(s => `${s.title} %${s.probability} olasılıkla — ${s.result}`).join('. '));
    } else {
      parts.push(`Genel yön ${impactLabel}. Her olası senaryo için plan yapın`);
    }
  } else {
    if (scenarios.length > 0) {
      parts.push('Likely scenarios: ' + scenarios.map(s => `${s.title} at ${s.probability} probability — ${s.result}`).join('. '));
    } else {
      const impactWord = data.market_impact === 'bullish' || data.market_impact === 'positive'
        ? 'bullish' : data.market_impact === 'bearish' || data.market_impact === 'negative'
        ? 'bearish' : 'neutral';
      parts.push(`Overall direction is ${impactWord}. Plan for every scenario`);
    }
  }

  // Pulse 5: Takeaway — Strategic takeaways + assets (natural Arabic)
  const takeaways = data.strategic_takeaways || [];
  const benAssets = data.benefiting_assets || [];
  const harmAssets = data.harmed_assets || [];
  if (isAr) {
    let p5 = '';
    if (takeaways.length > 0) {
      p5 += takeaways.map(t => `${t.title}: ${t.detail}`).join('. ');
    }
    if (benAssets.length > 0) {
      p5 += (p5 ? '. وعلى صعيد الأصول المستفيدة: ' : 'الأصول المستفيدة: ') + benAssets.map(a => a.name).join('، ');
    }
    if (harmAssets.length > 0) {
      p5 += '. بينما تتضرر: ' + harmAssets.map(a => a.name).join('، ');
    }
    if (!p5) p5 = 'التنويع هو الاستراتيجية الأفضل لحماية محفظتك في الظروف الحالية';
    parts.push(p5);
  } else if (locale === 'tr') {
    let p5 = '';
    if (takeaways.length > 0) {
      p5 += takeaways.map(t => `${t.title}: ${t.detail}`).join('. ');
    }
    if (benAssets.length > 0 || harmAssets.length > 0) {
      const benNames = benAssets.map(a => a.name).join(', ');
      const harmNames = harmAssets.map(a => a.name).join(', ');
      p5 += (p5 ? '. ' : '') + `Yararlanan varlıklar: ${benNames || 'Belirsiz'}. Zarar gören: ${harmNames || 'Belirsiz'}`;
    }
    if (!p5) p5 = 'Veriler dikkatli bir yaklaşım gerektiriyor';
    parts.push(p5);
  } else {
    let p5 = '';
    if (takeaways.length > 0) {
      p5 += takeaways.map(t => `${t.title}: ${t.detail}`).join('. ');
    }
    if (benAssets.length > 0) {
      p5 += (p5 ? '. Benefiting assets: ' : 'Benefiting assets: ') + benAssets.map(a => a.name).join(', ');
    }
    if (harmAssets.length > 0) {
      p5 += '. Harmed: ' + harmAssets.map(a => a.name).join(', ');
    }
    if (!p5) p5 = 'Diversification remains the best strategy to protect your portfolio';
    parts.push(p5);
  }

  // Pulse 6: Harvest — Quick recommendations + closing (natural Arabic)
  const recs = data.recommendations || [];
  if (isAr) {
    let p6 = '';
    if (recs.length > 0) {
      p6 += 'التوصيات: ' + recs.map(r => `${r.asset}: ${r.action}`).join('. ');
    }
    p6 += (p6 ? '. ' : '') + 'شكراً لمتابعتكم تقرير رؤى';
    parts.push(p6);
  } else if (locale === 'tr') {
    let p6 = '';
    if (data.recommendations && data.recommendations.length > 0) {
      p6 = data.recommendations.map(r => `${r.asset}: ${r.action}`).join('. ');
    }
    if (!p6) p6 = 'Öncelik: risk yönetimi';
    p6 += (p6 ? '. ' : '') + 'Roua Raporunu izlediğiniz için teşekkürler';
    parts.push(p6);
  } else {
    let p6 = '';
    if (recs.length > 0) {
      p6 += 'Recommendations: ' + recs.map(r => `${r.asset}: ${r.action}`).join('. ');
    }
    p6 += (p6 ? '. ' : '') + 'Thank you for watching the Roua Report';
    parts.push(p6);
  }

  // V1049: Insert root causes as P3, shift everything else
  const rootCausesText = (data.root_causes || []).map(r => `${r.title}: ${r.description}`).join('. ');
  const rootsNarration = isAr
    ? `أما الأسباب الجذرية فهي: ${rootCausesText || 'تطورات فنية في المؤشرات'}`
    : locale === 'tr'
    ? `Temel nedenler: ${rootCausesText || 'Göstergelerdeki teknik gelişmeler'}`
    : locale === 'fr'
    ? `Les causes fondamentales: ${rootCausesText || 'Développements techniques'}`
    : `Root causes: ${rootCausesText || 'Technical developments'}`;
  parts.splice(2, 0, rootsNarration);

  return parts;
}

// Synchronous wrapper — tries LLM first, falls back to template
function generatePerPulseNarration(data) {
  // This is the sync fallback used if the async version isn't awaited
  return generatePerPulseNarrationTemplate(data);
}

// ─── Generate per-pulse voiceover audio ──────────────────────────
// Generates separate audio files for each pulse for perfect sync
async function generatePerPulseVoiceover(narrationParts, tmpDir, locale) {
  const audioPaths = [];
  const audioDurations = [];

  console.log(`[V5]   Generating ${narrationParts.length} per-pulse voiceover segments...`);

  for (let i = 0; i < narrationParts.length; i++) {
    const text = narrationParts[i];
    if (!text || text.trim().length === 0) {
      audioPaths.push(null);
      audioDurations.push(0);
      continue;
    }

    const audioPath = join(tmpDir, `pulse_${i}_voice.mp3`);
    const success = generateVoiceover(text, audioPath, locale);

    if (success && existsSync(audioPath)) {
      const duration = getAudioDuration(audioPath);
      audioPaths.push(audioPath);
      audioDurations.push(duration);
      console.log(`[V5]   Pulse ${i + 1}/${narrationParts.length} voiceover: ${duration.toFixed(2)}s ("${text.slice(0, 40)}...")`);
    } else {
      audioPaths.push(null);
      audioDurations.push(0);
      console.warn(`[V5]   Pulse ${i + 1}/${narrationParts.length} voiceover failed — will use silent audio`);
    }
  }

  return { audioPaths, audioDurations };
}

// ─── Concatenate per-pulse audio files into one ─────────────────
function concatenateAudioSegments(audioPaths, outputPath) {
  // Build FFmpeg concat file
  const validPaths = audioPaths.filter(p => p && existsSync(p));
  if (validPaths.length === 0) {
    console.warn(`[V5]   No valid audio segments to concatenate`);
    return false;
  }

  const concatListPath = outputPath.replace('.mp3', '_concat.txt');
  let concatContent = '';
  for (const p of validPaths) {
    concatContent += `file '${p}'\n`;
  }
  writeFileSync(concatListPath, concatContent, 'utf-8');

  try {
    const result = spawnSync('ffmpeg', [
      '-y',
      '-f', 'concat', '-safe', '0',
      '-i', concatListPath,
      '-c:a', 'libmp3lame', '-b:a', '192k',
      '-ar', '48000',  // V14: 48kHz broadcast standard
      '-ac', '2',      // V14: Stereo output
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    try { unlinkSync(concatListPath); } catch {}

    if (result.status !== 0) {
      console.warn(`[V5]   Audio concatenation failed: ${result.stderr?.slice(-200)}`);
      return false;
    }

    const success = existsSync(outputPath);
    if (success) {
      const duration = getAudioDuration(outputPath);
      console.log(`[V5]   Concatenated narration audio: ${duration.toFixed(2)}s`);
    }
    return success;
  } catch (err) {
    console.warn(`[V5]   Audio concatenation error: ${err.message}`);
    return false;
  }
}

// ─── Data Enhancement Functions ───────────────────────────────────

function generateDefaultRootCauses(data) {
  const locale = data.locale || 'ar';
  const title = (data.title || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const keyPoints = (data.key_points || []).join(' ').toLowerCase();
  const combined = `${title} ${summary} ${keyPoints}`;

  const causes = [];

  // Keyword-based root cause generation
  if (combined.includes('inflation') || combined.includes('تضخم') || combined.includes('أسعار')) {
    causes.push({
      title: locale === 'ar' ? 'ضغوط تضخمية' : locale === 'tr' ? 'Enflasyon Baskıları' : 'Inflationary Pressures',
      description: locale === 'ar' ? 'ارتفاع مستمر في مستوى الأسعار يؤثر على القوة الشرائية' : locale === 'tr' ? 'Fiyat seviyelerinde sürekli yükseliş satın alma gücünü etkiliyor' : 'Sustained rise in price levels affecting purchasing power',
      icon: '📈',
    });
  }
  if (combined.includes('interest') || combined.includes('فائدة') || combined.includes('rate') || combined.includes('سياسة')) {
    causes.push({
      title: locale === 'ar' ? 'قرارات أسعار الفائدة' : locale === 'tr' ? 'Faiz Kararları' : 'Interest Rate Decisions',
      description: locale === 'ar' ? 'تغييرات في السياسة النقدية تؤثر على تكلفة الاقتراض' : locale === 'tr' ? 'Borçlanma maliyetini etkileyen para politikası değişiklikleri' : 'Monetary policy changes affecting borrowing costs',
      icon: '🏦',
    });
  }
  if (combined.includes('oil') || combined.includes('نفط') || combined.includes('طاقة') || combined.includes('energy')) {
    causes.push({
      title: locale === 'ar' ? 'تقلبات أسعار الطاقة' : locale === 'tr' ? 'Enerji Fiyat Volatilitesi' : 'Energy Price Volatility',
      description: locale === 'ar' ? 'تذبذب حاد في أسعار النفط والغاز يؤثر على الأسواق' : locale === 'tr' ? 'Piyasaları etkileyen petrol ve doğalgaz fiyatlarında keskin dalgalanma' : 'Sharp fluctuation in oil and gas prices affecting markets',
      icon: '🛢️',
    });
  }
  if (combined.includes('geopolitic') || combined.includes('حرب') || combined.includes('صراع') || combined.includes('sanction') || combined.includes('عقوبات')) {
    causes.push({
      title: locale === 'ar' ? 'توترات جيوسياسية' : locale === 'tr' ? 'Jeopolitik Gerilimler' : 'Geopolitical Tensions',
      description: locale === 'ar' ? 'تصاعد التوترات الإقليمية والدولية يؤثر على استقرار الأسواق' : locale === 'tr' ? 'Bölgesel ve uluslararası gerilimlerin artması piyasa istikrarını etkiliyor' : 'Rising regional and international tensions affecting market stability',
      icon: '⚔️',
    });
  }
  if (combined.includes('growth') || combined.includes('نمو') || combined.includes('gdp') || combined.includes('الناتج')) {
    causes.push({
      title: locale === 'ar' ? 'تباطؤ النمو الاقتصادي' : locale === 'tr' ? 'Ekonomik Büyüme Yavaşlaması' : 'Economic Growth Slowdown',
      description: locale === 'ar' ? 'تراجع معدلات النمو مع تحديات هيكلية في الاقتصاد' : locale === 'tr' ? 'Ekonomideki yapısal zorluklarla büyüme oranlarında düşüş' : 'Declining growth rates with structural economic challenges',
      icon: '📉',
    });
  }
  if (combined.includes('trade') || combined.includes('تجارة') || combined.includes('import') || combined.includes('export') || combined.includes('تصدير') || combined.includes('استيراد')) {
    causes.push({
      title: locale === 'ar' ? 'اختلالات التجارة' : locale === 'tr' ? 'Ticaret Dengesizlikleri' : 'Trade Imbalances',
      description: locale === 'ar' ? 'فجوات تجارية متزايدة تعكس تحديات في الميزان التجاري' : locale === 'tr' ? 'Ödemeler dengesi zorluklarını yansıtan büyüyen ticaret açıkları' : 'Growing trade gaps reflecting balance of payments challenges',
      icon: '⚖️',
    });
  }

  // Fill to at least 3 causes
  const fallbackCauses = [
    { title: locale === 'ar' ? 'عوامل العرض والطلب' : locale === 'tr' ? 'Arz & Talep Faktörleri' : 'Supply & Demand Factors', description: locale === 'ar' ? 'تحولات في ديناميكيات العرض والطلب تؤثر على الأسواق' : locale === 'tr' ? 'Piyasaları etkileyen arz-talep dinamiğindeki değişimler' : 'Shifts in supply-demand dynamics affecting markets', icon: '📊' },
    { title: locale === 'ar' ? 'تحركات رأس المال' : locale === 'tr' ? 'Sermaye Akışları' : 'Capital Flows', description: locale === 'ar' ? 'تدفقات رأس المال الدولية تؤثر على أسعار الأصول' : locale === 'tr' ? 'Varlık fiyatlarını etkileyen uluslararası sermaye akışları' : 'International capital flows impacting asset prices', icon: '💰' },
    { title: locale === 'ar' ? 'سياسات البنوك المركزية' : locale === 'tr' ? 'Merkez Bankası Politikaları' : 'Central Bank Policies', description: locale === 'ar' ? 'قرارات البنوك المركزية توجه مسار الأسواق المالية' : locale === 'tr' ? 'Finansal piyasaların yönünü belirleyen merkez bankası kararları' : 'Central bank decisions guiding financial market direction', icon: '🏛️' },
  ];

  while (causes.length < 3) {
    const next = fallbackCauses[causes.length];
    if (next) causes.push(next);
    else break;
  }

  return causes.slice(0, 3);
}

function generateDefaultHistoricalParallels(data) {
  const locale = data.locale || 'ar';
  const title = (data.title || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const combined = `${title} ${summary}`;

  const parallels = [];

  if (combined.includes('inflation') || combined.includes('تضخم')) {
    parallels.push({
      year: '2008',
      title: locale === 'ar' ? 'أزمة التضخم العالمية' : locale === 'tr' ? 'Küresel Enflasyon Krizi' : 'Global Inflation Crisis',
      cause: locale === 'ar' ? 'ارتفاع أسعار السلع والطاقة' : locale === 'tr' ? 'Emtia ve enerji fiyatlarındaki artış' : 'Surge in commodity and energy prices',
      result: locale === 'ar' ? 'تراجع الأسواق بنسبة 40%' : locale === 'tr' ? 'Piyasalar %40 düştü' : 'Markets declined by 40%',
    });
    parallels.push({
      year: '1970s',
      title: locale === 'ar' ? 'فترة الركود التضخمي' : locale === 'tr' ? 'Stagflasyon Dönemi' : 'Stagflation Era',
      cause: locale === 'ar' ? 'صدمات نفطية وسياسة نقدية ضعيفة' : locale === 'tr' ? 'Petrol şokları ve gevşek para politikası' : 'Oil shocks and loose monetary policy',
      result: locale === 'ar' ? 'عقد من النمو المنخفض والتضخم المرتفع' : locale === 'tr' ? 'Düşük büyüme ve yüksek enflasyonlu bir on yıl' : 'A decade of low growth and high inflation',
    });
  }

  if (combined.includes('oil') || combined.includes('نفط') || combined.includes('طاقة')) {
    parallels.push({
      year: '2014',
      title: locale === 'ar' ? 'انهيار أسعار النفط' : locale === 'tr' ? 'Petrol Fiyatı Çöküşü' : 'Oil Price Collapse',
      cause: locale === 'ar' ? 'فائض المعروض وتباطؤ الطلب الصيني' : locale === 'tr' ? 'Arz fazlası ve yavaşlayan Çin talebi' : 'Supply glut and slowing Chinese demand',
      result: locale === 'ar' ? 'انخفاض النفط من 115$ إلى 30$' : locale === 'tr' ? 'Petrol $115\'ten $30\'a düştü' : 'Oil dropped from $115 to $30',
    });
  }

  if (combined.includes('interest') || combined.includes('فائدة') || combined.includes('rate')) {
    parallels.push({
      year: '2022',
      title: locale === 'ar' ? 'دورة تشديد نقدية' : locale === 'tr' ? 'Parasal Sıkılaşma Döngüsü' : 'Monetary Tightening Cycle',
      cause: locale === 'ar' ? 'رفع الفائدة لمحاربة التضخم' : locale === 'tr' ? 'Enflasyonla mücadele için faiz artışları' : 'Rate hikes to combat inflation',
      result: locale === 'ar' ? 'ضغط على السندات والأسهم' : locale === 'tr' ? 'Tahvil ve hisse senetlerinde baskı' : 'Pressure on bonds and equities',
    });
  }

  if (combined.includes('crisis') || combined.includes('أزمة') || combined.includes('recession') || combined.includes('ركود')) {
    parallels.push({
      year: '2008',
      title: locale === 'ar' ? 'الأزمة المالية العالمية' : locale === 'tr' ? 'Küresel Finansal Kriz' : 'Global Financial Crisis',
      cause: locale === 'ar' ? 'انهيار سوق الرهن العقاري' : locale === 'tr' ? 'Subprime ipotek piyasası çöküşü' : 'Subprime mortgage market collapse',
      result: locale === 'ar' ? 'ركود عالمي وإنقاذ حكومي' : locale === 'tr' ? 'Küresel resesyon ve devlet kurtarma paketleri' : 'Global recession and government bailouts',
    });
  }

  // Default parallels to fill to 3
  const defaultParallels = [
    {
      year: '2020',
      title: locale === 'ar' ? 'صدمة كوفيد-19' : locale === 'tr' ? 'COVID-19 Şoku' : 'COVID-19 Shock',
      cause: locale === 'ar' ? 'جائحة عالمية أوقفت الاقتصاد' : locale === 'tr' ? 'Ekonomik faaliyeti durduran küresel pandemi' : 'Global pandemic halting economic activity',
      result: locale === 'ar' ? 'تعاف سريع بدعم حكومي' : locale === 'tr' ? 'Devlet desteğiyle hızlı toparlanma' : 'Swift recovery with government support',
    },
    {
      year: '2016',
      title: locale === 'ar' ? 'صدمة بريكست' : locale === 'tr' ? 'Brexit Şoku' : 'Brexit Shock',
      cause: locale === 'ar' ? 'تصويت بريطانيا للخروج من الاتحاد الأوروبي' : locale === 'tr' ? 'AB\'den ayrılma oyu veren İngiltere' : 'UK vote to leave the European Union',
      result: locale === 'ar' ? 'تذبذب حاد في العملات' : locale === 'tr' ? 'Keskin döviz volatilitesi' : 'Sharp currency volatility',
    },
    {
      year: '1997',
      title: locale === 'ar' ? 'أزمة الأسواق الناشئة' : locale === 'tr' ? 'Gelişen Piyasalar Krizi' : 'Emerging Markets Crisis',
      cause: locale === 'ar' ? 'انهيار العملات الآسيوية' : locale === 'tr' ? 'Asya döviz çöküşü' : 'Asian currency collapse',
      result: locale === 'ar' ? 'انتقال العدوى للأسواق العالمية' : locale === 'tr' ? 'Küresel piyasalara sıçrama' : 'Contagion to global markets',
    },
  ];

  while (parallels.length < 3) {
    const next = defaultParallels[parallels.length];
    if (next) parallels.push(next);
    else break;
  }

  return parallels.slice(0, 3);
}

function generateDefaultStrategicTakeaways(data) {
  const locale = data.locale || 'ar';
  const outlook = (data.outlook || '').toLowerCase();
  const impact = data.market_impact || 'neutral';
  const stats = data.stats || [];

  const takeaways = [];

  if (['bullish', 'positive'].includes(impact)) {
    takeaways.push({
      title: locale === 'ar' ? 'فرص نمو محتملة' : locale === 'tr' ? 'Potansiyel Büyüme Fırsatları' : 'Potential Growth Opportunities',
      detail: locale === 'ar'
        ? 'البيانات الحالية تشير إلى مسار صعودي مع فرص للمستثمرين'
        : locale === 'tr'
        ? 'Mevcut veriler yatırımcılar için fırsatlarla yukarı yönlü bir eğilim gösteriyor'
        : 'Current data indicates an upward trajectory with opportunities for investors',
      color: 'green',
    });
  } else if (['bearish', 'negative'].includes(impact)) {
    takeaways.push({
      title: locale === 'ar' ? 'مخاطر هبوطية' : locale === 'tr' ? 'Aşağı Yönlü Riskler' : 'Downside Risks',
      detail: locale === 'ar'
        ? 'المؤشرات تشير إلى ضغوط هبوطية تستدعي الحيطة'
        : locale === 'tr'
        ? 'Göstergeler ihtiyat gerektiren aşağı yönlü baskılara işaret ediyor'
        : 'Indicators point to downward pressures requiring caution',
      color: 'red',
    });
  } else {
    takeaways.push({
      title: locale === 'ar' ? 'اتجاه متحفظ' : locale === 'tr' ? 'Temkinli Duruş' : 'Cautious Stance',
      detail: locale === 'ar'
        ? 'السوق في مرحلة مراقبة مع توقعات متباينة'
        : locale === 'tr'
        ? 'Piyasa karma beklentilerle gözlem aşamasında'
        : 'Market in observation phase with mixed expectations',
      color: 'gold',
    });
  }

  if (stats.length > 0) {
    const mainStat = stats[0];
    // V23: Fix nonsensical title — don't embed the stat label in the takeaway title
    takeaways.push({
      title: locale === 'ar' ? 'المؤشر الرئيسي' : locale === 'tr' ? 'Temel Gösterge' : 'Key Metric',
      detail: locale === 'ar'
        ? `${mainStat.label}: ${mainStat.value}${mainStat.description ? ' — ' + mainStat.description : ''}`
        : `${mainStat.label}: ${mainStat.value}${mainStat.description ? ' — ' + mainStat.description : ''}`,
      color: 'gold',
    });
  }

  takeaways.push({
    title: locale === 'ar' ? 'إدارة المخاطر ضرورية' : locale === 'tr' ? 'Risk Yönetimi Şart' : 'Risk Management Essential',
    detail: locale === 'ar'
      ? 'تنويع المحفظة وتحديد نقاط الخروج أمر بالغ الأهمية في الظروف الحالية'
      : locale === 'tr'
      ? 'Mevcut koşullarda portföy çeşitlendirmesi ve çıkış noktası belirleme kritik'
      : 'Portfolio diversification and exit point definition are crucial in current conditions',
    color: ['bullish', 'positive'].includes(impact) ? 'green' : 'red',
  });

  while (takeaways.length < 3) {
    takeaways.push({
      title: locale === 'ar' ? 'مراقبة مستمرة' : locale === 'tr' ? 'Sürekli İzleme' : 'Ongoing Monitoring',
      detail: locale === 'ar' ? 'متابعة التطورات عن كثب لتعديل الاستراتيجية' : locale === 'tr' ? 'Stratejiyi ayarlamak için gelişmeleri yakından izleme' : 'Closely monitoring developments to adjust strategy',
      color: 'gold',
    });
  }

  return takeaways.slice(0, 3);
}

function enhanceDataWithDefaults(data) {
  const enhanced = { ...data };

  // ── V14: Unified date across all components ──
  // Generate a single consistent date string used everywhere
  if (!enhanced._unifiedDate) {
    if (enhanced.date && enhanced.date.trim()) {
      enhanced._unifiedDate = enhanced.date.trim();
    } else {
      // Generate current date in a consistent format
      const now = new Date();
      const locale = enhanced.locale || 'ar';
      try {
        enhanced._unifiedDate = now.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'tr' ? 'tr-TR' : 'en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      } catch {
        enhanced._unifiedDate = now.toISOString().split('T')[0];
      }
    }
    // Override data.date with unified date for consistency
    enhanced.date = enhanced._unifiedDate;
  }

  // ── V14: Fix stats contradictions ──
  // Ensure stats have proper labels matching market_impact
  if (!enhanced.stats || enhanced.stats.length === 0) {
    const locale = enhanced.locale || 'ar';
    const impact = enhanced.market_impact || 'neutral';
    const isPositive = ['bullish', 'positive'].includes(impact);
    const isNegative = ['bearish', 'negative'].includes(impact);
    enhanced.stats = [
      { label: locale === 'ar' ? 'مؤشر المشاعر الإيجابية' : locale === 'tr' ? 'Olumlu Duygu Endeksi' : 'Positive Sentiment', value: isPositive ? '67.5%' : isNegative ? '28.3%' : '49.2%', description: locale === 'ar' ? 'نسبة المشاعر الإيجابية في السوق' : locale === 'tr' ? 'Piyasa olumlu duygu oranı' : 'Market positive sentiment ratio' },
      { label: locale === 'ar' ? 'مؤشر المشاعر السلبية' : locale === 'tr' ? 'Olumsuz Duygu Endeksi' : 'Negative Sentiment', value: isNegative ? '62.8%' : isPositive ? '22.1%' : '38.5%', description: locale === 'ar' ? 'نسبة المشاعر السلبية في السوق' : locale === 'tr' ? 'Piyasa olumsuz duygu oranı' : 'Market negative sentiment ratio' },
      { label: locale === 'ar' ? 'مؤشر التذبذب' : locale === 'tr' ? 'Volatilite Endeksi' : 'Volatility Index', value: isNegative ? '28.4%' : isPositive ? '14.2%' : '19.7%', description: locale === 'ar' ? 'مقياس تذبذب السوق الحالي' : locale === 'tr' ? 'Mevcut piyasa volatilite ölçütü' : 'Current market volatility measure' },
      { label: locale === 'ar' ? 'حجم التداول' : locale === 'tr' ? 'İşlem Hacmi' : 'Volume', value: '1.2M', description: locale === 'ar' ? 'متوسط حجم التداول اليومي' : locale === 'tr' ? 'Ortalama günlük işlem hacmi' : 'Average daily trading volume' },
    ];
  }

  // ── V14: Unified brand description ──
  enhanced._brandDescription = enhanced.locale === 'ar' ? 'أخبار وأسواق عالمية' : enhanced.locale === 'tr' ? 'Küresel Haberler & Piyasalar' : 'Global News & Markets';

  if (!enhanced.root_causes || enhanced.root_causes.length === 0) {
    enhanced.root_causes = generateDefaultRootCauses(enhanced);
  }
  if (!enhanced.historical_parallels || enhanced.historical_parallels.length === 0) {
    enhanced.historical_parallels = generateDefaultHistoricalParallels(enhanced);
  }
  if (!enhanced.strategic_takeaways || enhanced.strategic_takeaways.length === 0) {
    enhanced.strategic_takeaways = generateDefaultStrategicTakeaways(enhanced);
  }
  if (!enhanced.scenarios || enhanced.scenarios.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.scenarios = [
      { title: locale === 'ar' ? 'السيناريو المتفائل' : locale === 'tr' ? 'İyimser Senaryo' : 'Optimistic Scenario', result: locale === 'ar' ? 'تعافٍ أسرع من المتوقع' : locale === 'tr' ? 'Beklenenden hızlı toparlanma' : 'Faster-than-expected recovery', probability: '35%', color: 'green' },
      { title: locale === 'ar' ? 'السيناريو الأساسي' : locale === 'tr' ? 'Temel Senaryo' : 'Base Scenario', result: locale === 'ar' ? 'نمو معتدل مع تقلبات' : locale === 'tr' ? 'Dalgalı ılımlı büyüme' : 'Moderate growth with volatility', probability: '45%', color: 'yellow' },
      { title: locale === 'ar' ? 'السيناريو المتشائم' : locale === 'tr' ? 'Kötümser Senaryo' : 'Pessimistic Scenario', result: locale === 'ar' ? 'تراجع حاد في الأسواق' : locale === 'tr' ? 'Keskin piyasa düşüşü' : 'Sharp market decline', probability: '20%', color: 'red' },
    ];
  }
  if (!enhanced.benefiting_assets || enhanced.benefiting_assets.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.benefiting_assets = [
      { name: locale === 'ar' ? 'الذهب' : locale === 'tr' ? 'Altın' : 'Gold', symbol: 'XAU', reason: locale === 'ar' ? 'ملاذ آمن' : locale === 'tr' ? 'Güvenli liman' : 'Safe haven' },
      { name: locale === 'ar' ? 'الدولار' : locale === 'tr' ? 'Dolar' : 'USD', symbol: 'DXY', reason: locale === 'ar' ? 'تحفظي' : locale === 'tr' ? 'Savunmacı' : 'Defensive' },
    ];
  }
  if (!enhanced.harmed_assets || enhanced.harmed_assets.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.harmed_assets = [
      { name: locale === 'ar' ? 'الأسهم الناشئة' : locale === 'tr' ? 'Gelişen Piyasalar' : 'Emerging Equities', symbol: 'EEM', reason: locale === 'ar' ? 'مخاطرة عالية' : locale === 'tr' ? 'Yüksek risk' : 'High risk' },
    ];
  }
  if (!enhanced.recommendations || enhanced.recommendations.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.recommendations = [
      { horizon: 'daily', asset: locale === 'ar' ? 'الذهب' : locale === 'tr' ? 'Altın' : 'Gold', action: locale === 'ar' ? 'شراء عند التراجع' : locale === 'tr' ? 'Düşüşte satın al' : 'Buy on dip', entry: '2020', target: '2080', stop: '1990', allocation: '15%' },
      { horizon: 'medium', asset: locale === 'ar' ? 'س&P 500' : locale === 'tr' ? 'S&P 500' : 'S&P 500', action: locale === 'ar' ? 'تراكم تدريجي' : locale === 'tr' ? 'Kademeli biriktir' : 'Accumulate gradually', entry: '5200', target: '5600', stop: '5000', allocation: '25%' },
      { horizon: 'long', asset: locale === 'ar' ? 'سندات أمريكية' : locale === 'tr' ? 'ABD Hazine Tahvilleri' : 'US Treasuries', action: locale === 'ar' ? 'استثمار طويل' : locale === 'tr' ? 'Uzun vadeli yatırım' : 'Long investment', entry: '4.2%', target: '3.5%', stop: '4.8%', allocation: '20%' },
    ];
  }
  // V22: Reduced from 6 to 3 ticker items — cleaner, less cluttered, bigger font
  if (!enhanced.live_prices || enhanced.live_prices.length === 0) {
    enhanced.live_prices = [
      { symbol: 'XAU', price: '2035.40', change: '+0.8%' },
      { symbol: 'SPX', price: '5320.15', change: '-0.2%' },
      { symbol: 'BTC', price: '67420', change: '+2.5%' },
    ];
  } else if (enhanced.live_prices.length > 3) {
    // Keep only top 3 most relevant
    enhanced.live_prices = enhanced.live_prices.slice(0, 3);
  }

  return enhanced;
}

// ─── Ticker Bar Generator (V12: Bloomberg-style with LIVE badge) ────
function generateTickerBar(data) {
  const isRTL = data.locale === 'ar';
  const livePrices = data.live_prices || [];

  const priceItems = livePrices.map(p => {
    const changeStr = String(p.change ?? '');
    const isUp = changeStr.includes('+') || changeStr.includes('▲') || (typeof p.change === 'number' && p.change > 0) || (typeof p.changePercent === 'number' && p.changePercent > 0);
    const arrowChar = isUp ? '▲' : '▼';
    const changeColor = isUp ? COLORS.accentGreen : COLORS.accentRed;
    return `<span class="ticker-item" style="
      display:inline-flex; align-items:center; gap:6px; margin:0 12px;
      padding:4px 12px; border-radius:6px;
      background:rgba(255,255,255,0.04);
    ">
      <span class="ticker-symbol" style="font-size:16px; font-weight:700; color:#F8FAFC; letter-spacing:0.5px;">${escapeHTML(p.symbol)}</span>
      <span class="ticker-price" style="font-size:15px; color:${COLORS.textLight}; font-weight:500;">${escapeHTML(p.price)}</span>
      <span class="ticker-change" style="font-size:14px; font-weight:600; color:${changeColor}">${arrowChar} ${escapeHTML(p.change)}</span>
    </span>`;
  }).join('<span class="ticker-sep" style="color:rgba(37,99,235,0.2); margin:0 4px; font-size:14px;">│</span>');

  // Single scroll (no doubling — cleaner Bloomberg look)
  const scrolled = priceItems;

  return `
    <div id="ticker-bar" style="
      position:absolute; top:0; left:0; right:0; height:${TICKER_HEIGHT}px;
      background: linear-gradient(180deg, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.94) 100%);
      border-bottom: 1px solid ${COLORS.borderBlue};
      display:flex; align-items:center; overflow:hidden; z-index:100;
    ">
      <!-- LIVE badge -->
      <div style="
        position:absolute; ${isRTL ? 'right' : 'left'}:12px; top:50%; transform:translateY(-50%);
        z-index:3; display:flex; align-items:center; gap:5px;
        padding:3px 10px; border-radius:4px;
        background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3);
      ">
        <div style="width:6px; height:6px; border-radius:50%; background:#EF4444; animation:pulseDot 1.5s ease-in-out infinite;"></div>
        <span style="font-size:10px; font-weight:800; color:#EF4444; letter-spacing:2px; font-family:'Inter',sans-serif;">LIVE</span>
      </div>
      <!-- Clock / Report Time -->
      <div style="
        position:absolute; ${isRTL ? 'right' : 'left'}:80px; top:50%; transform:translateY(-50%); z-index:3;
        display:flex; align-items:center; gap:6px;
        padding:4px 10px; border-radius:6px;
        background:rgba(37,99,235,0.15); border:1px solid rgba(37,99,235,0.2);
      ">
        <div style="width:6px; height:6px; border-radius:50%; background:#EF4444; box-shadow:0 0 6px #EF4444; animation:pulseDot 1.5s ease-in-out infinite;"></div>
        <span style="font-size:11px; font-weight:700; color:#EF4444; letter-spacing:1px;">LIVE</span>
        <span style="font-size:11px; font-weight:600; color:#94A3B8; margin-left:4px;">${data._unifiedDate || data.date || ''}</span>
      </div>
      <div style="
        position:absolute; ${isRTL ? 'right' : 'left'}:180px; top:0; bottom:0; width:40px;
        background: linear-gradient(${isRTL ? '270deg' : '90deg'}, rgba(10,14,23,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        position:absolute; ${isRTL ? 'left' : 'right'}:0; top:0; bottom:0; width:80px;
        background: linear-gradient(${isRTL ? '90deg' : '270deg'}, rgba(10,14,23,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div class="ticker-scroll" style="
        white-space:nowrap; animation: tickerScroll 60s linear infinite;
        ${isRTL ? 'margin-right' : 'margin-left'}:200px; font-size:13px;
      ">${scrolled}</div>
    </div>
  `;
}

// ─── News Bar Generator ──────────────────────────────────────────
function generateNewsBar(data) {
  const isRTL = data.locale === 'ar';
  const disclaimer = isRTL ? '⚠️ تنبيه: المحتوى إعلامي وليس نصيحة استثمارية' : data.locale === 'tr' ? '⚠️ Uyarı: İçerik bilgilendirme amaçlıdır, yatırım tavsiyesi değildir' : '⚠️ Disclaimer: Content is informational, not investment advice';
  const tickerItems = [
    data.title || '',
    data.summary || '',
    ...(data.stats || []).map(s => `${s.label}: ${s.value}`),
    ...(data.key_points || []).slice(0, 2),
    disclaimer,
  ].filter(Boolean);

  const tickerText = tickerItems.join(' <span style="color:' + COLORS.accentBlue + ';margin:0 8px;">●</span> ');
  const doubled = tickerText + ' <span style="color:' + COLORS.accentBlue + ';margin:0 8px;">●</span> ' + tickerText;

  return `
    <div id="news-bar" style="
      position:absolute; bottom:0; left:0; right:0; height:${NEWSBAR_HEIGHT}px;
      background: linear-gradient(0deg, rgba(12,20,38,0.98) 0%, rgba(10,17,32,0.92) 100%);
      border-top: 1px solid ${COLORS.borderBlue};
      display:flex; align-items:center; overflow:hidden; z-index:100;
    ">
      <div style="
        position:absolute; left:0; top:0; bottom:0; width:60px;
        background: linear-gradient(90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        position:absolute; right:0; top:0; bottom:0; width:60px;
        background: linear-gradient(-90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        display:flex; align-items:center; gap:8px;
        position:absolute; ${isRTL ? 'right' : 'left'}:16px; z-index:3;
      ">
        <div style="width:7px; height:7px; background:${COLORS.accentRed}; border-radius:50%; box-shadow:0 0 6px ${COLORS.accentRed}; animation: pulseDot 1.5s ease-in-out infinite;"></div>
        <span style="font-size:11px; font-weight:700; color:${COLORS.accentRed}; letter-spacing:2px;">${isRTL ? 'مباشر' : data.locale === 'tr' ? 'CANLI' : 'LIVE'}</span>
      </div>
      <div class="news-scroll" style="
        white-space:nowrap; animation: newsScroll 50s linear infinite;
        padding: 0 100px; font-size:12px; color:${COLORS.textGray};
      ">${doubled}</div>
    </div>
  `;
}

// ─── Ken Burns config per pulse (zoom direction + pan direction) ────
// Each pulse gets a unique combination of zoom in/out + pan direction
// for maximum cinematic variety. Zoom range: 1.0 ↔ 1.35 (35% range)
const KEN_BURNS_CONFIGS = [
  { zoom: 'in',  panX: 0,    panY: 0,    origin: '50% 50%'  }, // Pulse 1: Ignition — center zoom in
  { zoom: 'out', panX: -3,   panY: -2,   origin: '60% 40%'  }, // Pulse 2: Shock — zoom out + drift top-right
  { zoom: 'in',  panX: 3,    panY: 0,    origin: '40% 50%'  }, // Pulse 3: Race — zoom in + drift right
  { zoom: 'out', panX: 2,    panY: -3,   origin: '40% 60%'  }, // Pulse 4: Alert — zoom out + drift up-right
  { zoom: 'in',  panX: 0,    panY: -2,   origin: '50% 60%'  }, // Pulse 5: Takeaway — zoom in + drift up
  { zoom: 'in',  panX: 2,    panY: 2,    origin: '40% 40%'  }, // Pulse 6: Harvest — zoom in + drift bottom-right
];

// ─── Base HTML Generator ─────────────────────────────────────────
function generateBaseHTML(content, data, pulseIndex, pulseTitle) {
  const isRTL = data.locale === 'ar';
  const pulseCounter = isRTL ? `${toArabicNumeral(pulseIndex + 1)} / ${toArabicNumeral(7)}` : `${pulseIndex + 1}/7`; // V1049: 7 pulses
  const impactColor = getImpactColor(data.market_impact);

  // Background image for this pulse (V11: support both old and new format)
  const bgImagesV2 = data._bgImagesV2 || [];
  const bgImagesV1 = data._bgImages || [];
  const bgV2 = bgImagesV2[pulseIndex] || bgImagesV2[0] || null;

  // Extract image data and CSS effects
  let bgImageB64 = '';
  let bgFilter = 'brightness(0.55) saturate(0.7) contrast(1.1) blur(0.5px)';
  let bgOverlay = 'linear-gradient(180deg, rgba(10,14,23,0.60) 0%, rgba(10,14,23,0.35) 25%, rgba(10,14,23,0.40) 65%, rgba(10,14,23,0.70) 100%)';
  let bgSize = 'cover';

  if (bgV2 && typeof bgV2 === 'object' && bgV2.base64) {
    // V11 format: { base64, overlay, filter, size, position }
    bgImageB64 = bgV2.base64 || '';
    bgFilter = bgV2.filter || bgFilter;
    bgOverlay = bgV2.overlay || bgOverlay;
    bgSize = bgV2.size || bgSize;
  } else {
    // Legacy V1 format: plain base64 string
    bgImageB64 = bgImagesV1[pulseIndex] || bgImagesV1[0] || '';
  }

  const hasBgImage = bgImageB64.length > 100;
  const kbConfig = KEN_BURNS_CONFIGS[pulseIndex] || KEN_BURNS_CONFIGS[0];
  const kenBurnsZoom = kbConfig.zoom;
  const kenBurnsPanX = kbConfig.panX;
  const kenBurnsPanY = kbConfig.panY;
  const kenBurnsOrigin = kbConfig.origin;

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Inter', -apple-system, sans-serif;
      background: ${COLORS.bgDark}; color: ${COLORS.textWhite};
      direction: ${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing: antialiased;
    }

    /* AI-generated background image with Ken Burns effect (V11: dynamic CSS filter) */
    .ken-burns-bg {
      position:absolute; top:0; left:0; right:0; bottom:0;
      overflow:hidden; z-index:0;
    }
    .ken-burns-img {
      position:absolute; top:0; left:0;
      width:100%; height:100%;
      object-fit:cover;
      transform: scale(1.0);
      transform-origin: 50% 50%;
      filter: ${bgFilter};
      will-change: transform;
    }

    /* Dark overlay on top of background image for text readability (V11: dynamic overlay) */
    .ken-burns-overlay {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background: ${bgOverlay};
      z-index:1;
    }

    /* Grid background (on top of image, subtle) */
    .grid-bg {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background-image:
        linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events:none; z-index:2;
    }

    /* Radial gradient overlay */
    .radial-overlay {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background: radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 55%);
      pointer-events:none; z-index:3;
    }

    /* Brand badge (top-left / top-right in RTL) */
    .brand-badge {
      position:absolute; top:12px; ${isRTL ? 'right' : 'left'}:24px; z-index:50; // V23: No ticker, brand at top
      display:flex; align-items:center; gap:8px;
      padding: 6px 14px; border-radius:8px;
      background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(0,229,255,0.08) 100%);
      border: 1px solid rgba(30,122,232,0.15);
      opacity:0; transition: opacity 0.6s ease;
    }
    .brand-badge.visible { opacity:1; }
    .brand-badge-icon {
      width:28px; height:28px; border-radius:6px;
      background: linear-gradient(135deg, ${COLORS.accentBlue}, ${COLORS.accentCyan});
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:900; color:white; font-family:'Inter',sans-serif;
    }
    .brand-badge-text {
      font-size:11px; font-weight:700; color:${COLORS.accentBlue}; letter-spacing:1.5px;
    }

    /* Pulse counter (bottom-right / bottom-left in RTL) */
    .pulse-counter {
      position:absolute; bottom:${NEWSBAR_HEIGHT + 10}px; ${isRTL ? 'left' : 'right'}:24px; z-index:50;
      padding: 4px 12px; border-radius:6px;
      background: rgba(18,28,50,0.8); border:1px solid ${COLORS.borderBlue};
      font-size:13px; font-weight:600; color:${COLORS.textGray}; letter-spacing:1px;
      opacity:0; transition: opacity 0.6s ease;
    }
    .pulse-counter.visible { opacity:1; }
    .pulse-counter-label {
      font-size:9px; color:${COLORS.textDim}; letter-spacing:2px; display:block;
      text-transform:uppercase; margin-bottom:1px;
    }
    .pulse-counter-num { color:${COLORS.accentCyan}; font-size:16px; font-weight:800; }

    /* Ticker scroll animation */
    @keyframes tickerScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes newsScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes pulseDot {
      0%,100% { opacity:1; box-shadow:0 0 6px ${COLORS.accentRed}; }
      50% { opacity:0.4; box-shadow:0 0 12px ${COLORS.accentRed}; }
    }

    /* Ticker items */
    .ticker-item { display:inline-flex; align-items:center; gap:5px; margin:0 6px; }
    .ticker-symbol { font-size:11px; font-weight:700; color:${COLORS.textWhite}; letter-spacing:0.5px; }
    .ticker-price { font-size:11px; color:${COLORS.textLight}; font-weight:500; }
    .ticker-change { font-size:10px; font-weight:600; }
    .ticker-sep { color:${COLORS.borderBlue}; margin:0 4px; font-size:10px; }

    /* Content area */
    .content-area {
      position:absolute;
      top:0px; // V23: No ticker bar
      left:0; right:0;
      height:${CONTENT_HEIGHT}px;
      z-index:10;
      overflow:hidden;
    }

    /* Breathing animation for background elements */
    @keyframes breathe {
      0%,100% { transform:scale(1); opacity:0.5; }
      50% { transform:scale(1.03); opacity:0.7; }
    }
    .breathe-bg {
      animation: none;
    }

    /* Accent line animations */
    @keyframes lineGlow {
      0%,100% { opacity:0.3; }
      50% { opacity:0.8; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Premium text shadow for broadcast readability */
    .text-broadcast {
      text-shadow: 0 1px 3px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5);
    }

    /* Gradient text for premium headings */
    .text-gradient {
      background: linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Glass morphism cards */
    .glass-card {
      background: rgba(15, 22, 41, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(37, 99, 235, 0.12);
      border-radius: 12px;
    }

    /* Data label styling */
    .data-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .data-value {
      font-size: 32px;
      font-weight: 800;
      color: #F8FAFC;
      font-family: 'Inter', 'IBM Plex Sans Arabic', sans-serif;
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <!-- AI Background Image with Ken Burns -->
  ${hasBgImage ? `<div class="ken-burns-bg" id="ken-burns-bg">
    <img class="ken-burns-img" id="ken-burns-img" src="data:${bgImageB64.startsWith('PHN2Zy') || bgImageB64.startsWith('PD94bW') ? 'image/svg+xml' : bgImageB64.startsWith('/9j/') ? 'image/jpeg' : bgImageB64.startsWith('iVBOR') ? 'image/png' : bgImageB64.startsWith('UklGR') ? 'image/webp' : 'image/jpeg'};base64,${bgImageB64}" alt="" style="object-fit:${bgSize}">
    <div class="ken-burns-overlay"></div>
  </div>` : ''}

  <!-- Background layers -->
  <div class="grid-bg"></div>
  <div class="radial-overlay breathe-bg"></div>

  <!-- V23: Ticker bar REMOVED — showed fake/placeholder data, not real-time -->

  <!-- Brand Badge -->
  <div class="brand-badge" id="brand-badge">
    <div class="brand-badge-icon" style="
      width:40px; height:40px; border-radius:8px;
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #06B6D4 100%);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; font-weight:900; color:white; font-family:'Inter',sans-serif;
      box-shadow: 0 0 16px rgba(37,99,235,0.5);
    ">R</div>
    <div>
      <div style="font-size:15px; font-weight:900; color:#F8FAFC; letter-spacing:0.5px;">${data.locale === 'ar' ? 'رؤى' : data.locale === 'tr' ? 'Roua' : 'Roua'}</div>
      <div style="font-size:9px; font-weight:700; color:#64748B; letter-spacing:3px; text-transform:uppercase;">${data.locale === 'ar' ? 'ROUA INSIGHTS' : data.locale === 'tr' ? 'ROUA ANALİZ' : 'ROUA INSIGHTS'}</div>
      <div style="font-size:8px; font-weight:500; color:#475569; letter-spacing:1px; margin-top:1px;">${escapeHTML(data._brandDescription || 'أخبار وأسواق عالمية')}</div>
    </div>
  </div>

  <!-- V13: Professional Lower Third Bar -->
  <div class="lower-third" id="lower-third" style="
    position:absolute; bottom:${NEWSBAR_HEIGHT + 12}px; ${isRTL ? 'right' : 'left'}:24px;
    z-index:50; display:flex; align-items:center; gap:12px;
    padding:8px 20px; border-radius:0 8px 8px 0;
    background:linear-gradient(90deg, ${COLORS.accentBlue} 0%, ${COLORS.accentBlue}CC 100%);
    border-${isRTL ? 'right' : 'left'}:4px solid ${COLORS.accentCyan};
    opacity:0; transform:translateX(${isRTL ? '' : '-'}20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  ">
    <span style="font-size:13px; font-weight:700; color:white; letter-spacing:1px;">${data.locale === 'ar' ? 'رؤى | ROUA' : data.locale === 'tr' ? 'ROUA | ANALİZ' : 'رؤى | ROUA'}</span>
    <span style="width:1px; height:16px; background:rgba(255,255,255,0.3);"></span>
    <marquee class="lower-third-title" style="font-size:12px; font-weight:500; color:rgba(255,255,255,0.85); max-width:600px; display:inline-block;" scrollamount="2" scrolldelay="50">${escapeHTML(data.title || '')}</marquee>
  </div>

  <!-- V14: Watermark — subtle brand identifier -->
  <div style="
    position:absolute; bottom:${NEWSBAR_HEIGHT + 8}px; ${isRTL ? 'left' : 'right'}:24px;
    z-index:45; display:flex; align-items:center; gap:4px;
    opacity:0.15; pointer-events:none;
  ">
    <span style="font-size:10px; font-weight:600; color:${COLORS.textWhite}; letter-spacing:2px; font-family:'Inter',sans-serif;">ROUA</span>
  </div>

  <!-- Base animation controller — MUST run before pulse-specific script -->
  <script>
    window._baseProgress = 0;
    window._kenBurnsZoom = ${JSON.stringify(kenBurnsZoom)};
    window._kenBurnsPanX = ${kenBurnsPanX};
    window._kenBurnsPanY = ${kenBurnsPanY};
    window._kenBurnsOrigin = ${JSON.stringify(kenBurnsOrigin)};
    window._hasBgImage = ${hasBgImage ? 'true' : 'false'};

    window.setAnimationProgress = function(p) {
      window._baseProgress = p;
      // Show brand badge and pulse counter after 5% progress
      var bb = document.getElementById('brand-badge');
      var pc = document.getElementById('pulse-counter');
      if (bb) bb.classList.toggle('visible', p > 0.05);
      if (pc) pc.classList.toggle('visible', p > 0.05);

      // V13: Show lower-third after 10% progress
      var lt = document.getElementById('lower-third');
      if (lt && p > 0.1) { lt.style.opacity = '1'; lt.style.transform = 'translateX(0)'; }

      // V13: Update progress bar
      var pb = document.getElementById('progress-bar');
      if (pb) pb.style.width = (p * 100) + '%';

      // Ken Burns effect: cinematic zoom + pan with smooth easing
      if (window._hasBgImage) {
        var img = document.getElementById('ken-burns-img');
        if (img) {
          // Set transform-origin from config
          img.style.transformOrigin = window._kenBurnsOrigin || '50% 50%';
          // Apply ease-in-out for smooth start/stop
          var ep = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          var scale;
          if (window._kenBurnsZoom === 'in') {
            // Zoom in: 1.0 → 1.35 over the pulse duration (35% range)
            scale = 1.0 + ep * 0.35;
          } else {
            // Zoom out: 1.35 → 1.0 over the pulse duration (35% range)
            scale = 1.35 - ep * 0.35;
          }
          // Pan: subtle drift using translate for cinematic movement
          var tx = window._kenBurnsPanX * ep;
          var ty = window._kenBurnsPanY * ep;
          img.style.transform = 'scale(' + scale + ') translate(' + tx + '%, ' + ty + '%)';
        }
      }
    };
  </script>

  <!-- Main content area (pulse-specific script wraps base setAnimationProgress) -->
  <div class="content-area">
    ${content}
  </div>

  <!-- Pulse Counter -->
  <div class="pulse-counter" id="pulse-counter">
    <span class="pulse-counter-label">${isRTL ? 'نبضة' : data.locale === 'tr' ? 'VURUŞ' : 'PULSE'}</span>
    <span class="pulse-counter-num">${pulseCounter}</span>
  </div>

  <!-- V13: Professional Progress Bar -->
  <div id="progress-bar" style="
    position:absolute; bottom:${NEWSBAR_HEIGHT}px; ${isRTL ? 'right' : 'left'}:0;
    width:0%; height:2px; z-index:60;
    background:linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentCyan});
    box-shadow:0 0 8px ${COLORS.accentCyan}40;
    transition: width 0.3s ease;
  "></div>

  <!-- News Bar (bottom) -->
  ${generateNewsBar(data)}
</body>
</html>`;
}

// ─── Pulse 1: Ignition ───────────────────────────────────────────
// Countdown + screen activation + ticker starts
// ─── SVG Mini-Chart Generator (V12: Real Data Visualization) ──────
function generateMiniSparklineSVG(data, color = '#3B82F6', width = 120, height = 40) {
  // Generate realistic-looking financial data points
  const points = 20;
  const values = [];
  let val = 50 + Math.random() * 30;
  for (let i = 0; i < points; i++) {
    val += (Math.random() - 0.48) * 8; // Slight upward bias
    val = Math.max(10, Math.min(90, val));
    values.push(val);
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const pathPoints = values.map((v, i) => {
    const x = (i / (points - 1)) * width;
    const y = height - ((v - minVal) / range) * (height - 4) - 2;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Area fill
  const areaPath = pathPoints + ` L${width},${height} L0,${height} Z`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sparkGrad_${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#sparkGrad_${color.replace('#','')})" />
    <path d="${pathPoints}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function generateGaugeSVG(value, maxVal = 100, color = '#22C55E', size = 80) {
  const percentage = Math.min(100, Math.max(0, (value / maxVal) * 100));
  const angle = (percentage / 100) * 270; // 270 degree arc
  const startAngle = 135; // Start from bottom-left
  const endAngle = startAngle + angle;

  const rad = (deg) => (deg * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));

  const largeArc = angle > 180 ? 1 : 0;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(1)},${y2.toFixed(1)}" 
          fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"
          style="filter: drop-shadow(0 0 4px ${color})"/>
    <path d="M${cx + r * Math.cos(rad(135))},${cy + r * Math.sin(rad(135))} A${r},${r} 0 1 1 ${cx + r * Math.cos(rad(405))},${cy + r * Math.sin(rad(405))}" 
          fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5" stroke-linecap="round"/>
    <text x="${cx}" y="${cy + 2}" text-anchor="middle" dominant-baseline="middle" 
          font-size="16" font-weight="800" fill="white" font-family="Inter,sans-serif">${Math.round(percentage)}%</text>
  </svg>`;
}

function generateIgnitionPulse(data) {
  const isRTL = data.locale === 'ar';
  const impactColor = getImpactColor(data.market_impact);
  const impactLabel = getImpactLabel(data.market_impact, data.locale);
  const reportLabel = data.report_type_label || (isRTL ? 'تقرير اقتصادي عاجل' : data.locale === 'tr' ? 'Acil Ekonomik Rapor' : 'Breaking Economic Report');
  const impactArrow = getImpactArrow(data.market_impact);

  return `
    <style>
      .ignition-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
      }

      /* V15: NO countdown — instant news flash style */
      .ignition-flash-overlay {
        position:absolute; top:0; left:0; right:0; bottom:0;
        background: ${impactColor}; opacity:0; pointer-events:none; z-index:100;
      }

      /* V23: Breaking news bar REMOVED — was making site look cheap */

      /* Title area — instant reveal */
      .ignition-title-area {
        text-align:center;
        opacity:0; transform:scale(0.95);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .ignition-title-area.revealed { opacity:1; transform:scale(1); }

      .ignition-report-badge {
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 24px; border-radius:100px;
        border:1px solid ${impactColor}40;
        background:${impactColor}10; margin-bottom:20px;
      }
      .ignition-report-dot {
        width:8px; height:8px; border-radius:50%;
        background:${impactColor}; box-shadow:0 0 6px ${impactColor};
      }
      .ignition-report-label {
        font-size:16px; font-weight:600; color:${impactColor}; letter-spacing:1px;
      }

      .ignition-main-title {
        font-size:44px; font-weight:900; line-height:1.3;
        max-width:1200px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        margin-bottom:12px;
      }

      .ignition-impact-row {
        display:flex; align-items:center; justify-content:center; gap:16px;
        margin-top:8px;
      }

      .ignition-impact-badge {
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 20px; border-radius:10px;
        background:${impactColor}15; border:1px solid ${impactColor}35;
      }
      .ignition-impact-arrow { font-size:24px; font-weight:800; color:${impactColor}; }
      .ignition-impact-text { font-size:18px; font-weight:600; color:${impactColor}; }

      .ignition-date {
        font-size:18px; color:${COLORS.textGray};
      }

      /* Brand mark at bottom */
      .ignition-brand {
        position:absolute; bottom:50px;
        display:flex; align-items:center; gap:10px;
        opacity:0; transition: opacity 0.4s ease;
      }
      .ignition-brand.visible { opacity:0.5; }
      .ignition-brand-text {
        font-size:16px; font-weight:700; color:${COLORS.accentBlue};
        letter-spacing:2px;
      }

      /* Decorative accent line */
      .ignition-accent-line {
        width:80px; height:2px; margin:0 auto 16px;
        background:linear-gradient(90deg, transparent, ${impactColor}, transparent);
        opacity:0; transition: opacity 0.4s ease;
      }
    </style>

    <div class="ignition-container" id="ignition-root">
      <!-- Flash overlay for instant screen activation -->
      <div class="ignition-flash-overlay" id="ignition-flash"></div>

      <!-- V23: BREAKING bar REMOVED — makes the site look cheap/amateur -->

      <!-- Title area -->
      <div class="ignition-title-area" id="ignition-title-area">
        <div class="ignition-report-badge">
          <div class="ignition-report-dot"></div>
          <span class="ignition-report-label">${escapeHTML(reportLabel)}</span>
        </div>
        <div class="ignition-accent-line" id="ignition-accent-line"></div>
        <h1 class="ignition-main-title">${escapeHTML(data.title || '')}</h1>
        <div class="ignition-impact-row">
          <div class="ignition-impact-badge">
            <span class="ignition-impact-arrow">${impactArrow}</span>
            <span class="ignition-impact-text">${escapeHTML(impactLabel)}</span>
          </div>
          <div class="ignition-date">${escapeHTML(data.date || '')}</div>
        </div>
      </div>

      <!-- Brand mark -->
      <div class="ignition-brand" id="ignition-brand">
        <span class="ignition-brand-text">${isRTL ? 'رؤى' : 'ROUA'}</span>
      </div>
    </div>

    <script>
    (function() {
      var titleArea = document.getElementById('ignition-title-area');
      var flash = document.getElementById('ignition-flash');
      var accentLine = document.getElementById('ignition-accent-line');
      var brand = document.getElementById('ignition-brand');

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // V23: No more BREAKING bar — clean professional intro
        // Phase 1: 0-0.15 — Flash effect
        var flashPhase = segmentProgress(p, 0, 0.15);
        if (flashPhase > 0 && flashPhase < 1) {
          var intensity = flashPhase < 0.5 ? flashPhase * 2 : (1 - flashPhase) * 2;
          flash.style.opacity = String(intensity * 0.3);
        } else {
          flash.style.opacity = '0';
        }

        // Phase 2: 0.10-0.40 — Title reveals instantly
        var titlePhase = segmentProgress(p, 0.10, 0.40);
        if (titlePhase > 0) {
          titleArea.classList.add('revealed');
          accentLine.style.opacity = String(Math.min(1, titlePhase * 2));
        }

        // Phase 3: 0.40-0.60 — Brand appears
        var brandPhase = segmentProgress(p, 0.40, 0.60);
        if (brandPhase > 0) {
          brand.classList.add('visible');
        }

        // Phase 4: 0.80-1.0 — Slight fade preparing for next pulse
        // (next pulse will crossfade anyway)
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
    })();
    </script>
  `;
}

// ─── Pulse 2: Shock ──────────────────────────────────────────────
// Main number counts up + gauge fills + timeline draws + flash alert
function generateShockPulse(data) {
  const isRTL = data.locale === 'ar';
  const stats = (data.stats || []).slice(0, 4);
  const impactColor = getImpactColor(data.market_impact);
  const impactLabel = getImpactLabel(data.market_impact, data.locale);
  const impactArrow = getImpactArrow(data.market_impact);

  // Build timeline items from key_points
  const timelineItems = (data.key_points || []).slice(0, 4).map((point, i) => {
    const dotColor = [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentGreen, COLORS.accentYellow][i % 4];
    return { text: point, color: dotColor, index: i };
  });

  // Gauge value based on impact
  let gaugeTarget = 50;
  if (['bullish', 'positive'].includes(data.market_impact)) gaugeTarget = 82;
  else if (['bearish', 'negative'].includes(data.market_impact)) gaugeTarget = 22;

  // Stat value parsing for count-up
  const mainStat = stats[0] || { label: '', value: '0', description: '' };
  const numericValue = parseFloat(String(mainStat.value).replace(/[^0-9.\-]/g, '')) || 0;
  const valuePrefix = String(mainStat.value).match(/^[^0-9\-]*/)?.[0] || '';
  const valueSuffix = String(mainStat.value).match(/[^0-9.]*$/)?.[0] || '';

  return `
    <style>
      .shock-layout {
        width:100%; height:100%; display:flex; position:relative;
        padding: 32px 48px;
      }
      .shock-left {
        flex:1.1; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
      }
      .shock-right {
        flex:0.9; display:flex; flex-direction:column;
        justify-content:center; padding-${isRTL ? 'right' : 'left'}:32px;
      }

      /* Main stat card */
      .shock-stat-card {
        width:680px; position:relative;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue}; border-radius:16px;
        padding:40px 48px; overflow:hidden;
      }
      .shock-stat-card::before {
        content:''; position:absolute; top:0; left:0; right:0; height:3px;
        background:linear-gradient(90deg, transparent, ${impactColor}, transparent);
        opacity:0; transition:opacity 0.5s ease;
      }
      .shock-stat-card.glow::before { opacity:1; }

      .shock-stat-label {
        font-size:20px; color:${COLORS.textGray}; font-weight:500;
        text-align:center; margin-bottom:20px; letter-spacing:1px;
      }
      .shock-stat-value {
        font-size:72px; font-weight:900; text-align:center;
        letter-spacing:-2px; line-height:1.1;
        text-shadow:0 0 40px ${impactColor}30;
        transition: color 0.3s ease;
      }
      .shock-stat-desc {
        font-size:18px; color:${COLORS.textLight}; text-align:center;
        line-height:1.6; margin-top:20px; opacity:0.85;
      }

      /* Mini stats row */
      .shock-mini-stats {
        display:flex; gap:16px; margin-top:24px;
      }
      .shock-mini-stat {
        flex:1; padding:14px 18px; border-radius:12px;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        text-align:center;
        opacity:0; transform:translateY(10px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-mini-stat.visible { opacity:1; transform:translateY(0); }
      .shock-mini-stat-val { font-size:36px; font-weight:700; color:${COLORS.textWhite}; font-family: 'Inter', 'IBM Plex Sans Arabic', sans-serif; }
      .shock-mini-stat-label { font-size:12px; color:${COLORS.textDim}; margin-top:4px; }
      .data-label { font-size:10px; font-weight:600; color:${COLORS.accentCyan}; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px; font-family:'Inter',sans-serif; }

      /* Gauge */
      .shock-gauge-section {
        margin-bottom:28px;
        opacity:0; transform:translateX(${isRTL ? '-' : ''}20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .shock-gauge-section.visible { opacity:1; transform:translateX(0); }

      .shock-gauge-title {
        font-size:14px; color:${COLORS.accentYellow}; font-weight:600;
        letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;
      }
      .shock-gauge-bar-bg {
        height:16px; border-radius:4px; position:relative; overflow:hidden;
        background:linear-gradient(90deg, ${COLORS.accentRed}20, ${COLORS.accentGold}20, ${COLORS.accentGreen}20);
      }
      .shock-gauge-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; height:100%;
        border-radius:8px;
        background:linear-gradient(90deg, ${COLORS.accentRed}, ${COLORS.accentGold}, ${impactColor});
        width:0%; transition: width 0.3s ease;
      }
      .shock-gauge-labels {
        display:flex; justify-content:space-between; margin-top:8px;
      }
      .shock-gauge-label-text { font-size:12px; }
      .shock-gauge-value {
        text-align:center; margin-top:8px;
        font-size:20px; font-weight:700; color:${impactColor};
      }

      /* Timeline */
      .shock-timeline {
        position:relative; padding-${isRTL ? 'right' : 'left'}:24px;
        opacity:0; transform:translateX(${isRTL ? '-' : ''}20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .shock-timeline.visible { opacity:1; transform:translateX(0); }

      .shock-timeline-line {
        position:absolute; ${isRTL ? 'right' : 'left'}:8px; top:0; bottom:0;
        width:2px; background:linear-gradient(180deg, ${COLORS.accentBlue}, ${COLORS.accentCyan}40);
        transform-origin:top; transform:scaleY(0); transition:transform 0.6s ease;
      }
      .shock-timeline.line-drawn .shock-timeline-line { transform:scaleY(1); }

      .shock-timeline-item {
        display:flex; align-items:flex-start; gap:16px;
        margin-bottom:20px; position:relative;
        opacity:0; transform:translateY(8px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-timeline-item.visible { opacity:1; transform:translateY(0); }

      .shock-timeline-dot {
        width:14px; height:14px; border-radius:50%; flex-shrink:0;
        position:relative; ${isRTL ? 'margin-right' : 'margin-left'}:-3px;
        border:2px solid; background:${COLORS.bgDark};
      }
      .shock-timeline-dot::after {
        content:''; position:absolute; top:-4px; left:-4px; right:-4px; bottom:-4px;
        border-radius:50%; background:inherit; opacity:0.2;
      }
      .shock-timeline-text {
        font-size:15px; color:${COLORS.textLight}; line-height:1.6;
        padding-top:0;
      }

      /* Flash alert box */
      .shock-flash-alert {
        position:absolute; top:24px; ${isRTL ? 'left' : 'right'}:24px;
        padding:12px 20px; border-radius:10px;
        background:${impactColor}10; border:1px solid ${impactColor}30;
        display:flex; align-items:center; gap:10px;
        opacity:0; transform:translateY(-10px) scale(0.95);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-flash-alert.visible { opacity:1; transform:translateY(0) scale(1); }
      .shock-flash-alert-icon { font-size:24px; }
      .shock-flash-alert-text { font-size:14px; font-weight:600; color:${impactColor}; }

      /* Decorative bars */
      .shock-deco-bars {
        position:absolute; bottom:20px; ${isRTL ? 'right' : 'left'}:20px;
        display:flex; align-items:flex-end; gap:3px; opacity:0.1;
      }
    </style>

    <div class="shock-layout" id="shock-root">
      <!-- Flash alert -->
      <div class="shock-flash-alert" id="shock-flash-alert">
        <span class="shock-flash-alert-icon">◆</span>
        <span class="shock-flash-alert-text">${isRTL ? 'تنبيه: حركة سعرية ملحوظة' : data.locale === 'tr' ? 'UYARI: Kayda Değer Fiyat Hareketi' : 'ALERT: Notable Price Action'}</span>
      </div>

      <div class="shock-left">
        <div class="shock-stat-card" id="shock-stat-card">
          <div class="shock-stat-label">${escapeHTML(mainStat.label)}</div>
          <div class="shock-stat-value" id="shock-value" style="color:${impactColor}">${escapeHTML(valuePrefix)}0${escapeHTML(valueSuffix)}</div>
          <div class="shock-stat-desc">${escapeHTML(mainStat.description || '')}</div>

          <!-- Mini stats -->
          <div class="shock-mini-stats">
            ${stats.slice(1, 4).map((s, i) => `
              <div class="shock-mini-stat" id="shock-mini-${i}">
                <div class="data-label">${isRTL ? 'مؤشر' : data.locale === 'tr' ? 'GÖSTERGE' : 'METRIC'}</div>
                <div class="shock-mini-stat-val">${escapeHTML(s.value)}</div>
                <div class="shock-mini-stat-label">${escapeHTML(s.label)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Deco bars -->
          <div class="shock-deco-bars">
            ${[40,65,35,80,55,70,45,90,60,50,75,55].map(h =>
              `<div style="width:5px;height:${h*0.5}px;background:${COLORS.accentBlue};border-radius:2px;"></div>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="shock-right">
        <!-- Gauge -->
        <div class="shock-gauge-section" id="shock-gauge">
          <div class="shock-gauge-title">${isRTL ? '◇ مقياس التأثير' : data.locale === 'tr' ? '◇ ETKİ ÖLÇÜTÜ' : '◇ IMPACT GAUGE'}</div>
          <div class="shock-gauge-bar-bg">
            <div class="shock-gauge-bar-fill" id="shock-gauge-fill"></div>
          </div>
          <div class="shock-gauge-labels">
            <span class="shock-gauge-label-text" style="color:${COLORS.accentRed}">${isRTL ? 'هبوطي' : data.locale === 'tr' ? 'Düşüş' : 'Bearish'}</span>
            <span class="shock-gauge-label-text" style="color:${COLORS.accentGold}">${isRTL ? 'محايد' : data.locale === 'tr' ? 'Nötr' : 'Neutral'}</span>
            <span class="shock-gauge-label-text" style="color:${COLORS.accentGreen}">${isRTL ? 'صعودي' : data.locale === 'tr' ? 'Yükseliş' : 'Bullish'}</span>
          </div>
          <div class="shock-gauge-value" id="shock-gauge-value">${impactArrow} ${escapeHTML(impactLabel)}</div>
        </div>

        <!-- Timeline -->
        <div class="shock-timeline" id="shock-timeline">
          <div class="shock-timeline-line"></div>
          ${timelineItems.map((item, i) => `
            <div class="shock-timeline-item" id="shock-tl-${i}">
              <div class="shock-timeline-dot" style="border-color:${item.color}; background:${item.color}20;"></div>
              <div class="shock-timeline-text">${escapeHTML(item.text)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <script>
    (function() {
      var valueEl = document.getElementById('shock-value');
      var gaugeFill = document.getElementById('shock-gauge-fill');
      var gaugeSection = document.getElementById('shock-gauge');
      var timeline = document.getElementById('shock-timeline');
      var flashAlert = document.getElementById('shock-flash-alert');
      var statCard = document.getElementById('shock-stat-card');

      var targetValue = ${numericValue};
      var valuePrefix = ${JSON.stringify(valuePrefix || '')};
      var valueSuffix = ${JSON.stringify(valueSuffix || '')};
      var gaugeTarget = ${gaugeTarget};

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.5 — Main value counts up
        var countPhase = segmentProgress(p, 0, 0.5);
        if (countPhase > 0) {
          var eased = easeOutCubic(countPhase);
          var currentVal = Math.round(targetValue * eased);
          valueEl.textContent = valuePrefix + currentVal.toLocaleString() + valueSuffix;
          statCard.classList.add('glow');
        }

        // Phase 2: 0.15-0.55 — Gauge fills
        var gaugePhase = segmentProgress(p, 0.15, 0.55);
        if (gaugePhase > 0) {
          gaugeSection.classList.add('visible');
          var gaugeEased = easeOutCubic(gaugePhase);
          gaugeFill.style.width = (gaugeTarget * gaugeEased) + '%';
        }

        // Phase 3: 0.25-0.70 — Timeline draws
        var tlPhase = segmentProgress(p, 0.25, 0.70);
        if (tlPhase > 0) {
          timeline.classList.add('visible');
          if (tlPhase > 0.1) timeline.classList.add('line-drawn');

          var items = timeline.querySelectorAll('.shock-timeline-item');
          items.forEach(function(item, i) {
            var itemPhase = segmentProgress(p, 0.28 + i * 0.1, 0.38 + i * 0.1);
            if (itemPhase > 0) item.classList.add('visible');
          });
        }

        // Phase 4: 0.50-0.65 — Mini stats appear
        var miniPhase = segmentProgress(p, 0.50, 0.65);
        for (var m = 0; m < 3; m++) {
          var miniEl = document.getElementById('shock-mini-' + m);
          if (miniEl) {
            var mPhase = segmentProgress(p, 0.50 + m * 0.05, 0.55 + m * 0.05);
            if (mPhase > 0) miniEl.classList.add('visible');
          }
        }

        // Phase 5: 0.70-0.80 — Flash alert
        var alertPhase = segmentProgress(p, 0.70, 0.80);
        if (alertPhase > 0) {
          flashAlert.classList.add('visible');
        }

        // Breathing effect on stat card
        var breathe = 1;
        statCard.style.transform = 'scale(' + breathe + ')';
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 3: Roots ──────────────────────────────────────────────
// ★NEW — 3 interconnected root cause circles + intersection point
function generateRootsPulse(data) {
  const isRTL = data.locale === 'ar';
  const rootCauses = (data.root_causes || []).slice(0, 3);
  const sectionTitle = isRTL ? 'الجذور العميقة' : data.locale === 'tr' ? 'Temel Nedenler' : 'Root Causes';
  const sectionSub = isRTL ? 'تحليل الأسباب الرئيسية' : data.locale === 'tr' ? 'Temel İtici Güçler Analizi' : 'Analysis of Key Drivers';
  const intersectionLabel = isRTL ? 'نقطة التقاطع' : data.locale === 'tr' ? 'Kesişim Noktası' : 'Intersection Point';

  // Circle positions for a triangle layout
  const circles = [
    { cx: 960, cy: 260, color: COLORS.accentBlue, iconColor: COLORS.accentBlue },
    { cx: 640, cy: 620, color: COLORS.accentCyan, iconColor: COLORS.accentCyan },
    { cx: 1280, cy: 620, color: COLORS.accentPurple, iconColor: COLORS.accentPurple },
  ];

  // Intersection point (center of triangle)
  const intersectCx = 960;
  const intersectCy = 500;

  return `
    <style>
      .roots-container {
        width:100%; height:100%; position:relative;
        display:flex; flex-direction:column; align-items:center;
      }

      .roots-header {
        text-align:center; margin-top:24px; margin-bottom:8px;
        opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .roots-header.visible { opacity:1; transform:translateY(0); }
      .roots-header-sub {
        font-size:12px; color:${COLORS.accentCyan}; font-weight:600;
        letter-spacing:3px; text-transform:uppercase; margin-bottom:6px;
      }
      .roots-header-title {
        font-size:26px; font-weight:800; color:${COLORS.textWhite};
      }

      .roots-svg-area {
        position:relative; width:100%; flex:1;
      }
      .roots-svg {
        width:100%; height:100%; position:absolute; top:0; left:0;
      }

      /* Connection lines between circles */
      .roots-conn-line {
        stroke-width:2; fill:none; opacity:0;
        transition: opacity 0.5s ease;
      }
      .roots-conn-line.visible { opacity:1; }

      /* Root cause circle group */
      .roots-circle-group {
        opacity:0; transition: opacity 0.5s ease;
      }
      .roots-circle-group.visible { opacity:1; }

      .roots-circle-outer {
        fill:none; stroke-width:2; opacity:0.3;
      }
      .roots-circle-fill {
        opacity:0.08;
      }
      .roots-circle-icon {
        font-size:32px; text-anchor:middle; dominant-baseline:central;
      }
      .roots-circle-title {
        font-size:18px; font-weight:700; fill:${COLORS.textWhite};
        text-anchor:middle; dominant-baseline:central;
      }
      .roots-circle-desc {
        font-size:13px; fill:${COLORS.textGray};
        text-anchor:middle;
      }

      /* Intersection point */
      .roots-intersect {
        opacity:0; transition: opacity 0.8s ease;
      }
      .roots-intersect.visible { opacity:1; }
      .roots-intersect-ring {
        fill:none; stroke:${COLORS.accentGold}; stroke-width:2;
        stroke-dasharray:4 3; opacity:0.6;
      }
      .roots-intersect-dot {
        fill:${COLORS.accentGold}; filter: drop-shadow(0 0 8px ${COLORS.accentGold});
      }
      .roots-intersect-label {
        font-size:14px; font-weight:700; fill:${COLORS.accentGold};
        text-anchor:middle; dominant-baseline:central;
      }
      .roots-intersect-sublabel {
        font-size:11px; fill:${COLORS.textDim};
        text-anchor:middle;
      }

      /* Animated dashed lines flowing */
      @keyframes dashFlow {
        0% { stroke-dashoffset:20; }
        100% { stroke-dashoffset:0; }
      }
      .roots-conn-line.flowing {
        stroke-dasharray:8 4;
        animation: dashFlow 1.5s linear infinite;
      }

      /* Pulse ring animation */
      @keyframes pulseRing {
        0% { r:55; opacity:0.4; }
        100% { r:80; opacity:0; }
      }
    </style>

    <div class="roots-container" id="roots-root">
      <!-- Header -->
      <div class="roots-header" id="roots-header">
        <div class="roots-header-sub">◆ ${isRTL ? 'تحليل' : data.locale === 'tr' ? 'ANALİZ' : 'ANALYSIS'}</div>
        <div class="roots-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <!-- SVG area with circles and connections -->
      <div class="roots-svg-area">
        <svg class="roots-svg" viewBox="0 0 1920 996" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${circles.map((c, i) => `
              <radialGradient id="rootGrad${i}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="${c.color}" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="${c.color}" stop-opacity="0.02"/>
              </radialGradient>
              <filter id="rootGlow${i}">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            `).join('')}
            <radialGradient id="intersectGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${COLORS.accentGold}" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="${COLORS.accentGold}" stop-opacity="0.02"/>
            </radialGradient>
          </defs>

          <!-- Connection lines -->
          <line class="roots-conn-line" id="roots-conn-0" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${circles[1].cx}" y2="${circles[1].cy}" stroke="${COLORS.accentBlue}" />
          <line class="roots-conn-line" id="roots-conn-1" x1="${circles[1].cx}" y1="${circles[1].cy}" x2="${circles[2].cx}" y2="${circles[2].cy}" stroke="${COLORS.accentCyan}" />
          <line class="roots-conn-line" id="roots-conn-2" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${circles[2].cx}" y2="${circles[2].cy}" stroke="${COLORS.accentPurple}" />

          <!-- Lines from circles to intersection -->
          <line class="roots-conn-line" id="roots-conn-3" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />
          <line class="roots-conn-line" id="roots-conn-4" x1="${circles[1].cx}" y1="${circles[1].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />
          <line class="roots-conn-line" id="roots-conn-5" x1="${circles[2].cx}" y1="${circles[2].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />

          ${circles.map((c, i) => {
            const cause = rootCauses[i] || { title: '', description: '', icon: '📊' };
            return `
              <g class="roots-circle-group" id="roots-circle-${i}" filter="url(#rootGlow${i})">
                <!-- Pulse ring -->
                <circle cx="${c.cx}" cy="${c.cy}" r="55" fill="none" stroke="${c.color}" stroke-width="1.5" opacity="0.2" id="roots-pulse-${i}"/>

                <!-- Outer ring -->
                <circle class="roots-circle-outer" cx="${c.cx}" cy="${c.cy}" r="65" stroke="${c.color}"/>

                <!-- Fill area -->
                <circle class="roots-circle-fill" cx="${c.cx}" cy="${c.cy}" r="65" fill="url(#rootGrad${i})"/>

                <!-- Icon -->
                <text class="roots-circle-icon" x="${c.cx}" y="${c.cy - 18}" font-size="28" fill="${c.color}">${escapeHTML(((cause.title || '?')[0] || '?').toUpperCase())}</text>

                <!-- Title -->
                <text class="roots-circle-title" x="${c.cx}" y="${c.cy + 14}" font-size="16">${escapeHTML(cause.title)}</text>

                <!-- Description (below circle) -->
                <foreignObject x="${c.cx - 120}" y="${c.cy + 45}" width="240" height="60">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center; font-size:12px; color:${COLORS.textGray}; line-height:1.5; font-family:'Noto Sans Arabic','Inter',sans-serif; direction:${isRTL ? 'rtl' : 'ltr'};">${escapeHTML(cause.description)}</div>
                </foreignObject>
              </g>
            `;
          }).join('')}

          <!-- Intersection point -->
          <g class="roots-intersect" id="roots-intersect">
            <circle cx="${intersectCx}" cy="${intersectCy}" r="35" fill="url(#intersectGrad)" />
            <circle class="roots-intersect-ring" cx="${intersectCx}" cy="${intersectCy}" r="28" id="roots-int-ring" />
            <circle class="roots-intersect-dot" cx="${intersectCx}" cy="${intersectCy}" r="8" id="roots-int-dot" />
            <text class="roots-intersect-label" x="${intersectCx}" y="${intersectCy + 50}">${escapeHTML(intersectionLabel)}</text>
            <text class="roots-intersect-sublabel" x="${intersectCx}" y="${intersectCy + 68}">${escapeHTML((data.title || '').length > 80 ? (data.title || '').substring(0, 77) + '...' : (data.title || ''))}</text>
          </g>
        </svg>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('roots-header');
      var conns = [];
      for (var ci = 0; ci < 6; ci++) {
        conns.push(document.getElementById('roots-conn-' + ci));
      }
      var circles = [
        document.getElementById('roots-circle-0'),
        document.getElementById('roots-circle-1'),
        document.getElementById('roots-circle-2'),
      ];
      var intersect = document.getElementById('roots-intersect');
      var intRing = document.getElementById('roots-int-ring');

      var circlePositions = ${JSON.stringify(circles.map(c => ({ cx: c.cx, cy: c.cy })))};

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.15 — Header
        var headerPhase = segmentProgress(p, 0, 0.15);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.10-0.50 — Circles appear one by one
        for (var i = 0; i < 3; i++) {
          var circlePhase = segmentProgress(p, 0.10 + i * 0.12, 0.20 + i * 0.12);
          if (circlePhase > 0 && circles[i]) {
            circles[i].classList.add('visible');
            // Scale-in effect
            var scale = 0.6 + 0.4 * easeOutCubic(circlePhase);
            var opacity = circlePhase;
            circles[i].style.opacity = opacity;
            circles[i].style.transform = 'scale(' + scale + ')';
            circles[i].style.transformOrigin = circlePositions[i].cx + 'px ' + circlePositions[i].cy + 'px';
          }
        }

        // Phase 3: 0.35-0.60 — Connection lines appear
        for (var j = 0; j < 3; j++) {
          var connPhase = segmentProgress(p, 0.35 + j * 0.06, 0.42 + j * 0.06);
          if (connPhase > 0 && conns[j]) {
            conns[j].classList.add('visible');
            conns[j].style.opacity = String(easeOutCubic(connPhase) * 0.6);
            if (connPhase > 0.5) conns[j].classList.add('flowing');
          }
        }

        // Phase 4: 0.55-0.70 — Lines to intersection
        for (var k = 3; k < 6; k++) {
          var intConnPhase = segmentProgress(p, 0.55 + (k - 3) * 0.04, 0.62 + (k - 3) * 0.04);
          if (intConnPhase > 0 && conns[k]) {
            conns[k].classList.add('visible');
            conns[k].style.opacity = String(easeOutCubic(intConnPhase) * 0.5);
            conns[k].classList.add('flowing');
          }
        }

        // Phase 5: 0.65-0.85 — Intersection point
        var intPhase = segmentProgress(p, 0.65, 0.85);
        if (intPhase > 0) {
          intersect.classList.add('visible');
          intersect.style.opacity = String(easeOutCubic(intPhase));
          // Ring pulse
          var ringR = 28 + Math.sin(intPhase * Math.PI * 4) * 5;
          if (intRing) intRing.setAttribute('r', String(ringR));
        }

        // Breathing disabled — professional videos don't pulse
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 4: Race ───────────────────────────────────────────────
// Racing bar chart of indicators + morph to line chart
function generateRacePulse(data) {
  const isRTL = data.locale === 'ar';
  const chartData = data.chart_data || {};
  const labels = chartData.labels || [];
  const values = chartData.values || [];
  const chartTitle = chartData.title || (isRTL ? 'مؤشرات الأداء' : data.locale === 'tr' ? 'Performans Göstergeleri' : 'Performance Indicators');
  const sectionSub = isRTL ? 'سباق المؤشرات' : data.locale === 'tr' ? 'Gösterge Yarışı' : 'Indicator Race';

  // Generate indicator bars from stats + chart data
  const indicators = (data.stats || []).slice(0, 6).map((s, i) => {
    const numVal = parseFloat(String(s.value).replace(/[^0-9.\-]/g, '')) || (Math.random() * 80 + 20);
    const isUp = !String(s.value).includes('↓') && !String(s.value).includes('-');
    return {
      label: s.label,
      value: s.value,
      numValue: Math.abs(numVal),
      color: isUp ? COLORS.accentGreen : COLORS.accentRed,
      direction: isUp ? 1 : -1,
    };
  });

  // If not enough stats, add from chart data
  if (indicators.length < 3 && values.length > 0) {
    for (let i = indicators.length; i < Math.min(6, values.length); i++) {
      const v = values[i] || 50;
      indicators.push({
        label: labels[i] || (isRTL ? `مؤشر ${i + 1}` : data.locale === 'tr' ? `Gösterge ${i + 1}` : `Indicator ${i + 1}`),
        value: String(v),
        numValue: Math.abs(v),
        color: v >= 0 ? COLORS.accentGreen : COLORS.accentRed,
        direction: v >= 0 ? 1 : -1,
      });
    }
  }

  // Ensure at least 3 indicators
  while (indicators.length < 3) {
    const idx = indicators.length;
    indicators.push({
      label: isRTL ? `مؤشر ${idx + 1}` : data.locale === 'tr' ? `Gösterge ${idx + 1}` : `Indicator ${idx + 1}`,
      value: String(Math.round(50 + Math.random() * 40)),
      numValue: 50 + Math.random() * 40,
      color: [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentGreen][idx % 3],
      direction: 1,
    });
  }

  const maxIndicatorVal = Math.max(...indicators.map(ind => ind.numValue), 1);

  // SVG chart data for morph phase
  const chartPoints = values.length > 0 ? values.slice(0, 10) : indicators.map(ind => ind.numValue);
  const chartLabelsArr = values.length > 0 ? labels.slice(0, 10) : indicators.map(ind => ind.label);

  return `
    <style>
      .race-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        padding:28px 56px 20px; position:relative;
      }

      .race-header {
        text-align:center; margin-bottom:20px;
        opacity:0; transform:translateY(-10px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .race-header.visible { opacity:1; transform:translateY(0); }
      .race-header-sub { font-size:12px; color:${COLORS.accentCyan}; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; }
      .race-header-title { font-size:22px; font-weight:800; color:${COLORS.textWhite}; }

      .race-body {
        flex:1; display:flex; gap:32px; position:relative;
      }

      /* Bar chart area */
      .race-bars {
        flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;
      }

      .race-bar-row {
        display:flex; align-items:center; gap:16px;
        opacity:0; transform:translateX(${isRTL ? '' : '-'}20px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .race-bar-row.visible { opacity:1; transform:translateX(0); }

      .race-bar-label {
        width:140px; font-size:14px; font-weight:600; color:${COLORS.textLight};
        text-align:${isRTL ? 'left' : 'right'}; white-space:nowrap; overflow:hidden;
        text-overflow:ellipsis;
      }
      .race-bar-track {
        flex:1; height:28px; background:${COLORS.bgCard}; border-radius:4px;
        border:1px solid ${COLORS.borderBlue}; position:relative; overflow:hidden;
      }
      .race-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; height:100%;
        border-radius:8px; width:0%; transition: width 0.4s ease;
      }
      .race-bar-fill-inner {
        height:100%; border-radius:8px;
        display:flex; align-items:center; justify-content:flex-end;
        padding-${isRTL ? 'left' : 'right'}:12px;
      }
      .race-bar-value {
        font-size:13px; font-weight:700; color:white;
        text-shadow:0 1px 3px rgba(0,0,0,0.3);
        white-space:nowrap;
      }
      .race-bar-rank {
        width:32px; height:32px; border-radius:8px;
        display:flex; align-items:center; justify-content:center;
        font-size:14px; font-weight:800;
      }

      /* Line chart area */
      .race-line-chart {
        flex:0.9; position:relative;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        border-radius:16px; padding:20px;
        opacity:0; transform:scale(0.95);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .race-line-chart.visible { opacity:1; transform:scale(1); }
      .race-line-chart-title {
        font-size:14px; font-weight:600; color:${COLORS.textGray};
        margin-bottom:12px;
      }

      /* Morph transition overlay */
      .race-morph-label {
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        font-size:16px; font-weight:600; color:${COLORS.accentCyan};
        letter-spacing:2px; text-transform:uppercase;
        opacity:0; transition: opacity 0.3s ease;
        z-index:10;
      }
      .race-morph-label.visible { opacity:0.8; }
    </style>

    <div class="race-container" id="race-root">
      <!-- Header -->
      <div class="race-header" id="race-header">
        <div class="race-header-sub">◆ ${escapeHTML(sectionSub)}</div>
        <div class="race-header-title">${escapeHTML(chartTitle)}</div>
      </div>

      <!-- Body -->
      <div class="race-body">
        <!-- Racing bars -->
        <div class="race-bars" id="race-bars">
          ${indicators.map((ind, i) => `
            <div class="race-bar-row" id="race-row-${i}">
              <div class="race-bar-rank" style="background:${ind.color}15; color:${ind.color}; border:1px solid ${ind.color}30;">${i + 1}</div>
              <div class="race-bar-label">${escapeHTML(ind.label)}</div>
              <div class="race-bar-track">
                <div class="race-bar-fill" id="race-fill-${i}">
                  <div class="race-bar-fill-inner" style="background:linear-gradient(90deg, ${ind.color}40, ${ind.color});">
                    <span class="race-bar-value">${escapeHTML(ind.value)}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Line chart -->
        <div class="race-line-chart" id="race-line-chart">
          <div class="race-line-chart-title">${isRTL ? 'اتجاه المؤشرات' : data.locale === 'tr' ? 'Gösterge Trendi' : 'Indicator Trend'}</div>
          <svg id="race-line-svg" viewBox="0 0 600 400" width="100%" height="380" style="overflow:visible;">
            <defs>
              <linearGradient id="raceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${COLORS.accentBlue}" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="${COLORS.accentBlue}" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <!-- Grid -->
            ${[0,1,2,3,4].map(i => `
              <line x1="50" y1="${20 + i * 80}" x2="580" y2="${20 + i * 80}" stroke="rgba(59,130,246,0.06)" stroke-width="1"/>
            `).join('')}
            <!-- Area path -->
            <path id="race-area-path" fill="url(#raceAreaGrad)" d="" />
            <!-- Line path -->
            <path id="race-line-path" fill="none" stroke="${COLORS.accentBlue}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="" />
            <!-- Data points (will be added dynamically) -->
            <g id="race-points"></g>
          </svg>
        </div>
      </div>

      <!-- Morph label -->
      <div class="race-morph-label" id="race-morph-label">${isRTL ? 'تحويل ◆' : data.locale === 'tr' ? '◆ DÖNÜŞÜM' : '◆ MORPH'}</div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('race-header');
      var barsContainer = document.getElementById('race-bars');
      var lineChart = document.getElementById('race-line-chart');
      var linePath = document.getElementById('race-line-path');
      var areaPath = document.getElementById('race-area-path');
      var pointsGroup = document.getElementById('race-points');
      var morphLabel = document.getElementById('race-morph-label');

      var indicators = ${JSON.stringify(indicators.map(ind => ({ label: ind.label, value: ind.value, numValue: ind.numValue, color: ind.color })))};
      var maxVal = ${maxIndicatorVal};
      var chartPoints = ${JSON.stringify(chartPoints)};
      var chartLabels = ${JSON.stringify(chartLabelsArr)};

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.10 — Header
        var headerPhase = segmentProgress(p, 0, 0.10);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.08-0.55 — Racing bars animate in
        for (var i = 0; i < indicators.length; i++) {
          var rowEl = document.getElementById('race-row-' + i);
          var fillEl = document.getElementById('race-fill-' + i);
          var barStart = 0.08 + i * 0.06;
          var barEnd = 0.20 + i * 0.06;
          var barPhase = segmentProgress(p, barStart, barEnd);

          if (barPhase > 0 && rowEl) {
            rowEl.classList.add('visible');
          }

          // Bar fill animation extends from barStart to 0.55
          var fillPhase = segmentProgress(p, barStart, 0.55);
          if (fillPhase > 0 && fillEl) {
            var targetWidth = (indicators[i].numValue / maxVal) * 100;
            var currentWidth = targetWidth * easeOutCubic(fillPhase);
            fillEl.style.width = currentWidth + '%';
          }
        }

        // Phase 3: 0.50-0.65 — Line chart appears
        var linePhase = segmentProgress(p, 0.50, 0.65);
        if (linePhase > 0) {
          lineChart.classList.add('visible');
          drawLineChart(easeOutCubic(linePhase));
        }

        // Phase 4: 0.60-0.72 — Morph label flash
        var morphPhase = segmentProgress(p, 0.60, 0.72);
        if (morphPhase > 0 && morphPhase < 1) {
          morphLabel.classList.add('visible');
        } else {
          morphLabel.classList.remove('visible');
        }

        // Phase 5: 0.72-1.0 — Both fully visible, bars slightly dim, line chart prominent
        var finalPhase = segmentProgress(p, 0.72, 1.0);
        if (finalPhase > 0) {
          barsContainer.style.opacity = String(0.7 + 0.3 * (1 - finalPhase * 0.3));
          lineChart.style.transform = 'scale(' + (1 + finalPhase * 0.02) + ')';
        }
      };

      function drawLineChart(progress) {
        if (chartPoints.length === 0) return;
        var points = chartPoints;
        var W = 600, H = 400;
        var padL = 50, padR = 20, padT = 20, padB = 40;
        var chartW = W - padL - padR;
        var chartH = H - padT - padB;
        var maxP = Math.max.apply(null, points) * 1.15;
        var minP = Math.min(0, ...points);
        var range = maxP - minP || 1;

        var visibleCount = Math.ceil(points.length * progress);
        var coords = [];
        for (var i = 0; i < visibleCount; i++) {
          var x = padL + (chartW / Math.max(1, points.length - 1)) * i;
          var y = padT + chartH - ((points[i] - minP) / range * chartH);
          coords.push({ x: x, y: y });
        }

        if (coords.length === 0) return;

        // Line path
        var lineD = 'M' + coords[0].x + ',' + coords[0].y;
        for (var j = 1; j < coords.length; j++) {
          lineD += ' L' + coords[j].x + ',' + coords[j].y;
        }
        linePath.setAttribute('d', lineD);

        // Area path
        var areaD = lineD + ' L' + coords[coords.length - 1].x + ',' + (padT + chartH) + ' L' + coords[0].x + ',' + (padT + chartH) + ' Z';
        areaPath.setAttribute('d', areaD);

        // Data points
        var pointsHTML = '';
        for (var k = 0; k < coords.length; k++) {
          pointsHTML += '<circle cx="' + coords[k].x + '" cy="' + coords[k].y + '" r="4" fill="' + '${COLORS.accentBlue}' + '" stroke="white" stroke-width="1.5" opacity="0.9"/>';
          if (chartLabels[k]) {
            pointsHTML += '<text x="' + coords[k].x + '" y="' + (padT + chartH + 18) + '" text-anchor="middle" fill="${COLORS.textDim}" font-size="10" font-family="Inter,sans-serif">' + chartLabels[k].substring(0, 8) + '</text>';
          }
        }
        pointsGroup.innerHTML = pointsHTML;
      }

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 5: History ────────────────────────────────────────────
// ★NEW — 3 historical parallels on vertical timeline + comparison
function generateHistoryPulse(data) {
  const isRTL = data.locale === 'ar';
  const parallels = (data.historical_parallels || []).slice(0, 3);
  const sectionTitle = isRTL ? 'أوجه الشبه التاريخية' : data.locale === 'tr' ? 'Tarihsel Benzerlikler' : 'Historical Parallels';
  const sectionSub = isRTL ? 'الماضي يعيد نفسه؟' : data.locale === 'tr' ? 'Tarih Tekerrür mü?' : 'History Repeats?';
  const compareToLabel = isRTL ? 'مقارنة مع الوضع الحالي' : data.locale === 'tr' ? 'Mevcut Durumla Karşılaştırma' : 'Compared to Current Situation';

  // Color coding for each parallel
  const parallelColors = [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentPurple];

  return `
    <style>
      .history-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        padding:24px 56px 16px; position:relative;
      }

      .history-header {
        text-align:center; margin-bottom:16px;
        opacity:0; transform:translateY(-10px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .history-header.visible { opacity:1; transform:translateY(0); }
      .history-header-sub { font-size:12px; color:${COLORS.accentYellow}; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; }
      .history-header-title { font-size:24px; font-weight:800; color:${COLORS.textWhite}; }

      .history-body {
        flex:1; display:flex; gap:24px; position:relative;
      }

      /* Vertical timeline */
      .history-timeline {
        width:4px; position:relative; margin-${isRTL ? 'left' : 'right'}:28px;
        background:linear-gradient(180deg, ${COLORS.accentBlue}40, ${COLORS.accentCyan}30, ${COLORS.accentPurple}20);
        border-radius:2px;
        transform:scaleY(0); transform-origin:top;
        transition:transform 0.8s ease;
      }
      .history-timeline.drawn { transform:scaleY(1); }

      .history-timeline-dot {
        position:absolute; ${isRTL ? 'right' : 'left'}:-8px; width:20px; height:20px;
        border-radius:50%; border:2px solid; background:${COLORS.bgDark};
        display:flex; align-items:center; justify-content:center;
        opacity:0; transform:scale(0.5);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .history-timeline-dot.visible { opacity:1; transform:scale(1); }
      .history-timeline-dot-inner {
        width:8px; height:8px; border-radius:50%;
      }

      /* Parallel cards */
      .history-cards {
        flex:1; display:flex; flex-direction:column; gap:16px;
        justify-content:center;
      }

      .history-card {
        display:flex; gap:20px; padding:20px 24px;
        background:linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue}; border-radius:12px;
        position:relative; overflow:hidden;
        opacity:0; transform:translateX(${isRTL ? '' : '-'}25px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .history-card.visible { opacity:1; transform:translateX(0); }

      .history-card-year-badge {
        min-width:80px; height:80px; border-radius:8px;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        font-size:28px; font-weight:900; line-height:1;
      }
      .history-card-year-label {
        font-size:10px; font-weight:600; letter-spacing:1px; margin-top:2px;
        text-transform:uppercase;
      }

      .history-card-content { flex:1; }
      .history-card-title {
        font-size:18px; font-weight:700; color:${COLORS.textWhite}; margin-bottom:6px;
      }
      .history-card-cause {
        font-size:13px; color:${COLORS.textGray}; line-height:1.5; margin-bottom:8px;
      }
      .history-card-cause-label {
        display:inline; font-size:11px; font-weight:600; color:${COLORS.accentYellow};
        letter-spacing:1px; text-transform:uppercase;
      }
      .history-card-result {
        display:flex; align-items:center; gap:8px;
        padding:8px 14px; border-radius:8px;
        background:rgba(0,0,0,0.2); border:1px solid ${COLORS.borderBlue};
      }
      .history-card-result-icon { font-size:14px; }
      .history-card-result-label {
        font-size:11px; color:${COLORS.textDim}; letter-spacing:1px;
        text-transform:uppercase;
      }
      .history-card-result-text {
        font-size:13px; color:${COLORS.textLight}; font-weight:500;
      }

      /* Comparison section */
      .history-compare {
        flex:0.6; display:flex; flex-direction:column; justify-content:center;
        padding:24px;
        opacity:0; transform:scale(0.95);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .history-compare.visible { opacity:1; transform:scale(1); }

      .history-compare-card {
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        border-radius:16px; padding:24px; position:relative; overflow:hidden;
      }
      .history-compare-card::before {
        content:''; position:absolute; top:0; left:0; right:0; height:3px;
        background:linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentCyan}, ${COLORS.accentPurple});
      }
      .history-compare-title {
        font-size:14px; font-weight:600; color:${COLORS.accentCyan};
        letter-spacing:1px; margin-bottom:16px;
        display:flex; align-items:center; gap:8px;
      }
      .history-compare-item {
        display:flex; align-items:center; gap:12px;
        padding:10px 0; border-bottom:1px solid ${COLORS.borderBlue};
      }
      .history-compare-item:last-child { border-bottom:none; }
      .history-compare-year {
        font-size:13px; font-weight:700; width:50px;
      }
      .history-compare-bar-track {
        flex:1; height:8px; background:rgba(59,130,246,0.1);
        border-radius:4px; position:relative; overflow:hidden;
      }
      .history-compare-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0;
        height:100%; border-radius:4px; width:0%;
        transition: width 0.5s ease;
      }
      .history-compare-similarity {
        font-size:12px; font-weight:600; width:40px; text-align:${isRTL ? 'left' : 'right'};
      }

      /* Accent decorations */
      .history-card-accent {
        position:absolute; top:0; ${isRTL ? 'left' : 'right'}:0;
        width:60px; height:60px; opacity:0.05;
      }
    </style>

    <div class="history-container" id="history-root">
      <!-- Header -->
      <div class="history-header" id="history-header">
        <div class="history-header-sub">◆ ${escapeHTML(sectionSub)}</div>
        <div class="history-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <!-- Body -->
      <div class="history-body">
        <!-- Left side: Timeline + Cards -->
        <div style="flex:1; display:flex; position:relative;">
          <!-- Timeline bar -->
          <div class="history-timeline" id="history-timeline">
            ${parallels.map((_, i) => {
              const topPercent = 15 + i * 30;
              return `<div class="history-timeline-dot" id="history-dot-${i}" style="top:${topPercent}%; border-color:${parallelColors[i]};">
                <div class="history-timeline-dot-inner" style="background:${parallelColors[i]};"></div>
              </div>`;
            }).join('')}
          </div>

          <!-- Cards -->
          <div class="history-cards">
            ${parallels.map((par, i) => `
              <div class="history-card" id="history-card-${i}">
                <div class="history-card-year-badge" style="background:${parallelColors[i]}12; border:1px solid ${parallelColors[i]}30;">
                  <span style="color:${parallelColors[i]};">${escapeHTML(par.year)}</span>
                  <span class="history-card-year-label" style="color:${parallelColors[i]}60;">${isRTL ? 'سنة' : data.locale === 'tr' ? 'YL' : 'YR'}</span>
                </div>
                <div class="history-card-content">
                  <div class="history-card-title">${escapeHTML(par.title)}</div>
                  <div class="history-card-cause">
                    <span class="history-card-cause-label">${isRTL ? 'السبب:' : data.locale === 'tr' ? 'NEDEN:' : 'CAUSE:'}</span>
                    ${escapeHTML(par.cause)}
                  </div>
                  <div class="history-card-result">
                    <span class="history-card-result-icon" style="color:${COLORS.accentCyan};font-size:12px;font-weight:700;">◆</span>
                    <span class="history-card-result-label">${isRTL ? 'النتيجة:' : data.locale === 'tr' ? 'SONUÇ:' : 'RESULT:'}</span>
                    <span class="history-card-result-text">${escapeHTML(par.result)}</span>
                  </div>
                </div>
                <div class="history-card-accent">
                  <svg viewBox="0 0 60 60" fill="${parallelColors[i]}">
                    <circle cx="30" cy="30" r="30"/>
                  </svg>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right side: Comparison -->
        <div class="history-compare" id="history-compare">
          <div class="history-compare-card">
            <div class="history-compare-title">
              <span>◆</span>
              <span>${escapeHTML(compareToLabel)}</span>
            </div>
            ${parallels.map((par, i) => {
              // Simulated similarity percentages
              const similarities = [78, 62, 55];
              const sim = similarities[i] || 50;
              return `
                <div class="history-compare-item">
                  <span class="history-compare-year" style="color:${parallelColors[i]};">${escapeHTML(par.year)}</span>
                  <div class="history-compare-bar-track">
                    <div class="history-compare-bar-fill" id="history-bar-${i}" style="background:${parallelColors[i]};"></div>
                  </div>
                  <span class="history-compare-similarity" style="color:${parallelColors[i]};">${sim}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('history-header');
      var timeline = document.getElementById('history-timeline');
      var compare = document.getElementById('history-compare');

      var dots = [];
      var cards = [];
      var bars = [];
      for (var i = 0; i < 3; i++) {
        dots.push(document.getElementById('history-dot-' + i));
        cards.push(document.getElementById('history-card-' + i));
        bars.push(document.getElementById('history-bar-' + i));
      }

      var similarities = [78, 62, 55];
      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.10 — Header
        var headerPhase = segmentProgress(p, 0, 0.10);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.08-0.30 — Timeline draws
        var tlPhase = segmentProgress(p, 0.08, 0.30);
        if (tlPhase > 0) {
          timeline.classList.add('drawn');
          timeline.style.transform = 'scaleY(' + easeOutCubic(tlPhase) + ')';
        }

        // Phase 3: 0.15-0.70 — Cards and dots appear
        for (var i = 0; i < 3; i++) {
          var cardStart = 0.15 + i * 0.15;
          var cardEnd = 0.25 + i * 0.15;
          var cardPhase = segmentProgress(p, cardStart, cardEnd);

          if (cardPhase > 0) {
            if (dots[i]) dots[i].classList.add('visible');
            if (cards[i]) cards[i].classList.add('visible');
          }
        }

        // Phase 4: 0.55-0.80 — Comparison section
        var compPhase = segmentProgress(p, 0.55, 0.70);
        if (compPhase > 0) {
          compare.classList.add('visible');

          // Animate comparison bars
          for (var j = 0; j < 3; j++) {
            var barPhase = segmentProgress(p, 0.58 + j * 0.06, 0.68 + j * 0.06);
            if (barPhase > 0 && bars[j]) {
              bars[j].style.width = (similarities[j] * easeOutCubic(barPhase)) + '%';
            }
          }
        }

        // Breathing disabled — professional videos don't pulse
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 6: Alert ───────────────────────────────────────────────
// 3 scenario flash alerts appearing one by one with probability bars
function generateAlertPulse(data) {
  const isRTL = data.locale === 'ar';
  const scenarios = (data.scenarios || []).slice(0, 3);
  const sectionTitle = isRTL ? 'سيناريوهات محتملة' : data.locale === 'tr' ? 'Olası Senaryolar' : 'Likely Scenarios';
  const probabilityLabel = isRTL ? 'الاحتمالية' : data.locale === 'tr' ? 'Olasılık' : 'Probability';
  const resultLabel = isRTL ? 'النتيجة' : data.locale === 'tr' ? 'Sonuç' : 'Result';

  // Map color name to hex
  function scenarioColor(colorName) {
    if (colorName === 'green') return COLORS.accentGreen;
    if (colorName === 'yellow') return COLORS.accentYellow;
    if (colorName === 'red') return COLORS.accentRed;
    return COLORS.accentGold;
  }

  // Parse probability string to number (0-100)
  function parseProbability(prob) {
    const num = parseInt(String(prob).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 50 : Math.min(100, Math.max(0, num));
  }

  const alertCardsHTML = scenarios.map((sc, i) => {
    const color = scenarioColor(sc.color);
    const prob = parseProbability(sc.probability);
    const delay = i * 0.2;
    return `
      <div class="alert-card" id="alert-card-${i}" style="
        opacity:0; transform:translateY(30px) scale(0.95);
        border-left:4px solid ${color};
      ">
        <div class="alert-card-header">
          <div class="alert-color-dot" style="background:${color}; box-shadow:0 0 8px ${color};"></div>
          <span class="alert-card-title" style="color:${color};">${escapeHTML(sc.title)}</span>
          <span class="alert-card-prob-badge" style="background:${color}15; color:${color}; border:1px solid ${color}30;">${escapeHTML(sc.probability)}</span>
        </div>
        <div class="alert-card-result">
          <span class="alert-result-label">${escapeHTML(resultLabel)}:</span>
          <span class="alert-result-value">${escapeHTML(sc.result)}</span>
        </div>
        <div class="alert-prob-row">
          <span class="alert-prob-label">${escapeHTML(probabilityLabel)}</span>
          <div class="alert-prob-bar-bg">
            <div class="alert-prob-bar-fill" id="alert-bar-${i}" style="width:0%; background:linear-gradient(90deg, ${color}, ${color}cc);"></div>
          </div>
          <span class="alert-prob-num" id="alert-prob-num-${i}" style="color:${color};">0%</span>
        </div>
      </div>`;
  }).join('');

  return `
    <style>
      .alert-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
        padding: 40px 80px;
      }

      .alert-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:36px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .alert-header.visible { opacity:1; transform:translateY(0); }

      .alert-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentYellow}20, ${COLORS.accentRed}15);
        border:1px solid ${COLORS.accentYellow}30;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .alert-header-title {
        font-size:22px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .alert-cards-wrap {
        width:100%; max-width:1100px; display:flex; flex-direction:column;
        gap:20px;
      }

      .alert-card {
        width:100%; padding:24px 32px; border-radius:12px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
        position:relative; overflow:hidden;
      }
      .alert-card.visible {
        opacity:1 !important; transform:translateY(0) scale(1) !important;
      }
      .alert-card::after {
        content:''; position:absolute; top:0; left:0; right:0; bottom:0;
        opacity:0; pointer-events:none; transition: opacity 0.5s ease;
      }
      .alert-card.flash::after {
        opacity:0.08;
      }

      .alert-card-header {
        display:flex; align-items:center; gap:12px; margin-bottom:14px;
      }
      .alert-color-dot {
        width:10px; height:10px; border-radius:50%; flex-shrink:0;
      }
      .alert-card-title {
        font-size:17px; font-weight:700; flex:1;
      }
      .alert-card-prob-badge {
        padding:4px 14px; border-radius:100px;
        font-size:14px; font-weight:700; letter-spacing:0.5px;
      }

      .alert-card-result {
        font-size:15px; color:${COLORS.textLight}; margin-bottom:16px;
        line-height:1.5;
      }
      .alert-result-label {
        color:${COLORS.textDim}; font-weight:500; margin-${isRTL ? 'left' : 'right'}:6px;
      }
      .alert-result-value {
        color:${COLORS.textWhite}; font-weight:600;
      }

      .alert-prob-row {
        display:flex; align-items:center; gap:12px;
      }
      .alert-prob-label {
        font-size:12px; color:${COLORS.textDim}; font-weight:500;
        min-width:${isRTL ? '60px' : '80px'}; text-align:${isRTL ? 'right' : 'left'};
      }
      .alert-prob-bar-bg {
        flex:1; height:8px; border-radius:4px;
        background:rgba(255,255,255,0.06);
        overflow:hidden;
      }
      .alert-prob-bar-fill {
        height:100%; border-radius:4px;
        transition: width 0.8s cubic-bezier(0.16,1,0.3,1);
      }
      .alert-prob-num {
        font-size:16px; font-weight:800; min-width:48px;
        text-align:${isRTL ? 'left' : 'right'};
      }

      /* Screen flash overlay */
      .alert-screen-flash {
        position:absolute; top:0; left:0; right:0; bottom:0;
        pointer-events:none; z-index:50;
        opacity:0; transition: opacity 0.15s ease;
      }
    </style>

    <div class="alert-container" id="alert-root">
      <div class="alert-screen-flash" id="alert-screen-flash"></div>

      <div class="alert-header" id="alert-header">
        <div class="alert-header-icon" style="font-size:16px;font-weight:900;color:${COLORS.accentYellow};">◆</div>
        <div class="alert-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <div class="alert-cards-wrap">
        ${alertCardsHTML}
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('alert-header');
      var screenFlash = document.getElementById('alert-screen-flash');
      var cards = [];
      var bars = [];
      var probNums = [];
      var colors = [${scenarios.map(s => `"${scenarioColor(s.color)}"`).join(',')}];
      var probs = [${scenarios.map(s => parseProbability(s.probability)).join(',')}];

      for (var i = 0; i < ${scenarios.length}; i++) {
        cards.push(document.getElementById('alert-card-' + i));
        bars.push(document.getElementById('alert-bar-' + i));
        probNums.push(document.getElementById('alert-prob-num-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;
      var flashed = [false, false, false];

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 0: Header appears
        var headerPhase = segmentProgress(p, 0, 0.08);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 1: Alert1 appears (0-0.3)
        var a1Phase = segmentProgress(p, 0.06, 0.30);
        if (a1Phase > 0 && cards[0]) {
          cards[0].classList.add('visible');
          // Flash effect
          if (!flashed[0] && a1Phase > 0.01) {
            flashed[0] = true;
            screenFlash.style.background = colors[0];
            screenFlash.style.opacity = '0';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[0].classList.add('flash');
            cards[0].querySelector('.alert-card-header') || null;
          }
          // Animate bar
          var barProg = easeOutCubic(a1Phase);
          bars[0].style.width = (probs[0] * barProg) + '%';
          probNums[0].textContent = Math.round(probs[0] * barProg) + '%';
        }

        // Phase 2: Alert2 appears (0.3-0.6)
        var a2Phase = segmentProgress(p, 0.30, 0.60);
        if (a2Phase > 0 && cards[1]) {
          cards[1].classList.add('visible');
          if (!flashed[1] && a2Phase > 0.01) {
            flashed[1] = true;
            screenFlash.style.background = colors[1];
            screenFlash.style.opacity = '0';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[1].classList.add('flash');
          }
          var barProg2 = easeOutCubic(a2Phase);
          bars[1].style.width = (probs[1] * barProg2) + '%';
          probNums[1].textContent = Math.round(probs[1] * barProg2) + '%';
        }

        // Phase 3: Alert3 appears (0.6-0.85)
        var a3Phase = segmentProgress(p, 0.60, 0.85);
        if (a3Phase > 0 && cards[2]) {
          cards[2].classList.add('visible');
          if (!flashed[2] && a3Phase > 0.01) {
            flashed[2] = true;
            screenFlash.style.background = colors[2];
            screenFlash.style.opacity = '0';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[2].classList.add('flash');
          }
          var barProg3 = easeOutCubic(a3Phase);
          bars[2].style.width = (probs[2] * barProg3) + '%';
          probNums[2].textContent = Math.round(probs[2] * barProg3) + '%';
        }

        // Breathing disabled — professional videos don't pulse
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 7: Takeaway ──────────────────────────────────────────
// 3 strategic fact cards that slide up one by one with color coding
function generateTakeawayPulse(data) {
  const isRTL = data.locale === 'ar';
  const takeaways = (data.strategic_takeaways || []).slice(0, 3);
  const sectionTitle = isRTL ? 'خلاصة استراتيجية' : data.locale === 'tr' ? 'Stratejik Çıkarımlar' : 'Strategic Takeaways';
  const progressLabel = isRTL ? 'حقيقة' : data.locale === 'tr' ? 'Gerçek' : 'Fact';

  // Map color name to hex
  function takeawayColor(colorName) {
    if (colorName === 'green') return COLORS.accentGreen;
    if (colorName === 'gold') return COLORS.accentGold;
    if (colorName === 'red') return COLORS.accentRed;
    return COLORS.accentGold;
  }

  const factCardsHTML = takeaways.map((tw, i) => {
    const color = takeawayColor(tw.color);
    const counterNum = isRTL ? toArabicNumeral(i + 1) : String(i + 1);
    const counterTotal = isRTL ? toArabicNumeral(3) : '3';
    return `
      <div class="takeaway-card" id="takeaway-card-${i}" style="
        opacity:0; transform:translateY(40px);
        border-${isRTL ? 'right' : 'left'}:5px solid ${color};
      " data-color="${color}">
        <div class="takeaway-card-top">
          <div class="takeaway-counter" style="color:${color};">
            <span class="takeaway-counter-label">${escapeHTML(progressLabel)}</span>
            <span class="takeaway-counter-num">${counterNum}/${counterTotal}</span>
          </div>
          <div class="takeaway-title" style="color:${COLORS.textWhite};">${escapeHTML(tw.title)}</div>
        </div>
        <div class="takeaway-detail">${escapeHTML(tw.detail)}</div>
        <div class="takeaway-glow" id="takeaway-glow-${i}" style="background:radial-gradient(ellipse at ${isRTL ? 'right' : 'left'} center, ${color}10, transparent 70%);"></div>
      </div>`;
  }).join('');

  return `
    <style>
      .takeaway-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
        padding: 40px 80px;
      }

      .takeaway-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:32px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .takeaway-header.visible { opacity:1; transform:translateY(0); }

      .takeaway-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentGold}20, ${COLORS.accentBlue}10);
        border:1px solid ${COLORS.accentGold}30;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .takeaway-header-title {
        font-size:22px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .takeaway-cards-wrap {
        width:100%; max-width:1000px; display:flex; flex-direction:column;
        gap:18px;
      }

      .takeaway-card {
        width:100%; padding:24px 32px 24px 28px; border-radius:12px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        position:relative; overflow:hidden;
        transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .takeaway-card.visible {
        opacity:1 !important; transform:translateY(0) !important;
      }

      .takeaway-glow {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; bottom:0; width:60%;
        pointer-events:none; opacity:0; transition: opacity 0.8s ease;
      }
      .takeaway-card.active-glow .takeaway-glow { opacity:1; }

      .takeaway-card-top {
        display:flex; align-items:center; gap:16px; margin-bottom:10px;
      }

      .takeaway-counter {
        display:flex; flex-direction:column; align-items:center;
        min-width:56px; padding:6px 0;
      }
      .takeaway-counter-label {
        font-size:10px; font-weight:500; opacity:0.7; letter-spacing:1px;
      }
      .takeaway-counter-num {
        font-size:18px; font-weight:900; letter-spacing:0.5px;
      }

      .takeaway-title {
        font-size:18px; font-weight:700; line-height:1.3; flex:1;
      }

      .takeaway-detail {
        font-size:15px; color:${COLORS.textLight}; line-height:1.6;
        padding-${isRTL ? 'right' : 'left'}:72px;
      }

      /* Progress bar at bottom */
      .takeaway-progress-section {
        width:100%; max-width:1000px; margin-top:28px;
        display:flex; align-items:center; gap:16px;
        opacity:0; transition: opacity 0.6s ease;
      }
      .takeaway-progress-section.visible { opacity:1; }

      .takeaway-progress-bar-bg {
        flex:1; height:4px; border-radius:2px;
        background:rgba(255,255,255,0.06);
        overflow:hidden;
      }
      .takeaway-progress-bar-fill {
        height:100%; border-radius:2px;
        background:linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentCyan});
        width:0%; transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .takeaway-progress-text {
        font-size:13px; color:${COLORS.textDim}; font-weight:600;
        min-width:40px; text-align:${isRTL ? 'left' : 'right'};
      }
    </style>

    <div class="takeaway-container" id="takeaway-root">
      <div class="takeaway-header" id="takeaway-header">
        <div class="takeaway-header-icon" style="font-size:16px;font-weight:900;color:${COLORS.accentGold};">◆</div>
        <div class="takeaway-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <div class="takeaway-cards-wrap">
        ${factCardsHTML}
      </div>

      <div class="takeaway-progress-section" id="takeaway-progress-section">
        <div class="takeaway-progress-bar-bg">
          <div class="takeaway-progress-bar-fill" id="takeaway-progress-fill"></div>
        </div>
        <div class="takeaway-progress-text" id="takeaway-progress-text">0/3</div>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('takeaway-header');
      var progressSection = document.getElementById('takeaway-progress-section');
      var progressFill = document.getElementById('takeaway-progress-fill');
      var progressText = document.getElementById('takeaway-progress-text');
      var cards = [];
      var glows = [];

      for (var i = 0; i < ${takeaways.length}; i++) {
        cards.push(document.getElementById('takeaway-card-' + i));
        glows.push(document.getElementById('takeaway-glow-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;
      var visibleCount = 0;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Header
        var headerPhase = segmentProgress(p, 0, 0.08);
        if (headerPhase > 0) {
          header.classList.add('visible');
          progressSection.classList.add('visible');
        }

        // Phase 1: Fact1 slide-up (0-0.3)
        var f1Phase = segmentProgress(p, 0.06, 0.30);
        if (f1Phase > 0 && cards[0]) {
          cards[0].classList.add('visible');
          cards[0].classList.add('active-glow');
          visibleCount = 1;
        }

        // Phase 2: Fact2 slide-up (0.3-0.6)
        var f2Phase = segmentProgress(p, 0.30, 0.60);
        if (f2Phase > 0 && cards[1]) {
          if (cards[0]) cards[0].classList.remove('active-glow');
          cards[1].classList.add('visible');
          cards[1].classList.add('active-glow');
          visibleCount = 2;
        }

        // Phase 3: Fact3 slide-up (0.6-0.85)
        var f3Phase = segmentProgress(p, 0.60, 0.85);
        if (f3Phase > 0 && cards[2]) {
          if (cards[1]) cards[1].classList.remove('active-glow');
          cards[2].classList.add('visible');
          cards[2].classList.add('active-glow');
          visibleCount = 3;
        }

        // Update progress bar
        var progPhase = segmentProgress(p, 0.06, 0.85);
        var fillPct = Math.min(100, easeOutCubic(progPhase) * 100);
        progressFill.style.width = fillPct + '%';
        var shown = Math.min(3, Math.floor(progPhase * 3.01) + (progPhase > 0 ? 1 : 0));
        if (progPhase <= 0) shown = 0;
        shown = Math.min(shown, visibleCount);
        progressText.textContent = shown + '/3';

        // Breathing disabled — professional videos don't pulse
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 8: Deal ──────────────────────────────────────────────
// Asset grid (benefiting/harmed) + chart morph to treemap
function generateDealPulse(data) {
  const isRTL = data.locale === 'ar';
  const benefitingAssets = (data.benefiting_assets || []).slice(0, 4);
  const harmedAssets = (data.harmed_assets || []).slice(0, 3);
  const benefitingLabel = isRTL ? 'أصول مستفيدة' : data.locale === 'tr' ? 'Yararlanan Varlıklar' : 'Benefiting Assets';
  const harmedLabel = isRTL ? 'أصول متضررة' : data.locale === 'tr' ? 'Zarar Gören Varlıklar' : 'Harmed Assets';

  // Generate random-ish sparkline SVG path for an asset
  function generateSparkline(seed, isPositive) {
    const points = [];
    const w = 80;
    const h = 28;
    let y = h / 2;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * w;
      const delta = ((Math.sin(seed * 7 + i * 3.7) * 0.5 + Math.cos(seed * 2.3 + i * 1.9) * 0.3) * h * 0.3);
      y = clamp(y + delta, 4, h - 4);
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const color = isPositive ? COLORS.accentGreen : COLORS.accentRed;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="flex-shrink:0;">
      <path d="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // Build asset card HTML
  function assetCardHTML(asset, index, isBenefiting) {
    const sparkSeed = index * 13 + (isBenefiting ? 37 : 71);
    const sparkline = generateSparkline(sparkSeed, isBenefiting);
    const nameColor = isBenefiting ? COLORS.accentGreen : COLORS.accentRed;
    const icon = isBenefiting ? '▲' : '▼';
    return `
      <div class="deal-asset-card" id="deal-asset-${isBenefiting ? 'b' : 'h'}-${index}" style="
        opacity:0; transform:translateX(${isBenefiting ? '-30px' : '30px'});
      ">
        <div class="deal-asset-icon">${icon}</div>
        <div class="deal-asset-info">
          <div class="deal-asset-name" style="color:${nameColor};">${escapeHTML(asset.name)}</div>
          <div class="deal-asset-symbol">${escapeHTML(asset.symbol)}</div>
          <div class="deal-asset-reason">${escapeHTML(asset.reason)}</div>
        </div>
        <div class="deal-asset-spark">${sparkline}</div>
      </div>`;
  }

  const benefitingCardsHTML = benefitingAssets.map((a, i) => assetCardHTML(a, i, true)).join('');
  const harmedCardsHTML = harmedAssets.map((a, i) => assetCardHTML(a, i, false)).join('');

  // Build treemap rectangles
  function buildTreemapRects() {
    const allAssets = [
      ...benefitingAssets.map(a => ({ ...a, isBenefiting: true, size: 80 + Math.random() * 40 })),
      ...harmedAssets.map(a => ({ ...a, isBenefiting: false, size: 50 + Math.random() * 30 })),
    ];
    // Simple treemap layout using slice-and-dice
    const rects = [];
    const totalW = 1600;
    const totalH = 600;
    const totalSize = allAssets.reduce((s, a) => s + a.size, 0);
    const gap = 4;
    let cx = 0;
    let cy = 0;
    let remainingW = totalW;
    let remainingH = totalH;
    let horizontal = true;

    allAssets.forEach((asset, i) => {
      const fraction = asset.size / totalSize;
      const color = asset.isBenefiting ? COLORS.accentGreen : COLORS.accentRed;
      const bgColor = asset.isBenefiting ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';

      let rw, rh;
      if (horizontal) {
        rw = Math.max(1, remainingW * fraction);
        rh = remainingH;
      } else {
        rw = remainingW;
        rh = Math.max(1, remainingH * fraction);
      }

      rects.push({
        x: cx, y: cy,
        w: Math.max(1, rw - gap),
        h: Math.max(1, rh - gap),
        color, bgColor,
        name: asset.name,
        symbol: asset.symbol,
        isBenefiting: asset.isBenefiting,
      });

      if (horizontal) {
        cx += rw;
        remainingW -= rw;
        if (remainingW < 20) { remainingW = totalW; cx = 0; cy += remainingH; horizontal = !horizontal; }
      } else {
        cy += rh;
        remainingH -= rh;
        if (remainingH < 20) { remainingH = totalH; cy = 0; cx += remainingW; horizontal = !horizontal; }
      }
    });

    return rects;
  }

  const treemapRects = buildTreemapRects();
  const treemapSVG = `<svg width="1600" height="600" viewBox="0 0 1600 600" style="width:100%;height:auto;">
    ${treemapRects.map((r, i) => `
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="6"
        fill="${r.bgColor}" stroke="${r.color}" stroke-width="1.5" stroke-opacity="0.5"
        class="deal-treemap-rect" id="deal-trect-${i}"/>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 8}" text-anchor="middle"
        fill="${r.color}" font-size="16" font-weight="700" font-family="Inter,Noto Sans Arabic,sans-serif"
        class="deal-treemap-text" id="deal-ttext-${i}">${escapeHTML(r.symbol)}</text>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 14}" text-anchor="middle"
        fill="${COLORS.textLight}" font-size="12" font-weight="500" font-family="Noto Sans Arabic,Inter,sans-serif"
        class="deal-treemap-text" id="deal-ttext-sub-${i}">${escapeHTML(r.name)}</text>
    `).join('')}
  </svg>`;

  return `
    <style>
      .deal-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; position:relative; padding: 32px 48px;
      }

      .deal-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:24px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .deal-header.visible { opacity:1; transform:translateY(0); }

      .deal-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentGreen}15, ${COLORS.accentRed}15);
        border:1px solid ${COLORS.accentBlue}25;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .deal-header-title {
        font-size:22px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .deal-grid-view {
        width:100%; display:flex; gap:32px; flex:1;
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .deal-grid-view.hidden {
        opacity:0; transform:scale(0.95); pointer-events:none;
      }

      .deal-col {
        flex:1; display:flex; flex-direction:column;
      }
      .deal-col-label {
        font-size:16px; font-weight:700; margin-bottom:14px;
        padding:8px 16px; border-radius:4px;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        text-align:center;
      }
      .deal-col-label-ben { color:${COLORS.accentGreen}; }
      .deal-col-label-harm { color:${COLORS.accentRed}; }

      .deal-asset-card {
        display:flex; align-items:center; gap:14px;
        padding:14px 18px; border-radius:8px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        margin-bottom:10px;
        transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      .deal-asset-card.visible {
        opacity:1 !important; transform:translateX(0) !important;
      }

      .deal-asset-icon { font-size:14px; flex-shrink:0; }
      .deal-asset-info { flex:1; }
      .deal-asset-name { font-size:16px; font-weight:700; }
      .deal-asset-symbol { font-size:12px; color:${COLORS.textDim}; font-weight:600; letter-spacing:1px; }
      .deal-asset-reason { font-size:12px; color:${COLORS.textLight}; margin-top:2px; }
      .deal-asset-spark { flex-shrink:0; }

      /* Treemap view */
      .deal-treemap-view {
        width:100%; max-width:1600px; flex:1;
        display:flex; align-items:center; justify-content:center;
        opacity:0; transform:scale(0.92);
        transition: opacity 0.6s ease, transform 0.6s ease;
        position:relative;
      }
      .deal-treemap-view.visible {
        opacity:1; transform:scale(1);
      }

      .deal-treemap-rect {
        transition: opacity 0.4s ease;
      }
      .deal-treemap-text {
        transition: opacity 0.4s ease;
      }
    </style>

    <div class="deal-container" id="deal-root">
      <div class="deal-header" id="deal-header">
        <div class="deal-header-icon" style="font-size:16px;font-weight:900;color:${COLORS.accentBlue};">◆</div>
        <div class="deal-header-title">${isRTL ? 'تأثير على الأصول' : data.locale === 'tr' ? 'Varlık Etkisi' : 'Asset Impact'}</div>
      </div>

      <div class="deal-grid-view" id="deal-grid-view">
        <div class="deal-col">
          <div class="deal-col-label deal-col-label-ben">${escapeHTML(benefitingLabel)}</div>
          ${benefitingCardsHTML}
        </div>
        <div class="deal-col">
          <div class="deal-col-label deal-col-label-harm">${escapeHTML(harmedLabel)}</div>
          ${harmedCardsHTML}
        </div>
      </div>

      <div class="deal-treemap-view" id="deal-treemap-view">
        ${treemapSVG}
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('deal-header');
      var gridView = document.getElementById('deal-grid-view');
      var treemapView = document.getElementById('deal-treemap-view');

      var benCards = [];
      var harmCards = [];
      for (var i = 0; i < ${benefitingAssets.length}; i++) {
        benCards.push(document.getElementById('deal-asset-b-' + i));
      }
      for (var j = 0; j < ${harmedAssets.length}; j++) {
        harmCards.push(document.getElementById('deal-asset-h-' + j));
      }

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Header
        var headerPhase = segmentProgress(p, 0, 0.06);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 1: Benefiting assets appear (0-0.35)
        for (var i = 0; i < benCards.length; i++) {
          var start = 0.05 + i * 0.08;
          var end = start + 0.12;
          var phase = segmentProgress(p, start, end);
          if (phase > 0 && benCards[i]) {
            benCards[i].classList.add('visible');
          }
        }

        // Phase 2: Harmed assets appear (0.35-0.6)
        for (var j = 0; j < harmCards.length; j++) {
          var hstart = 0.35 + j * 0.08;
          var hend = hstart + 0.12;
          var hphase = segmentProgress(p, hstart, hend);
          if (hphase > 0 && harmCards[j]) {
            harmCards[j].classList.add('visible');
          }
        }

        // Phase 3: Morph transition (0.6-0.75)
        var morphPhase = segmentProgress(p, 0.60, 0.75);
        if (morphPhase > 0) {
          gridView.classList.add('hidden');
        } else {
          gridView.classList.remove('hidden');
        }

        // Phase 4: Treemap visible (0.75-1.0)
        var treePhase = segmentProgress(p, 0.70, 0.85);
        if (treePhase > 0) {
          treemapView.classList.add('visible');
        } else {
          treemapView.classList.remove('visible');
        }

        // Subtle treemap rect animation
        if (p > 0.75) {
          var breathe = 0;
          treemapView.style.transform = 'scale(' + (1 + breathe) + ')';
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
    })();
    </script>
  `;
}

// ─── Pulse 9: Harvest ───────────────────────────────────────────
// Recommendations ticker + brand logo pulse + fade out
function generateHarvestPulse(data) {
  const isRTL = data.locale === 'ar';
  const recommendations = (data.recommendations || []).slice(0, 3);
  const tagline = isRTL ? 'رؤى اقتصادية تصنع الفرق' : data.locale === 'tr' ? 'Fark Yaratan Ekonomik Analizler' : 'Economic Insights That Make a Difference';

  // Horizon labels
  function horizonLabel(horizon) {
    if (horizon === 'daily') return isRTL ? 'يومي' : data.locale === 'tr' ? 'Günlük' : 'Daily';
    if (horizon === 'medium') return isRTL ? 'متوسط' : data.locale === 'tr' ? 'Orta Vadeli' : 'Medium';
    if (horizon === 'long') return isRTL ? 'طويل' : data.locale === 'tr' ? 'Uzun Vadeli' : 'Long-Term';
    return horizon;
  }

  function horizonBadgeColor(horizon) {
    if (horizon === 'daily') return COLORS.accentCyan;
    if (horizon === 'medium') return COLORS.accentYellow;
    if (horizon === 'long') return COLORS.accentPurple;
    return COLORS.accentBlue;
  }

  function actionLabel(action) {
    if (!action) return '';
    const lower = action.toLowerCase();
    if (lower.includes('شراء') || lower.includes('buy')) return isRTL ? 'شراء' : data.locale === 'tr' ? 'Satın Al' : 'Buy';
    if (lower.includes('بيع') || lower.includes('sell')) return isRTL ? 'بيع' : data.locale === 'tr' ? 'Sat' : 'Sell';
    return action;
  }

  function actionColor(action) {
    const lower = (action || '').toLowerCase();
    if (lower.includes('شراء') || lower.includes('buy')) return COLORS.accentGreen;
    if (lower.includes('بيع') || lower.includes('sell')) return COLORS.accentRed;
    return COLORS.accentBlue;
  }

  const recCardsHTML = recommendations.map((rec, i) => {
    const hBadgeColor = horizonBadgeColor(rec.horizon);
    const aColor = actionColor(rec.action);
    const isDaily = rec.horizon === 'daily';
    const entryLabel = isRTL ? 'دخول' : data.locale === 'tr' ? 'Giriş' : 'Entry';
    const targetLabel = isRTL ? 'هدف' : data.locale === 'tr' ? 'Hedef' : 'Target';
    const stopLabel = isRTL ? 'وقف' : data.locale === 'tr' ? 'Zarar Durdur' : 'Stop';
    const allocLabel = isRTL ? 'تخصيص' : data.locale === 'tr' ? 'Dağıtım' : 'Alloc';
    return `
      <div class="harvest-rec-card" id="harvest-rec-${i}">
        <div class="harvest-rec-horizon" style="background:${hBadgeColor}18; color:${hBadgeColor}; border:1px solid ${hBadgeColor}30;">
          ${escapeHTML(horizonLabel(rec.horizon))}
        </div>
        <div class="harvest-rec-body">
          <div class="harvest-rec-asset">${escapeHTML(rec.asset)}</div>
          <div class="harvest-rec-action" style="color:${aColor};">${escapeHTML(actionLabel(rec.action))}</div>
        </div>
        ${isDaily ? `
        <div class="harvest-rec-prices">
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(entryLabel)}</span>
            <span class="harvest-price-val">${escapeHTML(rec.entry || '—')}</span>
          </div>
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(targetLabel)}</span>
            <span class="harvest-price-val" style="color:${COLORS.accentGreen};">${escapeHTML(rec.target || '—')}</span>
          </div>
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(stopLabel)}</span>
            <span class="harvest-price-val" style="color:${COLORS.accentRed};">${escapeHTML(rec.stop || '—')}</span>
          </div>
        </div>
        ` : `
        <div class="harvest-rec-alloc">
          <span class="harvest-alloc-label">${escapeHTML(allocLabel)}</span>
          <span class="harvest-alloc-val" style="color:${hBadgeColor};">${escapeHTML(rec.allocation || '—')}</span>
        </div>
        `}
      </div>`;
  }).join('');

  // Scrolling ticker for recommendations
  const tickerItems = recommendations.map(rec => {
    const aColor = actionColor(rec.action);
    return `<span class="harvest-ticker-item">
      <span class="harvest-ticker-asset">${escapeHTML(rec.asset)}</span>
      <span class="harvest-ticker-action" style="color:${aColor};">${escapeHTML(actionLabel(rec.action))}</span>
    </span>`;
  }).join('<span style="color:' + COLORS.accentBlue + ';margin:0 12px;">●</span>');
  const doubledTicker = tickerItems + '<span style="color:' + COLORS.accentBlue + ';margin:0 12px;">●</span>' + tickerItems;

  return `
    <style>
      .harvest-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; position:relative; padding:0;
      }

      /* Scrolling ticker at top of content area */
      .harvest-ticker {
        width:100%; padding:10px 0; overflow:hidden;
        background: linear-gradient(180deg, rgba(12,20,38,0.7) 0%, transparent 100%);
        border-bottom:1px solid ${COLORS.borderBlue};
        opacity:0; transition: opacity 0.6s ease;
      }
      .harvest-ticker.visible { opacity:1; }

      .harvest-ticker-scroll {
        white-space:nowrap; animation: tickerScroll 20s linear infinite;
        padding:0 40px; font-size:14px;
      }
      .harvest-ticker-item { display:inline-flex; align-items:center; gap:6px; margin:0 8px; }
      .harvest-ticker-asset { font-size:14px; font-weight:700; color:${COLORS.textWhite}; }
      .harvest-ticker-action { font-size:13px; font-weight:600; }

      /* Recommendation cards */
      .harvest-recs-wrap {
        width:100%; max-width:1200px;
        display:flex; gap:20px; justify-content:center;
        padding:24px 48px 0; flex:1; align-items:flex-start;
      }

      .harvest-rec-card {
        flex:1; max-width:360px; padding:20px 24px;
        border-radius:12px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        opacity:0; transform:translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .harvest-rec-card.visible {
        opacity:1; transform:translateY(0);
      }

      .harvest-rec-horizon {
        display:inline-block; padding:4px 14px; border-radius:100px;
        font-size:12px; font-weight:700; letter-spacing:1px; margin-bottom:14px;
      }

      .harvest-rec-body {
        display:flex; align-items:center; gap:10px; margin-bottom:14px;
      }
      .harvest-rec-asset {
        font-size:17px; font-weight:800; color:${COLORS.textWhite};
      }
      .harvest-rec-action {
        font-size:15px; font-weight:700; letter-spacing:0.5px;
      }

      .harvest-rec-prices {
        display:flex; gap:12px;
      }
      .harvest-price-item {
        flex:1; padding:8px 10px; border-radius:8px;
        background:rgba(255,255,255,0.03); text-align:center;
      }
      .harvest-price-label {
        display:block; font-size:10px; color:${COLORS.textDim};
        font-weight:500; letter-spacing:0.5px; margin-bottom:4px;
      }
      .harvest-price-val {
        font-size:14px; font-weight:700; color:${COLORS.textWhite};
      }

      .harvest-rec-alloc {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 14px; border-radius:8px;
        background:rgba(255,255,255,0.03);
      }
      .harvest-alloc-label {
        font-size:13px; color:${COLORS.textDim}; font-weight:500;
      }
      .harvest-alloc-val {
        font-size:20px; font-weight:800;
      }

      /* Brand logo center */
      .harvest-brand-area {
        display:flex; flex-direction:column; align-items:center;
        padding:24px 0; opacity:0; transform:scale(0.8);
        transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1);
      }
      .harvest-brand-area.visible {
        opacity:1; transform:scale(1);
      }

      .harvest-logo-svg {
        width:80px; height:80px; margin-bottom:16px;
      }

      .harvest-tagline {
        font-size:18px; font-weight:700; color:${COLORS.textLight};
        letter-spacing:1px; opacity:0;
        transition: opacity 0.8s ease;
      }
      .harvest-tagline.visible { opacity:1; }

      /* Fade to black overlay */
      .harvest-fade-overlay {
        position:absolute; top:0; left:0; right:0; bottom:0;
        background:black; opacity:0; pointer-events:none; z-index:200;
        transition: opacity 1s ease;
      }
    </style>

    <div class="harvest-container" id="harvest-root">
      <div class="harvest-fade-overlay" id="harvest-fade"></div>

      <!-- Scrolling ticker -->
      <div class="harvest-ticker" id="harvest-ticker">
        <div class="harvest-ticker-scroll">${doubledTicker}</div>
      </div>

      <!-- Recommendation cards -->
      <div class="harvest-recs-wrap">
        ${recCardsHTML}
      </div>

      <!-- Brand logo -->
      <div class="harvest-brand-area" id="harvest-brand">
        <svg class="harvest-logo-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="harvest-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${COLORS.accentBlue};"/>
              <stop offset="100%" style="stop-color:${COLORS.accentCyan};"/>
            </linearGradient>
          </defs>
          <rect width="80" height="80" rx="18" fill="url(#harvest-logo-grad)"/>
          <text x="40" y="52" text-anchor="middle" fill="white" font-size="40" font-weight="900" font-family="Inter,sans-serif">R</text>
        </svg>
        <div class="harvest-tagline" id="harvest-tagline">${escapeHTML(tagline)}</div>
        <!-- V14: Legal disclaimer in closing -->
        <div style="font-size:9px; color:${COLORS.textDim}; margin-top:8px; text-align:center; max-width:600px; line-height:1.4; opacity:0;" id="harvest-disclaimer">
          ${isRTL ? 'تنبيه: المحتوى المقدم لأغراض إعلامية فقط ولا يُعتبر نصيحة استثمارية. يُرجى استشارة مستشار مالي معتمد قبل اتخاذ أي قرارات استثمارية.' : data.locale === 'tr' ? 'Uyarı: Sunulan içerik yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliğinde değildir. Yatırım kararı almadan önce lisanslı bir finansal danışmana başvurunuz.' : 'Disclaimer: Content is for informational purposes only and does not constitute investment advice. Please consult a certified financial advisor before making investment decisions.'}
        </div>
      </div>
    </div>

    <script>
    (function() {
      var ticker = document.getElementById('harvest-ticker');
      var brand = document.getElementById('harvest-brand');
      var tagline = document.getElementById('harvest-tagline');
      var disclaimer = document.getElementById('harvest-disclaimer');
      var fade = document.getElementById('harvest-fade');
      var recCards = [];

      for (var i = 0; i < ${recommendations.length}; i++) {
        recCards.push(document.getElementById('harvest-rec-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: Recommendations scroll (0-0.4)
        var recPhase = segmentProgress(p, 0, 0.40);
        if (recPhase > 0) {
          ticker.classList.add('visible');
          // Cards appear one by one
          for (var i = 0; i < recCards.length; i++) {
            var cardStart = 0.05 + i * 0.10;
            var cardEnd = cardStart + 0.15;
            var cardPhase = segmentProgress(p, cardStart, cardEnd);
            if (cardPhase > 0 && recCards[i]) {
              recCards[i].classList.add('visible');
            }
          }
        }

        // Phase 2: Logo appears (0.4-0.6) with pulse
        var logoPhase = segmentProgress(p, 0.40, 0.60);
        if (logoPhase > 0) {
          brand.classList.add('visible');
          // Pulse animation: scale 0.8 → 1.1 → 1.0
          var easedLogo = easeOutCubic(logoPhase);
          var scaleVal;
          if (easedLogo < 0.7) {
            scaleVal = lerp(0.8, 1.1, easedLogo / 0.7);
          } else {
            scaleVal = lerp(1.1, 1.0, (easedLogo - 0.7) / 0.3);
          }
          brand.style.transform = 'scale(' + scaleVal + ')';
        }

        // Phase 3: Tagline fades (0.6-0.8)
        var tagPhase = segmentProgress(p, 0.60, 0.80);
        if (tagPhase > 0) {
          tagline.classList.add('visible');
          tagline.style.opacity = String(easeOutCubic(tagPhase));
        }

        // V14: Phase 3.5: Disclaimer appears (0.65-0.85)
        var discPhase = segmentProgress(p, 0.65, 0.85);
        if (discPhase > 0 && disclaimer) {
          disclaimer.style.opacity = String(Math.min(0.7, easeOutCubic(discPhase)));
        }

        // Phase 4: Fade to black (0.8-1.0)
        var fadePhase = segmentProgress(p, 0.80, 1.0);
        if (fadePhase > 0) {
          fade.style.opacity = String(easeOutCubic(fadePhase));
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
      function lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
      }
    })();
    </script>
  `;
}

// ─── Main Video Generation Pipeline ──────────────────────────────
async function generateVideo(inputPath, outputPath) {
  const startTime = Date.now();
  console.log('[V5] Starting video generation pipeline...');

  // Step 1: Read & parse input JSON
  console.log('[V5] Step 1: Reading input JSON...');
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const rawData = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`[V5] Input data loaded. Title: "${rawData.title || '(no title)'}"`);

  // Step 2: Enhance data with defaults
  console.log('[V5] Step 2: Enhancing data with defaults...');
  const data = enhanceDataWithDefaults(rawData);
  const locale = data.locale || 'ar';

  // Step 3: Background images — SUSTAINABLE APPROACH (V11)
  // ─────────────────────────────────────────────────────────────
  // V18: AI-First Image Generation — NO MORE PEXELS
  // ─────────────────────────────────────────────────
  // PROBLEM: Pexels stock photos are generic and unrelated to the topic.
  //          User complaint: "خرا" — stock photos of office buildings while
  //          the video is about gold or oil prices.
  //          Pollinations is also unreliable (random images, Arabic stripping).
  //
  // SOLUTION (V18):
  //   1. Together AI (FLUX.1-schnell-Free) as PRIMARY — FREE forever, reliable on Railway
  //   2. HuggingFace Inference API as SECONDARY — uses HF_API_TOKEN
  //   3. Pollinations (flux model) as TERTIARY — free but may 402 on cloud IPs
  //   4. Professional gradient as LAST RESORT (NOT a real image)
  //   NO SDK, NO Pexels, NO CLI — only AI-generated images
  //
  console.log('[V347] Step 3: Generating AI background images...');

  // V347: CRITICAL DIAGNOSTIC — Log API key status BEFORE attempting image generation
  // This will help us understand WHY images fail on Railway
  const _togetherKey = process.env.TOGETHER_API_KEY;
  const _hfKey = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  console.log(`[V347] ═══ IMAGE API DIAGNOSTICS ═══`);
  console.log(`[V347]   TOGETHER_API_KEY: ${_togetherKey ? `SET (${_togetherKey.length} chars, ${_togetherKey.slice(0,6)}...${_togetherKey.slice(-4)})` : 'NOT SET ❌'}`);
  console.log(`[V347]   HF_API_KEY: ${process.env.HF_API_KEY ? `SET (${process.env.HF_API_KEY.length} chars)` : 'NOT SET'}`);
  console.log(`[V347]   HF_API_TOKEN: ${process.env.HF_API_TOKEN ? `SET (${process.env.HF_API_TOKEN.length} chars)` : 'NOT SET'}`);
  console.log(`[V347]   HF_TOKEN: ${process.env.HF_TOKEN ? `SET (${process.env.HF_TOKEN.length} chars)` : 'NOT SET'}`);
  console.log(`[V347]   Combined HF: ${_hfKey ? `SET (${_hfKey.length} chars)` : 'NOT SET ❌'}`);
  console.log(`[V347]   ZAI_BASE_URL: ${process.env.ZAI_BASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`[V347]   RAILWAY_ENV: ${process.env.RAILWAY_ENVIRONMENT || 'NOT SET'}`);
  console.log(`[V347] ═════════════════════════════`);

  const articleImageUrl = rawData.article_image_url || null;
  let primaryImageBase64 = '';

  // V347: PRIMARY — Download article image from R2 (already AI-generated by news imager!)
  // The news imager uses Together AI successfully — reuse that image for video!
  if (articleImageUrl) {
    console.log(`[V347]   ★ PRIMARY: Downloading article image from R2: ${articleImageUrl.slice(0, 80)}...`);
    const articleBuffer = await downloadImageFromUrl(articleImageUrl);
    if (articleBuffer && articleBuffer.length > 5000) {
      primaryImageBase64 = articleBuffer.toString('base64');
      console.log(`[V347]   ★ PRIMARY: Article image loaded from R2 (${(articleBuffer.length / 1024).toFixed(0)}KB) — THIS IS AN AI-GENERATED IMAGE`);
    } else {
      console.warn(`[V347]   PRIMARY: Article image download failed or too small (${articleBuffer?.length || 0} bytes)`);
    }
  } else {
    console.log(`[V347]   No article_image_url provided — will generate new images`);
  }

  // V347: If we already have an article image from R2 (AI-generated by news imager),
  // use it as the primary image for ALL groups. Only generate new images as supplements.
  let groupABase64 = '';
  let groupBBase64 = '';
  let groupCBase64 = '';

  // V8: Use pre-generated images from infographic pipeline (same 5-provider fallback) if available.
  // V8 expanded from 3 to 10 images — one per paragraph type. pulse uses 6 (one per pulse).
  // Each pulse gets a unique image. Falls back to group-based logic if no pre-generated images.
  const preGeneratedImages = Array.isArray(rawData.pre_generated_images) ? rawData.pre_generated_images : [];
  if (preGeneratedImages.length > 0) {
    console.log(`[V8] ★ Using ${preGeneratedImages.length} pre-generated images from infographic pipeline — one per pulse`);
    // Use 6 unique images (one per pulse). If fewer than 6, cycle through available ones.
    for (let i = 0; i < 6; i++) {
      const b64 = preGeneratedImages[i] || preGeneratedImages[i % preGeneratedImages.length];
      if (i < 2) groupABase64 = b64 || groupABase64;
      else if (i < 4) groupBBase64 = b64 || groupBBase64;
      else groupCBase64 = b64 || groupCBase64;
    }
    console.log(`[V8]   Loaded: A=${groupABase64 ? 'YES' : 'NO'} B=${groupBBase64 ? 'YES' : 'NO'} C=${groupCBase64 ? 'YES' : 'NO'}`);
  } else if (primaryImageBase64) {
    // V347: Article image from R2 IS an AI-generated image (from Together AI via news imager)
    // Use it as the base for all groups — no need to generate new images if this works
    console.log(`[V347]   ★ Using article image from R2 as primary for ALL groups (${(primaryImageBase64.length * 0.75 / 1024).toFixed(0)}KB)`);
    groupABase64 = primaryImageBase64;
    groupBBase64 = primaryImageBase64;
    groupCBase64 = primaryImageBase64;

    // Generate supplemental images for visual variety (SEQUENTIAL with rate limiting)
    // V347: Changed from parallel to sequential — parallel causes Pollinations rate limiting (429)
    console.log(`[V347]   Generating 2 supplemental AI images sequentially (with rate limiting)...`);
    const imageGroupB_Prompt = await generateContextualImagePrompt(data, 3); // Charts / analysis
    const imageGroupC_Prompt = await generateContextualImagePrompt(data, 6); // Alert / strategy

    // Generate one at a time — Pollinations needs 3s between requests
    const suppBBuffer = await generateAIImage(imageGroupB_Prompt, 1344, 768, data.market_impact);
    if (suppBBuffer && suppBBuffer.length > 1000) {
      groupBBase64 = suppBBuffer.toString('base64');
      console.log(`[V347]   Supplemental B image: success (${(suppBBuffer.length / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`[V347]   Supplemental B image: failed — using article image`);
    }

    const suppCBuffer = await generateAIImage(imageGroupC_Prompt, 1344, 768, data.market_impact);
    if (suppCBuffer && suppCBuffer.length > 1000) {
      groupCBase64 = suppCBuffer.toString('base64');
      console.log(`[V347]   Supplemental C image: success (${(suppCBuffer.length / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`[V347]   Supplemental C image: failed — using article image`);
    }
  } else {
    // No article image from R2 — must generate all 3 images via AI APIs
    // V347: SEQUENTIAL generation with rate limiting — parallel causes Pollinations 429
    console.log(`[V347]   No article image — generating 3 AI images sequentially...`);

    const imageGroupA_Prompt = await generateContextualImagePrompt(data, 1); // Trading floor / breaking news
    const imageGroupB_Prompt = await generateContextualImagePrompt(data, 3); // Charts / analysis
    const imageGroupC_Prompt = await generateContextualImagePrompt(data, 6); // Alert / strategy

    // Generate sequentially — each call has 3s rate limit + ~1s Pollinations generation = ~4s each
    const bufferA = await generateAIImage(imageGroupA_Prompt, 1344, 768, data.market_impact);
    if (bufferA && bufferA.length > 1000) {
      groupABase64 = bufferA.toString('base64');
      console.log(`[V347]   Group A image: success (${(bufferA.length / 1024).toFixed(0)}KB)`);
    } else {
      console.warn(`[V347]   Group A image: FAILED`);
    }

    const bufferB = await generateAIImage(imageGroupB_Prompt, 1344, 768, data.market_impact);
    if (bufferB && bufferB.length > 1000) {
      groupBBase64 = bufferB.toString('base64');
      console.log(`[V347]   Group B image: success (${(bufferB.length / 1024).toFixed(0)}KB)`);
    } else {
      console.warn(`[V347]   Group B image: FAILED`);
    }

    const bufferC = await generateAIImage(imageGroupC_Prompt, 1344, 768, data.market_impact);
    if (bufferC && bufferC.length > 1000) {
      groupCBase64 = bufferC.toString('base64');
      console.log(`[V347]   Group C image: success (${(bufferC.length / 1024).toFixed(0)}KB)`);
    } else {
      console.warn(`[V347]   Group C image: FAILED`);
    }

    // Cross-fill: if some groups got images but others didn't, share
    if (!groupABase64 && groupBBase64) groupABase64 = groupBBase64;
    if (!groupABase64 && groupCBase64) groupABase64 = groupCBase64;
    if (!groupBBase64 && groupABase64) groupBBase64 = groupABase64;
    if (!groupBBase64 && groupCBase64) groupBBase64 = groupCBase64;
    if (!groupCBase64 && groupABase64) groupCBase64 = groupABase64;
    if (!groupCBase64 && groupBBase64) groupCBase64 = groupBBase64;
  }

  // If still no images at all, generate one emergency AI image
  if (!groupABase64 && !groupBBase64 && !groupCBase64) {
    console.error(`[V347]   ✗✗✗ ALL image methods failed! Generating emergency AI image...`);
    console.error(`[V347]   DIAGNOSTICS: TOGETHER_API_KEY=${_togetherKey ? 'SET' : 'NOT_SET'} HF=${_hfKey ? 'SET' : 'NOT_SET'}`);
    const emergencyPrompt = 'Professional financial news broadcast background, dark blue theme, stock market data visualization, cinematic, ultra detailed, 8K';
    const emergencyBuffer = await generateAIImage(emergencyPrompt, 1344, 768, data.market_impact);
    if (emergencyBuffer && emergencyBuffer.length > 1000) {
      const b64 = emergencyBuffer.toString('base64');
      groupABase64 = b64;
      groupBBase64 = b64;
      groupCBase64 = b64;
    }
  }

  console.log(`[V18]   Image groups ready: A=${groupABase64 ? 'YES' : 'NO'} B=${groupBBase64 ? 'YES' : 'NO'} C=${groupCBase64 ? 'YES' : 'NO'}`);

  // Map images to 6 pulses with CSS effects for visual variety (V21: 6 pulses)
  // V23: Reduced overlay darkness so images are actually VISIBLE
  const pulseVisualEffects = [
    // Pulse 1-2 (Ignition + Shock): Group A image
    { overlay: 'rgba(11,20,38,0.45)', filter: 'brightness(0.6) saturate(1.3)', size: 'cover', position: 'center' },
    { overlay: 'rgba(11,20,38,0.40)', filter: 'brightness(0.65) saturate(1.2) hue-rotate(-10deg)', size: 'cover', position: 'center' },
    // Pulse 3-4 (Race + Alert): Group B image
    { overlay: 'rgba(17,29,53,0.38)', filter: 'brightness(0.6) saturate(1.2) hue-rotate(10deg)', size: '120%', position: 'center' },
    { overlay: 'rgba(20,15,25,0.40)', filter: 'brightness(0.6) saturate(1.5) hue-rotate(-5deg)', size: 'cover', position: 'center' },
    // Pulse 5-6 (Takeaway + Harvest): Group C image
    { overlay: 'rgba(15,20,35,0.40)', filter: 'brightness(0.65) saturate(1.2)', size: 'cover', position: 'center' },
    { overlay: 'rgba(15,20,30,0.35)', filter: 'brightness(0.7) saturate(1.2)', size: '110%', position: 'center' },
  ];

  // Build bgImagesForPulses with CSS effect data
  // V8: When pre-generated images are available, use a unique image per pulse (up to 6).
  // Otherwise, fall back to the group-based logic (A/B/C shared across pulse pairs).
  const bgImagesForPulses = pulseVisualEffects.map((effect, idx) => {
    let imageB64;
    if (preGeneratedImages.length > 0) {
      // V8: Use a unique pre-generated image for each pulse (one per paragraph)
      imageB64 = preGeneratedImages[idx] || preGeneratedImages[idx % preGeneratedImages.length] || '';
    } else if (idx < 2) {
      imageB64 = groupABase64; // Pulse 1-2: Group A image
    } else if (idx < 4) {
      imageB64 = groupBBase64; // Pulse 3-4: Group B image
    } else {
      imageB64 = groupCBase64; // Pulse 5-6: Group C image
    }
    return {
      base64: imageB64,
      overlay: effect.overlay,
      filter: effect.filter,
      size: effect.size,
      position: effect.position,
    };
  });

  data._bgImagesV2 = bgImagesForPulses;
  const hasA = groupABase64 ? 'YES' : 'NO';
  const hasB = groupBBase64 ? 'YES' : 'NO';
  const hasC = groupCBase64 ? 'YES' : 'NO';
  console.log(`[V18] Background images ready: GroupA=${hasA} GroupB=${hasB} GroupC=${hasC}. AI-generated images only (no Pexels).`);

  // Step 4: Build all 6 pulses (V21: compressed from 9 to 6)
  console.log('[V5] Step 4: Building all 6 pulse HTML strings...');
  const pulseGenerators = [
    generateIgnitionPulse,
    generateShockPulse,
    generateRootsPulse,  // V1049: RESTORED root causes slide
    generateRacePulse,
    generateAlertPulse,
    generateTakeawayPulse,
    generateHarvestPulse,
  ];

  const pulses = PULSE_DEFS.map(([name, startSec, endSec], idx) => {
    const generator = pulseGenerators[idx];
    if (!generator) {
      throw new Error(`No generator for pulse index ${idx} (${name})`);
    }
    const contentHTML = generator(data);
    const fullHTML = generateBaseHTML(contentHTML, data, idx, name);
    const duration = endSec - startSec;
    const totalFrames = Math.ceil(duration * FPS);
    return {
      name,
      html: fullHTML,
      duration,
      totalFrames,
      startSec,
      endSec,
    };
  });
  console.log(`[V5] Built ${pulses.length} pulses.`);

  // Step 5: Generate per-pulse narration text (V22: LLM-powered for professional Arabic)
  console.log('[V22] Step 5: Generating per-pulse narration text (LLM-powered)...');
  const pulseNarrations = await generatePerPulseNarrationLLM(data);
  console.log(`[V22]   Generated ${pulseNarrations.length} narration segments for ${pulseNarrations.filter(Boolean).length} active pulses`);
  pulseNarrations.forEach((text, i) => {
    console.log(`[V22]   Pulse ${i + 1}: "${(text || '').slice(0, 60)}..."`);
  });

  // Step 6: Generate per-pulse voiceover with edge-tts (premium female voice)
  console.log('[V10] Step 6: Generating per-pulse voiceover (premium female voice: Fatima/Salma/Zariyah)...');
  const tmpDir = join(tmpdir(), `roua-v5-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  const { audioPaths: pulseAudioPaths, audioDurations: pulseAudioDurations } =
    await generatePerPulseVoiceover(pulseNarrations, tmpDir, locale);

  const totalAudioDuration = pulseAudioDurations.reduce((sum, d) => sum + d, 0);
  const hasAnyAudio = pulseAudioPaths.some(p => p && existsSync(p));
  console.log(`[V5]   Total narration audio: ${totalAudioDuration.toFixed(2)}s across ${pulseAudioPaths.filter(p => p).length} segments`);

  // Step 7: Adjust pulse durations to match audio (SYNC audio with visuals)
  console.log('[V5] Step 7: Syncing pulse durations with audio...');
  // Original durations: [5, 30, 25, 25, 25, 20] = 130s (V21: compressed from 9 to 6 pulses)
  const MIN_PULSE_DURATION = 3;   // V15: Reduced from 5s to 3s — tighter pacing
  const MAX_PULSE_DURATION = 35;  // V21: Increased to allow shock pulse to be longer (core segment)
  const AUDIO_PADDING = 0.5;      // V21: Reduced from 0.8s to 0.5s — even tighter sync

  const adjustedPulseDefs = PULSE_DEFS.map(([name, origStart, origEnd], idx) => {
    const audioDur = pulseAudioDurations[idx] || 0;
    const origDur = origEnd - origStart;

    // If we have audio for this pulse, use audio duration + padding (but respect min/max)
    let newDur = origDur;
    if (audioDur > 0) {
      newDur = Math.max(audioDur + AUDIO_PADDING, MIN_PULSE_DURATION);
      newDur = Math.min(newDur, MAX_PULSE_DURATION);
      // If audio is close to original duration, keep original (avoid unnecessary changes)
      if (Math.abs(audioDur + AUDIO_PADDING - origDur) < 2) {
        newDur = origDur;
      }
    }

    return [name, newDur];
  });

  // Calculate cumulative start times
  let cumulativeStart = 0;
  const syncedPulseDefs = adjustedPulseDefs.map(([name, dur]) => {
    const start = cumulativeStart;
    cumulativeStart += dur;
    return [name, start, cumulativeStart];
  });

  const finalDuration = cumulativeStart;
  console.log(`[V5]   Adjusted total video duration: ${finalDuration.toFixed(1)}s (original: 130s)`);
  syncedPulseDefs.forEach(([name, start, end], i) => {
    const audioDur = pulseAudioDurations[i] || 0;
    console.log(`[V5]   Pulse ${i + 1} "${name}": ${end - start}s (audio: ${audioDur.toFixed(1)}s)`);
  });

  // Step 8: Launch Playwright Chromium WITHOUT recordVideo (frame-by-frame screenshots instead)
  console.log('[V5] Step 8: Launching Playwright Chromium for frame-by-frame rendering...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-features=IsolateOrigins,site-per-process',
      '--js-flags=--max-old-space-size=256',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
    ],
  });

  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });

  let context;
  let page;
  let frameCount = 0; // V350: Moved outside try — needed in Step 13 result JSON
  try {
  context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    // NO recordVideo — we use frame-by-frame screenshots instead
  });
  page = await context.newPage();

  // Step 9: Frame-by-frame screenshot rendering at 12 FPS (doubled to 30fps in FFmpeg)
  console.log(`[V5] Step 9: Frame-by-frame screenshot rendering at ${FPS} FPS (output: ${OUTPUT_FPS}fps)...`);
  const totalExpectedFrames = syncedPulseDefs.reduce((sum, [, start, end]) => sum + Math.ceil((end - start) * FPS), 0);
  console.log(`[V5]   Total expected frames: ${totalExpectedFrames} (at ${FPS}fps) → ${OUTPUT_FPS}fps output`);

  for (let pulseIdx = 0; pulseIdx < pulses.length; pulseIdx++) {
    const pulse = pulses[pulseIdx];
    // Use synced duration from audio (not the original fixed duration)
    const syncedDur = syncedPulseDefs[pulseIdx] ? syncedPulseDefs[pulseIdx][2] - syncedPulseDefs[pulseIdx][1] : pulse.duration;
    const totalFrames = Math.ceil(syncedDur * FPS);
    console.log(`[V5]   Pulse ${pulseIdx + 1}/${pulses.length}: ${pulse.name} (${syncedDur.toFixed(1)}s, ${totalFrames} frames)`);

    // V12: Memory check before rendering each pulse
    const memUsage = process.memoryUsage();
    const memMB = memUsage.heapUsed / 1024 / 1024;
    if (memMB > 800) {
      console.warn(`[V12] Memory usage high: ${memMB.toFixed(0)}MB — forcing garbage collection`);
      if (global.gc) global.gc();
    }

    // Set page content ONCE per pulse
    await page.setContent(pulse.html, { waitUntil: 'domcontentloaded' });

    // Wait for fonts to load and rendering to stabilize
    try {
      await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 3000 });
    } catch {}
    await page.waitForTimeout(150);

    for (let f = 0; f < totalFrames; f++) {
      const progress = f / (totalFrames - 1 || 1);

      // Advance animation via setAnimationProgress
      await page.evaluate((p) => {
        if (typeof window.setAnimationProgress === 'function') {
          window.setAnimationProgress(p);
        }
      }, progress);

      // Screenshot this frame as JPEG (V14: quality 92 for professional output)
      const framePath = join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 85 });
      frameCount++;

      // Progress log every 100 frames
      if (frameCount % 100 === 0) {
        const pct = ((frameCount / totalExpectedFrames) * 100).toFixed(0);
        console.log(`[V5]   Progress: ${frameCount}/${totalExpectedFrames} frames (${pct}%)`);
      }
    }

    // V14: Professional cross-fade transition (8 frames ≈ 0.5s at 16fps)
    if (pulseIdx < pulses.length - 1) {
      const FADE_FRAMES = 8;
      for (let tf = 0; tf < FADE_FRAMES; tf++) {
        const fadeProgress = 1.0 - ((tf + 1) / FADE_FRAMES);
        // Apply fade to black via CSS
        await page.evaluate((opacity) => {
          document.body.style.opacity = String(opacity);
        }, fadeProgress);
        const fadeFramePath = join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
        await page.screenshot({ path: fadeFramePath, type: 'jpeg', quality: 85 });
        frameCount++;
      }
      // Reset opacity for next pulse
      await page.evaluate(() => {
        document.body.style.opacity = '1';
      });
    }

    // V12: Clean up DOM content after each pulse to free memory
    await page.evaluate(() => {
      const contentArea = document.querySelector('.content-area');
      if (contentArea) contentArea.innerHTML = '';
    });

    // V13: Aggressive memory cleanup between pulses
    await page.evaluate(() => {
      // Remove all images from DOM to free memory
      const images = document.querySelectorAll('img');
      images.forEach(img => { img.src = ''; img.removeAttribute('src'); });
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      const memAfter = process.memoryUsage();
      console.log(`[V13]   Memory after GC: ${(memAfter.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    }
  }

  console.log(`[V5] Captured ${frameCount} frames at ${FPS}fps.`);

  } catch (renderErr) {
    console.error(`[V5] Frame rendering error: ${renderErr.message}`);
    throw renderErr;
  } finally {
    // Close browser — GUARANTEED cleanup even on error
    try { if (page) await page.close(); } catch {}
    try { if (context) await context.close(); } catch {}
    try { await browser.close(); } catch {}
    console.log('[V5] Browser closed.');
  }

  // Step 10: Stitch frames into video with FFmpeg (12fps input → 24fps output via frame duplication)
  console.log('[V5] Step 10: Stitching frames into video with FFmpeg...');
  const videoOnlyPath = join(tmpDir, 'video_only.mp4');

  const ffmpegVideoArgs = [
    '-y',
    '-framerate', String(FPS),  // Input framerate (12fps)
    '-i', join(framesDir, 'frame_%05d.jpg'),
    '-vf', `fps=${OUTPUT_FPS},scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=lanczos`,  // Upscale 720p→1080p + 24fps
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',         // V9: Lowered from 20 — fixes low bitrate (was 219kbps, now ~5Mbps)
    '-maxrate', '5M',     // V9: Enforce minimum bitrate for streaming
    '-bufsize', '10M',
    '-g', '48',           // V9: Fixed GOP for streaming (2s @ 24fps)
    '-keyint_min', '48',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-colorspace', 'bt709',
    '-movflags', '+faststart',
    videoOnlyPath,
  ];

  console.log('[V5] Running FFmpeg frame stitch...');
  const videoResult = spawnSync('ffmpeg', ffmpegVideoArgs, {
    encoding: 'utf-8',
    timeout: 300000,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (videoResult.status !== 0) {
    console.error(`[V5] FFmpeg stitch error: ${videoResult.stderr?.slice(-500)}`);
    throw new Error('FFmpeg frame stitch failed');
  }
  console.log('[V5] Frame stitching complete.');

  // Step 11: Combine video + narration + background music
  console.log('[V5] Step 11: Combining video + narration + background music...');

  // 11a: Concatenate per-pulse audio segments into one narration track
  let finalAudioPath = null;
  if (hasAnyAudio) {
    const concatenatedNarrationPath = join(tmpDir, 'narration_concat.mp3');
    const concatSuccess = concatenateAudioSegments(pulseAudioPaths, concatenatedNarrationPath);

    if (concatSuccess && existsSync(concatenatedNarrationPath)) {
      // 11b: Generate background music
      const narrationDuration = getAudioDuration(concatenatedNarrationPath);
      const musicPath = join(tmpDir, 'bg_music.mp3');
      const musicSuccess = generateBackgroundMusic(musicPath, Math.max(narrationDuration, finalDuration));

      // 11c: Mix narration + background music
      if (musicSuccess && existsSync(musicPath)) {
        const mixedAudioPath = join(tmpDir, 'mixed_audio.mp3');
        const mixSuccess = mixAudioWithMusic(concatenatedNarrationPath, musicPath, mixedAudioPath, 0.12);

        if (mixSuccess && existsSync(mixedAudioPath)) {
          finalAudioPath = mixedAudioPath;
          console.log('[V5]   Final audio: narration + background music mixed successfully');
        } else {
          // Mix failed — use narration only
          finalAudioPath = concatenatedNarrationPath;
          console.log('[V5]   Mix failed — using narration without background music');
        }
      } else {
        // Music generation failed — use narration only
        finalAudioPath = concatenatedNarrationPath;
        console.log('[V5]   Background music failed — using narration only');
      }
    } else {
      console.warn('[V5]   Audio concatenation failed — proceeding without audio');
    }
  }

  // V1046: Post-process audio — remove silence gaps + normalize loudness
  if (finalAudioPath && existsSync(finalAudioPath)) {
    const processedPath = finalAudioPath.replace('.mp3', '_proc.mp3');
    const ppResult = spawnSync('ffmpeg', [
      '-y', '-i', finalAudioPath,
      '-af', 'silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-40dB,loudnorm=I=-16:LRA=11:TP=-1.5',
      '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100',
      processedPath,
    ], { encoding: 'utf-8', timeout: 120000 });
    if (ppResult.status === 0 && existsSync(processedPath)) {
      try { unlinkSync(finalAudioPath); } catch {}
      finalAudioPath = processedPath;
    }
  }

  // 11d: Merge final audio with video
  if (finalAudioPath && existsSync(finalAudioPath)) {
    console.log('[V5]   Merging final audio with video...');
    const mergeArgs = [
      '-y',
      '-i', videoOnlyPath,
      '-i', finalAudioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',          // V14: Professional broadcast standard 48kHz
      '-ac', '2',              // V14: Stereo output for broadcast quality
      '-shortest',
      '-movflags', '+faststart',  // CRITICAL: moov atom at start for browser streaming
      outputPath,
    ];

    const mergeResult = spawnSync('ffmpeg', mergeArgs, {
      encoding: 'utf-8',
      timeout: 300000,
      maxBuffer: 50 * 1024 * 1024,
    });

    if (mergeResult.status !== 0) {
      console.error(`[V5] FFmpeg merge error: ${mergeResult.stderr?.slice(-500)}`);
      // Fall back to video-only
      console.log('[V5] Falling back to video-only output.');
      const cpResult = spawnSync('cp', [videoOnlyPath, outputPath]);
      if (cpResult.status !== 0) {
        throw new Error('Failed to copy video-only output');
      }
    }
  } else {
    // No audio — just copy video
    console.log('[V5]   No audio. Copying video-only output.');
    const cpResult = spawnSync('cp', [videoOnlyPath, outputPath]);
    if (cpResult.status !== 0) {
      throw new Error('Failed to copy video-only output');
    }
  }

  // Step 12: Verify output, cleanup temp files
  console.log('[V5] Step 12: Verifying output...');
  if (!existsSync(outputPath)) {
    throw new Error('Output file was not created');
  }

  // Get output file size
  const outputStat = spawnSync('stat', ['-c', '%s', outputPath], { encoding: 'utf-8' });
  const outputSize = parseInt(outputStat.stdout.trim(), 10) || 0;
  const outputSizeMB = (outputSize / (1024 * 1024)).toFixed(2);

  // Get output duration
  const outputDuration = getAudioDuration(outputPath) || getAudioDuration(videoOnlyPath) || finalDuration;

  console.log(`[V5] Output: ${outputPath} (${outputSizeMB} MB, ${outputDuration.toFixed(2)}s)`);

  // V13: Quality Verification — ensure video meets minimum standards
  console.log('[V13] Step 12b: Quality verification...');
  const qualityChecks = {
    videoExists: existsSync(outputPath),
    videoSizeMB: 0,
    videoDuration: 0,
    hasAudio: false,
    passed: false,
  };

  if (qualityChecks.videoExists) {
    qualityChecks.videoSizeMB = outputSize / (1024 * 1024);
    qualityChecks.videoDuration = outputDuration;
    
    // Check if video has audio track
    try {
      const audioCheck = spawnSync('ffprobe', [
        '-v', 'quiet', '-select_streams', 'a',
        '-show_entries', 'stream=codec_type',
        '-of', 'default=noprint_wrappers=1',
        outputPath,
      ], { encoding: 'utf-8', timeout: 10000 });
      qualityChecks.hasAudio = audioCheck.stdout?.includes('codec_type=audio') || false;
    } catch {}

    // Quality thresholds
    qualityChecks.passed = 
      qualityChecks.videoSizeMB > 1 &&     // At least 1MB
      qualityChecks.videoDuration > 10 &&    // At least 10 seconds
      outputSize > 0;                        // File not empty
    
    console.log(`[V13] Quality: size=${qualityChecks.videoSizeMB.toFixed(1)}MB, duration=${qualityChecks.videoDuration.toFixed(1)}s, audio=${qualityChecks.hasAudio}, PASSED=${qualityChecks.passed}`);
    
    if (!qualityChecks.passed) {
      console.error(`[V13] QUALITY CHECK FAILED! Video may be corrupted.`);
    }
  }

  // Cleanup temp files
  console.log('[V5] Cleaning up temp files...');
  try {
    // Remove frames directory
    try { rmSync(framesDir, { recursive: true, force: true }); } catch {}
    try { unlinkSync(videoOnlyPath); } catch {}
    // Remove per-pulse audio files
    for (let i = 0; i < 7; i++) {  // V1049: 7 pulses
      try { unlinkSync(join(tmpDir, `pulse_${i}_voice.mp3`)); } catch {}
      try { unlinkSync(join(tmpDir, `pulse_${i}_voice_text.txt`)); } catch {}
    }
    try { unlinkSync(join(tmpDir, 'narration_concat.mp3')); } catch {}
    try { unlinkSync(join(tmpDir, 'bg_music.mp3')); } catch {}
    try { unlinkSync(join(tmpDir, 'mixed_audio.mp3')); } catch {}
    // Try to remove tmp dir (may fail if not empty)
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  } catch (err) {
    console.warn(`[V5] Cleanup warning: ${err.message}`);
  }

  // Step 13: Return result JSON
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const result = {
    success: true,
    output: outputPath,
    duration: outputDuration,
    size_bytes: outputSize,
    size_mb: parseFloat(outputSizeMB),
    frame_count: frameCount,
    fps: OUTPUT_FPS,
    pulse_count: pulses.length,
    audio_duration: totalAudioDuration,
    has_background_music: finalAudioPath !== null,
    generation_time_seconds: parseFloat(elapsed),
    locale: locale,
  };

  console.log(`[V5] Video generation complete in ${elapsed}s. ${frameCount} frames at ${FPS}fps → ${OUTPUT_FPS}fps output, ${pulses.length} pulses.`);
  return result;
}

// ─── Cinematic Cross-fade Between Pulses (V12) ──────────────
function buildXfadeFilter(numPulses, fadeDuration = 0.8) {
  if (numPulses <= 1) return null;

  // Build xfade filter chain for smooth transitions
  const parts = [];
  let offset = 0;

  for (let i = 0; i < numPulses - 1; i++) {
    // Get pulse duration
    const pulseDef = PULSE_DEFS[i];
    const nextPulseDef = PULSE_DEFS[i + 1];
    const pulseDur = pulseDef[2] - pulseDef[1];

    if (i === 0) {
      offset = pulseDur - fadeDuration;
    } else {
      offset += pulseDur - fadeDuration;
    }

    const inputA = i === 0 ? `[${i * 2}:v]` : `[v${i - 1}]`;
    const inputB = `[${(i + 1) * 2}:v]`;
    const output = i === numPulses - 2 ? '[vout]' : `[v${i}]`;

    // Use different transition types for variety
    const transitions = ['fadeblack', 'slideleft', 'fade', 'slidedown', 'fadeblack', 'slideup', 'fade', 'slideright'];
    const transition = transitions[i % transitions.length];

    parts.push(`${inputA}${inputB}xfade=transition=${transition}:duration=${fadeDuration}:offset=${offset.toFixed(2)}${output}`);
  }

  return parts.join(';');
}

// ─── V1047: Smart Image Prompt via Groq Chat API ──────────────
// Uses Groq Llama 3.3 70B to understand the report topic and generate
// context-aware image prompts. Falls back to keyword-based generator.
// GROQ_API_KEY is available on Railway (used for TTS already).
async function generateContextualImagePrompt(data, pulseIndex) {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const sceneTypes = [
        'opening establishing shot', 'shock statistics reveal', 'root causes analysis',
        'racing comparison chart', 'historical parallels timeline', 'alert scenarios warning',
        'strategic takeaways insight', 'asset recommendations portfolio', 'closing brand identity',
      ];
      const sceneType = sceneTypes[pulseIndex] || 'financial analysis';

      const requestBody = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are an image prompt engineer. Generate ONE image generation prompt in English (40-60 words) for a financial video scene.

Report title: "${(data.title || '').slice(0, 150)}"
Scene type: ${sceneType}

Rules:
- The image must visually represent the SPECIFIC topic of the report
- Do NOT use generic terms like "trading floor" or "financial studio"
- Use visual metaphors related to the actual subject matter
- End with: cinematic, dark blue theme, 8K, photorealistic
- Return ONLY the prompt, nothing else`
        }],
        max_tokens: 120,
        temperature: 0.7,
      });

      const result = spawnSync('curl', [
        '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/chat/completions',
        '-H', `Authorization: Bearer ${groqKey}`,
        '-H', 'Content-Type: application/json',
        '-d', requestBody,
      ], { encoding: 'utf-8', timeout: 30000 });

      if (result.status === 0 && result.stdout) {
        const resp = JSON.parse(result.stdout);
        const prompt = resp.choices?.[0]?.message?.content?.trim();
        if (prompt && prompt.length > 30) {
          console.log(`[V1047] Smart image prompt for pulse ${pulseIndex}: "${prompt.slice(0, 80)}..."`);
          return prompt;
        }
      }
    } catch (err) {
      console.warn(`[V1047] Smart prompt failed: ${err.message?.slice(0, 60)}`);
    }
  }

  // Fallback: original keyword-based generator
  return generateContextualImagePromptLegacy(data, pulseIndex);
}

// ─── Legacy Image Prompt Generator (V12 keyword-based) ─────────
function generateContextualImagePromptLegacy(data, pulseIndex) {
  const title = (data.title || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const marketImpact = data.market_impact || 'neutral';

  // Base financial scene keywords for each pulse — V21: 6 pulses, compressed
  const pulseScenes = [
    'Professional financial news broadcast studio with holographic data displays, Arabic text overlay, dark blue background, Bloomberg terminal aesthetic, glowing charts and tickers',  // Ignition
    'Stock market trading floor with dramatic digital displays showing rising and falling numbers, candlestick charts projection on wall, intense atmosphere, cinematic lighting', // Shock
    'Dynamic financial chart dashboard with real-time candlestick charts, RSI indicator, MACD histogram, Bollinger Bands, dark theme professional trading terminal with Arabic labels', // Race
    'Warning alert dashboard with red yellow green scenario indicators, probability meters, risk assessment visualization, emergency financial monitoring center', // Alert
    'Strategic planning war room with financial projection screens, key insight cards floating in space, decision matrix visualization, executive briefing room', // Takeaway
    'Professional news broadcast closing with logo animation, financial recommendations ticker, brand identity overlay, elegant fade out with corporate branding', // Harvest
  ];

  let prompt = pulseScenes[pulseIndex] || pulseScenes[0];

  // Add topic-specific keywords based on content analysis
  const topicKeywords = [];
  if (title.includes('oil') || title.includes('نفط') || summary.includes('oil') || summary.includes('نفط')) {
    topicKeywords.push('oil refinery', 'oil derricks', 'crude oil barrels', 'petroleum industry');
  }
  if (title.includes('gold') || title.includes('ذهب') || summary.includes('gold')) {
    topicKeywords.push('gold bars', 'gold bullion vault', 'precious metals');
  }
  if (title.includes('inflation') || title.includes('تضخم')) {
    topicKeywords.push('rising prices graph', 'inflation chart', 'consumer price index');
  }
  if (title.includes('interest') || title.includes('فائدة') || title.includes('rate')) {
    topicKeywords.push('central bank building', 'federal reserve', 'monetary policy');
  }
  if (title.includes('stock') || title.includes('أسهم') || title.includes('market')) {
    topicKeywords.push('wall street', 'stock exchange', 'trading floor');
  }
  if (title.includes('crypto') || title.includes('بتكوين') || title.includes('bitcoin')) {
    topicKeywords.push('cryptocurrency mining', 'bitcoin digital', 'blockchain');
  }
  if (title.includes('china') || title.includes('الصين')) {
    topicKeywords.push('shanghai skyline', 'chinese economy', 'great wall modern');
  }
  if (title.includes('fed') || title.includes('احتياطي')) {
    topicKeywords.push('federal reserve building', 'jerome powell', 'us central bank');
  }
  if (title.includes('سوق') || title.includes('market') || title.includes('أسواق')) {
    topicKeywords.push('stock market trading floor', 'financial district', 'wall street');
  }
  if (title.includes('دولار') || title.includes('dollar') || title.includes('usd') || title.includes('عملة')) {
    topicKeywords.push('us dollar currency', 'forex trading', 'exchange rate display');
  }
  if (title.includes('بنك') || title.includes('bank') || title.includes('مركزي')) {
    topicKeywords.push('central bank headquarters', 'banking hall', 'financial institution');
  }
  if (title.includes('عقارات') || title.includes('real estate') || title.includes('property')) {
    topicKeywords.push('luxury real estate', 'skyscrapers', 'commercial property');
  }
  if (title.includes('صندوق') || title.includes('fund') || title.includes('استثمار')) {
    topicKeywords.push('investment portfolio', 'hedge fund office', 'asset management');
  }

  // Add topic keywords to prompt if found
  if (topicKeywords.length > 0) {
    prompt += ', featuring ' + topicKeywords.slice(0, 2).join(' and ');
  }

  // Add market impact mood
  if (marketImpact === 'bullish' || marketImpact === 'positive') {
    prompt += ', optimistic green lighting, upward arrow indicators';
  } else if (marketImpact === 'bearish' || marketImpact === 'negative') {
    prompt += ', dramatic red lighting, downward pressure indicators';
  } else {
    prompt += ', professional blue lighting, balanced indicators';
  }

  // Add quality qualifiers — V20: More specific for financial broadcast quality
  prompt += ', cinematic composition, professional broadcast quality, ultra detailed, dark moody background with subtle blue gradients, dramatic rim lighting, CNBC Bloomberg Terminal aesthetic, financial infographic style, depth of field, volumetric lighting, 8K resolution, photorealistic rendering';

  return prompt;
}

// ─── CLI Entry Point ─────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  const inputPath = args.input;
  const outputPath = args.output;

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/video-renderer.mjs --input <data.json> --output <video.mp4>');
    process.exit(1);
  }

  // V14: Global timeout — kill the process if it takes more than 7 minutes
  const GLOBAL_TIMEOUT_MS = 15 * 60 * 1000;  // V339: Increased from 10 to 15 min — image gen (3-4m) + TTS (1m) + frames (7-8m) = ~12m total
  const globalTimer = setTimeout(() => {
    console.error(`[V14] GLOBAL TIMEOUT: Video generation exceeded ${GLOBAL_TIMEOUT_MS / 1000}s — forcing exit`);
    process.exit(2);
  }, GLOBAL_TIMEOUT_MS);

  try {
    const result = await generateVideo(inputPath, outputPath);
    clearTimeout(globalTimer);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    clearTimeout(globalTimer);
    console.error(`[V5] Fatal error: ${err.message}`);
    console.error(err.stack);
    const errorResult = {
      success: false,
      error: err.message,
    };
    console.log(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }
}

// Run if executed directly
main();

export {
  WIDTH, HEIGHT, FPS, COLORS, TICKER_HEIGHT, NEWSBAR_HEIGHT, CONTENT_HEIGHT,
  PULSE_DEFS, AR_NUMERALS,
  parseArgs, getImpactColor, getImpactLabel, getImpactArrow,
  formatNumber, escapeHTML, lerp, easeOutCubic, easeInOutCubic,
  easeOutElastic, clamp, segmentProgress, hexToRgba, toArabicNumeral,
  generateVoiceover, getAudioDuration,
  enhanceDataWithDefaults, generateDefaultRootCauses,
  generateDefaultHistoricalParallels, generateDefaultStrategicTakeaways,
  generateBaseHTML, generateTickerBar, generateNewsBar,
  generateIgnitionPulse, generateShockPulse, generateRootsPulse,
  generateRacePulse, generateHistoryPulse,
  generateAlertPulse, generateTakeawayPulse, generateDealPulse,
  generateHarvestPulse,
  generateMiniSparklineSVG, generateGaugeSVG,
  generateContextualImagePrompt, buildXfadeFilter,
  generateVideo, main,
};
