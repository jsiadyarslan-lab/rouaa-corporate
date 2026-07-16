'use client';

// Route-level error boundary for /en/reports/[slug]/
// Catches client-side render errors in EnReportDetailClient (e.g. undefined access
// during render, React throws, useEffect errors after mount).
// For Server Component errors, see /src/app/global-error.tsx.

import { useEffect } from 'react';

export default function EnReportSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('════════════════════════════════════════');
    console.error('🚨 [EN REPORT SLUG ROUTE ERROR BOUNDARY]');
    console.error('════════════════════════════════════════');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error digest:', error?.digest);
    console.error('Error stack:', error?.stack);
    if (error?.cause) console.error('Error cause:', error.cause);
    console.error('Full error object:', error);
    console.error('════════════════════════════════════════');
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', direction: 'ltr', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>Failed to Load Report</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>
          An error occurred while loading this report. The error has been logged.
        </p>
        {error?.digest && (
          <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px' }}>
            Digest: {error.digest}
          </p>
        )}
        {error?.message && (
          <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-word' }}>
            {error.message}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#00E5FF',
              color: '#0A0E27',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <a
            href="/en/reports"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#E2E8F0',
              textDecoration: 'none',
            }}
          >
            Back to Reports
          </a>
        </div>
      </div>
    </div>
  );
}
