import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Wrench, BookMarked, History, Library,
  Cpu, Network, Terminal, Sparkles,
  Lock, LogOut, LogIn,
} from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { useAuth } from '../../context/AppContext';
import { RoleBadge } from '../ui/Badge';
import { DEMO_MODE } from '../../config/demoMode';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  pro?: boolean;
  group: 'core' | 'pro';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Builder', to: '/', icon: <Wrench className="w-4 h-4" />, group: 'core' },
  { label: 'Saved', to: '/saved', icon: <BookMarked className="w-4 h-4" />, group: 'core' },
  { label: 'History', to: '/history', icon: <History className="w-4 h-4" />, group: 'core' },
  { label: 'Catalog', to: '/catalog', icon: <Library className="w-4 h-4" />, group: 'core' },
  { label: 'AI Generate', to: '/ai', icon: <Cpu className="w-4 h-4" />, pro: true, group: 'pro' },
  { label: 'Kubernetes', to: '/kubernetes', icon: <Network className="w-4 h-4" />, pro: true, group: 'pro' },
  { label: 'SSH Workflows', to: '/ssh', icon: <Terminal className="w-4 h-4" />, pro: true, group: 'pro' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const { authState, isPro, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const user = authState.type === 'authenticated' ? authState.user : null;
  const role = authState.type === 'authenticated' ? authState.role : null;

  const coreItems = NAV_ITEMS.filter((n) => n.group === 'core');
  const proItems = DEMO_MODE ? NAV_ITEMS.filter((n) => n.group === 'pro') : [];

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'flex flex-col h-full bg-navy-900 border-r border-navy-800 transition-all duration-200 overflow-hidden',
        collapsed ? 'w-12' : 'w-52'
      )}
    >
      {/* Brand and collapse control */}
      <button
        onClick={onToggle}
        className={cn(
          'hidden lg:flex h-12 items-center overflow-hidden rounded-xl text-left hover:bg-navy-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
          collapsed ? 'mx-auto w-10 justify-start px-1' : 'mx-2 px-2'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <img
          src={collapsed ? '/brand/smartcli-mark.svg' : '/brand/smartcli-wordmark.svg'}
          alt="SmartCLI"
          className={collapsed ? 'h-8 w-8' : 'h-8 w-[144px] object-contain object-left'}
        />
      </button>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-4">
        <NavGroup label="Core" collapsed={collapsed}>
          {coreItems.map((item) => (
            <SidebarItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />
          ))}
        </NavGroup>

        {DEMO_MODE && (
          <NavGroup label="Demo previews" collapsed={collapsed}>
            {proItems.map((item) => (
              <SidebarItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                locked={!isPro}
                onClose={onClose}
              />
            ))}
          </NavGroup>
        )}

      </div>

      {/* User area */}
      <div className="border-t border-navy-800 p-2">
        {isAuthenticated && user ? (
          <div className={cn('flex items-center gap-2 px-2 py-2 rounded-lg', !collapsed && 'w-full')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user.displayName}</p>
                {role && <div className="mt-0.5"><RoleBadge role={role} /></div>}
              </div>
            )}
            {!collapsed && (
              <div className="flex items-center gap-1">
                {!isPro && (
                  <button onClick={() => navigate('/billing/return')} className="flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-1 text-[10px] font-semibold text-violet-300 hover:bg-violet-500/25">
                    <Sparkles className="h-3 w-3" /> Upgrade
                  </button>
                )}
                <button onClick={() => { signOut(); navigate('/'); }} className="rounded p-1 text-slate-500 hover:text-slate-300" aria-label="Sign out" title="Sign out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : DEMO_MODE ? (
          <button
            onClick={() => { navigate('/login'); onClose?.(); }}
            className={cn(
              'flex items-center gap-2 px-2 py-2 rounded-lg w-full',
              'text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors text-sm'
            )}
          >
            <LogIn className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign in</span>}
          </button>
        ) : null}
      </div>
    </nav>
  );
}

function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-2 mb-1 text-2xs font-semibold uppercase tracking-widest text-slate-600">
          {label}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  item,
  collapsed,
  locked,
  onClose,
}: {
  item: NavItem;
  collapsed: boolean;
  locked?: boolean;
  onClose?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-100',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
          isActive
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800',
          locked && 'opacity-60'
        )
      }
    >
      <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {locked && <Lock className="w-3 h-3 text-violet-400 flex-shrink-0" />}
        </>
      )}
    </NavLink>
  );
}
