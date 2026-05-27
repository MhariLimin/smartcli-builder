import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Folder, HistoryEntry } from '../types';
import { FolderNameModal } from './FolderNameModal';

interface Props {
  command: string;
  category: string;
  onClose: () => void;
  onSaved?: () => void;
  // Optional history-add callback. When provided, a successful save also
  // appends the command to history so the Recent strip / History page
  // pick it up immediately. HistoryService dedupes by command text on the
  // backend, so a command that was just copied won't show up twice.
  addHistory?: (command: string, category: string) => Promise<HistoryEntry | null>;
}

// Modal launched from BuilderView's "Save to folder…" button. Lets the user
// add a label, pick a folder (or create one inline), apply tags, and attach
// notes before POSTing to /api/saved. Folder list is fetched on mount —
// cheap, single-user, refetch on open is acceptable.
export function SaveToFolderModal({ command, category, onClose, onSaved, addHistory }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>('');
  const [label, setLabel] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    api.folders
      .list()
      .then((f) => alive && setFolders(f))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // While a nested modal is open, let it own the Escape key so we don't
      // close both stacked modals on a single press.
      if (newFolderOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, newFolderOpen]);

  const onCreateFolder = async (name: string) => {
    const created = await api.folders.create(name);
    setFolders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setFolderId(created.id);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await api.saved.create({
        command,
        label: label.trim() || undefined,
        category: category || undefined,
        folderId: folderId || null,
        tags: tagList,
        notes: notes.trim() || undefined
      });
      // Mirror to history so the saved command also shows up as recent
      // activity — fire-and-forget so a history failure doesn't block the
      // canonical save UX.
      if (addHistory) {
        addHistory(command, category || 'misc').catch(() => {});
      }
      onSaved?.();
      onClose();
    } catch (e2) {
      setError(String(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-to-folder-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-500/40 dark:bg-black/60"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                   rounded-lg p-5 w-full max-w-lg mx-4 space-y-4 shadow-lg"
      >
        <div className="flex items-baseline justify-between">
          <h2 id="save-to-folder-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Save to folder
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

        <div className="rounded border border-slate-200 dark:border-slate-800
                        bg-slate-50 dark:bg-slate-800 p-2">
          <code className="block font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
            {command}
          </code>
        </div>

        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Label (optional)</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. 'Restart Kafka consumer pod'"
            className="mt-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                       text-sm text-slate-900 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-600
                       focus:outline-none focus:border-sky-500"
            autoFocus
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Folder</span>
          <div className="mt-1 flex gap-2">
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                         text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">Uncategorized</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNewFolderOpen(true)}
              className="text-xs px-3 py-2 rounded border
                         border-sky-300 dark:border-sky-700
                         text-sky-700 dark:text-sky-300
                         hover:bg-sky-100 dark:hover:bg-sky-900/40"
            >
              + New
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="docker, daily"
            className="mt-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                       text-sm text-slate-900 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-600
                       focus:outline-none focus:border-sky-500"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Why this command, when to use it, gotchas…"
            className="mt-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                       text-sm text-slate-900 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-600
                       focus:outline-none focus:border-sky-500"
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
            disabled={busy || !command.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded
                       bg-sky-600 hover:bg-sky-500 text-white
                       disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
      {newFolderOpen && (
        <FolderNameModal
          mode="create"
          onSubmit={onCreateFolder}
          onClose={() => setNewFolderOpen(false)}
        />
      )}
    </div>
  );
}
