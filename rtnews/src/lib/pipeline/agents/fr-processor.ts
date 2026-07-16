// ═══════════════════════════════════════════════════════════════
// French Unified Processor Agent
// Processes French news articles DIRECTLY in French — no translation step.
// This is the French counterpart of en-processor.ts.
//
// Key differences from English processor:
// - French prompts for AI analysis
// - Output fields: titleFr, summaryFr, contentFr (instead of titleEn, etc.)
// - Sets locale: 'fr' and categoryId fields
// - French-specific quality validation
// - LTR layout direction
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { FR_PIPELINE_CONFIG } from '../fr-pipeline-config';
import { isMostlyFrench, isFrenchGarbageContent, isVagueFrenchTitle } from '@/lib/locale';
import { ProcessingStage } from '../queue/job-types';

export interface FrUnifiedResult {
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

// ── French deduplication — removes repeated sentences ──
function deduplicateFrenchContent(text: string): string {
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
      console.warn(`[FrProcessor] Removed duplicate sentence: "${trimmed.slice(0, 60)}..."`);
    } else {
      seen.set(normalized, trimmed);
      result.push(trimmed);
    }
  }

  return result.join('. ').replace(/\.\. /g, '. ').replace(/\s{2,}/g, ' ').trim();
}

// ── French content quality validation ──
function isValidFrenchText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  // Check for reasonable French/Latin character ratio
  const latinChars = (text.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  const frenchRatio = latinChars / totalAlpha;
  return frenchRatio >= FR_PIPELINE_CONFIG.MIN_FRENCH_RATIO;
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
    // French category names
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

export async function processArticleFr(articleId: string): Promise<FrUnifiedResult> {
  const startTime = Date.now();
  const result: FrUnifiedResult = { articleId, success: false, duration: 0, fields: [] };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already fully processed with quality French data
    if (article.aiAnalysis && article.title && article.content && article.locale === 'fr') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // Verify the content is actually French (not Arabic/English contamination)
          const frenchLetterRatio = (parsed.fullContent.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (frenchLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            // Skip to 'analyzed' stage for already-processed FR articles
            await db.newsItem.update({
              where: { id: articleId },
              data: { processingStage: 'analyzed' },
            });
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must reprocess
          console.warn(`[FrProcessor] Article ${articleId} has Arabic-contaminated aiAnalysis (FR ratio: ${frenchLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — reprocessing`);
        }
      } catch {
        // Non-critical: if we can't check existing data, just reprocess
        console.warn(`[FrProcessor] Skip check failed for ${articleId}, reprocessing`);
      }
    }

    // Prepare context — French originals
    const titleFr = article.title || '';
    const summaryFr = article.summary || '';
    const contentFr = article.content || '';
    const category = article.category || 'Économie';

    // ── SINGLE API CALL: Pre-filter + 4 Gates in one prompt (FRENCH) ──
    const unifiedPrompt = `Tu es un analyste financier professionnel et un système de traitement d'actualités financières pour une plateforme d'actualités financières en langue française. Ta tâche est de traiter cet article à travers une porte de filtrage puis 4 portes obligatoires en une seule requête, en produisant le titre, le résumé, le contenu et l'analyse financière complète — TOUT EN FRANÇAIS.

═══ Porte de filtrage — S'agit-il d'actualités financières ? ═══
Cet article a déjà été pré-filtré par un filtre de mots-clés financiers.
Considère qu'il est financier.

❌ NE PAS émettre le statut : "REJECTED" ❌
Rejeter UNIQUEMENT si les DEUX conditions sont remplies :
1. Le sujet n'a AUCUNE relation avec l'économie, les marchés ou les entreprises
2. Il n'y a AUCUN impact potentiel sur un actif financier négociable

En cas de doute — classer en Parcours [C]. ❌ Ne PAS rejeter ❌

═══ Filtre géographique — Priorité ═══
Classifie la priorité géographique :

🔴 Priorité élevée (traitement complet + visibilité page d'accueil) :
- Marchés mondiaux majeurs : États-Unis (Wall Street, Nasdaq, S&P, Fed), Europe (BCE, FTSE, DAX), Asie majeure (Japon/Nikkei, Chine/Shanghai, Corée, Inde)
- Marchés arabes : Arabie Saoudite/Tadawul, EAU/Dubaï, Égypte, Qatar, Koweït, Bahreïn, Oman, Jordanie
- Matières premières mondiales : Pétrole (WTI, Brent), Or (XAU), Argent, Cuivre, OPEP
- Actifs numériques : Bitcoin, Ethereum, Crypto
- Actualités commerciales/tarifaires entre économies majeures

🟡 Priorité basse (traité mais auto-classifié comme "priorité basse") :
- Marchés locaux de pays non arabes et non majeurs
- Si l'article mentionne un pays à faible priorité MAIS est également lié à un marché majeur ← lui donner une priorité élevée

⚠️ Application : Si l'article est géographiquement à faible priorité ← écrire dans le secteur : "Priorité Basse" + impactLevel : "low"

Exemples d'articles ACCEPTÉS (ne jamais rejeter ceux-ci) :
- Sommet Trump-Xi → affecte les marchés et le commerce → Parcours [A]
- Actualités politiques affectant les marchés → Parcours [B]
- Rapports de résultats d'entreprises → Parcours [A]
- Données économiques macro (emploi, IPC, PIB) → Parcours [B]
- Actualités d'entreprise même sans symbole boursier → Parcours [B] ou [C]
- Actualités de commerce international et de tarifs → Parcours [A]
- Actualités technologiques affectant les actions tech → Parcours [B]
- Actualités énergétiques, pétrolières ou métalliques → Parcours [A]
- Tout article d'une source financière qui semble général → Parcours [C]

═══ Porte 0 — Extraction de données brutes ═══
À partir du texte original, extraire :
- Nom de l'entreprise / entité (s'il s'agit de matières premières ou de contrats à terme, écrire le nom du panier, ex. : Pétrole brut WTI, Brent, Or)
- Symbole boursier si trouvé (ex. : AAPL, CL, BZ, IBIT, COIN)
- Bourse / marché de négociation (ex. : NYMEX, COMEX, NYSE, NASDAQ)
- Nombres et pourcentages explicitement mentionnés dans le texte
- Source originale
Si aucun symbole clair trouvé ← noter : "Aucun actif coté confirmé"

═══ Porte 1 — Classification du sujet et détermination du parcours ═══
Déterminer d'abord le public cible :
- Destiné au consommateur individuel (score de crédit, budget, prêts personnels) ? → Secteur = "Finances Personnelles" + Parcours [B] obligatoire
- Destiné au trader/investisseur → poursuivre la classification naturelle

[A] Actualités financières négociables : Entreprise cotée + symbole + événement impactant | Contrats à terme + symbole | ETFs négociables | Fonds Bitcoin (IBIT, FBTC, ARKB...) | Paires Forex | Cryptomonnaies | Entreprises crypto (COIN, MSTR) | Indices | Actualités commerciales/tarifaires entre économies majeures
→ Article complet + analyse complète + scénarios de trading

[B] Économie macro / social / finances personnelles : Phénomènes macro sans actif négociable spécifique | Contenu éducatif grand public
→ Article complet + contexte économique uniquement — PAS de scénarios de trading
  ⚠️ Les actualités économiques macro (chômage, IPC, NFP, PIB, taux de la Fed) affectent fortement les actifs financiers réels ! Les inclure dans les sections [2] et [3] :
    • Dollar américain (DXY) et paires (EUR/USD, USD/JPY, GBP/USD)
    • Obligations du Trésor (TNX, TLT)
    • Or (XAUUSD, GLD)
    • Indices majeurs (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Opérations / entreprises privées / informations limitées
→ Article complet + analyse brève + classification à faible confiance

═══ Porte 2 — Rédiger l'article en français ═══
Rédiger un article professionnel d'actualités financières en français :

⚠️⚠️⚠️ RÈGLE CRITIQUE DES NOMBRES — Les nombres sont sacrés ! ⚠️⚠️⚠️
Chaque nombre du texte original doit apparaître exactement dans la sortie française :
- 16,5 M$ doit rester 16,5 M$ (pas 1,65 M$ !)
- Un BPA de 0,36 $ doit rester 0,36 $
- Ne PAS déplacer la virgule décimale : 16,5 ≠ 1,65 et 0,36 ≠ 3,6
- En cas de doute sur un nombre ← le garder exactement comme écrit dans la source

Règles de rédaction :
1. Titre français : Précis, style journalisme financier professionnel. Inclure les noms d'entreprises + symbole si disponible. Ne PAS ajouter de mots absents de l'original (perte, forte baisse, recul majeur) sauf si explicitement indiqué.
2. Résumé français : Concis et professionnel — une représentation fidèle, pas une réécriture créative.
3. Contenu français : Rédiger un article d'actualité professionnel avec des paragraphes proportionnels au matériel source :
   - Titre uniquement → 1-2 paragraphes
   - Titre + résumé → 2-3 paragraphes
   - Contenu détaillé → jusqu'à 4 paragraphes
   Paragraphe 1 : Événement principal | Paragraphe 2 : Contexte — uniquement si disponible | Paragraphe 3 : Impact — uniquement si disponible | Paragraphe 4 : Perspectives — uniquement si disponible
   ⚠️ Ne PAS inventer des événements, des raisons ou des réactions non mentionnés dans la source !
   ⚠️ Chaque nombre de l'original doit apparaître dans la version française avec exactement la même valeur !

═══ Porte 3 — Analyse (structure en 5 sections) ═══

⚠️ Principe fondamental — taille de l'analyse proportionnelle à la taille de l'actualité :
- Si l'article est court (une déclaration ou un événement unique) → ne pas remplir l'espace avec des répétitions ou du remplissage
- Rédiger une analyse dense et honnête plutôt qu'une analyse longue et artificielle

⚠️ Pas de commentaires internes d'IA :
- Interdit : "Je m'arrête ici", "Note :", "Comme demandé", "Permettez-moi de continuer"
- Le texte final est lu par des investisseurs — aucune trace du processus de génération

Pour le Parcours [C] uniquement — structure brève (2 sections uniquement) :
[1] Ce qui s'est passé — deux phrases uniquement
[5] Pour les traders : "Informations limitées — données insuffisantes pour une analyse fiable"
Interdit pour le Parcours [C] : sections [2] [3] [4]

Pour les Parcours [A] et [B] — structure complète (5 sections) :

[1] Ce qui s'est passé — 4-5 phrases uniquement. Ne PAS répéter ce qui a été écrit dans le champ contenu.
  Contenu obligatoire : Ce qui s'est passé + qui l'a dit (nom complet + titre + organisation) + où et quand précisément.

[2] Pourquoi c'est important — 3-5 phrases expliquant l'importance avec des chiffres réels :
  ⚠️ Ajouter le prix actuel des actifs mentionnés (ex. : "Le BTC se négocie actuellement à 67 500 $")
  ⚠️ Ajouter les capitalisations boursières ou volumes de négociation si mentionnés
  ⚠️ PAS de phrases vides : "renforce la crédibilité du secteur", "ouvre la porte à...", "signale un changement stratégique"
  ⚠️ Les actualités macro (emploi/IPC/NFP/PIB/taux) affectent directement :
    • Chômage ou NFP → USD/DXY + EUR/USD + USD/JPY + Obligations TNX/TLT + Or XAUUSD/GLD
    • IPC ou inflation → USD/DXY + Obligations + Or + Indices (SPY, QQQ)
    • Décision de taux de la Fed → USD + obligations + or + banques (XLF) + immobilier (XLRE)
    • PIB ou croissance économique → USD + indices + secteurs cycliques (XLI) vs défensifs (XLU)

[3] Actifs affectés — liste dense d'actifs réels négociables :
  a. Directement affectés : Nom + Symbole + Bourse + Direction d'impact + Raison spécifique
  b. Effets en cascade : Entreprises/fonds/secteurs spécifiques par nom et symbole
  ⚠️ Pour les actualités macro : NE JAMAIS écrire "non applicable" !
  ⚠️ Ne PAS mettre "haussier" sur chaque actif — être réaliste
  ⚠️ Règle des opinions : Si l'article est une opinion/chronique/éditorial → ne lister que les actifs explicitement nommés dans la source

[4] À surveiller — 3 événements ou indicateurs à venir spécifiques liés à l'actualité :
  ⚠️ Ne pas écrire "surveiller les développements" — être spécifique !
  Exemple correct : "1. Rapport de résultats de PayPal le 15 mars 2. Discours de Jerome Powell le 20 mars 3. Données mensuelles de l'IPC le 12 mars"
  ⚠️ Si vous n'avez pas 3 événements spécifiques ← écrire 1 ou 2 uniquement (ne pas inventer des événements !)

[5] Pour les traders — recommandation proportionnelle à l'importance de l'actualité :
  Pour le Parcours [A] : Recommandation spécifique et actionnable — mais uniquement si l'actualité est suffisante :
    • Si annonce opérationnelle ou données concrètes → recommandation spécifique avec niveau d'entrée + stop loss + objectif
    • Si déclaration préliminaire ou attentes → écrire : "Il s'agit d'une déclaration préliminaire, pas d'une annonce opérationnelle — attendre une confirmation avant d'agir"
    • PAS de recommandation d'achat/vente sans un prix d'entrée numérique spécifique
  Pour le Parcours [B] : "Attendre que les tendances macro deviennent plus claires"
  Pour le Parcours [C] : "Informations limitées — données insuffisantes"

⚠️ Règles de recommandation :
- Positif = acheter ou conserver uniquement — pas de vente
- Négatif = vendre ou conserver uniquement — pas d'achat
- Neutre = conserver uniquement
- PAS de recommandations vides (surveiller les tensions, observer les développements, faire preuve de prudence)

═══ Porte 4 — Vérification finale ═══
□ Chaque nombre du texte original apparaît avec la même valeur dans la sortie française ?
□ Aucune information fabriquée non présente dans le texte original ?
□ Pas de répétition entre contentFr et fullContent ?
□ La recommandation ne contredit-elle pas le sentiment ?
□ Actualités commerciales/tarifaires classées en Parcours [A] ?
□ Actualités crypto classées en Parcours [A] + secteur = "Crypto" ?
□ Si actualité économique macro → avez-vous inclus USD/DXY + Obligations + Or dans la section [2] ?
□ La section [3] mentionne-t-elle les actifs en cascade par type de données macro ?
□ La taille de l'analyse est-elle proportionnelle à la taille de l'actualité ?
□ Si l'actualité est une déclaration, pas une annonce — avez-vous précisé cela dans la section [5] ?
□ Des commentaires internes d'IA dans le texte ? Si oui → supprimer immédiatement
□ fullContent utilise-t-il les sections [1]-[5] (pas [1]-[6]) ?
□ Si l'article est une opinion — la section [3] se limite-t-elle aux actifs explicitement mentionnés dans la source ?
□ Si un contrôle échoue → corriger avant la sortie

═══ Données de l'article ═══
Titre français : ${titleFr}
Résumé français : ${summaryFr.slice(0, 500)}
${contentFr ? `Contenu original français : ${contentFr.slice(0, 4000)}` : ''}
Catégorie actuelle : ${category}

═══ Format de sortie JSON requis ═══
Donner le résultat au format JSON uniquement sans aucun texte supplémentaire :
{
  "titleFr": "Le titre français traité — journalisme financier professionnel — chiffres correspondant à l'original",
  "summaryFr": "Le résumé français — concis et professionnel — chiffres correspondant à l'original",
  "contentFr": "L'article d'actualité français — paragraphes basés sur le matériel source disponible séparés par des sauts de ligne",
  "rawData": {
    "entityNameFr": "Nom de l'entreprise ou du panier en français",
    "ticker": "Symbole boursier ou Aucun actif coté confirmé",
    "exchange": "Nom de la bourse ou marché à terme",
    "figures": ["Nombres et pourcentages du texte original"],
    "source": "Source originale"
  },
  "path": "A ou B ou C",
  "sector": "Le secteur correct en français",
  "sentimentReason": "Justification de la classification du sentiment",
  "editedArticle": "L'article édité avec des paragraphes basés sur la source disponible",
  "fullContent": "[1] Ce qui s'est passé\\n4-5 phrases : L'événement + qui l'a dit + où et quand\\n\\n[2] Pourquoi c'est important\\n3-5 phrases avec des chiffres réels\\n\\n[3] Actifs affectés\\na. Direct + b. Cascade\\n\\n[4] À surveiller\\n1-3 événements à venir spécifiques\\n\\n[5] Pour les traders\\nRecommandation ou attendre",
  "introduction": "2-3 phrases d'introduction",
  "body": "Analyse approfondie de 3-5 paragraphes",
  "conclusion": "Conclusion investissement de 2-3 phrases",
  "summary": "Résumé de l'événement en deux phrases",
  "sentiment": "positive ou negative ou neutral",
  "impactLevel": "high ou medium ou low",
  "keyTakeaways": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "affectedAssets": [
    {"symbol": "Symbole de l'actif", "name": "Nom de l'actif avec symbole", "direction": "up ou down ou neutral", "impactDegree": "high ou medium ou low", "reason": "Raison de l'impact", "isTradable": true}
  ],
  "recommendation": "Recommandation d'investissement nette et spécifique",
  "confidence": "X/10 — justification"
}

Règles strictes :
- Répondre en français uniquement — français financier professionnel
- Ne PAS remplir une section si vous n'avez pas d'information réelle — une section supprimée est meilleure qu'une section hallucinée
- La recommandation est toujours alignée avec la classification
- fullContent doit commencer par [1] et se terminer par [5] pour le Parcours [A] et [B], et contenir uniquement [1] + [5] pour le Parcours [C]
- path doit être "A" ou "B" ou "C" uniquement
- Ne PAS oublier titleFr, summaryFr, et contentFr — ce sont des champs obligatoires !
- contentFr ne contient pas de formatage Markdown — texte brut uniquement avec paragraphes séparés par des sauts de ligne
- Ne PAS répéter une idée plus d'une fois dans toute l'analyse
- Ne PAS dupliquer le texte de l'actualité dans contentFr puis dans fullContent — chaque section apporte de nouvelles informations
- keyTakeaways doivent apporter de nouvelles informations — pas reformuler le titre`;

    const aiResult = await Promise.race([
      chatCompletion([
        {
          role: 'system',
          content: unifiedPrompt,
        },
        {
          role: 'user',
          content: titleFr || summaryFr || 'Article de actualités financières',
        },
      ], { temperature: 0.3, maxTokens: 12000, priority: 'generation', locale: 'fr' }),  // V352: French pipeline — Mistral-first + Bedrock/Gemini fallback
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('French unified processing timeout')), 180000)
      ),
    ]);

    if (!aiResult.content) {
      // V373: Increment retryCount on AI failure so article eventually gets handled
      await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'AI returned empty content' } });
      result.error = 'AI returned empty content';
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[FrProcessor] AI response received: ${aiResult.provider}/${aiResult.model} in ${aiResult.duration}ms, ${aiResult.content.length} chars`);
    // V355: Log first 300 chars of AI response for debugging JSON parse failures
    console.log(`[FrProcessor] AI response preview: ${aiResult.content.slice(0, 300)}`);

    // Parse JSON from AI response
    let parsed = parseAIJson(aiResult.content);
    if (!parsed) {
      // V355: Retry with simplified JSON-only prompt
      console.warn(`[FrProcessor] V355: JSON parse failed for ${articleId} — retrying with simplified prompt`);
      const simplifiedPrompt = `Tu es un analyste financier. Traite cet article et réponds UNIQUEMENT en JSON valide, sans texte avant ou après le JSON.

Titre: ${titleFr}
Résumé: ${summaryFr.slice(0, 500)}
${contentFr ? `Contenu: ${contentFr.slice(0, 2000)}` : ''}

JSON attendu (réponds UNIQUEMENT avec ce JSON, rien d'autre) :
{
  "titleFr": "Titre français professionnel",
  "summaryFr": "Résumé français concis",
  "contentFr": "Article professionnel en français (au moins 200 caractères)",
  "rawData": {"entityNameFr": "Nom", "ticker": "Symbole ou aucun", "exchange": "Bourse", "figures": [], "source": "${article.source || 'Source'}"},
  "path": "C",
  "sector": "Secteur financier",
  "sentimentReason": "Raison",
  "editedArticle": "Article édité",
  "fullContent": "[1] Ce qui s'est passé\\nRésumé\\n\\n[5] Pour les traders\\nAttendre",
  "introduction": "Intro",
  "body": "Analyse",
  "conclusion": "Conclusion",
  "summary": "Résumé",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Point 1"],
  "affectedAssets": [],
  "recommendation": "Attendre des données supplémentaires",
  "confidence": "3/10"
}`;

      try {
        const retryAiResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: simplifiedPrompt },
            { role: 'user', content: 'Génère le JSON maintenant.' },
          ], { temperature: 0.1, maxTokens: 4000, priority: 'generation', locale: 'fr' }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Simplified prompt timeout')), 120000)
          ),
        ]);

        if (retryAiResult.content) {
          console.log(`[FrProcessor] V355: Simplified retry response: ${retryAiResult.content.slice(0, 300)}`);
          parsed = parseAIJson(retryAiResult.content);
        }
      } catch (retryErr: any) {
        console.warn(`[FrProcessor] V355: Simplified retry also failed: ${retryErr.message}`);
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
      const reason = parsed.reason || 'Article non financier';
      console.log(`[FrProcessor] AI tried to REJECT article ${articleId}: "${reason}" — retrying once`);

      const noRejectPrompt = `Tu es un analyste financier professionnel pour une plateforme d'actualités financières en langue française. ❌ Ne PAS rejeter cet article ❌

Cet article a été pré-filtré par un filtre de mots-clés financiers et provient d'une source fiable. Tu DOIS le traiter.
Le classer en Parcours [C] si tu ne trouves pas suffisamment de données, mais ❌ ne PAS émettre le statut : "REJECTED" ❌

⚠️ Règle d'or : Rédiger UNIQUEMENT des informations réelles du texte original. Ne PAS inventer de chiffres, noms ou événements.

Donner le résultat au format JSON uniquement :
{
  "titleFr": "Le titre français — traduction fidèle de la source",
  "summaryFr": "Résumé français — uniquement à partir du texte original",
  "contentFr": "Article d'actualité français professionnel — au moins 200 caractères — traduire de l'original, ne pas inventer",
  "rawData": {"entityNameFr": "Nom de l'entité", "ticker": "Symbole ou aucun", "exchange": "Bourse", "figures": ["Chiffres du texte"], "source": "Source"},
  "path": "C",
  "sector": "Secteur",
  "sentimentReason": "Raison du sentiment",
  "editedArticle": "Article édité",
  "fullContent": "[1] Ce qui s'est passé\\nRésumé en deux phrases\\n\\n[5] Pour les traders\\nInformations limitées",
  "introduction": "Introduction",
  "body": "Analyse",
  "conclusion": "Conclusion",
  "summary": "Résumé",
  "sentiment": "neutral",
  "impactLevel": "low",
  "keyTakeaways": ["Point du texte"],
  "affectedAssets": [],
  "recommendation": "Informations limitées — données insuffisantes",
  "confidence": "3/10"
}

Titre français : ${titleFr}
Résumé français : ${summaryFr.slice(0, 500)}
${contentFr ? `Contenu français : ${contentFr.slice(0, 3000)}` : ''}`;

      try {
        const retryResult = await Promise.race([
          chatCompletion([
            { role: 'system', content: noRejectPrompt },
            { role: 'user', content: titleFr || summaryFr || 'Actualités financières' },
          ], { temperature: 0.3, maxTokens: 4000, priority: 'generation', locale: 'fr' }),  // V352: French pipeline — Mistral-first + fallback
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('FrProcessor no-reject retry timeout')), 60000)
          ),
        ]);

        const retryParsed = parseAIJson(retryResult.content);
        if (retryParsed && !retryParsed.status && retryParsed.titleFr && retryParsed.contentFr
            && isValidFrenchText(retryParsed.titleFr)
            && isValidFrenchText(retryParsed.contentFr, 80)) {
          console.log(`[FrProcessor] No-reject retry SUCCEEDED for ${articleId}`);
          parsed = { ...parsed, ...retryParsed };
          if (!parsed.path) parsed.path = 'C';
          if (!parsed.sector) parsed.sector = category || 'Économie';
        } else {
          console.log(`[FrProcessor] No-reject retry produced insufficient data for ${articleId} — SKIPPING`);
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
        console.warn(`[FrProcessor] No-reject retry FAILED for ${articleId}: ${retryErr.message} — SKIPPING`);
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

    // 1. title (French title — stored in `title` field for French articles)
    if (parsed.titleFr && typeof parsed.titleFr === 'string' && isValidFrenchText(parsed.titleFr, FR_PIPELINE_CONFIG.MIN_FR_TITLE_LENGTH)) {
      // V373: DRAMATICALLY relaxed French language check — threshold 0.05 (was 0.20)
      // Root cause of FR pipeline blockage: AI processes French RSS content but sometimes
      // outputs lose French accents or use English financial terminology.
      // Only reject if the text is CLEARLY Arabic (not just lacking French accents).
      const titleIsMostlyArabic = (() => {
        const arabicChars = (parsed.titleFr.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (parsed.titleFr.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
        const total = arabicChars + latinChars;
        if (total === 0) return false; // No alpha chars at all — don't reject
        return (arabicChars / total) > 0.5; // Only reject if >50% Arabic
      })();
      if (titleIsMostlyArabic) {
        console.warn(`[FrProcessor V373] Title rejected — mostly Arabic: "${parsed.titleFr.slice(0, 60)}"`);
        // Increment retryCount so article eventually gets properly handled
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'Title mostly Arabic, not French' } });
        result.error = 'Title failed French language quality check — mostly Arabic';
        result.duration = Date.now() - startTime;
        return result;
      }
      // V373: Even more relaxed vague title check — only reject if title is truly meaningless
      // AND very short (less than 10 chars instead of 20)
      // French financial titles can be concise (e.g., "Air France: résultat Q1")
      if (isVagueFrenchTitle(parsed.titleFr) && parsed.titleFr.length < 10) {
        console.warn(`[FrProcessor V373] Title rejected — too vague AND very short: "${parsed.titleFr.slice(0, 60)}"`);
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: 'Title too vague for French news' } });
        result.error = 'Title too vague for French news';
        result.duration = Date.now() - startTime;
        return result;
      }
      let titleFrCleaned = parsed.titleFr.trim();

      // Number integrity check — verify numbers in French title match original
      if (titleFr) {
        const frNumbers = titleFr.match(/\d+(?:[.,]\d+)?/g) || [];
        for (const num of frNumbers) {
          const numVal = parseFloat(num.replace(',', '.'));
          if (isNaN(numVal) || numVal < 1) continue;
          if (!titleFrCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (titleFrCleaned.includes(shifted)) {
              console.warn(`[FrProcessor] DECIMAL SHIFT in title: "${num}" became "${shifted}"! Fixing...`);
              titleFrCleaned = titleFrCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.title = titleFrCleaned;
      fields.push('title');
    }

    // 2. summary (French summary)
    if (parsed.summaryFr && typeof parsed.summaryFr === 'string' && isValidFrenchText(parsed.summaryFr, FR_PIPELINE_CONFIG.MIN_FR_SUMMARY_LENGTH)) {
      let summaryFrCleaned = parsed.summaryFr.trim();

      // Number integrity check for summary
      if (summaryFr) {
        const frNumbers = summaryFr.match(/\d+(?:[.,]\d+)?/g) || [];
        for (const num of frNumbers) {
          const numVal = parseFloat(num.replace(',', '.'));
          if (isNaN(numVal) || numVal < 1) continue;
          if (!summaryFrCleaned.includes(num)) {
            const shifted = (numVal / 10).toString();
            if (summaryFrCleaned.includes(shifted)) {
              console.warn(`[FrProcessor] DECIMAL SHIFT in summary: "${num}" → "${shifted}"! Fixing...`);
              summaryFrCleaned = summaryFrCleaned.replace(shifted, num);
            }
          }
        }
      }

      updateData.summary = summaryFrCleaned;
      fields.push('summary');
    }

    // 3. content (French content)
    const effectiveMinContentLength = parsed.path === 'C'
      ? 80   // Path C — brief analysis
      : FR_PIPELINE_CONFIG.MIN_FR_CONTENT_LENGTH;
    if (parsed.contentFr && typeof parsed.contentFr === 'string' && parsed.contentFr.length >= effectiveMinContentLength && isValidFrenchText(parsed.contentFr, effectiveMinContentLength)) {
      let contentFr = parsed.contentFr.trim();
      contentFr = stripMarkdown(contentFr);
      contentFr = deduplicateFrenchContent(contentFr);
      // V373: Only reject garbage content if it's very short AND clearly boilerplate
      // Increased threshold from 300 to 100 chars — many valid French RSS summaries are short
      if (isFrenchGarbageContent(contentFr) && contentFr.length < 100) {
        console.warn(`[FrProcessor V373] Content rejected — garbage/boilerplate detected for ${articleId} (${contentFr.length} chars)`);
        await db.newsItem.update({ where: { id: articleId }, data: { retryCount: { increment: 1 }, lastError: `French content quality check failed — garbage/boilerplate (${contentFr.length} chars)` } });
        result.error = 'French content quality check failed — garbage/boilerplate detected';
        result.duration = Date.now() - startTime;
        return result;
      }
      if (contentFr.length >= effectiveMinContentLength) {
        updateData.content = contentFr;
        fields.push('content');
      }
    }

    // 4. slug (generate with random suffix to reduce collisions)
    if (!article.slug && updateData.title) {
      updateData.slug = generateSlug(updateData.title); // Now includes random 4-char suffix
      fields.push('slug');
    }

    // 5. locale — always set to 'fr' for French pipeline
    updateData.locale = 'fr';
    fields.push('locale');

    // 6. categoryId — V375: Improved sector classification
    // The AI often outputs generic sectors like "Économie" or "Finance" regardless
    // of the actual content. We now prefer the ORIGINAL RSS feed category as the
    // primary source, and only use the AI's sector if the original was generic.
    const originalCategoryId = article.categoryId || '';
    const originalCategoryFrench = article.category || '';
    const aiCategoryId = mapCategoryToId(parsed.sector || category);

    // V375: Prefer original RSS category over AI sector — RSS feeds are pre-classified
    // by topic (stocks, forex, crypto, energy, etc.) which is more accurate than
    // the AI's generic "Économie" classification.
    // Only use AI sector if the original category is missing or is generic (economy/Économie).
    const GENERIC_CATEGORY_IDS = ['economy', ''];
    const isOriginalGeneric = GENERIC_CATEGORY_IDS.includes(originalCategoryId);
    const isAiSpecific = !GENERIC_CATEGORY_IDS.includes(aiCategoryId);

    let categoryId: string;
    if (!isOriginalGeneric && originalCategoryId) {
      // Original RSS category is specific (stocks, forex, crypto, etc.) — USE IT
      categoryId = originalCategoryId;
      console.log(`[FrProcessor V375] Using original RSS category '${originalCategoryId}' (AI suggested '${aiCategoryId}')`);
    } else if (isAiSpecific) {
      // Original was generic but AI suggests a specific category — use AI
      categoryId = aiCategoryId;
      console.log(`[FrProcessor V375] Using AI category '${aiCategoryId}' (original was generic '${originalCategoryId}')`);
    } else {
      // Both are generic — keep as economy
      categoryId = aiCategoryId;
    }

    updateData.categoryId = categoryId;
    fields.push('categoryId');

    // 7. Update category to French name
    updateData.category = FR_PIPELINE_CONFIG.CATEGORY_MAP_FR[categoryId] || parsed.sector || originalCategoryFrench || 'Économie';
    fields.push('category');

    // 8. aiAnalysis — reconstruct in the format expected by the rest of the pipeline
    if (parsed.path && parsed.fullContent) {
      let fullContent = parsed.fullContent || '';
      let editedArticle = parsed.editedArticle || '';
      let introduction = parsed.introduction || '';
      let body = parsed.body || '';
      let conclusion = parsed.conclusion || '';
      let recommendation = parsed.recommendation || '';

      // Remove French forbidden phrases
      const FORBIDDEN_FR = [
        'selon des sources', 'on rapporte que', 'il semblerait que',
        'rumeurs', 'non confirmé', 'il est à noter que',
        'il convient de noter que', 'il faut noter que',
        'sans aucun doute', 'il va sans dire',
        'comme tout le monde le sait', 'de toute évidence',
        'bien sûr,', 'évidemment,',
        'surveiller les développements', 'observer de près',
        'faire preuve de prudence', 'rester prudent',
        'restez à l\'écoute', 'garder un œil sur',
        'l\'avenir nous le dira', 'seul l\'avenir nous le dira',
        'le jury est encore en délibéré',
      ];

      for (const phrase of FORBIDDEN_FR) {
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
        locale: 'fr',
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
        const articleTextForVerify = `${titleFr || ''} ${summaryFr || ''} ${parsed.fullContent || ''} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
        const COMMODITY_KW: Record<string, string[]> = {
          XAUUSD: ['gold', 'xau', 'or', 'métal précieux'], XAGUSD: ['silver', 'xag', 'argent', 'métal précieux'],
          CL: ['oil', 'crude', 'wti', 'pétrole', 'brent', 'opec'], BZ: ['brent', 'oil', 'pétrole', 'crude'],
          BTCUSD: ['bitcoin', 'btc', 'crypto'], ETHUSD: ['ethereum', 'eth', 'crypto'],
          EURUSD: ['euro', 'eur/usd', 'eurusd'], GBPUSD: ['pound', 'sterling', 'livre'],
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
      await db.newsItem.update({
        where: { id: articleId },
        data: updateData,
      });
    }

    // ── Advance processing stage ──
    // FR processor does content + analysis + sentiment + assets in ONE call.
    // It must jump to 'analyzed' stage so the imager can pick it up next.
    await db.newsItem.update({
      where: { id: articleId },
      data: { processingStage: 'analyzed' },
    });
    console.log(`[FrProcessor] Article ${articleId}: ${article.processingStage} → analyzed (FR multi-stage skip)`);

    result.success = true;
    result.fields = fields;
    result.duration = Date.now() - startTime;
    console.log(`[FrProcessor] ✓ Processed ${articleId} in ${result.duration}ms — fields: ${fields.join(', ')}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[FrProcessor] Fatal error for ${articleId}:`, err.message);
    return result;
  }
}
