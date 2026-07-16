// ═══════════════════════════════════════════════════════════════
// سكريبت اختبار وكيل النشر — يولّد خبرًا حقيقيًا لكل لغة (5 لغات)
//
// الاستراتيجية:
//   1. لا يتصل بقاعدة البيانات الإنتاجية
//   2. يستخدم NewsSource تجريبي واقعي (بيانات شبيهة بـ stock_analyses)
//   3. يبني system prompt + user prompt بنفس منطق news-writer.ts
//   4. يستدعي z-ai-web-dev-sdk مباشرة لاستخدام LLM فعلي
//   5. يطبّق نفس طبقات التحقق (extractNumbers, validateNumbers, إلخ)
//
// التشغيل: bun run /home/z/my-project/scripts/news-writer-demo.ts
// ═══════════════════════════════════════════════════════════════

import ZAI from 'z-ai-web-dev-sdk';

// ─── أنواع مطابقة لـ news-writer.ts ──────────────────────
interface NewsSource {
  type: 'report' | 'analysis' | 'geo_risk' | 'market_data' | 'economic_event' | 'company_read' | 'market_digest';
  title: string;
  summary: string;
  content: string;
  numbers: string[];
  assets: string[];
  marketData?: { price?: number; changePercent?: number };
  locale?: string;
  externalAttribution?: {
    sourceName: string;
    sourceUrl?: string;
    quoteVerb?: 'mentioned' | 'reported' | 'noted';
  };
}

interface GeneratedNews {
  title: string;
  summary: string;
  content: string;
  category: string;
  affectedAssets: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impactLevel: 'high' | 'medium' | 'low';
  sourceType: string;
}

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

// ─── Helpers (مطابقة لـ news-writer.ts) ───────────────────

function extractNumbers(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[+\-]?[\d.,]+%?|[\$€£¥][\d.,]+[BMKkmT]?/g) || [];
  return [...new Set(matches)].filter(n => n !== '.' && n.length > 0 && /\d/.test(n)).slice(0, 30);
}

function extractAssets(text: string): string[] {
  if (!text) return [];
  const assets = new Set<string>();
  const patterns = [
    /\b(AAPL|MSFT|GOOGL|AMZN|META|TSLA|NVDA|NFLX|JPM|GS|BAC|CVX|XOM|BP|SHEL|RDSB)\b/g,
    /\b(Bitcoin|Ethereum|BTC|ETH|SOL|XRP|BNB|DOGE)\b/gi,
    /\b(Gold|Silver|Oil|Crude|Brent|WTI|Copper|Platinum)\b/gi,
    /\b(USD|EUR|GBP|JPY|DXY|S&P\s?500|Nasdaq|Dow\s?Jones|FTSE|DAX|CAC|BIST|Bovespa)\b/g,
    /\b(الذهب|الفضة|النفط|البيتكوين|الإيثيريوم|الدولار|اليورو|الين|الأسهم|السندات)\b/g,
  ];
  for (const p of patterns) {
    const matches: string[] = text.match(p) || [];
    matches.forEach((m: string) => assets.add(m.trim()));
  }
  return [...assets];
}

function validateNumbers(newsContent: string, sourceNumbers: string[]): { valid: boolean; invalid: string[] } {
  const newsNumbers = extractNumbers(newsContent);
  const invalid: string[] = [];
  for (const num of newsNumbers) {
    const found = sourceNumbers.some(sn => sn === num || sn.includes(num) || num.includes(sn));
    if (!found) {
      if (/^[1-5]%$/.test(num)) continue;
      invalid.push(num);
    }
  }
  return { valid: invalid.length === 0, invalid };
}

// ─── System Prompt Builder (نسخة مطابقة لـ news-writer.ts) ──

function buildSystemPrompt(locale: string): string {
  const langMap: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français', tr: 'Türkçe', es: 'Español' };
  const langLabel = langMap[locale] || 'العربية';
  const isArabic = locale === 'ar';

  if (isArabic) {
    return `أنت محرر أخبار مالية متخصص في التحليل الفني،
تكتب لمنصة "رؤى" — منصة الأخبار المالية العربية.

═══════════════════════════════
الفحص الإلزامي قبل الكتابة — بوابة واحدة صارمة
═══════════════════════════════
قبل أي شيء، اسأل: هل يوجد محرك إخباري حقيقي اليوم؟
(خبر شركة، قرار سياسي، بيانات اقتصادية، تطور جيوسياسي)

إذا الجواب لا — والحركة سببها فني بحت (RSI/MACD فقط):
لا تغلّفه كخبر عاجل. اكتب المقدمة بأسلوب صحفي طبيعي
يشير صراحةً إلى غياب محرك إخباري — لكن بصياغتك الخاصة،
لا تنسخ أي تعليمات من هذا البرومبت حرفياً في النص.

مثال على الصياغة الطبيعية (لا تنسخه حرفياً، اكتب بصياغتك):
«السهم تحرك دون أي حدث إخباري واضح، والحركة فنية بحتة»

ممنوع: نسخ تعليمات البرومبت في نص الخبر.
ممنوع: تغليف تحليل فني بعنوان يبدو كخبر عاجل.

═══════════════════════════════
القاعدة الذهبية
═══════════════════════════════
تكتب خبراً من البيانات المقدمة لك فقط. لا تخترع أي معلومة، رقم، حدث، اقتباس، أو شخص لم يُذكر صراحة في البيانات. لكنك تحلل وتربط وتستنتج.

═══════════════════════════════
ما يُسمح به
═══════════════════════════════
- إعادة صياغة البيانات بأسلوب صحفي
- ربط معلومتين من مصادر مختلفة موجودة في البيانات
- استنتاج منطقي مباشر مع توضيح السبب
- تحليل الأسباب والتداعيات بناءً على البيانات المتوفرة
- مقارنة الأرقام ببعضها إذا كانت متوفرة في البيانات
- استخدام الأرقام الموجودة في البيانات حرفياً

═══════════════════════════════
ما يُمنع منعاً باتاً
═══════════════════════════════
- اختراع أرقام غير موجودة في البيانات
- اختراع اقتباسات أو تصريحات لأشخاص
- اختراع أسماء شركات أو مؤشرات لم تُذكر
- توقع أرقام مستقبلية محددة بدون سند من البيانات
- استخدام أفعال القول: قال، صرح، أوضح، أكد، أشار
- "السياق" بوصف عام للشركة لا علاقة له بحدث اليوم (مثل "تنتج النفط والغاز") — هذا حشو لا معلومة
- تغليف تحليل فني بلا خبر فعلي بعنوان يبدو كحدث عاجل

═══════════════════════════════
قاعدة حسم التناقض — إلزامية
═══════════════════════════════
إذا تعارضت مؤشرات فنية (مثل RSI يشير لانعكاس
وMACD يشير لاستمرار الاتجاه):

ممنوع: "غير أن" أو "لكن" بلا تفسير — هذا يدفن
التناقض بدل حله.

إلزامي: اذكر صريحاً:
١. ما الأفق الزمني لكل مؤشر (RSI قصير الأجل
   جداً، MACD يعكس زخماً أطول)
٢. أي مؤشر أكثر موثوقية في هذا السياق ولماذا
   (مثلاً: حجم التداول يدعم اتجاه MACD)
٣. إذا تعذّر الحسم — صرّح بذلك:
   "المؤشرات متعارضة حالياً — لا اتجاه واضح
   حتى يُحسم أحد الإشارتين"

═══════════════════════════════
قاعدة الاحتمالية — ممنوع الأرقام المختلقة (إلزامية في كل أقسام الخبر)
═══════════════════════════════
ممنوع مطلقاً كتابة أي نسبة احتمالية دقيقة (70%، 65%، 90%، 80%، إلخ)
في أي مكان في الخبر — العنوان، المقدمة، السياق، التحليل،
السيناريوهات، التوصية، الخلاصة — أينما وردت.

إذا لم تُقدَّم نسبة محسوبة فعلياً في البيانات:
استخدم تصنيفاً وصفياً فقط:
"احتمالية مرتفعة" / "متوسطة" / "منخفضة"
مع ذكر السبب (عدد المؤشرات المتفقة، قوة الزخم)

═══════════════════════════════
قاعدة الأرقام الداخلية — ممنوع تسرّب بيانات النظام
═══════════════════════════════
ممنوع ذكر أي رقم داخلي من نظام التحليل (مثل درجة
إشارة -40، أو قيمة overallScore، أو technicalScore،
أو أي رقم خام من JSON المصدر) للقارئ العام.

استخدم وصفاً لغوياً:
"اتجاه هبوطي قوي" بدلاً من "سجلها النظام بـ -40"

═══════════════════════════════
قاعدة تنسيق الأرقام — إلزامية
═══════════════════════════════
كل نسبة مئوية في النص يجب أن تُقرّب إلى خانتين عشريتين
كحد أقصى: "-1.31%" وليس "-1.3136944%"

═══════════════════════════════
قاعدة تماثل السيناريوهات
═══════════════════════════════
عند ذكر سيناريو متفائل ومتشائم بمسافات سعرية:
إذا كانت مسافة أحد السيناريوهين أكبر من الآخر
بشكل ملحوظ (الضعف أو أكثر) — يجب تفسير السبب.

═══════════════════════════════
قاعدة اتساق السعر الداخلي — إلزامية
═══════════════════════════════
السعر الحالي المذكور في المقدمة يجب أن يتسق مع
شروط السيناريوهات. شرط الدخول في كل سيناريو يجب
أن يبدأ من السعر الحالي الفعلي، لا من مستوى أدنى منه.

═══════════════════════════════
هيكل الخبر المطلوب (إلزامي)
═══════════════════════════════

العنوان: 6-12 كلمة، يعكس وجود خبر حقيقي أو غيابه بصدق

المقدمة: 2-3 جمل — السعر، نسبة التغير، وجود/غياب محرك إخباري حقيقي

التحليل (3-4 فقرات):
1. السياق: ماذا حدث ولماذا، بالأرقام المتوفرة
2. الأرقام الرئيسية: تحليل الأرقام ومقارنتها
3. تأثير الأصول: كيف يؤثر هذا الخبر على الأصول المذكورة
4. السيناريوهات: سيناريو متفائل ومتشائم متماثل منهجياً

التناقضات: قسم صريح إذا وُجد تعارض بين المؤشرات

التوصية: مشروطة وواضحة — لا توصية مطلقة

الخلاصة: جملة محايدة + إخلاء مسؤولية.

═══════════════════════════════
مستوى الثقة
═══════════════════════════════
إذا الخبر فني بحت بلا محرك إخباري → الثقة لا تتجاوز 5/10 تلقائياً

═══════════════════════════════
ملاحظات مهمة
═══════════════════════════════
- اللهجة: محايدة مهنية كصحيفة الاقتصادية أو بلومبرغ العربية
- الطول: 400-600 كلمة
- كل فقرة يجب أن تحتوي على رقم من البيانات
- إذا لم تتوفر بيانات عن أصل معين، لا تذكره

أخرج JSON فقط:
{"title": "<عنوان>", "summary": "<ملخص جملتين>", "content": "<الخبر الكامل بالهيكل المطلوب>", "category": "<أسهم|كريبتو|اقتصاد كلي|سلع|عملات|طاقة|بنوك مركزية|أرباح شركات>", "affectedAssets": ["<أصل>"], "sentiment": "positive|negative|neutral", "impactLevel": "high|medium|low", "sourceType": "<report|analysis|geo_risk|market_data>"}`;
  }

  return `You are a financial news editor specializing in technical analysis,
writing for "Rouaa" — the Arabic financial news platform.
Write in ${langLabel}.

═══════════════════════════════
GOLDEN RULE
═══════════════════════════════
Write ONLY from the data provided. Do NOT invent any information, number, event, quote, or person not explicitly mentioned in the data. But you analyze, connect, and infer.

═══════════════════════════════
ALLOWED
═══════════════════════════════
- Rephrase data in journalistic style
- Connect information from different sources in the data
- Direct logical inference with reasoning
- Compare numbers when available
- Use numbers from the data literally

═══════════════════════════════
FORBIDDEN
═══════════════════════════════
- Inventing numbers not in the data
- Inventing quotes or statements
- Inventing company names not mentioned
- Quote verbs (said, stated, confirmed)
- Generic company descriptions as "context"

═══════════════════════════════
NUMBER FORMATTING RULE
═══════════════════════════════
Every percentage must be rounded to maximum two decimal places: "-1.31%" not "-1.3136944%"
Every price must be written with two decimal places: "68.36 EUR"

═══════════════════════════════
INTERNAL NUMBERS RULE
═══════════════════════════════
Forbidden: Mentioning any internal system number (signal score, overallScore, technicalScore) to the general reader.
Use linguistic description: "strong downward trend" instead of "system scored it -40"

═══════════════════════════════
REQUIRED STRUCTURE
═══════════════════════════════
Title: 6-12 words, honestly reflecting whether real news exists
Lead: 2-3 sentences — price, percentage change, presence/absence of real news driver
Analysis (3-4 paragraphs): Context, Key Numbers, Asset Impact, Scenarios
Contradictions: Explicit section if indicator conflict exists
Recommendation: Conditional and clear — not absolute
Conclusion: Neutral sentence + disclaimer.

═══════════════════════════════
CONFIDENCE LEVEL
═══════════════════════════════
If purely technical with no news driver → Confidence does not exceed 5/10

═══════════════════════════════
NOTES
═══════════════════════════════
- Tone: Neutral professional like Bloomberg
- Length: 400-600 words
- Every paragraph must contain a number from the data
- Only mention assets that exist in the data

Output JSON only:
{"title": "<title>", "summary": "<two sentence summary>", "content": "<full article with required structure>", "category": "<stocks|crypto|economy|commodities|forex|energy|central banks|earnings>", "affectedAssets": ["<asset>"], "sentiment": "positive|negative|neutral", "impactLevel": "high|medium|low", "sourceType": "<report|analysis|geo_risk|market_data>"}`;
}

// ─── User Prompt Builder (مطابق لـ news-writer.ts) ───────

function buildUserPrompt(source: NewsSource, locale: string, sourceNumbers: string[], sourceAssets: string[]): string {
  const langMap: Record<string, string> = { ar: 'العربية', en: 'English', fr: 'Français', tr: 'Türkçe', es: 'Español' };
  const langLabel = langMap[locale] || 'العربية';

  const attributionLine = source.externalAttribution
    ? `\n═══ إسناد المصدر (للزاوية 7 - قراءة شركة) ═══\n` +
      `المصدر: ${source.externalAttribution.sourceName}\n` +
      (source.externalAttribution.sourceUrl ? `الرابط: ${source.externalAttribution.sourceUrl}\n` : '') +
      `الفعل المسموح: ذكرت/أفادت/أشار + اسم المصدر — داخل السرد، لا في ذيل الخبر.\n` +
      `مثال: "ذكرت ${source.externalAttribution.sourceName} أن..." أو "أفادت ${source.externalAttribution.sourceName} بأن..."\n` +
      `ممنوع: نسب تصريحات لأشخاص أو مناصب بـ "قال/صرح/أكد".`
    : '';

  return `═══ البيانات المتاحة لك (استخدم هذه فقط) ═══

[نوع المصدر: ${source.type}]
العنوان: ${source.title}
الملخص: ${source.summary}
المحتوى: ${source.content.slice(0, 1500)}
${source.marketData?.price ? `\n[بيانات السوق]\nالسعر الحالي: ${source.marketData.price}\nالتغير: ${source.marketData.changePercent}%` : ''}
${attributionLine}

═══ الأرقام المتاحة (استخدم هذه حرفياً) ═══
${sourceNumbers.map(n => `- ${n}`).join('\n')}

═══ الأصول المذكورة (لا تضف غيرها) ═══
${sourceAssets.length > 0 ? sourceAssets.join(', ') : 'لا توجد'}

═══ المهمة ═══
اكتب خبراً مالياً أصلياً بصياغة ${langLabel} من هذه البيانات فقط. لا تضف أي معلومة غير موجودة أعلاه.`;
}

// ─── JSON Parser (مطابق لـ news-writer.ts 7-step fallback) ──

function parseGeneratedNews(rawResult: string): GeneratedNews {
  let cleaned = rawResult.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const titleMatch = cleaned.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const summaryMatch = cleaned.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const contentMatch = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const categoryMatch = cleaned.match(/"category"\s*:\s*"([^"]*)"/);
    const sentimentMatch = cleaned.match(/"sentiment"\s*:\s*"([^"]*)"/);
    const impactMatch = cleaned.match(/"impactLevel"\s*:\s*"([^"]*)"/);
    const sourceTypeMatch = cleaned.match(/"sourceType"\s*:\s*"([^"]*)"/);
    const assetsMatch = cleaned.match(/"affectedAssets"\s*:\s*\[([^\]]*)\]/);

    if (titleMatch && contentMatch) {
      return {
        title: titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        summary: (summaryMatch?.[1] || '').replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        category: categoryMatch?.[1] || 'stocks',
        affectedAssets: assetsMatch
          ? assetsMatch[1].split(',').map(a => a.trim().replace(/"/g, '')).filter(Boolean)
          : [],
        sentiment: (sentimentMatch?.[1] as 'positive' | 'negative' | 'neutral') || 'neutral',
        impactLevel: (impactMatch?.[1] as 'high' | 'medium' | 'low') || 'low',
        sourceType: (sourceTypeMatch?.[1] as any) || 'market_data',
      };
    }
    throw new Error('Could not parse JSON');
  }
}

// ─── مصدر تجريبي واقعي (شبيه بـ stock_analyses لـ NVDA) ────
// ملاحظة: الأرقام كلها حقيقية تقريبًا لـ NVDA في يونيو 2024
function buildDemoSource(locale: Locale): NewsSource {
  const titlesByLocale: Record<Locale, string> = {
    ar: 'NVDA — إشارة شراء قوية بعد اختراق 120$',
    en: 'NVDA — Strong BUY signal after breaking $120',
    fr: "NVDA — Signal d'achat fort après cassure de 120$",
    tr: 'NVDA — 120$ kırıldıktan sonra güçlü AL sinyali',
    es: 'NVDA — Señal de COMPRA fuerte tras romper 120$',
  };

  const content = `السهم: NVDA
السعر الحالي: 122.45
نسبة التغير: +3.18%
التغير المطلق: +3.77
الإشارة الإجمالية: STRONG_BUY
درجة الثقة: 78/100
القطاع: Technology

المؤشرات الفنية (للتحليل):
- RSI: 62.40
- MACD: 2.15 (above signal line 1.80)
- SMA20: 118.20
- SMA50: 110.50
- SMA200: 95.30
- Volume: 45,200,000

إعداد التداول:
- سعر الدخول: 122.00
- وقف الخسارة: 116.50
- جني الأرباح: 132.00

أخبار مرتبطة من المنصة:
1. NVIDIA announces new AI chip partnership
   Summary: The company unveiled its next-generation H200 chip with major cloud providers.
2. analysts raise NVDA price targets
   Summary: Multiple analysts revised their targets upward citing AI demand.`;

  return {
    type: 'analysis' as const,
    title: titlesByLocale[locale],
    summary: 'NVDA — Strong BUY signal after breaking $120 resistance',
    content,
    numbers: extractNumbers(content),
    assets: ['NVDA'],
    marketData: { price: 122.45, changePercent: 3.18 },
  };
}

// ─── استدعاء LLM عبر z-ai-web-dev-sdk ─────────────────────

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt } as any,
      { role: 'user', content: userPrompt } as any,
    ],
    thinking: { type: 'disabled' },
  } as any);
  const content = (completion as any).choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new Error('LLM returned empty content');
  }
  return content;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const locales: Locale[] = ['ar', 'en', 'fr', 'tr', 'es'];
  const results: { locale: string; success: boolean; news?: GeneratedNews; error?: string; validation?: any }[] = [];

  console.log('═══════════════════════════════════════════════════');
  console.log('  وكيل النشر — تجربة إنتاج 5 أخبار (واحد لكل لغة)');
  console.log('═══════════════════════════════════════════════════\n');

  for (const locale of locales) {
    console.log(`\n[${locale}] جاري التوليد...`);
    try {
      const source = buildDemoSource(locale);
      const allText = `${source.title} ${source.summary} ${source.content}`;
      const sourceNumbers = [...new Set([...source.numbers, ...extractNumbers(allText)])];
      const sourceAssets = [...new Set([...source.assets, ...extractAssets(allText)])];

      const systemPrompt = buildSystemPrompt(locale);
      const userPrompt = buildUserPrompt(source, locale, sourceNumbers, sourceAssets);

      const rawResult = await callLLM(systemPrompt, userPrompt);
      const news = parseGeneratedNews(rawResult);

      // طبقات التحقق
      const contentForValidation = typeof news.content === 'string'
        ? news.content
        : Array.isArray(news.content)
          ? news.content.join('\n')
          : JSON.stringify(news.content);
      const numberCheck = validateNumbers(`${contentForValidation} ${news.title}`, sourceNumbers);
      const bigInvalid = numberCheck.invalid.filter(n => {
        const num = parseFloat(n.replace(/[%$€£¥,]/g, ''));
        return !isNaN(num) && Math.abs(num) > 100;
      });

      // فلتر أفعال القول (للزوايا 1-6: كل أفعال القول تُستبدل)
      const looseQuoteVerbsRegex = /\b(ذكر|أفاد|أشار|قال|صرح|أوضح|أكد|أعلن)\b/g;
      const allMatches = contentForValidation.match(looseQuoteVerbsRegex);
      if (allMatches && allMatches.length > 0) {
        news.content = contentForValidation.replace(looseQuoteVerbsRegex, 'وارد');
      } else {
        // normalize content to string
        news.content = contentForValidation;
      }

      results.push({
        locale,
        success: true,
        news,
        validation: {
          numbersInvalid: numberCheck.invalid,
          bigInvalid,
          rejected: bigInvalid.length > 0,
        },
      });
      console.log(`[${locale}] ✓ نجح — "${news.title}"`);
    } catch (err: any) {
      console.error(`[${locale}] ✗ فشل: ${err.message}`);
      results.push({ locale, success: false, error: err.message });
    }
  }

  // كتابة النتائج لملف
  const outputPath = '/home/z/my-project/download/news-writer-demo-results.json';
  const fs = await import('fs/promises');
  await fs.mkdir('/home/z/my-project/download', { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  // طباعة ملخص نهائي
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  النتائج النهائية');
  console.log('═══════════════════════════════════════════════════\n');

  for (const r of results) {
    if (r.success && r.news) {
      console.log(`\n┌─ ${r.locale.toUpperCase()} ─────────────────────────────`);
      console.log(`│ العنوان: ${r.news.title}`);
      console.log(`│ الملخص: ${r.news.summary}`);
      console.log(`│ التصنيف: ${r.news.category} | المشاعر: ${r.news.sentiment} | التأثير: ${r.news.impactLevel}`);
      console.log(`│ الأصول: ${r.news.affectedAssets.join(', ')}`);
      console.log(`├─ المحتوى ──────────────────────────────`);
      const contentStr = typeof r.news.content === 'string'
        ? r.news.content
        : Array.isArray(r.news.content)
          ? r.news.content.join('\n')
          : JSON.stringify(r.news.content);
      const contentLines = contentStr.split('\n');
      for (const line of contentLines) {
        console.log(`│ ${line}`);
      }
      console.log(`└─────────────────────────────────────────`);
      if (r.validation) {
        console.log(`  تحقق: أرقام غير صالحة=${r.validation.numbersInvalid.length}, رفض=${r.validation.rejected}`);
      }
    } else {
      console.log(`\n┌─ ${r.locale.toUpperCase()} ─────────────────────────────`);
      console.log(`│ ✗ فشل: ${r.error}`);
      console.log(`└─────────────────────────────────────────`);
    }
  }

  console.log(`\n📄 النتائج الكاملة محفوظة في: ${outputPath}`);

  const successCount = results.filter(r => r.success).length;
  console.log(`\nالملخص: ${successCount}/${results.length} لغات نجحت`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
