// ─── Client-Safe Image URL Utilities ────────────────────────
// This module is safe to import from Client Components.
// It contains NO Node.js-only imports (no fs, path, child_process).
// Server-only code stays in image-gen.ts

// ─── Pollinations URL Builder ──────────────────────────────
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

export function buildPollinationsUrl(prompt: string, options: { width?: number; height?: number; seed?: number } = {}): string {
  const { width = 1344, height = 768, seed = 42 } = options;
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 300));
  return `${POLLINATIONS_BASE}/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

// ─── Check if an image URL is valid and accessible ──────────
// V5 GOLDEN RULE: Pollinations URLs ARE valid image URLs.
// Client-safe version: no fs.existsSync check (can't access filesystem from browser).
// /tmp URLs are treated as INVALID in client context since they require server-side file serving.
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // R2 URLs are always valid (persistent CDN)
  if (url.includes('.r2.dev/') || url.includes('cloudflarestorage.com')) return true;
  // V5: Pollinations on-demand URLs are ALWAYS valid
  if (url.includes('pollinations.ai')) return true;
  // /tmp URLs are NOT valid in client context (server-only file serving)
  if (url.startsWith('/api/infographic-image?path=')) {
    return false;
  }
  // HTTPS URLs are assumed valid
  if (url.startsWith('https://')) return true;
  return false;
}

// ─── Check if a URL is a Pollinations URL ────────────────
export function isPollinationsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === 'image.pollinations.ai';
  } catch {
    return url.includes('pollinations.ai');
  }
}
