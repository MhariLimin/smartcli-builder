import { useEffect, useMemo, useState } from 'react';
import { shareCommandToClipboard } from '../lib/shareLink';
import type { CommandTemplate } from '../types';
import { CATEGORY_DOCS, categoryLabel } from '../data/categoryDocs';

interface Props {
  onUseTemplate: (template: string, category: string) => void;
}

function highlightTemplate(template: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  const re = /<[^>]+>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last) {
      parts.push(<span key={key++}>{template.slice(last, m.index)}</span>);
    }
    parts.push(
      <span key={key++} className="text-sky-700 dark:text-sky-300">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < template.length) {
    parts.push(<span key={key++}>{template.slice(last)}</span>);
  }
  return parts;
}

function readSearchParam(name: string): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) ?? '';
}

export function CatalogView({ onUseTemplate }: Props) {
  const [allTemplates, setAllTemplates] = useState<CommandTemplate[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Inline flash for the most-recent Share — `template` is the matched row.
  const [shareFlash, setShareFlash] = useState<{ template: string; ok: boolean; message: string } | null>(null);

  // Search state — initialized from `?q=` / `?cat=` on first mount so deep
  // links restore the same view.
  const [query, setQuery] = useState(() => readSearchParam('q'));
  const [chipCategories, setChipCategories] = useState<string[]>(() => {
    const raw = readSearchParam('cat');
    return raw ? raw.split(',').filter(Boolean) : [];
  });

  // Single fetch on mount loads every template (~1718 rows, ~140KB). Kept in
  // memory so search + detail-page filtering are both client-side.
  useEffect(() => {
    setLoading(true);
    fetch('/api/templates')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CommandTemplate[]>;
      })
      .then((list) => {
        setAllTemplates(list);
        const tally: Record<string, number> = {};
        for (const t of list) tally[t.category] = (tally[t.category] ?? 0) + 1;
        setCounts(tally);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Mirror search state to the URL (replaceState so we don't bloat history).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = query.trim();
    if (q) params.set('q', q);
    else params.delete('q');
    if (chipCategories.length > 0) params.set('cat', chipCategories.join(','));
    else params.delete('cat');
    const search = params.toString();
    const url = window.location.pathname + (search ? '?' + search : '');
    window.history.replaceState({}, '', url);
  }, [query, chipCategories]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selected]);

  const categories = useMemo(
    () => Object.keys(counts).sort((a, b) => a.localeCompare(b)),
    [counts]
  );

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0 || chipCategories.length > 0;

  const filteredResults = useMemo(() => {
    if (!isSearching) return [];
    const q = trimmedQuery.toLowerCase();
    return allTemplates.filter((t) => {
      if (chipCategories.length > 0 && !chipCategories.includes(t.category)) return false;
      if (!q) return true;
      return (
        t.template.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [allTemplates, trimmedQuery, chipCategories, isSearching]);

  const selectedTemplates = useMemo(() => {
    if (!selected) return [];
    return allTemplates.filter((t) => t.category === selected);
  }, [allTemplates, selected]);

  const onCopy = async (template: string) => {
    try {
      await navigator.clipboard.writeText(template);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = template;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(template);
    window.setTimeout(() => setCopied((c) => (c === template ? null : c)), 1200);
  };

  const onShare = async (t: CommandTemplate) => {
    const result = await shareCommandToClipboard(t.template, t.category);
    setShareFlash({ template: t.template, ...result });
    window.setTimeout(() => {
      setShareFlash((cur) => (cur && cur.template === t.template ? null : cur));
    }, 2500);
  };

  const toggleChip = (cat: string) => {
    setChipCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearSearch = () => {
    setQuery('');
    setChipCategories([]);
  };

  const selectedMeta = selected ? CATEGORY_DOCS[selected] : null;

  const searchBar = (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all templates… e.g. 'kubectl exec', 'tar gz', 'jwt'"
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5
                     font-mono text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                     focus:outline-none focus:border-sky-600"
          spellCheck={false}
          autoComplete="off"
          aria-label="Search catalog"
        />
        {(trimmedQuery || chipCategories.length > 0) && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400
                       hover:text-slate-900 dark:hover:text-slate-200 px-2 py-1 rounded"
            aria-label="Clear search"
          >
            clear ✕
          </button>
        )}
      </div>
      {isSearching && categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {categories.map((cat) => {
            const active = chipCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleChip(cat)}
                aria-pressed={active}
                className={
                  'text-[11px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border transition ' +
                  (active
                    ? 'bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-100 border-sky-400 dark:border-sky-700'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200')
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Search-results view — takes precedence over detail / index when active.
  if (isSearching) {
    const count = filteredResults.length;
    const queryLabel = trimmedQuery ? <code className="text-slate-700 dark:text-slate-300">{trimmedQuery}</code> : null;
    const chipLabel =
      chipCategories.length > 0 ? (
        <span className="text-slate-600 dark:text-slate-400">
          in {chipCategories.join(', ')}
        </span>
      ) : null;
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Catalog · search</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Free-text match across template text and description, narrow with category chips.
          </p>
        </header>
        {searchBar}
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {loading ? (
            'Loading catalog…'
          ) : (
            <>
              {count} template{count === 1 ? '' : 's'}
              {queryLabel && <> matching {queryLabel}</>}
              {queryLabel && chipLabel && ' '}
              {chipLabel}
            </>
          )}
        </div>
        {!loading && count === 0 && (
          <div className="text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
            No templates match. Try fewer words, check spelling, or clear category chips.
          </div>
        )}
        {!loading && count > 0 && (
          <ul className="space-y-2">
            {filteredResults.map((t, idx) => (
              <li
                key={`${t.category}-${idx}`}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3
                           hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          clearSearch();
                          setSelected(t.category);
                        }}
                        className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5
                                   rounded border bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700
                                   hover:bg-slate-300 dark:hover:bg-slate-700"
                        title={`Browse all ${t.category} templates`}
                      >
                        {t.category}
                      </button>
                    </div>
                    <code className="block font-mono text-sm text-slate-900 dark:text-slate-100 break-all mt-1">
                      {highlightTemplate(t.template)}
                    </code>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.description}</div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCopy(t.template)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700
                                   text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                        title="Copy template to clipboard"
                      >
                        {copied === t.template ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => onShare(t)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700
                                   text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                        title="Copy share link"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => onUseTemplate(t.template, t.category)}
                        className="text-xs px-2 py-1 rounded bg-sky-200 dark:bg-sky-900 hover:bg-sky-300 dark:hover:bg-sky-800
                                   text-sky-800 dark:text-sky-100 border border-sky-400 dark:border-sky-700"
                        title="Open this in the builder"
                      >
                        Use
                      </button>
                    </div>
                    {shareFlash && shareFlash.template === t.template && (
                      <span
                        className={
                          'text-[10px] truncate max-w-[20rem] ' +
                          (shareFlash.ok
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-amber-700 dark:text-amber-300')
                        }
                        title={shareFlash.message}
                      >
                        {shareFlash.ok ? '✓ ' : '⚠ '}
                        {shareFlash.message}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Detail page — single category browse.
  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
        >
          ← Back to categories
        </button>

        {searchBar}

        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {categoryLabel(selected)}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {selectedMeta?.blurb ?? 'CLI commands'}
              {' · '}
              <span className="text-slate-500">
                {counts[selected] ?? 0} command{(counts[selected] ?? 0) === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          {selectedMeta?.docsUrl && (
            <a
              href={selectedMeta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 whitespace-nowrap"
            >
              official docs ↗
            </a>
          )}
        </div>

        {loading && <div className="text-sm text-slate-500">Loading commands…</div>}

        {!loading && (
          <ul className="space-y-2">
            {selectedTemplates.map((t, idx) => (
              <li
                key={`${selected}-${idx}`}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3
                           hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <code className="block font-mono text-sm text-slate-900 dark:text-slate-100 break-all">
                    {highlightTemplate(t.template)}
                  </code>
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCopy(t.template)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700
                                   text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                        title="Copy template to clipboard"
                      >
                        {copied === t.template ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => onShare(t)}
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700
                                   text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                        title="Copy share link"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => onUseTemplate(t.template, t.category)}
                        className="text-xs px-2 py-1 rounded bg-sky-200 dark:bg-sky-900 hover:bg-sky-300 dark:hover:bg-sky-800
                                   text-sky-800 dark:text-sky-100 border border-sky-400 dark:border-sky-700"
                        title="Open this in the builder"
                      >
                        Use
                      </button>
                    </div>
                    {shareFlash && shareFlash.template === t.template && (
                      <span
                        className={
                          'text-[10px] truncate max-w-[20rem] ' +
                          (shareFlash.ok
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-amber-700 dark:text-amber-300')
                        }
                        title={shareFlash.message}
                      >
                        {shareFlash.ok ? '✓ ' : '⚠ '}
                        {shareFlash.message}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.description}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Index — category grid.
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Catalog</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pick a category to see every command and placeholder combination this app can generate
          for it. Each card also links to the upstream documentation. Or search across all
          categories at once.
        </p>
      </header>

      {searchBar}

      {error && (
        <div className="text-sm text-rose-400 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded p-3">
          Failed to load catalog: {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && (
          <div className="text-sm text-slate-500 col-span-full">Loading categories…</div>
        )}
        {!loading &&
          categories.map((cat) => {
            const meta = CATEGORY_DOCS[cat];
            return (
              <div
                key={cat}
                className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg
                           hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
              >
                <button
                  onClick={() => setSelected(cat)}
                  className="block w-full text-left p-3"
                >
                  <div className="flex items-baseline justify-between gap-2 pr-16">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {categoryLabel(cat)}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {counts[cat] ?? 0}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {meta?.blurb ?? 'CLI commands'}
                  </div>
                </button>
                {meta?.docsUrl && (
                  <a
                    href={meta.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
                    title="Open official documentation"
                  >
                    docs ↗
                  </a>
                )}
              </div>
            );
          })}
      </section>
    </div>
  );
}
