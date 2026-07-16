// ─── Section Preview Card v2 ─────────────────────────────────────────
// Compact Bloomberg/TradingView-style card for homepage grid
// Links to a dedicated rich page. Designed for 4-column grid.

import Link from 'next/link';

export interface SectionPreviewProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  linkText: string;
  gradient?: string;
  accentColor?: string;
  stats?: { label: string; value: string }[];
}

export default function SectionPreviewCard({
  icon,
  title,
  description,
  href,
  linkText,
  gradient = 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(139,92,246,0.03) 100%)',
  accentColor = 'var(--cyan)',
  stats,
}: SectionPreviewProps) {
  return (
    <Link href={href} className="group block">
      <div
        className="relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: gradient,
          borderColor: 'var(--rim)',
          padding: 'var(--space-sm)',
        }}
      >
        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${accentColor}08, transparent 70%)`,
          }}
        />

        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
        />

        {/* Icon + Title */}
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm"
            style={{ background: `${accentColor}15` }}
          >
            {icon}
          </div>
          <h3
            className="text-[13px] font-bold transition-colors duration-200"
            style={{ color: 'var(--text-head)' }}
          >
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-[11px] line-clamp-2 mb-2 leading-relaxed" style={{ color: 'var(--text2)' }}>
          {description}
        </p>

        {/* Stats + CTA */}
        <div className="flex items-center justify-between">
          {stats && (
            <div className="flex items-center gap-2">
              {stats.map((stat, i) => (
                <span key={i} className="text-[10px]" style={{ color: 'var(--text3)' }}>
                  <span className="font-semibold" style={{ color: accentColor }}>
                    {stat.value}
                  </span>{' '}
                  {stat.label}
                </span>
              ))}
            </div>
          )}
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-md transition-all duration-200 group-hover:translate-x-[-2px]"
            style={{
              background: `${accentColor}12`,
              color: accentColor,
            }}
          >
            {linkText} ←
          </span>
        </div>
      </div>
    </Link>
  );
}
