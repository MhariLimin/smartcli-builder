import type { CommandCategory } from './commands';

export interface HistoryEntry {
  id: string;
  command: string;
  category: CommandCategory;
  label?: string;
  copiedAt: string;
  workspaceId?: string;
  userId: string;
  isDestructive: boolean;
  savedCommandId?: string;
  templateId?: string;
}
