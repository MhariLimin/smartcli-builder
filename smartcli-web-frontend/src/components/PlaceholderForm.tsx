import { useEffect, useState } from 'react';
import { SlotInput } from './SlotInput';
import type { PlaceholderInfo } from '../types';

interface Props {
  placeholders: PlaceholderInfo[];
  // Current substituted value per slot. Undefined / empty for unfilled slots;
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
  // substituted; the input bar follows the field 1:1, even when wrong.
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
          - the command above updates as you type
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {placeholders.map((p) => (
          <SlotInput
            key={p.slot}
            placeholder={p}
            value={drafts[p.slot] ?? ''}
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
