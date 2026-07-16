// ─── Metric Card Component ───────────────────────────────────────
// Shows a key metric with label, value, and optional trend

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function MetricCard({ label, value, trend, trendValue, className }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-300',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={`bg-[#11161C] border border-[#1F2933] rounded-lg p-4 ${className}`}>
      <div className="text-[13px] text-gray-300 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {trend && trendValue && (
        <div className={`text-xs font-medium ${trendColors[trend]} flex items-center gap-1`}>
          <span>{trendIcons[trend]}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
