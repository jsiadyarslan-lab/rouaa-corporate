'use client';

import { useState, useEffect, useCallback } from 'react';
import BackToTop from '@/components/rouaa/BackToTop';
import { useToast } from '@/hooks/use-toast';

/* ══════════════════════════════════════
   Types
   ══════════════════════════════════════ */
interface NotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: string;
}

interface NotificationStats {
  total: number;
  connected: number;
  byType: Record<string, number>;
}

type ConnectionStatus = 'checking' | 'online' | 'offline';

/* ══════════════════════════════════════
   Constants
   ══════════════════════════════════════ */
const STORAGE_KEY = 'rouaa_telegram_prefs';
const CHAT_ID_KEY = 'rouaa_telegram_chatId';

const DEFAULT_PREFS: NotificationPref[] = [
  { id: 'breaking', label: 'أخبار عاجلة', description: 'تلقي إشعارات فورية عند نشر أخبار عاجلة تؤثر على الأسواق', enabled: true, icon: '⚡' },
  { id: 'analysis', label: 'تحليلات السوق', description: 'تحليلات يومية للأسواق المالية والعملات', enabled: true, icon: '📊' },
  { id: 'price', label: 'تنبيهات الأسعار', description: 'تنبيهات عند وصول الأصول لأسعار محددة', enabled: false, icon: '💰' },
  { id: 'calendar', label: 'التقويم الاقتصادي', description: 'تذكيرات قبل الأحداث الاقتصادية المهمة', enabled: false, icon: '📅' },
  { id: 'daily', label: 'ملخص يومي', description: 'ملخص يومي شامل لأهم الأخبار والتحليلات', enabled: false, icon: '📰' },
];

const BOT_COMMANDS = [
  { cmd: '/start', desc: 'بدء المحادثة مع البوت وربط حسابك' },
  { cmd: '/news', desc: 'آخر الأخبار الاقتصادية' },
  { cmd: '/breaking', desc: 'أخبار عاجلة ومهمة' },
  { cmd: '/alerts', desc: 'إعدادات التنبيهات الشخصية' },
  { cmd: '/prefs', desc: 'عرض تفضيلات الإشعارات' },
  { cmd: '/prefs breaking on', desc: 'تفعيل إشعارات الأخبار العاجلة' },
  { cmd: '/subscribe', desc: 'تفعيل جميع الإشعارات' },
  { cmd: '/unsubscribe', desc: 'إيقاف جميع الإشعارات' },
  { cmd: '/connect USER_ID', desc: 'ربط حسابك في الموقع' },
  { cmd: '/help', desc: 'المساعدة وقائمة الأوامر المتاحة' },
];

const STEPS = [
  { num: 1, title: 'افتح تيليجرام', desc: 'ابحث عن البوت @Rouatradingnews_bot أو اضغط على الرابط أدناه' },
  { num: 2, title: 'أرسل أمر /start', desc: 'سيقوم البوت بتأكيد ربط حسابك وإرسال رسالة ترحيب' },
  { num: 3, title: 'اختر تفضيلاتك', desc: 'حدد أنواع الإشعارات التي تريد تلقيها من القائمة أدناه أو عبر البوت' },
];

const PREMIUM_FEATURES = [
  {
    title: 'قنوات تنبيه مخصصة',
    description: 'إنشاء قنوات خاصة لكل نوع من الاستثمارات',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /><line x1="2" y1="20" x2="2.01" y2="20" />
      </svg>
    ),
  },
  {
    title: 'إشعارات ذات أولوية',
    description: 'الحصول على إشعارات فورية للأحداث الأكثر تأثيراً',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'تصفية متقدمة',
    description: 'فلترة الإشعارات حسب الأصل، المنطقة، ومستوى التأثير',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
  },
];

/* ══════════════════════════════════════
   Helper: Load prefs from localStorage
   ══════════════════════════════════════ */
function loadPrefsFromStorage(): NotificationPref[] {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFS;
    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return DEFAULT_PREFS.map(p => ({
      ...p,
      enabled: parsed[p.id] !== undefined ? parsed[p.id] : p.enabled,
    }));
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefsToStorage(prefs: NotificationPref[]): void {
  if (typeof window === 'undefined') return;
  try {
    const map: Record<string, boolean> = {};
    prefs.forEach(p => { map[p.id] = p.enabled; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* ignore storage errors */ }
}

/* ══════════════════════════════════════
   Component
   ══════════════════════════════════════ */
export default function TelegramPageClient() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(DEFAULT_PREFS);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [healthLatency, setHealthLatency] = useState<number | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isTestSending, setIsTestSending] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const { toast } = useToast();

  // ─── Load chatId from URL params or localStorage ────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL params first (e.g., ?chatId=123456)
    const urlParams = new URLSearchParams(window.location.search);
    const urlChatId = urlParams.get('chatId');

    if (urlChatId) {
      setChatId(urlChatId);
      localStorage.setItem(CHAT_ID_KEY, urlChatId);
    } else {
      const storedChatId = localStorage.getItem(CHAT_ID_KEY);
      if (storedChatId) setChatId(storedChatId);
    }
  }, []);

  // ─── Load prefs from API (fall back to localStorage) ────────
  useEffect(() => {
    let cancelled = false;

    async function loadPrefs() {
      // Try API first if we have a chatId
      if (chatId) {
        try {
          const res = await fetch(`/api/telegram/preferences?chatId=${encodeURIComponent(chatId)}`);
          if (res.ok && !cancelled) {
            const data = await res.json();
            if (data.prefs) {
              const loadedPrefs = DEFAULT_PREFS.map(p => ({
                ...p,
                enabled: data.prefs[p.id] !== undefined ? data.prefs[p.id] : p.enabled,
              }));
              setPrefs(loadedPrefs);
              savePrefsToStorage(loadedPrefs);
              setIsLoadingPrefs(false);
              return;
            }
          }
        } catch {
          // Fall through to localStorage
        }
      }

      // Fallback to localStorage
      if (!cancelled) {
        setPrefs(loadPrefsFromStorage());
        setIsLoadingPrefs(false);
      }
    }

    loadPrefs();
    return () => { cancelled = true; };
  }, [chatId]);

  // ─── Health check on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('unhealthy');
        const data = await res.json();
        if (cancelled) return;
        setConnectionStatus(data.status === 'healthy' ? 'online' : 'offline');
        setHealthLatency(data.latency ?? null);
      } catch {
        if (!cancelled) {
          setConnectionStatus('offline');
          setHealthLatency(null);
        }
      }
    }

    checkHealth();
    return () => { cancelled = true; };
  }, []);

  // ─── Load notification stats ────────────────────────────────
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/telegram/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Stats are non-critical
      }
    }

    loadStats();
  }, []);

  // ─── Toggle preference (save to DB + localStorage) ──────────
  const togglePref = useCallback(async (id: string) => {
    const toggledPref = prefs.find(p => p.id === id);
    const newEnabled = !toggledPref?.enabled;

    // Optimistic update
    const updated = prefs.map(p => p.id === id ? { ...p, enabled: newEnabled } : p);
    setPrefs(updated);
    savePrefsToStorage(updated);

    // Show toast
    if (toggledPref) {
      toast({
        title: newEnabled ? `تم تفعيل "${toggledPref.label}"` : `تم إيقاف "${toggledPref.label}"`,
        description: newEnabled
          ? `ستبدأ بتلقي إشعارات ${toggledPref.label}`
          : `لن تتلقى إشعارات ${toggledPref.label} بعد الآن`,
      });
    }

    // Save to API
    if (chatId) {
      try {
        const res = await fetch('/api/telegram/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            prefs: { [id]: newEnabled },
          }),
        });

        if (!res.ok) {
          console.warn('[Telegram] Failed to save prefs to DB, saved to localStorage only');
        }
      } catch {
        console.warn('[Telegram] Failed to save prefs to DB, saved to localStorage only');
      }
    }
  }, [prefs, chatId, toast]);

  // ─── Test notification ──────────────────────────────────────
  const handleTestNotification = useCallback(async () => {
    if (!chatId) {
      toast({
        title: 'لا يوجد معرّف محادثة',
        description: 'أرسل /start للبوت أولاً ثم أضف ?chatId=YOUR_CHAT_ID لعنوان الصفحة',
        variant: 'destructive',
      });
      return;
    }

    setIsTestSending(true);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: 'تم إرسال رسالة تجريبية',
          description: 'تحقق من تيليجرام لرؤية الرسالة التجريبية',
        });
      } else {
        toast({
          title: 'فشل إرسال الرسالة التجريبية',
          description: data.error || 'تأكد من إرسال /start للبوت أولاً',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'فشل الاتصال',
        description: 'تعذر الاتصال بالخادم. حاول مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsTestSending(false);
    }
  }, [chatId, toast]);

  const enabledCount = prefs.filter(p => p.enabled).length;

  /* ─── Build stats display ─────────── */
  const statsDisplay = stats
    ? [
        {
          label: 'إشعارات اليوم',
          value: stats.total > 0 ? `${stats.total} مشترك` : 'لا يوجد مشتركين',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          ),
        },
        {
          label: 'أكثر تنبيه نشط',
          value: stats.byType
            ? Object.entries(stats.byType).sort(([,a],[,b]) => b-a)[0]?.[0] === 'breaking'
              ? `أخبار عاجلة — ${Object.entries(stats.byType).sort(([,a],[,b]) => b-a)[0]?.[1] || 0} مشترك`
              : Object.entries(stats.byType).sort(([,a],[,b]) => b-a).length > 0
                ? `${Object.entries(stats.byType).sort(([,a],[,b]) => b-a)[0]?.[0]} — ${Object.entries(stats.byType).sort(([,a],[,b]) => b-a)[0]?.[1] || 0} مشترك`
                : 'لا يوجد'
            : 'لا يوجد',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
        },
        {
          label: 'متوسط وقت الاستجابة',
          value: healthLatency !== null ? `${healthLatency} مللي ثانية` : 'أقل من ٣٠ ثانية',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ]
    : [
        {
          label: 'إشعارات اليوم',
          value: '—',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          ),
        },
        {
          label: 'أكثر تنبيه نشط',
          value: '—',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
        },
        {
          label: 'متوسط وقت الاستجابة',
          value: healthLatency !== null ? `${healthLatency} مللي ثانية` : '—',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ];

  /* ─── Connection status visuals ─── */
  const statusColor = connectionStatus === 'online'
    ? 'var(--bull)'
    : connectionStatus === 'offline'
      ? 'var(--bear)'
      : 'var(--gold)';

  const statusGlow = connectionStatus === 'online'
    ? '0 0 8px rgba(0,200,150,0.5)'
    : connectionStatus === 'offline'
      ? '0 0 8px rgba(255,77,106,0.5)'
      : '0 0 8px rgba(255,184,0,0.5)';

  const statusText = connectionStatus === 'online'
    ? 'خدمة البوت تعمل'
    : connectionStatus === 'offline'
      ? 'خدمة البوت غير متاحة حالياً'
      : 'جاري التحقق من حالة الاتصال...';

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,136,255,0.08) 0%, rgba(0,201,167,0.08) 100%)' }}>
        <div className="max-w-[860px] mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,136,255,0.15)', border: '1px solid rgba(0,136,255,0.25)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,136,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.855.075 1.644.357 1.948.236.255.544.46.81.583.688.322 1.642.616 2.262.818l2.157.666c.15.458.548 1.694.684 2.1.088.265.19.535.36.784.181.265.466.513.876.598.278.058.558.036.797-.045.238-.08.424-.213.57-.344.312-.278.544-.654.696-.924l1.16-2.075 2.632 1.86c.348.247.714.477 1.162.549.45.073.978-.026 1.387-.388.41-.363.593-.869.666-1.348.147-.962 3.865-17.378 3.865-17.378.088-.398.115-.776.006-1.147a1.606 1.606 0 0 0-.654-.863 1.773 1.773 0 0 0-.97-.287z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>إعدادات تيليجرام</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>اربط حسابك بتيليجرام لتلقي التنبيهات والأخبار العاجلة فوراً</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="glass-card p-4 flex items-center gap-3 mt-6">
            {connectionStatus === 'checking' ? (
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--gold)', boxShadow: '0 0 8px rgba(255,184,0,0.5)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ background: statusColor, boxShadow: statusGlow }} />
            )}
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {statusText}
            </span>
            {healthLatency !== null && connectionStatus === 'online' && (
              <span className="text-xs mr-auto" style={{ color: 'var(--text3)' }}>
                زمن الاستجابة: {healthLatency} مللي ثانية
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[860px] mx-auto px-4 py-8 space-y-8">

        {/* ═══ How to Connect ═══ */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>كيفية الاتصال</h2>
          <div className="space-y-3">
            {STEPS.map(step => (
              <div key={step.num} className="glass-card p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>
                  {step.num}
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text)' }}>{step.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <a
              href="https://t.me/Rouatradingnews_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'rgba(0,136,255,0.9)', color: 'white' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.855.075 1.644.357 1.948.236.255.544.46.81.583.688.322 1.642.616 2.262.818l2.157.666c.15.458.548 1.694.684 2.1.088.265.19.535.36.784.181.265.466.513.876.598.278.058.558.036.797-.045.238-.08.424-.213.57-.344.312-.278.544-.654.696-.924l1.16-2.075 2.632 1.86c.348.247.714.477 1.162.549.45.073.978-.026 1.387-.388.41-.363.593-.869.666-1.348.147-.962 3.865-17.378 3.865-17.378.088-.398.115-.776.006-1.147a1.606 1.606 0 0 0-.654-.863 1.773 1.773 0 0 0-.97-.287z"/></svg>
              فتح البوت في تيليجرام
            </a>
            <button
              onClick={handleTestNotification}
              disabled={isTestSending || !chatId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}
            >
              {isTestSending ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
                  إرسال رسالة تجريبية
                </>
              )}
            </button>
          </div>
        </section>

        {/* ═══ Connect Account Explanation ═══ */}
        <section className="glass-card p-5" style={{ border: '1px solid rgba(0,201,167,0.15)' }}>
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,201,167,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>ربط حسابك في الموقع</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                يمكنك ربط حسابك في موقع رؤى مع حساب تيليجرام للحصول على إشعارات مخصصة. أرسل الأمر <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'var(--bg3)', color: 'var(--cyan)', border: '1px solid var(--border)' }}>/connect USER_ID</code> للبوت بعد الحصول على معرّف المستخدم من صفحة الإعدادات في الموقع.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Notification Statistics ═══ */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>إحصائيات الإشعارات</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {statsDisplay.map((stat, i) => (
              <div key={i} className="glass-card p-4 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.15)' }}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>{stat.label}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Notification Preferences ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>تفضيلات الإشعارات</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>
              {enabledCount} مفعّل
            </span>
          </div>
          <div className="space-y-2">
            {prefs.map(pref => (
              <div key={pref.id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{pref.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{pref.label}</h3>
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{pref.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePref(pref.id)}
                  disabled={isLoadingPrefs}
                  className="relative w-11 h-6 rounded-full transition-all shrink-0 disabled:opacity-50"
                  style={{
                    background: pref.enabled ? 'var(--cyan)' : 'var(--bg3)',
                    border: pref.enabled ? '1px solid rgba(0,201,167,0.4)' : '1px solid var(--border)',
                  }}
                  aria-label={pref.enabled ? `إيقاف ${pref.label}` : `تفعيل ${pref.label}`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      background: 'white',
                      right: pref.enabled ? '2px' : 'auto',
                      left: pref.enabled ? 'auto' : '2px',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text3)' }}>
            💡 يمكنك أيضاً تعديل التفضيلات من خلال البوت باستخدام أوامر مثل <code style={{ color: 'var(--cyan)' }}>/prefs breaking on</code>
          </p>
        </section>

        {/* ═══ Bot Commands ═══ */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>أوامر البوت</h2>
          <div className="glass-card overflow-hidden max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {BOT_COMMANDS.map((cmd, i) => (
              <div
                key={cmd.cmd}
                className="flex items-center gap-4 p-3.5"
                style={{ borderBottom: i < BOT_COMMANDS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <code className="text-sm font-mono px-2.5 py-1 rounded-lg shrink-0" style={{ background: 'var(--bg3)', color: 'var(--cyan)', border: '1px solid var(--border)' }}>
                  {cmd.cmd}
                </code>
                <span className="text-sm" style={{ color: 'var(--text2)' }}>{cmd.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Premium Features Teaser ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>ميزات مميزة</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--gold2)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,0.2)' }}>
              قريباً
            </span>
          </div>
          <div className="space-y-2">
            {PREMIUM_FEATURES.map((feature, i) => (
              <div key={i} className="glass-card p-4 flex items-start gap-3 opacity-75">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--purple2)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{feature.title}</h3>
                    {/* Lock icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{feature.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: 'var(--gold2)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,0.2)' }}>
                  قريباً
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Info Card (ACTIVE) ═══ */}
        <section className="glass-card p-5" style={{ border: '1px solid rgba(0,201,167,0.15)' }}>
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(0,201,167,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>الميزة مفعّلة</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                ميزة ربط حساب تيليجرام مفعّلة الآن. يمكنك البدء بالتحدث مع البوت وتلقي الإشعارات المخصصة فوراً. حدد تفضيلاتك أعلاه أو استخدم أوامر البوت للتحكم بالإشعارات.
              </p>
            </div>
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
