import { NextResponse } from 'next/server';
import {
  analyzeCountrySentiment,
  getAllCountrySentiments,
  generateSentimentTimeSeries,
  detectSentimentAnomalies,
  getTrackedSentimentCountries,
} from '@/lib/geopolitical/sentiment-analyzer';

export const revalidate = 300; // Computational route — cache for 5 min instead of force-dynamic

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const timeseries = searchParams.get('timeseries') === 'true';
  const anomalies = searchParams.get('anomalies') === 'true';
  const hours = parseInt(searchParams.get('hours') || '72');

  try {
    if (country) {
      const sentiment = analyzeCountrySentiment(country.toUpperCase());

      const result: Record<string, unknown> = { sentiment };

      if (timeseries) {
        result.timeseries = generateSentimentTimeSeries(country.toUpperCase(), hours);
      }

      if (anomalies) {
        const ts = generateSentimentTimeSeries(country.toUpperCase(), hours);
        result.anomalies = detectSentimentAnomalies(ts);
      }

      return NextResponse.json(result);
    }

    // Default: all countries summary
    const allSentiments = getAllCountrySentiments();
    const alerts = allSentiments.filter(s => s.alertLevel !== 'normal');

    return NextResponse.json({
      countries: allSentiments.map(s => ({
        countryCode: s.countryCode,
        riskSentiment: s.riskSentiment,
        alertLevel: s.alertLevel,
        trendDirection: s.trendDirection,
      })),
      alerts: alerts.map(a => ({
        countryCode: a.countryCode,
        alertLevel: a.alertLevel,
        riskSentiment: a.riskSentiment,
        velocity: a.velocity,
        topTopic: a.topTopics[0] || null,
      })),
      summary: {
        totalTracked: allSentiments.length,
        critical: alerts.filter(a => a.alertLevel === 'critical').length,
        high: alerts.filter(a => a.alertLevel === 'high').length,
        averageRiskSentiment: Math.round(
          allSentiments.reduce((s, a) => s + a.riskSentiment, 0) / allSentiments.length
        ),
      },
    });
  } catch (error) {
    console.error('[Sentiment API] Error:', error);
    return NextResponse.json({ error: 'Sentiment analysis failed' }, { status: 500 });
  }
}
