# Prospective v2 Replication Batch — 3 Sources — Frozen Predictions

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Pre-Screening Methodology v2 (FROZEN — `bda3ffb`), SQR Template v2 (FROZEN — `a62ad65`)
**Type**: Prospective v2 replication — seeking independent replications of QUALIFICATION_READY → Gate 5 path.

---

## Objective

Test whether v2's QUALIFICATION_READY → Gate 5 PASS path replicates on sources not involved in v2 design. This batch seeks independent replications, not a success rate.

---

## Selected Sources

| # | Source | Country | Class | Domain | Access | Feed | Expected event type |
|---|--------|---------|-------|--------|--------|------|---------------------|
| 1 | Fed Banking Supervision | US | Financial Regulator | federalreserve.gov | 200 (85 KB) | RSS (/feeds/press_all.xml — already confirmed contains enforcement actions) | regulatory_enforcement |
| 2 | ABS (Australia) | AU | Statistical | abs.gov.au | 200 (104 KB) | HTML index (no RSS; /statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release) | statistical_release |
| 3 | TCMB (Turkey) | TR | Central Bank | tcmb.gov.tr | 200 (78 KB) | HTML index (/wps/wcm/connect/EN/TCMB+EN/Main+Menu/Announcements/Press+Releases/) | monetary_policy_decision |

---

## Frozen Predictions (all UNKNOWN)

### Source 1: Fed Banking Supervision (FED_ENF)

| Field | Value |
|-------|-------|
| Expected class | `financial_regulator` |
| Expected intelligence candidate | `regulatory_enforcement` |
| Expected content type | Fed enforcement actions (cease & desist, penalties, individual prohibitions) |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` |
| Expected outcome | **UNKNOWN** |
| Note | FED is ALREADY_QUALIFIED with monetary_policy_decision event_type. This config uses the SAME RSS feed but with regulatory_enforcement event_type and regulatory_patterns — extracting a DIFFERENT intelligence type from the same source. This tests whether v2 can handle multiple intelligence types from one institution. |

### Source 2: ABS (Australia)

| Field | Value |
|-------|-------|
| Expected class | `statistical_authority` |
| Expected intelligence candidate | `statistical_release` |
| Expected content type | CPI, inflation, GDP, employment statistics |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` |
| Expected outcome | **UNKNOWN** |
| Note | ABS publishes statistical releases in English (CPI 3.8%, 4.0%, etc.). No RSS found — HTML index path needed. Content is rich with percentages and statistical keywords. |

### Source 3: TCMB (Turkey)

| Field | Value |
|-------|-------|
| Expected class | `central_bank` |
| Expected intelligence candidate | `monetary_policy_decision` |
| Expected content type | Interest rate decisions, monetary policy press releases |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` |
| Expected outcome | **UNKNOWN** |
| Note | TCMB publishes press releases with monetary policy content (interest rates, inflation). HTML index path with press releases listed. English version available. No RSS found. |

---

## Prediction Discipline

All predictions = UNKNOWN. No PASS/FAIL assumptions. The test scenarios describe what *might* happen based on quick access checks and content sampling, not what *will* happen.

No source is assumed to succeed or fail. The v2 methodology will be applied stage by stage.

---

## Constraints

- No modifications to: SQR v2, Pre-Screening Methodology v2, Queue, pipeline, config, Contract, website
- No remediation during any source attempt
- No engineering intervention
- No success rate calculation
- No comparison between sources as success-rate calculation
