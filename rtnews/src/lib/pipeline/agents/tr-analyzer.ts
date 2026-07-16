// ═══════════════════════════════════════════════════════════════
// Turkish 4-Gates Analyzer Agent
// Performs the 4-Gates financial analysis in Turkish.
// This is the Turkish counterpart of fr-analyzer.ts.
//
// Key differences from French analyzer:
// - Turkish prompts for financial analysis
// - Turkish-specific forbidden phrases and vague patterns
// - Validates Turkish content quality
// - Same JSON structure but with Turkish content
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { TR_PIPELINE_CONFIG } from '../tr-pipeline-config';
import { isMostlyTurkish, isTurkishGarbageContent, isVagueTurkishTitle } from '@/lib/locale';
import { ProcessingStage } from '../queue/job-types';

export interface TrAnalysisResult {
  articleId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// ── Turkish forbidden phrases to auto-remove from AI output ──
const FORBIDDEN_PHRASES_TR = [
  // Vague/generic investor advice
  'dikkat etmek gerekir',
  'not edilmelidir ki',
  'belirtmek gerekir ki',
  'kaynaklara göre',
  'bildirildiğine göre',
  'söylentilere göre',
  'görünüyor ki',
  'şüphesiz',
  'söz konusu',
  'herkesin bildiği gibi',
  // Empty hedging
  'gelişmeleri izleyin',
  'dikkatle takip edin',
  'dikkatli olun',
  'temkinli olun',
  'gelişmeleri takip edin',
  'zaman gösterecek',
  // Overly speculative hedging
  'zaman gösterecektir',
  'jüri henüz karar vermedi',
  'söylentiler',
  'doğrulanmamış',
];

// ── Vague/non-tradeable asset names to filter from affectedAssets ──
const VAGUE_ASSET_PATTERNS_TR = [
  /ticari ilişkiler/i,
  /küresel ekonomi/i,
  /küresel piyasa/i,
  /küresel ticaret/i,
  /makroekonomi/i,
  /finansal piyasalar/i,
  /küresel piyasalar/i,
  /finansal sektör/i,
  /uluslararası ilişkiler/i,
  /ticari gerilimler/i,
  /ticaret savaşı/i,
  /uluslararası ticaret/i,
  /finansal sistem/i,
  /tedarik zinciri/i,
];

// ── Turkish speculative words/phrases ──
const STRONG_SPECULATIVE_PHRASES_TR = [
  'potansiyel olarak', 'neden olabilir', 'yol açabilir',
  'ulaşabilir', 'düşebilir', 'yükselebilir',
  'etkileyebilir', 'yol açabilir', 'etkilenebilir',
  'riski', 'bekleniyor', 'analistler öngörüyor',
  'mümkündür', 'muhtemeldir',
  'beklenmektedir', 'gerçekleşebilir', 'risk taşıyor',
];

const WEAK_SPECULATIVE_WORDS_TR = [
  'belki', 'muhtemelen', 'olası', 'olasılıkla', 'görünüyor',
  'gibi görünüyor', 'sözde', 'iddiaya göre', 'diyelim ki',
  'bazı kaynaklara göre', 'dedikoduya göre',
];

// ── Sell/buy keywords in Turkish recommendations ──
const SELL_KEYWORDS_TR = [
  'sat', 'satış', 'düşüş', 'kısa pozisyon', 'korunma',
  'azalt', 'satış pozisyonu', 'düşüşe oyna',
  'düşüş hedefi', 'kısa pozisyon al', 'açığa sat',
  'kaçın', 'çık', 'maruziyeti azalt',
];

const BUY_KEYWORDS_TR = [
  'al', 'alış', 'yükseliş', 'uzun pozisyon', 'biriktir',
  'düşük değerlenmiş', 'alış pozisyonu', 'yükselişe oyna',
  'yükseliş hedefi', 'uzun pozisyon al',
  'pozisyona ekle', 'gir',
];

// ── Turkish content quality validation ──
function isValidTurkishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZşçöüğıİŞÇÖÜĞ]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  return (latinChars / totalAlpha) >= TR_PIPELINE_CONFIG.MIN_TURKISH_RATIO;
}

// ── Turkish text deduplication ──
function deduplicateTurkishText(text: string): string {
  if (!text || text.length < 50) return text;

  const rawParts = text.split(/[.!?]+/);
  const seen: string[] = [];
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      result.push(trimmed);
      continue;
    }

    const normalized = trimmed.replace(/\s+/g, ' ').trim();

    let isDuplicate = false;
    for (const existing of seen) {
      if (Math.abs(existing.length - normalized.length) > normalized.length * 0.4) continue;
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existing.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      if (jaccard > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.push(normalized);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── Speculation detection (Turkish) ──
interface SpeculationReport {
  speculationScore: number;
  speculationWordCount: number;
  totalWordCount: number;
  hasSpecificNumbers: boolean;
  shouldRepublish: boolean;
  shouldNotPublish: boolean;
  reason: string;
}

export function detectSpeculationTr(content: string, blockThreshold?: number): SpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0,
      speculationWordCount: 0,
      totalWordCount: 0,
      hasSpecificNumbers: false,
      shouldRepublish: false,
      shouldNotPublish: false,
      reason: 'Spekülasyon analizi için içerik çok kısa',
    };
  }

  let speculationWordCount = 0;

  // Count strong speculative phrases (each counts as 2)
  for (const phrase of STRONG_SPECULATIVE_PHRASES_TR) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length * 2;
    }
  }

  // Count weak speculative words (each counts as 1)
  for (const word of WEAK_SPECULATIVE_WORDS_TR) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length;
    }
  }

  const totalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const speculationRatio = totalWordCount > 0 ? speculationWordCount / totalWordCount : 0;
  const speculationScore = Math.min(100, Math.round(speculationRatio * 500));

  // Check for specific numbers
  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|[\d,]+\s*(?:milyar|milyon|bin|milyarlarca|milyonlarca)|\d+[\.,]?\d*|\$[\d,]+/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3;

  const effectiveBlockThreshold = blockThreshold ?? TR_PIPELINE_CONFIG.SPECULATION_BLOCK_THRESHOLD;
  const shouldRepublish = speculationWordCount > TR_PIPELINE_CONFIG.SPECULATION_REPUBLISH_THRESHOLD;
  const shouldNotPublish = speculationWordCount > effectiveBlockThreshold && !hasSpecificNumbers;

  let reason = 'İçerik veriye dayalıdır';
  if (shouldNotPublish) {
    reason = `Aşırı spekülasyon: ${speculationWordCount} spekülatif kelime. İçerik gerçek verilerden yoksun.`;
  } else if (shouldRepublish) {
    reason = `Yüksek spekülasyon: ${speculationWordCount} spekülatif kelime. Daha fazla veri ile yeniden üretilmeli.`;
  } else if (!hasSpecificNumbers) {
    reason = `Spekülatif kelime sayısı düşük (${speculationWordCount}) ancak belirli sayı bulunamadı — içerik belirsiz olabilir.`;
  }

  return {
    speculationScore,
    speculationWordCount,
    totalWordCount,
    hasSpecificNumbers,
    shouldRepublish,
    shouldNotPublish,
    reason,
  };
}

// ── Sentiment-recommendation validation ──
function validateSentimentRecommendationTr(sentiment: string, recommendation: string): string {
  if (!recommendation || !sentiment) return recommendation;

  const recLower = recommendation.toLowerCase();
  const hasSell = SELL_KEYWORDS_TR.some(kw => recLower.includes(kw));
  const hasBuy = BUY_KEYWORDS_TR.some(kw => recLower.includes(kw));

  // Positive sentiment + sell recommendation = contradiction
  if (sentiment === 'positive' && hasSell) {
    console.warn(`[TrAnalyzer] Sentiment-tavsiye çelişkisi: pozitif duygu + satış tavsiyesi. Düzeltiliyor...`);
    return recommendation.replace(/\bsat\b|\bsatış\b|\bdüşüş\b|\bkorunma\b|\bazalt\b/gi, 'tut');
  }

  // Negative sentiment + buy recommendation = contradiction
  if (sentiment === 'negative' && hasBuy) {
    console.warn(`[TrAnalyzer] Sentiment-tavsiye çelişkisi: negatif duygu + alış tavsiyesi. Düzeltiliyor...`);
    return recommendation.replace(/\bal\b|\balış\b|\byükseliş\b|\bbiriktir\b|\bgir\b/gi, 'tut');
  }

  return recommendation;
}

export async function analyzeArticleTr(articleId: string): Promise<TrAnalysisResult> {
  const startTime = Date.now();
  const result: TrAnalysisResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has quality Turkish analysis
    if (article.aiAnalysis && article.aiAnalysis.length > 100 && article.locale === 'tr') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 100 && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // Verify the content is actually Turkish
          const turkishLetterRatio = (parsed.fullContent.match(/[a-zA-ZşçöüğıİŞÇÖÜĞ]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (turkishLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          console.warn(`[TrAnalyzer] Article ${articleId} has Arabic-contaminated aiAnalysis (TR ratio: ${turkishLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — re-analyzing`);
        }
      } catch { /* re-analyze */ }
    }

    // Prepare context
    const title = article.title || '';
    const summary = article.summary || '';
    const content = article.content || '';
    const category = article.category || 'Ekonomi';

    // V1047: Known companies lookup — help the LLM identify tickers
    const KNOWN_COMPANIES: Record<string, { ticker: string; exchange: string; sector: string }> = {
      // Financial/Payments
      'mastercard': { ticker: 'MA', exchange: 'NYSE', sector: 'Finans' },
      'visa': { ticker: 'V', exchange: 'NYSE', sector: 'Finans' },
      'paypal': { ticker: 'PYPL', exchange: 'NASDAQ', sector: 'Finans' },
      'jpmorgan': { ticker: 'JPM', exchange: 'NYSE', sector: 'Finans' },
      'bank of america': { ticker: 'BAC', exchange: 'NYSE', sector: 'Finans' },
      'goldman sachs': { ticker: 'GS', exchange: 'NYSE', sector: 'Finans' },
      'morgan stanley': { ticker: 'MS', exchange: 'NYSE', sector: 'Finans' },
      'wells fargo': { ticker: 'WFC', exchange: 'NYSE', sector: 'Finans' },
      'citigroup': { ticker: 'C', exchange: 'NYSE', sector: 'Finans' },
      'blackrock': { ticker: 'BLK', exchange: 'NYSE', sector: 'Finans' },
      // Tech
      'apple': { ticker: 'AAPL', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'microsoft': { ticker: 'MSFT', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'alphabet': { ticker: 'GOOGL', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'google': { ticker: 'GOOGL', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'amazon': { ticker: 'AMZN', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'nvidia': { ticker: 'NVDA', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'tesla': { ticker: 'TSLA', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'meta': { ticker: 'META', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'facebook': { ticker: 'META', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'intel': { ticker: 'INTC', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'amd': { ticker: 'AMD', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'netflix': { ticker: 'NFLX', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'disney': { ticker: 'DIS', exchange: 'NYSE', sector: 'Teknoloji' },
      'palantir': { ticker: 'PLTR', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'salesforce': { ticker: 'CRM', exchange: 'NYSE', sector: 'Teknoloji' },
      'adobe': { ticker: 'ADBE', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'oracle': { ticker: 'ORCL', exchange: 'NYSE', sector: 'Teknoloji' },
      'broadcom': { ticker: 'AVGO', exchange: 'NASDAQ', sector: 'Teknoloji' },
      'qualcomm': { ticker: 'QCOM', exchange: 'NASDAQ', sector: 'Teknoloji' },
      // Energy
      'exxon': { ticker: 'XOM', exchange: 'NYSE', sector: 'Enerji' },
      'chevron': { ticker: 'CVX', exchange: 'NYSE', sector: 'Enerji' },
      'shell': { ticker: 'SHEL', exchange: 'NYSE', sector: 'Enerji' },
      'sandridge energy': { ticker: 'SD', exchange: 'NYSE', sector: 'Enerji' },
      'conocophillips': { ticker: 'COP', exchange: 'NYSE', sector: 'Enerji' },
      'occidental': { ticker: 'OXY', exchange: 'NYSE', sector: 'Enerji' },
      // Healthcare
      'johnson & johnson': { ticker: 'JNJ', exchange: 'NYSE', sector: 'Sağlık' },
      'pfizer': { ticker: 'PFE', exchange: 'NYSE', sector: 'Sağlık' },
      'modern': { ticker: 'MRNA', exchange: 'NASDAQ', sector: 'Sağlık' },
      'abbvie': { ticker: 'ABBV', exchange: 'NYSE', sector: 'Sağlık' },
      'merck': { ticker: 'MRK', exchange: 'NYSE', sector: 'Sağlık' },
      // Consumer
      'walmart': { ticker: 'WMT', exchange: 'NYSE', sector: 'Tüketim' },
      'coca-cola': { ticker: 'KO', exchange: 'NYSE', sector: 'Tüketim' },
      'pepsico': { ticker: 'PEP', exchange: 'NASDAQ', sector: 'Tüketim' },
      "mcdonald's": { ticker: 'MCD', exchange: 'NYSE', sector: 'Tüketim' },
      'nike': { ticker: 'NKE', exchange: 'NYSE', sector: 'Tüketim' },
      'starbucks': { ticker: 'SBUX', exchange: 'NASDAQ', sector: 'Tüketim' },
      'costco': { ticker: 'COST', exchange: 'NASDAQ', sector: 'Tüketim' },
      'home depot': { ticker: 'HD', exchange: 'NYSE', sector: 'Tüketim' },
      // Industrial
      'boeing': { ticker: 'BA', exchange: 'NYSE', sector: 'Sanayi' },
      'caterpillar': { ticker: 'CAT', exchange: 'NYSE', sector: 'Sanayi' },
      'lockheed martin': { ticker: 'LMT', exchange: 'NYSE', sector: 'Sanayi' },
      'raytheon': { ticker: 'RTX', exchange: 'NYSE', sector: 'Sanayi' },
      'honeywell': { ticker: 'HON', exchange: 'NASDAQ', sector: 'Sanayi' },
      '3m': { ticker: 'MMM', exchange: 'NYSE', sector: 'Sanayi' },
    };

    // Scan title + content for known company names
    const fullText = `${title} ${content}`.toLowerCase();
    const matchedCompanies: string[] = [];
    for (const [companyName, info] of Object.entries(KNOWN_COMPANIES)) {
      if (fullText.includes(companyName)) {
        matchedCompanies.push(`${companyName} → ${info.ticker} (${info.exchange}, ${info.sector})`);
      }
    }
    const companyHint = matchedCompanies.length > 0
      ? `\n══️ Bilinen Şirketler Algılandı (bu sembolleri kullanın) ═══\n${matchedCompanies.join('\n')}\n`
      : '';

    const analysisPrompt = `Sen profesyonel bir finans analisti ve finansal haber analiz sistemisin. Bu makaleyi sırayla 4 zorunlu kapıdan geçir, ardından sonucu yalnızca JSON olarak ver — HEPSİNİ TÜRKÇE.

══️ Kapı 0 — Ham veri çıkarma ═══
Orijinal metinden çıkarın:
- Şirket / kuruluş adı
- Bulunan hisse senedi sembolü (örn.: AAPL, CL, BZ, IBIT, COIN)
- Borsa / ticaret piyasası (örn.: NYMEX, COMEX, NYSE, NASDAQ)
- Açıkça belirtilen sayılar ve yüzdeler
- Orijinal kaynak
Net bir sembol bulunamazsa ← not edin: "Onaylı kote varlık yok"

══️ Kapı 1 — Konu sınıflandırması ve yol belirleme ═══
Önce hedef kitleyi belirleyin:
- Bireysel tüketiciye yönelik mi (kredi skoru, bütçe, kişisel krediler, mortgage, tasarruf)?
  → Sektör = "Kişisel Finans" + Zorunlu Yol [B]
- Trader/yatırımcıya yönelik mi → doğal sınıflandırmaya devam edin

⚠️ KRİTİK sektör sınıflandırması:
- Mastercard, Visa, PayPal, Stripe = "Finans" (Ödeme sistemleri), "Kişisel Finans" DEĞİL
- Bankalar (JPM, BAC, GS, WFC) = "Finans"
- Apple, Microsoft, Nvidia = "Teknoloji"
- Exxon, Chevron, Shell = "Enerji"
- JNJ, Pfizer, Moderna = "Sağlık"
- "Kişisel Finans" SADECE bireysel tüketici finansal tavsiyesi içindir (kredi skoru, bütçeleme)

[A] Negosyable finansal haberler: Kote şirket + sembol + etkileyen olay | Vadeli işlemler + sembol | ETF'ler | Bitcoin fonları | Forex çiftleri | Kripto | Kripto şirketleri | Endeksler | Ticaret/gümrük haberleri
→ Tam makale + kapsamlı analiz + trading senaryoları

[B] Makro ekonomi / sosyal / kişisel finans: Belirli bir negosyable varlık olmadan makro olgular | Genel kamu eğitimi
→ Tam makale + yalnızca ekonomik bağlam — trading senaryoları YOK
  ⚠️ Makroekonomik haberler doğrudan etkiler:
    • ABD doları (DXY) ve çiftler (EUR/USD, USD/JPY, GBP/USD)
    • Hazine tahvilleri (TNX, TLT)
    • Altın (XAUUSD, GLD)
    • Büyük endeksler (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Operasyonlar / özel şirketler / sınırlı bilgi
→ Tam makale + kısa analiz + düşük güven sınıflandırması

══️ Kapı 2 — Türkçe makale kalitesi ═══
İçeriğin şunları sağladığından emin olun:
- Profesyonel finans Türkçesi
- Rakamlar orijinal kaynakla tam olarak eşleşiyor
- Uydurma bilgi yok
- Uygun paragraf yapısı
- Bölümler arasında tekrar yok

══️ Kapı 3 — 5 bölümlü finansal analiz ═══

Yalnızca Yol [C] için (2 bölüm):
[1] Ne oldu — yalnızca iki cümle
[5] Traderlar için: "Sınırlı bilgi — güvenilir bir analiz için yetersiz veri"

Yol [A] ve [B] için (5 bölüm):

[1] Ne oldu — yalnızca 4-5 cümle. Kim ne söyledi (tam ad + unvan + kuruluş) + nerede ve ne zaman ekleyin.

[2] Neden önemli — gerçek rakamlarla 3-5 cümle:
  ⚠️ Bahsedilen varlıkların güncel fiyatını ekleyin
  ⚠️ Piyasa değeri veya işlem hacimlerini ekleyin
  ⚠️ Makro haberler etkiler: USD/DXY, Tahviller, Altın, Endeksler

[3] Etkilenen varlıklar — yoğun gerçek negosyable varlık listesi:
  a. Doğrudan etkilenen: Ad + Sembol + Borsa + Yön + Neden
  b. Zincirleme etkiler: Belirli şirketler/fonlar/sectorler

[4] İzlenecekler — belirli 3 yaklaşan olay veya gösterge:
  ⚠️ Belirli olun! "Gelişmeleri izleyin" yazmayın

[5] Traderlar için — tavsiye:
  Yol [A]: Belirli, giriş + stop loss + hedef ile (veriler müsaitse)
  Yol [B]: "Makro eğilimlerin daha net hale gelmesini bekleyin"
  Yol [C]: "Sınırlı bilgi — yetersiz veri"

══️ Kapı 4 — Son doğrulama ═══
□ Rakamlar orijinale uyuyor mu?
□ Uydurma bilgi yok mu?
□ Tekrar yok mu?
□ Duygu-tavsiye uyumu mu?
□ Uygun yol sınıflandırması mı?

══️ Makale verileri ═══
Başlık: ${title}
Özet: ${summary.slice(0, 500)}
${content ? `İçerik: ${content.slice(0, 4000)}` : ''}
Kategori: ${category}
${companyHint}
══️ Gerekli JSON çıktısı ═══
{
  "rawData": {"entityNameTr": "Kuruluş adı", "ticker": "Sembol veya yok", "exchange": "Borsa", "figures": ["Rakamlar"], "source": "Kaynak"},
  "path": "A veya B veya C",
  "sector": "Türkçe sektör",
  "sentimentReason": "Duygu gerekçesi",
  "editedArticle": "Düzenlenmiş makale metni — GERÇEK İÇERİK, yer tutucu değil",
  "fullContent": "[1] Ne oldu\\nAdvanced Micro Devices (AMD) hisseleri, şirket MEXT adlı bellek optimizasyonu girişimini satın aldığını açıkladıktan sonra Salı günü %2,06 düşerek 521,58 dolara geriledi.\\n\\n[2] Neden önemli\\nBu satın alma, AMD'nin bellek optimizasyonuna yönelik hamlesini gösteriyor ve NVIDIA'ya karşı rekabet cephesi.\\n\\n[3] Etkilenen varlıklar\\n- AMD (NASDAQ: AMD) — doğrudan etki, kısa vadede düşüş\\n\\n[4] İzlenecekler\\nEntegrasyon takvimi ve AMD yönetiminin herhangi bir rehberlik revizyonu.\\n\\n[5] Traderlar için\\n520 dolar yakınlarında kısa pozisyon tutun, stop-loss 540, hedef 480.",
  "introduction": "2-3 giriş cümlesi — GERÇEK İÇERİK",
  "body": "3-5 paragraf analiz — GERÇEK İÇERİK",
  "conclusion": "2-3 cümle yatırım sonucu — GERÇEK İÇERİK",
  "summary": "Olayın iki cümlelik özeti — GERÇEK İÇERİK",
  "sentiment": "positive veya negative veya neutral",
  "impactLevel": "high veya medium veya low",
  "keyTakeaways": ["Nokta 1 — GERÇEK İÇERİK", "Nokta 2 — GERÇEK İÇERİK", "Nokta 3 — GERÇEK İÇERİK"],
  "affectedAssets": [
    {"symbol": "Sembol", "name": "Sembol ile ad", "direction": "up veya down veya neutral", "impactDegree": "high veya medium veya low", "reason": "Neden", "isTradable": true}
  ],
  "recommendation": "Net ve belirli yatırım tavsiyesi — GERÇEK İÇERİK",
  "confidence": "X/10 — gerekçe"
}

⚠️ KRİTİK: Tüm "..." yer tutucularını makale verilerine dayalı GERÇEK İÇERİK ile değiştirin.
Yukarıdaki örnek gerçek içeriği gösterir, şablon taslağını değil.
"[1] Ne oldu\\n..." ile "..." harfi harfine çıktı vermek YASAKTIR —
her bölüm makaleye dayalı gerçek analiz metni içermelidir.
Bir bölümü gerçek bilgiyle dolduramazsanız, "..." yerine "Bu bölüm için yeterli veri yok" yazın.

Kurallar:
- Yalnızca Türkçe — profesyonel finans Türkçesi
- Gerçek bilgi olmadan bölümleri DOLDURMAYIN
- Tavsiye duygu ile uyumlu olmalıdır
- fullContent, Yol [A]/[B] için [1]-[5] kullanır, Yol [C] için yalnızca [1]+[5]
- path yalnızca "A", "B", veya "C" olmalıdır
- Bölümler arasında tekrar yok
- keyTakeaways yeni bilgiler getirir — yeniden formüle etmez`;

    const aiResult = await Promise.race([
      chatCompletion([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: title || summary || 'Finansal haber makalesi' },
      ], { temperature: 0.3, maxTokens: 10000, priority: 'generation', locale: 'tr' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Turkish analysis timeout')), 120000)
      ),
    ]);

    if (!aiResult.content) {
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Parse JSON
    let parsed: Record<string, any> | null = null;
    try {
      const text = aiResult.content.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
      }
    } catch { /* try recovery */ }

    if (!parsed) {
      result.error = 'Failed to parse AI JSON response';
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Post-processing: Remove forbidden phrases ──
    let fullContent = parsed.fullContent || '';
    let recommendation = parsed.recommendation || '';

    for (const phrase of FORBIDDEN_PHRASES_TR) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      fullContent = fullContent.replace(re, '');
      recommendation = recommendation.replace(re, '');
    }

    // Deduplicate
    fullContent = fixArabicNumbers(deduplicateTurkishText(fullContent));

    // V1045: Reject template-placeholder fullContent
    const PLACEHOLDER_PATTERNS = [
      /\[\d+\][^\n]*\n\s*\.\.\./,
      /\[\d+\][^\n]*\n\s*\.\.\.\s*\n\s*\[\d+\]/,
      /^[^[]{0,30}\[\d+\][^[]{0,30}\n\.\.\.\n/gm,
    ];
    const hasPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(fullContent));
    if (hasPlaceholder || fullContent.length < 200) {
      console.warn(`[TrAnalyzer V1045] Article ${articleId} has template-placeholder or too-short fullContent (len=${fullContent.length}) — rejecting`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `V1045: fullContent şablon yer tutucu veya çok kısa (${fullContent.length} karakter)`);
      result.error = 'Template placeholder fullContent';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Validate sentiment-recommendation alignment
    recommendation = fixArabicNumbers(validateSentimentRecommendationTr(parsed.sentiment || 'neutral', recommendation));

    // Speculation check
    const specReport = detectSpeculationTr(fullContent);
    if (specReport.shouldNotPublish) {
      console.warn(`[TrAnalyzer] Article ${articleId} blocked by speculation gate: ${specReport.reason}`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `Spekülasyon kapısı: ${specReport.reason}`);
      result.error = specReport.reason;
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Filter vague assets ──
    let affectedAssets = parsed.affectedAssets || [];
    if (Array.isArray(affectedAssets)) {
      affectedAssets = affectedAssets.filter((asset: any) => {
        const name = asset.name || asset.symbol || '';
        return !VAGUE_ASSET_PATTERNS_TR.some(pattern => pattern.test(name));
      });
    }

    // ── Verify asset-content relevance ──
    // Remove assets that are NOT mentioned in the article content.
    // This prevents mis-tagging (e.g., an article about TXN tagged with XAUUSD).
    if (Array.isArray(affectedAssets) && affectedAssets.length > 0) {
      const articleText = `${title} ${summary} ${fullContent} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
      const COMMODITY_KEYWORDS: Record<string, string[]> = {
        XAUUSD: ['gold', 'xau', 'altın', 'kıymetli metal', 'güvenli liman'],
        XAGUSD: ['silver', 'xag', 'gümüş', 'kıymetli metal'],
        CL: ['oil', 'crude', 'wti', 'petrol', 'brent', 'opec', 'ham petrol'],
        BZ: ['brent', 'oil', 'petrol', 'crude'],
        BTCUSD: ['bitcoin', 'btc', 'cryptocurrency', 'crypto', 'kripto'],
        ETHUSD: ['ethereum', 'eth', 'cryptocurrency', 'crypto', 'kripto'],
        EURUSD: ['euro', 'eur/usd', 'eurusd', 'avro'],
        GBPUSD: ['pound', 'sterling', 'İngiliz sterlini', 'gbp/usd'],
        USDJPY: ['yen', 'jpy', 'usd/jpy', 'Japon yeni'],
      };
      affectedAssets = affectedAssets.filter((asset: any) => {
        const sym = (asset.symbol || '').toUpperCase();
        const assetName = (asset.name || '').toLowerCase();
        if (/^[A-Z]{1,5}$/.test(sym) && sym.length <= 5 && !COMMODITY_KEYWORDS[sym]) {
          const tickerMatch = articleText.includes(sym.toLowerCase());
          const nameMatch = assetName && articleText.includes(assetName.toLowerCase());
          if (!tickerMatch && !nameMatch) {
            console.warn(`[TrAnalyzer] Removing unrelated asset ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        const keywords = COMMODITY_KEYWORDS[sym];
        if (keywords) {
          const hasKeyword = keywords.some(kw => articleText.includes(kw.toLowerCase()));
          if (!hasKeyword && !articleText.includes(sym.toLowerCase())) {
            console.warn(`[TrAnalyzer] Removing unrelated commodity ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        return true;
      });
    }

    // ── Build aiAnalysis ──
    const aiAnalysis: Record<string, any> = {
      path: parsed.path,
      sector: parsed.sector,
      sentimentReason: parsed.sentimentReason,
      editedArticle: parsed.editedArticle || '',
      fullContent,
      introduction: parsed.introduction || '',
      body: parsed.body || '',
      conclusion: parsed.conclusion || '',
      summary: parsed.summary || '',
      sentiment: parsed.sentiment || 'neutral',
      impactLevel: parsed.impactLevel || 'low',
      keyTakeaways: parsed.keyTakeaways || [],
      affectedAssets,
      recommendation,
      confidence: parsed.confidence || '5/10',
      locale: 'tr',
      rawData: parsed.rawData || {},
    };

    // V1049: Fix broken numbers in ALL text fields
    for (const field of ['fullContent', 'introduction', 'body', 'conclusion', 'editedArticle', 'recommendation', 'summary']) {
      if (typeof (aiAnalysis as any)[field] === 'string') {
        (aiAnalysis as any)[field] = fixArabicNumbers((aiAnalysis as any)[field]);
      }
    }
    if (Array.isArray(aiAnalysis.keyTakeaways)) {
      aiAnalysis.keyTakeaways = aiAnalysis.keyTakeaways.map((k: any) => typeof k === 'string' ? fixArabicNumbers(k) : k);
    }

    // ── Update article ──
    const updateData: Record<string, any> = {
      aiAnalysis: JSON.stringify(aiAnalysis),
      locale: 'tr',
    };

    if (parsed.sentiment) updateData.sentiment = parsed.sentiment;
    if (parsed.impactLevel) updateData.impactLevel = parsed.impactLevel;
    if (parsed.sector) {
      const categoryMap: Record<string, string> = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR;
      const catId = Object.entries(categoryMap).find(([_, v]) => v.toLowerCase() === parsed.sector.toLowerCase())?.[0];
      if (catId) {
        updateData.categoryId = catId;
        updateData.category = categoryMap[catId];
      }
    }
    if (affectedAssets.length > 0) {
      updateData.affectedAssets = JSON.stringify(affectedAssets);
    }

    // Set sentimentScore
    if (parsed.sentiment) {
      const baseScore = parsed.sentiment === 'positive' ? 70 : parsed.sentiment === 'negative' ? 30 : 50;
      const impactMod = parsed.impactLevel === 'high' ? 15 : parsed.impactLevel === 'medium' ? 5 : 0;
      updateData.sentimentScore = parsed.sentiment === 'negative' ? baseScore - impactMod : baseScore + impactMod;
    }

    // Set impactScore from confidence
    if (parsed.confidence) {
      const confMatch = String(parsed.confidence).match(/(\d+)\s*\/\s*10/);
      if (confMatch) {
        updateData.impactScore = parseInt(confMatch[1], 10) * 10;
      }
    }

    await db.newsItem.update({
      where: { id: articleId },
      data: updateData,
    });

    // Advance stage
    const { advanceStage } = await import('../queue/job-manager');
    await advanceStage(articleId, article.processingStage as ProcessingStage);

    result.success = true;
    result.duration = Date.now() - startTime;
    console.log(`[TrAnalyzer] ✓ Analyzed ${articleId} in ${result.duration}ms — path: ${parsed.path}, sentiment: ${parsed.sentiment}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[TrAnalyzer] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}

// V1049: Fix broken numbers
function fixArabicNumbers(text: string): string {
  if (!text) return text;
  let result = text;
  result = result.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
  result = result.replace(/(\d)\s+%/g, '$1%');
  result = result.replace(/\$\s+(\d)/g, '$$$1');
  result = result.replace(/([A-Z])\.\s+([A-Z])/g, '$1.$2');
  return result;
}
