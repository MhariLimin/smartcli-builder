import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header onMenuClick={() => setMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />
        </div>

        {/* Mobile sidebar drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40" role="presentation">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="relative w-56 h-full bg-navy-900 border-r border-navy-800 animate-slide-down">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              <Sidebar
                collapsed={false}
                onToggle={() => {}}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'min-w-0'
          )}
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-5 sm:py-5">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
