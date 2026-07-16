// @ts-nocheck
// ─── Strategic Report Generation API V180 ─────────────────────
// POST /api/reports/strategic
// Generates deep strategic analysis reports using specialized Arabic prompt.
// Different from automated reports: user-defined topic + deep analysis + Sonnet model.
//
// V180 changes:
// - CRITICAL FIX: Removed broken web_search_20250305 tool — Bedrock Converse API
//   returns toolUse blocks which were silently ignored, producing empty content.
//   This was the ROOT CAUSE of strategic report generation failures.
// - Replaced with z-ai-web-dev-sdk web search BEFORE AI generation.
//   The search results are passed as context in the user message.
// - Fixed bedrockModelOverride lost on retry paths (Bug #2).
// - Fixed Part 3 (توصيات رؤى) missing Sonnet model override (Bug #4).
// - Fixed continuation calls missing tools/override config (Bug #6).
//
// V150 changes (superseded by V180):
// - Originally added web_search via Bedrock tool — DID NOT WORK.
//   The model itself cannot search the web via Bedrock Converse API.
//   Instead, we now search first using z-ai-web-dev-sdk, then pass
//   results as context in the user message.
//
// V145 changes:
// - CRITICAL FIX: Internal duplication in "توصيات رؤى" section — the three
//   investor categories (day trader, medium-term, long-term) appeared twice
//   verbatim within the same section.
//   Root cause 1: The regex for stripping section 8 from Part 2 used 'm' flag,
//   causing $ to match end-of-line instead of end-of-string, so the lazy [\s\S]*?
//   stopped at the first line break — only stripping the heading, not the content.
//   Root cause 2: The LLM in Part 3 sometimes generates duplicated sub-sections.
//   Fix: Remove 'm' flag from section 8 stripping regex + add internal
//   deduplication for rouaRecommendations + add prompt instruction.
//
// V142 changes:
// - CRITICAL FIX: Summary/description field is now built from the CONTEXT section
//   (section 2) instead of the executive summary. This prevents the subtitle under
//   the report title from being a duplicate/truncation of the executive summary.
// - Frontend V142: Enhanced duplicate detection for subtitle — checks against ALL
//   major sections (executive summary, context, introduction) with prefix matching.
//   This handles both new V142+ reports AND old reports where summary was a truncation.
//
// V133 changes:
// - THREE-call generation: Part 1 (§§1-4) + Part 2 (§§5-7,9) + Part 3 (§8 توصيات رؤى)
// - توصيات رؤى generated in SEPARATE API call with report summary only
//   (NOT strategic recommendations text) — prevents copy-paste between sections
// - Removed contradictory "7-أ/7-ب" sub-section rules (sections are 7 and 8 separately)
// - Fixed duplicate section content by removing section from Part 2 context
//
// V105 changes:
// - Split generation into TWO calls (sections 1-4 + sections 5-8) with maxTokens=8000 each
// - Convert Markdown output to structured JSON before saving
// - Detect truncation and auto-continue generation
// - Remove "التحليل المفصل" section from output
//
// Body: { topic, region?, sectors?, scenarios?, publish? }
// Uses the EconomicReport model with reportType='strategic'

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { verifyAdminToken, verifyInternalOrCronAuth } from '@/lib/auth-utils';

// V180: z-ai-web-dev-sdk for real web search before AI generation
let ZAI: any = null;
async function getZAI() {
  if (!ZAI) {
    const { default: ZAISdk } = await import('z-ai-web-dev-sdk');
    ZAI = await ZAISdk.create();
  }
  return ZAI;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for deep analysis



async function verifyDashboardAuth(request: Request): Promise<boolean> {
  try {
    const token = (request as NextRequest).cookies?.get?.('admin_token')?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

// ─── Strategic Report Prompt Builder — Part 1 (Sections 1-4) ──
function buildStrategicPromptPart1(params: {
  topic: string;
  region: string;
  sectors: string[];
  scenarios: string[];
  currentDate: string;
}): string {
  const { topic, region, sectors, scenarios, currentDate } = params;

  return `أنت محلل اقتصادي واستراتيجي متخصص في الأسواق المالية العربية والعالمية.

اكتب الجزء الأول من تقرير استراتيجي معمقاً باللغة العربية الفصحى فقط.
لا تستخدم أي كلمة أجنبية في النص.
لا تملأ أي قسم إذا لم تملك بيانات حقيقية عنه — اكتب "بيانات غير كافية".

التاريخ الحالي هو: ${currentDate}
جميع الإشارات الزمنية يجب أن تكون بالنسبة لهذا التاريخ.
لا تستخدم تواريخ المصادر كمرجع زمني.

⚠️ قبل كتابة أي أسعار أو أرقام — ابحث عنها على الإنترنت أولاً ولا تعتمد على ذاكرتك.

⚠️ قاعدة V137 الحرجة — ممنوع تسريب تعليقات AI الداخلية:
- ممنوع كتابة "توقفت هنا عند القسم الرابع كما هو مطلوب" أو أي تعليق مشابه
- ممنوع كتابة "ملاحظة:" أو "ملاحظة للمراجع" أو "سأكمل عند الطلب"
- النص النهائي يُقرأه المستثمر — لا يرى أي أثر لعملية التوليد
- توقف بعد القسم الرابع مباشرة دون أي تعليق

⚠️ تحذير صارم — الأقسام المحظورة:
- ممنوع كتابة قسم "التحليل المفصل" — هذا القسم من قالب قديم ولا ينتمي للتقرير الاستراتيجي
- ممنوع كتابة أي قسم غير مذكور في الهيكل أدناه
- ممنوع إضافة أقسام مثل: البنوك المركزية، بيانات التضخم، التجارة الدولية كأقسام مستقلة
- التزم بالأقسام المحددة أدناه فقط — لا تبتدع أقساماً إضافية

الموضوع: ${topic}
النطاق الجغرافي: ${region}
القطاعات: ${sectors.join('، ')}
السيناريوهات الزمنية: ${scenarios.join('، ')}

⚠️ مهم: اتبع تنسيق العناوين بدقة. كل قسم يبدأ بـ "## رقم. اسم القسم" بالضبط كما هو مكتوب أدناه.

اكتب الأقسام الخمسة الأولى فقط بهذا الهيكل الصارم:

## 1. الملخص التنفيذي
5 نقاط مرقمة — أبرز النتائج التحليلية الكمية: نسب، أرقام، مقارنات.
⚠️ ليس إعادة صياغة للمقدمة — نقاط كمية محددة فقط.

## 2. مقدمة التقرير
فقرة سردية مختصرة (2-3 جمل فقط، 60 كلمة كحد أقصى): من؟ ماذا؟ لماذا يهم الآن؟
⚠️ ممنوع النقاط المرقمة — سرد قصصي فقط

قواعد صارمة للمقدمة:
- الحد الأقصى 60 كلمة — لا تزد أبداً
- ممنوع الجمل الناقصة — كل جملة تكتمل قبل الانتقال
- ابدأ مباشرة بالمعلومة — ممنوع الحشو
- لا تبدأ بـ "في ظل" أو "وسط" — ابدأ بالفاعل مباشرة

## 3. السياق والخلفية
- الأهمية الاستراتيجية بالأرقام
- السوابق التاريخية إن وُجدت
- الأطراف المتأثرة الرئيسية

## 4. التداعيات الاقتصادية المباشرة
قسّم حسب القطاعات المطلوبة فقط.
لكل قطاع: التأثير + حجمه + مدته المتوقعة.

## 5. تأثير على أسواق المال
اذكر المؤشرات والأصول بأسمائها الحقيقية ورموزها.
لا تذكر أرقاماً إلا إذا كانت موثوقة.

توقف بعد القسم الخامس مباشرة — لا تكتب أي تعليق أو ملاحظة عن التوقف.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قواعد المقدمة — تُطبَّق على القسم 2 (مقدمة التقرير):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
المقدمة = فقرة سردية مختصرة (2-3 جمل، 60 كلمة كحد أقصى)
• ممنوع النقاط المرقمة — سرد قصصي فقط
• ممنوع الحشو — ابدأ مباشرة بالمعلومة
• لا تبدأ بـ "في ظل" أو "وسط" — ابدأ بالفاعل مباشرة`;
}

// ─── Strategic Report Prompt Builder — Part 2 (Sections 5-7, 9) ──
// V133: Section 8 (توصيات رؤى) removed from Part 2 — generated separately in Part 3
function buildStrategicPromptPart2(params: {
  topic: string;
  region: string;
  sectors: string[];
  scenarios: string[];
  part1Content: string;
  currentDate: string;
}): string {
  const { topic, region, sectors, scenarios, part1Content, currentDate } = params;

  return `أنت محلل اقتصادي واستراتيجي متخصص في الأسواق المالية العربية والعالمية.

التاريخ الحالي هو: ${currentDate}
جميع الإشارات الزمنية يجب أن تكون بالنسبة لهذا التاريخ.
لا تستخدم تواريخ المصادر كمرجع زمني.

⚠️ قبل كتابة أي أسعار أو أرقام — ابحث عنها على الإنترنت أولاً ولا تعتمد على ذاكرتك.

أنت تكمل تقريراً استراتيجياً بدأته سابقاً. إليك الأقسام الخمسة الأولى التي كتبتها:

--- بداية الأقسام 1-5 ---
${part1Content}
--- نهاية الأقسام 1-5 ---

الآن أكمل التقرير بكتابة الأقسام المتبقية.

الموضوع: ${topic}
النطاق الجغرافي: ${region}
القطاعات: ${sectors.join('، ')}
السيناريوهات الزمنية: ${scenarios.join('، ')}

⚠️ مهم: اتبع تنسيق العناوين بدقة. كل قسم يبدأ بـ "## رقم. اسم القسم" بالضبط كما هو مكتوب أدناه.

⚠️ مهم جداً (V133): لا تكتب قسم "توصيات رؤى" — سيُكتب في طلب منفصل لاحقاً.
اكتب الأقسام التالية فقط:

## 6. السيناريوهات
لكل سيناريو زمني مطلوب:
- الافتراضات
- التأثير المتوقع بنسب تقريرية
- ما الذي يمكن أن يغير هذا السيناريو

## 7. أصول تستفيد وأصول تتضرر
- أصول تستفيد: [الاسم] [الرمز] [السبب]
- أصول تتضرر: [الاسم] [الرمز] [السبب]
- مستويات مراقبة إن توفرت بيانات

## 8. التوصيات الاستراتيجية
تحليل أكاديمي موضوعي — ماذا تقول البيانات؟ مع مستويات سعرية مرجعية.
• مكتوب بصيغة المحلل المحايد مع أرقام تنفيذية
• يشرح المنطق والأسباب بالتفصيل
• لا يخاطب القارئ مباشرة
• مقسم حسب: أفراد / مؤسسات / متداولون
• كل فئة يجب أن تتضمن: التوجه + الأصول المرجعية + مستوى الدخول التقريبي + الهدف + وقف الخسارة
• مثال: "يُتوقع أن يستفيد قطاع الدفاع — دخول مرجعي: 320 ريال | هدف: 350 | وقف: 305 | أفق: 3 أشهر"
⚠️ التوصيات بدون مستويات سعرية = توصيات مرفوضة — كل توصية يجب أن تحتوي على دخول وهدف ووقف خسارة
⚠️ المستويات السعرية أرقام محددة — ممنوع كلمات عامة مثل "عند الانخفاضات"

## 10. مؤشرات المتابعة
5 مؤشرات محددة يجب مراقبتها لتحديث هذا التقرير.

## 11. المصادر والمراجع
كل مصدر استُشهد به مع التاريخ. لا تضمّن مصادر لم تُستخدم فعلاً في التقرير.
التنسيق:
المصادر والمراجع:
━━━━━━━━━━━━━━━
[١] اسم المصدر — الشهر السنة
[٢] اسم المصدر — الشهر السنة

⚠️ ممنوع كتابة قسم "التحليل المفصل" أو أي قسم إضافي غير المذكور أعلاه.
⚠️ ممنوع كتابة قسم "توصيات رؤى" — سيُولَّد منفصلاً.
توقف بعد القسم الحادي عشر.

---
تحذير: هذا تقرير تحليلي لأغراض إعلامية فقط.`;
}

// ─── Strategic Report Prompt Builder — Part 3 (Section 8: توصيات رؤى) ──
// V133: توصيات رؤى generated in SEPARATE API call to prevent copy-paste
// from التوصيات الاستراتيجية. This call receives only a summary of the
// report (NOT the strategic recommendations text) so the model must
// generate unique actionable content from scratch.
function buildStrategicPromptPart3(params: {
  topic: string;
  region: string;
  reportSummary: string; // Executive summary + key findings ONLY — NOT strategic recommendations
  affectedAssets: string; // Section 6 content for specific asset mentions
  currentDate: string;
}): string {
  const { topic, region, reportSummary, affectedAssets, currentDate } = params;

  return `أنت مستشار استثماري متخصص في الأسواق المالية العربية.
مهمتك كتابة قسم "توصيات رؤى" فقط — قرارات عملية مباشرة للمستثمرين.

التاريخ الحالي هو: ${currentDate}
جميع الإشارات الزمنية يجب أن تكون بالنسبة لهذا التاريخ.
لا تستخدم تواريخ المصادر كمرجع زمني.

الموضوع: ${topic}
النطاق الجغرافي: ${region}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ملخص التقرير (لا يشتمل على توصيات):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الأصول المتأثرة والمستفيدة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${affectedAssets}

اكتب القسم التالي فقط:

## 9. توصيات رؤى
قرارات عملية مباشرة — ماذا تفعل الآن؟

════════════════════════════════════════
⚠️ قاعدة V182 الحرجة — فريدة لكل شريحة:
════════════════════════════════════════
كل شريحة من الشرائح الثلاث يجب أن تكون مختلفة جذرياً عن الأخريات:
- أصول مختلفة لكل شريحة (لا تذكر نفس الأصل في شريحتين)
- أفق زمني مختلف تماماً (أيام vs أشهر vs سنوات)
- لغة مختلفة: يومي=صفقات/أسعار | متوسط=تخصيص/تنويع | طويل=استراتيجيات هيكلية
- إذا وجدت نفسك تكتب نفس الجملة في شريحتين → أعد الكتابة فوراً

اختبار الجودة: هل يستطيع القارئ التمييز بين الشريحتين من السطر الأول فقط؟
إذا لا → الفرق غير كافٍ → أعد الكتابة.

════════════════════════════════════════

### المتداول اليومي (أفق أسبوع أو أقل)
هذا القسم = صفقات سريعة بمستويات دخول وخروج محددة.
كل توصية تحتوي إلزامياً على: سعر دخول + سعر وقف + سعر هدف + أقصى مدة
مثال كامل: "برنت: دخول شراء عند 85 دولار — وقف 82 — هدف 89 — أقصى مدة 3 أيام"
مثال آخر: "EUR/USD: بيع عند 1.0890 — وقف 1.0920 — هدف 1.0840 — أقصى مدة يومين"
⚠️ ممنوع في هذا القسم: بنية تحتية، تنويع المحفظة، استثمار طويل الأجل، تطوير القطاعات

### المستثمر متوسط الأجل (1-6 أشهر)
هذا القسم = خطط استثمارية شهرية مع نسب تخصيص من المحفظة.
كل توصية تحتوي إلزامياً على: نسبة من المحفظة + نقطة دخول تقريبية + أفق زمني بالأشهر
مثال كامل: "خصص 15٪ من المحفظة لأسهم الطاقة — دخول تدريجي فوق 120 ريال لأرامكو — أفق 3 أشهر"
مثال آخر: "وزّع 10٪ على سندات الخزانة بعائد 4.5٪ — حماية من تقلبات الأسهم — أفق 4 أشهر"
⚠️ ممنوع في هذا القسم: تداول يومي، صفقات سريعة، مستويات وقف يومية، استثمار متعدد السنوات

### المستثمر طويل الأجل (6 أشهر فأكثر)
هذا القسم = استراتيجيات هيكلية لبناء محفظة عبر سنوات.
كل توصية تحتوي إلزامياً على: استراتيجية هيكلية + وزن المحفظة + نقطة إعادة التقييم
مثال كامل: "اجمع الذهب تدريجياً على مستويات 1950-2000 دولار — وزن 10٪ من المحفظة — أعد التقييم بعد 12 شهراً"
مثال آخر: "ابنِ مركزاً في أسهم الدفاع بنسبة 8٪ من المحفظة — دخول على 3 دفعات سنوية — أعد التقييم كل 6 أشهر"
⚠️ ممنوع في هذا القسم: تداول يومي، صفقات سريعة، مستويات وقف يومية

════════════════════════════════════════
قواعد التنسيق:
════════════════════════════════════════
• كل توصية = أصل واحد + إجراء واحد + رقم واحد
• كل شريحة تحتوي على 2-3 توصيات كحد أقصى
• الأرقام بالعربية حيثما أمكن

⚠️ ممنوع منعاً باتاً:
- نسخ أو إعادة صياغة أي تحليل أكاديمي
- استخدام صيغة المحلل المحايد ("يُتوقع أن...")
- تقديم تحليلات عامة بدون أرقام محددة
- كتابة أي قسم غير "توصيات رؤى"
- V145: تكرار أي محتوى — اكتب كل شريحة مرة واحدة فقط!
- V156: نقل توصيات من شريحة لأخرى — كل شريحة محتوى فريد يناسب أفقها الزمني فقط
- V182: كتابة نفس الجملة أو جملة مشابهة جداً في شريحتين مختلفتين

صوت الكتابة: مباشر حاسم — لغة قرار وليس لغة تحليل.
القارئ يريد أن يعرف: ماذا أفعل الآن؟ بأي أصل؟ بأي رقم؟

---
تحذير: هذه توصيات استشارية لأغراض إعلامية فقط.`;
}

// ─── Extract Report Summary for Part 3 ─────────────────────
// V133: Extract key sections from Part 1 + Part 2 to use as input
// for the توصيات رؤى generation. Excludes strategic recommendations.
function extractReportSummary(part1Content: string, part2Content: string): { summary: string; assets: string } {
  // V171: Updated section numbers after adding مقدمة التقرير as section 2
  // Old numbering: 1=ملخص, 2=سياق, 3=تداعيات, 4=تأثير, 5=سيناريوهات, 6=أصول
  // New numbering: 1=ملخص, 2=مقدمة, 3=سياق, 4=تداعيات, 5=تأثير, 6=سيناريوهات, 7=أصول

  // Extract executive summary (section 1) from Part 1
  const execMatch = part1Content.match(/##\s*1[\.\s]*الملخص التنفيذي[\s\S]*?(?=\n##\s|$)/i);
  const executiveSummary = execMatch ? execMatch[0].replace(/^##\s*1[\.\s]*الملخص التنفيذي\s*/i, '').trim() : part1Content.slice(0, 800);

  // Extract key findings from sections 4-5 (V171: was 3-4, now shifted by +1)
  const impactMatch = part1Content.match(/##\s*4[\.\s]*التداعيات[\s\S]*?(?=\n##\s|$)/i);
  const marketMatch = part1Content.match(/##\s*5[\.\s]*تأثير[\s\S]*?(?=\n##\s|$)/i);
  const keyFindings = [
    impactMatch ? impactMatch[0].replace(/^##\s*4[\.\s]*التداعيات[^\n]*\s*/i, '').trim().slice(0, 500) : '',
    marketMatch ? marketMatch[0].replace(/^##\s*5[\.\s]*تأثير[^\n]*\s*/i, '').trim().slice(0, 500) : '',
  ].filter(s => s.length > 20).join('\n\n');

  // Extract scenarios (section 6) from Part 2 (V171: was 5, now 6)
  const scenarioMatch = part2Content.match(/##\s*6[\.\s]*السيناريوهات[\s\S]*?(?=\n##\s|$)/i);
  const scenarios = scenarioMatch ? scenarioMatch[0].replace(/^##\s*6[\.\s]*السيناريوهات[^\n]*\s*/i, '').trim().slice(0, 600) : '';

  const summary = `الملخص التنفيذي:\n${executiveSummary.slice(0, 600)}\n\nأهم التداعيات والآثار:\n${keyFindings}\n\nالسيناريوهات:\n${scenarios}`;

  // Extract affected assets (section 7) separately (V171: was 6, now 7)
  const assetsMatch = part2Content.match(/##\s*7[\.\s]*الأصول المتأثرة[\s\S]*?(?=\n##\s|$)/i);
  const assets = assetsMatch ? assetsMatch[0].replace(/^##\s*7[\.\s]*الأصول المتأثرة[^\n]*\s*/i, '').trim().slice(0, 800) : 'غير متوفر';

  return { summary, assets };
}

// ─── Markdown → Structured JSON Converter ─────────────────────
// V105: Parse Markdown output from AI and convert to structured JSON
// with named sections before saving to the database. This ensures
// the report content is always properly structured regardless of
// how the AI formats the output.

// Map Arabic section headings to English keys for consistent storage
// V171: Updated to match new section numbering (added مقدمة التقرير as section 2)
const SECTION_HEADING_MAP: Record<string, string> = {
  'الملخص التنفيذي': 'executiveSummary',
  'مقدمة التقرير': 'introduction',
  'السياق والخلفية': 'context',
  'التداعيات الاقتصادية المباشرة': 'economicImpact',
  'تأثير على أسواق المال': 'marketImpact',
  'السيناريوهات': 'scenarios',
  'أصول تستفيد وأصول تتضرر': 'affectedAssets',
  'الأصول المتأثرة للمتداول': 'affectedAssets',
  'التوصيات الاستراتيجية': 'strategicRecommendations',
  'توصيات رؤى': 'rouaRecommendations',
  'مؤشرات المتابعة': 'followUpIndicators',
  'المصادر والمراجع': 'sources',
};

// Also map by number pattern (e.g. "1. الملخص التنفيذي")
// V171: Updated numbering after adding مقدمة التقرير as section 2
const SECTION_NUMBER_MAP: Record<string, string> = {
  '1': 'executiveSummary',
  '2': 'introduction',
  '3': 'context',
  '4': 'economicImpact',
  '5': 'marketImpact',
  '6': 'scenarios',
  '7': 'affectedAssets',
  '8': 'strategicRecommendations',
  '9': 'rouaRecommendations',
  '10': 'followUpIndicators',
  '11': 'sources',
};

function markdownToStructuredJson(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Remove "التحليل المفصل" section entirely
  let cleaned = markdown.replace(/^##\s*التحليل المفصل\s*\n[\s\S]*?(?=\n##\s|\n---\s*$|$)/im, '');
  cleaned = cleaned.replace(/^###?\s*التحليل المفصل\s*\n[\s\S]*?(?=\n##\s|\n###?\s|\n---\s*$|$)/im, '');

  // Split by ## headings
  const headingRegex = /^##\s+(\d+[\.\s]*)?(.+)$/gm;
  const matches: { index: number; number: string; title: string }[] = [];
  let match;
  while ((match = headingRegex.exec(cleaned)) !== null) {
    matches.push({
      index: match.index,
      number: (match[1] || '').replace(/[\.\s]/g, '').trim(),
      title: match[2].trim(),
    });
  }

  if (matches.length === 0) {
    // No ## headings found — store as overview
    sections.overview = cleaned.trim();
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index + cleaned.substring(matches[i].index).split('\n')[0].length + 1;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : cleaned.length;
    const content = cleaned.substring(startIdx, endIdx).trim();

    if (content.length < 5) continue; // Skip empty sections

    // Determine the section key
    let sectionKey = '';

    // Try matching by number first (most reliable)
    if (matches[i].number && SECTION_NUMBER_MAP[matches[i].number]) {
      sectionKey = SECTION_NUMBER_MAP[matches[i].number];
    }

    // Try matching by title
    if (!sectionKey) {
      const title = matches[i].title;
      for (const [arabicTitle, key] of Object.entries(SECTION_HEADING_MAP)) {
        if (title.includes(arabicTitle) || arabicTitle.includes(title)) {
          sectionKey = key;
          break;
        }
      }
    }

    // Fallback: use sanitized title as key
    if (!sectionKey) {
      sectionKey = `section${matches[i].number || i + 1}`;
    }

    // V133: If section key already exists, keep the longer content (more complete)
    // This handles cases where continuation calls or Part 3 produce duplicate sections
    if (sections[sectionKey] && sections[sectionKey].length >= content.length) {
      continue; // Keep existing (longer) content
    }
    sections[sectionKey] = content;
  }

  return sections;
}

// ─── V145→V182: Deduplicate Rou'a Recommendations ────────────
// The LLM sometimes generates the same sub-section content twice (e.g.,
// "المتداول اليومي" + recommendations, then the same content again), OR
// generates very similar content across DIFFERENT investor categories
// (e.g., "المستثمر متوسط الأجل" and "المستثمر طويل الأجل" having identical text).
//
// V182: Enhanced cross-category duplication detection.
// The old code only checked title similarity (same title appearing twice).
// Now we also check CROSS-CATEGORY content duplication: if two different
// categories (e.g., متوسط vs طويل) have highly similar content, we flag it
// and add a warning to the shorter one.
function deduplicateRouaRecommendations(text: string): string {
  // Split by ### sub-headings (المتداول اليومي, المستثمر متوسط الأجل, المستثمر طويل الأجل)
  const subSectionRegex = /^###\s+(.+)$/gm;
  const subSections: { title: string; content: string; index: number }[] = [];
  let match;
  while ((match = subSectionRegex.exec(text)) !== null) {
    subSections.push({
      title: match[1].trim(),
      content: '',
      index: match.index,
    });
  }

  if (subSections.length < 2) return text; // No duplication possible

  // Extract content for each sub-section
  for (let i = 0; i < subSections.length; i++) {
    const startIdx = subSections[i].index + text.substring(subSections[i].index).split('\n')[0].length + 1;
    const endIdx = i + 1 < subSections.length ? subSections[i + 1].index : text.length;
    subSections[i].content = text.substring(startIdx, endIdx).trim();
  }

  // ── Pass 1: Same-title duplication (e.g., "المتداول اليومي" appears twice) ──
  const seen = new Map<string, number>(); // normalized title → first occurrence index
  const keepIndices = new Set<number>();

  for (let i = 0; i < subSections.length; i++) {
    const normalizedTitle = subSections[i].title
      .replace(/[()\[\]{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    let isDuplicate = false;
    for (const [seenTitle, seenIdx] of seen) {
      if (normalizedTitle === seenTitle ||
          normalizedTitle.includes(seenTitle) ||
          seenTitle.includes(normalizedTitle)) {
        const content1 = subSections[seenIdx].content.replace(/[*#\-\[\](){}|]/g, ' ').trim();
        const content2 = subSections[i].content.replace(/[*#\-\[\](){}|]/g, ' ').trim();

        const words1 = new Set(content1.split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(content2.split(/\s+/).filter(w => w.length > 3));
        let intersection = 0;
        for (const w of words1) { if (words2.has(w)) intersection++; }
        const union = words1.size + words2.size - intersection;
        const similarity = union > 0 ? intersection / union : 0;

        if (similarity > 0.6) {
          isDuplicate = true;
          if (subSections[i].content.length > subSections[seenIdx].content.length) {
            keepIndices.delete(seenIdx);
            keepIndices.add(i);
            seen.set(normalizedTitle, i);
          }
          console.log(`[StrategicReport V145] Same-title dedup: "${subSections[i].title}" ≈ "${subSections[seenIdx].title}" (${(similarity * 100).toFixed(0)}%)`);
          break;
        }
      }
    }

    if (!isDuplicate) {
      seen.set(normalizedTitle, i);
      keepIndices.add(i);
    }
  }

  // ── Pass 2 (V182): Cross-category duplication check ──
  // Check ALL pairs of sub-sections (even with different titles) for content overlap.
  // If two different investor categories have very similar content, flag it.
  const keptSubs = Array.from(keepIndices).sort((a, b) => a - b);
  for (let i = 0; i < keptSubs.length; i++) {
    for (let j = i + 1; j < keptSubs.length; j++) {
      const ss1 = subSections[keptSubs[i]];
      const ss2 = subSections[keptSubs[j]];

      // Skip if titles are the same (already handled in Pass 1)
      const t1 = ss1.title.replace(/[()\[\]{}]/g, '').trim();
      const t2 = ss2.title.replace(/[()\[\]{}]/g, '').trim();
      if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) continue;

      // Compare content
      const stripFormatting = (s: string) => s.replace(/[*#\-\[\](){}|]/g, ' ').replace(/\s+/g, ' ').trim();
      const c1 = stripFormatting(ss1.content);
      const c2 = stripFormatting(ss2.content);

      // Sentence-level comparison: extract sentences from each
      const sentences1 = c1.split(/[.!?؟،؛]/).filter(s => s.trim().length > 15);
      const sentences2 = c2.split(/[.!?؟،؛]/).filter(s => s.trim().length > 15);

      if (sentences1.length === 0 || sentences2.length === 0) continue;

      // Count how many sentences from ss2 appear (nearly) identically in ss1
      let duplicateSentences = 0;
      for (const s2 of sentences2) {
        const normalized2 = s2.replace(/\s+/g, ' ').trim();
        for (const s1 of sentences1) {
          const normalized1 = s1.replace(/\s+/g, ' ').trim();
          // Check if 80%+ of the words overlap
          const words1 = new Set(normalized1.split(' ').filter(w => w.length > 3));
          const words2 = new Set(normalized2.split(' ').filter(w => w.length > 3));
          let inter = 0;
          for (const w of words2) { if (words1.has(w)) inter++; }
          const minLen = Math.min(words1.size, words2.size);
          const overlap = minLen > 0 ? inter / minLen : 0;
          if (overlap > 0.75) {
            duplicateSentences++;
            break; // Count each s2 sentence once
          }
        }
      }

      const duplicationRatio = duplicateSentences / Math.max(sentences2.length, 1);

      if (duplicationRatio > 0.5) {
        console.warn(`[StrategicReport V182] ⚠️ Cross-category duplication: "${ss1.title}" vs "${ss2.title}" — ${duplicateSentences}/${sentences2.length} sentences overlap (${(duplicationRatio * 100).toFixed(0)}%)`);

        // V182: Add a warning to the shorter/duplicate section
        // The shorter section likely copied from the longer one
        if (ss2.content.length <= ss1.content.length) {
          ss2.content = `⚠️ تنبيه: هذا القسم يتكرر مع "${ss1.title}". يرجى إعادة توليد التقرير.\n\n${ss2.content}`;
        } else {
          ss1.content = `⚠️ تنبيه: هذا القسم يتكرر مع "${ss2.title}". يرجى إعادة توليد التقرير.\n\n${ss1.content}`;
        }
      }
    }
  }

  // If no same-title duplicates found, return original (but cross-category warnings may have been added)
  if (keepIndices.size === subSections.length) {
    // Still need to reconstruct if cross-category warnings were added
    const prefix = text.substring(0, subSections[0].index).trim();
    let result = prefix ? prefix + '\n\n' : '';
    for (let i = 0; i < subSections.length; i++) {
      result += `### ${subSections[i].title}\n${subSections[i].content}`;
      if (i < subSections.length - 1) result += '\n\n';
    }
    return result;
  }

  // Reconstruct text without same-title duplicates (keeping cross-category warnings)
  const prefix = text.substring(0, subSections[keptSubs[0]].index).trim();
  let result = prefix ? prefix + '\n\n' : '';
  for (let i = 0; i < keptSubs.length; i++) {
    const ss = subSections[keptSubs[i]];
    result += `### ${ss.title}\n${ss.content}`;
    if (i < keptSubs.length - 1) result += '\n\n';
  }

  console.log(`[StrategicReport V182] Deduplication: ${subSections.length} sub-sections → ${keptSubs.length} (removed ${subSections.length - keptSubs.length} same-title duplicates)`);
  return result;
}

// ─── V156: Validate Recommendation Category Fit ──────────────
// The LLM sometimes places long-term investor recommendations in the daily
// trader section (e.g., "تطوير البنية التحتية الرقمية" under "المتداول اليومي").
// This function detects mismatched content and removes it from the wrong section.
function validateRecommendationCategories(text: string): string {
  // Long-term keywords that should NEVER appear in daily trader section
  const longTermKeywords = [
    'بنية تحتية رقمية', 'تنويع المحفظة خارج النفط', 'تطوير القطاعات',
    'استثمار طويل الأجل', 'بناء محفظة استثمارية', 'استراتيجية سنوية',
    'تنويع جغرافي', 'تحويل المحفظة', 'إعادة هيكلة المحفظة',
    'استثمار استراتيجي', 'احتياطي استراتيجي', 'خطة سنوية',
    'بنية تحتية', 'تنويع المحفظة',
  ];

  // Daily trader keywords that should NOT appear in long-term section
  const dailyTraderKeywords = [
    'وقف خسارة يومي', 'صفقة سريعة', 'تداول يومي',
    'مستوى دخول', 'سعر هدف يومي', 'أفق يومي',
  ];

  const subSectionRegex = /^###\s+(.+)$/gm;
  const subSections: { title: string; content: string; index: number }[] = [];
  let match;
  while ((match = subSectionRegex.exec(text)) !== null) {
    subSections.push({
      title: match[1].trim(),
      content: '',
      index: match.index,
    });
  }

  if (subSections.length < 2) return text;

  // Extract content for each sub-section
  for (let i = 0; i < subSections.length; i++) {
    const startIdx = subSections[i].index + text.substring(subSections[i].index).split('\n')[0].length + 1;
    const endIdx = i + 1 < subSections.length ? subSections[i].index : text.length;
    subSections[i].content = text.substring(startIdx, endIdx).trim();
  }

  let modified = false;
  for (const ss of subSections) {
    const isDailyTrader = ss.title.includes('يومي') || ss.title.includes('يوم');
    const isLongTerm = ss.title.includes('طويل الأجل') || ss.title.includes('طويل الأمد');

    if (isDailyTrader) {
      // Check for long-term keywords in daily trader section
      const foundLongTerm = longTermKeywords.filter(kw => ss.content.includes(kw));
      if (foundLongTerm.length > 0) {
        // Remove the offending lines
        const lines = ss.content.split('\n');
        const filteredLines = lines.filter(line => !foundLongTerm.some(kw => line.includes(kw)));
        if (filteredLines.length < lines.length) {
          ss.content = filteredLines.join('\n').trim();
          modified = true;
          console.log(`[StrategicReport V156] Removed ${lines.length - filteredLines.length} long-term recommendation(s) from daily trader section: [${foundLongTerm.join(', ')}]`);
        }
      }
    }

    if (isLongTerm) {
      // Check for daily trader keywords in long-term section
      const foundDaily = dailyTraderKeywords.filter(kw => ss.content.includes(kw));
      if (foundDaily.length > 0) {
        const lines = ss.content.split('\n');
        const filteredLines = lines.filter(line => !foundDaily.some(kw => line.includes(kw)));
        if (filteredLines.length < lines.length) {
          ss.content = filteredLines.join('\n').trim();
          modified = true;
          console.log(`[StrategicReport V156] Removed ${lines.length - filteredLines.length} daily trader recommendation(s) from long-term section: [${foundDaily.join(', ')}]`);
        }
      }
    }
  }

  if (!modified) return text;

  // Reconstruct text
  const prefix = text.substring(0, subSections[0].index).trim();
  let result = prefix ? prefix + '\n\n' : '';
  for (let i = 0; i < subSections.length; i++) {
    result += `### ${subSections[i].title}\n${subSections[i].content}`;
    if (i < subSections.length - 1) result += '\n\n';
  }
  return result;
}

// ─── Truncation Detector ────────────────────────────────────
// V105: Detect if AI output was truncated (cut off mid-sentence)
function isTruncated(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 100) return true; // Too short — likely truncated

  // Check if the last line ends abruptly (no period, no complete sentence)
  const lastLine = trimmed.split('\n').filter(l => l.trim().length > 0).pop() || '';
  const lastChar = lastLine.trim().slice(-1);

  // If last character is NOT a sentence-ending character, likely truncated
  const endingChars = ['.', '!', '؟', '،', ':', '---', '```', '-', '۔', '؛', '»', '"', ')', ']', '}'];
  const endsWithList = lastLine.trim().startsWith('-') || lastLine.trim().startsWith('*');

  // If ends with a list item, it might be complete or truncated — check length
  if (endsWithList && trimmed.length > 2000) return false; // Long enough, probably fine

  // If the last line is a heading (##), it's truncated — started a new section without content
  if (/^##\s+/.test(lastLine.trim())) return true;

  // Check for incomplete sentences — ends without punctuation
  if (lastChar && !endingChars.some(c => lastLine.trim().endsWith(c))) {
    // Might be truncated — but check if content is long enough to be usable
    if (trimmed.length > 3000) return true; // Long content, likely truncated
  }

  return false;
}

// ─── V180: Web Search using z-ai-web-dev-sdk ────────────────
// Searches the web for current data related to the report topic.
// This replaces the broken web_search_20250305 tool which returned
// toolUse blocks that Bedrock Converse API couldn't handle.
async function searchWebForTopic(topic: string, region: string): Promise<string> {
  try {
    const zai = await getZAI();
    const searchQueries = [
      `${topic} ${region} latest news analysis 2025`,
      `${topic} market impact financial analysis`,
    ];

    const allResults: string[] = [];

    for (const query of searchQueries) {
      try {
        const results = await zai.functions.invoke('web_search', {
          query,
          num: 8,
        });

        if (Array.isArray(results)) {
          for (const r of results) {
            if (r.snippet && r.name) {
              allResults.push(`- ${r.name}: ${r.snippet}${r.date ? ` (${r.date})` : ''}`);
            }
          }
        }
      } catch (searchErr: any) {
        console.warn(`[StrategicReport V180] Web search query failed: "${query}" — ${searchErr.message}`);
      }
    }

    if (allResults.length === 0) {
      console.warn('[StrategicReport V180] No web search results found — relying on DB news only');
      return '';
    }

    // Deduplicate results by snippet similarity
    const unique = allResults.filter((result, idx, arr) =>
      arr.findIndex(r => r.slice(0, 60) === result.slice(0, 60)) === idx
    );

    console.log(`[StrategicReport V180] Found ${unique.length} unique web search results`);
    return `\n\nنتائج البحث على الإنترنت (${unique.length} نتيجة):\n${unique.join('\n')}`;
  } catch (error: any) {
    console.error('[StrategicReport V180] Web search error:', error.message);
    return '';
  }
}

// ─── Collect Relevant News Data from DB ─────────────────────
async function collectRelevantNews(topic: string, sectors: string[]): Promise<string> {
  try {
    // Search for relevant news from the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const news = await db.newsItem.findMany({
      where: {
        isReady: true,
        isPublished: true,
        locale: 'ar',  // V-LOCALE: Only use Arabic news for Arabic strategic reports
        fetchedAt: { gte: since },
        OR: [
          // Match by category (sector)
          ...(sectors.length > 0 ? [{ category: { in: sectors } }] : []),
          // Match by title containing topic keywords
          { titleAr: { contains: topic, mode: 'insensitive' as const } },
          { title: { contains: topic, mode: 'insensitive' as const } },
        ],
      },
      select: {
        titleAr: true,
        title: true,
        summaryAr: true,
        category: true,
        sentiment: true,
        impactLevel: true,
        affectedAssets: true,
        fetchedAt: true,
      },
      take: 30,
      orderBy: { fetchedAt: 'desc' },
    });

    if (news.length === 0) return '';

    const newsContext = news.map((n, i) => {
      const title = n.titleAr || n.title;
      const summary = n.summaryAr ? ` | ملخص: ${n.summaryAr.slice(0, 120)}` : '';
      return `${i + 1}. ${title} (${n.category} | ${n.sentiment} | تأثير: ${n.impactLevel})${summary}`;
    }).join('\n');

    return `\n\nالبيانات الإخبارية المتاحة (${news.length} خبر):\n${newsContext}`;
  } catch (error: any) {
    console.error('[StrategicReport] Error collecting news:', error.message);
    return '';
  }
}

// ─── Background Generation Tracker ─────────────────────────
interface StrategicJob {
  id: string;
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  result?: { id: string; title: string; slug: string };
  error?: string;
}

const strategicJobs = new Map<string, StrategicJob>();

// ─── POST: Generate Strategic Report ───────────────────────
export async function POST(request: NextRequest) {
  // Auth check
  if (!(verifyInternalOrCronAuth(request) || await verifyDashboardAuth(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    topic?: string;
    region?: string;
    sectors?: string[];
    scenarios?: string[];
    publish?: boolean;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'الجسم مطلوب بتنسيق JSON' }, { status: 400 });
  }

  const {
    topic,
    region = 'العالم العربي والشرق الأوسط',
    sectors = ['اقتصاد كلي'],
    scenarios = ['قصير المدى (1-3 أشهر)', 'متوسط المدى (6-12 شهراً)', 'طويل المدى (1-3 سنوات)'],
    publish = true,
  } = body;

  if (!topic || topic.trim().length < 3) {
    return NextResponse.json(
      { error: 'الموضوع مطلوب (3 أحرف على الأقل)' },
      { status: 400 }
    );
  }

  // Create background job
  const jobId = `strat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const job: StrategicJob = {
    id: jobId,
    topic: topic.trim(),
    status: 'pending',
    startedAt: Date.now(),
  };
  strategicJobs.set(jobId, job);

  // Start generation in background
  const generationPromise = (async () => {
    job.status = 'running';
    console.log(`[StrategicReport] Job ${jobId} started: "${topic}"`);

    try {
      // V151: Generate current date in Arabic for temporal context
      const currentDate = new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
      console.log(`[StrategicReport V151] Current date context: ${currentDate}`);

      // Collect relevant news data from DB
      const newsData = await collectRelevantNews(topic.trim(), sectors);

      // V180: Search the web for current data using z-ai-web-dev-sdk
      // This replaces the broken web_search_20250305 tool which produced empty content
      console.log(`[StrategicReport V180] Job ${jobId} — Searching web for current data...`);
      const webSearchData = await searchWebForTopic(topic.trim(), region);

      // Combine all context sources
      const combinedContext = [newsData, webSearchData].filter(Boolean).join('\n');

      // Add context if available
      const userContent = combinedContext
        ? `استند في تحليلك على البيانات التالية عند التوفر:${combinedContext}`
        : 'اكتب التقرير بناءً على معرفتك المتخصصة في الأسواق المالية.';

      // ─── V105: Two-call generation strategy ───────────────────
      // Split the report into two halves (sections 1-4 and 5-8) to avoid
      // truncation. Each call uses maxTokens=8000 which is more than enough
      // for 4 sections. If a part is truncated, we auto-continue.

      // Call 1: Generate sections 1-4
      const part1SystemPrompt = buildStrategicPromptPart1({
        topic: topic.trim(),
        region,
        sectors,
        scenarios,
        currentDate,
      });

      console.log(`[StrategicReport] Job ${jobId} — Generating Part 1 (sections 1-4) with Sonnet...`);

      // V180: Sonnet model for deep analysis — NO web_search tool (broken in Bedrock Converse API)
      // Web search is now done via z-ai-web-dev-sdk BEFORE AI generation (see searchWebForTopic)
      const sonnetModel = 'us.anthropic.claude-sonnet-4-20250514-v1:0';

      const part1Result = await chatCompletion([
        { role: 'system', content: part1SystemPrompt },
        { role: 'user', content: userContent },
      ], {
        temperature: 0.7,
        maxTokens: 10000,
        priority: 'generation',
        bedrockModelOverride: sonnetModel, // V150: Sonnet for better quality Arabic
        locale: 'ar', // V387: Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
      });

      let part1Content = part1Result.content?.trim() || '';

      // Auto-continue Part 1 if truncated
      if (isTruncated(part1Content)) {
        console.log(`[StrategicReport] Job ${jobId} — Part 1 truncated (${part1Content.length} chars), continuing...`);
        try {
          const continuation = await chatCompletion([
            { role: 'system', content: part1SystemPrompt },
            { role: 'user', content: userContent },
            { role: 'assistant', content: part1Content },
            { role: 'user', content: 'أكمل من حيث توقفت. لا تعد كتابة ما كتبته.' },
          ], {
            temperature: 0.5,
            maxTokens: 6000,
            priority: 'generation',
            bedrockModelOverride: sonnetModel, // V180: Preserve model override on continuation
            locale: 'ar', // V387: Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
          });
          const contText = continuation.content?.trim() || '';
          if (contText.length > 50) {
            part1Content += '\n\n' + contText;
          }
        } catch (contErr: any) {
          console.error(`[StrategicReport] Job ${jobId} — Part 1 continuation failed:`, contErr.message);
        }
      }

      // Call 2: Generate sections 5-7 + 9 (V133: section 8 removed — generated separately in Part 3)
      const part2SystemPrompt = buildStrategicPromptPart2({
        topic: topic.trim(),
        region,
        sectors,
        scenarios,
        part1Content,
        currentDate,
      });

      console.log(`[StrategicReport] Job ${jobId} — Generating Part 2 (sections 5-7, 9) with Sonnet...`);

      const part2Result = await chatCompletion([
        { role: 'system', content: part2SystemPrompt },
        { role: 'user', content: userContent },
      ], {
        temperature: 0.7,
        maxTokens: 10000,
        priority: 'generation',
        bedrockModelOverride: sonnetModel, // V180: Preserve Sonnet model for Part 2
        locale: 'ar', // V387: Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
      });

      let part2Content = part2Result.content?.trim() || '';

      // Auto-continue Part 2 if truncated
      if (isTruncated(part2Content)) {
        console.log(`[StrategicReport] Job ${jobId} — Part 2 truncated (${part2Content.length} chars), continuing...`);
        try {
          const continuation = await chatCompletion([
            { role: 'system', content: part2SystemPrompt },
            { role: 'user', content: userContent },
            { role: 'assistant', content: part2Content },
            { role: 'user', content: 'أكمل من حيث توقفت. لا تعد كتابة ما كتبته.' },
          ], {
            temperature: 0.5,
            maxTokens: 6000,
            priority: 'generation',
            bedrockModelOverride: sonnetModel, // V180: Preserve model override on continuation
            locale: 'ar', // V387: Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
          });
          const contText = continuation.content?.trim() || '';
          if (contText.length > 50) {
            part2Content += '\n\n' + contText;
          }
        } catch (contErr: any) {
          console.error(`[StrategicReport] Job ${jobId} — Part 2 continuation failed:`, contErr.message);
        }
      }

      // ─── V133: Call 3 — Generate section 8 (توصيات رؤى) separately ──
      // Extract report summary (NOT strategic recommendations) for the رؤى prompt
      const { summary: reportSummary, assets: affectedAssetsSummary } = extractReportSummary(part1Content, part2Content);

      const part3SystemPrompt = buildStrategicPromptPart3({
        topic: topic.trim(),
        region,
        reportSummary,
        affectedAssets: affectedAssetsSummary,
        currentDate,
      });

      console.log(`[StrategicReport] Job ${jobId} — Generating Part 3 (section 8: توصيات رؤى)...`);

      let part3Content = '';
      try {
        const part3Result = await chatCompletion([
          { role: 'system', content: part3SystemPrompt },
          { role: 'user', content: `بناءً على ملخص التقرير والأصول المتأثرة، اكتب توصيات رؤى العملية المباشرة.` },
        ], {
          temperature: 0.7,
          maxTokens: 8000, // V302: Increased from 6000 → 8000 to prevent truncation of entry/target/stop values
          priority: 'generation',
          bedrockModelOverride: sonnetModel, // V180: Part 3 also uses Sonnet for quality recommendations
          locale: 'ar', // V387: Arabic — OpenRouter (Haiku) first, then Bedrock/Gemini
        });

        part3Content = part3Result.content?.trim() || '';

        // V302: Auto-continuation if Part 3 is truncated mid-recommendation
        const looksTruncated = part3Content.length > 0 && (
          part3Content.endsWith(':') ||
          part3Content.endsWith(',') ||
          part3Content.endsWith('،') ||
          /Entry\s+\d[\d,.]*$/.test(part3Content) ||
          /دخول[:\s]*\d[\d,.]*$/.test(part3Content) ||
          (part3Content.split('\n').filter(l => l.trim()).length < 8 && part3Result.finishReason !== 'stop')
        );
        if (looksTruncated) {
          console.log(`[StrategicReport] Job ${jobId} — Part 3 appears truncated, generating continuation...`);
          try {
            const continuationResult = await chatCompletion([
              { role: 'system', content: part3SystemPrompt },
              { role: 'assistant', content: part3Content },
              { role: 'user', content: 'أكمل التوصيات من حيث توقفت. لا تكرر ما سبق.' },
            ], {
              temperature: 0.5,
              maxTokens: 4000,
              priority: 'generation',
              bedrockModelOverride: sonnetModel,
              locale: 'ar',
            });
            const continuation = continuationResult.content?.trim() || '';
            if (continuation.length > 20) {
              part3Content += '\n' + continuation;
              console.log(`[StrategicReport] Job ${jobId} — Part 3 continuation added: +${continuation.length} chars`);
            }
          } catch (contErr: any) {
            console.error(`[StrategicReport] Job ${jobId} — Part 3 continuation failed:`, contErr.message);
          }
        }

        console.log(`[StrategicReport] Job ${jobId} — Part 3 generated: ${part3Content.length} chars`);
      } catch (part3Err: any) {
        console.error(`[StrategicReport] Job ${jobId} — Part 3 (توصيات رؤى) failed:`, part3Err.message);
        // Non-fatal — report can be saved without توصيات رؤى
        part3Content = '';
      }

      // ─── Merge all parts and convert to structured JSON ─────────────
      // V144→V145: Strip section 9 (توصيات رؤى) from Part 2 BEFORE merging with Part 3.
      // V171: Was section 8, now section 9 after adding مقدمة التقرير as section 2.
      // The LLM sometimes ignores "don't write section 9" instructions in Part 2.
      // If we don't strip it, we get duplicate رؤى recommendations.
      //
      // V145 FIX: Removed 'm' flag from the regex. The 'm' flag made $ match
      // end-of-LINE instead of end-of-STRING. With [\s\S]*? (lazy), the regex
      // would stop at the first line break after the heading — stripping only the
      // heading line but leaving the content (3 sub-sections) in cleanedPart2.
      // Then when Part 3 content is also added, the same content appears twice.
      let cleanedPart2 = part2Content;
      if (part3Content && part3Content.length > 50) {
        // Strip "## 9. توصيات رؤى" section and ALL its content until next ## numbered heading
        // V171: Updated from 8 to 9 for new numbering
        // V172 FIX: Use 'm' flag so ^ matches start-of-line (not just start-of-string).
        // Two-pass approach: (1) strip sections followed by another ## numbered heading,
        // (2) strip sections at end of string (no subsequent heading).

        // Pass 1: Section 9 followed by another numbered heading
        cleanedPart2 = cleanedPart2.replace(/^##\s*9[\.\s]*توصيات\s*رؤى[\s\S]*?(?=^##\s+\d)/gm, '');
        // Pass 2: Section 9 at end of string (no subsequent heading)
        cleanedPart2 = cleanedPart2.replace(/^##\s*9[\.\s]*توصيات\s*رؤى[\s\S]*$/gm, '');

        // Also strip "## 8. توصيات رؤى" (old numbering, in case LLM uses old format)
        cleanedPart2 = cleanedPart2.replace(/^##\s*8[\.\s]*توصيات\s*رؤى[\s\S]*?(?=^##\s+\d)/gm, '');
        cleanedPart2 = cleanedPart2.replace(/^##\s*8[\.\s]*توصيات\s*رؤى[\s\S]*$/gm, '');

        // Also strip "## توصيات رؤى" without number
        cleanedPart2 = cleanedPart2.replace(/^##\s*توصيات\s*رؤى[\s\S]*?(?=^##\s+\d)/gm, '');
        cleanedPart2 = cleanedPart2.replace(/^##\s*توصيات\s*رؤى[\s\S]*$/gm, '');

        // Also strip ### level sub-sections that might be orphaned from section 9
        cleanedPart2 = cleanedPart2.replace(/^###\s*(المتداول اليومي|المستثمر متوسط الأجل|المستثمر طويل الأجل)[\s\S]*?(?=^##\s+\d|^##\s*10|^##\s*توصيات)/gm, '');
        cleanedPart2 = cleanedPart2.replace(/^###\s*(المتداول اليومي|المستثمر متوسط الأجل|المستثمر طويل الأجل)[\s\S]*$/gm, '');
      }

      let fullMarkdown = part1Content + '\n\n' + cleanedPart2 + (part3Content ? '\n\n' + part3Content : '');

      // V137: Strip AI internal comment leaks from merged content
      fullMarkdown = fullMarkdown
        .replace(/توقفت\s+هنا\s+عند\s+القسم\s+.*$/gm, '')
        .replace(/أكمل\s+من\s+حيث\s+توقفت.*$/gm, '')
        .replace(/^[\s]*ملاحظة[\s:]*(للمراجع|للناشر|للقارئ|للمحرر|للمدقق)?[\s:]*.*$/gm, '')
        .replace(/سأكمل\s+عند\s+الطلب.*$/gm, '')
        .replace(/^[\s]*هذا\s+الجزء\s+يتضمن.*$/gm, '')
        .replace(/\[ملاحظة[^\]]*\]/g, '')
        .replace(/\(ملاحظة[^)]*\)/g, '')
        .replace(/كما\s+هو\s+مطلوب.*$/gm, '')
        .replace(/بناءً?\s+على\s+التعليمات.*$/gm, '')
        .replace(/^---\s*$/gm, '')
        .replace(/^[\s]*سأقوم\s+ب.*$/gm, '')
        .replace(/^[\s]*الآن\s+سأكتب.*$/gm, '')
        .replace(/^[\s]*الآن\s+أكمل.*$/gm, '')
        .replace(/بناء\s+على\s+الطلب.*$/gm, '')
        .replace(/كما\s+طلبت.*$/gm, '')

      // V139: Strip internal data source references — (البند N), (انظر قسم X)
        .replace(/\(البند\s+\d+\)/g, '')
        .replace(/\(البند\s+[^\)]*\)/g, '')
        .replace(/\(انظر\s+قسم\s+[^\)]*\)/g, '')
        .replace(/\(المصدر\s+الداخلي\s+[^\)]*\)/g, '')
        .replace(/\(مرجع\s+داخلي\s*[^\)]*\)/g, '')

      // V139: Strip H1 headers from middle of report (artifact of multi-pass merge)
      // The first valid section is ## 1. الملخص التنفيذي — anything before it with # is junk
      // Also remove any # that appears after the first ## header
        .replace(/^#\s+(?!$)/gm, function(match, offset, string) {
          // Only strip H1 if it's NOT at the very beginning (title position)
          // and there are already ## headers before it
          const beforeText = string.slice(0, offset);
          if (beforeText.includes('##')) {
            return '## '; // V144: Fix — preserve the space after ##
          }
          return match; // Keep H1 at the very start (if any)
        })

      // V139: Remove duplicate section headings that appear from multi-pass merge
      // If "## 5. السيناريوهات" appears twice, keep only the first occurrence's content
      // This happens when Part 2 is regenerated and overlaps with continuation

      // V144→V171: Convert ## inside recommendation sections to ###
      // V171: Updated section numbers — توصيات رؤى is now 9 (was 8), التوصيات الاستراتيجية is now 8 (was 7)
      // Rule [16]: Only the main section heading should be ##
      // Everything inside should be ### or ####
      // FIX: Removed 'm' flag and changed `$` lookahead to `(?=^##\s+\d|\n*$)`
      // The 'm' flag made `$` match end-of-line instead of end-of-string,
      // causing the lazy [\s\S]*? to match only the heading line, not the full section.
        .replace(/(^##\s+9[\.\s]*توصيات\s+رؤى[\s\S]*?)(?=^##\s+\d|\n*$)/g, function(match) {
          // Inside section 9 (توصيات رؤى), convert ## to ###
          return match.replace(/^##\s+(?!\d)/gm, '### ');
        })
        .replace(/(^##\s+8[\.\s]*التوصيات\s+الاستراتيجية[\s\S]*?)(?=^##\s+\d|\n*$)/g, function(match) {
          // Inside section 8 (التوصيات الاستراتيجية), convert ## to ###
          return match.replace(/^##\s+(?!\d)/gm, '### ');
        })

      // V139: Strip "لا توجد بيانات محددة" internal comments
        .replace(/^[\s]*لا\s+توجد\s+بيانات\s+محددة\s+حول.*$/gm, '')

      // V152: Strip foreign script characters (Chinese, Cyrillic, Korean, etc.)
      // AI sometimes injects CJK or other non-Arabic/non-Latin characters into Arabic text
        .replace(/[\u0400-\u04FF]/g, '')     // Cyrillic
        .replace(/[\u0E00-\u0E7F]/g, '')     // Thai
        .replace(/[\u0900-\u097F]/g, '')     // Devanagari
        .replace(/[\u3040-\u309F]/g, '')     // Hiragana
        .replace(/[\u30A0-\u30FF]/g, '')     // Katakana
        .replace(/[\uAC00-\uD7AF]/g, '')     // Hangul
        .replace(/[\u4E00-\u9FFF]/g, '')     // CJK Unified Ideographs (Chinese)
        .replace(/[\u3400-\u4DBF]/g, '')     // CJK Extension A
        .replace(/[\uF900-\uFAFF]/g, '')     // CJK Compatibility Ideographs
        .replace(/[\u0C00-\u0C7F]/g, '')     // Telugu
        .replace(/[\u0B80-\u0BFF]/g, '')     // Tamil
        .replace(/[\u0980-\u09FF]/g, '')     // Bengali
        .replace(/[\u1100-\u11FF]/g, '')     // Hangul Jamo
        .replace(/[\u3130-\u318F]/g, '')     // Hangul Compatibility Jamo

        .replace(/\n{3,}/g, '\n\n')
        .trim();

      console.log(`[StrategicReport] Job ${jobId} — Full markdown: ${fullMarkdown.length} chars (Part3: ${part3Content.length} chars)`);

      // V221: Content Substantiality Gate for Strategic Reports
      // Check that the generated content is actually meaningful and not just
      // dots, empty parentheses, or placeholder fragments.
      {
        const arabicWords = fullMarkdown.match(/[\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{2,})*/g) || [];
        const arabicWordCount = arabicWords.length;
        const placeholderPatterns = [/\.\.\./g, /\.\s*\.\s*\./g, /\(\s*\)/g, /\*\*\s*\*\*/g];
        let placeholderCount = 0;
        for (const pat of placeholderPatterns) {
          const matches = fullMarkdown.match(pat) || [];
          placeholderCount += matches.length;
        }

        if (arabicWordCount < 50) {
          console.error(`[StrategicReport V221] 🚨 CONTENT NOT SUBSTANTIAL: Only ${arabicWordCount} Arabic words in strategic report — expected hundreds. Placeholders: ${placeholderCount}`);
          throw new Error(`التقرير فارغ أو شبه فارغ — ${arabicWordCount} كلمة عربية فقط`);
        }
        if (placeholderCount > 20) {
          console.error(`[StrategicReport V221] 🚨 HIGH PLACEHOLDER COUNT: ${placeholderCount} placeholder patterns in strategic report`);
          // Don't throw, but flag for lower confidence
          confidenceScore = Math.min(confidenceScore, 25);
        }
        console.log(`[StrategicReport V221] ✓ Content substantial: ${arabicWordCount} Arabic words, ${placeholderCount} placeholders`);
      }

      // V221: Arabic Spell Check for Strategic Reports
      // Apply common Arabic typo corrections
      fullMarkdown = fullMarkdown
        .replace(/تكاليس/g, 'تكاليف')
        .replace(/التكاليس/g, 'التكاليف')
        .replace(/الإستهلاك/g, 'الاستهلاك')
        .replace(/إقتصادي/g, 'اقتصادي')
        .replace(/الإقتصادي/g, 'الاقتصادي')
        .replace(/إستثمار/g, 'استثمار')
        .replace(/الإستثمار/g, 'الاستثمار')
        .replace(/إستراتيجية/g, 'استراتيجية')
        .replace(/الإستراتيجية/g, 'الاستراتيجية')
        .replace(/إستقرار/g, 'استقرار')
        .replace(/الإستقرار/g, 'الاستقرار')
        .replace(/بأثر\s+راجع/g, 'بأثر رجعي');

      // V221: Expert hallucination check for strategic reports
      // Look for fabricated expert names in the generated content
      {
        const expertPatterns = [
          /(?:د\.|دكتور|بروفيسور)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
          /(?:السيد|السيدة|الأستاذ|الشيخ|المهندس)\s+([\u0600-\u06FF]{3,}(?:\s+[\u0600-\u06FF]{3,}){1,3})/g,
        ];
        const foundExperts: string[] = [];
        for (const pattern of expertPatterns) {
          let match;
          while ((match = pattern.exec(fullMarkdown)) !== null) {
            const name = match[1]?.trim();
            if (name && name.length >= 6) {
              foundExperts.push(name);
            }
          }
        }
        if (foundExperts.length > 0) {
          // Strategic reports should NOT have fabricated experts — they're based on analysis, not quotes
          // Unless the user explicitly requested expert opinions, strip them
          console.warn(`[StrategicReport V221] ⚠️ Found ${foundExperts.length} expert names in strategic report: ${foundExperts.join(', ')}. These may be fabricated — verify before publishing.`);
          // Don't auto-strip for strategic reports since they're more deliberate,
          // but add a note and lower confidence if many experts are listed
          if (foundExperts.length >= 3) {
            confidenceScore = Math.min(confidenceScore, 30);
            console.warn(`[StrategicReport V221] 🚨 ${foundExperts.length} experts found — possible hallucination. Capping confidence at 30.`);
          }
        }
      }

      // V105: Convert Markdown to structured JSON sections
      const structuredSections = markdownToStructuredJson(fullMarkdown);
      const sectionCount = Object.keys(structuredSections).length;
      console.log(`[StrategicReport] Job ${jobId} — Parsed ${sectionCount} structured sections`);
      console.log(`[StrategicReport] Job ${jobId} — Section keys: [${Object.keys(structuredSections).join(', ')}]`);
      console.log(`[StrategicReport] Job ${jobId} — rouaRecommendations exists: ${!!structuredSections.rouaRecommendations} (${(structuredSections.rouaRecommendations || '').length} chars)`);

      // V144→V145: ALWAYS use Part 3 content for rouaRecommendations, ignoring
      // whatever the parser found for section 8 in Part 2's content.
      // Part 3 is generated in a SEPARATE call specifically for رؤى recommendations.
      //
      // V145: Added deduplication — detect if the LLM generated the same
      // sub-section content twice (e.g., "المتداول اليومي" appearing 2x).
      // This happens when the LLM "loops" and repeats its output.
      if (part3Content && part3Content.length > 50) {
        // Strip the "## 9. توصيات رؤى" heading and extract content
        // V171: Updated from 8 to 9 for new numbering
        let cleanedPart3 = part3Content
          .replace(/^##\s*9[\.\s]*توصيات\s*رؤى\s*\n?/i, '')
          .replace(/^##\s*8[\.\s]*توصيات\s*رؤى\s*\n?/i, '')  // Old numbering fallback
          .replace(/^##\s*توصيات\s*رؤى\s*\n?/i, '')
          .replace(/^###\s+/gm, '### ')  // Clean up sub-headings
          .trim();

        // V145: Deduplicate internal content — detect repeated sub-sections
        cleanedPart3 = deduplicateRouaRecommendations(cleanedPart3);

        // V156: Validate that recommendations match their investor category
        // Removes long-term advice from daily trader section and vice versa
        cleanedPart3 = validateRecommendationCategories(cleanedPart3);

        if (cleanedPart3.length > 30) {
          structuredSections.rouaRecommendations = cleanedPart3;
          console.log(`[StrategicReport V156] Force-injected Part 3 content as rouaRecommendations (${cleanedPart3.length} chars, after dedup + category validation)`);
        }
      }

      // V156: Introduction quality gate — enforce ≤200 words in code (was 120, too restrictive causing truncated 3rd point)
      const MAX_INTRO_WORDS = 200;
      const introKey = Object.keys(structuredSections).find(k =>
        k === 'executiveSummary' || k === 'introduction'
      );
      if (introKey && typeof structuredSections[introKey] === 'string') {
        const introText = structuredSections[introKey] as string;
        const words = introText.split(/\s+/).filter(w => w.length > 0);
        if (words.length > MAX_INTRO_WORDS) {
          // Truncate at sentence boundary
          const truncated = words.slice(0, MAX_INTRO_WORDS).join(' ');
          const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('۔'),
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('؟'),
            truncated.lastIndexOf('!'),
          );
          const finalIntro = lastSentenceEnd > truncated.length * 0.7
            ? truncated.slice(0, lastSentenceEnd + 1).trim()
            : truncated.trim();
          structuredSections[introKey] = finalIntro;
          console.warn(`[StrategicReport V134] Introduction truncated: ${words.length} → ${finalIntro.split(/\s+/).length} words (max ${MAX_INTRO_WORDS})`);
        }
      }

      // V216: Dynamic confidence score based on sources count, quality, data richness & completeness
      // OLD formula (V134-V180): always yielded ~80% regardless of actual source quality:
      //   Math.min(95, 40 + Math.min(fullMarkdown.length / 50, 30) + (newsData ? 10 : 0) + (webSearchData ? 10 : 0))
      // NEW formula factors in: cited sources, dated sources, specific data points,
      // section completeness, and data availability — producing a credible, variable score.
      const sourcesSection = structuredSections.sources || '';
      // Count numbered source references [١], [1], etc.
      const sourceRefPattern = /[\[\(]\s*[\d١٢٣٤٥٦٧٨٩٠]+\s*[\]\)]/g;
      const sourceRefs = sourcesSection.match(sourceRefPattern) || [];
      const sourceCount = sourceRefs.length || sourcesSection.split('\n').filter((l: string) => l.trim().length > 5 && !/^━/.test(l.trim())).length;

      // Count specific data points: percentages, dollar amounts, named currencies
      const allSectionContent = Object.values(structuredSections).filter((v: any) => typeof v === 'string').join(' ');
      const dataPointPattern = /\d+[\.\d]*\s*(?:%|٪|دولار|ريال|يورو|جنيه|درهم|نقطة|أساس)|\$\d+[\.\d]*/g;
      const dataPoints = (allSectionContent.match(dataPointPattern) || []).length;

      // Source quality: sources with dates or month names are higher quality
      const datedSourcePattern = /\d{4}|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر/g;
      const datedSources = (sourcesSection.match(datedSourcePattern) || []).length;

      // Section completeness: how many expected sections have substantial content
      const expectedStrategicSections = ['executiveSummary', 'context', 'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets', 'strategicRecommendations', 'rouaRecommendations', 'sources'];
      const completedSections = expectedStrategicSections.filter(s => structuredSections[s] && (structuredSections[s] as string).length > 50).length;
      const completenessRatio = completedSections / expectedStrategicSections.length;

      // ── Scoring breakdown (max 95) ──
      // Base:   20 pts (minimum — even with poor data, AI generates something)
      // Sources: 0-25 pts (5+ sources = max)
      // Data:   0-15 pts (10+ specific numbers = max)
      // Quality: 0-15 pts (5+ dated sources = max)
      // Complete: 0-15 pts (all 9 sections = max)
      // Avail:   0-5 pts (news + web search present)
      const baseScore = 20;
      const sourceScore = Math.min(25, Math.round(sourceCount * 5));
      const dataScore = Math.min(15, Math.round(dataPoints * 1.5));
      const qualityScore = Math.min(15, Math.round(datedSources * 3));
      const completenessScore = Math.round(completenessRatio * 15);
      const dataAvailabilityScore = (newsData ? 3 : 0) + (webSearchData ? 2 : 0);

      let confidenceScore = Math.min(95, baseScore + sourceScore + dataScore + qualityScore + completenessScore + dataAvailabilityScore);

      console.log(`[StrategicReport V216] Confidence breakdown: base=${baseScore} sources=${sourceScore}(${sourceCount} srcs) data=${dataScore}(${dataPoints} pts) quality=${qualityScore}(${datedSources} dated) complete=${completenessScore}(${completedSections}/${expectedStrategicSections.length}) avail=${dataAvailabilityScore} → TOTAL=${confidenceScore}`);

      // V137: Detect duplicate sections — strategicRecommendations vs rouaRecommendations
      const stratRecs = structuredSections.strategicRecommendations || '';
      const rouaRecs = structuredSections.rouaRecommendations || '';
      if (stratRecs && rouaRecs) {
        // Simple Jaccard similarity check
        const stopWords = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'أن', 'لا', 'لم', 'و', 'أو', 'هو', 'هي', 'قد', 'كان']);
        const tokenize = (text: string) => {
          const words = text.replace(/[*#\-\[\](){}|]/g, ' ').split(/\s+/)
            .map(w => w.trim()).filter(w => w.length > 2 && !stopWords.has(w));
          return new Set(words);
        };
        const set1 = tokenize(stratRecs);
        const set2 = tokenize(rouaRecs);
        let intersection = 0;
        for (const word of set1) { if (set2.has(word)) intersection++; }
        const union = set1.size + set2.size - intersection;
        const similarity = union > 0 ? intersection / union : 0;

        if (similarity > 0.6) {
          console.warn(`[StrategicReport V137] ⚠️ Duplicate sections detected: strategicRecommendations and rouaRecommendations similarity = ${(similarity * 100).toFixed(1)}%`);
          // Penalty: reduce confidence and flag in metadata
          confidenceScore = Math.max(20, confidenceScore - 20);
          // If rouaaRecommendations is very similar, replace it with a notice
          if (similarity > 0.75) {
            structuredSections.rouaRecommendations = '⚠️ تم رفض توصيات رؤى بسبب التشابه الكبير مع التوصيات الاستراتيجية. يرجى إعادة توليد التقرير.';
            console.warn(`[StrategicReport V137] ❌ rouaRecommendations rejected due to extreme similarity (${(similarity * 100).toFixed(1)}%)`);
          }
        }
      }

      const reportContent = JSON.stringify({
        type: 'strategic',  // V134: Unified format
        generatedAt: new Date().toISOString(),
        confidenceScore: Math.round(confidenceScore),
        sections: structuredSections,
        metadata: {
          generationVersion: 'V180',
          topic: topic.trim(),
          region,
          sectors,
          scenarios,
          part1Length: part1Content.length,
          part2Length: part2Content.length,
          part3Length: part3Content.length,
          totalSections: sectionCount,
          hasRouaaRecommendations: !!structuredSections.rouaRecommendations,
          hasWebSearchData: !!webSearchData,
          hasDbNewsData: !!newsData,
        },
        dataQuality: {
          aiGenerated: true,
          sourceCount: sourceCount || ((newsData ? 1 : 0) + (webSearchData ? 1 : 0)),
        },
      });

      if (reportContent.length < 200) {
        throw new Error('التقرير المُنشأ قصير جداً أو فارغ');
      }

      // V142: Generate a UNIQUE subtitle that is NEVER a copy of the executive summary.
      // The subtitle appears below the title on the report page. If it's the same
      // as the executive summary, the reader sees duplicate content immediately.
      // Strategy: Build from topic + context section + metadata — NOT from executive summary.
      const summary = (() => {
        // Primary: Use the CONTEXT section (section 2) — it's always different from executive summary
        const contextSection = structuredSections.context || '';
        if (contextSection && contextSection.length > 30) {
          // Extract the first meaningful sentence from context
          const cleaned = contextSection.replace(/^[#\-\*\s]+/gm, '').trim();
          const firstSentenceMatch = cleaned.match(/^[^.!؟\n]+[.!؟]/);
          if (firstSentenceMatch && firstSentenceMatch[0].length > 20) {
            return firstSentenceMatch[0].trim();
          }
          // Fallback: first 150 chars of context at word boundary
          const truncated = cleaned.slice(0, 150);
          const lastSpace = truncated.lastIndexOf(' ');
          return (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated).trim();
        }

        // Secondary: Build a descriptive sentence from the report metadata
        const regionLabel = region.includes('عرب') ? 'العالم العربي' : region.includes('عالم') ? 'النطاق العالمي' : region;
        const sectorsLabel = sectors.length > 0 ? sectors.slice(0, 3).join('، ') : 'اقتصاد كلي';
        const metaDescription = `تقرير استراتيجي يحلل تداعيات ${topic.trim()} على ${regionLabel} مع التركيز على ${sectorsLabel}`;
        return metaDescription;
      })();

      // Determine market impact from full markdown content
      let marketImpact: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      const bullKeywords = ['صعود', 'ارتفاع', 'نمو', 'استفادة', 'فرص', 'إيجاب'];
      const bearKeywords = ['هبوط', 'انخفاض', 'تراجع', 'تضرر', 'مخاطر', 'سلبي'];
      const bullCount = bullKeywords.filter(k => fullMarkdown.includes(k)).length;
      const bearCount = bearKeywords.filter(k => fullMarkdown.includes(k)).length;
      if (bullCount > bearCount + 2) marketImpact = 'bullish';
      else if (bearCount > bullCount + 2) marketImpact = 'bearish';

      // V99: Generate ASCII-only slug to avoid URL encoding issues with Arabic characters
      // Previous format "strategic-تداعيات-..." caused 404 because Next.js URL-encodes
      // Arabic characters in dynamic routes, making DB slug lookup fail.
      // New format: "strategic-report-{nanoid}" — always ASCII, always works.
      const slugSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const slug = `strategic-report-${slugSuffix}`;

      // Save to database
      const savedReport = await db.economicReport.create({
        data: {
          title: `تقرير استراتيجي: ${topic.trim()}`,
          slug,
          locale: 'ar',  // V337: Strategic reports are Arabic
          summary,
          content: reportContent,
          reportType: 'strategic',
          scope: region.includes('عرب') ? 'arabic' : region.includes('عالم') ? 'global' : 'regional',
          sectors: JSON.stringify(sectors),
          countries: JSON.stringify([region]),
          keyIndicators: JSON.stringify({ topic, region, sectors, scenarios }),
          marketImpact,
          confidenceScore: Math.round(confidenceScore),
          isPublished: publish && confidenceScore >= 40,  // V134: Confidence gate — don't auto-publish below 40
          publishedAt: publish && confidenceScore >= 40 ? new Date() : null,
        },
      });

      job.status = 'completed';
      job.completedAt = Date.now();
      job.result = {
        id: savedReport.id,
        title: savedReport.title,
        slug: savedReport.slug,
      };

      console.log(`[StrategicReport] Job ${jobId} completed in ${Date.now() - job.startedAt}ms — ${fullMarkdown.length} chars, ${sectionCount} sections, رؤى=${!!structuredSections.rouaRecommendations} (V133)`);
    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = Date.now();
      job.error = error.message;
      console.error(`[StrategicReport] Job ${jobId} failed:`, error.message);
    }
  })();

  generationPromise.catch(err => console.error('[StrategicReports V156] Strategic report generation failed:', err instanceof Error ? err.message : err)); // Prevent unhandled rejection

  // Clean up old jobs
  if (strategicJobs.size > 30) {
    const sortedKeys = [...strategicJobs.keys()].sort();
    for (let i = 0; i < strategicJobs.size - 30; i++) {
      strategicJobs.delete(sortedKeys[i]);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'تم بدء توليد التقرير الاستراتيجي',
    jobId,
    status: 'pending',
    checkStatusUrl: `/api/reports/strategic?jobId=${jobId}`,
  }, { status: 202 });
}

// ─── GET: Check Job Status ──────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const listReports = searchParams.get('list') === 'true';

  if (jobId) {
    const job = strategicJobs.get(jobId);
    if (!job) {
      return NextResponse.json({ error: 'وظيفة غير موجودة', jobId }, { status: 404 });
    }
    return NextResponse.json({
      jobId: job.id,
      topic: job.topic,
      status: job.status,
      duration: job.completedAt ? job.completedAt - job.startedAt : Date.now() - job.startedAt,
      result: job.result,
      error: job.error,
    });
  }

  // List recent strategic reports from DB
  if (listReports) {
    try {
      const reports = await db.economicReport.findMany({
        where: { reportType: 'strategic', locale: 'ar' },  // V337: Arabic strategic reports only
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          scope: true,
          marketImpact: true,
          confidenceScore: true,
          isPublished: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ reports });
    } catch (error: any) {
      return NextResponse.json({ reports: [], error: error.message });
    }
  }

  // Default: list recent jobs
  const jobs = [...strategicJobs.values()].slice(-10).reverse();
  return NextResponse.json({ recentJobs: jobs });
}
