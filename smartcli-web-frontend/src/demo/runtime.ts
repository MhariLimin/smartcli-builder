import type { AuthState, Workspace } from '../mock-types';

export interface DemoScenarioData {
  id: string;
  authState: AuthState;
}

export interface DemoRuntimeData {
  scenarios: DemoScenarioData[];
  workspaces: Workspace[];
}

export async function loadDemoRuntime(): Promise<DemoRuntimeData> {
  return { scenarios: [], workspaces: [] };
}
