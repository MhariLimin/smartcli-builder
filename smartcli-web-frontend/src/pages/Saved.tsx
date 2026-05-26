import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Folder, SavedCommand } from '../types';

// "Uncategorized" sentinel matches the backend's matching rule for saved
// commands with no folder. The Sidebar folder tree treats it as a virtual
// folder that's always present.
const UNCATEGORIZED = 'uncategorized';

export function SavedPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saved, setSaved] = useState<SavedCommand[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>(UNCATEGORIZED);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch everything once on mount; subsequent edits update state
  // optimistically rather than refetching.
  useEffect(() => {
    let alive = true;
    Promise.all([api.folders.list(), api.saved.list(), api.saved.tags()])
      .then(([f, s, t]) => {
        if (!alive) return;
        setFolders(f);
        setSaved(s);
        setTags(t);
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Per-folder counts for the tree, plus the uncategorized fallback.
  const counts = useMemo(() => {
    const map: Record<string, number> = { [UNCATEGORIZED]: 0 };
    for (const f of folders) map[f.id] = 0;
    for (const s of saved) {
      const key = s.folderId ?? UNCATEGORIZED;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [folders, saved]);

  const visible = useMemo(() => {
    return saved.filter((s) => {
      const folderKey = s.folderId ?? UNCATEGORIZED;
      if (folderKey !== activeFolder) return false;
      if (activeTag && !(s.tags ?? []).includes(activeTag)) return false;
      return true;
    });
  }, [saved, activeFolder, activeTag]);

  const onNewFolder = async () => {
    const name = window.prompt('Folder name')?.trim();
    if (!name) return;
    try {
      const created = await api.folders.create(name);
      setFolders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveFolder(created.id);
    } catch (e) {
      setError(String(e));
    }
  };

  const onRenameFolder = async (folder: Folder) => {
    const name = window.prompt('New folder name', folder.name)?.trim();
    if (!name || name === folder.name) return;
    try {
      const updated = await api.folders.rename(folder.id, name);
      setFolders((prev) =>
        prev
          .map((f) => (f.id === folder.id ? updated : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (e) {
      setError(String(e));
    }
  };

  const onDeleteFolder = async (folder: Folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"? Saved commands inside it move to Uncategorized.`)) return;
    try {
      await api.folders.delete(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      // Cascade: any saved commands pointing at this folder now have
      // folderId=null on the server. Mirror that locally so the list
      // updates without a refetch.
      setSaved((prev) =>
        prev.map((s) => (s.folderId === folder.id ? { ...s, folderId: null } : s))
      );
      if (activeFolder === folder.id) setActiveFolder(UNCATEGORIZED);
    } catch (e) {
      setError(String(e));
    }
  };

  const patch = useCallback(
    async (id: string, body: Parameters<typeof api.saved.update>[1]) => {
      try {
        const updated = await api.saved.update(id, body);
        setSaved((prev) => prev.map((s) => (s.id === id ? updated : s)));
        // Tag changes can introduce or retire chip values — refresh.
        if ('tags' in body) api.saved.tags().then(setTags).catch(() => {});
      } catch (e) {
        setError(String(e));
      }
    },
    []
  );

  const onDeleteSaved = async (s: SavedCommand) => {
    if (!window.confirm(`Delete saved command "${s.label || s.command}"?`)) return;
    try {
      await api.saved.delete(s.id);
      setSaved((prev) => prev.filter((p) => p.id !== s.id));
    } catch (e) {
      setError(String(e));
    }
  };

  const onUseInBuilder = (s: SavedCommand) => {
    const params = new URLSearchParams();
    params.set('template', s.command);
    if (s.category) params.set('category', s.category);
    navigate('/?' + params.toString());
  };

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading saved commands…</div>;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Saved Commands
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Curated library, separate from history. Pick a folder, optionally
          narrow with a tag chip, then copy, edit, or send any row back to
          the Builder.
        </p>
      </header>

      {error && (
        <div className="text-sm text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded p-3">
          {error}{' '}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1">
            Tag filter:
          </span>
          {tags.map((t) => {
            const on = activeTag === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTag(on ? null : t)}
                aria-pressed={on}
                className={
                  'text-[11px] px-2 py-0.5 rounded border transition ' +
                  (on
                    ? 'bg-sky-200 text-sky-900 border-sky-400 dark:bg-sky-900 dark:text-sky-100 dark:border-sky-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700')
                }
              >
                #{t}
              </button>
            );
          })}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-[11px] text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300"
            >
              clear
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
        <aside
          aria-label="Folder tree"
          className="rounded-lg border border-slate-200 dark:border-slate-800
                     bg-slate-50 dark:bg-slate-900 p-3 space-y-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-400">
              Folders
            </span>
            <button
              onClick={onNewFolder}
              className="text-[11px] px-2 py-0.5 rounded border
                         border-sky-300 dark:border-sky-700
                         text-sky-700 dark:text-sky-300
                         hover:bg-sky-100 dark:hover:bg-sky-900/40 transition"
            >
              + New
            </button>
          </div>
          <FolderRow
            label="Uncategorized"
            count={counts[UNCATEGORIZED] ?? 0}
            active={activeFolder === UNCATEGORIZED}
            onSelect={() => setActiveFolder(UNCATEGORIZED)}
          />
          {folders.map((f) => (
            <FolderRow
              key={f.id}
              label={f.name}
              count={counts[f.id] ?? 0}
              active={activeFolder === f.id}
              onSelect={() => setActiveFolder(f.id)}
              onRename={() => onRenameFolder(f)}
              onDelete={() => onDeleteFolder(f)}
            />
          ))}
        </aside>

        <section className="space-y-2">
          {visible.length === 0 && (
            <div className="text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
              {activeTag
                ? `No saved commands match #${activeTag} here. Clear the tag filter or pick another folder.`
                : 'No saved commands here yet. Use the "Save to folder…" button in the Builder.'}
            </div>
          )}
          {visible.map((s) => (
            <SavedRow
              key={s.id}
              row={s}
              folders={folders}
              expanded={expandedRow === s.id}
              onToggleExpand={() => setExpandedRow((cur) => (cur === s.id ? null : s.id))}
              onPatch={(body) => patch(s.id, body)}
              onCopy={() => onCopy(s.command)}
              onUseInBuilder={() => onUseInBuilder(s)}
              onDelete={() => onDeleteSaved(s)}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function FolderRow({
  label,
  count,
  active,
  onSelect,
  onRename,
  onDelete
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={
          'w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-sm transition ' +
          (active
            ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-100'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800')
        }
      >
        <span className="truncate">{label}</span>
        <span className="text-[10px] text-slate-500">{count}</span>
      </button>
      {(onRename || onDelete) && (
        <div className="absolute right-1 top-1 hidden group-hover:flex gap-0.5">
          {onRename && (
            <button
              onClick={onRename}
              title="Rename"
              className="text-[10px] px-1 rounded bg-white dark:bg-slate-800
                         border border-slate-200 dark:border-slate-700
                         text-slate-700 dark:text-slate-300
                         hover:text-sky-700 dark:hover:text-sky-300"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              className="text-[10px] px-1 rounded bg-white dark:bg-slate-800
                         border border-slate-200 dark:border-slate-700
                         text-slate-700 dark:text-slate-300 hover:text-rose-500"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SavedRowProps {
  row: SavedCommand;
  folders: Folder[];
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (body: Parameters<typeof api.saved.update>[1]) => void;
  onCopy: () => void;
  onUseInBuilder: () => void;
  onDelete: () => void;
}

function SavedRow({
  row,
  folders,
  expanded,
  onToggleExpand,
  onPatch,
  onCopy,
  onUseInBuilder,
  onDelete
}: SavedRowProps) {
  const [labelDraft, setLabelDraft] = useState(row.label ?? '');
  const [notesDraft, setNotesDraft] = useState(row.notes ?? '');
  const [tagsDraft, setTagsDraft] = useState((row.tags ?? []).join(', '));

  useEffect(() => {
    // External update (e.g. patch came back) — resync drafts.
    setLabelDraft(row.label ?? '');
    setNotesDraft(row.notes ?? '');
    setTagsDraft((row.tags ?? []).join(', '));
  }, [row.id, row.label, row.notes, row.tags]);

  const commitLabel = () => {
    const next = labelDraft.trim();
    if ((row.label ?? '') === next) return;
    onPatch({ label: next });
  };

  const commitNotes = () => {
    if ((row.notes ?? '') === notesDraft) return;
    onPatch({ notes: notesDraft });
  };

  const commitTags = () => {
    const next = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (JSON.stringify(row.tags ?? []) === JSON.stringify(next)) return;
    onPatch({ tags: next });
  };

  const onFolderChange = (folderId: string) => {
    // Empty string sentinel clears the folder on the backend.
    onPatch({ folderId: folderId === '' ? '' : folderId });
  };

  return (
    <article className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <input
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            placeholder="Add a label…"
            className="w-full bg-transparent border-0 px-0 py-0 text-sm font-medium
                       text-slate-900 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-600
                       focus:outline-none focus:ring-0"
          />
          <code className="block font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
            {row.command}
          </code>
          {(row.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(row.tags ?? []).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded border
                             border-slate-300 dark:border-slate-700
                             bg-white dark:bg-slate-800
                             text-slate-700 dark:text-slate-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0 text-xs">
          <button
            onClick={onCopy}
            className="px-2 py-1 rounded border
                       border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-800
                       text-slate-700 dark:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Copy
          </button>
          <button
            onClick={onUseInBuilder}
            className="px-2 py-1 rounded border
                       border-sky-300 dark:border-sky-700
                       bg-sky-100 dark:bg-sky-900/40
                       text-sky-800 dark:text-sky-100
                       hover:bg-sky-200 dark:hover:bg-sky-900/70"
          >
            Use
          </button>
          <button
            onClick={onToggleExpand}
            className="px-2 py-1 rounded border
                       border-slate-300 dark:border-slate-700
                       bg-white dark:bg-slate-800
                       text-slate-700 dark:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {expanded ? 'Less' : 'Edit'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Folder</span>
              <select
                value={row.folderId ?? ''}
                onChange={(e) => onFolderChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1
                           text-slate-900 dark:text-slate-100"
              >
                <option value="">Uncategorized</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Tags (comma-separated)</span>
              <input
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                onBlur={commitTags}
                onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                placeholder="docker, daily, prod"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1
                           text-slate-900 dark:text-slate-100
                           placeholder-slate-400 dark:placeholder-slate-600
                           focus:outline-none focus:border-sky-500"
              />
            </label>
          </div>
          <label className="text-xs block space-y-1">
            <span className="text-slate-600 dark:text-slate-400">Notes</span>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
              rows={3}
              placeholder="Free-text context…"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1
                         text-slate-900 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-600
                         focus:outline-none focus:border-sky-500"
            />
          </label>
          <div className="flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded
                         text-rose-700 dark:text-rose-300
                         hover:bg-rose-100 dark:hover:bg-rose-900/30"
            >
              Delete saved command
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
