import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';

export function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['sources', 'stats'],
    queryFn: () => api.sources.stats(),
  });

  const healthQuery = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => api.health.readiness(),
    refetchInterval: 30_000,
  });

  if (statsQuery.isLoading) return <div className="loading">Loading registry statistics…</div>;
  if (statsQuery.isError)
    return (
      <div className="error">
        Failed to load stats: {(statsQuery.error as Error).message}
        <br />
        <br />
        Is the backend running on http://localhost:4000? Run <code>pnpm dev:backend</code> in another terminal.
      </div>
    );

  const stats = statsQuery.data!;

  return (
    <>
      <h1 className="page-title">Source Registry Dashboard</h1>
      <p className="page-subtitle">
        Live operational view of the ROUAA Source Registry — Layer 01 of the 7-Layer Intelligence Architecture.
        Monitor registry health, source distribution, and trust tier coverage.
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Sources</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Sources</div>
          <div className="value">{stats.byStatus.active ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Tier 1 Sources</div>
          <div className="value">{stats.byTrustTier.tier_1 ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Backend Status</div>
          <div
            className="value"
            style={{
              fontSize: '20px',
              color:
                healthQuery.data?.status === 'ok'
                  ? 'var(--green)'
                  : healthQuery.data?.status === 'degraded'
                    ? 'var(--amber)'
                    : 'var(--text-muted)',
            }}
          >
            {healthQuery.data?.status ?? 'checking…'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Distribution by Type</h2>
      <div className="stats-grid">
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="stat-card">
            <div className="label">
              <span className={`type-badge ${type}`}>{type.replace('_', ' ')}</span>
            </div>
            <div className="value">{count}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 32 }}>Top Countries</h2>
      <div className="stats-grid">
        {Object.entries(stats.byCountry)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([country, count]) => (
            <div key={country} className="stat-card">
              <div className="label">{country}</div>
              <div className="value">{count}</div>
            </div>
          ))}
      </div>

      <div style={{ marginTop: 48 }}>
        <Link to="/sources" className="back-link">
          → Browse all sources
        </Link>
      </div>
    </>
  );
}
