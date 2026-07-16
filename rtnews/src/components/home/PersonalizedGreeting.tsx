'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSharedLabels, type SharedLabelKey } from '@/lib/i18n/shared';

// Recommendation interface matching the advisor types
interface QuickRecommendation {
  id: string;
  title: string;
  action: string; // buy, sell, hold
  asset: string;
  direction: 'up' | 'down' | 'neutral';
}

interface PersonalizedGreetingProps {
  /** Locale code: 'ar' | 'en' | 'fr'. Defaults to 'ar'. */
  locale?: string;
}

export default function PersonalizedGreeting({ locale = 'ar' }: PersonalizedGreetingProps) {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<QuickRecommendation[]>([]);
  const [mounted, setMounted] = useState(false);

  // ── i18n labels ──
  const L = getSharedLabels(locale);

  // Locale-aware link prefix
  const prefix = locale === 'ar' ? '/ar' : `/${locale}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // V16: Use userId from session to avoid 400 error on /api/advisor
      const userId = (session.user as any)?.id || session.user.email || session.user.name;
      if (!userId) return;

      fetch(`/api/advisor?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
            const quickRecs: QuickRecommendation[] = data.recommendations.slice(0, 3).map((rec: any) => ({
              id: rec.id || Math.random().toString(),
              title: rec.title || rec.text?.slice(0, 60) || L['greeting.fallbackTitle'],
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
  }, [status, session, L]);

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null;

  // V235 FIX: Only consider authenticated if session has a real user with email or name
  const isLoggedIn = status === 'authenticated' && !!session?.user && !!(session.user.email || session.user.name);
  const userName = session?.user?.name || '';

  // Action label helper
  const actionLabel = (action: string) =>
    action === 'buy' ? L['greeting.action.buy']
      : action === 'sell' ? L['greeting.action.sell']
      : L['greeting.action.watch'];

  return (
    <div className="glass-card" style={{
      padding: '16px 20px',
      background: 'linear-gradient(135deg, rgba(0,229,255,.04), rgba(139,92,246,.03))',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative border */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '100%', height: '2px',
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
                {L['greeting.hello']}{userName ? ` ${userName}` : ''}{locale === 'ar' ? '،' : ','}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text2)' }}>
                {L['greeting.subtitle']}
              </p>
            </div>
            <Link
              href={`${prefix}/advisor`}
              className="ms-auto text-[11px] px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--cyan2)', color: 'var(--cyan)',
                border: '1px solid rgba(0,229,255,.15)',
                textDecoration: 'none',
              }}
            >
              {L['greeting.advisorPanel']}
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
                      {actionLabel(rec.action)}
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
              {L['greeting.loadingRecs']}
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
                {L['greeting.cta.heading']}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text2)' }}>
                {L['greeting.cta.subtitle']}
              </p>
            </div>
            <Link
              href={`${prefix}/auth`}
              className="text-[12px] px-5 py-2 rounded-lg font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--cyan), #0ea5e9)',
                color: 'var(--bg)', border: 'none',
                boxShadow: '0 2px 12px rgba(0,229,255,0.2)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {L['greeting.cta.signUp']}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
