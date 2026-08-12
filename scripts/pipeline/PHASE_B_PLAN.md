# Phase B — 10-Source Generalization Test

## Goal

Test whether the abstraction built in Phase A.2 (generic pipeline, 0 source-specific code) generalizes across **diverse source types**, not just central banks.

> **Phase B is not a feature-building sprint. It is a generalization test.**
> We use the 10 sources to discover where abstraction is weak.
> We do NOT improve the system to make sources pass.
> If a layer needs redesign, we STOP and fix before adding more sources.

## Source Mix (10 sources across 6 categories)

| # | ID | Category | Source | Access | Stress Test |
|---|----|----|--------|--------|-------------|
| 1 | BOJ | central_bank | Bank of Japan | RSS + HTML | Different rate terminology (complementary-lending facility, basic loan rate) |
| 2 | RBNZ | central_bank | Reserve Bank of New Zealand | RSS + HTML | OCR (Official Cash Rate) — different rate name |
| 3 | SEC | financial_regulator | US Securities and Exchange Commission | RSS + HTML | Regulatory enforcement actions, penalty amounts, defendant names — **new event type** |
| 4 | FCA | financial_regulator | UK Financial Conduct Authority | RSS + HTML | Regulatory fines, UK jurisdiction — different regulatory vocabulary |
| 5 | ONS | statistical_authority | UK Office for National Statistics | RSS + HTML | UK economic statistics — **new fact type (numeric)** |
| 6 | BIS_STATS | statistical_authority | BIS Statistical Releases | RSS + HTML | Global liquidity indicators, banking statistics — different numeric domain |
| 7 | APPLE | corporate_ir | Apple Newsroom | RSS (Atom) + HTML | Corporate disclosures (revenue, EPS) — **new fact type** |
| 8 | ARAMCO | corporate_ir | Saudi Aramco IR | HTML (RSS blocked) | Dividend + earnings — **aligns with investment-intelligence evidence ($33.6B)** |
| 9 | OFAC | government_regulatory | US Treasury OFAC Recent Actions | HTML (no RSS) | Sanctions designations — entity names, countries, programs — **aligns with risk-intelligence evidence** |
| 10 | BIS_QR | pdf_heavy | BIS Quarterly Review | PDF download | PDF document extraction — **new content format** |

## Coverage of Required Stress Dimensions

| Required Dimension | Sources that Test It |
|--------------------|----------------------|
| Plain HTML | OFAC, ARAMCO, BIS_QR (landing) |
| RSS | BOJ, RBNZ, SEC, FCA, ONS, BIS_STATS, APPLE |
| PDF | BIS_QR |
| Complex HTML structure | OFAC (date-based URLs), ARAMCO (JS-heavy) |
| Numbers and ranges | ONS (CPI, employment), BIS_STATS (liquidity), APPLE (revenue), BIS_QR (financial data) |
| Regulatory events | SEC, FCA, OFAC |
| Corporate disclosures | APPLE, ARAMCO |
| Document-level parsing | BIS_QR (PDF), ARAMCO (disclosures) |

## Per-Source Reconnaissance (Verified)

| ID | Feed URL | Format | Items | Method | Notes |
|----|----------|--------|-------|--------|-------|
| BOJ | https://www.boj.or.jp/en/rss/whatsnew.xml | RSS 2.0 | 45 | urllib | OK |
| RBNZ | https://www.rbnz.govt.nz/feeds/news | RSS 2.0 | 50 | urllib | OK |
| SEC | https://www.sec.gov/news/pressreleases.rss | RSS 2.0 | 25 | urllib | `/rss/press.xml` is blocked, alt path works |
| FCA | https://www.fca.org.uk/news/rss.xml | RSS 2.0 | 20 | urllib | OK |
| ONS | https://www.ons.gov.uk/releasecalendar?rss&... | RSS 2.0 | 10 | urllib | OK |
| BIS_STATS | https://www.bis.org/doclist/all_statistics.rss | RSS 2.0 | 25 | urllib | OK — global liquidity indicators |
| APPLE | https://www.apple.com/newsroom/rss-feed.rss | Atom | 20 | urllib | OK |
| ARAMCO | https://www.aramco.com/en/news-and-events | HTML | n/a | blocked | Akamai blocked — will treat as access_blocked if both urllib+playwright fail |
| OFAC | https://ofac.treasury.gov/recent-actions | HTML | 10 date URLs | urllib | No RSS; date-based URLs discovered from index |
| BIS_QR | https://www.bis.org/publ/qtrpdf/r_qt2606.pdf | PDF | 1 (1.7MB) | urllib | PDF parser required (pdfplumber available) |

## Sources Replaced from Initial Plan

- **STATS_NZ** → **BIS_STATS**: Stats NZ has no working RSS feed (404 on all paths). Replaced with BIS Statistical Releases RSS, which produces real numeric facts (global liquidity indicators, international banking statistics) and is accessible. Same stress test (numeric facts).
- **APPLE_10K** → **ARAMCO**: Apple's IR page doesn't expose 10-K directly, and SEC EDGAR is partially blocked. Replaced with Aramco IR — aligns with website's investment-intelligence evidence ($33.6B dividend claim), tests corporate disclosure extraction with real alignment to product claims. May be access_blocked (Akamai) — that itself is a useful Phase B data point.

## Predicted Abstraction Stress Points

Based on recon, I expect failures/discoveries at:

1. **Extractor (Layer 3)** — currently hardcoded to `rate_patterns` only. SEC/FCA/OFAC need `regulatory_patterns`, ONS/STATS_NZ need `statistical_patterns`, APPLE/APPLE_10K need `earnings_patterns`. **Generic change needed**: extend extractor to iterate over multiple pattern categories.

2. **Detector (Layer 4)** — currently detects only `monetary_policy_decision`. Need to detect `regulatory_action`, `statistical_release`, `earnings_release`, `sanctions_designation`. **Generic change needed**: extend detector with multi-event-type detection.

3. **Fetcher (Layer 2)** — OFAC has no RSS. Need to parse an HTML index page to discover document URLs. **Generic change needed**: add HTML-index-to-document-list adapter (generic, no `if OFAC`).

4. **Fetcher (Layer 2)** — BIS_QR is a PDF. Need PDF text extraction. **Generic change needed**: add PDF-to-text adapter (generic).

5. **Schema (Layer 1)** — current Fact schema is metric-agnostic, so it should accommodate new fact types without change. **Verify**: no changes needed.

## Generic Change Count / Source (Tracked Live)

| Source | Generic Changes Required |
|--------|--------------------------|
| BOJ | TBD |
| RBNZ | TBD |
| SEC | TBD |
| FCA | TBD |
| ONS | TBD |
| STATS_NZ | TBD |
| APPLE | TBD |
| APPLE_10K | TBD |
| OFAC | TBD |
| BIS_QR | TBD |

**Rule**: If generic extractor changes ≥ 3 per source on average, abstraction is weak and we stop.

## Per-Source Measurement (Per User Spec)

For each source we record:

### Access
- fetch method (urllib / playwright / blocked)
- status (accessible / blocked)
- access classification

### Document
- substantive content found (yes/no)
- document type (press_release / regulatory_action / statistical_release / earnings_release / sanctions_action / pdf_report)
- extraction quality (good / partial / failed)

### Intelligence
- facts extracted (count + types)
- events detected (count + types)
- semantic roles used (primary / dissent / alternative / context)
- evidence records (count)
- provenance chains (count + verified)
- Intelligence Objects (count + quality)

### Engineering
- configuration only (yes/no)
- generic code modification (yes/no + description)
- source-specific code (MUST be 0)
- engineering time (estimate)

## Gate After Phase B — Three Separate Verdicts

### 1. Coverage
How many sources are reachable (accessible or blocked-classified)?

### 2. Generalization
How many sources reached: Source → Document → Fact/Event → Evidence → Provenance → IO
**WITHOUT source-specific engineering?**

### 3. Commercial Pilotability
How many sources can be onboarded in reasonable time with normal configuration effort?

> 10/10 PASS after 80 hours engineering ≠ Pilot-ready.
> 8/10 PASS with simple configuration in hours = closer to a sellable product.

## Hard Rules

1. **Source-specific code = 0** (always)
2. **No `if source == X` branches** (always)
3. **Website stays FROZEN** (Phase B is pipeline-only)
4. **Stop if a layer needs redesign** — report and ask before continuing
5. **Track every generic change** — count per source
6. **Reproducibility = 100%** for accessible sources
