// ─── Company Profiles Management Page ──────────────────────
// Searchable table of all CompanyProfile records

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Users, Search, RefreshCw, Loader2, Database,
  Building2, Globe, TrendingUp, Filter,
} from 'lucide-react';

interface CompanyProfile {
  id: string;
  symbol: string;
  name: string;
  nameAr: string | null;
  nameFr: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  beta: number;
  ceo: string | null;
  logoUrl: string | null;
  website: string | null;
  employees: number | null;
  lastUpdated: string;
  createdAt: string;
  _count?: { analyses: number };
}

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return val.toFixed(0);
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'الآن';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${Math.floor(hours / 24)} ي`;
  } catch { return 'الآن'; }
}

function getExchangeColor(exchange: string | null) {
  switch (exchange) {
    case 'NYSE': return '#00E5FF';
    case 'NASDAQ': return '#00C896';
    case 'XSAU': case 'Tadawul': return '#FFB800';
    case 'Euronext': case 'XPAR': return '#8B5CF6';
    default: return 'var(--text3)';
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 25;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'companies',
        page: String(page),
        limit: String(LIMIT),
      });
      if (search) params.set('search', search);
      if (sectorFilter) params.set('sector', sectorFilter);

      const res = await fetch(`/api/stock-analysis?${params.toString()}`);
      const data = await res.json();
      if (data.companies) {
        setCompanies(data.companies);
        setTotal(data.total ?? 0);
      } else {
        // Fallback: try the companies endpoint
        setCompanies([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('[Companies] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sectorFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Extract unique sectors from loaded companies
  const sectors = [...new Set(companies.filter(c => c.sector).map(c => c.sector!))].sort();

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.20)' }}>
            <Users size={18} style={{ color: '#FFB800' }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>ملفات الشركات</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text3)' }}>
              {total} شركة مسجلة في قاعدة البيانات
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchCompanies} className="gap-1.5" style={{ color: 'var(--text2)' }}>
          <RefreshCw size={13} /> تحديث
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text4)' }} />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="بحث بالرمز أو الاسم..."
                className="pr-9 h-9 text-[12px] rounded-lg"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="w-full sm:w-48 relative">
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text4)' }} />
              <select
                value={sectorFilter}
                onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}
                className="w-full h-9 pr-9 pl-3 rounded-lg text-[12px] appearance-none cursor-pointer"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <option value="">كل القطاعات</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: '#00E5FF' }}>{total}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>إجمالي الشركات</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: '#00C896' }}>
              {companies.filter(c => c.exchange === 'NASDAQ' || c.exchange === 'NYSE').length}
            </span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>الأسواق الأمريكية</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: '#8B5CF6' }}>
              {companies.filter(c => c.exchange === 'Euronext' || c.exchange === 'XPAR').length}
            </span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>يورونيكست</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: '#FFB800' }}>
              {companies.filter(c => c.exchange === 'XSAU' || c.exchange === 'Tadawul').length}
            </span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>تداول</span>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text4)' }} />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Database size={32} style={{ color: 'var(--text4)' }} />
              <span className="text-[13px]" style={{ color: 'var(--text3)' }}>
                {search ? 'لا توجد نتائج للبحث' : 'لا توجد شركات مسجلة بعد'}
              </span>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
                <div className="w-16 text-[10px] font-bold uppercase" style={{ color: 'var(--text4)' }}>الرمز</div>
                <div className="flex-1 text-[10px] font-bold uppercase" style={{ color: 'var(--text4)' }}>الشركة</div>
                <div className="w-24 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>البورصة</div>
                <div className="w-24 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>القطاع</div>
                <div className="w-24 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>القيمة السوقية</div>
                <div className="w-16 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>P/E</div>
                <div className="w-16 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>EPS</div>
                <div className="w-16 text-[10px] font-bold uppercase text-right" style={{ color: 'var(--text4)' }}>آخر تحديث</div>
              </div>
              {/* Table rows */}
              {companies.map((company) => {
                const excColor = getExchangeColor(company.exchange);
                return (
                  <div
                    key={company.id}
                    className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--cyan3)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Symbol */}
                    <div className="w-16 flex-shrink-0">
                      <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{company.symbol}</span>
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold truncate block" style={{ color: 'var(--text)' }}>{company.name}</span>
                      {company.nameAr && (
                        <span className="text-[10px] truncate block" style={{ color: 'var(--text3)' }}>{company.nameAr}</span>
                      )}
                    </div>
                    {/* Exchange */}
                    <div className="w-24 text-right flex-shrink-0">
                      {company.exchange ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${excColor}15`, color: excColor, border: `1px solid ${excColor}25` }}>
                          {company.exchange}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                      )}
                    </div>
                    {/* Sector */}
                    <div className="w-24 text-right flex-shrink-0">
                      <span className="text-[10px] truncate block" style={{ color: 'var(--text3)' }}>{company.sector || '—'}</span>
                    </div>
                    {/* Market Cap */}
                    <div className="w-24 text-right flex-shrink-0">
                      {company.marketCap > 0 ? (
                        <span className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                          ${formatMarketCap(company.marketCap)}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                      )}
                    </div>
                    {/* P/E */}
                    <div className="w-16 text-right flex-shrink-0">
                      {company.peRatio > 0 ? (
                        <span className="font-mono-price text-[11px]" style={{ color: 'var(--text2)' }}>{company.peRatio.toFixed(1)}</span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                      )}
                    </div>
                    {/* EPS */}
                    <div className="w-16 text-right flex-shrink-0">
                      {company.eps !== 0 ? (
                        <span className="font-mono-price text-[11px]" style={{ color: company.eps >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                          {company.eps >= 0 ? '' : ''}{company.eps.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>—</span>
                      )}
                    </div>
                    {/* Last Updated */}
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{formatTimeAgo(company.lastUpdated)}</span>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ color: 'var(--text2)' }}
          >
            السابق
          </Button>
          <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ color: 'var(--text2)' }}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
