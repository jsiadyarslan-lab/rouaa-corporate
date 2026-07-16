'use client';

import { useState, useEffect } from 'react';
import BackToTop from '@/components/rouaa/BackToTop';

/* ─── Types ──────────────────────────────────────────────────── */
interface ComplianceData {
  compliance: {
    status: 'compliant' | 'warning';
    disclaimers: {
      financial: string;
      aiGenerated: string;
      dataDelay: string;
    };
    contentRules: {
      maxDailyAI: number;
      requireHumanReview: boolean;
      prohibitedContent: string[];
      minConfidenceScore: number;
    };
    metrics: {
      aiArticlesToday: number;
      maxDailyAI: number;
      pendingReview: number;
      totalPublished: number;
    };
    checks: {
      dailyLimitOk: boolean;
      humanReviewEnabled: boolean;
      confidenceThreshold: number;
    };
  };
}

/* ─── Skeleton Helpers ────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-8 w-16 rounded mb-2" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="skeleton h-3 w-40 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CompliancePageClient() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance');
      if (!res.ok) throw new Error('فشل في تحميل بيانات الامتثال');
      const json = await res.json();
      setData(json);
      setLastUpdated(
        new Date().toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Derived values ─────────────────────────────────────── */
  const compliance = data?.compliance;
  const isCompliant = compliance?.status === 'compliant';
  const aiPercentage =
    compliance && compliance.metrics.totalPublished > 0
      ? Math.round((compliance.metrics.aiArticlesToday / compliance.metrics.maxDailyAI) * 100)
      : 0;
  const humanReviewPct = compliance?.checks.humanReviewEnabled ? 100 : 0;
  const activeRules = compliance
    ? [
        compliance.checks.dailyLimitOk,
        compliance.checks.humanReviewEnabled,
        compliance.checks.confidenceThreshold >= 0.7,
      ].filter(Boolean).length
    : 0;

  /* ─── Prohibited content Arabic labels ────────────────────── */
  const prohibitedLabels: Record<string, string> = {
    'investment advice': 'نصائح استثمارية',
    'guaranteed returns': 'عوائد مضمونة',
    'pump and dump': 'التلاعب بالأسعار',
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>

      <div className="max-w-[960px] mx-auto px-4 py-12">
        {/* ── Hero Section ──────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isCompliant ? 'var(--bull2)' : 'var(--bear2)',
                border: isCompliant
                  ? '1px solid rgba(0,200,150,0.25)'
                  : '1px solid rgba(255,77,106,0.25)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isCompliant ? 'var(--bull)' : 'var(--bear)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading" style={{ color: 'var(--text)' }}>
                لوحة الامتثال والالتزام
              </h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
            تلتزم منصة رؤى بأعلى معايير جودة المحتوى والشفافية. تعرض هذه اللوحة حالة الامتثال
            الحالية وإخلاءات المسؤولية وقواعد المحتوى المُطبّقة ومؤشرات الأداء في الوقت الفعلي.
          </p>

          {/* Compliance status badge */}
          {!loading && compliance && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className="live-status"
                style={{
                  background: isCompliant ? 'var(--bull2)' : 'var(--bear2)',
                  border: isCompliant
                    ? '1px solid rgba(0,200,150,0.3)'
                    : '1px solid rgba(255,77,106,0.3)',
                  color: isCompliant ? 'var(--bull)' : 'var(--bear)',
                }}
              >
                <span
                  className="live-dot"
                  style={{ background: isCompliant ? 'var(--bull)' : 'var(--bear)' }}
                />
                {isCompliant ? 'المنصة متوافقة' : 'تنبيه — يحتاج مراجعة'}
              </span>
            </div>
          )}
        </div>

        {/* ── Error State ───────────────────────────────────── */}
        {error && (
          <div
            className="glass-card p-5 mb-8"
            style={{ borderColor: 'rgba(255,77,106,0.25)', background: 'var(--bear2)' }}
          >
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--bear)"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: 'var(--bear)' }}>
                {error}
              </span>
              <button
                onClick={fetchCompliance}
                className="mr-auto text-xs px-3 py-1 rounded-md"
                style={{
                  background: 'rgba(255,77,106,0.15)',
                  color: 'var(--bear)',
                  border: '1px solid rgba(255,77,106,0.3)',
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* ── Compliance Status Cards ───────────────────────── */}
        <section className="mb-10">
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
            حالة الامتثال
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* Articles Today */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--cyan2)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      مقالات اليوم
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                    {compliance?.metrics.aiArticlesToday ?? 0}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                    من أصل {compliance?.metrics.maxDailyAI ?? 50}
                  </p>
                </div>

                {/* AI Usage Percentage */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--purple2)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--purple)"
                        strokeWidth="2"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10" />
                        <path d="M12 2v10l6.93 4" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      نسبة استخدام AI
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-mono-price"
                    style={{ color: aiPercentage > 80 ? 'var(--bear)' : 'var(--text)' }}
                  >
                    {aiPercentage}%
                  </p>
                  <div className="progress-bar mt-2">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${aiPercentage}%`,
                        background:
                          aiPercentage > 80
                            ? 'var(--bear)'
                            : aiPercentage > 50
                              ? 'var(--gold)'
                              : 'var(--bull)',
                      }}
                    />
                  </div>
                </div>

                {/* Human Review */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bull2)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--bull)"
                        strokeWidth="2"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      مراجعة بشرية
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-mono-price"
                    style={{ color: humanReviewPct === 100 ? 'var(--bull)' : 'var(--bear)' }}
                  >
                    {humanReviewPct === 100 ? 'مفعّلة' : 'معطّلة'}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                    {compliance?.metrics.pendingReview ?? 0} بانتظار المراجعة
                  </p>
                </div>

                {/* Active Rules */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--gold2)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      قواعد نشطة
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                    {activeRules}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                    من أصل 3 قواعد
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Disclaimer Section ────────────────────────────── */}
        <section className="mb-10">
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
            إخلاءات المسؤولية
          </h2>

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Financial Disclaimer */}
              <div
                className="glass-card p-5"
                style={{
                  borderColor: 'rgba(255,77,106,0.15)',
                  borderInlineStartWidth: '3px',
                  borderInlineStartColor: 'var(--bear)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'var(--bear2)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--bear)"
                      strokeWidth="2"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--bear)' }}>
                    إخلاء المسؤولية المالية
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {compliance?.disclaimers.financial}
                </p>
              </div>

              {/* AI Generated Disclaimer */}
              <div
                className="glass-card p-5"
                style={{
                  borderColor: 'rgba(139,92,246,0.15)',
                  borderInlineStartWidth: '3px',
                  borderInlineStartColor: 'var(--purple)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'var(--purple2)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--purple)"
                      strokeWidth="2"
                    >
                      <path d="M12 2a10 10 0 1 0 10 10" />
                      <path d="M12 2v10l6.93 4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--purple)' }}>
                    محتوى مُولّد بالذكاء الاصطناعي
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {compliance?.disclaimers.aiGenerated}
                </p>
              </div>

              {/* Data Delay Disclaimer */}
              <div
                className="glass-card p-5"
                style={{
                  borderColor: 'rgba(255,184,0,0.15)',
                  borderInlineStartWidth: '3px',
                  borderInlineStartColor: 'var(--gold)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'var(--gold2)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>
                    تأخير البيانات
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {compliance?.disclaimers.dataDelay}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Content Rules Section ─────────────────────────── */}
        <section className="mb-10">
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
            قواعد المحتوى
          </h2>

          {loading ? (
            <div className="space-y-3">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              {/* Table Header */}
              <div
                className="grid grid-cols-[1fr_auto] px-5 py-3 text-xs font-bold"
                style={{
                  background: 'var(--bg4)',
                  color: 'var(--text3)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span>القاعدة</span>
                <span>الحالة</span>
              </div>

              {/* Row: Max AI Articles */}
              <div
                className="grid grid-cols-[1fr_auto] px-5 py-4 items-center"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    الحد الأقصى لمقالات AI يومياً
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    الاستخدام الحالي:{' '}
                    <span
                      className="font-mono-price font-semibold"
                      style={{ color: 'var(--cyan)' }}
                    >
                      {compliance?.metrics.aiArticlesToday ?? 0}
                    </span>{' '}
                    / {compliance?.contentRules.maxDailyAI ?? 50}
                  </p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: compliance?.checks.dailyLimitOk ? 'var(--bull2)' : 'var(--bear2)',
                    color: compliance?.checks.dailyLimitOk ? 'var(--bull)' : 'var(--bear)',
                    border: compliance?.checks.dailyLimitOk
                      ? '1px solid rgba(0,200,150,0.25)'
                      : '1px solid rgba(255,77,106,0.25)',
                  }}
                >
                  {compliance?.checks.dailyLimitOk ? 'ضمن الحد' : 'تجاوز الحد'}
                </span>
              </div>

              {/* Row: Human Review */}
              <div
                className="grid grid-cols-[1fr_auto] px-5 py-4 items-center"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    اشتراط المراجعة البشرية
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    جميع المقالات المُولّدة آلياً تخضع لمراجعة بشرية قبل النشر
                  </p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: compliance?.checks.humanReviewEnabled
                      ? 'var(--bull2)'
                      : 'var(--bear2)',
                    color: compliance?.checks.humanReviewEnabled ? 'var(--bull)' : 'var(--bear)',
                    border: compliance?.checks.humanReviewEnabled
                      ? '1px solid rgba(0,200,150,0.25)'
                      : '1px solid rgba(255,77,106,0.25)',
                  }}
                >
                  {compliance?.checks.humanReviewEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              </div>

              {/* Row: Prohibited Content */}
              <div
                className="grid grid-cols-[1fr_auto] px-5 py-4 items-start"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    المحتوى المحظور
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {compliance?.contentRules.prohibitedContent.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] px-2.5 py-1 rounded-md font-semibold"
                        style={{
                          background: 'var(--bear2)',
                          color: 'var(--bear)',
                          border: '1px solid rgba(255,77,106,0.2)',
                        }}
                      >
                        {prohibitedLabels[item] || item}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: 'var(--bear2)',
                    color: 'var(--bear)',
                    border: '1px solid rgba(255,77,106,0.25)',
                  }}
                >
                  محظور
                </span>
              </div>

              {/* Row: Min Confidence Score */}
              <div className="grid grid-cols-[1fr_auto] px-5 py-4 items-center">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    الحد الأدنى لنقاط الثقة
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    لا يُنشر محتوى تقل نسبة ثقة AI عن{' '}
                    <span className="font-mono-price font-semibold" style={{ color: 'var(--cyan)' }}>
                      {Math.round((compliance?.checks.confidenceThreshold ?? 0.7) * 100)}%
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="confidence-bar w-20">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${Math.round((compliance?.checks.confidenceThreshold ?? 0.7) * 100)}%`,
                        background: 'var(--cyan)',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-mono-price font-semibold"
                    style={{ color: 'var(--cyan)' }}
                  >
                    {Math.round((compliance?.checks.confidenceThreshold ?? 0.7) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Metrics Section ───────────────────────────────── */}
        <section className="mb-10">
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
            مؤشرات الأداء
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Articles */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--cyan2)' }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--cyan)"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                    إجمالي المقالات
                  </span>
                </div>
                <p
                  className="text-3xl font-bold font-mono-price animate-count-up"
                  style={{ color: 'var(--cyan)' }}
                >
                  {compliance?.metrics.totalPublished?.toLocaleString('ar-SA') ?? '0'}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                  مقالة منشورة في قاعدة البيانات
                </p>
              </div>

              {/* Articles Today */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--bull2)' }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--bull)"
                      strokeWidth="2"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                    مقالات اليوم
                  </span>
                </div>
                <p
                  className="text-3xl font-bold font-mono-price animate-count-up"
                  style={{ color: 'var(--bull)' }}
                >
                  {compliance?.metrics.aiArticlesToday ?? 0}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                  مقالة نُشرت اليوم
                </p>
              </div>

              {/* Pending Review (Breaking proxy) */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--gold2)' }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                    بانتظار المراجعة
                  </span>
                </div>
                <p
                  className="text-3xl font-bold font-mono-price animate-count-up"
                  style={{ color: 'var(--gold)' }}
                >
                  {compliance?.metrics.pendingReview ?? 0}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                  مقالة تحتاج مراجعة بشرية
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Last Updated ──────────────────────────────────── */}
        {!loading && !error && lastUpdated && (
          <div
            className="flex items-center justify-center gap-2 py-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text3)"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              آخر تحديث: {lastUpdated}
            </span>
            <button
              onClick={fetchCompliance}
              className="text-xs px-2 py-1 rounded-md transition-colors"
              style={{
                color: 'var(--cyan)',
                background: 'var(--cyan2)',
                border: '1px solid rgba(0,229,255,0.15)',
              }}
            >
              تحديث
            </button>
          </div>
        )}
      </div>

      <BackToTop />
    </main>
  );
}
