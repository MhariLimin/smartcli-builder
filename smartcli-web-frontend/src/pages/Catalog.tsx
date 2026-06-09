import { useEffect, useMemo, useState } from 'react';
import { BookMarked, Copy, ExternalLink, Library, Lock, Plus, Wrench } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORY_DOCS, categoryLabel } from '../data/categoryDocs';
import { shareCommandToClipboard } from '../lib/shareLink';
import { cn, copyToClipboard } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import { EmptyState, CommandRowSkeleton } from '../components/ui/States';
import { Modal } from '../components/ui/Modal';
import { CommandCode } from '../components/ui/CommandCode';
import { useAuth, useToast } from '../context/AppContext';
import { CATALOG_TEMPLATES } from '../mock/data';
import type { CommandTemplate as ApiTemplate } from '../types';

interface CatalogItem {
  id: string;
  name: string;
  body: string;
  description: string;
  category: string;
  tags: string[];
  isBuiltIn: boolean;
  docsUrl?: string;
  author?: string;
}

function toBuiltIn(template: ApiTemplate, index: number): CatalogItem {
  return {
    id: `builtin-${template.category}-${index}`,
    name: template.description || template.template,
    body: template.template,
    description: template.description,
    category: template.category,
    tags: [],
    isBuiltIn: true,
    docsUrl: CATEGORY_DOCS[template.category]?.docsUrl
  };
}

const WORKSPACE_TEMPLATES: CatalogItem[] = CATALOG_TEMPLATES
  .filter((template) => !template.isBuiltIn)
  .map((template) => ({
    id: `workspace-${template.id}`,
    name: template.name,
    body: template.body,
    description: template.description,
    category: template.category,
    tags: template.tags,
    isBuiltIn: false,
    author: template.author,
    docsUrl: template.docsUrl
  }));

export function CatalogPage() {
  const { isPro, canEdit } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [builtIn, setBuiltIn] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => params.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState(() => params.get('cat') ?? 'all');
  const [source, setSource] = useState<'all' | 'builtin' | 'workspace'>('all');
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  useEffect(() => {
    let alive = true;
    api.templates()
      .then((templates) => {
        if (!alive) return;
        setBuiltIn(templates.map(toBuiltIn));
        setError(null);
      })
      .catch((cause) => alive && setError(String(cause)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    if (activeCategory !== 'all') next.set('cat', activeCategory);
    else next.delete('cat');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [activeCategory, params, search, setParams]);

  const allTemplates = useMemo(() => [...builtIn, ...WORKSPACE_TEMPLATES], [builtIn]);
  const categories = useMemo(
    () => [...new Set(allTemplates.map((template) => template.category))].sort(),
    [allTemplates]
  );
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return allTemplates.filter((template) => {
      if (activeCategory !== 'all' && template.category !== activeCategory) return false;
      if (source === 'builtin' && !template.isBuiltIn) return false;
      if (source === 'workspace' && template.isBuiltIn) return false;
      if (!query) return true;
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.body.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [activeCategory, allTemplates, search, source]);

  const useTemplate = (template: CatalogItem) => {
    const next = new URLSearchParams({ template: template.body, category: template.category });
    navigate(`/?${next.toString()}`);
  };

  const copyTemplate = async (template: CatalogItem) => {
    await copyToClipboard(template.body);
    showToast('Template copied', 'success', 2000);
  };

  const shareTemplate = async (template: CatalogItem) => {
    const result = await shareCommandToClipboard(template.body, template.category);
    showToast(result.message, result.ok ? 'success' : 'warning');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catalog"
        description="Browse the live built-in catalog alongside mock workspace templates."
        actions={
          <div className="flex items-center gap-2">
            {isPro && canEdit ? (
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                New template
              </Button>
            ) : (
              <Badge variant="violet" size="sm">
                <Lock className="mr-1 h-2.5 w-2.5" />
                Workspace templates require Pro
              </Badge>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates..."
          className="w-full sm:w-72"
        />
        <div className="flex items-center gap-1.5">
          {(['all', 'builtin', 'workspace'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                source === value
                  ? 'border-cyan-500/25 bg-cyan-500/15 text-cyan-400'
                  : 'border-navy-700 bg-navy-850 text-slate-400 hover:border-navy-600'
              )}
            >
              {value === 'all'
                ? `All (${allTemplates.length})`
                : value === 'builtin'
                  ? `Built-in (${builtIn.length})`
                  : `Workspace (${WORKSPACE_TEMPLATES.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['all', ...categories].map((category) => {
          const count =
            category === 'all'
              ? allTemplates.length
              : allTemplates.filter((template) => template.category === category).length;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                activeCategory === category
                  ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400'
                  : 'border-navy-700 bg-navy-850 text-slate-400 hover:border-navy-600'
              )}
            >
              {category === 'all' ? 'All categories' : categoryLabel(category)}
              <span className="text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load the live catalog: {error}
        </div>
      )}

      {loading ? (
        <Card className="overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => <CommandRowSkeleton key={index} />)}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Library className="h-6 w-6" />}
          title="No templates found"
          description="Try adjusting your search or filters."
          action={{
            label: 'Clear filters',
            onClick: () => {
              setSearch('');
              setActiveCategory('all');
              setSource('all');
            }
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          {filtered.map((template, index) => (
            <div
              key={template.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(template)}
              onKeyDown={(event) => event.key === 'Enter' && setSelected(template)}
              className={cn(
                'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-navy-800',
                index < filtered.length - 1 && 'border-b border-navy-800'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{template.name}</span>
                  <CategoryBadge category={template.category} />
                  {!template.isBuiltIn && <Badge variant="violet" size="xs">workspace</Badge>}
                </div>
                <code className="block truncate font-mono text-xs text-slate-500">{template.body}</code>
                <p className="mt-0.5 text-xs text-slate-500">{template.description}</p>
              </div>
              <div className="mt-0.5 flex shrink-0 items-center gap-1">
                <RowAction label="Copy" onClick={(event) => { event.stopPropagation(); void copyTemplate(template); }}>
                  <Copy className="h-3.5 w-3.5" />
                </RowAction>
                <RowAction label="Use in Builder" onClick={(event) => { event.stopPropagation(); useTemplate(template); }}>
                  <Wrench className="h-3.5 w-3.5" />
                </RowAction>
              </div>
            </div>
          ))}
        </Card>
      )}

      {selected && (
        <Modal
          isOpen
          onClose={() => setSelected(null)}
          title={selected.name}
          description={selected.description}
          size="lg"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="ghost" size="sm" onClick={() => void shareTemplate(selected)}>Share</Button>
              <Button variant="secondary" size="sm" leftIcon={<BookMarked className="h-4 w-4" />} onClick={() => void copyTemplate(selected)}>
                Copy template
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Wrench className="h-4 w-4" />} onClick={() => useTemplate(selected)}>
                Use in Builder
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={selected.category} />
              <Badge variant={selected.isBuiltIn ? 'muted' : 'violet'} size="xs">
                {selected.isBuiltIn ? 'built-in · live API' : 'workspace · mock'}
              </Badge>
              {selected.author && <span className="text-xs text-slate-500">by {selected.author}</span>}
            </div>
            <CommandCode command={selected.body} placeholderValues={{}} showCopy />
            {selected.docsUrl && (
              <a
                href={selected.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-cyan-400 transition-colors hover:text-cyan-300"
              >
                <ExternalLink className="h-3 w-3" />
                Documentation
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function RowAction({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-navy-700 hover:text-slate-200"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
