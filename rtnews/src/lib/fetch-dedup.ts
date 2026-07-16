// ─── Fetch Deduplication Utility (V15) ────────────────────────────
// Prevents concurrent identical API requests from different components.
// When multiple components request the same URL simultaneously, only one
// actual fetch is made and the result is shared with all callers.
// Also provides 429 retry backoff to prevent cascading rate limit errors.

const pendingFetches = new Map<string, Promise<Response>>();

/**
 * Deduplicated fetch with 429 retry backoff.
 * If the same URL is already being fetched, returns the same Promise.
 * On 429 (rate limited), retries with exponential backoff.
 */
export async function dedupFetch(
  url: string,
  options?: RequestInit,
  retries = 1,
): Promise<Response> {
  // Check for pending fetch to the same URL
  const pending = pendingFetches.get(url);
  if (pending) {
    // Clone the response so each caller can read the body independently
    const response = await pending;
    return response.clone();
  }

  // Start a new fetch
  const fetchPromise = (async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, options);

      // On 429, retry with backoff
      if (response.status === 429 && attempt < retries) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, attempt + 1) * 1000; // 2s, 4s exponential backoff
        await new Promise(r => setTimeout(r, Math.min(waitMs, 10_000)));
        continue;
      }

      return response;
    }

    // Final attempt without retry
    return fetch(url, options);
  })();

  pendingFetches.set(url, fetchPromise);

  try {
    const response = await fetchPromise;
    return response;
  } finally {
    // Clean up the pending entry after response is available
    pendingFetches.delete(url);
  }
}
