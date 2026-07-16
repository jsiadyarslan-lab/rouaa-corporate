import { Metadata } from 'next';
import {
  Users,
  MessageSquare,
  Trophy,
  Star,
  TrendingUp,
  Lightbulb,
  Heart,
  Share2,
  Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Topluluk',
  description: 'Rouaa trading topluluğuna katılın — içgörüleri paylaşın, stratejileri tartışın ve diğer traderlardan öğrenin',
  openGraph: {
    title: 'Rouaa — Topluluk',
    description: 'Rouaa trading topluluğuna katılın — içgörüleri paylaşın, stratejileri tartışın ve diğer traderlardan öğrenin',
  },
};

export default function TrCommunityPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Tartışma Forumları',
      description: 'Piyasa trendlerini tartışın, analizleri paylaşın ve bilgili bir trader topluluğuyla trading fikirlerini değiştirin.',
      color: 'var(--cyan, #00E5FF)',
    },
    {
      icon: Trophy,
      title: 'Sıralamalar',
      description: 'Sinyal doğruluğu ve analiz kalitesi konusunda diğer traderlarla yarışın. Sıralamalarda yükselin ve tanınırlık kazanın.',
      color: 'var(--gold, #FFB800)',
    },
    {
      icon: Lightbulb,
      title: 'Paylaşılan Analizler',
      description: 'Kendi piyasa analizlerinizi yayınlayın, akranlarınızdan geri bildirim alın ve diğer traderlardan benzersiz bakış açıları keşfedin.',
      color: 'var(--purple, #8B5CF6)',
    },
    {
      icon: Star,
      title: 'Uzman İçgörüleri',
      description: 'En iyi katkıda bulunanları takip edin ve yeni analizler yayınladıklarında veya trading sinyallerini paylaştıklarında bildirim alın.',
      color: '#3BA7F0',
    },
    {
      icon: Heart,
      title: 'Tepkiler ve Geri Bildirim',
      description: 'Analizleri yukarı/aşağı oylarıyla değerlendirin, yorum bırakın ve en iyi içeriği öne çıkarın.',
      color: 'var(--bull, #22C55E)',
    },
    {
      icon: Share2,
      title: 'İçerik Paylaşımı',
      description: 'Makaleleri, infografikleri ve raporları doğrudan topluluk akışında veya sosyal medya hesaplarınızda paylaşın.',
      color: 'var(--bear, #EF5350)',
    },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            Topluluk
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Bağlanın, paylaşın ve diğer traderlarla öğrenin
          </p>
        </div>

        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(0,229,255,0.15)',
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))',
            border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Users size={36} style={{ color: 'var(--cyan, #00E5FF)' }} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>
            Topluluk özellikleri yakında kullanıma sunulacak
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Traderların içgörüleri paylaşabileceği, sıralamalarda yarışabileceği ve birbirinden öğrenebileceği dinamik bir topluluk platformu inşa ediyoruz. Lansman için bizi takip edin.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Planlanan Özellikler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => (
              <div
                key={feature.title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <feature.icon size={20} style={{ color: feature.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <Globe size={24} style={{ color: 'var(--cyan, #00E5FF)', margin: '0 auto 12px' }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>
            İlk siz haberdar olun
          </h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Topluluk özelliklerinin lansmanı hakkında bildirim almak ve ilk katılanlardan olmak için Telegram kanalımıza katılın.
          </p>
          <a
            href="/tr/telegram"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px',
              background: 'var(--cyan, #00E5FF)', color: '#000',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Telegram Kanalına Katılın
          </a>
        </div>
      </div>
    </main>
  );
}
