import type { Suggestion } from '../types';

interface Props {
  items: Suggestion[];
  loading: boolean;
  onSelect: (suggestion: Suggestion) => void;
  // Small label rendered above the list (e.g. "Try one of these to get started"
  // when the items are the curated starter set).
  headerLabel?: string;
  // Index of the row currently highlighted by the keyboard. -1 = none.
  activeIndex?: number;
  // Hovering a row should sync the keyboard index so a subsequent ArrowDown
  // moves from the hovered row, not from -1.
  onHover?: (index: number) => void;
  listboxId: string;
  optionIdPrefix: string;
}

const categoryColors: Record<string, string> = {
  kubectl: 'bg-sky-900/60 text-sky-200 border-sky-700',
  docker: 'bg-blue-900/60 text-blue-200 border-blue-700',
  'docker-compose': 'bg-blue-900/60 text-blue-200 border-blue-700',
  git: 'bg-orange-900/60 text-orange-200 border-orange-700',
  ssh: 'bg-purple-900/60 text-purple-200 border-purple-700',
  linux: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
  curl: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
  powershell: 'bg-indigo-900/60 text-indigo-200 border-indigo-700',
  mysql: 'bg-amber-900/60 text-amber-200 border-amber-700',
  kafka: 'bg-rose-900/60 text-rose-200 border-rose-700',
  keytool: 'bg-yellow-900/60 text-yellow-200 border-yellow-700',
  kcadm: 'bg-yellow-900/60 text-yellow-200 border-yellow-700',
  maven: 'bg-pink-900/60 text-pink-200 border-pink-700',
  gradle: 'bg-pink-900/60 text-pink-200 border-pink-700',
  java: 'bg-pink-900/60 text-pink-200 border-pink-700',
  harbor: 'bg-cyan-900/60 text-cyan-200 border-cyan-700',
  containerd: 'bg-teal-900/60 text-teal-200 border-teal-700'
};

export function SuggestionList({
  items,
  loading,
  onSelect,
  headerLabel,
  activeIndex = -1,
  onHover,
  listboxId,
  optionIdPrefix
}: Props) {
  if (loading) {
    return <div className="text-slate-400 px-4 py-3">Loading suggestions…</div>;
  }
  if (items.length === 0) {
    return (
      <div className="text-slate-500 px-4 py-3 italic">
        No suggestions. Try typing <code className="text-slate-300">kubectl</code>,{' '}
        <code className="text-slate-300">docker</code> or <code className="text-slate-300">git</code>.
      </div>
    );
  }
  return (
    <div>
      {headerLabel && (
        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wide text-slate-500">
          {headerLabel}
        </div>
      )}
      <ul
        role="listbox"
        id={listboxId}
        className="divide-y divide-slate-800 max-h-96 overflow-auto"
      >
        {items.map((s, i) => {
          const colorClass =
            categoryColors[s.category] ?? 'bg-slate-800 text-slate-200 border-slate-700';
          const isActive = i === activeIndex;
          return (
            <li
              key={`${s.text}-${i}`}
              id={`${optionIdPrefix}-${i}`}
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(s)}
              onMouseEnter={() => onHover?.(i)}
              className={
                'cursor-pointer px-4 py-2 transition flex items-start gap-3 ' +
                (isActive ? 'bg-slate-800' : 'hover:bg-slate-800/70')
              }
            >
              <span
                className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border ${colorClass}`}
              >
                {s.category}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-slate-100 break-all">
                  {renderTokens(s.text)}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{s.description}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-slate-500 self-center">
                {s.kind === 'TEMPLATE' ? 'full' : 'next'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function renderTokens(text: string) {
  const parts = text.split(/(<[^>]+>)/g);
  return parts.map((p, i) =>
    p.startsWith('<') && p.endsWith('>') ? (
      <span key={i} className="text-amber-300">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
