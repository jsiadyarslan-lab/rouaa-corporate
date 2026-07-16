'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  X,
  Search,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface StockComparisonProps {
  symbol: string;
  peers: string[];
  locale: string;
}

const COMP_LABELS: Record<string, Record<string, string>> = {
  symbol: { en: 'Symbol', ar: 'الرمز', fr: 'Symbole', tr: 'Sembol' },
  price: { en: 'Price', ar: 'السعر', fr: 'Prix', tr: 'Fiyat' },
  change: { en: 'Change %', ar: 'التغير %', fr: 'Variation %', tr: 'Değişim %' },
  signal: { en: 'Signal', ar: 'الإشارة', fr: 'Signal', tr: 'Sinyal' },
  peRatio: { en: 'P/E', ar: 'نسبة السعر للربح', fr: 'P/E', tr: 'F/K' },
  eps: { en: 'EPS', ar: 'ربحية السهم', fr: 'BPA', tr: 'HBE' },
  marketCap: { en: 'Market Cap', ar: 'القيمة السوقية', fr: 'Cap. Boursière', tr: 'Piyasa Değeri' },
  confidence: { en: 'Confidence', ar: 'الثقة', fr: 'Confiance', tr: 'Güven' },
  risk: { en: 'Risk', ar: 'المخاطرة', fr: 'Risque', tr: 'Risk' },
  addSymbol: { en: 'Add Symbol', ar: 'أضف رمز', fr: 'Ajouter Symbole', tr: 'Sembol Ekle' },
  compare: { en: 'Compare', ar: 'مقارنة', fr: 'Comparer', tr: 'Karşılaştır' },
  noPeers: { en: 'No peer data available', ar: 'لا توجد بيانات نظير متاحة', fr: 'Aucune donnée de pairs disponible', tr: 'Sektör karşılığı verisi yok' },
  bullish: { en: 'Bullish', ar: 'صاعد', fr: 'Haussier', tr: 'Yükseliş' },
  bearish: { en: 'Bearish', ar: 'هابط', fr: 'Baissier', tr: 'Düşüş' },
  neutral: { en: 'Neutral', ar: 'عرضي', fr: 'Neutre', tr: 'Nötr' },
  low: { en: 'Low', ar: 'منخفض', fr: 'Faible', tr: 'Düşük' },
  medium: { en: 'Medium', ar: 'متوسط', fr: 'Moyen', tr: 'Orta' },
  high: { en: 'High', ar: 'مرتفع', fr: 'Élevé', tr: 'Yüksek' },
  extreme: { en: 'Extreme', ar: 'شديد', fr: 'Extrême', tr: 'Aşırı' },
  loading: { en: 'Loading comparison...', ar: 'جاري تحميل المقارنة...', fr: 'Chargement de la comparaison...', tr: 'Karşılaştırma yükleniyor...' },
  name: { en: 'Name', ar: 'الاسم', fr: 'Nom', tr: 'Ad' },
};

function compT(key: string, locale: string): string {
  return COMP_LABELS[key]?.[locale] || COMP_LABELS[key]?.en || key;
}

function formatMarketCap(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

function formatPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toFixed(2)}`;
}

function getSignalBadge(signal: string, locale: string) {
  const s = signal?.toLowerCase() || '';
  if (s === 'bullish') {
    return (
      <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 border text-[10px] px-2 py-0.5">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        {compT('bullish', locale)}
      </Badge>
    );
  }
  if (s === 'bearish') {
    return (
      <Badge className="bg-red-500/10 border-red-500/30 text-red-400 border text-[10px] px-2 py-0.5">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {compT('bearish', locale)}
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 border text-[10px] px-2 py-0.5">
      <Minus className="w-3 h-3 mr-0.5" />
      {compT('neutral', locale)}
    </Badge>
  );
}

function getRiskBadge(risk: string, locale: string) {
  const r = risk?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    extreme: 'bg-red-500/10 border-red-500/30 text-red-400',
  };
  return (
    <Badge className={`${colorMap[r] || colorMap.high} border text-[10px] px-2 py-0.5`}>
      {compT(r, locale) || risk}
    </Badge>
  );
}

interface ComparisonItem {
  symbol: string;
  title?: string;
  name?: string;
  nameAr?: string;
  nameFr?: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: string;
  peRatio: number | null;
  eps: number | null;
  marketCap: number | null;
  company?: { name?: string; nameAr?: string; nameFr?: string };
}

export default function StockComparison({ symbol, peers, locale }: StockComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [symbols, setSymbols] = useState<string[]>([]);

  // Initialize with peers
  useEffect(() => {
    const initialSymbols = [symbol, ...peers.slice(0, 4)].map(s => s.toUpperCase());
    setSymbols(initialSymbols);
  }, [symbol, peers]);

  const fetchComparison = useCallback(async () => {
    if (symbols.length <= 1) return;
    setLoading(true);
    try {
      const symbolsParam = symbols.join(',');
      const res = await fetch(`/api/stock-analysis?action=compare&symbols=${symbolsParam}`);
      const data = await res.json();
      if (data.status === 'ok' && data.comparisons) {
        setComparisonData(data.comparisons);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    }
    setLoading(false);
  }, [symbols]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const handleAddSymbol = () => {
    const trimmed = addInput.trim().toUpperCase();
    if (trimmed && !symbols.includes(trimmed) && symbols.length < 6) {
      setSymbols(prev => [...prev, trimmed]);
      setAddInput('');
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    if (sym === symbol) return; // Can't remove the main symbol
    setSymbols(prev => prev.filter(s => s !== sym));
  };

  const getCompanyName = (item: ComparisonItem) => {
    if (locale === 'ar' && item.company?.nameAr) return item.company.nameAr;
    if (locale === 'fr' && item.company?.nameFr) return item.company.nameFr;
    return item.company?.name || item.name || item.title || item.symbol;
  };

  return (
    <div className="space-y-4">
      {/* Add symbol input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
            placeholder={compT('addSymbol', locale)}
            className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            dir="ltr"
          />
        </div>
        <Button
          onClick={handleAddSymbol}
          disabled={!addInput.trim() || symbols.length >= 6}
          size="sm"
          variant="outline"
          className="h-8 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {compT('addSymbol', locale)}
        </Button>
      </div>

      {/* Active symbols chips */}
      <div className="flex flex-wrap gap-2">
        {symbols.map((sym) => (
          <Badge
            key={sym}
            variant="outline"
            className={`text-xs border-white/20 ${
              sym === symbol
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-gray-300'
            }`}
          >
            {sym}
            {sym !== symbol && (
              <button
                onClick={() => handleRemoveSymbol(sym)}
                className="ml-1 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Comparison table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/5 rounded-lg" />
          ))}
          <p className="text-xs text-gray-500 text-center">{compT('loading', locale)}</p>
        </div>
      ) : comparisonData.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium text-xs">{compT('symbol', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('price', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('change', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs">{compT('signal', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('peRatio', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('eps', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('marketCap', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs text-right">{compT('confidence', locale)}</TableHead>
                <TableHead className="text-gray-400 font-medium text-xs">{compT('risk', locale)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((item) => {
                const isMain = item.symbol === symbol;
                const isPositive = (item.changePercent || 0) >= 0;
                return (
                  <TableRow
                    key={item.symbol}
                    className={`border-white/5 ${isMain ? 'bg-emerald-500/5' : 'hover:bg-white/[0.03]'}`}
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        {isMain && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">{item.symbol}</p>
                          <p className="text-[9px] text-gray-500 truncate max-w-[120px]">{getCompanyName(item)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2.5 text-xs font-medium text-white">
                      {formatPrice(item.price)}
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <span className={`text-xs font-medium flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">{getSignalBadge(item.overallSignal, locale)}</TableCell>
                    <TableCell className="text-right py-2.5 text-xs text-gray-300">
                      {item.peRatio != null ? item.peRatio.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-right py-2.5 text-xs text-gray-300">
                      {item.eps != null ? formatPrice(item.eps) : '—'}
                    </TableCell>
                    <TableCell className="text-right py-2.5 text-xs text-gray-300">
                      {formatMarketCap(item.marketCap)}
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-gray-300">{item.confidenceScore || 0}%</span>
                        <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.confidenceScore || 0}%`,
                              backgroundColor: (item.confidenceScore || 0) >= 70 ? '#10b981' : (item.confidenceScore || 0) >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">{getRiskBadge(item.riskLevel, locale)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8 text-sm">
          {compT('noPeers', locale)}
        </div>
      )}
    </div>
  );
}
