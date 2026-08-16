# ROUAA INTELLIGENCE CORE ARCHITECTURE REVIEW V1

**Status:** ARCHITECTURE REVIEW — CRITICAL EVALUATION (additive only)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — ROUAA INTELLIGENCE CORE ARCHITECTURE REVIEW V1 (user-issued verbatim)
**Reviewed objects:** `docs/architecture/ROUAA_INTELLIGENCE_CORE_ARCHITECTURE_V1.md` + `docs/evidence/CORE_EVIDENCE_CONSOLIDATION_V1.md` @ `a45bd07`
**Frozen inputs verified present and unmodified at HEAD:** Registry V1 · Design Constraints V1 · Decision Framework V1 · Qualification V2 · Global Source Universe · Strategic Decision Record · Q1 · Q2 · Q3 · Post-Q3 · Consolidation V1 · Architecture V1 (12/12).
**Discipline:** Review only. No build, no Repository 4, no code moves, no refactors, no frozen modifications, no framework selection, no Event-Model/timestamp/adapter changes, no simulation execution.

---

## A. Executive Verdict

The architecture is **evidence-grounded and directionally sound** — every boundary in V1 cites commit-anchored evidence, and the config-never-code, adapter-vs-source-behavior, and superseding-correction principles are proven, not aspirational.

**However, the review finds 3 unresolved P0-level architectural questions and 7 P1-level contract gaps.** Two of the P0s sit inside the canonical domain model itself (document identity/correction semantics; the Insight object's status). Per the build-authorization rule (no unresolved P0; all canonical domain objects sufficiently defined; simulation requirements covered), the verdict is:

# `BUILD BLOCKED — ARCHITECTURE DECISIONS REQUIRED`

The blockage is **decision-level, not redesign-level**: every blocking item is a targeted decision (Section S), several resolvable by explicit scoping rather than new design. A corrected V1.1 review could plausibly authorize a **minimum Core** (direct-http adapter only, Insight deferred or contracted) without re-opening the evidence base.

## B. Architecture Strengths

1. **Evidence-anchored boundaries** — every architectural claim traces to a commit (Q1 `ee7ca83` rendering; Q2 `a72d5d8` diversity; Q3 `c7109ca` contract; Post-Q3 `f6c5a8b` gaps/misattribution). No boundary rests on aspiration.
2. **Config-never-code, proven** — FED_ENF (`f16bc00`): 5 facts/3 events/3 IOs from config-only change. The architecture generalizes a proven fact, not a hope.
3. **Adapter capability vs source-specific behavior separation** — DMO (hard anti-bot) and CBUAE (TLS) are correctly classified as source access states, protecting the adapter layer from false-failure inference (Q2/Q3 evidence).
4. **Superseding-evidence correction mechanism** — the BMF entity correction (`bmf.de` → Bürener Maschinenfabrik) demonstrates non-destructive, history-preserving correction. This is the right governance primitive.
5. **Per-source failure isolation, evidenced** — DMO/CBUAE failures had zero effect on other cases across all rounds.
6. **Temporal model direction** — the 5-field tuple with semantics labels is the correct response to confirmed evidence (DGT URL/time conflict, LSE naive times, FDIC dual-class).
7. **Frozen-input discipline held** across the entire workstream; this review verified all 12 inputs intact.

## C. Critical Architectural Risks (summary — full analysis D–Q)

- **P0-1** — `Document` has no defined identity scheme; no content-hash schema field. The traceability backbone (the Core's central promise) cannot be verified without it.
- **P0-2** — No correction/versioning semantics for `Fact`/`Event`. Superseding evidence exists for entities but not for the intelligence objects themselves.
- **P0-3** — `Insight` is insufficiently specified as a canonical object (no identity, lifecycle, quality bar, or trigger contract) — it currently risks being exactly the "anything Event can't represent" bucket the directive warns about.
- **P1 set** — temporal nullability policy; `Publication` ownership ambiguity; canonical institution identifier; primary API abstraction; request→source-selection contract (simulation prerequisite); audit/trace query surface; storage versioning/retention/deletion policy.

## D. Domain Model Review

Per-entity assessment against the directive's eight questions:

| Entity | Represents | Owner | Persisted? | Identity | Lifecycle | References | Mutable/Versioned | Products depend directly? |
|---|---|---|---|---|---|---|---|---|
| Source | Entity-resolved institution path | Core | Yes | **UNDEFINED — institution ID scheme not chosen** (P1) | Registry entry + superseding corrections | institution, hostnames, adapter profile | Superseding-only (defined) | Read via API |
| Document | Retrieved normalized unit | Core | Yes | **UNDEFINED — URL? URL+retrieval? content hash? (P0-1)** | fetch→normalize→retained | Source, temporal tuple, acquisition metadata | **UNDEFINED — re-fetch semantics?** | Read via API |
| Fact | Extracted metric-value + excerpt | Core | Yes | gen_id (schemas.py) | extraction→(correction? **UNDEFINED — P0-2**) | Document, paragraph, temporal tuple | **corrections undefined** | Read via API |
| Event | Trigger-metric-categorized occurrence | Core | Yes | gen_id | detect→(correction? **UNDEFINED — P0-2**) | Facts | **corrections undefined** | Read via API |
| Evidence | Justifying chain artifact | Core | Yes | chain structure (evidence.py) | built→verified | Facts/Events→Documents | append-only (implicit, not stated) | Read via API |
| Provenance | Origin metadata per claim | Core | Yes (within evidence) | field tuple | attached at creation | temporal tuple, URLs | **transformation history absent (P1)** | Read via API |
| Insight | Non-metric-triggered intelligence | Core (claimed) | Claimed | **NONE DEFINED** | **NONE** | claimed: Documents/Events | **NONE** | **UNDEFINED** |
| Publication | Product-facing rendering (IO) | **AMBIGUOUS — Core or Product? (P1)** | ? | IO identity (pipeline) | PUBLISHABLE terminal state | Events/Facts/Evidence | **UNDEFINED** | Yes (by design) |

**Findings:**
1. **`Insight` — `ARCHITECTURAL QUESTION — NOT YET RESOLVED`.** In V1 it was introduced to house the two scoped gaps (DGT/Ministry content classes). As written it has no minimum contract: no identity, no derivation record, no quality/confidence notion, no review state, no lifecycle. **Honest answer to the directive's question: as currently specified, it IS at risk of becoming the generic bucket.** Resolution options in §S/§I. Not resolvable by implementation.
2. **`Publication` ownership contradiction** — V1 lists it in the canonical model (§C) while §B excludes product-facing rendering from the Core. The Intelligence Object (pipeline's publishable unit) is Core; "Publication" as product rendering is not. Terminology must be split (P1).
3. **`Evidence` vs `Provenance` do not collapse** — evidence = justifying chain (where a claim came from); provenance = origin metadata (temporal/source semantics). Distinct in schemas.py (`Evidence`, `ProvenanceChain`) and in the architecture. Confirmed clean.
4. Traceability direction `Insight → Event/Fact → Evidence → Document → Source` is architecturally supported **except** Insight's undefined reference contract (P0-3 dependency).

## E. Entity Resolution

The BMF incident as architectural test case — **the model passes the primary test**: two hostnames, two entities, misattribution detected, superseding record applied, usage restricted, history preserved. The mechanism works.

Unresolved specifics (all P1 unless noted):
1. **Canonical identifier** — not chosen. Recommendation direction: stable institution ID (Core-issued, e.g. `INST-<slug>-<n>`) with hostname aliases as attributes, never hostname-as-ID (bmf.de proves hostname collision with abbreviations).
2. **One institution, multiple domains** — implied supported (aliases); must be explicit. Ministry long-domain + future domain changes fall here.
3. **One domain, multiple legal entities** (a ministry site hosting affiliated agencies; regulator groups) — **UNADDRESSED**. Needs an ownership-scope rule (path-level entity binding or site-level owner + sub-entity listing).
4. **Acquisitions linked to institution** — UNADDRESSED (source ownership field exists; change-events for ownership transfers unspecified).
5. **Misattribution detection** — currently manual (imprint check performed by a human/agent in Post-Q3). The registry needs a mandatory verification-method field + evidence link per entity; automated verification is NOT required for minimum Core.
6. **Institution rename / government domain change** — the superseding mechanism extends naturally; rename events should be recorded as entity metadata history, not rewrites.

## F. Temporal Model

The 5-field tuple represents all nine required classes **only with one amendment**: `normalized_utc` **cannot exist unambiguously when the source timezone is unknown** (directive's question — answer: NO). Evidence: LSE `07:00:02` (UK local? exchange time? BST/GMT flips across the year), DGT naive `00:00:00.0000000` (Paris? UTC?).

**Required decision (P1):** one of —
- (a) `normalized_utc` NULLABLE + `normalization_basis` field (assumed zone + rationale + confidence), or
- (b) naive values represented as an **interval** `[earliest, latest]` UTC instants (±14h bound), or
- (c) `timezone_status=unknown` values excluded from cross-jurisdiction ordering with an explicit query-time guard.

Recommendation direction: (a) — preserves ordering where possible, preserves honesty where not. **Do NOT implement** — contract decision only.

Also confirmed representable: update timestamps (semantics label), effective/reporting dates (semantics label), URL/filename dates (provenance_source label), conflicting same-source dates (DGT A1 — multiple temporal tuples with different semantics per claim). No additional field beyond the nullability/basis decision is required.

## G. Evidence / Provenance Model

The chain `Source → Document → Fact → Evidence → Provenance` does not collapse distinct concepts (D.3). Missing identity/version fields identified:

1. **Document content hash as schema field** — the SHA-256 standard exists operationally (48 files hashed across Q3/Post-Q3) but is NOT part of the data contract. Adopting it as a Document field closes the retrieval-verification loop (P0-1 component).
2. **Retrieval event identity** — who fetched, when, with what command (reproduction standard exists in docs; not in schema).
3. **Extraction run identity** — which pipeline execution produced a Fact (run ID absent).
4. **Transformation history** — `normalized_value` exists but transforms are not audited (e.g., "3-1/2" → "3.5" is reconstructable only via raw_value).

All P1 except the content-hash field (P0-1). The full traceability requirement (Insight→…→Source) is structurally supported; completeness depends on the fields above.

## H. Event Model Boundary

- Extension points are **clean and confirmed by code inspection** (@ `c7109ca`): new event types = new `EVENT_TYPE_RULES` dict entries (data-driven; `detect_event` has no type branching — verified Architecture Gate Fix 2); new metrics = vocabulary addition; new trigger rules = per-type dicts; event-specific schemas = summary_metrics/subtypes per type. **None require pipeline-wide changes.** This is the strongest part of the current contract.
- The two scoped gaps (DGT analysis class; Ministry fiscal-communication class) must **stay out of Event** — neither shows trigger-metric behavior in the evidenced paths (5/5 and Pressemitteilungen censuses). Forcing them into Event would violate the trigger-metric design. Correct disposition: Insight-or-scope-out decision (§I), NOT event-type addition.
- No changes recommended; no changes permitted this phase.

## I. Insight Layer

**The directive's question, answered directly:** as specified in V1, the Insight layer does **not yet** solve the representation problem cleanly — and yes, **it is currently structured to become the generic bucket** ("intelligence NOT metric-triggered" is a negative definition; negative definitions accumulate residue by construction).

Evidence-based observations:
- The two gaps it would house are **C-preliminary (DGT) and D (Ministry)** — i.e., the evidence does NOT yet force an Insight layer into existence; product-scope input is pending for both.
- Document-level intelligence (analysis, commentary) already has a first-class carrier: `Document` (+ provenance). What is missing is a **derivation/relationship** concept (cross-document synthesis), not necessarily a new canonical object.

`ARCHITECTURAL QUESTION — NOT YET RESOLVED` — decision options (§S.3):
- **(a) First-class Insight** with minimum contract: identity, referenced Documents/Facts/Events, derivation record, temporal tuple, confidence, review state, provenance chain, lifecycle.
- **(b) Derived view only** — Insights are materialized views over Documents/Events, persisted as cache, never canonical truth.
- **(c) Defer** — remove Insight from the minimum Core; the two gap classes remain scoped-out until product-scope decision.

Recommendation direction: **(c) now, (a) later if product scope demands** — smallest commitment consistent with evidence. NOT resolved here.

## J. Acquisition / Adapter Layer

1. **Browser rendering: adapter capability or execution mode? — It is both, and the distinction must be explicit:** rendering is an adapter *class* (registry-level: "this source requires rendering") executed via a distinct *mode* (a browser-pool runtime) with its own failure domain. The class/mode split is what guarantees a browser-pool crash cannot affect direct-http sources (failure isolation §N).
2. **Single canonical `Document` contract regardless of acquisition mechanism: YES — required.** The Document carries acquisition metadata (adapter class, retrieval timestamp, content hash); downstream pipeline stages never branch on acquisition mechanism. Evidence supports feasibility: LSE (rendered) and FDIC (RSS) both yielded title/date/source/link quadruples consumable by the same extraction logic.
3. PDF/XLS = format adapters within the document-repository class; format-aware parsing remains UNTESTED (MoF XLS) — carried as a validated-acquisition/UNTESTED-parsing boundary.
4. Anti-bot-hard (DMO) and TLS failure (CBUAE) remain source access states — **and configuration must never encode access-control evasion** (no captcha-solving config; DMO stays BLOCKED). This integrity rule should be explicit in the architecture.

## K. Configuration Boundary

**In configuration (permitted):** source/feed URLs, link patterns, content paths, extraction patterns (regex→pattern_type), event-type binding, content keywords, rendering requirement flags, format hints, remediation pattern variants.

**NOT in configuration (Core engineering):** entity-identity verification logic; temporal normalization rules (the tuple semantics are contract, not config); evidence-chain construction; adapter implementations; new `PATTERN_TYPE_METADATA` normalization families (code change — FED_ENF changed pattern strings, never the metadata dict); quality-threshold governance (system-level policy, not per-source).

**Lesson mapping (directive-required):**
- **FED_ENF** — pattern phrasing differences = config ✓ (proven `f16bc00`).
- **TCMB** — remediation diagnostics (tcmb_* scripts) = validation tooling; the Playwright probe = rendering-mode evidence.
- **ISTAT** — dedicated-pattern misses ("compared to", parenthetical values) = config remediation candidate ✓ (pending, not executed).
- **BMF** — entity misattribution = **NOT config-fixable**; entity resolution is a Core stage (config pointed at the right URL all along; the entity binding was wrong).
- **DMO** — access block = **NOT config-workaround-able** (integrity rule J.4); source state BLOCKED.

## L. Storage / Data Ownership

- **Core-owned canonical store:** Sources, Documents, Facts, Events, Evidence (incl. provenance + temporal tuples), [Insights — pending §I]. The default principle — *products consume; products never become source of truth* — is upheld by the architecture with no inconsistency found.
- **Caching:** products MAY cache canonical intelligence read-only, keyed by canonical identity + version; MUST NOT mutate; MUST NOT serve cached data as authority beyond staleness policy (policy undefined — P2).
- **Versioning:** append-only + superseding records, mirroring the evidence discipline — **stated for entities, NOT for Facts/Events/Documents (P0-2)**.
- **Deletions:** tombstone + audit trail; provenance retention implies no hard deletes of evidence-bearing objects (policy undefined — P1).
- **Who owns Facts/Events/Evidence:** the Core exclusively. Confirmed unambiguous.
- Missing: retention policy, migration strategy (P2 — pre-production, not pre-build).

## M. API Boundary

Minimum API concepts confirmed: source, document, fact, event, evidence, [insight — pending §I], publication/IO, health/status. Plus (from §Q): trace/audit query surface.

**Open decision (P1): primary external abstraction — event-level or intelligence-object-level?** Recommendation direction: **intelligence-object-level primary** (the IO is already the pipeline's publishable unit with quality threshold and provenance; events/facts are detail layers beneath it). Event-level secondary for stream-like consumers. Decision required before build authorization of the API contract; the Core build itself can proceed against the object-level assumption if ratified in V1.1.

## N. Failure Isolation

Architecture supports source-level ≠ pipeline-level separation (proven: DMO/CBUAE zero cross-impact). The directive's full four-level separation is **implied but not stated**. Required explicit boundaries (P2 unless noted):
1. Source-level: per-source timeouts, error budgets, BLOCKED/INCONCLUSIVE states (exists).
2. Pipeline-level: a malformed document or failed extraction degrades THAT document's state, never the run (state machine exists — confirm extract-failure → DOCUMENTED/partial, which pipeline_state.py already encodes).
3. Database-level: canonical store single-writer discipline; schema migrations non-destructive (P2).
4. API-level: read-only serving; upstream degradation ≠ API outage (stale-serving policy — P2).
5. **Adapter execution-mode isolation** (browser pool ≠ direct-http) — stated in J.1, must be carried as an explicit boundary (P1 for the seam definition).

## O. Repository 4 Boundary — current code classification

Classification of the existing repo (at `a45bd07`; directory-level; **no files moved**):

| Class | Items |
|---|---|
| **CORE** | `scripts/pipeline/`: `fetcher.py`, `extractor.py`, `detector.py`, `normalizer.py`, `evidence.py`, `intelligence_object.py`, `pipeline_state.py`, `schemas.py`, `content_extractor.py`, `source_configs.py` (config-as-code artifact), `SUPPORTED_SOURCE_CONTRACT.md` |
| **VALIDATION** | `scripts/pipeline/`: `run_gate5.py`, `run_pipeline.py`, `run_b_closure.py`, `run_phase_b.py`, `diag_a2.py`, `diag_boc*.py`, `phase_b_recon*.py`, `capability_survey_*.py`, `fed_enf_remediation_*`, `tcmb_remediation_*` + `docs/evidence/**` (all rounds incl. Q1–Q3, Consolidation) |
| **EXPERIMENT** | `mvp/backend/`, `mvp/intelligence/`, `mvp/packages/`, `mvp/infrastructure/` — NestJS/FastAPI scaffolding **outside the validated evidence lineage** (the validated engine is `scripts/pipeline`) |
| **PRODUCT** | root website (`index.html` + 30+ pages, `styles.css`, `main.js`, `products.js`, `assets/`), `rouaa-web/`, `mvp/apps/web` |
| **DOCUMENTATION** | `docs/foundation/**`, `docs/execution/**`, `docs/strategy/**`, root `*.md` positioning docs, `docs/architecture/**` |
| **LEGACY** | `archive/**` |

**Migration concerns (for extraction time, not now):** (1) CORE and VALIDATION share one directory — extraction must split them; (2) `source_configs.py` mixes configuration data with importable code — the configuration contract (§K) implies config/data separation at extraction; (3) `mvp/` experiment scaffolding must not be carried into Repository 4 by inertia — it predates and diverges from the validated pipeline.

## P. Production Requirements

| Requirement | Classification | Note |
|---|---|---|
| Observability | **MISSING** | no metrics/tracing concept; REQUIRED pre-Railway |
| Retries | **PARTIALLY DEFINED** | pipeline states encode failure; retry policy absent |
| Queueing | **MISSING** | REQUIRED pre-production scale |
| Rate limiting | **MISSING** | politeness to sources; REQUIRED pre-production |
| Source health | **PARTIALLY DEFINED** | pipeline_state per source exists; health surface absent |
| Provenance retention | **PARTIALLY DEFINED** | evidence discipline exists (docs/hashes); retention policy absent |
| Reproducibility | **PARTIALLY DEFINED** | dual-run + SHA-256 standard operational; not automated |
| Audit logs | **MISSING** | commit-anchored docs only; runtime audit absent |
| Access control | **MISSING** | REQUIRED pre-Railway |
| Secrets | **MISSING** | manual token hygiene today; REQUIRED pre-Railway |
| API authentication | **MISSING** | REQUIRED at API build |
| Versioning (data) | **MISSING** | P0-2 dependency |
| Migrations | **MISSING** | P2 |
| Backup/recovery | **MISSING** | P2, pre-Railway |
| Idempotency | **PARTIALLY DEFINED** | detection is pure; fetch/re-run semantics undefined |
| Concurrency | **MISSING** | P2 |

Classification: acceptable for validation phase; the above become gating at the phases noted. **NOT YET NEEDED** applies to none of them universally — each flips to REQUIRED at a named phase (simulation: idempotency, audit; Railway: the rest).

## Q. Institutional Buyer Simulation Readiness

Step-by-step architectural coverage check (conceptual only — NOT executed):

| Simulation step | Architecture boundary | Status |
|---|---|---|
| Institution requests ROUAA | — | **MISSING: request→source-selection contract** (demand-driven scoping; current model is supply-side onboarding only) |
| ROUAA identifies sources | Source Registry + entity resolution | Covered |
| Core ingests | Adapter classes | Covered (direct-http; rendering pending engineering decision) |
| Canonical intelligence produced | Pipeline + contracts | Covered |
| API delivers to external platform | Canonical API | **PARTIAL: delivery/auth to an EXTERNAL platform undefined** (P1) |
| Analyst consumes | Product interface | Covered conceptually |
| Analyst traces result | Provenance chain | **PARTIAL: no trace/audit QUERY surface defined** (chains exist; retrieval contract absent — P1) |
| Evidence/provenance verified | Evidence + temporal tuples + hashes | Covered (given P0-1/P0-2 resolution) |

**Missing architecture contracts before simulation:** (1) request→source-selection; (2) trace/audit query surface; (3) external delivery/access model. All P1. Because the authorization rule requires simulation requirements covered, these contribute to the verdict.

## R. P0 / P1 / P2 Issues

**P0 — blocks Core viability (authorization):**
- **P0-1 Document identity & content-hash contract.** Why P0: every downstream guarantee (evidence verification, reproducibility, deduplication, correction targeting) keys on document identity; without it the trust promise is unverifiable, not merely incomplete.
- **P0-2 Fact/Event correction & versioning semantics.** Why P0: superseding corrections exist for entities (proven, BMF) but not for the intelligence objects; a corrected fact silently propagating (or being silently dropped) breaks the auditability the Core exists to provide.
- **P0-3 Insight status unresolved.** Why P0: it sits in the canonical domain model; an undefined canonical object violates the authorization rule ("all canonical domain objects sufficiently defined") and the bucket risk compounds over time if built around.

**P1 — significant architectural uncertainty (pre-build decisions):** temporal nullability/normalization-basis (F); Publication/IO terminology & ownership split (D); canonical institution identifier + multi-entity-domain rule (E); primary API abstraction (M); request→source-selection contract (Q); trace/audit query surface (Q); storage versioning/retention/deletion policy (L).

**P2 — deferrable:** production requirements per §P phase map; rendering execution-mode implementation details; adapter-pool isolation mechanics; caching staleness policy; rename/ownership-transfer automation; SQR/onboarding tooling placement.

## S. Required Architecture Decisions Before Build

1. **Document identity scheme** — canonical URL + content SHA-256 + retrieval event ID (recommended direction); ratify or amend. *(resolves P0-1)*
2. **Fact/Event correction model** — append-only versions + superseding links mirroring the entity mechanism (recommended direction); define propagation rule to dependent IOs. *(resolves P0-2)*
3. **Insight disposition** — choose (a) first-class with minimum contract / (b) derived view / (c) defer out of minimum Core (recommended: **c now, a on product-scope demand**). *(resolves P0-3)*
4. **Temporal nullability** — choose (a) nullable + normalization_basis / (b) interval bounds / (c) ordering-exclusion guard (recommended: **a**). *(P1)*
5. **Publication/IO terminology** — Intelligence Object = Core canonical publishable; "Publication" reserved for product rendering (recommended). *(P1)*
6. **Institution identity scheme** — Core-issued stable ID + hostname aliases + verification-method field; ownership-scope rule for multi-entity domains. *(P1)*
7. **API primary abstraction** — object-level primary, event-level secondary (recommended). *(P1)*
8. **Simulation contracts** — request→source-selection concept; trace/audit query surface; external delivery model. *(P1; required before simulation, designable before or during core build)*

Decisions 1–3 ( + 4 ) are the authorization blockers; 5–8 may be ratified in the same V1.1 pass to avoid a third review round.

## T. Core Build Authorization Recommendation

# `BUILD BLOCKED — ARCHITECTURE DECISIONS REQUIRED`

**Grounds (per the authorization rule):** 3 unresolved P0s (S.1–S.3); canonical domain objects not all sufficiently defined (Insight; Document identity); temporal contract incomplete without the nullability decision; simulation requirements not fully covered (Q contracts).

**Nature of the block:** targeted decisions, not redesign. The evidence base, boundary principles, and extension mechanics all survive review intact.

**Recommended path:** ratify S.1–S.8 in an Architecture V1.1 addendum (small, decision-record format, evidence-anchored) → re-review against the same authorization rule → upon satisfaction, authorize the **minimum Core** (direct-http adapter, 6 event types, no Insight, temporal tuple with chosen nullability policy) with rendering adapter and structured-file adapters as explicitly deferred extensions. The Institutional Buyer Simulation remains the final gate before Repository 4 extraction, unchanged.

---

**Review complete. Additive only — no frozen artifact modified, no code touched, no Repository 4 created, no simulation executed. STOP per directive: next phase is determined by this verdict → `Architecture Corrections` (V1.1 decisions), not `Core Engine Selection / Build`.**
