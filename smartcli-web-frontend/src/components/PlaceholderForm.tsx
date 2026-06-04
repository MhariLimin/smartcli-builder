import { useEffect, useState } from 'react';
import type { PlaceholderInfo } from '../types';

interface Props {
  placeholders: PlaceholderInfo[];
  // Current substituted value per slot. Undefined / empty for unfilled slots —
  // the field then falls back to the slot's default value for display only.
  values: Record<string, string>;
  // Called on every keystroke for text/numeric inputs, and on every change
  // for select/checkbox. Parent splices live into the command so the input
  // bar tracks the field 1:1.
  onChange: (slot: string, value: string) => void;
}

export function PlaceholderForm({ placeholders, values, onChange }: Props) {
  // Local drafts hold the raw text as typed, so an invalid value (e.g. "abc"
  // in an int field) doesn't get clobbered by the parent's substituted form.
  // The parent's `values` map is the substituted-in-command source of truth;
  // these drafts are the displayed text.
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    seedDrafts(placeholders, values)
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const visibleKey = placeholders.map((p) => p.slot).join('|');
  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const p of placeholders) {
        if (values[p.slot] !== undefined) next[p.slot] = values[p.slot];
        else if (prev[p.slot] !== undefined) next[p.slot] = prev[p.slot];
        else next[p.slot] = p.defaultValue ?? '';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey]);

  if (placeholders.length === 0) return null;

  // Live commit: text/numeric inputs propagate on every keystroke. Validation
  // still runs so the user sees error states, but invalid values are still
  // substituted — the input bar follows the field 1:1, even when wrong.
  const handleChange = (p: PlaceholderInfo, value: string) => {
    setDrafts((d) => ({ ...d, [p.slot]: value }));
    const trimmed = value.trim();
    if (!trimmed) {
      setErrors((e) => (e[p.slot] ? { ...e, [p.slot]: null } : e));
      onChange(p.slot, '');
      return;
    }
    const err = validate(p, trimmed);
    setErrors((e) => ({ ...e, [p.slot]: err }));
    onChange(p.slot, trimmed);
  };

  return (
    <div className="px-3 sm:px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
        Fill placeholders{' '}
        <span className="font-normal normal-case text-slate-500">
          — the command above updates as you type
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {placeholders.map((p) => (
          <PlaceholderField
            key={p.slot}
            placeholder={p}
            draft={drafts[p.slot] ?? ''}
            error={errors[p.slot] ?? null}
            onChange={(v) => handleChange(p, v)}
          />
        ))}
      </div>
    </div>
  );
}

function seedDrafts(
  placeholders: PlaceholderInfo[],
  values: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of placeholders) {
    out[p.slot] = values[p.slot] !== undefined ? values[p.slot] : p.defaultValue ?? '';
  }
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
  onChange: (v: string) => void;
}

function PlaceholderField({ placeholder: p, draft, error, onChange }: FieldProps) {
  const labelRow = (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-800 dark:text-slate-200 font-medium">
      <span className="text-amber-700 dark:text-amber-300 font-mono">&lt;{p.name}&gt;</span>
      {p.type && (
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          {p.type === 'enum' ? 'select' : p.type}
        </span>
      )}
      <span className="text-slate-600 dark:text-slate-400 text-xs">{p.label}</span>
    </div>
  );

  const errorEl = error ? (
    <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">{error}</div>
  ) : null;

  if (p.type === 'enum' && p.enumOptions && p.enumOptions.length > 0) {
    return (
      <label className="block">
        {labelRow}
        <select
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 min-h-11 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-3 py-2
                     text-sm font-mono text-slate-900 dark:text-slate-100
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
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="h-5 w-5 accent-sky-500"
        />
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-800 dark:text-slate-200 font-medium">
          <span className="text-amber-700 dark:text-amber-300 font-mono">&lt;{p.name}&gt;</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">bool</span>
          <span className="text-slate-600 dark:text-slate-400 text-xs">{p.label}</span>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={p.hint}
        className={`mt-1 min-h-11 w-full bg-white dark:bg-slate-950 border rounded px-3 py-2
                   text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600
                   focus:outline-none focus:border-sky-500
                   ${error ? 'border-rose-600' : 'border-slate-300 dark:border-slate-700'}`}
        spellCheck={false}
        autoComplete="off"
      />
      {errorEl}
    </label>
  );
}
