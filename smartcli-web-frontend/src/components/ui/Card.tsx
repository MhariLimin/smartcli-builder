import React from 'react';
import { cn } from '../../lib/boltUtils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  as?: React.ElementType;
}

export function Card({
  children,
  className,
  interactive,
  selected,
  onClick,
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-navy-850 border border-navy-700 rounded-xl shadow-inner-highlight',
        interactive && 'cursor-pointer hover:border-navy-600 hover:bg-navy-800 transition-colors duration-150',
        selected && 'border-cyan-500/50 bg-navy-800 ring-1 ring-cyan-500/20',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

interface CodeCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function CodeCard({ children, className, header, footer }: CodeCardProps) {
  return (
    <div className={cn('bg-navy-950 border border-navy-700 rounded-xl overflow-hidden', className)}>
      {header && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-navy-800 bg-navy-900">
          {header}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-navy-800 bg-navy-900">
          {footer}
        </div>
      )}
    </div>
  );
}
