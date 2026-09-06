function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="page-fade space-y-6" aria-label="Loading">
      <div className="glass-panel rounded-[32px] border border-white/5 p-6">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-4 h-8 w-64 max-w-full" />
      </div>
      <div className="glass-panel rounded-[32px] border border-white/5 p-6 space-y-4">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-11 w-full rounded-2xl" />
        <SkeletonBlock className="h-11 w-full rounded-2xl" />
      </div>
      <div className="glass-panel rounded-[28px] border border-white/5 p-5 space-y-3">
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
