import { useState } from 'react';
import { shareCommandToClipboard } from '../lib/shareLink';
import type { HistoryEntry } from '../types';
import { CopyIcon, ShareIcon, TrashIcon } from './icons';
import { EmptyState } from './EmptyState';

const ROW_ICON_BUTTON =
  'inline-flex items-center justify-center h-7 w-7 rounded ' +
  'text-slate-500 dark:text-slate-400 ' +
  'hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0';

interface Props {
  history: HistoryEntry[];
  onReuse: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onOpenBuilder?: () => void;
}

export function HistoryPanel({ history, onReuse, onDelete, onClear, onOpenBuilder }: Props) {
  const [filter, setFilter] = useState('');
  // Inline flash per row — id of the row that just emitted a message.
  const [flash, setFlash] = useState<{ id: string; ok: boolean; message: string } | null>(null);

  const filtered = history.filter((h) =>
    h.command.toLowerCase().includes(filter.toLowerCase())
  );

  const onShare = async (h: HistoryEntry) => {
    const result = await shareCommandToClipboard(h.command, h.category);
    setFlash({ id: h.id, ...result });
    window.setTimeout(() => {
      setFlash((cur) => (cur && cur.id === h.id ? null : cur));
    }, 2500);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
          History ({history.length})
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-rose-400 transition"
          >
            Clear all
          </button>
        )}
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter history…"
        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm
                   text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500"
      />
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 overflow-auto flex-1 -mx-1">
        {filtered.length === 0 && (
          <li className="px-1 py-2">
            {history.length === 0 ? (
              <EmptyState
                icon={<CopyIcon width={18} height={18} />}
                title="No commands yet"
                message="Copied commands appear here automatically so you can reuse them later."
                actionLabel={onOpenBuilder ? 'Open the Builder' : undefined}
                onAction={onOpenBuilder}
              />
            ) : (
              <EmptyState
                icon={<CopyIcon width={18} height={18} />}
                title="No history matches"
                message="Clear the filter to see your recent commands again."
                actionLabel="Clear filter"
                onAction={() => setFilter('')}
              />
            )}
          </li>
        )}
        {filtered.map((h) => (
          <li key={h.id} className="px-2 py-2 group">
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">
                {h.category}
              </span>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onReuse(h)}
                  className="text-left font-mono text-xs text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-300 break-all"
                  title="Click to reuse"
                >
                  {h.command}
                </button>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {new Date(h.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onShare(h)}
                className={ROW_ICON_BUTTON + ' hover:text-sky-600 dark:hover:text-sky-300'}
                title="Copy share link"
                aria-label="Copy share link"
              >
                <ShareIcon />
              </button>
              <button
                onClick={() => onDelete(h.id)}
                className={ROW_ICON_BUTTON + ' hover:text-rose-600 dark:hover:text-rose-300'}
                title="Delete"
                aria-label="Delete entry"
              >
                <TrashIcon />
              </button>
            </div>
            {flash && flash.id === h.id && (
              <div
                className={
                  'mt-1 ml-1 text-[10px] truncate ' +
                  (flash.ok
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300')
                }
                title={flash.message}
              >
                {flash.ok ? '✓ ' : '⚠ '}
                {flash.message}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
