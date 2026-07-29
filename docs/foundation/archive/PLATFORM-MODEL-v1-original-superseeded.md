# ROUAA · PLATFORM-MODEL-v1

> **الوثيقة التي تربط 22 وثيقة تأسيسية في منتج واحد متماسك اسمه "رؤى".**
>
> ليست Architecture (تلك في doc 11).
> ليست Product (تلك في doc 24 التالية).
>
> هي **الترجمة من البنية الداخلية إلى تجربة المنصة التي يراها العميل**.
>
> تجيب عن سؤال واحد:
>
> **ما هو "ROUAA Platform" كمنتج واحد مفهوم، وكيف تتجمع 22 طبقة تأسيسية في تجربة موحّدة؟**

**الإصدار:** v1.0
**الحالة:** Foundational Architecture
**النطاق:** Platform Product Consolidation

---

# 0. لماذا هذه الوثيقة؟

الـ 22 وثيقة السابقة عرّفت:

- ما هي رؤى داخليًا
- لماذا تُشترى
- كيف تُرخّص وتُسعّر
- من يشتريها وكيف تُباع
- كيف تُبنى المعمارية
- كيف تُحوكَم البيانات
- كيف تُبنى المعرفة والاستدلال والقرار

لكن العميل لا يشتري 22 وثيقة.

العميل يشتري **منصة واحدة**.

بدون Platform Model:

> 22 وثيقة = معرفة مجزّأة.

مع Platform Model:

> 22 وثيقة = منتج واحد متماسك.

---

# 1. تعريف ROUAA Platform

## التعريف الداخلي

> ROUAA Platform هي الطبقة الموحّدة التي تتجمع فيها جميع قدرات رؤى (Evidence / Knowledge / Reasoning / Decision / Governance / Workflow / Delivery) في تجربة تشغيلية واحدة يصلها العميل عبر واجهات متعددة.

---

## التعريف الخارجي

> "رؤى منصة ذكاء قرار مؤسسي — ليست أداة، وليست قاعدة بيانات، وليست AI.
> هي البنية التحتية التي تحوّل المعلومات المالية الموثقة إلى قرارات مؤسسية قابلة للتنفيذ."

---

# 2. المبدأ المركزي

> **المنصة واحدة. الواجهات متعددة.**
>
> العميل يرى واجهات مختلفة (Terminal / Dashboard / API / Widget / Workflow).
> لكن خلف كل واجهة تقف **نفس المنصة** بنفس الـ Evidence Foundation ونفس الـ Knowledge Graph ونفس الـ Decision Engine.

---

# 3. سبع طبقات للمنصة (Platform Layers)

هذه هي الطبقات التي يراها العميل كـ "ROUAA Platform":

```
┌─────────────────────────────────────────────┐
│ L7 · Delivery Layer                          │
│ Terminal · Dashboard · API · Widget · Workflow│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L6 · Workflow Layer                          │
│ Investment Committee · Trading · Risk · Editorial│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L5 · Governance Layer                        │
│ Authority · Approval · Policy · Compliance · Audit│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L4 · Decision Layer ⭐                       │
│ Decision Object · Formation · Contrarian · Memory│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L3 · Reasoning Layer                         │
│ Context · Inference · Hypothesis · Scenario · Confidence│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L2 · Knowledge Layer                         │
│ Knowledge Graph · Ontology · Entity · Relationship│
└─────────────────────────────────────────────┘
                    ▲
┌─────────────────────────────────────────────┐
│ L1 · Evidence Foundation (Strategic Asset)   │
│ Source Registry · Documents · Facts · Events · Evidence│
└─────────────────────────────────────────────┘
```

---

# 4. خريطة الـ 22 وثيقة إلى طبقات المنصة

كل وثيقة من الـ 22 تخدم طبقة محددة:

| Platform Layer | Foundational Documents |
|---|---|
| **L1 Evidence Foundation** | 12 (Data Governance) + 18 (Knowledge Ingestion) |
| **L2 Knowledge Layer** | 14 (Knowledge Graph) + 15 (Ontology) + 16 (Entity Resolution) + 17 (Relationship) |
| **L3 Reasoning Layer** | 19 (Reasoning Model) |
| **L4 Decision Layer ⭐** | 20 (Decision Model) — الوثيقة المركزية |
| **L5 Governance Layer** | 21 (Decision Governance) + 10 (Enterprise Trust) |
| **L6 Workflow Layer** | 22 (Decision Workflow) + 09 (Enterprise Implementation) |
| **L7 Delivery Layer** | 11 (Enterprise Architecture) + 13 (Site Narrative) |
| **Business Foundation** | 01-08 (Intelligence / Value / Outcome / Pricing / Customer / Sales / Journey / Success) |

هذه الخريطة تحوّل 22 وثيقة منفصلة إلى **منصة بـ 7 طبقات** + أساس تجاري.

---

# 5. ما يراه العميل vs ما هو داخلي

## داخلي (لا يُباع للعميل بهذه الأسماء)

```
- Evidence Foundation
- Knowledge Graph
- Ontology
- Entity Resolution
- Relationship Engine
- Reasoning Engines (6)
- Decision Council
- AI Council
- Audit Infrastructure
```

هذه أصول تشغيلية. تُذكَر في `platform.html` فقط للجمهور التقني.

---

## خارجي (ما يراه العميل)

```
- Intelligence Briefs
- Investment Signals
- Risk Alerts
- Research Reports
- Decision Records
- Audit Trails
- Workflow Integrations
- Terminal / Dashboard / API
```

هذه تجارب ملموسة تُذكَر في `index.html` وصفحات Solutions.

---

## قاعدة الترجمة

| الداخلي | الخارجي |
|---|---|
| Evidence Foundation | "verified sources" |
| Knowledge Graph | "connected intelligence" |
| Reasoning Engine | "explains why" |
| Decision Object | "decision brief" |
| Audit Trail | "audit-ready" |
| Workflow Layer | "integrated into your operations" |

---

# 6. كيف تتجمع الطبقات في تجربة العميل

مثال: عميل Asset Manager يفتح ROUAA Terminal.

```
Step 1: العميل يرى Investment Brief
        (L7 Delivery: Terminal UI)

Step 2: Brief يحتوي على Recommendation + Confidence + Evidence
        (L4 Decision Layer)

Step 3: العميل يضغط "Why?" فيرى Reasoning Chain
        (L3 Reasoning Layer)

Step 4: Reasoning يعرض الأدلة من Sources
        (L1 Evidence Foundation + L2 Knowledge Layer)

Step 5: العميل يضغط "Approve"
        (L5 Governance Layer)

Step 6: Approval يطلق Investment Committee Workflow
        (L6 Workflow Layer)

Step 7: Workflow يدمج القرار في Portfolio System
        (L7 Delivery: Integration)
```

العميل لم يرَ "Knowledge Graph" أو "Decision Object" — لكنه استخدم كل الطبقات.

---

# 7. Platform Access Patterns

العميل لا يصل لكل الطبقات بنفس الطريقة.

## Pattern 1 — Direct Surface Access

المستخدم النهائي يصل عبر Terminal / Dashboard / Mobile.

يرى: Briefs · Signals · Alerts · Reports.

---

## Pattern 2 — API Access

المطور يصل عبر REST / Streaming / Webhooks.

يرى: JSON Responses · Webhook Events · Streaming Data.

---

## Pattern 3 — Workflow Integration

الـ Operations يصل عبر Workflow Triggers.

يرى: Approval Requests · Task Assignments · Escalations.

---

## Pattern 4 — Embedded Access

المنصة الشريكة تصل عبر Widgets / White-label.

يرى: Embedded Cards · Co-branded Surfaces · Inline Intelligence.

---

## Pattern 5 — Audit Access

المراجع / المنظّم يصل عبر Audit Portal.

يرى: Decision Records · Audit Trails · Compliance Reports.

---

# 8. Platform Capabilities (Unifying View)

الـ 22 وثيقة موزّعة، لكن Platform Model يوحّدها في 7 قدرات:

```
ROUAA Platform Capabilities

1. Evidence Verification     — كل معلومة موثّقة بمصدرها
2. Knowledge Connection      — كل كيان مرتبط بشبكة معرفة
3. Reasoned Insight          — كل استنتاج مفسَّر
4. Decision Production       — كل قرار كامل الأركان
5. Governed Approval         — كل قرار يمرّ بالحوكمة الصحيحة
6. Workflow Execution        — كل قرار يدخل في العمليات
7. Multi-Channel Delivery    — كل ما سبق يصل عبر الواجهات
```

هذه هي القدرات التي **تُباع**.

---

# 9. Platform Topology

## Single Platform, Multiple Faces

```
                    ROUAA Platform
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Capital Markets    Information        Research
   Face               Markets Face       Face
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                  Same Evidence Foundation
                  Same Knowledge Graph
                  Same Reasoning Engine
                  Same Decision Engine
                  Same Governance
                  Same Workflow Layer
```

المنصة واحدة. الوجوه متعددة. هذا يحلّ مشكلة "هل أنتم منصة تداول أم موقع أخبار؟" — الإجابة: **المنصة واحدة، الوجه يختلف حسب العميل.**

---

# 10. Platform Boundaries

## ما يدخل في Platform

```
✅ Evidence Foundation
✅ Knowledge Layer
✅ Reasoning Layer
✅ Decision Layer
✅ Governance Layer
✅ Workflow Layer
✅ Delivery Layer (ROUAA-owned surfaces)
✅ Integration Layer (connectors to enterprise systems)
✅ Audit Infrastructure
✅ Customer Tenant Isolation
```

---

## ما لا يدخل في Platform

```
❌ Customer's internal systems (OMS / CRM / Risk Systems)
❌ Customer's proprietary data (portfolio positions, client data)
❌ Customer's existing workflows (ROUAA integrates, doesn't replace)
❌ Third-party LLMs (ROUAA uses them as tools, doesn't include them as product)
❌ Customer's employees (ROUAA serves them, doesn't employ them)
```

الحدود واضحة: **رؤى طبقة فوق بنية العميل، لا بديل عنها.**

---

# 11. Platform vs Product (تمهيد لـ doc 24)

| Platform | Product |
|---|---|
| البنية التحتية الموحّدة | ما يُباع للعميل |
| طبقات L1-L7 | باقات تجارية محددة |
| "ROUAA Platform" | "Investment Intelligence Platform" / "Risk Intelligence Platform" / ... |
| واحد | متعدد |
| داخلي | تجاري |

الـ Platform واحد. الـ Products متعددة. هذا ما ستفصّله doc 24.

---

# 12. Platform Ownership Model

## ما تملكه رؤى

```
- Evidence Foundation (Strategic Asset — the moat)
- Knowledge Graph
- Reasoning Engines
- Decision Engine
- Governance Framework
- Workflow Templates
- Delivery Surfaces (Terminal / Dashboard)
- Integration Connectors
```

---

## ما يرخّصه العميل

```
- Access to Platform
- Production of Intelligence Objects
- Use of Decision Engine
- Activation of Workflows
- Integration with enterprise systems
```

---

## ما يبقى للعميل

```
- Customer Data
- Customer Decisions
- Customer Audit Records
- Customer Workflows (configurations)
- Customer Brand (for White-label)
```

---

# 13. Platform Evolution Model

المنصة تتطور، لكن قواعدها ثابتة.

## What Changes

```
- More Sources added to Evidence Foundation
- More Entities in Knowledge Graph
- More Reasoning Engines
- More Decision Types
- More Workflow Templates
- More Delivery Surfaces
```

---

## What Stays Constant

```
- L1-L7 Architecture
- Evidence-First Principle
- Decision Object as central unit
- Governance Rules
- Audit Immutability
- Customer Data Ownership
```

المنصة تنمو **أفقيًا** (مزيد من القدرات) دون أن تتغيّر **عموديًا** (المبادئ ثابتة).

---

# 14. Platform Quality Principles

كل قرار تصميمي في المنصة يجب أن يحترم:

1. **Single Source of Truth** — كل معلومة لها مصدر واحد أصلي
2. **Traceability End-to-End** — من المصدر إلى القرار إلى النتيجة
3. **Layer Independence** — كل طبقة قابلة للتطوير دون كسر الأخرى
4. **API-First** — كل قدرة قابلة للاستهلاك كخدمة
5. **Tenant Isolation** — بيانات العميل لا تتسرّب
6. **Audit by Default** — كل شيء يُسجَّل، لا استثناء
7. **Human-in-the-Loop** — الذكاء يُساعد، البشر يقررون
8. **One Platform, Many Faces** — منصة واحدة، واجهات متعددة

---

# 15. Platform KPIs

مقاييس صحة المنصة نفسها:

## Foundation KPIs

- Source Coverage
- Knowledge Graph Size
- Entity Resolution Accuracy
- Evidence Coverage

---

## Operational KPIs

- Decision Production Volume
- Reasoning Latency
- Workflow Completion Rate
- Governance Compliance Rate

---

## Customer KPIs

- Active Users
- Decisions per Customer
- Workflow Activations
- Outcome Accuracy

---

## Strategic KPIs

- Net Revenue Retention
- Platform Stickiness (workflows integrated)
- Expansion Rate
- Customer Trust Score

---

# 16. العلاقة مع الوثائق السابقة

```
22 Foundational Documents
        │
        ▼
PLATFORM-MODEL-v1 (هنا)
        │
        ├── consolidates → 7 Platform Layers
        ├── maps → 22 docs to layers
        ├── translates → internal to external
        ├── unifies → multiple products under one platform
        └── prepares → for PRODUCT-MODEL-v1 (doc 24)
```

---

# 17. ما الذي يراه كل جمهور من Platform؟

### المستثمر

> "ROUAA Platform = Enterprise Intelligence Infrastructure
> بـ 7 طبقات موحّدة، تخدم عملاء متعددين بمنتجات متعددة،
> بخندق معرفي متراكم لا يمكن استنساخه."

---

### CIO

> "ROUAA Platform = طبقة قرار موثقة تُضاف فوق بنيتي،
> تربط الأدلة بالمعرفة بالاستدلال بالقرار،
> دون استبدال أنظمتي الحالية."

---

### CTO

> "ROUAA Platform = 7-layer architecture مع API-first design،
> طبقات مستقلة قابلة للتطوير،
> tenant isolation صارم،
> audit infrastructure موثّقة."

---

### Risk Officer

> "ROUAA Platform = audit-ready decision infrastructure،
> كل قرار له سلسلة دليل كاملة،
> Governance مدمجة، لا تُضاف لاحقًا."

---

### Analyst / Trader

> "ROUAA Platform = Terminal + Signals + Briefs،
> كل توصية مفسّرة بالأدلة،
> كل قرار قابل لإعادة البناء."

---

# 18. المبادئ النهائية

1. **المنصة واحدة. الواجهات متعددة.**
2. **22 وثيقة تأسيسية = 7 طبقات منصة + أساس تجاري.**
3. **الطبقات مستقلة لكنها متكاملة.**
4. **ما يراه العميل ≠ ما هو داخلي. الترجمة واجبة.**
5. **الـ Platform يوحّد. الـ Product يخصص.**
6. **الخندق في L1 (Evidence Foundation)، لا في L7 (Delivery).**
7. **كل قدرة في المنصة قابلة للاستهلاك كخدمة.**
8. **العميل يملك بياناته وقراراته. رؤى تملك البنية والمعرفة.**
9. **المنصة تنمو أفقيًا، مبادئها ثابتة عموديًا.**
10. **بدون Platform Model، الـ 22 وثيقة معرفة مجزّأة. معها، منتج واحد.**

---

# STATUS

```
STATUS: PLATFORM MODEL DEFINED

DEPENDS ON:
- All 22 prior foundational documents

ENABLES:
- PRODUCT-MODEL-v1 (doc 24) — what customer buys
- CAPABILITY-CATALOG-v1 (doc 25) — consolidated capabilities
- DATA-MODEL-v1 (doc 26) — physical data model
- METRICS-MODEL-v1 (doc 27) — KPIs tied to outcomes
- ROADMAP-MODEL-v1 (doc 28) — implementation phases

NEXT:
- 24-ROUAA-PRODUCT-MODEL-v1.md
```

---

## الخلاصة

PLATFORM-MODEL-v1 هو **الترجمة من البنية الداخلية إلى تجربة المنصة**.

بدونه، الـ 22 وثيقة تبقى نظرية مؤسسية قوية لكن مجزّأة.

معه، تصبح:

> **منصة واحدة اسمها رؤى، بـ 7 طبقات موحّدة، تخدم عملاء متعددين، عبر واجهات متعددة، بخندق معرفي واحد.**

الخطوة التالية المنطقية:

**24-ROUAA-PRODUCT-MODEL-v1.md**

لأن بعد تحديد **ما هي المنصة**، يجب تحديد **ما هي المنتجات** التي يشتتريها العميل من هذه المنصة.
