function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

function StoreRateCardSkeleton() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/5 p-5">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-4 w-48" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-6 w-16 shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <SkeletonBlock className="h-11 w-32 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AdminSettingsLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading store settings">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-9 w-96 max-w-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-11 w-36 rounded-2xl" />
          <SkeletonBlock className="h-11 w-36 rounded-2xl" />
        </div>
      </div>

      <div className="space-y-4">
        {[0, 1, 2, 3].map((item) => (
          <StoreRateCardSkeleton key={item} />
        ))}
      </div>
    </div>
  );
}
