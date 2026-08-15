# Q3 — EVENT MODEL CONTRACT VALIDATION V1

**Status:** EXECUTED — EVIDENCE ARTIFACT (contract validation exercise; evidence-only)
**Date:** 2026-08-15
**Directive:** EXECUTION DIRECTIVE — PRE-Q3 EVIDENCE INTEGRITY GATE + Q3 EVENT-MODEL CONTRACT VALIDATION (user-issued verbatim)
**Prior gates:** Q1 CLOSED (`ee7ca83`) · Q2 CLOSED (`a72d5d8`)
**Scope discipline:** This is NOT engineering, NOT source onboarding, NOT event-model implementation, NOT new source discovery, NOT an investment decision. No frozen artifact modified (incl. Q1/Q2 artifacts — corrections live HERE only). No prevalence. No percentages. No denominators. Universe prevalence UNKNOWN.

---

## A. Scope

Determine whether the intelligence types **observed in the six validated Q2 cases** (LSE, FDIC, ISTAT, DFSA, DG Trésor, BMF) can be represented by the **existing** ROUAA Event Model and Configuration Contract — after first closing two evidence-integrity issues raised in the self-review of Q1/Q2 (BMF validation strength; BMF "boundary shift" interpretation), plus establishing the cross-jurisdiction timestamp observation and the Q1 provenance scope note.

Execution window: 2026-08-15T21:38Z – 2026-08-15T21:50Z (all probes and code reads timestamped in-line).
Instruments: direct HTTP (`curl`, browser UA) · real-browser rendering (Google Chrome 151.0.7922.138 headless, `--headless=new --virtual-time-budget=15000`) · read-only repository inspection (`grep`/`sed` on `scripts/pipeline/*` at branch `top20-prescreening` @ `a72d5d8`).

## B. Pre-Q3 Evidence Integrity Gate

### B.1 BMF original-path verification (Directive 0.1)

Original record located: `docs/evidence/cross_jurisdiction/EVIDENCE_RECORDS_V1.md` @ `73b7668`, section **S1 — Bundesministerium der Finanzen (BMF)**:

> **URL:** `https://www.bmf.de/` ; feed `https://www.bmf.de/feed/`
> **Reproduction:** `curl -sL -A "Mozilla/5.0" https://www.bmf.de/feed/ | grep -c '<pubDate>'` → 10

**Verbatim re-execution (2026-08-15T21:41:42Z):**

| Field | Result |
|---|---|
| Verbatim command output | **`10`** — exactly as recorded |
| Feed detail | HTTP 200 → final URL `https://bmf.de/feed/`, 28,142 B, RSS 2.0 (WordPress), `<pubDate>` with second precision + `+0000` (e.g. `Wed, 05 Aug 2026 08:16:42 +0000`) |
| Homepage detail | HTTP 200 → `https://bmf.de/`, 76,049 B, title "BMF" |
| Anti-bot behavior | NONE — no captcha, no block |
| **Case** | **CASE A — the original URL still behaves exactly as previously recorded** |

### B.2 BMF independent Chromium rerun (Directive 0.1, second leg)

Repetition of the successful Q2 rendering path (`bundesfinanzministerium.de` — the LONG domain, a **different hostname** from the committed original):

| Field | Q2 run (21:27–21:29Z) | Integrity rerun (21:42–21:43Z) |
|---|---|---|
| Static curl DE homepage | Radware Captcha Page (~15.0 KB) | **REAL page, HTTP 200, 166,016 B** ("Bundesfinanzministerium – Startseite") — gating is INTERMITTENT per path/time |
| Static curl EN homepage | Radware Captcha Page (~15.0 KB) | Radware Captcha Page, 15,070 B (still gated) |
| Chromium DE render | 170,818 B · real title · 0 captcha markers | **170,818 B (byte-identical size) · real title · 0 captcha markers · 5 press-release links** |
| Chromium EN render | 131,195 B · real title · 0 captcha markers | **131,195 B (byte-identical size) · real title · 0 captcha markers · 8 EN content links** |
| Date evidence | ISO dates in URL paths + rendered `12.08.2026` | reproduced |
| Bilingual evidence | same-release DE↔EN URL-date correspondence | reproduced |

### B.3 Classification (Directive 0.2)

The independent rerun **reproduces** the previous result (byte-identical rendered sizes, identical titles, zero captcha):

**`BMF Browser/Rendering Evidence = VALIDATED`** (dual independent runs).

### B.4 "Boundary shift" reconciliation (Directive 0.3)

| Comparison item | Value |
|---|---|
| Original successful URL (`73b7668`) | `https://www.bmf.de/` + `/feed/` |
| Q2-tested URL | `https://www.bundesfinanzministerium.de/` + `/feed` |
| Identical? | **NO — different hostnames** (short domain vs long domain of the same institution) |
| Original result | RSS 10 pubDates (committed) — **reproduced exactly in B.1** |
| Q2 result | long-domain `/feed` 404 "Nicht gefunden"; long-domain homepages Radware-gated under curl; Chromium passes |
| Conclusion | **`PATH/URL DIFFERENCE — PRIOR "SHIFT" INTERPRETATION RETRACTED`** |

**Retraction (recorded here, in the NEW artifact, per Directive Phase 7):** the Q2 statement "BMF تحوّل بين الجلستين من RSS متاح إلى Radware Captcha" is **retracted**. The committed RSS evidence was acquired on `bmf.de`, which still behaves identically; Q2 probed `bundesfinanzministerium.de` — a URL guessed in-session, not derived from the committed record. Both observations stand as **separate per-case evidence for two different hostnames**:
- `bmf.de` — RSS VALIDATED (now **three** independent executions: Expansion session-1, dual-verification 20:55Z, integrity rerun 21:41Z)
- `bundesfinanzministerium.de` — rendering-instrument VALIDATED (two byte-identical runs) with an **intermittent** curl-side Radware gate (DE: gated at 21:27Z, open at 21:42Z; EN: gated both times). Q2's "blocks direct HTTP" is refined to "intermittently gates direct HTTP, per path and time".

### B.5 Evidence file hashing (Directive 0.4)

**35 material captured files hashed (SHA-256).** Full ledger in §P. Standard adopted for this artifact:

> Material captured evidence should carry SHA-256 when the underlying file is retained.

No old artifact was modified to introduce this convention. No hash was fabricated; every hash below was computed from the retained file.

### B.6 Timestamp normalization observation (Directive 0.5)

Observed source timestamp forms across Q1/Q2 include: explicit timezone offsets (RFC-822 `+0000`/`-0500`), UTC timestamps, naive local timestamps without timezone (`2026-07-29T00:00:00.0000000`), date-only values (ISO `<time datetime="2026-06-05">`, rendered `12.08.2026`, URL dates), and rendered publication times without zone (`07:00:02`).

Contract-level fact (read-only inspection, `scripts/pipeline/schemas.py` line 75): `Fact.published_at: str = ""` — a plain string with **no timezone semantics and no normalization layer** in the current contract.

**Recorded:** `CROSS-JURISDICTION TIME NORMALIZATION = CORE DESIGN REQUIREMENT / NOT YET IMPLEMENTED`

This is an architectural observation. NOT an engineering authorization. No new capability registered. Event Model unaltered.

### B.7 Q1 provenance scope (Directive 0.6)

Preserved honestly: **"LSE LIST ↔ DETAIL provenance match = validated for the tested article"** (Aviva, `ee7ca83`). NOT broadened to "LSE always provides matching list/detail provenance". No new Q1 survey run.

## C. Existing Event Model Contract (read-only documentation — NOTHING modified)

Source of truth: `scripts/pipeline/` at `top20-prescreening` @ `a72d5d8`. Referenced previously by `GATE5_CONFIGURATION_CONTRACT_VERIFICATION_V1`.

### C.1 Supported event types — `detector.py` `EVENT_TYPE_RULES` (lines 48–133), exactly 6:

| # | Event type | `trigger_metrics` |
|---|---|---|
| 1 | `monetary_policy_decision` | `rate_decision`, `policy_rate`, `policy_rate_range` |
| 2 | `regulatory_enforcement` | `penalty_amount`, `defendant_name`, `action_type`, `violation_type` |
| 3 | `statistical_release` | `inflation_rate`, `gdp_growth`, `unemployment_rate`, `employment_level`, `statistic_value`, `usd_amount`, `percentage_statistic`, `cross_border_change` |
| 4 | `earnings_release` | `revenue`, `eps`, `net_income`, `gross_margin`, `yoy_change`, `dividend_amount`, `total_assets` |
| 5 | `sanctions_designation` | `designated_entity`, `designated_country`, `sanctions_program`, `action_type`, `faq_topic` |
| 6 | `market_statistic_release` | `fx_turnover`, `ird_turnover`, `cds_turnover`, `usd_amount`, `percentage_change` |

Each rule also defines: `headline_template`, `summary_metrics` (label/format), `subtype_from` (data-driven subtypes; `monetary_policy_decision` additionally defines `headline_subtypes` + `subtype_mapping`).

### C.2 Detection mechanics — `detect_event()` (lines 245–279)

- Requires ≥1 Fact whose `metric` ∈ `trigger_metrics` of the **configured** event type; else returns `None`.
- Unknown configured event type → falls back to `monetary_policy_decision` (Phase A compat).
- Subtype derivation is data-driven (no hardcoded branches); adding event types = adding to `EVENT_TYPE_RULES`.

### C.3 Pattern normalization — `extractor.py` `PATTERN_TYPE_METADATA` (lines 389–433)

- Normalizes ONLY the rate family: `rate_value→policy_rate`, `rate_maintain/rate_action/rate_action_with_value→rate_decision`, `rate_range→policy_rate_range`.
- **All other pattern types fall back to identity** (`metric = pattern_type`) — e.g. `penalty_amount`, `statistic_value`, `revenue` pass through unchanged.

### C.4 Fact schema (provenance carriers) — `schemas.py`

`Fact`: `source_code`, `document_id`, `metric`, `value`/`normalized_value`/`raw_value`, `unit`, `paragraph_index`, `excerpt`, `extraction_confidence`, `extraction_method` (`rule_based|manual|model`), `fact_role` (`primary|dissent|alternative|context`), **`published_at: str` (no tz semantics)**, `created_at`.

### C.5 Evidence/provenance + publication requirements

- `evidence.py`: `build_evidence`, `build_evidence_for_facts`, `build_provenance_chain(s)`, `verify_provenance` — provenance chains are built and verified per IO.
- `pipeline_state.py`: states `PENDING → ACCESSIBLE → DOCUMENTED → EXTRACTED → EVIDENCED → GOVERNED → PUBLISHABLE`; terminal: `PUBLISHABLE`, `BLOCKED`, `FAILED`.
- `fetcher.py`: `content_keywords` filtering + `parse_html_index()` (generic titles for HTML index docs).
- `SUPPORTED_SOURCE_CONTRACT.md` v1.0 (2026-08-12): supported classes incl. central bank RSS, regulator RSS, statistical authority RSS (partial), corporate IR, government HTML index; **lists "JS-rendered pages" as Not-Yet-Supported (infrastructure constraint; ONS precedent)** and Akamai-protected as blocked (urllib+Playwright evidence, RBA/ARAMCO).

## D. Six-Source Validation Matrix (Checks A–E, per Directive 1.4)

Hierarchy applied (1.5): Content Path → Observed Intelligence Type → Event Type Compatibility → Metric Compatibility → Semantic Representation. No regex/config/terminology issue was classified as a model gap before configuration assessment.

| Source | Observed content type (selected evidence path only) | Intended intelligence type | Proposed event type | A: Event type support | B: Trigger metric compatibility | C: Pattern normalization | D: Semantic representation | E: Configuration vs Model boundary |
|---|---|---|---|---|---|---|---|---|
| **LSE** (UK) | Corporate results/announcements via RNS ("Aviva plc Half Year Results Announcement 2026", trading updates, contract wins) | Market intelligence | `earnings_release` | **SUPPORTED** — type exists; **first candidate in the entire evidence base** (no prior earnings source) | **INCONCLUSIVE** — metric extraction (`revenue`/`eps`/`net_income`) not attempted in Q1; the extraction surface exists (full RNS body renders), pattern execution untested | identity fallback (no earnings pattern types normalized) | **COMPATIBLE** — title/date/source/body map to Fact fields (`excerpt`, `published_at`) | Pattern authoring for RNS phrasing = configuration domain; **UNTESTED** — no remediation attempted |
| **FDIC** (US) | Regulatory press releases incl. enforcement lists (CRA examinations, deposit-insurance reviews) | Regulatory intelligence | `regulatory_enforcement` | **SUPPORTED** | **INCONCLUSIVE** — enforcement subset plausibly carries `defendant_name`/`penalty_amount`/`action_type`; not all releases are enforcement; pattern execution untested | identity fallback | **COMPATIBLE** | **CONFIGURATION FIXABLE (hypothesis)** — precedent: FED_ENF, same regulator family + same event type, config-only remediation **PROVEN** (`f16bc00`) |
| **ISTAT** (IT) | Statistical releases ("Consumer prices – July 2026", "Foreign trade and import prices", "Industrial production") | Macro statistics | `statistical_release` | **SUPPORTED** | Strong **semantic** match (consumer prices→`inflation_rate`; foreign trade→`cross_border_change`); **syntactic** match untested (ABS precedent warns terminology varies) | identity fallback | **COMPATIBLE** | **CONFIGURATION FIXABLE (hypothesis)** — precedent: Eurostat, same event type, config-only **PASS** (`3454603`) |
| **DFSA** (AE) | Regulatory notices via RSS | Regulatory intelligence (GCC) | `regulatory_enforcement` | **SUPPORTED** | **INCONCLUSIVE** — EN phrasing, metric-bearing detail pages not deep-probed | identity fallback | **COMPATIBLE** | **CONFIGURATION FIXABLE (hypothesis)** — precedent: BaFin, regulator RSS → same event type, config-only **PASS** (`282de0f`) |
| **DG Trésor** (FR) | Policy/economic commentary articles ("Objectif Afrique", ESS strategy, petroleum analysis) | Policy/economic intelligence | none proposed | **NOT SUPPORTED** — no commentary-type event exists among the 6 | N/A (no candidate metrics on this path) | N/A | **INCONCLUSIVE** — "policy/economic commentary" is a **representation-gap CANDIDATE**, not a proven gap | **NOT YET ASSESSED** — content-path qualification (v2 SQR alignment stage) not run; per hierarchy, cannot be called a model gap before configuration/path assessment |
| **BMF** (DE) | Fiscal-policy press announcements, mixed general/finance feed (`bmf.de` committed record; long-domain rendering per B.2) | Fiscal policy intelligence | none proposed | **NOT SUPPORTED** — no fiscal-policy event type exists (monetary_policy_decision is central-bank rates, not fiscal) | N/A | N/A | **INCONCLUSIVE** — "fiscal policy announcement" is a **representation-gap CANDIDATE** | **NOT YET ASSESSED** — same discipline; alternate paths (e.g., issuance/auction data) not qualified |

## E. Metric / Trigger Analysis

- **Rate family** (the only normalized family) is absent from all six selected paths — none of the six publishes rate decisions on the evidenced path.
- **Identity-fallback metrics** (`statistic_value`, `penalty_amount`, `action_type`, `revenue`, …) cover the four SUPPORTED candidates syntactically at the **metric-name level**; the untested layer is **pattern execution** (regex ↔ source phrasing), which the evidence base already isolates as a Gate-5 root-cause category (FED_ENF/ABS precedents).
- **No new metric names were required** to propose mappings for LSE/FDIC/ISTAT/DFSA — all proposed mappings use existing `trigger_metrics` vocabulary.

## F. Semantic Representation Analysis

COMPATIBLE: LSE, FDIC, ISTAT, DFSA (title + date + source + body → Fact/Event/IO concepts; provenance chain buildable).
INCONCLUSIVE: DG Trésor, BMF — observed content types ("policy/economic commentary", "fiscal policy announcement") have no matching event type; recorded as candidates only.

## G. Configuration vs Model Boundary

| Boundary class | Cases | Evidence discipline |
|---|---|---|
| Configuration domain (pattern authoring + path selection) | LSE, FDIC, ISTAT, DFSA | Hypotheses with committed precedents (FED_ENF `f16bc00`, Eurostat `3454603`, BaFin `282de0f`); **none executed in Q3** (no onboarding authorized) |
| Model representation (candidate only) | DG Trésor commentary type; BMF fiscal-announcement type | **NOT confirmed as gaps** — path qualification not run; recorded as candidates per §1.5 hierarchy |
| Engineering | **NONE** | No case in Q3 required or authorized engineering |

## H. Cross-Jurisdiction Timestamp Semantics (Phase 2)

| Source | Timestamp value (evidence) | Timezone representation | Explicit? | Publication or update | Cross-jurisdiction ordering safe? | Classification |
|---|---|---|---|---|---|---|
| LSE | `14 August 2026` + `07:00:02` (rendered; JS-set title) | none — local implied | NO | publication (RNS release time) | NOT SAFE without rule | **NORMALIZATION-REQUIRES-RULE** |
| FDIC | RSS `Mon, 10 Aug 2026 13:10:04 -0500`; HTML `<time datetime="2026-06-05">` | RFC-822 offset (RSS); date-only (HTML) | YES (RSS) / NO (HTML) | publication | RSS: SAFE; HTML date-only: needs rule | **NORMALIZATION-SAFE (RSS channel)** |
| ISTAT | `Wed, 12 Aug 2026 08:00:58 +0000` | RFC-822 UTC | YES | publication | SAFE | **NORMALIZATION-SAFE** |
| DFSA | `Wed, 06 May 2026 08:16:50 +0000` | RFC-822 UTC | YES | publication | SAFE | **NORMALIZATION-SAFE** |
| DG Trésor | `<time datetime="2026-07-29T00:00:00.0000000">` (naive); meta `29/07/2026 00:00:00`; URL `/2026/07/29/` | ISO-like **without offset** | NO | publication | NOT SAFE without rule (naive local) | **NORMALIZATION-REQUIRES-RULE** |
| BMF | `bmf.de` RSS `+0000`; rendered `12.08.2026` (date-only) | RFC-822 UTC (feed) | YES (feed) | publication | feed: SAFE | **NORMALIZATION-SAFE (RSS channel)** |

**Contract-level finding:** `Fact.published_at` is a timezone-naive string (§C.4) — the current contract cannot represent the distinction the evidence exposes. Confirms §B.6: **CROSS-JURISDICTION TIME NORMALIZATION = CORE DESIGN REQUIREMENT / NOT YET IMPLEMENTED.** No normalization implemented in Q3.

## I. Confirmed Compatible Cases

Four of six (LSE, FDIC, ISTAT, DFSA) map onto **existing** event types with **existing** metric vocabulary — at the type/metric/representation level. **Pattern execution was NOT run** (no onboarding authorized); compatibility is at contract level, with committed same-family precedents for three of them (FED_ENF, Eurostat, BaFin).

## J. Confirmed Representation Gaps

**NONE CONFIRMED.** Two **candidates** documented under discipline: "policy/economic commentary" (DG Trésor path) and "fiscal policy announcement" (BMF path) — each requires content-path qualification before any model-gap claim (§G).

## K. Inconclusive Cases

- LSE/FDIC/DFSA trigger-metric execution (pattern-level): INCONCLUSIVE — untested.
- ISTAT syntactic match: INCONCLUSIVE — untested (semantic match strong).
- DG Trésor & BMF representation: INCONCLUSIVE — candidates pending path qualification.
- (Carried, outside the six: DMO access INCONCLUSIVE; CBUAE UNMEASURED; MoF XLS in-file dates UNTESTED.)

## L. What Q3 Establishes

1. **Integrity gate closed:** BMF original path reproduces exactly (Case A); rendering evidence now dual-run VALIDATED; the Q2 "boundary shift" interpretation is **formally retracted** as a URL-difference artifact; BMF's committed RSS evidence is now **triply executed**.
2. The six validated Q2 cases split **4 compatible / 2 candidates** against the existing 6-event-type contract — with zero engineering and zero new metrics required for the four.
3. The evidence base now contains its **first earnings_release candidate** (LSE) — a type that exists in the contract but has no committed source precedent.
4. **Timestamp normalization is a proven Core design requirement** (three naive/no-zone forms vs three explicit-zone forms; naive string field in the contract).
5. 35 evidence files now carry SHA-256; a hashing convention is adopted going forward.

## M. What Q3 Does NOT Establish

- No prevalence, no rates, no denominators — universe prevalence UNKNOWN.
- No pattern-execution (Gate-5-level) result for any of the six — compatibility here is contract-level.
- No confirmation that DG Trésor/BMC content types are model gaps — candidates only.
- No engineering authorization, no event types added, no pipeline/config/schema changes.
- No capability decision-status change; no investment-readiness change.

## N. Implications for Core Architecture (observations only — no decisions)

1. **Timestamp normalization** (B.6/H): the contract's `published_at` cannot carry zone semantics the evidence requires — a Core design item, explicitly NOT implemented here.
2. **Content-type coverage**: two candidate types (policy commentary; fiscal announcements) sit outside the 6-event-type set — whether they enter via new event types, new trigger metrics, or path selection is a product/architecture decision **not made in Q3** (same discipline as Qualification V2 §"solution not yet determined").
3. **Documented tension (no modification)**: `SUPPORTED_SOURCE_CONTRACT.md` v1.0 (2026-08-12) lists JS-rendered pages as Not-Yet-Supported/infrastructure-constrained (ONS precedent), while Q1/Q2 instrument evidence shows the rendering instrument resolving a JS-shell case (LSE) and a soft-anti-bot case (BMF long domain). The contract is FROZEN-era evidence; the tension is recorded here for the consolidation phase — rendering remains a **validated instrument capability, not an integrated pipeline capability** (integration would be engineering — NOT authorized).

## O. Recommended Next Validation (for user decision; nothing started)

1. **Content-path qualification (v2 SQR alignment stage) for DG Trésor and BMF** — resolves whether representable paths exist before any model-gap claim.
2. **One pattern-execution pilot** on the strongest precedent-backed candidate (ISTAT vs `statistical_release`, Eurostat precedent) — pure configuration exercise, no code.
3. Carry the timestamp-normalization design requirement into the planned **Evidence Consolidation → Core Architecture Design** phase (alongside the STRATEGIC_DECISION_RECORD update the user already scheduled there).

---

## P. Evidence File Ledger (SHA-256, Directive Phase 6)

Files retained locally in session storage (`/tmp`, `/tmp/q2`, `%TEMP%`); hashes computed 2026-08-15T21:44–21:46Z. Retrieval commands: §N of Q1 artifact (`ee7ca83`), §Reproduction of Q2 artifact (`a72d5d8`), and §B above.

**Q1 evidence (window 21:05–21:21Z):**

| File | SHA-256 | Source URL / capture |
|---|---|---|
| lse_news_shell.html | `c082660492d1bfb06ac164700d1187ed1d47dc1e940d356ff9f622546ef03d25` | LSE /news · curl |
| lse_rendered.html | `bbdd4222cb969e7a07deb4406497587deb64a76ab05f06de854516ab282b5aa0` | LSE /news · Chromium run 1 |
| lse_rendered_run2.html | `8d397f730dc24b0a19b20a41b92f70c9d7f4dfdae5d289f0138b22ca3931bbbe` | LSE /news · Chromium run 2 |
| lse_article.html | `8065db436ae026bf0a694ddfb4d8731e78cfc519b30522d253a0f13d98616b3d` | Aviva article · Chromium |
| lse_news_shot.png | `18ea166b154abd764732eb1559dd292fda94692e25983d29bcdc4d31538270a4` | LSE /news · screenshot 21:19Z |
| lse_article_shot.png | `0b996ee2cd53ac83ae5f50c6d3391a800642b6836ec1b2066d22a0fba998b33e` | Aviva article · screenshot 21:19Z |

**Q2 evidence (window 21:27–21:33Z):**

| File | SHA-256 | Source URL / capture |
|---|---|---|
| fdic_pr.html | `7bd901d66845ec1a7da9107319a776554763d58bb3db2825b5b48ce604977eba` | FDIC press-releases · curl 21:27:09Z |
| fdic_rss.xml | `8bdba0c4a713eb76f7b83d590ea317093e5dbf7a4c191be5f3b5a133889c3bc2` | GovDelivery USFDIC_26 · curl 21:27:39Z |
| istat_feed.xml | `5a6fe3a90ea555b9a7e71627235eb5eaca9ad4ca5d96aa7d2954b34e8ed9089b` | ISTAT /en/feed/ · curl 21:27:12Z |
| dfsa_rss.xml | `9f10799d3e23863dfb288668f7cceadd9fb838e2de74aca3dd3fd5132dbbe73c` | DFSA /rss · curl 21:28:11Z |
| dfsa_ar.html | `a40997c7682c476fe02c096bdfd3197069c8f74d2a8ef824ce723cd1967a38b0` | DFSA /ar/ · curl 21:32:4xZ |
| dgt_home.html | `94de38782fa87c4f46855170385fdfc6fb32205d2c85a57efc11a070e70438a6` | DGT homepage · curl 21:27:43Z |
| dgt_art.html | `c7d7cd71d9fe1c171ecb9691326efe19ce5e1018516f6b9c90ca5937487b9b75` | DGT article 2026/07/29 · curl 21:28:2xZ |
| dgt_list.html | `9166d795912218b3aa17750b872fbb7e66a053bb6335bdc7a3946e01e49c3267` | DGT /Articles/list (404 diagnostic) |
| bmf_feed.xml | `aed75152623cbb3b1917fd506b33d2e80e5ea69c24c925af0cffdea07fc23665` | bundesfinanzministerium.de/feed (404 diagnostic) |
| bmf_de.html | `9173735b3fd1cd5352d871c8e2478b42a69b992b391587d2ef82c6b6c3adcb8b` | long-domain DE home · curl (Radware capture) |
| bmf_en.html | `54028c2736944bca04dce15d30af80c1578a47616bfd45e47267ceb5391751e1` | long-domain EN home · curl (Radware capture) |
| bmf_rendered.html | `166114fd96accd27da90aa36806f68e3d5806dfdf2fea049f8595ea5f0d7b8f8` | long-domain DE · Chromium 21:29:28Z |
| bmf_en_rendered.html | `d45cd7522ee8ab948216f0cdf93870997c61c2b7a5b8f84469184a6fd37efdc2` | long-domain EN · Chromium |
| mof_jgbs.html | `234c8a60dc117e7d3eacd7bab44f43a24476311c67b815ea5ba446bb250616c5` | MoF /jgbs/ (JA) |
| mof_en_jgbs.html | `0c67e4aa8bcb633d82d06d1cd2ef326bf94dd386dc92cd8a0b3dc9fc76a24e7f` | MoF /english/policy/jgbs/ |
| mof_past.html | `f8978458abef025c35f91e2a784d0df356e24ce59df601e1081c855700d41669` | MoF past_auction_results |
| mof_cal.html | `f846f8b4518c8a08a223b01641a52bcdc459f83e9444654682f8a353ee026ea1` | MoF calendar (static) |
| mof_cal_rendered.html | `ef080881273fd705672e096ba29037b2a68301ef2a9952d2414293d378db0ec3` | MoF calendar · Chromium 21:31:26Z |
| mof_auc.html | `2ca7d19638243e9d320ba2124dbb8d52185bf7e2304e00660179c46c43311ef4` | MoF auction/index |
| mof_jgb_results.xls | `0f1f58fc9997da2e9ad3009cba3fcd29926da0db458da03b87a5af8387c31ba7` | Auction_Results_for_JGBs.xls |
| cbuae_rendered.html | `85f295f7ce951f0145751dd6644486e84794b90c2d50438b1c23601bb739a3be` | CBUAE · Chromium error interstitial 21:32:03Z |
| dmo_rendered.html | `40a64bbbb981a7153d7dfefe0411de6f1f54431b2c05e9da7a17da09a12b4cc7` | DMO · Chromium (ShieldSquare) 21:28:53Z |

**Integrity-gate evidence (21:41–21:43Z):**

| File | SHA-256 | Source URL / capture |
|---|---|---|
| evrec_73b7668.md | `883a14da74caf8c1c190d6bb743e4cd2c326a7411ee0e5d5441522b800998308` | EVIDENCE_RECORDS_V1 @ 73b7668 (raw GitHub copy) |
| bmf_original_feed.xml | `229962777112ccacfa9dd1ac7d7aa83ce212d08afe8b6e6ebcb5f285e5764c6d` | bmf.de/feed · verbatim command 21:41:42Z |
| bmf_original_home.html | `3809a52cf80ffc70881142d13a2ac01bd8ea67e984923a933088164da9a94927` | bmf.de/ · curl 21:41:5xZ |
| bmf_rerun_static_de.html | `651656d74e1079cc02707ad5ed503561f4c2f68394a8e0d60a84e78a05440e54` | long-domain DE · curl 21:42:24Z |
| bmf_rerun_static_en.html | `cb263efc046dfdd96a38546896b1ce838da2f59b36baf4ea299f36f373619cce` | long-domain EN · curl 21:42:2xZ |
| bmf_rerun_render_de.html | `a1af63c9db50e630c9cd14c2997989ced307e99e12965fdfc4bb0d8b6522b85b` | long-domain DE · Chromium 21:43Z |
| bmf_rerun_render_en.html | `ce662063c41e063cafb013d55d86414666343a98f2676f9b1e8c9c1d3f9ec1a1` | long-domain EN · Chromium 21:43Z |

All 35 hashes above are complete values computed from the retained files (no truncation, no fabrication).

---

**Q3 closed as an evidence artifact. Engineering authorization: NONE. No event types added. No pipeline/config/schema modifications. No frozen artifact changed (incl. Q1/Q2 artifacts). STOP per directive — no source survey, no Event Model modification, no Repository 4, no Railway, no Institutional Buyer Simulation. Next phase awaits user decision on §O.**
