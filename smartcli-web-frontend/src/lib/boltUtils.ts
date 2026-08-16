export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatAbsoluteDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf/i,
  /--force/i,
  /kubectl\s+delete/i,
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /git\s+push\s+.*--force/i,
  /git\s+push\s+.*-f\b/i,
  /truncate\s+/i,
  /format\s+/i,
  /mkfs\s+/i,
  /dd\s+if=/i,
  /shutdown/i,
  /poweroff/i,
  /reboot/i,
  /kubectl\s+scale.*--replicas=0/i,
];

export function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((p) => p.test(command));
}

export function extractPlaceholders(command: string): string[] {
  const matches = command.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/^\{\{|\}\}$/g, '').trim()))];
}

export function applyPlaceholders(
  command: string,
  values: Record<string, string>
): string {
  return command.replace(/\{\{([^}]+)\}\}/g, (_, name) => {
    const key = name.trim();
    return values[key] !== undefined ? values[key] : `{{${key}}}`;
  });
}

export function groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
