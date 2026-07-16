// ─── AI Image Generation for Infographic Slides ────────────────
// V8: Cloudflare Workers AI as PRIMARY (first to try), with full fallback chain.
// - Cloudflare Workers AI: FREE ~100-500 images/day, fast 5-15s (PRIMARY)
// - Pollinations as secondary (returns 402 on Railway cloud IPs)
// - SDK as fallback (slow: 30s, may fail on Railway)
// - CLI as last resort (local dev only)
// - R2 URLs are persistent (survive Railway redeployment)

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { uploadImageToR2, isR2Available } from './image-storage';
import { buildPollinationsUrl, isPollinationsUrl } from './image-gen-utils';

const GENERATED_DIR = '/tmp/rouaa-infographics';

function ensureDir() {
  const fullDir = path.resolve(GENERATED_DIR);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  return fullDir;
}

// ─── Slide type → AI image prompt template ────────────────
const SLIDE_PROMPT_TEMPLATES: Record<string, (context: string, customPrompt?: string) => string> = {
  hero: (ctx, custom) => custom
    ? `${custom}, cinematic depth of field, no text, ultra detailed, 8k`
    : `Professional financial infographic background, dark navy blue background with subtle ${ctx} themed abstract elements, gold and cyan accent lighting, cinematic depth of field, no text, ultra detailed, 8k`,
  story: (ctx, custom) => custom
    ? `${custom}, glassmorphism effect, no text, ultra detailed, 8k`
    : `Professional business infographic background, dark navy blue with subtle ${ctx} connection lines and nodes, glassmorphism effect, gold accent lights, no text, ultra detailed, 8k`,
  data: (ctx, custom) => custom
    ? `${custom}, abstract data streams, no text, ultra detailed, 8k`
    : `Professional data visualization background, dark navy blue with subtle ${ctx} themed chart elements, abstract data streams, gold and green accent lighting, no text, ultra detailed, 8k`,
  indicators: (ctx, custom) => custom
    ? `${custom}, abstract data visualization, no text, ultra detailed, 8k`
    : `Professional financial indicators background, dark navy blue with ${ctx} themed gauge and metric elements, abstract data visualization, gold and green accent lighting, no text, ultra detailed, 8k`,
  metrics: (ctx, custom) => custom
    ? `${custom}, abstract metric dashboards, no text, ultra detailed, 8k`
    : `Professional financial metrics background, dark navy blue with ${ctx} themed dashboard elements, abstract metric dashboards, gold and cyan accent lighting, no text, ultra detailed, 8k`,
  scenarios: (ctx, custom) => custom
    ? `${custom}, abstract geometric shapes, no text, ultra detailed, 8k`
    : `Professional scenario analysis background, dark navy blue with ${ctx} themed crossroads and decision paths, abstract geometric shapes, gold accent lighting, no text, ultra detailed, 8k`,
  assets: (ctx, custom) => custom
    ? `${custom}, gold and red accent lighting, no text, ultra detailed, 8k`
    : `Professional financial assets background, dark navy blue with ${ctx} themed bull and bear market abstract shapes, gold and red accent lighting, no text, ultra detailed, 8k`,
  affected_assets: (ctx, custom) => custom
    ? `${custom}, gold and red accent lighting, no text, ultra detailed, 8k`
    : `Professional financial impact background, dark navy blue with ${ctx} themed market winners and losers abstract shapes, gold and red accent lighting, no text, ultra detailed, 8k`,
  stat: (ctx, custom) => custom
    ? `${custom}, clean data presentation, no text, ultra detailed, 8k`
    : `Professional financial statistics background, dark navy blue with ${ctx} themed number elements, clean data presentation, gold accent lighting, no text, ultra detailed, 8k`,
  comparison: (ctx, custom) => custom
    ? `${custom}, split composition, no text, ultra detailed, 8k`
    : `Professional comparison background, dark navy blue with ${ctx} themed dual panel elements, split composition, gold and blue accent lighting, no text, ultra detailed, 8k`,
  timeline: (ctx, custom) => custom
    ? `${custom}, flowing timeline, no text, ultra detailed, 8k`
    : `Professional timeline background, dark navy blue with ${ctx} themed flowing sequence elements, flowing timeline, gold accent lighting, no text, ultra detailed, 8k`,
  list: (ctx, custom) => custom
    ? `${custom}, organized layout, no text, ultra detailed, 8k`
    : `Professional list background, dark navy blue with ${ctx} themed organized elements, organized layout, gold accent lighting, no text, ultra detailed, 8k`,
  chart: (ctx, custom) => custom
    ? `${custom}, chart visualization, no text, ultra detailed, 8k`
    : `Professional chart background, dark navy blue with ${ctx} themed graph and curve elements, chart visualization, gold and green accent lighting, no text, ultra detailed, 8k`,
  quote: (ctx, custom) => custom
    ? `${custom}, elegant framing, no text, ultra detailed, 8k`
    : `Professional quote background, dark navy blue with ${ctx} themed elegant framing elements, gold accent lighting, no text, ultra detailed, 8k`,
};

// ─── Sector → context for AI image prompts ────────────────
const SECTOR_CONTEXT: Record<string, string> = {
  'طاقة': 'oil energy',
  'نفط': 'oil petroleum',
  'غاز': 'natural gas energy',
  'ذهب': 'gold precious metals',
  'سلع': 'commodities trading',
  'اقتصاد': 'economy finance',
  'أسهم': 'stock market trading',
  'بورصة': 'stock exchange',
  'عملات': 'currency forex',
  'فوركس': 'forex currency',
  'تقنية': 'technology digital',
  'تكنولوجيا': 'technology digital',
  'بنوك': 'banking finance',
  'عقارات': 'real estate architecture',
  'سياسة': 'geopolitics global',
  'حروب': 'conflict defense',
  'دفاع': 'military defense',
  'تشفير': 'cryptocurrency blockchain',
  'كريبتو': 'cryptocurrency blockchain',
  'أرباح شركات': 'corporate earnings profit',
  'شركات': 'corporate business',
  'أصول رقمية': 'cryptocurrency blockchain',
  'سياحة': 'tourism travel',
  'أجهزة': 'consumer appliances',
  'سلاسل التوريد': 'supply chain logistics',
};

export function getSectorContext(category?: string): string {
  if (!category) return 'finance business';
  if (SECTOR_CONTEXT[category]) return SECTOR_CONTEXT[category];
  for (const [key, val] of Object.entries(SECTOR_CONTEXT)) {
    if (category.includes(key) || key.includes(category)) return val;
  }
  return 'finance business';
}

// ─── Image generation methods ──────────────────────────────

// Method 0: Cloudflare Workers AI (FREE, fast 5-15s, reliable on Railway)
// Uses the same Cloudflare account as R2 storage.
// Free tier: 10,000 neurons/day (~100-500 images/day).
async function generateImageCloudflareAI(prompt: string, format: string = 'landscape'): Promise<Buffer | null> {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.R2_ACCOUNT_ID;
  if (!cfApiToken || !cfAccountId) return null;

  try {
    const cfModel = process.env.CF_IMAGE_MODEL || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

    console.log(`[AI-Image] Trying Cloudflare Workers AI (${cfModel}, ${format})...`);

    const imgWidth = format === 'vertical' ? 768 : format === 'square' ? 1024 : 1024;
    const imgHeight = format === 'vertical' ? 1344 : format === 'square' ? 1024 : 576;

    // Negative prompt: forbid people/faces/text in generated images
    const enhancedPrompt = `${prompt}, no people, no faces, no humans, no text, no words, no letters, no UI, no screenshots, cinematic, dark, dramatic lighting`;

    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt.slice(0, 500),
        num_steps: 20,
        width: imgWidth,
        height: imgHeight,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[AI-Image] Cloudflare AI failed (${response.status}): ${errText.slice(0, 100)}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let imgBuffer: Buffer;

    if (contentType.includes('image/')) {
      imgBuffer = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes('json')) {
      const jsonData = await response.json() as any;
      if (jsonData.image) {
        imgBuffer = Buffer.from(jsonData.image, 'base64');
      } else if (jsonData.data?.[0]) {
        const b64 = jsonData.data[0].b64_json || jsonData.data[0];
        imgBuffer = Buffer.from(typeof b64 === 'string' ? b64 : JSON.stringify(b64), 'base64');
      } else {
        console.warn(`[AI-Image] Cloudflare AI unexpected JSON: ${JSON.stringify(jsonData).slice(0, 150)}`);
        return null;
      }
    } else {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength < 1000) {
        console.warn(`[AI-Image] Cloudflare AI response too small (${arrayBuf.byteLength} bytes)`);
        return null;
      }
      imgBuffer = Buffer.from(arrayBuf);
    }

    if (imgBuffer.length < 2000) {
      console.warn(`[AI-Image] Cloudflare AI image too small (${imgBuffer.length} bytes)`);
      return null;
    }

    console.log(`[AI-Image] ✓ Cloudflare Workers AI generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
    return imgBuffer;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[AI-Image] Cloudflare AI request timed out`);
    } else {
      console.warn(`[AI-Image] Cloudflare AI failed: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

// Method 1: Gemini Flash Image (Google — high quality, ~3-5s)
// Needs GEMINI_API_KEY. Models: gemini-2.0-flash-exp (free preview).
// Free tier: ~500 req/day for preview models.
async function generateImageGeminiFlash(prompt: string, format: string = 'landscape'): Promise<Buffer | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return null;

  try {
    const geminiModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const aspectRatio = format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9';
    console.log(`[AI-Image] Trying Gemini Flash Image (${geminiModel}, ${aspectRatio})...`);

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${prompt}. IMPORTANT: No people, no faces, no humans, no text, no words, no letters. Only abstract financial scenes: buildings, charts, gold, currency, technology. Cinematic dark dramatic lighting.`.slice(0, 1000) }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[AI-Image] Gemini Flash failed (${response.status}): ${errText.slice(0, 100)}`);
      return null;
    }

    const data = await response.json() as any;
    const candidates = data.candidates || [];
    if (candidates.length === 0) return null;

    const parts = candidates[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) return null;

    const base64Data = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const imgBuffer = Buffer.from(base64Data, 'base64');

    if (imgBuffer.length < 2000) {
      console.warn(`[AI-Image] Gemini Flash image too small (${imgBuffer.length} bytes)`);
      return null;
    }

    console.log(`[AI-Image] ✓ Gemini Flash Image generated (${(imgBuffer.length / 1024).toFixed(0)}KB, ${mimeType})`);
    return imgBuffer;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[AI-Image] Gemini Flash request timed out`);
    } else {
      console.warn(`[AI-Image] Gemini Flash failed: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

// Method 2: Prodia (FLUX schnell — ultra fast ~0.4s)
// Needs PRODIA_API_KEY. Free tier available for FLUX schnell.
async function generateImageProdia(prompt: string, format: string = 'landscape'): Promise<Buffer | null> {
  const prodiaApiKey = process.env.PRODIA_API_KEY;
  if (!prodiaApiKey) return null;

  try {
    const prodiaJobType = process.env.PRODIA_JOB_TYPE || 'inference.flux-fast.schnell.txt2img.v2';
    const prodiaUrl = 'https://inference.prodia.com/v2/job';

    const aspectRatio = format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9';
    console.log(`[AI-Image] Trying Prodia (${prodiaJobType}, ${aspectRatio})...`);

    const response = await fetch(prodiaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${prodiaApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'image/jpeg',
      },
      body: JSON.stringify({
        type: prodiaJobType,
        config: {
          prompt: `${prompt}, no people, no faces, no humans, no text, no words, cinematic, dark, dramatic lighting`.slice(0, 1000),
          aspect_ratio: aspectRatio,
        }
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[AI-Image] Prodia failed (${response.status}): ${errText.slice(0, 100)}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    // Prodia V2 returns raw binary when Accept: image/jpeg is set
    if (contentType.startsWith('image/') || contentType.startsWith('multipart/')) {
      const imgBuffer = Buffer.from(await response.arrayBuffer());

      if (imgBuffer.length < 2000) {
        console.warn(`[AI-Image] Prodia image too small (${imgBuffer.length} bytes)`);
        return null;
      }

      console.log(`[AI-Image] ✓ Prodia image generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
      return imgBuffer;
    }

    console.warn(`[AI-Image] Prodia unexpected response format: ${contentType}`);
    return null;
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[AI-Image] Prodia request timed out`);
    } else {
      console.warn(`[AI-Image] Prodia failed: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

// Method 3: Pollinations.ai (returns 402 on Railway cloud IPs)
async function generateImagePollinations(prompt: string): Promise<Buffer | null> {
  try {
    const enhancedPrompt = `${prompt}, no people, no faces, no humans, no text, no words, cinematic, dark, dramatic lighting`;
    const shortPrompt = enhancedPrompt.length > 300 ? enhancedPrompt.substring(0, 297) + '...' : enhancedPrompt;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=1344&height=768&nologo=true&seed=${Date.now()}&model=flux`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RouaTradingNews/1.0 (Image Generator)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(25000), // 25s timeout
    });

    // V6: Detect 402 (Payment Required) — cloud IPs are blocked
    if (response.status === 402) {
      console.warn(`[AI-Image] Pollinations returned 402 (cloud IP blocked)`);
      return null;
    }

    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    // V6: Verify it's actually an image, not a JSON error
    if (buffer.length < 5000) return null;

    return buffer;
  } catch {
    return null;
  }
}

// Method 2: z-ai-web-dev-sdk (SLOW: 25-35s, but high quality)
async function generateImageSDK(prompt: string): Promise<Buffer | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt,
      size: '1344x768',
    });

    const base64 = response.data?.[0]?.base64;
    if (!base64) return null;

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 5000) return null;

    return buffer;
  } catch {
    return null;
  }
}

// Method 3: CLI (local dev only)
async function generateImageCLI(prompt: string, outputPath: string): Promise<boolean> {
  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    execSync(`z-ai-generate --prompt "${escapedPrompt}" --output "${outputPath}" --size 1344x768`, {
      timeout: 90000,
      stdio: 'pipe',
    });
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000;
  } catch {
    return false;
  }
}

// ─── Generate a single image — Cloudflare PRIMARY + fallbacks ────────
async function generateImage(prompt: string, outputPath: string): Promise<Buffer | null> {
  // V8: Cloudflare Workers AI — PRIMARY (first to try)
  let buffer = await generateImageCloudflareAI(prompt);
  if (buffer) {
    fs.writeFileSync(outputPath, buffer);
    return buffer;
  }

  // Method 1: Gemini Flash Image (high quality, ~3-5s)
  buffer = await generateImageGeminiFlash(prompt);
  if (buffer) {
    fs.writeFileSync(outputPath, buffer);
    return buffer;
  }

  // Method 2: Prodia (FLUX schnell, ultra fast ~0.4s)
  buffer = await generateImageProdia(prompt);
  if (buffer) {
    fs.writeFileSync(outputPath, buffer);
    return buffer;
  }

  // Method 3: Pollinations (may return 402 on Railway cloud IPs)
  buffer = await generateImagePollinations(prompt);
  if (buffer) {
    fs.writeFileSync(outputPath, buffer);
    return buffer;
  }

  // Method 4: SDK (slower but higher quality)
  console.log('[AI-Image] Pollinations failed, trying SDK...');
  buffer = await generateImageSDK(prompt);
  if (buffer) {
    fs.writeFileSync(outputPath, buffer);
    return buffer;
  }

  // Method 5: CLI (local dev only)
  console.log('[AI-Image] SDK failed, trying CLI...');
  const success = await generateImageCLI(prompt, outputPath);
  if (success) {
    return fs.readFileSync(outputPath);
  }

  return null;
}

// ─── Generate a single image and return Buffer (no file write) ────────
// V19: Exported for AI video engine — uses same provider chain as generateImage
// but returns Buffer directly without writing to disk (caller handles persistence).
export async function generateImageBuffer(prompt: string, format: string = 'landscape'): Promise<Buffer | null> {
  if (!prompt || prompt.length < 5) return null;

  // V8: Cloudflare Workers AI — PRIMARY (first to try)
  let buffer = await generateImageCloudflareAI(prompt, format);
  if (buffer && buffer.length > 2000) return buffer;

  // Method 1: Gemini Flash Image (high quality, ~3-5s)
  buffer = await generateImageGeminiFlash(prompt, format);
  if (buffer && buffer.length > 2000) return buffer;

  // Method 2: Prodia (FLUX schnell, ultra fast ~0.4s)
  buffer = await generateImageProdia(prompt, format);
  if (buffer && buffer.length > 2000) return buffer;

  // Method 3: Pollinations (may return 402 on Railway cloud IPs)
  const pollWidth = format === 'vertical' ? 768 : format === 'square' ? 1024 : 1344;
  const pollHeight = format === 'vertical' ? 1344 : format === 'square' ? 1024 : 768;
  buffer = await generateImagePollinations(prompt);
  if (buffer && buffer.length > 2000) return buffer;

  // NOTE: generateImageSDK() intentionally skipped — it uses z-ai-web-dev-sdk
  // which requires a .z-ai-config file that doesn't exist on Railway.

  return null;
}

// ─── Persist image: upload to R2 for persistence ────────
// V5: Always tries R2 first. Falls back to Pollinations direct URL if R2 unavailable.
// NEVER falls back to /tmp — Pollinations URLs survive Railway redeployment.
// Returns the public URL (R2 URL or Pollinations direct URL)
async function persistImage(
  imagePath: string,
  slideId: string,
  prompt?: string
): Promise<string> {
  const filename = path.basename(imagePath);

  try {
    const buffer = fs.readFileSync(imagePath);
    const mimeType = 'image/png';

    // Priority 1: Upload to R2 (persistent CDN URL, survives redeployment)
    if (isR2Available()) {
      try {
        const r2Result = await uploadImageToR2(`infographic-${slideId}`, buffer, mimeType);
        if (r2Result.success && r2Result.url) {
          console.log(`[AI-Image] ✓ Uploaded to R2: ${r2Result.url.slice(0, 80)}...`);
          return r2Result.url;
        }
        console.warn(`[AI-Image] R2 upload failed: ${r2Result.error}`);
      } catch (r2Err: any) {
        console.warn(`[AI-Image] R2 upload error: ${r2Err.message?.slice(0, 80)}`);
      }
    }

    // Priority 2 (V5): Pollinations direct URL (always works, survives redeployment)
    // When R2 is unavailable, we use the Pollinations URL directly.
    // The image is generated on-demand by Pollinations CDN — no local storage needed.
    if (prompt) {
      const pollinationsUrl = buildPollinationsUrl(prompt);
      console.log(`[AI-Image] Using Pollinations direct URL (R2 not available): ${pollinationsUrl.slice(0, 80)}...`);
      return pollinationsUrl;
    }

    // Fallback: /tmp path only when we don't have a prompt (shouldn't happen in V5)
    const localPath = `/api/infographic-image?path=${filename}`;
    console.log(`[AI-Image] Using /tmp path (no prompt available): ${localPath}`);
    return localPath;
  } catch (err: any) {
    console.error(`[AI-Image] persistImage failed: ${err.message?.slice(0, 120)}`);
    // V5: Try Pollinations URL as last resort
    if (prompt) {
      return buildPollinationsUrl(prompt);
    }
    return `/api/infographic-image?path=${filename}`;
  }
}

// ─── Pollinations URL Builder ──────────────────────────────
// V5: Build a direct Pollinations AI image URL.
// These URLs are deterministic — same prompt + seed = same image.
// The image is generated on-demand by the Pollinations CDN.
// Re-export from the client-safe utils module to avoid duplication.

export { buildPollinationsUrl } from './image-gen-utils';

// ─── Parallel concurrency limiter ──────────────────────────
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await tasks[currentIndex]();
      } catch (err: any) {
        results[currentIndex] = null as any;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Check if an image URL is valid and accessible ──────────
// V5 GOLDEN RULE: Pollinations URLs ARE valid image URLs.
// V6 FIX: /api/infographic-image URLs are ALWAYS invalid — they depend on
// ephemeral /tmp storage which gets wiped on every Railway redeployment.
// Even if the file exists NOW, it will be gone after redeployment.
// Only R2 URLs and Pollinations URLs are persistent and reliable.
// Client-safe version is in image-gen-utils.ts
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // R2 URLs are always valid (persistent CDN)
  if (url.includes('.r2.dev/') || url.includes('cloudflarestorage.com')) return true;
  // V5: Pollinations on-demand URLs are ALWAYS valid
  if (url.includes('pollinations.ai')) return true;
  // V6: /tmp URLs are ALWAYS invalid — ephemeral storage, wiped on redeployment
  // Even if the file exists on /tmp right now, it won't survive a redeployment.
  // These must be replaced with Pollinations or R2 URLs.
  if (url.startsWith('/api/infographic-image?path=')) {
    return false;
  }
  // HTTPS URLs are assumed valid
  if (url.startsWith('https://')) return true;
  return false;
}

// ─── Check if a URL is a Pollinations URL ────────────────
// Re-export from client-safe utils to avoid duplication
export { isPollinationsUrl } from './image-gen-utils';

// ─── Fix a broken/missing image URL by regenerating via Pollinations ──
export async function fixImageUrl(
  currentUrl: string | null | undefined,
  prompt: string,
  options: { width?: number; height?: number } = {}
): Promise<{ success: boolean; imageUrl: string | null; imageSource: 'pollinations' | 'r2' | 'none'; error?: string }> {
  // If current URL is valid, no fix needed
  if (isValidImageUrl(currentUrl)) {
    return {
      success: true,
      imageUrl: currentUrl!,
      imageSource: isPollinationsUrl(currentUrl) ? 'pollinations' : 'r2',
    };
  }

  // Regenerate via Pollinations direct URL
  try {
    const pollinationsUrl = buildPollinationsUrl(prompt, options);
    return {
      success: true,
      imageUrl: pollinationsUrl,
      imageSource: 'pollinations',
    };
  } catch (error: any) {
    return {
      success: false,
      imageUrl: null,
      imageSource: 'none',
      error: `Image fix failed: ${error.message}`,
    };
  }
}

// ─── Generate images for all slides in an infographic ─────
export async function generateSlideImages(
  slides: any[],
  category?: string
): Promise<void> {
  const context = getSectorContext(category);
  const dir = ensureDir();

  // Identify slides that need images (missing or broken)
  const slidesToGenerate: { slide: any; index: number; template: (context: string, customPrompt?: string) => string }[] = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const position = slide.image_position ?? slide.content?.image_position;
    if (position === null || position === undefined || slide.type === 'recommendations' || slide.type === 'summary') {
      continue;
    }

    // Check if existing URL is valid
    const existingUrl = slide.image_url || slide.content?.image_url;
    if (existingUrl && isValidImageUrl(existingUrl)) {
      continue;
    }

    const template = SLIDE_PROMPT_TEMPLATES[slide.type];
    if (!template) continue;

    slidesToGenerate.push({ slide, index: i, template });
  }

  if (slidesToGenerate.length === 0) {
    console.log(`[AI-Image] All slides have valid images — nothing to generate`);
    return;
  }

  console.log(`[AI-Image] Starting parallel generation of ${slidesToGenerate.length} images (sector: ${context})`);

  const tasks = slidesToGenerate.map(({ slide, index, template }) => async () => {
    const customPrompt = slide.image_prompt || slide.content?.image_prompt;
    const prompt = template(context, customPrompt);
    const slideId = `${slide.type}-${slide.number || index + 1}-${Math.random().toString(36).slice(2, 6)}`;
    const filename = `slide-${slideId}.png`;
    const outputPath = path.join(dir, filename);
    const slideIdentifier = `slide ${slide.number || index + 1} (${slide.type})`;

    console.log(`[AI-Image] [START] ${slideIdentifier}`);
    const startTime = Date.now();

    const buffer = await generateImage(prompt, outputPath);

    if (buffer) {
      const publicPath = await persistImage(outputPath, slideId, prompt);
      slide.image_url = publicPath;
      if (slide.content) slide.content.image_url = publicPath;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[AI-Image] [DONE] ${slideIdentifier} in ${elapsed}s → ${publicPath.slice(0, 60)}`);
    } else {
      // V5: Even if all generation methods fail, use Pollinations direct URL as fallback
      const pollinationsUrl = buildPollinationsUrl(prompt);
      slide.image_url = pollinationsUrl;
      if (slide.content) slide.content.image_url = pollinationsUrl;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.warn(`[AI-Image] [FALLBACK] ${slideIdentifier} after ${elapsed}s → Pollinations direct URL`);
    }
  });

  // Run with max 2 concurrent image generations
  await runWithConcurrency(tasks, 2);

  const generated = slidesToGenerate.filter(({ slide }) =>
    slide.image_url || slide.content?.image_url
  ).length;
  const failed = slidesToGenerate.length - generated;
  console.log(`[AI-Image] Complete: ${generated} generated, ${failed} failed (sector: ${context})`);
}

// ─── Regenerate a single slide image ──────────────────────
export async function regenerateSlideImage(
  slide: any,
  category?: string
): Promise<string | null> {
  const context = getSectorContext(category);
  const template = SLIDE_PROMPT_TEMPLATES[slide.type];
  if (!template) return null;

  const dir = ensureDir();
  const customPrompt = slide.image_prompt || slide.content?.image_prompt;
  const prompt = template(context, customPrompt);
  const slideId = `${slide.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const filename = `slide-${slideId}.png`;
  const outputPath = path.join(dir, filename);
  const slideIdentifier = `slide ${slide.number || '?'} (${slide.type})`;

  const buffer = await generateImage(prompt, outputPath);

  if (buffer) {
    const publicPath = await persistImage(outputPath, slideId, prompt);
    slide.image_url = publicPath;
    if (slide.content) slide.content.image_url = publicPath;
    return publicPath;
  }

  // V5: Fallback to Pollinations direct URL if all generation methods fail
  const pollinationsUrl = buildPollinationsUrl(prompt);
  slide.image_url = pollinationsUrl;
  if (slide.content) slide.content.image_url = pollinationsUrl;
  console.warn(`[AI-Image] ✗ Regeneration failed for ${slideIdentifier} — using Pollinations direct URL`);
  return pollinationsUrl;
}

// ─── Video Background Image Generation (V7) ─────────────────
// Uses the SAME pipeline as infographic slides (5-provider fallback chain):
//   Cloudflare AI SDXL → Gemini Flash → Prodia → Pollinations → z-ai SDK → CLI
// This ensures video background images match infographic quality.
// Generated images are passed to video-renderer-*.mjs as base64 strings
// in the `pre_generated_images` field of the video data JSON.
//
// V8: Expanded from 3 to 10 scene prompt templates — one per paragraph type.
// Each renderer uses up to NUM_SCENES images (gold=9, pulse=6, dataviz=6),
// so 10 ensures every paragraph gets a unique contextual image.

// V10.1: Rewrote prompts to use the ACTUAL report title, not just generic sector context.
// Previous prompts used ${ctx} (e.g. "oil energy") which gave generic images unrelated
// to the specific report. Now each prompt includes the report title for relevance.
const VIDEO_SCENE_PROMPT_TEMPLATES: ((title: string, ctx: string) => string)[] = [
  // 1. Hook — opening scene related to the report topic
  (title, ctx) => `Cinematic financial news scene about "${title.slice(0, 80)}", ${ctx} themed, dramatic lighting with modern skyscrapers at dusk, glowing stock chart projections in golden light, deep blue gradient, Bloomberg-style aesthetic, high contrast, ultra detailed, 8k, no text, photorealistic`,
  // 2. Context — market reaction to the topic
  (title, ctx) => `Dramatic trading floor scene about "${title.slice(0, 80)}", ${ctx} industry, red and green glowing screens showing market data, trader silhouettes, intense atmosphere, cinematic lighting, ultra detailed, 8k, no text, photorealistic`,
  // 3. Data — charts and metrics related to the topic
  (title, ctx) => `Modern financial data visualization about "${title.slice(0, 80)}", ${ctx} themed holographic charts and graphs, glowing candlestick projections, futuristic UI, deep blue with cyan accents, ultra detailed, 8k, no text, photorealistic`,
  // 4. Causes — analysis scene
  (title, ctx) => `Abstract analysis visualization for "${title.slice(0, 80)}", ${ctx} themed interconnected glowing nodes and data flow lines, network diagram, dark navy with gold highlights, glassmorphism, ultra detailed, 8k, no text, photorealistic`,
  // 5. Assets — bull vs bear
  (title, ctx) => `Financial assets impact scene about "${title.slice(0, 80)}", ${ctx} themed golden bull statue and bronze bear statue, dramatic spotlight, dark marble floor, smoke effects, cinematic, ultra detailed, 8k, no text, photorealistic`,
  // 6. Scenarios — decision paths
  (title, ctx) => `Scenario planning visualization for "${title.slice(0, 80)}", ${ctx} themed branching decision tree with glowing paths, holographic projection in dark room, golden light streams, ultra detailed, 8k, no text, photorealistic`,
  // 7. Recommendations — strategy room
  (title, ctx) => `Executive strategy briefing about "${title.slice(0, 80)}", ${ctx} themed conference table with holographic projections, city skyline at night through windows, warm golden lighting, ultra detailed, 8k, no text, photorealistic`,
  // 8. Watch — monitoring center
  (title, ctx) => `Financial monitoring center for "${title.slice(0, 80)}", ${ctx} themed radar screens and real-time data feeds, glowing calendar with marked dates, cyan and gold lighting, ultra detailed, 8k, no text, photorealistic`,
  // 9. Closing — studio
  (title, ctx) => `Elegant financial news closing about "${title.slice(0, 80)}", ${ctx} themed modern studio with golden bokeh lights, dark navy gradient, corporate branding aesthetic, ultra detailed, 8k, no text, photorealistic`,
  // 10. Brand — outro
  (title, ctx) => `Sophisticated financial brand background, ${ctx} themed soft golden bokeh, dark navy gradient, elegant minimalist composition, ultra detailed, 8k, no text, photorealistic`,
];

export interface VideoImageData {
  title?: string;
  category?: string;
  reportType?: string;
  locale?: string;
}

/**
 * Generate background images for video reports using the SAME pipeline
 * as infographic slides. Returns base64-encoded image strings.
 *
 * V8: Default count is 10 — one image per paragraph type.
 * Each renderer uses up to NUM_SCENES images (gold=9, pulse=6, dataviz=6).
 *
 * V9.2: Default count reduced from 10 to 6 — covers 6 scenes (gold has 9, but 6 unique
 * backgrounds + 3 reuses is acceptable). Generation now PARALLEL (concurrency=3) instead
 * of sequential — cuts wall-clock time by ~60%.
 *
 * @param data Video data containing title and category
 * @param count Number of images to generate (default: 6)
 * @returns Array of base64-encoded image strings (may be shorter than count if some fail)
 */
export async function generateImagesForVideo(
  data: VideoImageData,
  count: number = 6
): Promise<string[]> {
  const context = getSectorContext(data.category);
  const dir = ensureDir();
  const title = (data.title || 'financial report').replace(/"/g, '');

  console.log(`[AI-Image][Video] Generating ${count} background images in PARALLEL (concurrency=3, sector: ${context})`);
  const overallStart = Date.now();

  // Build all tasks upfront
  const tasks: (() => Promise<string | null>)[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i;
    const template = VIDEO_SCENE_PROMPT_TEMPLATES[idx % VIDEO_SCENE_PROMPT_TEMPLATES.length];
    const prompt = template(title, context);
    const imgId = `video-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${imgId}.png`;
    const outputPath = path.join(dir, filename);

    tasks.push(async () => {
      const startTime = Date.now();
      const buffer = await generateImage(prompt, outputPath);

      // Clean up temp file (we only need the base64 string)
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch {}

      if (buffer && buffer.length > 1000) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[AI-Image][Video] ✓ Image ${idx + 1}/${count} generated in ${elapsed}s (${(buffer.length / 1024).toFixed(0)}KB)`);
        return buffer.toString('base64');
      } else {
        console.warn(`[AI-Image][Video] ✗ Image ${idx + 1}/${count} failed after ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        return null;
      }
    });
  }

  // Run with concurrency=3 (uses existing runWithConcurrency helper)
  const rawResults = await runWithConcurrency(tasks, 3);
  const results = rawResults.filter((r): r is string => r !== null);

  const elapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
  console.log(`[AI-Image][Video] Complete: ${results.length}/${count} images in ${elapsed}s (parallel)`);
  return results;
}
