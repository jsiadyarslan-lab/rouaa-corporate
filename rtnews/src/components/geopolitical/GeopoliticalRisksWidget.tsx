'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRiskColor } from '@/lib/geopolitical/risk-thresholds';

// ════════════════════════════════════════════════════════════════════
// V1057: GeopoliticalRisksWidget — shows related geopolitical risks
// on report and news pages. Fetches latest risks from the API.
// ════════════════════════════════════════════════════════════════════

interface GeoRisk {
  id: string;
  title: string;
  slug: string;
  riskCategory: string;
  riskLevel: string;
  riskScore: number;
  publishedAt: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️',
  cyber: '🖥️', sanctions: '🚫', climate: '🌊',
};

export default function GeopoliticalRisksWidget({ locale = 'ar' }: { locale?: string }) {
  const [risks, setRisks] = useState<GeoRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const basePath = locale === 'ar' ? '' : `/${locale}`;

  useEffect(() => {
    fetch(`/api/geopolitical-risks?locale=${locale}&limit=4`)
      .then(r => r.json())
      .then(data => {
        const list = data?.data ?? [];
        setRisks(list.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 8, background: 'var(--bg4)', opacity: 0.5 }} />
        ))}
      </div>
    );
  }

  if (risks.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {risks.map((risk) => {
        const color = getRiskColor(risk.riskScore);
        const icon = CATEGORY_ICONS[risk.riskCategory] || '🌍';
        return (
          <Link
            key={risk.id}
            href={`${basePath}/geopolitical-risks/${risk.slug}`}
            className="glass-card"
            style={{
              textDecoration: 'none', padding: 12, borderRadius: 8,
              borderInlineStart: `3px solid ${color}`,
              transition: 'all .2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: color, fontFamily: 'var(--font-mono)' }}>
                {risk.riskScore}
              </span>
            </div>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-head)',
              margin: 0, lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {risk.title}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
