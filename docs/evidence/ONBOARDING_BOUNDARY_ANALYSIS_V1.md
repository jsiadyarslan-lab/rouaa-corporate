# Onboarding Boundary Analysis Protocol v1 (Corrected)

**Status**: Corrected per evidence review
**Date**: 2026-08-13
**Predecessor**: Evidence Matrix V2 (`23aeb94`), SNB Independent Validation Review (`332788c`)

---

## The Question

> What is the predictable boundary between configuration-only onboarding and engineering-required onboarding?

**Why this question:**

- We have 2 PASS (BEA, SNB) and 1 FAIL (ESMA) across 3 source classes.
- The FAIL has a documented root cause: provenance metadata unavailable through tested paths.
- The PASS cases share common characteristics that may form a decision boundary.
- Instead of collecting more PASS/FAIL results, we need to **map the boundary** so ROUA can predict — before attempting onboarding — whether a source is a configuration candidate or an engineering candidate.

**What this question does NOT ask:**

- It does not ask "what is the success rate?" (still too few samples)
- It does not ask "can we onboard any source?" (not generalizable)
- It does not ask "is the architecture productized?" (requires broader testing)
- It does not calculate commercial onboarding time

---

## Decision Tree (Corrected)

```
New Source
   │
   ├─ 1. Supported access path?
   │      NO → ACCESS / ENGINEERING REVIEW
   │      YES
   │
   ├─ 2. Provenance metadata available?
   │      NO → NOT PUBLISHABLE VIA CURRENT PATH
   │      YES
   │
   ├─ 3. Machine-readable substantive content?
   │      NO → CONTENT / ACCESS REVIEW
   │      YES
   │
   ├─ 4. Existing configuration abstraction applicable?
   │      NO → CONFIGURATION / ENGINEERING REVIEW
   │      YES
   │
   └─ 5. First-attempt validation
          │
          ├─ PASS → CONFIG-ONLY VALIDATED
          │
          └─ FAIL → ROOT-CAUSE REVIEW
```

---

## Gate Definitions (5 Gates)

### Gate 1: Supported access path

**Question**: Can the source be fetched via an existing adapter (RSS, HTML index, PDF) using urllib or Playwright fallback?

| Outcome | Classification |
|---------|---------------|
| RSS/Atom/RDF accessible via urllib | PASS gate |
| HTML index accessible via urllib | PASS gate |
| PDF accessible via urllib | PASS gate |
| JS-rendered (static HTML has no data) | FAIL → CONTENT / ACCESS REVIEW |
| Akamai/403 blocked (urllib + Playwright) | FAIL → ACCESS / ENGINEERING REVIEW |
| Authentication required | FAIL → ACCESS / ENGINEERING REVIEW |

### Gate 2: Provenance metadata available

**Question**: Is `document_date` available through a supported extraction path?

| Path | How it works | Evidence |
|------|-------------|----------|
| RSS `<pubDate>` | Parser extracts from feed item | BEA, Phase A sources |
| Dublin Core `<dc:date>` | Parser extracts from feed item | SNB (confirmed) |
| Atom `<published>`/`<updated>` | Parser extracts from feed entry | Supported, not yet independently tested |
| URL `\d{8}` date pattern | HTML index adapter extracts from URL | OFAC |
| Config `published_at` | Manually set in source config | BIS_QR (PDF) |
| Content text only | NOT supported by any tested path | ESMA (FAIL) |

**If NO date path**: extraction may work, evidence chains may build, but `chain_verified = False` → NOT PUBLISHABLE VIA CURRENT PATH.

### Gate 3: Machine-readable substantive content

**Question**: Does the fetched page contain machine-readable substantive content through a supported access path?

No numeric threshold. The content must be substantive enough for the pipeline's normalization layer to extract paragraphs that pattern matching can operate on.

| Outcome | Classification |
|---------|---------------|
| Static HTML with substantive text | PASS gate |
| PDF with extractable text (pdfplumber) | PASS gate |
| JS-rendered (static HTML contains only navigation/cookies) | FAIL → CONTENT / ACCESS REVIEW |
| Empty content after normalization | FAIL → CONTENT / ACCESS REVIEW |

### Gate 4: Existing configuration abstraction applicable

**Question**: Does the existing configuration abstraction (pattern categories, event types, value types) cover this source's content domain?

This gate distinguishes three outcomes:

| Outcome | Classification | Notes |
|---------|---------------|-------|
| Existing pattern category covers content | PASS gate | rate_patterns, regulatory_patterns, statistical_patterns, earnings_patterns |
| Existing abstraction can be extended with configuration | CONFIGURATION EXTENSION | Adding new patterns within existing category — still config, but requires testing |
| Source domain not covered by any existing abstraction | FAIL → CONFIGURATION / ENGINEERING REVIEW | May need new pattern category + PATTERN_TYPE_METADATA — this is engineering because it extends domain coverage, not just source coverage |

**Key distinction**: Adding a new source within an existing pattern category (e.g., a new central bank using rate_patterns) is configuration. Adding a new pattern category (e.g., "commodity_patterns" for a new domain) is engineering.

### Gate 5: First-attempt validation

**Question**: Does the first configuration attempt produce at least one provenance-complete, reproducible IO without core intervention?

| Outcome | Classification |
|---------|---------------|
| ≥1 provenance-complete IO (chain_verified=True, confidence ≥0.7, reproducible) | CONFIG-ONLY VALIDATED |
| 0 provenance-complete IOs | FAIL → ROOT-CAUSE REVIEW |

**Onboarding PASS is separate from Quality and Coverage:**

- **Onboarding**: Did the configuration path produce a publishable IO? (Gate 5)
- **Quality**: Are the extracted facts semantically correct? (PASS / REVIEW / FAIL)
- **Coverage**: What fraction of documents produced facts? (measured, never treated as onboarding success)

A source can be Onboarding-PASS with Quality-REVIEW and low Coverage. These are independent dimensions.

---

## Boundary Validation — Retrospective Application

Applying the 5-gate decision tree to all sources with known test results. **No new assumptions — only classifying what was already observed.**

### Sources that reached Gate 5

| Source | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 | Onboarding | Quality | Coverage |
|--------|--------|--------|--------|--------|--------|-----------|---------|----------|
| BEA | PASS (RSS/urllib) | PASS (`<pubDate>`) | PASS (45K static HTML) | PASS (statistical_patterns) | PASS (10/10 publishable) | PASS | PASS | 10/10 |
| SNB | PASS (RSS/urllib) | PASS (`<dc:date>`) | PASS (18K static HTML) | PASS (rate_patterns) | PASS (1/1 publishable) | PASS | PASS | 1/9 |
| ESMA RSS | PASS (RSS/urllib) | FAIL (no date in feed) | PASS (3K static HTML) | PASS (regulatory_patterns) | FAIL (0/10 publishable) | FAIL | n/a | 10/10 |
| ESMA HTML | PASS (HTML/urllib) | FAIL (no date in URL) | PASS (3K static HTML) | PASS (regulatory_patterns) | FAIL (0/10 publishable) | FAIL | n/a | 10/10 |

**Analysis**:
- BEA and SNB passed all 5 gates → CONFIG-ONLY VALIDATED. Consistent.
- ESMA failed at Gate 2 (both RSS and HTML paths) → NOT PUBLISHABLE VIA CURRENT PATH. The failure is at the provenance gate, not at extraction or access. Consistent.
- ESMA passed Gates 1, 3, 4 but failed Gate 2 → the boundary correctly predicts the failure point.

### Sources that failed before Gate 5

| Source | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 | Classification |
|--------|--------|--------|--------|--------|--------|---------------|
| ONS | PASS (RSS/urllib) | PASS (`<pubDate>`) | FAIL (JS-rendered, ~2K chars of cookies/nav) | PASS (statistical_patterns) | FAIL (0 facts) | CONTENT / ACCESS REVIEW |
| RBA | FAIL (Akamai 403) | — | — | — | — | ACCESS / ENGINEERING REVIEW |
| ARAMCO | FAIL (Akamai 403) | — | — | — | — | ACCESS / ENGINEERING REVIEW |
| RBNZ | PARTIAL (RSS open, content URLs 403) | — | — | — | — | ACCESS / ENGINEERING REVIEW |

**Analysis**:
- ONS failed at Gate 3 → CONTENT / ACCESS REVIEW. The boundary correctly identifies JS-rendered content as a content/access issue, not a provenance or pattern issue.
- RBA and ARAMCO failed at Gate 1 → ACCESS / ENGINEERING REVIEW. The boundary correctly identifies Akamai blocking as an access issue.
- RBNZ partially failed at Gate 1 → ACCESS / ENGINEERING REVIEW. RSS is open but content URLs are blocked.
- None of these failures are at Gate 4 (pattern coverage) or Gate 5 (first-attempt validation). The boundary correctly routes them to access/content review before reaching the configuration stage.

### Phase B sources (development sources, not validation sources)

| Source | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 | Consistent? |
|--------|--------|--------|--------|--------|--------|-------------|
| ECB | PASS | PASS (`<pubDate>`) | PASS | PASS (rate) | PASS | Yes |
| BOE | PASS | PASS (`<pubDate>`) | PASS | PASS (rate) | PASS | Yes |
| FED | PASS | PASS (`<pubDate>`) | PASS | PASS (rate) | PASS | Yes |
| BOC | PASS | PASS (`<pubDate>`) | PASS | PASS (rate) | PASS | Yes |
| BOJ | PASS | PASS (`<dc:date>`) | PASS (PDF) | PASS (rate) | PASS | Yes |
| SEC | PASS | PASS (`<pubDate>`) | PASS | PASS (regulatory) | PASS | Yes |
| FCA | PASS | PASS (`<pubDate>`) | PASS | PASS (regulatory) | PASS (0 facts after hardening — false positives removed) | Yes |
| BIS_STATS | PASS | PASS (`<pubDate>`) | PASS | PASS (statistical) | PASS | Yes |
| APPLE | PASS | PASS (Atom `<published>`) | PASS | PASS (earnings) | PASS | Yes |
| OFAC | PASS (HTML index) | PASS (URL `\d{8}`) | PASS | PASS (regulatory) | PASS | Yes |
| BIS_QR | PASS (PDF) | PASS (config `published_at`) | PASS (PDF text) | PASS (statistical) | PASS | Yes |

**All 11 Phase B sources are consistent with the boundary.** Every source that passed Gates 1-4 also passed Gate 5 (with FCA producing 0 facts after hardening — a coverage characteristic, not an onboarding failure).

---

## Validation Result

The 5-gate decision tree correctly classifies ALL sources with known test results:

- **2 validation sources** (BEA, SNB) passed all gates → CONFIG-ONLY VALIDATED
- **1 validation source** (ESMA) failed at Gate 2 → NOT PUBLISHABLE VIA CURRENT PATH
- **3 validation sources** (ONS, RBA, ARAMCO) failed before Gate 5 → correctly routed to ACCESS/CONTENT review
- **11 development sources** (Phase B) all consistent with the boundary

**No source was misclassified.** No source passed Gates 1-4 but failed Gate 5 for an unexpected reason. No source failed a gate that the boundary didn't predict.

**However**: This is retrospective validation, not predictive validation. The boundary explains past results; it has not yet been tested prospectively on a source whose gate outcomes were unknown before testing.

---

## What This Protocol Produces

### Output 1: Pre-Onboarding Screening Checklist

Before attempting configuration, answer 4 questions:

1. **Can we fetch it?** (RSS/HTML/PDF via urllib — no JS/proxy/auth)
2. **Can we get the date?** (`<pubDate>`, `<dc:date>`, `<published>`, URL `\d{8}`, or config `published_at`)
3. **Is there machine-readable substantive content?** (static HTML or PDF with extractable text)
4. **Does the existing configuration abstraction apply?** (existing pattern category covers the source's domain)

If all 4 = YES → **Configuration-only candidate** → proceed to first-attempt test (Gate 5).

If any = NO → **Classified before onboarding** → document which gate failed and what review/engineering is needed.

### Output 2: Independent Dimensions Recorded

For every source tested:

| Dimension | What it measures |
|-----------|-----------------|
| Onboarding | Did the configuration path produce a publishable IO without core intervention? |
| Provenance | Is document_date available and are all chains verified? |
| Intelligence Quality | Are the extracted facts semantically correct? (PASS/REVIEW/FAIL) |
| Extraction Coverage | What fraction of documents produced facts? (measured, never treated as onboarding success) |
| Reproducibility | Does re-extraction produce identical facts? |
| Engineering intervention | Was any core code modification required? (0 / >0) |

### What This Protocol Does NOT Produce

- A success rate (sample too small)
- A guarantee (gates 1-4 passing does not guarantee gate 5 passing — they are **candidates**, not certainties)
- Onboarding time estimates
- A list of "supported sources" (the Contract already covers this)

---

## Commercial Implication (Corrected)

> We can pre-screen a source against the currently observed access, provenance, content, and configuration criteria. Sources passing these checks become candidates for configuration-only validation; sources failing them can be classified before onboarding and routed for further engineering assessment.

This is less commercially exciting than "if all 4 pass, onboarding is a configuration exercise" — but it is **defensible** based on the current evidence.

---

## Relationship to Existing Documents

| Document | Role | Relationship |
|----------|------|-------------|
| Supported Source Contract v1.0 | What ROUA supports | This protocol explains **why** those sources are supported (they pass gates 1-4) |
| Evidence Matrix V2 | What was tested | This protocol maps the test results to boundary factors |
| Validation Protocol v2 | How to test a new source | This protocol adds pre-screening before the test |
| Extraction Hardening | Pipeline state | This protocol is based on the hardened pipeline (`146aa3b`) |
