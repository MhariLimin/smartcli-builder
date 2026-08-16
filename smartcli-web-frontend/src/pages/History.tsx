import { useMemo, useState } from 'react';
import { AlertTriangle, Copy, History as HistoryIcon, Trash2, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { classifyDestructiveCommand } from '../lib/destructive';
import { cn, copyToClipboard, formatRelativeTime, groupBy } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { EmptyState, CommandRowSkeleton } from '../components/ui/States';
import { GuestGate } from '../components/ui/Gates';
import { ConfirmDialog } from '../components/ui/Modal';
import { useAuth, useToast } from '../context/AppContext';
import { useHistory } from '../hooks/useHistory';
import type { HistoryEntry } from '../types';

function getGroup(entry: HistoryEntry): string {
  const diff = Date.now() - new Date(entry.createdAt).getTime();
  const days = diff / 86400000;
  if (days < 1) return 'Today';
  if (days < 7) return 'This week';
  return 'Older';
}

export function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { history, loading, remove, clear } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return history;
    return history.filter(
      (entry) =>
        entry.command.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const grouped = groupBy(filtered, getGroup);
  const groups = ['Today', 'This week', 'Older'].filter((group) => grouped[group]?.length > 0);

  const handleCopy = async (entry: HistoryEntry) => {
    await copyToClipboard(entry.command);
    showToast('Command copied', 'success', 2000);
  };

  const handleDelete = async (entry: HistoryEntry) => {
    await remove(entry.id);
    showToast('Entry removed from history', 'info');
    setDeleteTarget(null);
  };

  const handleClearAll = async () => {
    await clear();
    showToast('History cleared', 'info');
    setClearConfirm(false);
  };

  const useInBuilder = (entry: HistoryEntry) => {
    const params = new URLSearchParams({ template: entry.command });
    if (entry.category) params.set('category', entry.category);
    navigate(`/builder?${params.toString()}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-5">
        <PageHeader title="History" description="Recent commands you have copied." />
        <GuestGate
          title="Sign in to view your history"
          description="The mock account layer demonstrates the future authenticated experience. Switch scenarios to inspect the live history UI."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="History"
        description="Commands copied from the real Builder and persisted by the current backend."
        actions={
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setClearConfirm(true)}
            disabled={history.length === 0}
          >
            Clear history
          </Button>
        }
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search commands and categories..."
      />

      {loading ? (
        <Card className="overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => <CommandRowSkeleton key={index} />)}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-6 w-6" />}
          title={searchQuery ? 'No matching history' : 'No history yet'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : 'Commands copied in the Builder are recorded here.'
          }
          action={searchQuery ? undefined : { label: 'Open Builder', onClick: () => navigate('/builder') }}
        />
      ) : (
        groups.map((group) => (
          <section key={group}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group}</p>
            <Card className="overflow-hidden">
              {grouped[group].map((entry, index) => {
                const destructive = classifyDestructiveCommand(entry.command);
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-navy-800',
                      index < grouped[group].length - 1 && 'border-b border-navy-800'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={entry.category} />
                        {destructive && (
                          <Badge variant="warning" size="xs">
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                            destructive
                          </Badge>
                        )}
                      </div>
                      <code className="block break-all font-mono text-xs leading-relaxed text-slate-400">
                        {entry.command}
                      </code>
                      <p className="mt-1 text-xs text-slate-600">{formatRelativeTime(entry.createdAt)}</p>
                    </div>
                    <div className="mt-0.5 flex shrink-0 items-center gap-1">
                      <IconButton label="Copy command" onClick={() => void handleCopy(entry)}>
                        <Copy className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton label="Use in Builder" onClick={() => useInBuilder(entry)}>
                        <Wrench className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton label="Remove from history" danger onClick={() => setDeleteTarget(entry)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>
        ))
      )}

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={() => void handleClearAll()}
        title="Clear history"
        message="This permanently removes all history entries."
        confirmLabel="Clear all"
        danger
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget)}
        title="Remove entry"
        message="Remove this entry from your history?"
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}

function IconButton({
  label,
  danger = false,
  onClick,
  children
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-navy-700 hover:text-slate-200',
        danger && 'hover:text-red-400'
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
