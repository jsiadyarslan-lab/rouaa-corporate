// ─── Turkish About Page ──────────────────────────────────────────────
// Server Component — About Rouaa platform (Turkish version)

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rouaa Hakkında',
  description:
    'Rouaa\'yı keşfedin — yapay zeka destekli finansal haber ve analiz platformu, gerçek zamanlı piyasa içgörüleri, trading sinyalleri ve kapsamlı raporlar sunar.',
};

export default function TrAboutPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Rouaa Hakkında
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Modern yatırımcı için yapay zeka destekli finansal istihbarat
          </p>
        </div>

        {/* Hero Card */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Rouaa, yapay zekanın gücünden yararlanarak dünya genelindeki traderlar,
            yatırımcılar ve finans profesyonellerine gerçek zamanlı piyasa içgörüleri
            sunan yeni nesil bir finansal haber ve analiz platformudur. Platformumuz,
            doğru, zamanında ve uygulanabilir finansal bilgiler sunmak için son teknoloji
            yapay zeka algoritmalarını uzman editöryal denetimle birleştirir.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Kurumsal düzeyde finansal istihbarata erişimi demokratikleştirme misyonuyla
            kurulan Rouaa, kurumsal analiz ile bireysel yatırımcılar arasındaki boşluğu
            doldurur. İster forex, ister emtia, ister kripto para veya hisse senedi
            piyasalarında işlem yapıyor olun, platformumuz hızla değişen piyasalarda
            veriye dayalı içgörülerle donatır.
          </p>
        </div>

        {/* Our Mission */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan, #00E5FF)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Misyonumuz
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Misyonumuz, her yatırımcıya bir zamanlar yalnızca kurumsal oyunculara ayrılmış
              olan aynı kalitede finansal istihbarata erişim sağlamaktır. Zamanında, doğru ve
              uygulanabilir piyasa analizine erişimin bir ayrıcalık olmaması gerektiğine —
              standart olması gerektiğine inanıyoruz.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Yapay zeka ve doğal dil işlemeden yararlanarak, küresel piyasaları, haber
              akışlarını ve ekonomik verileri sürekli izliyor ve en önemli içgörüleri ortaya
              çıkarıyoruz. Yapay zekamız trendleri belirler, duygu değişikliklerini tespit
              eder ve trading sinyalleri üretir — hepsini gerçek zamanlı olarak — böylece
              kritik bir piyasa hareketini asla kaçırmazsınız.
            </p>
          </div>
        </div>

        {/* Our Vision */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--purple, #8B5CF6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Vizyonumuz
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Her bireyin — geçmişi veya sermayesi ne olursa olsun — kurumsal kalitede
              finansal analiz ve piyasa istihbaratına erişebildiği bir dünya hayal ediyoruz.
              Hedefimiz, dünya genelindeki traderlar ve yatırımcılar için en güvenilir
              yapay zeka destekli finansal yardımcı olmaktır.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Piyasalar daha karmaşık ve birbirine bağlı hale geldikçe, gerçek zamanlı
              akıllı analize olan ihtiyaç hiç bu kadar büyük olmamıştı. Rouaa, finansal
              bilginin geleceğini inşa ediyor — yapay zeka ve insan uzmanlığının el ele
              çalışarak kaosa netlik getirip, gürültüyü bilgiye ve belirsizliği fırsata
              dönüştürdüğü bir gelecek.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold, #d4af37)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Sunduğumuz Hizmetler
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Canlı Piyasa Haberleri',
                desc: 'Yapay zeka desteğiyle gerçek zamanlı finansal haber kapsamı — forex, kripto, emtia ve hisse senetleri.',
              },
              {
                title: 'Yapay Zeka Trading Sinyalleri',
                desc: 'Tescilli algoritmalarımız tarafından üretilen giriş, stop-loss ve take-profit seviyeli veriye dayalı alış/satış sinyalleri.',
              },
              {
                title: 'Kapsamlı Raporlar',
                desc: 'Piyasa trendleri, ekonomik olaylar ve sektör performansı hakkında kapsamlı analitik raporlar.',
              },
              {
                title: 'Ekonomik Takvim',
                desc: 'Piyasaları hareket ettiren temel ekonomik olayları ve veri yayınlarını, yapay zeka tarafından tahmin edilen etki değerlendirmeleriyle takip edin.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.12)',
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--cyan, #00E5FF)' }}
          >
            Rouaa — Bilgiyi içgörüye, içgörüyü fırsata dönüştürmek.
          </p>
        </div>
      </div>
    </main>
  );
}
