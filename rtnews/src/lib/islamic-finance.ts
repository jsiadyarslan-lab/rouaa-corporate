// ─── Islamic Finance Data Module V62 ────────────────────────
// Provides data about Islamic finance instruments, indices,
// sukuk, and Shariah compliance criteria

// ─── Islamic Indices ────────────────────────────────────────

export interface IslamicIndex {
  symbol: string;
  name: string;
  nameAr: string;
  provider: string;
  description: string;
  descriptionAr: string;
  baseValue: number;
  valueRange: [number, number];
  country: string;
}

export const ISLAMIC_INDICES: IslamicIndex[] = [
  {
    symbol: 'DJIM',
    name: 'Dow Jones Islamic Market Index',
    nameAr: 'مؤشر داو جونز الإسلامي',
    provider: 'S&P Dow Jones',
    description: 'A global index of Shariah-compliant stocks',
    descriptionAr: 'مؤشر عالمي للأسهم المتوافقة مع الشريعة الإسلامية',
    baseValue: 5200,
    valueRange: [4800, 5600],
    country: 'Global',
  },
  {
    symbol: 'SPSHI',
    name: 'S&P Shariah Index',
    nameAr: 'مؤشر S&P الشرعي',
    provider: 'S&P',
    description: 'Shariah-compliant version of S&P 500',
    descriptionAr: 'النسخة المتوافقة مع الشريعة من مؤشر S&P 500',
    baseValue: 4100,
    valueRange: [3700, 4500],
    country: 'US',
  },
  {
    symbol: 'TASI-ISM',
    name: 'Tadawul Islamic Index',
    nameAr: 'مؤشر تداول الإسلامي',
    provider: 'Tadawul',
    description: 'Shariah-compliant stocks on Saudi exchange',
    descriptionAr: 'الأسهم المتوافقة مع الشريعة في السوق السعودية',
    baseValue: 9800,
    valueRange: [8500, 11000],
    country: 'SA',
  },
  {
    symbol: 'FTSE-SHR',
    name: 'FTSE Shariah Global Equity Index',
    nameAr: 'مؤشر FTSE الشرعي العالمي',
    provider: 'FTSE Russell',
    description: 'Global Shariah-compliant equity index',
    descriptionAr: 'مؤشر عالمي للأسهم المتوافقة مع الشريعة',
    baseValue: 3200,
    valueRange: [2800, 3600],
    country: 'Global',
  },
  {
    symbol: 'DFM-SHR',
    name: 'DFM Shariah Index',
    nameAr: 'مؤشر سوق دبي الشرعي',
    provider: 'DFM',
    description: 'Shariah-compliant stocks on Dubai exchange',
    descriptionAr: 'الأسهم المتوافقة مع الشريعة في سوق دبي المالي',
    baseValue: 2800,
    valueRange: [2400, 3200],
    country: 'AE',
  },
  {
    symbol: 'MSI-EA',
    name: 'MSCI Islamic EAFE Index',
    nameAr: 'مؤشر MSCI الإسلامي لأوروبا وأستراليا والشرق الأقصى',
    provider: 'MSCI',
    description: 'International Shariah-compliant equity index',
    descriptionAr: 'مؤشر دولي للأسهم المتوافقة مع الشريعة',
    baseValue: 2800,
    valueRange: [2500, 3100],
    country: 'Global',
  },
];

// ─── Sukuk Data ─────────────────────────────────────────────

export interface SukukInstrument {
  name: string;
  nameAr: string;
  issuer: string;
  issuerAr: string;
  country: string;
  amount: number; // in billions USD
  currency: string;
  maturity: string;
  yield: number;
  rating: string;
  type: string; // sovereign, corporate, mixed
}

export const SUKUK_DATA: SukukInstrument[] = [
  {
    name: 'Saudi Arabia Sovereign Sukuk',
    nameAr: 'صكوك حكومة المملكة العربية السعودية',
    issuer: 'Kingdom of Saudi Arabia',
    issuerAr: 'المملكة العربية السعودية',
    country: 'SA',
    amount: 12.5,
    currency: 'USD',
    maturity: '2030',
    yield: 4.25,
    rating: 'A+',
    type: 'sovereign',
  },
  {
    name: 'UAE Sovereign Sukuk',
    nameAr: 'صكوك حكومة الإمارات',
    issuer: 'United Arab Emirates',
    issuerAr: 'الإمارات العربية المتحدة',
    country: 'AE',
    amount: 8.0,
    currency: 'USD',
    maturity: '2029',
    yield: 4.10,
    rating: 'AA-',
    type: 'sovereign',
  },
  {
    name: 'Qatar Sovereign Sukuk',
    nameAr: 'صكوك حكومة قطر',
    issuer: 'State of Qatar',
    issuerAr: 'دولة قطر',
    country: 'QA',
    amount: 6.0,
    currency: 'USD',
    maturity: '2031',
    yield: 4.35,
    rating: 'AA-',
    type: 'sovereign',
  },
  {
    name: 'IDB Development Sukuk',
    nameAr: 'صكوك البنك الإسلامي للتنمية',
    issuer: 'Islamic Development Bank',
    issuerAr: 'البنك الإسلامي للتنمية',
    country: 'Multilateral',
    amount: 3.5,
    currency: 'USD',
    maturity: '2028',
    yield: 3.85,
    rating: 'AAA',
    type: 'sovereign',
  },
  {
    name: 'Aramco Sukuk',
    nameAr: 'صكوك أرامكو',
    issuer: 'Saudi Aramco',
    issuerAr: 'أرامكو السعودية',
    country: 'SA',
    amount: 6.0,
    currency: 'USD',
    maturity: '2029',
    yield: 4.50,
    rating: 'A+',
    type: 'corporate',
  },
  {
    name: 'Emirates NBD Sukuk',
    nameAr: 'صكوك بنك الإمارات دبي الوطني',
    issuer: 'Emirates NBD',
    issuerAr: 'بنك الإمارات دبي الوطني',
    country: 'AE',
    amount: 2.5,
    currency: 'USD',
    maturity: '2028',
    yield: 4.65,
    rating: 'A+',
    type: 'corporate',
  },
  {
    name: 'Dubai Islamic Bank Sukuk',
    nameAr: 'صكوك بنك دبي الإسلامي',
    issuer: 'Dubai Islamic Bank',
    issuerAr: 'بنك دبي الإسلامي',
    country: 'AE',
    amount: 1.5,
    currency: 'USD',
    maturity: '2027',
    yield: 4.75,
    rating: 'A',
    type: 'corporate',
  },
  {
    name: 'Kuwait Sovereign Sukuk',
    nameAr: 'صكوك حكومة الكويت',
    issuer: 'State of Kuwait',
    issuerAr: 'دولة الكويت',
    country: 'KW',
    amount: 3.0,
    currency: 'USD',
    maturity: '2030',
    yield: 4.15,
    rating: 'AA',
    type: 'sovereign',
  },
];

// ─── Shariah Compliance Screening ───────────────────────────

export interface ShariahScreeningCriteria {
  criterion: string;
  criterionAr: string;
  description: string;
  descriptionAr: string;
  threshold: number;
  unit: string;
}

export const HALAL_SCREENING: ShariahScreeningCriteria[] = [
  {
    criterion: 'Business Activity',
    criterionAr: 'النشاط التجاري',
    description: 'Core business must be Halal (no alcohol, gambling, pork, conventional banking, etc.)',
    descriptionAr: 'يجب أن يكون النشاط الأساسي حلالاً (لا كحول، مقامرة، لحم خنزير، بنك تقليدي، إلخ)',
    threshold: 5,
    unit: '% max from non-compliant sources',
  },
  {
    criterion: 'Interest-Bearing Debt',
    criterionAr: 'الدين بفائدة',
    description: 'Interest-bearing debt must not exceed threshold of total assets',
    descriptionAr: 'يجب ألا تتجاوز الديون بفائدة النسبة المئوية من إجمالي الأصول',
    threshold: 33,
    unit: '% of total assets',
  },
  {
    criterion: 'Interest Income',
    criterionAr: 'الدخل من الفائدة',
    description: 'Income from interest must not exceed threshold',
    descriptionAr: 'يجب ألا يتجاوز الدخل من الفائدة النسبة المحددة',
    threshold: 5,
    unit: '% of total revenue',
  },
  {
    criterion: 'Liquid Assets',
    criterionAr: 'الأصول السائلة',
    description: 'Liquid assets ratio for purification calculation',
    descriptionAr: 'نسبة الأصول السائلة لحساب التطهير',
    threshold: 33,
    unit: '% of market cap',
  },
  {
    criterion: 'Impure Income',
    criterionAr: 'الدخل غير النقي',
    description: 'Total impure income requiring purification',
    descriptionAr: 'إجمالي الدخل غير النقي الذي يتطلب التطهير',
    threshold: 5,
    unit: '% of total revenue',
  },
];

// ─── Islamic Finance Overview ───────────────────────────────

export interface IslamicFinanceData {
  islamicIndices: IslamicIndex[];
  sukukData: SukukInstrument[];
  screeningCriteria: ShariahScreeningCriteria[];
  totalSukukVolume: number;
  totalSukukByCountry: Record<string, number>;
  averageSukukYield: number;
  sovereignSukukCount: number;
  corporateSukukCount: number;
}

export function getIslamicFinanceOverview(): IslamicFinanceData {
  const totalSukukVolume = SUKUK_DATA.reduce((sum, s) => sum + s.amount, 0);

  const totalSukukByCountry: Record<string, number> = {};
  for (const s of SUKUK_DATA) {
    totalSukukByCountry[s.country] = (totalSukukByCountry[s.country] || 0) + s.amount;
  }

  const averageSukukYield = SUKUK_DATA.reduce((sum, s) => sum + s.yield, 0) / SUKUK_DATA.length;

  return {
    islamicIndices: ISLAMIC_INDICES,
    sukukData: SUKUK_DATA,
    screeningCriteria: HALAL_SCREENING,
    totalSukukVolume,
    totalSukukByCountry,
    averageSukukYield,
    sovereignSukukCount: SUKUK_DATA.filter(s => s.type === 'sovereign').length,
    corporateSukukCount: SUKUK_DATA.filter(s => s.type === 'corporate').length,
  };
}

// ─── Gulf Market Exchange Info ──────────────────────────────

export interface GulfExchange {
  code: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  currency: string;
  tradingHours: string;
  tradingDays: string;
  established: number;
  marketCap: string;
  listedCompanies: number;
  website: string;
  islamicIndices: string[];
}

export const GULF_EXCHANGES: GulfExchange[] = [
  {
    code: 'TADAWUL',
    name: 'Saudi Stock Exchange (Tadawul)',
    nameAr: 'السوق المالية السعودية (تداول)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    currency: 'SAR',
    tradingHours: '10:00 - 15:00',
    tradingDays: 'الأحد - الخميس',
    established: 2007,
    marketCap: '$3.2T',
    listedCompanies: 223,
    website: 'www.saudiexchange.sa',
    islamicIndices: ['TASI-ISM'],
  },
  {
    code: 'DFM',
    name: 'Dubai Financial Market',
    nameAr: 'سوق دبي المالي',
    country: 'UAE',
    countryAr: 'الإمارات العربية المتحدة',
    currency: 'AED',
    tradingHours: '10:00 - 14:00',
    tradingDays: 'الإثنين - الجمعة',
    established: 2000,
    marketCap: '$190B',
    listedCompanies: 68,
    website: 'www.dfm.ae',
    islamicIndices: ['DFM-SHR'],
  },
  {
    code: 'ADX',
    name: 'Abu Dhabi Securities Exchange',
    nameAr: 'سوق أبوظبي للأوراق المالية',
    country: 'UAE',
    countryAr: 'الإمارات العربية المتحدة',
    currency: 'AED',
    tradingHours: '10:00 - 14:00',
    tradingDays: 'الإثنين - الجمعة',
    established: 2000,
    marketCap: '$780B',
    listedCompanies: 85,
    website: 'www.adx.ae',
    islamicIndices: [],
  },
  {
    code: 'KSE',
    name: 'Kuwait Stock Exchange',
    nameAr: 'بورصة الكويت',
    country: 'Kuwait',
    countryAr: 'دولة الكويت',
    currency: 'KWD',
    tradingHours: '09:00 - 13:30',
    tradingDays: 'الأحد - الخميس',
    established: 1977,
    marketCap: '$130B',
    listedCompanies: 195,
    website: 'www.boursakuwait.com.kw',
    islamicIndices: [],
  },
  {
    code: 'QE',
    name: 'Qatar Stock Exchange',
    nameAr: 'بورصة قطر',
    country: 'Qatar',
    countryAr: 'دولة قطر',
    currency: 'QAR',
    tradingHours: '09:00 - 13:00',
    tradingDays: 'الأحد - الخميس',
    established: 1997,
    marketCap: '$175B',
    listedCompanies: 49,
    website: 'www.qe.com.qa',
    islamicIndices: [],
  },
  {
    code: 'BSE',
    name: 'Bahrain Bourse',
    nameAr: 'بورصة البحرين',
    country: 'Bahrain',
    countryAr: 'مملكة البحرين',
    currency: 'BHD',
    tradingHours: '09:30 - 13:00',
    tradingDays: 'الأحد - الخميس',
    established: 1987,
    marketCap: '$19B',
    listedCompanies: 42,
    website: 'www.bahrainbourse.net',
    islamicIndices: [],
  },
  {
    code: 'MSM',
    name: 'Muscat Securities Market',
    nameAr: 'سوق مسقط للأوراق المالية',
    country: 'Oman',
    countryAr: 'سلطنة عمان',
    currency: 'OMR',
    tradingHours: '10:00 - 14:00',
    tradingDays: 'الأحد - الخميس',
    established: 1989,
    marketCap: '$30B',
    listedCompanies: 118,
    website: 'www.msm.gov.om',
    islamicIndices: [],
  },
  {
    code: 'EGX',
    name: 'Egyptian Exchange',
    nameAr: 'البورصة المصرية',
    country: 'Egypt',
    countryAr: 'جمهورية مصر العربية',
    currency: 'EGP',
    tradingHours: '10:00 - 14:30',
    tradingDays: 'الأحد - الخميس',
    established: 1883,
    marketCap: '$45B',
    listedCompanies: 227,
    website: 'www.egx.com.eg',
    islamicIndices: [],
  },
];

// ─── Country emoji flags ────────────────────────────────────

export const COUNTRY_FLAGS: Record<string, string> = {
  SA: '🇸🇦',
  AE: '🇦🇪',
  KW: '🇰🇼',
  QA: '🇶🇦',
  BH: '🇧🇭',
  OM: '🇴🇲',
  EG: '🇪🇬',
};
