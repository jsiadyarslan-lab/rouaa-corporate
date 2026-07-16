'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  buildScenarioTree,
  getAvailableScenarioTrees,
  findHighestImpactPath,
  findMostProbablePath,
  type ScenarioNode,
  type ScenarioTreeResult,
} from '@/lib/geopolitical/scenario-tree-ai';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AIScenarioTreeProps {
  locale: string;
}

interface LayoutNode {
  node: ScenarioNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutEdge {
  source: LayoutNode;
  target: LayoutNode;
  pathType: 'impact' | 'probable' | 'normal';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NODE_WIDTH = 190;
const NODE_HEIGHT = 82;
const HORIZONTAL_GAP = 64;
const VERTICAL_GAP = 14;
const MINI_BAR_HEIGHT = 6;
const MINI_BAR_WIDTH = 50;
const IMPACT_BADGE_RADIUS = 14;

const ASSET_KEYS = ['oil', 'gold', 'dollar', 'equities'] as const;

const ASSET_LABELS: Record<string, Record<string, string>> = {
  oil: { ar: 'النفط', en: 'Oil', fr: 'Pétrole', es: 'Petróleo', tr: 'Petrol' },
  gold: { ar: 'الذهب', en: 'Gold', fr: 'Or', es: 'Oro', tr: 'Altın' },
  dollar: { ar: 'الدولار', en: 'USD', fr: 'USD', es: 'USD', tr: 'USD' },
  equities: { ar: 'الأسهم', en: 'Equities', fr: 'Actions', es: 'Acciones', tr: 'Hisse' },
};

const LABELS: Record<string, Record<string, string>> = {
  title: {
    ar: 'شجرة السيناريوهات بالذكاء الاصطناعي',
    en: 'AI-Enhanced Scenario Tree',
    fr: 'Arbre de Scénarios IA',
    es: 'Árbol de Escenarios con IA',
    tr: 'AI Destekli Senaryo Ağacı',
  },
  selectScenario: {
    ar: 'اختر السيناريو',
    en: 'Select Scenario',
    fr: 'Sélectionner le scénario',
    es: 'Seleccionar escenario',
    tr: 'Senaryo Seç',
  },
  conditional: {
    ar: 'احتمالي',
    en: 'Conditional',
    fr: 'Conditionnel',
    es: 'Condicional',
    tr: 'Koşullu',
  },
  absolute: {
    ar: 'مطلق',
    en: 'Absolute',
    fr: 'Absolu',
    es: 'Absoluto',
    tr: 'Mutlak',
  },
  impactPath: {
    ar: 'مسار الأثر الأعلى',
    en: 'Highest Impact Path',
    fr: 'Chemin d\'impact le plus élevé',
    es: 'Ruta de mayor impacto',
    tr: 'En yüksek etki yolu',
  },
  probablePath: {
    ar: 'المسار الأكثر احتمالاً',
    en: 'Most Probable Path',
    fr: 'Chemin le plus probable',
    es: 'Ruta más probable',
    tr: 'En olası yol',
  },
  ragValidation: {
    ar: 'التحقق RAG',
    en: 'RAG Validation',
    fr: 'Validation RAG',
    es: 'Validación RAG',
    tr: 'RAG Doğrulama',
  },
  historicalPrecedent: {
    ar: 'سابقة تاريخية',
    en: 'Historical Precedent',
    fr: 'Précédent historique',
    es: 'Precedente histórico',
    tr: 'Tarihsel emsal',
  },
  similarity: {
    ar: 'درجة التشابه',
    en: 'Similarity',
    fr: 'Similarité',
    es: 'Similitud',
    tr: 'Benzerlik',
  },
  source: {
    ar: 'المصدر',
    en: 'Source',
    fr: 'Source',
    es: 'Fuente',
    tr: 'Kaynak',
  },
  pathSummary: {
    ar: 'ملخص المسار',
    en: 'Path Summary',
    fr: 'Résumé du chemin',
    es: 'Resumen de ruta',
    tr: 'Yol Özeti',
  },
  totalImpact: {
    ar: 'الأثر التراكمي',
    en: 'Cumulative Impact',
    fr: 'Impact cumulatif',
    es: 'Impacto acumulado',
    tr: 'Kümülatif etki',
  },
  totalProbability: {
    ar: 'الاحتمال التراكمي',
    en: 'Cumulative Probability',
    fr: 'Probabilité cumulée',
    es: 'Probabilidad acumulada',
    tr: 'Kümülatif olasılık',
  },
  scenario: {
    ar: 'السيناريو',
    en: 'Scenario',
    fr: 'Scénario',
    es: 'Escenario',
    tr: 'Senaryo',
  },
  impact: {
    ar: 'الأثر',
    en: 'Impact',
    fr: 'Impact',
    es: 'Impacto',
    tr: 'Etki',
  },
  probability: {
    ar: 'الاحتمال',
    en: 'Probability',
    fr: 'Probabilité',
    es: 'Probabilidad',
    tr: 'Olasılık',
  },
  leafNode: {
    ar: 'عقدة طرفية — انقر لعرض ملخص المسار',
    en: 'Leaf node — click for path summary',
    fr: 'Nœud feuille — cliquer pour le résumé',
    es: 'Nodo hoja — clic para resumen',
    tr: 'Yaprak düğüm — yol özeti için tıklayın',
  },
  expand: {
    ar: 'توسيع',
    en: 'Expand',
    fr: 'Développer',
    es: 'Expandir',
    tr: 'Genişlet',
  },
  collapse: {
    ar: 'طي',
    en: 'Collapse',
    fr: 'Réduire',
    es: 'Colapsar',
    tr: 'Daralt',
  },
  marketImpact: {
    ar: 'تأثير السوق',
    en: 'Market Impact',
    fr: 'Impact marché',
    es: 'Impacto de mercado',
    tr: 'Piyasa etkisi',
  },
  noValidation: {
    ar: 'لا يوجد تحقق',
    en: 'No validation',
    fr: 'Pas de validation',
    es: 'Sin validación',
    tr: 'Doğrulama yok',
  },
  pathChain: {
    ar: 'سلسلة المسار',
    en: 'Path Chain',
    fr: 'Chaîne de chemin',
    es: 'Cadena de ruta',
    tr: 'Yol zinciri',
  },
  scenarioTree: {
    ar: 'شجرة السيناريوهات',
    en: 'Scenario Tree',
    fr: 'Arbre de scénarios',
    es: 'Árbol de escenarios',
    tr: 'Senaryo ağacı',
  },
  totalScenarios: {
    ar: 'إجمالي السيناريوهات',
    en: 'Total Scenarios',
    fr: 'Total scénarios',
    es: 'Total escenarios',
    tr: 'Toplam senaryolar',
  },
  maxDepth: {
    ar: 'أقصى عمق',
    en: 'Max Depth',
    fr: 'Profondeur max',
    es: 'Profundidad máx',
    tr: 'Maks derinlik',
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function t(key: string, locale: string): string {
  return LABELS[key]?.[locale] ?? LABELS[key]?.['en'] ?? key;
}

function getLocalizedTitle(node: ScenarioNode, locale: string): string {
  const map: Record<string, string> = {
    ar: node.titleAr,
    en: node.titleEn,
    fr: node.titleFr,
    tr: node.titleTr,
    es: node.titleEs,
  };
  return map[locale] ?? node.titleEn;
}

function getImpactColor(score: number): string {
  if (score <= 25) return '#22C55E';
  if (score <= 50) return '#EAB308';
  if (score <= 75) return '#F97316';
  return '#EF4444';
}

function getImpactBg(score: number): string {
  if (score <= 25) return 'rgba(34,197,94,0.15)';
  if (score <= 50) return 'rgba(234,179,8,0.15)';
  if (score <= 75) return 'rgba(249,115,22,0.15)';
  return 'rgba(239,68,68,0.15)';
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/* ------------------------------------------------------------------ */
/*  Tree Layout Algorithm                                              */
/* ------------------------------------------------------------------ */

/**
 * Compute the subtree height for a node (sum of all leaf descendant heights + gaps).
 */
function computeSubtreeHeight(
  node: ScenarioNode,
  expandedIds: Set<string>
): number {
  const isExpanded = expandedIds.has(node.id);
  if (!isExpanded || node.children.length === 0) {
    return NODE_HEIGHT;
  }

  let totalChildHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalChildHeight += computeSubtreeHeight(node.children[i], expandedIds);
    if (i < node.children.length - 1) {
      totalChildHeight += VERTICAL_GAP;
    }
  }

  return Math.max(NODE_HEIGHT, totalChildHeight);
}

/**
 * Assign x,y positions to each visible node in the tree.
 * Returns an array of LayoutNode and LayoutEdge.
 */
function layoutTree(
  root: ScenarioNode,
  expandedIds: Set<string>,
  impactPathIds: Set<string>,
  probablePathIds: Set<string>
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  function layoutSubtree(
    node: ScenarioNode,
    depth: number,
    yOffset: number
  ): { node: LayoutNode; height: number } {
    const x = depth * (NODE_WIDTH + HORIZONTAL_GAP);
    const isExpanded = expandedIds.has(node.id);
    const subtreeH = computeSubtreeHeight(node, expandedIds);
    const y = yOffset + subtreeH / 2 - NODE_HEIGHT / 2;

    const layoutNode: LayoutNode = {
      node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    nodes.push(layoutNode);

    if (isExpanded && node.children.length > 0) {
      let childYOffset = yOffset;
      // Compute total children height to center them
      let totalChildrenHeight = 0;
      const childHeights: number[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const h = computeSubtreeHeight(node.children[i], expandedIds);
        childHeights.push(h);
        totalChildrenHeight += h;
        if (i < node.children.length - 1) {
          totalChildrenHeight += VERTICAL_GAP;
        }
      }

      // Center children around the parent
      childYOffset = yOffset + (subtreeH - totalChildrenHeight) / 2;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childLayout = layoutSubtree(child, depth + 1, childYOffset);

        // Determine edge path type
        const childId = child.id;
        const isOnImpactPath =
          impactPathIds.has(node.id) && impactPathIds.has(childId);
        const isOnProbablePath =
          probablePathIds.has(node.id) && probablePathIds.has(childId);

        let pathType: LayoutEdge['pathType'] = 'normal';
        if (isOnImpactPath) pathType = 'impact';
        if (isOnProbablePath) pathType = 'probable';

        edges.push({
          source: layoutNode,
          target: childLayout.node,
          pathType,
        });

        childYOffset += childHeights[i] + VERTICAL_GAP;
      }
    }

    return { node: layoutNode, height: subtreeH };
  }

  layoutSubtree(root, 0, 0);
  return { nodes, edges };
}

/**
 * Build a curved SVG path from source right edge to target left edge.
 */
function buildEdgePath(
  source: LayoutNode,
  target: LayoutNode,
  isRtl: boolean
): string {
  const sx = isRtl ? source.x : source.x + source.width;
  const sy = source.y + source.height / 2;
  const tx = isRtl ? target.x + target.width : target.x;
  const ty = target.y + target.height / 2;

  const midX = (sx + tx) / 2;
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

/**
 * Get the path from root to a specific node.
 */
function getPathToNode(
  root: ScenarioNode,
  targetId: string
): ScenarioNode[] | null {
  if (root.id === targetId) return [root];
  for (const child of root.children) {
    const path = getPathToNode(child, targetId);
    if (path) return [root, ...path];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIScenarioTree({ locale }: AIScenarioTreeProps) {
  const isRtl = locale === 'ar';
  const [selectedScenario, setSelectedScenario] = useState('hormuz');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);

  // Build the scenario tree
  const treeResult = useMemo<ScenarioTreeResult>(
    () => buildScenarioTree(selectedScenario, { locale }),
    [selectedScenario, locale]
  );

  // Available scenario options
  const scenarioOptions = useMemo(() => getAvailableScenarioTrees(), []);

  // Find special paths
  const impactPath = useMemo(
    () => findHighestImpactPath(treeResult),
    [treeResult]
  );
  const probablePath = useMemo(
    () => findMostProbablePath(treeResult),
    [treeResult]
  );

  const impactPathIds = useMemo(
    () => new Set(impactPath.map((n) => n.id)),
    [impactPath]
  );
  const probablePathIds = useMemo(
    () => new Set(probablePath.map((n) => n.id)),
    [probablePath]
  );

  // Auto-expand root and first level on scenario change
  useEffect(() => {
    const initial = new Set<string>();
    initial.add(treeResult.root.id);
    for (const child of treeResult.root.children) {
      initial.add(child.id);
    }
    setExpandedIds(initial);
    setSelectedLeafId(null);
  }, [treeResult]);

  // Compute layout
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => layoutTree(treeResult.root, expandedIds, impactPathIds, probablePathIds),
    [treeResult, expandedIds, impactPathIds, probablePathIds]
  );

  // Compute SVG dimensions
  const svgDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    for (const ln of layoutNodes) {
      maxX = Math.max(maxX, ln.x + ln.width);
      maxY = Math.max(maxY, ln.y + ln.height);
    }
    return {
      width: maxX + 40,
      height: maxY + 40,
    };
  }, [layoutNodes]);

  // Selected leaf path data
  const selectedLeafPath = useMemo(() => {
    if (!selectedLeafId) return null;
    return getPathToNode(treeResult.root, selectedLeafId);
  }, [selectedLeafId, treeResult.root]);

  // Toggle node expansion
  const handleNodeClick = useCallback(
    (node: ScenarioNode) => {
      if (node.children.length === 0) {
        // Leaf node — show path summary
        setSelectedLeafId(
          selectedLeafId === node.id ? null : node.id
        );
        return;
      }

      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    },
    [selectedLeafId]
  );

  // Edge colors
  const getEdgeColor = (pathType: LayoutEdge['pathType']): string => {
    switch (pathType) {
      case 'impact':
        return '#EF4444';
      case 'probable':
        return '#22C55E';
      default:
        return 'var(--rim, #2A313C)';
    }
  };

  const getEdgeWidth = (pathType: LayoutEdge['pathType']): number => {
    switch (pathType) {
      case 'impact':
      case 'probable':
        return 2.5;
      default:
        return 1.5;
    }
  };

  return (
    <div
      className="rounded-xl border p-4 sm:p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--text-head)' }}
        >
          {t('title', locale)}
        </h3>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text3)' }}>
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ background: '#EF4444' }}
              />
              {t('impactPath', locale)}
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ background: '#22C55E' }}
              />
              {t('probablePath', locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="mb-5 max-w-xs">
        <label
          className="text-xs font-medium mb-1 block"
          style={{ color: 'var(--text3)' }}
        >
          {t('selectScenario', locale)}
        </label>
        <Select value={selectedScenario} onValueChange={setSelectedScenario}>
          <SelectTrigger
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'var(--bg4)',
              borderColor: 'var(--rim)',
              color: 'var(--text)',
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
          >
            {scenarioOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt[`label${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof typeof opt] as string ?? opt.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--text3)' }}>
        <span>
          {t('totalScenarios', locale)}:{' '}
          <strong style={{ color: 'var(--text)' }}>{treeResult.totalScenarios}</strong>
        </span>
        <span>
          {t('maxDepth', locale)}:{' '}
          <strong style={{ color: 'var(--text)' }}>{treeResult.maxDepthReached}</strong>
        </span>
      </div>

      {/* SVG Tree */}
      <div
        className="w-full overflow-x-auto rounded-lg border"
        style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}
      >
        <svg
          width={svgDimensions.width}
          height={svgDimensions.height}
          className="min-w-full"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <defs>
            {/* Shadow filter */}
            <filter id="nodeShadow" x="-10%" y="-10%" width="130%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
            </filter>
            {/* Glow for highlighted paths */}
            <filter id="impactGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="#EF4444" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="probableGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="#22C55E" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          <g className="edges">
            {layoutEdges.map((edge, i) => {
              const pathD = buildEdgePath(edge.source, edge.target, isRtl);
              const isHighlighted = edge.pathType !== 'normal';
              return (
                <g key={`edge-${i}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={getEdgeColor(edge.pathType)}
                    strokeWidth={getEdgeWidth(edge.pathType)}
                    strokeOpacity={isHighlighted ? 0.9 : 0.35}
                    strokeDasharray={edge.pathType === 'normal' ? 'none' : undefined}
                    filter={isHighlighted ? (edge.pathType === 'impact' ? 'url(#impactGlow)' : 'url(#probableGlow)') : undefined}
                  />
                  {/* Probability label on edge */}
                  <text
                    x={
                      isRtl
                        ? (edge.source.x + edge.target.x + edge.target.width) / 2
                        : (edge.source.x + edge.source.width + edge.target.x) / 2
                    }
                    y={(edge.source.y + edge.source.height / 2 + edge.target.y + edge.target.height / 2) / 2 - 6}
                    textAnchor="middle"
                    fill={edge.pathType === 'impact' ? '#EF4444' : edge.pathType === 'probable' ? '#22C55E' : 'var(--text3, #94A3B8)'}
                    fontSize="10"
                    fontWeight={isHighlighted ? 'bold' : 'normal'}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {(edge.target.node.probability * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {layoutNodes.map((ln) => {
              const { node } = ln;
              const isOnImpactPath = impactPathIds.has(node.id);
              const isOnProbablePath = probablePathIds.has(node.id);
              const isExpanded = expandedIds.has(node.id);
              const hasChildren = node.children.length > 0;
              const isLeaf = node.isLeaf;
              const isSelectedLeaf = selectedLeafId === node.id;

              // Border color: red for impact, green for probable, default for others
              let borderColor = 'var(--rim, #2A313C)';
              if (isOnImpactPath && !isOnProbablePath) borderColor = '#EF4444';
              else if (isOnProbablePath && !isOnImpactPath) borderColor = '#22C55E';
              else if (isOnImpactPath && isOnProbablePath) borderColor = '#EAB308';

              const impactColor = getImpactColor(node.impactScore);
              const impactBg = getImpactBg(node.impactScore);
              const title = getLocalizedTitle(node, locale);

              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNodeClick(node)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${title}. ${isLeaf ? t('leafNode', locale) : isExpanded ? t('collapse', locale) : t('expand', locale)}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(node);
                    }
                  }}
                >
                  {/* Node shadow rect */}
                  <rect
                    x={ln.x + 1}
                    y={ln.y + 2}
                    width={ln.width}
                    height={ln.height}
                    rx={10}
                    ry={10}
                    fill="rgba(0,0,0,0.15)"
                  />

                  {/* Node background rect */}
                  <rect
                    x={ln.x}
                    y={ln.y}
                    width={ln.width}
                    height={ln.height}
                    rx={10}
                    ry={10}
                    fill={isSelectedLeaf ? 'var(--bg2, #1A1F2B)' : 'var(--bg3, #1E2530)'}
                    stroke={borderColor}
                    strokeWidth={isSelectedLeaf ? 2 : 1}
                  />

                  {/* Selected highlight glow */}
                  {isSelectedLeaf && (
                    <rect
                      x={ln.x - 2}
                      y={ln.y - 2}
                      width={ln.width + 4}
                      height={ln.height + 4}
                      rx={12}
                      ry={12}
                      fill="none"
                      stroke="#d4af37"
                      strokeWidth={1.5}
                      strokeOpacity={0.6}
                    />
                  )}

                  {/* Impact score badge circle */}
                  <circle
                    cx={isRtl ? ln.x + ln.width - 14 : ln.x + 14}
                    cy={ln.y + 14}
                    r={IMPACT_BADGE_RADIUS}
                    fill={impactBg}
                    stroke={impactColor}
                    strokeWidth={1.5}
                  />
                  <text
                    x={isRtl ? ln.x + ln.width - 14 : ln.x + 14}
                    y={ln.y + 18}
                    textAnchor="middle"
                    fill={impactColor}
                    fontSize="10"
                    fontWeight="bold"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {node.impactScore}
                  </text>

                  {/* Title */}
                  <text
                    x={isRtl ? ln.x + ln.width - 34 : ln.x + 34}
                    y={ln.y + 18}
                    fill="var(--text, #E2E8F0)"
                    fontSize="11"
                    fontWeight="600"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {truncate(title, isRtl ? 16 : 16)}
                  </text>

                  {/* Probability row */}
                  <text
                    x={isRtl ? ln.x + ln.width - 8 : ln.x + 8}
                    y={ln.y + 36}
                    fill="var(--text3, #94A3B8)"
                    fontSize="9"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {t('conditional', locale)}: {(node.probability * 100).toFixed(0)}%
                  </text>
                  <text
                    x={isRtl ? ln.x + ln.width - 8 : ln.x + 8}
                    y={ln.y + 48}
                    fill="var(--text3, #94A3B8)"
                    fontSize="9"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {t('absolute', locale)}: {(node.absoluteProbability * 100).toFixed(1)}%
                  </text>

                  {/* Market impact mini-bars */}
                  {ASSET_KEYS.map((asset, idx) => {
                    const val = node.marketImpacts[asset];
                    const barY = ln.y + 56 + idx * (MINI_BAR_HEIGHT + 2);
                    const barX = isRtl ? ln.x + ln.width - 8 - MINI_BAR_WIDTH : ln.x + 8;
                    const isPos = val > 0;
                    const barFill = isPos ? 'rgba(34,197,94,0.5)' : 'rgba(239,83,80,0.5)';
                    const fillWidth = Math.min(Math.abs(val), 80) / 80 * MINI_BAR_WIDTH;

                    return (
                      <g key={asset}>
                        {/* Asset label */}
                        <text
                          x={isRtl ? ln.x + ln.width - 8 : ln.x + 8}
                          y={barY + MINI_BAR_HEIGHT - 1}
                          fill="var(--text3, #94A3B8)"
                          fontSize="7"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {ASSET_LABELS[asset]?.[locale] ?? asset}
                        </text>
                        {/* Background bar */}
                        <rect
                          x={isRtl ? barX - 30 : barX + 30}
                          y={barY}
                          width={MINI_BAR_WIDTH}
                          height={MINI_BAR_HEIGHT}
                          rx={2}
                          fill="var(--bg5, rgba(255,255,255,0.05))"
                        />
                        {/* Fill bar */}
                        <rect
                          x={
                            isRtl
                              ? barX - 30 + MINI_BAR_WIDTH - fillWidth
                              : barX + 30
                          }
                          y={barY}
                          width={fillWidth}
                          height={MINI_BAR_HEIGHT}
                          rx={2}
                          fill={barFill}
                        />
                        {/* Value label */}
                        <text
                          x={
                            isRtl
                              ? barX - 30 - 4
                              : barX + 30 + MINI_BAR_WIDTH + 4
                          }
                          y={barY + MINI_BAR_HEIGHT - 1}
                          fill={isPos ? '#22C55E' : '#EF4444'}
                          fontSize="7"
                          fontWeight="bold"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {isPos ? '+' : ''}{val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Expand/collapse indicator */}
                  {hasChildren && (
                    <g>
                      <circle
                        cx={isRtl ? ln.x + 14 : ln.x + ln.width - 14}
                        cy={ln.y + ln.height - 12}
                        r={6}
                        fill="var(--bg5, rgba(255,255,255,0.08))"
                        stroke="var(--text3, #94A3B8)"
                        strokeWidth={0.8}
                      />
                      <text
                        x={isRtl ? ln.x + 14 : ln.x + ln.width - 14}
                        y={ln.y + ln.height - 9}
                        textAnchor="middle"
                        fill="var(--text3, #94A3B8)"
                        fontSize="9"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {isExpanded ? '−' : '+'}
                      </text>
                    </g>
                  )}

                  {/* Leaf indicator */}
                  {isLeaf && (
                    <circle
                      cx={isRtl ? ln.x + 14 : ln.x + ln.width - 14}
                      cy={ln.y + ln.height - 12}
                      r={4}
                      fill="none"
                      stroke="#d4af37"
                      strokeWidth={1}
                    />
                  )}

                  {/* RAG Validation indicator dot */}
                  {node.ragValidation && (
                    <circle
                      cx={isRtl ? ln.x + 28 : ln.x + ln.width - 28}
                      cy={ln.y + ln.height - 12}
                      r={4}
                      fill={
                        node.ragValidation.similarityScore >= 0.7
                          ? '#22C55E'
                          : node.ragValidation.similarityScore >= 0.5
                            ? '#EAB308'
                            : '#EF4444'
                      }
                      opacity={0.8}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* RAG Validation & Path Summary Panel */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RAG Validation Panel */}
        {layoutNodes.length > 0 && (
          <div
            className="rounded-lg border p-4 max-h-72 overflow-y-auto"
            style={{
              background: 'var(--bg4)',
              borderColor: 'var(--rim)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--rim) transparent',
            }}
          >
            <h4
              className="text-xs font-semibold mb-3"
              style={{ color: 'var(--text3)' }}
            >
              {t('ragValidation', locale)}
            </h4>
            <div className="space-y-2">
              {layoutNodes
                .filter((ln) => ln.node.ragValidation)
                .map((ln) => {
                  const rag = ln.node.ragValidation!;
                  const title = getLocalizedTitle(ln.node, locale);
                  return (
                    <div
                      key={ln.node.id}
                      className="rounded-md border p-2.5 text-xs"
                      style={{
                        background: 'var(--bg3)',
                        borderColor: 'var(--rim)',
                      }}
                    >
                      <div
                        className="font-semibold mb-1"
                        style={{ color: 'var(--text)' }}
                      >
                        {truncate(title, 30)}
                      </div>
                      <div style={{ color: 'var(--text3)' }}>
                        <span style={{ color: 'var(--text2)' }}>
                          {t('historicalPrecedent', locale)}:
                        </span>{' '}
                        {rag.historicalPrecedent}
                      </div>
                      <div className="flex items-center gap-3 mt-1" style={{ color: 'var(--text3)' }}>
                        <span>
                          {t('similarity', locale)}:{' '}
                          <strong
                            style={{
                              color:
                                rag.similarityScore >= 0.7
                                  ? '#22C55E'
                                  : rag.similarityScore >= 0.5
                                    ? '#EAB308'
                                    : '#EF4444',
                            }}
                          >
                            {(rag.similarityScore * 100).toFixed(0)}%
                          </strong>
                        </span>
                        <span>
                          {t('source', locale)}: {rag.source}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Path Summary Panel */}
        {selectedLeafPath && (
          <div
            className="rounded-lg border p-4"
            style={{
              background: 'var(--bg4)',
              borderColor: '#d4af37',
            }}
          >
            <h4
              className="text-xs font-semibold mb-3"
              style={{ color: '#d4af37' }}
            >
              {t('pathSummary', locale)}
            </h4>
            <div className="space-y-2">
              {/* Path chain */}
              <div
                className="text-xs mb-3"
                style={{ color: 'var(--text3)' }}
              >
                {t('pathChain', locale)}:
              </div>
              <div className="flex flex-wrap items-center gap-1 mb-3">
                {selectedLeafPath.map((node, i) => {
                  const isImpact = impactPathIds.has(node.id);
                  const isProbable = probablePathIds.has(node.id);
                  return (
                    <span key={node.id} className="flex items-center gap-1">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: isImpact
                            ? 'rgba(239,68,68,0.15)'
                            : isProbable
                              ? 'rgba(34,197,94,0.15)'
                              : 'var(--bg5)',
                          color: isImpact
                            ? '#EF4444'
                            : isProbable
                              ? '#22C55E'
                              : 'var(--text2)',
                          border: `1px solid ${isImpact ? 'rgba(239,68,68,0.3)' : isProbable ? 'rgba(34,197,94,0.3)' : 'var(--rim)'}`,
                        }}
                      >
                        {truncate(getLocalizedTitle(node, locale), 18)}
                      </span>
                      {i < selectedLeafPath.length - 1 && (
                        <span style={{ color: 'var(--text3)' }}>→</span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Cumulative stats */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-md border p-2.5"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <div className="text-[10px] mb-0.5" style={{ color: '#EF5350' }}>
                    {t('totalImpact', locale)}
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#EF5350' }}>
                    {selectedLeafPath.reduce((sum, n) => sum + n.impactScore, 0)}
                  </div>
                </div>
                <div
                  className="rounded-md border p-2.5"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    borderColor: 'rgba(34,197,94,0.2)',
                  }}
                >
                  <div className="text-[10px] mb-0.5" style={{ color: '#22C55E' }}>
                    {t('totalProbability', locale)}
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#22C55E' }}>
                    {(
                      selectedLeafPath[selectedLeafPath.length - 1]
                        .absoluteProbability * 100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              {/* Market impact summary */}
              <div className="mt-3">
                <div
                  className="text-[10px] font-medium mb-1.5"
                  style={{ color: 'var(--text3)' }}
                >
                  {t('marketImpact', locale)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ASSET_KEYS.map((asset) => {
                    const totalImpact = selectedLeafPath.reduce(
                      (sum, n) => sum + n.marketImpacts[asset],
                      0
                    );
                    const isPos = totalImpact > 0;
                    return (
                      <div
                        key={asset}
                        className="flex items-center justify-between rounded-md border px-2 py-1.5"
                        style={{
                          background: 'var(--bg3)',
                          borderColor: 'var(--rim)',
                        }}
                      >
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                          {ASSET_LABELS[asset]?.[locale] ?? asset}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: isPos ? '#22C55E' : '#EF4444' }}
                        >
                          {isPos ? '+' : ''}
                          {totalImpact}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RAG validation for leaf */}
              {selectedLeafPath[selectedLeafPath.length - 1].ragValidation && (
                <div className="mt-3">
                  <div
                    className="text-[10px] font-medium mb-1.5"
                    style={{ color: 'var(--text3)' }}
                  >
                    {t('ragValidation', locale)}
                  </div>
                  {(() => {
                    const rag =
                      selectedLeafPath[selectedLeafPath.length - 1]
                        .ragValidation!;
                    return (
                      <div
                        className="rounded-md border p-2 text-xs"
                        style={{
                          background: 'var(--bg3)',
                          borderColor: 'var(--rim)',
                        }}
                      >
                        <div style={{ color: 'var(--text2)' }}>
                          {rag.historicalPrecedent}
                        </div>
                        <div
                          className="flex items-center gap-3 mt-1"
                          style={{ color: 'var(--text3)' }}
                        >
                          <span>
                            {t('similarity', locale)}:{' '}
                            <strong
                              style={{
                                color:
                                  rag.similarityScore >= 0.7
                                    ? '#22C55E'
                                    : rag.similarityScore >= 0.5
                                      ? '#EAB308'
                                      : '#EF4444',
                              }}
                            >
                              {(rag.similarityScore * 100).toFixed(0)}%
                            </strong>
                          </span>
                          <span>
                            {t('source', locale)}: {rag.source}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
