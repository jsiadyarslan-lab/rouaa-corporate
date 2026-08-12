# ROUA Supported Source Contract

**Version**: 1.0 (corrected)
**Date**: 2026-08-12
**Basis**: Phase A.2 + Architecture Gate + Phase B + B-Closure (evidence commits `de64f31`, `a363d9d`)
**Status**: Commercial positioning document — NOT a marketing claim
**Corrections**: v1.0 corrected per evidence review (6 fixes: PDF reclassification, BLOCKED denominator, first-attempt claim removed, onboarding/quality separation, false-facts phrase deleted, commercial claim adjusted)

---

## Purpose

This contract defines what ROUA **actually supports** based on tested evidence, not aspirational claims. It exists to:

1. Set honest buyer expectations
2. Guide onboarding decisions (accept / reject / engineer)
3. Distinguish configuration work from engineering work
4. Prevent overpromising on source coverage

> **ROUA does not support "all official sources." ROUA supports a defined class of sources through predictable onboarding, with documented limits.**

---

## 1. Supported Institutional Source Classes

Based on Phase B evidence (7/10 sources produced publishable IOs across 5 institutional classes):

| Institutional Source Class | Supported? | Evidence | Onboarding Profile |
|---------------------------|-----------|----------|-------------------|
| Central bank (RSS) | ✅ Yes | ECB, BOE, FED, BOC, BOJ — 5/5 publishable | Config-only, ~45-65 min |
| Financial regulator (RSS) | ✅ Yes | SEC, FCA — 2/2 publishable | Config-only, ~45 min |
| Statistical authority (RSS) | ⚠ Partial | BIS_STATS publishable; ONS blocked (JS-rendered) | Config-only if RSS has full content |
| Corporate IR (RSS/Atom) | ✅ Yes | APPLE publishable; ARAMCO blocked (Akamai) | Config-only if accessible |
| Government/regulatory (HTML index) | ✅ Yes | OFAC — publishable (627 facts, 9 IOs) | Config-only with `link_pattern`, ~45 min |

### Supported Document Formats

PDF is a delivery/document format, not an institutional source class. ROUA supports PDF as a content format within any source class:

| Format | Supported? | Evidence |
|--------|-----------|----------|
| RSS 2.0 / Atom / RDF | ✅ Yes | 8/10 Phase B sources | 
| HTML index pages | ✅ Yes | OFAC (date-based URL discovery) |
| PDF documents | ✅ Yes | BIS_QR (pdfplumber extraction), BOJ (RSS points to PDFs) |

### Not Yet Supported (Requires Infrastructure)

| Source Pattern | Blocker | Evidence |
|---------------|---------|----------|
| Akamai-protected sites | 403 on urllib + Playwright | RBA, ARAMCO |
| JS-rendered pages | Static HTML has no data | ONS |
| Content-URL-blocked RSS | RSS open, content URLs 403 | RBNZ |

**These are NOT abstraction gaps.** They are infrastructure constraints. ROUA classifies them as `BLOCKED` rather than producing low-confidence intelligence.

**Important**: BLOCKED sources remain included in the onboarding/generalization denominator (10 sources = 10 denominator). They are excluded only from publishable-output quality metrics (provenance, reproducibility) since no output was produced. See Section 7 for details.

---

## 2. Supported Access Methods

| Method | When Used | Evidence |
|--------|-----------|----------|
| urllib (with browser headers) | Default — RSS, HTML, PDF | 7/10 Phase B sources |
| Playwright headless browser | Fallback on HTTP 403 | Generic adapter, not yet needed for publishable sources |
| Blocked classification | Both urllib + Playwright return 403 | RBA, ARAMCO, RBNZ content URLs |

**Access strategy is source-agnostic.** The pipeline tries urllib → Playwright → classifies as blocked. No `if source == X` logic.

---

## 3. Current Extraction Limits

### What Works

| Capability | Evidence |
|-----------|----------|
| Monetary policy rate extraction | ECB, BOE, FED, BOC, BOJ — rate values, decisions, ranges |
| Fractional rate normalization | FED "3-1/2 to 3-3/4" → "3.5-3.75" |
| Regulatory penalty amounts | SEC, FCA — $X million/billion patterns |
| Sanctions entity extraction | OFAC — 627 facts from SDN list updates |
| Statistical numeric extraction | BIS_STATS — $14.7 trillion, cross-border changes |
| Corporate earnings | APPLE — revenue $109.4B, EPS $2.02 |
| PDF text extraction | BIS_QR — 24 facts from 1.7MB PDF |
| Semantic role detection | BOJ dissent (partial), BOE dissent (full) |

### Documented Limits (Honest Disclosure)

| Limit | Root Cause | Impact | Fix Type |
|-------|-----------|--------|----------|
| Case-sensitive regex impossible | `re.IGNORECASE` applied to all patterns | `defendant_name` captures "benefit pension" instead of entity names | Core extractor change (per-pattern case control) |
| Multiple PRIMARY facts per paragraph | No deduplication by metric+paragraph | BOJ minutes produce maintain+hike+action in one IO | Core extractor change (precedence/dedup) |
| Role detection coverage | Default patterns miss some phrasings | BOJ "continue to raise" classified as primary, not dissent | Config-tunable per source (partial fix applied) |

**These limits mean ROUA's extraction is not case-complete.** Sources requiring case-sensitive entity extraction or complex multi-fact paragraphs may produce ambiguous IOs.

---

## 4. When Onboarding Is Configuration-Only

**GREEN path** (configuration-only onboarding under the tested pipeline state, with publishable output):

```
New source
  → Source class matches supported list (Section 1)
  → Feed format is RSS / HTML index / PDF
  → Access method is urllib (not blocked)
  → Patterns don't depend on case sensitivity
  → One fact per metric per paragraph expected
  → Add source_config.py entry
  → Run pipeline
  → Publishable IO produced
```

**Evidence**: 7/10 Phase B sources followed this path under the tested pipeline state. Onboarding time estimates: P50 ~45 min, P90 ~65 min (based on config complexity, not independently measured onboarding of genuinely new sources).

### Evidence Gap: First-Attempt Onboarding Economics

**First-attempt onboarding economics remain an evidence gap.** The Phase B sources were developed iteratively before the B-Closure frozen test. The `first_pass: 7/10` telemetry reflects the pipeline's state after hardening, not a genuinely new source's first configuration attempt.

To close this gap, a future test must onboard a source that was NOT part of pipeline development — measuring true first-attempt configuration success rate and time.

### Configuration Requirements

A new source requires these config entries in `source_configs.py`:

1. **Identity**: `code`, `name`, `type`, `country`, `jurisdiction`, `trustTier`
2. **Access**: `websiteUrl`, `feedUrl`, `feed_format` (rss/html_index/pdf)
3. **Patterns**: At least one `*_patterns` list (rate_patterns, regulatory_patterns, statistical_patterns, earnings_patterns)
4. **Keywords**: `content_keywords` for filtering
5. **Event type**: `event_type` matching an entry in `EVENT_TYPE_RULES`
6. **Optional**: `role_patterns` for domain-specific semantic roles
7. **Optional**: `link_pattern` + `link_pattern_prefix` for HTML index sources
8. **Optional**: `published_at` for PDF sources

**Zero code changes required** if the source fits the GREEN path.

### Onboarding vs Intelligence Quality (Critical Distinction)

**Onboarding classification** (GREEN/YELLOW/RED/BLOCKED) measures ease of integration — NOT quality of extracted intelligence.

**Intelligence quality** (PASS/REVIEW/FAIL) measures semantic correctness of the output — NOT ease of integration.

A source can be GREEN (config-only onboarding) AND REVIEW (semantic issues present) simultaneously. These are independent dimensions:

| Onboarding | Intelligence Quality | Meaning |
|-----------|---------------------|---------|
| GREEN | PASS | Config-only onboarding, semantically clean output |
| GREEN | REVIEW | Config-only onboarding, but output has semantic issues requiring review |
| GREEN | FAIL | Config-only onboarding, but output has critical errors |
| YELLOW | PASS/REVIEW/FAIL | Config + manual tuning, varying quality |
| RED | n/a | Engineering required, no output until resolved |
| BLOCKED | n/a | Access constraint, no output produced |

**Phase B evidence with this separation:**

| Source | Onboarding | Intelligence Quality | Semantic Errors | Notes |
|--------|-----------|---------------------|-----------------|-------|
| BOJ | GREEN | REVIEW | 2 | Mixed PRIMARY decisions (dedup limit) |
| SEC | GREEN | PASS | 0 | Clean |
| FCA | GREEN | REVIEW | 1 | defendant_name regex limit (IGNORECASE) |
| BIS_STATS | GREEN | PASS | 0 | Clean |
| APPLE | GREEN | PASS | 0 | Clean |
| OFAC | GREEN | PASS | 0 | Clean |
| BIS_QR | GREEN | PASS | 0 | Clean |
| RBNZ | BLOCKED | n/a | 0 | Content URLs 403 |
| ONS | BLOCKED | n/a | 0 | JS-rendered |
| ARAMCO | BLOCKED | n/a | 0 | Akamai 403 |

---

## 5. When Engineering Is Required

**RED path** (engineering needed):

| Trigger | Engineering Required |
|---------|---------------------|
| Source is Akamai-protected (403 on both urllib + Playwright) | Proxy infrastructure or IP reputation management |
| Source is JS-rendered (static HTML has no data) | Playwright with `wait_until="networkidle"` + JS execution |
| Source requires case-sensitive regex | Core extractor change: per-pattern IGNORECASE control |
| Source produces multiple conflicting PRIMARY facts per paragraph | Core extractor change: deduplication or precedence logic |
| Source uses a new feed format (not RSS/HTML/PDF) | New adapter in fetcher.py |
| Source requires a new event type not in EVENT_TYPE_RULES | Add entry to detector.py (data-driven, but requires testing) |
| Source requires a new pattern category (not rate/regulatory/statistical/earnings) | Add to extractor.py PATTERN_TYPE_METADATA (data-driven) |

**Decision rule**: If any of the above triggers, the source is NOT config-onboardable. Engineering scope must be estimated before commitment.

---

## 6. Provenance and Reproducibility Requirements

### Provenance

**Required for publishable IOs**: 100% provenance chain completeness.

Every Intelligence Object must have:
- Source identity (code, name, URL, type, jurisdiction, trust tier)
- Document identity (title, URL, publication date)
- Fact identity (metric, value, paragraph index, excerpt)
- Evidence record (linking fact to document)
- Provenance chain (verified: all fields populated)

**Evidence**: 7/10 Phase B sources achieved 100% provenance. 3/10 (RBNZ, ONS, ARAMCO) did not produce IOs due to access constraints — no low-confidence IOs were published.

### Reproducibility

**Required**: 100% reproducibility for publishable IOs.

Re-running extraction on the same document must produce the same facts (by metric + value + paragraph index).

**Evidence**: 7/10 Phase B sources achieved 100% reproducibility. The pipeline is deterministic — no random/LLM-based extraction.

---

## 7. BLOCKED Classification Criteria

A source is classified `BLOCKED` (not `FAILED`) when:

| Condition | Classification | Rationale |
|-----------|---------------|----------|
| Both urllib + Playwright return 403 | `access_blocked` | Environmental — IP reputation or bot detection |
| RSS works but content URLs return 403 | `partial_blocked` | Environmental — content access restricted |
| Pages fetched but JS-rendered (no data in static HTML) | `content_too_thin` | Environmental — requires JS execution infrastructure |
| Source requires infrastructure not available | `infrastructure_gap` | Honest — don't force low-confidence output |

**BLOCKED is not a pipeline failure.** It is an honest classification that prevents producing low-confidence intelligence from thin or inaccessible content.

> **ROUA prefers no intelligence over low-confidence intelligence.**

### What BLOCKED Does NOT Mean

- It does NOT mean the source is unsupported forever
- It does NOT mean the abstraction failed
- It does NOT mean the source is excluded from onboarding/generalization denominators

### What BLOCKED DOES Mean

- The source requires infrastructure investment before onboarding
- The buyer should know this source needs additional setup
- The pipeline correctly refused to produce misleading output
- The source remains in the denominator for onboarding/generalization metrics (10 sources = 10 denominator)
- The source is excluded only from publishable-output quality metrics (provenance, reproducibility) since no output was produced

---

## Onboarding Classification Summary

| Classification | Definition | Phase B Evidence |
|---------------|-----------|-----------------|
| **GREEN** | Configuration-only onboarding under tested pipeline state, with publishable output | 7/10 |
| **YELLOW** | Config + limited manual tuning, publishable output | 0/10 (not observed) |
| **RED** | Engineering required (core or infrastructure) | 0/10 observed; 2 potential (BOJ, FCA if case-sensitivity/dedup needed) |
| **BLOCKED** | Environmental access constraint | 3/10 (RBNZ, ONS, ARAMCO) |

**Note**: GREEN measures onboarding ease, NOT intelligence quality. See Section 4 for the Onboarding vs Intelligence Quality separation. A GREEN source may still produce REVIEW-quality output requiring semantic review.

---

## Commercial Positioning

### What ROUA Can Honestly Claim

> ROUA supports configuration-driven onboarding across tested institutional source classes, including central banks, regulators, statistical authorities, corporate IR, and government publications, subject to documented access and extraction constraints.

### What ROUA Cannot Claim (Yet)

> ROUA supports all official sources.

> ROUA can access any website.

> Onboarding is always configuration-only.

> Extraction is case-complete across all financial domains.

> First-attempt onboarding economics are proven (evidence gap remains).

### The Honest Commercial Promise

For sources that match the **GREEN path** (Section 4):
- Onboarding time: P50 ~45 min, P90 ~65 min (estimated, not independently measured)
- 0 source-specific code
- 100% provenance for publishable outputs
- 100% reproducibility for publishable outputs
- Publishable outputs require provenance and semantic validation; sources producing unresolved semantic ambiguity are not cleared for unrestricted publication

For sources that trigger **RED** (Section 5):
- Engineering scope must be estimated
- May require core pipeline changes or infrastructure
- Not included in standard onboarding

For sources that are **BLOCKED** (Section 7):
- Classified honestly, not forced
- Requires infrastructure investment
- Not a pipeline failure

---

## Contract Governance

### Evidence Base

This contract is derived from:
- **Phase A.2**: 4/4 accessible central banks publishable (ECB, BOE, FED, BOC)
- **Architecture Gate**: 7/7 gates cleared (0 source-specific code, 0 monetary-policy coupling)
- **Phase B**: 7/10 sources publishable across 5 classes
- **B-Closure**: Frozen pipeline, honest telemetry, 5→3 semantic errors after config remediation

### Versioning

- **v1.0** (this document): Based on Phase B evidence as of 2026-08-12
- Future versions require: new Phase test results + updated evidence commits

### Review Trigger

This contract must be reviewed when:
1. Core pipeline changes (new Architecture Gate required)
2. New source class added (must pass Phase test)
3. Infrastructure added (proxy, JS execution) — may unblock previously BLOCKED sources
4. Buyer feedback reveals unsupported source patterns

---

## Appendix: Phase B Source-by-Source Evidence

| Source | Class | Feed | State | Sem Errors | Onboarding | Intelligence Quality | Notes |
|--------|-------|------|-------|------------|-----------|---------------------|-------|
| BOJ | central_bank | RSS+PDF | PUBLISHABLE | 2 | GREEN | REVIEW | Minutes produce mixed PRIMARY facts (dedup limit) |
| RBNZ | central_bank | RSS | DOCUMENTED | 0 | BLOCKED | n/a | Content URLs 403 |
| SEC | financial_regulator | RSS | PUBLISHABLE | 0 | GREEN | PASS | Clean |
| FCA | financial_regulator | RSS | PUBLISHABLE | 1 | GREEN | REVIEW | defendant_name regex limit (IGNORECASE) |
| ONS | statistical_authority | RSS | DOCUMENTED | 0 | BLOCKED | n/a | JS-rendered pages |
| BIS_STATS | statistical_authority | RSS | PUBLISHABLE | 0 | GREEN | PASS | 91 facts, 7 IOs |
| APPLE | corporate_ir | Atom | PUBLISHABLE | 0 | GREEN | PASS | Revenue $109.4B |
| ARAMCO | corporate_ir | HTML | BLOCKED | 0 | BLOCKED | n/a | Akamai 403 |
| OFAC | government_regulatory | HTML index | PUBLISHABLE | 0 | GREEN | PASS | 627 facts, 9 IOs |
| BIS_QR | (PDF format) | PDF | PUBLISHABLE | 0 | GREEN | PASS | 24 facts from PDF |

**Totals**:
- Onboarding: 7 GREEN, 0 YELLOW, 0 RED, 3 BLOCKED (denominator = 10)
- Intelligence Quality (publishable only): 5 PASS, 2 REVIEW, 0 FAIL (denominator = 7 publishable)
- 0 source-specific code
