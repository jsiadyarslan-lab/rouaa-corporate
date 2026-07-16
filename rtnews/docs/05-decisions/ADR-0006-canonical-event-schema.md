# ADR-0006: Canonical Event Schema as System Contract

## Status
Accepted (2026-07-16)

## Context
النظام سيحتوي على عشرات المكونات: Collectors, Parsers, AI Agents, Database, APIs, UI.
كل مكون يحتاج لفهم ما هو "Event".
بدون عقد موحد، كل مكون قد يفسر Event بشكل مختلف → انكسار التكامل.

## Decision
إنشاء **Canonical Event Schema** (JSON Schema) كعقد رسمي.
كل مكون ينتج أو يستهلك Events يجب أن يلتزم به 100%.

الـ Schema يحوي:
- هوية الحدث (id, type, domain, category)
- الجهة (entity: name, symbol, type)
- القيمة (value: amount, unit, direction)
- الأصول المتأثرة (affectedAssets[])
- المصدر (source: id, name, authority)
- الوثائق (documents[])
- الأدلة (evidence[])
- الثقة (confidence 0-100)
- التأثير (impactLevel)
- التواريخ (eventDate, publishedAt, detectedAt)
- اللغة (locale)
- دورة الحياة (lifecycle)

## Consequences
- ✅ تكامل مضمون بين كل المكونات
- ✅ قابلية استبدال أي مكون بدون كسر الباقي
- ✅ قاعدة لـ API platform مستقبلاً
- ✅ وثائق قابلة للفهم من قبل AI agents
- ⚠️ يتغوط المرونة (لاحقاً يجب تحديث الـ Schema بعناية)
- ⚠️ إضافات جديدة تتطلب versioning (v1, v2)
