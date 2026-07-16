'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface SearchFacets {
  reportTypes: string[];
  scopes: string[];
  assetClasses: string[];
}

interface SearchResult {
  type: 'economic_report' | 'market_analysis';
  id: string;
  title: string;
  slug: string;
  summary?: string;
  reportType?: string;
  scope?: string;
  marketImpact?: string;
  assetClass?: string;
  analysisType?: string;
  timeFrame?: string;
  riskLevel?: string;
  sentiment?: string;
  confidenceScore: number;
  views: number;
  publishedAt: string;
  createdAt: string;
  sectors?: string[];
  countries?: string[];
}

const TYPE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-Annual',
  annual: 'Annual',
  strategic: 'Strategic',
  special: 'Special',
  daily: 'Daily',
};

const SCOPE_LABELS: Record<string, string> = {
  regional: 'Regional',
  global: 'Global',
  local: 'Local',
  arabic: 'Arabic',
};

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  commodities: 'Commodities',
  forex: 'Forex',
  crypto: 'Crypto',
  bonds: 'Bonds',
  indices: 'Indices',
  strategic: 'Strategic Reports',
  energy: 'Energy',
  realEstate: 'Real Estate',
  economy: 'Macro Economy',
  banking: 'Banks',
  technicalAnalysis: 'Technical Analysis',
  arabMarkets: 'Arab Markets',
  earnings: 'Earnings',
};

const IMPACT_COLORS: Record<string, string> = {
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#F59E0B',
};

const SENTIMENT_LABELS: Record<string, string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
};

export default function EnSearchReportsClient({ initialFacets }: { initialFacets: SearchFacets }) {
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('');
  const [scope, setScope] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [sort, setSort] = useState('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState({ reports: 0, analyses: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (p: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (reportType) params.set('reportType', reportType);
      if (scope) params.set('scope', scope);
      if (assetClass) params.set('category', assetClass);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('sort', sort);
      params.set('page', String(p));
      params.set('limit', '12');
      params.set('locale', 'en');

      const res = await fetch(`/api/reports/search?${params}`);
      const data = await res.json();

      if (res.ok) {
        setResults(data.results || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
        setBreakdown(data.breakdown || { reports: 0, analyses: 0 });
        setPage(p);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [query, reportType, scope, assetClass, dateFrom, dateTo, sort]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || reportType || scope || assetClass) {
        doSearch(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, reportType, scope, assetClass, sort, dateFrom, dateTo, doSearch]);

  return (
    <div className="min-h-screen" style={{ direction: 'ltr' }}>
      {/* Header */}
      <div className="py-8 px-4" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(139,92,246,0.05))' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Search Reports & Analyses
          </h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            Search all published economic reports and financial analyses
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports and analyses..."
              className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: showFilters ? 'rgba(0,229,255,0.1)' : 'var(--bg2)',
              border: `1px solid ${showFilters ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
              color: showFilters ? 'var(--cyan)' : 'var(--text2)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl space-y-4"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Report Type */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="">All</option>
                  {initialFacets.reportTypes.map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="">All</option>
                  {initialFacets.scopes.map(s => (
                    <option key={s} value={s}>{SCOPE_LABELS[s] || s}</option>
                  ))}
                </select>
              </div>

              {/* Asset Class */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>Asset Class</label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="">All</option>
                  {initialFacets.assetClasses.map(a => (
                    <option key={a} value={a}>{ASSET_LABELS[a] || a}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="date">Latest</option>
                  <option value="confidence">Confidence Level</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text3)' }}>To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setReportType('');
                  setScope('');
                  setAssetClass('');
                  setDateFrom('');
                  setDateTo('');
                  setSort('date');
                }}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--cyan)', background: 'rgba(0,229,255,0.08)' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {searched && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              {loading ? 'Searching...' : (
                <>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>{total}</span> results
                  {query && <> for &quot;{query}&quot;</>}
                  {' '}({breakdown.reports} reports, {breakdown.analyses} analyses)
                </>
              )}
            </p>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="h-4 rounded mb-3 w-3/4" style={{ background: 'var(--border)' }} />
                <div className="h-3 rounded mb-2 w-full" style={{ background: 'var(--border)' }} />
                <div className="h-3 rounded mb-4 w-2/3" style={{ background: 'var(--border)' }} />
                <div className="flex gap-2">
                  <div className="h-5 w-14 rounded-full" style={{ background: 'var(--border)' }} />
                  <div className="h-5 w-14 rounded-full" style={{ background: 'var(--border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={`/en/reports/${result.slug}`}
                  className="block rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] group"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: result.type === 'economic_report' ? 'rgba(0,229,255,0.12)' : 'rgba(139,92,246,0.12)',
                        color: result.type === 'economic_report' ? 'var(--cyan)' : 'var(--purple)',
                        border: `1px solid ${result.type === 'economic_report' ? 'rgba(0,229,255,0.2)' : 'rgba(139,92,246,0.2)'}`,
                      }}>
                      {result.type === 'economic_report' ? 'Report' : 'Analysis'}
                    </span>
                    {result.reportType && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg)', color: 'var(--text3)' }}>
                        {TYPE_LABELS[result.reportType] || result.reportType}
                      </span>
                    )}
                    {result.assetClass && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg)', color: 'var(--text3)' }}>
                        {ASSET_LABELS[result.assetClass] || result.assetClass}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors"
                    style={{ color: 'var(--text)' }}>
                    {result.title}
                  </h3>

                  {/* Summary */}
                  {result.summary && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text2)' }}>
                      {result.summary}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text3)' }}>
                    {/* Impact/Sentiment */}
                    {result.marketImpact && (
                      <span className="flex items-center gap-1"
                        style={{ color: IMPACT_COLORS[result.marketImpact] || 'var(--text3)' }}>
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: IMPACT_COLORS[result.marketImpact] || 'var(--text3)' }} />
                        {result.marketImpact === 'bullish' ? 'Bullish' : result.marketImpact === 'bearish' ? 'Bearish' : 'Neutral'}
                      </span>
                    )}
                    {result.sentiment && (
                      <span className="flex items-center gap-1"
                        style={{ color: IMPACT_COLORS[result.sentiment] || 'var(--text3)' }}>
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: IMPACT_COLORS[result.sentiment] || 'var(--text3)' }} />
                        {SENTIMENT_LABELS[result.sentiment] || result.sentiment}
                      </span>
                    )}

                    {/* Confidence */}
                    <span>Confidence: {result.confidenceScore}%</span>

                    {/* Views */}
                    {result.views > 0 && (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {result.views}
                      </span>
                    )}

                    {/* Date */}
                    {result.publishedAt && (
                      <span>{new Date(result.publishedAt).toLocaleDateString('en-US')}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => doSearch(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 transition-all"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                >
                  Previous
                </button>
                <span className="text-sm px-3" style={{ color: 'var(--text3)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => doSearch(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 transition-all"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : searched ? (
          <div className="text-center py-16">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>No results found</h3>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Try different keywords or adjust the filters
            </p>
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Start Searching</h3>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Enter a word or phrase to search reports and analyses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
