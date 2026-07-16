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
    title: 'Noticias Financieras',
    description: 'Obtener una lista de noticias financieras',
    params: [
      { name: 'category', description: 'Categoría de noticias', default: 'Todas' },
      { name: 'type', description: 'article | live | breaking', default: 'article' },
      { name: 'limit', description: 'Número de resultados (1-50)', default: '20' },
      { name: 'page', description: 'Número de página', default: '1' },
      { name: 'lang', description: 'ar | en', default: 'ar' },
    ],
    responseBody: `{
  "data": [
    {
      "id": "clx...",
      "title": "La Reserva Federal aumenta...",
      "summary": "El banco central decidió...",
      "category": "Bancos centrales",
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
    title: 'Datos de Mercados',
    description: 'Datos de los mercados financieros',
    params: [
      { name: 'type', description: 'forex | arab | sentiment | earnings | centralBanks', default: 'forex' },
    ],
  },
  {
    id: 'v1-calendar',
    method: 'GET',
    path: '/api/v1/calendar',
    title: 'Calendario Económico',
    description: 'Eventos del calendario económico',
    params: [
      { name: 'country', description: 'Código del país', default: 'Todos' },
      { name: 'days', description: 'Número de días próximos', default: '7' },
    ],
  },
  {
    id: 'news-translate',
    method: 'POST',
    path: '/api/news/translate',
    title: 'Traducción AI',
    description: 'Traducción financiera inteligente del inglés al español — soporta dos formatos',
    note: 'Este punto de conexión soporta dos formatos de solicitud diferentes. Elija el formato adecuado según el caso de uso.',
    params: [
      { name: 'title', description: 'Título para traducir (formato 1)', required: false },
      { name: 'summary', description: 'Resumen para traducir (formato 1)', required: false },
      { name: 'text', description: 'Texto para traducir (formato 2)', required: false },
      { name: 'type', description: 'Tipo de texto: title | content | summary (formato 2)', required: false },
    ],
    requestBody: `// Formato 1: título + resumen
{
  "title": "Fed Raises Interest Rates",
  "summary": "The Federal Reserve decided..."
}

// Formato 2: texto + tipo
{
  "text": "Fed Raises Interest Rates",
  "type": "title"           // "title" | "content" | "summary"
}`,
    responseBody: `// Respuesta formato 1 (título + resumen)
{
  "translation": {
    "translatedTitle": "La Fed aumenta las tasas de interés",
    "translatedSummary": "La Reserva Federal decidió..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}

// Respuesta formato 2 (texto + tipo)
{
  "translatedText": "La Fed aumenta las tasas de interés",
  "isTranslated": true,
  "duration": 800,
  "method": "title-translation"    // o "content-translation"
}`,
  },
  {
    id: 'articles-fetch-get',
    method: 'GET',
    path: '/api/articles/fetch',
    title: 'Obtener artículo (rápido)',
    description: 'Obtención rápida del contenido de un artículo mediante parámetros de consulta',
    note: 'Este método es ideal para la obtención rápida sin traducción AI. Agregue rawOnly=true para obtener solo el contenido crudo (1-3 segundos).',
    params: [
      { name: 'url', description: 'URL del artículo', required: true },
      { name: 'rawOnly', description: 'true = obtención rápida sin traducción', default: 'false' },
    ],
    responseBody: `// Con rawOnly=true
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
    title: 'Obtener artículo (avanzado)',
    description: 'Obtener contenido de un artículo desde un enlace externo con traducción AI opcional',
    note: 'Este punto de conexión permite pasar un título y resumen proporcionados previamente para mejorar la calidad de la traducción.',
    params: [
      { name: 'url', description: 'URL del artículo', required: true },
      { name: 'rawOnly', description: 'true = obtención rápida sin traducción (1-3 segundos)', required: false },
      { name: 'title', description: 'Título proporcionado', required: false },
      { name: 'summary', description: 'Resumen proporcionado', required: false },
    ],
    requestBody: `{
  "url": "https://www.reuters.com/article/...",
  "title": "Fed Raises Rates",       // opcional
  "summary": "The Fed decided...",    // opcional
  "rawOnly": false                    // opcional
}`,
    responseBody: `{
  "introduction": "La Reserva Federal decidió...",
  "body": "Contenido completo traducido...",
  "conclusion": "Resumen con análisis breve...",
  "fullContent": "Contenido completo...",
  "keyTakeaways": ["Punto 1", "Punto 2"],
  "affectedAssets": [{ "symbol": "EUR/USD", "direction": "up", "reason": "Razón" }],
  "sentiment": "negative",
  "recommendation": "Recomendación rápida",
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
    title: 'Alertas Inteligentes',
    description: 'Gestión de alertas inteligentes — requiere autenticación',
    params: [
      { name: 'GET', description: 'Consultar alertas activas', type: 'method' },
      { name: 'POST', description: 'Crear nueva alerta (price | sentiment | breaking | custom)', type: 'method' },
      { name: 'PATCH', description: 'Actualizar alerta (activar/desactivar)', type: 'method' },
      { name: 'DELETE', description: 'Eliminar alerta', type: 'method' },
    ],
  },
  {
    id: 'community',
    method: 'GET',
    path: '/api/community',
    title: 'Comunidad',
    description: 'Discusiones de la comunidad — navegar, crear, votar',
    params: [
      { name: 'category', description: 'general | analysis | question | idea', default: 'Todos' },
      { name: 'sort', description: 'newest | popular', default: 'newest' },
      { name: 'limit', description: 'Número de resultados', default: '20' },
    ],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'Búsqueda',
    description: 'Buscar en noticias y análisis',
    params: [
      { name: 'q', description: 'Texto de búsqueda', required: true },
      { name: 'limit', description: 'Número de resultados', default: '10' },
    ],
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/compliance',
    title: 'Cumplimiento',
    description: 'Estado de cumplimiento y reglas de contenido — solo lectura',
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: 'Verificación de estado',
    description: 'Verificar estado del servidor y servicios — no requiere autenticación',
  },
];

// ─── Webhooks data ───────────────────────────────────────────
const webhooks: Endpoint[] = [
  {
    id: 'telegram',
    method: 'POST',
    path: '/api/telegram',
    title: 'Bot de Telegram',
    description: 'Webhook del bot de Telegram para recibir comandos y enviar notificaciones',
    note: 'Requiere configurar TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET. Soporta los comandos: /start, /news, /breaking, /alerts, /help',
    requestBody: `// Solicitud entrante de Telegram
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
    title: 'Suscripción al boletín',
    description: 'Suscripción al boletín para recibir las últimas noticias financieras',
    requestBody: `{
  "email": "user@example.com",
  "name": "Ahmed"        // opcional
}`,
    responseBody: `// Nueva suscripción
{
  "success": true,
  "message": "Te has registrado exitosamente en el boletín"
}

// Ya suscrito
{
  "success": true,
  "message": "Ya estás suscrito al boletín"
}`,
  },
];

// ─── Try It sample data ──────────────────────────────────────
const tryItEndpoints = [
  {
    id: 'v1-news',
    label: 'GET /api/v1/news — Noticias Financieras',
    params: [
      { key: 'category', label: 'Categoría', placeholder: 'Bancos centrales' },
      { key: 'limit', label: 'Cantidad', placeholder: '10' },
      { key: 'lang', label: 'Idioma', placeholder: 'ar' },
    ],
    sampleResponse: `{
  "data": [
    {
      "id": "clx_abc123",
      "title": "La Reserva Federal aumenta las tasas de interés en 25 puntos",
      "summary": "El banco central estadounidense decidió aumentar la tasa de interés...",
      "category": "Bancos centrales",
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
    label: 'POST /api/news/translate — Traducción AI',
    params: [
      { key: 'title', label: 'Título', placeholder: 'Fed Raises Interest Rates' },
      { key: 'summary', label: 'Resumen', placeholder: 'The Federal Reserve decided to raise rates...' },
    ],
    sampleResponse: `{
  "translation": {
    "translatedTitle": "La Fed aumenta las tasas de interés",
    "translatedSummary": "La Reserva Federal decidió aumentar las tasas de interés en 25 puntos básicos..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}`,
  },
  {
    id: 'articles-fetch',
    label: 'GET /api/articles/fetch — Obtener artículo',
    params: [
      { key: 'url', label: 'URL', placeholder: 'https://www.reuters.com/article/...' },
      { key: 'rawOnly', label: 'Solo obtención rápida', placeholder: 'true' },
    ],
    sampleResponse: `{
  "introduction": "La Reserva Federal decidió aumentar las tasas de interés...",
  "body": "Contenido completo del artículo traducido...",
  "fullContent": "Contenido completo...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'v1-markets',
    label: 'GET /api/v1/markets — Datos de Mercados',
    params: [
      { key: 'type', label: 'Tipo', placeholder: 'forex' },
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
    label: 'POST /api/telegram — Bot de Telegram',
    params: [
      { key: 'text', label: 'Comando', placeholder: '/news' },
    ],
    sampleResponse: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter',
    label: 'POST /api/newsletter/subscribe — Suscripción',
    params: [
      { key: 'email', label: 'Correo electrónico', placeholder: 'user@example.com' },
      { key: 'name', label: 'Nombre', placeholder: 'Ahmed' },
    ],
    sampleResponse: `{
  "success": true,
  "message": "Te has registrado exitosamente en el boletín"
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
        title="Copiar"
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
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Nota: </span>
              {endpoint.note}
            </div>
          )}

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
                <thead>
                  <tr>
                    <th className="text-right py-1 px-2">Parámetro</th>
                    <th className="text-right py-1 px-2">Descripción</th>
                    <th className="text-right py-1 px-2">Requerido</th>
                    <th className="text-right py-1 px-2">Predeterminado</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 font-mono" style={{ color: 'var(--cyan)' }}>{p.name}</td>
                      <td className="py-1 px-2">{p.description}</td>
                      <td className="py-1 px-2">
                        {p.required ? (
                          <span style={{ color: 'var(--bear)' }}>Sí</span>
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
                label="Ejemplo de solicitud (Request Body)"
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
                label="Ejemplo de respuesta (Response)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function EsApiDocsPageClient() {
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
          Documentación de API Pública
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
          Interfaz pública de programación de aplicaciones para acceder a noticias y datos de mercados financieros de Rouaa
        </p>

        {/* ─── Authentication ───────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Autenticación</h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>
            Todas las solicitudes de API requieren una clave API. Puede obtener una clave desde el panel de control.
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
              title="Copiar"
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cyan)' }}>Puntos de conexión</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Haga clic en cualquier punto de conexión para expandir los detalles y ver ejemplos de solicitud y respuesta
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
            Puntos de conexión webhook para integración con servicios externos
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Pruébalo tú mismo</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Elija un punto de conexión e ingrese los parámetros para ver un ejemplo de respuesta
          </p>

          {/* Endpoint selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
              Elija el punto de conexión
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
            Ver ejemplo de respuesta
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
              label="Ejemplo de respuesta"
            />
          </div>
        </section>

        {/* ─── Error Responses ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Códigos de error</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
              <thead>
                <tr>
                  <th className="text-right py-1 px-2">Código</th>
                  <th className="text-right py-1 px-2">Significado</th>
                  <th className="text-right py-1 px-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bull)' }}>200</td>
                  <td className="py-1 px-2">Éxito</td>
                  <td className="py-1 px-2">La solicitud se completó con éxito</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--gold)' }}>400</td>
                  <td className="py-1 px-2">Solicitud no válida</td>
                  <td className="py-1 px-2">Parámetros faltantes o incorrectos</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>401</td>
                  <td className="py-1 px-2">No autorizado</td>
                  <td className="py-1 px-2">Clave API faltante o no válida</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>429</td>
                  <td className="py-1 px-2">Límite de tasa</td>
                  <td className="py-1 px-2">Se excedió el número de solicitudes permitidas</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>500</td>
                  <td className="py-1 px-2">Error del servidor</td>
                  <td className="py-1 px-2">Error interno del servidor</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>503</td>
                  <td className="py-1 px-2">Servicio no disponible</td>
                  <td className="py-1 px-2">Proveedor de AI no configurado o no disponible</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Rate Limits ──────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Límites de tasa</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>100</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>solicitudes/hora — Gratuito</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--bull)' }}>1,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>solicitudes/hora — Pro</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--gold)' }}>10,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>solicitudes/hora — Enterprise</div>
            </div>
          </div>
        </section>

        {/* ─── Quick Reference ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Referencia rápida — Ejemplos cURL</h2>

          <div className="space-y-3">
            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/v1/news?category=Bancos%20centrales&limit=5"`}
              id="curl-news"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Últimas noticias"
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
              label="POST — Traducir título + resumen"
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
              label="POST — Traducir texto + tipo (formato extendido)"
            />

            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/articles/fetch?url=https://reuters.com/...&rawOnly=true"`}
              id="curl-fetch-get"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Obtener artículo rápido"
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
              label="POST — Obtener artículo con traducción"
            />
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
