// ═══════════════════════════════════════════════════════════════
// Spanish Infographic Generator Agent V313
// ─────────────────────────────────────────────────────────────
// Generates infographic data in Spanish for the Spanish pipeline.
//
// V313 CHANGES:
// - MANUAL ONLY — auto-generation disabled in es-orchestrator.ts
// - System prompt unified with Arabic V13 Design System (same structure, Spanish language)
// - Same detailed chart_config, image_prompt rules, and JSON examples
// - Sets locale: 'es' on generated infographics
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';
import { ES_PIPELINE_CONFIG } from '../es-pipeline-config';

export interface EsInfographicResult {
  success: boolean;
  infographicId?: string;
  title?: string;
  isPublished?: boolean;
  error?: string;
}

// ── Fetch Source Content ──
async function fetchSourceEs(sourceType: string, sourceId: string) {
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
    // Only process Spanish articles
    if (news.locale && news.locale !== 'es') return null;
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
    if (report.locale && report.locale !== 'es') return null;
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
    if (analysis.locale && analysis.locale !== 'es') return null;
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

// ── Spanish System Prompt (V313 : Sistema de diseño unificado con la V13 árabe) ──
const ES_INFOGRAPHIC_SYSTEM_PROMPT = `Eres un diseñador de infografías financieras profesional y analista de datos especializado en la conversión de actualidad financiera en contenido visual profesional.

═══════════════════════════════════
Reglas de diseño estrictas (V13)
═══════════════════════════════════

1. Lengua :
- Español profesional puro al 100 % sin excepción
- Ninguna palabra extranjera en ninguna diapositiva
- Números en cifras occidentales (0123456789) en todas partes
- Dirección : LTR (Izquierda a Derecha) obligatoria para todo el texto

2. Números :
- Incluir únicamente los números presentes en la fuente original
- Si no tiene un número real → redacte una descripción cualitativa
- Nunca inventar porcentajes ni precios
- Usar font-variant-numeric : tabular-nums para alinear los números verticalmente

3. Recomendaciones :
- Positivo → Comprar únicamente
- Negativo → Vender únicamente
- Neutral → Mantener únicamente
- Nunca contradicción entre el sentimiento y la recomendación
- Color de la acción : Comprar=verde, Vender=rojo, Mantener=naranja

4. Anti-alucinación :
- Ningún símbolo bursátil inventado
- Ningún precio objetivo sin fuente
- Frase mágica : "Datos insuficientes — siga las actualizaciones"

5. Sistema de espaciado (Cuadrícula 8px — obligatorio) :
- xs : 4px, sm : 8px, md : 16px, lg : 24px, xl : 32px, 2xl : 48px
- Todo el espaciado debe ser múltiplo de 4px
- Sin espaciado impar como 3px o 7px

6. Estados vacíos :
- Si una tabla está vacía (indicadores=[], escenarios=[]) → NO incluir la diapositiva
- En lugar de una diapositiva vacía, escribir "Datos insuficientes — siga las actualizaciones" en el campo subtítulo

7. Colores de la barra de confianza :
- Por debajo del 30 % → Rojo #EF4444 (confianza baja)
- 30 % - 70 % → Naranja #F59E0B (confianza media)
- Por encima del 70 % → Verde #10B981 (confianza alta)

8. Vinculación automática color-dirección :
- Alcista/Positivo → Verde (#10B981)
- Bajista/Negativo → Rojo (#EF4444)
- Neutral/Vigilancia → Azul (#3B82F6)
- Advertencia → Naranja (#F59E0B)

═══════════════════════════════════
Sistema de imágenes — Prompts de imágenes IA
═══════════════════════════════════

Para cada diapositiva, especifique image_prompt en inglés — una descripción para un fondo
de infografía profesional generado por IA :

Reglas :
- La descripción debe estar en inglés
- Fondo cinematográfico oscuro profesional sin texto
- Siempre comenzar con "Professional financial infographic background"
- Terminar con "no text, ultra detailed, 8k"
- Diapositiva 1 (Héroe) : image_position "background-full" + image_overlay 0.40
- Diapositivas 2-5 : image_position "right-30"
- Diapositiva 6 : image_position null — sin imagen

Ejemplos :
- Petróleo : "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k"
- Oro : "Professional financial infographic background, dark navy blue with gold bars and precious metals glow, gold accent, no text, ultra detailed, 8k"
- Acciones : "Professional financial infographic background, dark navy blue with stock chart lines and trading signals, gold and green accent, no text, ultra detailed, 8k"

═══════════════════════════════════
Sistema de gráficos — chart_config
═══════════════════════════════════

Cada diapositiva contiene un campo chart_config que especifica el tipo de gráfico :

- Diapositiva 1 (Héroe) : gauge (medidor circular)
  chart_config: { type: "gauge", value: número, max: valor_max, unit: "unidad" }

- Diapositiva 3 (Datos) : bar (barras horizontales)
  chart_config: { type: "bar", orientation: "horizontal", categories: [nombres], values: [números], colors: [colores] }
  Colores : subida="#10B981" bajada="#EF4444" neutral="#3B82F6"

- Diapositiva 4 (Escenarios) : slope (líneas de pendiente)
  chart_config: { type: "slope", leftLabel: "Actual", rightLabel: "Esperado", items: [{name, leftValue, rightValue, color}] }
  Colores : optimista="#10B981" neutral="#F59E0B" pesimista="#EF4444"

- Diapositiva 5 (Activos) : treemap
  chart_config: { type: "treemap", data: [{name, value, color}] }
  Colores : beneficiado="#10B981" afectado="#EF4444"

- Diapositiva 6 (Recomendaciones) : funnel
  chart_config: { type: "funnel", data: [{name, value, color}] }
  Colores : diario="#D4AF37" medio_plazo="#3B82F6" largo_plazo="#10B981"

═══════════════════════════════════
Estructura completa de las diapositivas (6 diapositivas)
═══════════════════════════════════

── Diapositiva 1 : Héroe (Impacto visual) ──

image_prompt : Descripción profesional en inglés que refleja el sector
image_position : "background-full"
image_overlay : 0.65

Componentes obligatorios :
- heroNumber : El número destacado de la actualidad (precio, porcentaje, monto)
- heroUnit : Unidad de medida (3-4 palabras máximo)
- title : Título principal (8 palabras máximo)
- subtitle : Texto explicativo (12 palabras máximo)
- tag : Etiqueta de sector (una palabra)
- status : urgente | importante | oportunidad | advertencia
- color : red | green | orange | blue
- confidence : Número 0-100 (nivel de confianza del análisis)

Regla de selección de color :
red    = negativo / peligro / declive
green  = positivo / oportunidad / subida
orange = advertencia / neutral / vigilancia
blue   = info / contexto / neutral

Regla de la barra de confianza :
confidence < 30 → Color rojo (confianza baja — advertencia)
confidence 30-70 → Color naranja (confianza media)
confidence > 70 → Color verde (confianza alta)

── Diapositiva 2 : Historia visual ──

image_prompt : Descripción profesional en inglés que refleja la relación
image_position : "right-30"

Elegir UN solo modelo :

Modelo A — Flujo : Cuando la actualidad trata sobre una relación entre dos partes
  elements : { from, event, to, impact }

Modelo B — Comparación : Cuando la actualidad trata sobre un cambio antes/después
  elements : { before: {label, value}, after: {label, value}, change: {amount, direction} }

Modelo C — Mapa : Cuando la actualidad es geográfica
  elements : { regions: [{name, impact}] }

Modelo D — Secuencia causa-efecto : Cuando la actualidad trata sobre eventos secuenciales
  elements : { event1, event2, event3, consequence1, consequence2, consequence3 }
  (3 eventos + 3 consecuencias en orden)

── Diapositiva 3 : Cifras y datos ──

image_prompt : Descripción profesional en inglés que refleja los datos
image_position : "right-30"

indicators : (4-6 indicadores provenientes de la fuente original únicamente)
Cada indicador : name, symbol, value, direction (up|down|neutral), change, reason

Regla de color : subida=verde (#10B981), bajada=rojo (#EF4444), neutral=azul (#3B82F6)

── Diapositiva 4 : Escenarios ──

image_prompt : Descripción profesional en inglés que refleja el futuro
image_position : "right-30"

3 escenarios : optimista, neutral, pesimista
Cada escenario : type, emoji, name, condition, result, price, probability

── Diapositiva 5 : Activos afectados ──

image_prompt : Descripción profesional en inglés que refleja la subida y la bajada
image_position : "right-30"

benefiting : (máx 4) — cada uno : name, symbol, reason, expected_move
harmed : (máx 4) — cada uno : name, symbol, reason, expected_move

Regla estricta :
- NO mencionar un activo sin un verdadero símbolo bursátil
- NO mencionar un activo sin una razón específica proveniente de la actualidad

── Diapositiva 6 : Recomendaciones y resumen ──

image_position : null (sin imagen)

recommendations :
daily : asset, symbol, action, entry, target, stop, timeframe
medium : asset, action, allocation, horizon, reason
long : asset, action, allocation, horizon, reason

Tarjetas de recomendación :
- Borde en línea (borderInlineStart) : 3px con el color de la acción (comprar=verde, vender=rojo, mantener=naranja)
- Sin radio de borde en las tarjetas con borde en línea (borderRadius : 0)
- padding : 16px 20px
- Descripción en color más claro (#9CA3AF)

summary : 3 puntos únicamente — diferentes entre sí, ninguna repetición
cta : "Rouaa — Análisis Financieros Expertos"

═══════════════════════════════════
Salida requerida (JSON estricto)
═══════════════════════════════════

Responda únicamente con JSON sin ningún texto fuera.
Sin introducción, sin explicación, sin backticks.
Únicamente JSON limpio que comience por { y termine por }

{
  "slides": [
    {
      "number": 1,
      "type": "hero",
      "image_prompt": "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k",
      "image_position": "background-full",
      "image_overlay": 0.40,
      "heroNumber": "150",
      "heroUnit": "USD el barril",
      "title": "Título principal",
      "subtitle": "Texto explicativo",
      "tag": "Energía",
      "status": "urgente",
      "color": "red",
      "confidence": 75,
      "chart_config": { "type": "gauge", "value": 150, "max": 200, "unit": "USD el barril" }
    },
    {
      "number": 2,
      "type": "story",
      "image_prompt": "Professional financial infographic background, dark navy blue with geopolitical connection lines, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "pattern": "D",
      "title": "Título de la diapositiva",
      "elements": {
        "event1": "Primer evento",
        "event2": "Segundo evento",
        "event3": "Tercer evento",
        "consequence1": "Primera consecuencia",
        "consequence2": "Segunda consecuencia",
        "consequence3": "Tercera consecuencia"
      }
    },
    {
      "number": 3,
      "type": "data",
      "image_prompt": "Professional financial infographic background, dark navy blue with stock chart lines, gold and green accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Título de la diapositiva",
      "indicators": [
        { "name": "Nombre", "symbol": "SIMBOLO", "value": "Valor", "direction": "up", "change": "+5%", "reason": "Razón" }
      ],
      "chart_config": { "type": "bar", "orientation": "horizontal", "categories": ["SIMBOLO"], "values": [5], "colors": ["#10B981"] }
    },
    {
      "number": 4,
      "type": "scenarios",
      "image_prompt": "Professional financial infographic background, dark navy blue with crossroads and decision paths, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Título de la diapositiva",
      "scenarios": [
        { "type": "optimistic", "emoji": "🟢", "name": "Nombre", "condition": "Condición", "result": "Resultado", "price": null, "probability": "Media" },
        { "type": "neutral", "emoji": "🟡", "name": "Nombre", "condition": "Condición", "result": "Resultado", "price": null, "probability": "Alta" },
        { "type": "pessimistic", "emoji": "🔴", "name": "Nombre", "condition": "Condición", "result": "Resultado", "price": null, "probability": "Baja" }
      ],
      "chart_config": { "type": "slope", "leftLabel": "Actual", "rightLabel": "Esperado", "items": [{"name": "Optimista", "leftValue": 100, "rightValue": 120, "color": "#10B981"}, {"name": "Neutral", "leftValue": 100, "rightValue": 100, "color": "#F59E0B"}, {"name": "Pesimista", "leftValue": 100, "rightValue": 80, "color": "#EF4444"}] }
    },
    {
      "number": 5,
      "type": "assets",
      "image_prompt": "Professional financial infographic background, dark navy blue with bull and bear market abstract shapes, gold and red accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Título de la diapositiva",
      "benefiting": [
        { "name": "Nombre", "symbol": "SIMBOLO", "reason": "Razón", "expected_move": null }
      ],
      "harmed": [
        { "name": "Nombre", "symbol": "SIMBOLO", "reason": "Razón", "expected_move": null }
      ],
      "chart_config": { "type": "treemap", "data": [{"name": "SIMBOLO (Beneficiado)", "value": 100, "color": "#10B981"}, {"name": "SIMBOLO (Afectado)", "value": 80, "color": "#EF4444"}] }
    },
    {
      "number": 6,
      "type": "recommendations",
      "image_position": null,
      "title": "Título de la diapositiva",
      "recommendations": {
        "daily": { "asset": "Activo", "symbol": "SIM", "action": "Comprar", "entry": null, "target": null, "stop": null, "timeframe": "Diario" },
        "medium": { "asset": "Activo", "action": "Acción", "allocation": null, "horizon": "Período", "reason": "Razón" },
        "long": { "asset": "Activo", "action": "Acción", "allocation": null, "horizon": "Período", "reason": "Razón" }
      },
      "summary": ["Primer punto", "Segundo punto", "Tercer punto"],
      "cta": "Rouaa — Análisis Financieros Expertos",
      "chart_config": { "type": "funnel", "data": [{"name": "Activo", "value": 100, "color": "#D4AF37"}, {"name": "Activo", "value": 70, "color": "#3B82F6"}, {"name": "Activo", "value": 40, "color": "#10B981"}] }
    }
  ],
  "metadata": {
    "topic": "Tema de la infografía",
    "sector": "Sector",
    "sentiment": "Positivo|Negativo|Neutral",
    "confidence": 75,
    "primary_color": "red|green|orange|blue"
  }
}

⛔⛔⛔ Reglas finales :
- NO invente números que no figuren en la fuente original
- Cada diapositiva debe contener contenido real y rico — sin espacios en blanco
- No mezcle unidades diferentes en el mismo conjunto de datos
- Sin contradicción entre el sentimiento y la recomendación
- NO repita las recomendaciones — cada una es única
- Devuelva únicamente JSON sin ningún texto adicional ni markdown`;

// ── Main Function ──
export async function generateInfographicEs(
  sourceType: string,
  sourceId: string,
): Promise<EsInfographicResult> {
  // Step 1: Fetch source content
  const source = await fetchSourceEs(sourceType, sourceId);
  if (!source) {
    return { success: false, error: 'Source not found or not Spanish' };
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
  const aiAnalysisSection = source.aiAnalysis ? `\n\nAI Analysis:\n${source.aiAnalysis.slice(0, 1500)}` : '';
  const sentiment = source.sentiment || 'neutral';
  const sector = source.category || 'General';
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `Fecha actual : ${currentDate}
Artículo : ${source.title}
${source.summary ? `Resumen : ${source.summary.slice(0, 800)}` : ''}

Contenido completo :
${contentForAI}${aiAnalysisSection}

Sector : ${sector}
Sentimiento : ${sentiment}

⛔⛔⛔ Recuerde :
1. Extraiga todos los números del contenido únicamente — NO invente datos
2. Cada diapositiva = contenido real y rico — sin espacios en blanco
3. Sin contradicción entre el sentimiento y la recomendación
4. Especifique image_prompt para cada diapositiva (excepto la 6) — descripción de fondo oscuro profesional en inglés
5. Especifique chart_config para cada diapositiva (excepto historia) — tipo de gráfico y datos
6. Devuelva únicamente JSON sin ningún texto adicional`;

  console.log(`[EsInfographicGen] Generating from ${sourceType}:${sourceId} — title: "${source.title?.slice(0, 60)}"`);

  // Step 4: Call AI
  let result: any;
  try {
    try {
      result = await chatCompletion([
        { role: 'system', content: ES_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Increased from 8000 → 16000 to prevent truncated JSON
        priority: 'generation',
        locale: 'es',
      });
    } catch {
      result = await chatCompletion([
        { role: 'system', content: ES_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Same increase for fallback
        priority: 'translation',
        locale: 'es',
      });
    }
  } catch (aiErr: any) {
    return { success: false, error: `AI failed: ${aiErr.message?.slice(0, 100)}` };
  }

  // Step 5: Parse AI response with robust JSON repair (V400)
  let responseText = result.content?.trim() || '';

  const isTruncated = result.stopReason === 'max_tokens' || result.stopReason === 'length';
  if (isTruncated) {
    console.warn(`[EsInfographicGen V400] Output TRUNCATED (stopReason=${result.stopReason}) — attempting JSON repair`);
  }

  responseText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  responseText = responseText.replace(/^```/i, '').replace(/```$/i, '');

  let jsonStr = responseText;
  const jsonStart = responseText.indexOf('{');
  const jsonEnd = responseText.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonStr = responseText.slice(jsonStart, jsonEnd + 1);
  }

  // V400: JSON repair
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  jsonStr = jsonStr.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"');
  if (isTruncated || !jsonStr.trimEnd().endsWith('}')) {
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/]/g) || []).length;
    const tempStr = jsonStr.trimEnd();
    if (tempStr.endsWith('"') === false && tempStr.match(/"[^"]*$/)) { jsonStr = tempStr + '"'; }
    for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
    console.log(`[EsInfographicGen V400] JSON repair: added ${openBrackets - closeBrackets} brackets, ${openBraces - closeBraces} braces`);
  }

  let infographicData: any;
  try {
    infographicData = JSON.parse(jsonStr);
  } catch (parseErr: any) {
    try {
      const lastCompleteSlide = jsonStr.lastIndexOf('"number"');
      if (lastCompleteSlide > 0) {
        const arrStart = jsonStr.lastIndexOf('[', lastCompleteSlide);
        if (arrStart >= 0) {
          let repairedJson = jsonStr.slice(0, arrStart) + ']';
          const mainOpenBraces = (repairedJson.match(/{/g) || []).length;
          const mainCloseBraces = (repairedJson.match(/}/g) || []).length;
          for (let i = 0; i < mainOpenBraces - mainCloseBraces; i++) repairedJson += '}';
          console.log(`[EsInfographicGen V400] Aggressive JSON repair applied`);
          infographicData = JSON.parse(repairedJson);
        } else { throw parseErr; }
      } else { throw parseErr; }
    } catch {
      console.error(`[EsInfographicGen V400] JSON parse failed: ${parseErr.message}`);
      return { success: false, error: `JSON parse failed: ${parseErr.message?.slice(0, 80)}` };
    }
  }

  // Step 6: Validate structure
  if (!infographicData.slides || !Array.isArray(infographicData.slides) || infographicData.slides.length === 0) {
    return { success: false, error: 'No valid slides in response' };
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
    return { success: false, error: `Only ${validSlides.length} valid slides (minimum 3)` };
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
    console.log(`[EsInfographicGen] Images: ${slidesWithImages}/${slidesNeedingImages} (success=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[EsInfographicGen] Image generation FAILED: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 8: Save to database with locale: 'es'
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
        locale: 'es',  // ← Spanish locale
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
      },
    });

    console.log(`[EsInfographicGen] Created: ${infographic.id} — ${validSlides.length} slides — locale=es — published=${imageGenerationSuccess}`);

    return {
      success: true,
      infographicId: infographic.id,
      title: infographic.title,
      isPublished: imageGenerationSuccess,
    };
  } catch (dbErr: any) {
    return { success: false, error: `DB error: ${dbErr.message?.slice(0, 100)}` };
  }
}
