import { useEffect, useRef, useState } from 'react';
import { BuilderView } from './components/BuilderView';
import { CatalogView } from './components/CatalogView';
import { api } from './api/client';

type View = 'builder' | 'catalog';

export default function App() {
  const [view, setView] = useState<View>('builder');
  const [seed, setSeed] = useState<{ template: string; category: string }>({
    template: '',
    category: ''
  });
  const [resetSignal, setResetSignal] = useState(0);
  const [waking, setWaking] = useState(false);
  const warmWakeFired = useRef(false);

  // Warm-wake: on mount, fire a no-op request so the (possibly sleeping)
  // Render dyno starts cold-booting in parallel with the user reading the UI.
  // The `waking` pill only appears if the request takes longer than ~500ms,
  // so warm-state loads never flash it. Silent on failure.
  useEffect(() => {
    if (warmWakeFired.current) return;
    warmWakeFired.current = true;
    const showAt = window.setTimeout(() => setWaking(true), 500);
    api
      .categories()
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(showAt);
        setWaking(false);
      });
  }, []);

  const onUseTemplate = (template: string, category: string) => {
    setSeed({ template, category });
    setResetSignal((n) => n + 1);
    setView('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-full p-6 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-100">smartcli-web</h1>
          <p className="text-sm text-slate-400">
            Compose CLI commands across kubectl, docker, git, ssh, and more.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {waking && (
            <span
              className="text-xs px-2 py-1 rounded border border-amber-700 bg-amber-900/40 text-amber-200 animate-pulse"
              role="status"
              aria-live="polite"
            >
              waking backend…
            </span>
          )}
          <nav className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('builder')}
              className={
                'px-3 py-1.5 text-sm rounded ' +
                (view === 'builder'
                  ? 'bg-sky-900 text-sky-100'
                  : 'text-slate-300 hover:bg-slate-800')
              }
            >
              Builder
            </button>
            <button
              onClick={() => setView('catalog')}
              className={
                'px-3 py-1.5 text-sm rounded ' +
                (view === 'catalog'
                  ? 'bg-sky-900 text-sky-100'
                  : 'text-slate-300 hover:bg-slate-800')
              }
            >
              Catalog
            </button>
          </nav>
        </div>
      </header>

      {view === 'builder' && (
        <BuilderView
          initialTemplate={seed.template}
          initialCategory={seed.category}
          resetSignal={resetSignal}
        />
      )}
      {view === 'catalog' && <CatalogView onUseTemplate={onUseTemplate} />}
    </div>
  );
}
