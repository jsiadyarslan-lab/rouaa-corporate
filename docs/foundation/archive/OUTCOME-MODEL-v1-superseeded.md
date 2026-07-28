# OUTCOME-MODEL-v1

> **الطبقة النهائية فوق INTELLIGENCE-MODEL-v4 و ROUAA-VALUE-MODEL-v1.**
> تجيب على سؤال مختلف تمامًا: **ما النتيجة المؤسسية التي يشتريها العميل، وكيف تتحوّل Objects و Capabilities و Domains إلى قيمة أعمال قابلة للقياس؟**
> v4 حسمت "ما هي رؤى داخليًا" · VALUE-MODEL حسمت "كيف تُباع" · هذه الوثيقة تحسم "لماذا تُشترى".

> **الإصدار:** v1.0
> **التاريخ:** يوليو 2026
> **الحالة:** مسودة للنقاش — الجسر النهائي قبل HTML
> **القاعدة:** لو لم تُترجم البنية الداخلية إلى نتائج مؤسسية، فهي نظرية متماسكة لا شركة.

---

## 0. لماذا هذه الوثيقة؟

INTELLIGENCE-MODEL-v4 و ROUAA-VALUE-MODEL-v1 تركتا ثغرة تأسيسية:

> الوثيقتان تعرّفان رؤى **بما تنتجه** (Intelligence Objects) و **بما تملكه** (Evidence Foundation) — لا **بما تغيّره**.

هذا تموضع خاطئ. السوق لا يشتري أصغر وحدة داخلية. السوق يشتري **نتيجة**.

| الشركة | الأصل الداخلي | ما يُباع فعليًا |
|---|---|---|
| AWS | EC2 Instance / S3 Object | Cloud Platform |
| Salesforce | Record | CRM |
| Palantir | Ontology Object | Operating System for Decision Making |
| Bloomberg | Security Object | Terminal |
| Adobe | Layer | Creative Cloud |
| Snowflake | Table | Data Cloud |
| Stripe | Payment Intent | Payments Infrastructure |

في كل حالة: الأصل الداخلي صغير ودقيق — لكن الخطاب التجاري أعلى منه بمستوى.

**رؤى اليوم:** الخطاب يدور حول Intelligence Objects (أصل داخلي).
**رؤى المطلوبة:** الخطاب يدور حول Institutional Decision Intelligence (نتيجة مؤسسية).

هذه الوثيقة تعمل إعادة التموضع هذه.

---

## 1. التعريف المُعاد صياغته

### 1.1 التعريف القديم (v4 + VALUE-MODEL)

> "رؤى = بنية لإنتاج ذكاء مؤسسي موثّق، تحوّل الواقع المالي إلى Intelligence Objects..."

هذا صحيح معماريًا، لكنه يصف **ما تنتجه**، لا **ما تغيّره**.

### 1.2 التعريف الجديد (النهائي)

> **رؤى = منصة ذكاء قرار مؤسسي تُمكّن المؤسسات من إنتاج قرارات أسرع، قابلة للتتبّع، ومُسنَدة بالأدلة.**

> *ROUAA is an institutional decision intelligence platform that enables organisations to produce faster, traceable, and evidence-backed decisions.*

### 1.3 كيف تتحقّق هذه النتيجة؟ (الترجمة إلى البنية الداخلية)

```
Enterprise Outcome (ما يشتريه العميل)
   ↑
Decision Capability (ما يُمكّن النتيجة)
   ↑
Domain Application (أين يُطبَّق)
   ↑
Capabilities (ما يُفعَّل)
   ↑
Intelligence Objects (ما يُنتَج)
   ↑
Evidence Foundation (ما يُملَك)
```

**القاعدة:** الخطاب التجاري يبدأ من الأعلى (Outcome) وينزل عند الحاجة. البنية التقنية تبدأ من الأسفل (Foundation) وتصعد لإنتاج النتيجة. الاثنان صحيحان، لكنهما يخاطبان جمهورين مختلفين.

### 1.4 القاعدة الذهبية للتموضع

> **العالم الخارجي لا يسمع عن Intelligence Objects.**
> العالم الخارجي يسمع عن: قرارات أسرع، مخاطر أقل، أبحاث قابلة للتفسير، عمليات استثمار جاهزة للتدقيق، قابلية تتبّع تنظيمي.

Intelligence Objects تبقى **أصلًا داخليًا** — مثل EC2 Instance في AWS، أو Payment Intent في Stripe، أو Ontology Object في Palantir. تُذكر في الوثائق الفنية، لكن لا تظهر في Hero، ولا في الـ pitch، ولا في عقد البيع الأولي.

---

## 2. Enterprise Outcomes — ما الذي يشتريه العميل فعليًا

### 2.1 الإصلاح الجوهري

VALUE-MODEL v1 قال: العميل يشتري "Platform License + Domain Package + Usage".
هذا صحيح تشغيليًا، لكنه **وصف للترخيص**، لا **وصف للقيمة**.

العميل لا يستيقظ صباحًا قائلًا: "أريد Platform License". يستيقظ قائلًا: "أريد قرارات أسرع"، أو "أريد امتثالًا أقوى"، أو "أريد أبحاثًا يمكن الدفاع عنها".

### 2.2 ست Enterprise Outcomes أساسية

| Outcome | الوصف | للعميل المؤسسي معناه | KPI مباشر |
|---|---|---|---|
| **Faster Decisions** | قرارات أسرع بلا التضحية بالجودة | تقليل دورة البحث من أسابيع إلى ساعات | Time-to-Decision |
| **Audit-Ready Investment Process** | عملية استثمار جاهزة للتدقيق التنظيمي | كل قرار له سلسلة دليل كاملة قابلة لإعادة البناء | Audit Coverage % |
| **Lower Decision Risk** | مخاطر قرار أقل عبر معارضة داخلية واستدلال متعدد | تقليل القرارات المتسرّعة، رصد التحيّز | Decision Quality Score |
| **Explainable Research** | أبحاث يمكن تفسيرها للجان الاستثمار والعملاء | كل ادعاء مدعوم بأدلة، كل توقع مُسبَب | Citation Density |
| **Regulatory Traceability** | قابلية تتبّع تنظيمي كامل | تلبية متطلبات MiFID II، SEC، FCA دون بناء خاص | Compliance Pass Rate |
| **Operational Leverage** | رفع كفاءة الفِرق دون توسيع الرأس | محلل واحد يغطي ما كان يتطلب عشرة | Analyst Productivity |

### 2.3 كيف تتحوّل البنية الداخلية إلى Outcome

| Outcome | Domain | Capabilities المُفعَّلة | ما يراه العميل |
|---|---|---|---|
| Faster Decisions | Capital Markets | Signal Generation + Risk Scoring + Scenario Simulation | إشارات موثّقة في دقائق بدل أسابيع بحث |
| Audit-Ready Investment Process | Capital Markets + Research | Audit Retrieval + Decision Reconstruction | كل قرار قابل لإعادة بنائه بعد سنة |
| Lower Decision Risk | Risk + Capital Markets | AI Council (Multi-agent) + Bull/Bear Challenge | كل قرار اجتاز معارضة داخلية قبل الإصدار |
| Explainable Research | Research + Media | Narrative Generation + Citation Linking | كل ادعاء في التقرير له evidence chain |
| Regulatory Traceability | Risk + Research | Audit Retrieval + Compliance Reporting | تقارير تنظيمية تلقائية من Objects |
| Operational Leverage | All Domains | Multiple Capabilities in parallel | محلل واحد ينتج ما ينتجه فريق |

### 2.4 القاعدة: Outcome أولًا، دائمًا

كل اتصال تجاري يبدأ بـ Outcome:
- **موقع التسويق:** يعرض Outcomes في الـ Hero، البنية في الصفحات العميقة.
- **عقد البيع:** يحدّد Outcomes المتفق عليها كمقاييس نجاح.
- **pitch للمستثمر:** يُقدّم Outcomes كـ total addressable market.
- **برنامج الـ onboarding:** يبدأ بقياس baseline لكل Outcome، ثم يقيس التحسّن.

---

## 3. الترجمة: من البنية الداخلية إلى Outcome

هذا هو الجوهر: كيف تتحوّل Objects و Capabilities و Domains إلى قيمة مؤسسية قابلة للقياس.

### 3.1 الهرمية الكاملة (النهائية)

```
┌────────────────────────────────────────────────────────────┐
│  LAYER 6 — Enterprise Outcomes                             │
│  (ما يشتريه العميل — يظهر في كل خطاب تجاري)                 │
│  Faster Decisions · Audit-Ready · Lower Risk ·             │
│  Explainable Research · Regulatory Traceability ·          │
│  Operational Leverage                                      │
└────────────────────────────────────────────────────────────┘
                            ↑
                            │ تتحقّق عبر
                            │
┌────────────────────────────────────────────────────────────┐
│  LAYER 5 — Decision Capabilities                           │
│  (ما يُمكّن Outcome — يُذكر للـ CIO والمستثمر)              │
│  Decision Intelligence · Risk Intelligence ·               │
│  Research Intelligence · Market Intelligence               │
└────────────────────────────────────────────────────────────┘
                            ↑
                            │ تُطبَّق في
                            │
┌────────────────────────────────────────────────────────────┐
│  LAYER 4 — Domains (سياقات تطبيق)                           │
│  (للـ CIO — أين يُطبَّق الذكاء)                              │
│  Capital Markets Domain Family                             │
│    (Trading · Portfolio · Risk)                            │
│  Information Markets Domain Family                         │
│    (Media)                                                 │
│  Cross-Cutting Capability Layers                           │
│    (Research · Compliance · ESG — أفقية)                   │
└────────────────────────────────────────────────────────────┘
                            ↑
                            │ تستخدم
                            │
┌────────────────────────────────────────────────────────────┐
│  LAYER 3 — Capabilities (كتالوج خدمات)                     │
│  (للـ technical buyer — ماذا تفعلا فعلًا)                    │
│  Signal Generation · Risk Scoring · Scenario Simulation ·  │
│  Narrative Generation · Audit Retrieval · ...              │
└────────────────────────────────────────────────────────────┘
                            ↑
                            │ تعمل على
                            │
┌────────────────────────────────────────────────────────────┐
│  LAYER 2 — Intelligence Objects (أصل داخلي)                 │
│  (للـ architect — ما الذي يُنتَج)                            │
│  Claim + Confidence + References to Evidence/Reasoning/    │
│  Audit + Lifecycle                                         │
└────────────────────────────────────────────────────────────┘
                            ↑
                            │ تُنتَج من
                            │
┌────────────────────────────────────────────────────────────┐
│  LAYER 1 — Evidence Foundation (الخندق الاستراتيجي)         │
│  (للـ investor — ما الذي لا يمكن استنساخه)                  │
│  Source Registry · Evidence Graph · Knowledge Graph ·      │
│  Audit Infrastructure                                      │
└────────────────────────────────────────────────────────────┘
```

### 3.2 من يرى أي طبقة؟

| الطبقة | المستثمر | CIO / Risk Officer | Analyst / Trader | Developer |
|---|---|---|---|---|
| L6 — Outcomes | ✅ نعم | ✅ نعم | ✅ نعم | ✅ نعم |
| L5 — Decision Capabilities | ✅ نعم | ✅ نعم | جزئي | ✅ نعم |
| L4 — Domains | ✅ نعم | ✅ نعم | ✅ نعم | ✅ نعم |
| L3 — Capabilities | ملخّص | ✅ نعم | لا | ✅ نعم |
| L2 — Intelligence Objects | ملخّص | ملخّص | لا | ✅ نعم |
| L1 — Evidence Foundation | ✅ نعم (كـ Strategic Asset) | ملخّص | لا | لا |

**القاعدة:** كلما اقتربنا من الأعلى (Outcomes)، زاد عدد الجمهور الذي يراها. كلما اقتربنا من الأسفل (Foundation)، قلّ العدد وزاد التخصّص.

### 3.3 أين تظهر كل طبقة على الموقع؟

| الطبقة | الصفحة |
|---|---|
| L6 — Outcomes | index.html (Hero + 6 outcome blocks) |
| L5 — Decision Capabilities | index.html (section) + كل صفحة Domain |
| L4 — Domains | صفحات Solutions (Capital Markets / Information Markets) |
| L3 — Capabilities | catalog.html |
| L2 — Intelligence Objects | platform.html (deep technical) |
| L1 — Evidence Foundation | platform.html (deep technical) + trust.html |

**القاعدة:** الصفحة الأعمق = الطبقة الأعمق. الـ index لا يذكر Objects مباشرة — يذكر Outcomes، ثم يربطها بالـ Decision Capabilities.

---

## 4. لغة خارجية vs لغة داخلية

### 4.1 المشكلة

في v4 + VALUE-MODEL، كانت اللغة واحدة للجميع:
- "Reasoned Intelligence"
- "Intelligence Object"
- "Node with references"
- "Evidence Foundation"
- "Cognitive Model"

هذا خطأ — كل جمهور يحتاج لغته.

### 4.2 جدول الترجمة

| المفهوم الداخلي | اللغة الخارجية (للمشتري المؤسسي) | اللغة الفنية (للمعماري) |
|---|---|---|
| Reasoned Intelligence (الفئة) | Institutional Decision Intelligence | Reasoned Intelligence Layer |
| Intelligence Object (الوحدة) | (لا تُذكر خارجيًا — تُستبدل بـ Outcome) | Intelligence Object (Node with refs) |
| Evidence Foundation | Strategic Knowledge Asset · Verified Evidence Network · Proprietary Intelligence Network | Evidence Foundation (Cognitive Model) |
| Cognitive Model | (لا تُذكر خارجيًا) | Cognitive Model |
| AI Council | Multi-Agent Decision Governance | AI Council (10 roles, adversarial) |
| Knowledge Graph | Connected Intelligence Network | Knowledge Graph |
| Capabilities | Decision Capabilities (للـ CIO) | Capabilities (Catalog) |
| Domains | Industry Solutions (للمشتري) | Domains (سياقات) |
| Workflows | Decision Workflows · Governance Workflows | Integration Patterns |
| Consumption Methods | How You Access ROUAA | Consumption Methods (technical) |

### 4.3 قواعد استخدام اللغة

1. **Hero / Pitch / Sales deck:** لغة خارجية فقط. لا "Objects"، لا "Nodes"، لا "Cognitive Model".
2. **Solution pages:** لغة خارجية + بعض لغة Decision Capabilities. Objects تُذكر إذا كان الجمهور تقنيًا.
3. **Platform page (deep technical):** اللغة الكاملة، كل المفاهيم الداخلية.
4. **Trust page:** تركّز على Strategic Knowledge Asset و Audit-Ready، لا على Objects.
5. **Developer page:** لغة فنية + Contracts/Embeddings.
6. **Contracts / MSAs:** لغة قانونية + Reference IDs (Object IDs, Audit IDs).

### 4.4 مثال: كيف يُعرض نفس الـ Object في سياقين

**للـ CIO في عرض بيع:**
> "كل قرار في مؤسستك سيدخل مع سلسلة أدلة كاملة، قابل لإعادة البناء بعد سنة، جاهز للمراجع التنظيمية. هذا هو Audit-Ready Investment Process."

**للمهندس في وثائق API:**
> "Each Intelligence Object returns: claim, confidence, evidence_chain_ref, reasoning_chain_ref, audit_trail_ref, lifecycle metadata."

نفس الـ Object. لغتان. جمهوران.

---

## 5. Research كـ Capability Layer أفقية، لا Domain رأسية

### 5.1 الإصلاح الجوهري

VALUE-MODEL v1 وضع Research كـ Domain ضمن "Information Markets Family" جنبًا إلى جنب مع Media.

هذا خطأ. Research ليس Domain رأسيًا — بل **Capability Layer أفقية** تخدم جميع Domains:

- Asset Manager يستخدم Research لإنتاج تقارير داخلية
- Bank يستخدم Research لتقارير العملاء
- Fund يستخدم Research لـ investment committee briefings
- Media يستخدم Research لإنتاج محتوى عميق
- Risk يستخدم Research لتحليل sector exposure

Research تظهر في كل Domain — هذا تعريف Capability Layer، لا Domain.

### 5.2 الهيكل المُصحَّح

```
Domain Families (رأسية — حسب الصناعة)
│
├── Capital Markets Domain Family
│   ├── Trading Intelligence
│   ├── Portfolio Intelligence
│   └── Risk Intelligence
│
├── Information Markets Domain Family
│   └── Media Intelligence
│
└── (مستقبلاً)
    ├── ESG Domain Family
    ├── Compliance Domain Family
    └── ...

Capability Layers (أفقية — تخدم كل Domains)
│
├── Research Intelligence (تحليل، تقارير، استدلال عميق)
├── Compliance Intelligence (تقارير، امتثال، تتبّع)
├── Developer Intelligence (APIs، SDKs، تكامل)
└── (مستقبلاً)
    ├── ESG Intelligence Layer
    └── ...
```

### 5.3 لماذا هذا الإصلاح مهم؟

- **يتجنّب الازدواجية:** لا نُكرّر Research داخل كل Domain.
- **يخدم البيع المتقاطع:** العميل الذي اشترك في Capital Markets يمكنه إضافة Research Layer كـ add-on.
- **يبسّط التسعير:** Domain Package (رأسي) + Capability Layer (add-on أفقي).
- **يتوافق مع الواقع:** Banks و Funds يشترون Research كـ layer فوق كل ما يفعلونه، لا كـ Domain منفصل.

### 5.4 أثر هذا على الموقع

- صفحة `enterprise.html` (التي كانت Research Domain) تُعاد تسميتها إلى **Research Intelligence — Capability Layer**.
- تُعرض كـ layer تخدم Capital Markets + Information Markets + Domains المستقبلية.
- T-crossing diagram يوضح: Research Layer تعبر فوق كل Domains.

---

## 6. إعادة تصنيف: Consumption vs Deployment vs Integration

### 6.1 الإصلاح الجوهري

VALUE-MODEL v1 وضع Workflows كـ Consumption Method سادس جنبًا إلى جنب مع Surfaces و APIs و Widgets.

هذا غير دقيق — لأن Workflows ليست طريقة عرض، بل **طريقة تشغيل**. هذا فئة مختلفة.

### 6.2 التصنيف المُصحَّح

```
How ROUAA reaches the customer (3 فئات منفصلة)

A. Consumption Methods (كيف يرى العميل الذكاء)
   ├── Surfaces        (Terminal · Mobile · Dashboard · Report Viewer)
   ├── Contracts       (REST API · SDK · Webhook · Streaming · GraphQL)
   ├── Embeddings      (Widget · Inline Card · Embedded Chart)
   └── Channels        (News · Newsletter · Video · Audio · Alerts)

B. Deployment Models (أين يعيش الذكاء)
   ├── SaaS
   ├── Private Cloud
   ├── On-prem
   └── Hybrid

C. Integration Patterns (كيف يدخل الذكاء في عمل العميل)
   ├── Workflows              (IC · Analyst · Compliance · Risk · Editorial · Approval)
   ├── Event Bus              (real-time event streams into customer systems)
   ├── BPM Integration        (BPM tools: Camunda · ServiceNow · Pega)
   └── Approval Chains        (multi-step decision approval flows)
```

### 6.3 لماذا هذا التصنيف أدقّ؟

- **كل فئة لها طبيعة مختلفة:** Consumption = عرض، Deployment = مكان، Integration = تشغيل.
- **لكل فئة نموذج تسعير مختلف:** Consumption بالـ volume، Deployment بـ fixed fee، Integration بـ per-workflow activation.
- **لكل فئة فِريق شراء مختلف:** Consumption للـ product owner، Deployment للـ IT/security، Integration للـ operations/business process.
- **تتوافق مع كيف تفكّر المؤسسات:** المؤسسة تسأل: "كيف نراه؟ أين يعيش؟ كيف ندمجه؟" — ثلاثة أسئلة منفصلة.

### 6.4 Matrix المُحدَّث: Domains × Categories

| Domain | Consumption (Surfaces) | Consumption (Contracts) | Consumption (Embeddings) | Consumption (Channels) | Deployment | Integration (Workflows) |
|---|---|---|---|---|---|---|
| Capital Markets | Trading Terminal | Trading API | Chart Widget | Signal Alerts | SaaS / On-prem | IC · Approval |
| Information Markets | News Portal | News API | News Widget | Articles · Videos | SaaS / White-label | Editorial |
| Risk | Risk Dashboard | Risk API | Risk Widget | Risk Alerts | On-prem (banks) | Compliance · Risk |
| Research Layer | Research Portal | Research API | Research Widget | Reports · Newsletters | SaaS / Hybrid | Analyst |

Integration Patterns تشمل عمودًا إضافيًا لـ Event Bus و BPM (يُفعّل عند الطلب للمؤسسات الكبيرة).

---

## 7. Evidence Foundation كـ Strategic Knowledge Asset

### 7.1 الإصلاح الجوهري

"Evidence Foundation" أفضل من "Cognitive Model"، لكنها لا تزال تقنية. للمستثمر والمشتري المؤسسي، الكلمة لا تُولّد الحماس.

### 7.2 الأسماء الخارجية البديلة

| السياق | الاسم المقترح |
|---|---|
| للمستثمر (Strategic Asset) | **Proprietary Intelligence Network** |
| للـ CIO (Trust Anchor) | **Verified Evidence Network** |
| للـ Risk Officer (Compliance) | **Audit-Ready Knowledge Asset** |
| لعموم الخطاب | **Strategic Knowledge Asset** |
| داخليًا (هندسيًا) | **Evidence Foundation** (يُبقى) |

### 7.3 لماذا هذا التعدّد؟

المستثمر يريد أن يسمع: "asset لا يمكن استنساخه". 
الـ CIO يريد أن يسمع: "network موثّقة أثق بها". 
الـ Risk Officer يريد أن يسمع: "audit-ready". 

كلهم يصفون نفس الشيء، لكن كل جمهور يحتاج كلمة مختلفة.

### 7.4 كيف يظهر في الموقع؟

- index.html: "Strategic Knowledge Asset" (مرة واحدة، كتمييز للخندق).
- trust.html: "Verified Evidence Network" (لكل ادعاء دليله).
- platform.html: "Evidence Foundation" (التفصيل التقني).
- pitch deck للمستثمر: "Proprietary Intelligence Network" (كـ moat).

---

## 8. ثلاث سردابات للجماهير الثلاثة

### 8.1 السرداب للمستثمر (Investor Narrative)

> "الأسواق المالية تعاني من فجوة: مليارات تُتخذ قراراتها بلا سلسلة دليل قابلة للتدقيق. Bloomberg يبيع بيانات. FactSet يبيع أدوات. OpenAI يبيع ذكاء عامًا. لا أحد يبيع **قرارًا مؤسسيًا مُسنَدًا بالأدلة**.
>
> رؤى تملأ هذه الفجوة عبر **Proprietary Intelligence Network** لا يمكن استنساخها — 411+ مصدر رسمي، Evidence Graph، Knowledge Graph، Audit Infrastructure — تجتمع لإنتاج ذكاء قرار مؤسسي يُستهلك عبر Capital Markets و Information Markets.
>
> النموذج التجاري: Platform License متكرر + Domain Packages + Usage growth + Integration lock-in. كل عميل مؤسسي يبدأ بـ Domain واحد، يتوسّع إلى Domain Families، ثم يُفعّل Integration Patterns التي ترفع تكلفة التبديل.
>
> الـ moat ليس في الـ AI — الـ AI سلعة. الـ moat في الـ Proprietary Intelligence Network التي تتطلّب سنوات وبناء تشغيلي مستمر."

### 8.2 السرداب للمشتري المؤسسي (CIO / Risk Officer Narrative)

> "كل قرار في مؤسستك اليوم يُتَّخذ بلا سلسلة دليل كاملة. محلّلوك يقضون أسابيع في البحث، ثم يخرجون بقرار لا يمكن إعادة بنائه بعد سنة. اللجان التنظيمية تطلب Audit Trail لا تملكه. 
>
> رؤى تحلّ هذا عبر **Verified Evidence Network**: كل قرار يُنتَج مع سلسلة أدلة كاملة، يحمل درجة ثقة موثّقة، يمرّ بحوكمة قرار متعددة الأدوار، ويُحفَظ مع Audit Trail قابل لإعادة البناء بعد سنوات.
>
> النتيجة: قرارات أسرع بلا التضحية بالجودة، عملية استثمار جاهزة للتدقيق، مخاطر قرار أقل، أبحاث يمكن تفسيرها للجان والعملاء، قابلية تتبّع تنظيمي كامل، وكفاءة تشغيلية تضاعف إنتاجية محلّليك.
>
> لا نستبدل أنظمتك — نضيف طبقة ذكاء قرار فوقها. تستهلكها عبر Terminal للمتداولين، Dashboards لمدراء المخاطر، APIs للأنظمة الداخلية، Workflows للجان الاستثمار والامتثال."

### 8.3 السرداب للمستخدم النهائي (Analyst / Trader Narrative)

> "بدلًا من قضاء يومك في تجميع بيانات من خمسة مصادر، رؤى تعطيك الإجابة جاهزة — مع الدليل.
>
> تفتح الـ Trading Terminal: ترى الإشارة، درجة الثقة، الأدلة خلفها، السيناريوهات المحتملة، سياق المخاطر — في شاشة واحدة.
>
> تُسأل في لجنة الاستثمار: 'لماذا هذا القرار؟' — بدلًا من 'سأتحقّق وأعود لك'، تجيب فورًا: 'القرار مُسنَد بـ 3 مصادر رسمية، اجتاز معارضة داخلية، درجة الثقة 78%'.
>
> الـ Risk Desk يرى تنبيهات استباقية قبل أن تصبح مشكلة. Compliance يولّد التقارير تلقائيًا. كل قرار تُتخذه يحمل توقيعه — قابل للتدقيق، قابل للتفسير، قابل للدفاع."

### 8.4 القاعدة المشتركة

السردابات الثلاثة:
- لا تذكر Intelligence Objects مباشرة
- تذكر Outcome أولًا
- تذكر الـ Strategic Knowledge Asset كـ moat (للمستثمر) أو كـ trust anchor (للمؤسسي)
- تُظهر كيف يصل الذكاء إلى المستخدم (Surfaces, Workflows)

---

## 9. KPIs لكل Outcome — قياس القيمة المُسلَّمة

### 9.1 لماذا KPIs مهمة؟

الـ Outcomes مجردة بدون مقاييس. العميل المؤسسي يدفع مقابل **تحسّن قابل للقياس**، لا مقابل وعود.

### 9.2 KPIs لكل Outcome

| Outcome | KPI | Baseline افتراضي | Target تحسّن |
|---|---|---|---|
| Faster Decisions | Time-to-Decision (ساعات من الحدث إلى القرار) | 40-80 ساعة | 2-8 ساعات |
| Audit-Ready Investment Process | % من القرارات مع Audit Trail كامل | 10-30% | 95%+ |
| Lower Decision Risk | Decision Quality Score (مراجعة لاحقة للقرارات) | 50-65/100 | 80+/100 |
| Explainable Research | Citation Density (مرجع موثّق لكل ادعاء في التقرير) | 0.5 | 3+ |
| Regulatory Traceability | Compliance Pass Rate (نسبة التقارير المقبولة من المنظّم) | 70-85% | 99%+ |
| Operational Leverage | Analyst Productivity (قرار/تقرير لكل محلل شهريًا) | 5-10 | 30-50 |

### 9.3 كيف تُقاس؟

- **Onboarding phase (90 يوم):** قياس baseline لكل KPI قبل رؤى.
- **Quarterly review:** قياس التحسّن، تقديمه للعميل.
- **Annual review:** ربط التجديد بتحقّق الـ KPIs المتفق عليها.

### 9.4 الربط بالعقد

كل عقد مؤسسي يتضمّن:
- KPIs المتفق عليها
- baseline مُسجَّل
- targets سنوية
- review cycle
- consequences (إذا فشلت KPIs — مراجعة العقد)

هذا يحوّل رؤى من "منتج مشترى" إلى **"نتيجة مؤسسية مُسلَّمة"**.

---

## 10. النموذج التجاري المُحدَّث

### 10.1 الإصلاح الجوهري

VALUE-MODEL v1 قال: Platform + Domain + Usage.
هذا صحيح، لكنه ناقص — يفتقد Outcome layer و يفتقد Capability Layers.

### 10.2 النموذج الكامل

```
1. Platform License (الأساس)
   └── Strategic Knowledge Asset access + Object production + Audit

2. Domain Package (رأسي — يختار العميل أي المجالات)
   ├── Capital Markets Domain Family (Trading · Portfolio · Risk)
   ├── Information Markets Domain Family (Media)
   └── (مستقبلاً: ESG · Compliance Domain Families)

3. Capability Layer Subscription (أفقي — add-ons)
   ├── Research Intelligence Layer
   ├── Developer Intelligence Layer
   └── (مستقبلاً: ESG Intelligence Layer)

4. Consumption Usage (مقاس)
   ├── Surfaces (per seat)
   ├── Contracts (per call)
   ├── Embeddings (per instance)
   └── Channels (per subscription)

5. Deployment Model (نشر)
   └── SaaS · Private Cloud · On-prem · Hybrid (pricing varies)

6. Integration Activation (تشغيل — premium add-on)
   ├── Workflows (per workflow activated)
   ├── Event Bus (per stream)
   ├── BPM Integration (per system)
   └── Approval Chains (per chain)

7. Outcome SLA (ضمانات النتيجة)
   └── KPIs مكتوبة في العقد، مع bonuses/penalties
```

### 10.3 مثال: عقد بنك استثماري كبير

```
Platform License — Tier 1 (أكبر حجم)
  → Unlimited Object production
  → Strategic Knowledge Asset full access
  → 7-year Audit retention

+ Capital Markets Domain Family
  → Trading Intelligence + Portfolio Intelligence + Risk Intelligence
  → All Capabilities included

+ Research Intelligence Layer
  → For Equity Research division

+ Consumption:
  → 500 Terminal seats
  → 1M API calls/month
  → 100 Widget instances

+ Deployment: Hybrid (SaaS + On-prem for Risk)

+ Integration:
  → Investment Committee Workflow (activated)
  → Compliance Workflow (activated)
  → Approval Chain for trading decisions (activated)
  → Event Bus integration with internal risk engine

+ Outcome SLA:
  → Time-to-Decision: < 8 hours
  → Audit-Ready: 98%+ of decisions
  → Compliance Pass Rate: 99%+

Term: 3 years, with annual KPI review.
```

هذا العقد يحمي الطرفين: العميل يدفع مقابل outcomes مضمونة، رؤى تلتزم بنتائج قابلة للقياس.

---

## 11. تحديث خريطة الموقع

### 11.1 الهيكل الجديد للصفحات

```
index.html
  → Hero: Outcome-first ("Decisions with evidence behind them")
  → 6 Enterprise Outcomes blocks
  → Decision Capabilities overview
  → Domains overview (Capital Markets + Information Markets)
  → Trust (Strategic Knowledge Asset + Audit-Ready)
  → CTA: Request Briefing

solutions.html (السابقة)
  → تعرض Domain Families + Capability Layers
  → Matrix: Domains × Outcomes

capital-markets.html (جديدة — تجمع Trading + Portfolio + Risk)
  → Outcome-first framing
  → Decision Capabilities for Capital Markets
  → Consumption + Deployment + Integration for Capital Markets

information-markets.html (جديدة — Media)
  → Outcome-first framing
  → Media Intelligence Capabilities
  → Editorial Workflows

research-intelligence.html (السابقة enterprise.html — reframed كـ Capability Layer)
  → Research as cross-cutting layer
  → How it serves Capital Markets + Information Markets + future Domains
  → Research Workflow integration

risk-intelligence.html (داخل Capital Markets Family — صفحة تفصيلية)
  → Risk Outcomes (Lower Risk + Regulatory Traceability)
  → Risk Capabilities + Risk Workflows

trading-technologies.html (داخل Capital Markets Family — صفحة تفصيلية)
  → Trading Outcomes (Faster Decisions + Audit-Ready)
  → Trading Capabilities + Trading Workflows

media-technologies.html (داخل Information Markets Family — صفحة تفصيلية)
  → Media Outcomes (Explainable Content + Operational Leverage)
  → Media Capabilities + Editorial Workflows

developers.html (Capability Layer للتكامل)
  → Contracts + Embeddings + Integration Patterns
  → For builders, not for buyers

platform.html (deep technical — أصل داخلي)
  → Strategic Knowledge Asset detail
  → Intelligence Object anatomy
  → 6-layer model

products-architecture.html (deep technical — تفصيل معماري)
  → Evidence Foundation structure
  → Cognitive Model internals

catalog.html (Capabilities Catalog)
  → All Capabilities listed
  → Domains × Capabilities matrix
  → Consumption Methods × Deployment Models × Integration Patterns matrix

trust.html
  → Audit-Ready كأساس
  → Verified Evidence Network
  → Compliance & Regulatory Traceability

company.html
  → Why ROUAA exists (Manifesto)
  → Outcome-first story
```

### 11.2 ما الذي تغيّر عن خريطة v4 / VALUE-MODEL

- صفحات Domains مُجمَّعة تحت Capital Markets + Information Markets (لا متساوية)
- Research صفحة Capability Layer، لا Domain
- Developers صفحة Capability Layer للتكامل، لا "solution"
- index.html يبدأ بـ Outcomes، لا بـ Architecture
- صفحات جديدة: capital-markets.html, information-markets.html

---

## 12. ما الذي تغيّر عن v4 + VALUE-MODEL

| العنصر | v4 / VALUE-MODEL | OUTCOME-MODEL v1 |
|---|---|---|
| التعريف الأعلى لرؤى | "تنتج Intelligence Objects" | **"تُمكّن المؤسسات من إنتاج قرارات أسرع، قابلة للتتبّع، مُسنَدة بالأدلة"** |
| مركز الخطاب | Intelligence Object | **Enterprise Outcomes** |
| Intelligence Object في الـ Hero | يظهر | **لا يظهر** (يظهر في platform.html فقط) |
| Evidence Foundation في الخطاب | Foundation (تقني) | **Strategic Knowledge Asset / Verified Evidence Network** (متعدد حسب الجمهور) |
| Research | Domain رأسية | **Capability Layer أفقية** تخدم كل Domains |
| Workflows | Consumption Method سادس | **Integration Pattern** (فئة منفصلة) |
| الفئات في الاستهلاك | 6 Consumption Methods | **3 فئات منفصلة**: Consumption + Deployment + Integration |
| KPIs | غير مذكورة | **6 KPIs لكل Outcome** مكتوبة في العقد |
| الجمهور | واحد، لغة واحدة | **3 سردابات** للمستثمر/المؤسسي/النهائي |
| العقد | License + Usage | **+ Outcome SLA** مع bonuses/penalties |
| الهرمية | 5 طبقات | **6 طبقات** — إضافة Enterprise Outcomes في القمة |

---

## 13. المبادئ المؤسسة المُحدَّثة

(مُحدَّثة من v4 + VALUE-MODEL)

1. **رؤى تُعرَّف بما تغيّره، لا بما تنتجه.** — Outcome أولًا، دائمًا.

2. **الـ Outcomes هي ما يُباع.** — Intelligence Objects و Capabilities و Domains وسائل لتحقيق Outcomes، لا غاية في نفسها.

3. **اللغة الخارجية ≠ اللغة الداخلية.** — Objects و Nodes و Cognitive Model مفاهيم داخلية. الخارج يسمع: Outcomes, Strategic Knowledge Asset, Decision Capabilities.

4. **الـ Strategic Knowledge Asset هو الخندق.** — لا يُباع، يُرخّص به. يُوصف للجمهور المناسب بالاسم المناسب.

5. **Research Capability Layer، لا Domain.** — تخدم كل Domains، لا تُحصر في واحد.

6. **Workflows = Integration Patterns، لا Consumption Methods.** — طريقة تشغيل، لا طريقة عرض.

7. **ثلاث فئات منفصلة للوصول:** Consumption (عرض) + Deployment (مكان) + Integration (تشغيل).

8. **Domain Families رأسية + Capability Layers أفقية.** — الإضافة في أي اتجاه لا تكسر البنية.

9. **كل Outcome له KPI مكتوب في العقد.** — العقد يضمن النتيجة، لا الوصول فقط.

10. **ثلاث سردابات للجماهير الثلاثة.** — مستثمر / مؤسسي / نهائي. كل جمهور يسمع ما يحتاج.

11. **النظرية مستقلة عن الاسم.** — كل المبادئ العشرة السابقة تبقى صحيحة بأي تسمية.

---

## 14. أسئلة مفتوحة للنقاش

1. **اسم "Enterprise Outcomes"** — هل نُبقيه أم نستخدم:
   - Institutional Outcomes
   - Business Outcomes
   - Decision Outcomes
   - أو لا نسمّيها — نُدرج الـ 6 outcomes مباشرة؟

2. **KPIs — كيف نُسعّرها؟** — هل:
   - Outcome SLA مضمّن في كل عقد مؤسسي (بلا رسوم إضافية)
   - Outcome SLA كـ premium add-on
   - أو فقط لأكبر 10% من العملاء؟

3. **هل Research Intelligence Layer لها صفحة منفصلة، أم تُدمج في كل Domain؟** — الرأي: صفحة منفصلة كـ Capability Layer أوضح للسوق.

4. **هل نُنشئ صفحات Domain Family منفصلة (capital-markets.html, information-markets.html)، أم نبقي صفحات Sub-Domain (trading, media, risk)؟** — صفحات Family أقوى للسرد، صفحات Sub-Domain أعمق تقنيًا.

5. **هل "Strategic Knowledge Asset" يظهر في الـ Hero، أم نتركه لصفحة Trust؟** — Hero أقوى للتميّز، لكنه قد يربك المشتري العادي.

6. **ماذا عن "Decision Capabilities" كمصطلح؟** — هل نُبقيه كطبقة 5، أم ندمجه مع Capabilities (طبقة 3)؟

---

## 15. الحالة الراهنة والخطوة التالية

### 15.1 ما الذي حسمته هذه الوثيقة

- ✅ إعادة تموضع رؤى: من "تنتج Objects" إلى "تُمكّن القرارات"
- ✅ 6 Enterprise Outcomes كـ ما يُشترى فعليًا
- ✅ KPIs لكل Outcome، مكتوبة في العقد
- ✅ فصل اللغة الخارجية عن الداخلية
- ✅ Research كـ Capability Layer أفقية، لا Domain رأسية
- ✅ Workflows كـ Integration Pattern، لا Consumption Method
- ✅ ثلاث فئات وصول منفصلة (Consumption + Deployment + Integration)
- ✅ Evidence Foundation كـ Strategic Knowledge Asset (متعدد الأسماء حسب الجمهور)
- ✅ ثلاث سردابات للجماهير الثلاثة
- ✅ خريطة موقع مُحدَّثة (صفحات Domain Families جديدة)
- ✅ نموذج تجاري مُحدَّث (7 طبقات بدل 3)

### 15.2 ما الذي ما زال مفتوحًا

- ⬜ التسعير التفصيلي (يحتاج `PRICING-MODEL-v3.md` بناءً على النموذج المُحدَّث)
- ⬜ بنود العقد الفعلية (يحتاج `MASTER-SERVICE-AGREEMENT-v1.md` شاملًا KPI SLAs)
- ⬜ الأسئلة الستة المفتوحة في القسم 14

### 15.3 سلسلة الوثائق التأسيسية (الحالة الراهنة)

```
INTELLIGENCE-MODEL-v4  (معماري — ما الذي يوجد داخل رؤى)
        ↓
ROUAA-VALUE-MODEL-v1   (تجاري — كيف يُرخّص)
        ↓
OUTCOME-MODEL-v1       (استراتيجي — لماذا يُشترى)  ← أنت هنا
        ↓
(التالي)
PRICING-MODEL-v3       (تسعير تفصيلي على أساس 7 طبقات)
MSA-v1                 (عقد تجاري مع KPI SLAs)
SITE-NARRATIVE-v1      (سرد الموقع الكامل قبل HTML)
        ↓
HTML Implementation
```

### 15.4 الخطوات قبل HTML

1. **اعتماد هذه الوثيقة** بعد النقاش.
2. **حسم الأسئلة الستة المفتوحة** (القسم 14).
3. **كتابة PRICING-MODEL-v3.md** على أساس النموذج التجاري المُحدَّث (7 طبقات).
4. **كتابة SITE-NARRATIVE-v1.md** — سرد كل صفحة قبل كتابة HTML.
5. **ثم البدء في HTML** من index.html.

**قبل كل ذلك**: لا يُعدَّل أي HTML حتى تُعتمد هذه الوثيقة + تُحسم الأسئلة المفتوحة.

---

*الإصدار: v1.0 — الطبقة الاستراتيجية فوق VALUE-MODEL*
*التاريخ: يوليو 2026*
*الحالة: مسودة للنقاش — الجسر النهائي بين النظرية والشركة*
*القاعدة المُلهمة:* رؤى ليست شركة تُنتج ذكاءً — رؤى شركة تُغيّر كيفية اتخاذ القرار المؤسسي. كل ما عداها وسيلة.
