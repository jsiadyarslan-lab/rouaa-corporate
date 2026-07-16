// ═══════════════════════════════════════════════════════════════
// Slug Generator (Arabic-aware)
// ═══════════════════════════════════════════════════════════════
// Generates URL-friendly slugs from Arabic titles.
// Arabic chars are preserved (UTF-8 slugs) for SEO.
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a slug from a title (Arabic or English).
 * - Removes punctuation except hyphens
 * - Replaces spaces with hyphens
 * - Preserves Arabic characters
 * - Lowercase
 * - Truncates to 150 chars
 */
export function generateSlug(title: string): string {
  if (!title || !title.trim()) return 'article';

  return title
    .trim()
    .toLowerCase()
    // Remove quotes, parentheses, brackets
    .replace(/["'""'']+/g, '')
    .replace(/[()[\]{}]+/g, '')
    // Remove most punctuation except Arabic, hyphens, spaces
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
    // Replace whitespace with single hyphen
    .replace(/\s+/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Truncate
    .slice(0, 150);
}
