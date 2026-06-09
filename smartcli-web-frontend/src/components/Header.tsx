import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, type ThemeMode } from '../theme/ThemeContext';

interface Props {
  waking: boolean;
  onOpenNavigation: () => void;
  onOpenPalette: () => void;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; hint: string }[] = [
  { mode: 'light', label: 'Light', hint: 'Paper surfaces' },
  { mode: 'dark', label: 'Dark', hint: 'Terminal navy' }
];

export function Header({ waking, onOpenNavigation, onOpenPalette }: Props) {
  const { mode, setMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-navy-800 bg-navy-950/95 text-slate-100 shadow-lg shadow-navy-950/20 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="focus-brand inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-navy-800 hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <Link to="/" className="focus-brand flex shrink-0 items-center gap-2 rounded-lg">
          <img src="/Header_logo.png" alt="SmartCLI" className="h-8 w-auto select-none" draggable={false} />
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">SmartCLI</span>
        </Link>

        <button
          type="button"
          onClick={onOpenPalette}
          className="focus-brand mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-navy-600 hover:text-slate-200 md:flex"
          aria-label="Open command palette"
        >
          <SearchIcon />
          <span className="flex-1">Search commands, templates, and pages</span>
          <kbd className="rounded border border-navy-600 bg-navy-800 px-1.5 py-0.5 font-mono text-2xs text-slate-400">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {waking && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-2xs font-medium text-amber-300 sm:inline-flex"
              role="status"
              aria-live="polite"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse" />
              Waking backend
            </span>
          )}

          <button
            type="button"
            onClick={onOpenPalette}
            className="focus-brand inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-navy-800 hover:text-white md:hidden"
            aria-label="Open command palette"
          >
            <SearchIcon />
          </button>

          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Guest preferences"
              className="focus-brand flex min-h-10 items-center gap-2 rounded-lg border border-navy-700 bg-navy-850 p-1 pr-2 text-slate-200 transition hover:border-navy-600 hover:bg-navy-800"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
                G
              </span>
              <span className="hidden text-xs sm:inline">Guest</span>
              <ChevronDownIcon />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                role="menu"
                onKeyDown={onMenuKeyDown}
                className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm text-slate-800 shadow-2xl dark:border-navy-700 dark:bg-navy-900 dark:text-slate-200"
              >
                <div className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-widest text-slate-500">
                  Appearance
                </div>
                {THEME_OPTIONS.map((option) => {
                  const active = mode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => setMode(option.mode)}
                      className={`focus-brand flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                        active
                          ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400'
                          : 'hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      {option.mode === 'light' ? <SunIcon /> : <MoonIcon />}
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="block text-2xs text-slate-500">{option.hint}</span>
                      </span>
                      {active && <span className="h-2 w-2 rounded-full bg-cyan-500" aria-hidden="true" />}
                    </button>
                  );
                })}
                <div className="mx-2 my-1 border-t border-slate-200 dark:border-navy-700" />
                <p className="px-3 py-2 text-xs leading-5 text-slate-500">
                  Account and workspace controls will appear after authentication ships.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

function ChevronDownIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5" /></svg>;
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 15.2A8 8 0 0 1 8.8 4 8 8 0 1 0 20 15.2Z" /></svg>;
}
