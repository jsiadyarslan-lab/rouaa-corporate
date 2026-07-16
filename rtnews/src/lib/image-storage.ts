// ─── Image Storage Service V97 ──────────────────────────────
// Uploads AI-generated images to Cloudflare R2 (S3-compatible).
// R2 provides: 10GB free storage, free egress, persistent URLs.
// This replaces both:
//   - base64 in DB (V96 fallback — caused DB bloat with ~100KB per image)
//   - filesystem paths (V44 — lost on Railway redeployment)
//
// Environment variables needed:
//   R2_ACCOUNT_ID       — Cloudflare account ID
//   R2_ACCESS_KEY_ID    — R2 API token access key
//   R2_SECRET_ACCESS_KEY — R2 API token secret key
//   R2_BUCKET_NAME      — R2 bucket name (e.g., "roua-images")
//   R2_PUBLIC_URL       — Public URL for the bucket (e.g., "https://images.roua.news" or R2 dev URL)
//
// FALLBACK: If R2 is not configured, falls back to base64 in DB (V96 behavior).

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Config, getR2Client, isR2Url as sharedIsR2Url } from './r2-client';

// V230: Per-key failure tracking instead of global flag.
// The global r2LastCheckFailed blocked ALL uploads for 30 seconds after ONE failure.
// Now we track consecutive failures — only block if 3+ in a row (likely auth/network issue).
let r2ConsecutiveFailures = 0;
let r2GlobalBlockUntil = 0; // Timestamp: only block ALL uploads if 3+ consecutive failures

export interface ImageUploadResult {
  success: boolean;
  url: string;          // The URL/path to store in DB (R2 URL or base64 fallback)
  storageType: 'r2' | 'filesystem' | 'base64';
  sizeBytes: number;
  error?: string;
}

// Upload image buffer to R2 and return the public URL
export async function uploadImageToR2(
  articleId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<ImageUploadResult> {
  const config = getR2Config();
  const client = getR2Client();
  
  // If R2 is not configured, return failure (caller should fall back)
  if (!config || !client) {
    return { 
      success: false, 
      url: '', 
      storageType: 'base64', 
      sizeBytes: imageBuffer.length,
      error: 'R2 not configured' 
    };
  }
  
  // V230: Only block ALL uploads if 3+ consecutive failures (likely systemic issue).
  // A single failure should NOT block other uploads.
  if (r2ConsecutiveFailures >= 3 && Date.now() < r2GlobalBlockUntil) {
    return { 
      success: false, 
      url: '', 
      storageType: 'base64', 
      sizeBytes: imageBuffer.length,
      error: `R2 blocked (${r2ConsecutiveFailures} consecutive failures, retry after ${Math.round((r2GlobalBlockUntil - Date.now()) / 1000)}s)` 
    };
  }
  
  const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
  const key = `article-images/${articleId}.${ext}`;
  
  // V240: R2 upload with retry (2 attempts with exponential backoff)
  // A single network blip should not cause us to fall back to filesystem/base64.
  const MAX_R2_RETRIES = 2;
  let lastR2Error: any = null;

  for (let attempt = 1; attempt <= MAX_R2_RETRIES; attempt++) {
    try {
      await client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000', // 1 year — images are immutable
      }));
      
      // Build the public URL
      if (!config.publicUrl) {
        // R2_PUBLIC_URL is REQUIRED — without it, uploaded images are unreachable.
        // Don't store a broken URL in the DB. Fall back to filesystem/base64 instead.
        console.warn(`[ImageStorage V97] R2 upload succeeded but R2_PUBLIC_URL not set — image would be unreachable. Falling back to filesystem/base64.`);
        return {
          success: false,
          url: '',
          storageType: 'filesystem',
          sizeBytes: imageBuffer.length,
          error: 'R2_PUBLIC_URL not configured — cannot generate public URL',
        };
      }
      // Custom domain: https://images.roua.news/article-images/xxx.png
      // Or R2 dev URL: https://pub-xxx.r2.dev/article-images/xxx.png
      const publicUrl = `${config.publicUrl.replace(/\/$/, '')}/${key}`;
      
      // V230: Reset consecutive failure counter on success
      r2ConsecutiveFailures = 0;
      r2GlobalBlockUntil = 0;
      
      return {
        success: true,
        url: publicUrl,
        storageType: 'r2',
        sizeBytes: imageBuffer.length,
      };
    } catch (err: any) {
      lastR2Error = err;
      if (attempt < MAX_R2_RETRIES) {
        // Exponential backoff: 1s, then 2s
        const delay = 1000 * attempt;
        console.warn(`[ImageStorage V240] R2 upload attempt ${attempt} failed for ${articleId}: ${err.message} — retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // All retries exhausted
  // V230: Track consecutive failures — only block after 3+ in a row
  r2ConsecutiveFailures++;
  if (r2ConsecutiveFailures >= 3) {
    // Block for 30 seconds after 3+ consecutive failures (systemic issue likely)
    r2GlobalBlockUntil = Date.now() + 30 * 1000;
  }
  // A single success will reset the counter, so intermittent failures don't cause blocking
  console.error(`[ImageStorage V240] R2 upload failed after ${MAX_R2_RETRIES} attempts for ${articleId} (${r2ConsecutiveFailures} consecutive): ${lastR2Error.message}`);
  return {
    success: false,
    url: '',
    storageType: 'base64',
    sizeBytes: imageBuffer.length,
    error: lastR2Error.message,
  };
}

// Re-export isR2Url using the shared implementation from r2-client.ts
export function isR2Url(url: string): boolean {
  return sharedIsR2Url(url);
}

// Check if R2 is configured and available
export function isR2Available(): boolean {
  return !!getR2Config() && !(r2ConsecutiveFailures >= 3 && Date.now() < r2GlobalBlockUntil);
}

// V235: Check if a generatedImage value is an SVG placeholder (NOT a real image).
// SVG placeholders are generated by the imager when ALL real image methods fail.
// They should NEVER be accepted for publishing — articles need real JPEG/PNG/WebP.
// Detects: data:image/svg+xml base64 URLs, SVG MIME type strings, and .svg file paths
export function isSvgPlaceholderImage(generatedImage: string | null | undefined): boolean {
  if (!generatedImage) return false;
  return generatedImage.includes('data:image/svg+xml')
    || generatedImage.includes('image/svg+xml')
    || generatedImage.endsWith('.svg')
    || /\.svg\b/.test(generatedImage);
}
