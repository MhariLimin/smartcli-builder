# Settings UX Research

## Options

- Modal: fast for a handful of personal preferences, but poor for deep links, permissions, billing, destructive actions, and future growth.
- Slide-over: good for contextual edits that preserve page context, but cramped for multi-section administration.
- Routed page: supports stable URLs, role-aware sections, responsive layouts, help links, and complex workspace/account settings.

## Recommendation
Keep Settings as a routed page and enter it from the profile menu. Separate Account and Workspace scope explicitly. Use modals only for focused confirmation/edit flows and slide-overs for contextual item editing. As sections grow, add local settings navigation and stable subsection routes.

This matches the broader pattern of GitHub and Vercel using dedicated settings areas for organization/team administration, while ChatGPT can use a modal for a smaller preference-oriented surface. Supabase's recent navigation changes also reinforce placing service-specific configuration near its owning domain rather than accumulating everything in one generic settings bucket.

## Sources
- [GitHub organization settings](https://docs.github.com/en/organizations/managing-organization-settings)
- [Vercel account management](https://vercel.com/docs/accounts)
- [Supabase settings navigation update](https://supabase.com/changelog/37655-dashboard-navigation-updates-project-settings)
- [ChatGPT data controls](https://help.openai.com/en/articles/7730893-data-controls-faq)
