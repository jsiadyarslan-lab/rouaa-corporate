// ─── Stock Analysis Detail API Route ────────────────────────
// GET /api/stock-analysis/[symbol]?locale=en
// Returns detailed analysis for a specific symbol including
// quote, profile, technical data, and full AI content.
//
// V3: Added Yahoo Finance as PRIMARY free data source (no API key needed!)
// Falls back to FMP, Alpha Vantage, Finnhub as needed.

import { NextRequest, NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';
import { ensureStockTablesExist } from '@/lib/db-migrate-stock';
import { getHistoricalData, getQuote, getCompanyFundamentals, getYahooFinanceCompanyData, fetchSECEdgarCompanyFacts, fetchFREDIndicators } from '@/lib/financial-apis';
import { getStockQuote, getCompanyProfile, getKeyMetrics as getFmpKeyMetrics, getStockRating, getIncomeStatements, getBalanceSheets, getCashFlowStatements, getStockPeers, getPriceTargetConsensus } from '@/lib/fmp-api';

export const dynamic = 'force-dynamic';

// ─── Company Name Lookup ──────────────────────────────────────
// Used to populate company data when FMP is unavailable.
// Covers 100+ major global stocks across all markets.

const COMPANY_NAMES: Record<string, { en: string; ar: string; fr: string; exchange: string; sector: string; country: string }> = {
  'AAPL': { en: 'Apple Inc.', ar: 'أبل', fr: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MSFT': { en: 'Microsoft Corporation', ar: 'مايكروسوفت', fr: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'GOOGL': { en: 'Alphabet Inc.', ar: 'ألفابت (غوغل)', fr: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'AMZN': { en: 'Amazon.com Inc.', ar: 'أمازون', fr: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'NVDA': { en: 'NVIDIA Corporation', ar: 'إنفيديا', fr: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'META': { en: 'Meta Platforms Inc.', ar: 'ميتا', fr: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'TSLA': { en: 'Tesla Inc.', ar: 'تيسلا', fr: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'BRK-B': { en: 'Berkshire Hathaway Inc.', ar: 'بيركشاير هاثاواي', fr: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financials', country: 'US' },
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
  'LLY': { en: 'Eli Lilly and Company', ar: 'إيلي ليلي', fr: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'NVO': { en: 'Novo Nordisk A/S', ar: 'نوفو نورديسك', fr: 'Novo Nordisk A/S', exchange: 'NYSE', sector: 'Healthcare', country: 'DK' },
  'ORCL': { en: 'Oracle Corporation', ar: 'أوراكل', fr: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'CSCO': { en: 'Cisco Systems Inc.', ar: 'سيسكو سيستمز', fr: 'Cisco Systems Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'ABT': { en: 'Abbott Laboratories', ar: 'مختبرات أبوت', fr: 'Abbott Laboratories', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'PYPL': { en: 'PayPal Holdings Inc.', ar: 'باي بال', fr: 'PayPal Holdings Inc.', exchange: 'NASDAQ', sector: 'Financials', country: 'US' },
  'SHOP': { en: 'Shopify Inc.', ar: 'شوبيفاي', fr: 'Shopify Inc.', exchange: 'NYSE', sector: 'Technology', country: 'CA' },
  'SNOW': { en: 'Snowflake Inc.', ar: 'سنوفليك', fr: 'Snowflake Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'PLTR': { en: 'Palantir Technologies Inc.', ar: 'بالانتير', fr: 'Palantir Technologies Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'CRWD': { en: 'CrowdStrike Holdings Inc.', ar: 'كراود سترايك', fr: 'CrowdStrike Holdings Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'COIN': { en: 'Coinbase Global Inc.', ar: 'كوينبيس', fr: 'Coinbase Global Inc.', exchange: 'NASDAQ', sector: 'Financials', country: 'US' },
  'ABNB': { en: 'Airbnb Inc.', ar: 'إير بي إن بي', fr: 'Airbnb Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'BABA': { en: 'Alibaba Group Holding', ar: 'علي بابا', fr: 'Alibaba Group Holding', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'NIO': { en: 'NIO Inc.', ar: 'إن آي أو', fr: 'NIO Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'RIVN': { en: 'Rivian Automotive Inc.', ar: 'ريفيان', fr: 'Rivian Automotive Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'CAT': { en: 'Caterpillar Inc.', ar: 'كاتربيلر', fr: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'DE': { en: 'Deere & Company', ar: 'دير آند كومباني', fr: 'Deere & Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'BA': { en: 'The Boeing Company', ar: 'بوينغ', fr: 'The Boeing Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'LMT': { en: 'Lockheed Martin Corporation', ar: 'لوكهيد مارتن', fr: 'Lockheed Martin Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'SBUX': { en: 'Starbucks Corporation', ar: 'ستاربكس', fr: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'MCD': { en: "McDonald's Corporation", ar: 'ماكدونالدز', fr: "McDonald's Corporation", exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'BKNG': { en: 'Booking Holdings Inc.', ar: 'بوكنغ هولدينغز', fr: 'Booking Holdings Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'AMGN': { en: 'Amgen Inc.', ar: 'أمجن', fr: 'Amgen Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'ISRG': { en: 'Intuitive Surgical Inc.', ar: 'إنتويتيف سيرجيكال', fr: 'Intuitive Surgical Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'GILD': { en: 'Gilead Sciences Inc.', ar: 'جيلياد ساينسز', fr: 'Gilead Sciences Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'REGN': { en: 'Regeneron Pharmaceuticals', ar: 'ريجينيرون', fr: 'Regeneron Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'VRTX': { en: 'Vertex Pharmaceuticals', ar: 'فيرتكس فارماسيوتيكالز', fr: 'Vertex Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  // ETFs
  'SPY': { en: 'SPDR S&P 500 ETF Trust', ar: 'صندوق إس بي دي آر إس آند بي 500', fr: 'SPDR S&P 500 ETF Trust', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'QQQ': { en: 'Invesco QQQ Trust', ar: 'صندوق إنفيسكو كيو كيو كيو', fr: 'Invesco QQQ Trust', exchange: 'NASDAQ', sector: 'ETF', country: 'US' },
  'IWM': { en: 'iShares Russell 2000 ETF', ar: 'صندوق آي شارز راسل 2000', fr: 'iShares Russell 2000 ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'DIA': { en: 'SPDR Dow Jones Industrial Average ETF', ar: 'صندوق داو جونز', fr: 'SPDR Dow Jones Industrial Average ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'GLD': { en: 'SPDR Gold Shares', ar: 'صندوق إس بي دي آر للذهب', fr: 'SPDR Gold Shares', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'SLV': { en: 'iShares Silver Trust', ar: 'صندوق آي شارز للفضة', fr: 'iShares Silver Trust', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'USO': { en: 'United States Oil Fund LP', ar: 'صندوق النفط الأمريكي', fr: 'United States Oil Fund LP', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  // CAC 40
  'MC.PA': { en: 'LVMH Moët Hennessy Louis Vuitton', ar: 'إل في إم إتش', fr: 'LVMH Moët Hennessy Louis Vuitton', exchange: 'Euronext Paris', sector: 'Consumer Cyclical', country: 'FR' },
  'TTE.PA': { en: 'TotalEnergies SE', ar: 'توتال إنرجيز', fr: 'TotalEnergies SE', exchange: 'Euronext Paris', sector: 'Energy', country: 'FR' },
  'OR.PA': { en: "L'Oréal SA", ar: 'لوريال', fr: "L'Oréal SA", exchange: 'Euronext Paris', sector: 'Consumer Defensive', country: 'FR' },
  'SAP.PA': { en: 'SAP SE', ar: 'ساب', fr: 'SAP SE', exchange: 'Euronext Paris', sector: 'Technology', country: 'DE' },
  'BNP.PA': { en: 'BNP Paribas SA', ar: 'بنك باريبا', fr: 'BNP Paribas SA', exchange: 'Euronext Paris', sector: 'Financials', country: 'FR' },
  'RMS.PA': { en: 'Hermès International', ar: 'هيرميس', fr: 'Hermès International', exchange: 'Euronext Paris', sector: 'Consumer Cyclical', country: 'FR' },
  'AI.PA': { en: 'Air Liquide SA', ar: 'إير ليكويد', fr: 'Air Liquide SA', exchange: 'Euronext Paris', sector: 'Basic Materials', country: 'FR' },
  'EL.PA': { en: 'EssilorLuxottica SA', ar: 'إيسيلور لوكسوتيكا', fr: 'EssilorLuxottica SA', exchange: 'Euronext Paris', sector: 'Healthcare', country: 'FR' },
  'SAN.PA': { en: 'Sanofi SA', ar: 'سانوفي', fr: 'Sanofi SA', exchange: 'Euronext Paris', sector: 'Healthcare', country: 'FR' },
  'CS.PA': { en: 'AXA SA', ar: 'أكسا', fr: 'AXA SA', exchange: 'Euronext Paris', sector: 'Financials', country: 'FR' },
  // Tadawul
  '2222.SR': { en: 'Saudi Aramco', ar: 'أرامكو السعودية', fr: 'Saudi Aramco', exchange: 'Tadawul', sector: 'Energy', country: 'SA' },
  '1120.SR': { en: 'Al Rajhi Bank', ar: 'مصرف الراجحي', fr: 'Al Rajhi Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '2380.SR': { en: 'Riyad Bank', ar: 'بنك الرياض', fr: 'Riyad Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '1180.SR': { en: 'National Commercial Bank', ar: 'البنك الأهلي', fr: 'National Commercial Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '4005.SR': { en: 'Sabic', ar: 'سابك', fr: 'Sabic', exchange: 'Tadawul', sector: 'Basic Materials', country: 'SA' },
  // DAX
  'SAP.DE': { en: 'SAP SE', ar: 'ساب', fr: 'SAP SE', exchange: 'XETRA', sector: 'Technology', country: 'DE' },
  'SIE.DE': { en: 'Siemens AG', ar: 'سيمنز', fr: 'Siemens AG', exchange: 'XETRA', sector: 'Industrials', country: 'DE' },
  'ALV.DE': { en: 'Allianz SE', ar: 'أليانز', fr: 'Allianz SE', exchange: 'XETRA', sector: 'Financials', country: 'DE' },
  'DTE.DE': { en: 'Deutsche Telekom AG', ar: 'دويتشه تيليكوم', fr: 'Deutsche Telekom AG', exchange: 'XETRA', sector: 'Communication Services', country: 'DE' },
  // FTSE 100
  'SHEL.L': { en: 'Shell plc', ar: 'شل', fr: 'Shell plc', exchange: 'LSE', sector: 'Energy', country: 'GB' },
  'AZN.L': { en: 'AstraZeneca plc', ar: 'أسترا زينيكا', fr: 'AstraZeneca plc', exchange: 'LSE', sector: 'Healthcare', country: 'GB' },
  'HSBA.L': { en: 'HSBC Holdings plc', ar: 'إتش إس بي سي', fr: 'HSBC Holdings plc', exchange: 'LSE', sector: 'Financials', country: 'GB' },
  // Nikkei 225
  '7203.T': { en: 'Toyota Motor Corporation', ar: 'تويوتا', fr: 'Toyota Motor Corporation', exchange: 'TSE', sector: 'Consumer Cyclical', country: 'JP' },
  '6758.T': { en: 'Sony Group Corporation', ar: 'سوني', fr: 'Sony Group Corporation', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '9984.T': { en: 'SoftBank Group Corp.', ar: 'سوفت بانك', fr: 'SoftBank Group Corp.', exchange: 'TSE', sector: 'Technology', country: 'JP' },
};

/**
 * Enrich company data using COMPANY_NAMES lookup when FMP data is unavailable.
 * Merges lookup data with existing company data, preferring existing non-null values.
 */
function enrichCompanyData(company: any, symbol: string): any {
  const lookup = COMPANY_NAMES[symbol];
  if (!lookup) return company;

  return {
    ...company,
    name: (company?.name && company.name !== symbol) ? company.name : lookup.en,
    nameAr: company?.nameAr || lookup.ar,
    nameFr: company?.nameFr || lookup.fr,
    exchange: company?.exchange || lookup.exchange,
    sector: company?.sector || lookup.sector,
    country: company?.country || lookup.country,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Auto-migrate: ensure stock tables exist (safe — no drops)
    // If migration fails, we can still serve live data from Yahoo/FMP
    const tablesReady = await ensureStockTablesExist();

    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const requestedLocale = searchParams.get('locale') || 'ar';
    // Normalize: accept 'ar', 'en', 'fr', 'tr', 'es' — default to Arabic (primary locale)
    const locale: string = ['ar', 'en', 'fr', 'tr', 'es'].includes(requestedLocale) ? requestedLocale : 'ar';

    if (!symbol) {
      return NextResponse.json(
        { status: 'error', message: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Fetch DB analysis only if tables are ready
    let analysis = null;
    let analysisLocale = locale;
    if (tablesReady) {
      analysis = await safeDBQuery(
        () => db.stockAnalysis.findFirst({
          where: {
            symbol,
            locale,
            isPublished: true,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                nameFr: true,
                exchange: true,
                sector: true,
                industry: true,
                country: true,
                marketCap: true,
                peRatio: true,
                eps: true,
                dividendYield: true,
                logoUrl: true,
              },
            },
          },
        }),
        `stock-analysis-detail-${symbol}-${locale}`
      );

      // Fallback: if no analysis in the requested locale, try any locale
      // This ensures Arabic/French pages always show data when only English analysis exists
      if (!analysis) {
        analysis = await safeDBQuery(
          () => db.stockAnalysis.findFirst({
            where: {
              symbol,
              isPublished: true,
            },
            orderBy: { createdAt: 'desc' },
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  nameFr: true,
                  exchange: true,
                  sector: true,
                  industry: true,
                  country: true,
                  marketCap: true,
                  peRatio: true,
                  eps: true,
                  dividendYield: true,
                  logoUrl: true,
                },
              },
            },
          }),
          `stock-analysis-detail-${symbol}-any`
        );
        if (analysis) {
          analysisLocale = analysis.locale || 'en';
        }
      }
    } else {
      console.warn(`[StockAPI] DB not ready for ${symbol} — using live data only`);
    }

    // ═══ Fetch Yahoo Finance data (FREE — always works, no key needed!) ═══
    // Yahoo Finance is the PRIMARY source for stock data since it requires no API key
    // and provides comprehensive data (quotes, profiles, financials, recommendations)
    const [yahooDataSettled, secEdgarData, macroData] = await Promise.allSettled([
      getYahooFinanceCompanyData(symbol),
      fetchSECEdgarCompanyFacts(symbol),
      fetchFREDIndicators(),
    ]);

    const yahooData = yahooDataSettled.status === 'fulfilled' ? yahooDataSettled.value : { quote: null, profile: null, keyMetrics: null, rating: null, recommendations: [], incomeStatements: [], balanceSheets: [], cashFlowStatements: [] };
    const secEdgar = secEdgarData.status === 'fulfilled' ? secEdgarData.value : null;
    const fredData = macroData.status === 'fulfilled' ? macroData.value : null;

    // Fetch comprehensive financial data from FMP (supplementary, requires API key)
    const [
      fmpQuote,
      fmpProfile,
      fmpKeyMetrics,
      fmpRating,
      fmpIncomeStatements,
      fmpBalanceSheets,
      fmpCashFlowStatements,
      fmpPeers,
      fmpPriceTarget,
    ] = await Promise.allSettled([
      getStockQuote(symbol),
      getCompanyProfile(symbol),
      getFmpKeyMetrics(symbol),
      getStockRating(symbol),
      getIncomeStatements(symbol, 5),
      getBalanceSheets(symbol, 5),
      getCashFlowStatements(symbol, 5),
      getStockPeers(symbol),
      getPriceTargetConsensus(symbol),
    ]);

    // Extract successful FMP results
    let stockQuote: any = fmpQuote.status === 'fulfilled' ? fmpQuote.value : null;
    const companyProfile: any = fmpProfile.status === 'fulfilled' ? fmpProfile.value : null;
    const keyMetrics = fmpKeyMetrics.status === 'fulfilled' ? fmpKeyMetrics.value : null;
    const stockRating = fmpRating.status === 'fulfilled' ? fmpRating.value : null;
    const incomeStatements = fmpIncomeStatements.status === 'fulfilled' ? fmpIncomeStatements.value : [];
    const balanceSheets = fmpBalanceSheets.status === 'fulfilled' ? fmpBalanceSheets.value : [];
    const cashFlowStatements = fmpCashFlowStatements.status === 'fulfilled' ? fmpCashFlowStatements.value : [];
    const peers = fmpPeers.status === 'fulfilled' ? fmpPeers.value : [];
    const priceTarget = fmpPriceTarget.status === 'fulfilled' ? fmpPriceTarget.value : null;

    // ═══ Merge Yahoo Finance data with FMP data (FMP takes priority where available) ═══
    // Use Yahoo data to fill gaps where FMP data is missing
    if (!stockQuote && yahooData.quote) stockQuote = yahooData.quote;
    if (!companyProfile && yahooData.profile) {
      // Convert Yahoo profile to FMP CompanyProfile format
      const yp: any = yahooData.profile;
      // We'll use a simple object that the client can consume
    }
    if (!keyMetrics && yahooData.keyMetrics) {
      // Use Yahoo keyMetrics directly
    }
    if (!stockRating && yahooData.rating) {
      // Use Yahoo rating directly
    }
    if ((!incomeStatements || incomeStatements.length === 0) && yahooData.incomeStatements?.length > 0) {
      // Will use Yahoo income statements in the response
    }
    if ((!balanceSheets || balanceSheets.length === 0) && yahooData.balanceSheets?.length > 0) {
      // Will use Yahoo balance sheets in the response
    }
    if ((!cashFlowStatements || cashFlowStatements.length === 0) && yahooData.cashFlowStatements?.length > 0) {
      // Will use Yahoo cash flow statements in the response
    }

    // ═══ SEC EDGAR fallback for financial statements ═══
    // If neither FMP nor Yahoo Finance have financial statements,
    // use SEC EDGAR data (from 10-K/10-Q filings) as a fallback source.
    // SEC EDGAR provides authoritative financial data directly from SEC filings.
    let secEdgarFallback: {
      incomeStatements: any[];
      balanceSheets: any[];
    } = { incomeStatements: [], balanceSheets: [] };

    if (secEdgar && secEdgar.annual) {
      const sa = secEdgar.annual;
      // Build income statement from SEC EDGAR annual data
      if (sa.revenue > 0) {
        secEdgarFallback.incomeStatements.push({
          date: sa.fiscalPeriod,
          symbol,
          revenue: sa.revenue,
          netIncome: sa.netIncome,
          period: 'annual',
          source: 'SEC EDGAR',
        });
      }
      // Build balance sheet from SEC EDGAR annual data
      if (sa.totalAssets > 0) {
        secEdgarFallback.balanceSheets.push({
          date: sa.fiscalPeriod,
          symbol,
          totalAssets: sa.totalAssets,
          totalLiabilities: sa.totalLiabilities,
          totalStockholdersEquity: sa.stockholdersEquity,
          period: 'annual',
          source: 'SEC EDGAR',
        });
      }
    }

    // Apply SEC EDGAR fallback only when both FMP and Yahoo are empty
    const finalIncomeStatements = (incomeStatements && incomeStatements.length > 0)
      ? incomeStatements
      : (yahooData.incomeStatements?.length > 0 ? yahooData.incomeStatements : secEdgarFallback.incomeStatements);
    const finalBalanceSheets = (balanceSheets && balanceSheets.length > 0)
      ? balanceSheets
      : (yahooData.balanceSheets?.length > 0 ? yahooData.balanceSheets : secEdgarFallback.balanceSheets);
    const finalCashFlowStatements = (cashFlowStatements && cashFlowStatements.length > 0)
      ? cashFlowStatements
      : (yahooData.cashFlowStatements || []);

    // ── FALLBACK: If FMP quote is null, try financial-apis.ts which races multiple providers ──
    let fallbackQuote: any = null;
    let fallbackFundamentals: any = null;
    if (!stockQuote && !yahooData.quote) {
      try {
        const [quoteResult, fundResult] = await Promise.allSettled([
          getQuote(symbol),
          getCompanyFundamentals(symbol),
        ]);
        fallbackQuote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
        fallbackFundamentals = fundResult.status === 'fulfilled' ? fundResult.value : null;
        console.log(`[StockAPI] Fallback quote for ${symbol}:`, fallbackQuote ? 'found' : 'not found');
      } catch (fbErr: any) {
        console.warn(`[StockAPI] Fallback quote error for ${symbol}:`, fbErr?.message?.slice(0, 100));
      }
    }

    // Fetch candlestick data for chart (90 days OHLCV)
    let candlestickData: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];
    try {
      const histData = await getHistoricalData(symbol, 90);
      if (histData && histData.length > 0) {
        candlestickData = histData.map(p => ({
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
        }));
      }
    } catch (histErr: any) {
      console.warn(`[StockAPI] Could not fetch candlestick data for ${symbol}:`, histErr?.message?.slice(0, 100));
    }

    // ═══ Determine final data sources (merge Yahoo Finance + FMP + fallbacks) ═══
    const finalQuote = stockQuote || yahooData.quote || fallbackQuote;

    // Build keyMetrics from multiple sources: MERGE FMP + Yahoo (FMP priority, Yahoo fills gaps)
    let finalKeyMetrics: any = null;
    const fmpKM = keyMetrics;
    const yahooKM = yahooData.keyMetrics;
    if (fmpKM || yahooKM) {
      // Start with whichever source is available, then overlay the other for missing/zero fields
      const base = fmpKM || yahooKM;
      const overlay = fmpKM ? yahooKM : null;
      finalKeyMetrics = { ...base };
      if (overlay) {
        // Fill in any zero/missing fields from the overlay (Yahoo) source
        const fillIfEmpty = (key: string) => {
          if (!finalKeyMetrics[key] && overlay[key]) {
            finalKeyMetrics[key] = overlay[key];
          }
        };
        fillIfEmpty('roe');
        fillIfEmpty('roa');
        fillIfEmpty('grossMargin');
        fillIfEmpty('operatingMargin');
        fillIfEmpty('netMargin');
        fillIfEmpty('debtToEquity');
        fillIfEmpty('currentRatio');
        fillIfEmpty('beta');
        fillIfEmpty('dividendYield');
        fillIfEmpty('revenueGrowth');
        fillIfEmpty('earningsGrowth');
        fillIfEmpty('peRatio');
        fillIfEmpty('eps');
        fillIfEmpty('marketCap');
      }
    }
    if (!finalKeyMetrics) {
      // Build keyMetrics from Yahoo Finance quote + profile data
      // The quote() endpoint returns peRatio, eps, marketCap directly
      const yq = yahooData.quote as any;
      const yp: any = yahooData.profile;
      finalKeyMetrics = {
        peRatio: yp?.peRatio || yq?._yahooExtra?.peRatio || yq?.peRatio || 0,
        eps: yp?.eps || yq?._yahooExtra?.eps || yq?.eps || 0,
        marketCap: yp?.marketCap || yq?._yahooExtra?.marketCap || yq?.marketCap || 0,
        dividendYield: yp?.dividendYield || yq?._yahooExtra?.dividendYield || yq?.dividendYield || 0,
        beta: yp?.beta || yq?._yahooExtra?.beta || yq?.beta || 0,
        roe: yp?.roe || 0,
        roa: yp?.roa || 0,
        grossMargin: yp?.grossMargin || 0,
        operatingMargin: yp?.operatingMargin || 0,
        netMargin: yp?.netMargin || 0,
        debtToEquity: yp?.debtToEquity || 0,
        currentRatio: yp?.currentRatio || 0,
        revenueGrowth: 0,
        earningsGrowth: 0,
        sector: yp?.sector || '',
        industry: yp?.industry || '',
      };
    }

    // ── Final enrichment: fill zero key metrics from Yahoo quote _yahooExtra ──
    // The Yahoo quote() endpoint returns basic metrics that may not be in keyMetrics
    const yQuoteExtra = (yahooData.quote as any)?._yahooExtra;
    if (finalKeyMetrics && yQuoteExtra) {
      if (!finalKeyMetrics.peRatio && yQuoteExtra.peRatio) finalKeyMetrics.peRatio = yQuoteExtra.peRatio;
      if (!finalKeyMetrics.eps && yQuoteExtra.eps) finalKeyMetrics.eps = yQuoteExtra.eps;
      if (!finalKeyMetrics.marketCap && yQuoteExtra.marketCap) finalKeyMetrics.marketCap = yQuoteExtra.marketCap;
      if (!finalKeyMetrics.beta && yQuoteExtra.beta) finalKeyMetrics.beta = yQuoteExtra.beta;
      // dividendYield from Yahoo quote() is already a percentage (e.g., 0.35 for 0.35%)
      if (!finalKeyMetrics.dividendYield && yQuoteExtra.dividendYield) finalKeyMetrics.dividendYield = yQuoteExtra.dividendYield;
    }

    const finalStockRating = stockRating || yahooData.rating;

    // ── Compute missing key metrics from financial statements ──
    // If FMP/Yahoo key metrics don't have margins/ratios, compute them from income statements & balance sheets
    if (finalKeyMetrics) {
      // Use the most recent (first) income statement and balance sheet
      const latestIncome = finalIncomeStatements?.[0];
      const latestBalance = finalBalanceSheets?.[0];

      // Gross Margin = grossProfit / revenue
      if (!finalKeyMetrics.grossMargin && latestIncome?.revenue && latestIncome.revenue > 0) {
        const gp = latestIncome.grossProfit || (latestIncome.revenue - (latestIncome.costOfRevenue || 0));
        if (gp > 0) finalKeyMetrics.grossMargin = (gp / latestIncome.revenue) * 100;
      }
      // Operating Margin = operatingIncome / revenue
      if (!finalKeyMetrics.operatingMargin && latestIncome?.revenue && latestIncome.revenue > 0 && latestIncome.operatingIncome) {
        finalKeyMetrics.operatingMargin = (latestIncome.operatingIncome / latestIncome.revenue) * 100;
      }
      // Net Margin = netIncome / revenue
      if (!finalKeyMetrics.netMargin && latestIncome?.revenue && latestIncome.revenue > 0 && latestIncome.netIncome) {
        finalKeyMetrics.netMargin = (latestIncome.netIncome / latestIncome.revenue) * 100;
      }
      // Debt to Equity = totalLiabilities / totalStockholdersEquity
      if (!finalKeyMetrics.debtToEquity && latestBalance) {
        const equity = latestBalance.totalStockholdersEquity || latestBalance.totalEquity;
        const liab = latestBalance.totalLiabilities;
        if (equity && equity > 0 && liab) {
          finalKeyMetrics.debtToEquity = liab / equity;
        }
      }
      // Current Ratio = currentAssets / currentLiabilities
      if (!finalKeyMetrics.currentRatio && latestBalance) {
        const ca = latestBalance.currentAssets || latestBalance.totalCurrentAssets;
        const cl = latestBalance.currentLiabilities || latestBalance.totalCurrentLiabilities;
        if (ca && cl && cl > 0) {
          finalKeyMetrics.currentRatio = ca / cl;
        }
      }
      // ROE = netIncome / totalStockholdersEquity
      if (!finalKeyMetrics.roe && latestIncome?.netIncome && latestBalance) {
        const equity = latestBalance.totalStockholdersEquity || latestBalance.totalEquity;
        if (equity && equity > 0) {
          finalKeyMetrics.roe = (latestIncome.netIncome / equity) * 100;
        }
      }
      // ROA = netIncome / totalAssets
      if (!finalKeyMetrics.roa && latestIncome?.netIncome && latestBalance?.totalAssets && latestBalance.totalAssets > 0) {
        finalKeyMetrics.roa = (latestIncome.netIncome / latestBalance.totalAssets) * 100;
      }
      // Revenue Growth (from income statements)
      if (!finalKeyMetrics.revenueGrowth && finalIncomeStatements?.length >= 2) {
        const curr = finalIncomeStatements[0].revenue;
        const prev = finalIncomeStatements[1].revenue;
        if (curr && prev && prev > 0) {
          finalKeyMetrics.revenueGrowth = ((curr - prev) / prev) * 100;
        }
      }
      // Earnings Growth (from income statements)
      if (!finalKeyMetrics.earningsGrowth && finalIncomeStatements?.length >= 2) {
        const curr = finalIncomeStatements[0].netIncome;
        const prev = finalIncomeStatements[1].netIncome;
        if (curr && prev && prev > 0) {
          finalKeyMetrics.earningsGrowth = ((curr - prev) / prev) * 100;
        }
      }
    }

    // ── LIVE FALLBACK: If no DB analysis exists, build response from available data ──
    if (!analysis) {
      // Get price data from any available source (Yahoo Finance is always available)
      const priceSource = finalQuote;
      if (!priceSource) {
        const errMsg = locale === 'ar'
          ? `لا توجد بيانات متاحة لـ ${symbol}. قد يكون الرمز غير صالح أو بيانات السوق غير متاحة مؤقتاً.`
          : locale === 'fr'
            ? `Aucune donnée disponible pour ${symbol}. Le symbole peut être invalide ou les données de marché sont temporairement indisponibles.`
            : locale === 'es'
              ? `No hay datos disponibles para ${symbol}. El símbolo puede ser inválido o los datos de mercado están temporalmente no disponibles.`
              : `No data available for ${symbol}. The symbol may be invalid or market data is temporarily unavailable.`;
        return NextResponse.json(
          { status: 'error', message: errMsg, symbol, locale },
          { status: 404 }
        );
      }

      // Determine signal from live quote data
      const price = priceSource.price ?? 0;
      const change = priceSource.change ?? 0;
      const changePercent = priceSource.changePercent ?? 0;
      const isUp = change >= 0;
      let overallSignal = 'neutral';
      let overallScore = 0;
      if (changePercent > 2) { overallSignal = 'bullish'; overallScore = 60; }
      else if (changePercent > 0) { overallSignal = 'bullish'; overallScore = 30; }
      else if (changePercent < -2) { overallSignal = 'bearish'; overallScore = -60; }
      else if (changePercent < 0) { overallSignal = 'bearish'; overallScore = -30; }

      // Build company profile — prioritize FMP profile > Yahoo profile > Yahoo quote data > COMPANY_NAMES lookup
      const lookup = COMPANY_NAMES[symbol];
      const yp: any = yahooData.profile; // Yahoo profile data (from quoteSummary)
      const yq = finalQuote as any; // Yahoo quote data (always available)
      const yqExtra = yq?._yahooExtra || {}; // Extra data from Yahoo quote
      const company: any = enrichCompanyData({
        name: companyProfile?.companyName || yp?.name || yqExtra.name || yq?.name || priceSource.name || priceSource.companyName || null,
        nameAr: null,
        nameFr: null,
        exchange: companyProfile?.exchange || yp?.exchange || yqExtra.exchange || priceSource.exchange || priceSource.listedExchange || null,
        sector: companyProfile?.sector || yp?.sector || finalKeyMetrics?.sector || fallbackFundamentals?.sector || null,
        industry: companyProfile?.industry || yp?.industry || finalKeyMetrics?.industry || fallbackFundamentals?.industry || null,
        country: companyProfile?.country || yp?.country || fallbackFundamentals?.country || null,
        marketCap: companyProfile?.marketCap || yp?.marketCap || yqExtra.marketCap || yq?.marketCap || finalKeyMetrics?.marketCap || fallbackFundamentals?.marketCap || null,
        peRatio: companyProfile?.peRatio || yp?.peRatio || yqExtra.peRatio || yq?.peRatio || finalKeyMetrics?.peRatio || priceSource.pe || fallbackFundamentals?.peRatio || null,
        eps: companyProfile?.eps || yp?.eps || yqExtra.eps || yq?.eps || finalKeyMetrics?.eps || priceSource.eps || fallbackFundamentals?.eps || null,
        dividendYield: companyProfile?.dividendYield || yp?.dividendYield || yqExtra.dividendYield || finalKeyMetrics?.dividendYield || fallbackFundamentals?.dividendYield || null,
        logoUrl: companyProfile?.image || null,
        description: yp?.description || companyProfile?.description || null,
        website: yp?.website || companyProfile?.website || null,
        beta: companyProfile?.beta || yp?.beta || yqExtra.beta || finalKeyMetrics?.beta || null,
        week52High: companyProfile?.week52High || yp?.week52High || yqExtra.week52High || null,
        week52Low: companyProfile?.week52Low || yp?.week52Low || yqExtra.week52Low || null,
      }, symbol);

      // Technical indicators from key metrics (Yahoo Finance or FMP)
      const technicalData: any = {};
      if (finalKeyMetrics) {
        if (finalKeyMetrics.rsi) technicalData.rsi = finalKeyMetrics.rsi;
        if (finalKeyMetrics.sma50) technicalData.sma50 = finalKeyMetrics.sma50;
        if (finalKeyMetrics.sma200) technicalData.sma200 = finalKeyMetrics.sma200;
        if (finalKeyMetrics.beta) technicalData.beta = finalKeyMetrics.beta;
        if (finalKeyMetrics.peRatio) technicalData.peRatio = finalKeyMetrics.peRatio;
        if (finalKeyMetrics.eps) technicalData.eps = finalKeyMetrics.eps;
        if (finalKeyMetrics.roe) technicalData.roe = finalKeyMetrics.roe;
        if (finalKeyMetrics.roa) technicalData.roa = finalKeyMetrics.roa;
        if (finalKeyMetrics.grossMargin) technicalData.grossMargin = finalKeyMetrics.grossMargin;
        if (finalKeyMetrics.operatingMargin) technicalData.operatingMargin = finalKeyMetrics.operatingMargin;
        if (finalKeyMetrics.netMargin) technicalData.netMargin = finalKeyMetrics.netMargin;
        if (finalKeyMetrics.debtToEquity) technicalData.debtToEquity = finalKeyMetrics.debtToEquity;
        if (finalKeyMetrics.currentRatio) technicalData.currentRatio = finalKeyMetrics.currentRatio;
        if (finalKeyMetrics.revenueGrowth) technicalData.revenueGrowth = finalKeyMetrics.revenueGrowth;
        if (finalKeyMetrics.earningsGrowth) technicalData.earningsGrowth = finalKeyMetrics.earningsGrowth;
      }

      // Simple trade setup from quote
      const tradeSetup: any = {};
      if (price > 0) {
        const atrEstimate = Math.abs(change) || price * 0.02;
        tradeSetup.entry = price;
        tradeSetup.entryPrice = price;
        tradeSetup.stopLoss = isUp ? price - atrEstimate * 1.5 : price + atrEstimate * 1.5;
        tradeSetup.targetPrice = isUp ? price + atrEstimate * 2.5 : price - atrEstimate * 2.5;
        tradeSetup.takeProfit = tradeSetup.targetPrice;
        tradeSetup.direction = isUp ? 'long' : 'short';
        const risk = Math.abs(tradeSetup.entryPrice - tradeSetup.stopLoss);
        const reward = Math.abs(tradeSetup.targetPrice - tradeSetup.entryPrice);
        tradeSetup.riskRewardRatio = risk > 0 ? reward / risk : 0;
      }

      const now = new Date();
      // Locale-aware title/summary for live fallback
      const companyName = company.name || symbol;
      const liveTitle = locale === 'ar'
        ? `تحليل مباشر لسهم ${companyName}`
        : locale === 'fr'
          ? `Analyse en direct ${companyName}`
          : locale === 'es'
            ? `Análisis en vivo de ${companyName}`
            : `${companyName} Live Analysis`;
      const liveSummary = locale === 'ar'
        ? `بيانات السوق المباشرة لسهم ${companyName}. سيكون التحليل بالذكاء الاصطناعي متاحاً بعد تشغيل خط المعالجة القادم.`
        : locale === 'fr'
          ? `Données de marché en temps réel pour ${companyName}. L'analyse IA sera disponible après la prochaine exécution du pipeline.`
          : locale === 'es'
            ? `Datos de mercado en tiempo real para ${companyName}. El análisis con IA estará disponible después de la próxima ejecución del pipeline.`
            : `Real-time market data for ${companyName}. AI-generated analysis will be available after the next pipeline run.`;

      const liveResponse = {
        status: 'ok',
        symbol,
        locale,
        isLiveFallback: true,
        analysis: {
          id: null,
          slug: `${symbol}-live`,
          title: liveTitle,
          summary: liveSummary,
          content: null,
          locale,
          marketType: 'stock',

          // Quote snapshot from live data
          quote: {
            price: priceSource.price ?? price,
            change: priceSource.change ?? change,
            changePercent: priceSource.changePercent ?? changePercent,
            high: priceSource.dayHigh ?? priceSource.high ?? null,
            low: priceSource.dayLow ?? priceSource.low ?? null,
            open: priceSource.open ?? null,
            volume: priceSource.volume ?? null,
            previousClose: priceSource.previousClose ?? priceSource.close ?? null,
          },

          // Technical data
          technicalData,

          // Signal & scoring
          signal: {
            overall: overallSignal,
            score: overallScore,
            confidence: 30,
            riskLevel: 'medium',
          },

          // Trade setup
          tradeSetup,

          // Timestamps
          publishedAt: now.toISOString(),
          validUntil: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          createdAt: now.toISOString(),
        },

        // Company profile (enriched)
        company,

        // No history for live fallback
        history: [],

        // Candlestick chart data
        candlestickData,

        // Comprehensive Financial Data (merged from FMP + Yahoo Finance)
        stockQuote: stockQuote || null,
        keyMetrics: finalKeyMetrics,
        stockRating: finalStockRating,
        incomeStatements: finalIncomeStatements,
        balanceSheets: finalBalanceSheets,
        cashFlowStatements: finalCashFlowStatements,
        peers,
        priceTarget: priceTarget || (finalStockRating ? { targetHigh: (finalStockRating as any).targetHigh, targetLow: (finalStockRating as any).targetLow, targetMedian: (finalStockRating as any).targetMedian, targetConsensus: (finalStockRating as any).targetConsensus } : null),

        // Yahoo Finance data (always available)
        yahooFinanceData: yahooData.profile ? {
          profile: yahooData.profile,
          recommendations: yahooData.recommendations,
        } : null,

        // SEC EDGAR data (free, authoritative SEC filings)
        secEdgarData: secEdgar ? {
          entityName: secEdgar.entityName,
          cik: secEdgar.cik,
          annual: secEdgar.annual,
          quarterly: secEdgar.quarterly,
        } : null,

        // FRED macro economic indicators (free, requires FRED_API_KEY)
        macroData: fredData ? {
          treasury10Y: fredData.treasury10Y,
          gdp: fredData.gdp,
          cpi: fredData.cpi,
          unemployment: fredData.unemployment,
          fedFundsRate: fredData.fedFundsRate,
          treasurySpread10Y2Y: fredData.treasurySpread10Y2Y,
        } : null,

        newsItemId: null,
      };

      return NextResponse.json(liveResponse);
    }

    // ── DB ANALYSIS EXISTS: Build full response ──

    // Parse JSON fields for client consumption
    let technicalData: any = analysis.technicalData;
    try {
      technicalData = typeof technicalData === 'string' ? JSON.parse(technicalData) : technicalData;
    } catch {
      technicalData = {};
    }

    let tradeSetup: any = analysis.tradeSetup;
    try {
      tradeSetup = typeof tradeSetup === 'string' ? JSON.parse(tradeSetup) : tradeSetup;
    } catch {
      tradeSetup = {};
    }

    // Enrich company data from COMPANY_NAMES lookup + FMP profile + Yahoo profile + fallback fundamentals
    let enrichedCompany = analysis.company ? { ...analysis.company } : {};
    // Apply COMPANY_NAMES lookup first
    enrichedCompany = enrichCompanyData(enrichedCompany, symbol);
    // Then overlay FMP profile data (if available, overrides lookup)
    if (companyProfile) {
      if (companyProfile.name) enrichedCompany.name = companyProfile.name;
      if (companyProfile.exchange) enrichedCompany.exchange = companyProfile.exchange;
      if (companyProfile.sector) enrichedCompany.sector = companyProfile.sector;
      if (companyProfile.industry) enrichedCompany.industry = companyProfile.industry;
      if (companyProfile.country) enrichedCompany.country = companyProfile.country;
      if (companyProfile.marketCap) enrichedCompany.marketCap = companyProfile.marketCap;
      if (companyProfile.peRatio) enrichedCompany.peRatio = companyProfile.peRatio;
      if (companyProfile.eps) enrichedCompany.eps = companyProfile.eps;
      if (companyProfile.dividendYield) enrichedCompany.dividendYield = companyProfile.dividendYield;
      if (companyProfile.image) enrichedCompany.logoUrl = companyProfile.image;
    }
    // Then overlay Yahoo Finance profile data (if FMP profile is unavailable)
    const yp: any = yahooData.profile;
    if (!companyProfile && yp) {
      if (yp.name && enrichedCompany.name === symbol) enrichedCompany.name = yp.name;
      if (yp.exchange && !enrichedCompany.exchange) enrichedCompany.exchange = yp.exchange;
      if (yp.sector && !enrichedCompany.sector) enrichedCompany.sector = yp.sector;
      if (yp.industry && !enrichedCompany.industry) enrichedCompany.industry = yp.industry;
      if (yp.country && !enrichedCompany.country) enrichedCompany.country = yp.country;
      if (yp.marketCap && !enrichedCompany.marketCap) enrichedCompany.marketCap = yp.marketCap;
      if (yp.peRatio && !enrichedCompany.peRatio) enrichedCompany.peRatio = yp.peRatio;
      if (yp.eps && !enrichedCompany.eps) enrichedCompany.eps = yp.eps;
      if (yp.dividendYield && !enrichedCompany.dividendYield) enrichedCompany.dividendYield = yp.dividendYield;
      if (yp.beta && !enrichedCompany.beta) enrichedCompany.beta = yp.beta;
      if (yp.description && !enrichedCompany.description) enrichedCompany.description = yp.description;
      if (yp.website && !enrichedCompany.website) enrichedCompany.website = yp.website;
    }
    // Then overlay fallback fundamentals (if both FMP and Yahoo are unavailable)
    if (!companyProfile && !yp && fallbackFundamentals) {
      if (fallbackFundamentals.name && enrichedCompany.name === symbol) enrichedCompany.name = fallbackFundamentals.name;
      if (fallbackFundamentals.exchange && !enrichedCompany.exchange) enrichedCompany.exchange = fallbackFundamentals.exchange;
      if (fallbackFundamentals.sector && !enrichedCompany.sector) enrichedCompany.sector = fallbackFundamentals.sector;
      if (fallbackFundamentals.industry && !enrichedCompany.industry) enrichedCompany.industry = fallbackFundamentals.industry;
      if (fallbackFundamentals.country && !enrichedCompany.country) enrichedCompany.country = fallbackFundamentals.country;
      if (fallbackFundamentals.marketCap && !enrichedCompany.marketCap) enrichedCompany.marketCap = fallbackFundamentals.marketCap;
      if (fallbackFundamentals.peRatio && !enrichedCompany.peRatio) enrichedCompany.peRatio = fallbackFundamentals.peRatio;
      if (fallbackFundamentals.eps && !enrichedCompany.eps) enrichedCompany.eps = fallbackFundamentals.eps;
    }

    // Also fetch recent analysis history for this symbol (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const history = await safeDBQuery(
      () => db.stockAnalysis.findMany({
        where: {
          symbol,
          locale: analysisLocale,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          price: true,
          change: true,
          changePercent: true,
          overallSignal: true,
          overallScore: true,
          confidenceScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
      `stock-analysis-history-${symbol}-${analysisLocale}`
    ) || [];

    // Build response
    const response = {
      status: 'ok',
      symbol,
      locale,
      analysis: {
        id: analysis.id,
        slug: analysis.slug,
        title: analysis.title,
        summary: analysis.summary,
        content: analysis.content,
        locale: analysis.locale,
        marketType: analysis.marketType,

        // Quote snapshot
        quote: {
          price: analysis.price,
          change: analysis.change,
          changePercent: analysis.changePercent,
          high: analysis.high,
          low: analysis.low,
          open: analysis.open,
          volume: analysis.volume,
          previousClose: analysis.previousClose,
        },

        // Technical data
        technicalData,

        // Signal & scoring
        signal: {
          overall: analysis.overallSignal,
          score: analysis.overallScore,
          confidence: analysis.confidenceScore,
          riskLevel: analysis.riskLevel,
        },

        // Trade setup
        tradeSetup,

        // Timestamps
        publishedAt: analysis.publishedAt,
        validUntil: analysis.validUntil,
        createdAt: analysis.createdAt,
      },

      // Company profile (enriched)
      company: enrichedCompany,

      // Historical signal progression (last 7 analyses)
      history,

      // Candlestick chart data (90 days OHLCV)
      candlestickData,

      // Comprehensive Financial Data (merged from FMP + Yahoo Finance)
      stockQuote: stockQuote || null,
      keyMetrics: finalKeyMetrics,
      stockRating: finalStockRating,
      incomeStatements: finalIncomeStatements,
      balanceSheets: finalBalanceSheets,
      cashFlowStatements: finalCashFlowStatements,
      peers,
      priceTarget: priceTarget || (finalStockRating ? { targetHigh: (finalStockRating as any).targetHigh, targetLow: (finalStockRating as any).targetLow, targetMedian: (finalStockRating as any).targetMedian, targetConsensus: (finalStockRating as any).targetConsensus } : null),

      // Yahoo Finance data (always available)
      yahooFinanceData: yahooData.profile ? {
        profile: yahooData.profile,
        recommendations: yahooData.recommendations,
      } : null,

      // SEC EDGAR data (free, authoritative SEC filings)
      secEdgarData: secEdgar ? {
        entityName: secEdgar.entityName,
        cik: secEdgar.cik,
        annual: secEdgar.annual,
        quarterly: secEdgar.quarterly,
      } : null,

      // FRED macro economic indicators (free, requires FRED_API_KEY)
      macroData: fredData ? {
        treasury10Y: fredData.treasury10Y,
        gdp: fredData.gdp,
        cpi: fredData.cpi,
        unemployment: fredData.unemployment,
        fedFundsRate: fredData.fedFundsRate,
        treasurySpread10Y2Y: fredData.treasurySpread10Y2Y,
      } : null,

      // Related news item
      newsItemId: analysis.newsItemId,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(`[StockAPI] Error fetching symbol analysis:`, err.message);
    return NextResponse.json(
      { status: 'error', error: err.message },
      { status: 500 }
    );
  }
}
