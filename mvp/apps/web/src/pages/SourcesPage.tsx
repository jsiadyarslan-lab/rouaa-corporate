import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type SourceType } from '../api';

const TYPE_OPTIONS: Array<{ value: ''; label: string } | { value: SourceType; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'central_bank', label: 'Central Bank' },
  { value: 'regulator', label: 'Regulator' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'government', label: 'Government' },
  { value: 'international_org', label: 'International Org' },
  { value: 'company', label: 'Company' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'candidate', label: 'Candidate' },
  { value: 'deprecated', label: 'Deprecated' },
];

export function SourcesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['sources', 'list', { search, type, status, page }],
    queryFn: () =>
      api.sources.list({
        search: search || undefined,
        type: (type || undefined) as SourceType | undefined,
        status: status || undefined,
        page,
        limit: 20,
        sort: 'name:asc',
      }),
  });

  return (
    <>
      <h1 className="page-title">Source Registry</h1>
      <p className="page-subtitle">
        Browse all official sources monitored by ROUAA. Click any source to inspect its configuration,
        ingestion pattern, and live health record.
      </p>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, code, or description…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading && <div className="loading">Loading sources…</div>}
      {query.isError && (
        <div className="error">
          Failed to load sources: {(query.error as Error).message}
          <br />
          <br />
          Is the backend running on http://localhost:4000? Run <code>pnpm dev:backend</code> in another terminal.
        </div>
      )}

      {query.data && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Country</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No sources match the current filters.
                    </td>
                  </tr>
                )}
                {query.data.data.map((source) => (
                  <tr key={source.id}>
                    <td>
                      <span className="code-badge">{source.code}</span>
                    </td>
                    <td>
                      <Link to={`/sources/${source.id}`} className="row-link">
                        {source.name}
                      </Link>
                      {source.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {source.description.length > 80
                            ? `${source.description.slice(0, 80)}…`
                            : source.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`type-badge ${source.type}`}>
                        {source.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{source.country}</td>
                    <td>
                      <span className="tier-badge">T{source.trustTier}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${source.status}`}>{source.status}</span>
                    </td>
                    <td>
                      {source.health ? (
                        <span
                          className={`status-pill ${source.health.status}`}
                          style={{
                            background:
                              source.health.status === 'healthy'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : source.health.status === 'degraded'
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : source.health.status === 'failing'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(107, 118, 137, 0.1)',
                            color:
                              source.health.status === 'healthy'
                                ? 'var(--green)'
                                : source.health.status === 'degraded'
                                  ? 'var(--amber)'
                                  : source.health.status === 'failing'
                                    ? 'var(--red)'
                                    : 'var(--text-muted)',
                          }}
                        >
                          {source.health.status}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>
              Showing {(query.data.page - 1) * query.data.limit + 1}–
              {Math.min(query.data.page * query.data.limit, query.data.total)} of {query.data.total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={query.data.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: query.data.page <= 1 ? 'var(--text-muted)' : 'var(--text)',
                  cursor: query.data.page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              <span style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>
                Page {query.data.page} of {query.data.totalPages}
              </span>
              <button
                disabled={query.data.page >= query.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: query.data.page >= query.data.totalPages ? 'var(--text-muted)' : 'var(--text)',
                  cursor: query.data.page >= query.data.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
