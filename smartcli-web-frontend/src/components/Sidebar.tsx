import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  hint: string;
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  mobile?: boolean;
}

function IconBuilder({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7" /><path d="m17 15 3 3-3 3" /></svg>;
}

function IconSaved({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" /></svg>;
}

function IconHistory({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 8v4l3 2" /></svg>;
}

function IconCatalog({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><rect x="3" y="4" width="7" height="7" rx="1" /><rect x="14" y="4" width="7" height="7" rx="1" /><rect x="3" y="13" width="7" height="7" rx="1" /><rect x="14" y="13" width="7" height="7" rx="1" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Builder', icon: IconBuilder, hint: 'Compose a command' },
  { to: '/saved', label: 'Saved', icon: IconSaved, hint: 'Curated library' },
  { to: '/history', label: 'History', icon: IconHistory, hint: 'Copied commands' },
  { to: '/catalog', label: 'Catalog', icon: IconCatalog, hint: 'Browse templates' }
];

export function Sidebar({ collapsed, onToggle, onClose, mobile = false }: Props) {
  return (
    <aside
      aria-label="Primary navigation"
      className={`flex h-full flex-col border-r border-navy-800 bg-navy-900 text-slate-300 shadow-xl shadow-navy-950/10 transition-[width] ${
        mobile ? 'w-64' : collapsed ? 'w-16' : 'w-60'
      } ${mobile ? '' : 'sticky top-14 h-[calc(100vh-3.5rem)]'}`}
    >
      <div className="flex h-12 items-center border-b border-navy-800 px-2">
        {!collapsed && (
          <span className="px-2 text-2xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </span>
        )}
        <button
          type="button"
          onClick={mobile ? onClose : onToggle}
          className="focus-brand ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-navy-800 hover:text-white"
          aria-label={mobile ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <ChevronIcon direction={mobile || !collapsed ? 'left' : 'right'} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `focus-brand group flex min-h-12 items-center rounded-lg border transition ${
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3'
                  } ${
                    isActive
                      ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400 shadow-glow-cyan'
                      : 'border-transparent text-slate-400 hover:bg-navy-800 hover:text-slate-100'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-2xs text-slate-500 group-hover:text-slate-400">
                      {item.hint}
                    </span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-navy-800 p-3">
        <div className={`rounded-lg border border-violet-500/20 bg-violet-500/10 ${collapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            {!collapsed && <span className="text-xs font-medium text-violet-300">Pro tools planned</span>}
          </div>
          {!collapsed && (
            <p className="mt-1.5 text-2xs leading-4 text-slate-500">
              AI, Kubernetes, and SSH stay hidden until their real services ship.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}
