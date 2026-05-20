import { useState } from 'react';

interface Props {
  command: string;
  hasUnfilled: boolean;
  isFreeForm?: boolean;
  onSave: () => void;
  onCopy: () => void | Promise<void>;
}

export function CommandPreview({
  command,
  hasUnfilled,
  isFreeForm = false,
  onSave,
  onCopy
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!command) return;
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold flex items-center justify-between">
        <span>Generated command</span>
        {hasUnfilled && (
          <span className="text-amber-300 normal-case font-normal">
            placeholders still empty — fill them above
          </span>
        )}
        {!hasUnfilled && isFreeForm && (
          <span className="text-sky-300 normal-case font-normal">
            free-form — saved as typed
          </span>
        )}
      </div>
      <pre className="font-mono text-sm bg-slate-950 border border-slate-800 rounded p-3
                      whitespace-pre-wrap break-all text-slate-100">
        {command || <span className="text-slate-600 italic">— pick a suggestion to begin —</span>}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={!command}
          className="px-4 py-2 rounded text-sm font-medium
                     bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500
                     transition"
        >
          {copied ? 'Copied!' : 'Copy command'}
        </button>
        <button
          onClick={onSave}
          disabled={!command}
          className="px-4 py-2 rounded text-sm font-medium
                     bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500
                     transition"
        >
          Save to history
        </button>
      </div>
    </div>
  );
}
