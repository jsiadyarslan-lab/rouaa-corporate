'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft, ChevronRight, BarChart3, Shield, Clock,
  TrendingUp, Coins, Globe, BookOpen, Check, Sparkles,
} from 'lucide-react';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Principiante', desc: 'Aprendiendo los fundamentos de la inversión', icon: BookOpen },
  { id: 'intermediate', label: 'Intermedio', desc: 'Tengo experiencia en trading', icon: BarChart3 },
  { id: 'advanced', label: 'Avanzado', desc: 'Opero regularmente con análisis', icon: TrendingUp },
  { id: 'professional', label: 'Profesional', desc: 'La inversión es mi trabajo principal', icon: Coins },
];

const RISK_LEVELS = [
  { id: 'conservative', label: 'Conservador', desc: 'Prefiero rendimientos estables', color: '#22C55E' },
  { id: 'moderate', label: 'Moderado', desc: 'Acepto algo de riesgo por mayores rendimientos', color: '#FFB800' },
  { id: 'aggressive', label: 'Agresivo', desc: 'Busco maximizar los rendimientos', color: '#EF5350' },
];

const HORIZONS = [
  { id: 'short', label: 'Corto plazo', desc: 'Menos de 1 año', icon: Clock },
  { id: 'medium', label: 'Mediano plazo', desc: '1-5 años', icon: BarChart3 },
  { id: 'long', label: 'Largo plazo', desc: 'Más de 5 años', icon: TrendingUp },
];

const ASSET_CLASSES = [
  { id: 'forex', label: 'Forex', icon: '💱' },
  { id: 'commodities', label: 'Materias Primas', icon: '🥇' },
  { id: 'crypto', label: 'Criptomonedas', icon: '₿' },
  { id: 'stocks', label: 'Acciones', icon: '📈' },
  { id: 'bonds', label: 'Bonos', icon: '📋' },
  { id: 'energy', label: 'Energía', icon: '🛢️' },
  { id: 'realEstate', label: 'Bienes Raíces', icon: '🏠' },
];

const MARKETS = [
  { id: 'arabic', label: 'Mercados Árabes', icon: '🌍' },
  { id: 'global', label: 'Mercados Globales', icon: Globe },
  { id: 'emerging', label: 'Mercados Emergentes', icon: TrendingUp },
];

const CAPITAL_RANGES = [
  { id: 'under10k', label: 'Menos de $10,000' },
  { id: '10k-50k', label: '$10K - $50K' },
  { id: '50k-200k', label: '$50K - $200K' },
  { id: '200k-1m', label: '$200K - $1M' },
  { id: 'over1m', label: 'Más de $1M' },
  { id: 'unknown', label: 'Prefiero no decir' },
];

const TOTAL_STEPS = 5;

export default function EsOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState({
    userId: '', experienceLevel: '', riskTolerance: '', investmentHorizon: '',
    preferredAssets: [] as string[], preferredMarkets: [] as string[],
    capitalRange: '', tradingFrequency: 'weekly',
  });

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('rouaa_user_id', session.user.id);
      setProfile(p => ({ ...p, userId: session.user!.id as string }));
    } else {
      const stored = localStorage.getItem('rouaa_user_id');
      if (stored) setProfile(p => ({ ...p, userId: stored }));
      else { const t = 'user_' + Date.now(); localStorage.setItem('rouaa_user_id', t); setProfile(p => ({ ...p, userId: t })); }
    }
  }, [session]);

  const canProceed = () => {
    switch (step) {
      case 0: return profile.experienceLevel !== '';
      case 1: return profile.riskTolerance !== '';
      case 2: return profile.investmentHorizon !== '';
      case 3: return profile.preferredAssets.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const toggleAsset = (id: string) => setProfile(p => ({ ...p, preferredAssets: p.preferredAssets.includes(id) ? p.preferredAssets.filter(a => a !== id) : [...p.preferredAssets, id] }));
  const toggleMarket = (id: string) => setProfile(p => ({ ...p, preferredMarkets: p.preferredMarkets.includes(id) ? p.preferredMarkets.filter(m => m !== id) : [...p.preferredMarkets, id] }));

  const handleComplete = async () => {
    setSaving(true); setErrorMsg('');
    try {
      try { await fetch('/api/advisor/setup', { method: 'POST' }); } catch {}
      const res = await fetch('/api/advisor/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, onboardingComplete: true, onboardingStep: TOTAL_STEPS }),
      });
      if (res.ok) router.push('/es/advisor');
      else { const d = await res.json().catch(() => ({})); setErrorMsg(d.error || 'Error al guardar'); }
    } catch { setErrorMsg('Error de conexión'); }
    finally { setSaving(false); }
  };

  const goNext = () => {
    try { fetch('/api/advisor/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, onboardingStep: step }) }); } catch {}
    if (step < TOTAL_STEPS - 1) setStep(step + 1); else handleComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="ltr" style={{ background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '999px', padding: '6px 16px' }}>
            <Sparkles size={16} style={{ color: 'var(--purple)' }} />
            <span style={{ color: 'var(--purple)', fontSize: '13px', fontWeight: 600 }}>Asesor ROUAA</span>
          </div>
          <h1 className="heading-lg mb-2" style={{ fontSize: '24px' }}>Personalice Su Experiencia de Inversión</h1>
          <p className="body-text">Obtenga recomendaciones personalizadas según su perfil</p>
        </div>

        <div className="flex gap-2 mb-8 justify-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ width: i === step ? '32px' : '8px', height: '8px', borderRadius: '4px', background: i <= step ? 'var(--cyan)' : 'var(--border)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          {step === 0 && (
            <div>
              <h2 className="heading-md mb-2">¿Cuál es su nivel de experiencia?</h2>
              <p className="body-text mb-6">Esto nos ayuda a ofrecer contenido adecuado a su nivel</p>
              <div className="flex flex-col gap-3">
                {EXPERIENCE_LEVELS.map(level => {
                  const Icon = level.icon; const sel = profile.experienceLevel === level.id;
                  return (
                    <button key={level.id} onClick={() => setProfile(p => ({ ...p, experienceLevel: level.id }))}
                      className="card-item flex items-center gap-4 text-left" style={{ width: '100%', background: sel ? 'var(--cyan2)' : 'var(--bg4)', borderColor: sel ? 'var(--cyan)' : 'var(--border)', cursor: 'pointer' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: sel ? 'rgba(0,229,255,0.15)' : 'var(--bg5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} style={{ color: sel ? 'var(--cyan)' : 'var(--text3)' }} />
                      </div>
                      <div className="flex-1"><div className="heading-sm" style={{ color: sel ? 'var(--cyan)' : 'var(--text)' }}>{level.label}</div><div className="caption-text">{level.desc}</div></div>
                      {sel && <Check size={18} style={{ color: 'var(--cyan)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="heading-md mb-2">¿Cuál es su tolerancia al riesgo?</h2>
              <p className="body-text mb-6">Esto afecta las recomendaciones que proporcionamos</p>
              <div className="flex flex-col gap-3">
                {RISK_LEVELS.map(level => {
                  const sel = profile.riskTolerance === level.id;
                  return (
                    <button key={level.id} onClick={() => setProfile(p => ({ ...p, riskTolerance: level.id }))}
                      className="card-item flex items-center gap-4 text-left" style={{ width: '100%', background: sel ? `${level.color}10` : 'var(--bg4)', borderColor: sel ? level.color : 'var(--border)', cursor: 'pointer' }}>
                      <Shield size={20} style={{ color: sel ? level.color : 'var(--text3)' }} />
                      <div className="flex-1"><div className="heading-sm" style={{ color: sel ? level.color : 'var(--text)' }}>{level.label}</div><div className="caption-text">{level.desc}</div></div>
                      {sel && <Check size={18} style={{ color: level.color }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="heading-md mb-2">¿Cuál es su horizonte de inversión?</h2>
              <p className="body-text mb-6">Duración esperada de sus inversiones</p>
              <div className="flex flex-col gap-3">
                {HORIZONS.map(h => {
                  const Icon = h.icon; const sel = profile.investmentHorizon === h.id;
                  return (
                    <button key={h.id} onClick={() => setProfile(p => ({ ...p, investmentHorizon: h.id }))}
                      className="card-item flex items-center gap-4 text-left" style={{ width: '100%', background: sel ? 'var(--cyan2)' : 'var(--bg4)', borderColor: sel ? 'var(--cyan)' : 'var(--border)', cursor: 'pointer' }}>
                      <Icon size={20} style={{ color: sel ? 'var(--cyan)' : 'var(--text3)' }} />
                      <div className="flex-1"><div className="heading-sm" style={{ color: sel ? 'var(--cyan)' : 'var(--text)' }}>{h.label}</div><div className="caption-text">{h.desc}</div></div>
                      {sel && <Check size={18} style={{ color: 'var(--cyan)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="heading-md mb-2">¿Qué clases de activos le interesan?</h2>
              <p className="body-text mb-6">Seleccione todas las que coincidan con sus intereses</p>
              <div className="grid grid-cols-2 gap-3">
                {ASSET_CLASSES.map(asset => {
                  const sel = profile.preferredAssets.includes(asset.id);
                  return (
                    <button key={asset.id} onClick={() => toggleAsset(asset.id)}
                      className="card-item flex items-center gap-3 text-left" style={{ width: '100%', background: sel ? 'var(--cyan2)' : 'var(--bg4)', borderColor: sel ? 'var(--cyan)' : 'var(--border)', cursor: 'pointer' }}>
                      <span style={{ fontSize: '20px' }}>{asset.icon}</span>
                      <span className="heading-sm" style={{ color: sel ? 'var(--cyan)' : 'var(--text)', fontSize: '13px' }}>{asset.label}</span>
                      {sel && <Check size={14} style={{ color: 'var(--cyan)', marginLeft: 'auto' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="heading-md mb-2">Toques Finales</h2>
              <p className="body-text mb-6">Información opcional para mejorar las recomendaciones</p>
              <div className="mb-6">
                <label className="heading-sm mb-3 block">Rango de Capital (opcional)</label>
                <div className="flex flex-col gap-2">
                  {CAPITAL_RANGES.map(range => {
                    const sel = profile.capitalRange === range.id;
                    return (
                      <button key={range.id} onClick={() => setProfile(p => ({ ...p, capitalRange: range.id }))}
                        className="card-item text-left" style={{ width: '100%', padding: '10px 14px', background: sel ? 'var(--cyan2)' : 'var(--bg4)', borderColor: sel ? 'var(--cyan)' : 'var(--border)', cursor: 'pointer' }}>
                        <span style={{ color: sel ? 'var(--cyan)' : 'var(--text)', fontSize: '13px' }}>{range.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="heading-sm mb-3 block">Mercados Preferidos</label>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map(market => {
                    const sel = profile.preferredMarkets.includes(market.id);
                    return (
                      <button key={market.id} onClick={() => toggleMarket(market.id)}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${sel ? 'var(--cyan)' : 'var(--border)'}`, background: sel ? 'var(--cyan2)' : 'var(--bg4)', color: sel ? 'var(--cyan)' : 'var(--text2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        {market.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6" style={{ background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: '8px', padding: '12px' }}>
                <p className="caption-text" style={{ color: 'var(--gold)' }}>Aviso: Las recomendaciones son información general, no asesoramiento de inversión. Consulte a un asesor financiero autorizado.</p>
              </div>
            </div>
          )}
          {errorMsg && <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', color: '#EF5350', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{errorMsg}</div>}
          <div className="flex items-center justify-between mt-8">
            <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'var(--bg4)', border: '1px solid var(--border)', color: step === 0 ? 'var(--text4)' : 'var(--text2)', fontSize: '14px', fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={16} /> Atrás
            </button>
            <span className="caption-text">{step + 1} / {TOTAL_STEPS}</span>
            <button onClick={goNext} disabled={!canProceed() || saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '8px', background: canProceed() ? 'var(--cyan)' : 'var(--bg5)', border: 'none', color: canProceed() ? '#000' : 'var(--text4)', fontSize: '14px', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Guardando...' : step === TOTAL_STEPS - 1 ? 'Comenzar Ahora' : 'Siguiente'} {!saving && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
