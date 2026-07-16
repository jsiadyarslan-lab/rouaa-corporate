'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { select } from 'd3-selection';
import type { SankeyLayout, SankeyNodeMinimal, SankeyLinkMinimal } from 'd3-sankey';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Info } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SankeyNode {
  id: string;
  name: string;
  color?: string;
  category?: 'origin' | 'route' | 'destination';
  value?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  status?: 'normal' | 'disrupted' | 'threatened';
}

export interface TradeSankeyProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  locale?: string;
  height?: number;
  className?: string;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  normal: '#22C55E',
  disrupted: '#EF5350',
  threatened: '#FF9800',
};

const CATEGORY_COLORS: Record<string, string> = {
  origin: '#3B82F6',
  route: '#F59E0B',
  destination: '#10B981',
};

const LABELS: Record<string, Record<string, string>> = {
  origin: { ar: 'منشأ', en: 'Origin', fr: 'Origine', tr: 'Menşei', es: 'Origen' },
  route: { ar: 'مسار', en: 'Route', fr: 'Route', tr: 'Rota', es: 'Ruta' },
  destination: { ar: 'وجهة', en: 'Destination', fr: 'Destination', tr: 'Varış', es: 'Destino' },
  disrupted: { ar: 'متضرر', en: 'Disrupted', fr: 'Perturbé', tr: 'Kesinti', es: 'Interrumpido' },
  threatened: { ar: 'مهدد', en: 'Threatened', fr: 'Menacé', tr: 'Tehdit', es: 'Amenazado' },
  normal: { ar: 'طبيعي', en: 'Normal', fr: 'Normal', tr: 'Normal', es: 'Normal' },
  tradeVolume: { ar: 'حجم التجارة (مليار $)', en: 'Trade Volume (B$)', fr: 'Volume commercial (Md$)', tr: 'Ticaret Hacmi (B$)', es: 'Volumen comercial (B$)' },
};

function getLabel(key: string, locale: string): string {
  return LABELS[key]?.[locale] || LABELS[key]?.['en'] || key;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TradeSankey({
  nodes,
  links,
  locale = 'ar',
  height = 500,
  className,
  onNodeClick,
  onLinkClick,
}: TradeSankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const isRTL = locale === 'ar';

  // Stable callbacks — prevent unnecessary D3 redraws
  const stableOnNodeClick = useCallback((node: SankeyNode) => { onNodeClick?.(node); }, [onNodeClick]);
  const stableOnLinkClick = useCallback((link: SankeyLink) => { onLinkClick?.(link); }, [onLinkClick]);

  // Observe container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Draw Sankey diagram
  const drawSankey = useCallback(() => {
    if (!svgRef.current || !nodes.length || !links.length) return;

    const svg = select(svgRef.current);
    // Use targeted removal instead of selectAll('*').remove() to reduce DOM churn
    svg.selectAll('.sankey-links, .sankey-nodes').remove();

    const margin = { top: 20, right: isRTL ? 30 : 80, bottom: 20, left: isRTL ? 80 : 30 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    if (innerWidth < 100 || innerHeight < 100) return;

    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sankey layout — cast to any to avoid d3-sankey generic type complexity
    const sankeyGenerator: any = (d3Sankey as any)()
      .nodeId((d: any) => d.id)
      .nodeWidth(20)
      .nodePadding(16)
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ]);

    // Create a deep copy to avoid mutating props
    const nodesCopy = nodes.map((n) => ({ ...n }));
    const linksCopy = links.map((l) => ({ ...l }));

    let sankeyData: any;
    try {
      sankeyData = sankeyGenerator({
        nodes: nodesCopy,
        links: linksCopy,
      });
    } catch {
      // Sankey layout can fail with circular links
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .text('Unable to render Sankey diagram');
      return;
    }

    // ─── Draw Links ──────────────────────────────────────────────
    const linkGroup = g.append('g').attr('class', 'sankey-links');

    linkGroup
      .selectAll('path')
      .data(sankeyData.links as any[])
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const status = (d as unknown as SankeyLink).status || 'normal';
        return STATUS_COLORS[status] || CATEGORY_COLORS.route;
      })
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => Math.max(1, d.width || 1))
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        select(this).attr('stroke-opacity', 0.7);
        const link = d as unknown as SankeyLink;
        const status = (link as any).status || 'normal';
        setTooltip({
          x: event.offsetX,
          y: event.offsetY,
          content: `${(d.source as unknown as SankeyNode).name} → ${(d.target as unknown as SankeyNode).name}: $${d.value}B [${getLabel(status, locale)}]`,
        });
      })
      .on('mouseleave', function () {
        select(this).attr('stroke-opacity', 0.4);
        setTooltip(null);
      })
      .on('click', function (_event, d) {
        const link = d as unknown as SankeyLink;
        stableOnLinkClick?.(link);
      });

    // ─── Draw Nodes ──────────────────────────────────────────────
    const nodeGroup = g.append('g').attr('class', 'sankey-nodes');

    const nodeRects = nodeGroup
      .selectAll('rect')
      .data(sankeyData.nodes as any[])
      .join('rect')
      .attr('x', (d) => d.x0 || 0)
      .attr('y', (d) => d.y0 || 0)
      .attr('width', (d) => Math.max(1, (d.x1 || 0) - (d.x0 || 0)))
      .attr('height', (d) => Math.max(1, (d.y1 || 0) - (d.y0 || 0)))
      .attr('fill', (d) => {
        const node = d as unknown as SankeyNode;
        if ((node as any).color) return (node as any).color;
        return CATEGORY_COLORS[(node as any).category || 'route'] || '#6B7280';
      })
      .attr('rx', 3)
      .attr('stroke', '#1E293B')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        select(this).attr('stroke', '#F59E0B').attr('stroke-width', 2);
        setHoveredNode(d.id as string);
      })
      .on('mouseleave', function () {
        select(this).attr('stroke', '#1E293B').attr('stroke-width', 1);
        setHoveredNode(null);
        setTooltip(null);
      })
      .on('click', function (_event, d) {
        stableOnNodeClick?.(d as unknown as SankeyNode);
      });

    // ─── Node Labels ─────────────────────────────────────────────
    nodeGroup
      .selectAll('text')
      .data(sankeyData.nodes as any[])
      .join('text')
      .attr('x', (d) => {
        if (isRTL) {
          return (d.x0 || 0) - 6;
        }
        return (d.x1 || 0) + 6;
      })
      .attr('y', (d) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', isRTL ? 'end' : 'start')
      .attr('fill', '#E2E8F0')
      .attr('font-size', '12px')
      .attr('font-family', isRTL ? 'Noto Sans SC, sans-serif' : 'Inter, sans-serif')
      .attr('direction', isRTL ? 'rtl' : 'ltr')
      .text((d) => {
        const name = (d as unknown as SankeyNode).name;
        return name.length > 18 ? name.slice(0, 16) + '...' : name;
      });

    // ─── Value Labels ────────────────────────────────────────────
    nodeGroup
      .selectAll('.value-label')
      .data(sankeyData.nodes as any[])
      .join('text')
      .attr('class', 'value-label')
      .attr('x', (d) => {
        if (isRTL) {
          return (d.x1 || 0) + 6;
        }
        return (d.x0 || 0) - 6;
      })
      .attr('y', (d) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', isRTL ? 'start' : 'end')
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .text((d) => `$${d.value || 0}B`);

  }, [nodes, links, dimensions, isRTL, locale, stableOnLinkClick, stableOnNodeClick]);

  useEffect(() => {
    drawSankey();
  }, [drawSankey]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full rounded-xl border border-[#2A313C] bg-[#151A22]', className)}
      style={{ minHeight: height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A313C]">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-[#E2E8F0]">
            {isRTL ? 'تدفق التجارة العالمية' : 'Global Trade Flow'}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {getLabel('normal', locale)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {getLabel('threatened', locale)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {getLabel('disrupted', locale)}
          </span>
        </div>
      </div>

      {/* SVG */}
      <div className="px-2 py-2">
        <svg ref={svgRef} className="w-full" />
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
            {isRTL ? 'لا توجد بيانات تجارية للعرض' : 'No trade data to display'}
          </p>
        </div>
      )}
    </div>
  );
}
