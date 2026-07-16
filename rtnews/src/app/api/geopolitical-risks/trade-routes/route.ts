import { NextRequest, NextResponse } from 'next/server';
import {
  TRADE_ROUTES,
  getDisruptedRoutes,
  getTotalTradeAtRisk,
  getTotalOilTradeAtRisk,
  getAffectedMarketSymbols,
  getRouteStatusColor,
} from '@/lib/geopolitical/trade-routes-data';

// Trade route data is static but this route reads `request.url` for search params,
// which forces dynamic rendering. Mark as force-dynamic to avoid build errors.
export const dynamic = 'force-dynamic'; // Uses request.url/searchParams — must be dynamic

// GET /api/geopolitical-risks/trade-routes — Return trade route data
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'ar';

    // Localized name field mapping
    const localeFieldMap: Record<string, keyof (typeof TRADE_ROUTES)[number]> = {
      ar: 'nameAr',
      en: 'nameEn',
      fr: 'nameFr',
      tr: 'nameTr',
      es: 'nameEs',
    };
    const nameField = localeFieldMap[locale] || 'nameEn';

    // Map routes with localized names and status colors
    const routes = TRADE_ROUTES.map((route) => ({
      id: route.id,
      name: route[nameField],
      nameAr: route.nameAr,
      nameEn: route.nameEn,
      type: route.type,
      coordinates: route.coordinates,
      centerLat: route.centerLat,
      centerLng: route.centerLng,
      globalTradeShare: route.globalTradeShare,
      oilTradeShare: route.oilTradeShare,
      dailyVolume: route.dailyVolume,
      status: route.status,
      statusColor: getRouteStatusColor(route.status),
      disruptionRisk: route.disruptionRisk,
      alternativeRoutes: route.alternativeRoutes,
      affectedMarkets: route.affectedMarkets,
    }));

    // Compute disruption statistics
    const disruptedRoutes = getDisruptedRoutes();
    const totalTradeAtRisk = getTotalTradeAtRisk();
    const totalOilTradeAtRisk = getTotalOilTradeAtRisk();
    const affectedMarketSymbols = getAffectedMarketSymbols();

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    for (const route of TRADE_ROUTES) {
      statusDistribution[route.status] = (statusDistribution[route.status] || 0) + 1;
    }

    // Average disruption risk
    const avgDisruptionRisk = Math.round(
      TRADE_ROUTES.reduce((sum, r) => sum + r.disruptionRisk, 0) / TRADE_ROUTES.length
    );

    // Highest risk routes (top 3)
    const highestRiskRoutes = [...TRADE_ROUTES]
      .sort((a, b) => b.disruptionRisk - a.disruptionRisk)
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        name: r[nameField],
        disruptionRisk: r.disruptionRisk,
        status: r.status,
        statusColor: getRouteStatusColor(r.status),
      }));

    // Disruption details
    const disruptionStats = {
      totalRoutes: TRADE_ROUTES.length,
      disruptedCount: disruptedRoutes.length,
      normalCount: statusDistribution['normal'] || 0,
      threatenedCount: statusDistribution['threatened'] || 0,
      disruptedStatusCount: statusDistribution['disrupted'] || 0,
      blockedCount: statusDistribution['blocked'] || 0,
      totalGlobalTradeShareAtRisk: totalTradeAtRisk,
      totalOilTradeShareAtRisk: totalOilTradeAtRisk,
      averageDisruptionRisk: avgDisruptionRisk,
      affectedMarketSymbols,
      highestRiskRoutes,
    };

    return NextResponse.json({
      data: routes,
      disruptionStats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeopoliticalRisks] GET /trade-routes error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch trade route data', details: message },
      { status: 500 }
    );
  }
}
