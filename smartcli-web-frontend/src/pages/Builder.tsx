import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuilderView } from '../components/BuilderView';
import { useHistory } from '../hooks/useHistory';
import type { HistoryEntry } from '../types';

const RECENT_LIMIT = 10;

// Tier-3 sidebar-nav rewrite of the Builder destination. Reads the seed
// (template, category) from the URL so Catalog → "Use" and History →
// "Reuse" hand off through `?template=…&category=…` rather than React
// state. Renders a Recent (10) strip above the composer; the old sticky
// right-side HistoryPanel is gone — the History sidebar destination owns
// the full log now.
export function BuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { history, add } = useHistory();

  const seedTemplate = searchParams.get('template') ?? '';
  const seedCategory = searchParams.get('category') ?? '';
  const shareError = searchParams.get('share_error');

  // Clear the share_error param off the URL after the user has had a moment
  // to read it — refreshing or sharing this URL shouldn't re-surface the
  // banner. Keep template/category since those are legitimate seed state.
  useEffect(() => {
    if (!shareError) return;
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete('share_error');
      setSearchParams(next, { replace: true });
    }, 6000);
    return () => window.clearTimeout(t);
  }, [shareError, searchParams, setSearchParams]);

  // Every navigation to /?template=… increments resetSignal so BuilderView's
  // resetSignal effect reseeds its internal state. We bump it once when the
  // page mounts with a seed AND once whenever the seed changes mid-session.
  const [resetSignal, setResetSignal] = useState(0);
  useEffect(() => {
    if (seedTemplate) setResetSignal((n) => n + 1);
  }, [seedTemplate, seedCategory]);

  // Dedupe Recent by command text so successive Copies of the same line
  // don't push earlier entries off the strip. Backend already dedupes, but
  // the optimistic local update in useHistory matches the same rule, so
  // this is belt-and-suspenders.
  const recent = useMemo<HistoryEntry[]>(() => {
    const seen = new Set<string>();
    const out: HistoryEntry[] = [];
    for (const h of history) {
      if (seen.has(h.command)) continue;
      seen.add(h.command);
      out.push(h);
      if (out.length >= RECENT_LIMIT) break;
    }
    return out;
  }, [history]);

  const onReuse = (entry: HistoryEntry) => {
    const params = new URLSearchParams();
    params.set('template', entry.command);
    if (entry.category) params.set('category', entry.category);
    // Use setSearchParams so /?template=… stays the canonical URL.
    setSearchParams(params, { replace: false });
  };

  return (
    <div className="space-y-6">
      {shareError && (
        <div
          role="status"
          className="rounded border border-amber-300 dark:border-amber-700
                     bg-amber-100 dark:bg-amber-900/40
                     text-amber-800 dark:text-amber-200 text-sm px-3 py-2"
        >
          ⚠ Couldn't open share link — the payload was invalid or corrupted.
        </div>
      )}
      {recent.length > 0 && (
        <section
          aria-labelledby="recent-strip-heading"
          className="surface-card p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3
              id="recent-strip-heading"
              className="text-xs uppercase tracking-wide font-semibold
                         text-slate-600 dark:text-slate-400"
            >
              Recent
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="focus-brand rounded px-1 text-xs text-electric-600 transition
                         hover:text-electric-500 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              full history →
            </button>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {recent.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => onReuse(h)}
                  title={`Reuse — ${new Date(h.createdAt).toLocaleString()}`}
                  className="max-w-[24rem] truncate text-left font-mono text-xs
                             rounded border border-slate-200 dark:border-slate-700
                             bg-white dark:bg-slate-800
                             text-slate-800 dark:text-slate-200
                             hover:border-cyan-500 hover:bg-cyan-50
                             dark:border-navy-700 dark:bg-navy-850
                             dark:hover:border-cyan-500/60 dark:hover:bg-cyan-500/10
                             px-2 py-1.5 transition"
                >
                  <span className="text-[9px] uppercase tracking-wide text-slate-500 mr-2">
                    {h.category}
                  </span>
                  {h.command}
                </button>
              </li>
            ))}
          </ul>
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
