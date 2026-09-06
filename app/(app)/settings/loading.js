function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

function FieldSkeleton({ className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <SkeletonBlock className="h-3 w-32" />
      <SkeletonBlock className="h-11 w-full rounded-2xl" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading settings">
      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-6 flex items-start gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-7 w-48" />
          </div>
        </div>

        <div className="grid-form two-col">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton className="md:col-span-2" />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-4 w-64 max-w-full" />
          <SkeletonBlock className="h-11 w-36 rounded-2xl" />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-5 w-40" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SkeletonBlock className="h-11 w-36 rounded-2xl" />
              <SkeletonBlock className="h-11 w-36 rounded-2xl" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
