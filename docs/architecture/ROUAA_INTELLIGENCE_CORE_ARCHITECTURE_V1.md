# ROUAA INTELLIGENCE CORE ARCHITECTURE V1

**Status:** DESIGN DOCUMENT — architecture definition only
**Date:** 2026-08-15
**Directive:** EXECUTION DIRECTIVE — EVIDENCE CONSOLIDATION V1 → CORE ARCHITECTURE DEFINITION V1 (user-issued verbatim)
**Evidence basis:** `CORE_EVIDENCE_CONSOLIDATION_V1.md` (this commit) and the lineage therein (Q1 `ee7ca83` · Q2 `a72d5d8` · Q3 `c7109ca` · Post-Q3 `f6c5a8b` · frozen contracts dd66cc1/bb3f43a/c02374a · pipeline contracts @ `c7109ca`)
**Discipline:** This phase produces ARCHITECTURE ONLY. No implementation. No Repository 4. No file moves. No pipeline/Event-Model/extractor/fetcher/timestamp/source-config changes. No Railway. No product connections.

---

## A. Purpose — what the Core owns

The ROUAA Intelligence Core owns the **production of canonical, verifiable financial intelligence from official sources**:

1. **Source identity** — entity-resolved registry of institutions (hostname → institution → jurisdiction → class → ownership).
2. **Acquisition** — adapter-class fetching (direct HTTP/RSS; rendering instrument; document/structured repositories) with source-scoped failure isolation.
3. **Document intelligence** — normalize → extract → detect pipeline producing Facts and Events.
4. **Evidence & provenance** — every Fact/Event traceable to document, source, and original temporal value.
5. **Canonical temporal model** — the timestamp semantics contract (Consolidation §D).
6. **Canonical intelligence interface** — the single contract through which products consume intelligence.

The Core is the trust engine: it guarantees WHAT is known, FROM WHERE, SINCE WHEN, and WITH WHAT PROOF.

## B. Non-goals — what remains product-specific

- Product surfaces and UX (News, Trading, Corporate/Institutional front-ends).
- Distribution, publishing channels, notifications, customer management.
- Per-product schemas, views, aggregation policies.
- Marketing/commercial claims logic (contract docs stay separate).
- Per-source hardcoded logic — sources are onboarded through the **configuration contract** (§I), never by modifying Core code (FED_ENF `f16bc00` precedent: remediation is config-only).

## C. Canonical Domain Model

```text
Source → Document → Fact → Event → Evidence → Insight → Publication
```

| Entity | Definition | Invariants / notes |
|---|---|---|
| **Source** | An entity-resolved institution path (NOT a hostname): institution identity, jurisdiction, institutional class, ownership, trust tier, acquisition profile | Identity established before trusted-layer entry (Consolidation §B/§C.1); a hostname may map to a different entity than its abbreviation suggests (bmf.de precedent) |
| **Document** | A retrieved, normalized unit (HTML page, feed item, PDF, XLS row-set) with document identity, source reference, original + normalized timestamps | Carries the full temporal tuple (§F) |
| **Fact** | An extracted metric-value pair with excerpt, confidence, method, role | Current schema base: `schemas.py` Fact; gains temporal tuple reference |
| **Event** | A categorized financial event triggered by Facts matching a type's trigger-metric contract | Types = the 6 `EVENT_TYPE_RULES` + future extensions per §H |
| **Evidence** | The chain justifying a Fact/Event (document location, excerpt, reproduction) | `evidence.py` build/verify semantics |
| **Provenance** | Source-of-record metadata for every temporal and factual claim: original value, semantics, UTC normalization, source URL, document identity | Dual representation mandatory (§F) |
| **Insight** | A knowledge object derived from documents/events that is NOT metric-triggered (analysis, commentary, announcements) | Design answer to the C-classification of the two scoped gaps (Consolidation §E): represented as document/knowledge objects, NOT forced into Event |
| **Publication** | A product-facing rendering of canonical intelligence (Intelligence Object) with quality threshold | Pipeline terminal state PUBLISHABLE |

## D. Acquisition Architecture

```text
Source Registry (entity identity mandatory)
  → Adapter / Fetch Layer (adapter CLASSES)
  → Normalization
```

**Adapter classes** (capability, not per-source code):
1. `direct-http` (RSS/Atom, static HTML, server-rendered HTML) — validated class (FDIC, ISTAT, DFSA, DGT, MoF-EN).
2. `rendering` (JS-shell hydration; soft anti-bot passage) — instrument-validated (LSE dual runs; ministry dual byte-identical runs). **Integration into the pipeline = engineering decision, pending Architecture Review** (currently external instrument evidence only).
3. `document-repository` (dated file trees, XLS/structured files) — acquisition validated (MoF XLS); format-aware parsing UNTESTED.

**Separation rule (Q2/Q3 evidence):** adapter capability vs source-specific behavior. Hard anti-bot (DMO/ShieldSquare under real Chromium) and environment TLS failures (CBUAE) are **source-scoped access states** (BLOCKED / UNMEASURED), never adapter-class failures, and never Core failures (§K).

**Entity Resolution stage (new, mandatory):** before any trusted use — hostname → institution → jurisdiction → class → ownership, with a verification method (imprint/legal-notice check or equivalent). Corrections use the SUPERSEDING EVIDENCE mechanism (Consolidation §B) — never silent overwrites.

## E. Intelligence Pipeline

```text
Document → Facts → Events → Evidence → Provenance → Intelligence Objects
```

State machine (existing, preserved): `PENDING → ACCESSIBLE → DOCUMENTED → EXTRACTED → EVIDENCED → GOVERNED → PUBLISHABLE` (+ BLOCKED/FAILED terminal).

Proven boundaries carried into design:
- **Pattern specificity / terminology variation** live in the configuration layer (regex authoring per source) — config-only remediation PROVEN (FED_ENF); candidate pending (ISTAT).
- **Detection** stays data-driven (`EVENT_TYPE_RULES`); adding types must never require detector branching (existing design preserved).
- **Structured files** (XLS/PDF) require format-aware extraction adapters — boundary documented, UNTESTED.

## F. Temporal Model — CORE DESIGN REQUIREMENT

`CORE DESIGN REQUIREMENT — IMPLEMENTATION NOT STARTED`

Every temporal field carries, at minimum:

```text
original_value          # exact string as observed ("14 August 2026", "07:00:02", "+2.9%")
original_timezone / timezone_status   # explicit zone | explicit offset | naive-local | unspecified | date-only
normalized_utc          # canonical instant (or day-precision when date-only)
timestamp_semantics     # publication | update_modification | document_date | effective_date | reporting_period | date_only | unknown_ambiguous
provenance_source       # which representation the value came from: rss_pubdate | html_time_attr | meta_date | url_date | rendered_text | js_title | filename | file_metadata
```

Confirmed evidence anchors (Consolidation §D): LSE naive rendered times; FDIC dual-class (offset RSS + date-only HTML); ISTAT/DFSA explicit zones; DGT same-source URL/time conflict + naive ISO; ministry feed-vs-display variance; MoF filename dates + XLS serial dates.

Design consequences:
- Cross-jurisdiction event ordering is **only** valid on `normalized_utc` — never on `original_value`.
- Conflicting same-source dates (DGT A1) require per-claim `timestamp_semantics` rather than a single document date.
- `Fact.published_at` (naive string) is superseded in design by this tuple — implementation deferred.

## G. Entity Identity Model

```text
hostname → institution → jurisdiction → institutional class → source ownership
```

- Registry-level identity, verified at onboarding (imprint/legal check or authoritative cross-reference).
- One institution may own multiple hostnames (ministry: long domain = ministry; short domain = unrelated company despite name collision).
- Identity corrections: SUPERSEDING EVIDENCE records with full lineage (Consolidation §B model); history never rewritten, usage restrictions explicit.
- Trust tier + jurisdiction + institutional class attach to the **entity**, not the hostname.

## H. Event Model Boundary

**Current supported scope:** 6 event types with trigger-metric contracts (Q3 §C.1 verbatim). Execution-confirmed: `statistical_release` (ISTAT 2/3). Contract-compatible: LSE earnings candidate, FDIC/DFSA enforcement.

**Scoped representation gaps** (Consolidation §E): policy/economic analysis class (DGT) and fiscal-policy communication class (Ministry) — **classified C-preliminary (DGT) / D (Ministry)**: represented via the **Insight (document/knowledge object)** layer in this architecture, pending Architecture Review and product-scope input. NOT an authorization to add event types.

**Extension points (design, not implementation):**
1. New event types = new `EVENT_TYPE_RULES` entries (data-driven; no detector branching).
2. New trigger metrics on existing types (metric vocabulary extension).
3. Insight-layer objects for non-metric-triggered intelligence (no trigger contract required).
4. Pattern vocabulary (`PATTERN_TYPE_METADATA`) extension for new normalization families.

## I. Configuration Contract

Source-specific configuration MAY control: entity reference, acquisition profile (adapter class + feed/URL + link patterns), content keywords, extraction patterns (regex → pattern_type), event-type binding, path selection, remediation pattern variants.

Configuration may NEVER require: Core code changes, detector branching, schema changes, adapter rewrites (FED_ENF precedent is the proof obligation: 5 facts/3 events/3 IOs from config-only changes).

## J. Governance

- **Provenance:** every Fact/Event/Insight traceable to Document → Source with temporal tuple (§F).
- **Reproducibility:** reproduction commands + SHA-256 for material captured evidence (standard adopted Q3/Post-Q3); dual-run verification for VALIDATED claims (LSE, ministry precedents).
- **Evidence lineage:** commit-anchored chain (Consolidation §A); corrections only via superseding records.
- **Rejection / insufficient-evidence states:** INCONCLUSIVE (access-blocked — not failure evidence), UNMEASURED (no response), BLOCKED (infrastructure constraint) — zero-inference preserved, never converted to capability claims.
- **Audit trail:** state transitions per source; integrity events (misattribution corrections) recorded as first-class evidence.

## K. Failure Isolation

- A source failure (anti-bot block, TLS failure, feed outage, zero facts) moves THAT SOURCE to BLOCKED/FAILED/INCONCLUSIVE — the Core and all other sources continue (DMO/CBUAE precedents: zero impact on other cases).
- Adapter classes are independent: rendering-instrument unavailability must not affect direct-http sources.
- No cross-source inference from a single source's failure (Rule: per-case evidence only).

## L. Product Interface

Conceptual only — **not built**:

```text
ROUAA Intelligence Core
        ↓
canonical intelligence API (Events + Facts + Insights + Provenance + temporal tuples)
        ↓
News  ·  Trading  ·  Corporate / Institutional
```

Products consume canonical intelligence; they never fetch sources directly and never own provenance. The API boundary carries the trust contract (what the Core guarantees — §A) and nothing product-specific (§B).

## M. Repository Boundary (design — Repository 4 NOT created)

**Moves into the fourth repository eventually:** the Core — source registry + entity resolution, adapter classes, normalization, extraction/detection contracts, evidence/provenance engine, temporal model, canonical API contract, their tests, and the frozen contracts they implement (Registry/Framework evidence contracts, SUPPORTED_SOURCE_CONTRACT lineage).

**Stays out:** product applications (News/Trading/Corporate surfaces), the corporate website, commercial positioning documents, product-specific configurations of presentation, mvp application shells (apps/backend web layers) — superseded by or integrated around the Core at extraction time.

**Extraction criterion:** the Institutional Buyer Simulation gate (final readiness) — before extraction, the Core must survive the full cycle: official source → trusted intelligence → external platform consumer.

---

## N. Core Readiness Questions (explicit answers)

1. **Minimum Core?** Registry + entity resolution + one adapter class (direct-http) + pipeline contracts (extract/detect) + evidence/provenance + temporal tuple design + canonical API contract. Rendering adapter and structured-file adapters are extensions, not minimum.
2. **Experimental tooling?** The rendering instrument usage (currently external), pattern-diagnostic scripts (Phase B/FED_ENF tools), ISTAT-style remediation experiments.
3. **Product-specific?** Everything in §B — surfaces, distribution, per-product schemas.
4. **Must be reusable?** The domain model (§C), temporal model (§F), entity model (§G), configuration contract (§I), evidence standards (§J) — reusable across all products and future sources.
5. **Must be independently deployable?** The Core (as a unit) — so products can consume it without coupling to any product's release cycle; adapter classes independently toggleable.
6. **Canonical data?** Sources, Documents, Facts, Events, Evidence, Provenance, Insights, temporal tuples — owned by the Core, consumed read-only by products.
7. **Who owns the database?** The Core owns the canonical store (entities in §C). Products own their own view/presentation stores, never canonical truth.
8. **Where does provenance live?** Inside the Core, attached to every Fact/Event/Insight and every temporal claim (§F/§J); products receive it, never generate it.
9. **API boundary?** The canonical intelligence interface (§L): canonical entities + provenance + temporal tuples; excludes product semantics, fetching, and any source-direct access.
10. **Proven before extraction into Repository 4?** (a) Architecture Review of THIS document; (b) Core Engine selection/build + validation per the agreed sequence; (c) **Institutional Buyer Simulation passed end-to-end** (official source → trusted intelligence delivered to an external platform, auditable output). All three, no exceptions.

---

**Architecture definition complete. DESIGN ONLY — implementation not started. Next phase per directive: Architecture Review → Core Engine Selection/Build → Validation. Institutional Buyer Simulation remains the final readiness gate.**
