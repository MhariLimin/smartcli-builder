import { Database, FlaskConical } from 'lucide-react';
import { cn } from '../../lib/boltUtils';

export type DataMode = 'prototype' | 'live';

export function DataModeToggle({
  mode,
  onChange
}: {
  mode: DataMode;
  onChange: (mode: DataMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-navy-700 bg-navy-900 p-0.5">
      <button
        type="button"
        onClick={() => onChange('prototype')}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors',
          mode === 'prototype'
            ? 'bg-violet-500/20 text-violet-300'
            : 'text-slate-500 hover:bg-navy-800 hover:text-slate-300'
        )}
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Product preview
      </button>
      <button
        type="button"
        onClick={() => onChange('live')}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors',
          mode === 'live'
            ? 'bg-cyan-500/15 text-cyan-300'
            : 'text-slate-500 hover:bg-navy-800 hover:text-slate-300'
        )}
      >
        <Database className="h-3.5 w-3.5" />
        Live backend
      </button>
    </div>
  );
}
