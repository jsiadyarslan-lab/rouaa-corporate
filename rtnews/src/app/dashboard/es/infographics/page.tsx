// ─── Spanish Infographics Management Dashboard ────────────────
// LTR, Spanish UI. Fetches from /api/es/infographics
// Shows ES infographics with generation controls

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Layers, RefreshCw, Search, Globe, Eye, EyeOff,
  ExternalLink, Trash2, Loader2, Sparkles, CheckCircle,
  XCircle, Activity, Clock, Newspaper, FileText, BarChart3,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface EsInfographicItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  sourceType: string;
  sourceId?: string;
  sourceTitle?: string;
  category?: string;
  slides: any[];
  viewCount: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  impactScore?: number;
}

// ─── Source item for generation tab ────────────────────────
interface SourceItem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  hasInfographic: boolean;
  createdAt: string;
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
export default function EsInfographicsPage() {
  const [infographics, setInfographics] = useState<EsInfographicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'manage' | 'generate'>('manage');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  // Source generation state
  const [sourceType, setSourceType] = useState<'news' | 'economic_report' | 'market_analysis'>('news');
  const [sources, setSources] = useState<SourceItem[]>([]);

  // ─── Show message with auto-dismiss ─────────────────────
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // ─── Fetch Infographics ────────────────────────────────
  const fetchInfographics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/es/infographics?limit=50');
      const data = await res.json();
      setInfographics(data.infographics || data.items || []);
    } catch (err) {
      console.error('Failed to fetch ES infographics:', err);
      toast.error('Error al cargar infografías en español');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Sources for Generation ──────────────────────
  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      // V260: Fixed sourceType — use correct API values matching generate-es endpoint
      const url = sourceType === 'news'
        ? '/api/es/news?limit=30&ready=true'
        : sourceType === 'economic_report'
        ? '/api/es/reports?limit=30&published=true'
        : '/api/es/analyses?limit=30&published=true';

      const [srcRes, igRes] = await Promise.all([
        fetch(url),
        fetch('/api/es/infographics?limit=100'),
      ]);
      const srcData = await srcRes.json();
      const igData = await igRes.json();

      const existingSourceIds = new Set(
        (igData.infographics || igData.items || []).map((ig: EsInfographicItem) => ig.sourceId).filter(Boolean)
      );

      const rawItems = sourceType === 'news'
        ? (srcData.news || srcData.items || [])
        : (srcData.reports || srcData.items || []);

      const items: SourceItem[] = (Array.isArray(rawItems) ? rawItems : []).map((s: any) => ({
        id: s.id,
        title: s.title || 'Sin título',
        summary: (s.summary || '').slice(0, 120),
        category: s.category || s.reportType,
        hasInfographic: existingSourceIds.has(s.id),
        createdAt: s.createdAt,
      }));
      setSources(items);
    } catch (err: any) {
      showMessage('error', 'Error al cargar fuentes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sourceType, showMessage]);

  useEffect(() => {
    if (activeTab === 'manage') fetchInfographics();
    else fetchSources();
  }, [activeTab, sourceType, fetchInfographics, fetchSources]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Generate Infographic ───────────────────────────────
  const handleGenerate = async (sourceId: string) => {
    setGenerating(sourceId);
    try {
      const res = await fetch('/api/infographics/generate-es', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType, sourceId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Error en la generación' }));
        showMessage('error', errData.error || `Error en la generación (${res.status})`);
        return;
      }

      const data = await res.json();
      showMessage('success', `Infografía generada: ${data.infographic?.title || ''}`);
      fetchSources();
    } catch (err: any) {
      showMessage('error', 'Error al generar infografía');
    } finally {
      setGenerating(null);
    }
  };

  // ─── Delete ─────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta infografía?')) return;
    try {
      const res = await fetch(`/api/infographics/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showMessage('success', 'Infografía eliminada');
        fetchInfographics();
      } else {
        showMessage('error', 'Error al eliminar');
      }
    } catch {
      showMessage('error', 'Error al eliminar');
    }
  };

  // ─── Toggle publish ─────────────────────────────────────
  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/infographics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) {
        showMessage('success', isPublished ? 'No publicado' : 'Publicado exitosamente');
        fetchInfographics();
      } else {
        showMessage('error', 'Error al actualizar estado de publicación');
      }
    } catch {
      showMessage('error', 'Error al actualizar');
    }
  };

  // ─── Stats ─────────────────────────────────────────────
  const totalViews = infographics.reduce((sum, i) => sum + (i.viewCount || 0), 0);
  const totalSlides = infographics.reduce((sum, i) => sum + ((i.slides as any[]) || []).length, 0);

  // ─── Loading State ─────────────────────────────────────
  if (loading && activeTab === 'manage' && infographics.length === 0) {
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
            <Layers size={22} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Infografías en Español</h1>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Historias visuales de datos — Generación automática activada
              <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1.5 font-semibold"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                V400 Auto
              </span>
            </p>
          </div>
        </div>
        <Button
          onClick={() => setActiveTab('generate')}
          size="sm"
          className="gap-1.5 text-[12px]"
          style={{ background: 'var(--cyan)', color: 'var(--bg)' }}
        >
          <Sparkles size={14} />
          Generar nueva
        </Button>
      </div>

      {/* Message toast */}
      {message && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-semibold" style={{
          background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: message.type === 'success' ? '#22C55E' : '#EF5350',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* ═══ Tabs ═══ */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('manage')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === 'manage' ? 'var(--cyan2)' : 'transparent',
            color: activeTab === 'manage' ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <Layers size={14} />
          Gestionar
          {infographics.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cyan)', color: 'var(--bg)' }}>
              {infographics.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold transition-all"
          style={{
            background: activeTab === 'generate' ? 'var(--cyan2)' : 'transparent',
            color: activeTab === 'generate' ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <Sparkles size={14} />
          Generar
        </button>
      </div>

      {/* ═══ Manage Tab ═══ */}
      {activeTab === 'manage' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MiniStat icon={Layers} label="Total infografías" value={infographics.length} color="#00E5FF" />
            <MiniStat icon={Eye} label="Publicadas" value={infographics.filter(i => i.isPublished).length} color="#22C55E" />
            <MiniStat icon={EyeOff} label="Borradores" value={infographics.filter(i => !i.isPublished).length} color="#FFB800" />
            <MiniStat icon={Activity} label="Vistas totales" value={totalViews} color="#3b82f6" />
            <MiniStat icon={BarChart3} label="Diapositivas totales" value={totalSlides} color="#D4AF37" />
          </div>

          {/* Search */}
          <div className="relative max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar infografías..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* Infographics List */}
          {infographics.length === 0 ? (
            <div className="py-16 text-center" style={{ color: 'var(--text3)' }}>
              <ImageIcon size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-[14px] font-medium">Aún no hay infografías en español</p>
              <p className="text-[12px] mt-1">Genera infografías desde noticias o informes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {infographics
                .filter(ig => !searchQuery || ig.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(ig => {
                  const slides = (ig.slides as any[]) || [];
                  return (
                    <div key={ig.id} className="flex items-center gap-3 p-4 rounded-xl" style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                    }}>
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{
                        background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                      }}>
                        <Layers size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                          {ig.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {slides.length} diapositivas
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {ig.sourceType === 'news' ? 'Noticias' : ig.sourceType === 'economic_report' ? 'Informe' : 'Análisis'}
                          </span>
                          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                            <Eye size={10} /> {ig.viewCount}
                          </span>
                        </div>
                      </div>

                      {/* Published badge */}
                      <div className="flex-shrink-0 hidden sm:block">
                        {ig.isPublished ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded" style={{
                            background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.15)',
                          }}>
                            <Eye size={10} />
                            Publicado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded" style={{
                            background: 'rgba(255,184,0,0.1)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.15)',
                          }}>
                            <EyeOff size={10} />
                            No publicado
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePublish(ig.id, ig.isPublished)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: ig.isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(255,184,0,0.1)',
                            color: ig.isPublished ? '#22C55E' : '#FFB800',
                          }}
                          title={ig.isPublished ? 'Despublicar' : 'Publicar'}
                        >
                          {ig.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        {ig.slug && (
                          <a href={`/es/infographics/${ig.slug}`} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)' }}
                            title="Ver"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(ig.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF5350' }}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* Source type selector */}
          <div className="flex items-center gap-2">
            {[
              { value: 'news' as const, label: 'Noticias ES', icon: Newspaper, color: '#00BCD4' },
              { value: 'economic_report' as const, label: 'Informes ES', icon: FileText, color: '#059669' },
              { value: 'market_analysis' as const, label: 'Análisis ES', icon: BarChart3, color: '#8B5CF6' },
            ].map(st => {
              const Icon = st.icon;
              const isActive = sourceType === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => setSourceType(st.value)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: isActive ? st.color + '15' : 'transparent',
                    color: isActive ? st.color : 'var(--text3)',
                    border: `1px solid ${isActive ? st.color + '30' : 'var(--border)'}`,
                  }}
                >
                  <Icon size={14} />
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--cyan)' }} />
              <span className="ml-3 text-[13px]" style={{ color: 'var(--text3)' }}>Cargando fuentes...</span>
            </div>
          )}

          {/* Sources list */}
          {!loading && (
            <div className="space-y-2">
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text3)' }} />
                  <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No hay fuentes disponibles</p>
                </div>
              ) : (
                sources.map(source => (
                  <div key={source.id} className="flex items-center gap-3 p-4 rounded-xl" style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                  }}>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>
                        {source.title}
                      </h3>
                      {source.summary && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
                          {source.summary}
                        </p>
                      )}
                      {source.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                          {source.category}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {source.hasInfographic ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{
                          background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)',
                        }}>
                          <CheckCircle size={12} />
                          Generado
                        </span>
                      ) : generating === source.id ? (
                        <span className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg" style={{
                          background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)',
                        }}>
                          <Loader2 size={12} className="animate-spin" />
                          Generando...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerate(source.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                          style={{ background: 'var(--cyan)', color: 'var(--bg)' }}
                        >
                          <Sparkles size={12} />
                          Generar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
