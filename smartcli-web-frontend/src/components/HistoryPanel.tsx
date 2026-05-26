import { useState } from 'react';
import { shareCommandToClipboard } from '../lib/shareLink';
import type { HistoryEntry } from '../types';

interface Props {
  history: HistoryEntry[];
  onReuse: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, onReuse, onDelete, onClear }: Props) {
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
          <li className="text-slate-500 text-sm italic px-2 py-4">
            {history.length === 0 ? 'No saved commands yet.' : 'No matches.'}
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
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-sky-500 text-xs transition"
                title="Copy share link"
              >
                ↗
              </button>
              <button
                onClick={() => onDelete(h.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-xs transition"
                title="Delete"
              >
                ✕
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
