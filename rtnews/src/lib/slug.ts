// ─── Slug Generator for Arabic & English URLs ───────────────────────

/**
 * Generate a short random suffix (4 chars) to reduce slug collisions.
 * Uses alphanumeric characters for URL safety.
 */
function randomSlugSuffix(length: number = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a URL-friendly slug from text (Arabic or English)
 * Converts text to URL-safe format for SEO
 * Includes a random 4-char suffix to reduce collisions within the same locale.
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  let clean = text;

  // Remove "العنوان:" prefix that sometimes appears in bad translations
  clean = clean.replace(/^العنوان:\s*/i, '');
  clean = clean.replace(/^Title:\s*/i, '');

  // Replace common Unicode punctuation with ASCII equivalents BEFORE stripping
  clean = clean
    .replace(/[\u2018\u2019\u201A\u201B`]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[']/g, '');

  // Remove Arabic punctuation (comma, question mark, semicolon, etc.)
  // Arabic Unicode block \u0600-\u06FF contains both letters AND punctuation
  // We need to remove punctuation but keep letters
  clean = clean
    .replace(/[\u060C]/g, '')   // Arabic comma ،
    .replace(/[\u061B]/g, '')   // Arabic semicolon ؋
    .replace(/[\u061A]/g, '')   // Arabic question mark ؟
    .replace(/[\u060E-\u061A]/g, '') // Various Arabic punctuation
    .replace(/[\u0660-\u0669]/g, (m) => { // Arabic-Indic digits → ASCII digits
      const digitMap: Record<string, string> = {
        '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3',
        '\u0664': '4', '\u0665': '5', '\u0666': '6', '\u0667': '7',
        '\u0668': '8', '\u0669': '9',
      };
      return digitMap[m] || '';
    });

  // Remove diacritics (tashkeel) from Arabic
  clean = clean
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0640]/g, '');

  // NFD normalization for French/European accented characters
  // Decomposes é → e +  ́, then strips the combining marks
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Convert to lowercase for English
  clean = clean.toLowerCase();

  // Keep only alphanumeric, Arabic letters, and spaces
  // Arabic letters: \u0621-\u063A (isolated/forms) + \u0641-\u064A (letters)
  // Also keep ASCII digits and hyphens
  clean = clean.replace(/[^a-z0-9\u0621-\u063A\u0641-\u064A\s-]/g, '');

  // Replace spaces and underscores with hyphens
  clean = clean.replace(/[\s_]+/g, '-');

  // Remove consecutive hyphens
  clean = clean.replace(/-+/g, '-');

  // Remove hyphens at start/end
  clean = clean.replace(/^-+|-+$/g, '');

  // Limit length (max 100 chars)
  if (clean.length > 100) {
    clean = clean.slice(0, 100).replace(/-+$/g, '');
  }

  // If result is empty, use fallback
  if (!clean) {
    return `news-${Date.now()}-${randomSlugSuffix()}`;
  }

  // Add random suffix to reduce collisions within the same locale
  return `${clean}-${randomSlugSuffix()}`;
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
