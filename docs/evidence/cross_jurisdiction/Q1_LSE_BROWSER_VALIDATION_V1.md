# Q1 — LSE BROWSER VALIDATION V1

**Status:** EXECUTED — TRACEABLE EVIDENCE RECORD (evidence-only)
**Date:** 2026-08-15
**Directive:** User directive — "Q1 فقط: LSE Browser Validation. لا نفتح Q2 وQ3 بالتوازي، ولا نبدأ survey جديداً. الاختبار يجب أن يجيب بدقة عن: هل الـJS-shell في LSE يمثل فعلاً Browser Rendering capability gap، أم أن browser rendering يحل المشكلة ويمكن إدخالها ضمن الـCore architecture؟ والاختبار الكامل: `JS shell → Browser rendering → actual content → extraction → provenance`. ثم نُخرج evidence record قابل للتتبع، وليس حكماً استثمارياً."
**Scope discipline:** Q1 ONLY. Q2 and Q3 NOT opened. No new survey. No modification to any other artifact (per user: "لا نحتاج إلى تعديل أي قرار أو وثيقة أخرى"). Frozen artifacts untouched. No investment judgment. No engineering decision. No BUILD NOW. Per-case evidence only.

---

## A. The Question Q1 Must Answer

Does the LSE JavaScript shell represent an actual **Browser Rendering capability gap**, or does browser rendering solve the problem such that LSE content can be acquired within the Core architecture?

## B. Pipeline Under Validation

```
JS shell → Browser rendering → actual content → extraction → provenance
```

The test must pinpoint the exact stage if any stage fails. **No stage failed. All five stages executed and passed. The pipeline completed end-to-end.**

## C. Instrument & Environment

| Item | Value |
|---|---|
| Rendering instrument | Google Chrome **151.0.7922.138** headless (`--headless=new`) — real Chromium engine executing page JavaScript |
| Acquisition modes compared | (0) direct HTTP `curl` with browser UA vs (1) Chromium headless rendering |
| Rendering parameters | `--dump-dom --virtual-time-budget=20000 --window-size=1440,2400/2600` (virtual time budget allows the SPA's asynchronous news-data XHR to complete) |
| Execution window (UTC) | 2026-08-15T21:05Z – 2026-08-15T21:21Z (first successful render marker 21:15:14Z; screenshots 21:19Z; reproducibility run 21:21:03Z) |
| Environment note | In-app browser automation runtime was unavailable in this session (Node-REPL MCP absent). A locally installed Chromium-class headless browser was used as the rendering instrument — the same capability class under test. Microsoft Edge 151.0.4129.78 was present but its headless launcher detaches without output on this host; Chrome produced complete output. |

## D. Stage 0 — Baseline: The JS Shell (non-rendering acquisition)

**Command:**
```bash
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  --max-time 30 -o lse_news_shell.html "https://www.londonstockexchange.com/news"
```

**Observed (2026-08-15, this session):**
- Document size: **54,995 bytes**
- `<script>` elements: **24**
- `<title>`: `London Stock Exchange | London Stock Exchange` (generic)
- Element ids present: only `page-header`
- News content (headlines, dates, links, sources): **ZERO** — none of the 9 items observed in the rendered run exist in this document

This re-confirms the basis of the prior S8 classification (OBSERVED — JS-shell, no server-rendered content).

## E. Stage 1 — Browser Rendering

**Command:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="<tmp>/cq1" --virtual-time-budget=20000 --window-size=1440,2400 \
  --dump-dom "https://www.londonstockexchange.com/news" > lse_rendered.html
```

**Observed:**
| Metric | Run 1 | Run 2 (reproducibility, §J) |
|---|---|---|
| Rendered DOM size | **304,145 bytes** | **300,565 bytes** |
| DOM inflation vs shell (54,995 B) | ×5.5 | ×5.5 |
| Document title (JS-mutated) | `Today's News \| London Stock Exchange` | identical |

- The title mutation (generic shell title → "Today's News") is **proof of JavaScript execution** by the rendering instrument — this title does not exist in the curl shell.
- Rendered DOM carries Angular hydration markers (`_ngcontent-ng-lseg-*` component-scoped attributes) — a fully hydrated Angular SPA.
- A cookie-consent overlay rendered; it did **not** gate the news content (all 9 items and the table are present beneath it).

**Stage 1 verdict: PASSED — the JS shell renders into a full content-bearing document under a real browser engine.**

## F. Stage 2 — Actual Content

**Observed in rendered DOM (Run 1 / Run 2):**
- **9 unique news-article links** (identical set in both runs), each of form `news-article/{TICKER}/{slug}/{numeric-id}`:
  1. `news-article/AV./aviva-plc-half-year-results-announcement-2026/17738541`
  2. `news-article/GBG/americas-identity-trading-update/17738535`
  3. `news-article/CHRT/contract-win/17738499`
  4. `news-article/TXP/second-quarter-2026-results-and-operational-update/17738540`
  5. `news-article/KLSO/statement-re-theworks-co-uk-plc/17738536`
  6. `news-article/DEC/diversified-energy-response-to-media-speculation/17738582`
  7. `news-article/BEM/infill-drilling-programme-completed-at-kallak/17738510`
  8. `news-article/ATN/cln-conversion/17738493`
  9. `news-article/CAML/availability-of-the-scheme-booklet-and-circular/17738567`
- **10 rendered date stamps** "14 August 2026"
- Page sections rendered: "Today's most read article" (promoted item with live price context) + "Most popular articles today" (structured table with columns **Headline | Source | Date | Time**)

**Stage 2 verdict: PASSED — actual, current, dated content exists after rendering.**

## G. Stage 3 — Extraction (structured, from the rendered DOM)

**Extraction command (worked example):**
```bash
perl -0777 -ne 'while (m{<tr[^>]*>(.*?)</tr>}gs) { my $r=$1; next unless $r=~m/news-article/;
  my @t=($r=~m{>([^<>]{2,90})<}g); my @c=grep{/\S/}@t; print join(" | ",@c[0..5]),"\n"; }' lse_rendered.html
```

**Extracted table (9/9 rows, zero failures):**

| # | Headline | Source | Date | Time |
|---|---|---|---|---|
| 1 | Aviva plc Half Year Results Announcement 2026 | RNS | 14 August 2026 | 07:00:02 |
| 2 | Americas Identity trading update | RNS | 14 August 2026 | 07:00:02 |
| 3 | Contract Win | RNS | 14 August 2026 | 07:00:02 |
| 4 | SECOND QUARTER 2026 RESULTS AND OPERATIONAL UPDATE | RNS | 14 August 2026 | 07:00:03 |
| 5 | Statement re: TheWorks.co.uk plc | RNS | 14 August 2026 | 07:00:02 |
| 6 | Diversified Energy Response to Media Speculation | **GNW** | 14 August 2026 | 07:00:00 |
| 7 | Infill drilling programme completed at Kallak | RNS | 14 August 2026 | 07:00:02 |
| 8 | CLN Conversion | RNS | 14 August 2026 | 07:00:02 |
| 9 | Availability of the Scheme Booklet and Circular | RNS | 14 August 2026 | 07:00:03 |

**Extraction-relevant observations:**
- Time resolution is to the **second** (`07:00:02`, `07:00:00`, `07:00:03`) — release timestamps, not date-only.
- Two rendered date formats co-exist: full `14 August 2026` and compact `14.08.26` (table column) — both extracted from rendered text.
- **Source differentiation is per-item and machine-visible**: 17× `RNS` and 2× `GNW` (GlobeNewswire) source labels rendered on the page; the DEC item is GNW-sourced, all others RNS-sourced.
- Stable CSS-class contract in the rendered DOM (extraction anchors): `.news-title`, `.news-data`, `.grey-medium-text` (date), `.news-date-time` (time), `.rns-source` / `.source-label` (source), `.td-column` (table cells).
- Item block structure (verbatim, cleaned of Angular scope attributes):
```html
<div class="flex news-wrapper flex-filler">
  <div class="rns-source"><span class="source-label small-font-size bold-font-weight">RNS</span></div>
  <a class="bigger-font-size bold-font-weight news-title"
     href="news-article/AV./aviva-plc-half-year-results-announcement-2026/17738541">
    Aviva plc Half Year Results Announcement 2026 </a>
  <div class="news-data">
    <div class="grey-medium-text">14 August 2026</div>
    <div class="grey-medium-text news-date-time">07:00:02</div>
  </div>
  <a class="news-button regular-font-size gold-button bold-font-weight"
     href="news-article/AV./aviva-plc-half-year-results-announcement-2026/17738541">Read article</a>
</div>
```

**Stage 3 verdict: PASSED — titles, sources, dates, times, and links extract cleanly from the rendered DOM.**

## H. Stage 4 — Provenance (article detail page)

**Command:**
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ... --virtual-time-budget=20000 \
  --dump-dom "https://www.londonstockexchange.com/news-article/AV./aviva-plc-half-year-results-announcement-2026/17738541"
```

**Observed (rendered detail document, 262,762 bytes):**
- **JS-set document title carries the full provenance tuple:**
  `Aviva plc Half Year Results Announcement 2026 - 07:00:02 14 Aug 2026 - AV. News article | London Stock Exchange`
  (headline + release time + release date + ticker)
- Rendered provenance elements:
  - `<span class="roundel rns-regulatory-roundel">` — the **Regulatory** badge (RNS roundel)
  - `news-label rns-source` → `RNS` (the official Regulatory News Service as distribution source)
  - `news-headline` classification: **"Half-year/Interim Report"** (RNS message category)
  - Release element: **"Released 07:00:02"**
  - Byline: **"Aviva PLC (AV.) 14 August 2026, 07:00"**
- The **full article body renders** (text begins "Aviva plc … half year results announcement for the six months ended 30 June 2026…"), i.e., the detail page is itself a rendered document, not a shell.
- **LIST ↔ DETAIL provenance match:** the date and time on the list row (`14 August 2026`, `07:00:02`) equal the date and time on the detail page — cross-page consistency verified.

**Stage 4 verdict: PASSED — release date, time-to-the-second, source, regulatory classification, and ticker are present and mutually consistent across list and detail pages.**

## I. Visual Evidence

| Artifact | Bytes | Capture time (UTC) | Verified content |
|---|---|---|---|
| `lse_news_shot.png` (news list) | 466,712 | 2026-08-15T21:19Z | Rendered page: "Today's most read article" block (AV. price 726.60, +1.82%, RNS, date, time) + "Most popular articles today" table with Headline/Source/Date/Time columns, 9 rows, RNS+GNW labels visible; cookie overlay not gating content |
| `lse_article_shot.png` (article detail) | 237,385 | 2026-08-15T21:19Z | Grey RNS "Regulatory" ribbon, RNS label, "Half-year/Interim Report" classification, byline "Aviva PLC (AV.) 14 August 2026, 07:00", full article body text, related-news rail with dated items |

Capture commands are the Stage 1/Stage 4 commands with `--screenshot=<path>` replacing `--dump-dom`. Files retained in session temp storage (not committed); byte counts and capture commands recorded here for reproduction.

## J. Reproducibility

Second independent render run (fresh profile, minutes after Run 1):

| Check | Run 1 | Run 2 |
|---|---|---|
| Unique news-article links | 9 | 9 |
| Link set | — | **IDENTICAL to Run 1** (`diff` of sorted link sets: empty) |
| Date stamps "14 August 2026" | 10 | 10 |
| JS-mutated title | equal | equal |

## K. Pipeline Stage Verdict Table

| # | Stage | Verdict | Evidence anchor |
|---|---|---|---|
| 0 | JS shell (non-rendering acquisition) | PRESENT — content-inaccessible without rendering | curl: 54,995 B, 24 scripts, 0 news items |
| 1 | Browser rendering | **PASSED** | 304,145 / 300,565 B rendered DOM; JS-mutated title |
| 2 | Actual content | **PASSED** | 9 current items, 10 date stamps |
| 3 | Extraction | **PASSED** | 9/9 rows: headline, source, date, time-to-second, link |
| 4 | Provenance | **PASSED** | JS-set title with date+time+ticker; RNS roundel; classification; LIST↔DETAIL match |

**Pipeline failure point: NONE. The pipeline executed end-to-end without failure at any stage.**

## L. Answer to the Q1 Question (evidence statement only — NOT an investment judgment)

On the evidence of this run: the LSE JS shell is not an unbreakable barrier — under a real Chromium rendering engine, the shell hydrates and yields current, dated, source-labelled, extractable content with second-resolution provenance that is consistent between list and detail pages. The content-access barrier observed in the shell state was resolved by rendering in this test window; no anti-bot block was encountered (contrast: S6 DMO remains INCONCLUSIVE under its ShieldSquare block).

**Evidence-state impact (per-case, this case only, no universe inference, no prevalence):**
- S8 LSE · Browser Rendering/Adapter: OBSERVED → **VALIDATED** (browser-rendered acquisition yields extractable, dated, source-labelled content)
- Per-case side-observations recorded (no state change asserted beyond S8 rendering): rendered provenance timestamps at second resolution (Provenance); resolvable relative content paths `news-article/{TICKER}/{slug}/{id}` (Content-Path); stable CSS-class + table structure as extraction anchors (Pattern Specificity)

Per the directive, this record makes **no investment decision, no engineering decision, and no change to any capability's decision status**. Q2 is now unlocked per the user's gate ("إذا نجح Q1، ننتقل إلى Q2").

## M. Limitations

1. Two runs in one session, minutes apart; the live feed evolves — link-set identity was observed across the two runs in this window only.
2. Dates/times are rendered human-readable text (`14 August 2026`, `07:00:02`), not machine attributes — extraction targets rendered DOM text (extraction succeeded in this run).
3. Scope = `/news` landing page + 1 article detail page. Deeper surfaces (news-explorer tab, pagination, filters) were not in Q1 scope.
4. Single locale (en-GB date formats), single desktop viewport (1440px), headless desktop profile.
5. Visual artifacts held in session temp storage, not committed to the repository (byte counts, capture times, and full capture commands recorded in §§I, N).
6. The rendering instrument was a locally installed Chrome headless rather than the session's in-app browser runtime (unavailable this session) — same Chromium capability class; instrument identity recorded for traceability.

## N. Reproduction Command Set (complete)

```bash
# Stage 0 — shell baseline
curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  --max-time 30 -o lse_news_shell.html "https://www.londonstockexchange.com/news"
wc -c lse_news_shell.html                                   # 54995
grep -c "<script" lse_news_shell.html                       # 24
grep -o "<title>[^<]*</title>" lse_news_shell.html          # generic title

# Stage 1/2 — rendering + content
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="<tmp>/cq1" --virtual-time-budget=20000 --window-size=1440,2400 \
  --dump-dom "https://www.londonstockexchange.com/news" > lse_rendered.html
wc -c lse_rendered.html                                     # 304145 (run 2: 300565)
grep -o "<title>[^<]*</title>" lse_rendered.html            # Today's News | London Stock Exchange
grep -oE 'href="news-article/[^"]*"' lse_rendered.html | sort -u | wc -l    # 9
grep -c "14 August 2026" lse_rendered.html                  # 10

# Stage 3 — extraction
grep -oE 'href="news-article/[^"]*"' lse_rendered.html | sort -u
perl -0777 -ne 'while (m{<tr[^>]*>(.*?)</tr>}gs) { my $r=$1; next unless $r=~m/news-article/;
  my @t=($r=~m{>([^<>]{2,90})<}g); my @c=grep{/\S/}@t; print join(" | ",@c[0..5]),"\n"; }' lse_rendered.html
perl -0777 -ne 'while (m{class="source-label[^"]*"[^>]*>\s*([A-Z]{2,6})\s*<}gs) { print "$1\n"; }' lse_rendered.html | sort | uniq -c
# 17 RNS / 2 GNW

# Stage 4 — provenance (detail)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-first-run \
  --user-data-dir="<tmp>/cq2" --virtual-time-budget=20000 --window-size=1440,2600 \
  --dump-dom "https://www.londonstockexchange.com/news-article/AV./aviva-plc-half-year-results-announcement-2026/17738541" > lse_article.html
grep -o "<title>[^<]*</title>" lse_article.html
grep -oE '[0-9]{1,2} [A-Z][a-z]+ 202[56]' lse_article.html | sort | uniq -c
grep -oE 'class="[^"]*(rns-regulatory-roundel|rns-source|news-company-rns-date)[^"]*"' lse_article.html | sort -u

# Stage I — visual evidence
# (same commands with --screenshot="<tmp>/lse_news_shot.png" / --screenshot="<tmp>/lse_article_shot.png" instead of --dump-dom)
```

---

**Record complete. Q1 closed as a traceable evidence record. No other artifact modified. Frozen artifacts untouched. Q2 remains unopened pending user gate.**
