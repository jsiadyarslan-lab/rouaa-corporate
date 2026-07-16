'use client';

import { useState, useCallback } from 'react';
import BackToTop from '@/components/rouaa/BackToTop';

// ─── Types ───────────────────────────────────────────────────
interface EndpointParam {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
  type?: string;
}

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  params?: EndpointParam[];
  requestBody?: string;
  responseBody?: string;
  note?: string;
}

// ─── Method badge colors ─────────────────────────────────────
const methodStyles: Record<string, { bg: string; color: string }> = {
  GET: { bg: 'rgba(0,200,150,0.15)', color: 'var(--bull)' },
  POST: { bg: 'rgba(232,160,32,0.15)', color: 'var(--gold)' },
  PATCH: { bg: 'rgba(0,151,167,0.15)', color: 'var(--cyan)' },
  DELETE: { bg: 'rgba(212,54,92,0.15)', color: 'var(--bear)' },
};

// ─── Endpoints data ──────────────────────────────────────────
const endpoints: Endpoint[] = [
  {
    id: 'v1-news',
    method: 'GET',
    path: '/api/v1/news',
    title: 'الأخبار المالية',
    description: 'الحصول على قائمة الأخبار المالية',
    params: [
      { name: 'category', description: 'فئة الأخبار', default: 'الكل' },
      { name: 'type', description: 'article | live | breaking', default: 'article' },
      { name: 'limit', description: 'عدد النتائج (1-50)', default: '20' },
      { name: 'page', description: 'رقم الصفحة', default: '1' },
      { name: 'lang', description: 'ar | en', default: 'ar' },
    ],
    responseBody: `{
  "data": [
    {
      "id": "clx...",
      "title": "الاحتياطي الفيدرالي يرفع...",
      "summary": "قرر البنك المركزي...",
      "category": "بنوك مركزية",
      "sentiment": "bearish",
      "slug": "fed-rate-hike",
      "fetchedAt": "2026-04-23T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8,
    "plan": "free"
  }
}`,
  },
  {
    id: 'v1-markets',
    method: 'GET',
    path: '/api/v1/markets',
    title: 'بيانات الأسواق',
    description: 'بيانات الأسواق المالية',
    params: [
      { name: 'type', description: 'forex | arab | sentiment | earnings | centralBanks', default: 'forex' },
    ],
  },
  {
    id: 'v1-calendar',
    method: 'GET',
    path: '/api/v1/calendar',
    title: 'التقويم الاقتصادي',
    description: 'أحداث التقويم الاقتصادي',
    params: [
      { name: 'country', description: 'رمز الدولة', default: 'الكل' },
      { name: 'days', description: 'عدد الأيام القادمة', default: '7' },
    ],
  },
  {
    id: 'news-translate',
    method: 'POST',
    path: '/api/news/translate',
    title: 'ترجمة AI',
    description: 'ترجمة مالية ذكية من الإنجليزية إلى العربية — يدعم تنسيقين',
    note: 'يدعم هذا المسار تنسيقين مختلفين للطلب. اختر التنسيق المناسب حسب حالة الاستخدام.',
    params: [
      { name: 'title', description: 'عنوان للترجمة (تنسيق 1)', required: false },
      { name: 'summary', description: 'ملخص للترجمة (تنسيق 1)', required: false },
      { name: 'text', description: 'نص للترجمة (تنسيق 2)', required: false },
      { name: 'type', description: 'نوع النص: title | content | summary (تنسيق 2)', required: false },
    ],
    requestBody: `// التنسيق 1: عنوان + ملخص
{
  "title": "Fed Raises Interest Rates",
  "summary": "The Federal Reserve decided..."
}

// التنسيق 2: نص + نوع
{
  "text": "Fed Raises Interest Rates",
  "type": "title"           // "title" | "content" | "summary"
}`,
    responseBody: `// استجابة التنسيق 1 (عنوان + ملخص)
{
  "translation": {
    "translatedTitle": "الفيدرالي يرفع أسعار الفائدة",
    "translatedSummary": "قرر الاحتياطي الفيدرالي..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}

// استجابة التنسيق 2 (نص + نوع)
{
  "translatedText": "الفيدرالي يرفع أسعار الفائدة",
  "isTranslated": true,
  "duration": 800,
  "method": "title-translation"    // أو "content-translation"
}`,
  },
  {
    id: 'articles-fetch-get',
    method: 'GET',
    path: '/api/articles/fetch',
    title: 'جلب مقال (سريع)',
    description: 'جلب سريع لمحتوى مقال عبر معاملات الاستعلام',
    note: 'هذه الطريقة مثالية للجلب السريع بدون ترجمة AI. أضف rawOnly=true للحصول على المحتوى الخام فقط (1-3 ثوانٍ).',
    params: [
      { name: 'url', description: 'رابط المقال', required: true },
      { name: 'rawOnly', description: 'true = جلب سريع بدون ترجمة', default: 'false' },
    ],
    responseBody: `// مع rawOnly=true
{
  "introduction": "Federal Reserve decided...",
  "body": "Full article content...",
  "fullContent": "Full article content...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'articles-fetch-post',
    method: 'POST',
    path: '/api/articles/fetch',
    title: 'جلب مقال (متقدم)',
    description: 'جلب محتوى مقال من رابط خارجي مع ترجمة AI اختيارية',
    note: 'يتيح هذا المسار تمرير عنوان وملخص مقدمين مسبقاً لتحسين جودة الترجمة.',
    params: [
      { name: 'url', description: 'رابط المقال', required: true },
      { name: 'rawOnly', description: 'true = جلب سريع بدون ترجمة (1-3 ثوانٍ)', required: false },
      { name: 'title', description: 'عنوان مقدم', required: false },
      { name: 'summary', description: 'ملخص مقدم', required: false },
    ],
    requestBody: `{
  "url": "https://www.reuters.com/article/...",
  "title": "Fed Raises Rates",       // اختياري
  "summary": "The Fed decided...",    // اختياري
  "rawOnly": false                    // اختياري
}`,
    responseBody: `{
  "introduction": "قرر الاحتياطي الفيدرالي...",
  "body": "المحتوى الكامل المترجم...",
  "conclusion": "خلاصة مع تحليل مختصر...",
  "fullContent": "المحتوى الكامل...",
  "keyTakeaways": ["نقطة 1", "نقطة 2"],
  "affectedAssets": [{ "symbol": "EUR/USD", "direction": "up", "reason": "السبب" }],
  "sentiment": "negative",
  "recommendation": "توصية سريعة",
  "hasFullContent": true,
  "source": "reuters.com",
  "provider": "groq",
  "method": "web-fetch-translate"
}`,
  },
  {
    id: 'smart-alerts',
    method: 'GET',
    path: '/api/smart-alerts',
    title: 'التنبيهات الذكية',
    description: 'إدارة التنبيهات الذكية — يتطلب مصادقة',
    params: [
      { name: 'GET', description: 'استعلام التنبيهات النشطة', type: 'method' },
      { name: 'POST', description: 'إنشاء تنبيه جديد (price | sentiment | breaking | custom)', type: 'method' },
      { name: 'PATCH', description: 'تحديث تنبيه (تفعيل/تعطيل)', type: 'method' },
      { name: 'DELETE', description: 'حذف تنبيه', type: 'method' },
    ],
  },
  {
    id: 'community',
    method: 'GET',
    path: '/api/community',
    title: 'المجتمع',
    description: 'مناقشات المجتمع — تصفح، إنشاء، تصويت',
    params: [
      { name: 'category', description: 'general | analysis | question | idea', default: 'الكل' },
      { name: 'sort', description: 'newest | popular', default: 'newest' },
      { name: 'limit', description: 'عدد النتائج', default: '20' },
    ],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'البحث',
    description: 'بحث في الأخبار والتحليلات',
    params: [
      { name: 'q', description: 'نص البحث', required: true },
      { name: 'limit', description: 'عدد النتائج', default: '10' },
    ],
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/compliance',
    title: 'الامتثال',
    description: 'حالة الامتثال وقواعد المحتوى — قراءة فقط',
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: 'فحص الصحة',
    description: 'فحص حالة الخادم والخدمات — لا يتطلب مصادقة',
  },
];

// ─── Webhooks data ───────────────────────────────────────────
const webhooks: Endpoint[] = [
  {
    id: 'telegram',
    method: 'POST',
    path: '/api/telegram',
    title: 'بوت تيليجرام',
    description: 'ويب هوك بوت تيليجرام لاستقبال الأوامر وإرسال الإشعارات',
    note: 'يتطلب إعداد TELEGRAM_BOT_TOKEN و TELEGRAM_WEBHOOK_SECRET. يدعم الأوامر: /start, /news, /breaking, /alerts, /help',
    requestBody: `// طلب وارد من تيليجرام
{
  "message": {
    "chat": { "id": 123456789 },
    "text": "/news",
    "from": { "first_name": "أحمد" }
  }
}`,
    responseBody: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter-subscribe',
    method: 'POST',
    path: '/api/newsletter/subscribe',
    title: 'اشتراك النشرة البريدية',
    description: 'اشتراك في النشرة البريدية لتلقي آخر الأخبار المالية',
    requestBody: `{
  "email": "user@example.com",
  "name": "أحمد"        // اختياري
}`,
    responseBody: `// اشتراك جديد
{
  "success": true,
  "message": "تم تسجيلك في النشرة البريدية بنجاح"
}

// مشترك بالفعل
{
  "success": true,
  "message": "أنت مشترك بالفعل في النشرة البريدية"
}`,
  },
];

// ─── Try It sample data ──────────────────────────────────────
const tryItEndpoints = [
  {
    id: 'v1-news',
    label: 'GET /api/v1/news — الأخبار المالية',
    params: [
      { key: 'category', label: 'الفئة', placeholder: 'بنوك مركزية' },
      { key: 'limit', label: 'العدد', placeholder: '10' },
      { key: 'lang', label: 'اللغة', placeholder: 'ar' },
    ],
    sampleResponse: `{
  "data": [
    {
      "id": "clx_abc123",
      "title": "الاحتياطي الفيدرالي يرفع أسعار الفائدة بمقدار 25 نقطة",
      "summary": "قرر البنك المركزي الأمريكي رفع سعر الفائدة...",
      "category": "بنوك مركزية",
      "sentiment": "bearish",
      "slug": "fed-rate-hike-2026",
      "fetchedAt": "2026-04-23T10:00:00Z"
    }
  ],
  "meta": { "total": 150, "page": 1, "limit": 10, "pages": 15 }
}`,
  },
  {
    id: 'news-translate',
    label: 'POST /api/news/translate — ترجمة AI',
    params: [
      { key: 'title', label: 'العنوان', placeholder: 'Fed Raises Interest Rates' },
      { key: 'summary', label: 'الملخص', placeholder: 'The Federal Reserve decided to raise rates...' },
    ],
    sampleResponse: `{
  "translation": {
    "translatedTitle": "الفيدرالي يرفع أسعار الفائدة",
    "translatedSummary": "قرر الاحتياطي الفيدرالي رفع أسعار الفائدة بمقدار 25 نقطة أساس..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}`,
  },
  {
    id: 'articles-fetch',
    label: 'GET /api/articles/fetch — جلب مقال',
    params: [
      { key: 'url', label: 'الرابط', placeholder: 'https://www.reuters.com/article/...' },
      { key: 'rawOnly', label: 'جلب سريع فقط', placeholder: 'true' },
    ],
    sampleResponse: `{
  "introduction": "قرر الاحتياطي الفيدرالي رفع أسعار الفائدة...",
  "body": "المحتوى الكامل للمقال المترجم...",
  "fullContent": "المحتوى الكامل...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'v1-markets',
    label: 'GET /api/v1/markets — بيانات الأسواق',
    params: [
      { key: 'type', label: 'النوع', placeholder: 'forex' },
    ],
    sampleResponse: `{
  "data": {
    "EUR/USD": { "price": 1.0862, "change": "+0.12%", "direction": "up" },
    "GBP/USD": { "price": 1.2745, "change": "-0.08%", "direction": "down" },
    "USD/JPY": { "price": 154.32, "change": "+0.25%", "direction": "up" }
  },
  "timestamp": "2026-04-23T10:00:00Z"
}`,
  },
  {
    id: 'telegram',
    label: 'POST /api/telegram — بوت تيليجرام',
    params: [
      { key: 'text', label: 'الأمر', placeholder: '/news' },
    ],
    sampleResponse: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter',
    label: 'POST /api/newsletter/subscribe — اشتراك',
    params: [
      { key: 'email', label: 'البريد الإلكتروني', placeholder: 'user@example.com' },
      { key: 'name', label: 'الاسم', placeholder: 'أحمد' },
    ],
    sampleResponse: `{
  "success": true,
  "message": "تم تسجيلك في النشرة البريدية بنجاح"
}`,
  },
];

// ─── Copy to clipboard hook ──────────────────────────────────
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return { copiedId, copy };
}

// ─── Sub-components ──────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const style = methodStyles[method] || methodStyles.GET;
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
      style={{ background: style.bg, color: style.color }}
    >
      {method}
    </span>
  );
}

function CodeBlock({
  code,
  id,
  copiedId,
  onCopy,
  label,
}: {
  code: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  label?: string;
}) {
  return (
    <div className="relative group">
      {label && (
        <div className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--cyan)' }}>
          {label}
        </div>
      )}
      <pre
        className="p-4 rounded-lg overflow-x-auto text-[12px] font-mono leading-relaxed"
        style={{ background: 'var(--bg4)', direction: 'ltr', color: 'var(--text2)' }}
      >
        {code}
      </pre>
      <button
        onClick={() => onCopy(code, id)}
        className="absolute top-2 left-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}
        title="نسخ"
      >
        {copiedId === id ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

function EndpointCard({
  endpoint,
  isExpanded,
  onToggle,
  copiedId,
  onCopy,
}: {
  endpoint: Endpoint;
  isExpanded: boolean;
  onToggle: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div
      className="glass-card cursor-pointer mb-3"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    >
      {/* Header — always visible */}
      <div className="flex items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <code className="text-[13px] font-mono" style={{ color: 'var(--text)' }}>
          {endpoint.path}
        </code>
        <span className="text-[12px] mr-auto" style={{ color: 'var(--text3)' }}>
          {endpoint.title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text3)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expandable content */}
      <div
        style={{
          maxHeight: isExpanded ? 2000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
            {endpoint.description}
          </p>

          {/* Note */}
          {endpoint.note && (
            <div
              className="p-3 rounded-lg mb-3 text-[12px]"
              style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,151,167,0.15)', color: 'var(--text2)' }}
            >
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>ملاحظة: </span>
              {endpoint.note}
            </div>
          )}

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
                <thead>
                  <tr>
                    <th className="text-right py-1 px-2">المعامل</th>
                    <th className="text-right py-1 px-2">الوصف</th>
                    <th className="text-right py-1 px-2">مطلوب</th>
                    <th className="text-right py-1 px-2">الافتراضي</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 font-mono" style={{ color: 'var(--cyan)' }}>{p.name}</td>
                      <td className="py-1 px-2">{p.description}</td>
                      <td className="py-1 px-2">
                        {p.required ? (
                          <span style={{ color: 'var(--bear)' }}>نعم</span>
                        ) : (
                          <span style={{ color: 'var(--text4)' }}>لا</span>
                        )}
                      </td>
                      <td className="py-1 px-2" style={{ color: 'var(--text3)' }}>{p.default || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Request body */}
          {endpoint.requestBody && (
            <div className="mb-3">
              <CodeBlock
                code={endpoint.requestBody}
                id={`${endpoint.id}-req`}
                copiedId={copiedId}
                onCopy={onCopy}
                label="مثال الطلب (Request Body)"
              />
            </div>
          )}

          {/* Response body */}
          {endpoint.responseBody && (
            <div>
              <CodeBlock
                code={endpoint.responseBody}
                id={`${endpoint.id}-res`}
                copiedId={copiedId}
                onCopy={onCopy}
                label="مثال الاستجابة (Response)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ApiDocsPageClient() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const { copiedId, copy } = useCopyToClipboard();

  // Try It state
  const [selectedTryIt, setSelectedTryIt] = useState(tryItEndpoints[0].id);
  const [tryItParams, setTryItParams] = useState<Record<string, string>>({});
  const [showTryItResponse, setShowTryItResponse] = useState(false);

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const currentTryIt = tryItEndpoints.find((e) => e.id === selectedTryIt) || tryItEndpoints[0];

  const handleTryItSelect = (id: string) => {
    setSelectedTryIt(id);
    setTryItParams({});
    setShowTryItResponse(false);
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)', color: 'var(--text)' }} dir="rtl">

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ─── Header ──────────────────────────────── */}
        <h1 className="text-3xl font-bold mb-2 font-heading" style={{ color: 'var(--text)' }}>
          توثيق API العام
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
          واجهة برمجة التطبيقات العامة للوصول إلى أخبار وبيانات الأسواق المالية من رؤى
        </p>

        {/* ─── Authentication ───────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>المصادقة</h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>
            جميع طلبات API تتطلب مفتاح API. يمكنك الحصول على مفتاح من لوحة التحكم.
          </p>
          <div className="relative group">
            <div className="p-3 rounded-lg font-mono text-[12px]" style={{ background: 'var(--bg4)', direction: 'ltr' }}>
              <span style={{ color: 'var(--text3)' }}>Authorization:</span>{' '}
              <span style={{ color: 'var(--bull)' }}>Bearer</span>{' '}
              <span style={{ color: 'var(--gold)' }}>rva_your_api_key_here</span>
            </div>
            <button
              onClick={() => copy('Authorization: Bearer rva_your_api_key_here', 'auth-header')}
              className="absolute top-2 left-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}
              title="نسخ"
            >
              {copiedId === 'auth-header' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </section>

        {/* ─── Endpoints ────────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cyan)' }}>نقاط النهاية</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            اضغط على أي نقطة نهاية لتوسيع التفاصيل ومشاهدة أمثلة الطلب والاستجابة
          </p>

          {endpoints.map((ep) => (
            <EndpointCard
              key={ep.id}
              endpoint={ep}
              isExpanded={expandedEndpoints.has(ep.id)}
              onToggle={() => toggleEndpoint(ep.id)}
              copiedId={copiedId}
              onCopy={copy}
            />
          ))}
        </section>

        {/* ─── Webhooks ─────────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>ويب هوك (Webhooks)</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            نقاط اتصال ويب هوك للتكامل مع خدمات خارجية
          </p>

          {webhooks.map((wh) => (
            <EndpointCard
              key={wh.id}
              endpoint={wh}
              isExpanded={expandedEndpoints.has(`wh-${wh.id}`)}
              onToggle={() => toggleEndpoint(`wh-${wh.id}`)}
              copiedId={copiedId}
              onCopy={copy}
            />
          ))}
        </section>

        {/* ─── Try It ───────────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>جرّب بنفسك</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            اختر نقطة نهاية وأدخل المعاملات لمشاهدة مثال على الاستجابة
          </p>

          {/* Endpoint selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
              اختر نقطة النهاية
            </label>
            <select
              value={selectedTryIt}
              onChange={(e) => handleTryItSelect(e.target.value)}
              className="w-full p-2.5 rounded-lg text-[13px] font-mono"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              {tryItEndpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter inputs */}
          {currentTryIt.params.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {currentTryIt.params.map((p) => (
                <div key={p.key}>
                  <label
                    className="block text-[11px] font-semibold mb-1"
                    style={{ color: 'var(--text3)' }}
                  >
                    {p.label}
                  </label>
                  <input
                    type="text"
                    placeholder={p.placeholder}
                    value={tryItParams[p.key] || ''}
                    onChange={(e) => setTryItParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                    className="w-full p-2 rounded-lg text-[12px] font-mono"
                    style={{
                      background: 'var(--bg4)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Show response button */}
          <button
            onClick={() => setShowTryItResponse(true)}
            className="btn-fill mb-4"
            style={{ fontSize: '12px' }}
          >
            عرض مثال الاستجابة
          </button>

          {/* Sample response */}
          <div
            style={{
              maxHeight: showTryItResponse ? 800 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
              opacity: showTryItResponse ? 1 : 0,
            }}
          >
            <CodeBlock
              code={currentTryIt.sampleResponse}
              id="try-it-response"
              copiedId={copiedId}
              onCopy={copy}
              label="مثال الاستجابة"
            />
          </div>
        </section>

        {/* ─── Error Responses ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>رموز الأخطاء</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
              <thead>
                <tr>
                  <th className="text-right py-1 px-2">الرمز</th>
                  <th className="text-right py-1 px-2">المعنى</th>
                  <th className="text-right py-1 px-2">الوصف</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bull)' }}>200</td>
                  <td className="py-1 px-2">نجاح</td>
                  <td className="py-1 px-2">الطلب تم بنجاح</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--gold)' }}>400</td>
                  <td className="py-1 px-2">طلب غير صالح</td>
                  <td className="py-1 px-2">معاملات مفقودة أو غير صحيحة</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>401</td>
                  <td className="py-1 px-2">غير مصرح</td>
                  <td className="py-1 px-2">مفتاح API مفقود أو غير صالح</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>429</td>
                  <td className="py-1 px-2">حد المعدل</td>
                  <td className="py-1 px-2">تجاوزت عدد الطلبات المسموحة</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>500</td>
                  <td className="py-1 px-2">خطأ الخادم</td>
                  <td className="py-1 px-2">خطأ داخلي في الخادم</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>503</td>
                  <td className="py-1 px-2">الخدمة غير متاحة</td>
                  <td className="py-1 px-2">مزود AI غير مُعد أو غير متاح</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Rate Limits ──────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>حدود المعدل</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>100</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>طلب/ساعة — مجاني</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--bull)' }}>1,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>طلب/ساعة — Pro</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--gold)' }}>10,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>طلب/ساعة — Enterprise</div>
            </div>
          </div>
        </section>

        {/* ─── Quick Reference ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>مرجع سريع — أمثلة cURL</h2>

          <div className="space-y-3">
            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/v1/news?category=بنوك%20مركزية&limit=5"`}
              id="curl-news"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — آخر الأخبار"
            />

            <CodeBlock
              code={`curl -X POST \\
  -H "Authorization: Bearer rva_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Fed Raises Rates","summary":"The Fed decided..."}' \\
  "https://api.rouaa.news/api/news/translate"`}
              id="curl-translate"
              copiedId={copiedId}
              onCopy={copy}
              label="POST — ترجمة عنوان + ملخص"
            />

            <CodeBlock
              code={`curl -X POST \\
  -H "Authorization: Bearer rva_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Fed Raises Rates","type":"title"}' \\
  "https://api.rouaa.news/api/news/translate"`}
              id="curl-translate-ext"
              copiedId={copiedId}
              onCopy={copy}
              label="POST — ترجمة نص + نوع (تنسيق موسع)"
            />

            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/articles/fetch?url=https://reuters.com/...&rawOnly=true"`}
              id="curl-fetch-get"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — جلب مقال سريع"
            />

            <CodeBlock
              code={`curl -X POST \\
  -H "Authorization: Bearer rva_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://reuters.com/...","title":"Fed Raises Rates","rawOnly":false}' \\
  "https://api.rouaa.news/api/articles/fetch"`}
              id="curl-fetch-post"
              copiedId={copiedId}
              onCopy={copy}
              label="POST — جلب مقال مع ترجمة"
            />
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
