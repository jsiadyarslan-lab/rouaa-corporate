// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// Patent Pending: "System and Method for Automated Financial News
// Classification Based on Tradability Potential" (4-Gate System)
// ═══════════════════════════════════════════════════════════════
// ─── Pipeline Analyzer Agent V91 — Four Gates System ──────────
// V91: Macro economic news — affected assets enhancement:
//   - NEW: Macro economic news (unemployment, CPI, NFP, GDP, Fed rates) now list
//     USD/DXY, Treasury bonds (TNX/TLT), Gold (XAUUSD/GLD) as directly affected assets
//   - NEW: Gate 1 [B] now explicitly instructs to include macro-affected assets in [2] and [3]
//   - NEW: Section [2] has specific guidance per macro data type (jobs → USD, CPI → bonds, etc.)
//   - NEW: Section [3] has downstream asset examples (rate-sensitive, growth/value, defensive)
//   - NEW: Gate 4 checks for macro asset coverage in [2] and [3]
//   - Core principle: "خبر البطالة لا يعني 'لا ينطبق' — الدولار والذهب والسندات أصول حقيقية!"
// V90: Crypto/ETF path promotion + sector auto-fix + recommendation truncation recovery:
//   - NEW: Bitcoin/crypto ETF tickers (IBIT, FBTC, ARKB, BITB...) added to KNOWN_GLOBAL_TICKERS
//   - NEW: Coinbase (COIN), MicroStrategy (MSTR) added to KNOWN_GLOBAL_TICKERS
//   - NEW: Crypto/ETF keyword detection promotes path [B] → [A] (like trade/tariff promotion)
//   - NEW: Sector auto-fix to "أصول رقمية" for crypto/Bitcoin/ETF articles
//   - NEW: Recommendation truncation recovery — detects and removes truncated sentences
//   - NEW: Publisher now checks fullContent + recommendation for truncated sentences
//   - Core principle: "إذا ذُكرت رموز بورصية حقيقية → المسار [A] وليس [B]"
// Generates AI financial analysis in Arabic for an article.
// V88: Deduplication + title formatting + Gate 4 code validation:
//   - NEW: deduplicateArabicText() — removes repeated sentences (Barclays problem)
//   - NEW: fixMixedArabicTitle() — fixes mixed English/Latin in Arabic titles (باركلAYS)
//   - NEW: Gate 4 code-level fabricated number detection in recommendations
//   - NEW: Gate 4 code-level check — if fullContent says "غير كافية" but recommendation
//     has specific price targets → DANGEROUS contradiction, auto-fix
//   - Core principle: "سطران من الكود يحلان مشكلة التنظيف"
// V87: Target audience detection + credit score topic preservation:
//   - NEW: Gate 2 now detects target audience (consumer vs corporate) BEFORE translation
//   - NEW: Personal finance articles (credit score, budgeting, personal loans) are preserved
//     as consumer-oriented — NOT converted to corporate financial analysis
//   - NEW: "credit score" = درجة الائتمان (NOT سجل مالي! — catastrophic topic shift)
//   - NEW: Gate 1 recognizes "تمويل شخصي / ثقافة مالية" as a valid sector
//   - NEW: Gate 4 checks topic fidelity — does the Arabic preserve the original subject?
//   - NEW: Post-processing detects consumer-to-corporate topic transformation
//   - Core principle: "الترجمة يجب أن تحفظ الموضوع، لا أن تغيّره"
// V76: Path [C] overhaul + translation fixes based on tech stocks article audit:
//   - NEW: Path [C] (scarce info) produces MINIMAL analysis (2 sections only, not 6)
//     - The old 6-section forced structure caused broken, repetitive, fabricated analysis
//     - "التحليل الفارغ أسوأ من غياب التحليل" — empty analysis is worse than no analysis
//   - NEW: chips (semiconductor) = رقائق إلكترونية — NOT هشامات (catastrophic mistranslation)
//   - NEW: sesión (Spanish) added to foreign word patterns
//   - NEW: Inverted economic logic detection (production cut → price drop = contradiction)
//   - NEW: Duplicate section number detection ([5] appearing twice)
//   - NEW: Generic worthless recommendation detection ("يتناسب مع رغباتك" etc.)
//   - NEW: dollar/dinar translation fix (دينار → دولار when context is US market)
// V75: Anti-hallucination overhaul — ADAPTIVE content length:
//   - editedArticle adapts to source length (1-4 paragraphs)
//   - Commodity ticker auto-detection for oil/gold/energy articles
//   - Core principle: "لا تطلب من النموذج أكثر مما يعرف"
//   - Short honest analysis > long fabricated analysis
// V74: Critical fixes based on Samsung $1T article audit:
//   - NEW: Sentiment-recommendation validation layer — prevents contradictory
//     recommendations (sell on positive news, buy on negative news)
//   - NEW: Market-cap stop-loss detection — prevents stop-loss in market cap terms
//   - NEW: Path [C] + recommendation contradiction fix
//   - NEW: Known global tickers database (Samsung 005930.KS, TSMC 2330.TW etc.)
//   - NEW: Temporal accuracy enforcement ("الربع الأول" vs "العام الماضي")
//   - Gate 3: Recommendation MUST align with sentiment direction
//   - Gate 3: Stop-loss MUST be in per-share price, not market cap
//   - Gate 4: Validate sentiment-recommendation alignment before output
//
// V73: Post-processing cleanup, trade news path promotion, foreign word removal
// V72: English fallback and translation quality fixes
// V71: Production quality audit fixes
// V70: Four Gates (البوابات الأربع) system
// V55: NEVER let articles get permanently stuck at analysis stage.
// V38: Analysis is MANDATORY for publishing.
// V38: DB write is SYNCHRONOUS — no more fire-and-forget race conditions.

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { PIPELINE_CONFIG } from '../config';
import { ProcessingStage } from '../queue/job-types';

export interface AnalysisResult {
  articleId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// Forbidden phrases to auto-remove from AI output
const FORBIDDEN_PHRASES = [
  // Vague/generic investor advice
  'يجب على المستثمرين',
  'ينبغي مراعاة',
  'تجدر الإشارة إلى أنه',
  'يجب على المستثمر',
  'ينبغي على المستثمرين',
  'تجدر الإشارة إلى أن',
  'مراعاة التوترات',
  'مراعاة الظروف',
  'مراعاة التطورات',
  'ينبغي الحذر',
  'يجب الحذر',
  // V73: Informal openings carried from source style (Forexlive etc.)
  'حسناً.',
  'حسناً',
  'حسنا.',
  'حسنًا.',
  'حسنًا',
  'إذن.',
  'إذن',
  'الآن إذن',
  'طبعاً.',
  'طبعاً',
  'بالتأكيد.',
  'بالتأكيد',
];

// V73: Vague/non-tradeable asset names to filter from affectedAssets
const VAGUE_ASSET_PATTERNS = [
  /العلاقات التجارية/i,
  /الاقتصاد العالمي/i,
  /السوق العالمي/i,
  /التجارة العالمية/i,
  /الاقتصاد الكلي/i,
  /الأسواق المالية/i,
  /الأسواق العالمية/i,
  /القطاع المالي/i,
  /العلاقات الدولية/i,
  /التوترات التجارية/i,
  /الحرب التجارية/i,
  /التجارة الدولية/i,
  /النظام المالي/i,
  /سلسلة التوريد/i,  // Too vague unless specific company
];

// V73: Common foreign (non-Arabic, non-English-financial) words that leak into Arabic text
// These come from AI hallucinating words in intermediate languages (Spanish, French, etc.)
const FOREIGN_WORD_PATTERNS: [RegExp, string][] = [
  [/(\s)para(\s)/g, '$1من أجل$2'],  // Spanish "para" → Arabic
  [/(\s)pero(\s)/g, '$1لكن$2'],    // Spanish "pero"
  [/(\s)sin(\s)/g, '$1بدون$2'],    // Spanish "sin" (only standalone)
  [/(\s)como(\s)/g, '$1كـ$2'],     // Spanish/Italian "como"
  [/(\s)avec(\s)/g, '$1مع$2'],     // French "avec"
  [/(\s)dans(\s)/g, '$1في$2'],     // French "dans"
  [/(\s)pour(\s)/g, '$1لـ$2'],     // French "pour"
  [/(\s)entre(\s)/g, '$1بين$2'],   // French/Spanish "entre"
  // V76: More Spanish/French words that leak into Arabic text
  [/sesión/gi, 'جلسة'],              // Spanish "sesión" = session
  [/sesiones/gi, 'جلسات'],           // Spanish plural
  [/(\s)su(\s)/g, '$1له$2'],       // Spanish "su" = his/her
  [/(\s)muy(\s)/g, '$1جداً$2'],     // Spanish "muy" = very
  [/(\s)más(\s)/g, '$1أكثر$2'],    // Spanish "más" = more
  [/(\s)donde(\s)/g, '$1حيث$2'],   // Spanish "donde" = where
  [/(\s)desde(\s)/g, '$1منذ$2'],   // Spanish "desde" = since
  [/(\s)también(\s)/g, '$1أيضاً$2'], // Spanish "también" = also
  [/(\s)porque(\s)/g, '$1لأن$2'],   // Spanish "porque" = because
];

// V74: Known global tickers for major companies — used when AI says "لا رمز واضح"
// These are the most commonly referenced companies in financial news
const KNOWN_GLOBAL_TICKERS: Record<string, { ticker: string; exchange: string; nameAr: string }> = {
  // Korean
  'samsung': { ticker: '005930.KS', exchange: 'KRX', nameAr: 'سامسونج إلكترونيكس (005930.KS)' },
  'samsung electronics': { ticker: '005930.KS', exchange: 'KRX', nameAr: 'سامسونج إلكترونيكس (005930.KS)' },
  // Taiwan
  'tsmc': { ticker: '2330.TW', exchange: 'TWSE', nameAr: 'تي إس إم سي (2330.TW)' },
  'taiwan semiconductor': { ticker: '2330.TW', exchange: 'TWSE', nameAr: 'تي إس إم سي (2330.TW)' },
  // Chinese
  'alibaba': { ticker: 'BABA', exchange: 'NYSE', nameAr: 'علي بابة (BABA)' },
  'tencent': { ticker: '0700.HK', exchange: 'HKEX', nameAr: 'تنسنت (0700.HK)' },
  'byd': { ticker: '1211.HK', exchange: 'HKEX', nameAr: 'بي واي دي (1211.HK)' },
  // Japanese
  'toyota': { ticker: '7203.T', exchange: 'TSE', nameAr: 'تويوتا (7203.T)' },
  'sony': { ticker: '6758.T', exchange: 'TSE', nameAr: 'سوني (6758.T)' },
  'nintendo': { ticker: '7974.T', exchange: 'TSE', nameAr: 'نينتندو (7974.T)' },
  // European
  'asml': { ticker: 'ASML', exchange: 'Euronext', nameAr: 'إيه إس إم إل (ASML)' },
  'novo nordisk': { ticker: 'NVO', exchange: 'NYSE', nameAr: 'نوفو نورديسك (NVO)' },
  'lvmh': { ticker: 'MC.PA', exchange: 'Euronext Paris', nameAr: 'إل في إم إتش (MC.PA)' },
  'sap': { ticker: 'SAP', exchange: 'XETRA', nameAr: 'ساب (SAP)' },
  // Indian
  'reliance': { ticker: 'RELIANCE.NS', exchange: 'NSE', nameAr: 'ريليانس (RELIANCE.NS)' },
  'tata': { ticker: 'TATAMOTORS.NS', exchange: 'NSE', nameAr: 'تاتا موتورز (TATAMOTORS.NS)' },
  // American mega-caps (backup)
  'apple': { ticker: 'AAPL', exchange: 'NASDAQ', nameAr: 'أبل (AAPL)' },
  'microsoft': { ticker: 'MSFT', exchange: 'NASDAQ', nameAr: 'مايكروسوفت (MSFT)' },
  'nvidia': { ticker: 'NVDA', exchange: 'NASDAQ', nameAr: 'إنفيديا (NVDA)' },
  'amazon': { ticker: 'AMZN', exchange: 'NASDAQ', nameAr: 'أمازون (AMZN)' },
  'google': { ticker: 'GOOGL', exchange: 'NASDAQ', nameAr: 'ألفابت (GOOGL)' },
  'alphabet': { ticker: 'GOOGL', exchange: 'NASDAQ', nameAr: 'ألفابت (GOOGL)' },
  'meta': { ticker: 'META', exchange: 'NASDAQ', nameAr: 'ميتا (META)' },
  'tesla': { ticker: 'TSLA', exchange: 'NASDAQ', nameAr: 'تيسلا (TSLA)' },
  // Korean tech
  'sk hynix': { ticker: '000660.KS', exchange: 'KRX', nameAr: 'إس كي هينيكس (000660.KS)' },
  // Pharma
  'pfizer': { ticker: 'PFE', exchange: 'NYSE', nameAr: 'فايزر (PFE)' },
  'eli lilly': { ticker: 'LLY', exchange: 'NYSE', nameAr: 'إيلي ليلي (LLY)' },
  // V76: Chip/semiconductor companies (frequently miscategorized)
  'amd': { ticker: 'AMD', exchange: 'NASDAQ', nameAr: 'أم دي (AMD)' },
  'intel': { ticker: 'INTC', exchange: 'NASDAQ', nameAr: 'إنتل (INTC)' },
  'qualcomm': { ticker: 'QCOM', exchange: 'NASDAQ', nameAr: 'كوالكوم (QCOM)' },
  'broadcom': { ticker: 'AVGO', exchange: 'NASDAQ', nameAr: 'برودكوم (AVGO)' },
  'texas instruments': { ticker: 'TXN', exchange: 'NASDAQ', nameAr: 'تكساس إنسترومنتس (TXN)' },
  'micron': { ticker: 'MU', exchange: 'NASDAQ', nameAr: 'مايكرون (MU)' },
  'applied materials': { ticker: 'AMAT', exchange: 'NASDAQ', nameAr: 'أبلايد ماتيريالز (AMAT)' },
  'lam research': { ticker: 'LRCX', exchange: 'NASDAQ', nameAr: 'لام ريسيرتش (LRCX)' },
  'kLA-tencor': { ticker: 'KLAC', exchange: 'NASDAQ', nameAr: 'كي إل إيه (KLAC)' },
  'marvell': { ticker: 'MRVL', exchange: 'NASDAQ', nameAr: 'مارفل (MRVL)' },
  // V76: Major ETFs (frequently mentioned)
  'spdr s&p 500': { ticker: 'SPY', exchange: 'NYSE', nameAr: 'إس بي واي (SPY)' },
  'nasdaq 100 etf': { ticker: 'QQQ', exchange: 'NASDAQ', nameAr: 'كيو كيو كيو (QQQ)' },
  'russell 2000 etf': { ticker: 'IWM', exchange: 'NYSE', nameAr: 'آي دبليو إم (IWM)' },
  // V90: Crypto-related companies & Bitcoin ETFs (frequently miscategorized as macro)
  'coinbase': { ticker: 'COIN', exchange: 'NASDAQ', nameAr: 'كوينبيس (COIN)' },
  'microstrategy': { ticker: 'MSTR', exchange: 'NASDAQ', nameAr: 'مايكروستراتيجي (MSTR)' },
  'robinhood': { ticker: 'HOOD', exchange: 'NASDAQ', nameAr: 'روبنهود (HOOD)' },
  'block inc': { ticker: 'XYZ', exchange: 'NYSE', nameAr: 'بلوك (XYZ)' },
  'marathon digital': { ticker: 'MARA', exchange: 'NASDAQ', nameAr: 'ماراثون ديجيتال (MARA)' },
  'riot platforms': { ticker: 'RIOT', exchange: 'NASDAQ', nameAr: 'ريوت بلاتفورمز (RIOT)' },
  'cleanspark': { ticker: 'CLSK', exchange: 'NASDAQ', nameAr: 'كلين سبورك (CLSK)' },
  // V90: Spot Bitcoin ETFs — these are MAJOR tradeable assets on NASDAQ/NYSE
  'ishares bitcoin trust': { ticker: 'IBIT', exchange: 'NASDAQ', nameAr: 'آي بي آي تي — صندوق بلاك روك للبيتكوين (IBIT)' },
  'fidelity wise origin bitcoin': { ticker: 'FBTC', exchange: 'NASDAQ', nameAr: 'إف بي تي سي — صندوق فيديلتي للبيتكوين (FBTC)' },
  'ark 21shares bitcoin etf': { ticker: 'ARKB', exchange: 'NASDAQ', nameAr: 'آر كيه بي — صندوق أرك للبيتكوين (ARKB)' },
  'bitwise bitcoin etf': { ticker: 'BITB', exchange: 'NASDAQ', nameAr: 'بيت ب — صندوق بتوايز للبيتكوين (BITB)' },
  'franklin bitcoin etf': { ticker: 'EZBC', exchange: 'NASDAQ', nameAr: 'إي زد بي سي — صندوق فرانكلين للبيتكوين (EZBC)' },
  'vaneck bitcoin trust': { ticker: 'HODL', exchange: 'NASDAQ', nameAr: 'هودل — صندوق فانيك للبيتكوين (HODL)' },
  'gravislde bitcoin trust': { ticker: 'GBTC', exchange: 'NYSE', nameAr: 'جي بي تي سي — صندوق غراي سكيل للبيتكوين (GBTC)' },
  'jpmorgan bitcoin etf': { ticker: 'JBET', exchange: 'NASDAQ', nameAr: 'جي بي إي تي — صندوق جي بي مورغان للبيتكوين (JBET)' },
  // V90: Spot Ethereum ETFs
  'ishares ethereum trust': { ticker: 'ETHA', exchange: 'NASDAQ', nameAr: 'إي تي إتش إيه — صندوق بلاك روك للإيثريوم (ETHA)' },
  'fidelity ethereum fund': { ticker: 'FETH', exchange: 'NASDAQ', nameAr: 'إف إي تي إتش — صندوق فيديلتي للإيثريوم (FETH)' },
  'grayscale ethereum trust': { ticker: 'ETHE', exchange: 'NYSE', nameAr: 'إي تي إتش إي — صندوق غراي سكيل للإيثريوم (ETHE)' },
};

// V74: Sell/buy keywords in Arabic recommendations — used for sentiment validation
const SELL_KEYWORDS_AR = [
  'مركز بيعي', 'بيع', 'بيعي', 'short', 'شارت', 'تشميل', 'قم بالبيع',
  'استهدف الانخفاض', 'اتخذ مركز بيعي', 'بيع على المكشوف',
];
const BUY_KEYWORDS_AR = [
  'مركز شرائي', 'شراء', 'شرائي', 'long', 'قم بالشراء',
  'استهدف الارتفاع', 'اتخذ مركز شرائي', 'اشترِ',
];

// V71: Common mistranslations to auto-fix in post-processing
const TRANSLATION_FIXES: [RegExp, string][] = [
  // "أسهم النفط" is WRONG — oil doesn't have shares, it has futures/contracts
  [/أسهم النفط/g, 'عقود النفط الآجلة'],
  [/أسهم النفط الخام/g, 'عقود النفط الخام الآجلة'],
  [/أسهم الذهب/g, 'عقود الذهب الآجلة'],
  [/أسهم السلع/g, 'عقود السلع الآجلة'],
  // "تليق" is a typo — should be "يؤدي إلى" or "يليق"
  [/تليق بزيادة/g, 'يؤدي إلى زيادة'],
  [/تليق بانخفاض/g, 'يؤدي إلى انخفاض'],
  [/تليق ب/g, 'يؤدي إلى'],
  // V73: Trade/commerce terms
  [/اتفاقية تجارية حرة/g, 'اتفاقية تجارة حرة'],
  [/رسوم جمركية/g, 'تعريفات جمركية'],  // tariffs
  [/ضرائب استيراد/g, 'تعريفات استيراد'],
  // V76: chips (semiconductor) = رقائق إلكترونية — NOT هشامات!
  // "هشامات" is a catastrophic mistranslation of "chips" in tech context
  [/الهشامات/g, 'الرقائق الإلكترونية'],
  [/هشامات/g, 'رقائق إلكترونية'],
  // V76: Grammar fix — "بعد تعلن" should be "بعد أن تعلن" or "بعد أن أعلن"
  [/بعد تعلن/g, 'بعد أن أعلن'],
  // V76: dinar → dollar fix for US market context
  // This is context-dependent but common mistranslation
  [/دينار أمريكي/g, 'دولار أمريكي'],
  // V84: Spanish words leaking into Arabic text — common AI translation artifact
  [/sesión/gi, 'جلسة'],
  [/sesiones/gi, 'جلسات'],
  [/para\s+(?![مأإ])/g, 'من أجل '],  // Spanish "para" not followed by Arabic أ/م/إ
  [/pero/gi, 'لكن'],
  [/porque/gi, 'لأن'],
  [/también/gi, 'أيضاً'],
  [/entonces/gi, 'حينها'],
  [/aunque/gi, 'رغم'],
  [/mientras/gi, 'بينما'],
  // V84: More common mistranslations
  [/الإيورو/g, 'اليورو'],
  [/الجنيه البريطاني/g, 'الجنيه الإسترليني'],
  // V85: "ضوء اليوم" = literal mistranslation of "Highlight"
  [/ضوء اليوم/g, 'أبرز الأحداث'],
  [/أضواء اليوم/g, 'أبرز الأحداث'],
  // V85: English sentiment labels in Arabic text
  [/\(neutral\)/g, '(محايد)'],
  [/\(positive\)/g, '(إيجابي)'],
  [/\(negative\)/g, '(سلبي)'],
  [/\(bullish\)/g, '(صعودي)'],
  [/\(bearish\)/g, '(هبوطي)'],
  // V86: "الماصة" is a catastrophic mistranslation of "synthetic" (as in synthetic stock tokens)
  // Correct Arabic: اصطناعية (synthetic), NOT ماصة (absorbent/sucking)
  [/الماصة/g, 'الاصطناعية'],
  [/التokens/g, 'التوكنات'],
  [/تokens/g, 'توكنات'],
  // V86: Common crypto/fintech terminology mistranslations
  [/توكن الاصطناعية/g, 'التوكنات الاصطناعية'],
  [/رموز الاصطناعية/g, 'الرموز الاصطناعية'],
  [/التوكنات الماصة/g, 'التوكنات الاصطناعية'],  // Fix if both errors combine
  [/رموز الماصة/g, 'الرموز الاصطناعية'],
  // V86: Fix "retail traders" mistranslation — should be المتداولون الأفراد not المستهلكين
  [/المستهلكين(?=.*تداول|متداول)/g, 'المتداولين الأفراد'],
  // V87: Fix "credit score" catastrophic mistranslation — the WORST kind of error:
  // "credit score" = درجة الائتمان الشخصية (personal credit rating for individuals)
  // NOT سجل مالي (financial record — this transforms the ENTIRE topic from personal to corporate!)
  // This single mistranslation caused the system to analyze a consumer article as corporate finance
  [/السجل المالي للشركات/g, 'درجة الائتمان الشخصية'],
  [/سجلات? المالية للشركات/g, 'درجات الائتمان الشخصية'],
  [/السجلات المالية/g, 'درجات الائتمان الشخصية'],
  [/السجل المالي/g, 'درجة الائتمان الشخصية'],
  [/سجل مالي/g, 'درجة ائتمان شخصية'],
  // V87: More personal finance terminology fixes
  [/credit score/gi, 'درجة الائتمان'],
  [/credit rating/gi, 'تصنيف ائتماني'],
  // V87: Fix corporate terms used in personal finance context
  // When article is about individuals, "إيرادات" should be "دخل" and "تكاليف الإنتاج" is wrong
  [/إيرادات(?=.*درجة الائتمان)/g, 'دخل'],
  [/تكاليف الإنتاج(?=.*درجة الائتمان)/g, 'المصاريف الشخصية'],
];

// V70.1: Patterns that indicate AI replaced a company name with a generic placeholder
const COMPANY_NAME_PLACEHOLDERS = [
  /شركة ما/g,
  /شخص ما/g,
  /جهة ما/g,
  /كيان ما/g,
  /مؤسسة ما/g,
  /منظمة ما/g,
];

// V71: Geographic features that are NOT financial assets — filter from affectedAssets
const GEOGRAPHIC_NON_ASSETS = [
  /مضيق/i,       // Strait (e.g., Strait of Hormuz)
  /قناة/i,       // Canal (e.g., Suez Canal)
  /بحر/i,        // Sea
  /محيط/i,       // Ocean
  /نهر/i,        // River
  /ميناء/i,      // Port (as a location, not a company)
  /دولة/i,       // Country
  /إقليم/i,      // Region
  /جزيرة/i,      // Island
  /حدود/i,       // Border
];

// Commodity symbols that ARE tradeable — used for path [A] validation
const COMMODITY_SYMBOLS = [
  'CL', 'WTI', 'BZ', 'BRENT', 'NG', 'RB', 'HO',  // Oil & Energy futures
  'GC', 'XAUUSD', 'SI', 'XAGUSD', 'PL', 'PA',      // Precious metals
  'HG', 'ZC', 'ZW', 'ZS', 'KC', 'SB', 'CT', 'LBS', // Other commodities
  'USO', 'GLD', 'SLV', 'USL', 'UGA', 'CORN', 'WEAT', 'SOYB', 'CANE', // Commodity ETFs
];

// Macro indices allowed for path [B] affectedAssets
const MACRO_INDEX_SYMBOLS = [
  'DXY', 'SPX', 'SPY', 'NDX', 'QQQ', 'GOLD', 'XAUUSD', 'OIL', 'CL', 'WTI', 'BZ',
  'VIX', 'TNX', 'TLT', 'HYG', 'LQD', 'EEM', 'DIA', 'IWM', 'USO', 'GLD',
  'SLV', 'USDEUR', 'EURUSD', 'USDJPY', 'GBPUSD', 'USDCNY', 'BTC', 'ETH',
];

// V90: Crypto/Bitcoin/ETF keywords that indicate path [A] (tradeable assets)
// Articles mentioning these should NEVER be classified as "اقتصادي كلي" (path [B])
const CRYPTO_ETF_KEYWORDS_EN = [
  'bitcoin etf', 'ethereum etf', 'crypto etf', 'spot bitcoin', 'spot ethereum',
  'btc etf', 'eth etf', 'digital asset etf',
  'ibit', 'fbtc', 'arkb', 'bitb', 'ezbc', 'hodl', 'gbtc', 'brrr',
  'etha', 'feth', 'ethe',
  'coinbase', 'microstrategy', 'mstr',
  'bitcoin custody', 'crypto custody', 'digital asset custody',
  'crypto trading', 'bitcoin trading', 'digital asset trading',
  'crypto advisor', 'bitcoin advisor', 'crypto adoption',
  'crypto etf inflow', 'bitcoin etf inflow', 'btc inflow',
  'spot crypto', 'crypto spot',
];

const CRYPTO_ETF_KEYWORDS_AR = [
  'صناديق البيتكوين', 'صناديق الإيثريوم', 'صناديق العملات المشفرة',
  'بيتكوين المتداولة', 'إيثريوم المتداولة',
  'أصول رقمية', 'أصل رقمي',
  'صندوق بلاك روك للبيتكوين', 'صندوق فيديلتي للبيتكوين',
  'حفظ البيتكوين', 'حفظ العملات المشفرة',
  'تبني العملات المشفرة', 'تداول العملات المشفرة',
];

// V88: Deduplicate Arabic text — removes repeated sentences that convey the same idea
// This happens when the AI source has repetition and the model copies it verbatim
// instead of condensing. Example: same Barclays quote appearing 4-6 times.
// Core principle: "كل جملة تضيف معلومة جديدة أو تُحذف"
function deduplicateArabicText(text: string): string {
  if (!text || text.length < 50) return text;

  // Split text into sentences (by Arabic and English sentence terminators)
  const sentenceEnders = /[.؟!؛]+/;
  const rawParts = text.split(sentenceEnders);

  // Track seen sentences by their normalized form (whitespace + punctuation collapsed)
  const seen = new Map<string, string>(); // normalized → original
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      // Keep short fragments (section numbers, etc.)
      result.push(trimmed);
      continue;
    }

    // Normalize: collapse whitespace, remove diacritics for comparison
    const normalized = trimmed
      .replace(/\s+/g, ' ')
      .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
      .trim();

    // Check if we've seen a very similar sentence
    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      // Quick length check first
      if (Math.abs(existingNorm.length - normalized.length) > normalized.length * 0.4) continue;

      // Calculate similarity using common words overlap
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccardSimilarity = union > 0 ? intersection / union : 0;

      // If >75% word overlap, it's essentially the same idea
      if (jaccardSimilarity > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      console.warn(`[Analyzer V88] Removed duplicate sentence: "${trimmed.slice(0, 60)}..."`);
    } else {
      seen.set(normalized, trimmed);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// V88: Fix mixed Arabic/Latin title — detects and fixes titles like "باركلAYS"
// where the AI left English suffixes in an Arabic title.
// Strategy: If a title has isolated Latin character runs inside Arabic text,
// those are likely transcription artifacts that need cleanup.
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

function fixMixedArabicTitle(title: string): string {
  if (!title || typeof title !== 'string') return title;

  // Check if title has Arabic characters (it should be an Arabic title)
  const hasArabic = /[\u0600-\u06FF]/.test(title);
  if (!hasArabic) return title; // Pure English title — not our concern

  // Check if title has Latin characters mixed in
  const hasMixedLatin = /[a-zA-Z]{2,}/.test(title);
  if (!hasMixedLatin) return title; // No mixed Latin — fine

  // Valid financial abbreviations that should be preserved as-is
  const validAbbreviations = new Set([
    'GDP', 'S&P', 'AI', 'ETF', 'IPO', 'OTC', 'EPS', 'PE', 'EBITDA',
    'NYMEX', 'COMEX', 'ICE', 'NYSE', 'NASDAQ', 'LSE', 'TSE', 'ASX',
    'CME', 'CBOT', 'FOMC', 'CPI', 'PMI', 'FBI', 'CEO', 'CFO',
    'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
    'WTI', 'BZ', 'CL', 'NG', 'GC', 'SI', 'XAU', 'XAG',
    'VIX', 'DXY', 'SPX', 'NDX', 'DAX', 'CAC', 'FTSE', 'NKY',
    'BTC', 'ETH', 'USDT', 'USDC',
    'HSBC', 'FED', 'OPEC', 'IMF', 'WHO', 'WTO',
    'RSI', 'MACD', 'EMA', 'SMA',
  ]);

  let fixedTitle = title;

  // Step 1: Try to transliterate known company names first (V89)
  // "باركلAYS" → "باركليز" (not "باركل" — broken!)
  const sortedCompanyNames = Object.keys(COMPANY_TRANSLITERATIONS)
    .sort((a, b) => b.length - a.length); // Longer matches first

  for (const engName of sortedCompanyNames) {
    const araName = COMPANY_TRANSLITERATIONS[engName];
    if (new RegExp(engName, 'i').test(fixedTitle)) {
      fixedTitle = fixedTitle.replace(new RegExp(engName, 'gi'), araName);
      console.log(`[Analyzer V89] Transliterated "${engName}" → "${araName}" in title`);
    }
  }

  // Step 2: For remaining Latin runs attached to Arabic (not matched by dictionary)
  const latinRuns = fixedTitle.match(/[a-zA-Z]+/g) || [];

  for (const run of latinRuns) {
    const runUpper = run.toUpperCase();

    // Check if it's a valid financial abbreviation (with preceding space or parenthesis)
    const isValidAbbr = validAbbreviations.has(runUpper);

    // Check if it's at word boundary (preceded by space or parenthesis) — that's OK
    const isAtWordBoundary = new RegExp(`(?:\\s|\\(|\\))${run}(?:\\s|\\)|\\.|$)`).test(fixedTitle);

    // Check if it's attached to Arabic characters (like باركلAYS) — that's the problem
    const isAttachedToArabic = new RegExp(`[\\u0600-\\u06FF]${run}|${run}[\\u0600-\\u06FF]`).test(fixedTitle);

    if (isAttachedToArabic && !isValidAbbr) {
      // This Latin run is embedded inside Arabic text — remove it
      fixedTitle = fixedTitle.replace(new RegExp(run, 'g'), '');
      console.warn(`[Analyzer V89] Removed mixed Latin "${run}" from Arabic title (no transliteration found): "${title}"`);
    }
  }

  // Clean up: remove double spaces and trailing/leading spaces left after removal
  fixedTitle = fixedTitle.replace(/\s{2,}/g, ' ').trim();

  // Clean up: remove orphaned Arabic prefixes (ال followed by nothing)
  fixedTitle = fixedTitle.replace(/ال\s/g, '');

  return fixedTitle || title; // Fallback to original if we over-cleaned
}

// V72: English sentence detection — strips English-only sentences from Arabic text
// A sentence is considered "English" if >60% of its alphabetic characters are Latin
function stripEnglishFromArabic(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Split into paragraphs first
  const paragraphs = text.split('\n');
  const filtered: string[] = [];

  for (const para of paragraphs) {
    // Split paragraph into sentences (by period, question mark, exclamation)
    // But be careful with numbers like $4.50 or abbreviations like U.S.
    const sentences = para.split(/(?<=[.!?؛؟])\s+/);
    const kept: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      // Count Latin vs Arabic characters
      const latinChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
      const arabicChars = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
      const totalAlpha = latinChars + arabicChars;

      if (totalAlpha === 0) {
        // No alphabetic chars (numbers, symbols only) — keep
        kept.push(trimmed);
        continue;
      }

      const englishRatio = latinChars / totalAlpha;

      // If >60% English and the sentence has 5+ Latin words, it's likely untranslated
      const latinWords = (trimmed.match(/[a-zA-Z]{2,}/g) || []).length;
      if (englishRatio > 0.6 && latinWords >= 5) {
        console.warn(`[Analyzer V88] Stripped English sentence from Arabic text: "${trimmed.slice(0, 80)}..."`);
        continue;
      }

      kept.push(trimmed);
    }

    if (kept.length > 0) {
      filtered.push(kept.join(' '));
    }
  }

  return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function analyzeArticle(articleId: string): Promise<AnalysisResult> {
  const startTime = Date.now();
  const result: AnalysisResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has quality analysis (with V70+ path field)
    // V72: BUT re-analyze if existing analysis has English text that shouldn't be there
    if (article.aiAnalysis && article.aiAnalysis.length > 100) {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 100 && /[\u0600-\u06FF]/.test(parsed.fullContent)) {
          // V72: Check if existing analysis has English sentences (5+ consecutive English words)
          // This detects untranslated English text like "Crude oil futures fell late Tuesday..."
          // Ticker symbols and abbreviations (NASDAQ, NYMEX, CL, WTI) in parentheses are fine
          const fullContentStr = String(parsed.fullContent || '');
          const editedArticleStr = String(parsed.editedArticle || '');
          const contentArStr = String(article.contentAr || '');
          // Match 5+ consecutive English words (3+ chars each) — indicates a full English sentence
          const englishSentencePattern = /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/;
          const hasEnglishInAnalysis = englishSentencePattern.test(fullContentStr) || englishSentencePattern.test(editedArticleStr);
          const hasEnglishInContentAr = englishSentencePattern.test(contentArStr);

          // V71: Re-analyze if V70 legacy (before commodity fixes), otherwise skip
          if (parsed.path && ['A', 'B', 'C'].includes(parsed.path) && !hasEnglishInAnalysis && !hasEnglishInContentAr) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }

          if (hasEnglishInAnalysis || hasEnglishInContentAr) {
            console.warn(`[Analyzer V88] Re-analyzing ${articleId} — existing analysis/contentAr has English sentences`);
          }
        }
      } catch {}
    }

    // Prepare context for analysis
    const title = article.titleAr || article.title || '';
    const summary = article.summaryAr || article.summary || '';
    const content = article.contentAr || '';
    // V71: Pass ALL original English content for Gate 0 raw data extraction
    const titleEn = article.title || '';
    const summaryEn = article.summary || '';
    const contentEn = article.content || '';  // Original English article body
    const category = article.category || 'اقتصاد كلي';

    const analysisPrompt = `أنت نظام تحرير أخبار مالية متخصص. مهمتك معالجة كل خبر عبر 4 بوابات إلزامية بالترتيب قبل إخراج النتيجة بصيغة JSON فقط.

═══ البوابة 0 — استخراج البيانات الخام ═══
من النص الأصلي الإنجليزي، استخرج:
- اسم الشركة / الكيان الرئيسي (بالإنجليزي) — إذا كان الخبر عن سلع أو عقود آجلة، اكتب اسم السلة (مثال: WTI Crude Oil, Brent Crude, Gold)
- الرمز البورصي إن وُجد (مثال: SCLX، WES.AX، CL لخام غرب تكساس، BZ لخام برنت)
- البورصة / سوق التداول (مثال: NYMEX لعقود النفط، COMEX للذهب، NYSE للأسهم)
- الأرقام والنسب المذكورة صراحةً في النص (قيمة صفقة، عدد أسهم، نسبة تغير، سعر، حجم انخفاض/ارتفاع)
- المصدر الأصلي (رويترز / بلومبرغ / بيان رسمي / غيره)
إذا لم تجد رمزاً بورصياً واضحاً ← سجّل: "لا يوجد أصل مدرج مؤكد"

═══ البوابة 1 — تصنيف الموضوع وتحديد المسار ═══
⚠️ قبل التصنيف، حدد الجمهور المستهدف للخبر الأصلي:
- موجّه للمستهلك الفرد (credit score, budgeting, personal loans, mortgage rates, savings tips, retirement planning)؟ → القطاع = "تمويل شخصي" + المسار [B] حتماً + لا تحوله لمحتوى مؤسسي/استثماري
- موجّه للمتداول/المستثمر (stock analysis, earnings, trade deals, commodity prices)؟ → تابع التصنيف الطبيعي
- موجّه للمؤسسة/الشركة (corporate earnings, M&A, supply chain)؟ → تابع التصنيف الطبيعي

[A] خبر مالي قابل للتداول: يشمل أي من التالي:
  - شركة مدرجة فعلياً في بورصة معروفة + رمز بورصي واضح + حدث يؤثر على سعرها
  - عقود سلعية آجلة (oil futures, gold futures, natural gas...) + رمز التعاقد (CL, BZ, GC...) + بورصة التعاقد (NYMEX, COMEX, ICE...)
  - صناديق ETF متداولة (USO, GLD, SLV...) + حدث يؤثر على سعرها
  - ⚠️ V90: صناديق البيتكوين والإيثريوم المتداولة (IBIT, FBTC, ARKB, BITB, EZBC, HODL, GBTC, ETHA, FETH, ETHE...) = مسار [A] حتماً + القطاع = "أصول رقمية" + هذه أصول مدرجة متداولة وليس مفاهيم كلية!
  - أزواج عملات فوركس (EUR/USD, USD/JPY...) + حدث يؤثر على سعر الصرف
  - عملات مشفرة متداولة (BTC, ETH...) + حدث مؤثر
  - ⚠️ V90: شركات العملات المشفرة المدرجة (Coinbase COIN, MicroStrategy MSTR, Marathon MARA, Riot RIOT...) = مسار [A] حتماً + أصول متداولة فعلياً
  - مؤشرات أسهم رئيسية (DAX, CAC 40, FTSE 100, Nikkei...) + حدث يؤثر على المؤشر
  ⚠️ أخبار التجارة والتعريفات (trade/tariff news) بين اقتصادات كبرى تؤثر مباشرة على:
    • أزواج العملات المعنية (EUR/USD لاتفاقيات EU-US، USD/CNY لاتفاقيات US-China)
    • مؤشرات الأسهم الرئيسية (DAX, CAC 40 لأوروبا، S&P 500 للولايات المتحدة)
    • قطاعات التصدير والاستيراد المتأثرة
    → هذه الأخبار مسار [A] حتماً وليس [B]، لأنها تؤثر على أصول محددة قابلة للتداول
  → خبر كامل + تحليل كامل + سيناريوهات تداول
[B] خبر اقتصادي كلي / اجتماعي / تمويل شخصي: ظواهر كلية بدون أصل محدد قابل للتداول (تضخم، أسعار فائدة، حروب بدون تأثير مباشر على أصل معين) أو محتوى توعوي للمستهلك (درجات ائتمان، نصائح مالية شخصية، أساطير عن الادخار) → خبر كامل + سياق اقتصادي فقط — ممنوع سيناريوهات التداول
  ⚠️ V91: الأخبار الكلية الاقتصادية (تعويضات بطالة، CPI، NFP، GDP، قرارات فائدة، PMI، ميزان تجاري) تؤثر بقوة على أصول مالية حقيقية حتى لو لم تذكر شركة بعينها! → اذكر هذه الأصول في القسمين [2] و[3]:
    • الدولار الأمريكي (DXY) وأزواجه (EUR/USD, USD/JPY, GBP/USD) — بيانات سوق عمل قوية = دولار صاعد
    • سندات الخزانة (TNX, TLT) — بيانات قوية = توقعات رفع فائدة = عوائد صاعدة وسندات هابطة
    • الذهب (XAUUSD, GLD) — بيانات قوية = ضغط هبوطي على الذهب (أصل ملاذ)
    • المؤشرات الرئيسية (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA) — حسب طبيعة البيانات
  ⚠️ أخبار التمويل الشخصي (credit score, budgeting, personal finance) → المسار [B] حتماً + القطاع = "تمويل شخصي" + لا تحولها لأخبار مؤسسية
[C] صفقات / شركات خاصة / معلومات شحيحة: استثمار في شركة خاصة غير مدرجة، أو شركة مدرجة لكن بدون رمز بورصي واضح، أو تفاصيل شحيحة → خبر كامل + تحليل مختصر + تصنيف ثقة منخفض + البيانات غير كافية للسيناريوهات

⚠️ تنبيهات مهمة للمسار:
- إذا كان الخبر عن عقود آجلة (futures) أو سلع (commodities) أو عملات → المسار [A] حتماً وليس [C]
- إذا كان الخبر عن استثمار في شركة خاصة (private company) غير مدرجة في بورصة → المسار [C] حتماً، وليس [A]
- إذا كان الخبر عن حدث جيوسياسي يؤثر مباشرة على أصل متداول (نفط، ذهب...) → المسار [A]
- ⚠️ أخبار التوترات أو الاتفاقيات التجارية بين اقتصادات كبرى → المسار [A] حتماً (تؤثر على عملات ومؤشرات)
- ⚠️ إذا ذُكرت عملة أو مؤشر محدد في السياق (مثل EUR/USD أو DAX) → المسار [A] حتماً
- ⚠️ V90: أخبار البيتكوين/العملات المشفرة/صناديق ETF الرقمية → المسار [A] حتماً + القطاع = "أصول رقمية" — ممنوع تصنيفها كـ "اقتصادي كلي"!
- ⚠️ V90: إذا ذُكرت رموز بورصية مشفرة (COIN, IBIT, FBTC, ARKB, BTC, ETH...) → المسار [A] حتماً — هذه أصول حقيقية مدرجة ومتداولة!
- ⚠️ V90: ممنوع كتابة "لا ينطبق" في الأقسام [2] و[3] لأخبار العملات المشفرة أو صناديق ETF الرقمية — هذه أصول قابلة للتداول حتماً!
إذا لم يتطابق أي مسار بوضوح ← صنّفه [B] تلقائياً

═══ البوابة 2 — تحرير الخبر ═══
⚠️⚠️⚠️ V87: فحص الجمهور المستهدف قبل الترجمة — الأهمية القصوى! ⚠️⚠️⚠️
قبل ترجمة أي جملة، اسأل نفسك: لمن كُتب هذا الخبر أصلاً؟
- إذا كان موجّهاً للفرد المستهلك (credit score, personal loans, budgeting, savings):
  → حافظ على المعنى الشخصي: "credit score" = درجة الائتمان الشخصية (NOT سجل مالي!)
  → "credit" في سياق شخصي = ائتمان شخصي (NOT ائتمان مؤسسي أو سجل مالي)
  → "bills" = فواتير/فواتير شهرية (NOT فواتير شركات!)
  → "myths" = أساطير/مفاهيم خاطئة شائعة (NOT أساطير مؤسسية)
  → لا تحوله لمحتوى عن الشركات والمؤسسات — الموضوع عن الأفراد!
- إذا كان موجّهاً للمستثمر/المؤسسة:
  → تابع بشكل طبيعي

⚠️ مثال كارثي يجب تجنبه: مقال عن "credit score myths for consumers" تُرجم إلى مقال عن "السجلات المالية للشركات" — هذا تغيير كامل للموضوع!

1. أسماء الشركات: تعريب صوتي معقول (ACEA ← أسيا) + الإنجليزي بين قوسين عند أول ذكر فقط. لا ترجمة حرفية (ACEA ≠ "أي سي إي إي"). ممنوع استبدال أسماء الشركات بـ "شركة ما" أو أي عنصر نكرة.
   ⚠️ إذا كانت الشركة معروفة عالمياً (Samsung, TSMC, Toyota...) اذكر الرمز البورصي المعروف:
   Samsung = 005930.KS (KRX) | TSMC = 2330.TW (TWSE) | Toyota = 7203.T (TSE)
   SK Hynix = 000660.KS (KRX) | Nintendo = 7974.T (TSE) | ASML = ASML (Euronext)
2. المصطلحات المالية — ترجمة دقيقة إلزامية:
   - futures = عقود آجلة (ليس أسهم!)
   - stocks = أسهم
   - crude oil = النفط الخام
   - oil futures = عقود النفط الآجلة (ليس أسهم النفط!)
   - commodities = سلع
   - ETF = صندوق مؤشرات متداول
   - forex = فوركس / سوق العملات الأجنبية
   - supply = عرض (ليس طلب!)
   - demand = طلب
   - supply disruption = إعاقة العرض / تعطيل الإمدادات
   - Strait of Hormuz = مضيق هرمز (اسم جغرافي، ليس أصلاً مالياً)
   - tariffs = تعريفات جمركية (ليس ضرائب!)
   - trade deal = اتفاقية تجارية
   - trade terms = شروط تجارية
   - year-over-year / YoY = على أساس سنوي (ليس "العام الماضي")
   - Q1 / first quarter = الربع الأول (احتفظ بالسنة: الربع الأول 2026)
   - operating profit = أرباح التشغيل
   - peace deal = اتفاق سلام
   - sanctions = عقوبات
   - chips (semiconductors) = رقائق إلكترونية / شرائح إلكترونية (ليس هشامات! وليس رقاقات!)
   - session = جلسة (ليس sesión بالإسبانية!)
   - dollar = دولار (ليس دينار!)
   - production cut = خفض الإنتاج (يرفع الأسعار عادةً وليس يخفضها!)
   - supply cut = خفض العرض (يرفع الأسعار!)
   ⚠️⚠️⚠️ V87: مصطلحات التمويل الشخصي — ترجمة دقيقة إلزامية:
   - credit score = درجة الائتمان الشخصية (NOT سجل مالي! NOT تصنيف ائتماني! — هذه عن الأفراد وليس الشركات)
   - credit rating = تصنيف ائتماني (للشركات والدول)
   - credit report = تقرير ائتماني شخصي
   - credit bureau = مكتب ائتمان
   - FICO score = درجة فيكو الائتمانية
   - personal loan = قرض شخصي
   - mortgage = رهن عقاري / قرض سكني
   - budgeting = إعداد الميزانية الشخصية
   - savings = مدخرات
   - retirement planning = تخطيط التقاعد
   - interest rate (personal) = سعر الفائدة على القروض الشخصية
   - bills = فواتير (كهرباء، ماء، إلخ) — NOT فواتير شركات!
   - myths = أساطير / مفاهيم خاطئة شائعة
   ⚠️ الفرق الحاسم: credit score (شخصي) ≠ credit rating (مؤسسي). لا تخلط بينهما!
3. الأرقام: لا رقم غير موجود في النص الأصلي. رقم بلا مصدر ← ضع [يحتاج تحقق] بجانبه
4. ⚠️ هيكل الخبر V75 — مرن حسب المصدر المتاح:
   - إذا كان المصدر مجرد عنوان فقط ← اكتب 1-2 فقرات فقط (لا تخترع سياقاً أو أسباباً!)
   - إذا كان المصدر عنوان + ملخص ← اكتب 2-3 فقرات
   - إذا كان المصدر يحتوي محتوى تفصيلي ← اكتب حتى 4 فقرات
   - التسلسل: الحدث الرئيسي | السياق المتوفر فقط | التأثير المتوفر فقط | التوقعات المتوفرة فقط
   - إذا لم تتوفر معلومات لفقرة → لا تكتبها. فقرتان صادقتان أفضل من أربع مزيفة.
5. التكرار: احذف التكرار كاملاً — كل جملة تضيف معلومة جديدة أو تُحذف
6. ⚠️ قاعدة منع الاختراع الحاسمة V75: لا تخترع أحداثاً أو أسباباً أو ردود فعل أو تصريحات أو تغريدات أو قرارات غير مذكورة في النص الأصلي. إذا لم يذكر النص رد فعل دولة أو شخص → لا تخترعه. إذا لم يذكر النص سبباً → لا تخترعه. إذا لم يذكر تغريدة → لا تخترعها. إذا لم يذكر زيادة أسعار → لا تخترعها. الخبر القصير الصادق أفضل من الخبر الطويل المزيف.
7. العرض vs الطلب: فرّق بدقة بين تأثير العرض (supply) وتأثير الطلب (demand). إعاقة ممر شحن = مشكلة عرض وليس طلب.
8. التصنيف: القطاع الصحيح + الإيجابي/السلبي/المحايد مع تبرير
   ⚠️ V87: إذا كان الخبر عن تمويل شخصي (credit score, budgeting, personal finance) → القطاع = "تمويل شخصي" وليس "اقتصاد كلي"
   ⚠️ V90: إذا كان الخبر عن بيتكوين أو عملات مشفرة أو صناديق رقمية متداولة → القطاع = "أصول رقمية" وليس "اقتصاد كلي" — هذه أصول حقيقية متداولة!
9. ⚠️ تنظيف أسلوب المصدر: بعض المصادر (مثل Forexlive) تستخدم أسلوباً غير رسمي مثل "Well," أو "So," — احذف هذه العبارات الافتتاحية بالكامل عند الترجمة. لا تنقل "Well," إلى "حسناً."
10. ⚠️ منع الكلمات الأجنبية: النص العربي يجب أن يكون بالعربية فقط. ممنوع إدراج كلمات إسبانية (para, pero, sin) أو فرنسية (avec, dans, pour) أو أي لغة وسيطة. إذا واجهت كلمة لا تعرف ترجمتها العربية، استخدم المعنى العربي المباشر.
11. ⚠️ منع الأصول الفضفاضة: لا تذكر "العلاقات التجارية" أو "الاقتصاد العالمي" أو "الأسواق المالية" كأصول متأثرة — هذه مفاهيم عامة وليست أصولاً قابلة للتداول. اذكر أصولاً محددة (EUR/USD, DAX, S&P 500, CL, WTI...).
12. ⚠️ الدقة الزمنية: عند ترجمة "year-over-year" أو "YoY" → "على أساس سنوي" وليس "العام الماضي". الربع الأول 2026 يبقى الربع الأول 2026 — لا تحوله إلى "العام الماضي".
13. ⚠️ منع خلط العربية والإنجليزية في كلمة واحدة (مثل "هذا الannouncement" — خطأ!). إما اكتب "الإعلان" بالعربية أو "الإعلان (announcement)" بين قوسين.

═══ البوابة 3 — التحليل (حسب المسار) ═══

⚠️⚠️⚠️ قاعدة V76 الحرجة — المسار [C] تحليل مختصر فقط! ⚠️⚠️⚠️
المسار [C] = معلومات شحيحة → التحليل المفصل سيكون حتماً مليئاً بالاختراعات!
"التحليل الفارغ أسوأ من غياب التحليل" — لا تحلل ما لا تعرف!

للمسار [C] فقط — هيكل مختصر (قسمان فقط):
[1] ملخص الحدث — جملتان فقط مما هو متوفر فعلاً في النص
[6] تصنيف الثقة: "معلومات شحيحة — البيانات غير كافية لتحليل موثوق أو توصية تداول محددة"
ممنوع على المسار [C]: أقسام [2] [3] [4] [5] — هذه تحتاج بيانات لا تتوفر!

للمسارين [A] و [B] — الهيكل الكامل:
[1] ملخص الحدث — جملتان
[2] الأصول المتأثرة مباشرة: يجب أن تكون أصولاً مالية حقيقية قابلة للتداول (أسهم، عقود آجلة، عملات، ETF، مؤشرات). ممنوع ذكر معالم جغرافية (مضائق، قنوات، بحار) كأصول متأثرة — هذه ليست أصولاً مالية. ممنوع ذكر مفاهيم فضفاضة (العلاقات التجارية، الاقتصاد العالمي، الأسواق المالية) كأصول. لكل أصل: الاسم بالعربية + الرمز الإنجليزي بين قوسين + البورصة/السوق | اتجاه التأثير: صعودي/هبوطي/محايد | السبب في جملة واحدة
  ⚠️ V90: ممنوع كتابة "لا ينطبق" في القسم [2] إذا كان الخبر يذكر أصولاً مدرجة! أخبار Bitcoin ETFs تذكر COIN (NASDAQ) و IBIT (NASDAQ) و FBTC (NASDAQ) و BTC — كلها أصول حقيقية متداولة. إذا ذُكرت أسماء شركات أو رموز بورصية في النص الأصلي → يجب إدراجها هنا.
  ⚠️ V91: ممنوع كتابة "لا ينطبق" في القسم [2] للأخبار الكلية الاقتصادية! أخبار البطالة/CPI/NFP/GDP/الفائدة تؤثر مباشرة على:
    • تعويضات بطالة أو NFP أو بيانات سوق عمل ← USD/DXY (مباشرة) + EUR/USD + USD/JPY + سندات الخزانة TNX/TLT + الذهب XAUUSD/GLD
    • CPI أو تضخم ← USD/DXY + سندات الخزانة + الذهب + المؤشرات (SPY, QQQ)
    • قرار فائدة فيدرالي ← USD + سندات + ذهب + بنوك (XLF) + عقارات (XLRE)
    • GDP أو نمو اقتصادي ← USD + مؤشرات + قطاعات دورية (XLI) vs دفاعية (XLU)
  ⚠️ أمثلة على أخبار التجارة والتعريفات:
    EU-US trade tensions → EUR/USD (هبوطي إذا فشلت المفاوضات) + DAX (هبوطي) + CAC 40 (هبوطي) + S&P 500 (محايد/هبوطي)
    US-China tariffs → USD/CNY + S&P 500 + SSE Composite
[3] الأصول المتأثرة بالتداعي: شركات أو صناديق أو قطاعات محددة بالاسم والرمز — لا عموميات.
  إذا كان الخبر عن النفط ← اذكر شركات طاقة محددة (إكسون موبيل XOM، شيفرون CVX...) + صناديق نفطية (USO, XLE) + شركات شحن + شركات تأمين بحري.
  إذا كان الخبر عن تجارة EU-US ← اذكر شركات تصدير أوروبية محددة (فولكس فاغن VOW3، بي إم دبليو BMW، سانت غوبان SGOh) + صناديق أوروبية (EZU, VGK, EUFN).
  ⚠️ V91: إذا كان الخبر اقتصادي كلي (بطالة، CPI، فائدة، GDP) ← اذكر الأصول المتأثرة بالتداعي حسب النوع:
    • بيانات سوق عمل قوية ← قطاعات حساسة للفائدة تتراجع (عقارات XLRE، مرافق XLU) + بنوك تستفيد (XLF, JPM, BAC) + أسهم تكنولوجيا تتأثر (QQQ, XLK)
    • بيانات تضخم مرتفعة ← أسهم نمو تتراجع (QQQ) + أسهم قيمة/أرباح تتحسن (VTV, XLU) + بيتكوين كتحوط (BTC, IBIT)
    • بيانات سوق عمل ضعيفة ← ذهب يرتفع (GLD) + سندات ترتفع (TLT) + قطاعات دفاعية (XLU, XLV)
[4] السياق الأوسع 3-5 جمل — معلومات جديدة فقط، ممنوع إعادة صياغة الخبر
[5] سيناريوهات التداول — للمسار [A] فقط: سيناريو متفائل (مع مستويات سعرية تقريبية) + سيناريو متشائم (مع مستويات سعرية تقريبية) + شروط كل سيناريو.
  ⚠️ ممنوع كتابة "لا ينطبق" لأخبار التجارة/التعريفات/العملات — هذه أخبار قابلة للتداول حتماً!
  ⚠️ مثال لخبر EU-US: سيناريو متفائل: وافقت واشنطن على تعديل الاتفاقية ← EUR/USD يرتفع نحو 1.12 + DAX يستعيد 18500. سيناريو متشائم: فشلت المفاوضات ← EUR/USD ينخفض نحو 1.06 + DAX يتراجع نحو 17500.
  [B]: "لا ينطبق".
[6] توصية — للمسار [A] فقط: جملة واحدة حادة ومحددة وقابلة للتنفيذ. ممنوع توصيات فارغة مثل "مراعاة التوترات" أو "مراقبة التطورات" أو "الحذر مطلوب" أو "تأكد أن الاستثمار يتناسب مع رغباتك". يجب أن تذكر ماذا يفعل المتداول بالتحديد.
  ⚠️ قاعدة حاسمة — توصيات لا تتناقض مع المشاعر:
   - إذا التصنيف = إيجابي (positive) → التوصية شرائية أو انتظارية فقط — ممنوع مركز بيعي
   - إذا التصنيف = سلبي (negative) → التوصية بيعية أو انتظارية فقط — ممنوع مركز شرائي
   - إذا التصنيف = محايد (neutral) → التوصية انتظارية فقط
   مثال توصية إيجابية: "اتخذ مركز شرائي على أسهم سامسونج مع وقف خسارة تحت 70,000 وون استهدافاً 82,000 وون"
   مثال توصية سلبية: "اتخذ مركز بيعي على EUR/USD مع وقف خسارة فوق 1.10 استهدافاً 1.06"
  ⚠️ قاعدة حاسمة — وقف الخسارة يجب أن يكون بسعر السهم (سعر للسهم الواحد)، وليس بقيمة السوق الإجمالية:
   - صح: "وقف خسارة عند 70,000 وون للسهم" (سعر السهم)
   - خطأ: "وقف خسارة عند 900 مليار دولار" (قيمة سوقية إجمالية — غير قابل للتداول!)
  المسار [B]: "الانتظار حتى تتضح الاتجاهات الكلية"
  المسار [C]: "معلومات شحيحة — البيانات غير كافية لوضع توصية تداول محددة"

═══ البوابة 4 — التحقق النهائي ═══
□ كل رقم من النص الأصلي موجود في التحليل؟
□ كل أصل في [2] و[3] هو أصل مالي حقيقي قابل للتداول (وليس معلماً جغرافياً أو مفهوماً فضفاضاً مثل "العلاقات التجارية")؟
□ لا توجد معلومات مختلقة غير موجودة في النص الأصلي؟
□ لا تكرار؟
□ تصنيف قطاعي منطقي؟
□ المسار [B] بدون سيناريوهات تداول؟
□ تم التمييز بين العرض (supply) والطلب (demand) بدقة؟
□ futures تُرجمت إلى "عقود آجلة" وليس "أسهم"؟
□ الخبر مكتمل؟
□ ⚠️ لا يوجد أي نص إنجليزي غير مترجم في أي حقل من حقول JSON؟ كل حقل نصي (editedArticle, fullContent, introduction, body, conclusion, recommendation, summary) يجب أن يكون بالعربية فقط — ممنوع ترك أي جملة إنجليزية بدون ترجمة. إذا واجهت جملة لا تستطيع ترجمتها، احذفها بدلاً من تركها بالإنجليزي.
□ ⚠️ لا توجد كلمات أجنبية غير مالية (para, pero, avec, dans...)? النص العربي يجب أن يكون عربياً خالصاً — فقط الاختصارات المالية الإنجليزية مسموحة.
□ ⚠️ لا توجد عبارات افتتاحية غير رسمية (حسناً، طبعاً، إذن...)؟ النص المهني لا يبدأ بمحادثات.
□ ⚠️ أخبار التجارة/التعريفات مصنفة كمسار [A] وليس [B]؟
□ ⚠️ التوصية محددة وقابلة للتنفيذ — ليست فارغة مثل "مراعاة التوترات" أو "مراقبة التطورات"؟
□ ⚠️ السياق الأوسع في [4] يضيف معلومة جديدة ولا يكرر الخبر؟
□ ⚠️ التوصية في [6] لا تتناقض مع المشاعر؟ (إيجابي ≠ بيعي، سلبي ≠ شرائي)
□ ⚠️ وقف الخسارة بسعر السهم وليس بقيمة السوق الإجمالية؟
□ ⚠️ الدقة الزمنية: year-over-year تُرجمت إلى "على أساس سنوي" وليس "العام الماضي"؟
□ ⚠️ للشركات المعروفة عالمياً، الرمز البورصي والبورصة موجودان في rawData؟
□ ⚠️ المسار [C] لا يعطي توصية تداول محددة إذا كانت البيانات غير كافية؟
□ ⚠️ V76: المسار [C] يحتوي فقط على [1] ملخص + [6] معلومات شحيحة — ممنوع أقسام [2]-[5]؟
□ ⚠️ V76: chips تُرجمت إلى رقائق إلكترونية وليس هشامات؟
□ ⚠️ V76: session تُرجمت إلى جلسة وليس sesión؟
□ ⚠️ V76: dollar تُرجمت إلى دولار وليس دينار؟
□ ⚠️ V76: لا يوجد منطق اقتصادي معكوس (خفض الإنتاج يرفع الأسعار وليس يخفضها)؟
□ ⚠️ V76: لا توجد أرقام أقسام مكررة ([5] مرتين مثلاً)؟
□ ⚠️ V76: التوصية ليست عامة فارغة (يتناسب مع رغباتك، بحذر، استشر مستشاراً)؟
□ ⚠️⚠️⚠️ V86: إذا كان الخبر عن مفهوم تنظيمي/تحذير/منتج مالي ناشئ غير مدرج → هل المسار [B] فقط + isTradable=false؟ ممنوع توصية تداول بأرقام على مفهوم!
□ ⚠️⚠️⚠️ V86: هل توجد أرقام وقف خسارة/استهداف على أصل غير قابل للتداول؟ (مثل: توكنات اصطناعية، تحذير تنظيمي) → احذف الأرقام!
□ ⚠️⚠️⚠️ V86: synthetic = اصطناعية (وليس ماصة!) | tokens = توكنات (وليس التokens!) | retail traders = المتداولون الأفراد (وليس المستهلكين!)
□ ⚠️⚠️⚠️ كل النص بالعربية فقط — لا كلمات أجنبية إطلاقاً (إلا الاختصارات المالية)؟
□ ⚠️⚠️⚠️ إذا كانت البيانات غير كافية → هل كتبت فقط "لا تتوفر بيانات كافية" بدل اختراع محتوى؟
□ ⚠️⚠️⚠️ هل حذفت كل قسم لا تملك معلومة حقيقية عنه بدل ملئه بمحتوى عام؟
□ ⚠️⚠️⚠️ التوصية تتوافق مع التصنيف؟ (إيجابي ≠ بيعي، سلبي ≠ شرائي، محايد ≠ محدد)
□ ⚠️⚠️⚠️ V87: هل الموضوع الأصلي محفوظ في الترجمة؟ إذا كان الخبر الأصلي عن تمويل شخصي (credit score, budgeting, loans) → هل بقي شخصياً ولم يتحول لمحتوى مؤسسي؟ "credit score" يجب أن تترجم "درجة الائتمان الشخصية" وليس "سجل مالي" — هذا الفرق يغيّر الموضوع كلياً!
□ ⚠️⚠️⚠️ V90: أخبار العملات المشفرة أو صناديق ETF الرقمية → هل المسار [A] وليس [B]؟ هل القطاع = "أصول رقمية" وليس "اقتصاد كلي"؟
□ ⚠️⚠️⚠️ V90: هل الأقسام [2] و[3] تحتوي على الأصول المذكورة فعلياً في النص (COIN, IBIT, FBTC...) بدل "لا ينطبق"؟
□ ⚠️⚠️⚠️ V90: التوصية في [6] مكتملة وتنتهي بنقطة أو علامة استفهام — ليست مقطوعة؟
□ ⚠️⚠️⚠️ V91: إذا كان الخبر اقتصادي كلي (بطالة، CPI، فائدة، GDP) → هل أدرجت USD/DXY + سندات الخزانة + الذهب في القسم [2]؟ هذه أصول متأثرة مباشرة وليست "لا ينطبق"!
□ ⚠️⚠️⚠️ V91: هل القسم [3] يذكر أصولاً متأثرة بالتداعي حسب نوع البيانات الكلية (بنوك/عقارات للتأثير الفائدي، نمو/قيمة للتضخم، دفاعية/دورية للنمو)؟
□ ⚠️⚠️⚠️ V87: إذا كان القطاع "تمويل شخصي" → هل الترجمة تحافظ على سياق المستهلك الفرد (فواتير شهرية، درجة ائتمان شخصية، مدخرات) وليس سياق الشركات (إيرادات، تكاليف إنتاج، ديون مؤسسية)؟
□ ⚠️⚠️⚠️ V87: هل المحتوى الأصلي محفوظ؟ إذا وعد العنوان بـ "3 أساطير" أو "5 نصائح" → هل ذُكرت فعلاً في التحليل؟ لا تحذف المحتوى الفعلي وتستبدله بكلام عام!
إذا فشل أي سؤال ← أصلح قبل الإخراج

═══ بيانات الخبر ═══
العنوان الإنجليزي: ${titleEn}
الملخص الإنجليزي: ${summaryEn.slice(0, 500)}
${contentEn ? `المحتوى الإنجليزي الأصلي: ${contentEn.slice(0, 2000)}` : ''}
العنوان العربي: ${title}
الملخص العربي: ${summary.slice(0, 500)}
${content ? `المحتوى العربي: ${content.slice(0, 1500)}` : ''}
الفئة الحالية: ${category}

═══ صيغة JSON المطلوبة ═══
أعطِ النتيجة في صيغة JSON بالشكل التالي (مهم جداً أن تكون الإجابة JSON صالح فقط بدون أي نص إضافي):
{
  "rawData": {
    "entityNameEn": "اسم الشركة أو السلة بالإنجليزي",
    "ticker": "الرمز البورصي أو لا يوجد أصل مدرج مؤكد",
    "exchange": "اسم البورصة أو سوق التعاقد (NYMEX, COMEX, ICE, NYSE...)",
    "figures": ["الأرقام والنسب من النص الأصلي — كل رقم مذكور حرفياً"],
    "source": "المصدر الأصلي"
  },
  "path": "A أو B أو C",
  "sector": "القطاع الصحيح بالعربية",
  "sentimentReason": "تبرير تصنيف المشاعر في جملة واحدة",
  "editedArticle": "الخبر المحرر بـ 4 فقرات: الحدث الرئيسي | السبب والسياق | التأثير على الأطراف | الموقف الرسمي أو التوقعات",
  "fullContent": "للمسار [A] و [B]: [1] ملخص الحدث\\nملخص شامل في جملتين\\n\\n[2] الأصول المتأثرة مباشرة\\nلكل أصل: الاسم بالعربية مع الرمز الإنجليزي بين قوسين + البورصة | اتجاه التأثير: صعودي/هبوطي/محايد | السبب في جملة واحدة\\n\\n[3] الأصول المتأثرة بالتداعي\\nشركات أو صناديق أو قطاعات محددة بالاسم والرمز\\n\\n[4] السياق الأوسع\\n3-5 جمل تضع الحدث في سياقه\\n\\n[5] سيناريوهات التداول\\nللمسار [A] فقط: سيناريو متفائل + سيناريو متشائم مع شروط ومستويات. للمسار [B]: لا ينطبق\\n\\n[6] توصية الخبراء في جملة حادة ومحددة — للمسار [B]: انتظار. للمسار [C]: معلومات شحيحة — البيانات غير كافية. ⚠️ للمسار [C]: فقط [1] ملخص الحدث في جملتين + [6] معلومات شحيحة — البيانات غير كافية لتحليل موثوق. ممنوع أقسام [2]-[5] للمسار [C]!",
  "introduction": "2-3 جمل تمهيدية تضع القارئ في قلب الحدث فوراً",
  "body": "تحليل معمّق موسّع من 3-5 فقرات",
  "conclusion": "خلاصة استثمارية حاسمة من 2-3 جمل",
  "summary": "ملخص الحدث في جملتين",
  "sentiment": "positive أو negative أو neutral",
  "impactLevel": "high أو medium أو low",
  "keyTakeaways": ["نقطة تحليلية جوهرية 1", "نقطة تحليلية جوهرية 2", "نقطة تحليلية جوهرية 3", "نقطة تحليلية جوهرية 4"],
  "affectedAssets": [
    {"symbol": "رمز الأصل مثل CL أو XOM", "name": "اسم الأصل بالعربية مع الرمز الإنجليزي", "direction": "up أو down أو neutral", "impactDegree": "high أو medium أو low", "reason": "سبب التأثير في جملة واحدة", "isTradable": true}
  ],
  "recommendation": "توصية استثمارية حادة ومحددة في جملة واحدة",
  "confidence": "X/10 — تبرير"
}

قواعد صارمة جداً:
- ⚠️⚠️⚠️ أجب بالعربية فقط — لا كلمات أجنبية إطلاقاً! الإسبانية والفرنسية وغيرها ممنوعة تماماً. فقط الاختصارات المالية الإنجليزية مسموحة.
- ⚠️⚠️⚠️ إذا كانت البيانات غير كافية → اكتب فقط: "لا تتوفر بيانات كافية" — لا تملأ الفراغ بمحتوى مختلق!
- ⚠️⚠️⚠️ لا تملأ قسماً إذا لم يكن لديك معلومة حقيقية عنه — القسم المحذوف أفضل من القسم المهلوس!
- ⚠️⚠️⚠️ التوصية يجب أن تتوافق مع التصنيف دائماً: إيجابي = شرائي/انتظاري فقط، سلبي = بيعي/انتظاري فقط، محايد = انتظاري فقط!
- fullContent يجب أن يبدأ بـ [1] — للمسار [A] و [B] ينتهي بـ [6]. للمسار [C] يحتوي فقط على [1] ملخص الحدث + [6] معلومات شحيحة — ممنوع أقسام [2]-[5] للمسار [C] لأنها ستكون حتماً فارغة أو مختلقة!
- fullContent يجب أن يكون نصاً (string) وليس كائناً (object)
- path يجب أن يكون "A" أو "B" أو "C" فقط
- sector يجب أن يكون بالعربية (مثال: أدوية، تقنية، بنوك، طاقة، سلع، تجارة دولية...)
- editedArticle يجب أن يحتوي على فقرات حسب المصدر المتاح (1-4) مفصولة بـ | — لا تخترع فقرات إضافية
- لا تستخدم أي تنسيق Markdown داخل أي حقل (لا ** ولا ## ولا *)
- لا تُعد ذكر أي فكرة أكثر من مرة في التحليل كله
- إذا لم تتوفر بيانات كافية لسيناريو تداول موثوق، صرّح بذلك بدلاً من اختراع أرقام
- لا تستخدم عبارات عامة فارغة مثل "يجب على المستثمرين التأكد من..." أو "ينبغي مراعاة الظروف..." أو "تجدر الإشارة إلى أنه" أو "مراعاة التوترات" أو "مراقبة التطورات" — هذه عبارات فارغة ومحظورة
- النبرة: مباشرة، تقنية، محايدة عاطفياً — لا مديح ولا ذم للشركات
- الجمهور المستهدف: متداول يقرأ هذا المحتوى لاتخاذ قرار في دقائق
- كل رقم يجب أن يكون من النص الأصلي — لا تخترع أرقاماً
- قاعدة الأرقام الإلزامية: إذا ذكر النص الأصلي أية قيم مالية أو نسب تغير، يجب تضمينها حرفياً في التحليل
- اكتب كل شيء بالعربية الفصحى بأسلوب مهني تقني
- لا تستخدم كلمات إنجليزية إلا الاختصارات المعروفة (GDP, S&P, AI, ETF, IPO, NASDAQ, NYSE, NYMEX, COMEX, ICE)
- استخدم المصطلحات المالية العربية المعتمدة
- قاعدة أسماء الشركات والأصول: تعريب صوتي معقول (ACEA ← أسيا) + الإنجليزي بين قوسين عند أول ذكر فقط
- ⚠️ قاعدة حاسمة: futures = عقود آجلة وليس أسهم! لا تكتب أبداً "أسهم النفط" عند ترجمة "oil futures" — الصحيح "عقود النفط الآجلة"
- ⚠️ قاعدة حاسمة V76: chips (in tech/semiconductor context) = رقائق إلكترونية — ممنوع ترجمتها كـ "هشامات" أو أي كلمة بلا معنى!
- ⚠️ قاعدة حاسمة V76: session = جلسة — ممنوع كلمة sesión الإسبانية!
- ⚠️ قاعدة حاسمة V76: dollar = دولار — ممنوع كتابة "دينار" بدل "دولار"!
- ⚠️ قاعدة حاسمة V76: خفض الإنتاج يرفع الأسعار عادةً وليس يخفضها — منطق اقتصادي أساسي!
- ⚠️ قاعدة حاسمة: العرض vs الطلب — إعاقة ممر شحن أو تعطيل إنتاج = مشكلة عرض (supply)، وليس طلب (demand)
- ⚠️ قاعدة حاسمة: المعالم الجغرافية (مضائق، قنوات، بحار، موانئ) ليست أصولاً مالية — لا تذكرها في affectedAssets أو في القسم [2]
- ⚠️ قاعدة الأصول: في حقل affectedAssets، أدرج فقط الأصول القابلة للتداول علنياً (أسهم، عقود آجلة، عملات، ETF، مؤشرات). ممنوع أسماء جغرافية أو كيانات غير متداولة أو مفاهيم فضفاضة (العلاقات التجارية، الاقتصاد العالمي)
- ⚠️ قاعدة منع الاختراع: لا تضف أي معلومة غير موجودة في النص الأصلي — لا تخترع ردود فعل، لا تخترع أرقاماً، لا تخترع أسباباً
- ⚠️ قاعدة منع الكلمات الأجنبية: لا تدرج كلمات إسبانية أو فرنسية أو أي لغة وسيطة. النص عربي خالص باستثناء الاختصارات المالية.
- ⚠️ قاعدة تنظيف المصدر: احذف العبارات الافتتاحية غير الرسمية من المصدر (Well, So, Anyway) — لا تنقلها للعربية
- introduction يجب أن يكون نصاً عادياً (string) وليس كائناً (object)
- body يجب أن يكون نصاً عادياً (string) وليس كائناً (object)
- conclusion يجب أن يكون نصاً عادياً (string) وليس كائناً (object) — لا تتركه فارغاً أبداً
- affectedAssets يجب أن يكون مصفوفة كائنات [{symbol, name, direction, impactDegree, reason, isTradable}]
- keyTakeaways يجب أن يحتوي على 3-4 نقاط كحد أدنى — لا تتركه فارغاً أبداً — كل نقطة يجب أن تكون فريدة وليست إعادة صياغة لنفس الفكرة
- المسار [B] يحظر سيناريوهات التداول في القسم [5] — اكتب "لا ينطبق"
- المسار [C] يحتوي فقط على [1] ملخص الحدث + [6] معلومات شحيحة — ممنوع كتابة أقسام [2]-[5] لأن المعلومات شحيحة حتماً! التحليل الفارغ أسوأ من غياب التحليل!
- ⚠️ قاعدة البورصة: لا تذكر بورصة (NYSE, NASDAQ, LSE...) إلا إذا كان الرمز البورصي موجود فعلاً فيها. إذا لم تكن متأكداً → اكتب "غير مدرج" أو "خاصة"
- ⚠️ قاعدة الشركات الخاصة: إذا كان الخبر عن استثمار في شركة خاصة (private company) → المسار [C] + ticker = "لا يوجد أصل مدرج مؤكد" + isTradable = false + لا تذكر بورصة
- ⚠️⚠️⚠️ قاعدة V86 الحرجة — الأصول غير القابلة للتداول: إذا كان الخبر عن مفهوم تنظيمي أو تحذير أو منتج مالي ناشئ غير مدرج (مثل: توكنات الأسهم الاصطناعية، التوكينة، التحذيرات التنظيمية) → لا تعطِ توصية تداول محددة بأرقام! لا يمكن وضع وقف خسارة أو استهداف على مفهوم. المسار [B] فقط + isTradable = false + التوصية = "مراقبة التطورات التنظيمية"
- ⚠️ قاعدة V86 — ترجمة المصطلحات: synthetic = اصطناعية (وليس ماصة!) | tokens = توكنات/رموز (وليس التokens!) | retail traders = المتداولون الأفراد (وليس المستهلكين!)
- ⚠️ قاعدة V86 — مزج اللغات: ممنوع كتابة كلمات إنجليزية مختلطة بالعربي في العناوين (مثل "التokens") — اكتب كلمة عربية كاملة أو اترك الاختصار بين قوسين
- ⚠️ قاعدة التوصية: التوصية يجب أن تكون محددة وقابلة للتنفيذ — ليس "لا تشتري" فقط. اذكر ماذا تفعل بالتحديد (مثال: "اتخذ مركز بيعي على عقود WTI مع وقف خسارة عند 102$ استهدافاً 95$" أو "انتظر تأكيد كسر مستوى 1.08 على EUR/USD قبل الدخول")
- ⚠️ قاعدة حاسمة: كل حقل نصي في JSON يجب أن يكون بالعربية فقط — ممنوع ترك أي جملة إنجليزية بدون ترجمة. ترجم كل شيء أو احذفه. لا تترك أبداً نصاً إنجليزياً في editedArticle أو fullContent أو introduction أو body أو conclusion أو recommendation أو summary
- ⚠️ قاعدة حاسمة V75: حقل editedArticle يجب أن يترجم ما ورد في النص الأصلي فقط — بعدد فقرات يتناسب مع المحتوى المتاح. إذا كان المصدر مجرد عنوان، اكتب 1-2 فقرات فقط. لا تخترع فقرات إضافية عن أحداث أو أسباب أو ردود فعل لم تُذكر في النص الأصلي. الخبر القصير الصادق أفضل من الخبر الطويل المزيف.
- ⚠️ قاعدة أخبار التجارة: إذا كان الخبر عن توترات تجارية أو تعريفات جمركية أو اتفاقيات تجارية بين اقتصادات كبرى → المسار [A] حتماً + أصول محددة (أزواج عملات + مؤشرات) + سيناريوهات تداول + توصية قابلة للتنفيذ
- ⚠️⚠️⚠️ قاعدة V87 الحرجة — حفظ الموضوع الأصلي: لا تغيّر موضوع الخبر أثناء الترجمة! إذا كان الخبر عن تمويل شخصي (credit score, budgeting, personal loans) → القطاع = "تمويل شخصي" + المسار [B] + احفظ السياق الشخصي. credit score = درجة الائتمان الشخصية (NOT سجل مالي — هذا يغيّر الموضوع كلياً!). إذا وعد العنوان بـ "3 أساطير" أو "5 نصائح" → اذكرها فعلاً في المحتوى ولا تحذفها!`;

    let analysisSuccess = false;

    try {
      const analysisResponse = await Promise.race([
        chatCompletion([
          { role: 'system', content: '⚠️⚠️⚠️ القواعد الست الحاسمة: (1) أجب بالعربية فقط — لا كلمات أجنبية إطلاقاً! (2) إذا كانت البيانات غير كافية → اكتب فقط: "لا تتوفر بيانات كافية" — لا تملأ الفراغ! (3) لا تملأ قسماً إذا لم يكن لديك معلومة حقيقية عنه — احذف القسم! (4) التوصية يجب أن تتوافق مع التصنيف دائماً: إيجابي ≠ بيعي، سلبي ≠ شرائي! (5) V86: لا تعطِ توصية تداول بأرقام على أصل غير قابل للتداول (مفهوم تنظيمي، تحذير، توكنات اصطناعية) → المسار [B] فقط! (6) V87: احفظ الموضوع الأصلي! إذا كان الخبر عن تمويل شخصي (credit score, budgeting) → حافظ على السياق الشخصي ولا تحوله لمؤسسي! credit score = درجة الائتمان الشخصية NOT سجل مالي! ═══ أنت نظام تحرير أخبار مالية متخصص يطبق نظام البوابات الأربع. أجب بتحليل JSON فقط بدون أي نص إضافي خارج الـ JSON. اتبع هيكل البوابات بدقة — لا عبارات فارغة، لا تكرار، لا اختراع أرقام أو معلومات. ⚠️⚠️⚠️ قاعدة V76 الحرجة: المسار [C] = معلومات شحيحة → fullContent يحتوي فقط على [1] ملخص + [6] معلومات شحيحة — ممنوع أقسام [2]-[5] للمسار [C]! التحليل الفارغ أسوأ من غياب التحليل! المسار [A] و [B]: fullContent يبدأ بـ [1] وينتهي بـ [6]. حقل path يجب أن يكون "A" أو "B" أو "C". futures = عقود آجلة وليس أسهم! chips (semiconductors) = رقائق إلكترونية NOT هشامات! session = جلسة NOT sesión! dollar = دولار NOT دينار! synthetic = اصطناعية NOT ماصة! tokens = توكنات/رموز NOT التokens! retail traders = المتداولون الأفراد NOT المستهلكين! credit score = درجة الائتمان الشخصية NOT سجل مالي! خفض الإنتاج يرفع الأسعار NOT يخفضها! المعالم الجغرافية ليست أصولاً مالية! المفاهيم الفضفاضة (العلاقات التجارية، الاقتصاد العالمي) ليست أصولاً! أخبار التجارة والتعريفات = مسار [A] حتماً. أخبار التمويل الشخصي (credit score, budgeting) = مسار [B] + قطاع تمويل شخصي. الأرقام المالية الواردة في النص الأصلي يجب تضمينها حرفياً. لا تخترع معلومات غير موجودة في النص الأصلي. ممنوع كلمات أجنبية (para, pero, avec, sesión...). ممنوع عبارات افتتاحية غير رسمية (حسناً، طبعاً...). ممنوع توصيات فارغة (مراعاة التوترات، مراقبة التطورات، يتناسب مع رغباتك). ⚠️⚠️⚠️ قاعدة V86 الحرجة: لا تعطِ وقف خسارة أو استهداف سعري على مفهوم غير قابل للتداول! إذا كان الخبر عن تحذير تنظيمي أو منتج مالي ناشئ → المسار [B] + isTradable = false + توصية = مراقبة التطورات! ممنوع مزج اللغات في العناوين (التtokens = خطأ! توكنات = صحيح). ⚠️⚠️⚠️ قاعدة V87 الحرجة: لا تغيّر موضوع الخبر أثناء الترجمة! إذا كان الخبر الأصلي موجّهاً للمستهلك الفرد (credit score, budgeting, personal finance) → القطاع = تمويل شخصي + المسار [B] + احفظ السياق الشخصي. credit score = درجة الائتمان الشخصية (NOT سجل مالي — هذا يغيّر الموضوع كلياً!). إذا وعد العنوان بـ "3 أساطير" أو "5 نصائح" → اذكرها فعلاً ولا تحذفها! ⚠️ قاعدة حرجة: كل حقل نصي في JSON يجب أن يكون بالعربية فقط — ممنوع ترك أي جملة إنجليزية بدون ترجمة. ترجم كل شيء أو احذفه. لا تترك أبداً نصاً إنجليزياً في أي حقل. ⚠️ قاعدة حرجة V74: التوصية يجب ألا تتناقض مع المشاعر — إيجابي ≠ بيعي، سلبي ≠ شرائي! ⚠️ قاعدة حرجة V74: وقف الخسارة بسعر السهم وليس بقيمة السوق الإجمالية! ⚠️ قاعدة حرجة V74: year-over-year = على أساس سنوي وليس العام الماضي! ⚠️ قاعدة حرجة V74: للشركات المعروفة (Samsung, TSMC, AMD...) اذكر الرمز البورصي الحقيقي من معرفتك — لا تقل "لا رمز واضح"!' },
          { role: 'user', content: analysisPrompt },
        ], { temperature: 0.4, maxTokens: 6000, priority: 'generation', locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout')), PIPELINE_CONFIG.ANALYSIS_TIMEOUT_MS)
        ),
      ]);

      if (analysisResponse.content) {
        analysisSuccess = await processAndSaveAnalysis(articleId, article, analysisResponse.content, titleEn, summaryEn, contentEn, title, summary, content);
      }
    } catch (err: any) {
      console.warn(`[Analyzer V88] Primary analysis failed: ${err.message}`);
    }

    // ── Retry with simpler gate-aware prompt if first attempt failed ──
    if (!analysisSuccess) {
      try {
        const retryResponse = await Promise.race([
          chatCompletion([
            {
              role: 'system',
              content: '⚠️ القواعد الخمس الحاسمة: (1) أجب بالعربية فقط لا كلمات أجنبية! (2) بيانات غير كافية → اكتب فقط لا تتوفر بيانات كافية! (3) لا تملأ قسماً بلا معلومة حقيقية! (4) التوصية تتوافق مع التصنيف دائماً! (5) V87: احفظ الموضوع الأصلي! credit score = درجة الائتمان الشخصية NOT سجل مالي! ═══ أنت نظام تحرير أخبار مالية يطبق نظام البوابات الأربع. أعطِ تحليلاً استثمارياً موجزاً بالعربية عن الخبر التالي بتنسيق JSON. قواعد حاسمة: futures = عقود آجلة وليس أسهم. المعالم الجغرافية ليست أصولاً مالية. لا تخترع معلومات غير موجودة في النص. V87: credit score = درجة الائتمان الشخصية (NOT سجل مالي!). التمويل الشخصي = قطاع تمويل شخصي + مسار [B]. التنسيق: {"rawData":{"entityNameEn":"اسم","ticker":"رمز","exchange":"بورصة","figures":[],"source":"مصدر"},"path":"A أو B أو C","sector":"القطاع بالعربية","sentimentReason":"تبرير المشاعر","editedArticle":"خبر محرر بـ 4 فقرات","fullContent":"تحليل استثماري يتبع الهيكل: [1] ملخص في جملتين | [2] أصول متأثرة مباشرة (أصول مالية فقط) | [3] أصول متأثرة بالتداعي | [4] السياق الأوسع | [5] سيناريوهات التداول (للمسار A فقط) | [6] توصية الخبراء","introduction":"2-3 جمل تمهيدية","body":"3-5 فقرات تحليل معمّق","conclusion":"2-3 جمل خلاصة استثمارية","summary":"ملخص في جملتين","sentiment":"positive/negative/neutral","impactLevel":"high/medium/low","keyTakeaways":["نقطة1"],"affectedAssets":[{"symbol":"رمز","name":"اسم","direction":"up/down/neutral","impactDegree":"high/medium/low","reason":"سبب","isTradable":true}],"recommendation":"توصية حادة في جملة واحدة","confidence":"X/10"}'
            },
            { role: 'user', content: `العنوان: ${titleEn || title}\nالملخص: ${summaryEn.slice(0, 300) || summary.slice(0, 200)}` },
          ], { temperature: 0.5, maxTokens: 1800, locale: 'ar' }),  // V387: Arabic pipeline — OpenRouter (Haiku) first
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Analysis retry timeout')), 30000)
          ),
        ]);

        if (retryResponse.content) {
          analysisSuccess = await processAndSaveAnalysis(articleId, article, retryResponse.content, titleEn, summaryEn, contentEn, title, summary, content);
        }
      } catch (err: any) {
        console.warn(`[Analyzer V88] Retry analysis failed: ${err.message}`);
      }
    }

    if (!analysisSuccess) {
      console.warn(`[Analyzer V88] All AI analysis attempts failed for ${articleId} — NOT saving fallback. Article will retry later.`);
    }

    if (analysisSuccess) {
      result.success = true;
    } else {
      result.error = 'Failed to generate quality analysis after retries';
    }

    result.duration = Date.now() - startTime;
    console.log(`[Analyzer V88] Article ${articleId}: ${result.success ? 'OK' : 'FAIL'} in ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.warn(`[Analyzer V88] Fatal failure for ${articleId}: ${err.message}`);
    return result;
  }
}

// Process analysis response and save to DB
// V73: Accepts article text for trade keyword detection
async function processAndSaveAnalysis(
  articleId: string, article: any, responseContent: string,
  titleEn: string, summaryEn: string, contentEn: string,
  titleAr: string, summaryAr: string, contentAr: string
): Promise<boolean> {
  try {
    // Extract JSON from response (AI sometimes wraps in markdown code blocks)
    let jsonStr = responseContent;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let analysisData: any;
    try {
      analysisData = JSON.parse(jsonStr);
    } catch {
      // If not valid JSON, create a structured analysis from the text
      analysisData = {
        fullContent: responseContent.slice(0, 1000),
        summary: responseContent.slice(0, 200),
        sentiment: 'neutral',
        impactLevel: 'medium',
        keyTakeaways: [],
        keyPoints: [],
        affectedAssets: [],
        recommendation: '',
      };
    }

    // ─── V74: Post-processing Validation Layer ───
    // This layer catches and fixes the most dangerous errors that slip through the AI prompt:
    // 1. Sentiment-recommendation contradiction (sell on positive, buy on negative)
    // 2. Market-cap stop-loss (900 billion dollars instead of share price)
    // 3. Path [C] with specific trading recommendation (contradiction)
    // 4. "لا رمز واضح" for well-known global companies
    // 5. Temporal errors ("العام الماضي" instead of "على أساس سنوي")

    // V74-1: SENTIMENT-RECOMMENDATION VALIDATION
    // If recommendation contradicts sentiment, auto-correct it
    const sentiment = String(analysisData.sentiment || '').toLowerCase();
    const recommendation = String(analysisData.recommendation || '');
    const fullContentStr = String(analysisData.fullContent || '');

    if (sentiment && recommendation) {
      const hasSellKeyword = SELL_KEYWORDS_AR.some(kw => recommendation.includes(kw));
      const hasBuyKeyword = BUY_KEYWORDS_AR.some(kw => recommendation.includes(kw));

      // Also check section [6] in fullContent for contradictory recommendation
      const section6Match = fullContentStr.match(/\[\s*6\s*\][^\[]*/);
      const section6HasSell = section6Match ? SELL_KEYWORDS_AR.some(kw => section6Match[0].includes(kw)) : false;
      const section6HasBuy = section6Match ? BUY_KEYWORDS_AR.some(kw => section6Match[0].includes(kw)) : false;

      // POSITIVE + SELL = DANGEROUS CONTRADICTION → Fix to buy/wait
      if (sentiment === 'positive' && (hasSellKeyword || section6HasSell)) {
        console.error(`[Analyzer V88] 🚨 DANGEROUS: Sell recommendation on POSITIVE news for ${articleId} — auto-correcting!`);

        // Replace sell keywords with buy/wait in recommendation
        let fixedRec = recommendation;
        fixedRec = fixedRec.replace(/مركز بيعي/g, 'مركز شرائي');
        fixedRec = fixedRec.replace(/اتخذ مركز بيعي/g, 'اتخذ مركز شرائي');
        fixedRec = fixedRec.replace(/بيعي/g, 'شرائي');
        fixedRec = fixedRec.replace(/بيع على المكشوف/g, 'شراء');
        // If stop-loss > target (sell logic), swap them for buy logic
        const slMatch = fixedRec.match(/وقف خسارة[^0-9]*([0-9.,]+\s*(?:وون|دولار|يورو|ين|يوان|جنيه|درهم|ريال)?)/);
        const tgtMatch = fixedRec.match(/استهداف[اً]*[^0-9]*([0-9.,]+\s*(?:وون|دولار|يورو|ين|يوان|جنيه|درهم|ريال)?)/);
        if (slMatch && tgtMatch) {
          // For buy: target > stop-loss. Swap if stop-loss > target
          const slVal = parseFloat(slMatch[1].replace(/,/g, ''));
          const tgtVal = parseFloat(tgtMatch[1].replace(/,/g, ''));
          if (!isNaN(slVal) && !isNaN(tgtVal) && slVal < tgtVal) {
            // Already correct for buy (SL < target), keep as is
          } else if (!isNaN(slVal) && !isNaN(tgtVal) && slVal > tgtVal) {
            // Wrong for buy — swap SL and target
            fixedRec = fixedRec.replace(slMatch[0], `وقف خسارة فوق ${tgtMatch[1]}`);
            fixedRec = fixedRec.replace(tgtMatch[0], `استهدافاً ${slMatch[1]}`);
          }
        }
        analysisData.recommendation = fixedRec;

        // Also fix fullContent section [6]
        if (section6HasSell && section6Match) {
          let fixedSection6 = section6Match[0];
          fixedSection6 = fixedSection6.replace(/مركز بيعي/g, 'مركز شرائي');
          fixedSection6 = fixedSection6.replace(/اتخذ مركز بيعي/g, 'اتخذ مركز شرائي');
          fixedSection6 = fixedSection6.replace(/بيعي/g, 'شرائي');
          analysisData.fullContent = fullContentStr.replace(section6Match[0], fixedSection6);
        }
      }

      // NEGATIVE + BUY = DANGEROUS CONTRADICTION → Fix to sell/wait
      if (sentiment === 'negative' && (hasBuyKeyword || section6HasBuy)) {
        console.error(`[Analyzer V88] 🚨 DANGEROUS: Buy recommendation on NEGATIVE news for ${articleId} — auto-correcting!`);

        let fixedRec = recommendation;
        fixedRec = fixedRec.replace(/مركز شرائي/g, 'مركز بيعي');
        fixedRec = fixedRec.replace(/اتخذ مركز شرائي/g, 'اتخذ مركز بيعي');
        fixedRec = fixedRec.replace(/شرائي/g, 'بيعي');
        fixedRec = fixedRec.replace(/اشترِ/g, 'بع');
        analysisData.recommendation = fixedRec;

        if (section6HasBuy && section6Match) {
          let fixedSection6 = section6Match[0];
          fixedSection6 = fixedSection6.replace(/مركز شرائي/g, 'مركز بيعي');
          fixedSection6 = fixedSection6.replace(/اتخذ مركز شرائي/g, 'اتخذ مركز بيعي');
          fixedSection6 = fixedSection6.replace(/شرائي/g, 'بيعي');
          analysisData.fullContent = String(analysisData.fullContent).replace(section6Match[0], fixedSection6);
        }
      }

      // V1049: NEUTRAL + BUY/SELL = CONTRADICTION → Fix to "مراقبة التطورات"
      // المشكلة: sentiment=neutral لكن recommendation="اتخذ مركز شرائي" — تناقض!
      // neutral يعني لا اتجاه واضح → التوصية يجب أن تكون "انتظار" أو "مراقبة"
      if (sentiment === 'neutral' && (hasBuyKeyword || hasSellKeyword || section6HasBuy || section6HasSell)) {
        console.warn(`[Analyzer V1049] ⚠ Neutral sentiment with buy/sell recommendation for ${articleId} — fixing to wait/monitor`);

        // استبدل التوصية كاملة بـ "مراقبة التطورات"
        analysisData.recommendation = 'مراقبة التطورات حتى يتضح الاتجاه — المشاعر محايدة';

        // أصلح قسم [6] في fullContent
        if (section6Match) {
          const fixedSection6 = '[6] توصية الخبراء: مراقبة التطورات حتى يتضح الاتجاه — المشاعر محايدة';
          analysisData.fullContent = String(analysisData.fullContent).replace(section6Match[0], fixedSection6);
        }
      }
    }

    // V89: CONDITIONAL ORDER CHECK — "على وشك" ≠ "اتخذ الآن"
    // Dow Jones problem: article says "about to exit correction" but recommendation
    // says "اتخذ مركزاً شرائياً الآن" (buy NOW). The correct logic is a conditional order.
    const editedArticleStr = String(analysisData.editedArticle || '');
    const introStr = String(analysisData.introduction || '');
    const bodyStr = String(analysisData.body || '');
    const conclusionStr = String(analysisData.conclusion || '');
    const allArticleText = `${editedArticleStr} ${introStr} ${bodyStr} ${conclusionStr}`;

    // Detect "about to / on the verge of" language in the article
    const pendingPatterns = [
      /على وشك/, /على أعتاب/, /في طريقه/, /قريب من/, /على حافة/,
      /يمكن أن/, /قد يتجاوز/, /قد يكسر/, /إذا تمكن من/, /إذا نجح في/,
      /شريطة أن/, /بشرط أن/, /في حال/, /في حالة/,
    ];
    const hasPendingLanguage = pendingPatterns.some(p => p.test(allArticleText));

    // Detect categorical "do it NOW" language in the recommendation
    const categoricalPatterns = [
      /اتخذ مركز[اً]* شرائياً? الآن/,
      /اتخذ مركز[اً]* بيعياً? الآن/,
      /قم بالشراء الآن/,
      /قم بالبيع الآن/,
      /اشترِ الآن/,
      /بع الآن/,
    ];
    const hasCategoricalRec = categoricalPatterns.some(p => p.test(String(analysisData.recommendation || '')));

    if (hasPendingLanguage && hasCategoricalRec) {
      // Article uses conditional language but recommendation is categorical — soften it
      const recStr = String(analysisData.recommendation || '');
      let fixedRec = recStr;

      // Replace categorical buy with conditional buy
      fixedRec = fixedRec.replace(/اتخذ مركز[اً]* شرائياً? الآن/, 'ضع أمر شراء مشروط');
      fixedRec = fixedRec.replace(/اتخذ مركز[اً]* بيعياً? الآن/, 'ضع أمر بيع مشروط');
      fixedRec = fixedRec.replace(/قم بالشراء الآن/, 'ضع أمر شراء مشروط');
      fixedRec = fixedRec.replace(/قم بالبيع الآن/, 'ضع أمر بيع مشروط');
      fixedRec = fixedRec.replace(/اشترِ الآن/, 'ضع أمر شراء مشروط');
      fixedRec = fixedRec.replace(/بع الآن/, 'ضع أمر بيع مشروط');

      // If there are price levels, make them conditional entry conditions
      // "مع وقف خسارة" → "بشرط إغلاق فوق [level]"
      const levelMatch = allArticleText.match(/(?:إغلاق|الحفاظ على|فوق|تحت)\s*(?:مستوى\s*)?([0-9.,]+)/);
      if (levelMatch) {
        const level = levelMatch[1];
        fixedRec = fixedRec.replace(/بشرط/, `بشرط إغلاق فوق ${level}`);
        if (!/بشرط|مشروط|إذا|عندما/.test(fixedRec)) {
          // Add condition if none exists
          fixedRec = fixedRec.replace(/\s*مع\s/, ` بشرط إغلاق فوق ${level} مع `);
        }
      }

      analysisData.recommendation = fixedRec;
      console.log(`[Analyzer V89] Softened categorical recommendation to conditional (article uses "about to" language): "${recStr.slice(0, 60)}" → "${fixedRec.slice(0, 60)}"`);

      // Also fix in fullContent section [6]
      if (typeof analysisData.fullContent === 'string') {
        let fc = analysisData.fullContent;
        fc = fc.replace(/اتخذ مركز[اً]* شرائياً? الآن/g, 'ضع أمر شراء مشروط');
        fc = fc.replace(/اتخذ مركز[اً]* بيعياً? الآن/g, 'ضع أمر بيع مشروط');
        fc = fc.replace(/قم بالشراء الآن/g, 'ضع أمر شراء مشروط');
        fc = fc.replace(/قم بالبيع الآن/g, 'ضع أمر بيع مشروط');
        analysisData.fullContent = fc;
      }
    }

    // V74-2: MARKET-CAP STOP-LOSS DETECTION
    // Stop-loss in market cap terms (e.g., "900 مليار دولار") is NOT tradeable
    // A stop-loss must be a per-share price, not a total market value
    for (const field of ['recommendation', 'fullContent']) {
      if (typeof analysisData[field] === 'string') {
        const fieldStr = analysisData[field];
        // Detect stop-loss with billion/million market-cap values
        const marketCapStopLoss = /وقف خسارة[^0-9]*[0-9.,]+\s*(مليار|مليون)\s*(دولار|يورو|وون|ين)/;
        if (marketCapStopLoss.test(fieldStr)) {
          console.error(`[Analyzer V88] 🚨 Market-cap stop-loss detected in ${field} for ${articleId} — removing!`);
          // Replace with a generic correction
          if (field === 'recommendation') {
            // Can't fix without share price data — make recommendation wait-based
            const entityName = analysisData.rawData?.entityNameEn || '';
            const ticker = analysisData.rawData?.ticker || '';
            if (sentiment === 'positive') {
              analysisData[field] = `انتظر تصحيح سعر السهم ثم اتخذ مركز شرائي على ${entityName} (${ticker}) مع وقف خسارة تحت أقرب دعم فني`;
            } else if (sentiment === 'negative') {
              analysisData[field] = `انتظر ارتداد السهم ثم اتخذ مركز بيعي على ${entityName} (${ticker}) مع وقف خسارة فوق أقرب مقاومة فنية`;
            } else {
              analysisData[field] = `راقب مستويات الدعم والمقاومة لـ ${entityName} (${ticker}) قبل اتخاذ أي قرار تداول`;
            }
          } else {
            // For fullContent, fix section [6]
            analysisData[field] = fieldStr.replace(
              /وقف خسارة[^.؟]*?مليار[^.؟]*?[.؟]/,
              'وقف خسارة عند مستوى دعم فني قريب من السعر الحالي.'
            );
          }
        }
      }
    }

    // V74-3: PATH [C] + SPECIFIC RECOMMENDATION CONTRADICTION
    // Path [C] means scarce info — but a specific buy/sell recommendation contradicts that
    if (analysisData.path === 'C') {
      const recStr = String(analysisData.recommendation || '');
      const hasSpecificAction = SELL_KEYWORDS_AR.some(kw => recStr.includes(kw)) || BUY_KEYWORDS_AR.some(kw => recStr.includes(kw));
      if (hasSpecificAction) {
        console.warn(`[Analyzer V88] Path [C] with specific trading recommendation — fixing to "insufficient data" for ${articleId}`);
        analysisData.recommendation = 'البيانات غير كافية لوضع توصية تداول محددة — يُنصح بالانتظار حتى تتوفر تفاصيل أكثر';
        // Also fix fullContent section [6]
        if (typeof analysisData.fullContent === 'string') {
          const fcSection6 = analysisData.fullContent.match(/(\[\s*6\s*\][^\[]*)/);
          if (fcSection6 && (SELL_KEYWORDS_AR.some(kw => fcSection6[0].includes(kw)) || BUY_KEYWORDS_AR.some(kw => fcSection6[0].includes(kw)))) {
            analysisData.fullContent = analysisData.fullContent.replace(
              /\[\s*6\s*\][^\[]*/,
              '[6] توصية الخبراء: البيانات غير كافية لوضع توصية تداول محددة — يُنصح بالانتظار حتى تتوفر تفاصيل أكثر'
            );
          }
        }
      }
    }

    // V76-1: PATH [C] MINIMAL ANALYSIS ENFORCEMENT
    // When path is [C] (scarce info), strip sections [2]-[5] from fullContent
    // These sections are inevitably empty or fabricated when data is insufficient
    // "التحليل الفارغ أسوأ من غياب التحليل"
    if (analysisData.path === 'C' && typeof analysisData.fullContent === 'string') {
      const fc = analysisData.fullContent;

      // Extract only [1] and [6] sections, discard [2]-[5]
      const section1Match = fc.match(/\[\s*1\s*\][^\[]*/);
      const section6Match = fc.match(/\[\s*6\s*\][^\[]*/);

      const section1 = section1Match ? section1Match[0].trim() : '[1] ملخص الحدث: ' + (analysisData.summary || 'لا تتوفر تفاصيل كافية');
      const section6 = section6Match ? section6Match[0].trim() : '[6] معلومات شحيحة — البيانات غير كافية لتحليل موثوق أو توصية تداول محددة';

      // Rebuild fullContent with only [1] and [6]
      const originalLength = fc.length;
      analysisData.fullContent = section1 + '\n\n' + section6;

      if (originalLength > analysisData.fullContent.length + 50) {
        console.warn(`[Analyzer V88] Path [C] — stripped fabricated sections [2]-[5] from fullContent (${originalLength} → ${analysisData.fullContent.length} chars) for ${articleId}`);
      }

      // Also simplify introduction/body/conclusion for Path [C]
      if (typeof analysisData.introduction === 'string' && analysisData.introduction.length > 100) {
        analysisData.introduction = analysisData.summary || 'خبر بمعلومات شحيحة — لا تتوفر بيانات كافية لتحليل معمّق';
      }
      if (typeof analysisData.body === 'string' && analysisData.body.length > 150) {
        analysisData.body = 'المعلومات المتوفرة لا تكفي لتحليل معمّق موثوق. يُنصح بالانتظار حتى تتوفر تفاصيل إضافية عن الحدث قبل اتخاذ أي قرار استثماري.';
      }
      if (typeof analysisData.conclusion === 'string' && analysisData.conclusion.length > 100) {
        analysisData.conclusion = 'بيانات غير كافية — لا يمكن تقديم خلاصة استثمارية موثوقة بناءً على المعلومات الشحيحة المتاحة';
      }
      // V84: Also simplify editedArticle for Path [C] — prevent translation errors in scarce articles
      if (typeof analysisData.editedArticle === 'string' && analysisData.editedArticle.length > 200) {
        // Keep only the first paragraph (the main event), strip the rest
        const paragraphs = analysisData.editedArticle.split('|');
        if (paragraphs.length > 1) {
          analysisData.editedArticle = paragraphs[0].trim();
        } else {
          analysisData.editedArticle = analysisData.summary || analysisData.editedArticle.slice(0, 150);
        }
      }

      // Ensure keyTakeaways is minimal for Path [C]
      if (Array.isArray(analysisData.keyTakeaways) && analysisData.keyTakeaways.length > 2) {
        analysisData.keyTakeaways = analysisData.keyTakeaways.slice(0, 2);
      }
      if (!Array.isArray(analysisData.keyTakeaways) || analysisData.keyTakeaways.length === 0) {
        analysisData.keyTakeaways = ['المعلومات الشحيحة لا تسمح باستخلاص نقاط تحليلية موثوقة'];
      }

      // Ensure recommendation is the standard disclaimer
      analysisData.recommendation = 'معلومات شحيحة — البيانات غير كافية لوضع توصية تداول محددة';
    }

    // V76-2: DUPLICATE SECTION NUMBER DETECTION
    // If [5] or [6] appears twice in fullContent, the analysis is broken
    if (typeof analysisData.fullContent === 'string') {
      const fc = analysisData.fullContent;
      for (const sectionNum of ['2', '3', '4', '5', '6']) {
        const regex = new RegExp(`\\[\\s*${sectionNum}\\s*\\]`, 'g');
        const matches = fc.match(regex);
        if (matches && matches.length > 1) {
          console.error(`[Analyzer V88] 🚨 Duplicate section [${sectionNum}] detected (${matches.length} times) in fullContent for ${articleId} — analysis is broken, treating as Path [C]`);
          // Force to Path [C] minimal analysis
          analysisData.path = 'C';
          const section1Match = fc.match(/\[\s*1\s*\][^\[]*/);
          analysisData.fullContent = (section1Match ? section1Match[0].trim() : '[1] ملخص الحدث: ' + (analysisData.summary || 'لا تتوفر تفاصيل كافية')) + '\n\n[6] معلومات شحيحة — التحليل تكراري وغير موثوق';
          analysisData.recommendation = 'معلومات شحيحة — البيانات غير كافية لوضع توصية تداول محددة';
          break;
        }
      }
    }

    // V76-3: INVERTED ECONOMIC LOGIC DETECTION
    // "خفض الإنتاج" + "تراجع/انخفاض الأسعار" = contradiction (cutting production raises prices)
    if (typeof analysisData.fullContent === 'string' || typeof analysisData.editedArticle === 'string') {
      const textToCheck = String(analysisData.fullContent || '') + ' ' + String(analysisData.editedArticle || '');
      const hasProductionCut = /خفض الإنتاج|خفض عرض|تخفيض الإنتاج|تخفيض الإمداد/.test(textToCheck);
      const hasPriceDrop = /تراجع الأسعار|انخفاض الأسعار|هبوط الأسعار/.test(textToCheck);
      if (hasProductionCut && hasPriceDrop) {
        console.error(`[Analyzer V88] 🚨 Inverted economic logic: production cut + price drop = contradiction for ${articleId}`);
        // Fix: Replace the contradiction with correct logic
        for (const field of ['fullContent', 'editedArticle', 'introduction', 'body'] as const) {
          if (typeof analysisData[field] === 'string') {
            analysisData[field] = analysisData[field].replace(
              /تراجع أسعار (النفط|السلع|الذهب) بسبب خفض الإنتاج/g,
              'ارتفعت أسعار $1 بسبب خفض الإنتاج'
            );
            analysisData[field] = analysisData[field].replace(
              /انخفاض أسعار (النفط|السلع|الذهب) بسبب خفض الإنتاج/g,
              'ارتفعت أسعار $1 بسبب خفض الإنتاج'
            );
            analysisData[field] = analysisData[field].replace(
              /تراجع الأسعار بسبب خفض العرض/g,
              'ارتفعت الأسعار بسبب خفض العرض'
            );
            analysisData[field] = analysisData[field].replace(
              /انخفاض الأسعار بسبب خفض العرض/g,
              'ارتفعت الأسعار بسبب خفض العرض'
            );
          }
        }
      }
    }

    // V76-4: GENERIC WORTHLESS RECOMMENDATION DETECTION
    // These are not real trading recommendations — they're filler
    const worthlessRecommendations = [
      /يتناسب مع رغباتك/i,
      /يتوافق مع أهدافك/i,
      /يناسب ظروفك/i,
      /يراعي ظروفك/i,
      /بحذر/i,
      /بتحفظ/i,
      /بشكل عام/i,
      /استشر مستشاراً مالياً/i,
    ];
    if (analysisData.path !== 'C') {
      const recStr = String(analysisData.recommendation || '');
      const isWorthless = worthlessRecommendations.some(p => p.test(recStr));
      if (isWorthless) {
        console.warn(`[Analyzer V88] Worthless recommendation detected: "${recStr}" for ${articleId} — replacing with wait-based recommendation`);
        const sentiment2 = String(analysisData.sentiment || '').toLowerCase();
        const entityName = analysisData.rawData?.entityNameEn || '';
        const ticker = analysisData.rawData?.ticker || '';
        if (sentiment2 === 'positive') {
          analysisData.recommendation = `انتظر تأكيد الاتجاه الصعودي على ${entityName} (${ticker}) قبل الدخول بمركز شرائي`;
        } else if (sentiment2 === 'negative') {
          analysisData.recommendation = `انتظر تأكيد الاتجاه الهبوطي على ${entityName} (${ticker}) قبل الدخول بمركز بيعي`;
        } else {
          analysisData.recommendation = `انتظر حتى تتوفر بيانات كافية لاتخاذ قرار تداول محدد على ${entityName} (${ticker})`;
        }
      }
    }

    // V74-4: KNOWN GLOBAL TICKER LOOKUP
    // If AI says "لا رمز واضح" or "لا يوجد أصل مدرج مؤكد" for a well-known company,
    // look it up in our known tickers database
    if (analysisData.rawData) {
      const entityName = String(analysisData.rawData.entityNameEn || '').toLowerCase();
      const ticker = String(analysisData.rawData.ticker || '');
      const noTicker = !ticker ||
        ticker === 'لا يوجد أصل مدرج مؤكد' ||
        ticker.toLowerCase() === 'n/a' ||
        ticker === '-' ||
        ticker === 'لا رمز واضح' ||
        ticker.length < 1;

      if (entityName && noTicker) {
        // Try exact match first, then partial match
        let matched = KNOWN_GLOBAL_TICKERS[entityName];
        if (!matched) {
          // Try partial match (e.g., "Samsung Electronics" contains "samsung")
          for (const [key, val] of Object.entries(KNOWN_GLOBAL_TICKERS)) {
            if (entityName.includes(key) || key.includes(entityName)) {
              matched = val;
              break;
            }
          }
        }
        if (matched) {
          console.warn(`[Analyzer V88] Auto-filled known ticker for "${entityName}": ${matched.ticker} (${matched.exchange}) for ${articleId}`);
          analysisData.rawData.ticker = matched.ticker;
          analysisData.rawData.exchange = matched.exchange;

          // If this was classified as [C] due to no ticker, promote to [A]
          if (analysisData.path === 'C') {
            analysisData.path = 'A';
            console.warn(`[Analyzer V88] Promoted path from [C] to [A] — known ticker found for ${articleId}`);
          }

          // Update affectedAssets with the real ticker
          if (Array.isArray(analysisData.affectedAssets)) {
            const hasCompanyAsset = analysisData.affectedAssets.some((a: any) => {
              const sym = String(a.symbol || '').toUpperCase();
              return sym === matched.ticker.toUpperCase() || sym.includes(matched.ticker.split('.')[0]);
            });
            if (!hasCompanyAsset) {
              analysisData.affectedAssets.unshift({
                symbol: matched.ticker,
                name: matched.nameAr,
                direction: sentiment === 'positive' ? 'up' : sentiment === 'negative' ? 'down' : 'neutral',
                impactDegree: 'high',
                reason: analysisData.sentimentReason || 'تأثير مباشر من الحدث',
                isTradable: true,
              });
            } else {
              // Update the existing asset with the real ticker
              for (const asset of analysisData.affectedAssets) {
                const sym = String(asset.symbol || '').toUpperCase();
                if (sym.includes(entityName.toUpperCase().split(' ')[0]) || sym === 'لا رمز واضح' || !sym) {
                  asset.symbol = matched.ticker;
                  asset.name = matched.nameAr;
                  asset.isTradable = true;
                }
              }
            }
          }
        }
      }
    }

    // V74-5: TEMPORAL ACCURACY FIX
    // "العام الماضي" used for year-over-year comparison is wrong
    for (const field of ['editedArticle', 'fullContent', 'introduction', 'body']) {
      if (typeof analysisData[field] === 'string') {
        const fieldStr = analysisData[field];
        // Pattern: "الربع الأول من العام الماضي" should be "الربع الأول على أساس سنوي"
        if (/الربع الأول من العام الماضي/.test(fieldStr)) {
          analysisData[field] = fieldStr.replace(/الربع الأول من العام الماضي/g, 'الربع الأول على أساس سنوي');
          console.warn(`[Analyzer V88] Fixed temporal error "الربع الأول من العام الماضي" → "الربع الأول على أساس سنوي" in ${field} for ${articleId}`);
        }
        if (/أرباح التشغيل للربع الأول من العام الماضي/.test(fieldStr)) {
          analysisData[field] = fieldStr.replace(/أرباح التشغيل للربع الأول من العام الماضي/g, 'أرباح التشغيل للربع الأول على أساس سنوي');
          console.warn(`[Analyzer V88] Fixed temporal error in ${field} for ${articleId}`);
        }
      }
    }

    // ─── V86: NON-TRADEABLE ASSET DETECTION ───
    // Critical safety check: prevent specific trading recommendations on non-tradeable assets.
    // Examples: "synthetic stock tokens", "tokenization concept", "regulatory warning"
    // These are NOT tradeable instruments — no ticker, no price, no stop-loss possible.
    // Giving "مركز بيعي مع وقف خسارة عند 100$" on a concept is DANGEROUS.
    {
      const NON_TRADEABLE_PATTERNS = [
        /توكنات? اصطناعية/i,        // synthetic tokens
        /الماصة/i,                    // catastrophic mistranslation of synthetic
        /التوكنات الماصة/i,          // combined mistranslation
        /رموز اصطناعية/i,            // synthetic symbols/tokens
        /تحذير تنظيمي/i,             // regulatory warning (not a tradeable event)
        /توكنة|تكنة/i,               // tokenization concept
        /tokenization/i,              // English tokenization
        /synthetic.*token/i,          // English synthetic token
        /تهرب تنظيمي/i,              // regulatory arbitrage (concept, not asset)
      ];

      const recStr = String(analysisData.recommendation || '');
      const fcStr = String(analysisData.fullContent || '');
      const articleTitle = String(analysisData.summary || analysisData.introduction || '');

      // Check if article is about a non-tradeable concept
      const isNonTradeableTopic = NON_TRADEABLE_PATTERNS.some(p => p.test(fcStr) || p.test(articleTitle));

      // Also check: does the recommendation contain specific price targets on a non-tradeable?
      const hasPriceTarget = /وقف خسارة عند\s*\d+|استهدافاً?\s*\d+|هدف\s*(سعر|مستوى)\s*\d+|مستوى\s*\d+\s*دولار/.test(recStr);
      const hasSpecificAction = SELL_KEYWORDS_AR.some(kw => recStr.includes(kw)) || BUY_KEYWORDS_AR.some(kw => recStr.includes(kw));

      // Check affectedAssets: are any of them actually non-tradeable concepts?
      let hasNonTradeableAsset = false;
      if (Array.isArray(analysisData.affectedAssets)) {
        for (const asset of analysisData.affectedAssets) {
          const assetName = String(asset.name || asset.symbol || '');
          const isTradable = asset.isTradable !== false && asset.symbol && asset.symbol !== 'لا يوجد أصل مدرج مؤكد' && asset.symbol !== 'لا رمز واضح';
          if (!isTradable || NON_TRADEABLE_PATTERNS.some(p => p.test(assetName))) {
            hasNonTradeableAsset = true;
            asset.isTradable = false;
            console.warn(`[Analyzer V86] Non-tradeable asset detected: "${assetName}" for ${articleId}`);
          }
        }
      }

      // If the article topic is non-tradeable OR assets are non-tradeable
      // AND there's a specific trading recommendation with price targets → DANGEROUS
      if ((isNonTradeableTopic || hasNonTradeableAsset) && hasSpecificAction && hasPriceTarget) {
        console.error(`[Analyzer V86] 🚨 DANGEROUS: Specific price-target recommendation on non-tradeable asset for ${articleId} — overriding!`);
        analysisData.recommendation = 'لا يمكن تقديم توصية تداول محددة — الموضوع تنظيمي/مفاهيمي وليس أصلاً قابلاً للتداول بسعر محدد';

        // Also fix fullContent section [5] and [6] — remove any price targets
        if (typeof analysisData.fullContent === 'string') {
          // Replace section [5] (scenarios) if it has price targets on non-tradeable
          analysisData.fullContent = analysisData.fullContent.replace(
            /\[\s*5\s*\][^\[]*(?:وقف خسارة|استهداف|مركز بيعي|مركز شرائي)[^\[]*/g,
            '[5] سيناريوهات التداول: لا ينطبق — الموضوع تنظيمي وليس فرصة تداول محددة'
          );
          // Replace section [6] if it has specific price targets
          analysisData.fullContent = analysisData.fullContent.replace(
            /\[\s*6\s*\][^\[]*(?:وقف خسارة عند|استهدافاً?\s*\d+)[^\[]*/g,
            '[6] لا يمكن تقديم توصية تداول محددة — الموضوع تنظيمي/مفاهيمي وليس أصلاً قابلاً للتداول'
          );
        }

        // Downgrade to Path [B] — this is regulatory/macro, not a tradeable event
        if (analysisData.path === 'A') {
          analysisData.path = 'B';
          console.warn(`[Analyzer V86] Downgraded path from [A] to [B] — non-tradeable concept for ${articleId}`);
        }
      }

      // V86: Even without price targets, if the topic is non-tradeable and has buy/sell recommendation
      if ((isNonTradeableTopic || hasNonTradeableAsset) && hasSpecificAction && !hasPriceTarget) {
        console.warn(`[Analyzer V86] Specific action recommendation on non-tradeable concept for ${articleId} — fixing`);
        analysisData.recommendation = 'يُنصح بالانتظار ومراقبة التطورات التنظيمية — لا يمكن تحديد مركز تداول على مفهوم غير قابل للتداول';
      }
    }

    // ─── V87: PERSONAL FINANCE TOPIC FIDELITY CHECK ───
    // Detect when the original English article is about personal finance (credit score,
    // budgeting, personal loans) but the Arabic analysis talks about corporate finance
    // (financial records, corporate earnings, production costs). This is a TOPIC TRANSFORMATION
    // error — the translation changed the entire subject.
    {
      const PERSONAL_FINANCE_KEYWORDS_EN = [
        'credit score', 'credit report', 'fico', 'credit bureau',
        'personal loan', 'budgeting', 'personal finance', 'savings account',
        'mortgage rate', 'retirement planning', 'credit card debt',
        'financial literacy', 'consumer credit', 'debt consolidation',
        'credit utilization', 'payment history', 'credit myth', 'credit myths',
        'bills on time', 'pay your bills', 'credit monitoring',
      ];

      const CORPORATE_FINANCE_KEYWORDS_AR = [
        'السجل المالي', 'سجل مالي', 'السجلات المالية', 'سجلات مالية',
        'تكاليف الإنتاج', 'الإيرادات والتكاليف', 'الديون المؤسسية',
        'الأرباح التشغيلية', 'القوائم المالية', 'الميزانية العمومية',
        'التدفقات النقدية', 'حقوق المساهمين',
      ];

      const titleEnLower = String(titleEn || '').toLowerCase();
      const summaryEnLower = String(summaryEn || '').toLowerCase();
      const contentEnLower = String(contentEn || '').slice(0, 1000).toLowerCase();
      const allEnText = `${titleEnLower} ${summaryEnLower} ${contentEnLower}`;

      // Check if original English article is about personal finance
      const isPersonalFinanceEn = PERSONAL_FINANCE_KEYWORDS_EN.some(kw => allEnText.includes(kw));

      if (isPersonalFinanceEn) {
        // Check if Arabic analysis uses corporate finance language
        const fcStr = String(analysisData.fullContent || '');
        const editedStr = String(analysisData.editedArticle || '');
        const bodyStr = String(analysisData.body || '');
        const allArText = `${fcStr} ${editedStr} ${bodyStr}`;

        const hasCorporateLanguage = CORPORATE_FINANCE_KEYWORDS_AR.some(kw => allArText.includes(kw));
        const hasPersonalFinanceAr = /درجة الائتمان|ائتمان شخصي|ميزانية شخصية|مدخرات|قرض شخصي|رهن عقاري/.test(allArText);

        if (hasCorporateLanguage && !hasPersonalFinanceAr) {
          console.error(`[Analyzer V88] 🚨 TOPIC TRANSFORMATION: Original article is personal finance but Arabic uses corporate language for ${articleId}`);

          // Force sector to "تمويل شخصي"
          analysisData.sector = 'تمويل شخصي';

          // Force path to [B] — personal finance is not tradeable
          if (analysisData.path === 'A') {
            analysisData.path = 'B';
            console.warn(`[Analyzer V88] Downgraded path [A] → [B] — personal finance article for ${articleId}`);
          }

          // Fix editedArticle — replace corporate terms with personal finance terms
          for (const field of ['editedArticle', 'fullContent', 'introduction', 'body', 'conclusion', 'summary'] as const) {
            if (typeof analysisData[field] === 'string') {
              let fixed = analysisData[field];
              fixed = fixed.replace(/السجل المالي للشركات/g, 'درجة الائتمان الشخصية');
              fixed = fixed.replace(/سجلات? المالية للشركات/g, 'درجات الائتمان الشخصية');
              fixed = fixed.replace(/السجلات المالية/g, 'درجات الائتمان الشخصية');
              fixed = fixed.replace(/السجل المالي/g, 'درجة الائتمان الشخصية');
              fixed = fixed.replace(/سجل مالي/g, 'درجة ائتمان شخصية');
              fixed = fixed.replace(/تكاليف الإنتاج/g, 'المصاريف الشخصية');
              fixed = fixed.replace(/الديون المؤسسية/g, 'الديون الشخصية');
              fixed = fixed.replace(/إيرادات الشركة/g, 'دخل الفرد');
              if (fixed !== analysisData[field]) {
                console.warn(`[Analyzer V88] Fixed topic transformation in ${field} for ${articleId}`);
                analysisData[field] = fixed;
              }
            }
          }

          // Fix sector in rawData
          if (analysisData.rawData) {
            analysisData.rawData.entityNameEn = analysisData.rawData.entityNameEn || 'Personal Finance';
          }

          // Fix recommendation — personal finance articles shouldn't have trading recommendations
          if (analysisData.recommendation) {
            const recStr = String(analysisData.recommendation);
            if (SELL_KEYWORDS_AR.some(kw => recStr.includes(kw)) || BUY_KEYWORDS_AR.some(kw => recStr.includes(kw))) {
              analysisData.recommendation = 'مقال توعوي عن التمويل الشخصي — لا ينطبق عليه توصية تداول';
            }
          }

          // Fix affectedAssets — personal finance has no tradeable assets
          if (Array.isArray(analysisData.affectedAssets)) {
            analysisData.affectedAssets = analysisData.affectedAssets.map((a: any) => ({
              ...a,
              isTradable: false,
              reason: 'مقال توعوي عن التمويل الشخصي — ليس أصلاً قابلاً للتداول',
            }));
          }
        }

        // Even if Arabic doesn't have corporate language, ensure sector is correct
        if (analysisData.sector && !/تمويل شخصي|ثقافة مالية|ائتمان شخصي/.test(String(analysisData.sector))) {
          console.warn(`[Analyzer V88] Personal finance article classified as "${analysisData.sector}" — fixing to "تمويل شخصي" for ${articleId}`);
          analysisData.sector = 'تمويل شخصي';
        }

        // Ensure path is [B] for personal finance
        if (analysisData.path === 'A') {
          analysisData.path = 'B';
          console.warn(`[Analyzer V88] Personal finance article on path [A] → [B] for ${articleId}`);
        }
      }
    }

    // ─── V73: Post-processing for Four Gates System ───

    // 1. Auto-remove forbidden phrases from all text fields
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof analysisData[field] === 'string') {
        for (const phrase of FORBIDDEN_PHRASES) {
          analysisData[field] = analysisData[field].replace(new RegExp(phrase, 'g'), '');
        }
        // Clean up double spaces left after removal
        analysisData[field] = analysisData[field].replace(/\s{2,}/g, ' ').trim();
      }
    }

    // V73: Auto-fix foreign words (para, pero, avec...) in all text fields
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof analysisData[field] === 'string') {
        for (const [pattern, replacement] of FOREIGN_WORD_PATTERNS) {
          if (pattern.test(analysisData[field])) {
            analysisData[field] = analysisData[field].replace(pattern, replacement);
            console.warn(`[Analyzer V88] Fixed foreign word in ${field} for ${articleId}: ${pattern.source} → ${replacement}`);
          }
        }
      }
    }

    // V71: Auto-fix common mistranslations
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof analysisData[field] === 'string') {
        for (const [pattern, replacement] of TRANSLATION_FIXES) {
          if (pattern.test(analysisData[field])) {
            analysisData[field] = analysisData[field].replace(pattern, replacement);
            console.warn(`[Analyzer V88] Fixed mistranslation in ${field} for ${articleId}: ${pattern.source} → ${replacement}`);
          }
        }
      }
    }

    // V70.1: Auto-replace company name placeholders with actual entity name from rawData
    const entityNameEn = analysisData.rawData?.entityNameEn;
    if (entityNameEn && typeof entityNameEn === 'string' && entityNameEn.length > 1) {
      const entityNameAr = entityNameEn; // Use English as fallback — better than "شركة ما"
      for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
        if (typeof analysisData[field] === 'string') {
          for (const placeholder of COMPANY_NAME_PLACEHOLDERS) {
            if (placeholder.test(analysisData[field])) {
              analysisData[field] = analysisData[field].replace(placeholder, `${entityNameAr} (${entityNameEn})`);
              console.warn(`[Analyzer V88] Replaced company placeholder with "${entityNameEn}" in ${field} for ${articleId}`);
            }
          }
        }
      }
    }

    // 2. Validate path field — default to "B" if missing/invalid
    if (!analysisData.path || !['A', 'B', 'C'].includes(analysisData.path)) {
      // Try to infer path from rawData.ticker or commodity symbols
      if (analysisData.rawData?.ticker && analysisData.rawData.ticker !== 'لا يوجد أصل مدرج مؤكد') {
        analysisData.path = 'A'; // Has a ticker → tradeable
      } else {
        analysisData.path = 'B'; // Default to macro
      }
      console.warn(`[Analyzer V88] Path missing/invalid, inferred as [${analysisData.path}] for ${articleId}`);
    }

      // V73: Detect trade/tariff/forex news and promote to path [A] if classified as [B]
      // Trade tensions, tariffs, and trade deals directly affect currency pairs and indices
      if (analysisData.path === 'B') {
        const sector = String(analysisData.sector || '').toLowerCase();
        const titleLower = String(titleEn || titleAr || '').toLowerCase();
        const summaryLower = String(summaryEn || summaryAr || '').toLowerCase();
        const contentLower = String(contentEn || contentAr || '').toLowerCase();
        const allText = `${sector} ${titleLower} ${summaryLower.slice(0, 300)} ${contentLower.slice(0, 500)}`;

      const tradeKeywords = [
        'tariff', 'tariffs', 'trade deal', 'trade agreement', 'trade terms', 'trade tension',
        'trade war', 'trade dispute', 'trade negotiation', 'trade policy', 'duties',
        'import tariff', 'export tariff', 'customs dut',
        'تعريفات', 'رسوم جمركية', 'حرب تجارية', 'توترات تجارية', 'اتفاقية تجارية',
        'شروط تجارية', 'نزاع تجاري', 'مفاوضات تجارية',
      ];
      const hasTradeKeyword = tradeKeywords.some(kw => allText.includes(kw));

      // Check if article mentions major currency pairs or indices in context
      const forexIndexKeywords = [
        'eur/usd', 'eurusd', 'dax', 'cac 40', 'ftse', 's&p 500', 'spx', 'euro', 'dollar',
        'usd/cny', 'usdcny', 'usd/jpy', 'usdjpy', 'gbp/usd', 'gbpusd',
      ];
      const hasForexIndex = forexIndexKeywords.some(kw => allText.includes(kw));

      if (hasTradeKeyword && hasForexIndex) {
        console.warn(`[Analyzer V88] Path [B] → promoting to [A] — trade/tariff news with forex/index keywords for ${articleId}`);
        analysisData.path = 'A';
      } else if (hasTradeKeyword) {
        // Trade news without explicit forex mentions — still likely affects currencies
        console.warn(`[Analyzer V88] Path [B] → promoting to [A] — trade/tariff news detected for ${articleId}`);
        analysisData.path = 'A';
      }

      // V90: Detect crypto/Bitcoin/ETF news and promote to path [A] if classified as [B]
      // Articles about Bitcoin ETFs, crypto custody, digital assets = tradeable assets, NOT macro!
      // Example: Bitcoin ETF article mentioning COIN, IBIT, FBTC → path [A] + sector "أصول رقمية"
      const hasCryptoKeyword = CRYPTO_ETF_KEYWORDS_EN.some(kw => allText.includes(kw)) ||
        CRYPTO_ETF_KEYWORDS_AR.some(kw => allText.includes(kw));

      // Also check: does the article mention known crypto/ETF tickers in rawData or affectedAssets?
      const rawDataTickerLower = String(analysisData.rawData?.ticker || '').toLowerCase();
      const rawDataEntityLower = String(analysisData.rawData?.entityNameEn || '').toLowerCase();
      const hasCryptoTicker = ['coin', 'mstr', 'ibit', 'fbtc', 'arkb', 'bitb', 'ezbc', 'hodl',
        'gbtc', 'etha', 'feth', 'ethe', 'mara', 'riot', 'clsk', 'hood', 'btc', 'eth'].some(
        t => rawDataTickerLower === t || rawDataTickerLower.includes(t)
      );
      const hasCryptoEntity = CRYPTO_ETF_KEYWORDS_EN.some(kw => rawDataEntityLower.includes(kw));

      if (hasCryptoKeyword || hasCryptoTicker || hasCryptoEntity) {
        console.warn(`[Analyzer V90] Path [B] → promoting to [A] — crypto/ETF news detected for ${articleId}`);
        analysisData.path = 'A';

        // V90: Auto-fix sector to "أصول رقمية" for crypto articles
        const currentSector = String(analysisData.sector || '');
        if (/اقتصاد كلي|مالي|أسواق/i.test(currentSector) || currentSector.length < 3) {
          analysisData.sector = 'أصول رقمية';
          console.warn(`[Analyzer V90] Sector auto-fixed to "أصول رقمية" for ${articleId} (was: "${currentSector}")`);
        }
      }
    }

    // V71: Validate ticker/exchange combination
    // If rawData indicates no clear ticker, force path to [C] (not [A])
    // BUT: Commodity futures tickers (CL, BZ, GC...) are valid tickers for [A]
    if (analysisData.rawData) {
      const ticker = String(analysisData.rawData.ticker || '');
      const exchange = String(analysisData.rawData.exchange || '');
      const noTicker = !ticker ||
        ticker === 'لا يوجد أصل مدرج مؤكد' ||
        ticker.toLowerCase() === 'n/a' ||
        ticker === '-' ||
        ticker.length < 1;

      // V71: Check if this is a commodity symbol — if so, it's valid for [A]
      const isCommodity = COMMODITY_SYMBOLS.some(s => ticker.toUpperCase() === s || ticker.toUpperCase().startsWith(s));

      if (noTicker && !isCommodity && analysisData.path === 'A') {
        // AI classified as [A] but there's no real ticker — demote to [C]
        console.warn(`[Analyzer V88] Path [A] but no valid ticker "${ticker}" — demoting to [C] for ${articleId}`);
        analysisData.path = 'C';
      }

      // Validate exchange — if ticker claims to be on a major exchange, verify format
      const majorExchanges = ['NYSE', 'NASDAQ', 'LSE', 'TSE', 'ASX', 'TSX', 'HKEX', 'SSE', 'SZSE', 'BSE', 'NSE', 'FWB', 'Euronext'];
      const commodityExchanges = ['NYMEX', 'COMEX', 'ICE', 'CBOT', 'CME', 'TOCOM'];
      const allExchanges = [...majorExchanges, ...commodityExchanges];
      if (exchange && allExchanges.some(ex => exchange.toUpperCase().includes(ex))) {
        // For commodity exchanges, ticker format is different (CL, BZ, GC etc.)
        const isOnCommodityExchange = commodityExchanges.some(ex => exchange.toUpperCase().includes(ex));
        if (!isOnCommodityExchange) {
          // Stock exchange: verify ticker looks like a real exchange ticker
          if (noTicker || !/^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(ticker)) {
            console.warn(`[Analyzer V88] Exchange "${exchange}" claimed but ticker "${ticker}" is invalid — clearing exchange for ${articleId}`);
            analysisData.rawData.exchange = 'غير مدرج';
            if (analysisData.path === 'A') {
              analysisData.path = 'C';
            }
          }
        }
      }
    }

    // V71+V73: Fix affectedAssets — remove geographic non-assets and vague concepts
    if (Array.isArray(analysisData.affectedAssets)) {
      for (const asset of analysisData.affectedAssets) {
        if (asset.isTradable === false) {
          if (asset.exchange && asset.exchange !== 'غير مدرج') {
            console.warn(`[Analyzer V88] Non-tradable asset ${asset.symbol} claims exchange ${asset.exchange} — clearing`);
            asset.exchange = 'غير مدرج';
          }
        }
        // V71: Filter out geographic features from affectedAssets
        const name = String(asset.name || '');
        const symbol = String(asset.symbol || '');
        for (const geoPattern of GEOGRAPHIC_NON_ASSETS) {
          if (geoPattern.test(name) || geoPattern.test(symbol)) {
            console.warn(`[Analyzer V88] Geographic non-asset "${name}" in affectedAssets — marking as non-tradable for ${articleId}`);
            asset.isTradable = false;
            asset._isGeographic = true; // Flag for filtering below
            break;
          }
        }
        // V73: Filter out vague/non-tradeable concepts from affectedAssets
        for (const vaguePattern of VAGUE_ASSET_PATTERNS) {
          if (vaguePattern.test(name) || vaguePattern.test(symbol)) {
            console.warn(`[Analyzer V88] Vague non-asset "${name}" in affectedAssets — removing for ${articleId}`);
            asset._isVague = true; // Flag for filtering below
            break;
          }
        }
      }
      // Remove geographic and vague assets entirely
      analysisData.affectedAssets = analysisData.affectedAssets.filter((a: any) => !a._isGeographic && !a._isVague);
    }

    // 3. For path [B]: filter affectedAssets to macro indices only
    if (analysisData.path === 'B' && Array.isArray(analysisData.affectedAssets)) {
      analysisData.affectedAssets = analysisData.affectedAssets.filter((a: any) => {
        const symbol = String(a.symbol || '').toUpperCase();
        return MACRO_INDEX_SYMBOLS.some(m => symbol.includes(m));
      });
      // If no macro assets left, add a generic one
      if (analysisData.affectedAssets.length === 0) {
        analysisData.affectedAssets = [
          { symbol: 'SPX', name: 'مؤشر إس آند بي 500', direction: 'neutral', impactDegree: 'medium', reason: 'تأثير اقتصادي كلي', isTradable: true }
        ];
      }
    }

    // V75: Enhanced commodity auto-detection for affectedAssets
    // Many oil/energy articles come with no commodity ticker or only SPX — this is wrong.
    // We detect commodity-related articles by title/entity keywords and auto-add the right assets.
    if (analysisData.path === 'A' && Array.isArray(analysisData.affectedAssets)) {
      const hasCommodity = analysisData.affectedAssets.some((a: any) => {
        const sym = String(a.symbol || '').toUpperCase();
        return COMMODITY_SYMBOLS.some(c => sym === c || sym.startsWith(c));
      });

      // V75: Detect commodity type from entity name + title, even if rawData.ticker is missing
      const entityNameLower = String(analysisData.rawData?.entityNameEn || '').toLowerCase();
      const sectorLower = String(analysisData.sector || '').toLowerCase();
      const titleForDetection = `${titleEn} ${titleAr}`.toLowerCase();

      // Oil-related detection
      const isOilArticle = entityNameLower.includes('oil') ||
        entityNameLower.includes('crude') || entityNameLower.includes('wti') ||
        entityNameLower.includes('brent') || sectorLower.includes('طاقة') ||
        sectorLower.includes('نفط') ||
        /oil prices|crude oil|wti|brent|petroleum|أسعار النفط|النفط الخام|عقود النفط/i.test(titleForDetection);

      // Gold-related detection
      const isGoldArticle = entityNameLower.includes('gold') || entityNameLower.includes('xau') ||
        /gold prices|أسعار الذهب|الذهب/i.test(titleForDetection);

      // Natural gas detection
      const isGasArticle = entityNameLower.includes('natural gas') || entityNameLower.includes('ng ') ||
        /natural gas|الغاز الطبيعي/i.test(titleForDetection);

      if (!hasCommodity) {
        // Check rawData.ticker first
        if (analysisData.rawData?.ticker) {
          const ticker = String(analysisData.rawData.ticker).toUpperCase();
          if (COMMODITY_SYMBOLS.some(c => ticker === c || ticker.startsWith(c))) {
            const commodityNames: Record<string, string> = {
              'CL': 'عقود النفط الخام وست تكساس (CL)',
              'WTI': 'عقود النفط الخام وست تكساس (WTI)',
              'BZ': 'عقود نفط برنت (BZ)',
              'BRENT': 'عقود نفط برنت (Brent)',
              'GC': 'عقود الذهب (GC)',
              'XAUUSD': 'الذهب مقابل الدولار (XAUUSD)',
              'NG': 'عقود الغاز الطبيعي (NG)',
            };
            const commodityName = commodityNames[ticker] || `عقود ${analysisData.rawData.entityNameEn} (${ticker})`;
            analysisData.affectedAssets.unshift({
              symbol: ticker,
              name: commodityName,
              direction: sentiment === 'negative' ? 'down' : sentiment === 'positive' ? 'up' : 'neutral',
              impactDegree: 'high',
              reason: analysisData.sentimentReason || 'تأثير مباشر من الحدث',
              isTradable: true,
            });
            console.warn(`[Analyzer V75] Added commodity asset ${ticker} from rawData to affectedAssets for ${articleId}`);
          }
        }

        // V75: Auto-detect commodity from title/entity even without ticker
        if (isOilArticle) {
          const hasOilAsset = analysisData.affectedAssets.some((a: any) => {
            const sym = String(a.symbol || '').toUpperCase();
            return ['CL', 'WTI', 'BZ', 'BRENT', 'USO', 'OIL'].some(c => sym.includes(c));
          });
          if (!hasOilAsset) {
            // Add WTI and Brent
            analysisData.affectedAssets.unshift({
              symbol: 'CL',
              name: 'عقود النفط الخام وست تكساس (WTI/CL)',
              direction: sentiment === 'negative' ? 'down' : sentiment === 'positive' ? 'up' : 'neutral',
              impactDegree: 'high',
              reason: analysisData.sentimentReason || 'تأثير مباشر على أسعار النفط',
              isTradable: true,
            });
            analysisData.affectedAssets.unshift({
              symbol: 'BZ',
              name: 'عقود نفط برنت (BZ)',
              direction: sentiment === 'negative' ? 'down' : sentiment === 'positive' ? 'up' : 'neutral',
              impactDegree: 'high',
              reason: 'تأثير مباشر على أسعار النفط العالمية',
              isTradable: true,
            });
            console.warn(`[Analyzer V75] Auto-added WTI/CL + Brent commodity assets for oil article ${articleId}`);

            // Also fix rawData if it says "لا يوجد أصل مدرج مؤكد"
            if (analysisData.rawData && (!analysisData.rawData.ticker || analysisData.rawData.ticker === 'لا يوجد أصل مدرج مؤكد')) {
              analysisData.rawData.ticker = 'CL';
              analysisData.rawData.exchange = 'NYMEX';
              analysisData.rawData.entityNameEn = 'WTI Crude Oil';
            }
          }
        }

        if (isGoldArticle) {
          const hasGoldAsset = analysisData.affectedAssets.some((a: any) => {
            const sym = String(a.symbol || '').toUpperCase();
            return ['GC', 'XAUUSD', 'GLD', 'GOLD'].some(c => sym.includes(c));
          });
          if (!hasGoldAsset) {
            analysisData.affectedAssets.unshift({
              symbol: 'XAUUSD',
              name: 'الذهب مقابل الدولار (XAUUSD)',
              direction: sentiment === 'negative' ? 'down' : sentiment === 'positive' ? 'up' : 'neutral',
              impactDegree: 'high',
              reason: analysisData.sentimentReason || 'تأثير مباشر على أسعار الذهب',
              isTradable: true,
            });
            console.warn(`[Analyzer V75] Auto-added Gold commodity asset for gold article ${articleId}`);
          }
        }

        if (isGasArticle) {
          const hasGasAsset = analysisData.affectedAssets.some((a: any) => {
            const sym = String(a.symbol || '').toUpperCase();
            return ['NG', 'NATGAS', 'UNG'].some(c => sym.includes(c));
          });
          if (!hasGasAsset) {
            analysisData.affectedAssets.unshift({
              symbol: 'NG',
              name: 'عقود الغاز الطبيعي (NG)',
              direction: sentiment === 'negative' ? 'down' : sentiment === 'positive' ? 'up' : 'neutral',
              impactDegree: 'high',
              reason: analysisData.sentimentReason || 'تأثير مباشر على أسعار الغاز',
              isTradable: true,
            });
            console.warn(`[Analyzer V75] Auto-added NG commodity asset for gas article ${articleId}`);
          }
        }
      }

      // V73: For trade/tariff news — ensure forex/index assets are present
      const hasForexAsset = analysisData.affectedAssets.some((a: any) => {
        const sym = String(a.symbol || '').toUpperCase();
        return ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCNY', 'AUDUSD', 'USDCAD', 'NZDUSD'].some(f => sym.includes(f));
      });
      const hasIndexAsset = analysisData.affectedAssets.some((a: any) => {
        const sym = String(a.symbol || '').toUpperCase();
        return ['SPX', 'DAX', 'CAC', 'FTSE', 'NDX', 'NKY', 'SSE', 'HSI'].some(i => sym.includes(i));
      });

      // Check if this is a trade-related article
      const titleLower2 = String(titleEn || titleAr || '').toLowerCase();
      const summaryLower2 = String(summaryEn || summaryAr || '').toLowerCase();
      const allTextLower = `${titleLower2} ${summaryLower2.slice(0, 300)}`;
      const isTradeNews = /tariff|trade deal|trade agreement|trade terms|trade tension|trade war|trade dispute|تعريفات|رسوم جمركية|حرب تجارية|توترات تجارية|اتفاقية تجارية|شروط تجارية/i.test(allTextLower);

      if (isTradeNews && !hasForexAsset && !hasIndexAsset) {
        // Auto-add relevant forex/index assets based on the trade context
        const isEU = /eu |europe|european|الاتحاد الأوروبي|أوروبا/i.test(allTextLower);
        const isChina = /china|chinese|الصين|الصيني/i.test(allTextLower);
        const isJapan = /japan|japanese|اليابان|الياباني/i.test(allTextLower);

        const autoAssets: any[] = [];
        if (isEU) {
          autoAssets.push(
            { symbol: 'EURUSD', name: 'اليورو مقابل الدولار (EUR/USD)', direction: analysisData.sentiment === 'negative' ? 'down' : 'up', impactDegree: 'high', reason: 'تأثير مباشر من التوترات التجارية EU-US', isTradable: true },
            { symbol: 'DAX', name: 'مؤشر داكس الألماني (DAX)', direction: analysisData.sentiment === 'negative' ? 'down' : 'up', impactDegree: 'high', reason: 'تأثير على شركات التصدير الأوروبية', isTradable: true },
            { symbol: 'CAC40', name: 'مؤشر كاك 40 الفرنسي (CAC 40)', direction: analysisData.sentiment === 'negative' ? 'down' : 'up', impactDegree: 'medium', reason: 'تأثير على الشركات الفرنسية المصدرة', isTradable: true },
          );
        }
        if (isChina) {
          autoAssets.push(
            { symbol: 'USDCNY', name: 'الدولار مقابل اليوان (USD/CNY)', direction: 'up', impactDegree: 'high', reason: 'تأثير مباشر من التوترات التجارية US-China', isTradable: true },
            { symbol: 'FXI', name: 'صندوق iShares الصين الكبير (FXI)', direction: analysisData.sentiment === 'negative' ? 'down' : 'up', impactDegree: 'medium', reason: 'تأثير على الأسهم الصينية', isTradable: true },
          );
        }
        if (isJapan) {
          autoAssets.push(
            { symbol: 'USDJPY', name: 'الدولار مقابل الين (USD/JPY)', direction: 'up', impactDegree: 'high', reason: 'تأثير مباشر من التوترات التجارية', isTradable: true },
          );
        }
        if (autoAssets.length > 0) {
          analysisData.affectedAssets.push(...autoAssets);
          console.warn(`[Analyzer V88] Auto-added ${autoAssets.length} forex/index assets for trade news for ${articleId}`);
        }
      }
    }

    // 3.5 Verify asset-content relevance (V90)
    // Remove assets that are NOT mentioned in the article content.
    // This prevents mis-tagging (e.g., an article about TXN tagged with XAUUSD).
    if (Array.isArray(analysisData.affectedAssets) && analysisData.affectedAssets.length > 0) {
      const articleText = `${titleAr} ${titleEn} ${summaryAr} ${summaryEn} ${analysisData.fullContent || ''} ${analysisData.body || ''} ${analysisData.introduction || ''}`.toLowerCase();
      const COMMODITY_KEYWORDS_AR: Record<string, string[]> = {
        XAUUSD: ['gold', 'xau', 'ذهب', 'الذهب', 'معادن ثمينة', 'ملاذ آمن'],
        XAGUSD: ['silver', 'xag', 'فضة', 'الفضة', 'معادن ثمينة'],
        CL: ['oil', 'crude', 'wti', 'نفط', 'النفط', 'خام', 'بترول', 'برنت', 'opec'],
        BZ: ['brent', 'برنت', 'نفط', 'oil'],
        BTCUSD: ['bitcoin', 'btc', 'بتكوين', 'البتكوين', 'كريبتو', 'عملات رقمية'],
        ETHUSD: ['ethereum', 'eth', 'إيثريوم', 'كريبتو', 'عملات رقمية'],
        NG: ['غاز طبيعي', 'natural gas', 'lng'],
        HG: ['نحاس', 'copper', 'معادن صناعية'],
        DXY: ['مؤشر الدولار', 'dollar index', 'dxy'],
        SPX: ['إس آند بي', 's&p', 'sp500', 'spy'],
        NDX: ['ناسداك', 'nasdaq', 'qqq'],
        EURUSD: ['يورو', 'eur/usd', 'eurusd', 'euro'],
        GBPUSD: ['إسترليني', 'جنيه', 'gbp/usd', 'pound', 'sterling'],
        USDJPY: ['ين', 'jpy', 'usd/jpy', 'yen'],
      };
      analysisData.affectedAssets = analysisData.affectedAssets.filter((asset: any) => {
        const sym = String(asset.symbol || '').toUpperCase();
        const assetName = String(asset.name || '').toLowerCase();
        // Stock tickers (1-5 uppercase letters, not a known commodity)
        if (/^[A-Z]{1,5}$/.test(sym) && sym.length <= 5 && !COMMODITY_KEYWORDS_AR[sym]) {
          const tickerMatch = articleText.includes(sym.toLowerCase());
          const nameMatch = assetName && articleText.includes(assetName);
          if (!tickerMatch && !nameMatch) {
            console.warn(`[Analyzer V90] Removing unrelated stock asset ${sym} from ${articleId} — not found in content`);
            return false;
          }
        }
        // Commodities/forex: check with keyword lists
        const keywords = COMMODITY_KEYWORDS_AR[sym];
        if (keywords) {
          const hasKeyword = keywords.some(kw => articleText.includes(kw.toLowerCase()));
          if (!hasKeyword && !articleText.includes(sym.toLowerCase())) {
            console.warn(`[Analyzer V90] Removing unrelated commodity ${sym} from ${articleId} — not found in content`);
            return false;
          }
        }
        return true;
      });
    }

    // 4. Ensure fullContent [5] section respects path rules
    if (typeof analysisData.fullContent === 'string') {
      if (analysisData.path === 'B') {
        const section5Match = analysisData.fullContent.match(/(\[\s*5\s*\][^\[]*)/);
        if (section5Match && !/لا ينطبق/.test(section5Match[1])) {
          analysisData.fullContent = analysisData.fullContent.replace(
            /\[\s*5\s*\][^\[]*/,
            '[5] سيناريوهات التداول: لا ينطبق — هذا خبر اقتصادي كلي بدون أصل مدرج محدد للتداول'
          );
        }
      }
      if (analysisData.path === 'C') {
        const section5Match = analysisData.fullContent.match(/(\[\s*5\s*\][^\[]*)/);
        if (section5Match && !/غير كافية|غير كافي/.test(section5Match[1])) {
          analysisData.fullContent = analysisData.fullContent.replace(
            /\[\s*5\s*\][^\[]*/,
            '[5] سيناريوهات التداول: البيانات غير كافية لوضع سيناريوهات تداول موثوقة'
          );
        }
      }

      // V71: Auto-fix mistranslations in fullContent too
      for (const [pattern, replacement] of TRANSLATION_FIXES) {
        if (pattern.test(analysisData.fullContent)) {
          analysisData.fullContent = analysisData.fullContent.replace(pattern, replacement);
        }
      }
    }

    // ─── Existing processing (preserved from V66-V70) ───

    // Ensure fullContent exists — it's the most important field
    if (!analysisData.fullContent || analysisData.fullContent.length < 50) {
      const intro = analysisData.introduction || '';
      const body = analysisData.body || '';
      const conclusion = analysisData.conclusion || '';
      analysisData.fullContent = [intro, body, conclusion].filter(Boolean).join('\n\n');
    }

    // V65: Ensure fullContent is a STRING, not an object
    if (analysisData.fullContent && typeof analysisData.fullContent === 'object') {
      const inner = analysisData.fullContent as any;
      if (typeof inner.fullContent === 'string') {
        analysisData.fullContent = inner.fullContent;
      } else if (typeof inner.text === 'string') {
        analysisData.fullContent = inner.text;
      } else if (typeof inner.content === 'string') {
        analysisData.fullContent = inner.content;
      } else {
        analysisData.fullContent = JSON.stringify(analysisData.fullContent);
      }
      console.warn(`[Analyzer V88] fullContent was an object, not a string — fixed for ${articleId}`);
    }

    // V66: Also ensure introduction/body/conclusion are strings, not objects
    for (const field of ['introduction', 'body', 'conclusion']) {
      if (analysisData[field] && typeof analysisData[field] === 'object') {
        const inner = analysisData[field] as any;
        if (typeof inner.text === 'string') analysisData[field] = inner.text;
        else if (typeof inner.content === 'string') analysisData[field] = inner.content;
        else if (typeof inner[field] === 'string') analysisData[field] = inner[field];
        else analysisData[field] = JSON.stringify(inner);
        console.warn(`[Analyzer V88] ${field} was an object, not a string — fixed for ${articleId}`);
      }
    }

    // V65: Also fix keyTakeaways — AI sometimes returns objects instead of strings
    if (Array.isArray(analysisData.keyTakeaways)) {
      analysisData.keyTakeaways = analysisData.keyTakeaways.map((k: any) => {
        if (typeof k === 'string') return k;
        if (k && typeof k === 'object') {
          return k.text || k.content || k.value || k.name || JSON.stringify(k);
        }
        return String(k);
      });
    }

    // V66: Fix affectedAssets — convert strings to proper objects
    if (Array.isArray(analysisData.affectedAssets)) {
      analysisData.affectedAssets = analysisData.affectedAssets.map((a: any) => {
        if (typeof a === 'string') {
          const parts = a.split('|').map((s: string) => s.trim());
          const namePart = parts[0] || a;
          const dirPart = parts[1] || '';
          const reasonPart = parts[2] || '';
          let direction = 'neutral';
          if (/صعود|إيجاب|ارتفاع|up/i.test(dirPart)) direction = 'up';
          else if (/هبوط|سلبي|انخفاض|down/i.test(dirPart)) direction = 'down';
          return { symbol: namePart, name: namePart, direction, impactDegree: 'medium', reason: reasonPart, isTradable: true };
        }
        if (a && typeof a === 'object') {
          return {
            symbol: String(a.symbol || a.name || a.ticker || ''),
            name: String(a.name || a.symbol || ''),
            direction: String(a.direction || 'neutral'),
            impactDegree: String(a.impactDegree || a.impact || 'medium'),
            reason: String(a.reason || ''),
            isTradable: a.isTradable !== false,
          };
        }
        return { symbol: String(a), name: String(a), direction: 'neutral', impactDegree: 'medium', reason: '', isTradable: true };
      }).filter((a: any) => a.symbol && a.symbol.length > 0);

      // V71: Re-filter geographic non-assets after conversion
      analysisData.affectedAssets = analysisData.affectedAssets.filter((a: any) => {
        const name = String(a.name || '');
        for (const geoPattern of GEOGRAPHIC_NON_ASSETS) {
          if (geoPattern.test(name)) {
            console.warn(`[Analyzer V88] Filtered geographic non-asset "${name}" from affectedAssets for ${articleId}`);
            return false;
          }
        }
        return true;
      });

      // V68: Filter out non-tradable assets
      const privateCompanyPatterns = [
        /^(شركة|فرع|ذراع|تابع)/,
        /غير مدرج/i,
        /خاصة/i,
        /private/i,
      ];
      analysisData.affectedAssets = analysisData.affectedAssets.filter((a: any) => {
        const name = String(a.name || '');
        const symbol = String(a.symbol || '');
        if (a.isTradable === false) return false;
        const looksLikeTicker = /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(symbol);
        if (!looksLikeTicker) {
          for (const pattern of privateCompanyPatterns) {
            if (pattern.test(name)) return false;
          }
        }
        return true;
      });
    }

    // V66: Strip Markdown formatting from all text fields for clean display
    if (typeof analysisData.fullContent === 'string') {
      analysisData.fullContent = fixArabicNumbers(stripAnalysisMarkdown(analysisData.fullContent));
    }
    if (typeof analysisData.recommendation === 'string') {
      analysisData.recommendation = fixArabicNumbers(stripAnalysisMarkdown(analysisData.recommendation));
    }
    if (typeof analysisData.introduction === 'string') {
      analysisData.introduction = fixArabicNumbers(stripAnalysisMarkdown(analysisData.introduction));
    }
    if (typeof analysisData.body === 'string') {
      analysisData.body = fixArabicNumbers(stripAnalysisMarkdown(analysisData.body));
    }
    if (typeof analysisData.conclusion === 'string') {
      analysisData.conclusion = fixArabicNumbers(stripAnalysisMarkdown(analysisData.conclusion));
    }
    if (typeof analysisData.editedArticle === 'string') {
      analysisData.editedArticle = fixArabicNumbers(stripAnalysisMarkdown(analysisData.editedArticle));
    }
    if (typeof analysisData.summary === 'string') {
      analysisData.summary = fixArabicNumbers(analysisData.summary);
    }
    if (Array.isArray(analysisData.keyTakeaways)) {
      analysisData.keyTakeaways = analysisData.keyTakeaways.map((k: any) => typeof k === 'string' ? fixArabicNumbers(stripAnalysisMarkdown(k)) : k);
    }

    // V72: Strip English sentences from ALL Arabic text fields
    // This prevents untranslated English text from appearing on the page
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof analysisData[field] === 'string') {
        const before = analysisData[field].length;
        analysisData[field] = stripEnglishFromArabic(analysisData[field]);
        const after = analysisData[field].length;
        if (before !== after) {
          console.warn(`[Analyzer V88] Stripped English text from ${field} for ${articleId}: ${before} → ${after} chars`);
        }
      }
    }
    if (Array.isArray(analysisData.keyTakeaways)) {
      analysisData.keyTakeaways = analysisData.keyTakeaways.map((k: any) => {
        if (typeof k === 'string') return stripEnglishFromArabic(k);
        return k;
      });
    }

    // ─── V88: Deduplication — remove repeated sentences ───
    // Barclays problem: the model copied repetition from source instead of condensing it.
    // "كل جملة تضيف معلومة جديدة أو تُحذف"
    for (const field of ['editedArticle', 'fullContent'] as const) {
      if (typeof analysisData[field] === 'string' && analysisData[field].length > 100) {
        const before = analysisData[field].length;
        analysisData[field] = deduplicateArabicText(analysisData[field]);
        const after = analysisData[field].length;
        if (before !== after) {
          console.warn(`[Analyzer V88] Deduplicated ${field} for ${articleId}: ${before} → ${after} chars (${Math.round((1 - after / before) * 100)}% reduction)`);
        }
      }
    }

    // V1045: Reject template-placeholder fullContent (Arabic)
    // الـ LLM أحيانًا ينسخ القالب حرفيًا: "[1] ملخص الحدث\n..." بدل كتابة محتوى حقيقي
    if (typeof analysisData.fullContent === 'string') {
      const fc = analysisData.fullContent;
      const PLACEHOLDER_PATTERNS_AR = [
        /\[\d+\][^\n]*\n\s*\.\.\./,
        /\[\d+\][^\n]*\n\s*\.\.\.\s*\n\s*\[\d+\]/,
        /^[^[]{0,30}\[\d+\][^[]{0,30}\n\.\.\.\n/gm,
      ];
      const hasPlaceholder = PLACEHOLDER_PATTERNS_AR.some(p => p.test(fc));
      if (hasPlaceholder || fc.length < 200) {
        console.warn(`[Analyzer V1045] Article ${articleId} has template-placeholder or too-short fullContent (len=${fc.length}) — rejecting`);
        const { recordError } = await import('../queue/job-manager');
        await recordError(articleId, `V1045: fullContent قالب فارغ أو قصير جدًا (${fc.length} حرف)`);
        result.error = 'Template placeholder fullContent';
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // ─── V88: Title formatting check — fix mixed Arabic/Latin ───
    // Barclays problem: "باركلAYS" reached the end user as-is.
    // A simple code check catches this before publication.
    if (typeof analysisData.summary === 'string') {
      analysisData.summary = fixMixedArabicTitle(analysisData.summary);
    }

    // ─── V88: Gate 4 CODE-LEVEL validation — fabricated numbers in recommendations ───
    // NYSE Tokenization problem: recommendation had "$100/$80" on a non-tradable concept.
    // This catches: if fullContent mentions "غير كافية" or "شحيحة" but recommendation
    // has specific price targets with fabricated numbers.
    {
      const fcStr2 = String(analysisData.fullContent || '');
      const recStr2 = String(analysisData.recommendation || '');
      const editedStr2 = String(analysisData.editedArticle || '');

      // Check if the analysis itself says data is insufficient
      const saysInsufficient = /غير كافي|شحيحة|غير كافية|لا تتوفر بيانات|لا يمكن تقديم/.test(fcStr2 + ' ' + editedStr2);

      // Check if recommendation has specific price targets (numbers with currency)
      const hasFabricatedPrices = /وقف خسارة[^0-9]*[0-9.,]+\s*(?:دولار|وون|يورو|ين|جنيه|ريال|درهم|$)|استهداف[اً]*[^0-9]*[0-9.,]+\s*(?:دولار|وون|يورو|ين|جنيه|ريال|درهم|$)/.test(recStr2);

      // Check if recommendation has specific buy/sell action
      const hasSpecificTradeAction = SELL_KEYWORDS_AR.some(kw => recStr2.includes(kw)) || BUY_KEYWORDS_AR.some(kw => recStr2.includes(kw));

      if (saysInsufficient && hasFabricatedPrices) {
        console.error(`[Analyzer V88] 🚨 CONTRADICTION: Analysis says "insufficient data" but recommendation has fabricated price targets for ${articleId} — overriding!`);
        analysisData.recommendation = 'البيانات غير كافية لوضع توصية تداول محددة — يُنصح بالانتظار';
        // Also fix fullContent section [6]
        if (typeof analysisData.fullContent === 'string') {
          analysisData.fullContent = analysisData.fullContent.replace(
            /\[\s*6\s*\][^\[]*/,
            '[6] توصية الخبراء: البيانات غير كافية لوضع توصية تداول محددة'
          );
        }
      }

      // V88: Also check — are there numbers in recommendation that don't appear anywhere in the source?
      // This catches fabricated price targets like "$100" or "$80" that the AI invented.
      if (hasSpecificTradeAction && hasFabricatedPrices) {
        // Extract all numbers from the original English source
        const sourceNumbers = new Set<string>();
        const sourceText = `${titleEn} ${summaryEn} ${contentEn}`.slice(0, 3000);
        const numMatches = sourceText.match(/\d+\.?\d*/g) || [];
        for (const num of numMatches) {
          sourceNumbers.add(num);
        }

        // Extract numbers from the recommendation
        const recNums = recStr2.match(/\d+\.?\d*/g) || [];
        for (const recNum of recNums) {
          if (!sourceNumbers.has(recNum) && parseFloat(recNum) > 1) {
            // This number is in the recommendation but NOT in the original source
            // It's likely fabricated — check if it looks like a price target
            const isLikelyPrice = parseFloat(recNum) >= 5; // Prices are usually > 5
            if (isLikelyPrice) {
              console.error(`[Analyzer V88] 🚨 FABRICATED NUMBER: "${recNum}" in recommendation not found in source for ${articleId} — removing price targets!`);
              // Strip price targets from recommendation, keep the direction
              let safeRec = recStr2
                .replace(/مع وقف خسارة[^.؟]*[.؟]?/, '')
                .replace(/استهدافاً?[^.؟]*[.؟]?/, '')
                .replace(/عند\s*\d+\.?\d*\s*(?:دولار|وون|يورو|ين|جنيه|ريال|درهم)?/, '')
                .trim();
              if (safeRec.length < 20) {
                // Recommendation became too short after removing fabricated numbers
                const sentiment3 = String(analysisData.sentiment || '').toLowerCase();
                const entity = analysisData.rawData?.entityNameEn || '';
                if (sentiment3 === 'positive') {
                  safeRec = `انتظر تأكيد الاتجاه الصعودي على ${entity} قبل الدخول`;
                } else if (sentiment3 === 'negative') {
                  safeRec = `انتظر تأكيد الاتجاه الهبوطي على ${entity} قبل الدخول`;
                } else {
                  safeRec = 'انتظر حتى تتوفر بيانات كافية لاتخاذ قرار تداول محدد';
                }
              }
              analysisData.recommendation = safeRec;
              break; // Only fix once per recommendation
            }
          }
        }
      }
    }

    // Backward compatibility: if AI returned keyPoints instead of keyTakeaways, rename it
    if (!analysisData.keyTakeaways && analysisData.keyPoints) {
      analysisData.keyTakeaways = analysisData.keyPoints;
    }
    if (!analysisData.keyTakeaways || analysisData.keyTakeaways.length === 0) {
      analysisData.keyTakeaways = [];
    }

    // V68: Ensure conclusion is never empty
    if (!analysisData.conclusion || analysisData.conclusion.trim().length === 0) {
      if (analysisData.recommendation) {
        analysisData.conclusion = analysisData.recommendation;
      } else if (analysisData.summary) {
        analysisData.conclusion = analysisData.summary;
      } else if (analysisData.introduction) {
        analysisData.conclusion = analysisData.introduction;
      }
    }

    // V68: Ensure keyTakeaways has at least some content
    if (analysisData.keyTakeaways.length === 0 && analysisData.fullContent) {
      const fc = analysisData.fullContent;
      const section1Match = fc.match(/\[\s*1\s*\][^\[]*/);
      if (section1Match) {
        const sentences = section1Match[0]
          .replace(/\[\s*1\s*\]/, '')
          .split(/[.؟!،]\s+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 15);
        analysisData.keyTakeaways = sentences.slice(0, 4);
      }
    }

    // Validate: fullContent must be a string with Arabic content
    if (!analysisData.fullContent || typeof analysisData.fullContent !== 'string') {
      console.warn(`[Analyzer V88] fullContent is missing or not a string for ${articleId} — type: ${typeof analysisData.fullContent}`);
      return false;
    }
    if (!/[\u0600-\u06FF]/.test(analysisData.fullContent)) {
      console.warn(`[Analyzer V88] Analysis fullContent has no Arabic for ${articleId}`);
      return false;
    }
    // Validate fullContent has [1]-[6] structure
    const hasSection1 = /\[1\]/.test(analysisData.fullContent);
    const hasSection2 = /\[2\]/.test(analysisData.fullContent);
    if (!hasSection1 || !hasSection2) {
      console.warn(`[Analyzer V88] fullContent missing [1]-[6] structure for ${articleId} — has [1]=${hasSection1} [2]=${hasSection2}`);
      return false;
    }

    // Update article with analysis
    const updateData: any = {
      aiAnalysis: JSON.stringify(analysisData),
    };

    // Also update sentiment/impact if provided
    if (analysisData.sentiment && ['positive', 'negative', 'neutral'].includes(analysisData.sentiment)) {
      updateData.sentiment = analysisData.sentiment;
    }
    if (analysisData.impactLevel && ['high', 'medium', 'low'].includes(analysisData.impactLevel)) {
      updateData.impactLevel = analysisData.impactLevel;
    }
    if (analysisData.affectedAssets && Array.isArray(analysisData.affectedAssets)) {
      updateData.affectedAssets = JSON.stringify(analysisData.affectedAssets);
    }

    // V71: Update `category` in DB based on `sector` from AI
    if (analysisData.sector && typeof analysisData.sector === 'string' && analysisData.sector.length > 1) {
      updateData.category = analysisData.sector;
    }

    // V72: ALWAYS update `contentAr` with `editedArticle` when it's valid Arabic
    // This ensures the "الخبر من المصدر" section always has Arabic content
    // Never leave contentAr empty or with English text
    if (analysisData.editedArticle && typeof analysisData.editedArticle === 'string' && analysisData.editedArticle.length > 50) {
      const editedIsArabic = /[\u0600-\u06FF]/.test(analysisData.editedArticle);
      const existingContentAr = article.contentAr || '';
      const existingIsArabic = /[\u0600-\u06FF]/.test(existingContentAr);
      const existingHasEnglish = /[a-zA-Z]{10,}/.test(existingContentAr); // 10+ consecutive Latin chars = likely English text
      
      // Always update if:
      // 1. editedArticle is Arabic AND (existing is empty OR not Arabic OR has English text OR shorter)
      if (editedIsArabic && (!existingContentAr || existingContentAr.length < 50 || !existingIsArabic || existingHasEnglish || analysisData.editedArticle.length > existingContentAr.length)) {
        updateData.contentAr = analysisData.editedArticle;
        console.warn(`[Analyzer V88] Updated contentAr with editedArticle for ${articleId}: ${existingContentAr.length} → ${analysisData.editedArticle.length} chars`);
      }
    }

    // V88: Fix mixed Arabic/Latin title before saving to DB
    // Barclays problem: "باركلAYS" reached the end user as-is
    const currentTitleAr = article.titleAr || '';
    if (currentTitleAr && /[a-zA-Z]{2,}/.test(currentTitleAr) && /[\u0600-\u06FF]/.test(currentTitleAr)) {
      const fixedTitle = fixMixedArabicTitle(currentTitleAr);
      if (fixedTitle !== currentTitleAr) {
        updateData.titleAr = fixedTitle;
        console.warn(`[Analyzer V88] Fixed mixed Arabic/Latin title for ${articleId}: "${currentTitleAr}" → "${fixedTitle}"`);
      }
    }

    // ─── V89: Contradictory financial numbers detection ───
    // Rayonier problem: summary says "خسارة صافية 12.4M على إيرادات 276.8M" (correct, from source)
    // but fullContent/contentAr adds "أرباح 120M على إيرادات 850M" (invented by AI).
    // The AI fabricated a second set of numbers that contradict the real ones.
    // FIX: Extract all financial figures, cross-reference, remove contradictions.
    {
      const summaryStr = String(article.summaryAr || article.summary || '');
      const contentStr = String(analysisData.fullContent || analysisData.editedArticle || '');
      const contentArStr = String(article.contentAr || '');

      // Extract financial figure pairs from summary (ground truth)
      // Pattern: number + مليون/مليار + metric type (إيرادات/أرباح/خسارة/عائد)
      interface FinancialFigure {
        value: number;
        unit: string;  // مليون or مليار
        metric: string;  // إيرادات or أرباح or خسارة
        raw: string;
      }

      const extractFinancialFigures = (text: string): FinancialFigure[] => {
        const figures: FinancialFigure[] = [];
        if (!text || text.length < 10) return figures;

        // V89 FIX: Clean numbers with spaces ("12. 4" → "12.4", "276. 8" → "276.8")
        // This happens when the AI inserts spaces in decimal numbers
        const cleanText = text.replace(/([0-9]+)\.\s+([0-9]+)/g, '$1.$2');

        // Pattern 1: metric first then number
        // "إيرادات بلغت 276.8 مليون" / "خسارة صافية قدرها 12.4 مليون" / "أرباح 120 مليون"
        const metricFirstPattern = /(?:إيرادات|إيراد|عائد|مبيعات|دخل)[^\d]{0,30}?([0-9]+\.?[0-9]*)\s*(مليون|مليار)/g;
        // Pattern 2: number first then metric context
        // "12.4 مليون دولار... على إيرادات"
        const numFirstPattern = /([0-9]+\.?[0-9]*)\s*(مليون|مليار)[^\u0600-\u06FF]{0,5}(?:دولار)?[^\u0600-\u06FF]{0,20}(?:على إيرادات|على مبيعات|على عائد)/g;

        let match;
        while ((match = metricFirstPattern.exec(cleanText)) !== null) {
          const value = parseFloat(match[1]);
          const unit = match[2];
          // Determine metric type from surrounding context
          const contextStart = Math.max(0, match.index - 40);
          const context = cleanText.slice(contextStart, match.index + match[0].length + 20);
          let metric = 'غير محدد';
          if (/إيراد/.test(context)) metric = 'إيرادات';
          else if (/مبيعات/.test(context)) metric = 'مبيعات';
          else if (/عائد/.test(context)) metric = 'عائد';
          else if (/دخل/.test(context)) metric = 'دخل';

          figures.push({ value, unit, metric, raw: match[0] });
        }

        while ((match = numFirstPattern.exec(cleanText)) !== null) {
          const value = parseFloat(match[1]);
          const unit = match[2];
          figures.push({ value, unit, metric: 'إيرادات', raw: match[0] });
        }

        // Also extract profit/loss figures
        const profitLossPattern = /(?:أرباح|خسارة|صافي أرباح|خسارة صافية|ربح صافي|خسارة صافي)[^\d]{0,30}?([0-9]+\.?[0-9]*)\s*(مليون|مليار)/g;
        while ((match = profitLossPattern.exec(cleanText)) !== null) {
          const value = parseFloat(match[1]);
          const unit = match[2];
          const contextStart = Math.max(0, match.index - 30);
          const context = cleanText.slice(contextStart, match.index + match[0].length + 20);
          let metric = 'أرباح';
          if (/خسارة/.test(context)) metric = 'خسارة';
          else if (/صافي أرباح|أرباح صافي/.test(context)) metric = 'أرباح صافية';

          figures.push({ value, unit, metric, raw: match[0] });
        }

        return figures;
      };

      const summaryFigures = extractFinancialFigures(summaryStr);
      const contentFigures = extractFinancialFigures(contentStr + ' ' + contentArStr);

      if (summaryFigures.length > 0 && contentFigures.length > 0) {
        // Group by metric type
        const summaryByMetric: Record<string, number[]> = {};
        for (const fig of summaryFigures) {
          if (!summaryByMetric[fig.metric]) summaryByMetric[fig.metric] = [];
          summaryByMetric[fig.metric].push(fig.value);
        }

        const contentByMetric: Record<string, number[]> = {};
        for (const fig of contentFigures) {
          if (!contentByMetric[fig.metric]) contentByMetric[fig.metric] = [];
          contentByMetric[fig.metric].push(fig.value);
        }

        // Check for contradictions: same metric, different numbers in the same period
        for (const metric of Object.keys(summaryByMetric)) {
          const summaryValues = summaryByMetric[metric];
          const contentValues = contentByMetric[metric] || [];

          // V89 FIX: Check if ANY content values differ from ALL summary values for the same metric.
          // A company can't have both 276.8M and 850M in revenue for the same quarter.
          // Even one contradictory value is a fabrication.
          const fabricatedValues = contentValues.filter(cv =>
            !summaryValues.some(sv => Math.abs(cv - sv) / Math.max(sv, 1) < 0.1) // Not within 10% of any source value
          );

          if (fabricatedValues.length > 0) {
              console.error(`[Analyzer V89] 🚨 CONTRADICTORY NUMBERS: ${metric} has source values [${summaryValues}] but content has [${contentValues}] — fabricated: [${fabricatedValues}] for ${articleId}`);

              // Remove sentences containing fabricated numbers from fullContent and contentAr
              for (const fabValue of fabricatedValues) {
                // Pattern: the fabricated number appears near the metric type
                const fabStr = String(fabValue);
                const fabPattern = new RegExp(
                  `[^\n.؟!]*${fabStr.replace('.', '\\.')}\\s*(?:مليون|مليار)[^\n.؟!]*[.؟!]?`,
                  'g'
                );

                if (typeof analysisData.fullContent === 'string') {
                  const before = analysisData.fullContent;
                  analysisData.fullContent = analysisData.fullContent.replace(fabPattern, '').replace(/\s{2,}/g, ' ').trim();
                  if (before !== analysisData.fullContent) {
                    console.warn(`[Analyzer V89] Removed fabricated ${metric}=${fabValue} from fullContent for ${articleId}`);
                  }
                }

                if (typeof analysisData.editedArticle === 'string') {
                  const before = analysisData.editedArticle;
                  analysisData.editedArticle = analysisData.editedArticle.replace(fabPattern, '').replace(/\s{2,}/g, ' ').trim();
                  if (before !== analysisData.editedArticle) {
                    console.warn(`[Analyzer V89] Removed fabricated ${metric}=${fabValue} from editedArticle for ${articleId}`);
                  }
                }

                // Clean contentAr too
                if (updateData.contentAr && typeof updateData.contentAr === 'string') {
                  const before = String(updateData.contentAr);
                  updateData.contentAr = before.replace(fabPattern, '').replace(/\s{2,}/g, ' ').trim();
                } else if (article.contentAr && typeof article.contentAr === 'string') {
                  const before = article.contentAr;
                  const cleaned = before.replace(fabPattern, '').replace(/\s{2,}/g, ' ').trim();
                  if (cleaned.length > 50 && cleaned !== before) {
                    updateData.contentAr = cleaned;
                    console.warn(`[Analyzer V89] Removed fabricated ${metric}=${fabValue} from contentAr for ${articleId}`);
                  }
                }
              }

              // Also fix keyTakeaways if they contain fabricated numbers
              if (Array.isArray(analysisData.keyTakeaways)) {
                analysisData.keyTakeaways = analysisData.keyTakeaways.filter((k: string) => {
                  if (typeof k !== 'string') return true;
                  for (const fabValue of fabricatedValues) {
                    if (k.includes(String(fabValue)) && k.includes(metric)) {
                      console.warn(`[Analyzer V89] Removed keyTakeaway with fabricated ${metric}=${fabValue} for ${articleId}`);
                      return false;
                    }
                  }
                  return true;
                });
              }
            }
          }
        }
      }

    // ─── V89: Pipe character cleanup in contentAr ───
    // Dow Jones + Rayonier problem: "|" appears in published contentAr as paragraph separator.
    // It was likely introduced during content generation and not cleaned up.
    // FIX: Replace " | " with proper paragraph separator (newline), strip standalone pipes.
    if (article.contentAr && typeof article.contentAr === 'string' && article.contentAr.includes('|')) {
      const cleaned = article.contentAr
        .replace(/\s*\|\s*/g, '\n\n')  // " | " → paragraph break
        .replace(/\n{3,}/g, '\n\n')    // Collapse multiple newlines
        .trim();
      if (cleaned.length > 50) {
        updateData.contentAr = cleaned;
        console.warn(`[Analyzer V89] Cleaned pipe characters from contentAr for ${articleId}`);
      }
    }

    // ─── V89: Foreign script contamination — remove CJK characters from Arabic fields ───
    // Trump/AI article problem: "据说" (Chinese "reportedly") appeared in summaryAr/contentAr.
    // Source article was multilingual and the AI copied Chinese text verbatim.
    // FIX: Strip CJK characters and attempt to clean the text.
    const CJK_REGEX = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
    for (const field of ['summary', 'introduction', 'conclusion', 'editedArticle', 'fullContent'] as const) {
      const val = analysisData[field];
      if (typeof val === 'string' && CJK_REGEX.test(val)) {
        CJK_REGEX.lastIndex = 0; // Reset for next match
        // Remove CJK characters and clean up extra spaces
        const cleaned = val.replace(CJK_REGEX, '').replace(/\s{2,}/g, ' ').trim();
        if (cleaned.length > 20) {
          analysisData[field] = cleaned;
          console.warn(`[Analyzer V89] Stripped CJK characters from ${field} for ${articleId}: ${val.length} → ${cleaned.length} chars`);
        }
      }
    }
    // Also clean summaryAr and contentAr in the update data
    if (article.summaryAr && CJK_REGEX.test(article.summaryAr)) {
      CJK_REGEX.lastIndex = 0;
      const cleaned = article.summaryAr.replace(CJK_REGEX, '').replace(/\s{2,}/g, ' ').trim();
      if (cleaned.length > 10) {
        updateData.summaryAr = cleaned;
        console.warn(`[Analyzer V89] Stripped CJK characters from summaryAr for ${articleId}`);
      }
    }
    if (article.contentAr && CJK_REGEX.test(article.contentAr)) {
      CJK_REGEX.lastIndex = 0;
      const cleaned = article.contentAr.replace(CJK_REGEX, '').replace(/\s{2,}/g, ' ').trim();
      if (cleaned.length > 50) {
        updateData.contentAr = cleaned;
        console.warn(`[Analyzer V89] Stripped CJK characters from contentAr for ${articleId}`);
      }
    }

    // ─── V89: Truncated sentence detection and repair ───
    // Trump/AI article problem: "من الضروري  التنظيمية العالمية وتأثيراتها" —
    // double space indicates deleted words. Also keyTakeaways[3] was identical truncation.
    // FIX: Detect double-space deletion artifacts and remove the broken sentence.
    const ARABIC_DOUBLE_SPACE = /[\u0600-\u06FF]\s{2,}[\u0600-\u06FF]/;
    for (const field of ['conclusion', 'editedArticle', 'fullContent'] as const) {
      const val = analysisData[field];
      if (typeof val === 'string' && ARABIC_DOUBLE_SPACE.test(val)) {
        // Try to fix: remove sentences with double-space artifacts
        const sentences = val.split(/(?<=[.؟!])\s*/);
        const fixed = sentences
          .filter(s => !ARABIC_DOUBLE_SPACE.test(s))
          .join(' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (fixed.length > 20) {
          console.warn(`[Analyzer V89] Removed truncated sentences from ${field} for ${articleId}: ${val.length} → ${fixed.length} chars`);
          analysisData[field] = fixed;
        }
      }
    }
    // Fix keyTakeaways with truncated content
    if (Array.isArray(analysisData.keyTakeaways)) {
      analysisData.keyTakeaways = analysisData.keyTakeaways.filter((k: string) => {
        if (typeof k === 'string' && ARABIC_DOUBLE_SPACE.test(k)) {
          console.warn(`[Analyzer V89] Removed truncated keyTakeaway for ${articleId}: "${k.slice(0, 60)}..."`);
          return false;
        }
        return true;
      });
    }
    // Fix recommendation if truncated (double-space deletion)
    if (typeof analysisData.recommendation === 'string' && ARABIC_DOUBLE_SPACE.test(analysisData.recommendation)) {
      console.warn(`[Analyzer V89] Recommendation has truncated text for ${articleId} — overriding to wait`);
      analysisData.recommendation = 'الانتظار حتى تتضح المعلومات';
      if (typeof analysisData.fullContent === 'string') {
        analysisData.fullContent = analysisData.fullContent.replace(
          /\[\s*6\s*\][^\[]*/,
          '[6] توصية الخبراء: الانتظار حتى تتضح المعلومات'
        );
      }
    }

    // ─── V90: Recommendation truncation recovery (structural fix for 4th occurrence) ───
    // Bitcoin ETF article problem: recommendation ends mid-sentence without proper punctuation:
    // "التنظيمية والتقنية في قطاع الأصول الرقمية قبل اتخاذ أي قرار..."
    // This happens when the AI model hits the maxTokens limit and the JSON response is truncated.
    // The recommendation is the LAST field in the JSON output, so it's most vulnerable.
    // FIX: Detect recommendations that don't end with proper Arabic sentence punctuation,
    // then truncate to the last complete sentence and add a proper ending.
    {
      const recStr = String(analysisData.recommendation || '');
      if (recStr.length > 10) {
        // Check if recommendation ends with proper Arabic sentence punctuation
        const endsWithPunctuation = /[.؟!؛]$/.test(recStr.trim());
        // Check if recommendation ends with "..." (trailing off — common truncation sign)
        const endsWithEllipsis = /\.{2,}|…$/.test(recStr.trim());
        // Check if recommendation ends with a preposition/conjunction (incomplete thought)
        const endsWithIncomplete = /(?:قبل|بعد|عند|حتى|من|إلى|على|عن|مع|في|بدون|خلال|نحو|حوالي|دون)\s*$/.test(recStr.trim());

        if (!endsWithPunctuation || endsWithEllipsis || endsWithIncomplete) {
          console.warn(`[Analyzer V90] 🚨 TRUNCATED RECOMMENDATION for ${articleId}: "${recStr.slice(-60)}"`);

          // Strategy: Find the last complete sentence (ending with .؟!؛)
          // and truncate everything after it, then add a proper ending
          const lastPunctIdx = Math.max(
            recStr.lastIndexOf('.'),
            recStr.lastIndexOf('؟'),
            recStr.lastIndexOf('!'),
            recStr.lastIndexOf('؛')
          );

          if (lastPunctIdx > recStr.length * 0.3) {
            // We have a substantial portion before the truncation — use it
            const trimmedRec = recStr.slice(0, lastPunctIdx + 1).trim();
            analysisData.recommendation = trimmedRec;
            console.warn(`[Analyzer V90] Trimmed recommendation to last complete sentence for ${articleId}: "${trimmedRec.slice(-60)}"`);
          } else {
            // The entire recommendation seems truncated — use a safe fallback
            // based on the article's path and sentiment
            const path = analysisData.path || 'B';
            const sentiment = analysisData.sentiment || 'neutral';
            let safeRec: string;
            if (path === 'A') {
              safeRec = sentiment === 'positive'
                ? 'اتخذ مركزاً شرائياً مع وقف خسارة محدد — راقب مستويات الدعم'
                : sentiment === 'negative'
                  ? 'اتخذ مركزاً بيعياً مع وقف خسارة محدد — راقب مستويات المقاومة'
                  : 'انتظر تأكيد الاتجاه قبل اتخاذ أي مركز تداول';
            } else if (path === 'B') {
              safeRec = 'الانتظار حتى تتضح الاتجاهات الكلية';
            } else {
              safeRec = 'معلومات شحيحة — البيانات غير كافية لتوصية تداول محددة';
            }
            analysisData.recommendation = safeRec;
            console.warn(`[Analyzer V90] Replaced fully truncated recommendation for ${articleId} with: "${safeRec}"`);
          }

          // Also fix the fullContent section [6] if it has the same truncation
          if (typeof analysisData.fullContent === 'string') {
            const section6Match = analysisData.fullContent.match(/\[\s*6\s*\]([^\[]*)/);
            if (section6Match) {
              const section6Content = section6Match[1].trim();
              const section6EndsProperly = /[.؟!؛]$/.test(section6Content);
              const section6EndsIncomplete = /(?:قبل|بعد|عند|حتى|من|إلى|على|عن|مع|في|بدون|خلال)\s*$/.test(section6Content);

              if (!section6EndsProperly || section6EndsIncomplete) {
                analysisData.fullContent = analysisData.fullContent.replace(
                  /\[\s*6\s*\][^\[]*/,
                  `[6] توصية الخبراء: ${analysisData.recommendation}`
                );
                console.warn(`[Analyzer V90] Fixed truncated section [6] in fullContent for ${articleId}`);
              }
            }
          }
        }
      }
    }

    // ─── V89: Vague title detection ───
    // Trump/AI article problem: titleAr was "إلى أي مدى قد يصل" — meaningless fragment.
    // FIX: If the title is too vague, regenerate from the content.
    const ARABIC_FUNCTION_WORDS_SET = new Set([
      'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'حتى', 'بعد', 'قبل',
      'فيه', 'منه', 'عنه', 'معه', 'فيها', 'منها', 'عنها',
      'أن', 'إن', 'التي', 'الذي', 'الذين', 'اللواتي',
      'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت',
      'لا', 'لم', 'لن', 'قد', 'كان', 'كانت', 'يكون', 'تكون',
      'هذا', 'هذه', 'ذلك', 'تلك', 'هنا', 'هناك',
      'و', 'أو', 'ثم', 'بل', 'لكن', 'أم',
      'ما', 'كيف', 'أين', 'متى', 'لماذا', 'هل', 'أ',
      'أي', 'بعض', 'كل', 'غير', 'أيضا', 'كذلك',
      'سوف', 'لقد', 'منذ', 'خلال', 'حوالي', 'نحو',
    ]);
    const titleToCheck = updateData.titleAr || currentTitleAr;
    if (titleToCheck && titleToCheck.length >= 4) {
      const titleWords = titleToCheck.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 0);
      const contentWordCount = titleWords.filter(w => !ARABIC_FUNCTION_WORDS_SET.has(w)).length;
      if (titleWords.length < 4 || contentWordCount < 3) {
        // Title is too vague — try to extract a better title from the introduction or content
        const intro = analysisData.introduction || analysisData.editedArticle || '';
        if (intro.length > 30) {
          // Take the first meaningful sentence from the introduction as the title
          const firstSentence = intro.split(/[.؟!]/)[0].trim();
          if (firstSentence.length > 10 && firstSentence.length <= 120) {
            updateData.titleAr = firstSentence;
            console.warn(`[Analyzer V89] Replaced vague title "${titleToCheck}" with intro sentence for ${articleId}: "${firstSentence}"`);
          } else {
            console.warn(`[Analyzer V89] Vague title "${titleToCheck}" for ${articleId} — could not auto-fix (intro too short/long)`);
          }
        } else {
          console.warn(`[Analyzer V89] Vague title "${titleToCheck}" for ${articleId} — no intro available for auto-fix`);
        }
      }
    }

    // V38: AWAIT the DB write — no more fire-and-forget!
    await db.newsItem.update({
      where: { id: articleId },
      data: updateData,
    });

    // V38: Advance stage AFTER successful save (synchronous)
    const { advanceStage } = await import('../queue/job-manager');
    await advanceStage(articleId, article.processingStage as ProcessingStage);

    return true;
  } catch (err: any) {
    console.warn(`[Analyzer V88] Failed to process/save analysis for ${articleId}: ${err.message}`);
    return false;
  }
}

// ─── V64: Strip Markdown from analysis output ──────────────────
function stripAnalysisMarkdown(text: string): string {
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
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

// V1049: Fix broken Arabic numbers
// المشكلة: الـ LLM أحيانًا يضع مسافة بعد النقطة العشرية: "2. 33%" بدل "2.33%"
// أو يضع مسافة قبل النقطة: "417. 93" بدل "417.93"
// الحل: احذف المسافات بين رقم ونقطة ورقم
function fixArabicNumbers(text: string): string {
  if (!text) return text;
  let result = text;
  // نمط: رقم + مسافة(ات) + نقطة + مسافة(ات) + رقم → رقم + نقطة + رقم
  result = result.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
  // نمط: رقم + مسافة + % → رقم% (بدون مسافة)
  result = result.replace(/(\d)\s+%/g, '$1%');
  // نمط: $ + مسافة + رقم → $رقم
  result = result.replace(/\$\s+(\d)/g, '$$$1');
  // نمط: رقم + مسافة + دولار → رقم دولار (هذا صحيح، اتركه)
  return result;
}
// V1049 deploy check: Mon Jun 29 21:02:16 UTC 2026
