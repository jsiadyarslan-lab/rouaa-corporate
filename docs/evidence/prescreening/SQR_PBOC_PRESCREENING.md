# Source Qualification Record — PBoC (Pre-screening)

**Source**: People's Bank of China (PBoC)
**Top 20 rank**: 1
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | People's Bank of China (PBoC / 中国人民银行) |
| Official URL | `https://www.pbc.gov.cn/` |
| English site | `https://www.pbc.gov.cn/en/3688006/index.html` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss.xml`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed`, `/eportal/...` — all return 404) |
| Source class | central_bank |
| Country | CN |
| Region | E. Asia |
| Tier | T1 |
| Queue priority (Top 20) | 1 — systemically important; largest economy without coverage |
| Critical workflows | Monetary policy decisions, press releases, currency swap agreements, reserve requirement changes |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (year-archive page) |
| Primary URL tested | `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` (Press Releases — 2026 archive) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 125,956 bytes |
| Result | **PASS** |

### Probing notes

- Root domain `https://www.pbc.gov.cn/` returns HTTP 200 (Chinese homepage, 141 KB)
- English root `https://www.pbc.gov.cn/en/` returns HTTP 403 (directory listing denied — this is a path-level denial, not source-level block; the English site is reachable via specific page paths)
- English homepage `https://www.pbc.gov.cn/en/3688006/index.html` returns HTTP 200 (106 KB)
- Press releases 2026 archive `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` returns HTTP 200 (126 KB) — this is the access path for the press release listing
- Common RSS/Atom paths all return HTTP 404 (see Feed URL field above)
- No `Link: <...>; rel=alternate` header advertising a feed

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the year-archive HTML page, not a feed. This is consistent with the ESMA HTML-validation precedent (`8041cda`) where HTML index pages were used as the access path when no feed was available.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | URL pattern + HTML meta tag + listing-page date string (3 redundant sources) |
| URL date pattern | `/en/3688110/3688172/2026/2026081410083960549/index.html` — timestamp embedded in URL: `YYYYMMDDHHMMSSmmm` (2026-08-14 10:08:39.605549) |
| Article HTML meta tag | `<meta name="PubDate" content="2026-08-06">` (sampled on `/en/3688110/3688172/2026/2026080716471581555/index.html` — "PBOC and BCRA Renew Bilateral Currency Swap Agreement") |
| Article HTML meta tag | `<meta name="createDate" content="2026-08-07 16:47:21">` (creation timestamp) |
| Listing-page date string | Year-archive page contains `>2026-08-10<`, `>2026-08-07<`, `>2026-08-06<`, `>2026-08-02<` date strings adjacent to article links |
| Result | **PASS** (URL pattern + meta tag — both detected; matches provenance pattern used by other central banks) |

### Provenance pattern assessment

PBoC uses the **PATTERN_TYPE_METADATA** provenance pattern (same category as BEA `c8af140` and SNB `c09de13`):

1. **URL pattern**: Article URLs embed a timestamp `YYYYMMDDHHMMSSmmm` — this is parseable as a publication date without content inspection
2. **HTML meta tag**: `<meta name="PubDate" content="YYYY-MM-DD">` — standard provenance metadata in the article HTML head
3. **Listing page**: Year-archive page contains visible date strings next to each article link

This is **stronger provenance** than ESMA RSS (`27294db` — Gate 2 FAIL because no pubDate in RSS). PBoC has publication dates in three independent locations: URL pattern, meta tag, and visible date string.

**Gate 2 conclusion**: Provenance is unambiguous and machine-readable. No content inspection is required to extract the publication date.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) |
| Sample URL | `https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html` |
| Sample title | "PBOC and BCRA Renew Bilateral Currency Swap Agreement" |
| Sample size | 120,994 bytes |
| Machine-readable | **YES** — static HTML contains full article body, title, and metadata in `<head>` |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with the full English title
- `<meta name="PubDate">` and `<meta name="createDate">` tags in `<head>`
- Static HTML body with full article text (no JS-rendered content detected; no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)
- 20 article URLs visible in the 2026 year-archive page (static HTML)

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). PBoC's content is fully present in static HTML.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. No JS rendering required for extraction.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing PATTERN_TYPE_METADATA category |
| Existing analogs | BEA (`c8af140` — statistical_authority, PATTERN_TYPE_METADATA, config-only PASS), SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS) |
| Result | **PASS** (tentative — pattern category appears compatible; final confirmation requires Gate 5) |

### Pattern category notes

PBoC's content structure (press releases with titles, dates, and body text) matches the `central_bank` class pattern already proven by SNB. The provenance pattern (HTML meta tag with PubDate) is functionally equivalent to BEA's RSS pubDate — both fall under PATTERN_TYPE_METADATA in the pipeline's pattern taxonomy.

The pipeline's data-driven extractor (no source-specific code, verified at `146aa3b`) should be applicable via configuration only, without source-specific engineering. However, this is an **inference** based on pattern similarity — Gate 5 (first-attempt validation) is required to confirm.

**Gate 4 conclusion**: Pattern category is compatible with existing PATTERN_TYPE_METADATA. No new pattern category appears to be required.

---

## Gate 5 — First-Attempt Validation

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** |

Per pre-screening scope: Gate 5 is NOT performed during pre-screening. No configuration is created. No pipeline run is attempted. Gate 5 is reserved for the qualification phase (after pre-screening produces a QUALIFICATION_READY routing).

---

## Intelligence Quality Assessment

| Field | Value |
|-------|-------|
| Quality status | N/A — Gate 5 not attempted |

---

## Initial Routing

| Field | Value |
|-------|-------|
| Earliest blocking gate | none (Gates 1-4 all PASS) |
| Initial routing | **QUALIFICATION_READY** (candidate for standard onboarding path) |
| Routing rationale | All Gates 1-4 PASS; pattern category matches existing PATTERN_TYPE_METADATA proven analogs (BEA, SNB); no source-specific engineering anticipated |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on press release archive | `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` (probed 2026-08-15) | Gate 1 PASS — access path exists and returns content |
| HTTP 200 on sample press release | `https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content |
| URL timestamp pattern | `/2026/2026080716471581555/` in article URL | Gate 2 PASS — date is embedded in URL (YYYYMMDDHHMMSSmmm) |
| HTML meta tag PubDate | `<meta name="PubDate" content="2026-08-06">` on sample press release | Gate 2 PASS — machine-readable provenance in HTML head |
| HTML meta tag createDate | `<meta name="createDate" content="2026-08-07 16:47:21">` on sample press release | Gate 2 PASS — secondary provenance source |
| 20 article URLs in year-archive page | Static HTML of `/en/3688110/3688172/2026/index.html` | Gate 3 PASS — listing page exposes article set without JS |
| Pattern category match | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS) | Gate 4 PASS — proven analog exists in same class |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle PBoC without source-specific code (only inference from SNB analog)
- Does NOT prove coverage breadth (only one press release was sampled; PBoC may publish other content types — monetary policy reports, statistics, regulations — that require additional pattern categories)
- Does NOT prove language handling (Chinese-language paths exist alongside English; pattern category for Chinese-language content not assessed)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 1 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. PBoC remains Top 20 rank #1. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. PBoC transitions to QUALIFICATION_READY based on Gates 1-4 all PASS.

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Qualification Decision

| Field | Value |
|-------|-------|
| Decided by | N/A — pre-screening does not produce a qualification decision |
| Qualification status | PENDING — pre-screening produced a routing recommendation (QUALIFICATION_READY), not a qualification decision |
| Review status | NOT REQUIRED at pre-screening stage |
| Confidence | MEDIUM (per Initial Routing section) |
| Evidence basis | Pre-screening HTTP probing + HTML metadata inspection (no test commit, no Gate 5 run) |

---

## Commercial Recommendation

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not produce a commercial recommendation |
| Recommended action | PENDING — pre-screening produces a routing recommendation only; commercial recommendation requires the full Source Qualification Report workflow (Gate 5 + Intelligence Quality + Engineering Scope) |

---

## Engineering Scope

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not trigger engineering scope |
| Engineering required | Not yet determined — pre-screening suggests no source-specific engineering is needed (pattern category matches existing analog), but this is inference only |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of PBoC

Probe 1: https://www.pbc.gov.cn/                                → 200 OK (141 KB, Chinese homepage)
Probe 2: https://www.pbc.gov.cn/en/                              → 403 (directory listing denied — path-level, not source-level)
Probe 3: https://www.pbc.gov.cn/en/3688006/index.html            → 200 OK (106 KB, English homepage)
Probe 4: https://www.pbc.gov.cn/en/3688110/3688172/index.html   → 200 OK (122 KB, Press Releases listing)
Probe 5: https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html → 200 OK (126 KB, 2026 archive with 20 article links)
Probe 6: https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html → 200 OK (121 KB, sample press release "PBOC and BCRA Renew Bilateral Currency Swap Agreement")
Probe 7: https://www.pbc.gov.cn/rss.xml                          → 404 (no RSS at this path)
Probe 8: https://www.pbc.gov.cn/en/rss.xml                       → 404
Probe 9: https://www.pbc.gov.cn/feed.xml                         → 404
Probe 10: https://www.pbc.gov.cn/atom.xml                       → 404
Probe 11: https://www.pbc.gov.cn/en/feed                         → 404
Probe 12: https://www.pbc.gov.cn/en/rss                          → 404
Probe 13: https://www.pbc.gov.cn/eportal/getUmRssWidgetRssList   → 404 (no eportal RSS endpoint)

Provenance detected:
- URL pattern: /2026/2026080716471581555/ (timestamp YYYYMMDDHHMMSSmmm)
- HTML meta tag: <meta name="PubDate" content="2026-08-06">
- HTML meta tag: <meta name="createDate" content="2026-08-07 16:47:21">
- Listing-page date strings: >2026-08-10<, >2026-08-07<, >2026-08-06<, >2026-08-02<
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; no RSS feed, but year-archive HTML works |
| Gate 2 (Provenance) | PASS | URL pattern + meta tag + listing-page date string (3 redundant sources) |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering; full article body + title + metadata |
| Gate 4 (Configuration applicability) | PASS (tentative) | Pattern category matches existing PATTERN_TYPE_METADATA; SNB analog exists |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; candidate for standard onboarding path |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #1 unchanged |
