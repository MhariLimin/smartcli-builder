import React from 'react';
import { cn } from '../../lib/boltUtils';
import type { Plan, Role, CommandCategory } from '../../mock-types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cyan' | 'violet' | 'muted';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-navy-700 text-slate-300 border border-navy-600',
  success: 'bg-green-500/15 text-green-400 border border-green-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
  violet: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  muted: 'bg-navy-800 text-slate-500 border border-navy-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  cyan: 'bg-cyan-400',
  violet: 'bg-violet-400',
  muted: 'bg-slate-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'text-2xs px-1.5 py-0.5 rounded',
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-xs px-2.5 py-1 rounded-md',
};

export function Badge({ children, variant = 'default', size = 'sm', className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium', variantClasses[variant], sizeClasses[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} aria-hidden />}
      {children}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return plan === 'pro' ? (
    <Badge variant="violet" size="xs" className="font-semibold tracking-wide uppercase">Pro</Badge>
  ) : (
    <Badge variant="muted" size="xs" className="uppercase tracking-wide">Free</Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { variant: BadgeVariant; label: string }> = {
    owner: { variant: 'cyan', label: 'Owner' },
    admin: { variant: 'info', label: 'Admin' },
    member: { variant: 'success', label: 'Member' },
    viewer: { variant: 'muted', label: 'Viewer' },
  };
  const { variant, label } = map[role];
  return <Badge variant={variant} size="xs">{label}</Badge>;
}

export function CategoryBadge({ category }: { category: CommandCategory | string }) {
  const map: Record<CommandCategory, { variant: BadgeVariant }> = {
    git: { variant: 'warning' },
    docker: { variant: 'info' },
    kubectl: { variant: 'cyan' },
    aws: { variant: 'warning' },
    shell: { variant: 'default' },
    ssh: { variant: 'violet' },
    npm: { variant: 'success' },
    curl: { variant: 'info' },
    other: { variant: 'muted' },
  };
  return <Badge variant={map[category as CommandCategory]?.variant ?? 'muted'} size="xs">{category}</Badge>;
}

export function StatusBadge({ online }: { online: boolean }) {
  return (
    <Badge variant={online ? 'success' : 'danger'} size="xs" dot>
      {online ? 'Connected' : 'Offline'}
    </Badge>
  );
}
