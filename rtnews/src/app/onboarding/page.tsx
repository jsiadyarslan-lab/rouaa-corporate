'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield,
  Clock,
  TrendingUp,
  Coins,
  Globe,
  BookOpen,
  Check,
  Sparkles,
} from 'lucide-react';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'مبتدئ', desc: 'أتعلم أساسيات الاستثمار والأسواق المالية', icon: BookOpen },
  { id: 'intermediate', label: 'متوسط', desc: 'لدي خبرة في التداول وأفهم المصطلحات المالية', icon: BarChart3 },
  { id: 'advanced', label: 'متقدم', desc: 'أتداول بانتظام وأستخدم التحليل الفني والأساسي', icon: TrendingUp },
  { id: 'professional', label: 'محترف', desc: 'الاستثمار جزء من عملي أو دخلي الرئيسي', icon: Coins },
];

const RISK_LEVELS = [
  { id: 'conservative', label: 'محافظ', desc: 'أفضل العوائد المستقرة وأتجنب التقلبات العالية', color: '#22C55E' },
  { id: 'moderate', label: 'معتدل', desc: 'أقبل بعض المخاطر مقابل عوائد أعلى', color: '#FFB800' },
  { id: 'aggressive', label: 'جريء', desc: 'أسعى لأعلى العوائد وأتحمل التقلبات الكبيرة', color: '#EF5350' },
];

const HORIZONS = [
  { id: 'short', label: 'قصير الأمد', desc: 'أقل من سنة', icon: Clock },
  { id: 'medium', label: 'متوسط الأمد', desc: '1-5 سنوات', icon: BarChart3 },
  { id: 'long', label: 'طويل الأمد', desc: 'أكثر من 5 سنوات', icon: TrendingUp },
];

const ASSET_CLASSES = [
  { id: 'forex', label: 'الفوركس', icon: '💱' },
  { id: 'commodities', label: 'السلع', icon: '🥇' },
  { id: 'crypto', label: 'العملات الرقمية', icon: '₿' },
  { id: 'stocks', label: 'الأسهم', icon: '📈' },
  { id: 'bonds', label: 'السندات', icon: '📋' },
  { id: 'energy', label: 'الطاقة', icon: '🛢️' },
  { id: 'realEstate', label: 'العقارات', icon: '🏠' },
];

const MARKETS = [
  { id: 'arabic', label: 'الأسواق العربية', icon: '🌍' },
  { id: 'global', label: 'الأسواق العالمية', icon: Globe },
  { id: 'emerging', label: 'الأسواق الناشئة', icon: TrendingUp },
];

const CAPITAL_RANGES = [
  { id: 'under10k', label: 'أقل من 10,000$' },
  { id: '10k-50k', label: '10,000$ - 50,000$' },
  { id: '50k-200k', label: '50,000$ - 200,000$' },
  { id: '200k-1m', label: '200,000$ - 1,000,000$' },
  { id: 'over1m', label: 'أكثر من 1,000,000$' },
  { id: 'unknown', label: 'أفضل عدم الإفصاح' },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState({
    userId: '',
    experienceLevel: '',
    riskTolerance: '',
    investmentHorizon: '',
    preferredAssets: [] as string[],
    preferredMarkets: [] as string[],
    capitalRange: '',
    tradingFrequency: 'weekly',
  });

  useEffect(() => {
    // V123: First try NextAuth session user ID, then localStorage, then create temp
    if (session?.user?.id) {
      // Use real user ID from NextAuth session
      localStorage.setItem('rouaa_user_id', session.user.id);
      setProfile(prev => ({ ...prev, userId: session.user!.id as string }));
    } else {
      const stored = localStorage.getItem('rouaa_user_id');
      if (stored) {
        setProfile(prev => ({ ...prev, userId: stored }));
      } else {
        const tempId = 'user_' + Date.now();
        localStorage.setItem('rouaa_user_id', tempId);
        setProfile(prev => ({ ...prev, userId: tempId }));
      }
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

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleAsset = (id: string) => {
    setProfile(prev => ({
      ...prev,
      preferredAssets: prev.preferredAssets.includes(id)
        ? prev.preferredAssets.filter(a => a !== id)
        : [...prev.preferredAssets, id],
    }));
  };

  const toggleMarket = (id: string) => {
    setProfile(prev => ({
      ...prev,
      preferredMarkets: prev.preferredMarkets.includes(id)
        ? prev.preferredMarkets.filter(m => m !== id)
        : [...prev.preferredMarkets, id],
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      // خطوة 1: ضمان وجود الجداول في قاعدة البيانات
      try {
        await fetch('/api/advisor/setup', { method: 'POST' });
      } catch {}

      // خطوة 2: حفظ الملف الشخصي
      const res = await fetch('/api/advisor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          onboardingComplete: true,
          onboardingStep: TOTAL_STEPS,
        }),
      });

      if (res.ok) {
        router.push('/advisor');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'حدث خطأ أثناء حفظ الملف الشخصي');
        console.error('Profile save failed:', data);
      }
    } catch (error) {
      setErrorMsg('تعذر الاتصال بالخادم. حاول مرة أخرى.');
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // حفظ تلقائي عند كل خطوة
  const saveStep = async () => {
    try {
      await fetch('/api/advisor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, onboardingStep: step }),
      });
    } catch {}
  };

  const goNext = () => {
    saveStep();
    handleNext();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '999px', padding: '6px 16px' }}>
            <Sparkles size={16} style={{ color: 'var(--purple)' }} />
            <span style={{ color: 'var(--purple)', fontSize: '13px', fontWeight: 600 }}>مساعد رؤى</span>
          </div>
          <h1 className="heading-lg mb-2" style={{ fontSize: '24px' }}>
            خصّص تجربتك الاستثمارية
          </h1>
          <p className="body-text">
            سنساعدك في الحصول على توصيات مخصصة بناءً على ملفك الاستثماري
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i <= step ? 'var(--cyan)' : 'var(--border)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="glass-card" style={{ padding: '24px' }}>
          {/* Step 0: Experience */}
          {step === 0 && (
            <div>
              <h2 className="heading-md mb-2">ما مستوى خبرتك؟</h2>
              <p className="body-text mb-6">سيساعدنا هذا في تقديم محتوى يناسب مستواك</p>
              <div className="flex flex-col gap-3">
                {EXPERIENCE_LEVELS.map(level => {
                  const Icon = level.icon;
                  const selected = profile.experienceLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setProfile(p => ({ ...p, experienceLevel: level.id }))}
                      className="card-item flex items-center gap-4 text-right"
                      style={{
                        width: '100%',
                        background: selected ? 'var(--cyan2)' : 'var(--bg4)',
                        borderColor: selected ? 'var(--cyan)' : 'var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: selected ? 'rgba(0,229,255,0.15)' : 'var(--bg5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={20} style={{ color: selected ? 'var(--cyan)' : 'var(--text3)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="heading-sm" style={{ color: selected ? 'var(--cyan)' : 'var(--text)' }}>{level.label}</div>
                        <div className="caption-text">{level.desc}</div>
                      </div>
                      {selected && <Check size={18} style={{ color: 'var(--cyan)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Risk */}
          {step === 1 && (
            <div>
              <h2 className="heading-md mb-2">ما تحملك للمخاطر؟</h2>
              <p className="body-text mb-6">يؤثر هذا على نوع التوصيات التي نقدمها لك</p>
              <div className="flex flex-col gap-3">
                {RISK_LEVELS.map(level => {
                  const selected = profile.riskTolerance === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setProfile(p => ({ ...p, riskTolerance: level.id }))}
                      className="card-item flex items-center gap-4 text-right"
                      style={{
                        width: '100%',
                        background: selected ? `${level.color}10` : 'var(--bg4)',
                        borderColor: selected ? level.color : 'var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <Shield size={20} style={{ color: selected ? level.color : 'var(--text3)' }} />
                      <div className="flex-1">
                        <div className="heading-sm" style={{ color: selected ? level.color : 'var(--text)' }}>{level.label}</div>
                        <div className="caption-text">{level.desc}</div>
                      </div>
                      {selected && <Check size={18} style={{ color: level.color }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Horizon */}
          {step === 2 && (
            <div>
              <h2 className="heading-md mb-2">ما أفقك الاستثماري؟</h2>
              <p className="body-text mb-6">المدة المتوقعة لاستثمارك</p>
              <div className="flex flex-col gap-3">
                {HORIZONS.map(h => {
                  const Icon = h.icon;
                  const selected = profile.investmentHorizon === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setProfile(p => ({ ...p, investmentHorizon: h.id }))}
                      className="card-item flex items-center gap-4 text-right"
                      style={{
                        width: '100%',
                        background: selected ? 'var(--cyan2)' : 'var(--bg4)',
                        borderColor: selected ? 'var(--cyan)' : 'var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={20} style={{ color: selected ? 'var(--cyan)' : 'var(--text3)' }} />
                      <div className="flex-1">
                        <div className="heading-sm" style={{ color: selected ? 'var(--cyan)' : 'var(--text)' }}>{h.label}</div>
                        <div className="caption-text">{h.desc}</div>
                      </div>
                      {selected && <Check size={18} style={{ color: 'var(--cyan)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Assets */}
          {step === 3 && (
            <div>
              <h2 className="heading-md mb-2">ما فئات الأصول التي تهمك؟</h2>
              <p className="body-text mb-6">اختر كل ما يناسب اهتماماتك</p>
              <div className="grid grid-cols-2 gap-3">
                {ASSET_CLASSES.map(asset => {
                  const selected = profile.preferredAssets.includes(asset.id);
                  return (
                    <button
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id)}
                      className="card-item flex items-center gap-3 text-right"
                      style={{
                        width: '100%',
                        background: selected ? 'var(--cyan2)' : 'var(--bg4)',
                        borderColor: selected ? 'var(--cyan)' : 'var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{asset.icon}</span>
                      <span className="heading-sm" style={{ color: selected ? 'var(--cyan)' : 'var(--text)', fontSize: '13px' }}>{asset.label}</span>
                      {selected && <Check size={14} style={{ color: 'var(--cyan)', marginRight: 'auto' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Capital & Markets */}
          {step === 4 && (
            <div>
              <h2 className="heading-md mb-2">اللمسات الأخيرة</h2>
              <p className="body-text mb-6">معلومات اختيارية تساعدنا في تحسين التوصيات</p>

              <div className="mb-6">
                <label className="heading-sm mb-3 block">حجم رأس المال (اختياري)</label>
                <div className="flex flex-col gap-2">
                  {CAPITAL_RANGES.map(range => {
                    const selected = profile.capitalRange === range.id;
                    return (
                      <button
                        key={range.id}
                        onClick={() => setProfile(p => ({ ...p, capitalRange: range.id }))}
                        className="card-item text-right"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: selected ? 'var(--cyan2)' : 'var(--bg4)',
                          borderColor: selected ? 'var(--cyan)' : 'var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: selected ? 'var(--cyan)' : 'var(--text)', fontSize: '13px' }}>{range.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="heading-sm mb-3 block">الأسواق المفضلة</label>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map(market => {
                    const selected = profile.preferredMarkets.includes(market.id);
                    return (
                      <button
                        key={market.id}
                        onClick={() => toggleMarket(market.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: `1px solid ${selected ? 'var(--cyan)' : 'var(--border)'}`,
                          background: selected ? 'var(--cyan2)' : 'var(--bg4)',
                          color: selected ? 'var(--cyan)' : 'var(--text2)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {market.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6" style={{ background: 'var(--gold2)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: '8px', padding: '12px' }}>
                <p className="caption-text" style={{ color: 'var(--gold)' }}>
                  إخلاء مسؤولية: التوصيات المقدمة من مساعد رؤى هي معلومات عامة وليست نصائح استثمارية. يُرجى استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239,83,80,0.1)',
              border: '1px solid rgba(239,83,80,0.3)',
              color: '#EF5350',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '8px',
                background: 'var(--bg4)', border: '1px solid var(--border)',
                color: step === 0 ? 'var(--text4)' : 'var(--text2)',
                fontSize: '14px', fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={16} />
              السابق
            </button>

            <span className="caption-text">
              {step + 1} / {TOTAL_STEPS}
            </span>

            <button
              onClick={goNext}
              disabled={!canProceed() || saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 24px', borderRadius: '8px',
                background: canProceed() ? 'var(--cyan)' : 'var(--bg5)',
                border: 'none',
                color: canProceed() ? '#000' : 'var(--text4)',
                fontSize: '14px', fontWeight: 700,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'جاري الحفظ...' : step === TOTAL_STEPS - 1 ? 'ابدأ الآن' : 'التالي'}
              {!saving && <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
