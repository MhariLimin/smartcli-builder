export type DestructiveCommandMatch = {
  category: 'delete' | 'force' | 'drop' | 'stop' | 'scale-zero';
  message: string;
};

type Rule = {
  category: DestructiveCommandMatch['category'];
  re: RegExp;
  message: string;
};

// Keep this list conservative. The Builder warning is advisory, but noisy
// false positives train users to ignore it; Pro confirm gates should import
// this same matcher instead of duplicating command-safety rules.
const RULES: Rule[] = [
  {
    category: 'delete',
    re: /\brm\s+(?:-[A-Za-z]*r[A-Za-z]*f[A-Za-z]*|-[A-Za-z]*f[A-Za-z]*r[A-Za-z]*)\b/,
    message: 'This recursively deletes files. Double-check the path before you run it.'
  },
  {
    category: 'delete',
    re: /\bkubectl\s+(?:\S+\s+){0,3}delete\b/,
    message: 'This deletes Kubernetes resources. Double-check the context and namespace.'
  },
  {
    category: 'drop',
    re: /\b(?:drop\s+(?:database|schema|table|index|view)|truncate\s+table)\b/i,
    message: 'This can remove database objects or data. Double-check the target first.'
  },
  {
    category: 'stop',
    re: /\bsystemctl\s+stop\b/,
    message: 'This stops a system service. Confirm the host and service name first.'
  },
  {
    category: 'scale-zero',
    re: /\b(?:--replicas(?:=|\s+)0|scale\s+\S+(?:\s+\S+)*\s+--replicas(?:=|\s+)0)\b/,
    message: 'This scales a workload to zero replicas. Confirm the target environment first.'
  },
  {
    category: 'force',
    re: /\b(?:git\s+(?:reset|clean|push|checkout|switch|branch|tag)\b.*(?:--force\b|\s-f\b)|docker\s+(?:rm|rmi|system\s+prune|volume\s+rm)\b.*(?:--force\b|\s-f\b)|kubectl\s+(?:delete|replace|apply|patch)\b.*(?:--force\b|\s-f\b))/,
    message: 'This uses force on a destructive operation. Review the target before copying.'
  }
];

export function classifyDestructiveCommand(command: string): DestructiveCommandMatch | null {
  const normalized = command.trim().toLowerCase();
  if (!normalized) return null;

  for (const rule of RULES) {
    if (rule.re.test(normalized)) {
      return {
        category: rule.category,
        message: rule.message
      };
    }
  }

  return null;
}
