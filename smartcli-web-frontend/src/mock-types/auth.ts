export type Plan = 'free' | 'pro';
export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type MemberStatus = 'active' | 'pending';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  status: MemberStatus;
  user: User;
  joinedAt: string;
}

export interface PendingInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: Role;
  invitedAt: string;
  inviteLink: string;
}

export type AuthState =
  | { type: 'guest' }
  | { type: 'authenticated'; user: User; workspace: Workspace; role: Role };
