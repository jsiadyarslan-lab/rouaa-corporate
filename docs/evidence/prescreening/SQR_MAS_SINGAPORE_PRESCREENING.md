# Source Qualification Record — MAS Singapore (Pre-screening)

**Source**: Monetary Authority of Singapore (MAS)
**Top 20 rank**: 15
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Monetary Authority of Singapore (MAS) |
| Official URL | `https://www.mas.gov.sg/` |
| Feed URL | No RSS/Atom feed discovered; `/feed.xml` and `/atom.xml` return HTTP 200 but serve a "Maintenance" HTML page, not RSS XML |
| Source class | central_bank (dual function: central bank + financial regulator) |
| Country | SG |
| Region | SE Asia |
| Tier | T2 |
| Queue priority (Top 20) | 15 — Major APAC financial hub; dual function |
| Critical workflows | Media releases, monetary policy statements, speeches, parliamentary replies, consultations |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (news listing) |
| Primary URL tested | `https://www.mas.gov.sg/news` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 245,690 bytes |
| Server | AkamaiNetStorage |
| Result | **PASS** |

### Probing notes

- `https://www.mas.gov.sg/` returns HTTP 200 (281 KB, English homepage, AkamaiNetStorage server)
- `https://www.mas.gov.sg/news` returns HTTP 200 (246 KB, news listing page)
- `https://www.mas.gov.sg/news/media-releases` returns HTTP 200 (245 KB, media releases listing)
- `https://www.mas.gov.sg/feed.xml` returns HTTP 200 (854 KB) — BUT the response is an HTML "Maintenance" page, NOT RSS XML. The page title is "Maintenance" with a "Back to Home" description. This is not a functional RSS feed.
- `https://www.mas.gov.sg/atom.xml` returns HTTP 200 (854 KB) — same "Maintenance" HTML page, not Atom XML
- Common RSS/Atom paths (`/rss`, `/news/rss`) return HTTP 404
- No `<link rel="alternate" type="application/rss+xml">` tag in HTML head
- Sample media release `https://www.mas.gov.sg/news/media-releases/2024/11th-asian-monetary-policy-forum` returns HTTP 200 (255 KB)

**Note on Akamai**: MAS is hosted on AkamaiNetStorage, but unlike BLS/DNB/Banque de France (which return HTTP 403 from Akamai), MAS returns HTTP 200 with full content. Akamai is serving as a CDN, not blocking access.

**Gate 1 conclusion**: Source is accessible via HTML index paths. No functional RSS feed exists (`/feed.xml` and `/atom.xml` return maintenance pages). The access path is the news listing pages and individual media release article pages.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Authoritative publication date field in article HTML — **single source, unambiguous** |
| Article publication date field | `<span>Published Date: 23 May 2024</span>` (sampled on `/news/media-releases/2024/11th-asian-monetary-policy-forum` — "11th Asian Monetary Policy Forum to Discuss Monetary Policy Challenges Amid Uncertainty and Structural Shifts in the Global Economy") |
| Update metadata (NOT publication evidence) | None detected — no `modified` or `updated` meta tag found on the sample article |
| Date-source agreement | Single authoritative publication date field; no second publication date source to compare against |
| Result | **PASS** — authoritative publication date field is present and machine-readable |

### Provenance pattern assessment

MAS provides a single authoritative publication date in the article HTML:

1. **`<span>Published Date: 23 May 2024</span>`** — visible publication date in the article content area, with explicit "Published Date:" label

The JSON-LD block on the article page does NOT include `datePublished` — it only contains `title`, `description`, `type`, `categories`, and `keywords`. No `article:published_time` or `og:updated_time` meta tags were detected. The `<span>Published Date: ...</span>` is the sole authoritative publication date source.

**Comparison to known cases:**
- Banca d'Italia (Batch 3 — Gate 2 PASS): single authoritative publication date field (`bdi-titlepagev2-date`)
- Bank of Korea (Batch 3 — Gate 2 PASS): single authoritative publication date field (`<dd class="date">`)
- MAS (this batch — Gate 2 PASS): single authoritative publication date field (`<span>Published Date: ...</span>`)

**Gate 2 conclusion**: Authoritative publication date field is present and machine-readable. The `<span>Published Date: 23 May 2024</span>` with explicit "Published Date:" label is the visible publication date field for the document. No date-source precedence review is required because there is only one publication date source. No `modified`/`updated` meta tag was detected that would require the "update metadata only" classification.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (Sitecore CMS) — content is server-rendered |
| Sample URL | `https://www.mas.gov.sg/news/media-releases/2024/11th-asian-monetary-policy-forum` |
| Sample title | "11th Asian Monetary Policy Forum to Discuss Monetary Policy Challenges Amid Uncertainty and Structural Shifts in the Global Economy" |
| Sample size | 254,920 bytes |
| Machine-readable | **YES** — static HTML contains title, "Published Date" span, JSON-LD structured data, and article body (6,858 chars in main content) |
| Result | **PASS** |

### Content inspection notes

The media release HTML contains:
- `<title>` tag with the full title "11th Asian Monetary Policy Forum to Discuss Monetary Policy Challenges Amid Uncertainty and Structural Shifts in the Global Economy"
- `<span>Published Date: 23 May 2024</span>` — visible publication date
- JSON-LD structured data block with `@context: https://schema.gov.sg/`, `title`, `description`, `type: Media Releases`, `categories: ["News"]`, `keywords`
- Open Graph metadata (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card metadata (`twitter:card=summary`, `twitter:title`, `twitter:description`, `twitter:image`)
- Main content area with 6,858 chars of substantive article text (including the title, "Published Date:" label, and article body)
- Static HTML (no JS-rendered content detected for the article body; Sitecore CMS serves server-rendered content)

**Note on news listing**: The news listing page (`/news`) is partially JS-rendered — only 1 media release article link was found in static HTML (the "11th Asian Monetary Policy Forum" article). The listing likely uses a Coveo/Sitecore search API to load additional articles client-side. However, individual article pages (like the sampled media release) contain full content in static HTML.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. Individual article pages contain full content (title, publication date, article body, JSON-LD, Open Graph metadata). The news listing page is partially JS-rendered, but individual articles are server-rendered.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` / `financial_regulator` (dual function) — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS), Bundesbank (Batch 2), Banca d'Italia (Batch 3 — single publication date field) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

MAS's content structure (media releases with titles, visible "Published Date" span, and article body) matches the `central_bank` / `financial_regulator` class pattern (MAS has dual function). The provenance pattern (visible publication date in a structured HTML element) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB, Bundesbank, Banca d'Italia, and Bank of Korea.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank`/`financial_regulator` class analogs in SNB, Bundesbank, Banca d'Italia, and Bank of Korea).

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
| Routing qualifier | None — single authoritative publication date field; no date-source conflict |
| Routing rationale | All Gates 1-4 PASS; authoritative publication date field (`<span>Published Date: ...</span>`) is present and machine-readable; configuration category (`PATTERN_TYPE_METADATA`, `central_bank`/`financial_regulator` class) appears applicable with analogs in SNB, Bundesbank, Banca d'Italia, and Bank of Korea |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on news listing | `https://www.mas.gov.sg/news` (probed 2026-08-15) | Gate 1 PASS — news listing accessible (246 KB) |
| HTTP 200 on media releases listing | `https://www.mas.gov.sg/news/media-releases` (probed 2026-08-15) | Gate 1 PASS — media releases section accessible |
| HTTP 200 on sample media release | `https://www.mas.gov.sg/news/media-releases/2024/11th-asian-monetary-policy-forum` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content (255 KB) |
| Authoritative publication date field | `<span>Published Date: 23 May 2024</span>` on sample article | Gate 2 PASS — visible publication date with explicit "Published Date:" label |
| JSON-LD structured data | `@context: https://schema.gov.sg/`, `type: Media Releases`, `categories: ["News"]` | Gate 3 PASS — structured data present (but does NOT include `datePublished`) |
| Open Graph metadata | `og:title`, `og:description`, `og:image`, `og:url` | Gate 3 PASS — article metadata present in static HTML head |
| Main content (6,858 chars) | Static HTML `<main>` element with full article body | Gate 3 PASS — substantive content in static HTML (Sitecore CMS server-rendered) |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2), Banca d'Italia (Batch 3), Bank of Korea (Batch 3) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle MAS without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one media release was sampled; MAS has multiple content types — media releases, monetary policy statements, speeches, parliamentary replies, consultations — that may require different pattern categories)
- Does NOT resolve whether the news listing page can be scraped without JavaScript (only 1 article link was found in static HTML; the listing likely uses a Coveo/Sitecore search API to load additional articles client-side)
- Does NOT resolve whether `/feed.xml` will become a functional RSS feed in the future (currently returns a "Maintenance" page)
- Does NOT prove that the Sitecore CMS will remain stable (Sitecore is a complex CMS; content structure may change)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 15 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. MAS remains Top 20 rank #15. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. MAS transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of Monetary Authority of Singapore (MAS)

Probe 1:  https://www.mas.gov.sg/                                → 200 OK (281 KB, English homepage, AkamaiNetStorage)
Probe 2:  https://www.mas.gov.sg/news                            → 200 OK (246 KB, news listing page)
Probe 3:  https://www.mas.gov.sg/news/press-releases             → 404
Probe 4:  https://www.mas.gov.sg/news/media-releases             → 200 OK (245 KB, media releases listing)
Probe 5:  https://www.mas.gov.sg/rss                            → 404
Probe 6:  https://www.mas.gov.sg/feed.xml                       → 200 OK (854 KB — "Maintenance" HTML page, NOT RSS XML)
Probe 7:  https://www.mas.gov.sg/atom.xml                       → 200 OK (854 KB — same "Maintenance" page, NOT Atom XML)
Probe 8:  https://www.mas.gov.sg/news/rss                        → 404
Probe 9:  https://www.mas.gov.sg/api/v1/news                    → 404
Probe 10: https://www.mas.gov.sg/api/news                        → 404
Probe 11: https://www.mas.gov.sg/news/media-releases/2024/11th-asian-monetary-policy-forum
                                                                       → 200 OK (255 KB, sample media release)

Provenance detected (sample media release):
- Authoritative publication date: <span>Published Date: 23 May 2024</span>
  (visible publication date with explicit "Published Date:" label)
- JSON-LD: title, description, type=Media Releases, categories=["News"], keywords
  (does NOT include datePublished)
- Open Graph: og:title, og:description, og:image, og:url
- No modified/updated meta detected
- Main content: 6,858 chars of substantive article text (Sitecore CMS server-rendered)

Note on /feed.xml and /atom.xml:
  Both return HTTP 200 (854 KB) but serve an HTML "Maintenance" page, not RSS/Atom XML
  Page title: "Maintenance"
  Description: "Back to Home"
  These are NOT functional RSS/Atom feeds

Note on news listing:
  /news page is partially JS-rendered (Sitecore CMS with Coveo search)
  Only 1 media release article link found in static HTML
  Individual article pages contain full content in static HTML (server-rendered)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; AkamaiNetStorage serves as CDN (not blocking); no functional RSS feed (`/feed.xml` returns maintenance page) |
| Gate 2 (Provenance) | PASS | Single authoritative publication date field (`<span>Published Date: 23 May 2024</span>`); no `modified`/`updated` meta detected |
| Gate 3 (Content) | PASS | Static HTML (Sitecore CMS server-rendered); full title + publication date + 6,858 chars main content + JSON-LD + Open Graph metadata |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank`/`financial_regulator` class) appears applicable; analogs in SNB, Bundesbank, Banca d'Italia, Bank of Korea. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | Single publication date source; no conflict possible |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #15 unchanged |
