# ROUAA-VALUE-MODEL-v1

> **الطبقة التجارية فوق INTELLIGENCE-MODEL-v4.**
> تجيب فقط على خمسة أسئلة تجارية — لا تتكرر فيها المعمارية.
> v4 حسمت "ما هي رؤى؟" — هذه الوثيقة تحسم "كيف تُباع رؤى؟".

> **الإصدار:** v1.0
> **التاريخ:** يوليو 2026
> **الحالة:** مسودة للنقاش قبل تنفيذ HTML
> **العلاقة بـ INTELLIGENCE-MODEL-v4:** تستند إليها، وتطبّق 7 تنقيحات تسويقية/تجارية

---

## 0. لماذا هذه الوثيقة؟

INTELLIGENCE-MODEL-v4 حسمت البنية المعمارية. لكنها تركت خمس أسئلة تجارية مفتوحة:

1. ما الذي يشتريه العميل؟
2. ما الذي لا يشتريه؟
3. ما الوحدة التي تُرخّص؟
4. ما الذي يدخل في العقد التجاري؟
5. ما الذي يراه المستثمر مقابل ما يراه المستخدم؟

هذه الأسئلة لا تُجاب بالمعمارية — تُجاب بنموذج القيمة.

> **القاعدة:** المعمارية تُخبرك ما الذي يوجد. نموذج القيمة يُخبرك ما الذي يُباع. الاثنان مختلفان، ولا يجب الخلط بينهما.

---

## 1. التعريف الأعلى لرؤى (مُحدَّث)

### 1.1 التعريف القديم (v4)

> "رؤى = نظام يُنتج Reasoned Intelligence..."

هذا صحيح معماريًا، لكنه مُجرَّد جدًا تجاريًا.

### 1.2 التعريف الجديد (v1.0)

> **رؤى = بنية لإنتاج ذكاء مؤسسي موثّق، تحوّل الواقع المالي إلى Intelligence Objects قابلة للتدقيق وإعادة الاستخدام عبر مجالات متعددة.**

### 1.3 التنقيحات التي تُطبَّق من v4

| v4 | VALUE-MODEL v1.0 |
|---|---|
| Reasoned Intelligence (كوحدة قيمة) | Reasoned Intelligence = **الفئة**؛ Intelligence Object = **الوحدة** |
| Node (في كل مكان) | Node = مصطلح هندسي داخلي فقط؛ خارجيًا نستخدم **Intelligence Object** |
| Cognitive Model (في كل مكان) | داخليًا: Cognitive Model؛ خارجيًا: **Evidence Foundation** |
| Trading / Research / Risk / Media (متساوية) | إعادة هيكلة: **Capital Markets Domain** يضم Trading + Portfolio + Risk؛ **Information Markets Domain** يضم Media + Research |
| Consumption Methods (5 أنواع) | **6 أنواع** — إضافة Workflows |
| "لا يستطيع العميل إنتاجها" | **"بناؤها داخليًا ممكن لكن مكلف وغير مجدٍ تشغيليًا"** |

---

## 2. السؤال 1: ما الذي يشتريه العميل؟

### 2.1 الإجابة المختصرة

العميل لا يشتري "منتجًا" — يشتري **حق الوصول إلى إنتاج Intelligence Objects + تفعيل Capabilities محددة + استهلاكها عبر طرق محددة**.

### 2.2 ثلاث طبقات شراء

```
Platform License  (الأساس — يدخله كل عميل)
       +
Domain Package    (يختار العميل أي المجالات يحتاج)
       +
Usage             (يُقاس على الاستهلاك الفعلي)
```

### 2.3 الطبقة الأولى — Platform License

**ما الذي يحصل عليه العميل:**
- حق الوصول إلى Evidence Foundation (المصادر + الأدلة + المعرفة)
- إنتاج Intelligence Objects ضمن حجم متفق عليه شهريًا
- Audit Trail كامل لكل Object
- SLAs على التشغيل والأمان
- حق تفعيل Capabilities (لكن التفعيل نفسه داخل Domain Package)

**ما الذي لا يحصل عليه:**
- ملكية Evidence Foundation — هي ترخيص وصول، لا نقل ملكية
- استخدامات خارج نطاق Domains المشتراة
- إعادة بيع Intelligence Objects لطرف ثالث

### 2.4 الطبقة الثانية — Domain Package

**كل Domain Package = (مجموعة Capabilities) + (سياق Domain) + (Consumption Methods محددة)**

| Domain Package | يشمل Capabilities | يشمل Consumption Methods افتراضية |
|---|---|---|
| **Capital Markets Domain** | Signal Generation, Risk Scoring, Scenario Simulation, Execution Orchestration, Exposure Analysis | Trading Terminal, Trading API, Chart Widget, Signal Alerts, Investment Committee Workflow |
| **Information Markets Domain** | Narrative Generation, Event Intelligence, Media Production, Editorial Workflow | News Portal, News API, News Widget, Editorial Workflow |
| **Research Domain** | Scenario Modeling, Entity Analysis, Correlation Discovery, Strategic Narrative | Research Portal, Research API, Research Widget, Analyst Workflow |
| **Risk Domain** | Risk Scoring, Exposure Analysis, Anomaly Detection, Compliance Reporting | Risk Dashboard, Risk API, Risk Widget, Compliance Workflow |

**ملاحظة:** Capabilities لا تُباع منفصلة — تُباع كجزء من Domain Package. هذا يبسّط قرار الشراء.

### 2.5 الطبقة الثالثة — Usage

**يُقاس على:**
- عدد Intelligence Objects المُنتَجة شهريًا (إذا تجاوز الحجم الأساسي)
- عدد API calls (للـ Contracts)
- عدد Widget embeds (للـ Embeddings)
- عدد White-label instances (للـ Deployments)
- عدد Workflow integrations نشطة

**النموذج:** Metered usage فوق Base Volume المضمّن في Platform License.

### 2.6 مثال: ما الذي يشتريه صندوق تحوّط متوسط؟

```
Platform License
  → Evidence Foundation access
  → 5,000 Intelligence Objects / month
  → Audit Trail كامل
       +
Capital Markets Domain Package
  → Signal Generation
  → Risk Scoring
  → Scenario Simulation
  → Investment Committee Workflow
       +
Trading Terminal (Surface) — 50 seats
+ Trading API (Contract) — 100K calls/month
+ Signal Alerts (Channel) — unlimited
       +
Usage overage (if applicable)
```

هذا التركيب يحدّد ما يدفع العميل — بثلاثة مكوّنات، لا بعشرة.

---

## 3. السؤال 2: ما الذي لا يشتريه العميل؟

هذا السؤال بنفس أهمية "ما الذي يشتريه" — لأنه يحدّد ما لا يدخل في العقد، وبالتالي ما لا يُلزم رؤى قانونيًا.

### 3.1 العميل لا يشتري Evidence Foundation نفسها

- Evidence Foundation (المصادر، الأدلة، الـ Knowledge Graph) = **الخندق**.
- العميل يرخّص **الوصول إليها**، لا يملكها.
- لو غادر العميل، Evidence Foundation تبقى مع رؤى.

**هذا أهم مبدأ تجاري:** الخندق لا يُباع، يُرخّص به.

### 3.2 العميل لا يشتري Intelligence Objects منفردة

- لا يوجد "اشترِ 100 Object".
- العميل يرخّص **طاقة إنتاج** — حجم شهري من Objects ضمن Platform License.
- Objects نفسها تُنتَج وتُستهلك، لكن لا تُباع بالقطعة.

### 3.3 العميل لا يشتري البيانات الخام

- رؤى ليست Refinitiv ولا Bloomberg.
- العميل لا يحصل على الـ Source Registry كبيانات.
- يحصل على Intelligence Objects مُستنتَجة من المصادر — لا على المصادر نفسها.

### 3.4 العميل لا يشتري نماذج AI مخصصة

- Capabilities خدمات جاهزة، ليست نماذج مبنية للعميل.
- لو أراد العميل نموذجًا مخصصًا، هذا **خدمة استشارية منفصلة**، لا جزء من Platform License.

### 3.5 العميل لا يشتري "ميزات"

- لا يوجد "feature list" في العقد.
- العقد يحدّد: Platform License + Domain Packages + Usage.
- "الميزات" (التي تظهر في موقع التسويق) هي تعبيرات عن Capabilities + Consumption Methods، ليست بنود عقد.

### 3.6 العميل لا يشتري التزامات استثمارية

- رؤى لا تقدّم توصيات استثمارية ملزمة.
- Intelligence Objects تُقدّم استدلالًا موثّقًا، لكن القرار النهائي للعميل.
- هذا محمي قانونيًا في العقد: "Intelligence Objects are analytical artifacts, not investment advice."

---

## 4. السؤال 3: ما الوحدة التي تُرخّص؟

### 4.1 الإجابة

> **Intelligence Object**

> كيان معرفي دائم، قابل للتدقيق، يربط ادعاءً بأدلته، بعملية استدلاله، بدرجة ثقته، وبدورة حياته.

### 4.2 التعريف التشغيلي

```
Intelligence Object
─────────────────────────────
Claim         — الادعاء عن الواقع
Confidence    — درجة الثقة محدودة السقف
References    — مراجع مستقلة إلى:
  → Evidence Chain ID
  → Reasoning Chain ID
  → Audit Trail ID
  → Source IDs
Lifecycle     — وُلد، تُحدِّث، مؤرشف (لا يُحذف)
```

### 4.3 لماذا Intelligence Object وليس "Reasoned Intelligence"؟

| السبب | التوضيح |
|---|---|
| **Reasoned Intelligence فئة، ليست وحدة** | مثل "Database" مقابل "Row" — Database فئة، Row الوحدة |
| **Object قابل للترخيص** | يمكن تحديده في عقد: "5,000 Objects شهريًا" |
| **Object قابل للتدقيق** | يمكن للمراجع تتبّع Object واحد من الادعاء إلى المصدر |
| **Object قابل للمقارنة** | يمكن للعميل مقارنة Object من 2025 بـ Object من 2026 |
| **Object له هوية** | ID مستقر، يمكن الرجوع إليه بعد سنوات |

### 4.4 Object واحد، عدة تمثيلات

نفس Intelligence Object يُمثَّل بطرق مختلفة حسب Consumption Method:

| Consumption Method | كيف يظهر الـ Object |
|---|---|
| Surface (Terminal) | بطاقة مع Claim + Confidence + Evidence link |
| Contract (API) | `{claim, confidence, evidence_ref, reasoning_ref, audit_ref}` |
| Embedding (Widget) | بطاقة مدمجة في منصة العميل |
| Channel (News) | مقال بقصة + citation للـ Object |
| Workflow (Approval) | Object يدخل في خطوة اتخاذ قرار |

**هذا هو الجوهر:** Object واحد، طرق استهلاك متعددة. لا "منتجات منفصلة".

### 4.5 لماذا لا يستطيع العميل بناء Objects بنفسه؟

**الإصلاح عن v4:** لا نقول "لا يستطيع" — Goldman Sachs و BlackRock يستطيعان. نقول:

> المؤسسات الكبرى تستطيع بناء أجزاء منها، لكن بناء نظام مستمر لإنتاج Intelligence Objects موثّقة وقابلة للتدقيق عالميًا يتطلب سنوات واستثمارًا تشغيليًا ضخمًا.

هذا أصدق وأقوى — لأنه يضع السؤال على **التكلفة مقابل القيمة**، لا على الإمكانية.

---

## 5. السؤال 4: ما الذي يدخل في العقد التجاري؟

### 5.1 البنود الإلزامية في كل عقد رؤى

```
1. Party definitions (من العميل، من رؤى)
2. Platform License scope
   - Evidence Foundation access level
   - Intelligence Object volume (monthly)
   - Audit Trail retention period
3. Domain Packages subscribed
   - List of Domains (Capital Markets / Information Markets / Research / Risk)
   - Capabilities included in each
4. Consumption Methods enabled
   - Surfaces (with seat count)
   - Contracts (with volume)
   - Embeddings (with instance count)
   - Deployments (with model)
   - Channels (with subscription)
   - Workflows (with integrations)
5. Usage terms
   - Base volume included
   - Overage pricing
   - Volume tier commitments
6. SLAs
   - Uptime
   - Latency
   - Object production freshness
   - Audit Trail availability
7. Compliance & Audit
   - Customer's audit rights
   - Data residency
   - Regulatory cooperation
8. IP & Ownership
   - Evidence Foundation = ROUAA property
   - Intelligence Objects produced = licensed to customer
   - Customer data = customer property
9. Term & Termination
   - License duration
   - Termination transition (90-day wind-down)
   - Surviving rights (Audit Trail retention)
10. Pricing & Payment
    - Platform License fee
    - Domain Package fees
    - Usage overage rates
    - Payment terms
```

### 5.2 البنود المحمية قانونيًا

- **"Intelligence Objects are analytical artifacts, not investment advice."** — حماية قانونية أساسية.
- **"Customer is responsible for decisions made using Intelligence Objects."** — نقل المسؤولية القرار.
- **"ROUAA retains ownership of Evidence Foundation and methodology."** — حماية الخندق.
- **"Customer may not resell Intelligence Objects to third parties."** — منع إعادة البيع.

### 5.3 ما الذي يُتفاوض عليه بحسب العميل

| بند | تفاوض عادةً |
|---|---|
| Platform License scope | نعم — بحسب حجم العميل |
| Domain Packages | نعم — يختار العميل |
| Consumption Methods volume | نعم — بحسب الاستخدام |
| Capabilities included | محدود — Capabilities تُباع كحزمة داخل Domain |
| Audit rights | أحيانًا — للمؤسسات التنظيمية |
| Data residency | نعم — للبنوك والسلطات |
| IP & Ownership | لا — بنود محمية |
| SLAs | نعم — بحسب الباقة |

---

## 6. السؤال 5: ما الذي يراه المستثمر مقابل ما يراه المستخدم؟

### 6.1 ثلاث شرائح للجمهور

| الجمهور | ما يهمّه | ما يراه |
|---|---|---|
| **المستثمر (VC/PE/Strategic)** | الخندق، قابلية التوسع، الإيراد المتكرر | Evidence Foundation كـ moat، Domain Packages كـ expansion vector، Platform License كـ recurring revenue |
| **المستخدم المؤسسي (CIO/Risk Officer)** | الحوكمة، التدقيق، الالتزام | Intelligence Objects + Audit Trail، Workflows integration، SLAs |
| **المستخدم النهائي (Analyst/Trader)** | الكفاءة، القرار، السرعة | Surfaces (Terminal, Dashboard)، Channels (Signals, Alerts)، Embeddings (Widgets) |

### 6.2 ما يراه المستثمر فقط

- **Evidence Foundation كأصل استراتيجي** — 411+ مصدر، Knowledge Graph، Audit Trail infrastructure.
- **Domain Packages كمحرك توسع** — إضافة Domain جديد (مثل ESG) = منتج تجاري جديد دون إعادة بناء.
- **Platform License كإيراد متكرر** — 70-80% من الإيراد سنوي متكرر.
- **Usage كمحرّم نمو** — كلما استهلك العميل أكثر، زاد الإيراد دون تكلفة هامشية.
- **الخندق المعرفي** — ليس بناءً تقنيًا، بل تراكم معرفي لا يمكن استنساخه بسرعة.

### 6.3 ما يراه المستخدم المؤسسي فقط

- **Audit Trail لكل Object** — يستطيع إعادة بناء أي قرار بعد سنة.
- **Workflows integration** — Intelligence Objects تدخل في Investment Committee workflow، Compliance workflow، Risk workflow.
- **Compliance reporting** — تقارير دورية لكل Objects المُستهلَكة.
- **Decision governance** — لا قرار بدون Object + Audit.
- **Data residency** — Objects تُحفَظ في الـ jurisdiction المطلوب.

### 6.4 ما يراه المستخدم النهائي فقط

- **Terminal** — يرى Objects كـ surfaces تفاعلية.
- **Signals/Alerts** — يرى Objects كـ channels推送.
- **Widgets** — يرى Objects مدمجة في منصته.
- **API responses** — يرى Objects كـ JSON.
- **لا يرى Evidence Foundation مباشرة** — يثق بها عبر Audit Trail.
- **لا يرى Cognitive Model** — يرى نتائجها فقط.

### 6.5 ما لا يراه أحد (داخلي فقط)

- بنية Source Registry التفصيلية.
- منطق AI Council الداخلي.
- خوارزميات Evidence Graph.
- عمليات Knowledge Maintenance.

هذا هو **التسلسل الهرمي للشفافية**:
- Evidence Foundation: شفاف للمستثمر، شفافية محدودة للمستخدم المؤسسي، مخفي للمستخدم النهائي.
- Intelligence Objects: شفاف للجميع (لكن بعمق متفاوت).
- Cognitive Model: مخفي للجميع، يظهر فقط في Audit Trail.

---

## 7. إعادة هيكلة Domains

### 7.1 الإصلاح الجوهري

في v4 كان عندي 4 Domains متساوية: Media / Research / Risk / Trading.

هذا غير دقيق — لأن المؤسسات الكبرى لا تفكر في Trading فقط، بل في رأس مال أوسع.

### 7.2 الهيكل الجديد: Domain Family + Sub-Domains

```
Domain Families (مظلات تجارية)
│
├── Capital Markets Domain Family
│   ├── Trading Intelligence
│   ├── Portfolio Intelligence
│   └── Risk Intelligence
│
├── Information Markets Domain Family
│   ├── Media Intelligence
│   └── Research Intelligence
│
└── (مستقبلاً)
    ├── ESG Domain Family
    ├── Compliance Domain Family
    └── ...
```

### 7.3 لماذا هذا الهيكل؟

- **Asset Managers / Pension Funds / Banks** لا تشتري "Trading" — تشتري حلول رأس مال شاملة.
- **Capital Markets Domain Family** يجمع Trading + Portfolio + Risk كحزمة منطقية.
- **Information Markets Domain Family** يجمع Media + Research كحزمة معلومات.
- **التسعير على مستوى Domain Family** يبسّط على المؤسسات الكبرى.
- **Sub-Domain Package** للعملاء الذين يحتاجون تخصيصًا أضيق.

### 7.4 خريطة Domains المُحدّثة

| Domain Family | Sub-Domains | أمثلة العملاء |
|---|---|---|
| Capital Markets | Trading Intelligence · Portfolio Intelligence · Risk Intelligence | Brokers · Asset Managers · Prop Firms · Banks · Pension Funds |
| Information Markets | Media Intelligence · Research Intelligence | News Agencies · Publishers · Research Firms · Broadcast Groups |
| (مستقبلاً) ESG | ESG Scoring · Climate Risk · Regulatory Compliance | Sustainability Teams · Compliance Officers · ESG Investors |
| (مستقبلاً) Compliance | AML · Sanctions · Regulatory Reporting | Compliance Officers · Internal Audit · Regulators |

### 7.5 أثر هذا على الموقع

- صفحات Solutions تُنظَّم حسب Domain Families، لا حسب Domains متساوية.
- Trading/Portfolio/Risk تظهر كأشقاء تحت Capital Markets.
- Media/Research تظهر كأشقاء تحت Information Markets.
- إضافة Domain Family جديد (ESG) لا يكسر البنية.

---

## 8. Workflows — Consumption Method السادس

### 8.1 لماذا Workflows طبقة منفصلة؟

المؤسسات لا تشتري وصولًا فقط — تشتري **إدخال الذكاء في العمل**.

مثال:
- صندوق تحوّط لا يريد "API" — يريد Intelligence Objects تدخل في **Investment Committee workflow**.
- بنك لا يريد "Risk Dashboard" — يريد Objects تُغذّي **Compliance workflow** تلقائيًا.
- شركة أبحاث لا يريد "Research API" — يريد Objects تدخل في **Analyst workflow** كـ first draft.

### 8.2 Workflows الافتراضية

| Workflow | أين يُستخدم | ماذا يفعل |
|---|---|---|
| Investment Committee Workflow | Asset Managers, Pension Funds | Objects تُجمَّع في agenda، تُعرض في الاجتماع، تُؤرشف مع القرار |
| Analyst Workflow | Research Firms, Equity Research | Objects كـ first draft، المحلل يراجع ويوسّع، يُنشئ Research Object |
| Compliance Workflow | Banks, Brokers | Objects تُفحَص تلقائيًا للالتزام، تُولّد تقارير compliance |
| Risk Workflow | Risk Desks, Treasuries | Objects تُغذّي risk dashboard، تُطلِق alerts عند الحدود |
| Editorial Workflow | News Agencies | Objects كـ first draft، المحرر يراجع، يُنشئ News Object |
| Approval Workflow | Investment Banks, Brokerages | Objects تنتقل عبر سلسلة موافقات قبل التنفيذ |

### 8.3 Workflows في Matrix

الـ Matrix المُحدَّث:

|  | Surfaces | Contracts | Embeddings | Deployments | Channels | **Workflows** |
|---|---|---|---|---|---|---|
| Capital Markets | Trading Terminal | Trading API | Chart Widget | WL Terminal | Signal Alerts | IC Workflow · Approval Workflow |
| Information Markets | News Portal | News API | News Widget | WL News | Articles · Videos | Editorial Workflow |
| Research | Research Portal | Research API | Research Widget | WL Research | Reports | Analyst Workflow |
| Risk | Risk Dashboard | Risk API | Risk Widget | On-prem Risk | Risk Alerts | Compliance Workflow · Risk Workflow |

### 8.4 لماذا Workflows مهمة تجاريًا؟

- **Enterprise sales** يعتمد عليها — المؤسسات تشتري Workflows، لا أدوات.
- **Lock-in** أقوى — بمجرد دمج Workflows، تكلفة التبديل عالية.
- **Pricing power** أكبر — Workflows تُسعَّر كـ premium add-on.
- **Differentiation** أوضح — المنافسون يبيعون APIs، رؤى تبيع Workflows.

---

## 9. ترتيب سرد index.html (مُقترح)

### 9.1 المبدأ

لا تبدأ index.html بالمعمارية. ابدأ بالوعد.

العميل الذي يصل لأول مرة لا يفهم "Reality → Evidence Foundation → Reasoned Intelligence". يفهم: "ماذا تعطيني؟ ولماذا أثق بك؟"

### 9.2 الترتيب المقترح

```
1. Problem (المشكلة)
   "كل قرار مؤسسي مالي اليوم يُتَّخذ بلا سلسلة دليل كاملة"

2. Promise (الوعد)
   "رؤى تحوّل الواقع المالي إلى Intelligence Objects قابلة للتدقيق"

3. Differentiator (التميّز)
   "Object واحد — تطبيقات متعددة. كل قرار له Audit Trail."

4. Architecture (المعمارية — مختصرة)
   Reality → Evidence Foundation → Reasoned Intelligence →
   Capabilities → Domains → Consumption Methods
   (مع شرح كل طبقة في جملة واحدة)

5. Domains (المجالات)
   Capital Markets Domain Family (Trading · Portfolio · Risk)
   Information Markets Domain Family (Media · Research)

6. Trust (الثقة)
   Evidence Foundation · Audit Trail · Workflows · Compliance
```

### 9.3 ما الذي يجب أن يظهر في Hero؟

```
Every institutional decision has evidence behind it.

ROUAA transforms verified facts into auditable intelligence.

One intelligence object.
Many applications.
```

ثم زر CTA: "Request Briefing"

### 9.4 ما الذي يجب أن يظهر في الـ First Scroll؟

- مشكلة: "القرارات تُتَّخذ بلا أدلة قابلة للتدقيق"
- حل: "Intelligence Objects — كل قرار موثّق"
- تميّز: "Object واحد، تطبيقات متعددة"
- مثال مرئي: ذرة الفيدرالي → 5 تطبيقات

### 9.5 ما الذي يجب ألا يظهر في index.html؟

- تفاصيل Evidence Foundation (في platform.html)
- تفاصيل Capabilities (في catalog.html)
- تفاصيل Domains (في صفحات Domains)
- تفاصيل Consumption Methods (في developers.html)

index.html = الباب. لا الكتاب.

---

## 10. خلاصة نموذج القيمة

### 10.1 في جملة واحدة

> العميل يرخّص Platform + Domain Package + Usage، ويستهلك Intelligence Objects عبر Consumption Methods متعددة، وعقده يحمي Evidence Foundation كخندق دائم لرؤى.

### 10.2 في رسم واحد

```
┌─────────────────────────────────────────────┐
│  Platform License                           │
│  ┌───────────────────────────────────────┐  │
│  │  Evidence Foundation (access)         │  │
│  │  + Intelligence Objects production    │  │
│  │  + Audit Trail                        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  + Domain Package (one or more)             │
│  ┌───────────────────────────────────────┐  │
│  │  Capital Markets / Information / etc. │  │
│  │  includes Capabilities bundle         │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  + Usage (metered)                          │
│  ┌───────────────────────────────────────┐  │
│  │  Surfaces · Contracts · Embeddings    │  │
│  │  Deployments · Channels · Workflows   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Customer consumes:
┌─────────────────────────────────────────────┐
│  Intelligence Objects (via Methods above)   │
│  - Each Object = Claim + Confidence +       │
│    References to Evidence, Reasoning, Audit │
│  - One Object → Many representations        │
└─────────────────────────────────────────────┘

ROUAA retains:
┌─────────────────────────────────────────────┐
│  Evidence Foundation (the moat)             │
│  - Sources, Knowledge Graph, Methodology    │
│  - Never sold, only licensed               │
└─────────────────────────────────────────────┘
```

### 10.3 ما الذي يميّز هذا النموذج؟

| العنصر | التميّز |
|---|---|
| **الوحدة المُرخّصة** | Intelligence Object (وحدة قابلة للتدقيق)، لا "seat" ولا "API call" |
| **الخندق** | Evidence Foundation (لا يُباع)، لا features |
| **التوسع** | Domain Packages (إضافة Domain = منتج جديد بلا إعادة بناء) |
| **Lock-in** | Workflows (تكلفة تبديل عالية) |
| **الإيراد المتكرر** | Platform License (70-80% متكرر سنويًا) |
| **النمو** | Usage overage (يكبر مع استهلاك العميل) |
| **الشفافية** | هرمية (Investor vs Institutional User vs End User vs Internal) |

---

## 11. أسئلة مفتوحة للنقاش

1. **أسماء Domain Families** — هل:
   - "Capital Markets" و "Information Markets" (مُقترح)
   - أو "Investment Intelligence" و "Content Intelligence"
   - أو أسماء أكثر تحديدًا حسب الجمهور؟

2. **هل Portfolio Intelligence Domain منفصل، أم داخل Trading؟** — للـ Asset Managers، Portfolio مستقل. للـ Brokers، مدمج مع Trading.

3. **هل Workflows تُباع كـ add-on، أم مضمّنة في Domain Package؟** — Premium add-on يرفع الـ ARPU، لكن قد يُبطئ البيع الأولي.

4. **هل Platform License يُسعَّر بحجم العميل (tiered)، أم بسعر ثابت + usage؟** — Tiered أبسط للـ SMBs، Flat+usage أنظف للـ Enterprise.

5. **هل نُقدّم "Developer Package" منفصل (للـ fintechs الذين يبنون فوق Evidence Foundation)، أم يُدمج في Platform License؟**

6. **ما الذي يراه المنظِّم (Regulator)؟** — هذا سؤال حرج للبنوك. هل يحصلون على Audit access خاص؟ هل يُصدِر رؤى تقارير تنظيمية؟

---

## 12. الحالة الراهنة والخطوة التالية

### 12.1 ما الذي حسمته هذه الوثيقة

- ✅ ما الذي يشتريه العميل (Platform + Domain + Usage)
- ✅ ما الذي لا يشتريه (Evidence Foundation نفسها، Objects منفردة، البيانات الخام، ميزات)
- ✅ ما الوحدة المُرخّصة (Intelligence Object)
- ✅ ما الذي يدخل في العقد (10 بنود إلزامية + 4 بنود محمية)
- ✅ ما الذي يراه كل جمهور (هرمية الشفافية)
- ✅ Domain Families الجديدة (Capital Markets / Information Markets + مستقبلاً ESG/Compliance)
- ✅ Workflows كـ Consumption Method سادس
- ✅ ترتيب سرد index.html
- ✅ الإصلاح الاسمي (Intelligence Object كوحدة، Node داخلي فقط، Evidence Foundation خارجيًا)

### 12.2 ما الذي ما زال مفتوحًا

- ⬜ التسعير التفصيلي (يحتاج `PRICING-MODEL-v3.md`)
- ⬜ بنود العقد الفعلية (يحتاج `MASTER-SERVICE-AGREEMENT-v1.md`)
- ⬜ متطلبات الامتثال التنظيمي (يحتاج `REGULATORY-FRAMEWORK-v1.md`)
- ⬜ الأسئلة الستة المفتوحة في القسم 11

### 12.3 الخطوات بعد الاعتماد

1. **اعتماد هذه الوثيقة** بعد النقاش.
2. **تحديث INTELLIGENCE-MODEL → v5** لتطبيق:
   - Intelligence Object كاسم للوحدة
   - Evidence Foundation كاسم خارجي للـ Cognitive Model
   - Domain Families الجديدة
   - Workflows كـ Consumption Method سادس
   - تحديث "لا يستطيع العميل إنتاجها" → "التكلفة مقابل القيمة"
3. **إعادة كتابة `index.html`** بالترتيب المُقترح:
   - Problem → Promise → Differentiator → Architecture → Domains → Trust
4. **إعادة بناء `platform.html`** ليصبح "The Intelligence Object Factory" — كيف تُنتَج Objects من Evidence Foundation.
5. **إعادة هيكلة صفحات Solutions** حسب Domain Families.
6. **كتابة `PRICING-MODEL-v3.md`** على أساس Platform + Domain + Usage.

**قبل كل ذلك**: لا يُعدَّل أي HTML حتى تُعتمد هذه الوثيقة + تُحسم الأسئلة المفتوحة الستة.

---

*الإصدار: v1.0 — الطبقة التجارية فوق INTELLIGENCE-MODEL-v4*
*التاريخ: يوليو 2026*
*الحالة: مسودة للنقاش — تفصل النظرية عن الشركة*
