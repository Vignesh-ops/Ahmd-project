function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export default function ReceiptLoading() {
  return (
    <div className="page-fade flex justify-center py-6" aria-label="Loading receipt">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <SkeletonBlock className="h-11 w-full rounded-2xl sm:w-32" />
          <SkeletonBlock className="h-11 w-full rounded-2xl sm:w-44" />
        </div>

        <div className="glass-panel rounded-[32px] border border-white/5 p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <SkeletonBlock className="h-16 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-40" />
            <SkeletonBlock className="h-3 w-28" />
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-4 w-56" />
            <SkeletonBlock className="h-4 w-44" />
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-4 w-52" />
            <SkeletonBlock className="h-4 w-36" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-7 w-40" />
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="mt-2 h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
