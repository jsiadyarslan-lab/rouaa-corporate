# ROUAA Cross-Product Integration Implementation Plan V1 — News Dual-Pipeline Architecture Clarification

**Status:** ARCHITECTURE CLARIFICATION — documentation only
**Date:** 2026-08-17
**Directive:** EXECUTION DIRECTIVE — NEWS DUAL-PIPELINE ARCHITECTURE CLARIFICATION V1 (user-issued verbatim)
**Discipline:** Documentation only. No code changes. No News code modifications. No Core runtime modifications. No import of 1500 sources. No Railway deployment. No API creation. No database schema changes. No removal of any registry.

---

## 0. Old Ambiguity

The prior ecosystem architecture (Foundation 54, Section 3.2) modeled "News Intelligence Platform" as a single consumer of the Intelligence Engine. This created an ambiguity: it was unclear whether the Core's official-source intelligence and News's global media aggregation were the same pipeline or different pipelines, and unclear how 1500+ official sources relate to news article production.

This document corrects the ambiguity by explicitly modeling **TWO distinct production pipelines** within ROUAA News.

---

## 1. Two-Pipeline Model

### Pipeline A — Global News Aggregation

**Owner:** ROUAA News (product-local)

**Purpose:**
- Global news coverage
- Media / news feed aggregation
- Translation (multilingual media)
- Sentiment analysis
- Impact assessment
- AI-powered analysis
- Article generation
- SEO optimization
- Publication

**Conceptual flow:**
```text
Global Media / News Sources (non-official feeds, wire services, media outlets)
        ↓
ROUAA News Ingestion (product-local)
        ↓
Translation / AI Analysis
        ↓
Editorial Pipeline
        ↓
Publication
```

**Key properties:**
- The Core does NOT replace this pipeline.
- Non-official news feeds remain product-local unless separately classified.
- This pipeline is **independently operational** — it does NOT depend on the Core's availability.
- This pipeline aggregates, analyzes, and publishes news from global media sources — it does NOT produce original intelligence from official primary sources.

---

### Pipeline B — Official Financial Intelligence Wire

**Owner:** Core produces canonical intelligence; News owns the editorial transformation

**Purpose:**
> Generate original/exclusive financial intelligence and stories from authoritative official sources.

**Flow:**
```text
1500+ Official Sources
        ↓
Core Source Registry
        ↓
Qualification (Gates 1-4 + Content-Path + Config Contract + Semantic)
        ↓
Activation / Monitoring
        ↓
Documents (acquired via Core adapters)
        ↓
Facts / Events (extracted + detected by Core)
        ↓
Evidence / Provenance (built by Core)
        ↓
Canonical IntelligenceObjects (produced by Core)
        ↓
News Exclusive Intelligence Wire (News-side consumer)
        ↓
Research / Analysis / Writing / Fact Check (News editorial)
        ↓
Publication
```

**Key properties:**
- The Core does NOT generate article prose.
- News owns the editorial transformation (IntelligenceObject → story candidate → published article).
- The Core produces canonical, verifiable intelligence; News transforms it into editorial content.
- Every story produced from this pipeline is evidence-backed with full provenance to official primary sources.

---

## 2. Pipeline Independence

```text
Pipeline A (Global News)          Pipeline B (Official Intelligence Wire)
         │                                    │
    Independent operational            Depends on Core
    Does NOT need Core                 Core must be available
    Can run if Core is down            Produces exclusive content
```

**Critical rule:**
> The Global News pipeline remains operational if Core is unavailable. The Core is an enrichment/primary-evidence path, not a hard dependency for generic global news coverage.

---

## 3. 1500+ Source Import Model

### Source lifecycle

```text
SOURCE FILE
    → IMPORT
    → DISCOVERED
    → ENTITY VERIFIED
    → CONTENT PATH QUALIFIED
    → CONFIGURATION VERIFIED
    → ACTIVATED
    → MONITORED
    → INTELLIGENCE ROUTED
```

**Explicit rule:**
> Presence in the 1500+ source file does NOT mean the source is active.

A source in the file is `DISCOVERED` — it has been identified and imported into the registry. It must pass through qualification (Gates 1-4 + v2 stages) before it becomes `ACTIVATED`. Only `ACTIVATED` sources are `MONITORED` and produce intelligence.

### Lifecycle stages

| Stage | Meaning | What happens |
|-------|---------|---------------|
| SOURCE FILE | Raw source record exists in the 1500+ file | Institution name, domain, class recorded |
| IMPORT | Source record imported into Core Source Registry | Registry entry created |
| DISCOVERED | Source is in the registry but not yet qualified | No probing attempted |
| ENTITY VERIFIED | Entity resolution confirmed (hostname → institution → jurisdiction → class → ownership) | `bmf.de` precedent: hostname may not match expected entity |
| CONTENT PATH QUALIFIED | Content-path alignment verified (v2 Content-Path Alignment stage) | Selected path contains the expected intelligence type |
| CONFIGURATION VERIFIED | Configuration Contract verified (v2 Configuration Contract Verification) | event_type supported + pattern metrics in trigger_metrics |
| ACTIVATED | Source passes all qualification stages and is activated for monitoring | Core begins monitoring the source |
| MONITORED | Core actively acquires documents from this source | Documents flow through the pipeline |
| INTELLIGENCE ROUTED | Produced IntelligenceObjects are routed to product consumers | Routing criteria are product-specific |

---

## 4. Source Activation Model

### Progressive activation — no mass activation

The Core activates sources **progressively**, not in bulk. Each source must individually pass through the qualification lifecycle before activation.

### Per-source record

Each activated source record includes:

| Field | Description |
|-------|-------------|
| Institution | Official institution name |
| Legal entity | Resolved legal entity (not just hostname) |
| Domain | Primary domain (e.g., `www.bundesbank.de`) |
| Jurisdiction | Country / region of authority |
| Institutional class | B1-B9 classification (per Global Source Universe V1) |
| Content path | Qualified content path (RSS feed URL, HTML index URL, or PDF URL) |
| Acquisition method | Adapter class (direct-http, rendering, document-repository) |
| Expected intelligence types | Event types this source is expected to produce |
| Monitoring policy | Polling frequency, alerting rules |
| Health | Current health status (healthy, degraded, blocked) |
| Product relevance | Which products should receive intelligence from this source |

---

## 5. Intelligence Routing

### The Core does NOT send every document to every product

Routing occurs **after intelligence creation** — not at the document level.

```text
Source Universe
      ↓
Core (acquire → normalize → extract → detect → evidence → IntelligenceObject)
      ↓
Canonical IntelligenceObjects
      ↓
Routing
  ┌───┼────┐
  ↓   ↓    ↓
News Trading Corporate
```

**Routing criteria are product-specific:**
- News: relevance to editorial coverage scope (e.g., enforcement actions, monetary policy decisions, statistical releases with market impact)
- Trading: real-time rate decisions, market-moving statistics
- Corporate: regulatory changes, compliance-relevant enforcement

**Key rule:**
> A document acquired by the Core may produce zero, one, or multiple IntelligenceObjects. Only IntelligenceObjects that match a product's routing criteria are delivered to that product.

---

## 6. News Exclusive Wire

### Definition

The News Exclusive Wire is a **distinct consumer layer** within ROUAA News that consumes canonical Core intelligence and transforms it into editorial content.

### Input (from Core)

The Exclusive Wire receives:
- IntelligenceObject (canonical, with quality threshold met)
- Event (categorized, with subtype)
- Facts (extracted, with excerpts and confidence)
- Evidence (justifying chain — document location, excerpt, reproduction)
- Provenance (source-of-record metadata — original value, UTC normalization, source URL, document identity)
- Document references (live URLs to official source documents)
- Temporal semantics (original timestamp, normalization, ordering class)
- Version (supersession state — current vs superseded)

### Output (News-owned editorial transformation)

The Exclusive Wire transforms Core intelligence into:
- Story candidates (draft article concepts based on IntelligenceObjects)
- Research context (assembled evidence for editorial teams)
- Exclusive reports (original reporting based on primary-source intelligence)
- Analytical articles (analysis built on verified facts and events)

### Contract rule

> The News Exclusive Wire must NOT modify canonical Core truth. It may interpret, analyze, and editorialize — but the Core's IntelligenceObjects, Facts, Events, and Evidence remain canonical and immutable.

---

## 7. Global News + Official Intelligence Enrichment

### Optional convergence

```text
Pipeline A: Global News Article (from media sources)
                    +
Pipeline B: Official Core Intelligence (from official sources)
                    ↓
        Verified / Enriched Editorial Context
```

**Purpose:** A global news article about a central bank decision can be enriched with the Core's primary-source IntelligenceObject — verifying the article's claims against official evidence and adding provenance links.

**Key properties:**
- This convergence is **optional** — not every global news article needs Core enrichment.
- The Global News pipeline remains **fully operational** without the Core.
- The Core provides **primary-source verification and enrichment** — not a hard dependency.
- Enrichment does NOT modify the global news article's editorial independence; it adds a verification layer.

---

## 8. Core → News Contract

The News contract now has **TWO distinct consumers**:

### Consumer A — Exclusive Intelligence Wire

- **Input:** Canonical IntelligenceObjects from the Core
- **Purpose:** Original/exclusive financial intelligence reporting
- **Dependency:** Requires Core availability
- **Output:** Story candidates, exclusive reports, analytical articles

### Consumer B — Optional Enrichment / Verification Services for Global News

- **Input:** Global news articles (from Pipeline A) + Core IntelligenceObjects (from Pipeline B)
- **Purpose:** Verify and enrich global news with primary-source evidence
- **Dependency:** Optional — Global News operates independently if Core is unavailable
- **Output:** Verified/enriched editorial context

**Implementation status:** Neither consumer is implemented yet. This document defines the architectural contract only.

---

## 9. Commercial Value Distinction

### Global News Pipeline (Pipeline A)

| Value dimension | Description |
|-----------------|-------------|
| Breadth | Global media coverage across all financial topics |
| Speed | Real-time aggregation from wire services and media feeds |
| Multilingual coverage | Translation and analysis across multiple languages |
| Media aggregation | Consolidation of reporting from multiple outlets |

### Official Intelligence Wire (Pipeline B)

| Value dimension | Description |
|-----------------|-------------|
| Primary-source advantage | Original intelligence from 1500+ official sources — not available from media aggregation |
| Evidence-backed exclusivity | Every story is backed by verifiable provenance to official documents |
| Original reporting | Stories that no media outlet has — because they are generated from primary sources, not secondary reporting |
| Auditability | Full traceability chain from published article → IntelligenceObject → Fact → Evidence → Document → Official Source |
| Institutional credibility | Sources are central banks, financial regulators, statistical agencies, ministries of finance |

**No revenue claims or unsupported commercial metrics are introduced by this document.**

---

## 10. 1500+ Source Rollout Operating Model

```text
1500+ Registry
      ↓
Wave Qualification (progressive, per-source lifecycle)
      ↓
Activated Sources (subset of 1500+ that passed qualification)
      ↓
Core Monitoring (active acquisition from activated sources)
      ↓
New Intelligence (IntelligenceObjects produced)
      ↓
News relevance filter (product-specific routing criteria)
      ↓
Story candidate (editorial transformation)
```

**Critical rule:**
> Do NOT equate `1500 sources` with `1500 news stories`. 1500 sources produce IntelligenceObjects; only a subset of those IntelligenceObjects match News routing criteria; only a subset of matched IntelligenceObjects become story candidates; only a subset of story candidates become published articles.

The ratio of sources to stories is NOT 1:1. It is determined by:
1. How many sources pass qualification (subset of 1500+)
2. How many produce IntelligenceObjects (subset of activated)
3. How many IntelligenceObjects match News routing (subset of produced)
4. How many story candidates are editorially selected (subset of candidates)

---

## 11. Sections Changed

This is a **new document** — there was no prior `ROUAA_CROSS_PRODUCT_INTEGRATION_IMPLEMENTATION_PLAN_V1.md`. The prior ambiguity (single "News Intelligence Platform" consumer in Foundation 54, Section 3.2) is resolved by this document's explicit two-pipeline model.

### Summary of what changed

| # | What changed | Old ambiguity | New model |
|---|-------------|----------------|-----------|
| 1 | Two-pipeline model | "News Intelligence Platform" was a single consumer — unclear if Core intelligence and News media aggregation were the same or different | Pipeline A (Global News Aggregation) + Pipeline B (Official Financial Intelligence Wire) — explicitly distinct |
| 2 | 1500+ Source Import Model | No lifecycle defined — unclear how 1500+ sources relate to active production | 9-stage lifecycle from SOURCE FILE to INTELLIGENCE ROUTED; presence ≠ active |
| 3 | Source Activation | No activation model — unclear if all sources are active | Progressive activation with per-source record; no mass activation |
| 4 | Intelligence Routing | No routing model — unclear if Core sends everything to every product | Routing after intelligence creation; product-specific criteria |
| 5 | News Exclusive Wire | No consumer-layer definition — unclear what News receives from Core | Distinct consumer layer with defined input (IntelligenceObject + Evidence + Provenance) and output (story candidates, exclusive reports) |
| 6 | Core → News Contract | Single consumer — no distinction between exclusive wire and enrichment | Two consumers: A (Exclusive Wire) + B (Optional Enrichment) |
| 7 | Global News + Official Intelligence convergence | No convergence model — unclear if the two pipelines interact | Optional enrichment convergence; Global News independently operational |
| 8 | Commercial Value | No value distinction — unclear what each pipeline's value is | Pipeline A = breadth/speed/multilingual; Pipeline B = primary-source/exclusivity/auditability |
| 9 | 1500+ Source Rollout | No rollout model — unclear how sources become stories | Wave Qualification → Activated → Monitoring → Intelligence → News filter → Story candidate |

---

## 12. Confirmation — No Code Changed

This document is **documentation only**. Specifically:

- ❌ No 1500 sources imported
- ❌ No Core connected to News
- ❌ No News ingestion changed
- ❌ No registry removed
- ❌ No Railway deployment
- ❌ No APIs created
- ❌ No database schemas modified
- ❌ No Core runtime code modified
- ❌ No News code modified

---

## 13. Next Implementation Stage

The next implementation stage remains:

> `Phase 1 — Core Contract Adapter + News Read-Only + Dual-Run`

But it must be implemented specifically against **Pipeline B — Official Financial Intelligence Wire**, while Pipeline A remains independently operational.

---

## 14. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-17 |
| Branch | `top20-prescreening` |
| Status | Architecture clarification — documentation only |
| Directive | EXECUTION DIRECTIVE — NEWS DUAL-PIPELINE ARCHITECTURE CLARIFICATION V1 |
| Type | Documentation only — no code, no implementation, no deployment |
| Prior ambiguity | Foundation 54, Section 3.2 modeled "News Intelligence Platform" as single consumer |
| New model | Two-pipeline: Pipeline A (Global News Aggregation) + Pipeline B (Official Financial Intelligence Wire) |
| Does NOT modify | Core runtime, News code, pipeline/config, database schemas, Railway, APIs, any frozen artifact |
