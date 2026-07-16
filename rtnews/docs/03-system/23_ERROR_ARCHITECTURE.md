# ⚠️ Error Architecture

> معالجة الأخطاء في نظام موزع يتطلب استراتيجية واضحة.

## أنواع الأخطاء

### 1. Source Errors (أخطاء المصادر)

| Error | Cause | Action | Retry |
|-------|-------|--------|-------|
| `SOURCE_UNREACHABLE` | الموقع لا يستجيب | تعطيل مؤقت | 3 مرات خلال ساعة |
| `SOURCE_CHANGED` | تغيرت بنية الصفحة | تعطيل + تنبيه أدمن | لا — يحتاج adapter update |
| `SOURCE_RATE_LIMITED` | 429 Too Many Requests | تأخير الجلب | exponential backoff |
| `SOURCE_AUTH_FAILED` | 401/403 | تعطيل + تنبيه | لا — يحتاج credentials |
| `SOURCE_GONE` | 404 دائم | تعطيل دائم | لا |

### 2. Fetcher Errors (أخطاء الجلب)

| Error | Cause | Action | Retry |
|-------|-------|--------|-------|
| `FETCH_TIMEOUT` | انتهاء المهلة | إعادة المحاولة | 2 مرات |
| `FETCH_NETWORK_ERROR` | خطأ شبكة | إعادة المحاولة | 3 مرات |
| `FETCH_LARGE_DOC` | وثيقة > 10MB | رفض + تنبيه | لا |
| `FETCH_EMPTY` | محتوى فارغ | تخطي | لا |

### 3. Parser Errors (أخطاء التحليل)

| Error | Cause | Action | Retry |
|-------|-------|--------|-------|
| `PARSE_PDF_FAILED` | PDF تالف أو مشفر | تخزين خام + تنبيه | لا |
| `PARSE_HTML_FAILED` | HTML غير صالح | تنظيف + إعادة محاولة | 1 مرة |
| `PARSE_JSON_FAILED` | JSON غير صالح | رفض | لا |
| `PARSE_ENCODING` | ترميز غير معروف | محاولة UTF-8 | 1 مرة |

### 4. AI Errors (أخطاء الذكاء الاصطناعي)

| Error | Cause | Action | Retry |
|-------|-------|--------|-------|
| `AI_TIMEOUT` | LLM بطيء | مزود احتياطي | 3 مزودين |
| `AI_RATE_LIMITED` | تجاوز الحد | تأخير | exponential backoff |
| `AI_HALLUCINATION` | إجابة بدون دليل | رفض + إعادة محاولة | 2 مرات |
| `AI_EMPTY` | إجابة فارغة | مزود احتياطي | 2 مزودين |
| `AI_INVALID_JSON` | JSON تالف | إصلاح + إعادة | 1 مرة |

### 5. Evidence Errors (أخطاء الأدلة)

| Error | Cause | Action | Retry |
|-------|-------|--------|-------|
| `EVIDENCE_HASH_MISMATCH` | تغيرت الوثيقة | إعادة جلب | 1 مرة |
| `EVIDENCE_NOT_FOUND` | لا يوجد دليل | رفض الحدث | لا |
| `EVIDENCE_PARAGRAPH_MISSING` | الفقرة غير موجودة | إعادة استخراج | 1 مرة |

## استراتيجية Retry

```
Attempt 1: فوري
Attempt 2: بعد 30 ثانية
Attempt 3: بعد 2 دقيقة
Attempt 4: بعد 10 دقائق (final)
→ إذا فشل: Dead Letter Queue
```

### Exponential Backoff
```
delay = baseDelay * (2 ^ attempt) + random_jitter
baseDelay = 30s
maxDelay = 10min
jitter = 0-5s (لمنع thundering herd)
```

## Dead Letter Queue (DLQ)

الوثائق/الأحداث التي فشلت بعد كل المحاولات تُنقل لـ DLQ.

```
DeadLetterQueue:
├── failedDocuments[] — وثائق فشل جلبها أو تحليلها
├── failedEvents[] — أحداث فشل استخراجها
└── failedEvidence[] — أدلة فشل التحقق منها
```

### معالجة DLQ
- **每日**: تنبيه أدمن بـ count
- **أسبوعياً**: مراجعة يدوية للأخطاء المتكررة
- **شهرياً**: تحديث Adapters للمصادر المتغيرة

## Source Health Score

كل مصدر له Health Score يُحدث تلقائياً:

```
Health Score = (successfulFetches / totalFetches) * 100

100% = ممتاز
80-99% = جيد
50-79% = متعب (تنبيه)
<50% = تعطيل تلقائي
```

### إجراءات تلقائية
```
Health < 50% → تعطيل مؤقت (1 ساعة)
Health < 50% 3 مرات → تعطيل دائم + تنبيه أدمن
Health = 100% لـ 7 أيام → isVerified = true
```

## Error Logging

كل خطأ يُسجل مع:
```
{
  timestamp,
  errorType,
  sourceId,
  documentId?,
  message,
  stackTrace?,
  retryCount,
  resolved: false
}
```

## Recovery Procedures

### Source Recovery
1. أدمن يصلح المشكلة (credentials, adapter)
2. يُعيد تفعيل المصدر
3. النظام يعيد جلب آخر 24 ساعة

### Document Recovery
1. يُجلب من snapshot في R2
2. يُعاد التحليل
3. يُحدّث الـ hash

### Event Recovery
1. يُعاد استخراج Facts
2. يُعاد بناء Event
3. يُعاد ربط Evidence
