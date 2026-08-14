import React, {
  createContext, useCallback, useContext, useEffect,
  useReducer, useRef, useState,
} from 'react';
import type { AuthState, Workspace } from '../mock-types';
import { WORKSPACES } from '../mock/data';
import { DEFAULT_SCENARIO, SCENARIOS, type ScenarioId } from '../mock/scenarios';

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [...state.toasts, action.toast] };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type Presence = 'active' | 'idle' | 'dnd' | 'offline';

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  authState: AuthState;
  scenarioId: ScenarioId;
  setScenario: (id: ScenarioId) => void;
  signIn: (email: string, _password: string) => Promise<void>;
  signOut: () => void;
  currentWorkspace: Workspace | null;
  allWorkspaces: Workspace[];
  switchWorkspace: (id: string) => void;
  isPro: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  presence: Presence;
  setPresence: (presence: Presence) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Toast Context ────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Theme Context ────────────────────────────────────────────────────────────

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Command Palette Context ──────────────────────────────────────────────────

interface PaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

// ─── AppProvider ──────────────────────────────────────────────────────────────

let toastCounter = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Theme
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('smartcli-web.theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = (event: MediaQueryListEvent | MediaQueryList) => setSystemTheme(event.matches ? 'dark' : 'light');
    sync(media);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.classList.toggle('light', resolvedTheme === 'light');
    document.documentElement.style.colorScheme = resolvedTheme;
    localStorage.setItem('smartcli-web.theme', mode);
  }, [mode, resolvedTheme]);

  // Auth / Scenario
  const [scenarioId, setScenarioId] = useState<ScenarioId>(() => {
    const stored = localStorage.getItem('scenario') as ScenarioId | null;
    return stored ?? DEFAULT_SCENARIO;
  });

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [presence, setPresence] = useState<Presence>('active');

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const authState = scenario.authState;

  const isAuthenticated = authState.type === 'authenticated';
  const baseWorkspace =
    authState.type === 'authenticated' ? authState.workspace : null;

  const currentWorkspace =
    workspaceId
      ? WORKSPACES.find((w) => w.id === workspaceId) ?? baseWorkspace
      : baseWorkspace;

  const isPro = currentWorkspace?.plan === 'pro';

  const canEdit =
    authState.type === 'authenticated' &&
    (authState.role === 'owner' || authState.role === 'admin' || authState.role === 'member');

  const setScenario = useCallback((id: ScenarioId) => {
    setScenarioId(id);
    setWorkspaceId(null);
    localStorage.setItem('scenario', id);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    // Mock: match by email
    if (email.includes('john')) {
      setScenario('pro-admin');
    } else {
      setScenario('free-owner');
    }
  }, [setScenario]);

  const signOut = useCallback(() => {
    setScenario('guest');
  }, [setScenario]);

  const switchWorkspace = useCallback((id: string) => {
    setWorkspaceId(id);
  }, []);

  // Toasts
  const [{ toasts }, toastDispatch] = useReducer(toastReducer, { toasts: [] });
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    toastDispatch({ type: 'REMOVE', id });
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = `toast-${++toastCounter}`;
      toastDispatch({ type: 'ADD', toast: { id, message, variant, duration } });
      if (duration > 0) {
        timerRefs.current[id] = setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast]
  );

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePalette]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      <AuthContext.Provider
        value={{
          authState,
          scenarioId,
          setScenario,
          signIn,
          signOut,
          currentWorkspace: currentWorkspace ?? null,
          allWorkspaces: isAuthenticated ? WORKSPACES : [],
          switchWorkspace,
          isPro,
          isAuthenticated,
          canEdit,
          presence,
          setPresence,
        }}
      >
        <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
          <PaletteContext.Provider
            value={{ isOpen: paletteOpen, open: openPalette, close: closePalette, toggle: togglePalette }}
          >
            {children}
          </PaletteContext.Provider>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AppProvider');
  return ctx;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside AppProvider');
  return ctx;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside AppProvider');
  return ctx;
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('usePalette must be inside AppProvider');
  return ctx;
}
