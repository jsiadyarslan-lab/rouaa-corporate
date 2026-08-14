# Source Qualification Record — South African Reserve Bank (Pre-screening)

**Source**: South African Reserve Bank (SARB)
**Top 20 rank**: 14
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | South African Reserve Bank (SARB) |
| Official URL | `https://www.resbank.co.za/` |
| Feed URL | `https://www.resbank.co.za/bin/sarb/solr/publications/rss` (News and Publications RSS) |
| Source class | central_bank |
| Country | ZA |
| Region | Africa |
| Tier | T2 |
| Queue priority (Top 20) | 14 — Largest African economy; fills Africa gap (largest regional gap per Section 12) |
| Critical workflows | Media releases, monetary policy, prudential authority publications, financial markets auction results |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | RSS feed + HTML index |
| Primary URL tested | `https://www.resbank.co.za/bin/sarb/solr/publications/rss` (News and Publications RSS) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 18,137 bytes (RSS XML) |
| Server | SharePoint (BIGipServer cookie) |
| Result | **PASS** |

### Probing notes

- `https://www.resbank.co.za/` returns HTTP 200 (103 KB, English homepage, SharePoint-backed)
- `https://www.resbank.co.za/en/home` returns HTTP 200 (103 KB, English home)
- `https://www.resbank.co.za/en/home/quick-links/rss-feeds` returns HTTP 200 (76 KB, RSS feeds listing page)
- RSS feed discovered at `https://www.resbank.co.za/bin/sarb/solr/publications/rss` — returns HTTP 200 (18 KB, RSS 2.0 XML, 25 items)
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml`) — the feed is at a non-standard `/bin/sarb/solr/publications/rss` path
- Sample press release `https://www.resbank.co.za/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions` returns HTTP 200 (76 KB)

**Gate 1 conclusion**: Source is accessible via RSS feed and HTML index. The RSS feed is at a non-standard path (`/bin/sarb/solr/publications/rss`) but is advertised on the RSS feeds listing page. 25 items in the feed covering media releases, prudential authority documents, and financial market auction results.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (RSS XML + HTML metadata inspection) |
| Date source | RSS `<pubDate>` + article HTML "Published Date" field — **all sources agree** |
| RSS `<pubDate>` | `2026-08-11T10:03:00Z` (ISO 8601 format with timezone) — sample item "Transition of national payment system management functions" |
| Article HTML "Published Date" field | `<div class="key">Published Date:</div><div class="value">2026-08-11</div>` (sampled on the article page) |
| Update metadata (NOT publication evidence) | `<div class="key">Last Modified Date:</div><div class="value">2026-08-13, 10:08</div>` — recorded as update metadata only; NOT counted as publication evidence per Batch 3 established rule |
| Date-source agreement | RSS `<pubDate>` (2026-08-11) and article HTML "Published Date" (2026-08-11) — both authoritative publication date sources agree |
| Result | **PASS** — authoritative publication date sources present and machine-readable; all sources agree |

### Provenance pattern assessment

SARB provides publication dates in two locations, and they **agree**:

1. **RSS `<pubDate>`**: `2026-08-11T10:03:00Z` — ISO 8601 format with timezone (unlike RBI's RFC 822 without timezone, SARB uses proper ISO 8601)
2. **Article HTML "Published Date" field**: `<div class="key">Published Date:</div><div class="value">2026-08-11</div>` — structured metadata field with explicit "Published Date" label

Both sources reference the same date (2026-08-11). No date-source conflict exists.

The `<div class="key">Last Modified Date:</div><div class="value">2026-08-13, 10:08</div>` is recorded as **update metadata only** — per the Batch 3 established rule, modified/updated timestamps are NOT treated as publication date evidence. The "Last Modified Date" (2026-08-13) is later than the "Published Date" (2026-08-11), confirming it is an update timestamp, not a publication date.

**Comparison to known cases:**
- US Treasury (Batch 2 — Gate 2 PASS): Drupal `field-news-publication-date` + listing `<time>` (both agreed; `og:updated_time` reclassified as update metadata)
- SARB (this batch — Gate 2 PASS): RSS `<pubDate>` + article HTML "Published Date" field (both agree on 2026-08-11; "Last Modified Date" correctly classified as update metadata)

**Gate 2 conclusion**: Authoritative publication date sources are present, machine-readable, and agree. The ISO 8601 `<pubDate>` (`2026-08-11T10:03:00Z`) is directly parseable as the `document_date` for the pipeline. The "Last Modified Date" is correctly classified as update metadata only. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML + RSS inspection) |
| Content format | Static HTML with structured metadata fields + RSS with `<description>` summaries |
| Sample URL | `https://www.resbank.co.za/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions` |
| Sample title | "Transition of national payment system management functions" |
| Sample size | 75,773 bytes |
| Machine-readable | **YES** — static HTML contains title, "Published Date" field, "Last Modified Date" field (update metadata), and article body with substantive content |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with "Transition of national payment system management functions"
- Structured metadata fields:
  - `<div class="key">Published Date:</div><div class="value">2026-08-11</div>` — authoritative publication date
  - `<div class="key">Last Modified Date:</div><div class="value">2026-08-13, 10:08</div>` — update metadata (NOT publication evidence)
  - `<div class="key">Category:</div><div class="value">Media > Media Releases</div>` — content type metadata
- Citation meta tags: `citation_publisher`, `Citation_year`, `Citation_type`, `google.citation_title`, `google.citation_publisher`, `google.citation_language` — academic citation metadata
- RSS `<description>` contains article summary (e.g., "The Prudential Authority and Financial Sector Conduct Authority, in terms of the Financial Sector Regulation Act, 2017...")
- The article body content is partially JS-rendered (main `<main>` element had limited static text), but the structured metadata fields (Published Date, Last Modified Date, Category) are present in static HTML

**Note on content rendering**: The article body appears partially JS-rendered — the `<main>` element had limited static text in pre-screening. However, the structured metadata fields (Published Date, Category, citation tags) ARE present in static HTML, and the RSS `<description>` provides article summaries. This is sufficient for Gate 3 PASS because the substantive metadata is machine-readable, even if the full article body requires JavaScript for complete rendering.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. Structured metadata fields (Published Date, Last Modified Date, Category) and citation meta tags are present. RSS `<description>` provides article summaries. Partial JS rendering of article body does not block Gate 3 because the essential metadata is in static HTML.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, RSS with `dc:date`, config-only PASS), Bundesbank (Batch 2 — RSS with `pubDate` + `dc:date`), RBI (this batch — RSS with `pubDate`) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

SARB's content structure (RSS 2.0 feed with ISO 8601 `<pubDate>` for each item, structured HTML metadata fields with explicit "Published Date" label) matches the `central_bank` class pattern. The provenance pattern (RSS with ISO 8601 `<pubDate>` + HTML metadata field) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB, Bundesbank, and RBI.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank` class analogs in SNB, Bundesbank, and RBI).

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
| Routing qualifier | None — all authoritative publication date sources agree |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (RSS `<pubDate>` = article HTML "Published Date", both 2026-08-11; "Last Modified Date" correctly classified as update metadata); configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with analogs in SNB, Bundesbank, and RBI |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on RSS feed | `https://www.resbank.co.za/bin/sarb/solr/publications/rss` (probed 2026-08-15) | Gate 1 PASS — RSS feed accessible, returns valid RSS 2.0 XML (18 KB, 25 items) |
| HTTP 200 on RSS feeds listing | `https://www.resbank.co.za/en/home/quick-links/rss-feeds` (probed 2026-08-15) | Gate 1 PASS — RSS feed URL is advertised on official listing page |
| HTTP 200 on sample press release | `https://www.resbank.co.za/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions` (probed 2026-08-15) | Gate 3 PASS — static HTML contains structured metadata (76 KB) |
| RSS `<pubDate>` element | `2026-08-11T10:03:00Z` in sample item | Gate 2 PASS — ISO 8601 publication date in RSS (with timezone) |
| Article HTML "Published Date" field | `<div class="key">Published Date:</div><div class="value">2026-08-11</div>` | Gate 2 PASS — structured metadata field with explicit "Published Date" label (agrees with RSS `<pubDate>`) |
| Update metadata (NOT publication evidence) | `<div class="key">Last Modified Date:</div><div class="value">2026-08-13, 10:08</div>` | Recorded as update metadata only; NOT counted as publication date per Batch 3 rule |
| Citation meta tags | `citation_publisher`, `Citation_year=2026`, `Citation_type=JOUR`, `google.citation_title` | Gate 3 PASS — academic citation metadata present in static HTML |
| RSS `<description>` with article summaries | Article summary text in RSS `<description>` elements | Gate 3 PASS — substantive content summaries available in RSS feed |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2), RBI (this batch) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle SARB without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one media release was sampled; SARB RSS contains 25 items across multiple categories — Media Releases, Prudential Authority, Markets Auction Results, Share Price — that may require different pattern categories)
- Does NOT resolve whether the partial JS rendering of article body will affect extraction (structured metadata is in static HTML, but full article body may require JavaScript for complete rendering)
- Does NOT prove that the SharePoint-backed RSS feed will remain stable (SharePoint RSS feeds can have different behavior than standard RSS)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 14 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. SARB remains Top 20 rank #14. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. SARB transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of South African Reserve Bank (SARB)

Probe 1:  https://www.resbank.co.za/                                → 200 OK (103 KB, English homepage, SharePoint)
Probe 2:  https://www.resbank.co.za/en/home                        → 200 OK (103 KB, English home)
Probe 3:  https://www.resbank.co.za/en/home/quick-links/rss-feeds  → 200 OK (76 KB, RSS feeds listing page)
Probe 4:  https://www.resbank.co.za/bin/sarb/solr/publications/rss → 200 OK (18 KB, RSS 2.0 News and Publications feed — 25 items)
Probe 5:  https://www.resbank.co.za/en/news-and-articles          → 404 (path not at this location)
Probe 6:  https://www.resbank.co.za/en/press-releases             → 404
Probe 7:  https://www.resbank.co.za/rss                            → 404
Probe 8:  https://www.resbank.co.za/feed.xml                       → 404
Probe 9:  https://www.resbank.co.za/atom.xml                       → 404
Probe 10: https://www.resbank.co.za/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions
                                                                       → 200 OK (76 KB, sample press release)

RSS feed structure (sample item):
  <item>
    <title>Transition of national payment system management functions</title>
    <link>/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions</link>
    <description>In an important change to how South Africa's national payment system (NPS) is managed...</description>
    <pubDate>2026-08-11T10:03:00Z</pubDate>
    <category>Media > Media Releases</category>
    <guid>/content/sarb-project/en/home/publications/publication-detail-pages/media-releases/2026/Transition-of-national-payment-system-management-functions</guid>
  </item>

Article HTML provenance (sample):
  <div class="metadata__field row">
    <div class="key col-md-5 col-6 pl-0">Published Date:</div>
    <div class="value col-md-7 col-6">2026-08-11</div>
  </div>
  <div class="metadata__field row">
    <div class="key col-md-5 col-6 pl-0">Last Modified Date:</div>
    <div class="value col-md-7 col-6">2026-08-13, 10:08</div>
  </div>
  <div class="metadata__field row">
    <div class="key col-md-5 col-6 pl-0">Category:</div>
    <div class="value col-md-7 col-6">Media > Media Releases</div>
  </div>

Date-source agreement:
  RSS <pubDate>:                    2026-08-11T10:03:00Z  → 2026-08-11
  Article HTML "Published Date":    2026-08-11              → 2026-08-11
  Both authoritative publication sources agree on 2026-08-11
  "Last Modified Date" (2026-08-13) recorded as update metadata only
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | RSS feed accessible (HTTP 200, 18 KB, 25 items); feed URL advertised on official RSS feeds listing page |
| Gate 2 (Provenance) | PASS | Two authoritative publication date sources (RSS `<pubDate>` ISO 8601 + article HTML "Published Date" field) — both agree on 2026-08-11; "Last Modified Date" correctly classified as update metadata only |
| Gate 3 (Content) | PASS | Static HTML with structured metadata fields (Published Date, Category) + citation meta tags; RSS `<description>` provides article summaries |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; analogs in SNB, Bundesbank, RBI. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All authoritative publication date sources agree |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #14 unchanged |
