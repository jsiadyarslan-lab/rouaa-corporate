// ═══════════════════════════════════════════════════════════════
// Fetch Queue (V1220 Phase 1A — Step 4)
// V1220.1: Now uses document-store.ts (extracted module)
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import { getAdapter } from '../adapters/registry';
import { updateSourceHealth } from './health-monitor';
import { storeDocuments } from './document-store';
import type { SourceConfig } from '../adapters/types';

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

export function enqueueFetch(source: SourceConfig, priority: number = 5): void {
  if (queue.some(item => item.sourceId === source.id)) return;

  queue.push({ sourceId: source.id, source, priority, enqueuedAt: Date.now() });
  queue.sort((a, b) => a.priority - b.priority);

  if (!processing) {
    processQueue().catch(err => console.error('[FetchQueue] Processing error:', err));
  }
}

async function processQueue(): Promise<void> {
  processing = true;

  while (queue.length > 0 || activeFetches > 0) {
    if (activeFetches >= MAX_CONCURRENCY) {
      await sleep(500);
      continue;
    }

    const item = queue.shift();
    if (!item) { await sleep(500); continue; }

    activeFetches++;
    fetchSource(item.source).finally(() => { activeFetches--; });
  }

  processing = false;
}

async function fetchSource(source: SourceConfig): Promise<void> {
  const adapter = getAdapter(source);

  if (!adapter) {
    console.warn(`[FetchQueue] No adapter for source ${source.name} (${source.id})`);
    await updateSourceHealth({
      sourceId: source.id, success: false, durationMs: 0,
      documentsCount: 0, error: 'No suitable adapter found',
    });
    return;
  }

  console.log(`[FetchQueue] Fetching ${source.name} (${source.id})...`);

  const result = await adapter.fetch(source);

  // Store documents (V1220.1: using extracted module)
  if (result.success && result.documents.length > 0) {
    const storeResult = await storeDocuments(source.id, result.documents);
    console.log(`[FetchQueue] ${source.name}: stored ${storeResult.stored} new, ${storeResult.newVersions} versions, ${storeResult.duplicates} duplicates`);
  }

  await updateSourceHealth({
    sourceId: source.id,
    success: result.success,
    durationMs: result.durationMs,
    httpStatus: result.httpStatus,
    documentsCount: result.documents.length,
    error: result.error,
  });

  if (result.success && result.documents.length > 0) {
    console.log(`[FetchQueue] ✓ ${source.name}: ${result.documents.length} docs in ${result.durationMs}ms`);
  } else if (!result.success) {
    console.warn(`[FetchQueue] ✗ ${source.name}: ${result.error}`);
  }
}

export async function fetchAllActiveSources(): Promise<{ fetched: number; failed: number }> {
  const sources = await db.officialSource.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
  });

  for (const source of sources) {
    const sourceConfig: SourceConfig = {
      id: source.id, name: source.name, slug: source.slug, type: source.type,
      rss: source.rss, api: source.api, website: source.website,
      accessMethods: JSON.parse(source.accessMethods || '[]'),
      language: source.language, locale: source.locale,
      updateFrequency: source.updateFrequency, timezone: source.timezone,
    };
    enqueueFetch(sourceConfig, source.priority);
  }

  return { fetched: sources.length, failed: 0 };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
