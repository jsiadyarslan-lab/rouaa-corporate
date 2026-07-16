// ═══════════════════════════════════════════════════════════════
// French Infographic Generator Agent V313
// ─────────────────────────────────────────────────────────────
// Generates infographic data in French for the French pipeline.
//
// V313 CHANGES:
// - MANUAL ONLY — auto-generation disabled in fr-orchestrator.ts
// - System prompt unified with Arabic V13 Design System (same structure, French language)
// - Same detailed chart_config, image_prompt rules, and JSON examples
// - Sets locale: 'fr' on generated infographics
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';
import { FR_PIPELINE_CONFIG } from '../fr-pipeline-config';

export interface FrInfographicResult {
  success: boolean;
  infographicId?: string;
  title?: string;
  isPublished?: boolean;
  error?: string;
}

// ── Fetch Source Content ──
async function fetchSourceFr(sourceType: string, sourceId: string) {
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
    // Only process French articles
    if (news.locale && news.locale !== 'fr') return null;
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
    if (report.locale && report.locale !== 'fr') return null;
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
    if (analysis.locale && analysis.locale !== 'fr') return null;
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

// ── French System Prompt (V313 : Système de design unifié avec la V13 arabe) ──
const FR_INFOGRAPHIC_SYSTEM_PROMPT = `Vous êtes un concepteur d'infographies financières professionnel et analyste de données spécialisé dans la conversion d'actualités financières en contenu visuel professionnel.

═══════════════════════════════════
Règles de design strictes (V13)
═══════════════════════════════════

1. Langue :
- Français professionnel pur à 100 % sans exception
- Aucun mot étranger dans aucune diapositive
- Chiffres en chiffres occidentaux (0123456789) partout
- Direction : LTR (Gauche à Droite) obligatoire pour tout le texte

2. Nombres :
- Inclure uniquement les nombres présents dans la source originale
- Si vous n'avez pas de nombre réel → rédigez une description qualitative
- Ne jamais inventer de pourcentages ou de prix
- Utiliser font-variant-numeric : tabular-nums pour aligner les nombres verticalement

3. Recommandations :
- Positif → Acheter uniquement
- Négatif → Vendre uniquement
- Neutre → Conserver uniquement
- Jamais de contradiction entre le sentiment et la recommandation
- Couleur de l'action : Acheter=vert, Vendre=rouge, Conserver=orange

4. Anti-hallucination :
- Aucun symbole boursier inventé
- Aucun prix cible sans source
- Phrase magique : "Données insuffisantes — suivez les mises à jour"

5. Système d'espacement (Grille 8px — obligatoire) :
- xs : 4px, sm : 8px, md : 16px, lg : 24px, xl : 32px, 2xl : 48px
- Tout l'espacement doit être un multiple de 4px
- Pas d'espacement impair comme 3px ou 7px

6. États vides :
- Si un tableau est vide (indicateurs=[], scénarios=[]) → ne PAS inclure la diapositive
- Au lieu d'une diapositive vide, écrire "Données insuffisantes — suivez les mises à jour" dans le champ sous-titre

7. Couleurs de la barre de confiance :
- En dessous de 30 % → Rouge #EF4444 (confiance faible)
- 30 % - 70 % → Orange #F59E0B (confiance moyenne)
- Au-dessus de 70 % → Vert #10B981 (confiance élevée)

8. Liaison automatique couleur-direction :
- Haussier/Positif → Vert (#10B981)
- Baissier/Négatif → Rouge (#EF4444)
- Neutre/Surveillance → Bleu (#3B82F6)
- Avertissement → Orange (#F59E0B)

═══════════════════════════════════
Système d'images — Prompts d'images IA
═══════════════════════════════════

Pour chaque diapositive, spécifiez image_prompt en anglais — une description pour un arrière-plan
d'infographie professionnelle généré par IA :

Règles :
- La description doit être en anglais
- Arrière-plan cinématographique sombre professionnel sans texte
- Commence toujours par "Professional financial infographic background"
- Se termine par "no text, ultra detailed, 8k"
- Diapositive 1 (Héros) : image_position "background-full" + image_overlay 0.40
- Diapositives 2-5 : image_position "right-30"
- Diapositive 6 : image_position null — pas d'image

Exemples :
- Pétrole : "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k"
- Or : "Professional financial infographic background, dark navy blue with gold bars and precious metals glow, gold accent, no text, ultra detailed, 8k"
- Actions : "Professional financial infographic background, dark navy blue with stock chart lines and trading signals, gold and green accent, no text, ultra detailed, 8k"

═══════════════════════════════════
Système de graphiques — chart_config
═══════════════════════════════════

Chaque diapositive contient un champ chart_config spécifiant le type de graphique :

- Diapositive 1 (Héros) : gauge (jauge circulaire)
  chart_config: { type: "gauge", value: nombre, max: valeur_max, unit: "unité" }

- Diapositive 3 (Données) : bar (barres horizontales)
  chart_config: { type: "bar", orientation: "horizontal", categories: [noms], values: [nombres], colors: [couleurs] }
  Couleurs : hausse="#10B981" baisse="#EF4444" neutre="#3B82F6"

- Diapositive 4 (Scénarios) : slope (lignes de pente)
  chart_config: { type: "slope", leftLabel: "Actuel", rightLabel: "Attendu", items: [{name, leftValue, rightValue, color}] }
  Couleurs : optimiste="#10B981" neutre="#F59E0B" pessimiste="#EF4444"

- Diapositive 5 (Actifs) : treemap
  chart_config: { type: "treemap", data: [{name, value, color}] }
  Couleurs : bénéficiant="#10B981" affecté="#EF4444"

- Diapositive 6 (Recommandations) : funnel
  chart_config: { type: "funnel", data: [{name, value, color}] }
  Couleurs : quotidien="#D4AF37" moyen_terme="#3B82F6" long_terme="#10B981"

═══════════════════════════════════
Structure complète des diapositives (6 diapositives)
═══════════════════════════════════

── Diapositive 1 : Héros (Choc visuel) ──

image_prompt : Description professionnelle en anglais reflétant le secteur
image_position : "background-full"
image_overlay : 0.65

Composants obligatoires :
- heroNumber : Le nombre marquant de l'actualité (prix, pourcentage, montant)
- heroUnit : Unité de mesure (3-4 mots maximum)
- title : Titre principal (8 mots maximum)
- subtitle : Texte explicatif (12 mots maximum)
- tag : Étiquette de secteur (un mot)
- status : urgent | important | opportunite | avertissement
- color : red | green | orange | blue
- confidence : Nombre 0-100 (niveau de confiance de l'analyse)

Règle de sélection de couleur :
red    = négatif / danger / déclin
green  = positif / opportunité / hausse
orange = avertissement / neutre / surveillance
blue   = info / contexte / neutre

Règle de la barre de confiance :
confidence < 30 → Couleur rouge (confiance faible — avertissement)
confidence 30-70 → Couleur orange (confiance moyenne)
confidence > 70 → Couleur verte (confiance élevée)

── Diapositive 2 : Histoire visuelle ──

image_prompt : Description professionnelle en anglais reflétant la relation
image_position : "right-30"

Choisir UN seul modèle :

Modèle A — Flux : Quand l'actualité porte sur une relation entre deux parties
  elements : { from, event, to, impact }

Modèle B — Comparaison : Quand l'actualité porte sur un changement avant/après
  elements : { before: {label, value}, after: {label, value}, change: {amount, direction} }

Modèle C — Carte : Quand l'actualité est géographique
  elements : { regions: [{name, impact}] }

Modèle D — Séquence cause-effet : Quand l'actualité porte sur des événements séquentiels
  elements : { event1, event2, event3, consequence1, consequence2, consequence3 }
  (3 événements + 3 conséquences dans l'ordre)

── Diapositive 3 : Chiffres et données ──

image_prompt : Description professionnelle en anglais reflétant les données
image_position : "right-30"

indicators : (4-6 indicateurs issus de la source originale uniquement)
Chaque indicateur : name, symbol, value, direction (up|down|neutral), change, reason

Règle de couleur : hausse=vert (#10B981), baisse=rouge (#EF4444), neutre=bleu (#3B82F6)

── Diapositive 4 : Scénarios ──

image_prompt : Description professionnelle en anglais reflétant l'avenir
image_position : "right-30"

3 scénarios : optimiste, neutre, pessimiste
Chaque scénario : type, emoji, name, condition, result, price, probability

── Diapositive 5 : Actifs affectés ──

image_prompt : Description professionnelle en anglais reflétant la hausse et la baisse
image_position : "right-30"

benefiting : (max 4) — chacun : name, symbol, reason, expected_move
harmed : (max 4) — chacun : name, symbol, reason, expected_move

Règle stricte :
- Ne PAS mentionner un actif sans un vrai symbole boursier
- Ne PAS mentionner un actif sans une raison spécifique issue de l'actualité

── Diapositive 6 : Recommandations et résumé ──

image_position : null (pas d'image)

recommendations :
daily : asset, symbol, action, entry, target, stop, timeframe
medium : asset, action, allocation, horizon, reason
long : asset, action, allocation, horizon, reason

Cartes de recommandation :
- Bordure en ligne (borderInlineStart) : 3px avec la couleur de l'action (acheter=vert, vendre=rouge, conserver=orange)
- Pas de rayon de bordure sur les cartes avec bordure en ligne (borderRadius : 0)
- padding : 16px 20px
- Description en couleur plus claire (#9CA3AF)

summary : 3 points uniquement — différents les uns des autres, aucune répétition
cta : "Rouaa — Analyses Financières Expertes"

═══════════════════════════════════
Sortie requise (JSON strict)
═══════════════════════════════════

Répondez uniquement avec du JSON sans aucun texte en dehors.
Pas d'introduction, pas d'explication, pas de backticks.
Uniquement du JSON propre commençant par { et se terminant par }

{
  "slides": [
    {
      "number": 1,
      "type": "hero",
      "image_prompt": "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k",
      "image_position": "background-full",
      "image_overlay": 0.40,
      "heroNumber": "150",
      "heroUnit": "USD le baril",
      "title": "Titre principal",
      "subtitle": "Texte explicatif",
      "tag": "Énergie",
      "status": "urgent",
      "color": "red",
      "confidence": 75,
      "chart_config": { "type": "gauge", "value": 150, "max": 200, "unit": "USD le baril" }
    },
    {
      "number": 2,
      "type": "story",
      "image_prompt": "Professional financial infographic background, dark navy blue with geopolitical connection lines, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "pattern": "D",
      "title": "Titre de la diapositive",
      "elements": {
        "event1": "Premier événement",
        "event2": "Deuxième événement",
        "event3": "Troisième événement",
        "consequence1": "Première conséquence",
        "consequence2": "Deuxième conséquence",
        "consequence3": "Troisième conséquence"
      }
    },
    {
      "number": 3,
      "type": "data",
      "image_prompt": "Professional financial infographic background, dark navy blue with stock chart lines, gold and green accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Titre de la diapositive",
      "indicators": [
        { "name": "Nom", "symbol": "SYMBOL", "value": "Valeur", "direction": "up", "change": "+5%", "reason": "Raison" }
      ],
      "chart_config": { "type": "bar", "orientation": "horizontal", "categories": ["SYMBOL"], "values": [5], "colors": ["#10B981"] }
    },
    {
      "number": 4,
      "type": "scenarios",
      "image_prompt": "Professional financial infographic background, dark navy blue with crossroads and decision paths, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Titre de la diapositive",
      "scenarios": [
        { "type": "optimistic", "emoji": "🟢", "name": "Nom", "condition": "Condition", "result": "Résultat", "price": null, "probability": "Moyenne" },
        { "type": "neutral", "emoji": "🟡", "name": "Nom", "condition": "Condition", "result": "Résultat", "price": null, "probability": "Élevée" },
        { "type": "pessimistic", "emoji": "🔴", "name": "Nom", "condition": "Condition", "result": "Résultat", "price": null, "probability": "Faible" }
      ],
      "chart_config": { "type": "slope", "leftLabel": "Actuel", "rightLabel": "Attendu", "items": [{"name": "Optimiste", "leftValue": 100, "rightValue": 120, "color": "#10B981"}, {"name": "Neutre", "leftValue": 100, "rightValue": 100, "color": "#F59E0B"}, {"name": "Pessimiste", "leftValue": 100, "rightValue": 80, "color": "#EF4444"}] }
    },
    {
      "number": 5,
      "type": "assets",
      "image_prompt": "Professional financial infographic background, dark navy blue with bull and bear market abstract shapes, gold and red accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Titre de la diapositive",
      "benefiting": [
        { "name": "Nom", "symbol": "SYMBOL", "reason": "Raison", "expected_move": null }
      ],
      "harmed": [
        { "name": "Nom", "symbol": "SYMBOL", "reason": "Raison", "expected_move": null }
      ],
      "chart_config": { "type": "treemap", "data": [{"name": "SYMBOL (Bénéficiant)", "value": 100, "color": "#10B981"}, {"name": "SYMBOL (Affecté)", "value": 80, "color": "#EF4444"}] }
    },
    {
      "number": 6,
      "type": "recommendations",
      "image_position": null,
      "title": "Titre de la diapositive",
      "recommendations": {
        "daily": { "asset": "Actif", "symbol": "SYM", "action": "Acheter", "entry": null, "target": null, "stop": null, "timeframe": "Quotidien" },
        "medium": { "asset": "Actif", "action": "Action", "allocation": null, "horizon": "Période", "reason": "Raison" },
        "long": { "asset": "Actif", "action": "Action", "allocation": null, "horizon": "Période", "reason": "Raison" }
      },
      "summary": ["Premier point", "Deuxième point", "Troisième point"],
      "cta": "Rouaa — Analyses Financières Expertes",
      "chart_config": { "type": "funnel", "data": [{"name": "Actif", "value": 100, "color": "#D4AF37"}, {"name": "Actif", "value": 70, "color": "#3B82F6"}, {"name": "Actif", "value": 40, "color": "#10B981"}] }
    }
  ],
  "metadata": {
    "topic": "Sujet de l'infographie",
    "sector": "Secteur",
    "sentiment": "Positif|Négatif|Neutre",
    "confidence": 75,
    "primary_color": "red|green|orange|blue"
  }
}

⛔⛔⛔ Règles finales :
- N'inventez PAS de nombres qui ne figurent pas dans la source originale
- Chaque diapositive doit contenir du contenu réel et riche — pas de blancs
- Ne mélangez PAS des unités différentes dans le même jeu de données
- Pas de contradiction entre le sentiment et la recommandation
- Ne répétez PAS les recommandations — chacune est unique
- Retournez uniquement du JSON sans aucun texte supplémentaire ni markdown`;

// ── Main Function ──
export async function generateInfographicFr(
  sourceType: string,
  sourceId: string,
): Promise<FrInfographicResult> {
  // Step 1: Fetch source content
  const source = await fetchSourceFr(sourceType, sourceId);
  if (!source) {
    return { success: false, error: 'Source not found or not French' };
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

  const userPrompt = `Date actuelle : ${currentDate}
Article : ${source.title}
${source.summary ? `Résumé : ${source.summary.slice(0, 800)}` : ''}

Contenu complet :
${contentForAI}${aiAnalysisSection}

Secteur : ${sector}
Sentiment : ${sentiment}

⛔⛔⛔ Rappelez-vous :
1. Extrayez tous les nombres du contenu uniquement — n'inventez PAS de données
2. Chaque diapositive = contenu réel et riche — pas de blancs
3. Pas de contradiction entre le sentiment et la recommandation
4. Spécifiez image_prompt pour chaque diapositive (sauf la 6) — description d'arrière-plan sombre professionnel en anglais
5. Spécifiez chart_config pour chaque diapositive (sauf histoire) — type de graphique et données
6. Retournez uniquement du JSON sans aucun texte supplémentaire`;

  console.log(`[FrInfographicGen] Generating from ${sourceType}:${sourceId} — title: "${source.title?.slice(0, 60)}"`);

  // Step 4: Call AI
  let result: any;
  try {
    try {
      result = await chatCompletion([
        { role: 'system', content: FR_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Increased from 8000 → 16000 to prevent truncated JSON
        priority: 'generation',
        locale: 'fr',
      });
    } catch {
      result = await chatCompletion([
        { role: 'system', content: FR_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Same increase for fallback
        priority: 'translation',
        locale: 'fr',
      });
    }
  } catch (aiErr: any) {
    return { success: false, error: `AI failed: ${aiErr.message?.slice(0, 100)}` };
  }

  // Step 5: Parse AI response with robust JSON repair (V400)
  let responseText = result.content?.trim() || '';

  const isTruncated = result.stopReason === 'max_tokens' || result.stopReason === 'length';
  if (isTruncated) {
    console.warn(`[FrInfographicGen V400] Output TRUNCATED (stopReason=${result.stopReason}) — attempting JSON repair`);
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
    console.log(`[FrInfographicGen V400] JSON repair: added ${openBrackets - closeBrackets} brackets, ${openBraces - closeBraces} braces`);
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
          console.log(`[FrInfographicGen V400] Aggressive JSON repair applied`);
          infographicData = JSON.parse(repairedJson);
        } else { throw parseErr; }
      } else { throw parseErr; }
    } catch {
      console.error(`[FrInfographicGen V400] JSON parse failed: ${parseErr.message}`);
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
    console.log(`[FrInfographicGen] Images: ${slidesWithImages}/${slidesNeedingImages} (success=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[FrInfographicGen] Image generation FAILED: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 8: Save to database with locale: 'fr'
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
        locale: 'fr',  // ← French locale
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
      },
    });

    console.log(`[FrInfographicGen] Created: ${infographic.id} — ${validSlides.length} slides — locale=fr — published=${imageGenerationSuccess}`);

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
