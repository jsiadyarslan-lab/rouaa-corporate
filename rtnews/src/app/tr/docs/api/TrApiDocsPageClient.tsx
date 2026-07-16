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
    title: 'Finansal Haberler',
    description: 'Finansal haberlerin listesini alma',
    params: [
      { name: 'category', description: 'Haber kategorisi', default: 'Tümü' },
      { name: 'type', description: 'article | live | breaking', default: 'article' },
      { name: 'limit', description: 'Sonuç sayısı (1-50)', default: '20' },
      { name: 'page', description: 'Sayfa numarası', default: '1' },
      { name: 'lang', description: 'tr | en', default: 'tr' },
    ],
    responseBody: `{
  "data": [
    {
      "id": "clx...",
      "title": "Fed faiz oranlarını artırdı...",
      "summary": "Merkez bankası karar verdi...",
      "category": "Merkez bankaları",
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
    title: 'Piyasa Verileri',
    description: 'Finansal piyasa verileri',
    params: [
      { name: 'type', description: 'forex | arab | sentiment | earnings | centralBanks', default: 'forex' },
    ],
  },
  {
    id: 'v1-calendar',
    method: 'GET',
    path: '/api/v1/calendar',
    title: 'Ekonomik Takvim',
    description: 'Ekonomik takvim etkinlikleri',
    params: [
      { name: 'country', description: 'Ülke kodu', default: 'Tümü' },
      { name: 'days', description: 'Gelecek gün sayısı', default: '7' },
    ],
  },
  {
    id: 'news-translate',
    method: 'POST',
    path: '/api/news/translate',
    title: 'AI Çeviri',
    description: 'İngilizce\'den Türkçe\'ye akıllı finansal çeviri — iki formatı destekler',
    note: 'Bu uç nokta iki farklı istek formatını destekler. Kullanım durumuna göre uygun formatı seçin.',
    params: [
      { name: 'title', description: 'Çeviri için başlık (Format 1)', required: false },
      { name: 'summary', description: 'Çeviri için özet (Format 1)', required: false },
      { name: 'text', description: 'Çeviri için metin (Format 2)', required: false },
      { name: 'type', description: 'Metin türü: title | content | summary (Format 2)', required: false },
    ],
    requestBody: `// Format 1: Başlık + özet
{
  "title": "Fed Raises Interest Rates",
  "summary": "The Federal Reserve decided..."
}

// Format 2: Metin + tür
{
  "text": "Fed Raises Interest Rates",
  "type": "title"           // "title" | "content" | "summary"
}`,
    responseBody: `// Format 1 yanıtı (başlık + özet)
{
  "translation": {
    "translatedTitle": "Fed faiz oranlarını artırdı",
    "translatedSummary": "Fed, faiz oranlarını artırmaya karar verdi..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}

// Format 2 yanıtı (metin + tür)
{
  "translatedText": "Fed faiz oranlarını artırdı",
  "isTranslated": true,
  "duration": 800,
  "method": "title-translation"    // veya "content-translation"
}`,
  },
  {
    id: 'articles-fetch-get',
    method: 'GET',
    path: '/api/articles/fetch',
    title: 'Makale Getir (Hızlı)',
    description: 'Sorgu parametreleriyle hızlı makale içeriği getirme',
    note: 'Bu yöntem AI çevirisi olmadan hızlı getirme için idealdir. Ham içeriği almak için rawOnly=true ekleyin (1-3 saniye).',
    params: [
      { name: 'url', description: 'Makale URL\'si', required: true },
      { name: 'rawOnly', description: 'true = çevirisiz hızlı getirme', default: 'false' },
    ],
    responseBody: `// rawOnly=true ile
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
    title: 'Makale Getir (Gelişmiş)',
    description: 'İsteğe bağlı AI çevirisi ile harici bir bağlantıdan makale içeriği getirme',
    note: 'Bu uç nokta, çeviri kalitesini artırmak için önceden sağlanan başlık ve özetin iletilmesine olanak tanır.',
    params: [
      { name: 'url', description: 'Makale URL\'si', required: true },
      { name: 'rawOnly', description: 'true = çevirisiz hızlı getirme (1-3 saniye)', required: false },
      { name: 'title', description: 'Sağlanan başlık', required: false },
      { name: 'summary', description: 'Sağlanan özet', required: false },
    ],
    requestBody: `{
  "url": "https://www.reuters.com/article/...",
  "title": "Fed Raises Rates",       // isteğe bağlı
  "summary": "The Fed decided...",    // isteğe bağlı
  "rawOnly": false                    // isteğe bağlı
}`,
    responseBody: `{
  "introduction": "Fed, faiz oranlarını artırmaya karar verdi...",
  "body": "Çevrilmiş tam içerik...",
  "conclusion": "Kısa analizli özet...",
  "fullContent": "Tam içerik...",
  "keyTakeaways": ["Nokta 1", "Nokta 2"],
  "affectedAssets": [{ "symbol": "EUR/USD", "direction": "up", "reason": "Sebep" }],
  "sentiment": "negative",
  "recommendation": "Hızlı tavsiye",
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
    title: 'Akıllı Uyarılar',
    description: 'Akıllı uyarı yönetimi — kimlik doğrulama gerektirir',
    params: [
      { name: 'GET', description: 'Aktif uyarıları sorgulama', type: 'method' },
      { name: 'POST', description: 'Yeni uyarı oluşturma (price | sentiment | breaking | custom)', type: 'method' },
      { name: 'PATCH', description: 'Uyarı güncelleme (etkinleştirme/devre dışı bırakma)', type: 'method' },
      { name: 'DELETE', description: 'Uyarı silme', type: 'method' },
    ],
  },
  {
    id: 'community',
    method: 'GET',
    path: '/api/community',
    title: 'Topluluk',
    description: 'Topluluk tartışmaları — gezinme, oluşturma, oylama',
    params: [
      { name: 'category', description: 'general | analysis | question | idea', default: 'Tümü' },
      { name: 'sort', description: 'newest | popular', default: 'newest' },
      { name: 'limit', description: 'Sonuç sayısı', default: '20' },
    ],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'Arama',
    description: 'Haberler ve analizlerde arama',
    params: [
      { name: 'q', description: 'Arama metni', required: true },
      { name: 'limit', description: 'Sonuç sayısı', default: '10' },
    ],
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/compliance',
    title: 'Uyumluluk',
    description: 'Uyumluluk durumu ve içerik kuralları — salt okunur',
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: 'Sağlık Kontrolü',
    description: 'Sunucu ve hizmetlerin durumunu kontrol etme — kimlik doğrulama gerektirmez',
  },
];

// ─── Webhooks data ───────────────────────────────────────────
const webhooks: Endpoint[] = [
  {
    id: 'telegram',
    method: 'POST',
    path: '/api/telegram',
    title: 'Telegram Botu',
    description: 'Komutları alma ve bildirimleri gönderme için Telegram botu webhook\'u',
    note: 'TELEGRAM_BOT_TOKEN ve TELEGRAM_WEBHOOK_SECRET yapılandırması gerektirir. Komutları destekler: /start, /news, /breaking, /alerts, /help',
    requestBody: `// Telegram'dan gelen istek
{
  "message": {
    "chat": { "id": 123456789 },
    "text": "/news",
    "from": { "first_name": "Ahmet" }
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
    title: 'Bülten Aboneliği',
    description: 'En son finansal haberleri almak için bülten aboneliği',
    requestBody: `{
  "email": "user@example.com",
  "name": "Ahmet"        // isteğe bağlı
}`,
    responseBody: `// Yeni abonelik
{
  "success": true,
  "message": "Bültene başarıyla kaydoldunuz"
}

// Zaten abone
{
  "success": true,
  "message": "Zaten bülten abonesisiniz"
}`,
  },
];

// ─── Try It sample data ──────────────────────────────────────
const tryItEndpoints = [
  {
    id: 'v1-news',
    label: 'GET /api/v1/news — Finansal Haberler',
    params: [
      { key: 'category', label: 'Kategori', placeholder: 'Merkez bankaları' },
      { key: 'limit', label: 'Sayı', placeholder: '10' },
      { key: 'lang', label: 'Dil', placeholder: 'tr' },
    ],
    sampleResponse: `{
  "data": [
    {
      "id": "clx_abc123",
      "title": "Fed faiz oranlarını 25 baz puan artırdı",
      "summary": "ABD merkez bankası faiz oranını artırmaya karar verdi...",
      "category": "Merkez bankaları",
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
    label: 'POST /api/news/translate — AI Çeviri',
    params: [
      { key: 'title', label: 'Başlık', placeholder: 'Fed Raises Interest Rates' },
      { key: 'summary', label: 'Özet', placeholder: 'The Federal Reserve decided to raise rates...' },
    ],
    sampleResponse: `{
  "translation": {
    "translatedTitle": "Fed faiz oranlarını artırdı",
    "translatedSummary": "Fed, faiz oranlarını 25 baz puan artırmaya karar verdi..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}`,
  },
  {
    id: 'articles-fetch',
    label: 'GET /api/articles/fetch — Makale Getir',
    params: [
      { key: 'url', label: 'Bağlantı', placeholder: 'https://www.reuters.com/article/...' },
      { key: 'rawOnly', label: 'Sadece hızlı getirme', placeholder: 'true' },
    ],
    sampleResponse: `{
  "introduction": "Fed, faiz oranlarını artırmaya karar verdi...",
  "body": "Çevrilmiş makalenin tam içeriği...",
  "fullContent": "Tam içerik...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'v1-markets',
    label: 'GET /api/v1/markets — Piyasa Verileri',
    params: [
      { key: 'type', label: 'Tür', placeholder: 'forex' },
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
    label: 'POST /api/telegram — Telegram Botu',
    params: [
      { key: 'text', label: 'Komut', placeholder: '/news' },
    ],
    sampleResponse: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter',
    label: 'POST /api/newsletter/subscribe — Abonelik',
    params: [
      { key: 'email', label: 'E-posta', placeholder: 'user@example.com' },
      { key: 'name', label: 'İsim', placeholder: 'Ahmet' },
    ],
    sampleResponse: `{
  "success": true,
  "message": "Bültene başarıyla kaydoldunuz"
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
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}
        title="Kopyala"
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
        <span className="text-[12px] ml-auto" style={{ color: 'var(--text3)' }}>
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
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Not: </span>
              {endpoint.note}
            </div>
          )}

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2">Parametre</th>
                    <th className="text-left py-1 px-2">Açıklama</th>
                    <th className="text-left py-1 px-2">Zorunlu</th>
                    <th className="text-left py-1 px-2">Varsayılan</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 font-mono" style={{ color: 'var(--cyan)' }}>{p.name}</td>
                      <td className="py-1 px-2">{p.description}</td>
                      <td className="py-1 px-2">
                        {p.required ? (
                          <span style={{ color: 'var(--bear)' }}>Evet</span>
                        ) : (
                          <span style={{ color: 'var(--text4)' }}>Hayır</span>
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
                label="İstek Örneği (Request Body)"
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
                label="Yanıt Örneği (Response)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function TrApiDocsPageClient() {
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
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)', color: 'var(--text)' }} dir="ltr">

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ─── Header ──────────────────────────────── */}
        <h1 className="text-3xl font-bold mb-2 font-heading" style={{ color: 'var(--text)' }}>
          Genel API Dokümantasyonu
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
          Rouaa&apos;dan finansal piyasaların haberlerine ve verilerine erişmek için genel API
        </p>

        {/* ─── Authentication ───────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Kimlik Doğrulama</h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>
            Tüm API istekleri bir API anahtarı gerektirir. Kontrol panelinden bir anahtar alabilirsiniz.
          </p>
          <div className="relative group">
            <div className="p-3 rounded-lg font-mono text-[12px]" style={{ background: 'var(--bg4)', direction: 'ltr' }}>
              <span style={{ color: 'var(--text3)' }}>Authorization:</span>{' '}
              <span style={{ color: 'var(--bull)' }}>Bearer</span>{' '}
              <span style={{ color: 'var(--gold)' }}>rva_your_api_key_here</span>
            </div>
            <button
              onClick={() => copy('Authorization: Bearer rva_your_api_key_here', 'auth-header')}
              className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}
              title="Kopyala"
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cyan)' }}>Uç Noktalar</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Ayrıntıları ve istek/yanıt örneklerini görmek için herhangi bir uç noktaya tıklayın
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Webhook&apos;lar</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Harici hizmetlerle entegrasyon için webhook uç noktaları
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Kendin Dene</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Bir uç nokta seçin ve parametreleri girerek yanıt örneğini görüntüleyin
          </p>

          {/* Endpoint selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
              Uç nokta seçin
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
            Yanıt örneğini göster
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
              label="Yanıt Örneği"
            />
          </div>
        </section>

        {/* ─── Error Responses ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Hata Kodları</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
              <thead>
                <tr>
                  <th className="text-left py-1 px-2">Kod</th>
                  <th className="text-left py-1 px-2">Anlam</th>
                  <th className="text-left py-1 px-2">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bull)' }}>200</td>
                  <td className="py-1 px-2">Başarılı</td>
                  <td className="py-1 px-2">İstek başarıyla tamamlandı</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--gold)' }}>400</td>
                  <td className="py-1 px-2">Geçersiz istek</td>
                  <td className="py-1 px-2">Eksik veya hatalı parametreler</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>401</td>
                  <td className="py-1 px-2">Yetkisiz</td>
                  <td className="py-1 px-2">API anahtarı eksik veya geçersiz</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>429</td>
                  <td className="py-1 px-2">Rate limiti</td>
                  <td className="py-1 px-2">İzin verilen istek sayısını aştınız</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>500</td>
                  <td className="py-1 px-2">Sunucu hatası</td>
                  <td className="py-1 px-2">Dahili sunucu hatası</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>503</td>
                  <td className="py-1 px-2">Hizmet kullanılamıyor</td>
                  <td className="py-1 px-2">AI sağlayıcısı yapılandırılmamış veya kullanılamıyor</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Rate Limits ──────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Rate Limitleri</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>100</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>istek/saat — Ücretsiz</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--bull)' }}>1,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>istek/saat — Pro</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--gold)' }}>10,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>istek/saat — Enterprise</div>
            </div>
          </div>
        </section>

        {/* ─── Quick Reference ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Hızlı Referans — cURL Örnekleri</h2>

          <div className="space-y-3">
            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/v1/news?category=Merkez%20bankalar%C4%B1&limit=5"`}
              id="curl-news"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Son Haberler"
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
              label="POST — Başlık + özet çevirisi"
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
              label="POST — Metin + tür çevirisi (genişletilmiş format)"
            />

            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/articles/fetch?url=https://reuters.com/...&rawOnly=true"`}
              id="curl-fetch-get"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Hızlı makale getirme"
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
              label="POST — Çevirili makale getirme"
            />
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
