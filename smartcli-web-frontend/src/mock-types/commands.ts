export type CommandCategory =
  | 'git'
  | 'docker'
  | 'kubectl'
  | 'aws'
  | 'shell'
  | 'ssh'
  | 'npm'
  | 'curl'
  | 'other';

export type PlaceholderType =
  | 'string'
  | 'path'
  | 'url'
  | 'number'
  | 'boolean'
  | 'enum';

export interface PlaceholderDef {
  name: string;
  type: PlaceholderType;
  label?: string;
  default?: string;
  options?: string[];
  required?: boolean;
  description?: string;
}

export interface CommandTemplate {
  id: string;
  name: string;
  body: string;
  description: string;
  category: CommandCategory;
  placeholders: PlaceholderDef[];
  tags: string[];
  isBuiltIn: boolean;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  docsUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  workspaceId: string;
  parentId?: string;
  color?: string;
  createdAt: string;
}

export interface SavedCommand {
  id: string;
  label: string;
  command: string;
  category: CommandCategory;
  tags: string[];
  notes?: string;
  folderId?: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isDestructive: boolean;
}

export interface PlaceholderValue {
  name: string;
  value: string;
}
