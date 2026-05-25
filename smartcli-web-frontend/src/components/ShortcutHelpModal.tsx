import { useEffect } from 'react';

interface Props {
  isMac: boolean;
  onClose: () => void;
}

export function ShortcutHelpModal({ isMac, onClose }: Props) {
  const mod = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-500/40 dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <h2 id="shortcut-help-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <dl className="space-y-2">
          <Row keys={['↑', '↓']} desc="Move through suggestions" />
          <Row keys={['Tab']} desc="Pick the highlighted suggestion" />
          <Row keys={['Enter']} desc="Pick the highlighted suggestion" />
          <Row keys={['Esc']} desc="Hide the suggestion list" />
          <Row keys={[mod, 'Enter']} desc="Copy the generated command" />
          <Row
            keys={['Shift', '?']}
            desc="Open this help (when focus is outside the text input)"
          />
        </dl>
        <p className="text-xs text-slate-500">
          Tab also moves between placeholder inputs and the Copy / Save buttons.
        </p>
      </div>
    </div>
  );
}

function Row({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <span className="text-slate-500 mx-1">+</span>}
            <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
              {k}
            </kbd>
          </span>
        ))}
      </div>
      <div className="text-slate-700 dark:text-slate-300 text-right">{desc}</div>
    </div>
  );
}
