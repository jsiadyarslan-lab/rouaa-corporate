# POST-Q3 TARGETED VALIDATION V1

**Status:** EXECUTED — EVIDENCE ARTIFACT (targeted qualification; evidence-only)
**Date:** 2026-08-15
**Directive:** EXECUTION DIRECTIVE — TARGETED POST-Q3 QUALIFICATION & TIMESTAMP BOUNDARY VALIDATION (user-issued verbatim)
**Prior gates:** Q1 `ee7ca83` · Q2 `a72d5d8` · Q3 `c7109ca`
**Scope discipline:** NOT a survey, NOT capability expansion, NOT engineering. No Event Model / pipeline / source-config / frozen-artifact / Investment-Framework modifications. No prevalence, no percentages, no denominators. No DG Trésor/BMF promotion to representation gap before content-path qualification (performed below). No ISTAT promotion to platform gap without execution evidence (performed below).

---

## A. Scope

Three targeted validations + one boundary characterization:
1. DG Trésor content-path qualification (resolve actual intelligence type on the selected path).
2. BMF content-path qualification — `bmf.de` and `bundesfinanzministerium.de` treated as **separate source paths/entities**.
3. ISTAT — ONE controlled execution-level pattern validation using the existing pipeline contract.
4. Cross-jurisdiction timestamp boundary characterization from existing + newly observed evidence.

Execution window: 2026-08-15T21:49Z – 21:55Z. Instruments: curl (browser UA); contract-faithful pattern execution (see §D environment note); read-only repo inspection @ `c7109ca`.

## B. DG Trésor Content-Path Qualification

**Selected path:** homepage articles list (`https://www.tresor.economie.gouv.fr/` → `/Articles/YYYY/MM/DD/slug`) — the same path evidenced in Q2.
**Documents inspected: 5/5** on the path (full census, not sample):

| # | Title | `<time datetime>` | URL date | Type |
|---|---|---|---|---|
| A1 | Appel à projets FASEP 2026 (funding call) | **2026-07-17** | **2026/06/25** | policy/operational call-for-projects |
| A2 | Adoption de la nouvelle stratégie ESS | 2026-07-16 | 2026/07/16 | policy strategy announcement |
| A3 | Équipe France: DG Trésor, AFD, Bpifrance | 2026-07-22 | 2026/07/16 | institutional cooperation |
| A4 | Le pétrole, une variable clef… | 2026-07-16 | 2026/07/16 | economic analysis |
| A5 | Objectif Afrique n°257 | 2026-07-29 | 2026/07/29 | newsletter/publication ("Trésor-Info Article"; byline "Rédigé par DG Trésor · Publié le 29 juillet 2026") |

- **Format/Language:** HTML articles, FR primary (EN pages exist — nav "The French Treasury (English Pages)").
- **Provenance behavior:** `<time datetime>` + meta `search.datePublished` + URL date (as per Q2) — machine-readable.
- **NEW provenance finding:** **A1 carries divergent dates — URL `/2026/06/25/` vs `<time datetime="2026-07-17">`** — at least two date semantics coexist (creation vs publication). Q2's "triple consistent" observation holds for the article tested there (A5) but **is not universal**; date-source disambiguation is required (feeds §E).
- **Homogeneity:** homogeneous as a family — "Trésor-Info articles: policy/analysis/institutional communication" — with heterogeneous sub-types; **zero metric-bearing statistical series** on this path.

**Verdict:** `CONTENT-PATH ALIGNED` — a stable, identifiable intelligence type exists on this path.
→ Proceeding (per directive sequence) to event-model check: no matching event type among the 6 (`monetary_policy_decision`, `regulatory_enforcement`, `statistical_release`, `earnings_release`, `sanctions_designation`, `market_statistic_release`) for "policy/economic analysis & institutional communication articles".
→ **`EVENT-MODEL REPRESENTATION GAP` — scoped to this path and content type.** Whether DG Trésor's OTHER paths (publications, data) contain representable content: **UNTESTED** (§H). Solution type (new event type / new metrics / scope exclusion) is a product/architecture decision **not made here** (Qualification V2 discipline).

## C. BMF Content-Path Qualification (two separate paths)

### C.1 `bmf.de` — the committed Expansion path (`73b7668` S1)

Feed re-fetched verbatim (`https://www.bmf.de/feed/`, 28,142 B, 10 pubDates — reproduces committed evidence). **All 10 items listed and inspected:**

| # | Date | Title (verbatim) |
|---|---|---|
| 1 | 05 Aug 2026 | Erfolgreiches Umweltmanagement-Audit |
| 2 | 05 Aug 2026 | BOA rocks 2026 |
| 3 | 19 May 2026 | BMF Group auf der KPA |
| 4 | 26 Sep 2025 | Nachhaltige und zuverlässige Energieversorgung |
| 5 | 26 Sep 2025 | Krisensicherste Unternehmen 2025 |
| 6 | 26 Sep 2025 | BOA Rocks 2025 |
| 7 | 16 Aug 2024 | BOA Rocks 2024 |
| 8 | 15 Aug 2024 | CDU Generalsekretär zu Gast bei der BMF |
| 9 | 20 Dec 2023 | Krisensicherste Unternehmen 2023 |
| 10 | 10 Nov 2023 | Umweltaudit nach ISO 14001 |

**ENTITY VERIFICATION (item page `bmf.de/uwa/`, 42,598 B):** the site is **Bürener Maschinenfabrik GmbH — "BMF Group"** — a German **machinery manufacturer** (product lines: Fördertechnik, Kühlschmierstoffsysteme, Komponenten, Kunststoff; "Technik mit Ideen — Die BMF…Bürener Maschinenfabrik GmbH"; contact info@bmf.de). WordPress 7.0.4 corporate PR feed.

**`SOURCE MISATTRIBUTION — DOCUMENTED` (correction recorded HERE only; frozen/old artifacts untouched per Phase 7):**
- The committed Expansion record S1 ("BMF — Germany, Finance Ministry · https://www.bmf.de/ ; feed …/feed/") attributed a **private company's corporate feed** to the Bundesministerium der Finanzen.
- The S1 probe evidence (RSS VALIDATED, 10 pubDates) is real and reproducible — but for the **wrong entity**. The interpretation "feed mixes general ministry news with finance items" in S1 is incorrect: none of the 10 items is ministry content.
- Consequence for consolidation: "**German Finance Ministry RSS VALIDATED**" must **not** be carried into any Core/coverage basis from S1. The ministry's own domain is `bundesfinanzministerium.de` (C.2).
- Note on Q3 §B.4: the URL-difference retraction stands and deepens — the two hostnames differ not merely as paths but as **entities**. Ironically, Q2's "guessed" long domain was the actual ministry; the committed short domain was the misattributed one.

**Verdict for `bmf.de`:** `CONTENT-PATH NOT ALIGNED` for institutional intelligence (wrong entity; corporate PR has no ROUAA intelligence type in scope). Resolution status: **NOT APPLICABLE** for this entity's feed as a Finance-Ministry source.

### C.2 `bundesfinanzministerium.de` — the actual ministry (Q2/Q3 rendering-validated path)

Evidence base (Q2 `a72d5d8` + Q3 `c7109ca`, dual byte-identical Chromium runs): `Content/DE/Pressemitteilungen/…` and `Content/EN/Pressemitteilungen/…` — homogeneous **ministerial fiscal-policy press releases**: Regierungsentwurf Bundeshaushalt 2027, Aktionsplan gegen Steuerkriminalität, Jahressteuergesetz 2026, Frühstartrente, Zollfinanzgerechtigkeitsgesetz (+ Monatsberichte monthly reports, Termine, FAQ). Bilingual DE↔EN with same-release URL-date correspondence. Access via rendering instrument (curl-side Radware gate intermittent — Q3 §B.2).

**Verdict:** `CONTENT-PATH ALIGNED` — stable type: **fiscal/tax/budget policy press announcements**.
→ Event-model check: no matching event type among the 6 (`monetary_policy_decision` is central-bank rates, not fiscal).
→ **`EVENT-MODEL REPRESENTATION GAP` — scoped to "fiscal policy press announcement" on this path.** Alternate ministry paths (e.g., Monatsberichte data tables): UNTESTED (§H).

## D. ISTAT Execution-Level Pattern Validation

**Environment note (honesty first):** the pipeline is Python; **no Python runtime exists in this environment** (Windows Store stub only). The test was therefore executed as a **contract-faithful manual execution**: the EXACT `statistical_patterns` (7 regexes, verbatim, case-sensitive as coded) from the `EUROSTAT` config in `scripts/pipeline/source_configs.py` @ `c7109ca` — the config that produced the Eurostat PASS precedent — applied to the **visible text** of representative ISTAT documents; metric mapping per `PATTERN_TYPE_METADATA` identity fallback (as coded); detection per `detect_event` rule (fact.metric ∈ `statistical_release.trigger_metrics`). Zero permanent config additions; diagnostic script retained (`istat_test.pl`, hash §F).

**Input documents (from the committed Q2 feed evidence):**

| Doc | URL | Size |
|---|---|---|
| istat_doc1 | istat.it/en/press-release/consumer-prices-july-2026/ | 103,892 B |
| istat_doc2 | istat.it/en/press-release/foreign-trade-and-import-prices-june-2026/ | 105,820 B |
| istat_doc3 | istat.it/en/press-release/industrial-production-june-2026/ | 103,743 B |

**Results (documents fetched: 3 · normalized: 3 · facts extracted: 4 · events detected: 2):**

| Doc | Facts | Metrics captured | Event (`statistical_release`) |
|---|---|---|---|
| doc1 (Consumer prices) | 1 | `percentage_statistic` ("3% compared with") | **DETECTED** |
| doc2 (Foreign trade) | 0 | — | NOT DETECTED |
| doc3 (Industrial production) | 3 | `percentage_statistic` ×3 | **DETECTED** |

All extracted facts' metrics are in `trigger_metrics` (identity fallback) — the detection contract functioned without any code or config change.

**Precision findings (root cause, per directive classification):**
1. doc1 — the CPI release itself — did **not** yield `inflation_rate`: ISTAT phrasing ("the Italian consumer price index … was +2.9% on annual basis") does not match P1/P2 ("consumer price **rate/annual/growth** was N%"). The value was captured only by the generic P6 pattern as `percentage_statistic`. → **metric-fidelity loss**, not detection failure.
2. doc2 zero facts: ISTAT foreign-trade phrasing places values parenthetically after the noun ("exports increased both for exports **(+1.6%)**", "**compared to** the same month") vs. the pattern's required trailing context ("N% **compared with**/year-on-year/of GDP"). → phrasing variance.
3. Root-cause classification: **`pattern-specificity`** (configuration domain — same class as FED_ENF `f16bc00`, config-only remediation PROVEN precedent, and the ABS hypothesis). NOT event-model (the type + generic metrics executed), NOT configuration-contract, NOT provenance, NOT adapter.

**Verdict:** `statistical_release` is **EXECUTION-COMPATIBLE** for ISTAT (2/3 documents, existing config verbatim, zero engineering). Dedicated-metric fidelity (`inflation_rate` as such) and doc2 coverage are **configuration remediation candidates — NOT attempted** (no permanent pattern addition, per directive).

**Provenance in this run:** RSS `pubDate` (second precision, `+0000`) per item; document-level date present on pages; evidence chain constructible per contract. IO generation: **not reached/attempted** (pipeline execution unavailable; events stopped at detection layer) — recorded as limitation, not failure.

## E. Cross-Jurisdiction Timestamp Boundary (Phase 4 — characterization only, nothing built)

| Class | Evidence (source) | Unambiguous today? | Safe cross-J ordering? | Does `Fact.published_at` preserve tz? | Normalization needed first? | Needs original + normalized UTC pair? |
|---|---|---|---|---|---|---|
| Explicit UTC (RSS RFC-822 `+0000`) | ISTAT, DFSA, bmf.de-feed | YES | YES | **NO** (naive string) | YES | Recommended |
| Explicit numeric offset (RFC-822 `-0500`) | FDIC | YES | YES | NO | YES | Recommended |
| Naive local ISO-like datetime | DG Trésor (`2026-07-29T00:00:00.0000000`) | **NO** | **NO** | NO | YES | **YES** |
| Rendered publication time, no zone | LSE (`14 August 2026` + `07:00:02`) | NO | NO | NO | YES | YES |
| Date-only (ISO `<time>`, rendered `12.08.2026`, URL dates, filenames) | FDIC-HTML, BMF-display, DGT-URL, MoF-filenames | Partial (day precision) | Only intra-day | NO | YES | Partial |
| **Same-source divergent date semantics** | **DGT A1: URL `2026/06/25` vs `<time>` `2026-07-17`** | **NO (ambiguous which semantic)** | NO | NO | YES + **semantic label** | **YES — original string + UTC + semantics** |

**Classification: `CORE DESIGN REQUIREMENT`** — extending Q3's observation: not only timezone normalization, but (a) date-**semantics** disambiguation (URL-date vs time-attr date vs display date), and (b) provenance dual-representation (original timestamp string + normalized UTC + semantics). `Fact.published_at` (plain string) supports none of these today. **NOT implemented here.**

## F. Evidence Matrix (Phase 5 — new files; Q1–Q3 ledgers stand in their artifacts)

All hashes computed from retained files; no fabrication. Reproduction commands = the exact commands in this run (curl lines + `perl istat_test.pl …`).

| File | SHA-256 | Source / capture (UTC) |
|---|---|---|
| dgt_home2.html | `94de38782fa87c4f46855170385fdfc6fb32205d2c85a57efc11a070e70438a6` | DGT homepage · 21:49:58Z (byte-identical to Q2 `dgt_home.html` — page stable) |
| dgt_a1.html | `df63bb44ff03d25baaaba1c18a57cb9ed3e1569515ab971a3115c990ee32ef84` | DGT article A1 (FASEP) · 21:50:2xZ |
| dgt_a2.html | `b17a87bd7f90124e0b70b85a9e3397c1a7d976a3a1dfa34c75061fa71a5a2e64` | DGT article A2 (ESS) |
| dgt_a3.html | `803bd13453ce56437d389bc9006812c2e018a6d43f64842ed20470ebb85433da` | DGT article A3 (Équipe France) |
| dgt_a4.html | `e66b902e7beee16cb22262def7a0dd82a7762a195017a70b1584abb2b0ad17f8` | DGT article A4 (pétrole) |
| dgt_a5.html | `c7d7cd71d9fe1c171ecb9691326efe19ce5e1018516f6b9c90ca5937487b9b75` | DGT article A5 (Objectif Afrique) — byte-identical to Q2 `dgt_art.html` |
| bmfde_feed.xml | `229962777112ccacfa9dd1ac7d7aa83ce212d08afe8b6e6ebcb5f285e5764c6d` | bmf.de/feed · 21:50:58Z (byte-identical to Q3 integrity copy) |
| bmfde_item.html | `c71663ea38d26219f5185a850b11981571574555267b05322d19c8fac7859a7e` | bmf.de/uwa/ (entity verification) · 21:51:5xZ |
| bmfde_root.html | `95a52297cebafe638eebe038d6db5f029c85497330bd7c6771167d05cf71a37d` | bmf.de/ homepage |
| istat_doc1.html | `3e80a44fee395f5d7b8e837e6b6d29e4cd8c5064bd24c1b977694ddbbb5f7fdf` | ISTAT consumer-prices-july-2026 · 21:53Z |
| istat_doc2.html | `31f705ba17d024845a78bac5f59c2614dd9aa18014365c9abf2cb6d7eab9e912` | ISTAT foreign-trade-june-2026 |
| istat_doc3.html | `5f8bed28124d1e691aeb1d9cd0da03ae8cef63906feaab3e1ffdf3255c8b81c1` | ISTAT industrial-production-june-2026 |
| istat_test.pl | `2e56414f076933582b38b9c4ce4d8b0d9d01c5a80fc96a8a99cc8893df41bc05` | Contract-faithful diagnostic (patterns verbatim from EUROSTAT config) |

**Limitations:** local retention only (not committed as binaries); DGT sub-type classification from representative text (A1–A5 full-census of the path at capture time); ISTAT test executed at document-text layer, not via the Python pipeline (environment constraint, §D); doc2 phrasing inspection limited to percentage contexts.

## G. What Is Now Confirmed

1. **Two scoped EVENT-MODEL REPRESENTATION GAPS** (both after content-path qualification, per hierarchy):
   - "policy/economic analysis & institutional communication articles" — DG Trésor Trésor-Info path.
   - "fiscal policy press announcement" — Bundesfinanzministerium (long domain) Pressemitteilungen path.
   Neither is a platform/engineering verdict; solution type undecided.
2. **`bmf.de` SOURCE MISATTRIBUTION** — committed S1 evidence belongs to Bürener Maschinenfabrik GmbH (private machinery company), not the Finance Ministry; must not feed any coverage/consolidation basis as ministry evidence.
3. **ISTAT `statistical_release` EXECUTION-COMPATIBLE** — 2/3 docs, 4 facts, 2 events, existing config verbatim, zero engineering; remaining misses classified `pattern-specificity` (config domain, FED_ENF-precedented).
4. **Timestamp/date boundary = CORE DESIGN REQUIREMENT** — now including same-source divergent date semantics (DGT A1) and the provenance dual-representation (original + normalized UTC + semantics).
5. DGT provenance is machine-readable but **not uniformly self-consistent** (A1 divergence).

## H. What Remains Untested

- DG Trésor alternate paths (publications/data sections) for representable content.
- Ministry alternate paths (Monatsberichte data tables, Termine) beyond press releases.
- ISTAT config-only remediation (dedicated `inflation_rate` phrasing; doc2 parenthetical/"compared to" variants) — candidates only, not attempted.
- LSE earnings_release execution; FDIC/DFSA enforcement execution (Q3 contract-level only).
- IO publication/quality-threshold layer for ISTAT (events stopped at detection; no pipeline runtime here).
- Rendering as an INTEGRATED pipeline capability (remains instrument-validated only).

## I. Configuration vs Model vs Adapter Boundaries

| Domain | Items | Status |
|---|---|---|
| Configuration | ISTAT dedicated-metric fidelity; doc2 phrasing variants; (future) DGT/ministry path selections | Remediation candidates, precedented (FED_ENF `f16bc00`), NOT executed |
| Model | 2 scoped representation gaps (§G.1) | Confirmed as boundary evidence; solution (new event types vs metrics vs scope exclusion) = product/architecture decision, NOT made |
| Adapter | Browser rendering integration | Instrument-VALIDATED (Q1/Q2/Q3); pipeline integration = engineering, NOT authorized, NOT required by today's findings |
| Evidence integrity | hostname→entity verification (the `bmf.de` lesson) | New lesson recorded (§C.1) — candidate SQR-stage check for consolidation phase; nothing modified |

## J. Core Architecture Implications (observations only)

1. The Event Model's 6-type vocabulary now has **two confirmed, path-scoped content-type gaps** — the first model-level boundary evidence in the workstream. Any Core architecture definition must decide: extend types, or scope these content types out.
2. **Timestamp/provenance contract** needs dual-field + semantics design (original string, normalized UTC, date-semantic label) — upgrade of `Fact.published_at`.
3. **Source onboarding integrity**: hostname→entity verification should become a formal qualification step (bmf.de lesson).
4. Zero engineering was required or performed for any finding above.

## K. Required Future Validation (user decision; nothing started)

1. ISTAT config-only remediation test (FED_ENF-style) — would convert 2/3 → 3/3 and restore `inflation_rate` fidelity.
2. DGT/ministry alternate-path qualification — only if those content types are in product scope.
3. Decision input for Evidence Consolidation: the two scoped gaps + timestamp requirement + entity-verification lesson.

---

**Artifact complete. No frozen artifact modified (corrections for `bmf.de` misattribution and DGT date divergence recorded HERE only). No permanent source configuration added. No engineering. STOP per Phase 8 — no survey, no engineering, no Repository 4, no Railway, no Institutional Buyer Simulation. Next phase per directive: Evidence Consolidation → Core Architecture Definition → Core Engine Build/Test.**
