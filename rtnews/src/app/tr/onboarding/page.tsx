'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft, ChevronRight, BarChart3, Shield, Clock,
  TrendingUp, Coins, Globe, BookOpen, Check, Sparkles,
} from 'lucide-react';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Başlangıç', desc: 'Yatırımın temellerini öğreniyorum', icon: BookOpen },
  { id: 'intermediate', label: 'Orta', desc: 'Trading deneyimim var', icon: BarChart3 },
  { id: 'advanced', label: 'İleri', desc: 'Düzenli olarak analiz yaparak işlem yapıyorum', icon: TrendingUp },
  { id: 'professional', label: 'Profesyonel', desc: 'Yatırım ana işim', icon: Coins },
];

const RISK_LEVELS = [
  { id: 'conservative', label: 'Muhafazakar', desc: 'Stabil getirileri tercih ederim', color: '#22C55E' },
  { id: 'moderate', label: 'Ilımlı', desc: 'Daha yüksek getiriler için belirli bir riski kabul ediyorum', color: '#FFB800' },
  { id: 'aggressive', label: 'Agresif', desc: 'Maksimum getiri arıyorum', color: '#EF5350' },
];

const HORIZONS = [
  { id: 'short', label: 'Kısa vadeli', desc: '1 yıldan az', icon: Clock },
  { id: 'medium', label: 'Orta vadeli', desc: '1-5 yıl', icon: BarChart3 },
  { id: 'long', label: 'Uzun vadeli', desc: '5 yıldan fazla', icon: TrendingUp },
];

const ASSET_CLASSES = [
  { id: 'forex', label: 'Forex', icon: '💱' },
  { id: 'commodities', label: 'Emtalar', icon: '🥇' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'stocks', label: 'Hisse Senetleri', icon: '📈' },
  { id: 'bonds', label: 'Tahviller', icon: '📋' },
  { id: 'energy', label: 'Enerji', icon: '🛢️' },
  { id: 'realEstate', label: 'Gayrimenkul', icon: '🏠' },
];

const MARKETS = [
  { id: 'arabic', label: 'Arap piyasaları', icon: '🌍' },
  { id: 'global', label: 'Küresel piyasalar', icon: Globe },
  { id: 'emerging', label: 'Gelişmekte olan piyasalar', icon: TrendingUp },
];

const CAPITAL_RANGES = [
  { id: 'under10k', label: "10.000 $'dan az" },
  { id: '10k-50k', label: '10.000 $ - 50.000 $' },
  { id: '50k-200k', label: '50.000 $ - 200.000 $' },
  { id: '200k-1m', label: '200.000 $ - 1 M$' },
  { id: 'over1m', label: "1 M$'dan fazla" },
  { id: 'unknown', label: 'Belirtmek istemiyorum' },
];

const TOTAL_STEPS = 5;

export default function TrOnboardingPage() {
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
      if (res.ok) router.push('/tr/advisor');
      else { const d = await res.json().catch(() => ({})); setErrorMsg(d.error || 'Kayıt başarısız'); }
    } catch { setErrorMsg('Bağlantı hatası'); }
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
            <span style={{ color: 'var(--purple)', fontSize: '13px', fontWeight: 600 }}>ROUAA Danışman</span>
          </div>
          <h1 className="heading-lg mb-2" style={{ fontSize: '24px' }}>Yatırım Deneyiminizi Kişiselleştirin</h1>
          <p className="body-text">Profilinize dayalı kişiselleştirilmiş tavsiyeler alın</p>
        </div>

        <div className="flex gap-2 mb-8 justify-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ width: i === step ? '32px' : '8px', height: '8px', borderRadius: '4px', background: i <= step ? 'var(--cyan)' : 'var(--border)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          {step === 0 && (
            <div>
              <h2 className="heading-md mb-2">Deneyim seviyeniz nedir?</h2>
              <p className="body-text mb-6">Bu, seviyenize uygun içerik sunmamıza yardımcı olur</p>
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
              <h2 className="heading-md mb-2">Risk toleransınız nedir?</h2>
              <p className="body-text mb-6">Bu, sunduğumuz tavsiyeleri etkiler</p>
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
              <h2 className="heading-md mb-2">Yatırım zaman ufku nedir?</h2>
              <p className="body-text mb-6">Yatırımlarınızın planlanan süresi</p>
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
              <h2 className="heading-md mb-2">Hangi varlık sınıfları ilginizi çekiyor?</h2>
              <p className="body-text mb-6">İlgi alanınıza uyan her şeyi seçin</p>
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
              <h2 className="heading-md mb-2">Son dokunuşlar</h2>
              <p className="body-text mb-6">Tavsiyeleri geliştirmek için isteğe bağlı bilgiler</p>
              <div className="mb-6">
                <label className="heading-sm mb-3 block">Sermaye aralığı (isteğe bağlı)</label>
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
                <label className="heading-sm mb-3 block">Tercih edilen piyasalar</label>
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
                <p className="caption-text" style={{ color: 'var(--gold)' }}>Uyarı: Tavsiyeler genel bilgidir, yatırım tavsiyesi değildir. Lisanslı bir finansal danışmana başvurun.</p>
              </div>
            </div>
          )}
          {errorMsg && <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', color: '#EF5350', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{errorMsg}</div>}
          <div className="flex items-center justify-between mt-8">
            <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'var(--bg4)', border: '1px solid var(--border)', color: step === 0 ? 'var(--text4)' : 'var(--text2)', fontSize: '14px', fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={16} /> Geri
            </button>
            <span className="caption-text">{step + 1} / {TOTAL_STEPS}</span>
            <button onClick={goNext} disabled={!canProceed() || saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', borderRadius: '8px', background: canProceed() ? 'var(--cyan)' : 'var(--bg5)', border: 'none', color: canProceed() ? '#000' : 'var(--text4)', fontSize: '14px', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Kaydediliyor...' : step === TOTAL_STEPS - 1 ? 'Başla' : 'İleri'} {!saving && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
