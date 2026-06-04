import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useTheme, type ThemeMode } from '../theme/ThemeContext';

interface Props {
  waking: boolean;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; hint: string }[] = [
  { mode: 'light', label: 'Light', hint: 'Bright UI' },
  { mode: 'dark', label: 'Dark', hint: 'True-black surfaces' }
];

export function Header({ waking }: Props) {
  const { mode, setMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Close on outside click / Escape so the dropdown behaves like every other
  // menu the user has used. Listeners only attach while it's open.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Tab out should close the menu so focus order is sensible.
    if (e.key === 'Tab') setMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur
                 bg-slate-100 dark:bg-slate-900
                 border-b-2 border-sky-500/60
                 shadow-md shadow-slate-300/40 dark:shadow-black/40"
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-2 sm:py-4 flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/Header_logo.png"
            alt="smartcli-web logo"
            className="h-14 sm:h-20 w-auto select-none"
            draggable={false}
          />
          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              smartcli-web
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
              Compose CLI commands
            </span>
          </div>
        </div>

        {/* Primary navigation moved to the left Sidebar component as part of
            Tier-3 #13. The header now only carries product chrome (logo,
            warm-wake pill, account dropdown). */}
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {waking && (
            <span
              className="min-h-11 inline-flex items-center text-xs px-2 py-1 rounded border
                         border-amber-300 dark:border-amber-700
                         bg-amber-100 dark:bg-amber-900/40
                         text-amber-800 dark:text-amber-200 animate-pulse"
              role="status"
              aria-live="polite"
            >
              waking backend…
            </span>
          )}

        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex min-h-11 items-center gap-2 rounded-full pl-1 pr-2 sm:pr-3 py-1
                       bg-white dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700
                       hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full
                         bg-slate-200 dark:bg-slate-800
                         text-slate-700 dark:text-slate-200
                         text-xs font-semibold"
              aria-hidden="true"
            >
              G
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
              Guest
            </span>
            <span className="text-[10px] text-slate-500" aria-hidden="true">
              ▾
            </span>
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              role="menu"
              onKeyDown={onMenuKeyDown}
              className="absolute right-0 mt-2 w-60 rounded-lg shadow-lg
                         bg-white dark:bg-slate-900
                         border border-slate-200 dark:border-slate-800
                         py-1 text-sm"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-slate-500">
                Theme
              </div>
              <div role="group" className="px-1 pb-1">
                {THEME_OPTIONS.map((opt) => {
                  const active = mode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => setMode(opt.mode)}
                      className={
                        'flex min-h-11 w-full items-center justify-between gap-2 px-3 py-1.5 rounded transition ' +
                        (active
                          ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-100'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800')
                      }
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true" className="w-4 text-center">
                          {active ? '●' : '○'}
                        </span>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
              <MenuItem onClick={() => setMenuOpen(false)}>Profile</MenuItem>
              <MenuItem onClick={() => setMenuOpen(false)}>Settings</MenuItem>
              <MenuItem onClick={() => setMenuOpen(false)}>Log out</MenuItem>
              <div className="px-3 py-2 text-[10px] text-slate-500 italic">
                Sign-in arrives with auth — these are stubs for now.
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  onClick,
  children
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="block min-h-11 w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200
                 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    >
      {children}
    </button>
  );
}
