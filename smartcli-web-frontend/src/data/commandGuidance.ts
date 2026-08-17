export interface CommandGuidance {
  summary: string;
  effect: string;
  assumptions: string[];
  expectedOutput: string;
  commonErrors: string[];
  verification: string;
  recovery?: string;
  tokenDescriptions: Record<string, string>;
  sensitiveSlots?: string[];
  sources: Array<{ label: string; url?: string }>;
}

export interface GuidanceResult {
  guidance: CommandGuidance;
  coverage: 'reviewed' | 'catalog-derived';
}

export const COMMAND_GUIDANCE: Record<string, CommandGuidance> = {
  'kubectl describe deployment <name> -n <namespace>': {
    summary: 'Reads detailed deployment state and related events from one Kubernetes namespace.',
    effect: 'Read-only API request; it does not modify the deployment.',
    assumptions: ['Your current kubeconfig context points at the intended cluster.', 'Your identity can read deployments and events in the namespace.'],
    expectedOutput: 'Deployment metadata, replica status, pod template, conditions, and recent events.',
    commonErrors: ['Deployment not found because the name or namespace is wrong.', 'Forbidden response when RBAC does not grant read access.'],
    verification: 'kubectl config current-context',
    tokenDescriptions: { kubectl: 'Kubernetes command-line client', describe: 'Print detailed resource state and related events', deployment: 'Resource type to inspect', '<name>': 'Deployment name; required', '-n': 'Select a namespace', '<namespace>': 'Namespace name; required' },
    sources: [{ label: 'kubectl describe reference', url: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_describe/' }]
  },
  'kubectl get pods -n <namespace>': {
    summary: 'Lists pods visible in one Kubernetes namespace.', effect: 'Read-only API request; no workload is changed.',
    assumptions: ['The current kubeconfig context and namespace are intentional.'], expectedOutput: 'A table containing pod names, readiness, status, restarts, and age.',
    commonErrors: ['Namespace not found.', 'Forbidden response from cluster RBAC.'], verification: 'kubectl config current-context',
    tokenDescriptions: { kubectl: 'Kubernetes command-line client', get: 'Retrieve one or more resources', pods: 'Pod resources', '-n': 'Select a namespace', '<namespace>': 'Namespace name; required' },
    sources: [{ label: 'kubectl get reference', url: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/' }]
  },
  'docker logs --tail <lines> <container>': {
    summary: 'Reads a bounded number of recent log lines from one container.', effect: 'Read-only Docker API request; it does not restart or modify the container.',
    assumptions: ['The Docker daemon is reachable.', 'The container uses a logging driver that supports reading logs.'], expectedOutput: 'Up to the requested number of log lines from stdout and stderr.',
    commonErrors: ['No such container.', 'Permission denied while accessing the Docker daemon.'], verification: 'docker ps --all',
    tokenDescriptions: { docker: 'Docker command-line client', logs: 'Fetch container logs', '--tail': 'Limit output to the most recent lines', '<lines>': 'Positive line count; required', '<container>': 'Container name or ID; required' },
    sources: [{ label: 'Docker logs reference', url: 'https://docs.docker.com/reference/cli/docker/container/logs/' }]
  },
  'git reflog': {
    summary: 'Shows recent local updates to HEAD and other references for recovery investigation.', effect: 'Reads repository metadata; it does not move a branch or working tree.',
    assumptions: ['Run inside the intended local Git repository.', 'The desired movement is still retained in the local reflog.'], expectedOutput: 'Recent reference positions with commit IDs, selectors, and action descriptions.',
    commonErrors: ['Not a Git repository.', 'A desired entry has expired or was removed by maintenance.'], verification: 'git status',
    recovery: 'Choose and verify a reflog commit before using a separate branch or reset command. This command itself needs no rollback.',
    tokenDescriptions: { git: 'Git command-line client', reflog: 'Show local reference movement history' },
    sources: [{ label: 'Git reflog manual', url: 'https://git-scm.com/docs/git-reflog.html' }]
  },
  'git status': {
    summary: 'Summarizes the working tree and staging area.', effect: 'Reads local repository state and does not change files or commits.', assumptions: ['Run inside the intended Git worktree.'],
    expectedOutput: 'Current branch plus staged, unstaged, and untracked paths.', commonErrors: ['Not a Git repository.'], verification: 'git rev-parse --show-toplevel',
    tokenDescriptions: { git: 'Git command-line client', status: 'Show worktree and index state' }, sources: [{ label: 'Git status manual', url: 'https://git-scm.com/docs/git-status' }]
  },
  'ssh <user>@<host>': {
    summary: 'Starts an encrypted interactive connection to a remote SSH server.', effect: 'Opens a remote login session; SmartCLI only authors and copies the command.',
    assumptions: ['The host identity is known and intended.', 'Authentication is configured outside SmartCLI.'], expectedOutput: 'A host-key prompt, authentication exchange, and then a remote shell on success.',
    commonErrors: ['Host-key verification failed.', 'Permission denied or connection timed out.'], verification: 'ssh -v <user>@<host>',
    recovery: 'Type exit or press Ctrl-D to close an established interactive session.', sensitiveSlots: ['<user>', '<host>'],
    tokenDescriptions: { ssh: 'OpenSSH remote-login client', '<user>@<host>': 'Remote login identity and destination; required' },
    sources: [{ label: 'OpenSSH client manual', url: 'https://man.openbsd.org/ssh.1' }]
  },
  'ls -la': {
    summary: 'Lists directory entries in long format, including hidden names.', effect: 'Reads directory metadata; it does not modify files.',
    assumptions: ['Run in the directory you intend to inspect.'], expectedOutput: 'One long-format row per entry, including permissions, ownership, size, and modification time.',
    commonErrors: ['Permission denied while reading the directory.'], verification: 'pwd',
    tokenDescriptions: { ls: 'List directory contents', '-la': 'Combine long format (-l) with hidden entries (-a)' },
    sources: [{ label: 'GNU ls manual', url: 'https://www.gnu.org/software/coreutils/ls' }]
  }
};

const READ_ACTIONS = new Set(['get', 'list', 'show', 'describe', 'inspect', 'logs', 'log', 'status', 'history', 'reflog', 'diff', 'ps', 'version', '--version', 'help', '--help', 'view', 'check', 'search', 'find', 'cat', 'ls']);
const WRITE_ACTIONS = new Set(['create', 'delete', 'remove', 'rm', 'apply', 'set', 'scale', 'restart', 'stop', 'start', 'kill', 'push', 'commit', 'merge', 'rebase', 'reset', 'install', 'uninstall', 'update', 'upgrade', 'deploy', 'expose']);

const CATEGORY_CONTEXT: Record<string, { subject: string; verify: string }> = {
  kubectl: { subject: 'the selected Kubernetes cluster', verify: 'kubectl config current-context' },
  docker: { subject: 'the active Docker daemon', verify: 'docker context show' },
  'docker-compose': { subject: 'the current Compose project', verify: 'docker compose config' },
  git: { subject: 'the current Git repository', verify: 'git status' },
  ssh: { subject: 'the specified remote host', verify: 'ssh -G <host>' },
  linux: { subject: 'the local operating-system environment', verify: 'pwd' },
  powershell: { subject: 'the current PowerShell session', verify: '$PSVersionTable.PSVersion' },
  mysql: { subject: 'the selected MySQL server or database', verify: 'mysql --version' },
  kafka: { subject: 'the selected Kafka cluster', verify: 'Confirm the bootstrap server before copying.' },
  maven: { subject: 'the current Maven project', verify: 'mvn --version' },
  gradle: { subject: 'the current Gradle project', verify: 'gradle --version' },
  java: { subject: 'the configured Java runtime', verify: 'java -version' },
  curl: { subject: 'the specified network endpoint', verify: 'Review the URL, method, headers, and body.' },
  containerd: { subject: 'the active containerd runtime', verify: 'ctr version' }
};

const TOKEN_GLOSSARY: Record<string, string> = {
  '-n': 'Scope the operation to a named namespace or limit a numeric result, depending on the tool.',
  '--namespace': 'Scope the operation to a Kubernetes namespace.',
  '-f': 'Tool-specific flag; commonly selects a file or follows streamed output.',
  '--force': 'Bypass a normal safety check; review carefully before copying.',
  '-r': 'Tool-specific recursive or remote option.',
  '-v': 'Enable verbose output or print a version, depending on the tool.',
  '--dry-run': 'Preview or validate the operation without applying its normal change.',
  '--help': 'Display built-in command documentation.',
  '--version': 'Display the installed tool version.'
};

const TOOL_SHORT_OPTIONS: Record<string, Record<string, string>> = {
  ssh: {
    '-N': 'Do not execute a remote command; useful when creating port forwards only.',
    '-p': 'Connect to the remote SSH server on this port.', '-i': 'Use the specified private-key identity file.',
    '-L': 'Forward a local port to a host and port reachable from the remote side.', '-R': 'Forward a remote port back to a host and port on the local side.',
    '-D': 'Create a local dynamic SOCKS proxy.', '-J': 'Connect through the specified jump host.', '-A': 'Forward the local authentication agent.',
    '-C': 'Request compression for the encrypted connection.', '-f': 'Move SSH to the background before executing the command.',
    '-t': 'Force pseudo-terminal allocation.', '-v': 'Increase diagnostic verbosity.'
  },
  kubectl: {
    '-n': 'Target the specified Kubernetes namespace.', '-A': 'Include resources across all namespaces.', '-f': 'Read the resource definition from a file, directory, or URL.',
    '-o': 'Select the output format.', '-l': 'Filter resources using a label selector.', '-c': 'Select a container within a pod.',
    '-it': 'Keep standard input open and allocate an interactive terminal.', '-p': 'Supply an inline patch or tool-specific port value for this action.'
  },
  docker: {
    '-d': 'Run the container in detached background mode.', '-i': 'Keep standard input open.', '-t': 'Allocate a pseudo-terminal or assign an image tag, depending on the subcommand.',
    '-it': 'Keep standard input open and allocate a pseudo-terminal.', '-p': 'Publish a container port on the host.', '-v': 'Mount a volume or bind path.',
    '-u': 'Run as the specified user.', '-a': 'Attach to the selected stream or include all containers, depending on the subcommand.', '-f': 'Select a file or follow output, depending on the subcommand.'
  },
  git: {
    '-m': 'Supply a commit, merge, or tag message.', '-b': 'Create or select a branch in this operation.', '-A': 'Include all working-tree changes.',
    '-p': 'Use interactive patch mode.', '-s': 'Use short output or add a sign-off, depending on the subcommand.', '-d': 'Delete the selected branch or reference.',
    '-i': 'Use the interactive form of this operation.'
  },
  curl: { '-X': 'Use the specified HTTP request method.', '-H': 'Add an HTTP request header.', '-d': 'Send the supplied request body data.', '-o': 'Write response data to the specified file.' },
  mysql: { '-h': 'Connect to this database host.', '-P': 'Connect on this TCP port.', '-u': 'Authenticate as this database user.', '-p': 'Prompt for a password without placing it in the command.' },
  psql: { '-h': 'Connect to this PostgreSQL host.', '-p': 'Connect on this TCP port.', '-U': 'Authenticate as this database user.', '-d': 'Connect to this database.', '-f': 'Execute SQL from this file.', '-c': 'Execute this SQL command.' },
  rsync: { '-avz': 'Archive recursively, preserve metadata, show verbose progress, and compress data in transit.', '-e': 'Use the specified remote-shell command.' },
  java: { '-jar': 'Run the application packaged in the specified JAR file.' },
  python: { '-m': 'Run the named Python module as a script.' },
  journalctl: { '-u': 'Show logs for the specified systemd unit.' },
  helm: { '-n': 'Target the specified Kubernetes namespace.', '-f': 'Load chart values from the specified file.' },
  ansible: { '-i': 'Use the specified inventory source.', '-m': 'Run the specified Ansible module.' },
  grep: { '-i': 'Match without case sensitivity.', '-n': 'Print matching line numbers.', '-R': 'Search directories recursively.', '-E': 'Interpret the pattern as an extended regular expression.' },
  find: { '-name': 'Match entries by name pattern.', '-type': 'Match entries by filesystem type.', '-mtime': 'Match by modification age.' },
  mkdir: { '-p': 'Create missing parent directories and do not fail when the directory already exists.' },
  rm: { '-r': 'Remove directories and their contents recursively.', '-f': 'Ignore missing paths and suppress confirmation prompts.' },
  ls: { '-l': 'Use long listing format.', '-a': 'Include hidden entries.', '-h': 'Display sizes in human-readable units.', '-R': 'List subdirectories recursively.' }
};

export function getCommandGuidance(template: string, category = ''): GuidanceResult | null {
  const reviewed = COMMAND_GUIDANCE[template];
  if (reviewed) return { guidance: reviewed, coverage: 'reviewed' };
  if (!template.trim()) return null;
  return { guidance: deriveGuidance(template, category), coverage: 'catalog-derived' };
}

function deriveGuidance(template: string, category: string): CommandGuidance {
  const tokens = template.trim().split(/\s+/);
  const executable = tokens[0];
  const action = tokens.find((token, index) => index > 0 && !token.startsWith('-') && !token.startsWith('<')) ?? '';
  const normalizedAction = action.replace(/[^a-zA-Z-].*$/, '').toLowerCase();
  const readOnly = READ_ACTIONS.has(normalizedAction) || READ_ACTIONS.has(executable);
  const mayWrite = tokens.some((token) => WRITE_ACTIONS.has(token.toLowerCase()));
  const context = CATEGORY_CONTEXT[category] ?? { subject: `the environment addressed by ${executable}`, verify: `${executable} --version` };

  const tokenDescriptions: Record<string, string> = {};
  tokens.forEach((token, index) => {
    if (TOKEN_GLOSSARY[token]) tokenDescriptions[token] = TOKEN_GLOSSARY[token];
    else if (token.startsWith('-')) {
      const explanation = describeOption(executable, token, action);
      if (explanation) tokenDescriptions[token] = explanation;
    }
    else if (token.startsWith('<') && token.endsWith('>')) tokenDescriptions[token] = describePlaceholder(token);
    else if (index === 0) tokenDescriptions[token] = `${category || token} command-line program`;
    else if (index === 1) tokenDescriptions[token] = `${token} action or subcommand`;
  });

  const effect = readOnly && !mayWrite
    ? `Appears read-only from its catalogued action and reads from ${context.subject}. Review tool-specific behavior before running.`
    : mayWrite
      ? `May change ${context.subject}. Review every resolved value and the tool documentation before running.`
      : `Interacts with ${context.subject}. Its effect cannot be classified as strictly read-only from syntax alone.`;

  return {
    summary: `Runs the catalogued ${category || executable} template “${template}”.`,
    effect,
    assumptions: [`${executable} is installed and available on PATH.`, `The active context, account, and target environment are intentional.`],
    expectedOutput: readOnly ? 'Structured text, a table, or status information; exact formatting depends on the installed tool version.' : 'A status message, created/updated resource details, or no output on success; check the process exit code.',
    commonErrors: ['The command-line tool is missing or not authenticated.', 'A required value, target, permission, or active context is incorrect.'],
    verification: context.verify,
    recovery: mayWrite ? 'No universal rollback is catalogued for this template. Capture current state and consult the tool documentation before applying it.' : undefined,
    tokenDescriptions,
    sensitiveSlots: tokens.filter((token) => /password|passphrase|secret|token|private-key/i.test(token)),
    sources: [{ label: 'SmartCLI version-controlled command catalog' }]
  };
}

function describePlaceholder(token: string): string {
  const name = token.slice(1, -1).replace(/-/g, ' ');
  const sensitive = /password|passphrase|secret|token|private key/i.test(name);
  return `Required ${name} value.${sensitive ? ' Treat this value as sensitive.' : ''}`;
}

function describeOption(executable: string, token: string, action: string): string | null {
  const exact = TOOL_SHORT_OPTIONS[executable]?.[token];
  if (exact) return exact;

  const optionName = token.split('=')[0];
  const assignedValue = token.includes('=') ? token.slice(token.indexOf('=') + 1) : '';
  const readableName = optionName.replace(/^-+/, '').replace(/-/g, ' ');
  if (optionName.startsWith('--') || readableName.length > 1) {
    return assignedValue
      ? `Set ${readableName} to ${assignedValue} for the ${action || executable} operation.`
      : `Enable or configure ${readableName} for the ${action || executable} operation.`;
  }

  return null;
}
