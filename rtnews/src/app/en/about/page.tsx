// ─── English About Page ──────────────────────────────────────────────
// Server Component — About Rouaa platform

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Rouaa',
  description:
    'Learn about Rouaa — an AI-powered financial news and analysis platform delivering real-time market insights, trading signals, and in-depth reports.',
};

export default function EnAboutPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            About Rouaa
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            AI-powered financial intelligence for the modern investor
          </p>
        </div>

        {/* Hero Card */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Rouaa is a next-generation financial news and analysis platform that
            harnesses the power of artificial intelligence to deliver real-time
            market insights to traders, investors, and financial professionals
            worldwide. Our platform combines cutting-edge AI algorithms with
            expert editorial oversight to provide accurate, timely, and
            actionable financial information.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Founded with the mission of democratizing access to professional-grade
            financial intelligence, Rouaa bridges the gap between institutional-level
            analysis and individual investors. Whether you trade forex, commodities,
            cryptocurrencies, or equities, our platform equips you with the data-driven
            insights you need to make informed decisions in fast-moving markets.
          </p>
        </div>

        {/* Our Mission */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan, #00E5FF)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Our Mission
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Our mission is to empower every investor with the same quality of
              financial intelligence that was once reserved for institutional players.
              We believe that access to timely, accurate, and actionable market
              analysis should not be a privilege — it should be a standard.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              By leveraging artificial intelligence and natural language processing,
              we continuously monitor global markets, news wires, and economic data
              to surface the insights that matter most. Our AI identifies patterns,
              detects sentiment shifts, and generates trading signals — all in real
              time — so you never miss a critical market move.
            </p>
          </div>
        </div>

        {/* Our Vision */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--purple, #8B5CF6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Our Vision
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              We envision a world where every individual — regardless of their
              background or capital — has access to institutional-quality financial
              analysis and market intelligence. Our goal is to become the most
              trusted AI-powered financial companion for traders and investors
              across the globe.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              As markets grow more complex and interconnected, the need for
              intelligent, real-time analysis has never been greater. Rouaa is
              building the future of financial information — one where AI and
              human expertise work hand in hand to deliver clarity from chaos,
              turning noise into knowledge and uncertainty into opportunity.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold, #d4af37)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              What We Offer
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Live Market News',
                desc: 'Real-time financial news coverage across forex, crypto, commodities, and stocks — powered by AI curation.',
              },
              {
                title: 'AI Trading Signals',
                desc: 'Data-driven buy/sell signals with entry, stop-loss, and take-profit levels generated by our proprietary algorithms.',
              },
              {
                title: 'In-Depth Reports',
                desc: 'Comprehensive analytical reports on market trends, economic events, and sector performance.',
              },
              {
                title: 'Economic Calendar',
                desc: 'Track key economic events and data releases that move markets, with AI-predicted impact assessments.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.12)',
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--cyan, #00E5FF)' }}
          >
            Rouaa — Turning information into insight, insight into opportunity.
          </p>
        </div>
      </div>
    </main>
  );
}
