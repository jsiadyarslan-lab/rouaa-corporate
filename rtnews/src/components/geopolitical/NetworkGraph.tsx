// @ts-nocheck
'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import type { ZoomBehavior } from 'd3-zoom';
import { cn } from '@/lib/utils';
import { Network, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { t } from '@/lib/geopolitical/i18n';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NetworkNode {
  id: string;
  name: string;
  type: 'country' | 'alliance' | 'conflict';
  riskScore?: number;
  group?: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: 'alliance' | 'conflict' | 'trade' | 'sanctions';
  strength: number; // 0-1
}

export interface NetworkGraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  locale?: string;
  height?: number;
  className?: string;
  onNodeClick?: (node: NetworkNode) => void;
  onLinkClick?: (link: NetworkLink) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LINK_COLORS: Record<string, string> = {
  alliance: '#3B82F6',   // Blue
  conflict: '#EF4444',   // Red
  trade: '#22C55E',      // Green
  sanctions: '#F59E0B',  // Amber
};

const NODE_COLORS: Record<string, string> = {
  country: '#8B5CF6',    // Purple
  alliance: '#3B82F6',   // Blue
  conflict: '#EF4444',   // Red
};

const LINK_LABELS: Record<string, Record<string, string>> = {
  alliance: { ar: 'تحالف', en: 'Alliance', fr: 'Alliance', tr: 'İttifak', es: 'Alianza' },
  conflict: { ar: 'صراع', en: 'Conflict', fr: 'Conflit', tr: 'Çatışma', es: 'Conflicto' },
  trade: { ar: 'تجارة', en: 'Trade', fr: 'Commerce', tr: 'Ticaret', es: 'Comercio' },
  sanctions: { ar: 'عقوبات', en: 'Sanctions', fr: 'Sanctions', tr: 'Yaptırımlar', es: 'Sanciones' },
};

const RISK_COLORS: Record<string, string> = {
  low: '#22C55E',
  moderate: '#EAB308',
  elevated: '#F97316',
  high: '#EF4444',
  severe: '#7F1D1D',
};

function getRiskColorFromScore(score: number): string {
  if (score <= 20) return RISK_COLORS.low;
  if (score <= 40) return RISK_COLORS.moderate;
  if (score <= 60) return RISK_COLORS.elevated;
  if (score <= 80) return RISK_COLORS.high;
  return RISK_COLORS.severe;
}

function getLinkLabel(type: string, locale: string): string {
  return LINK_LABELS[type]?.[locale] || LINK_LABELS[type]?.['en'] || type;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NetworkGraph({
  nodes,
  links,
  locale = 'ar',
  height = 500,
  className,
  onNodeClick,
  onLinkClick,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const simulationRef = useRef<Simulation<NetworkNode & SimulationNodeDatum, NetworkLink & SimulationLinkDatum<NetworkNode & SimulationNodeDatum>> | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const isRTL = locale === 'ar';

  // Observe container resize — DEBOUNCED to prevent d3-force recreation
  // on every resize event (which can fire dozens of times per second)
  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Debounce: wait 150ms after last resize before updating dimensions
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setDimensions({
            width: entry.contentRect.width,
            height,
          });
        }, 150);
      }
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [height]);

  // Stable callbacks — prevent unnecessary D3 redraws
  const stableOnNodeClick = useCallback((node: NetworkNode) => { onNodeClick?.(node); }, [onNodeClick]);
  const stableOnLinkClick = useCallback((link: NetworkLink) => { onLinkClick?.(link); }, [onLinkClick]);

  // Draw network graph — only recreate when data changes, not on resize
  const drawNetwork = useCallback(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = select(svgRef.current);
    // Use targeted removal instead of selectAll('*').remove() to reduce DOM churn
    svg.selectAll('.network-links, .network-nodes').remove();

    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    if (innerWidth < 100 || innerHeight < 100) return;

    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ─── Zoom ────────────────────────────────────────────────────
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    // Center the transform initially
    svg.call(zoomBehavior.transform, zoomIdentity.translate(margin.left, margin.top));

    // ─── Create deep copies ──────────────────────────────────────
    const nodesCopy: (NetworkNode & SimulationNodeDatum)[] = nodes.map((n) => ({ ...n }));
    const linksCopy: (NetworkLink & SimulationLinkDatum<NetworkNode & SimulationNodeDatum>)[] = links.map((l) => ({
      ...l,
      source: l.source,
      target: l.target,
    }));

    // ─── Force Simulation ────────────────────────────────────────
    const simulation = forceSimulation<NetworkNode & SimulationNodeDatum>(nodesCopy)
      .force('link', forceLink<NetworkNode & SimulationNodeDatum, NetworkLink & SimulationLinkDatum<NetworkNode & SimulationNodeDatum>>(linksCopy as any)
        .id((d) => d.id)
        .distance(100)
        .strength((d) => (d as unknown as NetworkLink).strength || 0.3))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', forceCollide().radius(35));

    simulationRef.current = simulation;

    // ─── Draw Links ──────────────────────────────────────────────
    const linkGroup = g.append('g').attr('class', 'network-links');

    const linkElements = linkGroup
      .selectAll('line')
      .data(linksCopy)
      .join('line')
      .attr('stroke', (d) => LINK_COLORS[d.type] || '#475569')
      .attr('stroke-width', (d) => Math.max(1, (d.strength || 0.3) * 4))
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', (d) => d.type === 'conflict' ? '6,3' : d.type === 'sanctions' ? '4,4' : 'none')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        select(this).attr('stroke-opacity', 0.9).attr('stroke-width', Math.max(2, (d.strength || 0.3) * 6));
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          content: `${(d.source as unknown as NetworkNode).name} ↔ ${(d.target as unknown as NetworkNode).name} [${getLinkLabel(d.type, locale)}]`,
        });
      })
      .on('mouseleave', function (event, d) {
        select(this).attr('stroke-opacity', 0.5).attr('stroke-width', Math.max(1, (d.strength || 0.3) * 4));
        setTooltip(null);
      })
      .on('click', function (_event, d) {
        stableOnLinkClick?.(d as unknown as NetworkLink);
      });

    // ─── Draw Nodes ──────────────────────────────────────────────
    const nodeGroup = g.append('g').attr('class', 'network-nodes');

    const nodeElements = nodeGroup
      .selectAll('g')
      .data(nodesCopy)
      .join('g')
      .style('cursor', 'pointer')
      .call(drag<SVGGElement, NetworkNode & SimulationNodeDatum>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    nodeElements
      .append('circle')
      .attr('r', (d) => {
        const risk = d.riskScore || 50;
        return 12 + (risk / 100) * 16; // 12-28px based on risk
      })
      .attr('fill', (d) => {
        if (d.riskScore !== undefined) return getRiskColorFromScore(d.riskScore);
        return NODE_COLORS[d.type] || '#6B7280';
      })
      .attr('stroke', '#0B0E14')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .on('mouseenter', function (_event, d) {
        select(this)
          .attr('stroke', '#d4af37')
          .attr('stroke-width', 3)
          .attr('opacity', 1);
        setSelectedNode(d.id);
      })
      .on('mouseleave', function () {
        select(this)
          .attr('stroke', '#0B0E14')
          .attr('stroke-width', 2)
          .attr('opacity', 0.9);
        setSelectedNode(null);
        setTooltip(null);
      })
      .on('click', function (_event, d) {
        stableOnNodeClick?.(d as unknown as NetworkNode);
      });

    // Node labels
    nodeElements
      .append('text')
      .attr('dy', (d) => {
        const risk = d.riskScore || 50;
        return 12 + (risk / 100) * 16 + 14;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', '#E2E8F0')
      .attr('font-size', '10px')
      .attr('font-family', isRTL ? 'Noto Sans SC, sans-serif' : 'Inter, sans-serif')
      .attr('direction', isRTL ? 'rtl' : 'ltr')
      .text((d) => d.name.length > 14 ? d.name.slice(0, 12) + '...' : d.name);

    // Risk score labels inside circles
    nodeElements
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text((d) => d.riskScore !== undefined ? String(d.riskScore) : '');

    // ─── Simulation Tick ─────────────────────────────────────────
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => (d.source as unknown as NetworkNode & SimulationNodeDatum).x || 0)
        .attr('y1', (d) => (d.source as unknown as NetworkNode & SimulationNodeDatum).y || 0)
        .attr('x2', (d) => (d.target as unknown as NetworkNode & SimulationNodeDatum).x || 0)
        .attr('y2', (d) => (d.target as unknown as NetworkNode & SimulationNodeDatum).y || 0);

      nodeElements.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Run simulation with reduced initial alpha for faster convergence
    simulation.alpha(0.8).restart();

    // Cleanup
    return () => {
      simulation.stop();
    };
    // NOTE: dimensions is intentionally excluded from dependencies.
    // Changing dimensions only needs a center update, not a full recreation.
    // This prevents the entire d3-force simulation from being recreated on every resize.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, isRTL, locale, stableOnNodeClick, stableOnLinkClick]);

  // When dimensions change, re-center the simulation instead of recreating it
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.force('center', forceCenter(dimensions.width / 2, dimensions.height / 2));
    sim.alpha(0.3).restart();
  }, [dimensions]);

  useEffect(() => {
    const cleanup = drawNetwork();
    return () => {
      cleanup?.();
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [drawNetwork]);

  // Zoom controls — reuse existing zoom behavior to avoid conflicts
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    zoomRef.current.scaleBy(select(svgRef.current).transition(), 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    zoomRef.current.scaleBy(select(svgRef.current).transition(), 0.7);
  };

  const handleReset = () => {
    drawNetwork();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full rounded-xl border border-[#2A313C] bg-[#151A22]', className)}
      style={{ minHeight: height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A313C]">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-[#E2E8F0]">
            {t('network.title', locale)}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {getLinkLabel('alliance', locale)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {getLinkLabel('conflict', locale)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {getLinkLabel('trade', locale)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {getLinkLabel('sanctions', locale)}
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative px-2 py-2">
        <svg ref={svgRef} className="w-full" />

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#1E293B] border border-[#2A313C] text-[#94A3B8] hover:text-white hover:bg-[#2A313C] transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#1E293B] border border-[#2A313C] text-[#94A3B8] hover:text-white hover:bg-[#2A313C] transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-[#1E293B] border border-[#2A313C] text-[#94A3B8] hover:text-white hover:bg-[#2A313C] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 px-3 py-2 text-xs rounded-lg bg-[#1E293B] border border-[#2A313C] text-[#E2E8F0] shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Empty State */}
      {!nodes.length && (
        <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
          <Info className="w-8 h-8 mb-2" />
          <p className="text-sm">
            {t('network.noData', locale)}
          </p>
        </div>
      )}
    </div>
  );
}
