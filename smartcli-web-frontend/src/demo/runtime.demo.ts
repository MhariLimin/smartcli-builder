import type { DemoRuntimeData } from './runtime';
import { SCENARIOS } from '../mock/scenarios';
import { WORKSPACES } from '../mock/data';

export async function loadDemoRuntime(): Promise<DemoRuntimeData> {
  return { scenarios: SCENARIOS, workspaces: WORKSPACES };
}
