export interface SSHHost {
  id: string;
  label: string;
  hostname: string;
  username: string;
  port: number;
  tags: string[];
  jumpHost?: string;
  identityFilePath?: string;
  notes?: string;
  workspaceId: string;
}

export interface SSHWorkflowStep {
  id: string;
  label: string;
  command: string;
  description?: string;
  isDestructive: boolean;
  isDone: boolean;
}

export interface SSHWorkflow {
  id: string;
  name: string;
  description?: string;
  hostId?: string;
  steps: SSHWorkflowStep[];
  tags: string[];
  workspaceId: string;
  isBuiltIn: boolean;
  createdAt: string;
}
