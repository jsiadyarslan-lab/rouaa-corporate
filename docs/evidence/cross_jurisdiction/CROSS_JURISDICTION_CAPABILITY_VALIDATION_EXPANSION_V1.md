# CROSS-JURISDICTION CAPABILITY VALIDATION EXPANSION V1

**Status:** EXECUTED — EVIDENCE ARTIFACT (execution-only, evidence-only)
**Date:** 2026-08-15
**Directive:** EXECUTION DIRECTIVE — CROSS-JURISDICTION CAPABILITY VALIDATION EXPANSION V1 (user-issued verbatim)
**Scope discipline:** No modifications to any FROZEN artifact. No new capability added to the framework. No investment decision produced. No prevalence inferred. No denominator used. Per-case evidence profiles only.

**Environment note (reproducibility):** All probes executed via direct HTTP (curl, default UA overridden with a standard browser UA, `--max-time 15–40s`, redirects followed). Playwright/browser-rendered acquisition was NOT performed in this round. "Evidence commit" for every case below is **THIS COMMIT** — the artifact and its evidence were pushed together in one commit; the exact probe commands are recorded per case for reproducibility.

---

## A. Scope

Expand the existing Capability Evidence base with a geographically and institutionally diverse sample across 7 jurisdictions (Germany, France, Italy, United Kingdom, United States, Japan, United Arab Emirates), monitoring the 7 registered capabilities (Provenance, Content-Path, Pattern Specificity, Browser Rendering / Adapter, Language, Event-Model, Configuration Contract Compatibility).

- Previous confirmed evidence cases are RETAINED and NOT replaced.
- This round ADDS cases only.
- Purpose: test whether previously discovered capability boundaries recur across different architectures, institutions, and geographies — under strict evidence-ledger discipline.
- Explicit non-goals: no BUILD NOW, no INVESTMENT CANDIDATE, no CUSTOMER-SPECIFIC, no COMMERCIAL CHANGE, no prevalence inference, no new framework capability.

---

## B. Selected Sources

Selection criteria applied: official primary institutions only; no news sites or aggregators; institutional-class diversity (not only central banks); architecture and publishing-model diversity; language diversity. Sources were NOT selected for ease of access.

| # | Country | Institution | Institutional Class | Primary Path Tested | Intelligence Type (observed) |
|---|---|---|---|---|---|
| S1 | Germany | Bundesministerium der Finanzen (BMF) | Finance Ministry | https://www.bmf.de/ (WordPress; /feed/) | fiscal_policy / ministry announcements |
| S2 | France | Banque de France (BdF) | Central Bank | https://www.banque-france.fr/en/press-release | monetary_policy / institutional news |
| S3 | France | Direction générale du Trésor (DG Trésor) | Treasury | https://www.tresor.economie.gouv.fr/ + /Articles/… | fiscal_policy / economic analysis |
| S4 | Italy | ISTAT | Statistics Authority | https://www.istat.it/en/ (WordPress; /en/feed/) | statistical_release |
| S5 | Italy | Ministero dell'Economia e delle Finanze (MEF) | Treasury | https://www.mef.gov.it/en/ufficio-stampa/comunicati/ | fiscal_policy / treasury communications |
| S6 | United Kingdom | UK Debt Management Office (DMO) | Debt Management Office | https://www.dmo.gov.uk/ | market_infrastructure / auction announcements |
| S7 | United Kingdom | Office for Budget Responsibility (OBR) | Fiscal Watchdog | https://obr.uk/ (WordPress; /feed/) | fiscal_policy / forecasts |
| S8 | United Kingdom | London Stock Exchange (LSE) | Exchange / Market Infrastructure | https://www.londonstockexchange.com/news | market announcements |
| S9 | United States | FDIC | Financial Regulator | https://www.fdic.gov/news/press-releases + GovDelivery RSS | regulatory_enforcement |
| S10 | United States | FINRA | Financial Regulator | https://www.finra.org/newsroom | regulatory_enforcement |
| S11 | Japan | Ministry of Finance Japan (MoF) | Treasury | https://www.mof.go.jp/english/ (document-centric) | market_infrastructure / JGB auctions, fiscal |
| S12 | Japan | Statistics Bureau of Japan (JSB) | Statistics Authority | https://www.stat.go.jp/english/ (static catalog) | statistical_release |
| S13 | UAE | Central Bank of the UAE (CBUAE) | Central Bank | https://www.cbuae.gov.ae/en | monetary_policy |
| S14 | UAE | Securities and Commodities Authority (SCA) | Financial Regulator | https://www.sca.gov.ae/en/media-centre/news.aspx | regulatory_enforcement |
| S15 | UAE | Dubai Financial Services Authority (DFSA) | Financial Regulator (DIFC) | https://www.dfsa.ae/ (Zend; /rss) | regulatory_enforcement |

Language coverage of tested primary paths: English (S2, S6–S10, S13–S15), German (S1 primary; EN version exists), French (S3 primary; EN present on S2), Italian (S5 primary path tested in EN; S4 EN feed), Japanese institutions tested on EN paths (S11, S12). **Non-English primary paths were NOT tested in this round** — see Section K.

---

## C. Per-Source Evidence Ledger

Fields per directive. "Rendering requirement" = judged from server-HTML content presence (JS-shell detection); Playwright NOT run. "Config compatibility" = judged against a standard RSS/HTML fetcher contract only.

### S1 — BMF (Germany, Finance Ministry)
- country: Germany · institution: Bundesministerium der Finanzen · class: finance ministry
- source URL: https://www.bmf.de/ ; feed: https://www.bmf.de/feed/
- source type: ministry CMS (WordPress) · language: de-DE primary; EN (hreflang `/en/frontpage/`, `lang="en-GB"`) and PL versions available
- intelligence type: fiscal policy / ministry announcements (feed observed mixing general ministry news)
- acquisition path tested: HTTP GET → RSS 2.0 (`/feed/`, 200, 10 items) and HTML
- rendering requirement: NONE (server-rendered WordPress)
- provenance behavior: `<pubDate>` present on 10/10 feed items (POSITIVE, deterministic)
- content-path behavior: single general `/feed/` — no dedicated press-release-only feed discovered on homepage
- event/intelligence type observed: ministry announcements incl. non-financial items (e.g., environmental audit) in same feed
- configuration compatibility: standard WordPress RSS 2.0 — COMPATIBLE with standard fetcher contract
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE (no remediation needed for acquisition/provenance)
- evidence strength: VALIDATED (deterministic, reproducible: feed served with pubDate on every item)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.bmf.de/feed/`)
- failure/boundary: pattern specificity — general-news feed mixes non-financial items (OBSERVED)
- remediation status: UNTESTED for pattern filtering (applicable, not attempted)
- NOT established: whether a dedicated press-only feed exists at an undiscovered path; non-EN primary-path behavior for provenance

### S2 — Banque de France (France, Central Bank)
- country: France · institution: Banque de France · class: central bank
- source URL: https://www.banque-france.fr/en/press-release (list page, 200, ~392 KB server-rendered Drupal)
- source type: central-bank website (Drupal, RDFa) · language: EN tested (FR primary exists)
- intelligence type: monetary policy / institutional communications
- acquisition path tested: HTTP GET → HTML (server-rendered; 8 scripts, full content present)
- rendering requirement: NONE for acquisition (content server-rendered)
- provenance behavior: dates rendered as human-readable TEXT only ("7 August 2026"); NO `<time datetime>`, NO date `<meta>` discovered on list page
- content-path behavior: HTML-only; NO RSS/Atom feed link discovered on press pages
- event/intelligence type observed: press releases (payments, financial stability)
- configuration compatibility: HTML path compatible with standard fetcher; no feed contract to test
- evidence state: boundary case (provenance metadata via HTML path)
- resolution status: UNTESTED (date-extraction remediation applicable, not attempted)
- evidence strength: OBSERVED (boundary observed once, direct)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.banque-france.fr/en/press-release`)
- failure/boundary: no machine-readable dates in HTML; no feed discovered
- remediation status: UNTESTED
- NOT established: whether a feed exists at an undiscovered path; FR-primary path behavior

### S3 — DG Trésor (France, Treasury)
- country: France · institution: Direction générale du Trésor · class: treasury
- source URL: https://www.tresor.economie.gouv.fr/ ; articles: /Articles/2026/07/16/…
- source type: treasury site (custom CMS) · language: fr primary (EN sections exist for some content)
- intelligence type: fiscal policy / economic analysis
- acquisition path tested: HTTP GET → HTML article (200, server-rendered)
- rendering requirement: NONE
- provenance behavior: TRIPLE date evidence — `<meta name="search.datePublished" content="16/07/2026 00:00:00">`, `<time datetime="2026-07-16T00:00:00.0000000">`, AND date embedded in URL path `/Articles/YYYY/MM/DD/` (POSITIVE)
- content-path behavior: date-bearing URL structure — content path is itself provenance-carrying
- event/intelligence type observed: policy/analysis articles
- configuration compatibility: HTML path compatible
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED (deterministic meta + time + URL date)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.tresor.economie.gouv.fr/Articles/2026/07/16/le-petrole-…`)
- failure/boundary: none observed for provenance; no RSS discovered (minor)
- remediation status: NOT APPLICABLE
- NOT established: feed availability; non-FR path coverage

### S4 — ISTAT (Italy, Statistics Authority)
- country: Italy · institution: ISTAT · class: statistics authority
- source URL: https://www.istat.it/en/ ; feed: https://www.istat.it/en/feed/
- source type: statistics authority (WordPress) · language: EN feed tested (IT primary)
- intelligence type: statistical_release (Consumer prices July 2026; Foreign trade June 2026 — observed in feed titles)
- acquisition path tested: HTTP GET → RSS 2.0 (`/en/feed/`, 200, 10 items)
- rendering requirement: NONE
- provenance behavior: `<pubDate>` on 10/10 items (POSITIVE)
- content-path behavior: EN feed dedicated to statistical output
- event/intelligence type observed: statistical releases
- configuration compatibility: standard WordPress RSS — COMPATIBLE
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.istat.it/en/feed/`)
- failure/boundary: none observed
- remediation status: NOT APPLICABLE
- NOT established: IT-primary feed behavior

### S5 — MEF (Italy, Treasury)
- country: Italy · institution: Ministero dell'Economia e delle Finanze · class: treasury
- source URL: https://www.mef.gov.it/en/ufficio-stampa/comunicati/ (200, ~110 KB server-rendered)
- source type: ministry site · language: EN tested (IT primary)
- intelligence type: fiscal policy / treasury communications
- acquisition path tested: HTTP GET → HTML
- rendering requirement: NONE (6 scripts, content server-rendered)
- provenance behavior: dates as rendered TEXT only ("08/07/2026" MM/DD/YYYY-style); NO `<time>`/date-meta discovered
- content-path behavior: HTML-only; no feed discovered
- event/intelligence type observed: comunicati (press communications)
- configuration compatibility: HTML path compatible
- evidence state: boundary case (provenance metadata via HTML)
- resolution status: UNTESTED
- evidence strength: OBSERVED
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.mef.gov.it/en/ufficio-stampa/comunicati/`)
- failure/boundary: text-only dates; no feed
- remediation status: UNTESTED
- NOT established: IT-primary behavior; feed existence at undiscovered path

### S6 — UK DMO (United Kingdom, Debt Management Office)
- country: United Kingdom · institution: UK Debt Management Office · class: debt management office
- source URL: https://www.dmo.gov.uk/
- source type: government agency site · language: EN
- intelligence type: market infrastructure / auction announcements (inferred from institution role — NOT observed)
- acquisition path tested: HTTP GET (homepage + /news/)
- rendering requirement: UNMEASURED
- provenance behavior: UNMEASURED
- content-path behavior: UNMEASURED
- event/intelligence type observed: NONE (no content retrieved)
- configuration compatibility: UNMEASURED
- evidence state: access-blocked
- resolution status: NOT APPLICABLE / NOT YET ASSESSED (remediation applicability not established)
- evidence strength: INCONCLUSIVE (rule 14: failure NOT converted to capability evidence)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.dmo.gov.uk/` → ShieldSquare block page, 14 KB)
- failure/boundary: bot-protection (ShieldSquare/Radar challenge page served to non-browser client) — recorded as an OBSERVED ACCESS BOUNDARY, NOT registered as a capability (rule 12: no new capability added this round)
- remediation status: NOT APPLICABLE / NOT YET ASSESSED (browser-session retry not attempted)
- NOT established: whether a real browser session succeeds; whether feeds exist; ALL capability behavior for this source

### S7 — OBR (United Kingdom, Fiscal Watchdog)
- country: United Kingdom · institution: Office for Budget Responsibility · class: fiscal watchdog (independent official body)
- source URL: https://obr.uk/ ; feed: https://obr.uk/feed/
- source type: independent official institution (WordPress) · language: EN
- intelligence type: fiscal policy / official forecasts
- acquisition path tested: HTTP GET → RSS 2.0 (`/feed/`, 200, 10 items)
- rendering requirement: NONE
- provenance behavior: `<pubDate>` on 10/10 items (POSITIVE)
- content-path behavior: WordPress feed on news path
- event/intelligence type observed: forecast announcements ("Autumn 2026 forecast date announced", borrowing outturns)
- configuration compatibility: standard WordPress RSS — COMPATIBLE
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED
- evidence commit: THIS COMMIT (probe: `curl -sL https://obr.uk/feed/`)
- failure/boundary: none observed
- remediation status: NOT APPLICABLE
- NOT established: deep page-level date fidelity (list-level only tested)

### S8 — LSE (United Kingdom, Exchange)
- country: United Kingdom · institution: London Stock Exchange · class: exchange / market infrastructure
- source URL: https://www.londonstockexchange.com/news (200, ~55 KB)
- source type: exchange news application · language: EN
- intelligence type: market announcements (RNS-class)
- acquisition path tested: HTTP GET → HTML
- rendering requirement: PROBABLE — server HTML is a JS application shell: 24 script tags, no server-rendered news list content in initial HTML (observed body text = JS bootstrap only)
- provenance behavior: UNMEASURED (no content rendered to non-browser client)
- content-path behavior: UNMEASURED via plain HTTP
- event/intelligence type observed: NONE via plain HTTP
- configuration compatibility: INCOMPATIBLE with plain-fetcher contract (no server-side content) — per-case only
- evidence state: boundary case (browser rendering / adapter)
- resolution status: UNTESTED (rendering remediation applicable — Playwright not run this round)
- evidence strength: OBSERVED (JS-shell boundary observed directly and reproducibly; NOT validated via browser)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.londonstockexchange.com/news`)
- failure/boundary: SPA/JS-shell — same boundary CLASS as previously confirmed TCMB case, different jurisdiction and institutional class
- remediation status: UNTESTED
- NOT established: whether Playwright acquisition succeeds; content structure post-render; provenance post-render

### S9 — FDIC (United States, Regulator)
- country: United States · institution: FDIC · class: financial regulator
- source URL: https://www.fdic.gov/news/press-releases ; feed: https://public.govdelivery.com/topics/USFDIC_26/feed.rss
- source type: regulator site + GovDelivery distribution · language: EN
- intelligence type: regulatory_enforcement (CRA lists, application reviews — observed in titles)
- acquisition path tested: HTTP GET → HTML (200, server-rendered with content) + RSS (200, 25 items)
- rendering requirement: NONE
- provenance behavior: DUAL — `<time datetime="2026-08-10">` ISO tags in HTML AND `<pubDate>` on 25/25 feed items (STRONG POSITIVE)
- content-path behavior: dedicated press-release path + dedicated GovDelivery feed
- event/intelligence type observed: enforcement-adjacent regulatory actions
- configuration compatibility: standard RSS 2.0 via GovDelivery — COMPATIBLE
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED (dual-path deterministic)
- evidence commit: THIS COMMIT (probes: fdic.gov/news/press-releases; public.govdelivery.com/topics/USFDIC_26/feed.rss)
- failure/boundary: none observed
- remediation status: NOT APPLICABLE
- NOT established: nothing material for this round's capabilities

### S10 — FINRA (United States, Regulator)
- country: United States · institution: FINRA · class: financial regulator (SRO)
- source URL: https://www.finra.org/newsroom (200, ~103 KB)
- source type: SRO newsroom · language: EN
- intelligence type: regulatory_enforcement / disciplinary actions
- acquisition path tested: HTTP GET → HTML (newsroom server-renders content: ISO `<time datetime="2026-08-03T12:00:00Z">` present despite heavy GTM tagging, 93 scripts); RSS probe `/rss/newsroom` → 404
- rendering requirement: NONE for list acquisition (content is server-rendered; JS-heavy but not a shell)
- provenance behavior: `<time datetime>` with ISO-8601 + timezone (POSITIVE)
- content-path behavior: HTML-only; no feed discovered
- event/intelligence type observed: press releases
- configuration compatibility: HTML path compatible
- evidence state: positive compatibility case (provenance via HTML)
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.finra.org/newsroom`)
- failure/boundary: none for provenance; no feed (minor)
- remediation status: NOT APPLICABLE
- NOT established: feed existence at other paths

### S11 — MoF Japan (Japan, Treasury)
- country: Japan · institution: Ministry of Finance · class: treasury
- source URL: https://www.mof.go.jp/english/ (200, ~31 KB)
- source type: document-centric ministry site (static HTML + PDF) · language: EN path tested (JA primary)
- intelligence type: market infrastructure (JGB auction calendar/results), fiscal/budget documents
- acquisition path tested: HTTP GET → HTML + direct document paths
- rendering requirement: NONE
- provenance behavior: dates embedded IN FILENAMES/paths — `auct20260813e.htm`, `eresul20260812.htm`, `20260609100449.html` (dates recoverable from URL; POSITIVE-leaning pattern), but no feed, no `<time>` metadata observed on listing pages
- content-path behavior: document-centric — no newsfeed aggregation page discovered; content organized by policy directory
- event/intelligence type observed: auction announcements/results (document class)
- configuration compatibility: HTML path compatible; pattern differs from feed/CMS sources
- evidence state: mixed — date-in-URL positive pattern; no-feed / doc-centric architecture boundary
- resolution status: UNTESTED (path-pattern remediation applicable, not attempted)
- evidence strength: OBSERVED (architecture boundary); date-in-URL = VALIDATED (deterministic)
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.mof.go.jp/english/`)
- failure/boundary: document-centric publishing without feed aggregation (content-path pattern)
- remediation status: UNTESTED
- NOT established: JA-primary path behavior; full auction-result date fidelity

### S12 — Statistics Bureau of Japan (Japan, Statistics Authority)
- country: Japan · institution: Statistics Bureau, MIC · class: statistics authority
- source URL: https://www.stat.go.jp/english/ (200, ~20 KB)
- source type: static statistics catalog site · language: EN path tested (JA primary)
- intelligence type: statistical_release (CPI etc.)
- acquisition path tested: HTTP GET → HTML
- rendering requirement: NONE (6 scripts, static)
- provenance behavior: no machine-readable dates discovered on listing pages; catalog-style numeric paths (`/english/data/cpi/1581-z.html`)
- content-path behavior: static catalog by statistical series — no feed, no news list
- event/intelligence type observed: statistical series pages (release-level structure)
- configuration compatibility: HTML path compatible
- evidence state: boundary case (provenance metadata + feed absence)
- resolution status: UNTESTED
- evidence strength: OBSERVED
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.stat.go.jp/english/`)
- failure/boundary: static catalog architecture; text/absent dates
- remediation status: UNTESTED
- NOT established: JA-primary behavior; series-page date fidelity

### S13 — CBUAE (UAE, Central Bank)
- country: UAE · institution: Central Bank of the UAE · class: central bank
- source URL: https://www.cbuae.gov.ae/en
- acquisition path tested: HTTP GET (×2, incl. HTTP/1.1 forced, 40s timeout)
- rendering requirement: UNMEASURED · provenance: UNMEASURED · content-path: UNMEASURED
- event/intelligence type observed: NONE (no response)
- configuration compatibility: UNMEASURED
- evidence state: network-level failure from test environment
- resolution status: NOT ASSESSED
- evidence strength: UNMEASURED (rule 14 — NOT capability evidence)
- evidence commit: THIS COMMIT (probe logs show HTTP 000, 0 bytes)
- failure/boundary: connection failure (timeout/TLS) — environment-level; NO capability inference
- remediation status: NOT ASSESSED (retry from different network NOT attempted)
- NOT established: EVERYTHING for this source

### S14 — SCA (UAE, Regulator)
- country: UAE · institution: Securities and Commodities Authority · class: financial regulator
- source URL: https://www.sca.gov.ae/en/media-centre/news.aspx (200, ~120 KB)
- source type: regulator site (ASP.NET) · language: EN path tested (AR primary presumed)
- intelligence type: regulatory_enforcement / market notices
- acquisition path tested: HTTP GET → HTML
- rendering requirement: NONE (1 script — fully server-rendered)
- provenance behavior: MIXED date formats as text on same page ("05/13/2025" AND "05 August 2026"); no `<time>`/meta dates discovered
- content-path behavior: HTML-only (.aspx); no feed discovered
- event/intelligence type observed: news items (titles rendered)
- configuration compatibility: HTML path compatible
- evidence state: boundary case (provenance metadata format inconsistency)
- resolution status: UNTESTED
- evidence strength: OBSERVED
- evidence commit: THIS COMMIT (probe: `curl -sL "https://www.sca.gov.ae/en/media-centre/news.aspx"`)
- failure/boundary: mixed human-readable date formats (pattern-specificity boundary for parsers)
- remediation status: UNTESTED
- NOT established: AR-primary behavior; feed existence

### S15 — DFSA (UAE, Regulator — DIFC)
- country: UAE · institution: Dubai Financial Services Authority · class: financial regulator (DIFC)
- source URL: https://www.dfsa.ae/ ; feed: https://www.dfsa.ae/rss
- source type: regulator site (Zend Framework feed writer) · language: EN
- intelligence type: regulatory_enforcement / legislative amendments
- acquisition path tested: HTTP GET → RSS 2.0 (`/rss`, 200, 20 items)
- rendering requirement: NONE
- provenance behavior: `<pubDate>` on 20/20 items (POSITIVE)
- content-path behavior: single general feed; item titles include joint-regulator actions, regulatory relief, legislation notices
- event/intelligence type observed: enforcement-adjacent + legislative
- configuration compatibility: standard RSS 2.0 — COMPATIBLE
- evidence state: positive compatibility case
- resolution status: NOT APPLICABLE
- evidence strength: VALIDATED
- evidence commit: THIS COMMIT (probe: `curl -sL https://www.dfsa.ae/rss`)
- failure/boundary: none observed
- remediation status: NOT APPLICABLE
- NOT established: item-level link resolution fidelity

---

## D. Capability Evidence Profile

Per-capability summary of THIS ROUND's cases only (no aggregation with frozen Registry; per-case discipline; NO MAX aggregate; NO prevalence).

| Capability | Positive cases this round | Boundary cases this round | Unmeasured |
|---|---|---|---|
| 1. Provenance | S1 (RSS pubDate), S3 (meta+time+URL-date), S4 (pubDate), S7 (pubDate), S9 (dual ISO+pubDate), S10 (ISO time w/ TZ), S15 (pubDate), S11-partial (date-in-URL) | S2, S5, S12 (text-only/absent dates), S14 (mixed text formats) | S6, S13 |
| 2. Content-Path | Standard paths on S1, S3, S4, S7, S9, S10, S15 | S11, S12 (document-centric catalogs, no feed/list), S2, S5 (HTML-only, no feed) | S6, S13 |
| 3. Pattern Specificity | — | S1 (general-news feed mixes non-financial items), S14 (mixed date formats), S11 (filename-date patterns) | S6, S13 |
| 4. Browser Rendering / Adapter | — | S8 (JS-shell; no server content) | S6 (bot-protection — applicability not established), S13 |
| 5. Language | EN paths verified functional on S1, S2, S4, S5, S11, S12, S14, S15 (EN availability observed) | NONE confirmed as gap this round (per BCB precedent: EN available ≠ gap) — non-EN primary paths NOT tested | non-EN primary paths |
| 6. Event-Model | Content types observed: statistical_release (S4, S12), regulatory_enforcement (S9, S10, S15, S14), fiscal_policy (S1, S3, S5, S7), market_infrastructure/auction (S11) | Observed content types on new classes — NOT confirmed representation gaps | S6, S13 |
| 7. Configuration Contract | Compatible RSS contracts: WordPress (S1, S4, S7), GovDelivery (S9), Zend (S15); HTML contracts: S3, S10 | S8 incompatible with plain-fetcher (no server content) | S6, S13 |

---

## E. Evidence Diversity

- **Geography:** 7 jurisdictions (DE, FR, IT, UK, US, JP, AE) — 3 continents+GCC.
- **Institutional classes:** 7 (central bank, finance ministry/treasury, statistics authority, financial regulator/SRO, fiscal watchdog, exchange/market infrastructure, debt management office).
- **Publishing architectures:** WordPress CMS-RSS, Drupal RDFa HTML, custom CMS with URL-dates, GovDelivery distribution, Zend RSS, ASP.NET HTML, static document-centric (JA), SPA/JS-shell, bot-protected.
- **Languages of tested paths:** EN (11), DE (1 primary), FR (1 primary), plus EN-side verifications on IT/JP institutions. Non-EN primary paths untested (Section K).
- **Intelligence types observed:** 4–5 classes (monetary/institutional, statistical_release, regulatory_enforcement, fiscal_policy, market_infrastructure/auction).
- **Acquisition methods tested:** RSS 2.0 fetch, HTML fetch, document-path fetch. NOT tested: browser rendering (Playwright), APIs.

---

## F. Resolution Profile

| Resolution status | Cases |
|---|---|
| NOT APPLICABLE (no remediation needed — positive/routing outcomes) | S1*, S3, S4, S7, S9, S10, S15 (7) |
| UNTESTED (remediation applicable, not attempted) | S2, S5, S8, S11, S12, S14 (6) |
| NOT APPLICABLE / NOT YET ASSESSED (applicability not established) | S6 (bot-protection) (1) |
| NOT ASSESSED (unmeasured) | S13 (network failure) (1) |
| CONFIG-ONLY REMEDIATION VALIDATED | 0 this round |
| ENGINEERING REQUIRED (per-case) | 0 CONFIRMED this round (S8 is engineering-suspected but NOT confirmed — Playwright not run) |

*S1 carries a secondary UNTESTED flag for pattern-filtering remediation; primary acquisition/provenance is NOT APPLICABLE.

---

## G. Newly Observed Boundaries

1. **JS-shell rendering boundary at an exchange (S8 LSE).** Same class as previously confirmed TCMB (engineering-required) — recurred at a different jurisdiction AND institutional class (exchange vs central bank). Evidence state this round: OBSERVED only (no browser validation).
2. **Anti-bot protection at an official government source (S6 DMO, ShieldSquare).** NEW boundary CLASS not among the 7 registered capabilities. Per directive rule 12, NOT added to the framework; recorded here as an observed access boundary. Remediation applicability not established (browser-session retry not attempted).
3. **Text-only / absent machine-readable dates on HTML paths (S2 BdF, S5 MEF, S12 JSB).** Recurrence of the provenance-metadata boundary class (previously: ESMA) at new institutions/geographies (central bank FR, treasury IT, statistics JP). OBSERVED; remediation UNTESTED.
4. **Mixed date formats on one page (S14 SCA).** "05/13/2025" and "05 August 2026" coexist — pattern-specificity boundary for parsers. OBSERVED.
5. **General-news feed mixing non-financial items (S1 BMF).** Feed-level pattern-specificity boundary (feed exists and carries provenance, but item filtering needed). OBSERVED.
6. **Document-centric publishing without feed aggregation (S11 MoF, S12 JSB).** Content organized as policy directories/filenames, not newsfeeds — a distinct content-path pattern (dates recoverable from URLs at MoF). OBSERVED.

---

## H. Positive Compatibility Cases

7 fully VALIDATED positive cases (deterministic, reproducible):
1. S1 BMF — WordPress RSS, pubDate 10/10, EN+PL versions (DE ministry).
2. S3 DG Trésor — HTML `search.datePublished` + `<time datetime>` + URL-embedded dates (FR treasury).
3. S4 ISTAT — WordPress `/en/feed/`, pubDate 10/10, statistical releases (IT statistics).
4. S7 OBR — WordPress `/feed/`, pubDate 10/10, fiscal forecasts (UK watchdog).
5. S9 FDIC — GovDelivery RSS pubDate 25/25 + HTML ISO `<time datetime>` (US regulator) — strongest dual-path case.
6. S10 FINRA — server-rendered ISO-8601 `<time datetime="…Z">` with timezone despite JS-heavy page (US SRO).
7. S15 DFSA — Zend RSS 2.0, pubDate 20/20 (UAE/DIFC regulator — first GCC feed-positive case in evidence base).

Plus partial positive: S11 MoF date-in-URL/document-name pattern (VALIDATED as a pattern; source overall OBSERVED).

---

## I. Inconclusive / Unmeasured Cases

1. **S6 DMO — INCONCLUSIVE.** ShieldSquare bot-protection challenge served; content unreachable via plain HTTP. Rule 14 applied: NOT converted to capability evidence; browser-session retry NOT attempted.
2. **S13 CBUAE — UNMEASURED.** Network-level connection failure (HTTP 000, two attempts incl. forced HTTP/1.1). Environment-level failure; zero capability inference.

---

## J. What the Test Establishes

1. The **provenance-metadata boundary** (text-only dates on HTML paths) recurs at 3 additional institutions across 3 new countries (FR central bank, IT treasury, JP statistics) — per-case OBSERVED evidence only.
2. The **JS-shell rendering boundary** recurs at a new institutional class and geography (UK exchange) — OBSERVED (not browser-validated).
3. **Standard RSS contracts with full pubDate provenance are available on official primary sources across 4 new countries and 5 institutional classes** (DE ministry, IT statistics, UK watchdog, US regulator via GovDelivery, UAE/DIFC regulator) — all compatible with a standard fetcher contract.
4. **Publishing-architecture diversity is real and material**: CMS-RSS, Drupal HTML, URL-date custom CMS, GovDelivery, Zend RSS, ASP.NET, static document catalogs (JP), SPA (UK exchange), bot-protected (UK DMO) — within a single 15-source sample.
5. **Positive cases exist alongside boundary cases within the same jurisdictions** (e.g., FR: DG Trésor positive vs BdF text-dates; UK: OBR/FINRA-class positives vs LSE shell) — architecture is institution-specific, not country-specific. (Qualitative observation; NO prevalence inference.)
6. A **new access-boundary class (anti-bot protection)** was observed on one official government source — recorded, NOT registered as a capability (rule 12).

---

## K. What the Test Does NOT Establish

1. **No prevalence.** Nothing about how common any boundary is across the Global Source Universe. No percentages; no denominators used or implied.
2. **No engineering requirements confirmed this round.** S8 (LSE) rendering remediation and S6 (DMO) access remediation are UNTESTED — applicability/outcomes unknown. Zero ENGINEERING-REQUIRED confirmations.
3. **No non-English primary-path evidence.** All IT/JP/UAE/FR tests ran on EN paths (or primary path presence checks only). Language capability coverage of non-EN primary publishing remains UNTESTED by this round.
4. **No event-model representation conclusions.** Observed content types on new classes are observations only — NOT confirmed representation gaps (per frozen distinction).
5. **No source qualification.** No source here is QUALIFIED, onboarded, or recommended for onboarding. This is capability evidence only.
6. **No framework changes.** Registry, Framework, Design Constraints, Portfolio, Queue, Commercial Model: untouched.
7. **No decisions.** No BUILD NOW, no INVESTMENT CANDIDATE, no CUSTOMER-SPECIFIC, no COMMERCIAL CHANGE.
8. **No customer-demand signal.** None exists; none inferred.

---

## L. Engineering Implications — Evidence Only, NOT Authorization

1. A browser-rendering acquisition adapter would be exercised by the LSE class of sources (JS-shell) — consistent with the previously confirmed TCMB engineering case, now observed in a second jurisdiction/class. Evidence only.
2. A date-normalization layer handling multiple human formats (incl. mixed formats per page — S14) would be exercised by HTML-path sources without machine dates (S2, S5, S12, S14). Whether this is config-only or engineering-required is NOT established by this round.
3. Feed-item pattern filtering would be exercised by general-news feeds on ministry sources (S1). Untested.
4. Document-path crawling (directory/filename patterns with embedded dates) would be exercised by JP document-centric sources (S11, S12). Untested.
5. Anti-bot handling (S6) is an UNASSESSED boundary — unknown whether a standard browser session resolves it. No implication drawn.
6. Actual production cost/risk for any of the above: **UNCALIBRATED.**

---

## M. Comparison with Existing Frozen Evidence

| Frozen evidence (Registry) | This round | Relationship |
|---|---|---|
| Provenance boundary — ESMA (document_date unavailable via tested paths) | S2, S5, S12 (text-only/absent dates via HTML) | Boundary CLASS recurrence at 3 new institutions/geographies. Does NOT alter Registry entries. |
| Browser rendering — TCMB ENGINEERING-REQUIRED (confirmed) | S8 LSE JS-shell OBSERVED | Same class, new jurisdiction + institutional class; NOT validated, NOT engineering-confirmed here. |
| Language gaps — 7 confirmed (INSEE, Banca d'Italia, FSO+BaFin, Saudi MoF, CBS NL, CSRC) | No NEW confirmed gaps — EN paths functional on all responding sources | Consistent with BCB precedent (EN available ≠ gap). Non-EN primary paths untested — adds NO new language evidence either way. |
| Configuration Contract — compatible cases (Eurostat, FED_ENF) + BaFin config-only remediation | 5 new compatible feed contracts (WordPress ×3, GovDelivery, Zend) + 1 plain-fetcher-incompatible case (S8, per-case) | Expands the compatible-case set within contract capability. No Registry modification. |
| Pattern Specificity — FED_ENF config-only resolved | S1 feed-mix, S14 mixed dates, S11 filename patterns | New OBSERVED pattern boundaries; remediation UNTESTED (no config-only claims). |
| Event-Model — 3 confirmed representation gaps | 4–5 intelligence types observed on new classes (incl. first fiscal-watchdog, exchange, DMO-class observations) | Observations only; NOT confirmed gaps; NO framework change (rule 12 — the anti-bot observation is likewise NOT registered). |

Previous confirmed cases: RETAINED, UNCHANGED, UNSUPERSEDED.

---

## N. Recommended Next Validation Experiments

1. **Playwright acquisition test on S8 (LSE)** — confirm/refute rendering remediation for the exchange class (mirrors TCMB A/B diagnostic pattern).
2. **Browser-session retry on S6 (DMO)** — establish whether anti-bot protection yields to a standard browser session before any capability applicability is claimed.
3. **CBUAE retry from an alternate network/egress** — convert UNMEASURED to measured; zero inference until then.
4. **Non-English primary-path probes** (FR/IT/JA/AR primary versions of S2, S4, S5, S11, S12, S14) — the round's largest untested language surface.
5. **Date-normalization remediation test (config-only vs engineering)** on one text-dates source (e.g., S2 BdF) following the FED_ENF/BaFin diagnostic-then-remediate pattern.
6. **Feed pattern-filter test on S1 (BMF)** — config-level item filtering for finance-relevant items.
7. **Event-type mapping probe** for fiscal/auction document classes (S11) against the existing event model — observation-first, no representation-gap claims.

---

## Execution Metrics (per directive)

| Metric | Value |
|---|---|
| Sources actually probed | 15 |
| Sources with HTTP responses | 14 |
| Countries | 7 |
| Institutions | 15 |
| Institutional classes | 7 |
| Intelligence types observed | 5 (monetary/institutional, statistical_release, regulatory_enforcement, fiscal_policy, market_infrastructure/auction) |
| Evidence Strength distribution (per-case) | VALIDATED 7 · OBSERVED 6 (S2, S5, S8, S11, S12, S14) · HYPOTHESIS 0 · INCONCLUSIVE 1 (S6) · UNMEASURED 1 (S13) |
| Resolution Status distribution | NOT APPLICABLE 7 · UNTESTED 6 · NOT APPLICABLE/NOT YET ASSESSED 1 (S6) · NOT ASSESSED 1 (S13) · CONFIG-ONLY VALIDATED 0 · ENGINEERING-REQUIRED confirmed 0 |
| New VALIDATED cases | 7 (BMF, DG Trésor, ISTAT, OBR, FDIC, FINRA, DFSA) |
| INCONCLUSIVE/UNMEASURED | 2 (DMO, CBUAE) |

**Decision outputs produced:** NONE (by design). No BUILD NOW · No INVESTMENT CANDIDATE · No CUSTOMER-SPECIFIC · No COMMERCIAL CHANGE.

**Artifacts modified:** NONE frozen. This document is the sole new artifact (execution-only).
