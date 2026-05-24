import { useEffect, useState } from 'react';
import type { PlaceholderInfo } from '../types';

interface Props {
  placeholders: PlaceholderInfo[];
  onFill: (name: string, value: string) => void;
}

// Substitution commits on Enter or blur, not on every keystroke — otherwise the
// slot would vanish from the command after the first character and rip focus
// out of the input mid-typing.
export function PlaceholderForm({ placeholders, onFill }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Drop drafts for slots that have already been filled and removed from the
  // visible list, so stale text doesn't reappear if the same placeholder
  // returns later (e.g. after a History reuse).
  const visibleKey = placeholders.map((p) => p.name).join('|');
  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const p of placeholders) {
        if (prev[p.name] !== undefined) next[p.name] = prev[p.name];
      }
      return next;
    });
  }, [visibleKey]);

  if (placeholders.length === 0) return null;

  const commit = (name: string) => {
    const v = drafts[name];
    if (v && v.trim()) onFill(name, v.trim());
  };

  return (
    <div className="px-4 py-3 space-y-3 bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        Fill placeholders{' '}
        <span className="font-normal normal-case text-slate-500">
          — Enter or Tab substitutes into the command above
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {placeholders.map((p) => (
          <label key={p.name} className="block">
            <div className="text-sm text-slate-200 font-medium">
              <span className="text-amber-300 font-mono">&lt;{p.name}&gt;</span>
              <span className="ml-2 text-slate-400 text-xs">{p.label}</span>
            </div>
            <input
              type="text"
              value={drafts[p.name] ?? ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [p.name]: e.target.value }))}
              onBlur={() => commit(p.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              placeholder={p.hint}
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-3 py-2
                         text-sm font-mono text-slate-100 placeholder-slate-600
                         focus:outline-none focus:border-sky-500"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
