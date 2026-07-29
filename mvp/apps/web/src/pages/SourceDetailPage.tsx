import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['sources', 'detail', id],
    queryFn: () => api.sources.get(id!),
    enabled: !!id,
  });

  if (query.isLoading) return <div className="loading">Loading source…</div>;
  if (query.isError)
    return (
      <div className="error">
        Failed to load source: {(query.error as Error).message}
      </div>
    );

  const s = query.data!;

  return (
    <>
      <Link to="/sources" className="back-link">← Back to all sources</Link>

      <h1 className="page-title">{s.name}</h1>
      <p style={{ marginBottom: 8 }}>
        <span className="code-badge">{s.code}</span>{' '}
        <span className={`type-badge ${s.type}`}>{s.type.replace('_', ' ')}</span>{' '}
        <span className={`status-pill ${s.status}`}>{s.status}</span>{' '}
        <span className="tier-badge">Tier {s.trustTier}</span>
      </p>
      {s.description && (
        <p style={{ color: 'var(--text-secondary)', marginTop: 16, maxWidth: 720 }}>{s.description}</p>
      )}

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Identity</h3>
          <div className="detail-row">
            <span className="key">Code</span>
            <span className="val">{s.code}</span>
          </div>
          <div className="detail-row">
            <span className="key">Name</span>
            <span className="val">{s.name}</span>
          </div>
          <div className="detail-row">
            <span className="key">Type</span>
            <span className="val">{s.type.replace('_', ' ')}</span>
          </div>
          <div className="detail-row">
            <span className="key">Country</span>
            <span className="val">{s.country}</span>
          </div>
          <div className="detail-row">
            <span className="key">Jurisdiction</span>
            <span className="val">{s.jurisdiction}</span>
          </div>
          <div className="detail-row">
            <span className="key">Authority Level</span>
            <span className="val">{s.authorityLevel}</span>
          </div>
          <div className="detail-row">
            <span className="key">Trust Tier</span>
            <span className="val">{s.trustTier} (1 = highest)</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Ingestion Configuration</h3>
          <div className="detail-row">
            <span className="key">Pattern</span>
            <span className="val">{s.ingestionPattern.replace('_', ' ')}</span>
          </div>
          <div className="detail-row">
            <span className="key">Polling Interval</span>
            <span className="val">{s.pollingIntervalSec}s</span>
          </div>
          <div className="detail-row">
            <span className="key">Website</span>
            <span className="val">
              {s.websiteUrl ? (
                <a href={s.websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                  {new URL(s.websiteUrl).hostname}
                </a>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="detail-row">
            <span className="key">RSS / Feed</span>
            <span className="val">
              {s.feedUrl ? (
                <a href={s.feedUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                  Available
                </a>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="detail-row">
            <span className="key">API Endpoint</span>
            <span className="val">
              {s.apiUrl ? (
                <a href={s.apiUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                  Available
                </a>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="detail-row">
            <span className="key">Status</span>
            <span className="val">{s.status}</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Health (Live)</h3>
          {s.health ? (
            <>
              <div className="detail-row">
                <span className="key">Status</span>
                <span className="val">{s.health.status}</span>
              </div>
              <div className="detail-row">
                <span className="key">Reliability</span>
                <span className="val">{(s.health.reliabilityScore * 100).toFixed(1)}%</span>
              </div>
              <div className="detail-row">
                <span className="key">Successful Fetches</span>
                <span className="val">{s.health.totalSuccessfulFetches}</span>
              </div>
              <div className="detail-row">
                <span className="key">Failed Fetches</span>
                <span className="val">{s.health.totalFailedFetches}</span>
              </div>
              <div className="detail-row">
                <span className="key">Consecutive Failures</span>
                <span className="val">{s.health.consecutiveFailures}</span>
              </div>
              <div className="detail-row">
                <span className="key">Last Successful Fetch</span>
                <span className="val">
                  {s.health.lastSuccessfulFetchAt
                    ? new Date(s.health.lastSuccessfulFetchAt).toLocaleString()
                    : 'never'}
                </span>
              </div>
              <div className="detail-row">
                <span className="key">Last Attempt</span>
                <span className="val">
                  {s.health.lastFetchAttemptAt
                    ? new Date(s.health.lastFetchAttemptAt).toLocaleString()
                    : 'never'}
                </span>
              </div>
              {s.health.lastErrorMessage && (
                <div className="detail-row">
                  <span className="key">Last Error</span>
                  <span className="val" style={{ color: 'var(--red)' }}>
                    {s.health.lastErrorMessage}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No health record yet — source monitoring has not started.
            </p>
          )}
        </div>

        <div className="detail-card">
          <h3>Audit</h3>
          <div className="detail-row">
            <span className="key">Source ID</span>
            <span className="val" style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {s.id}
            </span>
          </div>
          <div className="detail-row">
            <span className="key">Registered</span>
            <span className="val">{new Date(s.createdAt).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="key">Last Updated</span>
            <span className="val">{new Date(s.updatedAt).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="key">Metadata</span>
            <span className="val" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {Object.keys(s.metadata).length > 0
                ? JSON.stringify(s.metadata)
                : '{}'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
