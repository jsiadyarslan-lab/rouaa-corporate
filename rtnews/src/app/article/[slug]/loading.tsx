// ─── Article Page Loading Skeleton ─────────────────────────────────
// Displays while the article page is loading during navigation

export default function ArticleLoading() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero skeleton */}
      <div className="relative h-[280px] md:h-[380px] overflow-hidden" style={{ background: 'var(--bg3)' }}>
        <div className="skeleton w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 max-w-[860px] mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="skeleton h-6 w-20 rounded-lg" />
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg mb-3" />
          <div className="skeleton h-10 w-3/4 rounded-lg mb-4" />
          <div className="flex items-center gap-4">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <article className="max-w-[860px] mx-auto px-4 py-8">
        {/* Summary box skeleton */}
        <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)' }}>
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-5/6 rounded mb-2" />
          <div className="skeleton h-4 w-4/6 rounded" />
        </div>

        {/* Source content skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-5/6 rounded" />
            <div className="skeleton h-5 w-4/6 rounded" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-3/4 rounded" />
          </div>
        </div>

        {/* AI section divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.15)' }}>
            <span className="badge-ai text-[9px]">AI</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--purple)' }}>تحليل الذكاء الاصطناعي</span>
          </div>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* AI analysis skeleton */}
        <div className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(124,111,205,0.06)', border: '1px solid rgba(124,111,205,0.15)' }}>
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-4/6 rounded" />
          </div>
        </div>
      </article>
    </main>
  );
}
