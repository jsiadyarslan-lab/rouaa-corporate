// ROUAA API client — typed wrappers around fetch.
// Base URL comes from VITE_API_URL or relative '/api' (proxied by Vite).

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export interface Source {
  id: string;
  name: string;
  code: string;
  type: SourceType;
  country: string;
  jurisdiction: string;
  authorityLevel: 'primary' | 'secondary';
  trustTier: number;
  websiteUrl: string | null;
  feedUrl: string | null;
  apiUrl: string | null;
  ingestionPattern: 'direct_api' | 'document_monitoring' | 'scheduled_polling' | 'manual';
  pollingIntervalSec: number;
  status: 'active' | 'paused' | 'deprecated' | 'candidate';
  metadata: Record<string, unknown>;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  health?: SourceHealth | null;
}

export interface SourceHealth {
  id: string;
  sourceId: string;
  lastSuccessfulFetchAt: string | null;
  lastFetchAttemptAt: string | null;
  consecutiveFailures: number;
  totalSuccessfulFetches: number;
  totalFailedFetches: number;
  reliabilityScore: number;
  status: 'healthy' | 'degraded' | 'failing' | 'paused' | 'unknown';
  lastErrorMessage: string | null;
  updatedAt: string;
}

export type SourceType =
  | 'central_bank'
  | 'regulator'
  | 'exchange'
  | 'statistics'
  | 'government'
  | 'international_org'
  | 'company';

export interface SourcesListResponse {
  data: Source[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SourcesStats {
  total: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
  byStatus: Record<string, number>;
  byTrustTier: Record<string, number>;
}

export interface SourcesQuery {
  type?: SourceType;
  country?: string;
  status?: string;
  trustTier?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      `API ${res.status} ${res.statusText}: ${JSON.stringify(errorBody.message ?? errorBody)}`,
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  sources: {
    list(query: SourcesQuery = {}): Promise<SourcesListResponse> {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      }
      const qs = params.toString();
      return request<SourcesListResponse>(`/sources${qs ? `?${qs}` : ''}`);
    },

    stats(): Promise<SourcesStats> {
      return request<SourcesStats>('/sources/stats');
    },

    get(id: string): Promise<Source> {
      return request<Source>(`/sources/${id}`);
    },

    getByCode(code: string): Promise<Source> {
      return request<Source>(`/sources/code/${code.toUpperCase()}`);
    },

    create(dto: Partial<Source>): Promise<Source> {
      return request<Source>('/sources', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    },

    update(id: string, dto: Partial<Source>): Promise<Source> {
      return request<Source>(`/sources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    },

    deprecate(id: string): Promise<{ id: string; status: string }> {
      return request(`/sources/${id}`, { method: 'DELETE' });
    },
  },

  health: {
    liveness(): Promise<{ status: string; service: string; timestamp: string }> {
      return request('/health');
    },
    readiness(): Promise<{
      status: string;
      service: string;
      database: string;
      timestamp: string;
    }> {
      return request('/health/ready');
    },
  },
};
