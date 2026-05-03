export type SuggestionKind = 'EXTENSION' | 'TEMPLATE';

export interface Suggestion {
  text: string;
  description: string;
  category: string;
  placeholders: string[];
  kind: SuggestionKind;
}

export interface PlaceholderInfo {
  name: string;
  label: string;
  hint: string;
}

export interface HistoryEntry {
  id: string;
  command: string;
  category: string;
  createdAt: string;
}

export interface CommandTemplate {
  category: string;
  template: string;
  description: string;
}
