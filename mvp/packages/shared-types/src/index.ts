/**
 * ROUAA Shared Types — TypeScript types shared across backend + frontend.
 *
 * These mirror the database schema and ensure both sides agree on the shape
 * of Source, Document, Fact, Event, Evidence, etc.
 *
 * Per docs/foundation/29-DATA-MODEL-v1.md and docs/execution/03-ROUAA-ENGINEERING-SPECIFICATION-v1.md §5.
 */

// =====================================
// Source — Layer 01 of the 7-Layer Architecture
// =====================================

export type SourceType =
  | 'central_bank'
  | 'regulator'
  | 'exchange'
  | 'statistics'
  | 'government'
  | 'international_org'
  | 'company';

export type SourceStatus = 'active' | 'paused' | 'deprecated' | 'candidate';
export type AuthorityLevel = 'primary' | 'secondary';
export type IngestionPattern =
  | 'direct_api'
  | 'document_monitoring'
  | 'scheduled_polling'
  | 'manual';

export type HealthStatus = 'healthy' | 'degraded' | 'failing' | 'paused' | 'unknown';

export interface Source {
  id: string;
  name: string;
  code: string;
  type: SourceType;
  country: string;
  jurisdiction: string;
  authorityLevel: AuthorityLevel;
  trustTier: 1 | 2 | 3 | 4;
  websiteUrl: string | null;
  feedUrl: string | null;
  apiUrl: string | null;
  ingestionPattern: IngestionPattern;
  pollingIntervalSec: number;
  status: SourceStatus;
  metadata: Record<string, unknown>;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceHealth {
  id: string;
  sourceId: string;
  lastSuccessfulFetchAt: string | null;
  lastFetchAttemptAt: string | null;
  consecutiveFailures: number;
  totalSuccessfulFetches: number;
  totalFailedFetches: number;
  reliabilityScore: number;
  status: HealthStatus;
  lastErrorMessage: string | null;
  updatedAt: string;
}

// =====================================
// Document — Layer 02 (Document Intelligence)
// =====================================

export type DocumentType =
  | 'press_release'
  | 'statistical_release'
  | 'regulatory_filing'
  | 'speech'
  | 'minutes'
  | 'report'
  | 'regulation'
  | 'other';

export type DocumentProcessingStatus =
  | 'pending'
  | 'extracted'
  | 'classified'
  | 'processed'
  | 'failed';

export interface Document {
  id: string;
  sourceId: string;
  title: string;
  type: DocumentType;
  publishedAt: string;
  rawContentUrl: string;
  processingStatus: DocumentProcessingStatus;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// Fact — Layer 03 (Financial Facts & Events)
// =====================================

export interface Fact {
  id: string;
  metric: string;
  value: number | string | boolean;
  unit: string | null;
  sourceId: string;
  documentId: string;
  pageNumber: number | null;
  paragraphNumber: number | null;
  extractionConfidence: number; // 0.0 to 1.0
  corroborationCount: number;
  publishedAt: string;
  createdAt: string;
}

// =====================================
// Event — Layer 03 (Financial Facts & Events)
// =====================================

export interface FinancialEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
  sourceId: string;
  documentId: string;
  confidenceScore: number;
  createdAt: string;
}

// =====================================
// Evidence — Layer 04 (Evidence & Provenance)
// =====================================

export interface Evidence {
  id: string;
  factId: string;
  sourceId: string;
  documentId: string;
  pageNumber: number | null;
  paragraphNumber: number | null;
  excerpt: string;
  extractionConfidence: number;
  createdAt: string;
}

// =====================================
// API envelopes
// =====================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
