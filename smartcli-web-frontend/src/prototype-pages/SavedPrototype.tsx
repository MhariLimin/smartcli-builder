import { useState } from 'react';
import {
  FolderOpen, Folder, Plus, Tag, Copy, Share2, Pencil,
  Trash2, Wrench, MoreHorizontal, Download, Upload, FolderPlus,
  BookMarked,
} from 'lucide-react';
import { cn, copyToClipboard, formatRelativeTime } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { EmptyState, CommandRowSkeleton } from '../components/ui/States';
import { GuestGate, DestructiveWarning } from '../components/ui/Gates';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/Dropdown';
import { SectionHeader } from '../components/ui/PageHeader';
import { useAuth, useToast } from '../context/AppContext';
import { SAVED_COMMANDS, FOLDERS } from '../mock/data';
import type { SavedCommand, Folder as FolderType } from '../mock-types';
import { useNavigate } from 'react-router-dom';

export default function Saved() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'unfiled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavedCommand | null>(null);
  const [editTarget, setEditTarget] = useState<SavedCommand | null>(null);
  const [loading] = useState(false);
  const [commands, setCommands] = useState(SAVED_COMMANDS);
  const [folders] = useState<FolderType[]>(FOLDERS);

  if (!isAuthenticated) {
    return (
      <div className="space-y-5">
        <PageHeader title="Saved" description="Your saved command library." />
        <GuestGate
          title="Sign in to save commands"
          description="Save commands with labels, folders, tags, and notes. Access them anytime across your workspace."
        />
      </div>
    );
  }

  // All tags
  const allTags = [...new Set(commands.flatMap((c) => c.tags))].sort();

  // Filter
  const filtered = commands.filter((c) => {
    if (selectedFolderId === 'unfiled' && c.folderId) return false;
    if (selectedFolderId !== 'all' && selectedFolderId !== 'unfiled' && c.folderId !== selectedFolderId) return false;
    if (activeTags.length > 0 && !activeTags.some((t) => c.tags.includes(t))) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.label.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q)) ||
        c.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = async (cmd: SavedCommand) => {
    await copyToClipboard(cmd.command);
    showToast('Command copied', 'success', 2000);
  };

  const handleDelete = (cmd: SavedCommand) => {
    setCommands((prev) => prev.filter((c) => c.id !== cmd.id));
    showToast(`"${cmd.label}" deleted`, 'info');
    setDeleteTarget(null);
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Saved"
        description="Your command library — organized, searchable, and shareable."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Upload className="w-4 h-4" />}>Import</Button>
            <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/')}>
              New
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 min-h-0">
        {/* Folder rail */}
        <div className="hidden sm:flex flex-col w-48 flex-shrink-0 gap-1">
          <SectionHeader
            title="Folders"
            actions={
              <button className="text-slate-500 hover:text-slate-300 p-1 rounded" aria-label="New folder">
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            }
            className="mb-2"
          />
          {[
            { id: 'all', name: 'All saved', count: commands.length },
            { id: 'unfiled', name: 'Unfiled', count: commands.filter((c) => !c.folderId).length },
            ...folders.map((f) => ({
              id: f.id,
              name: f.name,
              count: commands.filter((c) => c.folderId === f.id).length,
            })),
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedFolderId(item.id as typeof selectedFolderId)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors w-full text-left',
                selectedFolderId === item.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
              )}
            >
              {item.id === 'all' || item.id === 'unfiled' ? (
                <Folder className="w-4 h-4 flex-shrink-0" />
              ) : (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-xs text-slate-600">{item.count}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Search + tags */}
          <div className="space-y-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search commands, labels, tags…"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors border',
                      activeTags.includes(tag)
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        : 'bg-navy-850 text-slate-400 border-navy-700 hover:border-navy-600'
                    )}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Command list */}
          <Card className="overflow-hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <CommandRowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<BookMarked className="w-6 h-6" />}
                title={searchQuery || activeTags.length > 0 ? 'No matching commands' : 'No saved commands'}
                description={
                  searchQuery || activeTags.length > 0
                    ? 'Try adjusting your search or filters.'
                    : 'Commands you save from the Builder appear here.'
                }
                action={searchQuery || activeTags.length > 0 ? undefined : { label: 'Go to Builder', onClick: () => navigate('/') }}
              />
            ) : (
              filtered.map((cmd, i) => (
                <div
                  key={cmd.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3',
                    i < filtered.length - 1 && 'border-b border-navy-800'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200 truncate">{cmd.label}</span>
                      <CategoryBadge category={cmd.category} />
                      {cmd.isDestructive && <Badge variant="warning" size="xs">destructive</Badge>}
                    </div>
                    <code className="text-xs font-mono text-slate-400 truncate block">
                      {cmd.command.length > 80 ? cmd.command.slice(0, 80) + '…' : cmd.command}
                    </code>
                    {cmd.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cmd.tags.map((t) => (
                          <span key={t} className="text-2xs text-slate-500 bg-navy-800 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(cmd.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(cmd)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors"
                      aria-label="Copy command"
                      title="Copy command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <DropdownMenu
                      trigger={
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      }
                      items={[
                        { label: 'Use in Builder', icon: <Wrench className="w-4 h-4" />, onClick: () => navigate(`/?cmd=${encodeURIComponent(cmd.command)}`) },
                        { label: 'Edit', icon: <Pencil className="w-4 h-4" />, onClick: () => setEditTarget(cmd) },
                        { label: 'Share', icon: <Share2 className="w-4 h-4" />, onClick: () => { copyToClipboard(cmd.command); showToast('Link copied', 'info'); } },
                        { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => setDeleteTarget(cmd), danger: true, dividerBefore: true },
                      ]}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete command"
        message={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      {/* Edit modal */}
      {editTarget && (
        <Modal
          isOpen
          onClose={() => setEditTarget(null)}
          title={`Edit: ${editTarget.label}`}
          size="lg"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => { showToast('Changes saved', 'success'); setEditTarget(null); }}>
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Command</p>
              <code className="text-sm font-mono text-slate-300 break-all">{editTarget.command}</code>
            </div>
            {editTarget.isDestructive && <DestructiveWarning />}
            <div className="text-xs text-slate-500">Full editing UI available after backend integration.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
