import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import { fuzzyMatch } from '../lib/fuzzy';
import type { CommandTemplate, HistoryEntry, SavedCommand } from '../types';

type PaletteKind = 'template' | 'history' | 'saved' | 'navigate';
type PaletteFilter = 'all' | PaletteKind;

interface PaletteResult {
  id: string;
  kind: PaletteKind;
  title: string;
  subtitle?: string;
  command?: string;
  category?: string | null;
  path?: string;
  score: number;
}

interface RecentAction {
  id: string;
  kind: PaletteKind;
  title: string;
  subtitle?: string;
  command?: string;
  category?: string | null;
  path?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const RECENTS_KEY = 'smartcli.commandPalette.recents.v1';
const FILTERS: PaletteFilter[] = ['all', 'template', 'history', 'saved', 'navigate'];
const KIND_ORDER: Record<PaletteKind, number> = {
  template: 0,
  history: 1,
  saved: 2,
  navigate: 3
};

const NAV_TARGETS: Omit<PaletteResult, 'score'>[] = [
  {
    id: 'nav-builder',
    kind: 'navigate',
    title: 'Go to Builder',
    subtitle: 'Compose a command',
    path: '/'
  },
  {
    id: 'nav-saved',
    kind: 'navigate',
    title: 'Go to Saved',
    subtitle: 'Curated command library',
    path: '/saved'
  },
  {
    id: 'nav-history',
    kind: 'navigate',
    title: 'Go to History',
    subtitle: 'Copied command log',
    path: '/history'
  },
  {
    id: 'nav-catalog',
    kind: 'navigate',
    title: 'Go to Catalog',
    subtitle: 'Browse templates',
    path: '/catalog'
  }
];

function readRecents(): RecentAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.id === 'string').slice(0, 5);
  } catch {
    return [];
  }
}

function writeRecents(next: RecentAction[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next.slice(0, 5)));
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function seedBuilderPath(command: string, category?: string | null): string {
  const params = new URLSearchParams();
  params.set('template', command);
  if (category) params.set('category', category);
  return '/?' + params.toString();
}

function toRecent(result: PaletteResult): RecentAction {
  const { id, kind, title, subtitle, command, category, path } = result;
  return { id, kind, title, subtitle, command, category, path };
}

function recentToResult(recent: RecentAction, index: number): PaletteResult {
  return { ...recent, score: 1000 - index };
}

function kindLabel(kind: PaletteKind): string {
  switch (kind) {
    case 'template':
      return 'Template';
    case 'history':
      return 'History';
    case 'saved':
      return 'Saved';
    case 'navigate':
      return 'Navigate';
  }
}

function filterLabel(filter: PaletteFilter): string {
  return filter === 'all' ? 'All' : kindLabel(filter);
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PaletteFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedCommand[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentAction[]>(() => readRecents());

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setFilter('all');
    setActiveIndex(0);
    setRecents(readRecents());
    window.setTimeout(() => inputRef.current?.focus(), 0);

    let alive = true;
    setLoading(true);
    const templatePromise = templatesLoaded ? Promise.resolve(templates) : api.templates();
    Promise.all([templatePromise, api.history.list(), api.saved.list()])
      .then(([templateList, historyList, savedList]) => {
        if (!alive) return;
        if (!templatesLoaded) {
          setTemplates(templateList);
          setTemplatesLoaded(true);
        }
        setHistory(historyList);
        setSaved(savedList);
        setError(null);
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, templatesLoaded, templates]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const allResults = useMemo<PaletteResult[]>(() => {
    const q = query.trim();
    const rows: PaletteResult[] = [];

    for (const t of templates) {
      const match = fuzzyMatch(q, [t.template, t.description, t.category]);
      if (!match.matched) continue;
      rows.push({
        id: `template:${t.category}:${t.template}`,
        kind: 'template',
        title: t.template,
        subtitle: t.description,
        command: t.template,
        category: t.category,
        score: match.score
      });
    }

    for (const h of history) {
      const match = fuzzyMatch(q, [h.command, h.category]);
      if (!match.matched) continue;
      rows.push({
        id: `history:${h.id}`,
        kind: 'history',
        title: h.command,
        subtitle: new Date(h.createdAt).toLocaleString(),
        command: h.command,
        category: h.category,
        score: match.score
      });
    }

    for (const s of saved) {
      const match = fuzzyMatch(q, [
        s.label ?? '',
        s.command,
        s.category ?? '',
        ...(s.tags ?? []),
        s.notes ?? ''
      ]);
      if (!match.matched) continue;
      rows.push({
        id: `saved:${s.id}`,
        kind: 'saved',
        title: s.label || s.command,
        subtitle: s.label ? s.command : s.notes ?? undefined,
        command: s.command,
        category: s.category,
        score: match.score
      });
    }

    for (const nav of NAV_TARGETS) {
      const match = fuzzyMatch(q, [nav.title, nav.subtitle ?? '']);
      if (!match.matched) continue;
      rows.push({ ...nav, score: match.score });
    }

    return rows
      .filter((r) => filter === 'all' || r.kind === filter)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (KIND_ORDER[a.kind] !== KIND_ORDER[b.kind]) {
          return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
        }
        return a.title.localeCompare(b.title);
      })
      .slice(0, 30);
  }, [filter, history, query, saved, templates]);

  const visibleResults = useMemo(() => {
    const q = query.trim();
    if (!q && filter === 'all' && recents.length > 0) {
      return recents.map(recentToResult);
    }
    return allResults;
  }, [allResults, filter, query, recents]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(visibleResults.length - 1, 0)));
  }, [visibleResults.length]);

  useEffect(() => {
    const el = document.getElementById(`command-palette-result-${activeIndex}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const remember = useCallback((result: PaletteResult) => {
    const recent = toRecent(result);
    setRecents((prev) => {
      const next = [recent, ...prev.filter((r) => r.id !== recent.id)].slice(0, 5);
      writeRecents(next);
      return next;
    });
  }, []);

  const actOnResult = useCallback(
    async (result: PaletteResult) => {
      remember(result);
      if (result.kind === 'navigate' && result.path) {
        navigate(result.path);
        onClose();
        return;
      }

      if (result.kind === 'template' && result.command) {
        navigate(seedBuilderPath(result.command, result.category));
        onClose();
        return;
      }

      if ((result.kind === 'history' || result.kind === 'saved') && result.command) {
        const ok = await copyToClipboard(result.command);
        if (ok) toast.success(`${kindLabel(result.kind)} command copied`);
        else toast.error('Could not copy to the clipboard');
        onClose();
      }
    },
    [navigate, onClose, remember, toast]
  );

  const cycleFilter = () => {
    setFilter((cur) => FILTERS[(FILTERS.indexOf(cur) + 1) % FILTERS.length]);
    setActiveIndex(0);
  };

  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      cycleFilter();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleResults.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const result = visibleResults[activeIndex];
      if (result) void actOnResult(result);
    }
  };

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-3 py-16 sm:py-24"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onKeyDown={onDialogKeyDown}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/30
                   dark:border-slate-700 dark:bg-slate-950"
      >
        <div className="border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="command-palette-title"
              className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400"
            >
              Command palette
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded border border-slate-300 px-1.5 py-0.5 font-mono dark:border-slate-700">
                Tab
              </span>
              <span>{filterLabel(filter)}</span>
            </div>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search templates, saved commands, history, or pages..."
            className="mt-3 w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-900
                       placeholder-slate-400 focus:border-sky-600 focus:outline-none
                       dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-600"
            spellCheck={false}
            autoComplete="off"
            aria-controls="command-palette-results"
            aria-activedescendant={
              visibleResults[activeIndex] ? `command-palette-result-${activeIndex}` : undefined
            }
          />
        </div>

        <div
          id="command-palette-results"
          role="listbox"
          className="max-h-[24rem] overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              Loading commands...
            </div>
          )}
          {error && (
            <div className="px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              Failed to load palette data: {error}
            </div>
          )}
          {!loading && !error && visibleResults.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches
            </div>
          )}
          {!loading &&
            !error &&
            visibleResults.map((result, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={`${result.id}-${index}`}
                  id={`command-palette-result-${index}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => void actOnResult(result)}
                  className={
                    'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 dark:border-slate-900 ' +
                    (active
                      ? 'bg-sky-50 dark:bg-sky-950/40'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900')
                  }
                >
                  <span className="mt-0.5 shrink-0 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {kindLabel(result.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm text-slate-900 dark:text-slate-100">
                      {result.title}
                    </span>
                    {result.subtitle && (
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {result.subtitle}
                      </span>
                    )}
                  </span>
                  {result.category && (
                    <span className="shrink-0 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      {result.category}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <span>Enter acts</span>
          <span>Arrow keys select</span>
          <span>Esc closes</span>
          {!query.trim() && filter === 'all' && recents.length > 0 && <span>Showing recent actions</span>}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
