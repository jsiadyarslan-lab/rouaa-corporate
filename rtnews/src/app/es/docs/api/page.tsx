// ─── Spanish API Documentation Page ────────────────────────────
import type { Metadata } from 'next';
import EsApiDocsPageClient from './EsApiDocsPageClient';

export const metadata: Metadata = {
  title: 'Documentación de API — Rouaa | Rouaa API Docs',
  description: 'Documentación de la API pública de Rouaa - noticias financieras, datos de mercados, calendario económico',
};

export default function EsApiDocsPage() {
  return <EsApiDocsPageClient />;
}
