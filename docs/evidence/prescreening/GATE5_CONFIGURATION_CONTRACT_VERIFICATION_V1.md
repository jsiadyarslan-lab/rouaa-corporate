# Gate 5 Configuration Contract Verification v1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: `9e3dbb2` (Configuration Contract Review v1)
**Type**: Static verification — NO pipeline execution, NO config changes, NO code changes.

---

## 1. Question

Answer 4 open questions from `GATE5_CONFIGURATION_CONTRACT_REVIEW_V1.md` to determine whether the Gate 5 failures were caused by configuration authoring issues or architecture gaps:

1. Does the extractor normalize `rate_value`/`rate_action`/`rate_maintain` into `policy_rate`/`rate_decision`?
2. Would changing `event_type` alone fix US Treasury and BaFin?
3. Can Bundesbank/Banca d'Italia content be represented using existing supported metrics without semantic distortion?
4. Is Banca d'Italia's keyword failure a source config problem or a generic adapter behavior?

---

## 2. Evidence Inspected

| File | Lines | What was inspected |
|------|-------|---------------------|
| `scripts/pipeline/extractor.py` lines 389-433 | `PATTERN_TYPE_METADATA` dict | Metric mapping from pattern_type → metric name |
| `scripts/pipeline/extractor.py` lines 555-622 | `_extract_fact_from_match()` | How `metric` is derived from `PATTERN_TYPE_METADATA` |
| `scripts/pipeline/extractor.py` lines 625-699 | `extract_facts_multi_category()` | How patterns are iterated and facts created |
| `scripts/pipeline/detector.py` lines 48-133 | `EVENT_TYPE_RULES` dict | All 6 supported event types and their `trigger_metrics` |
| `scripts/pipeline/detector.py` lines 245-279 | `detect_event()` | How `configured_event_type` and `trigger_metrics` interact |
| `scripts/pipeline/fetcher.py` lines 235-243 | `is_relevant_content()` | How `content_keywords` filtering works |
| `scripts/pipeline/fetcher.py` lines 246-297 | `parse_html_index()` | How generic titles are generated for HTML index documents |
| `scripts/pipeline/fetcher.py` lines 362-366 | Content filtering step | Where keyword filtering is applied in the pipeline |
| `scripts/pipeline/source_configs.py` | OFAC config (existing) | How an existing ALREADY_QUALIFIED html_index source handles keywords |

---

## 3. Extractor Normalization Result

### Question

Are metrics such as `rate_value`, `rate_action`, `rate_maintain` normalized/transformed into `policy_rate`, `rate_decision`, or do they remain distinct metrics?

### Code path proof

`_extract_fact_from_match()` at line 577:
```python
metric = metadata["metric"]
```

`metadata` comes from `PATTERN_TYPE_METADATA.get(pattern_type, ...)` at line 573.

The `PATTERN_TYPE_METADATA` dict (lines 389-433) contains these mappings:

```python
"rate_value":           {"metric": "policy_rate",       ...}  # line 391
"rate_maintain":        {"metric": "rate_decision",     ...}  # line 393
"rate_action":          {"metric": "rate_decision",     ...}  # line 394
"rate_action_with_value": {"metric": "rate_decision",  ...}  # line 395
"rate_range":           {"metric": "policy_rate_range", ...}  # line 392
```

### Conclusion

**PROVEN: The extractor normalizes pattern types into detector-compatible metrics.**

- `rate_value` (pattern type) → `policy_rate` (metric) ✅
- `rate_maintain` (pattern type) → `rate_decision` (metric) ✅
- `rate_action` (pattern type) → `rate_decision` (metric) ✅
- `rate_range` (pattern type) → `policy_rate_range` (metric) ✅

The `pattern_type` (second element of each pattern tuple in source config) is NOT the metric name. The extractor looks up `pattern_type` in `PATTERN_TYPE_METADATA` and uses the `"metric"` field as the actual `Fact.metric`. This is a data-driven normalization layer between pattern definition and fact creation.

**Impact on RBI**: RBI's patterns use pattern types `rate_value`, `rate_maintain`, `rate_action` — these are normalized to `policy_rate`, `rate_decision`, `rate_decision` respectively. These ARE in `monetary_policy_decision.trigger_metrics = {"rate_decision", "policy_rate", "policy_rate_range"}`.

**RBI verdict**: With `event_type = "monetary_policy_decision"`, RBI's extracted facts WOULD trigger event detection. The metric naming question is RESOLVED — the extractor normalizes correctly.

**Impact on non-rate pattern types**: Pattern types NOT in `PATTERN_TYPE_METADATA` fall back to `{"metric": pattern_type, ...}` (line 573-574) — the pattern_type string IS used as the metric name. This means:
- `eur_amount` (not in PATTERN_TYPE_METADATA) → `metric = "eur_amount"` (no normalization)
- `securities_type` (not in PATTERN_TYPE_METADATA) → `metric = "securities_type"` (no normalization)
- `auction_amount` (not in PATTERN_TYPE_METADATA) → `metric = "auction_amount"` (no normalization)
- `yield_value` (not in PATTERN_TYPE_METADATA) → `metric = "yield_value"` (no normalization)
- `monetary_operation` (not in PATTERN_TYPE_METADATA) → `metric = "monetary_operation"` (no normalization)
- `inr_amount_crore` (not in PATTERN_TYPE_METADATA) → `metric = "inr_amount_crore"` (no normalization)
- `notified_amount` (not in PATTERN_TYPE_METADATA) → `metric = "notified_amount"` (no normalization)
- `redemption_price` (not in PATTERN_TYPE_METADATA) → `metric = "redemption_price"` (no normalization)
- `entity_name` (not in PATTERN_TYPE_METADATA) → `metric = "entity_name"` (no normalization)

---

## 4. US Treasury Contract Result

### Extracted metrics (after normalization)

| Pattern type | Normalized metric | In PATTERN_TYPE_METADATA? |
|---------------|------------------|--------------------------|
| `designated_entity` | `designated_entity` | ✅ (line 403) |
| `sanctions_program` | `sanctions_program` | ✅ (line 405) |
| `action_type` | `action_type` | ✅ (line 402) |
| `penalty_amount` | `penalty_amount` | ✅ (line 399) |
| `usd_amount` | `usd_amount` | ✅ (line 415) |

### Matching supported event types

```
sanctions_designation.trigger_metrics = {designated_entity, designated_country,
                                         sanctions_program, action_type, faq_topic}

Intersection: {designated_entity, sanctions_program, action_type} → 3 metrics match ✅

regulatory_enforcement.trigger_metrics = {penalty_amount, defendant_name,
                                           action_type, violation_type}

Intersection: {penalty_amount, action_type} → 2 metrics match ✅
```

### Verdict

**PASS** — US Treasury's extracted metrics satisfy `trigger_metrics` for `sanctions_designation` (3 matches) and `regulatory_enforcement` (2 matches). Changing `event_type` from `"regulatory_publication"` to `"sanctions_designation"` would make the detector find triggering facts and produce events.

No architecture gap. Pure config authoring issue (wrong `event_type` name).

---

## 5. BaFin Contract Result

### Extracted metrics (after normalization)

| Pattern type | Normalized metric | In PATTERN_TYPE_METADATA? |
|---------------|------------------|--------------------------|
| `entity_name` | `entity_name` | ❌ NOT in PATTERN_TYPE_METADATA → metric = `entity_name` |
| `action_type` | `action_type` | ✅ (line 402) |
| `violation_type` | `violation_type` | ✅ (line 401) |
| `penalty_amount` | `penalty_amount` | ✅ (line 399) |

### Matching supported event types

```
regulatory_enforcement.trigger_metrics = {penalty_amount, defendant_name,
                                           action_type, violation_type}

Intersection: {penalty_amount, action_type, violation_type} → 3 metrics match ✅
```

Note: `entity_name` does NOT match `defendant_name` (the trigger metric). But `action_type`, `violation_type`, and `penalty_amount` DO match. The detector requires at least ONE triggering fact — BaFin has THREE.

### Verdict

**PASS** — BaFin's extracted metrics satisfy `trigger_metrics` for `regulatory_enforcement` (3 matches: `action_type`, `violation_type`, `penalty_amount`). Changing `event_type` from `"regulatory_warning"` to `"regulatory_enforcement"` would make the detector find triggering facts and produce events.

No architecture gap. Pure config authoring issue (wrong `event_type` name).

---

## 6. Bundesbank Metric Compatibility Result

### Extracted metrics (after normalization)

| Pattern type | Normalized metric | In PATTERN_TYPE_METADATA? |
|---------------|------------------|--------------------------|
| `eur_amount` | `eur_amount` | ❌ NOT in PATTERN_TYPE_METADATA → metric = `eur_amount` |
| `securities_type` | `securities_type` | ❌ NOT in PATTERN_TYPE_METADATA → metric = `securities_type` |
| `auction_amount` | `auction_amount` | ❌ NOT in PATTERN_TYPE_METADATA → metric = `auction_amount` |
| `yield_value` | `yield_value` | ❌ NOT in PATTERN_TYPE_METADATA → metric = `yield_value` |

### Matching supported event types

```
All 6 supported event types and their trigger_metrics:

monetary_policy_decision:    {rate_decision, policy_rate, policy_rate_range}     → 0 matches
regulatory_enforcement:      {penalty_amount, defendant_name, action_type, violation_type} → 0 matches
statistical_release:         {inflation_rate, gdp_growth, unemployment_rate,
                              employment_level, statistic_value, percentage_statistic,
                              cross_border_change, usd_amount}                    → 0 matches
earnings_release:             {revenue, eps, net_income, gross_margin,
                              yoy_change, dividend_amount, total_assets}         → 0 matches
sanctions_designation:       {designated_entity, designated_country,
                              sanctions_program, action_type, faq_topic}          → 0 matches
market_statistic_release:    {fx_turnover, ird_turnover, cds_turnover,
                              usd_amount, percentage_change}                      → 0 matches
```

**ZERO matches across all 6 supported event types.**

### Semantic compatibility assessment

Can Bundesbank's content be represented using existing supported metrics without semantic distortion?

| Bundesbank metric | Closest existing metric | Semantic fit? |
|-------------------|-----------------------|---------------|
| `eur_amount` | `usd_amount` | ❌ NO — EUR ≠ USD. Renaming would produce factually incorrect intelligence ("$5 billion" when the content says "€5 billion"). The `_normalize_amount` function strips currency symbols and normalizes to a canonical form, but the `unit` field in `PATTERN_TYPE_METADATA` for `usd_amount` is `"usd"` — using it for EUR amounts would label EUR as USD. |
| `securities_type` | `statistic_value` | ❌ NO — securities type (BOT, BTP, bond) is a categorical label, not a numeric statistic value. `statistic_value` expects a numeric value. |
| `auction_amount` | `usd_amount` | ❌ NO — same EUR ≠ USD problem. Also, auction amounts are operational figures, not statistical releases. |
| `yield_value` | `percentage_change` | ⚠️ PARTIAL — yield is a percentage, and `percentage_change` is a percentage. But yield is a level (e.g., "3.5%"), not a change (e.g., "+0.5%"). Using `percentage_change` for yield would semantically misrepresent a level as a change. |
| `yield_value` | `inflation_rate` | ❌ NO — yield is not inflation. Different economic concept entirely. |

### Verdict

**NO MATCH** — None of Bundesbank's 4 extracted metrics semantically fit any existing trigger metric. The content (EUR-denominated securities auction announcements with bond types, auction amounts, and yields) cannot be represented by the existing event model without semantic distortion.

This is NOT a config authoring issue (rewriting patterns would either lose semantic accuracy or fail to match triggers). This is a genuine **model coverage gap**: the pipeline's event model does not support securities auction announcements or EUR-denominated financial amounts.

**Classification**: Architecture gap (event model coverage) — PROVEN for this content type.

---

## 7. Banca d'Italia Metric Compatibility Result

### Extracted metrics (after normalization)

Same as Bundesbank (identical pattern definitions):
- `eur_amount` — NOT in PATTERN_TYPE_METADATA
- `securities_type` — NOT in PATTERN_TYPE_METADATA
- `auction_amount` — NOT in PATTERN_TYPE_METADATA
- `yield_value` — NOT in PATTERN_TYPE_METADATA

### Matching supported event types

Same as Bundesbank: **ZERO matches across all 6 supported event types.**

### Semantic compatibility assessment

Same as Bundesbank: none of the 4 metrics semantically fit any existing trigger metric. Banca d'Italia's content (Italian Treasury securities auctions: BOT, BTP, CCTeu with EUR amounts and yields) cannot be represented by the existing event model.

### Verdict

**NO MATCH** — Same as Bundesbank. Architecture gap (event model coverage) — PROVEN for this content type.

---

## 8. Banca d'Italia Keyword-Path Result

### Code path proof

1. `fetch_source_publications()` calls `parse_html_index()` which creates Document objects with generic titles:
   ```python
   # fetcher.py line 290:
   title=f"{source_code} Action {published_at}" if published_at else f"{source_code} Action",
   ```
   For Banca d'Italia: `title = "BANCA_D_ITALIA Action"` (no date in URL → no published_at)

2. After parsing, `fetch_source_publications()` applies content_keywords filtering:
   ```python
   # fetcher.py lines 362-366:
   if feed_format != "pdf" and keywords:
       filtered = [d for d in documents if is_relevant_content(d, keywords)]
       documents = filtered[:max_items]
   ```

3. `is_relevant_content()` checks title + content_text:
   ```python
   # fetcher.py line 242:
   text = (doc.title + " " + doc.content_text).lower()
   return any(kw.lower() in text for kw in keywords)
   ```
   For HTML index documents, `content_text` is empty at this point (content hasn't been fetched yet). So: `text = "banca_d_italia action "`.

4. Banca d'Italia's keywords: `["BOT", "BTP", "CCTeu", "auction", "asta", "Treasury"]`
   - `"bot"` in `"banca_d_italia action "` → ❌ NO
   - `"btp"` in `"banca_d_italia action "` → ❌ NO
   - `"ccteu"` in `"banca_d_italia action "` → ❌ NO
   - `"auction"` in `"banca_d_italia action "` → ❌ NO
   - `"asta"` in `"banca_d_italia action "` → ❌ NO
   - `"treasury"` in `"banca_d_italia action "` → ❌ NO

   **All 6 keywords fail to match the generic title. All documents are discarded.**

### Comparison with existing sources

| Source | feed_format | Generic title | Keywords matching title? | Survives filter? |
|--------|------------|---------------|-------------------------|-----------------|
| OFAC (existing) | html_index | "OFAC Action 20260807" | "OFAC" ✅ | ✅ YES |
| US Treasury | html_index | "US_TREASURY Action" | "Treasury" ✅ | ✅ YES |
| Banca d'Italia | html_index | "BANCA_D_ITALIA Action" | none ❌ | ❌ NO |

### Root cause classification

The failure is caused by a **generic adapter behavior**: `parse_html_index()` generates generic titles from `source_code`, and `is_relevant_content()` applies keyword filtering on these generic titles BEFORE content is fetched. This is pipeline behavior, not source-specific config.

However, the behavior CAN be worked around at the config level:
- Set `content_keywords: []` → the `if keywords:` check on line 363 is falsy for empty lists → filtering is **SKIPPED entirely** → all documents are kept
- This is what the pilot configs did (empty keywords = no filtering), and the pilot correctly fetched 10 documents for Banca d'Italia

### Verdict

**Generic adapter/pipeline behavior** — the HTML index adapter generates generic titles, and the keyword filter is applied on those generic titles before content fetch. This is NOT a source-specific configuration problem; it's a pipeline behavior boundary. However, it CAN be worked around by setting `content_keywords: []` for HTML index sources (the pilot's approach was correct for this specific case).

The deeper question: should the pipeline apply keyword filtering to HTML index documents that haven't had their content fetched yet? This is a design question for the pipeline, not a config question.

---

## 9. Architecture Gap: PROVEN / NOT PROVEN / INCONCLUSIVE

### Architecture gap assessment

| Dimension | Result |
|-----------|--------|
| Rate-type metrics (rate_value, rate_action, rate_maintain) | **NOT PROVEN** — extractor normalizes to policy_rate/rate_decision; existing event model supports them |
| Sanctions/regulatory metrics (designated_entity, action_type, violation_type, penalty_amount) | **NOT PROVEN** — existing event model supports them via sanctions_designation and regulatory_enforcement |
| EUR-denominated amounts (eur_amount) | **PROVEN** — no existing metric semantically represents EUR; usd_amount would distort semantics |
| Securities auction metrics (securities_type, auction_amount, yield_value) | **PROVEN** — no existing event type covers securities auction announcements; closest (statistical_release, market_statistic_release) don't include these metrics in triggers |
| HTML index + content_keywords interaction | **NOT PROVEN as architecture** — it's a pipeline behavior boundary, not an architecture gap; workaround exists (empty keywords) |

### Overall architecture gap verdict

**PROVEN (partial)** — Architecture gap exists for EUR-denominated securities auction content (Bundesbank, Banca d'Italia). The pipeline's event model does not support:
1. EUR-denominated financial amounts (only USD)
2. Securities auction announcements (no matching event type)

Architecture gap does NOT exist for:
1. Rate-type content (RBI) — extractor normalizes correctly
2. Sanctions/regulatory content (US Treasury, BaFin) — existing event types match

---

## 10. Configuration Authoring Gap: PROVEN / NOT PROVEN / INCONCLUSIVE

### Configuration authoring gap assessment

| Source | Issue | Config authoring gap? |
|--------|-------|----------------------|
| US Treasury | Wrong `event_type` ("regulatory_publication" → should be "sanctions_designation") | **PROVEN** — metrics already match triggers; only event_type name is wrong |
| BaFin | Wrong `event_type` ("regulatory_warning" → should be "regulatory_enforcement") | **PROVEN** — metrics already match triggers; only event_type name is wrong |
| RBI | Wrong `event_type` ("monetary_policy_operation" → should be "monetary_policy_decision") | **PROVEN** — extractor normalizes rate_value→policy_rate, rate_action→rate_decision; only event_type name is wrong |
| Bundesbank | Wrong `event_type` + metrics don't match any trigger | **INCONCLUSIVE** — event_type is wrong, but even with correct event_type, metrics don't match triggers (architecture gap) |
| Banca d'Italia | Wrong `event_type` + metrics don't match + keywords filter discards docs | **INCONCLUSIVE** — multiple issues; config authoring gap (event_type, keywords) + architecture gap (metrics) |

### Overall configuration authoring gap verdict

**PROVEN (for 3/5 sources)** — US Treasury, BaFin, and RBI have pure configuration authoring gaps: wrong `event_type` name. Their extracted metrics already match supported event type triggers. Fixing the `event_type` value alone would allow event detection to work.

**INCONCLUSIVE (for 2/5 sources)** — Bundesbank and Banca d'Italia have BOTH config authoring gaps (wrong event_type, wrong keywords) AND architecture gaps (metrics not in any trigger set). Fixing the config authoring issues would NOT fully resolve these sources — the architecture gap remains.

---

## 11. Exact Next Decision Required

### What is now proven

1. **3/5 sources (US Treasury, BaFin, RBI)**: Pure config authoring gap. Fixing `event_type` to the correct supported value would make their metrics match triggers and allow event detection. No architecture gap.

2. **2/5 sources (Bundesbank, Banca d'Italia)**: Architecture gap (event model doesn't support EUR amounts or securities auction metrics) + config authoring gap (wrong event_type; Banca d'Italia also has keyword filter issue). Fixing config alone won't resolve the architecture gap.

3. **Extractor normalization works correctly**: `rate_value` → `policy_rate`, `rate_action` → `rate_decision`, `rate_maintain` → `rate_decision`. The normalization layer is proven by code path inspection.

4. **HTML index keyword filtering is a pipeline behavior boundary**: generic titles + keyword filtering before content fetch. Workaround: `content_keywords: []` for HTML index sources.

### The decision required

The user must decide between two paths:

**Path A: Fix config authoring for 3 sources, re-run Gate 5 on those 3 only**
- Change `event_type` for US Treasury → `"sanctions_designation"`
- Change `event_type` for BaFin → `"regulatory_enforcement"`
- Change `event_type` for RBI → `"monetary_policy_decision"`
- Set `content_keywords: []` for Banca d'Italia (workaround for HTML index behavior)
- Re-run Gate 5 on US Treasury, BaFin, RBI only (3 sources with proven config-only fixes)
- Do NOT re-run Bundesbank or Banca d'Italia until the architecture gap is addressed
- This would test whether QUALIFICATION_READY predicts Gate 5 PASS for sources whose content matches the existing event model

**Path B: Do not re-run Gate 5; document the findings and decide on model evolution**
- Accept that 3/5 sources have config authoring gaps (fixable)
- Accept that 2/5 sources have architecture gaps (not fixable without model extension)
- Document the findings as evidence for Qualification Model evolution
- Decide whether to extend the event model (add `eur_amount` to triggers, or add new event type `"securities_auction"`) before re-running Gate 5

### Recommendation

Path A is the correct next step. It would:
- Test the 3 sources that SHOULD work with correct config (proven by static verification)
- Produce the first Gate 5 PASS results (if the static verification is correct)
- Leave the 2 architecture-gap sources for separate model-evolution discussion
- Not require any code changes, model extensions, or new event types

But this decision is for the user to make.

---

## Final Status

**Gate 5 Configuration Contract Verification v1 — COMPLETE**

### Summary of proven results

| Question | Answer |
|----------|--------|
| Extractor normalizes rate metrics? | ✅ PROVEN: `rate_value`→`policy_rate`, `rate_action`→`rate_maintain`→`rate_decision` |
| US Treasury: metrics match triggers? | ✅ PASS: 3 metrics match `sanctions_designation` triggers |
| BaFin: metrics match triggers? | ✅ PASS: 3 metrics match `regulatory_enforcement` triggers |
| Bundesbank: metrics match triggers? | ❌ NO MATCH: 0 metrics match any trigger (architecture gap) |
| Banca d'Italia: metrics match triggers? | ❌ NO MATCH: 0 metrics match any trigger (architecture gap) |
| Banca d'Italia: keyword failure cause? | Generic adapter behavior (HTML index + generic title + keyword filter before content fetch) |
| Architecture gap? | **PROVEN (partial)**: exists for EUR/securities auction content; does NOT exist for rate/sanctions/regulatory content |
| Configuration authoring gap? | **PROVEN**: for 3/5 sources (wrong event_type); INCONCLUSIVE for 2/5 (config + architecture) |
