import { useNavigate } from 'react-router-dom';
import { HistoryPanel } from '../components/HistoryPanel';
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
          <div className="text-sm text-slate-500">Loading history…</div>
        ) : (
          <HistoryPanel
            history={history}
            onReuse={onReuse}
            onDelete={remove}
            onClear={clear}
          />
        )}
      </div>
    </div>
  );
}
