// Heuristic tag suggestions for the Save-to-folder modal. Inputs are the
// command text and (optionally) the catalog category it came from. Output is
// a sorted, deduplicated list of suggested tags. False positives are cheaper
// than false negatives here — the user can always remove a chip — so the
// rules are intentionally broad rather than clever.

// First-token → canonical tag. Plain-prefix only; extend the map rather than
// adding regex rules. Add liberally — a wrong suggestion costs one click.
const TOKEN_TO_TAG: Record<string, string> = {
  kubectl: 'kubectl',
  kubens: 'kubectl',
  kubectx: 'kubectl',
  k9s: 'kubectl',
  docker: 'docker',
  'docker-compose': 'docker',
  podman: 'docker',
  git: 'git',
  ssh: 'ssh',
  scp: 'ssh',
  rsync: 'ssh',
  sftp: 'ssh',
  helm: 'helm',
  terraform: 'terraform',
  tofu: 'terraform',
  ansible: 'ansible',
  'ansible-playbook': 'ansible',
  mvn: 'build',
  gradle: 'build',
  './gradlew': 'build',
  make: 'build',
  npm: 'node',
  yarn: 'node',
  pnpm: 'node',
  npx: 'node',
  mysql: 'db',
  psql: 'db',
  'redis-cli': 'db',
  mongosh: 'db',
  mongo: 'db',
  curl: 'http',
  wget: 'http',
  httpie: 'http',
  http: 'http',
  bash: 'shell',
  sh: 'shell',
  zsh: 'shell',
  source: 'shell',
  '.': 'shell',
  aws: 'aws',
  gcloud: 'gcp',
  az: 'azure',
  keytool: 'java',
  java: 'java',
  jar: 'java',
  python: 'python',
  python3: 'python',
  pip: 'python',
  pip3: 'python',
  pipenv: 'python',
  poetry: 'python',
  go: 'go',
  cargo: 'rust',
  rustc: 'rust',
  systemctl: 'systemd',
  journalctl: 'systemd',
  openssl: 'security',
  'ssh-keygen': 'security',
  gpg: 'security',
  vault: 'security',
  claude: 'ai',
  codex: 'ai',
  ollama: 'ai'
};

// Pipes, redirection, conjunctions, sequencing — all signals that the line
// is a real shell composition rather than a single tool invocation.
const SHELL_FEATURE_RE = /[|;]|&&|\|\||>>|>>?|<</;

export function suggestTags(command: string, category?: string): string[] {
  const trimmed = command.trim();
  if (!trimmed) return [];

  const tags = new Set<string>();
  const tokens = trimmed.split(/\s+/).map((t) => t.toLowerCase());

  // First-token detection (the most reliable signal).
  const first = tokens[0];
  if (TOKEN_TO_TAG[first]) tags.add(TOKEN_TO_TAG[first]);

  // Kafka shell scripts: `kafka-topics.sh`, `kafka-console-consumer`, etc.
  if (first.startsWith('kafka-') || first.startsWith('kafka.')) {
    tags.add('kafka');
  }

  // Shell composition features anywhere in the line.
  if (SHELL_FEATURE_RE.test(trimmed)) tags.add('shell');

  // Compound commands like `kubectl exec ... -- bash -c "git pull"`: scan
  // subsequent tokens for known tool prefixes too so all involved tools
  // get tagged.
  for (const tok of tokens.slice(1)) {
    if (TOKEN_TO_TAG[tok]) tags.add(TOKEN_TO_TAG[tok]);
    if (tok.startsWith('kafka-') || tok.startsWith('kafka.')) {
      tags.add('kafka');
    }
  }

  // Catalog category, if provided, is also a strong signal. Normalized to
  // lowercase to match the rest of the tag namespace.
  if (category) {
    const c = category.trim().toLowerCase();
    if (c) tags.add(c);
  }

  return Array.from(tags).sort();
}
