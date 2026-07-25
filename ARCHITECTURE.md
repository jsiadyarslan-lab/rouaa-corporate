# ROUAA · Product Architecture Map (v3 — المعتمدة)

> وثيقة مرجعية تُكتب قبل أي صفحة. كل قرار تصميمي لاحق يجب أن يرجع إلى هذه الوثيقة.
>
> **المبدأ المركزي:** News ليس النظام. Trade ليس النظام. APIs ليست النظام. كلها مخرجات من نفس النظام.
>
> **المرجع الرسمي لبناء v18.**

---

## الإطار العام (5 طبقات)

رؤى ليست شركة SaaS بمنتجات. رؤى **منظومة مالية استخباراتية متعددة الطبقات** — إطار سردي، وبنية تحتية، ومحركات، ومنتجات تجارية، وحلول مؤسسية.

كل طبقة تبني على ما قبلها. الزائر يفهم الترتيب قبل أن يدخل أي صفحة.

```
                 Layer 4
          Enterprise Solutions
                  ↑

                 Layer 3
          Commercial Products
                  ↑

                 Layer 2
       Intelligence Engines
       (Knowledge + Decision)
                  ↑

                 Layer 1
       Intelligence Infrastructure
                  ↑

                 Layer 0
        ROUAA Intelligence Platform
         (الإطار السردي الأعلى)
```

---

## Layer 0 · ROUAA Intelligence Platform

**السؤال:** ما هي رؤى؟
**الوظيفة:** ليست تقنية. هي الصورة الكبيرة التي تمنع الزائر من القفز مباشرة إلى Layers دون فهم لماذا توجد.

```
Official World Data
        ↓
ROUAA Intelligence Platform
        ↓
Applications
        ↓
Enterprise Solutions
```

**بدون هذه الطبقة:** بعض الزوار سيرون "شركة أخبار + منصة تداول" بدلاً من "بنية استخبارات مالية". هذه الطبقة تمنع أكبر خطأ في الفهم.

**تظهر للعميل عبر:** الصفحة الرئيسية فقط. لا تكرار في أي صفحة أخرى.

---

## Layer 1 · Intelligence Infrastructure

**السؤال:** على ماذا نبني؟ (**ما الذي نملكه؟**)
**الجمهور:** داخلي للتشغيل + خارجي لإثبات الثقة.

ليست طبقة تشغيلية مخفية فقط. هي **ميزة ثقة وتسويق مؤسسي** — تماماً كما لا تخفي Bloomberg مصادر بياناتها ومنهجية تحققها وبنيتها البحثية.

**القاعدة:** Layer 1 = **الأصل** (ما نملكه). Layer 2A = **المعالجة** (ماذا نفعل به). الأدلة ورسم المعرفة معالجة، فهي في Layer 2A وليس هنا.

| المكون | الوظيفة | الإحصاء |
|--------|------|------|
| Official Sources | 411 مصدر رسمي مراقب 24/7 — بنوك مركزية، هيئات، وزارات | 411 مصدر · 100% رسمي |
| Source Registry | فهرسة كاملة لكل مصدر — نوع، بلد، صحة، ثقة، آخر تحديث | مُفهرس بالكامل |
| Data Quality | مراقبة صحة كل مصدر ودرجة موثوقيته — 24/7 | 100% صحة فعّالة |
| Provenance Storage | تخزين الأصل الموثّق — كل وثيقة محفوظة بطابع زمني | أرشيف كامل قابل للمراجعة |

**يظهر للعميل عبر:** Source Transparency · Provenance · Data Quality — وليس كواجهة تشغيل.

**المبدأ:** لا شيء يدخل النظام إلا من مصدر رسمي. لا مدونات، لا آراء، لا إشاعات. الأصل محفوظ دائماً — يمكن الرجوع إليه في أي مرحلة.

---

## Layer 2 · Intelligence Engines

**السؤال:** كيف ننتج الذكاء؟
**الجمهور:** داخلي — يعمل خلف الكواليس، يُنتج ما يراه العميل في Layer 3.

وظيفياً، هناك مستويان مختلفان داخل هذه الطبقة:

### 2A · Knowledge Engines (محرّكات المعرفة)

**السؤال:** ماذا حدث؟ (تحويل الخام إلى معرفة موثّقة)

تأخذ الخام من Layer 1 وتحوّله إلى معرفة. هنا توجد Evidence Engine و Knowledge Graph — لأنهما **معالجة**، وليسا أصلاً.

| المحرك | الوظيفة | المخرج |
|--------|------|------|
| Document Intelligence | PDF ← بيانات مهيكلة في 0.4 ثانية | حقائق مهيكلة |
| Fact Engine | استخراج NLP للأرقام والكيانات والعلاقات | 1,247 حقيقة مستخرجة |
| Evidence Engine | ربط كل حقيقة بمصدرها ودرجة ثقتها — التحقق يحدث هنا | دليل كامل قابل للتدقيق |
| Event Engine | تصنيف وربط الأحداث بعد التحقق — كشف الأنماط | 38 حدثاً يومياً |
| Knowledge Graph | شبكة العلاقات المالية — تأثيرات متبادلة | شبكة حية تفاعلية |

**ملاحظة ترتيبية:** الحقيقة غير الموثقة ليست حقيقة في نظامنا. لذلك Evidence Engine تأتي **قبل** Event Engine — الحقيقة تُتحقق ثم تُصنّف كحدث.

### 2B · Decision Engines (محرّكات القرار)

تأخذ المعرفة وتستنتج:

| المحرك | الوظيفة | المخرج |
|--------|------|------|
| AI Research | 10 أدوار استدلال تتشاور قبل كل تحليل | استنتاجات موثّقة |
| AI Council | مجلس استدلال للقرارات المعقدة | إجماع قبل التوصية |
| Risk Engine | تقييم المخاطر — تقلب، تعرّض، ارتباط، سحب | درجة مخاطر لكل قرار |
| Market Intelligence | استنتاج التأثيرات السوقية | تأثير متوقع لكل حدث |

**المبدأ:** Knowledge Engines تُسلّم ناتجها لـ Decision Engines. كل محرك يسلّم ناتجه للذي يليه. لا تداخل، لا فجوات. كل ناتج موثّق بقابلية تتبع كاملة.

---

## Layer 3 · Commercial Products

**السؤال:** ماذا يستلم العميل؟
**الجمهور:** العميل النهائي — يراه ويستخدمه مباشرة.

تنقسم إلى فئتين مختلفتين:

### 3A · Intelligence Applications

| المنتج | السؤال الذي يجيب عنه | التعريف النهائي |
|--------|---------------------|-----------------|
| ROUAA News | كيف أفهم السوق؟ | Financial Intelligence Application |
| ROUAA Trade | كيف أتخذ القرار وأنفّذه؟ | Decision & Execution Intelligence Platform |

**ROUAA News** لا يقدّم "محتوى" — يقدّم استخبارات مالية:
- Intelligence Feed
- Research
- Reports
- Economic Calendar
- Asset Intelligence
- Media Intelligence

**ROUAA Trade** ليست "منصة تداول" — هي دورة كاملة:
```
Information → Reasoning → Risk → Decision → Execution → Learning
```

### 3B · Platform Access

| المنتج | السؤال الذي يجيب عنه | ما يقدمه |
|--------|---------------------|---------|
| ROUAA Intelligence APIs | كيف أدمج استخبارات رؤى في بنيتي؟ | منتج كامل (مثل Bloomberg Data License / Refinitiv APIs) — Data + Intelligence عبر REST، Streaming، SDK، Webhooks، Authentication |
| ROUAA White Label | كيف أبيع رؤى بعلامتي؟ | نسخة كاملة قابلة للعلامة التجارية — واجهات + APIs + بنية |

**ملاحظة:** ROUAA Intelligence APIs ليست «APIs» فقط — هي **منتج**. كل وصول يسلّم بيانات واستخبارات من نفس المنظومة، بنفس طبقات الأدلة. التسمية المختصرة الداخلية: Intelligence APIs.

**لماذا White Label في Layer 3 وليس Layer 4؟** لأنه منتج. المؤسسة قد تشتريه (وسيط يريد منصة باسم علامته)، لكنه ليس "حل قطاع" — هو منتج تجاري.

**المبدأ:** كل منتج منفصل بصرياً، لكنها جميعاً تأكل من نفس الطبقات السفلى. لا تكرار، لا تضارب.

---

## Layer 4 · Enterprise Solutions

**السؤال:** لمن نصمم؟
**الجمهور:** المؤسسات الكبرى — تبحث عن حل جاهز، لا ميزات.

**صفحة واحدة. لا تقسيم الموقع.** الهدف: عرض القدرة، وليس بناء أقسام.

| القطاع | الحاجة | ما تقدمه رؤى |
|--------|------|--------------|
| Banks | قرارات ائتمان واستثمار مدعومة بأدلة | وصول كامل للطبقات + تكامل مع أنظمة البنك |
| Hedge Funds | سرعة في كشف الفرص + قدرة على المراجعة | بث حي + سجل تدقيق قابل للتصدير |
| Brokers | قيمة مضافة للعملاء دون بناء محرك | White Label + APIs + لوحات قابلة للتخصيص |
| Governments | استخبارات اقتصادية لتقييم السياسات | وصول مخصص + تقارير + رسم المعرفة |

**المبدأ:** المؤسسة لا تشتري 10 ميزات. تشتري: اختصار سنوات من البناء، مصدر موثوق، قدرة تحليل، قدرة تنفيذ، سجل أدلة، تكامل مؤسسي.

---

## رحلة المعلومة (نظام واحد، مخرجات متعددة)

```
Official Source                    ─── Layer 1 (الأصل)
   ↓
Document
   ↓
Extraction
   ↓
Fact
   ↓
Evidence Validation               ─── Layer 2A (المعالجة)
   ↓
Event Understanding
   ↓
Intelligence                      ─── Layer 2B (الاستنتاج)
   ↓
  ┌─────────┬──────────┬─────────────┬─────────────┐
  ↓         ↓          ↓             ↓             ↓
News     Trade   Intelligence   White Label    Enterprise
(فهم)    (تنفيذ)    APIs        (إعادة بيع)    (حلول)
                                                     ─── Layer 3 + 4
```

**النقطة الجوهرية:** الحقيقة غير الموثقة ليست حقيقة في نظامنا — لذلك Evidence Validation تأتي **قبل** Event Understanding. والنتيجة: News ليس النظام. Trade ليس النظام. Intelligence APIs ليست النظام. كلها **مخرجات** من نفس النظام.

---

## ما الذي يغيره هذا الإطار في التصميم؟

### قبل (v17 — مرفوض):
- الصفحات تشرح الميزات
- كل صفحة تحاول إثبات "لدينا ميزات كثيرة"
- الزائر يرى قائمة طويلة ولا يفهم العلاقة

### بعد (v18 — هذا الإطار):
- الصفحة الرئيسية تشرح **المنظومة بـ 5 طبقات** قبل أي منتج
- كل صفحة منتج تبدأ بسياق: "أنت الآن في Layer 3 — هذا مخرج من النظام"
- المؤسسة تفهم فوراً: لا أستطيع بناء هذا داخلياً بسهولة

---

## قواعد تصميم الصفحات (تُكتب لاحقاً بعد اعتماد هذه الوثيقة)

1. **index.html (Layer 0):** لا تبيع **منتجاً**، لكنها تبيع **الفكرة والقيمة**. الرسالة: "رؤى تبني طبقة استخبارات مالية تحوّل البيانات الرسمية إلى قرارات قابلة للتنفيذ." ثم تعرض المنتجات كنتائج، وتعرض الـ Architecture Map كاملة بـ 5 طبقات. لا تبيع News ولا Trade — تبيع الرؤية.

2. **صفحات Layer 3 (News / Trade / Intelligence APIs / White Label):** لا تشرح الطبقات كدرس للزائر. بدلاً من "أنت الآن في مخرج من النظام"، استخدم الإشارة الضمنية:
   ```
   Powered by ROUAA Intelligence Core
   Built on: ✓ Official Sources ✓ Evidence Engine ✓ AI Reasoning
   ```
   الزائر يشعر بالاتصال بدون شرح معماري.

3. **Layer 4 (Enterprise):** صفحة واحدة تجمع كل القطاعات — Banks / Funds / Brokers / Governments. لا 4 صفحات.

4. **لا تكرار:** كل ميزة تظهر في صفحة واحدة فقط. إذا ظهرت في صفحتين، فهي في الطبقة الخطأ.

5. **الترتيب البصري في الصفحات:** Layer 0 → Layer 1 → Layer 2 → Layer 3 → Layer 4. لكن **في Navigation** يظهر Enterprise مبكراً — البنك قد يدخل مباشرة دون المرور بكل شيء:
   ```
   Platform · Products · Solutions · API · Enterprise · Security
   ```

6. **اللغة:** "Financial Intelligence Application" (News)، "Decision & Execution Intelligence Platform" (Trade)، "ROUAA Intelligence APIs" (وليس فقط APIs) — لا تقليل للقيمة بأسماء سوقية بسيطة.

---

## ما الذي تم تثبيته في v3 (النسخة المعتمدة)

- [x] إضافة Layer 0 — ROUAA Intelligence Platform كإطار سردي أعلى
- [x] Layer 1 — Intelligence Infrastructure (داخلي للتشغيل + خارجي لإثبات الثقة)
- [x] **إزالة التداخل:** Evidence Engine و Knowledge Graph انتقلتا من Layer 1 إلى Layer 2A (الأصل مقابل المعالجة)
- [x] Layer 1 تحتوي الآن على: Official Sources · Source Registry · Data Quality · Provenance Storage
- [x] تقسيم Layer 2 إلى 2A Knowledge Engines + 2B Decision Engines
- [x] Layer 3 — Commercial Products، منقسمة إلى 3A Intelligence Applications + 3B Platform Access
- [x] **ROUAA Intelligence APIs** (وليس فقط APIs) — منتج كامل مثل Bloomberg Data License
- [x] White Label في Layer 3 وليس Layer 4 (لأنه منتج، ليس حل قطاع)
- [x] Layer 4 — صفحة Enterprise واحدة، لا تقسيم الموقع
- [x] التعريف النهائي: News = Financial Intelligence Application
- [x] التعريف النهائي: Trade = Decision & Execution Intelligence Platform
- [x] **رحلة المعلومة مُصحّحة:** Source → Document → Extraction → Fact → Evidence Validation → Event Understanding → Intelligence (الحقيقة غير الموثقة ليست حقيقة)
- [x] **قاعدة index.html مُصحّحة:** لا تبيع منتجاً، لكنها تبيع الفكرة والقيمة
- [x] **قاعدة صفحات Layer 3 مُصحّحة:** لا تشرح الطبقات كدرس، استخدم "Powered by ROUAA Intelligence Core" ضمنياً
- [x] **قاعدة Navigation:** Enterprise يظهر مبكراً، لا يمر البنك بكل الطبقات
- [x] المبدأ المركزي: "كلها مخرجات من نفس النظام"

---

## النسخة النهائية المعتمدة

```
LAYER 0
ROUAA Intelligence Platform (Why)
        ↓
LAYER 1
Intelligence Infrastructure (On what)
        ↓
LAYER 2A
Knowledge Engines (Understanding)
        ↓
LAYER 2B
Decision Engines (Reasoning)
        ↓
LAYER 3
Commercial Products (Consumption)
   ├── ROUAA News
   ├── ROUAA Trade
   ├── ROUAA Intelligence APIs
   └── ROUAA White Label
        ↓
LAYER 4
Enterprise Solutions (Deployment)
```

---

**الحالة:** v3 — **معتمدة كمرجع رسمي لبناء v18**
**الأساس:** v16-final (وليس v17 — تم رفضه)
**Branch:** `redesign-v18-architecture`
**التاريخ:** يوليو 2026
