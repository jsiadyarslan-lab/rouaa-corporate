# Top 20 Pre-Screening — Index

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: IN PROGRESS — Source #1 (PBoC) complete; sources #2-#20 pending methodology review
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening execution — NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Purpose

Pre-screen the Top 20 DISCOVERY_ONLY sources from Global Qualification Queue v1 against Gates 1-4. This is the first operational use of the Global Source Expansion Model + Qualification Queue + Source Qualification Report at global coverage scale.

The output for each source is a **Source Qualification Record (pre-screening variant)** containing:
- Source identification
- Gate 1 (Access) result
- Gate 2 (Provenance) result
- Gate 3 (Content) result
- Gate 4 (Configuration applicability) result
- Initial routing (QUALIFICATION_READY / NEEDS_CONFIG_INVESTIGATION / KNOWN_BLOCKED)
- Evidence (HTTP responses, HTML metadata, pattern category match)
- Priority retained (Top 20 rank unchanged regardless of pre-screening result)

Gate 5 (first-attempt validation) and downstream sections (Intelligence Quality, Engineering Scope, Commercial Recommendation) are explicitly marked NOT ATTEMPTED — they are reserved for the qualification phase.

---

## Scope Boundaries (per user directive)

This work is:
- ✅ Pre-screening against Gates 1-4
- ✅ Producing per-source Source Qualification Records
- ✅ Documenting evidence and initial routing
- ✅ Updating queue state (DISCOVERY_ONLY → QUALIFICATION_READY or KNOWN_BLOCKED) at batch checkpoints

This work is NOT:
- ❌ Onboarding (no configuration created)
- ❌ Gate 5 (no first-attempt validation run)
- ❌ Configuration (no source config files created)
- ❌ Pipeline modification (no code changes)
- ❌ Contract modification (no Supported Source Contract changes)
- ❌ Website modification (no marketing/coverage claims)
- ❌ Phase C (no commercial scoping)

---

## Output Flow (per user directive)

```text
Source
  → Gate 1 (access path tested)
  → Gate 2 (provenance metadata inspected)
  → Gate 3 (content substance verified)
  → Gate 4 (pattern category matched)
  → Initial routing (QUALIFICATION_READY / NEEDS_CONFIG_INVESTIGATION / KNOWN_BLOCKED)
  → Evidence (HTTP responses, metadata samples, analog references)
  → Priority retained (Top 20 rank unchanged)
```

---

## Methodology

### Per-source probing

1. **Discover access path**: probe common feed paths (`/rss.xml`, `/feed.xml`, `/atom.xml`, `/rss`, `/feed`) and the source's English/primary homepage. The number of probes is calibrated per source based on evidence sufficiency — not a fixed count.
2. **Test Gate 1 (Access)**: HTTP request with browser User-Agent; record HTTP status code, response size, final URL
3. **Test Gate 2 (Provenance)**: inspect HTML `<meta>` tags for `PubDate`/`dc:date`/`createDate`; check URL pattern for embedded timestamps; check feed XML for `<pubDate>` if RSS exists. **If multiple date sources are detected and they do not agree, mark Gate 2 as PASS WITH REVIEW and flag date-source precedence as a routing qualifier.** Do not describe provenance as "unambiguous" or as "redundant sources" when the sources conflict.
4. **Test Gate 3 (Content)**: fetch sample article; verify static HTML contains title + body + metadata; flag JS-rendered pages (static HTML empty)
5. **Assess Gate 4 (Pattern applicability)**: compare content structure to existing proven analogs (BEA `c8af140` statistical_authority, SNB `c09de13` central_bank, CFTC `b4fabe9` financial_regulator). **Gate 4 answers only whether a configuration category is applicable — it does NOT predict engineering effort, source-specific code needs, or Gate 5 outcome. Those are Gate 5 questions.** This preserves the separation between priority / readiness / technical difficulty (per Section 5 of the Queue).
6. **Determine initial routing**:
   - All Gates 1-4 PASS → QUALIFICATION_READY (candidate for standard onboarding)
   - Gates 1, 3, 4 PASS and Gate 2 PASS WITH REVIEW → QUALIFICATION_READY **with routing qualifier** (e.g., `PROVENANCE DATE PRECEDENCE REVIEW`). The qualifier does NOT add a new taxonomic state — it annotates the existing QUALIFICATION_READY classification with an unresolved item that must be addressed during qualification.
   - Gate 1-4 partial PASS, pattern category uncertain → NEEDS_CONFIG_INVESTIGATION
   - Gate 1 FAIL (HTTP 403 source-level) → KNOWN_BLOCKED
   - Gate 1 path-level failure (404, timeout) → SCREENING_ONLY (existing queue state, no promotion)
7. **Document evidence**: HTTP probing log, HTML metadata samples, analog references
8. **Retain priority**: Top 20 rank is preserved regardless of pre-screening result (per Section 5 critical distinctions — qualification priority is independent of technical difficulty)

### Routing qualifier concept

A routing qualifier is an annotation on a QUALIFICATION_READY routing that flags an unresolved item requiring review during qualification (Gate 5) or manual review before onboarding. It does NOT introduce a new routing classification — the routing remains QUALIFICATION_READY. Examples:

- `PROVENANCE DATE PRECEDENCE REVIEW` — multiple date sources detected but they do not agree; which date is the official `document_date` must be resolved
- `PATTERN CATEGORY TENTATIVE` — pattern category match is inferred but not confirmed; Gate 5 will determine if a new pattern category is required

Qualifiers are recorded in the Initial Routing section of each Source Qualification Record and surfaced in the INDEX.md records table.

### Confidence levels

- HIGH = direct evidence from documented Gate 5 test (only available for ALREADY_QUALIFIED sources)
- MEDIUM = pre-screening evidence (Gates 1-4 verified, no Gate 5)
- LOW = inference or unresolved condition

All pre-screening records are MEDIUM confidence by default. HIGH confidence requires Gate 5 first-attempt validation.

---

## Pre-Screening Records

| # | Source | Country | Tier | Class | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Routing | Confidence | Record |
|---|--------|---------|------|-------|--------|--------|--------|--------|---------|------------|--------|
| 1 | People's Bank of China | CN | T1 | Central Bank | PASS | PASS WITH REVIEW | PASS | PASS | QUALIFICATION_READY (provenance date precedence review) | MEDIUM | `SQR_PBOC_PRESCREENING.md` |
| 2 | US Bureau of Labor Statistics | US | T1 | Statistical | FAIL | NOT ATTEMPTED | NOT ATTEMPTED | NOT ASSESSED | KNOWN_BLOCKED | HIGH | `SQR_BLS_PRESCREENING.md` |
| 3 | US Treasury | US | T1 | Ministry of Finance | PASS | PASS | PASS | PASS | QUALIFICATION_READY | MEDIUM | `SQR_US_TREASURY_PRESCREENING.md` |
| 4 | Bundesbank | DE | T2 | Central Bank | PASS | PASS | PASS | PASS | QUALIFICATION_READY | MEDIUM | `SQR_BUNDESBANK_PRESCREENING.md` |
| 5 | Banque de France | FR | T2 | Central Bank | FAIL | NOT ATTEMPTED | NOT ATTEMPTED | NOT ASSESSED | KNOWN_BLOCKED | HIGH | `SQR_BANQUE_DE_FRANCE_PRESCREENING.md` |
| 6 | Banca d'Italia | IT | T2 | Central Bank | PASS | PASS | PASS | PASS | QUALIFICATION_READY | MEDIUM | `SQR_BANCA_D_ITALIA_PRESCREENING.md` |
| 7 | Banco de España | ES | T2 | Central Bank | UNRESOLVED | NOT ATTEMPTED | NOT ATTEMPTED | NOT ASSESSED | SCREENING_ONLY (unresolved access path) | MEDIUM | `SQR_BANCO_DE_ESPANA_PRESCREENING.md` |
| 8 | De Nederlandsche Bank | NL | T2 | Central Bank | FAIL | NOT ATTEMPTED | NOT ATTEMPTED | NOT ASSESSED | KNOWN_BLOCKED | HIGH | `SQR_DNB_PRESCREENING.md` |
| 9 | Danmarks Nationalbank | DK | T2 | Central Bank | PASS | PASS | PASS | PASS | QUALIFICATION_READY | MEDIUM | `SQR_DANMARKS_NATIONALBANK_PRESCREENING.md` |
| 10 | Bank of Korea | KR | T2 | Central Bank | PASS | PASS | PASS | PASS | QUALIFICATION_READY | MEDIUM | `SQR_BANK_OF_KOREA_PRESCREENING.md` |
| 11 | Reserve Bank of India | IN | T2 | Central Bank | — | — | — | — | PENDING | — | — |
| 12 | Banco Central do Brasil | BR | T2 | Central Bank | — | — | — | — | PENDING | — | — |
| 13 | Bank of Mexico | MX | T2 | Central Bank | — | — | — | — | PENDING | — | — |
| 14 | South African Reserve Bank | ZA | T2 | Central Bank | — | — | — | — | PENDING | — | — |
| 15 | MAS (Singapore) | SG | T2 | Central Bank/Regulator | — | — | — | — | PENDING | — | — |
| 16 | SFC (Hong Kong) | HK | T2 | Financial Regulator | — | — | — | — | PENDING | — | — |
| 17 | JFSA (Japan) | JP | T2 | Financial Regulator | — | — | — | — | PENDING | — | — |
| 18 | BaFin | DE | T2 | Financial Regulator | — | — | — | — | PENDING | — | — |
| 19 | AMF (France) | FR | T2 | Financial Regulator | — | — | — | — | PENDING | — | — |
| 20 | ASIC (Australia) | AU | T2 | Financial Regulator | — | — | — | — | PENDING | — | — |

---

## Batch Progress

| Batch | Sources | Status |
|-------|---------|--------|
| Batch 1 (Source #1: PBoC) | 1 | COMPLETE — methodology corrected (`d3910da`); user-approved corrected methodology |
| Batch 2 (Sources #2-#5: BLS, US Treasury, Bundesbank, Banque de France) | 4 | COMPLETE — 2 QUALIFICATION_READY (US Treasury, Bundesbank), 2 KNOWN_BLOCKED (BLS, Banque de France) |
| Batch 3 (Sources #6-#10: Banca d'Italia, Banco de España, DNB, Danmarks Nationalbank, Bank of Korea) | 5 | COMPLETE — 3 QUALIFICATION_READY (Banca d'Italia, Danmarks Nationalbank, Bank of Korea), 1 KNOWN_BLOCKED (DNB), 1 SCREENING_ONLY (Banco de España — unresolved access path) |
| Batch 4 (Sources #11-#15) | 5 | NOT STARTED — awaiting user review of Batch 3 |
| Batch 5 (Sources #16-#20) | 5 | NOT STARTED |

---

## Methodology Review Checkpoint

After Source #1 (PBoC), the methodology is paused for user review. The user should assess:

1. **Record format** — Is the Source Qualification Record structure (Source → Gate 1 → Gate 2 → Gate 3 → Gate 4 → Initial routing → Evidence → Priority retained) aligned with the user's directive?
2. **Probing depth** — Is the level of HTTP probing and HTML metadata inspection appropriate for pre-screening (vs. too shallow or too deep)?
3. **Routing taxonomy** — Are the three routing options (QUALIFICATION_READY / NEEDS_CONFIG_INVESTIGATION / KNOWN_BLOCKED) the right set, or should additional states be considered?
4. **Confidence calibration** — Is MEDIUM confidence (pre-screening without Gate 5) the right default, or should it be calibrated differently?
5. **Scope boundaries** — Are the NOT-ONBOARDING / NOT-GATE-5 / NOT-CONFIGURATION boundaries clearly enforced in the record?
6. **Batch pace** — Is the batch pace (1 source first, then 4-5 per batch) appropriate, or should it be adjusted?

After user review, batches 2-5 will be executed sequentially with the same methodology.

---

## Queue State Update Plan

Individual pre-screening records do NOT modify the Queue v1 FROZEN baseline. Queue state transitions (DISCOVERY_ONLY → QUALIFICATION_READY or KNOWN_BLOCKED) will be applied as a separate documentation commit AFTER the user reviews Batch 1 and approves the methodology.

This separation preserves the FROZEN baseline as a stable reference and prevents incremental edits from invalidating the audit trail.

---

## What This Pre-Screening Is NOT

- NOT a qualification decision (only a routing recommendation)
- NOT a Gate 5 first-attempt validation (no pipeline run)
- NOT a configuration creation (no source config files)
- NOT a coverage claim (sources remain DISCOVERY_ONLY in the queue until state update)
- NOT a marketing claim (pre-screening results are internal)
- NOT a success rate (sample too small per Governance Rule 10)

---

## Linked Artifacts

| Artifact | Commit | Role |
|----------|--------|------|
| Global Source Universe v1 | `8b1e7b4` | Source inventory baseline (178 records) |
| Global Qualification Queue v1 | `92b6c4f` | Queue baseline (FROZEN — Top 20 source of truth) |
| Global Source Expansion Model v1 | `93de30c` | Strategic framework for global coverage |
| Source Qualification Report Template v1 | `f5caf57` | Operational record format |
| Commercial Source Qualification Model v1 | `f99e894` | Qualification decision framework |
| Onboarding Boundary Analysis v1 | `5d4cef4` | 5-gate framework definition |
| Evidence Matrix V3 | `7384033` | Evidence standards |
