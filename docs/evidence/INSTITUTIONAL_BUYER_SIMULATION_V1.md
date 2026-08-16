# INSTITUTIONAL BUYER SIMULATION V1

**Status:** EXECUTED — FINAL READINESS GATE (simulation; no Core expansion, no Repository 4, no Railway)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — INSTITUTIONAL BUYER SIMULATION V1 (user-issued verbatim)
**Base:** Minimum Core Phase 1 `9af81b7` · Phase 2 Live Validation `0f4139b` · Pre-Simulation Hardening `8de74e9` · Architecture V1.1 authorization `9298162`
**Harness (committed, reproducible):** `intelligence_core/tests/buyer_simulation_v1.py` (bounded live capture + deterministic replay; unit suite unaffected: 48/48 still green)
**Honesty markers:** Simulated persona only — NO real customer. `EXTERNAL TRANSPORT = SIMULATED / NOT PRODUCTION IMPLEMENTED`.

---

## A. Simulated Buyer

Global Multi-Asset Investment Manager (SIMULATED) · Head of Research / Investment Intelligence · internal research and portfolio analytics platform · objective: consume evidence-backed official financial intelligence from ROUAA.

## B. Buyer Request

Verbatim (directive §3): reliable official-intelligence feed; ROUAA identifies authoritative sources, ingests documents, detects supported events, preserves evidence/provenance, delivers structured IntelligenceObjects; every item traceable to the exact source document and retrieved representation; reproducibility when sources correct information. Translated into 15 system requirements (source discovery → failure isolation; directive §3 list).

## C. Requirements Mapping

| Buyer requirement | Core contract | Test | Result |
|---|---|---|---|
| trusted official source | Entity Resolution (D6) | source selection + negatives | **PASS** (3/3 selected via verified domains; bmf.de→Ministry REJECTED; brand lookup forbidden; govdelivery platform feed REFUSED; jurisdiction CN → explicit NO_MATCH) |
| exact document provenance | D1 representation identity | content_sha256 trace | **PASS** (every chain link resolves; blob re-hash verified) |
| reproducibility | D1/D2 append-only | replay + duplicate request | **PASS** (all canonical entities identical on re-run; retrieval events grow by design) |
| corrected information | D2 supersession | correction scenario (§H) | **PASS** |
| structured intelligence | IntelligenceObject (D7) | delivery payloads | **PASS** (IO + version + embedded chain consumed as JSON) |
| traceability | D7/D8 chain | Contract B trace (§G) | **PASS** (4/4 deliveries traced, 0 broken) |
| delivery reliability | D8-C idempotency | duplicate delivery rejection | **PASS** (4 duplicates rejected) |
| source isolation | pipeline isolation | failure scenario (§I) | **PASS** |
| temporal correctness | D4 semantics | temporal scenario (§K) | **PASS** |

## D. Source Selection (Contract A)

Pilot scope US/IT/AE → registry-driven selection: **FDIC** (`INST-fdic-001`, US, via **www.fdic.gov — the institution's own verified domain**, html_index) · **ISTAT** (`INST-istat-001`, IT, RSS) · **DFSA** (`INST-dfsa-001`, AE, RSS). Negative controls: `bmf.de → Ministry` **REJECTED**; brand "BMF" **FORBIDDEN**; `public.govdelivery.com` feed **REFUSED** (platform domain unverified — committed Phase-2 boundary; delivery instead via FDIC's own domain, a stronger trust posture); jurisdiction **CN → NO_MATCH** (explicit valid outcome). German Ministry used as supplementary entity/access scenario only (entity resolved ✓; acquisition Radware-captcha 15,070 B this run — intermittent per committed evidence; rendering out of scope).

## E. Onboarding Flow (stage states recorded)

Request → normalization (15 requirements) → **selection** (Contract A) → **entity verification** (all three) → **source configuration** (config-only; FDIC enforcement patterns authored from the ACTUAL captured phrasing of the real "FDIC Publishes June Enforcement Actions" page — FED_ENF precedent) → **acquisition** (live capture, 18 artifacts) → representations → extraction → detection → evidence → provenance → IO → delivery → traceability. Per-source states: **FDIC PUBLISHABLE (5 items)** · **ISTAT PUBLISHABLE (3 items)** · **DFSA DOCUMENTED (6 items, 0 facts — current notices carry no penalty phrasing; content-window limitation, not failure)**.

## F. Pipeline Execution (live-captured inputs, deterministic replay)

Totals: sources 3 · documents 14 · representations 14 · retrieval_events 14 · **facts 13** · **events 4** · evidence 13 · **IntelligenceObjects 4** · **deliveries 4** · audit 10. Two intelligence types reached IO: **`regulatory_enforcement`** (FDIC — action_type facts incl. "consent order", "orders to pay civil money penalties" from the real enforcement-actions page) and **`statistical_release`** (ISTAT — Eurostat patterns). Sample IO headline: *"FDIC (press releases, own domain) Regulatory Enforcement Action"*, 4 chain links.

## G. Traceability Demonstration (Contract B — read-only)

From each delivered IO, the full chain resolved machine-verifiably: **Delivery → IO(+version) → Event(+version) → Fact(+version) → Evidence (id + location `pattern:action_type#occN`) → Representation (content_sha256, blob re-hashed = match) → Document (canonical_url) → Source → Institution**. 4/4 deliveries traced, **0 broken references**. Retrieval events resolved per representation (final_url = the real FDIC/ISTAT pages).

## H. Correction Scenario (validates `8de74e9`)

Controlled revision of the REAL captured ISTAT CPI page (the sentence actually extracted: month-on-month NIC "+0.3% compared with" → "+0.4%"): new representation ✓ (new content_sha256) → new fact on the new representation ✓ → **old fact SUPERSEDED with evidence-linked reason SOURCE_REVISION** ✓ → **event version 2** derived from the successor fact (snapshot `[fact-1d40…:v1]`) ✓ → **new IntelligenceObject** `io-95add51a…` ✓ → **new delivery** created ✓ → **historical Event v1 + old IO + old fact row remain exactly reproducible** ✓ → no silent overwrite (v1 row value still "+0.3") ✓ → value change visible (+0.3 → +0.4) ✓.

## I. Failure Scenario

Batch [FDIC + ISTAT + DFSA(invalid path)] on a fresh store: **FDIC PUBLISHABLE · ISTAT PUBLISHABLE · DFSA BLOCKED** — 4 IOs still delivered to the buyer from the healthy sources; failure visible and attributable (SOURCE_FAILURE audit row; per-source BLOCKED state).

## J. Duplicate Request

Same request resubmitted (full re-run on the same store): documents 14→14 · representations 14→14 · facts 13→13 · events 4→4 · IOs 4→4 · **deliveries 4→4** — zero canonical duplication; retrieval events grew (acquisition is an event, by design).

## K. Temporal Scenario

From THIS simulation's captures: **UTC source** (ISTAT `Wed, 12 Aug 2026 08:00:58 +0000` → `2026-08-12T08:00:58Z`, ordering-participating) · **explicit offset** (FDIC GovDelivery pubDate `Mon, 10 Aug 2026 13:10:04 -0500` → `18:10:04Z` — parse-only sample; the platform feed remains entity-refused for delivery) · **date-only** (FDIC list page `<time datetime="2026-08-10">` → normalized_utc **NULL**, not ordering-participating). Ordering participants: 2 of 3 — the unsafe class excluded, not silently ordered. Source publication vs ROUAA retrieval remain distinct fields (document publication tuples vs retrieval events).

## L. Delivery Simulation (Contract C)

`EXTERNAL TRANSPORT = SIMULATED / NOT PRODUCTION IMPLEMENTED.` Deterministic local consumer (`buyer-platform-simulated`): received IO + version + traceability metadata as JSON payload → **4 ACKs**; re-consumption of the same deliveries → **4 DUPLICATE_REJECTED**; audit state preserved (8 records).

## M. Buyer Questions / Answers (machine-accessible evidence)

- **Q1 where did this number come from?** Fact `fact-9065…` v1 = "consent order" (action_type); excerpt: *"…FDIC issued 15 orders in June 2026. The administrative enforcement actions in those orders consist…"*; evidence id + pattern location attached.
- **Q2 which institution?** `INST-fdic-001` via verified source FDIC (own domain).
- **Q3 when published?** ISTAT items: RSS publication tuples ✓. FDIC html_index documents: publication tuple not represented (bounded limitation — page-level `<time>` not extracted by current config path; date-only form recorded at §K).
- **Q4 when retrieved?** Retrieval event `ret-…` per representation, final_url recorded.
- **Q5 reproduce exactly?** Yes — representation sha256 + verified blob + append-only rows.
- **Q6 source corrects the number?** Demonstrated end-to-end (§H): SUPERSEDED → event v2 → new IO → new delivery; history intact.
- **Q7 same intelligence again without duplicates?** Yes (§J + §L).
- **Q8 one source goes down?** Isolated (§I); other sources' IOs unaffected.
- **Q9 programmatic consumption?** Yes — simulated consumer consumed canonical JSON (transport simulated).
- **Q10 audit entire lineage?** Yes — 10 audit rows + full chain per delivery, 0 broken (§G).

## N. Failures and Limitations (classification per §17)

| Item | Class | Note |
|---|---|---|
| External transport not implemented | OUT OF SCOPE (Minimum Core) | Contract C exercised via deterministic local consumer; production transport = extraction/productionization phase |
| L-DES description-only RSS | BOUNDED MINIMUM CORE LIMITATION | deferred by design (directive §1) |
| FDIC html_index publication tuples absent | CONFIGURATION/format-hint gap | page-level `<time>` date-only exists on list pages; not wired for item documents — extraction-phase config work |
| DFSA 0 facts this window | PATTERN SPECIFICITY / content window | current notices carry no penalty phrasing; config-domain remediation precedented |
| FDIC platform feed refused | ENTITY RESOLUTION (by design) | correct D6 refusal; distribution-platform evidence rule = D6 extension point |
| Ministry Radware (this run: captcha 15,070 B) | SOURCE ACCESS (intermittent) | rendering out of scope; supplementary scenario only |

No failure classified CORE ARCHITECTURE or IMPLEMENTATION.

## O. Acceptance Criteria

source_trust ✓ · intelligence ≥2 types to IO ✓ (`regulatory_enforcement`, `statistical_release`) · traceability complete ✓ · reproducibility ✓ · correction creates new version + history survives ✓ · failure isolation ✓ · delivery versioned+idempotent ✓ · audit ✓ · temporal semantics preserved ✓ · consumer contract ✓ — **ALL PASS**.

## P. Final Verdict

# `INSTITUTIONAL BUYER SIMULATION PASSED WITH BOUNDED LIMITATIONS`

Bounded limitations carried forward (§N): simulated external transport; L-DES; html_index publication tuples; DFSA content window; platform-feed entity rule (D6 extension point). None is architectural; none blocks extraction decisions that follow.

---

## Evidence Ledger (18 live-captured artifacts, SHA-256 prefixes; full hashes in `capture/ledger.json` regenerated by the committed harness)

| Artifact | Bytes | SHA-256 prefix |
|---|---|---|
| FDIC press-releases index (own domain) | 80,795 | `4a003241…` |
| FDIC June enforcement actions (facts source) | 65,215 | `e6e66fa7…` |
| FDIC May enforcement actions | 65,391 | `a716215a…` |
| FDIC review-process / CRA / appeals pages ×3 | 66–69 K | `f203e5f3…`, `7a56d1a6…`, `fc52fb68…` |
| ISTAT /en/feed/ (byte-identical to Q2/Phase-2) | 26,565 | `5a6fe3a9…` |
| ISTAT CPI / foreign-trade / industrial pages | ~104 K | `eabf7894…`, `aa478b7a…`, `67e672cc…` |
| DFSA /rss (byte-identical to committed evidence) | 10,153 | `9f10799d…` |
| DFSA notice pages ×6 | 49–54 K | `a7b228bd…`, `a21b2d1a…`, `ea739f1e…`, `d7a3d9eb…`, `c0942ba7…`, `57984cdf…` |
| Ministry EN home (Radware captcha) | 15,070 | `095dd2d0…` |

Reproduction: `python -m intelligence_core.tests.buyer_simulation_v1` (network required for capture; replay deterministic).

---

**STOP per directive — final validation gate CLOSED. NO Repository 4 created, no code migrated, no Railway, no News/Trading/Corporate connections in this task.** Satisfied criteria for extraction (next phase, separate decision): Architecture V1.1 authorized + reviewed (`9298162`/`08d5723`), Minimum Core built + hardened (`9af81b7`/`8de74e9`), live-validated (`0f4139b`), and **this simulation passed end-to-end** — request → registry selection → verified acquisition → canonical intelligence → versioned idempotent delivery → full traceability → correction reproducibility → isolation. Sequence per directive: Simulation Review → Repository-4 Extraction Plan → create `ROUAA Intelligence Core` → extract → productionize/Railway → connect News → Trading → Corporate. None of these begins automatically.
