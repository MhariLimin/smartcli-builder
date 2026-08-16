import type { AuthState } from '../mock-types';
import { USERS, WORKSPACES } from './data';

export type ScenarioId =
  | 'guest'
  | 'free-owner'
  | 'pro-admin'
  | 'pro-member'
  | 'pro-viewer';

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  authState: AuthState;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'guest',
    label: 'Guest',
    description: 'Not signed in. Builder and Catalog visible; Saved and History gated.',
    authState: { type: 'guest' },
  },
  {
    id: 'free-owner',
    label: 'Free Owner',
    description: 'Signed in as Sarah — personal free workspace. Pro features locked.',
    authState: {
      type: 'authenticated',
      user: USERS.sarah,
      workspace: WORKSPACES[0],
      role: 'owner',
    },
  },
  {
    id: 'pro-admin',
    label: 'Pro Admin',
    description: 'Signed in as Sarah — Acme PRO workspace, admin role.',
    authState: {
      type: 'authenticated',
      user: USERS.sarah,
      workspace: WORKSPACES[1],
      role: 'admin',
    },
  },
  {
    id: 'pro-member',
    label: 'Pro Member',
    description: 'Signed in as Alex — Acme PRO workspace, member role.',
    authState: {
      type: 'authenticated',
      user: USERS.alex,
      workspace: WORKSPACES[1],
      role: 'member',
    },
  },
  {
    id: 'pro-viewer',
    label: 'Pro Viewer',
    description: 'Signed in as Maya — Acme PRO workspace, viewer role.',
    authState: {
      type: 'authenticated',
      user: USERS.maya,
      workspace: WORKSPACES[1],
      role: 'viewer',
    },
  },
];

export const DEFAULT_SCENARIO: ScenarioId = 'pro-admin';
