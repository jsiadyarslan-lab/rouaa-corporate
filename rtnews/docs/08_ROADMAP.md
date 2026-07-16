# 🏛️ Roua Financial Intelligence Network — Roadmap

> **المبدأ الأساسي:** لا تبنِ وكالة أخبار مالية. ابنِ محرك ذكاء مالي عالمي، والوكالة الإخبارية تكون إحدى واجهاته.

> **قاعدة التنفيذ:** لا المزيد من إصلاحات وكيل النشر (V1220+) حتى يكتمل الأساس.

---

## 📊 حالة المشروع الحالية

| المكون | الحالة | ملاحظة |
|--------|--------|--------|
| وكيل النشر (news-agency) | ⏸️ مُجمَّد | 16 إصدار (V1210-V1219k) — ينتظر الأساس |
| مصادر RSS | 220 في ملف واحد | `official-rss.ts` — غير مهيكلة |
| صفحات العرض | 5 لغات | عربي/إنجليزي/فرنسي/تركي/إسباني |
| جدول AgencyEvent | موجود | ربط ضعيف بـ NewsItem |
| حقل isOfficialSource | موجود في DB | غير مستخدم في الواجهة |
| حقل sourceUrls في التقارير | موجود | غير معروض |
| جدول OfficialSource | ❌ غير موجود | المطلوب بناؤه |
| Document Engine | ❌ غير موجود | المطلوب بناؤه |
| Event Engine | ❌ غير موجود | المطلوب بناؤه |
| Evidence System | ❌ غير موجود | المطلوب بناؤه |

---

## 🗺️ المراحل الكاملة (3-5 سنوات)

### المرحلة 0 — إعادة تعريف المنتج ✅ (مكتملة)
**المدة:** الأسبوع 0  
**الحالة:** تم اتخاذ القرار الاستراتيجي  
**النتيجة:** المشروع = "محرك ذكاء مالي" وليس "موقع أخبار"

---

### المرحلة 1 — Official Source Registry 🔄 (قيد التنفيذ)
**المدة:** 4-6 أسابيع  
**الحالة:** بدء التنفيذ  

#### المكونات:
- [ ] **1.1** جدول `OfficialSource` في Prisma schema
- [ ] **1.2** Migration + db-init ALTER statements
- [ ] **1.3** API endpoints (`/api/sources` CRUD)
- [ ] **1.4** استخراج 220 مصدر من `official-rss.ts`
- [ ] **1.5** تصنيف المصادر (central_bank, regulator, statistics, etc.)
- [ ] **1.6** صفحة `/sources` (قائمة المصادر)
- [ ] **1.7** صفحة `/sources/[slug]` (ملف المصدر)
- [ ] **1.8** ربط NewsItem.source بـ OfficialSource.id

#### الأهداف:
- 100-200 مصدر عالي القيمة في البداية
- تصنيف صحيح لكل مصدر
- صفحة عرض عامة للمصادر
- علاقة حقيقية بين NewsItem و OfficialSource

#### التصنيفات المستهدفة:
| الفئة | العدد المستهدف | الأولوية |
|------|----------------|---------|
| البنوك المركزية | 20 | عالية |
| هيئات الإحصاء | 20 | عالية |
| الجهات التنظيمية | 30 | عالية |
| البورصات | 10 | متوسطة |
| الشركات الكبرى | 20 | متوسطة |
| الهيئات الدولية | 10 | متوسطة |
| الطاقة | 10 | منخفضة |
| **المجموع الأولي** | **120** | — |

---

### المرحلة 2 — Document Intelligence Engine
**المدة:** 2-3 أشهر  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **2.1** جدول `OfficialDocument` في Prisma
- [ ] **2.2** Fetcher engine (RSS, HTML, JSON, XML)
- [ ] **2.3** PDF parser
- [ ] **2.4** Text extraction
- [ ] **2.5** Hash + versioning (snapshot)
- [ ] **2.6** Raw document storage (R2)
- [ ] **2.7** API `/api/documents`

#### الـ Schema المقترح:
```prisma
model OfficialDocument {
  id            String   @id @default(cuid())
  sourceId      String   // → OfficialSource
  url           String
  documentType  String   // rss | html | pdf | json | xml | csv | xbrl
  rawContent    String   @db.Text
  extractedText String   @db.Text
  hash          String   // SHA-256 للتحقق
  publishedAt   DateTime?
  fetchedAt     DateTime @default(now())
  
  @@unique([sourceId, url])
  @@index([sourceId, fetchedAt])
}
```

---

### المرحلة 3 — Financial Event Engine
**المدة:** 3-6 أشهر  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **3.1** جدول `OfficialEvent` في Prisma
- [ ] **3.2** Event extraction من Documents
- [ ] **3.3** Event types (rate_decision, earnings, filing, speech, etc.)
- [ ] **3.4** Entity recognition (institutions, assets, countries)
- [ ] **3.5** ربط Event → Document → Source
- [ ] **3.6** API `/api/events`

#### الـ Schema المقترح:
```prisma
model OfficialEvent {
  id           String   @id @default(cuid())
  documentId   String   // → OfficialDocument
  sourceId     String   // → OfficialSource
  type         String   // rate_decision | earnings | filing | speech | data_release
  title        String
  entity       String   // Federal Reserve | Apple | SEC
  country      String?
  value        String?  // +25bps | $1.2B | 3.2%
  direction    String?  // increase | decrease | neutral
  affectedAssets String @default("[]") // JSON
  confidence   Int      @default(100)
  eventDate    DateTime
  createdAt    DateTime @default(now())
  
  @@index([sourceId, eventDate])
  @@index([type, eventDate])
}
```

---

### المرحلة 4 — Evidence System
**المدة:** 1-2 شهر  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **4.1** جدول `Evidence` في Prisma
- [ ] **4.2** ربط كل claim في NewsItem بـ Evidence
- [ ] **4.3** Hash verification
- [ ] **4.4** Display Evidence في صفحة الخبر
- [ ] **4.5** Provenance chain (Event → Source → Document → Evidence → NewsItem)

---

### المرحلة 5 — إعادة تصميم Roua Trading News
**المدة:** 2-3 أشهر  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **5.1** صفحة `/financial-intelligence` (القلب الجديد)
- [ ] **5.2** صفحة `/events` (سجل الأحداث الرسمية)
- [ ] **5.3** تحديث `/news/[slug]` لإظهار Event + Evidence
- [ ] **5.4** قسم "الأدلة" في صفحة الخبر
- [ ] **5.5** ربط الأخبار بالمصادر (deep-link)
- [ ] **5.6** تحديث السلايدر ليشمل Events

---

### المرحلة 6 — Knowledge Graph
**المدة:** 6-12 شهر  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **6.1** نموذج العلاقات بين الكيانات
- [ ] **6.2** Graph database (Neo4j أو Postgres + pg_graph)
- [ ] **6.3** Visualization (D3.js / Cytoscape)
- [ ] **6.4** استعلامات "ماذا حدث آخر 10 مرات عندما..."
- [ ] **6.5** صفحة `/graph`

---

### المرحلة 7 — AI Research Analyst
**المدة:** السنة الثانية  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **7.1** RAG pipeline فوق Events + Documents
- [ ] **7.2** واجهة سؤال وجواب طبيعية
- [ ] **7.3** تقارير تلقائية مع citations
- [ ] **7.4** Multi-language

---

### المرحلة 8 — Bloomberg Intelligence Layer
**المدة:** السنة 2-3  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **8.1** Asset Intelligence (لكل أصل: drivers, events, history)
- [ ] **8.2** Company Intelligence (financials, filings, competitors)
- [ ] **8.3** Economy Intelligence (GDP, inflation, rates per country)

---

### المرحلة 9 — Trading Intelligence (QuantLab integration)
**المدة:** السنة 2-3  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **9.1** Event Risk scoring
- [ ] **9.2** Market impact predictions
- [ ] **9.3** QuantLab integration

---

### المرحلة 10 — API Platform
**المدة:** السنة الثالثة  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **10.1** REST API (`/api/v1/events`, `/api/v1/sources`)
- [ ] **10.2** WebSocket (real-time events)
- [ ] **10.3** API keys + rate limiting
- [ ] **10.4** Documentation

---

### المرحلة 11 — Institutional Terminal
**المدة:** السنة 3-5  
**الحالة:** لم تبدأ  

#### المكونات:
- [ ] **11.1** Terminal UI (command-line style)
- [ ] **11.2** Real-time market data
- [ ] **11.3** AI command interpreter
- [ ] **11.4** Multi-asset dashboard

---

## 📈 مؤشرات التقدم

### إحصائيات المصادر
| التاريخ | إجمالي المصادر | البنوك المركزية | الإحصاء | التنظيم | البورصات | الشركات |
|---------|---------------|----------------|---------|---------|---------|---------|
| 2026-07-16 | 0 (بداية) | 0 | 0 | 0 | 0 | 0 |
| _تحديث تلقائياً_ | | | | | | |

### إحصائيات الوثائق
| التاريخ | إجمالي الوثائق | PDF | HTML | RSS | JSON |
|---------|---------------|-----|------|-----|------|
| 2026-07-16 | 0 | 0 | 0 | 0 | 0 |

### إحصائيات الأحداث
| التاريخ | إجمالي الأحداث | rate_decision | earnings | filing | speech |
|---------|---------------|---------------|----------|--------|--------|
| 2026-07-16 | 0 | 0 | 0 | 0 | 0 |

---

## 🚫 القرارات الملزمة

1. **تجميد وكيل النشر**: لا V1220, V1221... حتى تكتمل المرحلة 1-3
2. **عدم إضافة مصادر جديدة لـ official-rss.ts**: كل مصدر جديد يدخل OfficialSource table
3. **كل خبر جديد يجب أن يربط بـ OfficialSource**: لا أخبار بدون مصدر مسجل
4. **التزام بالترتيب**: لا تخطي المراحل (لا Knowledge Graph قبل Event Engine)

---

## 📝 سجل التنفيذ

### 2026-07-16 — بدء المرحلة 1
- [x] إنشاء ROADMAP.md
- [ ] إنشاء OfficialSource model
- [ ] Migration
- [ ] API endpoints
- [ ] استخراج المصادر الحالية
- [ ] صفحة /sources

---

## 🎯 الهدف بعد 12 شهر

```
Roua Financial Intelligence
├── 1,000+ مصدر رسمي
├── 50,000+ وثيقة
├── 10,000+ حدث مالي
├── AI Analyst (سؤال وجواب)
├── Multi-language
└── API Platform
```

**ليس موقع أخبار. بل بنية تحتية معرفية مالية.**
