# Prospective v2 Operational Run — 5 Sources — Frozen Predictions

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Pre-Screening Methodology v2 (FROZEN — `bda3ffb`), SQR Template v2 (FROZEN — `a62ad65`)
**Type**: Prospective v2 operational validation — predictions frozen before probing.

---

## Selected Sources

| # | Source | Country | Class | Region | Domain | Access check | RSS/Atom | Case type |
|---|--------|---------|-------|--------|--------|---------------|----------|-----------|
| 1 | PRA (UK) | UK | Financial Regulator | Europe | bankofengland.co.uk | 200 (97 KB) | RSS found (/rss/prudential-regulation-publications) | STANDARD candidate |
| 2 | Eurostat | EU | Statistical | Europe | ec.europa.eu | 200 (241 KB) | No standard RSS; news listing at /eurostat/news | Content-Path Review candidate |
| 3 | INSEE (France) | FR | Statistical | Europe | insee.fr | 200 (63 KB French; /en returns 500) | No RSS found on homepage | Provenance Review candidate |
| 4 | FSB | INT | Multilateral | Global | fsb.org | 200 (432 KB) | RSS found (/feed/) | Representation Gap candidate |
| 5 | UK HM Treasury | UK | Ministry of Finance | Europe | gov.uk | 200 (125 KB) | Atom found (.atom) | Untested class variant |

---

## Frozen Predictions (NOT PASS/FAIL — operational scenarios only)

### Source 1: PRA (UK)

| Field | Value |
|-------|-------|
| Expected class | `financial_regulator` |
| Expected intelligence candidate | `regulatory_enforcement` (PRA enforcement actions) |
| Expected content type | Prudential regulation publications, policy statements |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` (enforcement/regulatory content → regulatory_enforcement) |
| Expected outcome | **UNKNOWN** |
| Operational scenario | STANDARD candidate — if content path aligns with enforcement patterns and event type matches, this could produce publishable IOs. However, PRA's RSS feed appears to contain general prudential publications (roundtables, digests, policy statements), not enforcement orders. This may result in content-path mismatch. |
| No assumptions | No assumption on whether PRA's RSS contains enforcement-specific content vs general regulatory publications |

### Source 2: Eurostat

| Field | Value |
|-------|-------|
| Expected class | `statistical_authority` |
| Expected intelligence candidate | `statistical_release` (economic indicators) |
| Expected content type | Statistical news releases (asylum applications, GDP, inflation, employment) |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` (statistical releases → statistical_release event type) |
| Expected outcome | **UNKNOWN** |
| Operational scenario | Content-Path Review candidate — Eurostat's news listing contains mixed content (asylum applications, economic indicators, policy documents). The selected path may contain content that doesn't match statistical_patterns. No standard RSS feed found; HTML index access path needed. |
| No assumptions | No assumption on whether the news listing path contains content matching statistical_patterns |

### Source 3: INSEE (France)

| Field | Value |
|-------|-------|
| Expected class | `statistical_authority` |
| Expected intelligence candidate | `statistical_release` (French economic indicators) |
| Expected content type | Statistical press releases, economic data |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` (statistical releases → statistical_release) |
| Expected outcome | **UNKNOWN** |
| Operational scenario | Provenance Review candidate — INSEE's English site returns 500; French site accessible. Provenance metadata may be in French format or unusual paths. No RSS found. Content may require French-language handling. |
| No assumptions | No assumption on provenance availability, date format, or content language |

### Source 4: FSB

| Field | Value |
|-------|-------|
| Expected class | `multilateral` (UNTESTED in v2) |
| Expected intelligence candidate | Unknown — FSB publishes financial stability reports, policy documents, press releases |
| Expected content type | Policy papers, press releases, meeting statements |
| Expected semantic representation | `UNKNOWN` — no existing event type clearly matches FSB's content type |
| Expected outcome | **UNKNOWN** |
| Operational scenario | Representation Gap candidate — FSB is the first Multilateral source tested. Its content (financial stability reports, policy recommendations, international coordination) may not fit any of the 6 existing event types. RSS feed available with `<pubDate>`. |
| No assumptions | No assumption on whether any existing event type can represent FSB's intelligence |

### Source 5: UK HM Treasury

| Field | Value |
|-------|-------|
| Expected class | `ministry_of_finance` |
| Expected intelligence candidate | Unknown — UK HM Treasury publishes fiscal policy, budget documents, consultations |
| Expected content type | Policy papers, press releases, consultations, corporate reports |
| Expected semantic representation | `UNKNOWN` — US Treasury's content-path mismatch showed that Ministry of Finance content may not match expected patterns |
| Expected outcome | **UNKNOWN** |
| Operational scenario | Untested class variant — US Treasury failed with content-path mismatch (press releases ≠ sanctions). UK HM Treasury has a different content structure (gov.uk Atom feed with mixed content types). May face similar content-path or representation challenges. |
| No assumptions | No assumption on content type alignment or event model compatibility |

---

## Prediction Discipline

All predictions are **UNKNOWN** — no PASS/FAIL assumptions are made. The operational scenarios describe what *might* happen based on the source's known characteristics, not what *will* happen. The results will be evidence-driven.

No source is assumed to succeed. No source is assumed to fail. The v2 methodology will be applied stage by stage, and the result at each stage will determine the next.

---

## Constraints

- No modifications to: SQR v2 (FROZEN), Pre-Screening Methodology v2 (FROZEN), Queue, pipeline, config, Contract, website
- No remediation during any source attempt
- No engineering intervention
- No success rate calculation (n=5 is not valid for statistics)
- No comparison between sources as a success-rate calculation
- Predictions frozen before full probing; only quick access checks performed to confirm source reachability
