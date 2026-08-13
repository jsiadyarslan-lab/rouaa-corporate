# Onboarding Boundary Analysis Protocol v1

**Status**: Draft for approval
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

## Decision Tree (Proposed)

```
New Official Source
        │
        ├── 1. Supported access path?
        │        │
        │        ├── NO (JS-rendered, Akamai-blocked, auth-required)
        │        │        → ENGINEERING (infrastructure required)
        │        │
        │        └── YES (RSS, HTML index, PDF — accessible via urllib)
        │                │
        │                ├── 2. Provenance metadata available?
        │                │        │
        │                │        ├── NO (no <pubDate>, no <dc:date>, no URL date pattern, no config date)
        │                │        │        → NOT PUBLISHABLE via configuration
        │                │        │        (extraction works, but provenance incomplete)
        │                │        │
        │                │        └── YES (date available via supported path)
        │                │                │
        │                │                ├── 3. Substantive content in static HTML/PDF?
        │                │                │        │
        │                │                │        ├── NO (content is JS-rendered or empty)
        │                │                │        │        → ENGINEERING (JS execution infrastructure)
        │                │                │        │
        │                │                │        └── YES (static HTML or PDF with >1000 chars text)
        │                │                │                │
        │                │                │                ├── 4. Pattern category exists?
        │                │                │                │        │
        │                │                │                │        ├── NO (new domain not covered by rate/regulatory/statistical/earnings patterns)
        │                │                │                │        │        → ENGINEERING (new pattern category + PATTERN_TYPE_METADATA)
        │                │                │                │        │
        │                │                │                │        └── YES (existing pattern category covers this source's content)
        │                │                │                │                │
        │                │                │                │                └── CONFIGURATION-ONLY CANDIDATE
        │                │                │                │                        │
        │                │                │                │                        └── First-attempt validation
        │                │                │                │                                │
        │                │                │                │                                ├── PASS → ONBOARDED
        │                │                │                │                                └── FAIL → REVIEW (document root cause)
```

---

## Boundary Factors (5 Gates)

Each gate is a binary decision. A source must pass ALL 5 gates to be a configuration-only candidate.

### Gate 1: Access Path

**Question**: Can the source be fetched via an existing adapter (RSS, HTML index, PDF) using urllib?

| Outcome | Classification | Evidence |
|---------|---------------|----------|
| RSS/Atom/RDF accessible | PASS gate | BEA, SNB, ESMA (RSS), Phase A sources |
| HTML index accessible | PASS gate | OFAC, ESMA (HTML) |
| PDF accessible | PASS gate | BIS_QR, BOJ (PDF content) |
| JS-rendered (static HTML empty) | FAIL → Engineering | ONS |
| Akamai/403 blocked (urllib + Playwright) | FAIL → Engineering | RBA, ARAMCO, RBNZ (content URLs) |
| Authentication required | FAIL → Engineering | (not tested) |

**Supported paths**: `feed_format` = `rss` (default), `html_index`, `pdf`

### Gate 2: Provenance Metadata

**Question**: Is `document_date` available through a supported extraction path?

| Path | How it works | Evidence |
|------|-------------|----------|
| RSS `<pubDate>` | Parser extracts from feed item | BEA, Phase A sources |
| Dublin Core `<dc:date>` | Parser extracts from feed item | **SNB** (confirmed) |
| Atom `<published>`/`<updated>` | Parser extracts from feed entry | (supported, not yet tested) |
| URL `\d{8}` date pattern | HTML index adapter extracts from URL | OFAC |
| Config `published_at` | Manually set in source config | BIS_QR (PDF) |
| Content text only | NOT supported by any tested path | **ESMA** (FAIL — dates in content, not in feed/URL) |

**If NO date path**: extraction works, evidence chains build, but `chain_verified = False` → NOT PUBLISHABLE.

### Gate 3: Content Substance

**Question**: Does the fetched page contain substantive text (>1000 chars after normalization)?

| Outcome | Classification | Evidence |
|---------|---------------|----------|
| Static HTML with >1000 chars text | PASS gate | BEA (45K), SNB (18K), ESMA (3K), OFAC (10K) |
| PDF with extractable text | PASS gate | BIS_QR (pdfplumber), BOJ (minutes) |
| JS-rendered (static HTML <1000 chars) | FAIL → Engineering | ONS (1995 chars of cookie/JS text) |
| Empty content | FAIL → Review | SNB doc 10 (circular letter, 0 chars) |

### Gate 4: Pattern Category Coverage

**Question**: Does an existing pattern category (`rate_patterns`, `regulatory_patterns`, `statistical_patterns`, `earnings_patterns`) cover this source's content domain?

| Outcome | Classification | Evidence |
|---------|---------------|----------|
| Existing category covers content | PASS gate | BEA (statistical), SNB (rate), ESMA (regulatory), OFAC (regulatory) |
| New domain not covered | FAIL → Engineering | (not yet encountered — would need new `*_patterns` category + PATTERN_TYPE_METADATA entries) |

**Note**: Adding a new pattern category is data-driven (add to config + metadata dict), but requires testing. It is classified as Engineering because it extends the pipeline's domain coverage, not just its source coverage.

### Gate 5: First-Attempt Validation

**Question**: Does the first configuration attempt produce ≥1 publishable IO?

| Outcome | Classification |
|---------|---------------|
| ≥1 publishable IO (provenance complete, confidence ≥0.7) | PASS → ONBOARDED |
| 0 publishable IOs | FAIL → REVIEW (document root cause) |

**This gate is the actual test.** Gates 1-4 are pre-screening — they predict whether Gate 5 is likely to pass. If Gates 1-4 all pass but Gate 5 fails, the root cause must be documented (it may reveal a new boundary factor).

---

## Evidence Mapping

### Sources that PASSED all 5 gates

| Source | Gate 1 (Access) | Gate 2 (Provenance) | Gate 3 (Content) | Gate 4 (Pattern) | Gate 5 (First attempt) |
|--------|----------------|--------------------|--------------------|-------------------|----------------------|
| BEA | RSS (urllib) | `<pubDate>` | 45K chars static HTML | statistical_patterns | PASS (10/10 publishable) |
| SNB | RSS (urllib) | `<dc:date>` | 18K chars static HTML | rate_patterns | PASS (1/1 publishable) |

### Sources that FAILED a gate

| Source | Failed gate | Root cause | Classification |
|--------|-----------|-----------|---------------|
| ESMA (RSS) | Gate 2 | No `<pubDate>`, no `<dc:date>` — dates in content text only | NOT PUBLISHABLE via config |
| ESMA (HTML) | Gate 2 | No `\d{8}` in URLs — slug-based URLs | NOT PUBLISHABLE via config |
| ONS | Gate 3 | JS-rendered — static HTML has no statistical data | Engineering (JS execution) |
| RBA | Gate 1 | Akamai 403 on urllib + Playwright | Engineering (proxy/IP) |
| ARAMCO | Gate 1 | Akamai 403 on urllib + Playwright | Engineering (proxy/IP) |
| RBNZ | Gate 1 (partial) | RSS open, content URLs 403 | Engineering (proxy for content) |

### Sources that PASSED gates 1-4 in Phase B (pre-existing)

| Source | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 |
|--------|--------|--------|--------|--------|--------|
| ECB | RSS | `<pubDate>` | Static HTML | rate_patterns | PASS |
| BOE | RSS | `<pubDate>` | Static HTML | rate_patterns | PASS |
| FED | RSS | `<pubDate>` | Static HTML | rate_patterns | PASS |
| BOC | RSS | `<pubDate>` | Static HTML | rate_patterns | PASS |
| BOJ | RSS | `<dc:date>` | PDF | rate_patterns | PASS |
| SEC | RSS | `<pubDate>` | Static HTML | regulatory_patterns | PASS |
| FCA | RSS | `<pubDate>` | Static HTML | regulatory_patterns | PASS (0 facts after hardening — false positives removed) |
| BIS_STATS | RSS | `<pubDate>` | Static HTML | statistical_patterns | PASS |
| APPLE | Atom | `<published>` | Static HTML | earnings_patterns | PASS |
| OFAC | HTML index | URL `\d{8}` | Static HTML | regulatory_patterns | PASS |
| BIS_QR | PDF | Config `published_at` | PDF text | statistical_patterns | PASS |

---

## What This Protocol Produces

### Output 1: Pre-Onboarding Screening Checklist

Before attempting configuration, answer 4 questions:

1. **Can we fetch it?** (RSS/HTML/PDF via urllib — no JS/proxy/auth)
2. **Can we get the date?** (`<pubDate>`, `<dc:date>`, `<published>`, URL `\d{8}`, or config `published_at`)
3. **Is there substantive content?** (>1000 chars in static HTML or PDF)
4. **Does a pattern category exist?** (rate/regulatory/statistical/earnings)

If all 4 = YES → **Configuration-only candidate** → proceed to first-attempt test.

If any = NO → **Engineering candidate** → document which gate failed and what engineering is needed.

### Output 2: Boundary Map

A decision map that tells ROUA (and the buyer):

- Which source classes are likely configuration-only candidates
- Which source characteristics require engineering
- What type of engineering is needed (infrastructure, parser, pattern category)

### What This Protocol Does NOT Produce

- A success rate (sample too small)
- A guarantee (gates 1-4 passing does not guarantee gate 5 passing)
- Onboarding time estimates
- A list of "supported sources" (the Contract already covers this)

---

## Validation Plan

To validate this boundary map, we need to test:

1. **A source that passes gates 1-4 but fails gate 5** — this would reveal a hidden boundary factor
2. **A source that fails gate 2 but could be fixed with content-text date extraction** — this would test whether the provenance boundary is hard or soft
3. **A source from a new institutional class not yet tested** — this would test whether gates 1-4 generalize

Each validation test follows the same protocol: pre-screen against gates 1-4, then attempt first-attempt configuration, then record which gate (if any) was the failure point.

---

## Commercial Implication

This boundary analysis allows ROUA to say to a buyer:

> "Before we attempt onboarding your source, we can screen it against 4 criteria. If all 4 pass, onboarding is a configuration exercise. If any fails, we can tell you exactly what engineering is needed and why."

This is more valuable than a success rate because it provides **predictability** — the buyer knows what to expect before the engagement begins.

---

## Relationship to Existing Documents

| Document | Role | Relationship |
|----------|------|-------------|
| Supported Source Contract v1.0 | What ROUA supports | This protocol explains **why** those sources are supported (they pass gates 1-4) |
| Evidence Matrix V2 | What was tested | This protocol maps the test results to boundary factors |
| Validation Protocol v2 | How to test a new source | This protocol adds pre-screening before the test |
| Extraction Hardening | Pipeline state | This protocol is based on the hardened pipeline (`146aa3b`) |
