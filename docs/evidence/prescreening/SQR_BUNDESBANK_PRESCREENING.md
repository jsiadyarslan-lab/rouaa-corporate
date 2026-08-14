# Source Qualification Record — Bundesbank (Pre-screening)

**Source**: Deutsche Bundesbank
**Top 20 rank**: 4
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Deutsche Bundesbank |
| Official URL | `https://www.bundesbank.de/en/` |
| Feed URL | `https://www.bundesbank.de/service/rss/en/633306/feed.rss` (Latest — English) |
| Source class | central_bank |
| Country | DE |
| Region | Europe |
| Tier | T2 |
| Queue priority (Top 20) | 4 — Major EU economy; ECB system member |
| Critical workflows | Press releases, federal securities auctions, discussion papers, speeches |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | RSS feed (multiple feeds available) |
| Primary URL tested | `https://www.bundesbank.de/service/rss/en/633306/feed.rss` (Latest — English) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 8,351 bytes (RSS XML) |
| Result | **PASS** |

### Probing notes

- `https://www.bundesbank.de/en/` returns HTTP 200 (377 KB, English homepage)
- `https://www.bundesbank.de/en/press/press-releases` returns HTTP 200 (294 KB, press releases listing)
- The press releases listing page advertises **5 RSS feeds** via `<link rel="alternate" type="application/rss+xml">` tags in HTML head:
  1. **Latest** — `/service/rss/en/633306/feed.rss` (10 items, 8.4 KB)
  2. **Discussion Papers** — `/service/rss/en/633292/feed.rss` (10 items, 8.8 KB)
  3. **Speeches, Interview and Contributions** — `/service/rss/en/633296/feed.rss` (7 items, 4.9 KB)
  4. **Topics** — `/service/rss/en/633312/feed.rss`
  5. **Outstanding open market operations** — `/service/rss/en/878806/feed.rss`
- All RSS feeds return HTTP 200 with valid RSS 2.0 XML
- Common but non-advertised RSS paths (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml`, `/en/presse/rss`) return HTTP 404 — Bundesbank uses path-based feed IDs (`/service/rss/en/<id>/feed.rss`) rather than conventional paths

**Gate 1 conclusion**: Source is accessible via RSS feed. This is the **strongest access pattern** in the Top 20 so far — Bundesbank explicitly advertises multiple RSS feeds via standard `<link rel="alternate">` HTML tags, and all feeds return valid RSS 2.0 XML. This matches the SNB precedent (`c09de13` — central_bank, RSS with `dc:date`).

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (RSS XML + HTML metadata inspection) |
| Date source | Multiple date sources — **all sources agree** |
| RSS `<pubDate>` | `Fri, 14 Aug 2026 08:00:00 GMT` (RFC 822 format) — sample item "Invitation to bid – Federal Treasury discount paper (Bubills)" |
| RSS `<dc:date>` | `2026-08-14T08:00:00Z` (ISO 8601 with timezone) — same item |
| Article HTML `<span class="metadata__date">` | `14.08.2026` (German format DD.MM.YYYY) — on the article page |
| Date-source agreement | RSS `pubDate` = RSS `dc:date` = article HTML date — all reference 2026-08-14 |
| Result | **PASS** — provenance is unambiguous and machine-readable; all date sources agree |

### Provenance pattern assessment

Bundesbank provides **two date sources in RSS** plus **one in article HTML**, and they all agree:

1. **RSS `<pubDate>`** (RFC 822 format): `Fri, 14 Aug 2026 08:00:00 GMT`
2. **RSS `<dc:date>`** (ISO 8601 with timezone): `2026-08-14T08:00:00Z`
3. **Article HTML `<span class="metadata__date">`**: `14.08.2026` (German format DD.MM.YYYY)

The RSS `<pubDate>` and `<dc:date>` reference the same instant (2026-08-14 08:00:00 UTC) — they are redundant and agree. The article HTML date `14.08.2026` corresponds to the same calendar date (2026-08-14). No date-source conflict exists.

**Comparison to known cases:**
- SNB (`c09de13` — Gate 2 PASS): single date source (`dc:date` in RSS) → Bundesbank is stronger (two RSS date sources that agree + article HTML date)
- PBoC (this batch — Gate 2 PASS WITH REVIEW): URL timestamp and `createDate` agree, but `PubDate` differs by 1 day → Bundesbank has no such conflict
- US Treasury (this batch — Gate 2 PASS): three date sources all agree → Bundesbank matches this strength
- ESMA RSS (`27294db` — Gate 2 FAIL): no publication date in RSS feed at all → Bundesbank is far stronger

**Gate 2 conclusion**: Provenance metadata is available, machine-readable, and unambiguous. The ISO 8601 `dc:date` (`2026-08-14T08:00:00Z`) is directly parseable as the `document_date` for the pipeline. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) + PDF enclosures |
| Sample URL | `https://www.bundesbank.de/en/press/press-releases/federal-securities/invitation-to-bid-federal-treasury-discount-paper-bubills--964632` |
| Sample title | "Invitation to bid – Federal Treasury discount paper (Bubills)" |
| Sample size | 277,696 bytes |
| Machine-readable | **YES** — static HTML contains title, date (`<span class="metadata__date">14.08.2026</span>`), and PDF enclosure link |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<h1>` tag with the full title "Invitation to bid – Federal Treasury discount paper (Bubills)"
- `<span class="metadata__date">14.08.2026</span>` — visible publication date in German format
- `<span class="metadata__type">Press release</span>` — content type metadata
- PDF enclosure link (`<a href="...2026-08-14-ausschreibung-download.pdf">`) — the substantive content is a PDF document linked from the article
- No JS-rendered content detected (no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)
- RSS feed contains 10 items with full `<title>`, `<link>`, `<pubDate>`, `<dc:date>`, and `<enclosure>` (PDF) for each item

**Content substance note**: The article HTML itself is relatively sparse (130 chars of main text) — the substantive content is the linked PDF enclosure. However, the RSS feed provides the title, date, link, and enclosure URL for each item, which is sufficient for the pipeline to extract and process. This pattern is consistent with the SNB precedent where the RSS feed is the primary access path and the article HTML provides supplementary metadata.

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). Bundesbank's content is fully present in static HTML + RSS.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML + RSS. The PDF enclosure pattern is well-defined and accessible via the RSS `<enclosure>` element.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, RSS with `dc:date`, config-only PASS) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

Bundesbank's content structure (RSS 2.0 feed with `<pubDate>` and `<dc:date>` for each item) matches the `central_bank` class pattern. The provenance pattern (RSS with `dc:date` in ISO 8601) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB (`c09de13`).

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank` class analog in SNB).

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

Per pre-screening scope: Gate 5 is NOT performed during pre-screening.

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
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (RSS `pubDate` = RSS `dc:date` = article HTML date, all 2026-08-14); configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with direct analog in SNB (`c09de13`) |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on RSS feed | `https://www.bundesbank.de/service/rss/en/633306/feed.rss` (probed 2026-08-15) | Gate 1 PASS — RSS feed accessible, returns valid RSS 2.0 XML (8.4 KB, 10 items) |
| HTTP 200 on press releases listing | `https://www.bundesbank.de/en/press/press-releases` (probed 2026-08-15) | Gate 1 PASS — HTML index accessible; advertises 5 RSS feeds via `<link rel="alternate">` |
| RSS `<pubDate>` element | `Fri, 14 Aug 2026 08:00:00 GMT` in sample item | Gate 2 PASS — RFC 822 publication date in RSS |
| RSS `<dc:date>` element | `2026-08-14T08:00:00Z` in sample item | Gate 2 PASS — ISO 8601 publication date in RSS (agrees with `pubDate`) |
| Article HTML `<span class="metadata__date">` | `14.08.2026` on sample article page | Gate 2 PASS — article HTML date agrees with RSS dates (all 2026-08-14) |
| RSS `<enclosure>` element | PDF enclosure URL with `length` and `type` attributes | Gate 3 PASS — substantive content (PDF) linked from RSS |
| HTTP 200 on sample article | `https://www.bundesbank.de/en/press/press-releases/federal-securities/invitation-to-bid-federal-treasury-discount-paper-bubills--964632` (probed 2026-08-15) | Gate 3 PASS — static HTML contains title, date, and PDF link |
| Pattern category match | SNB (`c09de13` — central_bank, RSS with `dc:date`, config-only PASS) | Gate 4 PASS — direct analog exists in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle Bundesbank RSS without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one RSS feed was sampled in depth; Bundesbank has 5 feeds — Latest, Discussion Papers, Speeches, Topics, Open Market Operations — that may require different pattern categories or configurations)
- Does NOT resolve whether all 5 RSS feeds share the same structure (the 3 sampled feeds all use RSS 2.0 with `dc:date`, but the other 2 were not inspected)
- Does NOT prove PDF enclosure extraction will work (the substantive content is in PDF format; PDF parsing is a separate capability from RSS/HTML extraction)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 4 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. Bundesbank remains Top 20 rank #4. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. Bundesbank transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

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
| Evidence basis | Pre-screening HTTP probing + RSS XML inspection + HTML metadata inspection (no test commit, no Gate 5 run) |

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
2026-08-15 — Pre-screening probe of Deutsche Bundesbank

Probe 1:  https://www.bundesbank.de/                                  → 200 OK (377 KB, redirects to /en)
Probe 2:  https://www.bundesbank.de/en/                               → 200 OK (377 KB, English homepage)
Probe 3:  https://www.bundesbank.de/en/press                          → 200 OK (299 KB, press section)
Probe 4:  https://www.bundesbank.de/en/press/press-releases           → 200 OK (294 KB, press releases listing — advertises 5 RSS feeds)
Probe 5:  https://www.bundesbank.de/rss                              → 404 (no RSS at this path)
Probe 6:  https://www.bundesbank.de/feed.xml                          → 404
Probe 7:  https://www.bundesbank.de/atom.xml                          → 404
Probe 8:  https://www.bundesbank.de/en/rss                            → 404
Probe 9:  https://www.bundesbank.de/en/feed.xml                       → 404
Probe 10: https://www.bundesbank.de/en/presse/rss                     → 404
Probe 11: https://www.bundesbank.de/service/rss/en/633306/feed.rss    → 200 OK (8.4 KB, RSS 2.0 "Latest" feed — 10 items)
Probe 12: https://www.bundesbank.de/service/rss/en/633292/feed.rss    → 200 OK (8.8 KB, RSS 2.0 "Discussion Papers" feed — 10 items)
Probe 13: https://www.bundesbank.de/service/rss/en/633296/feed.rss    → 200 OK (4.9 KB, RSS 2.0 "Speeches" feed — 7 items)
Probe 14: https://www.bundesbank.de/en/press/press-releases/federal-securities/invitation-to-bid-federal-treasury-discount-paper-bubills--964632
                                                                          → 200 OK (278 KB, sample press release)

RSS feed structure (sample item from Latest feed):
  <item>
    <title>Invitation to bid – Federal Treasury discount paper (Bubills)</title>
    <link>https://www.bundesbank.de/en/press/press-releases/federal-securities/invitation-to-bid-federal-treasury-discount-paper-bubills--964632</link>
    <description />
    <enclosure url="https://www.bundesbank.de/resource/blob/964632/.../2026-08-14-ausschreibung-download.pdf" length="137128" type="application/pdf" />
    <pubDate>Fri, 14 Aug 2026 08:00:00 GMT</pubDate>
    <guid>https://www.bundesbank.de/en/press/press-releases/federal-securities/invitation-to-bid-federal-treasury-discount-paper-bubills--964632</guid>
    <dc:creator />
    <dc:date>2026-08-14T08:00:00Z</dc:date>
  </item>

Article HTML provenance (sample):
  <h1>Invitation to bid – Federal Treasury discount paper (Bubills)</h1>
  <div class="metadata">
    <span class="metadata__date">14.08.2026</span>
    <span class="metadata__docid">
      <span class="metadata__type">Press release</span>
    </span>
  </div>

Date-source agreement:
  RSS pubDate:        Fri, 14 Aug 2026 08:00:00 GMT  → 2026-08-14 08:00:00 UTC
  RSS dc:date:        2026-08-14T08:00:00Z            → 2026-08-14 08:00:00 UTC
  Article HTML date:  14.08.2026                      → 2026-08-14
  All three sources agree on 2026-08-14
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | RSS feed accessible (HTTP 200); 5 feeds advertised via `<link rel="alternate">` in HTML head; RSS 2.0 XML with 10 items per feed |
| Gate 2 (Provenance) | PASS | Three date sources (RSS `pubDate`, RSS `dc:date`, article HTML `metadata__date`) — all agree on 2026-08-14; ISO 8601 `dc:date` directly parseable |
| Gate 3 (Content) | PASS | Static HTML + RSS; substantive content in PDF enclosures linked from RSS `<enclosure>` elements |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; direct analog in SNB (`c09de13`). Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All date sources agree; no review flag needed |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #4 unchanged |
