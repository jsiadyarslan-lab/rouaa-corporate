'use client';

// @ts-ignore — next-auth/react may not be installed
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Recommendation interface matching the advisor types
interface QuickRecommendation {
  id: string;
  title: string;
  action: string; // buy, sell, hold
  asset: string;
  direction: 'up' | 'down' | 'neutral';
}

export default function EsPersonalizedGreeting() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<QuickRecommendation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch personalized recommendations
      fetch('/api/advisor', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.recommendations && Array.isArray(data.recommendations)) {
            const quickRecs: QuickRecommendation[] = data.recommendations.slice(0, 3).map((rec: any) => ({
              id: rec.id || Math.random().toString(),
              title: rec.title || rec.text?.slice(0, 60) || 'Recomendación de inversión',
              action: rec.action || 'hold',
              asset: rec.asset || rec.symbol || '',
              direction: rec.direction === 'up' || rec.action === 'buy' ? 'up' : rec.direction === 'down' || rec.action === 'sell' ? 'down' : 'neutral',
            }));
            setRecommendations(quickRecs);
          }
        })
        .catch(() => {
          // Silently fail — greeting still shows without recommendations
        });
    }
  }, [status]);

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null;

  // Only consider authenticated if session has a real user with email or name
  const isLoggedIn = status === 'authenticated' && !!session?.user && !!(session.user.email || session.user.name);
  const userName = session?.user?.name || '';

  return (
    <div className="glass-card" style={{
      padding: '16px 20px',
      background: 'linear-gradient(135deg, rgba(0,229,255,.04), rgba(139,92,246,.03))',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--cyan), var(--purple), transparent)',
        opacity: 0.5,
      }} />

      {isLoggedIn ? (
        <>
          {/* Logged-in greeting */}
          <div className="flex items-center gap-3 mb-3">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
                Hola{userName ? ` ${userName}` : ''},
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text2)' }}>
                Las recomendaciones de hoy se basan en su perfil de inversión
              </p>
            </div>
            <Link
              href="/es/advisor"
              className="ms-auto text-[11px] px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--cyan2)', color: 'var(--cyan)',
                border: '1px solid rgba(0,229,255,.15)',
                textDecoration: 'none',
              }}
            >
              Panel del Asesor
            </Link>
          </div>

          {/* Personalized recommendations */}
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="glass-card"
                  style={{
                    padding: '10px 12px',
                    background: rec.direction === 'up' ? 'rgba(34,197,94,.04)' : rec.direction === 'down' ? 'rgba(239,83,80,.04)' : 'var(--surface-2)',
                    border: `1px solid ${rec.direction === 'up' ? 'rgba(34,197,94,.12)' : rec.direction === 'down' ? 'rgba(239,83,80,.12)' : 'var(--rim)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      color: rec.direction === 'up' ? 'var(--bull)' : rec.direction === 'down' ? 'var(--bear)' : 'var(--gold)',
                    }}>
                      {rec.direction === 'up' ? '▲' : rec.direction === 'down' ? '▼' : '●'}
                    </span>
                    {rec.asset && (
                      <span className="text-[10px] font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                        {rec.asset}
                      </span>
                    )}
                    <span className="text-[9px] px-1.5 py-px rounded-full font-semibold" style={{
                      background: rec.action === 'buy' ? 'var(--bull2)' : rec.action === 'sell' ? 'var(--bear2)' : 'var(--gold2)',
                      color: rec.action === 'buy' ? 'var(--bull)' : rec.action === 'sell' ? 'var(--bear)' : 'var(--gold)',
                    }}>
                      {rec.action === 'buy' ? 'Comprar' : rec.action === 'sell' ? 'Vender' : 'Observar'}
                    </span>
                  </div>
                  <p className="text-[10px] line-clamp-2" style={{ color: 'var(--text2)', lineHeight: '1.6' }}>
                    {rec.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
              Cargando recomendaciones personalizadas...
            </p>
          )}
        </>
      ) : (
        <>
          {/* Logged-out greeting — CTA to register */}
          <div className="flex items-center gap-3">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--cyan2), var(--purple2))',
              border: '1px solid rgba(139,92,246,.15)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 0 1 1h1a4 4 0 0 1 0 8h-1a1 1 0 0 0-1 1v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1H6a4 4 0 0 1 0-8h1a1 1 0 0 0 1-1V6a4 4 0 0 1 4-4z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>
                Obtenga recomendaciones de inversión personalizadas
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text2)' }}>
                Regístrese ahora y obtenga análisis y recomendaciones impulsadas por IA basadas en su perfil de inversión
              </p>
            </div>
            <Link
              href="/es/auth"
              className="text-[12px] px-5 py-2 rounded-lg font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)',
                color: 'var(--bg)', border: 'none',
                boxShadow: '0 2px 12px rgba(0,229,255,0.2)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Registrarse Ahora
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
