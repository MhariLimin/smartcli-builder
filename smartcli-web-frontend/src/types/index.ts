export type SuggestionKind = 'EXTENSION' | 'TEMPLATE';

export interface Suggestion {
  text: string;
  description: string;
  category: string;
  placeholders: string[];
  kind: SuggestionKind;
}

// Typed-placeholder grammar — see the typed-placeholders feature.
// `type` is undefined for the legacy `<name>` form.
export type PlaceholderType =
  | 'int'
  | 'float'
  | 'bool'
  | 'enum'
  | 'string'
  | 'path'
  | 'url';

export interface PlaceholderInfo {
  name: string;
  label: string;
  hint: string;
  type?: PlaceholderType | string;
  enumOptions?: string[];
  defaultValue?: string;
  // The literal slot text including angle brackets, e.g. "<port:int=22>".
  // Used by the Builder for in-place substitution, so the frontend doesn't
  // reconstruct it from the parts.
  slot: string;
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
