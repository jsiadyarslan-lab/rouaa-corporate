# 🏛️ Architecture Principles

> المبادئ التقنية (وليس المنتجية) التي تحكم تصميم النظام.

## 1. Event First
كل شيء يبدأ من Event. الخبر، التحليل، التنبيه — كلها مشتقات.
لا توجد Publication بدون Event.

## 2. Evidence First
كل ادعاء مرتبط بدليل. لا استنتاج بدون مرجع.
الـ AI لا يكتب بدون Evidence.

## 3. AI is Never a Source
الـ AI يفهم ويستخرج ويفسر — لكنه ليس مصدراً.
المصدر دائماً Official Source. الـ AI وسيط.

## 4. Official Sources Only
لا مواقع إخبارية. لا مدونات. لا شبكات اجتماعية.
فقط الجهات الرسمية (انظر 16_SOURCE_VERIFICATION_POLICY.md).

## 5. Immutable Documents
الوثائق لا تُعدل بعد التخزين. إذا تغيرت في المصدر، نحتفظ بالنسختين.
التاريخ المالي لا يُحذف.

## 6. Source Adapters
كل نوع مصدر له Adapter. لا معاملة موحدة.
التعدد = المرونة.

## 7. Publish from Events
النشر يأتي من Events، لا من Documents مباشرة.
Document → Event → Publication (وليس Document → Publication).

## 8. Canonical Schema
كل Event يتبع نفس البنية (Canonical Event Schema).
هذا العقد لا يتغير. كل المكونات تلتزم به.

## 9. Separation of Concerns
الجلب ≠ التحليل ≠ الاستخراج ≠ النشر.
كل مرحلة منفصلة، قابلة للاختبار، قابلة للاستبدال.

## 10. Observable Everything
كل عملية مسجلة. كل خطأ مسجل. كل أداء مسجل.
لا عمليات صامتة.
