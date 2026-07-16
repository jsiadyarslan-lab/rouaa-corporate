# ADR-0004: Source Adapter Pattern

## Status
Accepted (2026-07-16)

## Context
كل مصدر رسمي له:
- بنية بيانات مختلفة (RSS vs API vs PDF)
- تكرار تحديث مختلف
- لغة مختلفة
- تنسيق مختلف

لا يمكن معاملتهم بنفس الطريقة.

## Decision
استخدام **Adapter Pattern** لكل نوع مصدر:
```
OfficialSource → SourceAdapter → Fetcher → Parser
```

كل Adapter يعرف:
- كيف يُجلب (fetch)
- كيف يُحدّث (frequency)
- كيف يُتحقق (validation)

## Consequences
- ✅ قابلية توسعة (إضافة نوع مصدر = adapter جديد)
- ✅ عزل التعقيد
- ✅ قابلية الاختبار
- ⚠️ كود أكثر
- ⚠️ منحنى تعلم للمطورين الجدد
