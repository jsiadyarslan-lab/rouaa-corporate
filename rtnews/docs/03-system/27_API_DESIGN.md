# 🔌 API Design

> حتى لو لم ننفذ الـ API Platform الآن، يجب تصميمه من البداية
> لأنه يؤثر على تصميم Event و Database.

## مبادئ API

1. **RESTful** — أسماء موارد، أفعال HTTP
2. **Versioned** — `/api/v1/` prefix
3. **JSON only** — لا XML، لا YAML
4. **Locale-aware** — `Accept-Language` header أو `?locale=ar`
5. **Paginated** — max 100 per page
6. **Rate limited** — 100 req/min (free), 1000/min (paid)
7. **Authenticated** — API key in header

## Endpoints الأساسية

### Sources
```
GET    /api/v1/sources                    — قائمة المصادر
GET    /api/v1/sources/{slug}             — ملف مصدر
GET    /api/v1/sources/{slug}/events      — أحداث مصدر
GET    /api/v1/sources/{slug}/documents   — وثائق مصدر
```

### Events
```
GET    /api/v1/events                     — قائمة الأحداث
GET    /api/v1/events/{id}                — حدث واحد (Canonical Schema)
GET    /api/v1/events/latest              — آخر الأحداث
GET    /api/v1/events/by-type/{type}      — حسب النوع
GET    /api/v1/events/by-entity/{entity}  — حسب الجهة
GET    /api/v1/events/by-asset/{symbol}   — حسب الأصل
GET    /api/v1/events/{id}/evidence       — أدلة الحدث
```

### Documents
```
GET    /api/v1/documents                  — قائمة الوثائق
GET    /api/v1/documents/{id}             — وثيقة + extractedText
GET    /api/v1/documents/{id}/raw         — المحتوى الخام
```

### Intelligence (Phase 6+)
```
POST   /api/v1/analyst/ask                — سؤال للـ AI Analyst
GET    /api/v1/asset/{symbol}/intelligence — ذكاء الأصل
GET    /api/v1/company/{symbol}/events    — أحداث الشركة
GET    /api/v1/country/{code}/economy     — ذكاء الاقتصاد
```

### WebSocket (Phase 6+)
```
WS     /api/v1/stream/events              — بث أحداث مباشر
WS     /api/v1/stream/alerts              — بث تنبيهات
```

## Response Format

### Success
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found",
    "details": { "id": "cmrx..." }
  }
}
```

### Event Response (Canonical)
```json
{
  "data": {
    "id": "cmrx...",
    "domain": "macro",
    "type": "hike",
    "title": "...",
    "entity": { "name": "Federal Reserve" },
    "value": { "amount": "+25", "unit": "bps" },
    "evidence": [ ... ],
    "source": { "name": "Federal Reserve" },
    "confidence": 100,
    "eventDate": "2026-07-16T18:00:00Z"
  }
}
```

## Authentication

```
Header: X-API-Key: roua_sk_xxxxx
```

### Tiers
| Tier | Rate | Cost |
|------|------|------|
| Free | 100 req/min | $0 |
| Pro | 1000 req/min | $49/mo |
| Enterprise | Unlimited | Custom |

## Query Parameters المشتركة

```
?locale=ar           — اللغة
?page=1              — الصفحة
?limit=20            — الحد الأقصى (max 100)
?from=2026-01-01     — تاريخ من
?to=2026-12-31       — تاريخ إلى
?domain=macro        — فلتر المجال
?type=hike           — فلتر النوع
?entity=Federal%20Reserve — فلتر الجهة
?asset=USD           — فلتر الأصل
?country=US          — فلتر الدولة
?sort=eventDate:desc — الترتيب
?fields=id,title,eventDate — حقول محددة
```
