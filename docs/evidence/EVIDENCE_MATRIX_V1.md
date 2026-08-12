# Evidence Matrix V1

**Date**: 2026-08-12
**Branch**: `evidence-matrix` (documentation only, from `146aa3b`)
**Purpose**: Separate observed facts from commercial claims. No code, no config, no Contract changes.

---

## Evidence Base

| Commit | Description | Branch |
|--------|-------------|--------|
| `de64f31` | Frozen pipeline baseline (immutable) | `pipeline-b-closure` |
| `a363d9d` | B-Closure remediation + STOP condition | `pipeline-b-closure` |
| `7710a84` | Supported Source Contract v1.0 (corrected) | `pipeline-b-closure` |
| `146aa3b` | Extraction Hardening CLEARED | `extraction-hardening` |
| `c8af140` | BEA first-attempt PASS | `new-source-validation` |
| `27294db` | ESMA RSS first-attempt FAIL | `new-source-validation-esma` |
| `8041cda` | ESMA HTML first-attempt FAIL | `esma-html-validation` |

All three new-source tests were run from base `146aa3b` (Extraction Hardening CLEARED). No core code was modified during any test.

---

## Matrix — 18 Dimensions × 3 Source Tests

| Dimension | BEA | ESMA RSS | ESMA HTML |
|-----------|-----|----------|-----------|
| **Source class** | statistical_authority | financial_regulator | financial_regulator |
| **Access** | ✓ (urllib, RSS 2.0) | ✓ (urllib, RSS 2.0) | ✓ (urllib, HTML index) |
| **Fetch** | ✓ (10 docs) | ✓ (10 docs) | ✓ (10 docs via link_pattern) |
| **Normalization** | ✓ (10/10) | ✓ (10/10) | ✓ (10/10) |
| **Extraction** | ✓ (237 facts) | ✓ (122 facts) | ✓ (122 facts) |
| **Event detection** | ✓ (10 events) | ✓ (10 events) | ✓ (10 events) |
| **Evidence construction** | ✓ (237 chains) | ✓ (122 chains) | ✓ (122 chains) |
| **Semantic validation** | ✓ (0 errors) | ✓ (0 errors) | ✓ (0 errors) |
| **Reproducibility** | PASS | PASS | PASS |
| **Provenance** | ✓ (100%) | ✗ (0%) | ✗ (0%) |
| **Publishability** | ✓ (10/10) | ✗ (0/10) | ✗ (0/10) |
| **Core intervention** | 0 | 0 | 0 |
| **Source-specific code** | 0 | 0 | 0 |
| **Config-only** | Yes | Yes | Yes |
| **First attempt** | PASS | FAIL | FAIL |
| **Human config time** | ~3 min (estimated) | ~3 min (estimated) | ~4 min (estimated) |
| **Pipeline runtime** | 15.2s | 9.6s | 9.68s |
| **Failure reason** | — | document_date empty (no `<pubDate>` in RSS feed) | document_date empty (no `\d{8}` date in URLs) |

### Key Observations from the Matrix

1. **Access through evidence construction**: All 3 tests passed identically (10 docs, normalized, facts, events, evidence chains, semantic validation, reproducibility).
2. **Provenance is the gate**: BEA passed provenance (100%) and became publishable. Both ESMA paths failed provenance (0%) and could not publish.
3. **The failure is NOT in access, extraction, or semantics** — it is specifically in the provenance layer's dependency on `document_date`.
4. **Core intervention = 0 and source-specific code = 0** across all 3 tests. The pipeline was not modified.
5. **Pipeline runtime (15.2s / 9.6s / 9.68s) is NOT onboarding time** — it is execution time only.

---

## Inference Layers

### Layer 1: Observed

These are facts directly recorded from the test runs. No interpretation.

1. BEA (statistical_authority, RSS with `<pubDate>`) was onboarded configuration-only on the first attempt, producing 10 publishable IOs with 100% provenance and reproducibility.
2. ESMA (financial_regulator, RSS without `<pubDate>`) was onboarded configuration-only but produced 0 publishable IOs because `document_date` was empty, causing provenance chain verification to fail.
3. ESMA (financial_regulator, HTML index with slug-based URLs) was onboarded configuration-only but produced 0 publishable IOs for the same reason: `document_date` was empty because URLs contain no `\d{8}` date pattern.
4. All 3 tests required 0 core code modifications and 0 source-specific code.
5. All 3 tests passed reproducibility (deterministic re-extraction produces same facts).
6. All 3 tests had 0 semantic errors in the sampled IOs.
7. ESMA's dates exist in document content text (e.g., "03/08/2026") but were not captured by either the RSS parser or the HTML index adapter.
8. BEA's dates were available via standard RSS `<pubDate>` element and were captured correctly.

### Layer 2: Supported Inference

These are conclusions that can be reasonably drawn from the 3 tests, but with explicit acknowledgment of sample size limitations.

1. **Access compatibility ≠ provenance compatibility.** A source can be fully accessible, fetchable, normalizable, extractable, and semantically correct — yet still fail to produce publishable output if the provenance layer cannot obtain `document_date`. This is observed in both ESMA tests (8/10 pipeline stages passed, but provenance failed).

2. **The provenance layer's `document_date` dependency is a configuration abstraction boundary.** Sources that provide dates via standard RSS `<pubDate>`, URL `\d{8}` patterns, or config `published_at` can achieve publishable output through configuration. Sources that provide dates only in document content text cannot — within the tested pipeline state.

3. **Configuration-only onboarding is possible for sources that match the pipeline's existing date extraction paths.** BEA demonstrated this. The pipeline's date extraction paths are: (a) RSS `<pubDate>` / `<dc:date>` / Atom `<published>`, (b) URL `\d{8}` pattern (HTML index), (c) config `published_at` (PDF).

4. **The pipeline's extraction, event detection, and evidence construction layers are source-class-agnostic.** Both statistical_authority (BEA) and financial_regulator (ESMA) produced facts, events, and evidence chains through the same configuration-driven patterns, without core code changes.

5. **Extraction Hardening (commit `146aa3b`) did not introduce regressions in new-source onboarding.** All 3 tests ran from `146aa3b` and produced correct extraction results.

### Layer 3: Not Established

These are claims that the current evidence does NOT support. They must not be made commercially.

1. **A commercial source-onboarding success rate cannot be calculated from 2 sources.** BEA (1 PASS) + ESMA (1 FAIL) = 50% is not a statistically meaningful rate. It is an observation from a sample of 2.

2. **Pipeline runtime (15.2s / 9.6s / 9.68s) is NOT onboarding economics.** These are execution times. Human onboarding time (pattern design, config writing, testing, review) was estimated at 3-4 minutes per source but was not independently measured. True onboarding economics require a genuinely new source onboarded by a person who did not design the pipeline.

3. **It is NOT established that "the pipeline has no mechanism to extract document_date from document content text."** What is established is that the RSS parser and HTML index adapter — the two paths tested — did not extract it. Other paths (PDF adapter, future adapters) were not tested for this capability. A broader claim about the pipeline's capabilities requires broader testing.

4. **It is NOT established that ESMA is "unsupported."** ESMA is unsupported through the tested configuration paths (RSS and HTML index). Other approaches (PDF adapter, content-text date extraction, config `published_at`) were not tested. ESMA may become supported through a different path or through a generic pipeline enhancement.

5. **It is NOT established that the configuration abstraction will generalize to all source classes.** BEA (statistical_authority) passed; ESMA (financial_regulator) failed. This does not mean all statistical authorities will pass or all financial regulators will fail. It means the tested paths have a date-extraction boundary that affects ESMA specifically.

6. **It is NOT established that first-attempt configuration-only onboarding is "typical" or "expected."** One data point (BEA) is insufficient to establish a typical pattern. More sources are needed.

---

## Commercial Claims — Current Evidence Boundary

### What We Can Say Now

> ROUA's pipeline can process official financial sources across at least 2 institutional classes (statistical authority, financial regulator) through configuration-driven onboarding, producing verified Intelligence Objects with complete provenance and reproducibility — for sources whose publication dates are available through the pipeline's existing date extraction paths (RSS `<pubDate>`, URL date pattern, or config `published_at`).

> Configuration-only onboarding has been demonstrated for at least 1 genuinely new source (BEA) on the first attempt, without core code changes or source-specific code.

> Access compatibility does not guarantee provenance compatibility. A source may pass access, fetch, normalization, extraction, event detection, evidence construction, semantic validation, and reproducibility — yet fail to produce publishable output if the provenance layer cannot obtain `document_date`.

### What We Can Say After More Samples

> A source-onboarding success rate can be calculated after testing ≥10 genuinely new sources across ≥3 institutional classes. Until then, no percentage claim is valid.

> Onboarding economics (P50/P90 time, first-attempt success rate) can be claimed after independent measurement by an onboarding engineer who did not design the pipeline.

> The configuration abstraction boundary (which sources are config-onboardable vs. which require engineering) can be mapped after systematic testing of source classes × access paths × date availability patterns.

### What We Cannot Say Ever Based on This Test Alone

> "ROUA supports all official sources." — Not tested, not claimed.

> "Onboarding is always configuration-only." — ESMA disproves this for the tested paths.

> "The pipeline can extract dates from any document content." — Not tested.

> "Extraction is case-complete across all financial domains." — Not tested; B-Closure showed 2 REVIEW sources (BOJ, FCA) before hardening, and extraction coverage gaps exist (e.g., FCA defendant_name patterns don't capture "Ms/Mr X" format).

> "Pipeline runtime = onboarding time." — These are different measurements. Pipeline runtime is 9-15 seconds; onboarding time includes human pattern design, config writing, testing, and review.

---

## Appendix: Test Conditions

| Condition | BEA | ESMA RSS | ESMA HTML |
|-----------|-----|----------|-----------|
| Base commit | `146aa3b` | `146aa3b` | `146aa3b` |
| Branch | `new-source-validation` | `new-source-validation-esma` | `esma-html-validation` |
| Evidence commit | `c8af140` | `27294db` | `8041cda` |
| Source in baseline? | No | No | No |
| Core code modified? | No | No | No |
| Source-specific code? | No | No | No |
| Pipeline frozen during test? | Yes | Yes | Yes |
| Semantic reviewer modified? | No | No | No |
| Contract modified? | No | No | No |
| Website modified? | No | No | No |
| Remediation attempted? | No | No | No |
