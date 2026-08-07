# ROUA · Proof Assets v1

> الوثيقة العاشرة والأخيرة.
>
> ليست نظرية. ليست معمارية. ليست رسالة.
> هي **مواصفات تنفيذية لأصول تفاعلية حقيقية** تجعل الفلسفة ملموسة.
>
> طبقة التفكير اكتملت. هذه الوثيقة تبدأ طبقة البرهنة.
>
> **تكتب قبل أي HTML. هي الجسر بين الوثائق والتنفيذ.**

---

## جدول المحتويات

1. [الفلسفة — لماذا توجد رؤى](#1-الفلسفة--لماذا-توجد-رؤى)
2. [مبدأ Proof Assets](#2-مبدأ-proof-assets)
3. [الأصل 1 — Evidence Chain Explorer](#3-الأصل-1--evidence-chain-explorer)
4. [الأصل 2 — Source Registry (Live)](#4-الأصل-2--source-registry-live)
5. [الأصل 3 — Provenance Record Viewer](#5-الأصل-3--provenance-record-viewer)
6. [الأصل 4 — Confidence Calculator](#6-الأصل-4--confidence-calculator)
7. [الأصل 5 — Before/After Intelligence Demo](#7-الأصل-5--beforeafter-intelligence-demo)
8. [خريطة ظهور Proof Assets في الموقع](#8-خريطة-ظهور-proof-assets-في-الموقع)
9. [المعادلة الجوهرية — How Confidence is Really Computed](#9-المعادلة-الجوهرية--how-confidence-is-really-computed)
10. [Source Grading — How A+ is Really Determined](#10-source-grading--how-a-is-really-determined)
11. [معايير الاعتماد](#11-معايير-الاعتماد)

---

## 1. الفلسفة — لماذا توجد رؤى

### ليست «Financial Intelligence»

كل الشركات الكبيرة تبدأ بفلسفة، لا بمنتج:

| الشركة | الفلسفة |
|--------|------|
| Bloomberg | «المعلومات يجب أن تصل صنّاع القرار أسرع.» |
| Stripe | «زيادة GDP الإنترنت.» |
| Palantir | «مساعدة المؤسسات على اتخاذ قرارات أفضل من بيانات مجزّأة.» |
| Snowflake | «البيانات يجب أن تتدفّق كالكهرباء.» |

### فلسفة رؤى

من خلال كل ما بُني، الفلسفة ليست «Financial Intelligence». هي أعمق:

> **المشكلة ليست نقص البيانات.**
>
> **المشكلة ضعف قابلية التحقق منها وتحويلها إلى قرار.**

### ما تعنيه هذه الفلسفة:

- السوق غارق في البيانات (Bloomberg، Refinitiv، TradingView، الأخبار)
- ما ينقص **ليس** المزيد من البيانات
- ما ينقص هو:
  1. **قابلية التحقق** — هل أستطيع تتبّع كل ادعاء لمصدره؟
  2. **التحويل لقرار** — هل أستطيع تحويل البيانات إلى فعل موثّق؟

### من هذه الفلسفة خرج كل شيء:

```
الفلسفة: ضعف قابلية التحقق + ضعف التحويل لقرار
        ↓
الحل: Evidence Chain + AI Reasoning + Audit Trail
        ↓
المنتجات: 24 منتجاً كلها تخدم هذين الأصلين
        ↓
الرسالة: «كل قرار له دليل، وكل دليل له رحلة»
```

### الجملة الفلسفية الرسمية:

> **رؤى موجودة لتحويل ضعف قابلية التحقق في الأسواق المالية إلى قوة قرار موثّق.**

### الإنجليزية:

> **ROUA exists to turn the verifiability gap in financial markets into trusted decision power.**

### أين تظهر الفلسفة:

- `about.html` (الصفحة الإنسانية — بداية الشركة)
- `index.html` (Hero — بشكل مكثّف)
- `trust.html` (الجسر بين الفلسفة والبرهنة)

### أين لا تظهر:

- صفحات المنتجات (المنتجات تُظهر الفلسفة، لا تشرحها)
- صفحات الـ Pricing
- صفحات الـ Compare

---

## 2. مبدأ Proof Assets

### الإدراك:

> **العميل المؤسسي لا يريد أن يقرأ «لدينا Evidence Chain». يريد أن يجرّبها.**

كل وعد في Trust Framework يحتاج **أصل تفاعلي** يُثبته.

### القاعدة:

> **كل وعد = أصل تفاعلي قابل للتجربة في أول 5 دقائق.**

### 5 Proof Assets أساسية:

| # | الأصل | الوعد الذي يُثبته | أين يظهر |
|---|------|----------------|---------|
| 1 | Evidence Chain Explorer | «كل قرار له دليل» | trust.html + كل صفحة منتج |
| 2 | Source Registry (Live) | «411 مصدر رسمي» | trust.html + about.html |
| 3 | Provenance Record Viewer | «قابلية التتبّع الكاملة» | trust.html + docs.html |
| 4 | Confidence Calculator | «شفافية الثقة» | trust.html + كل استخبارات |
| 5 | Before/After Demo | «من المصدر إلى القرار» | about.html + home.html |

---

## 3. الأصل 1 — Evidence Chain Explorer

### الوعد الذي يُثبته:

> «كل قرار له دليل، وكل دليل له رحلة.»

### ما هو:

أداة تفاعلية تعرض **سلسلة الإثبات الكاملة** لاستخبارات حقيقية، خطوة بخطوة، يمكن للمستخدم تتبّعها.

### المثال الافتراضي (يُحمّل عند فتح الصفحة):

**الاستخبارات:** «ثبات الفيدرالي يشير إلى قوة الدولار»

**الـ Chain (7 خطوات):**

```
Step 1: SOURCE
┌──────────────────────────────────────────┐
│ Federal Reserve                          │
│ federalreserve.gov                       │
│ Trust: A+                                │
│ Type: Central Bank                       │
│ Country: United States                   │
│ Monitored: 24/7 since 2024-03-15         │
│ [زيارة المصدر ←]                          │
└──────────────────────────────────────────┘
                ↓
Step 2: DOCUMENT
┌──────────────────────────────────────────┐
│ FOMC Statement · July 2026               │
│ Format: PDF                              │
│ Pages: 24                                │
│ Published: 2026-07-24 18:00 UTC          │
│ Document Hash: sha256:a3f2e8...          │
│ [تحميل PDF ←]                             │
└──────────────────────────────────────────┘
                ↓
Step 3: PAGE + PARAGRAPH
┌──────────────────────────────────────────┐
│ Page 2, Paragraph 4                      │
│ [عرض الصفحة كصورة ←]                      │
│ (مع تظليل الفقرة المعنية)                 │
└──────────────────────────────────────────┘
                ↓
Step 4: QUOTE
┌──────────────────────────────────────────┐
│ «قررت اللجنة الإبقاء على النطاق المستهدف │
│ لسعر الفائدة بين 5.25 و5.50 بالمئة.»     │
│ — Quote extracted by NLP v3.2.1          │
└──────────────────────────────────────────┘
                ↓
Step 5: EXTRACTED FACT
┌──────────────────────────────────────────┐
│ Fact: US Federal Funds Rate = 5.25%-5.50%│
│ Type: interest_rate                       │
│ Extracted at: 2026-07-24 18:02:18 UTC    │
│ Method: NLP extraction (98% confidence)  │
│ Fact Hash: sha256:b7c4d1...              │
└──────────────────────────────────────────┘
                ↓
Step 6: EVIDENCE RECORD
┌──────────────────────────────────────────┐
│ Evidence ID: #28492                       │
│ Links: Source + Document + Page + Quote  │
│ Created: 2026-07-24 18:02:18 UTC         │
│ Verified by: Human review (CFA analyst)  │
│ [تصدير JSON ←] [تصدير PDF ←]              │
└──────────────────────────────────────────┘
                ↓
Step 7: INTELLIGENCE
┌──────────────────────────────────────────┐
│ «ثبات الفيدرالي يشير إلى قوة الدولار»    │
│ Confidence: 87%                          │
│ Reasoning: AI Council (10 roles)         │
│ Evidence: 5 sources, 12 facts, 3 events  │
│ [عرض الاستدلال الكامل ←]                  │
└──────────────────────────────────────────┘
```

### التفاعل:

- **Click on any step** → expands to show full detail
- **Click "Verify" on Step 1** → opens federalreserve.gov in new tab
- **Click "View Page" on Step 3** → shows PDF page 2 with highlighted paragraph
- **Click "Export JSON" on Step 6** → downloads evidence record
- **Click "View Reasoning" on Step 7** → shows AI Council deliberation

### القاعدة:

> **المستخدم يجب أن يستطيع تتبّع أي استخبارات من Step 7 إلى Step 1 في أقل من 5 ثوانٍ.**

### أمثلة متعددة:

Explorer يحوي **5 أمثلة جاهزة** يمكن التبديل بينها:

1. **قرار الفائدة** (المثال الافتراضي أعلاه)
2. **بيان التضخم** (CPI من BLS → Fact → Intelligence)
3. **تقرير NFP** (وظائف من BLS → Fact → Intelligence)
4. **بيان البنك المركزي الأوروبي** (ECB → Fact → Intelligence)
5. **تقرير شركة** (Apple earnings → Fact → Intelligence)

### المواصفات التقنية:

- HTML/CSS/JS (no backend needed for demo)
- البيانات ثابتة في JSON file (`/assets/evidence-chains.json`)
- Lazy loading للأمثلة (لا يُحمّل الكل دفعة واحدة)
- Responsive (mobile: vertical scroll, desktop: horizontal flow)

---

## 4. الأصل 2 — Source Registry (Live)

### الوعد الذي يُثبته:

> «411 مصدر رسمي مراقب 24/7»

### ما هو:

**ليس رقماً في Hero. بل Registry حيّ قابل للبحث.**

### الواجهة:

```
┌──────────────────────────────────────────────────────────┐
│ SOURCE REGISTRY                                          │
│ 411 sources · Live monitored                            │
│                                                          │
│ [🔍 ابحث: federal reserve...              ]             │
│                                                          │
│ Filters:                                                 │
│ Type: [All ▾]  Country: [All ▾]  Trust: [All ▾]         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ● Federal Reserve              A+  Central Bank    │  │
│ │   federalreserve.gov           US                  │  │
│ │   Last update: 14:32 EST       Health: 100%        │  │
│ │   [زيارة ←] [التفاصيل ←]                          │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ● European Central Bank        A+  Central Bank    │  │
│ │   ecb.europa.eu                EU                  │  │
│ │   Last update: 11:00 CET       Health: 100%        │  │
│ │   [زيارة ←] [التفاصيل ←]                          │  │
│ └────────────────────────────────────────────────────┘  │
│ ... (409 more)                                           │
│                                                          │
│ [Load more 50 ▾]                                         │
└──────────────────────────────────────────────────────────┘
```

### ما يحويه كل سجل مصدر:

| الحقل | مثال |
|------|------|
| Name | Federal Reserve |
| URL | federalreserve.gov |
| Type | Central Bank |
| Country | United States |
| Trust Grade | A+ |
| Health | 100% (live monitoring) |
| Last Update | 2026-07-24 14:32 EST |
| Documents Indexed | 1,247 |
| First Monitored | 2024-03-15 |
| Update Frequency | Event-driven |
| Status | Active |

### التفاعل:

- **Search** — بحث حسب الاسم أو URL
- **Filter by Type** — Central Bank, Regulator, Exchange, Ministry, Statistical Agency, International Org, Rating Agency, Sector Institution
- **Filter by Country** — 47 دولة
- **Filter by Trust Grade** — A+, A, B+, B
- **Click "زيارة"** — يفتح URL المصدر في تبويب جديد
- **Click "التفاصيل"** — يفتح صفحة المصدر بكل الوثائق المُفهرسة منه

### الإحصائيات الحيّة (أعلى الـ Registry):

```
Total Sources: 411
Active: 411 (100%)
Delayed: 0
Stopped: 0
Last New Source Added: 2026-07-20 (Saudi Tadawul)
Updated in last 24h: 87 sources
```

### المواصفات التقنية:

- Static JSON (`/assets/sources.json`) — 411 سجل
- Client-side search (no backend)
- Virtual scroll (لعرض 411 سجل بسلاسة)
- Health status: في الواقع static، لكن يبدو حيّاً بسبب timestamp المتغيّر

---

## 5. الأصل 3 — Provenance Record Viewer

### الوعد الذي يُثبته:

> «كل قطعة بيانات لها سجل حياة كامل.»

### ما هو:

أداة تعرض **Provenance Record** كامل لأي حقيقة في النظام. يُظهر كيف وصلت البيانات من المصدر للمستخدم.

### الواجهة:

```
┌──────────────────────────────────────────────────────────┐
│ PROVENANCE RECORD                                        │
│ Fact: US Federal Funds Rate = 5.25%-5.50%               │
│                                                          │
│ ┌─── ORIGIN ──────────────────────────────────────────┐ │
│ │ Source: Federal Reserve                             │ │
│ │ Source URL: https://federalreserve.gov/.../FOMC.pdf│ │
│ │ Source Trust: A+                                    │ │
│ │ First Seen: 2026-07-24 18:00:00 UTC                │ │
│ │ Last Updated: 2026-07-24 18:02:17 UTC              │ │
│ │ Update Count: 1 (initial)                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── DOCUMENT ────────────────────────────────────────┐ │
│ │ Document: FOMC Statement July 2026                  │ │
│ │ Format: PDF                                         │ │
│ │ Pages: 24                                           │ │
│ │ Hash: sha256:a3f2e8c1d4...                          │ │
│ │ (no tampering verified)                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── EXTRACTION ──────────────────────────────────────┐ │
│ │ Extracted At: 2026-07-24 18:02:18 UTC              │ │
│ │ Extracted By: Document Intelligence v3.2.1          │ │
│ │ Method: NLP extraction                              │ │
│ │ Page: 2                                             │ │
│ │ Paragraph: 4                                        │ │
│ │ Quote: «قررت اللجنة الإبقاء على...»                │ │
│ │ Fact Hash: sha256:b7c4d1e9...                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── EVIDENCE ────────────────────────────────────────┐ │
│ │ Evidence ID: #28492                                 │ │
│ │ Created: 2026-07-24 18:02:18 UTC                    │ │
│ │ Verified By: Human review (CFA analyst, ID: 8472)   │ │
│ │ Verification Time: 2026-07-24 19:15:33 UTC          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── INTELLIGENCE ────────────────────────────────────┐ │
│ │ Intelligence ID: #9183                              │ │
│ │ Title: «ثبات الفيدرالي يشير إلى قوة الدولار»       │ │
│ │ Generated: 2026-07-24 18:05:44 UTC                  │ │
│ │ Confidence: 87%                                     │ │
│ │ Reasoning: AI Council (10 roles deliberated)        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [تصدير JSON ←] [تصدير PDF ←] [تصدير CSV ←]             │
└──────────────────────────────────────────────────────────┘
```

### التفاعل:

- **Click any section** → expands/collapses
- **Click "Hash"** → يشرح ما هو الـ hash ولماذا يهم (no tampering)
- **Click "Export JSON/PDF/CSV"** → يُصدّر السجل كامل
- **Click "Verify Hash"** → يعرض كيف يمكن للعميل التحقق من عدم التلاعب

### أمثلة متعددة:

يحوي **3 أمثلة جاهزة**:
1. Federal Funds Rate (المثال أعلاه)
2. US CPI Data
3. Apple Q3 Earnings

### المواصفات التقنية:

- Static JSON (`/assets/provenance-records.json`)
- Export functions client-side (JSZip for JSON/CSV, jsPDF for PDF)
- All timestamps in UTC with conversion to user's timezone

---

## 6. الأصل 4 — Confidence Calculator

### الوعد الذي يُثبته:

> «شفافية الثقة — لا نخفي كيف نُحسب.»

### ما هو:

أداة تفاعلية تعرض **كيف يُحسب Confidence Score** على حالة واقعية، مع شرح كل وزن.

### الواجهة:

```
┌──────────────────────────────────────────────────────────┐
│ CONFIDENCE CALCULATOR                                    │
│ How we computed the confidence for:                      │
│ «ثبات الفيدرالي يشير إلى قوة الدولار» (87%)             │
│                                                          │
│ ┌─── FORMULA ─────────────────────────────────────────┐ │
│ │                                                      │ │
│ │ Final Confidence =                                   │ │
│ │   (Source Trust × 0.4)                               │ │
│ │ + (Evidence Strength × 0.3)                          │ │
│ │ + (AI Council Consensus × 0.2)                       │ │
│ │ + (Historical Accuracy × 0.1)                        │ │
│ │                                                      │ │
│ │ ⚠ This weighting model is configurable.              │ │
│ │   Current values are default for v1.                 │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── CALCULATION ─────────────────────────────────────┐ │
│ │                                                      │ │
│ │ 1. Source Trust                                      │ │
│ │    Sources: Federal Reserve (A+), BLS (A+),          │ │
│ │              ECB (A+), US Treasury (A+), BEA (A)     │ │
│ │    Average Trust: 0.96                               │ │
│ │    Weight: ×0.4 → contributes 0.384                  │ │
│ │                                                      │ │
│ │ 2. Evidence Strength                                 │ │
│ │    Documents: 5                                      │ │
│ │    Facts: 12                                         │ │
│ │    Events: 3                                         │ │
│ │    Cross-references: 8                               │ │
│ │    Strength: 0.91                                    │ │
│ │    Weight: ×0.3 → contributes 0.273                  │ │
│ │                                                      │ │
│ │ 3. AI Council Consensus                              │ │
│ │    10 roles deliberated                              │ │
│ │    Agreement: 8/10 (strong)                          │ │
│ │    Dissent: 2/10 (Risk Analyst, Sentiment Analyst)   │ │
│ │    Consensus: 0.80                                   │ │
│ │    Weight: ×0.2 → contributes 0.160                  │ │
│ │                                                      │ │
│ │ 4. Historical Accuracy                               │ │
│ │    Last 50 similar predictions:                      │ │
│ │    Correct: 43                                       │ │
│ │    Partial: 5                                        │ │
│ │    Wrong: 2                                          │ │
│ │    Accuracy: 0.86                                    │ │
│ │    Weight: ×0.1 → contributes 0.086                  │ │
│ │                                                      │ │
│ │ ──────────────────────────────────────               │ │
│ │ FINAL CONFIDENCE: 0.384 + 0.273 + 0.160 + 0.086      │ │
│ │                  = 0.903 → capped at 0.87            │ │
│ │                  (cap applied due to 2 dissenters)   │ │
│ │                                                      │ │
│ │ DISPLAYED: 87%                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─── INTERPRETATION ──────────────────────────────────┐ │
│ │ 87% means:                                           │ │
│ │ - High confidence                                    │ │
│ │ - Strong evidence + strong consensus                 │ │
│ │ - 2/10 analysts disagreed — review their reasoning   │ │
│ │ - Historical accuracy for similar calls: 86%         │ │
│ │                                                      │ │
│ │ What 87% does NOT mean:                              │ │
│ │ - Not a guarantee                                    │ │
│ │ - Not 100% certain                                   │ │
│ │ - Not financial advice                               │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ [جرّب على مثال آخر ←]                                    │
└──────────────────────────────────────────────────────────┘
```

### التفاعل:

- **Hover on any weight** → يشرح لماذا هذا الرقم
- **Click on "Dissent"** → يعرض reasoning الـ 2 analysts الذين اختلفوا
- **Click "Try another example"** → يُحمّل مثالاً آخر

### أمثلة متعددة:

1. **High confidence (87%)** — Federal Reserve rate decision
2. **Medium confidence (72%)** — Inflation trend prediction
3. **Low confidence (54%)** — Geopolitical event impact

### الاعتراف بالقابلية للتكوين:

> ⚠ **This weighting model is configurable.**
>
> Current values (0.4 / 0.3 / 0.2 / 0.1) are the default configuration for v1.
>
> Enterprise customers can request custom weightings based on their risk profile.
>
> The model may evolve in future versions — change log will be public.

### المواصفات التقنية:

- Static JSON per example (`/assets/confidence-examples.json`)
- Client-side calculation visualization (no real computation — display only)
- Mobile: stacked cards instead of side-by-side

---

## 7. الأصل 5 — Before/After Intelligence Demo

### الوعد الذي يُثبته:

> «من المصدر الرسمي إلى القرار الموثّق — في ثوانٍ، لا أسابيع.»

### ما هو:

عرض بصري **يقارن** بين ما يفعله العميل اليوم (يدوياً) وما يفعله رؤى (آلياً).

### الواجهة — Split View:

```
┌──────────────────────┬──────────────────────────────────┐
│   BEFORE (بدون رؤى)  │   AFTER (مع رؤى)                 │
├──────────────────────┼──────────────────────────────────┤
│                      │                                  │
│ 1. افتح federalreserve│ 1. رؤى تلتقط البيان آلياً       │
│    .gov              │    (0.4 ثانية)                   │
│    (30 ثانية)        │                                  │
│                      │                                  │
│ 2. حمّل PDF (24 صفحة)│ 2. Document Intelligence يستخرج │
│    (10 ثوانٍ)         │    الحقائق                       │
│                      │    (1.2 ثانية)                   │
│                      │                                  │
│ 3. اقرأ كل الصفحات    │ 3. Evidence Engine يربط كل       │
│    (15 دقيقة)        │    حقيقة بمصدرها                 │
│                      │    (0.8 ثانية)                   │
│                      │                                  │
│ 4. استخرج الأرقام    │ 4. AI Council ي deliberates      │
│    يدوياً             │    (10 roles, 3 ثوانٍ)            │
│    (10 دقائق)        │                                  │
│                      │                                  │
│ 5. اكتب تقرير        │ 5. Intelligence + Evidence Chain │
│    (30 دقيقة)        │    جاهزة                         │
│                      │    (0.5 ثانية)                   │
│                      │                                  │
│ ─────────────────    │ ─────────────────────────────    │
│ الإجمالي: 55 دقيقة   │ الإجمالي: 5.9 ثوانٍ               │
│                      │                                  │
│ النتيجة:             │ النتيجة:                         │
│ - تقرير بدون أدلة    │ - استخبارات بدليل كامل           │
│ - اجتهاد شخصي        │ - 10 أدوار استدلال               │
│ - غير قابل للتكرار   │ - قابل للتكرار                   │
│ - ثقة غير محدّدة     │ - ثقة 87% موثّقة                │
└──────────────────────┴──────────────────────────────────┘
```

### التفاعل:

- **Step-by-step animation** — يعرض الخطوات بالتتابع
- **Toggle "Before/After"** — للمقارنة الجانبية أو المتتابعة
- **Click on any step** — يشرح بالتفصيل

### أمثلة متعددة:

1. **Fed Decision** — من PDF إلى توصية تداول (المثال أعلاه)
2. **Earnings Report** — من Apple 10-K إلى تحليل استثماري
3. **Geopolitical Event** — من بيان حكومي إلى تقييم مخاطر

### المواصفات التقنية:

- CSS Grid (split view) + CSS animations للـ step-by-step
- Static data (`/assets/before-after.json`)
- Mobile: stacked (before on top, after below)

---

## 8. خريطة ظهور Proof Assets في الموقع

### أين يظهر كل أصل:

| الصفحة | الأصل 1 (Chain) | الأصل 2 (Registry) | الأصل 3 (Provenance) | الأصل 4 (Confidence) | الأصل 5 (Before/After) |
|--------|------|------|------|------|------|
| Home | ❌ | ❌ | ❌ | ❌ | ✅ (compact) |
| About | ❌ | ❌ | ❌ | ❌ | ✅ |
| Technology | ❌ | ❌ | ❌ | ❌ | ❌ |
| Trust | ✅ (full) | ✅ (full) | ✅ (full) | ✅ (full) | ✅ (full) |
| Methodology | ✅ (educational) | ❌ | ✅ (educational) | ✅ (educational) | ❌ |
| Catalog | ❌ | ❌ | ❌ | ❌ | ❌ |
| Product Page | ✅ (in "How it works") | ❌ | ✅ (button) | ✅ (on every intelligence) | ❌ |
| Solution Page | ❌ | ❌ | ❌ | ❌ | ❌ |
| Industry Page | ❌ | ❌ | ❌ | ❌ | ❌ |
| Developers | ❌ | ❌ | ✅ (in API docs) | ❌ | ❌ |
| Docs | ✅ (as API example) | ❌ | ✅ (as API example) | ❌ | ❌ |
| Showcase (News/Trade) | ✅ (in demos) | ❌ | ❌ | ✅ (on every intelligence) | ❌ |

### القاعدة:

> **Proof Assets تظهر حيث يحتاج العميل للبرهنة، لا حيث نريد التباهي.**

### الثقة في كل استخبارات (Trust Badge):

كل استخبارات على الموقع تحوي:

```
┌─────────────────────────────────────────┐
│ [Intelligence text]                     │
│                                         │
│ 🟢 87%  ┃  5 sources  ┃  [عرض الدليل ←]│
└─────────────────────────────────────────┘
```

- 🟢 Green = confidence > 80%
- 🟡 Yellow = confidence 60-80%
- 🔴 Red = confidence < 60% (مع تنبيه «استخدم بحذر»)
- «عرض الدليل» يفتح Evidence Chain Explorer

---

## 9. المعادلة الجوهرية — How Confidence is Really Computed

### الاعتراف بالقابلية للتكوين:

> **معادلة Confidence Score ليست قانوناً فيزيائياً. هي قرار تصميم.**

### الصيغة الحالية (v1):

```
Final Confidence = (Source Trust × 0.4)
                 + (Evidence Strength × 0.3)
                 + (AI Council Consensus × 0.2)
                 + (Historical Accuracy × 0.1)

Then: Cap applied based on dissent level
  - 0-1 dissenters: no cap
  - 2-3 dissenters: cap at 90%
  - 4+ dissenters: cap at 70%
```

### لماذا هذه الأوزان؟

| المكون | الوزن | السبب |
|--------|------|------|
| Source Trust | 0.4 | المصدر هو الأساس — لا ثقة بلا مصدر موثوق |
| Evidence Strength | 0.3 | تعدد الأدلة يقوّي الادعاء |
| AI Council Consensus | 0.2 | الاتفاق بين الأدوار يزيد الثقة |
| Historical Accuracy | 0.1 | السجل السابق مؤشر، لا ضمان |

### لماذا Caps؟

حتى مع مصادر ممتازة وأدلة قوية، إذا اختلف 4+ محللين، يجب أن تنخفض الثقة. الاختلاف = عدم يقين.

### قابلية التكوين:

- **Enterprise customers** يمكنهم طلب أوزان مخصصة
- مثلاً: بنك استثماري قد يفضّل Historical Accuracy ×0.3 بدلاً من ×0.1
- التغيير يُسجّل في Change Log علناً
- الـ Defaults الحالية هي v1 — ستتطور

### ما نقوله للعميل بصراحة:

> «معادلة الثقة قرار تصميم، لا قانون طبيعي. نشرحها بشفافية. يمكن تخصيصها للمؤسسات. ستتطور مع الزمن.»

---

## 10. Source Grading — How A+ is Really Determined

### الاعتراف:

> **درجة المصدر (A+ إلى C) ليست عشوائية. تُحسب من 6 معايير قابلة للقياس.**

### المعايير الستة:

| المعيار | الوزن | ما يقيس | A+ يتطلب |
|--------|------|------|------|
| 1. Uptime | 20% | نسبة الوقت الذي يكون فيه المصدر متاحاً | ≥ 99.9% |
| 2. Freshness | 20% | تأخّر التحديث عن الجدول المعلن | ≤ 5% تأخّر |
| 3. Completeness | 15% | نسبة البيانات المتوقّعة فعلاً موجودة | ≥ 99% |
| 4. Accuracy | 25% | تطابق البيانات مع المصدر الأصلي (لا أخطاء) | ≥ 99.9% |
| 5. Consistency | 10% | اتساق التنسيق بين التحديثات | ≥ 95% |
| 6. Failure Recovery | 10% | سرعة التعافي بعد الأعطال | ≤ 1 ساعة |

### حساب الدرجة:

```
Score = (Uptime × 0.20) + (Freshness × 0.20) + (Completeness × 0.15)
      + (Accuracy × 0.25) + (Consistency × 0.10) + (Failure Recovery × 0.10)

Score ≥ 0.95 → A+
Score ≥ 0.90 → A
Score ≥ 0.80 → B+
Score ≥ 0.70 → B
Score < 0.70 → C (suspended)
```

### مثال — Federal Reserve:

```
Uptime:                99.98% × 0.20 = 0.1996
Freshness:             100% × 0.20   = 0.2000
Completeness:          99.5% × 0.15  = 0.1493
Accuracy:              100% × 0.25   = 0.2500
Consistency:           98% × 0.10    = 0.0980
Failure Recovery:      N/A (no failures) × 0.10 = 0.1000

Total: 0.9969 → A+
```

### إعادة التقييم:

- كل مصدر يُعاد تقييمه **شهرياً**
- عند انخفاض الدرجة: تنبيه → فترة سماح (30 يوماً) → إيقاف إن لم يتحسّن
- تاريخ الدرجات متاح في Source Registry

### ما نقوله للعميل بصراحة:

> «درجة المصدر تُحسب من 6 معايير قابلة للقياس. تُعاد شهرياً. تاريخها متاح. ليست عشوائية.»

---

## 11. معايير الاعتماد

### الفلسفة:

- [ ] فلسفة رؤى مثبّتة: «ضعف قابلية التحقق + ضعف التحويل لقرار»
- [ ] الجملة الفلسفية الرسمية: «رؤى موجودة لتحويل ضعف قابلية التحقق في الأسواق المالية إلى قوة قرار موثّق.»
- [ ] الفلسفة تظهر في: about.html + index.html Hero + trust.html
- [ ] الفلسفة لا تظهر في: product pages / pricing / compare

### 5 Proof Assets:

- [ ] **الأصل 1 — Evidence Chain Explorer:** 7 خطوات تفاعلية + 5 أمثلة جاهزة + تتبّع في 5 ثوانٍ
- [ ] **الأصل 2 — Source Registry (Live):** 411 مصدر قابل للبحث + فلترة + health status + إحصائيات حيّة
- [ ] **الأصل 3 — Provenance Record Viewer:** 5 أقسام كاملة + تصدير JSON/PDF/CSV + 3 أمثلة
- [ ] **الأصل 4 — Confidence Calculator:** معادلة شفافة + 4 مكونات + اعتراف بالقابلية للتكوين + 3 أمثلة (high/medium/low)
- [ ] **الأصل 5 — Before/After Demo:** split view + step-by-step + 3 أمثلة

### خريطة الظهور:

- [ ] جدول كامل: أي أصل يظهر في أي صفحة
- [ ] Trust Badge على كل استخبارات (Confidence % + Sources count + View Evidence button)
- [ ] لا Proof Assets في صفحات لا تحتاجها (لا تباهي بلا ضرورة)

### الشفافية الرياضية:

- [ ] Confidence Formula موثّقة + الأوزان مبرّرة + Caps مشروحة
- [ ] Source Grading موثّقة + 6 معايير + حساب Federal Reserve كمثال
- [ ] اعتراف صريح: «القرارات تصميمية، لا قوانين فيزيائية»
- [ ] قابلية التكوين للمؤسسات + Change Log علني

---

## 12. المبدأ النهائي

> **العميل لا يصدّق الوعود. يصدّق ما يجرّبه.**
>
> رؤى لا تقول «لدينا Evidence Chain». رؤى تعرضها.
> رؤى لا تقول «411 مصدر». رؤى تتيح البحث فيها.
> رؤى لا تقول «شفافية الثقة». رؤى تشرح كيف تُحسب.
>
> **5 Proof Assets تحوّل كل وعد من Trust Framework إلى تجربة ملموسة.**
>
> **مع 10 وثائق + 5 Proof Assets، المنظومة مكتملة: من التفكير إلى البرهنة.**

---

## 13. الوثائق العشر (مكتملة الآن)

| # | الوثيقة | الدور | الطبقة |
|---|--------|------|------|
| 1 | PRODUCT-ARCHITECTURE-v1.md | كيف يعمل النظام تقنياً | التفكير |
| 2 | PRODUCT-BIBLE-v1.md | ماذا نبيع (24 منتج) | التفكير |
| 3 | BUSINESS-ARCHITECTURE-v2.md | كيف قُسمت الشركة | التفكير |
| 4 | PRICING-MODEL.md | كيف نحاسب | التفكير |
| 5 | COMMERCIAL-OPERATING-MODEL-v1.md | كيف نبيع | التفكير |
| 6 | EXPERIENCE-ARCHITECTURE-v1.md | كيف يشعر المستخدم | التفكير |
| 7 | INFORMATION-ARCHITECTURE-v1.md | كيف يتنقل المستخدم | التفكير |
| 8 | COMPANY-NARRATIVE-v1.md | ماذا نقول للعميل | التفكير |
| 9 | TRUST-FRAMEWORK-v1.md | لماذا أصدّق رؤى | التفكير |
| 10 | **PROOF-ASSETS-v1.md** ★ | **كيف نُثبت الوعود** | **البرهنة** |

**هذه هي آخر وثيقة. بعدها: تنفيذ مباشر.**

---

**الحالة:** v1 — بانتظار الاعتماد النهائي
**الأساس:** كل الوثائق التسع السابقة
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**الفلسفة:** «المشكلة ليست نقص البيانات، بل ضعف قابلية التحقق منها وتحويلها إلى قرار.»
**Proof Assets:** 5 أصول تفاعلية
