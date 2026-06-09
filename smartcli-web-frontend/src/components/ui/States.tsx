import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center mb-4 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-xs mb-4">{message}</p>}
      {onRetry && (
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={cn('bg-navy-800 rounded animate-pulse', className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-navy-800 rounded animate-pulse h-4',
            i === lines - 1 && 'w-3/4',
            className
          )}
        />
      ))}
    </div>
  );
}

export function CommandRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-800 animate-pulse" aria-hidden>
      <div className="w-16 h-5 bg-navy-800 rounded" />
      <div className="flex-1 h-4 bg-navy-800 rounded" />
      <div className="w-12 h-5 bg-navy-800 rounded" />
      <div className="w-8 h-8 bg-navy-800 rounded-lg" />
    </div>
  );
}
