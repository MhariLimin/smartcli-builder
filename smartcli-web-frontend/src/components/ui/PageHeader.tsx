import React from 'react';
import { cn } from '../../lib/boltUtils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-4 border-b border-navy-800', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-lg font-semibold text-slate-100 truncate">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
