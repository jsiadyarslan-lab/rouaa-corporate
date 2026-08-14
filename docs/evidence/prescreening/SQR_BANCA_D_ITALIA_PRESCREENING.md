# Source Qualification Record — Banca d'Italia (Pre-screening)

**Source**: Banca d'Italia
**Top 20 rank**: 6
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Banca d'Italia |
| Official URL | `https://www.bancaditalia.it/` |
| Feed URL | No RSS/Atom feed discovered; `alert.bancaditalia.it/webApp/rss` returns an HTML web app, not XML feed |
| Source class | central_bank |
| Country | IT |
| Region | Europe |
| Tier | T2 |
| Queue priority (Top 20) | 6 — Major EU economy; ECB system member |
| Critical workflows | Press releases (comunicati), news articles (notizie), monetary policy, statistics |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (news/press listing pages) |
| Primary URL tested | `https://www.bancaditalia.it/media/comunicati/index.html` (press releases listing) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 113,845 bytes |
| Result | **PASS** |

### Probing notes

- `https://www.bancaditalia.it/` returns HTTP 200 (164 KB, Italian homepage)
- `https://www.bancaditalia.it/media/` returns HTTP 200 (127 KB, media/news section)
- `https://www.bancaditalia.it/media/comunicati/index.html` returns HTTP 200 (114 KB, press releases listing)
- English paths return HTTP 404 (`/en/`, `/en/news/`, `/en/press-releases/`) — Banca d'Italia does not have a separate English site at standard paths; English content may be accessible via `?lang=en` parameter on specific pages
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml`)
- `alert.bancaditalia.it/webApp/rss?LANGUAGE=en` returns HTTP 200 but serves an HTML web app page, not RSS XML — this is an alert subscription interface, not a feed
- Sample news article `https://www.bancaditalia.it/media/notizia/statistiche-sul-turismo-internazionale-dell-italia-maggio-2026` returns HTTP 200 (98 KB)

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the press releases listing page and individual article pages. Content is primarily in Italian; English version exists for some pages via `?lang=en` parameter.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Authoritative publication date field in article HTML — **single source, unambiguous** |
| Article publication date field | `<div class="bdi-titlepagev2-date"><span>11 agosto 2026</span></div>` (sampled on `/media/notizia/statistiche-sul-turismo-internazionale-dell-italia-maggio-2026`) |
| Update metadata (NOT publication evidence) | `<meta name="modified" content="2026-08-11T11:00:00Z">` — recorded as update metadata only; not counted as publication date evidence per Batch 3 established rule |
| Date-source agreement | Single authoritative publication date field; no second publication date source to compare against |
| Result | **PASS** — authoritative publication date field is present and machine-readable |

### Provenance pattern assessment

Banca d'Italia provides a single authoritative publication date in the article HTML:

1. **`<div class="bdi-titlepagev2-date"><span>11 agosto 2026</span></div>`** — visible publication date in Italian format (DD monthname YYYY), located immediately after the `<h1>` title in the article header

The `<meta name="modified" content="2026-08-11T11:00:00Z">` is recorded as **update metadata only** — per the Batch 3 established rule, modified/updated timestamps are NOT treated as publication date evidence. The `modified` value (2026-08-11) happens to agree with the publication date (11 agosto 2026 = 2026-08-11), but this is supplementary; the publication date is established solely by the `bdi-titlepagev2-date` field.

**Comparison to known cases:**
- PBoC (Batch 1 — Gate 2 PASS WITH REVIEW): multiple date sources that conflict (URL timestamp + `createDate` vs. `PubDate`)
- US Treasury (Batch 2 — Gate 2 PASS): Drupal `field-news-publication-date` with ISO datetime + listing `<time>` (both publication sources agreed)
- Bundesbank (Batch 2 — Gate 2 PASS): RSS `<pubDate>` + RSS `<dc:date>` + article HTML `metadata__date` (all publication sources agreed)
- Banca d'Italia (this batch — Gate 2 PASS): single authoritative publication date field (`bdi-titlepagev2-date`); no conflict possible with only one publication source

**Gate 2 conclusion**: Authoritative publication date field is present and machine-readable. The `bdi-titlepagev2-date` div is the visible publication date field for the document, confirmed by its placement immediately after the `<h1>` title. The `modified` meta is recorded as update metadata only and is NOT counted as publication date evidence. No date-source precedence review is required because there is only one publication date source.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) + PDF enclosures for press releases |
| Sample URL | `https://www.bancaditalia.it/media/notizia/statistiche-sul-turismo-internazionale-dell-italia-maggio-2026` |
| Sample title | "Statistiche sul turismo internazionale dell'Italia - maggio 2026" |
| Sample size | 98,488 bytes |
| Machine-readable | **YES** — static HTML contains title, publication date (`bdi-titlepagev2-date`), and `og:description` with article summary |
| Result | **PASS** |

### Content inspection notes

The news article HTML contains:
- `<h1>` tag with the full title "Statistiche sul turismo internazionale dell'Italia - maggio 2026"
- `<div class="bdi-titlepagev2-date"><span>11 agosto 2026</span></div>` — visible publication date immediately after title
- `<meta name="modified" content="2026-08-11T11:00:00Z">` — update metadata (NOT publication date)
- Open Graph metadata (`og:title`, `og:description` with 132-char article summary, `og:type=article`, `og:url`)
- Static HTML body with full article text (no JS-rendered content detected; no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)

The press releases listing page (`/media/comunicati/index.html`) contains 45 links to press release PDF documents in `/media/comunicati/documenti/YYYY-MM/` paths. Press releases are delivered as PDFs with dates embedded in filenames (e.g., `cs-13.08.2026-sup-BOT.pdf`). The PDF `Last-Modified` header provides additional date metadata.

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). Banca d'Italia's content is fully present in static HTML.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. News articles have full text + metadata; press releases are delivered as PDFs with date-bearing filenames.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS), Bundesbank (Batch 2 — QUALIFICATION_READY) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

Banca d'Italia's content structure (news articles with titles, visible publication dates in `bdi-titlepagev2-date`, and body text) matches the `central_bank` class pattern. The provenance pattern (visible publication date in a structured HTML element) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB and Bundesbank.

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
| Routing qualifier | None — single authoritative publication date field; no date-source conflict |
| Routing rationale | All Gates 1-4 PASS; authoritative publication date field (`bdi-titlepagev2-date`) is present and machine-readable; configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with analogs in SNB and Bundesbank |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on press releases listing | `https://www.bancaditalia.it/media/comunicati/index.html` (probed 2026-08-15) | Gate 1 PASS — access path exists and returns content (45 press release PDF links) |
| HTTP 200 on sample news article | `https://www.bancaditalia.it/media/notizia/statistiche-sul-turismo-internazionale-dell-italia-maggio-2026` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content |
| Authoritative publication date field | `<div class="bdi-titlepagev2-date"><span>11 agosto 2026</span></div>` on sample article | Gate 2 PASS — visible publication date in structured HTML element immediately after `<h1>` title |
| Update metadata (NOT publication evidence) | `<meta name="modified" content="2026-08-11T11:00:00Z">` on sample article | Recorded as update metadata only; NOT counted as publication date per Batch 3 established rule |
| Open Graph metadata | `og:title`, `og:description` (132 chars), `og:type=article`, `og:url` | Gate 3 PASS — article metadata present in static HTML head |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle Banca d'Italia without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one news article was sampled; Banca d'Italia may publish other content types — monetary policy reports, statistics, research papers — that may require different pattern categories)
- Does NOT resolve language handling (Italian is the primary language; English content availability was not confirmed for all article types)
- Does NOT prove PDF press release extraction will work (press releases are delivered as PDFs with date-bearing filenames; PDF parsing is a separate capability from HTML extraction)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 6 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. Banca d'Italia remains Top 20 rank #6. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. Banca d'Italia transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

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
2026-08-15 — Pre-screening probe of Banca d'Italia

Probe 1:  https://www.bancaditalia.it/                                    → 200 OK (164 KB, Italian homepage)
Probe 2:  https://www.bancaditalia.it/en/                                  → 404 (no English root)
Probe 3:  https://www.bancaditalia.it/en/news/                            → 404
Probe 4:  https://www.bancaditalia.it/en/press-releases/                  → 404
Probe 5:  https://www.bancaditalia.it/media/                              → 200 OK (127 KB, media/news section)
Probe 6:  https://www.bancaditalia.it/media/comunicati/index.html         → 200 OK (114 KB, press releases listing — 45 PDF links)
Probe 7:  https://www.bancaditalia.it/media/notizia/statistiche-sul-turismo-internazionale-dell-italia-maggio-2026
                                                                          → 200 OK (98 KB, sample news article)
Probe 8:  https://www.bancaditalia.it/rss                               → 404
Probe 9:  https://www.bancaditalia.it/feed.xml                           → 404
Probe 10: https://www.bancaditalia.it/atom.xml                          → 404
Probe 11: https://alert.bancaditalia.it/webApp/rss?LANGUAGE=en          → 200 OK (59 KB, HTML web app — NOT RSS XML)

Provenance detected (sample news article):
- Authoritative publication date: <div class="bdi-titlepagev2-date"><span>11 agosto 2026</span></div>
  (immediately after <h1> title)
- Update metadata (NOT publication evidence): <meta name="modified" content="2026-08-11T11:00:00Z">
- Open Graph: og:title, og:description (132 chars), og:type=article, og:url
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; no RSS feed, but press releases listing and news articles accessible |
| Gate 2 (Provenance) | PASS | Single authoritative publication date field (`bdi-titlepagev2-date`) in article HTML; `modified` meta recorded as update metadata only |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering; full article body + title + Open Graph metadata |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; analogs in SNB and Bundesbank. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | Single publication date source; no conflict possible |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #6 unchanged |
