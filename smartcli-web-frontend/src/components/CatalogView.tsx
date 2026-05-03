import { useEffect, useMemo, useState } from 'react';
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
      <span key={key++} className="text-sky-300">
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

export function CatalogView({ onUseTemplate }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<CommandTemplate[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // One lightweight fetch on mount just to get categories + counts for the cards.
  useEffect(() => {
    setLoadingCounts(true);
    fetch('/api/templates')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CommandTemplate[]>;
      })
      .then((list) => {
        const tally: Record<string, number> = {};
        for (const t of list) tally[t.category] = (tally[t.category] ?? 0) + 1;
        setCounts(tally);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoadingCounts(false));
  }, []);

  // Fetch a category's templates only when the user picks it.
  useEffect(() => {
    if (!selected) {
      setSelectedTemplates([]);
      return;
    }
    setLoadingSelected(true);
    fetch(`/api/templates?category=${encodeURIComponent(selected)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CommandTemplate[]>;
      })
      .then(setSelectedTemplates)
      .catch(() => setSelectedTemplates([]))
      .finally(() => setLoadingSelected(false));
  }, [selected]);

  // Scroll to top on page transitions so it feels like navigating to a new page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [selected]);

  const categories = useMemo(
    () => Object.keys(counts).sort((a, b) => a.localeCompare(b)),
    [counts]
  );

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

  const selectedMeta = selected ? CATEGORY_DOCS[selected] : null;

  // Detail page — shown when a category is selected.
  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          ← Back to categories
        </button>

        <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {categoryLabel(selected)}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
              className="text-xs text-sky-400 hover:text-sky-300 whitespace-nowrap"
            >
              official docs ↗
            </a>
          )}
        </div>

        {loadingSelected && (
          <div className="text-sm text-slate-500">Loading commands…</div>
        )}

        {!loadingSelected && (
          <ul className="space-y-2">
            {selectedTemplates.map((t, idx) => (
              <li
                key={`${selected}-${idx}`}
                className="bg-slate-900 border border-slate-800 rounded p-3
                           hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <code className="block font-mono text-sm text-slate-100 break-all">
                    {highlightTemplate(t.template)}
                  </code>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onCopy(t.template)}
                      className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700
                                 text-slate-200 border border-slate-700"
                      title="Copy template to clipboard"
                    >
                      {copied === t.template ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => onUseTemplate(t.template, t.category)}
                      className="text-xs px-2 py-1 rounded bg-sky-900 hover:bg-sky-800
                                 text-sky-100 border border-sky-700"
                      title="Open this in the builder"
                    >
                      Use
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400">{t.description}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Index page — grid of category cards.
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">Catalog</h2>
        <p className="text-sm text-slate-400">
          Pick a category to see every command and placeholder combination this app can generate
          for it. Each card also links to the upstream documentation.
        </p>
      </header>

      {error && (
        <div className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900 rounded p-3">
          Failed to load catalog: {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loadingCounts && (
          <div className="text-sm text-slate-500 col-span-full">Loading categories…</div>
        )}
        {!loadingCounts &&
          categories.map((cat) => {
            const meta = CATEGORY_DOCS[cat];
            return (
              <div
                key={cat}
                className="relative bg-slate-900 border border-slate-800 rounded-lg
                           hover:border-slate-700 transition-colors"
              >
                <button
                  onClick={() => setSelected(cat)}
                  className="block w-full text-left p-3"
                >
                  <div className="flex items-baseline justify-between gap-2 pr-16">
                    <span className="font-medium text-slate-100 truncate">
                      {categoryLabel(cat)}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {counts[cat] ?? 0}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {meta?.blurb ?? 'CLI commands'}
                  </div>
                </button>
                {meta?.docsUrl && (
                  <a
                    href={meta.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 text-xs text-sky-400 hover:text-sky-300"
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
