// ─── AI Image Fetcher V123 ─────────────────────────────────
// V123: Unsplash COMPLETELY REMOVED — only AI-generated images via Pollinations.ai
// This file is renamed conceptually: all Unsplash logic replaced with Pollinations.ai
// Every image on the platform is AI-generated, as per user requirement.

// ─── Pollinations.ai AI image generator ────────────
async function fetchPollinationsImage(
  query: string,
  width: number = 1080,
  height: number = 720
): Promise<{ url: string; attribution: string } | null> {
  try {
    // Pollinations.ai provides free AI-generated images - no API key needed
    const seed = query.replace(/\s+/g, '-').toLowerCase();
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(query + ', professional business photography, dark cinematic')}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    // Pollinations generates on-the-fly — use URL directly
    console.log(`[Images] ✓ Using Pollinations.ai AI-generated image for: "${query}"`);
    return {
      url,
      attribution: '🎨 AI Generated',
    };
  } catch (err: any) {
    console.warn(`[Images] Pollinations failed for "${query}": ${err.message}`);
    return null;
  }
}

// ─── Sector → AI image prompt mapping ──────────────────────
export const SECTOR_QUERIES: Record<string, string[]> = {
  'طاقة': ['oil refinery night industrial', 'petroleum industry dark'],
  'نفط': ['oil refinery night industrial', 'petroleum industry dark'],
  'غاز': ['natural gas plant industrial', 'energy industry night'],
  'ذهب': ['gold bars dark luxury', 'precious metals vault'],
  'سلع': ['commodity trading floor', 'gold bars dark luxury'],
  'اقتصاد': ['financial district night skyline', 'economy global'],
  'أسهم': ['stock market trading floor', 'wall street night'],
  'بورصة': ['stock market trading floor', 'wall street night'],
  'عملات': ['currency exchange forex', 'forex trading charts'],
  'فوركس': ['currency exchange forex', 'forex trading charts'],
  'تقنية': ['server room blue lights', 'data center technology'],
  'تكنولوجيا': ['server room blue lights', 'data center technology'],
  'بنوك': ['bank vault luxury', 'financial district night'],
  'عقارات': ['city skyline night architecture', 'modern buildings'],
  'سياسة': ['world map dark geopolitical', 'global politics'],
  'حروب': ['military technology dark', 'defense systems'],
  'دفاع': ['military technology dark', 'defense systems'],
  'تشفير': ['cryptocurrency bitcoin dark', 'blockchain technology digital'],
  'كريبتو': ['cryptocurrency bitcoin dark', 'blockchain technology digital'],
  'سياحة': ['luxury hotel night', 'tourism aerial city'],
  'زراعة': ['agriculture field sunset', 'harvest golden'],
  'صحة': ['pharmaceutical lab blue', 'medical research'],
  'سيارات': ['automotive factory modern', 'electric vehicle future'],
  'شحن': ['cargo ship night', 'shipping port industrial'],
  'تجارة': ['cargo ship night', 'shipping port industrial'],
};

// ─── Slide type → default image position ──────────────────
const SLIDE_TYPE_IMAGE_POSITION: Record<string, 'background-full' | 'right-30' | null> = {
  hero: 'background-full',
  story: 'right-30',
  data: 'right-30',
  scenarios: 'right-30',
  assets: 'right-30',
  recommendations: null,
  stat: 'right-30',
  comparison: 'right-30',
  timeline: 'right-30',
  list: 'right-30',
  chart: 'right-30',
  quote: 'background-full',
  summary: null,
};

// ─── Slide type → default AI image prompt ──
const DEFAULT_QUERIES: Record<string, string[]> = {
  hero: ['financial district night', 'business dark cinematic'],
  story: ['business meeting dark', 'negotiation professional'],
  data: ['stock market dark', 'trading floor night'],
  scenarios: ['crossroads decision dark', 'business decision making'],
  assets: ['bull bear market dark', 'wall street night'],
  recommendations: [],
  stat: ['stock market dark', 'finance data visualization'],
  comparison: ['business chart analytics dark', 'data comparison'],
  timeline: ['business timeline dark', 'progress modern'],
  list: ['business checklist dark', 'organization professional'],
  chart: ['stock chart dark', 'financial graph analysis'],
  quote: ['business leader keynote dark', 'professional portrait'],
  summary: [],
};

// ─── Derive AI prompt from category/sector ───────────
function deriveQueryFromCategory(category?: string): string | null {
  if (!category) return null;
  if (SECTOR_QUERIES[category]) {
    const queries = SECTOR_QUERIES[category];
    return queries[0]; // Use first (most relevant)
  }
  for (const [key, queries] of Object.entries(SECTOR_QUERIES)) {
    if (category.includes(key) || key.includes(category)) {
      return queries[0];
    }
  }
  return null;
}

// ─── Derive prompt for a slide using all available context ──
function deriveSlideQuery(slide: any, category?: string): string | null {
  const slideType = slide.type || '';
  if (slideType === 'recommendations' || slideType === 'summary') return null;

  const explicitQuery = slide.unsplash_query || slide.content?.unsplash_query;
  if (explicitQuery) return explicitQuery;

  const categoryQuery = deriveQueryFromCategory(category);
  if (categoryQuery) return categoryQuery;

  const tag = slide.content?.tag || slide.tag;
  if (tag) {
    const tagQuery = deriveQueryFromCategory(tag);
    if (tagQuery) return tagQuery;
  }

  const defaults = DEFAULT_QUERIES[slideType];
  if (defaults && defaults.length > 0) {
    return defaults[0];
  }

  return null;
}

// ─── Derive image position for a slide ────────────────────
function deriveImagePosition(slide: any): 'background-full' | 'right-30' | null {
  const explicitPos = slide.image_position ?? slide.content?.image_position;
  if (explicitPos !== undefined && explicitPos !== null) return explicitPos;
  return SLIDE_TYPE_IMAGE_POSITION[slide.type] ?? null;
}

// ─── Fetch AI-generated images for all slides ──
// V123: ALL images are AI-generated via Pollinations.ai — no Unsplash
export async function fetchSlideImages(
  slides: any[],
  category?: string
): Promise<void> {
  // Filter slides that need images
  const slidesNeedingImages = slides.filter(s => {
    if (s.image_url || s.content?.image_url) return false;
    const position = deriveImagePosition(s);
    return position != null;
  });

  if (slidesNeedingImages.length === 0) return;

  // Generate AI images for all slides needing them
  for (const s of slidesNeedingImages) {
    const query = deriveSlideQuery(s, category);
    const position = deriveImagePosition(s);
    if (!query || position == null) continue;

    const w = position === 'background-full' ? 1080 : 400;
    const h = position === 'background-full' ? 720 : 600;
    const result = await fetchPollinationsImage(query, w, h);
    if (result) {
      s.image_url = result.url;
      if (s.content) s.content.image_url = result.url;
    }

    // Small delay between requests to be respectful
    await new Promise(r => setTimeout(r, 200));
  }

  const fetched = slides.filter((s: any) => s.image_url || s.content?.image_url).length;
  console.log(`[Images] Pollinations.ai: ${fetched}/${slides.length} slides have AI-generated images`);
}

// ─── Backfill: Add missing query and image position fields ──
export function backfillSlideImageFields(slides: any[], category?: string): number {
  let backfilled = 0;

  slides.forEach((s: any) => {
    if (!s.content) s.content = {};

    if (s.type === 'recommendations' || s.type === 'summary') {
      s.image_position = null;
      if (!s.content.image_position) s.content.image_position = null;
      return;
    }

    const hasQuery = s.unsplash_query || s.content.unsplash_query;
    if (!hasQuery) {
      const query = deriveSlideQuery(s, category);
      if (query) {
        s.unsplash_query = query;
        s.content.unsplash_query = query;
        backfilled++;
      }
    }

    const hasPosition = (s.image_position !== undefined && s.image_position !== null)
      || (s.content.image_position !== undefined && s.content.image_position !== null);
    if (!hasPosition) {
      const position = deriveImagePosition(s);
      s.image_position = position;
      s.content.image_position = position;
      if (position) backfilled++;
    }

    if (s.image_overlay === undefined) {
      const overlay = s.type === 'hero' ? 0.40 : 0.45;
      s.image_overlay = overlay;
      s.content.image_overlay = overlay;
    }
  });

  return backfilled;
}
