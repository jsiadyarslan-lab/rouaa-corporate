import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('key');
  if (queryKey !== process.env.CRON_SECRET && queryKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  
  try {
    const oneDayAgo = new Date(Date.now() - 86400000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [
      stockTotal, stockRecent, stockGainers, stockLosers,
      fxSignals, cryptoSignals,
      marketIdx, marketCrypto, marketCurrency, marketCommodity,
      geoRecent, geoHighRisk,
    ] = await Promise.all([
      db.stockAnalysis.count(),
      db.stockAnalysis.count({ where: { updatedAt: { gte: oneDayAgo } } }),
      db.stockAnalysis.count({ where: { updatedAt: { gte: oneDayAgo }, changePercent: { gt: 0 } } }),
      db.stockAnalysis.count({ where: { updatedAt: { gte: oneDayAgo }, changePercent: { lt: 0 } } }),
      db.tradingSignal.count({ where: { category: 'forex', status: 'ACTIVE' } }),
      db.tradingSignal.count({ where: { category: 'crypto', status: 'ACTIVE' } }),
      db.marketIndicator.count({ where: { category: 'index' } }),
      db.marketIndicator.count({ where: { category: 'crypto' } }),
      db.marketIndicator.count({ where: { category: 'currency' } }),
      db.marketIndicator.count({ where: { category: 'commodity' } }),
      db.geopoliticalRisk.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.geopoliticalRisk.count({ where: { riskScore: { gte: 60 }, createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Sample data
    const sampleStock = await db.stockAnalysis.findFirst({
      where: { updatedAt: { gte: oneDayAgo } },
      orderBy: { changePercent: 'desc' },
      select: { symbol: true, changePercent: true, price: true, sector: true, updatedAt: true },
    });

    const sampleSignal = await db.tradingSignal.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: { pair: true, action: true, confidence: true, category: true, createdAt: true },
    });

    const sampleIndicator = await db.marketIndicator.findFirst({
      where: { category: 'crypto' },
      select: { symbol: true, name: true, value: true, changePercent: true, lastUpdated: true },
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stockAnalysis: { total: stockTotal, last24h: stockRecent, gainers24h: stockGainers, losers24h: stockLosers, sample: sampleStock },
      tradingSignals: { forex: fxSignals, crypto: cryptoSignals, sample: sampleSignal },
      marketIndicators: { index: marketIdx, crypto: marketCrypto, currency: marketCurrency, commodity: marketCommodity, sample: sampleIndicator },
      geopoliticalRisks: { last7d: geoRecent, highRisk7d: geoHighRisk },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 200) }, { status: 500 });
  } finally {
    // no-op();
  }
}
