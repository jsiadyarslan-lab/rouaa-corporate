# Source Qualification Record — Reserve Bank of India (Pre-screening)

**Source**: Reserve Bank of India (RBI)
**Top 20 rank**: 11
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Reserve Bank of India (RBI) |
| Official URL | `https://www.rbi.org.in/` |
| Feed URL | `https://rbi.org.in/pressreleases_rss.xml` (Press Releases RSS); 5 additional RSS feeds available |
| Source class | central_bank |
| Country | IN |
| Region | S. Asia |
| Tier | T2 |
| Queue priority (Top 20) | 11 — Major economy; fills South Asia gap |
| Critical workflows | Press releases, monetary policy, regulations, statistics |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | RSS feed (multiple feeds available) + HTML index |
| Primary URL tested | `https://rbi.org.in/pressreleases_rss.xml` (Press Releases RSS) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 40,594 bytes (RSS XML) |
| Result | **PASS** |

### Probing notes

- `https://www.rbi.org.in/` returns HTTP 200 (171 KB, English homepage, ASP.NET)
- `https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx` returns HTTP 200 (176 KB, press releases listing)
- `https://www.rbi.org.in/Scripts/Rss.aspx` returns HTTP 200 (64 KB) — this is an HTML page listing all RSS feed URLs, not a feed itself
- 6 RSS feeds discovered at `rbi.org.in` subdomain:
  1. **Press Releases** — `https://rbi.org.in/pressreleases_rss.xml` (40 KB, 10 items)
  2. **Notifications** — `https://rbi.org.in/notifications_rss.xml`
  3. **Speeches** — `https://rbi.org.in/speeches_rss.xml`
  4. **Publication** — `https://rbi.org.in/Publication_rss.xml`
  5. **Annual Report** — `https://rbi.org.in/AnnualReportMain_rss.xml`
  6. **Tenders** — `https://rbi.org.in/tenders_rss.xml`
- Common RSS/Atom paths on `www.rbi.org.in` return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`) — feeds are hosted on the `rbi.org.in` subdomain, not `www.rbi.org.in`
- No `<link rel="alternate" type="application/rss+xml">` tag in HTML head (feeds are linked from `/Scripts/Rss.aspx` HTML page instead)

**Gate 1 conclusion**: Source is accessible via RSS feed. 6 RSS feeds available covering press releases, notifications, speeches, publications, annual reports, and tenders. This is a strong access pattern — multiple topic-specific feeds with standard RSS 2.0 XML format.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (RSS XML + HTML metadata inspection) |
| Date source | RSS `<pubDate>` + article HTML visible date — **all sources agree** |
| RSS `<pubDate>` | `Fri, 14 Aug 2026 20:10:00` (RFC 822 format, no timezone offset) — sample item "Premature redemption under Sovereign Gold Bond (SGB) Scheme" |
| Article HTML visible date | `Date : Aug 14, 2026` — visible on the article page (`BS_PressReleaseDisplay.aspx?prid=63381`) |
| Date-source agreement | RSS `<pubDate>` (Aug 14, 2026) and article HTML "Date: Aug 14, 2026" — both reference the same date |
| Result | **PASS** — authoritative publication date sources present and machine-readable; all sources agree |

### Provenance pattern assessment

RBI provides publication dates in two locations, and they **agree**:

1. **RSS `<pubDate>`**: `Fri, 14 Aug 2026 20:10:00` — RFC 822 format in the RSS feed (no `<dc:date>` element present, but `<pubDate>` alone is sufficient)
2. **Article HTML visible date**: `Date : Aug 14, 2026` — visible date label on the article page

Both sources reference the same date (August 14, 2026). No date-source conflict exists.

**Note on RSS `<pubDate>` format**: RBI's `<pubDate>` uses RFC 822 format without timezone offset (`Fri, 14 Aug 2026 20:10:00`). This is technically non-compliant with RSS 2.0 spec (which requires RFC 822 with timezone), but the date is parseable. No `<dc:date>` element is present as a secondary ISO 8601 source.

**Comparison to known cases:**
- Bundesbank (Batch 2 — Gate 2 PASS): RSS `<pubDate>` + RSS `<dc:date>` + article HTML date (all agreed)
- US Treasury (Batch 2 — Gate 2 PASS): Drupal field + listing `<time>` + `og:updated_time` (all agreed; `og:updated_time` later reclassified as update metadata)
- RBI (this batch — Gate 2 PASS): RSS `<pubDate>` + article HTML visible date (both agree on Aug 14, 2026)

**Gate 2 conclusion**: Authoritative publication date sources are present, machine-readable, and agree. The RFC 822 `<pubDate>` (despite missing timezone offset) and the article HTML visible date both reference August 14, 2026. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML + RSS inspection) |
| Content format | Static HTML (no JS rendering required) + RSS with full content in `<description>` |
| Sample URL | `https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63381` |
| Sample title | "Premature redemption under Sovereign Gold Bond (SGB) Scheme - Redemption Price for premature redemption of SGB 2021-22 Series V due on August 17, 2026" |
| Sample size | 110,953 bytes |
| Machine-readable | **YES** — static HTML contains title, visible date, and full press release body; RSS `<description>` contains full HTML content |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with "Press Releases | Official Website of Reserve Bank of India"
- Visible date label: `Date : Aug 14, 2026`
- Full press release body text (1,219 chars in the press release table): includes the title, redemption price details, and signatory information
- Static HTML (ASP.NET with `__VIEWSTATE`; no JS-rendered content detected for article body)
- RSS `<description>` contains the full HTML content of each press release (tables, paragraphs, links) — substantive content is available directly in the RSS feed without needing to fetch individual articles

The RSS feed's `<description>` element contains the complete press release text as HTML (including tables, links to PDFs, and signatory blocks). This is a strong content pattern — the pipeline can extract full content from the RSS feed alone, without fetching individual article pages.

**Gate 3 conclusion**: Content is substantive and machine-readable in both static HTML and RSS. The RSS `<description>` contains full HTML content per item, which is a strong content access pattern.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, RSS with `dc:date`, config-only PASS), Bundesbank (Batch 2 — RSS with `pubDate` + `dc:date`) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

RBI's content structure (RSS 2.0 feed with `<pubDate>` for each item, full HTML content in `<description>`) matches the `central_bank` class pattern. The provenance pattern (RSS with `<pubDate>`) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB and Bundesbank.

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
| Routing qualifier | None — all publication date sources agree |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (RSS `<pubDate>` = article HTML visible date, both Aug 14, 2026); configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with analogs in SNB and Bundesbank |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on RSS feed | `https://rbi.org.in/pressreleases_rss.xml` (probed 2026-08-15) | Gate 1 PASS — RSS feed accessible, returns valid RSS 2.0 XML (40 KB, 10 items) |
| HTTP 200 on press releases listing | `https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx` (probed 2026-08-15) | Gate 1 PASS — HTML index accessible (176 KB) |
| 6 RSS feeds discovered | `https://www.rbi.org.in/Scripts/Rss.aspx` (probed 2026-08-15) | Gate 1 PASS — multiple topic-specific feeds available (press releases, notifications, speeches, publications, annual reports, tenders) |
| RSS `<pubDate>` element | `Fri, 14 Aug 2026 20:10:00` in sample item | Gate 2 PASS — RFC 822 publication date in RSS |
| Article HTML visible date | `Date : Aug 14, 2026` on sample article | Gate 2 PASS — visible publication date in article HTML (agrees with RSS `<pubDate>`) |
| RSS `<description>` with full HTML content | Complete press release text (tables, links, signatory) in RSS `<description>` | Gate 3 PASS — substantive content available in RSS feed directly |
| HTTP 200 on sample article | `https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63381` (probed 2026-08-15) | Gate 3 PASS — static HTML article accessible (111 KB) |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle RBI without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only the press releases RSS feed was sampled in depth; RBI has 5 additional feeds — notifications, speeches, publications, annual reports, tenders — that may require different pattern categories or configurations)
- Does NOT resolve whether all 6 RSS feeds share the same structure (the press releases feed uses RSS 2.0 with `<pubDate>` and full HTML in `<description>`; other feeds were not inspected)
- Does NOT prove that the RFC 822 `<pubDate>` without timezone offset will parse correctly in all pipeline components (the date is parseable but non-compliant with RSS 2.0 spec)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 11 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. RBI remains Top 20 rank #11. |

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of Reserve Bank of India (RBI)

Probe 1:  https://www.rbi.org.in/                                → 200 OK (171 KB, English homepage, ASP.NET)
Probe 2:  https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx → 200 OK (176 KB, press releases listing)
Probe 3:  https://www.rbi.org.in/Scripts/Rss.aspx                 → 200 OK (64 KB, HTML page listing 6 RSS feed URLs)
Probe 4:  https://rbi.org.in/pressreleases_rss.xml               → 200 OK (41 KB, RSS 2.0 Press Releases feed — 10 items)
Probe 5:  https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63381 → 200 OK (111 KB, sample press release)
Probe 6:  https://www.rbi.org.in/rss                            → 404
Probe 7:  https://www.rbi.org.in/feed.xml                       → 404
Probe 8:  https://www.rbi.org.in/atom.xml                       → 404

RSS feeds discovered (6 total):
  1. https://rbi.org.in/pressreleases_rss.xml (Press Releases — probed)
  2. https://rbi.org.in/notifications_rss.xml (Notifications)
  3. https://rbi.org.in/speeches_rss.xml (Speeches)
  4. https://rbi.org.in/Publication_rss.xml (Publication)
  5. https://rbi.org.in/AnnualReportMain_rss.xml (Annual Report)
  6. https://rbi.org.in/tenders_rss.xml (Tenders)

Provenance detected (sample press release prid=63381):
- RSS <pubDate>: Fri, 14 Aug 2026 20:10:00 (RFC 822, no timezone offset)
- Article HTML visible date: "Date : Aug 14, 2026"
- Both sources agree on August 14, 2026

RSS <description> contains full HTML content:
  - Complete press release text with tables, links, and signatory block
  - Substantive content available directly in RSS feed
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | RSS feed accessible (HTTP 200); 6 RSS feeds available; strongest access pattern alongside Bundesbank |
| Gate 2 (Provenance) | PASS | Two publication date sources (RSS `<pubDate>` + article HTML visible date) — both agree on Aug 14, 2026; RFC 822 format (note: missing timezone offset, non-compliant with RSS 2.0 spec but parseable) |
| Gate 3 (Content) | PASS | Static HTML + RSS with full HTML content in `<description>`; substantive content available directly in RSS feed |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; analogs in SNB and Bundesbank. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All publication date sources agree |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #11 unchanged |
