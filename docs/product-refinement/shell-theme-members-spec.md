# Shell, Theme, Presence, and Members Refinement

**Category:** Refactor / Bug Fix / UX Improvement

## Problem statement
Branding and administration are duplicated across shell regions, theme ownership is split, and Members imports temporary fixtures directly.

## Current behavior
Header logo plus detached sidebar chevron; Members/Settings in primary nav; binary theme toggle; connection text; page-owned fixture data.

## Proposed behavior
Logo-driven collapse, profile-owned administration, contextual Upgrade action, compact workspace switcher, Light/Dark/System, selectable presence dot, and a replaceable workspace-directory adapter.

## Technical approach
Keep current routes and AppShell. Make AppContext the active theme/presence owner. Subscribe System mode to `prefers-color-scheme`. Hide fixture imports behind `WorkspaceDirectory`.

## Risks
Presence and membership changes are local preview behavior, not authorization. Role enforcement remains a future server responsibility.

## Acceptance criteria
- Members/Settings are in the profile menu.
- Logo collapses desktop sidebar.
- Free users see Upgrade beside profile.
- Theme modes persist and System follows OS changes.
- Four presence states are selectable without status text.
- Members page no longer imports fixtures.

## Testing checklist
- Guest/free/pro navigation; keyboard menus; desktop/mobile shell; reload themes; change OS theme; member invite/role/remove; build.
