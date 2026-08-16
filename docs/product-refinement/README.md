# SmartCLI Product Refinement

This directory is the writable-session fallback for the requested `.codex`
deliverables. The environment mounts `.codex/` read-only. Promote the specs
and roadmap entry into `.codex/` when repository metadata is writable.

## Roadmap supplement

1. Live core-page consolidation.
2. Catalog information-architecture restoration.
3. Shell/navigation and theme/presence refinement.
4. Members preview-data isolation.
5. AI Generate product direction.
6. Kubernetes helper product scope.
7. SSH workflow product scope.
8. Settings information architecture.

## Completed implementation

- Builder and Saved now render only backend-backed implementations.
- Builder recent activity is limited to five entries in a non-wrapping row.
- Catalog again uses the established API-backed `CatalogView` hierarchy.
- Members and Settings moved from primary navigation into the profile menu.
- Sidebar logo is the desktop collapse control; free users receive an Upgrade action.
- Theme state now supports Light, Dark, and System from one active context.
- Header presence supports Active, Idle, Do Not Disturb, and Offline.
- Members fixture access is isolated behind `WorkspaceDirectory`.

## Known limitations

- Presence is local preview state until authentication/profile APIs exist.
- Workspace membership mutations remain preview-only.
- AI, Kubernetes, and SSH routes remain mock product previews.
- Frontend automated tests and linting are still absent.
