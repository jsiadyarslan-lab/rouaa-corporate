# Source Qualification Record — Danmarks Nationalbank (Pre-screening)

**Source**: Danmarks Nationalbank
**Top 20 rank**: 9
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Danmarks Nationalbank |
| Official URL | `https://www.nationalbanken.dk/en` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml` — all return 404); `/rss` redirects to `/da/rss` |
| Source class | central_bank |
| Country | DK |
| Region | Europe |
| Tier | T2 |
| Queue priority (Top 20) | 9 — EU/EEA central bank; systemic European importance |
| Critical workflows | Press releases, monetary policy, statistics, financial stability reports |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (press releases archive) |
| Primary URL tested | `https://www.nationalbanken.dk/en/news-and-knowledge` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 657,700 bytes |
| Server | Azure (Front Door) |
| Result | **PASS** |

### Probing notes

- `https://www.nationalbanken.dk/en` returns HTTP 200 (57 KB, English homepage)
- `https://www.nationalbanken.dk/en/news-and-knowledge` returns HTTP 200 (658 KB, news and knowledge hub)
- `https://www.nationalbanken.dk/en/news-and-knowledge/press` returns HTTP 200 (654 KB, press section)
- `https://www.nationalbanken.dk/en/news-and-knowledge/press/archive/YYYY/title-DD-MM-YYYY` — press release archive with year and date in URL path (confirmed via JSON-embedded URLs in listing page)
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml`); `/rss` redirects to `/da/rss` (Danish RSS path)
- No `<link rel="alternate" type="application/rss+xml">` tag in HTML head advertising a feed
- Sample press release `https://www.nationalbanken.dk/en/news-and-knowledge/press/consultation-responses/2026/response-to-the-european-commission-s-consultation-on-the-competitiveness-of-the-eu-banking-sector` returns HTTP 200 (32 KB)

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed was found at standard English paths (the Danish `/da/rss` redirect was not probed in this pre-screening). The access path is the press releases archive with year-based URL structure.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Multiple authoritative publication date sources — **all sources agree** |
| Article `<meta>` tag — `article:published_time` | `<meta name="article:published_time" content="2026-04-17">` (sampled on press release "Response to the European Commission's consultation on the competitiveness of the EU banking sector") |
| Article `<time>` element | `<time datetime="2026-04-17T15:00:00">17 April 2026</time>` — visible publication date with ISO 8601 datetime attribute |
| URL date pattern | `/en/news-and-knowledge/press/archive/YYYY/title-DD-MM-YYYY` — date appears in URL path (e.g., `20-03-2007` in archive URLs; the sampled consultation response URL does not embed a date in the path) |
| Date-source agreement | `article:published_time` (2026-04-17) and `<time datetime="2026-04-17T15:00:00">` (2026-04-17) — both authoritative publication date sources agree |
| Result | **PASS** — authoritative publication date sources present and machine-readable; all sources agree |

### Provenance pattern assessment

Danmarks Nationalbank provides multiple authoritative publication date sources in the article HTML, and they **all agree**:

1. **`<meta name="article:published_time" content="2026-04-17">`** — standard Open Graph / Schema.org article publication date meta tag
2. **`<time datetime="2026-04-17T15:00:00">17 April 2026</time>`** — HTML5 `<time>` element with ISO 8601 datetime attribute and visible date text

Both sources reference the same date (2026-04-17). No date-source conflict exists.

**Comparison to known cases:**
- US Treasury (Batch 2 — Gate 2 PASS): Drupal `field-news-publication-date` + listing `<time>` + `og:updated_time` (but `og:updated_time` was reclassified as update metadata per Batch 3 rule)
- Bundesbank (Batch 2 — Gate 2 PASS): RSS `<pubDate>` + RSS `<dc:date>` + article HTML `metadata__date` (all agreed)
- Danmarks Nationalbank (this batch — Gate 2 PASS): `article:published_time` meta + `<time>` element (both authoritative publication sources, agree on 2026-04-17)

**Gate 2 conclusion**: Authoritative publication date sources are present, machine-readable, and agree. The ISO 8601 `datetime` attribute (`2026-04-17T15:00:00`) is directly parseable as the `document_date` for the pipeline. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required for article content) |
| Sample URL | `https://www.nationalbanken.dk/en/news-and-knowledge/press/consultation-responses/2026/response-to-the-european-commission-s-consultation-on-the-competitiveness-of-the-eu-banking-sector` |
| Sample title | "Response to the European Commission's consultation on the competitiveness of the EU banking sector" |
| Sample size | 31,991 bytes |
| Machine-readable | **YES** — static HTML contains title, publication date (`article:published_time` + `<time>`), JSON-LD breadcrumb, and article body |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with the full title
- `<meta name="article:published_time" content="2026-04-17">` — authoritative publication date meta
- `<time datetime="2026-04-17T15:00:00">17 April 2026</time>` — visible publication date with ISO datetime attribute
- JSON-LD `BreadcrumbList` structured data
- Static HTML body with 1,340 chars of main content (consultation response summary)
- Open Graph metadata (`og:title`, `og:description`, `og:type=article`, `og:url`)
- React detected in page framework, but article content is present in static HTML (not JS-rendered)

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). Danmarks Nationalbank's article content is present in static HTML despite the React framework.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. The React framework does not block static HTML extraction because the article body is server-rendered.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS), Bundesbank (Batch 2 — QUALIFICATION_READY) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

Danmarks Nationalbank's content structure (press releases with titles, `article:published_time` meta tag, and `<time>` elements with ISO 8601 datetimes) matches the `central_bank` class pattern. The provenance pattern (HTML meta tag with publication date) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB and Bundesbank.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank` class analogs in SNB and Bundesbank).

Gate 4 does **NOT** predict:
- How much engineering effort Gate 5 will require
- Whether source-specific code will be needed
- Whether the configuration will succeed on first attempt

These are Gate 5 questions. Pre-screening separates **applicability** (does the abstraction exist?) from **difficulty** (how much work will Gate 5 take?) — per Section 5 of the Queue (priority / readiness / technical difficulty are independent dimensions).

**Gate 4 conclusion**: Configuration category is applicable. Actual onboarding effort is a Gate 5 question, not a Gate 4 question.

---

## Gate 5 — First-Attempt Validation

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** |

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
| Initial routing | **QUALIFICATION_READY** |
| Routing qualifier | None — all authoritative publication date sources agree; no unresolved items |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (`article:published_time` = `<time>` datetime, both 2026-04-17); configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with analogs in SNB and Bundesbank |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on news-and-knowledge hub | `https://www.nationalbanken.dk/en/news-and-knowledge` (probed 2026-08-15) | Gate 1 PASS — access path exists and returns content (658 KB) |
| HTTP 200 on sample press release | `https://www.nationalbanken.dk/en/news-and-knowledge/press/consultation-responses/2026/response-to-the-european-commission-s-consultation-on-the-competitiveness-of-the-eu-banking-sector` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content (32 KB) |
| `article:published_time` meta tag | `<meta name="article:published_time" content="2026-04-17">` on sample article | Gate 2 PASS — authoritative publication date in HTML head |
| `<time>` element with datetime | `<time datetime="2026-04-17T15:00:00">17 April 2026</time>` on sample article | Gate 2 PASS — second authoritative publication date source (agrees with `article:published_time`) |
| Press release archive URL pattern | `/en/news-and-knowledge/press/archive/YYYY/title-DD-MM-YYYY` (846 URLs found in JSON-embedded listing) | Gate 1 PASS — archive structure with year-based organization |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle Danmarks Nationalbank without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one press release was sampled; Danmarks Nationalbank may publish other content types — monetary policy reports, statistics, financial stability reports — that may require different pattern categories)
- Does NOT resolve whether the Danish-language RSS (`/da/rss`) provides equivalent content to the English press releases (not probed in this pre-screening)
- Does NOT prove React framework compatibility (React was detected, but article content was server-rendered in static HTML; future content changes may shift to client-side rendering)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 9 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. Danmarks Nationalbank remains Top 20 rank #9. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. Danmarks Nationalbank transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

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

---

## Engineering Scope

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not trigger engineering scope |
| Engineering required | Not yet determined — pre-screening does not predict engineering effort. Gate 4 confirms configuration category applicability only; actual onboarding effort is determined during Gate 5 (first-attempt validation) |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of Danmarks Nationalbank

Probe 1:  https://www.nationalbanken.dk/en                          → 200 OK (57 KB, English homepage, Azure Front Door)
Probe 2:  https://www.nationalbanken.dk/en/press                    → 404 (press path not at this location)
Probe 3:  https://www.nationalbanken.dk/en/news-and-knowledge       → 200 OK (658 KB, news and knowledge hub)
Probe 4:  https://www.nationalbanken.dk/en/news-and-knowledge/press → 200 OK (654 KB, press section)
Probe 5:  https://www.nationalbanken.dk/en/topics                    → 200 OK (33 KB, topics index)
Probe 6:  https://www.nationalbanken.dk/en/topics/inflation         → 200 OK (52 KB, sample topic page)
Probe 7:  https://www.nationalbanken.dk/en/search-our-knowledge-archive?term=&type=Analysis
                                                                       → 200 OK (27 KB, knowledge archive)
Probe 8:  https://www.nationalbanken.dk/en/news-service             → 403 (access denied at this path)
Probe 9:  https://www.nationalbanken.dk/rss                          → 404 (redirects to /da/rss — Danish RSS, not probed)
Probe 10: https://www.nationalbanken.dk/feed.xml                     → 404
Probe 11: https://www.nationalbanken.dk/atom.xml                    → 404
Probe 12: https://www.nationalbanken.dk/en/news-and-knowledge/press/consultation-responses/2026/response-to-the-european-commission-s-consultation-on-the-competitiveness-of-the-eu-banking-sector
                                                                       → 200 OK (32 KB, sample press release)

Provenance detected (sample press release):
- Article meta tag: <meta name="article:published_time" content="2026-04-17">
- Article <time> element: <time datetime="2026-04-17T15:00:00">17 April 2026</time>
- Both sources agree on 2026-04-17

Press release archive structure:
  /en/news-and-knowledge/press/archive/YYYY/title-DD-MM-YYYY
  846 archive URLs found in JSON-embedded listing on news-and-knowledge hub
  Archive spans 2004-2026

Server: Azure Front Door (x-azure-ref header present)
Framework: React (detected in page), but article content is server-rendered in static HTML
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; no RSS feed at standard English paths, but press releases archive accessible |
| Gate 2 (Provenance) | PASS | Two authoritative publication date sources (`article:published_time` + `<time>` with datetime) — both agree on 2026-04-17; ISO 8601 datetime directly parseable |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering required for article body; full title + date + 1,340 chars of main content + Open Graph metadata |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; analogs in SNB and Bundesbank. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All authoritative publication date sources agree |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #9 unchanged |
