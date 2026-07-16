'use client';

import { useState, useEffect } from 'react';

/**
 * صفحة تيليجرام العامة
 * تعرض للزوار كيفية الاشتراك في بوت تيليجرام والأوامر المتاحة
 * لا تتطلب تسجيل دخول — متاحة للجميع
 */
export default function TelegramPublicPage() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/telegram/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.total) setSubscriberCount(data.total);
      })
      .catch(err => console.warn('[TelegramPage V156] Stats fetch failed:', err instanceof Error ? err.message : err));
  }, []);

  const BOT_LINK = 'https://t.me/Rouatradingnews_bot';

  const commands = [
    { cmd: '/start', desc: 'بدء الاشتراك وتلقي الإشعارات', icon: '🚀' },
    { cmd: '/news', desc: 'عرض آخر 5 أخبار مالية', icon: '📰' },
    { cmd: '/breaking', desc: 'عرض الأخبار العاجلة', icon: '🚨' },
    { cmd: '/alerts', desc: 'عرض حالة التنبيهات الحالية', icon: '🔔' },
    { cmd: '/subscribe', desc: 'تفعيل جميع أنواع الإشعارات', icon: '✅' },
    { cmd: '/unsubscribe', desc: 'إيقاف جميع الإشعارات', icon: '🔇' },
    { cmd: '/prefs', desc: 'عرض تفضيلات الإشعارات', icon: '📋' },
    { cmd: '/prefs breaking on', desc: 'تفعيل إشعارات الأخبار العاجلة', icon: '⚙️' },
    { cmd: '/help', desc: 'عرض دليل الاستخدام', icon: '❓' },
  ];

  const notifTypes = [
    { type: 'أخبار عاجلة', key: 'breaking', desc: 'إشعار فوري عند نشر أخبار عاجلة ومؤثرة في الأسواق المالية', enabled: true, icon: '🚨' },
    { type: 'تحليلات السوق', key: 'analysis', desc: 'تحليلات AI لحظية لأهم التحركات في الأسواق', enabled: true, icon: '📊' },
    { type: 'تنبيهات الأسعار', key: 'price', desc: 'تنبيهات عند حركات الأسعار المهمة للعملات والسلع والكريبتو', enabled: false, icon: '💰' },
    { type: 'التقويم الاقتصادي', key: 'calendar', desc: 'تذكير بالأحداث الاقتصادية المؤثرة قبل موعدها', enabled: false, icon: '📅' },
    { type: 'ملخص يومي', desc: 'ملخص يومي شامل لأهم ما حدث في الأسواق المالية', key: 'daily', enabled: false, icon: '📰' },
  ];

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      <div className="max-w-[900px] mx-auto px-4" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* ═══ Hero Section ═══ */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          {/* Telegram Icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0088cc, #229ED9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(0,136,204,0.3)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>

          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-head)',
            marginBottom: 8,
          }}>
            بوت تيليجرام — رؤى للأخبار المالية
          </h1>
          <p style={{
            fontSize: 15,
            color: 'var(--text2)',
            maxWidth: 500,
            margin: '0 auto 20px',
            lineHeight: 1.7,
          }}>
            احصل على الأخبار المالية العاجلة والتحليلات وتنبيهات الأسواق مباشرة على تيليجرام، مجاناً!
          </p>

          {mounted && subscriberCount !== null && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--cyan)',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 'var(--r2)',
              padding: '6px 14px',
              marginBottom: 20,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              <div className="live-dot" />
              {subscriberCount} مشترك نشط
            </div>
          )}

          {/* CTA Button */}
          <div style={{ marginTop: 16 }}>
            <a
              href={BOT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 36px',
                borderRadius: 'var(--r2)',
                background: 'linear-gradient(135deg, #0088cc, #229ED9)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 6px 28px rgba(0,136,204,0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 36px rgba(0,136,204,0.45)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(0,136,204,0.35)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              افتح البوت واشترك الآن
            </a>
          </div>
        </div>

        {/* ═══ How it Works ═══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 40,
        }}>
          {[
            { step: '1', title: 'افتح البوت', desc: 'اضغط على زر "اشترك الآن" وسيفتح تيليجرام مباشرة' },
            { step: '2', title: 'أرسل /start', desc: 'أرسل أمر /start للبوت وسيتم تسجيلك تلقائياً' },
            { step: '3', title: 'استلم الإشعارات', desc: 'ستصلك الأخبار العاجلة والتنبيهات فوراً!' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r2)',
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}>{s.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ Notification Types ═══ */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-head)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            أنواع الإشعارات المتاحة
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifTypes.map((n, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                padding: '14px 16px',
              }}>
                <span style={{ fontSize: 22 }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>{n.type}</span>
                    {n.enabled && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--r)',
                        background: 'rgba(0,229,255,0.1)',
                        color: 'var(--cyan)',
                        border: '1px solid rgba(0,229,255,0.2)',
                      }}>مفعّل افتراضياً</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{n.desc}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 11,
                  color: 'var(--text3)',
                  background: 'var(--bg4)',
                  borderRadius: 'var(--r)',
                  padding: '4px 8px',
                  whiteSpace: 'nowrap',
                }}>
                  /prefs {n.key} on
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Bot Commands ═══ */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-head)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            أوامر البوت
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
          }}>
            {commands.map((c, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                padding: '12px 14px',
              }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <code style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}>{c.cmd}</code>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Bottom CTA ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(139,92,246,0.08) 50%, rgba(0,229,255,0.04) 100%)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--r2)',
          padding: '32px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-head)',
            marginBottom: 8,
          }}>
            لا تفوّت أي خبر مالي!
          </h3>
          <p style={{
            fontSize: 13,
            color: 'var(--text2)',
            maxWidth: 400,
            margin: '0 auto 20px',
            lineHeight: 1.7,
          }}>
            انضم لآلاف المشتركين الذين يتلقون الأخبار والتحليلات المالية فوراً عبر تيليجرام
          </p>
          <a
            href={BOT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 'var(--r2)',
              background: 'linear-gradient(135deg, #0088cc, #229ED9)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,136,204,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            اشترك في بوت تيليجرام
          </a>
        </div>
      </div>

    </main>
  );
}
