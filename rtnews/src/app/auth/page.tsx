'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// ─── Types ───
type Tab = 'login' | 'register';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'register') setTab('register');

    // V119→V3: Display NextAuth error messages from OAuth callback failures.
    // V3: Check for specific OAuth error codes in URL params.
    // Google OAuth sends error=access_denied or error=invalid_client in callback.
    // NextAuth wraps these as error=OAuthCallback on the /auth page.
    const oauthError = searchParams.get('oauthError'); // explicit Google error
    const err = searchParams.get('error');
    if (oauthError === 'invalid_client') {
      setError('مفتاح Google OAuth غير صالح — تواصل مع الدعم الفني');
    } else if (err) {
      switch (err) {
        case 'OAuthCallback':
          setError('فشل تسجيل الدخول عبر Google — تحقق من إعدادات التطبيق أو حاول لاحقاً');
          break;
        case 'OAuthSignin':
          setError('فشل بدء تسجيل الدخول عبر Google');
          break;
        case 'OAuthCreateAccount':
          setError('فشل إنشاء حساب عبر Google');
          break;
        case 'EmailCreateAccount':
          setError('فشل إنشاء حساب بهذا البريد الإلكتروني');
          break;
        case 'Callback':
          setError('فشل في معالجة رد تسجيل الدخول — قد تكون مشكلة في قاعدة البيانات أو إعدادات Google Console');
          break;
        case 'OAuthAccountNotLinked':
          setError('هذا الحساب مرتبط بطريقة تسجيل دخول أخرى — استخدم نفس الطريقة السابقة');
          break;
        case 'AccessDenied':
          setError('تم رفض الوصول — تحقق من صلاحيات حسابك');
          break;
        case 'Verification':
          setError('رابط التحقق منتهي الصلاحية — اطلب رابطاً جديداً');
          break;
        case 'Configuration':
          setError('خطأ في إعدادات تسجيل الدخول — تواصل مع الدعم');
          break;
        default:
          setError('حدث خطأ أثناء تسجيل الدخول — حاول مرة أخرى');
      }
    }
  }, [searchParams]);

  // ─── Email Login ───
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة السر غير صحيحة');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Register ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreedToTerms) {
      setError('يجب الموافقة على الشروط والأحكام');
      return;
    }

    if (password.length < 8) {
      setError('كلمة السر يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
        return;
      }

      setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
      setTab('login');
      setPassword('');
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login ───
  const handleGoogleLogin = async () => {
    setError('');
    await signIn('google', { callbackUrl: '/' });
  };

  // ─── Passkey Login ───
  const handlePasskeyLogin = async () => {
    setError('');
    setPasskeyLoading(true);

    try {
      // Step 1: Get auth options
      const optRes = await fetch('/api/auth/passkey/auth-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const optData = await optRes.json();

      if (!optRes.ok) {
        setError(optData.error || 'لا يوجد باسكي مسجل');
        setPasskeyLoading(false);
        return;
      }

      // Step 2: Browser authentication
      const credential = await startAuthentication({
        optionsJSON: optData,
      });

      // Step 3: Verify
      const verifyRes = await fetch('/api/auth/passkey/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: optData.userId,
          credential,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || 'فشل التحقق من الباسكي');
        setPasskeyLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        // User cancelled the browser prompt
      } else {
        setError('فشل تسجيل الدخول بالباسكي');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // ─── Passkey Register (after email registration) ───
  const handlePasskeyRegister = async (userId: string) => {
    try {
      const optRes = await fetch('/api/auth/passkey/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const optData = await optRes.json();

      if (!optRes.ok) return;

      const credential = await startRegistration({
        optionsJSON: optData,
      });

      await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credential }),
      });
    } catch {
      // Non-critical — user can add passkey later
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050810' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-2xl p-7" style={{
          background: 'linear-gradient(135deg, rgba(12,18,32,0.95), rgba(8,12,22,0.98))',
          border: '1px solid rgba(0,229,255,0.15)',
          boxShadow: '0 0 60px rgba(0,229,255,0.06), 0 25px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
              <polyline points="4,20 10,12 16,16 24,6" stroke="url(#auth-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="6" r="2.5" fill="#00E5FF" />
              <defs>
                <linearGradient id="auth-grad" x1="4" y1="20" x2="24" y2="6">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[22px] font-bold gradient-text font-heading">رؤى</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'rgba(0,229,255,0.05)' }}>
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all duration-200"
              style={{
                background: tab === 'login' ? 'rgba(0,229,255,0.12)' : 'transparent',
                color: tab === 'login' ? 'var(--cyan)' : 'var(--text3)',
                border: tab === 'login' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
              }}
            >
              تسجيل دخول
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all duration-200"
              style={{
                background: tab === 'register' ? 'rgba(0,229,255,0.12)' : 'transparent',
                color: tab === 'register' ? 'var(--cyan)' : 'var(--text3)',
                border: tab === 'register' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
              }}
            >
              إنشاء حساب
            </button>
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{
              background: 'rgba(5,150,105,0.1)',
              border: '1px solid rgba(5,150,105,0.2)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-[12px]" style={{ color: 'var(--bull)' }}>{success}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.15)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="text-[12px]" style={{ color: 'var(--bear)' }}>{error}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 mb-3"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            المتابعة مع Google
          </button>

          {/* Passkey Button */}
          <button
            onClick={handlePasskeyLogin}
            disabled={passkeyLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 mb-4"
            style={{
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.12)',
              color: 'var(--cyan)',
            }}
          >
            {passkeyLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
            {passkeyLoading ? 'جارٍ التحقق...' : 'تسجيل دخول بالباسكي'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[1px]" style={{ background: 'var(--border)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>أو بالإيميل</span>
            <div className="flex-1 h-[1px]" style={{ background: 'var(--border)' }} />
          </div>

          {/* Email Form */}
          <form onSubmit={tab === 'login' ? handleEmailLogin : handleRegister} className="space-y-3.5">
            {/* Name (register only) */}
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all focus:ring-2"
                  style={{
                    background: 'var(--bg4)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    '--tw-ring-color': 'var(--cyan)',
                  } as any}
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all focus:ring-2"
                style={{
                  background: 'var(--bg4)',
                  border: error ? '1px solid var(--bear)' : '1px solid var(--border)',
                  color: 'var(--text)',
                  '--tw-ring-color': 'var(--cyan)',
                  direction: 'ltr',
                  textAlign: 'right',
                } as any}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                كلمة السر
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={tab === 'register' ? '8 أحرف على الأقل' : 'كلمة السر'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none transition-all focus:ring-2"
                  style={{
                    background: 'var(--bg4)',
                    border: error ? '1px solid var(--bear)' : '1px solid var(--border)',
                    color: 'var(--text)',
                    '--tw-ring-color': 'var(--cyan)',
                    direction: 'ltr',
                    textAlign: 'right',
                  } as any}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors hover:bg-[var(--bg5)]"
                  style={{ color: 'var(--text3)' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms (register only) */}
            {tab === 'register' && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-[var(--cyan)]"
                />
                <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                  أوافق على <a href="/compliance" className="underline hover:text-[var(--cyan)]" style={{ color: 'var(--text2)' }}>الشروط والأحكام</a> و<a href="/compliance" className="underline hover:text-[var(--cyan)]" style={{ color: 'var(--text2)' }}>سياسة الخصوصية</a>
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!email || !password) || (tab === 'register' && !agreedToTerms)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              style={{
                background: loading ? 'var(--bg5)' : 'linear-gradient(135deg, rgba(0,60,80,.9), var(--cyan))',
                color: loading ? 'var(--text3)' : '#050810',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,229,255,.2)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  جارٍ المعالجة...
                </span>
              ) : (
                tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'
              )}
            </button>
          </form>

          {/* Switch tab link */}
          <div className="text-center mt-4">
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
              {tab === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button
                onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="mr-1 font-semibold hover:underline"
                style={{ color: 'var(--cyan)' }}
              >
                {tab === 'login' ? 'إنشاء حساب' : 'تسجيل دخول'}
              </button>
            </span>
          </div>

          {/* Security notice */}
          <div className="mt-4 flex items-center gap-1.5 justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
              محمي بتشفير AES-256 — صلاحية الجلسة 30 يوم
            </span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-3">
          <a href="/" className="text-[11px] transition-colors hover:text-[var(--cyan)]" style={{ color: 'var(--text3)' }}>
            ← العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div className="animate-spin w-8 h-8 rounded-full" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--cyan)' }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
