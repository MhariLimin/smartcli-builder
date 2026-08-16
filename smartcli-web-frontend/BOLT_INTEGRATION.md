# Bolt Frontend Integration

The accepted `bolt/project` application is now the primary frontend design and
prototype layer. The generated shell, component library, mock product context,
scenario switcher, and future pages are integrated directly.

## Adopted from Bolt

- Full navy/cyan/blue/violet token system and typography.
- Compact header, collapsible desktop sidebar, mobile drawer, cards, forms,
  badges, modals, dropdowns, command code, gates, skeletons, and toasts.
- Guest, Free Owner, Pro Admin, Pro Member, and Pro Viewer scenarios.
- Mock auth, workspaces, roles, entitlements, usage, and billing flow.
- AI generation, Kubernetes helpers, SSH workflows, members, workspace
  settings, login, billing return, command palette, and workflow stepper.
- Supabase client boundary. Without Vite Supabase environment variables the
  scenario provider intentionally runs in mock mode.

## Real Backend Preservation

- Catalog uses the existing template API for built-in commands and augments it
  with clearly marked mock workspace templates.
- History uses the existing history hook and backend mutation behavior.
- Builder and Saved default to the complete generated product-preview pages.
  Their previous production implementations remain available through the
  persistent `Live backend` mode switch.
- Share links and `/c/:payload` remain active.
- Existing OpenAPI-derived types remain isolated from generated mock types.

## Prototype Boundaries

Mock routes and controls are intentionally visible for product review. They do
not represent server-side authorization or completed billing. The scenario
switcher identifies the active persona and whether Supabase is configured or
mocked.
