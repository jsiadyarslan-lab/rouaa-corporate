// ─── French News Management Dashboard ──────────────────────────
// LTR, French UI. Fetches from /api/fr/news
// Shows FR news items: title, category, sentiment, published status

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
interface FrNewsItem {
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
  processingÉtape?: string;
  createdAt: string;
  fetchedAt?: string;
}

// ─── Constants ─────────────────────────────────────────────
const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  positive: { label: 'Positif', color: '#22C55E', icon: TrendingUp },
  negative: { label: 'Négatif', color: '#EF5350', icon: TrendingDown },
  neutral: { label: 'Neutre', color: '#64748B', icon: Minus },
  bullish: { label: 'Haussier', color: '#22C55E', icon: TrendingUp },
  bearish: { label: 'Baissier', color: '#EF5350', icon: TrendingDown },
};

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  fetched: { label: 'Récupéré', color: '#64748B' },
  content_loaded: { label: 'Contenu chargé', color: '#3b82f6' },
  analyzed: { label: 'Analysé', color: '#F59E0B' },
  imaged: { label: 'Prêt', color: '#22C55E' },
  published: { label: 'Publié', color: '#00E5FF' },
};

// ─── Helpers ───────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

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
export default function FrNewsPage() {
  const [items, setItems] = useState<FrNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCatégorieFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // ─── Fetch Data ────────────────────────────────────────
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fr/news?limit=50');
      const data = await res.json();
      const news = data.news || data.items || [];
      setItems(Array.isArray(news) ? news : []);
      setTotalCount(news.length || 0);
      setPublishedCount(Array.isArray(news) ? news.filter((n: FrNewsItem) => n.isPublished || n.isReady).length : 0);
      setPendingCount(Array.isArray(news) ? news.filter((n: FrNewsItem) => !n.isPublished && !n.isReady).length : 0);
    } catch (err) {
      console.error('Échec du chargement des actualités FR :', err);
      toast.error('Impossible de charger les actualités françaises');
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
  const handleDelete = async (item: FrNewsItem) => {
    if (!confirm(`Delete "${item.title?.slice(0, 80)}"?`)) return;
    try {
      const res = await fetch(`/api/news/manage?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Article supprimé');
        fetchNews();
      } else {
        toast.error('Échec de la suppression');
      }
    } catch {
      toast.error("Erreur lors de la suppression de l'article");
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
            <h1 className="text-xl font-bold text-white">Actualités françaises</h1>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Gérer les articles d'actualité français</p>
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
            Actualiser
          </Button>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={Newspaper} label="Total articles FR" value={totalCount} color="#00E5FF" />
        <MiniStat icon={CheckCircle2} label="Publié" value={publishedCount} color="#22C55E" />
        <MiniStat icon={Clock} label="En attente" value={pendingCount} color="#F59E0B" />
        <MiniStat icon={Activity} label="Categories" value={categories.length - 1} color="#8B5CF6" />
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
              placeholder="Rechercher les actualités françaises..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCatégorieFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-[12px] outline-none cursor-pointer"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'Toutes les catégories' : c}</option>
            ))}
          </select>
          <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
            {filteredItems.length} articles
          </span>
        </CardContent>
      </Card>

      {/* ═══ News Table ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_100px_90px_90px_80px] gap-0 px-4 py-3 text-[11px] font-bold" style={{
          background: 'var(--bg4)', borderBottom: '1px solid var(--border)', color: 'var(--text3)',
        }}>
          <div>Titre</div>
          <div className="text-center">Catégorie</div>
          <div className="text-center">Sentiment</div>
          <div className="text-center">Statut</div>
          <div className="text-center">Étape</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Table Body */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text3)' }}>
            <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-semibold">Aucune actualité française trouvée</p>
            <p className="text-[12px] mt-1">Les articles apparaîtront ici une fois que le pipeline FR les aura récupérés et traités</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredItems.map((item) => {
              const isPublished = item.isReady || item.isPublished;
              const sentimentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
              const SentimentIcon = sentimentCfg.icon;
              const stageCfg = STAGE_CONFIG[item.processingÉtape || 'fetched'] || STAGE_CONFIG.fetched;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_100px_100px_90px_90px_80px] gap-0 px-4 py-3 items-center transition-colors hover:bg-[var(--bg4)]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {/* Titre */}
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
                      {item.source} {item.slug && `· /fr/news/${item.slug.slice(0, 30)}`}
                    </div>
                    {item.summary && (
                      <div className="text-[10px] truncate mt-1" style={{ color: 'var(--text4)' }}>
                        {item.summary.slice(0, 100)}
                      </div>
                    )}
                  </div>
                  {/* Catégorie */}
                  <div className="text-center">
                    <Badge className="text-[9px]" style={{
                      background: 'var(--cyan2)', color: 'var(--cyan)',
                      border: '1px solid rgba(0,229,255,0.15)',
                    }}>
                      {item.category || 'Général'}
                    </Badge>
                  </div>

                  {/* Sentiment */}
                  <div className="text-center flex items-center justify-center gap-1">
                    <SentimentIcon size={12} style={{ color: sentimentCfg.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: sentimentCfg.color }}>
                      {sentimentCfg.label}
                    </span>
                  </div>

                  {/* Publié Statut */}
                  <div className="text-center">
                    <Badge className="text-[9px]" style={{
                      background: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      color: isPublished ? '#22C55E' : '#F59E0B',
                      border: `1px solid ${isPublished ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                      {isPublished ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>

                  {/* Étape */}
                  <div className="text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                      color: stageCfg.color,
                      background: `${stageCfg.color}15`,
                    }}>
                      {stageCfg.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    {item.slug && (
                      <a
                        href={`/fr/news/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                        title="Voir sur le site"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
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
