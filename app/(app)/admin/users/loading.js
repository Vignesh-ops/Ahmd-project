function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

function StoreUserSkeleton() {
  return (
    <div className="glass-panel rounded-[28px] border border-white/5 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-6 w-40 max-w-full" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-2xl" />
          <SkeletonBlock className="h-10 w-20 rounded-2xl" />
          <SkeletonBlock className="h-10 w-36 rounded-2xl" />
          <SkeletonBlock className="h-10 w-20 rounded-2xl" />
          <SkeletonBlock className="h-10 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading store users">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-8 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <SkeletonBlock className="h-11 w-40 rounded-2xl" />
      </div>

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-6 flex items-start gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-72 max-w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-4 w-80 max-w-full" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <SkeletonBlock className="h-11 w-40 rounded-2xl" />
            <SkeletonBlock className="h-11 w-44 rounded-2xl" />
            <SkeletonBlock className="h-11 w-44 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-6 flex items-start gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-7 w-80 max-w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-4 w-96 max-w-full" />
          <SkeletonBlock className="h-11 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="grid gap-4">
        <StoreUserSkeleton />
        <StoreUserSkeleton />
        <StoreUserSkeleton />
      </div>
    </div>
  );
}
