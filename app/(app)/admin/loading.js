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

function StoreCardSkeleton() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/5 p-5">
      <div className="flex items-start gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-5 w-32" />
        </div>
      </div>
      <SkeletonBlock className="mt-4 h-4 w-24" />
      <SkeletonBlock className="mt-2 h-4 w-40" />
      <SkeletonBlock className="mt-1 h-4 w-40" />
      <SkeletonBlock className="mt-4 h-11 w-full rounded-2xl" />
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-5 w-48 max-w-full" />
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-10 w-full rounded-2xl" />
        <SkeletonBlock className="h-10 w-full rounded-2xl" />
        <SkeletonBlock className="h-10 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading admin dashboard">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-8 w-72 max-w-full" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-11 w-40 rounded-2xl" />
          <SkeletonBlock className="h-11 w-40 rounded-2xl" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StoreCardSkeleton />
        <StoreCardSkeleton />
        <StoreCardSkeleton />
        <StoreCardSkeleton />
      </div>

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
          <SkeletonBlock className="h-11 w-24 rounded-2xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-11 w-full rounded-2xl sm:col-span-3" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
        </div>
      </div>

      <div className="space-y-4">
        <OrderRowSkeleton />
        <OrderRowSkeleton />
        <OrderRowSkeleton />
      </div>
    </div>
  );
}
