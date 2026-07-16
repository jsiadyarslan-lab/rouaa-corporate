// ═══════════════════════════════════════════════════════════════
// Source Adapter Framework — Type Definitions (V1220 Phase 1A)
// ═══════════════════════════════════════════════════════════════
// Every source type implements this interface.
// The framework is agnostic to the source — adapters handle specifics.
// ═══════════════════════════════════════════════════════════════

// What a source looks like (from OfficialSource table)
export interface SourceConfig {
  id: string;
  name: string;
  slug: string;
  type: string;           // central_bank | statistics | regulator | etc.
  rss?: string | null;
  api?: string | null;
  website?: string | null;
  accessMethods: string[]; // ["rss", "html", "pdf"]
  language: string;
  locale: string;
  updateFrequency?: string | null;
  timezone?: string | null;
}

// What a raw document looks like before storage
export interface RawDocument {
  url: string;
  documentType: string;   // rss | html | pdf | json | xml | csv
  title?: string;
  rawContent: string;
  hash: string;            // SHA-256
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

// Result of a fetch operation
export interface FetchResult {
  success: boolean;
  documents: RawDocument[];
  error?: string;
  durationMs: number;
  httpStatus?: number;
}

// The adapter interface — every adapter must implement this
export interface SourceAdapter {
  // What access methods does this adapter handle?
  supportedMethods: string[];

  // Fetch documents from the source
  fetch(source: SourceConfig): Promise<FetchResult>;

  // Validate that the source config is correct for this adapter
  validate(source: SourceConfig): boolean;

  // Get the next fetch time (based on updateFrequency)
  nextFetchTime(source: SourceConfig): Date;
}

// Health update after each fetch
export interface HealthUpdate {
  sourceId: string;
  success: boolean;
  durationMs: number;
  httpStatus?: number;
  documentsCount: number;
  error?: string;
}
