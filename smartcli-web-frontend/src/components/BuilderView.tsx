import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { api } from '../api/client';
import { HistoryPanel } from './HistoryPanel';
import { PlaceholderForm } from './PlaceholderForm';
import { ShortcutHelpModal } from './ShortcutHelpModal';
import { SuggestionList } from './SuggestionList';
import type { HistoryEntry, PlaceholderInfo, Suggestion } from '../types';

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

// Build a regex from a template by escaping all regex metachars then turning
// every <slot> into `.+`. Used to keep the template lock alive after the user
// substitutes a placeholder (the literal text no longer matches `===`, but
// the structural shape still does).
function templateMatcher(template: string): RegExp {
  const pattern = template
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/<[^>]+>/g, '.+');
  return new RegExp('^' + pattern + '$');
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
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

interface Props {
  initialTemplate?: string;
  initialCategory?: string;
  resetSignal?: number;
}

export function BuilderView({
  initialTemplate = '',
  initialCategory = '',
  resetSignal = 0
}: Props) {
  // Single canonical state: the field IS the command. Copy / Save / preview
  // all act on this string. Eliminates the query vs effectiveCommand dual
  // state that previously needed reconciling.
  const [command, setCommand] = useState(initialTemplate);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  // activeTemplate tracks "what template was picked" purely to preserve the
  // category and the known placeholder list across substitution. The lock
  // drops as soon as the typed text can no longer match the template shape.
  const [activeTemplate, setActiveTemplate] = useState<string>(initialTemplate);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // When the parent triggers a reset (e.g. user picked a template from the catalog), reseed state.
  useEffect(() => {
    setCommand(initialTemplate);
    setActiveTemplate(initialTemplate);
    setActiveCategory(initialCategory);
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
        const list = await api.suggestions(command, 30);
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
  }, [command]);

  useEffect(() => {
    if (!activeTemplate) {
      setPlaceholders([]);
      return;
    }
    api.placeholders(activeTemplate).then(setPlaceholders);
  }, [activeTemplate]);

  // Only show form rows for placeholder slots still literally present in the
  // command. Slot match is by the full literal text (`<port:int=22>`, not
  // just `<port>`) so the typed grammar substitutes correctly. As the user
  // fills a slot, its slot text is replaced and the row disappears on its own.
  const remainingPlaceholders = useMemo(
    () => placeholders.filter((p) => command.includes(p.slot)),
    [placeholders, command]
  );

  const trimmedCommand = command.trim();
  const hasUnfilled = remainingPlaceholders.length > 0;
  const isFreeForm = !activeTemplate && trimmedCommand.length > 0;

  // Real backend suggestions take priority; starters fill the empty-query case.
  const startersActive = !trimmedCommand && suggestions.length === 0 && !loading;
  const displayedSuggestions = startersActive ? STARTER_SUGGESTIONS : suggestions;
  const headerLabel = startersActive ? 'Try one of these to get started' : undefined;

  const onSelectSuggestion = useCallback((s: Suggestion) => {
    setActiveTemplate(s.text);
    setActiveCategory(s.category);
    if (s.kind === 'EXTENSION') {
      setCommand(s.text + ' ');
    } else {
      setCommand(s.text);
      setShowSuggestions(false);
    }
    setActiveIndex(-1);
  }, []);

  // Substitute by full slot text (e.g. "<port:int=22>" → "8080"), not by name,
  // so typed slots collapse correctly. split().join() replaces all occurrences
  // without regex escaping concerns.
  const onFillPlaceholder = useCallback((slot: string, value: string) => {
    setCommand((prev) => prev.split(slot).join(value));
  }, []);

  // Copy → on success, also persist to history (Tier 2 #7). HistoryService
  // dedupes by command text, so a double-click still produces one row.
  const onCopy = useCallback(async () => {
    if (!trimmedCommand) return;
    const ok = await copyToClipboard(command);
    if (!ok) return;
    setCopiedFlash(true);
    setTimeout(() => setCopiedFlash(false), 1500);
    try {
      const entry = await api.history.add(command, activeCategory || 'misc');
      setHistory((prev) => [entry, ...prev.filter((p) => p.command !== entry.command)]);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      // Save is best-effort; clipboard already succeeded.
    }
  }, [trimmedCommand, command, activeCategory]);

  const onReuse = useCallback((entry: HistoryEntry) => {
    setActiveTemplate(entry.command);
    setActiveCategory(entry.category);
    setCommand(entry.command);
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

  // Drop the template lock when the typed text can no longer match the
  // template's shape (modulo placeholder substitution). Substituting `<host>`
  // → `db.local` should NOT drop the lock; rewriting `get` → `describe` should.
  const onCommandChange = (v: string) => {
    setCommand(v);
    setShowSuggestions(true);
    if (!v.trim()) {
      setActiveTemplate('');
      setActiveCategory('');
      return;
    }
    if (activeTemplate) {
      // Suggestion EXTENSION picks set the field to "<text> " with a trailing
      // space; treat that as still on the picked template.
      const candidate = v.endsWith(' ') ? v.slice(0, -1) : v;
      if (candidate !== activeTemplate && !templateMatcher(activeTemplate).test(candidate)) {
        setActiveTemplate('');
        setActiveCategory('');
      }
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
            Type the command directly or pick from suggestions; placeholder slots
            become inputs that substitute in place. <span className="text-slate-200">Copy</span>{' '}
            also saves to history. Press{' '}
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
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
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

          {remainingPlaceholders.length > 0 && (
            <div className="border-t border-slate-800">
              <PlaceholderForm
                placeholders={remainingPlaceholders}
                onFill={onFillPlaceholder}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={onCopy}
              disabled={!trimmedCommand}
              className="px-4 py-2 rounded text-sm font-medium
                         bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500
                         transition"
            >
              {copiedFlash ? 'Copied!' : 'Copy command'}
            </button>
            {savedFlash && (
              <span className="text-xs text-emerald-300">✓ saved to history</span>
            )}
            <div className="ml-auto text-xs">
              {hasUnfilled && (
                <span className="text-amber-300">
                  placeholders still empty — fill above or edit the line directly
                </span>
              )}
              {!hasUnfilled && isFreeForm && (
                <span className="text-sky-300">free-form — saved as typed</span>
              )}
            </div>
          </div>
        </div>
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
