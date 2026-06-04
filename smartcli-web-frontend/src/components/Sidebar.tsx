import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  // Inline SVGs (24-line monoline) instead of an icon dependency. Each
  // accepts the same className so light/dark colors come through.
  icon: (props: { className?: string }) => JSX.Element;
  hint?: string;
}

function IconBuilder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h10M4 18h7" />
      <path d="M18 14l4 4-4 4" />
    </svg>
  );
}

function IconSaved({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function IconCatalog({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="1" />
      <rect x="14" y="4" width="7" height="7" rx="1" />
      <rect x="3" y="13" width="7" height="7" rx="1" />
      <rect x="14" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Builder', icon: IconBuilder, hint: 'Compose a command' },
  { to: '/saved', label: 'Saved', icon: IconSaved, hint: 'Curated library' },
  { to: '/history', label: 'History', icon: IconHistory, hint: 'Full history log' },
  { to: '/catalog', label: 'Catalog', icon: IconCatalog, hint: 'Browse all templates' }
];

export function Sidebar() {
  return (
    <aside
      aria-label="Primary navigation"
      className="shrink-0 sticky top-[73px] sm:top-[88px] self-start
                 w-14 sm:w-56 transition-[width]
                 px-2 sm:px-3 py-4
                 border-r border-slate-200 dark:border-slate-800
                 bg-slate-50 dark:bg-slate-950/60
                 h-[calc(100vh-73px)] sm:h-[calc(100vh-88px)]"
    >
      <nav>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  'group flex min-h-11 items-center justify-center sm:justify-start gap-3 rounded-md px-2 py-2 ' +
                  'transition border border-transparent ' +
                  (isActive
                    ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-100 ' +
                      'border-sky-300 dark:border-sky-700'
                    : 'text-slate-700 dark:text-slate-300 ' +
                      'hover:bg-slate-200 dark:hover:bg-slate-800')
                }
                title={item.label}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="hidden sm:flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  {item.hint && (
                    <span className="text-[10px] text-slate-500 truncate">{item.hint}</span>
                  )}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
