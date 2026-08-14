# Global Qualification Queue v1

**Date**: 2026-08-13
**Branch**: `global-source-inventory`
**Status**: DRAFT FOR REVIEW
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
T1 + T2 records (eligible for queue): 82
  T1 (Strategic Core):             19
  T2 (High-Value Expansion):       63
  TOTAL:                           82

T3 + T4 (not in this queue):       96
  (excluded — specialized/long-tail, not priority for qualification)
```

---

## 3. Queue-State Counts

```text
ALREADY_QUALIFIED:   12
SCREENING_ONLY:       5
DISCOVERY_ONLY:      63
KNOWN_BLOCKED:        2
TOTAL:               82
```

### KNOWN_BLOCKED reconciliation

The inventory's Part B status for OECD and Statistics Canada is `DISCOVERED`, but Part F (Deferred/Blocked) documents known access issues. The queue reconciles this:

| Source | Part B status | Part F status | Queue status | Rationale |
|--------|-------------|---------------|-------------|-----------|
| OECD | DISCOVERED | BLOCKED (Gate 1 FAIL 403) | KNOWN_BLOCKED | Part F evidence supersedes Part B default |
| Statistics Canada | DISCOVERED | DEFERRED (access timeout) | KNOWN_BLOCKED | Part F evidence supersedes Part B default |

### World Bank Group duplicate

World Bank Group appears in both B6 (#14) and B7 (#3). For the queue, it is counted once. The duplicate is noted but not corrected in the inventory (that would require a V2).

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

## 7. SCREENING_ONLY (5 sources)

These sources have been pre-screened (Gates 1-4 tested) but did not reach publishable output. They are in the queue for root-cause review or re-screening.

| # | Institution | Country | Tier | Gate failed | Evidence | Notes |
|---|------------|---------|------|------------|---------|-------|
| 1 | ESMA | EU | T1 | Gate 2 | `27294db` | No pubDate/dc:date in RSS; dates in content text |
| 2 | IMF | INT | T1 | Gate 1 | `b4fabe9` | Akamai 403 — access blocked |
| 3 | Reserve Bank of Australia | AU | T2 | Gate 1 | Phase B | Akamai 403 — access blocked |
| 4 | Reserve Bank of New Zealand | NZ | T2 | Gate 1 (partial) | Phase B | RSS open, content URLs 403 |
| 5 | UK ONS | UK | T2 | Gate 3 | Phase B | JS-rendered — static HTML empty |

---

## 8. DISCOVERY_ONLY — Top 20 Qualification Candidates

These are the highest-priority sources that have NOT been tested. They are ordered by the queue ordering principles (Section 4). No access, provenance, or content feasibility has been verified.

| # | Institution | Country | Tier | Class | Region | Why next |
|---|------------|---------|------|-------|--------|----------|
| 1 | People's Bank of China | CN | T1 | Central Bank | E. Asia | Systemically important; largest economy without coverage |
| 2 | US Bureau of Labor Statistics | US | T1 | Statistical | N. America | T1 source; likely RSS with pubDate; low expected difficulty |
| 3 | US Treasury | US | T1 | Ministry of Finance | N. America | Fiscal policy; official source; likely standard access |
| 4 | World Bank Group | INT | T1 | Multilateral | Global | Systemic importance; known access issues (need correct feed URL) |
| 5 | Sveriges Riksbank | SE | T2 | Central Bank | Europe | Already probed; has RSS with pubDate; expected low difficulty |
| 6 | FINMA | CH | T2 | Financial Regulator | Europe | Swiss regulator; RSS confirmed in screening |
| 7 | Bundesbank | DE | T2 | Central Bank | Europe | ECB system; likely standard RSS |
| 8 | Banque de France | FR | T2 | Central Bank | Europe | ECB system; likely standard RSS |
| 9 | Banca d'Italia | IT | T2 | Central Bank | Europe | ECB system; major economy |
| 10 | Banco de España | ES | T2 | Central Bank | Europe | ECB system; major economy |
| 11 | De Nederlandsche Bank | NL | T2 | Central Bank | Europe | ECB system |
| 12 | Norges Bank | NO | T2 | Central Bank | Europe | Probed in Phase B; RSS feed path not found but institution known |
| 13 | Bank of Korea | KR | T2 | Central Bank | E. Asia | Major economy; English-language publications |
| 14 | Reserve Bank of India | IN | T2 | Central Bank | S. Asia | Major economy; fills South Asia gap |
| 15 | MAS (Singapore) | SG | T2 | Central Bank/Regulator | SE Asia | Major APAC financial hub; dual function |
| 16 | SFC (Hong Kong) | HK | T2 | Financial Regulator | E. Asia | Major APAC financial hub |
| 17 | JFSA (Japan) | JP | T2 | Financial Regulator | E. Asia | Major economy regulator |
| 18 | BaFin | DE | T2 | Financial Regulator | Europe | Major EU regulator |
| 19 | AMF (France) | FR | T2 | Financial Regulator | Europe | Major EU regulator |
| 20 | ASIC (Australia) | AU | T2 | Financial Regulator | Oceania | Major APAC regulator |

---

## 9. Full DISCOVERY_ONLY Queue (63 sources)

### T1 DISCOVERY_ONLY (4 unique sources — World Bank Group deduplicated)

| # | Institution | Country | Class | Region |
|---|------------|---------|-------|--------|
| 1 | People's Bank of China | CN | Central Bank | E. Asia |
| 2 | US Bureau of Labor Statistics | US | Statistical | N. America |
| 3 | US Treasury | US | Ministry of Finance | N. America |
| 4 | World Bank Group | INT | Multilateral | Global |

### T2 DISCOVERY_ONLY (59 sources)

| # | Institution | Country | Class | Region |
|---|------------|---------|-------|--------|
| 1 | Sveriges Riksbank | SE | Central Bank | Europe |
| 2 | Norges Bank | NO | Central Bank | Europe |
| 3 | Danmarks Nationalbank | DK | Central Bank | Europe |
| 4 | De Nederlandsche Bank | NL | Central Bank | Europe |
| 5 | Bundesbank | DE | Central Bank | Europe |
| 6 | Banque de France | FR | Central Bank | Europe |
| 7 | Banca d'Italia | IT | Central Bank | Europe |
| 8 | Banco de España | ES | Central Bank | Europe |
| 9 | Bank of Korea | KR | Central Bank | E. Asia |
| 10 | Reserve Bank of India | IN | Central Bank | S. Asia |
| 11 | Banco Central do Brasil | BR | Central Bank | LATAM |
| 12 | Bank of Mexico | MX | Central Bank | LATAM |
| 13 | Central Bank of Russia | RU | Central Bank | Europe |
| 14 | South African Reserve Bank | ZA | Central Bank | Africa |
| 15 | Central Bank of the UAE | AE | Central Bank | Middle East |
| 16 | Saudi Central Bank (SAMA) | SA | Central Bank | Middle East |
| 17 | Central Bank of Turkey | TR | Central Bank | Middle East |
| 18 | Central Bank of Singapore | SG | Central Bank | SE Asia |
| 19 | FINMA | CH | Financial Regulator | Europe |
| 20 | BaFin | DE | Financial Regulator | Europe |
| 21 | AMF (France) | FR | Financial Regulator | Europe |
| 22 | CONSOB (Italy) | IT | Financial Regulator | Europe |
| 23 | ASIC (Australia) | AU | Financial Regulator | Oceania |
| 24 | MAS (Singapore) | SG | Financial Regulator | SE Asia |
| 25 | SFC (Hong Kong) | HK | Financial Regulator | E. Asia |
| 26 | JFSA (Japan) | JP | Financial Regulator | E. Asia |
| 27 | CSRC (China) | CN | Financial Regulator | E. Asia |
| 28 | SEBI (India) | IN | Financial Regulator | S. Asia |
| 29 | FSC (South Korea) | KR | Financial Regulator | E. Asia |
| 30 | ECB Banking Supervision | EU | Financial Regulator | Europe |
| 31 | Fed Banking Supervision | US | Financial Regulator | N. America |
| 32 | OCC | US | Financial Regulator | N. America |
| 33 | FDIC | US | Financial Regulator | N. America |
| 34 | PRA (UK) | UK | Financial Regulator | Europe |
| 35 | Eurostat | EU | Statistical | Europe |
| 36 | Statistics Canada | CA | Statistical | N. America |
| 37 | ABS (Australia) | AU | Statistical | Oceania |
| 38 | NBS (China) | CN | Statistical | E. Asia |
| 39 | NSO (India) | IN | Statistical | S. Asia |
| 40 | INSEE (France) | FR | Statistical | Europe |
| 41 | Destatis (Germany) | DE | Statistical | Europe |
| 42 | UK HM Treasury | UK | Ministry of Finance | Europe |
| 43 | Federal Ministry of Finance (Germany) | DE | Ministry of Finance | Europe |
| 44 | Ministère de l'Économie (France) | FR | Ministry of Finance | Europe |
| 45 | Ministry of Finance (Japan) | JP | Ministry of Finance | E. Asia |
| 46 | Ministry of Finance (China) | CN | Ministry of Finance | E. Asia |
| 47 | Ministry of Finance (India) | IN | Ministry of Finance | S. Asia |
| 48 | Ministry of Finance (South Korea) | KR | Ministry of Finance | E. Asia |
| 49 | Ministry of Finance (Singapore) | SG | Ministry of Finance | SE Asia |
| 50 | Department of Finance (Canada) | CA | Ministry of Finance | N. America |
| 51 | Department of Finance (Australia) | AU | Ministry of Finance | Oceania |
| 52 | OECD | INT | Multilateral | Global |
| 53 | FSB | INT | Multilateral | Global |
| 54 | FATF | INT | Multilateral | Global |
| 55 | SEC EDGAR | US | Disclosure System | N. America |
| 56 | FinCEN | US | Other Authoritative | N. America |
| 57 | EBA | EU | Other Authoritative | Europe |
| 58 | ECB Statistical Data Warehouse | EU | Other Authoritative | Europe |
| 59 | Federal Financial Supervisory Authority (BaFin) | DE | Financial Regulator | Europe |

Note: #19 (FINMA) and #59 (Federal Financial Supervisory Authority (BaFin)) — FINMA is Swiss, BaFin is German. These are distinct institutions. The naming in the inventory should be clarified in V2.

---

## 10. KNOWN_BLOCKED (2 sources)

| # | Institution | Country | Tier | Blocker | Evidence |
|---|------------|---------|------|---------|---------|
| 1 | OECD | INT | T2 | Gate 1 FAIL (HTTP 403) | Phase B screening |
| 2 | Statistics Canada | CA | T2 | Access timeout | Phase B screening |

These sources have known access issues documented in Part F of the inventory. They are not ready for qualification until the access issue is resolved.

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
2. ECB system central banks before others (likely standard RSS — expected low difficulty)
3. Major economy regulators (high institutional importance)
4. Geographic diversification (Africa, South Asia, Middle East gaps)

### Why KNOWN_BLOCKED is last

These sources have confirmed access blockers. They cannot be qualified until the blocker is resolved (infrastructure investment). They are documented but not actionable.

---

## 12. Geographic / Classification Balance

### By region (T1+T2 only)

| Region | ALREADY_QUALIFIED | SCREENING_ONLY | DISCOVERY_ONLY | KNOWN_BLOCKED | Total |
|--------|-------------------|----------------|---------------|--------------|-------|
| North America | 6 | 0 | 6 | 1 | 13 |
| Europe | 3 | 2 | 33 | 0 | 38 |
| East Asia | 1 | 0 | 7 | 0 | 8 |
| Southeast Asia | 0 | 0 | 3 | 0 | 3 |
| South Asia | 0 | 0 | 3 | 0 | 3 |
| Middle East | 0 | 0 | 3 | 0 | 3 |
| Africa | 0 | 0 | 1 | 0 | 1 |
| Latin America | 0 | 0 | 2 | 0 | 2 |
| Oceania | 0 | 2 | 3 | 0 | 5 |
| Multilateral/Global | 2 | 1 | 2 | 1 | 6 |

### Coverage gaps in the queue

1. **Africa**: Only 1 source (South African Reserve Bank) in T1+T2. Major gap.
2. **South Asia**: Only 3 sources (RBI, SEBI, NSO). Thin for a region with 1.5B+ population.
3. **Southeast Asia**: Only 3 sources. Major financial hubs (MAS, BNM) need qualification.
4. **Latin America**: Only 2 sources. Brazil and Mexico central banks are T2.

---

## 13. Dependencies / Information Missing

For DISCOVERY_ONLY sources, the following information is missing before qualification can begin:

| Missing info | Affected sources | Impact |
|-------------|-----------------|--------|
| RSS/Atom feed URL | Most DISCOVERY_ONLY (59/63) | Cannot attempt Gate 1 without feed URL |
| Content language | All DISCOVERY_ONLY | May need language-specific patterns |
| Document format | All DISCOVERY_ONLY | May need new adapters (beyond RSS/HTML/PDF) |
| Access method | All DISCOVERY_ONLY | May be Akamai-blocked (unknown until tested) |
| Provenance path | All DISCOVERY_ONLY | May lack pubDate/dc:date (unknown until tested) |
| Pattern category | All DISCOVERY_ONLY | May need new pattern category (unknown until content is read) |

**No DISCOVERY_ONLY source can be qualified without first discovering its feed URL and testing access.** This is the Gate 1 pre-screening step.

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
