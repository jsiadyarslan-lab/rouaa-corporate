import { db } from '@/lib/db';
import ReportDetailClient from './ReportDetailClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import { translateSectorsToAr } from '@/lib/locale';
import { redirect } from 'next/navigation';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

// ─── Fallback Content Generator ───────────────────────────────
// When AI generation fails or returns empty content, generate
// meaningful placeholder content from the analysis metadata.

const ASSET_CLASS_INFO: Record<string, { nameAr: string; description: string; sectors: string[]; keyDrivers: string[]; risks: string[] }> = {
  strategic: {
    nameAr: 'التقارير الاستراتيجية',
    description: 'تقارير تحليلية معمقة لمواضيع محددة يطلبها المستخدم، مختلفة عن التقارير الآلية اليومية. تعتمد على تحليل معمق بالذكاء الاصطناعي مع بيانات إخبارية حقيقية.',
    sectors: ['تحليل اقتصادي', 'أسواق مالية', 'سيناريوهات مستقبلية', 'توصيات استراتيجية'],
    keyDrivers: ['الأحداث الاقتصادية والجيوسياسية الكبرى', 'سياسات البنوك المركزية وتأثيراتها الإقليمية', 'تحولات الأسواق المالية العالمية', 'التوجهات الاستثمارية المؤسسية'],
    risks: ['تغيرات مفاجئة في السياسات النقدية', 'تطورات جيوسياسية غير متوقعة', 'تقلبات حادة في أسواق الطاقة والعملات', 'تباطؤ اقتصادي أوسع من المتوقع'],
  },
  forex: {
    nameAr: 'الفوركس',
    description: 'سوق العملات الأجنبية هو أكبر الأسواق المالية في العالم بحجم تداول يومي يتجاوز 7 تريليون دولار. يتأثر هذا السوق بالسياسات النقدية للبنوك المركزية والبيانات الاقتصادية الكلية والأحداث الجيوسياسية.',
    sectors: ['يورو/دولار', 'جنيه/دولار', 'دولار/ين', 'دولار/فرنك'],
    keyDrivers: ['قرارات الفائدة من الفيدرالي الأمريكي والبنك المركزي الأوروبي', 'بيانات التضخم والنمو الاقتصادي', 'التوترات الجيوسياسية وأسعار الطاقة', 'مؤشر الدولار الأمريكي وتحركات رؤوس الأموال'],
    risks: ['تقلبات حادة بسبب قرارات البنوك المركزية المفاجئة', 'تدخل الحكومات في أسعار الصرف', 'أزمات سياسية إقليمية تؤثر على العملات الناشئة', 'تباطؤ اقتصادي عالمي يؤدي لهروب رؤوس الأموال'],
  },
  stocks: {
    nameAr: 'الأسهم',
    description: 'سوق الأسهم العالمي يشهد تأثراً متبادلاً بين البورصات الرئيسية، مع تركز الاهتمام على موسم أرباح الشركات الكبرى وتوقعات السياسة النقدية.',
    sectors: ['أسهم أمريكية', 'أسهم أوروبية', 'أسهم آسيوية', 'أسهم خليجية'],
    keyDrivers: ['موسم أرباح الشركات وتوقعات المحللين', 'قرارات الفائدة وتأثيرها على التقييمات', 'التطورات التكنولوجية والذكاء الاصطناعي', 'التدفقات الاستثمارية الدولية'],
    risks: ['تصحيح الأسعار بعد فترات الصعود', 'تباطؤ النمو الاقتصادي وتأثيره على الأرباح', 'تشديد التنظيمات في قطاعات رئيسية', 'الحروب التجارية والتعريفات الجمركية'],
  },
  crypto: {
    nameAr: 'العملات الرقمية',
    description: 'سوق العملات الرقمية يتسم بالتقلب العالي والتأثر بالأحداث التنظيمية والتطورات التكنولوجية وحركة رؤوس الأموال المؤسسية.',
    sectors: ['بيتكوين', 'إيثيريوم', 'عملات بديلة', 'تمويل لامركزي'],
    keyDrivers: ['تدفق رؤوس الأموال المؤسسية وصناديق ETF', 'التطورات التنظيمية العالمية', 'تحديثات الشبكات والبروتوكولات', 'معدلات الفائدة وبيئة السيولة العالمية'],
    risks: ['تقلبات حادة ومفاجئة في الأسعار', 'تدخل تنظيمي صارم في أسواق رئيسية', 'مخاطر أمنية واختراقات المنصات', 'فقدان الثقة وانهيارات مشروعات كبرى'],
  },
  economy: {
    nameAr: 'الاقتصاد الكلي',
    description: 'الاقتصاد العالمي يواجه تحديات متعددة تشمل التضخم وسياسات البنوك المركزية والتباطؤ المحتمل في النمو مع استمرار التوترات الجيوسياسية.',
    sectors: ['نمو اقتصادي', 'تضخم', 'أسعار فائدة', 'تجارة دولية'],
    keyDrivers: ['سياسات البنوك المركزية وقرارات الفائدة', 'بيانات التضخم والناتج المحلي', 'التجارة الدولية وسلاسل التوريد', 'السياسات المالية الحكومية'],
    risks: ['ركود اقتصادي عالمي', 'تضخم مستمر يتجاوز التوقعات', 'أزمات ديون سيادية', 'حروب تجارية وتعريفات جمركية'],
  },
  energy: {
    nameAr: 'الطاقة',
    description: 'سوق الطاقة العالمي يتأثر بالتوازن بين العرض والطلب وقرارات أوبك والتوترات الجيوسياسية في مناطق الإنتاج الرئيسية.',
    sectors: ['نفط خام', 'غاز طبيعي', 'طاقة متجددة', 'بتروكيماويات'],
    keyDrivers: ['قرارات أوبك بخصوص مستويات الإنتاج', 'الطلب الصيني والنمو الاقتصادي الآسيوي', 'التوترات في الشرق الأوسط ومضيق هرمز', 'التحول نحو الطاقة النظيفة'],
    risks: ['حرب أسعار بين المنتجين الكبار', 'تأثير الحروب والأزمات على الإمدادات', 'تباطؤ الطلب العالمي بسبب الركود', 'عقوبات تجارية على دول منتجة'],
  },
  commodities: {
    nameAr: 'السلع',
    description: 'أسواق السلع تتأثر بعوامل متعددة تشمل قوة الدولار والطلب الصناعي والأحوال الجوية والتوترات الجيوسياسية.',
    sectors: ['ذهب', 'فضة', 'نحاس', 'منتجات زراعية'],
    keyDrivers: ['تحركات الدولار الأمريكي وأسعار الفائدة', 'الطلب الصناعي من الصين والاقتصادات الكبرى', 'الأحوال الجوية وتأثيرها على المحاصيل', 'التهديدات الجيوسياسية كملاذ آمن'],
    risks: ['شح العرض بسبب أحداث طبيعية أو سياسية', 'تباطؤ الطلب الصناعي العالمي', 'تقلبات أسعار الصرف', 'المضاربات في الأسواق المستقبلية'],
  },
  realEstate: {
    nameAr: 'العقارات',
    description: 'قطاع العقارات يتأثر بمعدلات الفائدة والسياسات التمويلية والطلب الديموغرافي والاستثمارات الحكومية في البنية التحتية.',
    sectors: ['عقارات سكنية', 'عقارات تجارية', 'صناديق REITs', 'تطوير عقاري'],
    keyDrivers: ['معدلات الرهن العقاري وأسعار الفائدة', 'النمو السكاني والتحضر', 'الاستثمارات الحكومية في البنية التحتية', 'السياسات التنظيمية والتشجيعية'],
    risks: ['فقاعة عقارية بسبب الإفراط في الاقتراض', 'ارتفاع أسعار الفائدة يقلل الطلب', 'تباطؤ اقتصادي يؤثر على القدرة الشرائية', 'تشديد القوانين التنظيمية'],
  },
  banking: {
    nameAr: 'البنوك',
    description: 'القطاع المصرفي يتأثر بشكل مباشر ببيئة أسعار الفائدة والسياسات النقدية وجودة الائتمان والتحول الرقمي.',
    sectors: ['بنوك تقليدية', 'بنوك إسلامية', 'بنوك استثمارية', 'تمويل رقمي'],
    keyDrivers: ['هيكل أسعار الفائدة وهوامش الربح', 'جودة المحفظة الائتمانية ومعدلات التعثر', 'التحول الرقمي والابتكار المصرفي', 'التنظيمات والامتثال'],
    risks: ['ارتفاع معدلات التعثر في القروض', 'تقلبات أسعار الفائدة وأثرها على الهوامش', 'مخاطر سيبرانية وأمنية', 'منافسة من شركات التكنولوجيا المالية'],
  },
  bonds: {
    nameAr: 'السندات',
    description: 'سوق السندات العالمي يعد مقياساً رئيسياً لتوقعات الفائدة والتضخم ومؤشراً على شهية المخاطرة لدى المستثمرين.',
    sectors: ['سندات حكومية', 'سندات شركات', 'سندات عالية العائد', 'سندات إسلامية'],
    keyDrivers: ['قرارات البنوك المركزية بشأن الفائدة', 'توقعات التضخم والنمو الاقتصادي', 'تصنيفات الائتمان السيادي والشركات', 'معدلات العرض والطلب على الديون الجديدة'],
    risks: ['ارتفاع العائد نتيجة تشديد السياسة النقدية', 'مخاطر التخلف عن السداد للسندات عالية العائد', 'مخاطر السيولة في الأوقات الصعبة', 'تقلبات أسعار الصرف للسندات المقومة بعملات أجنبية'],
  },
  // V135: Added technicalAnalysis — was missing, causing fallback to economy info
  technicalAnalysis: {
    nameAr: 'التحليلات الفنية',
    description: 'تحليلات فنية معمقة لأزواج العملات والعملات الرقمية والسلع والأسهم، تعتمد على المؤشرات الفنية والأنماط السعرية ومستويات الدعم والمقاومة مع سيناريوهات محددة وتوصيات عملية.',
    sectors: ['فوركس', 'عملات رقمية', 'ذهب ونفط', 'أسهم عالمية'],
    keyDrivers: ['مستويات الدعم والمقاومة الرئيسية', 'المؤشرات الفنية (RSI, MACD, المتوسطات المتحركة)', 'الأنماط السعرية والشموعية', 'حجم التداول ومؤشرات السيولة'],
    risks: ['إشارات فنية متضاربة بين الأطر الزمنية المختلفة', 'اختراقات كاذبة للمستويات الرئيسية', 'تغيرات مفاجئة بسبب أحداث جيوسياسية أو اقتصادية', 'انخفاض السيولة في أوقات معينة'],
  },
  // V167: Added earnings — was missing, causing fallback to economy info
  earnings: {
    nameAr: 'أرباح الشركات',
    description: 'موسم أرباح الشركات يعد من أهم المحركات السوقية، حيث تكشف الشركات الكبرى عن نتائجها المالية الفصلية وتؤثر بشكل مباشر على أسعار الأسهم وتوجهات السوق.',
    sectors: ['أرباح شركات أمريكية', 'أرباح شركات أوروبية', 'أرباح شركات خليجية', 'توقعات المحللين'],
    keyDrivers: ['نتائج الأرباح الفعلية مقابل توقعات المحللين', 'توقعات الإرشادات المستقبلية للشركات', 'هوامش الربح والإيرادات التشغيلية', 'معدلات النمو وتأثيرها على التقييمات'],
    risks: ['خيبة أمل من نتائج الشركات الكبرى وتأثيرها السلبي على السوق', 'تخفيض توقعات الأرباح المستقبلية', 'ضغوط التضخم على هوامش الربح', 'تباين كبير بين القطاعات والأقاليم'],
  },
  // V411: Added arabMarkets — was missing, causing fallback to generic economy info
  arabMarkets: {
    nameAr: 'الأسواق العربية',
    description: 'الأسواق المالية العربية والخليجية تشمل تداول السعودية وسوق دبي المالي وأبوظبي ومصر والكويت، تتأثر بأسعار النفط والسياسات النقدية والتدفقات الأجنبية والطروحات الأولية.',
    sectors: ['تداول السعودية', 'سوق دبي المالي', 'سوق أبوظبي', 'بورصة مصر', 'بورصة الكويت'],
    keyDrivers: ['أسعار النفط وعلاقتها المباشرة بأسواق الخليج', 'سياسة الفائدة الأمريكية وتأثيرها على تدفقات رأس المال', 'الطروحات الأولية ونشاط الاكتتاب في المنطقة', 'التوترات الجيوسياسية في الشرق الأوسط'],
    risks: ['تراجع حاد في أسعار النفط يضغط على ميزانيات الخليج', 'تشديد نقدي عالمي يسحب سيولة من الأسواق الناشئة', 'تأخر الإصلاحات الاقتصادية في مصر وغيرها', 'انخفاض ثقة المستثمر الأجنبي بسبب توترات إقليمية'],
  },
};

function generateFallbackContent(analysis: { assetClass: string; sentiment: string; confidenceScore: number; riskLevel: string; title: string }): { sections: Record<string, string>; highlights: string[] } {
  const info = ASSET_CLASS_INFO[analysis.assetClass] || ASSET_CLASS_INFO.economy;
  const sentimentLabel = analysis.sentiment === 'bullish' ? 'صعودي' : analysis.sentiment === 'bearish' ? 'هبوطي' : 'محايد';
  const riskLabel = analysis.riskLevel === 'low' ? 'منخفض' : analysis.riskLevel === 'high' ? 'مرتفع' : analysis.riskLevel === 'extreme' ? 'شديد جداً' : 'متوسط';
  const isStrategic = analysis.assetClass === 'strategic';
  
  const sections: Record<string, string> = {};
  const highlights: string[] = [];
  
  // V100: For strategic reports, generate a CONCISE overview only —
  // the AI prompt already produces 8 specific sections (Executive Summary, Context,
  // Economic Impact, Market Effects, Scenarios, Affected Assets, Recommendations, Follow-up).
  // DO NOT generate the generic "detailedAnalysis" section which produces hallucinated
  // content unrelated to the strategic topic.
  if (isStrategic) {
    sections.overview = `يقدم هذا التقرير الاستراتيجي تحليلاً معمقاً لموضوع محدد، مختلفاً عن التقارير الآلية اليومية. يعتمد على تحليل عميق بالذكاء الاصطناعي مع بيانات إخبارية حقيقية، ويغطي السيناريوهات الزمنية والأصول المتأثرة والتوصيات الاستراتيجية.\n\n${info.description}`;
    // NO detailedAnalysis section for strategic reports — it's hallucinated!
  } else {
    sections.overview = `يقدم هذا التقرير تحليلاً شاملاً لأداء سوق ${info.nameAr} بناءً على البيانات والمؤشرات المتاحة. يعكس مستوى الثقة البالغ ${analysis.confidenceScore}% مدى موثوقية البيانات المستخدمة في هذا التحليل، بينما يشير التوجه العام إلى وضع ${sentimentLabel} في السوق.\n\n${info.description}`;
    
    // V158 FIX: Each driver gets a UNIQUE, SPECIFIC description — not the same generic sentence repeated
    // V161: Each driver gets a SPECIFIC, UNIQUE description — no generic filler
    sections.detailedAnalysis = `يتشكل المشهد الحالي لسوق ${info.nameAr} تحت تأثير عدة عوامل رئيسية:\n\n${info.keyDrivers.map((d, i) => {
      const descriptions: Record<number, string> = {
        0: `يرتبط ${d} مباشرة بحركة الأسعار الحالية — أي بيانات جديدة في هذا المجال قد تُحفّز تحركاً سعرياً فورياً.`,
        1: `تُشكّل تطورات ${d} مؤشراً استباقياً لاتجاه السوق، خاصةً في ظل تقلبات السيولة.`,
        2: `يُسهم ${d} في تحديد نطاق التقلبات المتوقعة على المدى القصير والمتوسط.`,
        3: `تؤثر تحولات ${d} على قرارات التخصيص الاستراتيجي في سوق ${info.nameAr}.`,
      };
      return `${i + 1}. **${d}**: ${descriptions[i] || descriptions[3]}`;
    }).join('\n\n')}`;
  }
  
  sections.riskAssessment = `يُقيّم مستوى المخاطرة في سوق ${info.nameAr} حالياً بـ"${riskLabel}":\n\n${info.risks.map((r, i) => `- ${r}`).join('\n')}`;
  
  // V161: Investor-category recommendations — not generic filler
  sections.strategicRecommendations = `بناءً على التحليل أعلاه والتوجه ${sentimentLabel} للسوق:\n\n### للمستثمر المحافظ\n- تقليل التعرض للأصول عالية التقلب في سوق ${info.nameAr}\n- التركيز على الأصول الدفاعية ذات العوائد الثابتة\n- تحديد مستويات وقف الخسارة بدقة عند أي مركز جديد\n\n### للمستثمر المتوسط\n- توزيع الاستثمار بين أصول ${(info as any).sectors.slice(0, 2).join(' و')}\n- الانتظار حتى استقرار الاتجاه قبل الدخول في مراكز جديدة\n\n### المتداول اليومي\n- مراقبة مستويات الدعم والمقاومة الرئيسية\n- استغلال تقلبات ${info.nameAr} في جلسات التداول النشطة`;
  
  // V161: Scenarios section instead of generic outlook
  sections.outlook = `### السيناريو المتفائل (احتمالية ${sentimentLabel === 'صعودي' ? '55' : '30'}%)\nاستمرار الدعم من ${info.keyDrivers[0] || 'العوامل الحالية'} قد يدفع سوق ${info.nameAr} نحو مستويات أعلى، خاصةً مع تحسن البيانات الاقتصادية.\n\n### السيناريو المحايد (احتمالية ${sentimentLabel === 'محايد' ? '50' : '40'}%)\nاستمرار الوضع الراهن مع تداول محصور ضمن نطاق حالي، ريثما تتضح توجهات ${info.keyDrivers[1] || 'العوامل الرئيسية'}.\n\n### السيناريو المتشائم (احتمالية ${sentimentLabel === 'هبوطي' ? '55' : '25'}%)\nتصاعد تأثير ${info.risks[0] || 'المخاطر الحالية'} قد يضغط على الأسعار، خاصةً مع تراجع شهية المخاطرة.`;
  
  highlights.push(
    `مستوى الثقة: ${analysis.confidenceScore}% — ${analysis.confidenceScore >= 70 ? 'موثوقية عالية' : analysis.confidenceScore >= 50 ? 'موثوقية متوسطة' : 'موثوقية محدودة'}`,
    `التوجه العام: ${sentimentLabel}`,
    `مستوى المخاطرة: ${riskLabel}`,
    `القطاعات المتأثرة: ${(info as any).sectors.slice(0, 3).join('، ')}`,
  );
  
  return { sections, highlights };
}

// ─── Universal Content Processor ──────────────────────────────
// Processes BOTH EconomicReport and MarketAnalysis content
// from JSON format into a clean structure for ReportDetailClient.
// V105: Now also handles raw Markdown content by splitting it
// into named sections based on ## headings, with Arabic heading
// to English key mapping for consistent section identification.

// Map Arabic section headings to English keys (same as in strategic/route.ts)
const ARABIC_HEADING_TO_KEY: Record<string, string> = {
  // Strategic report sections
  'الملخص التنفيذي': 'executiveSummary',
  'السياق والخلفية': 'context',
  'التداعيات الاقتصادية المباشرة': 'economicImpact',
  'تأثير على أسواق المال': 'marketImpact',
  'السيناريوهات': 'scenarios',
  'الأصول المتأثرة للمتداول': 'affectedAssets',
  'التوصيات الاستراتيجية': 'strategicRecommendations',
  'مؤشرات المتابعة': 'followUpIndicators',
  'نظرة عامة': 'overview',
  'مقدمة التقرير': 'introduction',
  'تقييم المخاطر': 'riskAssessment',
  'التوقعات': 'outlook',
  // V210: Commodities report sections
  'تحليل الذهب والمعادن النفيسة': 'goldAnalysis',
  'تحليل المعادن الصناعية': 'industrialMetals',
  'تحليل السلع الزراعية': 'agriculturalCommodities',
  'العرض والطلب العالمي': 'supplyDemand',
  'تأثير الدولار على السلع': 'dollarImpact',
  'السلع والطاقة': 'commoditiesEnergy',
  // V210: Common recommendation section names across report types
  'توصيات رؤى': 'rouaRecommendations',
  'التوصيات': 'strategicRecommendations',
  'توصيات': 'strategicRecommendations',
  // V210: Energy report sections
  'تحليل النفط': 'oilAnalysis',
  'تحليل الغاز': 'gasAnalysis',
  'الطاقة المتجددة': 'renewableEnergy',
  'تأثير أوبك': 'opecImpact',
  // V210: Forex report sections
  'تحليل أزواج العملات': 'currencyPairsAnalysis',
  'تحليل العرض والطلب': 'supplyDemandAnalysis',
  // V210: Other common sections
  'المحركات الرئيسية': 'keyMovers',
  'أحداث اليوم': 'todayCalendar',
  'الاتجاه': 'direction',
  'ما نراقبه': 'whatWeWatching',
  'نبض السوق': 'marketPulse',
  'نظرة الغد': 'tomorrowOutlook',
  'أداء القطاعات': 'sectorPerformance',
  'تحليل المشاعر': 'sentimentAnalysis',
  'النظرة الفنية': 'technicalOutlook',
  'تقويم الأحداث': 'eventCalendar',
  // V411: Arab Markets report sections
  'السوق السعودي': 'saudiMarket',
  'سوق دبي المالي': 'dubaiMarket',
  'سوق أبوظبي': 'abuDhabiMarket',
  'الأسواق المصرية والكويتية': 'egyptKuwaitMarkets',
  'التأثير الإقليمي والعالمي': 'regionalGlobalImpact',
  'الطروحات الأولية': 'ipoActivity',
  'الطروحات': 'ipoActivity',
};

// V210: stripMarkdownHeadings and stripSummaryMarkdown are now imported from @/lib/clean-markdown
// They are THE single source of truth for #/## removal.

function processContent(rawContent: string): {
  sections: Record<string, string>;
  metadata: Record<string, any>;
  dataQuality: Record<string, any>;
  summary: string;
} {
  const result = {
    sections: {} as Record<string, string>,
    metadata: {} as Record<string, any>,
    dataQuality: {} as Record<string, any>,
    summary: '',
  };

  if (!rawContent || rawContent.trim().length === 0) return result;

  try {
    const parsed = JSON.parse(rawContent);

    // Extract sections from parsed.sections
    // V202: Strip #/## markdown headings from ALL section content at the server level
    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          // V202: Strip raw #/## headings from section content before storing
          result.sections[key] = stripMarkdownHeadings(value);
        } else if (typeof value === 'object' && value !== null) {
          // Nested objects — extract text from them
          const extracted = extractTextFromObject(value as Record<string, unknown>);
          if (extracted.length > 20) {
            result.sections[key] = stripMarkdownHeadings(extracted);
          }
        }
      }
    }

    // V225: Fallback — extract section keys from TOP-LEVEL JSON when parsed.sections
    // doesn't exist. Some old reports store sections directly at the top level
    // (e.g., {"introduction": "...", "context": "..."} instead of
    // {"sections": {"introduction": "...", "context": "..."}}).
    const KNOWN_SECTION_KEYS = [
      'introduction', 'overview', 'executiveSummary', 'weeklyOverview',
      'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'context',
      'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets',
      'followUpIndicators', 'sourcesAndReferences', 'confidenceAssessment',
      'rouaRecommendations', 'strategicRecommendations', 'riskAssessment',
      'outlook', 'keyFindings', 'highlights', 'keyPoints', 'mainFindings',
      'rawContent', 'sentimentAnalysis', 'technicalOutlook', 'detailedAnalysis',
      'saudiMarket', 'dubaiMarket', 'abuDhabiMarket', 'egyptKuwaitMarkets',
      'regionalGlobalImpact', 'ipoActivity',
    ];
    if (Object.keys(result.sections).length === 0 && !parsed.sections) {
      for (const [key, value] of Object.entries(parsed)) {
        if (KNOWN_SECTION_KEYS.includes(key) && typeof value === 'string' && value.trim().length > 0) {
          result.sections[key] = stripMarkdownHeadings(value);
        }
      }
    }

    // Extract from aiContent (V134: moved to metadata.aiContent, with backward compat for old top-level)
    const aiContentSource = parsed.metadata?.aiContent || parsed.aiContent;  // V134: Check new location first, fallback to old
    if (aiContentSource && typeof aiContentSource === 'object') {
      const ai = aiContentSource;
      const aiSectionMap: Record<string, string> = {
        summary: 'overview',
        detailedAnalysis: 'detailedAnalysis',
        recommendations: 'strategicRecommendations',
        riskFactors: 'riskAssessment',
        outlook: 'outlook',
        technicalAnalysis: 'technicalOutlook',
        fundamentalAnalysis: 'fundamentalAnalysis',
        marketPulse: 'marketPulse',
        sectorAnalysis: 'sectorPerformance',
        sentimentDetails: 'sentimentAnalysis',
        currencyPairsAnalysis: 'currencyPairsAnalysis',
        supplyDemandAnalysis: 'supplyDemandAnalysis',
        oilAnalysis: 'oilAnalysis',
        gdpAnalysis: 'gdpAnalysis',
        bankEarnings: 'bankEarnings',
        residentialMarket: 'residentialMarket',
        yieldCurveAnalysis: 'yieldCurveAnalysis',
      };

      for (const [aiKey, sectionKey] of Object.entries(aiSectionMap)) {
        if ((ai as any)[aiKey] && !result.sections[sectionKey]) {
          const val = (ai as any)[aiKey];
          if (typeof val === 'string' && val.trim().length > 0) {
            // V203: Apply stripMarkdownHeadings to aiContent values — they contain
            // raw AI output with ## headings that were never cleaned
            result.sections[sectionKey] = stripMarkdownHeadings(val);
          } else if (Array.isArray(val)) {
            const text = val.join('\n\n');
            if (text.trim().length > 20) result.sections[sectionKey] = stripMarkdownHeadings(text);
          }
        }
      }

      // Highlights from keyFindings
      if (!result.sections.highlights && Array.isArray(ai.keyFindings) && ai.keyFindings.length > 0) {
        result.sections.highlights = JSON.stringify(ai.keyFindings);
      }
    }

    // Extract metadata
    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};

    // Build summary from the best available section
    // V202: Strip markdown headings from summary for clean card display
    // V225: Added 'context' section as fallback (important for strategic reports)
    const rawSummary = result.sections.introduction || result.sections.overview
      || result.sections.executiveSummary || result.sections.weeklyOverview
      || result.sections.economicOverview || result.sections.quarterlyOverview
      || result.sections.eventAnalysis || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);

    // V225: Smart truncation at sentence/word boundary instead of blind .slice(0, 497)
    if (result.summary.length > 500) {
      result.summary = truncateAtBoundary(result.summary, 500);
    }

  } catch {
    // Not JSON — treat as plain text or Markdown
    const text = rawContent.trim();
    if (text.length > 20) {
      // V105: Check if this is Markdown with ## headings
      // Split by ## headings into named sections
      const headingRegex = /^##\s+(\d+[\.\s]*)?(.+)$/gm;
      const matches: { index: number; number: string; title: string }[] = [];
      let match;
      while ((match = headingRegex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          number: (match[1] || '').replace(/[\.\s]/g, '').trim(),
          title: match[2].trim(),
        });
      }

      if (matches.length >= 2) {
        // Parse as structured Markdown with ## headings
        for (let i = 0; i < matches.length; i++) {
          const startIdx = matches[i].index + text.substring(matches[i].index).split('\n')[0].length + 1;
          const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;
          const content = text.substring(startIdx, endIdx).trim();

          if (content.length < 5) continue;

          // Determine section key from Arabic heading
          let sectionKey = '';
          const title = matches[i].title;

          // Try matching by number (1-8 for strategic reports)
          if (matches[i].number) {
            const numberKeyMap: Record<string, string> = {
              '1': 'executiveSummary', '2': 'context',
              '3': 'economicImpact', '4': 'marketImpact',
              '5': 'scenarios', '6': 'affectedAssets',
              '7': 'strategicRecommendations', '8': 'followUpIndicators',
            };
            sectionKey = numberKeyMap[matches[i].number] || '';
          }

          // Try matching by Arabic title
          if (!sectionKey) {
            for (const [arabicTitle, key] of Object.entries(ARABIC_HEADING_TO_KEY)) {
              if (title.includes(arabicTitle) || arabicTitle.includes(title)) {
                sectionKey = key;
                break;
              }
            }
          }

          // Fallback: use section number or sanitized key
          if (!sectionKey) {
            sectionKey = `section${matches[i].number || i + 1}`;
          }

          // V202: Strip #/## markdown headings from section content
          result.sections[sectionKey] = stripMarkdownHeadings(content);
        }

        // Also store the full raw content for fallback rendering (cleaned)
        result.sections.rawContent = stripMarkdownHeadings(text);

        // Build summary from first section (V202: strip markdown)
        const rawSummary = result.sections.executiveSummary
          || result.sections.overview
          || result.sections.introduction
          || stripSummaryMarkdown(text.slice(0, 500));
        result.summary = stripSummaryMarkdown(rawSummary);
      } else {
        // Plain text without ## headings — store as overview (cleaned)
        result.sections.overview = stripMarkdownHeadings(text);
        result.summary = stripSummaryMarkdown(text.slice(0, 500));
      }

      // V225: Smart truncation at sentence/word boundary
      if (result.summary.length > 500) {
        result.summary = truncateAtBoundary(result.summary, 500);
      }
    }
  }

  return result;
}

// Extract readable text from a nested object without destroying Arabic
function extractTextFromObject(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return '';
  const parts: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim().length > 5) {
      parts.push(value.trim());
    } else if (typeof value === 'number') {
      const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      parts.push(`**${label}**: ${value}`);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim().length > 5) {
          parts.push(`- ${item.trim()}`);
        } else if (typeof item === 'object' && item !== null) {
          const nested = extractTextFromObject(item as Record<string, unknown>, depth + 1);
          if (nested) parts.push(nested);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const nested = extractTextFromObject(value as Record<string, unknown>, depth + 1);
      if (nested) parts.push(`**${key.replace(/_/g, ' ')}**\n\n${nested}`);
    }
  }

  return parts.join('\n\n');
}

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

  if (!rawSlug || rawSlug === 'undefined' || rawSlug === 'null') {
    return { title: 'التقرير غير موجود - رؤى للأخبار المالية', description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي' };
  }

  try {
    // Quick lookup for metadata — V225: also fetch content to rebuild summary
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({
      where: { isPublished: true, locale: 'ar', OR: [{ id: slug }, { slug }] },
      select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
    });

    // Try URL-encoded slug
    if (!report) {
      let decodedSlug = slug;
      try { decodedSlug = decodeURIComponent(slug); } catch {}
      if (decodedSlug !== slug) {
        report = await db.economicReport.findFirst({
          where: { isPublished: true, locale: 'ar', OR: [{ id: decodedSlug }, { slug: decodedSlug }] },
          select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
        });
      }
    }

    // Try MarketAnalysis
    if (!report) {
      const analysis: any = await db.marketAnalysis.findFirst({
        where: { isPublished: true, locale: 'ar', OR: [{ id: slug }, { slug }] },
        select: { id: true, title: true, content: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true, publishedAt: true, createdAt: true, relatedNewsIds: true, isPublished: true },
      });
      if (analysis) {
        // Extract summary from content JSON
        let analysisSummary = '';
        try {
          const parsed = JSON.parse(analysis.content || '{}');
          analysisSummary = parsed.metadata?.summary || parsed.summary || '';
          if (!analysisSummary && parsed.sections) {
            const sections = parsed.sections as Record<string, string>;
            analysisSummary = sections.introduction || sections.overview || sections.executiveSummary || '';
          }
        } catch {}
        report = {
          id: analysis.id,
          title: analysis.title,
          summary: analysisSummary,
          slug: analysis.slug,
          scope: analysis.assetClass || 'economy',
          reportType: 'analysis' as const,
          marketImpact: analysis.sentiment || 'neutral',
          confidenceScore: analysis.confidenceScore,
          imageUrl: null,
        } as any;
      }
    }

    if (!report) return { title: 'التقرير غير موجود - رؤى للأخبار المالية' };

    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    let baseUrl = envUrl || 'http://localhost:3000';
    if (!envUrl) {
      try {
        const hdrs = await headers();
        const host = hdrs.get('host');
        const proto = hdrs.get('x-forwarded-proto') || 'https';
        if (host) baseUrl = `${proto}://${host}`;
      } catch {}
    }

    const title = report.title;
    // V225: Rebuild summary from processed content instead of using potentially-broken DB summary.
    // Old reports may have summaries truncated mid-word (e.g., "...هذا") or built from
    // wrong sections (e.g., 'context' instead of 'introduction'). By processing the content
    // fresh, we always get the best available section with smart truncation.
    let bestSummary = '';
    if (report.content) {
      try {
        const processed = processContent(report.content);
        if (processed.summary && processed.summary.trim().length > 10) {
          bestSummary = processed.summary;
        }
      } catch {}
    }
    const rawDesc = bestSummary
      ? stripSummaryMarkdown(bestSummary)
      : (report.summary ? stripSummaryMarkdown(report.summary) : '');
    const description = rawDesc ? truncateAtBoundary(rawDesc, 160, '') : `تقرير تحليلي شامل - رؤى للأخبار المالية`;
    const assetClassName = ASSET_CLASS_INFO[report.scope || 'economy']?.nameAr || 'تقرير مالي';
    const fullTitle = `${title} - ${assetClassName} - رؤى للأخبار المالية`;

    return {
      title: fullTitle,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/reports/${report.slug || slug}`,
        siteName: 'رؤى للأخبار المالية',
        locale: 'ar_AR',
        type: 'article',
        images: [{ url: report.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [report.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/reports/${report.slug || slug}` },
    };
  } catch {
    return { title: 'رؤى للأخبار المالية', description: 'منصة الأخبار المالية والتحليلات بالذكاء الاصطناعي' };
  }
}

// ─── Error Fallback Component ─────────────────────────────────
function ReportLoadError(slug: string, err?: unknown) {
  if (err) {
    console.error('════════════════════════════════════════');
    console.error(`🚨 [AR REPORT PAGE] Failed to load report slug="${slug}"`);
    console.error('════════════════════════════════════════');
    console.error('Error name:', (err as Error)?.name);
    console.error('Error message:', (err as Error)?.message);
    console.error('Error stack:', (err as Error)?.stack);
    if ((err as any)?.cause) console.error('Error cause:', (err as any).cause);
    console.error('Full error object:', err);
    console.error('════════════════════════════════════════');
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', direction: 'rtl', fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans Arabic", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>تعذر تحميل التقرير</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>حدث خطأ أثناء تحميل هذا التقرير. تم تسجيل تفاصيل الخطأ.</p>
        {slug && <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-all', direction: 'ltr' }}>slug: {slug}</p>}
        <a href="/reports" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#00E5FF', color: '#0A0E27', textDecoration: 'none' }}>العودة لقائمة التقارير</a>
      </div>
    </div>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  let slug = '';
try {
  const { slug: rawSlug } = await params;

  // ─── V99: URL-decode the slug ──────────────────────────────
  // Next.js may pass URL-encoded slugs for Arabic characters.
  // e.g. "strategic-%D8%AA%D8%AF%D8%A7%D8%B9%D9%8A%D8%A7%D8%AA-..."
  // must be decoded to "strategic-تداعيات-..." to match the DB value.
  slug = rawSlug;
  try {
    // Double-decode to handle cases where the URL was encoded twice
    const decodedOnce = decodeURIComponent(rawSlug);
    if (decodedOnce !== rawSlug) {
      slug = decodedOnce;
    } else {
      // Already decoded — try to see if it looks URL-encoded
      slug = decodedOnce;
    }
  } catch {
    // If decodeURIComponent fails, use raw slug
    slug = rawSlug;
  }

  // ─── V100: Robust slug matching for Arabic slugs ─────────────
  // IMPORTANT: Arabic page should prefer Arabic locale reports.
  // We try WITH locale='ar' first for all strategies, then fall back
  // to no locale filter if no match (for backward compat with old reports).

  // Strategy 1: Direct match by id or slug — prefer Arabic locale
  let report = await db.economicReport.findFirst({
    where: { isPublished: true, locale: 'ar', OR: [{ id: slug }, { slug }] },
  });
  // Fallback: without locale filter (old reports may lack locale field)
  if (!report) {
    report = await db.economicReport.findFirst({
      where: { isPublished: true, OR: [{ id: slug }, { slug }] },
    });
  }

  // Strategy 2: Try with the raw (possibly URL-encoded) slug
  if (!report && slug !== rawSlug) {
    report = await db.economicReport.findFirst({
      where: { isPublished: true, locale: 'ar', OR: [{ id: rawSlug }, { slug: rawSlug }] },
    });
    if (!report) {
      report = await db.economicReport.findFirst({
        where: { isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] },
      });
    }
  }

  // Strategy 3: Arabic character normalization
  // Normalize إ → ا, أ → ا, آ → ا, ة → ه, ي → ى and vice versa
  // This handles URL/DB encoding mismatches
  if (!report) {
    const normalizeArabic = (s: string): string =>
      s.replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/[يى]/g, 'ى');
    const normalizedSlug = normalizeArabic(slug);
    if (normalizedSlug !== slug) {
      report = await db.economicReport.findFirst({
        where: { isPublished: true, locale: 'ar', slug: { contains: normalizedSlug.slice(0, 20) } },
      });
      if (!report) {
        report = await db.economicReport.findFirst({
          where: { isPublished: true, slug: { contains: normalizedSlug.slice(0, 20) } },
        });
      }
      // Verify the found report's normalized slug matches
      if (report && normalizeArabic(report.slug || '') !== normalizedSlug) {
        report = null;
      }
    }
  }

  // Strategy 4: For strategic reports, match by nanoid suffix
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    // Try last 1, 2, 3 parts as suffix (Arabic words split by '-')
    // The nanoid suffix is always the LAST part (e.g., 'moxlo3jo')
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({
        where: {
          isPublished: true,
          locale: 'ar',
          reportType: 'strategic',
          slug: { endsWith: `-${slugSuffix}` },
        },
      });
      if (!report) {
        report = await db.economicReport.findFirst({
          where: {
            isPublished: true,
            reportType: 'strategic',
            slug: { endsWith: `-${slugSuffix}` },
          },
        });
      }
    }
    // If still not found, try matching by the LAST TWO parts
    // (sometimes the nanoid is 'xx-nanoid' format)
    if (!report && parts.length >= 2) {
      const lastTwo = parts.slice(-2).join('-');
      if (lastTwo.length >= 7) {
        report = await db.economicReport.findFirst({
          where: {
            isPublished: true,
            locale: 'ar',
            reportType: 'strategic',
            slug: { endsWith: lastTwo },
          },
        });
        if (!report) {
          report = await db.economicReport.findFirst({
            where: {
              isPublished: true,
              reportType: 'strategic',
              slug: { endsWith: lastTwo },
            },
          });
        }
      }
    }
  }

  // Strategy 5: For ANY slug, try findUnpublished as last resort
  // (some reports might not be marked as published yet)
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({
        where: {
          locale: 'ar',
          reportType: 'strategic',
          slug: { endsWith: `-${slugSuffix}` },
        },
      });
      if (!report) {
        report = await db.economicReport.findFirst({
          where: {
            reportType: 'strategic',
            slug: { endsWith: `-${slugSuffix}` },
          },
        });
      }
    }
  }

  let isAnalysis = false;

  // Fallback: try finding a MarketAnalysis — prefer Arabic locale
  // V1037: MarketAnalysis queries have been throwing PrismaClientKnownRequestError
  // (P-code error). We now log e.code, e.meta, e.clientVersion explicitly as
  // separate strings because Next.js production sanitization strips these from
  // the error object when logged as a single argument. We also retry with a
  // minimal `select` clause as a defensive fallback — if a non-critical column
  // is missing from the DB (schema migration mismatch), the minimal query
  // will still succeed.
  const logPrismaError = (label: string, e: unknown) => {
    const err = e as any;
    console.error(`═══════════════════════════════════════════════════`);
    console.error(`🚨 [AR Report] ${label}`);
    console.error(`  error class: ${err?.constructor?.name || typeof err}`);
    console.error(`  code:        ${err?.code ?? '(none)'}`);
    console.error(`  clientVersion: ${err?.clientVersion ?? '(none)'}`);
    console.error(`  message:     ${err?.message ?? '(none)'}`);
    try {
      console.error(`  meta:        ${JSON.stringify(err?.meta)}`);
    } catch { console.error('  meta:        (could not stringify)'); }
    console.error(`  stack:       ${err?.stack ?? '(none)'}`);
    console.error(`═══════════════════════════════════════════════════`);
  };

  if (!report) {
    console.log('[AR Report] Strategy: trying MarketAnalysis with locale=ar, slug:', slug);
    let analysis = await db.marketAnalysis.findFirst({
      where: { isPublished: true, locale: 'ar', OR: [{ id: slug }, { slug }] },
    }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=ar) FAILED', e); return null; });
    console.log('[AR Report] MarketAnalysis(locale=ar) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');

    // V1037: Defensive fallback — retry with minimal `select` to bypass schema mismatch
    if (!analysis) {
      console.log('[AR Report] Strategy: retry MarketAnalysis(locale=ar) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({
        where: { isPublished: true, locale: 'ar', OR: [{ id: slug }, { slug }] },
        select: {
          id: true, title: true, slug: true, content: true,
          assetClass: true, sentiment: true, confidenceScore: true,
          riskLevel: true, isPublished: true,
          publishedAt: true, createdAt: true, updatedAt: true,
          locale: true,
        },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=ar, MINIMAL) FAILED', e); return null; });
      console.log('[AR Report] MarketAnalysis(locale=ar, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // Fallback: without locale filter
    if (!analysis) {
      console.log('[AR Report] Strategy: trying MarketAnalysis without locale filter, slug:', slug);
      analysis = await db.marketAnalysis.findFirst({
        where: { isPublished: true, OR: [{ id: slug }, { slug }] },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale) FAILED', e); return null; });
      console.log('[AR Report] MarketAnalysis(no locale) result:', analysis ? `FOUND id=${analysis.id} locale=${analysis.locale}` : 'NOT FOUND');
    }

    // V1037: Defensive fallback — retry without locale filter + MINIMAL select
    if (!analysis) {
      console.log('[AR Report] Strategy: retry MarketAnalysis(no locale) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({
        where: { isPublished: true, OR: [{ id: slug }, { slug }] },
        select: {
          id: true, title: true, slug: true, content: true,
          assetClass: true, sentiment: true, confidenceScore: true,
          riskLevel: true, isPublished: true,
          publishedAt: true, createdAt: true, updatedAt: true,
          locale: true,
        },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale, MINIMAL) FAILED', e); return null; });
      console.log('[AR Report] MarketAnalysis(no locale, MINIMAL) result:', analysis ? `FOUND id=${analysis.id} locale=${analysis.locale}` : 'NOT FOUND');
    }

    if (analysis) {
      try {
      isAnalysis = true;
      const assetClass = analysis.assetClass || 'economy';
      console.log('[AR Report] Processing MarketAnalysis content, assetClass:', assetClass, 'content length:', analysis.content?.length || 0);

      // Process content using the universal processor
      const processed = processContent(analysis.content || '{}');
      
      // Check if we have meaningful content — need at least 2 sections with real text (>80 chars)
      // A single short introduction like "تحليل سوق الاقتصاد بناءً على 21 خبر" is NOT enough
      const sectionsWithContent = Object.values(processed.sections)
        .filter(v => typeof v === 'string' && v.trim().length > 80);
      const hasContent = sectionsWithContent.length >= 2;
      
      // Also merge fallback content for any missing key sections
      // This ensures reports always have rich content even when AI generation was sparse
      if (!hasContent) {
        const fallback = generateFallbackContent({
          assetClass,
          sentiment: analysis.sentiment || 'neutral',
          confidenceScore: analysis.confidenceScore || 50,
          riskLevel: analysis.riskLevel || 'medium',
          title: analysis.title,
        });
        // Merge: keep any existing sections, add fallback for missing ones
        for (const [key, value] of Object.entries(fallback.sections)) {
          if (!processed.sections[key] || processed.sections[key].trim().length < 80) {
            processed.sections[key] = value;
          }
        }
        if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) {
          processed.sections.highlights = JSON.stringify(fallback.highlights);
        }
        if (!processed.summary || processed.summary.trim().length < 30) {
          processed.summary = processed.sections.introduction || processed.sections.overview
            || fallback.sections.overview?.slice(0, 300) || '';
        }
      }

      // Build indicators
      let parsedIndicators: any = {};
      try {
        const indData = typeof analysis.indicators === 'string' ? JSON.parse(analysis.indicators) : analysis.indicators;
        if (Array.isArray(indData) && indData.length > 0) {
          parsedIndicators = {
            indicators: indData.map((ind: any) => ({
              name: ind.nameAr || ind.name || ind.symbol,
              value: ind.value,
              change: ind.change || ind.changePercent || 0,
              symbol: ind.symbol,
            })),
          };
        } else if (typeof indData === 'object' && indData !== null) {
          parsedIndicators = indData;
        }
      } catch { /* ignore */ }

      // Parse priceTarget
      try {
        const priceTargetData = typeof analysis.priceTarget === 'string' ? JSON.parse(analysis.priceTarget) : analysis.priceTarget;
        if (priceTargetData) {
          if (!parsedIndicators) parsedIndicators = { indicators: [] };
          if (!parsedIndicators.indicators) parsedIndicators.indicators = [];
          if (priceTargetData.current) parsedIndicators.indicators.push({ name: 'السعر الحالي', value: priceTargetData.current, change: 0, symbol: 'CURRENT' });
          if (priceTargetData.target) parsedIndicators.indicators.push({ name: 'السعر المستهدف', value: priceTargetData.target, change: 0, symbol: 'TARGET' });
          if (priceTargetData.stopLoss) parsedIndicators.indicators.push({ name: 'وقف الخسارة', value: priceTargetData.stopLoss, change: 0, symbol: 'STOP' });
          parsedIndicators.priceTarget = priceTargetData;
        }
      } catch { /* ignore */ }

      // Add metadata-based indicators if few
      const indCount = parsedIndicators?.indicators?.length || 0;
      if (indCount < 2) {
        if (!parsedIndicators) parsedIndicators = {};
        if (!parsedIndicators.indicators) parsedIndicators.indicators = [];
        if (analysis.confidenceScore) {
          parsedIndicators.indicators.push({ name: 'مستوى الثقة', value: analysis.confidenceScore, change: 0 });
        }
      }

      // Build sectors
      let sectors: string[] = [];
      try {
        const parsed = JSON.parse(analysis.content || '{}');
        // V134: Check metadata first, then top-level, then legacy aiContent
        const categoriesSource = parsed.metadata?.categories || parsed.categories || parsed.metadata?.aiContent?.categories;
        if (Array.isArray(categoriesSource)) {
          sectors = categoriesSource.map((c: any) => typeof c === 'string' ? c : (c.name || c.category || '')).filter(Boolean);
        }
      } catch { /* ignore */ }

      if (sectors.length === 0 && assetClass) {
        const classToSector: Record<string, string[]> = {
          strategic: ['تحليل اقتصادي', 'أسواق مالية', 'سيناريوهات مستقبلية'],
          economy: ['نمو اقتصادي', 'تضخم', 'أسعار فائدة'],
          stocks: ['أسهم أمريكية', 'أسهم أوروبية', 'أسهم آسيوية'],
          forex: ['يورو/دولار', 'جنيه/دولار', 'ين/دولار'],
          crypto: ['بيتكوين', 'إيثيريوم', 'عملات رقمية'],
          energy: ['نفط', 'غاز', 'طاقة متجددة'],
          commodities: ['ذهب', 'فضة', 'سلع'],
          realEstate: ['عقارات سكنية', 'عقارات تجارية'],
          banking: ['بنوك تقليدية', 'بنوك إسلامية'],
          bonds: ['سندات حكومية', 'سندات شركات'],
          technicalAnalysis: ['فوركس', 'عملات رقمية', 'ذهب ونفط', 'أسهم عالمية'],
          arabMarkets: ['أسواق عربية', 'تداول خليجي'],
          earnings: ['أرباح شركات', 'نتائج مالية'],
        };
        sectors = classToSector[assetClass] || [assetClass];
      }

      // Determine proper scope
      const assetClassToScope: Record<string, string> = {
        strategic: 'strategic', economy: 'economy', stocks: 'stocks', commodities: 'commodities',
        forex: 'forex', crypto: 'crypto', bonds: 'bonds',
        energy: 'energy', realEstate: 'realEstate', banking: 'banking',
        technicalAnalysis: 'technicalAnalysis', arabMarkets: 'arabMarkets', earnings: 'earnings',
      };
      const analysisScope = assetClassToScope[assetClass] || 'global';

      // Build the structured content JSON for ReportDetailClient
      const structuredContent = JSON.stringify({
        sections: processed.sections,
        metadata: processed.metadata,
        dataQuality: processed.dataQuality,
      });

      report = {
        id: analysis.id,
        title: analysis.title,
        slug: analysis.slug,
        summary: processed.summary,
        content: structuredContent,
        reportType: 'analysis',
        scope: analysisScope,
        sectors: JSON.stringify(sectors),
        countries: '[]',
        keyIndicators: JSON.stringify(parsedIndicators),
        sourceUrls: JSON.stringify(analysis.relatedNewsIds ? safeParse(analysis.relatedNewsIds, []) : []),
        marketImpact: analysis.sentiment || 'neutral',
        confidenceScore: analysis.confidenceScore,
        imageUrl: null,
        isPublished: analysis.isPublished,
        publishedAt: analysis.publishedAt,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      } as any;
      console.log('[AR Report] MarketAnalysis processing succeeded, report built');
      } catch (analysisErr) {
        console.error('[AR Report] ERROR during MarketAnalysis processing:', analysisErr);
        throw analysisErr;
      }
    }
  }

  // ─── Process EconomicReport content ─────────────────────────
  // EconomicReport content is stored as JSON with sections, just like
  // MarketAnalysis, but we were NOT processing it before — just
  // passing it raw. Now we process it the same way.
  if (!isAnalysis && report) {
    // Process the EconomicReport's content through the same pipeline
    const processed = processContent(report.content || '{}');
    
    // Check if we have meaningful content — need at least 2 sections with real text (>80 chars)
    const sectionsWithContent = Object.values(processed.sections)
      .filter(v => typeof v === 'string' && v.trim().length > 80);
    const hasContent = sectionsWithContent.length >= 2;
    
    if (hasContent) {
      // Rebuild the content as properly structured JSON
      (report as any).content = JSON.stringify({
        sections: processed.sections,
        metadata: processed.metadata,
        dataQuality: processed.dataQuality,
      });
      
      // V225: Always update summary with the best available section content.
      // Old reports may have summaries built from wrong sections (e.g., 'context'
      // instead of 'introduction') or truncated mid-word. The processed.summary
      // is always built from the best available section with smart truncation.
      (report as any).summary = processed.summary;
    } else {
      // Content is sparse — generate fallback content from report metadata
      const fallback = generateFallbackContent({
        assetClass: report.scope || 'economy',
        sentiment: (report as any).marketImpact || 'neutral',
        confidenceScore: report.confidenceScore || 50,
        riskLevel: 'medium',
        title: report.title,
      });
      
      // Merge: keep any existing sections, add fallback for missing ones
      for (const [key, value] of Object.entries(fallback.sections)) {
        if (!processed.sections[key] || processed.sections[key].trim().length < 80) {
          processed.sections[key] = value;
        }
      }
      if (fallback.highlights.length > 0) {
        processed.sections.highlights = JSON.stringify(fallback.highlights);
      }
      
      // Also use raw summary if available
      if (report.summary && report.summary.trim().length > 20 && !processed.sections.overview) {
        processed.sections.overview = report.summary;
      }
      
      (report as any).content = JSON.stringify({
        sections: processed.sections,
        metadata: processed.metadata,
        dataQuality: processed.dataQuality,
      });
      
      if (!report.summary || report.summary.trim().length < 10) {
        (report as any).summary = processed.sections.introduction || processed.sections.overview
          || fallback.sections.overview?.slice(0, 300) || '';
      }
    }

    // V202: Always strip markdown headings from summary
    if (report.summary) {
      const trimmedSummary = report.summary.trim();
      if (trimmedSummary.startsWith('{') || trimmedSummary.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmedSummary);
          // Extract first long string value from the JSON
          const extractFirst = (obj: any): string => {
            if (typeof obj === 'string') return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const val of Object.values(obj)) {
                if (typeof val === 'string' && val.length > 20) return val;
                const nested = extractFirst(val);
                if (nested) return nested;
              }
            }
            return '';
          };
          const extracted = extractFirst(parsed);
          if (extracted) (report as any).summary = stripSummaryMarkdown(extracted);
        } catch {
          // Not valid JSON, strip markdown from the raw text
          (report as any).summary = stripSummaryMarkdown(trimmedSummary);
        }
      } else {
        // V202: Strip markdown headings from plain text summary
        (report as any).summary = stripSummaryMarkdown(trimmedSummary);
      }
    }
  }

  if (!report) notFound();

  // ─── Locale redirect ──────────────────────────────────────────
  // If the report found is an English-locale report, redirect to the
  // English version of the page. This prevents English content from
  // appearing on the Arabic site.
  if ((report as any).locale === 'en') {
    redirect(`/en/reports/${report.slug}`);
  }
  // V350: Also redirect French reports to their proper locale path
  if ((report as any).locale === 'fr') {
    redirect(`/fr/reports/${report.slug}`);
  }

  // Fetch related from both EconomicReport and MarketAnalysis
  // V92: Increased take to 10 to allow for title-dedup filtering
  // IMPORTANT: Always use locale='ar' for related reports on the Arabic page
  // Even if the current report was found via locale fallback (e.g., an English report
  // with no Arabic version), the related reports shown to Arabic users must be Arabic.
  const [relatedReports, relatedAnalyses] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'ar', id: { not: report.id }, OR: [{ scope: report.scope }, { reportType: report.reportType }] },
      select: { id: true, title: true, slug: true, reportType: true, marketImpact: true, confidenceScore: true, publishedAt: true },
      take: 10,
      orderBy: { publishedAt: 'desc' },
    }),
    isAnalysis ? db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'ar', id: { not: report.id }, OR: [{ assetClass: (report as any).assetClass || 'economy' }] },
      select: { id: true, title: true, slug: true, sentiment: true, confidenceScore: true, publishedAt: true, assetClass: true },
      take: 10,
      orderBy: { publishedAt: 'desc' },
    }) : Promise.resolve([]),
  ]);

  // V92: Title-similarity deduplication — prevent same news appearing multiple times
  // Normalize Arabic title: remove diacritics, normalize whitespace, take first 30 chars
  const normalizeTitle = (t: string): string => {
    return t.trim()
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
      .replace(/\s+/g, ' ')
      .slice(0, 30);
  };

  // Merge and deduplicate related items by ID AND by title similarity
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const currentTitleNorm = normalizeTitle(report.title);
  seenTitles.add(currentTitleNorm); // Exclude reports with same topic as current

  const allRelated = [
    ...relatedReports.map(r => {
      seenIds.add(r.id);
      return { id: r.id, title: r.title, slug: r.slug, reportType: r.reportType, marketImpact: (r as any).marketImpact, confidenceScore: r.confidenceScore, publishedAt: r.publishedAt };
    }),
    ...relatedAnalyses.map((a: any) => {
      if (seenIds.has(a.id)) return null;
      seenIds.add(a.id);
      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        reportType: 'analysis',
        marketImpact: a.sentiment || 'neutral',
        confidenceScore: a.confidenceScore,
        publishedAt: a.publishedAt,
      };
    }).filter(Boolean) as { id: string; title: string; slug: string; reportType: string; marketImpact: string; confidenceScore: number; publishedAt: Date | null }[],
  ];

  // Filter by title similarity — keep only unique topics
  const related = allRelated.filter(item => {
    const norm = normalizeTitle(item.title);
    // Check if a similar title was already seen
    for (const seen of seenTitles) {
      // If first 30 chars match, it's likely the same topic
      if (norm === seen) return false;
      // Also check if 70%+ of words overlap (catches slight rewording)
      const normWords = new Set(norm.split(' ').filter(w => w.length > 2));
      const seenWords = new Set(seen.split(' ').filter(w => w.length > 2));
      if (normWords.size > 0 && seenWords.size > 0) {
        const intersection = new Set([...normWords].filter(w => seenWords.has(w)));
        const overlapRatio = intersection.size / Math.min(normWords.size, seenWords.size);
        if (overlapRatio >= 0.7) return false;
      }
    }
    seenTitles.add(norm);
    return true;
  }).slice(0, 6);

  const parsedReport = {
    id: report.id, title: report.title, slug: report.slug,
    summary: report.summary || '', content: report.content,
    reportType: report.reportType || 'daily', scope: report.scope || 'global',
    sectors: safeParse((report as any).sectors || '[]'),
    countries: safeParse((report as any).countries || '[]'),
    keyIndicators: safeParse((report as any).keyIndicators || '{}'),
    sourceUrls: safeParse(report.sourceUrls || '[]'),
    marketImpact: report.marketImpact || 'neutral',
    confidenceScore: report.confidenceScore || 50,
    imageUrl: report.imageUrl || undefined,
    isPublished: report.isPublished,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    isAnalysis,
  };

  const parsedRelated = related.map((r: any) => ({
    id: r.id, title: r.title, slug: r.slug,
    reportType: r.reportType || 'daily', marketImpact: r.marketImpact || 'neutral',
    confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt,
  }));

  console.log('[AR Report] SUCCESS — about to render ReportDetailClient. report.id:', parsedReport.id, 'related count:', parsedRelated.length, 'isAnalysis:', isAnalysis);
  return <ReportDetailClient report={parsedReport} related={parsedRelated} />;
  } catch (err) {
    // Re-throw Next.js notFound() errors so the 404 page renders correctly.
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;

    // CRITICAL: Next.js sanitizes errors thrown in Server Components in production —
    // err.message and err.stack will be EMPTY. We must dump everything we can here.
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('🚨🚨🚨 [AR REPORT PAGE] FATAL ERROR — slug:', slug, '🚨🚨🚨');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('1. typeof err:', typeof err);
    console.error('2. err instanceof Error:', err instanceof Error);
    console.error('3. err.name:', (err as any)?.name);
    console.error('4. err.message:', (err as any)?.message);
    console.error('5. err.stack:', (err as any)?.stack);
    console.error('6. err.digest:', (err as any)?.digest);
    console.error('7. err.cause:', (err as any)?.cause);
    console.error('8. err.toString():', String(err));
    try {
      console.error('9. JSON.stringify(err):', JSON.stringify(err, null, 2));
    } catch (e) {
      console.error('9. JSON.stringify failed:', e);
    }
    console.error('10. Object.keys(err):', Object.keys(err as object));
    console.error('11. ALL enumerable props:');
    try {
      for (const [k, v] of Object.entries(err as object)) {
        console.error(`    ${k}:`, v);
      }
    } catch (e) {
      console.error('    (failed to enumerate)', e);
    }
    console.error('12. Full err object (raw):', err);
    console.error('═══════════════════════════════════════════════════════════════');
    return ReportLoadError(slug, err) as unknown as JSX.Element;
  }
}
