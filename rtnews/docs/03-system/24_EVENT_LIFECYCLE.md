# 🔄 Event Lifecycle

> حالة كل Event من الاكتشاف إلى الأرشفة.

## State Machine

```
                    ┌──────────────┐
                    │   DETECTED   │ ← Document يحتوي على محتوى محتمل
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   COLLECTED  │ ← Document جُلب وخُزن في R2
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    PARSED    │ ← Text extracted + hash generated
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │  EXTRACTED   │ ← Facts extracted by AI
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   VALIDATED  │ ← Facts verified against source
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │  CLASSIFIED  │ → Domain + Category + Type assigned
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   LINKED     │ ← Evidence linked to Event
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │  PUBLISHED   │ ← Event visible in /events
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   ARCHIVED   │ ← Historical, searchable
                    └──────────────┘
```

## تعريف كل حالة

### 1. DETECTED
**المعنى:** اكتشف النظام محتوى محتملاً في مصدر.
**الشروط:**
- RSS item جديد، أو
- API response جديد، أو
- HTML change detected

**الإجراء:** إضافة لـ fetch queue.
**المدة المتوقعة:** < 1 ثانية.

### 2. COLLECTED
**المعنى:** جُلبت الوثيقة وخُزنت.
**الشروط:**
- HTTP 200 من المصدر
- rawContent محفوظ في DB
- snapshot محفوظ في R2

**الإجراء:** إرسال لـ Parser.
**المدة المتوقعة:** 1-10 ثوانٍ.

### 3. PARSED
**المعنى:** حُللت الوثيقة واستُخرج النص.
**الشروط:**
- extractedText غير فارغ
- hash مُولّد
- metadata مُستخرجة

**الإجراء:** إرسال لـ Fact Extractor (AI).
**المدة المتوقعة:** 1-30 ثانية.

### 4. EXTRACTED
**المعنى:** استخرج AI الحقائق من النص.
**الشروط:**
- facts list غير فارغة
- كل fact لها type + value
- confidence مُحدد

**الإجراء:** إرسال لـ Validator.
**المدة المتوقعة:** 5-30 ثانية (AI call).

### 5. VALIDATED
**المعنى:** تحققت الحقائق مقابل المصدر.
**الشروط:**
- كل fact لها evidence
- hash مطابق
- لا contradictions

**الإجراء:** إرسال لـ Classifier.
**المدة المتوقعة:** < 1 ثانية.

### 6. CLASSIFIED
**المعنى:** صُنف الحدث في Taxonomy.
**الشروط:**
- domain مُحدد
- category مُحدد
- type مُحدد
- affectedAssets مُحددة

**الإجراء:** إرسال لـ Evidence Linker.
**المدة المتوقعة:** < 1 ثانية.

### 7. LINKED
**المعنى:** رُبط الحدث بالأدلة.
**الشروط:**
- Evidence record مُنشأ
- paragraph مُحدد
- hash مُسجل

**الإجراء:** قرار النشر.
**المدة المتوقعة:** < 1 ثانية.

### 8. PUBLISHED
**المعنى:** الحدث مرئي في /events.
**الشروط:**
- impactLevel = medium/high/critical، أو
- manual approval للأحداث low impact

**الإجراء:**
- إذا newsworthy → trigger Newsroom
- إذا not newsworthy → انتظار الأرشفة

**المدة المتوقعة:** فوري.

### 9. ARCHIVED
**المعنى:** الحدث تاريخي، قابل للبحث.
**الشروط:**
- مرت 30 يوماً على النشر، أو
- الحدث لم يعد "breaking"

**الإجراء:** يبقى في DB للبحث التاريخي.
**المدة المتوقعة:** دائم.

## حالات الفشل

```
DETECTED → FAILED_FETCH (network, auth, rate limit)
COLLECTED → FAILED_PARSE (corrupt, unsupported)
PARSED → FAILED_EXTRACT (AI error, empty)
EXTRACTED → FAILED_VALIDATE (no evidence, contradiction)
VALIDATED → FAILED_CLASSIFY (unknown type)
```

كل فشل يُسجل في Dead Letter Queue مع:
- السبب
- المحاولة (retry count)
- وقت الفشل

## الانتقالات المسموحة

```
DETECTED → COLLECTED | FAILED_FETCH
COLLECTED → PARSED | FAILED_PARSE
PARSED → EXTRACTED | FAILED_EXTRACT
EXTRACTED → VALIDATED | FAILED_VALIDATE
VALIDATED → CLASSIFIED | FAILED_CLASSIFY
CLASSIFIED → LINKED
LINKED → PUBLISHED
PUBLISHED → ARCHIVED

FAILED_* → DETECTED (retry)
FAILED_* → ARCHIVED (permanent failure)
```

## المراقبة (Monitoring)

لكل حالة، النظام يتتبع:
```
eventsByStatus = {
  detected: 234,
  collected: 198,
  parsed: 195,
  extracted: 180,
  validated: 175,
  classified: 175,
  linked: 173,
  published: 170,
  archived: 12450,
  failed: 23
}
```

### تنبيهات تلقائية
- `failed > 10%` → تنبيه أدمن
- `detected > 500` (backlog) → تنبيه أدمن
- `extracted time > 60s` → تنبيه (AI بطيء)
