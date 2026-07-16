// ─── Spanish News Management Dashboard ──────────────────────────
// LTR, Spanish UI. Fetches from /api/es/news
// Shows ES news items: title, category, sentiment, published status

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Newspaper, RefreshCw, Search, Globe, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, TrendingDown, Minus, ExternalLink,
  Eye, EyeOff, Trash2, Loader2, Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface EsNewsItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  url?: string;
  category: string;
  sentiment: string;
  sentimentScore?: number;
  impactLevel?: string;
  isPublished: boolean;
  isReady?: boolean;
  imageUrl?: string | null;
  slug?: string;
  processingStage?: string;
  createdAt: string;
  fetchedAt?: string;
}

// ─── Constants ─────────────────────────────────────────────
const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  positive: { label: 'Positivo', color: '#22C55E', icon: TrendingUp },
  negative: { label: 'Negativo', color: '#EF5350', icon: TrendingDown },
  neutral: { label: 'Neutral', color: '#64748B', icon: Minus },
  bullish: { label: 'Alcista', color: '#22C55E', icon: TrendingUp },
  bearish: { label: 'Bajista', color: '#EF5350', icon: TrendingDown },
};

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  fetched: { label: 'Obtenido', color: '#64748B' },
  content_loaded: { label: 'Contenido Cargado', color: '#3b82f6' },
  analyzed: { label: 'Analizado', color: '#F59E0B' },
  imaged: { label: 'Listo', color: '#22C55E' },
  published: { label: 'Publicado', color: '#00E5FF' },
};

// ─── Mini Stat Card ────────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: number | string; color: string; sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{label}</span>
      </div>
      <div className="font-mono-price text-[22px] font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function EsNewsPage() {
  const [items, setItems] = useState<EsNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // ─── Fetch Data ────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/es/news?limit=50');
      const data = await res.json();
      const news = data.news || data.items || [];
      setItems(Array.isArray(news) ? news : []);
      setTotalCount(news.length || 0);
      setPublishedCount(Array.isArray(news) ? news.filter((n: EsNewsItem) => n.isPublished || n.isReady).length : 0);
      setPendingCount(Array.isArray(news) ? news.filter((n: EsNewsItem) => !n.isPublished && !n.isReady).length : 0);
    } catch (err) {
      console.error('Error al cargar noticias ES:', err);
      toast.error('Error al cargar noticias en español');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Filtered items ────────────────────────────────────
  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title?.toLowerCase().includes(q) && !(item.summary || '').toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  // ─── Delete handler ────────────────────────────────────
  const handleDelete = async (item: EsNewsItem) => {
    if (!confirm(`¿Eliminar "${item.title?.slice(0, 80)}"?`)) return;
    try {
      const res = await fetch(`/api/news/manage?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Artículo eliminado');
        fetchNews();
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar el artículo');
    }
  };

  // ─── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />
        ))}
      </div>
    );
  }

  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <Globe size={22} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Noticias en español</h1>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Gestionar artículos de noticias en español</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNews}
            className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <MiniStat icon={Newspaper} label="Total artículos ES" value={totalCount} color="#00E5FF" />
        <MiniStat icon={CheckCircle2} label="Publicado" value={publishedCount} color="#22C55E" />
        <MiniStat icon={Clock} label="Pendiente" value={pendingCount} color="#F59E0B" />
        <MiniStat icon={Activity} label="Categorías" value={categories.length - 1} color="#8B5CF6" />
      </div>

      {/* ═══ Filters ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar noticias en español..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-[12px] outline-none cursor-pointer"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>
            ))}
          </select>
          <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
            {filteredItems.length} artículos
          </span>
        </CardContent>
      </Card>

      {/* ═══ News Table ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        {/* Desktop Table Header — hidden on mobile */}
        <div className="hidden md:grid grid-cols-[1fr_100px_100px_90px_90px_80px] gap-0 px-4 py-3 text-[11px] font-bold" style={{
          background: 'var(--bg4)', borderBottom: '1px solid var(--border)', color: 'var(--text3)',
        }}>
          <div>Título</div>
          <div className="text-center">Categoría</div>
          <div className="text-center">Sentimiento</div>
          <div className="text-center">Estado</div>
          <div className="text-center">Etapa</div>
          <div className="text-center">Acciones</div>
        </div>
        {/* Mobile-only header */}
        <div className="md:hidden px-4 py-2 text-[10px] font-bold" style={{
          background: 'var(--bg4)', borderBottom: '1px solid var(--border)', color: 'var(--text3)',
          display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          <span>Artículo</span>
          <span>Estado / Acciones</span>
        </div>

        {/* Table Body */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text3)' }}>
            <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">No se encontraron noticias en español</p>
            <p className="text-[12px] mt-1">Los artículos aparecerán aquí una vez que el pipeline ES los haya obtenido y procesado</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredItems.map((item) => {
              const isPublished = item.isReady || item.isPublished;
              const sentimentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
              const SentimentIcon = sentimentCfg.icon;
              const stageCfg = STAGE_CONFIG[item.processingStage || 'fetched'] || STAGE_CONFIG.fetched;

              return (
                <div
                  key={item.id}
                  className="px-4 py-3 transition-colors hover:bg-[var(--bg4)]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {/* ══ MOBILE LAYOUT ══ */}
                  <div className="md:hidden">
                    {/* Row 1: Title + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="text-[13px] font-bold truncate flex items-center gap-2" style={{ color: 'var(--text)' }}>
                          {isPublished ? (
                            <CheckCircle2 size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
                          ) : (
                            <Clock size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                        <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text3)' }}>
                          {item.source}
                        </div>
                      </div>
                      <Badge className="text-[9px] flex-shrink-0" style={{
                        background: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPublished ? '#22C55E' : '#F59E0B',
                        border: `1px solid ${isPublished ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      }}>
                        {isPublished ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>
                    {/* Row 2: Category + Sentiment + Stage */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <Badge className="text-[9px]" style={{
                        background: 'var(--cyan2)', color: 'var(--cyan)',
                        border: '1px solid rgba(0,229,255,0.15)',
                      }}>
                        {item.category || 'General'}
                      </Badge>
                      <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: sentimentCfg.color }}>
                        <SentimentIcon size={12} />{sentimentCfg.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                        color: stageCfg.color,
                        background: `${stageCfg.color}15`,
                      }}>
                        {stageCfg.label}
                      </span>
                    </div>
                    {/* Row 3: Actions */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {item.slug && (
                        <a href={`/es/news/${item.slug}`} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                          title="Ver en el sitio"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button onClick={() => handleDelete(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* ══ DESKTOP LAYOUT ══ */}
                  <div className="hidden md:grid grid-cols-[1fr_100px_100px_90px_90px_80px] gap-0 items-center">
                    {/* Título */}
                    <div className="min-w-0 pr-3">
                      <div className="text-[13px] font-bold truncate flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        {isPublished ? (
                          <CheckCircle2 size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
                        ) : (
                          <Clock size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
                        )}
                        {item.title}
                      </div>
                      <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text3)' }}>
                        {item.source} {item.slug && `· /es/news/${item.slug.slice(0, 30)}`}
                      </div>
                      {item.summary && (
                        <div className="text-[10px] truncate mt-1" style={{ color: 'var(--text4)' }}>
                          {item.summary.slice(0, 100)}
                        </div>
                      )}
                    </div>

                    {/* Categoría */}
                    <div className="text-center">
                      <Badge className="text-[9px]" style={{
                        background: 'var(--cyan2)', color: 'var(--cyan)',
                        border: '1px solid rgba(0,229,255,0.15)',
                      }}>
                        {item.category || 'General'}
                      </Badge>
                    </div>

                    {/* Sentimiento */}
                    <div className="text-center flex items-center justify-center gap-1">
                      <SentimentIcon size={12} style={{ color: sentimentCfg.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: sentimentCfg.color }}>
                        {sentimentCfg.label}
                      </span>
                    </div>

                    {/* Estado */}
                    <div className="text-center">
                      <Badge className="text-[9px]" style={{
                        background: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPublished ? '#22C55E' : '#F59E0B',
                        border: `1px solid ${isPublished ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      }}>
                        {isPublished ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>

                    {/* Etapa */}
                    <div className="text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                        color: stageCfg.color,
                        background: `${stageCfg.color}15`,
                      }}>
                        {stageCfg.label}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-center gap-1">
                      {item.slug && (
                        <a
                          href={`/es/news/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                          title="Ver en el sitio"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
