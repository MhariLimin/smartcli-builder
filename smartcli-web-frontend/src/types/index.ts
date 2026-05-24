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
