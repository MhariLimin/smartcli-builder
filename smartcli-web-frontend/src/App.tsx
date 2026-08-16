import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { CommandPalette } from './components/features/CommandPalette';
import { DevScenarioSwitcher } from './components/features/DevScenarioSwitcher';
import { ToastProvider } from './hooks/useToast';
import { ToastViewport } from './components/ToastViewport';
import { BuilderPage } from './pages/Builder';
import { CatalogPage } from './pages/Catalog';
import { HistoryPage } from './pages/History';
import { SavedPage } from './pages/Saved';
import { ShareRedirect } from './pages/ShareRedirect';
import AIGenerate from './pages/AIGenerate';
import BillingReturn from './pages/BillingReturn';
import Kubernetes from './pages/Kubernetes';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import SSHWorkflows from './pages/SSHWorkflows';
import WorkspaceMembers from './pages/WorkspaceMembers';
import WorkspaceSettings from './pages/WorkspaceSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/billing/return" element={<BillingReturn />} />

            <Route element={<AppShell />}>
              <Route index element={<BuilderPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/ai" element={<AIGenerate />} />
              <Route path="/kubernetes" element={<Kubernetes />} />
              <Route path="/ssh" element={<SSHWorkflows />} />
              <Route path="/workspace/members" element={<WorkspaceMembers />} />
              <Route path="/workspace/settings" element={<WorkspaceSettings />} />
              <Route path="/c/:payload" element={<ShareRedirect />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>

          <CommandPalette />
          <DevScenarioSwitcher />
          <ToastViewport />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
