import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { shareCommandToClipboard } from '../lib/shareLink';
import type { Folder, SavedCommand } from '../types';
import { CopyIcon, EditIcon, ShareIcon, TrashIcon, UseIcon } from '../components/icons';
import { FolderNameModal } from '../components/FolderNameModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { Skeleton, SkeletonBar, SkeletonRow } from '../components/Skeleton';

const ROW_ICON_BUTTON =
  'inline-flex items-center justify-center h-8 w-8 rounded border transition ' +
  'border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-800 ' +
  'text-slate-700 dark:text-slate-300 ' +
  'hover:bg-slate-100 dark:hover:bg-slate-700';

const ROW_USE_BUTTON =
  'inline-flex items-center justify-center h-8 w-8 rounded border transition ' +
  'border-sky-300 dark:border-sky-700 ' +
  'bg-sky-100 dark:bg-sky-900/40 ' +
  'text-sky-800 dark:text-sky-100 ' +
  'hover:bg-sky-200 dark:hover:bg-sky-900/70';

// "Uncategorized" sentinel matches the backend's matching rule for saved
// commands with no folder. The Sidebar folder tree treats it as a virtual
// folder that's always present.
const UNCATEGORIZED = 'uncategorized';

type SearchField = 'all' | 'label' | 'command' | 'tag';

function readSearchField(value: string | null): SearchField {
  return value === 'label' || value === 'command' || value === 'tag' ? value : 'all';
}

export function SavedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Unified filter: pick a field to search against (label / command / tag /
  // all) and a query string. Tag chips below the input give a one-click
  // path to set both. Mirrored to ?q=&field= so the filter is deep-linkable.
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [searchField, setSearchField] = useState<SearchField>(() =>
    readSearchField(searchParams.get('field'))
  );
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saved, setSaved] = useState<SavedCommand[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>(UNCATEGORIZED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // Folder-name modal: null = closed; otherwise either 'create' or
  // { mode: 'rename', target } so the same modal serves both flows.
  const [folderModal, setFolderModal] = useState<
    { mode: 'create' } | { mode: 'rename'; target: Folder } | null
  >(null);
  // Confirm-modal state — null while closed; otherwise the destructive
  // action to confirm. Two flavours: folder delete + saved-command delete.
  const [confirm, setConfirm] = useState<
    { kind: 'folder'; target: Folder } | { kind: 'saved'; target: SavedCommand } | null
  >(null);

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

  const trimmedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => {
    return saved.filter((s) => {
      const folderKey = s.folderId ?? UNCATEGORIZED;
      if (folderKey !== activeFolder) return false;
      if (!trimmedQuery) return true;
      switch (searchField) {
        case 'label':
          return (s.label ?? '').toLowerCase().includes(trimmedQuery);
        case 'command':
          return s.command.toLowerCase().includes(trimmedQuery);
        case 'tag':
          return (s.tags ?? []).some((t) => t.toLowerCase().includes(trimmedQuery));
        case 'all':
        default: {
          const hay = `${s.label ?? ''} ${s.command} ${(s.tags ?? []).join(' ')}`.toLowerCase();
          return hay.includes(trimmedQuery);
        }
      }
    });
  }, [saved, activeFolder, trimmedQuery, searchField]);

  // Mirror search to ?q=&field= (replaceState semantics so the filter is
  // deep-linkable without polluting back history).
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const q = query.trim();
    if (q) next.set('q', q);
    else next.delete('q');
    if (searchField !== 'all') next.set('field', searchField);
    else next.delete('field');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [query, searchField, searchParams, setSearchParams]);

  const submitNewFolder = async (name: string) => {
    const created = await api.folders.create(name);
    setFolders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setActiveFolder(created.id);
  };

  const submitRenameFolder = async (folder: Folder, name: string) => {
    const updated = await api.folders.rename(folder.id, name);
    setFolders((prev) =>
      prev
        .map((f) => (f.id === folder.id ? updated : f))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const performDeleteFolder = async (folder: Folder) => {
    await api.folders.delete(folder.id);
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    // Cascade: any saved commands pointing at this folder now have
    // folderId=null on the server. Mirror that locally so the list
    // updates without a refetch.
    setSaved((prev) =>
      prev.map((s) => (s.folderId === folder.id ? { ...s, folderId: null } : s))
    );
    if (activeFolder === folder.id) setActiveFolder(UNCATEGORIZED);
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

  const performDeleteSaved = async (s: SavedCommand) => {
    await api.saved.delete(s.id);
    setSaved((prev) => prev.filter((p) => p.id !== s.id));
  };

  const onUseInBuilder = (s: SavedCommand) => {
    const params = new URLSearchParams();
    params.set('template', s.command);
    if (s.category) params.set('category', s.category);
    navigate('/?' + params.toString());
  };

  const goToBuilder = () => {
    navigate('/');
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

      <div
        className="rounded-lg border border-slate-200 dark:border-slate-800
                   bg-slate-50 dark:bg-slate-900 p-3 space-y-2"
        aria-label="Filters"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
            Filter by
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as SearchField)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded
                         px-2 py-1 text-xs text-slate-900 dark:text-slate-100 normal-case tracking-normal
                         focus:outline-none focus:border-sky-500"
            >
              <option value="all">All</option>
              <option value="label">Label</option>
              <option value="command">Command</option>
              <option value="tag">Tag</option>
            </select>
          </label>
          <div className="relative flex-1 min-w-[12rem]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchField === 'label'
                  ? 'Search by label…'
                  : searchField === 'command'
                  ? 'Search by command text…'
                  : searchField === 'tag'
                  ? 'Search by tag…'
                  : 'Search label, command, or tag…'
              }
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded
                         px-3 py-1.5 font-mono text-sm text-slate-900 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-600"
              spellCheck={false}
              autoComplete="off"
              aria-label="Search saved commands"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400
                           hover:text-slate-900 dark:hover:text-slate-200 px-1 rounded"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {tags.length > 0 && (searchField === 'tag' || searchField === 'all') && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1">
              Tag quick-pick:
            </span>
            {tags.map((t) => {
              const on = searchField === 'tag' && trimmedQuery === t.toLowerCase();
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (on) {
                      setQuery('');
                    } else {
                      setSearchField('tag');
                      setQuery(t);
                    }
                  }}
                  aria-pressed={on}
                  className={
                    'text-[11px] px-2 py-0.5 rounded border transition ' +
                    (on
                      ? 'bg-sky-200 text-sky-900 border-sky-400 dark:bg-sky-900 dark:text-sky-100 dark:border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700')
                  }
                >
                  #{t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
        {loading ? (
          <SavedLoadingState />
        ) : (
          <>
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
                  onClick={() => setFolderModal({ mode: 'create' })}
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
                  onRename={() => setFolderModal({ mode: 'rename', target: f })}
                  onDelete={() => setConfirm({ kind: 'folder', target: f })}
                />
              ))}
            </aside>

            <section className="space-y-2">
              {visible.length === 0 && (
                trimmedQuery ? (
                  <EmptyState
                    icon={<UseIcon width={18} height={18} />}
                    title="No saved commands match"
                    message={`Nothing in this folder matches "${query.trim()}" with the ${searchField} filter.`}
                    actionLabel="Clear search"
                    onAction={() => setQuery('')}
                  />
                ) : (
                  <EmptyState
                    icon={<UseIcon width={18} height={18} />}
                    title="No saved commands here yet"
                    message="Build a command, then use Save to folder to keep it in this library."
                    actionLabel="Build one"
                    onAction={goToBuilder}
                  />
                )
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
                  onShare={() => shareCommandToClipboard(s.command, s.category ?? undefined)}
                  onUseInBuilder={() => onUseInBuilder(s)}
                  onDelete={() => setConfirm({ kind: 'saved', target: s })}
                />
              ))}
            </section>
          </>
        )}
      </div>

      {folderModal && (
        <FolderNameModal
          mode={folderModal.mode}
          initialValue={folderModal.mode === 'rename' ? folderModal.target.name : ''}
          onSubmit={(name) =>
            folderModal.mode === 'create'
              ? submitNewFolder(name)
              : submitRenameFolder(folderModal.target, name)
          }
          onClose={() => setFolderModal(null)}
        />
      )}

      {confirm && confirm.kind === 'folder' && (
        <ConfirmModal
          title="Delete folder?"
          message={`Delete folder "${confirm.target.name}"?\n\nSaved commands inside it move to Uncategorized.`}
          confirmLabel="Delete folder"
          destructive
          onConfirm={() => performDeleteFolder(confirm.target)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm && confirm.kind === 'saved' && (
        <ConfirmModal
          title="Delete saved command?"
          message={`Delete "${confirm.target.label || confirm.target.command}"?\n\nThis cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => performDeleteSaved(confirm.target)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

function SavedLoadingState() {
  return (
    <>
      <aside
        aria-label="Loading folders"
        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 space-y-2"
      >
        <div className="flex items-center justify-between mb-2">
          <SkeletonBar className="w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-2 py-1">
            <SkeletonBar className={i === 0 ? 'w-28' : 'w-20'} />
            <Skeleton className="h-3 w-5" />
          </div>
        ))}
      </aside>
      <section className="space-y-2" aria-label="Loading saved commands">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </section>
    </>
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
  onShare: () => Promise<{ ok: boolean; message: string }>;
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
  onShare,
  onUseInBuilder,
  onDelete
}: SavedRowProps) {
  const [shareFlash, setShareFlash] = useState<{ ok: boolean; message: string } | null>(null);
  const handleShare = async () => {
    const result = await onShare();
    setShareFlash(result);
    window.setTimeout(() => setShareFlash(null), 2500);
  };
  const [labelDraft, setLabelDraft] = useState(row.label ?? '');
  // Drafts for the expanded edit form — staged locally and only flushed when
  // Save is clicked. Re-seeded whenever the row data changes externally or
  // the form (re)opens, so closing without Save discards in-flight edits.
  const [notesDraft, setNotesDraft] = useState(row.notes ?? '');
  const [tagsDraft, setTagsDraft] = useState((row.tags ?? []).join(', '));
  const [folderDraft, setFolderDraft] = useState(row.folderId ?? '');

  useEffect(() => {
    setLabelDraft(row.label ?? '');
    setNotesDraft(row.notes ?? '');
    setTagsDraft((row.tags ?? []).join(', '));
    setFolderDraft(row.folderId ?? '');
  }, [row.id, row.label, row.notes, row.tags, row.folderId, expanded]);

  // Label is the inline title above the action row, not part of the
  // expanded form — keeps its onBlur/Enter commit semantics so users can
  // edit it without opening Edit.
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

  const commitFolder = () => {
    const current = row.folderId ?? '';
    if (current === folderDraft) return;
    // Empty string sentinel clears the folder on the backend.
    onPatch({ folderId: folderDraft });
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
        <div className="flex flex-row gap-1 shrink-0 self-start">
          <button
            onClick={onCopy}
            className={ROW_ICON_BUTTON}
            title="Copy command"
            aria-label="Copy command"
          >
            <CopyIcon />
          </button>
          <button
            onClick={handleShare}
            className={ROW_ICON_BUTTON}
            title="Copy share link"
            aria-label="Copy share link"
          >
            <ShareIcon />
          </button>
          <button
            onClick={onToggleExpand}
            className={ROW_ICON_BUTTON + (expanded ? ' bg-slate-100 dark:bg-slate-700' : '')}
            title={expanded ? 'Collapse details' : 'Edit details'}
            aria-label={expanded ? 'Collapse details' : 'Edit details'}
            aria-expanded={expanded}
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className={ROW_ICON_BUTTON + ' hover:text-rose-600 dark:hover:text-rose-300'}
            title="Delete saved command"
            aria-label="Delete saved command"
          >
            <TrashIcon />
          </button>
          <button
            onClick={onUseInBuilder}
            className={ROW_USE_BUTTON}
            title="Use in Builder"
            aria-label="Use in Builder"
          >
            <UseIcon />
          </button>
        </div>
      </div>
      {shareFlash && (
        <div
          className={
            'text-[11px] ' +
            (shareFlash.ok
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-700 dark:text-amber-300')
          }
          title={shareFlash.message}
        >
          {shareFlash.ok ? '✓ ' : '⚠ '}
          {shareFlash.message}
        </div>
      )}

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Folder</span>
              <select
                value={folderDraft}
                onChange={(e) => setFolderDraft(e.target.value)}
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
              rows={3}
              placeholder="Free-text context…"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1
                         text-slate-900 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-600
                         focus:outline-none focus:border-sky-500"
            />
          </label>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onDelete}
              className={ROW_ICON_BUTTON + ' hover:text-rose-600 dark:hover:text-rose-300'}
              title="Delete saved command"
              aria-label="Delete saved command"
            >
              <TrashIcon />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleExpand}
                className="px-3 py-1.5 text-sm rounded
                           text-slate-700 dark:text-slate-300
                           hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Explicit save: flush every draft in the expanded form
                  // (folder / tags / notes) plus the label above, then
                  // collapse. Drafts get reseeded from row when the form
                  // next opens.
                  commitLabel();
                  commitFolder();
                  commitTags();
                  commitNotes();
                  onToggleExpand();
                }}
                className="px-3 py-1.5 text-sm font-medium rounded
                           bg-sky-600 hover:bg-sky-500 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
