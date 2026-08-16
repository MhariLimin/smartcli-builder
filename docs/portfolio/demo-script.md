# Three-minute evaluator demo

This tour uses deterministic, non-sensitive values and only shipped core features. Run the backend and frontend, then open `http://localhost:5173`.

## 0:00–0:35 — Start from intent

1. Open **Builder**.
2. Type `kubectl get`.
3. Select the pods template from the suggestions.

Point out that discovery is constrained by a version-controlled catalog rather than an unconstrained generated answer.

## 0:35–1:15 — Make the command inspectable

1. Enter `default` for namespace and safe values for any other requested fields.
2. Watch the final command update.
3. Review the complete string before using **Copy command**.

Point out that placeholders remain explicit and that SmartCLI never executes the result.

## 1:15–2:05 — Preserve useful operational knowledge

1. Save the command to a folder named `Kubernetes basics`.
2. Open **Saved**.
3. Find the command by folder or tag and open its action menu.

Explain that a known-good command becomes reusable knowledge instead of disappearing into chat history.

## 2:05–2:35 — Browse the reviewed surface

1. Open **Catalog**.
2. Filter by a category such as Docker or Git.
3. Select a template to return to Builder.

Point out that catalog entries are reviewable in source control and can eventually be governed by workspace roles.

## 2:35–3:00 — State the boundary and direction

Close with three facts:

- SmartCLI authors commands; it does not connect to or execute against infrastructure.
- Authentication, shared persistence, and RBAC are planned as a Supabase-backed boundary, not simulated production behavior.
- The next product layer is explanation and provenance: why each segment exists, what is risky, and where the template came from.

## Optional design preview

Use `npm run dev` or `npm run build:demo` only when explicitly demonstrating future concepts. Label those routes as previews. Do not use preview identities or workflows as evidence of implemented authentication, RBAC, Kubernetes, SSH, or AI integrations.
