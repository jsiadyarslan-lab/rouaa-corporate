# CROSS-JURISDICTION EVIDENCE EXPANSION ASSESSMENT V1

**Status:** READY FOR REVIEW
**Date:** 2026-08-15
**Inputs:** `CROSS_JURISDICTION_CAPABILITY_VALIDATION_EXPANSION_V1.md` (@ `654e7f8`, status-map update @ `590eecd`) · `EVIDENCE_RECORDS_V1.md` (@ `73b7668`, dual-session verified) · Frozen Registry V1 (`dd66cc1`) · Frozen Investment Framework V1 (`c02374a`) · Frozen Design Constraints V1 (`bb3f43a`)
**Nature:** Assessment artifact — NOT a replacement for the Registry. No frozen artifact modified. No prevalence calculated — universe prevalence UNKNOWN throughout.

---

## Section A — Scope

- 15 sources probed (13 evidence-committed · 1 INCONCLUSIVE · 1 UNMEASURED)
- 7 jurisdictions: DE, FR, IT, UK, US, JP, AE
- 7 institutional classes: central bank, finance ministry/treasury, statistics authority, financial regulator/SRO, fiscal watchdog, exchange/market infrastructure, debt management office
- Intelligence types OBSERVED in content (not inferred from institution role): statistical_release, regulatory_enforcement, fiscal_policy communications, market-auction documents, monetary-institutional communications — 5 content classes observed; 2 sources unclassifiable (S6 blocked, S13 unreachable)
- Publication architectures OBSERVED: 8 (WordPress CMS-RSS, Drupal RDFa HTML, custom CMS with URL-dates, GovDelivery distribution, Zend RSS, ASP.NET HTML, static document-centric, SPA/JS-shell) + 1 access-protection boundary (anti-bot) that is NOT counted as a publication architecture

---

## Section B — Source-by-Source Evidence Table

| Source | Country | Class | Intelligence type (observed) | Evidence state | Resolution state | Provenance result | Rendering result | Evidence commit | Limitation |
|---|---|---|---|---|---|---|---|---|---|
| S1 BMF | DE | Finance Ministry | fiscal communications (feed content) | VALIDATED (positive) | NOT APPLICABLE | pubDate 10/10 machine-readable | RSS/XML + server-rendered | 73b7668 | general-news feed mix; non-DE path untested |
| S2 BdF | FR | Central Bank | institutional/monetary communications | OBSERVED (boundary) | UNTESTED | dates human-text only; no machine dates on tested path | server-rendered HTML | 73b7668 | feed undiscovered; FR path untested |
| S3 DG Trésor | FR | Treasury | fiscal/analysis articles | VALIDATED (positive) | NOT APPLICABLE | meta date + `<time>` + URL-date (triple) | server-rendered HTML | 73b7668 | single article deep-probed |
| S4 ISTAT | IT | Statistics | statistical_release | VALIDATED (positive) | NOT APPLICABLE | pubDate 10/10 | RSS/XML | 73b7668 | IT-primary feed untested |
| S5 MEF | IT | Treasury | treasury communications | OBSERVED (boundary) | UNTESTED | dates text-only; ambiguous format | server-rendered HTML | 73b7668 | IT path untested |
| S6 DMO | UK | Debt Mgmt Office | NOT CLASSIFIED (blocked; role-based inference prohibited) | INCONCLUSIVE | NOT YET ASSESSED | unusable (blocked) | blocked / anti-bot | 73b7668 | browser retry unauthorized this phase |
| S7 OBR | UK | Fiscal Watchdog | fiscal forecasts | VALIDATED (positive) | NOT APPLICABLE | pubDate 10/10 | RSS/XML | 73b7668 | list-level only |
| S8 LSE | UK | Exchange | market announcements (class-level; content unrendered) | OBSERVED (boundary) | UNTESTED | UNMEASURED via plain HTTP | JavaScript shell | 73b7668 | Playwright unauthorized this phase |
| S9 FDIC | US | Regulator | regulatory_enforcement | VALIDATED (positive) | NOT APPLICABLE | ISO `<time>` + pubDate 25/25 (dual) | RSS/XML + server-rendered | 73b7668 | distribution-layer latency unmeasured |
| S10 FINRA | US | SRO Regulator | regulatory_enforcement | VALIDATED (positive) | NOT APPLICABLE | ISO-8601 `<time>` w/ timezone | server-rendered HTML (JS-heavy) | 73b7668 | no feed discovered |
| S11 MoF-JP | JP | Treasury | market-auction documents (dated files observed) | OBSERVED (mixed: date-in-URL VALIDATED; architecture boundary OBSERVED) | UNTESTED | dates in filenames/paths; no listing metadata | document-centric static | 73b7668 | JA path untested |
| S12 JSB | JP | Statistics | statistical series pages | OBSERVED (boundary) | UNTESTED | no machine dates on tested pages | static catalog | 73b7668 | JA path untested |
| S13 CBUAE | AE | Central Bank | NOT CLASSIFIED (unreachable) | UNMEASURED | NOT YET ASSESSED | unmeasured | unmeasured | 73b7668 | cause unresolved; alt-network retry unauthorized |
| S14 SCA | AE | Regulator | regulatory news | OBSERVED (boundary) | UNTESTED | mixed text date formats on one page | server-rendered HTML (1 script) | 73b7668 | AR path untested |
| S15 DFSA | AE | Regulator (DIFC) | regulatory_enforcement + legislative | VALIDATED (positive) | NOT APPLICABLE | pubDate 20/20 | RSS/XML | 73b7668 | item-link resolution untested |

Evidence-state audit note (directive Section 4F): no classification was upgraded on the basis of similarity to previously working sources. LSE remains OBSERVED (not VALIDATED) because browser-rendered acquisition was not performed. All VALIDATED classifications rest on deterministic, re-executed probes (dual-session identical results) — recorded as method-strength, not as an upgrade path.

---

## Section C — Evidence Profile Changes (vs. frozen Registry)

### Capability 1 — Provenance
- **Previous (Registry):** 3 confirmed cases — ESMA OBSERVED (boundary), SNB VALIDATED (positive), BaFin OBSERVED (positive; remediation attributed to Capability 7)
- **New confirmed cases in this expansion:** 7 VALIDATED positives (BMF, DG Trésor, ISTAT, OBR, FDIC, FINRA, DFSA) + 3 OBSERVED boundaries (BdF, MEF, JSB — text/absent machine dates) + 1 OBSERVED mixed-format boundary (SCA)
- **New positive compatibility cases:** the 7 above (Rule 3: compatibility, NOT remediation evidence)
- **New boundaries:** text-only dates recurred at 3 institutions (FR central bank, IT treasury, JP statistics) — same boundary class as ESMA, new institutions/geographies
- **Evidence diversity change:** expanded to 6 new countries and 5 new institutional classes on the provenance dimension
- **Remains UNKNOWN:** universe prevalence; non-EN primary paths; deep-page date fidelity; DMO/CBUAE provenance

### Capability 2 — Content-Path
- **Previous:** 8 VALIDATED aligned cases (US Treasury, RBI, SEBI, PRA + 4 aligned; ABS VALIDATED)
- **New:** 5 VALIDATED standard feed paths (BMF, ISTAT, OBR, FDIC, DFSA) + 1 VALIDATED HTML path (DG Trésor) + 2 OBSERVED HTML-only/no-feed (BdF, MEF) + 2 OBSERVED document-centric (MoF-JP, JSB)
- **Diversity change:** +2 new architecture patterns observed (GovDelivery distribution, static document-centric)
- **Remains UNKNOWN:** prevalence; whether feeds exist at undiscovered paths for the no-feed cases

### Capability 3 — Pattern Specificity
- **Previous:** FED_ENF EVIDENCE-SUPPORTED (config-only resolved); ABS HYPOTHESIS
- **New:** 3 OBSERVED boundaries — BMF general-news feed mix; SCA mixed date formats; MoF-JP filename-date patterns
- **Resolution:** all UNTESTED (no config-vs-engineering determination made)
- **Remains UNKNOWN:** remediation type for each; prevalence

### Capability 4 — Adapter / Browser Rendering
- **Previous:** TCMB ENGINEERING-REQUIRED (confirmed); 3 validated adapter cases; reuse UNKNOWN
- **New:** 1 OBSERVED JS-shell boundary (LSE — exchange class, UK)
- **Diversity change:** boundary evidence now spans 2 institutional classes (central bank, exchange) and 2 geographies (TR, UK) — per-case; NO aggregate claim
- **Remains UNKNOWN:** whether Playwright acquisition succeeds for LSE; engineering-requirement status for LSE (TCMB precedent does NOT transfer automatically); DMO rendering behavior (blocked before rendering)

### Capability 5 — Language
- **Previous:** 7 confirmed gaps across 6 languages
- **New:** ZERO new confirmed gaps. All functional probes ran on EN paths; EN availability observed on 8+ sources (BCB precedent: EN available ≠ gap)
- **Diversity change:** none on the boundary side; EN-availability observations recorded as context only
- **Remains UNKNOWN:** all non-EN primary paths (FR, IT, JA, AR) — untested this round; DMO/CBUAE language behavior

### Capability 6 — Event-Model
- **Previous:** 3 confirmed representation gaps (Bundesbank, FSB, UK HMT) + 4 observed potential types
- **New:** content-type observations on new classes (fiscal watchdog, exchange-class, auction documents) — OBSERVATIONS ONLY; NO representation-gap conclusions (directive Section 8: content observation ≠ event-model boundary)
- **Diversity change:** observation-side breadth increased; boundary side unchanged
- **Remains UNKNOWN:** whether any observed type is uncovered by the event model; DMO/CBUAE event behavior

### Capability 7 — Configuration Contract Compatibility
- **Previous:** 4 VALIDATED incompatible + 1 REMEDIATION-VALIDATED (BaFin config-only) + 2 VALIDATED compatible (Eurostat, FED_ENF)
- **New:** 5 VALIDATED compatible feed contracts (WordPress ×3, GovDelivery, Zend) + HTML contracts compatible (S3, S10 et al.) + 1 OBSERVED plain-fetcher-incompatible case (LSE — no server content; per-case)
- **Diversity change:** compatible-case set expanded across 4 new countries and 4 distribution technologies
- **Remains UNKNOWN:** DMO/CBUAE contracts; LSE contract under browser rendering

---

## Section D — Capability Impact

| # | Capability | Verdict |
|---|---|---|
| 1 | Provenance | **EVIDENCE PROFILE EXPANDED** |
| 2 | Content-Path | **EVIDENCE PROFILE EXPANDED** |
| 3 | Pattern Specificity | **EVIDENCE PROFILE EXPANDED** (3 new OBSERVED boundaries) |
| 4 | Adapter / Browser Rendering | **EVIDENCE PROFILE EXPANDED** (1 new OBSERVED boundary; new class + geography) |
| 5 | Language | **NO CHANGE** (no new boundary evidence; EN-availability context only) |
| 6 | Event-Model | **NO CHANGE** (content observations only; no boundary established) |
| 7 | Configuration Contract | **EVIDENCE PROFILE EXPANDED** |

Investment readiness NOT automatically changed for any capability (directive Section 6D).

---

## Section E — New Observations

| Observation | Disposition |
|---|---|
| LSE JS-shell rendering boundary | **fits existing capability** — Browser Rendering / Adapter (same boundary class as TCMB); evidence state OBSERVED only |
| DMO anti-bot protection (ShieldSquare) | **remains observation only** — NOT registered as a capability (Rule 4); recorded as access boundary; applicability NOT established |
| BdF / MEF / JSB textual-date representations | **fits existing capability** — Provenance boundary class (same as ESMA); per-case OBSERVED |
| SCA mixed date formats | **fits existing capability** — Pattern Specificity boundary; per-case OBSERVED |
| Japanese document-centric publication (MoF-JP, JSB) | **fits existing capability** — Content-Path pattern variety; per-case OBSERVED |

No new capability created.

---

## Section F — Evidence Quality

- **Confirmed evidence:** 13 per-case records, dual-session re-verified, reproduction commands verbatim (EVIDENCE_RECORDS_V1 @ 73b7668)
- **Positive compatibility:** 7 VALIDATED positives (+ MoF-JP date-in-URL partial) — compatibility evidence, NOT remediation evidence (Rule 3)
- **Observation-only evidence:** 6 boundary observations (S2, S5, S8, S11, S12, S14) — single boundary-class observations, no remediation tested
- **Inconclusive evidence:** 1 (S6 DMO — access blocked; reproduced 4×; excluded from capability inference)
- **Unmeasured evidence:** 1 (S13 CBUAE — no response; excluded entirely)
- **Unsupported hypotheses:** none created this round (HYPOTHESIS count = 0)

Method limitation (recorded, not remediated): session-1 per-probe wall-clock timestamps were not individually logged; session-2 re-verification is fully timestamped and results were identical.

---

## Section G — Decision-Relevance

**Investment Framework inputs CHANGED by this expansion:**
- Evidence Strength Profile — new per-case evidence added (7 VALIDATED positives, 6 boundary OBSERVED)
- Evidence Coverage — qualitative descriptor basis enriched per capability (confirmed cases observed in this expansion; universe prevalence UNKNOWN)
- Evidence Diversity — geography (7 jurisdictions), institutional class (7), publication architecture (8+1) all broadened
- Resolution Profile — new UNTESTED entries (6) and NOT YET ASSESSED entries (2)

**Investment Framework inputs NOT changed:**
- Strategic Value — no strategic context provided or inferred
- Strategic Alignment — unchanged
- Engineering Cost — unchanged (line-counts remain excluded; cost/risk UNCALIBRATED)
- Engineering Risk — unchanged
- Customer Demand — NO SIGNAL EXISTS

No strategic context was invented (directive Section 6G). Decision Readiness remains provisional/manual under the uncalibrated framework (Design Constraints Open Gap: Decision-Readiness Calibration).
