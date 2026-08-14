import { useEffect, useMemo, useState } from 'react';
import { Terminal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuilderView } from '../components/BuilderView';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { useHistory } from '../hooks/useHistory';
import type { HistoryEntry } from '../types';

const RECENT_LIMIT = 5;

export function BuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { history, add } = useHistory();
  const seedTemplate = searchParams.get('template') ?? '';
  const seedCategory = searchParams.get('category') ?? '';
  const shareError = searchParams.get('share_error');

  useEffect(() => {
    if (!shareError) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete('share_error');
      setSearchParams(next, { replace: true });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [shareError, searchParams, setSearchParams]);

  const [resetSignal, setResetSignal] = useState(0);
  useEffect(() => {
    if (seedTemplate) setResetSignal((value) => value + 1);
  }, [seedTemplate, seedCategory]);

  const recent = useMemo<HistoryEntry[]>(() => {
    const seen = new Set<string>();
    const result: HistoryEntry[] = [];
    for (const entry of history) {
      if (seen.has(entry.command)) continue;
      seen.add(entry.command);
      result.push(entry);
      if (result.length >= RECENT_LIMIT) break;
    }
    return result;
  }, [history]);

  const onReuse = (entry: HistoryEntry) => {
    const params = new URLSearchParams();
    params.set('template', entry.command);
    if (entry.category) params.set('category', entry.category);
    setSearchParams(params, { replace: false });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Builder"
        description="Compose commands with live suggestions, typed placeholders, and a review-first copy workflow."
        actions={
          <Badge variant="info" size="xs">
            <Terminal className="mr-1 h-3 w-3" /> Copy-only
          </Badge>
        }
      />

      {shareError && (
        <div role="status" className="rounded-lg border border-amber-700 bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
          Could not open the share link because its payload was invalid or corrupted.
        </div>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-strip-heading" className="surface-card overflow-hidden px-3 py-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <h2 id="recent-strip-heading" className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Recent activity
            </h2>
            <ul className="scrollbar-none flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto">
              {recent.map((entry) => (
                <li key={entry.id} className="shrink-0">
                  <button
                    onClick={() => onReuse(entry)}
                    title={`Reuse — ${new Date(entry.createdAt).toLocaleString()}`}
                    className="focus-brand max-w-52 truncate rounded-md border border-navy-700 bg-navy-850 px-2 py-1 text-left font-mono text-[11px] text-slate-300 transition hover:border-cyan-500/60 hover:bg-cyan-500/10"
                  >
                    <span className="mr-1.5 text-[9px] uppercase tracking-wide text-slate-500">{entry.category}</span>
                    {entry.command}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/history')}
              className="focus-brand shrink-0 rounded px-1 text-[11px] text-cyan-400 transition hover:text-cyan-300"
            >
              History →
            </button>
          </div>
        </section>
      )}

      <BuilderView
        initialTemplate={seedTemplate}
        initialCategory={seedCategory}
        resetSignal={resetSignal}
        addHistory={add}
      />
    </div>
  );
}
