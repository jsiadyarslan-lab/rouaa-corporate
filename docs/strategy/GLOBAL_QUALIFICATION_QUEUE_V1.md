# Global Qualification Queue v1

**Date**: 2026-08-13
**Branch**: `global-source-inventory`
**Status**: DRAFT FOR REVIEW (queue integrity reconciled)
**Source baseline**: Global Source Universe v1 (`8b1e7b4` — Data Integrity CLEARED)
**Linked models**: Global Source Expansion Model v1 (`93de30c`), Source Qualification Report Template v1 (`f5caf57`)
**Type**: Internal execution queue — documentation only. No onboarding, no probing, no config, no pipeline changes.

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
| World Bank Group | B6 #14 + B7 #3 | T1 | Counted once in queue (KNOWN_BLOCKED) |
| BaFin | B2 #6 + B2 #35 (full name "Federal Financial Supervisory Authority (BaFin)") | T2 | Counted once in queue (DISCOVERY_ONLY) |
| Central Bank of Brazil / Banco Central do Brasil | B1 #15 (EN) + B1 #33 (PT) | T2 | Counted once in queue (DISCOVERY_ONLY) |

```text
82 inventory rows
− 3 duplicate rows (World Bank Group, BaFin, Central Bank of Brazil)
= 79 unique T1/T2 queue records
```

These duplicates are inventory V2 issues — they are documented here for transparency but are NOT corrected in the Universe v1 baseline (`8b1e7b4`).

---

## 3. Queue-State Counts

```text
T1/T2 inventory rows (before duplicate reconciliation):    82
Less 3 duplicate rows (reconciled in Section 2):           −3
Unique T1/T2 queue records:                                79

Queue state breakdown:
  ALREADY_QUALIFIED (reference/completed — not executable):  12
  SCREENING_ONLY (executable — prior Gate 1-4 evidence):      8
  DISCOVERY_ONLY (executable — no technical screening):      56
  KNOWN_BLOCKED (executable — confirmed access blockers):      3
  TOTAL unique records:                                      79   (= 12 + 8 + 56 + 3)
```

### Queue structure

The queue separates completed work from executable work:

**Completed (reference set — not in execution queue):**
- ALREADY_QUALIFIED (12 sources) — these have passed Gate 5 (first-attempt validation); they require no qualification work and are listed for completeness only

**Executable qualification queue:**
- SCREENING_ONLY (8 sources) — have partial Gate 1-4 evidence; need completion or root-cause review
- DISCOVERY_ONLY (56 sources) — no technical screening performed; feed URLs unknown
- KNOWN_BLOCKED (3 sources) — confirmed access blockers; not actionable until resolved

### KNOWN_BLOCKED reconciliation

The inventory's Part B status for OECD, Statistics Canada, and World Bank Group is `DISCOVERED`, but prior probing and Part F (Deferred/Blocked) document known access issues. The queue reconciles this:

| Source | Part B status | Part F / probing status | Queue status | Rationale |
|--------|-------------|------------------------|-------------|-----------|
| OECD | DISCOVERED | BLOCKED (Gate 1 FAIL 403) | KNOWN_BLOCKED | Part F evidence supersedes Part B default |
| Statistics Canada | DISCOVERED | DEFERRED (access timeout) | KNOWN_BLOCKED | Part F evidence supersedes Part B default |
| World Bank Group | DISCOVERED | Feed URL not found (404 on probed paths) | KNOWN_BLOCKED | Phase 2A probing evidence supersedes Part B default |

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

These sources have passed Gate 5 (first-attempt validation). They are in the queue for completeness but do not need qualification work.

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

## 7. SCREENING_ONLY (8 sources)

These sources have prior Gate 1-4 screening evidence. Some have known gate failures (root-cause review needed); others have partial screening (feed URL confirmed, but full Gate 1-4 not completed).

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

---

## 8. DISCOVERY_ONLY — Top 20 Qualification Candidates

These are the 20 highest-priority sources whose current queue state is `DISCOVERY_ONLY`. They have NOT been probed, screened, or configured. No access, provenance, or content feasibility has been verified. They are ordered by the queue ordering principles (Section 4): Tier first, then institutional importance (central banks before regulators), then coverage gap value, then geographic diversification. No numeric weights are assigned.

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
- World Bank Group — moved to KNOWN_BLOCKED (Section 10); feed URL not found in prior probing
- Sveriges Riksbank — moved to SCREENING_ONLY (Section 7); RSS feed confirmed in prior probing
- FINMA — moved to SCREENING_ONLY (Section 7); RSS feed confirmed in prior probing
- Norges Bank — moved to SCREENING_ONLY (Section 7); probed in Phase 2A (RSS path not found but institution confirmed)
- OECD — KNOWN_BLOCKED (Gate 1 FAIL 403)
- IMF — SCREENING_ONLY (Gate 1 Akamai 403)
- ESMA — SCREENING_ONLY (Gate 2 fail — no pubDate)

---

## 9. Full DISCOVERY_ONLY Queue (56 sources)

### T1 DISCOVERY_ONLY (3 sources)

Note: Sources below have NO prior Gate 1-4 screening evidence. Their technical characteristics (access, provenance, content) are unknown. World Bank Group has been moved to KNOWN_BLOCKED (Section 10) based on prior probing (feed URL not found).

| # | Institution | Country | Class | Region |
|---|------------|---------|-------|--------|
| 1 | People's Bank of China | CN | Central Bank | E. Asia |
| 2 | US Bureau of Labor Statistics | US | Statistical | N. America |
| 3 | US Treasury | US | Ministry of Finance | N. America |

### T2 DISCOVERY_ONLY (53 sources)

Note: Sources below have NO prior Gate 1-4 screening evidence. Sveriges Riksbank, FINMA, and Norges Bank have been moved to SCREENING_ONLY (Section 7) based on prior probing evidence. Statistics Canada has been moved to KNOWN_BLOCKED (Section 10) based on Part F evidence. OECD was already moved to KNOWN_BLOCKED.

The single BaFin entry below corresponds to two inventory rows (#6 + #35) — see Section 2 duplicate reconciliation.

| # | Institution | Country | Class | Region |
|---|------------|---------|-------|--------|
| 1 | Danmarks Nationalbank | DK | Central Bank | Europe |
| 2 | De Nederlandsche Bank | NL | Central Bank | Europe |
| 3 | Bundesbank | DE | Central Bank | Europe |
| 4 | Banque de France | FR | Central Bank | Europe |
| 5 | Banca d'Italia | IT | Central Bank | Europe |
| 6 | Banco de España | ES | Central Bank | Europe |
| 7 | Bank of Korea | KR | Central Bank | E. Asia |
| 8 | Reserve Bank of India | IN | Central Bank | S. Asia |
| 9 | Banco Central do Brasil | BR | Central Bank | LATAM |
| 10 | Bank of Mexico | MX | Central Bank | LATAM |
| 11 | Central Bank of Russia | RU | Central Bank | Europe |
| 12 | South African Reserve Bank | ZA | Central Bank | Africa |
| 13 | Central Bank of the UAE | AE | Central Bank | Middle East |
| 14 | Saudi Central Bank (SAMA) | SA | Central Bank | Middle East |
| 15 | Central Bank of Turkey | TR | Central Bank | Middle East |
| 16 | Central Bank of Singapore | SG | Central Bank | SE Asia |
| 17 | BaFin | DE | Financial Regulator | Europe |
| 18 | AMF (France) | FR | Financial Regulator | Europe |
| 19 | CONSOB (Italy) | IT | Financial Regulator | Europe |
| 20 | ASIC (Australia) | AU | Financial Regulator | Oceania |
| 21 | MAS (Singapore) | SG | Financial Regulator | SE Asia |
| 22 | SFC (Hong Kong) | HK | Financial Regulator | E. Asia |
| 23 | JFSA (Japan) | JP | Financial Regulator | E. Asia |
| 24 | CSRC (China) | CN | Financial Regulator | E. Asia |
| 25 | SEBI (India) | IN | Financial Regulator | S. Asia |
| 26 | FSC (South Korea) | KR | Financial Regulator | E. Asia |
| 27 | ECB Banking Supervision | EU | Financial Regulator | Europe |
| 28 | Fed Banking Supervision | US | Financial Regulator | N. America |
| 29 | OCC | US | Financial Regulator | N. America |
| 30 | FDIC | US | Financial Regulator | N. America |
| 31 | PRA (UK) | UK | Financial Regulator | Europe |
| 32 | Eurostat | EU | Statistical | Europe |
| 33 | ABS (Australia) | AU | Statistical | Oceania |
| 34 | NBS (China) | CN | Statistical | E. Asia |
| 35 | NSO (India) | IN | Statistical | S. Asia |
| 36 | INSEE (France) | FR | Statistical | Europe |
| 37 | Destatis (Germany) | DE | Statistical | Europe |
| 38 | UK HM Treasury | UK | Ministry of Finance | Europe |
| 39 | Federal Ministry of Finance (Germany) | DE | Ministry of Finance | Europe |
| 40 | Ministère de l'Économie (France) | FR | Ministry of Finance | Europe |
| 41 | Ministry of Finance (Japan) | JP | Ministry of Finance | E. Asia |
| 42 | Ministry of Finance (China) | CN | Ministry of Finance | E. Asia |
| 43 | Ministry of Finance (India) | IN | Ministry of Finance | S. Asia |
| 44 | Ministry of Finance (South Korea) | KR | Ministry of Finance | E. Asia |
| 45 | Ministry of Finance (Singapore) | SG | Ministry of Finance | SE Asia |
| 46 | Department of Finance (Canada) | CA | Ministry of Finance | N. America |
| 47 | Department of Finance (Australia) | AU | Ministry of Finance | Oceania |
| 48 | FSB | INT | Multilateral | Global |
| 49 | FATF | INT | Multilateral | Global |
| 50 | SEC EDGAR | US | Disclosure System | N. America |
| 51 | FinCEN | US | Other Authoritative | N. America |
| 52 | EBA | EU | Other Authoritative | Europe |
| 53 | ECB Statistical Data Warehouse | EU | Other Authoritative | Europe |

Note: The inventory row "Federal Financial Supervisory Authority (BaFin)" (B2 #35) is the same institution as BaFin (B2 #6) and is counted once in this list at #17 above. See Section 2 for the duplicate reconciliation table.

Note: OECD is NOT in this DISCOVERY_ONLY list — it has been moved to KNOWN_BLOCKED (Section 10) based on Part F evidence.

---

## 10. KNOWN_BLOCKED (3 sources)

| # | Institution | Country | Tier | Blocker | Evidence |
|---|------------|---------|------|---------|---------|
| 1 | OECD | INT | T2 | Gate 1 FAIL (HTTP 403) | Phase B screening |
| 2 | Statistics Canada | CA | T2 | Access timeout | Phase B screening (Part F: DEFERRED) |
| 3 | World Bank Group | INT | T1 | Feed URL not found (404 on probed paths) | Phase 2A screening |

Note: World Bank Group is T1 but has known access issues from probing — correct feed URL not discovered. It is in KNOWN_BLOCKED because Gate 1 cannot be completed without the correct feed URL.

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

These sources have known gate failures. They need root-cause review before they can be re-screened or classified. They are higher priority than DISCOVERY_ONLY because we already have information about them.

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

These sources have confirmed access blockers. They cannot be qualified until the blocker is resolved (infrastructure investment). They are documented but not actionable.

---

## 12. Geographic / Classification Balance

### By region (T1+T2 only — 79 unique records)

Counts below are recalculated from the queue sections: ALREADY_QUALIFIED (Section 6, 12 sources), SCREENING_ONLY (Section 7, 8 sources), DISCOVERY_ONLY (Section 9, 56 sources = 3 T1 + 53 T2), KNOWN_BLOCKED (Section 10, 3 sources).

| Region | ALREADY_QUALIFIED | SCREENING_ONLY | DISCOVERY_ONLY | KNOWN_BLOCKED | Total |
|--------|-------------------|----------------|---------------|--------------|-------|
| North America | 6 | 0 | 8 | 1 | 15 |
| Europe | 4 | 5 | 20 | 0 | 29 |
| East Asia | 1 | 0 | 10 | 0 | 11 |
| Southeast Asia | 0 | 0 | 3 | 0 | 3 |
| South Asia | 0 | 0 | 4 | 0 | 4 |
| Middle East | 0 | 0 | 3 | 0 | 3 |
| Africa | 0 | 0 | 1 | 0 | 1 |
| Latin America | 0 | 0 | 2 | 0 | 2 |
| Oceania | 0 | 2 | 3 | 0 | 5 |
| Multilateral/Global | 1 | 1 | 2 | 2 | 6 |
| **TOTAL** | **12** | **8** | **56** | **3** | **79** |

Column sums verify: 12 + 8 + 56 + 3 = 79 ✓

### Coverage gaps in the queue

1. **Africa**: Only 1 source (South African Reserve Bank) in T1+T2. Largest regional gap.
2. **Latin America**: Only 2 sources (Banco Central do Brasil, Bank of Mexico). Both T2 DISCOVERY_ONLY.
3. **Southeast Asia**: 3 sources (Central Bank of Singapore, MAS Singapore, Ministry of Finance Singapore). Potential overlap between "Central Bank of Singapore" and "MAS (Singapore)" — needs V2 reconciliation (MAS is Singapore's de facto central bank).
4. **South Asia**: 4 sources (Reserve Bank of India, SEBI, NSO India, Ministry of Finance India). Thin for a region with 1.5B+ population.
5. **Middle East**: 3 sources (Central Bank of the UAE, Saudi Central Bank, Central Bank of Turkey).

---

## 13. Dependencies / Information Missing

For DISCOVERY_ONLY sources, the following information is missing before qualification can begin:

| Missing info | Affected sources | Impact |
|-------------|-----------------|--------|
| RSS/Atom feed URL | All DISCOVERY_ONLY (56/56) | Cannot attempt Gate 1 without feed URL |
| Content language | All DISCOVERY_ONLY | May need language-specific patterns |
| Document format | All DISCOVERY_ONLY | May need new adapters (beyond RSS/HTML/PDF) |
| Access method | All DISCOVERY_ONLY | May be Akamai-blocked (unknown until tested) |
| Provenance path | All DISCOVERY_ONLY | May lack pubDate/dc:date (unknown until tested) |
| Pattern category | All DISCOVERY_ONLY | May need new pattern category (unknown until content is read) |

All 56 DISCOVERY_ONLY sources have unknown feed URLs — any source with a confirmed feed URL was moved to SCREENING_ONLY (Section 7) during prior probing. **No DISCOVERY_ONLY source can be qualified without first discovering its feed URL and testing access.** This is the Gate 1 pre-screening step.

---

## 14. What This Queue Is NOT

- NOT active coverage
- NOT qualified coverage
- NOT expected success rate
- NOT implementation commitment
- NOT marketing source count
- NOT a guarantee that any DISCOVERY_ONLY source will pass qualification

---

## 15. Recommended Next Operating Step

> **Pre-screen the Top 20 DISCOVERY_ONLY candidates against Gates 1-4** using the Source Qualification Report Template v1 (`f5caf57`).

This means:
1. For each of the Top 20: discover the RSS/feed URL
2. Test Gate 1 (access)
3. Test Gate 2 (provenance metadata in feed)
4. Test Gate 3 (content substance in static HTML)
5. Assess Gate 4 (pattern category coverage)
6. Record results in a Source Qualification Record
7. Update the source's queue status from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED

**This is pre-screening, not onboarding. No configuration is created. No Gate 5 is attempted.**

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
