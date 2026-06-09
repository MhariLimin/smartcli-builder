import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Sun, Moon, ChevronDown, LogOut, Settings,
  User, Building2, Plus, Check, Menu,
} from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { useAuth, useTheme, usePalette } from '../../context/AppContext';
import { PlanBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/Dropdown';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { authState, isAuthenticated, currentWorkspace, allWorkspaces, switchWorkspace, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { open: openPalette } = usePalette();
  const navigate = useNavigate();

  const user = authState.type === 'authenticated' ? authState.user : null;
  const [backendOnline] = useState(true);

  return (
    <header className="sticky top-0 z-30 h-12 flex items-center justify-between px-3 bg-navy-950 border-b border-navy-800 gap-2">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg">
          <img
            src="/Header_logo.png"
            alt="SmartCLI"
            className="h-7 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <span className="text-sm font-semibold text-slate-100">SmartCLI</span>
          </div>
        </Link>
      </div>

      {/* Center: command palette trigger */}
      <button
        onClick={openPalette}
        className={cn(
          'hidden md:flex flex-1 max-w-xs items-center gap-2 px-3 py-1.5',
          'bg-navy-850 border border-navy-700 rounded-lg text-sm text-slate-500',
          'hover:border-navy-600 hover:text-slate-300 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
        )}
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left text-xs">Search commands, templates…</span>
        <kbd className="text-2xs bg-navy-800 border border-navy-700 rounded px-1.5 py-0.5 font-mono text-slate-500">
          ⌘K
        </kbd>
      </button>

      {/* Right: status, workspace, theme, account */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Backend status */}
        <div className="hidden sm:block">
          <StatusBadge online={backendOnline} />
        </div>

        {/* Workspace switcher */}
        {isAuthenticated && currentWorkspace && (
          <DropdownMenu
            align="right"
            trigger={
              <button className={cn(
                'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm',
                'bg-navy-850 border border-navy-700 hover:border-navy-600',
                'text-slate-200 hover:text-slate-100 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
              )}>
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="max-w-[100px] truncate text-xs">{currentWorkspace.name}</span>
                <PlanBadge plan={currentWorkspace.plan} />
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            }
            items={[
              ...allWorkspaces.map((ws) => ({
                label: ws.name,
                icon: ws.id === currentWorkspace.id ? <Check className="w-4 h-4 text-cyan-400" /> : <Building2 className="w-4 h-4" />,
                onClick: () => switchWorkspace(ws.id),
              })),
              {
                label: 'New workspace',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => navigate('/workspace/settings'),
                dividerBefore: true,
              },
            ]}
          />
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Account */}
        {isAuthenticated && user ? (
          <DropdownMenu
            align="right"
            trigger={
              <button className={cn(
                'flex items-center gap-1.5 rounded-lg p-1',
                'hover:bg-navy-800 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
              )}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {user.displayName.charAt(0)}
                    </span>
                  )}
                </div>
              </button>
            }
            items={[
              { label: user.displayName, icon: <User className="w-4 h-4" />, disabled: true },
              { label: user.email, icon: null as unknown as React.ReactNode, disabled: true },
              { label: 'Workspace settings', icon: <Settings className="w-4 h-4" />, onClick: () => navigate('/workspace/settings'), dividerBefore: true },
              {
                label: 'Sign out',
                icon: <LogOut className="w-4 h-4" />,
                onClick: () => { signOut(); navigate('/'); },
                danger: true,
                dividerBefore: true,
              },
            ]}
          />
        ) : (
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
