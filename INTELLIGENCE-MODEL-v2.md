# INTELLIGENCE-MODEL-v2

> **الوثيقة الصفرية لتعريف رؤى.**
> كل ما بعدها — صفحات، منتجات، تسعير، خطاب — يجب أن يُشتق من هنا.
> إن تعارض شيء مع هذه الوثيقة، فالخطأ في الشيء لا في الوثيقة.

> **الإصدار:** v2.0 — بعد مراجعة v1
> **التغيير الأساسي عن v1:**
> 1. فصل صريح بين: ما تملكه رؤى (Knowledge Infrastructure) · ما تشغّله (Reasoning Infrastructure) · ما تنتجه (Evidence-backed Intelligence).
> 2. الـ "Engine" الواحد أصبح ثلاثة محركات تشغيلية: Acquisition · Knowledge · Reasoning.
> 3. "Knowledge Model" أُعيدت تسميتها إلى **Financial Intelligence Graph** (كيان حيّ يتغير كل دقيقة، ليس schema).
> 4. **Systems ليست متساوية** — هناك اعتماد متبادل (Trading يحتاج Research و Risk).
> 5. Access Layer أُعيدت كـ **Delivery Layer** أسفل Systems، وليست طبقة موازية.
> 6. "Products" → **Intelligence Capabilities + Delivery Formats**.
> 7. الـ Pipeline أصبح **Loop** (Acquire → Understand → Reason → Deliver → Observe → Learn → Improve ↺).

---

## 0. السؤال المؤسس

> **ما هو الشيء الوحيد الذي تنتجه رؤى ولا يستطيع الآخرون إنتاجه؟**

ليست الأخبار — هناك رويترز وبلومبرغ.
ليست الإشارات — هناك عشرات منصات الإشارات.
ليست التقارير — هناك FactSet و S&P Global.
ليست الـ AI — هناك OpenAI و Anthropic وكل بنك استثماري يبني نماذجه.
ليست البيانات — هناك Refinitiv و ICE.

**الإجابة:**

> **Evidence-backed institutional intelligence.**

ذكاء مؤسسي مُسنَد بالأدلة — يربط الحدث بحقيقته، بحقائقه بأدلته، بأدلته بتحليله، بتحليله بقراره، وكل خطوة موثّقة وقابلة للتدقيق.

هذا هو **الناتج**. كل ما عداه (أخبار، إشارات، تقارير، APIs) هو **تمثيل** لهذا الناتج، ليس منتجاً مستقلاً.

---

## 1. الفصل التأسيسي: ما تملكه ≠ ما تشغّله ≠ ما تنتجه

هذا الفصل هو أهم إصلاح عن v1. الخلط بين الثلاثة كان سبب الالتباس.

### 1.1 ما تملكه رؤى (Knowledge Infrastructure)

الأصل. لا يُبنى في يوم. لا يُستنسخ بسرعة.

```
Knowledge Infrastructure
├── Source Registry (411+ مصدر رسمي مُسجّل ومنظَّم)
├── Document Pipeline (آلاف الوثائق اليومية)
├── Evidence Graph (ربط الحقائق بالأدلة بالمصادر)
├── Knowledge Graph (Entities + Relationships)
├── Audit Trail (سجل كامل لكل تغيير)
└── Governance Framework (سياسات التحقق، التصنيف، الثقة)
```

**هذا هو الخندق.** لا يمكن لأي مؤسسة بناء Source Registry + Evidence Graph داخلياً في أقل من سنوات.

### 1.2 ما تشغّله رؤى (Reasoning Infrastructure)

العمليات التي تحوّل الأصل إلى ذكاء. ثلاثة محركات تشغيلية:

```
Acquisition Engine   — يبني المعرفة (يجمع، يصنّف، يستخرج، يربط)
Knowledge Engine     — يحافظ عليها (يتحقق، يحدّث، يترابط، يحفظ Provenance)
Reasoning Engine     — يستخدمها (يستدل، يقيّم، يحوكِم القرارات، يولّد السيناريوهات)
```

ليست محركاً واحداً — بل ثلاثة، كلٌّ بدوره. (التفصيل في القسم 3.)

### 1.3 ما تنتجه رؤى (Evidence-backed Intelligence)

الناتج. ليس Records. ليس Items. بل **كيانات معرفية مُسنَدة بالأدلة**:

```
Events        — أحداث موثّقة
Decisions     — قرارات موثّقة بسلسلة دليل
Signals       — فرص موثّقة بدرجة ثقة وسياق مخاطر
Scenarios     — سيناريوهات موثّقة باحتمالات وأدلة
```

### 1.4 ما يستهلكه العميل (Representations / Delivery Formats)

ليست منتجات — بل **طرق تقديم** لنفس الناتج:

```
News · Reports · Strategic Research · Trading Signals ·
Videos · Infographics · GeoPolitical Monitor ·
APIs · SDKs · Widgets · White-label Platforms · Dashboards · Terminal
```

### 1.5 الرسم التخطيطي للفصل

```
ROUAA owns            → Knowledge Infrastructure
                              ↓
ROUAA operates        → Reasoning Infrastructure
                              ↓
ROUAA produces        → Evidence-backed Intelligence
                              ↓
Customers consume     → Representations (Delivery Formats)
```

**المبدأ:** لا تخلط بين الأصل والناتج. الأصل لا يُباع، يُرخَّص به. الناتج لا يُباع كمنتج، يُستهلك كتمثيل.

---

## 2. المبدأ: من الداخل إلى الخارج + Loop وليس Pipeline

### 2.1 المحور الداخلي (Inside-Out)

المعمارية تُرسم من نقطة التوليد إلى نقطة التسليم، لا من الأعلى إلى الأسفل:

```
Truth (المصدر الرسمي)
   ↓
Evidence (الاستدلال من المصدر)
   ↓
Knowledge (المعرفة المترابطة)
   ↓
Reasoning (الاستدلال متعدد الأدوار)
   ↓
Decision (القرار الموثّق)
   ↓
Delivery (التسليم عبر قنوات متعددة)
```

### 2.2 لكن هذا ليس Pipeline — بل Loop

الـ Pipeline ينهي عمله عند Delivery. رؤى لا تنتهي — تتعلّم.

```
Acquire
   ↓
Understand
   ↓
Reason
   ↓
Deliver
   ↓
Observe (مراقبة ما حدث بعد القرار)
   ↓
Learn (ما الذي نجح؟ ما الذي فشل؟)
   ↓
Improve (تحديث النموذج، درجات الثقة، الـ Workflows)
   ↺ تعود إلى Acquire
```

**هذا يجعل رؤى Infrastructure مستمرة، لا محركاً ينتهي عند إنتاج القرار.**

الـ Loop يحتوي على طبقة مفقودة في v1:
- **Monitoring** — مراقبة ما بعد القرار
- **Feedback** — جمع النتائج
- **Learning** — تحديث درجات الثقة والسيناريوهات
- **Validation** — التحقق من دقة التوقعات السابقة
- **Model Governance** — مراجعة أداء الـ AI Council وتحديثه

---

## 3. ثلاثة محركات تشغيلية، لا محرك واحد

### 3.1 Acquisition Engine — يبني المعرفة

```
المُدخلات: مصادر رسمية، بيانات اقتصادية، وثائق شركات، أخبار، أحداث جيوسياسية
العمليات:  جمع → تصنيف → استخراج حقائق → ربط بأدلة → تسجيل Provenance
المُخرجات: Facts, Documents, Events مسجّلة في الـ Graph
```

**وظيفته:** تحويل العالم إلى معرفة موثّقة قابلة للاستخدام.

### 3.2 Knowledge Engine — يحافظ على المعرفة

```
المُدخلات: ما أنتجه Acquisition Engine
العمليات:  تحقيق الاتساق → اكتشاف التناقضات → ربط العلاقات الجديدة →
           تحديث الكيانات القائمة → الحفاظ على الـ Audit Trail
المُخرجات: Knowledge Graph متنامٍ، متحقق منه، حيّ
```

**وظيفته:** ضمان أن المعرفة لا تتعفّن. كل كيان يُحدَّث، يُربط، يُتأكَّد منه.

### 3.3 Reasoning Engine — يستخدم المعرفة

```
المُدخلات: Knowledge Graph + طلب استدلال (سؤال، حدث، فرصة، خطر)
العمليات:  استدلال متعدد الأدوار → معارضة داخلية (AI Council) →
           تقييم مخاطر → توليد سيناريوهات → حوكمة القرار
المُخرجات: Decisions, Signals, Scenarios مُسنَدة بالأدلة
```

**وظيفته:** تحويل المعرفة إلى قرارات موثّقة. هنا يعيش الـ AI Council.

### 3.4 العلاقة بين المحركات الثلاثة

```
   Acquisition Engine (يبني)
            ↓
   Knowledge Engine (يحافظ)
            ↓
   Reasoning Engine (يستخدم)
            ↓
   Observe → Learn → Improve
            ↺ تغذّي المحركات الثلاثة جميعاً
```

هذا التفصيل يحلّ مشكلة v1 حيث بدا الـ Engine كصندوق أسود واحد. الآن العميل يفهم: رؤى تبني معرفة، تحافظ عليها، تستخدمها، تتعلّم منها.

---

## 4. Financial Intelligence Graph (ليس Knowledge Model)

### 4.1 لماذا Graph وليس Model؟

"Model" توحي بأنها Schema جامدة — جدول، علاقة، حقل.
الواقع: ما تملكه رؤى **شبكة حيّة تتغير كل دقيقة** — Source يُضاف، Fact يُحدَّث، Event يُكتشف، Relationship تُستنتج، Scenario يُعاد بناؤه.

**الاسم الأدق:** **Financial Intelligence Graph** — رسم معرفي مالي حيّ.

### 4.2 الكيانات المعرفية (Domain Objects) داخل الـ Graph

| الكيان | التعريف | دورة الحياة |
|---|---|---|
| **Source** | مصدر رسمي مُسجّل | يُضاف، يُصنّف، يُراقب، يُحدّث |
| **Document** | وثيقة من مصدر رسمي | تُجمع، تُحلّل، تُؤرشف، تُستشهد |
| **Fact** | حقيقة مستخرَجة من وثيقة | تُستخرج، تُتحقق، تُربط، تُؤرخ |
| **Event** | حدث مالي مؤثر مرتبط بوقت ومصدر | يُكتشف، يُصنّف، يُربط، يُتابع |
| **Evidence** | سلسلة تربط Fact بـ Event بـ Source | تُبنى، تُتحقق، تُوسَّع، تُحفظ |
| **Entity** | كيان اقتصادي (شركة، بنك مركزي، أصل) | يُعرَّف، يُربط، يُتابع |
| **Relationship** | علاقة بين كيانات | تُستنتج، تُتحقق، تُوسَّع |
| **Scenario** | سيناريو محتمل مبني على Facts و Events | يُبنى، يُقيَّم، يُحدَّث، يُراجع |
| **Decision** | قرار موثّق مُشتق من Scenarios | يُولَّد، يُحوكَم، يُسجَّل، يُراجع |
| **Signal** | فرصة موثّقة بدرجة ثقة وسياق مخاطر | تُولَّد، تُحاكَم، تُسجَّل، تُتعقَّب |

### 4.3 ملاحظات حرجة:

1. **هذه ليست Records** — هي كيانات حيّة. الفيدرالي يرفع الفائدة ← Event يُضاف ← Facts تُحدَّث ← Scenarios تُعاد بناؤها ← Decisions تُراجَع ← Signals تُولَّد من جديد.

2. **هذه ليست Outputs** — هي البنية المعرفية. الخبر والتقرير والإشارة كلها **تمثيلات** لمجموعة من هذه الكيانات.

3. **هذه ليست طبقة وسيطة** — هي **محتوى** المحركات الثلاثة. لا توجد "طبقة Graph بين Engine و Systems" — Graph هو ما تشغّله المحركات، وما تستهلكه الأنظمة.

4. **هذا هو الخندق** — Source Registry (411 مصدر) و Evidence Graph و Knowledge Graph لا يمكن بناؤها داخلياً بسرعة.

---

## 5. Intelligence Systems — أنظمة غير متساوية

### 5.1 لماذا ليست متساوية؟

في v1 عاملتُ Media و Trading و Research و Risk كأنظمة مستقلة متساوية. هذا غير دقيق.

**الواقع:** هناك اعتماد متبادل بينها.

```
Media Intelligence     — لا يحتاج Trading، لا يحتاج Research
Research Intelligence  — لا يحتاج Trading، قد يستفيد من Risk
Risk Intelligence      — يحتاج Events من Knowledge Graph، لا يحتاج Trading
Trading Intelligence   — يحتاج Events + Research + Risk
```

### 5.2 خريطة الاعتماد

```
              Knowledge Infrastructure
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Media Intel.    Research Intel.   Risk Intel.
        │               │               │
        └───────────────┼───────────────┘
                        │
                Trading Intelligence
              (يستهلك مخرجات الـ 3 أنظمة)
```

**Trading هو النظام الأعلى تعقيداً** — لأنه يستهلك ليس فقط Knowledge Graph، بل أيضاً مخرجات Research و Risk و Media.

### 5.3 الأنظمة الأربعة بالتفصيل

| النظام | ما يستهلكه | الـ Workflow الخاص | الـ Delivery Formats |
|---|---|---|---|
| **Media Intelligence** | Events, Facts, Evidence, Entities | جمع → تحليل → بناء قصة → نشر → مراقبة | أخبار، تقارير، فيديو، infographics، Geo Monitor |
| **Research Intelligence** | Entities, Relationships, Facts, Events, Scenarios | بحث → ربط → استدلال → نشر | Strategic Research، Equity Analysis، Sector Reports |
| **Risk Intelligence** | Events, Facts, Entities, Relationships, Scenarios | مراقبة → تقييم تعرّض → تنبيه → اقتراح تحوّط | Risk Dashboards، Exposure Analytics، Compliance Logs |
| **Trading Intelligence** | Events, Facts, Scenarios, Decisions + Research + Risk | تحليل → AI Council → Signals → Risk → Execution | إشارات، Smart Charts، Executors، Scanners، Terminal |

### 5.4 ملاحظة حرجة:

هذه الأنظمة **أنظمة كاملة** — ليست "خطوط إخراج". كل واحد منها:
- يملك workflow كامل
- يملك منطق اتخاذ قرار خاص
- يُنتج تمثيلات متعددة
- يتعلّم من نتائجه

لكنها ليست متساوية في الاعتماد — Trading هو الأعلى تعقيداً، Media هو الأبسط من حيث الاعتماد.

---

## 6. Delivery Layer — ليست طبقة موازية

### 6.1 لماذا فصلها عن Systems في v1 كان خطأً؟

في v1 رسمتُ Access Layer كطبقة **موازية** للـ Systems. هذا غير صحيح — لأن:

- API ليس نظاماً
- SDK ليس نظاماً
- Widget ليس نظاماً
- White-label ليس نظاماً

هذه **وسائل عرض وتسليم**، لا أنظمة ذكاء.

### 6.2 الإصلاح: Delivery Layer أسفل Systems

```
Intelligence Systems (Media/Trading/Research/Risk)
                        │
                        ↓
              Delivery Layer
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   Content Formats  Interface Formats  Programmatic Access
        │               │               │
   News, Reports,   Terminal, Widgets, APIs, SDKs,
   Videos, Signals  Dashboards,        Webhooks,
   Infographics     White-label        Streaming
```

### 6.3 صنفان من الـ Delivery Formats

كل واحد من الـ 44 منتج في catalog هو إما:

| النوع | الوصف | أمثلة |
|---|---|---|
| **Content Format** | تمثيل لـ Intelligence مُنتَج بواسطة System | News, Report, Signal, Video, Dashboard |
| **Interface Format** | واجهة للوصول إلى Intelligence أو بناء واجهة فوقها | API, SDK, Widget, White-label, Streaming |

### 6.4 Developer Platform

Developer Platform ليست System — بل **بوابة** إلى Delivery Layer. تتيح للعميل:
- الوصول إلى APIs و SDKs
- بناء واجهات فوق الـ White-label
- استهلاك Intelligence مباشرة عبر Streaming
- بناء System خاص فوق Knowledge Graph (هذا حالة متقدمة، تتطلب license خاص)

---

## 7. من "Products" إلى "Capabilities + Delivery Formats"

### 7.1 المشكلة مع كلمة "Products"

إذا قلت لمؤسسة: "لدينا 44 Product" — سيسأل: "أيها المنتج الحقيقي؟"

هذا سؤال خاطئ لأنه يفترض أن رؤى شركة منتجات. ليست كذلك.

### 7.2 الإصلاح: لغتان مختلفتان

**اللغة الأولى — Intelligence Capabilities:** ما الذي تستطيع رؤى فعله؟

```
Capabilities
├── Event Detection
├── Fact Extraction
├── Evidence Building
├── Scenario Modeling
├── AI Council Reasoning
├── Signal Generation
├── Risk Assessment
├── Exposure Analysis
├── Audit Trail Generation
└── ...
```

**اللغة الثانية — Delivery Formats:** كيف تصل إلى ما تستطيع رؤى فعله؟

```
Formats
├── Content Formats: News, Reports, Signals, Videos, Dashboards
├── Interface Formats: Terminal, Widgets, White-label
└── Programmatic Access: APIs, SDKs, Streaming, Webhooks
```

**المبدأ:** العميل لا يشتري منتجاً — يشتري **وصولاً إلى Capability عبر Format**.

### 7.3 أثر هذا على التسعير

النموذج الطبيعي يصبح:
1. **Base License** — للوصول إلى Knowledge Infrastructure (Engine + Graph)
2. **System Subscription** — لكل System تشغّله (Media/Trading/Research/Risk)
3. **Format Usage** — استهلاك Delivery Formats (API calls, Widget embeds, White-label instances)
4. **Premium Capabilities** — بعض الـ Capabilities المتقدمة (AI Council, Autonomous Executors) كـ add-ons

هذا يستحق وثيقة منفصلة (`PRICING-MODEL-v2.md`).

---

## 8. الهرمية النهائية (Inside-Out + Loop)

```
              ROUAA
   Financial Intelligence Infrastructure

   ════════════════════════════════════════
      Knowledge Infrastructure (ما تملكه)
   ════════════════════════════════════════
              │
   ┌──────────┴──────────┐
   │                     │
   Financial Intel.      Audit Trail +
   Graph                 Governance
   (Source, Doc, Fact,
    Event, Evidence,
    Entity, Relationship,
    Scenario, Decision,
    Signal)
   └──────────┬──────────┘
              │
   ════════════════════════════════════════
      Reasoning Infrastructure (ما تشغّله)
   ════════════════════════════════════════
              │
   ┌──────────┴──────────┐
   │                     │
   Acquisition Engine    │
   (يبني المعرفة)         │
                         │
   Knowledge Engine      │
   (يحافظ عليها)          │
                         │
   Reasoning Engine      │
   (يستخدمها — AI Council)│
   └──────────┬──────────┘
              │
   ════════════════════════════════════════
      Evidence-backed Intelligence (الناتج)
   ════════════════════════════════════════
              │
        Events, Decisions,
        Signals, Scenarios
              │
   ════════════════════════════════════════
      Intelligence Systems (4 أنظمة)
   ════════════════════════════════════════
              │
   ┌──────────┬──────────┬──────────┐
   │          │          │          │
  Media    Research    Risk      Trading
   │          │          │      (يستهلك
   │          │          │       الـ 3 الآخرين)
   └──────────┴──────────┴──────────┘
              │
   ════════════════════════════════════════
      Delivery Layer (وسائل التسليم)
   ════════════════════════════════════════
              │
   ┌──────────┬──────────┬──────────┐
   │          │          │          │
 Content   Interface  Programmatic  Developer
 Formats   Formats    Access        Platform
   │          │          │          (Gateway)
 News      Terminal   APIs
 Reports   Widgets    SDKs
 Signals   Dashboards Streaming
 Videos    White-label Webhooks

   ════════════════════════════════════════
      Loop: Observe → Learn → Improve ↺
      (يعود إلى Knowledge Infrastructure)
   ════════════════════════════════════════
```

---

## 9. ما الذي يعنيه هذا للمعمارية الحالية للموقع

### 9.1 التعارضات التي يجب حلّها:

**1. الـ 8 طبقات في trading page (v19) ليست معمارية Trading — بل معمارية رؤى الكاملة.**

الـ 8 طبقات:
- 4 منها تنتمي لـ Knowledge + Reasoning Infrastructure (Source · Evidence · Knowledge · Council)
- 3 منها تنتمي للـ Trading System (Decision · Risk · Execution)
- 1 منها تنتمي للـ Delivery Layer (UX · White Label)

**الحل:** الـ 8 طبقات تنتقل إلى `platform.html` (the Engine). وtrading-technologies.html يكتفي بـ 3 طبقات تخص Trading System.

**2. كلمة "Operating Layer" في v19 تتعارض مع "Infrastructure" كاسم أعلى.**

**الحل:** "Operating Layer" يصبح وصفاً لكيفية عمل Reasoning Infrastructure، لا اسم رؤى نفسها. الاسم الأعلى يبقى **Financial Intelligence Infrastructure**.

**3. كل صفحة solution تبدو كمنتج مستقل.**

**الحل:** كل صفحة تبدأ بـ banner صغير يربطها بالـ umbrella: "نظام من أنظمة ROUAA Financial Intelligence Infrastructure".

**4. catalog.html يعرض 44 "Product" — يجب reframing.**

**الحل:** catalog.html يعرض **Capabilities + Delivery Formats**. كل "منتج" يُصنَّف: هل هو Capability (Event Detection, Scenario Modeling) أم Delivery Format (News, API, Widget)?

### 9.2 خريطة الموقع المُحدّثة:

| الصفحة | تمثّل في الهرمية | الموضوع |
|---|---|---|
| `index.html` | ROUAA (umbrella) | Infrastructure Diagram + الإجابة على "ما رؤى؟" |
| `platform.html` | Knowledge + Reasoning Infrastructure | المحركات الثلاثة + الـ Graph |
| `products-architecture.html` | تفصيل تقني للـ Graph | Domain Objects، Evidence Graph، Knowledge Graph |
| `catalog.html` | Capabilities + Delivery Formats | الـ 44 كـ Capabilities/Formats، ليس Products |
| `media-technologies.html` | Media Intelligence System | Delivery Formats الخاصة بـ Media |
| `trading-technologies.html` | Trading Intelligence System | Delivery Formats الخاصة بـ Trading |
| `enterprise.html` | Research Intelligence System | Delivery Formats الخاصة بـ Research |
| `risk-intelligence.html` | Risk Intelligence System | Delivery Formats الخاصة بـ Risk |
| `developers.html` | Delivery Layer + Developer Platform | APIs, SDKs, Widgets, White-label |
| `trust.html` | Audit + Provenance + Loop | لماذا تثق به؟ Evidence chain، Audit trail، Learning Loop |
| `company.html` | الـ Story | لماذا وُجدت رؤى؟ الـ Manifesto |

---

## 10. الإجابات على الأسئلة المتوقعة من العميل المؤسسي

| السؤال | الإجابة المُشتقة من الوثيقة |
|---|---|
| "هل أنتم منصة تداول؟" | لا — نحن Infrastructure. Trading هو أحد أنظمتنا. |
| "هل أنتم موقع أخبار؟" | لا — Media هو أحد أنظمتنا. |
| "هل أنتم شركة أبحاث؟" | لا — Research هو أحد أنظمتنا. |
| "ما الذي يميّزكم عن Bloomberg؟" | Bloomberg يبيع بيانات وصولاً. نحن نُرخّص بنية معرفية واستدلالية كاملة، والـ Bloomberg Terminal هو واحد من عشرات Delivery Formats الممكنة فوقها. |
| "ما الذي يميّزكم عن OpenAI؟" | OpenAI تبيع قدرة استدلال. نحن نُرخّص Graph معرفي لا يمكن لـ LLM وحده إنتاجه — Source Registry + Evidence Graph + Audit Trail. |
| "هل يمكننا بناء هذا داخلياً؟" | يمكنك بناء الـ AI. لا يمكنك بناء Knowledge Infrastructure (411 مصدر + Evidence Graph) في أقل من 3 سنوات. |
| "ما المنتج الرئيسي؟" | لا يوجد منتج رئيسي — يوجد **Knowledge Infrastructure واحد**، يُشغَّل بثلاثة محركات، يُنتج ذكاءً يُستهلك عبر 4 أنظمة، يصل عبر Delivery Formats. |
| "كيف تُسعَّرون؟" | Base License على Infrastructure + Subscription على System + Usage على Delivery Formats + Premium Capabilities. (تفصيل في PRICING-MODEL-v2.md) |
| "هل Trading مستقل؟" | لا — Trading يستهلك مخرجات Research و Risk و Media. هذا سبب قوته. |
| "هل النظام Pipeline؟" | لا — Loop. كل قرار يُراقَب، يُتعلَّم منه، ويُحسَّن النموذج. |

---

## 11. المبادئ المؤسسة (Non-Negotiable Principles)

كل ما يُبنى في رؤى يجب أن يحترم هذه المبادئ. إن تعارض أي قرار معها، فالقرار خاطئ:

1. **الداخل إلى الخارج** — معماريتنا تتبع معماريتنا المعرفية، لا العكس.

2. **فصل الأصل عن الناتج** — Knowledge Infrastructure (ما نملكه) ≠ Reasoning Infrastructure (ما نشغّله) ≠ Evidence-backed Intelligence (ما ننتجه) ≠ Representations (ما يستهلكه العميل).

3. **ثلاثة محركات تشغيلية** — Acquisition (يبني) · Knowledge (يحافظ) · Reasoning (يستخدم). ليست محركاً واحداً.

4. **Graph وليس Model** — Knowledge Model مضلّل. ما نملكه شبكة حيّة تتغير كل دقيقة.

5. **محرك واحد، أنظمة متعددة، أنظمة غير متساوية** — لا توجد محركات منفصلة لـ Media/Trading/Research/Risk، لكن Trading يستهلك مخرجات الآخرين.

6. **Delivery Layer أسفل Systems، ليست موازية** — APIs و SDKs و Widgets وسائل تسليم، لا أنظمة ذكاء.

7. **Capabilities + Formats، لا Products** — العميل لا يشتري منتجاً، يشتري وصولاً إلى Capability عبر Format.

8. **Loop وليس Pipeline** — كل قرار يُراقَب، يُتعلَّم منه، يُحسَّن النموذج. رؤى Infrastructure مستمرة، لا محركاً ينتهي.

9. **Evidence أول** — لا ذكاء بلا دليل. أي مُخرَج يحمل سلسلة دليله الكاملة.

10. **Audit ليس ميزة** — Audit هو السبب الوجودي للمشروع. بدون Audit، رؤى مجرد AI آخر.

---

## 12. أسئلة مفتوحة للنقاش

1. **التسمية الرسمية للـ Graph** — هل نسمّيه "Financial Intelligence Graph" أم "Institutional Knowledge Graph" أم اسماً آخر؟ يظهر في كل صفحة، لذا يستحق قراراً.

2. **هل يرى العميل الكيانات المعرفية مباشرة؟** — هل يرى العميل "Event" ككيان مستقل في واجهة، أم يراها فقط من خلال تمثيلاتها (News, Signal, Report)؟

3. **كيف نُصوّر الـ Loop في الواجهة؟** — Loop مفهوم قوي لكنه يصعب رسمه في HTML. هل نُصوّره كـ circular diagram أم كـ 7 steps with feedback arrow؟

4. **TRUST-FRAMEWORK** — يجب إعادة بناء وثيقة الثقة بناءً على Evidence + Audit + Loop. الثقة الحقيقية قائمة على هذه الثلاثة، لا على شهادات أمنية.

5. **PRICING-MODEL-v2** — يستحق وثيقة منفصلة. النموذج المقترح: Base License + System Subscription + Format Usage + Premium Capabilities.

6. **هل Trading يحتاج System page منفصلة، أم يُدمج مع Risk؟** —鉴于 Trading يستهلك Risk، هل من الأفضل دمجهما في صفحة واحدة؟

---

## 13. الحالة الراهنة والخطوة التالية

**هذه الوثيقة هي v2 بعد المراجعة النقدية.** ليست نهائية حتى تُعتمد.

### ما تغيّر عن v1:

| v1 | v2 |
|---|---|
| Engine واحد | 3 محركات: Acquisition · Knowledge · Reasoning |
| Knowledge Model | Financial Intelligence Graph |
| Records كطبقة وسيطة | (حُذفت — الكيانات هي محتوى المحركات) |
| Access Layer موازية للـ Systems | Delivery Layer أسفل Systems |
| 4 Systems متساوية | 4 Systems مع خريطة اعتماد (Trading يستهلك البقية) |
| Pipeline (Truth → ... → Delivery) | Pipeline + Loop (Observe → Learn → Improve ↺) |
| "Products" (44) | Capabilities + Delivery Formats |
| خلط بين الأصل والناتج | فصل صريح: ما تملكه ≠ ما تشغّله ≠ ما تنتجه |

### الخطوات بعد الاعتماد:

1. **اعتماد الوثيقة** بعد النقاش والتعديل.
2. **إعادة كتابة `index.html`** ليصبح أول تجسيد للنموذج — Infrastructure Diagram يعرض: Knowledge Infrastructure → Reasoning Infrastructure → Intelligence → Systems → Delivery Layer + Loop.
3. **إعادة بناء `platform.html`** ليصبح "The Engine" page — مع المحركات الثلاثة + الـ Graph.
4. **تحديث trading-technologies.html** بـ re-framing بسيط — يصبح "Trading Intelligence System"، يكتفي بـ 3 طبقات تخص Trading.
5. **تحديث بقية الـ Solutions pages** بنفس الـ framing.
6. **تحديث `catalog.html`** ليعرض Capabilities + Formats، لا Products.
7. **إعادة بناء `trust.html`** على Evidence + Audit + Loop.
8. **كتابة `PRICING-MODEL-v2.md`**.

**قبل كل ذلك**: لا يُعدَّل أي HTML حتى تُعتمد هذه الوثيقة.

---

*الإصدار: v2.0 — بعد المراجعة النقدية لـ v1*
*التاريخ: يوليو 2026*
*الحالة: مسودة محسّنة للنقاش*
