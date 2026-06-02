import { useToasts, type ToastKind } from '../hooks/useToast';

// Per-kind surface. Mirrors the palette the inline flashes used (emerald for
// success, amber for warnings/errors) so the feedback reads the same as before,
// just consolidated into one place.
const KIND_STYLES: Record<ToastKind, string> = {
  success:
    'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 ' +
    'text-emerald-800 dark:text-emerald-200',
  error:
    'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/40 ' +
    'text-amber-800 dark:text-amber-200',
  info:
    'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 ' +
    'text-slate-800 dark:text-slate-200'
};

const KIND_ICON: Record<ToastKind, string> = { success: '✓', error: '⚠', info: 'ℹ' };

export function ToastViewport() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;

  return (
    // aria-live="polite" so new toasts are announced without stealing focus.
    // Width is capped but shrinks on narrow screens so it never overflows.
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2
                 w-[min(24rem,calc(100vw-2rem))]"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={
            'toast-in flex items-start gap-2 rounded-lg border px-3 py-2 shadow-md text-sm ' +
            KIND_STYLES[t.kind]
          }
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            {KIND_ICON[t.kind]}
          </span>
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 -mr-1 rounded px-1 leading-none opacity-70
                       hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
