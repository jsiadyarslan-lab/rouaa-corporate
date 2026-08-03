# ROUAA · Implementation Readiness Checklist v1

> وثيقة قصيرة. ليست استراتيجية. ليست معمارية.
> هي **فحص جاهزية قبل أي HTML** — ما جاهز، ما Mock، ما الفجوات.
>
> تمنع الفريق من بدء HTML ثم اكتشاف فجوات في الأسبوع الثالث.

---

## جدول المحتويات

1. [القاعدة الذهبية](#1-القاعدة-الذهبية)
2. [حالة كل Proof Asset](#2-حالة-كل-proof-asset)
3. [حالة كل وعد في Trust Framework](#3-حالة-كل-وعد-في-trust-framework)
4. [البيانات المطلوبة لكل صفحة](#4-البيانات-المطلوبة-لكل-صفحة)
5. [الـ APIs المطلوبة (إن وُجدت)](#5-الـ-apis-المطلوبة-إن-وجِدت)
6. [خريطة Mock vs Real](#6-خريطة-mock-vs-real)
7. [الفجوات الحرجة (Blockers)](#7-الفجوات-الحرجة-blockers)
8. [خطة التنفيذ — Phase 1 أولاً](#8-خطة-التنفيذ--phase-1-أولاً)

---

## 1. القاعدة الذهبية

> **لا نَعِد بما لا نملك.**
>
> كل وعد على الموقع = إما Production Today أو Mock with clear label أو Roadmap.
>
> الرسالة لا تتقدّم على المنتج.

### 3 مستويات للجاهزية:

| المستوى | المعنى | كيف يظهر على الموقع |
|--------|------|------------------|
| 🟢 **Production Today** | يعمل فعلاً، بيانات حقيقية | بدون تنبيه |
| 🟡 **Mock (Labeled)** | UI كامل، بيانات ثابتة | شارة «Demo Data» صريحة |
| 🔴 **Roadmap** | مخطّط، غير منفّذ | قسم «Roadmap» منفصل، لا في الصفحة الرئيسية |

### القاعدة:

> **إذا كان شيء Roadmap — لا تضعه في الصفحة الرئيسية كأنه Production. ضعه في صفحة `/roadmap` أو في `About` تحت «What's Next».**

---

## 2. حالة كل Proof Asset

### الأصل 1 — Evidence Chain Explorer

| المكوّن | الحالة | ملاحظات |
|--------|------|------|
| UI (7 steps interactive) | 🟡 Mock | HTML/CSS/JS جاهز للتنفيذ |
| 5 أمثلة جاهزة | 🟡 Mock | بيانات JSON ثابتة (`/assets/evidence-chains.json`) |
| رابط "Verify" يفتح federalreserve.gov | 🟢 Production | رابط حقيقي |
| رابط "Download PDF" | 🟡 Mock | روابط لـ PDFs حقيقية محفوظة محلياً |
| تتبّع من Step 7 إلى Step 1 في < 5 ثوانٍ | 🟢 Production (بعد التنفيذ) | pure client-side |
| تصدير JSON | 🟢 Production | client-side JS |

**الحكم:** جاهز للتنفيذ كـ Mock كامل. البيانات ثابتة لكنها حقيقية المصدر.

---

### الأصل 2 — Source Registry (Live)

| المكوّن | الحالة | ملاحظات |
|--------|------|------|
| 411 سجل مصدر | 🟡 Mock | JSON ثابت (`/assets/sources.json`) — لكن الأسماء والروابط حقيقية |
| Search & Filter | 🟢 Production | client-side |
| Virtual scroll | 🟢 Production | client-side |
| Health status "live" | 🟡 Mock | timestamps ثابتة (تُحدّث يدوياً دورياً) |
| "Updated in last 24h: 87 sources" | 🟡 Mock | رقم ثابت، يُحدّث يدوياً |
| "Last New Source Added" | 🟡 Mock | ثابت |

**الحكم:** قابل للتنفيذ. "Live" هي تجربة UI، لكن البيانات ثابتة. مقبول للموقع التسويقي (لا للمستخدم المؤسسي الذي سيدخل النظام الفعلي).

**التحذير:** يجب وضع شارة صغيرة: «Sample data — production registry available to enterprise customers»

---

### الأصل 3 — Provenance Record Viewer

| المكوّن | الحالة | ملاحظات |
|--------|------|------|
| 5-section expandable UI | 🟢 Production | client-side |
| 3 أمثلة جاهزة | 🟡 Mock | JSON ثابت |
| تصدير JSON/PDF/CSV | 🟢 Production | client-side (JSZip + jsPDF) |
| Hashes (sha256) | 🟢 Production | hashes حقيقية محسوبة من بيانات حقيقية |
| "Verify Hash" | 🟡 Mock | يشرح المفهوم، لا يتحقق فعلاً |

**الحكم:** جاهز للتنفيذ كـ Demo. الـ Hashes حقيقية لكن ثابتة.

---

### الأصل 4 — Confidence Calculator

| المكوّن | الحالة | ملاحظات |
|--------|------|------|
| Formula breakdown UI | 🟢 Production | client-side |
| 3 أمثلة (high/medium/low) | 🟡 Mock | JSON ثابت |
| Hover explanations | 🟢 Production | client-side |
| "Try another example" | 🟢 Production | client-side |
| Configurability disclosure | 🟢 Production | نص ثابت |
| Historical Accuracy data | 🟡 Mock | أرقام ثابتة (لا تاريخ فعلي بعد) |

**الحكم:** جاهز. يجب وضع إخلاء مسؤولية: «Default configuration v1 — actual model in production may differ. Historical accuracy based on limited backtest.»

---

### الأصل 5 — Before/After Demo

| المكوّن | الحالة | ملاحظات |
|--------|------|------|
| Split view UI | 🟢 Production | client-side |
| Step-by-step animation | 🟢 Production | CSS animations |
| 3 أمثلة (Fed, Apple, Geopolitical) | 🟡 Mock | JSON ثابت |
| "5.9 seconds" claim | 🟡 Mock | تقدير، لا قياس فعلي في كل الحالات |

**الحكم:** جاهز. لكن «5.9 seconds» يجب أن يصبح «~6 seconds» أو «under 10 seconds» لتجنّب الادعاء الدقيق غير الموثّق.

---

## 3. حالة كل وعد في Trust Framework

### Production Today (🟢 جاهز للوعد على الموقع):

- ✅ 411 مصدر رسمي مُفهرس (الأسماء والروابط حقيقية)
- ✅ Evidence Chain (7 steps UI — ببيانات حقيقية ثابتة)
- ✅ Source Registry قابل للبحث (client-side)
- ✅ Provenance Record (UI + تصدير)
- ✅ Confidence Score (يُحسب بمعادلة شفافة — حسب الإعداد الافتراضي)
- ✅ Audit Trail (logging — يُنفّذ في الـ backend)
- ✅ Document Intelligence (NLP extraction — يعمل)
- ✅ Fact Engine (يعمل)
- ✅ Knowledge Graph (يعمل — interactive SVG)

### Mock / Demo (🟡 يظهر مع شارة "Demo"):

- 🟡 Health status "live" للـ 411 مصدر (ثابت حالياً)
- 🟡 Historical Accuracy data (أرقام محدودة)
- 🟡 "Updated in last 24h" (ثابت يدوياً)
- 🟡 بعض الأمثلة في Evidence Chain (بيانات ثابتة)

### Roadmap (🔴 لا يظهر في الصفحة الرئيسية):

- 🔴 Human Review (5 mandatory cases) — **ليس منفّذاً بالكامل**
  - الحالة: بعض الحالات تتم، لكن ليس كـ mandatory pipeline
  - العرض: في `/roadmap` فقط
- 🔴 Conflict Resolution (4-step automated) — **جزئي**
  - الحالة: الكشف آلي، لكن العرض والتنبيه غير آليين بالكامل
  - العرض: في `/roadmap`
- 🔴 Error Reports علنية — **غير منفّذ**
  - الحالة: لا يوجد public error report page بعد
  - العرض: في `/roadmap`
- 🔴 Custom weightings للمؤسسات — **غير منفّذ**
  - الحالة: الـ default يعمل، لكن لا UI للتخصيص
  - العرض: في `/roadmap`
- 🔴 Retention 7-10 سنوات — **سياسة، لا تطبيق**
  - الحالة: غير منفّذ تقنياً (يحتاج storage infrastructure)
  - العرض: في `/roadmap` أو `legal`

---

## 4. البيانات المطلوبة لكل صفحة Phase 1

### الصفحات الـ 10 لـ Phase 1 (Corporate Core):

#### 1. `index.html` (Home)
**يحتاج:**
- Logo + tagline (جاهز)
- Hero H1 (جاهز — Narrative v1)
- "What Do You Want?" selector (4 options — جاهز)
- Layer Diagram بسيط (جاهز)
- 4 Business Lines preview (جاهز)
- Industries strip (6 sectors — جاهز)
- Positioning (3 messages — جاهز)
- Trust signals (أرقام — جاهز)
- Final CTA (جاهز)

**الحالة:** 🟢 جاهز بالكامل للتنفيذ

---

#### 2. `about.html`
**يحتاج:**
- قصة الشركة (يُكتب — يستند لـ Philosophy)
- الفلسفة (جاهز — Proof Assets v1)
- Layer Diagram (جاهز)
- Before/After Demo (compact version — جاهز)
- Team section (يُكتب — قد يكون placeholder)
- Vision (جاهز — Narrative v1)

**الحالة:** 🟡 يحتاج كتابة محتوى قصة الشركة + team placeholder

---

#### 3. `trust.html` (Trust Center)
**يحتاج:**
- 7 Transparency Principles (جاهز)
- Evidence Chain Explorer (🟡 Mock جاهز)
- Source Registry (🟡 Mock جاهز)
- Provenance Record Viewer (🟡 Mock جاهز)
- Confidence Calculator (🟡 Mock جاهز)
- Before/After Demo (🟡 جاهز)
- Error Reports section (🔴 Roadmap — يُعرض كـ "Coming Q4 2026")
- Status Page (🔴 Roadmap — link to status.rouaa.ai placeholder)

**الحالة:** 🟡 يحتاج توضيح ما هو Production vs Demo vs Roadmap بصراحة

---

#### 4. `catalog.html`
**يحتاج:**
- 24 product cards (جاهز — من Product Bible)
- 4 filter classifications (جاهز — IA v1)
- Search bar (جاهز)
- Filter sidebar (جاهز)

**الحالة:** 🟢 جاهز بالكامل

---

#### 5. `media-technologies.html`
**يحتاج:**
- BL1 landing (جاهز)
- 7 product cards (جاهز)
- Live Intelligence Feed demo (🟡 Mock — 5 rows ثابتة)

**الحالة:** 🟢 جاهز

---

#### 6. `trading-technologies.html`
**يحتاج:**
- BL2 landing (جاهز)
- 9 product cards (جاهز)
- Trading Trust Model (يُضاف — انظر القسم 5)
- Decision cycle visualization (جاهز)

**الحالة:** 🟡 يحتاج إضافة Trading Trust Model

---

#### 7. `developers.html` (Platform Access)
**يحتاج:**
- API overview (جاهز)
- SDK overview (جاهز)
- White Label overview (جاهز)
- Deployment options (جاهز)
- API Explorer (🟡 Mock — 5 tabs ثابتة)
- Code sample (جاهز)

**الحالة:** 🟢 جاهز

---

#### 8. `solutions.html`
**يحتاج:**
- 7 Solution cards (جاهز — من COM v1)
- Bundle pricing (جاهز — من PRICING-MODEL.md)

**الحالة:** 🟢 جاهز

---

#### 9. `pricing.html`
**يحتاج:**
- 6-tier pyramid (جاهز)
- Products pricing tables (جاهز)
- Solutions pricing (جاهز)
- Enterprise "Contact Sales" (جاهز)
- Professional Services (جاهز)
- FAQ (يُكتب)

**الحالة:** 🟡 يحتاج كتابة FAQ

---

#### 10. `contact.html`
**يحتاج:**
- Form (3 fields: Name, Email, Company — جاهز)
- Calendly integration (يُضيف — embed widget)
- Office/contact info (يُكتب)
- Sales team contact (يُكتب)

**الحالة:** 🟡 يحتاج Calendly + sales info

---

## 5. الـ APIs المطلوبة (إن وُجدت)

### Phase 1 — لا APIs حقيقية مطلوبة:

كل Proof Assets في Phase 1 تستخدم:
- Static JSON files (`/assets/*.json`)
- Client-side JavaScript (no backend calls)
- No real-time data

### Phase 2+ (بعد Phase 1):

قد يحتاج:
- `/api/v1/sources` (لجعل Registry حيّ فعلاً)
- `/api/v1/evidence/{id}` (لجعل Evidence Chain ديناميكية)
- `/api/v1/intelligence` (لـ Live Feed حقيقي)
- Calendly API (لـ contact form)
- Formspree / similar (لـ form submission بدون backend)

**لكن Phase 1 لا يحتاج أي من هذا.** كل شيء client-side.

---

## 6. خريطة Mock vs Real

### ما هو حقيقي 100%:

- ✅ أسماء المصادر الـ 411 (Federal Reserve, ECB, BLS, etc.)
- ✅ روابط المصادر (URLs حقيقية)
- ✅ النصوص الاقتباسية (من بيانات حقيقية)
- ✅ Document hashes (محسوبة من PDFs حقيقية)
- ✅ كل المحتوى النصي (من الوثائق الـ 10)

### ما هو Demo Data:

- 🟡 timestamps في Evidence Chain (ثابتة لكن منطقية)
- 🟡 "Updated in last 24h: 87 sources" (رقم تقديري)
- 🟡 Historical Accuracy: 43/50 correct (تقدير مبني على تقييم داخلي محدود)
- 🟡 Health status percentages (ثابتة)
- 🟡 "5.9 seconds" في Before/After (تقدير)

### ما هو Roadmap (لا يظهر في Production):

- 🔴 Human Review pipeline (5 mandatory cases)
- 🔴 Public Error Reports page
- 🔴 Status page (status.rouaa.ai)
- 🔴 Custom confidence weightings UI
- 🔴 7-10 year retention infrastructure
- 🔴 Conflict Resolution UI (automated display)

### القاعدة للـ Roadmap:

> كل Roadmap item يظهر في صفحة `/roadmap` منفصلة، أو في `about.html` تحت «What's Next».
>
> **لا يظهر في الصفحة الرئيسية أو في صفحات المنتجات كأنه Production.**

---

## 7. الفجوات الحرجة (Blockers)

### Blockers يجب حلّها قبل بدء HTML:

#### Blocker 1 — Trading Trust Model مفقود

**المشكلة:** Trust Framework يغطي البيانات الاقتصادية (Sources, Evidence, Confidence). لكن التداول يحتاج إضافة:
- لا ضمان أرباح
- لا توصيات مضمونة
- إدارة مخاطر
- Outcome tracking

**الحل:** إضافة قسم "Trading Trust Model" في Trust Framework v1.1 (يُكتب قبل HTML).

#### Blocker 2 — "411 sources" wording

**المشكلة:** الرقم قوي لكن قد يُساء فهمه.

**الحل:** التغيير من:
- ❌ «لدينا 411 مصدر»
- ✅ «شبكة مصادر رسمية عالمية قابلة للتوسع — التغطية الحالية: 411 مصدر موثّق»

#### Blocker 3 — Bloomberg price comparison

**المشكلة:** لا تزال تظهر في بعض الأماكن رغم التعديل.

**الحل:** حذف كامل من كل الوثائق. الاستبدال:
- ❌ «أرخص من Bloomberg بـ 70%»
- ✅ «رؤى طبقة مختلفة — لا بديل أرخص لـ Bloomberg»

#### Blocker 4 — 24 product count للعميل

**المشكلة:** 24 رقم كبير يربك العميل.

**الحل:** العميل لا يرى «24». يرى:
```
I need:
- Market Intelligence → Media Technologies
- Trading Intelligence → Trading Technologies
- API Intelligence → Platform Access
- Enterprise Solutions → Solutions
```
الـ 24 تظهر فقط في Catalog (بعد الدخول).

---

## 8. خطة التنفيذ — Phase 1 أولاً

### لا 60 صفحة دفعة واحدة. بل Phase 1 (10 صفحات):

#### Phase 1 — Corporate Core (10 صفحات):

1. `index.html` (Home)
2. `about.html` (الهوية + الفلسفة)
3. `trust.html` (Trust Center — مع 5 Proof Assets)
4. `catalog.html` (كل المنتجات، نظرة عامة)
5. `media-technologies.html` (BL1 landing)
6. `trading-technologies.html` (BL2 landing — مع Trading Trust Model)
7. `developers.html` (Platform Access)
8. `solutions.html` (7 Solutions Bundles)
9. `pricing.html` (Pricing Pyramid)
10. `contact.html` (Sales contact)

**المخرج:** موقع مؤسسي كامل يغطي رحلة العميل من Awareness إلى Decision.

#### Phase 2 — Product Detail Pages (16 صفحة):

بعد اعتماد Phase 1:
- 7 صفحات منتجات Media
- 9 صفحات منتجات Trading

#### Phase 3 — Industry + Solutions Detail (13 صفحة):

- 6 صفحات Industries
- 7 صفحات Solutions detail

#### Phase 4 — Resources + Compare (8+ صفحات):

- docs, case-studies, blog, methodology, technology
- compare/bloomberg, compare/refinitiv, compare/factset

#### Phase 5 — Showcases + Misc (4 صفحات):

- news.html (Showcase)
- trade.html (Showcase)
- careers.html
- legal.html

**الإجمالي النهائي:** ~51 صفحة (عضوي — قد يتغيّر)

---

## 9. معايير الاعتماد

### Blockers (يجب حلّها قبل HTML):

- [ ] **Blocker 1:** إضافة Trading Trust Model لـ Trust Framework
- [ ] **Blocker 2:** تحديث wording لـ «411 sources» في كل الوثائق
- [ ] **Blocker 3:** حذف كل مقارنات Bloomberg السعرية
- [ ] **Blocker 4:** إخفاء «24 products» عن العميل — Catalog يعرضها فقط

### Production vs Mock vs Roadmap:

- [ ] كل Proof Asset موسوم بحالته (🟢/🟡/🔴)
- [ ] Roadmap items تظهر فقط في `/roadmap` أو `about#whats-next`
- [ ] Mock items تحوي شارة "Demo Data" صريحة
- [ ] Production items بلا شارة

### Phase 1 Readiness:

- [ ] 10 صفحات Phase 1 محدّدة
- [ ] كل صفحة من Phase 1: بياناتها جاهزة أو Mock محدّد
- [ ] لا APIs حقيقية مطلوبة لـ Phase 1 (client-side only)
- [ ] Calendly integration لـ contact.html (جاهز للإضافة)

### Phase 2+ Readiness:

- [ ] Phase 2-5 محدّدة (16+13+8+4 صفحات)
- [ ] لا يبدأ Phase 2 حتى يُعتمد Phase 1

---

## 10. المبدأ النهائي

> **الرسالة لا تتقدّم على المنتج.**
>
> ما لا نملكه نضعه في Roadmap.
> ما نملكه نَعِد به بصراحة.
> ما هو Mock نُسمّيه Mock.
>
> **هذه هي الوثيقة الأخيرة. بعدها: تنفيذ Phase 1 مباشرة.**

---

## 11. الوثائق العشر + Checklist (مكتملة الآن)

| # | الوثيقة | الدور |
|---|--------|------|
| 1 | PRODUCT-ARCHITECTURE-v1.md | كيف يعمل النظام تقنياً |
| 2 | PRODUCT-BIBLE-v1.md | ماذا نبيع (24 منتج) |
| 3 | BUSINESS-ARCHITECTURE-v2.md | كيف قُسمت الشركة |
| 4 | PRICING-MODEL.md | كيف نحاسب |
| 5 | COMMERCIAL-OPERATING-MODEL-v1.md | كيف نبيع |
| 6 | EXPERIENCE-ARCHITECTURE-v1.md | كيف يشعر المستخدم |
| 7 | INFORMATION-ARCHITECTURE-v1.md | كيف يتنقل المستخدم |
| 8 | COMPANY-NARRATIVE-v1.md | ماذا نقول للعميل |
| 9 | TRUST-FRAMEWORK-v1.md | لماذا أصدّق رؤى |
| 10 | PROOF-ASSETS-v1.md | كيف نُثبت الوعود |
| 11 | **IMPLEMENTATION-READINESS-CHECKLIST-v1.md** ★ | **ما جاهز / ما Mock / الفجوات** |

**هذه هي آخر وثيقة. بعدها: تنفيذ Phase 1.**

---

**الحالة:** v1 — بانتظار الاعتماد النهائي
**الأساس:** كل الوثائق العشر السابقة
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**Phase 1:** 10 صفحات Corporate Core
**Blockers:** 4 (يجب حلّها قبل HTML)
