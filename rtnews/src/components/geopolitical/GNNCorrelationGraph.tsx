'use client';

import { useState, useMemo } from 'react';
import { runGNNAnalysis, type GNNAnalysisResult, type CorrelationResult, type HiddenRisk, type CountryCluster } from '@/lib/geopolitical/gnn-correlation';
import { t } from '@/lib/geopolitical/i18n';

interface GNNCorrelationGraphProps {
  locale: string;
}

const COUNTRY_POS: Record<string, { x: number; y: number; nameAr: string; nameEn: string; nameFr: string; nameTr: string; nameEs: string }> = {
  US: { x: 150, y: 200, nameAr: 'أمريكا', nameEn: 'US', nameFr: 'États-Unis', nameTr: 'ABD', nameEs: 'Estados Unidos' },
  CA: { x: 130, y: 140, nameAr: 'كندا', nameEn: 'CA', nameFr: 'Canada', nameTr: 'Kanada', nameEs: 'Canadá' },
  MX: { x: 110, y: 260, nameAr: 'المكسيك', nameEn: 'MX', nameFr: 'Mexique', nameTr: 'Meksika', nameEs: 'México' },
  GB: { x: 400, y: 160, nameAr: 'بريطانيا', nameEn: 'GB', nameFr: 'Royaume-Uni', nameTr: 'Birleşik Krallık', nameEs: 'Reino Unido' },
  FR: { x: 420, y: 200, nameAr: 'فرنسا', nameEn: 'FR', nameFr: 'France', nameTr: 'Fransa', nameEs: 'Francia' },
  DE: { x: 440, y: 175, nameAr: 'ألمانيا', nameEn: 'DE', nameFr: 'Allemagne', nameTr: 'Almanya', nameEs: 'Alemania' },
  RU: { x: 560, y: 130, nameAr: 'روسيا', nameEn: 'RU', nameFr: 'Russie', nameTr: 'Rusya', nameEs: 'Rusia' },
  UA: { x: 530, y: 170, nameAr: 'أوكرانيا', nameEn: 'UA', nameFr: 'Ukraine', nameTr: 'Ukrayna', nameEs: 'Ucrania' },
  TR: { x: 500, y: 230, nameAr: 'تركيا', nameEn: 'TR', nameFr: 'Turquie', nameTr: 'Türkiye', nameEs: 'Turquía' },
  IR: { x: 530, y: 270, nameAr: 'إيران', nameEn: 'IR', nameFr: 'Iran', nameTr: 'İran', nameEs: 'Irán' },
  IQ: { x: 510, y: 290, nameAr: 'العراق', nameEn: 'IQ', nameFr: 'Irak', nameTr: 'Irak', nameEs: 'Irak' },
  SY: { x: 490, y: 270, nameAr: 'سوريا', nameEn: 'SY', nameFr: 'Syrie', nameTr: 'Suriye', nameEs: 'Siria' },
  SA: { x: 510, y: 320, nameAr: 'السعودية', nameEn: 'SA', nameFr: 'Arabie saoudite', nameTr: 'Suudi Arabistan', nameEs: 'Arabia Saudita' },
  AE: { x: 540, y: 310, nameAr: 'الإمارات', nameEn: 'AE', nameFr: 'Émirats arabes unis', nameTr: 'BAE', nameEs: 'Emiratos Árabes Unidos' },
  YE: { x: 510, y: 350, nameAr: 'اليمن', nameEn: 'YE', nameFr: 'Yémen', nameTr: 'Yemen', nameEs: 'Yemen' },
  IL: { x: 475, y: 280, nameAr: 'إسرائيل', nameEn: 'IL', nameFr: 'Israël', nameTr: 'İsrail', nameEs: 'Israel' },
  EG: { x: 460, y: 310, nameAr: 'مصر', nameEn: 'EG', nameFr: 'Égypte', nameTr: 'Mısır', nameEs: 'Egipto' },
  CN: { x: 680, y: 230, nameAr: 'الصين', nameEn: 'CN', nameFr: 'Chine', nameTr: 'Çin', nameEs: 'China' },
  TW: { x: 710, y: 270, nameAr: 'تايوان', nameEn: 'TW', nameFr: 'Taïwan', nameTr: 'Tayvan', nameEs: 'Taiwán' },
  JP: { x: 760, y: 220, nameAr: 'اليابان', nameEn: 'JP', nameFr: 'Japon', nameTr: 'Japonya', nameEs: 'Japón' },
  KR: { x: 730, y: 250, nameAr: 'كوريا', nameEn: 'KR', nameFr: 'Corée du Sud', nameTr: 'Güney Kore', nameEs: 'Corea del Sur' },
  KP: { x: 740, y: 220, nameAr: 'كوريا الشمالية', nameEn: 'KP', nameFr: 'Corée du Nord', nameTr: 'Kuzey Kore', nameEs: 'Corea del Norte' },
  IN: { x: 610, y: 310, nameAr: 'الهند', nameEn: 'IN', nameFr: 'Inde', nameTr: 'Hindistan', nameEs: 'India' },
  AU: { x: 730, y: 380, nameAr: 'أستراليا', nameEn: 'AU', nameFr: 'Australie', nameTr: 'Avustralya', nameEs: 'Australia' },
  VE: { x: 180, y: 300, nameAr: 'فنزويلا', nameEn: 'VE', nameFr: 'Venezuela', nameTr: 'Venezuela', nameEs: 'Venezuela' },
};

const RELATION_COLORS: Record<string, string> = {
  trade: '#22C55E',
  alliance: '#3B82F6',
  conflict: '#EF4444',
  sanctions: '#F59E0B',
  supply_chain: '#8B5CF6',
};

export default function GNNCorrelationGraph({ locale }: GNNCorrelationGraphProps) {
  const isRtl = locale === 'ar';
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterRelation, setFilterRelation] = useState<string>('all');

  const analysis: GNNAnalysisResult = useMemo(() => runGNNAnalysis(), []);

  const filteredCorrelations = useMemo(() => {
    if (filterRelation === 'all') return analysis.correlations;
    return analysis.correlations.filter(c => c.relationType === filterRelation);
  }, [analysis.correlations, filterRelation]);

  const selectedCorrelations = useMemo(() => {
    if (!selectedNode) return [];
    return filteredCorrelations.filter(c => c.source === selectedNode || c.target === selectedNode);
  }, [selectedNode, filteredCorrelations]);

  const activeEdges = useMemo(() => {
    const relevantSources = new Set(filteredCorrelations.map(c => c.source));
    const relevantTargets = new Set(filteredCorrelations.map(c => c.target));
    return analysis.edges.filter(e =>
      (relevantSources.has(e.source) && relevantTargets.has(e.target)) &&
      (filterRelation === 'all' || e.relationType === filterRelation)
    );
  }, [analysis.edges, filteredCorrelations, filterRelation]);

  const getNodeColor = (riskScore: number) => {
    if (riskScore > 75) return '#EF4444';
    if (riskScore > 55) return '#F97316';
    if (riskScore > 35) return '#EAB308';
    return '#22C55E';
  };

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-head)' }}>
        {t('gnn.title', locale)}
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
        {t('gnn.subtitle', locale)}
      </p>

      {/* Systemic Risk Score */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{
        background: analysis.systemicRiskScore > 60 ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
        border: `1px solid ${analysis.systemicRiskScore > 60 ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
      }}>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {t('gnn.systemicRisk', locale)}
        </span>
        <span className="text-2xl font-bold tabular-nums" style={{
          color: analysis.systemicRiskScore > 60 ? '#EF4444' : analysis.systemicRiskScore > 40 ? '#EAB308' : '#22C55E',
        }}>
          {analysis.systemicRiskScore}
        </span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>/100</span>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2 mb-4">
        {['all', 'trade', 'alliance', 'conflict', 'sanctions', 'supply_chain'].map(rel => (
          <button
            key={rel}
            onClick={() => setFilterRelation(rel)}
            className="px-2 py-1 rounded text-[10px] font-medium transition-all"
            style={{
              background: filterRelation === rel ? 'var(--bg4)' : 'transparent',
              border: `1px solid ${filterRelation === rel ? (RELATION_COLORS[rel] || 'var(--rim)') : 'var(--rim)'}`,
              color: filterRelation === rel ? (RELATION_COLORS[rel] || 'var(--text)') : 'var(--text3)',
            }}
          >
            {t(rel === 'all' ? 'gnn.filterAll' : rel === 'trade' ? 'gnn.filterTrade' : rel === 'alliance' ? 'gnn.filterAlliance' : rel === 'conflict' ? 'gnn.filterConflict' : rel === 'sanctions' ? 'gnn.filterSanctions' : 'gnn.filterSupply', locale)}
          </button>
        ))}
      </div>

      {/* Graph Visualization */}
      <div className="mb-4 rounded-lg overflow-hidden" style={{ background: 'var(--bg4)' }}>
        <svg width="100%" viewBox="0 0 800 440" style={{ display: 'block' }}>
          {/* Edges */}
          {activeEdges.map((edge, idx) => {
            const sourcePos = COUNTRY_POS[edge.source];
            const targetPos = COUNTRY_POS[edge.target];
            if (!sourcePos || !targetPos) return null;
            const isSelected = selectedNode && (edge.source === selectedNode || edge.target === selectedNode);
            return (
              <line
                key={`edge-${idx}`}
                x1={sourcePos.x} y1={sourcePos.y}
                x2={targetPos.x} y2={targetPos.y}
                stroke={RELATION_COLORS[edge.relationType] || '#666'}
                strokeWidth={isSelected ? 2 : 0.8}
                opacity={isSelected ? 0.8 : 0.2}
              />
            );
          })}
          {/* Nodes */}
          {analysis.nodes.map(node => {
            const pos = COUNTRY_POS[node.id];
            if (!pos) return null;
            const isSelected = selectedNode === node.id;
            const r = isSelected ? 14 : 10;
            return (
              <g key={node.id} onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={getNodeColor(node.riskScore)}
                  opacity={0.8}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={2}
                />
                <text
                  x={pos.x} y={pos.y + r + 12}
                  textAnchor="middle"
                  fill="var(--text3)"
                  fontSize="8"
                >
                  {locale === 'ar' ? pos.nameAr : locale === 'fr' ? pos.nameFr : locale === 'tr' ? pos.nameTr : locale === 'es' ? pos.nameEs : pos.nameEn}
                </text>
                <text
                  x={pos.x} y={pos.y + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="7"
                  fontWeight="bold"
                >
                  {node.riskScore}
                </text>
              </g>
            );
          })}
          {/* Legend */}
          <g transform="translate(10, 400)">
            {Object.entries(RELATION_COLORS).map(([type, color], i) => (
              <g key={type} transform={`translate(${i * 100}, 0)`}>
                <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2" />
                <text x="24" y="9" fill="var(--text3)" fontSize="8">
                  {t(type === 'trade' ? 'gnn.filterTrade' : type === 'alliance' ? 'gnn.filterAlliance' : type === 'conflict' ? 'gnn.filterConflict' : type === 'sanctions' ? 'gnn.filterSanctions' : 'gnn.filterSupply', locale)}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Vulnerable Clusters */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('gnn.vulnerableClusters', locale)}
        </h4>
        <div className="space-y-2">
          {analysis.vulnerableClusters.map(cluster => (
            <div key={cluster.id} className="rounded-lg p-3" style={{ background: 'var(--bg4)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? cluster.labelAr : cluster.labelEn}
                </span>
                <span className="text-xs font-bold" style={{ color: getNodeColor(cluster.clusterRisk) }}>
                  {cluster.clusterRisk}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {cluster.countries.map(c => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg5)', color: 'var(--text3)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Risks */}
      <div>
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('gnn.hiddenRisks', locale)}
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {analysis.hiddenRisks.slice(0, 8).map((risk, idx) => (
            <div key={idx} className="rounded-lg p-3" style={{
              background: risk.severity > 60 ? 'rgba(239,68,68,0.06)' : 'var(--bg4)',
              borderLeft: `3px solid ${risk.severity > 60 ? '#EF4444' : risk.severity > 40 ? '#F97316' : '#EAB308'}`,
            }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? risk.descriptionAr : risk.descriptionEn}
                </span>
                <span className="text-xs font-bold" style={{ color: getNodeColor(risk.severity) }}>
                  {risk.severity}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text3)' }}>
                <span>{t('gnn.probability', locale)}: {(risk.probability * 100).toFixed(0)}%</span>
                <span>|</span>
                <span>{t('gnn.type', locale)}: {risk.type.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
