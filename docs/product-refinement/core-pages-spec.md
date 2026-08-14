# Core Pages and Catalog Refinement

**Category:** UX Improvement

## Problem statement
Mock Product Preview modes displace reliable backend-backed Builder and Saved flows, while Catalog mixes authoritative built-ins with mock workspace templates.

## Current behavior
Builder/Saved default to mock pages behind a mode toggle. Catalog merges live and fixture data.

## Proposed behavior
Render one live Builder and Saved experience styled within the Bolt shell. Restore the API-backed category-first Catalog. Retain Saved field filtering/tag quick picks and cap Builder recent activity at five horizontal entries.

## Technical approach
Route wrappers render live pages directly; obsolete prototype components and the mode toggle are removed. Catalog delegates to `CatalogView` and preserves query-string handoff.

## Risks
Some older leaf controls retain their original styling. Workspace template preview leaves Catalog until the real API ships.

## Acceptance criteria
- No Product Preview mode on Builder/Saved.
- Existing live behavior remains.
- Five non-wrapping recent entries maximum.
- Saved filters and tags remain.
- Catalog data is API-backed.

## Testing checklist
- Build; Builder suggestions/placeholders/copy/save/share; Saved CRUD/filter/tag; Catalog search/category/docs/Use; 360px overflow.
