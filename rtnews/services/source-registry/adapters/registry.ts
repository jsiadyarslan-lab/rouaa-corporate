// ═══════════════════════════════════════════════════════════════
// Adapter Registry — Routes sources to correct adapters (V1220)
// ═══════════════════════════════════════════════════════════════
import type { SourceAdapter, SourceConfig } from './types';
import { RSSAdapter } from './rss/RSSAdapter';
import { HTMLAdapter } from './html/HTMLAdapter';

// Register all adapters — new adapters added here
const adapters: Record<string, SourceAdapter> = {
  rss: new RSSAdapter(),
  html: new HTMLAdapter(),
  // api: new APIAdapter(),     // Phase 1B
  // pdf: new PDFAdapter(),     // Phase 1B
  // xml: new XMLAdapter(),     // Phase 1B
};

/**
 * Get the best adapter for a source based on its accessMethods.
 * Priority: rss > api > html > pdf > xml
 */
export function getAdapter(source: SourceConfig): SourceAdapter | null {
  const priority = ['rss', 'api', 'html', 'pdf', 'xml'];

  for (const method of priority) {
    if (source.accessMethods.includes(method) && adapters[method]) {
      return adapters[method];
    }
  }

  // Fallback: if source has rss URL, use RSS adapter
  if (source.rss && adapters.rss) return adapters.rss;
  // Fallback: if source has website, use HTML adapter
  if (source.website && adapters.html) return adapters.html;

  return null;
}

/**
 * List all registered adapter types
 */
export function getRegisteredAdapters(): string[] {
  return Object.keys(adapters);
}

/**
 * Register a new adapter (for plugins/future adapters)
 */
export function registerAdapter(method: string, adapter: SourceAdapter): void {
  adapters[method] = adapter;
  console.log(`[AdapterRegistry] Registered adapter for: ${method}`);
}
