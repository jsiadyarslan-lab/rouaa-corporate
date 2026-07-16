'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

type Tab = 'login' | 'register';

function FrAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'register') setTab('register');
    const err = searchParams.get('error');
    if (err) setError('Erreur de connexion — veuillez réessayer');
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { setError('E-mail ou mot de passe invalide'); }
      else { router.push('/fr'); router.refresh(); }
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!agreedToTerms) { setError('Vous devez accepter les Conditions'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'L\'inscription a échoué'); return; }
      setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.');
      setTab('login');
      setPassword('');
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => { setError(''); await signIn('google', { callbackUrl: '/fr' }); };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="ltr" style={{ background: '#050810' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
      </div>
      <div className="relative w-full max-w-[400px]">
        <div className="rounded-2xl p-7" style={{
          background: 'linear-gradient(135deg, rgba(12,18,32,0.95), rgba(8,12,22,0.98))',
          border: '1px solid rgba(0,229,255,0.15)',
          boxShadow: '0 0 60px rgba(0,229,255,0.06), 0 25px 50px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span className="text-[22px] font-bold gradient-text font-heading">ROUAA</span>
          </div>

          <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'rgba(0,229,255,0.05)' }}>
            <button onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all"
              style={{ background: tab === 'login' ? 'rgba(0,229,255,0.12)' : 'transparent', color: tab === 'login' ? 'var(--cyan)' : 'var(--text3)', border: tab === 'login' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent' }}>
              Connexion
            </button>
            <button onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
              className="flex-1 py-2 text-[13px] font-bold rounded-md transition-all"
              style={{ background: tab === 'register' ? 'rgba(0,229,255,0.12)' : 'transparent', color: tab === 'register' ? 'var(--cyan)' : 'var(--text3)', border: tab === 'register' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent' }}>
              Créer un compte
            </button>
          </div>

          {success && <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}><span className="text-[12px]" style={{ color: 'var(--bull)' }}>{success}</span></div>}
          {error && <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}><span className="text-[12px]" style={{ color: 'var(--bear)' }}>{error}</span></div>}

          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5 mb-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[1px]" style={{ background: 'var(--border)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>ou avec e-mail</span>
            <div className="flex-1 h-[1px]" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={tab === 'login' ? handleEmailLogin : handleRegister} className="space-y-3.5">
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Nom (facultatif)</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom"
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none focus:ring-2"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} disabled={loading} />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>E-mail</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="votre@email.com" required autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none focus:ring-2"
                style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} disabled={loading} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={tab === 'register' ? 'Au moins 8 caractères' : 'Mot de passe'} required
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] outline-none focus:ring-2"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text3)' }} tabIndex={-1}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            {tab === 'register' && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 rounded accent-[var(--cyan)]" />
                <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                  J&apos;accepte les <a href="/fr/compliance" className="underline" style={{ color: 'var(--text2)' }}>Conditions</a> et la <a href="/fr/privacy" className="underline" style={{ color: 'var(--text2)' }}>Politique de confidentialité</a>
                </span>
              </label>
            )}
            <button type="submit" disabled={loading || (!email || !password) || (tab === 'register' && !agreedToTerms)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: loading ? 'var(--bg5)' : 'linear-gradient(135deg, rgba(0,60,80,.9), var(--cyan))', color: loading ? 'var(--text3)' : '#050810' }}>
              {loading ? 'Traitement...' : tab === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
              {tab === 'login' ? 'Vous n\'avez pas de compte ?' : 'Vous avez déjà un compte ?'}
              <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="ml-1 font-semibold hover:underline" style={{ color: 'var(--cyan)' }}>
                {tab === 'login' ? 'Créer un compte' : 'Connexion'}
              </button>
            </span>
          </div>
        </div>
        <div className="text-center mt-3">
          <a href="/fr" className="text-[11px] hover:text-[var(--cyan)]" style={{ color: 'var(--text3)' }}>← Retour à l&apos;accueil</a>
        </div>
      </div>
    </div>
  );
}

export default function FrAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}><div className="animate-spin w-8 h-8 rounded-full" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--cyan)' }} /></div>}>
      <FrAuthContent />
    </Suspense>
  );
}
