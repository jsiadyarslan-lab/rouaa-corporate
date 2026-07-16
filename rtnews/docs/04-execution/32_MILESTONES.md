# 🎯 Milestones

> نقاط فحص رئيسية. كل milestone = نهاية مرحلة + بداية التالية.

## M0: Architecture Approved ✅
**التاريخ:** 2026-07-16  
**المعيار:** اكتمال كل وثائق docs/ + specs/  
**النتيجة:** الضوء الأخضر للتنفيذ

## M1: Source Registry Live
**المعيار:**
- OfficialSource table منشور على الإنتاج
- 100+ مصدر مسجل
- صفحة /sources تعمل
- NewsItem.source مرتبط بـ OfficialSource

**عند الإكمال:** يمكن البدء بـ Phase 2

## M2: Document Pipeline Live
**المعيار:**
- OfficialDocument table منشور
- RSS Adapter يعمل
- HTML Adapter يعمل
- 1000+ وثيقة مسحوبة
- R2 storage يعمل

**عند الإكمال:** يمكن البدء بـ Phase 3

## M3: Event Engine Live
**المعيار:**
- OfficialEvent table منشور
- Fact Extractor يعمل
- Event Builder يعمل
- 500+ حدث مستخرج
- Canonical Schema مطبق 100%

**عند الإكمال:** يمكن إعادة تفعيل Newsroom

## M4: Evidence System Live
**المعيار:**
- Evidence table منشور
- كل Event له ≥1 evidence
- Hash verification يعمل
- صفحة /events تعرض الأدلة

**عند الإكمال:** النظام جاهز للنشر الموثق

## M5: Newsroom Reactivated
**المعيار:**
- وكيل النشر يعمل فوق Event Engine
- كل خبر مرتبط بـ Event
- كل خبر له Evidence
- جودة محسنة (لا هلوسة، لا تكرار)

**عند الإكمال:** نهاية السنة الأولى

## M6: Knowledge Graph (Year 2)
**المعيار:**
- Graph database يعمل
- استعلامات تاريخية تعمل
- صفحة /graph تعرض العلاقات

## M7: AI Analyst (Year 2)
**المعيار:**
- RAG pipeline يعمل
- سؤال/جواب طبيعي
- تقارير تلقائية مع citations

## M8: API Platform (Year 3)
**المعيار:**
- REST API public
- 100+ مطور مسجل
- API keys + rate limiting

## M9: Terminal (Year 3-5)
**المعيار:**
- Institutional Terminal UI
- Real-time data
- AI command interpreter
