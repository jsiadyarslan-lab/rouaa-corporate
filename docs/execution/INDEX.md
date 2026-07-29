# ROUAA Execution Documents

> **المرجع التنفيذي لبناء ROUAA.**
> هذه الوثائق لا تصف المنتج — بل تدير عملية بنائه.
> الوثائق التأسيسية في `docs/foundation/` هي مصدر الحقيقة.
> الوثائق هنا هي نظام التشغيل اليومي للبناء.

---

## 📋 ما هذا المجلد؟

هذا المجلد يحتوي على **وثائق إدارة التنفيذ** — البرامج، المهام، الخطط، والمناهج.

يختلف عن `docs/foundation/`:

| | Foundation | Execution |
|---|---|---|
| **السؤال** | ما هو ROUAA؟ | كيف نبنيه؟ |
| **الجمهور** | الاستراتيجيون، المعماريون، المطورون الجدد | فريق التنفيذ اليومي |
| **الدور** | مصدر الحقيقة طويل الأمد | خطة العمل اليومية |
| **التغيير** | نادر — فقط عند ظهور فجوة معمارية | متكرر — يتحدث مع كل Sprint |

---

## 🗂️ الوثائق التنفيذية

| # | الوثيقة | الدور | الحالة |
|---|---|---|---|
| **00** | [**ROUAA-MASTER-EXECUTION-BACKLOG-v1**](00-ROUAA-MASTER-EXECUTION-BACKLOG-v1.md) | **الـ Backlog الرئيسي — 7 Programs / 15+ Epics / 60+ Tasks / 6 Releases** | ✅ نشط |
| **01** | [**ROUAA-ENGINEERING-SPRINT-PLAN-v1**](01-ROUAA-ENGINEERING-SPRINT-PLAN-v1.md) | **خطة الـ Sprints — 16+ Sprints (أسبوعان لكل Sprint) من Sprint 0 Stabilization إلى Sprint 16+ Enterprise Scale** | ✅ نشط |
| **02** | [**ROUAA-TECHNICAL-ARCHITECTURE-IMPLEMENTATION-PLAN-v1**](02-ROUAA-TECHNICAL-ARCHITECTURE-IMPLEMENTATION-PLAN-v1.md) | **المعمارية التقنية — 8 طبقات + 6 Core Services + Knowledge Graph + AI Architecture + Search + APIs + Storage + Message Queue + Deployment + Observability + Security + Multi-Tenant + MVP** | ✅ نشط |
| **03** | [**ROUAA-ENGINEERING-SPECIFICATION-v1**](03-ROUAA-ENGINEERING-SPECIFICATION-v1.md) | **المواصفات الهندسية — Modular Monolith + Event-Driven / NestJS + Python + React / PostgreSQL + pgvector + Redis + BullMQ / Monorepo / 16 NestJS Modules / 7 Core Entities / 7 API Domains / 5 Workers / AI Standards / Testing / CI/CD / Coding Standards / Anti-Patterns** | ✅ نشط |
| **04** | [**ROUAA-MVP-BUILD-SPECIFICATION-v1**](04-ROUAA-MVP-BUILD-SPECIFICATION-v1.md) | **محددات بناء الـ MVP — 90 يومًا / 7 وحدات (Source + Document + Fact + Event + Evidence + Dashboard + AI) / 50 مصدر / Media Intelligence Suite MVP / 3 مراحل (Foundation 30 يوم + Intelligence 30 يوم + Productization 30 يوم) / 6 ميزات مؤجلة صراحةً** | ✅ نشط |
| **05** | [**ROUAA-MVP-IMPLEMENTATION-TASKS-v1**](05-ROUAA-MVP-IMPLEMENTATION-TASKS-v1.md) | **مهام التنفيذ — 13 Epics / 40+ Tasks / 11 Sprints / Critical Path (Sources→Documents→Facts→Events→Evidence→AI→Dashboard→Demo) / 5 ميزات مؤجلة / معايير الإكمال** | ✅ نشط |
| **06** | [**ROUAA-HOMEPAGE-MESSAGING-BLUEPRINT-v2**](06-ROUAA-HOMEPAGE-MESSAGING-BLUEPRINT-v2.md) | **تصحيح التموضع — Products في المقدمة / Verified Intelligence كطبقة تمييز / Hero بمنتجين (Trading + Financial Intelligence) / Navigation مصححة / 10 ممنوعات / 8 مطلوبات / قفل المفردات** | ✅ معتمد |
| **07** | [**ROUAA-TRADING-PLATFORM-MESSAGING-BLUEPRINT-v2**](07-ROUAA-TRADING-PLATFORM-MESSAGING-BLUEPRINT-v2.md) | **رسائل صفحة التداول — 5 Decision Capabilities (AI Council / Smart Charts / Scanner / Predictive / Executors) + 3 أسباب (Context / Evidence / Control) + مقارنة TradingView + 10 ممنوعات** | ✅ معتمد |
| **08** | [**ROUAA-FINANCIAL-INTELLIGENCE-MESSAGING-BLUEPRINT-v2**](08-ROUAA-FINANCIAL-INTELLIGENCE-MESSAGING-BLUEPRINT-v2.md) | **رسائل صفحة الذكاء المالي — 5 Capabilities + Trust Layer + Verification/Coverage/Speed + 7 output formats + Bloomberg/Reuters تكاملي + Trading integration + 10 ممنوعات** | ✅ معتمد |

---

## 🏗️ هيكل الـ Backlog

```text
PROGRAM-01  Intelligence Foundation
PROGRAM-02  Knowledge & Reasoning Platform
PROGRAM-03  Enterprise Platform
PROGRAM-04  Solution Suites
PROGRAM-05  Applications
PROGRAM-06  Developer Ecosystem
PROGRAM-07  Enterprise Operations
```

كل Program يحتوي على Epics. كل Epic يحتوي على Tasks. كل Task له:
- الأولوية (P0 / P1 / P2 / P3)
- المخرجات
- التبعيات
- الوثائق المرجعية (من `docs/foundation/`)

---

## 🚀 Release Roadmap

| Release | الهدف | Sprints | الحالة |
|---|---|---|---|
| Release 0 | Foundation Validation (Sources + Documents + Facts + Events + Evidence) | Sprint 0-2 | 🟢 مكتمل أو قريب |
| Release 1 | Intelligence Platform MVP (Knowledge Graph + Search + APIs + AI Assistant) | Sprint 3-5 | ⬜ |
| Release 2 | Media Intelligence MVP (News Engine + Reports + Publishing) | Sprint 6-8 | ⬜ |
| Release 3 | Research Intelligence MVP (Brief Generator + Deep Reports + Research Workspace) | Sprint 9-11 | ⬜ |
| Release 4 | Trading Intelligence MVP (Smart Charts + Portfolio + Trading Assistant) | Sprint 12-15 | ⬜ |
| Release 5 | Enterprise Platform (Multi-tenancy + Security + Billing + Deployment) | Sprint 16+ | ⬜ |

---

## 📅 Sprint Roadmap (from doc 01)

| Sprint | Name | Goal | Output |
|---|---|---|---|
| Sprint 0 | Project Stabilization | تثبيت البيئة قبل إضافة ميزات | Repository + CI/CD + Docs sync |
| Sprint 1 | Data Foundation | تثبيت طبقة البيانات | ROUAA Data Foundation v1 |
| Sprint 2 | Source Intelligence | تحويل المصادر إلى تدفق إنتاجي | Official Intelligence Supply Chain |
| Sprint 3 | Document Intelligence | تحويل الوثائق إلى معرفة | Document Intelligence Engine |
| Sprint 4 | Fact & Event Engine | الوصول إلى أهم طبقة | Document → Fact → Event chain |
| Sprint 5 | Evidence & Provenance | تثبيت الثقة | Every intelligence item has proof |
| Sprint 6 | Knowledge Graph MVP | ربط العالم المالي | Financial Knowledge Graph v1 |
| Sprint 7 | Intelligence API | تحويل المحرك إلى منصة | ROUAA Intelligence API v1 |
| Sprint 8 | AI Reasoning | إضافة طبقة التفكير | Explainable AI Layer |
| Sprint 9 | Media Intelligence MVP | أول منتج قابل للعرض | Financial News Engine + Reports + Publishing |
| Sprint 10 | Corporate Website | إطلاق واجهة المؤسسة | Homepage + Platform + Solutions + Products + Trust |
| Sprint 11 | Product Catalog | نظام قابل للتصفح | Search + Filters + Categories + Product Pages |
| Sprint 12 | Research Intelligence MVP |Brief Generator + Deep Reports + Sector + Watchlists | Research Workspace |
| Sprint 13 | Trading Intelligence Foundation | Market Intelligence + Chart Annotation + Portfolio Context | Trading foundation |
| Sprint 14 | Trading Application MVP | Dashboard + Smart Charts + AI Assistant + Portfolio | Trading MVP |
| Sprint 15 | Enterprise Platform | Multi-tenancy + Security + Billing + Deployment | Enterprise ready |
| Sprint 16+ | Scale & Enterprise Readiness | Security Hardening + Performance + Monitoring + DR + Integrations | Production scale |

---

## ⚡ أول 10 مهام عملية الآن

1. تثبيت Data Model النهائي
2. إنهاء Fact Engine الإنتاجي
3. إنهاء Event Engine الإنتاجي
4. بناء Knowledge Graph MVP
5. بناء Evidence API
6. بناء Intelligence API
7. بناء أول Solution Suite: Media Intelligence
8. بناء Corporate Website الجديد
9. بناء Product Catalog
10. بناء أول Demo مؤسسي

---

## 🔗 العلاقة مع Foundation

كل مهمة في الـ Backlog ترتبط بوثيقة تأسيسية مرجعية:

| Program | المراجع التأسيسية |
|---|---|
| PROGRAM-01 Intelligence Foundation | docs 01, 11, 12, 26, 27, 29 |
| PROGRAM-02 Knowledge & Reasoning | docs 14, 15, 16, 17, 18, 19 |
| PROGRAM-03 Enterprise Platform | docs 22, 23, 28, 31, 32, 33 |
| PROGRAM-04 Solution Suites | docs 55, 63 |
| PROGRAM-05 Applications | docs 13, 58, 59, 60 |
| PROGRAM-06 Developer Ecosystem | docs 28, 63 |
| PROGRAM-07 Enterprise Operations | docs 25, 34, 37, 42, 43 |

---

## 📐 قواعد الإدارة

من `docs/foundation/64-ROUAA-EXECUTION-PROGRAM-MANAGEMENT-v1.md`:

- **Definition of Ready**: لا تبدأ أي مهمة إلا بوثيقة مرجعية + وصف واضح + تبعيات مكتملة + معايير قبول + Owner
- **Definition of Done**: لا تعتبر المهمة منتهية إلا إذا تعمل + تم اختبارها + موثقة + متوافقة مع Design System + متوافقة مع API Contract + لها سجل تغيير
- **Dependency Rules**: لا يبدأ أي Epic قبل اكتمال جميع تبعياته
- **Release Strategy**: الإصدارات حسب القيمة وليس حسب الصفحات
- **Documentation Governance**: أي تغيير في الكود يؤثر على Platform/API/Product/Suite/Data Model يلزم تحديث الوثائق المقابلة

---

*هذا المجلد هو نظام التشغيل اليومي لبناء ROUAA.*
*الوثائق التأسيسية في `docs/foundation/` هي مصدر الحقيقة طويل الأمد.*
