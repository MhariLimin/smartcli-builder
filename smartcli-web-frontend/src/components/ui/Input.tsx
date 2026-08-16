import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/boltUtils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  wrapperClassName?: string;
}

export function TextInput({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  className,
  wrapperClassName,
  id,
  ...props
}: TextInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-500 flex items-center pointer-events-none">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-navy-850 border rounded-lg text-sm text-slate-100 placeholder-slate-500',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
            error
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              : 'border-navy-700 hover:border-navy-600',
            leftIcon ? 'pl-9' : 'pl-3',
            rightSlot ? 'pr-10' : 'pr-3',
            'py-2 h-9',
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-3 text-slate-500 flex items-center">{rightSlot}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none flex-shrink-0" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full bg-navy-850 border border-navy-700 hover:border-navy-600',
          'rounded-lg text-sm text-slate-100 placeholder-slate-500',
          'pl-9 pr-8 py-2 h-9',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
          'transition-colors duration-150'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  wrapperClassName?: string;
}

export function Select({ label, error, options, className, wrapperClassName, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full bg-navy-850 border rounded-lg text-sm text-slate-100',
          'px-3 py-2 h-9',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
          'transition-colors duration-150',
          error ? 'border-red-500' : 'border-navy-700 hover:border-navy-600',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({ label, error, hint, className, wrapperClassName, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full bg-navy-850 border rounded-lg text-sm text-slate-100 placeholder-slate-500',
          'px-3 py-2 resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
          'transition-colors duration-150',
          error ? 'border-red-500' : 'border-navy-700 hover:border-navy-600',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center bg-navy-850 border border-navy-700 rounded-lg p-0.5 gap-0.5',
        className
      )}
      role="group"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex-1 justify-center',
            value === opt.value
              ? 'bg-navy-700 text-slate-100 shadow-inner-highlight'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {opt.icon && <span className="w-3.5 h-3.5">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
}

export function Checkbox({ label, hint, className, id, ...props }: CheckboxProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className={cn('flex items-start gap-2.5 cursor-pointer group', className)}>
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          'mt-0.5 w-4 h-4 rounded border border-navy-600 bg-navy-850',
          'checked:bg-cyan-500 checked:border-cyan-500',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-1 focus:ring-offset-navy-900',
          'transition-colors accent-cyan-500'
        )}
        {...props}
      />
      <div>
        <span className="text-sm text-slate-200 group-hover:text-slate-100 leading-tight">{label}</span>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}
