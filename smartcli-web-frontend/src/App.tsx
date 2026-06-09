import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { BuilderPage } from './pages/Builder';
import { CatalogPage } from './pages/Catalog';
import { HistoryPage } from './pages/History';
import { SavedPage } from './pages/Saved';
import { ShareRedirect } from './pages/ShareRedirect';
import { ToastProvider } from './hooks/useToast';
import { ToastViewport } from './components/ToastViewport';
import { api } from './api/client';

export default function App() {
  const [waking, setWaking] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || (!e.ctrlKey && !e.metaKey)) return;
      e.preventDefault();
      setPaletteOpen((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Header
            waking={waking}
            onOpenNavigation={() => setMobileNavOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <div className="flex min-h-0 flex-1">
            <div className="hidden lg:block">
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((value) => !value)}
              />
            </div>

            {mobileNavOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  type="button"
                  className="absolute inset-0 bg-navy-950/75 backdrop-blur-sm"
                  aria-label="Close navigation"
                  onClick={() => setMobileNavOpen(false)}
                />
                <div className="relative h-full w-64 max-w-[85vw] shadow-2xl">
                  <Sidebar
                    collapsed={false}
                    onToggle={() => {}}
                    onClose={() => setMobileNavOpen(false)}
                    mobile
                  />
                </div>
              </div>
            )}

            <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">
              <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
                <Routes>
                  <Route path="/" element={<BuilderPage />} />
                  <Route path="/saved" element={<SavedPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  {/* /c/:payload decodes a share link and redirects to /. */}
                  <Route path="/c/:payload" element={<ShareRedirect />} />
                </Routes>
              </div>
            </main>
          </div>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
      </BrowserRouter>
      <ToastViewport />
    </ToastProvider>
  );
}
