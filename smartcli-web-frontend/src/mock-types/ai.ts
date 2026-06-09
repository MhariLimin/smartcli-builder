export type AITool = 'kubectl' | 'docker' | 'git' | 'aws' | 'shell';

export interface AIGenerationRequest {
  prompt: string;
  tool: AITool;
}

export interface AIGenerationResult {
  id: string;
  prompt: string;
  tool: AITool;
  command: string;
  explanation: string;
  warnings: string[];
  isDestructive: boolean;
  createdAt: string;
}

export interface AIUsage {
  used: number;
  limit: number;
  resetsAt: string;
}
