import type { PlaceholderInfo } from '../types';

interface SlotInputProps {
  placeholder: PlaceholderInfo;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}

const SMALL_ENUM_LIMIT = 4;

export function SlotInput({ placeholder: p, value, error, onChange }: SlotInputProps) {
  const canReset = p.defaultValue !== undefined && value !== p.defaultValue;
  const resetButton = canReset ? (
    <button
      type="button"
      onClick={() => onChange(p.defaultValue ?? '')}
      className="min-h-8 rounded px-2 text-xs font-medium text-sky-700 hover:bg-sky-50 hover:text-sky-800
                 dark:text-sky-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
    >
      Reset
    </button>
  ) : null;

  const labelRow = (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-medium text-slate-800 dark:text-slate-200">
      <span className="font-mono text-amber-700 dark:text-amber-300">&lt;{p.name}&gt;</span>
      {p.type && (
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          {p.type === 'enum' ? 'select' : p.type}
        </span>
      )}
      <span className="text-xs text-slate-600 dark:text-slate-400">{p.label}</span>
    </div>
  );

  const errorEl = error ? (
    <div className="mt-1 text-xs text-rose-700 dark:text-rose-300">{error}</div>
  ) : null;

  if (p.type === 'enum' && p.enumOptions && p.enumOptions.length > 0) {
    if (p.enumOptions.length <= SMALL_ENUM_LIMIT) {
      return (
        <div>
          <div className="flex items-start justify-between gap-2">
            {labelRow}
            {resetButton}
          </div>
          <div
            className={`mt-1 grid overflow-hidden rounded border bg-white dark:bg-slate-950
                       ${error ? 'border-rose-600' : 'border-slate-300 dark:border-slate-700'}`}
            style={{ gridTemplateColumns: `repeat(${p.enumOptions.length}, minmax(0, 1fr))` }}
            role="radiogroup"
            aria-label={p.label}
          >
            {p.enumOptions.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(opt)}
                  className={`min-h-11 min-w-0 border-r border-slate-200 px-2 py-2 font-mono text-sm transition last:border-r-0
                             dark:border-slate-800
                             ${
                               selected
                                 ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                 : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                             }`}
                >
                  <span className="block truncate">{opt}</span>
                </button>
              );
            })}
          </div>
          {errorEl}
        </div>
      );
    }

    return (
      <label className="block">
        <div className="flex items-start justify-between gap-2">
          {labelRow}
          {resetButton}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1 min-h-11 w-full rounded border bg-white px-3 py-2 font-mono text-sm text-slate-900
                     focus:border-sky-500 focus:outline-none dark:bg-slate-950 dark:text-slate-100
                     ${error ? 'border-rose-600' : 'border-slate-300 dark:border-slate-700'}`}
        >
          <option value="" disabled>
            - choose -
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
    const checked = value === 'true';
    return (
      <div>
        <div className="flex items-start justify-between gap-2">
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="h-5 w-5 accent-sky-500"
            />
            {labelRow}
          </label>
          {resetButton}
        </div>
        {errorEl}
      </div>
    );
  }

  const numeric = p.type === 'int' || p.type === 'float';
  const bounds = numeric ? numericBounds(p) : {};
  const currentNumber = numeric ? Number(value) : NaN;
  const canStepDown =
    numeric && (Number.isNaN(currentNumber) || bounds.min === undefined || currentNumber > bounds.min);
  const canStepUp =
    numeric && (Number.isNaN(currentNumber) || bounds.max === undefined || currentNumber < bounds.max);

  return (
    <label className="block">
      <div className="flex items-start justify-between gap-2">
        {labelRow}
        {resetButton}
      </div>
      <div className={numeric ? 'mt-1 flex gap-1' : undefined}>
        <input
          type={numeric ? 'number' : 'text'}
          inputMode={numeric ? (p.type === 'float' ? 'decimal' : 'numeric') : undefined}
          step={p.type === 'float' ? 'any' : p.type === 'int' ? '1' : undefined}
          min={bounds.min}
          max={bounds.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={p.hint}
          className={`${numeric ? '' : 'mt-1'} min-h-11 w-full rounded border bg-white px-3 py-2
                     font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none
                     dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-600
                     ${error ? 'border-rose-600' : 'border-slate-300 dark:border-slate-700'}`}
          spellCheck={false}
          autoComplete="off"
        />
        {numeric && (
          <div className="grid w-11 shrink-0 grid-rows-2 overflow-hidden rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => stepNumeric(p, value, 1, onChange)}
              disabled={!canStepUp}
              aria-label={`Increase ${p.label}`}
              className="min-h-0 text-xs leading-none text-slate-700 hover:bg-slate-100 disabled:text-slate-300
                         dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-700"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => stepNumeric(p, value, -1, onChange)}
              disabled={!canStepDown}
              aria-label={`Decrease ${p.label}`}
              className="min-h-0 border-t border-slate-200 text-xs leading-none text-slate-700 hover:bg-slate-100 disabled:text-slate-300
                         dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-700"
            >
              -
            </button>
          </div>
        )}
      </div>
      {errorEl}
    </label>
  );
}

export function validatePlaceholderValue(p: PlaceholderInfo, value: string): string | null {
  switch (p.type) {
    case 'int':
      return /^-?\d+$/.test(value) ? null : 'must be an integer';
    case 'float':
      return /^-?\d+(\.\d+)?$/.test(value) ? null : 'must be a number';
    case 'enum':
      if (p.enumOptions && p.enumOptions.length > 0 && !p.enumOptions.includes(value)) {
        return `must be one of: ${p.enumOptions.join(', ')}`;
      }
      return null;
    case 'bool':
      return value === 'true' || value === 'false' ? null : 'must be true or false';
    default:
      return null;
  }
}

function stepNumeric(
  placeholder: PlaceholderInfo,
  value: string,
  direction: 1 | -1,
  onChange: (value: string) => void
) {
  const bounds = numericBounds(placeholder);
  const base = Number.isFinite(Number(value))
    ? Number(value)
    : Number.isFinite(Number(placeholder.defaultValue))
      ? Number(placeholder.defaultValue)
      : 0;
  const next = clamp(base + direction, bounds.min, bounds.max);
  onChange(placeholder.type === 'int' ? String(Math.trunc(next)) : formatFloat(next));
}

function formatFloat(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

function numericBounds(placeholder: PlaceholderInfo): { min?: number; max?: number } {
  const source = placeholder as PlaceholderInfo & Record<string, unknown>;
  return {
    min: readNumericBound(source.min),
    max: readNumericBound(source.max)
  };
}

function readNumericBound(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
