// ─── Visitor Analytics Component ──────────────────────────────
// Comprehensive, data-driven visitor analytics section
// Fetches real data from /api/admin/visitors

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Eye, Clock, ArrowUpRight, ArrowDownRight,
  Globe2, Smartphone, Monitor, TrendingUp, MousePointerClick,
  MapPin, BarChart3, Loader2,
} from 'lucide-react';

interface VisitorData {
  todayVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  totalPageViews: number;
  avgSessionDuration: string;
  bounceRate: number;
  topPages: { path: string; views: number }[];
  sources: { name: string; percentage: number }[];
  devices: { mobile: number; desktop: number; other: number };
  dailyVisitors: { date: string; count: number }[];
  countries: { name: string; flag: string; visitors: number }[];
}

// ─── Animated Counter ───────────────────────────────────────
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className="font-mono-price">{(display ?? 0).toLocaleString('ar-SA')}</span>;
}

// ─── Source color mapping ───────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  'مباشر': 'var(--cyan)',
  'جوجل': 'var(--bull)',
  'تويتر/X': 'var(--purple)',
  'تيليجرام': 'var(--gold)',
  'أخرى': 'var(--text3)',
};

// ─── Mini bar chart for daily visitors ──────────────────────
function DailyVisitorChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="flex items-end gap-2 min-h-[120px] sm:min-h-[160px]" style={{ direction: 'ltr' }}>
      {data.map((d, i) => {
        const date = new Date(d.date);
        const dayName = dayNames[date.getDay()] || d.date.slice(5);
        const height = Math.max((d.count / max) * 90, 4);
        const isToday = i === data.length - 1;

        return (
          <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1 group">
            <span className="font-mono-price text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text3)' }}>
              {d.count.toLocaleString('ar-SA')}
            </span>
            <div
              className="w-full rounded-t-sm transition-all duration-500 ease-out"
              style={{
                height: `${height}px`,
                background: isToday
                  ? 'linear-gradient(180deg, var(--cyan), rgba(0,229,255,0.4))'
                  : 'linear-gradient(180deg, rgba(0,229,255,0.5), rgba(0,229,255,0.15))',
                boxShadow: isToday ? '0 0 12px rgba(0,229,255,0.2)' : 'none',
              }}
            />
            <span className="text-[11px] font-medium" style={{ color: isToday ? 'var(--cyan)' : 'var(--text4)' }}>
              {dayName.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function VisitorAnalytics() {
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const res = await fetch('/api/admin/visitors');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch visitor data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
    const interval = setInterval(() => { if (document.hidden) return; fetchVisitors(); }, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
              <Users size={16} style={{ color: 'var(--bull)' }} />
            </div>
            تحليلات الزوار
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--cyan)' }} />
        </CardContent>
      </Card>
    );
  }

  // Fallback if no data
  if (!data) {
    return (
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
              <Users size={16} style={{ color: 'var(--bull)' }} />
            </div>
            تحليلات الزوار
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لا تتوفر بيانات الزوار حالياً</p>
        </CardContent>
      </Card>
    );
  }

  // No fake trends — only show raw numbers from API
  return (
    <div className="space-y-4">
      {/* ═══ Main Visitor Stats Card ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--text)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
              <Users size={16} style={{ color: 'var(--bull)' }} />
            </div>
            تحليلات الزوار
            <span className="mr-auto text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.12)' }}>
              مباشر
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* ── Key Metrics Grid ── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Eye, label: 'زوار اليوم', value: data.todayVisitors,
                color: 'var(--cyan)',
                bg: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, transparent 100%)',
              },
              {
                icon: TrendingUp, label: 'زوار الأسبوع', value: data.weekVisitors,
                color: 'var(--bull)',
                bg: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, transparent 100%)',
              },
              {
                icon: MousePointerClick, label: 'مشاهدات الصفحات', value: data.totalPageViews,
                color: 'var(--purple)',
                bg: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 100%)',
              },
              {
                icon: Clock, label: 'مدة الجلسة', value: null, displayValue: data.avgSessionDuration,
                color: 'var(--gold)',
                bg: 'linear-gradient(135deg, rgba(255,184,0,0.08) 0%, transparent 100%)',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3.5 rounded-xl border transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: stat.bg,
                  borderColor: `${stat.color}18`,
                }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <stat.icon size={13} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="font-mono-price text-[22px] font-bold leading-none" style={{ color: stat.color }}>
                  {stat.displayValue || <AnimatedCounter value={stat.value || 0} />}
                </div>
                <div className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--text3)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Bounce Rate ── */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(239,83,80,0.1)' }}>
                <ArrowDownRight size={11} style={{ color: 'var(--bear)' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>معدل الارتداد</span>
            </div>
            <span className="font-mono-price text-[14px] font-bold" style={{ color: data.bounceRate > 50 ? 'var(--bear)' : 'var(--bull)' }}>
              {data.bounceRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Daily Visitors Chart ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
              <BarChart3 size={13} style={{ color: 'var(--cyan)' }} />
            </div>
            الزوار اليوميون
            <span className="mr-auto text-[11px]" style={{ color: 'var(--text4)' }}>آخر 7 أيام</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyVisitors.length > 0 ? (
            <DailyVisitorChart data={data.dailyVisitors} />
          ) : (
            <div className="h-32 flex items-center justify-center text-[11px]" style={{ color: 'var(--text3)' }}>
              لا توجد بيانات كافية
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Traffic Sources ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--purple2)' }}>
              <Globe2 size={13} style={{ color: 'var(--purple)' }} />
            </div>
            مصادر الحركة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.sources.map((source) => {
            const color = SOURCE_COLORS[source.name] || 'var(--text3)';
            return (
              <div key={source.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{source.name}</span>
                  <span className="font-mono-price text-[11px] font-bold" style={{ color }}>{source.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${source.percentage}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ═══ Device Breakdown ═══ */}
      <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold2)' }}>
              <Smartphone size={13} style={{ color: 'var(--gold)' }} />
            </div>
            الأجهزة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Smartphone, label: 'جوال', value: data.devices.mobile, color: 'var(--cyan)' },
              { icon: Monitor, label: 'مكتبي', value: data.devices.desktop, color: 'var(--purple)' },
              { icon: Globe2, label: 'أخرى', value: data.devices.other, color: 'var(--text3)' },
            ].map((device) => (
              <div
                key={device.label}
                className="flex flex-col items-center p-3 rounded-lg transition-all duration-200 hover:scale-[1.03]"
                style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
              >
                <device.icon size={18} style={{ color: device.color }} className="mb-2" />
                <span className="font-mono-price text-[16px] font-bold" style={{ color: device.color }}>{device.value}%</span>
                <span className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{device.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Top Countries ═══ */}
      {data.countries.length > 0 && (
        <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cyan2)' }}>
                <MapPin size={13} style={{ color: 'var(--cyan)' }} />
              </div>
              الدول الأكثر زيارة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.countries.map((country, idx) => {
              const maxVisitors = data.countries[0]?.visitors || 1;
              return (
                <div key={country.name} className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-[var(--bg4)]">
                  <span className="text-[14px]">{country.flag}</span>
                  <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--text2)' }}>{country.name}</span>
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(country.visitors / maxVisitors) * 100}%`,
                        background: 'var(--cyan)',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="font-mono-price text-[11px] font-bold w-10 text-left" style={{ color: 'var(--text)' }}>
                    {country.visitors.toLocaleString('ar-SA')}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ═══ Top Pages ═══ */}
      {data.topPages.length > 0 && (
        <Card className="border-0 overflow-hidden" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bull2)' }}>
                <Eye size={13} style={{ color: 'var(--bull)' }} />
              </div>
              الصفحات الأكثر زيارة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.topPages.slice(0, 5).map((page, idx) => (
              <div key={page.path} className="flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-[var(--bg4)]">
                <span className="font-mono-price text-[11px] w-4 text-center font-bold" style={{ color: idx < 3 ? 'var(--cyan)' : 'var(--text4)' }}>
                  {idx + 1}
                </span>
                <span className="text-[11px] font-mono truncate flex-1" style={{ color: 'var(--text2)' }}>{page.path}</span>
                <span className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                  {page.views.toLocaleString('ar-SA')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
