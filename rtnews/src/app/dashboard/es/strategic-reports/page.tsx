// ─── Spanish Strategic Reports Dashboard ───────────────────────
// Same design as English version but LTR, Spanish UI, Spanish options.
// Generates via /api/reports/generate with locale='es', type='special'

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Shield, Sparkles, Globe, TrendingUp, TrendingDown, Minus,
  Eye, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Clock, BarChart3, MapPin,
  Layers, CalendarDays, FileText, Zap, ArrowLeft,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface StrategicReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  createdAt: string;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  result?: { id: string; title: string; slug: string; confidence: number; published: boolean };
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────
const REGION_OPTIONS = [
  { value: 'Arab World & Middle East', label: 'Arab World & Middle East', icon: '🌍' },
  { value: 'Arabian Gulf', label: 'Arabian Gulf', icon: '🏜️' },
  { value: 'North Africa', label: 'North Africa', icon: '🌴' },
  { value: 'Global', label: 'Global', icon: '🌐' },
  { value: 'United States & Europe', label: 'United States & Europe', icon: '🏛️' },
  { value: 'Asia Pacific', label: 'Asia Pacific', icon: '🌏' },
  { value: 'Latin America', label: 'Latin America', icon: '🌎' },
];

const SECTOR_OPTIONS = [
  { value: 'Macroeconomics', label: 'Macroeconomía' },
  { value: 'Equities', label: 'Acciones' },
  { value: 'Energy', label: 'Energía' },
  { value: 'Forex', label: 'Divisas' },
  { value: 'Cryptocurrencies', label: 'Criptomonedas' },
  { value: 'Commodities', label: 'Materias primas' },
  { value: 'Real Estate', label: 'Bienes raíces' },
  { value: 'Central Banks', label: 'Bancos centrales' },
  { value: 'Corporate Earnings', label: 'Ganancias corporativas' },
  { value: 'Arab Markets', label: 'Mercados árabes' },
  { value: 'Technology', label: 'Tecnología' },
  { value: 'Politics', label: 'Política' },
];

const SCENARIO_OPTIONS = [
  { value: 'Short-term (1-3 months)', label: 'Corto plazo (1-3 meses)' },
  { value: 'Medium-term (6-12 months)', label: 'Medio plazo (6-12 meses)' },
  { value: 'Long-term (1-3 years)', label: 'Largo plazo (1-3 años)' },
  { value: 'Immediate (less than 1 month)', label: 'Inmediato (menos de 1 mes)' },
  { value: 'Five Years', label: 'Cinco años' },
];

const TOPIC_PRESETS = [
  'Impacto de las guerras comerciales en los mercados latinoamericanos',
  'Pronósticos del precio del petróleo y su efecto en las economías de América Latina',
  'El futuro de las criptomonedas en España y América Latina',
  'Impacto de las subidas de tasas de interés de EE.UU. en mercados emergentes',
  'Transición verde y oportunidades de inversión en energía renovable en España',
  'Impacto de la inteligencia artificial en el sector de servicios financieros',
  'Seguridad alimentaria e inversión en AgriTech en América Latina',
  'Turismo y entretenimiento: oportunidades de crecimiento en España y Latam',
];

// ─── Helper: Format Relative Time in Spanish ──────────────
function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay < 7) return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
  if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)} semana${Math.floor(diffDay / 7) !== 1 ? 's' : ''}`;
  if (diffDay < 365) return `hace ${Math.floor(diffDay / 30)} mes${Math.floor(diffDay / 30) !== 1 ? 'es' : ''}`;
  return `hace ${Math.floor(diffDay / 365)} año${Math.floor(diffDay / 365) !== 1 ? 's' : ''}`;
}

// ─── Main Component ────────────────────────────────────────
export default function EsStrategicReportsPage() {
  // Form state
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('Global');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Macroeconomics']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'Short-term (1-3 months)',
    'Medium-term (6-12 months)',
    'Long-term (1-3 years)',
  ]);
  const [publishOnComplete, setPublishOnComplete] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Reports list
  const [reports, setReports] = useState<StrategicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetTopics, setShowPresetTopics] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // ─── Fetch Reports ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      // V316: Use isPublished=all to show drafts too
      const res = await fetch('/api/es/reports?limit=50&isPublished=all');
      const data = await res.json();
      const items = data.reports || data.items || [];
      // Filter for strategic/special reports only (including drafts)
      const strategic = Array.isArray(items)
        ? items.filter((r: any) => r.reportType === 'special' || r.reportType === 'strategic')
        : [];
      setReports(strategic);
    } catch (err) {
      console.error('Error al cargar informes estratégicos en español:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── Toggle Sector ────────────────────────────────────────
  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const toggleScenario = (scenario: string) => {
    setSelectedScenarios(prev =>
      prev.includes(scenario)
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
    );
  };

  // ─── Build Spanish Strategic Prompt ──────────────────────
  const buildStrategicPrompt = (): string => {
    return `Escribe un informe de análisis estratégico completo en español.

Tema: ${topic.trim()}
Alcance geográfico: ${region}
Sectores: ${selectedSectors.join(', ')}
Horizontes temporales: ${selectedScenarios.join(', ')}

El informe DEBE seguir esta estructura exacta:

## 1. Resumen ejecutivo
5 puntos numerados — hallazgos analíticos cuantitativos clave: porcentajes, cifras, comparaciones.

## 2. Introducción
Un párrafo narrativo breve (2-3 oraciones, máximo 60 palabras): ¿Quién? ¿Qué? ¿Por qué importa ahora?
- Máximo 60 palabras — nunca exceder
- Sin viñetas — solo narrativa
- Comenzar directamente con la información — sin relleno

## 3. Contexto y antecedentes
- Importancia estratégica con números
- Precedentes históricos si los hubiera
- Partes interesadas clave afectadas

## 4. Implicaciones económicas directas
Desglosar por los sectores solicitados únicamente.
Para cada sector: Impacto + Magnitud + Duración esperada.

## 5. Impacto en los mercados financieros
Mencionar índices y activos por sus nombres reales y tickers.
No mencionar números a menos que sean confiables.

## 6. Escenarios
Para cada horizonte temporal solicitado:
- Supuestos
- Impacto esperado con estimaciones porcentuales
- Qué podría cambiar este escenario

## 7. Activos beneficiarios y vulnerables
- Activos beneficiarios: [Nombre] [Ticker] [Razón]
- Activos vulnerables: [Nombre] [Ticker] [Razón]
- Niveles de monitoreo si hay datos disponibles

## 8. Recomendaciones estratégicas
Análisis académico objetivo — ¿qué dicen los datos? Con niveles de precio de referencia.
- Escrito en voz de analista neutral con números accionables
- Explica la lógica y razones en detalle
- No se dirige directamente al lector
- Dividido por: Individual / Institucional / Traders
- Cada categoría debe incluir: Dirección + Activos de referencia + Nivel de entrada aproximado + Objetivo + Stop-loss
- Ejemplo: "Se espera que el sector defensivo se beneficie — Entrada de referencia: $320 | Objetivo: $350 | Stop: $305 | Horizonte: 3 meses"

## 9. Recomendaciones de Rou'a
Decisiones accionables — ¿Qué hacer AHORA?

### Day Trader (1 semana o menos)
Operaciones rápidas con niveles de entrada/salida específicos.
Cada recomendación DEBE incluir: precio de entrada + stop-loss + objetivo + duración máxima

### Inversor a medio plazo (1-6 meses)
Planes de inversión mensuales con porcentajes de asignación de cartera.
Cada recomendación DEBE incluir: % de cartera + punto de entrada aproximado + horizonte temporal en meses

### Inversor a largo plazo (6+ meses)
Estrategias estructurales para construir una cartera a lo largo de los años.
Cada recomendación DEBE incluir: estrategia estructural + peso en cartera + punto de reevaluación

## 10. Indicadores de seguimiento
5 indicadores específicos para monitorear la actualización de este informe.

## 11. Fuentes y referencias
Cada fuente citada con fecha. No incluir fuentes que no se hayan utilizado realmente.

---
Aviso legal: Este es un informe analítico con fines informativos únicamente.`;
  };

  // ─── Generate Report ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('Ingresa un tema para el informe (al menos 3 caracteres)');
      return;
    }
    if (selectedSectors.length === 0) {
      toast.error('Selecciona al menos un sector');
      return;
    }
    if (selectedScenarios.length === 0) {
      toast.error('Selecciona al menos un horizonte temporal');
      return;
    }

    setGenerating(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'strategic',
          locale: 'es',
          force: true,
          async: true,
          publish: publishOnComplete,
          title: topic.trim(),
          prompt: buildStrategicPrompt(),
          // V316: Pass strategic report context for proper news filtering
          region: region,
          sectors: selectedSectors,
          scenarios: selectedScenarios,
        }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.success('Generación de informe estratégico iniciada');
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'Error al iniciar la generación');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Error en la generación:', err);
      toast.error('Ocurrió un error durante la solicitud de generación');
      setGenerating(false);
    }
  };

  // ─── Poll Job Status ─────────────────────────────────────
  const pollJobStatus = useCallback(async (jId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/reports/generate?jobId=${jId}`);
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('¡Informe estratégico generado con éxito!');
          fetchReports();
          setActiveTab('history');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          toast.error(`La generación falló: ${data.error || 'Error desconocido'}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('La generación excedió el tiempo de espera');
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
        }
      }
    }, 5000);
  }, [fetchReports]);

  // ─── Impact Badge ─────────────────────────────────────────
  const getImpactBadge = (impact: string) => {
    if (impact === 'bullish') return { icon: TrendingUp, label: 'Alcista', color: 'var(--bull)', bg: 'var(--bull2)' };
    if (impact === 'bearish') return { icon: TrendingDown, label: 'Bajista', color: 'var(--bear)', bg: 'var(--bear2)' };
    return { icon: Minus, label: 'Neutral', color: 'var(--gold)', bg: 'var(--gold2)' };
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={22} style={{ color: 'var(--purple)' }} />
            Informes Estratégicos
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            Análisis profundo sobre temas específicos — diferente de los informes diarios automatizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[9px] gap-1" style={{
            background: 'rgba(139,92,246,0.1)', color: 'var(--purple)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <Sparkles size={10} />
            Sonnet
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchReports} className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <RefreshCw size={12} /> Actualizar
          </Button>
        </div>
      </div>

      {/* ═══ Difference Banner ═══ */}
      <Card className="border-0" style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,229,255,0.03))',
        border: '1px solid rgba(139,92,246,0.12)',
      }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <FileText size={14} style={{ color: 'var(--text3)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Informes automatizados</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Agregación diaria de noticias</div>
              </div>
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--text4)' }}>→</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield size={14} style={{ color: 'var(--purple)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>Informes estratégicos</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Pregunta específica + análisis profundo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'generate' ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,229,255,0.05))' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'generate' ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
            color: activeTab === 'generate' ? 'var(--purple)' : 'var(--text3)',
            boxShadow: activeTab === 'generate' ? '0 2px 8px rgba(139,92,246,0.1)' : 'none',
          }}
        >
          <Sparkles size={15} /> Generar nuevo informe
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'history' ? 'var(--bg4)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'history' ? 'var(--border)' : 'var(--border)'}`,
            color: activeTab === 'history' ? 'var(--text)' : 'var(--text3)',
          }}
        >
          <Clock size={15} /> Historial ({reports.length})
        </button>
      </div>

      {/* ═══ Generation Status ═══ */}
      {generating && jobStatus && (
        <Card className="border-0" style={{
          background: jobStatus.status === 'completed'
            ? 'var(--bull2)' : jobStatus.status === 'failed'
            ? 'var(--bear2)' : 'rgba(139,92,246,0.04)',
          border: `1px solid ${jobStatus.status === 'completed'
            ? 'rgba(0,200,150,0.2)' : jobStatus.status === 'failed'
            ? 'rgba(255,77,106,0.2)' : 'rgba(139,92,246,0.15)'}`,
        }}>
          <CardContent className="p-4 flex items-center gap-3">
            {jobStatus.status === 'completed' ? (
              <CheckCircle2 size={24} style={{ color: 'var(--bull)' }} />
            ) : jobStatus.status === 'failed' ? (
              <AlertTriangle size={24} style={{ color: 'var(--bear)' }} />
            ) : (
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--purple)' }} />
            )}
            <div className="flex-1">
              <div className="text-[13px] font-bold" style={{
                color: jobStatus.status === 'completed' ? 'var(--bull)' : jobStatus.status === 'failed' ? 'var(--bear)' : 'var(--purple)',
              }}>
                {jobStatus.status === 'completed' ? '¡Informe generado con éxito!'
                  : jobStatus.status === 'failed' ? 'La generación falló'
                  : jobStatus.status === 'running' ? 'Generación con IA en progreso...'
                  : 'En cola...'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {jobStatus.status === 'completed' && jobStatus.result
                  ? `${jobStatus.result.title}`
                  : `Tema: ${topic} · Duración: ${Math.round((Date.now() - (jobStatus.duration || 0)) / 1000)}s`}
              </div>
            </div>
            {jobStatus.status === 'completed' && jobStatus.result && (
              <Link href={`/es/reports/${jobStatus.result.slug}`} target="_blank">
                <Button size="sm" className="text-[11px] gap-1" style={{ background: 'var(--bull)', color: 'white' }}>
                  <Eye size={12} /> Ver informe
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* ── Topic Input ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Sparkles size={15} style={{ color: 'var(--purple)' }} />
                Tema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ej., Impacto de las guerras comerciales en los mercados latinoamericanos"
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                style={{
                  background: 'var(--bg4)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {topic.length} caracteres — Ingresa un tema específico para análisis estratégico
                </div>
                <button
                  onClick={() => setShowPresetTopics(!showPresetTopics)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.06)' }}
                >
                  {showPresetTopics ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Temas sugeridos
                </button>
              </div>
              {showPresetTopics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {TOPIC_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => { setTopic(preset); setShowPresetTopics(false); }}
                      className="text-[11px] text-left px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
                      style={{
                        background: topic === preset ? 'rgba(139,92,246,0.1)' : 'var(--bg4)',
                        border: `1px solid ${topic === preset ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
                        color: topic === preset ? 'var(--purple)' : 'var(--text2)',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Region & Sectors ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <MapPin size={15} style={{ color: 'var(--cyan)' }} />
                  Alcance geográfico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {REGION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRegion(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] text-left transition-all"
                      style={{
                        background: region === opt.value ? 'rgba(0,229,255,0.08)' : 'var(--bg4)',
                        border: `1px solid ${region === opt.value ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                        color: region === opt.value ? 'var(--cyan)' : 'var(--text2)',
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sectors */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Layers size={15} style={{ color: 'var(--gold)' }} />
                  Sectores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleSector(opt.value)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.1)' : 'var(--bg4)',
                        border: `1px solid ${selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.25)' : 'var(--border)'}`,
                        color: selectedSectors.includes(opt.value) ? 'var(--gold)' : 'var(--text3)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Scenarios ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <CalendarDays size={15} style={{ color: 'var(--bull)' }} />
                Horizontes temporales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleScenario(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.1)' : 'var(--bg4)',
                      border: `1px solid ${selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.25)' : 'var(--border)'}`,
                      color: selectedScenarios.includes(opt.value) ? 'var(--bull)' : 'var(--text3)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Generate Button ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: 'var(--text3)' }}>
                <input
                  type="checkbox"
                  checked={publishOnComplete}
                  onChange={(e) => setPublishOnComplete(e.target.checked)}
                  className="rounded"
                />
                Publicar automáticamente después de generar
              </label>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="text-[13px] font-bold gap-2 px-8 py-3 h-auto"
              style={{
                background: generating
                  ? 'var(--bg4)'
                  : 'linear-gradient(135deg, #8B5CF6, #00E5FF)',
                color: generating ? 'var(--text3)' : 'white',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Generar Informe Estratégico
                </>
              )}
            </Button>
          </div>

          {/* Prompt Preview */}
          <Card className="border-0" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} style={{ color: 'var(--purple)' }} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>Resumen de solicitud</span>
              </div>
              <div className="space-y-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <div>Tema: <span style={{ color: 'var(--text)' }}>{topic || '—'}</span></div>
                <div>Región: <span style={{ color: 'var(--cyan)' }}>{region}</span></div>
                <div>Sectores: <span style={{ color: 'var(--gold)' }}>{selectedSectors.join(', ')}</span></div>
                <div>Horizontes: <span style={{ color: 'var(--bull)' }}>{selectedScenarios.join(', ')}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ History Tab ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--purple)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Cargando informes...</span>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Shield size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
                <p className="text-[13px] font-bold" style={{ color: 'var(--text3)' }}>Aún no hay informes estratégicos</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>
                  Crea tu primer informe estratégico desde la pestaña Generar
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  variant="outline"
                  size="sm"
                  className="text-[11px] gap-1 mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}
                >
                  <Sparkles size={12} /> Generar informe
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map(report => {
              const impact = getImpactBadge(report.marketImpact);
              const ImpactIcon = impact.icon;
              return (
                <Card key={report.id} className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={14} style={{ color: 'var(--purple)' }} />
                          <Link
                            href={`/es/reports/${report.slug}`}
                            target="_blank"
                            className="text-[13px] font-bold hover:underline"
                            style={{ color: 'var(--text)', textDecoration: 'none' }}
                          >
                            {report.title}
                          </Link>
                        </div>
                        {report.summary && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text3)' }}>
                            {report.summary.slice(0, 200)}{report.summary.length > 200 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className="text-[8px]" style={{
                            background: impact.bg, color: impact.color,
                            border: `1px solid ${impact.color}20`,
                          }}>
                            <ImpactIcon size={9} className="inline" /> {impact.label}
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
                          }}>
                            Confianza: {report.confidenceScore}%
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                            color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                            border: `1px solid ${report.isPublished ? 'rgba(0,200,150,0.2)' : 'rgba(255,184,0,0.2)'}`,
                          }}>
                            {report.isPublished ? 'Publicado' : 'Borrador'}
                          </Badge>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {new Date(report.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {formatRelativeTime(report.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Link href={`/es/reports/${report.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8"
                          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                          <Eye size={12} /> Ver
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
