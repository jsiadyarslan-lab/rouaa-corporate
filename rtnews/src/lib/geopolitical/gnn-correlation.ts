// ─── GNN Cross-border Correlation Analysis ────────────────────
// Rouaa Geopolitical Risk Platform
// Simplified Graph Neural Network approach for detecting systemic risks
// that country-level risk scores miss.
// Uses relational graph convolution to discover hidden correlations
// between countries via trade, alliances, and conflict networks.

export interface GraphNode {
  id: string;              // Country code
  riskScore: number;       // 0-100
  features: number[];      // Feature vector: [gpr, trade, conflict, gdp, stability]
  region: string;
  embeddings: number[];    // Learned node embeddings (output of GNN layers)
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;          // Edge weight (0-1)
  relationType: 'trade' | 'alliance' | 'conflict' | 'sanctions' | 'supply_chain';
}

export interface CorrelationResult {
  source: string;
  target: string;
  correlationScore: number;  // 0-1, how correlated their risks are
  hiddenRisk: number;        // 0-100, detected systemic risk
  relationType: string;
  explanationAr: string;
  explanationEn: string;
}

export interface GNNAnalysisResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  correlations: CorrelationResult[];
  systemicRiskScore: number;    // 0-100, overall systemic risk
  vulnerableClusters: CountryCluster[];
  hiddenRisks: HiddenRisk[];
}

export interface CountryCluster {
  id: string;
  countries: string[];
  clusterRisk: number;      // 0-100
  dominantRelation: string;
  labelAr: string;
  labelEn: string;
}

export interface HiddenRisk {
  type: 'contagion' | 'correlation_breakdown' | 'supply_chain_cascade' | 'alliance_shift';
  severity: number;          // 0-100
  affectedCountries: string[];
  descriptionAr: string;
  descriptionEn: string;
  probability: number;       // 0-1
}

// ─── International Relations Graph ────────────────────────────
const RELATIONS_GRAPH: GraphEdge[] = [
  // Trade relations (bidirectional, weighted by trade volume)
  { source: 'CN', target: 'US', weight: 0.85, relationType: 'trade' },
  { source: 'CN', target: 'JP', weight: 0.7, relationType: 'trade' },
  { source: 'CN', target: 'KR', weight: 0.65, relationType: 'trade' },
  { source: 'CN', target: 'AU', weight: 0.6, relationType: 'trade' },
  { source: 'CN', target: 'DE', weight: 0.55, relationType: 'trade' },
  { source: 'CN', target: 'SA', weight: 0.45, relationType: 'trade' },
  { source: 'CN', target: 'IN', weight: 0.5, relationType: 'trade' },
  { source: 'US', target: 'CA', weight: 0.75, relationType: 'trade' },
  { source: 'US', target: 'MX', weight: 0.7, relationType: 'trade' },
  { source: 'US', target: 'GB', weight: 0.55, relationType: 'trade' },
  { source: 'US', target: 'JP', weight: 0.6, relationType: 'trade' },
  { source: 'US', target: 'KR', weight: 0.5, relationType: 'trade' },
  { source: 'DE', target: 'FR', weight: 0.6, relationType: 'trade' },
  { source: 'DE', target: 'RU', weight: 0.45, relationType: 'trade' },
  { source: 'SA', target: 'JP', weight: 0.55, relationType: 'trade' },
  { source: 'SA', target: 'CN', weight: 0.45, relationType: 'trade' },
  { source: 'SA', target: 'IN', weight: 0.4, relationType: 'trade' },
  { source: 'RU', target: 'DE', weight: 0.45, relationType: 'trade' },
  { source: 'RU', target: 'CN', weight: 0.5, relationType: 'trade' },
  { source: 'RU', target: 'TR', weight: 0.35, relationType: 'trade' },
  { source: 'IR', target: 'CN', weight: 0.3, relationType: 'trade' },
  { source: 'IR', target: 'IN', weight: 0.25, relationType: 'trade' },
  { source: 'IR', target: 'TR', weight: 0.2, relationType: 'trade' },
  // Alliance relations
  { source: 'US', target: 'JP', weight: 0.8, relationType: 'alliance' },
  { source: 'US', target: 'KR', weight: 0.75, relationType: 'alliance' },
  { source: 'US', target: 'GB', weight: 0.85, relationType: 'alliance' },
  { source: 'US', target: 'IL', weight: 0.7, relationType: 'alliance' },
  { source: 'US', target: 'SA', weight: 0.5, relationType: 'alliance' },
  { source: 'US', target: 'TW', weight: 0.65, relationType: 'alliance' },
  { source: 'RU', target: 'CN', weight: 0.6, relationType: 'alliance' },
  { source: 'RU', target: 'IR', weight: 0.55, relationType: 'alliance' },
  { source: 'SA', target: 'AE', weight: 0.7, relationType: 'alliance' },
  { source: 'SA', target: 'EG', weight: 0.4, relationType: 'alliance' },
  // Conflict relations
  { source: 'RU', target: 'UA', weight: 0.95, relationType: 'conflict' },
  { source: 'IL', target: 'IR', weight: 0.85, relationType: 'conflict' },
  { source: 'IL', target: 'SY', weight: 0.7, relationType: 'conflict' },
  { source: 'SA', target: 'YE', weight: 0.6, relationType: 'conflict' },
  { source: 'IR', target: 'IQ', weight: 0.5, relationType: 'conflict' },
  { source: 'CN', target: 'TW', weight: 0.8, relationType: 'conflict' },
  { source: 'CN', target: 'IN', weight: 0.45, relationType: 'conflict' },
  // Supply chain dependencies
  { source: 'TW', target: 'CN', weight: 0.9, relationType: 'supply_chain' },
  { source: 'TW', target: 'US', weight: 0.7, relationType: 'supply_chain' },
  { source: 'KR', target: 'JP', weight: 0.5, relationType: 'supply_chain' },
  { source: 'CN', target: 'DE', weight: 0.6, relationType: 'supply_chain' },
  { source: 'RU', target: 'DE', weight: 0.55, relationType: 'supply_chain' },
  { source: 'RU', target: 'HU', weight: 0.5, relationType: 'supply_chain' },
  // Sanctions
  { source: 'US', target: 'IR', weight: 0.9, relationType: 'sanctions' },
  { source: 'US', target: 'RU', weight: 0.8, relationType: 'sanctions' },
  { source: 'US', target: 'KP', weight: 0.7, relationType: 'sanctions' },
  { source: 'US', target: 'VE', weight: 0.6, relationType: 'sanctions' },
];

// ─── Country Features (simplified) ───────────────────────────
// [gpr_score, trade_openness, conflict_level, gdp_rank, stability_index]
const COUNTRY_FEATURES: Record<string, { features: number[]; region: string; riskScore: number }> = {
  US: { features: [30, 0.8, 0.2, 0.95, 0.85], region: 'North America', riskScore: 28 },
  CN: { features: [55, 0.75, 0.45, 0.9, 0.6], region: 'East Asia', riskScore: 52 },
  RU: { features: [78, 0.45, 0.85, 0.65, 0.3], region: 'Eastern Europe', riskScore: 82 },
  UA: { features: [85, 0.35, 0.95, 0.45, 0.15], region: 'Eastern Europe', riskScore: 88 },
  IR: { features: [72, 0.3, 0.7, 0.5, 0.25], region: 'Middle East', riskScore: 75 },
  IL: { features: [65, 0.55, 0.65, 0.7, 0.5], region: 'Middle East', riskScore: 68 },
  SA: { features: [45, 0.6, 0.35, 0.6, 0.55], region: 'Middle East', riskScore: 42 },
  IQ: { features: [70, 0.25, 0.75, 0.35, 0.2], region: 'Middle East', riskScore: 72 },
  SY: { features: [90, 0.1, 0.95, 0.15, 0.05], region: 'Middle East', riskScore: 92 },
  YE: { features: [80, 0.1, 0.9, 0.1, 0.05], region: 'Middle East', riskScore: 85 },
  TW: { features: [50, 0.8, 0.4, 0.75, 0.7], region: 'East Asia', riskScore: 55 },
  JP: { features: [30, 0.7, 0.1, 0.85, 0.85], region: 'East Asia', riskScore: 25 },
  KR: { features: [45, 0.75, 0.35, 0.8, 0.7], region: 'East Asia', riskScore: 42 },
  DE: { features: [35, 0.8, 0.15, 0.9, 0.8], region: 'Europe', riskScore: 30 },
  FR: { features: [35, 0.7, 0.15, 0.85, 0.75], region: 'Europe', riskScore: 32 },
  GB: { features: [30, 0.75, 0.15, 0.85, 0.8], region: 'Europe', riskScore: 28 },
  IN: { features: [50, 0.5, 0.35, 0.65, 0.55], region: 'South Asia', riskScore: 48 },
  TR: { features: [55, 0.55, 0.4, 0.6, 0.45], region: 'Middle East', riskScore: 55 },
  AU: { features: [20, 0.65, 0.1, 0.85, 0.85], region: 'Oceania', riskScore: 18 },
  AE: { features: [40, 0.75, 0.25, 0.7, 0.65], region: 'Middle East', riskScore: 38 },
  EG: { features: [55, 0.4, 0.35, 0.4, 0.4], region: 'Africa', riskScore: 52 },
  KP: { features: [75, 0.05, 0.6, 0.1, 0.1], region: 'East Asia', riskScore: 80 },
  VE: { features: [65, 0.2, 0.5, 0.25, 0.15], region: 'South America', riskScore: 68 },
};

/**
 * Build the graph from relations data and country features.
 */
function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = Object.entries(COUNTRY_FEATURES).map(([id, data]) => ({
    id,
    riskScore: data.riskScore,
    features: data.features,
    region: data.region,
    embeddings: [], // Will be computed by GNN forward pass
  }));

  const edges = [...RELATIONS_GRAPH];

  return { nodes, edges };
}

/**
 * Simplified Relational Graph Convolution (R-GCN) forward pass.
 *
 * In a full implementation, this would use learned weight matrices.
 * Here we use a simplified version that:
 * 1. Aggregates neighbor features weighted by edge type and weight
 * 2. Applies a non-linear transformation
 * 3. Produces node embeddings that capture cross-border correlations
 *
 * @param nodes - Graph nodes with features
 * @param edges - Graph edges with weights and relation types
 * @param numLayers - Number of GNN layers (default: 2)
 * @returns Updated nodes with computed embeddings
 */
function rgcnForwardPass(
  nodes: GraphNode[],
  edges: GraphEdge[],
  numLayers: number = 2
): GraphNode[] {
  // Build adjacency structure
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inEdges = new Map<string, GraphEdge[]>();
  for (const edge of edges) {
    const existing = inEdges.get(edge.target) || [];
    existing.push(edge);
    inEdges.set(edge.target, existing);
  }

  // Relation type weights (simulated learned weights)
  const relationWeights: Record<string, number> = {
    trade: 0.3,
    alliance: 0.25,
    conflict: 0.35,
    sanctions: 0.2,
    supply_chain: 0.3,
  };

  let currentEmbeddings = new Map<string, number[]>(
    nodes.map(n => [n.id, [...n.features]])
  );

  // Multi-layer message passing
  for (let layer = 0; layer < numLayers; layer++) {
    const newEmbeddings = new Map<string, number[]>();

    for (const node of nodes) {
      const neighborEdges = inEdges.get(node.id) || [];
      const currentEmb = currentEmbeddings.get(node.id) || node.features;

      if (neighborEdges.length === 0) {
        newEmbeddings.set(node.id, currentEmb);
        continue;
      }

      // Aggregate messages from neighbors
      const aggregated = new Array(currentEmb.length).fill(0);
      let totalWeight = 0;

      for (const edge of neighborEdges) {
        const neighborEmb = currentEmbeddings.get(edge.source);
        if (!neighborEmb) continue;

        const relWeight = relationWeights[edge.relationType] || 0.25;
        const edgeWeight = edge.weight * relWeight;
        totalWeight += edgeWeight;

        for (let i = 0; i < aggregated.length; i++) {
          aggregated[i] += neighborEmb[i] * edgeWeight;
        }
      }

      // Normalize and combine with self
      const selfWeight = 0.5; // Self-connection weight
      const neighborWeight = totalWeight > 0 ? 0.5 / totalWeight : 0;

      const combined = currentEmb.map((v, i) => {
        const neighborVal = totalWeight > 0 ? aggregated[i] * neighborWeight : 0;
        return selfWeight * v + neighborVal;
      });

      // ReLU activation
      const activated = combined.map(v => Math.max(0, v));

      newEmbeddings.set(node.id, activated);
    }

    currentEmbeddings = newEmbeddings;
  }

  // Update nodes with computed embeddings
  return nodes.map(node => ({
    ...node,
    embeddings: currentEmbeddings.get(node.id) || node.features,
  }));
}

/**
 * Detect cross-border correlations from the GNN embeddings.
 * Countries with similar embeddings but different risk scores
 * may indicate hidden correlations.
 */
function detectCorrelations(nodes: GraphNode[], edges: GraphEdge[]): CorrelationResult[] {
  const correlations: CorrelationResult[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) continue;
    if (!sourceNode.embeddings.length || !targetNode.embeddings.length) continue;

    // Compute embedding similarity (cosine similarity)
    const similarity = cosineSimilarity(sourceNode.embeddings, targetNode.embeddings);

    // Hidden risk: high similarity but risk score gap suggests
    // the lower-scored country may be underestimating risk
    const riskGap = Math.abs(sourceNode.riskScore - targetNode.riskScore);
    const hiddenRisk = similarity > 0.7 && riskGap > 15
      ? Math.min(100, similarity * 60 + riskGap * 0.5)
      : similarity * 30 + edge.weight * 20;

    const relationLabels: Record<string, { ar: string; en: string }> = {
      trade: { ar: 'تجارة', en: 'Trade' },
      alliance: { ar: 'تحالف', en: 'Alliance' },
      conflict: { ar: 'صراع', en: 'Conflict' },
      sanctions: { ar: 'عقوبات', en: 'Sanctions' },
      supply_chain: { ar: 'سلسلة توريد', en: 'Supply Chain' },
    };

    const relLabel = relationLabels[edge.relationType] || { ar: edge.relationType, en: edge.relationType };

    correlations.push({
      source: edge.source,
      target: edge.target,
      correlationScore: Math.round(similarity * 100) / 100,
      hiddenRisk: Math.round(hiddenRisk),
      relationType: edge.relationType,
      explanationAr: `ارتباط ${relLabel.ar} بين ${edge.source} و${edge.target} (قوة: ${Math.round(similarity * 100)}%)`,
      explanationEn: `${relLabel.en} correlation between ${edge.source} and ${edge.target} (strength: ${Math.round(similarity * 100)}%)`,
    });
  }

  return correlations.sort((a, b) => b.hiddenRisk - a.hiddenRisk);
}

/**
 * Detect clusters of highly interconnected countries.
 */
function detectClusters(nodes: GraphNode[], edges: GraphEdge[]): CountryCluster[] {
  // Simplified community detection using connected components
  // and relation-type density
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  // Pre-defined clusters based on known geopolitical groupings
  const clusters: CountryCluster[] = [
    {
      id: 'gulf',
      countries: ['SA', 'AE', 'IQ', 'KW', 'QA', 'BH', 'OM'],
      clusterRisk: 0,
      dominantRelation: 'trade',
      labelAr: 'دول الخليج العربي',
      labelEn: 'Gulf States',
    },
    {
      id: 'east_asia_tech',
      countries: ['CN', 'TW', 'JP', 'KR'],
      clusterRisk: 0,
      dominantRelation: 'supply_chain',
      labelAr: 'سلسلة التكنولوجيا الآسيوية',
      labelEn: 'Asian Tech Supply Chain',
    },
    {
      id: 'nato',
      countries: ['US', 'GB', 'DE', 'FR', 'TR'],
      clusterRisk: 0,
      dominantRelation: 'alliance',
      labelAr: 'حلف الناتو',
      labelEn: 'NATO Alliance',
    },
    {
      id: 'russia_sphere',
      countries: ['RU', 'UA', 'BY', 'SY', 'IR'],
      clusterRisk: 0,
      dominantRelation: 'conflict',
      labelAr: 'النفوذ الروسي',
      labelEn: 'Russian Sphere',
    },
  ];

  // Calculate cluster risk
  for (const cluster of clusters) {
    let totalRisk = 0;
    let count = 0;
    for (const code of cluster.countries) {
      const node = nodes.find(n => n.id === code);
      if (node) {
        totalRisk += node.riskScore;
        count++;
      }
    }
    cluster.clusterRisk = count > 0 ? Math.round(totalRisk / count) : 0;
  }

  return clusters.sort((a, b) => b.clusterRisk - a.clusterRisk);
}

/**
 * Detect hidden systemic risks that country-level scores miss.
 */
function detectHiddenRisks(
  nodes: GraphNode[],
  correlations: CorrelationResult[],
  clusters: CountryCluster[]
): HiddenRisk[] {
  const risks: HiddenRisk[] = [];

  // 1. Contagion risk: high-risk country with many connections
  const highRiskNodes = nodes.filter(n => n.riskScore > 70);
  for (const node of highRiskNodes) {
    const connectedCorrelations = correlations.filter(
      c => c.source === node.id || c.target === node.id
    );
    const avgCorrelation = connectedCorrelations.length > 0
      ? connectedCorrelations.reduce((s, c) => s + c.correlationScore, 0) / connectedCorrelations.length
      : 0;

    if (avgCorrelation > 0.5 && connectedCorrelations.length > 3) {
      risks.push({
        type: 'contagion',
        severity: Math.round(node.riskScore * avgCorrelation),
        affectedCountries: connectedCorrelations.map(c =>
          c.source === node.id ? c.target : c.source
        ).slice(0, 5),
        descriptionAr: `${node.id} يشكل خطر عدوى عالي (مخاطرة: ${node.riskScore}, ارتباط: ${Math.round(avgCorrelation * 100)}%)`,
        descriptionEn: `${node.id} poses high contagion risk (risk: ${node.riskScore}, correlation: ${Math.round(avgCorrelation * 100)}%)`,
        probability: avgCorrelation * 0.6,
      });
    }
  }

  // 2. Correlation breakdown: cluster with diverse risk levels
  for (const cluster of clusters) {
    const clusterNodes = cluster.countries
      .map(c => nodes.find(n => n.id === c))
      .filter((n): n is GraphNode => n !== undefined);

    if (clusterNodes.length < 2) continue;

    const riskRange = Math.max(...clusterNodes.map(n => n.riskScore)) -
                      Math.min(...clusterNodes.map(n => n.riskScore));

    if (riskRange > 40 && cluster.clusterRisk > 50) {
      risks.push({
        type: 'correlation_breakdown',
        severity: Math.round(riskRange * 0.8),
        affectedCountries: cluster.countries,
        descriptionAr: `${cluster.labelAr}: انهيار الارتباط (تباين المخاطر: ${riskRange})`,
        descriptionEn: `${cluster.labelEn}: correlation breakdown (risk range: ${riskRange})`,
        probability: 0.3 + (riskRange / 100) * 0.4,
      });
    }
  }

  // 3. Supply chain cascade
  const supplyChainEdges = correlations.filter(c => c.relationType === 'supply_chain' && c.hiddenRisk > 50);
  if (supplyChainEdges.length > 0) {
    const affectedCountries = new Set<string>();
    for (const edge of supplyChainEdges) {
      affectedCountries.add(edge.source);
      affectedCountries.add(edge.target);
    }

    risks.push({
      type: 'supply_chain_cascade',
      severity: Math.round(supplyChainEdges.reduce((s, e) => s + e.hiddenRisk, 0) / supplyChainEdges.length),
      affectedCountries: Array.from(affectedCountries),
      descriptionAr: `خطر تتالي سلسلة التوريد عبر ${affectedCountries.size} دول`,
      descriptionEn: `Supply chain cascade risk across ${affectedCountries.size} countries`,
      probability: 0.25 + (supplyChainEdges.length * 0.1),
    });
  }

  return risks.sort((a, b) => b.severity - a.severity).slice(0, 10);
}

/**
 * Run the full GNN cross-border correlation analysis.
 *
 * @returns Complete analysis with embeddings, correlations, and hidden risks
 */
export function runGNNAnalysis(): GNNAnalysisResult {
  const { nodes: rawNodes, edges } = buildGraph();

  // Run R-GCN forward pass
  const nodes = rgcnForwardPass(rawNodes, edges, 2);

  // Detect correlations
  const correlations = detectCorrelations(nodes, edges);

  // Detect clusters
  const clusters = detectClusters(nodes, edges);

  // Detect hidden risks
  const hiddenRisks = detectHiddenRisks(nodes, correlations, clusters);

  // Systemic risk score: weighted combination
  const maxClusterRisk = Math.max(...clusters.map(c => c.clusterRisk), 0);
  const avgHiddenRisk = hiddenRisks.length > 0
    ? hiddenRisks.reduce((s, r) => s + r.severity, 0) / hiddenRisks.length
    : 0;
  const systemicRiskScore = Math.round(0.4 * maxClusterRisk + 0.4 * avgHiddenRisk + 0.2 * correlations.slice(0, 10).reduce((s, c) => s + c.hiddenRisk, 0) / 10);

  return {
    nodes,
    edges,
    correlations: correlations.slice(0, 20),
    systemicRiskScore: Math.max(0, Math.min(100, systemicRiskScore)),
    vulnerableClusters: clusters,
    hiddenRisks,
  };
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Get the international relations graph for visualization.
 */
export function getRelationsGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return buildGraph();
}
