// ─── Video Generation Queue / Lock ────────────────────────────────
// Prevents concurrent video generation to avoid OOM crashes on Railway.
// Only ONE video can be generated at a time. Additional requests are
// rejected with 429 (Too Many Requests) instead of queuing.
//
// Rationale: Each Playwright render uses ~300-400MB RSS. Two concurrent
// renders = 600-800MB → OOM crash on Railway (512MB-1GB limit).

let currentGeneration: Promise<any> | null = null;

/**
 * Try to acquire the video generation lock.
 * Returns `true` if the lock was acquired, `false` if generation is already running.
 */
export function tryAcquireLock(): boolean {
  return currentGeneration === null;
}

/**
 * Wrap a video generation promise with the lock.
 * Automatically releases the lock when the promise settles (success or failure).
 *
 * @returns The result of the generation promise.
 * @throws If another generation is already running.
 */
export async function withVideoLock<T>(generationPromise: () => Promise<T>): Promise<T> {
  if (currentGeneration !== null) {
    throw new Error(
      'Video generation already in progress — only one video can be generated at a time. ' +
      'Please wait for the current generation to finish.'
    );
  }

  try {
    // Start the generation and store the promise
    currentGeneration = generationPromise();
    return await currentGeneration;
  } finally {
    // Always release the lock
    currentGeneration = null;
  }
}

/**
 * Check if a video generation is currently running.
 */
export function isVideoGenerating(): boolean {
  return currentGeneration !== null;
}
