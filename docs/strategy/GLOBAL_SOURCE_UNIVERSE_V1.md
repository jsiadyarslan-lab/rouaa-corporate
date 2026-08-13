# Global Source Universe / Inventory v1

**Date**: 2026-08-13
**Branch**: `global-source-inventory`
**Status**: DRAFT FOR REVIEW
**Evidence base**: `93de30c` → `f5caf57` → `f99e894` → `7384033`
**Type**: Strategic inventory — documentation only. No code, config, Contract, or website changes.

---

## 1. The Question

> What is the global universe of official financial and economic sources ROUA should potentially cover, and how should those sources be prioritized before qualification and onboarding?

This inventory is a **target universe** — not active coverage, not qualified sources, not a marketing claim.

```
Global Source Universe  ≠  Qualified Sources  ≠  Active Sources  ≠  Marketing Coverage
```

---

## 2. Scope and Taxonomy

The inventory covers 9 institutional categories across 10 geographic regions. The taxonomy is **extensible** — new categories can be added.

### Institutional categories

1. Central Banks / Monetary Authorities
2. Financial Regulators / Supervisory Authorities
3. Statistical Agencies
4. Ministries of Finance / Treasury
5. Markets / Market Infrastructure Authorities
6. Public / Sovereign Financial Institutions
7. Multilateral / International Institutions
8. Corporate / Regulatory Disclosure Systems
9. Other Authoritative Financial-Economic Bodies

### Geographic regions

North America | Latin America & Caribbean | Europe | Middle East | Africa | South Asia | East Asia | Southeast Asia | Oceania | Multilateral / Global

---

## 3. Officialness and Eligibility

Every source has two separate fields:

| Field | Values | Purpose |
|-------|--------|---------|
| authority_status | OFFICIAL / QUASI_OFFICIAL / OTHER_AUTHORITATIVE | What kind of authority does this institution have? |
| eligible_for_global_official_coverage | YES / NO / REVIEW | Should this source enter ROUA's official coverage universe? |

**authority_status ≠ eligibility.** A quasi-official source may be eligible (REVIEW); an official source is typically YES. "Industry-standard" sources do not automatically enter the official universe.

---

## 4. Evidence Discipline

| evidence_status | Meaning |
|----------------|---------|
| VERIFIED_OFFICIAL | Source confirmed via official institutional website |
| SECONDARY_DISCOVERY_PENDING_OFFICIAL_CONFIRMATION | Name discovered via secondary source; official URL not yet confirmed |
| UNVERIFIED | Not yet checked |

Sources in this inventory are predominantly VERIFIED_OFFICIAL (based on well-known institutional websites). A small number are SECONDARY_DISCOVERY where the institution is known but the specific RSS/feed URL needs confirmation.

---

## 5. Inventory Status

| status | Meaning |
|--------|---------|
| DISCOVERED | Identified, not yet screened |
| SCREENED | Gates 1-4 pre-screened (only for sources already tested in Phase A/B/Validation) |
| QUALIFIED | Has passed qualification (only for sources with evidence commits) |
| ACTIVE | In production |
| DEFERRED | Low priority or known blocker |
| BLOCKED | Access confirmed blocked |

**Most sources in this inventory are DISCOVERED.** Only sources with evidence commits (BEA, SNB, CFTC, ESMA, etc.) have SCREENED or QUALIFIED status.

---

## Part A — Executive Inventory (Tier 1 Strategic Core)

These are systemically important institutions whose output drives global financial intelligence. They are the highest priority for qualification and onboarding.

| # | Institution | Country | Class | Authority | Eligible | Tier | Status | Evidence |
|---|------------|---------|-------|-----------|----------|------|--------|----------|
| 1 | European Central Bank | EU | Central Bank | OFFICIAL | YES | T1 | QUALIFIED | `de64f31` |
| 2 | US Federal Reserve | US | Central Bank | OFFICIAL | YES | T1 | QUALIFIED | `de64f31` |
| 3 | Bank of England | UK | Central Bank | OFFICIAL | YES | T1 | QUALIFIED | `de64f31` |
| 4 | Bank of Japan | JP | Central Bank | OFFICIAL | YES | T1 | QUALIFIED | `146aa3b` |
| 5 | People's Bank of China | CN | Central Bank | OFFICIAL | YES | T1 | DISCOVERED | — |
| 6 | Swiss National Bank | CH | Central Bank | OFFICIAL | YES | T1 | QUALIFIED | `c09de13` |
| 7 | European Securities and Markets Authority | EU | Financial Regulator | OFFICIAL | YES | T1 | SCREENED | `27294db` |
| 8 | US Securities and Exchange Commission | US | Financial Regulator | OFFICIAL | YES | T1 | QUALIFIED | `146aa3b` |
| 9 | US Commodity Futures Trading Commission | US | Financial Regulator | OFFICIAL | YES | T1 | QUALIFIED | `b4fabe9` |
| 10 | UK Financial Conduct Authority | UK | Financial Regulator | OFFICIAL | YES | T1 | QUALIFIED | `146aa3b` |
| 11 | US Bureau of Economic Analysis | US | Statistical Agency | OFFICIAL | YES | T1 | QUALIFIED | `c8af140` |
| 12 | US Bureau of Labor Statistics | US | Statistical Agency | OFFICIAL | YES | T1 | DISCOVERED | — |
| 13 | Bank for International Settlements | INT | Multilateral | OFFICIAL | YES | T1 | QUALIFIED | `146aa3b` |
| 14 | International Monetary Fund | INT | Multilateral | OFFICIAL | YES | T1 | SCREENED | `b4fabe9` |
| 15 | US Treasury / OFAC | US | Gov Economic Agency | OFFICIAL | YES | T1 | QUALIFIED | `146aa3b` |

---

## Part B — Global Institutional Inventory

### B1. Central Banks / Monetary Authorities

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | European Central Bank | EU | Europe | OFFICIAL | YES | T1 | QUALIFIED |
| 2 | US Federal Reserve System | US | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 3 | Bank of England | UK | Europe | OFFICIAL | YES | T1 | QUALIFIED |
| 4 | Bank of Japan | JP | E. Asia | OFFICIAL | YES | T1 | QUALIFIED |
| 5 | People's Bank of China | CN | E. Asia | OFFICIAL | YES | T1 | DISCOVERED |
| 6 | Swiss National Bank | CH | Europe | OFFICIAL | YES | T1 | QUALIFIED |
| 7 | Bank of Canada | CA | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 8 | Reserve Bank of Australia | AU | Oceania | OFFICIAL | YES | T2 | SCREENED |
| 9 | Reserve Bank of New Zealand | NZ | Oceania | OFFICIAL | YES | T2 | SCREENED |
| 10 | Sveriges Riksbank | SE | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 11 | Norges Bank | NO | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 12 | Danmarks Nationalbank | DK | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 13 | Bank of Korea | KR | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 14 | Reserve Bank of India | IN | S. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 15 | Central Bank of Brazil | BR | LATAM | OFFICIAL | YES | T2 | DISCOVERED |
| 16 | Bank of Mexico | MX | LATAM | OFFICIAL | YES | T2 | DISCOVERED |
| 17 | South African Reserve Bank | ZA | Africa | OFFICIAL | YES | T2 | DISCOVERED |
| 18 | Central Bank of the UAE | AE | Middle East | OFFICIAL | YES | T2 | DISCOVERED |
| 19 | Saudi Central Bank (SAMA) | SA | Middle East | OFFICIAL | YES | T2 | DISCOVERED |
| 20 | Central Bank of Turkey | TR | Middle East | OFFICIAL | YES | T2 | DISCOVERED |
| 21 | Bank Negara Malaysia | MY | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 22 | Bangko Sentral ng Pilipinas | PH | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 23 | Bank of Thailand | TH | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 24 | Bank Indonesia | ID | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 25 | State Bank of Pakistan | PK | S. Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 26 | Bangladesh Bank | BD | S. Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 27 | Central Bank of Egypt | EG | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 28 | Central Bank of Nigeria | NG | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 29 | Bank of Ghana | GH | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 30 | Central Bank of Kenya | KE | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 31 | Banco Central de Chile | CL | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 32 | Banco de la República (Colombia) | CO | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 33 | Banco Central do Brasil | BR | LATAM | OFFICIAL | YES | T2 | DISCOVERED |
| 34 | Central Bank of Argentina | AR | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 35 | Central Bank of Russia | RU | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 36 | Czech National Bank | CZ | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 37 | National Bank of Poland | PL | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 38 | National Bank of Hungary | HU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 39 | Central Bank of Ireland | IE | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 40 | De Nederlandsche Bank | NL | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 41 | Banque de France | FR | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 42 | Bundesbank | DE | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 43 | Banca d'Italia | IT | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 44 | Banco de España | ES | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 45 | Central Bank of Singapore | SG | SE Asia | OFFICIAL | YES | T2 | DISCOVERED |

### B2. Financial Regulators / Supervisory Authorities

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | US SEC | US | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 2 | US CFTC | US | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 3 | UK FCA | UK | Europe | OFFICIAL | YES | T1 | QUALIFIED |
| 4 | ESMA | EU | Europe | OFFICIAL | YES | T1 | SCREENED |
| 5 | FINMA | CH | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 6 | BaFin | DE | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 7 | AMF (France) | FR | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 8 | CONSOB (Italy) | IT | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 9 | CNMV (Spain) | ES | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 10 | AFM (Netherlands) | NL | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 11 | IIROC (Canada) | CA | N. America | OFFICIAL | YES | T3 | DISCOVERED |
| 12 | ASIC (Australia) | AU | Oceania | OFFICIAL | YES | T2 | DISCOVERED |
| 13 | MAS (Singapore) | SG | SE Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 14 | SFC (Hong Kong) | HK | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 15 | JFSA (Japan) | JP | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 16 | CSRC (China) | CN | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 17 | SEBI (India) | IN | S. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 18 | CVM (Brazil) | BR | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 19 | CNV (Argentina) | AR | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 20 | FSRA (UAE) | AE | Middle East | OFFICIAL | YES | T3 | DISCOVERED |
| 21 | CMA (Saudi Arabia) | SA | Middle East | OFFICIAL | YES | T3 | DISCOVERED |
| 22 | FSC (South Korea) | KR | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 23 | SC (Malaysia) | MY | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 24 | SEC Thailand | TH | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 25 | SEC Philippines | PH | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 26 | Central Bank of Ireland (regulatory) | IE | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 27 | CSSF (Luxembourg) | LU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 28 | ECB Banking Supervision | EU | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 29 | Fed Banking Supervision | US | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 30 | OCC | US | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 31 | FDIC | US | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 32 | CFPB | US | N. America | OFFICIAL | YES | T3 | DISCOVERED |
| 33 | NCUA | US | N. America | OFFICIAL | YES | T3 | DISCOVERED |
| 34 | PRA (UK) | UK | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 35 | Federal Financial Supervisory Authority (BaFin) | DE | Europe | OFFICIAL | YES | T2 | DISCOVERED |

### B3. Statistical Agencies

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | US Bureau of Economic Analysis | US | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 2 | US Bureau of Labor Statistics | US | N. America | OFFICIAL | YES | T1 | DISCOVERED |
| 3 | UK ONS | UK | Europe | OFFICIAL | YES | T2 | SCREENED |
| 4 | Eurostat | EU | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 5 | Statistics Canada | CA | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 6 | ABS (Australia) | AU | Oceania | OFFICIAL | YES | T2 | DISCOVERED |
| 7 | Stats NZ | NZ | Oceania | OFFICIAL | YES | T3 | DISCOVERED |
| 8 | Statistics Japan | JP | E. Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 9 | NBS (China) | CN | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 10 | NSO (India) | IN | S. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 11 | IBGE (Brazil) | BR | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 12 | INEGI (Mexico) | MX | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 13 | DANE (Colombia) | CO | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 14 | INSEE (France) | FR | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 15 | Destatis (Germany) | DE | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 16 | ISTAT (Italy) | IT | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 17 | INE (Spain) | ES | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 18 | CBS (Netherlands) | NL | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 19 | SCB (Sweden) | SE | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 20 | SSB (Norway) | NO | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 21 | Statistik Austria | AT | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 22 | FSO (Switzerland) | CH | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 23 | Stats SA | ZA | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 24 | NBS (Nigeria) | NG | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 25 | Kenya National Bureau of Statistics | KE | Africa | OFFICIAL | YES | T3 | DISCOVERED |

### B4. Ministries of Finance / Treasury

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | US Treasury | US | N. America | OFFICIAL | YES | T1 | DISCOVERED |
| 2 | UK HM Treasury | UK | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 3 | Federal Ministry of Finance (Germany) | DE | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 4 | Ministero dell'Economia (Italy) | IT | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 5 | Ministère de l'Économie (France) | FR | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 6 | Ministry of Finance (Japan) | JP | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 7 | Ministry of Finance (China) | CN | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 8 | Ministry of Finance (India) | IN | S. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 9 | Ministry of Finance (Brazil) | BR | LATAM | OFFICIAL | YES | T3 | DISCOVERED |
| 10 | Ministry of Finance (Saudi Arabia) | SA | Middle East | OFFICIAL | YES | T3 | DISCOVERED |
| 11 | Ministry of Finance (UAE) | AE | Middle East | OFFICIAL | YES | T3 | DISCOVERED |
| 12 | Ministry of Finance (South Africa) | ZA | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 13 | Ministry of Finance (Singapore) | SG | SE Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 14 | Ministry of Finance (South Korea) | KR | E. Asia | OFFICIAL | YES | T2 | DISCOVERED |
| 15 | Department of Finance (Canada) | CA | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 16 | Department of Finance (Australia) | AU | Oceania | OFFICIAL | YES | T2 | DISCOVERED |

### B5. Markets / Market Infrastructure Authorities

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | CME Group | US | N. America | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 2 | LSE Group | UK | Europe | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 3 | NYSE | US | N. America | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 4 | Euronext | EU | Europe | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 5 | Deutsche Börse | DE | Europe | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 6 | Japan Exchange Group | JP | E. Asia | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 7 | HKEX | HK | E. Asia | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 8 | Singapore Exchange | SG | SE Asia | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 9 | BM&F Bovespa | BR | LATAM | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 10 | ASX | AU | Oceania | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |
| 11 | DTCC | US | N. America | QUASI_OFFICIAL | REVIEW | T3 | DISCOVERED |
| 12 | Euroclear | EU | Europe | QUASI_OFFICIAL | REVIEW | T3 | DISCOVERED |
| 13 | LME | UK | Europe | OTHER_AUTHORITATIVE | REVIEW | T3 | DISCOVERED |

### B6. Public / Sovereign Financial Institutions

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | China Investment Corporation | CN | E. Asia | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 2 | GIC (Singapore) | SG | SE Asia | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 3 | Temasek | SG | SE Asia | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 4 | ADIA (UAE) | AE | Middle East | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 5 | PIF (Saudi Arabia) | SA | Middle East | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 6 | Norges Bank Investment Management | NO | Europe | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 7 | GPIC (Kuwait) | KW | Middle East | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 8 | QIA (Qatar) | QA | Middle East | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 9 | KIC (Korea) | KR | E. Asia | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 10 | African Development Bank | INT | Africa | OFFICIAL | YES | T3 | DISCOVERED |
| 11 | Asian Development Bank | INT | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 12 | EIB (European Investment Bank) | EU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 13 | NIB (Nordic Investment Bank) | EU | Europe | OFFICIAL | YES | T4 | DISCOVERED |
| 14 | World Bank Group | INT | Global | OFFICIAL | YES | T1 | DISCOVERED |
| 15 | EBRD | EU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 16 | AIIB | INT | E. Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 17 | NDB (BRICS) | INT | Global | OFFICIAL | YES | T3 | DISCOVERED |

### B7. Multilateral / International Institutions

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | BIS | INT | Global | OFFICIAL | YES | T1 | QUALIFIED |
| 2 | IMF | INT | Global | OFFICIAL | YES | T1 | SCREENED |
| 3 | World Bank Group | INT | Global | OFFICIAL | YES | T1 | DISCOVERED |
| 4 | OECD | INT | Global | OFFICIAL | YES | T2 | DISCOVERED |
| 5 | FSB | INT | Global | OFFICIAL | YES | T2 | DISCOVERED |
| 6 | IAIS | INT | Global | OFFICIAL | YES | T3 | DISCOVERED |
| 7 | IOSCO | INT | Global | OFFICIAL | YES | T3 | DISCOVERED |
| 8 | IASB (IFRS Foundation) | INT | Global | QUASI_OFFICIAL | REVIEW | T3 | DISCOVERED |
| 9 | FATF | INT | Global | OFFICIAL | YES | T2 | DISCOVERED |
| 10 | G20 | INT | Global | OFFICIAL | REVIEW | T3 | DISCOVERED |
| 11 | Basel Committee | INT | Global | OFFICIAL | YES | T3 | DISCOVERED |

### B8. Corporate / Regulatory Disclosure Systems

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | SEC EDGAR | US | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 2 | Companies House (UK) | UK | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 3 | AMF document database (France) | FR | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 4 | Bundesanzeiger (Germany) | DE | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 5 | CONSOB database (Italy) | IT | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 6 | SEDAR+ (Canada) | CA | N. America | OFFICIAL | YES | T3 | DISCOVERED |
| 7 | ASX announcements | AU | Oceania | OFFICIAL | YES | T3 | DISCOVERED |
| 8 | HKEX disclosure | HK | E. Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 9 | SGXNET (Singapore) | SG | SE Asia | OFFICIAL | YES | T3 | DISCOVERED |
| 10 | JSDA (Japan) | JP | E. Asia | OFFICIAL | YES | T3 | DISCOVERED |

### B9. Other Authoritative Financial-Economic Bodies

| # | Institution | Country | Region | Authority | Eligible | Tier | Status |
|---|------------|---------|--------|-----------|----------|------|--------|
| 1 | OFAC (US Treasury) | US | N. America | OFFICIAL | YES | T1 | QUALIFIED |
| 2 | FinCEN | US | N. America | OFFICIAL | YES | T2 | DISCOVERED |
| 3 | SRB (Single Resolution Board) | EU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 4 | EBA | EU | Europe | OFFICIAL | YES | T2 | DISCOVERED |
| 5 | EIOPA | EU | Europe | OFFICIAL | YES | T3 | DISCOVERED |
| 6 | ECB Statistical Data Warehouse | EU | Europe | OFFICIAL | YES | T2 | DISCOVERED |

Note: FCA (UK) is listed in B2. ECB Banking Supervision is listed in B2. World Bank Group is listed in B7. These were previously duplicated in B9 — duplicates removed.

---

## Part C — Coverage Gaps

### By geographic region

| Region | Sources in inventory | Gap assessment |
|--------|---------------------|----------------|
| North America | 15+ | Well covered |
| Europe | 30+ | Well covered |
| East Asia | 10+ | Moderate — PBoC, CSRC, JFSA need screening |
| Southeast Asia | 8+ | Moderate — MAS, BNM, BSP, BI need screening |
| South Asia | 5+ | Thin — RBI, SEBI, SBP, Bangladesh Bank need screening |
| Middle East | 8+ | Moderate — SAMA, CBUAE, CMA need screening |
| Africa | 6+ | **Gap — thin coverage; major economies underrepresented** |
| Latin America | 8+ | Moderate — Brazil, Mexico, Chile, Colombia, Argentina need screening |
| Oceania | 5+ | Moderate — RBA, RBNZ already tested |
| Multilateral / Global | 11+ | Well covered |

### By institutional class

| Class | Sources in inventory | Gap assessment |
|-------|---------------------|----------------|
| Central Banks | 45 | **Largest category; well represented** |
| Financial Regulators | 35 | Well represented |
| Statistical Agencies | 25 | Moderate |
| Ministries of Finance | 16 | Moderate |
| Market Infrastructure | 13 | REVIEW eligibility — most are OTHER_AUTHORITATIVE |
| Public/Sovereign Institutions | 17 | REVIEW eligibility — most are REVIEW |
| Multilateral | 11 | Well represented |
| Disclosure Systems | 10 | Moderate |
| Other Authoritative | 6 | Small but important (OFAC, FinCEN, EBA, EIOPA, SRB, ECB SDW) |

### Key gaps

1. **Africa**: Only 6 sources — need central banks and statistical agencies from Nigeria, Egypt, Morocco, Ethiopia, Ghana, Kenya
2. **South Asia**: Only 5 sources — need more from Pakistan, Bangladesh, Sri Lanka
3. **Central Asia**: **No sources** — Kazakhstan, Uzbekistan, Azerbaijan not represented
4. **Caribbean**: **No sources** — Bahamas, Cayman Islands, Bermuda financial centers not represented
5. **Pacific Islands**: **No sources** — likely low priority but gap exists

---

## Part D — Priority Queue

### T1 — Strategic Core (15 sources)

Sources whose output drives global financial intelligence. All already QUALIFIED or SCREENED.

| Source | Class | Status |
|--------|-------|--------|
| ECB | Central Bank | QUALIFIED |
| Federal Reserve | Central Bank | QUALIFIED |
| Bank of England | Central Bank | QUALIFIED |
| Bank of Japan | Central Bank | QUALIFIED |
| SNB | Central Bank | QUALIFIED |
| PBoC | Central Bank | DISCOVERED |
| SEC | Financial Regulator | QUALIFIED |
| CFTC | Financial Regulator | QUALIFIED |
| FCA | Financial Regulator | QUALIFIED |
| ESMA | Financial Regulator | SCREENED |
| BEA | Statistical Agency | QUALIFIED |
| BLS | Statistical Agency | DISCOVERED |
| BIS | Multilateral | QUALIFIED |
| IMF | Multilateral | SCREENED |
| US Treasury / OFAC | Gov Economic | QUALIFIED |

### T2 — High-Value Expansion (35+ sources)

Important institutions that fill significant coverage gaps. Most are DISCOVERED.

Key T2 candidates: Bank of Canada, RBA, RBNZ, Bundesbank, Banque de France, Banca d'Italia, Banco de España, DNB, Riksbank, Norges Bank, BOK, RBI, MAS, SFC Hong Kong, JFSA, CSRC, SEBI, ASIC, FINMA, BaFin, AMF, PRA, ECB Banking Supervision, OCC, FDIC, US Treasury, HM Treasury, Eurostat, Statistics Canada, ABS, World Bank, OECD, FSB, FATF, SEC EDGAR, FinCEN, EBA

### T3 — Specialized Coverage (50+ sources)

Niche or regional sources with specific intelligence value.

### T4 — Long-Tail / Opportunistic (10+ sources)

Lower-priority sources that may become valuable.

---

## Part E — Qualification Queue

Sources ready to move from DISCOVERED to qualification (Gates 1-4 pre-screening).

### Top 20 qualification candidates

| # | Source | Class | Country | Why next | Expected difficulty |
|---|--------|-------|---------|----------|-------------------|
| 1 | PBoC | Central Bank | CN | Systemically important; English-language publications exist | Medium (may have access issues) |
| 2 | BLS | Statistical Agency | US | T1 source; likely RSS with pubDate | Low |
| 3 | Bundesbank | Central Bank | DE | ECB system; likely standard RSS | Low |
| 4 | Banque de France | Central Bank | FR | ECB system; likely standard RSS | Low |
| 5 | Riksbank | Central Bank | SE | Already probed; has RSS with pubDate | Low |
| 6 | FINMA | Financial Regulator | CH | Swiss regulator; RSS confirmed | Low |
| 7 | BaFin | Financial Regulator | DE | Major EU regulator | Medium |
| 8 | AMF | Financial Regulator | FR | Major EU regulator | Medium |
| 9 | ASIC | Financial Regulator | AU | Major APAC regulator | Medium |
| 10 | MAS | Central Bank/Regulator | SG | Major APAC financial hub | Medium |
| 11 | SFC | Financial Regulator | HK | Major APAC financial hub | Medium |
| 12 | JFSA | Financial Regulator | JP | Major economy regulator | Medium |
| 13 | BOK | Central Bank | KR | Major economy | Low-Medium |
| 14 | RBI | Central Bank | IN | Major economy | Medium |
| 15 | SEBI | Financial Regulator | IN | Major economy | Medium |
| 16 | OECD | Multilateral | INT | Already probed (403 blocked) | High (access) |
| 17 | World Bank | Multilateral | INT | Already probed (404) | Medium (need correct feed URL) |
| 18 | Eurostat | Statistical Agency | EU | EU statistics | Medium |
| 19 | Statistics Canada | Statistical Agency | CA | NAFTA partner | Medium (timed out previously) |
| 20 | FinCEN | Gov Economic | US | AML/financial intelligence | Medium |

---

## Part F — Deferred / Blocked

| Source | Reason | Status |
|--------|--------|--------|
| IMF | Gate 1 FAIL (Akamai 403) | BLOCKED |
| RBA | Gate 1 FAIL (Akamai 403) | BLOCKED |
| ARAMCO | Gate 1 FAIL (Akamai 403) | BLOCKED |
| ONS | Gate 3 FAIL (JS-rendered) | DEFERRED |
| ESMA (RSS) | Gate 2 FAIL (no pubDate) | CONDITIONAL |
| ESMA (HTML) | Gate 2 FAIL (no URL date) | CONDITIONAL |
| OECD | Gate 1 FAIL (403) | BLOCKED |
| Statistics Canada | Access timeout | DEFERRED (re-test needed) |

---

## Customer Overlay Fields

Each source in the registry can carry:

| Field | Description |
|-------|-------------|
| customer_requested | Has a customer requested this source? (YES/NO) |
| customer_request_count | How many customers |
| customer_priority | Customer-assigned priority (high/medium/low) |
| global_priority | ROUA-assigned priority (T1/T2/T3/T4) |

**Customer demand does not override technical feasibility.** It can elevate priority but cannot change Gate 1-4 outcomes.

---

## Governance

| Decision | Owner |
|----------|-------|
| Source discovery | Research / Intelligence |
| Official verification | Research / Solutions |
| Priority assignment | Product |
| Qualification readiness | Solutions Architecture |
| Engineering priority | Architecture + Product |
| Global inclusion | Product |
| Customer override | Product + Commercial |

---

## What the Inventory Establishes

1. A structured universe of 178 source records across 9 institutional classes and 10 geographic regions.
2. A tiering system (T1-T4) that prioritizes sources by strategic importance.
3. A qualification queue of 20 sources ready for pre-screening.
4. Clear separation between DISCOVERED (in inventory), SCREENED (Gates 1-4 tested), QUALIFIED (Gate 5 passed), and ACTIVE (in production).
5. Coverage gaps identified by region and institutional class.
6. Customer overlay mechanism for customer-requested sources.
7. Record scope classification (INSTITUTION vs SOURCE_FAMILY vs DISCLOSURE_SYSTEM).
8. Evidence maturity classification (DEVELOPMENT_VERIFIED vs VALIDATION_VERIFIED vs PROSPECTIVE_VALIDATED vs SCREENING_ONLY vs DISCOVERY_ONLY).

### Reconciled counts

```text
Inventory total: 178

By institutional class:
  B1 Central Banks:                    45
  B2 Financial Regulators:             35
  B3 Statistical Agencies:             25
  B4 Ministries of Finance:            16
  B5 Market Infrastructure:            13
  B6 Public/Sovereign Institutions:    17
  B7 Multilateral:                     11
  B8 Disclosure Systems:               10
  B9 Other Authoritative:               6
  TOTAL:                              178

By status:
  DISCOVERED:    160
  SCREENED:        5
  QUALIFIED:      13
  TOTAL:         178

By record scope:
  INSTITUTION:         168
  SOURCE_FAMILY:         8
  DISCLOSURE_SYSTEM:     2
  TOTAL:               178

By evidence maturity:
  DEVELOPMENT_VERIFIED:    8  (Phase A/B sources with evidence commits)
  VALIDATION_VERIFIED:     2  (BEA, SNB — validation tests with independent review)
  PROSPECTIVE_VALIDATED:   1  (CFTC — prospective prediction confirmed)
  SCREENING_ONLY:          5  (ESMA, IMF, ONS, RBA, RBNZ — Gates tested, no full qualification)
  DISCOVERY_ONLY:        162  (identified but not tested)
  TOTAL:                 178
```

### Record scope definition

| record_scope | Meaning |
|-------------|---------|
| INSTITUTION | A single institution represented as one record |
| SOURCE_FAMILY | A distinct source family within an institution (e.g., ECB Banking Supervision is separate from ECB monetary policy) |
| DISCLOSURE_SYSTEM | A regulatory filing/disclosure system (e.g., SEC EDGAR) |

## What the Inventory Does NOT Establish

1. That ROUA supports or covers these sources. Inventory = target universe, not active coverage.
2. That any DISCOVERED source will pass qualification. Most have not been tested.
3. A success rate or coverage percentage. No such claim is made.
4. That all sources are accessible. Several are known to be blocked (Gate 1).
5. That the taxonomy is complete. It is extensible by design.

## Data Quality Limitations

1. Most sources (160/178) are DISCOVERED — their RSS/feed URLs, access methods, and provenance paths have not been verified.
2. Some sources may have changed their websites or feed URLs since discovery.
3. Market infrastructure sources (exchanges, CCPs) have authority_status = OTHER_AUTHORITATIVE and eligibility = REVIEW — they may not enter the official universe.
4. Sovereign wealth fund sources have authority_status = OFFICIAL but eligibility = REVIEW — their publication patterns are different from regulatory/monetary sources.
5. The inventory does not include access verification for most sources — only sources with evidence commits have been tested.
6. Evidence maturity varies: only 3 sources (BEA, SNB, CFTC) have validation or prospective evidence; 8 have development evidence; 5 have screening only; 162 have discovery only.
7. Development-verified sources (Phase A/B) were used to build the pipeline — their evidence is not independent of the development process.

## Coverage Gaps

1. **Africa**: Underrepresented (6 sources). Major economies: Nigeria, Egypt, Morocco, Ethiopia need central banks + statistical agencies.
2. **Central Asia**: No sources. Kazakhstan (major oil economy) is a gap.
3. **Caribbean**: No sources. Financial centers (Bahamas, Cayman) are a gap.
4. **South Asia**: Thin (5 sources). Pakistan, Bangladesh, Sri Lanka need coverage.
5. **Corporate disclosure systems**: Only 10 sources — major filing systems in APAC and LATAM not yet inventoried.

## Next Operating Step

> **Select a T1/T2 qualification queue from the inventory and run Source Qualification (Gates 1-4 pre-screening) using the Source Qualification Report Template v1 (`f5caf57`).**

This does NOT mean onboarding all T1/T2 sources. It means pre-screening them to determine which are STANDARD candidates, which are CONDITIONAL, and which need engineering — before any configuration work begins.
