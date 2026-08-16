import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '../../lib/boltUtils';
import { useToast } from '../../context/AppContext';

interface CommandCodeProps {
  command: string;
  placeholderValues?: Record<string, string>;
  showCopy?: boolean;
  compact?: boolean;
  wrap?: boolean;
  className?: string;
  onCopy?: () => void;
}

function renderCommand(command: string, values: Record<string, string>) {
  const parts = command.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([^}]+)\}\}$/);
    if (!match) {
      return (
        <span key={i} className="text-slate-200">
          {part}
        </span>
      );
    }
    const name = match[1].trim();
    const value = values[name];
    if (value && value.trim()) {
      return (
        <span key={i} className="text-green-400 font-semibold" title={`${name} = ${value}`}>
          {value}
        </span>
      );
    }
    return (
      <span key={i} className="text-amber-400 italic font-normal" title={`Unfilled: ${name}`}>
        {'{{'}
        {name}
        {'}}'}
      </span>
    );
  });
}

export function CommandCode({
  command,
  placeholderValues = {},
  showCopy = true,
  compact = false,
  wrap = true,
  className,
  onCopy,
}: CommandCodeProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    const finalCommand = command.replace(/\{\{([^}]+)\}\}/g, (_, name) => {
      const v = placeholderValues[name.trim()];
      return v?.trim() ? v : `{{${name}}}`;
    });
    await copyToClipboard(finalCommand);
    setCopied(true);
    showToast('Command copied', 'success', 2000);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative', className)}>
      <pre
        className={cn(
          'font-mono text-sm leading-relaxed bg-navy-950 border border-navy-700',
          'rounded-lg overflow-x-auto',
          compact ? 'px-3 py-2' : 'px-4 py-3',
          wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
          showCopy && 'pr-10'
        )}
      >
        <code>{renderCommand(command, placeholderValues)}</code>
      </pre>
      {showCopy && (
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-md transition-all duration-150',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-navy-800 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'icon' | 'compact';
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ text, label = 'Copy', variant = 'compact', className, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    showToast('Copied to clipboard', 'success', 2000);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : label}
        className={cn(
          'p-1.5 rounded-md transition-all duration-150',
          copied
            ? 'bg-green-500/20 text-green-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700',
          className
        )}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
        copied
          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
          : 'bg-navy-800 text-slate-300 border border-navy-700 hover:border-navy-600 hover:text-slate-100',
        className
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}
