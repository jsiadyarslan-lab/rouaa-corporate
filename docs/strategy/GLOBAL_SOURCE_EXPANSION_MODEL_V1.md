# Global Source Expansion Model v1

**Date**: 2026-08-13
**Branch**: `evidence-matrix`
**Status**: DRAFT FOR REVIEW
**Evidence base**: `f5caf57` → `f99e894` → `7384033` → `5d4cef4` → `706c6dd` → `b4fabe9` → `332788c` → `146aa3b` → `7710a84` → `de64f31`
**Type**: Strategic / operational model — documentation only. No code, config, Contract, or website changes.

---

## 1. Purpose

Define how ROUA systematically discovers, prioritizes, qualifies, onboards, maintains, and expands coverage of official financial and economic sources worldwide — across two parallel paths:

- **Global Coverage**: ROUA-led source expansion driven by strategic coverage goals
- **Customer-Specific**: Customer-requested source qualification and onboarding

This model does NOT replace the pipeline, the Supported Source Contract, or the Source Qualification Report Template. It sits above them as the operating model for source expansion at scale.

---

## 2. Strategic Objective

> Build systematic coverage of the broadest possible range of official financial and economic sources worldwide, through a governed process that distinguishes configuration-driven onboarding from engineering-required onboarding, and that prioritizes sources based on institutional importance, economic relevance, and access feasibility.

This is a **strategic direction**, not an achieved capability. The current evidence base demonstrates configuration-driven onboarding for 3 sources across 3 institutional classes. Global coverage at scale requires the operating model defined here, plus further validation.

---

## 3. Global vs Customer Source Expansion

Two distinct but interconnected pipelines:

### Global Source Expansion Pipeline (ROUA-led)

```
Discover → Register → Pre-screen → Prioritize → Qualify → Onboard → Validate → Monitor → Maintain
```

Driven by: ROUA's strategic coverage goals (institutional importance, geographic coverage, economic domain coverage).

### Customer-Specific Expansion (Customer-led)

```
Customer request → Source qualification → Compare with global roadmap → STANDARD / ENGINEERING / CONDITIONAL / NOT SUPPORTED → Commercial scope → Optional roadmap promotion
```

Driven by: Customer's specific source needs and business workflows.

### When customer-specific becomes global

A customer-requested source may be promoted to the global registry when:
- It passes qualification as STANDARD or CONDITIONAL (resolved)
- It has relevance beyond the requesting customer (institutional importance, economic relevance)
- It does not distort the global coverage roadmap (the promotion is a roadmap decision, not an automatic side effect)

**Customer-requested high-value sources may override global sequencing, but must not silently distort the global coverage roadmap.** The decision to promote is owned by Product (Section 16).

---

## 4. Source Universe Taxonomy

The source universe is an inventory of all potential official financial and economic sources worldwide. The taxonomy is **extensible** — new categories can be added as the universe expands.

### Institutional classes (initial)

| Class | Examples | Extensible |
|-------|---------|-----------|
| Central banks | ECB, Federal Reserve, BOE, BOJ, SNB | Yes |
| Financial regulators / supervisory authorities | SEC, FCA, CFTC, FINMA, BaFin | Yes |
| Statistical agencies | BEA, BIS_STATS, ONS, Eurostat | Yes |
| Ministries of finance / treasury | US Treasury, UK HM Treasury | Yes |
| Government economic agencies | OFAC, FDIC, CFPB | Yes |
| Official market / exchange authorities | NYSE, LME, CME | Yes |
| Multilateral financial institutions | IMF, World Bank, BIS, OECD | Yes |
| Sovereign / public financial institutions | Sovereign wealth funds, public development banks | Yes |
| Corporate regulatory / official disclosure sources | SEC EDGAR, regulatory filing systems | Yes |
| Other officially authoritative financial-economic bodies | FSB, IAIS, IOSCO | Yes |

> This taxonomy is NOT complete. It is a starting point. New classes will be discovered as the source universe expands. The taxonomy must remain extensible — adding a new class is an operating-model decision, not a code change.

---

## 5. Source Registry Model

Each source in the universe is registered with the following operating-model fields. These are NOT a database schema — they are the information that must be tracked for each source.

| Field | Description |
|-------|-------------|
| source_id | Unique identifier |
| institution | Official institution name |
| country | Country of jurisdiction |
| region | Geographic region (EU, NA, APAC, MENA, LATAM, Africa) |
| institutional_class | From taxonomy (Section 4) |
| sub_class | Optional sub-classification |
| authority_status | OFFICIAL / QUASI_OFFICIAL / OTHER_AUTHORITATIVE |
| eligible_for_global_official_coverage | YES / NO / REVIEW (separate decision from authority_status) |
| domains | Website domains |
| source_urls | Main content URLs |
| feed_urls | RSS/Atom/PDF feed URLs |
| document_formats | RSS, HTML, PDF, JSON, other |
| access_methods | urllib, Playwright, blocked, auth-required |
| provenance_methods | pubDate, dc:date, URL pattern, config, unavailable |
| language | Primary content language |
| update_frequency | Daily, weekly, monthly, irregular |
| source_priority | Tier 1-4 (Section 8) |
| economic_relevance | High / Medium / Low |
| institutional_relevance | High / Medium / Low |
| market_relevance | High / Medium / Low |
| customer_demand | Number of customers requesting |
| coverage_value | What intelligence this source enables |
| qualification_status | STANDARD / ENGINEERING / CONDITIONAL / NOT SUPPORTED / UNQUALIFIED |
| onboarding_status | DISCOVERED / QUALIFYING / ONBOARDING / VERIFIED / ACTIVE / DEGRADED / BLOCKED |
| quality_status | PASS / REVIEW / FAIL / UNTESTED |
| engineering_dependency | None / access / provenance / content / extraction / semantic |
| last_verified | Date of last health check |
| health_status | HEALTHY / DEGRADED / BLOCKED / UNKNOWN |
| evidence_basis | Test commit / screening / manual review |

---

## 6. Qualification Model

The 5-gate framework from the Boundary Analysis applies to both global and customer qualification:

```
Gate 1 — Access
Gate 2 — Provenance (may be PENDING — depends on content access)
Gate 3 — Content
Gate 4 — Configuration applicability
Gate 5 — First-attempt validation (FAIL → ROOT-CAUSE REVIEW)
```

### Global Qualification

Evaluating a source for ROUA's general coverage. Priority driven by strategic value (Section 7).

### Customer Qualification

Evaluating a source requested by a specific customer. Priority driven by customer need, but the technical framework is identical.

**Same gates, same standards, different business priority.** A source that fails Gate 1 for a customer fails Gate 1 globally — the technical boundary is not negotiable per customer.

---

## 7. Prioritization Framework

### Principle

> Value Score ≠ Onboarding Difficulty Score

Priority is a function of value, cost, and risk:

```
Priority = f(Value, Cost, Risk)
```

This is NOT a financial formula. It is a decision framework.

### Value dimensions (proposed)

| Dimension | Question |
|-----------|----------|
| Institutional importance | How important is this institution to global financial intelligence? |
| Economic importance | How economically significant is the data this source produces? |
| Market impact | Does this source's output move markets? |
| Geographic coverage | Does this source fill a geographic gap? |
| Data uniqueness | Is this data available nowhere else? |
| Research usefulness | How useful is this source for institutional research workflows? |
| Customer demand | How many customers have requested or would benefit from this source? |
| Strategic differentiation | Does covering this source differentiate ROUA from competitors? |
| Source freshness | How frequently is the source updated? |

### Cost / difficulty dimensions (proposed)

| Dimension | Question |
|-----------|----------|
| Access feasibility | Can we reach it via supported paths? (Gate 1) |
| Provenance feasibility | Is document_date available? (Gate 2) |
| Content accessibility | Is content machine-readable? (Gate 3) |
| Configuration effort | How many patterns need to be written? (Gate 4) |
| Engineering effort | If engineering is needed, how much? |
| Maintenance burden | How likely is this source to break or change? |

### Risk dimensions (proposed)

| Dimension | Question |
|-----------|----------|
| Access stability | Is the source likely to block access? |
| Content stability | Is the content format likely to change? |
| Provenance stability | Is the date path reliable? |
| Semantic complexity | How complex is the extraction domain? |

### Weighting

No final weights are assigned in this model. Weights require calibration against actual onboarding experience — which has not yet been done at scale. The dimensions are proposed; the weighting framework is suggested; the calibration is deferred.

### Decision principles (in lieu of weights)

1. High-value + low-difficulty sources are onboarded first.
2. High-value + high-difficulty sources are strategic engineering investments — approved case by case.
3. Low-value + high-difficulty sources are deferred.
4. Low-value + low-difficulty sources are opportunistic — onboarded when capacity allows.
5. Customer demand can elevate priority but cannot override technical feasibility.
6. Reusable platform capability is preferred over one-source engineering.

---

## 8. Tiering

Sources are classified into operational tiers based on combined value and coverage significance:

| Tier | Name | Criteria | Treatment |
|------|------|----------|-----------|
| Tier 1 | Strategic Core | Systemically important institutions whose output drives global financial intelligence | Priority onboarding, continuous monitoring, proactive maintenance |
| Tier 2 | High-Value Expansion | Important institutions that fill significant coverage gaps | Prioritized after Tier 1, regular monitoring |
| Tier 3 | Specialized Coverage | Niche or regional sources with specific intelligence value | Onboarded based on demand or strategic fit |
| Tier 4 | Long-Tail / Opportunistic | Lower-priority sources that may become valuable | Onboarded opportunistically when capacity allows |

### Transition criteria

- Tier 1 → always Tier 1 (unless institution closes or merges)
- Tier 2 → Tier 1: when source becomes systemically important (e.g., new regulatory mandate)
- Tier 3 → Tier 2: when customer demand or strategic value increases
- Tier 4 → Tier 3: when a specific use case emerges
- Any tier → lower: when source becomes redundant or deprecated

Tiers are reviewed quarterly. They are NOT permanent.

---

## 9. Engineering Allocation

### Decision matrix

| Value | Difficulty | Decision |
|-------|-----------|----------|
| High | Low | **Immediate** — standard onboarding path |
| High | Medium | **Prioritize** — standard path with additional config effort |
| High | High | **Strategic engineering** — approved case by case, requires engineering scope |
| Medium | Low | **Scheduled** — onboard when capacity allows |
| Medium | High | **Defer** — revisit when engineering capacity or abstraction improves |
| Low | Low | **Opportunistic** — onboard if capacity and no blockers |
| Low | High | **Defer** — not worth engineering investment |

### Rule

> Customer-requested high-value sources may override global sequencing, but must not silently distort the global coverage roadmap.

This means: a customer request for a high-value source can move it up the queue, but the decision is explicit and owned by Product (Section 16). It does not happen automatically because Sales asked for it.

---

## 10. Global Expansion Lifecycle

```
DISCOVERED
    ↓
QUALIFYING (Gates 1-4 pre-screen)
    ↓  (transition to ONBOARDING only if pre-screen allows Gate 5 attempt)
ONBOARDING (Gate 5 first-attempt + config)
    ↓
VERIFIED (provenance + reproducibility confirmed)
    ↓
ACTIVE (in production, monitored)
    ↓
[DEGRADED] ←→ [BLOCKED] (health issues)
    ↓
REMEDIATION (root-cause review, engineering if needed)
    ↓
VERIFIED (re-verified after remediation)
    ↓
ACTIVE
```

### Lifecycle states

| State | Meaning | Owner |
|-------|---------|-------|
| DISCOVERED | Source identified, not yet screened | Research / Intelligence |
| QUALIFYING | Pre-screen in progress (Gates 1-4) | Solutions Architect |
| ONBOARDING | Configuration + first-attempt validation (Gate 5) | Solutions Architect |
| VERIFIED | Provenance + reproducibility confirmed | Intelligence / Data |
| ACTIVE | In production, monitored | Operations |
| DEGRADED | Health issue detected (fetch failure, content change) | Operations |
| BLOCKED | Source inaccessible or broken | Operations |
| REMEDIATION | Root-cause review and fix in progress | Engineering (if triggered) |

---

## 11. Customer-Request Workflow

```
Customer submits source list
    ↓
Source Qualification Report (per source)
    ↓
Compare with global registry
    ├── Already ACTIVE → confirm to customer
    ├── Already QUALIFIED → share qualification status
    ├── New source → run qualification gates
    └── Known blocker → share classification
    ↓
Commercial scope definition
    ↓
Optional: promote to global roadmap (if high-value)
```

### Customer-specific vs global

- Customer-specific sources are qualified using the same 5-gate framework
- The qualification result is the same technically (STANDARD / ENGINEERING / CONDITIONAL / NOT SUPPORTED)
- The difference is in prioritization and commercial treatment — not in technical standards
- A customer-specific source that proves valuable can be promoted to the global registry (Section 3)

---

## 12. Engineering Backlog Model

Engineering work is tracked as a backlog of reusable capabilities, not one-off source fixes.

### Backlog categories

| Category | Example | Reusability |
|----------|---------|-------------|
| Source gap | New source needs onboarding | Source-specific (config) |
| Access gap | Akamai blocking, JS rendering | High (proxy infrastructure, JS execution) |
| Provenance gap | Date in content text, not in feed | High (content-text date extraction) |
| Content gap | New document format | Medium (new adapter) |
| Extraction gap | New pattern category needed | High (extends abstraction) |
| Semantic gap | Role detection, deduplication | High (improves quality across sources) |
| Monitoring gap | Health detection, change detection | High (platform capability) |

### Backlog item fields

| Field | Description |
|-------|-------------|
| business_value | Why this matters |
| affected_sources | How many sources benefit |
| reusability | Is this a platform capability or one-source fix? |
| engineering_effort | Scope estimate (not timeline) |
| risk | What could go wrong |
| customer_demand | Is this customer-requested? |

### Rule

> Prefer reusable platform capability over one-source engineering.

An engineering item that benefits 10 sources is prioritized over one that benefits 1 source, even if the single-source item has higher individual value.

---

## 13. Maintenance Lifecycle

Sources are not "done" after onboarding. They have a lifecycle:

### Health monitoring dimensions

| Dimension | What is monitored |
|-----------|------------------|
| Fetch health | Can we still reach the source? |
| Provenance health | Is document_date still available? |
| Extraction health | Are patterns still matching? |
| Content health | Has the content format changed? |
| Change detection | Has the source's RSS/HTML structure changed? |

### Requalification triggers

- Fetch failure rate exceeds threshold
- Provenance chain starts failing (document_date empty)
- Extraction produces 0 facts where it previously produced facts
- Content format change detected (HTML structure change, feed format change)
- Source announces a website redesign or API change
- Customer reports missing intelligence

### Requalification process

```
Trigger detected
    ↓
Root-cause review
    ↓
If config fix → update config, re-verify
If engineering needed → engineering backlog item
If source deprecated → mark as BLOCKED, notify customers
```

---

## 14. Coverage Metrics

Metrics for internal operations — NOT marketing numbers.

| Metric | What it measures |
|--------|-----------------|
| Sources discovered | Total in registry |
| Sources qualified | Have a qualification status |
| Sources active | In production, monitored |
| Sources verified | Provenance + reproducibility confirmed |
| Sources by institutional class | Distribution across taxonomy |
| Sources by country | Geographic distribution |
| Sources by language | Language distribution |
| Sources by document format | RSS, HTML, PDF distribution |
| Coverage by economic domain | Which economic domains are covered |
| Coverage by institutional importance | Tier 1-4 distribution |
| Coverage gaps | Important institutions not yet covered |
| Engineering backlog | Items waiting for engineering |
| Customer-requested coverage | Sources requested by customers |

### Key distinction

> Coverage breadth ≠ intelligence quality

Having 100 sources in the registry does not mean 100 sources produce high-quality intelligence. Coverage metrics measure breadth; quality metrics (per source) measure depth. Both are tracked, never conflated.

---

## 15. Commercial Metrics

Metrics linking global expansion to commercial activity.

| Metric | What it measures |
|--------|-----------------|
| Customer-requested sources | Sources submitted by customers for qualification |
| Qualification outcomes | STANDARD / ENGINEERING / CONDITIONAL / NOT SUPPORTED distribution per customer |
| Standard onboarding volume | Sources onboarded via configuration-only |
| Engineering-qualified volume | Sources onboarded via engineering package |
| Unsupported volume | Sources classified as NOT CURRENTLY SUPPORTED |
| Sources promoted from customer-specific → global | Customer sources that became global coverage |

### Rule

No success rate is calculated or promoted. The sample is too small and the metrics are operational, not statistical.

---

## 16. Governance

| Decision | Owner | Prevents |
|----------|-------|---------|
| Source discovery | Research / Intelligence | Sales-driven source selection |
| Qualification | Solutions Architecture | Technical decisions by non-technical roles |
| Quality approval | Intelligence / Data | Publication of unverified intelligence |
| Engineering priority | Architecture + Product | Engineering driven by individual sales requests |
| Global priority | Product | Roadmap distortion by individual customers |
| Customer exception | Commercial + Product | Unilateral commitments by Sales |
| Final roadmap inclusion | Product | Sources added without strategic review |

### Core operating rule

> Qualify → Evidence → Scope → Commit → Engineer

NOT: Engineer → Hope → Explain

This prevents the most common institutional failure: Sales promises a source, Engineering scrambles to deliver, and the result is either late, broken, or unverified.

---

## 17. Decision Rules

1. No source enters production without qualification (Gates 1-5 or documented screening).
2. No engineering starts without an approved engineering scope.
3. No timeline is committed without engineering assessment.
4. No success rate is claimed from current evidence.
5. Customer demand elevates priority but does not override technical feasibility.
6. Reusable platform capability is preferred over one-source engineering.
7. Source promotion from customer-specific to global requires Product approval.
8. Requalification is triggered automatically by health monitoring, not manually.
9. Quality and Coverage are reported separately — never conflated.
10. The Supported Source Contract is the authoritative document for what ROUA supports. This model is the operating process above it.

---

## 18. Evidence Boundaries

### What the current evidence supports

- Configuration-driven onboarding has been demonstrated for 3 sources across 3 institutional classes (BEA, SNB, CFTC).
- The 5-gate boundary framework is retrospectively consistent with all tested sources and prospectively validated for 2 cases (CFTC PASS, IMF FAIL).
- The Source Qualification Report Template is operationally ready.
- Access, provenance, content, and configuration gates are the observed boundary factors.

### What the current evidence does NOT support

- A general onboarding success rate.
- A specific number of sources ROUA can cover.
- A timeline for global coverage.
- The prevalence of any gate failure type.
- The predictive validity of the boundary framework beyond 2 prospective tests.
- That all sources within a class will behave like the tested source.

### What this model does NOT claim

- "ROUA will cover all official financial sources." — This is a strategic direction, not an achieved capability.
- "Onboarding is always configuration-only." — ESMA disproves this for tested paths.
- "X% of sources can be onboarded." — No success rate is claimed.
- "Coverage = quality." — These are explicitly separated.

---

## 19. What This Model Does NOT Do

- Does not modify the pipeline, extractor, fetcher, detector, or any code.
- Does not modify the Supported Source Contract.
- Does not add sources to `source_configs.py`.
- Does not start Phase C or any new source testing.
- Does not modify the website.
- Does not calculate a success rate.
- Does not commit to a timeline.
- Does not claim predictive validity for the boundary framework.
- Does not replace the Source Qualification Report Template — it sits above it.
- Does not authorize engineering work — it defines how engineering is allocated when approved.

---

## 20. Recommended Operating Plan

### Now (can be executed with current systems)

- Use the Source Qualification Report Template (`f5caf57`) to qualify customer source lists.
- Use the 5-gate pre-screening (Gates 1-4) to classify sources before commitment.
- Apply the 4 commercial classifications (STANDARD / ENGINEERING / CONDITIONAL / NOT SUPPORTED).
- Maintain the source registry as a spreadsheet or document (not a database yet).
- Track engineering backlog as a document.
- Apply the governance rules (Qualify → Evidence → Scope → Commit → Engineer).

### Next (requires operational maturity)

- Build a lightweight source registry (database or structured store).
- Implement health monitoring for active sources (fetch, provenance, extraction checks).
- Calibrate the prioritization framework with actual onboarding data (≥10 sources).
- Conduct 5-10 additional prospective boundary validations to strengthen predictive evidence.
- Define requalification thresholds and automation triggers.
- Establish quarterly tier review process.

### Later (requires platform/infrastructure investment)

- Build access infrastructure (proxy, JS execution) for Gate 1/3-blocked sources.
- Build content-text date extraction for Gate 2-blocked sources (provenance gap).
- Build automated source discovery (crawl official institution directories).
- Build coverage dashboards (metrics from Section 14).
- Build customer-facing qualification portal (self-service source submission).
- Conduct Phase C (30+ sources) when the operating model has proven stable with ≥10 customers.

---

## Appendix: Evidence Chain

| Commit | Artifact | Role in this model |
|--------|----------|-------------------|
| `de64f31` | Frozen pipeline baseline | Pipeline state this model is built on |
| `7710a84` | Supported Source Contract v1.0 | Authoritative source of what ROUA supports |
| `146aa3b` | Extraction Hardening CLEARED | Pipeline state with 0 semantic errors |
| `c8af140` | BEA PASS | Evidence: config-only onboarding (statistical_authority) |
| `c09de13` | SNB PASS | Evidence: config-only onboarding (central_bank) |
| `b4fabe9` | CFTC PASS + IMF FAIL | Prospective boundary validation |
| `7384033` | Evidence Matrix V3 FROZEN | Evidence baseline |
| `5d4cef4` | Boundary Analysis v1 | 5-gate framework |
| `f99e894` | Commercial Qualification Model v1 | 4 commercial classifications |
| `f5caf57` | Source Qualification Report Template v1 | Operational template |
