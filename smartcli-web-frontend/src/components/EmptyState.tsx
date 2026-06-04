import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondary
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
              {icon}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{message}</p>
            {secondary && <div className="text-xs text-slate-500 dark:text-slate-500">{secondary}</div>}
          </div>
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded border border-sky-300 dark:border-sky-700 bg-sky-100 dark:bg-sky-900/50 px-3 text-xs font-semibold text-sky-800 dark:text-sky-100 transition hover:bg-sky-200 dark:hover:bg-sky-900"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
