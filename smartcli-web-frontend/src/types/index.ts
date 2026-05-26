// Source of truth: the backend's OpenAPI spec at /v3/api-docs, generated into
// src/api/generated/openapi.d.ts by `npm run gen:api`. Springdoc emits every
// field as optional because plain Java POJOs don't carry nullability info, so
// we re-narrow the fields the runtime actually requires here. Genuinely
// optional fields (e.g. PlaceholderInfo.type) stay optional.
import type { components } from '../api/generated/openapi';

type Schema<K extends keyof components['schemas']> = components['schemas'][K];

// Force the listed keys to be required while keeping the rest as-generated.
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type SuggestionKind = NonNullable<Schema<'Suggestion'>['kind']>;

export type Suggestion = WithRequired<
  Schema<'Suggestion'>,
  'text' | 'description' | 'category' | 'placeholders' | 'kind'
>;

// Re-export the placeholder type union from the generated schema so it stays
// in sync if/when the backend declares this as a real enum.
export type PlaceholderType =
  | 'int'
  | 'float'
  | 'bool'
  | 'enum'
  | 'string'
  | 'path'
  | 'url';

export type PlaceholderInfo = WithRequired<
  Schema<'PlaceholderInfo'>,
  'name' | 'label' | 'hint' | 'slot'
>;

export type HistoryEntry = WithRequired<
  Schema<'HistoryEntry'>,
  'id' | 'command' | 'category' | 'createdAt'
>;

export type CommandTemplate = WithRequired<
  Schema<'CommandTemplate'>,
  'category' | 'template' | 'description'
>;

// TEMPORARY: Folder and SavedCommand types are hand-written here for the
// Tier-3 #14 ship. Once a backend with the new endpoints is up, run
// `npm run gen:api` against it to regenerate openapi.d.ts, then replace
// these with the WithRequired<Schema<...>> pattern used above. The shape
// here matches the backend's POJOs verbatim.
export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
}

export interface SavedCommand {
  id: string;
  command: string;
  label?: string | null;
  category?: string | null;
  folderId?: string | null;
  tags: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Body shapes for POST /api/saved and PATCH /api/saved/{id}.
export interface SavedCommandCreate {
  command: string;
  label?: string;
  category?: string;
  folderId?: string | null;
  tags?: string[];
  notes?: string;
}

export interface SavedCommandUpdate {
  label?: string;
  category?: string;
  // Empty string clears the folder; null/undefined leaves it unchanged.
  folderId?: string | null;
  tags?: string[];
  notes?: string;
}
