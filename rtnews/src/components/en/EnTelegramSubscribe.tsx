'use client';

import { useState, useEffect } from 'react';

/**
 * EnTelegramSubscribe — English version of Telegram subscription section
 * Displays a CTA for users to subscribe to the Telegram bot for financial notifications
 */
const TEXT: Record<string, Record<string, string>> = {
  en: {
    title: 'Subscribe to our Telegram Bot',
    description: 'Get financial news and notifications instantly via Telegram',
    subscribers: 'subscribers',
    breakingNews: 'Breaking News',
    breakingNewsDesc: 'Instant alerts on breaking financial news',
    marketAnalysis: 'Market Analysis',
    marketAnalysisDesc: 'Real-time AI-driven analysis',
    priceAlerts: 'Price Alerts',
    priceAlertsDesc: 'Key market movements',
    economicCalendar: 'Economic Calendar',
    economicCalendarDesc: 'Upcoming high-impact events',
    dailySummary: 'Daily Summary',
    dailySummaryDesc: 'Top stories every day',
    subscribeNow: 'Subscribe Now — Free',
    botCommands: 'Bot Commands & Instructions',
    howToSubscribe: 'How to subscribe?',
    howToSubscribeDesc: 'Click "Subscribe Now — Free" → Telegram opens → press /start → you\'ll receive notifications automatically!',
  },
  es: {
    title: 'Suscríbete a nuestro Bot de Telegram',
    description: 'Reciba noticias financieras y notificaciones al instante por Telegram',
    subscribers: 'suscriptores',
    breakingNews: 'Noticias Urgentes',
    breakingNewsDesc: 'Alertas instantáneas sobre noticias financieras urgentes',
    marketAnalysis: 'Análisis de Mercado',
    marketAnalysisDesc: 'Análisis en tiempo real impulsado por IA',
    priceAlerts: 'Alertas de Precios',
    priceAlertsDesc: 'Movimientos clave del mercado',
    economicCalendar: 'Calendario Económico',
    economicCalendarDesc: 'Próximos eventos de alto impacto',
    dailySummary: 'Resumen Diario',
    dailySummaryDesc: 'Las mejores noticias cada día',
    subscribeNow: 'Suscribirse Ahora — Gratis',
    botCommands: 'Comandos e Instrucciones del Bot',
    howToSubscribe: '¿Cómo suscribirse?',
    howToSubscribeDesc: 'Haga clic en "Suscribirse Ahora — Gratis" → Se abre Telegram → pulse /start → ¡recibirá notificaciones automáticamente!',
  },
  ar: {
    title: 'اشترك في بوت التيليجرام',
    description: 'احصل على الأخبار المالية والإشعارات فوراً عبر التيليجرام',
    subscribers: 'مشترك',
    breakingNews: 'أخبار عاجلة',
    breakingNewsDesc: 'تنبيهات فورية للأخبار المالية العاجلة',
    marketAnalysis: 'تحليل السوق',
    marketAnalysisDesc: 'تحليل فوري مدعوم بالذكاء الاصطناعي',
    priceAlerts: 'تنبيهات الأسعار',
    priceAlertsDesc: 'حركات السوق الرئيسية',
    economicCalendar: 'التقويم الاقتصادي',
    economicCalendarDesc: 'الأحداث القادمة عالية التأثير',
    dailySummary: 'الملخص اليومي',
    dailySummaryDesc: 'أهم الأخبار كل يوم',
    subscribeNow: 'اشترك الآن — مجاناً',
    botCommands: 'أوامر البوت والتعليمات',
    howToSubscribe: 'كيف تشترك؟',
    howToSubscribeDesc: 'انقر على "اشترك الآن — مجاناً" ← يفتح التيليجرام ← اضغط /start ← ستصلك الإشعارات تلقائياً!',
  },
  fr: {
    title: 'Abonnez-vous à notre Bot Telegram',
    description: 'Recevez instantanément les actualités financières et les notifications via Telegram',
    subscribers: 'abonnés',
    breakingNews: 'Actualités Urgentes',
    breakingNewsDesc: 'Alertes instantanées sur les actualités financières urgentes',
    marketAnalysis: 'Analyse de Marché',
    marketAnalysisDesc: 'Analyse en temps réel alimentée par l\'IA',
    priceAlerts: 'Alertes de Prix',
    priceAlertsDesc: 'Mouvements clés du marché',
    economicCalendar: 'Calendrier Économique',
    economicCalendarDesc: 'Événements à fort impact à venir',
    dailySummary: 'Résumé Quotidien',
    dailySummaryDesc: 'Les meilleures actualités chaque jour',
    subscribeNow: "S'abonner Maintenant — Gratuit",
    botCommands: 'Commandes et Instructions du Bot',
    howToSubscribe: 'Comment s\'abonner ?',
    howToSubscribeDesc: 'Cliquez sur "S\'abonner Maintenant — Gratuit" → Telegram s\'ouvre → appuyez sur /start → vous recevrez les notifications automatiquement !',
  },
  tr: {
    title: 'Telegram Bot\'umuza Abone Olun',
    description: 'Telegram üzerinden anında finansal haberler ve bildirimler alın',
    subscribers: 'abone',
    breakingNews: 'Son Dakika Haberleri',
    breakingNewsDesc: 'Acil finansal haberler için anlık uyarılar',
    marketAnalysis: 'Piyasa Analizi',
    marketAnalysisDesc: 'AI destekli gerçek zamanlı analiz',
    priceAlerts: 'Fiyat Uyarıları',
    priceAlertsDesc: 'Kilit piyasa hareketleri',
    economicCalendar: 'Ekonomik Takvim',
    economicCalendarDesc: 'Yaklaşan yüksek etkili etkinlikler',
    dailySummary: 'Günlük Özet',
    dailySummaryDesc: 'Her gün en iyi haberler',
    subscribeNow: 'Şimdi Abone Ol — Ücretsiz',
    botCommands: 'Bot Komutları ve Talimatlar',
    howToSubscribe: 'Nasıl abone olunur?',
    howToSubscribeDesc: '"Şimdi Abone Ol — Ücretsiz"e tıklayın → Telegram açılır → /start\'a basın → bildirimleri otomatik olarak alacaksınız!',
  },
};

export default function EnTelegramSubscribe({ locale = 'en' }: { locale?: 'en' | 'es' | 'fr' | 'tr' }) {
  const t = TEXT[locale] || TEXT.en;
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
      .catch(err => console.warn('[EnTelegramSubscribe] Stats fetch failed:', err instanceof Error ? err.message : err));
  }, []);

  const BOT_LINK = 'https://t.me/Rouatradingnews_bot';

  const features = [
    { icon: '🚨', label: t.breakingNews, desc: t.breakingNewsDesc },
    { icon: '📊', label: t.marketAnalysis, desc: t.marketAnalysisDesc },
    { icon: '💰', label: t.priceAlerts, desc: t.priceAlertsDesc },
    { icon: '📅', label: t.economicCalendar, desc: t.economicCalendarDesc },
    { icon: '📰', label: t.dailySummary, desc: t.dailySummaryDesc },
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
              {t.title}
            </h3>
            <p style={{
              fontSize: 13,
              color: 'var(--text2)',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}>
              {t.description}
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
              {subscriberCount} {t.subscribers}
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
            {t.subscribeNow}
          </a>

          <a
            href={`/${locale}/telegram`}
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
            {t.botCommands}
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
          <strong style={{ color: 'var(--text2)' }}>{t.howToSubscribe}</strong>
          {' '}{t.howToSubscribeDesc}
        </div>
      </div>
    </section>
  );
}
