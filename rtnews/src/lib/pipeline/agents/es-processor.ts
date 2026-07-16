// ═══════════════════════════════════════════════════════════════
// Spanish Unified Processor Agent
// Processes Spanish news articles DIRECTLY in Spanish — no translation step.
// Modeled after en-processor.ts with Spanish-specific prompts and validation.
//
// Key features:
// - No translation step (content is already in Spanish)
// - Spanish prompts for AI analysis
// - Output fields: title, summary, content in Spanish
// - Sets locale: 'es' and categoryId fields
// - Spanish-specific quality validation
// - LTR layout direction
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { ES_PIPELINE_CONFIG } from '../es-pipeline-config';
import { ProcessingStage } from '../queue/job-types';

export interface EsUnifiedResult {
  articleId: string;
  success: boolean;
  duration: number;
  fields: string[];
  error?: string;
}

// ── JSON parsing utility ──
function parseAIJson(text: string): Record<string, any> | null {
  if (!text) return null;
  try { return JSON.parse(text.trim()); } catch {}
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch {}
    let jsonStr = text.slice(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(jsonStr); } catch {}
  }
  if (firstBrace !== -1) {
    let truncatedJson = text.slice(firstBrace);
    truncatedJson = truncatedJson.replace(/"[^"\\]*$/, '');
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
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
    try { return JSON.parse(truncatedJson); } catch {}
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

// ── Spanish deduplication ──
function deduplicateSpanishContent(text: string): string {
  if (!text || text.length < 50) return text;
  const rawParts = text.split(/[.!?]+/);
  const seen = new Map<string, string>();
  const result: string[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 15) { result.push(trimmed); continue; }
    const normalized = trimmed.replace(/\s+/g, ' ').trim();
    let isDuplicate = false;
    for (const [existingNorm] of seen) {
      if (Math.abs(existingNorm.length - normalized.length) > normalized.length * 0.4) continue;
      const words1 = new Set(normalized.split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      if (union > 0 && intersection / union > 0.75) { isDuplicate = true; break; }
    }
    if (!isDuplicate) { seen.set(normalized, trimmed); result.push(trimmed); }
  }
  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── Spanish content quality validation ──
function isValidSpanishText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  // Check for reasonable Spanish character ratio (Latin + Spanish chars)
  const latinChars = (text.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ¿¡]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  const spanishRatio = latinChars / totalAlpha;
  return spanishRatio >= (ES_PIPELINE_CONFIG.MIN_SPANISH_RATIO || 0.5);
}

// ── Category ID mapping ──
function mapCategoryToId(category: string): string {
  const categoryMap: Record<string, string> = {
    'economy': 'economy', 'economía': 'economy',
    'stocks': 'stocks', 'acciones': 'stocks', 'renta variable': 'stocks',
    'forex': 'forex', 'divisas': 'forex',
    'crypto': 'crypto', 'criptomonedas': 'crypto',
    'energy': 'energy', 'energía': 'energy',
    'commodities': 'commodities', 'materias primas': 'commodities',
    'real estate': 'realEstate', 'inmobiliario': 'realEstate',
    'banking': 'banking', 'banca': 'banking',
    'earnings': 'earnings', 'resultados': 'earnings',
    'arab markets': 'arabMarkets', 'mercados árabes': 'arabMarkets',
    'technology': 'technology', 'tecnología': 'technology',
    'politics': 'politics', 'política': 'politics',
    'breaking': 'breaking', 'urgente': 'breaking',
    'bonds': 'bonds', 'renta fija': 'bonds',
    'technicalAnalysis': 'technicalAnalysis', 'análisis técnico': 'technicalAnalysis',
    'strategic': 'strategic', 'estratégico': 'strategic',
  };
  return categoryMap[category?.toLowerCase()] || 'economy';
}

export async function processArticleEs(articleId: string): Promise<EsUnifiedResult> {
  const startTime = Date.now();
  const result: EsUnifiedResult = { articleId, success: false, duration: 0, fields: [] };

  try {
    const article = await db.newsItem.findUnique({ where: { id: articleId } });
    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already fully processed with quality Spanish data
    if (article.aiAnalysis && article.title && article.content && article.locale === 'es') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          const spanishLetterRatio = (parsed.fullContent.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (spanishLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            await db.newsItem.update({ where: { id: articleId }, data: { processingStage: 'analyzed' } });
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
        }
      } catch {}
    }

    // Prepare context
    const titleEs = article.title || '';
    const summaryEs = article.summary || '';
    const contentEs = article.content || '';
    const category = article.category || 'Economía';

    // ── SINGLE API CALL: Spanish unified processing ──
    const unifiedPrompt = `Eres un sistema integral de procesamiento de noticias financieras para una plataforma de noticias financieras en español. Tu tarea es procesar este artículo de noticias a través de 4 puertas obligatorias en una sola solicitud, produciendo el título, resumen, contenido y análisis financiero completo — TODO EN ESPAÑOL.

═══ Puerta 0 — Extracción de datos brutos ═══
Del texto original en español, extraer:
- Nombre de empresa / entidad
- Símbolo bursátil si se encuentra
- Bolsa / mercado de valores
- Números y porcentajes explícitamente mencionados
- Fuente original

═══ Puerta 1 — Clasificación del tema y determinación de ruta ═══
[A] Noticias financieras negociables: Empresa cotizada + ticker + evento impactante | Futuros + símbolo | ETFs negociables | Fondos Bitcoin | Pares Forex | Criptomonedas | Índices | Noticias comerciales/arancelarias
→ Artículo completo + análisis completo + escenarios de trading

[B] Economía macro / social / finanzas personales: Fenómenos macro sin activo negociable específico | Contenido educativo
→ Artículo completo + contexto económico — SIN escenarios de trading

[C] Ofertas / empresas privadas / información escasa
→ Artículo completo + análisis breve + clasificación de baja confianza

═══ Puerta 2 — Escribir el artículo en español ═══
Escribir un artículo profesional de noticias financieras en español:

⚠️ REGLA CRÍTICA DE NÚMEROS — ¡Los números son sagrados! ⚠️
Cada número del texto original debe aparecer exactamente en la salida en español.

Reglas de escritura:
1. Título en español: Estilo periodístico financiero profesional.
2. Resumen en español: Conciso y profesional.
3. Contenido en español: Artículo profesional con párrafos proporcionales al material fuente:
   - Solo título → 1-2 párrafos
   - Título + resumen → 2-3 párrafos
   - Contenido detallado → hasta 4 párrafos
   ⚠️ NO inventar eventos, razones o reacciones no mencionadas en la fuente!

═══ Puerta 3 — Análisis (estructura de 5 secciones) ═══

Para la Ruta [C] — estructura breve (solo 2 secciones):
[1] Qué pasó — solo dos oraciones
[5] Para traders: "Información escasa — datos insuficientes para análisis fiable"

Para las Rutas [A] y [B] — estructura completa (5 secciones):
[1] Qué pasó — 4-5 oraciones
[2] Por qué importa — 3-5 oraciones con números reales
[3] Activos afectados — lista densa de activos negociables reales
[4] Qué observar — 1-3 eventos próximos específicos
[5] Para traders — recomendación proporcional a la importancia

═══ Puerta 4 — Verificación final ═══
□ ¿Todos los números del texto original aparecen con el mismo valor?
□ ¿No hay información fabricada?
□ ¿La recomendación no contradice el sentimiento?
□ ¿El tamaño del análisis es proporcional al tamaño de la noticia?

═══ Datos del artículo ═══
Título en español: ${titleEs}
Resumen en español: ${summaryEs.slice(0, 500)}
${contentEs ? `Contenido original: ${contentEs.slice(0, 4000)}` : ''}
Categoría actual: ${category}

═══ Formato de salida JSON requerido ═══
Devuelve el resultado SOLO en formato JSON:
{
  "titleEs": "El título procesado en español — periodismo financiero profesional",
  "summaryEs": "El resumen en español — conciso y profesional",
  "contentEs": "El artículo de noticias en español — párrafos separados por saltos de línea",
  "rawData": {"entityNameEs": "Nombre de entidad", "ticker": "Símbolo o ninguno", "exchange": "Bolsa", "figures": ["Números del texto"], "source": "Fuente"},
  "path": "A o B o C",
  "sector": "El sector correcto en español",
  "sentimentReason": "Justificación de la clasificación de sentimiento",
  "editedArticle": "El artículo editado",
  "fullContent": "[1] Qué pasó\\n4-5 oraciones\\n\\n[2] Por qué importa\\n3-5 oraciones con números\\n\\n[3] Activos afectados\\na. Directos + b. Cascada\\n\\n[4] Qué observar\\n1-3 eventos próximos\\n\\n[5] Para traders\\nRecomendación",
  "introduction": "2-3 oraciones introductorias",
  "body": "Análisis de 3-5 párrafos",
  "conclusion": "Conclusión de inversión de 2-3 oraciones",
  "summary": "Resumen del evento en dos oraciones",
  "sentiment": "positive o negative o neutral",
  "impactLevel": "high o medium o low",
  "keyTakeaways": ["Punto 1", "Punto 2", "Punto 3"],
  "affectedAssets": [
    {"symbol": "Símbolo", "name": "Nombre del activo", "direction": "up o down o neutral", "impactDegree": "high o medium o low", "reason": "Razón del impacto", "isTradable": true}
  ],
  "recommendation": "Recomendación de inversión específica",
  "confidence": "X/10 — justificación"
}

Reglas estrictas:
- Responder SOLO en español — español financiero profesional
- NO llenar una sección si no tienes información real
- La recomendación siempre debe alinearse con la clasificación
- fullContent debe comenzar con [1] y terminar con [5] para Rutas [A] y [B], y contener solo [1] + [5] para Ruta [C]
- path debe ser "A" o "B" o "C" solamente
- NO olvidar titleEs, summaryEs, y contentEs — ¡son campos obligatorios!`;

    const aiResult = await Promise.race([
      chatCompletion([
        { role: 'system', content: unifiedPrompt },
        { role: 'user', content: titleEs || summaryEs || 'Artículo de noticias financieras' },
      ], { temperature: 0.3, maxTokens: 12000, priority: 'generation', locale: 'es' }),  // V386: Use locale: 'es' for OpenRouter → Mistral → Bedrock cascade
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Spanish unified processing timeout')), 180000)
      ),
    ]);

    if (!aiResult.content) {
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EsProcessor] AI response: ${aiResult.provider}/${aiResult.model} in ${aiResult.duration}ms, ${aiResult.content.length} chars`);

    let parsed = parseAIJson(aiResult.content);
    if (!parsed) {
      result.error = 'Failed to parse AI JSON response';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Handle AI rejection — retry once
    if (parsed.status === 'REJECTED') {
      const reason = parsed.reason || 'Non-financial article';
      console.log(`[EsProcessor] AI tried to REJECT ${articleId}: "${reason}" — retrying once`);

      const noRejectPrompt = `Eres un procesador de noticias financieras para una plataforma en español. ❌ NO rechaces este artículo ❌

Este artículo ya ha sido pre-filtrado. DEBES procesarlo.
Clasifícalo como Ruta [C] si no encuentras datos suficientes, pero ❌ NO emitas status: "REJECTED" ❌

Devuelve el resultado SOLO en JSON:
{
  "titleEs": "Título en español",
  "summaryEs": "Resumen en español",
  "contentEs": "Artículo profesional en español — al menos 200 caracteres",
  "rawData": {"entityNameEs": "Nombre", "ticker": "Símbolo o ninguno", "exchange": "Bolsa", "figures": ["Números"], "source": "Fuente"},
  "path": "C",
  "sector": "Sector",
  "sentimentReason": "Razón del sentimiento",
  "editedArticle": "Artículo editado",
  "fullContent": "[1] Qué pasó\\nDos oraciones\\n\\n[5] Para traders\\nInformación escasa",
  "introduction": "Introducción",
  "body": "Análisis",
  "conclusion": "Conclusión",
  "summary": "Resumen",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Punto del texto"],
  "affectedAssets": [],
  "recommendation": "Información escasa — datos insuficientes",
  "confidence": "3/10"
}

Título: ${titleEs}
Resumen: ${summaryEs.slice(0, 500)}
${contentEs ? `Contenido: ${contentEs.slice(0, 3000)}` : ''}`;

      try {
        const retryResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: noRejectPrompt },
            { role: 'user', content: titleEs || summaryEs || 'Noticias financieras' },
          ], { temperature: 0.3, maxTokens: 4000, priority: 'generation', locale: 'es' }),  // V386: Use locale: 'es' for OpenRouter → Mistral → Bedrock cascade
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('EsProcessor no-reject retry timeout')), 60000)
          ),
        ]);
        const retryParsed = parseAIJson(retryResult.content);
        if (retryParsed && !retryParsed.status && retryParsed.titleEs && retryParsed.contentEs
            && isValidSpanishText(retryParsed.titleEs)
            && isValidSpanishText(retryParsed.contentEs, 80)) {
          console.log(`[EsProcessor] No-reject retry SUCCEEDED for ${articleId}`);
          parsed = { ...parsed, ...retryParsed };
          if (!parsed.path) parsed.path = 'C';
          if (!parsed.sector) parsed.sector = category || 'Economía';
        } else {
          const currentRejectCount = (article.rejectCount || 0) + 1;
          await db.newsItem.update({
            where: { id: articleId },
            data: { processingStage: 'skipped', rejectCount: currentRejectCount, lastError: `SKIPPED: AI rejected + retry produced no valid content. Reason: ${reason}` },
          });
          result.success = true;
          result.fields = ['skipped'];
          result.duration = Date.now() - startTime;
          return result;
        }
      } catch (retryErr: any) {
        const currentRejectCount = (article.rejectCount || 0) + 1;
        await db.newsItem.update({
          where: { id: articleId },
          data: { processingStage: 'skipped', rejectCount: currentRejectCount, lastError: `SKIPPED: AI rejected + retry failed (${retryErr.message})` },
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

    // 1. title
    if (parsed.titleEs && typeof parsed.titleEs === 'string' && isValidSpanishText(parsed.titleEs, ES_PIPELINE_CONFIG.MIN_ES_TITLE_LENGTH)) {
      updateData.title = parsed.titleEs.trim();
      fields.push('title');
    }

    // 2. summary
    if (parsed.summaryEs && typeof parsed.summaryEs === 'string' && isValidSpanishText(parsed.summaryEs, ES_PIPELINE_CONFIG.MIN_ES_SUMMARY_LENGTH)) {
      updateData.summary = parsed.summaryEs.trim();
      fields.push('summary');
    }

    // 3. content
    const effectiveMinContentLength = parsed.path === 'C' ? 80 : ES_PIPELINE_CONFIG.MIN_ES_CONTENT_LENGTH;
    if (parsed.contentEs && typeof parsed.contentEs === 'string' && parsed.contentEs.length >= effectiveMinContentLength && isValidSpanishText(parsed.contentEs, effectiveMinContentLength)) {
      let contentEs = parsed.contentEs.trim();
      contentEs = stripMarkdown(contentEs);
      contentEs = deduplicateSpanishContent(contentEs);
      if (contentEs.length >= effectiveMinContentLength) {
        updateData.content = contentEs;
        fields.push('content');
      }
    }

    // 4. slug
    if (!article.slug || article.slug.startsWith('es-')) {
      updateData.slug = generateSlug(updateData.title || titleEs);
      fields.push('slug');
    }

    // 5. locale
    updateData.locale = 'es';
    fields.push('locale');

    // 6. categoryId
    const categoryId = mapCategoryToId(parsed.sector || category);
    updateData.categoryId = categoryId;
    fields.push('categoryId');

    // 7. Update category
    if (parsed.sector && typeof parsed.sector === 'string') {
      updateData.category = ES_PIPELINE_CONFIG.CATEGORY_MAP_ES[categoryId] || parsed.sector;
      fields.push('category');
    }

    // 8. aiAnalysis
    if (parsed.path && parsed.fullContent) {
      let fullContent = parsed.fullContent || '';
      let editedArticle = parsed.editedArticle || '';
      let recommendation = parsed.recommendation || '';
      let introduction = parsed.introduction || '';
      let body = parsed.body || '';
      let conclusion = parsed.conclusion || '';

      // Remove Spanish forbidden phrases
      const FORBIDDEN_ES = [
        'los inversores deben', 'cabe señalar que',
        'es importante destacar', 'vale la pena señalar',
        'no hace falta decir', 'sobre vigilar los desarrollos',
        'ejercer precaución', 'permanecer cauteloso',
        'estén atentos', 'mantengan un ojo en',
        'está por verse', 'veremos',
      ];
      for (const phrase of FORBIDDEN_ES) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'gi');
        fullContent = fullContent.replace(re, '');
        editedArticle = editedArticle.replace(re, '');
        recommendation = recommendation.replace(re, '');
        introduction = introduction.replace(re, '');
        body = body.replace(re, '');
        conclusion = conclusion.replace(re, '');
      }

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
        locale: 'es',
        rawData: parsed.rawData || {},
      };

      updateData.aiAnalysis = JSON.stringify(aiAnalysis);
      fields.push('aiAnalysis');

      if (parsed.sentiment) { updateData.sentiment = parsed.sentiment; fields.push('sentiment'); }
      if (parsed.impactLevel) { updateData.impactLevel = parsed.impactLevel; fields.push('impactLevel'); }
      if (parsed.confidence) {
        const confMatch = String(parsed.confidence).match(/(\d+)\s*\/\s*10/);
        if (confMatch) { updateData.impactScore = parseInt(confMatch[1], 10) * 10; fields.push('impactScore'); }
      }
      if (parsed.sentiment) {
        const baseScore = parsed.sentiment === 'positive' ? 70 : parsed.sentiment === 'negative' ? 30 : 50;
        const impactMod = parsed.impactLevel === 'high' ? 15 : parsed.impactLevel === 'medium' ? 5 : 0;
        updateData.sentimentScore = parsed.sentiment === 'negative' ? baseScore - impactMod : baseScore + impactMod;
        fields.push('sentimentScore');
      }
      // Set affectedAssets — with content relevance verification
      if (parsed.affectedAssets && Array.isArray(parsed.affectedAssets)) {
        const articleTextForVerify = `${titleEs || ''} ${summaryEs || ''} ${parsed.fullContent || ''} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
        const COMMODITY_KW: Record<string, string[]> = {
          XAUUSD: ['gold', 'xau', 'oro', 'metal precioso'], XAGUSD: ['silver', 'xag', 'plata'],
          CL: ['oil', 'crude', 'wti', 'petróleo', 'brent', 'opec'], BZ: ['brent', 'oil', 'petróleo'],
          BTCUSD: ['bitcoin', 'btc', 'crypto', 'criptomoneda'], ETHUSD: ['ethereum', 'eth', 'crypto'],
          EURUSD: ['euro', 'eur/usd', 'eurusd'], GBPUSD: ['pound', 'sterling', 'libra'],
          USDJPY: ['yen', 'jpy', 'usd/jpy'],
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
      await db.newsItem.update({ where: { id: articleId }, data: updateData });
    }

    // ── Advance processing stage to analyzed ──
    await db.newsItem.update({ where: { id: articleId }, data: { processingStage: 'analyzed' } });
    console.log(`[EsProcessor] Article ${articleId}: ${article.processingStage} → analyzed`);

    result.success = true;
    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[EsProcessor] ✓ Processed ${articleId} in ${result.duration}ms — fields: ${fields.join(', ')}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[EsProcessor] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}
