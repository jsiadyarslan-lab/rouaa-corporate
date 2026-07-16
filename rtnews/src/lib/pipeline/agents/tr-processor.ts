// ═══════════════════════════════════════════════════════════════
// Turkish Unified Processor Agent
// Processes Turkish news articles DIRECTLY in Turkish — no translation step.
// This is the Turkish counterpart of en-processor.ts.
//
// Key differences from English processor:
// - Turkish prompts for AI analysis
// - Output fields: titleTr, summaryTr, contentTr (instead of titleEn, etc.)
// - Sets locale: 'tr' and categoryId fields
// - Turkish-specific quality validation
// - LTR layout direction
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { TR_PIPELINE_CONFIG } from '../tr-pipeline-config';
import { isMostlyTurkish, isTurkishGarbageContent, isVagueTurkishTitle } from '@/lib/locale';
import { ProcessingStage } from '../queue/job-types';

export interface TrUnifiedResult {
  articleId: string;
  success: boolean;
  duration: number;
  fields: string[];
  error?: string;
}

// ── JSON parsing utility (shared with Arabic/English processor) ──
function parseAIJson(text: string): Record<string, any> | null {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch { /* not pure JSON, try extraction below */ }

  // Try extracting JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* code block not valid JSON, continue */ }
  }

  // Try finding JSON object boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch { /* try fixing common issues below */ }

    let jsonStr = text.slice(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(jsonStr);
    } catch { /* truncated JSON recovery below */ }
  }

  // Truncated JSON recovery
  if (firstBrace !== -1) {
    let truncatedJson = text.slice(firstBrace);
    truncatedJson = truncatedJson.replace(/"[^"\\]*$/, '');
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
    for (let i = 0; i < openBrackets; i++) truncatedJson += ']';
    for (let i = 0; i < openBraces; i++) truncatedJson += '}';
    try {
      return JSON.parse(truncatedJson);
    } catch { /* give up */ }
  }

  return null;
}

// ── Markdown stripping utility ──
function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Turkish deduplication — removes repeated sentences ──
function deduplicateTurkishContent(text: string): string {
  if (!text || text.length < 50) return text;

  const rawParts = text.split(/[.!?]+/);
  const seen = new Map<string, string>();
  const result: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) {
      result.push(trimmed);
      continue;
    }

    const normalized = trimmed.replace(/\s+/g, ' ').trim();

    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      if (Math.abs(existingNorm.length - normalized.length) > normalized.length * 0.4) continue;

      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const jaccardSimilarity = union > 0 ? intersection / union : 0;

      if (jaccardSimilarity > 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) {
      console.warn(`[TrProcessor] Removed duplicate sentence: "${trimmed.slice(0, 60)}..."`);
    } else {
      seen.set(normalized, trimmed);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── Turkish content quality validation ──
function isValidTurkishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  // Check for reasonable Turkish/Latin character ratio
  const latinChars = (text.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  const turkishRatio = latinChars / totalAlpha;
  return turkishRatio >= TR_PIPELINE_CONFIG.MIN_TURKISH_RATIO;
}

// ── Category ID mapping ──
function mapCategoryToId(category: string): string {
  const categoryMap: Record<string, string> = {
    'economy': 'economy',
    'stocks': 'stocks',
    'forex': 'forex',
    'crypto': 'crypto',
    'energy': 'energy',
    'commodities': 'commodities',
    'real estate': 'realEstate',
    'realEstate': 'realEstate',
    'banking': 'banking',
    'earnings': 'earnings',
    'arab markets': 'arabMarkets',
    'arabMarkets': 'arabMarkets',
    'technology': 'technology',
    'politics': 'politics',
    'breaking': 'breaking',
    'bonds': 'bonds',
    'technicalAnalysis': 'technicalAnalysis',
    'strategic': 'strategic',
    // Turkish category names
    'économie': 'economy',
    'actions': 'stocks',
    'devises': 'forex',
    'énergie': 'energy',
    'matières premières': 'commodities',
    'immobilier': 'realEstate',
    'banque': 'banking',
    'résultats': 'earnings',
    'marchés arabes': 'arabMarkets',
    'technologie': 'technology',
    'politique': 'politics',
    'flash': 'breaking',
    'obligations': 'bonds',
    'analyse technique': 'technicalAnalysis',
    'géopolitique': 'strategic',
    // Arabic categories (for mixed-source articles)
    'اقتصاد كلي': 'economy',
    'أسهم': 'stocks',
    'عملات': 'forex',
    'فوركس': 'forex',
    'كريبتو': 'crypto',
    'عملات رقمية': 'crypto',
    'طاقة': 'energy',
    'سلع': 'commodities',
    'عقارات': 'realEstate',
    'بنوك مركزية': 'banking',
    'أرباح شركات': 'earnings',
    'أسواق عربية': 'arabMarkets',
    'تقنية': 'technology',
    'سياسة': 'politics',
    'عاجل': 'breaking',
  };
  return categoryMap[category] || 'economy';
}

export async function processArticleTr(articleId: string): Promise<TrUnifiedResult> {
  const startTime = Date.now();
  const result: TrUnifiedResult = { articleId, success: false, duration: 0, fields: [] };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already fully processed with quality Turkish data
    if (article.aiAnalysis && article.title && article.content && article.locale === 'tr') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // Verify the content is actually Turkish (not Arabic/English contamination)
          const turkishLetterRatio = (parsed.fullContent.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (turkishLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            // Skip to 'analyzed' stage for already-processed TR articles
            await db.newsItem.update({
              where: { id: articleId },
              data: { processingStage: 'analyzed' },
            });
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must reprocess
          console.warn(`[TrProcessor] Article ${articleId} has Arabic-contaminated aiAnalysis (TR ratio: ${turkishLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — reprocessing`);
        }
      } catch {
        // Non-critical: if we can't check existing data, just reprocess
        console.warn(`[TrProcessor] Skip check failed for ${articleId}, reprocessing`);
      }
    }

    // Prepare context — Turkish originals
    const titleTr = article.title || '';
    const summaryTr = article.summary || '';
    const contentTr = article.content || '';
    const category = article.category || 'Ekonomi';

    // ── SINGLE API CALL: Pre-filter + 4 Gates in one prompt (TURKISH) ──
    const unifiedPrompt = `Sen profesyonel bir finans analisti ve Türkçe finansal haberler platformu için bir haber işleme sistemisin. Görevin, bu makaleyi bir filtreleme kapısından ve ardından 4 zorunlu kapıdan geçirmek, başlık, özet, içerik ve kapsamlı finansal analizi tek bir istekte üretmek — HEPSİNİ TÜRKÇE OLARAK.

═══ Filtreleme Kapısı — Bu finansal bir haber mi? ═══
Bu makale zaten finansal anahtar kelime filtresinden geçirilmiştir.
Finansal olduğunu varsay.

❌ "REJECTED" durumunu VERME ❌
Yalnızca İKİ koşul da sağlandığında reddet:
1. Konunun ekonomi, piyasalar veya şirketlerle HİÇBİR ilgisi yok
2. İşlem görebilecek bir finansal varlık üzerinde potansiyel HİÇBİR etkisi yok

Şüphe durumunda — Yol [C] olarak sınıflandır. ❌ REDDETME ❌

═══ Coğrafi Filtre — Öncelik ═══
Coğrafi önceliği sınıflandır:

🔴 Yüksek öncelik (tam işlem + ana sayfa görünürlüğü):
- Büyük küresel piyasalar: ABD (Wall Street, Nasdaq, S&P, Fed), Avrupa (ECB, FTSE, DAX), Büyük Asya (Japonya/Nikkei, Çin/Shanghai, Güney Kore, Hindistan)
- Arap piyasaları: Suudi Arabistan/Tadawul, BAE/Dubai, Mısır, Katar, Kuveyt, Bahreyn, Umman, Ürdün
- Küresel emtialar: Petrol (WTI, Brent), Altın (XAU), Gümüş, Bakır, OPEC
- Dijital varlıklar: Bitcoin, Ethereum, Kripto
- Büyük ekonomiler arasındaki ticaret/gümrük tarifesi haberleri

🟡 Düşük öncelik (işlenir ancak otomatik olarak "düşük öncelik" olarak sınıflandırılır):
- Arap olmayan ve büyük olmayan ülkelerin yerel piyasaları
- Makale düşük öncelikli bir ülkeyi bahsediyorsa ANCAK aynı zamanda büyük bir pazarla da ilgiliyse ← yüksek öncelik ver

⚠️ Uygulama: Makale coğrafi olarak düşük öncelikliyse ← Sektör alanına "Düşük Öncelik" + impactLevel: "low" yaz

Kabul edilen makale örnekleri (bunları ASLA reddetme):
- Trump-Xi zirvesi → piyasaları ve ticareti etkiler → Yol [A]
- Piyasaları etkileyen siyasi haberler → Yol [B]
- Şirket kazanç raporları → Yol [A]
- Makroekonomik veriler (istihdam, TÜFE, GSYH) → Yol [B]
- Hisse senedi sembolü olmayan şirket haberleri → Yol [B] veya [C]
- Uluslararası ticaret ve gümrük tarifesine ilişkin haberler → Yol [A]
- Teknoloji haberleri tech hisselerini etkiliyorsa → Yol [B]
- Enerji, petrol veya metal haberleri → Yol [A]
- Finansal bir kaynaktan gelen genel görünümlü herhangi bir makale → Yol [C]

═══ Kapı 0 — Ham veri çıkarma ═══
Orijinal metinden çıkar:
- Şirket / varlık adı (emtia veya vadeli işlemse sepet adını yaz, örn.: WTI Ham Petrol, Brent, Altın)
- Varsa hisse senedi sembolü (örn.: AAPL, CL, BZ, IBIT, COIN)
- Borsa / işlem piyasası (örn.: NYMEX, COMEX, NYSE, NASDAQ)
- Metinde açıkça belirtilen sayılar ve yüzdeler
- Orijinal kaynak
Net bir sembol bulunamazsa ← not et: "Onaylı koteli varlık yok"

═══ Kapı 1 — Konu sınıflandırması ve yol belirleme ═══
Önce hedef kitleyi belirle:
- Bireysel tüketicive yönelik mi (kredi skoru, bütçe, kişisel krediler)? → Sektör = "Kişisel Finans" + Yol [B] zorunlu
- Trader/yatırımcıya yönelik mi → doğal sınıflandırmaya devam et

[A] İşlem görebilir finansal haberler: Koteli şirket + sembol + etkileyen olay | Vadeli işlemler + sembol | İşlem görebilir ETF'ler | Bitcoin fonları (IBIT, FBTC, ARKB...) | Forex çiftleri | Kripto paralar | Kripto şirketleri (COIN, MSTR) | Endeksler | Büyük ekonomiler arasındaki ticaret/tarife haberleri
→ Tam makale + tam analiz + işlem senaryoları

[B] Makro ekonomi / sosyal / kişisel finanslar: İşlem görebilir belirli bir varlık olmaksızın makro olaylar | Genel kamuoyuna yönelik eğitici içerik
→ Tam makale + yalnızca ekonomik bağlam — işlem senaryoları YOK
  ⚠️ Makroekonomik haberler (işsizlik, TÜFE, NFP, GSYH, Fed faiz oranı) reel finansal varlıkları güçlü şekilde etkiler! Bunları [2] ve [3] bölümlerine dahil et:
    • ABD doları (DXY) ve çiftler (EUR/USD, USD/JPY, GBP/USD)
    • Hazine bonoları (TNX, TLT)
    • Altın (XAUUSD, GLD)
    • Büyük endeksler (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Özel şirketler / sınırlı bilgi
→ Tam makale + kısa analiz + düşük güvenilirlik sınıflandırması

═══ Kapı 2 — Makaleyi TÜRKÇE olarak yaz ═══
Profesyonel bir finansal haber makalesi yaz:

⚠️⚠️⚠️ SAYILAR KRİTİKTİR — Sayılar kutsaldır! ⚠️⚠️⚠️
Orijinal metindeki her sayı Türkçe çıktıda aynen görünmelidir:
- 16,5 M$ → 16,5 M$ olarak kalmalı (1,65 M$ değil!)
- 0,36 $ BPS → 0,36 $ olarak kalmalı
- Ondalık basamağı kaydırma: 16,5 ≠ 1,65 ve 0,36 ≠ 3,6
- Bir sayıdan şüpheleniyorsan ← kaynağa yazıldığı gibi aynen bırak

Yazım kuralları:
1. Türkçe Başlık: Kesin, profesyonel finans gazeteciliği tarzı. Varsa şirket adı + sembolü dahil et. Orijinalde olmayan kelimeler ekleme (kayıp, güçlü düşüş, büyük gerileme) açıkça belirtilmedikçe.
2. Türkçe Özet: Kısa ve profesyonel — sadık bir temsil, yaratıcı bir yeniden yazım değil.
3. Türkçe İçerik: Kaynak malzemeye orantılı paragraflarla profesyonel bir haber makalesi yaz:
   - Yalnızca başlık → 1-2 paragraf
   - Başlık + özet → 2-3 paragraf
   - Detaylı içerik → 4 paragrafa kadar
   Paragraf 1: Ana olay | Paragraf 2: Bağlam — yalnızca mevcutsa | Paragraf 3: Etki — yalnızca mevcutsa | Paragraf 4: Beklentiler — yalnızca mevcutsa
   ⚠️ Kaynakta bahsedilmeyen olaylar, nedenler veya tepkiler uydurma!
   ⚠️ Orijinaldeki her sayı Türkçe versiyonda tam aynı değerde görünmelidir!

═══ Kapı 3 — Analiz (5 bölümlü yapı) ═══

⚠️ Temel ilke — analiz boyutu haber boyutuyla orantılı olmalı:
- Makale kısaysa (tek bir açıklama veya olay) → tekrar veya doldurma ile alan doldurma
- Uzun ve yapay bir analiz yerine yoğun ve dürüst bir analiz yaz

⚠️ AI iç yorumları yok:
- Yasak: "Burada duruyorum", "Not:", "İstendiği gibi", "Devam edeyim"
- Son metin yatırımcılar tarafından okunur — üretim sürecinin izi olmamalı

Yalnızca Yol [C] için — kısa yapı (yalnızca 2 bölüm):
[1] Ne oldu — yalnızca iki cümle
[5] Traderlar için: "Sınırlı bilgi — güvenilir analiz için yetersiz veri"
Yol [C] için yasak: [2] [3] [4] bölümleri

Yol [A] ve [B] için — tam yapı (5 bölüm):

[1] Ne oldu — yalnızca 4-5 cümle. İçerik alanında yazılanları TEKRARLAMA.
  Zorunlu içerik: Ne oldu + kim söyledi (tam adı + unvanı + kuruluş) + nerede ve ne zaman tam olarak.

[2] Neden önemli — gerçek rakamlarla önemini açıklayan 3-5 cümle:
  ⚠️ Bahsedilen varlıkların mevcut fiyatını ekle (örn.: "BTC şu anda 67.500 $'da işlem görüyor")
  ⚠️ Varsa piyasa değerlerini veya işlem hacimlerini ekle
  ⚠️ Boş cümleler YOK: "sektörün güvenilirliğini artırıyor", "kapıyı açıyor...", "stratejik bir değişimi işaret ediyor"
  ⚠️ Makro haberler (istihdam/TÜFE/NFP/GSYH/faiz oranı) doğrudan etkiler:
    • İşsizlik veya NFP → USD/DXY + EUR/USD + USD/JPY + Hazine TNX/TLT + Altın XAUUSD/GLD
    • TÜFE veya enflasyon → USD/DXY + Hazine + Altın + Endeksler (SPY, QQQ)
    • Fed faiz kararı → USD + tahviller + altın + bankalar (XLF) + gayrimenkul (XLRE)
    • GSYH veya ekonomik büyüme → USD + endeksler + döngüsel sektörler (XLI) vs. savunmacı (XLU)

[3] Etkilenen varlıklar — yoğun, gerçek işlem görebilir varlıklar listesi:
  a. Doğrudan etkilenen: Adı + Sembolü + Borsası + Etki yönü + Belirli neden
  b. Zincirleme etkiler: İsme ve sembole göre belirli şirketler/fonlar/sektörler
  ⚠️ Makro haberler için: ASLA "uygulanamaz" yazma!
  ⚠️ Her varlığa "yükseliş" koyma — gerçekçi ol
  ⚠️ Görüş kuralı: Makale bir görüş/köşe yazısı/editöryalsa → yalnızca kaynakta açıkça adı geçen varlıkları listele

[4] İzlenecekler — habere bağlı 3 spesifik yaklaşan olay veya gösterge:
  ⚠️ "gelişmeleri izleyin" yazma — spesifik ol!
  Doğru örnek: "1. PayPal'ın 15 Mart kazanç raporu 2. Jerome Powell'ın 20 Mart konuşması 3. 12 Mart aylık TÜFE verileri"
  ⚠️ 3 spesifik etkinliğin yoksa ← yalnızca 1 veya 2 yaz (etkinlik uydurma!)

[5] Traderlar için — haberin önemine orantılı öneri:
  Yol [A] için: Spesifik ve uygulanabilir öneri — ancak haber yeterliyse:
    • Operasyonel duyuru veya somut veri varsa → spesifik öneri ile giriş seviyesi + stop loss + hedef
    • Ön duyuru veya beklentiler ise → yaz: "Bu ön bir açıklamadır, operasyonel bir duyuru değildir — harekete geçmeden önce onay bekleyin"
    • Spesifik sayısal giriş fiyatı olmadan alım/satım önerisi YOK
  Yol [B] için: "Makro eğilimlerin netleşmesini bekleyin"
  Yol [C] için: "Sınırlı bilgi — yetersiz veri"

⚠️ Öneri kuralları:
- Pozitif = yalnızca satın al veya tut — satış yok
- Negatif = yalnızca sat veya tut — alım yok
- Nötr = yalnızca tut
- Boş öneriler yok (gerilimleri izle, gelişmeleri gözlemle, dikkatli ol)

═══ Kapı 4 — Son kontrol ═══
□ Orijinal metindeki her sayı Türkçe çıktıda aynı değerde görünüyor mu?
□ Orijinal metinde olmayan uydurma bilgi var mı?
□ contentTr ile fullContent arasında tekrar yok mu?
□ Öneri duyguyla çelişmiyor mu?
□ Ticaret/tarife haberleri Yol [A] olarak sınıflandırıldı mı?
□ Kripto haberleri Yol [A] + Sektör = "Kripto" olarak sınıflandırıldı mı?
□ Makro ekonomik haberse → [2] bölümünde USD/DXY + Tahviller + Altın dahil edildi mi?
□ [3] bölümü makro veri türüne göre zincirleme varlıkları mı sayıyor?
□ Analiz boyutu haber boyutuyla orantılı mı?
□ Haber bir açıklamaysa, bir duyuru değil — bunu [5] bölümünde belirttiniz mi?
□ Metinde AI iç yorumları var mı? Varsa → hemen kaldır
□ fullContent [1]-[5] bölümlerini mi kullanıyor ([1]-[6] değil)?
□ Makale bir görüşse — [3] bölümü yalnızca kaynakta açıkça bahsedilen varlıklarla mı sınırlı?
□ Bir kontrol başarısız olursa → çıktıdan önce düzelt

═══ Makale verileri ═══
Türkçe Başlık: ${titleTr}
Türkçe Özet: ${summaryTr.slice(0, 500)}
${contentTr ? `Orijinal Türkçe içerik: ${contentTr.slice(0, 4000)}` : ''}
Mevcut kategori: ${category}

═══ Gerekli JSON çıktı formatı ═══
Sonucu yalnızca JSON formatında ver, başka metin ekleme:
{
  "titleTr": "İşlenmiş Türkçe başlık — profesyonel finans gazeteciliği — orijinalle eşleşen rakamlar",
  "summaryTr": "Türkçe özet — kısa ve profesyonel — orijinalle eşleşen rakamlar",
  "contentTr": "Türkçe haber makalesi — mevcut kaynak malzemeye dayalı satır sonu ile ayrılmış paragraflar",
  "rawData": {
    "entityNameTr": "Şirket veya sepet adı",
    "ticker": "Hisse senedi sembolü veya Onaylı koteli varlık yok",
    "exchange": "Borsa veya vadeli işlem piyasası adı",
    "figures": ["Orijinal metindeki sayılar ve yüzdeler"],
    "source": "Orijinal kaynak"
  },
  "path": "A veya B veya C",
  "sector": "Doğru sektör",
  "sentimentReason": "Duygu sınıflandırmasının gerekçesi",
  "editedArticle": "Düzenlenmiş makale, mevcut kaynağa dayalı paragraflarla",
  "fullContent": "[1] Ne oldu\\n4-5 cümle: Olay + kim söyledi + nerede ve ne zaman\\n\\n[2] Neden önemli\\nGerçek rakamlarla 3-5 cümle\\n\\n[3] Etkilenen varlıklar\\na. Doğrudan + b. Zincirleme\\n\\n[4] İzlenecekler\\n1-3 spesifik yaklaşan olay\\n\\n[5] Traderlar için\\nÖneri veya bekle",
  "introduction": "2-3 cümlelik giriş",
  "body": "3-5 paragraf derin analiz",
  "conclusion": "2-3 cümlelik yatırım sonuçu",
  "summary": "Olayın iki cümlelik özeti",
  "sentiment": "positive veya negative veya neutral",
  "impactLevel": "high veya medium veya low",
  "keyTakeaways": ["Nokta 1", "Nokta 2", "Nokta 3", "Nokta 4"],
  "affectedAssets": [
    {"symbol": "Varlık sembolü", "name": "Sembol ile varlık adı", "direction": "up veya down veya neutral", "impactDegree": "high veya medium veya low", "reason": "Etki nedeni", "isTradable": true}
  ],
  "recommendation": "Net ve spesifik yatırım önerisi",
  "confidence": "X/10 — gerekçe"
}

Katı kurallar:
- Yalnızca TÜRKÇE yanıt ver — profesyonel finans Türkçesi
- Gerçek bilgin yoksa bir bölümü DOLDURMA — silinmiş bir bölüm, uydurulmuş bir bölümden iyidir
- Öneri her zaman sınıflandırmayla uyumlu
- fullContent Yol [A] ve [B] için [1] ile başlayıp [5] ile bitmeli, Yol [C] için yalnızca [1] + [5] içermeli
- path yalnızca "A" veya "B" veya "C" olmalı
- titleTr, summaryTr ve contentTr'u UNUTMA — bunlar zorunlu alanlar!
- contentTr Markdown biçimlendirmesi içermez — yalnızca satır sonu ile ayrılmış düz metin
- Bir fikri tüm analizde birden fazla kez tekrarlama
- Haber metnini contentTr'de ve ardından fullContent'te çiftleme — her bölüm yeni bilgi getirir
- keyTakeaways yeni bilgi getirmeli — başlığı yeniden formüle etme`;

    const aiResult = await Promise.race([
      chatCompletion([
        {
          role: 'system',
          content: unifiedPrompt,
        },
        {
          role: 'user',
          content: titleTr || summaryTr || 'Finansal haber makalesi',
        },
      ], { temperature: 0.3, maxTokens: 12000, priority: 'generation', locale: 'tr' }),  // V352: Turkish pipeline — Mistral-first + Bedrock/Gemini fallback
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Turkish unified processing timeout')), 180000)
      ),
    ]);

    if (!aiResult.content) {
      // V373: Increment retryCount on AI failure so article eventually gets handled
      await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'AI returned empty content' } });
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[TrProcessor] AI response received: ${aiResult.provider}/${aiResult.model} in ${aiResult.duration}ms, ${aiResult.content.length} chars`);
    // V355: Log first 300 chars of AI response for debugging JSON parse failures
    console.log(`[TrProcessor] AI response preview: ${aiResult.content.slice(0, 300)}`);

    // Parse JSON from AI response
    let parsed = parseAIJson(aiResult.content);
    if (!parsed) {
      // V355: Retry with simplified JSON-only prompt
      console.warn(`[TrProcessor] V355: JSON parse failed for ${articleId} — retrying with simplified prompt`);
      const simplifiedPrompt = `Sen bir finans analistisin. Bu makaleyi işle ve yalnızca geçerli JSON olarak yanıtla, JSON'dan önce veya sonra metin ekleme.

Başlık: ${titleTr}
Özet: ${summaryTr.slice(0, 500)}
${contentTr ? `İçerik: ${contentTr.slice(0, 2000)}` : ''}

Beklenen JSON (yalnızca bu JSON ile yanıt ver, başka bir şey değil):
{
  "titleTr": "Profesyonel Türkçe başlık",
  "summaryTr": "Kısa Türkçe özet",
  "contentTr": "Profesyonel Türkçe makale (en az 200 karakter)",
  "rawData": {"entityNameTr": "Ad", "ticker": "Sembol veya yok", "exchange": "Borsa", "figures": [], "source": "${article.source || 'Kaynak'}"},
  "path": "C",
  "sector": "Finansal sektör",
  "sentimentReason": "Neden",
  "editedArticle": "Düzenlenmiş makale",
  "fullContent": "[1] Ne oldu\\nÖzet\\n\\n[5] Traderlar için\\nBekle",
  "introduction": "Giriş",
  "body": "Analiz",
  "conclusion": "Sonuç",
  "summary": "Özet",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Nokta 1"],
  "affectedAssets": [],
  "recommendation": "Ek veri bekle",
  "confidence": "3/10"
}`;

      try {
        const retryAiResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: simplifiedPrompt },
            { role: 'user', content: 'Şimdi JSON oluştur.' },
          ], { temperature: 0.1, maxTokens: 4000, priority: 'generation', locale: 'tr' }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Simplified prompt timeout')), 120000)
          ),
        ]);

        if (retryAiResult.content) {
          console.log(`[TrProcessor] V355: Simplified retry response: ${retryAiResult.content.slice(0, 300)}`);
          parsed = parseAIJson(retryAiResult.content);
        }
      } catch (retryErr: any) {
        console.warn(`[TrProcessor] V355: Simplified retry also failed: ${retryErr.message}`);
      }

      if (!parsed) {
        // V373: Increment retryCount on JSON parse failure so article eventually gets handled
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'Failed to parse AI JSON response' } });
        result.error = 'Failed to parse AI JSON response (even after simplified retry)';
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // Handle AI rejection — retry once, then SKIP
    if (parsed.status === 'REJECTED') {
      const reason = parsed.reason || 'Finansal olmayan makale';
      console.log(`[TrProcessor] AI tried to REJECT article ${articleId}: "${reason}" — retrying once`);

      const noRejectPrompt = `Sen Türkçe finansal haberler platformu için profesyonel bir finans analistisin. ❌ Bu makaleyi REDDETME ❌

Bu makale finansal anahtar kelime filtresinden geçirilmiş ve güvenilir bir kaynaktan gelmiştir. Bunu işlemek ZORUNDASIN.
Yeterli veri bulamazsan Yol [C] olarak sınıflandır, ancak ❌ "REJECTED" durumunu VERME ❌

⚠️ Altın kural: Yalnızca orijinal metindeki gerçek bilgileri yaz. Sayı, ad veya olay uydurma.

Sonucu yalnızca JSON formatında ver:
{
  "titleTr": "Türkçe başlık — kaynağın sadık çevirisi",
  "summaryTr": "Türkçe özet — yalnızca orijinal metinden",
  "contentTr": "Profesyonel Türkçe haber makalesi — en az 200 karakter — orijinalden çevir, uydurma",
  "rawData": {"entityNameTr": "Varlık adı", "ticker": "Sembol veya yok", "exchange": "Borsa", "figures": ["Metindeki rakamlar"], "source": "Kaynak"},
  "path": "C",
  "sector": "Sektör",
  "sentimentReason": "Duygu nedeni",
  "editedArticle": "Düzenlenmiş makale",
  "fullContent": "[1] Ne oldu\\nİki cümlelik özet\\n\\n[5] Traderlar için\\nSınırlı bilgi",
  "introduction": "Giriş",
  "body": "Analiz",
  "conclusion": "Sonuç",
  "summary": "Özet",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Metindeki nokta"],
  "affectedAssets": [],
  "recommendation": "Sınırlı bilgi — yetersiz veri",
  "confidence": "3/10"
}

Türkçe Başlık: ${titleTr}
Türkçe Özet: ${summaryTr.slice(0, 500)}
${contentTr ? `Türkçe İçerik: ${contentTr.slice(0, 3000)}` : ''}`;

      try {
        const retryResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: noRejectPrompt },
            { role: 'user', content: titleTr || summaryTr || 'Finansal Haberler' },
          ], { temperature: 0.3, maxTokens: 4000, priority: 'generation', locale: 'tr' }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TrProcessor no-reject retry timeout')), 60000)
          ),
        ]);

        const retryParsed = parseAIJson(retryResult.content);
        if (retryParsed && !retryParsed.status && retryParsed.titleTr && retryParsed.contentTr
            && isValidTurkishText(retryParsed.titleTr)
            && isValidTurkishText(retryParsed.contentTr, 80)) {
          console.log(`[TrProcessor] No-reject retry SUCCEEDED for ${articleId}`);
          parsed = { ...parsed, ...retryParsed };
          if (!parsed.path) parsed.path = 'C';
          if (!parsed.sector) parsed.sector = category || 'Ekonomi';
        } else {
          console.log(`[TrProcessor] No-reject retry produced insufficient data for ${articleId} — SKIPPING`);
          const currentRejectCount = (article.rejectCount || 0) + 1;
          await db.newsItem.update({
            where: { id: articleId },
            data: {
              processingStage: 'skipped',
              rejectCount: currentRejectCount,
              lastError: `SKIPPED: AI rejected + retry produced no valid content. Original reason: ${reason}`,
            },
          });
          result.success = true;
          result.fields = ['skipped'];
          result.duration = Date.now() - startTime;
          return result;
        }
      } catch (retryErr: any) {
        console.warn(`[TrProcessor] No-reject retry FAILED for ${articleId}: ${retryErr.message} — SKIPPING`);
        const currentRejectCount = (article.rejectCount || 0) + 1;
        await db.newsItem.update({
          where: { id: articleId },
          data: {
            processingStage: 'skipped',
            rejectCount: currentRejectCount,
            lastError: `SKIPPED: AI rejected + retry failed (${retryErr.message}). Original reason: ${reason}`,
          },
        });
        result.success = true;
        result.fields = ['skipped'];
        result.duration = Date.now() - startTime;
        return result;
      }
    }

    // ── Extract and validate all fields ──
    const updateData: Record<string, any> = {};
    const fields: string[] = [];

    // 1. title (Turkish title — stored in `title` field for Turkish articles)
    if (parsed.titleTr && typeof parsed.titleTr === 'string' && isValidTurkishText(parsed.titleTr, TR_PIPELINE_CONFIG.MIN_TR_TITLE_LENGTH)) {
      // V373: DRAMATICALLY relaxed Turkish language check — threshold 0.05 (was 0.20)
      // Root cause of TR pipeline blockage: AI processes Turkish RSS content but sometimes
      // outputs lose Turkish accents or use English financial terminology.
      // Only reject if the text is CLEARLY Arabic (not just lacking Turkish accents).
      const titleIsMostlyArabic = (() => {
        const arabicChars = (parsed.titleTr.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (parsed.titleTr.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
        const total = arabicChars + latinChars;
        if (total === 0) return false; // No alpha chars at all — don't reject
        return (arabicChars / total) > 0.5; // Only reject if >50% Arabic
      })();
      if (titleIsMostlyArabic) {
        console.warn(`[TrProcessor V373] Title rejected — mostly Arabic: "${parsed.titleTr.slice(0, 60)}"`);
        // Increment retryCount so article eventually gets properly handled
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'Title mostly Arabic, not Turkish' } });
        result.error = 'Title failed Turkish language quality check — mostly Arabic';
        result.duration = Date.now() - startTime;
        return result;
      }
      // V373: Even more relaxed vague title check — only reject if title is truly meaningless
      // AND very short (less than 10 chars instead of 20)
      // Turkish financial titles can be concise (e.g., "Air France: résultat Q1")
      if (isVagueTurkishTitle(parsed.titleTr) && parsed.titleTr.length < 10) {
        console.warn(`[TrProcessor V373] Title rejected — too vague AND very short: "${parsed.titleTr.slice(0, 60)}"`);
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'Title too vague for Turkish news' } });
        result.error = 'Title too vague for Turkish news';
        result.duration = Date.now() - startTime;
        return result;
      }
      let titleTrCleaned = parsed.titleTr.trim();

      // Number integrity check — verify numbers in Turkish title match original
      if (titleTr) {
        const frNumbers = titleTr.match(/\d+(?:[.,]\d+)?/g) || [];
        for (const num of frNumbers) {
          const numVal = parseFloat(num.replace(',', '.'));
          if (isNaN(numVal) || numVal < 1) continue;
          if (!titleTrCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (titleTrCleaned.includes(shifted)) {
              console.warn(`[TrProcessor] DECIMAL SHIFT in title: "${num}" became "${shifted}"! Fixing...`);
              titleTrCleaned = titleTrCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.title = titleTrCleaned;
      fields.push('title');
    }

    // 2. summary (Turkish summary)
    if (parsed.summaryTr && typeof parsed.summaryTr === 'string' && isValidTurkishText(parsed.summaryTr, TR_PIPELINE_CONFIG.MIN_TR_SUMMARY_LENGTH)) {
      let summaryTrCleaned = parsed.summaryTr.trim();

      // Number integrity check for summary
      if (summaryTr) {
        const frNumbers = summaryTr.match(/\d+(?:[.,]\d+)?/g) || [];
        for (const num of frNumbers) {
          const numVal = parseFloat(num.replace(',', '.'));
          if (isNaN(numVal) || numVal < 1) continue;
          if (!summaryTrCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (summaryTrCleaned.includes(shifted)) {
              console.warn(`[TrProcessor] DECIMAL SHIFT in summary: "${num}" → "${shifted}"! Fixing...`);
              summaryTrCleaned = summaryTrCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.summary = summaryTrCleaned;
      fields.push('summary');
    }

    // 3. content (Turkish content)
    const effectiveMinContentLength = parsed.path === 'C'
      ? 80   // Path C — brief analysis
      : TR_PIPELINE_CONFIG.MIN_TR_CONTENT_LENGTH;
    if (parsed.contentTr && typeof parsed.contentTr === 'string' && parsed.contentTr.length >= effectiveMinContentLength && isValidTurkishText(parsed.contentTr, effectiveMinContentLength)) {
      let contentTr = parsed.contentTr.trim();
      contentTr = stripMarkdown(contentTr);
      contentTr = deduplicateTurkishContent(contentTr);
      // V373: Only reject garbage content if it's very short AND clearly boilerplate
      // Increased threshold from 300 to 100 chars — many valid Turkish RSS summaries are short
      if (isTurkishGarbageContent(contentTr) && contentTr.length < 100) {
        console.warn(`[TrProcessor V373] Content rejected — garbage/boilerplate detected for ${articleId} (${contentTr.length} chars)`);
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: `Turkish content quality check failed — garbage/boilerplate (${contentTr.length} chars)` } });
        result.error = 'Turkish content quality check failed — garbage/boilerplate detected';
        result.duration = Date.now() - startTime;
        return result;
      }
      if (contentTr.length >= effectiveMinContentLength) {
        updateData.content = contentTr;
        fields.push('content');
      }
    }

    // 4. slug (generate with random suffix to reduce collisions)
    if (!article.slug && updateData.title) {
      updateData.slug = generateSlug(updateData.title); // Now includes random 4-char suffix
      fields.push('slug');
    }

    // 5. locale — always set to 'tr' for Turkish pipeline
    updateData.locale = 'tr';
    fields.push('locale');

    // 6. categoryId — V375: Improved sector classification
    // The AI often outputs generic sectors like "Ekonomi" or "Finance" regardless
    // of the actual content. We now prefer the ORIGINAL RSS feed category as the
    // primary source, and only use the AI's sector if the original was generic.
    const originalCategoryId = article.categoryId || '';
    const originalCategoryTurkish = article.category || '';
    const aiCategoryId = mapCategoryToId(parsed.sector || category);

    // V375: Prefer original RSS category over AI sector — RSS feeds are pre-classified
    // by topic (stocks, forex, crypto, energy, etc.) which is more accurate than
    // the AI's generic "Ekonomi" classification.
    // Only use AI sector if the original category is missing or is generic (economy/Ekonomi).
    const GENERIC_CATEGORY_IDS = ['economy', ''];
    const isOriginalGeneric = GENERIC_CATEGORY_IDS.includes(originalCategoryId);
    const isAiSpecific = !GENERIC_CATEGORY_IDS.includes(aiCategoryId);

    let categoryId: string;
    if (!isOriginalGeneric && originalCategoryId) {
      // Original RSS category is specific (stocks, forex, crypto, etc.) — USE IT
      categoryId = originalCategoryId;
      console.log(`[TrProcessor V375] Using original RSS category '${originalCategoryId}' (AI suggested '${aiCategoryId}')`);
    } else if (isAiSpecific) {
      // Original was generic but AI suggests a specific category — use AI
      categoryId = aiCategoryId;
      console.log(`[TrProcessor V375] Using AI category '${aiCategoryId}' (original was generic '${originalCategoryId}')`);
    } else {
      // Both are generic — keep as economy
      categoryId = aiCategoryId;
    }

    updateData.categoryId = categoryId;
    fields.push('categoryId');

    // 7. Update category to Turkish name
    updateData.category = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR[categoryId] || parsed.sector || originalCategoryTurkish || 'Ekonomi';
    fields.push('category');

    // 8. aiAnalysis — reconstruct in the format expected by the rest of the pipeline
    if (parsed.path && parsed.fullContent) {
      let fullContent = parsed.fullContent || '';
      let editedArticle = parsed.editedArticle || '';
      let introduction = parsed.introduction || '';
      let body = parsed.body || '';
      let conclusion = parsed.conclusion || '';
      let recommendation = parsed.recommendation || '';

      // Remove Turkish forbidden phrases
      const FORBIDDEN_TR = [
        'dikkat etmek gerekir', 'görünüyor ki', 'zaman gösterecek',
        'söylentilere göre', 'doğrulanmamış', 'belirtmek gerekir ki',
        'gelişmeleri izleyin', 'dikkatli olunması öneriliyor',
        'uzmanlar tarafından', 'kaynaklara göre', 'iddialara göre',
        'muhtemelen', 'olası ki', 'bekleniyor ki',
      ];

      for (const phrase of FORBIDDEN_TR) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'gi');
        fullContent = fullContent.replace(re, '');
        editedArticle = editedArticle.replace(re, '');
        recommendation = recommendation.replace(re, '');
        introduction = introduction.replace(re, '');
        body = body.replace(re, '');
        conclusion = conclusion.replace(re, '');
      }

      // Build aiAnalysis JSON
      const aiAnalysis: Record<string, any> = {
        path: parsed.path,
        sector: parsed.sector,
        sentimentReason: parsed.sentimentReason,
        editedArticle,
        fullContent,
        introduction,
        body,
        conclusion,
        summary: parsed.summary || '',
        sentiment: parsed.sentiment || 'neutral',
        impactLevel: parsed.impactLevel || 'low',
        keyTakeaways: parsed.keyTakeaways || [],
        affectedAssets: parsed.affectedAssets || [],
        recommendation,
        confidence: parsed.confidence || '5/10',
        locale: 'tr',
        rawData: parsed.rawData || {},
      };

      updateData.aiAnalysis = JSON.stringify(aiAnalysis);
      fields.push('aiAnalysis');

      // 9. Set sentiment, impactLevel, impactScore from AI analysis
      if (parsed.sentiment) {
        updateData.sentiment = parsed.sentiment;
        fields.push('sentiment');
      }
      if (parsed.impactLevel) {
        updateData.impactLevel = parsed.impactLevel;
        fields.push('impactLevel');
      }
      // Calculate impactScore from confidence
      if (parsed.confidence) {
        const confMatch = String(parsed.confidence).match(/(\d+)\s*\/\s*10/);
        if (confMatch) {
          updateData.impactScore = parseInt(confMatch[1], 10) * 10;
          fields.push('impactScore');
        }
      }
      // Set sentimentScore based on sentiment + impact
      if (parsed.sentiment) {
        const baseScore = parsed.sentiment === 'positive' ? 70 : parsed.sentiment === 'negative' ? 30 : 50;
        const impactMod = parsed.impactLevel === 'high' ? 15 : parsed.impactLevel === 'medium' ? 5 : 0;
        updateData.sentimentScore = parsed.sentiment === 'negative' ? baseScore - impactMod : baseScore + impactMod;
        fields.push('sentimentScore');
      }

      // 10. Set affectedAssets — with content relevance verification
      if (parsed.affectedAssets && Array.isArray(parsed.affectedAssets)) {
        const articleTextForVerify = `${titleTr || ''} ${summaryTr || ''} ${parsed.fullContent || ''} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
        const COMMODITY_KW: Record<string, string[]> = {
          XAUUSD: ['gold', 'xau', 'altın', 'kıymetli metal'], XAGUSD: ['silver', 'xag', 'gümüş'],
          CL: ['oil', 'crude', 'wti', 'petrol', 'brent', 'opec', 'ham petrol'], BZ: ['brent', 'oil', 'petrol'],
          BTCUSD: ['bitcoin', 'btc', 'crypto', 'kripto'], ETHUSD: ['ethereum', 'eth', 'crypto', 'kripto'],
          EURUSD: ['euro', 'eur/usd', 'eurusd', 'avro'], GBPUSD: ['pound', 'sterling', 'İngiliz sterlini'],
          USDJPY: ['yen', 'jpy', 'usd/jpy', 'japon yeni'],
        };
        const verifiedAssets = parsed.affectedAssets.filter((asset: any) => {
          const sym = (asset.symbol || '').toUpperCase();
          const assetName = (asset.name || '').toLowerCase();
          if (/^[A-Z]{1,5}$/.test(sym) && !COMMODITY_KW[sym]) {
            if (!articleTextForVerify.includes(sym.toLowerCase()) && !(assetName && articleTextForVerify.includes(assetName))) return false;
          }
          const kw = COMMODITY_KW[sym];
          if (kw && !kw.some(k => articleTextForVerify.includes(k.toLowerCase())) && !articleTextForVerify.includes(sym.toLowerCase())) return false;
          return true;
        });
        updateData.affectedAssets = JSON.stringify(verifiedAssets);
        fields.push('affectedAssets');
      }
    }

    // ── Update the article ──
    if (fields.length > 0) {
      await db.newsItem.update({
        where: { id: articleId },
        data: updateData,
      });
    }

    // ── Advance processing stage ──
    // TR processor does content + analysis + sentiment + assets in ONE call.
    // It must jump to 'analyzed' stage so the imager can pick it up next.
    await db.newsItem.update({
      where: { id: articleId },
      data: { processingStage: 'analyzed' },
    });
    console.log(`[TrProcessor] Article ${articleId}: ${article.processingStage} → analyzed (FR multi-stage skip)`);

    result.success = true;
    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[TrProcessor] ✓ Processed ${articleId} in ${result.duration}ms — fields: ${fields.join(', ')}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[TrProcessor] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}
