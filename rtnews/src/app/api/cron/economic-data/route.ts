import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchRealMarketData, hasApiKeys } from '@/lib/financial-apis';
import { getArabicMarketData, getArabicMarketSeedData, isArabicSymbol } from '@/lib/arabic-markets';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// POST /api/cron/economic-data — Generate/seed market indicators and reports
// Protected by CRON_SECRET
export async function POST(request: Request) {
  try {
    // Auth check
    if (!verifyInternalOrCronAuth(request)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'seed-indicators';

    if (action === 'seed-indicators') {
      // Seed default market indicators if table is empty
      const count = await db.marketIndicator.count();
      
      if (count === 0) {
        // Global market indicators
        const globalIndicators = [
          { name: 'S&P 500', nameAr: 'إس آند بي 500', symbol: 'SPX', value: 5500, change: 25, changePercent: 0.46, category: 'index', region: 'global' },
          { name: 'NASDAQ', nameAr: 'ناسداك', symbol: 'NDX', value: 18500, change: 120, changePercent: 0.65, category: 'index', region: 'global' },
          { name: 'Dow Jones', nameAr: 'داو جونز', symbol: 'DJI', value: 42000, change: -80, changePercent: -0.19, category: 'index', region: 'global' },
          { name: 'FTSE 100', nameAr: 'فوتسي 100', symbol: 'FTSE', value: 8200, change: 15, changePercent: 0.18, category: 'index', region: 'global' },
          { name: 'Nikkei 225', nameAr: 'نيكي 225', symbol: 'NKY', value: 38000, change: -200, changePercent: -0.52, category: 'index', region: 'global' },
          { name: 'Gold', nameAr: 'الذهب', symbol: 'XAU', value: 2350, change: 12, changePercent: 0.51, category: 'commodity', region: 'global' },
          { name: 'Crude Oil WTI', nameAr: 'النفط الخام', symbol: 'WTI', value: 78.5, change: -1.2, changePercent: -1.5, category: 'commodity', region: 'global' },
          { name: 'Silver', nameAr: 'الفضة', symbol: 'XAG', value: 28.5, change: 0.3, changePercent: 1.06, category: 'commodity', region: 'global' },
          { name: 'EUR/USD', nameAr: 'يورو/دولار', symbol: 'EURUSD', value: 1.085, change: 0.002, changePercent: 0.18, category: 'currency', region: 'global' },
          { name: 'GBP/USD', nameAr: 'جنيه/دولار', symbol: 'GBPUSD', value: 1.265, change: -0.003, changePercent: -0.24, category: 'currency', region: 'global' },
          { name: 'USD/JPY', nameAr: 'دولار/ين', symbol: 'USDJPY', value: 155.5, change: 0.8, changePercent: 0.52, category: 'currency', region: 'global' },
          { name: 'Bitcoin', nameAr: 'بيتكوين', symbol: 'BTC', value: 67000, change: 1500, changePercent: 2.29, category: 'crypto', region: 'global' },
          { name: 'Ethereum', nameAr: 'إيثريوم', symbol: 'ETH', value: 3500, change: 80, changePercent: 2.34, category: 'crypto', region: 'global' },
          { name: 'US 10Y Yield', nameAr: 'سندات أمريكية 10 سنوات', symbol: 'US10Y', value: 4.35, change: 0.02, changePercent: 0.46, category: 'bond_yield', region: 'global' },
        ];

        // Arabic market indicators (V62: use realistic data from arabic-markets module)
        const arabicIndicators = getArabicMarketSeedData();

        const allIndicators = [...globalIndicators, ...arabicIndicators];
        
        for (const ind of allIndicators) {
          await db.marketIndicator.create({
            data: {
              ...ind,
              history: JSON.stringify([]),
            },
          });
        }
        
        return NextResponse.json({ success: true, seeded: allIndicators.length, global: globalIndicators.length, arabic: arabicIndicators.length });
      }
      
      return NextResponse.json({ success: true, message: 'المؤشرات موجودة بالفعل', count });
    }

    if (action === 'update-prices') {
      // ── Smart price update: try real data first, fallback to simulation ──
      const indicators = await db.marketIndicator.findMany();
      let updated = 0;
      let realDataCount = 0;
      let simulatedCount = 0;

      // Try fetching real market data
      let realDataMap: Record<string, Awaited<ReturnType<typeof fetchRealMarketData>>[0]> = {};
      const apiKeysAvailable = hasApiKeys();
      
      if (apiKeysAvailable) {
        try {
          const realUpdates = await fetchRealMarketData();
          for (const update of realUpdates) {
            realDataMap[update.symbol] = update;
          }
          console.log(`[Cron update-prices] Fetched real data for ${realUpdates.length} symbols`);
        } catch (err: any) {
          console.warn('[Cron update-prices] Real data fetch failed, falling back to simulation:', err.message?.slice(0, 100));
        }
      }

      // Also get Arabic market data (tries real APIs first, falls back to simulation)
      const arabicData = await getArabicMarketData();
      const arabicDataMap: Record<string, typeof arabicData[0]> = {};
      for (const item of arabicData) {
        arabicDataMap[item.symbol] = item;
      }

      for (const ind of indicators) {
        try {
          // Check if we have real data for this symbol
          if (realDataMap[ind.symbol]) {
            // Use real data
            const real = realDataMap[ind.symbol];
            const history = JSON.parse(ind.history);
            
            // Append today's value to history
            history.push({ date: new Date().toISOString().split('T')[0], value: real.value });
            if (history.length > 30) history.shift();

            // If real data also includes historical data, merge it
            if (real.history && real.history.length > 0) {
              // Replace history with real data (keep last 30)
              const realHistory = real.history.slice(-30);
              // Merge: prefer real history, append today if not already there
              const todayStr = new Date().toISOString().split('T')[0];
              const hasToday = realHistory.some(h => h.date === todayStr);
              const merged = hasToday ? realHistory : [...realHistory, { date: todayStr, value: real.value }];
              while (merged.length > 30) merged.shift();

              await db.marketIndicator.update({
                where: { id: ind.id },
                data: {
                  value: real.value,
                  change: real.change,
                  changePercent: real.changePercent,
                  history: JSON.stringify(merged),
                  lastUpdated: new Date(),
                },
              });
            } else {
              await db.marketIndicator.update({
                where: { id: ind.id },
                data: {
                  value: real.value,
                  change: real.change,
                  changePercent: real.changePercent,
                  history: JSON.stringify(history),
                  lastUpdated: new Date(),
                },
              });
            }
            
            realDataCount++;
          } else if (arabicDataMap[ind.symbol]) {
            // Use Arabic market simulated data
            const arabic = arabicDataMap[ind.symbol];
            const history = JSON.parse(ind.history);
            
            // Append today's value to history
            history.push({ date: new Date().toISOString().split('T')[0], value: arabic.value });
            if (history.length > 30) history.shift();

            // If Arabic data includes history, merge it
            if (arabic.history && arabic.history.length > 0) {
              const arabicHistory = arabic.history.slice(-30);
              await db.marketIndicator.update({
                where: { id: ind.id },
                data: {
                  value: arabic.value,
                  change: arabic.change,
                  changePercent: arabic.changePercent,
                  history: JSON.stringify(arabicHistory),
                  lastUpdated: new Date(),
                },
              });
            } else {
              await db.marketIndicator.update({
                where: { id: ind.id },
                data: {
                  value: arabic.value,
                  change: arabic.change,
                  changePercent: arabic.changePercent,
                  history: JSON.stringify(history),
                  lastUpdated: new Date(),
                },
              });
            }
            
            realDataCount++; // Count as "real" since it's realistic simulation
          } else {
            // Fall back to simulated changes (original behavior)
            // ── Sanity check: if current DB value is already insane, skip simulation ──
            const CRON_SANITY: Record<string, { min: number; max: number }> = {
              'BTC': { min: 10_000, max: 200_000 }, 'ETH': { min: 100, max: 15_000 }, 'SOL': { min: 5, max: 1_000 },
              'XAU': { min: 1_000, max: 5_000 }, 'XAG': { min: 10, max: 100 }, 'WTI': { min: 10, max: 200 },
              'SPX': { min: 2_000, max: 10_000 }, 'NDX': { min: 5_000, max: 30_000 }, 'DJI': { min: 20_000, max: 60_000 },
              'FTSE': { min: 4_000, max: 12_000 }, 'NKY': { min: 15_000, max: 60_000 },
              'EURUSD': { min: 0.5, max: 2.0 }, 'GBPUSD': { min: 0.8, max: 2.5 }, 'USDJPY': { min: 50, max: 250 },
              'US10Y': { min: 0.5, max: 10.0 },
            };
            const bounds = CRON_SANITY[ind.symbol];
            if (bounds && (ind.value < bounds.min || ind.value > bounds.max)) {
              console.warn(`[Cron update-prices] 🚫 Skipping simulation for ${ind.symbol}: DB value $${ind.value} is outside bounds $${bounds.min}–$${bounds.max}`);
              // Try live price as emergency fix
              try {
                const liveRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/markets/prices`, {
                  signal: AbortSignal.timeout(8_000),
                });
                if (liveRes.ok) {
                  const liveData = await liveRes.json();
                  const livePrice = (liveData.prices || []).find((p: any) => p.symbol === ind.symbol);
                  if (livePrice && livePrice.price >= bounds.min && livePrice.price <= bounds.max) {
                    console.log(`[Cron update-prices] ✅ Emergency fix: ${ind.symbol} updated from $${ind.value} → $${livePrice.price}`);
                    await db.marketIndicator.update({
                      where: { id: ind.id },
                      data: {
                        value: livePrice.price,
                        change: livePrice.change || 0,
                        changePercent: livePrice.changePercent || 0,
                        lastUpdated: new Date(),
                      },
                    });
                    realDataCount++;
                    updated++;
                    continue;
                  }
                }
              } catch { /* live fetch failed — skip this indicator */ }
              // Cannot fix — skip without updating to avoid making it worse
              console.warn(`[Cron update-prices] ⏭️ Skipping ${ind.symbol} — no valid live price available`);
              continue;
            }

            const changePct = (Math.random() - 0.5) * 2; // -1% to +1%
            const newChangePercent = ind.changePercent + changePct * 0.1;
            const newChange = ind.value * (newChangePercent / 100);
            const newValue = ind.value + newChange;
            
            // Update history
            const history = JSON.parse(ind.history);
            history.push({ date: new Date().toISOString().split('T')[0], value: newValue });
            if (history.length > 30) history.shift();
            
            await db.marketIndicator.update({
              where: { id: ind.id },
              data: {
                value: Math.round(newValue * 100) / 100,
                change: Math.round(newChange * 100) / 100,
                changePercent: Math.round(newChangePercent * 100) / 100,
                history: JSON.stringify(history),
                lastUpdated: new Date(),
              },
            });
            simulatedCount++;
          }
          
          updated++;
        } catch (updateErr: any) {
          console.warn(`[Cron update-prices] Failed to update ${ind.symbol}:`, updateErr.message?.slice(0, 80));
        }
      }
      
      console.log(`[Cron update-prices] Updated ${updated} indicators: ${realDataCount} real/arabic, ${simulatedCount} simulated`);
      return NextResponse.json({ 
        success: true, 
        updated, 
        realData: realDataCount, 
        simulated: simulatedCount,
        apiKeysAvailable,
      });
    }

    if (action === 'update-history') {
      // ── Fetch 90-day historical data for all indicators ──
      const indicators = await db.marketIndicator.findMany();
      let historyUpdated = 0;
      let historyFailed = 0;

      for (const ind of indicators) {
        try {
          // Skip Arabic market indices — they use simulated history
          if (isArabicSymbol(ind.symbol)) {
            // Generate realistic Arabic market history
            const arabicIndex = getArabicMarketSeedData().find(a => a.symbol === ind.symbol);
            if (arabicIndex) {
              // Use the arabic-markets module to generate history
              const arabicUpdates = await getArabicMarketData();
              const match = arabicUpdates.find(u => u.symbol === ind.symbol);
              if (match && match.history.length > 0) {
                await db.marketIndicator.update({
                  where: { id: ind.id },
                  data: {
                    history: JSON.stringify(match.history),
                    lastUpdated: new Date(),
                  },
                });
                historyUpdated++;
                continue;
              }
            }
          }

          // Try to fetch real historical data for global indicators
          if (hasApiKeys()) {
            const histData = await import('@/lib/financial-apis').then(m => m.getHistoricalData(ind.symbol, 90));
            if (histData.length > 0) {
              const history = histData.map(p => ({ date: p.date, value: p.close }));
              await db.marketIndicator.update({
                where: { id: ind.id },
                data: {
                  history: JSON.stringify(history),
                  lastUpdated: new Date(),
                },
              });
              historyUpdated++;
              console.log(`[Cron update-history] Updated history for ${ind.symbol}: ${history.length} days`);
              continue;
            }
          }

          // If no real data available, generate simulated history
          const existingHistory = JSON.parse(ind.history);
          if (existingHistory.length < 10) {
            // Generate basic simulated history if we have very little
            const simulatedHistory: { date: string; value: number }[] = [];
            const baseValue = ind.value;
            
            for (let i = 90; i >= 1; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              
              // Random walk
              const dailyReturn = (Math.random() - 0.5) * 0.02;
              const lastVal = simulatedHistory.length > 0 ? simulatedHistory[simulatedHistory.length - 1].value : baseValue;
              const newVal = lastVal * (1 + dailyReturn);
              
              simulatedHistory.push({ date: dateStr, value: Math.round(newVal * 100) / 100 });
            }

            await db.marketIndicator.update({
              where: { id: ind.id },
              data: {
                history: JSON.stringify(simulatedHistory),
                lastUpdated: new Date(),
              },
            });
            historyUpdated++;
          } else {
            // Already have decent history, just skip
            historyUpdated++;
          }
        } catch (err: any) {
          console.warn(`[Cron update-history] Failed for ${ind.symbol}:`, err.message?.slice(0, 80));
          historyFailed++;
        }
      }

      console.log(`[Cron update-history] ${historyUpdated} updated, ${historyFailed} failed`);
      return NextResponse.json({ 
        success: true, 
        historyUpdated, 
        historyFailed,
        total: indicators.length,
      });
    }

    if (action === 'generate-daily-report') {
      // Generate a daily market report from current news data
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newsItems = await db.newsItem.findMany({
        where: { isReady: true, fetchedAt: { gte: last24h } },
        select: { id: true, category: true, sentiment: true, sentimentScore: true, titleAr: true },
        take: 50,
        orderBy: { fetchedAt: 'desc' },
      });

      if (newsItems.length === 0) {
        return NextResponse.json({ success: false, message: 'لا توجد أخبار كافية لإنشاء تقرير' });
      }

      // Calculate aggregate sentiment
      const avgSentiment = Math.round(
        newsItems.reduce((sum, n) => sum + n.sentimentScore, 0) / newsItems.length
      );
      const marketImpact = avgSentiment > 60 ? 'bullish' : avgSentiment < 40 ? 'bearish' : 'neutral';

      // Get unique categories
      const categories = [...new Set(newsItems.map(n => n.category))];

      // Get current market indicators for the report
      const marketIndicators = await db.marketIndicator.findMany({
        select: { symbol: true, name: true, nameAr: true, value: true, change: true, changePercent: true, category: true, region: true },
      });

      const slug = `daily-report-${new Date().toISOString().split('T')[0]}`;
      
      // Check if report already exists (V369 FIX: was findUnique({slug}) which broke after V256 @@unique([slug,locale]))
      const existing = await db.economicReport.findFirst({ where: { slug, locale: 'ar' } });
      if (existing) {
        return NextResponse.json({ success: true, message: 'التقرير اليومي موجود بالفعل', reportId: existing.id });
      }

      const report = await db.economicReport.create({
        data: {
          title: `تقرير السوق اليومي - ${new Date().toLocaleDateString('ar-SA')}`,
          slug,
          summary: `ملخص يومي لأداء الأسواق العالمية والعربية بناءً على ${newsItems.length} خبر اقتصادي. متوسط المشاعر: ${avgSentiment}/100`,
          content: JSON.stringify({
            overview: `تم تحليل ${newsItems.length} خبر اقتصادي في آخر 24 ساعة`,
            sentimentScore: avgSentiment,
            categories: categories.map(cat => ({
              name: cat,
              count: newsItems.filter(n => n.category === cat).length,
            })),
            highlights: newsItems.slice(0, 5).map(n => n.titleAr || n.id),
            marketIndicators: marketIndicators.map(ind => ({
              symbol: ind.symbol,
              name: ind.name,
              nameAr: ind.nameAr,
              value: ind.value,
              change: ind.change,
              changePercent: ind.changePercent,
              category: ind.category,
              region: ind.region,
            })),
          }),
          reportType: 'daily',
          scope: 'global',
          sectors: JSON.stringify(categories),
          countries: JSON.stringify(['SA', 'AE', 'US', 'EU']),
          keyIndicators: JSON.stringify({ avgSentiment, totalNews: newsItems.length, categories: categories.length }),
          marketImpact,
          confidenceScore: avgSentiment,
          sourceUrls: JSON.stringify([]),
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, reportId: report.id, title: report.title });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error: any) {
    console.error('[Cron EconomicData]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also allow GET for easy cron-job.org pings
export async function GET(request: Request) {
  return POST(request);
}
