// ═══════════════════════════════════════════════════════════════
// Turkish Infographic Generator Agent
// Generates infographic data in Turkish for the Turkish pipeline.
//
// - System prompt unified with V13 Design System (same structure, Turkish language)
// - Same detailed chart_config, image_prompt rules, and JSON examples
// - Sets locale: 'tr' on generated infographics
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';
import { TR_PIPELINE_CONFIG } from '../tr-pipeline-config';

export interface TrInfographicResult {
  success: boolean;
  infographicId?: string;
  title?: string;
  isPublished?: boolean;
  error?: string;
}

// ── Fetch Source Content ──
async function fetchSourceTr(sourceType: string, sourceId: string) {
  if (sourceType === 'news') {
    const news = await db.newsItem.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, content: true, summary: true,
        category: true, categoryId: true, sentiment: true,
        impactScore: true, aiAnalysis: true, slug: true, locale: true,
      },
    });
    if (!news) return null;
    if (news.locale && news.locale !== 'tr') return null;
    return {
      type: 'news' as const,
      id: news.id,
      title: news.title,
      content: news.content || '',
      summary: news.summary || '',
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
        reportType: true, scope: true, sectors: true, locale: true,
        keyIndicators: true, marketImpact: true, confidenceScore: true, slug: true,
      },
    });
    if (!report) return null;
    if (report.locale && report.locale !== 'tr') return null;
    return {
      type: 'economic_report' as const,
      id: report.id,
      title: report.title,
      content: report.content,
      summary: report.summary,
      category: report.reportType,
      sectors: report.sectors,
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
        id: true, title: true, content: true, assetClass: true, locale: true,
        analysisType: true, timeFrame: true, indicators: true,
        priceTarget: true, riskLevel: true, sentiment: true,
        confidenceScore: true, slug: true,
      },
    });
    if (!analysis) return null;
    if (analysis.locale && analysis.locale !== 'tr') return null;
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

// ── Turkish System Prompt (V13 Design System) ──
const TR_INFOGRAPHIC_SYSTEM_PROMPT = `Profesyonel bir finansal infografik tasarımcısı ve finans haberlerini profesyonel görsel içeriğe dönüştürme konusunda uzmanlaşmış bir veri analistsiniz.

═══════════════════════════════════
Sıkı Tasarım Kuralları (V13)
═══════════════════════════════════

1. Dil :
- %100 saf profesyonel Türkçe, istisnasız
- Hiçbir slaytta yabancı kelime yok
- Rakamlar her yerde Batı rakamlarıyla (0123456789)
- Yön : LTR (Soldan Sağa) tüm metin için zorunlu

2. Sayılar :
- Yalnızca orijinal kaynakta bulunan sayıları ekleyin
- Gerçek bir sayınız yoksa → nitel bir açıklama yazın
- Asla yüzde veya fiyat uydurmayın
- Sayıları dikey olarak hizalamak için font-variant-numeric : tabular-nums kullanın

3. Tavsiyeler :
- Pozitif → Yalnızca Satın Al
- Negatif → Yalnızca Sat
- Nötr → Yalnızca Tut
- Duygu ile tavsiye arasında asla çelişki yok
- Eylem rengi : Satın Al=yeşil, Sat=kırmızı, Tut=turuncu

4. Anti-hallüsinasyon :
- Uydurulmuş hisse senedi sembolü yok
- Kaynaksız fiyat hedefi yok
- Sihirli ifade : "Yetersiz veri — güncellemeleri takip edin"

5. Aralık sistemi (8px Izgara — zorunlu) :
- xs : 4px, sm : 8px, md : 16px, lg : 24px, xl : 32px, 2xl : 48px
- Tüm aralıklar 4px'in katı olmalıdır
- 3px veya 7px gibi tek aralık yok

6. Boş durumlar :
- Bir tablo boşsa (indicators=[], scenarios=[]) → slaytı EKLEMEYİN
- Boş bir slayt yerine, alt başlık alanına "Yetersiz veri — güncellemeleri takip edin" yazın

7. Güven çubuğu renkleri :
- %30'un altında → Kırmızı #EF4444 (düşük güven)
- %30 - %70 → Turuncu #F59E0B (orta güven)
- %70'in üzerinde → Yeşil #10B981 (yüksek güven)

8. Otomatik renk-yön bağlantısı :
- Bullish/Pozitif → Yeşil (#10B981)
- Bearish/Negatif → Kırmızı (#EF4444)
- Nötr/İzleme → Mavi (#3B82F6)
- Uyarı → Turuncu (#F59E0B)

═══════════════════════════════════
Görsel Sistemi — AI Görsel İstemleri
═══════════════════════════════════

Her slayt için, image_prompt'ı İngilizce olarak belirtin — AI tarafından oluşturulan profesyonel bir infografik arka plan için bir açıklama :

Kurallar :
- Açıklama İngilizce olmalıdır
- Metinsiz sinematik karanlık profesyonel arka plan
- Her zaman "Professional financial infographic background" ile başlayın
- "no text, ultra detailed, 8k" ile bitirin
- Slayt 1 (Hero) : image_position "background-full" + image_overlay 0.40
- Slaytlar 2-5 : image_position "right-30"
- Slayt 6 : image_position null — görsel yok

Örnekler :
- Petrol : "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k"
- Altın : "Professional financial infographic background, dark navy blue with gold bars and precious metals glow, gold accent, no text, ultra detailed, 8k"
- Hisseler : "Professional financial infographic background, dark navy blue with stock chart lines and trading signals, gold and green accent, no text, ultra detailed, 8k"

═══════════════════════════════════
Grafik Sistemi — chart_config
═══════════════════════════════════

Her slayt, grafik türünü belirten bir chart_config alanı içerir :

- Slayt 1 (Hero) : gauge (dairesel gösterge)
  chart_config: { type: "gauge", value: sayı, max: maks_değer, unit: "birim" }

- Slayt 3 (Veri) : bar (yatay çubuklar)
  chart_config: { type: "bar", orientation: "horizontal", categories: [isimler], values: [sayılar], colors: [renkler] }
  Renkler : yükseliş="#10B981" düşüş="#EF4444" nötr="#3B82F6"

- Slayt 4 (Senaryolar) : slope (eğim çizgileri)
  chart_config: { type: "slope", leftLabel: "Mevcut", rightLabel: "Beklenen", items: [{name, leftValue, rightValue, color}] }
  Renkler : iyimser="#10B981" nötr="#F59E0B" kötümser="#EF4444"

- Slayt 5 (Varlıklar) : treemap
  chart_config: { type: "treemap", data: [{name, value, color}] }
  Renkler : yararlanan="#10B981" etkilenen="#EF4444"

- Slayt 6 (Tavsiyeler) : funnel
  chart_config: { type: "funnel", data: [{name, value, color}] }
  Renkler : günlük="#D4AF37" orta_vade="#3B82F6" uzun_vade="#10B981"

═══════════════════════════════════
Tam Slayt Yapısı (6 slayt)
═══════════════════════════════════

── Slayt 1 : Hero (Görsel şok) ──

image_prompt : Sektörü yansıtan İngilizce profesyonel açıklama
image_position : "background-full"
image_overlay : 0.65

Zorunlu bileşenler :
- heroNumber : Haberin dikkat çekici sayısı (fiyat, yüzde, miktar)
- heroUnit : Ölçü birimi (maks. 3-4 kelime)
- title : Ana başlık (maks. 8 kelime)
- subtitle : Açıklayıcı metin (maks. 12 kelime)
- tag : Sektör etiketi (bir kelime)
- status : urgent | important | fırsat | uyari
- color : red | green | orange | blue
- confidence : 0-100 sayı (analiz güven seviyesi)

Renk seçimi kuralı :
red    = negatif / tehlike / düşüş
green  = pozitif / fırsat / yükseliş
orange = uyarı / nötr / izleme
blue   = bilgi / bağlam / nötr

Güven çubuğu kuralı :
confidence < 30 → Kırmızı renk (düşük güven — uyarı)
confidence 30-70 → Turuncu renk (orta güven)
confidence > 70 → Yeşil renk (yüksek güven)

── Slayt 2 : Görsel hikaye ──

image_prompt : İlişkiyi yansıtan İngilizce profesyonel açıklama
image_position : "right-30"

Yalnızca BİR model seçin :

Model A — Akış : Haber iki taraf arasındaki bir ilişki hakkında olduğunda
  elements : { from, event, to, impact }

Model B — Karşılaştırma : Haber önce/sonra bir değişim hakkında olduğunda
  elements : { before: {label, value}, after: {label, value}, change: {amount, direction} }

Model C — Harita : Haber coğrafi olduğunda
  elements : { regions: [{name, impact}] }

Model D — Neden-sonuç dizisi : Haber sıralı olaylar hakkında olduğunda
  elements : { event1, event2, event3, consequence1, consequence2, consequence3 }
  (Sırada 3 olay + 3 sonuç)

── Slayt 3 : Rakamlar ve veriler ──

image_prompt : Verileri yansıtan İngilizce profesyonel açıklama
image_position : "right-30"

indicators : (Yalnızca orijinal kaynaktan 4-6 gösterge)
Her gösterge : name, symbol, value, direction (up|down|neutral), change, reason

Renk kuralı : yükseliş=yeşil (#10B981), düşüş=kırmızı (#EF4444), nötr=mavi (#3B82F6)

── Slayt 4 : Senaryolar ──

image_prompt : Geleceği yansıtan İngilizce profesyonel açıklama
image_position : "right-30"

3 senaryo : iyimser, nötr, kötümser
Her senaryo : type, emoji, name, condition, result, price, probability

── Slayt 5 : Etkilenen varlıklar ──

image_prompt : Yükseliş ve düşüşü yansıtan İngilizce profesyonel açıklama
image_position : "right-30"

benefiting : (maks. 4) — her biri : name, symbol, reason, expected_move
harmed : (maks. 4) — her biri : name, symbol, reason, expected_move

Sıkı kural :
- Gerçek bir hisse senedi sembolü olmadan bir varlık BELİRTMEYİN
- Haberden belirli bir neden olmadan bir varlık BELİRTMEYİN

── Slayt 6 : Tavsiyeler ve özet ──

image_position : null (görsel yok)

recommendations :
daily : asset, symbol, action, entry, target, stop, timeframe
medium : asset, action, allocation, horizon, reason
long : asset, action, allocation, horizon, reason

Tavsiye kartları :
- Satır içi kenarlık (borderInlineStart) : eylem rengiyle 3px (satın al=yeşil, sat=kırmızı, tut=turuncu)
- Satır içi kenarlığı olan kartlarda kenarlık yarıçadı yok (borderRadius : 0)
- padding : 16px 20px
- Daha açık renkte açıklama (#9CA3AF)

summary : Yalnızca 3 nokta — birbirinden farklı, tekrar yok
cta : "Rouaa — Uzman Finansal Analizler"

═══════════════════════════════════
Gerekli JSON Çıktısı (sıkı)
═══════════════════════════════════

Yalnızca JSON ile yanıt verin, dışında hiçbir metin olmadan.
Giriş, açıklama veya geri tırnak yok.
Yalnızca { ile başlayan ve } ile biten temiz JSON

{
  "slides": [
    {
      "number": 1,
      "type": "hero",
      "image_prompt": "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k",
      "image_position": "background-full",
      "image_overlay": 0.40,
      "heroNumber": "150",
      "heroUnit": "USD varil başına",
      "title": "Ana başlık",
      "subtitle": "Açıklayıcı metin",
      "tag": "Enerji",
      "status": "urgent",
      "color": "red",
      "confidence": 75,
      "chart_config": { "type": "gauge", "value": 150, "max": 200, "unit": "USD varil başına" }
    },
    {
      "number": 2,
      "type": "story",
      "image_prompt": "Professional financial infographic background, dark navy blue with geopolitical connection lines, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "pattern": "D",
      "title": "Slayt başlığı",
      "elements": {
        "event1": "İlk olay",
        "event2": "İkinci olay",
        "event3": "Üçüncü olay",
        "consequence1": "İlk sonuç",
        "consequence2": "İkinci sonuç",
        "consequence3": "Üçüncü sonuç"
      }
    },
    {
      "number": 3,
      "type": "data",
      "image_prompt": "Professional financial infographic background, dark navy blue with stock chart lines, gold and green accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slayt başlığı",
      "indicators": [
        { "name": "Ad", "symbol": "SEM", "value": "Değer", "direction": "up", "change": "+%5", "reason": "Neden" }
      ],
      "chart_config": { "type": "bar", "orientation": "horizontal", "categories": ["SEM"], "values": [5], "colors": ["#10B981"] }
    },
    {
      "number": 4,
      "type": "scenarios",
      "image_prompt": "Professional financial infographic background, dark navy blue with crossroads and decision paths, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slayt başlığı",
      "scenarios": [
        { "type": "optimistic", "emoji": "🟢", "name": "Ad", "condition": "Koşul", "result": "Sonuç", "price": null, "probability": "Orta" },
        { "type": "neutral", "emoji": "🟡", "name": "Ad", "condition": "Koşul", "result": "Sonuç", "price": null, "probability": "Yüksek" },
        { "type": "pessimistic", "emoji": "🔴", "name": "Ad", "condition": "Koşul", "result": "Sonuç", "price": null, "probability": "Düşük" }
      ],
      "chart_config": { "type": "slope", "leftLabel": "Mevcut", "rightLabel": "Beklenen", "items": [{"name": "İyimser", "leftValue": 100, "rightValue": 120, "color": "#10B981"}, {"name": "Nötr", "leftValue": 100, "rightValue": 100, "color": "#F59E0B"}, {"name": "Kötümser", "leftValue": 100, "rightValue": 80, "color": "#EF4444"}] }
    },
    {
      "number": 5,
      "type": "assets",
      "image_prompt": "Professional financial infographic background, dark navy blue with bull and bear market abstract shapes, gold and red accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slayt başlığı",
      "benefiting": [
        { "name": "Ad", "symbol": "SEM", "reason": "Neden", "expected_move": null }
      ],
      "harmed": [
        { "name": "Ad", "symbol": "SEM", "reason": "Neden", "expected_move": null }
      ],
      "chart_config": { "type": "treemap", "data": [{"name": "SEM (Yararlanan)", "value": 100, "color": "#10B981"}, {"name": "SEM (Etkilenen)", "value": 80, "color": "#EF4444"}] }
    },
    {
      "number": 6,
      "type": "recommendations",
      "image_position": null,
      "title": "Slayt başlığı",
      "recommendations": {
        "daily": { "asset": "Varlık", "symbol": "SEM", "action": "Satın Al", "entry": null, "target": null, "stop": null, "timeframe": "Günlük" },
        "medium": { "asset": "Varlık", "action": "Eylem", "allocation": null, "horizon": "Dönem", "reason": "Neden" },
        "long": { "asset": "Varlık", "action": "Eylem", "allocation": null, "horizon": "Dönem", "reason": "Neden" }
      },
      "summary": ["İlk nokta", "İkinci nokta", "Üçüncü nokta"],
      "cta": "Rouaa — Uzman Finansal Analizler",
      "chart_config": { "type": "funnel", "data": [{"name": "Varlık", "value": 100, "color": "#D4AF37"}, {"name": "Varlık", "value": 70, "color": "#3B82F6"}, {"name": "Varlık", "value": 40, "color": "#10B981"}] }
    }
  ],
  "metadata": {
    "topic": "İnfografik konusu",
    "sector": "Sektör",
    "sentiment": "Pozitif|Negatif|Nötr",
    "confidence": 75,
    "primary_color": "red|green|orange|blue"
  }
}

⛔⛔⛔ Son kurallar :
- Kaynakta bulunmayan sayıları UYDURMAYIN
- Her slayt gerçek ve zengin içerik içermelidir — boşluk yok
- Aynı veri setinde farklı birimleri KARIŞTIRMAYIN
- Duygu ile tavsiye arasında çelişki yok
- Tavsiyeleri TEKRAR ETMEYİN — her biri benzersiz
- Yalnızca JSON döndürün, ek metin veya markdown yok`;

// ── Main Function ──
export async function generateInfographicTr(
  sourceType: string,
  sourceId: string,
): Promise<TrInfographicResult> {
  // Step 1: Fetch source content
  const source = await fetchSourceTr(sourceType, sourceId);
  if (!source) {
    return { success: false, error: 'Source not found or not Turkish' };
  }

  // Step 2: Check for existing infographic
  const existing = await db.infographic.findFirst({
    where: { sourceType, sourceId },
  });
  if (existing) {
    return { success: false, error: 'Infographic already exists for this source' };
  }

  // Step 3: Build prompt with source data
  const contentForAI = source.content?.slice(0, 6000) || source.summary?.slice(0, 3000) || source.title;
  const aiAnalysisSection = source.aiAnalysis ? `\n\nAI Analizi:\n${source.aiAnalysis.slice(0, 1500)}` : '';
  const sentiment = source.sentiment || 'neutral';
  const sector = source.category || 'General';
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `Mevcut tarih : ${currentDate}
Makale : ${source.title}
${source.summary ? `Özet : ${source.summary.slice(0, 800)}` : ''}

Tam içerik :
${contentForAI}${aiAnalysisSection}

Sektör : ${sector}
Duygu : ${sentiment}

⛔⛔⛔ Hatırlayın :
1. Yalnızca içerikten sayıları çıkarın — veri UYDURMAYIN
2. Her slayt = gerçek ve zengin içerik — boşluk yok
3. Duygu ile tavsiye arasında çelişki yok
4. Her slayt için image_prompt belirtin (6. hariç) — İngilizce karanlık profesyonel arka plan açıklaması
5. Her slayt için chart_config belirtin (hikaye hariç) — grafik türü ve veriler
6. Yalnızca JSON döndürün, ek metin yok`;

  console.log(`[TrInfographicGen] ${sourceType}:${sourceId} kaynağından oluşturuluyor — başlık: "${source.title?.slice(0, 60)}"`);

  // Step 4: Call AI
  let result: any;
  try {
    try {
      result = await chatCompletion([
        { role: 'system', content: TR_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Increased from 8000 → 16000 to prevent truncated JSON
        priority: 'generation',
        locale: 'tr',
      });
    } catch {
      result = await chatCompletion([
        { role: 'system', content: TR_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Same increase for fallback provider
        priority: 'translation',
        locale: 'tr',
      });
    }
  } catch (aiErr: any) {
    return { success: false, error: `AI başarısız: ${aiErr.message?.slice(0, 100)}` };
  }

  // Step 5: Parse AI response
  let responseText = result.content?.trim() || '';

  // V400: Check for truncated output — but now ATTEMPT to repair instead of immediately failing.
  // Previously, truncated JSON was an instant failure. Now we try to close unclosed brackets.
  const isTruncated = result.stopReason === 'max_tokens' || result.stopReason === 'length';
  if (isTruncated) {
    console.warn(`[TrInfographicGen V400] Output TRUNCATED at ${result.provider || 'unknown'}/${result.model || 'unknown'} (stopReason=${result.stopReason}) — attempting JSON repair. Response length: ${responseText.length} chars`);
  }

  // Strip markdown code fences and extra text around JSON
  responseText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  responseText = responseText.replace(/^```/i, '').replace(/```$/i, '');

  // V381: Try to extract JSON from the response even if there's surrounding text.
  // The AI sometimes returns explanatory text before/after the JSON.
  let jsonStr = responseText;
  const jsonStart = responseText.indexOf('{');
  const jsonEnd = responseText.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonStr = responseText.slice(jsonStart, jsonEnd + 1);
  }

  // V400: Advanced JSON repair before parsing
  // 1. Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  // 2. Fix unescaped newlines in string values
  jsonStr = jsonStr.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"');
  // 3. Fix single quotes → double quotes (common AI mistake)
  jsonStr = jsonStr.replace(/'/g, '"');
  // 4. Fix missing closing brackets (truncated output repair)
  if (isTruncated || !jsonStr.trimEnd().endsWith('}')) {
    // Count open vs close brackets
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/]/g) || []).length;
    
    // Close unclosed string at end
    const tempStr = jsonStr.trimEnd();
    if (tempStr.endsWith('"') === false && tempStr.match(/"[^"]*$/)) {
      jsonStr = tempStr + '"';
    }
    // Close unclosed brackets and arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
    
    console.log(`[TrInfographicGen V400] JSON repair: added ${openBrackets - closeBrackets} brackets, ${openBraces - closeBraces} braces`);
  }

  let infographicData: any;
  try {
    infographicData = JSON.parse(jsonStr);
  } catch (parseErr: any) {
    // V400: Second repair attempt — more aggressive
    try {
      // Try to find the last complete object by finding the last "number" field
      const lastCompleteSlide = jsonStr.lastIndexOf('"number"');
      if (lastCompleteSlide > 0) {
        // Find the end of this slide's object
        let braceCount = 0;
        let cutPoint = lastCompleteSlide;
        for (let i = lastCompleteSlide; i >= 0; i--) {
          if (jsonStr[i] === '}') braceCount++;
          if (jsonStr[i] === '{') braceCount--;
          if (braceCount === 0) { cutPoint = i; break; }
        }
        // Find the enclosing array
        const arrStart = jsonStr.lastIndexOf('[', lastCompleteSlide);
        if (arrStart >= 0) {
          let repairedJson = jsonStr.slice(0, arrStart);
          // Close the slides array
          repairedJson += ']';
          // Close the main object
          const mainOpenBraces = (repairedJson.match(/{/g) || []).length;
          const mainCloseBraces = (repairedJson.match(/}/g) || []).length;
          for (let i = 0; i < mainOpenBraces - mainCloseBraces; i++) repairedJson += '}';
          console.log(`[TrInfographicGen V400] Aggressive JSON repair: truncated to last complete slide`);
          infographicData = JSON.parse(repairedJson);
        } else {
          throw parseErr;
        }
      } else {
        throw parseErr;
      }
    } catch (secondRepairErr: any) {
      const preview = jsonStr.length > 200 ? jsonStr.slice(0, 100) + '...' + jsonStr.slice(-100) : jsonStr;
      console.error(`[TrInfographicGen V400] JSON ayrıştırma başarısız (2 onarım denemesi): ${parseErr.message} — JSON önizleme: "${preview}"`);
      return { success: false, error: `JSON ayrıştırma başarısız: ${parseErr.message?.slice(0, 80)}` };
    }
  }

  // Step 6: Validate structure
  if (!infographicData.slides || !Array.isArray(infographicData.slides) || infographicData.slides.length === 0) {
    return { success: false, error: 'Yanıtta geçerli slayt yok' };
  }

  if (infographicData.slides[0].type !== 'hero') {
    infographicData.slides[0].type = 'hero';
  }

  // Normalize slides
  infographicData.slides.forEach((s: any, i: number) => {
    if (!s.id) s.id = `slide-${i + 1}`;
    s.number = s.number || i + 1;
    if (!s.content) s.content = {};
    const copyFields = ['heroNumber', 'heroUnit', 'tag', 'status', 'pattern', 'elements',
      'indicators', 'scenarios', 'benefiting', 'harmed', 'recommendations', 'summary',
      'cta', 'color', 'image_position', 'image_overlay', 'image_url', 'subtitle'];
    for (const f of copyFields) {
      if (s[f] !== undefined && s.content[f] === undefined) s.content[f] = s[f];
    }
  });

  // Filter valid slides
  const validSlides = infographicData.slides.filter((s: any) => {
    if (!s.type || !s.title || !s.title.trim()) return false;
    const c = s.content || {};
    switch (s.type) {
      case 'hero': return true;
      case 'story': return c.elements && (Array.isArray(c.elements) ? c.elements.length > 0 : Object.keys(c.elements).length > 0);
      case 'data': return Array.isArray(c.indicators) && c.indicators.length > 0;
      case 'scenarios': return Array.isArray(c.scenarios) && c.scenarios.length > 0;
      case 'assets': return (Array.isArray(c.benefiting) && c.benefiting.length > 0) || (Array.isArray(c.harmed) && c.harmed.length > 0);
      case 'recommendations': return c.recommendations?.daily || c.recommendations?.medium || c.recommendations?.long || (Array.isArray(c.summary) && c.summary.some((s: string) => s?.trim()));
      default: return true;
    }
  });

  infographicData.slides = validSlides;
  if (validSlides.length < 3) {
    return { success: false, error: `Yalnızca ${validSlides.length} geçerli slayt (minimum 3)` };
  }

  // Step 7: Generate AI images
  const infographicCategory = infographicData.metadata?.sector || source.category || null;
  let imageGenerationSuccess = false;
  let slidesWithImages = 0;
  let slidesNeedingImages = 0;

  try {
    for (const slide of infographicData.slides) {
      const position = slide.image_position ?? slide.content?.image_position;
      if (position !== null && slide.type !== 'recommendations' && slide.type !== 'summary') {
        slidesNeedingImages++;
      }
    }

    await generateSlideImages(infographicData.slides, infographicCategory);

    for (const slide of infographicData.slides) {
      const imageUrl = slide.image_url || slide.content?.image_url;
      if (isValidImageUrl(imageUrl)) {
        slidesWithImages++;
      }
    }

    imageGenerationSuccess = slidesWithImages >= slidesNeedingImages;
    console.log(`[TrInfographicGen] Görseller: ${slidesWithImages}/${slidesNeedingImages} (başarı=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[TrInfographicGen] Görsel oluşturma BAŞARISIZ: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 8: Save to database with locale: 'tr'
  const baseSlug = generateSlug(infographicData.title || source.title);
  const slug = baseSlug + '-' + Date.now().toString(36).slice(-4);

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
        locale: 'tr',  // ← Turkish locale
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
      },
    });

    console.log(`[TrInfographicGen] Oluşturuldu: ${infographic.id} — ${validSlides.length} slayt — locale=tr — yayınlandı=${imageGenerationSuccess}`);

    return {
      success: true,
      infographicId: infographic.id,
      title: infographic.title,
      isPublished: imageGenerationSuccess,
    };
  } catch (dbErr: any) {
    return { success: false, error: `DB hatası: ${dbErr.message?.slice(0, 100)}` };
  }
}
