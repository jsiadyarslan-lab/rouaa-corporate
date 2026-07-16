// ═══════════════════════════════════════════════════════════════
// French 4-Gates Analyzer Agent
// Performs the 4-Gates financial analysis in French.
// This is the French counterpart of en-analyzer.ts.
//
// Key differences from English analyzer:
// - French prompts for financial analysis
// - French-specific forbidden phrases and vague patterns
// - Validates French content quality
// - Same JSON structure but with French content
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { FR_PIPELINE_CONFIG } from '../fr-pipeline-config';
import { isMostlyFrench, isFrenchGarbageContent, isVagueFrenchTitle } from '@/lib/locale';
import { ProcessingStage } from '../queue/job-types';

export interface FrAnalysisResult {
  articleId: string;
  success: boolean;
  duration: number;
  error?: string;
}

// ── French forbidden phrases to auto-remove from AI output ──
const FORBIDDEN_PHRASES_FR = [
  // Vague/generic investor advice
  'il est à noter que',
  'il convient de noter que',
  'il faut noter que',
  'selon des sources',
  'on rapporte que',
  'on dit que',
  'il semblerait que',
  'sans aucun doute',
  'il va sans dire',
  'comme tout le monde le sait',
  // Empty hedging
  'surveiller les développements',
  'observer de près',
  'faire preuve de prudence',
  'rester prudent',
  'restez à l\'écoute',
  'garder un œil sur',
  'l\'avenir nous le dira',
  // Overly speculative hedging
  'seul l\'avenir nous le dira',
  'le jury est encore en délibéré',
  'rumeurs',
  'non confirmé',
];

// ── Vague/non-tradeable asset names to filter from affectedAssets ──
const VAGUE_ASSET_PATTERNS_FR = [
  /relations commerciales/i,
  /économie mondiale/i,
  /marché mondial/i,
  /commerce mondial/i,
  /macroéconomie/i,
  /marchés financiers/i,
  /marchés mondiaux/i,
  /secteur financier/i,
  /relations internationales/i,
  /tensions commerciales/i,
  /guerre commerciale/i,
  /commerce international/i,
  /système financier/i,
  /chaîne d'approvisionnement/i,
];

// ── French speculative words/phrases ──
const STRONG_SPECULATIVE_PHRASES_FR = [
  'pourrait potentiellement', 'pourrait entraîner', 'pourrait connaître',
  'pourrait atteindre', 'pourrait baisser', 'pourrait augmenter',
  'pourrait affecter', 'pourrait conduire à', 'pourrait être affecté',
  'risque de', 'on s\'attend à', 'les analystes prévoient',
  'il est possible que', 'est susceptible de',
  'est attendu à', 'pourrait se produire', 'risque d\'advenir',
];

const WEAK_SPECULATIVE_WORDS_FR = [
  'peut-être', 'probablement', 'éventuellement', 'possiblement', 'semble',
  'semble-t-il', 'présumément', 'soi-disant', 'paraît-il',
  'selon certaines sources', 'à ce qu\'on dit',
];

// ── Sell/buy keywords in French recommendations ──
const SELL_KEYWORDS_FR = [
  'vendre', 'vente', 'baissier', 'position courte', 'couvrir',
  'réduire', 'position de vente', 'parier à la baisse',
  'cible de baisse', 'prendre position courte', 'vendre à découvert',
  'éviter', 'sortir', 'réduire l\'exposition',
];

const BUY_KEYWORDS_FR = [
  'acheter', 'achat', 'haussier', 'position longue', 'accumuler',
  'sous-évalué', 'position d\'achat', 'parier à la hausse',
  'cible de hausse', 'prendre position longue',
  'ajouter à la position', 'entrer',
];

// ── French content quality validation ──
function isValidFrenchText(text: string, minLength: number = 10): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < minLength) return false;
  const latinChars = (text.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length;
  const totalAlpha = latinChars + (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (totalAlpha === 0) return false;
  return (latinChars / totalAlpha) >= FR_PIPELINE_CONFIG.MIN_FRENCH_RATIO;
}

// ── French text deduplication ──
function deduplicateFrenchText(text: string): string {
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

// ── Speculation detection (French) ──
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
export function detectSpeculationFr(content: string, blockThreshold?: number): SpeculationReport {
  if (!content || content.trim().length < 50) {
    return {
      speculationScore: 0,
      speculationWordCount: 0,
      totalWordCount: 0,
      hasSpecificNumbers: false,
      shouldRepublish: false,
      shouldNotPublish: false,
      reason: 'Contenu trop court pour l\'analyse de spéculation',
    };
  }

  let speculationWordCount = 0;

  // Count strong speculative phrases (each counts as 2)
  for (const phrase of STRONG_SPECULATIVE_PHRASES_FR) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    if (matches) {
      speculationWordCount += matches.length * 2;
    }
  }

  // Count weak speculative words (each counts as 1)
  for (const word of WEAK_SPECULATIVE_WORDS_FR) {
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
  const numberPatterns = content.match(/\d+[\.,]?\d*\s*%|[\d,]+\s*(?:milliard|million|mille|millier|billion)|\d+[\.,]?\d*|\$[\d,]+/g) || [];
  const hasSpecificNumbers = numberPatterns.length >= 3;

  const effectiveBlockThreshold = blockThreshold ?? FR_PIPELINE_CONFIG.SPECULATION_BLOCK_THRESHOLD;
  const shouldRepublish = speculationWordCount > FR_PIPELINE_CONFIG.SPECULATION_REPUBLISH_THRESHOLD;
  const shouldNotPublish = speculationWordCount > effectiveBlockThreshold && !hasSpecificNumbers;

  let reason = 'Le contenu est basé sur des données';
  if (shouldNotPublish) {
    reason = `Spéculation excessive : ${speculationWordCount} mots spéculatifs. Le contenu manque de données réelles.`;
  } else if (shouldRepublish) {
    reason = `Spéculation élevée : ${speculationWordCount} mots spéculatifs. Devrait être régénéré avec plus de données.`;
  } else if (!hasSpecificNumbers) {
    reason = `Nombre de mots spéculatifs faible (${speculationWordCount}) mais aucun chiffre spécifique trouvé — le contenu peut être vague.`;
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
function validateSentimentRecommendationFr(sentiment: string, recommendation: string): string {
  if (!recommendation || !sentiment) return recommendation;

  const recLower = recommendation.toLowerCase();
  const hasSell = SELL_KEYWORDS_FR.some(kw => recLower.includes(kw));
  const hasBuy = BUY_KEYWORDS_FR.some(kw => recLower.includes(kw));

  // Positive sentiment + sell recommendation = contradiction
  if (sentiment === 'positive' && hasSell) {
    console.warn(`[FrAnalyzer] Sentiment-recommendation contradiction: positive sentiment + sell recommendation. Fixing...`);
    return recommendation.replace(/\bvendre\b|\bvente\b|\bbaissier\b|\bcouvrir\b|\bréduire\b/gi, 'conserver');
  }

  // Negative sentiment + buy recommendation = contradiction
  if (sentiment === 'negative' && hasBuy) {
    console.warn(`[FrAnalyzer] Sentiment-recommendation contradiction: negative sentiment + buy recommendation. Fixing...`);
    return recommendation.replace(/\bacheter\b|\bachat\b|\bhaussier\b|\baccumuler\b|\bentrer\b/gi, 'conserver');
  }

  return recommendation;
}

export async function analyzeArticleFr(articleId: string): Promise<FrAnalysisResult> {
  const startTime = Date.now();
  const result: FrAnalysisResult = { articleId, success: false, duration: 0 };

  try {
    const article = await db.newsItem.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      result.error = 'Article not found';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Skip if already has quality French analysis
    if (article.aiAnalysis && article.aiAnalysis.length > 100 && article.locale === 'fr') {
      try {
        const parsed = typeof article.aiAnalysis === 'string' ? JSON.parse(article.aiAnalysis) : article.aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 100 && parsed.path && ['A', 'B', 'C'].includes(parsed.path)) {
          // Verify the content is actually French (not Arabic contamination)
          const frenchLetterRatio = (parsed.fullContent.match(/[a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          const arabicLetterRatio = (parsed.fullContent.match(/[\u0600-\u06FF]/g) || []).length / Math.max(parsed.fullContent.length, 1);
          if (frenchLetterRatio > 0.1 && arabicLetterRatio < 0.3) {
            const { advanceStage } = await import('../queue/job-manager');
            await advanceStage(articleId, article.processingStage as ProcessingStage);
            result.success = true;
            result.duration = Date.now() - startTime;
            return result;
          }
          // Content is contaminated with Arabic — must re-analyze
          console.warn(`[FrAnalyzer] Article ${articleId} has Arabic-contaminated aiAnalysis (FR ratio: ${frenchLetterRatio.toFixed(2)}, AR ratio: ${arabicLetterRatio.toFixed(2)}) — re-analyzing`);
        }
      } catch { /* re-analyze */ }
    }

    // Prepare context
    const title = article.title || '';
    const summary = article.summary || '';
    const content = article.content || '';
    const category = article.category || 'Économie';

    const analysisPrompt = `Tu es un analyste financier professionnel et un système d'analyse d'actualités financières. Traite cet article à travers 4 portes obligatoires dans l'ordre, puis donne le résultat en JSON uniquement — TOUT EN FRANÇAIS.

═══ Porte 0 — Extraction de données brutes ═══
À partir du texte original, extraire :
- Nom de l'entreprise / entité
- Symbole boursier si trouvé (ex. : AAPL, CL, BZ, IBIT, COIN)
- Bourse / marché de négociation (ex. : NYMEX, COMEX, NYSE, NASDAQ)
- Nombres et pourcentages explicitement mentionnés
- Source originale
Si aucun symbole clair trouvé ← noter : "Aucun actif coté confirmé"

═══ Porte 1 — Classification du sujet et détermination du parcours ═══
Déterminer d'abord le public cible :
- Orienté consommateur (score de crédit, budget, prêts personnels) ? → Secteur = "Finances Personnelles" + Parcours [B]
- Orienté trader/investisseur → poursuivre la classification naturelle

[A] Actualités financières négociables : Entreprise cotée + symbole + événement impactant | Contrats à terme + symbole | ETFs négociables | Fonds Bitcoin (IBIT, FBTC, ARKB...) | Paires Forex | Cryptomonnaies | Entreprises crypto (COIN, MSTR) | Indices | Actualités commerciales/tarifaires
→ Article complet + analyse complète + scénarios de trading

[B] Économie macro / social / finances personnelles : Phénomènes macro sans actif négociable spécifique | Contenu éducatif grand public
→ Article complet + contexte économique uniquement — PAS de scénarios de trading
  ⚠️ Les actualités économiques macro (chômage, IPC, NFP, PIB, taux de la Fed) affectent directement :
    • Dollar américain (DXY) et paires (EUR/USD, USD/JPY, GBP/USD)
    • Obligations du Trésor (TNX, TLT)
    • Or (XAUUSD, GLD)
    • Indices majeurs (S&P 500/SPY, Nasdaq/QQQ, Dow/DIA)

[C] Opérations / entreprises privées / informations limitées
→ Article complet + analyse brève + classification à faible confiance

═══ Porte 2 — Qualité de l'article français ═══
S'assurer que le contenu de l'article est :
- Français financier professionnel
- Les chiffres correspondent exactement à la source originale
- Aucune information fabriquée
- Structure de paragraphe appropriée
- Pas de répétition entre les sections

═══ Porte 3 — Analyse financière en 5 sections ═══

Pour le Parcours [C] uniquement (2 sections) :
[1] Ce qui s'est passé — deux phrases uniquement
[5] Pour les traders : "Informations limitées — données insuffisantes pour une analyse fiable"

Pour les Parcours [A] et [B] (5 sections) :

[1] Ce qui s'est passé — 4-5 phrases uniquement. Inclure qui a dit quoi (nom complet + titre + organisation) + où et quand.

[2] Pourquoi c'est important — 3-5 phrases avec des chiffres réels :
  ⚠️ Ajouter les prix actuels des actifs mentionnés
  ⚠️ Ajouter les capitalisations boursières ou volumes si mentionnés
  ⚠️ Les actualités macro affectent : USD/DXY, Obligations, Or, Indices

[3] Actifs affectés — liste dense d'actifs réels négociables :
  a. Directement affectés : Nom + Symbole + Bourse + Direction + Raison
  b. Effets en cascade : Entreprises/fonds/secteurs spécifiques

[4] À surveiller — 3 événements ou indicateurs à venir spécifiques :
  ⚠️ Être spécifique ! Pas "surveiller les développements"

[5] Pour les traders — recommandation :
  Parcours [A] : Spécifique avec entrée + stop loss + objectif (si les données le permettent)
  Parcours [B] : "Attendre que les tendances macro deviennent plus claires"
  Parcours [C] : "Informations limitées — données insuffisantes"

═══ Porte 4 — Vérification finale ═══
□ Les chiffres correspondent à l'original ?
□ Aucune information fabriquée ?
□ Pas de répétition ?
□ Alignement sentiment-recommandation ?
□ Classification de parcours appropriée ?

═══ Données de l'article ═══
Titre : ${title}
Résumé : ${summary.slice(0, 500)}
${content ? `Contenu : ${content.slice(0, 4000)}` : ''}
Catégorie : ${category}

═══ Sortie JSON requise ═══
{
  "rawData": {"entityNameFr": "Nom de l'entité", "ticker": "Symbole ou aucun", "exchange": "Bourse", "figures": ["Chiffres"], "source": "Source"},
  "path": "A ou B ou C",
  "sector": "Secteur en français",
  "sentimentReason": "Justification du sentiment",
  "editedArticle": "Texte de l'article édité — CONTENU RÉEL, pas d'espaces réservés",
  "fullContent": "[1] Ce qui s'est passé\\nLes actions d'Advanced Micro Devices (AMD) ont chuté de 2,06% à 521,58 dollars mardi après l'annonce de l'acquisition de MEXT, une startup d'optimisation de mémoire.\\n\\n[2] Pourquoi c'est important\\nCette acquisition signale la poussée d'AMD dans l'optimisation de la mémoire, un front compétitif contre NVIDIA.\\n\\n[3] Actifs affectés\\n- AMD (NASDAQ: AMD) — impact direct, baissier à court terme\\n\\n[4] À surveiller\\nLe calendrier d'intégration et toute révision des prévisions par la direction d'AMD.\\n\\n[5] Pour les traders\\nMaintenir une position courte près de 520 dollars avec stop-loss à 540, objectif 480.",
  "introduction": "2-3 phrases d'introduction — CONTENU RÉEL",
  "body": "Analyse de 3-5 paragraphes — CONTENU RÉEL",
  "conclusion": "Conclusion investissement de 2-3 phrases — CONTENU RÉEL",
  "summary": "Résumé de l'événement en deux phrases — CONTENU RÉEL",
  "sentiment": "positive ou negative ou neutral",
  "impactLevel": "high ou medium ou low",
  "keyTakeaways": ["Point 1 — CONTENU RÉEL", "Point 2 — CONTENU RÉEL", "Point 3 — CONTENU RÉEL"],
  "affectedAssets": [
    {"symbol": "Symbole", "name": "Nom avec symbole", "direction": "up ou down ou neutral", "impactDegree": "high ou medium ou low", "reason": "Raison", "isTradable": true}
  ],
  "recommendation": "Recommandation d'investissement nette et spécifique — CONTENU RÉEL",
  "confidence": "X/10 — justification"
}

⚠️ CRITIQUE : Remplacez TOUS les espaces réservés "..." par du CONTENU RÉEL basé sur les données de l'article.
L'exemple ci-dessus montre du contenu réel, pas des stubs de modèle.
Produire "[1] Ce qui s'est passé\\n..." avec "..." littéral est INTERDIT —
chaque section DOIT contenir du texte d'analyse réel basé sur l'article.
Si vous ne pouvez pas remplir une section avec des informations réelles, écrivez « Données insuffisantes pour cette section » au lieu de « ... ».

Règles :
- Français uniquement — français financier professionnel
- Ne PAS remplir les sections sans information réelle
- La recommandation est alignée avec le sentiment
- fullContent utilise [1]-[5] pour le Parcours [A]/[B], uniquement [1]+[5] pour le Parcours [C]
- path doit être "A", "B", ou "C" uniquement
- Pas de répétition entre les sections
- keyTakeaways apportent de nouvelles informations — pas de reformulation`;

    const aiResult = await Promise.race([
      chatCompletion([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: title || summary || 'Article de actualités financières' },
      ], { temperature: 0.3, maxTokens: 10000, priority: 'generation', locale: 'fr' }),  // V352: French pipeline — Mistral-first + fallback
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('French analysis timeout')), 120000)
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

    for (const phrase of FORBIDDEN_PHRASES_FR) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      fullContent = fullContent.replace(re, '');
      recommendation = recommendation.replace(re, '');
    }

    // Deduplicate
    fullContent = fixArabicNumbers(deduplicateFrenchText(fullContent));

    // V1045: Reject template-placeholder fullContent
    const PLACEHOLDER_PATTERNS = [
      /\[\d+\][^\n]*\n\s*\.\.\./,
      /\[\d+\][^\n]*\n\s*\.\.\.\s*\n\s*\[\d+\]/,
      /^[^[]{0,30}\[\d+\][^[]{0,30}\n\.\.\.\n/gm,
    ];
    const hasPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(fullContent));
    if (hasPlaceholder || fullContent.length < 200) {
      console.warn(`[FrAnalyzer V1045] Article ${articleId} has template-placeholder or too-short fullContent (len=${fullContent.length}) — rejecting`);
      const { recordError } = await import('../queue/job-manager');
      await recordError(articleId, `V1045: fullContent template placeholder ou trop court (${fullContent.length} chars)`);
      result.error = 'Template placeholder fullContent';
      result.duration = Date.now() - startTime;
      return result;
    }

    // Validate sentiment-recommendation alignment
    recommendation = fixArabicNumbers(validateSentimentRecommendationFr(parsed.sentiment || 'neutral', recommendation));

    // Speculation check
    const specReport = detectSpeculationFr(fullContent);
    if (specReport.shouldNotPublish) {
      console.warn(`[FrAnalyzer] Article ${articleId} blocked by speculation gate: ${specReport.reason}`);
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
        return !VAGUE_ASSET_PATTERNS_FR.some(pattern => pattern.test(name));
      });
    }

    // ── Verify asset-content relevance ──
    // Remove assets that are NOT mentioned in the article content.
    // This prevents mis-tagging (e.g., an article about TXN tagged with XAUUSD).
    if (Array.isArray(affectedAssets) && affectedAssets.length > 0) {
      const articleText = `${title} ${summary} ${fullContent} ${parsed.body || ''} ${parsed.introduction || ''}`.toLowerCase();
      const COMMODITY_KEYWORDS: Record<string, string[]> = {
        XAUUSD: ['gold', 'xau', 'or', 'precious metal', 'safe haven', 'métal précieux'],
        XAGUSD: ['silver', 'xag', 'argent', 'métal précieux'],
        CL: ['oil', 'crude', 'wti', 'pétrole', 'brent', 'opec'],
        BZ: ['brent', 'oil', 'pétrole', 'crude'],
        BTCUSD: ['bitcoin', 'btc', 'cryptocurrency', 'crypto', 'cryptomonnaie'],
        ETHUSD: ['ethereum', 'eth', 'cryptocurrency', 'crypto'],
        EURUSD: ['euro', 'eur/usd', 'eurusd'],
        GBPUSD: ['pound', 'sterling', 'livre', 'gbp/usd'],
        USDJPY: ['yen', 'jpy', 'usd/jpy'],
      };
      affectedAssets = affectedAssets.filter((asset: any) => {
        const sym = (asset.symbol || '').toUpperCase();
        const assetName = (asset.name || '').toLowerCase();
        if (/^[A-Z]{1,5}$/.test(sym) && sym.length <= 5 && !COMMODITY_KEYWORDS[sym]) {
          const tickerMatch = articleText.includes(sym.toLowerCase());
          const nameMatch = assetName && articleText.includes(assetName.toLowerCase());
          if (!tickerMatch && !nameMatch) {
            console.warn(`[FrAnalyzer] Removing unrelated asset ${sym} from article ${articleId} — not found in content`);
            return false;
          }
        }
        const keywords = COMMODITY_KEYWORDS[sym];
        if (keywords) {
          const hasKeyword = keywords.some(kw => articleText.includes(kw.toLowerCase()));
          if (!hasKeyword && !articleText.includes(sym.toLowerCase())) {
            console.warn(`[FrAnalyzer] Removing unrelated commodity ${sym} from article ${articleId} — not found in content`);
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
      locale: 'fr',
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
      locale: 'fr',
    };

    if (parsed.sentiment) updateData.sentiment = parsed.sentiment;
    if (parsed.impactLevel) updateData.impactLevel = parsed.impactLevel;
    if (parsed.sector) {
      const categoryMap: Record<string, string> = FR_PIPELINE_CONFIG.CATEGORY_MAP_FR;
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
    console.log(`[FrAnalyzer] ✓ Analyzed ${articleId} in ${result.duration}ms — path: ${parsed.path}, sentiment: ${parsed.sentiment}`);
    return result;
  } catch (err: any) {
    result.error = err.message;
    result.duration = Date.now() - startTime;
    console.error(`[FrAnalyzer] Fatal error for ${articleId}:`, err.message);
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
