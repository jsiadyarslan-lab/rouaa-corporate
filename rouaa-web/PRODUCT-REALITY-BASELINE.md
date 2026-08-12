# Product Reality Baseline — A/B/C Classification

> **Status:** Internal baseline document. **No code modified. No website changes.**
> **Subject:** Separate what is Implemented (A) from what is Demonstrated (B) from what is Planned (C)
> **Per user direction:** "These three must never be confused again."
> **Baseline:** `40186e5` (Gate 3 Readiness Audit — RED)
> **Date:** 2026-08-12

---

## 1. The A/B/C Classification Rule

| Classification | Meaning | Test |
|---|---|---|
| **A — Implemented** | Exists in runtime code, works end-to-end, can be executed today | Can I run it and get a result? |
| **B — Demonstrated** | Shown on the website or in sample data, but NOT produced by the running system | Is this a static HTML artifact? |
| **C — Planned** | Described in architecture/roadmap/docs, but no code exists | Is there code for this? |

**Governance rule:** No claim may be presented as A unless it passes the test. B and C are honest — but they must not be confused with A.

---

## 2. Layer-by-Layer Classification

### Layer 1 — Source Registry

| Component | Classification | Evidence |
|---|---|---|
| Source CRUD API (create, read, update, deprecate) | **A — Implemented** | `backend/src/modules/sources/sources.service.ts` — full CRUD with TypeORM |
| Source classification (type, jurisdiction, trust tier, authority level) | **A — Implemented** | `source.entity.ts` — enum fields with validation |
| Source health tracking (entity + initial record) | **A — Implemented** | `source-health.entity.ts` — created on source creation |
| Source health monitoring (active polling, failure tracking) | **C — Planned** | README: "monitoring worker will be added in Sprint 2 per Epic 04" |
| 36 seeded sources (Federal Reserve, ECB, BoE, BoJ, PBOC, SEC, etc.) | **A — Implemented** | `seed-data.ts` — 36 sources with real URLs, feed URLs, API URLs |
| 411+ sources | **B — Demonstrated** | Website claims 411+; codebase seeds 36. The other 375+ are not in the seed file. |
| Source Registry Explorer (21 sources with detail views) | **B — Demonstrated** | `source-explorer.html` — static HTML, not connected to the API |
| Source Registry website page | **B — Demonstrated** | `source-registry.html` — static HTML describing the registry |

**Layer 1 verdict: A (partially) — CRUD + 36 sources work; health monitoring + 411+ scale = C/B**

---

### Layer 2 — Document Intelligence

| Component | Classification | Evidence |
|---|---|---|
| Document type definitions | **A — Implemented** | `shared-types/src/index.ts` — `DocumentType` enum defined |
| Document entity (interface) | **A — Implemented** | `shared-types/src/index.ts` — `Document` interface with all fields |
| Document database table | **C — Planned** | No migration for documents table exists — only `sources` + `source_health` |
| Document fetcher (URL → raw content) | **C — Planned** | No fetcher code anywhere in the codebase |
| Document parser (PDF → text) | **C — Planned** | No PDF parsing code |
| Document parser (HTML → structured text) | **C — Planned** | No HTML parsing code |
| Document classification | **C — Planned** | No classification code |
| Document metadata normalization | **C — Planned** | No normalization code |
| Aramco document in evidence-explorer | **B — Demonstrated** | Static HTML showing what a parsed document would look like |
| FOMC document in evidence-explorer | **B — Demonstrated** | Static HTML |

**Layer 2 verdict: C (almost entirely) — types defined, no implementation**

---

### Layer 3 — Financial Fact Engine

| Component | Classification | Evidence |
|---|---|---|
| Fact type definitions | **A — Implemented** | `shared-types/src/index.ts` — `Fact` interface |
| Fact database table | **C — Planned** | No migration |
| Fact extraction (from document → financial metric) | **C — Planned** | No extraction code |
| Extraction confidence scoring | **C — Planned** | No confidence scoring code |
| Source-to-fact linkage (provenance) | **C — Planned** | No linkage code |
| Fact validation rules | **C — Planned** | No validation code |
| Aramco fact ($33.6B adjusted net income) | **B — Demonstrated** | Static HTML in evidence-explorer + investment-intelligence hero |
| FOMC fact (rates maintained) | **B — Demonstrated** | Static HTML |

**Layer 3 verdict: C (almost entirely) — types defined, no implementation**

---

### Layer 4 — Event Engine

| Component | Classification | Evidence |
|---|---|---|
| Event type definitions | **A — Implemented** | `shared-types/src/index.ts` — `FinancialEvent` interface |
| Event database table | **C — Planned** | No migration |
| Event detection (from facts → categorized event) | **C — Planned** | No detection code |
| Event classification (rate decision, earnings, sanctions, etc.) | **C — Planned** | No classification code |
| FOMC event in evidence-explorer | **B — Demonstrated** | Static HTML |
| OFAC event in evidence-explorer | **B — Demonstrated** | Static HTML |

**Layer 4 verdict: C (almost entirely) — types defined, no implementation**

---

### Layer 5 — Evidence & Provenance

| Component | Classification | Evidence |
|---|---|---|
| Evidence type definitions | **A — Implemented** | `shared-types/src/index.ts` — `Evidence` interface |
| Evidence database table | **C — Planned** | No migration |
| Provenance chain (fact → document → page → paragraph) | **C — Planned** | No provenance code |
| Evidence record generation | **C — Planned** | No evidence generation code |
| Aramco evidence chain (7 steps) | **B — Demonstrated** | Static HTML in evidence-explorer |
| OFAC evidence chain (7 steps) | **B — Demonstrated** | Static HTML |
| Evidence Chain visual on product pages | **B — Demonstrated** | Static HTML diagrams |

**Layer 5 verdict: C (almost entirely) — types defined, no implementation**

---

### Layer 6 — Governed Reasoning

| Component | Classification | Evidence |
|---|---|---|
| Governance rules engine | **C — Planned** | No code |
| Validation gates | **C — Planned** | No code |
| Confidence thresholds | **C — Planned** | No code |
| Audit trail generation | **C — Planned** | No code |
| Methodology documentation | **B — Demonstrated** | `methodology.html` — documents the process, no running implementation |
| Trust Framework documentation | **B — Demonstrated** | `trust-framework.html` — documents the framework, no running implementation |

**Layer 6 verdict: C (entirely) — no implementation**

---

### Layer 7 — Intelligence Distribution

| Component | Classification | Evidence |
|---|---|---|
| Intelligence Object generation | **C — Planned** | No code |
| Workflow engine | **C — Planned** | No code |
| Output delivery (API, dashboard, report) | **C — Planned** | No code |
| Sample Intelligence Outputs (6 samples) | **B — Demonstrated** | `sample-library.html` — static HTML, hand-crafted |
| Product page outputs (capabilities, "What You Receive") | **B — Demonstrated** | Static HTML descriptions |
| API endpoints (7 representative) | **B — Demonstrated** | `developers.html` — static HTML, representative not contract |

**Layer 7 verdict: C (entirely) — no implementation**

---

### Infrastructure

| Component | Classification | Evidence |
|---|---|---|
| PostgreSQL 16 + pgvector | **A — Implemented** | Docker Compose configured |
| Redis | **A — Implemented** | Docker Compose configured |
| Adminer | **A — Implemented** | Docker Compose configured |
| NestJS backend (port 4000) | **A — Implemented** | Running, health endpoint, sources API |
| Python/FastAPI intelligence service (port 8000) | **A — Partially** | Running, but only health + stub sources router |
| React frontend (Vite, port 5173) | **A — Implemented** | Dashboard + Sources list + detail |
| Docker Compose local dev | **A — Implemented** | One-command setup |

---

### Cross-Layer: Evidence Explorer + Sample Library

| Component | Classification | Evidence |
|---|---|---|
| Aramco Q1 2026 evidence chain (7 steps) | **B — Demonstrated** | Static HTML in `evidence-explorer.html` |
| FOMC July 29 2026 evidence chain | **B — Demonstrated** | Static HTML |
| OFAC sb0581 evidence chain | **B — Demonstrated** | Static HTML |
| FOMC Media evidence chain | **B — Demonstrated** | Static HTML |
| 6 sample intelligence outputs | **B — Demonstrated** | Static HTML in `sample-library.html` |
| "What You Can Verify" units (Pilot Evidence) | **B — Demonstrated** | Static HTML — verifies that the CONCEPT is sound, not that the system produced it |
| Infrastructure report (operational status) | **B — Demonstrated** | Claims "6/7 layers operational" — but codebase shows only Layer 1 |

---

### Pricing

| Component | Classification | Evidence |
|---|---|---|
| `PRICING-MODEL.md` ($500K–$2.5M/year) | **C — Planned (Commercial hypothesis — unvalidated)** | Document exists, but product is Sprint 0 |

---

## 3. Summary Matrix

| Layer | A (Implemented) | B (Demonstrated) | C (Planned) |
|---|---|---|---|
| 1. Source Registry | CRUD + 36 sources + health entity | 411+ claim, Source Explorer, Source Registry page | Health monitoring worker, 375+ additional sources |
| 2. Document Intelligence | Type definitions | Aramco/FOMC document displays | Fetcher, parser, classifier, DB table |
| 3. Fact Engine | Type definitions | Aramco $33.6B, FOMC rates | Extractor, confidence, validation, DB table |
| 4. Event Engine | Type definitions | FOMC event, OFAC event | Detection, classification, DB table |
| 5. Evidence & Provenance | Type definitions | 7-step evidence chains | Provenance, evidence records, DB table |
| 6. Governed Reasoning | — | Methodology, Trust Framework | Rules engine, validation gates, audit trail |
| 7. Intelligence Distribution | — | 6 samples, API endpoints, product outputs | IO generation, workflow engine, delivery |
| Infrastructure | PostgreSQL, Redis, NestJS, React, Docker | — | Production deployment, monitoring, SLA |
| Pricing | — | — | $500K–$2.5M (unvalidated hypothesis) |

---

## 4. The First Vertical Slice — Scope Definition

Per user direction: "One source class → one complete intelligence workflow"

### 4.1 The minimal end-to-end pipeline

```
Official Source (new, not in seed data)
    ↓
Source Adapter (fetch URL — RSS/HTML/API)
    ↓
Document Normalization (raw → structured text)
    ↓
Fact Extraction (text → financial metric with value + unit + context)
    ↓
Event Detection (fact → categorized event type)
    ↓
Evidence Record (fact + source + document + page/paragraph + confidence)
    ↓
Provenance (source → document → fact → evidence chain)
    ↓
Intelligence Object (structured output with embedded evidence)
    ↓
Buyer-visible output (human-readable intelligence with source link)
```

### 4.2 Every output must carry

| Field | What it is | Why it matters |
|---|---|---|
| Source | Official institution name + URL | Buyer can verify the source exists |
| Document | Publication title + date + URL | Buyer can access the original document |
| Publication date | When the source published | Buyer can assess timeliness |
| Extracted fact | The specific financial metric/value | The intelligence content |
| Evidence span/location | Page + paragraph (or section) | Buyer can find the fact in the source |
| Event | Categorized event type (rate decision, earnings, etc.) | Buyer can classify the intelligence |
| Confidence/status | Extraction confidence + validation status | Buyer can assess reliability |
| Provenance | Full chain: source → document → fact → evidence | Buyer can trace the intelligence to its origin |
| Intelligence Object | Structured output with all above embedded | Buyer receives a complete, governable artifact |

### 4.3 Source class proposal

Start with **central bank press releases** (HTML + RSS):
- Already have 10 central banks seeded in Layer 1
- Press releases are structured HTML — easier to parse than PDFs
- Monetary policy decisions are high-impact events — clear buyer value
- RSS feeds available for most central banks — straightforward fetch

**Proposed first source class:** Central bank monetary policy decisions (HTML/RSS)

### 4.4 What the vertical slice does NOT include

- ❌ Knowledge Graph (entity relationships, cross-source reasoning)
- ❌ All source types (only central banks initially)
- ❌ All intelligence products (only investment/market initially)
- ❌ Full governance framework (minimal validation only)
- ❌ Customer environment deployment
- ❌ API distribution (output is a file/dashboard, not API)

---

## 5. Phased Gate 3 Retest Plan

### Phase A — 5 new sources

**Goal:** Can the pipeline process 5 new central bank sources end-to-end?

**Sources:** 5 central banks NOT in the current seed data (e.g., Central Bank of UAE, Saudi Central Bank, Central Bank of Kuwait, Qatar Central Bank, Central Bank of Bahrain)

**Measure per source:**
- Source registration: Pass/Fail
- Fetch: Pass/Fail (RSS/HTML)
- Document parsing: Pass/Fail
- Fact extraction: Pass/Fail
- Event detection: Pass/Fail
- Evidence generation: Pass/Fail
- Intelligence Object: Pass/Fail
- Manual intervention: None/Analyst/Engineer
- Engineering hours: actual number
- Output quality: Accept/Reject (buyer-grade)

**Success:** 5/5 produce buyer-grade intelligence objects without custom code per source

### Phase B — 10 new sources

**Goal:** Is onboarding configuration (not engineering)?

**Sources:** 10 additional sources across 2-3 types (central banks + regulators)

**Measure:** Same as Phase A, plus:
- Configuration vs. code ratio (how much was config vs. new code?)
- Reusability (did source type B reuse adapters from source type A?)
- Time per source (is it decreasing?)

**Success:** ≥80% configuration, ≤20% new code; time per source decreasing

### Phase C — 30 new sources

**Goal:** Gate 3 official retest

**Sources:** 30 sources across 5+ types (central banks, regulators, statistical agencies, exchanges, corporate IR)

**Measure:** Full 12-stage protocol per source

**Success:** GREEN (≥90% without code changes) or YELLOW (70-89% with controlled onboarding)

---

## 6. Knowledge Graph — Deferred (Not Blocked)

The Knowledge Graph is NOT a blocker for the first vertical slice IF the pilot workflow is:

**Source → Document → Fact → Event → Evidence → Intelligence Object**

This chain does NOT require:
- Entity relationships (company A is subsidiary of company B)
- Cross-source reasoning (source A fact + source B fact = conclusion C)
- Exposure mapping (entity X has exposure to entity Y)

It DOES require:
- Source-to-fact linkage (which source produced this fact)
- Document-to-fact linkage (which document contains this fact)
- Fact-to-evidence linkage (what evidence supports this fact)

**The Knowledge Graph becomes a depth/scalability capability — not a pilot prerequisite.**

If a future pilot workflow requires entity relationships (e.g., "show me all companies exposed to this sanctions designation"), THEN the Knowledge Graph becomes a dependency. But the first pilot can prove core value without it.

---

## 7. Pricing Classification

`PRICING-MODEL.md` is reclassified as:

> **Commercial hypothesis — unvalidated**

The $500K–$2.5M/year numbers are:
- ✅ Internally documented
- ✅ Structurally sound (deployment + scope + governance + support)
- ❌ NOT validated by any customer
- ❌ NOT validated by any pilot
- ❌ NOT defensible without a production system

**The pricing model stays in the repository as an internal hypothesis. It does NOT appear on the website. It does NOT enter commercial conversations until Gate 3 is cleared.**

---

## 8. The Complete Picture

```
WEBSITE: FROZEN ✅
  (excellent explanation + verification instrument)
  (Pilot Evidence units with D8 boundary — honest about what is NOT proven)

COMMERCIAL:
  Positioning: ✅ Fixed
  Buyer model: ✅ Fixed (Sponsor → Deployment Gate)
  Interaction model: ✅ Fixed (Source Review → Evidence Review → Briefing)
  Pilot readiness: 🔴 RED
  Pricing: Internal hypothesis (unvalidated)

PRODUCT:
  Layer 1 (Source Registry): A — Implemented (CRUD + 36 sources)
  Layers 2-7: C — Planned (types defined, no implementation)
  Infrastructure: A — Implemented (Docker, PostgreSQL, Redis, NestJS, React)

NEXT PRIORITY:
  1. Build first vertical slice (one source class → one complete workflow)
  2. Test on 5 new sources (Phase A)
  3. Expand to 10 (Phase B)
  4. Retest Gate 3 on 30 sources (Phase C)
  5. Only then: Gates 4-7 (economics, timeline, first pilot)

GOVERNANCE:
  A/B/C classification must never be confused again.
  No claim may be presented as A unless it passes the runtime test.
  B (Demonstrated) is honest — but must not imply A (Implemented).
```

---

*End of Product Reality Baseline. No code modified. No website changes. Internal document for product engineering planning.*
