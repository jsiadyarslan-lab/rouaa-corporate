// ─── Infographic Generation API ─────────────────────────────
// POST /api/infographics/generate
// V6: Revolutionary prompt — 6-slide structure with AI images + ECharts
//
// Body: { sourceType: "news"|"economic_report"|"market_analysis", sourceId: string }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { isAdminAuthenticated } from '@/lib/auth-utils';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── Fetch Source Content ──────────────────────────────────
// V1219k: Filter by locale='ar' to prevent non-Arabic content being used
async function fetchSource(sourceType: string, sourceId: string) {
  if (sourceType === 'news') {
    const news = await db.newsItem.findUnique({
      where: { id: sourceId },
      select: {
        id: true, titleAr: true, title: true, contentAr: true, content: true,
        summaryAr: true, summary: true, category: true, sentiment: true,
        impactScore: true, aiAnalysis: true, slug: true, locale: true,
      },
    });
    if (!news) return null;
    // V1219k: Reject non-Arabic news sources
    if (news.locale && news.locale !== 'ar') {
      console.warn(`[InfographicGen V1219k] Rejected news ${sourceId}: locale=${news.locale} (expected ar)`);
      return null;
    }
    return {
      type: 'news' as const,
      id: news.id,
      title: news.titleAr || news.title,
      content: news.contentAr || news.content || '',
      summary: news.summaryAr || news.summary || '',
      category: news.category,
      sentiment: news.sentiment,
      impactScore: news.impactScore,
      aiAnalysis: news.aiAnalysis,
      slug: news.slug,
    };
  }

  if (sourceType === 'economic_report') {
    const report = await db.economicReport.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, summary: true, content: true,
        reportType: true, scope: true, sectors: true, countries: true,
        keyIndicators: true, marketImpact: true, confidenceScore: true, slug: true,
        locale: true,
      },
    });
    if (!report) return null;
    // V1219k: Reject non-Arabic report sources
    if (report.locale && report.locale !== 'ar') {
      console.warn(`[InfographicGen V1219k] Rejected report ${sourceId}: locale=${report.locale} (expected ar)`);
      return null;
    }
    return {
      type: 'economic_report' as const,
      id: report.id,
      title: report.title,
      content: report.content,
      summary: report.summary,
      category: report.reportType,
      sectors: report.sectors,
      countries: report.countries,
      keyIndicators: report.keyIndicators,
      marketImpact: report.marketImpact,
      confidenceScore: report.confidenceScore,
      slug: report.slug,
    };
  }

  if (sourceType === 'market_analysis') {
    const analysis = await db.marketAnalysis.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, content: true, assetClass: true,
        analysisType: true, timeFrame: true, indicators: true,
        priceTarget: true, riskLevel: true, sentiment: true,
        confidenceScore: true, slug: true, locale: true,
      },
    });
    if (!analysis) return null;
    // V1219k: Reject non-Arabic analysis sources
    if (analysis.locale && analysis.locale !== 'ar') {
      console.warn(`[InfographicGen V1219k] Rejected analysis ${sourceId}: locale=${analysis.locale} (expected ar)`);
      return null;
    }
    return {
      type: 'market_analysis' as const,
      id: analysis.id,
      title: analysis.title,
      content: analysis.content,
      category: analysis.assetClass,
      timeFrame: analysis.timeFrame,
      riskLevel: analysis.riskLevel,
      sentiment: analysis.sentiment,
      confidenceScore: analysis.confidenceScore,
      slug: analysis.slug,
    };
  }

  return null;
}

// ─── V7: Enhanced System Prompt — V13 Design System ─────────────────────
const INFOGRAPHIC_SYSTEM_PROMPT = `أنت مصمم إنفوغرافيك مالي محترف ومحلل بيانات متخصص
في تحويل الأخبار المالية إلى محتوى بصري احترافي.

═══════════════════════════════════
قواعد التصميم الصارمة (V13)
═══════════════════════════════════

١. اللغة:
- عربية فصحى خالصة 100% بلا استثناء
- لا كلمة أجنبية في أي شريحة
- الأرقام بالغربية (0123456789) في كل مكان
- الاتجاه: RTL (من اليمين لليسار) إلزامي في كل النصوص

٢. الأرقام:
- لا تضع رقماً إلا إذا كان موجوداً في الخبر الأصلي
- إذا لم يكن لديك رقم حقيقي → اكتب وصفاً نوعياً
- لا تخترع نسباً أو أسعاراً أبداً
- استخدم font-variant-numeric: tabular-nums للأرقام حتى تصطف عمودياً

٣. التوصيات:
- إيجابي → شراء فقط
- سلبي → بيع فقط
- محايد → مراقبة فقط
- لا تناقض بين التصنيف والتوصية أبداً
- لون الإجراء: شراء=أخضر، بيع=أحمر، مراقبة=برتقالي

٤. منع الهلوسة:
- لا رمز بورصي مخترع
- لا سعر هدف بدون مصدر
- الجملة السحرية: "بيانات غير كافية — تابع المستجدات"

٥. نظام المسافات (8px Grid — إلزامي):
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
- كل المسافات يجب أن تكون مضاعفات 4px
- لا مسافات فردية مثل 3px أو 7px

٦. الحالات الفارغة:
- إذا كانت مصفوفة فارغة (indicators=[], scenarios=[]) → لا تدرج الشريحة
- بدلاً من شريحة فارغة، اكتب "بيانات غير كافية — تابع المستجدات" في حقل subtitle

٧. ألوان شريط الثقة (Confidence):
- أقل من 30% → أحمر #EF4444 (ثقة منخفضة)
- 30% - 70% → برتقالي #F59E0B (ثقة متوسطة)
- أعلى من 70% → أخضر #10B981 (ثقة عالية)

٨. ربط اللون بالاتجاه تلقائياً:
- صعود/إيجابي → أخضر (#10B981)
- هبوط/سلبي → أحمر (#EF4444)
- محايد/ترقب → أزرق (#3B82F6)
- تحذير → برتقالي (#F59E0B)

═══════════════════════════════════
نظام الصور — AI Image Prompts
═══════════════════════════════════

لكل شريحة حدد image_prompt بالإنجليزية — وصف لصورة خلفية
احترافية مولّدة بالذكاء الاصطناعي:

القواعد:
- الوصف يجب أن يكون بالإنجليزية
- وصف خلفية احترافية dark cinematic بدون نصوص
- يبدأ دائماً بـ "Professional financial infographic background"
- ينتهي بـ "no text, ultra detailed, 8k"
- الشريحة 1 (Hero): image_position "background-full" + image_overlay 0.40
- الشرائح 2-5: image_position "right-30"
- الشريحة 6: image_position null — لا صورة

أمثلة:
- نفط: "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k"
- ذهب: "Professional financial infographic background, dark navy blue with gold bars and precious metals glow, gold accent, no text, ultra detailed, 8k"
- أسهم: "Professional financial infographic background, dark navy blue with stock chart lines and trading signals, gold and green accent, no text, ultra detailed, 8k"

═══════════════════════════════════
نظام الرسوم البيانية — chart_config
═══════════════════════════════════

كل شريحة تحتوي حقل chart_config يحدد نوع الرسم البياني:

- الشريحة 1 (Hero): gauge (مؤشر دائري)
  chart_config: { type: "gauge", value: الرقم, max: أقصى_قيمة, unit: "الوحدة" }

- الشريحة 3 (Data): bar (أعمدة أفقية)
  chart_config: { type: "bar", orientation: "horizontal", categories: [أسماء], values: [أرقام], colors: [ألوان] }
  ألوان: up="#10B981" down="#EF4444" neutral="#3B82F6"

- الشريحة 4 (Scenarios): slope (خطوط مائلة)
  chart_config: { type: "slope", leftLabel: "الحالي", rightLabel: "المتوقع", items: [{name, leftValue, rightValue, color}] }
  ألوان: optimistic="#10B981" neutral="#F59E0B" pessimistic="#EF4444"

- الشريحة 5 (Assets): treemap
  chart_config: { type: "treemap", data: [{name, value, color}] }
  ألوان: benefiting="#10B981" harmed="#EF4444"

- الشريحة 6 (Recommendations): funnel
  chart_config: { type: "funnel", data: [{name, value, color}] }
  ألوان: daily="#D4AF37" medium="#3B82F6" long="#10B981"

═══════════════════════════════════
هيكل الشرائح الكامل (6 شرائح)
═══════════════════════════════════

── الشريحة 1: Hero (الصدمة البصرية) ──

image_prompt: وصف خلفية احترافية بالإنجليزية تعبر عن القطاع
image_position: "background-full"
image_overlay: 0.65

المكونات الإلزامية:
- heroNumber: الرقم الصادم من الخبر (سعر، نسبة، مبلغ)
- heroUnit: وحدة القياس (3-4 كلمات فقط)
- title: العنوان الرئيسي (أقصى 8 كلمات)
- subtitle: النص التوضيحي (أقصى 12 كلمة)
- tag: تاج القطاع (كلمة واحدة)
- status: عاجل | مهم | فرصة | تحذير
- color: red | green | orange | blue
- confidence: رقم من 0-100 (مستوى الثقة في التحليل)

قاعدة اختيار اللون:
red    = سلبي / خطر / هبوط
green  = إيجابي / فرصة / صعود
orange = تحذير / محايد / ترقب
blue   = معلومة / سياق / محايد

قاعدة شريط الثقة:
confidence < 30 → اللون أحمر (ثقة منخفضة — تحذير)
confidence 30-70 → اللون برتقالي (ثقة متوسطة)
confidence > 70 → اللون أخضر (ثقة عالية)

── الشريحة 2: القصة البصرية ──

image_prompt: وصف خلفية احترافية بالإنجليزية تعبر عن العلاقة
image_position: "right-30"

اختر نمطاً واحداً فقط:

نمط A — تدفق: عندما يكون الخبر عن علاقة بين طرفين
  elements: { from, event, to, impact }

نمط B — مقارنة: عندما يكون الخبر عن تغيير قبل/بعد
  elements: { before: {label, value}, after: {label, value}, change: {amount, direction} }

نمط C — خريطة: عندما يكون الخبر جغرافياً
  elements: { regions: [{name, impact}] }

نمط D — تسلسل سبب-نتيجة: عندما يكون الخبر عن أحداث متتالية
  elements: { event1, event2, event3, consequence1, consequence2, consequence3 }
  (3 أحداث + 3 نتائج بالترتيب)

── الشريحة 3: الأرقام والبيانات ──

image_prompt: وصف خلفية احترافية بالإنجليزية تعبر عن البيانات
image_position: "right-30"

indicators: (4-6 مؤشرات فقط من الخبر الأصلي)
كل مؤشر: name, symbol, value, direction (up|down|neutral), change, reason

قاعدة اللون: up=أخضر (#10B981), down=أحمر (#EF4444), neutral=أزرق (#3B82F6)

── الشريحة 4: السيناريوهات ──

image_prompt: وصف خلفية احترافية بالإنجليزية تعبر عن المستقبل
image_position: "right-30"

3 سيناريوهات: optimistic, neutral, pessimistic
كل سيناريو: type, emoji, name, condition, result, price, probability

── الشريحة 5: الأصول المتأثرة ──

image_prompt: وصف خلفية احترافية بالإنجليزية تعبر عن الصعود والهبوط
image_position: "right-30"

benefiting: (أقصى 4) — كل منها: name, symbol, reason, expected_move
harmed: (أقصى 4) — كل منها: name, symbol, reason, expected_move

قاعدة صارمة:
- لا تذكر أصلاً بدون رمز بورصي حقيقي
- لا تذكر أصلاً بدون سبب محدد من الخبر

── الشريحة 6: التوصيات والخلاصة ──

image_position: null (لا صورة)

recommendations:
daily: asset, symbol, action, entry, target, stop, timeframe
medium: asset, action, allocation, horizon, reason
long: asset, action, allocation, horizon, reason

بطاقات التوصيات:
- حدود جانبية (borderInlineStart): 3px بلون الإجراء (شراء=أخضر، بيع=أحمر، مراقبة=برتقالي)
- لا حواف مستديرة على البطاقات ذات الحد الجانبي (borderRadius: 0)
- padding: 16px 20px
- الوصف بلون أفتح (#9CA3AF)

summary: 3 نقاط فقط — مختلفة عن بعضها ولا تكرار
cta: "رؤى — تحليلات بخبرة اقتصادية"

═══════════════════════════════════
المخرجات المطلوبة (JSON صارم)
═══════════════════════════════════

أجب فقط بـ JSON بدون أي نص خارجه.
لا مقدمة، لا شرح، لا backticks.
فقط JSON نظيف يبدأ بـ { وينتهي بـ }

{
  "slides": [
    {
      "number": 1,
      "type": "hero",
      "image_prompt": "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k",
      "image_position": "background-full",
      "image_overlay": 0.40,
      "heroNumber": "150",
      "heroUnit": "دولار للبرميل",
      "title": "العنوان الرئيسي",
      "subtitle": "النص التوضيحي",
      "tag": "طاقة",
      "status": "عاجل",
      "color": "red",
      "confidence": 75,
      "chart_config": { "type": "gauge", "value": 150, "max": 200, "unit": "دولار للبرميل" }
    },
    {
      "number": 2,
      "type": "story",
      "image_prompt": "Professional financial infographic background, dark navy blue with geopolitical connection lines, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "pattern": "D",
      "title": "عنوان الشريحة",
      "elements": {
        "event1": "الحدث الأول",
        "event2": "الحدث الثاني",
        "event3": "الحدث الثالث",
        "consequence1": "النتيجة الأولى",
        "consequence2": "النتيجة الثانية",
        "consequence3": "النتيجة الثالثة"
      }
    },
    {
      "number": 3,
      "type": "data",
      "image_prompt": "Professional financial infographic background, dark navy blue with stock chart lines, gold and green accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "عنوان الشريحة",
      "indicators": [
        { "name": "الاسم", "symbol": "SYMBOL", "value": "القيمة", "direction": "up", "change": "+5%", "reason": "السبب" }
      ],
      "chart_config": { "type": "bar", "orientation": "horizontal", "categories": ["SYMBOL"], "values": [5], "colors": ["#10B981"] }
    },
    {
      "number": 4,
      "type": "scenarios",
      "image_prompt": "Professional financial infographic background, dark navy blue with crossroads and decision paths, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "عنوان الشريحة",
      "scenarios": [
        { "type": "optimistic", "emoji": "🟢", "name": "الاسم", "condition": "الشرط", "result": "النتيجة", "price": null, "probability": "متوسطة" },
        { "type": "neutral", "emoji": "🟡", "name": "الاسم", "condition": "الشرط", "result": "النتيجة", "price": null, "probability": "عالية" },
        { "type": "pessimistic", "emoji": "🔴", "name": "الاسم", "condition": "الشرط", "result": "النتيجة", "price": null, "probability": "منخفضة" }
      ],
      "chart_config": { "type": "slope", "leftLabel": "الحالي", "rightLabel": "المتوقع", "items": [{"name": "متفائل", "leftValue": 100, "rightValue": 120, "color": "#10B981"}, {"name": "محايد", "leftValue": 100, "rightValue": 100, "color": "#F59E0B"}, {"name": "متشائم", "leftValue": 100, "rightValue": 80, "color": "#EF4444"}] }
    },
    {
      "number": 5,
      "type": "assets",
      "image_prompt": "Professional financial infographic background, dark navy blue with bull and bear market abstract shapes, gold and red accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "عنوان الشريحة",
      "benefiting": [
        { "name": "الاسم", "symbol": "SYMBOL", "reason": "السبب", "expected_move": null }
      ],
      "harmed": [
        { "name": "الاسم", "symbol": "SYMBOL", "reason": "السبب", "expected_move": null }
      ],
      "chart_config": { "type": "treemap", "data": [{"name": "SYMBOL (تستفيد)", "value": 100, "color": "#10B981"}, {"name": "SYMBOL (تتضرر)", "value": 80, "color": "#EF4444"}] }
    },
    {
      "number": 6,
      "type": "recommendations",
      "image_position": null,
      "title": "عنوان الشريحة",
      "recommendations": {
        "daily": { "asset": "الأصل", "symbol": "SYM", "action": "شراء", "entry": null, "target": null, "stop": null, "timeframe": "يومي" },
        "medium": { "asset": "الأصل", "action": "الإجراء", "allocation": null, "horizon": "المدة", "reason": "السبب" },
        "long": { "asset": "الأصل", "action": "الإجراء", "allocation": null, "horizon": "المدة", "reason": "السبب" }
      },
      "summary": ["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة"],
      "cta": "رؤى — تحليلات بخبرة اقتصادية",
      "chart_config": { "type": "funnel", "data": [{"name": "الأصل", "value": 100, "color": "#D4AF37"}, {"name": "الأصل", "value": 70, "color": "#3B82F6"}, {"name": "الأصل", "value": 40, "color": "#10B981"}] }
    }
  ],
  "metadata": {
    "topic": "موضوع الإنفوغرافيك",
    "sector": "القطاع",
    "sentiment": "إيجابي|سلبي|محايد",
    "confidence": 75,
    "primary_color": "red|green|orange|blue"
  }
}

⛔⛔⛔ قواعد نهائية:
- لا تخترع أرقاماً غير موجودة في الخبر الأصلي
- كل شريحة يجب أن تحتوي محتوى حقيقياً وغنياً — لا فراغ
- لا تخلط وحدات مختلفة في بيانات واحدة
- لا تناقض بين التصنيف والتوصية
- لا تكرر التوصيات — كل توصية فريدة
- أعد JSON فقط بدون أي نص إضافي أو markdown`;

// ─── POST: Generate Infographic ────────────────────────────
export async function POST(request: NextRequest) {
  // Step 1: Auth
  try {
    const isAuth = await isAdminAuthenticated(request);
    if (!isAuth) {
      console.warn('[Infographic] Auth failed');
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  } catch (authErr: any) {
    console.error('[Infographic] Auth check error:', authErr.message);
    return NextResponse.json({ error: 'خطأ في التحقق من الهوية' }, { status: 401 });
  }

  // Step 2: Parse body
  let body: { sourceType?: string; sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'الجسم مطلوب بتنسيق JSON' }, { status: 400 });
  }

  const { sourceType, sourceId } = body;

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { error: 'sourceType و sourceId مطلوبان' },
      { status: 400 }
    );
  }

  const validTypes = ['news', 'economic_report', 'market_analysis'];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType يجب أن يكون: ${validTypes.join(' | ')}` },
      { status: 400 }
    );
  }

  // Step 3: Fetch source content
  let source: Awaited<ReturnType<typeof fetchSource>>;
  try {
    source = await fetchSource(sourceType, sourceId);
  } catch (dbErr: any) {
    console.error('[Infographic] DB fetch error:', dbErr.message);
    return NextResponse.json(
      { error: 'فشل تحميل المصدر من قاعدة البيانات', details: dbErr.message },
      { status: 500 }
    );
  }

  if (!source) {
    return NextResponse.json({ error: 'المصدر غير موجود' }, { status: 404 });
  }

  // Step 4: Check if infographic already exists
  let existing: any;
  try {
    existing = await db.infographic.findFirst({
      where: { sourceType, sourceId },
    });
  } catch (dbErr: any) {
    console.error('[Infographic] DB check error:', dbErr.message);
  }
  if (existing) {
    return NextResponse.json(
      { error: 'يوجد إنفوغرافيك لهذا المصدر بالفعل', infographicId: existing.id },
      { status: 409 }
    );
  }

  // Step 5: Build prompt with source data
  const contentForAI = source.content?.slice(0, 6000) || source.summary?.slice(0, 3000) || source.title;
  const aiAnalysisSection = source.aiAnalysis ? `\n\nالتحليل الذكي:\n${source.aiAnalysis.slice(0, 1500)}` : '';
  
  // Determine sentiment and sector from source
  const sentiment = source.sentiment || 'محايد';
  const sector = source.category || 'عام';
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `التاريخ الحالي: ${currentDate}
الخبر: ${source.title}
${source.summary ? `الملخص: ${source.summary.slice(0, 800)}` : ''}

المحتوى الكامل:
${contentForAI}${aiAnalysisSection}

القطاع: ${sector}
التصنيف: ${sentiment}

⛔⛔⛔ تذكر:
1. استخرج كل الأرقام من المحتوى فقط — لا تخترع بيانات
2. كل شريحة = محتوى حقيقي وغني — لا فراغ
3. لا تناقض بين التصنيف والتوصية
4. حدد image_prompt لكل شريحة (ما عدا 6) — وصف خلفية احترافية بالإنجليزية
5. حدد chart_config لكل شريحة (ما عدا story) — نوع الرسم البياني وبياناته
6. حدد image_position و image_overlay بشكل صحيح
7. أعد JSON فقط بدون أي نص إضافي`;

  console.log(`[Infographic] Generating from ${sourceType}:${sourceId} — title: "${source.title?.slice(0, 60)}"`);

  // Step 6: Call AI
  let result: any;
  let usedPriority = 'none';

  try {
    try {
      usedPriority = 'generation';
      result = await chatCompletion([
        { role: 'system', content: INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 8000,
        priority: 'generation',
      });
    } catch (genErr: any) {
      console.warn(`[Infographic] Generation priority failed (${genErr.message?.slice(0, 100)}). Retrying...`);
      usedPriority = 'translation';
      result = await chatCompletion([
        { role: 'system', content: INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 8000,
        priority: 'translation',
      });
    }
  } catch (aiErr: any) {
    console.error('[Infographic] All AI providers failed:', aiErr.message);
    return NextResponse.json(
      { error: 'فشل الاتصال بجميع مزودي الذكاء الاصطناعي', details: aiErr.message?.slice(0, 200) },
      { status: 502 }
    );
  }

  console.log(`[Infographic] AI response from ${result.provider}/${result.model} via ${usedPriority} in ${result.duration}ms`);

  // Step 7: Parse AI response
  let responseText = result.content?.trim() || '';
  responseText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  responseText = responseText.replace(/^```/i, '').replace(/```$/i, '');

  let infographicData: any;
  try {
    infographicData = JSON.parse(responseText);
  } catch (parseErr: any) {
    console.error('[Infographic] JSON parse error:', parseErr.message);
    console.error('[Infographic] Raw response (first 500):', responseText.slice(0, 500));
    return NextResponse.json(
      { error: 'فشل تحليل استجابة الذكاء الاصطناعي', raw: responseText.slice(0, 300) },
      { status: 500 }
    );
  }

  // Step 8: Validate structure
  if (!infographicData.slides || !Array.isArray(infographicData.slides) || infographicData.slides.length === 0) {
    console.error('[Infographic] Invalid structure — no slides array');
    return NextResponse.json(
      { error: 'الاستجابة لا تحتوي على شرائح صالحة' },
      { status: 500 }
    );
  }

  // Ensure first slide is hero
  if (infographicData.slides[0].type !== 'hero') {
    infographicData.slides[0].type = 'hero';
  }

  // Normalize: ensure each slide has an id
  infographicData.slides.forEach((s: any, i: number) => {
    if (!s.id) s.id = `slide-${i + 1}`;
    s.number = s.number || i + 1;
    // Move top-level V5 fields into content for consistent access
    if (!s.content) s.content = {};
    // Copy hero fields
    if (s.heroNumber && !s.content.heroNumber) s.content.heroNumber = s.heroNumber;
    if (s.heroUnit && !s.content.heroUnit) s.content.heroUnit = s.heroUnit;
    if (s.tag && !s.content.tag) s.content.tag = s.tag;
    if (s.status && !s.content.status) s.content.status = s.status;
    // Copy story fields
    if (s.pattern && !s.content.pattern) s.content.pattern = s.pattern;
    if (s.elements && !s.content.elements) s.content.elements = s.elements;
    // Copy data fields
    if (s.indicators && !s.content.indicators) s.content.indicators = s.indicators;
    // Copy scenario fields
    if (s.scenarios && !s.content.scenarios) s.content.scenarios = s.scenarios;
    // Copy asset fields
    if (s.benefiting && !s.content.benefiting) s.content.benefiting = s.benefiting;
    if (s.harmed && !s.content.harmed) s.content.harmed = s.harmed;
    // Copy recommendations
    if (s.recommendations && !s.content.recommendations) s.content.recommendations = s.recommendations;
    // Copy summary (top-level in AI output → content)
    if (Array.isArray(s.summary) && !s.content.summary) s.content.summary = s.summary;
    // Copy CTA
    if (s.cta && !s.content.cta) s.content.cta = s.cta;
    // Copy color to top level for viewer
    if (s.color && !s.content.color) s.content.color = s.color;
    // Copy image fields to content for consistent access
    if (s.unsplash_query && !s.content.unsplash_query) s.content.unsplash_query = s.unsplash_query;
    if (s.image_position && !s.content.image_position) s.content.image_position = s.image_position;
    if (s.image_overlay !== undefined && s.content.image_overlay === undefined) s.content.image_overlay = s.image_overlay;
    if (s.image_url && !s.content.image_url) s.content.image_url = s.image_url;
    // Copy subtitle
    if (s.subtitle && !s.content.subtitle) s.content.subtitle = s.subtitle;
  });

  // V5: Validate and filter broken slides
  const validSlides = infographicData.slides.filter((s: any) => {
    if (!s.type || !s.title || !s.title.trim()) return false;
    const c = s.content || {};
    switch (s.type) {
      case 'hero': return true;
      case 'story': return c.elements && (Array.isArray(c.elements) ? c.elements.length > 0 : Object.keys(c.elements).length > 0);
      case 'data': return Array.isArray(c.indicators) && c.indicators.length > 0 && c.indicators.some((i: any) => i.name?.trim());
      case 'scenarios': return Array.isArray(c.scenarios) && c.scenarios.length > 0 && c.scenarios.some((s: any) => s.name?.trim());
      case 'assets': return (Array.isArray(c.benefiting) && c.benefiting.length > 0) || (Array.isArray(c.harmed) && c.harmed.length > 0);
      case 'recommendations': {
        const hasRecs = c.recommendations?.daily || c.recommendations?.medium || c.recommendations?.long;
        const hasSummary = Array.isArray(c.summary) && c.summary.some((s: string) => s?.trim().length > 0);
        return hasRecs || hasSummary;
      }
      // Legacy types
      case 'stat': return Array.isArray(c.stats) && c.stats.length > 0 && c.stats.some((s: any) => s.value?.trim());
      case 'comparison': return c.comparison?.left?.items?.length > 0 && c.comparison?.right?.items?.length > 0;
      case 'timeline': return Array.isArray(c.steps) && c.steps.length > 0 && c.steps.some((s: any) => s.label?.trim());
      case 'list': return Array.isArray(c.items) && c.items.length > 0 && c.items.some((i: any) => i.title?.trim());
      case 'chart': {
        if (!c.chartData?.values?.length || !c.chartData?.labels?.length) return false;
        c.chartData.values = c.chartData.values.map((v: any) => Number(v)).filter((v: number) => !isNaN(v));
        return c.chartData.values.length >= 2;
      }
      case 'quote': {
        const text = (c.quote?.text || '').replace(/[«»\u00AB\u00BB"]/g, '').trim();
        return text.length >= 5 && !!c.quote?.author?.trim();
      }
      case 'summary': return Array.isArray(c.summary) && c.summary.some((s: string) => s?.trim().length > 0);
      default: return true;
    }
  });

  infographicData.slides = validSlides;
  console.log(`[Infographic] Valid slides: ${validSlides.length}`);

  // Step 9: Generate AI images for slides — GOLDEN RULE: No publish without images
  const infographicCategory = infographicData.metadata?.sector || source.category || null;
  let imageGenerationSuccess = false;
  let slidesWithImages = 0;
  let slidesNeedingImages = 0;

  try {
    // Count how many slides need images
    for (const slide of infographicData.slides) {
      const position = slide.image_position ?? slide.content?.image_position;
      if (position !== null && slide.type !== 'recommendations' && slide.type !== 'summary') {
        slidesNeedingImages++;
      }
    }

    console.log(`[Infographic] Generating ${slidesNeedingImages} AI images (GOLDEN RULE: no publish without images)...`);
    await generateSlideImages(infographicData.slides, infographicCategory);

    // Count how many actually got images (V5: Pollinations URLs ARE valid)
    for (const slide of infographicData.slides) {
      const imageUrl = slide.image_url || slide.content?.image_url;
      if (isValidImageUrl(imageUrl)) {
        slidesWithImages++;
      }
    }

    imageGenerationSuccess = slidesWithImages >= slidesNeedingImages;
    console.log(`[Infographic] Image generation: ${slidesWithImages}/${slidesNeedingImages} slides have images (success=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[Infographic] AI image generation FAILED: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 10: Generate slug
  const baseSlug = generateSlug(infographicData.title || source.title);
  const slug = baseSlug + '-' + Date.now().toString(36).slice(-4);

  // Step 11: Save to database
  try {
    const infographic = await db.infographic.create({
      data: {
        slug,
        title: infographicData.title || source.title,
        subtitle: infographicData.subtitle || null,
        sourceType,
        sourceId,
        sourceTitle: source.title,
        category: infographicData.metadata?.sector || infographicData.category || source.category || null,
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        // GOLDEN RULE: Only publish if ALL images are generated
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
        locale: 'ar',  // V-LOCALE: Arabic infographic generation sets locale
      },
    });

    console.log(`[Infographic] Created: ${infographic.id} — ${infographicData.slides.length} slides — published=${imageGenerationSuccess} — images=${slidesWithImages}/${slidesNeedingImages} — slug: ${slug}`);

    if (!imageGenerationSuccess) {
      console.warn(`[Infographic] ⚠ Infographic saved as DRAFT — ${slidesNeedingImages - slidesWithImages} images failed. Run /api/infographics/refetch-images to retry.`);
    }

    try {
      revalidatePath('/infographics');
      revalidatePath(`/infographics/${slug}`);
    } catch (revalErr: any) {
      console.warn(`[Infographic] Cache revalidation warning: ${revalErr.message}`);
    }

    return NextResponse.json({
      success: true,
      infographic: {
        id: infographic.id,
        slug: infographic.slug,
        title: infographic.title,
        subtitle: infographic.subtitle,
        slides: infographicData.slides,
        category: infographic.category,
        isPublished: imageGenerationSuccess,
        imagesGenerated: slidesWithImages,
        imagesNeeded: slidesNeedingImages,
      },
    });
  } catch (dbErr: any) {
    console.error('[Infographic] DB create error:', dbErr.message);
    return NextResponse.json(
      { error: 'فشل حفظ الإنفوغرافيك في قاعدة البيانات', details: dbErr.message },
      { status: 500 }
    );
  }
}
