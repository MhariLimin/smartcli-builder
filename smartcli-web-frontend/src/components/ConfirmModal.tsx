import { useEffect, useState } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onClose
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-500/40 dark:bg-black/60"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                   rounded-lg p-5 w-full max-w-md mx-4 space-y-4 shadow-lg"
      >
        <div className="flex items-baseline justify-between">
          <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
          {message}
        </p>

        {error && (
          <div className="text-xs text-rose-700 dark:text-rose-300">{error}</div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded
                       text-slate-700 dark:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClick}
            disabled={busy}
            className={
              'px-4 py-1.5 text-sm font-medium rounded text-white transition ' +
              (destructive
                ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900'
                : 'bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900')
            }
            autoFocus
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
