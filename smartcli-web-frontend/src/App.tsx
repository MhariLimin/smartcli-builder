import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
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

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-full">
          <Header waking={waking} />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 sm:py-6 space-y-6">
              <Routes>
                <Route path="/" element={<BuilderPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                {/* /c/:payload decodes a share link and redirects to /. */}
                <Route path="/c/:payload" element={<ShareRedirect />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
      <ToastViewport />
    </ToastProvider>
  );
}
