// ─── English Portfolio Page ────────────────────────────────────────
// Client Component — Auth-gated portfolio placeholder
// Shows login prompt for unauthenticated users, portfolio view for authenticated

'use client';

import { useSession } from 'next-auth/react';
import {
  Briefcase,
  LogIn,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function EnPortfolioPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--cyan, #00E5FF)', borderTopColor: 'transparent' }} />
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              My Portfolio
            </h1>
            <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Track your investments and monitor performance
            </p>
          </div>

          {/* Login prompt */}
          <div
            className="rounded-2xl text-center p-10"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Briefcase size={28} style={{ color: 'var(--cyan, #00E5FF)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              Sign In to View Your Portfolio
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Log in to track your investments, view performance metrics, and manage your watchlist across all your devices.
            </p>
            <a
              href="/api/auth/signin"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '10px',
                background: 'var(--cyan, #00E5FF)', color: '#000',
                fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              <LogIn size={16} />
              Sign In
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated view — portfolio placeholder
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            My Portfolio
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Track your investments and monitor performance
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Value', value: '--', color: 'var(--cyan, #00E5FF)', icon: DollarSign },
            { label: 'Today P/L', value: '--', color: 'var(--bull, #22C55E)', icon: TrendingUp },
            { label: 'Total P/L', value: '--', color: 'var(--bull, #22C55E)', icon: ArrowUpRight },
            { label: 'Open Positions', value: '0', color: 'var(--purple, #8B5CF6)', icon: PieChart },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              }}
            >
              <stat.icon size={18} style={{ color: stat.color, margin: '0 auto 6px' }} />
              <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Portfolio content placeholder */}
        <div
          className="rounded-2xl text-center p-10"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <BarChart3 size={40} style={{ color: 'var(--text4, #6A7A8E)', margin: '0 auto 12px' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>
            No Positions Yet
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Your portfolio is empty. Start tracking assets by adding positions from the Markets page or following trading signals.
          </p>
        </div>
      </div>
    </main>
  );
}
