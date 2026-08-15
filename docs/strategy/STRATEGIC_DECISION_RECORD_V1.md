# STRATEGIC DECISION RECORD V1

**Status:** RECORDED STRATEGIC DECISIONS (user directive, 2026-08-15)
**Nature:** Phase-state and decision-layer application record. NOT a modification of any frozen artifact.
**Relationship to frozen artifacts:** Investment Framework V1 (`c02374a`), Registry V1 (`dd66cc1`), Design Constraints V1 (`bb3f43a`) remain FROZEN and untouched. This record governs the PRACTICAL INTERPRETATION of the Decision Layer during the current phase, and resolves the one open manual decision from `CAPABILITY_INVESTMENT_DECISION_REASSESSMENT_V1.md` (`8379bc9`).

---

## Decision 1 — Customer Demand is NOT a gating condition in this phase

The project is in a **BUILD / VALIDATION / TESTING phase**. There are no customers, and no capability will be built because a customer requested it.

Therefore:

```
Customer Demand
        ↓
UNAVAILABLE — NOT used as a condition
```

**Absence of a customer is NOT a reason to freeze investment.** Priority derivation is replaced by:

```
ROUAA Product Strategy
        ↓
Target Market / Geographic Architecture
        ↓
Institutional Intelligence Scope
        ↓
Capability Priority
        ↓
Evidence
        ↓
Engineering Decision
```

**Supersession note:** wherever `CAPABILITY_INVESTMENT_DECISION_REASSESSMENT_V1.md` (`8379bc9`) lists "customer demand" among required strategic contexts (including its Section 4 and closing statement), that listing reflects the frozen framework's input inventory — NOT a phase-condition. Under this record, the operative strategic context is the Product Strategy chain above. The frozen framework itself is not edited.

**North-star principle (recorded verbatim in meaning):** we do not build a capability because a customer requested it; we build a Core strong enough that the customer arrives and finds that ROUAA can actually fulfill their request.

---

## Decision 2 — Browser Rendering manual decision RESOLVED

The `PENDING MANUAL DECISION` opened by Reassessment V1 (`8379bc9`, Section 4) is resolved by the user on 2026-08-15:

```
Browser Rendering = MAINTAINS INVESTMENT CANDIDATE
```

Reason on record: the expansion strengthened the candidate's evidence diversity (2 institutional classes, 2 geographies) but LSE remains OBSERVED-only, coverage remains insufficient, and no product-strategy priority has yet been declared through the Decision-1 chain.

---

## Phase State (closed items)

| Item | State |
|---|---|
| Evidence Expansion V1 | **CLOSED / COMPLETE** (`654e7f8` → `8379bc9` chain) |
| Evidence-commit integrity | Resolved (13 EVIDENCE-COMMITTED · 1 INCONCLUSIVE · 1 UNMEASURED) |
| Browser Rendering | INVESTMENT CANDIDATE (confirmed) |
| Engineering authorization | **NONE** — no adapters, no rendering engines, no language libraries, no new event types, no pipeline/config changes |
| New investment decisions | NONE issued |
| New capability survey | NOT authorized — next step is targeted qualification, not a random survey |

---

## Next Phase — Capability Qualification & Engineering Readiness (direction on record; execution requires explicit user authorization per item)

Three targeted technical closures, in order, BEFORE any BUILD NOW:

### Q1 — Browser Rendering validation on LSE
Actually run browser validation on the single LSE case (not 15 new sources):
```
JS shell → Browser rendering → actual content → document extraction → provenance
```
- Success → stronger evidence the boundary is technically solvable.
- Failure → Browser Rendering alone is not the complete solution.
- Note: this is a VALIDATION test, not engineering build.

### Q2 — Multi-region combined qualification (non-English paths)
NOT a random survey. One combined test of **language + publication architecture + provenance + intelligence type together**:
- Current basis: UK, US, Japan, UAE, Germany, France, Italy
- Extension candidates (later): Korea, Singapore, India, Switzerland, Brazil

### Q3 — Event-Model contract test
No new event types are built now. Take the content cases already observed in evidence and test them against the CURRENT Event Model contract. Output distinguishes:
- actual capability gap, vs
- content types merely not yet qualified

This distinction is foundational.

---

## Subsequent Phases (order on record)

```
Evidence            ✅ COMPLETE
        ↓
Qualification       ← next (Q1–Q3 above)
        ↓
Capability architecture
        ↓
Core engine build
        ↓
Production validation
        ↓
Institutional Buyer Simulation   ← THE real test of the Core
        ↓
[GATE] If end-to-end success:
        ↓
Fourth repository:
ROUAA Core Intelligence
    ├── ROUAA News
    ├── ROUAA Trading
    └── ROUAA Corporate
        ↓
Railway · production deployment · APIs · governance · monitoring
```

### Institutional Buyer Simulation (gate definition)
Simulate an investor/institution with an existing financial platform requesting connection to ROUAA for trustworthy, auditable intelligence. Full cycle:
```
Investor/Institution → Request → Institution onboarding → Source mapping
→ Official-source ingestion → Document processing → Fact extraction
→ Event detection → Evidence/provenance → Intelligence output
→ API/data delivery → Client platform → Audit/traceability
```
Success criterion: the full cycle works end-to-end — not merely a scraper or adapter succeeding. Only then does ROUAA Core Intelligence Infrastructure become eligible to become an independent product.

---

**Files added by this record:** 1 (this document).
**Frozen artifacts touched:** NONE.
