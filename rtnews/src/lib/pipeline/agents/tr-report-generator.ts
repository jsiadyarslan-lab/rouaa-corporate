// ═══════════════════════════════════════════════════════════════
// Turkish Report Generator Agent
// Generates professional economic reports in Turkish.
// This is the Turkish counterpart of fr-report-generator.ts.
//
// Key differences from French report generator:
// - Turkish prompts for all report types
// - Turkish-specific speculation detection
// - Validates Turkish number integrity
// - Sets locale: 'tr' on generated reports
// ═══════════════════════════════════════════════════════════════

import { truncateAtBoundary } from '@/lib/clean-markdown';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import {
  type ReportType,
  type AssetClass,
} from '../../report-templates';
import { TR_PIPELINE_CONFIG } from '../tr-pipeline-config';
import {
  TR_PROMPT_QUALITY_RULES,
  TR_ANTI_HALLUCINATION_RULES,
  TR_SYSTEM_PROMPTS,
  TR_ANALYSIS_SYSTEM_PROMPT,
} from './tr-report-templates';
import { detectSpeculationTr } from './tr-analyzer';

// Re-export types for convenience
export type { ReportType, AssetClass } from '../../report-templates';

// ─── Types ──────────────────────────────────────────────────

export interface TrReportContext {
  event?: string;
  assetClass?: AssetClass;
  force?: boolean;
  scope?: string;
  wordCount?: number;
  prompt?: string;
  title?: string;
  region?: string;
  sectors?: string[];
  scenarios?: string[];
}

export interface TrGeneratedReport {
  title: string;
  slug: string;
  summary: string;
  content: string;
  reportType: ReportType;
  scope: string;
  sectors: string;
  countries: string;
  keyIndicators: string;
  marketImpact: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  sourceUrls: string;
  isPublished: boolean;
  publishedAt: Date;
  locale: string;
}

export interface TrGeneratedAnalysis {
  title: string;
  slug: string;
  assetClass: AssetClass;
  analysisType: string;
  timeFrame: string;
  content: string;
  indicators: string;
  priceTarget: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  relatedNewsIds: string;
  isPublished: boolean;
  publishedAt: Date;
  validUntil: Date;
  locale: string;
}

// ─── Turkish News Category Map ────────────────────────

const trNewsCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['Ekonomi', 'Hisseler', 'Enerji', 'Döviz', 'Kripto', 'Emtia', 'Bankacılık'],
  stocks: ['Hisseler', 'Piyasa', 'Borsa', 'Teknoloji', 'Mali Tablolar'],
  commodities: ['Emtia', 'Enerji', 'Petrol', 'Altın', 'Gümüş', 'Bakır', 'Metaller'],
  forex: ['Döviz', 'Kur', 'Dolar', 'Euro', 'Yen', 'Sterlin', 'Döviz Kurları'],
  crypto: ['Kripto', 'Kripto Para', 'Bitcoin', 'Ethereum', 'Blockchain', 'Dijital Varlıklar'],
  bonds: ['Tahviller', 'Hazine Bonosu', 'Getiriler', 'Faiz Oranları', 'Kredi', 'Sovereign Borç'],
  energy: ['Enerji', 'Petrol', 'Gaz', 'OPEC', 'Ham Petrol', 'Doğal Gaz'],
  realEstate: ['Gayrimenkul', 'Konut', 'Emlak', 'GYO', 'İpotek'],
  economy: ['Ekonomi', 'GSYH', 'Enflasyon', 'İşsizlik', 'Ticaret', 'Merkez Bankası', 'TCMB'],
  banking: ['Bankacılık', 'Bankalar', 'Kredi', 'Faiz Oranları', 'Finansal Hizmetler'],
  technicalAnalysis: ['Döviz', 'Kur', 'Hisseler', 'Teknik', 'Teknik Analiz'],
  arabMarkets: ['Hisseler', 'Piyasa', 'Körfez', 'Suudi Arabistan', 'BAE', 'Orta Doğu'],
  earnings: ['Hisseler', 'Mali Tablolar', 'Kârlar', 'Çeyreklik', 'Ciro'],
};

// Maps each AssetClass to the indicator category strings
const trIndicatorCategoryMap: Record<AssetClass, string[]> = {
  strategic: ['index', 'currency', 'commodity', 'crypto'],
  stocks: ['index'],
  commodities: ['commodity'],
  forex: ['currency'],
  crypto: ['crypto'],
  bonds: ['bond_yield'],
  energy: ['commodity', 'energy'],
  realEstate: ['index', 'real_estate'],
  economy: ['index', 'currency', 'commodity'],
  banking: ['index', 'bond_yield'],
  technicalAnalysis: ['currency', 'index'],
  arabMarkets: ['index'],
  earnings: ['index'],
};

// ─── Data window per report type ──────────────────────
const REPORT_DATA_WINDOW_MS: Record<ReportType, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  quarterly: 90 * 24 * 60 * 60 * 1000,
  special: 24 * 60 * 60 * 1000,
  strategic: 48 * 60 * 60 * 1000,
};

// Turkish asset class labels
const ASSET_CLASS_LABELS_TR: Record<AssetClass, string> = {
  strategic: 'Stratejik',
  stocks: 'Hisseler',
  commodities: 'Emtia',
  forex: 'Döviz',
  crypto: 'Kripto',
  bonds: 'Tahviller',
  energy: 'Enerji',
  realEstate: 'Gayrimenkul',
  economy: 'Ekonomi',
  banking: 'Bankacılık',
  technicalAnalysis: 'Teknik Analiz',
  arabMarkets: 'Arap Pazarları',
  earnings: 'Mali Tablolar',
};

// ─── Turkish Number Integrity Check ──────────────────────
function validateNumberIntegrityTr(content: string, sourceData: string): string[] {
  const issues: string[] = [];
  const sourceNumbers = sourceData.match(/\d+(?:[.,]\d+)?/g) || [];

  for (const num of sourceNumbers) {
    const numVal = parseFloat(num.replace(',', '.'));
    if (isNaN(numVal) || numVal < 1) continue;
    if (!content.includes(num)) {
      const shifted = (numVal / 10).toString();
      if (content.includes(shifted)) {
        issues.push(`Ondalık kayma tespit edildi: kaynaktaki "${num}" raporda "${shifted}" olmuş`);
      }
    }
  }

  return issues;
}

// ─── Data Collection with Category Filtering ──────────

async function collectNewsTr(since: Date, assetClass?: AssetClass): Promise<any[]> {
  try {
    const where: any = {
      isReady: true,
      locale: 'tr',
      fetchedAt: { gte: since },
    };

    if (assetClass && trNewsCategoryMap[assetClass]) {
      const categories = trNewsCategoryMap[assetClass];
      const categoryIdMap: Record<string, string> = {
        'Ekonomi': 'economy', 'Hisseler': 'stocks', 'Döviz': 'forex', 'Kripto': 'crypto',
        'Enerji': 'energy', 'Emtia': 'commodities', 'Gayrimenkul': 'realEstate',
        'Bankacılık': 'banking', 'Mali Tablolar': 'earnings', 'Tahviller': 'bonds',
        'Teknik Analiz': 'technicalAnalysis', 'Jeopolitik': 'strategic',
        'Teknoloji': 'technology', 'Flaş': 'breaking',
        'Borsa': 'stocks', 'Piyasa': 'stocks', 'Petrol': 'energy', 'Altın': 'commodities',
        'Kur': 'forex', 'Dolar': 'forex', 'Euro': 'forex', 'Blockchain': 'crypto',
        'Bitcoin': 'crypto', 'Ethereum': 'crypto', 'GSYH': 'economy', 'Enflasyon': 'economy',
        'İşsizlik': 'economy', 'Ticaret': 'economy', 'Merkez Bankası': 'economy',
        'TCMB': 'economy',
      };
      const englishCategoryIds = [...new Set(
        categories
          .map(c => categoryIdMap[c])
          .filter(Boolean)
      )];
      where.OR = [
        { category: { in: categories } },
        ...(englishCategoryIds.length > 0 ? [{ categoryId: { in: englishCategoryIds } }] : []),
      ];
    }

    let newsItems = await db.newsItem.findMany({
      where,
      select: {
        id: true, title: true, summary: true, category: true, categoryId: true,
        sentiment: true, sentimentScore: true, impactLevel: true, affectedAssets: true, fetchedAt: true,
      },
      take: 50,
      orderBy: { fetchedAt: 'desc' },
    });

    // Fallback to all Turkish articles if no articles found for specific asset class
    if (newsItems.length === 0 && assetClass && trNewsCategoryMap[assetClass]) {
      console.log(`[TrReportGenerator] No articles found for '${assetClass}' — falling back to ALL Turkish articles`);
      const fallbackWhere: any = {
        isReady: true,
        locale: 'tr',
        fetchedAt: { gte: since },
      };
      newsItems = await db.newsItem.findMany({
        where: fallbackWhere,
        select: {
          id: true, title: true, summary: true, category: true, categoryId: true,
          sentiment: true, sentimentScore: true, impactLevel: true, affectedAssets: true, fetchedAt: true,
        },
        take: 50,
        orderBy: { fetchedAt: 'desc' },
      });
    }

    return newsItems;
  } catch (error: any) {
    console.error('[TrReportGenerator] Türkçe haberler toplanırken hata:', error.message);
    return [];
  }
}

// ─── Helper: Calculate sentiment, risk, confidence ──

function calculateSentimentFromNews(newsItems: any[]): {
  positive: number; negative: number; neutral: number;
  sentimentRatio: number;
  marketImpact: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
} {
  let positive = 0, negative = 0, neutral = 0;
  for (const item of newsItems) {
    if (item.sentiment === 'positive') positive++;
    else if (item.sentiment === 'negative') negative++;
    else neutral++;
  }
  const total = positive + negative + neutral;
  const sentimentRatio = positive / Math.max(1, total);
  const marketImpact: 'bullish' | 'bearish' | 'neutral' =
    sentimentRatio > 0.5 ? 'bullish' : sentimentRatio < 0.3 ? 'bearish' : 'neutral';
  const riskLevel: 'low' | 'medium' | 'high' | 'extreme' =
    negative > positive * 2 ? 'extreme' : negative > positive ? 'high' : neutral > positive ? 'medium' : 'low';
  return { positive, negative, neutral, sentimentRatio, marketImpact, riskLevel };
}

// ─── Report Generation (Turkish) ─────────────────────

export async function generateDailyBriefTr(
  reportType: ReportType = 'daily',
  context?: TrReportContext,
): Promise<TrGeneratedReport | null> {
  const startTime = Date.now();

  try {
    const dataWindowMs = REPORT_DATA_WINDOW_MS[reportType] || REPORT_DATA_WINDOW_MS.daily;
    const since = new Date(Date.now() - dataWindowMs);
    const newsItems = await collectNewsTr(since);

    if (newsItems.length === 0) {
      console.log(`[TrReportGenerator] ${reportType} raporu için Türkçe haber bulunamadı`);
      return null;
    }

    const newsSummary = newsItems.slice(0, 30).map((item: any) => {
      return `- [${item.sentiment}] ${item.title} (${item.category})`;
    }).join('\n');

    const categoryBreakdown: Record<string, number> = {};
    const overallSentiment = calculateSentimentFromNews(newsItems);
    for (const item of newsItems) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    }

    let systemPrompt: string;
    if (reportType === 'strategic' && context?.prompt) {
      systemPrompt = context.prompt;
    } else if (reportType === 'strategic') {
      systemPrompt = TR_ANALYSIS_SYSTEM_PROMPT.strategic;
    } else {
      systemPrompt = TR_SYSTEM_PROMPTS[reportType] || TR_SYSTEM_PROMPTS.daily;
    }

    let topicFilteredNews = newsItems;
    if (reportType === 'strategic' && context?.sectors && context.sectors.length > 0) {
      const sectorCategories = context.sectors.flatMap(sector => {
        const normalizedSector = sector.toLowerCase();
        const sectorToCategoryMap: Record<string, string[]> = {
          'macroeconomics': ['Ekonomi', 'GSYH', 'Enflasyon', 'Merkez Bankası', 'TCMB'],
          'makroekonomi': ['Ekonomi', 'GSYH', 'Enflasyon', 'Merkez Bankası', 'TCMB'],
          'equities': ['Hisseler', 'Piyasa', 'Borsa', 'Teknoloji', 'Mali Tablolar'],
          'hisseler': ['Hisseler', 'Piyasa', 'Borsa', 'Teknoloji', 'Mali Tablolar'],
          'energy': ['Enerji', 'Petrol', 'Gaz', 'OPEC', 'Ham Petrol'],
          'enerji': ['Enerji', 'Petrol', 'Gaz', 'OPEC', 'Ham Petrol'],
          'forex': ['Döviz', 'Kur', 'Dolar', 'Euro', 'Yen', 'Sterlin'],
          'döviz': ['Döviz', 'Kur', 'Dolar', 'Euro', 'Yen', 'Sterlin'],
          'cryptocurrencies': ['Kripto', 'Kripto Para', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'kripto': ['Kripto', 'Kripto Para', 'Bitcoin', 'Ethereum', 'Blockchain'],
          'commodities': ['Emtia', 'Altın', 'Gümüş', 'Bakır', 'Metaller'],
          'emtia': ['Emtia', 'Altın', 'Gümüş', 'Bakır', 'Metaller'],
          'real estate': ['Gayrimenkul', 'Konut', 'Emlak', 'GYO'],
          'gayrimenkul': ['Gayrimenkul', 'Konut', 'Emlak', 'GYO'],
          'technology': ['Teknoloji', 'Yapay Zeka', 'Yazılım', 'Tech'],
          'teknoloji': ['Teknoloji', 'Yapay Zeka', 'Yazılım', 'Tech'],
        };
        return sectorToCategoryMap[normalizedSector] || [sector];
      });
      const filtered = newsItems.filter(item =>
        sectorCategories.some(cat =>
          item.category?.toLowerCase().includes(cat.toLowerCase()) ||
          item.title?.toLowerCase().includes(cat.toLowerCase())
        )
      );
      if (filtered.length >= 3) {
        topicFilteredNews = filtered;
      }
    }

    const effectiveNews = reportType === 'strategic' ? topicFilteredNews : newsItems;
    const effectiveSummary = effectiveNews.slice(0, 30).map((item: any) => {
      return `- [${item.sentiment}] ${item.title} (${item.category})`;
    }).join('\n');
    const effectiveCategoryBreakdown: Record<string, number> = {};
    const effectiveSentiment = calculateSentimentFromNews(effectiveNews);
    for (const item of effectiveNews) {
      effectiveCategoryBreakdown[item.category] = (effectiveCategoryBreakdown[item.category] || 0) + 1;
    }

    const dateStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthStr = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    let userPrompt: string;
    switch (reportType) {
      case 'daily':
        userPrompt = `Son 24 saatteki ${newsItems.length} Türkçe finansal haber makalesinden kapsamlı bir günlük piyasa bülteni yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${dateStr} tarihi için günlük piyasa bültenini oluşturun`;
        break;

      case 'weekly':
        userPrompt = `Geçen haftanın ${newsItems.length} Türkçe finansal haber makalesinden kapsamlı bir haftalık piyasa analizi yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${dateStr} tarihinde sona eren hafta için haftalık piyasa analizini oluşturun`;
        break;

      case 'monthly':
        userPrompt = `Son 30 günün ${newsItems.length} Türkçe finansal haber makalesinden kapsamlı aylık perspektif yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${monthStr} için aylık piyasa perspektifini oluşturun`;
        break;

      case 'quarterly':
        userPrompt = `Son çeyreğin ${newsItems.length} Türkçe finansal haber makalesinden kapsamlı bir çeyreklik değerlendirme yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${monthStr} için çeyreklik değerlendirmeyi oluşturun`;
        break;

      case 'special':
        userPrompt = `${newsItems.length} Türkçe finansal haber makalesinden${context?.event ? ` ${context.event} konusunda` : ''} özel bir rapor yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${dateStr} tarihi için özel raporu oluşturun`;
        break;

      case 'strategic':
        if (context?.prompt) {
          userPrompt = `${effectiveNews.length} Türkçe finansal haber makalesinden stratejik analiz raporunu yazın.

Konu : ${context.title || 'Genel stratejik analiz'}
Coğrafi kapsam : ${context.region || 'Küresel'}
Sektörler : ${context.sectors?.join(', ') || 'Tümü'}
Zaman ufukları : ${context.scenarios?.join(', ') || 'Kısa, Orta, Uzun vadeli'}

═══ HABERLER ═══
${effectiveSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${effectiveSentiment.positive} | Negatif : ${effectiveSentiment.negative} | Nötr : ${effectiveSentiment.neutral}

${dateStr} tarihi için stratejik analiz raporunu oluşturun`;
        } else {
          userPrompt = `${effectiveNews.length} Türkçe finansal haber makalesinden${context?.title ? ` ${context.title} konusunda` : ''} kapsamlı bir stratejik analiz raporu yazın.

═══ HABERLER ═══
${effectiveSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(effectiveCategoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${effectiveSentiment.positive} | Negatif : ${effectiveSentiment.negative} | Nötr : ${effectiveSentiment.neutral}

${dateStr} tarihi için stratejik analiz raporunu oluşturun`;
        }
        break;

      default:
        userPrompt = `${newsItems.length} Türkçe finansal haber makalesinden kapsamlı bir ${reportType} raporu yazın.

═══ HABERLER ═══
${newsSummary}

═══ KATEGORİ DAĞILIMI ═══
${Object.entries(categoryBreakdown).map(([cat, count]) => `${cat} : ${count}`).join('\n')}

═══ DUYGU GENEL GÖRÜNÜMÜ ═══
Pozitif : ${overallSentiment.positive} | Negatif : ${overallSentiment.negative} | Nötr : ${overallSentiment.neutral}

${dateStr} tarihi için ${reportType} raporunu oluşturun`;
    }

    const maxTokensByType: Record<ReportType, number> = {
      daily: 6000,
      weekly: 8000,
      monthly: 8000,
      quarterly: 10000,
      special: 8000,
      strategic: 10000,
    };

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: maxTokensByType[reportType] || 6000, priority: 'generation', locale: 'tr' });

    if (!aiResult.content) {
      console.error(`[TrReportGenerator] ${reportType} raporu için AI boş içerik döndürdü`);
      return null;
    }

    let content = aiResult.content.trim();

    // Speculation check — reports use higher threshold
    const reportBlockThreshold = TR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationTr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[TrReportGenerator] ${reportType} raporu spekülasyon filtresi tarafından engellendi (eşik: ${reportBlockThreshold}) : ${specReport.reason}`);
      return null;
    }

    // Number integrity check
    const numberIssues = validateNumberIntegrityTr(content, newsSummary);
    if (numberIssues.length > 0) {
      console.warn(`[TrReportGenerator] Sayı bütünlüğü sorunları: ${numberIssues.join('; ')}`);
    }

    const titleTypeLabel: Record<ReportType, string> = {
      daily: 'Günlük Piyasa Bülteni',
      weekly: 'Haftalık Piyasa Analizi',
      monthly: 'Aylık Perspektif',
      quarterly: 'Çeyreklik Değerlendirme',
      special: 'Özel Rapor',
      strategic: 'Stratejik Analiz',
    };

    let title: string;
    if (context?.title && context.title.trim().length > 0) {
      title = context.title.trim();
    } else {
      const titlePrompt = `Bu başlıklara dayalı kısa ve açıklayıcı bir Türkçe başlık (maks. 80 karakter) oluşturun :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

Başlık piyasanın ana temasını tanımlamalıdır. "Günlük Rapor" gibi genel önekler yok. Yalnızca başlık, tırnak işaretleri yok.`;

      const titleResult = await chatCompletion([
        { role: 'system', content: titlePrompt },
        { role: 'user', content: 'Başlığı oluşturun' },
      ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'tr' });

      const defaultTitle = `${titleTypeLabel[reportType]} : ${new Date().toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`;
      title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    }

    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const minConfidence: Record<ReportType, number> = {
      daily: 30, weekly: 30, monthly: 35, quarterly: 50, special: 30, strategic: 40,
    };
    const newsBonus = Math.min(20, Math.floor(newsItems.length / 3));
    const dataBonus = specReport.hasSpecificNumbers ? 10 : 0;
    const sentimentData = reportType === 'strategic' ? effectiveSentiment : overallSentiment;
    const totalSentimentCount = sentimentData.positive + sentimentData.negative + sentimentData.neutral;
    const sentimentConsensus = totalSentimentCount > 0
      ? Math.max(sentimentData.positive, sentimentData.negative, sentimentData.neutral) / totalSentimentCount
      : 0.5;
    const consensusBonus = Math.floor(sentimentConsensus * 10);
    const confidenceScore = Math.min(92, Math.max(minConfidence[reportType], 40 + newsBonus + dataBonus + consensusBonus));

    const report: TrGeneratedReport = {
      title,
      slug,
      summary: content.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 300) || title,
      content,
      reportType,
      scope: context?.region || 'global',
      sectors: context?.sectors ? JSON.stringify(context.sectors) : JSON.stringify(Object.keys(reportType === 'strategic' ? effectiveCategoryBreakdown : categoryBreakdown)),
      countries: '[]',
      keyIndicators: JSON.stringify({
        positive: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).positive,
        negative: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).negative,
        neutral: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).neutral,
        total: (reportType === 'strategic' ? effectiveNews : newsItems).length,
        izlenecekGostergeler: [
          { ad: 'Güven Endeksi', deger: confidenceScore, degisim: 0 },
          { ad: 'Piyasa Duygusu', deger: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bullish' ? 'Bullish' : (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact === 'bearish' ? 'Bearish' : 'Nötr', degisim: 0 },
          { ad: 'Haber Sayısı', deger: (reportType === 'strategic' ? effectiveNews : newsItems).length, degisim: 0 },
        ],
        yatirimciSegmentleri: ['Day Trader', 'Orta Vadeli Yatırımcı', 'Uzun Vadeli Yatırımcı'],
      }),
      marketImpact: (reportType === 'strategic' ? effectiveSentiment : overallSentiment).marketImpact,
      confidenceScore,
      sourceUrls: JSON.stringify(newsItems.slice(0, 10).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      locale: 'tr',
    };

    // Save to database
    try {
      await db.economicReport.create({
        data: {
          title: report.title,
          slug: report.slug,
          summary: report.summary,
          content: report.content,
          reportType: report.reportType,
          scope: report.scope,
          locale: report.locale,
          sectors: report.sectors,
          countries: report.countries,
          keyIndicators: report.keyIndicators,
          marketImpact: report.marketImpact,
          confidenceScore: report.confidenceScore,
          sourceUrls: report.sourceUrls,
          isPublished: report.isPublished,
          publishedAt: report.publishedAt,
        },
      });

      console.log(`[TrReportGenerator] ✓ ${reportType} raporu oluşturuldu: "${title}" ${Date.now() - startTime}ms'de`);
    } catch (dbErr: any) {
      console.error(`[TrReportGenerator] ${reportType} raporu kaydedilirken DB hatası : ${dbErr.message}`);
    }

    return report;
  } catch (err: any) {
    console.error(`[TrReportGenerator] ${reportType} raporu oluşturulurken hata : ${err.message}`);
    return null;
  }
}

// ─── Weekly Analysis Generation (Turkish) ────────────

export async function generateWeeklyAnalysisTr(
  assetClass: AssetClass = 'stocks',
  context?: TrReportContext,
): Promise<TrGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newsItems = await collectNewsTr(since, assetClass);

    if (newsItems.length === 0) {
      console.log(`[TrReportGenerator] Haftalık ${assetClass} analizi için Türkçe haber bulunamadı`);
      return null;
    }

    const assetClassLabel = ASSET_CLASS_LABELS_TR[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);
    const systemPrompt = TR_ANALYSIS_SYSTEM_PROMPT[assetClass] || TR_ANALYSIS_SYSTEM_PROMPT.stocks;

    const newsSummary = newsItems.slice(0, 20).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Geçen haftanın ${newsItems.length} Türkçe finansal haber makalesinden ${assetClassLabel} piyasalarının kapsamlı haftalık analizini yazın.

══️ SON HABERLER ═══
${newsSummary}

${new Date().toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' })} tarihinde sona eren hafta için ${assetClassLabel} haftalık analizini oluşturun`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 8000, priority: 'generation', locale: 'tr' });

    if (!aiResult.content) {
      console.error(`[TrReportGenerator] Haftalık ${assetClass} analizi için AI boş içerik döndürdü`);
      return null;
    }

    const content = aiResult.content.trim();

    const reportBlockThreshold = TR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationTr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[TrReportGenerator] Haftalık ${assetClass} analizi spekülasyon filtresi tarafından engellendi : ${specReport.reason}`);
      return null;
    }

    const titlePrompt = `Bu başlıklara dayalı kısa ve açıklayıcı bir Türkçe başlık (maks. 80 karakter) oluşturun :
${newsItems.slice(0, 10).map((i: any) => i.title).join('\n')}

Genel önekler yok. Yalnızca başlık, tırnak işaretleri yok.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Başlığı oluşturun' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'tr' });

    const defaultTitle = `Haftalık ${assetClassLabel} Analizi : ${new Date().toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const actualConfidence = Math.min(95, 40 + Math.min(totalSentiment, 30) + (specReport.hasSpecificNumbers ? 10 : 0));

    const analysis: TrGeneratedAnalysis = {
      title,
      slug,
      assetClass,
      analysisType: 'fundamental',
      timeFrame: 'weekly',
      content,
      indicators: JSON.stringify({ positive, negative, neutral, total: totalSentiment }),
      priceTarget: '{}',
      riskLevel,
      sentiment: marketImpact,
      confidenceScore: actualConfidence,
      relatedNewsIds: JSON.stringify(newsItems.slice(0, 5).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      locale: 'tr',
    };

    try {
      await db.marketAnalysis.create({
        data: {
          title: analysis.title,
          slug: analysis.slug,
          assetClass: analysis.assetClass,
          analysisType: analysis.analysisType,
          timeFrame: analysis.timeFrame,
          locale: analysis.locale,
          content: analysis.content,
          indicators: analysis.indicators,
          priceTarget: analysis.priceTarget,
          riskLevel: analysis.riskLevel,
          sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore,
          relatedNewsIds: analysis.relatedNewsIds,
          isPublished: analysis.isPublished,
          publishedAt: analysis.publishedAt,
          validUntil: analysis.validUntil,
        },
      });

      console.log(`[TrReportGenerator] ✓ Haftalık ${assetClass} analizi oluşturuldu: "${title}" ${Date.now() - startTime}ms'de`);
    } catch (dbErr: any) {
      console.error(`[TrReportGenerator] Haftalık ${assetClass} analizi kaydedilirken DB hatası : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[TrReportGenerator] Haftalık ${assetClass} analizi oluşturulurken hata : ${err.message}`);
    return null;
  }
}

// ─── Market Analysis Generation (Turkish) ────────────

export async function generateMarketAnalysisTr(
  assetClass: AssetClass,
  context?: TrReportContext,
): Promise<TrGeneratedAnalysis | null> {
  const startTime = Date.now();

  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const newsItems = await collectNewsTr(since, assetClass);

    const assetClassLabel = ASSET_CLASS_LABELS_TR[assetClass] || assetClass.charAt(0).toUpperCase() + assetClass.slice(1);
    const systemPrompt = TR_ANALYSIS_SYSTEM_PROMPT[assetClass];

    const newsSummary = newsItems.slice(0, 15).map((i: any) => {
      return `- [${i.sentiment}] ${i.title} (${i.category})`;
    }).join('\n');

    const userPrompt = `Varlık sınıfı : ${assetClassLabel}
Son haberler : ${newsItems.length}

${newsSummary}

${context?.prompt ? `Kullanıcı talebi : ${context.prompt}\n\n` : ''}${new Date().toLocaleDateString('tr-TR')} tarihi için ${assetClassLabel} piyasa analizini oluşturun`;

    const aiResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.4, maxTokens: 6000, priority: 'generation', locale: 'tr' });

    if (!aiResult.content) return null;

    const content = aiResult.content.trim();

    const reportBlockThreshold = TR_PIPELINE_CONFIG.SPECULATION_REPORT_BLOCK_THRESHOLD;
    const specReport = detectSpeculationTr(content, reportBlockThreshold);
    if (specReport.shouldNotPublish) {
      console.warn(`[TrReportGenerator] ${assetClass} piyasa analizi spekülasyon filtresi tarafından engellendi : ${specReport.reason}`);
      return null;
    }

    const titlePrompt = `Bu başlıklara dayalı kısa ve açıklayıcı bir Türkçe başlık (maks. 80 karakter) oluşturun :
${newsItems.slice(0, 8).map((i: any) => i.title).join('\n')}

Genel önekler yok. Yalnızca başlık, tırnak işaretleri yok.`;

    const titleResult = await chatCompletion([
      { role: 'system', content: titlePrompt },
      { role: 'user', content: 'Başlığı oluşturun' },
    ], { temperature: 0.3, maxTokens: 100, priority: 'translation', locale: 'tr' });

    const defaultTitle = `${assetClassLabel} Piyasa Analizi : ${new Date().toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`;
    const title = titleResult.content?.trim().replace(/^["']|["']$/g, '') || defaultTitle;
    const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);

    const { positive, negative, neutral, marketImpact, riskLevel } = calculateSentimentFromNews(newsItems);
    const totalSentiment = positive + negative + neutral;
    const confidenceScore = Math.min(90, 40 + Math.min(totalSentiment, 25) + (specReport.hasSpecificNumbers ? 10 : 0));

    const analysis: TrGeneratedAnalysis = {
      title,
      slug,
      assetClass,
      analysisType: 'fundamental',
      timeFrame: 'daily',
      content,
      indicators: JSON.stringify({ positive, negative, neutral, total: totalSentiment }),
      priceTarget: '{}',
      riskLevel,
      sentiment: marketImpact,
      confidenceScore,
      relatedNewsIds: JSON.stringify(newsItems.slice(0, 5).map((i: any) => i.id)),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      locale: 'tr',
    };

    try {
      await db.marketAnalysis.create({
        data: {
          title: analysis.title,
          slug: analysis.slug,
          assetClass: analysis.assetClass,
          analysisType: analysis.analysisType,
          timeFrame: analysis.timeFrame,
          locale: analysis.locale,
          content: analysis.content,
          indicators: analysis.indicators,
          priceTarget: analysis.priceTarget,
          riskLevel: analysis.riskLevel,
          sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore,
          relatedNewsIds: analysis.relatedNewsIds,
          isPublished: analysis.isPublished,
          publishedAt: analysis.publishedAt,
          validUntil: analysis.validUntil,
        },
      });

      console.log(`[TrReportGenerator] ✓ ${assetClass} piyasa analizi oluşturuldu: "${title}" ${Date.now() - startTime}ms'de`);
    } catch (dbErr: any) {
      console.error(`[TrReportGenerator] ${assetClass} piyasa analizi kaydedilirken DB hatası : ${dbErr.message}`);
    }

    return analysis;
  } catch (err: any) {
    console.error(`[TrReportGenerator] ${assetClass} piyasa analizi oluşturulurken hata : ${err.message}`);
    return null;
  }
}

// ─── Monthly Outlook Generation (Turkish) ────────────

export async function generateMonthlyOutlookTr(
  context?: TrReportContext,
): Promise<TrGeneratedReport | null> {
  return generateDailyBriefTr('monthly', context);
}

// ─── Technical Analysis Generation (Turkish) ─────────

export async function generateTechnicalAnalysisTr(
  context?: TrReportContext,
): Promise<TrGeneratedAnalysis | null> {
  return generateWeeklyAnalysisTr('technicalAnalysis', context);
}
