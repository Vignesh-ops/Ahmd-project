function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export default function BankOrderLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading bank order">
      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-8 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <div className="w-full space-y-2 rounded-[28px] border border-white/5 bg-white/5 px-5 py-4 md:max-w-sm">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-4 w-48 max-w-full" />
            <SkeletonBlock className="h-4 w-40 max-w-full" />
            <SkeletonBlock className="h-4 w-32 max-w-full" />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-10 w-24 self-end rounded-[20px]" />
        </div>
        <div className="grid-form two-col">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-11 w-full rounded-2xl md:col-span-2" />
          <SkeletonBlock className="h-28 w-full rounded-2xl md:col-span-2" />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-6">
          <SkeletonBlock className="h-11 w-full rounded-2xl" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
      </div>
    </div>
  );
}
