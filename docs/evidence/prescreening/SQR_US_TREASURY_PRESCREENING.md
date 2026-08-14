# Source Qualification Record — US Treasury (Pre-screening)

**Source**: US Department of the Treasury
**Top 20 rank**: 3
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | US Department of the Treasury |
| Official URL | `https://home.treasury.gov/` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss`, `/feed.xml`, `/atom.xml`, `/news/rss/` — all return 404) |
| Source class | ministry_of_finance (Treasury) |
| Country | US |
| Region | N. America |
| Tier | T1 |
| Queue priority (Top 20) | 3 — fiscal policy; high institutional importance; qualification not yet performed |
| Critical workflows | Press releases, sanctions list updates (OFAC), Treasury yield curve rates, fiscal data |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (press releases listing page) |
| Primary URL tested | `https://home.treasury.gov/news/press-releases` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 110,138 bytes |
| Server | nginx |
| CMS | Drupal 10 (`x-generator: Drupal 10`) |
| Result | **PASS** |

### Probing notes

- `https://home.treasury.gov/` returns HTTP 200 (181 KB, Treasury homepage)
- `https://home.treasury.gov/news/press-releases` returns HTTP 200 (110 KB, press releases listing)
- `https://www.treasury.gov/` redirects to `https://home.treasury.gov/` (HTTP 200) — legacy domain still works
- `https://fiscaldata.treasury.gov/` returns HTTP 200 (611 KB, separate fiscal data subdomain)
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/news/rss/`, `fiscaldata.treasury.gov/rss/`)
- No `Link: <...>; rel=alternate` header advertising a feed
- No `<link>` tag in HTML head advertising RSS/Atom

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the press releases listing page, not a feed. This is consistent with the PBoC pattern (HTML index when no feed available) and the ESMA HTML-validation precedent (`8041cda`).

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Multiple date sources detected — **all sources agree** |
| Article field — `field-news-publication-date` | `<time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>` (sampled on `/news/press-releases/sb0604` — "Treasury Secretary Scott Bessent Highlights America's Main Street and Manufacturing Renaissance") |
| Listing-page `<time>` element | `<time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>` adjacent to sb0604 link in press releases listing |
| `og:updated_time` meta tag | `2026-08-13` on article page |
| ISO 8601 datetime | `2026-08-13T01:00:00Z` — full timestamp with timezone (UTC) |
| Date-source agreement | All three sources agree: article field = listing `<time>` = `og:updated_time` (all 2026-08-13) |
| Result | **PASS** — provenance is unambiguous and machine-readable; all date sources agree |

### Provenance pattern assessment

US Treasury provides multiple date sources for each article, and they **all agree**:

1. **Drupal field `field-news-publication-date`**: `<time datetime="2026-08-13T01:00:00Z" class="datetime">August 12, 2026</time>` — the article's official publication date field, with full ISO 8601 datetime including timezone
2. **Listing-page `<time>` element**: `<time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>` — the same ISO datetime appears in the press releases listing adjacent to each article link
3. **Open Graph `og:updated_time`**: `2026-08-13` — the article's last-updated date in Open Graph metadata

All three sources reference the same date (2026-08-13 / August 12, 2026 with UTC timezone offset). This is **stronger provenance** than PBoC (where `PubDate` conflicted with `createDate` and URL timestamp) — Treasury has no date-source conflict.

**Comparison to known cases:**
- PBoC (this batch — Gate 2 PASS WITH REVIEW): URL timestamp and `createDate` agree, but `PubDate` differs by 1 day → date-source precedence unresolved
- US Treasury (this batch — Gate 2 PASS): all three date sources agree (article field, listing `<time>`, `og:updated_time`) → no date-source conflict
- SNB (`c09de13` — Gate 2 PASS): single date source (`dc:date` in RSS) → unambiguous
- ESMA RSS (`27294db` — Gate 2 FAIL): no publication date in RSS feed at all

**Gate 2 conclusion**: Provenance metadata is available, machine-readable, and unambiguous. The ISO 8601 datetime format (`2026-08-13T01:00:00Z`) is directly parseable as the `document_date` for the pipeline. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) |
| Sample URL | `https://home.treasury.gov/news/press-releases/sb0604` |
| Sample title | "Treasury Secretary Scott Bessent Highlights America's Main Street and Manufacturing Renaissance" |
| Sample size | 114,760 bytes |
| Machine-readable | **YES** — static HTML contains full article body, title, and metadata in `<head>` |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with the full title including " | U.S. Department of the Treasury" suffix
- Open Graph metadata (`og:title`, `og:description`, `og:url`, `og:type=article`, `og:updated_time`)
- Drupal field `field-news-publication-date` with `<time datetime="...">` element
- Static HTML body with full article text (no JS-rendered content detected; no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)
- 24 article URLs visible in the press releases listing page (static HTML)
- Press releases listing uses `<div class="mm-news-row">` with `<time datetime="...">` and `<a href="/news/press-releases/sbXXXX">` for each entry

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). Treasury's content is fully present in static HTML.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. No JS rendering required for extraction.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `ministry_of_finance` (Treasury) — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | US Treasury / OFAC (`146aa3b` — DEVELOPMENT_VERIFIED, ALREADY_QUALIFIED in Queue v1 Section 6) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

US Treasury's content structure (press releases with titles, ISO 8601 dates, and body text) matches the pattern already proven for the existing US Treasury / OFAC source (`146aa3b` — DEVELOPMENT_VERIFIED). The provenance pattern (Drupal `field-news-publication-date` with `<time datetime="...">` ISO 8601) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with a direct analog already in the ALREADY_QUALIFIED set: US Treasury / OFAC).

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

Per pre-screening scope: Gate 5 is NOT performed during pre-screening. No configuration is created. No pipeline run is attempted.

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
| Routing qualifier | None — all date sources agree; no unresolved items flagged |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (all three date sources agree); configuration category (`PATTERN_TYPE_METADATA`, `ministry_of_finance` class) appears applicable with direct analog in ALREADY_QUALIFIED set (US Treasury / OFAC) |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on press releases listing | `https://home.treasury.gov/news/press-releases` (probed 2026-08-15) | Gate 1 PASS — access path exists and returns content |
| HTTP 200 on sample press release | `https://home.treasury.gov/news/press-releases/sb0604` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content |
| Drupal field `field-news-publication-date` | `<time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>` on sample article | Gate 2 PASS — official publication date field with ISO 8601 datetime |
| Listing-page `<time>` element | `<time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>` adjacent to sb0604 link | Gate 2 PASS — listing page exposes same date as article field |
| Open Graph `og:updated_time` | `2026-08-13` on article page | Gate 2 PASS — third independent date source, agrees with field and listing |
| 24 article URLs in press releases listing | Static HTML of `/news/press-releases` | Gate 3 PASS — listing page exposes article set without JS |
| Pattern category match | US Treasury / OFAC (`146aa3b` — DEVELOPMENT_VERIFIED, ALREADY_QUALIFIED) | Gate 4 PASS — direct analog exists in same class and same institution family |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle US Treasury press releases without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one press release was sampled; Treasury may publish other content types — yield curve rates, sanctions list updates, fiscal data — that may require different pattern categories)
- Does NOT resolve whether the existing US Treasury / OFAC configuration (`146aa3b`) covers the same content paths as this pre-screening (the existing config may target OFAC sanctions specifically, not Treasury press releases)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 3 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. US Treasury remains Top 20 rank #3. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. US Treasury transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

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
2026-08-15 — Pre-screening probe of US Department of the Treasury

Probe 1:  https://home.treasury.gov/                          → 200 OK (181 KB, Treasury homepage, nginx + Drupal 10)
Probe 2:  https://home.treasury.gov/news                       → 200 OK (110 KB, redirects to /news/press-releases)
Probe 3:  https://home.treasury.gov/news/press-releases        → 200 OK (110 KB, press releases listing — 24 article links)
Probe 4:  https://home.treasury.gov/rss                       → 404 (no RSS at this path)
Probe 5:  https://home.treasury.gov/feed.xml                  → 404
Probe 6:  https://home.treasury.gov/atom.xml                  → 404
Probe 7:  https://home.treasury.gov/news/rss/                 → 404
Probe 8:  https://www.treasury.gov/                           → 200 OK (redirects to home.treasury.gov)
Probe 9:  https://www.treasury.gov/resource-center/data-chart-center/Pages/index.aspx → 200 OK (redirects to home.treasury.gov)
Probe 10: https://fiscaldata.treasury.gov/                    → 200 OK (611 KB, separate fiscal data subdomain)
Probe 11: https://fiscaldata.treasury.gov/rss/                 → 404
Probe 12: https://home.treasury.gov/news/press-releases/sb0604 → 200 OK (115 KB, sample press release "Treasury Secretary Scott Bessent Highlights America's Main Street and Manufacturing Renaissance")

Provenance detected (sample article sb0604):
- Drupal field field-news-publication-date: <time datetime="2026-08-13T01:00:00Z">August 12, 2026</time>
- Listing page <time> element: <time datetime="2026-08-13T01:00:00Z">August 12, 2026</time> adjacent to sb0604 link
- Open Graph og:updated_time: 2026-08-13
- All three sources agree (2026-08-13 / August 12, 2026 UTC)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; nginx + Drupal 10; no RSS feed, but press releases listing works |
| Gate 2 (Provenance) | PASS | Three date sources (Drupal field, listing `<time>`, `og:updated_time`) — all agree on 2026-08-13 / August 12, 2026 UTC; ISO 8601 datetime directly parseable |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering; full article body + title + Open Graph metadata |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `ministry_of_finance` class) appears applicable; direct analog in ALREADY_QUALIFIED set (US Treasury / OFAC `146aa3b`). Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All date sources agree; no review flag needed |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #3 unchanged |
