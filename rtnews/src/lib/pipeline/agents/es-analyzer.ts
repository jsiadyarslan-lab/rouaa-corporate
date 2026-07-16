// ═══════════════════════════════════════════════════════════════
// Spanish 4-Gates Analyzer Agent
// Performs the 4-Gates financial analysis in Spanish.
// This is the Spanish counterpart of fr-analyzer.ts.
//
// Key differences from French analyzer:
// - Spanish prompts for financial analysis
// - Spanish-specific forbidden phrases and vague patterns
// - Validates Spanish content quality
// - Same JSON structure but with Spanish content
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { ES_PIPELINE_CONFIG } from '../es-pipeline-config';
import { isMostlySpanish } from '@/lib/locale';
import { ProcessingStage } from '../queue/job-types';

export interface EsAnalysisResult {
  articleId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// ── Spanish forbidden phrases to auto-remove from AI output ──
const FORBIDDEN_PHRASES_ES = [
  // Vague/generic investor advice
  'cabe señalar que',
  'cabe destacar que',
  'hay que señalar que',
  'según fuentes',
  'se informa que',
  'se dice que',
  'parecería que',
  'sin duda alguna',
  'va sin decir',
  'como todos saben',
  // Empty hedging
  'monitorear los desarrollos',
  'observar de cerca',
  'ser prudente',
  'mantenerse atento',
  'manténganse atentos',
  'estar atento a',
  'el tiempo lo dirá',
  // Overly speculative hedging
  'solo el tiempo lo dirá',
  'el veredicto está por definir',
  'rumores',
  'no confirmado',
];

// ── Vague/non-tradeable asset names to filter from affectedAssets ──
const VAGUE_ASSET_PATTERNS_ES = [
  /relaciones comerciales/i,
  /economía mundial/i,
  /mercado mundial/i,
  /comercio mundial/i,
  /macroeconomía/i,
  /mercados financieros/i,
  /mercados mundiales/i,
  /sector financiero/i,
  /relaciones internacionales/i,
  /tensiones comerciales/i,
  /guerra comercial/i,
  /comercio internacional/i,
  /sistema financiero/i,
  /cadena de suministro/i,
];

// ── Spanish speculative words/phrases ──
const STRONG_SPECULATIVE_PHRASES_ES = [
  'podría potencialmente', 'podría provocar', 'podría experimentar',
  'podría alcanzar', 'podría bajar', 'podría subir',
  'podría afectar', 'podría conducir a', 'podría verse afectado',
  'riesgo de', 'se espera que', 'los analistas prevén',
  'es posible que', 'es susceptible de',
  'se espera en', 'podría producirse', 'riesgo de que ocurra',
];

const WEAK_SPECULATIVE_WORDS_ES = [
  'quizás', 'probablemente', 'posiblemente', 'parece', 'al parecer',
  'presumiblemente', 'supuestamente', 'según se dice', 'según ciertas fuentes',
  'según se comenta',
];

// ── Sell/buy keywords in Spanish recommendations ──
const SELL_KEYWORDS_ES = [
  'vender', 'venta', 'bajista', 'posición corta', 'cubrir',
  'reducir', 'posición de venta', 'apostar a la baja',
  'objetivo de baja', 'tomar posición corta', 'vender en corto',
  'evitar', 'salir', 'reducir exposición',
];

const BUY_KEYWORDS_ES = [
  'comprar', 'compra', 'alcista', 'posición larga', 'acumular',
  'subvaluado', 'posición de compra', 'apostar al alza',
  'objetivo de alza', 'tomar posición larga',
  'añadir a la posición', 'entrar',
];

// ── Spanish content quality validation ──
function isValidSpanishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ¿¡]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  return (latinChars / totalAlpha) >= ES_PIPELINE_CONFIG.MIN_SPANISH_RATIO;
}

// ── Spanish text deduplication ──
function deduplicateSpanishText(text: string): string {
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

// ── Speculation detection (Spanish) ──
interface SpeculationReport {
  speculationScore: number;
  speculationWordCount: number;
  totalWordCount: number;
  hasSpecificNumbers: boolean;
  shouldRepublish: boolean;
  shouldNotPublish: boolean;
  reason: string;
}

// V375: Extended speculation detection with configurable block threshold.
// Reports are naturally longer and more speculative than news articles —
// they analyze trends and provide forecasts. Using a higher block threshold
// for reports prevents valid analysis from being discarded.
export function detectSpeculationEs(content: string, blockThreshold?: number): SpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0,
      speculationWordCount: 0,
      totalWordCount: 0,
      hasSpecificNumbers: false,
      shouldRepublish: false,
      shouldNotPublish: false,
      reason: 'Contenido demasiado corto para el análisis de especulación',
    };
  }

  let speculationWordCount = 0;

  // Count strong speculative phrases (each counts as 2)
  for (const phrase of STRONG_SPECULATIVE_PHRASES_ES) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length * 2;
    }
  }

  // Count weak speculative words (each counts as 1)
  for (const word of WEAK_SPECULATIVE_WORDS_ES) {
    // Only count standalone usage (not as part of strong phrases)
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
  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|[\d,]+\s*(?:mil millones|millón|millones|mil|billón|billones)|\d+[\.,]?\d*|\$[\d,]+/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3;

  const effectiveBlockThreshold = blockThreshold ?? ES_PIPELINE_CONFIG.SPECULATION_BLOCK_THRESHOLD;
  const shouldRepublish = speculationWordCount > ES_PIPELINE_CONFIG.SPECULATION_REPUBLISH_THRESHOLD;
  const shouldNotPublish = speculationWordCount > effectiveBlockThreshold && !hasSpecificNumbers;

  let reason = 'El contenido está basado en datos';
  if (shouldNotPublish) {
    reason = `Especulación excesiva: ${speculationWordCount} palabras especulativas. El contenido carece de datos reales.`;
  } else if (shouldRepublish) {
    reason = `Especulación elevada: ${speculationWordCount} palabras especulativas. Debería regenerarse con más datos.`;
  } else if (!hasSpecificNumbers) {
    reason = `Número bajo de palabras especulativas (${speculationWordCount}) pero no se encontraron cifras específicas — el contenido puede ser vago.`;
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
function validateSentimentRecommendationEs(sentiment: string, recommendation: string): string {
  if (!recommendation || !sentiment) return recommendation;

  const recLower = recommendation.toLowerCase();
  const hasSell = SELL_KEYWORDS_ES.some(kw => recLower.includes(kw));
  const hasBuy = BUY_KEYWORDS_ES.some(kw => recLower.includes(kw));

  // Positive sentiment + sell recommendation = contradiction
  if (sentiment === 'positive' && hasSell) {
    console.warn(`[EsAnalyzer] Sentiment-recommendation contradiction: positive sentiment + sell recommendation. Fixing...`);
    return recommendation.replace(/\bvender\b|\bventa\b|\bbajista\b|\bcubrir\b|\breducir\b/gi, 'mantener');
  }

  // Negative sentiment + buy recommendation = contradiction
  if (sentiment === 'negative' && hasBuy) {
    console.warn(`[EsAnalyzer] Sentiment-recommendation contradiction: negative sentiment + buy recommendation. Fixing...`);
    return recommendation.replace(/\bcomprar\b|\bcompra\b|\balcista\b|\bacumular\b|\bentrar\b/gi, 'mantener');
  }

  return recommendation;
}

export async function analyzeArticleEs(articleId: string): Promise<EsAnalysisResult> {
  const startTime = Date.now();
  const result: EsAnalysisResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has quality Spanish analysis
    if (article.aiAnalysis && article.aiAnalysis.length > 100 && article.locale === 'es') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 100 && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // Verify the content is actually Spanish (not Arabic contamination)
          const spanishLetterRatio = (parsed.fullContent.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ¿¡]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (spanishLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must re-analyze
          console.warn(`[EsAnalyzer] Article ${articleId} has Arabic-contaminated aiAnalysis (ES ratio: ${spanishLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — re-analyzing`);
        }
      } catch { /* re-analyze */ }
    }

    // Prepare context
    const title = article.title || '';
    const summary = article.summary || '';
    const content = article.content || '';
    const category = article.category || 'Economía';

    const analysisPrompt = `Eres un analista financiero profesional y un sistema de análisis de noticias financieras. Procesa este artículo a través de 4 puertas obligatorias en orden, luego da el resultado en JSON únicamente — TODO EN ESPAÑOL.

═══ Puerta 0 — Extracción de datos brutos ═══
A partir del texto original, extraer:
- Nombre de la empresa / entidad
- Símbolo bursátil si se encuentra (ej.: AAPL, CL, BZ, IBIT, COIN)
- Bolsa / mercado de negociación (ej.: NYMEX, COMEX, NYSE, NASDAQ)
- Números y porcentajes explícitamente mencionados
- Fuente original
Si no se encuentra un símbolo claro ← anotar: "Ningún activo cotizado confirmado"

═══ Puerta 1 — Clasificación del tema y determinación del recorrido ═══
Determinar primero el público objetivo:
- Orientado al consumidor (puntuación crediticia, presupuesto, préstamos personales) ? Sector = "Finanzas Personales" + Recorrido [B]
- Orientado a trader/inversor → continuar con la clasificación natural

[A] Noticias financieras negociables: Empresa cotizada + símbolo + evento impactante | Contratos de futuros + símbolo | ETFs negociables | Fondos Bitcoin (IBIT, FBTC, ARKB...) | Pares Forex | Criptomonedas | Empresas crypto (COIN, MSTR) | Índices | Noticias comerciales/arancelarias
→ Artículo completo + análisis completo + escenarios de trading

[B] Macro economía / social / finanzas personales: Fenómenos macro sin activo negociable específico | Contenido educativo para el público general
→ Artículo completo + contexto económico únicamente — SIN escenarios de trading
  ⚠️ Las noticias macroeconómicas (desempleo, IPC, NFP, PIB, tasas de la Fed) afectan directamente:
    • Dólar estadounidense (DXY) y pares (EUR/USD, USD/JPY, GBP/USD)
    • Bonos del Tesoro (TNX, TLT)
    • Oro (XAUUSD, GLD)
    • Índices principales (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Operaciones / empresas privadas / información limitada
→ Artículo completo + análisis breve + clasificación de baja confianza

═══ Puerta 2 — Calidad del artículo en español ═══
Asegurarse de que el contenido del artículo sea:
- Español financiero profesional
- Las cifras corresponden exactamente a la fuente original
- Sin información fabricada
- Estructura de párrafo apropiada
- Sin repetición entre las secciones

═══ Puerta 3 — Análisis financiero en 5 secciones ═══

Para el Recorrido [C] únicamente (2 secciones):
[1] Qué sucedió — dos frases únicamente
[5] Para los traders: "Información limitada — datos insuficientes para un análisis fiable"

Para los Recorridos [A] y [B] (5 secciones):

[1] Qué sucedió — 4-5 frases únicamente. Incluir quién dijo qué (nombre completo + cargo + organización) + dónde y cuándo.

[2] Por qué es importante — 3-5 frases con cifras reales:
  ⚠️ Añadir los precios actuales de los activos mencionados
  ⚠️ Añadir las capitalizaciones bursátiles o volúmenes si se mencionan
  ⚠️ Las noticias macro afectan: USD/DXY, Bonos, Oro, Índices

[3] Activos afectados — lista densa de activos reales negociables:
  a. Directamente afectados: Nombre + Símbolo + Bolsa + Dirección + Razón
  b. Efectos en cascada: Empresas/fondos/sectores específicos

[4] A vigilar — 3 eventos o indicadores próximos específicos:
  ⚠️ ¡Ser específico! No "monitorear los desarrollos"

[5] Para los traders — recomendación:
  Recorrido [A]: Específica con entrada + stop loss + objetivo (si los datos lo permiten)
  Recorrido [B]: "Esperar a que las tendencias macro se aclaren"
  Recorrido [C]: "Información limitada — datos insuficientes"

═══ Puerta 4 — Verificación final ═══
□ ¿Las cifras corresponden al original?
□ ¿Sin información fabricada?
□ ¿Sin repetición?
□ ¿Alineación sentimiento-recomendación?
□ ¿Clasificación de recorrido apropiada?

═══ Datos del artículo ═══
Título: ${title}
Resumen: ${summary.slice(0, 500)}
${content ? `Contenido: ${content.slice(0, 4000)}` : ''}
Categoría: ${category}

══️ Salida JSON requerida ═══
{
  "rawData": {"entityNameEs": "Nombre de la entidad", "ticker": "Símbolo o ninguno", "exchange": "Bolsa", "figures": ["Cifras"], "source": "Fuente"},
  "path": "A o B o C",
  "sector": "Sector en español",
  "sentimentReason": "Justificación del sentimiento",
  "editedArticle": "Texto del artículo editado — CONTENIDO REAL, no marcadores de posición",
  "fullContent": "[1] Qué sucedió\\nLas acciones de Advanced Micro Devices (AMD) cayeron 2,06% a 521,58 dólares el martes después de que la empresa anunciara la adquisición de MEXT, una startup de optimización de memoria.\\n\\n[2] Por qué es importante\\nEsta adquisición señala el impulso de AMD en la optimización de memoria, un frente competitivo contra NVIDIA.\\n\\n[3] Activos afectados\\n- AMD (NASDAQ: AMD) — impacto directo, bajista a corto plazo\\n\\n[4] A vigilar\\nEl calendario de integración y cualquier revisión de la guía por parte de la dirección de AMD.\\n\\n[5] Para los traders\\nMantener posición corta cerca de 520 dólares con stop-loss en 540, objetivo 480.",
  "introduction": "2-3 frases de introducción — CONTENIDO REAL",
  "body": "Análisis de 3-5 párrafos — CONTENIDO REAL",
  "conclusion": "Conclusión de inversión de 2-3 frases — CONTENIDO REAL",
  "summary": "Resumen del evento en dos frases — CONTENIDO REAL",
  "sentiment": "positive o negative o neutral",
  "impactLevel": "high o medium o low",
  "keyTakeaways": ["Punto 1 — CONTENIDO REAL", "Punto 2 — CONTENIDO REAL", "Punto 3 — CONTENIDO REAL"],
  "affectedAssets": [
    {"symbol": "Símbolo", "name": "Nombre con símbolo", "direction": "up o down o neutral", "impactDegree": "high o medium o low", "reason": "Razón", "isTradable": true}
  ],
  "recommendation": "Recomendación de inversión clara y específica — CONTENIDO REAL",
  "confidence": "X/10 — justificación"
}

⚠️ CRÍTICO: Reemplace TODOS los marcadores de posición "..." con CONTENIDO REAL basado en los datos del artículo.
El ejemplo anterior muestra contenido real, no stubs de plantilla.
Producir "[1] Qué sucedió\\n..." con "..." literal está PROHIBIDO —
cada sección DEBE contener texto de análisis real basado en el artículo.
Si no puede llenar una sección con información real, escriba "Datos insuficientes para esta sección" en lugar de "...".

Reglas:
- Solo español — español financiero profesional
- NO rellenar las secciones sin información real
- La recomendación está alineada con el sentimiento
- fullContent usa [1]-[5] para el Recorrido [A]/[B], únicamente [1]+[5] para el Recorrido [C]
- path debe ser "A", "B", o "C" únicamente
- Sin repetición entre las secciones
- keyTakeaways aportan información nueva — no reformulación`;

    const aiResult = await Promise.race([
      chatCompletion([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: title || summary || 'Artículo de noticias financieras' },
      ], { temperature: 0.3, maxTokens: 10000, priority: 'generation', locale: 'es' }),  // Spanish pipeline — locale-first + fallback
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Spanish analysis timeout')), 120000)
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

    for (const phrase of FORBIDDEN_PHRASES_ES) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      fullContent = fullContent.replace(re, '');
      recommendation = recommendation.replace(re, '');
    }

    // Deduplicate
    fullContent = fixArabicNumbers(deduplicateSpanishText(fullContent));

    // V1045: Reject template-placeholder fullContent
    const PLACEHOLDER_PATTERNS = [
      /\[\d+\][^\n]*\n\s*\.\.\./,
      /\[\d+\][^\n]*\n\s*\.\.\.\s*\n\s*\[\d+\]/,
      /^[^[]{0,30}\[\d+\][^[]{0,30}\n\.\.\.\n/gm,
    ];
    const hasPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(fullContent));
    if (hasPlaceholder || fullContent.length < 200) {
      console.warn(`[EsAnalyzer V1045] Article ${articleId} has template-placeholder or too-short fullContent (len=${fullContent.length}) — rejecting`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `V1045: fullContent es plantilla o demasiado corto (${fullContent.length} caracteres)`);
      result.error = 'Template placeholder fullContent';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Validate sentiment-recommendation alignment
    recommendation = fixArabicNumbers(validateSentimentRecommendationEs(parsed.sentiment || 'neutral', recommendation));

    // Speculation check
    const specReport = detectSpeculationEs(fullContent);
    if (specReport.shouldNotPublish) {
      console.warn(`[EsAnalyzer] Article ${articleId} blocked by speculation gate: ${specReport.reason}`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `Speculation gate: ${specReport.reason}`);
      result.error = specReport.reason;
      result.duration = Date.now() - startTime;
      return result;
    }

    // ── Filter vague assets ──
    let affectedAssets = parsed.affectedAssets || [];
    if (Array.isArray(affectedAssets)) {
      affectedAssets = affectedAssets.filter((asset: any) => {
        const name = asset.name || asset.symbol || '';
        return !VAGUE_ASSET_PATTERNS_ES.some(pattern => pattern.test(name));
      });
    }

    // ── Verify asset-content relevance ──
    // Remove assets that are NOT mentioned in the article content.
    // This prevents mis-tagging (e.g., an article about TXN tagged with XAUUSD).
    if (Array.isArray(affectedAssets) && affectedAssets.length > 0) {
      const articleText = `${title} ${summary} ${fullContent} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
      const COMMODITY_KEYWORDS: Record<string, string[]> = {
        XAUUSD: ['gold', 'xau', 'oro', 'metal precioso', 'refugio seguro'],
        XAGUSD: ['silver', 'xag', 'plata', 'metal precioso'],
        CL: ['oil', 'crude', 'wti', 'petróleo', 'brent', 'opec'],
        BZ: ['brent', 'oil', 'petróleo', 'crude'],
        BTCUSD: ['bitcoin', 'btc', 'cryptocurrency', 'crypto', 'criptomoneda'],
        ETHUSD: ['ethereum', 'eth', 'cryptocurrency', 'crypto', 'criptomoneda'],
        EURUSD: ['euro', 'eur/usd', 'eurusd'],
        GBPUSD: ['pound', 'sterling', 'libra', 'gbp/usd'],
        USDJPY: ['yen', 'jpy', 'usd/jpy'],
      };
      affectedAssets = affectedAssets.filter((asset: any) => {
        const sym = (asset.symbol || '').toUpperCase();
        const assetName = (asset.name || '').toLowerCase();
        if (/^[A-Z]{1,5}$/.test(sym) && sym.length <= 5 && !COMMODITY_KEYWORDS[sym]) {
          const tickerMatch = articleText.includes(sym.toLowerCase());
          const nameMatch = assetName && articleText.includes(assetName.toLowerCase());
          if (!tickerMatch && !nameMatch) {
            console.warn(`[EsAnalyzer] Removing unrelated asset ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        const keywords = COMMODITY_KEYWORDS[sym];
        if (keywords) {
          const hasKeyword = keywords.some(kw => articleText.includes(kw.toLowerCase()));
          if (!hasKeyword && !articleText.includes(sym.toLowerCase())) {
            console.warn(`[EsAnalyzer] Removing unrelated commodity ${sym} from article ${articleId} — not found in content`);
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
      locale: 'es',
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
      locale: 'es',
    };

    if (parsed.sentiment) updateData.sentiment = parsed.sentiment;
    if (parsed.impactLevel) updateData.impactLevel = parsed.impactLevel;
    if (parsed.sector) {
      const categoryMap: Record<string, string> = ES_PIPELINE_CONFIG.CATEGORY_MAP_ES;
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
    console.log(`[EsAnalyzer] ✓ Analyzed ${articleId} in ${result.duration}ms — path: ${parsed.path}, sentiment: ${parsed.sentiment}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[EsAnalyzer] Fatal error for ${articleId}:`, err.message);
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
