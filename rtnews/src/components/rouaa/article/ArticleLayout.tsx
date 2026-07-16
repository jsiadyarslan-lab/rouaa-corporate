// ─── Article Layout Component (Fintech UI) ───────────────────────
// Modern trading intelligence interface for financial news
// Optimized for decision-making, not just reading

import { ImpactBadge } from './ImpactBadge';
import { SentimentBadge } from './SentimentBadge';
import { MetricCard } from './MetricCard';
import { InsightCard } from './InsightCard';
import { TradingInsightCard } from './TradingInsightCard';
import { BullBearSection } from './BullBearSection';
import { sanitizeHtml } from '@/lib/sanitize';

interface ArticleLayoutProps {
  article: {
    title: string;
    titleAr?: string;
    summary: string;
    summaryAr?: string;
    category: string;
    source: string;
    time: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore?: number;
    impactLevel: 'high' | 'medium' | 'low';
    // AI Analysis data
    aiAnalysis?: {
      keyTakeaways?: string[];
      tradingInsight?: string;
      bullishFactors?: string[];
      bearishFactors?: string[];
      metrics?: Array<{
        label: string;
        value: string | number;
        trend?: 'up' | 'down' | 'neutral';
        trendValue?: string;
      }>;
    };
    // Full content
    content?: string;
  };
}

export function ArticleLayout({ article }: ArticleLayoutProps) {
  const displayTitle = article.titleAr || article.title;
  const displaySummary = article.summaryAr || article.summary;

  // Map sentiment to bullish/bearish/neutral
  const sentimentMap: Record<string, 'bullish' | 'bearish' | 'neutral'> = {
    positive: 'bullish',
    negative: 'bearish',
    neutral: 'neutral',
  };

  const aiData = article.aiAnalysis;

  return (
    <div className="min-h-screen bg-[#0B0F14]" dir="rtl">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0F14]/95 backdrop-blur-sm border-b border-[#1F2933] px-4 md:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImpactBadge level={article.impactLevel} />
            <SentimentBadge
              sentiment={sentimentMap[article.sentiment]}
              score={article.sentimentScore}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>{article.source}</span>
            <span>•</span>
            <span>{article.time}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Hero Title Section */}
        <div className="mb-8">
          <div className="text-sm text-gray-300 mb-2">
            {article.category} • {article.source}
          </div>
          <h1 className="text-2xl md:text-[36px] font-bold text-white leading-tight mb-4">
            {displayTitle}
          </h1>
          <div className="text-gray-300 text-base">{article.time}</div>
        </div>

        {/* Smart Summary Card */}
        {aiData?.keyTakeaways && aiData.keyTakeaways.length > 0 && (
          <div className="mb-8">
            <InsightCard insights={aiData.keyTakeaways} />
          </div>
        )}

        {/* Key Metrics Grid */}
        {aiData?.metrics && aiData.metrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {aiData.metrics.map((metric, index) => (
              <MetricCard
                key={index}
                label={metric.label}
                value={metric.value}
                trend={metric.trend}
                trendValue={metric.trendValue}
              />
            ))}
          </div>
        )}

        {/* Trading Insight Card */}
        {aiData?.tradingInsight && (
          <div className="mb-8">
            <TradingInsightCard insight={aiData.tradingInsight} />
          </div>
        )}

        {/* Bull vs Bear Section */}
        {aiData?.bullishFactors && aiData?.bearishFactors && (
          <div className="mb-8">
            <BullBearSection
              bullishFactors={aiData.bullishFactors}
              bearishFactors={aiData.bearishFactors}
            />
          </div>
        )}

        {/* Article Content */}
        <div className="bg-[#11161C] border border-[#1F2933] rounded-lg p-4 md:p-8 mb-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              {displaySummary}
            </p>
            {article.content && (
              <div
                className="text-gray-300 text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
              />
            )}
          </div>
        </div>

        {/* Timeline Section (Optional - for future implementation) */}
        {/* <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">الجدول الزمني</h2>
          <div className="bg-[#11161C] border border-[#1F2933] rounded-lg p-6">
            Timeline events here
          </div>
        </div> */}

        {/* Related News (Optional - for future implementation) */}
        {/* <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">أخبار ذات صلة</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            Related news cards here
          </div>
        </div> */}
      </main>
    </div>
  );
}
