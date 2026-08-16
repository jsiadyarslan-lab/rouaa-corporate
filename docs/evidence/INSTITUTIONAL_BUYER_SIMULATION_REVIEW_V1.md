# INSTITUTIONAL BUYER SIMULATION REVIEW V1

**Status:** SIMULATION REVIEW — formal acceptance review (planning phase; no code, no extraction)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — SIMULATION REVIEW + REPOSITORY 4 EXTRACTION PLAN V1 (user-issued verbatim)
**Reviewed object:** `docs/evidence/INSTITUTIONAL_BUYER_SIMULATION_V1.md` + harness `intelligence_core/tests/buyer_simulation_v1.py` @ `150ae87` (verified directly against the repository tree, not summaries)
**Base chain:** `9298162` (V1.1 authorized) · `9af81b7` (build) · `0f4139b` (live validation) · `8de74e9` (hardening) · `150ae87` (simulation)

---

## A. Buyer Requirements — actually demonstrated

All nine mapped requirements were **demonstrated with machine evidence**, not asserted:

| Requirement | Demonstrated by (evidence @ `150ae87`) |
|---|---|
| trusted official source | Contract A: 3/3 selections via verified domains; bmf.de→Ministry REJECTED; brand lookup FORBIDDEN; govdelivery platform feed REFUSED; CN→NO_MATCH |
| exact document provenance | 4/4 traced chains resolve to representation `content_sha256` with blob re-hash match |
| reproducibility | duplicate request: 14/14/13/4/4/4 canonical counts identical; replay determinism (Phase-2 harness) |
| corrected information | CPI "+0.3"→"+0.4": new representation → new fact → old SUPERSEDED → event v2 → NEW IO → NEW delivery; v1 exactly reproducible; no silent overwrite |
| structured intelligence | 4 IOs with embedded traceability chains consumed as JSON |
| traceability | Contract B full chain Delivery→…→Institution, 0 broken links |
| delivery reliability | 4 duplicate deliveries rejected (consumer + ledger idempotency) |
| source isolation | DFSA invalid-path BLOCKED while FDIC+ISTAT PUBLISHABLE; 4 IOs still delivered; failure attributable in audit |
| temporal correctness | 3 classes: UTC (ISTAT→`…08:00:58Z`), explicit offset (FDIC `-0500`→`18:10:04Z`), date-only→NULL non-participating; ordering 2/3 |

Two intelligence types reached IntelligenceObjects (`regulatory_enforcement`, `statistical_release`). Buyer questions Q1–Q10 answered from produced evidence. Acceptance criteria 11/11 TRUE.

## B. Core Contract Coverage (requirement → implemented component)

| Requirement | Core component(s) | Contract |
|---|---|---|
| trusted source | `entity_resolution.py` + `pipeline.ensure_source` | D6 |
| document provenance | `identity.py` (3-level) + `store.py` blobs | D1 |
| reproducibility | deterministic ids + append-only store | D1/D9 |
| corrections | `governance.py` (`_resolve_active_fact`, `recompute_event`, supersession ops) | D2 |
| structured intelligence | `delivery.py` (`build_intelligence_object`) | D7 |
| traceability | IO embedded chain + Contract-B resolution | D7/D8 |
| delivery reliability | `deliver()` idempotency key | D8-C |
| isolation | `pipeline.run_source/run_many` + `health.py` | §11 discipline |
| temporal | `temporal.py` (+ JurisdictionRule gate, ordering_filter) | D4 |

No requirement mapped to an unimplemented component in the success path; nothing was hidden as `NOT IMPLEMENTED / OUT OF SCOPE` inside the success path.

## C. Bounded Limitations — separated (NOT converted to engineering work)

**Minimum Core limitations (by design, deferred):**
- L-DES description-only RSS (adapter-level; authorized deferral).
- Rendering integration & XLS/PDF adapters excluded (scope rule §1).

**Productization limitations (extraction/production phase):**
- EXTERNAL TRANSPORT = SIMULATED (Contract C exercised via deterministic local consumer; production transport is a post-extraction concern).
- html_index item publication tuples not wired (config/format-hint work, evidence exists on list pages).
- DFSA content window (0 penalty-phrased notices during run) — configuration-domain, FED_ENF-precedented.

**Production transport limitations:**
- No external API/transport implementation at all (delivery is a ledger) — by Minimum Core definition.

**Future capability extensions (decision-gated, not defects):**
- Distribution-platform entity rule (govdelivery-class feeds) — D6 extension point.
- Insight layer (4-condition re-entry), new event types, multilingual — unchanged deferrals.

## D. Readiness Conclusion

The simulation tested the request→delivery→trace→correction lifecycle (not just output production), enforced trust boundaries that rejected a real misattribution pattern and a platform-domain shortcut, and demonstrated full D2 correction lineage on a real captured document. The evidence supports acceptance; the conditions below attach to **extraction integrity**, not to the simulation itself.

# `SIMULATION ACCEPTED WITH REQUIRED EXTRACTION CONDITIONS`

**Required extraction conditions (binding on the Repository-4 plan):**
1. Exact contract preservation — no behavior change during extraction (Gate D/E enforce via the same 48+ tests).
2. Test independence — the future repository must prove BMF regression, identity, supersession/propagation, temporal, isolation, idempotency, traceability WITHOUT `rouaa-corporate`.
3. Phase-2 live-validation replay must pass in the new repository (Gate F).
4. Historical evidence stays canonical in `rouaa-corporate` (referenced, not duplicated).
5. Rollback reversibility throughout (corporate remains operational).
