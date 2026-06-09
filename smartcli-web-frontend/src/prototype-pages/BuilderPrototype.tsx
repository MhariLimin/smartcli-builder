import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Copy, BookMarked, Share2, ChevronRight,
  Terminal, Clock, Zap,
} from 'lucide-react';
import { cn, extractPlaceholders, applyPlaceholders, isDestructiveCommand, debounce, copyToClipboard } from '../lib/boltUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { CommandCode } from '../components/ui/CommandCode';
import { DestructiveWarning } from '../components/ui/Gates';
import { TextInput, Select, SegmentedControl } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth, useToast } from '../context/AppContext';
import { CATALOG_TEMPLATES, HISTORY, SAVED_COMMANDS } from '../mock/data';
import type { CommandTemplate, PlaceholderDef, CommandCategory } from '../mock-types';

type SuggestionSource = 'catalog' | 'saved' | 'history';

interface Suggestion {
  id: string;
  label: string;
  command: string;
  category: CommandCategory;
  source: SuggestionSource;
}

function buildSuggestions(query: string): Suggestion[] {
  if (!query.trim() || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: Suggestion[] = [];

  CATALOG_TEMPLATES.forEach((t) => {
    if (
      t.name.toLowerCase().includes(q) ||
      t.body.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)) ||
      t.category.includes(q)
    ) {
      results.push({ id: `t-${t.id}`, label: t.name, command: t.body, category: t.category, source: 'catalog' });
    }
  });

  SAVED_COMMANDS.forEach((c) => {
    if (c.command.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)) {
      results.push({ id: `s-${c.id}`, label: c.label, command: c.command, category: c.category, source: 'saved' });
    }
  });

  return results.slice(0, 8);
}

const RECENT_HISTORY = HISTORY.slice(0, 5);

export default function Builder() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [commandInput, setCommandInput] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<CommandTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedCommand = activeTemplate
    ? applyPlaceholders(activeTemplate.body, placeholderValues)
    : commandInput;

  const isDestructive = isDestructiveCommand(resolvedCommand);
  const placeholders = activeTemplate
    ? activeTemplate.placeholders
    : extractPlaceholders(commandInput).map<PlaceholderDef>((name) => ({
        name,
        type: 'string',
        label: name,
        required: false,
      }));

  const unfilled = placeholders.filter((p) => p.required && !placeholderValues[p.name]?.trim());

  // Debounced suggestion search
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      setLoading(true);
      setTimeout(() => {
        setSuggestions(buildSuggestions(q));
        setLoading(false);
        setSuggestionsOpen(true);
      }, 150);
    }, 200),
    []
  );

  useEffect(() => {
    if (!commandInput.trim()) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    debouncedSearch(commandInput);
  }, [commandInput, debouncedSearch]);

  const applyTemplate = (t: CommandTemplate) => {
    setActiveTemplate(t);
    setCommandInput(t.body);
    setPlaceholderValues({});
    setSuggestionsOpen(false);
  };

  const applyFromSuggestion = (s: Suggestion) => {
    const template = CATALOG_TEMPLATES.find((t) => `t-${t.id}` === s.id);
    if (template) {
      applyTemplate(template);
    } else {
      setCommandInput(s.command);
      setActiveTemplate(null);
    }
    setSuggestionsOpen(false);
  };

  const handleCopy = async () => {
    if (!resolvedCommand.trim()) return;
    await copyToClipboard(resolvedCommand);
    setCopied(true);
    showToast('Command copied to clipboard', 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReuseHistory = (cmd: string) => {
    setCommandInput(cmd);
    setActiveTemplate(null);
    setPlaceholderValues({});
    inputRef.current?.focus();
  };

  const handleSave = () => {
    showToast(`"${saveLabel || 'Command'}" saved`, 'success');
    setShowSaveModal(false);
    setSaveLabel('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); applyFromSuggestion(suggestions[activeIndex]); }
    if (e.key === 'Escape') setSuggestionsOpen(false);
  };

  const updatePlaceholder = (name: string, value: string) => {
    setPlaceholderValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Builder"
        description="Compose commands with confidence — fill placeholders, review warnings, then copy."
        actions={
          <div className="flex items-center gap-1.5">
            <Badge variant="info" size="xs">
              <Terminal className="w-2.5 h-2.5 mr-1" />
              Copy-only
            </Badge>
          </div>
        }
      />

      {/* Recent commands strip */}
      {RECENT_HISTORY.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-500">Recent</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {RECENT_HISTORY.map((h) => (
              <button
                key={h.id}
                onClick={() => handleReuseHistory(h.command)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
                  'bg-navy-850 border-navy-700 text-slate-300 hover:border-navy-600 hover:text-slate-100',
                  'max-w-[200px] truncate'
                )}
                title={h.command}
              >
                <CategoryBadge category={h.category} />
                <span className="truncate font-mono">{h.command.slice(0, 30)}{h.command.length > 30 ? '…' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main composer */}
      <Card className="p-4 space-y-4">
        {/* Command input */}
        <div className="relative">
          <label htmlFor="command-input" className="block text-xs font-medium text-slate-400 mb-1.5">
            Command
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-cyan-500 font-mono text-sm select-none pointer-events-none">$</span>
            <input
              ref={inputRef}
              id="command-input"
              type="text"
              value={commandInput}
              onChange={(e) => {
                setCommandInput(e.target.value);
                if (activeTemplate && e.target.value !== activeTemplate.body) {
                  setActiveTemplate(null);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              placeholder="Type a command or use ↑ to browse suggestions…"
              className={cn(
                'w-full bg-navy-950 border border-navy-700 rounded-xl',
                'pl-8 pr-4 py-3 font-mono text-sm text-slate-100 placeholder-slate-600',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500',
                'transition-colors duration-150'
              )}
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="suggestions-list"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-3 w-4 h-4 border-2 border-cyan-500/40 border-t-cyan-500 rounded-full animate-spin" />
            )}
          </div>

          {/* Suggestions dropdown */}
          {suggestionsOpen && suggestions.length > 0 && (
            <div
              id="suggestions-list"
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1 z-20 bg-navy-850 border border-navy-700 rounded-xl shadow-xl overflow-hidden animate-slide-down"
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => applyFromSuggestion(s)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === activeIndex ? 'bg-navy-800' : 'hover:bg-navy-800'
                  )}
                >
                  <CategoryBadge category={s.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{s.label}</p>
                    <p className="text-xs font-mono text-slate-500 truncate">{s.command.slice(0, 60)}{s.command.length > 60 ? '…' : ''}</p>
                  </div>
                  <Badge variant={s.source === 'catalog' ? 'muted' : 'success'} size="xs">
                    {s.source}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {commandInput && suggestions.length === 0 && !loading && !suggestionsOpen && (
            <p className="text-xs text-slate-500 mt-1">No template suggestions — using free-form mode.</p>
          )}
        </div>

        {/* Active template label */}
        {activeTemplate && (
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="xs">Template applied</Badge>
            <span className="text-xs text-slate-400">{activeTemplate.name}</span>
            <button
              onClick={() => { setActiveTemplate(null); setCommandInput(''); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Placeholder form */}
        {placeholders.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-navy-800">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs font-medium text-slate-400">Fill placeholders</span>
              {unfilled.length > 0 && (
                <Badge variant="warning" size="xs">{unfilled.length} required</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {placeholders.map((p) => (
                <PlaceholderControl
                  key={p.name}
                  def={p}
                  value={placeholderValues[p.name] ?? ''}
                  onChange={(v) => updatePlaceholder(p.name, v)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {resolvedCommand && (
          <div className="pt-2 border-t border-navy-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Preview</span>
              {unfilled.length === 0 && resolvedCommand && (
                <span className="text-xs text-cyan-400">Ready to copy</span>
              )}
            </div>
            <CommandCode
              command={resolvedCommand.replace(
                /\{\{([^}]+)\}\}/g,
                (_, name) => placeholderValues[name.trim()] ? `{{${name}}}` : `{{${name}}}`
              )}
              placeholderValues={placeholderValues}
              showCopy={false}
            />
          </div>
        )}

        {/* Destructive warning */}
        {isDestructive && <DestructiveWarning />}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-navy-800">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Copy className="w-4 h-4" />}
            onClick={handleCopy}
            disabled={!resolvedCommand.trim()}
            className={copied ? 'bg-green-500 hover:bg-green-400' : ''}
          >
            {copied ? 'Copied!' : 'Copy command'}
          </Button>
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BookMarked className="w-4 h-4" />}
                onClick={() => { setSaveLabel(''); setShowSaveModal(true); }}
                disabled={!resolvedCommand.trim()}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Share2 className="w-4 h-4" />}
                onClick={() => { copyToClipboard(window.location.href); showToast('Share link copied', 'info'); }}
                disabled={!resolvedCommand.trim()}
              >
                Share
              </Button>
            </>
          ) : null}
          <div className="flex-1" />
          <kbd className="hidden sm:inline text-2xs text-slate-600 bg-navy-800 border border-navy-700 rounded px-1.5 py-0.5 font-mono">
            ⌘K to search
          </kbd>
        </div>
      </Card>

      {/* Quick template picks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Popular templates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATALOG_TEMPLATES.slice(0, 4).map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                'bg-navy-850 border-navy-700 hover:border-navy-600 hover:bg-navy-800'
              )}
            >
              <CategoryBadge category={t.category} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                <p className="text-xs font-mono text-slate-500 truncate mt-0.5">{t.body.slice(0, 45)}{t.body.length > 45 ? '…' : ''}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Save modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save command"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!saveLabel.trim()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextInput
            label="Label"
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            placeholder="E.g. Rollout restart production API"
            required
            autoFocus
          />
          <div className="bg-navy-950 border border-navy-800 rounded-lg p-3">
            <p className="text-xs font-mono text-slate-400 break-all">{resolvedCommand}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PlaceholderControl({
  def,
  value,
  onChange,
}: {
  def: PlaceholderDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const filled = value.trim() !== '';

  if (def.type === 'boolean') {
    return (
      <label className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
        filled ? 'border-green-500/30 bg-green-500/5' : 'border-navy-700 bg-navy-850'
      )}>
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="accent-cyan-500"
        />
        <div>
          <span className="text-sm text-slate-200">{def.label ?? def.name}</span>
          {def.description && <p className="text-xs text-slate-500">{def.description}</p>}
        </div>
      </label>
    );
  }

  if (def.type === 'enum' && def.options) {
    if (def.options.length <= 4) {
      return (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {def.label ?? def.name}
            {def.required && <span className="text-amber-400 ml-0.5">*</span>}
          </label>
          <SegmentedControl
            options={def.options.map((o) => ({ value: o, label: o }))}
            value={value || def.default || def.options[0]}
            onChange={onChange}
          />
        </div>
      );
    }
    return (
      <Select
        label={def.label ?? def.name}
        value={value || def.default || ''}
        onChange={(e) => onChange(e.target.value)}
        required={def.required}
        options={[
          { value: '', label: `Select ${def.label ?? def.name}…`, disabled: true },
          ...def.options.map((o) => ({ value: o, label: o })),
        ]}
      />
    );
  }

  if (def.type === 'number') {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          {def.label ?? def.name}
          {def.required && <span className="text-amber-400 ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(String(Math.max(0, parseInt(value || def.default || '0') - 1)))}
            className="w-8 h-9 flex items-center justify-center bg-navy-850 border border-navy-700 rounded-l-lg text-slate-300 hover:bg-navy-800 transition-colors text-lg leading-none"
          >
            −
          </button>
          <input
            type="number"
            value={value || def.default || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex-1 h-9 bg-navy-850 border-y text-sm text-center text-slate-100 focus:outline-none transition-colors',
              filled ? 'border-green-500/50' : 'border-navy-700'
            )}
            min={0}
          />
          <button
            type="button"
            onClick={() => onChange(String(parseInt(value || def.default || '0') + 1))}
            className="w-8 h-9 flex items-center justify-center bg-navy-850 border border-navy-700 rounded-r-lg text-slate-300 hover:bg-navy-800 transition-colors text-lg leading-none"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <TextInput
      label={def.label ?? def.name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={def.default ?? `Enter ${def.label ?? def.name}…`}
      required={def.required}
      className={cn(filled && 'border-green-500/50 focus:border-green-500')}
    />
  );
}
