function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

function SummarySkeleton() {
  return (
    <section className="glass-panel rounded-[32px] border border-white/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-7 w-48" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <SkeletonBlock className="h-8 w-32 rounded-lg" />
              <SkeletonBlock className="mt-3 h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentOrderSkeleton() {
  return (
    <div className="glass-panel w-full rounded-[28px] border border-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-6 w-52 max-w-full" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
        <SkeletonBlock className="h-12 w-full rounded-2xl" />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <SkeletonBlock className="h-11 w-28 rounded-2xl" />
        <SkeletonBlock className="h-11 w-20 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading dashboard">
      <section className="glass-panel rounded-[36px] border border-white/5 p-6">
        <SkeletonBlock className="h-3 w-24" />
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-9 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SkeletonBlock className="h-11 w-44 rounded-2xl" />
            <SkeletonBlock className="h-11 w-40 rounded-2xl" />
          </div>
        </div>
      </section>

      <SummarySkeleton />
      <SummarySkeleton />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-7 w-44" />
          </div>
          <SkeletonBlock className="h-5 w-20" />
        </div>

        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <RecentOrderSkeleton key={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
