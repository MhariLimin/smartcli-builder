import { useEffect, useState } from 'react';

interface Props {
  mode: 'create' | 'rename';
  initialValue?: string;
  onSubmit: (name: string) => Promise<void> | void;
  onClose: () => void;
}

export function FolderNameModal({ mode, initialValue = '', onSubmit, onClose }: Props) {
  const [name, setName] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    if (mode === 'rename' && trimmed === initialValue) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (e2) {
      setError(String(e2));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'create' ? 'New folder' : 'Rename folder';
  const cta = mode === 'create' ? 'Create' : 'Save';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-name-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-500/40 dark:bg-black/60"
      onClick={(e) => {
        // Don't let a backdrop click on this nested modal also close the
        // modal it's stacked on top of.
        e.stopPropagation();
        onClose();
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onConfirm}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                   rounded-lg p-5 w-full max-w-md mx-4 space-y-4 shadow-lg"
      >
        <div className="flex items-baseline justify-between">
          <h2 id="folder-name-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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

        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Folder name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. 'Kafka rescue', 'kubectl prod', 'deploys'"
            className="mt-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                       text-sm text-slate-900 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-600
                       focus:outline-none focus:border-sky-500"
            autoFocus
            spellCheck={false}
          />
        </label>

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
            type="submit"
            disabled={busy || !name.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded
                       bg-sky-600 hover:bg-sky-500 text-white
                       disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500"
          >
            {busy ? 'Saving…' : cta}
          </button>
        </div>
      </form>
    </div>
  );
}
