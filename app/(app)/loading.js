function SkeletonCard({ className = "" }) {
  return <div className={`loading-shimmer rounded-[28px] border border-white/5 bg-white/5 ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[36px] border border-white/5 p-6">
        <SkeletonCard className="h-4 w-28" />
        <SkeletonCard className="mt-4 h-10 w-72 max-w-full" />
        <SkeletonCard className="mt-3 h-4 w-full max-w-2xl" />
        <div className="mt-6 flex gap-3">
          <SkeletonCard className="h-11 w-40" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
      </section>

      <section className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-12" />
          <SkeletonCard className="h-12" />
        </div>
      </section>

      <section className="space-y-4">
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
      </section>
    </div>
  );
}
