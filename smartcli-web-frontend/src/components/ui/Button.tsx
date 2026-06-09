import React from 'react';
import { cn } from '../../lib/boltUtils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold border border-transparent shadow-glow-cyan hover:shadow-glow-cyan focus-visible:ring-cyan-500',
  secondary:
    'bg-navy-700 hover:bg-navy-600 text-slate-100 border border-navy-600 hover:border-navy-500 focus-visible:ring-cyan-500',
  ghost:
    'bg-transparent hover:bg-navy-750 text-slate-300 hover:text-slate-100 border border-transparent focus-visible:ring-cyan-500',
  danger:
    'bg-red-600 hover:bg-red-500 text-white border border-transparent focus-visible:ring-red-500',
  icon:
    'bg-transparent hover:bg-navy-750 text-slate-400 hover:text-slate-200 border border-transparent p-0 focus-visible:ring-cyan-500',
};


const sizeClasses: Record<ButtonSize, string> = {
  xs: 'text-xs px-2 py-1 rounded-md h-6',
  sm: 'text-xs px-3 py-1.5 rounded-md h-7',
  md: 'text-sm px-4 py-2 rounded-lg h-9',
  lg: 'text-sm px-5 py-2.5 rounded-lg h-11',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        variant === 'icon' && (size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'),
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin w-3.5 h-3.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{leftIcon}</span>
      ) : null}
      {children && <span className={cn(variant === 'icon' && 'sr-only')}>{children}</span>}
      {rightIcon && !loading && (
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{rightIcon}</span>
      )}
    </button>
  );
}
