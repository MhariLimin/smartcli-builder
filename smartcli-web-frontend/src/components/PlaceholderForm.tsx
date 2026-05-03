import type { PlaceholderInfo } from '../types';

interface Props {
  placeholders: PlaceholderInfo[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export function PlaceholderForm({ placeholders, values, onChange }: Props) {
  if (placeholders.length === 0) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        Fill in placeholders
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
              value={values[p.name] ?? ''}
              onChange={(e) => onChange(p.name, e.target.value)}
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
