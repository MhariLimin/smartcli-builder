import { MEMBERS, PENDING_INVITES } from '../mock/data';
import type { Role, WorkspaceMember } from '../mock-types';

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: Role;
  invitedAt: string;
  inviteLink: string;
}

export interface WorkspaceDirectorySnapshot {
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
}

export interface WorkspaceDirectory {
  load(): Promise<WorkspaceDirectorySnapshot>;
  invite(email: string, role: Role): Promise<{ inviteUrl: string }>;
}

class PreviewWorkspaceDirectory implements WorkspaceDirectory {
  async load(): Promise<WorkspaceDirectorySnapshot> {
    return { members: [...MEMBERS], invites: [...PENDING_INVITES] };
  }

  async invite(_email: string, _role: Role): Promise<{ inviteUrl: string }> {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    return { inviteUrl: `https://smartcli.dev/invite/${crypto.randomUUID().slice(0, 8)}` };
  }
}

// This boundary is intentionally replaceable by an authenticated API adapter.
// Preview fixtures never leak into the page component or define authorization.
export const workspaceDirectory: WorkspaceDirectory = new PreviewWorkspaceDirectory();
