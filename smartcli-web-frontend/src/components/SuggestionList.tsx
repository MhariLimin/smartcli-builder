import type { Suggestion } from '../types';
import { Skeleton, SkeletonBar } from './Skeleton';

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

// Each category badge declares both palettes — light-mode shades come first
// and dark: variants take over when the user picks the dark theme. The
// pattern is uniform across hues: bg-100 / text-800 / border-300 for light,
// bg-900/60 / text-200 / border-700 for dark.
const categoryColors: Record<string, string> = {
  kubectl:
    'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-700',
  docker:
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700',
  'docker-compose':
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700',
  git:
    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-700',
  ssh:
    'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700',
  linux:
    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700',
  curl:
    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700',
  powershell:
    'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700',
  mysql:
    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700',
  kafka:
    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700',
  keytool:
    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/60 dark:text-yellow-200 dark:border-yellow-700',
  kcadm:
    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/60 dark:text-yellow-200 dark:border-yellow-700',
  maven:
    'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/60 dark:text-pink-200 dark:border-pink-700',
  gradle:
    'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/60 dark:text-pink-200 dark:border-pink-700',
  java:
    'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/60 dark:text-pink-200 dark:border-pink-700',
  harbor:
    'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/60 dark:text-cyan-200 dark:border-cyan-700',
  containerd:
    'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/60 dark:text-teal-200 dark:border-teal-700'
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
    return (
      <div className="divide-y divide-slate-200 dark:divide-slate-800" aria-label="Loading suggestions">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-2.5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-16 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBar className={i % 2 === 0 ? 'w-10/12' : 'w-8/12'} />
                <SkeletonBar className={i % 2 === 0 ? 'w-7/12' : 'w-9/12'} />
              </div>
              <Skeleton className="h-3 w-8 shrink-0 self-center" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-slate-500 px-4 py-3 italic">
        No suggestions. Try typing <code className="text-slate-700 dark:text-slate-300">kubectl</code>,{' '}
        <code className="text-slate-700 dark:text-slate-300">docker</code> or <code className="text-slate-700 dark:text-slate-300">git</code>.
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
        className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-auto"
      >
        {items.map((s, i) => {
          const colorClass =
            categoryColors[s.category] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
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
                (isActive ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70')
              }
            >
              <span
                className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border ${colorClass}`}
              >
                {s.category}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100 break-all">
                  {renderTokens(s.text)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{s.description}</div>
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
      <span key={i} className="text-amber-700 dark:text-amber-300">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
