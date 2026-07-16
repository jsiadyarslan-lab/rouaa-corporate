import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import { translateSectorsToFr, translateSectorToFr } from '@/lib/locale';
import ReportDetailClient from '@/app/en/reports/[slug]/EnReportDetailClient';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

// ─── French Fallback Content Generator ────────────────────────────
const ASSET_CLASS_INFO_FR: Record<string, { nameFr: string; description: string; sectors: string[]; keyDrivers: string[]; risks: string[] }> = {
  strategic: {
    nameFr: 'Rapports Stratégiques',
    description: 'Rapports analytiques approfondis sur des sujets spécifiques, différents des rapports quotidiens automatisés. Ils reposent sur une analyse IA approfondie avec des données réelles.',
    sectors: ['Analyse Économique', 'Marchés Financiers', 'Scénarios Futurs', 'Recommandations Stratégiques'],
    keyDrivers: ['Événements économiques et géopolitiques majeurs', 'Politiques des banques centrales et leurs impacts régionaux', 'Évolutions des marchés financiers mondiaux', 'Tendances d\'investissement institutionnel'],
    risks: ['Changements soudains de politiques monétaires', 'Développements géopolitiques inattendus', 'Volatilité forte sur les marchés de l\'énergie et des devises', 'Ralentissement économique plus large que prévu'],
  },
  forex: {
    nameFr: 'Forex',
    description: 'Le marché des changes est le plus grand marché financier au monde avec un volume quotidien dépassant 7 billions de dollars. Ce marché est influencé par les politiques monétaires des banques centrales, les données macroéconomiques et les événements géopolitiques.',
    sectors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    keyDrivers: ['Décisions de taux d\'intérêt de la Réserve Fédérale et de la BCE', 'Données d\'inflation et de croissance économique', 'Tensions géopolitiques et prix de l\'énergie', 'Indice du dollar américain et mouvements de capitaux'],
    risks: ['Volatilité forte suite aux décisions inattendues des banques centrales', 'Intervention gouvernementale sur les taux de change', 'Crises politiques régionales affectant les devises des marchés émergents', 'Ralentissement économique mondial entraînant une fuite des capitaux'],
  },
  stocks: {
    nameFr: 'Actions',
    description: 'Le marché boursier mondial voit une influence mutuelle entre les principales bourses, avec un accent sur la saison des résultats des grandes entreprises et les attentes de politique monétaire.',
    sectors: ['Actions US', 'Actions Européennes', 'Actions Asiatiques', 'Actions du Golfe'],
    keyDrivers: ['Saison des résultats et attentes des analystes', 'Décisions de taux d\'intérêt et leur impact sur les valorisations', 'Développements technologiques et intelligence artificielle', 'Flux d\'investissement internationaux'],
    risks: ['Corrections de prix après des périodes de hausse', 'Ralentissement de croissance économique impactant les résultats', 'Renforcement réglementaire dans les secteurs clés', 'Guerres commerciales et tarifs douaniers'],
  },
  crypto: {
    nameFr: 'Cryptomonnaies',
    description: 'Le marché des cryptomonnaies se caractérise par une forte volatilité et une sensibilité aux événements réglementaires, aux développements technologiques et aux mouvements de capitaux institutionnels.',
    sectors: ['Bitcoin', 'Ethereum', 'Altcoins', 'Finance Décentralisée'],
    keyDrivers: ['Afflux de capitaux institutionnels et fonds ETF', 'Développements réglementaires mondiaux', 'Mises à jour réseau et protocolaires', 'Taux d\'intérêt et environnement de liquidité mondial'],
    risks: ['Volatilité forte et soudaine des prix', 'Intervention réglementaire stricte sur les marchés clés', 'Risques de sécurité et piratages de plateformes', 'Perte de confiance et effondrements majeurs de projets'],
  },
  economy: {
    nameFr: 'Macroéconomie',
    description: 'L\'économie mondiale fait face à de multiples défis dont l\'inflation, les politiques des banques centrales et un potentiel ralentissement de la croissance dans un contexte de tensions géopolitiques persistantes.',
    sectors: ['Croissance Économique', 'Inflation', 'Taux d\'Intérêt', 'Commerce International'],
    keyDrivers: ['Politiques des banques centrales et décisions de taux', 'Données d\'inflation et de PIB', 'Commerce international et chaînes d\'approvisionnement', 'Politiques budgétaires gouvernementales'],
    risks: ['Récession économique mondiale', 'Inflation persistante dépassant les attentes', 'Crises de la dette souveraine', 'Guerres commerciales et tarifs douaniers'],
  },
  energy: {
    nameFr: 'Énergie',
    description: 'Le marché mondial de l\'énergie est influencé par l\'équilibre offre-demande, les décisions de l\'OPEP et les tensions géopolitiques dans les régions productrices clés.',
    sectors: ['Pétrole Brut', 'Gaz Naturel', 'Énergies Renouvelables', 'Pétrochimie'],
    keyDrivers: ['Décisions de l\'OPEP sur les niveaux de production', 'Demande chinoise et croissance économique asiatique', 'Tensions au Moyen-Orient et détroit d\'Ormuz', 'Transition vers les énergies propres'],
    risks: ['Guerres de prix entre grands producteurs', 'Impact des guerres et crises sur l\'offre', 'Ralentissement de la demande mondiale dû à la récession', 'Sanctions commerciales sur les pays producteurs'],
  },
  commodities: {
    nameFr: 'Matières Premières',
    description: 'Les marchés de matières premières sont influencés par de multiples facteurs incluant la force du dollar, la demande industrielle, les conditions météorologiques et les tensions géopolitiques.',
    sectors: ['Or', 'Argent', 'Cuivre', 'Produits Agricoles'],
    keyDrivers: ['Mouvements du dollar américain et taux d\'intérêt', 'Demande industrielle de la Chine et des grandes économies', 'Conditions météorologiques affectant les récoltes', 'Menaces géopolitiques comme valeur refuge'],
    risks: ['Pénuries d\'offre suite à des événements naturels ou politiques', 'Ralentissement de la demande industrielle mondiale', 'Volatilité des taux de change', 'Spéculation sur les marchés à terme'],
  },
  realEstate: {
    nameFr: 'Immobilier',
    description: 'Le secteur immobilier est influencé par les taux d\'intérêt, les politiques de financement, la demande démographique et les investissements publics en infrastructure.',
    sectors: ['Résidentiel', 'Commercial', 'OPCI', 'Développement'],
    keyDrivers: ['Taux hypothécaires et taux d\'intérêt', 'Croissance démographique et urbanisation', 'Investissements publics en infrastructure', 'Politiques réglementaires et incitatives'],
    risks: ['Bulle immobilière due au sur-endettement', 'Hausse des taux réduisant la demande', 'Ralentissement économique affectant le pouvoir d\'achat', 'Renforcement des lois réglementaires'],
  },
  banking: {
    nameFr: 'Bancaire',
    description: 'Le secteur bancaire est directement influencé par l\'environnement des taux d\'intérêt, les politiques monétaires, la qualité du crédit et la transformation numérique.',
    sectors: ['Banques Traditionnelles', 'Banques Islamiques', 'Banques d\'Investissement', 'Finance Numérique'],
    keyDrivers: ['Structure des taux et marges bénéficiaires', 'Qualité du portefeuille de crédit et taux de défaut', 'Transformation numérique et innovation bancaire', 'Réglementations et conformité'],
    risks: ['Hausse des taux de défaut des prêts', 'Volatilité des taux impactant les marges', 'Risques cyber et de sécurité', 'Concurrence des entreprises fintech'],
  },
  bonds: {
    nameFr: 'Obligations',
    description: 'Le marché obligataire mondial est une mesure clé des attentes de taux d\'intérêt et d\'inflation, et un indicateur de l\'appétit pour le risque des investisseurs.',
    sectors: ['Obligations Souveraines', 'Obligations Corporate', 'Obligations à Haut Rendement', 'Obligations Islamiques'],
    keyDrivers: ['Décisions des banques centrales sur les taux', 'Attentes d\'inflation et de croissance économique', 'Notations de crédit souveraines et corporate', 'Offre et demande de nouvelle dette'],
    risks: ['Hausse des rendements due au resserrement monétaire', 'Risque de défaut pour les obligations à haut rendement', 'Risques de liquidité en périodes difficiles', 'Volatilité des taux de change pour les obligations en devises'],
  },
  technicalAnalysis: {
    nameFr: 'Analyse Technique',
    description: 'Analyse technique approfondie des paires de devises, cryptomonnaies, matières premières et actions, basée sur les indicateurs techniques, les configurations de prix et les niveaux de support/résistance avec des scénarios spécifiques et des recommandations exploitables.',
    sectors: ['Forex', 'Cryptomonnaies', 'Or & Pétrole', 'Actions Mondiales'],
    keyDrivers: ['Niveaux clés de support et résistance', 'Indicateurs techniques (RSI, MACD, Moyennes Mobiles)', 'Configurations de prix et chandeliers', 'Volume de trading et indicateurs de liquidité'],
    risks: ['Signaux techniques contradictoires entre différentes temporalités', 'Faux breakouts des niveaux clés', 'Changements soudains suite à des événements géopolitiques ou économiques', 'Faible liquidité pendant certaines périodes'],
  },
  earnings: {
    nameFr: 'Résultats d\'Entreprises',
    description: 'La saison des résultats est l\'un des moteurs les plus importants du marché, alors que les grandes entreprises révèlent leurs résultats financiers trimestriels et impactent directement les cours et les tendances du marché.',
    sectors: ['Résultats US', 'Résultats Européens', 'Résultats du Golfe', 'Attentes des Analystes'],
    keyDrivers: ['Résultats réels vs attentes des analystes', 'Perspectives de guidage futur des entreprises', 'Marges bénéficiaires et revenus opérationnels', 'Taux de croissance et leur impact sur les valorisations'],
    risks: ['Déception des résultats des grandes entreprises et impact négatif sur le marché', 'Révisions à la baisse des attentes de résultats futurs', 'Pression inflationniste sur les marges bénéficiaires', 'Forte divergence entre secteurs et régions'],
  },
};

function generateFallbackContentFr(analysis: { assetClass: string; sentiment: string; confidenceScore: number; riskLevel: string; title: string }): { sections: Record<string, string>; highlights: string[] } {
  const info = ASSET_CLASS_INFO_FR[analysis.assetClass] || ASSET_CLASS_INFO_FR.economy;
  const sentimentLabel = analysis.sentiment === 'bullish' ? 'Haussier' : analysis.sentiment === 'bearish' ? 'Baissier' : 'Neutre';
  const riskLabel = analysis.riskLevel === 'low' ? 'Faible' : analysis.riskLevel === 'high' ? 'Élevé' : analysis.riskLevel === 'extreme' ? 'Très Élevé' : 'Moyen';
  const isStrategic = analysis.assetClass === 'strategic';

  const sections: Record<string, string> = {};
  const highlights: string[] = [];

  if (isStrategic) {
    sections.overview = `Ce rapport stratégique fournit une analyse approfondie d'un sujet spécifique, différent des rapports quotidiens automatisés. Il repose sur une analyse IA approfondie avec des données réelles, couvrant des scénarios temporels, des actifs affectés et des recommandations stratégiques.\n\n${info.description}`;
  } else {
    sections.overview = `Ce rapport fournit une analyse complète du marché ${info.nameFr} basée sur les données et indicateurs disponibles. Le niveau de confiance de ${analysis.confidenceScore}% reflète la fiabilité des données utilisées dans cette analyse, tandis que la tendance globale indique une position de marché ${sentimentLabel}.\n\n${info.description}`;

    sections.detailedAnalysis = `Le paysage actuel du marché ${info.nameFr} est façonné par plusieurs facteurs clés :\n\n${info.keyDrivers.map((d, i) => {
      return `${i + 1}. **${d}**`;
    }).join('\n\n')}`;
  }

  sections.riskAssessment = `Le niveau de risque sur le marché ${info.nameFr} est actuellement évalué comme "${riskLabel}" :\n\n${info.risks.map((r) => `- ${r}`).join('\n')}`;

  sections.strategicRecommendations = `Sur la base de l'analyse ci-dessus et de la tendance de marché ${sentimentLabel} :\n\n### Investisseur Conservateur\n- Réduire l'exposition aux actifs à forte volatilité sur le marché ${info.nameFr}\n- Se concentrer sur les actifs défensifs à rendement fixe\n- Définir des niveaux de stop-loss précis pour toute nouvelle position\n\n### Investisseur Modéré\n- Répartir les investissements entre les actifs ${(info as any).sectors.slice(0, 2).join(' et ')}\n- Attendre la stabilisation de la tendance avant d'entrer dans de nouvelles positions\n\n### Day Trader\n- Surveiller les niveaux clés de support et résistance\n- Exploiter la volatilité du marché ${info.nameFr} pendant les sessions de trading actives`;

  sections.outlook = `### Scénario Haussier (${sentimentLabel === 'Haussier' ? '55' : '30'}% de probabilité)\nLe soutien continu de ${info.keyDrivers[0] || 'des facteurs actuels'} pourrait pousser le marché ${info.nameFr} vers des niveaux supérieurs, en particulier avec l'amélioration des données économiques.\n\n### Scénario Neutre (${sentimentLabel === 'Neutre' ? '50' : '40'}% de probabilité)\nPoursuite de la situation actuelle avec un trading confiné dans la fourchette actuelle, dans l'attente de clarté sur la direction de ${info.keyDrivers[1] || 'des facteurs clés'}.\n\n### Scénario Baissier (${sentimentLabel === 'Baissier' ? '55' : '25'}% de probabilité)\nL'escalade de l'impact de ${info.risks[0] || 'des risques actuels'} pourrait exercer une pression sur les prix, en particulier avec la baisse de l'appétit pour le risque.`;

  highlights.push(
    `Niveau de Confiance : ${analysis.confidenceScore}% — ${analysis.confidenceScore >= 70 ? 'Fiabilité élevée' : analysis.confidenceScore >= 50 ? 'Fiabilité moyenne' : 'Fiabilité limitée'}`,
    `Tendance Globale : ${sentimentLabel}`,
    `Niveau de Risque : ${riskLabel}`,
    `Secteurs Affectés : ${(info as any).sectors.slice(0, 3).join(', ')}`,
  );

  return { sections, highlights };
}

// ─── Universal Content Processor (French version) ──────────────────
const HEADING_TO_KEY: Record<string, string> = {
  'Résumé Exécutif': 'executiveSummary',
  'Contexte et Antécédents': 'context',
  'Impact Économique Direct': 'economicImpact',
  'Impact sur le Marché': 'marketImpact',
  'Scénarios': 'scenarios',
  'Actifs Affectés': 'affectedAssets',
  'Recommandations Stratégiques': 'strategicRecommendations',
  'Indicateurs de Suivi': 'followUpIndicators',
  'Aperçu': 'overview',
  'Introduction': 'introduction',
  'Évaluation des Risques': 'riskAssessment',
  'Perspectives': 'outlook',
  // Also support English/Arabic headings that may appear in content
  'Executive Summary': 'executiveSummary',
  'Context & Background': 'context',
  'Direct Economic Impact': 'economicImpact',
  'Market Impact': 'marketImpact',
  'Overview': 'overview',
  'Risk Assessment': 'riskAssessment',
  'Outlook': 'outlook',
  'الملخص التنفيذي': 'executiveSummary',
  'نظرة عامة': 'overview',
  'مقدمة التقرير': 'introduction',
  'تقييم المخاطر': 'riskAssessment',
  'التوقعات': 'outlook',
};

function processContent(rawContent: string): {
  sections: Record<string, string>;
  metadata: Record<string, any>;
  dataQuality: Record<string, any>;
  summary: string;
} {
  const result = {
    sections: {} as Record<string, string>,
    metadata: {} as Record<string, any>,
    dataQuality: {} as Record<string, any>,
    summary: '',
  };

  if (!rawContent || rawContent.trim().length === 0) return result;

  try {
    const parsed = JSON.parse(rawContent);

    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          result.sections[key] = stripMarkdownHeadings(value);
        } else if (typeof value === 'object' && value !== null) {
          const extracted = extractTextFromObject(value as Record<string, unknown>);
          if (extracted.length > 20) {
            result.sections[key] = stripMarkdownHeadings(extracted);
          }
        }
      }
    }

    const KNOWN_SECTION_KEYS = [
      'introduction', 'overview', 'executiveSummary', 'weeklyOverview',
      'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'context',
      'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets',
      'followUpIndicators', 'sourcesAndReferences', 'confidenceAssessment',
      'rouaRecommendations', 'rouaaRecommendations', 'strategicRecommendations', 'riskAssessment',
      'outlook', 'keyFindings', 'highlights', 'keyPoints', 'mainFindings',
      'rawContent', 'sentimentAnalysis', 'technicalOutlook', 'detailedAnalysis',
    ];
    if (Object.keys(result.sections).length === 0 && !parsed.sections) {
      for (const [key, value] of Object.entries(parsed)) {
        if (KNOWN_SECTION_KEYS.includes(key) && typeof value === 'string' && value.trim().length > 0) {
          result.sections[key] = stripMarkdownHeadings(value);
        }
      }
    }

    const aiContentSource = parsed.metadata?.aiContent || parsed.aiContent;
    if (aiContentSource && typeof aiContentSource === 'object') {
      const ai = aiContentSource;
      const aiSectionMap: Record<string, string> = {
        summary: 'overview', detailedAnalysis: 'detailedAnalysis',
        recommendations: 'strategicRecommendations', riskFactors: 'riskAssessment',
        outlook: 'outlook', technicalAnalysis: 'technicalOutlook',
        fundamentalAnalysis: 'fundamentalAnalysis', marketPulse: 'marketPulse',
        sectorAnalysis: 'sectorPerformance', sentimentDetails: 'sentimentAnalysis',
      };

      for (const [aiKey, sectionKey] of Object.entries(aiSectionMap)) {
        if ((ai as any)[aiKey] && !result.sections[sectionKey]) {
          const val = (ai as any)[aiKey];
          if (typeof val === 'string' && val.trim().length > 0) {
            result.sections[sectionKey] = stripMarkdownHeadings(val);
          } else if (Array.isArray(val)) {
            const text = val.join('\n\n');
            if (text.trim().length > 20) result.sections[sectionKey] = stripMarkdownHeadings(text);
          }
        }
      }

      if (!result.sections.highlights && Array.isArray(ai.keyFindings) && ai.keyFindings.length > 0) {
        result.sections.highlights = JSON.stringify(ai.keyFindings);
      }
    }

    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};

    const rawSummary = result.sections.introduction || result.sections.overview
      || result.sections.executiveSummary || result.sections.weeklyOverview
      || result.sections.economicOverview || result.sections.quarterlyOverview
      || result.sections.eventAnalysis || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);

    if (result.summary.length > 500) {
      result.summary = truncateAtBoundary(result.summary, 500);
    }

  } catch {
    const text = rawContent.trim();
    if (text.length > 20) {
      const headingRegex = /^##\s+(\d+[\.\s]*)?(.+)$/gm;
      const matches: { index: number; number: string; title: string }[] = [];
      let match;
      while ((match = headingRegex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          number: (match[1] || '').replace(/[\.\s]/g, '').trim(),
          title: match[2].trim(),
        });
      }

      if (matches.length >= 2) {
        for (let i = 0; i < matches.length; i++) {
          const startIdx = matches[i].index + text.substring(matches[i].index).split('\n')[0].length + 1;
          const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;
          const content = text.substring(startIdx, endIdx).trim();
          if (content.length < 5) continue;

          let sectionKey = '';
          const title = matches[i].title;

          if (matches[i].number) {
            const numberKeyMap: Record<string, string> = {
              '1': 'executiveSummary', '2': 'context',
              '3': 'economicImpact', '4': 'marketImpact',
              '5': 'scenarios', '6': 'affectedAssets',
              '7': 'strategicRecommendations', '8': 'followUpIndicators',
            };
            sectionKey = numberKeyMap[matches[i].number] || '';
          }

          if (!sectionKey) {
            for (const [headingTitle, key] of Object.entries(HEADING_TO_KEY)) {
              if (title.includes(headingTitle) || headingTitle.includes(title)) {
                sectionKey = key;
                break;
              }
            }
          }

          if (!sectionKey) {
            sectionKey = `section${matches[i].number || i + 1}`;
          }

          result.sections[sectionKey] = stripMarkdownHeadings(content);
        }

        result.sections.rawContent = stripMarkdownHeadings(text);

        const rawSummary = result.sections.executiveSummary
          || result.sections.overview
          || result.sections.introduction
          || stripSummaryMarkdown(text.slice(0, 500));
        result.summary = stripSummaryMarkdown(rawSummary);
      } else {
        result.sections.overview = stripMarkdownHeadings(text);
        result.summary = stripSummaryMarkdown(text.slice(0, 500));
      }

      if (result.summary.length > 500) {
        result.summary = truncateAtBoundary(result.summary, 500);
      }
    }
  }

  return result;
}

// Extract readable text from a nested object
function extractTextFromObject(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return '';
  const parts: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim().length > 5) {
      parts.push(value.trim());
    } else if (typeof value === 'number') {
      const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      parts.push(`**${label}**: ${value}`);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim().length > 5) {
          parts.push(`- ${item.trim()}`);
        } else if (typeof item === 'object' && item !== null) {
          const nested = extractTextFromObject(item as Record<string, unknown>, depth + 1);
          if (nested) parts.push(nested);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const nested = extractTextFromObject(value as Record<string, unknown>, depth + 1);
      if (nested) parts.push(`**${key.replace(/_/g, ' ')}**\n\n${nested}`);
    }
  }

  return parts.join('\n\n');
}

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

  if (!rawSlug || rawSlug === 'undefined' || rawSlug === 'null') {
    return { title: 'Rapport non trouvé — Rouaa', description: 'Analyse financière alimentée par l\'IA' };
  }

  try {
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
      select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
    });

    // Try MarketAnalysis (French only)
    if (!report) {
      const analysis: any = await db.marketAnalysis.findFirst({
        where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: { id: true, title: true, content: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true },
      });
      if (analysis) {
        let analysisSummary = '';
        try {
          const parsed = JSON.parse(analysis.content || '{}');
          analysisSummary = parsed.metadata?.summary || parsed.summary || '';
        } catch {}
        report = {
          id: analysis.id, title: analysis.title, summary: analysisSummary,
          slug: analysis.slug, scope: analysis.assetClass || 'economy',
          reportType: 'analysis' as const, marketImpact: analysis.sentiment || 'neutral',
          confidenceScore: analysis.confidenceScore, imageUrl: null,
        } as any;
      }
    }

    if (!report) return { title: 'Rapport non trouvé — Rouaa' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const hdrs = await headers();
      const host = hdrs.get('host');
      const proto = hdrs.get('x-forwarded-proto') || 'https';
      if (host) baseUrl = `${proto}://${host}`;
    } catch {}

    const title = report.title;
    const description = report.summary ? stripSummaryMarkdown(report.summary).slice(0, 160) : 'Rapport d\'analyse financière complet';

    return {
      title: `${title} — Rouaa Rapports`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/fr/reports/${report.slug || slug}`,
        siteName: 'Rouaa',
        locale: 'fr_FR',
        type: 'article',
        images: [{ url: report.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [report.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/fr/reports/${report.slug || slug}` },
    };
  } catch {
    return { title: 'Rouaa Rapports', description: 'Analyse financière alimentée par l\'IA' };
  }
}

// ─── Error Fallback Component ─────────────────────────────────
function ReportLoadError(slug: string, err?: unknown) {
  if (err) {
    console.error('════════════════════════════════════════');
    console.error(`🚨 [FR REPORT PAGE] Failed to load report slug="${slug}"`);
    console.error('════════════════════════════════════════');
    console.error('Error name:', (err as Error)?.name);
    console.error('Error message:', (err as Error)?.message);
    console.error('Error stack:', (err as Error)?.stack);
    if ((err as any)?.cause) console.error('Error cause:', (err as any).cause);
    console.error('Full error object:', err);
    console.error('════════════════════════════════════════');
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', direction: 'ltr', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>Échec du Chargement</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>Une erreur est survenue lors du chargement de ce rapport. L&apos;erreur a été enregistrée.</p>
        {slug && <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-all' }}>slug: {slug}</p>}
        <a href="/fr/reports" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#00E5FF', color: '#0A0E27', textDecoration: 'none' }}>Retour aux Rapports</a>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────
export default async function FrReportSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let slug = '';
  try {
    let { slug: rawSlug } = await params;
    try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

    try {
      const decodedOnce = decodeURIComponent(rawSlug);
      slug = decodedOnce;
    } catch {
      slug = rawSlug;
    }

    if (!slug || slug === 'undefined') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: '#0A0E27' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>Chargement du rapport...</h1>
          <p style={{ color: '#64748B' }}>Le rapport apparaîtra une fois les données disponibles</p>
        </div>
      </div>
    );
  }

  // Strategy 1: Direct match with locale=fr
  let report = await db.economicReport.findFirst({
    where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
  });

  // Strategy 2: Try with raw slug
  if (!report && slug !== rawSlug) {
    report = await db.economicReport.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] },
    });
  }

  // Strategy 3: Strategic report nanoid suffix match (French only)
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({
        where: {
          locale: 'fr',
          isPublished: true,
          reportType: 'strategic',
          slug: { endsWith: `-${slugSuffix}` },
        },
      });
    }
  }

  // Strategy 4: Partial slug match (French only)
  if (!report && slug.length > 20) {
    report = await db.economicReport.findFirst({
      where: {
        locale: 'fr',
        isPublished: true,
        slug: { startsWith: slug.slice(0, 20) },
      },
    });
  }

  let isAnalysis = false;

  // V1037: MarketAnalysis queries can throw PrismaClientKnownRequestError.
  // Log e.code explicitly + retry with minimal select as defensive fallback.
  const logPrismaError = (label: string, e: unknown) => {
    const err = e as any;
    console.error(`🚨 [FR Report] ${label}`);
    console.error(`  class: ${err?.constructor?.name}  code: ${err?.code ?? '(none)'}  clientVersion: ${err?.clientVersion ?? '(none)'}`);
    console.error(`  message: ${err?.message ?? '(none)'}`);
    try { console.error(`  meta: ${JSON.stringify(err?.meta)}`); } catch {}
  };

  const MINIMAL_SELECT = {
    id: true, title: true, slug: true, content: true,
    assetClass: true, sentiment: true, confidenceScore: true,
    riskLevel: true, isPublished: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    locale: true,
  };

  // Fallback: try finding a MarketAnalysis
  if (!report) {
    console.log('[FR Report] Strategy: trying MarketAnalysis with locale=fr, slug:', slug);
    let analysis: any = await db.marketAnalysis.findFirst({
      where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
    }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=fr) FAILED', e); return null; });
    console.log('[FR Report] MarketAnalysis(locale=fr) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');

    // V1037: Defensive fallback — minimal select
    if (!analysis) {
      console.log('[FR Report] Strategy: retry MarketAnalysis(locale=fr) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({
        where: { locale: 'fr', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: MINIMAL_SELECT,
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=fr, MINIMAL) FAILED', e); return null; });
      console.log('[FR Report] MarketAnalysis(locale=fr, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    if (analysis) {
      isAnalysis = true;
      const assetClass = analysis.assetClass || 'economy';

      const processed = processContent(analysis.content || '{}');

      const sectionsWithContent = Object.values(processed.sections)
        .filter(v => typeof v === 'string' && v.trim().length > 80);
      const hasContent = sectionsWithContent.length >= 2;

      if (!hasContent) {
        const fallback = generateFallbackContentFr({
          assetClass,
          sentiment: analysis.sentiment || 'neutral',
          confidenceScore: analysis.confidenceScore || 50,
          riskLevel: analysis.riskLevel || 'medium',
          title: analysis.title,
        });
        for (const [key, value] of Object.entries(fallback.sections)) {
          if (!processed.sections[key] || processed.sections[key].trim().length < 80) {
            processed.sections[key] = value;
          }
        }
        if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) {
          processed.sections.highlights = JSON.stringify(fallback.highlights);
        }
        if (!processed.summary || processed.summary.trim().length < 30) {
          processed.summary = processed.sections.introduction || processed.sections.overview
            || fallback.sections.overview?.slice(0, 300) || '';
        }
      }

      let parsedIndicators: any = {};
      try {
        const indData = typeof analysis.indicators === 'string' ? JSON.parse(analysis.indicators) : analysis.indicators;
        if (Array.isArray(indData) && indData.length > 0) {
          parsedIndicators = {
            indicators: indData.map((ind: any) => ({
              name: ind.name || ind.nameEn || ind.symbol,
              value: ind.value,
              change: ind.change || ind.changePercent || 0,
              symbol: ind.symbol,
            })),
          };
        } else if (typeof indData === 'object' && indData !== null) {
          parsedIndicators = indData;
        }
      } catch {}

      const contentJson = JSON.stringify({
        sections: processed.sections,
        metadata: processed.metadata,
        dataQuality: processed.dataQuality,
      });

      const normalizedReport = {
        id: analysis.id,
        title: analysis.title,
        slug: analysis.slug,
        summary: processed.summary || analysis.title,
        content: contentJson,
        reportType: 'analysis',
        scope: assetClass,
        sectors: (typeof analysis.sectors === 'string' ? safeParse(analysis.sectors) : analysis.sectors) || [],
        countries: (typeof analysis.countries === 'string' ? safeParse(analysis.countries) : analysis.countries) || [],
        keyIndicators: parsedIndicators,
        marketImpact: analysis.sentiment || 'neutral',
        confidenceScore: analysis.confidenceScore || 50,
        sourceUrls: (typeof analysis.sourceUrls === 'string' ? safeParse(analysis.sourceUrls) : analysis.sourceUrls) || [],
        imageUrl: analysis.imageUrl || undefined,
        publishedAt: analysis.publishedAt,
        createdAt: analysis.createdAt,
        isAnalysis: true,
      };

      const related = await db.marketAnalysis.findMany({
        where: { locale: 'fr', isPublished: true, id: { not: analysis.id } },
        take: 4,
        orderBy: { publishedAt: 'desc' },
      }).catch(() => []);

      const normalizedRelated = (related || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        reportType: r.reportType || 'analysis',
        marketImpact: (r as any).marketImpact || r.sentiment || 'neutral',
        confidenceScore: r.confidenceScore || 50,
        publishedAt: r.publishedAt,
      }));

      return <ReportDetailClient report={normalizedReport} related={normalizedRelated} locale="fr" />;
    }
  }

  if (!report) notFound();

  // ─── Process EconomicReport content ────────────────────────
  let processed: { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string };
  try {
    processed = processContent(report.content || '{}');
  } catch (e) {
    console.error('[FR Report Page] processContent error:', e);
    processed = { sections: {}, metadata: {}, dataQuality: {}, summary: report.summary || '' };
  }

  const sectionsWithContent = Object.values(processed.sections)
    .filter(v => typeof v === 'string' && v.trim().length > 80);
  const hasContent = sectionsWithContent.length >= 2;

  if (!hasContent) {
    const fallback = generateFallbackContentFr({
      assetClass: report.scope || report.reportType || 'economy',
      sentiment: (report as any).marketImpact || 'neutral',
      confidenceScore: report.confidenceScore || 50,
      riskLevel: 'medium',
      title: report.title,
    });
    for (const [key, value] of Object.entries(fallback.sections)) {
      if (!processed.sections[key] || processed.sections[key].trim().length < 80) {
        processed.sections[key] = value;
      }
    }
    if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) {
      processed.sections.highlights = JSON.stringify(fallback.highlights);
    }
    if (!processed.summary || processed.summary.trim().length < 30) {
      processed.summary = processed.sections.introduction || processed.sections.overview
        || fallback.sections.overview?.slice(0, 300) || '';
    }
  }

  const contentJson = JSON.stringify({
    sections: processed.sections,
    metadata: processed.metadata,
    dataQuality: processed.dataQuality,
  });

  const normalizedReport = {
    id: report.id,
    title: report.title,
    slug: report.slug,
    summary: processed.summary || report.summary || '',
    content: contentJson,
    reportType: report.reportType || 'daily',
    scope: report.scope || 'global',
    sectors: (() => { try { const s = (report as any).sectors; if (typeof s === 'string') return safeParse(s); return Array.isArray(s) ? s : []; } catch { return []; } })(),
    countries: (() => { try { const c = (report as any).countries; if (typeof c === 'string') return safeParse(c); return Array.isArray(c) ? c : []; } catch { return []; } })(),
    keyIndicators: (() => { try { const ki = (report as any).keyIndicators; if (!ki) return {}; if (typeof ki === 'string') return JSON.parse(ki); return ki; } catch { return {}; } })(),
    marketImpact: (report as any).marketImpact || 'neutral',
    confidenceScore: report.confidenceScore || 50,
    sourceUrls: (() => { try { const su = report.sourceUrls; if (!su) return []; if (typeof su === 'string') return safeParse(su); return Array.isArray(su) ? su : []; } catch { return []; } })(),
    imageUrl: report.imageUrl || undefined,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
  };

  // Fetch related reports
  const related = await db.economicReport.findMany({
    where: { locale: 'fr', isPublished: true, id: { not: report.id } },
    take: 4,
    orderBy: { publishedAt: 'desc' },
  }).catch(() => []);

  const normalizedRelated = (related || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    reportType: r.reportType || 'daily',
    marketImpact: (r as any).marketImpact || 'neutral',
    confidenceScore: r.confidenceScore || 50,
    publishedAt: r.publishedAt,
  }));

  return <ReportDetailClient report={normalizedReport} related={normalizedRelated} locale="fr" />;
  } catch (err) {
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;
    return ReportLoadError(slug, err) as unknown as JSX.Element;
  }
}
