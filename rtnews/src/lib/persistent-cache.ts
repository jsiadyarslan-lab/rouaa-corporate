// ─── File-Based Persistent Cache ─────────────────────────────
// CRITICAL FIX: This cache survives container restarts!
//
// Problem: When Railway restarts a container, all in-memory state is lost.
// The in-memory cache (cachedNews, cachedBreaking) starts empty.
// If the first request after restart hits a DB connection issue,
// the API returns empty news → user sees nothing.
//
// Solution: Save news data to a JSON file on disk.
// On startup, restore from the file before serving any requests.
// This ensures news is ALWAYS visible, even during DB outages.
//
// The cache file is stored in /tmp/ which is writable in Docker containers
// and survives within the same container lifecycle (but not across deploys).
// This is acceptable because: on deploy, the bootstrap runs and fills the DB,
// so news will be available from the DB after a few seconds.

import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = '/tmp/rouaa-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — old cache is better than no cache

// In-memory fallback for environments where /tmp isn't writable
const memoryCache: Record<string, { data: any[]; timestamp: number }> = {};

async function ensureCacheDir(): Promise<boolean> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function getCachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

/**
 * Read cached data from persistent storage.
 * Returns null if no cache exists or cache is expired.
 * NOTE: Expired cache is still returned as a fallback when needed.
 */
export async function readPersistentCache(key: string): Promise<any[] | null> {
  // Try file-based cache first
  try {
    const filePath = getCachePath(key);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Return data regardless of age — old news is better than no news!
    // The caller can decide whether to use it based on their needs.
    if (parsed && Array.isArray(parsed.data)) {
      const age = Date.now() - (parsed.timestamp || 0);
      console.log(`[PersistentCache] Read ${parsed.data.length} items for "${key}" (age: ${Math.round(age / 1000)}s)`);
      return parsed.data;
    }
  } catch {
    // File doesn't exist or is corrupted — try memory cache
  }

  // Fall back to memory cache
  const memEntry = memoryCache[key];
  if (memEntry && memEntry.data.length > 0) {
    const age = Date.now() - memEntry.timestamp;
    console.log(`[PersistentCache] Read ${memEntry.data.length} items from memory for "${key}" (age: ${Math.round(age / 1000)}s)`);
    return memEntry.data;
  }

  return null;
}

/**
 * Write data to persistent cache (file + memory).
 * Fire-and-forget — errors are logged but don't affect the caller.
 */
export async function writePersistentCache(key: string, data: any[]): Promise<void> {
  if (!data || data.length === 0) return;

  const entry = {
    data,
    timestamp: Date.now(),
    key,
  };

  // Always update memory cache (instant, never fails)
  memoryCache[key] = { data, timestamp: entry.timestamp };

  // Try to write to file (may fail if /tmp isn't writable)
  try {
    const dirOk = await ensureCacheDir();
    if (dirOk) {
      const filePath = getCachePath(key);
      await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
    }
  } catch (err: any) {
    // File write failed — memory cache is still valid
    // Don't log this too verbosely, it's expected in some environments
    if (!err.message?.includes('ENOENT') && !err.message?.includes('EACCES')) {
      console.warn(`[PersistentCache] File write failed for "${key}": ${err.message}`);
    }
  }
}

/**
 * Clear data from persistent cache (file + memory).
 */
export async function clearPersistentCache(key: string): Promise<void> {
  // Clear memory cache
  delete memoryCache[key];

  // Try to delete file
  try {
    const filePath = getCachePath(key);
    await fs.unlink(filePath);
  } catch (err: any) {
    if (!err.message?.includes('ENOENT')) {
      console.warn(`[PersistentCache] File delete failed for "${key}": ${err.message}`);
    }
  }
}
