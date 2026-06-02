import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

// One shared feedback channel for the whole app. Replaces the per-component
// inline "flash" spans (each with its own setTimeout) that used to live in
// BuilderView. Success/info toasts auto-dismiss; errors are sticky so the user
// can read them (they sometimes carry a URL). Plain React context — no state
// library, matching the repo convention.
export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (toast: { kind: ToastKind; message: string }) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Successes/info linger ~2.2s — long enough to read, short enough not to nag.
const AUTO_DISMISS_MS = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle !== undefined) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ kind, message }: { kind: ToastKind; message: string }) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message }]);
      // Errors stick until dismissed (may contain a link to copy); the rest
      // auto-clear so feedback never piles up.
      if (kind !== 'error') {
        const handle = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, dismiss }),
    [toasts, show, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// Public emit API. Callers do `const toast = useToast(); toast.success('…')`.
export function useToast() {
  const { show } = useToastContext();
  return useMemo(
    () => ({
      show,
      success: (message: string) => show({ kind: 'success', message }),
      error: (message: string) => show({ kind: 'error', message }),
      info: (message: string) => show({ kind: 'info', message })
    }),
    [show]
  );
}

// Read side, consumed by <ToastViewport> to render the live stack.
export function useToasts() {
  const { toasts, dismiss } = useToastContext();
  return { toasts, dismiss };
}
