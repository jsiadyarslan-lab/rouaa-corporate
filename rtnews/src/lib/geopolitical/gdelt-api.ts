// ─── GDELT DOC 2.0 API Integration for News Sentiment Analysis ──
// API docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts
// No API key required — free and open

const GDELT_BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

export interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

export interface GdeltToneResult {
  avgTone: number;        // -10 to +10
  articleCount: number;
  positiveCount: number;
  negativeCount: number;
}

/**
 * Fetch articles from the GDELT DOC 2.0 API.
 *
 * @param query - Search query (supports GDELT operators like AND, OR, near, etc.)
 * @param params - Optional parameters
 * @param params.maxRecords - Maximum number of records (default: 75, max: 250)
 * @param params.startDateTime - Start date/time in YYYYMMDDHHMMSS format
 * @param params.endDateTime - End date/time in YYYYMMDDHHMMSS format
 * @param params.language - Filter by language code (e.g., 'ara', 'eng', 'fra')
 * @returns Array of GDELT articles
 */
export async function fetchGdeltArticles(
  query: string,
  params?: {
    maxRecords?: number;
    startDateTime?: string;
    endDateTime?: string;
    language?: string;
  }
): Promise<GdeltArticle[]> {
  const maxRecords = Math.min(params?.maxRecords || 75, 250);

  const searchParams = new URLSearchParams({
    query: query,
    format: 'json',
    maxrecords: String(maxRecords),
    mode: 'ArtList',
    sort: 'DateDesc',
  });

  // Add optional time range filters
  if (params?.startDateTime) {
    searchParams.set('STARTDATETIME', params.startDateTime);
  }
  if (params?.endDateTime) {
    searchParams.set('ENDDATETIME', params.endDateTime);
  }

  // Add language filter if specified
  // GDELT uses 3-letter language codes (ara, eng, fra, etc.)
  let effectiveQuery = query;
  if (params?.language) {
    effectiveQuery = `${query} sourcelang:${params.language}`;
    searchParams.set('query', effectiveQuery);
  }

  const url = `${GDELT_BASE_URL}?${searchParams.toString()}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 }, // Cache for 30 minutes (Next.js fetch extension)
    } as any);

    if (!response.ok) {
      throw new Error(`GDELT API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('[GDELT] No articles found for query:', query.slice(0, 50));
      return [];
    }

    const articles: GdeltArticle[] = data.articles.map((raw: Record<string, string>) => ({
      url: raw.url || '',
      title: raw.title || '',
      seendate: raw.seendate || '',
      socialimage: raw.socialimage || '',
      domain: raw.domain || '',
      language: raw.language || '',
      sourcecountry: raw.sourcecountry || '',
    }));

    console.log(`[GDELT] Fetched ${articles.length} articles for query="${query.slice(0, 40)}"`);
    return articles;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GDELT] Fetch error: ${message}`);
    return [];
  }
}

/**
 * Get aggregated tone/sentiment analysis for a given query from GDELT.
 * Uses GDELT's tone calculation mode which returns aggregate statistics.
 *
 * @param query - Search query (supports GDELT operators)
 * @param days - Number of days to look back (default: 7)
 * @returns Tone result with average tone, article counts, and sentiment breakdown
 */
export async function getGdeltTone(
  query: string,
  days: number = 7
): Promise<GdeltToneResult> {
  // Default result for error cases
  const defaultResult: GdeltToneResult = {
    avgTone: 0,
    articleCount: 0,
    positiveCount: 0,
    negativeCount: 0,
  };

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateTime = formatGdeltDate(startDate);
  const endDateTime = formatGdeltDate(endDate);

  const searchParams = new URLSearchParams({
    query: query,
    format: 'json',
    mode: 'ToneChart',
    STARTDATETIME: startDateTime,
    ENDDATETIME: endDateTime,
  });

  const url = `${GDELT_BASE_URL}?${searchParams.toString()}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 }, // Next.js fetch extension
    } as any);

    if (!response.ok) {
      throw new Error(`GDELT Tone API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.tone || !Array.isArray(data.tone)) {
      // Fallback: try ArtList mode and compute tone from articles
      return computeToneFromArticles(query, days);
    }

    // GDELT tone chart returns time-series data with tone values
    // Each entry is [date, toneValue]
    const toneData: number[] = data.tone
      .map((entry: [string, number]) => entry[1])
      .filter((t: number) => typeof t === 'number' && !isNaN(t));

    if (toneData.length === 0) {
      return computeToneFromArticles(query, days);
    }

    // Calculate average tone
    const avgTone = toneData.reduce((sum, t) => sum + t, 0) / toneData.length;

    // GDELT tone > 0 is positive, < 0 is negative
    // Scale from the raw GDELT tone range (typically -10 to +10, but often -5 to +5 in practice)
    const positiveCount = toneData.filter((t) => t > 0).length;
    const negativeCount = toneData.filter((t) => t < 0).length;

    return {
      avgTone: Math.round(avgTone * 100) / 100,
      articleCount: toneData.length,
      positiveCount,
      negativeCount,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GDELT] Tone error: ${message}`);
    return defaultResult;
  }
}

/**
 * Compute tone from individual articles as a fallback.
 * Fetches articles and estimates sentiment from GDELT's V2 tone field.
 */
async function computeToneFromArticles(
  query: string,
  days: number
): Promise<GdeltToneResult> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const articles = await fetchGdeltArticles(query, {
    maxRecords: 250,
    startDateTime: formatGdeltDate(startDate),
    endDateTime: formatGdeltDate(new Date()),
  });

  if (articles.length === 0) {
    return { avgTone: 0, articleCount: 0, positiveCount: 0, negativeCount: 0 };
  }

  // Without per-article tone data, we use a heuristic based on title keywords
  // This is a rough approximation — the GDELT API tone chart is preferred
  const negativeKeywords = [
    'war', 'conflict', 'attack', 'crisis', 'threat', 'sanctions',
    'violence', 'death', 'kill', 'destroy', 'crash', 'collapse',
    'حرب', 'صراع', 'هجوم', 'أزمة', 'تهديد', 'عقوبات',
  ];

  const positiveKeywords = [
    'peace', 'agreement', 'deal', 'growth', 'recovery', 'stability',
    'progress', 'cooperation', 'success', 'calm',
    'سلام', 'اتفاق', 'صفقة', 'نمو', 'تعافي', 'استقرار',
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const article of articles) {
    const titleLower = article.title.toLowerCase();
    const hasNegative = negativeKeywords.some((kw) => titleLower.includes(kw));
    const hasPositive = positiveKeywords.some((kw) => titleLower.includes(kw));

    if (hasNegative && !hasPositive) {
      negativeCount++;
    } else if (hasPositive && !hasNegative) {
      positiveCount++;
    }
  }

  // Estimate average tone based on sentiment ratio
  // Scale: -10 (all negative) to +10 (all positive)
  const neutralCount = articles.length - positiveCount - negativeCount;
  const sentimentScore =
    articles.length > 0
      ? ((positiveCount - negativeCount) / articles.length) * 10
      : 0;

  return {
    avgTone: Math.round(sentimentScore * 100) / 100,
    articleCount: articles.length,
    positiveCount,
    negativeCount,
  };
}

/**
 * Format a Date object to GDELT's required YYYYMMDDHHMMSS format.
 */
function formatGdeltDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}000000`;
}
