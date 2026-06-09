import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { PlaceholderInfo } from '../types';
import { SlotInput, validatePlaceholderValue } from './SlotInput';

interface Props {
  placeholder: PlaceholderInfo;
  displayValue: string;
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverPosition {
  left: number;
  top: number;
}

export function InlinePlaceholderEditor({
  placeholder,
  displayValue,
  value,
  onChange,
  onOpenChange
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || placeholder.defaultValue || '');
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(value || placeholder.defaultValue || '');
    setError(value ? validatePlaceholderValue(placeholder, value) : null);
  }, [placeholder, value]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(352, window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const estimatedHeight = 300;
      const top =
        rect.bottom + estimatedHeight + 20 <= window.innerHeight
          ? rect.bottom + 8
          : Math.max(12, rect.top - estimatedHeight - 8);
      setPosition({ left, top });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !position) return;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'input, select, button, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!dialogRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, position]);

  const handleChange = (nextValue: string) => {
    setDraft(nextValue);
    const trimmed = nextValue.trim();
    setError(trimmed ? validatePlaceholderValue(placeholder, trimmed) : null);
    onChange(trimmed);
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input, select, button, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`pointer-events-auto relative z-10 rounded-sm px-0 font-mono text-base leading-[1.5]
                   outline-none ring-offset-1 transition motion-reduce:transition-none
                   focus-visible:ring-2 focus-visible:ring-sky-500
                   ${
                     value
                       ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                       : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                   }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Edit ${placeholder.label}`}
      >
        {displayValue}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-label={`Edit ${placeholder.label}`}
            onKeyDown={handleDialogKeyDown}
            className="fixed z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-slate-200 bg-white p-3
                       shadow-xl transition motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900"
            style={{ left: position.left, top: position.top }}
          >
            <SlotInput
              placeholder={placeholder}
              value={draft}
              error={error}
              onChange={handleChange}
            />
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleChange('')}
                className="min-h-9 rounded px-2 text-xs font-medium text-slate-600 hover:bg-slate-100
                           dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="min-h-9 rounded bg-sky-600 px-3 text-xs font-medium text-white hover:bg-sky-500"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
