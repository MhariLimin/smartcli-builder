import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Wrench, BookMarked, History as HistoryIcon, Library, Cpu, Network, Terminal } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { usePalette } from '../../context/AppContext';
import { CATALOG_TEMPLATES, HISTORY } from '../../mock/data';

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  group: string;
}

const NAV_ITEMS: Omit<PaletteItem, 'onSelect'>[] = [
  { id: 'nav-builder', label: 'Builder', sublabel: 'Compose a command', icon: <Wrench className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-saved', label: 'Saved commands', sublabel: 'Your saved library', icon: <BookMarked className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-history', label: 'History', sublabel: 'Recent commands', icon: <HistoryIcon className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-catalog', label: 'Catalog', sublabel: 'Browse templates', icon: <Library className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-ai', label: 'AI Generate', sublabel: 'Generate a command with AI', icon: <Cpu className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-k8s', label: 'Kubernetes', sublabel: 'Kubectl helpers', icon: <Network className="w-4 h-4" />, group: 'Navigation' },
  { id: 'nav-ssh', label: 'SSH Workflows', sublabel: 'SSH command workflows', icon: <Terminal className="w-4 h-4" />, group: 'Navigation' },
];

const NAV_PATHS: Record<string, string> = {
  'nav-builder': '/',
  'nav-saved': '/saved',
  'nav-history': '/history',
  'nav-catalog': '/catalog',
  'nav-ai': '/ai',
  'nav-k8s': '/kubernetes',
  'nav-ssh': '/ssh',
};

export function CommandPalette() {
  const { isOpen, close } = usePalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems: PaletteItem[] = [
    ...NAV_ITEMS.map((item) => ({
      ...item,
      onSelect: () => { navigate(NAV_PATHS[item.id]); close(); },
    })),
    ...CATALOG_TEMPLATES.slice(0, 8).map((t) => ({
      id: `template-${t.id}`,
      label: t.name,
      sublabel: t.category,
      icon: <Library className="w-4 h-4" />,
      group: 'Templates',
      onSelect: () => { navigate(`/catalog?q=${encodeURIComponent(t.name)}`); close(); },
    })),
    ...HISTORY.slice(0, 5).map((h) => ({
      id: `history-${h.id}`,
      label: h.command.length > 60 ? h.command.slice(0, 60) + '…' : h.command,
      sublabel: h.category,
      icon: <HistoryIcon className="w-4 h-4" />,
      group: 'Recent',
      onSelect: () => { navigate('/history'); close(); },
    })),
  ];

  const filtered = query.trim()
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.sublabel?.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 12);

  const groups = [...new Set(filtered.map((i) => i.group))];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      filtered[activeIndex]?.onSelect();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in" role="presentation">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        className="relative w-full max-w-xl bg-navy-850 border border-navy-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-800">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search navigation, commands, templates…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
          />
          <kbd className="text-2xs text-slate-500 bg-navy-800 border border-navy-700 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto" role="listbox">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">No results for "{query}"</div>
          ) : (
            groups.map((group) => {
              const groupItems = filtered.filter((i) => i.group === group);
              return (
                <div key={group}>
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-slate-600">{group}</p>
                  </div>
                  {groupItems.map((item) => {
                    const globalIndex = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={globalIndex === activeIndex}
                        onClick={item.onSelect}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          globalIndex === activeIndex
                            ? 'bg-navy-800 text-slate-100'
                            : 'text-slate-300 hover:bg-navy-800'
                        )}
                      >
                        <span className="text-slate-500 flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block">{item.label}</span>
                          {item.sublabel && (
                            <span className="text-xs text-slate-500 truncate block">{item.sublabel}</span>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-navy-800 px-4 py-2 flex items-center gap-3 text-xs text-slate-600">
          <span><kbd className="font-mono bg-navy-800 border border-navy-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-navy-800 border border-navy-700 rounded px-1">↵</kbd> select</span>
          <span><kbd className="font-mono bg-navy-800 border border-navy-700 rounded px-1">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
