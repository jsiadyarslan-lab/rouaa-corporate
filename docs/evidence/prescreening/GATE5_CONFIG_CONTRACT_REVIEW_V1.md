# Gate 5 Configuration Contract Review v1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Gate 5 re-run at `f7004ac`, corrected at `4a6e252`
**Type**: Static review of 5 source configs against pipeline contract — NO new pipeline runs, NO code changes.

---

## Purpose

Answer 5 contract questions for each of the 5 Gate 5 source configurations, *without running the pipeline again*, to determine whether the Gate 5 failures were caused by:

- **Configuration authoring issues** (fixable by rewriting the config correctly)
- **Pipeline behavior boundaries** (fixable by pipeline changes, not config)
- **Architecture gaps** (requiring new event types or structural changes)

Only after this review can we determine whether to:
1. Rewrite configs and re-run Gate 5 (if authoring issues)
2. Adjust pipeline behavior (if behavior boundaries)
3. Redefine the qualification model (if architecture gaps)

---

## Pipeline Contract (from `detector.py` and `fetcher.py`)

### Supported event types and their trigger_metrics

```text
Event Type                    Trigger Metrics
────────────────────────       ──────────────────────────────────────────────────────
monetary_policy_decision       rate_decision, policy_rate, policy_rate_range
regulatory_enforcement         penalty_amount, defendant_name, action_type, violation_type
statistical_release            inflation_rate, gdp_growth, unemployment_rate,
                              employment_level, statistic_value, percentage_statistic,
                              cross_border_change, usd_amount
earnings_release               revenue, eps, net_income, gross_margin,
                              yoy_change, dividend_amount, total_assets
sanctions_designation          designated_entity, designated_country,
                              sanctions_program, action_type, faq_topic
market_statistic_release       fx_turnover, ird_turnover, cds_turnover,
                              usd_amount, percentage_change
```

### Content keywords filtering behavior

The fetcher applies `content_keywords` filtering **after** parsing the feed/index but **before** fetching full content for each document.

- **For RSS sources**: `is_relevant_content()` checks `title + content_text` (RSS description). If keywords match the RSS title/description, the document is kept.
- **For HTML index sources**: `parse_html_index()` creates documents with generic titles (e.g., `"BANCA_D_ITALIA Action"` or `"BANCA_D_ITALIA Action 2026-08-14"`) and empty `content_text`. Then `is_relevant_content()` checks `generic_title + ""`. If no keyword matches the generic title, **all documents are discarded**.

### Event detection logic

`detect_event()` requires:
1. The `configured_event_type` must exist in `EVENT_TYPE_RULES` (or it falls back to `monetary_policy_decision`)
2. At least one extracted fact's `metric` must be in the event type's `trigger_metrics` set
3. If no triggering facts are found, `detect_event()` returns `None` (no event)

---

## Per-Source Contract Review

### Source 1: US Treasury

| # | Contract question | Answer |
|---|-------------------|--------|
| 1 | Is the `event_type` supported? | ❌ NO — `"regulatory_publication"` is not in `EVENT_TYPE_RULES` |
| 2 | Does at least one extracted metric belong to a supported event type's `trigger_metrics`? | ✅ YES — `designated_entity`, `sanctions_program`, `action_type` → matches `sanctions_designation.trigger_metrics`; `penalty_amount`, `action_type` → matches `regulatory_enforcement.trigger_metrics`; `usd_amount` → matches `statistical_release` and `market_statistic_release` |
| 3 | Are `content_keywords` compatible with HTML index title behavior? | ✅ YES — `"Treasury"` matches `"US_TREASURY Action"` generic title |
| 4 | Can extracted facts reach event detection without core-code changes? | ✅ YES — if `event_type` is changed to `"sanctions_designation"` or `"regulatory_enforcement"`, the trigger metrics match |
| 5 | Can the resulting event reach evidence/IO? | ⚠️ UNTESTED — never reached because `event_type` doesn't match; but trigger metrics are present, so with correct `event_type` it should work |

**Classification**: **Configuration authoring issue**. The patterns and keywords are correctly authored; the `event_type` should be `"sanctions_designation"` (for OFAC-style sanctions content) or `"regulatory_enforcement"` (for penalty/enforcement content). No architecture gap — the detector already supports these event types and the extracted metrics match their triggers.

**Fix needed**: Change `event_type` from `"regulatory_publication"` to `"sanctions_designation"` (or `"regulatory_enforcement"`). This is a one-line config change, not a code change.

---

### Source 2: Bundesbank

| # | Contract question | Answer |
|---|-------------------|--------|
| 1 | Is the `event_type` supported? | ❌ NO — `"securities_auction"` is not in `EVENT_TYPE_RULES` |
| 2 | Does at least one extracted metric belong to a supported event type's `trigger_metrics`? | ❌ NO — extracted metrics are `eur_amount`, `securities_type`, `auction_amount`, `yield_value`. None of these appear in ANY supported event type's `trigger_metrics`. The closest event type (`statistical_release`) expects `usd_amount`, not `eur_amount`; and does not have `securities_type`, `auction_amount`, or `yield_value` in its triggers. |
| 3 | Are `content_keywords` compatible with RSS feed behavior? | ✅ YES — RSS titles contain actual article titles (e.g., "Invitation to bid – Federal Treasury discount paper (Bubills)") which match keywords like "auction", "Federal", "securities", "bond", "Bubills", "Bundesbank" |
| 4 | Can extracted facts reach event detection without core-code changes? | ❌ NO — even if `event_type` is changed to `"statistical_release"` or `"market_statistic_release"`, the extracted metrics (`eur_amount`, `securities_type`, `auction_amount`, `yield_value`) are NOT in the trigger_metrics of any supported event type. The detector would find 0 triggering facts. |
| 5 | Can the resulting event reach evidence/IO? | ❌ NO — without triggering facts, no event is detected |

**Classification**: **Configuration contract gap (pattern-metric → event-trigger mismatch)**. The patterns extract real facts (EUR amounts, securities types, auction amounts, yields), but the metrics they produce are NOT registered as trigger metrics in any supported event type. This is NOT fixable by changing `event_type` alone — the pattern metrics themselves don't match any event model's triggers.

**Two possible paths**:
- **Path A (config fix)**: Rewrite the patterns to produce metrics that ARE in trigger_metrics (e.g., use `usd_amount` instead of `eur_amount`; or use `percentage_change` for yield changes). This would make the patterns match `statistical_release` or `market_statistic_release` triggers. But this may lose semantic accuracy (EUR ≠ USD).
- **Path B (model extension)**: Add `eur_amount`, `securities_type`, `auction_amount`, `yield_value` to an existing event type's `trigger_metrics`, or add a new event type `"securities_auction"` with these triggers. This is data-driven (add to `EVENT_TYPE_RULES` dict, no code changes), but it IS a model extension, not just config.

**This is the clearest case of a genuine gap** between what the source produces and what the pipeline can classify. Whether this is "config authoring" or "architecture" depends on whether Path A is acceptable (rewrite patterns to use existing metrics) or Path B is needed (extend the event model).

---

### Source 3: Banca d'Italia

| # | Contract question | Answer |
|---|-------------------|--------|
| 1 | Is the `event_type` supported? | ❌ NO — `"securities_auction"` is not in `EVENT_TYPE_RULES` |
| 2 | Does at least one extracted metric belong to a supported event type's `trigger_metrics`? | ❌ NO — same as Bundesbank: `eur_amount`, `securities_type`, `auction_amount`, `yield_value` are not in any trigger_metrics set |
| 3 | Are `content_keywords` compatible with HTML index title behavior? | ❌ NO — keywords are `["BOT", "BTP", "CCTeu", "auction", "asta", "Treasury"]`. Generic title is `"BANCA_D_ITALIA Action"`. NONE of the keywords match the generic title. **All documents are discarded by the content_keywords filter before content fetch.** |
| 4 | Can extracted facts reach event detection without core-code changes? | ❌ NO — documents never reach extraction (filtered out at step 3) |
| 5 | Can the resulting event reach evidence/IO? | ❌ NO — no documents, no facts, no events |

**Classification**: **Two distinct issues**:
1. **Pipeline behavior boundary**: HTML index documents receive generic titles; content_keywords filtering discards them before content fetch. This is NOT a config authoring issue in the simple sense — it's a pipeline interaction between `parse_html_index()` (generic title generation) and `is_relevant_content()` (keyword filtering). US Treasury survived because "Treasury" happens to be in its source code name; Banca d'Italia doesn't have any keyword matching "BANCA_D_ITALIA".
2. **Pattern-metric → event-trigger mismatch**: Same as Bundesbank — even if documents were fetched, the extracted metrics don't match any event type's triggers.

**Fix needed for issue 1**: Either (a) set `content_keywords: []` (empty — no filtering, same as pilot), or (b) add "BANCA" or "Action" to keywords (hack), or (c) change the pipeline to skip keyword filtering for HTML index sources (behavior change). Option (a) is the correct minimum valid config — the pilot's empty keywords were actually correct for HTML index sources.

**Fix needed for issue 2**: Same as Bundesbank (Path A or Path B).

---

### Source 4: RBI

| # | Contract question | Answer |
|---|-------------------|--------|
| 1 | Is the `event_type` supported? | ❌ NO — `"monetary_policy_operation"` is not in `EVENT_TYPE_RULES` |
| 2 | Does at least one extracted metric belong to a supported event type's `trigger_metrics`? | ❌ NO — extracted metrics include `rate_value`, `rate_maintain`, `rate_action`, `monetary_operation`, `inr_amount_crore`, `notified_amount`, `redemption_price`. The `monetary_policy_decision` trigger_metrics are `{"rate_decision", "policy_rate", "policy_rate_range"}` — NONE of the RBI metrics match. RBI uses `rate_value` and `rate_action`; the detector expects `rate_decision` and `policy_rate`. |
| 3 | Are `content_keywords` compatible with RSS feed behavior? | ✅ YES — RSS titles contain actual article titles (e.g., "Premature redemption under Sovereign Gold Bond (SGB) Scheme") which match keywords like "Gold Bond", "rate", "RBI", "repo" |
| 4 | Can extracted facts reach event detection without core-code changes? | ❌ NO — even if `event_type` is changed to `"monetary_policy_decision"`, the extracted metrics (`rate_value`, `rate_maintain`, `rate_action`) are NOT in the trigger_metrics (`rate_decision`, `policy_rate`, `policy_rate_range`). The naming convention is different: RBI patterns produce `rate_value` and `rate_action`; the detector expects `rate_decision` and `policy_rate`. |
| 5 | Can the resulting event reach evidence/IO? | ❌ NO — without triggering facts, no event is detected |

**Classification**: **Configuration contract gap (metric naming mismatch)**. RBI's patterns produce metrics like `rate_value`, `rate_maintain`, `rate_action` — but the `monetary_policy_decision` event type expects `rate_decision`, `policy_rate`, `policy_rate_range`. The metrics are semantically equivalent but named differently.

**Fix needed**: Either (a) rewrite patterns to use metric names that match trigger_metrics (`rate_decision` instead of `rate_value`, `policy_rate` instead of `rate_value`), or (b) add RBI's metric names to the `monetary_policy_decision` trigger_metrics set. Option (a) is the correct config fix — the existing ALREADY_QUALIFIED central banks (ECB, BOE, FED, BOC, RBA, BOJ) all use `rate_value` and `rate_action` as pattern types, but the extractor normalizes these to `rate_decision` and `policy_rate` before passing to the detector.

**Wait — need to verify**: does the extractor normalize `rate_value` → `policy_rate` and `rate_action` → `rate_decision`? If so, the metrics SHOULD match. This needs verification.

---

### Source 5: BaFin

| # | Contract question | Answer |
|---|-------------------|--------|
| 1 | Is the `event_type` supported? | ❌ NO — `"regulatory_warning"` is not in `EVENT_TYPE_RULES` |
| 2 | Does at least one extracted metric belong to a supported event type's `trigger_metrics`? | ✅ YES — `action_type` and `violation_type` → matches `regulatory_enforcement.trigger_metrics`; `action_type` → also matches `sanctions_designation.trigger_metrics` |
| 3 | Are `content_keywords` compatible with RSS feed behavior? | ✅ YES — RSS titles/descriptions contain "Bafin warns consumers" which matches keywords like "Bafin", "warns", "consumers" |
| 4 | Can extracted facts reach event detection without core-code changes? | ✅ YES — if `event_type` is changed to `"regulatory_enforcement"`, the trigger metrics (`action_type`, `violation_type`) match. BaFin's `penalty_amount` metric also matches. |
| 5 | Can the resulting event reach evidence/IO? | ⚠️ UNTESTED — never reached because `event_type` doesn't match; but trigger metrics are present, so with correct `event_type` it should work |

**Classification**: **Configuration authoring issue**. Same as US Treasury — the patterns and keywords are correctly authored; the `event_type` should be `"regulatory_enforcement"` (BaFin's content is consumer warnings about unauthorized services, which fits the enforcement model). No architecture gap — the detector already supports `regulatory_enforcement` and the extracted metrics match.

**Fix needed**: Change `event_type` from `"regulatory_warning"` to `"regulatory_enforcement"`. One-line config change.

---

## Summary Classification

| Source | Issue type | event_type fixable? | metric→trigger fixable? | keywords fixable? | Architecture gap? |
|--------|-----------|--------------------|-----------------------|--------------------|-------------------|
| US Treasury | Config authoring | ✅ → `sanctions_designation` | ✅ metrics already match | ✅ already works | ❌ NO |
| Bundesbank | Pattern-metric → event-trigger mismatch | ✅ → `statistical_release` | ❌ metrics DON'T match any trigger | ✅ already works | ⚠️ POSSIBLE — see below |
| Banca d'Italia | Pipeline behavior + metric mismatch | ✅ → `statistical_release` | ❌ metrics DON'T match any trigger | ❌ HTML index title issue | ⚠️ POSSIBLE — see below |
| RBI | Metric naming mismatch | ✅ → `monetary_policy_decision` | ⚠️ NEEDS VERIFICATION — does extractor normalize metric names? | ✅ already works | ⚠️ POSSIBLE — see below |
| BaFin | Config authoring | ✅ → `regulatory_enforcement` | ✅ metrics already match | ✅ already works | ❌ NO |

---

## Findings

### Finding 1: US Treasury and BaFin are pure config authoring issues

Both have:
- Correctly authored patterns that produce metrics matching supported event type triggers
- Correctly authored content_keywords that work with their feed format
- Wrong `event_type` value (using a descriptive name instead of the detector's supported name)

**Fix**: Change `event_type` to the correct supported value. One-line change per source. No architecture gap.

### Finding 2: Bundesbank and Banca d'Italia have a pattern-metric → event-trigger mismatch

Both produce `eur_amount`, `securities_type`, `auction_amount`, `yield_value` — none of which are in any supported event type's `trigger_metrics`. The closest event types (`statistical_release`, `market_statistic_release`) use `usd_amount`, not `eur_amount`, and don't include securities-specific metrics.

**This is the key question**: Is this a config authoring issue (rewrite patterns to use `usd_amount` and `percentage_change`) or an architecture gap (the event model doesn't support EUR-denominated securities auctions)?

- If we rewrite `eur_amount` → `usd_amount`: this loses semantic accuracy (the content is in EUR, not USD). It would technically work but produce misleading intelligence.
- If we add `eur_amount` to `statistical_release.trigger_metrics`: this is a data-driven model extension (add to `EVENT_TYPE_RULES` dict, no code changes). But it IS extending the model, not just fixing config.
- If we add a new event type `"securities_auction"` with these triggers: also data-driven, but more clearly a model extension.

**Classification**: This is a **configuration contract gap** — the patterns produce metrics that don't match any existing event type's triggers. Whether this is "config authoring" or "architecture" depends on whether the fix is "rewrite patterns" (config) or "extend event model" (architecture-adjacent, though data-driven).

### Finding 3: Banca d'Italia has a separate pipeline behavior boundary

Beyond the metric mismatch, Banca d'Italia's `content_keywords` filter discards all HTML index documents because the generic title `"BANCA_D_ITALIA Action"` doesn't match any keyword.

**This is a pipeline behavior boundary**, not a config authoring issue. The pipeline generates generic titles for HTML index documents, then applies keyword filtering on those generic titles. US Treasury survived only because "Treasury" happens to be in its source code name.

**Classification**: Pipeline behavior boundary. Fixable by either:
- Setting `content_keywords: []` for HTML index sources (config choice — the pilot was actually correct here)
- Changing the pipeline to skip keyword filtering for HTML index sources (behavior change)
- Changing the pipeline to generate better titles for HTML index documents (behavior change)

### Finding 4: RBI has a metric naming question that needs verification

RBI's patterns produce `rate_value`, `rate_maintain`, `rate_action` — but `monetary_policy_decision` expects `rate_decision`, `policy_rate`, `policy_rate_range`. The question is: does the extractor normalize these metric names before passing to the detector?

Looking at the existing ALREADY_QUALIFIED configs (ECB, BOE, FED, BOC, RBA), they all use pattern types like `rate_value`, `rate_maintain`, `rate_action` — the SAME names as RBI's patterns. Since these sources successfully produce IOs, the extractor MUST be normalizing these metric names to `rate_decision`, `policy_rate`, etc. before the detector sees them.

**If the extractor normalizes**: RBI's metrics should match `monetary_policy_decision` triggers, and the only fix needed is changing `event_type` to `"monetary_policy_decision"`. This would be a config authoring issue, not an architecture gap.

**If the extractor does NOT normalize**: RBI's metrics don't match, and this is a pattern-metric → event-trigger mismatch (same as Bundesbank/Banca d'Italia).

**This requires verification of the extractor's normalization logic**, which was not examined in this review.

---

## Corrected Conclusion

### What Gate 5 actually proved

```text
Pre-screening (Gates 1-4)
    ↓
Access                    ✅ 5/5 (all sources accessible)
Content                   ✅ 5/5 (all sources have substantive content)
Pattern extraction        ✅ 4/5 (1 blocked by pipeline behavior boundary)
    ↓
Configuration contract
    ├── event_type compatibility       ❌ 5/5 used unsupported event_type names
    ├── metric → trigger compatibility ❌ 3/5 metrics don't match any trigger
    │      (US Treasury ✅, BaFin ✅, Bundesbank ❌, Banca d'Italia ❌, RBI ⚠️ needs verification)
    └── keywords → adapter behavior     ❌ 1/5 (Banca d'Italia HTML index + generic title)
    ↓
Event detection           ❌ 0/5 (0 events due to contract gaps)
    ↓
IO                        ❌ 0/5 (0 IOs)
```

### What this means

The Gate 5 failures were caused by **configuration contract gaps**, NOT by a separate architectural event-model boundary:

- **2/5 sources (US Treasury, BaFin)**: Pure config authoring — wrong `event_type` name. Metrics already match triggers. Fixable by changing `event_type` to the correct supported value.
- **2/5 sources (Bundesbank, Banca d'Italia)**: Pattern-metric → event-trigger mismatch — patterns produce metrics not in any trigger set. This may be fixable by rewriting patterns (config) or may require extending the event model (data-driven model extension).
- **1/5 source (Banca d'Italia)**: Additional pipeline behavior boundary — HTML index + generic title + keyword filtering.
- **1/5 source (RBI)**: Metric naming question — needs verification of extractor normalization logic. If extractor normalizes (likely, given existing sources use same names), this is a config authoring issue.

### The critical question

> **Were the 34 patterns and 5 event_types truly "minimum valid configuration" consistent with the pipeline contract?**

**Answer**: **No.** The patterns were derived from pre-screening content evidence (correct approach), but the metric names and event_type values were NOT checked against the pipeline's `EVENT_TYPE_RULES` contract before running. The configurator authored patterns and event_types based on content semantics, not pipeline contract compatibility.

This means the Gate 5 failures are primarily **configuration authoring issues**, not architecture gaps. The "event-model applicability gap" described in `4a6e252` was premature — it should be downgraded to "configuration contract gap" until a properly authored config is tested.

---

## Next Step

Before deciding whether to:
- Rewrite configs with correct event_types and metric names, then re-run Gate 5
- Extend the event model with new event types or trigger metrics
- Redefine the Qualification Model

The following must be verified:

1. **Extractor normalization**: Does `extract_facts_multi_category` normalize metric names (e.g., `rate_value` → `policy_rate`, `rate_action` → `rate_decision`) before passing to the detector? If yes, RBI's metrics should match `monetary_policy_decision` triggers.
2. **US Treasury and BaFin**: Would changing `event_type` to the correct supported value (`sanctions_designation` / `regulatory_enforcement`) produce events and IOs? The metrics already match triggers.
3. **Bundesbank and Banca d'Italia**: Is rewriting patterns to use `usd_amount` (instead of `eur_amount`) acceptable, or does the content genuinely require EUR-denominated metrics that the event model doesn't support?

Only after these verifications can we determine whether the gap is config authoring or architecture.
