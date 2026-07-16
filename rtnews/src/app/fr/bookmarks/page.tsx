// ─── French Bookmarks Page ────────────────────────────────────────
// Client Component — Auth-gated bookmarks placeholder

'use client';

import { useSession } from 'next-auth/react';
import {
  Bookmark,
  LogIn,
  Newspaper,
  FileText,
  BarChart3,
  Image,
  Clock,
} from 'lucide-react';

export default function FrBookmarksPage() {
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
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              Favoris
            </h1>
            <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Sauvegardez des articles, rapports et analyses pour plus tard
            </p>
          </div>

          <div
            className="rounded-2xl text-center p-10"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Bookmark size={28} style={{ color: 'var(--purple, #8B5CF6)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              Connectez-vous pour voir vos favoris
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Connectez-vous pour sauvegarder des articles, rapports et analyses dans votre liste de lecture personnelle et y accéder à tout moment.
            </p>
            <a
              href="/api/auth/signin"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '10px',
                background: 'var(--purple, #8B5CF6)', color: '#fff',
                fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              <LogIn size={16} />
              Se connecter
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated view
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            Favoris
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Vos articles, rapports et analyses sauvegardés
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { label: 'Tous', icon: Bookmark, active: true },
            { label: 'Actualités', icon: Newspaper, active: false },
            { label: 'Rapports', icon: FileText, active: false },
            { label: 'Analyses', icon: BarChart3, active: false },
            { label: 'Infographies', icon: Image, active: false },
          ].map(cat => (
            <button
              key={cat.label}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '8px',
                background: cat.active ? 'var(--purple2, rgba(139,92,246,0.06))' : 'var(--bg4, #111828)',
                border: `1px solid ${cat.active ? 'var(--purple, #8B5CF6)' : 'var(--border, rgba(255,255,255,0.085))'}`,
                color: cat.active ? 'var(--purple, #8B5CF6)' : 'var(--text3, #8A9DB2)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div
          className="rounded-2xl text-center p-10"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <Bookmark size={40} style={{ color: 'var(--text4, #6A7A8E)', margin: '0 auto 12px' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Aucun favori pour le moment
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Commencez à sauvegarder des articles, rapports et analyses en cliquant sur l&apos;icône favori sur n&apos;importe quel contenu. Vos éléments sauvegardés apparaîtront ici.
          </p>
        </div>
      </div>
    </main>
  );
}
