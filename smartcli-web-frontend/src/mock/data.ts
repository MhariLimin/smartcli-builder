import type {
  User, Workspace, WorkspaceMember, PendingInvite,
  CommandTemplate, SavedCommand, Folder,
  HistoryEntry, AIGenerationResult, AIUsage,
  K8sContext, K8sHelper,
  SSHHost, SSHWorkflow,
} from '../mock-types';

// ─── Users ──────────────────────────────────────────────────────────────────

export const USERS: Record<string, User> = {
  sarah: {
    id: 'u-sarah',
    email: 'sarah@acme.io',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
    createdAt: '2024-01-15T10:00:00Z',
  },
  john: {
    id: 'u-john',
    email: 'john@acme.io',
    displayName: 'John Mercer',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
    createdAt: '2023-11-02T08:30:00Z',
  },
  alex: {
    id: 'u-alex',
    email: 'alex@acme.io',
    displayName: 'Alex Rivera',
    avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
    createdAt: '2024-02-20T09:15:00Z',
  },
  maya: {
    id: 'u-maya',
    email: 'maya@acme.io',
    displayName: 'Maya Patel',
    createdAt: '2024-03-05T14:20:00Z',
  },
};

// ─── Workspaces ──────────────────────────────────────────────────────────────

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Personal',
    slug: 'personal',
    plan: 'free',
    ownerId: 'u-sarah',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ws-acme',
    name: 'Acme Platform',
    slug: 'acme-platform',
    plan: 'pro',
    ownerId: 'u-john',
    createdAt: '2023-11-02T08:30:00Z',
  },
];

export const MEMBERS: WorkspaceMember[] = [
  {
    id: 'wm-1',
    userId: 'u-john',
    workspaceId: 'ws-acme',
    role: 'owner',
    status: 'active',
    user: USERS.john,
    joinedAt: '2023-11-02T08:30:00Z',
  },
  {
    id: 'wm-2',
    userId: 'u-sarah',
    workspaceId: 'ws-acme',
    role: 'admin',
    status: 'active',
    user: USERS.sarah,
    joinedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'wm-3',
    userId: 'u-alex',
    workspaceId: 'ws-acme',
    role: 'member',
    status: 'active',
    user: USERS.alex,
    joinedAt: '2024-02-21T09:15:00Z',
  },
  {
    id: 'wm-4',
    userId: 'u-maya',
    workspaceId: 'ws-acme',
    role: 'viewer',
    status: 'active',
    user: USERS.maya,
    joinedAt: '2024-03-06T14:20:00Z',
  },
];

export const PENDING_INVITES: PendingInvite[] = [
  {
    id: 'inv-1',
    workspaceId: 'ws-acme',
    email: 'carlos@acme.io',
    role: 'member',
    invitedAt: '2026-06-08T10:00:00Z',
    inviteLink: 'https://smartcli.dev/invite/abc123xyz',
  },
  {
    id: 'inv-2',
    workspaceId: 'ws-acme',
    email: 'priya@startup.io',
    role: 'viewer',
    invitedAt: '2026-06-07T15:30:00Z',
    inviteLink: 'https://smartcli.dev/invite/def456uvw',
  },
];

// ─── Folders ──────────────────────────────────────────────────────────────────

export const FOLDERS: Folder[] = [
  { id: 'f-git', name: 'Git', workspaceId: 'ws-personal', createdAt: '2024-01-20T00:00:00Z' },
  { id: 'f-docker', name: 'Docker', workspaceId: 'ws-personal', createdAt: '2024-01-20T00:00:00Z' },
  { id: 'f-k8s', name: 'Kubernetes', workspaceId: 'ws-personal', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'f-infra', name: 'Infrastructure', workspaceId: 'ws-acme', createdAt: '2024-02-15T00:00:00Z' },
  { id: 'f-deploy', name: 'Deployments', workspaceId: 'ws-acme', parentId: 'f-infra', createdAt: '2024-03-01T00:00:00Z' },
];

// ─── Saved Commands ──────────────────────────────────────────────────────────

export const SAVED_COMMANDS: SavedCommand[] = [
  {
    id: 'sc-1',
    label: 'Interactive rebase last N commits',
    command: 'git rebase -i HEAD~{{count}}',
    category: 'git',
    tags: ['rebase', 'history', 'cleanup'],
    notes: 'Use to squash, reword, or reorder commits.',
    folderId: 'f-git',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-12T08:30:00Z',
    isDestructive: false,
  },
  {
    id: 'sc-2',
    label: 'Force push branch',
    command: 'git push origin {{branch}} --force-with-lease',
    category: 'git',
    tags: ['push', 'force'],
    folderId: 'f-git',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-02-05T11:00:00Z',
    updatedAt: '2024-02-05T11:00:00Z',
    isDestructive: true,
  },
  {
    id: 'sc-3',
    label: 'Docker build and tag',
    command: 'docker build -t {{image}}:{{tag}} -f {{dockerfile}} {{context}}',
    category: 'docker',
    tags: ['build', 'image'],
    folderId: 'f-docker',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-04-01T10:00:00Z',
    isDestructive: false,
  },
  {
    id: 'sc-4',
    label: 'Remove all stopped containers',
    command: 'docker container prune -f',
    category: 'docker',
    tags: ['cleanup', 'prune'],
    notes: 'Safe to run periodically to free disk space.',
    folderId: 'f-docker',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-02-12T14:00:00Z',
    updatedAt: '2024-02-12T14:00:00Z',
    isDestructive: false,
  },
  {
    id: 'sc-5',
    label: 'Kubectl rollout restart deployment',
    command: 'kubectl rollout restart deployment/{{name}} -n {{namespace}}',
    category: 'kubectl',
    tags: ['rollout', 'restart', 'deployment'],
    folderId: 'f-k8s',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-05-10T12:00:00Z',
    isDestructive: false,
  },
  {
    id: 'sc-6',
    label: 'Delete namespace and all resources',
    command: 'kubectl delete namespace {{namespace}}',
    category: 'kubectl',
    tags: ['delete', 'namespace'],
    notes: 'WARNING: deletes everything in the namespace.',
    folderId: 'f-k8s',
    workspaceId: 'ws-personal',
    userId: 'u-sarah',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    isDestructive: true,
  },
  {
    id: 'sc-7',
    label: 'AWS ECR login',
    command: 'aws ecr get-login-password --region {{region}} | docker login --username AWS --password-stdin {{accountId}}.dkr.ecr.{{region}}.amazonaws.com',
    category: 'aws',
    tags: ['ecr', 'login', 'docker'],
    folderId: 'f-infra',
    workspaceId: 'ws-acme',
    userId: 'u-john',
    createdAt: '2024-04-01T09:00:00Z',
    updatedAt: '2024-04-01T09:00:00Z',
    isDestructive: false,
  },
  {
    id: 'sc-8',
    label: 'Tail pod logs with follow',
    command: 'kubectl logs -f {{pod}} -n {{namespace}} --tail={{lines}}',
    category: 'kubectl',
    tags: ['logs', 'debug', 'pod'],
    folderId: 'f-deploy',
    workspaceId: 'ws-acme',
    userId: 'u-sarah',
    createdAt: '2024-04-10T11:00:00Z',
    updatedAt: '2024-05-20T09:00:00Z',
    isDestructive: false,
  },
];

// ─── History ──────────────────────────────────────────────────────────────────

const now = new Date('2026-06-09T10:00:00Z');

function hoursAgo(h: number): string {
  return new Date(now.getTime() - h * 3600000).toISOString();
}
function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 86400000).toISOString();
}

export const HISTORY: HistoryEntry[] = [
  { id: 'h-1', command: 'git rebase -i HEAD~5', category: 'git', label: 'Interactive rebase', copiedAt: hoursAgo(1), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-personal' },
  { id: 'h-2', command: 'docker build -t myapp:latest -f Dockerfile .', category: 'docker', copiedAt: hoursAgo(3), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-personal' },
  { id: 'h-3', command: 'kubectl rollout restart deployment/api -n production', category: 'kubectl', copiedAt: hoursAgo(5), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
  { id: 'h-4', command: 'kubectl delete namespace staging', category: 'kubectl', copiedAt: hoursAgo(7), userId: 'u-sarah', isDestructive: true, workspaceId: 'ws-acme' },
  { id: 'h-5', command: 'git push origin feature/auth --force-with-lease', category: 'git', copiedAt: hoursAgo(9), userId: 'u-sarah', isDestructive: true, workspaceId: 'ws-personal' },
  { id: 'h-6', command: 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com', category: 'aws', copiedAt: daysAgo(1), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
  { id: 'h-7', command: 'kubectl logs -f api-pod-xyz -n production --tail=100', category: 'kubectl', copiedAt: daysAgo(1), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
  { id: 'h-8', command: 'docker container prune -f', category: 'docker', copiedAt: daysAgo(2), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-personal' },
  { id: 'h-9', command: 'git log --oneline --graph --decorate --all', category: 'git', copiedAt: daysAgo(2), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-personal' },
  { id: 'h-10', command: 'kubectl scale deployment/worker --replicas=0 -n production', category: 'kubectl', copiedAt: daysAgo(3), userId: 'u-sarah', isDestructive: true, workspaceId: 'ws-acme' },
  { id: 'h-11', command: 'ssh -i ~/.ssh/id_rsa deploy@prod-server-01 -p 22', category: 'ssh', copiedAt: daysAgo(4), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
  { id: 'h-12', command: 'curl -X POST https://api.example.com/v1/deploy -H "Authorization: Bearer $TOKEN" -d @payload.json', category: 'curl', copiedAt: daysAgo(5), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
  { id: 'h-13', command: 'npm run build && docker build -t app:$(git rev-parse --short HEAD) .', category: 'npm', copiedAt: daysAgo(7), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-personal' },
  { id: 'h-14', command: 'kubectl exec -it api-pod-xyz -n production -- /bin/sh', category: 'kubectl', copiedAt: daysAgo(8), userId: 'u-sarah', isDestructive: false, workspaceId: 'ws-acme' },
];

// ─── Catalog Templates ───────────────────────────────────────────────────────

export const CATALOG_TEMPLATES: CommandTemplate[] = [
  {
    id: 'ct-1',
    name: 'Git interactive rebase',
    body: 'git rebase -i HEAD~{{count}}',
    description: 'Start an interactive rebase session for the last N commits.',
    category: 'git',
    placeholders: [{ name: 'count', type: 'number', label: 'Commit count', default: '3', required: true }],
    tags: ['rebase', 'history'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-2',
    name: 'Git stash with message',
    body: 'git stash push -m "{{message}}"',
    description: 'Stash changes with a descriptive message.',
    category: 'git',
    placeholders: [{ name: 'message', type: 'string', label: 'Stash message', required: true }],
    tags: ['stash', 'workflow'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-3',
    name: 'Git cherry-pick range',
    body: 'git cherry-pick {{from}}..{{to}}',
    description: 'Apply a range of commits from another branch.',
    category: 'git',
    placeholders: [
      { name: 'from', type: 'string', label: 'From commit (exclusive)', required: true },
      { name: 'to', type: 'string', label: 'To commit (inclusive)', required: true },
    ],
    tags: ['cherry-pick'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-4',
    name: 'Docker build and push',
    body: 'docker build -t {{registry}}/{{image}}:{{tag}} . && docker push {{registry}}/{{image}}:{{tag}}',
    description: 'Build a Docker image and push it to a registry.',
    category: 'docker',
    placeholders: [
      { name: 'registry', type: 'string', label: 'Registry host', default: 'ghcr.io/myorg', required: true },
      { name: 'image', type: 'string', label: 'Image name', required: true },
      { name: 'tag', type: 'string', label: 'Tag', default: 'latest', required: true },
    ],
    tags: ['build', 'push', 'registry'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-5',
    name: 'Docker compose up detached',
    body: 'docker compose -f {{file}} up -d --build',
    description: 'Start services defined in a compose file in detached mode.',
    category: 'docker',
    placeholders: [{ name: 'file', type: 'path', label: 'Compose file', default: 'docker-compose.yml', required: true }],
    tags: ['compose', 'start'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-6',
    name: 'Kubectl rollout restart',
    body: 'kubectl rollout restart deployment/{{name}} -n {{namespace}}',
    description: 'Trigger a rolling restart of a Kubernetes deployment.',
    category: 'kubectl',
    placeholders: [
      { name: 'name', type: 'string', label: 'Deployment name', required: true },
      { name: 'namespace', type: 'string', label: 'Namespace', default: 'default', required: true },
    ],
    tags: ['rollout', 'restart', 'deployment'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-7',
    name: 'Kubectl port-forward',
    body: 'kubectl port-forward {{resource}}/{{name}} {{localPort}}:{{remotePort}} -n {{namespace}}',
    description: 'Forward a local port to a pod or service.',
    category: 'kubectl',
    placeholders: [
      { name: 'resource', type: 'enum', label: 'Resource type', options: ['pod', 'svc', 'deployment'], default: 'svc', required: true },
      { name: 'name', type: 'string', label: 'Resource name', required: true },
      { name: 'localPort', type: 'number', label: 'Local port', default: '8080', required: true },
      { name: 'remotePort', type: 'number', label: 'Remote port', default: '80', required: true },
      { name: 'namespace', type: 'string', label: 'Namespace', default: 'default', required: true },
    ],
    tags: ['port-forward', 'debug'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-8',
    name: 'Kubectl get pods wide',
    body: 'kubectl get pods -n {{namespace}} -o wide',
    description: 'List pods with node and IP information.',
    category: 'kubectl',
    placeholders: [{ name: 'namespace', type: 'string', label: 'Namespace', default: 'default', required: false }],
    tags: ['get', 'pods'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-9',
    name: 'AWS S3 sync',
    body: 'aws s3 sync {{source}} {{destination}} --delete --exclude "{{exclude}}"',
    description: 'Sync a local directory to an S3 bucket with exclusions.',
    category: 'aws',
    placeholders: [
      { name: 'source', type: 'path', label: 'Source path', default: './dist', required: true },
      { name: 'destination', type: 'url', label: 'S3 destination', default: 's3://my-bucket/prefix', required: true },
      { name: 'exclude', type: 'string', label: 'Exclude pattern', default: '*.map', required: false },
    ],
    tags: ['s3', 'sync', 'deploy'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-10',
    name: 'Curl JSON POST with auth',
    body: 'curl -X POST {{url}} \\\n  -H "Authorization: Bearer {{token}}" \\\n  -H "Content-Type: application/json" \\\n  -d \'{{body}}\'',
    description: 'POST JSON to an endpoint with bearer auth.',
    category: 'curl',
    placeholders: [
      { name: 'url', type: 'url', label: 'Endpoint URL', required: true },
      { name: 'token', type: 'string', label: 'Bearer token', required: true },
      { name: 'body', type: 'string', label: 'JSON body', default: '{}', required: true },
    ],
    tags: ['curl', 'rest', 'auth'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ct-11',
    name: 'SSH tunnel',
    body: 'ssh -L {{localPort}}:{{remoteHost}}:{{remotePort}} {{user}}@{{jumpHost}} -N',
    description: 'Create an SSH tunnel to access a remote service.',
    category: 'ssh',
    placeholders: [
      { name: 'localPort', type: 'number', label: 'Local port', default: '5432', required: true },
      { name: 'remoteHost', type: 'string', label: 'Remote host', required: true },
      { name: 'remotePort', type: 'number', label: 'Remote port', default: '5432', required: true },
      { name: 'user', type: 'string', label: 'SSH user', default: 'ubuntu', required: true },
      { name: 'jumpHost', type: 'string', label: 'Jump host', required: true },
    ],
    tags: ['tunnel', 'ssh', 'db'],
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Workspace templates (PRO)
  {
    id: 'ct-ws-1',
    name: 'Acme deploy to staging',
    body: 'kubectl set image deployment/{{service}} {{service}}={{registry}}/{{service}}:{{tag}} -n staging',
    description: 'Deploy a new image tag to Acme staging environment.',
    category: 'kubectl',
    placeholders: [
      { name: 'service', type: 'string', label: 'Service name', required: true },
      { name: 'registry', type: 'string', label: 'Registry', default: '123456789.dkr.ecr.us-east-1.amazonaws.com', required: true },
      { name: 'tag', type: 'string', label: 'Image tag', required: true },
    ],
    tags: ['deploy', 'staging', 'acme'],
    isBuiltIn: false,
    workspaceId: 'ws-acme',
    createdAt: '2024-04-15T09:00:00Z',
    updatedAt: '2024-05-01T10:00:00Z',
    author: 'John Mercer',
  },
  {
    id: 'ct-ws-2',
    name: 'Run DB migrations',
    body: 'kubectl exec -it $(kubectl get pod -l app={{service}} -n {{namespace}} -o jsonpath=\'{.items[0].metadata.name}\') -n {{namespace}} -- npm run migrate',
    description: 'Run database migrations in a Kubernetes pod.',
    category: 'kubectl',
    placeholders: [
      { name: 'service', type: 'string', label: 'App label', required: true },
      { name: 'namespace', type: 'string', label: 'Namespace', default: 'production', required: true },
    ],
    tags: ['migrate', 'db', 'acme'],
    isBuiltIn: false,
    workspaceId: 'ws-acme',
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-06-01T12:00:00Z',
    author: 'Sarah Chen',
  },
];

// ─── AI Generations ──────────────────────────────────────────────────────────

export const AI_GENERATIONS: AIGenerationResult[] = [
  {
    id: 'ag-1',
    prompt: 'restart the api deployment in the production namespace',
    tool: 'kubectl',
    command: 'kubectl rollout restart deployment/api -n production',
    explanation: 'Uses `kubectl rollout restart` to trigger a rolling restart of all pods in the `api` deployment within the `production` namespace. Existing pods are replaced one-by-one to maintain availability.',
    warnings: [],
    isDestructive: false,
    createdAt: hoursAgo(2),
  },
  {
    id: 'ag-2',
    prompt: 'force delete a stuck pod named api-xyz',
    tool: 'kubectl',
    command: 'kubectl delete pod api-xyz --grace-period=0 --force -n production',
    explanation: 'Force-deletes a pod bypassing graceful termination. The `--grace-period=0` and `--force` flags skip the normal termination sequence.',
    warnings: ['Force deletion may leave resources in an inconsistent state. Use only when normal deletion is stuck.'],
    isDestructive: true,
    createdAt: daysAgo(1),
  },
  {
    id: 'ag-3',
    prompt: 'build and push a docker image with the current git sha as tag',
    tool: 'docker',
    command: 'docker build -t myrepo/myapp:$(git rev-parse --short HEAD) . && docker push myrepo/myapp:$(git rev-parse --short HEAD)',
    explanation: 'Uses command substitution to tag the image with the short git commit SHA. This ensures each build is uniquely identifiable.',
    warnings: [],
    isDestructive: false,
    createdAt: daysAgo(2),
  },
];

export const AI_USAGE: AIUsage = {
  used: 18,
  limit: 50,
  resetsAt: '2026-07-01T00:00:00Z',
};

// ─── Kubernetes ──────────────────────────────────────────────────────────────

export const K8S_CONTEXTS: K8sContext[] = [
  { name: 'prod-us-east-1', cluster: 'acme-prod', namespace: 'production' },
  { name: 'staging-us-east-1', cluster: 'acme-staging', namespace: 'staging' },
  { name: 'docker-desktop', cluster: 'docker-desktop', namespace: 'default' },
];

export const K8S_HELPERS: K8sHelper[] = [
  {
    id: 'kh-1',
    type: 'rollout-restart',
    label: 'Rollout restart',
    description: 'Trigger a rolling restart of a deployment.',
    commandTemplate: 'kubectl rollout restart deployment/{{name}} -n {{namespace}}',
    params: [
      { name: 'name', label: 'Deployment', type: 'string', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: false,
    docsUrl: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout_restart/',
  },
  {
    id: 'kh-2',
    type: 'scale',
    label: 'Scale deployment',
    description: 'Set the number of replicas for a deployment.',
    commandTemplate: 'kubectl scale deployment/{{name}} --replicas={{replicas}} -n {{namespace}}',
    params: [
      { name: 'name', label: 'Deployment', type: 'string', required: true },
      { name: 'replicas', label: 'Replicas', type: 'number', default: '2', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: true,
  },
  {
    id: 'kh-3',
    type: 'logs',
    label: 'Tail pod logs',
    description: 'Stream logs from a pod with optional line count.',
    commandTemplate: 'kubectl logs -f {{pod}} -n {{namespace}} --tail={{lines}}',
    params: [
      { name: 'pod', label: 'Pod name', type: 'string', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
      { name: 'lines', label: 'Tail lines', type: 'number', default: '100', required: false },
    ],
    isDestructive: false,
  },
  {
    id: 'kh-4',
    type: 'exec',
    label: 'Exec into pod',
    description: 'Open an interactive shell in a running pod.',
    commandTemplate: 'kubectl exec -it {{pod}} -n {{namespace}} -- {{shell}}',
    params: [
      { name: 'pod', label: 'Pod name', type: 'string', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
      { name: 'shell', label: 'Shell', type: 'enum', options: ['/bin/sh', '/bin/bash', '/bin/zsh'], default: '/bin/sh', required: true },
    ],
    isDestructive: false,
  },
  {
    id: 'kh-5',
    type: 'port-forward',
    label: 'Port forward',
    description: 'Forward a local port to a pod or service.',
    commandTemplate: 'kubectl port-forward {{resourceType}}/{{name}} {{localPort}}:{{remotePort}} -n {{namespace}}',
    params: [
      { name: 'resourceType', label: 'Resource type', type: 'enum', options: ['pod', 'svc', 'deployment'], default: 'svc', required: true },
      { name: 'name', label: 'Resource name', type: 'string', required: true },
      { name: 'localPort', label: 'Local port', type: 'number', default: '8080', required: true },
      { name: 'remotePort', label: 'Remote port', type: 'number', default: '80', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: false,
  },
  {
    id: 'kh-6',
    type: 'get',
    label: 'Get resources',
    description: 'List resources in a namespace.',
    commandTemplate: 'kubectl get {{resource}} -n {{namespace}} -o wide',
    params: [
      { name: 'resource', label: 'Resource type', type: 'enum', options: ['pods', 'deployments', 'services', 'ingresses', 'configmaps', 'secrets'], default: 'pods', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: false,
  },
  {
    id: 'kh-7',
    type: 'describe',
    label: 'Describe resource',
    description: 'Show detailed state of a resource.',
    commandTemplate: 'kubectl describe {{resource}}/{{name}} -n {{namespace}}',
    params: [
      { name: 'resource', label: 'Resource type', type: 'enum', options: ['pod', 'deployment', 'svc', 'ingress'], default: 'pod', required: true },
      { name: 'name', label: 'Resource name', type: 'string', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: false,
  },
  {
    id: 'kh-8',
    type: 'delete',
    label: 'Delete resource',
    description: 'Delete a specific resource by name.',
    commandTemplate: 'kubectl delete {{resource}}/{{name}} -n {{namespace}}',
    params: [
      { name: 'resource', label: 'Resource type', type: 'enum', options: ['pod', 'deployment', 'svc', 'job'], default: 'pod', required: true },
      { name: 'name', label: 'Resource name', type: 'string', required: true },
      { name: 'namespace', label: 'Namespace', type: 'string', default: 'default', required: true },
    ],
    isDestructive: true,
  },
];

// ─── SSH ─────────────────────────────────────────────────────────────────────

export const SSH_HOSTS: SSHHost[] = [
  {
    id: 'sh-1',
    label: 'Prod Web Server 01',
    hostname: 'prod-web-01.acme.internal',
    username: 'deploy',
    port: 22,
    tags: ['production', 'web'],
    identityFilePath: '~/.ssh/acme_prod_rsa',
    workspaceId: 'ws-acme',
  },
  {
    id: 'sh-2',
    label: 'Staging DB',
    hostname: 'staging-db.acme.internal',
    username: 'admin',
    port: 22,
    tags: ['staging', 'database'],
    jumpHost: 'bastion.acme.io',
    identityFilePath: '~/.ssh/acme_staging_rsa',
    workspaceId: 'ws-acme',
  },
  {
    id: 'sh-3',
    label: 'Bastion Host',
    hostname: 'bastion.acme.io',
    username: 'ubuntu',
    port: 22,
    tags: ['bastion', 'gateway'],
    workspaceId: 'ws-acme',
  },
];

export const SSH_WORKFLOWS: SSHWorkflow[] = [
  {
    id: 'sw-1',
    name: 'Deploy to production',
    description: 'Full production deployment sequence.',
    hostId: 'sh-1',
    steps: [
      { id: 'swst-1', label: 'Pull latest code', command: 'cd /var/www/acme && git pull origin main', isDestructive: false, isDone: false },
      { id: 'swst-2', label: 'Install dependencies', command: 'cd /var/www/acme && npm ci --production', isDestructive: false, isDone: false },
      { id: 'swst-3', label: 'Run migrations', command: 'cd /var/www/acme && npm run migrate', isDestructive: false, isDone: false },
      { id: 'swst-4', label: 'Restart app', command: 'pm2 restart acme-app', isDestructive: false, isDone: false },
    ],
    tags: ['deploy', 'production'],
    workspaceId: 'ws-acme',
    isBuiltIn: false,
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    id: 'sw-2',
    name: 'Emergency rollback',
    description: 'Revert to previous deployment tag.',
    hostId: 'sh-1',
    steps: [
      { id: 'swst-5', label: 'Checkout previous tag', command: 'cd /var/www/acme && git checkout {{tag}}', isDestructive: true, isDone: false },
      { id: 'swst-6', label: 'Reinstall deps', command: 'cd /var/www/acme && npm ci --production', isDestructive: false, isDone: false },
      { id: 'swst-7', label: 'Restart app', command: 'pm2 restart acme-app', isDestructive: false, isDone: false },
    ],
    tags: ['rollback', 'emergency'],
    workspaceId: 'ws-acme',
    isBuiltIn: false,
    createdAt: '2024-04-02T10:00:00Z',
  },
];
