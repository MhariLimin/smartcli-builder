import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

// Two explicit modes only. The original ship included a third 'system' mode
// but users couldn't visually distinguish it from 'dark' on a dark-preferring
// OS (it correctly resolved to the same palette), so it was dropped. The OS
// preference is still consulted once on first ever load to seed a sensible
// default; after that the user's explicit choice persists.
export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'smartcli-web.theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // localStorage may throw in private mode / when disabled.
  }
  // First-ever load: seed from the OS preference so users with a dark OS
  // don't get a flash of light, and vice versa.
  if (typeof window !== 'undefined' && window.matchMedia(DARK_MEDIA_QUERY).matches) {
    return 'dark';
  }
  return 'light';
}

function applyToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readInitialMode());

  useEffect(() => {
    applyToDocument(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore — preference simply won't persist this session.
    }
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode }),
    [mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
