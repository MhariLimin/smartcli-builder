export interface CategoryDoc {
  label: string;
  blurb: string;
  docsUrl: string;
}

export const CATEGORY_DOCS: Record<string, CategoryDoc> = {
  ansible: {
    label: 'Ansible',
    blurb: 'Agentless config management and playbook runner.',
    docsUrl: 'https://docs.ansible.com/ansible/latest/cli/index.html'
  },
  awk: {
    label: 'awk',
    blurb: 'Pattern-scanning and field-processing language.',
    docsUrl: 'https://www.gnu.org/software/gawk/manual/gawk.html'
  },
  cargo: {
    label: 'Cargo',
    blurb: "Rust's package manager and build tool.",
    docsUrl: 'https://doc.rust-lang.org/cargo/commands/index.html'
  },
  claude: {
    label: 'Claude Code',
    blurb: "Anthropic's terminal CLI for agentic coding sessions.",
    docsUrl: 'https://docs.claude.com/en/docs/claude-code/overview'
  },
  conda: {
    label: 'Conda',
    blurb: 'Cross-platform Python/data-science environment manager.',
    docsUrl: 'https://docs.conda.io/projects/conda/en/stable/commands/index.html'
  },
  containerd: {
    label: 'containerd (ctr)',
    blurb: 'Low-level container runtime CLI used by Kubernetes.',
    docsUrl: 'https://github.com/containerd/containerd/blob/main/docs/getting-started.md'
  },
  crictl: {
    label: 'crictl',
    blurb: 'CRI debugging tool for inspecting Kubernetes nodes.',
    docsUrl: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/'
  },
  curl: {
    label: 'curl',
    blurb: 'Transfer data over HTTP, FTP, and many other protocols.',
    docsUrl: 'https://curl.se/docs/manpage.html'
  },
  docker: {
    label: 'Docker',
    blurb: 'Build, run, and ship container images.',
    docsUrl: 'https://docs.docker.com/reference/cli/docker/'
  },
  'docker-buildx': {
    label: 'Docker Buildx',
    blurb: 'Multi-arch and cache-aware Docker builds via BuildKit.',
    docsUrl: 'https://docs.docker.com/reference/cli/docker/buildx/'
  },
  'docker-compose': {
    label: 'Docker Compose',
    blurb: 'Define and run multi-container applications.',
    docsUrl: 'https://docs.docker.com/reference/cli/docker/compose/'
  },
  gh: {
    label: 'GitHub CLI (gh)',
    blurb: 'Manage repos, PRs, issues, releases, and Actions.',
    docsUrl: 'https://cli.github.com/manual/'
  },
  git: {
    label: 'Git',
    blurb: 'Distributed version control.',
    docsUrl: 'https://git-scm.com/docs'
  },
  go: {
    label: 'Go',
    blurb: 'Build, test, and manage Go modules.',
    docsUrl: 'https://pkg.go.dev/cmd/go'
  },
  gradle: {
    label: 'Gradle',
    blurb: 'JVM build tool with Kotlin/Groovy DSL.',
    docsUrl: 'https://docs.gradle.org/current/userguide/command_line_interface.html'
  },
  harbor: {
    label: 'Harbor',
    blurb: 'Cloud-native container registry — REST API.',
    docsUrl: 'https://goharbor.io/docs/main/api/'
  },
  helm: {
    label: 'Helm',
    blurb: 'Package manager for Kubernetes (charts).',
    docsUrl: 'https://helm.sh/docs/helm/helm/'
  },
  iptables: {
    label: 'iptables',
    blurb: 'Linux packet filtering and NAT.',
    docsUrl: 'https://www.netfilter.org/documentation/index.html'
  },
  java: {
    label: 'Java / JVM',
    blurb: 'JVM launcher, JDK tools, and diagnostics.',
    docsUrl: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/index.html'
  },
  journalctl: {
    label: 'journalctl',
    blurb: "Query systemd's journal for service and kernel logs.",
    docsUrl: 'https://www.freedesktop.org/software/systemd/man/latest/journalctl.html'
  },
  jq: {
    label: 'jq',
    blurb: 'Command-line JSON processor.',
    docsUrl: 'https://jqlang.github.io/jq/manual/'
  },
  kafka: {
    label: 'Apache Kafka',
    blurb: 'Topic, consumer-group, and admin shell scripts.',
    docsUrl: 'https://kafka.apache.org/documentation/#basic_ops'
  },
  kcadm: {
    label: 'Keycloak Admin CLI (kcadm)',
    blurb: 'Manage realms, clients, users, and roles via Keycloak admin REST.',
    docsUrl: 'https://www.keycloak.org/docs/latest/server_admin/index.html#the-admin-cli'
  },
  keytool: {
    label: 'keytool',
    blurb: 'Java keystore management — keypairs, certs, conversions.',
    docsUrl: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/keytool.html'
  },
  kubectl: {
    label: 'kubectl',
    blurb: 'Primary CLI for Kubernetes clusters.',
    docsUrl: 'https://kubernetes.io/docs/reference/kubectl/'
  },
  linux: {
    label: 'Linux / coreutils',
    blurb: 'Common Unix utilities — file, process, network, and text tools.',
    docsUrl: 'https://man7.org/linux/man-pages/index.html'
  },
  maven: {
    label: 'Apache Maven',
    blurb: 'JVM build and dependency tool.',
    docsUrl: 'https://maven.apache.org/ref/current/maven-embedder/cli.html'
  },
  mongosh: {
    label: 'MongoDB Shell',
    blurb: 'Connect to MongoDB and run queries / dumps.',
    docsUrl: 'https://www.mongodb.com/docs/mongodb-shell/'
  },
  mysql: {
    label: 'MySQL / TiDB',
    blurb: 'Connect, query, dump, and restore MySQL-compatible databases.',
    docsUrl: 'https://dev.mysql.com/doc/refman/8.0/en/programs.html'
  },
  node: {
    label: 'Node.js',
    blurb: 'Run, debug, and tune Node.js processes.',
    docsUrl: 'https://nodejs.org/api/cli.html'
  },
  npm: {
    label: 'npm',
    blurb: 'Node package manager — install, audit, run scripts, publish.',
    docsUrl: 'https://docs.npmjs.com/cli/v10/commands'
  },
  openssl: {
    label: 'OpenSSL',
    blurb: 'TLS, certificates, keys, hashing, and encryption.',
    docsUrl: 'https://docs.openssl.org/master/man1/'
  },
  pip: {
    label: 'pip',
    blurb: "Python's package installer.",
    docsUrl: 'https://pip.pypa.io/en/stable/cli/'
  },
  pnpm: {
    label: 'pnpm',
    blurb: 'Fast, disk-efficient Node package manager.',
    docsUrl: 'https://pnpm.io/cli/install'
  },
  powershell: {
    label: 'PowerShell',
    blurb: 'Windows shell and scripting language.',
    docsUrl: 'https://learn.microsoft.com/en-us/powershell/scripting/overview'
  },
  psql: {
    label: 'PostgreSQL (psql)',
    blurb: 'PostgreSQL interactive client and dump/restore tools.',
    docsUrl: 'https://www.postgresql.org/docs/current/app-psql.html'
  },
  python: {
    label: 'Python',
    blurb: 'Interpreter flags and built-in module entry points.',
    docsUrl: 'https://docs.python.org/3/using/cmdline.html'
  },
  'redis-cli': {
    label: 'redis-cli',
    blurb: 'Redis interactive client.',
    docsUrl: 'https://redis.io/docs/latest/develop/connect/cli/'
  },
  rsync: {
    label: 'rsync',
    blurb: 'Fast, incremental file synchronization over SSH or local.',
    docsUrl: 'https://download.samba.org/pub/rsync/rsync.1'
  },
  sed: {
    label: 'sed',
    blurb: 'Stream editor for text transformations.',
    docsUrl: 'https://www.gnu.org/software/sed/manual/sed.html'
  },
  shell: {
    label: 'Shell built-ins',
    blurb: 'POSIX/bash/zsh built-ins — source, export, alias, env, history.',
    docsUrl: 'https://www.gnu.org/software/bash/manual/bash.html#Shell-Builtin-Commands'
  },
  ssh: {
    label: 'OpenSSH',
    blurb: 'Secure shell, key management, port forwarding, and SCP/SFTP.',
    docsUrl: 'https://man.openbsd.org/ssh.1'
  },
  systemctl: {
    label: 'systemctl',
    blurb: 'Manage systemd services and units.',
    docsUrl: 'https://www.freedesktop.org/software/systemd/man/latest/systemctl.html'
  },
  terraform: {
    label: 'Terraform',
    blurb: 'Infrastructure as code — plan, apply, state management.',
    docsUrl: 'https://developer.hashicorp.com/terraform/cli/commands'
  },
  tmux: {
    label: 'tmux',
    blurb: 'Terminal multiplexer — sessions, windows, panes.',
    docsUrl: 'https://github.com/tmux/tmux/wiki'
  },
  vim: {
    label: 'Vim',
    blurb: 'Modal text editor — common invocations.',
    docsUrl: 'https://vimhelp.org/'
  },
  wget: {
    label: 'wget',
    blurb: 'Non-interactive network downloader.',
    docsUrl: 'https://www.gnu.org/software/wget/manual/wget.html'
  },
  wsl: {
    label: 'Windows Subsystem for Linux',
    blurb: 'Manage WSL distributions on Windows.',
    docsUrl: 'https://learn.microsoft.com/en-us/windows/wsl/basic-commands'
  },
  yarn: {
    label: 'Yarn',
    blurb: 'Node package manager (Classic and Berry).',
    docsUrl: 'https://yarnpkg.com/cli'
  },
  yq: {
    label: 'yq',
    blurb: 'Command-line YAML/JSON/XML processor.',
    docsUrl: 'https://mikefarah.gitbook.io/yq'
  }
};

export function categoryLabel(name: string): string {
  return CATEGORY_DOCS[name]?.label ?? name;
}
