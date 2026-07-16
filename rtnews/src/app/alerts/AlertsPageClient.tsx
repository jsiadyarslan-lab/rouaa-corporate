'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import BackToTop from '@/components/rouaa/BackToTop';
import SmartAlertsPanel from '@/components/rouaa/alerts/SmartAlertsPanel';

/* ══════════════════════════════════════
   Feature Cards Data
   ══════════════════════════════════════ */
const FEATURES = [
  {
    id: 'price',
    title: 'تنبيه سعري',
    description: 'احصل على إشعار فوري عندما يصل سعر أصل مالي (عملات، معادن، مؤشرات) إلى مستوى محدد تحدده بنفسك.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: 'var(--bull)',
    bgColor: 'var(--bull2)',
    borderColor: 'rgba(0,200,150,0.2)',
  },
  {
    id: 'sentiment',
    title: 'مشاعر السوق',
    description: 'راقب التغيرات في مشاعر السوق بشكل لحظي وتلقّ إشعارات عند حدوث تحولات مهمة في الاتجاه العام.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2v10l6.93 4" />
      </svg>
    ),
    color: 'var(--gold)',
    bgColor: 'var(--gold2)',
    borderColor: 'rgba(232,160,32,0.2)',
  },
  {
    id: 'breaking',
    title: 'أخبار عاجلة',
    description: 'كن أول من يعرف! احصل على تنبيهات فورية عند نشر أخبار عاجلة مؤثرة على الأسواق المالية العالمية.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
    color: 'var(--bear)',
    bgColor: 'var(--bear2)',
    borderColor: 'rgba(255,77,106,0.2)',
  },
  {
    id: 'custom',
    title: 'تنبيه مخصص',
    description: 'أنشئ تنبيهات بكلمات مفتاحية محددة مثل "فائدة" أو "بنك مركزي" أو "تضخم" وتلقّ إشعارات عند مطابقتها.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    color: 'var(--cyan)',
    bgColor: 'var(--cyan2)',
    borderColor: 'rgba(0,229,255,0.2)',
  },
];

/* ══════════════════════════════════════
   Quick Presets Data
   ══════════════════════════════════════ */
const QUICK_PRESETS = [
  {
    id: 'gold-above',
    title: 'ذهب فوق 2400$',
    description: 'تنبيه سعري — XAU/USD أعلى من 2400',
    type: 'price' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9Z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </svg>
    ),
    color: 'var(--gold)',
    bgColor: 'var(--gold2)',
    borderColor: 'rgba(255,184,0,0.25)',
  },
  {
    id: 'eur-below',
    title: 'يورو تحت 1.08',
    description: 'تنبيه سعري — EUR/USD أدنى من 1.08',
    type: 'price' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: 'var(--bull)',
    bgColor: 'var(--bull2)',
    borderColor: 'rgba(0,200,150,0.25)',
  },
  {
    id: 'fed-news',
    title: 'أخبار الفيدرالي',
    description: 'تنبيه كلمات مفتاحية — فائدة، فيدرالي، باول',
    type: 'keywords' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
    color: 'var(--purple)',
    bgColor: 'var(--purple2)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'btc-change',
    title: 'بتكوين تغير 5%',
    description: 'تنبيه تغير نسبة — BTC/USD تغير 5%',
    type: 'change' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 2v10l6.93 4" />
      </svg>
    ),
    color: 'var(--cyan)',
    bgColor: 'var(--cyan2)',
    borderColor: 'rgba(0,229,255,0.25)',
  },
];

/* ══════════════════════════════════════
   Section Title Helper
   ══════════════════════════════════════ */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--text)' }}
    >
      <span
        style={{
          width: '3px',
          height: '18px',
          borderRadius: '2px',
          background: 'linear-gradient(180deg, var(--cyan), var(--purple))',
        }}
      />
      {children}
    </h2>
  );
}

/* ══════════════════════════════════════
   Main Component
   ══════════════════════════════════════ */
export default function AlertsPageClient() {
  // For now, userId is empty until auth is implemented
  const userId = '';
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<Array<{
    symbol: string; displaySymbol: string; nameAr: string;
    price: number | null; changePercent: number | null; decimals: number;
  }>>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/markets/prices', { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
        if (res.ok) {
          const data = await res.json();
          if (data.prices) setMarketPrices(data.prices.slice(0, 6));
        }
      } catch { /* silent */ }
    };
    fetchPrices();
  }, []);

  const handlePresetClick = (presetTitle: string) => {
    toast.info('سيتم إنشاء التنبيه بعد تسجيل الدخول', {
      description: presetTitle,
      duration: 3000,
    });
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>

      <div className="max-w-[960px] mx-auto px-4 py-12">
        {/* ── Mini Market Status Bar ─────────────────────────── */}
        <section className="mb-8">
          <div
            className="glass-card p-4"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot" style={{ background: 'var(--bull)' }} />
              <span className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>
                أسعار السوق الآن
              </span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: 'var(--bull2)',
                  color: 'var(--bull)',
                  border: '1px solid rgba(0,200,150,0.2)',
                }}
              >
                مباشر
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {marketPrices.length > 0 ? marketPrices.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:translate-y-[-1px]"
                  style={{
                    background: 'var(--bg4)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                        {item.displaySymbol}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
                        {item.nameAr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[13px] font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                        {(item.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: item.decimals || 2 })}
                      </span>
                      <span
                        className="text-[10px] font-bold font-mono-price"
                        style={{
                          color: (item.changePercent ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)',
                        }}
                      >
                        {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-4">
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>جارٍ تحميل الأسعار...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Hero Section ──────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--cyan2)',
                border: '1px solid rgba(0,229,255,0.25)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading" style={{ color: 'var(--text)' }}>
                التنبيهات الذكية
              </h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text2)' }}>
            أنشئ تنبيهات مخصصة لأسعار العملات، مشاعر السوق، والأخبار العاجلة. احصل على إشعارات فورية عند تحقق شروطك.
          </p>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className="live-status"
              style={{
                background: 'var(--cyan2)',
                border: '1px solid rgba(0,229,255,0.3)',
                color: 'var(--cyan)',
              }}
            >
              <span className="live-dot" style={{ background: 'var(--cyan)' }} />
              تنبيهات ذكية نشطة
            </span>
          </div>
        </div>

        {/* ── Quick Presets Section ─────────────────────────── */}
        <section className="mb-10">
          <SectionTitle>تنبيهات سريعة</SectionTitle>
          <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--text3)' }}>
            أنشئ تنبيهاً بنقرة واحدة من السيناريوهات الأكثر شيوعاً
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.title)}
                className="glass-card p-4 text-right transition-all duration-200 hover:translate-y-[-2px] cursor-pointer"
                style={{
                  borderInlineStart: `3px solid ${preset.color}`,
                  borderColor: `${preset.color}30`,
                  borderInlineStartColor: preset.color,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: preset.bgColor, color: preset.color }}
                  >
                    {preset.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                      {preset.title}
                    </h3>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                      {preset.description}
                    </p>
                  </div>
                  {/* Plus icon */}
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: preset.bgColor,
                      border: `1px solid ${preset.borderColor}`,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={preset.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Feature Cards ─────────────────────────────────── */}
        <section className="mb-10">
          <SectionTitle>أنواع التنبيهات</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="glass-card p-5 transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  borderInlineStart: `3px solid ${feature.color}`,
                  borderColor: `${feature.color}30`,
                  borderInlineStartColor: feature.color,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: feature.bgColor, color: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Triggered Alerts ───────────────────────── */}
        <section className="mb-10">
          <SectionTitle>آخر التنبيهات المُفعّلة</SectionTitle>
          <div className="text-center py-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" className="mx-auto mb-3">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="text-[12px]" style={{ color: 'var(--text3)' }}>سيتم عرض التنبيهات المفعّلة هنا بعد تفعيل حسابك</span>
          </div>
        </section>

        {/* ── Smart Alerts Panel ────────────────────────────── */}
        <section className="mb-10">
          <SectionTitle>إدارة التنبيهات</SectionTitle>

          <SmartAlertsPanel userId={userId} />
        </section>

        {/* ── Info Card ─────────────────────────────────────── */}
        <section className="glass-card p-5" style={{ border: '1px solid rgba(0,229,255,0.15)' }}>
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>كيف تعمل التنبيهات الذكية؟</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                تراقب التنبيهات الذكية الأسواق المالية والأخبار على مدار الساعة. عند تحقق الشرط الذي حددته — مثل وصول سعر معين أو ظهور خبر يحتوي كلماتك المفتاحية — تتلقى إشعاراً فورياً. يمكنك إنشاء حتى 20 تنبيه نشط وتفعيلها أو تعطيلها في أي وقت.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
