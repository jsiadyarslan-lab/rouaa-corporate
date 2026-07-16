// ─── Turkish API Documentation Page ────────────────────────────
import type { Metadata } from 'next';
import TrApiDocsPageClient from './TrApiDocsPageClient';

export const metadata: Metadata = {
  title: 'API Dokümantasyonu — Rouaa | Rouaa API Docs',
  description: 'Rouaa genel API dokümantasyonu - finansal haberler, piyasa verileri, ekonomik takvim',
};

export default function TrApiDocsPage() {
  return <TrApiDocsPageClient />;
}
