# Source Qualification Record — UK HM Treasury (Prospective v2)

**Source**: HM Treasury (UK)
**Date**: 2026-08-15

---

## Prediction (frozen): UNKNOWN

---

## Gate 1 — Access: PASS
Atom feed at `https://www.gov.uk/government/organisations/hm-treasury.atom` — HTTP 200, 12 KB, 20 entries.

## Gate 2 — Provenance: PASS
Atom `<updated>` present (e.g., "2026-08-14T11:18:04Z") — ISO 8601 with UTC timezone.

## Gate 3 — Content: PASS
Static HTML, 14,150 chars text per article. Contains fiscal policy content.

## Gate 4 — Pattern Category: PASS (candidate)
No existing pattern category clearly matches HM Treasury's content. Content includes:
- Corporate reports (e.g., "Whole of Government Accounts guidance")
- Guidance documents (e.g., "Managing public money")
- Policy papers

Closest pattern categories: `regulatory_patterns` (for fiscal policy) or `statistical_patterns` (for fiscal data). But HM Treasury content is primarily fiscal policy/guidance, not enforcement or statistical releases.

## Content-Path Alignment: ALIGNED
- Selected path: Atom feed at `.atom`
- Expected intelligence: fiscal policy, government spending, budget documents
- Sampled: 3 entries (government accounts guidance, managing public money, country/regional analysis)
- Observed: fiscal policy documents, guidance, corporate reports
- **ALIGNED** — content type matches what the Atom feed contains

## Configuration Contract Verification: NOT COMPATIBLE
- event_type: None of the 6 supported event types clearly matches HM Treasury content:
  - `monetary_policy_decision` — no rate decisions ❌
  - `regulatory_enforcement` — no penalties, defendants ❌
  - `statistical_release` — no inflation/GDP/unemployment ❌
  - `earnings_release` — no revenue/EPS ❌
  - `sanctions_designation` — no SDN designations ❌
  - `market_statistic_release` — no FX/derivatives ❌
- No financial metrics found in sampled content (0 monetary amounts, 0 percentages)
- Content is policy/guidance text without extractable financial metrics matching existing patterns
- Contract compatible: NO

## Semantic Representation Assessment: REPRESENTATION GAP
- Source intelligence type: fiscal policy, government spending guidance, budget documents
- Matching event type: none — no existing event type represents "fiscal policy/government guidance"
- Semantic fit: **REPRESENTATION GAP**
- Confidence: MEDIUM

## QUALIFICATION_READY: NO (Configuration NOT COMPATIBLE + Semantic REPRESENTATION GAP)
## Gate 5: NOT ATTEMPTED

## Routing: ENGINEERING REVIEW
## Root cause: Event-model representation gap — fiscal policy/guidance content has no matching event type
## Engineering: None (routing only)
