// Placeholder destination. The Saved Commands subsystem itself is Tier-3 #14
// (see saved-commands-directory-context). This page exists today only so the
// sidebar's "Saved" item has somewhere to navigate to without 404'ing.

export function SavedPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Saved Commands
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          A curated, foldered library of commands you've named and grouped.
        </p>
      </header>
      <div
        className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700
                   bg-slate-50 dark:bg-slate-900/60 p-6 text-sm
                   text-slate-600 dark:text-slate-400 space-y-2"
      >
        <p className="font-medium text-slate-800 dark:text-slate-200">
          Not built yet.
        </p>
        <p>
          This subsystem is queued as Tier-3 #14 in the roadmap — folders,
          tags, and notes on top of a new backend service. Until then, use
          <strong className="text-slate-800 dark:text-slate-200"> History </strong>
          to revisit recent commands.
        </p>
      </div>
    </div>
  );
}
