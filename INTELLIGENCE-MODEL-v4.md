# INTELLIGENCE-MODEL-v4

> **الوثيقة الصفرية لتعريف رؤى.**
> مصمّمة لتعيش عشر سنوات — النظرية مستقلة عن التسميات.

> **الإصدار:** v4.0 — بعد المراجعة النقدية الثالثة
> **الإصلاحات الجوهرية عن v3:**
> 1. **الذرة = عقدة بمراجع، لا حاوية** — تشير إلى Evidence و Reasoning و Audit، لا تحتويها
> 2. **فصل 4 شواغل** مستقلة تمامًا: النموذج المعرفي · وحدة القيمة · القدرات · طرق الاستهلاك
> 3. **Capabilities = كتالوج خدمات**، ليست طبقة تأسيسية
> 4. **Trading/Research/Media/Risk = Domains** (مجالات)، لا Systems ولا Experiences
> 5. **طرق الاستهلاك مُصنّفة بطبيعتها** — Surfaces · Contracts · Embeddings · Deployments · Channels
> 6. **النظرية مستقلة عن الاسم** — لو غيّرنا "Atom" غدًا، تبقى النظرية صحيحة

---

## 0. السؤال المؤسس

> **ما أصغر وحدة قيمة تنتجها رؤى ولا يستطيع العميل إنتاجها بنفسه؟**

ليست الأخبار، الإشارات، التقارير، الـ AI، البيانات، أو "البنية التحتية".

**الإجابة:**

> **Reasoned Intelligence — استدلال موثّق**

وحدة قيمة مستقلة، تُنتجها رؤى من تفاعل النموذج المعرفي مع الاستدلال، ولها مراجع (لا محتوى) إلى الأدلة وسلسلة الاستدلال وسجل التدقيق.

كل ما يراه العميل (خبر، إشارة، تقرير، API) هو **تمثيل** لهذه الوحدة.

---

## 1. الفصل التأسيسي: 4 شواغل مستقلة

هذا هو أهم إصلاح عن v3. الخلط بين هذه الشواغل الأربعة كان سبب كل الالتباس.

### 1.1 الشاغل الأول: النموذج المعرفي (ما يوجد داخل النظام داخليًا)

```
Cognitive Model
├── Sources (411+ مصدر رسمي)
├── Documents (وثائق خام)
├── Facts (حقائق مستخرجة)
├── Events (أحداث موثّقة)
├── Entities (كيانات اقتصادية)
├── Relationships (علاقات)
├── Evidence (سلاسل دليل)
└── Audit Trail (سجل كامل)
```

- **داخلي** — العميل لا يراه مباشرة
- **أصل** — لا يُباع، يُرخّص به
- **الخندق** — لا يمكن بناؤه داخليًا في أقل من سنوات

### 1.2 الشاغل الثاني: وحدة القيمة (ما تنتجه رؤى وتُرخّص للعميل)

> **Reasoned Intelligence** — عقدة استدلال مستقلة.

(سابقًا: Intelligence Atom. الاسم قابل للتغيير. النظرية لا تتغير.)

التفصيل في القسم 2.

### 1.3 الشاغل الثالث: قدرات النظام (ما يستطيع فعله بهذه المعرفة)

**كتالوج خدمات** تعمل فوق وحدات القيمة. ليست طبقة تأسيسية.

- Forecasting · Scenario Simulation · Signal Generation
- Risk Scoring · Exposure Analysis · Correlation Discovery
- Narrative Generation · Anomaly Detection · Audit Retrieval

التفصيل في القسم 4.

### 1.4 الشاغل الرابع: طرق الاستهلاك (كيف يصل العميل)

**مُصنّفة بطبيعتها** — ليست كلها "Experience". التفصيل في القسم 6.

| النوع | أمثلة |
|---|---|
| Surfaces | Terminal · Mobile · Dashboard · Report |
| Contracts | REST API · SDK · Webhook · Streaming |
| Embeddings | Widget · Inline Card |
| Deployments | White Label · On-prem · Private Cloud |
| Channels | News · Newsletter · Video · Audio |

### 1.5 العلاقة بين الشواغل الأربعة

**هي متعامدة (orthogonal) — لا متتابعة.**

```
    النموذج المعرفي (داخلي)
           │
           │ يُنتج
           ↓
    وحدة القيمة (Reasoned Intelligence)
           │
           │ تُستهلك عبر
           ↓
    ┌──────┴──────┐
    │             │
   قدرات      طرق الاستهلاك
  (خدمات)     (وصول)
    │             │
    └──────┬──────┘
           │
      تُنظَّم في
           │
       Domains
  (Trading · Research · Risk · Media)
```

كل Domain = (وحدات قيمة ذات صلة) + (قدرات محددة) + (طرق استهلاك محددة).

**الإضافة سهلة:** Domain جديد (مثل ESG) = تركيب جديد من نفس المكونات، لا System جديد.

---

## 2. وحدة القيمة — Reasoned Intelligence

### 2.1 الإصلاح الجوهري عن v3

في v3 جعلتُ الذرة **حاوية** تملك بداخلها: Claim + Evidence + Reasoning + Confidence + Audit.

هذا جعلها monolith — لو تغيّر دليل واحد، تتغير الذرة. لو جاء analyst جديد، تتغير الذرة. هذا غير مستقر.

**الإصلاح في v4:**

> وحدة القيمة **عقدة بمراجع** (node with references) — تشير إلى Evidence و Reasoning و Audit، لا تحتويها.

```
┌─────────────────────────────┐
│     Reasoned Intelligence    │
│                              │
│  • Claim (الادعاء)           │
│  • Confidence (درجة الثقة)   │
│  • References (مراجع):       │
│    → Evidence Chain ID       │
│    → Reasoning Chain ID      │
│    → Audit Trail ID          │
│    → Source IDs              │
│  • Lifecycle (دورة الحياة)   │
└─────────────────────────────┘
```

### 2.2 لماذا هذا أفضل؟

| v3 (حاوية) | v4 (عقدة بمراجع) |
|---|---|
| لو تغيّر دليل، تتغير الذرة | الذرة مستقرة — تُحدَّث مراجعها |
| تخزين مكرر | مرجع واحد فقط |
| لا يمكن إعادة استخدام Evidence في ذرات أخرى | Evidence قابلة للمشاركة بين ذرات |
| الذرة ضخمة | الذرة صغيرة |
| Audit داخل الذرة | Audit منفصل، الذرة تشير إليه |

### 2.3 الخصائص

- **غير قابلة للتجزئة كوحدة قيمة** — Claim + Confidence + References = أصغر وحدة يمكن ترخيصها
- **مراجع، لا محتوى** — الذرة لا تتضخم؛ الأدلة والاستدلال منفصلان
- **مستقرة** — هوية الذرة لا تتغير بتحديث الأدلة
- **قابلة للتركيب** — ذرات → تمثيلات (خبر، إشارة، تقرير، API)
- **لها دورة حياة** — تُولد، تُحدَّث، تُؤرشف. لا تُحذف
- **مُرخّصة** — العميل يدفع مقابل الوصول إليها، لا مقابل "منتج"

### 2.4 مثال: ذرة واحدة، عدة تمثيلات

ذرة عن قرار الفيدرالي برفع الفائدة:

```
Reasoned Intelligence Node
─────────────────────────────
Claim: "قرار الفيدرالي يزيد الضغط على البنوك الإقليمية
        ذات التعرّض العالي للـ CRE"
Confidence: 74% (capped)
References:
  → evidence_chain_84291 (FOMC statement + CRE data + 12 bank filings)
  → reasoning_chain_50128 (Macro + Risk + Sector + Bull/Bear)
  → audit_trail_2026-07-28-1432
  → sources: federalreserve.gov · SEC filings · BLS
Lifecycle: born 2026-07-28 14:32 · updated 2026-07-29 09:30
```

هذه الذرة الواحدة تُمثَّل كـ:

| التمثيل | كيف |
|---|---|
| News article | العنوان + قصة + رابط للذرة |
| Trading signal | SHORT Regional Bank ETF, 74% confidence, ref: atom_id |
| Risk alert | 4 banks in portfolio exposed, ref: atom_id |
| Research report section | تحليل موسّع + citation للذرة |
| API response | `{claim, confidence, evidence_ref, reasoning_ref, audit_ref}` |
| Widget | بطاقة alert + ref للذرة |
| White-label | كل ما سبق بعلامة العميل |

**كل تمثيل يحمّل الذرة، لا يُنشئ ذرة جديدة.** هذا هو الإنجاز المعماري.

### 2.5 لماذا لا يستطيع العميل إنتاجها؟

| المكوّن | ما يحتاجه العميل ليبنيه بنفسه |
|---|---|
| Claim | محللون — يستطيع |
| Confidence | منهجية مُحوكَمة — نادر |
| Evidence Chain (ref) | Source Registry (411+ مصدر) + فريق استخراج — سنوات |
| Reasoning Chain (ref) | LLM — يستطيع، لكن بدون Evidence يكون تكهنًا |
| Audit Trail (ref) | بنية مخصصة — مكلف |

**العقدة ككل** لا يمكن بناؤها داخليًا بسرعة — ليس لأن المكوّنات صعبة، بل لأن **ربطها معًا كمراجع في عقدة مستقرة موثّقة** هو ما يستغرق سنوات.

---

## 3. الطبقات التأسيسية الثلاث (النظرية المستقرة)

هذه الطبقات الثلاث هي **النظرية**. تبقى صحيحة حتى لو غيّرنا كل التسميات.

```
Reality (الواقع)
  الفيدرالي · الأسواق · الشركات · الأحداث · الجيوسياسة
       ↕  (يرصد)
Cognitive Model (النموذج المعرفي)
  ما تعرفه رؤى — Sources · Documents · Facts · Events ·
  Entities · Relationships · Evidence · Audit
       ↕  (ينتج)
Reasoned Intelligence (وحدة القيمة)
  عقد استدلال مستقلة بمراجع إلى Evidence و Reasoning و Audit
```

**ما فوق هذه الطبقات الثلاث ليس تأسيسيًا:**
- Capabilities = خدمات تُطبَّق على الذكاء (كتالوج)
- Domains = سياقات تنظيمية (Trading, Research, Risk, Media)
- Consumption Methods = طرق وصول (Surfaces, Contracts, Embeddings, ...)

هذا الفصل يضمن: لو أضفنا Domain جديدًا (ESG) أو طريقة استهلاك جديدة (Streaming SDK) — **النظرية لا تتغير**.

---

## 4. Knowledge ↔ Reasoning = حلقة

### 4.1 ليست مرحلتين

```
        Knowledge                  Reasoning
       (ما نعرفه)                (ما نستنتجه)
            ↕                          ↕
            └──────────↺──────────────┘
                       ↕
              Reasoned Intelligence
                  (الناتج)
```

- **Knowledge يُغذّي Reasoning** — لا يمكن أن تستدلّ على ما لا تعرفه
- **Reasoning يُغذّي Knowledge** — كل ذرة جديدة تُضاف إلى Knowledge
- **الذرات تُنتج في لحظة تفاعلهما** — لا قبل، لا بعد

### 4.2 الوظائف داخل الحلقة (لا تسمّى "محركات منفصلة")

| الوظيفة | ماذا تفعل |
|---|---|
| Acquisition | يجمع Reality → يبني Knowledge |
| Knowledge Maintenance | يتحقق، يربط، يحدّث Knowledge |
| Reasoning | يستدلّ، يولّد Claims، يحوكِم (AI Council) |
| Feedback | يراقب النتائج، يصحّح، يغلق الحلقة |

هذه وظائف متزامنة داخل الحلقة، لا مراحل متعاقبة.

---

## 5. Capabilities = كتالوج خدمات، ليست طبقة

### 5.1 لماذا Capabilities ليست طبقة؟

في v3 جعلتُ Capabilities طبقة بين Intelligence و Experiences. هذا خطأ — لأن:

- Forecasting ليس طبقة — هو خدمة
- Correlation Discovery ليس طبقة — هو خدمة
- Signal Generation ليس طبقة — هو خدمة

**الخدمات لا تُرسم كطبقات — تُدرَج في كتالوج.**

### 5.2 كتالوج Capabilities

| Capability | ماذا تفعل بالذرات |
|---|---|
| Signal Generation | ذرات + سياق محفظة → إشارة |
| Scenario Simulation | ذرات + افتراضات → سيناريو |
| Risk Scoring | ذرات + محفظة → درجة مخاطر |
| Narrative Generation | ذرات متعددة → قصة |
| Forecasting | ذرات تاريخية → احتمالات |
| Correlation Discovery | ذرات متعددة → علاقات |
| Exposure Analysis | ذرات + محفظة → تعرّض |
| Anomaly Detection | ذرات متعددة → شذوذ |
| Audit Retrieval | ذرة → Audit Trail |
| Decision Reconstruction | قرار قديم → كيف وصلنا إليه |

### 5.3 خصائص الكتالوج

- **قابلة للتركيب** — Capability يمكن أن تستدعي Capability أخرى
- **قابلة للإضافة** — Capability جديدة لا تغيّر النظرية
- **قابلة للترخيص** — العميل يدفع مقابل Capabilities التي يفعّلها
- **مستقلة عن Domains** — نفس Capability تعمل عبر Domains متعددة

---

## 6. Domains = سياقات، لا Systems ولا Experiences

### 6.1 الإصلاح الجوهري

في v2 سمّيتُ Trading/Research/Risk/Media **Systems**. في v3 سمّيتُها **Experiences**. كلاهما خطأ.

- **Systems** لا يصمد — لو أضفنا ESG/Compliance/Macro، نصبح 7 Systems، 8...
- **Experiences** خاطئ — لأن API و Widget و White Label ليست Experiences

**الصحيح:** Trading/Research/Risk/Media هي **Domains** — مجالات عمل.

### 6.2 ما هو الـ Domain؟

Domain = **سياق تنظيمي** يحدد:
- أي الذرات تهمّه (Events من نوع معيّن، Entities من قطاع معيّن)
- أي Capabilities يستخدمها
- أي Consumption Methods يقدمها لجمهوره

### 6.3 Domains الحالية

| Domain | يهتم بـ | يستخدم Capabilities | يقدّم عبر |
|---|---|---|---|
| Media Intelligence | Events, Facts, Entities | Narrative Generation, Forecasting | News Channels, Reports, Videos, News API |
| Research Intelligence | Entities, Relationships, Scenarios | Scenario Simulation, Correlation Discovery | Strategic Research, Equity Analysis, Sector Reports |
| Risk Intelligence | Events, Entities, Scenarios | Risk Scoring, Exposure Analysis, Anomaly Detection | Risk Dashboards, Exposure Analytics, Compliance APIs |
| Trading Intelligence | Events, Scenarios, Decisions | Signal Generation, Risk Scoring, Execution Orchestration | Trading Terminal, Signals, Executors, Trading APIs |

### 6.4 Domains غير متساوية (إرث من v2)

- Media: مستقل
- Research: مستقل
- Risk: يستهلك Events من النموذج المعرفي
- **Trading يستهلك مخرجات Research و Risk و Media** — الأعلى تعقيدًا

### 6.5 الإضافة سهلة

لو أضفنا **ESG** غدًا:
- لا نبني System جديد
- نحدّد: أي الذرات تهمّ ESG (Entities + environmental events + regulatory filings)
- نحدّد: أي Capabilities (ESG Scoring — يُشتق من Risk Scoring)
- نحدّد: أي Consumption Methods (ESG Dashboard, ESG API, ESG Report)
- الـ Domain الجديد = تركيب جديد من نفس المكونات

هذا يحلّ مشكلة v2 و v3 — النظرية لا تتغيّر بإضافة Domain.

---

## 7. Consumption Methods — مُصنّفة بطبيعتها

### 7.1 الإصلاح الجوهري

في v3 وضعتُ News و API و Widget و White Label تحت كلمة "Experience" واحدة. هذا خطأ — لأنها طبيعتها مختلفة:

- API ليست تجربة — **عقد برمجي** (Contract)
- Widget ليست تجربة — **واجهة مدمجة** (Embedding)
- White Label ليست تجربة — **نموذج نشر** (Deployment)
- Terminal تجربة — **سطح تفاعلي** (Surface)
- News محتوى — **قناة توصيل** (Channel)

### 7.2 التصنيف الصحيح

| الفئة | الوصف | أمثلة |
|---|---|---|
| **Surfaces** | سطوح تفاعلية يراها المستخدم | Terminal · Mobile · Dashboard · Report Viewer |
| **Contracts** | عقود برمجية للوصول الآلي | REST API · SDK · Webhook · Streaming · GraphQL |
| **Embeddings** | واجهات مدمجة في منصات العميل | Widgets · Inline Cards · Embedded Charts |
| **Deployments** | نماذج نشر | White Label · On-prem · Private Cloud · Hybrid |
| **Channels** | قنوات توصيل محتوى | News Articles · Newsletters · Videos · Audio · Alerts |

### 7.3 Domains × Consumption Methods = Matrix

كل Domain يقدّم Consumption Methods من أنواع مختلفة:

|  | Surfaces | Contracts | Embeddings | Deployments | Channels |
|---|---|---|---|---|---|
| **Media** | News Portal | News API | News Widget | White-label News | Articles · Videos |
| **Research** | Research Portal | Research API | Research Widget | White-label Research | Reports · Newsletters |
| **Risk** | Risk Dashboard | Risk API | Risk Widget | On-prem Risk | Risk Alerts |
| **Trading** | Trading Terminal | Trading API | Chart Widget | White-label Terminal | Signal Alerts |

هذه الـ Matrix هي خريطة طرق الاستهلاك الكاملة. كل خلية = طريقة محددة للوصول إلى Reasoned Intelligence في Domain معين.

### 7.4 لماذا هذا أفضل من "Experiences"؟

- **دقيق** — كل نوع له طبيعته القانونية والتجارية والهندسية
- **قابل للتوسعة** — إضافة Streaming كـ Contract جديد لا يخلخل التصنيف
- **مرتبط بنموذج التسعير** — كل نوع له نموذج تسعير مختلف (per API call, per widget embed, per white-label instance)
- **مرتبط بنموذج الترخيص** — Contracts تتطلب Agreement مختلف عن Surfaces

---

## 8. ما هي رؤى؟ (التعريف النهائي)

### 8.1 التعريف القصير

> **رؤى = نظام يُنتج Reasoned Intelligence — عقد استدلال مستقلة بمراجع إلى Evidence و Reasoning و Audit، تُستهلك عبر Capabilities و Domains و Consumption Methods متعددة.**

### 8.2 التعريف التشغيلي

رؤى ليست:
- منصة تداول، موقع أخبار، شركة أبحاث
- بنية تحتية (Infrastructure = طريقة بناء، لا منتج)
- قاعدة بيانات (Knowledge Graph = أصل داخلي، لا منتج)
- AI (LLM = أداة، لا قيمة)
- "Systems متعددة" (يصمد حتى 4، لا 10)
- "Experiences" (API و Widget و White Label ليست Experiences)

رؤى هي:
- نظام يُنتج **عقد استدلال موثّقة**
- كل عقدة مراجعها مستقلة (تتطور دون أن تتغير هويتها)
- كل عقدة قابلة للتمثيل بعدد لا نهائي من الطرق
- العميل يرخّص **وصولاً إلى العقد** + **القدرات** + **الـ Domains** + **طرق الاستهلاك**

### 8.3 النظرية مستقلة عن الاسم

لو غيّرنا "Reasoned Intelligence" غدًا إلى:
- Verified Claim
- Traceable Insight
- Intelligence Article
- Verdict
- Judgment
- أو أي اسم آخر

**النظرية تبقى صحيحة.** النظرية لا تُبنى حول اسم — تُبنى حول:
1. فصل النموذج المعرفي عن وحدة القيمة
2. وحدة القيمة = عقدة بمراجع، لا حاوية
3. Knowledge ↔ Reasoning حلقة
4. Capabilities = كتالوج، لا طبقة
5. Domains = سياقات، لا أنظمة
6. Consumption Methods مُصنّفة بطبيعتها

هذه المبادئ الستة تبقى صحيحة بأي تسمية.

---

## 9. ما هي رؤى NOT

| ليست | لماذا |
|---|---|
| SaaS Tool | SaaS يبيع ميزة. رؤى تبيع وصولاً إلى Reasoned Intelligence |
| AI Platform | AI أداة. رؤى تنتج ذكاءً موثّقًا، AI واحد من أدواتها |
| Data Provider | البيانات خام. رؤى تنتج عقد استدلال مُسنَدة بالأدلة |
| Bloomberg | Bloomberg يبيع وصولاً إلى بيانات + Terminal. رؤى تنتج عقد استدلال تُستهلك بأي شكل |
| Multi-product Company | رؤى تنتج وحدة قيمة واحدة (Reasoned Intelligence)، كل "منتج" هو طريقة استهلاك |
| "Intelligence Platform" | مصطلح عام لا يعني شيئًا. رؤى تعريف جديد للذكاء المؤسسي |

---

## 10. ما الذي يعنيه هذا للمعمارية الحالية للموقع

### 10.1 التعارضات مع الحالة الحالية:

**1. الـ 8 طبقات في trading page (v19) خاطئة جذريًا.**

**الحل:** trading page لا يحتاج طبقات. يحتاج:
- Domain framing: "Trading Intelligence — أحد Domains رؤى"
- أي Capabilities يستخدم: Signal Generation, Risk Scoring, Execution Orchestration
- أي Consumption Methods يقدّم: Trading Terminal, Trading API, Chart Widget, White-label Terminal

**2. "Operating Layer" / "Financial Intelligence Operating Layer" — يجب أن يختفي.**

**الحل:** الاسم الأعلى لرؤى = **Reasoned Intelligence** أو اسم آخر يُحسم في الأسئلة المفتوحة.

**3. كل صفحة solution ليست System ولا Experience — بل Domain.**

**الحل:** كل صفحة تبدأ بـ framing: "Domain من Domains رؤى — يستهلك Reasoned Intelligence عبر Capabilities محددة ويقدّمها عبر Consumption Methods محددة".

**4. catalog.html يعرض 44 "Product" — يجب reframing.**

**الحل:** catalog.html يعرض:
- Reasoned Intelligence (المفهوم)
- Capabilities (كتالوج الخدمات)
- Domains × Consumption Methods Matrix (خريطة الوصول)

**5. platform.html يجب أن يصبح "How Reasoned Intelligence is Produced" — النموذج المعرفي + الحلقة.**

### 10.2 خريطة الموقع المُحدّثة:

| الصفحة | تمثّل في النموذج | الموضوع |
|---|---|---|
| `index.html` | رؤى (umbrella) | Reasoned Intelligence + 4 شواغل + Domains Matrix |
| `platform.html` | النموذج المعرفي + الحلقة | كيف تُنتج Reasoned Intelligence |
| `products-architecture.html` | تفصيل النموذج المعرفي | Sources, Evidence, Knowledge Graph |
| `catalog.html` | Capabilities + Matrix | كتالوج الخدمات + خريطة الاستهلاك |
| `media-technologies.html` | Media Domain | Capabilities + Consumption Methods لـ Media |
| `trading-technologies.html` | Trading Domain | Capabilities + Consumption Methods لـ Trading |
| `enterprise.html` | Research Domain | Capabilities + Consumption Methods لـ Research |
| `risk-intelligence.html` | Risk Domain | Capabilities + Consumption Methods لـ Risk |
| `developers.html` | Contracts + Embeddings | APIs, SDKs, Widgets, Webhooks |
| `trust.html` | Audit + Reasoned Intelligence | لماذا تثق؟ كل عقدة موثّقة |
| `company.html` | الـ Story | لماذا وُجدت رؤى؟ الـ Manifesto |

---

## 11. المبادئ المؤسسة (Non-Negotiable Principles)

كل ما يُبنى في رؤى يجب أن يحترم هذه المبادئ:

1. **فصل الشواغل الأربعة** — النموذج المعرفي ≠ وحدة القيمة ≠ Capabilities ≠ Consumption Methods. لا تخلط بينها.

2. **وحدة القيمة = عقدة بمراجع، لا حاوية** — Reasoned Intelligence تشير إلى Evidence و Reasoning و Audit، لا تحتويها.

3. **الطبقات التأسيسية الثلاث** — Reality → Cognitive Model → Reasoned Intelligence. ما فوقها ليس تأسيسيًا.

4. **Knowledge ↔ Reasoning حلقة** — متزامنتان، لا متعاقبتان.

5. **Capabilities = كتالوج خدمات**، ليست طبقة. قابلة للإضافة دون تغيير النظرية.

6. **Domains = سياقات تنظيمية**، لا Systems ولا Experiences. إضافة Domain جديدة = تركيب جديد من نفس المكونات.

7. **Consumption Methods مُصنّفة بطبيعتها** — Surfaces, Contracts, Embeddings, Deployments, Channels. ليست كلها "Experiences".

8. **عقدة واحدة، تمثيلات متعددة** — خبر، إشارة، تقرير، API — كلها تمثيلات لنفس Reasoned Intelligence.

9. **Evidence أول** — لا ذكاء بلا دليل. كل عقدة تحمل مراجعها إلى Evidence.

10. **Audit ليس ميزة** — Audit مرجع مطلوب في كل عقدة. بدون Audit، لا توجد عقدة.

11. **النظرية مستقلة عن الاسم** — المبادئ العشرة السابقة تبقى صحيحة بأي تسمية.

---

## 12. أسئلة مفتوحة للنقاش

1. **اسم وحدة القيمة** — Reasoned Intelligence أم:
   - Verified Claim
   - Traceable Insight
   - Intelligence Article
   - Verdict
   - Judgment
   - أو اسم آخر
   
   (النظرية لا تتغير بالاسم، لكن الاسم يؤثر على الخطاب التسويقي.)

2. **الاسم الأعلى لرؤى** — ماذا نقول عندما يسأل أحدهم "ما هي رؤى؟":
   - "Reasoned Intelligence System"
   - "Intelligence Production System"
   - "Financial Intelligence Foundry"
   - أو لا نحتاج اسمًا فوق "رؤى" — يكفي أن نقول: "رؤى تنتج Reasoned Intelligence"

3. **هل نُظهر وحدة القيمة للعميل مباشرة؟** — هل يرى العميل "Reasoned Intelligence Node #12345" ككيان، أم يراها فقط من خلال تمثيلاتها؟ (أرى أن العميل المؤسسي يحتاج رؤيتها — هذا ما يميّز رؤى. لكن قد يربك العميل العادي.)

4. **التسعير على أساس الشواغل الأربعة؟** — نموذج محتمل:
   - Base License: وصول إلى النموذج المعرفي (Knowledge + Evidence)
   - Atom Volume: عدد العقد المُنتَجة شهريًا
   - Capabilities Used: أي Capabilities تفعّل
   - Domains Subscribed: أي Domains تشتري
   - Consumption Methods: أي طرق استهلاك تستخدم
   
   يستحق وثيقة منفصلة (`PRICING-MODEL-v3.md`).

5. **هل Domains تحتاج أسماء موحّدة؟** — حاليًا "Media Intelligence" / "Trading Intelligence" / "Research Intelligence" / "Risk Intelligence". هل نُبقي هذا النمط؟ أم:
   - "Media Domain" / "Trading Domain" / ...
   - أو فقط "Media" / "Trading" / ...

6. **هل نُبقي "Developers" كصفحة منفصلة، أم ندمجها؟** — Developers تشمل Contracts + Embeddings. هل تستحق صفحة مستقلة، أم تُوزَّع على صفحات Domains؟

---

## 13. الحالة الراهنة والخطوة التالية

### ما تغيّر عن v3:

| v3 | v4 |
|---|---|
| الذرة = حاوية تملك Evidence + Reasoning + Audit | الذرة = **عقدة بمراجع**، تشير إليها لا تحتويها |
| 5 طبقات: Reality → Knowledge → Intelligence → Capabilities → Experiences | 3 طبقات تأسيسية (Reality → Cognitive Model → Reasoned Intelligence) + 4 شواغل متعامدة |
| Capabilities = طبقة | Capabilities = **كتالوج خدمات** |
| Trading/Research/Media/Risk = Experiences | Trading/Research/Media/Risk = **Domains** |
| API/Widget/White Label = Experiences | مُصنّفة بطبيعتها: **Surfaces · Contracts · Embeddings · Deployments · Channels** |
| النظرية مبنية حول اسم "Atom" | **النظرية مستقلة عن الاسم** — المبادئ تبقى صحيحة بأي تسمية |
| يصف كيف يعمل النظام | يصف **ما هو النظام** + يفصل الشواغل بوضوح |

### الخطوات بعد الاعتماد:

1. **اعتماد الوثيقة** بعد النقاش — خصوصًا حول:
   - اسم وحدة القيمة (Reasoned Intelligence أم غيره)
   - الاسم الأعلى لرؤى
   - هل تُعرض وحدة القيمة للعميل مباشرة؟

2. **إعادة كتابة `index.html`** ليصبح أول تجسيد للنموذج:
   - Hero: "رؤى تنتج Reasoned Intelligence"
   - 4 شاغل منفصلة
   - مثال: عقدة واحدة، عدة تمثيلات
   - Domains × Consumption Methods Matrix

3. **إعادة بناء `platform.html`** ليصبح "How Reasoned Intelligence is Produced" — النموذج المعرفي + الحلقة

4. **تحديث trading-technologies.html** — يصبح "Trading Domain"، يوضح:
   - أي Capabilities يستخدم
   - أي Consumption Methods يقدّم
   - كلها تستهلك نفس Reasoned Intelligence

5. **تحديث بقية صفحات Domains** بنفس الـ framing

6. **تحديث `catalog.html`** ليعرض Capabilities + Matrix، لا Products

7. **إعادة بناء `trust.html`** على Audit كأحد مراجع العقدة

8. **كتابة `PRICING-MODEL-v3.md`** على أساس الشواغل الأربعة

**قبل كل ذلك**: لا يُعدَّل أي HTML حتى تُعتمد هذه الوثيقة — خصوصًا القرارات في الأسئلة المفتوحة الستة.

---

*الإصدار: v4.0 — بعد المراجعة النقدية الثالثة*
*التاريخ: يوليو 2026*
*الحالة: مسودة محسّنة للنقاش — مُصمّمة لتعيش عشر سنوات*
