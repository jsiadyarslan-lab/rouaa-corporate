// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Translator Agent V89 ──────────────────────────
// COMPLETE REWRITE: Instead of translating garbage HTML content,
// this agent uses AI to WRITE a proper Arabic news article from scratch
// based on the English title and summary.
//
// V89: Company transliteration in titles:
//   - NEW: fixMixedArabicTitleInTranslator now TRANSLITERATES instead of deleting
//     "باركلAYS" → "باركليز" (not "باركل" — broken!)
//     Added dictionary of well-known company/bank names
// V88: Title formatting + deduplication:
//   - NEW: fixMixedArabicTitle() — fixes titles like "باركلAYS" (Latin in Arabic)
//   - NEW: deduplicateArabicContent() — removes repeated sentences from contentAr
//   - NEW: Title Latin char check after translation — if Arabic title has mixed
//     Latin letters that are NOT financial abbreviations → fix before saving
//   - Core principle: "سطران من الكود يحلان مشكلة التنظيف"
// V87: Target audience detection for personal finance articles:
//   - NEW: Title/content prompts detect if article is consumer-oriented
//   - NEW: "credit score" = درجة الائتمان الشخصية (NOT سجل مالي!)
//   - NEW: Personal finance content preserved as consumer-oriented
//   - Core principle: "الترجمة يجب أن تحفظ الموضوع، لا أن تغيّره"
// V75: Anti-hallucination overhaul — ADAPTIVE paragraph count:
// - No more forcing 4 paragraphs from a single headline — this was the #1
//   hallucination source. The AI invented events, causes, reactions, and
//   context that don't exist in the source article.
// - NEW: "لا تطلب من النموذج أكثر مما يعرف" — core principle
// - If source is just a headline → write 1-2 paragraphs only
// - If source has headline + summary → write 2-3 paragraphs
// - If source has full content → write 3-4 paragraphs
// - NEW: Explicit anti-fabrication rules — no invented events, causes, reactions
// - NEW: Mixed English/Arabic word detection (e.g., "هذا الannouncement")
// - Short honest content > long fabricated content
//
// V51: Switched to Gemini 2.0 Flash as primary translation provider.
// Gemini excels at Arabic translation quality and is free via Google AI Studio.
// Falls back to z-ai-sdk (glm-4-flash) when Gemini API key is not configured.
//
// V38 GOLDEN RULE: Stage does NOT advance without BOTH titleAr AND contentAr.
// - If contentAr fails, the article stays at content_loaded stage
// - Professional Arabic journalism style
// - No English words except well-known financial abbreviations (GDP, S&P, etc.)
// - Title and summary fully translated to Arabic
// - Content is AI-WRITTEN, not machine-translated from garbage HTML

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { PIPELINE_CONFIG } from '../config';
import { ProcessingStage } from '../queue/job-types';

export interface TranslateResult {
  articleId: string;
  success: boolean;
  fields: string[];
  duration: number;
  error?: string;
}

export async function translateArticle(articleId: string): Promise<TranslateResult> {
  const startTime = Date.now();
  const result: TranslateResult = { articleId, success: false, fields: [], duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already past this stage AND has quality content
    if (article.processingStage !== 'fetched' && article.processingStage !== 'content_loaded') {
      // Already past this stage — check if we have quality content
      if (article.titleAr && article.contentAr && article.contentAr.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }
      // If content is weak, re-process even though stage was advanced
      console.log(`[Translator] Article ${articleId} at stage ${article.processingStage} but contentAr is weak (${article.contentAr?.length || 0} chars) — re-processing`);
    }

    const fields: string[] = [];
    let titleAr = article.titleAr;
    let summaryAr = article.summaryAr;
    let contentAr = article.contentAr;
    let slug = article.slug;

    // ── Step 1: Translate Title to Arabic ──
    if (!titleAr || !isMostlyArabic(titleAr)) {
      try {
        const titleTranslation = await Promise.race([
          chatCompletion([
            {
              role: 'system',
              content: `أنت مترجم صحفي محترف من الإنجليزية إلى العربية لمنصة أخبار مالية "رؤى".

⚠️ V87: فحص الجمهور المستهدف قبل الترجمة:
قبل ترجمة العنوان، حدد: لمن هذا الخبر؟
- موجّه للمستهلك الفرد (credit score, budgeting, personal loans, savings, credit myths)؟
  → حافظ على المعنى الشخصي: credit score = درجة الائتمان الشخصية (NOT سجل مالي!)
  → credit في سياق شخصي = ائتمان شخصي (NOT ائتمان مؤسسي)
  → bills = فواتير شهرية (NOT فواتير شركات)
  → myths = أساطير/مفاهيم خاطئة شائعة
- موجّه للمتداول/المستثمر/المؤسسة → تابع بشكل طبيعي

قواعد ترجمة العنوان:
- استخدم عربية فصحى صحفية رصينة — ترجمة دقيقة أمينة
- حافظ على الأسماء الإنجليزية للشركات والمؤشرات كما هي (Apple, S&P 500, GDP, AI, ETF)
- ⚠️ لا تستبدل أسماء الشركات بـ "شركة ما" — اذكر الاسم الصريح بالتعريب الصوتي + الإنجليزي
- استخدم المصطلحات المالية العربية المعتمدة (الاحتياطي الفيدرالي، البنك المركزي، الناتج المحلي)
- ⚠️⚠️⚠️ V87: مصطلحات التمويل الشخصي — ترجمة دقيقة إلزامية:
  - credit score = درجة الائتمان الشخصية (NOT سجل مالي — هذا يغيّر الموضوع كلياً!)
  - credit rating = تصنيف ائتماني (للشركات والدول — مختلف عن credit score!)
  - personal finance = التمويل الشخصي
  - budgeting = إعداد الميزانية الشخصية
  - myths = أساطير / مفاهيم خاطئة شائعة
- ⚠️⚠️⚠️ V232: الأرقام مقدسة — انقل كل رقم كما هو بالضبط:
  - $16.5M = 16.5 مليون دولار (وليس 1.65 مليون!)
  - EPS of $0.36 = ربحية السهم 0.36 دولار (لا تحكم ربح أم خسارة — فقط انقل الرقم!)
  - GAAP EPS = ربحية السهم وفق المحاسبة المقبولة (لا تترجمها إلى "خسارة"!)
  - ممنوع تحريك الفاصلة العشرية: 16.5 ≠ 1.65
- ⚠️⚠️⚠️ V232: ممنوع إضافة كلمات لم ترد في الأصل (خسارة، انخفاض حاد، تراجع كبير) إذا لم تذكر صراحةً. EPS ≠ خسارة تلقائياً!
- ترجم بدقة وأمانة — لا تُعد الصياغة لتزيين العنوان
- لا تستخدم علامات تنصيص أو أقواس حول العنوان
- أجب بالعنوان المترجم فقط بدون أي شرح`
            },
            { role: 'user', content: article.title || '' },
          ], { temperature: 0.3, maxTokens: 200, locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Title translation timeout')), PIPELINE_CONFIG.TRANSLATION_TIMEOUT_MS)
          ),
        ]);

        if (titleTranslation.content) {
          let cleaned = titleTranslation.content.trim().replace(/^["'"«»]+|["'"«»]+$/g, '');
          // V88: Fix mixed Arabic/Latin in title (e.g., "باركلAYS" → "باركليز")
          if (/[a-zA-Z]{2,}/.test(cleaned) && /[\u0600-\u06FF]/.test(cleaned)) {
            cleaned = fixMixedArabicTitleInTranslator(cleaned);
            console.warn(`[Translator V88] Fixed mixed Arabic/Latin title: "${titleTranslation.content.trim().slice(0, 60)}" → "${cleaned}"`);
          }
          if (isMostlyArabic(cleaned)) {
            titleAr = cleaned;
            fields.push('titleAr');
          }
        }
      } catch (err: any) {
        console.warn(`[Translator] Title translation failed: ${err.message}`);
      }
    } else {
      fields.push('titleAr');
    }

    // ── Step 2: Translate Summary to Arabic ──
    if ((!summaryAr || !isMostlyArabic(summaryAr)) && article.summary && article.summary.length > 10) {
      try {
        const summaryTranslation = await Promise.race([
          chatCompletion([
            {
              role: 'system',
              content: `أنت مترجم صحفي محترف من الإنجليزية إلى العربية لمنصة أخبار مالية "رؤى".

⚠️ V87: فحص الجمهور المستهدف قبل الترجمة:
- إذا كان الخبر موجّهاً للمستهلك الفرد (credit score, budgeting, personal finance) → حافظ على المعنى الشخصي
- credit score = درجة الائتمان الشخصية (NOT سجل مالي!)
- إذا كان موجّهاً للمستثمر/المؤسسة → تابع بشكل طبيعي

قواعد ترجمة الملخص:
- استخدم عربية فصحى موجزة ومهنية
- لا تترجم حرفياً — أعد الصياغة بأسلوب صحفي عربي طبيعي
- حافظ على الأسماء الإنجليزية للشركات والمؤشرات (Apple, S&P 500, Fed)
- ⚠️ لا تستبدل أسماء الشركات بـ "شركة ما" — اذكر الاسم الصريح
- استخدم المصطلحات المالية العربية المعتمدة (أسعار الفائدة، التضخم، الناتج المحلي)
- ⚠️ V87: credit score = درجة الائتمان الشخصية | credit rating = تصنيف ائتماني | myths = أساطير/مفاهيم خاطئة
- اجعل الملخص متماسكاً ومفهوماً لقارئ عربي
- أجب بالملخص المترجم فقط بدون أي شرح`
            },
            { role: 'user', content: article.summary.slice(0, 500) },
          ], { temperature: 0.3, maxTokens: 300, locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Summary translation timeout')), PIPELINE_CONFIG.TRANSLATION_TIMEOUT_MS)
          ),
        ]);

        if (summaryTranslation.content) {
          const cleaned = summaryTranslation.content.trim().replace(/^["'"«»]+|["'"«»]+$/g, '');
          if (isMostlyArabic(cleaned)) {
            summaryAr = cleaned;
            fields.push('summaryAr');
          }
        }
      } catch (err: any) {
        console.warn(`[Translator] Summary translation failed: ${err.message}`);
      }
    }

    // ── Step 3: WRITE (not translate!) full Arabic article content ──
    // This is the KEY change: we use AI to write a proper Arabic article
    // from scratch based on the headline and summary, instead of
    // translating garbage HTML text (navigation menus, footers, etc.)
    const needsContentAr = !contentAr ||
      contentAr.length < PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH ||
      !isMostlyArabic(contentAr) ||
      isGarbageContent(contentAr);

    if (needsContentAr && (titleAr || article.title)) {
      try {
        const articleTitle = titleAr || article.title || '';
        const articleSummary = summaryAr || article.summary || '';
        const category = article.category || 'اقتصاد كلي';

        const contentGeneration = await Promise.race([
          chatCompletion([
            {
              role: 'system',
              content: `أنت محرر أخبار مالية متخصص في منصة "رؤى". مهمتك معالجة خبر مالي خام وتحويله إلى مادة تحريرية احترافية.

⚠️ القاعدة الذهبية V75: لا تطلب من النموذج أكثر مما يعرف!
الخبر القصير الصادق أفضل من الخبر الطويل المزيف.

⚠️⚠️⚠️ V87: فحص الجمهور المستهدف — الأهمية القصوى! ⚠️⚠️⚠️
قبل كتابة أي كلمة، حدد: لمن هذا الخبر أصلاً؟
- موجّه للمستهلك الفرد (credit score, budgeting, personal loans, mortgage rates, savings, credit myths, bills)?
  → حافظ على المعنى الشخصي: لا تحوله لمحتوى عن الشركات والمؤسسات!
  → credit score = درجة الائتمان الشخصية (NOT سجل مالي! NOT تصنيف ائتماني!)
  → credit في سياق شخصي = ائتمان شخصي (NOT ائتمان مؤسسي أو سجل مالي)
  → bills = فواتير شهرية (كهرباء، ماء، إنترنت) — NOT فواتير شركات
  → myths = أساطير / مفاهيم خاطئة شائعة
  → إذا وعد العنوان بـ "3 أساطير" أو "5 نصائح" → اذكرها فعلاً في المحتوى!
- موجّه للمتداول/المستثمر/المؤسسة → تابع بشكل طبيعي

⚠️ مثال كارثي يجب تجنبه: مقال عن "credit score myths for consumers" (3 أساطير عن درجة الائتمان) تُرجم إلى مقال عن "السجلات المالية للشركات" (إيرادات، تكاليف إنتاج، ديون مؤسسية) — هذا تغيير كامل للموضوع!

قواعد التحرير الإلزامية:

1. الترجمة: ترجم أسماء الشركات تحريرياً لا حرفياً. احتفظ بالاسم الإنجليزي بين قوسين عند أول ذكر.
2. ⚠️ قاعدة أسماء الكيانات (NER): لا تستبدل أسماء الشركات أو الأشخاص أو المؤسسات بـ "شركة ما" أو "شخص ما" أو أي بديل عام. إذا ورد اسم شركة في العنوان أو الملخص (مثل Meteoviva، Bregal Milestone، Apple)، يجب ذكره بالتعريب الصوتي + الإنجليزي بين قوسين عند أول ذكر. مثال: "ميتيفيفا (Meteoviva)" وليس "شركة ما".
3. التحقق من المصدر: لا تنسب معلومات لمصادر غير مذكورة في النص الأصلي.
4. ⚠️ قاعدة طول الخبر — مرن حسب المصدر المتاح:
   - إذا كان المصدر مجرد عنوان فقط ← اكتب 1-2 فقرات فقط (لا تخترع سياقاً!)
   - إذا كان المصدر عنوان + ملخص ← اكتب 2-3 فقرات
   - إذا كان المصدر يحتوي محتوى تفصيلي ← اكتب حتى 4 فقرات
   - كل فقرة تحمل فكرة واحدة. لا تضف فقرات فارغة.
5. التسلسل المنطقي: الفقرة الأولى = الحدث الرئيسي. ثم السياق المتوفر فقط.
6. ممنوع: التكرار — إذا ذكرت فكرة مرة، لا تعد إليها. لكل جملة قيمة مضافة أو احذفها.
7. الأرقام: كل رقم يجب أن يكون مصدره النص الأصلي. لا تخترع أرقاماً.
8. ⚠️ قاعدة منع الاختراع الحاسمة: لا تخترع أحداثاً أو أسباباً أو ردود فعل أو تصريحات أو قرارات غير مذكورة في النص الأصلي. إذا لم يذكر النص سبباً → لا تخترعه. إذا لم يذكر رد فعل دولة → لا تخترعه. إذا لم يذكر النص تغريدة أو بياناً → لا تخترعه. الخبر القصير الصادق أفضل من الخبر الطويل المزيف.
9. ⚠️ لا تخلط بين العربية والإنجليزية في كلمة واحدة (مثل "هذا الannouncement" — خطأ!). إما اكتب "الإعلان" بالعربية أو "الإعلان (announcement)" بين قوسين.
10. ⚠️⚠️⚠️ V87: لا تحذف المحتوى الفعلي! إذا وعد العنوان بـ "3 أساطير" أو "5 أسباب" أو "7 نصائح" → اذكرها فعلاً في المقال. لا تستبدل المحتوى المحدد بكلام عام فارغ.

الناتج المطلوب:

اكتب خبراً صحفياً محرراً بعدد فقرات يتناسب مع المعلومات المتاحة:
- الفقرة 1: الحدث الرئيسي (إلزامي)
- الفقرة 2: السياق والأسباب — فقط إذا وردت في المصدر
- الفقرة 3: التأثير على الأطراف المعنية — فقط إذا ورد في المصدر
- الفقرة 4: التوقعات أو الموقف الرسمي — فقط إذا ورد في المصدر
⚠️ إذا لم تتوفر معلومات لفقرة معينة → لا تكتبها. فقرتان صادقتان أفضل من أربع فقرات مزيفة.

قواعد إضافية:
- لا تكتب عناوين فرعية أو نقاطاً أو رموزاً
- لا تكتب أي شرح أو ملاحظات — فقط نص الخبر المتصل
- لا تستخدم أي تنسيق Markdown (لا ** ولا ## ولا * ولا -)
- اكتب نصاً عادياً فقط — كل فقرة في سطر منفصل
- استخدم عربية فصحى رصينة بأسلوب صحفي مهني
- لا تستخدم كلمات إنجليزية إلا الاختصارات المعروفة عالمياً (GDP, S&P, AI, ETF, IPO, WTI, CL, BZ)
- استخدم المصطلحات المالية العربية المعتمدة:
  * interest rate → سعر الفائدة
  * inflation → التضخم
  * Federal Reserve → الاحتياطي الفيدرالي
  * GDP → الناتج المحلي الإجمالي
  * earnings → الأرباح
  * revenue → الإيرادات
  * bond → سند
  * yield → العائد
  * stock → سهم
  * market → سوق
  * recession → ركود
  * stimulus → تحفيز
  * oil prices → أسعار النفط
  * crude oil → النفط الخام
  * oil futures → عقود النفط الآجلة
  * sanctions → عقوبات
  * peace deal → اتفاق سلام
  * chips (semiconductors) → رقائق إلكترونية (NOT هشامات!)
  * session → جلسة (NOT sesión!)
  * dollar → دولار (NOT دينار!)
  * production cut → خفض الإنتاج (يرفع الأسعار عادةً!)
  ⚠️⚠️⚠️ V87: مصطلحات التمويل الشخصي — ترجمة دقيقة إلزامية:
  * credit score → درجة الائتمان الشخصية (NOT سجل مالي! — هذا يغيّر الموضوع كلياً!)
  * credit rating → تصنيف ائتماني (للشركات والدول — مختلف عن credit score!)
  * credit report → تقرير ائتماني شخصي
  * credit bureau → مكتب ائتمان
  * FICO score → درجة فيكو الائتمانية
  * personal loan → قرض شخصي
  * mortgage → رهن عقاري / قرض سكني
  * budgeting → إعداد الميزانية الشخصية
  * savings → مدخرات
  * retirement planning → تخطيط التقاعد
  * bills → فواتير شهرية (كهرباء، ماء) — NOT فواتير شركات
  * myths → أساطير / مفاهيم خاطئة شائعة
- الفئة: ${category}`
            },
            {
              role: 'user',
              content: `العنوان: ${articleTitle}\nالملخص: ${articleSummary.slice(0, 600)}`
            },
          ], { temperature: 0.4, maxTokens: 2500, priority: 'generation', locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Content generation timeout')), PIPELINE_CONFIG.CONTENT_GENERATION_TIMEOUT_MS)
          ),
        ]);

        if (contentGeneration.content) {
          let cleaned = contentGeneration.content.trim();
          // V64: Strip Markdown formatting from AI output (##, **, *, -)
          cleaned = stripMarkdown(cleaned);
          // V88: Deduplicate content — remove repeated sentences (Barclays problem)
          cleaned = deduplicateArabicContent(cleaned);
          // Validate: must be Arabic and long enough
          if (cleaned.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH && isMostlyArabic(cleaned) && !isGarbageContent(cleaned)) {
            contentAr = cleaned;
            fields.push('contentAr');
          } else {
            console.warn(`[Translator] Generated content failed quality check: length=${cleaned.length}, arabic=${isMostlyArabic(cleaned)}, garbage=${isGarbageContent(cleaned)}`);
          }
        }
      } catch (err: any) {
        console.warn(`[Translator] Content generation failed: ${err.message}`);
      }

      // ── Step 3b: Retry with simpler prompt if first attempt failed ──
      if ((!contentAr || contentAr.length < PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH) && titleAr) {
        try {
          const retryGeneration = await Promise.race([
            chatCompletion([
              {
                role: 'system',
                content: `أنت محرر أخبار مالية متخصص. اكتب خبراً مالياً محرراً بالعربية — بعدد فقرات يتناسب مع المعلومات المتاحة (1-4 فقرات).

⚠️ القاعدة الذهبية V75: لا تطلب من النموذج أكثر مما يعرف!
الخبر القصير الصادق أفضل من الخبر الطويل المزيف.

⚠️ V87: احفظ الموضوع الأصلي! credit score = درجة الائتمان الشخصية (NOT سجل مالي!). إذا كان الخبر عن تمويل شخصي → حافظ على السياق الشخصي.

قواعد صارمة:
- الفقرة 1: الحدث الرئيسي (إلزامي) | الفقرات التالية: فقط إذا وردت المعلومات في المصدر
- ⚠️ لا تخترع أحداثاً أو أسباباً أو ردود فعل أو تصريحات غير مذكورة في المصدر
- لا تكرر أي فكرة — لكل جملة قيمة مضافة أو احذفها
- كل رقم يجب أن يكون من النص الأصلي — لا تخترع أرقاماً
- ترجم أسماء الشركات تحريرياً مع الاحتفاظ بالاسم الإنجليزي بين قوسين عند أول ذكر
- ⚠️ لا تستبدل أسماء الشركات بـ "شركة ما" — اذكر الاسم الصريح دائماً بالتعريب الصوتي + الإنجليزي
- استخدم المصطلحات المالية العربية (سعر الفائدة، التضخم، الناتج المحلي، عقود آجلة)
- ⚠️ V87: credit score = درجة الائتمان الشخصية | credit rating = تصنيف ائتماني | bills = فواتير شهرية | myths = أساطير
- لا تستخدم كلمات إنجليزية إلا الاختصارات المعروفة
- لا تخلط العربية والإنجليزية في كلمة واحدة
- لا تستخدم أي تنسيق Markdown (لا ** ولا ## ولا *)
- اكتب نصاً عادياً فقط — كل فقرة في سطر منفصل
- اكتب فقط النص بدون عناوين فرعية أو شرح
- إذا كان المصدر مجرد عنوان — اكتب فقرة أو فقرتين فقط
- ⚠️ V87: إذا وعد العنوان بـ "3 أساطير" أو "5 نصائح" → اذكرها فعلاً ولا تحذفها`
              },
              {
                role: 'user',
                content: titleAr
              },
            ], { temperature: 0.5, maxTokens: 2000, locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Content generation retry timeout')), 30000)
            ),
          ]);

          if (retryGeneration.content) {
            let cleaned = retryGeneration.content.trim();
            // V64: Strip Markdown formatting from AI output
            cleaned = stripMarkdown(cleaned);
            if (cleaned.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH && isMostlyArabic(cleaned)) {
              contentAr = cleaned;
              fields.push('contentAr');
            }
          }
        } catch (err: any) {
          console.warn(`[Translator] Content generation retry failed: ${err.message}`);
        }
      }
    }

    // ── Step 4: Generate slug from Arabic title (includes random suffix) ──
    if (!slug && titleAr) {
      slug = generateSlug(titleAr); // Now includes random 4-char suffix to reduce collisions
      fields.push('slug');
    }

    // ── Step 5: Update database ──
    const updateData: any = {};
    if (titleAr) updateData.titleAr = titleAr;
    if (summaryAr) updateData.summaryAr = summaryAr;
    if (contentAr) updateData.contentAr = contentAr;
    if (slug) updateData.slug = slug;

    if (Object.keys(updateData).length > 0) {
      await db.newsItem.update({
        where: { id: articleId },
        data: updateData,
      });
    }

    // V38: GOLDEN RULE — Do NOT advance stage without BOTH titleAr AND contentAr.
    // Previously, stage advanced with just titleAr, causing articles to appear
    // on site without Arabic content. Now we require BOTH.
    const hasTitleAr = !!titleAr && isMostlyArabic(titleAr);
    const hasContentAr = !!contentAr &&
      contentAr.length >= PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH &&
      isMostlyArabic(contentAr) &&
      !isGarbageContent(contentAr);

    if (hasTitleAr && hasContentAr) {
      const { advanceStage } = await import('../queue/job-manager');
      await advanceStage(articleId, article.processingStage as ProcessingStage);
      result.success = true;
    } else {
      // V38: DO NOT advance — the article stays at content_loaded for retry
      const missing: string[] = [];
      if (!hasTitleAr) missing.push('titleAr');
      if (!hasContentAr) missing.push(`contentAr (need ${PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH}+ Arabic chars)`);
      result.error = `Missing required fields: ${missing.join(', ')}`;
      console.warn(`[Translator] Article ${articleId} BLOCKED from advancing: ${result.error}`);
    }

    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[Translator] Article ${articleId}: ${result.success ? 'OK' : 'FAIL'} (${fields.join(', ')}) contentAr=${contentAr?.length || 0}chars in ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[Translator] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}

// ── V88: Title and Content Cleanup Functions ──

// Fix mixed Arabic/Latin in translated titles
// Examples: "باركلAYS" → "باركليز", "التokens" → "التوكنات"
// ─── V89: Company Name Transliteration Dictionary ──────────
// Instead of deleting Latin chars embedded in Arabic ("باركلAYS" → "باركل" — broken),
// we transliterate to the correct Arabic name ("باركليز").
const COMPANY_TRANSLITERATIONS: Record<string, string> = {
  // Major banks & financial institutions
  'Barclays': 'باركليز',
  'JPMorgan': 'جي بي مورغان',
  'Goldman': 'غولدمان',
  'Sachs': 'ساكس',
  'Morgan': 'مورغان',
  'Stanley': 'ستانلي',
  'Deutsche': 'دويتشه',
  'Citigroup': 'سيتي غروب',
  'Wells': 'ويلز',
  'Fargo': 'فارغو',
  'UBS': 'يوبس',
  'Credit': 'كريدي',
  'Suisse': 'سويس',
  'BNP': 'بي إن بي',
  'Paribas': 'باريبا',
  'Standard': 'ستاندرد',
  'Chartered': 'تشارترد',
  // Tech companies
  'Apple': 'أبل',
  'Microsoft': 'مايكروسوفت',
  'Google': 'غوغل',
  'Amazon': 'أمازون',
  'Meta': 'ميتا',
  'Tesla': 'تسلا',
  'Nvidia': 'إنفيديا',
  'Intel': 'إنتل',
  'Samsung': 'سامسونغ',
  'Oracle': 'أوراكل',
  'Netflix': 'نتفليكس',
  // Other well-known entities
  'Berkshire': 'بيركشاير',
  'Hathaway': 'هاثاواي',
  'Visa': 'فيزا',
  'Mastercard': 'ماستركارد',
  'PayPal': 'باي بال',
  'Boeing': 'بوينغ',
  'Caterpillar': 'كاتربيلر',
  'Chevron': 'شيفرون',
  'Exxon': 'إكسون',
  'Mobil': 'موبايل',
  'Shell': 'شل',
  'Total': 'توتال',
  'Energies': 'إنرجيز',
  'Pfizer': 'فايزر',
  'Johnson': 'جونسون',
  'Walmart': 'وول مارت',
  'Disney': 'ديزني',
  'Nike': 'نايكي',
  'Coca': 'كوكا',
  'Cola': 'كولا',
  'Procter': 'بروكتير',
  'Gamble': 'غامبل',
  'United': 'يونايتد',
  'Health': 'هيلث',
  'American': 'أمريكان',
  'Express': 'إكسبرس',
};

function fixMixedArabicTitleInTranslator(title: string): string {
  if (!title) return title;

  // Valid financial abbreviations that should be preserved
  const validAbbr = new Set([
    'GDP', 'AI', 'ETF', 'IPO', 'OTC', 'EPS', 'PE', 'EBITDA',
    'NYMEX', 'COMEX', 'ICE', 'NYSE', 'NASDAQ', 'LSE', 'TSE', 'ASX',
    'CME', 'CBOT', 'FOMC', 'CPI', 'PMI',
    'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
    'WTI', 'BZ', 'CL', 'NG', 'GC', 'SI', 'XAU', 'XAG',
    'VIX', 'DXY', 'SPX', 'NDX', 'DAX', 'CAC', 'FTSE', 'NKY',
    'BTC', 'ETH', 'USDT', 'USDC',
    'HSBC', 'FED', 'OPEC', 'IMF',
  ]);

  let fixed = title;

  // Step 1: Try to transliterate known company names first (V89)
  // "باركلAYS" → "باركليز" (not "باركل" — broken!)
  const sortedCompanyNames = Object.keys(COMPANY_TRANSLITERATIONS)
    .sort((a, b) => b.length - a.length);

  for (const engName of sortedCompanyNames) {
    const araName = COMPANY_TRANSLITERATIONS[engName];
    if (new RegExp(engName, 'i').test(fixed)) {
      fixed = fixed.replace(new RegExp(engName, 'gi'), araName);
      console.log(`[Translator V89] Transliterated "${engName}" → "${araName}" in title`);
    }
  }

  // Step 2: For remaining Latin runs attached to Arabic (not matched by dictionary)
  const latinRuns = fixed.match(/[a-zA-Z]+/g) || [];
  for (const run of latinRuns) {
    const isAttachedToArabic = new RegExp(`[\\u0600-\\u06FF]${run}|${run}[\\u0600-\\u06FF]`).test(fixed);
    const isValid = validAbbr.has(run.toUpperCase());

    if (isAttachedToArabic && !isValid) {
      fixed = fixed.replace(new RegExp(run, 'g'), '');
      console.warn(`[Translator V89] Removed mixed Latin "${run}" from title (no transliteration found)`);
    }
  }

  return fixed.replace(/\s{2,}/g, ' ').trim() || title;
}

// Deduplicate Arabic content — remove sentences that convey the same idea
// Barclays problem: same sentence repeated 4-6 times with minor rewording
function deduplicateArabicContent(text: string): string {
  if (!text || text.length < 50) return text;

  const paragraphs = text.split('\n');
  const seen = new Map<string, boolean>();
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) { result.push(''); continue; }

    // Split paragraph into sentences
    const sentences = trimmed.split(/(?<=[.؟!؛])\s+/);
    const kept: string[] = [];

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s || s.length < 15) { kept.push(s); continue; }

      // Normalize for comparison
      const normalized = s.replace(/\s+/g, ' ').replace(/[\u064B-\u065F]/g, '').trim();

      let isDuplicate = false;
      for (const [existing] of seen) {
        if (Math.abs(existing.length - normalized.length) > normalized.length * 0.4) continue;
        const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(existing.split(/\s+/).filter(w => w.length > 2));
        const intersection = [...words1].filter(w => words2.has(w)).length;
        const union = new Set([...words1, ...words2]).size;
        if (union > 0 && intersection / union > 0.75) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        console.warn(`[Translator V88] Removed duplicate sentence: "${s.slice(0, 60)}..."`);
      } else {
        seen.set(normalized, true);
        kept.push(s);
      }
    }

    if (kept.length > 0) {
      result.push(kept.join(' '));
    }
  }

  return result.filter(p => p !== '').join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Quality Checks ──

// Check if text is mostly Arabic (40% threshold for financial text)
function isMostlyArabic(text: string): boolean {
  if (!text || text.length < 3) return false;

  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = arabicChars + latinChars;

  if (totalLetters === 0) return false;
  const ratio = arabicChars / totalLetters;

  if (ratio < PIPELINE_CONFIG.ARABIC_RATIO_THRESHOLD || arabicChars < PIPELINE_CONFIG.MIN_ARABIC_CHARS) {
    return false;
  }

  // Check for mixed words (e.g., "كاريبbeans")
  const words = text.split(/\s+/);
  let mixedWordCount = 0;
  for (const word of words) {
    const hasArabic = /[\u0600-\u06FF]/.test(word);
    const hasLatin = /[a-zA-Z]{2,}/.test(word);
    if (hasArabic && hasLatin) mixedWordCount++;
  }

  if (mixedWordCount > PIPELINE_CONFIG.MIXED_WORD_LIMIT) return false;

  return true;
}

// V64: Strip Markdown formatting from AI output
// AI models sometimes return **bold**, ## headings, * italic, - bullets
// even when told not to. This function removes all Markdown syntax.
function stripMarkdown(text: string): string {
  if (!text) return text;
  let result = text;
  // Remove heading markers (## ### etc)
  result = result.replace(/^#{1,6}\s+/gm, '');
  // Remove bold markers (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/__(.+?)__/g, '$1');
  // Remove italic markers (*text* or _text_)
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');
  // Remove bullet markers (- or * at start of line)
  result = result.replace(/^[\-\*]\s+/gm, '');
  // Remove horizontal rules (--- or ***)
  result = result.replace(/^[\-\*]{3,}\s*$/gm, '');
  // Remove inline code markers (`code`)
  result = result.replace(/`(.+?)`/g, '$1');
  // Remove link syntax [text](url)
  result = result.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  // V89: Remove Markdown table syntax — pipes between paragraphs
  // Pattern: standalone | on its own or between Arabic text (not valid tables)
  // Remove table separator lines (|---|---|)
  result = result.replace(/^\|[\s\-:|]+\|$/gm, '');
  // Remove pipe characters that are standalone paragraph separators
  result = result.replace(/^\s*\|\s*$/gm, '');
  // Remove table row pipes when content is Arabic text (not data tables)
  // Only strip if the line looks like Arabic text with pipes, not a real data table
  result = result.replace(/^(\|[\u0600-\u06FF].*?)\|/gm, '$1');
  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

// Detect garbage content — navigation menus, site structure, etc.
// This catches translated HTML navigation that looks like:
// "تجاوز التنقل / أسواق الولايات المتحدة / أسواق أوروبا / ..."
function isGarbageContent(text: string): boolean {
  if (!text || text.length < 50) return true;

  // Navigation indicators — these are NEVER in real article content
  const garbagePatterns = [
    /تجاوز التنقل/i,
    /تخطى إلى التنقل/i,
    /تخطي المحتوى/i,
    /الرئيسية.*الأخبار.*الرياضة/i,
    /أسواق الولايات المتحدة.*أسواق أوروبا/i,
    /الأكثر نشاطاً.*المكاسب اليومية/i,
    /تخطى إلى المحتوى الرئيسي/i,
    /تخطى إلى العمود الأيمن/i,
    /برنامج الإذاعة/i,
    /مشاركة\s*حفظ/i,
    /الأعضاء المؤسسون/i,
    /سجّل الدخول/i,
    /أنشئ حساباً/i,
    /اشترك.*برو/i,
    /قائمة المراقبة/i,
    /البث المباشر.*قائمة/i,
    /الأكثر قصفاً/i,
    /مقارنة الأسهم/i,
    /محفظتي/i,
    /تقويم الأرباح/i,
    /تقسيم الأسهم/i,
    /الطرح الأول العام/i,
    /مُحول العملات/i,
    /الرسومات المتقدمة/i,
    /دليل الشراء/i,
    /أفكار الهدايا/i,
    /اختيارات المحرر/i,
    /الأسهم الشائعة/i,
    /عروض حية/i,
    // If text has 10+ short lines (< 30 chars each), it's likely a menu
  ];

  for (const pattern of garbagePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check for menu-like structure: many short lines with / or | separators
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  if (lines.length > 15) {
    const shortLines = lines.filter(l => l.trim().length < 30).length;
    if (shortLines / lines.length > 0.7) {
      return true; // 70%+ short lines = likely a menu
    }
  }

  // Check for excessive "market data" patterns (S&P 500 7,230.12 +21.11...)
  const marketDataPattern = /\d+[,.]?\d*\s*[+-]\s*\d+[,.]?\d*\s*[+-]?\d*\.?\d*%/g;
  const marketDataMatches = text.match(marketDataPattern);
  if (marketDataMatches && marketDataMatches.length > 5) {
    return true; // Too much market data = likely a market summary page, not article content
  }

  return false;
}
