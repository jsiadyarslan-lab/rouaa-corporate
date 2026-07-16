// ─── Context-Aware AI Translation Endpoint ─────────────────────
// Used by the ContextAwareAITranslation revolutionary widget
// Provides financial-domain-aware translation between languages

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

const DOMAIN_GLOSSARY: Record<string, Record<string, string>> = {
  'en-fr': {
    'bullish': 'haussier', 'bearish': 'baissier', 'neutral': 'neutre',
    'confidence': 'confiance', 'recommendation': 'recommandation',
    'stop loss': 'stop loss', 'target': 'objectif', 'entry': 'entrée',
    'allocation': 'allocation', 'sector': 'secteur', 'market': 'marché',
    'inflation': 'inflation', 'interest rate': "taux d'intérêt",
    'central bank': 'banque centrale', 'GDP': 'PIB',
    'stocks': 'actions', 'bonds': 'obligations',
    'commodities': 'matières premières', 'energy': 'énergie',
    'real estate': 'immobilier', 'cryptocurrency': 'cryptomonnaie',
    'forex': 'forex', 'dividend': 'dividende',
    'earnings': 'résultats', 'recession': 'récession',
    'quantitative easing': 'assouplissement quantitatif',
    'yield curve': 'courbe des taux', 'credit spread': 'spread de crédit',
    'leverage': 'effet de levier', 'hedge': 'couverture',
    'portfolio': 'portefeuille', 'asset class': "classe d'actifs",
    'blue chip': 'valeur de premier rang', 'penny stock': 'action à bas prix',
    'IPO': 'introduction en bourse', 'market cap': 'capitalisation boursière',
    'price-to-earnings': 'cours/bénéfice', 'dividend yield': 'rendement du dividende',
  },
  'fr-en': {
    'haussier': 'bullish', 'baissier': 'bearish', 'neutre': 'neutral',
    'confiance': 'confidence', 'recommandation': 'recommendation',
    'objectif': 'target', 'entrée': 'entry', 'secteur': 'sector',
    'marché': 'market', 'actions': 'stocks', 'obligations': 'bonds',
    'matières premières': 'commodities', 'énergie': 'energy',
    'immobilier': 'real estate', 'cryptomonnaie': 'cryptocurrency',
    'banque centrale': 'central bank', 'taux directeur': 'policy rate',
    "taux d'intérêt": 'interest rate', 'récession': 'recession',
    'dividende': 'dividend', 'portefeuille': 'portfolio',
    "classe d'actifs": 'asset class', 'couverture': 'hedge',
    "effet de levier": 'leverage', 'PIB': 'GDP',
    'introduction en bourse': 'IPO',
    'capitalisation boursière': 'market cap',
  },
  'en-ar': {
    'bullish': 'صاعد', 'bearish': 'هابط', 'neutral': 'محايد',
    'confidence': 'الثقة', 'recommendation': 'توصية',
    'stop loss': 'وقف الخسارة', 'target': 'الهدف', 'entry': 'الدخول',
    'allocation': 'التخصيص', 'sector': 'القطاع', 'market': 'السوق',
    'inflation': 'التضخم', 'interest rate': 'سعر الفائدة',
    'central bank': 'البنك المركزي', 'GDP': 'الناتج المحلي الإجمالي',
    'stocks': 'الأسهم', 'bonds': 'السندات',
    'commodities': 'السلع', 'energy': 'الطاقة',
    'real estate': 'العقارات', 'cryptocurrency': 'العملات الرقمية',
  },
  'ar-en': {
    'صاعد': 'bullish', 'هابط': 'bearish', 'محايد': 'neutral',
    'الثقة': 'confidence', 'توصية': 'recommendation',
    'وقف الخسارة': 'stop loss', 'الهدف': 'target', 'الدخول': 'entry',
    'القطاع': 'sector', 'السوق': 'market', 'التضخم': 'inflation',
    'سعر الفائدة': 'interest rate', 'البنك المركزي': 'central bank',
    'الأسهم': 'stocks', 'السندات': 'bonds', 'السلع': 'commodities',
    'الطاقة': 'energy', 'العقارات': 'real estate',
  },
  'fr-ar': {
    'haussier': 'صاعد', 'baissier': 'هابط', 'neutre': 'محايد',
    'confiance': 'الثقة', 'recommandation': 'توصية',
    'marché': 'السوق', 'actions': 'الأسهم', 'obligations': 'السندات',
    'énergie': 'الطاقة', 'immobilier': 'العقارات',
  },
  'ar-fr': {
    'صاعد': 'haussier', 'هابط': 'baissier', 'محايد': 'neutre',
    'الثقة': 'confiance', 'توصية': 'recommandation',
    'السوق': 'marché', 'الأسهم': 'actions', 'السندات': 'obligations',
    'الطاقة': 'énergie', 'العقارات': 'immobilier',
  },
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', ar: 'العربية',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, source, target, domain = 'financial' } = body;

    if (!text || !source || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: text, source, target' },
        { status: 400 }
      );
    }

    if (source === target) {
      return NextResponse.json({ translation: text });
    }

    // Limit text length
    const truncatedText = text.slice(0, 3000);

    const dictKey = `${source}-${target}`;
    const glossary = DOMAIN_GLOSSARY[dictKey] || {};

    // Build glossary instructions for the AI
    const glossaryTerms = Object.entries(glossary)
      .map(([src, tgt]) => `"${src}" → "${tgt}"`)
      .join(', ');

    const systemPrompt = `Tu es un traducteur financier professionnel. Traduis le texte suivant de ${LANGUAGE_NAMES[source] || source} vers ${LANGUAGE_NAMES[target] || target}.

Règles strictes :
1. Conserve la terminologie financière professionnelle
2. Préserve les noms d'actifs (Brent, EUR/USD, BTC, etc.)
3. Préserve les chiffres, pourcentages et symboles ($, €, %)
4. Préserve le formatage Markdown
5. Glossaire obligatoire : ${glossaryTerms}
6. Ne pas ajouter de commentaires ou d'explications
7. Retourne uniquement le texte traduit`;

    const result = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: truncatedText },
    ], {
      temperature: 0.2,
      maxTokens: 2000,
      priority: 'translation',
      locale: target,
    });

    const translation = result.content?.trim() || '';

    return NextResponse.json({
      translation,
      source,
      target,
      domain,
    });
  } catch (error: any) {
    console.error('[Translate API] Error:', error.message);

    // Fallback: local dictionary replacement
    try {
      const body = await new Request(request.clone()).json().catch(() => ({}));
      const { text = '', source = 'en', target = 'fr' } = body;
      const dictKey = `${source}-${target}`;
      const dict = DOMAIN_GLOSSARY[dictKey] || {};

      let translated = String(text).slice(0, 3000);
      for (const [src, tgt] of Object.entries(dict)) {
        const regex = new RegExp(`\\b${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        translated = translated.replace(regex, tgt);
      }

      return NextResponse.json({ translation: translated, source, target, fallback: true });
    } catch {
      return NextResponse.json(
        { error: 'Translation failed' },
        { status: 500 }
      );
    }
  }
}
