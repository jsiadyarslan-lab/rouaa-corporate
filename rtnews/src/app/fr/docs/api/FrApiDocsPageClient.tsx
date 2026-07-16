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
    title: 'Actualités financières',
    description: "Obtenir la liste des actualités financières",
    params: [
      { name: 'category', description: "Catégorie d'actualités", default: 'Tous' },
      { name: 'type', description: 'article | live | breaking', default: 'article' },
      { name: 'limit', description: 'Nombre de résultats (1-50)', default: '20' },
      { name: 'page', description: 'Numéro de page', default: '1' },
      { name: 'lang', description: 'fr | en', default: 'fr' },
    ],
    responseBody: `{
  "data": [
    {
      "id": "clx...",
      "title": "La Réserve fédérale augmente...",
      "summary": "La banque centrale a décidé...",
      "category": "Banques centrales",
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
    title: 'Données de marché',
    description: 'Données des marchés financiers',
    params: [
      { name: 'type', description: 'forex | arab | sentiment | earnings | centralBanks', default: 'forex' },
    ],
  },
  {
    id: 'v1-calendar',
    method: 'GET',
    path: '/api/v1/calendar',
    title: 'Calendrier économique',
    description: 'Événements du calendrier économique',
    params: [
      { name: 'country', description: 'Code du pays', default: 'Tous' },
      { name: 'days', description: 'Nombre de jours à venir', default: '7' },
    ],
  },
  {
    id: 'news-translate',
    method: 'POST',
    path: '/api/news/translate',
    title: 'Traduction IA',
    description: 'Traduction financière intelligente de l\'anglais vers le français — prend en charge deux formats',
    note: 'Ce point de terminaison prend en charge deux formats de requête différents. Choisissez le format approprié selon votre cas d\'utilisation.',
    params: [
      { name: 'title', description: 'Titre à traduire (format 1)', required: false },
      { name: 'summary', description: 'Résumé à traduire (format 1)', required: false },
      { name: 'text', description: 'Texte à traduire (format 2)', required: false },
      { name: 'type', description: 'Type de texte : title | content | summary (format 2)', required: false },
    ],
    requestBody: `// Format 1 : titre + résumé
{
  "title": "Fed Raises Interest Rates",
  "summary": "The Federal Reserve decided..."
}

// Format 2 : texte + type
{
  "text": "Fed Raises Interest Rates",
  "type": "title"           // "title" | "content" | "summary"
}`,
    responseBody: `// Réponse du format 1 (titre + résumé)
{
  "translation": {
    "translatedTitle": "La Fed augmente les taux d'intérêt",
    "translatedSummary": "La Réserve fédérale a décidé..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}

// Réponse du format 2 (texte + type)
{
  "translatedText": "La Fed augmente les taux d'intérêt",
  "isTranslated": true,
  "duration": 800,
  "method": "title-translation"    // ou "content-translation"
}`,
  },
  {
    id: 'articles-fetch-get',
    method: 'GET',
    path: '/api/articles/fetch',
    title: 'Récupérer un article (rapide)',
    description: 'Récupération rapide du contenu d\'un article via les paramètres de requête',
    note: 'Cette méthode est idéale pour la récupération rapide sans traduction IA. Ajoutez rawOnly=true pour obtenir uniquement le contenu brut (1-3 secondes).',
    params: [
      { name: 'url', description: "URL de l'article", required: true },
      { name: 'rawOnly', description: 'true = récupération rapide sans traduction', default: 'false' },
    ],
    responseBody: `// avec rawOnly=true
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
    title: 'Récupérer un article (avancé)',
    description: "Récupérer le contenu d'un article depuis un lien externe avec traduction IA facultative",
    note: 'Ce point de terminaison permet de transmettre un titre et un résumé pré-fournis pour améliorer la qualité de la traduction.',
    params: [
      { name: 'url', description: "URL de l'article", required: true },
      { name: 'rawOnly', description: 'true = récupération rapide sans traduction (1-3 secondes)', required: false },
      { name: 'title', description: 'Titre fourni', required: false },
      { name: 'summary', description: 'Résumé fourni', required: false },
    ],
    requestBody: `{
  "url": "https://www.reuters.com/article/...",
  "title": "Fed Raises Rates",       // facultatif
  "summary": "The Fed decided...",    // facultatif
  "rawOnly": false                    // facultatif
}`,
    responseBody: `{
  "introduction": "La Réserve fédérale a décidé...",
  "body": "Contenu complet traduit...",
  "conclusion": "Résumé avec analyse brève...",
  "fullContent": "Contenu complet...",
  "keyTakeaways": ["Point 1", "Point 2"],
  "affectedAssets": [{ "symbol": "EUR/USD", "direction": "up", "reason": "Raison" }],
  "sentiment": "negative",
  "recommendation": "Recommandation rapide",
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
    title: 'Alertes intelligentes',
    description: 'Gestion des alertes intelligentes — nécessite une authentification',
    params: [
      { name: 'GET', description: 'Requête des alertes actives', type: 'method' },
      { name: 'POST', description: 'Créer une nouvelle alerte (price | sentiment | breaking | custom)', type: 'method' },
      { name: 'PATCH', description: 'Mettre à jour une alerte (activer/désactiver)', type: 'method' },
      { name: 'DELETE', description: 'Supprimer une alerte', type: 'method' },
    ],
  },
  {
    id: 'community',
    method: 'GET',
    path: '/api/community',
    title: 'Communauté',
    description: 'Discussions de la communauté — parcourir, créer, voter',
    params: [
      { name: 'category', description: 'general | analysis | question | idea', default: 'Tous' },
      { name: 'sort', description: 'newest | popular', default: 'newest' },
      { name: 'limit', description: 'Nombre de résultats', default: '20' },
    ],
  },
  {
    id: 'search',
    method: 'GET',
    path: '/api/search',
    title: 'Recherche',
    description: 'Recherche dans les actualités et analyses',
    params: [
      { name: 'q', description: 'Texte de recherche', required: true },
      { name: 'limit', description: 'Nombre de résultats', default: '10' },
    ],
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/compliance',
    title: 'Conformité',
    description: 'État de conformité et règles de contenu — lecture seule',
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: "Vérification de l'état",
    description: "Vérifier l'état du serveur et des services — ne nécessite pas d'authentification",
  },
];

// ─── Webhooks data ───────────────────────────────────────────
const webhooks: Endpoint[] = [
  {
    id: 'telegram',
    method: 'POST',
    path: '/api/telegram',
    title: 'Bot Telegram',
    description: 'Webhook du bot Telegram pour recevoir les commandes et envoyer des notifications',
    note: 'Nécessite la configuration de TELEGRAM_BOT_TOKEN et TELEGRAM_WEBHOOK_SECRET. Prend en charge les commandes : /start, /news, /breaking, /alerts, /help',
    requestBody: `// Requête entrante de Telegram
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
    title: 'Abonnement à la newsletter',
    description: "Abonnement à la newsletter pour recevoir les dernières actualités financières",
    requestBody: `{
  "email": "user@example.com",
  "name": "Ahmed"        // facultatif
}`,
    responseBody: `// Nouvel abonnement
{
  "success": true,
  "message": "Vous avez été inscrit avec succès à la newsletter"
}

// Déjà abonné
{
  "success": true,
  "message": "Vous êtes déjà abonné à la newsletter"
}`,
  },
];

// ─── Try It sample data ──────────────────────────────────────
const tryItEndpoints = [
  {
    id: 'v1-news',
    label: 'GET /api/v1/news — Actualités financières',
    params: [
      { key: 'category', label: 'Catégorie', placeholder: 'Banques centrales' },
      { key: 'limit', label: 'Nombre', placeholder: '10' },
      { key: 'lang', label: 'Langue', placeholder: 'fr' },
    ],
    sampleResponse: `{
  "data": [
    {
      "id": "clx_abc123",
      "title": "La Réserve fédérale augmente les taux d'intérêt de 25 points de base",
      "summary": "La banque centrale américaine a décidé d'augmenter le taux d'intérêt...",
      "category": "Banques centrales",
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
    label: 'POST /api/news/translate — Traduction IA',
    params: [
      { key: 'title', label: 'Titre', placeholder: 'Fed Raises Interest Rates' },
      { key: 'summary', label: 'Résumé', placeholder: 'The Federal Reserve decided to raise rates...' },
    ],
    sampleResponse: `{
  "translation": {
    "translatedTitle": "La Fed augmente les taux d'intérêt",
    "translatedSummary": "La Réserve fédérale a décidé d'augmenter les taux d'intérêt de 25 points de base..."
  },
  "isTranslated": true,
  "duration": 1200,
  "powered": "AI Translation"
}`,
  },
  {
    id: 'articles-fetch',
    label: 'GET /api/articles/fetch — Récupérer un article',
    params: [
      { key: 'url', label: 'URL', placeholder: 'https://www.reuters.com/article/...' },
      { key: 'rawOnly', label: 'Récupération rapide uniquement', placeholder: 'true' },
    ],
    sampleResponse: `{
  "introduction": "La Réserve fédérale a décidé d'augmenter les taux d'intérêt...",
  "body": "Contenu complet de l'article traduit...",
  "fullContent": "Contenu complet...",
  "hasFullContent": true,
  "source": "reuters.com",
  "method": "raw-extraction",
  "rawOnly": true
}`,
  },
  {
    id: 'v1-markets',
    label: 'GET /api/v1/markets — Données de marché',
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
    label: 'POST /api/telegram — Bot Telegram',
    params: [
      { key: 'text', label: 'Commande', placeholder: '/news' },
    ],
    sampleResponse: `{
  "ok": true
}`,
  },
  {
    id: 'newsletter',
    label: 'POST /api/newsletter/subscribe — Abonnement',
    params: [
      { key: 'email', label: 'E-mail', placeholder: 'user@example.com' },
      { key: 'name', label: 'Nom', placeholder: 'Ahmed' },
    ],
    sampleResponse: `{
  "success": true,
  "message": "Vous avez été inscrit avec succès à la newsletter"
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
        title="Copier"
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
              <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Remarque : </span>
              {endpoint.note}
            </div>
          )}

          {/* Parameters table */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2">Paramètre</th>
                    <th className="text-left py-1 px-2">Description</th>
                    <th className="text-left py-1 px-2">Requis</th>
                    <th className="text-left py-1 px-2">Par défaut</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-2 font-mono" style={{ color: 'var(--cyan)' }}>{p.name}</td>
                      <td className="py-1 px-2">{p.description}</td>
                      <td className="py-1 px-2">
                        {p.required ? (
                          <span style={{ color: 'var(--bear)' }}>Oui</span>
                        ) : (
                          <span style={{ color: 'var(--text4)' }}>Non</span>
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
                label="Exemple de requête (Request Body)"
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
                label="Exemple de réponse (Response)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function FrApiDocsPageClient() {
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
          Documentation API Publique
        </h1>
        <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
          API publique pour accéder aux actualités et données des marchés financiers de Rouaa
        </p>

        {/* ─── Authentication ───────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Authentification</h2>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>
            Toutes les requêtes API nécessitent une clé API. Vous pouvez obtenir une clé depuis le tableau de bord.
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
              title="Copier"
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--cyan)' }}>Points de terminaison</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Cliquez sur un point de terminaison pour afficher les détails et les exemples
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
            Points de connexion webhook pour l'intégration avec des services externes
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
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cyan)' }}>Essayez vous-même</h2>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
            Sélectionner un point de terminaison et entrer les paramètres pour voir un exemple de réponse
          </p>

          {/* Endpoint selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>
              Sélectionner le point de terminaison
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
            Afficher l&apos;exemple de réponse
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
              label="Exemple de réponse"
            />
          </div>
        </section>

        {/* ─── Error Responses ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Codes d&apos;erreur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]" style={{ color: 'var(--text2)' }}>
              <thead>
                <tr>
                  <th className="text-left py-1 px-2">Code</th>
                  <th className="text-left py-1 px-2">Signification</th>
                  <th className="text-left py-1 px-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bull)' }}>200</td>
                  <td className="py-1 px-2">Succès</td>
                  <td className="py-1 px-2">La requête a été traitée avec succès</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--gold)' }}>400</td>
                  <td className="py-1 px-2">Requête invalide</td>
                  <td className="py-1 px-2">Paramètres manquants ou incorrects</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>401</td>
                  <td className="py-1 px-2">Non autorisé</td>
                  <td className="py-1 px-2">Clé API manquante ou invalide</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>429</td>
                  <td className="py-1 px-2">Limite de débit</td>
                  <td className="py-1 px-2">Nombre de requêtes autorisées dépassé</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>500</td>
                  <td className="py-1 px-2">Erreur serveur</td>
                  <td className="py-1 px-2">Erreur interne du serveur</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-mono" style={{ color: 'var(--bear)' }}>503</td>
                  <td className="py-1 px-2">Service indisponible</td>
                  <td className="py-1 px-2">Fournisseur IA non configuré ou indisponible</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Rate Limits ──────────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Limites de débit</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>100</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requêtes/heure — Gratuit</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--bull)' }}>1,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requêtes/heure — Pro</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg4)' }}>
              <div className="text-[18px] font-bold" style={{ color: 'var(--gold)' }}>10,000</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>requêtes/heure — Entreprise</div>
            </div>
          </div>
        </section>

        {/* ─── Quick Reference ──────────────────────── */}
        <section className="glass-card mb-8 p-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--cyan)' }}>Référence rapide — Exemples cURL</h2>

          <div className="space-y-3">
            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/v1/news?category=Banques%20centrales&limit=5"`}
              id="curl-news"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Dernières actualités"
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
              label="POST — Traduire titre + résumé"
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
              label="POST — Traduire texte + type (format étendu)"
            />

            <CodeBlock
              code={`curl -H "Authorization: Bearer rva_your_key" \\
  "https://api.rouaa.news/api/articles/fetch?url=https://reuters.com/...&rawOnly=true"`}
              id="curl-fetch-get"
              copiedId={copiedId}
              onCopy={copy}
              label="GET — Récupération rapide d'article"
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
              label="POST — Récupérer un article avec traduction"
            />
          </div>
        </section>
      </div>

      <BackToTop />
    </main>
  );
}
