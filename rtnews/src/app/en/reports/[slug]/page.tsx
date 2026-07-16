// ─── English Report Detail Page ──────────────────────────────
// Server Component — fetches a single English report by slug
// Mirrors the Arabic page.tsx with robust slug matching, content processing,
// and fallback content generation. Handles both EconomicReport and MarketAnalysis.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import EnReportDetailClient from './EnReportDetailClient';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

// ─── English Fallback Content Generator ───────────────────────────────
// When AI generation fails or returns empty content, generate
// meaningful placeholder content from the analysis metadata (IN ENGLISH).

const ASSET_CLASS_INFO_EN: Record<string, { nameEn: string; description: string; sectors: string[]; keyDrivers: string[]; risks: string[] }> = {
  strategic: {
    nameEn: 'Strategic Reports',
    description: 'In-depth analytical reports on specific topics requested by the user, different from automated daily reports. They rely on deep AI analysis with real news data.',
    sectors: ['Economic Analysis', 'Financial Markets', 'Future Scenarios', 'Strategic Recommendations'],
    keyDrivers: ['Major economic and geopolitical events', 'Central bank policies and their regional impacts', 'Global financial market shifts', 'Institutional investment trends'],
    risks: ['Sudden changes in monetary policies', 'Unexpected geopolitical developments', 'Sharp volatility in energy and currency markets', 'Broader-than-expected economic slowdown'],
  },
  forex: {
    nameEn: 'Forex',
    description: 'The foreign exchange market is the largest financial market in the world with a daily trading volume exceeding $7 trillion. This market is influenced by central bank monetary policies, macroeconomic data, and geopolitical events.',
    sectors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    keyDrivers: ['Interest rate decisions from the Federal Reserve and ECB', 'Inflation and economic growth data', 'Geopolitical tensions and energy prices', 'US Dollar index and capital flow movements'],
    risks: ['Sharp volatility from unexpected central bank decisions', 'Government intervention in exchange rates', 'Regional political crises affecting emerging market currencies', 'Global economic slowdown leading to capital flight'],
  },
  stocks: {
    nameEn: 'Stocks',
    description: 'The global stock market sees mutual influence between major exchanges, with focus on earnings season for major companies and monetary policy expectations.',
    sectors: ['US Stocks', 'European Stocks', 'Asian Stocks', 'Gulf Stocks'],
    keyDrivers: ['Corporate earnings season and analyst expectations', 'Interest rate decisions and their impact on valuations', 'Technology developments and artificial intelligence', 'International investment flows'],
    risks: ['Price corrections after uptrend periods', 'Economic growth slowdown impacting earnings', 'Tightening regulations in key sectors', 'Trade wars and tariffs'],
  },
  crypto: {
    nameEn: 'Cryptocurrencies',
    description: 'The cryptocurrency market is characterized by high volatility and sensitivity to regulatory events, technological developments, and institutional capital movements.',
    sectors: ['Bitcoin', 'Ethereum', 'Altcoins', 'Decentralized Finance'],
    keyDrivers: ['Institutional capital inflows and ETF funds', 'Global regulatory developments', 'Network and protocol updates', 'Interest rates and global liquidity environment'],
    risks: ['Sharp and sudden price volatility', 'Strict regulatory intervention in key markets', 'Security risks and platform breaches', 'Loss of confidence and major project collapses'],
  },
  economy: {
    nameEn: 'Macroeconomy',
    description: 'The global economy faces multiple challenges including inflation, central bank policies, and potential growth slowdown amid ongoing geopolitical tensions.',
    sectors: ['Economic Growth', 'Inflation', 'Interest Rates', 'International Trade'],
    keyDrivers: ['Central bank policies and interest rate decisions', 'Inflation and GDP data', 'International trade and supply chains', 'Government fiscal policies'],
    risks: ['Global economic recession', 'Persistent inflation exceeding expectations', 'Sovereign debt crises', 'Trade wars and tariffs'],
  },
  energy: {
    nameEn: 'Energy',
    description: 'The global energy market is influenced by supply-demand balance, OPEC decisions, and geopolitical tensions in key production regions.',
    sectors: ['Crude Oil', 'Natural Gas', 'Renewable Energy', 'Petrochemicals'],
    keyDrivers: ['OPEC decisions on production levels', 'Chinese demand and Asian economic growth', 'Middle East tensions and Strait of Hormuz', 'Transition to clean energy'],
    risks: ['Price wars between major producers', 'Impact of wars and crises on supply', 'Global demand slowdown due to recession', 'Trade sanctions on producing countries'],
  },
  commodities: {
    nameEn: 'Commodities',
    description: 'Commodity markets are influenced by multiple factors including dollar strength, industrial demand, weather conditions, and geopolitical tensions.',
    sectors: ['Gold', 'Silver', 'Copper', 'Agricultural Products'],
    keyDrivers: ['US Dollar movements and interest rates', 'Industrial demand from China and major economies', 'Weather conditions affecting crops', 'Geopolitical threats as safe haven'],
    risks: ['Supply shortages from natural or political events', 'Global industrial demand slowdown', 'Exchange rate volatility', 'Speculation in futures markets'],
  },
  realEstate: {
    nameEn: 'Real Estate',
    description: 'The real estate sector is influenced by interest rates, financing policies, demographic demand, and government infrastructure investments.',
    sectors: ['Residential', 'Commercial', 'REITs', 'Development'],
    keyDrivers: ['Mortgage rates and interest rates', 'Population growth and urbanization', 'Government infrastructure investments', 'Regulatory and incentive policies'],
    risks: ['Real estate bubble from over-leveraging', 'Rising interest rates reducing demand', 'Economic slowdown affecting purchasing power', 'Tightening regulatory laws'],
  },
  banking: {
    nameEn: 'Banking',
    description: 'The banking sector is directly influenced by the interest rate environment, monetary policies, credit quality, and digital transformation.',
    sectors: ['Traditional Banks', 'Islamic Banks', 'Investment Banks', 'Digital Finance'],
    keyDrivers: ['Interest rate structure and profit margins', 'Credit portfolio quality and default rates', 'Digital transformation and banking innovation', 'Regulations and compliance'],
    risks: ['Rising loan default rates', 'Interest rate volatility impacting margins', 'Cyber and security risks', 'Competition from fintech companies'],
  },
  bonds: {
    nameEn: 'Bonds',
    description: 'The global bond market is a key measure of interest rate and inflation expectations, and an indicator of investor risk appetite.',
    sectors: ['Government Bonds', 'Corporate Bonds', 'High-Yield Bonds', 'Islamic Bonds'],
    keyDrivers: ['Central bank decisions on interest rates', 'Inflation and economic growth expectations', 'Sovereign and corporate credit ratings', 'Supply and demand for new debt'],
    risks: ['Rising yields from monetary tightening', 'Default risk for high-yield bonds', 'Liquidity risks during difficult times', 'Exchange rate volatility for foreign-currency bonds'],
  },
  technicalAnalysis: {
    nameEn: 'Technical Analysis',
    description: 'In-depth technical analysis of currency pairs, cryptocurrencies, commodities, and stocks, based on technical indicators, price patterns, and support/resistance levels with specific scenarios and actionable recommendations.',
    sectors: ['Forex', 'Cryptocurrencies', 'Gold & Oil', 'Global Stocks'],
    keyDrivers: ['Key support and resistance levels', 'Technical indicators (RSI, MACD, Moving Averages)', 'Price and candlestick patterns', 'Trading volume and liquidity indicators'],
    risks: ['Conflicting technical signals across different timeframes', 'False breakouts of key levels', 'Sudden changes from geopolitical or economic events', 'Low liquidity during certain periods'],
  },
  earnings: {
    nameEn: 'Corporate Earnings',
    description: 'Corporate earnings season is one of the most important market drivers, as major companies reveal their quarterly financial results and directly impact stock prices and market trends.',
    sectors: ['US Corporate Earnings', 'European Corporate Earnings', 'Gulf Corporate Earnings', 'Analyst Expectations'],
    keyDrivers: ['Actual earnings results vs analyst expectations', 'Future guidance expectations from companies', 'Profit margins and operating revenues', 'Growth rates and their impact on valuations'],
    risks: ['Disappointment from major company results and negative market impact', 'Downgrades of future earnings expectations', 'Inflation pressure on profit margins', 'Large divergence between sectors and regions'],
  },
};

function generateFallbackContentEn(analysis: { assetClass: string; sentiment: string; confidenceScore: number; riskLevel: string; title: string }): { sections: Record<string, string>; highlights: string[] } {
  const info: any = ASSET_CLASS_INFO_EN[analysis.assetClass] || ASSET_CLASS_INFO_EN.economy;
  const sentimentLabel = analysis.sentiment === 'bullish' ? 'Bullish' : analysis.sentiment === 'bearish' ? 'Bearish' : 'Neutral';
  const riskLabel = analysis.riskLevel === 'low' ? 'Low' : analysis.riskLevel === 'high' ? 'High' : analysis.riskLevel === 'extreme' ? 'Very High' : 'Medium';
  const isStrategic = analysis.assetClass === 'strategic';

  const sections: Record<string, string> = {};
  const highlights: string[] = [];

  if (isStrategic) {
    sections.overview = `This strategic report provides an in-depth analysis of a specific topic, different from automated daily reports. It relies on deep AI analysis with real news data, covering time-based scenarios, affected assets, and strategic recommendations.\n\n${info.description}`;
  } else {
    sections.overview = `This report provides a comprehensive analysis of the ${info.nameEn} market based on available data and indicators. The confidence level of ${analysis.confidenceScore}% reflects the reliability of the data used in this analysis, while the overall trend indicates a ${sentimentLabel} market position.\n\n${info.description}`;

    sections.detailedAnalysis = `The current landscape of the ${info.nameEn} market is shaped by several key factors:\n\n${info.keyDrivers.map((d, i) => {
      const descriptions: Record<number, string> = {
        0: `${d} is directly linked to current price movements — any new data in this area could trigger immediate price action.`,
        1: `Developments in ${d} serve as a leading indicator for market direction, especially amid liquidity fluctuations.`,
        2: `${d} contributes to determining the expected volatility range in the short and medium term.`,
        3: `Shifts in ${d} affect strategic allocation decisions in the ${info.nameEn} market.`,
      };
      return `${i + 1}. **${d}**: ${descriptions[i] || descriptions[3]}`;
    }).join('\n\n')}`;
  }

  sections.riskAssessment = `Risk level in the ${info.nameEn} market is currently assessed as "${riskLabel}":\n\n${info.risks.map((r, i) => `- ${r}`).join('\n')}`;

  sections.strategicRecommendations = `Based on the above analysis and the ${sentimentLabel} market trend:\n\n### Conservative Investor\n- Reduce exposure to high-volatility assets in the ${info.nameEn} market\n- Focus on defensive assets with fixed returns\n- Set precise stop-loss levels for any new position\n\n### Moderate Investor\n- Distribute investments between ${info.sectors.slice(0, 2).join(' and ')} assets\n- Wait for trend stabilization before entering new positions\n\n### Day Trader\n- Monitor key support and resistance levels\n- Leverage ${info.nameEn} volatility during active trading sessions`;

  sections.outlook = `### Bullish Scenario (${sentimentLabel === 'Bullish' ? '55' : '30'}% probability)\nContinued support from ${info.keyDrivers[0] || 'current factors'} could push the ${info.nameEn} market toward higher levels, especially with improving economic data.\n\n### Neutral Scenario (${sentimentLabel === 'Neutral' ? '50' : '40'}% probability)\nContinuation of the current situation with trading confined within the current range, pending clarity on ${info.keyDrivers[1] || 'key factors'} direction.\n\n### Bearish Scenario (${sentimentLabel === 'Bearish' ? '55' : '25'}% probability)\nEscalating impact of ${info.risks[0] || 'current risks'} could pressure prices, especially with declining risk appetite.`;

  highlights.push(
    `Confidence Level: ${analysis.confidenceScore}% — ${analysis.confidenceScore >= 70 ? 'High reliability' : analysis.confidenceScore >= 50 ? 'Medium reliability' : 'Limited reliability'}`,
    `Overall Trend: ${sentimentLabel}`,
    `Risk Level: ${riskLabel}`,
    `Affected Sectors: ${(info as any).sectors.slice(0, 3).join(', ')}`,
  );

  return { sections, highlights };
}

// ─── Universal Content Processor (English version) ──────────────────
// Processes BOTH EconomicReport and MarketAnalysis content
// from JSON format into a clean structure for EnReportDetailClient.

// Map section headings to English keys
const HEADING_TO_KEY: Record<string, string> = {
  // Strategic report sections
  'Executive Summary': 'executiveSummary',
  'Context & Background': 'context',
  'Direct Economic Impact': 'economicImpact',
  'Market Impact': 'marketImpact',
  'Scenarios': 'scenarios',
  'Affected Assets': 'affectedAssets',
  'Strategic Recommendations': 'strategicRecommendations',
  'Follow-up Indicators': 'followUpIndicators',
  'Overview': 'overview',
  'Introduction': 'introduction',
  'Risk Assessment': 'riskAssessment',
  'Outlook': 'outlook',
  // Arabic headings (reports may have Arabic content even if locale is en)
  'الملخص التنفيذي': 'executiveSummary',
  'السياق والخلفية': 'context',
  'التداعيات الاقتصادية المباشرة': 'economicImpact',
  'تأثير على أسواق المال': 'marketImpact',
  'السيناريوهات': 'scenarios',
  'الأصول المتأثرة للمتداول': 'affectedAssets',
  'التوصيات الاستراتيجية': 'strategicRecommendations',
  'مؤشرات المتابعة': 'followUpIndicators',
  'نظرة عامة': 'overview',
  'مقدمة التقرير': 'introduction',
  'تقييم المخاطر': 'riskAssessment',
  'التوقعات': 'outlook',
  // Commodities sections
  'Gold & Precious Metals Analysis': 'goldAnalysis',
  'Industrial Metals Analysis': 'industrialMetals',
  'Agricultural Commodities Analysis': 'agriculturalCommodities',
  'Global Supply & Demand': 'supplyDemand',
  'Dollar Impact on Commodities': 'dollarImpact',
  'تحليل الذهب والمعادن النفيسة': 'goldAnalysis',
  'تحليل المعادن الصناعية': 'industrialMetals',
  'تحليل السلع الزراعية': 'agriculturalCommodities',
  'العرض والطلب العالمي': 'supplyDemand',
  'تأثير الدولار على السلع': 'dollarImpact',
  // Energy sections
  'Oil Analysis': 'oilAnalysis',
  'Gas Analysis': 'gasAnalysis',
  'Renewable Energy': 'renewableEnergy',
  'OPEC Impact': 'opecImpact',
  'تحليل النفط': 'oilAnalysis',
  'تحليل الغاز': 'gasAnalysis',
  'الطاقة المتجددة': 'renewableEnergy',
  'تأثير أوبك': 'opecImpact',
  // Forex sections
  'Currency Pairs Analysis': 'currencyPairsAnalysis',
  'Supply & Demand Analysis': 'supplyDemandAnalysis',
  'تحليل أزواج العملات': 'currencyPairsAnalysis',
  'تحليل العرض والطلب': 'supplyDemandAnalysis',
  // Common sections
  'Rouaa Recommendations': 'rouaRecommendations',
  'Key Movers': 'keyMovers',
  "Today's Events & Corporate News": 'todayCalendar',
  'Direction': 'direction',
  "What We're Watching": 'whatWeWatching',
  'Confidence Assessment': 'confidenceAssessment',
  'Market Pulse': 'marketPulse',
  "Tomorrow's Outlook": 'tomorrowOutlook',
  'Weekly Overview': 'weeklyOverview',
  'Sector Performance': 'sectorPerformance',
  'Market Sentiment Analysis': 'sentimentAnalysis',
  'Technical Outlook': 'technicalOutlook',
  'Event Calendar': 'eventCalendar',
  'توصيات رؤى': 'rouaRecommendations',
  'المحركات الرئيسية': 'keyMovers',
  'أحداث اليوم': 'todayCalendar',
  'الاتجاه': 'direction',
  'ما نراقبه': 'whatWeWatching',
  'تقييم الثقة': 'confidenceAssessment',
  'نبض السوق': 'marketPulse',
  'نظرة الغد': 'tomorrowOutlook',
  'أداء القطاعات': 'sectorPerformance',
  'تحليل المشاعر': 'sentimentAnalysis',
  'النظرة الفنية': 'technicalOutlook',
  'تقويم الأحداث': 'eventCalendar',
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

    // Extract sections from parsed.sections
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

    // Fallback — extract section keys from TOP-LEVEL JSON when parsed.sections doesn't exist
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

    // Extract from aiContent
    const aiContentSource = parsed.metadata?.aiContent || parsed.aiContent;
    if (aiContentSource && typeof aiContentSource === 'object') {
      const ai = aiContentSource;
      const aiSectionMap: Record<string, string> = {
        summary: 'overview',
        detailedAnalysis: 'detailedAnalysis',
        recommendations: 'strategicRecommendations',
        riskFactors: 'riskAssessment',
        outlook: 'outlook',
        technicalAnalysis: 'technicalOutlook',
        fundamentalAnalysis: 'fundamentalAnalysis',
        marketPulse: 'marketPulse',
        sectorAnalysis: 'sectorPerformance',
        sentimentDetails: 'sentimentAnalysis',
        currencyPairsAnalysis: 'currencyPairsAnalysis',
        supplyDemandAnalysis: 'supplyDemandAnalysis',
        oilAnalysis: 'oilAnalysis',
        gdpAnalysis: 'gdpAnalysis',
        bankEarnings: 'bankEarnings',
        residentialMarket: 'residentialMarket',
        yieldCurveAnalysis: 'yieldCurveAnalysis',
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

    // Extract metadata
    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};

    // Build summary
    const rawSummary = result.sections.introduction || result.sections.overview
      || result.sections.executiveSummary || result.sections.weeklyOverview
      || result.sections.economicOverview || result.sections.quarterlyOverview
      || result.sections.eventAnalysis || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);

    if (result.summary.length > 500) {
      result.summary = truncateAtBoundary(result.summary, 500);
    }

  } catch {
    // Not JSON — treat as plain text or Markdown
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
    return { title: 'Report Not Found — Rouaa', description: 'AI-powered financial analysis' };
  }

  try {
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({
      where: { locale: 'en', isPublished: true, OR: [{ id: slug }, { slug }] },
      select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
    });

    // Try URL-encoded slug
    if (!report) {
      let decodedSlug = slug;
      try { decodedSlug = decodeURIComponent(slug); } catch {}
      if (decodedSlug !== slug) {
        report = await db.economicReport.findFirst({
          where: { locale: 'en', isPublished: true, OR: [{ id: decodedSlug }, { slug: decodedSlug }] },
          select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
        });
      }
    }

    // Try MarketAnalysis
    if (!report) {
      const analysis: any = await db.marketAnalysis.findFirst({
        where: { locale: 'en', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: { id: true, title: true, content: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true },
      });
      if (analysis) {
        let analysisSummary = '';
        try {
          const parsed = JSON.parse(analysis.content || '{}');
          analysisSummary = parsed.metadata?.summary || parsed.summary || '';
          if (!analysisSummary && parsed.sections) {
            const sections = parsed.sections as Record<string, string>;
            analysisSummary = sections.introduction || sections.overview || sections.executiveSummary || '';
          }
        } catch {}
        report = {
          id: analysis.id,
          title: analysis.title,
          summary: analysisSummary,
          slug: analysis.slug,
          scope: analysis.assetClass || 'economy',
          reportType: 'analysis' as const,
          marketImpact: analysis.sentiment || 'neutral',
          confidenceScore: analysis.confidenceScore,
          imageUrl: null,
        } as any;
      }
    }

    if (!report) return { title: 'Report Not Found — Rouaa' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const hdrs = await headers();
      const host = hdrs.get('host');
      const proto = hdrs.get('x-forwarded-proto') || 'https';
      if (host) baseUrl = `${proto}://${host}`;
    } catch {}

    const title = report.title;
    let bestSummary = '';
    if (report.content) {
      try {
        const processed = processContent(report.content);
        if (processed.summary && processed.summary.trim().length > 10) {
          bestSummary = processed.summary;
        }
      } catch {}
    }
    const rawDesc = bestSummary
      ? stripSummaryMarkdown(bestSummary)
      : (report.summary ? stripSummaryMarkdown(report.summary) : '');
    const description = rawDesc ? truncateAtBoundary(rawDesc, 160, '') : 'Comprehensive financial analysis report';

    return {
      title: `${title} — Rouaa Reports`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/en/reports/${report.slug || slug}`,
        siteName: 'Rouaa',
        locale: 'en_US',
        type: 'article',
        images: [{ url: report.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [report.imageUrl || `${baseUrl}/og-image.png`],
      },
      alternates: { canonical: `/en/reports/${report.slug || slug}` },
    };
  } catch {
    return { title: 'Rouaa Reports', description: 'AI-powered financial analysis' };
  }
}

// ─── Error Fallback Component ─────────────────────────────────
// Returned when the page body throws. Shows a graceful message to the user
// AND logs the full error to console.error so it shows in Railway logs.
function ReportLoadError(slug: string, locale: 'en' | 'tr' | 'fr' | 'es' = 'en', err?: unknown) {
  // CRITICAL: Log the FULL error stack to console — this is the only way
  // to see what actually failed in production (Railway logs).
  if (err) {
    console.error('════════════════════════════════════════');
    console.error(`🚨 [EN REPORT PAGE] Failed to load report slug="${slug}" locale="${locale}"`);
    console.error('════════════════════════════════════════');
    console.error('Error name:', (err as Error)?.name);
    console.error('Error message:', (err as Error)?.message);
    console.error('Error stack:', (err as Error)?.stack);
    if ((err as any)?.cause) console.error('Error cause:', (err as any).cause);
    console.error('Full error object:', err);
    console.error('════════════════════════════════════════');
  }

  const messages = {
    en: { title: 'Failed to Load Report', body: 'An error occurred while loading this report. The error has been logged.', retry: 'Try Again', back: 'Back to Reports', backHref: '/en/reports' },
    tr: { title: 'Rapor Yüklenemedi', body: 'Bu rapor yüklenirken bir hata oluştu. Hata kaydedildi.', retry: 'Tekrar Dene', back: 'Raporlara Dön', backHref: '/tr/reports' },
    fr: { title: 'Échec du Chargement', body: 'Une erreur est survenue lors du chargement de ce rapport. L\'erreur a été enregistrée.', retry: 'Réessayer', back: 'Retour aux Rapports', backHref: '/fr/reports' },
    es: { title: 'No se pudo Cargar el Informe', body: 'Ocurrió un error al cargar este informe. El error ha sido registrado.', retry: 'Intentar de Nuevo', back: 'Volver a Informes', backHref: '/es/reports' },
  };
  const m = messages[locale] || messages.en;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', direction: 'ltr', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>{m.title}</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>{m.body}</p>
        {slug && <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-all' }}>slug: {slug}</p>}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={m.backHref} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#00E5FF', color: '#0A0E27', textDecoration: 'none' }}>{m.back}</a>
          <a href={m.backHref} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0', textDecoration: 'none' }}>{m.retry}</a>
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────
export default async function EnReportSlugPage({ params }: { params: Promise<{ slug: string }> }) {
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
          <h1 className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>Loading report...</h1>
          <p style={{ color: '#64748B' }}>The report will appear once data is available</p>
        </div>
      </div>
    );
  }

  // ─── Robust slug matching (mirrors Arabic page.tsx) ─────────────

  // Strategy 1: Direct match by id or slug with locale=en
  let report = await db.economicReport.findFirst({
    where: { locale: 'en', isPublished: true, OR: [{ id: slug }, { slug }] },
  });

  // Strategy 2: Try with the raw (possibly URL-encoded) slug
  if (!report && slug !== rawSlug) {
    report = await db.economicReport.findFirst({
      where: { locale: 'en', isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] },
    });
  }

  // Strategy 3: Without locale filter (report might not have locale set correctly)
  if (!report) {
    report = await db.economicReport.findFirst({
      where: { isPublished: true, OR: [{ id: slug }, { slug }] },
    });
    // Only use if it's actually an English report
    if (report && report.locale !== 'en') {
      report = null; // It's a non-English report (Arabic or French), skip it
    }
  }

  // Strategy 4: For strategic reports, match by nanoid suffix
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({
        where: {
          locale: 'en',
          isPublished: true,
          reportType: 'strategic',
          slug: { endsWith: `-${slugSuffix}` },
        },
      });
    }
    if (!report && parts.length >= 2) {
      const lastTwo = parts.slice(-2).join('-');
      if (lastTwo.length >= 7) {
        report = await db.economicReport.findFirst({
          where: {
            locale: 'en',
            isPublished: true,
            reportType: 'strategic',
            slug: { endsWith: lastTwo },
          },
        });
      }
    }
    // Also try without locale filter
    if (!report) {
      if (slugSuffix && slugSuffix.length >= 5) {
        report = await db.economicReport.findFirst({
          where: {
            isPublished: true,
            reportType: 'strategic',
            slug: { endsWith: `-${slugSuffix}` },
          },
        });
        if (report && report.locale !== 'en') report = null;
      }
    }
  }

  // Strategy 5: Partial slug match (first 20 chars) for long slugs
  if (!report && slug.length > 20) {
    report = await db.economicReport.findFirst({
      where: {
        locale: 'en',
        isPublished: true,
        slug: { startsWith: slug.slice(0, 20) },
      },
    });
  }

  let isAnalysis = false;

  // V1037: MarketAnalysis queries throw PrismaClientKnownRequestError in production.
  // We log e.code explicitly (Prisma puts the P-code there) and retry with a
  // minimal `select` clause as a defensive fallback against schema mismatch.
  const logPrismaError = (label: string, e: unknown) => {
    const err = e as any;
    console.error(`🚨 [EN Report] ${label}`);
    console.error(`  class: ${err?.constructor?.name}  code: ${err?.code ?? '(none)'}  clientVersion: ${err?.clientVersion ?? '(none)'}`);
    console.error(`  message: ${err?.message ?? '(none)'}`);
    try { console.error(`  meta: ${JSON.stringify(err?.meta)}`); } catch {}
  };

  // Fallback: try finding a MarketAnalysis
  if (!report) {
    console.log('[EN Report] Strategy: trying MarketAnalysis with locale=en, slug:', slug);
    let analysis: any = await db.marketAnalysis.findFirst({
      where: { locale: 'en', isPublished: true, OR: [{ id: slug }, { slug }] },
    }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=en) FAILED', e); return null; });
    console.log('[EN Report] MarketAnalysis(locale=en) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');

    // V1037: Defensive fallback — retry with minimal `select`
    if (!analysis) {
      console.log('[EN Report] Strategy: retry MarketAnalysis(locale=en) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({
        where: { locale: 'en', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: {
          id: true, title: true, slug: true, content: true,
          assetClass: true, sentiment: true, confidenceScore: true,
          riskLevel: true, isPublished: true,
          publishedAt: true, createdAt: true, updatedAt: true,
          locale: true,
        },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=en, MINIMAL) FAILED', e); return null; });
      console.log('[EN Report] MarketAnalysis(locale=en, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // Also try without locale filter
    if (!analysis) {
      console.log('[EN Report] Strategy: trying MarketAnalysis without locale filter, slug:', slug);
      analysis = await db.marketAnalysis.findFirst({
        where: { isPublished: true, OR: [{ id: slug }, { slug }] },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale) FAILED', e); return null; });
      if (analysis && analysis.locale !== 'en') analysis = null;
      console.log('[EN Report] MarketAnalysis(no locale) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // V1037: Defensive fallback — retry without locale + MINIMAL select
    if (!analysis) {
      console.log('[EN Report] Strategy: retry MarketAnalysis(no locale) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({
        where: { isPublished: true, OR: [{ id: slug }, { slug }] },
        select: {
          id: true, title: true, slug: true, content: true,
          assetClass: true, sentiment: true, confidenceScore: true,
          riskLevel: true, isPublished: true,
          publishedAt: true, createdAt: true, updatedAt: true,
          locale: true,
        },
      }).catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale, MINIMAL) FAILED', e); return null; });
      if (analysis && analysis.locale !== 'en') analysis = null;
      console.log('[EN Report] MarketAnalysis(no locale, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    if (analysis) {
      isAnalysis = true;
      const assetClass = analysis.assetClass || 'economy';

      // Process content using the universal processor
      const processed = processContent(analysis.content || '{}');

      // Check if we have meaningful content
      const sectionsWithContent = Object.values(processed.sections)
        .filter(v => typeof v === 'string' && v.trim().length > 80);
      const hasContent = sectionsWithContent.length >= 2;

      // Merge fallback content for missing key sections
      if (!hasContent) {
        const fallback = generateFallbackContentEn({
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

      // Build indicators
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

      // Build content JSON from processed sections
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

      // Fetch related English reports
      const related = await db.marketAnalysis.findMany({
        where: { locale: 'en', isPublished: true, id: { not: analysis.id } },
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

      return <EnReportDetailClient report={normalizedReport} related={normalizedRelated} />;
    }
  }

  if (!report) notFound();

  // ─── Process EconomicReport content ────────────────────────
  let processed: { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string };
  try {
    processed = processContent(report.content || '{}');
  } catch (e) {
    console.error('[EN Report Page] processContent error:', e);
    processed = { sections: {}, metadata: {}, dataQuality: {}, summary: report.summary || '' };
  }

  // Check if we have meaningful content
  const sectionsWithContent = Object.values(processed.sections)
    .filter(v => typeof v === 'string' && v.trim().length > 80);
  const hasContent = sectionsWithContent.length >= 2;

  // Merge fallback content if needed
  if (!hasContent) {
    const fallback = generateFallbackContentEn({
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

  // Build content JSON from processed sections
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
    sourceUrls: (() => { try { const s = report.sourceUrls; if (typeof s === 'string') return safeParse(s); return Array.isArray(s) ? s : []; } catch { return []; } })(),
    imageUrl: report.imageUrl || undefined,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    isAnalysis: false,
  };

  // Fetch related English reports
  const related = await db.economicReport.findMany({
    where: { locale: 'en', isPublished: true, id: { not: report.id }, scope: report.scope || undefined },
    take: 4,
    orderBy: { publishedAt: 'desc' },
  }).catch(() => []);

  const normalizedRelated = (related || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    reportType: r.reportType || 'daily',
    marketImpact: (r as any).marketImpact || r.sentiment || 'neutral',
    confidenceScore: r.confidenceScore || 50,
    publishedAt: r.publishedAt,
  }));

  return <EnReportDetailClient report={normalizedReport} related={normalizedRelated} />;
  } catch (err) {
    // Re-throw Next.js notFound() errors so the 404 page renders correctly.
    // notFound() throws a special error with digest starting with 'NEXT_NOT_FOUND'.
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    // Also re-throw any error that looks like a Next.js internal navigation error
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;

    // Catch ALL other errors thrown during the page render — DB errors, JSON parse errors,
    // null dereferences, etc. Without this catch, Next.js shows the cryptic
    // "An error occurred in the Server Components render" message in production.
    // With this catch, the user gets a friendly error page AND the developer gets
    // the full stack trace in Railway logs.
    return ReportLoadError(slug, 'en', err) as unknown as JSX.Element;
  }
}
