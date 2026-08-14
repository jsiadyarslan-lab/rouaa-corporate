# Global Qualification Queue v1.1

**Date**: 2026-08-15 (V1.1 — state transitions applied)
**Original date**: 2026-08-13 (V1 — FROZEN)
**Branch**: `top20-prescreening`
**Status**: V1.1 — Operational (state transitions applied from Top 20 pre-screening)
**Historical baseline**: Queue v1 FROZEN at `92b6c4f` — preserved as historical reference; NOT modified by this version
**Pre-screening evidence**: Top 20 Pre-Screening complete at `4443553` — all 20 SQR records produced
**Source baseline**: Global Source Universe v1 (`8b1e7b4` — Data Integrity CLEARED)
**Linked models**: Global Source Expansion Model v1 (`93de30c`), Source Qualification Report Template v1 (`f5caf57`)
**Type**: Internal execution queue — documentation only. No onboarding, no probing, no config, no pipeline changes.

### Version history

| Version | Date | Commit | Status | Key change |
|---------|------|--------|--------|------------|
| V1 | 2026-08-13 | `92b6c4f` | FROZEN — Queue baseline for Top 20 pre-screening | Initial queue with 79 unique records (12 ALREADY_QUALIFIED + 10 SCREENING_ONLY + 56 DISCOVERY_ONLY + 1 KNOWN_BLOCKED) |
| V1.1 | 2026-08-15 | (this commit) | Operational — state transitions applied | 20 state transitions from Top 20 pre-screening: 14 → QUALIFICATION_READY (new state), 3 → SCREENING_ONLY, 3 → KNOWN_BLOCKED. New QUALIFICATION_READY state introduced. DISCOVERY_ONLY reduced from 56 to 36. |

### What V1.1 changes

V1.1 applies the results of the Top 20 pre-screening (`4443553`) as queue state transitions. The V1 FROZEN baseline at `92b6c4f` is preserved as historical reference and is NOT modified. V1.1 introduces the `QUALIFICATION_READY` state — a new state for sources that passed Gates 1-4 during pre-screening and are candidates for Gate 5 (first-attempt validation).

**Transition summary:**

```text
DISCOVERY_ONLY → QUALIFICATION_READY:  14 sources  (passed Gates 1-4 in pre-screening)
DISCOVERY_ONLY → SCREENING_ONLY:        3 sources  (Banco de España, BCB, Bank of Mexico)
DISCOVERY_ONLY → KNOWN_BLOCKED:         3 sources  (BLS, Banque de France, DNB — all Akamai 403)
TOTAL transitions:                    20 sources
```

**Note on qualifiers**: 3 of the 14 QUALIFICATION_READY sources carry routing qualifiers from pre-screening:
- PBoC: PROVENANCE DATE PRECEDENCE REVIEW (Gate 2 — URL timestamp vs. PubDate conflict)
- BaFin: PROVENANCE DATE PRECEDENCE REVIEW (Gate 2 — RSS pubDate vs. article HTML date on different articles)
- SFC Hong Kong: CONTENT-SCOPE QUALIFIER (high-shareholding announcements only; broader SFC news coverage unverified/JS-rendered)

---

## 1. Purpose

Convert the 178-record Global Source Universe into an ordered qualification execution queue. This is a planning artifact only; it does not authorize onboarding.

---

## 2. Reconciliation with Inventory

```text
Global Source Universe v1 total:  178
T1 + T2 inventory rows:           82
  T1 (Strategic Core):             19
  T2 (High-Value Expansion):       63
  TOTAL inventory rows:            82

T3 + T4 (not in this queue):       96
  (excluded — specialized/long-tail, not priority for qualification)
```

### Duplicate reconciliation (82 rows → 79 unique records)

Three institutions appear as duplicate rows in the T1/T2 inventory (different name spellings or duplicated across Part B sub-sections). These are reconciled to single records in the queue:

| Institution | Inventory rows | Tier | Reconciliation |
|-------------|---------------|------|----------------|
| World Bank Group | B6 #14 + B7 #3 | T1 | Counted once in queue (SCREENING_ONLY — access path unresolved, not confirmed as source-level block) |
| BaFin | B2 #6 + B2 #35 (full name "Federal Financial Supervisory Authority (BaFin)") | T2 | Counted once in queue (DISCOVERY_ONLY) |
| Central Bank of Brazil / Banco Central do Brasil | B1 #15 (EN) + B1 #33 (PT) | T2 | Counted once in queue (DISCOVERY_ONLY) |

```text
82 inventory rows
− 3 duplicate rows (World Bank Group, BaFin, Central Bank of Brazil)
= 79 unique T1/T2 queue records
```

These duplicates are inventory V2 issues — they are documented here for transparency but are NOT corrected in the Universe v1 baseline (`8b1e7b4`).

---

## 3. Queue-State Counts (V1.1 — after Top 20 pre-screening transitions)

```text
T1/T2 inventory rows (before duplicate reconciliation):    82
Less 3 duplicate rows (reconciled in Section 2):           −3
Unique T1/T2 queue records:                                79

Queue state breakdown (V1.1):
  ALREADY_QUALIFIED (reference/completed — not executable):  12
  QUALIFICATION_READY (executable — passed Gates 1-4):       14  [NEW state in V1.1]
  SCREENING_ONLY (executable — prior Gate 1-4 evidence):    13
  DISCOVERY_ONLY (executable — no technical screening):    36
  KNOWN_BLOCKED (executable — confirmed source-level block):  4
  TOTAL unique records:                                      79   (= 12 + 14 + 13 + 36 + 4)
```

### State transitions applied in V1.1

The Top 20 pre-screening (`4443553`) produced 20 state transitions from DISCOVERY_ONLY:

| Transition | Count | Sources |
|------------|-------|--------|
| DISCOVERY_ONLY → QUALIFICATION_READY | 14 | PBoC, US Treasury, Bundesbank, Banca d'Italia, Danmarks Nationalbank, Bank of Korea, RBI, SARB, MAS Singapore, SFC Hong Kong, JFSA Japan, BaFin, AMF France, ASIC Australia |
| DISCOVERY_ONLY → SCREENING_ONLY | 3 | Banco de España (TCP timeout), BCB (Angular SPA — JS-rendered), Bank of Mexico (legacy subdomain 403) |
| DISCOVERY_ONLY → KNOWN_BLOCKED | 3 | BLS (Akamai 403), Banque de France (Akamai 403), DNB (Akamai 403) |
| **TOTAL transitions** | **20** | All from Top 20 DISCOVERY_ONLY |

### Queue structure (V1.1)

The queue separates completed work from executable work:

**Completed (reference set — not in execution queue):**
- ALREADY_QUALIFIED (12 sources) — these have existing qualification evidence (see evidence_maturity column in Section 6 for the distinction between DEVELOPMENT_VERIFIED, VALIDATION_VERIFIED, and PROSPECTIVE_VALIDATED). They require no qualification work and are listed for completeness only.

**Executable qualification queue:**
- QUALIFICATION_READY (14 sources) — passed Gates 1-4 during pre-screening; candidates for Gate 5 (first-attempt validation). 3 sources carry routing qualifiers (provenance review or content-scope).
- SCREENING_ONLY (13 sources) — have prior Gate 1-4 evidence; sub-categories: known gate failures (5), partial screening evidence (3), unresolved access paths (4), JS-rendered content (1)
- DISCOVERY_ONLY (36 sources) — no technical screening performed; feed URLs unknown
- KNOWN_BLOCKED (4 sources) — confirmed source-level access block (HTTP 403 from origin server or Akamai); not actionable until resolved

### V1 → V1.1 count changes

```text
State              V1 (92b6c4f)    V1.1 (this commit)    Change
ALREADY_QUALIFIED        12               12                 — (unchanged)
QUALIFICATION_READY       —                14                 +14 (NEW state)
SCREENING_ONLY            10               13                 +3 (Banco de España, BCB, Bank of Mexico)
DISCOVERY_ONLY           56               36                 −20 (14 READY + 3 SCREENING + 3 BLOCKED)
KNOWN_BLOCKED              1                4                 +3 (BLS, Banque de France, DNB)
TOTAL                     79               79                 — (unchanged)
```

### KNOWN_BLOCKED reconciliation (1 source — confirmed source-level block)

The inventory's Part B status for OECD is `DISCOVERED`, but prior Phase B screening documented a confirmed HTTP 403 from the origin server. HTTP 403 is an authoritative server-level denial of access — this constitutes confirmed source-level blocking, not merely a path failure.

| Source | Part B status | Part F / probing status | Queue status | Rationale |
|--------|-------------|------------------------|-------------|-----------|
| OECD | DISCOVERED | BLOCKED (Gate 1 FAIL — HTTP 403 from origin server) | KNOWN_BLOCKED | HTTP 403 is a confirmed source-level denial, not a path failure |

### Reclassification: World Bank Group and Statistics Canada (moved to SCREENING_ONLY)

In an earlier version of this queue, World Bank Group and Statistics Canada were classified as `KNOWN_BLOCKED`. Upon semantic review, this classification overclaimed what the evidence supports:

| Source | Prior classification | Evidence actually shows | Reclassified to | Rationale |
|--------|----------------------|--------------------------|------------------|-----------|
| World Bank Group | KNOWN_BLOCKED | 404 on probed feed paths | SCREENING_ONLY | 404 on specific paths does not prove source-level block; alternative paths or feed locations may exist |
| Statistics Canada | KNOWN_BLOCKED | Access timeout | SCREENING_ONLY | Timeout is inconclusive; could be transient network latency, slow server, or path issue — does not confirm source-level block |

**Principle applied**: A failed or unknown access path does not equal a confirmed source-level block. The queue does not generalize a single path failure to a judgment about the institution as a whole. Only OECD remains in KNOWN_BLOCKED because HTTP 403 is an authoritative server-level response, not a path-level observation.

---

## 4. Queue Ordering Principles

Sources are ordered by:

1. **Tier** (T1 before T2)
2. **Readiness state** (ALREADY_QUALIFIED → SCREENING_ONLY → DISCOVERY_ONLY → KNOWN_BLOCKED)
3. **Institutional importance** (central banks and systemic regulators before others)
4. **Coverage gap value** (sources that fill geographic or class gaps ranked higher)
5. **Geographic diversification** (sources from underrepresented regions ranked higher)
6. **Customer demand** (if known)
7. **Reusability / strategic engineering value**
8. **Deterministic tiebreaker** (institution name alphabetical)

No numeric weights are assigned. Ordering is qualitative + deterministic.

---

## 5. Critical Distinctions

| Dimension | Meaning | Independent? |
|-----------|---------|-------------|
| Qualification priority | How important is it to qualify this source? | Yes — drives queue order |
| Qualification readiness | Do we have enough info to attempt Gates 1-4? | Yes — drives whether source is READY or DISCOVERY_ONLY |
| Technical difficulty | How hard will qualification be? | Unknown for most — not assessed until screening |

A high-priority source may still be `DISCOVERY_ONLY` (e.g., PBoC is T1 but untested).
A low-priority source may be `ALREADY_QUALIFIED` (e.g., BOC is T1 but development-verified).

---

## 6. ALREADY_QUALIFIED (12 sources)

These sources have existing qualification evidence. Evidence maturity is reported per source via the `evidence_maturity` column below — the maturity levels distinguish development-stage evidence from independent validation and prospective confirmation. They are in the queue for completeness but do not require qualification work.

**Evidence maturity levels:**
- `DEVELOPMENT_VERIFIED` — qualified through development evidence (Phase A/B pipeline baseline); evidence is not independent of pipeline development
- `VALIDATION_VERIFIED` — independently validated (first-attempt qualification PASS using the frozen pipeline + configurable extractor, with no source-specific code changes)
- `PROSPECTIVE_VALIDATED` — prospective confirmation (qualified against a candidate source outside the development-verified set)

Note: Only `VALIDATION_VERIFIED` and `PROSPECTIVE_VALIDATED` constitute first-attempt validation in the strict sense established by the SNB Independent Review (`332788c`) and CFTC prospective validation (`b4fabe9`). `DEVELOPMENT_VERIFIED` sources are qualified but their evidence was produced as part of pipeline development, not as an independent first-attempt run.

| # | Institution | Country | Tier | Evidence maturity | Evidence commit |
|---|------------|---------|------|-------------------|----------------|
| 1 | European Central Bank | EU | T1 | DEVELOPMENT_VERIFIED | `de64f31` |
| 2 | US Federal Reserve System | US | T1 | DEVELOPMENT_VERIFIED | `de64f31` |
| 3 | Bank of England | UK | T1 | DEVELOPMENT_VERIFIED | `de64f31` |
| 4 | Bank of Canada | CA | T1 | DEVELOPMENT_VERIFIED | `de64f31` |
| 5 | Bank of Japan | JP | T1 | DEVELOPMENT_VERIFIED | `146aa3b` |
| 6 | US SEC | US | T1 | DEVELOPMENT_VERIFIED | `146aa3b` |
| 7 | UK FCA | UK | T1 | DEVELOPMENT_VERIFIED | `146aa3b` |
| 8 | Bank for International Settlements | INT | T1 | DEVELOPMENT_VERIFIED | `146aa3b` |
| 9 | US Treasury / OFAC | US | T1 | DEVELOPMENT_VERIFIED | `146aa3b` |
| 10 | US Bureau of Economic Analysis | US | T1 | VALIDATION_VERIFIED | `c8af140` |
| 11 | Swiss National Bank | CH | T1 | VALIDATION_VERIFIED | `c09de13` |
| 12 | US CFTC | US | T1 | PROSPECTIVE_VALIDATED | `b4fabe9` |

**Note**: 9 of 12 are DEVELOPMENT_VERIFIED — their evidence is not independent of pipeline development. Only 3 (BEA, SNB, CFTC) have independent validation or prospective evidence.

---

## 7. SCREENING_ONLY (13 sources)

These sources have prior Gate 1-4 screening evidence. The section is organized into four sub-categories reflecting the strength and nature of the evidence:

1. **Known gate failures** (5) — Gate 1-4 testing was performed and a specific gate failed; root-cause review needed before re-screening
2. **Partial screening evidence** (3) — probed during source-selection activities; feed URL and some characteristics observed, but full Gate 1-4 not completed
3. **Unresolved access paths** (4) — probed but evidence is inconclusive (timeout, 404 on specific paths, or legacy subdomain 403); does not confirm source-level block
4. **JS-rendered content** (1) — Gate 1 PASS (source accessible) but Gate 3 FAIL (static HTML is empty SPA shell; content requires JavaScript execution)

### Sources with known gate failures (5)

| # | Institution | Country | Tier | Gate failed | Evidence | Notes |
|---|------------|---------|------|------------|---------|-------|
| 1 | ESMA | EU | T1 | Gate 2 | `27294db` | No pubDate/dc:date in RSS; dates in content text |
| 2 | IMF | INT | T1 | Gate 1 | `b4fabe9` | Akamai 403 — access blocked |
| 3 | Reserve Bank of Australia | AU | T2 | Gate 1 | Phase B | Akamai 403 — access blocked |
| 4 | Reserve Bank of New Zealand | NZ | T2 | Gate 1 (partial) | Phase B | RSS open, content URLs 403 |
| 5 | UK ONS | UK | T2 | Gate 3 | Phase B | JS-rendered — static HTML empty |

### Sources with partial screening evidence (3)

These sources were probed during source-selection activities (Gate 2/3 challenge searches). Their feed URLs and some Gate 1-4 characteristics were observed, but full qualification was not attempted.

| # | Institution | Country | Tier | Screening evidence | Screening source | Notes |
|---|------------|---------|------|---------------------|-----------------|-------|
| 6 | Sveriges Riksbank | SE | T2 | RSS with pubDate confirmed | Phase 2A probing | Probed but not configured; RSS feed found at `https://www.riksbank.se/en-gb/rss/press-releases/` |
| 7 | FINMA | CH | T2 | RSS confirmed | Phase 2A probing | Feed URL found at `https://www.finma.ch/en/rss/news`; pubDate confirmed |
| 8 | Norges Bank | NO | T2 | Probed — RSS path not found | Phase 2A probing | Institution confirmed; RSS feed URL not discovered; needs further Gate 1 screening |

### Sources with unresolved access paths (4)

These sources were probed but the evidence is inconclusive — it proves that specific paths or requests did not yield a usable feed, but does NOT confirm that the source itself is blocked. They are classified as `SCREENING_ONLY` (not `KNOWN_BLOCKED`) because the most conservative queue state supported by the evidence is "has prior Gate 1-4 evidence; needs further screening" — not "confirmed source-level block".

| # | Institution | Country | Tier | Screening evidence | Screening source | Notes |
|---|------------|---------|------|---------------------|-----------------|-------|
| 9 | Statistics Canada | CA | T2 | Access timeout | Phase B screening (Part F: DEFERRED) | Timeout observed during probing; does not confirm source-level block (could be transient latency, slow server, or path issue); alternative paths and retry strategies not yet tested |
| 10 | World Bank Group | INT | T1 | 404 on probed feed paths | Phase 2A screening | 404 returned for the specific feed paths probed; alternative feed locations, page-embedded feed discovery, and HTML scraping paths not yet attempted; does not confirm source-level block |
| 11 | Banco de España | ES | T2 | TCP connection timeout across all paths (HTTP + HTTPS) | Top 20 pre-screening (`4443553`) | DNS resolves to `77.73.203.21` but TCP connection cannot be established on port 443 or 80; timeout at TCP connection phase; does not confirm source-level block |
| 12 | Bank of Mexico | MX | T2 | Legacy subdomain HTTP 403 (path-level) | Top 20 pre-screening (`4443553`) | Main domain `www.banxico.org.mx` accessible (HTTP 200) but press release paths redirect to legacy subdomain `anterior.banxico.org.mx` which returns HTTP 403; path-level denial, not source-level block |

### Sources with JS-rendered content (1)

This source was probed during Top 20 pre-screening. Gate 1 PASS (source accessible at HTTP 200) but Gate 3 FAIL (static HTML is an empty Angular SPA shell; content requires JavaScript execution). Classified as `SCREENING_ONLY` because the blocker is content rendering method, not source-level access — matches UK ONS precedent.

| # | Institution | Country | Tier | Screening evidence | Screening source | Notes |
|---|------------|---------|------|---------------------|-----------------|-------|
| 13 | Banco Central do Brasil (BCB) | BR | T2 | Gate 1 PASS / Gate 3 FAIL (Angular SPA) | Top 20 pre-screening (`4443553`) | All paths return identical 2,871-byte Angular SPA shell; `<app-root></app-root>` empty; content requires JavaScript execution; Olinda public data API accessible but does not contain press releases |

**Reclassification note**: In an earlier version of this queue, Statistics Canada and World Bank Group were classified as `KNOWN_BLOCKED`. They were moved to `SCREENING_ONLY` because the evidence only proves a path-level failure, not a source-level block. Banco de España (TCP timeout), Bank of Mexico (legacy subdomain 403), and BCB (JS-rendered content) were added to SCREENING_ONLY in V1.1 based on Top 20 pre-screening evidence (`4443553`).

---

## 8. DISCOVERY_ONLY — Top 20 Qualification Candidates (HISTORICAL — V1)

> **Note**: This section documents the Top 20 DISCOVERY_ONLY candidates as they existed in Queue V1 (`92b6c4f`). All 20 have since been pre-screened and transitioned to new states in V1.1. See Section 7.5 (QUALIFICATION_READY), Section 7 (SCREENING_ONLY additions), and Section 10 (KNOWN_BLOCKED additions) for the V1.1 state of these sources.

These are the 20 highest-priority sources whose current queue state was `DISCOVERY_ONLY` in V1. They have NOT been probed, screened, or configured at that point. No access, provenance, or content feasibility had been verified. They were ordered by the queue ordering principles (Section 4): Tier first, then institutional importance (central banks before regulators), then coverage gap value, then geographic diversification. No numeric weights were assigned.

Sources classified as `SCREENING_ONLY`, `KNOWN_BLOCKED`, or `ALREADY_QUALIFIED` are explicitly excluded from this Top 20 — they appear in their respective sections (6, 7, 10).

| # | Institution | Country | Tier | Class | Region | Why next |
|---|------------|---------|------|-------|--------|----------|
| 1 | People's Bank of China | CN | T1 | Central Bank | E. Asia | Systemically important; largest economy without coverage |
| 2 | US Bureau of Labor Statistics | US | T1 | Statistical | N. America | T1 source; high institutional importance; qualification not yet performed |
| 3 | US Treasury | US | T1 | Ministry of Finance | N. America | Fiscal policy; high institutional importance; qualification not yet performed |
| 4 | Bundesbank | DE | T2 | Central Bank | Europe | Major EU economy; ECB system member |
| 5 | Banque de France | FR | T2 | Central Bank | Europe | Major EU economy; ECB system member |
| 6 | Banca d'Italia | IT | T2 | Central Bank | Europe | Major EU economy; ECB system member |
| 7 | Banco de España | ES | T2 | Central Bank | Europe | Major EU economy; ECB system member |
| 8 | De Nederlandsche Bank | NL | T2 | Central Bank | Europe | ECB system member |
| 9 | Danmarks Nationalbank | DK | T2 | Central Bank | Europe | EU/EEA central bank; systemic European importance |
| 10 | Bank of Korea | KR | T2 | Central Bank | E. Asia | Major economy; English-language publications |
| 11 | Reserve Bank of India | IN | T2 | Central Bank | S. Asia | Major economy; fills South Asia gap |
| 12 | Banco Central do Brasil | BR | T2 | Central Bank | LATAM | Largest LATAM economy; fills Latin America gap |
| 13 | Bank of Mexico | MX | T2 | Central Bank | LATAM | Major LATAM economy; USMCA partner; fills Latin America gap |
| 14 | South African Reserve Bank | ZA | T2 | Central Bank | Africa | Largest African economy; fills Africa gap (largest regional gap per Section 12) |
| 15 | MAS (Singapore) | SG | T2 | Central Bank/Regulator | SE Asia | Major APAC financial hub; dual function |
| 16 | SFC (Hong Kong) | HK | T2 | Financial Regulator | E. Asia | Major APAC financial hub |
| 17 | JFSA (Japan) | JP | T2 | Financial Regulator | E. Asia | Major economy regulator |
| 18 | BaFin | DE | T2 | Financial Regulator | Europe | Major EU regulator |
| 19 | AMF (France) | FR | T2 | Financial Regulator | Europe | Major EU regulator |
| 20 | ASIC (Australia) | AU | T2 | Financial Regulator | Oceania | Major APAC regulator |

**Sources NOT in this Top 20 (and why):**
- World Bank Group — moved to SCREENING_ONLY (Section 7); probed feed paths returned 404, but path-level failure does not confirm source-level block
- Sveriges Riksbank — moved to SCREENING_ONLY (Section 7); RSS feed confirmed in prior probing
- FINMA — moved to SCREENING_ONLY (Section 7); RSS feed confirmed in prior probing
- Norges Bank — moved to SCREENING_ONLY (Section 7); probed in Phase 2A (RSS path not found but institution confirmed)
- Statistics Canada — moved to SCREENING_ONLY (Section 7); access timeout observed but does not confirm source-level block
- OECD — KNOWN_BLOCKED (Section 10); HTTP 403 from origin server is confirmed source-level block
- IMF — SCREENING_ONLY (Gate 1 Akamai 403)
- ESMA — SCREENING_ONLY (Gate 2 fail — no pubDate)

---

## 8.5. QUALIFICATION_READY (14 sources) — NEW in V1.1

These sources passed Gates 1-4 during Top 20 pre-screening (`4443553`). They are candidates for Gate 5 (first-attempt validation). Pre-screening did NOT attempt Gate 5 — no configuration was created, no pipeline run was attempted. QUALIFICATION_READY means "passed pre-screening Gates 1-4"; it does NOT mean "qualified" or "onboarded."

**Important**: QUALIFICATION_READY is NOT a success rate. It means the source is ready for Gate 5 testing. Gate 5 may PASS or FAIL. The purpose of pre-screening was to identify candidates, not to predict Gate 5 outcomes.

### QUALIFICATION_READY without qualifier (11 sources)

| # | Institution | Country | Tier | Class | Pre-screening result | SQR record |
|---|------------|---------|------|-------|----------------------|------------|
| 1 | US Treasury | US | T1 | Ministry of Finance | Gates 1-4 PASS; Drupal field + listing `<time>` + `og:updated_time` (all publication dates agree) | `SQR_US_TREASURY_PRESCREENING.md` |
| 2 | Bundesbank | DE | T2 | Central Bank | Gates 1-4 PASS; 5 RSS feeds; RSS `<pubDate>` + `<dc:date>` + article HTML date (all agree) | `SQR_BUNDESBANK_PRESCREENING.md` |
| 3 | Banca d'Italia | IT | T2 | Central Bank | Gates 1-4 PASS; single authoritative publication date field (`bdi-titlepagev2-date`); `modified` meta classified as update metadata only | `SQR_BANCA_D_ITALIA_PRESCREENING.md` |
| 4 | Danmarks Nationalbank | DK | T2 | Central Bank | Gates 1-4 PASS; `article:published_time` meta + `<time>` element (both agree) | `SQR_DANMARKS_NATIONALBANK_PRESCREENING.md` |
| 5 | Bank of Korea | KR | T2 | Central Bank | Gates 1-4 PASS; single authoritative publication date field (`<dd class="date">` with `등록일` label) | `SQR_BANK_OF_KOREA_PRESCREENING.md` |
| 6 | Reserve Bank of India | IN | T2 | Central Bank | Gates 1-4 PASS; 6 RSS feeds; RSS `<pubDate>` + article HTML visible date (both agree) | `SQR_RBI_PRESCREENING.md` |
| 7 | South African Reserve Bank | ZA | T2 | Central Bank | Gates 1-4 PASS; RSS feed at non-standard path; RSS `<pubDate>` + article HTML "Published Date" field (both agree); "Last Modified Date" classified as update metadata only | `SQR_SARB_PRESCREENING.md` |
| 8 | MAS (Singapore) | SG | T2 | Central Bank/Regulator | Gates 1-4 PASS; single authoritative publication date field (`<span>Published Date>`) | `SQR_MAS_SINGAPORE_PRESCREENING.md` |
| 9 | JFSA (Japan) | JP | T2 | Financial Regulator | Gates 1-4 PASS; URL date pattern + article HTML visible date (both agree) | `SQR_JFSA_JAPAN_PRESCREENING.md` |
| 10 | AMF (France) | FR | T2 | Financial Regulator | Gates 1-4 PASS; 11 RSS feeds (200 items in primary feed); RSS `<pubDate>` + article HTML `<div class="date">` (both agree) | `SQR_AMF_FRANCE_PRESCREENING.md` |
| 11 | ASIC (Australia) | AU | T2 | Financial Regulator | Gates 1-4 PASS; `dcterms.date.created` + `displayDate` (both agree); `dcterms.date.modified` classified as update metadata only | `SQR_ASIC_AUSTRALIA_PRESCREENING.md` |

### QUALIFICATION_READY with provenance date precedence review qualifier (2 sources)

These sources passed Gates 1, 3, 4 but Gate 2 is PASS WITH REVIEW — multiple date sources were detected but they do not agree (or were observed on different articles, preventing comparison). Date-source precedence must be resolved during Gate 5 or via manual review before onboarding.

| # | Institution | Country | Tier | Class | Pre-screening result | Qualifier | SQR record |
|---|------------|---------|------|-------|----------------------|-----------|------------|
| 1 | People's Bank of China | CN | T1 | Central Bank | Gates 1, 3, 4 PASS; Gate 2 PASS WITH REVIEW | PROVENANCE DATE PRECEDENCE REVIEW — URL timestamp (2026-08-07) and `createDate` (2026-08-07) agree, but `PubDate` (2026-08-06) differs by 1 day; which date is the official `document_date` must be resolved | `SQR_PBOC_PRESCREENING.md` |
| 2 | BaFin | DE | T2 | Financial Regulator | Gates 1, 3, 4 PASS; Gate 2 PASS WITH REVIEW | PROVENANCE DATE PRECEDENCE REVIEW — RSS `<pubDate>` (Aug 13, for "capitalx(.)market" consumer warning) and article HTML visible date (29/07/2026, for "Market surveillance of AI" press release) were observed on different articles; date-source precedence unresolved because no single article was sampled in both RSS and HTML | `SQR_BAFIN_PRESCREENING.md` |

### QUALIFICATION_READY with content-scope qualifier (1 source)

This source passed Gates 1-4 for ONE content type only. Other content types on the same source were not verified (typically because they are JS-rendered). The QUALIFICATION_READY routing applies to the tested content path only.

| # | Institution | Country | Tier | Class | Pre-screening result | Qualifier | SQR record |
|---|------------|---------|------|-------|----------------------|-----------|------------|
| 1 | SFC (Hong Kong) | HK | T2 | Financial Regulator | Gates 1-4 PASS for high-shareholding announcements content type | CONTENT-SCOPE QUALIFIER — high-shareholding announcements only; broader SFC news coverage (apps.sfc.hk) remains unverified because it is JS-rendered. QUALIFICATION_READY applies to the tested content path only; broader SFC news coverage requires qualification-phase investigation with JavaScript execution capability | `SQR_SFC_HONG_KONG_PRESCREENING.md` |

### What QUALIFICATION_READY does NOT mean

- Does NOT mean the source is qualified (only Gate 5 PASS would establish that)
- Does NOT mean onboarding will succeed (Gate 5 may FAIL)
- Does NOT mean configuration-only onboarding (engineering effort is a Gate 5 question)
- Does NOT mean first-attempt success (sample too small, per Governance Rule 10)
- Does NOT mean publishable IOs (intelligence quality is assessed after Gate 5)
- Does NOT authorize onboarding — it identifies candidates for Gate 5

---

## 9. Full DISCOVERY_ONLY Queue (36 sources) — reduced from 56 in V1

### T1 DISCOVERY_ONLY (0 sources — all transitioned in V1.1)

All 3 T1 DISCOVERY_ONLY sources from V1 have been transitioned in V1.1:
- People's Bank of China → QUALIFICATION_READY (Section 8.5, with provenance qualifier)
- US Bureau of Labor Statistics → KNOWN_BLOCKED (Section 10)
- US Treasury → QUALIFICATION_READY (Section 8.5, no qualifier)

### T2 DISCOVERY_ONLY (36 sources) — reduced from 53 in V1

Note: In V1.1, 17 T2 sources were transitioned from this list based on Top 20 pre-screening (`4443553`):
- 12 → QUALIFICATION_READY (Section 8.5): Danmarks Nationalbank, Bundesbank, Banca d'Italia, Bank of Korea, RBI, SARB, BaFin, AMF, ASIC, MAS Singapore, SFC Hong Kong, JFSA Japan
- 2 → KNOWN_BLOCKED (Section 10): De Nederlandsche Bank, Banque de France
- 3 → SCREENING_ONLY (Section 7): Banco de España, Banco Central do Brasil, Bank of Mexico

The remaining 36 T2 sources below are still DISCOVERY_ONLY — no prior Gate 1-4 screening evidence.

| # | Institution | Country | Class | Region |
|---|------------|---------|-------|--------|
| 1 | Central Bank of Russia | RU | Central Bank | Europe |
| 2 | Central Bank of the UAE | AE | Central Bank | Middle East |
| 3 | Saudi Central Bank (SAMA) | SA | Central Bank | Middle East |
| 4 | Central Bank of Turkey | TR | Central Bank | Middle East |
| 5 | Central Bank of Singapore | SG | Central Bank | SE Asia |
| 6 | CONSOB (Italy) | IT | Financial Regulator | Europe |
| 7 | CSRC (China) | CN | Financial Regulator | E. Asia |
| 8 | SEBI (India) | IN | Financial Regulator | S. Asia |
| 9 | FSC (South Korea) | KR | Financial Regulator | E. Asia |
| 10 | ECB Banking Supervision | EU | Financial Regulator | Europe |
| 11 | Fed Banking Supervision | US | Financial Regulator | N. America |
| 12 | OCC | US | Financial Regulator | N. America |
| 13 | FDIC | US | Financial Regulator | N. America |
| 14 | PRA (UK) | UK | Financial Regulator | Europe |
| 15 | Eurostat | EU | Statistical | Europe |
| 16 | ABS (Australia) | AU | Statistical | Oceania |
| 17 | NBS (China) | CN | Statistical | E. Asia |
| 18 | NSO (India) | IN | Statistical | S. Asia |
| 19 | INSEE (France) | FR | Statistical | Europe |
| 20 | Destatis (Germany) | DE | Statistical | Europe |
| 21 | UK HM Treasury | UK | Ministry of Finance | Europe |
| 22 | Federal Ministry of Finance (Germany) | DE | Ministry of Finance | Europe |
| 23 | Ministère de l'Économie (France) | FR | Ministry of Finance | Europe |
| 24 | Ministry of Finance (Japan) | JP | Ministry of Finance | E. Asia |
| 25 | Ministry of Finance (China) | CN | Ministry of Finance | E. Asia |
| 26 | Ministry of Finance (India) | IN | Ministry of Finance | S. Asia |
| 27 | Ministry of Finance (South Korea) | KR | Ministry of Finance | E. Asia |
| 28 | Ministry of Finance (Singapore) | SG | Ministry of Finance | SE Asia |
| 29 | Department of Finance (Canada) | CA | Ministry of Finance | N. America |
| 30 | Department of Finance (Australia) | AU | Ministry of Finance | Oceania |
| 31 | FSB | INT | Multilateral | Global |
| 32 | FATF | INT | Multilateral | Global |
| 33 | SEC EDGAR | US | Disclosure System | N. America |
| 34 | FinCEN | US | Other Authoritative | N. America |
| 35 | EBA | EU | Other Authoritative | Europe |
| 36 | ECB Statistical Data Warehouse | EU | Other Authoritative | Europe |

Note: BaFin was in this list in V1 but has been transitioned to QUALIFICATION_READY (Section 8.5, with provenance qualifier) in V1.1. The inventory duplicate "Federal Financial Supervisory Authority (BaFin)" (B2 #6 + #35) is now counted once under QUALIFICATION_READY. See Section 2 for the duplicate reconciliation table.

---

## 10. KNOWN_BLOCKED (4 sources) — expanded from 1 in V1

A source is classified as `KNOWN_BLOCKED` only when the evidence confirms a source-level block (i.e., the origin server or Akamai CDN authoritatively denies access). Path-level failures (404 on probed paths, timeouts, legacy subdomain 403) do NOT qualify — those sources are classified as `SCREENING_ONLY` (Section 7) because the most conservative state supported by the evidence is "has prior Gate 1-4 evidence; needs further screening".

| # | Institution | Country | Tier | Blocker | Evidence |
|---|------------|---------|------|---------|---------|
| 1 | OECD | INT | T2 | Gate 1 FAIL (HTTP 403 from origin server) | Phase B screening |
| 2 | US Bureau of Labor Statistics (BLS) | US | T1 | Gate 1 FAIL (HTTP 403 from AkamaiGHost) | Top 20 pre-screening (`4443553`) |
| 3 | Banque de France | FR | T2 | Gate 1 FAIL (HTTP 403 with Akamai signature) | Top 20 pre-screening (`4443553`) |
| 4 | De Nederlandsche Bank (DNB) | NL | T2 | Gate 1 FAIL (HTTP 403 from AkamaiGHost) | Top 20 pre-screening (`4443553`) |

Note: HTTP 403 is an authoritative server-level denial of access — this constitutes confirmed source-level blocking. OECD's 403 is from the origin server; BLS and DNB expose the `server: AkamaiGHost` header; Banque de France suppresses the server header but the response body contains the Akamai `errors.edgesuite.net` reference. All 4 are confirmed source-level blocks.

World Bank Group, Statistics Canada, Banco de España, and Bank of Mexico were probed but NOT classified as KNOWN_BLOCKED — their evidence (404 on paths, timeout, legacy subdomain 403) only proves path-level failure, not source-level block. They remain in SCREENING_ONLY (Section 7).

---

## 11. Queue Rationale

### Why T1 before T2

T1 sources are systemically important — their output drives global financial intelligence. Qualifying them first means ROUA's highest-value coverage is established before expanding to secondary sources.

### Why ALREADY_QUALIFIED is listed first

They are in the queue for completeness — they represent coverage already achieved. They do not need qualification work. However, they are relevant for:
- Maintenance monitoring (health checks)
- Requalification triggers
- Customer-facing qualification reports (already have evidence)

### Why SCREENING_ONLY is listed second

These sources have prior Gate 1-4 evidence — known gate failures (5), partial screening evidence (3), or unresolved access paths (2). They need root-cause review, alternative-path probing, or completion of incomplete gates before they can be re-screened or reclassified. They are higher priority than DISCOVERY_ONLY because we already have information about them; the next action is well-defined.

### Why DISCOVERY_ONLY ordering

Within DISCOVERY_ONLY, sources are ordered by:
1. T1 before T2 (systemic importance)
2. ECB system central banks before other European central banks (institutional importance within Europe)
3. Major economy central banks before regulators (institutional importance)
4. Coverage gap value (sources that fill Africa, Latin America, South Asia gaps ranked higher)
5. Geographic diversification (underrepresented regions before well-represented regions)
6. Deterministic tiebreaker (institution name alphabetical)

Technical difficulty is NOT assessed at this stage — it is unknown until Gate 1-4 screening is performed (per Section 5 critical distinctions).

### Why KNOWN_BLOCKED is last

This category contains only sources with confirmed source-level blocks (HTTP 403 from the origin server). Sources with path-level failures (404, timeout) are NOT in this category — they are in `SCREENING_ONLY` because their evidence does not support a source-level block claim. KNOWN_BLOCKED sources cannot be qualified until the blocker is resolved; they are documented but not actionable.

---

## 12. Geographic / Classification Balance (V1.1)

### By region (T1+T2 only — 79 unique records)

Counts below are recalculated from the V1.1 queue sections: ALREADY_QUALIFIED (Section 6, 12 sources), QUALIFICATION_READY (Section 8.5, 14 sources — NEW in V1.1), SCREENING_ONLY (Section 7, 13 sources = 5 known gate failures + 3 partial screening + 4 unresolved access paths + 1 JS-rendered content), DISCOVERY_ONLY (Section 9, 36 sources = 0 T1 + 36 T2), KNOWN_BLOCKED (Section 10, 4 sources).

| Region | ALREADY_QUALIFIED | QUALIFICATION_READY | SCREENING_ONLY | DISCOVERY_ONLY | KNOWN_BLOCKED | Total |
|--------|-------------------|---------------------|----------------|---------------|--------------|-------|
| North America | 6 | 1 | 1 | 6 | 1 | 15 |
| Europe | 4 | 5 | 6 | 12 | 2 | 29 |
| East Asia | 1 | 4 | 0 | 6 | 0 | 11 |
| Southeast Asia | 0 | 1 | 0 | 2 | 0 | 3 |
| South Asia | 0 | 1 | 0 | 3 | 0 | 4 |
| Middle East | 0 | 0 | 0 | 3 | 0 | 3 |
| Africa | 0 | 1 | 0 | 0 | 0 | 1 |
| Latin America | 0 | 0 | 2 | 0 | 0 | 2 |
| Oceania | 0 | 1 | 2 | 2 | 0 | 5 |
| Multilateral/Global | 1 | 0 | 2 | 2 | 1 | 6 |
| **TOTAL** | **12** | **14** | **13** | **36** | **4** | **79** |

Column sums verify: 12 + 14 + 13 + 36 + 4 = 79 ✓

### Coverage gaps in the queue (V1.1)

1. **Africa**: Only 1 source (South African Reserve Bank) in T1+T2 — now QUALIFICATION_READY. Largest regional gap remains.
2. **Latin America**: 2 sources (Banco Central do Brasil, Bank of Mexico) — both now SCREENING_ONLY (BCB JS-rendered, Bank of Mexico legacy subdomain 403). No LATAM sources are QUALIFICATION_READY.
3. **Southeast Asia**: 3 sources (Central Bank of Singapore DISCOVERY_ONLY, MAS Singapore QUALIFICATION_READY, Ministry of Finance Singapore DISCOVERY_ONLY). MAS is Singapore's de facto central bank — potential overlap with "Central Bank of Singapore" needs V2 reconciliation.
4. **South Asia**: 4 sources (RBI QUALIFICATION_READY, SEBI DISCOVERY_ONLY, NSO India DISCOVERY_ONLY, Ministry of Finance India DISCOVERY_ONLY). Thin for a region with 1.5B+ population.
5. **Middle East**: 3 sources (Central Bank of the UAE, Saudi Central Bank, Central Bank of Turkey) — all DISCOVERY_ONLY.

---

## 13. Dependencies / Information Missing (V1.1)

For DISCOVERY_ONLY sources (36 remaining), the following information is missing before qualification can begin:

| Missing info | Affected sources | Impact |
|-------------|-----------------|--------|
| RSS/Atom feed URL | All DISCOVERY_ONLY (36/36) | Cannot attempt Gate 1 without feed URL |
| Content language | All DISCOVERY_ONLY | May need language-specific patterns |
| Document format | All DISCOVERY_ONLY | May need new adapters (beyond RSS/HTML/PDF) |
| Access method | All DISCOVERY_ONLY | May be Akamai-blocked (unknown until tested) |
| Provenance path | All DISCOVERY_ONLY | May lack pubDate/dc:date (unknown until tested) |
| Pattern category | All DISCOVERY_ONLY | May need new pattern category (unknown until content is read) |

All 36 DISCOVERY_ONLY sources have unknown feed URLs — any source with a confirmed feed URL was moved to SCREENING_ONLY (Section 7) or QUALIFICATION_READY (Section 8.5) during pre-screening. **No DISCOVERY_ONLY source can be qualified without first discovering its feed URL and testing access.** This is the Gate 1 pre-screening step.

### For QUALIFICATION_READY sources (14)

QUALIFICATION_READY sources have passed Gates 1-4 but have NOT yet attempted Gate 5. The following information is missing before Gate 5 can begin:

| Missing info | Affected sources | Impact |
|-------------|-----------------|--------|
| Source configuration | All 14 QUALIFICATION_READY | Must create config-only source configuration (no source-specific code) |
| Pipeline run result | All 14 QUALIFICATION_READY | Must run pipeline and assess first-attempt results |
| Intelligence quality | All 14 QUALIFICATION_READY | Assessed after Gate 5 (if PASS) |
| Date-source precedence resolution | PBoC, BaFin (provenance qualifier) | Must resolve which date is authoritative `document_date` during Gate 5 |
| Broader content coverage verification | SFC Hong Kong (content-scope qualifier) | Must verify SFC news application (JS-rendered) via Playwright or similar |

---

## 14. What This Queue Is NOT

- NOT active coverage
- NOT qualified coverage
- NOT expected success rate
- NOT implementation commitment
- NOT marketing source count
- NOT a guarantee that any DISCOVERY_ONLY source will pass qualification

---

## 15. Recommended Next Operating Step (V1.1)

> **Gate 5 on a representative sample of QUALIFICATION_READY sources** — test whether QUALIFICATION_READY from Gates 1-4 actually predicts Gate 5 capability.

The Top 20 pre-screening is complete (`4443553`). All 20 DISCOVERY_ONLY sources from V1 have been transitioned to their V1.1 states (14 QUALIFICATION_READY, 3 SCREENING_ONLY, 3 KNOWN_BLOCKED).

### Next step: Gate 5 on a representative sample

Do NOT run all 14 QUALIFICATION_READY sources through Gate 5 at once. Start with a representative sample of 5 sources that cover the different patterns observed during pre-screening:

1. **US Treasury** — Ministry of Finance / static HTML pattern
2. **Bundesbank** — RSS-heavy pattern (5 feeds)
3. **Banca d'Italia** — HTML publication-date field pattern (single-source provenance)
4. **Reserve Bank of India** — multi-feed RSS pattern (6 feeds)
5. **BaFin or SFC** — a case with qualifier to test the limits of the screening itself

The purpose of this sample is NOT to seek a high PASS rate. The purpose is to test:

> **Does QUALIFICATION_READY from Gates 1-4 actually predict Gate 5 capability?**

This is the first real test of the Qualification Queue's value.

### What Gate 5 involves

Gate 5 (first-attempt validation) requires:
1. Creating a source configuration (config-only, no source-specific code)
2. Running the pipeline against the source
3. Assessing first-attempt results (publishable IOs, provenance complete, reproducible)
4. Documenting the result (PASS / FAIL / NOT ATTEMPTED) in the SQR record

Gate 5 is the first step that involves actual engineering work (configuration creation + pipeline run). Pre-screening (Gates 1-4) was documentation-only; Gate 5 is operational.

### Scope boundaries

- Gate 5 is for QUALIFICATION_READY sources only (Section 8.5)
- Sources with qualifiers (PBoC, BaFin, SFC) may require additional review before or during Gate 5
- SCREENING_ONLY sources (Section 7) are NOT ready for Gate 5 — they need root-cause review or alternative-path probing first
- KNOWN_BLOCKED sources (Section 10) cannot attempt Gate 5 until the block is resolved
- DISCOVERY_ONLY sources (Section 9) must be pre-screened first (Gates 1-4) before Gate 5

**This is the qualification phase. Configuration is created. Pipeline is run. Gate 5 is attempted.**

---

## Appendix: Evidence References

| Evidence commit | What it proves | Used for |
|----------------|---------------|----------|
| `de64f31` | Phase A pipeline baseline (frozen) | ALREADY_QUALIFIED: ECB, FED, BOE, BOC |
| `146aa3b` | Extraction Hardening CLEARED | ALREADY_QUALIFIED: BOJ, SEC, FCA, BIS, OFAC |
| `c8af140` | BEA first-attempt PASS | ALREADY_QUALIFIED: BEA (VALIDATION_VERIFIED) |
| `c09de13` | SNB first-attempt PASS | ALREADY_QUALIFIED: SNB (VALIDATION_VERIFIED) |
| `332788c` | SNB independent review CLEARED | SNB evidence maturity upgrade |
| `b4fabe9` | CFTC PASS + IMF FAIL (prospective) | ALREADY_QUALIFIED: CFTC (PROSPECTIVE_VALIDATED); SCREENING_ONLY: IMF |
| `27294db` | ESMA RSS FAIL | SCREENING_ONLY: ESMA (Gate 2 fail) |
| `8041cda` | ESMA HTML FAIL | SCREENING_ONLY: ESMA (Gate 2 fail, HTML path) |
| `92b6c4f` | Queue V1 FROZEN | Historical baseline — preserved as reference; NOT modified by V1.1 |
| `4443553` | Top 20 Pre-Screening COMPLETE | V1.1 state transitions: 14 QUALIFICATION_READY, 3 SCREENING_ONLY, 3 KNOWN_BLOCKED |
