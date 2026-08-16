import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { CommandPalette } from './components/CommandPalette';
import { DevScenarioSwitcher } from './components/features/DevScenarioSwitcher';
import { ToastProvider } from './hooks/useToast';
import { ToastViewport } from './components/ToastViewport';
import { BuilderPage } from './pages/Builder';
import { CatalogPage } from './pages/Catalog';
import { HistoryPage } from './pages/History';
import { SavedPage } from './pages/Saved';
import { ShareRedirect } from './pages/ShareRedirect';
import NotFound from './pages/NotFound';
import { usePalette } from './context/AppContext';
import { DEMO_MODE } from './config/demoMode';

const AIGenerate = lazy(() => import('./pages/AIGenerate'));
const BillingReturn = lazy(() => import('./pages/BillingReturn'));
const Kubernetes = lazy(() => import('./pages/Kubernetes'));
const Login = lazy(() => import('./pages/Login'));
const SSHWorkflows = lazy(() => import('./pages/SSHWorkflows'));
const WorkspaceMembers = lazy(() => import('./pages/WorkspaceMembers'));
const WorkspaceSettings = lazy(() => import('./pages/WorkspaceSettings'));

function AppOverlays() {
  const palette = usePalette();
  return (
    <>
      <CommandPalette open={palette.isOpen} onClose={palette.close} />
      {DEMO_MODE && <DevScenarioSwitcher />}
      <ToastViewport />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <Suspense fallback={null}>
            <Routes>
            {DEMO_MODE && <Route path="/login" element={<Login />} />}
            {DEMO_MODE && <Route path="/billing/return" element={<BillingReturn />} />}

            <Route element={<AppShell />}>
              <Route index element={<BuilderPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              {DEMO_MODE && <Route path="/ai" element={<AIGenerate />} />}
              {DEMO_MODE && <Route path="/kubernetes" element={<Kubernetes />} />}
              {DEMO_MODE && <Route path="/ssh" element={<SSHWorkflows />} />}
              {DEMO_MODE && <Route path="/workspace/members" element={<WorkspaceMembers />} />}
              {DEMO_MODE && <Route path="/workspace/settings" element={<WorkspaceSettings />} />}
              <Route path="/c/:payload" element={<ShareRedirect />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          <AppOverlays />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
