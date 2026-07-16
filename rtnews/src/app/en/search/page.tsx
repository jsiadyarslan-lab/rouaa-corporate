// ─── Semantic Search Page (English) ──────────────────────────────
// Full-page search with auto-search from URL ?q= parameter
// Uses /api/search/semantic which returns 'score' (not 'similarity')

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsImage from '@/components/rouaa/NewsImage';

interface SearchResult {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  category: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  impactLevel?: 'high' | 'medium' | 'low';
  publishedAt?: string;
  slug?: string;
  score: number; // API returns 'score', NOT 'similarity'
}

function EnSearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(searchTerm.trim())}&limit=20`);
      const data = await res.json();

      if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search from URL ?q= parameter when page loads
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim().length >= 2) {
      setQuery(q.trim());
      performSearch(q.trim());
    }
  }, [searchParams, performSearch]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;
    performSearch(query.trim());
  };

  const handleResultClick = (result: SearchResult) => {
    const pathSegment = result.slug || result.id;
    if (!pathSegment || typeof pathSegment !== 'string' || pathSegment === 'undefined' || pathSegment === 'null') return;
    router.push(`/en/news/${pathSegment}`);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  const getImpactLabel = (impact: string | undefined) => {
    if (impact === 'high') return 'High Impact';
    if (impact === 'medium') return 'Medium Impact';
    return 'Low Impact';
  };

  const getImpactColor = (impact: string | undefined) => {
    if (impact === 'high') return 'text-red-400';
    if (impact === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSentimentLabel = (sentiment: string | undefined) => {
    if (sentiment === 'positive') return 'Positive';
    if (sentiment === 'negative') return 'Negative';
    return 'Neutral';
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }} dir="ltr">
      {/* Search Header */}
      <section className="pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[860px] mx-auto px-4">
          <h1 className="font-heading text-[30px] font-bold mb-6" style={{ color: 'var(--text)' }}>
            Semantic Search
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search financial news..."
              className="flex-1 px-4 py-3 rounded-xl text-base"
              style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }}
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold"
              style={{ background: 'var(--cyan)', color: 'white', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searched && (
            <div className="mt-4 text-sm" style={{ color: 'var(--text3)' }}>
              {results.length === 0 ? 'No results found' : `${results.length} results found`}
            </div>
          )}
        </div>
      </section>

      {/* Search Results */}
      <section className="py-6">
        <div className="max-w-[860px] mx-auto px-4 space-y-4">
          {results.map((result) => {
            const matchScore = Math.round((result.score ?? 0) * 100);
            // For English locale, prefer English title; fallback to Arabic
            const displayTitle = result.title || result.titleAr || '';
            const displaySummary = result.summary || result.summaryAr || '';

            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full text-left glass-card p-5 rounded-2xl transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {result.category && (
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                          {result.category}
                        </span>
                      )}
                      {result.impactLevel && (
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.1)', color: getImpactColor(result.impactLevel) }}>
                          {getImpactLabel(result.impactLevel)}
                        </span>
                      )}
                      {result.sentiment && (
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.1)' }}>
                          {getSentimentLabel(result.sentiment)}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">Relevance: {matchScore}%</span>
                    </div>
                    <h3 className="text-[16px] font-semibold mb-2 leading-relaxed" style={{ color: 'var(--text)' }}>
                      {displayTitle}
                    </h3>
                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--text3)' }}>
                      {displaySummary}
                    </p>
                    {result.publishedAt && (
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text3)' }}>
                        <span>{formatDate(result.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <NewsImage
                      src={result.imageUrl}
                      alt={displayTitle || 'Search result image'}
                      category={result.category}
                      width={80}
                      height={80}
                      style={{ width: '80px', height: '80px' }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default function EnSearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pb-16 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-3" style={{ color: 'var(--cyan)' }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ color: 'var(--text3)' }}>Loading...</span>
        </div>
      </main>
    }>
      <EnSearchPageContent />
    </Suspense>
  );
}
