# Source Qualification Record — INSEE (Prospective v2)

**Source**: Institut national de la statistique et des études économiques (INSEE)
**Date**: 2026-08-15

---

## Prediction (frozen): UNKNOWN

---

## Gate 1 — Access: PASS
French homepage `https://www.insee.fr/` — HTTP 200, 63 KB. English site `https://www.insee.fr/en/statistics` — HTTP 500 (server error). Statistics page `/fr/statistiques` — HTTP 200, 62 KB. No RSS found.

## Gate 2 — Provenance: PASS (WITH REVIEW)
Sampled article `/fr/information/1302181` — one date found: "15/01/2024" (French format DD/MM/YYYY). Date is in content text, not in metadata tags or URL pattern. Date format is French (DD/MM/YYYY) — parseable but requires French date parsing logic.

## Gate 3 — Content: PASS
Static HTML, 7,976 chars text. Content is primarily in French (INSEE is the French statistical agency). Statistical content present.

## Gate 4 — Pattern Category: PASS
`statistical_patterns` candidate (statistical authority class; analog: BEA — ALREADY_QUALIFIED).

## Content-Path Alignment: ALIGNED
- Selected path: `/fr/statistiques` (French statistics listing)
- Expected intelligence: statistical releases (French economic indicators)
- Sampled: 3 document links from statistics page
- Observed: French statistical content (economic data, demographic statistics)
- **ALIGNED** — content type matches expected intelligence (in French language)

## Configuration Contract Verification: NOT COMPATIBLE
- event_type: `statistical_release` (supported ✅)
- Pattern metrics (proposed): `inflation_rate`, `gdp_growth`, `unemployment_rate`, `statistic_value`, `percentage_statistic`
- All in `PATTERN_TYPE_METADATA` ✅; all in `statistical_release.trigger_metrics` ✅
- BUT: content_keywords for HTML index — generic title would be "INSEE Action" — keywords ["statistique", "économie", "inflation", "INSEE"] — "INSEE" matches generic title ✅
- Contract compatible: YES (static checks pass)

Wait — the static contract checks pass. The issue is NOT contract compatibility but language:
- Content is in French
- Patterns are written for English (e.g., "inflation rate was X%", "GDP grew by X%")
- French content uses "taux d'inflation", "PIB", "croissance"
- The patterns will NOT match French-language content

This is a **semantic/language representation issue**, not a contract compatibility issue. The contract checks pass (event_type supported, metrics in trigger_metrics). But the patterns themselves are English-only and will not extract facts from French content.

## Semantic Representation Assessment: REPRESENTATION GAP
- Source intelligence type: French-language statistical releases
- Matching event type: `statistical_release` (semantically compatible)
- BUT: existing patterns are English-only; French content requires French-language patterns
- This is NOT a config fixable issue (adding French patterns requires new regex patterns in a new language — this is configuration extension, not a one-line fix)
- Semantic fit: **REPRESENTATION GAP** — the event model can represent the intelligence type, but the extraction patterns cannot handle the language
- Confidence: MEDIUM

## QUALIFICATION_READY: NO (Semantic = REPRESENTATION GAP)
## Gate 5: NOT ATTEMPTED

## Routing: ENGINEERING REVIEW
- Event model is compatible (statistical_release fits semantically)
- But pattern language coverage gap requires configuration extension (French patterns)
- No engineering work package executed — evidence-supported routing

## Root cause: Language coverage gap — existing patterns are English-only; INSEE content is primarily in French
## Engineering: None (routing only)
