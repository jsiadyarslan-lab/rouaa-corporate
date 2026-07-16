// ─── French Price Alerts Page ─────────────────────────────────────
// Client Component — Auth-gated price alert management placeholder

'use client';

import { useSession } from 'next-auth/react';
import {
  Bell,
  LogIn,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function TrAlertsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--gold, #FFB800)', borderTopColor: 'transparent' }} />
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
              Fiyat Uyarıları
            </h1>
            <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Varlıklar hedef fiyatlarınıza ulaştığında bildirim alın
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
              background: 'rgba(255,184,0,0.08)',
              border: '1px solid rgba(255,184,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Bell size={28} style={{ color: 'var(--gold, #FFB800)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              Fiyat uyarıları oluşturmak için giriş yapın
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Herhangi bir varlık için özel fiyat uyarıları oluşturmak için giriş yapın. Hedeflerinize ulaşıldığında Telegram veya e-posta ile anlık bildirimler alın.
            </p>
            <a
              href="/api/auth/signin"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '10px',
                background: 'var(--gold, #FFB800)', color: '#000',
                fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              <LogIn size={16} />
              Giriş yap
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated view — alerts placeholder
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
              Fiyat Uyarıları
            </h1>
            <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
              Varlıklar hedef fiyatlarınıza ulaştığında bildirim alın
            </p>
          </div>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px',
              background: 'var(--gold, #FFB800)', border: 'none',
              color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Uyarı oluştur
          </button>
        </div>

        {/* Alert types info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: 'Fiyat üstü', desc: 'Alerte lorsque le prix monte au-dessus d\'une cible', color: 'var(--bull, #22C55E)' },
            { icon: TrendingDown, label: 'Fiyat altı', desc: 'Alerte lorsque le prix descend en-dessous d\'une cible', color: 'var(--bear, #EF5350)' },
            { icon: AlertTriangle, label: 'Oynaklık', desc: 'Olağandışı fiyat hareketlerinde uyarı', color: 'var(--gold, #FFB800)' },
          ].map(type => (
            <div
              key={type.label}
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              }}
            >
              <type.icon size={20} style={{ color: type.color, marginBottom: '8px' }} />
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>
                {type.label}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>
                {type.desc}
              </p>
            </div>
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
          <Bell size={40} style={{ color: 'var(--text4, #6A7A8E)', margin: '0 auto 12px' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Aktif uyarı yok
          </h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Vous n&apos;avez pas encore défini d&apos;alertes de prix. Créez une alerte pour être notifié lorsqu&apos;un actif atteint votre prix cible.
          </p>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px',
              background: 'var(--gold, #FFB800)', border: 'none',
              color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            İlk uyarınızı oluşturun
          </button>
        </div>

        {/* Tip */}
        <div
          className="rounded-xl p-4 mt-6"
          style={{
            background: 'rgba(255,184,0,0.06)',
            border: '1px solid rgba(255,184,0,0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <Volume2 size={16} style={{ color: 'var(--gold, #FFB800)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--gold, #FFB800)' }}>İpucu</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                Connectez votre compte Telegram pour recevoir des notifications push instantanées lorsque vos alertes se déclenchent. Configurez l&apos;intégration depuis la <a href="/tr/telegram" style={{ color: 'var(--cyan, #00E5FF)', fontWeight: 600, textDecoration: 'none' }}>Telegram sayfası</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
