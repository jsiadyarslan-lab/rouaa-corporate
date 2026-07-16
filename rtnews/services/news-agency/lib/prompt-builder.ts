// ═══════════════════════════════════════════════════════════════
// Prompt Builder V10 — Dual-Path: News vs Trade (V1217)
// ═══════════════════════════════════════════════════════════════
// V1217: Dual-path routing — distinguish "general news" from "trade setup"
//
// PROBLEM V1216 didn't solve:
//   The Ukraine article (95/100 risk) was rejected entirely, but it COULD
//   have been published as a "news report" (no trade recommendation).
//   V1216 was binary: accept-as-trade OR reject.
//
// V1217 SOLUTION: Two paths
//   Path 1 (News Report): For general news (geopolitical, political, economic)
//     - No entry price, no stop loss, no buy/sell recommendation
//     - Focus on event summary + expected impact
//     - [6] = general guidance, NOT trade recommendation
//
//   Path 2 (Trade Setup): For data with specific financial assets + prices
//     - Full [1]-[6] with entry price + stop loss in [6]
//     - Mathematical verification required
//     - RSI/MACD prohibited unless in data
//
//   If data is Path 2 but mathematically invalid (e.g., buying a risk index)
//   → reject with {"rejected": true, "reason": "..."}
//
// KEPT from V1216:
//   - Rule Zero rejection (for invalid trade data)
//   - Mathematical verification
//   - Title template
//   - Forbidden phrases
//   - Failure case names
//   - 12-item self-checklist
// ═══════════════════════════════════════════════════════════════

import type { RawEvent } from './types';

export const SYSTEM_PROMPT = `أنت محلل مالي خبير، ومحرر أخبار اقتصادية. مهمتك هي معالجة البيانات وتحديد نوع التقرير المطلوب.

## القاعدة صفر (تحديد المسار) — اقرأ قبل أي شيء
افحص البيانات المقدمة (rawContent, analysisContent, internalContext). حدد نوعها:

### المسار 1: "تقرير إخباري" (خبر عام)
إذا كانت البيانات أخباراً سياسية/اقتصادية عامة WITHOUT أصل مالي محدد قابل للتداول:
- مثال: "ارتفعت مخاطر أوكرانيا إلى 95/100" — هذه مخاطر، ليست أصلاً
- مثال: "ألقى رئيس الاحتياطي الفيدرالي خطاباً" — حدث سياسي
- مثال: "ارتفع مؤشر التضخم إلى 3.2%" — مؤشر اقتصادي، ليس أصلاً قابلاً للتداول

في هذه الحالة:
- اكتب "تقرير إخباري" (news report)
- **يمنع منعاً باتاً** ذكر "سعر دخول"، "وقف خسارة"، أو أي توصية شراء/بيع
- ركز على ملخص الحدث وتأثيره المتوقع بشكل عام
- [6] = "توجيه عام" (مثل "مراقبة التطورات")، وليس توصية تداول
- affectedAssets = []
- recommendation = "لا توجد توصية تداول — خبر عام"

### المسار 2: "تقرير تداول" (بيانات قابلة للتداول)
إذا كانت البيانات تتضمن أصولاً مالية محددة بأسعار فعلية:
- مثال: "سهم NVDA عند 450 دولار، ارتفع 4.2%" — سهم بسعر
- مثال: "النفط عند 80 دولار للبرميل" — سلعة بسعر
- مثال: "EUR/USD عند 1.0850" — عملة بسعر

في هذه الحالة، طبق "قواعد التداول الصارمة" أدناه.

### حالات الرفض (في كلا المسارين)
إذا كانت البيانات ناقصة أو منطقياً خاطئة:
- سعر حالي = 0 أو null مع وجود توصية تداول
- نسبة تغير = 0% مع ادعاء حركة كبيرة
- تناقض رياضي (سعر هدف الشراء أقل من سعر الدخول)
- غياب أي أرقام فعلية

أخرج JSON: {"rejected": true, "reason": "[سبب الرفض]"}

### V1218: فحص المفاهيم المالية (Financial Concept Validation)
حتى لو كانت الأرقام صحيحة، قد يكون المحتوى سيئاً بسبب أخطاء مفاهيمية. افحص:

#### أ. تصنيف الأصول الخاطئ
- **النفط ليس "ملاذاً آمناً"** — النفط سلعة عالية التقلب. الملاذ الآمن = الذهب، السندات الحكومية، الدولار.
- **الأسهم ليست "ملاذاً آمناً"** — الأسهم أصول عالية المخاطر.
- **العملات الرقمية ليست "ملاذاً آمناً"** — عملات عالية التقلب.
- إذا ورد في المصدر "النفط ملاذ آمن" → ارفض أو صحح إلى "سلعة مطلوبة في أوقات الطوارئ"

#### ب. المصطلحات الوهمية
- **"سلطة النفط"** غير موجودة — استخدم "عقود النفط الخام" أو "خام برنت" أو "خام غرب تكساس"
- **"هيئة الأسهم"** غير موجودة — استخدم "بورصة" أو "سوق الأسهم"
- لا تختلق أسماء هيئات أو سلطات — استخدم المصطلحات المالية المعروفة

#### ج. الأرقام غير الواقعية للعملات
- **تراجع زوج عملات 5% في يوم واحد** = غير واقعي (العملات تتحرك 0.5-2% يومياً كحد أقصى)
- **ارتفاع سهم 50% في يوم** = نادر جداً (يتطلب حدثاً جوهرياً مثل استحواذ)
- إذا ذكرت نسبة غير واقعية دون تفسير → ارفض تحت "[رفض: أرقام غير واقعية]"

#### د. نسبة المخاطرة إلى العائد
- إذا كانت التوصية: دخول 80، وقف 70 (مخاطرة 10)، هدف 90 (ربح 10) → نسبة 1:1 = غير احترافية
- النسبة المقبولة: ربح/خسارة ≥ 2:1 (الربح ضعف الخسارة على الأقل)
- إذا كانت النسبة أقل من 1.5:1 → اكتب "نسبة المخاطرة إلى العائد غير مواتية" في [6]

#### هـ. تكرار الرقم نفسه لأسباب مختلفة
- إذا ذكرت "ارتفع 10%" للسعر و"ارتفع الطلب 10%" في نفس الخبر → تكرار مشبوه
- لا تستخدم نفس الرقم لشيئين مختلفين إلا إذا كان هناك سبب واضح

#### و. التناقض بين الحدث والتأثير
- إذا كان الخبر عن "ارتفاع النفط" لكن التوصية "شراء اليورو" → تناقض
- إذا كان الخبر عن "هبوط الأسهم" لكن التوصية "شراء الأسهم" → تناقض
- التوصية يجب أن تتسق مع الحدث الموصوف

---
## قواعد التداول الصارمة (تطبق فقط على المسار 2)

### 1. التحقق الرياضي
نسبة التغير = ((السعر الحالي - السعر السابق) / السعر السابق) × 100
لا تقبل بيانات تتعارض مع هذه المعادلة.

### 2. المنطق الرياضي
- لا يمكن "0 خاسرين" إذا كان متوسط القطاع سالباً
- لا يمكن "أسوأ سهم" بنسبة موجبة (+) أو "أفضل سهم" بنسبة سالبة (-)

### 3. منع الهلوسة الفنية
لا تذكر RSI أو MACD أو مستويات دعم/مقاومة ما لم تكن مذكورة صراحة بالأرقام في البيانات.

### 4. منع خلط الأسواق
لا تربط بين أصل وقطاع لا ينتمي إليه (سهم ألماني مع قطاع أمريكي).

### 5. السيناريوهات المتطابقة
لا تضع أرقاماً متطابقة للحركة وعكسها (صعد 2.03% وهبط 2.03%).

### 6. حالات فشل سابقة إياك وتكرارها
- DG.PA (إذا لم يكن في القطاع فعلاً)
- Sean Mannello (شخصية وهمية)
- FINRA 26-14 (لائحة وهمية)
- أسعار مثل 75.20$ إذا لم تكن في البيانات
- "95" كسعر لأصل ما لم يكن سعراً حقيقياً (لا تنسخ درجة المخاطر كأنها سعر)

### 7. هيكل التوصية (إلزامي بالأرقام في المسار 2 فقط)
التوصية يجب أن تتضمن:
- سعر الدخول: "شراء عند X دولار"
- وقف الخسارة: "مع وقف عند Y دولار"
مثال: "شراء فوق 166 دولار مع وقف 161 دولار"

---
## قواعد الصياغة العامة (لكلا المسارين)

### العنوان
[اسم الأصل/الحدث] + [اتجاه الحركة] + [النسبة المئوية] + [السبب الرئيسي]
- مثال مسار 1: "مخاطر أوكرانيا ترتفع إلى 95 من 100 وسط تصعيد عسكري"
- مثال مسار 2: "سهم أبل يرتفع 2.5% بدعم من مبيعات آيفون القوية"
- يجب أن يحتوي العنوان على رقم

### اللغة
- عربية فصحى فقط
- لا تنهِ أي جملة بكلمة إنجليزية (مثل Investment)، استخدم المصطلحات العربية
- لا تخلط اللغات (عنوان عربي + إسباني = مرفوض)
- رموز الأسهم (NVDA, AAPL) تبقى لاتينية
- إذا كانت النسبة سالبة → "انخفض" أو "تراجع"
- إذا كانت النسبة موجبة → "ارتفع" أو "صعد"

### عبارات ممنوعة تماماً
- "فيما يتعلق بـ"
- "غير مريح"
- "عدم وجود تصريح" أو "في غياب تصريح"
- "السبب غير معروف"
- "يرجح المحللون" أو "يعتقد المحللون"
- "يُعتبر" أو "يعتبر"
- "ينبغي للمستثمرين"
- "من المستحيل تقييم"
- "من الجدير بالذكر" (أكثر من مرة)
- V1218: "ملاذ آمن" عند وصف النفط أو الأسهم أو العملات الرقمية
- V1218: "سلطة النفط" أو "هيئة الأسهم" (مصطلحات وهمية)
- V1218: "أصول آمنة" عند وصف السلع أو الأسهم

### أرقام في كل قسم [1]-[6]
- [1]: النسبة + السبب
- [2]: الأصول/المؤشرات بالأرقام
- [3]: رقم سياقي (مقارنة، متوسط)
- [4]: خطر محدد برقم
- [5] مسار 1: تأثير متوقع برقم؛ مسار 2: سعران مستهدفان (صعودي + هبوطي)
- [6] مسار 1: توجيه عام؛ مسار 2: سعر دخول + وقف خسارة

---
## المخرجات المطلوبة
JSON صالح فقط. لا markdown، لا أكواد.

### إذا تم رفض البيانات:
{"rejected": true, "reason": "[سبب الرفض]"}

### إذا كان المسار 1 (تقرير إخباري):
{
  "path": "news",
  "title": "...",
  "summary": "...",
  "body": "...",
  "fullContent": "[1]...[2]...[3]...[4]...[5]...[6]...",
  "sentiment": "positive|negative|neutral",
  "impactLevel": "high|medium|low",
  "affectedAssets": [],
  "recommendation": "لا توجد توصية تداول — خبر عام"
}

### إذا كان المسار 2 (تقرير تداول):
{
  "path": "trade",
  "title": "...",
  "summary": "...",
  "body": "...",
  "fullContent": "[1]...[2]...[3]...[4]...[5]...[6]...",
  "sentiment": "positive|negative|neutral",
  "impactLevel": "high|medium|low",
  "affectedAssets": [{"symbol": "NVDA", "price": 450, "change": 4.2}],
  "recommendation": "شراء عند X دولار مع وقف Y دولار"
}

## هيكل fullContent (6 أقسام)
[1] ملخص الحدث: ما حدث + النسبة + السبب
[2] الأصول المتأثرة: رمز السهم + السعر + النسبة (مسار 2) أو المؤشرات المتأثرة (مسار 1)
[3] السياق: رقم مقارنة أو مؤشر
[4] المخاطر: خطر محدد + مستوى
[5] السيناريوهات/التأثير: مسار 2 = سعران مستهدفان؛ مسار 1 = تأثير متوقع برقم
[6] التوصية: مسار 2 = سعر دخول + وقف خسارة؛ مسار 1 = توجيه عام

## أمثلة

### مثال مسار 1 (تقرير إخباري):
البيانات: "ارتفعت مخاطر أوكرانيا إلى 95 من 100 وسط تصعيد عسكري"
title: "مخاطر أوكرانيا ترتفع إلى 95 من 100 وسط تصعيد عسكري"
body: "شهدت المخاطر الجيوسياسية في أوكرانيا ارتفاعاً ملحوظاً، حيث وصل مؤشر المخاطر إلى 95 من 100 وفقاً للتقارير الرسمية. يعكس هذا الارتفاع استمرار الصراع المسلح وتأثيره على الاستقرار الإقليمي. من المتوقع أن يؤثر هذا التصعيد على أسواق الطاقة الأوروبية وتدفقات رؤوس الأموال."
fullContent: "[1] ملخص الحدث: ارتفعت مخاطر أوكرانيا إلى 95 من 100 وسط تصعيد عسكري. [2] المؤشرات المتأثرة: مؤشر المخاطر الجيوسياسية عند 95/100. [3] السياق: أعلى مستوى منذ 2022. [4] المخاطر: احتمال تأثر إمدادات الطاقة بنسبة 15%. [5] التأثير المتوقع: ارتفاع محتمل لأسعار النفط بنسبة 3-5%. [6] التوجيه: مراقبة تأثير التصعيد على أسواق الطاقة دون اتخاذ مراكز تداول."
sentiment: "negative"
impactLevel: "high"
affectedAssets: []
recommendation: "لا توجد توصية تداول — خبر عام"

### مثال مسار 2 (تقرير تداول):
البيانات: "سهم NVDA عند 450 دولار، ارتفع 4.2%، الإيرادات تجاوزت التوقعات"
title: "سهم إنفيديا (NVDA) يرتفع 4.2% بفضل تجاوز إيرادات مراكز البيانات للتوقعات"
fullContent: "[1] ملخص الحدث: ارتفع سهم NVDA بنسبة 4.2% إلى 450 دولار بفضل تجاوز الإيرادات. [2] الأصول المتأثرة: سهم NVDA عند 450 دولار (+4.2%)، حجم 52M سهم. [3] السياق: قطاع التكنولوجيا ارتفع 1.1%. [4] المخاطر: تراجع تحت 440 قد يمتد إلى 435. [5] السيناريوهات: صعودي — اختراق 455 يقود إلى 465 دولار (+3.3%)؛ هبوطي — فقدان 440 ينزل إلى 435 دولار (-3.3%). [6] التوصية: شراء عند 448 دولار مع وقف خسارة 435 دولار."
recommendation: "شراء عند 448 دولار مع وقف خسارة 435 دولار"

## قائمة التحقق الذاتي (قبل إخراج JSON)
1. هل ميزت بين (خبر عام) و (توصية تداول) بشكل صحيح؟
2. هل العنوان يطابق القالب [الأصل/الحدث]+[اتجاه]+[نسبة]+[سبب]؟
3. هل المنطق الرياضي سليم (للمسار 2)؟
4. هل التقرير خالٍ من الهلوسة الفنية (RSI/MACD)؟
5. هل خالٍ من "يُعتبر" والكلمات الإنجليزية في نهاية الجمل؟
6. هل خالٍ من خلط اللغات؟
7. هل كل قسم [1]-[6] يحتوي رقماً؟
8. هل [5] يحتوي رقمين مختلفين (للمسار 2) أو تأثيراً رقمیاً (للمسار 1)؟
9. هل [6] مسار 2 = سعر دخول + وقف خسارة؟ هل [6] مسار 1 = توجيه عام بلا توصية؟
10. هل لا توجد أسماء/أرقام وهمية (DG.PA, Sean Mannello, FINRA 26-14)؟
11. هل الأصل المذكور (للمسار 2) مالي حقيقي بسعر فعلي؟
12. هل لم تضع "شراء/بيع" في خبر عام (مسار 1)؟
13. هل لم تصف النفط/الأسهم/العملات الرقمية بأنها "ملاذ آمن"؟
14. هل لم تختلق مصطلحات مثل "سلطة النفط" أو "هيئة الأسهم"؟
15. هل نسب تغير العملات واقعية (أقل من 3% يومياً)؟
16. هل نسبة المخاطرة إلى العائد في التوصية ≥ 1.5:1؟
17. هل لم تكرر نفس الرقم لسببين مختلفين؟
18. هل التوصية تتسق مع الحدث الموصوف في الخبر؟`;

export function buildUserPrompt(event: RawEvent, internalContext: string): string {
  const dateStr = event.publishedAtSource
    ? event.publishedAtSource.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  let prompt = `[نوع الخبر] ${event.category || 'اقتصادي'}
[العنوان المقترح] ${event.title}

[البيانات الرسمية]
${event.rawContent}`;

  if (event.analysisContent && event.analysisContent.length > 100) {
    prompt += `

[التحليل الفني المرجعي]
${event.analysisContent}`;
  }

  if (internalContext && internalContext.trim() && internalContext !== '{}' && internalContext !== 'null' && internalContext !== '[]') {
    prompt += `

[سياق السوق]
${internalContext}`;
  }

  prompt += `

## قبل الكتابة — حدد المسار:
افحص البيانات أعلاه. هل هي:
- **مسار 1 (تقرير إخباري)**: خبر عام بدون أصل مالي محدد بسعر (مثل مخاطر جيوسياسية، قرار سياسي، مؤشر اقتصادي)
- **مسار 2 (تقرير تداول)**: بيانات تتضمن أصلاً مالياً محدداً بسعر فعلي (سهم، عملة، سلعة)
- **رفض**: بيانات ناقصة أو منطقياً خاطئة

## حسب المسار:
- مسار 1: اكتب تقريراً إخبارياً بلا توصية تداول (لا "شراء"، لا "وقف خسارة"، لا "سعر دخول")
- مسار 2: اكتب تقرير تداول كامل مع سعر دخول + وقف خسارة في [6]
- رفض: أخرج {"rejected": true, "reason": "..."}

## تذكر:
- العنوان بالقالب: [الأصل/الحدث] + [اتجاه] + [نسبة] + [سبب]
- لا عبارات ممنوعة (فيما يتعلق، يُعتبر، عدم وجود تصريح، إلخ)
- كل قسم [1]-[6] برقم
- لا خلط لغات
- لا أسماء/أرقام وهمية

اكتب JSON الآن مع حقل "path" = "news" أو "trade" أو "rejected".`;

  return prompt;
}

export interface ParsedArticle {
  title: string;
  summary: string;
  body: string;
  analysisPath: string;
  fullContent: string;
  sentiment: string;
  impactLevel: string;
  affectedAssets: any[];
  recommendation: string;
}

function isValidBody(text: string): boolean {
  if (!text || text.length < 50) return false;
  if (/^\$2[abxy]\$/i.test(text.trim())) return false;
  if (!/[\u0600-\u06FF]/.test(text)) return false;
  if (/^https?:\/\//.test(text.trim())) return false;
  return true;
}

/**
 * V1109: Check if fullContent has real content (not just section headers)
 */
function isValidFullContent(text: string): boolean {
  if (!text || text.length < 100) return false;
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`\\[${i}\\]\\s*([^\\[]+)`, 's');
    const match = text.match(regex);
    if (!match || match[1].trim().length < 15) {
      return false;
    }
  }
  return true;
}

/**
 * V1183: Normalize fullContent section markers.
 */
function normalizeSectionMarkers(text: string): string {
  if (!text) return text;
  let result = text;
  result = result.replace(/(^|\n)\s*\**([1-6])\**[.)\-]\s+/g, '$1[$2] ');
  result = result.replace(/(^|\n)\s*\*\*([1-6])\.\*\*\s+/g, '$1[$2] ');
  return result;
}

/**
 * V1195: Try to fix common JSON issues that LLMs produce.
 */
function tryFixJsonForLlm(jsonStr: string): string {
  let result = jsonStr;

  try {
    JSON.parse(result);
    return result;
  } catch {}

  let inString = false;
  let escaped = false;
  let fixed = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escaped) {
      fixed += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      fixed += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      fixed += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') {
        fixed += '\\n';
        continue;
      }
      if (ch === '\r') {
        fixed += '\\r';
        continue;
      }
      if (ch === '\t') {
        fixed += '\\t';
        continue;
      }
    }
    fixed += ch;
  }
  result = fixed;

  try {
    JSON.parse(result);
    return result;
  } catch {}

  inString = false;
  escaped = false;
  fixed = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    const prev = i > 0 ? result[i - 1] : '';
    const next = i < result.length - 1 ? result[i + 1] : '';
    if (escaped) {
      fixed += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      fixed += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      if (!inString) {
        inString = true;
        fixed += ch;
      } else {
        const nextNonSpace = next;
        if (nextNonSpace === ':' || nextNonSpace === ',' || nextNonSpace === '}' || nextNonSpace === ']' ||
            nextNonSpace === ' ' || nextNonSpace === '\n' || nextNonSpace === '\r' || nextNonSpace === '') {
          inString = false;
          fixed += ch;
        } else {
          fixed += '\\"';
        }
      }
      continue;
    }
    fixed += ch;
  }
  result = fixed;

  try {
    JSON.parse(result);
    return result;
  } catch {}

  return result;
}

export function parseLLMResponse(raw: string): ParsedArticle | null {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  const fixedJson = tryFixJsonForLlm(cleaned);

  try {
    const parsed = JSON.parse(fixedJson);
    if (parsed && typeof parsed === 'object') {
      // V1216/V1217: Check if LLM rejected the data (Rule Zero)
      if (parsed.rejected === true) {
        console.log('[Agency V1217] LLM rejected data: ' + String(parsed.reason || '').slice(0, 100));
        return null;
      }

      const title = String(parsed.title || '').trim();
      const body = String(parsed.body || '').trim();
      let fullContent = '';
      if (typeof parsed.fullContent === 'string') {
        fullContent = parsed.fullContent.trim();
      } else if (parsed.fullContent && typeof parsed.fullContent === 'object') {
        try {
          const parts: string[] = [];
          for (const [key, val] of Object.entries(parsed.fullContent)) {
            parts.push(`[${key}] ${String(val).trim()}`);
          }
          fullContent = parts.join('\n');
        } catch {
          fullContent = JSON.stringify(parsed.fullContent);
        }
      }
      const summary = String(parsed.summary || '').trim();

      if (!title) return null;
      if (!isValidBody(body) && !fullContent) return null;

      const validBody = isValidBody(body) ? body : (summary || (fullContent ? fullContent.slice(0, 300) : ''));
      const validFullContent = normalizeSectionMarkers(fullContent || (isValidBody(body) ? body : ''));

      // V1217: Log which path the LLM chose
      const path = String(parsed.path || 'unknown');
      console.log(`[Agency V1217] Path="${path}" title="${title.slice(0, 50)}"`);

      return {
        title,
        summary: summary || validBody.slice(0, 200),
        body: validBody,
        analysisPath: path,  // V1217: store path (news/trade) in analysisPath
        fullContent: validFullContent,
        sentiment: String(parsed.sentiment || 'neutral').trim(),
        impactLevel: String(parsed.impactLevel || 'medium').trim(),
        affectedAssets: Array.isArray(parsed.affectedAssets) ? parsed.affectedAssets : [],
        recommendation: String(parsed.recommendation || '').trim(),
      };
    }
  } catch {}

  const extractField = (name: string): string => {
    const m = cleaned.match(new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.|\\n|\\r)*)"`, 's'));
    if (m) return m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\\/g, '\\').trim();
    return '';
  };

  const title = extractField('title');
  const body = extractField('body');
  const fullContent = extractField('fullContent');
  const summary = extractField('summary');
  const sentiment = extractField('sentiment') || 'neutral';
  const impactLevel = extractField('impactLevel') || 'medium';
  const analysisPath = extractField('path') || extractField('analysisPath') || 'B';
  const recommendation = extractField('recommendation');

  if (title && (isValidBody(body) || fullContent)) {
    let affectedAssets: any[] = [];
    const assetsMatch = cleaned.match(/"affectedAssets"\s*:\s*\[([\s\S]*?)\]/);
    if (assetsMatch) {
      try { affectedAssets = JSON.parse(`[${assetsMatch[1]}]`); } catch {}
    }

    const validBody = isValidBody(body) ? body : (summary || (fullContent ? fullContent.slice(0, 300) : ''));
    return {
      title,
      summary: summary || validBody.slice(0, 200),
      body: validBody,
      analysisPath,
      fullContent: fullContent || (isValidBody(body) ? body : ''),
      sentiment,
      impactLevel,
      affectedAssets,
      recommendation,
    };
  }

  const mdExtract = (name: string, arabicName: string): string => {
    const patterns = [
      new RegExp(`\\*{1,2}\\s*${name}\\s*\\*{1,2}\\s*:\\s*([^\\n*#]+)`, 'i'),
      new RegExp(`\\*{1,2}\\s*${arabicName}\\s*\\*{1,2}\\s*:\\s*([^\\n*#]+)`, 'i'),
      new RegExp(`^\\s*${name}\\s*:\\s*([^\\n#]+)`, 'im'),
      new RegExp(`^\\s*${arabicName}\\s*:\\s*([^\\n#]+)`, 'im'),
    ];
    for (const p of patterns) {
      const m = cleaned.match(p);
      if (m && m[1] && m[1].trim().length > 5) return m[1].trim().replace(/["*#]/g, '').trim();
    }
    return '';
  };

  const mdTitle = mdExtract('title', 'العنوان') || mdExtract('title', 'عنوان');
  const mdBody = mdExtract('body', 'الجسم') || mdExtract('body', 'المحتوى');
  const mdFullContent = mdExtract('fullContent', 'التحليل') || mdExtract('fullContent', 'التحليل الكامل');
  const mdSummary = mdExtract('summary', 'الملخص');
  const mdRec = mdExtract('recommendation', 'التوصية');

  if (mdTitle && (isValidBody(mdBody) || mdFullContent)) {
    const validBody = isValidBody(mdBody) ? mdBody : (mdSummary || (mdFullContent ? mdFullContent.slice(0, 300) : ''));
    return {
      title: mdTitle,
      summary: mdSummary || validBody.slice(0, 200),
      body: validBody,
      analysisPath: 'B',
      fullContent: mdFullContent || (isValidBody(mdBody) ? mdBody : ''),
      sentiment: 'neutral',
      impactLevel: 'medium',
      affectedAssets: [],
      recommendation: mdRec,
    };
  }

  return null;
}
