#!/usr/bin/env node
// Image generator using z-ai SDK (primary) + Pollinations (fallback)
// z-ai produces much higher quality cinematic images than Pollinations

import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

let _zaiInstance = null;
async function getZAI() {
  if (!_zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    _zaiInstance = await ZAI.create();
  }
  return _zaiInstance;
}

// Method 1: z-ai SDK (primary) — best quality, with retry+backoff for rate limits
async function generateImageZAI(prompt, sizeStr = '1344x768', maxRetries = 3) {
  const zai = await getZAI();
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await zai.images.generations.create({
        prompt: prompt.slice(0, 1500),
        size: sizeStr,
      });
      const base64 = response.data?.[0]?.base64;
      if (base64) {
        const buf = Buffer.from(base64, 'base64');
        // Accept any image > 2KB (z-ai sometimes returns small placeholder images)
        if (buf.length > 2000) return buf;
        console.log(`  [ImageGen] z-ai returned small image (${buf.length} bytes), retrying...`);
      }
      // Empty or small response — try once more
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 3000 * attempt));
        continue;
      }
    } catch (e) {
      const msg = e.message || '';
      // 429 = rate limited → wait longer and retry
      if (msg.includes('429') || msg.includes('Too many requests')) {
        if (attempt < maxRetries) {
          const wait = 8000 * attempt; // 8s, 16s, 24s
          console.log(`  [ImageGen] z-ai 429, waiting ${wait/1000}s (attempt ${attempt}/${maxRetries})`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
      }
      // Other errors — log and stop retrying
      console.log(`  [ImageGen] z-ai SDK: ${msg.slice(0, 80)}`);
      return null;
    }
  }
  return null;
}

// Method 2: Pollinations (fallback) — free, no key, but lower quality
async function generateImagePollinations(prompt, imgWidth = 1344, imgHeight = 768) {
  try {
    const sp = prompt.length > 300 ? prompt.substring(0, 297) + '...' : prompt;
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(sp)}?width=${imgWidth}&height=${imgHeight}&nologo=true&seed=${seed}&model=flux`;
    const { stdout } = await execFileAsync('curl', ['-s', '-o', '-', '--max-time', '60', '--connect-timeout', '10', url],
      { encoding: 'buffer', timeout: 70000, maxBuffer: 20 * 1024 * 1024 });
    if (stdout && stdout.length > 5000) return stdout;
  } catch (e) {
    console.log(`  [ImageGen] Pollinations: ${e.message?.slice(0, 60)}`);
  }
  return null;
}

export async function generateImage(prompt, format = 'landscape') {
  if (!prompt || prompt.length < 5) return null;
  
  // z-ai SDK supports specific sizes — use closest supported size
  // landscape: 1344x768, vertical: 768x1344, square: 1024x1024
  // If z-ai rejects vertical, it falls back to landscape which cover() handles
  const sizeMap = {
    landscape: '1344x768',
    vertical: '768x1344',
    square: '1024x1024',
  };
  const sizeStr = sizeMap[format] || sizeMap.landscape;
  
  // Pollinations dimensions (more flexible)
  const pollWidth = format === 'vertical' ? 768 : format === 'square' ? 1024 : 1344;
  const pollHeight = format === 'vertical' ? 1344 : format === 'square' ? 1024 : 768;

  // Try z-ai SDK first (best quality)
  console.log(`  [ImageGen] z-ai SDK (${sizeStr})...`);
  let buf = await generateImageZAI(prompt, sizeStr);
  if (buf) {
    console.log(`  [ImageGen] ✓ z-ai (${(buf.length / 1024).toFixed(0)}KB)`);
    return buf;
  }

  // Fallback: Pollinations
  console.log(`  [ImageGen] fallback → Pollinations (${pollWidth}x${pollHeight})...`);
  buf = await generateImagePollinations(prompt, pollWidth, pollHeight);
  if (buf) {
    console.log(`  [ImageGen] ✓ Pollinations (${(buf.length / 1024).toFixed(0)}KB)`);
    return buf;
  }

  console.error(`  [ImageGen] ✗ ALL FAILED`);
  return null;
}

// CLI test
if (import.meta.url === `file://${process.argv[1]}`) {
  import('fs').then(fs => {
    const prompt = process.argv[2] || 'A deep-sea mining robot\'s mechanical arm reaching toward manganese nodules on the dark ocean floor, extreme close-up shot, dramatic spotlight cutting through black water, tense atmosphere, photorealistic, 8k detail';
    console.log('Testing with prompt:', prompt);
    generateImage(prompt).then(buf => {
      if (buf) {
        fs.writeFileSync('/tmp/test-image.jpg', buf);
        console.log(`✓ Saved ${buf.length} bytes to /tmp/test-image.jpg`);
      } else {
        console.log('✗ Failed');
      }
    });
  });
}
