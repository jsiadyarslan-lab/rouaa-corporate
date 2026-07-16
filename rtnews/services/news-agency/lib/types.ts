// ═══════════════════════════════════════════════════════════════
// News Agency Service — Types
// ═══════════════════════════════════════════════════════════════
// Shared types for the independent news agency service.
// This service is SEPARATE from the news pipeline. It does NOT
// import anything from src/lib/pipeline/.
// ═══════════════════════════════════════════════════════════════

export type SourceId = 'SEC' | 'FedRSS' | 'WorldBank' | 'FRED' | 'DB';

export type EventType =
  | 'filing'           // SEC 8-K, 10-K, Form 4
  | 'press_release'    // Fed press releases, speeches
  | 'data_release'     // World Bank indicators, economic data
  | 'speech';          // Fed speeches

export type Category =
  | 'economy'
  | 'stocks'
  | 'crypto'
  | 'commodities'
  | 'forex'
  | 'central_banks';

export interface RawEvent {
  sourceId: SourceId;
  externalId: string;
  sourceName: string;
  url: string;
  eventType: EventType;
  title: string;
  rawContent: string;
  category: Category;
  locale: string;  // 'ar' by default
  publishedAtSource?: Date;
  // V1180: Integration with stock-analysis pipeline.
  // analysisUrl: link to the detailed stock analysis page (e.g., /stock-analysis/TSLA).
  //   When present, the publisher appends a "read full analysis" link at the end of the article.
  // analysisContent: the FULL technical analysis text from StockAnalysis.content.
  //   Passed to the LLM as [التحليل الفني الكامل] so the agency can re-write it as
  //   a journalistic news article (different style/purpose from the analysis itself).
  analysisUrl?: string;
  analysisContent?: string;
}

export interface DraftArticle {
  draftTitle: string;
  draftBody: string;
  draftSummary: string;
  llmProvider: string;
  internalContext: string;
  numericCheckPassed: boolean;
  // Analysis fields (separate from news body)
  analysisPath: string;        // 'A' | 'B' | 'C'
  fullContent: string;         // Analysis with [1]-[6] structure
  sentiment: string;           // 'positive' | 'negative' | 'neutral'
  impactLevel: string;         // 'high' | 'medium' | 'low'
  affectedAssets: any[];
  recommendation: string;
}

export interface FetchResult {
  source: SourceId;
  events: RawEvent[];
  errors: string[];
  durationMs: number;
}

export interface PublishResult {
  success: boolean;
  newsItemId?: string;
  agencyEventId: string;
  reason?: string;
  duplicate?: boolean;
}

export const AGENCY_USER_AGENT = 'Rouaa News Agency (contact@rouaa.com)';

export const FETCH_TIMEOUT_MS = 15000;
export const LLM_TIMEOUT_MS = 45000;
