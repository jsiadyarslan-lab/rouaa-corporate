# 📖 Data Dictionary

> تعريف دقيق لكل حقل في النظام. ليس Schema، بل **معنى** كل حقل.

## OfficialSource

| Field | Type | Required | Range/Values | Meaning |
|-------|------|----------|--------------|---------|
| id | String (cuid) | ✅ | — | معرف فريد |
| name | String | ✅ | 2-200 chars | الاسم الكامل للمصدر |
| slug | String | ✅ | unique, a-z, 0-9, - | الاسم في URL |
| shortName | String? | ❌ | 2-50 chars | اختصار (Fed, ECB) |
| country | String? | ❌ | 2-100 chars | اسم الدولة |
| countryCode | String? | ❌ | ISO 3166-1 alpha-2 | رمز الدولة (US, GB, DE) |
| region | String? | ❌ | enumerated | North America, Europe, MENA, Asia, Africa, South America, Global |
| type | String | ✅ | enumerated | central_bank, statistics, regulator, exchange, ministry, intl_org, company, energy, metals, agriculture, transport, crypto, rating_agency, other |
| authorityScore | Int | ✅ | 0-100 | 100 = حكومي رسمي، 80 = مؤسسي، 50 = شركة، 0 = غير موثق |
| reliability | String | ✅ | official, verified, unverified | مستوى الموثوقية |
| website | String? | ❌ | URL | الموقع الرسمي |
| rss | String? | ❌ | URL | رابط RSS |
| api | String? | ❌ | URL | رابط API |
| accessMethods | String (JSON) | ✅ | ["rss","html","pdf","json","xml","csv","xbrl"] | طرق الوصول المتاحة |
| language | String | ✅ | en, ar, fr, tr, es | لغة المحتوى الأساسي |
| locale | String | ✅ | en, ar, fr, tr, es | locale للعرض |
| updateFrequency | String? | ❌ | realtime, daily, weekly, monthly, quarterly, ad_hoc | تكرار التحديث |
| timezone | String? | ❌ | IANA TZ | America/New_York, Europe/London, etc. |
| relatedAssets | String (JSON) | ✅ | ["USD","GOLD","BONDS"] | الأصول المالية المرتبطة |
| relatedEntities | String (JSON) | ✅ | ["Federal Reserve","FOMC"] | الكيانات المرتبطة |
| description | String? | ❌ | free text | وصف المصدر |
| logoUrl | String? | ❌ | URL | شعار المصدر |
| isActive | Boolean | ✅ | true/false | هل يُجلب منه حالياً؟ |
| isVerified | Boolean | ✅ | true/false | هل تحقق منه أدمن؟ |
| lastFetchedAt | DateTime? | ❌ | — | آخر جلب ناجح |
| totalEvents | Int | ✅ | ≥0 | عدد الأحداث من هذا المصدر |
| totalDocuments | Int | ✅ | ≥0 | عدد الوثائق المسحوبة |
| createdAt | DateTime | ✅ | — | تاريخ الإنشاء |
| updatedAt | DateTime | ✅ | auto | تاريخ آخر تحديث |

## OfficialDocument

| Field | Type | Required | Range/Values | Meaning |
|-------|------|----------|--------------|---------|
| id | String (cuid) | ✅ | — | معرف فريد |
| sourceId | String | ✅ | FK → OfficialSource | المصدر |
| url | String | ✅ | URL | الرابط الأصلي للوثيقة |
| documentType | String | ✅ | rss, html, pdf, json, xml, csv, xbrl, docx, xlsx | نوع الوثيقة |
| title | String? | ❌ | free text | عنوان الوثيقة |
| rawContent | String? | ❌ | @db.Text | المحتوى الخام |
| extractedText | String? | ❌ | @db.Text | النص المستخرج الصافي |
| hash | String? | ❌ | SHA-256 | بصمة للتحقق من السلامة |
| snapshotUrl | String? | ❌ | R2 URL | نسخة مؤرشفة في R2 |
| language | String | ✅ | en, ar, fr, tr, es | لغة الوثيقة |
| publishedAt | DateTime? | ❌ | — | تاريخ نشر الوثيقة (من المصدر) |
| fetchedAt | DateTime | ✅ | auto | وقت الجلب |
| metadata | String (JSON) | ✅ | {} | بيانات إضافية (pageCount, wordCount, etc.) |

## OfficialEvent

| Field | Type | Required | Range/Values | Meaning |
|-------|------|----------|--------------|---------|
| id | String (cuid) | ✅ | — | معرف فريد |
| documentId | String? | ❌ | FK → OfficialDocument | الوثيقة المصدر (optional) |
| sourceId | String | ✅ | FK → OfficialSource | المصدر الرسمي |
| domain | String | ✅ | macro, corporate, markets, regulatory, geopolitical, energy, metals | المجال |
| category | String | ✅ | see Taxonomy | الفئة |
| subcategory | String? | ❌ | see Taxonomy | الفئة الفرعية |
| type | String | ✅ | see Taxonomy | النوع المحدد |
| title | String | ✅ | free text | عنوان الحدث |
| entity | String | ✅ | free text | الجهة (Federal Reserve, Apple) |
| entitySymbol | String? | ❌ | ticker (AAPL) | رمز الشركة |
| country | String? | ❌ | free text | الدولة |
| countryCode | String? | ❌ | ISO 3166-1 alpha-2 | رمز الدولة |
| value | String? | ❌ | free text | القيمة الرئيسية (+25bps, $1.2B) |
| direction | String? | ❌ | increase, decrease, neutral, unchanged | الاتجاه |
| affectedAssets | String (JSON) | ✅ | [{symbol, direction, reason}] | الأصول المتأثرة |
| confidence | Int | ✅ | 0-100 | مستوى الثقة بعد التحقق |
| impactLevel | String | ✅ | low, medium, high, critical | مستوى التأثير |
| eventDate | DateTime | ✅ | — | وقت وقوع الحدث |
| publishedAt | DateTime? | ❌ | — | وقت النشر الرسمي |
| createdAt | DateTime | ✅ | auto | وقت الإنشاء في النظام |

## Evidence

| Field | Type | Required | Range/Values | Meaning |
|-------|------|----------|--------------|---------|
| id | String (cuid) | ✅ | — | معرف فريد |
| eventId | String? | ❌ | FK → OfficialEvent | الحدث المرتبط |
| documentId | String | ✅ | FK → OfficialDocument | الوثيقة المصدر |
| type | String | ✅ | pdf, html, quote, table, chart | نوع الدليل |
| url | String | ✅ | URL | رابط الوثيقة |
| paragraph | String? | ❌ | free text | المرجع داخل الوثيقة (para 2, table 1) |
| hash | String? | ❌ | SHA-256 | بصمة للتحقق |
| fetchedAt | DateTime | ✅ | auto | وقت الجلب |

## قواعد التحقق (Validation Rules)

| Rule | Applied To | Logic |
|------|------------|-------|
| authorityScore 0-100 | OfficialSource | must be integer in range |
| confidence 0-100 | OfficialEvent | must be integer in range |
| countryCode 2 chars | OfficialSource, OfficialEvent | must match ISO 3166-1 alpha-2 |
| hash 64 chars | OfficialDocument, Evidence | must be valid SHA-256 hex |
| affectedAssets JSON | OfficialEvent | must be valid JSON array |
| eventDate ≤ now | OfficialEvent | cannot be in future |
