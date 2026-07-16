// ═══════════════════════════════════════════════════════════════
// Document Store V2 — Versioned, immutable, with detailed error capture
// V1220.2: Now captures full error details (message, code, meta)
// ═══════════════════════════════════════════════════════════════
import { db } from '@/lib/db';
import type { RawDocument } from '../adapters/types';

export interface StorageError {
  url: string;
  message: string;
  code?: string;
  meta?: any;
}

export interface StoreResult {
  stored: number;
  newVersions: number;
  duplicates: number;
  errors: StorageError[];
}

/**
 * Store a document in the database (immutable, versioned)
 * - If URL is new: create version 1
 * - If URL exists and hash matches: skip (duplicate)
 * - If URL exists but hash differs: create new version, mark old as non-latest
 * 
 * IMPORTANT: A document with empty rawContent is STILL VALID.
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
          rawContent: doc.rawContent || '',
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

      return 'new_version';
    }

    // New document — create version 1
    await db.officialDocument.create({
      data: {
        sourceId,
        url: doc.url,
        documentType: doc.documentType,
        title: doc.title,
        rawContent: doc.rawContent || '',
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
    // V1220.2: Log FULL error details for diagnosis
    console.error('[DocumentStore] DETAILED ERROR:', {
      url: doc.url,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    });
    return 'error';
  }
}

/**
 * Store multiple documents and return summary with detailed errors
 */
export async function storeDocuments(sourceId: string, docs: RawDocument[]): Promise<StoreResult> {
  let stored = 0;
  let newVersions = 0;
  let duplicates = 0;
  const errors: StorageError[] = [];

  for (const doc of docs) {
    try {
      const result = await storeDocument(sourceId, doc);
      switch (result) {
        case 'created': stored++; break;
        case 'new_version': newVersions++; break;
        case 'duplicate': duplicates++; break;
        case 'error':
          errors.push({
            url: doc.url,
            message: 'Storage failed — check server logs for details',
          });
          break;
      }
    } catch (error: any) {
      errors.push({
        url: doc.url,
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
    }
  }

  return { stored, newVersions, duplicates, errors };
}
