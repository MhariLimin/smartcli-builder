import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { api } from '../api/client';
import { classifyDestructiveCommand } from '../lib/destructive';
import { describeRefusal, encode as encodeShare } from '../lib/shareLink';
import { PlaceholderForm } from './PlaceholderForm';
import { SaveToFolderModal } from './SaveToFolderModal';
import { ShortcutHelpModal } from './ShortcutHelpModal';
import { SuggestionList } from './SuggestionList';
import { CheckIcon, CopyIcon, WarningIcon } from './icons';
import { useToast } from '../hooks/useToast';
import type { HistoryEntry, PlaceholderInfo, Suggestion } from '../types';

const SUGGESTION_LISTBOX_ID = 'builder-suggestions';
const SUGGESTION_OPTION_PREFIX = 'builder-suggestion';

// How long the Copy button shows its "Copied!" success state before reverting.
const COPIED_FLASH_MS = 1500;

// Detect Mac for the Cmd-Enter vs Ctrl-Enter shortcut. navigator.platform is
// deprecated but still adequate and synchronous; navigator.userAgentData is
// not universally available.
const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPad|iPhone|iPod/.test(navigator.platform || navigator.userAgent || '');

// Shown when the input is empty so first-time users see something to click
// instead of a "no suggestions" message. These commands are real catalog
// entries; clicking one drives the same onSelect flow as a backend suggestion.
const STARTER_SUGGESTIONS: Suggestion[] = [
  {
    text: 'kubectl get pods -n <namespace>',
    description: 'List pods in a namespace',
    category: 'kubectl',
    placeholders: ['namespace'],
    kind: 'TEMPLATE'
  },
  {
    text: 'docker ps',
    description: 'List running containers',
    category: 'docker',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'git status',
    description: 'Show working tree status',
    category: 'git',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'git log --oneline -n 20',
    description: 'Recent commits, one line each',
    category: 'git',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'source ~/.bashrc',
    description: 'Reload bash configuration',
    category: 'shell',
    placeholders: [],
    kind: 'TEMPLATE'
  },
  {
    text: 'claude',
    description: 'Start the Claude Code CLI',
    category: 'claude',
    placeholders: [],
    kind: 'TEMPLATE'
  }
];

// Build a regex from a template by escaping all regex metachars then turning
// every <slot> into `.+`. Used to keep the template lock alive after the user
// substitutes a placeholder (the literal text no longer matches `===`, but
// the structural shape still does).
function templateMatcher(template: string): RegExp {
  const pattern = template
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/<[^>]+>/g, '.+');
  return new RegExp('^' + pattern + '$');
}

// Find a `<...>` span that the caret falls inside, OR sits at the boundary of
// in the direction of the deletion key. For Backspace the relevant boundary
// is the trailing `>` (caret > start && caret <= end). For Delete it's the
// leading `<` (caret >= start && caret < end). Returns null when no slot
// matches — the caller falls through to the browser's default delete.
function slotSpanAtCaret(
  text: string,
  caret: number,
  key: 'Backspace' | 'Delete'
): { start: number; end: number } | null {
  const re = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (key === 'Backspace') {
      if (caret > start && caret <= end) return { start, end };
    } else {
      if (caret >= start && caret < end) return { start, end };
    }
  }
  return null;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

type PreviewSeg = { text: string; kind: 'plain' | 'unfilled' | 'filled' };

// Derive the read-only "Will copy" view from the canonical `command` string
// (which already holds substituted values) plus the position-tracked `filled`
// map. Unfilled `<slot>` literals render amber; tracked filled values render
// green; everything else is plain. Purely derived — this is never a second
// editable surface (see merged-input-preview), and since it renders `command`
// verbatim it can never disagree with what Copy puts on the clipboard.
function buildPreviewSegments(
  command: string,
  filled: Record<string, { value: string; start: number }>
): PreviewSeg[] {
  const ranges: { start: number; end: number; kind: 'unfilled' | 'filled' }[] = [];
  const slotRe = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = slotRe.exec(command)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'unfilled' });
  }
  for (const { value, start } of Object.values(filled)) {
    // Only highlight when the tracked value is still intact at its recorded
    // position, so a drifted entry never paints the wrong characters green.
    if (value && command.slice(start, start + value.length) === value) {
      ranges.push({ start, end: start + value.length, kind: 'filled' });
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const segs: PreviewSeg[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue; // defensive: skip any overlap
    if (r.start > cursor) segs.push({ text: command.slice(cursor, r.start), kind: 'plain' });
    segs.push({ text: command.slice(r.start, r.end), kind: r.kind });
    cursor = r.end;
  }
  if (cursor < command.length) segs.push({ text: command.slice(cursor), kind: 'plain' });
  return segs;
}

interface Props {
  initialTemplate?: string;
  initialCategory?: string;
  resetSignal?: number;
  // Called on a successful Copy with the command text and category. Pages
  // wire this to the shared history hook so the entry appears in the
  // sidebar's History destination immediately.
  addHistory?: (command: string, category: string) => Promise<HistoryEntry | null>;
}

export function BuilderView({
  initialTemplate = '',
  initialCategory = '',
  resetSignal = 0,
  addHistory
}: Props) {
  // Single canonical state: the field IS the command. Copy / Save / preview
  // all act on this string. Eliminates the query vs effectiveCommand dual
  // state that previously needed reconciling.
  const [command, setCommand] = useState(initialTemplate);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  // activeTemplate tracks "what template was picked" purely to preserve the
  // category and the known placeholder list across substitution. The lock
  // drops as soon as the typed text can no longer match the template shape.
  const [activeTemplate, setActiveTemplate] = useState<string>(initialTemplate);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  // All transient success/error feedback now goes through the shared toast
  // channel instead of five separate inline-flash states + timers.
  const toast = useToast();
  // Purely-visual local feedback on the Copy button (icon→check, label→
  // "Copied!", green flash + scale pulse), independent of the toast and of the
  // actual copy/history side effect. Reverts after COPIED_FLASH_MS.
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Per-slot substituted value + its start index in `command`. Position
  // tracking is required because split/join over the previous value would
  // also rewrite unrelated text that happens to contain the same characters
  // (e.g. typing "s" into a slot would replace the "s" in "describe" and
  // "namespace" too). Subsequent edits splice exactly at the tracked range
  // and shift the start indices of other entries by the resulting delta.
  // A slot stays mounted in the placeholder form as long as either its
  // literal `<...>` text or its tracked substituted value is still present.
  const [filled, setFilled] = useState<Record<string, { value: string; start: number }>>({});
  const filledRef = useRef(filled);
  filledRef.current = filled;
  const commandRef = useRef(command);
  commandRef.current = command;

  // When the parent triggers a reset (e.g. user picked a template from the catalog), reseed state.
  useEffect(() => {
    setCommand(initialTemplate);
    setActiveTemplate(initialTemplate);
    setActiveCategory(initialCategory);
    setShowSuggestions(true);
    setActiveIndex(-1);
    setFilled({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    setActiveIndex(-1);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const list = await api.suggestions(command, 30);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 120);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [command]);

  useEffect(() => {
    if (!activeTemplate) {
      setPlaceholders([]);
      return;
    }
    api.placeholders(activeTemplate).then(setPlaceholders);
  }, [activeTemplate]);

  // Show form rows for slots that are either still literally `<...>` in the
  // command OR have a tracked substituted value at its expected position.
  // Equality at the tracked range, not includes() over the whole command,
  // so the row only stays mounted when the substitution is intact.
  const remainingPlaceholders = useMemo(
    () =>
      placeholders.filter((p) => {
        if (command.includes(p.slot)) return true;
        const e = filled[p.slot];
        if (!e) return false;
        return command.slice(e.start, e.start + e.value.length) === e.value;
      }),
    [placeholders, command, filled]
  );

  // Plain string view of `filled` for PlaceholderForm. The form doesn't need
  // to know about positions.
  const placeholderValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [slot, entry] of Object.entries(filled)) out[slot] = entry.value;
    return out;
  }, [filled]);

  // Drop a filled entry when its tracked range no longer matches its value —
  // covers the "user deleted the substituted text from the input bar" path.
  // remainingPlaceholders then unmounts the row.
  useEffect(() => {
    setFilled((prev) => {
      let changed = false;
      const next: Record<string, { value: string; start: number }> = {};
      for (const [slot, entry] of Object.entries(prev)) {
        if (
          entry.value &&
          command.slice(entry.start, entry.start + entry.value.length) === entry.value
        ) {
          next[slot] = entry;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [command]);

  const trimmedCommand = command.trim();
  const hasUnfilled = remainingPlaceholders.length > 0;
  const isFreeForm = !activeTemplate && trimmedCommand.length > 0;

  // Read-only "Will copy" preview. Shown only when highlighting adds
  // information (an unfilled slot or a substituted value) so plain free-form
  // text doesn't get a redundant echo of itself.
  const previewSegments = useMemo(() => buildPreviewSegments(command, filled), [command, filled]);
  const showPreview =
    trimmedCommand.length > 0 && previewSegments.some((s) => s.kind !== 'plain');
  const destructiveMatch = useMemo(() => classifyDestructiveCommand(command), [command]);

  // Real backend suggestions take priority; starters fill the empty-query case.
  const startersActive = !trimmedCommand && suggestions.length === 0 && !loading;
  const displayedSuggestions = startersActive ? STARTER_SUGGESTIONS : suggestions;
  const headerLabel = startersActive ? 'Try one of these to get started' : undefined;

  const onSelectSuggestion = useCallback((s: Suggestion) => {
    setActiveTemplate(s.text);
    setActiveCategory(s.category);
    if (s.kind === 'EXTENSION') {
      setCommand(s.text + ' ');
    } else {
      setCommand(s.text);
      setShowSuggestions(false);
    }
    setActiveIndex(-1);
  }, []);

  // Live placeholder substitution. Position-tracked so we never re-write
  // unrelated text that happens to share characters with the value being
  // typed. Three cases:
  //   1. value === '' — revert: splice the tracked range back to the
  //      literal `<slot>` text so the user can keep editing.
  //   2. previous entry's tracked range still equals its recorded value —
  //      splice at that exact range with the new value.
  //   3. otherwise (first fill OR drift) — fall back to indexOf(slot) over
  //      the current command and splice there.
  // After splicing, shift every other filled entry whose start was on or
  // after the spliceEnd by the resulting length delta so their tracked
  // positions stay accurate.
  const onPlaceholderChange = useCallback((slot: string, value: string) => {
    const cmd = commandRef.current;
    const prevFilled = filledRef.current;
    const prevEntry = prevFilled[slot];

    let spliceStart: number;
    let spliceEnd: number;
    let replacement: string;
    let nextEntry: { value: string; start: number } | null;

    if (value === '') {
      if (!prevEntry) return;
      if (
        cmd.slice(prevEntry.start, prevEntry.start + prevEntry.value.length) !== prevEntry.value
      ) {
        // Tracked range drifted — drop the entry without touching command.
        const next = { ...prevFilled };
        delete next[slot];
        setFilled(next);
        return;
      }
      spliceStart = prevEntry.start;
      spliceEnd = prevEntry.start + prevEntry.value.length;
      replacement = slot;
      nextEntry = null;
    } else if (
      prevEntry &&
      cmd.slice(prevEntry.start, prevEntry.start + prevEntry.value.length) === prevEntry.value
    ) {
      spliceStart = prevEntry.start;
      spliceEnd = prevEntry.start + prevEntry.value.length;
      replacement = value;
      nextEntry = { value, start: spliceStart };
    } else {
      const idx = cmd.indexOf(slot);
      if (idx === -1) return;
      spliceStart = idx;
      spliceEnd = idx + slot.length;
      replacement = value;
      nextEntry = { value, start: spliceStart };
    }

    const nextCmd = cmd.slice(0, spliceStart) + replacement + cmd.slice(spliceEnd);
    const delta = replacement.length - (spliceEnd - spliceStart);

    const nextFilled: Record<string, { value: string; start: number }> = {};
    for (const [otherSlot, otherEntry] of Object.entries(prevFilled)) {
      if (otherSlot === slot) continue;
      if (otherEntry.start >= spliceEnd) {
        nextFilled[otherSlot] = { value: otherEntry.value, start: otherEntry.start + delta };
      } else {
        nextFilled[otherSlot] = otherEntry;
      }
    }
    if (nextEntry) nextFilled[slot] = nextEntry;

    setCommand(nextCmd);
    setFilled(nextFilled);
  }, []);

  // Share-by-link: encode the *substituted* command (not the template) so the
  // recipient lands on the same line the sharer was looking at. Refuses on
  // secret-pattern matches and on URLs that exceed the in-memory ceiling.
  const onShare = useCallback(async () => {
    if (!trimmedCommand) return;
    const result = encodeShare(command, activeCategory);
    if (!result.ok) {
      toast.error(describeRefusal(result.refusal));
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      toast.success('Link copied — anyone with it can read the command');
    } catch {
      // Clipboard refused (insecure context, permission denied) — surface the
      // URL in a sticky error toast so the user can copy it manually.
      toast.error('Clipboard blocked. Link: ' + result.url);
    }
  }, [trimmedCommand, command, activeCategory, toast]);

  // Copy → on success, also persist to history (Tier 2 #7). Persistence now
  // routes through the shared useHistory() hook the parent page owns, so the
  // sidebar's History destination updates in lockstep without re-fetching.
  // HistoryService still dedupes by command text on the backend, so a
  // double-click still produces one row.
  // Fire the local Copy-button success flash, restarting the revert timer on
  // rapid re-clicks so the states never stack or revert mid-flash.
  const flashCopied = useCallback(() => {
    setCopied(true);
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), COPIED_FLASH_MS);
  }, []);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const onCopy = useCallback(async () => {
    if (!trimmedCommand) return;
    const ok = await copyToClipboard(command);
    if (!ok) {
      toast.error('Couldn’t copy to the clipboard — select and copy manually.');
      return;
    }
    flashCopied();
    if (!addHistory) {
      toast.success('Copied to clipboard');
      return;
    }
    const entry = await addHistory(command, activeCategory || 'misc');
    toast.success(entry ? 'Copied — saved to history' : 'Copied to clipboard');
  }, [trimmedCommand, command, activeCategory, addHistory, toast, flashCopied]);

  // Wipe everything that follows from a non-empty command in one click:
  // the command itself, the template lock, the placeholder form state, and
  // any inline flashes. Returns focus to the input so the user can start
  // typing immediately.
  const clearInput = useCallback(() => {
    setCommand('');
    setActiveTemplate('');
    setActiveCategory('');
    setFilled({});
    setShowSuggestions(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Drop the template lock when the typed text can no longer match the
  // template's shape (modulo placeholder substitution). Substituting `<host>`
  // → `db.local` should NOT drop the lock; rewriting `get` → `describe` should.
  const onCommandChange = (v: string) => {
    setCommand(v);
    setShowSuggestions(true);
    if (!v.trim()) {
      setActiveTemplate('');
      setActiveCategory('');
      return;
    }
    if (activeTemplate) {
      // Suggestion EXTENSION picks set the field to "<text> " with a trailing
      // space; treat that as still on the picked template.
      const candidate = v.endsWith(' ') ? v.slice(0, -1) : v;
      if (candidate !== activeTemplate && !templateMatcher(activeTemplate).test(candidate)) {
        setActiveTemplate('');
        setActiveCategory('');
      }
    }
  };

  // Keyboard handling on the input:
  // - Cmd/Ctrl-Enter copies the current command (works regardless of list visibility).
  // - When the list is visible: ↑/↓ walks rows, Tab/Enter accepts the active
  //   row, Esc hides the list.
  // - Without an active row, Enter falls through to the browser default
  //   (which is a no-op for an input outside a form).
  const onInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        void onCopy();
        return;
      }
      // Atomic placeholder deletion: Backspace/Delete with no selection that
      // lands inside or at the boundary of a literal `<...>` slot removes the
      // whole slot in one keystroke, including a surrounding single space so
      // we don't leave a double-space hole.
      if ((e.key === 'Backspace' || e.key === 'Delete') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const input = e.currentTarget;
        const selStart = input.selectionStart;
        const selEnd = input.selectionEnd;
        if (selStart !== null && selEnd !== null && selStart === selEnd) {
          const span = slotSpanAtCaret(command, selStart, e.key);
          if (span) {
            let { start, end } = span;
            if (e.key === 'Backspace' && start > 0 && command[start - 1] === ' ') {
              start -= 1;
            } else if (e.key === 'Delete' && command[end] === ' ') {
              end += 1;
            }
            e.preventDefault();
            const next = command.slice(0, start) + command.slice(end);
            onCommandChange(next);
            // Restore caret to where the slot used to start, in the next paint.
            window.requestAnimationFrame(() => {
              if (inputRef.current) {
                inputRef.current.setSelectionRange(start, start);
              }
            });
            return;
          }
        }
      }
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, displayedSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setActiveIndex(-1);
      } else if (
        (e.key === 'Tab' || e.key === 'Enter') &&
        activeIndex >= 0 &&
        activeIndex < displayedSuggestions.length
      ) {
        e.preventDefault();
        onSelectSuggestion(displayedSuggestions[activeIndex]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayedSuggestions, showSuggestions, activeIndex, onCopy, onSelectSuggestion, command]
  );

  // Shift-? opens the shortcut-help modal, but only when focus is outside any
  // text-entry element — otherwise we'd swallow the literal `?` keystroke.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || !e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      const inText =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (inText) return;
      e.preventDefault();
      setHelpOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll the active row into view as the keyboard walks the list.
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(`${SUGGESTION_OPTION_PREFIX}-${activeIndex}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const activeOptionId =
    activeIndex >= 0 ? `${SUGGESTION_OPTION_PREFIX}-${activeIndex}` : undefined;

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Build a command</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Type the command directly or pick from suggestions; placeholder slots
            become inputs that substitute in place. <span className="text-slate-800 dark:text-slate-200">Copy</span>{' '}
            also saves to history. Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
              Shift
            </kbd>
            <span className="text-slate-500"> + </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
              ?
            </kbd>{' '}
            for keyboard shortcuts.
          </p>
        </header>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="relative border-b border-slate-200 dark:border-slate-800">
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => onCommandChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Start typing… e.g. 'kubectl get'"
              className="w-full min-h-12 bg-white dark:bg-slate-950 px-3 sm:px-4 py-3 pr-14 font-mono text-base text-slate-900 dark:text-slate-100
                         placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={SUGGESTION_LISTBOX_ID}
              aria-activedescendant={activeOptionId}
              aria-autocomplete="list"
            />
            {command && (
              <button
                type="button"
                onClick={clearInput}
                title="Clear input"
                aria-label="Clear input"
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                           h-11 w-11 rounded text-slate-500 dark:text-slate-400
                           hover:bg-slate-100 dark:hover:bg-slate-800
                           hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                ✕
              </button>
            )}
          </div>
          {showSuggestions && (
            <SuggestionList
              items={displayedSuggestions}
              loading={loading}
              headerLabel={headerLabel}
              activeIndex={activeIndex}
              onSelect={onSelectSuggestion}
              onHover={setActiveIndex}
              listboxId={SUGGESTION_LISTBOX_ID}
              optionIdPrefix={SUGGESTION_OPTION_PREFIX}
            />
          )}
          {!showSuggestions && (
            <div className="px-4 py-2 text-xs text-slate-500">
              Suggestions hidden —{' '}
              <button
                onClick={() => setShowSuggestions(true)}
                className="min-h-11 px-1 underline hover:text-sky-600 dark:hover:text-sky-300"
              >
                show again
              </button>
            </div>
          )}

          {remainingPlaceholders.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800">
              <PlaceholderForm
                placeholders={remainingPlaceholders}
                values={placeholderValues}
                onChange={onPlaceholderChange}
              />
            </div>
          )}

          {destructiveMatch && (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <WarningIcon className="mt-0.5 h-4 w-4 flex-none text-amber-700 dark:text-amber-300" />
                <div>
                  <div className="font-semibold">Destructive command</div>
                  <div className="mt-0.5 text-amber-900 dark:text-amber-200">
                    {destructiveMatch.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 px-3 sm:px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40">
            <button
              onClick={onCopy}
              disabled={!trimmedCommand}
              aria-live="polite"
              className={`inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium
                         text-white transition disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-500
                         ${
                           copied
                             ? 'bg-emerald-600 hover:bg-emerald-500 copy-pulse'
                             : 'bg-sky-600 hover:bg-sky-500'
                         }`}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy command'}
            </button>
            <button
              onClick={() => setSaveModalOpen(true)}
              disabled={!trimmedCommand}
              className="min-h-11 w-full sm:w-auto px-3 py-2 rounded text-sm font-medium border
                         border-slate-300 dark:border-slate-700
                         bg-white dark:bg-slate-800
                         text-slate-800 dark:text-slate-200
                         hover:bg-slate-100 dark:hover:bg-slate-700
                         disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400
                         transition"
            >
              Save to folder…
            </button>
            <button
              onClick={onShare}
              disabled={!trimmedCommand}
              title="Copy a share link to the clipboard"
              className="min-h-11 w-full sm:w-auto px-3 py-2 rounded text-sm font-medium border
                         border-slate-300 dark:border-slate-700
                         bg-white dark:bg-slate-800
                         text-slate-800 dark:text-slate-200
                         hover:bg-slate-100 dark:hover:bg-slate-700
                         disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400
                         transition"
            >
              Share link
            </button>
            <div className="w-full sm:w-auto sm:ml-auto text-xs">
              {hasUnfilled && (
                <span className="text-amber-700 dark:text-amber-300">
                  placeholders still empty — fill above or edit the line directly
                </span>
              )}
              {!hasUnfilled && isFreeForm && (
                <span className="text-sky-700 dark:text-sky-300">free-form — saved as typed</span>
              )}
            </div>
          </div>

          {showPreview && (
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                Will copy
              </div>
              <div
                className="font-mono text-sm text-slate-800 dark:text-slate-200 break-all whitespace-pre-wrap"
                aria-label="Command that will be copied"
              >
                {previewSegments.map((seg, i) =>
                  seg.kind === 'unfilled' ? (
                    <span
                      key={i}
                      className="rounded px-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                    >
                      {seg.text}
                    </span>
                  ) : seg.kind === 'filled' ? (
                    <span
                      key={i}
                      className="rounded px-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </div>
            </div>
          )}
        </div>

      {helpOpen && <ShortcutHelpModal isMac={isMac} onClose={() => setHelpOpen(false)} />}
      {saveModalOpen && trimmedCommand && (
        <SaveToFolderModal
          command={command}
          category={activeCategory}
          addHistory={addHistory}
          onClose={() => setSaveModalOpen(false)}
          onSaved={() => toast.success('Saved to folder')}
        />
      )}
    </div>
  );
}
