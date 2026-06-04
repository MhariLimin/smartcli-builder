import { useNavigate } from 'react-router-dom';
import { HistoryPanel } from '../components/HistoryPanel';
import { Skeleton, SkeletonBar } from '../components/Skeleton';
import { useHistory } from '../hooks/useHistory';
import type { HistoryEntry } from '../types';

// Full history destination. Reuses HistoryPanel from the sidebar-aside era;
// the only adaptation is the onReuse callback, which now navigates to the
// Builder with the command pre-seeded via query string. Deep-linkable.
export function HistoryPage() {
  const navigate = useNavigate();
  const { history, loading, remove, clear } = useHistory();

  const onReuse = (entry: HistoryEntry) => {
    const params = new URLSearchParams();
    params.set('template', entry.command);
    if (entry.category) params.set('category', entry.category);
    navigate('/?' + params.toString());
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          History
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Every command you've copied. Filter, click to reuse in the Builder,
          delete a row, or clear everything.
        </p>
      </header>
      <div className="h-[calc(100vh-220px)]">
        {loading ? (
          <HistoryLoadingPanel />
        ) : (
          <HistoryPanel
            history={history}
            onReuse={onReuse}
            onDelete={remove}
            onClear={clear}
            onOpenBuilder={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
}

function HistoryLoadingPanel() {
  return (
    <div
      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 h-full flex flex-col"
      aria-label="Loading history"
    >
      <div className="flex items-center justify-between">
        <SkeletonBar className="w-24" />
        <SkeletonBar className="w-14" />
      </div>
      <Skeleton className="h-9 w-full" />
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden flex-1 -mx-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="px-2 py-2">
            <div className="flex items-start gap-2">
              <Skeleton className="mt-1 h-3 w-12 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBar className={i % 2 === 0 ? 'w-11/12' : 'w-8/12'} />
                <SkeletonBar className="w-32" />
              </div>
              <Skeleton className="h-7 w-7 shrink-0" />
              <Skeleton className="h-7 w-7 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
