# Source Qualification Record — SFC Hong Kong (Pre-screening)

**Source**: Securities and Futures Commission (SFC) Hong Kong
**Top 20 rank**: 16
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Securities and Futures Commission (SFC) Hong Kong |
| Official URL | `https://www.sfc.hk/en/` |
| Feed URL | No functional RSS/Atom feed; `/feed.xml` and `/atom.xml` return HTTP 200 but serve a 404 HTML page |
| Source class | financial_regulator |
| Country | HK |
| Region | E. Asia |
| Tier | T2 |
| Queue priority (Top 20) | 16 — Major APAC financial hub |
| Critical workflows | News, enforcement actions, decisions, high-shareholding concentration announcements, speeches, consultations |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (www.sfc.hk) — news section partially accessible; apps.sfc.hk is JS-rendered React SPA |
| Primary URL tested | `https://www.sfc.hk/en/News-and-announcements/High-shareholding-concentration-announcements` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 183,584 bytes |
| Result | **PASS** (www.sfc.hk static HTML) / **CAUTION** (apps.sfc.hk is JS-rendered React SPA) |

### Probing notes

- `https://www.sfc.hk/en/` returns HTTP 200 (123 KB, English homepage)
- `https://www.sfc.hk/en/News-and-announcements/` returns HTTP 200 (92 KB, news and announcements section)
- `https://www.sfc.hk/en/News-and-announcements/News/All-news` redirects to `https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/` — returns HTTP 200 but only 3,908 bytes (React SPA shell with empty `<div id="root">`)
- `https://www.sfc.hk/feed.xml` returns HTTP 200 (3,249 bytes) — BUT the response is a 404 HTML page with `<title>404 | Securities & Futures Commission of Hong Kong</title>`, NOT RSS XML
- `https://www.sfc.hk/atom.xml` returns HTTP 200 (3,249 bytes) — same 404 HTML page, NOT Atom XML
- Common RSS/Atom paths (`/rss`, `/en/rss`, `/en/feed.xml`) return HTTP 404
- Legacy press release paths (`/sfc/doc/EN/news/pr/YYYY/MM/prYYYYMMDD.html`) return HTTP 200 but redirect to 404 page (3,249 bytes) — legacy content has been migrated to apps.sfc.hk

### Two-domain architecture

SFC uses a split architecture:
1. **`www.sfc.hk`**: Main site with substantive static HTML content — speeches, decisions, high-shareholding announcements, policy statements. Some sections accessible (HTTP 200 with full content); others redirect to apps.sfc.hk.
2. **`apps.sfc.hk`**: News/press release application — React SPA (`<div id="root">`, `main.41ff7da8.chunk.js`). Static HTML is an empty shell (3,908 bytes); all news content is JS-rendered.

**Static HTML content available on www.sfc.hk**: The High-shareholding Concentration Announcements page (183 KB) contains 241 table rows with dates, stock codes, company names, and PDF links — substantive content accessible in static HTML.

**Gate 1 conclusion**: Source is partially accessible. The main domain (www.sfc.hk) has substantive static HTML content for some content types (speeches, decisions, high-shareholding announcements). The news/press release application (apps.sfc.hk) is JS-rendered React SPA — matches the BCB/UK ONS pattern. This classifies as Gate 1 PASS because at least one content type (high-shareholding announcements) is accessible in static HTML with publication dates.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Visible date in table rows + page-level date meta tag |
| High-shareholding announcements | Table rows contain visible dates: `04 Aug 2026`, `25 June 2026`, `21 Jul 2026`, `16 June 2026` — publication dates adjacent to each announcement entry |
| Page-level date meta | `<meta name="date" content="2026-08-04">` — page's last update date (NOT individual article publication date) |
| Date-source agreement | Single content type assessed (high-shareholding announcements); visible dates in table rows are the authoritative publication dates for each entry |
| Result | **PASS** — authoritative publication dates present in static HTML table structure |

### Provenance pattern assessment

SFC's High-shareholding Concentration Announcements page provides publication dates in a structured HTML table:

```html
<tr>
  <td>Announcement date</td>
  <td>Relevant information date</td>
  <td>Stock Code</td>
  <td>Company</td>
</tr>
<tr>
  <td>04 Aug 2026</td>  <!-- Announcement date -->
  <td>21 Jul 2026</td>  <!-- Relevant information date -->
  <td>02270</td>
  <td>Desun Real Estate Investment Services Group Co., Ltd.</td>
</tr>
```

Each table row contains:
- **Announcement date**: `04 Aug 2026` — the authoritative publication date for the announcement
- **Relevant information date**: `21 Jul 2026` — the date of the underlying information (NOT the publication date)
- **Stock Code** and **Company Name**: identification metadata
- **PDF link**: `https://www.sfc.hk/-/media/EN/files/ENF/HighCon/e02270260804.pdf` — the substantive content (PDF)

The page-level `<meta name="date" content="2026-08-04">` is the page's last update date — recorded as update metadata only, NOT counted as publication evidence per Batch 3 established rule.

**Note on content type limitation**: Only the high-shareholding announcements page was assessed in depth. The news/press release application (apps.sfc.hk) is JS-rendered, so its publication date structure could not be verified. The result applies to the high-shareholding announcements content type; other content types (news, enforcement actions, decisions) were not verified and may have different date structures.

**Gate 2 conclusion**: Authoritative publication dates are present in static HTML table structure for the high-shareholding announcements content type. The announcement date column provides per-entry publication dates. No date-source conflict exists for this content type.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML table structure + PDF attachments |
| Sample URL | `https://www.sfc.hk/en/News-and-announcements/High-shareholding-concentration-announcements` |
| Sample size | 183,584 bytes |
| Machine-readable | **YES** — static HTML table with 241 rows, each containing announcement date, relevant information date, stock code, company name, and PDF link |
| Result | **PASS** (for high-shareholding announcements content type) |

### Content inspection notes

The high-shareholding announcements page contains:
- Static HTML table with 241 rows (announcement entries)
- Each row: announcement date, relevant information date, stock code, company name, PDF link
- 240 PDF attachment links in `/media/EN/files/ENF/HighCon/` paths — substantive content is in PDF documents
- No JS-rendered content detected for this page (unlike apps.sfc.hk news application)
- Page-level Open Graph metadata (`og:title`, `og:description`, `og:type`, `date` meta)

**Note on content type limitation**: The news/press release application (apps.sfc.hk) is a React SPA with empty static HTML shell (3,908 bytes) — content requires JavaScript execution. This matches the BCB and UK ONS pattern. However, the high-shareholding announcements content type IS accessible in static HTML and provides substantive content with publication dates.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML for the high-shareholding announcements content type. The news/press release application requires JavaScript execution (outside pre-screening scope). The result applies to the accessible content type.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `financial_regulator` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | US SEC (`146aa3b` — DEVELOPMENT_VERIFIED, ALREADY_QUALIFIED), US CFTC (`b4fabe9` — PROSPECTIVE_VALIDATED) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

SFC's content structure (announcements with dates, stock codes, and PDF attachments in a structured HTML table) matches the `financial_regulator` class pattern. The provenance pattern (visible dates in structured HTML elements) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `financial_regulator` class analogs in US SEC and US CFTC).

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
| Earliest blocking gate | none (Gates 1-4 all PASS for high-shareholding announcements content type) |
| Initial routing | **QUALIFICATION_READY** |
| Routing qualifier | None — single content type assessed with unambiguous publication dates |
| Routing rationale | All Gates 1-4 PASS for the high-shareholding announcements content type; authoritative publication dates present in static HTML table; configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable with analogs in US SEC and US CFTC |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation, and because only one content type was fully assessed. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on high-shareholding announcements | `https://www.sfc.hk/en/News-and-announcements/High-shareholding-concentration-announcements` (probed 2026-08-15) | Gate 1 PASS — static HTML accessible (184 KB) |
| Static HTML table with 241 rows | Each row: announcement date, relevant information date, stock code, company, PDF link | Gate 3 PASS — substantive content with structured metadata in static HTML |
| Visible announcement dates in table | `04 Aug 2026`, `25 June 2026`, `21 Jul 2026`, `16 June 2026` | Gate 2 PASS — per-entry publication dates in structured HTML table |
| 240 PDF attachment links | `/media/EN/files/ENF/HighCon/eNNNNNYYYYMMDD.pdf` pattern | Gate 3 PASS — substantive content delivered as PDF attachments with date-bearing filenames |
| Page-level date meta | `<meta name="date" content="2026-08-04">` | Recorded as page update metadata only; NOT counted as article publication date |
| apps.sfc.hk React SPA shell | 3,908 bytes with `<div id="root">` empty | News/press release application is JS-rendered — outside pre-screening scope |
| /feed.xml and /atom.xml return 404 HTML | HTTP 200 but content is 404 page, not RSS XML | No functional RSS feed available |
| Pattern category match | US SEC (`146aa3b`), US CFTC (`b4fabe9`) | Gate 4 PASS — direct analogs exist in same class |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle SFC without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only the high-shareholding announcements content type was assessed; SFC has multiple content types — news, enforcement actions, decisions, speeches, consultations — on apps.sfc.hk which is JS-rendered and was not verified)
- Does NOT resolve whether the news/press release content on apps.sfc.hk has publication date metadata (React SPA content could not be inspected without JavaScript execution)
- Does NOT prove PDF attachment extraction will work (substantive content is in PDF format with date-bearing filenames; PDF parsing is a separate capability from HTML extraction)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 16 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. SFC remains Top 20 rank #16. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. SFC transitions to QUALIFICATION_READY based on Gates 1-4 all PASS for the high-shareholding announcements content type with no unresolved items.

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of SFC Hong Kong

Probe 1:  https://www.sfc.hk/en/                                → 200 OK (123 KB, English homepage)
Probe 2:  https://www.sfc.hk/en/News-and-announcements/         → 200 OK (92 KB, news section)
Probe 3:  https://www.sfc.hk/en/News-and-announcements/News/All-news → 200 OK (4 KB, redirects to apps.sfc.hk React SPA)
Probe 4:  https://www.sfc.hk/feed.xml                          → 200 OK (3 KB — 404 HTML page, NOT RSS XML)
Probe 5:  https://www.sfc.hk/atom.xml                          → 200 OK (3 KB — same 404 page, NOT Atom XML)
Probe 6:  https://www.sfc.hk/rss                            → 404
Probe 7:  https://www.sfc.hk/en/rss                          → 404
Probe 8:  https://www.sfc.hk/en/News-and-announcements/High-shareholding-concentration-announcements
                                                                  → 200 OK (184 KB, static HTML table with 241 rows)
Probe 9:  https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/
                                                                  → 200 OK (4 KB, React SPA shell with empty <div id="root">)
Probe 10: https://www.sfc.hk/sfc/doc/EN/news/pr/2026/08/pr20260814.html
                                                                  → 200 OK (3 KB — 404 redirect page, legacy content migrated)

Two-domain architecture:
  www.sfc.hk: main site with static HTML content (speeches, decisions, high-shareholding announcements)
  apps.sfc.hk: news/press release application (React SPA, JS-rendered — empty static HTML shell)

Provenance detected (high-shareholding announcements):
  Static HTML table with 241 rows:
    - Announcement date: 04 Aug 2026 (authoritative publication date per entry)
    - Relevant information date: 21 Jul 2026 (date of underlying information, NOT publication)
    - Stock Code: 02270
    - Company: Desun Real Estate Investment Services Group Co., Ltd.
    - PDF link: /media/EN/files/ENF/HighCon/e02270260804.pdf
  Page-level date meta: <meta name="date" content="2026-08-04"> (page update date, NOT article publication date)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | www.sfc.hk accessible with static HTML content; apps.sfc.hk is JS-rendered React SPA (outside pre-screening scope) |
| Gate 2 (Provenance) | PASS | Visible announcement dates in static HTML table structure (high-shareholding announcements content type) |
| Gate 3 (Content) | PASS | Static HTML table with 241 rows + 240 PDF attachments; substantive content accessible for high-shareholding announcements |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable; analogs in US SEC, US CFTC. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS for high-shareholding announcements content type |
| **Routing qualifier** | None | Single content type assessed with unambiguous publication dates |
| **Confidence** | MEDIUM | Based on pre-screening evidence; only one content type fully assessed |
| **Priority retained** | Yes | Top 20 rank #16 unchanged |
