import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQuote, getHistoricalData, getCompanyProfile, getKeyMetrics, getStockPeers, getPriceTargetConsensus, getIncomeStatements, getBalanceSheets, getCashFlowStatements, hasFMPKey } from '@/lib/financial-apis';
import { performTechnicalAnalysis, type OHLCV } from '@/lib/technical-analysis';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';
import { generateSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

// Top 5 US stocks to analyze in the pipeline (reduced from 20 for resource efficiency)
const PIPELINE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', nameAr: 'آبل' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', nameAr: 'مايكروسوفت' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', nameAr: 'ألفابت' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', nameAr: 'أمازون' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', nameAr: 'إنفيديا' },
];

// POST /api/cron/stock-pipeline — Fetch stock data and save to DB
// Protected by CRON_SECRET
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Auth check
    if (!verifyInternalOrCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'update-popular';
    const symbol = searchParams.get('symbol');

    if (action === 'update-popular') {
      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const stock of PIPELINE_STOCKS) {
        try {
          await processStock(stock.symbol, stock.name, stock.nameAr);
          updated++;
          console.log(`[StockPipeline] Updated ${stock.symbol}`);
          // Rate limit: wait 1 second between API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err: any) {
          failed++;
          errors.push(`${stock.symbol}: ${err.message?.slice(0, 80)}`);
          console.warn(`[StockPipeline] Failed ${stock.symbol}:`, err.message?.slice(0, 80));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[StockPipeline] Completed: ${updated} updated, ${failed} failed in ${duration}ms`);

      return NextResponse.json({
        success: true,
        updated,
        failed,
        total: PIPELINE_STOCKS.length,
        duration,
        errors: errors.slice(0, 5),
      });
    }

    if (action === 'update-single' && symbol) {
      await processStock(symbol);
      return NextResponse.json({ success: true, symbol });
    }

    if (action === 'seed-list') {
      // Seed the stock analysis table with basic entries (no API calls)
      let seeded = 0;
      for (const stock of PIPELINE_STOCKS) {
        for (const locale of ['ar', 'en', 'fr', 'tr', 'es'] as const) {
          try {
            // Upsert company profile
            await db.companyProfile.upsert({
              where: { symbol: stock.symbol },
              create: {
                symbol: stock.symbol,
                name: stock.name,
                nameAr: stock.nameAr,
              },
              update: {
                name: stock.name,
                nameAr: stock.nameAr,
              },
            });

            // Upsert stock analysis
            const slug = generateSlug(`${stock.symbol}-${locale}-daily`);
            const existing = await db.stockAnalysis.findFirst({
              where: { symbol: stock.symbol, locale },
            });

            if (existing) {
              await db.stockAnalysis.update({
                where: { id: existing.id },
                data: {
                  slug,
                  title: locale === 'ar' ? `تحليل ${stock.nameAr}` : locale === 'fr' ? `Analyse de ${stock.name}` : locale === 'tr' ? `${stock.name} Analizi` : `Analysis of ${stock.name}`,
                  isPublished: true,
                  publishedAt: new Date(),
                },
              });
            } else {
              await db.stockAnalysis.create({
                data: {
                  symbol: stock.symbol,
                  slug,
                  locale,
                  title: locale === 'ar' ? `تحليل ${stock.nameAr}` : locale === 'fr' ? `Analyse de ${stock.name}` : locale === 'tr' ? `${stock.name} Analizi` : `Analysis of ${stock.name}`,
                  isPublished: true,
                  publishedAt: new Date(),
                },
              });
            }

            seeded++;
          } catch (err: any) {
            console.warn(`[StockPipeline] Seed failed ${stock.symbol}/${locale}: ${err.message?.slice(0, 60)}`);
          }
        }
      }
      return NextResponse.json({ success: true, seeded });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[StockPipeline] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also allow GET for easy cron-job.org pings
export async function GET(request: Request) {
  return POST(request);
}

// ─── Process a single stock: fetch data, analyze, save ───
async function processStock(symbol: string, name?: string, nameAr?: string) {
  // Fetch all data in parallel
  const [quote, historicalData, profile, keyMetrics, peers, priceTarget, incomeStatements, balanceSheets, cashFlowStatements] = await Promise.all([
    getQuote(symbol).catch(() => null),
    getHistoricalData(symbol, 180).catch(() => []),
    getCompanyProfile(symbol).catch(() => null),
    getKeyMetrics(symbol).catch(() => null),
    getStockPeers(symbol).catch(() => []),
    getPriceTargetConsensus(symbol).catch(() => null),
    getIncomeStatements(symbol, 'annual').catch(() => []),
    getBalanceSheets(symbol, 'annual').catch(() => []),
    getCashFlowStatements(symbol, 'annual').catch(() => []),
  ]);

  const price = quote?.price || 0;
  const change = quote?.change || 0;
  const changePercent = quote?.changePercent || 0;
  const high = quote?.high || 0;
  const low = quote?.low || 0;
  const open = quote?.open || 0;
  const volume = quote?.volume || 0;
  const previousClose = quote?.previousClose || 0;

  // Run technical analysis
  const ohlcvData: OHLCV[] = historicalData.map(p => ({
    date: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  }));

  const technicalAnalysis = performTechnicalAnalysis(ohlcvData, symbol, price, changePercent);

  // Generate SWOT
  const swot = generateSWOT(profile, keyMetrics, incomeStatements, balanceSheets, cashFlowStatements);

  // Calculate fair value
  const fairValue = calculateFairValue(price, keyMetrics, priceTarget, incomeStatements);

  // Calculate sentiment
  const sentimentScore = calculateSentimentScore(technicalAnalysis, keyMetrics);

  // Determine market type
  const marketType = symbol.includes('.PA') ? 'cac40' :
                     symbol.includes('.SR') ? 'tadawul' :
                     symbol.includes('.DE') ? 'dax' :
                     symbol.includes('.L') ? 'ftse' :
                     symbol.includes('.T') ? 'nikkei' : 'sp500';

  // Upsert CompanyProfile first
  const companyName = profile?.companyName || name || symbol;
  const companyNameAr = nameAr || profile?.companyName || symbol;

  await db.companyProfile.upsert({
    where: { symbol },
    create: {
      symbol,
      name: companyName,
      nameAr: companyNameAr,
      exchange: profile?.exchange || null,
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      description: profile?.description || null,
      marketCap: profile?.marketCap || 0,
      peRatio: keyMetrics?.peRatio || 0,
      eps: keyMetrics?.eps || 0,
      dividendYield: keyMetrics?.dividendYield || 0,
      beta: profile?.beta || 0,
      country: profile?.country || null,
      logoUrl: profile?.logoUrl || null,
      lastUpdated: new Date(),
    },
    update: {
      name: companyName,
      nameAr: companyNameAr,
      exchange: profile?.exchange || null,
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      marketCap: profile?.marketCap || 0,
      peRatio: keyMetrics?.peRatio || 0,
      eps: keyMetrics?.eps || 0,
      dividendYield: keyMetrics?.dividendYield || 0,
      beta: profile?.beta || 0,
      lastUpdated: new Date(),
    },
  });

  // Save to database for all locales
  for (const locale of ['ar', 'en', 'fr', 'tr', 'es'] as const) {
    const slug = generateSlug(`${symbol}-${locale}-daily-${new Date().toISOString().split('T')[0]}`);
    const title = locale === 'ar'
      ? `تحليل سهم ${companyNameAr} - ${symbol}`
      : locale === 'fr'
      ? `Analyse de l'action ${companyName} - ${symbol}`
      : locale === 'es'
      ? `Análisis de acciones ${companyName} - ${symbol}`
      : locale === 'tr'
      ? `${companyName} (${symbol}) Günlük Analiz — $${price.toFixed(2)}`
      : `${companyName} (${symbol}) Stock Analysis`;

    const existing = await db.stockAnalysis.findFirst({
      where: { symbol, locale },
    });

    const analysisData = {
      slug,
      locale,
      title,
      summary: locale === 'ar'
        ? `تحليل يومي لسهم ${companyNameAr} بسعر $${price.toFixed(2)}`
        : locale === 'fr'
        ? `Analyse quotidienne de l'action ${companyName} à $${price.toFixed(2)}`
        : locale === 'tr'
        ? `${companyName} günlük hisse analizi - $${price.toFixed(2)}`
        : `Daily analysis of ${companyName} at $${price.toFixed(2)}`,
      analysisType: 'daily',
      price,
      change,
      changePercent,
      high,
      low,
      open,
      volume,
      previousClose,
      priceTarget: fairValue.fairValue > 0 ? fairValue.fairValue : null,
      stopLoss: fairValue.fairValue > 0 ? price * 0.95 : null,
      riskLevel: technicalAnalysis.overallSignal === 'bullish' ? 'low' :
                 technicalAnalysis.overallSignal === 'bearish' ? 'high' : 'medium',
      sentiment: technicalAnalysis.overallSignal === 'bullish' ? 'bullish' :
                 technicalAnalysis.overallSignal === 'bearish' ? 'bearish' : 'neutral',
      overallSignal: technicalAnalysis.overallSignal,
      overallScore: technicalAnalysis.overallScore,
      confidenceScore: Math.min(100, Math.max(0, Math.abs(technicalAnalysis.overallScore) + 50)),
      technicalScore: technicalAnalysis.overallScore > 0 ? Math.min(100, technicalAnalysis.overallScore) : 0,
      fundamentalScore: technicalAnalysis.overallScore < 0 ? Math.min(100, Math.abs(technicalAnalysis.overallScore)) : 0,
      sector: profile?.sector || null,
      marketCap: profile?.marketCap || 0,
      peRatio: keyMetrics?.peRatio || 0,
      eps: keyMetrics?.eps || 0,
      marketType,
      assetClass: 'stocks',
      keyMetrics: JSON.stringify(keyMetrics || {}),
      indicators: JSON.stringify({
        keyMetrics,
        incomeStatements: incomeStatements.slice(0, 4),
        balanceSheets: balanceSheets.slice(0, 4),
        cashFlowStatements: cashFlowStatements.slice(0, 4),
      }),
      technicalData: JSON.stringify(technicalAnalysis),
      tradeSetup: JSON.stringify(fairValue),
      isPublished: true,
      publishedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
    };

    if (existing) {
      await db.stockAnalysis.update({
        where: { id: existing.id },
        data: analysisData,
      });
    } else {
      await db.stockAnalysis.create({
        data: {
          symbol,
          ...analysisData,
        },
      });
    }
  }
}

// ─── SWOT Generation ───
function generateSWOT(profile: any, metrics: any, income: any[], balance: any[], cashFlow: any[]) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (metrics) {
    if (metrics.grossProfitMargin > 0.4) strengths.push('هامش ربح إجمالي مرتفع');
    if (metrics.netProfitMargin > 0.15) strengths.push('هامش ربح صافي قوي');
    if (metrics.returnOnEquity > 0.15) strengths.push('عائد مرتفع على حقوق المساهمين');
    if (metrics.currentRatio > 2) strengths.push('سيولة قوية');
    if (metrics.grossProfitMargin < 0.2) weaknesses.push('هامش ربح إجمالي منخفض');
    if (metrics.debtToEquity > 2) weaknesses.push('مستوى ديون مرتفع');
    if (metrics.netProfitMargin < 0.05) weaknesses.push('هامش ربح صافي ضعيف');
    if (metrics.revenueGrowth > 0.1) opportunities.push('نمو إيرادات قوي');
    if (metrics.earningsGrowth > 0.15) opportunities.push('نمو أرباح مرتفع');
    if (metrics.revenueGrowth < -0.05) threats.push('تراجع في الإيرادات');
    if (metrics.earningsGrowth < -0.1) threats.push('انخفاض ملحوظ في الأرباح');
  }

  if (income && income.length > 0 && cashFlow && cashFlow.length > 0 && cashFlow[0].freeCashFlow > 0) {
    strengths.push('تدفق نقدي حر إيجابي');
  }

  if (profile?.sector) {
    opportunities.push('فرص النمو في قطاع ' + profile.sector);
    threats.push('مخاطر تنظيمية في قطاع ' + profile.sector);
  }

  if (strengths.length === 0) strengths.push('بيانات غير كافية للتحليل');
  if (weaknesses.length === 0) weaknesses.push('لا نقاط ضعف واضحة');
  if (opportunities.length === 0) opportunities.push('فرص سوقية محتملة');
  if (threats.length === 0) threats.push('مخاطر سوقية عامة');

  return { strengths, weaknesses, opportunities, threats };
}

// ─── Fair Value Calculation ───
function calculateFairValue(currentPrice: number, metrics: any, priceTarget: any, income: any[]) {
  let dcfEstimate = 0;
  let analystTarget = 0;

  if (metrics && metrics.eps > 0) {
    const growthRate = Math.max(0.03, Math.min(0.25, metrics.earningsGrowth || 0.08));
    const discountRate = 0.10;
    const terminalGrowth = 0.03;
    const terminalValue = (metrics.eps * (1 + growthRate)) / (discountRate - terminalGrowth);
    dcfEstimate = Math.max(0, terminalValue);
  }

  if (priceTarget && priceTarget.targetConsensus > 0) {
    analystTarget = priceTarget.targetConsensus;
  }

  const weights = { dcf: 0.4, analyst: 0.6 };
  let fairValue = 0;
  let totalWeight = 0;

  if (dcfEstimate > 0) { fairValue += dcfEstimate * weights.dcf; totalWeight += weights.dcf; }
  if (analystTarget > 0) { fairValue += analystTarget * weights.analyst; totalWeight += weights.analyst; }

  if (totalWeight > 0) fairValue = fairValue / totalWeight;
  else fairValue = currentPrice;

  const upsidePercent = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0;

  return {
    dcfEstimate: Math.round(dcfEstimate * 100) / 100,
    analystTarget: Math.round(analystTarget * 100) / 100,
    fairValue: Math.round(fairValue * 100) / 100,
    upsidePercent: Math.round(upsidePercent * 100) / 100,
    currentPrice,
  };
}

// ─── Sentiment Score ───
function calculateSentimentScore(technical: any, metrics: any): number {
  let score = 50;
  if (technical.overallSignal === 'bullish') score += 20;
  else if (technical.overallSignal === 'bearish') score -= 20;
  score += Math.min(15, technical.overallScore / 5);
  if (metrics) {
    if (metrics.revenueGrowth > 0.1) score += 5;
    if (metrics.revenueGrowth < -0.05) score -= 5;
    if (metrics.netProfitMargin > 0.15) score += 5;
    if (metrics.netProfitMargin < 0.05) score -= 5;
    if (metrics.returnOnEquity > 0.15) score += 3;
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}
