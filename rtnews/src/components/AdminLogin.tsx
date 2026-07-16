'use client';

import { useState } from 'react';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin();
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
        setPassword('');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050810' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'linear-gradient(135deg, rgba(12,18,32,0.95), rgba(8,12,22,0.98))',
          border: '1px solid rgba(0,229,255,0.15)',
          boxShadow: '0 0 60px rgba(0,229,255,0.06), 0 25px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
              <polyline points="4,20 10,12 16,16 24,6" stroke="url(#login-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="6" r="2.5" fill="#00E5FF" />
              <defs>
                <linearGradient id="login-grad" x1="4" y1="20" x2="24" y2="6">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[28px] font-bold gradient-text font-heading">رؤى</span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[20px] font-bold mb-2" style={{ color: 'var(--text)' }}>
              لوحة تحكم المشرف
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
              أدخل كلمة السر للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                كلمة السر
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="أدخل كلمة السر..."
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all focus:ring-2"
                  style={{
                    background: 'var(--bg4)',
                    border: error ? '1px solid var(--bear)' : '1px solid var(--border)',
                    color: 'var(--text)',
                    '--tw-ring-color': 'var(--cyan)',
                    direction: 'ltr',
                    textAlign: 'right',
                  } as any}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:bg-[var(--bg5)]"
                  style={{ color: 'var(--text3)' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.15)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span className="text-[12px]" style={{ color: 'var(--bear)' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              style={{
                background: loading ? 'var(--bg5)' : 'linear-gradient(135deg, rgba(0,60,80,.9), var(--cyan))',
                color: loading ? 'var(--text3)' : '#050810',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,229,255,.2)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  جارٍ التحقق...
                </span>
              ) : (
                'دخول'
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 flex items-center gap-2 justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
              محمي بتشفير JWT — صلاحية 24 ساعة
            </span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <a href="/" className="text-[12px] transition-colors hover:text-[var(--cyan)]" style={{ color: 'var(--text3)' }}>
            ← العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
