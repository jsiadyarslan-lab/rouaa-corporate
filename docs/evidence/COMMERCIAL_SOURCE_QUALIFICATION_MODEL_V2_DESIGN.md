# Commercial Source Qualification Model v2 — Design

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Commercial Source Qualification Model v1 (`f99e894` — APPROVED)
**Evidence base**: Top 20 Pre-Screening (`4443553`) + Gate 5 testing (`282de0f`, `b70171e`, `bd7285d`)
**Type**: Model design document — NOT code, config, Contract, or website change.

---

## 1. What Changed Since v1

### v1 evidence base (frozen at `7384033`)

v1 was built on evidence from:
- 3 ALREADY_QUALIFIED sources with first-attempt validation (BEA, SNB, CFTC)
- 5 NOT CURRENTLY SUPPORTED sources (RBA, ARAMCO, ONS, IMF, RBNZ)
- 2 CONDITIONAL sources (ESMA RSS, ESMA HTML)
- 0 QUALIFIED ENGINEERING sources (classification existed but was untested)
- 0 pre-screened sources (Top 20 pre-screening had not yet been done)

### v2 evidence base (new evidence since v1)

The Top 20 pre-screening and Gate 5 testing produced new evidence that v1 did not account for:

1. **Top 20 pre-screening** (`4443553`): 20 sources pre-screened against Gates 1-4
   - 14 QUALIFICATION_READY
   - 3 SCREENING_ONLY (newly transitioned)
   - 3 KNOWN_BLOCKED (newly transitioned)

2. **Gate 5 testing** (`282de0f`, `b70171e`, `bd7285d`):
   - 1 Gate 5 PASS (BaFin — first publishable IOs from a pre-screened source)
   - 2 content-path mismatches (US Treasury, RBI — accessible but wrong content type for patterns)
   - 2 architecture gaps (Bundesbank, Banca d'Italia — EUR/securities content not representable)
   - 1 pipeline behavior boundary (Banca d'Italia — HTML index + content_keywords interaction)

3. **Two distinct gaps** between QUALIFICATION_READY and PUBLISHABLE:
   - **Gap A**: Content-path ↔ intelligence-type alignment (not assessed in v1)
   - **Gap B**: Event-model representation gap (not assessed in v1)

### What v1 got right (preserved in v2)

- The 4 commercial classifications (STANDARD, QUALIFIED ENGINEERING, CONDITIONAL, NOT CURRENTLY SUPPORTED)
- The principle: qualify before commit, not engineer then hope
- The separation of onboarding success from intelligence quality
- The root-cause review path for Gate 5 failures
- The commercial claims and what we are NOT authorized to say

### What v1 got incomplete (addressed in v2)

- v1 treated QUALIFICATION_READY (Gates 1-4 PASS) as sufficient for Gate 5 testing — Gate 5 proved this is NOT sufficient
- v1 did not distinguish between content-path alignment and pattern applicability
- v1 did not account for configuration contract compatibility (event_type + trigger_metrics)
- v1 did not assess event-model representation as a separate concern
- v1 had 0 QUALIFIED ENGINEERING examples — v2 has 2 (Bundesbank, Banca d'Italia)

---

## 2. Redefined Qualification Flow

### v1 flow (preserved as historical reference)

```text
Source Intake
   ↓
Gate 1 (Access)
   ↓
Gate 2 (Provenance)
   ↓
Gate 3 (Content)
   ↓
Gate 4 (Configuration Applicability)
   ↓
Gate 5 (First attempt)
   ↓
Commercial Classification
```

### v2 flow (new)

```text
Source Intake
   ↓
PRE-SCREENED (Gates 1-4)
   ↓
CONTENT-PATH ALIGNED
   ↓
CONFIGURATION-COMPATIBLE
   ↓
QUALIFICATION_READY (v2)
   ↓
GATE 5 (First-attempt validation)
   ↓
COMMERCIAL CLASSIFICATION
```

### What each v2 stage means

#### PRE-SCREENED (Gates 1-4)

Same as v1 — source is accessible, has provenance, has substantive content, and a pattern category appears applicable.

**What this proves**: The source can be reached, has content, and a pattern abstraction exists.

**What this does NOT prove**: That the specific source path contains the assumed content type, or that the configuration will produce events.

#### CONTENT-PATH ALIGNED (new in v2)

The specific source path selected for extraction (RSS feed URL, HTML index page, or document section) has been verified to contain the **intelligence type** that the patterns are designed to extract.

**Assessment**: Sample 1-3 documents from the selected path and verify they contain the expected content type (e.g., "this RSS feed contains consumer warnings, not rate decisions").

**What this proves**: The source path leads to the right content type for the patterns.

**What this does NOT prove**: That the extracted metrics will match the event model's trigger_metrics.

**Evidence from Gate 5**:
- BaFin: content-path aligned ✅ (RSS contains consumer warnings → regulatory patterns)
- US Treasury: content-path NOT aligned ❌ (press releases contain fiscal speeches, not sanctions)
- RBI: content-path NOT aligned ❌ (RSS contains operational announcements, not rate decisions)

#### CONFIGURATION-COMPATIBLE (new in v2)

The source configuration (event_type + pattern metrics) has been verified against the pipeline contract at two levels:

**Contract compatibility** (static, checkable before any pipeline run):
1. `event_type` is a supported detector event type (exists in `EVENT_TYPE_RULES`)
2. At least one pattern's normalized metric is in the event_type's `trigger_metrics`
3. Content keywords (if any) are compatible with the adapter's document-title behavior

**Semantic representation assessment** (requires judgment, not just set intersection):
4. The matching metrics **semantically represent** the source's intelligence type — i.e., the metric's meaning in the pipeline's event model corresponds to the actual meaning of the extracted fact in the source's content

**Assessment**: Contract compatibility (steps 1-3) is a static verification — check pattern types against `PATTERN_TYPE_METADATA` and `EVENT_TYPE_RULES`. No pipeline run needed. Semantic representation assessment (step 4) requires human judgment: does the metric-to-trigger intersection represent a genuine semantic fit, or merely a syntactic overlap?

**What this proves**: The configuration is contract-compatible — the detector will find triggering facts if extraction produces any. Combined with semantic assessment, this provides reasonable confidence that the configuration is meaningful.

**What this does NOT prove**: That extraction will actually produce facts (content-path alignment is a prerequisite). That contract compatibility alone guarantees semantic correctness — a metric may be in `trigger_metrics` without semantically representing the source's content (e.g., `eur_amount` is not in any trigger set, but even if it were added, calling EUR-denominated securities auction amounts `usd_amount` would be semantically incorrect).

**Evidence from Gate 5**:
- BaFin: configuration-compatible ✅ (event_type=regulatory_enforcement, metrics match triggers, semantic fit: consumer warnings → regulatory enforcement is a natural representation)
- US Treasury: configuration-compatible ✅ (event_type=sanctions_designation, metrics match triggers, semantic fit: sanctions patterns → sanctions event type — but content-path not aligned)
- RBI: configuration-compatible ✅ (event_type=monetary_policy_decision, metrics match triggers via normalization, semantic fit: rate patterns → rate decision event type — but content-path not aligned)
- Bundesbank: configuration-NOT-compatible ❌ (eur_amount, securities_type, auction_amount, yield_value not in any trigger_metrics — AND no existing metric semantically fits without distortion)
- Banca d'Italia: configuration-NOT-compatible ❌ (same metrics as Bundesbank)

#### QUALIFICATION_READY (v2 redefined)

A source is QUALIFICATION_READY (v2) when ALL THREE conditions are met:
1. PRE-SCREENED (Gates 1-4 PASS)
2. CONTENT-PATH ALIGNED (selected path contains the assumed intelligence type)
3. CONFIGURATION-COMPATIBLE (event_type + metrics match pipeline contract)

**What this means commercially**: The source is ready for Gate 5 first-attempt validation with pre-Gate-5 compatibility checks completed. No probability of success is claimed — Gate 5 may still fail due to content-path mismatch discovered at runtime, semantic quality issues, or other unknown factors.

**What this does NOT guarantee**: Gate 5 PASS (quality issues may still prevent publication), or that no engineering will be needed (unknown until Gate 5 is attempted).

#### Event-Model Representation (separate assessment, NOT a gate)

Whether the source's intelligence type can be semantically represented by the pipeline's event model. This is assessed separately because:

- It is not always determinable before extraction (you need to see what metrics the content produces)
- The solution is not always "add a new event type" (could be: use existing metrics differently, add trigger metrics to existing event types, or add a new event type)
- It is a product/architecture decision, not a qualification step

**Evidence from Gate 5**:
- BaFin: event-model representation ✅ (consumer warnings → regulatory_enforcement is a natural fit)
- Bundesbank: event-model representation ❌ (EUR securities auctions have no matching event type)
- Banca d'Italia: event-model representation ❌ (same as Bundesbank)

**This is NOT a gate** — it is an assessment that may result in a QUALIFIED ENGINEERING classification if the event model needs extension.

---

## 3. Updated Commercial Classifications

The 4 v1 classifications are preserved. What changes is the **decision logic** for arriving at each classification:

### v1 decision logic

```text
Gate 1 FAIL → NOT CURRENTLY SUPPORTED
Gate 2 FAIL → CONDITIONAL
Gate 3 FAIL → NOT CURRENTLY SUPPORTED
Gate 4 FAIL → QUALIFIED ENGINEERING
Gate 5 FAIL → ROOT-CAUSE REVIEW
All PASS → STANDARD
```

### v2 decision logic

```text
PRE-SCREEN FAIL (Gate 1-4)
    ├── Gate 1 (Access) FAIL → NOT CURRENTLY SUPPORTED
    ├── Gate 2 (Provenance) FAIL → CONDITIONAL
    ├── Gate 3 (Content) FAIL → NOT CURRENTLY SUPPORTED
    └── Gate 4 (Pattern applicability) FAIL → QUALIFIED ENGINEERING
    ↓ PASS
CONTENT-PATH NOT ALIGNED
    → CONTENT-PATH REVIEW (identify correct path or reclassify)
    ↓ ALIGNED
CONFIGURATION NOT COMPATIBLE
    → CONFIGURATION REVIEW (check event_type + trigger_metrics)
    ├── Fixable by config change (event_type, metric names) → fix and re-verify
    └── Not fixable by config (event-model representation gap)
        → Event-Model Representation Assessment
        → QUALIFIED ENGINEERING (model extension needed — data-driven, no code)
    ↓ COMPATIBLE
QUALIFICATION_READY (v2)
    ↓
GATE 5 (First attempt)
    ├── PASS → STANDARD (Quality reported separately: PASS / REVIEW / FAIL)
    ├── FAIL (content-path mismatch discovered at runtime)
    │   → ROOT-CAUSE REVIEW → CONTENT-PATH REVIEW
    └── FAIL (other root cause)
        → ROOT-CAUSE REVIEW → CONDITIONAL or QUALIFIED ENGINEERING
```

### Key changes from v1

1. **QUALIFICATION_READY is no longer the direct output of Gates 1-4** — it requires content-path alignment and configuration compatibility as well
2. **Content-path mismatch is a distinct failure mode** — not a Gate 5 FAIL, but a pre-Gate-5 discovery
3. **Configuration incompatibility is assessed statically** — before running Gate 5, not after
4. **Event-model representation is a separate assessment** — not a gate, but a classification input
5. **Root-cause review now includes content-path mismatch** as a possible root cause

---

## 4. Updated Evidence Mapping

### STANDARD — demonstrated

| Source | Class | Evidence | Quality |
|--------|-------|----------|---------|
| BEA | statistical_authority | `c8af140` — first-attempt PASS | PASS |
| SNB | central_bank | `c09de13` — first-attempt PASS, independently reviewed (`332788c`) | PASS |
| CFTC | financial_regulator | `b4fabe9` — prospective PASS | REVIEW |
| **BaFin** | **financial_regulator** | **`282de0f` — Gate 5 PASS, 9 publishable IOs, config-only** | **PASS** |

### CONDITIONAL — demonstrated

| Source | Class | Evidence | Condition |
|--------|-------|----------|-----------|
| ESMA (RSS) | financial_regulator | `27294db` — extraction works, provenance incomplete | document_date unavailable |
| ESMA (HTML) | financial_regulator | `8041cda` — extraction works, provenance incomplete | document_date unavailable |

### NOT CURRENTLY SUPPORTED — demonstrated

| Source | Class | Evidence | Blocker |
|--------|-------|----------|---------|
| RBA | central_bank | Phase B — Akamai 403 | Access blocked |
| ONS | statistical_authority | Phase B — JS-rendered | Content unavailable in static HTML |
| IMF | financial_regulator | `b4fabe9` — prospective | Access blocked (Akamai 403) |
| BLS | statistical_authority | `4443553` — Top 20 pre-screening | Access blocked (Akamai 403) |
| Banque de France | central_bank | `4443553` — Top 20 pre-screening | Access blocked (Akamai 403) |
| DNB | central_bank | `4443553` — Top 20 pre-screening | Access blocked (Akamai 403) |

### QUALIFIED ENGINEERING — evidence-supported routing (new in v2)

These sources have been routed to Engineering Review based on evidence that the current configuration/pipeline cannot represent their intelligence type through config-only onboarding. **No engineering work package has been executed for these sources** — the evidence proves the need for review, not the size or type of the engineering package.

| Source | Class | Evidence | Routing reason |
|--------|-------|----------|---------------|
| Bundesbank | central_bank | `bd7285d` — Gate 5 config contract verification | Event-model representation gap: EUR amounts and securities auction metrics have no semantically compatible trigger in any existing event type |
| Banca d'Italia | central_bank | `bd7285d` — Gate 5 config contract verification | Event-model representation gap (same as Bundesbank) + HTML index keyword behavior boundary |

**Important**: The routing is evidence-supported, not engineering-demonstrated. The evidence proves that config-only onboarding cannot succeed for these sources with the current event model. The solution (new event types, new trigger metrics, or different metric usage) is a product/architecture decision that has not been made.

### CONTENT-PATH REVIEW — demonstrated (new classification path in v2)

| Source | Class | Evidence | Issue |
|--------|-------|----------|-------|
| US Treasury | ministry_of_finance | `282de0f` — Gate 5 re-run 2 | Press releases path contains fiscal speeches, not sanctions designations |
| RBI | central_bank | `282de0f` — Gate 5 re-run 2 | Press releases RSS contains operational announcements, not rate decisions |

---

## 5. Updated Commercial Claims

### Authorized (updated from v1)

> ROUA can onboard selected official institutional sources through a governed, configuration-driven pipeline, subject to predefined access, provenance, content, extraction, and configuration-compatibility constraints.

> Configuration-only onboarding has been demonstrated for 4 sources across 3 institutional classes (statistical_authority, central_bank, financial_regulator), with complete provenance, reproducibility, and 0 core code changes. BaFin is the first source onboarded through the full v2 qualification flow (pre-screened → content-path aligned → configuration-compatible → Gate 5 PASS).

> Before any implementation work begins, ROUA qualifies the source path, content type, provenance, extraction applicability, and configuration compatibility before committing to onboarding.

> ROUA's pipeline produces Intelligence Objects with complete provenance chains and deterministic reproducibility for sources that pass the full qualification flow.

> Access compatibility does not guarantee publishability. Content-path alignment and configuration compatibility are separate qualification requirements.

### Not Yet Authorized (updated from v1)

> "ROUA supports all official sources." — Not tested; not claimed.

> "Onboarding is always configuration-only." — Bundesbank and Banca d'Italia have been routed to Engineering Review (evidence-supported, not executed).

> "X% of sources can be onboarded automatically." — Sample too small; no success rate claimed.

> "QUALIFICATION_READY (v1) predicts Gate 5 success." — v1 QUALIFICATION_READY was proven insufficient; v2 adds content-path alignment and configuration compatibility.

> "Event-model representation gaps require new event types." — Proven for EUR/securities content; solution not yet determined (could be new event types, new trigger metrics, or different metric usage).

---

## 6. Updated Core Commercial Promise

> **"Give us your source list. We will qualify each source — its access, provenance, content, content-path alignment, extraction applicability, and configuration compatibility — before we commit to implementation, and identify whether it fits the standard path, requires engineering review, or is not currently supported."**

This is stronger than v1 because it reflects what Gate 5 testing actually proved: qualification is not just "can we reach the source?" but "does the source path contain the right intelligence type, and can our pipeline model represent it?"

---

## 7. Relationship to v1

| Aspect | v1 | v2 |
|--------|----|----|
| Qualification flow | Gates 1-4 → Gate 5 | Gates 1-4 → Content-path alignment → Configuration compatibility → Gate 5 |
| QUALIFICATION_READY | Output of Gates 1-4 | Output of Gates 1-4 + content-path + config compatibility |
| Gate 5 failures | All routed to root-cause review | Separated into content-path mismatch, config incompatibility, and other root causes |
| Event-model representation | Not assessed | Separate assessment (not a gate, but a classification input) |
| QUALIFIED ENGINEERING | Theoretical (0 examples) | Evidence-supported routing (2 examples: Bundesbank, Banca d'Italia — routed, not executed) |
| STANDARD | 3 examples (BEA, SNB, CFTC) | 4 examples (BEA, SNB, CFTC, BaFin) |
| Commercial promise | "Pre-screen and tell you if it's ready" | "Qualify the source path, content type, provenance, extraction applicability, and configuration compatibility before committing" |

---

## 8. What This Model Does NOT Do (updated from v1)

- Does NOT replace the Supported Source Contract
- Does NOT modify the pipeline or any code
- Does NOT add new gates to the pipeline
- Does NOT calculate a success rate
- Does NOT promise a fixed onboarding time
- Does NOT guarantee that STANDARD sources will have PASS intelligence quality
- Does NOT determine the solution for event-model representation gaps (new event types vs. new trigger metrics vs. different metric usage)
- Does NOT authorize Phase C or any new source testing
- Does NOT modify Queue v1.1

---

## 9. Implementation Note

**This is a DESIGN ONLY document — NOT OPERATIONALIZED.**

The v2 model describes how qualification should work based on Gate 5 evidence. It does NOT:
- Modify the pipeline
- Add new gates
- Change the Queue
- Create new config files
- Modify existing configs
- Update the Source Qualification Report Template
- Update the pre-screening methodology

The v2 model will be **operationalized** when (each step requires separate user approval):
1. The Source Qualification Report Template is updated to v2 (adding content-path alignment and configuration compatibility sections)
2. The pre-screening methodology is updated to include content-path verification
3. The configuration contract verification (static check of event_type + trigger_metrics) becomes a standard pre-Gate-5 step

**No operationalization is authorized by this document.**

---

## Appendix: v2 Qualification Quick Reference

```
Source Intake
   ↓
PRE-SCREENED (Gates 1-4)
   ├── Gate 1 FAIL → NOT CURRENTLY SUPPORTED
   ├── Gate 2 FAIL → CONDITIONAL
   ├── Gate 3 FAIL → NOT CURRENTLY SUPPORTED
   └── Gate 4 FAIL → QUALIFIED ENGINEERING
   ↓ PASS
CONTENT-PATH ALIGNED
   └── NOT ALIGNED → CONTENT-PATH REVIEW
   ↓ ALIGNED
CONFIGURATION-COMPATIBLE
   └── NOT COMPATIBLE → Event-Model Representation Assessment
       ├── Fixable by config → fix and re-verify
       └── Not fixable by config → QUALIFIED ENGINEERING
   ↓ COMPATIBLE
QUALIFICATION_READY (v2)
   ↓
GATE 5 (First attempt)
   ├── PASS → STANDARD (Quality: PASS / REVIEW / FAIL)
   └── FAIL → ROOT-CAUSE REVIEW
       ├── Content-path mismatch → CONTENT-PATH REVIEW
       ├── Provenance condition → CONDITIONAL
       ├── Config issue → fix and re-verify
       └── Unresolved → NOT CURRENTLY SUPPORTED
```
