import { useEffect, useState } from 'react';
import type { PlaceholderInfo } from '../types';
import { SlotInput, validatePlaceholderValue } from './SlotInput';

interface Props {
  placeholders: PlaceholderInfo[];
  values: Record<string, string>;
  onChange: (slot: string, value: string) => void;
}

export function PlaceholderForm({ placeholders, values, onChange }: Props) {
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

  const handleChange = (p: PlaceholderInfo, value: string) => {
    setDrafts((current) => ({ ...current, [p.slot]: value }));
    const trimmed = value.trim();
    if (!trimmed) {
      setErrors((current) => (current[p.slot] ? { ...current, [p.slot]: null } : current));
      onChange(p.slot, '');
      return;
    }
    setErrors((current) => ({
      ...current,
      [p.slot]: validatePlaceholderValue(p, trimmed)
    }));
    onChange(p.slot, trimmed);
  };

  return (
    <div className="space-y-3 bg-slate-50 px-3 py-3 dark:bg-slate-900 sm:px-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
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
            onChange={(value) => handleChange(p, value)}
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
