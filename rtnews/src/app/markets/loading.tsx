export default function MarketsLoading() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="skeleton h-8 w-40 mb-6 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-3">
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-16 w-full rounded-lg" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
