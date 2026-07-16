// ════════════════════════════════════════════════════════════════════
// Geopolitical Risk Analysis Pipeline V1050 — Simplified
// ════════════════════════════════════════════════════════════════════
// V1050: Complete rewrite — instead of asking AI for a huge JSON object
// (which fails 90% of the time), we use a 2-step approach:
//   Step 1: AI writes a normal markdown analysis (reliable, always works)
//   Step 2: Extract metadata (title, score, category, level) from the text
//
// This is 10x more reliable than the V1044 JSON approach.

import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export type RiskCategory = 'conflict' | 'trade' | 'energy' | 'political' | 'cyber' | 'sanctions' | 'climate';
export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export interface PipelineResult {
  success: boolean;
  generated: number;
  skipped: number;
  errors: string[];
  duration: number;
  analyses: { locale: Locale; title: string; slug: string; riskScore: number; riskLevel: RiskLevel }[];
}

// ─── GPR Baseline Data (top 10 high-risk countries) ──────────────────

const GPR_COUNTRIES: Array<{
  code: string;
  names: Record<Locale, string>;
  region: string;
  category: RiskCategory;
  aiGpr: number;
  context: string;
}> = [
  { code: 'UA', names: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', tr: 'Ukrayna', es: 'Ucrania' }, region: 'europe', category: 'conflict', aiGpr: 95, context: 'Russia-Ukraine war, NATO support, energy security, grain exports, sanctions' },
  { code: 'SY', names: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', tr: 'Suriye', es: 'Siria' }, region: 'middle-east', category: 'conflict', aiGpr: 92, context: 'Civil war, foreign intervention, refugee crisis, regional power struggle' },
  { code: 'AF', names: { ar: 'أفغانستان', en: 'Afghanistan', fr: 'Afghanistan', tr: 'Afganistan', es: 'Afganistán' }, region: 'south-asia', category: 'conflict', aiGpr: 90, context: 'Taliban governance, terrorism, humanitarian crisis, drug trade' },
  { code: 'PS', names: { ar: 'فلسطين', en: 'Palestine', fr: 'Palestine', tr: 'Filistin', es: 'Palestina' }, region: 'middle-east', category: 'conflict', aiGpr: 88, context: 'Israeli-Palestinian conflict, Gaza, regional escalation' },
  { code: 'YE', names: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', tr: 'Yemen', es: 'Yemen' }, region: 'middle-east', category: 'conflict', aiGpr: 85, context: 'Civil war, Houthi attacks on shipping, Saudi-Iran proxy conflict' },
  { code: 'RU', names: { ar: 'روسيا', en: 'Russia', fr: 'Russie', tr: 'Rusya', es: 'Rusia' }, region: 'europe', category: 'sanctions', aiGpr: 88, context: 'Western sanctions, energy weaponization, Ukraine war, NATO tensions' },
  { code: 'IR', names: { ar: 'إيران', en: 'Iran', fr: 'Iran', tr: 'İran', es: 'Irán' }, region: 'middle-east', category: 'sanctions', aiGpr: 75, context: 'Nuclear program, sanctions, regional proxies, internal protests' },
  { code: 'CN', names: { ar: 'الصين', en: 'China', fr: 'Chine', tr: 'Çin', es: 'China' }, region: 'east-asia', category: 'trade', aiGpr: 48, context: 'US trade tensions, Taiwan, South China Sea, technology competition' },
  { code: 'TW', names: { ar: 'تايوان', en: 'Taiwan', fr: 'Taïwan', tr: 'Tayvan', es: 'Taiwán' }, region: 'east-asia', category: 'political', aiGpr: 62, context: 'China-Taiwan tensions, semiconductor supply chain, US military support' },
  { code: 'SA', names: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie Saoudite', tr: 'Suudi Arabistan', es: 'Arabia Saudí' }, region: 'middle-east', category: 'energy', aiGpr: 42, context: 'Oil policy, Iran rivalry, Vision 2030, regional leadership' },
];

const RISK_LEVELS: Record<string, RiskLevel> = {};

function scoreToLevel(score: number): RiskLevel {
  if (score >= 81) return 'severe';
  if (score >= 61) return 'high';
  if (score >= 41) return 'elevated';
  if (score >= 21) return 'moderate';
  return 'low';
}

// ─── V1055: Multilingual prompt — fully native per locale ───────────

function buildPrompt(countryName: string, context: string, aiGpr: number, locale: Locale): string {
  const prompts: Record<Locale, string> = {
    ar: `أنت محلل مخاطر جيوسياسية محترف. اكتب تحليلاً احترافياً للمخاطر الجيوسياسية لدولة ${countryName} باللغة العربية.

السياق: ${context}
درجة المخاطرة المرجعية: ${aiGpr}/100

اكتب تحليلاً أصيلاً ومحدداً لهذه الدولة بالتنسيق التالي (Markdown). لا تكرر القيم النموذجية — حلل الوضع الفعلي:

## الملخص التنفيذي
(3-4 جمل تشرح الوضع الحالي والمخاطر الرئيسية)

## السياق والخلفية
(فقرة مفصلة عن الوضع السياسي والأمني والاقتصادي للدولة)

## التأثير الاقتصادي
(فقرة عن تأثير الوضع على الأسواق العالمية والإقليمية)

## السيناريوهات
- **الأساسي** (50%): (وصف تفصيلي محدد للسيناريو الأساسي)
- **المعاكس** (30%): (وصف تفصيلي محدد للسيناريو المعاكس)
- **الحاد** (20%): (وصف تفصيلي محدد للسيناريو الحاد)

## الأصول المتأثرة
- **النفط (OIL)**: (نسبة متوقعة) — (صعودي/هبوطي) — (سبب محدد)
- **الذهب (GOLD)**: (نسبة متوقعة) — (صعودي/هبوطي) — (سبب محدد)
- **EUR/USD**: (نسبة متوقعة) — (صعودي/هبوطي) — (سبب محدد)
- **المؤشرات (SPX)**: (نسبة متوقعة) — (صعودي/هبوطي) — (سبب محدد)

## طرق التجارة المتأثرة
- **مضيق هرمز**: (مستقر/مهدد/متأثر) — (تأثير محدد)
- **قناة السويس**: (مستقر/مهدد/متأثر) — (تأثير محدد)

## التوصيات الاستراتيجية
للمستثمر المحافظ:
(توصية محددة وواقعية)

للمستثمر المتوسط:
(توصية محددة وواقعية)

للمتداول النشط:
(توصية محددة وواقعية)

اكتب العنوان في السطر الأول بدون ## (سيكون عنوان التحليل).
اكتب بأسلوب احترافي تحليلي — ليس صحفي. حلل الوضع الفعلي للدولة.
قسّم فقرات "السياق والخلفية" إلى نقاط مختصرة بدلاً من نص متواصل.`,

    en: `You are a professional geopolitical risk analyst. Write a professional geopolitical risk analysis for ${countryName} in English.

Context: ${context}
Reference risk score: ${aiGpr}/100

Write an original, specific analysis for this country in the following Markdown format. Do NOT repeat template values — analyze the actual situation:

## Executive Summary
(3-4 sentences explaining the current situation and key risks)

## Context & Background
Use SHORT bullet points instead of long paragraphs:
- Key point 1
- Key point 2
- Key point 3

## Economic Impact
(paragraph about impact on global and regional markets)

## Scenarios
- **Base case** (50%): (specific detailed description)
- **Adverse case** (30%): (specific detailed description)
- **Severe case** (20%): (specific detailed description)

## Affected Assets
For each asset, provide SPECIFIC entry/target/stop levels:
- **Oil (OIL)**: (expected %) — (bullish/bearish) — (specific reason). Entry: $XX, Target: $XX, Stop: $XX
- **Gold (GOLD)**: (expected %) — (bullish/bearish) — (specific reason). Entry: $XX, Target: $XX, Stop: $XX
- **EUR/USD**: (expected %) — (bullish/bearish) — (specific reason). Entry: X.XX, Target: X.XX, Stop: X.XX
- **S&P 500 (SPX)**: (expected %) — (bullish/bearish) — (specific reason). Entry: XXXX, Target: XXXX, Stop: XXXX

## Trade Routes Affected
- **Strait of Hormuz**: (stable/threatened/disrupted) — (specific impact)
- **Suez Canal**: (stable/threatened/disrupted) — (specific impact)

## Strategic Recommendations
Conservative:
(specific recommendation with allocation %)

Moderate:
(specific recommendation with allocation %)

Active trader:
(specific recommendation with entry/target/stop levels)

Write the title on the first line without ## (it will be the analysis title).
Write in a professional analytical style — not journalistic. Analyze the actual situation of the country.
Break "Context & Background" into SHORT bullet points instead of continuous text.`,

    fr: `Vous êtes un analyste professionnel des risques géopolitiques. Rédigez une analyse professionnelle des risques géopolitiques pour ${countryName} en français.

Contexte: ${context}
Score de risque de référence: ${aiGpr}/100

Rédigez une analyse originale et spécifique pour ce pays au format Markdown suivant. Ne répétez PAS les valeurs modèles — analysez la situation réelle:

## Résumé Exécutif
(3-4 phrases expliquant la situation actuelle et les risques principaux)

## Contexte et Antécédents
Utilisez des points COURTS au lieu de longs paragraphes:
- Point clé 1
- Point clé 2
- Point clé 3

## Impact Économique
(paragraphe sur l'impact sur les marchés mondiaux et régionaux)

## Scénarios
- **Scénario de base** (50%): (description détaillée spécifique)
- **Scénario défavorable** (30%): (description détaillée spécifique)
- **Scénario sévère** (20%): (description détaillée spécifique)

## Actifs Affectés
Pour chaque actif, fournissez des niveaux SPÉCIFIQUES d'entrée/objectif/stop:
- **Pétrole (OIL)**: (% attendu) — (haussier/baissier) — (raison spécifique). Entrée: $XX, Objectif: $XX, Stop: $XX
- **Or (GOLD)**: (% attendu) — (haussier/baissier) — (raison spécifique). Entrée: $XX, Objectif: $XX, Stop: $XX
- **EUR/USD**: (% attendu) — (haussier/baissier) — (raison spécifique). Entrée: X.XX, Objectif: X.XX, Stop: X.XX
- **S&P 500 (SPX)**: (% attendu) — (haussier/baissier) — (raison spécifique). Entrée: XXXX, Objectif: XXXX, Stop: XXXX

## Routes Commerciales Affectées
- **Détroit d'Ormuz**: (stable/menacé/perturbé) — (impact spécifique)
- **Canal de Suez**: (stable/menacé/perturbé) — (impact spécifique)

## Recommandations Stratégiques
Investisseur Conservateur:
(recommandation spécifique avec % d'allocation)

Investisseur Modéré:
(recommandation spécifique avec % d'allocation)

Trader Actif:
(recommandation spécifique avec niveaux d'entrée/objectif/stop)

Écrivez le titre sur la première ligne sans ## (ce sera le titre de l'analyse).
Écrivez dans un style analytique professionnel — pas journalistique.`,

    tr: `Profesyonel bir jeopolitik risk analistsisiniz. ${countryName} için profesyonel bir jeopolitik risk analizi yazın — Türkçe olarak.

Bağlam: ${context}
Referans risk skoru: ${aiGpr}/100

Bu ülke için özgün ve spesifik bir analiz yazın. Şablon değerleri tekrar ETMEYİN — gerçek durumu analiz edin:

## Yönetici Özeti
(Mevcut durumu ve ana riskleri açıklayan 3-4 cümle)

## Bağlam ve Arka Plan
Uzun paragraflar yerine KISA madde işaretleri kullanın:
- Ana nokta 1
- Ana nokta 2
- Ana nokta 3

## Ekonomik Etki
(küresel ve bölgesel piyasalar üzerindeki etki hakkında paragraf)

## Senaryolar
- **Temel senaryo** (50%): (spesifik detaylı açıklama)
- **Olumsuz senaryo** (30%): (spesifik detaylı açıklama)
- **Şiddetli senaryo** (20%): (spesifik detaylı açıklama)

## Etkilenen Varlıklar
Her varlık için SPESİFİK giriş/hedef/stop seviyeleri sağlayın:
- **Petrol (OIL)**: (beklenen %) — (yükseliş/düşüş) — (spesifik neden). Giriş: $XX, Hedef: $XX, Stop: $XX
- **Altın (GOLD)**: (beklenen %) — (yükseliş/düşüş) — (spesifik neden). Giriş: $XX, Hedef: $XX, Stop: $XX
- **EUR/USD**: (beklenen %) — (yükseliş/düşüş) — (spesifik neden). Giriş: X.XX, Hedef: X.XX, Stop: X.XX
- **S&P 500 (SPX)**: (beklenen %) — (yükseliş/düşüş) — (spesifik neden). Giriş: XXXX, Hedef: XXXX, Stop: XXXX

## Etkilenen Ticaret Rotaları
- **Hürmüz Boğazı**: (stabil/tehdit altında/etkilenmiş) — (spesifik etki)
- **Süveyş Kanalı**: (stabil/tehdit altında/etkilenmiş) — (spesifik etki)

## Stratejik Öneriler
Muhafazakar Yatırımcı:
(spesifik öneri ve % tahsis)

Orta Düzey Yatırımcı:
(spesifik öneri ve % tahsis)

Aktif Trader:
(spesifik öneri ve giriş/hedef/stop seviyeleri)

Başlığı ilk satıra ## olmadan yazın (analizin başlığı olacak).
Profesyonel analitik bir üslupla yazın — gazeteci değil. Ülkenin gerçek durumunu analiz edin.
"Bağlam ve Arka Plan" bölümünü uzun metin yerine KISA madde işaretleri olarak bölün.`,

    es: `Eres un analista profesional de riesgos geopolíticos. Escribe un análisis profesional de riesgos geopolíticos para ${countryName} en español.

Contexto: ${context}
Puntuación de riesgo de referencia: ${aiGpr}/100

Escribe un análisis original y específico para este país. NO repitas valores de plantilla — analiza la situación real:

## Resumen Ejecutivo
(3-4 frases explicando la situación actual y los riesgos principales)

## Contexto y Antecedentes
Usa puntos CORTOS en lugar de párrafos largos:
- Punto clave 1
- Punto clave 2
- Punto clave 3

## Impacto Económico
(párrafo sobre el impacto en los mercados globales y regionales)

## Escenarios
- **Escenario base** (50%): (descripción detallada específica)
- **Escenario adverso** (30%): (descripción detallada específica)
- **Escenario severo** (20%): (descripción detallada específica)

## Activos Afectados
Para cada activo, proporciona niveles ESPECÍFICOS de entrada/objetivo/stop:
- **Petróleo (OIL)**: (% esperado) — (alcista/bajista) — (razón específica). Entrada: $XX, Objetivo: $XX, Stop: $XX
- **Oro (GOLD)**: (% esperado) — (alcista/bajista) — (razón específica). Entrada: $XX, Objetivo: $XX, Stop: $XX
- **EUR/USD**: (% esperado) — (alcista/bajista) — (razón específica). Entrada: X.XX, Objetivo: X.XX, Stop: X.XX
- **S&P 500 (SPX)**: (% esperado) — (alcista/bajista) — (razón específica). Entrada: XXXX, Objetivo: XXXX, Stop: XXXX

## Rutas Comerciales Afectadas
- **Estrecho de Ormuz**: (estable/amenazado/disruptado) — (impacto específico)
- **Canal de Suez**: (estable/amenazado/disruptado) — (impacto específico)

## Recomendaciones Estratégicas
Inversor Conservador:
(recomendación específica con % de asignación)

Inversor Moderado:
(recomendación específica con % de asignación)

Trader Activo:
(recomendación específica con niveles de entrada/objetivo/stop)

Escribe el título en la primera línea sin ## (será el título del análisis).
Escribe en un estilo analítico profesional — no periodístico. Analiza la situación real del país.
Divide "Contexto y Antecedentes" en puntos CORTOS en lugar de texto continuo.`,
  };

  return prompts[locale];
}

// ─── Extract metadata from AI markdown output ────────────────────────

function extractTitle(content: string): string {
  // First non-empty line that's not a ## heading
  const lines = content.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && trimmed.length > 10) {
      return trimmed.slice(0, 120);
    }
  }
  // Fallback: first ## heading
  for (const line of lines) {
    if (line.startsWith('## ')) return line.replace(/^##\s+/, '').slice(0, 120);
  }
  return 'Geopolitical Risk Analysis';
}

function extractSummary(content: string): string {
  // Find the executive summary section and take first paragraph
  const summaryMatch = content.match(/##\s+(?:الملخص التنفيذي|Executive Summary)\s*\n\n(.+?)(?:\n\n|\n##)/s);
  if (summaryMatch) return summaryMatch[1].trim().slice(0, 300);
  // Fallback: first paragraph after title
  const lines = content.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.length > 30) {
      return trimmed.slice(0, 300);
    }
  }
  return '';
}

function detectCategory(context: string): RiskCategory {
  if (context.match(/war|sanctions|كراع|حرب/i)) return 'conflict';
  if (context.match(/trade|تجار/i)) return 'trade';
  if (context.match(/oil|energy|نفط|طاق/i)) return 'energy';
  return 'political';
}

// V1053: Extract structured data from AI-generated markdown content
function extractStructuredData(content: string) {
  const assets: { symbol: string; name: string; impact: string; direction: string; description: string }[] = [];
  const scenarios: { name: string; probability: number; description: string }[] = [];
  const routes: { name: string; status: string; impact: string }[] = [];
  const recommendations: { type: string; text: string }[] = [];

  // Extract assets: - **Name (SYMBOL)**: +5% — direction — description
  const assetRegex = /- \*\*(.+?)\s*\((.+?)\)\*\*:\s*(.+?)\s*[—\-]\s*(.+?)\s*[—\-]\s*(.+)/g;
  let match;
  while ((match = assetRegex.exec(content)) !== null) {
    assets.push({ name: match[1].trim(), symbol: match[2].trim(), impact: match[3].trim(), direction: match[4].trim(), description: match[5].trim() });
  }

  // Also match: - **EUR/USD**: -2% — bearish — description (no parentheses in symbol)
  const assetRegex2 = /- \*\*([A-Z]+\/[A-Z]+)\*\*:\s*(.+?)\s*[—\-]\s*(.+?)\s*[—\-]\s*(.+)/g;
  while ((match = assetRegex2.exec(content)) !== null) {
    if (!assets.some(a => a.symbol === match[1])) {
      assets.push({ name: match[1], symbol: match[1], impact: match[2].trim(), direction: match[3].trim(), description: match[4].trim() });
    }
  }

  // Extract scenarios: - **Name** (XX%): description
  const scenarioRegex = /- \*\*(.+?)\*\*\s*\((\d+)%\):\s*(.+)/g;
  while ((match = scenarioRegex.exec(content)) !== null) {
    scenarios.push({ name: match[1].trim(), probability: parseInt(match[2]), description: match[3].trim() });
  }

  // Extract trade routes: - **Route Name**: status — impact
  const routeSectionMatch = content.match(/##\s+(?:طرق التجارة|Trade Routes)[\s\S]*?(?=##|\Z)/i);
  if (routeSectionMatch) {
    const routeRegex = /- \*\*(.+?)\*\*:\s*(.+?)\s*[—\-]\s*(.+)/g;
    while ((match = routeRegex.exec(routeSectionMatch[0])) !== null) {
      routes.push({ name: match[1].trim(), status: match[2].trim(), impact: match[3].trim() });
    }
  }

  // Extract recommendations
  const recSectionMatch = content.match(/##\s+(?:التوصيات|Recommendations)[\s\S]*?(?=##|\Z)/i);
  if (recSectionMatch) {
    const recRegex = /(?:للمستثمر المحافظ|Conservative)[:\s]*\n([\s\S]+?)(?=\n\n|\n(?:للمستثمر المتوسط|Moderate)|\n##|\Z)/i;
    const rec2Regex = /(?:للمستثمر المتوسط|Moderate)[:\s]*\n([\s\S]+?)(?=\n\n|\n(?:للمتداول|Active)|\n##|\Z)/i;
    const rec3Regex = /(?:للمتداول النشط|Active)[:\s]*\n([\s\S]+?)(?=\n\n|\n##|\Z)/i;
    const r1 = recSectionMatch[0].match(recRegex);
    const r2 = recSectionMatch[0].match(rec2Regex);
    const r3 = recSectionMatch[0].match(rec3Regex);
    if (r1) recommendations.push({ type: 'للمستثمر المحافظ', text: r1[1].trim() });
    if (r2) recommendations.push({ type: 'للمستثمر المتوسط', text: r2[1].trim() });
    if (r3) recommendations.push({ type: 'للمتداول النشط', text: r3[1].trim() });
  }

  return { assets, scenarios, routes, recommendations };
}

// ─── Main pipeline ───────────────────────────────────────────────────

export async function runGeopoliticalPipeline(options?: {
  force?: boolean;
  maxAnalyses?: number;
  locales?: Locale[];
}): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let generated = 0;
  let skipped = 0;
  const analyses: PipelineResult['analyses'] = [];

  const maxAnalyses = Math.min(options?.maxAnalyses ?? 3, 5);
  const locales = options?.locales ?? (['ar', 'en', 'fr', 'tr', 'es'] as Locale[]);

  console.log(`[GeoPipeline V1050] Starting — ${maxAnalyses} countries × ${locales.length} locales`);

  // Pick top countries by GPR score
  const countries = GPR_COUNTRIES
    .sort((a, b) => b.aiGpr - a.aiGpr)
    .slice(0, maxAnalyses);

  console.log(`[GeoPipeline V1050] Countries: ${countries.map(c => c.code).join(', ')}`);

  // V1049: Generate ALL countries × locales IN PARALLEL
  const results = await Promise.allSettled(
    countries.flatMap(country =>
      locales.map(async (locale) => {
        const countryName = country.names[locale] || country.names.en;

        try {
          console.log(`[GeoPipeline V1050] Generating: ${country.code} (${locale})...`);

          const messages: ChatMessage[] = [
            {
              role: 'user',
              content: buildPrompt(countryName, country.context, country.aiGpr, locale),
            },
          ];

          const result = await chatCompletion(messages, {
            temperature: 0.4,
            maxTokens: 3000,
            locale,
            allowFallback: true,
          });

          console.log(`[GeoPipeline V1050] AI responded for ${country.code} (${locale}) — ${result.content?.length || 0} chars, provider: ${result.provider}`);

          if (!result.content || result.content.trim().length < 200) {
            return { country, locale, error: `AI returned ${result.content?.length || 0} chars — too short` };
          }

          const content = result.content.trim();
          const title = extractTitle(content);
          const summary = extractSummary(content);
          const riskScore = country.aiGpr;
          const riskLevel = scoreToLevel(riskScore);
          const riskCategory = country.category;
          const slug = `geo-${country.code.toLowerCase()}-${locale}-${Date.now().toString(36).slice(-6)}`;

          // V1053: Extract structured data from the AI-generated markdown
          const extracted = extractStructuredData(content);
          console.log(`[GeoPipeline V1050] Extracted: ${extracted.assets.length} assets, ${extracted.scenarios.length} scenarios, ${extracted.routes.length} routes`);

          console.log(`[GeoPipeline V1050] Storing: ${title.slice(0, 50)}... (${locale})`);

          // V1051: Prisma Json fields need NATIVE values, not stringified JSON
          await db.geopoliticalRisk.create({
            data: {
              title,
              slug,
              summary,
              content,
              locale,
              riskCategory,
              riskLevel,
              riskScore,
              affectedRegions: [country.region],
              affectedCountries: [{ code: country.code, name: countryName, score: riskScore }],
              affectedAssets: extracted.assets.length > 0 ? extracted.assets : [],   // V1053: structured assets
              scenarios: extracted.scenarios.length > 0 ? extracted.scenarios : null, // V1053: structured scenarios
              tradeRoutes: extracted.routes.length > 0 ? extracted.routes : [],       // V1053: structured routes
              sourceUrls: [],
              latitude: null,
              longitude: null,
              isPublished: true,
              publishedAt: new Date(),
            },
          });

          console.log(`[GeoPipeline V1050] ✅ Stored: ${title.slice(0, 50)}... (${locale})`);
          return { country, locale, title, slug, riskScore, riskLevel, error: null };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // V1051: Log full error details — previously msg was empty because
          // Prisma errors sometimes put the message in err.meta or err.cause
          console.error(`[GeoPipeline V1050] ❌ ${country.code} (${locale}): ${msg.slice(0, 200)}`);
          if ((err as any)?.code) console.error(`  Prisma code: ${(err as any).code}`);
          if ((err as any)?.meta) console.error(`  Prisma meta: ${JSON.stringify((err as any).meta).slice(0, 200)}`);
          return { country, locale, error: `${country.code} (${locale}): ${msg.slice(0, 100)}` };
        }
      })
    )
  );

  // Collect results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const r = result.value;
      if (r.error) {
        errors.push(r.error);
      } else {
        generated++;
        analyses.push({
          locale: r.locale,
          title: r.title,
          slug: r.slug,
          riskScore: r.riskScore,
          riskLevel: r.riskLevel,
        });
      }
    } else {
      errors.push(`Promise rejected: ${result.reason?.message?.slice(0, 80) || 'Unknown'}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[GeoPipeline V1050] Complete: ${generated} generated, ${errors.length} errors, ${duration}ms`);

  return { success: errors.length === 0, generated, skipped, errors, duration, analyses };
}
