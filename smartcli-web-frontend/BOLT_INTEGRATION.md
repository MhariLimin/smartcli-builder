# Bolt Frontend Integration Notes

This integration uses `bolt/project` as design source material. The existing
SmartCLI frontend remains the behavioral and API source of truth.

## Artifact decisions

| Bolt artifact | Decision | Production owner |
| --- | --- | --- |
| Logo-derived navy, cyan, blue, and violet tokens | Adopted | `tailwind.config.js`, `src/styles/index.css` |
| Dark developer-tool visual direction | Adapted with complete light-theme support | `ThemeContext`, global styles |
| Sticky compact header | Adapted | `src/components/Header.tsx` |
| Collapsible desktop sidebar and mobile drawer | Adapted | `src/App.tsx`, `src/components/Sidebar.tsx` |
| Command-palette trigger | Adapted to the shipped palette | `src/components/CommandPalette.tsx` |
| Builder visual hierarchy | Adapted around existing command state and controls | `src/components/BuilderView.tsx` |
| Catalog, History, and Saved cards | Adapted around existing API-backed pages | Current page and shared components |
| Bolt UI primitive library | Visual reference only | Existing SmartCLI components remain authoritative |
| Mock auth and workspace context | Rejected | Deferred until roadmap auth/workspace contracts ship |
| Supabase client dependency | Rejected | Persistence and auth remain backend roadmap work |
| AI, Kubernetes, SSH, billing, members, and settings routes | Rejected for production | Deferred to their individual specs and APIs |
| Developer scenario switcher | Rejected | Must not ship in production |
| Bolt mock data and hand-written DTOs | Rejected | Existing API client and generated OpenAPI types remain |

## Preserved invariants

- Routes remain `/`, `/saved`, `/history`, `/catalog`, and `/c/:payload`.
- Builder suggestion ordering, keyboard handling, typed placeholders, inline
  placeholder editing, destructive warnings, Copy, Save, Share, and history
  side effects are unchanged.
- Catalog still loads built-in templates through the current API client.
- Saved keeps folders, filters, tags, editing, confirmation, sharing, and
  optimistic updates.
- History keeps filtering, reuse, sharing, deletion, and clearing.
- Theme preference, UI preference, palette recents, and URL/query-string
  handoffs retain their existing storage and routing behavior.
- Future product surfaces are described honestly but do not expose fake
  authenticated or backend-backed controls.

## Dependency policy

Generated future pages can be revisited only when their matching backend or
full-stack roadmap item has shipped. At that point, their visual layouts may be
adapted while generated OpenAPI types and server authorization remain
authoritative.
