'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getLocalePath } from '@/lib/locale';
import { t } from '@/lib/i18n/stock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  BarChart3,
  Layers,
} from 'lucide-react';

interface ScreenerClientProps {
  locale: string;
}

// Labels imported from @/lib/i18n/stock — shared across all stock components

const MARKET_TYPE_OPTIONS = [
  { value: 'all', label: { en: 'All Markets', ar: 'كل الأسواق', fr: 'Tous les marchés', tr: 'Tüm Pazarlar' } },
  { value: 'sp500', label: { en: 'S&P 500', ar: 'إس آند بي 500', fr: 'S&P 500', tr: 'S&P 500' } },
  { value: 'cac40', label: { en: 'CAC 40', ar: 'كاك 40', fr: 'CAC 40', tr: 'CAC 40' } },
  { value: 'dax', label: { en: 'DAX', ar: 'داكس', fr: 'DAX', tr: 'DAX' } },
  { value: 'ftse', label: { en: 'FTSE 100', ar: 'فتسي 100', fr: 'FTSE 100', tr: 'FTSE 100' } },
  { value: 'nikkei', label: { en: 'Nikkei 225', ar: 'نيكي 225', fr: 'Nikkei 225', tr: 'Nikkei 225' } },
  { value: 'tadawul', label: { en: 'Tadawul', ar: 'تداول', fr: 'Tadawul', tr: 'Tadawul' } },
];

const MARKET_CAP_OPTIONS = [
  { value: 'all', label: { en: 'Any', ar: 'أي', fr: 'Tout', tr: 'Herhangi' } },
  { value: 'micro', label: { en: 'Micro (<$300M)', ar: 'صغير جداً (<$300M)', fr: 'Micro (<$300M)', tr: 'Mikro (<$300M)' } },
  { value: 'small', label: { en: 'Small ($300M-$2B)', ar: 'صغير ($300M-$2B)', fr: 'Small ($300M-$2B)', tr: 'Küçük ($300M-$2B)' } },
  { value: 'mid', label: { en: 'Mid ($2B-$10B)', ar: 'متوسط ($2B-$10B)', fr: 'Mid ($2B-$10B)', tr: 'Orta ($2B-$10B)' } },
  { value: 'large', label: { en: 'Large ($10B-$200B)', ar: 'كبير ($10B-$200B)', fr: 'Large ($10B-$200B)', tr: 'Büyük ($10B-$200B)' } },
  { value: 'mega', label: { en: 'Mega (>$200B)', ar: 'ضخم (>$200B)', fr: 'Méga (>$200B)', tr: 'Mega (>$200B)' } },
];

const PE_OPTIONS = [
  { value: 'all', label: { en: 'Any', ar: 'أي', fr: 'Tout', tr: 'Herhangi' } },
  { value: 'low', label: { en: 'Low (<15)', ar: 'منخفض (<15)', fr: 'Bas (<15)', tr: 'Düşük (<15)' } },
  { value: 'mid', label: { en: 'Mid (15-25)', ar: 'متوسط (15-25)', fr: 'Moyen (15-25)', tr: 'Orta (15-25)' } },
  { value: 'high', label: { en: 'High (>25)', ar: 'مرتفع (>25)', fr: 'Élevé (>25)', tr: 'Yüksek (>25)' } },
];

const SORT_OPTIONS = [
  { value: 'marketCap', label: { en: 'Market Cap', ar: 'القيمة السوقية', fr: 'Cap. Boursière', tr: 'Piyasa Değeri' } },
  { value: 'price', label: { en: 'Price', ar: 'السعر', fr: 'Prix', tr: 'Fiyat' } },
  { value: 'changePercent', label: { en: 'Change %', ar: 'التغير %', fr: 'Variation %', tr: 'Değişim %' } },
  { value: 'confidenceScore', label: { en: 'Confidence', ar: 'الثقة', fr: 'Confiance', tr: 'Güven' } },
  { value: 'peRatio', label: { en: 'P/E', ar: 'السعر/الربح', fr: 'P/E', tr: 'F/K' } },
];

function formatMarketCap(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

interface ScreenerResult {
  id: string;
  symbol: string;
  title?: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: string;
  sector?: string;
  marketType?: string;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  company?: { name?: string; nameAr?: string; nameFr?: string; logoUrl?: string };
}

export default function ScreenerClient({ locale }: ScreenerClientProps) {
  const [signalFilter, setSignalFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [marketTypeFilter, setMarketTypeFilter] = useState<string>('all');
  const [marketCapFilter, setMarketCapFilter] = useState<string>('all');
  const [peFilter, setPeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sectors, setSectors] = useState<string[]>([]);

  const isRtl = locale === 'ar';
  const ITEMS_PER_PAGE = 20;

  // Fetch available sectors
  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch('/api/stock-analysis?action=companies&limit=200');
        const data = await res.json();
        if (data.status === 'ok' && data.companies) {
          const uniqueSectors = [...new Set(data.companies.map((c: any) => c.sector).filter(Boolean))] as string[];
          setSectors(uniqueSectors.sort());
        }
      } catch {}
    }
    fetchSectors();
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'screener',
        locale,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (signalFilter !== 'all') params.set('signal', signalFilter);
      if (sectorFilter !== 'all') params.set('sector', sectorFilter);
      if (marketTypeFilter !== 'all') params.set('marketType', marketTypeFilter);

      // Map market cap filters to API parameters
      const marketCapMap: Record<string, { min?: number; max?: number }> = {
        micro: { max: 300000000 },
        small: { min: 300000000, max: 2000000000 },
        mid: { min: 2000000000, max: 10000000000 },
        large: { min: 10000000000, max: 200000000000 },
        mega: { min: 200000000000 },
      };
      if (marketCapFilter !== 'all' && marketCapMap[marketCapFilter]) {
        const mc = marketCapMap[marketCapFilter];
        if (mc.min) params.set('minMarketCap', mc.min.toString());
        if (mc.max) params.set('maxMarketCap', mc.max.toString());
      }

      // Map P/E filters
      const peMap: Record<string, { min?: number; max?: number }> = {
        low: { max: 15 },
        mid: { min: 15, max: 25 },
        high: { min: 25 },
      };
      if (peFilter !== 'all' && peMap[peFilter]) {
        const pe = peMap[peFilter];
        if (pe.min) params.set('minPe', pe.min.toString());
        if (pe.max) params.set('maxPe', pe.max.toString());
      }

      const res = await fetch(`/api/stock-analysis?${params}`);
      const data = await res.json();
      if (data.status === 'ok') {
        let analyses = data.analyses || [];
        // Client-side sort
        analyses.sort((a: ScreenerResult, b: ScreenerResult) => {
          switch (sortBy) {
            case 'price': return (b.price || 0) - (a.price || 0);
            case 'changePercent': return (b.changePercent || 0) - (a.changePercent || 0);
            case 'confidenceScore': return (b.confidenceScore || 0) - (a.confidenceScore || 0);
            case 'peRatio': return (a.peRatio || 0) - (b.peRatio || 0);
            case 'marketCap':
            default: return (b.marketCap || 0) - (a.marketCap || 0);
          }
        });
        setResults(analyses);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Screener fetch error:', err);
    }
    setLoading(false);
  }, [locale, page, signalFilter, sectorFilter, marketTypeFilter, marketCapFilter, peFilter, sortBy]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleReset = () => {
    setSignalFilter('all');
    setSectorFilter('all');
    setMarketTypeFilter('all');
    setMarketCapFilter('all');
    setPeFilter('all');
    setSortBy('marketCap');
    setPage(1);
  };

  const getCompanyName = (item: ScreenerResult) => {
    if (locale === 'ar' && item.company?.nameAr) return item.company.nameAr;
    if (locale === 'fr' && item.company?.nameFr) return item.company.nameFr;
    return item.company?.name || item.title || item.symbol;
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'bullish') return <TrendingUp className="w-3 h-3" />;
    if (signal === 'bearish') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'bullish') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (signal === 'bearish') return 'bg-red-500/10 border-red-500/30 text-red-400';
    return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  };

  return (
    <div className={`min-h-screen ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`${getLocalePath(locale as any)}/stock-analysis`}
            className="text-xs text-gray-400 hover:text-white transition-colors mb-2 inline-block"
          >
            {t(locale, 'screener.backToAnalysis')}
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t(locale, 'screener.title')}</h1>
              <p className="text-xs text-gray-400">{t(locale, 'screener.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Filters</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Signal */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'signal')}:</span>
              <Select value={signalFilter} onValueChange={(v) => { setSignalFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[110px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  <SelectItem value="all" className="text-xs text-gray-300">{t(locale, 'screener.all')}</SelectItem>
                  <SelectItem value="bullish" className="text-xs text-emerald-400">{t(locale, 'bullish')}</SelectItem>
                  <SelectItem value="bearish" className="text-xs text-red-400">{t(locale, 'bearish')}</SelectItem>
                  <SelectItem value="neutral" className="text-xs text-amber-400">{t(locale, 'screener.neutral')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Market Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'screener.marketType')}:</span>
              <Select value={marketTypeFilter} onValueChange={(v) => { setMarketTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  {MARKET_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs text-gray-300">
                      {opt.label[locale as 'en' | 'ar' | 'fr' | 'tr'] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'sector')}:</span>
              <Select value={sectorFilter} onValueChange={(v) => { setSectorFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10 max-h-[200px]">
                  <SelectItem value="all" className="text-xs text-gray-300">{t(locale, 'screener.all')}</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs text-gray-300">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Market Cap */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'marketCap')}:</span>
              <Select value={marketCapFilter} onValueChange={(v) => { setMarketCapFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[150px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  {MARKET_CAP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs text-gray-300">
                      {opt.label[locale as 'en' | 'ar' | 'fr' | 'tr'] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* P/E */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'screener.peRange')}:</span>
              <Select value={peFilter} onValueChange={(v) => { setPeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[110px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  {PE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs text-gray-300">
                      {opt.label[locale as 'en' | 'ar' | 'fr' | 'tr'] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">{t(locale, 'screener.sortBy')}:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[120px] text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1e] border-white/10">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs text-gray-300">
                      {opt.label[locale as 'en' | 'ar' | 'fr' | 'tr'] || opt.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleReset} size="sm" variant="ghost" className="h-8 text-xs text-gray-400 hover:text-white">
              {t(locale, 'screener.reset')}
            </Button>
          </div>
        </div>

        {/* Results count & pagination */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            {t(locale, 'screener.results')}: <span className="text-white font-medium">{total}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-gray-400"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <span className="text-xs text-gray-400">
                {t(locale, 'screener.page')} {page} {t(locale, 'screener.of')} {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-gray-400"
              >
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Results table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[80px_1fr_90px_90px_100px_80px_100px_80px] gap-2 px-4 py-2 border-b border-white/10 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>{t(locale, 'screener.symbol')}</span>
              <span>{t(locale, 'screener.name')}</span>
              <span>{t(locale, 'screener.price')}</span>
              <span>{t(locale, 'screener.change')}</span>
              <span>{t(locale, 'signal')}</span>
              <span>{t(locale, 'confidence')}</span>
              <span>{t(locale, 'screener.marketCapCol')}</span>
              <span>{t(locale, 'screener.pe')}</span>
            </div>
            {/* Table body */}
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {results.map((item) => {
                const isPositive = (item.changePercent || 0) >= 0;
                return (
                  <Link
                    key={item.id}
                    href={`${getLocalePath(locale as any)}/stock-analysis/${item.symbol}`}
                    className="grid grid-cols-[80px_1fr_90px_90px_100px_80px_100px_80px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors items-center"
                  >
                    <span className="text-xs font-bold text-white truncate">{item.symbol}</span>
                    <span className="text-[11px] text-gray-400 truncate">{getCompanyName(item)}</span>
                    <span className="text-xs font-semibold text-white">${item.price?.toFixed(2)}</span>
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                    </span>
                    <Badge className={`text-[9px] border px-1.5 py-0 ${getSignalColor(item.overallSignal)}`}>
                      {getSignalIcon(item.overallSignal)}
                      <span className="ml-0.5">{t(locale, item.overallSignal === 'neutral' ? 'screener.neutral' : item.overallSignal)}</span>
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.confidenceScore || 0}%`,
                            backgroundColor: (item.confidenceScore || 0) >= 70 ? '#10b981' : (item.confidenceScore || 0) >= 40 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-500">{item.confidenceScore || 0}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{formatMarketCap(item.marketCap)}</span>
                    <span className="text-[11px] text-gray-400">{item.peRatio ? item.peRatio.toFixed(1) : '—'}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm">{t(locale, 'screener.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
