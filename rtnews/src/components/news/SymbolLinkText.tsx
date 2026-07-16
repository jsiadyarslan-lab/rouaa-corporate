'use client';

import React from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// SymbolLinkText — يحوّل الرموز في النص إلى روابط قابلة للضغط
// ═══════════════════════════════════════════════════════════════
// أمثلة:
//   "ارتفعت [[CAT]] إلى 952.41"  →  "ارتفعت CAT إلى 952.41"  (CAT رابط)
//   "سجل BTC/USDT ارتفاعاً"     →  "سجل BTC/USDT ارتفاعاً"  (BTC/USDT رابط)
//   "سهم ميتا يرتفع"            →  "سهم ميتا يرتفع"         (ميتا رابط)
//
// الأقواس [[ ]] تُزال تلقائياً — الرمز يظهر نظيفاً كرابط.
// ═══════════════════════════════════════════════════════════════

// الأسهم المعروفة (whitelist) — فقط هذه تُحوّل لروابط stock-analysis
const KNOWN_STOCKS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','META','TSLA','NVDA','NFLX',
  'INTC','AMD','ORCL','CSCO','ADBE','PYPL','CRM','UBER','LYFT',
  'SHOP','SQ','ROKU','ZM','DOCU','SNAP','PINS','SPOT',
  'ABNB','COIN','HOOD','PLTR','SNOW','DDOG','NET','CRWD',
  'JPM','BAC','WFC','GS','MS','C','V','MA','AXP','BLK',
  'JNJ','PFE','MRK','ABBV','LLY','TMO','UNH','ABT','DHR',
  'XOM','CVX','COP','SLB','EOG','PSX','VLO','MPC',
  'WMT','HD','LOW','COST','TGT','DG','BBY',
  'MCD','SBUX','CMG','DPZ','YUM',
  'DIS','NKE','KO','PEP','PG','CL',
  'CAT','DE','GE','HON','MMM','BA','LMT','RTX','UTX',
  'T','VZ','TMUS','CMCSA','CHTR',
  'F','GM','STLA','RIVN','LCID',
  'GME','AMC','BB','NOK',
  'PLUG','FCEL','BLNK','CHPT','QS',
  'SOFI','AFRM','UPST','LC',
  'AI','PATH','U','MSTR','MARA','RIOT','HUT',
  'BABA','JD','PDD','BIDU','NIO','XPEV','LI',
  'TSM','ASML','SAP','INFY','WIT',
  // V1185: Semiconductors & memory (Samsung, SK Hynix, Micron, etc.)
  'MU','TXN','QCOM','AVGO','NXPI','STM','AMD','MPWR','ON','SWKS',
  'ARM','SMCI','ASML','TSM','UMC','WOLF','SITM','MRVL','LRCX','AMAT',
  'KLAC','ENTG','ONTO','CAMT','TER','ACLK','ACMR',
  // Energy & utilities
  'NEE','DUK','SO','D','AEP','SRE','XEL','WEC','ED','PEG',
  'ENB','TRP','KMI','WMB','OKE','ET','EPD','MPLX','PAA',
  // Materials & mining
  'BHP','RIO','VALE','NEM','GOLD','AEM','KGC','FCX','NUE','STLD',
  'X','CLF','AA','CENX',
  // Pharma & biotech
  'GILD','REGN','VRTX','BIIB','MRNA','BNTX','PFE','AZN','SNY','NVS',
  'ROG','SHPG','TEVA','BMY','LLY',
  // Consumer discretionary & retail
  'ETSY','CHWY','RVLT','W','DKNG','DKS','DDBL','BBWI',
  // Industrial & logistics
  'UPS','FDX','UNP','CSX','NSC','KSU','ODFL','JBHT','KNX',
  'MMM','HON','GE','ITW','PH','ROK','DOV','PNR','GGG','FLS',
  // Travel & hospitality
  'MAR','HLT','MGM','WYNN','CZR','LVS','BKNG','EXPE','TRIP',
  'DAL','LUV','UAL','AAL','ALK','JBLU','SAVE','HA',
  // Media & entertainment
  'WBD','PARA','CMCSA','DISCA','FOX','FOXA','NWSA','NWS',
  'SPOT','PANDORA','SIRIUS',
  // Real estate & REITs
  'PLD','AMT','CCI','EQIX','DLR','PSA','O','WELL','AVB','EQR',
  // Insurance
  'BRK','BRK.B','AIG','MET','PRU','ALL','TRV','CB','PGR','L',
  // Payments & fintech
  'SQ','AFRM','SOFI','UPST','LC','FIS','FISV','GPN','JKHY',
  // Telecom (international)
  'CHT','CHT.A','TEF','AMX','TIM','VOD','BT','DT',
  // European stocks (via .PA, .DE, .L, etc.)
  'AIR.PA','MC.PA','TTE.PA','SAN.PA','BNP.PA','GLE.PA','OR.PA',
  'SU.PA','DG.PA','BN.PA','RI.PA','ALO.PA','HO.PA','LR.PA',
  'SIE.DE','ALV.DE','BMW.DE','DTK.DE','CON.DE','VOW3.DE','DAI.DE',
  'SAP.DE','DBK.DE','CBK.DE','MUV2.DE','VNA.DE','HEI.DE',
  'BP.L','SHEL.L','HSBA.L','AZN.L','GSK.L','ULVR.L','LLOY.L',
  'BARC.L','RDSA.L','RIO.L','BATS.L','DGE.L','REL.L',
  'TM','7203.T','9984.T','8306.T','6758.T','7974.T',
  '005930.KS','000660.KS','035420.KS','066570.KS','207940.KS',
  'BABA','JD','PDD','BIDU','NIO','XPEV','LI','NTES','BZ',
  'RELIANCE.NS','TCS.NS','INFY.NS','HDB','IBN','TTM','WIT',
  // Emerging markets
  'VIV','PBR','VALE','ABEV','GGB','ERJ','HMY','SQM',
]);

// أسماء العملات الرقمية بكل اللغات → الزوج
const CRYPTO_NAMES_ALL_LANGS: Record<string, string> = {
  // English
  'Bitcoin': 'BTC/USDT', 'bitcoin': 'BTC/USDT',
  'Ethereum': 'ETH/USDT', 'ethereum': 'ETH/USDT',
  'Solana': 'SOL/USDT', 'solana': 'SOL/USDT',
  'Binance Coin': 'BNB/USDT', 'BNB': 'BNB/USDT',
  'XRP': 'XRP/USDT', 'Ripple': 'XRP/USDT', 'ripple': 'XRP/USDT',
  'Cardano': 'ADA/USDT', 'cardano': 'ADA/USDT',
  'Dogecoin': 'DOGE/USDT', 'dogecoin': 'DOGE/USDT', 'Doge': 'DOGE/USDT',
  'Polkadot': 'DOT/USDT', 'polkadot': 'DOT/USDT',
  'Avalanche': 'AVAX/USDT', 'avalanche': 'AVAX/USDT',
  'Chainlink': 'LINK/USDT', 'chainlink': 'LINK/USDT',
  'Uniswap': 'UNI/USDT', 'uniswap': 'UNI/USDT',
  'Polygon': 'MATIC/USDT', 'polygon': 'MATIC/USDT',
  'Litecoin': 'LTC/USDT', 'litecoin': 'LTC/USDT',
  'Cosmos': 'ATOM/USDT', 'cosmos': 'ATOM/USDT',
  'NEAR Protocol': 'NEAR/USDT', 'NEAR': 'NEAR/USDT',
  // Arabic
  'البيتكوين': 'BTC/USDT', 'بتكوين': 'BTC/USDT', 'بيتكوين': 'BTC/USDT',
  'الإيثيريوم': 'ETH/USDT', 'ايثيريوم': 'ETH/USDT', 'إيثيريوم': 'ETH/USDT',
  'سولانا': 'SOL/USDT',
  'بينانس كوين': 'BNB/USDT',
  'الريبل': 'XRP/USDT', 'ريبل': 'XRP/USDT',
  'كاردانو': 'ADA/USDT',
  'الدوجكوين': 'DOGE/USDT', 'دوجكوين': 'DOGE/USDT',
  'بولكادوت': 'DOT/USDT',
  'أفالانش': 'AVAX/USDT', 'افالانش': 'AVAX/USDT',
  'تشنلينك': 'LINK/USDT',
  'يونيسواب': 'UNI/USDT',
  'ماتيك': 'MATIC/USDT', 'بوليجون': 'MATIC/USDT',
  'لايتكوين': 'LTC/USDT',
  'كوزموس': 'ATOM/USDT',
  // French
  'le Bitcoin': 'BTC/USDT', 'Le Bitcoin': 'BTC/USDT',
  'l\'Ethereum': 'ETH/USDT', 'l\'Ethereum': 'ETH/USDT',
  'le Solana': 'SOL/USDT',
  // Turkish
  'Bitcoin\'u': 'BTC/USDT', 'Bitcoin\'u': 'BTC/USDT',
  'Ethereum\'u': 'ETH/USDT',
  // Spanish
  'el Bitcoin': 'BTC/USDT',
  'el Ethereum': 'ETH/USDT',
};

// أسماء أزواج الفوركس بكل اللغات
// V1185: أزواج عربية مباشرة (دولار/ين، يورو/دولار، إلخ) + أسماء عملات
const FOREX_NAMES_ALL_LANGS: Record<string, string> = {
  // Arabic forex pairs (direct format as they appear in articles)
  'دولار/ين': 'USD/JPY', 'دولار / ين': 'USD/JPY',
  'يورو/دولار': 'EUR/USD', 'يورو / دولار': 'EUR/USD',
  'جنيه/دولار': 'GBP/USD', 'جنيه / دولار': 'GBP/USD',
  'دولار/ليرة': 'USD/TRY', 'دولار / ليرة': 'USD/TRY',
  'يورو/ليرة': 'EUR/TRY', 'يورو / ليرة': 'EUR/TRY',
  'دولار/بيزو': 'USD/MXN', 'دولار / بيزو': 'USD/MXN',
  'دولار/فرنك': 'USD/CHF', 'دولار / فرنك': 'USD/CHF',
  'دولار/كرون': 'USD/SEK', 'دولار / كرون': 'USD/SEK',
  'دولار/يوان': 'USD/CNH', 'دولار / يوان': 'USD/CNH',
  'دولار/روبية': 'USD/INR', 'دولار / روبية': 'USD/INR',
  'دولار/راند': 'USD/ZAR', 'دولار / راند': 'USD/ZAR',
  'دولار/ريال': 'USD/BRL', 'دولار / ريال': 'USD/BRL',
  'إسترليني/ين': 'GBP/JPY', 'إسترليني / ين': 'GBP/JPY',
  'يورو/ين': 'EUR/JPY', 'يورو / ين': 'EUR/JPY',
  'يورو/إسترليني': 'EUR/GBP', 'يورو / إسترليني': 'EUR/GBP',
  // English currency names
  'Euro': 'EUR/USD', 'euro': 'EUR/USD',
  'US Dollar': 'USD/JPY',
  'British Pound': 'GBP/USD', 'Pound Sterling': 'GBP/USD', 'Sterling': 'GBP/USD',
  'Japanese Yen': 'USD/JPY',
  'Swiss Franc': 'USD/CHF',
  'Australian Dollar': 'AUD/USD',
  'Canadian Dollar': 'USD/CAD',
  'New Zealand Dollar': 'NZD/USD',
  // Arabic currency names (FULL names only — not "الدولار" alone)
  'اليورو': 'EUR/USD',
  'الدولار الأمريكي': 'USD/JPY',
  'الإسترليني': 'GBP/USD', 'الاسترليني': 'GBP/USD',
  'الين الياباني': 'USD/JPY',
  'الفرنك السويسري': 'USD/CHF',
  'الدولار الأسترالي': 'AUD/USD',
  'الدولار الكندي': 'USD/CAD',
  'الدولار النيوزيلندي': 'NZD/USD',
  // French
  'l\'euro': 'EUR/USD', 'l\'Euro': 'EUR/USD',
  'le dollar américain': 'USD/JPY',
  'la livre sterling': 'GBP/USD',
  'le yen japonais': 'USD/JPY',
  'le franc suisse': 'USD/CHF',
  'le dollar australien': 'AUD/USD',
  'le dollar canadien': 'USD/CAD',
  // Turkish
  'Avustralya doları': 'AUD/USD',
  'Kanada doları': 'USD/CAD',
  // Spanish
  'el dólar americano': 'USD/JPY',
  'la libra esterlina': 'GBP/USD',
  'el yen japonés': 'USD/JPY',
  'el franco suizo': 'USD/CHF',
  'el dólar australiano': 'AUD/USD',
  'el dólar canadiense': 'USD/CAD',
};

// أسماء السلع
const COMMODITY_NAMES_ALL_LANGS: Record<string, string> = {
  // Arabic
  'النفط': 'OIL/USD', 'نفط برنت': 'BRENT/USD', 'برنت': 'BRENT/USD',
  'الغاز الطبيعي': 'NGAS/USD', 'الغاز': 'NGAS/USD',
  'النحاس': 'COPPER/USD',
  'القمح': 'WHEAT/USD',
  'الذرة': 'CORN/USD',
  'القطن': 'COTTON/USD',
  'البن': 'COFFEE/USD',
  'السكر': 'SUGAR/USD',
  // English
  'Oil': 'OIL/USD', 'oil': 'OIL/USD', 'Crude Oil': 'OIL/USD',
  'Brent': 'BRENT/USD', 'WTI': 'OIL/USD',
  'Natural Gas': 'NGAS/USD', 'natural gas': 'NGAS/USD',
  'Copper': 'COPPER/USD',
  'Wheat': 'WHEAT/USD',
  'Corn': 'CORN/USD',
  // French
  'le pétrole': 'OIL/USD', 'pétrole': 'OIL/USD',
  'le gaz naturel': 'NGAS/USD',
  // Turkish
  'petrol': 'OIL/USD', 'Petrol': 'OIL/USD',
  // Spanish
  'el petróleo': 'OIL/USD', 'petróleo': 'OIL/USD',
};

// أسماء المؤشرات العالمية
const INDEX_NAMES_ALL_LANGS: Record<string, string> = {
  // Arabic
  'بوفيسبا': 'BVSP', 'مؤشر بوفيسبا': 'BVSP',
  'بيست 100': 'XU100', 'مؤشر بيست 100': 'XU100', 'بورصة اسطنبول': 'XU100',
  'إس آند بي': 'SPX', 'س آند بي': 'SPX', 'مؤشر إس آند بي': 'SPX',
  'إس آند بي 500': 'SPX', 'س آند بي 500': 'SPX',
  'ناسداك': 'IXIC', 'مؤشر ناسداك': 'IXIC',
  'داو جونز': 'DJI', 'مؤشر داو جونز': 'DJI', 'داو': 'DJI',
  'فتسي 100': 'FTSE', 'مؤشر فتسي': 'FTSE',
  'كاك 40': 'FCHI', 'مؤشر كاك': 'FCHI',
  'داكس': 'GDAXI', 'مؤشر داكس': 'GDAXI',
  'نيكي': 'N225', 'نيكي 225': 'N225', 'مؤشر نيكي': 'N225',
  'هانغ سنغ': 'HSI', 'مؤشر هانغ سنغ': 'HSI',
  'شنغهاي': 'SSEC', 'مؤشر شنغهاي': 'SSEC',
  'مؤشر الدولار': 'DXY', 'مؤشر الدولار الأمريكي': 'DXY',
  // English
  'S&P 500': 'SPX', 'S&P': 'SPX', 'S&P500': 'SPX',
  'Nasdaq': 'IXIC', 'NASDAQ': 'IXIC', 'Nasdaq Composite': 'IXIC',
  'Dow Jones': 'DJI', 'Dow': 'DJI', 'Dow Jones Industrial': 'DJI',
  'FTSE 100': 'FTSE', 'FTSE': 'FTSE',
  'CAC 40': 'FCHI', 'CAC': 'FCHI',
  'DAX': 'GDAXI',
  'Nikkei': 'N225', 'Nikkei 225': 'N225',
  'Hang Seng': 'HSI',
  'Shanghai': 'SSEC', 'Shanghai Composite': 'SSEC',
  'Dollar Index': 'DXY', 'DXY': 'DXY',
  'Bovespa': 'BVSP',
  'BIST 100': 'XU100', 'BIST100': 'XU100',
  // French
  'le CAC 40': 'FCHI',
  'le DAX': 'GDAXI',
  'le Nikkei': 'N225',
  // Turkish
  'BIST 100': 'XU100', 'BIST100': 'XU100', 'Borsa İstanbul': 'XU100',
  // Spanish
  'el Ibex 35': 'IBEX', 'Ibex': 'IBEX',
};

// أسماء المعادن بكل اللغات
const METAL_NAMES_ALL_LANGS: Record<string, string> = {
  // English
  'Gold': 'XAU/USD', 'gold': 'XAU/USD',
  'Silver': 'XAG/USD', 'silver': 'XAG/USD',
  'Platinum': 'XPT/USD', 'platinum': 'XPT/USD',
  // Arabic
  'الذهب': 'XAU/USD',
  'الفضة': 'XAG/USD',
  'البلاتين': 'XPT/USD',
  // French
  'l\'or': 'XAU/USD', 'l\'Or': 'XAU/USD', 'or': 'XAU/USD',
  'l\'argent': 'XAG/USD', 'l\'Argent': 'XAG/USD',
  'le platine': 'XPT/USD',
  // Turkish
  'altın': 'XAU/USD', 'Altın': 'XAU/USD', 'gümüş': 'XAG/USD',
  // Spanish
  'el oro': 'XAU/USD', 'oro': 'XAU/USD',
  'la plata': 'XAG/USD', 'plata': 'XAG/USD',
  'el platino': 'XPT/USD',
};

// خريطة الأسماء العربية → رمز السهم
const ARABIC_NAMES: Record<string, string> = {
  'تسلا': 'TSLA', 'تيسلا': 'TSLA',
  'أبل': 'AAPL', 'ابل': 'AAPL', 'آبل': 'AAPL',
  'مايكروسوفت': 'MSFT', 'ميكروسوفت': 'MSFT',
  'ألفابت': 'GOOGL', 'الفابت': 'GOOGL', 'جوجل': 'GOOGL', 'غوغل': 'GOOGL', 'جوجول': 'GOOGL',
  'أمازون': 'AMZN', 'امازون': 'AMZN',
  'إنفيديا': 'NVDA', 'انفيديا': 'NVDA', 'نفيديا': 'NVDA',
  'ميتا': 'META', 'فيسبوك': 'META',
  'إنتل': 'INTC', 'انتل': 'INTC',
  'نتفليكس': 'NFLX', 'نيتفليكس': 'NFLX',
  'كاتربيلر': 'CAT',
  'بوينغ': 'BA',
  'فورد': 'F',
  'أدوبي': 'ADBE',
  'أوبر': 'UBER',
  'ديزني': 'DIS', 'والت ديزني': 'DIS',
  'نايكي': 'NKE',
  'كوكاكولا': 'KO', 'كوكا كولا': 'KO',
  'بيبسي': 'PEP',
  'ماكدونالدز': 'MCD',
  'ستاربكس': 'SBUX',
  'فايزر': 'PFE',
  'جي بي مورجان': 'JPM', 'جي بي مورغان': 'JPM',
  'جنرال موتورز': 'GM',
  'وول مارت': 'WMT',
  'جنرال إلكتريك': 'GE',
};

// English company names → stock symbol
const ENGLISH_NAMES: Record<string, string> = {
  'Tesla': 'TSLA', 'tesla': 'TSLA',
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Alphabet': 'GOOGL', 'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'Nvidia': 'NVDA', 'nvidia': 'NVDA',
  'Meta': 'META', 'Facebook': 'META',
  'Intel': 'INTC',
  'Netflix': 'NFLX',
  'Caterpillar': 'CAT',
  'Boeing': 'BA',
  'Ford': 'F',
  'Adobe': 'ADBE',
  'Uber': 'UBER',
  'Disney': 'DIS',
  'Nike': 'NKE',
  'Coca-Cola': 'KO', 'Coca Cola': 'KO',
  'PepsiCo': 'PEP', 'Pepsi': 'PEP',
  "McDonald's": 'MCD', 'McDonalds': 'MCD',
  'Starbucks': 'SBUX',
  'Pfizer': 'PFE',
  'JPMorgan': 'JPM', 'JPMorgan Chase': 'JPM',
  'General Motors': 'GM',
  'Walmart': 'WMT',
  'General Electric': 'GE',
  'Salesforce': 'CRM',
  'Oracle': 'ORCL',
  'Cisco': 'CSCO',
  'PayPal': 'PYPL',
  'Coinbase': 'COIN',
  'Palantir': 'PLTR',
  'Snowflake': 'SNOW',
  'CrowdStrike': 'CRWD',
  'Datadog': 'DDOG',
  'Cloudflare': 'NET',
  'Robinhood': 'HOOD',
  'Airbnb': 'ABNB',
  'Shopify': 'SHOP',
  'Spotify': 'SPOT',
  'Snap': 'SNAP',
  'Pinterest': 'PINS',
  'Advanced Micro Devices': 'AMD',
  'Johnson & Johnson': 'JNJ',
  'ExxonMobil': 'XOM',
  'Chevron': 'CVX',
  'Lockheed Martin': 'LMT',
  'Raytheon': 'RTX',
  'Honeywell': 'HON',
  '3M': 'MMM',
  'Deere': 'DE',
  'Home Depot': 'HD',
  'Lowe\'s': 'LOW',
  'Costco': 'COST',
  'Target': 'TGT',
  'T-Mobile': 'TMUS',
  'Verizon': 'VZ',
  'AT&T': 'T',
  'Visa': 'V',
  'Mastercard': 'MA',
  'Goldman Sachs': 'GS',
  'Morgan Stanley': 'MS',
  'Bank of America': 'BAC',
  'Wells Fargo': 'WFC',
  'BlackRock': 'BLK',
  'UnitedHealth': 'UNH',
  'Abbott': 'ABT',
  'Eli Lilly': 'LLY',
  'Thermo Fisher': 'TMO',
  'AbbVie': 'ABBV',
  'Merck': 'MRK',
};

// French company names → stock symbol
const FRENCH_NAMES: Record<string, string> = {
  'Tesla': 'TSLA',
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Alphabet': 'GOOGL', 'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'Nvidia': 'NVDA',
  'Meta': 'META', 'Facebook': 'META',
  'Intel': 'INTC',
  'Netflix': 'NFLX',
  'Caterpillar': 'CAT',
  'Boeing': 'BA',
  'Ford': 'F',
  'Adobe': 'ADBE',
  'Uber': 'UBER',
  'Disney': 'DIS',
  'Nike': 'NKE',
  'Coca-Cola': 'KO',
  'PepsiCo': 'PEP',
  'McDonald\'s': 'MCD',
  'Starbucks': 'SBUX',
  'Pfizer': 'PFE',
  'JPMorgan': 'JPM',
  'General Motors': 'GM',
  'Walmart': 'WMT',
  'Airbus': 'AIR.PA',
  'LVMH': 'MC.PA',
  'TotalEnergies': 'TTE.PA', 'Total': 'TTE.PA',
  'Sanofi': 'SAN.PA',
  'BNP Paribas': 'BNP.PA',
  'Société Générale': 'GLE.PA',
  'L\'Oréal': 'OR.PA', 'L\'Oreal': 'OR.PA',
  'Schneider Electric': 'SU.PA',
  'Vinci': 'DG.PA',
  'Danone': 'BN.PA',
};

// Turkish company names → stock symbol
const TURKISH_NAMES: Record<string, string> = {
  'Tesla': 'TSLA',
  'Apple': 'AAPL', 'Elma': 'AAPL',
  'Microsoft': 'MSFT',
  'Alphabet': 'GOOGL', 'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'Nvidia': 'NVDA',
  'Meta': 'META', 'Facebook': 'META',
  'Intel': 'INTC',
  'Netflix': 'NFLX',
  'Boeing': 'BA',
  'Ford': 'F',
  'Uber': 'UBER',
  'Disney': 'DIS',
  'Nike': 'NKE',
};

// Spanish company names → stock symbol
const SPANISH_NAMES: Record<string, string> = {
  'Tesla': 'TSLA',
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Alphabet': 'GOOGL', 'Google': 'GOOGL',
  'Amazon': 'AMZN',
  'Nvidia': 'NVDA',
  'Meta': 'META', 'Facebook': 'META',
  'Intel': 'INTC',
  'Netflix': 'NFLX',
  'Boeing': 'BA',
  'Ford': 'F',
  'Uber': 'UBER',
  'Disney': 'DIS',
  'Nike': 'NKE',
};

// دمج كل خرائط الأسماء (شركات + عملات رقمية + فوركس + معادن + سلع + مؤشرات)
const ALL_NAMES: Record<string, string> = {
  ...ARABIC_NAMES,
  ...ENGLISH_NAMES,
  ...FRENCH_NAMES,
  ...TURKISH_NAMES,
  ...SPANISH_NAMES,
  ...CRYPTO_NAMES_ALL_LANGS,
  ...FOREX_NAMES_ALL_LANGS,
  ...METAL_NAMES_ALL_LANGS,
  ...COMMODITY_NAMES_ALL_LANGS,
  ...INDEX_NAMES_ALL_LANGS,
};

// أزواج الكريبتو والفوركس والمعادن المدعومة
const CRYPTO_PAIRS = new Set([
  'BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','XRP/USDT',
  'ADA/USDT','DOGE/USDT','DOT/USDT','AVAX/USDT','LINK/USDT',
  'UNI/USDT','MATIC/USDT','LTC/USDT','ATOM/USDT','NEAR/USDT',
  'BTC/USD','ETH/USD','SOL/USD',
]);

const FOREX_PAIRS = new Set([
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD',
  'EUR/GBP','EUR/JPY','GBP/JPY',
]);

const METAL_PAIRS = new Set(['XAU/USD','XAG/USD','XPT/USD']);

/**
 * يحدد رابط الرمز
 */
function getLinkForSymbol(symbol: string): string | null {
  const s = symbol.toUpperCase().trim();

  // أزواج كريبتو/فوركس/معادن
  if (METAL_PAIRS.has(s) || CRYPTO_PAIRS.has(s) || FOREX_PAIRS.has(s)) {
    return `/markets?pair=${encodeURIComponent(s)}`;
  }

  // أسهم معروفة
  if (KNOWN_STOCKS.has(s)) {
    return `/stock-analysis/${s}`;
  }

  // أسهم مع لاحقة بورصة (.PA, .DE, .L, .T, .SR)
  if (/^[A-Z]{1,6}\.(PA|DE|L|T|SR|HK|TO|AX|MI|BR|NX|ST|HE|CO|WA|DC|KS|NS)$/.test(s)) {
    return `/stock-analysis/${s}`;
  }

  // مؤشرات عالمية → صفحة الأسواق
  const INDEX_SYMBOLS = new Set(['BVSP','XU100','SPX','IXIC','DJI','FTSE','FCHI','GDAXI','N225','HSI','SSEC','DXY','IBEX']);
  if (INDEX_SYMBOLS.has(s)) {
    return `/markets?index=${encodeURIComponent(s)}`;
  }

  // سلع → صفحة الأسواق
  if (s.includes('OIL') || s.includes('BRENT') || s.includes('NGAS') || s.includes('COPPER') || s.includes('WHEAT') || s.includes('CORN') || s.includes('COTTON') || s.includes('COFFEE') || s.includes('SUGAR')) {
    return `/markets?commodity=${encodeURIComponent(s)}`;
  }

  return null;
}

/**
 * يحوّل نص إلى عناصر React مع روابط للرموز
 * يدعم: [[META]], META (مستقل), BTC/USDT, تسلا, Tesla, Apple, إلخ
 * يزيل الأقواس [[ ]] تلقائياً
 * يدعم 5 لغات: العربية، الإنجليزية، الفرنسية، التركية، الإسبانية
 */
export function renderTextWithSymbolLinks(text: string): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  // بناء pattern من ALL_NAMES — نرتبها بالطول التنازلي لتجنب المطابقة الجزئية
  // مثلاً "General Motors" قبل "General"
  const sortedNames = Object.keys(ALL_NAMES).sort((a, b) => b.length - a.length);
  // escape الأسماء للاستخدام في regex
  const escapedNames = sortedNames.map(name =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const namesPattern = escapedNames.join('|');

  // Pattern يطابق (بالترتيب):
  // 1. [[SYMBOL]] markers
  // 2. أزواج كريبتو (BTC/USDT)
  // 3. أزواج فوركس (EUR/USD)
  // 4. معادن (XAU/USD)
  // 5. tickers مستقلة (2-6 أحرف كبيرة + optional .PA)
  // 6. أسماء شركات بكل اللغات
  // V1185: Arabic forex pairs added as explicit pattern (group 7) —
  // the namesPattern (group 6) may not match them reliably due to
  // the / character interacting with word boundaries.
  const pattern = new RegExp(
    '(\\[\\[[A-Z]{1,10}(?:\\.[A-Z]{2})?\\]\\])' +    // group 1: [[SYMBOL]]
    '|(\\b(?:BTC|ETH|SOL|BNB|XRP|ADA|DOGE|DOT|AVAX|LINK|UNI|MATIC|LTC|ATOM|NEAR)/(?:USDT|USD)\\b)' +  // group 2: crypto
    '|(\\b(?:EUR|GBP|USD|JPY|CHF|AUD|NZD|CAD)/(?:EUR|GBP|USD|JPY|CHF|AUD|NZD|CAD)\\b)' +  // group 3: forex
    '|(\\b(?:XAU|XAG|XPT)/(?:USD|USDT)\\b)' +  // group 4: metals
    '|(\\b[A-Z]{2,6}(?:\\.[A-Z]{2})?\\b)' +  // group 5: tickers
    `|(${namesPattern})` +  // group 6: company names (all languages)
    '|(دولار\\/ين|يورو\\/دولار|جنيه\\/دولار|دولار\\/ليرة|يورو\\/ليرة|دولار\\/بيزو|دولار\\/فرنك|دولار\\/كرون|دولار\\/يوان|دولار\\/روبية|دولار\\/راند|دولار\\/ريال|إسترليني\\/ين|يورو\\/ين|يورو\\/إسترليني)',  // group 7: Arabic forex pairs
    'g'
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    // أضف النص قبل المطابقة
    if (match.index > lastIndex) {
      nodes.push(remaining.slice(lastIndex, match.index));
    }

    const matchedText = match[0];
    let symbol = '';
    let displayText = '';
    let shouldLink = false;

    if (match[1]) {
      // [[SYMBOL]] — أزيل الأقواس
      symbol = match[1].replace(/\[\[|\]\]/g, '');
      displayText = symbol;
      shouldLink = true;
    } else if (match[2] || match[3] || match[4]) {
      // أزواج كريبتو/فوركس/معادن
      symbol = matchedText;
      displayText = matchedText;
      shouldLink = true;
    } else if (match[5]) {
      // ticker مستقل — تحقق من الـ whitelist
      const cleaned = match[5].replace(/\.[A-Z]{2}$/, '');
      if (KNOWN_STOCKS.has(cleaned)) {
        symbol = match[5];
        displayText = match[5];
        shouldLink = true;
      } else {
        nodes.push(matchedText);
        lastIndex = match.index + matchedText.length;
        continue;
      }
    } else if (match[6]) {
      // اسم شركة (بأي لغة)
      const mapped = ALL_NAMES[match[6]];
      if (mapped) {
        symbol = mapped;
        displayText = match[6]; // اعرض الاسم كما هو
        shouldLink = true;
      } else {
        nodes.push(matchedText);
        lastIndex = match.index + matchedText.length;
        continue;
      }
    } else if (match[7]) {
      // زوج فوركس عربي (group 7)
      const mapped = ALL_NAMES[match[7]];
      if (mapped) {
        symbol = mapped;
        displayText = match[7];
        shouldLink = true;
      } else {
        nodes.push(matchedText);
        lastIndex = match.index + matchedText.length;
        continue;
      }
    }

    if (shouldLink) {
      const link = getLinkForSymbol(symbol);
      if (link) {
        nodes.push(
          <Link
            key={`sym-${keyCounter++}`}
            href={link}
            className="symbol-link"
            style={{
              color: '#00E5FF',
              textDecoration: 'underline',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {displayText}
          </Link>
        );
      } else {
        nodes.push(displayText);
      }
    } else {
      nodes.push(matchedText);
    }

    lastIndex = match.index + matchedText.length;
  }

  // أضف باقي النص
  if (lastIndex < remaining.length) {
    nodes.push(remaining.slice(lastIndex));
  }

  return nodes;
}

/**
 * مكوّن React يعرض نصاً مع روابط رموز
 * يدعم فقرات متعددة (مفصولة بـ \n\n)
 */
export function SymbolLinkedText({ text, paragraphStyle }: { text: string; paragraphStyle?: React.CSSProperties }) {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: '14px', ...(paragraphStyle || {}) }}>
          {renderTextWithSymbolLinks(para)}
        </p>
      ))}
    </>
  );
}
