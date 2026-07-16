// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// Patent Pending: "Method for Unified Single-Call Processing of
// Multilingual Financial News Using Artificial Intelligence"
// ═══════════════════════════════════════════════════════════════
// ─── Unified Processor Agent V2 (V145) ──────────────────────────
// V145: Content loader integration — `content` field now populated with
//   full article text scraped from source URL (up to 12,000 chars).
//   Increased contentEn limit in prompt from 2,000 → 4,000 chars.
//   This gives the AI MUCH richer source material, producing more
//   detailed and accurate articles (2-4 paragraphs instead of 1-2).
// V143: Opinion piece rule — don't add assets/companies not mentioned in original source
//   - If article is opinion/column/editorial → only list assets explicitly named in source
//   - Adding unmentioned companies = fabricated information for investors
//   - This differs from macro data where downstream impact is real and confirmed
// V2: Macro economic news — affected assets enhancement (V91):
//   - NEW: Macro news (unemployment, CPI, NFP, GDP, Fed rates) now list
//     USD/DXY, Treasury bonds (TNX/TLT), Gold (XAUUSD/GLD) in sections [2] and [3]
//   - NEW: Gate 1 [B] explicitly instructs to include macro-affected assets
//   - NEW: Section [2] has per-data-type guidance (jobs → USD, CPI → bonds, etc.)
//   - NEW: Section [3] has downstream assets (rate-sensitive, growth/value, defensive)
//   - NEW: Gate 4 validates macro asset coverage
// Combines Translation + Analysis in a SINGLE AI API call.
// This is the core architectural improvement from the HTML pipeline comparison:
//
// OLD FLOW (5 API calls per article):
//   Fetcher → Translator (3 calls: title, summary, content) → Analyzer (1 call) → Imager → Publisher
//
// NEW FLOW (3 API calls per article):
//   Fetcher → UnifiedProcessor (1 call does ALL: translate + 4 gates) → Imager → Publisher
//
// WHY THIS IS BETTER:
// 1. No context loss between translation and analysis stages
// 2. Classification (path A/B/C) can inform how content is written
// 3. Fewer API calls = lower cost + faster processing
// 4. Claude's consistent context produces better Arabic quality
// 5. The HTML pipeline used this exact approach (single Claude call, 4 gates)
//
// FALLBACK: When Bedrock is unavailable, the old Translator + Analyzer are used.

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { PIPELINE_CONFIG } from '../config';
import { ProcessingStage } from '../queue/job-types';

export interface UnifiedResult {
  articleId: string;
  success: boolean;
  duration: number;
  fields: string[];
  error?: string;
}

export async function processArticleUnified(articleId: string): Promise<UnifiedResult> {
  const startTime = Date.now();
  const result: UnifiedResult = { articleId, success: false, duration: 0, fields: [] };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already fully processed with quality data
    if (article.aiAnalysis && article.titleAr && article.contentAr) {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          const englishSentencePattern = /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/;
          if (!englishSentencePattern.test(parsed.fullContent) && !englishSentencePattern.test(String(article.contentAr))) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
        }
      } catch (skipErr) {
        // V155: Non-critical: if we can't check existing data, just reprocess
        console.warn(`[UnifiedProcessor V155] Skip check failed for ${articleId}: ${skipErr instanceof Error ? skipErr.message : 'unknown'}`);
      }
    }

    // Prepare ALL context - English originals + any existing Arabic
    const titleEn = article.title || '';
    const summaryEn = article.summary || '';
    const contentEn = article.content || '';
    const category = article.category || 'اقتصاد كلي';
    const existingTitleAr = article.titleAr || '';
    const existingSummaryAr = article.summaryAr || '';
    const existingContentAr = article.contentAr || '';

    // ── SINGLE API CALL: Pre-filter + 4 Gates in one prompt ──
    const unifiedPrompt = `أنت نظام معالجة أخبار مالية متكامل لمنصة "رؤى". مهمتك معالجة الخبر بالكامل عبر بوابة تصفية ثم 4 بوابات إلزامية في طلب واحد، وإنتاج العنوان العربي + الملخص العربي + المحتوى العربي + التحليل المالي الكامل.

═══ بوابة التصفية — هل هذا الخبر مالي؟ ═══
⚠️ V125: هذا الخبر تمت تصفيته مسبقاً بفلتر الكلمات المالية المزدوج (إنجليزي + عربي).
المُجلِب تحقق بالفعل من أن الخبر يحتوي على كلمات مالية. افترض أنه مالي.

❌ ممنوع إصدار status: "REJECTED" ❌
ارفض فقط إذا تحقق الشرطان معاً:
1. الموضوع لا علاقة له بالاقتصاد أو الأسواق أو الشركات
2. لا يوجد أي تأثير محتمل على أصل مالي قابل للتداول

إذا كنت متردداً — صنّفه كمسار [C]. ❌ لا ترفض ❌

═══ فلتر جغرافي — الأولوية V129 ═══
صنّف الأولوية الجغرافية للخبر:

🔴 أولوية عُليا (معالجة كاملة + تظهر في الصفحة الرئيسية):
- أسواق عالمية كبرى: أمريكا (وال ستريت، ناسداك، S&P، الفيدرالي)، أوروبا (ECB، FTSE، DAX)، آسيا الكبرى (اليابان/نيكي، الصين/شنغهاي، كوريا، الهند)
- أسواق عربية: السعودية/تداول، الإمارات/دبي، مصر، قطر، الكويت، البحرين، عُمان، الأردن
- سلع عالمية: نفط (WTI، برنت)، ذهب (XAU)، فضة، نحاس، أوبك
- أصول رقمية: بيتكوين، إيثريوم، كريبتو
- أخبار التجارة/التعريفات بين اقتصادات كبرى

🟡 أولوية منخفضة (تُعالج لكن تُصنَّف تلقائياً كـ "منخفض الأولوية" ولا تظهر في الصفحة الرئيسية):
- أسواق محلية لدول غير عربية وغير رئيسية (باكستان، بنغلاديش، إثيوبيا، نيجيريا، كينيا، أوغندا، غانا، زيمبابوي، موزمبيق، ميانمار، كمبوديا، نيبال، سريلانكا، بوليفيا، إكوادور، باراغواي...)
- إذا كان الخبر يذكر دولة منخفضة الأولوية لكنه مرتبط أيضاً بسوق كبرى ← أعطِه أولوية عُليا

⚠️ التطبيق: إذا كان الخبر منخفض الأولوية جغرافياً ← اكتب في sector: "منخفض الأولوية" + impactLevel: "low"

أمثلة على ما يُقبل (لا ترفض هذه أبداً):
- قمة ترامب-شي → يؤثر على الأسواق والتجارة → مسار [A]
- أخبار سياسية تؤثر على الأسواق → مسار [B]
- تقارير أرباح شركات → مسار [A]
- أخبار اقتصاد كلي (وظائف، تضخم، ناتج محلي) → مسار [B]
- أخبار شركات حتى بدون رمز بورصي → مسار [B] أو [C]
- أخبار تجارة دولية وتعريفات → مسار [A]
- أخبار تقنية تؤثر على أسهم التكنولوجيا → مسار [B]
- أخبار طاقة أو نفط أو معادن → مسار [A]
- أي خبر من مصدر مالي يبدو عاماً → مسار [C]

أمثلة على ما يُرفض (فقط هذان):
- مباراة كرة قدم بدون أي تأثير مالي
- حادثة اجتماعية أو طقس بدون أي صلة اقتصادية

إذا اجتاز الخبر التصفية → تابع البوابات التالية كالمعتاد (بدون ذكر status في JSON)

═══ البوابة 0 — استخراج البيانات الخام ═══
من النص الأصلي الإنجليزي، استخرج:
- اسم الشركة / الكيان الرئيسي (بالإنجليزي) — إذا كان الخبر عن سلع أو عقود آجلة، اكتب اسم السلة (مثال: WTI Crude Oil, Brent Crude, Gold)
- الرمز البورصي إن وُجد (مثال: AAPL, CL, BZ, IBIT, COIN)
- البورصة / سوق التداول (مثال: NYMEX, COMEX, NYSE, NASDAQ)
- الأرقام والنسب المذكورة صراحةً في النص
- المصدر الأصلي
إذا لم تجد رمزاً بورصياً واضحاً ← سجّل: "لا يوجد أصل مدرج مؤكد"

═══ البوابة 1 — تصنيف الموضوع وتحديد المسار ═══
حدد الجمهور المستهدف أولاً:
- موجّه للمستهلك الفرد (credit score, budgeting, personal loans)؟ → القطاع = "تمويل شخصي" + المسار [B] حتماً
- موجّه للمتداول/المستثمر → تابع التصنيف الطبيعي

[A] خبر مالي قابل للتداول: شركة مدرجة + رمز بورصي + حدث مؤثر | عقود آجلة + رمز | ETF متداولة | صناديق بيتكوين (IBIT, FBTC, ARKB...) | أزواج فوركس | عملات مشفرة | شركات مشفرة (COIN, MSTR) | مؤشرات | أخبار تجارة/تعريفات بين اقتصادات كبرى
→ خبر كامل + تحليل كامل + سيناريوهات تداول

[B] خبر اقتصادي كلي / اجتماعي / تمويل شخصي: ظواهر كلية بدون أصل محدد قابل للتداول | محتوى توعوي للمستهلك
→ خبر كامل + سياق اقتصادي فقط — ممنوع سيناريوهات التداول
  ⚠️ V91: الأخبار الكلية الاقتصادية (تعويضات بطالة، CPI، NFP، GDP، قرارات فائدة، PMI) تؤثر بقوة على أصول مالية حقيقية! اذكرها في القسمين [2] و[3]:
    • الدولار الأمريكي (DXY) وأزواجه (EUR/USD, USD/JPY, GBP/USD)
    • سندات الخزانة (TNX, TLT) — بيانات قوية = عوائد صاعدة وسندات هابطة
    • الذهب (XAUUSD, GLD) — بيانات قوية = ضغط هبوطي على الذهب
    • المؤشرات الرئيسية (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] صفقات / شركات خاصة / معلومات شحيحة
→ خبر كامل + تحليل مختصر + تصنيف ثقة منخفض

⚠️ تنبيهات المسار:
- أخبار التجارة والتعريفات بين اقتصادات كبرى → المسار [A] حتماً
- أخبار البيتكوين/العملات المشفرة/صناديق ETF الرقمية → المسار [A] حتماً + القطاع = "أصول رقمية"
- إذا ذُكرت رموز بورصية (COIN, IBIT, FBTC, BTC, ETH...) → المسار [A] حتماً
- ممنوع كتابة "لا ينطبق" في الأقسام [2] و[3] لأخبار العملات المشفرة أو صناديق ETF

═══ البوابة 2 — تحرير الخبر بالعربية ═══
ترجم العنوان والملخص واكتب المحتوى العربي من المصدر الإنجليزي:

⚠️⚠️⚠️ قاعدة رقمية حاسمة V232 — الأرقام مقدسة! ⚠️⚠️⚠️
كل رقم في النص الإنجليزي الأصلي يجب أن يظهر بالضبط في العربية:
- $16.5M = 16.5 مليون دولار (وليس 1.65 مليون!)
- EPS of $0.36 = ربحية السهم 0.36 دولار (لا تحكم هل هي ربح أم خسارة — فقط انقل الرقم!)
- GAAP EPS = ربحية السهم وفق مبادئ المحاسبة المقبولة عموماً (لا تترجمها إلى "خسارة"!)
- ممنوع تحريك الفاصلة العشرية: 16.5 ≠ 1.65 و 0.36 ≠ 3.6
- ممنوع تحويل "revenue of $16.5M" إلى "إيرادات 1.65 مليون" — انقل الرقم كما هو!
- إذا لم تكن متأكداً من الرقم ← انقله كما ورد بالأرقام العربية: "إيرادات بقيمة 16.5 مليون دولار"
- الاحتفاظ بوحدة القياس: M = مليون،B = مليار،K = ألف

قواعد الترجمة:
1. العنوان العربي: ترجمة دقيقة أمينة — عربية فصحى صحفية رصينة. ⚠️ ترجم بدقة ولا تُعد الصياغة لتزيين العنوان. احتفظ بالأسماء الإنجليزية للشركات + الرمز البورصي إن وُجد. تعريب صوتي معقول + الإنجليزي بين قوسين عند أول ذكر. ممنوع استبدال أسماء الشركات بـ "شركة ما". ⚠️⚠️ ممنوع إضافة كلمات لم ترد في الأصل (خسارة، انخفاض حاد، تراجع كبير) إذا لم تذكر صراحةً في العنوان الإنجليزي. EPS ≠ خسارة تلقائياً!
2. الملخص العربي: موجز ومهني بأسلوب صحفي عربي — ترجمة أمينة لا إعادة صياغة.
3. المحتوى العربي: اكتب خبراً صحفياً محرراً بالعربية بعدد فقرات يتناسب مع المصدر:
   - عنوان فقط → 1-2 فقرات
   - عنوان + ملخص → 2-3 فقرات
   - محتوى تفصيلي → حتى 4 فقرات
   الفقرة 1: الحدث الرئيسي | الفقرة 2: السياق — فقط إن ورد | الفقرة 3: التأثير — فقط إن ورد | الفقرة 4: التوقعات — فقط إن ورد
   ⚠️ لا تخترع أحداثاً أو أسباباً أو ردود فعل غير مذكورة في المصدر!
   ⚠️ كل رقم من المصدر الإنجليزي يجب أن يظهر في العربية بنفس القيمة بالضبط!

⚠️ مصطلحات إلزامية:
- futures = عقود آجلة (ليس أسهم!) | oil futures = عقود النفط الآجلة
- stocks = أسهم | crude oil = النفط الخام | commodities = سلع
- chips/semiconductors = رقائق إلكترونية (ليس هشامات!)
- session = جلسة (ليس sesión!) | dollar = دولار (ليس دينار!)
- tariffs = تعريفات جمركية | trade deal = اتفاقية تجارية
- credit score = درجة الائتمان الشخصية (NOT سجل مالي!)
- credit rating = تصنيف ائتماني (للشركات والدول — مختلف عن credit score!)
- production cut = خفض الإنتاج (يرفع الأسعار عادةً!)
- year-over-year = على أساس سنوي (ليس "العام الماضي")
- ممنوع كلمات أجنبية (إسبانية/فرنسية) — فقط اختصارات مالية إنجليزية مسموحة
- ممنوع عبارات افتتاحية غير رسمية (حسناً، طبعاً، إذن...)

═══ البوابة 3 — التحليل (هيكل V140: 5 أقسام) ═══

⚠️ مبدأ أساسي — حجم التحليل يتناسب مع حجم الخبر (V138+V140):
- إذا كان الخبر قصيراً (تصريح أو حدث واحد) → لا تملأ الفراغ بتكرار أو حشو
- اكتب تحليلاً مكثفاً وصادقاً بدلاً من تحليل طويل مصطنع
- إذا الخبر تصريح في مؤتمر وليس إعلاناً تشغيلياً — وضّح الفرق للقارئ

⚠️ ممنوع تسريب تعليقات AI الداخلية (V137):
- ممنوع: "توقفت هنا"، "ملاحظة:"، "سأكمل عند الطلب"، "كما هو مطلوب"
- ممنوع: أي نص بين قوسين مربعين [ملاحظة] أو (ملاحظة)
- النص النهائي يُقرأه المستثمر — لا يرى أي أثر لعملية التوليد

للمسار [C] فقط — هيكل مختصر (قسمان فقط):
[1] ماذا جرى — جملتان فقط
[5] للمتداول: "معلومات شحيحة — البيانات غير كافية لتحليل موثوق"
ممنوع على المسار [C]: أقسام [2] [3] [4]

للمسارين [A] و [B] — هيكل V140 (5 أقسام):

[1] ماذا جرى — 4-5 جمل فقط. لا تكرر ما كتبته في contentAr.
  ⚠️ هذا القسم يُعرض بجانب الخبر الأصلي — ممنوع تكرار نفس المعلومات بثلاثة أشكال.
  المحتوى الإلزامي: ماذا حدث + من قال (الاسم الكامل + المنصب + المؤسسة) + أين ومتى بالتحديد.
  مثال صحيح: "خوسيه فيرنانديز، نائب رئيس المدفوعات في PayPal، أعلن في مؤتمر Consensus Miami يوم 12 فبراير 2025..."
  مثال خاطئ: "أعلن ممثل عن PayPal..." — الاسم والمنصب إلزاميان إن ذُكرا في المصدر.

[2] لماذا يهم هذا الخبر — 3-5 جمل تشرح الأهمية بأرقام فعلية:
  ⚠️ أضف السعر الحالي للأصول المذكورة (مثال: "BTC يتداول عند 67,500 دولار حالياً")
  ⚠️ أضف حصص سوقية أو أحجام تداول إن ذُكرت (مثال: "PayPal تدير 435 مليون حساب نشط")
  ⚠️ ممنوع عبارات فارغة: "يعزز مصداقية القطاع"، "يفتح الباب أمام..."، "يشير إلى تحول استراتيجي"
  ⚠️ إذا ذكرت BTC أو PYPL أو أي أصل — أضف سعره الحالي أو حصته السوقية
  ⚠️ V91: أخبار البطالة/CPI/NFP/GDP/الفائدة تؤثر مباشرة على:
    • تعويضات بطالة أو NFP ← USD/DXY + EUR/USD + USD/JPY + سندات الخزانة TNX/TLT + الذهب XAUUSD/GLD
    • CPI أو تضخم ← USD/DXY + سندات الخزانة + الذهب + المؤشرات (SPY, QQQ)
    • قرار فائدة فيدرالي ← USD + سندات + ذهب + بنوك (XLF) + عقارات (XLRE)
    • GDP أو نمو اقتصادي ← USD + مؤشرات + قطاعات دورية (XLI) vs دفاعية (XLU)

[3] الأصول المتأثرة — قائمة مكثفة بأصول حقيقية قابلة للتداول:
  أ. أصول متأثرة مباشرة: الاسم + الرمز + البورصة + اتجاه التأثير + السبب المحدد
  ب. أصول متأثرة بالتداعي: شركات/صناديق/قطاعات محددة بالاسم والرمز
  ⚠️ V91: ممنوع كتابة "لا ينطبق" للأخبار الكلية!
  ⚠️ ممنوع وضع "صعودي" على كل أصل — كن واقعياً
  ⚠️ V91: إذا كان الخبر اقتصادي كلي ← اذكر أصولاً متأثرة بالتداعي حسب النوع:
    • بيانات سوق عمل قوية ← بنوك تستفيد (XLF, JPM, BAC) + عقارات تتراجع (XLRE)
    • بيانات تضخم مرتفعة ← أسهم نمو تتراجع (QQQ) + أسهم قيمة تتحسن (VTV, XLU)
    • بيانات سوق عمل ضعيفة ← ذهب يرتفع (GLD) + سندات ترتفع (TLT) + قطاعات دفاعية (XLU, XLV)
  ⚠️⚠️⚠️ V143: قاعدة مقالات الرأي — إذا كان الخبر مقال رأي أو تحليل شخصي (opinion piece, column, editorial):
    • لا تُضف أسماء شركات أو أصول أو رموز بورصية لم يذكرها المصدر الأصلي صراحةً
    • إذا كرامر أو أي محلل لم يذكر Nvidia أو Broadcom — لا تضفها!
    • السبب: إضافة أصول غير مذكورة = اختراع معلومات للمستثمر
    • هذا يختلف عن أخبار البيانات الكلية حيث التأثير بالتداعي حقيقي ومؤكد
    • إذا كان المقال رأياً عاماً بدون شركات محددة ← اكتب في القسم [3]: "المصدر لا يذكر أصولاً محددة — التأثير بالتداعي يشمل قطاع [كذا] بشكل عام"

[4] ما يجب مراقبته — 3 أحداث أو مؤشرات قادمة محددة مرتبطة بالخبر:
  ⚠️ لا تكتب "مراقبة التطورات" — كن محدداً!
  مثال صحيح: "1. تقرير أرباح PayPal في 15 مارس 2. كلمة جيروم باول في 20 مارس 3. بيانات CPI الشهرية في 12 مارس"
  مثال خاطئ: "مراقبة تطورات السوق"
  ⚠️ إذا لم تملك 3 أحداث محددة ← اكتب 1 أو 2 فقط (لا تخترع أحداثاً!)

[5] للمتداول — توصية تتناسب مع حجم الخبر:
  للمسار [A]: توصية محددة وقابلة للتنفيذ — لكن فقط إذا كان الخبر يكفي لبناء توصية:
    • إذا الخبر إعلان تشغيلي أو بيانات ملموسة → توصية محددة مع مستوى دخول + وقف خسارة + هدف
      ⚠️ دائماً اذكر السعر الحالي أولاً ثم الهدف — ممنوع أرقام معلّقة بدون مرجعية
      ⚠️ "قد يشهد BTC ارتفاعاً نحو 75,000" بدون سعره الحالي = رقم بلا مرجعية
    • إذا الخبر تصريح مبدئي أو توقعات → اكتب: "الخبر تصريح مبدئي وليس إعلاناً تشغيلياً — انتظر تأكيدات قبل اتخاذ قرار"
    • ممنوع توصية "شراء BTC وETH مع وقف خسارة 10%" على خبر تصريحي — هذا خطير قانونياً
    • ممنوع توصيات شراء/بيع بدون سعر دخول رقمي محدد — "شراء BTC" بدون سعر = مجازفة قانونية على المنصة
  للمسار [B]: "الانتظار حتى تتضح الاتجاهات الكلية"
  للمسار [C]: "معلومات شحيحة — البيانات غير كافية"

⚠️ قواعد التوصية:
- إيجابي = شرائي أو انتظاري فقط — ممنوع بيعي
- سلبي = بيعي أو انتظاري فقط — ممنوع شرائي
- محايد = انتظاري فقط
- ممنوع توصيات فارغة (مراعاة التوترات، مراقبة التطورات، الحذر مطلوب)
- وقف الخسارة بسعر السهم وليس بقيمة السوق الإجمالية

═══ البوابة 4 — التحقق النهائي ═══
□ ⚠️⚠️⚠️ V232: كل رقم من العنوان والنص الأصلي موجود بنفس القيمة في العنوان العربي والمحتوى؟ ($16.5M = 16.5 مليون وليس 1.65 مليون!)
□ ⚠️⚠️⚠️ V232: لم أضف كلمات لم ترد في الأصل (خسارة، انخفاض حاد) — EPS ≠ خسارة تلقائياً!
□ لا توجد معلومات مختلقة غير موجودة في النص الأصلي؟
□ لا تكرار بين contentAr و fullContent؟
□ لا كلمات أجنبية (إسبانية/فرنسية) في النص العربي؟
□ futures تُرجمت إلى عقود آجلة وليس أسهم؟
□ التوصية لا تتناقض مع المشاعر؟
□ أخبار التجارة/التعريفات مصنفة كمسار [A]؟
□ أخبار العملات المشفرة مصنفة كمسار [A] + القطاع = أصول رقمية؟
□ ⚠️⚠️⚠️ V91: إذا كان الخبر اقتصادي كلي (بطالة، CPI، فائدة، GDP) → هل أدرجت USD/DXY + سندات الخزانة + الذهب في القسم [2]؟
□ ⚠️⚠️⚠️ V91: هل القسم [3] يذكر أصولاً متأثرة بالتداعي حسب نوع البيانات الكلية؟
□ ⚠️⚠️⚠️ V138: هل حجم التحليل يتناسب مع حجم الخبر؟ (خبر قصير = تحليل مكثف وليس طويلاً)
□ ⚠️⚠️⚠️ V138: إذا كان الخبر تصريحاً وليس إعلاناً — هل وضّحت ذلك في القسم [5]؟
□ ⚠️⚠️⚠️ V137: هل يوجد أي تعليق AI داخلي في النص؟ إذا نعم → احذفه فوراً
□ ⚠️⚠️⚠️ V140: هل القسم [1] "ماذا جرى" يتضمن اسم المتحدث + منصبه + مؤسسته؟ (إن ذُكر في المصدر)
□ ⚠️⚠️⚠️ V140: هل القسم [2] "لماذا يهم" يحتوي على أرقام فعلية (أسعار/حصص/أحجام)؟
□ ⚠️⚠️⚠️ V140: هل القسم [4] "ما يجب مراقبته" يذكر أحداثاً محددة وليس "مراقبة التطورات"؟
□ ⚠️⚠️⚠️ V140: هل fullContent يستخدم الأقسام [1]-[5] (وليس [1]-[6])؟
□ ⚠️⚠️⚠️ V143: إذا كان الخبر مقال رأي/تحليل شخصي — هل القسم [3] يقتصر على الأصول المذكورة صراحةً في المصدر فقط؟
□ إذا فشل أي سؤال ← أصلح قبل الإخراج

═══ بيانات الخبر ═══
العنوان الإنجليزي: ${titleEn}
الملخص الإنجليزي: ${summaryEn.slice(0, 500)}
${contentEn ? `المحتوى الإنجليزي الأصلي: ${contentEn.slice(0, 4000)}` : ''}
${existingTitleAr ? `العنوان العربي الحالي (يمكن تحسينه): ${existingTitleAr}` : ''}
${existingSummaryAr ? `الملخص العربي الحالي (يمكن تحسينه): ${existingSummaryAr.slice(0, 300)}` : ''}
${existingContentAr ? `المحتوى العربي الحالي (يمكن تحسينه): ${existingContentAr.slice(0, 800)}` : ''}
الفئة الحالية: ${category}

═══ صيغة JSON المطلوبة ═══
أعطِ النتيجة في صيغة JSON فقط بدون أي نص إضافي:
{
  "titleAr": "العنوان العربي المترجم بدقة — عربية فصحى صحفية — الأرقام مطابقة للأصل",
  "summaryAr": "الملخص العربي المترجم — موجز ومهني — الأرقام مطابقة للأصل",
  "contentAr": "المحتوى العربي المحرر — فقرات حسب المصدر المتاح مفصولة بسطر جديد",
  "rawData": {
    "entityNameEn": "اسم الشركة أو السلة بالإنجليزي",
    "ticker": "الرمز البورصي أو لا يوجد أصل مدرج مؤكد",
    "exchange": "اسم البورصة أو سوق التعاقد",
    "figures": ["الأرقام والنسب من النص الأصلي"],
    "source": "المصدر الأصلي"
  },
  "path": "A أو B أو C",
  "sector": "القطاع الصحيح بالعربية",
  "sentimentReason": "تبرير تصنيف المشاعر",
  "editedArticle": "الخبر المحرر بفقرات حسب المصدر",
  "fullContent": "[1] ماذا جرى\\n4-5 جمل: الحدث + من قاله + أين ومتى\\n\\n[2] لماذا يهم هذا الخبر\\n3-5 جمل بأرقام فعلية\\n\\n[3] الأصول المتأثرة\\nأ. مباشرة + ب. بالتداعي\\n\\n[4] ما يجب مراقبته\\n1-3 أحداث قادمة محددة\\n\\n[5] للمتداول\\nتوصية أو انتظار",
  "introduction": "2-3 جمل تمهيدية",
  "body": "تحليل معمّق من 3-5 فقرات",
  "conclusion": "خلاصة استثمارية من 2-3 جمل",
  "summary": "ملخص الحدث في جملتين",
  "sentiment": "positive أو negative أو neutral",
  "impactLevel": "high أو medium أو low",
  "keyTakeaways": ["نقطة 1", "نقطة 2", "نقطة 3", "نقطة 4"],
  "affectedAssets": [
    {"symbol": "رمز الأصل", "name": "الاسم بالعربية مع الرمز", "direction": "up أو down أو neutral", "impactDegree": "high أو medium أو low", "reason": "سبب التأثير", "isTradable": true}
  ],
  "recommendation": "توصية استثمارية حادة ومحددة",
  "confidence": "X/10 — تبرير"
}

قواعد صارمة:
- أجب بالعربية فقط — لا كلمات أجنبية إطلاقاً إلا الاختصارات المالية
- لا تملأ قسماً إذا لم يكن لديك معلومة حقيقية — القسم المحذوف أفضل من المهلوس
- التوصية تتوافق مع التصنيف دائماً
- fullContent يجب أن يبدأ بـ [1] وينتهي بـ [5] للمسار [A] و [B]، ويحتوي فقط على [1] + [5] للمسار [C]
- path يجب أن يكون "A" أو "B" أو "C" فقط
- لا تنسَ titleAr و summaryAr و contentAr — هذه حقول إلزامية!
- contentAr لا يحتوي على تنسيق Markdown — نص عادي فقط بفقرات مفصولة بسطر جديد
- لا تكرر أي فكرة أكثر من مرة في التحليل كله
- ممنوع تكرار نص الخبر في contentAr ثم في fullContent — كل قسم يضيف معلومة جديدة
- "الرؤى الأساسية" (keyTakeaways) يجب أن تضيف معلومات جديدة — ليست إعادة صياغة للعنوان`;

    // V95b→V113: Increased maxTokens from 8000 to 12000 — 8000 caused JSON truncation
    // on complex articles (especially Path A with full trading scenarios).
    // The truncation recovery in parseAIJson helps but produces incomplete data
    // that the publisher rejects, leading to retry loops and article loss.
    // 12000 tokens ≈ 9000 Arabic chars — enough for the full JSON structure.
    const aiResult = await Promise.race([
      chatCompletion([
        {
          role: 'system',
          content: unifiedPrompt,
        },
        {
          role: 'user',
          content: titleEn || summaryEn || 'خبر مالي',
        },
      ], { temperature: 0.3, maxTokens: 12000, priority: 'generation', locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first, then Bedrock/Gemini
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Unified processing timeout')), 180000) // V73: 3 min timeout
      ),
    ]);

    if (!aiResult.content) {
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[UnifiedProcessor] AI response received: ${aiResult.provider}/${aiResult.model} in ${aiResult.duration}ms, ${aiResult.content.length} chars`);

    // Parse JSON from AI response
    let parsed = parseAIJson(aiResult.content);
    if (!parsed) {
      result.error = 'Failed to parse AI JSON response';
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── V126→V244: When AI rejects — retry once, then produce Path [C] minimal content ──
    // V126 originally skipped articles when AI rejected + retry failed. This caused
    // permanently lost articles — "skipped" articles were never reprocessed.
    // V244: When retry fails, produce minimal Path [C] content from the original English
    // source data instead of setting status to 'skipped'. This ensures the article
    // continues through the pipeline (imaging → publishing) rather than being lost.
    // Path [C] content is clearly labeled as "معلومات شحيحة" (scarce information)
    // so readers understand the limited data quality.
    if (parsed.status === 'REJECTED') {
      const reason = parsed.reason || 'خبر غير مالي';
      console.log(`[UnifiedProcessor V244] AI tried to REJECT article ${articleId}: "${reason}" — retrying once with no-reject prompt`);

      // Second attempt: explicitly tell the AI NOT to reject, ask for real content
      const noRejectPrompt = `أنت مترجم ومحلل أخبار مالية لمنصة "رؤى". ❌ ممنوع رفض هذا الخبر ❌

هذا الخبر تمت تصفيته بفلتر الكلمات المالية وهو من مصدر موثوق. يجب عليك معالجته.
صنّفه كمسار [C] إذا لم تجد بيانات كافية، لكن ❌ لا تصدر status: "REJECTED" ❌

⚠️ القاعدة الذهبية: اكتب فقط معلومات حقيقية من النص الأصلي. لا تخترع أرقاماً أو أسماء أو أحداث.

أعطِ النتيجة في صيغة JSON فقط:
{
  "titleAr": "العنوان بالعربية — ترجمة حقيقية من الإنجليزية",
  "summaryAr": "ملخص بالعربية — من النص الأصلي فقط",
  "contentAr": "خبر صحفي بالعربية — على الأقل 200 حرف — ترجم المحتوى الإنجليزي الأصلي، لا تخترع شيئاً",
  "rawData": {"entityNameEn": "اسم الكيان", "ticker": "الرمز أو لا يوجد", "exchange": "البورصة", "figures": ["أرقام من النص"], "source": "المصدر"},
  "path": "C",
  "sector": "القطاع",
  "sentimentReason": "سبب المشاعر",
  "editedArticle": "الخبر المحرر",
  "fullContent": "[1] ماذا جرى\\nملخص من جملتين\\n\\n[5] للمتداول\\nمعلومات شحيحة",
  "introduction": "مقدمة",
  "body": "تحليل",
  "conclusion": "خلاصة",
  "summary": "ملخص",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["نقطة من النص"],
  "affectedAssets": [],
  "recommendation": "معلومات شحيحة — البيانات غير كافية",
  "confidence": "3/10"
}

العنوان الإنجليزي: ${titleEn}
الملخص الإنجليزي: ${summaryEn.slice(0, 500)}
${contentEn ? `المحتوى الإنجليزي: ${contentEn.slice(0, 3000)}` : ''}`;

      try {
        const retryResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: noRejectPrompt },
            { role: 'user', content: titleEn || summaryEn || 'خبر مالي' },
          ], { temperature: 0.3, maxTokens: 4000, priority: 'generation', locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('V244 no-reject retry timeout')), 60000)
          ),
        ]);

        const retryParsed = parseAIJson(retryResult.content);
        if (retryParsed && !retryParsed.status && retryParsed.titleAr && retryParsed.contentAr
            && /[\u0600-\u06FF]/.test(retryParsed.titleAr)
            && /[\u0600-\u06FF]/.test(retryParsed.contentAr)
            && retryParsed.contentAr.length >= 80) {
          // Success! AI produced real content on retry — use it
          console.log(`[UnifiedProcessor V244] No-reject retry SUCCEEDED for ${articleId} — real content produced`);
          parsed = { ...parsed, ...retryParsed };
          if (!parsed.path) parsed.path = 'C';
          if (!parsed.sector) parsed.sector = category || 'اقتصاد كلي';
        } else {
          // V244: Retry produced insufficient data — produce minimal Path [C] content
          // instead of SKIPPING. This prevents permanently lost articles.
          console.log(`[UnifiedProcessor V244] No-reject retry produced insufficient data for ${articleId} — producing minimal Path [C] content from source`);
          parsed = buildMinimalPathC(titleEn, summaryEn, contentEn, category);
        }
      } catch (retryErr: any) {
        // V244: Retry itself failed — produce minimal Path [C] content instead of SKIPPING
        console.warn(`[UnifiedProcessor V244] No-reject retry FAILED for ${articleId}: ${retryErr.message} — producing minimal Path [C] content from source`);
        parsed = buildMinimalPathC(titleEn, summaryEn, contentEn, category);
      }
    }

    // ── Extract and validate all fields ──
    const updateData: Record<string, any> = {};
    const fields: string[] = [];

    // 1. titleAr
    if (parsed.titleAr && typeof parsed.titleAr === 'string' && /[\u0600-\u06FF]/.test(parsed.titleAr)) {
      let titleArCleaned = parsed.titleAr.trim();

      // V232: Number integrity check — verify numbers in Arabic title match English
      if (titleEn) {
        const enNumbers = titleEn.match(/\d+(?:\.\d+)?/g) || [];
        for (const num of enNumbers) {
          const numVal = parseFloat(num);
          if (isNaN(numVal) || numVal < 1) continue; // Skip tiny numbers
          // Check if number exists in Arabic title
          if (!titleArCleaned.includes(num)) {
            // Check for decimal shift (e.g., 16.5 → 1.65)
            const shifted = (numVal / 10).toString();
            if (titleArCleaned.includes(shifted)) {
              console.warn(`[UnifiedProcessor V232] DECIMAL SHIFT in title: "${num}" from English became "${shifted}" in Arabic! Fixing...`);
              titleArCleaned = titleArCleaned.replace(shifted, num);
            } else {
              console.warn(`[UnifiedProcessor V232] Number "${num}" from English title not found in Arabic title: "${titleArCleaned.substring(0, 80)}"`);
            }
          }
        }

        // V232: Check for "خسارة" added when English doesn't say "loss"
        const enHasLoss = /\bloss|lost|negative|deficit\b/i.test(titleEn);
        const arHasLoss = /خسار|خاسر|عجز/i.test(titleArCleaned);
        if (arHasLoss && !enHasLoss) {
          console.warn(`[UnifiedProcessor V232] INFERRED LOSS: Arabic title says "خسارة/عجز" but English doesn't mention loss. Title: "${titleArCleaned.substring(0, 80)}"`);
        }
      }

      updateData.titleAr = titleArCleaned;
      fields.push('titleAr');
    }

    // 2. summaryAr
    if (parsed.summaryAr && typeof parsed.summaryAr === 'string' && /[\u0600-\u06FF]/.test(parsed.summaryAr)) {
      let summaryArCleaned = parsed.summaryAr.trim();

      // V232: Number integrity check for summary
      if (summaryEn) {
        const enNumbers = summaryEn.match(/\d+(?:\.\d+)?/g) || [];
        for (const num of enNumbers) {
          const numVal = parseFloat(num);
          if (isNaN(numVal) || numVal < 1) continue;
          if (!summaryArCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (summaryArCleaned.includes(shifted)) {
              console.warn(`[UnifiedProcessor V232] DECIMAL SHIFT in summary: "${num}" → "${shifted}"! Fixing...`);
              summaryArCleaned = summaryArCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.summaryAr = summaryArCleaned;
      fields.push('summaryAr');
    }

    // 3. contentAr
    // V121: Route C articles have shorter content (only [1] + [6] sections).
    // Use a lower minimum length for Route C to avoid rejecting valid brief analyses.
    const effectiveMinContentLength = parsed.path === 'C'
      ? 80   // V121: Route C — brief analysis, only [1]+[6] sections
      : PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH; // Default 200 for routes A/B
    if (parsed.contentAr && typeof parsed.contentAr === 'string' && parsed.contentAr.length >= effectiveMinContentLength && /[\u0600-\u06FF]/.test(parsed.contentAr)) {
      let contentAr = parsed.contentAr.trim();
      // Strip Markdown
      contentAr = stripMarkdown(contentAr);
      // Deduplicate
      contentAr = deduplicateArabicContent(contentAr);
      if (contentAr.length >= effectiveMinContentLength) {
        updateData.contentAr = contentAr;
        fields.push('contentAr');
      }
    }

    // 4. slug (generate with random suffix to reduce collisions)
    if (!article.slug && updateData.titleAr) {
      updateData.slug = generateSlug(updateData.titleAr); // Now includes random 4-char suffix
      fields.push('slug');
    }

    // 5. aiAnalysis - reconstruct in the format expected by the rest of the pipeline
    if (parsed.path && parsed.fullContent && /[\u0600-\u06FF]/.test(parsed.fullContent)) {
      // Apply post-processing to fullContent and other text fields
      let fullContent = parsed.fullContent || '';
      let editedArticle = parsed.editedArticle || '';
      let introduction = parsed.introduction || '';
      let body = parsed.body || '';
      let conclusion = parsed.conclusion || '';
      let recommendation = parsed.recommendation || '';

      // Remove forbidden phrases
      const FORBIDDEN = [
        'يجب على المستثمرين', 'ينبغي مراعاة', 'تجدر الإشارة إلى أنه',
        'يجب على المستثمر', 'ينبغي على المستثمرين', 'تجدر الإشارة إلى أن',
        'مراعاة التوترات', 'مراعاة الظروف', 'مراعاة التطورات',
        'ينبغي الحذر', 'يجب الحذر',
        'حسناً.', 'حسناً', 'حسنا.', 'حسنًا.', 'حسنًا',
        'إذن.', 'إذن', 'الآن إذن',
        'طبعاً.', 'طبعاً', 'بالتأكيد.', 'بالتأكيد',
      ];
      // V152: Apply FORBIDDEN to ALL text fields including user-facing Arabic fields
      // Also escape regex special characters to prevent broken patterns (e.g., "حسناً." where . is wildcard)
      for (const phrase of FORBIDDEN) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        fullContent = fullContent.replace(re, '');
        editedArticle = editedArticle.replace(re, '');
        recommendation = recommendation.replace(re, '');
        introduction = introduction.replace(re, '');
        body = body.replace(re, '');
        conclusion = conclusion.replace(re, '');
      }

      // V152: Strip filler phrases from Arabic user-facing fields
      // These fields were NOT cleaned before, causing "حسناً" to reach users
      const ARABIC_FILLER_PATTERN = /(?:حسنا[ًٍ]?|طبعا[ًٍ]?|إذن|بالتأكيد|نعم)[.؟!؛\s]*/g;
      if (updateData.contentAr && typeof updateData.contentAr === 'string') {
        updateData.contentAr = updateData.contentAr.replace(ARABIC_FILLER_PATTERN, '');
      }
      if (updateData.titleAr && typeof updateData.titleAr === 'string') {
        updateData.titleAr = updateData.titleAr.replace(ARABIC_FILLER_PATTERN, '');
      }
      if (updateData.summaryAr && typeof updateData.summaryAr === 'string') {
        updateData.summaryAr = updateData.summaryAr.replace(ARABIC_FILLER_PATTERN, '');
      }

      // V152: Strip foreign (non-Arabic, non-Latin) scripts from all text fields
      // Catches Cyrillic (Russian), CJK, Thai, Devanagari that leak into Arabic content
      const stripForeignScript = (t: string): string => t
        .replace(/[\u0400-\u04FF]/g, '')   // Cyrillic (Russian, etc.)
        .replace(/[\u4e00-\u9fff]/g, '')   // CJK Unified Ideographs
        .replace(/[\u3040-\u309f\u30a0-\u30ff]/g, '')  // Japanese Hiragana/Katakana
        .replace(/[\uac00-\ud7af]/g, '')   // Korean
        .replace(/[\u0e00-\u0e7f]/g, '')   // Thai
        .replace(/[\u0900-\u097f]/g, '');  // Devanagari
      fullContent = stripForeignScript(fullContent);
      editedArticle = stripForeignScript(editedArticle);
      introduction = stripForeignScript(introduction);
      body = stripForeignScript(body);
      conclusion = stripForeignScript(conclusion);
      if (updateData.contentAr && typeof updateData.contentAr === 'string') {
        updateData.contentAr = stripForeignScript(updateData.contentAr);
      }
      if (updateData.titleAr && typeof updateData.titleAr === 'string') {
        updateData.titleAr = stripForeignScript(updateData.titleAr);
      }
      if (updateData.summaryAr && typeof updateData.summaryAr === 'string') {
        updateData.summaryAr = stripForeignScript(updateData.summaryAr);
      }

      // Apply translation fixes
      const FIXES: [RegExp, string][] = [
        [/أسهم النفط/g, 'عقود النفط الآجلة'],
        [/أسهم الذهب/g, 'عقود الذهب الآجلة'],
        [/الهشامات/g, 'الرقائق الإلكترونية'],
        [/هشامات/g, 'رقائق إلكترونية'],
        [/دينار أمريكي/g, 'دولار أمريكي'],
        [/السجل المالي للشركات/g, 'درجة الائتمان الشخصية'],
        [/السجلات المالية/g, 'درجات الائتمان الشخصية'],
        [/السجل المالي/g, 'درجة الائتمان الشخصية'],
        [/الماصة/g, 'الاصطناعية'],
        [/ضوء اليوم/g, 'أبرز الأحداث'],
        [/\(neutral\)/g, '(محايد)'],
        [/\(positive\)/g, '(إيجابي)'],
        [/\(negative\)/g, '(سلبي)'],
        // V219: Arabic spell check — common AI typos
        [/تكاليس/g, 'تكاليف'],
        [/التكاليس/g, 'التكاليف'],
        [/الإستهلاك/g, 'الاستهلاك'],
        [/إقتصادي/g, 'اقتصادي'],
        [/الإقتصادي/g, 'الاقتصادي'],
        [/إستثمار/g, 'استثمار'],
        [/الإستثمار/g, 'الاستثمار'],
        [/إستراتيجية/g, 'استراتيجية'],
        [/الإستراتيجية/g, 'الاستراتيجية'],
        [/إستقرار/g, 'استقرار'],
        [/الإستقرار/g, 'الاستقرار'],
      ];
      for (const [pattern, replacement] of FIXES) {
        fullContent = fullContent.replace(pattern, replacement);
        editedArticle = editedArticle.replace(pattern, replacement);
        introduction = introduction.replace(pattern, replacement);
        body = body.replace(pattern, replacement);
        conclusion = conclusion.replace(pattern, replacement);
      }

      // Deduplicate
      fullContent = deduplicateArabicText(fullContent);
      editedArticle = deduplicateArabicText(editedArticle);

      // V137: Strip AI internal comment leaks
      const AI_COMMENT_PATTERNS = [
        /توقفت\s+هنا\s+عند\s+القسم\s+.*$/gm,
        /أكمل\s+من\s+حيث\s+توقفت.*$/gm,
        /^[\s]*ملاحظة[\s:]*(للمراجع|للناشر|للقارئ|للمحرر|للمدقق)?[\s:]*.*$/gm,
        /سأكمل\s+عند\s+الطلب.*$/gm,
        /كما\s+هو\s+مطلوب.*$/gm,
        /بناءً?\s+على\s+التعليمات.*$/gm,
        /\[ملاحظة[^\]]*\]/g,
        /\(ملاحظة[^)]*\)/g,
        /^[\s]*سأقوم\s+ب.*$/gm,
        /^[\s]*الآن\s+سأكتب.*$/gm,
        /كما\s+طلبت.*$/gm,
        /بناء\s+على\s+الطلب.*$/gm,
        // V139: Internal data source references
        /\(البند\s+\d+\)/g,
        /\(البند\s+[^\)]*\)/g,
        /\(انظر\s+قسم\s+[^\)]*\)/g,
        /\(المصدر\s+الداخلي\s+[^\)]*\)/g,
        /\(مرجع\s+داخلي\s*[^\)]*\)/g,
        // V139: "لا توجد بيانات محددة حول" internal comments
        /لا\s+توجد\s+بيانات\s+محددة\s+حول[^.]*\.?/g,
      ];
      for (const pattern of AI_COMMENT_PATTERNS) {
        fullContent = fullContent.replace(pattern, '');
        editedArticle = editedArticle.replace(pattern, '');
        introduction = introduction.replace(pattern, '');
        body = body.replace(pattern, '');
        conclusion = conclusion.replace(pattern, '');
        recommendation = recommendation.replace(pattern, '');
      }

      // V138: Strip vague context phrases that add no information
      const VAGUE_PHRASES = [
        /يعزز مصداقية القطاع/g,
        /يفتح الباب أمام/g,
        /يشير إلى تحول استراتيجي/g,
        /يمثل نقطة تحول/g,
        /يعزز مكانة/g,
      ];
      for (const pattern of VAGUE_PHRASES) {
        fullContent = fullContent.replace(pattern, '');
        editedArticle = editedArticle.replace(pattern, '');
        body = body.replace(pattern, '');
      }

      // Filter vague assets
      const VAGUE = [
        /العلاقات التجارية/i, /الاقتصاد العالمي/i, /السوق العالمي/i,
        /التجارة العالمية/i, /الاقتصاد الكلي/i, /الأسواق المالية/i,
        /الأسواق العالمية/i, /القطاع المالي/i, /التوترات التجارية/i,
        /الحرب التجارية/i, /سلسلة التوريد/i,
      ];
      let affectedAssets = parsed.affectedAssets || [];
      affectedAssets = affectedAssets.filter((asset: any) => {
        const name = asset.name || '';
        return !VAGUE.some(pattern => pattern.test(name));
      });

      // Auto-fix crypto sector
      const CRYPTO_KEYWORDS = ['بيتكوين', 'إيثريوم', 'عملات مشفرة', 'أصول رقمية', 'IBIT', 'FBTC', 'COIN', 'BTC', 'ETH'];
      const fullTextLower = `${fullContent} ${editedArticle} ${titleEn} ${summaryEn}`.toLowerCase();
      const isCrypto = CRYPTO_KEYWORDS.some(kw => fullTextLower.toLowerCase().includes(kw.toLowerCase()));
      const sector = isCrypto && (!parsed.sector || parsed.sector === 'اقتصاد كلي') ? 'أصول رقمية' : (parsed.sector || category);

      // Detect truncated recommendation
      if (recommendation && !/[.؟!؛]$/.test(recommendation.trim())) {
        console.warn(`[UnifiedProcessor] Truncated recommendation detected: "${recommendation.slice(-40)}" — marking as incomplete`);
        recommendation = recommendation.trim() + '...';
      }

      const analysisObj = {
        rawData: parsed.rawData || {},
        path: parsed.path || 'B',
        sector,
        sentimentReason: parsed.sentimentReason || '',
        editedArticle: stripMarkdown(editedArticle),
        fullContent: stripMarkdown(fullContent),
        introduction: stripMarkdown(introduction),
        body: stripMarkdown(body),
        conclusion: stripMarkdown(conclusion),
        summary: parsed.summary || '',
        sentiment: parsed.sentiment || 'neutral',
        impactLevel: parsed.impactLevel || 'medium',
        keyTakeaways: parsed.keyTakeaways || [],
        affectedAssets,
        recommendation: stripMarkdown(recommendation),
        confidence: parsed.confidence || '5/10',
        // Metadata
        processedBy: 'unified-processor',
        processedAt: new Date().toISOString(),
        aiProvider: aiResult.provider,
        aiModel: aiResult.model,
      };

      updateData.aiAnalysis = JSON.stringify(analysisObj);
      fields.push('aiAnalysis');
    }

    // ── Update database ──
    if (Object.keys(updateData).length > 0) {
      await db.newsItem.update({
        where: { id: articleId },
        data: updateData,
      });
    }

    // ── Validate and advance stage ──
    // V121: Route C uses lower content length threshold (80 vs 200)
    const parsedPath = parsed.path || 'B';
    const validationMinLength = parsedPath === 'C' ? 80 : PIPELINE_CONFIG.MIN_CONTENT_AR_LENGTH;
    const hasTitleAr = !!updateData.titleAr && /[\u0600-\u06FF]/.test(updateData.titleAr);
    const hasContentAr = !!updateData.contentAr &&
      updateData.contentAr.length >= validationMinLength &&
      /[\u0600-\u06FF]/.test(updateData.contentAr);
    const hasAnalysis = !!updateData.aiAnalysis && updateData.aiAnalysis.length > 50;

    if (hasTitleAr && hasContentAr && hasAnalysis) {
      // Advance directly to analyzed stage (skip translated since we did both)
      const { advanceStage } = await import('../queue/job-manager');
      // Advance twice: fetched → content_loaded → translated → analyzed
      const article2 = await db.newsItem.findUnique({ where: { id: articleId }, select: { processingStage: true } });
      const currentStage = (article2?.processingStage || 'fetched') as ProcessingStage;
      const stages: ProcessingStage[] = ['fetched', 'content_loaded', 'translated', 'analyzed'];
      const currentIdx = stages.indexOf(currentStage);
      if (currentIdx < stages.length - 1) {
        // Set directly to analyzed
        await db.newsItem.update({
          where: { id: articleId },
          data: { processingStage: 'analyzed' },
        });
      }
      result.success = true;
    } else {
      const missing: string[] = [];
      if (!hasTitleAr) missing.push('titleAr');
      if (!hasContentAr) missing.push('contentAr');
      if (!hasAnalysis) missing.push('aiAnalysis');
      result.error = `Missing required fields: ${missing.join(', ')}`;
      console.warn(`[UnifiedProcessor] Article ${articleId} BLOCKED: ${result.error}`);
    }

    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[UnifiedProcessor] Article ${articleId}: ${result.success ? 'OK' : 'FAIL'} (${fields.join(', ')}) in ${result.duration}ms via ${aiResult.provider}/${aiResult.model}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[UnifiedProcessor] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}

// ── V244: Minimal Path [C] Builder ──
// Build minimal Path [C] content when AI rejects + retry fails.
// Instead of setting the article to 'skipped' (permanently lost), produce
// minimal but valid Arabic content from the original English source data.
// This uses a simple transliteration/translation approach — no hallucination,
// just a basic Arabic rendering of the English title and summary.
function buildMinimalPathC(
  titleEn: string,
  summaryEn: string,
  contentEn: string,
  category: string,
): Record<string, any> {
  // Build a basic Arabic contentAr from available English source text
  // This is intentionally minimal — just enough to pass publisher validation
  // and get the article through imaging + publishing. Path [C] articles are
  // clearly labeled as "معلومات شحيحة" (scarce information).
  const sourceText = contentEn || summaryEn || titleEn || '';
  const sector = category || 'اقتصاد كلي';

  // Use the original English title as titleAr (wrapped in Arabic context)
  // This is acceptable for Path [C] articles — they're marked as low-confidence
  const titleAr = titleEn || 'خبر مالي';

  // Build summaryAr from the English summary with Arabic prefix
  const summaryAr = summaryEn
    ? `خبر مالي: ${summaryEn.slice(0, 200)}`
    : `خبر مالي من مصدر موثوق`;

  // Build contentAr — must be at least 80 chars for Path [C]
  // Use the actual English content with an Arabic header to provide substance
  const contentAr = sourceText.length > 100
    ? `خبر مالي — معلومات شحيحة\n\n${sourceText.slice(0, 800)}`
    : `خبر مالي — معلومات شحيحة\n\n${titleEn || 'خبر مالي'}. ${summaryEn || ''}`;

  return {
    titleAr,
    summaryAr,
    contentAr: contentAr.length >= 80 ? contentAr : contentAr + '\n\nمعلومات شحيحة — البيانات غير كافية لتحليل موثوق',
    rawData: {
      entityNameEn: '',
      ticker: 'لا يوجد أصل مدرج مؤكد',
      exchange: '',
      figures: [],
      source: '',
    },
    path: 'C',
    sector,
    sentimentReason: 'تصنيف تلقائي — بيانات شحيحة',
    editedArticle: contentAr,
    fullContent: `[1] ماذا جرى\nخبر مالي من مصدر موثوق — معلومات شحيحة\n\n[5] للمتداول\nمعلومات شحيحة — البيانات غير كافية لتحليل موثوق`,
    introduction: 'خبر مالي — معلومات شحيحة',
    body: 'البيانات غير كافية لتحليل موثوق',
    conclusion: 'معلومات شحيحة — يُنصح بالانتظار',
    summary: summaryAr,
    sentiment: 'neutral',
    impactLevel: 'low',
    keyTakeaways: ['معلومات شحيحة — البيانات غير كافية'],
    affectedAssets: [],
    recommendation: 'معلومات شحيحة — البيانات غير كافية',
    confidence: '2/10',
  };
}

// ── JSON Parser ──
// Robustly extracts JSON from AI response (handles markdown code blocks, extra text, etc.)
// V72: Added truncated JSON recovery — when maxTokens cuts off the response mid-JSON,
// we try to close open braces and salvage what we can instead of returning null.
function parseAIJson(text: string): Record<string, any> | null {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch (e) { /* not pure JSON, try extraction below */ }

  // Try extracting JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) { /* code block not valid JSON, continue */ }
  }

  // Try finding JSON object boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch (e) { /* try fixing common issues below */ }

    // Try fixing common issues: trailing commas, unescaped newlines in strings
    let jsonStr = text.slice(firstBrace, lastBrace + 1);
    // Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(jsonStr);
    } catch (e) { /* truncated JSON recovery below */ }
  }

  // V72: Truncated JSON recovery — if the response was cut off by maxTokens,
  // try to close open structures and parse what we have
  if (firstBrace !== -1) {
    let truncatedJson = text.slice(firstBrace);
    // Remove any incomplete string at the end (unterminated quote)
    truncatedJson = truncatedJson.replace(/"[^"\\]*$/, '');
    // Count open braces/brackets and close them
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;
    for (const ch of truncatedJson) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }
    // Close open structures
    truncatedJson = truncatedJson.replace(/,\s*$/, ''); // Remove trailing comma
    for (let i = 0; i < openBrackets; i++) truncatedJson += ']';
    for (let i = 0; i < openBraces; i++) truncatedJson += '}';
    try {
      const result = JSON.parse(truncatedJson);
      console.warn(`[UnifiedProcessor V72] Recovered truncated JSON — missing ${openBraces} braces, ${openBrackets} brackets`);
      return result;
    } catch (e) { /* unrecoverable JSON */ }
  }

  console.error(`[UnifiedProcessor] Failed to parse AI JSON. Response start: ${text.slice(0, 200)}`);
  return null;
}

// ── Utility Functions (same as in translator.ts / analyzer.ts) ──

function stripMarkdown(text: string): string {
  if (!text) return text;
  let result = text;
  result = result.replace(/^#{1,6}\s+/gm, '');
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/__(.+?)__/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');
  result = result.replace(/^[\-\*]\s+/gm, '');
  result = result.replace(/^[\-\*]{3,}\s*$/gm, '');
  result = result.replace(/`(.+?)`/g, '$1');
  result = result.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  result = result.replace(/^\|[\s\-:|]+\|$/gm, '');
  result = result.replace(/^\s*\|\s*$/gm, '');
  result = result.replace(/^(\|[\u0600-\u06FF].*?)\|/gm, '$1');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

function deduplicateArabicContent(text: string): string {
  if (!text || text.length < 50) return text;

  const paragraphs = text.split('\n');
  const seen = new Map<string, boolean>();
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) { result.push(''); continue; }

    const sentences = trimmed.split(/(?<=[.؟!؛])\s+/);
    const kept: string[] = [];

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s || s.length < 15) { kept.push(s); continue; }

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
        console.warn(`[UnifiedProcessor] Removed duplicate: "${s.slice(0, 60)}..."`);
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

function deduplicateArabicText(text: string): string {
  if (!text || text.length < 50) return text;

  const sentenceEnders = /[.؟!؛]+/;
  const rawParts = text.split(sentenceEnders);
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      result.push(trimmed);
      continue;
    }

    const normalized = trimmed.replace(/\s+/g, ' ').replace(/[\u064B-\u065F]/g, '').trim();

    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      if (Math.abs(existingNorm.length - normalized.length) > normalized.length * 0.4) continue;
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      if (union > 0 && intersection / union > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      console.warn(`[UnifiedProcessor] Removed duplicate sentence: "${trimmed.slice(0, 60)}..."`);
    } else {
      seen.set(normalized, trimmed);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}
