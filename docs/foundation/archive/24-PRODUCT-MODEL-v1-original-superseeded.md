# ROUAA · PRODUCT-MODEL-v1

> **الوثيقة التي تحوّل المنصة الموحّدة إلى منتجات قابلة للبيع.**
>
> فوق:
> PLATFORM-MODEL-v1 (doc 23)
>
> تحت:
> OPERATING-MODEL-v1 (doc 25) — بداية Phase 2
>
> يجيب عن سؤال واحد:
>
> **ما هي المنتجات التي يشتتريها العميل فوق منصة ROUAA الموحّدة، وكيف تختلف عن المنصة نفسها؟**

**الإصدار:** v1.0
**الحالة:** Foundational Architecture — آخر وثيقة في Phase 1 (Definition & Architecture)
**النطاق:** Product Lines & Commercial Bundles

---

# 0. لماذا هذه الوثيقة؟

PLATFORM-MODEL-v1 أجاب:

> ما هي المنصة ككيان موحّد؟

لكن العميل لا يشتري "منصة".

العميل يشتري **منتجًا** يحل مشكلة محددة لديه.

الفرق الجوهري:

| Platform | Product |
|---|---|
| البنية التحتية الموحّدة | ما يُباع للعميل |
| طبقات L1-L6 | باقات تجارية محددة |
| واحد | متعدد |
| داخلي | تجاري |
| يُبنى مرة واحدة | يُباع مرارًا بتركيبات مختلفة |

بدون Product Model:
- Platform = بنية بلا تجسيد تجاري
- العميل لا يعرف ماذا يشتري
- فريق المبيعات لا يعرف ماذا يبيع

مع Product Model:
- Platform → Products → Packages → Customer Contracts
- كل عميل يشتري Product محدد بـ Capabilities محددة عبر Delivery Formats محددة

---

# 1. تعريف ROUAA Product

## التعريف الداخلي

> Product هو باقة تجارية مكونة من subset محدد من Platform Layers + Capabilities محددة + Delivery Formats محددة + Target Customer محدد + Pricing Tier محدد.

---

## التعريف الخارجي

> "رؤى تقدّم أربعة منتجات مؤسسية، كل منها مصمم لفئة محددة من المؤسسات المالية، وجميعها تعمل فوق نفس البنية التحتية للذكاء المؤسسي."

---

# 2. المبدأ المركزي

> **المنصة واحدة. المنتجات متعددة. كل منتج = ترتيب مختلف من نفس القدرات.**
>
> العميل يرى منتجًا متخصصًا لمشكلته.
> رؤى تبيع من نفس الأساس.

---

# 3. خمسة منتجات مؤسسية

## Product 1 — Capital Markets Intelligence Platform

### الجمهور المستهدف
- Asset Managers
- Hedge Funds
- Investment Banks
- Pension Funds
- Prop Firms

### المكونات (Platform Layers)
```
L1 Evidence Intelligence (financial + market sources)
L2 Knowledge Intelligence (entities + relationships)
L3 Reasoning Intelligence (signal + scenario + risk)
L4 Decision Intelligence (investment decisions)
L5 Decision Governance (IC + risk approval)
L6 Decision Workflow (trading + portfolio workflows)
```

### Capabilities المُفعَّلة
- Signal Generation
- Risk Scoring
- Scenario Simulation
- Portfolio Exposure Analysis
- Investment Committee Workflow
- Trading Approval Workflow
- Decision Records

### Delivery Formats
- Trading Terminal (Surface)
- Capital Markets API (Contract)
- Chart Widgets (Embedding)
- Signal Alerts (Channel)
- IC Workflow (Integration)

### Outcomes
- Faster Trading Decisions
- Audit-Ready Investment Process
- Lower Decision Risk
- Explainable Research

### Pricing Tier (per PRICING-MODEL-v3)
- Platform License: £500k-£750k ARR (Institutional Platform)
- Capital Markets Package: £300k ARR
- Integration: £200k+
- Hybrid Deployment: £300k+
- **Total typical ACV: £1.3M-£1.5M ARR**

---

## Product 2 — Research Intelligence Platform

### الجمهور المستهدف
- Research Firms
- Equity Research Teams
- Asset Management Research Departments
- Advisory Firms

### المكونات (Platform Layers)
```
L1 Evidence Intelligence (filings + disclosures + reports)
L2 Knowledge Intelligence (companies + sectors + indicators)
L3 Reasoning Intelligence (thesis + scenario + validation)
L4 Decision Intelligence (research decisions)
L5 Decision Governance (editorial + compliance review)
L6 Decision Workflow (research publishing workflow)
```

### Capabilities المُفعَّلة
- Research Synthesis
- Report Generation
- Citation Linking
- Thesis Validation
- Comparative Analysis
- Citation Density Scoring
- Editorial Workflow
- Research Publishing Workflow

### Delivery Formats
- Research Workspace (Surface)
- Research API (Contract)
- Research Widgets (Embedding)
- Research Reports (Channel)
- Editorial Workflow (Integration)

### Outcomes
- Explainable Research
- Higher Analyst Productivity
- Stronger Citation Density
- Faster Research Cycle

### Pricing Tier
- Platform License: £250k-£500k ARR
- Research Intelligence Layer: £150k-£300k ARR
- Editorial Integration: £100k+
- **Total typical ACV: £500k-£900k ARR**

---

## Product 3 — Information Markets Intelligence Platform

### الجمهور المستهدف
- Financial News Agencies
- Financial Publishers
- Broadcast Groups
- Digital Financial Media
- Economic Publishers

### المكونات (Platform Layers)
```
L1 Evidence Intelligence (real-time + official sources)
L2 Knowledge Intelligence (events + entities + markets)
L3 Reasoning Intelligence (context + narrative)
L4 Decision Intelligence (editorial decisions)
L5 Decision Governance (editorial approval)
L6 Decision Workflow (editorial workflow + publication)
```

### Capabilities المُفعَّلة
- Verified News Production
- Editorial Intelligence
- Source Intelligence
- Narrative Generation
- Contextual Journalism
- Source Verification
- Editorial Workflow
- Publication Workflow

### Delivery Formats
- Newsroom OS (Surface)
- News API (Contract)
- News Widgets (Embedding)
- News Articles / Videos / Infographics (Channel)
- Editorial Workflow (Integration)

### Outcomes
- Faster Publishing
- Evidence-backed Journalism
- Scalable Editorial Operations
- Audience Trust

### Pricing Tier
- Platform License: £250k-£500k ARR
- Information Markets Package: £200k-£400k ARR
- Editorial Integration: £100k+
- **Total typical ACV: £550k-£1M ARR**

---

## Product 4 — Risk Intelligence Platform

### الجمهور المستهدف
- Banks
- Risk Departments
- Compliance Teams
- Treasuries
- Regulated Financial Institutions

### المكونات (Platform Layers)
```
L1 Evidence Intelligence (regulatory + market + counterparty sources)
L2 Knowledge Intelligence (exposures + counterparty + scenarios)
L3 Reasoning Intelligence (risk modeling + stress + early warning)
L4 Decision Intelligence (risk decisions)
L5 Decision Governance (compliance + audit + regulatory)
L6 Decision Workflow (risk + compliance workflows)
```

### Capabilities المُفعَّلة
- Risk Scoring
- Exposure Analysis
- Anomaly Detection
- Stress Testing
- Early Warning
- Compliance Reporting
- Audit Retrieval
- Regulatory Traceability
- Risk Workflow
- Compliance Workflow

### Delivery Formats
- Risk Dashboard (Surface)
- Risk API (Contract)
- Risk Widgets (Embedding)
- Risk Alerts (Channel)
- Compliance Workflow (Integration)

### Outcomes
- Lower Decision Risk
- Regulatory Traceability
- Audit-Ready Processes
- Earlier Risk Detection

### Pricing Tier
- Platform License: £500k-£1M+ ARR (Strategic Enterprise)
- Risk Package: £300k-£500k ARR
- Compliance Add-on: £200k-£500k ARR
- On-prem Deployment: +50-100%
- **Total typical ACV: £1M-£2M+ ARR**

---

## Product 5 — Intelligence API Platform

### الجمهور المستهدف
- FinTech Companies
- Technology Companies
- Developers Building Financial Products
- Platform Companies

### المكونات (Platform Layers)
```
L1 Evidence Intelligence (API access)
L2 Knowledge Intelligence (Graph API)
L3 Reasoning Intelligence (Insight API)
L4 Decision Intelligence (Decision API)
(No L5/L6 — developer builds own governance)
```

### Capabilities المُفعَّلة
- Evidence Access (read-only)
- Knowledge Graph Query
- Entity Resolution API
- Fact Retrieval API
- Event Stream API
- Reasoning API (limited)
- Decision API (developer-managed governance)

### Delivery Formats
- REST API (Contract — primary)
- GraphQL API (Contract — Knowledge Graph)
- Streaming Events (Contract — real-time)
- Webhooks (Contract — push)
- SDK (Python / TypeScript / Java)

### Outcomes
- Faster Time-to-Market
- Embedded Intelligence
- Programmatic Access
- Developer-friendly Integration

### Pricing Tier
- Platform License: £75k-£150k ARR (Enterprise Foundation)
- Developer Intelligence Layer: £50k-£250k ARR
- Usage-based (API calls + streaming volume)
- **Total typical ACV: £125k-£400k ARR**

---

# 4. Product Composition Formula

كل منتج يُبنى بنفس المعادلة:

```
ROUAA Product =
    Subset of Platform Layers (L1-L6)
  + Specific Capabilities (from Capability Catalog)
  + Specific Delivery Formats (Surfaces/Contracts/Embeddings/Channels/Integrations)
  + Target Customer Segment
  + Pricing Tier (from PRICING-MODEL-v3)
  + Expected Outcomes (from OUTCOME-MODEL-v2)
```

---

# 5. Product vs Platform — الحدود الواضحة

| Platform | Product |
|---|---|
| Evidence Foundation | "Capital Markets Sources" (Product 1) / "Filing Sources" (Product 2) / "Real-time News Sources" (Product 3) |
| Knowledge Graph | "Capital Markets Graph" / "Corporate Knowledge Graph" / "News Knowledge Graph" |
| Reasoning Engine | "Trading Signals" / "Research Synthesis" / "Editorial Intelligence" |
| Decision Engine | "Investment Decisions" / "Research Decisions" / "Editorial Decisions" |
| Governance | "IC Approval" / "Editorial Review" / "Compliance Audit" |
| Workflow | "Trading Workflow" / "Research Workflow" / "Editorial Workflow" |

نفس الأساس، تخصصات مختلفة.

---

# 6. Product Bundling Strategy

## Single Product Purchase

العميل يشتري منتجًا واحدًا:
- Asset Manager صغير → Capital Markets Intelligence Platform
- Research Firm → Research Intelligence Platform

---

## Multi-Product Bundle

العميل يشتري أكثر من منتج:
- Large Bank → Capital Markets + Risk + Research (3 منتجات)
- Financial Media Group → Information Markets + Research (2 منتجات)

**Bundling Discount:** 10-20% off total ACV when 2+ products

---

## Enterprise Suite

العميل يشتري كل المنجات:
- Global Bank → All 5 Products + Private Deployment
- Sovereign Fund → All 5 Products + Custom Configuration

**Enterprise Suite Pricing:** £2M-£5M+ ARR

---

# 7. Product Expansion Path (Land and Expand)

```
Year 1: Single Product
  (e.g., Capital Markets Intelligence)
        ↓
Year 2: + Capability Layer
  (e.g., + Research Intelligence)
        ↓
Year 3: + Risk/Compliance
  (e.g., + Risk Intelligence + Compliance)
        ↓
Year 4: Enterprise-wide
  (e.g., All Products + Custom Build)
        ↓
Year 5: Strategic Partnership
  (e.g., Multi-year + Co-development)
```

---

# 8. Product Lifecycle

```
1. Launch
   - First customer onboarding
   - Pilot success stories
   - Reference customer building

2. Growth
   - Multiple customers
   - Case studies
   - Sales motion refinement

3. Maturity
   - Standardized pricing
   - Self-service expansion
   - Multi-year contracts

4. Expansion
   - New capabilities added
   - New market segments
   - International rollout

5. Strategic Asset
   - Industry standard
   - Lock-in via workflows
   - Premium pricing power
```

---

# 9. Product vs Custom Solution

## When to Sell Standard Product

- Customer fits ICP (from CUSTOMER-SEGMENT-MODEL)
- Standard Capabilities meet needs
- Standard Pricing acceptable
- Time-to-value matters

---

## When to Sell Custom Solution

- Customer outside ICP but strategically important
- Needs capabilities beyond standard products
- Requires private deployment or custom integration
- Willing to pay premium for customization

**Custom Solution Pricing:** 2-3x standard product ACV + implementation fees

---

# 10. White-label Options

## Standard White-label

العميل يستخدم ROUAA بعلامته:
- Branding change
- Custom domain
- Logo / colors / fonts
- Reports with customer logo

**Pricing:** +30-50% on standard product

---

## Embedded White-label

منتج العميل يُدمج فيه ROUAA:
- API-driven
- Custom UX
- Customer owns user relationship
- ROUAA invisible to end-user

**Pricing:** +50-100% on standard product + revenue share option

---

## Co-branded Solution

ROUAA + Customer brand:
- Joint marketing
- Shared customer relationship
- Reference customer agreement
- Case study cooperation

**Pricing:** Standard product + marketing credits

---

# 11. Product Targeting Matrix

| Product | Primary ICP | Secondary | Beachhead |
|---|---|---|---|
| Capital Markets Intelligence | Asset Managers (£1B-£50B AUM) | Hedge Funds, Banks | Mid-size Asset Managers |
| Research Intelligence | Research Firms | Asset Management Research Teams | Independent Research Firms |
| Information Markets Intelligence | Financial News Agencies | Digital Publishers | Mid-size News Agencies |
| Risk Intelligence | Banks | Risk Departments, Treasuries | Mid-size Banks |
| Intelligence API Platform | FinTechs | Tech Companies | Growth-stage FinTechs |

---

# 12. Product Differentiators vs Competitors

| Product | vs Bloomberg | vs FactSet | vs OpenAI | vs Palantir |
|---|---|---|---|---|
| Capital Markets | + Decision Layer | + Decision Intelligence | + Evidence Foundation | + Financial Domain |
| Research | + Audit Trail | + Decision Records | + Verified Sources | + Financial Ontology |
| Information Markets | + Evidence-backed | + Editorial Workflow | + Verified Sources | + Real-time |
| Risk | + Decision Governance | + Compliance Workflow | + Audit Infrastructure | + Financial Domain |
| API Platform | + Decision API | + Knowledge Graph API | + Evidence Foundation | + Financial Domain |

كل منتج له ميزة تنافسية واضحة ضد كل منافس.

---

# 13. Product Quality Principles

كل قرار تصميمي في منتج يجب أن يحترم:

1. **Single Platform Foundation** — كل المنتجات فوق نفس الـ Platform
2. **Clear Product Boundaries** — كل منتج له scope محدد
3. **Composability** — المنتجات يمكن دمجها في bundles
4. **Outcome-First** — كل منتج يحقق Outcomes محددة (من OUTCOME-MODEL-v2)
5. **Pricing Alignment** — كل منتج مرتبط بـ PRICING-MODEL-v3
6. **Customer Segment Fit** — كل منتج لـ ICP محدد (من CUSTOMER-SEGMENT-MODEL-v1)
7. **Delivery Diversity** — كل منتج يدعم Surfaces + Contracts + Embeddings + Channels + Integrations
8. **Expansion Path** — كل منتج يفتح باب لتوسّع لمنتجات أخرى

---

# 14. Product KPIs

## Per-Product KPIs

- ACV per Product
- Customer Count per Product
- Retention Rate per Product
- NRR per Product
- Time-to-Value per Product

---

## Portfolio KPIs

- Multi-Product Adoption Rate
- Bundle Revenue %
- Custom Solution Revenue %
- White-label Revenue %
- Product Mix (revenue distribution across 5 products)

---

## Strategic KPIs

- Platform Stickiness (workflows integrated per customer)
- Cross-Product Expansion Rate
- Customer Lifetime Value
- Market Share per Product Category

---

# 15. العلاقة مع الوثائق السابقة

```
PLATFORM-MODEL-v1 (doc 23)
        ↓
PRODUCT-MODEL-v1 (هنا)
        ↓
+ CUSTOMER-SEGMENT-MODEL-v1 (doc 05) — من يشتري كل منتج
+ PRICING-MODEL-v3 (doc 04) — كم يدفع
+ OUTCOME-MODEL-v2 (doc 03) — ما النتيجة
+ SALES-MOTION-MODEL-v1 (doc 06) — كيف نبيع
+ CUSTOMER-JOURNEY-MODEL-v1 (doc 07) — كيف يتبنّى
+ CUSTOMER-SUCCESS-MODEL-v1 (doc 08) — كيف ننجح
        ↓
OPERATING-MODEL-v1 (doc 25) — بداية Phase 2
```

---

# 16. ما الذي يراه كل جمهور من المنتجات؟

### المستثمر

> "ROUAA تبيع 5 منتجات مؤسسية فوق منصة واحدة.
> كل منتج له ICP محدد و pricing tier واضح.
> النمو يأتي من: (1) عملاء جدد لكل منتج، (2) expansion داخل العميل من منتج لآخر، (3) bundles و custom solutions للعملاء الكبار."

---

### CIO

> "أبدأ بمنتج واحد يحل مشكلتي الألم (Capital Markets أو Research أو Risk).
> عندما يثبت القيمة، أتوسّع لمنتجات أخرى.
> نفس البنية، نفس الـ Audit Trail، نفس الـ Governance."

---

### CTO

> "كل منتج يأتي بـ API + Surfaces + Integrations محددة.
> يمكن البدء بـ API Platform للتكامل السريع، ثم الترقّي لمنتجات كاملة."

---

### Sales

> "أعرف بالضبط ما أبيعه لكل ICP.
- Asset Manager → Capital Markets Intelligence Platform
- Bank → Risk Intelligence Platform
- News Agency → Information Markets Intelligence Platform
- FinTech → Intelligence API Platform
- Research Firm → Research Intelligence Platform
>
> Pricing جاهز، Outcomes جاهزة، Expansion path واضح."

---

### Customer Success

> "أبني Success Blueprint لكل منتج.
> أعرف متى أقترح expansion (مثلاً: بعد 6 أشهر من نجاح Capital Markets → اقترح Research Intelligence)."

---

# 17. المبادئ النهائية

1. **المنصة واحدة. المنتجات متعددة.**
2. **كل منتج = Platform Layers + Capabilities + Delivery + ICP + Pricing + Outcomes.**
3. **العميل يرى منتجًا متخصصًا. رؤى تبيع من نفس الأساس.**
4. **المنتج يُباع كحل متكامل، لا كقائمة ميزات.**
5. **Bundling استراتيجية نمو، لا تخفيض سعر.**
6. **Custom Solution للعملاء الكبار، Standard Product للسوق الواسع.**
7. **White-label يُضاف برسوم، لا مجانًا.**
8. **كل منتج له expansion path لمنتجات أخرى.**
9. **Product KPIs تقيس الصحة التجارية لكل منتج على حدة وللمحفظة ككل.**
10. **بدون Product Model، Platform = بنية بلا تجسيد تجاري.**

---

# STATUS

```
ROUAA PRODUCT MODEL v1

STATUS: APPROVED FOUNDATION

END OF PHASE 1 — DEFINITION & ARCHITECTURE ✅

PHASE 1 COMPLETE:
✓ Category Definition (01-03)
✓ Business Model (04-08)
✓ Enterprise Layer (09-12)
✓ Intelligence Foundation (13-22)
✓ Productization (23-24)

NEXT PHASE — PHASE 2: OPERATIONALIZATION

NEXT:
25-ROUAA-OPERATING-MODEL-v1.md
```

---

## الخلاصة

PRODUCT-MODEL-v1 هو **آخر وثيقة في Phase 1**.

بدونه، Platform = بنية بلا تجسيد تجاري.

معه، تصبح المنصة **5 منتجات قابلة للبيع** بـ:
- ICP محدد لكل منتج
- Pricing tier واضح
- Outcomes موثقة
- Delivery formats متنوعة
- Expansion path للنمو داخل العميل

**Phase 1 (Definition & Architecture) مكتمل.**

**Phase 2 (Operationalization) تبدأ الآن.**

الخطوة التالية المنطقية:

**25-ROUAA-OPERATING-MODEL-v1.md**

لأن بعد تعريف **ما هي المنتجات**، يجب تعريف **كيف تعمل الشركة يوميًا لإنتاجها وتشغيلها وبيعها ودعمها.**
