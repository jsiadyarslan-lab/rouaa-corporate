// ─── Embeddings System ──────────────────────────────────────
// Generates text embeddings using AI provider for semantic search
// Pre-computed & cached embeddings in aiAnalysis JSON field
// No z-ai dependency — uses Groq/Gemini via ai-provider
//
// IMPROVEMENTS:
// - Batch embedding computation for multiple articles
// - Pre-computed embeddings stored in aiAnalysis._embedding
// - Single-pass similarity calculation (no per-article DB writes during search)
// - LRU cache with size tracking

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';

export interface EmbeddingVector {
  id: string;
  embedding: number[];
  text: string;
  metadata: {
    title: string;
    category: string;
    newsType: string;
    createdAt: string;
  };
}

// ─── In-memory LRU cache for embeddings (session-scoped) ─────
const embeddingCache = new Map<string, number[]>();
const EMBEDDING_CACHE_MAX = 1000;

function cacheSet(key: string, value: number[]): void {
  if (embeddingCache.size >= EMBEDDING_CACHE_MAX) {
    // Evict oldest 10% entries (batch eviction for efficiency)
    const keysToDelete = Array.from(embeddingCache.keys()).slice(0, Math.floor(EMBEDDING_CACHE_MAX * 0.1));
    for (const k of keysToDelete) embeddingCache.delete(k);
  }
  embeddingCache.set(key, value);
}

function cacheGet(key: string): number[] | undefined {
  return embeddingCache.get(key);
}

/**
 * Generate embedding for text using AI provider
 * Uses a clever approach: generate a compact representation via LLM
 * Then convert to a pseudo-embedding using character frequency analysis
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check in-memory cache first
  const cacheKey = text.slice(0, 200).toLowerCase().trim();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const result = await chatCompletion(
      [
        { role: 'system', content: 'Extract exactly 20 key financial concepts from this text. Return only a comma-separated list of concepts, nothing else. Use Arabic terms for Arabic text.' },
        { role: 'user', content: text.slice(0, 500) },
      ],
      { temperature: 0.1, maxTokens: 150 }
    );

    const concepts = result.content || '';
    const embedding = textToPseudoEmbedding(`${text.slice(0, 200)} ${concepts}`, 128);
    cacheSet(cacheKey, embedding);
    return embedding;
  } catch {
    // Fallback: use character-frequency based embedding
    const embedding = textToPseudoEmbedding(text, 128);
    cacheSet(cacheKey, embedding);
    return embedding;
  }
}

/**
 * Convert text to a deterministic pseudo-embedding vector
 * Uses character n-gram frequency analysis for semantic similarity
 */
function textToPseudoEmbedding(text: string, dimensions: number = 128): number[] {
  const normalized = text.toLowerCase().trim();
  const vector = new Array(dimensions).fill(0);

  // Character n-gram hashing
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= normalized.length - n; i++) {
      const ngram = normalized.slice(i, i + n);
      let hash = 0;
      for (let j = 0; j < ngram.length; j++) {
        hash = ((hash << 5) - hash) + ngram.charCodeAt(j);
        hash = hash & hash;
      }
      const idx = Math.abs(hash) % dimensions;
      vector[idx] += 1;
    }
  }

  // Word-level hashing for better semantics
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 7) - hash) + word.charCodeAt(i);
      hash = hash & hash;
    }
    const idx1 = Math.abs(hash) % dimensions;
    const idx2 = Math.abs(hash >> 8) % dimensions;
    vector[idx1] += 2;
    vector[idx2] += 1;
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Extract pre-computed embedding from aiAnalysis JSON
 * Returns null if no embedding is stored
 */
function extractStoredEmbedding(aiAnalysis: string | null): number[] | null {
  if (!aiAnalysis) return null;
  try {
    const parsed = JSON.parse(aiAnalysis);
    if (parsed._embedding && Array.isArray(parsed._embedding) && parsed._embedding.length === 128) {
      return parsed._embedding;
    }
  } catch {
    // Not valid JSON or no embedding
  }
  return null;
}

/**
 * Batch compute and persist embeddings for articles that lack them
 * Called periodically (e.g., after pipeline runs)
 */
export async function batchComputeEmbeddings(batchSize: number = 50): Promise<number> {
  try {
    // Find articles without embeddings in aiAnalysis
    const articles = await db.newsItem.findMany({
      where: {
        newsType: 'article',
        isReady: true,  // V38: Only complete articles
        // Articles where aiAnalysis doesn't contain _embedding
        // We can't query JSON directly in Prisma easily, so fetch and filter
      },
      select: { id: true, title: true, summary: true, aiAnalysis: true },
      take: batchSize,
      orderBy: { fetchedAt: 'desc' },
    });

    let computed = 0;
    const updatePromises: Promise<void>[] = [];

    for (const article of articles) {
      // Check if embedding already exists
      const stored = extractStoredEmbedding(article.aiAnalysis);
      if (stored) {
        // Cache it
        cacheSet(article.id, stored);
        continue;
      }

      // Compute embedding (no LLM call — use deterministic hash for speed)
      const text = `${article.title} ${article.summary}`;
      const embedding = textToPseudoEmbedding(text, 128);
      cacheSet(article.id, embedding);
      computed++;

      // Persist to aiAnalysis (merge with existing data)
      // CRITICAL SAFEGUARD: Never overwrite aiAnalysis if we can't parse the existing data.
      // If JSON.parse fails, it means the existing aiAnalysis is either raw text (Arabic)
      // or corrupted JSON. In either case, overwriting it would destroy the AI analysis
      // content that the article page displays. Instead, skip embedding persistence.
      updatePromises.push((async () => {
        try {
          let existingData: Record<string, unknown> = {};
          let parseSucceeded = false;
          if (article.aiAnalysis) {
            try {
              existingData = JSON.parse(article.aiAnalysis);
              parseSucceeded = true;
            } catch {
              // If aiAnalysis is not valid JSON, DON'T overwrite it — it might be
              // raw Arabic text or a corrupted but still-functional analysis string.
              // Overwriting would destroy the article's content.
              console.warn(`[Embeddings] Skipping embedding persist for ${article.id}: aiAnalysis is not valid JSON, refusing to overwrite`);
              return;
            }
          }
          existingData._embedding = embedding;
          existingData._embeddingVersion = 2;

          await db.newsItem.update({
            where: { id: article.id },
            data: { aiAnalysis: JSON.stringify(existingData) },
          });
        } catch (err: any) {
          console.warn(`[Embeddings] Failed to persist for ${article.id}: ${err.message}`);
        }
      })());
    }

    // Persist all in parallel
    await Promise.allSettled(updatePromises);

    if (computed > 0) {
      console.log(`[Embeddings] Batch computed ${computed} new embeddings`);
    }

    return computed;
  } catch (error: any) {
    console.error('[Embeddings] Batch compute error:', error.message);
    return 0;
  }
}

/**
 * Keyword-based fallback search when embeddings are unavailable
 */
function keywordSearch(
  query: string,
  articles: { id: string; title: string; titleAr?: string | null; summary: string; summaryAr?: string | null; category: string; slug?: string | null; sentiment?: string | null; impactLevel?: string | null; imageUrl?: string | null; fetchedAt?: Date | null }[],
  limit: number
): SearchResult[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (queryTerms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const article of articles) {
    const text = `${article.title} ${article.summary} ${article.titleAr || ''} ${article.summaryAr || ''}`.toLowerCase();
    let matchCount = 0;
    for (const term of queryTerms) {
      if (text.includes(term)) matchCount++;
    }
    if (matchCount > 0) {
      const score = matchCount / queryTerms.length;
      results.push({
        id: article.id,
        title: article.title,
        titleAr: article.titleAr || undefined,
        summary: article.summary,
        summaryAr: article.summaryAr || undefined,
        score,
        category: article.category,
        slug: article.slug || undefined,
        sentiment: (article.sentiment as string) || undefined,
        impactLevel: (article.impactLevel as string) || undefined,
        // EGRESS FIX: Use API route instead of pulling base64 generatedImage
        imageUrl: article.imageUrl || `/api/article-image/${article.id}`,
        publishedAt: article.fetchedAt?.toISOString() || undefined,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Search for semantically similar articles
 * OPTIMIZED: Uses pre-computed embeddings from aiAnalysis
 * No per-article DB writes during search
 * Single-pass similarity calculation
 *
 * LOCALE BEHAVIOR:
 * - locale is OPTIONAL — when omitted, articles of ALL locales are searched (both ar & en)
 * - Only pass locale when you need language-specific results (e.g., article page "Read Also")
 * - Report/infographic generation should NOT pass locale — they need cross-lingual results
 * - News article pages SHOULD pass locale to prevent mixing Arabic/English in related news
 */
// ─── Search result type with Arabic fields ─────────────────────
export interface SearchResult {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  score: number;
  category: string;
  slug?: string;
  sentiment?: string;
  impactLevel?: string;
  imageUrl?: string;
  publishedAt?: string;
}

export async function semanticSearch(
  query: string,
  limit: number = 10,
  minScore: number = 0.15,  // FIX: Lowered from 0.3 — pseudo-embeddings naturally have low cosine similarity
  locale?: string  // OPTIONAL — only filter by locale when explicitly needed (e.g., article pages)
                    // When omitted, searches ALL locales — required for report/infographic generation
): Promise<SearchResult[]> {
  try {
    // Get articles from DB (limit to 50 for performance)
    // Include all ready news types (article, live, breaking) for better related content
    // LOCALE: Only filter by locale when explicitly provided.
    // Report/infographic generation must NOT pass locale — they need articles from both languages.
    // Article display pages SHOULD pass locale to prevent Arabic/English mixing in related news.
    const articles = await db.newsItem.findMany({
      where: {
        isReady: true,
        ...(locale ? { locale } : {}),
      },
      take: 150,  // FIX: Increased from 50 to 150 for better search coverage
      orderBy: { fetchedAt: 'desc' },
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        category: true,
        slug: true,
        sentiment: true,
        impactLevel: true,
        imageUrl: true,
        // EGRESS FIX: removed generatedImage from select — imageUrl uses API route instead
        fetchedAt: true,
        aiAnalysis: true,
        locale: true,
      },
    });

    if (articles.length === 0) return [];

    // Generate query embedding (single LLM call or fallback)
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch {
      console.warn('[SemanticSearch] Query embedding failed, using keyword fallback');
      return keywordSearch(query, articles, limit);
    }

    // Calculate similarity using pre-computed embeddings — NO DB writes
    const results: SearchResult[] = [];

    for (const article of articles) {
      // Try pre-computed embedding from aiAnalysis first
      let articleEmbedding = extractStoredEmbedding(article.aiAnalysis);

      // Fall back to in-memory cache
      if (!articleEmbedding) {
        articleEmbedding = cacheGet(article.id) ?? null;
      }

      // Last resort: compute on-the-fly (no DB write during search)
      if (!articleEmbedding) {
        // FIX: Include Arabic fields in embedding computation for better cross-lingual matching
        const text = `${article.title} ${article.summary} ${article.titleAr || ''} ${article.summaryAr || ''}`;
        articleEmbedding = textToPseudoEmbedding(text, 128);
        cacheSet(article.id, articleEmbedding);
      }

      const score = cosineSimilarity(queryEmbedding, articleEmbedding);

      if (score >= minScore) {
        results.push({
          id: article.id,
          title: article.title,
          titleAr: article.titleAr || undefined,
          summary: article.summary,
          summaryAr: article.summaryAr || undefined,
          score,
          category: article.category,
          slug: article.slug || undefined,
          sentiment: (article.sentiment as string) || undefined,
          impactLevel: (article.impactLevel as string) || undefined,
          // EGRESS FIX: Use API route instead of pulling base64 generatedImage
          imageUrl: article.imageUrl || `/api/article-image/${article.id}`,
          publishedAt: article.fetchedAt?.toISOString() || undefined,
        });
      }
    }

    // Sort by similarity score
    results.sort((a, b) => b.score - a.score);

    // If semantic search yields too few results, augment with keyword search
    if (results.length < 3) {
      const keywordResults = keywordSearch(query, articles, limit);
      const existingIds = new Set(results.map(r => r.id));
      for (const kr of keywordResults) {
        if (!existingIds.has(kr.id)) {
          results.push({ ...kr, score: kr.score * 0.8 });
        }
      }
      results.sort((a, b) => b.score - a.score);
    }

    return results.slice(0, limit);
  } catch (error: any) {
    console.error('[SemanticSearch] Database error:', error.message);
    return [];
  }
}
