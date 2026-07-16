// ═══════════════════════════════════════════════════════════════
// SEC EDGAR Adapter
// ═══════════════════════════════════════════════════════════════
// Fetches recent 8-K, 10-K, S-1, Form 4, SC 13D/13G filings
// for watched companies. SEC requires User-Agent with contact info.
//
// API: https://data.sec.gov/submissions/CIK{10digit}.json
// Rate limit: max 10 req/sec (we use 200ms interval)
// ═══════════════════════════════════════════════════════════════

import type { RawEvent, FetchResult, Category } from '../lib/types';
import { AGENCY_USER_AGENT, FETCH_TIMEOUT_MS } from '../lib/types';

interface WatchedCompany {
  cik: string;        // 10-digit CIK with leading zeros
  ticker: string;
  name: string;
  nameAr: string;
}

// 16 major companies — same list from V1083
export const WATCHED_COMPANIES: WatchedCompany[] = [
  { cik: '0000320193', ticker: 'AAPL', name: 'Apple Inc.', nameAr: 'آبل' },
  { cik: '0000789019', ticker: 'MSFT', name: 'Microsoft Corp.', nameAr: 'مايكروسوفت' },
  { cik: '0001652044', ticker: 'GOOGL', name: 'Alphabet Inc.', nameAr: 'ألفابت' },
  { cik: '0001018724', ticker: 'AMZN', name: 'Amazon.com Inc.', nameAr: 'أمازون' },
  { cik: '0001045810', ticker: 'NVDA', name: 'NVIDIA Corp.', nameAr: 'إنفيديا' },
  { cik: '0001318605', ticker: 'TSLA', name: 'Tesla Inc.', nameAr: 'تسلا' },
  { cik: '0001326801', ticker: 'META', name: 'Meta Platforms Inc.', nameAr: 'ميتا' },
  { cik: '0000051143', ticker: 'INTC', name: 'Intel Corp.', nameAr: 'إنتل' },
  { cik: '0000002488', ticker: 'AMD', name: 'Advanced Micro Devices', nameAr: 'إيه إم دي' },
  { cik: '0000019617', ticker: 'JPM', name: 'JPMorgan Chase', nameAr: 'جي بي مورغان' },
  { cik: '0000070858', ticker: 'BAC', name: 'Bank of America', nameAr: 'بنك أوف أمريكا' },
  { cik: '0000886982', ticker: 'GS', name: 'Goldman Sachs Group', nameAr: 'غولدمان ساكس' },
  { cik: '0001403161', ticker: 'V', name: 'Visa Inc.', nameAr: 'فيزا' },
  { cik: '0001141391', ticker: 'MA', name: 'Mastercard Inc.', nameAr: 'ماستركارد' },
  { cik: '0000034088', ticker: 'XOM', name: 'Exxon Mobil', nameAr: 'إكسون موبيل' },
  { cik: '0001598460', ticker: 'BRK', name: 'Berkshire Hathaway', nameAr: 'بيركشاير هاثاواي' },
];

// Filings we consider news-worthy
const NEWSWORTHY_FORMS = new Set(['8-K', '8-K/A', 'S-1', 'S-1/A', '4', 'SC 13D', 'SC 13G']);

const FORM_DESCRIPTIONS: Record<string, string> = {
  '8-K': 'تقرير حالي يُعلن أحداثاً جوهرية يجب أن يعرفها المساهمون (استحواذ، إفلاس، تغيير إدارة، تغيير مدقق الحسابات)',
  '8-K/A': 'تعديل لتقرير حالي سابق 8-K',
  'S-1': 'بيان تسجيل أولي تُقدمه شركة تخطط لإدراج أسهمها (طرح عام أولي IPO)',
  'S-1/A': 'تعديل لبيان تسجيل S-1',
  '4': 'بيان تغيرات في الملكية المفيدة (تداول داخلي — مسؤولون/مديرون/مستثمرون ≥10% يشترون أو يبيعون)',
  'SC 13D': 'تقرير ملكية مفيدة يُقدم عند استحواذ مستثمر على 5% أو أكثر من أسهم شركة',
  'SC 13G': 'تقرير ملكية مفيدة يُقدم من مستثمرين سلبيين يكتسبون 5% أو أكثر',
};

interface SECSubmission {
  form: string;
  filingDate: string;
  accessionNumber: string;
  primaryDocDescription?: string;
  items?: string;
  primaryDocument?: string;
}

interface SECSubmissionsResponse {
  filings?: {
    recent?: SECSubmission;
  };
  name?: string;
  tickers?: string[];
  entityName?: string;
}

// ─── Rate limiter: 200ms between SEC requests (max 10/sec) ───
let lastSECRequest = 0;
const SEC_MIN_INTERVAL_MS = 200;

async function enforceSECRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastSECRequest;
  if (elapsed < SEC_MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, SEC_MIN_INTERVAL_MS - elapsed));
  }
  lastSECRequest = Date.now();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getFormArabicDescription(formType: string): string {
  return FORM_DESCRIPTIONS[formType] || 'إيداع تنظيمي لدى لجنة الأوراق المالية الأمريكية';
}

function getFilingUrl(cik: string, accessionNumber: string): string {
  const accessionNoDash = accessionNumber.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionNoDash}/${accessionNumber}-index.htm`;
}

function getCategoryForForm(formType: string): Category {
  // Form 4 / SC 13D / SC 13G = insider/investor moves = stocks
  // 8-K / S-1 = corporate events = stocks
  return 'stocks';
}

/**
 * Fetch recent filings for a single company
 */
async function fetchCompanyFilings(company: WatchedCompany, since: Date, maxFilings = 3): Promise<RawEvent[]> {
  await enforceSECRateLimit();

  const url = `https://data.sec.gov/submissions/CIK${company.cik}.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': AGENCY_USER_AGENT,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err: any) {
    throw new Error(`fetch failed: ${err.message?.slice(0, 60)}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: SECSubmissionsResponse = await response.json();
  const recent = data.filings?.recent;

  if (!recent || !Array.isArray(recent.form)) {
    return [];
  }

  const events: RawEvent[] = [];
  let filingCount = 0;

  for (let i = 0; i < recent.form.length && filingCount < maxFilings; i++) {
    const formType = recent.form[i];
    if (!NEWSWORTHY_FORMS.has(formType)) continue;

    const filingDateStr = recent.filingDate?.[i];
    const accessionNumber = recent.accessionNumber?.[i];
    if (!filingDateStr || !accessionNumber) continue;

    const filingDate = new Date(filingDateStr);
    if (isNaN(filingDate.getTime())) continue;
    if (filingDate < since) continue;

    const primaryDocDescription = recent.primaryDocDescription?.[i] || '';
    const items = recent.items?.[i] || '';
    const filingUrl = getFilingUrl(company.cik, accessionNumber);

    const title = `${company.name} files ${formType} with SEC`;
    const arabicDesc = getFormArabicDescription(formType);

    const rawContent = `${company.name} (${company.ticker}) filed form ${formType} with the U.S. Securities and Exchange Commission on ${filingDateStr}.

Filing details:
- Form type: ${formType}
- Accession number: ${accessionNumber}
- Description: ${primaryDocDescription || 'Not specified'}
- Items reported: ${items || 'Not specified'}

Form ${formType} is ${arabicDesc}.

This filing is available on SEC EDGAR at: ${filingUrl}`;

    events.push({
      sourceId: 'SEC',
      externalId: accessionNumber,
      sourceName: 'SEC EDGAR',
      url: filingUrl,
      eventType: 'filing',
      title,
      rawContent,
      category: getCategoryForForm(formType),
      locale: 'ar',
      publishedAtSource: filingDate,
    });
    filingCount++;
  }

  return events;
}

/**
 * Fetch recent SEC filings for all watched companies
 */
export async function fetchSECEDGAR(since: Date): Promise<FetchResult> {
  const startTime = Date.now();
  const allEvents: RawEvent[] = [];
  const errors: string[] = [];

  for (const company of WATCHED_COMPANIES) {
    try {
      const events = await fetchCompanyFilings(company, since);
      allEvents.push(...events);
    } catch (err: any) {
      errors.push(`${company.ticker}: ${err.message?.slice(0, 60)}`);
    }
  }

  return {
    source: 'SEC',
    events: allEvents,
    errors,
    durationMs: Date.now() - startTime,
  };
}
