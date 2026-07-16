// ═══════════════════════════════════════════════════════════════
// Document Store — Versioned, immutable document storage (V1220)
// ═══════════════════════════════════════════════════════════════
// Extracted from fetch-queue.ts so both queue AND API can use it.
// Key principle: Document without content = still a valid document.
// (metadata first — content is optional)
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import type { RawDocument } from '../adapters/types';

export interface StoreResult {
  stored: number;
  newVersions: number;
  duplicates: number;
  errors: string[];
}

/**
 * Store a document in the database (immutable, versioned)
 * - If URL is new: create version 1
 * - If URL exists and hash matches: skip (duplicate)
 * - If URL exists but hash differs: create new version, mark old as non-latest
 * 
 * IMPORTANT: A document with empty rawContent is STILL VALID.
 * The document exists (we fetched it), it has a URL, hash, and metadata.
 * Content may be empty for: PDFs (stored as binary), redirects, data-only pages.
 */
export async function storeDocument(sourceId: string, doc: RawDocument): Promise<'created' | 'new_version' | 'duplicate' | 'error'> {
  try {
    // Check if document already exists (by URL, latest version)
    const existing = await db.officialDocument.findFirst({
      where: { sourceId, url: doc.url, isLatest: true },
      orderBy: { version: 'desc' },
    });

    if (existing) {
      // Same content? Skip (duplicate)
      if (existing.hash === doc.hash) {
        return 'duplicate';
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
          rawContent: doc.rawContent || '',  // Empty content is valid!
          hash: doc.hash,
          language: doc.language || 'en',
          version: existing.version + 1,
          isLatest: true,
          previousVersionId: existing.id,
          publishedAt: doc.publishedAt,
          contentLength: doc.rawContent?.length || 0,
          httpStatus: 200,
          metadata: JSON.stringify(doc.metadata || {}),
        },
      });

      console.log(`[DocumentStore] New version for ${doc.url}: v${existing.version + 1}`);
      return 'new_version';
    }

    // New document — create version 1
    await db.officialDocument.create({
      data: {
        sourceId,
        url: doc.url,
        documentType: doc.documentType,
        title: doc.title,
        rawContent: doc.rawContent || '',  // Empty content is valid!
        hash: doc.hash,
        language: doc.language || 'en',
        version: 1,
        isLatest: true,
        publishedAt: doc.publishedAt,
        contentLength: doc.rawContent?.length || 0,
        httpStatus: 200,
        metadata: JSON.stringify(doc.metadata || {}),
      },
    });

    return 'created';
  } catch (error: any) {
    console.error(`[DocumentStore] Error storing ${doc.url}: ${error?.message?.slice(0, 100)}`);
    return 'error';
  }
}

/**
 * Store multiple documents and return summary
 */
export async function storeDocuments(sourceId: string, docs: RawDocument[]): Promise<StoreResult> {
  let stored = 0;
  let newVersions = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const result = await storeDocument(sourceId, doc);
    switch (result) {
      case 'created': stored++; break;
      case 'new_version': newVersions++; break;
      case 'duplicate': duplicates++; break;
      case 'error': errors.push(doc.url); break;
    }
  }

  return { stored, newVersions, duplicates, errors };
}
