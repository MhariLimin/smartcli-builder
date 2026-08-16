import { useNavigate } from 'react-router-dom';
import {
  Building2, Check, ChevronDown, Circle, Laptop, LogOut, Menu,
  Moon, Search, Settings, Sun, User, Users,
} from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { useAuth, usePalette, useTheme, type Presence, type ThemeMode } from '../../context/AppContext';
import { PlanBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/Dropdown';
import { DEMO_MODE } from '../../config/demoMode';

const PRESENCE: Record<Presence, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-400' },
  idle: { label: 'Idle', color: 'bg-amber-400' },
  dnd: { label: 'Do not disturb', color: 'bg-red-400' },
  offline: { label: 'Offline', color: 'bg-slate-500' },
};

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const {
    authState, isAuthenticated, currentWorkspace, allWorkspaces, switchWorkspace,
    signOut, presence, setPresence,
  } = useAuth();
  const { mode, setMode } = useTheme();
  const { open: openPalette } = usePalette();
  const navigate = useNavigate();
  const user = authState.type === 'authenticated' ? authState.user : null;

  const themeItems: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: 'Light theme', icon: <Sun className="h-4 w-4" /> },
    { mode: 'dark', label: 'Dark theme', icon: <Moon className="h-4 w-4" /> },
    { mode: 'system', label: 'System theme', icon: <Laptop className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-11 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/95">
      <div className="flex min-w-0 items-center gap-2">
        {onMenuClick && (
          <button onClick={onMenuClick} className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-slate-200 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <img src="/Header_logo.png" alt="SmartCLI" className="h-7 w-auto object-contain lg:hidden" />
        <button
          onClick={openPalette}
          className="hidden w-64 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-1.5 text-slate-500 transition hover:border-navy-600 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 md:flex"
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 truncate text-left text-xs">Search commands and pages</span>
          <kbd className="rounded border border-navy-700 bg-navy-800 px-1.5 py-0.5 font-mono text-2xs">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {isAuthenticated && currentWorkspace && (
          <DropdownMenu
            align="right"
            trigger={
              <button className="hidden h-8 items-center gap-1 rounded-lg border border-navy-700 bg-navy-850 px-2 text-xs text-slate-200 hover:border-navy-600 sm:flex">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-20 truncate">{currentWorkspace.name}</span>
                <PlanBadge plan={currentWorkspace.plan} />
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
            }
            items={allWorkspaces.map((workspace) => ({
              label: workspace.name,
              icon: workspace.id === currentWorkspace.id ? <Check className="h-4 w-4 text-cyan-400" /> : <Building2 className="h-4 w-4" />,
              onClick: () => switchWorkspace(workspace.id),
            }))}
          />
        )}

        <DropdownMenu
          align="right"
          trigger={
            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-slate-200" aria-label={`Theme: ${mode}`} title={`Theme: ${mode}`}>
              {mode === 'light' ? <Sun className="h-4 w-4" /> : mode === 'dark' ? <Moon className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
            </button>
          }
          items={themeItems.map((item) => ({ ...item, onClick: () => setMode(item.mode), label: `${item.label}${mode === item.mode ? ' ✓' : ''}` }))}
        />

        {isAuthenticated && user ? (
          <DropdownMenu
            align="right"
            trigger={
              <button className="relative rounded-lg p-1 hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Open profile menu">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-violet-500">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-white">{user.displayName.charAt(0)}</span>}
                </div>
                <span className={cn('absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy-950', PRESENCE[presence].color)} aria-label={PRESENCE[presence].label} />
              </button>
            }
            items={[
              { label: user.displayName, icon: <User className="h-4 w-4" />, disabled: true },
              ...((Object.keys(PRESENCE) as Presence[]).map((value) => ({ label: `${PRESENCE[value].label}${presence === value ? ' ✓' : ''}`, icon: <Circle className={cn('h-3 w-3 fill-current', PRESENCE[value].color.replace('bg-', 'text-'))} />, onClick: () => setPresence(value) }))),
              { label: 'Members', icon: <Users className="h-4 w-4" />, onClick: () => navigate('/workspace/members'), dividerBefore: true },
              { label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => navigate('/workspace/settings') },
              { label: 'Sign out', icon: <LogOut className="h-4 w-4" />, onClick: () => { signOut(); navigate('/'); }, danger: true, dividerBefore: true },
            ]}
          />
        ) : DEMO_MODE ? (
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
        ) : null}
      </div>
    </header>
  );
}
