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
    title: 'Financial News',
    description: 'Get a list of financial news',
    params: [
      { name: 'category', description: 'News category', default: 'All' },
      { name: 'type', description: 'article | live | breaking', default: 'article' },
      { name: 'limit', description: 'Number of results (1-50)', default: '20' },
      { name: 'page', description: 'Page number', default: '1' },
      { name: 'lang', description: 'ar | en', default: 'ar' },
    ],
    responseBody: `{
  "data": [
    {
      "id": "clx...",
      "title": "Federal Reserve raises...",
      "summary": "The central bank decided...",
      "category": "Central Banks",
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
    title: 'Market Data',
    description: 'Financial market data',
    params: [
      { name: 'type', description: 'forex | arab | sentiment | earnings | centralBanks', default: 'forex' },
    ],
  },
  {
    id: 'v1-calendar',
    method: 'GET',
    path: '/api/v1/calendar',
    title: 'Economic Calendar',
    description: 'Economic calendar events',
    params: [
      { name: 'country', description: 'Country code', default: 'All' },
      { name: 'days', description: 'Number of upcoming days', default: '7' },
    ],
  },
  {
    id: 'news-translate',
    method: 'POST',
    path: '/api/news/translate',
    title: 'AI Translation',
    description: 'Smart financial translation from English to Arabic — supports two formats',
    note: 'This endpoint supports two different request formats. Choose the appropriate format based on your use case.',
    params: [
      { name: 'title', description: 'Title to translate (format 1)', required: false },
      { name: 'summary', description: 'Summary to translate (format 1)', required: false },
      { name: 'text', description: 'Text to translate (format 2)', required: false },
      { name: 'type', description: 'Text type: title | content | summary (format 2)', required: false },
    ],
    requestBody: `// Format 1: title + summary
{
  "title": "Fed Raises Interest Rates",
  "summary": "The Federal Reserve decided..."
}

// Format 2: text + type
{
  "text": "Fed Raises Interest Rates",
  "type": "title"           // "title" | "content" | "summary"
}`,
    responseBody: `// Format 1 response (title + summary)
{
  "translation": {
    "translatedTitle": "الفيدرالي يرفع أسعار الفائدة",
    "translatedSummary": "قرر الاحتياطي الفيدرالي..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}

// Format 2 response (text + type)
{
  "translatedText": "الفيدرالي يرفع أسعار الفائدة",
  "isTranslated": true,
  "duration": 800,
  "method": "title-translation"    // or "content-translation"
}`,
  },
  {
    id: 'articles-fetch-get',
    method: 'GET',
    path: '/api/articles/fetch',
    title: 'Fetch Article (Quick)',
    description: 'Quick fetch of article content via query parameters',
    note: 'This method is ideal for quick fetching without AI translation. Add rawOnly=true to get raw content only (1-3 seconds).',
    params: [
      { name: 'url', description: 'Article URL', required: true },
      { name: 'rawOnly', description: 'true = quick fetch without translation', default: 'false' },
    ],
    responseBody: `// With rawOnly=true
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
    title: 'Fetch Article (Advanced)',
    description: 'Fetch article content from an external URL with optional AI translation',
    note: 'This endpoint allows passing a pre-provided title and summary to improve translation quality.',
    params: [
      { name: 'url', description: 'Article URL', required: true },
      { name: 'rawOnly', description: 'true = quick fetch without translation (1-3 seconds)', required: false },
      { name: 'title', description: 'Provided title', required: false },
      { name: 'summary', description: 'Provided summary', required: false },
    ],
    requestBody: `{
  "url": "https://www.reuters.com/article/...",
  "title": "Fed Raises Rates",       // optional
  "summary": "The Fed decided...",    // optional
  "rawOnly": false                    // optional
}`,
    responseBody: `{
  "introduction": "The Federal Reserve decided...",
  "body": "Full translated content...",
  "conclusion": "Summary with brief analysis...",
  "fullContent": "Full content...",
  "keyTakeaways": ["Point 1", "Point 2"],
  "affectedAssets": [{ "symbol": "EUR/USD", "direction": "up", "reason": "Reason" }],
  "sentiment": "negative",
  "recommendation": "Quick recommendation",
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
    title: 'Smart Alerts',
    description: 'Manage smart alerts — requires authentication',
    params: [
      { name: 'GET', description: 'Query active alerts', type: 'method' },
      { name: 'POST', description: 'Create new alert (price | sentiment | breaking | custom)', type: 'method' },
      { name: 'PATCH', description: 'Update alert (enable/disable)', type: 'method' },
      { name: 'DELETE', description: 'Delete alert', type: 'method' },
    ],
  },
  {
    id: 'community',
    method: 'GET',
    path: '/api/community',
    title: 'Community',
    description: 'Community discussions — browse, create, vote',
    params: [
      { name: 'category', description: 'general | analysis | question | idea', default: 'All' },
      { name: 'sort', description: 'newest | popular', default: 'newest' },
      { name: 'limit', description: 'Number of results', default: '20' },
    ],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'Search',
    description: 'Search news and analysis',
    params: [
      { name: 'q', description: 'Search query', required: true },
      { name: 'limit', description: 'Number of results', default: '10' },
    ],
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/compliance',
    title: 'Compliance',
    description: 'Compliance status and content rules — read only',
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: 'Health Check',
    description: 'Check server and services status — no authentication required',
  },
];

// ─── Webhooks data ───────────────────────────────────────────
const webhooks: Endpoint[] = [
  {
    id: 'telegram',
    method: 'POST',
    path: '/api/telegram',
    title: 'Telegram Bot',
    description: 'Telegram bot webhook for receiving commands and sending notifications',
    note: 'Requires TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET configuration. Supports commands: /start, /news, /breaking, /alerts, /help',
    requestBody: `// Incoming request from Telegram
{
  "message": {
    "chat": { "id": 123456789 },
    "text": "/news",
    "from": { "first_name": "Ahmed" }
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
    title: 'Newsletter Subscription',
    description: 'Subscribe to the newsletter for the latest financial news',
    requestBody: `{
  "email": "user@example.com",
  "name": "Ahmed"        // optional
}`,
    responseBody: `// New subscription
{
  "success": true,
  "message": "You have been successfully registered for the newsletter"
}

// Already subscribed
{
  "success": true,
  "message": "You are already subscribed to the newsletter"
}`,
  },
];

// ─── Try It sample data ──────────────────────────────────────
const tryItEndpoints = [
  {
    id: 'v1-news',
    label: 'GET /api/v1/news — Financial News',
    params: [
      { key: 'category', label: 'Category', placeholder: 'Central Banks' },
      { key: 'limit', label: 'Limit', placeholder: '10' },
      { key: 'lang', label: 'Language', placeholder: 'en' },
    ],
    sampleResponse: `{
  "data": [
    {
      "id": "clx_abc123",
      "title": "Federal Reserve raises interest rates by 25 basis points",
      "summary": "The US central bank decided to raise the interest rate...",
      "category": "Central Banks",
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
    label: 'POST /api/news/translate — AI Translation',
    params: [
      { key: 'title', label: 'Title', placeholder: 'Fed Raises Interest Rates' },
      { key: 'summary', label: 'Summary', placeholder: 'The Federal Reserve decided to raise rates...' },
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
    label: 'GET /api/articles/fetch — Fetch Article',
    params: [
      { key: 'url', label: 'URL', placeholder: 'https://www.reuters.com/article/...' },
      { key: 'rawOnly', label: 'Raw only', placeholder: 'true' },
    ],
    sampleResponse: `{
  "introduction": "The Federal Reserve decided to raise interest rates...",
  "body": "Full translated article content...",
  "fullContent": "Full content...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'v1-markets',
    label: 'GET /api/v1/markets — Market Data',
    params: [
      { key: 'type', label: 'Type', placeholder: 'forex' },
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
    label: 'POST /api/telegram — Telegram Bot',
    params: [
      { key: 'text', label: 'Command', placeholder: '/news' },
    ],
    sampleResponse: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter',
    label: 'POST /api/newsletter/subscribe — Subscribe',
    params: [
      { key: 'email', label: 'Email', placeholder: 'user@example.com' },
      { key: 'name', label: 'Name', placeholder: 'Ahmed' },
    ],
    sampleResponse: `{
  "success": true,
  "message": "You have been successfully registered for the newsletter"
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
        title="Copy"
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
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Note: </span>
              {endpoint.note}
            </div>
          )}

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2">Parameter</th>
                    <th className="text-left py-1 px-2">Description</th>
                    <th className="text-left py-1 px-2">Required</th>
                    <th className="text-left py-1 px-2">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 font-mono" style={{ color: 'var(--cyan)' }}>{p.name}</td>
                      <td className="py-1 px-2">{p.description}</td>
                      <td className="py-1 px-2">
                        {p.required ? (
                          <span style={{ color: 'var(--bear)' }}>Yes</span>
                        ) : (
                          <span style={{ color: 'var(--text4)' }}>No</span>
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
                label="Request Body Example"
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
                label="Response Example"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function EnApiDocsPageClient() {
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
          Public API Documentation
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
          Public API for accessing financial market news and data from Rouaa
        </p>

        {/* ─── Authentication ───────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Authentication</h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>
            All API requests require an API key. You can obtain a key from the dashboard.
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
              title="Copy"
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cyan)' }}>Endpoints</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Click on any endpoint to expand details and view request/response examples
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Webhooks</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Webhook endpoints for integration with external services
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Try It Yourself</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Select an endpoint and enter parameters to see a sample response
          </p>

          {/* Endpoint selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
              Select endpoint
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
            Show Response Example
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
              label="Response Example"
            />
          </div>
        </section>

        {/* ─── Error Responses ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Error Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
              <thead>
                <tr>
                  <th className="text-left py-1 px-2">Code</th>
                  <th className="text-left py-1 px-2">Meaning</th>
                  <th className="text-left py-1 px-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bull)' }}>200</td>
                  <td className="py-1 px-2">Success</td>
                  <td className="py-1 px-2">Request completed successfully</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--gold)' }}>400</td>
                  <td className="py-1 px-2">Bad Request</td>
                  <td className="py-1 px-2">Missing or incorrect parameters</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>401</td>
                  <td className="py-1 px-2">Unauthorized</td>
                  <td className="py-1 px-2">API key missing or invalid</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>429</td>
                  <td className="py-1 px-2">Rate Limit</td>
                  <td className="py-1 px-2">Exceeded allowed request count</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>500</td>
                  <td className="py-1 px-2">Server Error</td>
                  <td className="py-1 px-2">Internal server error</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>503</td>
                  <td className="py-1 px-2">Service Unavailable</td>
                  <td className="py-1 px-2">AI provider not configured or unavailable</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Rate Limits ──────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Rate Limits</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>100</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requests/hour — Free</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--bull)' }}>1,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requests/hour — Pro</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--gold)' }}>10,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requests/hour — Enterprise</div>
            </div>
          </div>
        </section>

        {/* ─── Quick Reference ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Quick Reference — cURL Examples</h2>

          <div className="space-y-3">
            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/v1/news?category=Central%20Banks&limit=5"`}
              id="curl-news"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Latest News"
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
              label="POST — Translate title + summary"
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
              label="POST — Translate text + type (extended format)"
            />

            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/articles/fetch?url=https://reuters.com/...&rawOnly=true"`}
              id="curl-fetch-get"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Quick article fetch"
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
              label="POST — Fetch article with translation"
            />
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
