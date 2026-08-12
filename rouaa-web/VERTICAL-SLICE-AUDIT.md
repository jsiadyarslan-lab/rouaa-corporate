# Vertical Slice — Architecture & Runtime Audit

> **Status:** Audit complete. Ready for implementation planning. **No code modified.**
> **Subject:** What exists in `mvp/` today, what's the entry point for the vertical slice, and what gaps must be filled
> **Per user direction:** "Examine `mvp/` and determine the entry point, schemas, services, and gaps needed — don't start writing Layer 2 from scratch."
> **Baseline:** `8984c8e` (Product Reality Baseline)
> **Date:** 2026-08-12

---

## 1. Runtime Environment

| Tool | Available? | Version |
|---|---|---|
| Node.js | ✅ | v24.18.0 |
| npm | ✅ | available |
| pnpm | ❌ | NOT installed (required by package.json `packageManager: "pnpm@9.12.0"`) |
| Python 3 | ✅ | available (venv) |
| Docker | ❌ | NOT installed |
| PostgreSQL | ❌ | NOT installed (requires Docker or local install) |

**Runtime blocker:** The MVP requires `pnpm` + Docker (PostgreSQL). Neither is installed. We can install pnpm via npm, but Docker requires system-level access.

**Workaround:** We can write and test the vertical slice code without a running PostgreSQL by:
1. Using SQLite for development (TypeORM supports it)
2. Or using a Python-based pipeline that connects to the existing shared types

---

## 2. What Exists — Layer 1 Deep Audit

### 2.1 Database Schema (migration)

```sql
-- Tables that exist:
sources (id, name, code, type, country, jurisdiction, authority_level,
         trust_tier, website_url, feed_url, api_url, ingestion_pattern,
         polling_interval_sec, status, metadata, description, created_at, updated_at)

source_health (id, source_id, last_successful_fetch_at, last_fetch_attempt_at,
               consecutive_failures, total_successful_fetches, total_failed_fetches,
               reliability_score, status, last_error_message, updated_at)
```

**Tables that DON'T exist (needed for vertical slice):**
- `documents` — Layer 2
- `facts` — Layer 3
- `events` — Layer 4
- `evidence` — Layer 5
- `intelligence_objects` — Layer 7

### 2.2 API Endpoints (implemented)

```
GET    /api/v1/sources           — list with filters + pagination
GET    /api/v1/sources/:id       — get by UUID
GET    /api/v1/sources/code/:code — get by short code (FED, ECB, etc.)
GET    /api/v1/sources/stats     — registry statistics
POST   /api/v1/sources           — create
PATCH  /api/v1/sources/:id       — update
DELETE /api/v1/sources/:id       — soft-delete (deprecate)
GET    /api/v1/health            — liveness
```

### 2.3 Source Entity Fields (what's stored per source)

| Field | Type | Used for vertical slice? |
|---|---|---|
| `name` | text | ✅ Source identity |
| `code` | varchar(16) | ✅ Short code (FED, ECB) |
| `type` | enum (7 types) | ✅ Classification |
| `country` | varchar(16) | ✅ Jurisdiction |
| `jurisdiction` | text | ✅ Full jurisdiction name |
| `trustTier` | smallint (1-4) | ✅ Confidence scoring |
| `websiteUrl` | text | ✅ Fetch URL |
| `feedUrl` | text | ✅ RSS feed URL |
| `apiUrl` | text | ✅ API endpoint |
| `ingestionPattern` | enum (4 patterns) | ✅ How to fetch |
| `pollingIntervalSec` | integer | ✅ Fetch frequency |
| `status` | enum (4 states) | ✅ Active/paused |
| `metadata` | jsonb | ✅ Source-specific config (selectors, auth, headers) |

### 2.4 Seeded Sources (36)

All 36 sources have real URLs:
- 10 central banks (FED, ECB, BOE, BOJ, PBOC, SNB, BOC, RBA, MAS, BIS)
- 7 regulators (SEC, CFTC, FCA, BAFIN, AMF, SFC, ESMA)
- 5 exchanges (NYSE, NASDAQ, LSE, EUREX, TSE)
- 5 statistical agencies (BLS, BEA, EUROSTAT, ONS, STATSCAN)
- 4 government bodies (TREAS, HMT, BMF, MOF)
- 5 international bodies (IMF, WBG, OECD, WTO, FATF)

**Important:** The 5 sources proposed for Phase A (ECB, BoE, Fed, BoC, RBA) are ALREADY in the seed data. But we need to process **new publications** from them — not the same publications used in the website demonstrations.

### 2.5 Shared Types (TypeScript interfaces for Layers 2-5)

Already defined in `packages/shared-types/src/index.ts`:

```typescript
interface Document {
  id: string;
  sourceId: string;
  title: string;
  type: DocumentType; // press_release | statistical_release | regulatory_filing | speech | minutes | report | regulation | other
  publishedAt: string;
  rawContentUrl: string;
  processingStatus: 'pending' | 'extracted' | 'classified' | 'processed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface Fact {
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

interface FinancialEvent {
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

interface Evidence {
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
```

**These interfaces are production-ready** — they include all fields needed for the vertical slice (sourceId, documentId, pageNumber, paragraphNumber, extractionConfidence, excerpt).

---

## 3. The Gap Map — What's Needed for the Vertical Slice

### 3.1 What exists vs what's needed

| Vertical Slice Step | Exists? | What's needed |
|---|---|---|
| Source registration | ✅ API + DB + 36 sources | Use existing sources (ECB, BoE, Fed, BoC, RBA) |
| **Fetch** (RSS/HTML → raw content) | ❌ | HTTP fetcher module (fetch URL, store raw content) |
| **Document normalization** (raw → structured text) | ❌ | HTML parser + text extraction (no PDF needed for central bank RSS) |
| **Fact extraction** (text → financial metric) | ❌ | Rules-based extractor for monetary policy decisions (rate value, decision type) |
| **Event detection** (fact → categorized event) | ❌ | Event classifier (rate_decision, rate_maintain, rate_hike, rate_cut) |
| **Evidence record** (fact + source + doc + location + confidence) | ❌ | Evidence builder (create Evidence record linking fact to document) |
| **Provenance** (source → document → fact → evidence chain) | ❌ | Provenance chain builder (construct traceable chain) |
| **Intelligence Object** (structured output with embedded evidence) | ❌ | IO generator (create final output artifact) |
| **Buyer-visible output** (human-readable intelligence) | ❌ | Output formatter (render IO as readable intelligence brief) |

### 3.2 What DOESN'T need to be built for the vertical slice

- ❌ Knowledge Graph (entity relationships, cross-source reasoning)
- ❌ AI/LLM (deterministic rules first — per user direction)
- ❌ All source types (only central bank press releases)
- ❌ All intelligence products (only market/investment)
- ❌ Full governance framework (minimal validation only)
- ❌ Customer environment deployment
- ❌ API distribution (output is a file, not API)
- ❌ Web frontend (output is a file or console output)

### 3.3 The abstraction test

Per user direction: "If we need to write a parser or extractor specific to each bank, the design has failed."

**The vertical slice must use:**
1. A **generic fetcher** that takes a URL/feed and returns raw content
2. A **generic HTML-to-text normalizer** that works across central bank websites
3. A **rules-based extractor** that identifies rate decisions from text (not bank-specific)
4. A **generic event classifier** that categorizes based on extracted facts
5. A **generic evidence builder** that links facts to documents

**Configuration (per source) is allowed:**
- Feed URL
- CSS selectors for content extraction (if HTML structure varies)
- Field mapping (which text patterns indicate rate value, decision type)

**Source-specific code is NOT allowed:**
- `if (source.code === 'ECB') { ... }` — FAIL
- Custom parser per bank — FAIL
- Bank-specific regex that can't generalize — FAIL

---

## 4. Proposed Implementation Approach

### 4.1 Where to build it

**Option A: In the NestJS backend (TypeScript)**
- Pros: Same language as Layer 1, shares TypeORM + entities, can add API endpoints
- Cons: Needs pnpm + PostgreSQL running, heavier setup

**Option B: In the Python intelligence service**
- Pros: Better NLP/extraction ecosystem, already scaffolded (FastAPI), shares DB
- Cons: Stub only, would need SQLAlchemy setup, Python+TS split

**Option C: Standalone Python script (simplest)**
- Pros: Can run immediately with Python3 (available), no Docker/DB needed, fastest to iterate
- Cons: Not integrated with the NestJS backend, would need migration later
- Use SQLite or JSON files for storage during Phase A

**Recommendation: Option C for Phase A** — build a standalone Python pipeline that:
1. Fetches RSS/HTML from central bank feeds
2. Parses and normalizes content
3. Extracts facts using rules
4. Detects events
5. Builds evidence records
6. Generates Intelligence Objects
7. Outputs buyer-visible intelligence as JSON + human-readable text

**This is the fastest path to proving the vertical slice works.** Integration with the NestJS backend happens after Phase A proves the pipeline.

### 4.2 The pipeline as a Python script

```
pipeline/
├── fetcher.py          # Fetch RSS/HTML from source URL
├── normalizer.py       # HTML → structured text (title, date, body, paragraphs)
├── extractor.py        # Rules-based fact extraction (rate value, decision type)
├── detector.py         # Event detection (rate_maintain, rate_hike, rate_cut)
├── evidence.py         # Evidence record builder (fact + source + doc + location)
├── provenance.py       # Provenance chain builder (source → doc → fact → evidence)
├── intelligence_object.py  # IO generator (structured output)
├── output.py           # Buyer-visible output formatter (JSON + text)
├── config.py           # Source configuration (URLs, selectors, patterns)
└── run_pipeline.py     # Main runner: takes source code, runs full pipeline
```

### 4.3 Configuration model (per source)

```python
SOURCE_CONFIGS = {
    "ECB": {
        "feed_url": "https://www.ecb.europa.eu/rss/press.xml",
        "content_selectors": {".title": "title", ".date": "publishedAt", ".body": "content"},
        "rate_patterns": [r"maintained.*?(?:three key interest rates|key ECB interest rates)",
                          r"(?:maintained|kept).*?(\d+\.\d+).*?percent"],
        "event_type": "monetary_policy_decision",
    },
    "BOE": {
        "feed_url": "https://www.bankofengland.co.uk/rss/news",
        # ... similar config
    },
    # ...
}
```

**Key: the config contains URLs + patterns. The CODE is generic.** If a new central bank needs a different pattern, we add it to the config — not to the code.

---

## 5. Definition of Done — Phase A

### 5.1 Per source (5 central banks)

| Metric | Required |
|---|---|
| Fetch success | 5/5 |
| Document normalization | 5/5 |
| Fact extraction | ≥4/5 |
| Event detection | ≥4/5 |
| Evidence generation | ≥4/5 |
| Provenance completeness | 5/5 |
| Intelligence Object | ≥4/5 |
| Manual engineering | 0 source-specific code |
| Reproducibility | 100% (re-running produces same output) |

### 5.2 The traceability test

For each Intelligence Object, a reviewer must be able to trace:

```
IO → Evidence → Fact → Document → Official Source (with live URL)
```

Each link must carry:
- source identity (name + code + URL)
- canonical URL (clickable, verifiable)
- document identity (title + publication date + URL)
- extracted value (the financial metric)
- evidence location/span (paragraph number + excerpt)
- event classification (rate_maintain, rate_hike, etc.)
- confidence/status (extraction confidence + validation status)
- provenance (full chain preserved)

### 5.3 The abstraction test

After running all 5 sources, count:
- **Configuration entries:** URLs, selectors, patterns → expected: ~5 per source
- **Reusable engineering:** generic improvements → expected: 0-2 across all 5
- **Source-specific code:** `if source == X` → expected: **0**

If source-specific code > 0 → design has failed, even if results are 5/5.

---

## 6. What's Ready to Start

### 6.1 Available now

- ✅ Python 3 (runtime available)
- ✅ Source Registry data (36 sources with real URLs — in seed-data.ts, can extract to JSON)
- ✅ TypeScript type definitions (can use as schema reference)
- ✅ 5 target sources identified (ECB, BOE, FED, BOC, RBA — all seeded with feed URLs)
- ✅ Clear Definition of Done

### 6.2 What needs to happen

1. Extract the 5 target source configs from `seed-data.ts` to Python config
2. Build `fetcher.py` — HTTP fetcher for RSS feeds
3. Build `normalizer.py` — RSS/HTML parser to structured text
4. Build `extractor.py` — rules-based fact extraction
5. Build `detector.py` — event classification
6. Build `evidence.py` — evidence record creation
7. Build `provenance.py` — provenance chain
8. Build `intelligence_object.py` — IO generation
9. Build `output.py` — buyer-visible output
10. Run on 5 sources, measure results

### 6.3 What does NOT need to happen first

- ❌ Install Docker/PostgreSQL (not needed for standalone Python pipeline)
- ❌ Install pnpm (not needed for Python)
- ❌ Write NestJS modules (integration comes after Phase A proves the pipeline)
- ❌ Write database migrations (JSON files or SQLite for Phase A)
- ❌ Build a web UI (console output + JSON files for Phase A)

---

## 7. Entry Point

The entry point for implementation is:

**`/home/z/my-project/scripts/pipeline/`** — a standalone Python pipeline directory that:
1. Reads source configurations from a JSON file (extracted from seed-data.ts)
2. Fetches RSS feeds from 5 central banks
3. Processes each new publication through the full pipeline
4. Outputs Intelligence Objects as JSON + human-readable text files
5. Records all 12 metrics per source for Phase A scoring

**No Docker. No PostgreSQL. No NestJS. No pnpm.** Just Python + HTTP + rules + output.

---

*End of Vertical Slice Architecture & Runtime Audit. Ready for implementation. No code modified.*
