# Source Qualification Record — Bank of Korea (Pre-screening)

**Source**: Bank of Korea (BOK)
**Top 20 rank**: 10
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Bank of Korea (BOK / 한국은행) |
| Official URL | `https://www.bok.or.kr/eng/main/main.do` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss`, `/feed.xml`, `/atom.xml`, `/eng/rss`, `/eng/feed.xml`, `/eng/E0701RSS.do` — all return 404) |
| Source class | central_bank |
| Country | KR |
| Region | E. Asia |
| Tier | T2 |
| Queue priority (Top 20) | 10 — Major economy; English-language publications |
| Critical workflows | Monetary policy decisions, press releases, research papers, statistics |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (news/press release listing via `.do` URLs) |
| Primary URL tested | `https://www.bok.or.kr/eng/main/main.do` (English homepage) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 294,843 bytes |
| Result | **PASS** |

### Probing notes

- `https://www.bok.or.kr/` returns HTTP 200 (478 KB, Korean homepage, redirects to `/portal/main/main.do`)
- `https://www.bok.or.kr/eng/` returns HTTP 200 (295 KB, English homepage, redirects to `:443/eng/main/main.do`)
- `https://www.bok.or.kr/eng/singl/newsDataEng/list.do?menuNo=400067` returns HTTP 200 (255 KB, news/press release listing)
- Sample press release `https://www.bok.or.kr/eng/bbs/B0000354/view.do?nttId=11062710&menuNo=400409&...` returns HTTP 200 (244 KB)
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/eng/rss`, `/eng/feed.xml`, `/eng/E0701RSS.do`)
- `/eng/main/index` returns HTTP 500 (server error — path exists but parameters are missing)
- No `<link rel="alternate" type="application/rss+xml">` tag in HTML head advertising a feed

The site uses a Java-based CMS (`.do` URL pattern, JSESSIONID cookie) with a board system (`/eng/bbs/B0000XXX/view.do?nttId=NNNNNNNN&menuNo=NNNNNN`). Each board (B0000354, B0000333, etc.) contains different content types (monetary policy, working papers, videos, collections).

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the news listing page (`/eng/singl/newsDataEng/list.do?menuNo=...`) and individual board article pages (`/eng/bbs/B0000XXX/view.do?nttId=...`).

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Authoritative publication date field in article HTML — **single source, unambiguous** |
| Article publication date field | `<dd class="date">2026.07.08</dd>` (sampled on `/eng/bbs/B0000354/view.do?nttId=11062710&...` — "Asset Tokenization in Korea and Global Markets: Current Developments and Future Policy Challenges") |
| Update metadata (NOT publication evidence) | None detected — no `modified` or `updated` meta tag found on the sample article |
| Date-source agreement | Single authoritative publication date field; no second publication date source to compare against |
| Result | **PASS** — authoritative publication date field is present and machine-readable |

### Provenance pattern assessment

Bank of Korea provides a single authoritative publication date in the article HTML:

1. **`<dd class="date">2026.07.08</dd>`** — visible publication date in Korean format (YYYY.MM.DD), located in a definition list with `<dt class="sr-only">등록일</dt>` (Korean for "registration date") as the label

The `<dd class="date">` element is the visible publication date field for the document, confirmed by its placement in a `<dl>` definition list with the `등록일` (registration date) label.

**Comparison to known cases:**
- Banca d'Italia (this batch — Gate 2 PASS): single authoritative publication date field (`bdi-titlepagev2-date`)
- Bank of Korea (this batch — Gate 2 PASS): single authoritative publication date field (`<dd class="date">`)
- PBoC (Batch 1 — Gate 2 PASS WITH REVIEW): multiple date sources that conflict (URL timestamp + `createDate` vs. `PubDate`)

**Gate 2 conclusion**: Authoritative publication date field is present and machine-readable. The `<dd class="date">` element with `등록일` (registration date) label is the visible publication date field for the document. No date-source precedence review is required because there is only one publication date source. No `modified` or `updated` meta tag was detected that would require the "update metadata only" classification.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) + PDF attachments |
| Sample URL | `https://www.bok.or.kr/eng/bbs/B0000354/view.do?nttId=11062710&menuNo=400409&relate=Y&depth=400409&programType=newsDataEng` |
| Sample title | "Asset Tokenization in Korea and Global Markets: Current Developments and Future Policy Challenges" |
| Sample size | 244,297 bytes |
| Machine-readable | **YES** — static HTML contains title, publication date (`<dd class="date">`), Open Graph metadata with article summary, and PDF attachment links |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with the full title "Asset Tokenization in Korea and Global Markets: Current Developments and Future Policy Challenges | ..."
- `<meta name="title">`, `<meta name="description">` (303 chars article summary), `<meta name="subject">`, `<meta name="keyword">` — article metadata in static HTML head
- Open Graph metadata (`og:title`, `og:description` with 303 chars article summary, `og:type=article`, `og:url`, `og:image`)
- Twitter Card metadata (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:url`, `twitter:image`)
- `<dd class="date">2026.07.08</dd>` — visible publication date in `<dl>` with `등록일` label
- `<dd class="hits">6829</dd>` — view count metadata
- 3 PDF attachment links (`/fileSrc/eng/.../filename.pdf`) — substantive content is in PDF documents linked from the article
- Static HTML body (no JS-rendered content detected; no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)

The `og:description` meta tag contains a 303-character article summary that provides substantive content for extraction, even though the primary content is delivered as PDF attachments.

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). Bank of Korea's content is fully present in static HTML with article summary in `og:description`.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. The `og:description` meta tag provides article summary; PDF attachments provide full content. No JS rendering required for extraction.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS), Bundesbank (Batch 2 — QUALIFICATION_READY), Banca d'Italia (this batch — QUALIFICATION_READY) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

Bank of Korea's content structure (press releases with titles, visible publication date in `<dd class="date">`, and body text in `og:description` + PDF attachments) matches the `central_bank` class pattern. The provenance pattern (visible publication date in a structured HTML element) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy — the same category as SNB, Bundesbank, and Banca d'Italia.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank` class analogs in SNB, Bundesbank, and Banca d'Italia).

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
| Routing rationale | All Gates 1-4 PASS; authoritative publication date field (`<dd class="date">`) is present and machine-readable; configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable with analogs in SNB, Bundesbank, and Banca d'Italia |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on English homepage | `https://www.bok.or.kr/eng/main/main.do` (probed 2026-08-15) | Gate 1 PASS — English site accessible (295 KB) |
| HTTP 200 on news listing | `https://www.bok.or.kr/eng/singl/newsDataEng/list.do?menuNo=400067` (probed 2026-08-15) | Gate 1 PASS — news listing accessible (255 KB) |
| HTTP 200 on sample press release | `https://www.bok.or.kr/eng/bbs/B0000354/view.do?nttId=11062710&menuNo=400409&...` (probed 2026-08-15) | Gate 3 PASS — static HTML contains article content (244 KB) |
| Authoritative publication date field | `<dd class="date">2026.07.08</dd>` with `<dt class="sr-only">등록일</dt>` label | Gate 2 PASS — visible publication date in structured HTML element |
| Open Graph metadata | `og:title`, `og:description` (303 chars article summary), `og:type=article`, `og:url` | Gate 3 PASS — article metadata present in static HTML head |
| PDF attachments | 3 PDF links in `/fileSrc/eng/...` paths | Gate 3 PASS — substantive content delivered as PDF attachments |
| Pattern category match | SNB (`c09de13`), Bundesbank (Batch 2), Banca d'Italia (this batch) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle Bank of Korea without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one press release was sampled; Bank of Korea has multiple boards — B0000354, B0000333, B0000337, B0000338, B0000364, etc. — that may require different pattern categories or configurations)
- Does NOT resolve whether all boards share the same date format (`<dd class="date">YYYY.MM.DD</dd>`) — only board B0000354 was sampled
- Does NOT prove PDF attachment extraction will work (substantive content is in PDF format; PDF parsing is a separate capability from HTML extraction)
- Does NOT resolve language handling (Korean labels like `등록일` are present alongside English content; pattern category for Korean-language content not assessed)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 10 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. Bank of Korea remains Top 20 rank #10. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. Bank of Korea transitions to QUALIFICATION_READY based on Gates 1-4 all PASS with no unresolved items.

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
2026-08-15 — Pre-screening probe of Bank of Korea (BOK)

Probe 1:  https://www.bok.or.kr/                                → 200 OK (478 KB, Korean homepage, redirects to /portal/main/main.do)
Probe 2:  https://www.bok.or.kr/eng/                            → 200 OK (295 KB, English homepage, redirects to :443/eng/main/main.do)
Probe 3:  https://www.bok.or.kr/eng/main/index                  → 500 (server error — path exists but parameters missing)
Probe 4:  https://www.bok.or.kr/eng/boardPressRelease/list      → 404
Probe 5:  https://www.bok.or.kr/eng/pressRelease/list          → 404
Probe 6:  https://www.bok.or.kr/rss                            → 404
Probe 7:  https://www.bok.or.kr/feed.xml                       → 404
Probe 8:  https://www.bok.or.kr/atom.xml                       → 404
Probe 9:  https://www.bok.or.kr/eng/rss                          → 404
Probe 10: https://www.bok.or.kr/eng/feed.xml                     → 404
Probe 11: https://www.bok.or.kr/eng/E0701RSS.do                 → 404
Probe 12: https://www.bok.or.kr/eng/singl/newsDataEng/list.do?menuNo=400067
                                                                       → 200 OK (255 KB, news listing)
Probe 13: https://www.bok.or.kr/eng/bbs/B0000354/view.do?nttId=11062710&menuNo=400409&relate=Y&depth=400409&programType=newsDataEng
                                                                       → 200 OK (244 KB, sample press release "Asset Tokenization in Korea and Global Markets")

Provenance detected (sample press release):
- Authoritative publication date: <dd class="date">2026.07.08</dd>
  (in <dl> with <dt class="sr-only">등록일</dt> label — Korean for "registration date")
- Open Graph: og:title, og:description (303 chars), og:type=article, og:url
- Twitter Card: twitter:card=summary_large_image, twitter:title, twitter:description
- PDF attachments: 3 PDF links in /fileSrc/eng/... paths

Site architecture:
  Java-based CMS with .do URL pattern, JSESSIONID cookie
  Board system: /eng/bbs/B0000XXX/view.do?nttId=NNNNNNNN&menuNo=NNNNNN
  Multiple boards: B0000354 (monetary policy), B0000333 (Exhibition Online-VR), B0000337 (Theme Video), B0000338 (Main Collections), B0000364 (CBDC), etc.
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; Java-based CMS with `.do` URLs; no RSS feed, but news listing and board articles accessible |
| Gate 2 (Provenance) | PASS | Single authoritative publication date field (`<dd class="date">2026.07.08</dd>`) with `등록일` label; no `modified`/`updated` meta detected |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering; full title + publication date + `og:description` (303 chars) + PDF attachments |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; analogs in SNB, Bundesbank, Banca d'Italia. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | Single publication date source; no conflict possible |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #10 unchanged |
