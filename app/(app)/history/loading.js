function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/5 p-5">
      <SkeletonBlock className="mb-4 h-1.5 w-14 rounded-full" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-7 w-28 rounded-xl" />
          <SkeletonBlock className="h-6 w-32" />
        </div>
        <SkeletonBlock className="hidden h-14 w-14 shrink-0 rounded-full sm:block" />
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="glass-panel w-full rounded-[28px] border border-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-5 w-32 rounded-xl" />
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-6 w-56 max-w-full" />
          <SkeletonBlock className="h-4 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="h-7 w-20 shrink-0 rounded-full" />
      </div>
      <div className="mt-5 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2 md:grid-cols-3">
        <SkeletonBlock className="h-11 w-full rounded-2xl" />
        <SkeletonBlock className="h-11 w-full rounded-2xl" />
        <SkeletonBlock className="h-11 w-full rounded-2xl" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <SkeletonBlock className="h-9 w-20 rounded-2xl" />
        <SkeletonBlock className="h-9 w-20 rounded-2xl" />
        <SkeletonBlock className="h-9 w-16 rounded-2xl" />
        <SkeletonBlock className="h-9 w-20 rounded-2xl" />
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading order history">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
          <SkeletonBlock className="h-10 w-24 rounded-2xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
        </div>
        <SkeletonBlock className="mt-6 h-12 w-full rounded-2xl" />
      </div>

      <div className="space-y-4">
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </div>
    </div>
  );
}
