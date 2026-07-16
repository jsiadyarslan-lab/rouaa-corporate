// ─── Stock Analysis Pipeline ──────────────────────────────────
// Generates daily stock analyses in 3 languages (EN/AR/FR).
// Fetches real-time quotes, runs technical analysis, generates
// AI-powered articles, and publishes them as StockAnalysis records
// and NewsItem articles for the news feed.
//
// Usage:
//   import { runStockAnalysisPipeline } from '@/lib/pipeline/stock-analysis-pipeline';
//   const result = await runStockAnalysisPipeline('en', 10);

import { getQuote, getHistoricalData, getCompanyFundamentals, getKeyMetrics, type QuoteData, type HistoricalPoint, type CompanyFundamentals, type KeyMetrics } from '@/lib/financial-apis';
import { performTechnicalAnalysis, type TechnicalAnalysisResult } from '@/lib/technical-analysis';
import { db } from '@/lib/db';
import { chatCompletion, type ChatMessage } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';

// ─── Configuration ────────────────────────────────────────────

// ─── FMP-Verified Symbols ──────────────────────────────────────
// These symbols are known to work reliably with FMP's quote and
// historical-price-full endpoints. Use these as the primary pool
// to maximize pipeline success rate.

const FMP_VERIFIED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V',
  'UNH', 'JNJ', 'WMT', 'XOM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV',
  'AVGO', 'KO', 'PEP', 'COST', 'ADBE', 'CRM', 'AMD', 'NFLX', 'INTC', 'CMCSA',
  'LLY', 'NVO', 'ORCL', 'CSCO', 'ABT', 'CVS', 'AXP', 'MCD', 'MDLZ', 'TXN',
  'ISRG', 'GILD', 'REGN', 'VRTX', 'BIIB', 'SBUX', 'BKNG', 'AMGN', 'CAT', 'DE',
];

const TOP_CAC40_SYMBOLS = [
  'MC.PA', 'TTE.PA', 'OR.PA', 'SAP.PA', 'BNP.PA', 'RMS.PA', 'AI.PA', 'EL.PA',
  'SAN.PA', 'CS.PA', 'CAP.PA', 'EN.PA', 'GLE.PA', 'SU.PA', 'RI.PA', 'DG.PA',
];

const TOP_TADAWUL_SYMBOLS = [
  '2222.SR', '1120.SR', '2380.SR', '1180.SR', '1210.SR', '1320.SR', '4005.SR', '4090.SR',
];

const TOP_DAX_SYMBOLS = [
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'IFX.DE', 'ADS.DE', 'BAS.DE', 'BMW.DE', 'BAYN.DE', 'CON.DE',
];

const TOP_FTSE_SYMBOLS = [
  'SHEL.L', 'AZN.L', 'HSBA.L', 'ULVR.L', 'BP.L', 'GSK.L', 'RIO.L', 'BA.L', 'DGE.L', 'REL.L',
];

const TOP_NIKKEI_SYMBOLS = [
  '7203.T', '6758.T', '9984.T', '6861.T', '8306.T', '9433.T', '7974.T', '6501.T', '6902.T', '8035.T',
];

// ─── Additional Symbol Groups (500+ total) ────────────────────

const ADDITIONAL_SP500 = [
  'PYPL', 'SQ', 'SHOP', 'SNAP', 'PIN', 'ROKU', 'ZM', 'DOCU', 'OKTA', 'CRWD',
  'SNOW', 'PLTR', 'COIN', 'RBLX', 'ABNB', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI',
  'BABA', 'JD', 'PDD', 'NTES', 'TCEHY', 'SE', 'GRAB', 'MSTR', 'MARA', 'RIOT',
  'LLY', 'NVO', 'AZN', 'ROCHE', 'NVS', 'SNY', 'MRNA', 'BNTX', 'GILD', 'VRTX',
  'DELL', 'HPQ', 'HPE', 'IBM', 'MU', 'LRCX', 'AMAT', 'KLAC', 'MRVL', 'ON',
  'MCD', 'SBUX', 'CMG', 'YUM', 'DPZ', 'LULU', 'TGT', 'DLTR', 'DG', 'FIVE',
  'CAT', 'DE', 'BA', 'LMT', 'RTX', 'NOC', 'GD', 'GE', 'MMM', 'HON',
];

const ADDITIONAL_EUROPE = [
  'AIR.PA', 'ALO.PA', 'BN.PA', 'ENGI.PA', 'WLN.PA', 'STLA.PA', 'HO.PA', 'KRNY.PA', 'ACA.PA', 'DSY.PA',
  'BMW.DE', 'SAP.DE', 'SIE.DE', 'AIR.DE', 'RWE.DE', 'HEI.DE', 'FRE.DE', 'SHL.DE', 'QIA.DE', 'BOSS.DE',
  'AZM.L', 'HLN.L', 'LSEG.L', 'SGE.L', 'PSN.L', 'PRU.L', 'DCC.L', 'SVT.L', 'SMDS.L', 'CPG.L',
];

const ADDITIONAL_ASIA = [
  '005930.KS', '000660.KS', '373220.KS', '207940.KS', '068270.KS', // Samsung, SK Hynix, etc.
  '7201.T', '6702.T', '6753.T', '9020.T', '8766.T', // Nissan, Fujitsu, etc.
  'BIDU', 'FUTU', 'TME', 'IQ', 'VIPS', // Chinese ADRs
  'INFY', 'WIT', 'HDB', 'IBN', // Indian IT
  'SEA', 'GCPEF', 'BYDDF', 'TCEHY', // SE Asian
  'ACLTF', 'SSRM', 'AEM', 'KL', 'GOLD', // Mining
  '601398.SS', '600519.SS', '601318.SS', '600036.SS', '601988.SS', // Chinese large caps
  'HINDALCO.NS', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'BAJFINANCE.NS', // Indian large caps
];

const MAJOR_ETFS = [
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VEA', 'VWO', 'BND', 'TLT', 'GLD',
  'SLV', 'USO', 'XLF', 'XLE', 'XLK', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU',
];

const DELAY_BETWEEN_CALLS_MS = 3000; // 3-second delay to avoid rate limiting (FMP free tier)

// ─── Company Name Lookup ──────────────────────────────────────

const COMPANY_NAMES: Record<string, { en: string; ar: string; fr: string; exchange: string; sector: string; country: string }> = {
  // S&P 500
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
  'CAP.PA': { en: 'Capgemini SE', ar: 'كابجيميني', fr: 'Capgemini SE', exchange: 'Euronext Paris', sector: 'Technology', country: 'FR' },
  'EN.PA': { en: 'Bouygues SA', ar: 'بويغ', fr: 'Bouygues SA', exchange: 'Euronext Paris', sector: 'Communication Services', country: 'FR' },
  'GLE.PA': { en: 'Société Générale SA', ar: 'سوسيتيه جنرال', fr: 'Société Générale SA', exchange: 'Euronext Paris', sector: 'Financials', country: 'FR' },
  'SU.PA': { en: 'Schneider Electric SE', ar: 'شنايدر إلكتريك', fr: 'Schneider Electric SE', exchange: 'Euronext Paris', sector: 'Technology', country: 'FR' },
  'RI.PA': { en: 'Pernod Ricard SA', ar: 'بيرنود ريكار', fr: 'Pernod Ricard SA', exchange: 'Euronext Paris', sector: 'Consumer Defensive', country: 'FR' },
  'DG.PA': { en: 'Vinci SA', ar: 'فينشي', fr: 'Vinci SA', exchange: 'Euronext Paris', sector: 'Industrials', country: 'FR' },
  // Tadawul
  '2222.SR': { en: 'Saudi Aramco', ar: 'أرامكو السعودية', fr: 'Saudi Aramco', exchange: 'Tadawul', sector: 'Energy', country: 'SA' },
  '1120.SR': { en: 'Al Rajhi Bank', ar: 'مصرف الراجحي', fr: 'Al Rajhi Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '2380.SR': { en: 'Riyad Bank', ar: 'بنك الرياض', fr: 'Riyad Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '1180.SR': { en: 'National Commercial Bank', ar: 'البنك الأهلي', fr: 'National Commercial Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '1210.SR': { en: 'Saudi British Bank', ar: 'بنك السعودي البريطاني', fr: 'Saudi British Bank', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '1320.SR': { en: 'Samba Financial Group', ar: 'مجموعة سامبا المالية', fr: 'Samba Financial Group', exchange: 'Tadawul', sector: 'Financials', country: 'SA' },
  '4005.SR': { en: 'Sabic', ar: 'سابك', fr: 'Sabic', exchange: 'Tadawul', sector: 'Basic Materials', country: 'SA' },
  '4090.SR': { en: 'Saudi Basic Industries Corporation', ar: 'الصناعات الأساسية', fr: 'Saudi Basic Industries Corporation', exchange: 'Tadawul', sector: 'Basic Materials', country: 'SA' },
  // DAX
  'SAP.DE': { en: 'SAP SE', ar: 'ساب', fr: 'SAP SE', exchange: 'XETRA', sector: 'Technology', country: 'DE' },
  'SIE.DE': { en: 'Siemens AG', ar: 'سيمنز', fr: 'Siemens AG', exchange: 'XETRA', sector: 'Industrials', country: 'DE' },
  'ALV.DE': { en: 'Allianz SE', ar: 'أليانز', fr: 'Allianz SE', exchange: 'XETRA', sector: 'Financials', country: 'DE' },
  'DTE.DE': { en: 'Deutsche Telekom AG', ar: 'دويتشه تيليكوم', fr: 'Deutsche Telekom AG', exchange: 'XETRA', sector: 'Communication Services', country: 'DE' },
  'IFX.DE': { en: 'Infineon Technologies AG', ar: 'إنفينيون', fr: 'Infineon Technologies AG', exchange: 'XETRA', sector: 'Technology', country: 'DE' },
  'ADS.DE': { en: 'Adidas AG', ar: 'أديداس', fr: 'Adidas AG', exchange: 'XETRA', sector: 'Consumer Cyclical', country: 'DE' },
  'BAS.DE': { en: 'BASF SE', ar: 'باسف', fr: 'BASF SE', exchange: 'XETRA', sector: 'Basic Materials', country: 'DE' },
  'BMW.DE': { en: 'BMW AG', ar: 'بي إم دبليو', fr: 'BMW AG', exchange: 'XETRA', sector: 'Consumer Cyclical', country: 'DE' },
  'BAYN.DE': { en: 'Bayer AG', ar: 'باير', fr: 'Bayer AG', exchange: 'XETRA', sector: 'Healthcare', country: 'DE' },
  'CON.DE': { en: 'Continental AG', ar: 'كونتيننتال', fr: 'Continental AG', exchange: 'XETRA', sector: 'Consumer Cyclical', country: 'DE' },
  // FTSE 100
  'SHEL.L': { en: 'Shell plc', ar: 'شل', fr: 'Shell plc', exchange: 'LSE', sector: 'Energy', country: 'GB' },
  'AZN.L': { en: 'AstraZeneca plc', ar: 'أسترا زينيكا', fr: 'AstraZeneca plc', exchange: 'LSE', sector: 'Healthcare', country: 'GB' },
  'HSBA.L': { en: 'HSBC Holdings plc', ar: 'إتش إس بي سي', fr: 'HSBC Holdings plc', exchange: 'LSE', sector: 'Financials', country: 'GB' },
  'ULVR.L': { en: 'Unilever plc', ar: 'يونيليفر', fr: 'Unilever plc', exchange: 'LSE', sector: 'Consumer Defensive', country: 'GB' },
  'BP.L': { en: 'BP plc', ar: 'بي بي', fr: 'BP plc', exchange: 'LSE', sector: 'Energy', country: 'GB' },
  'GSK.L': { en: 'GSK plc', ar: 'جي إس كيه', fr: 'GSK plc', exchange: 'LSE', sector: 'Healthcare', country: 'GB' },
  'RIO.L': { en: 'Rio Tinto Group', ar: 'ريو تينتو', fr: 'Rio Tinto Group', exchange: 'LSE', sector: 'Basic Materials', country: 'GB' },
  'BA.L': { en: 'BAE Systems plc', ar: 'بي إي إي سيستمز', fr: 'BAE Systems plc', exchange: 'LSE', sector: 'Industrials', country: 'GB' },
  'DGE.L': { en: 'Diageo plc', ar: 'دياجيو', fr: 'Diageo plc', exchange: 'LSE', sector: 'Consumer Defensive', country: 'GB' },
  'REL.L': { en: 'Relx plc', ar: 'ريلكس', fr: 'Relx plc', exchange: 'LSE', sector: 'Technology', country: 'GB' },
  // Nikkei 225
  '7203.T': { en: 'Toyota Motor Corporation', ar: 'تويوتا', fr: 'Toyota Motor Corporation', exchange: 'TSE', sector: 'Consumer Cyclical', country: 'JP' },
  '6758.T': { en: 'Sony Group Corporation', ar: 'سوني', fr: 'Sony Group Corporation', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '9984.T': { en: 'SoftBank Group Corp.', ar: 'سوفت بانك', fr: 'SoftBank Group Corp.', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '6861.T': { en: 'Keyence Corporation', ar: 'كينس', fr: 'Keyence Corporation', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '8306.T': { en: 'MUFG', ar: 'ميتسوبيشي يو إف جيه', fr: 'MUFG', exchange: 'TSE', sector: 'Financials', country: 'JP' },
  '9433.T': { en: 'NTT Docomo Inc.', ar: 'إن تي تي دوكومو', fr: 'NTT Docomo Inc.', exchange: 'TSE', sector: 'Communication Services', country: 'JP' },
  '7974.T': { en: 'Nintendo Co., Ltd.', ar: 'نينتندو', fr: 'Nintendo Co., Ltd.', exchange: 'TSE', sector: 'Communication Services', country: 'JP' },
  '6501.T': { en: 'Hitachi Ltd.', ar: 'هيتاتشي', fr: 'Hitachi Ltd.', exchange: 'TSE', sector: 'Industrials', country: 'JP' },
  '6902.T': { en: 'Denso Corporation', ar: 'دينسو', fr: 'Denso Corporation', exchange: 'TSE', sector: 'Consumer Cyclical', country: 'JP' },
  '8035.T': { en: 'Itochu Corporation', ar: 'إيتوتشو', fr: 'Itochu Corporation', exchange: 'TSE', sector: 'Industrials', country: 'JP' },
  // Additional S&P 500
  'PYPL': { en: 'PayPal Holdings Inc.', ar: 'باي بال', fr: 'PayPal Holdings Inc.', exchange: 'NASDAQ', sector: 'Financials', country: 'US' },
  'SQ': { en: 'Block Inc.', ar: 'بلوك', fr: 'Block Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'SHOP': { en: 'Shopify Inc.', ar: 'شوبيفاي', fr: 'Shopify Inc.', exchange: 'NYSE', sector: 'Technology', country: 'CA' },
  'SNAP': { en: 'Snap Inc.', ar: 'سناب', fr: 'Snap Inc.', exchange: 'NYSE', sector: 'Communication Services', country: 'US' },
  'PIN': { en: 'Pinterest Inc.', ar: 'بينتريست', fr: 'Pinterest Inc.', exchange: 'NYSE', sector: 'Communication Services', country: 'US' },
  'ROKU': { en: 'Roku Inc.', ar: 'روكو', fr: 'Roku Inc.', exchange: 'NASDAQ', sector: 'Communication Services', country: 'US' },
  'ZM': { en: 'Zoom Video Communications', ar: 'زوم', fr: 'Zoom Video Communications', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'DOCU': { en: 'DocuSign Inc.', ar: 'دوكو ساين', fr: 'DocuSign Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'OKTA': { en: 'Okta Inc.', ar: 'أوكتا', fr: 'Okta Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'CRWD': { en: 'CrowdStrike Holdings Inc.', ar: 'كراود سترايك', fr: 'CrowdStrike Holdings Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'SNOW': { en: 'Snowflake Inc.', ar: 'سنوفليك', fr: 'Snowflake Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'PLTR': { en: 'Palantir Technologies Inc.', ar: 'بالانتير', fr: 'Palantir Technologies Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'COIN': { en: 'Coinbase Global Inc.', ar: 'كوينبيس', fr: 'Coinbase Global Inc.', exchange: 'NASDAQ', sector: 'Financials', country: 'US' },
  'RBLX': { en: 'Roblox Corporation', ar: 'روبلوكس', fr: 'Roblox Corporation', exchange: 'NYSE', sector: 'Communication Services', country: 'US' },
  'ABNB': { en: 'Airbnb Inc.', ar: 'إير بي إن بي', fr: 'Airbnb Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'RIVN': { en: 'Rivian Automotive Inc.', ar: 'ريفيان', fr: 'Rivian Automotive Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'LCID': { en: 'Lucid Group Inc.', ar: 'لوسيد', fr: 'Lucid Group Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'NIO': { en: 'NIO Inc.', ar: 'إن آي أو', fr: 'NIO Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'XPEV': { en: 'XPeng Inc.', ar: 'إكس بيانغ', fr: 'XPeng Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'LI': { en: 'Li Auto Inc.', ar: 'لي أوتو', fr: 'Li Auto Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'CN' },
  'BABA': { en: 'Alibaba Group Holding', ar: 'علي بابا', fr: 'Alibaba Group Holding', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'JD': { en: 'JD.com Inc.', ar: 'جي دي كوم', fr: 'JD.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'CN' },
  'PDD': { en: 'PDD Holdings Inc.', ar: 'بي دي دي', fr: 'PDD Holdings Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'CN' },
  'NTES': { en: 'NetEase Inc.', ar: 'نت إيز', fr: 'NetEase Inc.', exchange: 'NASDAQ', sector: 'Communication Services', country: 'CN' },
  'TCEHY': { en: 'Tencent Holdings Ltd.', ar: 'تنسنت', fr: 'Tencent Holdings Ltd.', exchange: 'OTC', sector: 'Communication Services', country: 'CN' },
  'SE': { en: 'Sea Limited', ar: 'سي ليمتد', fr: 'Sea Limited', exchange: 'NYSE', sector: 'Technology', country: 'SG' },
  'GRAB': { en: 'Grab Holdings Ltd.', ar: 'جراب', fr: 'Grab Holdings Ltd.', exchange: 'NASDAQ', sector: 'Technology', country: 'SG' },
  'MSTR': { en: 'MicroStrategy Inc.', ar: 'مايكرو ستراتيجي', fr: 'MicroStrategy Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MARA': { en: 'Marathon Digital Holdings', ar: 'ماراثون ديجيتال', fr: 'Marathon Digital Holdings', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'RIOT': { en: 'Riot Platforms Inc.', ar: 'ريوت بلاتفورمز', fr: 'Riot Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'LLY': { en: 'Eli Lilly and Company', ar: 'إيلي ليلي', fr: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare', country: 'US' },
  'NVO': { en: 'Novo Nordisk A/S', ar: 'نوفو نورديسك', fr: 'Novo Nordisk A/S', exchange: 'NYSE', sector: 'Healthcare', country: 'DK' },
  'AZN': { en: 'AstraZeneca PLC', ar: 'أسترا زينيكا', fr: 'AstraZeneca PLC', exchange: 'NYSE', sector: 'Healthcare', country: 'GB' },
  'ROCHE': { en: 'Roche Holding AG', ar: 'روش', fr: 'Roche Holding AG', exchange: 'OTC', sector: 'Healthcare', country: 'CH' },
  'NVS': { en: 'Novartis AG', ar: 'نوفارتس', fr: 'Novartis AG', exchange: 'NYSE', sector: 'Healthcare', country: 'CH' },
  'SNY': { en: 'Sanofi S.A.', ar: 'سانوفي', fr: 'Sanofi S.A.', exchange: 'NYSE', sector: 'Healthcare', country: 'FR' },
  'MRNA': { en: 'Moderna Inc.', ar: 'موديرنا', fr: 'Moderna Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'BNTX': { en: 'BioNTech SE', ar: 'بايو إن تك', fr: 'BioNTech SE', exchange: 'NASDAQ', sector: 'Healthcare', country: 'DE' },
  'GILD': { en: 'Gilead Sciences Inc.', ar: 'جيلياد ساينسز', fr: 'Gilead Sciences Inc.', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'VRTX': { en: 'Vertex Pharmaceuticals', ar: 'فيرتكس فارماسيوتيكالز', fr: 'Vertex Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', country: 'US' },
  'DELL': { en: 'Dell Technologies Inc.', ar: 'ديل تكنولوجيز', fr: 'Dell Technologies Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'HPQ': { en: 'HP Inc.', ar: 'إتش بي', fr: 'HP Inc.', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'HPE': { en: 'Hewlett Packard Enterprise', ar: 'هيوليت باكارد إنتربرايز', fr: 'Hewlett Packard Enterprise', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'IBM': { en: 'International Business Machines', ar: 'آي بي إم', fr: 'International Business Machines', exchange: 'NYSE', sector: 'Technology', country: 'US' },
  'MU': { en: 'Micron Technology Inc.', ar: 'مايكرون تكنولوجي', fr: 'Micron Technology Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'LRCX': { en: 'Lam Research Corporation', ar: 'لام ريسيرتش', fr: 'Lam Research Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'AMAT': { en: 'Applied Materials Inc.', ar: 'أبلايد ماتيريالز', fr: 'Applied Materials Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'KLAC': { en: 'KLA Corporation', ar: 'كي إل إيه', fr: 'KLA Corporation', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MRVL': { en: 'Marvell Technology Inc.', ar: 'مارفل تكنولوجي', fr: 'Marvell Technology Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'ON': { en: 'ON Semiconductor Corp.', ar: 'أون سيميكونداكتور', fr: 'ON Semiconductor Corp.', exchange: 'NASDAQ', sector: 'Technology', country: 'US' },
  'MCD': { en: "McDonald's Corporation", ar: 'ماكدونالدز', fr: "McDonald's Corporation", exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'SBUX': { en: 'Starbucks Corporation', ar: 'ستاربكس', fr: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'CMG': { en: 'Chipotle Mexican Grill', ar: 'تشيبوتلي', fr: 'Chipotle Mexican Grill', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'YUM': { en: 'Yum! Brands Inc.', ar: 'يوم براندز', fr: 'Yum! Brands Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'DPZ': { en: "Domino's Pizza Inc.", ar: 'دومينوز بيتزا', fr: "Domino's Pizza Inc.", exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'US' },
  'LULU': { en: 'Lululemon Athletica Inc.', ar: 'لولوليمون', fr: 'Lululemon Athletica Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'CA' },
  'TGT': { en: 'Target Corporation', ar: 'تارغيت', fr: 'Target Corporation', exchange: 'NYSE', sector: 'Consumer Defensive', country: 'US' },
  'DLTR': { en: 'Dollar Tree Inc.', ar: 'دولار تري', fr: 'Dollar Tree Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive', country: 'US' },
  'DG': { en: 'Dollar General Corporation', ar: 'دولار جنرال', fr: 'Dollar General Corporation', exchange: 'NYSE', sector: 'Consumer Defensive', country: 'US' },
  'FIVE': { en: 'Five Below Inc.', ar: 'فايف بي لو', fr: 'Five Below Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', country: 'US' },
  'CAT': { en: 'Caterpillar Inc.', ar: 'كاتربيلر', fr: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'DE': { en: 'Deere & Company', ar: 'دير آند كومباني', fr: 'Deere & Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'BA': { en: 'The Boeing Company', ar: 'بوينغ', fr: 'The Boeing Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'LMT': { en: 'Lockheed Martin Corporation', ar: 'لوكهيد مارتن', fr: 'Lockheed Martin Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'RTX': { en: 'RTX Corporation', ar: 'آر تي إكس', fr: 'RTX Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'NOC': { en: 'Northrop Grumman Corporation', ar: 'نورثروب غرومان', fr: 'Northrop Grumman Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'GD': { en: 'General Dynamics Corporation', ar: 'جنرال دايناميكس', fr: 'General Dynamics Corporation', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'GE': { en: 'GE Aerospace', ar: 'جنرال إلكتريك', fr: 'GE Aerospace', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'MMM': { en: '3M Company', ar: 'ثري إم', fr: '3M Company', exchange: 'NYSE', sector: 'Industrials', country: 'US' },
  'HON': { en: 'Honeywell International Inc.', ar: 'هانيويل', fr: 'Honeywell International Inc.', exchange: 'NASDAQ', sector: 'Industrials', country: 'US' },
  // Additional European
  'AIR.PA': { en: 'Airbus SE', ar: 'إيرباص', fr: 'Airbus SE', exchange: 'Euronext Paris', sector: 'Industrials', country: 'FR' },
  'ALO.PA': { en: 'Alstom SA', ar: 'ألستوم', fr: 'Alstom SA', exchange: 'Euronext Paris', sector: 'Industrials', country: 'FR' },
  'BN.PA': { en: 'Danone SA', ar: 'دانون', fr: 'Danone SA', exchange: 'Euronext Paris', sector: 'Consumer Defensive', country: 'FR' },
  'ENGI.PA': { en: 'Engie SA', ar: 'إنجي', fr: 'Engie SA', exchange: 'Euronext Paris', sector: 'Utilities', country: 'FR' },
  'WLN.PA': { en: 'Worldline SA', ar: 'وورلدلاين', fr: 'Worldline SA', exchange: 'Euronext Paris', sector: 'Technology', country: 'FR' },
  'STLA.PA': { en: 'Stellantis N.V.', ar: 'ستيلانتس', fr: 'Stellantis N.V.', exchange: 'Euronext Paris', sector: 'Consumer Cyclical', country: 'NL' },
  'HO.PA': { en: 'Thales SA', ar: 'تاليس', fr: 'Thales SA', exchange: 'Euronext Paris', sector: 'Industrials', country: 'FR' },
  'KRNY.PA': { en: 'Kering SA', ar: 'كيرينغ', fr: 'Kering SA', exchange: 'Euronext Paris', sector: 'Consumer Cyclical', country: 'FR' },
  'ACA.PA': { en: 'Crédit Agricole SA', ar: 'كريدي أغريكول', fr: 'Crédit Agricole SA', exchange: 'Euronext Paris', sector: 'Financials', country: 'FR' },
  'DSY.PA': { en: 'Dassault Systèmes SE', ar: 'داسو سيستيمز', fr: 'Dassault Systèmes SE', exchange: 'Euronext Paris', sector: 'Technology', country: 'FR' },
  'AIR.DE': { en: 'Airbnb Inc. (DE listing)', ar: 'إير بي إن بي', fr: 'Airbnb Inc. (DE)', exchange: 'XETRA', sector: 'Consumer Cyclical', country: 'US' },
  'RWE.DE': { en: 'RWE AG', ar: 'آر دبليو إي', fr: 'RWE AG', exchange: 'XETRA', sector: 'Utilities', country: 'DE' },
  'HEI.DE': { en: 'Heidelberg Materials AG', ar: 'هايدلبرغ ماتيريالز', fr: 'Heidelberg Materials AG', exchange: 'XETRA', sector: 'Basic Materials', country: 'DE' },
  'FRE.DE': { en: 'Fresenius SE & Co.', ar: 'فريزينيوس', fr: 'Fresenius SE & Co.', exchange: 'XETRA', sector: 'Healthcare', country: 'DE' },
  'SHL.DE': { en: 'Siemens Healthineers AG', ar: 'سيمنز هيلثينيرز', fr: 'Siemens Healthineers AG', exchange: 'XETRA', sector: 'Healthcare', country: 'DE' },
  'QIA.DE': { en: 'Qiagen N.V.', ar: 'كياجين', fr: 'Qiagen N.V.', exchange: 'XETRA', sector: 'Healthcare', country: 'DE' },
  'BOSS.DE': { en: 'Hugo Boss AG', ar: 'هوغو بوس', fr: 'Hugo Boss AG', exchange: 'XETRA', sector: 'Consumer Cyclical', country: 'DE' },
  'AZM.L': { en: 'AZN Holdings plc', ar: 'إيه زد إن', fr: 'AZN Holdings plc', exchange: 'LSE', sector: 'Financials', country: 'GB' },
  'HLN.L': { en: 'Haleon plc', ar: 'هاليون', fr: 'Haleon plc', exchange: 'LSE', sector: 'Healthcare', country: 'GB' },
  'LSEG.L': { en: 'London Stock Exchange Group', ar: 'مجموعة بورصة لندن', fr: 'London Stock Exchange Group', exchange: 'LSE', sector: 'Financials', country: 'GB' },
  'SGE.L': { en: 'Sage Group plc', ar: 'سيدج غروب', fr: 'Sage Group plc', exchange: 'LSE', sector: 'Technology', country: 'GB' },
  'PSN.L': { en: 'Persimmon plc', ar: 'بيرسيمون', fr: 'Persimmon plc', exchange: 'LSE', sector: 'Consumer Cyclical', country: 'GB' },
  'PRU.L': { en: 'Prudential plc', ar: 'برودنشال', fr: 'Prudential plc', exchange: 'LSE', sector: 'Financials', country: 'GB' },
  'DCC.L': { en: 'DCC plc', ar: 'دي سي سي', fr: 'DCC plc', exchange: 'LSE', sector: 'Energy', country: 'GB' },
  'SVT.L': { en: 'Severn Trent plc', ar: 'سفرن ترنت', fr: 'Severn Trent plc', exchange: 'LSE', sector: 'Utilities', country: 'GB' },
  'SMDS.L': { en: 'DS Smith plc', ar: 'دي إس سميث', fr: 'DS Smith plc', exchange: 'LSE', sector: 'Basic Materials', country: 'GB' },
  'CPG.L': { en: 'Compass Group plc', ar: 'كومباس غروب', fr: 'Compass Group plc', exchange: 'LSE', sector: 'Consumer Cyclical', country: 'GB' },
  // Additional Asia
  '005930.KS': { en: 'Samsung Electronics Co.', ar: 'سامسونغ للإلكترونيات', fr: 'Samsung Electronics Co.', exchange: 'KRX', sector: 'Technology', country: 'KR' },
  '000660.KS': { en: 'SK Hynix Inc.', ar: 'إس كيه هاينيكس', fr: 'SK Hynix Inc.', exchange: 'KRX', sector: 'Technology', country: 'KR' },
  '373220.KS': { en: 'LX Semicon Co.', ar: 'إل إكس سيميكونداكتور', fr: 'LX Semicon Co.', exchange: 'KRX', sector: 'Technology', country: 'KR' },
  '207940.KS': { en: 'Samsung Biologics Co.', ar: 'سامسونغ بايولوجيكس', fr: 'Samsung Biologics Co.', exchange: 'KRX', sector: 'Healthcare', country: 'KR' },
  '068270.KS': { en: 'Celltrion Inc.', ar: 'سيلتريون', fr: 'Celltrion Inc.', exchange: 'KRX', sector: 'Healthcare', country: 'KR' },
  '7201.T': { en: 'Nissan Motor Co.', ar: 'نيسان', fr: 'Nissan Motor Co.', exchange: 'TSE', sector: 'Consumer Cyclical', country: 'JP' },
  '6702.T': { en: 'Fujitsu Limited', ar: 'فوجيتسو', fr: 'Fujitsu Limited', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '6753.T': { en: 'Sharp Corporation', ar: 'شارب', fr: 'Sharp Corporation', exchange: 'TSE', sector: 'Technology', country: 'JP' },
  '9020.T': { en: 'East Japan Railway Company', ar: 'شركة شرق اليابان للسكك الحديدية', fr: 'East Japan Railway Company', exchange: 'TSE', sector: 'Industrials', country: 'JP' },
  '8766.T': { en: 'Mizuho Financial Group', ar: 'ميزوهو المالية', fr: 'Mizuho Financial Group', exchange: 'TSE', sector: 'Financials', country: 'JP' },
  'BIDU': { en: 'Baidu Inc.', ar: 'بايدو', fr: 'Baidu Inc.', exchange: 'NASDAQ', sector: 'Technology', country: 'CN' },
  'FUTU': { en: 'Futu Holdings Limited', ar: 'فوتو القابضة', fr: 'Futu Holdings Limited', exchange: 'NASDAQ', sector: 'Financials', country: 'CN' },
  'TME': { en: 'Tencent Music Entertainment', ar: 'تيوسنت ميوزيك', fr: 'Tencent Music Entertainment', exchange: 'NYSE', sector: 'Communication Services', country: 'CN' },
  'IQ': { en: 'iQIYI Inc.', ar: 'آي تشي يي', fr: 'iQIYI Inc.', exchange: 'NASDAQ', sector: 'Communication Services', country: 'CN' },
  'VIPS': { en: 'Vipshop Holdings Ltd.', ar: 'فيب شوب', fr: 'Vipshop Holdings Ltd.', exchange: 'NYSE', sector: 'Consumer Cyclical', country: 'CN' },
  'INFY': { en: 'Infosys Limited', ar: 'إنفوسيس', fr: 'Infosys Limited', exchange: 'NYSE', sector: 'Technology', country: 'IN' },
  'WIT': { en: 'Wipro Limited', ar: 'ويبرو', fr: 'Wipro Limited', exchange: 'NYSE', sector: 'Technology', country: 'IN' },
  'HDB': { en: 'HDFC Bank Limited', ar: 'بنك إتش دي إف سي', fr: 'HDFC Bank Limited', exchange: 'NYSE', sector: 'Financials', country: 'IN' },
  'IBN': { en: 'ICICI Bank Limited', ar: 'بنك آيسيسي', fr: 'ICICI Bank Limited', exchange: 'NYSE', sector: 'Financials', country: 'IN' },
  'SEA': { en: 'Sea Limited', ar: 'سي ليمتد', fr: 'Sea Limited', exchange: 'NYSE', sector: 'Technology', country: 'SG' },
  'GCPEF': { en: 'GCL Poly Energy', ar: 'جي سي إل بولي', fr: 'GCL Poly Energy', exchange: 'OTC', sector: 'Energy', country: 'CN' },
  'BYDDF': { en: 'BYD Company Limited', ar: 'بي واي دي', fr: 'BYD Company Limited', exchange: 'OTC', sector: 'Consumer Cyclical', country: 'CN' },
  'ACLTF': { en: 'Alamos Gold Inc.', ar: 'ألاموس غولد', fr: 'Alamos Gold Inc.', exchange: 'OTC', sector: 'Basic Materials', country: 'CA' },
  'SSRM': { en: 'SSR Mining Inc.', ar: 'إس إس آر ماينينغ', fr: 'SSR Mining Inc.', exchange: 'NASDAQ', sector: 'Basic Materials', country: 'CA' },
  'AEM': { en: 'Agnico Eagle Mines Limited', ar: 'أغنيكو إيغل', fr: 'Agnico Eagle Mines Limited', exchange: 'NYSE', sector: 'Basic Materials', country: 'CA' },
  'KL': { en: 'Kirkland Lake Gold Ltd.', ar: 'كيركلاند ليك غولد', fr: 'Kirkland Lake Gold Ltd.', exchange: 'NYSE', sector: 'Basic Materials', country: 'CA' },
  'GOLD': { en: 'Barrick Gold Corporation', ar: 'باريك غولد', fr: 'Barrick Gold Corporation', exchange: 'NYSE', sector: 'Basic Materials', country: 'CA' },
  '601398.SS': { en: 'Industrial and Commercial Bank of China', ar: 'البنك الصناعي والتجاري الصيني', fr: 'ICBC', exchange: 'SSE', sector: 'Financials', country: 'CN' },
  '600519.SS': { en: 'Kweichow Moutai Co.', ar: 'كويشو موتاي', fr: 'Kweichow Moutai Co.', exchange: 'SSE', sector: 'Consumer Defensive', country: 'CN' },
  '601318.SS': { en: 'Ping An Insurance', ar: 'بينغ آن للتأمين', fr: 'Ping An Insurance', exchange: 'SSE', sector: 'Financials', country: 'CN' },
  '600036.SS': { en: 'China Merchants Bank', ar: 'بنك التجار الصيني', fr: 'China Merchants Bank', exchange: 'SSE', sector: 'Financials', country: 'CN' },
  '601988.SS': { en: 'Bank of China Limited', ar: 'بنك الصين', fr: 'Bank of China Limited', exchange: 'SSE', sector: 'Financials', country: 'CN' },
  'HINDALCO.NS': { en: 'Hindalco Industries Ltd.', ar: 'هيندالكو إندستريز', fr: 'Hindalco Industries Ltd.', exchange: 'NSE', sector: 'Basic Materials', country: 'IN' },
  'RELIANCE.NS': { en: 'Reliance Industries Ltd.', ar: 'ريلايانس إندستريز', fr: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy', country: 'IN' },
  'TCS.NS': { en: 'Tata Consultancy Services', ar: 'تاتا لخدمات الاستشارات', fr: 'Tata Consultancy Services', exchange: 'NSE', sector: 'Technology', country: 'IN' },
  'INFY.NS': { en: 'Infosys Limited', ar: 'إنفوسيس', fr: 'Infosys Limited', exchange: 'NSE', sector: 'Technology', country: 'IN' },
  'BAJFINANCE.NS': { en: 'Bajaj Finance Ltd.', ar: 'باجاج فاينانس', fr: 'Bajaj Finance Ltd.', exchange: 'NSE', sector: 'Financials', country: 'IN' },
  // Major ETFs
  'SPY': { en: 'SPDR S&P 500 ETF Trust', ar: 'صندوق إس بي دي آر إس آند بي 500', fr: 'SPDR S&P 500 ETF Trust', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'QQQ': { en: 'Invesco QQQ Trust', ar: 'صندوق إنفيسكو كيو كيو كيو', fr: 'Invesco QQQ Trust', exchange: 'NASDAQ', sector: 'ETF', country: 'US' },
  'IWM': { en: 'iShares Russell 2000 ETF', ar: 'صندوق آي شارز راسل 2000', fr: 'iShares Russell 2000 ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'DIA': { en: 'SPDR Dow Jones Industrial Average ETF', ar: 'صندوق داو جونز', fr: 'SPDR Dow Jones Industrial Average ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'VTI': { en: 'Vanguard Total Stock Market ETF', ar: 'صندوق فانغوارد الشامل', fr: 'Vanguard Total Stock Market ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'VEA': { en: 'Vanguard FTSE Developed Markets ETF', ar: 'صندوق فانغوارد للأسواق المتقدمة', fr: 'Vanguard FTSE Developed Markets ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'VWO': { en: 'Vanguard FTSE Emerging Markets ETF', ar: 'صندوق فانغوارد للأسواق الناشئة', fr: 'Vanguard FTSE Emerging Markets ETF', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'BND': { en: 'Vanguard Total Bond Market ETF', ar: 'صندوق فانغوارد للسندات', fr: 'Vanguard Total Bond Market ETF', exchange: 'NASDAQ', sector: 'ETF', country: 'US' },
  'TLT': { en: 'iShares 20+ Year Treasury Bond ETF', ar: 'صندوق آي شارز للسندات طويلة الأجل', fr: 'iShares 20+ Year Treasury Bond ETF', exchange: 'NASDAQ', sector: 'ETF', country: 'US' },
  'GLD': { en: 'SPDR Gold Shares', ar: 'صندوق إس بي دي آر للذهب', fr: 'SPDR Gold Shares', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'SLV': { en: 'iShares Silver Trust', ar: 'صندوق آي شارز للفضة', fr: 'iShares Silver Trust', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'USO': { en: 'United States Oil Fund LP', ar: 'صندوق النفط الأمريكي', fr: 'United States Oil Fund LP', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLF': { en: 'Financial Select Sector SPDR Fund', ar: 'صندوق القطاع المالي', fr: 'Financial Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLE': { en: 'Energy Select Sector SPDR Fund', ar: 'صندوق قطاع الطاقة', fr: 'Energy Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLK': { en: 'Technology Select Sector SPDR Fund', ar: 'صندوق قطاع التكنولوجيا', fr: 'Technology Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLV': { en: 'Health Care Select Sector SPDR Fund', ar: 'صندوق قطاع الرعاية الصحية', fr: 'Health Care Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLY': { en: 'Consumer Discretionary Select Sector SPDR', ar: 'صندوق قطاع السلع التقديرية', fr: 'Consumer Discretionary Select Sector SPDR', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLP': { en: 'Consumer Staples Select Sector SPDR Fund', ar: 'صندوق قطاع السلع الأساسية', fr: 'Consumer Staples Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLI': { en: 'Industrial Select Sector SPDR Fund', ar: 'صندوق القطاع الصناعي', fr: 'Industrial Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
  'XLU': { en: 'Utilities Select Sector SPDR Fund', ar: 'صندوق قطاع المرافق', fr: 'Utilities Select Sector SPDR Fund', exchange: 'AMEX', sector: 'ETF', country: 'US' },
};

// ─── AI Prompt Templates ──────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are an expert financial analyst writing for a global financial news platform. Analyze the given stock data and provide a comprehensive analysis in English.

STRICT RULES:
- Use ONLY the price data provided in the prompt. Do NOT invent or guess different prices.
- Reference the company's ACTUAL sector and core products/services by name (e.g., AWS for Amazon, iPhone for Apple, Azure for Microsoft, GPU/H100 for NVIDIA).
- NEVER mention another company's products in a different company's analysis (e.g., do NOT say "AirPods" when discussing Amazon).
- NEVER use generic phrases like "produces smart products" or "leverages AI technology" as the main justification.
- Price targets MUST be realistic relative to the current price (e.g., 10-30% range, NOT 500%+).
- Vary your sentence structure — do NOT use the same sentence pattern for different sections.

Include:
1. Executive Summary (2-3 sentences, company-specific)
2. Technical Analysis (trend, support/resistance, key indicators)
3. Fundamental Snapshot (P/E, EPS, market cap context — use provided data)
4. Market Outlook (bullish/bearish scenario with REALISTIC price targets)
5. Risk Assessment (company-specific risks, not generic)

DISCLAIMER: This analysis is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results.`,

  ar: `أنت محلل مالي خبير تكتب لمنصة أخبار مالية عالمية. قم بتحليل بيانات السهم المقدمة وقدم تحليلاً شاملاً باللغة العربية.

قواعد صارمة:
- استخدم فقط بيانات السعر المقدمة في الطلب. لا تخترع أسعاراً مختلفة.
- اذكر قطاع الشركة الفعلي ومنتجها/خدمتها الأساسية بالاسم (مثلاً: AWS لأمازون، iPhone لأبل، Azure لمايكروسوفت، GPU/H100 لإنفيديا).
- لا تذكر أبداً منتجات شركة أخرى في تحليل شركة مختلفة (مثلاً: لا تقل "إير بودز" عند الحديث عن أمازون).
- لا تستخدم عبارات عامة مثل "تنتج منتجات ذكية" أو "تعتمد على الذكاء الاصطناعي" كتبرير رئيسي.
- يجب أن يكون السعر المستهدف واقعياً مقارنة بالسعر الحالي (مثلاً: نطاق 10-30%، وليس 500%+).
- نوّع في بنية الجمل — لا تستخدم نفس نمط الجملة لأقسام مختلفة.

تضمين:
1. الملخص التنفيذي (2-3 جمل، مخصص للشركة)
2. التحليل الفني (الاتجاه، الدعم/المقاومة، المؤشرات الرئيسية)
3. لمحة أساسية (نسبة السعر/الأرباح، ربحية السهم، القيمة السوقية — استخدم البيانات المقدمة)
4. التوقعات السوقية (السيناريو الصعودي/الهبوطي مع أسعار مستهدفة واقعية)
5. تقييم المخاطر (مخاطر محددة للشركة، وليس عامة)

تنويه: هذا التحليل لأغراض إعلامية فقط ولا يُعتبر استشارة مالية. الأداء السابق ليس مؤشراً على النتائج المستقبلية.`,

  fr: `Vous êtes un analyste financier expert écrivant pour une plateforme d'information financière mondiale. Analysez les données boursières fournies et fournissez une analyse complète en français.

RÈGLES STRICTES:
- Utilisez UNIQUEMENT les données de prix fournies dans le prompt. N'inventez PAS de prix différents.
- Mentionnez le secteur RÉEL de l'entreprise et ses produits/services principaux par leur nom (ex: AWS pour Amazon, iPhone pour Apple, Azure pour Microsoft, GPU/H100 pour NVIDIA).
- Ne mentionnez JAMAIS les produits d'une autre entreprise dans l'analyse d'une entreprise différente.
- N'utilisez JAMAIS des phrases génériques comme "produit des produits intelligents" ou "exploite l'IA" comme justification principale.
- Les objectifs de prix doivent être réalistes par rapport au prix actuel (ex: fourchette de 10-30%, PAS 500%+).
- Variez la structure de vos phrases — n'utilisez PAS le même modèle de phrase pour différentes sections.

Inclure:
1. Résumé exécutif (2-3 phrases, spécifique à l'entreprise)
2. Analyse technique (tendance, support/résistance, indicateurs clés)
3. Aperçu fondamental (P/E, BPA, capitalisation boursière — utilisez les données fournies)
4. Perspectives du marché (scénario haussier/baissier avec objectifs de prix RÉALISTES)
5. Évaluation des risques (risques spécifiques à l'entreprise, pas génériques)

AVERTISSEMENT: Cette analyse est fournie à titre informatif uniquement et ne constitue pas un conseil financier. Les performances passées ne sont pas indicatives des résultats futurs.`,

  tr: `Uzman bir finans analisti olarak küresel bir finans haber platformu için yazıyorsunuz. Sağlanan hisse senedi verilerini analiz edin ve Türkçe kapsamlı bir analiz sunun.

KATI KURALLAR:
- Yalnızca promptta sağlanan fiyat verilerini kullanın. Farklı fiyatlar uydurmayın veya tahmin etmeyin.
- Şirketin GERÇEK sektörünü ve temel ürün/hizmetlerini adıyla belirtin (örn: Amazon için AWS, Apple için iPhone, Microsoft için Azure, NVIDIA için GPU/H100).
- Başka bir şirketin ürünlerini farklı bir şirketin analizinde ASLA belirtmeyin.
- "Akıllı ürünler üretiyor" veya "YZ'den yararlanıyor" gibi genel ifadeleri ana gerekçe olarak ASLA kullanmayın.
- Fiyat hedefleri mevcut fiyata göre gerçekçi olmalıdır (örn: %10-30 aralığı, %500+ DEĞİL).
- Cümle yapınızı çeşitlendirin — farklı bölümler için aynı cümle kalıbını kullanmayın.

İçerik:
1. Yönetici Özeti (2-3 cümle, şirkete özel)
2. Teknik Analiz (trend, destek/direnç, temel göstergeler)
3. Temel Gösterge (F/K oranı, hisse başına kazanç, piyasa değeri — sağlanan verileri kullanın)
4. Piyasa Görünümü (gerçekçi fiyat hedefleriyle yükseliş/düşüş senaryosu)
5. Risk Değerlendirmesi (şirkete özel riskler, genel değil)

UYARI: Bu analiz yalnızca bilgilendirme amaçlıdır ve finansal tavaye oluşturmaz. Geçmiş performans gelecek sonuçların göstergesi değildir.`,

  es: `Eres un analista financiero experto que escribe para una plataforma global de noticias financieras. Analiza los datos bursátiles proporcionados y ofrece un análisis completo en español.

REGLAS ESTRICTAS:
- Usa SOLAMENTE los datos de precios proporcionados en el prompt. NO inventes precios diferentes.
- Menciona el sector REAL de la empresa y sus productos/servicios principales por su nombre (ej: AWS para Amazon, iPhone para Apple, Azure para Microsoft, GPU/H100 para NVIDIA).
- NUNCA menciones los productos de otra empresa en el análisis de una empresa diferente.
- NUNCA uses frases genéricas como "produce productos inteligentes" o "apalancamiento de IA" como justificación principal.
- Los objetivos de precio deben ser realistas en relación con el precio actual (ej: rango de 10-30%, NO 500%+).
- Varía la estructura de tus frases — NO uses el mismo patrón de frase para diferentes secciones.

Incluir:
1. Resumen Ejecutivo (2-3 frases, específico de la empresa)
2. Análisis Técnico (tendencia, soporte/resistencia, indicadores clave)
3. Perspectiva Fundamental (PER, BPA, capitalización de mercado — usa los datos proporcionados)
4. Pronóstico de Mercado (escenario alcista/bajista con objetivos de precio REALISTAS)
5. Evaluación de Riesgos (riesgos específicos de la empresa, no genéricos)

AVISO LEGAL: Este análisis es meramente informativo y no constituye asesoramiento financiero. El rendimiento pasado no es indicativo de resultados futuros.`,
};

// ─── Helper: Select Symbols Based on Locale ───────────────────

export function selectSymbolsForLocale(locale: 'en' | 'ar' | 'fr' | 'tr' | 'es', maxStocks: number): string[] {
  // Strategy: Use FMP-verified symbols as primary pool for maximum success.
  // International symbols are added as bonus but will be skipped if they fail.
  // We select MORE symbols than needed to compensate for any failures.
  let primarySymbols: string[];
  let bonusSymbols: string[];

  switch (locale) {
    case 'en':
      primarySymbols = [...FMP_VERIFIED_SYMBOLS];
      bonusSymbols = [...TOP_CAC40_SYMBOLS, ...TOP_DAX_SYMBOLS, ...MAJOR_ETFS];
      break;
    case 'ar':
      primarySymbols = [...FMP_VERIFIED_SYMBOLS];
      bonusSymbols = [...TOP_TADAWUL_SYMBOLS, ...MAJOR_ETFS];
      break;
    case 'fr':
      primarySymbols = [...TOP_CAC40_SYMBOLS, ...TOP_DAX_SYMBOLS];
      bonusSymbols = [...FMP_VERIFIED_SYMBOLS.slice(0, 15), ...MAJOR_ETFS];
      break;
    case 'tr':
      // Turkish: Focus on BIST-like global symbols + European exposure
      primarySymbols = [...FMP_VERIFIED_SYMBOLS];
      bonusSymbols = [...TOP_CAC40_SYMBOLS, ...TOP_DAX_SYMBOLS, ...TOP_FTSE_SYMBOLS, ...MAJOR_ETFS];
      break;
    case 'es':
      // Spanish: Focus on global + Latin American exposure
      primarySymbols = [...FMP_VERIFIED_SYMBOLS];
      bonusSymbols = [...TOP_CAC40_SYMBOLS, ...TOP_DAX_SYMBOLS, ...MAJOR_ETFS];
      break;
    default:
      primarySymbols = [...FMP_VERIFIED_SYMBOLS];
      bonusSymbols = [];
  }

  // Shuffle both pools
  const shuffledPrimary = primarySymbols.sort(() => Math.random() - 0.5);
  const shuffledBonus = bonusSymbols.sort(() => Math.random() - 0.5);

  // Take maxStocks from primary first, then fill remaining from bonus
  const primaryCount = Math.min(maxStocks, shuffledPrimary.length);
  const bonusCount = Math.min(maxStocks - primaryCount, shuffledBonus.length);

  return [
    ...shuffledPrimary.slice(0, primaryCount),
    ...shuffledBonus.slice(0, bonusCount),
  ];
}

// ─── Helper: Calculate Confidence Score ───────────────────────

export function calculateConfidence(
  quote: QuoteData | null,
  techAnalysis: TechnicalAnalysisResult
): number {
  let confidence = 40; // Lower base to avoid inflation

  // Quote data quality
  if (quote) {
    if (quote.price > 0) confidence += 8;
    if (quote.volume > 100000) confidence += 5;       // meaningful volume
    else if (quote.volume > 0) confidence += 2;
    if (quote.changePercent !== 0) confidence += 3;
    if (quote.high > 0 && quote.low > 0) confidence += 4; // full OHLCV
  } else {
    confidence -= 15; // No quote = much less reliable
  }

  // Technical analysis signal strength - scale based on how clear the signal is
  const signalStrength = Math.abs(techAnalysis.overallScore);
  if (signalStrength > 50) confidence += 8;
  else if (signalStrength > 25) confidence += 4;
  else confidence += 1; // Weak signal = low confidence boost

  // Trend strength
  if (techAnalysis.trend.strength > 70) confidence += 8;
  else if (techAnalysis.trend.strength > 40) confidence += 4;
  else confidence += 1;

  // Number of support/resistance levels (more = more data = higher confidence)
  const levelCount = techAnalysis.supportLevels.length + techAnalysis.resistanceLevels.length;
  if (levelCount >= 4) confidence += 5;
  else if (levelCount >= 2) confidence += 3;

  // Trade setup quality
  if (techAnalysis.tradeSetup.direction !== 'wait') {
    if (techAnalysis.tradeSetup.riskRewardRatio >= 2.5) confidence += 5;
    else if (techAnalysis.tradeSetup.riskRewardRatio >= 1.5) confidence += 3;
  } else {
    confidence -= 3; // No clear trade setup = less confidence
  }

  // Cap at 25-85 range to avoid unrealistic 95% scores
  return Math.max(25, Math.min(85, confidence));
}

// ─── Helper: Determine Market Type from Symbol ────────────────

function getMarketType(symbol: string): 'sp500' | 'cac40' | 'tadawul' | 'dax' | 'ftse' | 'nikkei' | 'korean' | 'etf' | 'indian' | 'chinese' {
  if (symbol.endsWith('.SR')) return 'tadawul';
  if (symbol.endsWith('.PA')) return 'cac40';
  if (symbol.endsWith('.DE')) return 'dax';
  if (symbol.endsWith('.L')) return 'ftse';
  if (symbol.endsWith('.T')) return 'nikkei';
  if (symbol.endsWith('.KS')) return 'korean';
  if (symbol.endsWith('.NS')) return 'indian';
  if (symbol.endsWith('.SS')) return 'chinese';
  if (['SPY','QQQ','IWM','DIA','VTI','VEA','VWO','BND','TLT','GLD','SLV','USO','XLF','XLE','XLK','XLV','XLY','XLP','XLI','XLU'].includes(symbol)) return 'etf';
  return 'sp500';
}

// ─── Helper: Get Company Name for Locale ──────────────────────

function getCompanyName(symbol: string, locale: 'en' | 'ar' | 'fr' | 'tr' | 'es'): string {
  const info = COMPANY_NAMES[symbol];
  if (!info) return symbol;
  switch (locale) {
    case 'ar': return info.ar || info.en;
    case 'fr': return info.fr || info.en;
    case 'tr': return info.en; // Turkish uses English company names
    case 'es': return info.en; // Spanish uses English company names
    default: return info.en;
  }
}

// ─── Helper: Build User Prompt for AI ─────────────────────────

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toFixed(0)}`;
}

function buildUserPrompt(
  symbol: string,
  quote: QuoteData | null,
  techAnalysis: TechnicalAnalysisResult,
  locale: 'en' | 'ar' | 'fr' | 'tr' | 'es',
  fundamentals?: { peRatio: number; eps: number; marketCap: number; sector?: string; industry?: string; ceo?: string; description?: string } | null,
  keyMetrics?: { roe?: number; roa?: number; grossMargin?: number; debtToEquity?: number; revenueGrowth?: number } | null,
): string {
  const companyName = getCompanyName(symbol, locale);
  const price = quote?.price ?? techAnalysis.currentPrice;
  const changePercent = quote?.changePercent ?? techAnalysis.changePercent;

  const trendLabel = locale === 'ar'
    ? { bullish: 'صاعد', bearish: 'هابط', neutral: 'عرضي' }
    : locale === 'fr'
      ? { bullish: 'haussier', bearish: 'baissier', neutral: 'neutre' }
      : locale === 'tr'
        ? { bullish: 'yükseliş', bearish: 'düşüş', neutral: 'nötr' }
        : locale === 'es'
          ? { bullish: 'alcista', bearish: 'bajista', neutral: 'neutral' }
          : { bullish: 'bullish', bearish: 'bearish', neutral: 'neutral' };

  const signalLabel = trendLabel[techAnalysis.overallSignal] || techAnalysis.overallSignal;
  const trendDirLabel = trendLabel[techAnalysis.trend.direction] || techAnalysis.trend.direction;

  // Build fundamental data section if available
  let fundamentalSection = '';
  if (fundamentals) {
    if (locale === 'ar') {
      fundamentalSection = `
═══ البيانات الأساسية ═══
القيمة السوقية: ${formatMarketCap(fundamentals.marketCap)}
نسبة السعر/الأرباح: ${fundamentals.peRatio > 0 ? fundamentals.peRatio.toFixed(1) : 'N/A'}
ربحية السهم: $${fundamentals.eps > 0 ? fundamentals.eps.toFixed(2) : 'N/A'}
القطاع: ${fundamentals.sector || 'N/A'}
${fundamentals.ceo ? `الرئيس التنفيذي: ${fundamentals.ceo}` : ''}
${keyMetrics?.roe ? `العائد على حقوق المساهمين: ${(keyMetrics.roe * 100).toFixed(1)}%` : ''}
${keyMetrics?.revenueGrowth ? `نمو الإيرادات: ${(keyMetrics.revenueGrowth * 100).toFixed(1)}%` : ''}
`;
    } else if (locale === 'fr') {
      fundamentalSection = `
═══ DONNÉES FONDAMENTALES ═══
Capitalisation boursière: ${formatMarketCap(fundamentals.marketCap)}
Ratio P/E: ${fundamentals.peRatio > 0 ? fundamentals.peRatio.toFixed(1) : 'N/A'}
BPA: $${fundamentals.eps > 0 ? fundamentals.eps.toFixed(2) : 'N/A'}
Secteur: ${fundamentals.sector || 'N/A'}
${fundamentals.ceo ? `PDG: ${fundamentals.ceo}` : ''}
${keyMetrics?.roe ? `ROE: ${(keyMetrics.roe * 100).toFixed(1)}%` : ''}
${keyMetrics?.revenueGrowth ? `Croissance du chiffre d'affaires: ${(keyMetrics.revenueGrowth * 100).toFixed(1)}%` : ''}
`;
    } else if (locale === 'tr') {
      fundamentalSection = `
═══ TEMEL VERİLER ═══
Piyasa Değeri: ${formatMarketCap(fundamentals.marketCap)}
F/K Oranı: ${fundamentals.peRatio > 0 ? fundamentals.peRatio.toFixed(1) : 'N/A'}
Hisse Başına Kazanç: $${fundamentals.eps > 0 ? fundamentals.eps.toFixed(2) : 'N/A'}
Sektör: ${fundamentals.sector || 'N/A'}
${fundamentals.ceo ? `CEO: ${fundamentals.ceo}` : ''}
${keyMetrics?.roe ? `Özkaynak Getirisi: ${(keyMetrics.roe * 100).toFixed(1)}%` : ''}
${keyMetrics?.revenueGrowth ? `Gelir Büyümesi: ${(keyMetrics.revenueGrowth * 100).toFixed(1)}%` : ''}
`;
    } else if (locale === 'es') {
      fundamentalSection = `
═══ DATOS FUNDAMENTALES ═══
Capitalización de mercado: ${formatMarketCap(fundamentals.marketCap)}
Ratio PER: ${fundamentals.peRatio > 0 ? fundamentals.peRatio.toFixed(1) : 'N/A'}
BPA: $${fundamentals.eps > 0 ? fundamentals.eps.toFixed(2) : 'N/A'}
Sector: ${fundamentals.sector || 'N/A'}
${fundamentals.ceo ? `CEO: ${fundamentals.ceo}` : ''}
${keyMetrics?.roe ? `ROE: ${(keyMetrics.roe * 100).toFixed(1)}%` : ''}
${keyMetrics?.revenueGrowth ? `Crecimiento de ingresos: ${(keyMetrics.revenueGrowth * 100).toFixed(1)}%` : ''}
`;
    } else {
      fundamentalSection = `
═══ FUNDAMENTAL DATA ═══
Market Cap: ${formatMarketCap(fundamentals.marketCap)}
P/E Ratio: ${fundamentals.peRatio > 0 ? fundamentals.peRatio.toFixed(1) : 'N/A'}
EPS: $${fundamentals.eps > 0 ? fundamentals.eps.toFixed(2) : 'N/A'}
Sector: ${fundamentals.sector || 'N/A'}
${fundamentals.ceo ? `CEO: ${fundamentals.ceo}` : ''}
${keyMetrics?.roe ? `ROE: ${(keyMetrics.roe * 100).toFixed(1)}%` : ''}
${keyMetrics?.revenueGrowth ? `Revenue Growth: ${(keyMetrics.revenueGrowth * 100).toFixed(1)}%` : ''}
`;
    }
  }

  if (locale === 'ar') {
    return `حلل السهم ${companyName} (${symbol}):

═══ بيانات السعر ═══
السعر الحالي: $${price.toFixed(2)}
التغير: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
أعلى سعر: $${(quote?.high ?? price).toFixed(2)}
أدنى سعر: $${(quote?.low ?? price).toFixed(2)}
الحجم: ${quote?.volume?.toLocaleString() ?? 'N/A'}
${fundamentalSection}
═══ التحليل الفني ═══
الاتجاه: ${trendDirLabel} (قوة ${techAnalysis.trend.strength}%)
الإشارة العامة: ${signalLabel} (النتيجة ${techAnalysis.overallScore})
مستويات الدعم: ${techAnalysis.supportLevels.map(l => l.price.toFixed(2)).join(' | ') || 'لا توجد'}
مستويات المقاومة: ${techAnalysis.resistanceLevels.map(l => l.price.toFixed(2)).join(' | ') || 'لا توجد'}
المتوسط المتحرك 20: $${techAnalysis.movingAverages.sma20.toFixed(2)}
المتوسط المتحرك 50: $${techAnalysis.movingAverages.sma50.toFixed(2)}
المؤشرات: ${techAnalysis.indicators.map(i => `${i.name}=${i.value.toFixed(1)} (${i.signal})`).join(', ') || 'لا توجد'}
إعداد التداول: ${techAnalysis.tradeSetup.direction} عند $${techAnalysis.tradeSetup.entryPrice.toFixed(2)}

قم بإنشاء تحليل شامل باللغة العربية.`;
  }

  if (locale === 'fr') {
    return `Analysez l'action ${companyName} (${symbol}):

═══ DONNÉES DE PRIX ═══
Prix actuel: $${price.toFixed(2)}
Variation: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
Plus haut: $${(quote?.high ?? price).toFixed(2)}
Plus bas: $${(quote?.low ?? price).toFixed(2)}
Volume: ${quote?.volume?.toLocaleString() ?? 'N/A'}
${fundamentalSection}
═══ ANALYSE TECHNIQUE ═══
Tendance: ${trendDirLabel} (force ${techAnalysis.trend.strength}%)
Signal global: ${signalLabel} (score ${techAnalysis.overallScore})
Niveaux de support: ${techAnalysis.supportLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Aucun'}
Niveaux de résistance: ${techAnalysis.resistanceLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Aucun'}
Moyenne mobile 20: $${techAnalysis.movingAverages.sma20.toFixed(2)}
Moyenne mobile 50: $${techAnalysis.movingAverages.sma50.toFixed(2)}
Indicateurs: ${techAnalysis.indicators.map(i => `${i.name}=${i.value.toFixed(1)} (${i.signal})`).join(', ') || 'Aucun'}
Configuration de trading: ${techAnalysis.tradeSetup.direction} à $${techAnalysis.tradeSetup.entryPrice.toFixed(2)}

Fournissez une analyse complète en français.`;
  }

  if (locale === 'tr') {
    return `${companyName} (${symbol}) hissesini analiz edin:

═══ FİYAT VERİLERİ ═══
Mevcut Fiyat: $${price.toFixed(2)}
Değişim: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
Gün Yüksek: $${(quote?.high ?? price).toFixed(2)}
Gün Düşük: $${(quote?.low ?? price).toFixed(2)}
Hacim: ${quote?.volume?.toLocaleString() ?? 'N/A'}
${fundamentalSection}
═══ TEKNİK ANALİZ ═══
Trend: ${trendDirLabel} (güç ${techAnalysis.trend.strength}%)
Genel Sinyal: ${signalLabel} (skor ${techAnalysis.overallScore})
Destek Seviyeleri: ${techAnalysis.supportLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Yok'}
Direnç Seviyeleri: ${techAnalysis.resistanceLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Yok'}
Hareketli Ortalama 20: $${techAnalysis.movingAverages.sma20.toFixed(2)}
Hareketli Ortalama 50: $${techAnalysis.movingAverages.sma50.toFixed(2)}
Göstergeler: ${techAnalysis.indicators.map(i => `${i.name}=${i.value.toFixed(1)} (${i.signal})`).join(', ') || 'Yok'}
İşlem Kurulumu: ${techAnalysis.tradeSetup.direction} — $${techAnalysis.tradeSetup.entryPrice.toFixed(2)}

Türkçe kapsamlı bir analiz sunun.`;
  }

  if (locale === 'es') {
    return `Analiza la acción ${companyName} (${symbol}):

═══ DATOS DE PRECIO ═══
Precio actual: $${price.toFixed(2)}
Variación: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
Máximo del día: $${(quote?.high ?? price).toFixed(2)}
Mínimo del día: $${(quote?.low ?? price).toFixed(2)}
Volumen: ${quote?.volume?.toLocaleString() ?? 'N/A'}
${fundamentalSection}
═══ ANÁLISIS TÉCNICO ═══
Tendencia: ${trendDirLabel} (fuerza ${techAnalysis.trend.strength}%)
Señal general: ${signalLabel} (puntuación ${techAnalysis.overallScore})
Niveles de soporte: ${techAnalysis.supportLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Ninguno'}
Niveles de resistencia: ${techAnalysis.resistanceLevels.map(l => l.price.toFixed(2)).join(' | ') || 'Ninguno'}
Media móvil 20: $${techAnalysis.movingAverages.sma20.toFixed(2)}
Media móvil 50: $${techAnalysis.movingAverages.sma50.toFixed(2)}
Indicadores: ${techAnalysis.indicators.map(i => `${i.name}=${i.value.toFixed(1)} (${i.signal})`).join(', ') || 'Ninguno'}
Configuración de trading: ${techAnalysis.tradeSetup.direction} en $${techAnalysis.tradeSetup.entryPrice.toFixed(2)}

Proporciona un análisis completo en español.`;
  }

  // English (default)
  return `Analyze the stock ${companyName} (${symbol}):

═══ PRICE DATA ═══
Current Price: $${price.toFixed(2)}
Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
Day High: $${(quote?.high ?? price).toFixed(2)}
Day Low: $${(quote?.low ?? price).toFixed(2)}
Volume: ${quote?.volume?.toLocaleString() ?? 'N/A'}
${fundamentalSection}
═══ TECHNICAL ANALYSIS ═══
Trend: ${trendDirLabel} (strength ${techAnalysis.trend.strength}%)
Overall Signal: ${signalLabel} (score ${techAnalysis.overallScore})
Support Levels: ${techAnalysis.supportLevels.map(l => l.price.toFixed(2)).join(' | ') || 'None'}
Resistance Levels: ${techAnalysis.resistanceLevels.map(l => l.price.toFixed(2)).join(' | ') || 'None'}
SMA 20: $${techAnalysis.movingAverages.sma20.toFixed(2)}
SMA 50: $${techAnalysis.movingAverages.sma50.toFixed(2)}
Indicators: ${techAnalysis.indicators.map(i => `${i.name}=${i.value.toFixed(1)} (${i.signal})`).join(', ') || 'None'}
Trade Setup: ${techAnalysis.tradeSetup.direction} at $${techAnalysis.tradeSetup.entryPrice.toFixed(2)}

Provide a comprehensive analysis in English.`;
}

// ─── Generate Stock Analysis Article via AI ───────────────────

export async function generateStockAnalysisArticle(
  symbol: string,
  quote: QuoteData | null,
  techAnalysis: TechnicalAnalysisResult,
  locale: 'en' | 'ar' | 'fr' | 'tr' | 'es',
  fundamentals?: { peRatio: number; eps: number; marketCap: number; sector?: string; industry?: string; ceo?: string; description?: string } | null,
  keyMetrics?: { roe?: number; roa?: number; grossMargin?: number; debtToEquity?: number; revenueGrowth?: number } | null,
): Promise<{ title: string; summary: string; content: string } | null> {
  try {
    const systemPrompt = SYSTEM_PROMPTS[locale] || SYSTEM_PROMPTS.en;
    const userPrompt = buildUserPrompt(symbol, quote, techAnalysis, locale, fundamentals, keyMetrics);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Use locale-appropriate provider routing
    // V387: ALL locales now use OpenRouter (Haiku) as #1 choice
    // The locale parameter handles the full fallback chain automatically
    const aiResult = await chatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 2000,
      locale,  // V387: locale handles provider routing — OpenRouter (Haiku) first for all locales
    });

    if (!aiResult.content || aiResult.content.trim().length < 100) {
      console.warn(`[StockPipeline] AI returned insufficient content for ${symbol} (${locale})`);
      return null;
    }

    const content = aiResult.content.trim();

    // Extract title from first heading or first line
    let title = '';
    const headingMatch = content.match(/^#{1,2}\s+(.+)/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    } else {
      // Use first non-empty line as title
      const firstLine = content.split('\n').find(l => l.trim().length > 0);
      title = firstLine?.trim().slice(0, 120) || `${symbol} Stock Analysis`;
    }

    // Extract summary from first paragraph after title
    const lines = content.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
    const summary = lines.slice(0, 2).join(' ').slice(0, 300);

    return { title, summary, content };
  } catch (err: any) {
    console.error(`[StockPipeline] AI generation failed for ${symbol} (${locale}): ${err.message?.slice(0, 100)}`);
    return null;
  }
}

// ─── Create/Update Company Profile ────────────────────────────

async function upsertCompanyProfile(symbol: string, fundamentals?: CompanyFundamentals | null): Promise<boolean> {
  const info = COMPANY_NAMES[symbol];
  const MAX_RETRIES = 3;

  // Build the create/update data based on available information
  let createData: any;
  let updateData: any;

  // If we have FMP fundamentals, use them as the primary data source
  if (fundamentals) {
    createData = {
      symbol,
      name: fundamentals.name || info?.en || symbol,
      nameAr: info?.ar || fundamentals.name || symbol,
      nameFr: info?.fr || fundamentals.name || symbol,
      exchange: fundamentals.exchange || info?.exchange || '',
      sector: fundamentals.sector || info?.sector || '',
      industry: fundamentals.industry || '',
      description: fundamentals.description || '',
      marketCap: fundamentals.marketCap || 0,
      peRatio: fundamentals.peRatio || 0,
      eps: fundamentals.eps || 0,
      dividendYield: fundamentals.dividendYield || 0,
      beta: fundamentals.beta || 0,
      ceo: fundamentals.ceo || '',
      country: fundamentals.country || info?.country || '',
      website: fundamentals.website || '',
      employees: fundamentals.employees || null,
    };
    updateData = {
      name: fundamentals.name || info?.en || symbol,
      nameAr: info?.ar || fundamentals.name || symbol,
      nameFr: info?.fr || fundamentals.name || symbol,
      exchange: fundamentals.exchange || info?.exchange || '',
      sector: fundamentals.sector || info?.sector || '',
      industry: fundamentals.industry || '',
      description: fundamentals.description || '',
      marketCap: fundamentals.marketCap || 0,
      peRatio: fundamentals.peRatio || 0,
      eps: fundamentals.eps || 0,
      dividendYield: fundamentals.dividendYield || 0,
      beta: fundamentals.beta || 0,
      ceo: fundamentals.ceo || '',
      country: fundamentals.country || info?.country || '',
      website: fundamentals.website || '',
      employees: fundamentals.employees || null,
    };
  } else if (!info) {
    // Create a minimal profile for unknown symbols
    createData = { symbol, name: symbol };
    updateData = {};
  } else {
    // Use COMPANY_NAMES lookup data
    createData = {
      symbol,
      name: info.en,
      nameAr: info.ar,
      nameFr: info.fr,
      exchange: info.exchange,
      sector: info.sector,
      country: info.country,
    };
    updateData = {
      name: info.en,
      nameAr: info.ar,
      nameFr: info.fr,
      exchange: info.exchange,
      sector: info.sector,
      country: info.country,
    };
  }

  // Retry loop — ensures the CompanyProfile exists before StockAnalysis FK check
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await db.companyProfile.upsert({
        where: { symbol },
        create: createData,
        update: updateData,
      });

      // Verify the profile actually exists (defense against silent DB errors)
      const verified = await db.companyProfile.findUnique({ where: { symbol } });
      if (verified) {
        return true;
      }

      console.warn(`[StockPipeline] Upsert succeeded but verification failed for ${symbol} (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err: any) {
      console.error(`[StockPipeline] Failed to upsert company profile for ${symbol} (attempt ${attempt}/${MAX_RETRIES}): ${err.message?.slice(0, 100)}`);
    }

    // Wait before retry (exponential backoff: 500ms, 1000ms)
    if (attempt < MAX_RETRIES) {
      await delay(500 * attempt);
    }
  }

  // Last resort: try a direct create with minimal data (may already exist)
  try {
    await db.companyProfile.create({ data: { symbol, name: symbol } });
    return true;
  } catch (createErr: any) {
    // If it already exists, that's actually fine — the profile is there
    if (createErr.code === 'P2002') {
      console.log(`[StockPipeline] CompanyProfile already exists for ${symbol} (duplicate key on last-resort create)`);
      return true;
    }
    console.error(`[StockPipeline] Last-resort create failed for ${symbol}: ${createErr.message?.slice(0, 100)}`);
  }

  console.error(`[StockPipeline] CRITICAL: Could not ensure CompanyProfile for ${symbol} — StockAnalysis FK will fail`);
  return false;
}

// ─── Publish Stock Analysis as NewsItem ───────────────────────

export async function publishStockAnalysisAsArticle(
  analysis: {
    symbol: string;
    title: string;
    summary: string;
    content: string;
    locale: string;
    overallSignal: string;
    confidenceScore: number;
    price: number;
    changePercent: number;
  },
  locale: 'en' | 'ar' | 'fr' | 'tr' | 'es'
): Promise<string | null> {
  try {
    const companyName = getCompanyName(analysis.symbol, locale);
    const signalEmoji = analysis.overallSignal === 'bullish' ? '📈' : analysis.overallSignal === 'bearish' ? '📉' : '➡️';

    // Use the AI-generated title if available (unique per article),
    // otherwise fall back to a descriptive template with company name and price
    const fallbackTitle = locale === 'ar'
      ? `${signalEmoji} تحليل سهم: ${companyName} (${analysis.symbol}) — $${analysis.price.toFixed(2)} (${analysis.changePercent >= 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`
      : locale === 'fr'
      ? `${signalEmoji} Analyse: ${companyName} (${analysis.symbol}) — $${analysis.price.toFixed(2)} (${analysis.changePercent >= 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`
      : locale === 'tr'
      ? `${signalEmoji} ${companyName} (${analysis.symbol}) — $${analysis.price.toFixed(2)} (${analysis.changePercent >= 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`
      : `${signalEmoji} ${companyName} (${analysis.symbol}) — $${analysis.price.toFixed(2)} (${analysis.changePercent >= 0 ? '+' : ''}${analysis.changePercent.toFixed(2)}%)`;

    // Prefer the AI-generated title (which is unique and descriptive) over the template
    const newsTitle = analysis.title && analysis.title.trim().length > 5
      ? analysis.title.trim()
      : fallbackTitle;

    const slug = generateSlug(newsTitle);

    // Category mapping per locale
    const categoryMap: Record<string, { category: string; categoryId: string }> = {
      en: { category: 'Stocks', categoryId: 'stocks' },
      ar: { category: 'أسهم', categoryId: 'stocks' },
      fr: { category: 'Actions', categoryId: 'stocks' },
      tr: { category: 'Hisse Senetleri', categoryId: 'stocks' },
      es: { category: 'Acciones', categoryId: 'stocks' },  // V380: Added Spanish
    };
    const { category, categoryId } = categoryMap[locale] || categoryMap.en;

    const sentimentMap: Record<string, string> = {
      bullish: 'positive',
      bearish: 'negative',
      neutral: 'neutral',
    };

    // Build locale-specific recommendation text
    const recommendationMap: Record<string, Record<string, string>> = {
      en: { bullish: 'Buy opportunity', bearish: 'Sell signal', neutral: 'Hold' },
      ar: { bullish: 'فرصة شراء', bearish: 'إشارة بيع', neutral: 'احتفظ' },
      fr: { bullish: "Opportunité d'achat", bearish: 'Signal de vente', neutral: 'Conserver' },
      tr: { bullish: 'Alım fırsatı', bearish: 'Satış sinyali', neutral: 'Bekle' },
      es: { bullish: 'Oportunidad de compra', bearish: 'Señal de venta', neutral: 'Mantener' },  // V381: Added Spanish
    };

    // Build full aiAnalysis JSON with ALL fields the article display page requires.
    // Previously this was a minimal stub causing articles to render without analysis content.
    const aiAnalysisData = {
      type: 'stock_analysis',
      symbol: analysis.symbol,
      signal: analysis.overallSignal,
      confidence: analysis.confidenceScore,
      path: 'A',
      sector: 'stocks',
      sentimentReason: `${companyName} (${analysis.symbol}) — ${analysis.overallSignal} signal, confidence ${analysis.confidenceScore}%`,
      fullContent: analysis.content || '',
      introduction: analysis.summary || '',
      body: analysis.content || '',
      conclusion: '',
      summary: analysis.summary || '',
      sentiment: sentimentMap[analysis.overallSignal] || 'neutral',
      impactLevel: analysis.confidenceScore > 70 ? 'high' : analysis.confidenceScore > 50 ? 'medium' : 'low',
      keyTakeaways: [] as string[],
      affectedAssets: [
        {
          symbol: analysis.symbol,
          name: companyName,
          direction: analysis.overallSignal === 'bullish' ? 'up' : analysis.overallSignal === 'bearish' ? 'down' : 'neutral',
          impactDegree: 'high',
          reason: 'Stock analysis target',
          isTradable: true,
        },
      ],
      recommendation: recommendationMap[locale]?.[analysis.overallSignal] || recommendationMap.en[analysis.overallSignal] || 'Hold',
      locale: locale,
      rawData: {
        entityNameTr: companyName,
        ticker: analysis.symbol,
        exchange: '',
        figures: [],
        source: 'stock-analysis-pipeline',
      },
    };

    // V380: Check stock analysis quota BEFORE publishing
    try {
      const { canPublishStockAnalysis } = await import('@/lib/pipeline/publish-quota');
      const stockQuotaCheck = await canPublishStockAnalysis(locale);
      if (!stockQuotaCheck.allowed) {
        console.warn(`[StockPipeline V380] Stock analysis quota EXCEEDED for ${locale}: ${stockQuotaCheck.reason}`);
        return null;
      }
    } catch (quotaErr: any) {
      // Fail-open: if quota check fails, allow publishing (don't permanently block)
      console.warn(`[StockPipeline V380] Stock quota check failed for ${locale}, allowing: ${quotaErr.message}`);
    }

    const newsItem = await db.newsItem.create({
      data: {
        title: newsTitle,
        summary: analysis.summary,
        content: analysis.content,
        category,
        categoryId,
        locale,
        sentiment: sentimentMap[analysis.overallSignal] || 'neutral',
        sentimentScore: Math.round(50 + (analysis.overallSignal === 'bullish' ? 25 : analysis.overallSignal === 'bearish' ? -25 : 0)),
        impactLevel: analysis.confidenceScore > 70 ? 'high' : analysis.confidenceScore > 50 ? 'medium' : 'low',
        impactScore: analysis.confidenceScore,
        originalLanguage: locale,
        isPublished: true,
        isReady: true,
        processingStage: 'imaged',
        slug,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        source: 'stock-analysis-pipeline',
        sourceName: locale === 'ar' ? 'محلل الأسهم' : locale === 'fr' ? 'Analyseur Actions' : locale === 'tr' ? 'Hisse Analizörü' : locale === 'es' ? 'Analizador de Acciones' : 'Stock Analyzer',
        url: '',
        newsType: 'stock_analysis',
        affectedAssets: JSON.stringify([{
          symbol: analysis.symbol,
          name: companyName,
          direction: analysis.overallSignal === 'bullish' ? 'up' : analysis.overallSignal === 'bearish' ? 'down' : 'neutral',
          impactDegree: 'high',
          reason: 'Stock analysis target',
          isTradable: true,
        }]),
        aiAnalysis: JSON.stringify(aiAnalysisData),
      },
    });

    // V380: Record stock analysis publish in quota manager
    try {
      const { recordStockAnalysisPublish } = await import('@/lib/pipeline/publish-quota');
      recordStockAnalysisPublish(locale);
    } catch { /* non-critical */ }

    console.log(`[StockPipeline] ✓ Published as NewsItem: ${newsTitle.slice(0, 60)}... (id=${newsItem.id})`);
    return newsItem.id;
  } catch (err: any) {
    console.error(`[StockPipeline] Failed to publish NewsItem for ${analysis.symbol} (${locale}): ${err.message?.slice(0, 100)}`);
    return null;
  }
}

// ─── Helper: Delay ────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main Pipeline Function ───────────────────────────────────

export async function runStockAnalysisPipeline(
  locale: 'en' | 'ar' | 'fr' | 'tr' | 'es' = 'en',
  maxStocks: number = 10
): Promise<{ generated: number; published: number; errors: number; errorDetails?: string[] }> {
  const startTime = Date.now();
  console.log(`[StockPipeline] Starting stock analysis pipeline for locale=${locale}, maxStocks=${maxStocks}`);

  const symbols = selectSymbolsForLocale(locale, maxStocks);
  console.log(`[StockPipeline] Selected ${symbols.length} symbols: ${symbols.join(', ')}`);

  let generated = 0;
  let published = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    console.log(`[StockPipeline] Processing ${i + 1}/${symbols.length}: ${symbol}`);

    try {
      // 1. Fetch real-time quote
      console.log(`[StockPipeline] Fetching quote for ${symbol}...`);
      const quote = await getQuote(symbol);

      if (!quote || quote.price <= 0) {
        const reason = `No valid quote for ${symbol} (quote=${quote ? '$' + quote.price : 'null'})`;
        console.warn(`[StockPipeline] ${reason} — skipping`);
        errorDetails.push(reason);
        errors++;
        await delay(DELAY_BETWEEN_CALLS_MS);
        continue;
      }

      // 2. Fetch historical data
      console.log(`[StockPipeline] Fetching historical data for ${symbol}...`);
      const historicalData = await getHistoricalData(symbol, 90);

      if (!historicalData || historicalData.length < 5) {
        const reason = `Insufficient history for ${symbol} (${historicalData?.length ?? 0} points)`;
        console.warn(`[StockPipeline] ${reason} — skipping`);
        errorDetails.push(reason);
        errors++;
        await delay(DELAY_BETWEEN_CALLS_MS);
        continue;
      }

      // Convert HistoricalPoint[] to OHLCV[] for technical analysis
      const ohlcvData = historicalData.map(p => ({
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }));

      // 3. Run technical analysis
      console.log(`[StockPipeline] Running technical analysis for ${symbol}...`);
      const techAnalysis = performTechnicalAnalysis(
        ohlcvData,
        symbol,
        quote.price,
        quote.changePercent
      );

      // 3.5. Fetch fundamental data from FMP (if available)
      // Pass existing quote to avoid duplicate getQuote() call inside getCompanyFundamentals
      console.log(`[StockPipeline] Fetching fundamental data for ${symbol}...`);
      const fundamentals = await getCompanyFundamentals(symbol, quote);
      const keyMetricsData = await getKeyMetrics(symbol);

      // 4. Generate AI analysis
      console.log(`[StockPipeline] Generating AI analysis for ${symbol} (${locale})...`);
      const article = await generateStockAnalysisArticle(symbol, quote, techAnalysis, locale, fundamentals, keyMetricsData);

      if (!article) {
        const reason = `AI article generation failed for ${symbol}`;
        console.warn(`[StockPipeline] ${reason}`);
        errorDetails.push(reason);
        errors++;
        await delay(DELAY_BETWEEN_CALLS_MS);
        continue;
      }

      // 5. Create/Update Company Profile (MUST succeed before StockAnalysis FK constraint)
      const profileCreated = await upsertCompanyProfile(symbol, fundamentals);
      if (!profileCreated) {
        const reason = `Failed to create CompanyProfile for ${symbol} — cannot create StockAnalysis (FK constraint)`;
        console.error(`[StockPipeline] ${reason}`);
        errorDetails.push(reason);
        errors++;
        await delay(DELAY_BETWEEN_CALLS_MS);
        continue;
      }

      // 6. Calculate confidence
      const confidence = calculateConfidence(quote, techAnalysis);

      // 7. Determine risk level from trade setup
      const riskLevel = techAnalysis.tradeSetup.direction === 'wait' ? 'low' as const
        : techAnalysis.tradeSetup.riskRewardRatio >= 2 ? 'low' as const
        : techAnalysis.tradeSetup.riskRewardRatio >= 1 ? 'medium' as const
        : 'high' as const;

      // 8. Determine market type
      const marketType = getMarketType(symbol);

      // 9. Build slug and title
      const companyName = getCompanyName(symbol, locale);
      const titleLocalePrefix = locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyse' : locale === 'tr' ? 'Analiz' : 'Analysis';
      const analysisTitle = article.title || `${titleLocalePrefix}: ${companyName} (${symbol}) — ${new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : 'en-US')}`;
      const slug = generateSlug(analysisTitle);

      // 10. Save StockAnalysis record
      try {
        const analysisRecord = await db.stockAnalysis.create({
          data: {
            symbol,
            slug,
            locale,
            title: analysisTitle,
            summary: article.summary,
            content: article.content,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            high: quote.high,
            low: quote.low,
            open: quote.open,
            volume: quote.volume,
            previousClose: quote.previousClose,
            technicalData: JSON.stringify(techAnalysis),
            overallSignal: techAnalysis.overallSignal,
            overallScore: techAnalysis.overallScore,
            confidenceScore: confidence,
            riskLevel,
            sector: fundamentals?.sector || COMPANY_NAMES[symbol]?.sector || '',
            marketCap: fundamentals?.marketCap || 0,
            peRatio: fundamentals?.peRatio || 0,
            eps: fundamentals?.eps || 0,
            keyMetrics: keyMetricsData ? JSON.stringify(keyMetricsData) : '{}',
            tradeSetup: JSON.stringify({
              direction: techAnalysis.tradeSetup.direction,
              entryPrice: techAnalysis.tradeSetup.entryPrice,
              stopLoss: techAnalysis.tradeSetup.stopLoss,
              targetPrice: techAnalysis.tradeSetup.targetPrice,
              riskRewardRatio: techAnalysis.tradeSetup.riskRewardRatio,
              confidence: techAnalysis.tradeSetup.confidence,
            }),
            marketType,
            assetClass: 'stocks',
            isPublished: true,
            publishedAt: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24h
          },
        });

        generated++;
        console.log(`[StockPipeline] ✓ StockAnalysis created: ${symbol} (${locale}) signal=${techAnalysis.overallSignal} confidence=${confidence} (id=${analysisRecord.id})`);

        // 11. StockAnalysis stays in stock_analyses table only.
        // DISABLED: Do NOT publish stock analyses to news_items — they pollute the
        // Arabic news feed with empty articles ("**ملخص تنفيذي**") that bypass
        // the news pipeline quality gate. Stock analyses have their own display
        // page at /[locale]/stock-analysis and do NOT belong in news_items.
        published++;
        const newsItemId = null;
      } catch (dbErr: any) {
        const reason = `DB error for ${symbol}: ${dbErr.message?.slice(0, 100)}`;
        console.error(`[StockPipeline] ${reason}`);
        errorDetails.push(reason);
        errors++;
      }
    } catch (err: any) {
      const reason = `Unexpected error for ${symbol}: ${err.message?.slice(0, 100)}`;
      console.error(`[StockPipeline] ${reason}`);
      errorDetails.push(reason);
      errors++;
    }

    // Rate limiting: wait between API calls
    if (i < symbols.length - 1) {
      await delay(DELAY_BETWEEN_CALLS_MS);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[StockPipeline] Pipeline complete: ${generated} generated, ${published} published, ${errors} errors in ${duration}ms`);

  return { generated, published, errors, errorDetails };
}
