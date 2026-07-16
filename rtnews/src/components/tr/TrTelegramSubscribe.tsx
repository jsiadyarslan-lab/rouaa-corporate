'use client';

import { useState, useEffect } from 'react';

/**
 * TrTelegramSubscribe — Turkish version of Telegram subscription section
 * Displays a CTA for users to subscribe to the Telegram bot for financial notifications
 */
export default function TrTelegramSubscribe() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch subscriber count
    fetch('/api/telegram/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.total) setSubscriberCount(data.total);
      })
      .catch(err => console.warn('[TrTelegramSubscribe] Stats fetch failed:', err instanceof Error ? err.message : err));
  }, []);

  const BOT_LINK = 'https://t.me/Rouatradingnews_bot';

  const features = [
    { icon: '🚨', label: 'Flaş Haber', desc: 'Finansal haberler hakkında anlık uyarılar' },
    { icon: '📊', label: 'Piyasa Analizi', desc: 'Yapay zeka destekli gerçek zamanlı analizler' },
    { icon: '💰', label: 'Fiyat Uyarıları', desc: 'Önemli piyasa hareketleri' },
    { icon: '📅', label: 'Ekonomik Takvim', desc: 'Yaklaşan yüksek etkili olaylar' },
    { icon: '📰', label: 'Günlük Özet', desc: 'Her gün en iyi haberler' },
  ];

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, rgba(139,92,246,0.06) 50%, rgba(0,229,255,0.03) 100%)',
        border: '1px solid rgba(0,229,255,0.12)',
        borderRadius: 'var(--r2)',
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 'var(--space-md)',
      }}
      dir="ltr"
    >
      {/* Decorative background */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Title and description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {/* Telegram icon */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0088cc, #229ED9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,136,204,0.25)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-head)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              Telegram Botumuza abone olun
            </h3>
            <p style={{
              fontSize: 13,
              color: 'var(--text2)',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}>
              Finansal haberleri ve bildirimleri Telegram üzerinden anında alın
            </p>
          </div>
          {mounted && subscriberCount !== null && (
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--cyan)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 'var(--r)',
              padding: '4px 10px',
              whiteSpace: 'nowrap',
            }}>
              {subscriberCount} abone
            </div>
          )}
        </div>

        {/* Features */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 18,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '6px 12px',
              fontSize: 12,
              color: 'var(--text2)',
            }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{f.label}</span>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>— {f.desc}</span>
            </div>
          ))}
        </div>

        {/* Subscribe buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={BOT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 'var(--r2)',
              background: 'linear-gradient(135deg, #0088cc, #229ED9)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,136,204,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(0,136,204,0.4)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,136,204,0.3)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Abone Ol — Ücretsiz
          </a>

          <a
            href="/tr/telegram"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 'var(--r2)',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan)';
              (e.currentTarget as HTMLElement).style.color = 'var(--cyan)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
            }}
          >
            Bot Komutları ve Talimatları
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Quick instructions */}
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: 'rgba(0,229,255,0.04)',
          border: '1px solid rgba(0,229,255,0.08)',
          borderRadius: 'var(--r)',
          fontSize: 12,
          color: 'var(--text3)',
          lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--text2)' }}>Nasıl abone olunur?</strong>
          {' '}&quot;Abone Ol — Ücretsiz&quot; düğmesine tıklayın → Telegram açılır → /start basın → bildirimleri otomatik olarak alacaksınız!
        </div>
      </div>
    </section>
  );
}
