// ═══════════════════════════════════════════════════════════════
// Fetch Queue (V1220 Phase 1A — Step 4)
// ═══════════════════════════════════════════════════════════════
// In-memory queue for now. Will upgrade to BullMQ + Redis in Phase 1B.
// Priority-based: sources with priority=1 fetched first.
// Concurrency-limited: max 3 parallel fetches to avoid rate limiting.
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import { getAdapter } from '../adapters/registry';
import { updateSourceHealth } from './health-monitor';
import type { SourceConfig, RawDocument } from '../adapters/types';

interface QueueItem {
  sourceId: string;
  source: SourceConfig;
  priority: number;
  enqueuedAt: number;
}

const queue: QueueItem[] = [];
let processing = false;
const MAX_CONCURRENCY = 3;
let activeFetches = 0;

/**
 * Add a source to the fetch queue
 */
export function enqueueFetch(source: SourceConfig, priority: number = 5): void {
  // Don't add duplicates
  if (queue.some(item => item.sourceId === source.id)) return;

  queue.push({
    sourceId: source.id,
    source,
    priority,
    enqueuedAt: Date.now(),
  });

  // Sort by priority (1 = highest priority, fetched first)
  queue.sort((a, b) => a.priority - b.priority);

  // Start processing if not already
  if (!processing) {
    processQueue().catch(err => console.error('[FetchQueue] Processing error:', err));
  }
}

/**
 * Process the queue
 */
async function processQueue(): Promise<void> {
  processing = true;

  while (queue.length > 0 || activeFetches > 0) {
    // Wait if at max concurrency
    if (activeFetches >= MAX_CONCURRENCY) {
      await sleep(500);
      continue;
    }

    const item = queue.shift();
    if (!item) {
      await sleep(500);
      continue;
    }

    activeFetches++;

    // Process in parallel
    fetchSource(item.source).finally(() => {
      activeFetches--;
    });
  }

  processing = false;
}

/**
 * Fetch a single source
 */
async function fetchSource(source: SourceConfig): Promise<void> {
  const adapter = getAdapter(source);

  if (!adapter) {
    console.warn(`[FetchQueue] No adapter for source ${source.name} (${source.id})`);
    await updateSourceHealth({
      sourceId: source.id,
      success: false,
      durationMs: 0,
      documentsCount: 0,
      error: 'No suitable adapter found',
    });
    return;
  }

  console.log(`[FetchQueue] Fetching ${source.name} (${source.id})...`);

  const result = await adapter.fetch(source);

  // Update health
  await updateSourceHealth({
    sourceId: source.id,
    success: result.success,
    durationMs: result.durationMs,
    httpStatus: result.httpStatus,
    documentsCount: result.documents.length,
    error: result.error,
  });

  if (result.success && result.documents.length > 0) {
    // Store documents
    for (const doc of result.documents) {
      await storeDocument(source.id, doc);
    }
    console.log(`[FetchQueue] ✓ ${source.name}: ${result.documents.length} documents fetched in ${result.durationMs}ms`);
  } else if (!result.success) {
    console.warn(`[FetchQueue] ✗ ${source.name}: ${result.error}`);
  }
}

/**
 * Store a document in the database (immutable, versioned)
 */
async function storeDocument(sourceId: string, doc: RawDocument): Promise<void> {
  try {
    // Check if document already exists (by URL + version)
    const existing = await db.officialDocument.findFirst({
      where: { sourceId, url: doc.url, isLatest: true },
      orderBy: { version: 'desc' },
    });

    if (existing) {
      // Check if content changed (hash comparison)
      if (existing.hash === doc.hash) {
        // Same content — skip (no new version needed)
        return;
      }

      // Content changed — create new version
      await db.officialDocument.update({
        where: { id: existing.id },
        data: { isLatest: false },
      });

      await db.officialDocument.create({
        data: {
          sourceId,
          url: doc.url,
          documentType: doc.documentType,
          title: doc.title,
          rawContent: doc.rawContent,
          hash: doc.hash,
          language: doc.language || 'en',
          version: existing.version + 1,
          isLatest: true,
          previousVersionId: existing.id,
          publishedAt: doc.publishedAt,
          fetchDurationMs: 0,
          contentLength: doc.rawContent.length,
          httpStatus: 200,
          metadata: JSON.stringify(doc.metadata || {}),
        },
      });

      console.log(`[FetchQueue] New version for ${doc.url}: v${existing.version + 1}`);
    } else {
      // New document
      await db.officialDocument.create({
        data: {
          sourceId,
          url: doc.url,
          documentType: doc.documentType,
          title: doc.title,
          rawContent: doc.rawContent,
          hash: doc.hash,
          language: doc.language || 'en',
          version: 1,
          isLatest: true,
          publishedAt: doc.publishedAt,
          contentLength: doc.rawContent.length,
          httpStatus: 200,
          metadata: JSON.stringify(doc.metadata || {}),
        },
      });
    }
  } catch (error: any) {
    console.error(`[FetchQueue] Error storing document: ${error?.message?.slice(0, 100)}`);
  }
}

/**
 * Fetch all active sources (called by cron)
 */
export async function fetchAllActiveSources(): Promise<{ fetched: number; failed: number }> {
  const sources = await db.officialSource.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
  });

  let fetched = 0;
  let failed = 0;

  for (const source of sources) {
    const sourceConfig: SourceConfig = {
      id: source.id,
      name: source.name,
      slug: source.slug,
      type: source.type,
      rss: source.rss,
      api: source.api,
      website: source.website,
      accessMethods: JSON.parse(source.accessMethods || '[]'),
      language: source.language,
      locale: source.locale,
      updateFrequency: source.updateFrequency,
      timezone: source.timezone,
    };

    enqueueFetch(sourceConfig, source.priority);
    fetched++;
  }

  return { fetched, failed };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
