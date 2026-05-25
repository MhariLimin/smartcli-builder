import { useEffect, useRef, useState } from 'react';
import { BuilderView } from './components/BuilderView';
import { CatalogView } from './components/CatalogView';
import { Header } from './components/Header';
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
    <div className="min-h-full">
      <Header view={view} onChangeView={setView} waking={waking} />
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            smartcli-web
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compose CLI commands across kubectl, docker, git, ssh, and more.
          </p>
        </section>

        {view === 'builder' && (
          <BuilderView
            initialTemplate={seed.template}
            initialCategory={seed.category}
            resetSignal={resetSignal}
          />
        )}
        {view === 'catalog' && <CatalogView onUseTemplate={onUseTemplate} />}
      </div>
    </div>
  );
}
