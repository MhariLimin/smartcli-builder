import type { ReactNode } from 'react';
import { AlertTriangle, Lock, LogIn, Sparkles, Zap } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

interface DestructiveWarningProps {
  warnings?: string[];
  className?: string;
}

export function DestructiveWarning({ warnings, className }: DestructiveWarningProps) {
  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="text-sm font-medium text-amber-300 mb-1">Review before using</p>
        {warnings && warnings.length > 0 ? (
          <ul className="text-xs text-amber-200/80 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-amber-200/80">
            This command may have destructive effects. Verify parameters carefully before use.
          </p>
        )}
      </div>
    </div>
  );
}

interface ProGateProps {
  feature: string;
  children?: ReactNode;
  className?: string;
}

export function ProGate({ feature, children, className }: ProGateProps) {
  return (
    <div className={cn('relative', className)}>
      {children && (
        <div className="opacity-30 pointer-events-none select-none" aria-hidden>
          {children}
        </div>
      )}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          !children && 'relative inset-auto flex-col gap-4 py-16'
        )}
      >
        <UpsellCard feature={feature} />
      </div>
    </div>
  );
}

interface UpsellCardProps {
  feature: string;
  className?: string;
}

export function UpsellCard({ feature, className }: UpsellCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'w-full max-w-md bg-navy-850 border border-violet-500/30 rounded-2xl p-6 shadow-xl',
        'text-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-violet-400" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 border border-violet-500/30 rounded-full text-violet-400 text-xs font-semibold mb-3">
        <Sparkles className="w-3 h-3" />
        SmartCLI Pro
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-1">{feature}</h3>
      <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
        Upgrade to Pro to unlock AI generation, Kubernetes helpers, SSH workflows, and team templates.
      </p>
      <ul className="text-xs text-slate-400 space-y-1.5 mb-5 text-left max-w-xs mx-auto">
        {['AI command generation', 'Kubernetes helper gallery', 'SSH workflow builder', 'Team workspace templates'].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-violet-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white border-0"
        onClick={() => navigate('/billing/return?demo=upgrade')}
      >
        Upgrade to Pro
      </Button>
      <p className="text-2xs text-slate-600 mt-2">
        The UI lock is informational. Enforcement happens server-side.
      </p>
    </div>
  );
}

interface GuestGateProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function GuestGate({ title, description, children }: GuestGateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center mb-5">
        <LogIn className="w-6 h-6 text-cyan-400" />
      </div>
      <h2 className="text-base font-semibold text-slate-100 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => navigate('/login')}>
          Sign in
        </Button>
        {children}
      </div>
    </div>
  );
}

interface UsageMeterProps {
  used: number;
  limit: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function UsageMeter({ used, limit, label, unit = 'uses', className }: UsageMeterProps) {
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 75;
  const isDanger = pct >= 90;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className={cn('font-medium', isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300')}>
            {used} / {limit} {unit}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-cyan-500'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>
    </div>
  );
}
