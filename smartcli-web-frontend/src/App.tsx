import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api/client';
import { CommandPreview } from './components/CommandPreview';
import { HistoryPanel } from './components/HistoryPanel';
import { PlaceholderForm } from './components/PlaceholderForm';
import { SuggestionList } from './components/SuggestionList';
import type { HistoryEntry, PlaceholderInfo, Suggestion } from './types';

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

export default function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const debounceRef = useRef<number | null>(null);

  // Initial history fetch.
  useEffect(() => {
    api.history.list().then(setHistory).catch(() => setHistory([]));
  }, []);

  // Debounced suggestion fetch as the user types.
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

  // When a template is chosen, fetch its placeholder metadata and reset values.
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

  const onSelectSuggestion = useCallback((s: Suggestion) => {
    setActiveTemplate(s.text);
    setActiveCategory(s.category);
    // For EXTENSION suggestions the user is still building — keep typing in the search box.
    // Push the chosen prefix back into the query (with trailing space) to drive the next round.
    if (s.kind === 'EXTENSION') {
      setQuery(s.text + ' ');
    } else {
      // Full template selected — keep the text as-is and scroll the suggestions out of focus.
      setQuery(s.text);
      setShowSuggestions(false);
    }
  }, []);

  const onSaveHistory = useCallback(async () => {
    if (!generated) return;
    try {
      const entry = await api.history.add(generated, activeCategory || 'misc');
      setHistory((prev) => [entry, ...prev.filter((p) => p.command !== entry.command)]);
    } catch {
      // ignore; user will see no entry added
    }
  }, [generated, activeCategory]);

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
    // If the user fully cleared / heavily edited the input, also reset the active template
    // so they don't get stuck with stale placeholders.
    if (!v.trim()) {
      setActiveTemplate('');
      setActiveCategory('');
    }
  };

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 p-6 max-w-[1400px] mx-auto">
      <main className="space-y-6 min-w-0">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-100">smartcli-web</h1>
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
          command={generated}
          hasUnfilled={hasUnfilled}
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
