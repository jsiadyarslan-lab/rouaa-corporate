// ─── HomeSkeleton Component ───────────────────────────────────────────
// Loading skeletons for the home page — matches ALL 13 rows of HomePageContent
// Uses design system CSS variables (--bg3, --bg4, --border, --r, --r2, etc.)
// and the global .skeleton class (shimmer animation)

const MONO = `var(--font-jetbrains-mono), monospace`;

/* ═══ Shared micro-skeleton ═══ */
function Skel({ w, h, r }: { w: string; h: string; r?: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r || 'var(--r)' }} />;
}

/* ═══ ROW 1: Summary Bar — 3 panels ═══ */
function SummaryRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {['AI DAILY SUMMARY', 'Fear & Greed', 'Market Mood'].map((label, i) => (
        <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {i === 0 && <span style={{ fontSize: 18 }}>🧠</span>}
            <Skel w={i === 0 ? '120px' : '100px'} h="14px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skel w="100%" h="12px" />
            <Skel w="80%" h="12px" />
            {i === 1 && <Skel w="60px" h="24px" />}
            {i === 2 && <Skel w="100%" h="30px" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ ROW 2: News — Sidebar + Main Slider ═══ */
function NewsRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {/* Sidebar: آخر الأخبار */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Skel w="90px" h="14px" />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text4)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '8px 6px', borderInlineStart: '3px solid var(--bg5)' }}>
              <Skel w="100%" h="12px" />
              <Skel w="50%" h="10px" />
            </div>
          ))}
        </div>
      </div>

      {/* Main: أهم الأخبار الآن */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Skel w="110px" h="14px" />
          <Skel w="40px" h="12px" />
        </div>
        {/* Progress bar placeholder */}
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg5)', marginBottom: 12 }} />
        {/* Slide content */}
        <div style={{ minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Skel w="60px" h="18px" />
          <Skel w="80%" h="16px" />
          <Skel w="50%" h="16px" />
          <Skel w="30%" h="12px" />
        </div>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ width: 32, height: 28, borderRadius: 'var(--r)', background: 'var(--bg4)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, background: 'var(--bg5)' }} />
            ))}
          </div>
          <div style={{ width: 32, height: 28, borderRadius: 'var(--r)', background: 'var(--bg4)' }} />
        </div>
      </div>
    </div>
  );
}

/* ═══ ROW 3: Markets sidebar + AI Analysis main ═══ */
function MarketsAIRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {/* Sidebar: الأسواق */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Skel w="70px" h="14px" />
          <Skel w="40px" h="11px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} w="100%" h="24px" />)}
        </div>
      </div>

      {/* Main: تحليل AI اللحظي */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Skel w="110px" h="14px" />
          <Skel w="70px" h="24px" r="var(--r)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
              <Skel w="60%" h="14px" />
              <div style={{ height: 6 }} />
              <Skel w="100%" h="40px" />
              <div style={{ height: 4 }} />
              <Skel w="100%" h="12px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROW 4: Calendar sidebar + Recommendations main ═══ */
function CalendarRecsRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {/* Sidebar: الأجندة الاقتصادية */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ marginBottom: 8 }}>
          <Skel w="130px" h="14px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w="100%" h="28px" />)}
        </div>
      </div>

      {/* Main: توصيات AI */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ marginBottom: 10 }}>
          <Skel w="90px" h="14px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
              <Skel w="60%" h="14px" />
              <div style={{ height: 6 }} />
              <Skel w="100%" h="30px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROW 5: Market Indicators — full width, 6 columns ═══ */
function MarketIndicatorsSkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="sh" style={{ marginBottom: 10 }}>
        <Skel w="110px" h="14px" />
        <Skel w="60px" h="11px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Skel w="40px" h="12px" />
              <Skel w="45px" h="11px" />
            </div>
            <Skel w="60px" h="16px" />
            <div style={{ height: 6 }} />
            <Skel w="100%" h="28px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ ROW 6: Most Traded — full width, 6 columns ═══ */
function MostTradedSkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="sh" style={{ marginBottom: 10 }}>
        <Skel w="110px" h="14px" />
        <Skel w="60px" h="11px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Skel w="40px" h="12px" />
              <Skel w="45px" h="11px" />
            </div>
            <Skel w="60px" h="16px" />
            <div style={{ height: 6 }} />
            <Skel w="100%" h="28px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ Column skeleton — used by ROW 7 ═══ */
function ColumnSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
      <div style={{ marginBottom: 8 }}>
        <Skel w={titleWidth} h="14px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skel key={i} w="100%" h="22px" />)}
      </div>
    </div>
  );
}

/* ═══ ROW 7: Three columns — السلع / المؤشرات العربية / المؤشرات العالمية ═══ */
function ThreeColumnsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      <ColumnSkeleton titleWidth="120px" />
      <ColumnSkeleton titleWidth="160px" />
      <ColumnSkeleton titleWidth="120px" />
    </div>
  );
}

/* ═══ ROW 8: AI Screener + Why رؤى ═══ */
function ScreenerWhySkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {/* AI Screener */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Skel w="200px" h="14px" />
        </div>
        {/* Tabs placeholder */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {['buy', 'sell', 'hot'].map((t) => (
            <div key={t} style={{ padding: '5px 14px', borderRadius: 'var(--r)', background: 'var(--bg4)', width: 80, height: 24 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w="100%" h="28px" />)}
        </div>
      </div>

      {/* Why رؤى */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ marginBottom: 10 }}>
          <Skel w="90px" h="14px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)', textAlign: 'center' }}>
              <Skel w="24px" h="24px" r="50%" />
              <div style={{ height: 4 }} />
              <Skel w="80%" h="12px" />
              <div style={{ height: 2 }} />
              <Skel w="100%" h="10px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROW 9: Market Hours + Top Movers ═══ */
function HoursMoversSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      {/* Market Hours */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Skel w="100px" h="14px" />
          <Skel w="60px" h="11px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w="100%" h="32px" />)}
        </div>
      </div>

      {/* Top Movers */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ marginBottom: 10 }}>
          <Skel w="100px" h="14px" />
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <Skel w="60px" h="24px" r="var(--r)" />
          <Skel w="60px" h="24px" r="var(--r)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skel key={i} w="100%" h="22px" />)}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROW 10: Central Banks ═══ */
function CentralBanksSkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="sh" style={{ marginBottom: 10 }}>
        <Skel w="140px" h="14px" />
        <Skel w="60px" h="11px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)', textAlign: 'center' }}>
            <Skel w="24px" h="24px" r="50%" />
            <div style={{ height: 4 }} />
            <Skel w="60%" h="11px" />
            <div style={{ height: 4 }} />
            <Skel w="50px" h="18px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ ROW 11: Community Pulse ═══ */
function CommunityPulseSkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="sh" style={{ marginBottom: 10 }}>
        <Skel w="100px" h="14px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
            <Skel w="50px" h="12px" />
            <div style={{ height: 6 }} />
            <Skel w="100%" h="8px" />
            <div style={{ height: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skel w="40px" h="10px" />
              <Skel w="40px" h="10px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ ROW 12: Academy Preview ═══ */
function AcademySkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div className="sh" style={{ marginBottom: 10 }}>
        <Skel w="100px" h="14px" />
        <Skel w="60px" h="11px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-sm)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)', textAlign: 'center' }}>
            <Skel w="20px" h="20px" r="50%" />
            <div style={{ height: 4 }} />
            <Skel w="36px" h="14px" />
            <div style={{ height: 2 }} />
            <Skel w="100%" h="10px" />
            <div style={{ height: 2 }} />
            <Skel w="60%" h="9px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ ROW 13: Geopolitical Risk ═══ */
function GeoRiskSkeleton() {
  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 'var(--space-sm)' }}>
        <div style={{ marginBottom: 8 }}>
          <Skel w="180px" h="14px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Skel w="50px" h="28px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skel w="120px" h="13px" />
            <Skel w="100%" h="11px" />
            <Skel w="70%" h="11px" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPLETE HOME SKELETON — all 13 rows
   ══════════════════════════════════════════════════════════════════════ */
export default function HomeSkeleton() {
  return (
    <div className="container home-grid-wrap" aria-hidden="true" aria-label="جاري التحميل">
      <SummaryRowSkeleton />
      <NewsRowSkeleton />
      <MarketsAIRowSkeleton />
      <CalendarRecsRowSkeleton />
      <MarketIndicatorsSkeleton />
      <MostTradedSkeleton />
      <ThreeColumnsSkeleton />
      <ScreenerWhySkeleton />
      <HoursMoversSkeleton />
      <CentralBanksSkeleton />
      <CommunityPulseSkeleton />
      <AcademySkeleton />
      <GeoRiskSkeleton />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   INDIVIDUAL EXPORTS — can be used standalone if needed
   ══════════════════════════════════════════════════════════════════════ */
export {
  SummaryRowSkeleton as HeroSkeleton,
  NewsRowSkeleton as FeaturedGridSkeleton,
  MarketsAIRowSkeleton as NewsListSkeleton,
};
