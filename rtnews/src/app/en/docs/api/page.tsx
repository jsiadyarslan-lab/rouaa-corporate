// ─── English API Documentation Page ────────────────────────────
import type { Metadata } from 'next';
import EnApiDocsPageClient from './EnApiDocsPageClient';

export const metadata: Metadata = {
  title: 'API Documentation — Rouaa | Rouaa API Docs',
  description: 'Public API documentation for Rouaa - financial news, market data, economic calendar',
};

export default function EnApiDocsPage() {
  return <EnApiDocsPageClient />;
}
