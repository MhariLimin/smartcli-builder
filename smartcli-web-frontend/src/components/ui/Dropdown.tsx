import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/boltUtils';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if ('key' in e && e.key === 'Escape') { close(); return; }
      if ('target' in e && !containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handler);
    };
  }, [open, close]);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick?.();
    close();
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <div
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </div>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute top-full mt-1 z-40 min-w-[160px] bg-navy-850 border border-navy-700 rounded-xl shadow-xl',
            'py-1 animate-slide-down',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {item.dividerBefore && (
                <div className="my-1 border-t border-navy-700" role="separator" />
              )}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-slate-200 hover:bg-navy-800'
                )}
              >
                {item.icon && (
                  <span className={cn('w-4 h-4 flex-shrink-0', item.danger ? 'text-red-400' : 'text-slate-400')}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
