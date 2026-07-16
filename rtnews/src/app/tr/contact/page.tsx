// ─── İletişim Sayfası (Türkçe) ────────────────────────────────────────────
// Composant serveur — Informations de contact pour la plateforme Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bize Ulaşın',
  description:
    "Rouaa ekibiyle iletişime geçin. İletişim bilgilerimiz, destek kanallarımız ve sosyal medya bağlantılarımız.",
};

export default function TrContactPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* En-tête */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Bize Ulaşın
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Size yardımcı olmak için buradayız. Aşağıdaki kanallardan biriyle bize ulaşın.
          </p>
        </div>

        {/* Carte d'introduction */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Platformumuz hakkında bir sorunuz, teknik desteğe ihtiyacınız, bir sorun bildirmek
            veya ortaklık fırsatlarıyla ilgileniyor olun, ekibimiz size yardımcı olmaya hazırdır.
            Tüm taleplere 24-48 iş saati içinde yanıt vermeyi taahhüt ediyoruz.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Daha hızlı yanıt için lütfen aşağıdaki uygun iletişim kanalını kullanın.
            Hesap e-posta adresiniz, bulunduğunuz sayfa veya sorunun ekran görüntüsü gibi
            ilgili detayları eklemek talebinizi daha hızlı işlememize yardımcı olur.
          </p>
        </div>

        {/* Canaux de contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'E-mail',
              detail: 'support@rouaa.com',
              sub: 'Genel talepler ve destek',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple, #8B5CF6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              ),
              title: 'Telegram',
              detail: '@rouaa_support',
              sub: 'Gerçek zamanlı sohbet ve bildirimler',
              accent: 'rgba(139,92,246,0.08)',
              border: 'rgba(139,92,246,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #d4af37)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'Ticari talepler',
              detail: 'partnerships@rouaa.com',
              sub: 'Ortaklıklar ve reklam',
              accent: 'rgba(212,175,55,0.08)',
              border: 'rgba(212,175,55,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              ),
              title: 'Teknik destek',
              detail: 'tech@rouaa.com',
              sub: 'Hata raporları ve platform sorunları',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
          ].map(channel => (
            <div
              key={channel.title}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: channel.accent,
                  border: `1px solid ${channel.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                {channel.icon}
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: 'var(--text, #E8EDF5)' }}
              >
                {channel.title}
              </h3>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--cyan, #00E5FF)' }}
              >
                {channel.detail}
              </p>
              <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>
                {channel.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Réseaux sociaux */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Bizi Takip Edin
          </h2>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
                En son piyasa güncellemeleri, platform duyuruları ve topluluk tartışmaları için
              Rouaa'yı sosyal medyada takip edin. Gerçek zamanlı analizler için bizi takip edin ve
              büyüyen trader ve yatırımcı topluluğumuza katılın.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'X (Twitter)', handle: '@rouaa_news' },
                { name: 'Telegram', handle: 't.me/rouaa_news' },
                { name: 'LinkedIn', handle: 'Rouaa Financial' },
                { name: 'YouTube', handle: 'Rouaa Finance' },
              ].map(social => (
                <span
                  key={social.name}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    color: 'var(--text2, #B0C4D8)',
                  }}
                >
                  {social.name}: <span style={{ color: 'var(--cyan, #00E5FF)', marginLeft: '4px' }}>{social.handle}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section FAQ */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Nasıl hata veya teknik sorun bildirebilirim?',
                a: "Sorunun açıklaması, kullandığınız tarayıcı veya cihaz ve varsa ekran görüntüsü ile birlikte tech@rouaa.com adresine e-posta gönderin. Teknik ekibimiz genellikle 24 saat içinde yanıt verir.",
              },
              {
                q: 'Nasıl özellik veya iyileştirme talep edebilirim?',
                a: "Kullanıcılarımızdan geri bildirim almaktan mutluluk duyarız! Önerilerinizi support@rouaa.com adresine gönderin veya Telegram'dan bize mesaj atın. Tüm önerileri inceliyoruz ve topluluk talebine göre önceliklendiriyoruz.",
              },
              {
                q: 'Rouaa ile nasıl reklam yapabilir veya işbirliği yapabilirim?',
                a: 'Reklam, sponsorluk veya stratejik ortaklıklar için lütfen önerinizin kısa bir açıklamasıyla partnerships@rouaa.com adresine başvurun. İş geliştirme ekibimiz sizinle iletişime geçecektir.',
              },
            ].map(faq => (
              <div
                key={faq.q}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {faq.q}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text3, #8A9DB2)' }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Informations sur le bureau */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(139,92,246,0.04)',
            border: '1px solid rgba(139,92,246,0.12)',
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--purple, #8B5CF6)' }}
          >
            Rouaa Financial Intelligence
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Birden fazla saat dilimine dağılmış bir ekiple küresel ölçekte faaliyet gösteriyoruz,
            platformumuzun dünya genelindeki trader ve yatırımcılara 7/24 hizmet vermesini sağlıyoruz.
          </p>
        </div>
      </div>
    </main>
  );
}
