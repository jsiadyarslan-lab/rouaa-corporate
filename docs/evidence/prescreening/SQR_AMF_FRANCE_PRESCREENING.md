# Source Qualification Record — AMF France (Pre-screening)

**Source**: Autorité des marchés financiers (AMF) France
**Top 20 rank**: 19
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Autorité des marchés financiers (AMF) France |
| Official URL | `https://www.amf-france.org/en` |
| Feed URL | `https://www.amf-france.org/en/flux-rss/display/21` (All news and publications RSS, English); 10 additional RSS feeds available |
| Source class | financial_regulator |
| Country | FR |
| Region | Europe |
| Tier | T2 |
| Queue priority (Top 20) | 19 — Major EU regulator |
| Critical workflows | News releases, publications, public statements, consultations, enforcement |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | RSS feed (multiple feeds available) + HTML index |
| Primary URL tested | `https://www.amf-france.org/en/flux-rss/display/21` (All news and publications RSS, English) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 196,043 bytes (RSS XML, 200 items) |
| Result | **PASS** |

### Probing notes

- `https://www.amf-france.org/en` returns HTTP 200 (65 KB, English homepage)
- `https://www.amf-france.org/en/subscriptions-rss-feeds` returns HTTP 200 (60 KB, RSS subscriptions page)
- RSS feed discovered at `https://www.amf-france.org/en/flux-rss/display/21` — returns HTTP 200 (196 KB, RSS 2.0 XML, 200 items)
- 11 RSS feeds discovered (English versions at `/en/flux-rss/display/NN`):
  - Feed #21: All news and publications (probed — 200 items, 196 KB)
  - Feeds #22-31: Topic-specific feeds (not individually probed)
- Common RSS/Atom paths (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`) return HTTP 404 — feeds are at `/en/flux-rss/display/NN` paths
- RSS feed includes `<atom:link rel="self">` self-reference — standard RSS 2.0 with Atom extension
- Sample press release `https://www.amf-france.org/en/news-publications/news-releases/amf-news-releases/amf-and-acpr-joint-unit-publishes-its-2025-annual-report` returns HTTP 200 (73 KB)

**Gate 1 conclusion**: Source is accessible via RSS feed and HTML index. 11 RSS feeds available (English versions). The primary feed contains 200 items — the largest RSS feed discovered in the Top 20 pre-screening. Strong access pattern with high content volume.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (RSS XML + HTML metadata inspection) |
| Date source | RSS `<pubDate>` + article HTML visible date in `<div class="date">` — **all sources agree** |
| RSS `<pubDate>` | `Fri, 07 Aug 2026 16:16:09 +0200` (RFC 822 format with timezone +0200 CEST) — sample item "The AMF and ACPR Joint Unit publishes its 2025 annual report" |
| Article HTML visible date | `<div class="date">07 August 2026</div>` (English format) — on the article page |
| Date-source agreement | RSS `<pubDate>` (August 7, 2026) and article HTML visible date (07 August 2026) — both reference the same date |
| Result | **PASS** — authoritative publication date sources present and machine-readable; all sources agree |

### Provenance pattern assessment

AMF provides publication dates in two locations, and they **agree**:

1. **RSS `<pubDate>`**: `Fri, 07 Aug 2026 16:16:09 +0200` — RFC 822 format with Central European Summer Time (CEST) timezone offset (+0200)
2. **Article HTML visible date**: `<div class="date">07 August 2026</div>` — visible publication date in a structured `<div>` element with explicit `date` class

Both sources reference the same date (August 7, 2026). No date-source conflict exists.

**Comparison to known cases:**
- BaFin (this batch — Gate 2 PASS): RSS `<pubDate>` RFC 822 + article HTML visible date German DD/MM/YYYY (both agreed; different formats)
- AMF (this batch — Gate 2 PASS): RSS `<pubDate>` RFC 822 + article HTML `<div class="date">` English format (both agree on August 7, 2026)

**Gate 2 conclusion**: Authoritative publication date sources are present, machine-readable, and agree. The RFC 822 `<pubDate>` (with timezone) and the article HTML `<div class="date">` both reference August 7, 2026. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML + RSS inspection) |
| Content format | Static HTML + RSS with `<description>` summaries and `<enclosure>` images |
| Sample URL | `https://www.amf-france.org/en/news-publications/news-releases/amf-news-releases/amf-and-acpr-joint-unit-publishes-its-2025-annual-report` |
| Sample title | "The AMF and ACPR Joint Unit publishes its 2025 annual report" |
| Sample size | 72,770 bytes |
| Machine-readable | **YES** — static HTML contains title, visible date in `<div class="date">`, article body with substantive content (9,588 chars), and Open Graph metadata |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with "The AMF and ACPR Joint Unit publishes its 2025 annual report | AMF"
- Visible publication date: `<div class="date">07 August 2026</div>` — structured div with explicit `date` class
- Article body with 9,588 chars of substantive content (main content area)
- Open Graph metadata (`og:title`, `og:description`, `og:url`)
- RSS `<description>` contains article summaries with category metadata (e.g., "Professional guide | Asset management | UCIT | Crypto-assets | Investment services")
- RSS `<enclosure>` elements with image attachments (PNG format, ~378-388 KB each)
- Static HTML (no JS-rendered content detected for article body)

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. The `<div class="date">` provides structured publication date metadata. RSS `<description>` provides article summaries with category classification.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `financial_regulator` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | US SEC (`146aa3b` — DEVELOPMENT_VERIFIED), US CFTC (`b4fabe9` — PROSPECTIVE_VALIDATED), SFC Hong Kong (this batch), JFSA Japan (this batch), BaFin (this batch) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

AMF's content structure (press releases with titles, visible dates in `<div class="date">`, and article body text) matches the `financial_regulator` class pattern. The provenance pattern (RSS `<pubDate>` + visible date in structured HTML div) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `financial_regulator` class analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, and BaFin).

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
| Routing qualifier | None — all publication date sources agree |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (RSS `<pubDate>` RFC 822 with timezone + article HTML `<div class="date">` — both agree on August 7, 2026); configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable with analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, and BaFin |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on RSS feed | `https://www.amf-france.org/en/flux-rss/display/21` (probed 2026-08-15) | Gate 1 PASS — RSS feed accessible, returns valid RSS 2.0 XML (196 KB, 200 items — largest feed in Top 20) |
| HTTP 200 on RSS subscriptions page | `https://www.amf-france.org/en/subscriptions-rss-feeds` (probed 2026-08-15) | Gate 1 PASS — 11 RSS feed URLs advertised |
| HTTP 200 on sample press release | `https://www.amf-france.org/en/news-publications/news-releases/amf-news-releases/amf-and-acpr-joint-unit-publishes-its-2025-annual-report` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content (73 KB) |
| RSS `<pubDate>` element | `Fri, 07 Aug 2026 16:16:09 +0200` in sample item | Gate 2 PASS — RFC 822 publication date with timezone (+0200 CEST) |
| Article HTML visible date | `<div class="date">07 August 2026</div>` on sample article | Gate 2 PASS — structured publication date in div with explicit `date` class (agrees with RSS `<pubDate>`) |
| Article body content (9,588 chars) | Static HTML main content area | Gate 3 PASS — substantive content in static HTML |
| RSS `<description>` with category metadata | Article summaries with category classification (e.g., "Professional guide | Asset management | UCIT | Crypto-assets") | Gate 3 PASS — content summaries with structured category metadata |
| RSS `<enclosure>` with image attachments | PNG image enclosures (378-388 KB) | Gate 3 PASS — media attachments available in RSS feed |
| Pattern category match | US SEC (`146aa3b`), US CFTC (`b4fabe9`), SFC Hong Kong, JFSA Japan, BaFin (this batch) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle AMF without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only the primary "All news and publications" RSS feed was sampled in depth; AMF has 10 additional topic-specific feeds that may require different pattern categories or configurations)
- Does NOT resolve whether all 11 RSS feeds share the same structure (the primary feed uses RSS 2.0 with `<pubDate>` and `<enclosure>`; other feeds were not inspected)
- Does NOT prove image enclosure extraction will work (`<enclosure>` elements contain PNG images, not document content)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 19 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. AMF remains Top 20 rank #19. |

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of AMF France

Probe 1:  https://www.amf-france.org/en                        → 200 OK (65 KB, English homepage)
Probe 2:  https://www.amf-france.org/en/news                   → 404
Probe 3:  https://www.amf-france.org/en/subscriptions-rss-feeds → 200 OK (60 KB, RSS subscriptions page)
Probe 4:  https://www.amf-france.org/en/flux-rss/display/21    → 200 OK (196 KB, RSS 2.0 All news and publications feed — 200 items)
Probe 5:  https://www.amf-france.org/rss                       → 200 OK (73 KB, redirects to French RSS page)
Probe 6:  https://www.amf-france.org/feed.xml                  → 404
Probe 7:  https://www.amf-france.org/atom.xml                  → 404
Probe 8:  https://www.amf-france.org/en/rss                    → 404
Probe 9:  https://www.amf-france.org/en/news-publications/news-releases/amf-news-releases/amf-and-acpr-joint-unit-publishes-its-2025-annual-report
                                                                       → 200 OK (73 KB, sample press release)

RSS feeds discovered (11 total, English versions at /en/flux-rss/display/NN):
  1. /en/flux-rss/display/21 (All news and publications — probed, 200 items)
  2-11. /en/flux-rss/display/22 through /en/flux-rss/display/31 (topic-specific, not individually probed)

Provenance detected (sample press release):
- RSS <pubDate>: Fri, 07 Aug 2026 16:16:09 +0200 (RFC 822 with CEST timezone)
- Article HTML visible date: <div class="date">07 August 2026</div>
  (structured div with explicit "date" class)
- Both sources agree on August 7, 2026

RSS feed structure:
  - RSS 2.0 with Atom extension (<atom:link rel="self">)
  - <pubDate> in RFC 822 format with timezone
  - <description> with category metadata (e.g., "Professional guide | Asset management | UCIT | Crypto-assets")
  - <enclosure> with PNG image attachments (378-388 KB)
  - 200 items in primary feed (largest RSS feed in Top 20 pre-screening)

Article body: 9,588 chars of substantive content (static HTML, no JS rendering)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | RSS feed accessible (HTTP 200, 196 KB, 200 items — largest feed in Top 20); 11 RSS feeds available |
| Gate 2 (Provenance) | PASS | Two publication date sources (RSS `<pubDate>` RFC 822 with timezone + article HTML `<div class="date">`) — both agree on August 7, 2026 |
| Gate 3 (Content) | PASS | Static HTML; full title + structured publication date + 9,588 chars article body + RSS `<description>` with category metadata + image enclosures |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable; analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, BaFin. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All publication date sources agree |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #19 unchanged |
