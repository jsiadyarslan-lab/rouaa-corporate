// ─── Backfill Missing Sector Data ────────────────────────────
// One-time utility to update CompanyProfile records that have
// empty/missing sector values. Uses the COMPANY_NAMES lookup
// from the pipeline as the source of truth.
// Auth: x-internal header (same as cron endpoints).

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Sector lookup from the pipeline's COMPANY_NAMES (source of truth)
const SECTOR_LOOKUP: Record<string, { en: string; ar: string; fr: string; exchange: string; sector: string; country: string }> = {
  'AAPL': { en: 'Apple Inc.', ar: 'أبل', fr: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MSFT': { en: 'Microsoft Corporation', ar: 'مايكروسوفت', fr: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'GOOGL': { en: 'Alphabet Inc.', ar: 'ألفابت (غوغل)', fr: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'AMZN': { en: 'Amazon.com Inc.', ar: 'أمازون', fr: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'NVDA': { en: 'NVIDIA Corporation', ar: 'إنفيديا', fr: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'META': { en: 'Meta Platforms Inc.', ar: 'ميتا', fr: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'TSLA': { en: 'Tesla Inc.', ar: 'تيسلا', fr: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'JPM': { en: 'JPMorgan Chase & Co.', ar: 'جي بي مورغان', fr: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financials', country: 'US' },
  'V': { en: 'Visa Inc.', ar: 'فيزا', fr: 'Visa Inc.', exchange: 'NYSE', sector: 'Financials', country: 'US' },
  'UNH': { en: 'UnitedHealth Group', ar: 'يونايتد هيلث', fr: 'UnitedHealth Group', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'JNJ': { en: 'Johnson & Johnson', ar: 'جونسون آند جونسون', fr: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'WMT': { en: 'Walmart Inc.', ar: 'وول مارت', fr: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive', country: 'US' },
  'XOM': { en: 'Exxon Mobil Corporation', ar: 'إكسون موبيل', fr: 'ExxonMobil', exchange: 'NYSE', sector: 'Energy', country: 'US' },
  'PG': { en: 'Procter & Gamble Co.', ar: 'بروكتر آند غامبل', fr: 'Procter & Gamble', exchange: 'NYSE', sector: 'Consumer Defensive', country: 'US' },
  'MA': { en: 'Mastercard Inc.', ar: 'ماستركارد', fr: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financials', country: 'US' },
  'HD': { en: 'The Home Depot Inc.', ar: 'هوم ديبو', fr: 'The Home Depot', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'CVX': { en: 'Chevron Corporation', ar: 'شيفرون', fr: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy', country: 'US' },
  'MRK': { en: 'Merck & Co.', ar: 'ميرك', fr: 'Merck & Co.', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'ABBV': { en: 'AbbVie Inc.', ar: 'أبفي', fr: 'AbbVie Inc.', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'AVGO': { en: 'Broadcom Inc.', ar: 'برودكوم', fr: 'Broadcom Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'KO': { en: 'The Coca-Cola Company', ar: 'كوكاكولا', fr: 'The Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive', country: 'US' },
  'PEP': { en: 'PepsiCo Inc.', ar: 'بيبسيكو', fr: 'PepsiCo Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive', country: 'US' },
  'COST': { en: 'Costco Wholesale', ar: 'كوستكو', fr: 'Costco Wholesale', exchange: 'NASDAQ', sector: 'Consumer Defensive', country: 'US' },
  'ADBE': { en: 'Adobe Inc.', ar: 'أدوبي', fr: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'CRM': { en: 'Salesforce Inc.', ar: 'سيلزفورس', fr: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'AMD': { en: 'Advanced Micro Devices', ar: 'إيه إم دي', fr: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'NFLX': { en: 'Netflix Inc.', ar: 'نتفليكس', fr: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Communication Services', country: 'US' },
  'INTC': { en: 'Intel Corporation', ar: 'إنتل', fr: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'CMCSA': { en: 'Comcast Corporation', ar: 'كومكاست', fr: 'Comcast Corporation', exchange: 'NASDAQ', sector: 'Communication Services', country: 'US' },
  'CSCO': { en: 'Cisco Systems Inc.', ar: 'سيسكو سيستمز', fr: 'Cisco Systems Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'AXP': { en: 'American Express Company', ar: 'أمريكان إكسبريس', fr: 'American Express Company', exchange: 'NYSE', sector: 'Financials', country: 'US' },
  'PYPL': { en: 'PayPal Holdings Inc.', ar: 'باي بال', fr: 'PayPal Holdings Inc.', exchange: 'NASDAQ', sector: 'Financials', country: 'US' },
  'DELL': { en: 'Dell Technologies Inc.', ar: 'ديل تكنولوجيز', fr: 'Dell Technologies Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'IBM': { en: 'International Business Machines', ar: 'آي بي إم', fr: 'International Business Machines', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'QCOM': { en: 'Qualcomm Inc.', ar: 'كوالكوم', fr: 'Qualcomm Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'TXN': { en: 'Texas Instruments Inc.', ar: 'تكساس إنسترومنتس', fr: 'Texas Instruments Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MDLZ': { en: 'Mondelez International Inc.', ar: 'مونديليز الدولية', fr: 'Mondelez International Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive', country: 'US' },
  'ISRG': { en: 'Intuitive Surgical Inc.', ar: 'إنتويتيف سيرجيكال', fr: 'Intuitive Surgical Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'GILD': { en: 'Gilead Sciences Inc.', ar: 'جيلياد ساينسز', fr: 'Gilead Sciences Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'REGN': { en: 'Regeneron Pharmaceuticals', ar: 'ريجينيرون', fr: 'Regeneron Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'VRTX': { en: 'Vertex Pharmaceuticals', ar: 'فيرتكس فارماسيوتيكالز', fr: 'Vertex Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'BIIB': { en: 'Biogen Inc.', ar: 'بايوجين', fr: 'Biogen Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'SBUX': { en: 'Starbucks Corporation', ar: 'ستاربكس', fr: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'BKNG': { en: 'Booking Holdings Inc.', ar: 'بوكنغ هولدينغز', fr: 'Booking Holdings Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'AMGN': { en: 'Amgen Inc.', ar: 'أمجن', fr: 'Amgen Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'CAT': { en: 'Caterpillar Inc.', ar: 'كاتربيلر', fr: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'DE': { en: 'Deere & Company', ar: 'دير آند كومباني', fr: 'Deere & Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'CVS': { en: 'CVS Health Corporation', ar: 'سي في إس هيلث', fr: 'CVS Health Corporation', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'MCD': { en: "McDonald's Corporation", ar: 'ماكدونالدز', fr: "McDonald's Corporation", exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'ABT': { en: 'Abbott Laboratories', ar: 'أبوت لابوراتوريز', fr: 'Abbott Laboratories', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'LLY': { en: 'Eli Lilly and Company', ar: 'إيلي ليلي', fr: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'NVO': { en: 'Novo Nordisk A/S', ar: 'نوفو نورديسك', fr: 'Novo Nordisk A/S', exchange: 'NYSE', sector: 'Healthcare', country: 'DK' },
  'ORCL': { en: 'Oracle Corporation', ar: 'أوراكل', fr: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'LRCX': { en: 'Lam Research Corporation', ar: 'لام ريسيرتش', fr: 'Lam Research Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'AMAT': { en: 'Applied Materials Inc.', ar: 'أبلايد ماتيريالز', fr: 'Applied Materials Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MU': { en: 'Micron Technology Inc.', ar: 'مايكرون تكنولوجي', fr: 'Micron Technology Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'BA': { en: 'The Boeing Company', ar: 'بوينغ', fr: 'The Boeing Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'LMT': { en: 'Lockheed Martin Corporation', ar: 'لوكهيد مارتن', fr: 'Lockheed Martin Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'RTX': { en: 'RTX Corporation', ar: 'آر تي إكس', fr: 'RTX Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'NOC': { en: 'Northrop Grumman Corporation', ar: 'نورثروب غرومان', fr: 'Northrop Grumman Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'GD': { en: 'General Dynamics Corporation', ar: 'جنرال دايناميكس', fr: 'General Dynamics Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'GE': { en: 'GE Aerospace', ar: 'جنرال إلكتريك', fr: 'GE Aerospace', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'MMM': { en: '3M Company', ar: 'ثري إم', fr: '3M Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'HON': { en: 'Honeywell International Inc.', ar: 'هانيويل', fr: 'Honeywell International Inc.', exchange: 'NASDAQ', sector: 'Industrials', country: 'US' },
  'BRK-B': { en: 'Berkshire Hathaway Inc.', ar: 'بيركشاير هاثاواي', fr: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financials', country: 'US' },
};

function verifyAuth(request: Request): boolean {
  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!internalSecret) return true;
  const headerSecret = request.headers.get('x-internal');
  if (headerSecret === internalSecret) return true;
  const urlSecret = new URL(request.url).searchParams.get('secret');
  if (urlSecret === internalSecret) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all company profiles with empty/null/missing sector
    const companiesWithoutSector = await db.companyProfile.findMany({
      where: {
        OR: [
          { sector: { equals: '' } },
          { sector: { equals: null } },
          { sector: { not: { in: ['Technology', 'Healthcare', 'Financials', 'Consumer Cyclical', 'Consumer Defensive', 'Energy', 'Industrials', 'Communication Services', 'Basic Materials', 'Utilities', 'ETF', 'Real Estate'] } } },
        ],
      },
      select: { id: true, symbol: true, sector: true, name: true, nameAr: true },
    });

    console.log(`[BackfillSectors] Found ${companiesWithoutSector.length} companies without proper sector`);

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const company of companiesWithoutSector) {
      const lookup = SECTOR_LOOKUP[company.symbol];
      if (!lookup) {
        skipped++;
        continue;
      }

      try {
        await db.companyProfile.update({
          where: { id: company.id },
          data: {
            sector: lookup.sector,
            name: lookup.en,
            nameAr: lookup.ar,
            country: lookup.country,
            exchange: lookup.exchange,
          },
        });

        // Also update the sector on all related stock analyses
        await db.stockAnalysis.updateMany({
          where: { symbol: company.symbol, sector: { in: ['', null] } },
          data: { sector: lookup.sector },
        });

        updated++;
      } catch (err: any) {
        errors.push(`${company.symbol}: ${err.message?.slice(0, 80)}`);
      }
    }

    // Also update all StockAnalysis records where sector is empty but company has sector
    const orphanedAnalyses = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "StockAnalysis" sa
      JOIN "CompanyProfile" cp ON sa."symbolId" = cp."symbol"
      WHERE (sa.sector IS NULL OR sa.sector = '')
      AND cp.sector IS NOT NULL AND cp.sector != ''
    `;

    const orphanedCount = Number(orphanedAnalyses[0]?.count ?? 0);

    if (orphanedCount > 0) {
      await db.$executeRaw`
        UPDATE "StockAnalysis" sa
        SET sector = cp.sector
        FROM "CompanyProfile" cp
        WHERE sa."symbolId" = cp."symbol"
        AND (sa.sector IS NULL OR sa.sector = '')
        AND cp.sector IS NOT NULL AND cp.sector != ''
      `;
    }

    return NextResponse.json({
      status: 'ok',
      totalCompaniesWithoutSector: companiesWithoutSector.length,
      updated,
      skipped,
      orphanedAnalysesFixed: orphanedCount,
      errors: errors.slice(0, 20),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[BackfillSectors] Error:', err.message);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
}
