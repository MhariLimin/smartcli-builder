import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { CommandPreview } from './CommandPreview';
import { HistoryPanel } from './HistoryPanel';
import { PlaceholderForm } from './PlaceholderForm';
import { SuggestionList } from './SuggestionList';
import type { HistoryEntry, PlaceholderInfo, Suggestion } from '../types';

const PLACEHOLDER_RE = /<([^>]+)>/g;

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

  const debounceRef = useRef<number | null>(null);

  // When the parent triggers a reset (e.g. user picked a template from the catalog), reseed state.
  useEffect(() => {
    setQuery(initialTemplate);
    setActiveTemplate(initialTemplate);
    setActiveCategory(initialCategory);
    setValues({});
    setShowSuggestions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    api.history.list().then(setHistory).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
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

  const onSelectSuggestion = useCallback((s: Suggestion) => {
    setActiveTemplate(s.text);
    setActiveCategory(s.category);
    if (s.kind === 'EXTENSION') {
      setQuery(s.text + ' ');
    } else {
      setQuery(s.text);
      setShowSuggestions(false);
    }
  }, []);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <main className="space-y-6 min-w-0">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-100">Build a command</h2>
          <p className="text-sm text-slate-400">
            Type a command and pick suggestions to build it. Placeholders become input boxes
            you can fill in. Hit <span className="text-slate-200">Copy command</span> when you're done.
          </p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Start typing… e.g. 'kubectl get'"
            className="w-full bg-slate-950 px-4 py-3 font-mono text-base text-slate-100
                       placeholder-slate-600 focus:outline-none border-b border-slate-800"
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
          {showSuggestions && (
            <SuggestionList
              suggestions={suggestions}
              loading={loading}
              onSelect={onSelectSuggestion}
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
    </div>
  );
}
