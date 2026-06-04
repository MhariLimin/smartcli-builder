interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse ${className}`}
    />
  );
}

export function SkeletonBar({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-3 ${className}`} />;
}

export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-16 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBar className="w-3/4" />
          <SkeletonBar className="w-11/12" />
          <SkeletonBar className="w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 shrink-0" />
      </div>
    </div>
  );
}
