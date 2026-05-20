import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { api } from '../api/client';
import { CommandPreview } from './CommandPreview';
import { HistoryPanel } from './HistoryPanel';
import { PlaceholderForm } from './PlaceholderForm';
import { ShortcutHelpModal } from './ShortcutHelpModal';
import { SuggestionList } from './SuggestionList';
import type { HistoryEntry, PlaceholderInfo, Suggestion } from '../types';

const PLACEHOLDER_RE = /<([^>]+)>/g;

const SUGGESTION_LISTBOX_ID = 'builder-suggestions';
const SUGGESTION_OPTION_PREFIX = 'builder-suggestion';

// Detect Mac for the Cmd-Enter vs Ctrl-Enter shortcut. navigator.platform is
// deprecated but still adequate and synchronous; navigator.userAgentData is
// not universally available.
const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPad|iPhone|iPod/.test(navigator.platform || navigator.userAgent || '');

// Shown when the input is empty so first-time users see something to click
// instead of a "no suggestions" message. These commands are real catalog
// entries; clicking one drives the same onSelect flow as a backend suggestion.
const STARTER_SUGGESTIONS: Suggestion[] = [
  {
    text: 'kubectl get pods -n <namespace>',
    description: 'List pods in a namespace',
    category: 'kubectl',
    placeholders: ['namespace'],
    kind: 'TEMPLATE'
  },
  {
    text: 'docker ps',
    description: 'List running containers',
    category: 'docker',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'git status',
    description: 'Show working tree status',
    category: 'git',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'git log --oneline -n 20',
    description: 'Recent commits, one line each',
    category: 'git',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'source ~/.bashrc',
    description: 'Reload bash configuration',
    category: 'shell',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'claude',
    description: 'Start the Claude Code CLI',
    category: 'claude',
    placeholders: [],
    kind: 'TEMPLATE'
  }
];

function extractPlaceholderNames(template: string): string[] {
  const names: string[] = [];
  for (const m of template.matchAll(PLACEHOLDER_RE)) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

function applyValues(template: string, values: Record<string, string>): string {
  return template.replace(PLACEHOLDER_RE, (full, name) => {
    const v = values[name];
    return v && v.trim() ? v : full;
  });
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

interface Props {
  initialTemplate?: string;
  initialCategory?: string;
  resetSignal?: number;
}

export function BuilderView({ initialTemplate = '', initialCategory = '', resetSignal = 0 }: Props) {
  const [query, setQuery] = useState(initialTemplate);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>(initialTemplate);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // When the parent triggers a reset (e.g. user picked a template from the catalog), reseed state.
  useEffect(() => {
    setQuery(initialTemplate);
    setActiveTemplate(initialTemplate);
    setActiveCategory(initialCategory);
    setValues({});
    setShowSuggestions(true);
    setActiveIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    api.history.list().then(setHistory).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const list = await api.suggestions(query, 30);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 120);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!activeTemplate) {
      setPlaceholders([]);
      return;
    }
    api.placeholders(activeTemplate).then((list) => {
      setPlaceholders(list);
      setValues((prev) => {
        const next: Record<string, string> = {};
        for (const p of list) next[p.name] = prev[p.name] ?? '';
        return next;
      });
    });
  }, [activeTemplate]);

  const generated = useMemo(() => applyValues(activeTemplate, values), [activeTemplate, values]);
  const hasUnfilled = useMemo(() => {
    if (!activeTemplate) return false;
    const names = extractPlaceholderNames(activeTemplate);
    return names.some((n) => !values[n] || !values[n].trim());
  }, [activeTemplate, values]);

  // Free-form fallback: when nothing in the catalog matches, treat the raw
  // input as the command so Copy / Save still work (e.g. `source ~/.bashrc && claude`).
  const trimmedQuery = query.trim();
  const isFreeForm = !activeTemplate && trimmedQuery.length > 0;
  const effectiveCommand = activeTemplate ? generated : trimmedQuery;

  // Real backend suggestions take priority; starters fill the empty-query case.
  const startersActive = !trimmedQuery && suggestions.length === 0 && !loading;
  const displayedSuggestions = startersActive ? STARTER_SUGGESTIONS : suggestions;
  const headerLabel = startersActive ? 'Try one of these to get started' : undefined;

  const onSelectSuggestion = useCallback((s: Suggestion) => {
    setActiveTemplate(s.text);
    setActiveCategory(s.category);
    if (s.kind === 'EXTENSION') {
      setQuery(s.text + ' ');
    } else {
      setQuery(s.text);
      setShowSuggestions(false);
    }
    setActiveIndex(-1);
  }, []);

  const onCopy = useCallback(async () => {
    if (!effectiveCommand) return;
    await copyToClipboard(effectiveCommand);
  }, [effectiveCommand]);

  const onSaveHistory = useCallback(async () => {
    if (!effectiveCommand) return;
    try {
      const entry = await api.history.add(effectiveCommand, activeCategory || 'misc');
      setHistory((prev) => [entry, ...prev.filter((p) => p.command !== entry.command)]);
    } catch {
      // ignore
    }
  }, [effectiveCommand, activeCategory]);

  const onReuse = useCallback((entry: HistoryEntry) => {
    setActiveTemplate(entry.command);
    setActiveCategory(entry.category);
    setValues({});
    setQuery(entry.command);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  const onDeleteHistory = useCallback(async (id: string) => {
    await api.history.delete(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const onClearHistory = useCallback(async () => {
    await api.history.clear();
    setHistory([]);
  }, []);

  const onValueChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onQueryChange = (v: string) => {
    setQuery(v);
    setShowSuggestions(true);
    if (!v.trim()) {
      setActiveTemplate('');
      setActiveCategory('');
      return;
    }
    // If the user edits the input away from the picked template, drop the
    // template lock so the preview reflects the edit (otherwise `generated`
    // stays pinned to the originally chosen template). EXTENSION picks set
    // the query to `<text> ` with a trailing space; treat that as "still on
    // the picked template" so the suggestion flow keeps working.
    if (activeTemplate && v !== activeTemplate && v !== activeTemplate + ' ') {
      setActiveTemplate('');
      setActiveCategory('');
    }
  };

  // Keyboard handling on the input:
  // - Cmd/Ctrl-Enter copies the current command (works regardless of list visibility).
  // - When the list is visible: ↑/↓ walks rows, Tab/Enter accepts the active
  //   row, Esc hides the list.
  // - Without an active row, Enter falls through to the browser default
  //   (which is a no-op for an input outside a form).
  const onInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        void onCopy();
        return;
      }
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, displayedSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setActiveIndex(-1);
      } else if (
        (e.key === 'Tab' || e.key === 'Enter') &&
        activeIndex >= 0 &&
        activeIndex < displayedSuggestions.length
      ) {
        e.preventDefault();
        onSelectSuggestion(displayedSuggestions[activeIndex]);
      }
    },
    [displayedSuggestions, showSuggestions, activeIndex, onCopy, onSelectSuggestion]
  );

  // Shift-? opens the shortcut-help modal, but only when focus is outside any
  // text-entry element — otherwise we'd swallow the literal `?` keystroke.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || !e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      const inText =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (inText) return;
      e.preventDefault();
      setHelpOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll the active row into view as the keyboard walks the list.
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(`${SUGGESTION_OPTION_PREFIX}-${activeIndex}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const activeOptionId =
    activeIndex >= 0 ? `${SUGGESTION_OPTION_PREFIX}-${activeIndex}` : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <main className="space-y-6 min-w-0">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-100">Build a command</h2>
          <p className="text-sm text-slate-400">
            Type a command and pick suggestions to build it. Placeholders become input boxes
            you can fill in. Hit <span className="text-slate-200">Copy command</span> when you're done.
            {' '}Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200">
              Shift
            </kbd>
            <span className="text-slate-500"> + </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200">
              ?
            </kbd>{' '}
            for keyboard shortcuts.
          </p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Start typing… e.g. 'kubectl get'"
            className="w-full bg-slate-950 px-4 py-3 font-mono text-base text-slate-100
                       placeholder-slate-600 focus:outline-none border-b border-slate-800"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls={SUGGESTION_LISTBOX_ID}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
          />
          {showSuggestions && (
            <SuggestionList
              items={displayedSuggestions}
              loading={loading}
              headerLabel={headerLabel}
              activeIndex={activeIndex}
              onSelect={onSelectSuggestion}
              onHover={setActiveIndex}
              listboxId={SUGGESTION_LISTBOX_ID}
              optionIdPrefix={SUGGESTION_OPTION_PREFIX}
            />
          )}
          {!showSuggestions && (
            <div className="px-4 py-2 text-xs text-slate-500">
              Suggestions hidden —{' '}
              <button
                onClick={() => setShowSuggestions(true)}
                className="underline hover:text-sky-300"
              >
                show again
              </button>
            </div>
          )}
        </div>

        <PlaceholderForm
          placeholders={placeholders}
          values={values}
          onChange={onValueChange}
        />

        <CommandPreview
          command={effectiveCommand}
          hasUnfilled={hasUnfilled}
          isFreeForm={isFreeForm}
          onSave={onSaveHistory}
          onCopy={onCopy}
        />
      </main>

      <aside className="lg:sticky lg:top-6 h-[calc(100vh-3rem)]">
        <HistoryPanel
          history={history}
          onReuse={onReuse}
          onDelete={onDeleteHistory}
          onClear={onClearHistory}
        />
      </aside>

      {helpOpen && <ShortcutHelpModal isMac={isMac} onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
