import { useEffect, useState } from 'react';
import type { PlaceholderInfo } from '../types';

interface Props {
  placeholders: PlaceholderInfo[];
  // Called with the literal slot text (e.g. "<port:int=22>") and the committed
  // value. BuilderView substitutes by slot text so the typed grammar collapses
  // correctly even when the same name appears with different specs.
  onFill: (slot: string, value: string) => void;
}

// Substitution commits on Enter or blur for text/numeric inputs, and on change
// for selects/checkboxes — otherwise a typed slot would vanish from the command
// after the first character and rip focus out of the input mid-typing.
export function PlaceholderForm({ placeholders, onFill }: Props) {
  // Seed each draft with the slot's default value so users running the common
  // case can hit Enter without typing. Pruned when a slot leaves the list.
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    seedDrafts(placeholders)
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const visibleKey = placeholders.map((p) => p.slot).join('|');
  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const p of placeholders) {
        next[p.slot] = prev[p.slot] !== undefined ? prev[p.slot] : p.defaultValue ?? '';
      }
      return next;
    });
    setErrors((prev) => {
      const next: Record<string, string | null> = {};
      for (const p of placeholders) {
        if (prev[p.slot] !== undefined) next[p.slot] = prev[p.slot];
      }
      return next;
    });
  }, [visibleKey]);

  if (placeholders.length === 0) return null;

  const commit = (p: PlaceholderInfo) => {
    const raw = drafts[p.slot] ?? '';
    const v = raw.trim();
    if (!v) return;
    const err = validate(p, v);
    if (err) {
      setErrors((prev) => ({ ...prev, [p.slot]: err }));
      return;
    }
    setErrors((prev) => ({ ...prev, [p.slot]: null }));
    onFill(p.slot, v);
  };

  const setDraft = (slot: string, value: string) => {
    setDrafts((d) => ({ ...d, [slot]: value }));
    // Clear any prior error eagerly — re-validation happens on commit.
    setErrors((e) => (e[slot] ? { ...e, [slot]: null } : e));
  };

  return (
    <div className="px-4 py-3 space-y-3 bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        Fill placeholders{' '}
        <span className="font-normal normal-case text-slate-500">
          — Enter or Tab substitutes into the command above
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {placeholders.map((p) => (
          <PlaceholderField
            key={p.slot}
            placeholder={p}
            draft={drafts[p.slot] ?? ''}
            error={errors[p.slot] ?? null}
            onDraftChange={(v) => setDraft(p.slot, v)}
            onCommit={() => commit(p)}
            onCommitValue={(v) => {
              // Selects and checkboxes commit immediately on change; bypass
              // the draft round-trip but still go through validation.
              const err = validate(p, v);
              if (err) {
                setErrors((prev) => ({ ...prev, [p.slot]: err }));
                return;
              }
              setErrors((prev) => ({ ...prev, [p.slot]: null }));
              onFill(p.slot, v);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function seedDrafts(placeholders: PlaceholderInfo[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of placeholders) out[p.slot] = p.defaultValue ?? '';
  return out;
}

function validate(p: PlaceholderInfo, value: string): string | null {
  switch (p.type) {
    case 'int':
      if (!/^-?\d+$/.test(value)) return 'must be an integer';
      return null;
    case 'float':
      if (!/^-?\d+(\.\d+)?$/.test(value)) return 'must be a number';
      return null;
    case 'enum':
      if (p.enumOptions && p.enumOptions.length > 0 && !p.enumOptions.includes(value)) {
        return `must be one of: ${p.enumOptions.join(', ')}`;
      }
      return null;
    case 'bool':
      if (value !== 'true' && value !== 'false') return 'must be true or false';
      return null;
    default:
      return null;
  }
}

interface FieldProps {
  placeholder: PlaceholderInfo;
  draft: string;
  error: string | null;
  onDraftChange: (v: string) => void;
  onCommit: () => void;
  onCommitValue: (v: string) => void;
}

function PlaceholderField({
  placeholder: p,
  draft,
  error,
  onDraftChange,
  onCommit,
  onCommitValue
}: FieldProps) {
  const labelRow = (
    <div className="text-sm text-slate-200 font-medium">
      <span className="text-amber-300 font-mono">&lt;{p.name}&gt;</span>
      {p.type && (
        <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">
          {p.type === 'enum' ? 'select' : p.type}
        </span>
      )}
      <span className="ml-2 text-slate-400 text-xs">{p.label}</span>
    </div>
  );

  const errorEl = error ? (
    <div className="mt-1 text-xs text-rose-300">{error}</div>
  ) : null;

  if (p.type === 'enum' && p.enumOptions && p.enumOptions.length > 0) {
    return (
      <label className="block">
        {labelRow}
        <select
          value={draft}
          onChange={(e) => onCommitValue(e.target.value)}
          className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-3 py-2
                     text-sm font-mono text-slate-100
                     focus:outline-none focus:border-sky-500"
        >
          <option value="" disabled>
            — choose —
          </option>
          {p.enumOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errorEl}
      </label>
    );
  }

  if (p.type === 'bool') {
    const checked = draft === 'true';
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCommitValue(e.target.checked ? 'true' : 'false')}
          className="h-4 w-4 accent-sky-500"
        />
        <div className="text-sm text-slate-200 font-medium">
          <span className="text-amber-300 font-mono">&lt;{p.name}&gt;</span>
          <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-500">bool</span>
          <span className="ml-2 text-slate-400 text-xs">{p.label}</span>
        </div>
      </label>
    );
  }

  const numeric = p.type === 'int' || p.type === 'float';

  return (
    <label className="block">
      {labelRow}
      <input
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'numeric' : undefined}
        step={p.type === 'float' ? 'any' : p.type === 'int' ? '1' : undefined}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder={p.hint}
        className={`mt-1 w-full bg-slate-950 border rounded px-3 py-2
                   text-sm font-mono text-slate-100 placeholder-slate-600
                   focus:outline-none focus:border-sky-500
                   ${error ? 'border-rose-600' : 'border-slate-700'}`}
        spellCheck={false}
        autoComplete="off"
      />
      {errorEl}
    </label>
  );
}
