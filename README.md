# SmartCLI

SmartCLI turns operational intent into validated, reusable CLI commands without executing them.

It is built for engineers who know what they need to accomplish but do not want to memorize every flag, placeholder, and tool-specific syntax. Instead of returning an opaque command from a general-purpose chat, SmartCLI guides users through a curated catalog, makes every variable explicit, and keeps the final command under the user's control.

> SmartCLI is a command authoring tool, not a remote shell. It does not execute commands, connect to infrastructure, or collect private keys and kubeconfigs.

## Why it exists

Operational commands are easy to get almost right. A missing namespace, reversed flag, or command copied without context can be expensive. Search engines and chat assistants are useful for discovery, but their answers may be unvalidated, difficult to reproduce, and detached from team conventions.

SmartCLI provides a narrower, safer workflow:

1. Find a reviewed command template by tool or intent.
2. Fill named inputs with contextual guidance.
3. Inspect the complete command before copying it.
4. Save and reuse known-good commands locally.

The differentiator is not “AI writes shell commands.” It is a structured authoring layer between intent and the terminal: catalog-backed, inspectable, and designed to grow into team-governed runbooks.

## Current product

The production build currently includes:

- Progressive command suggestions across Kubernetes, Docker, Git, SSH, databases, build tools, and Linux utilities.
- Explicit placeholder inputs and a live final-command preview.
- Catalog browsing, saved commands, folders, tags, history, copy, and share-link workflows.
- Light and dark themes, keyboard navigation, and responsive layouts.
- A Spring Boot API backed by a versioned JSON command catalog and file-based local persistence.

Development-only previews explore authentication, roles, workspaces, AI generation, Kubernetes workflows, and SSH workflows. They are intentionally excluded from production bundles and are not presented as implemented integrations. Supabase-backed authentication and persistence are planned next.

See [architecture and trust boundaries](docs/portfolio/architecture.md) for the system shape and [the evaluator demo](docs/portfolio/demo-script.md) for a repeatable product tour.

## Safety model

- Commands are generated and displayed, never executed.
- Inputs remain visible before copy or save.
- Production features do not depend on mock authentication or preview fixtures.
- The catalog is version-controlled and reviewable.
- Secrets, credentials, private keys, kubeconfigs, and remote shell access are outside the product boundary.

## Architecture

```text
React + TypeScript UI  ->  Spring Boot REST API  ->  reviewed commands.json
                                  |
                                  +--------------> local history persistence
```

The frontend owns composition and interaction. The API owns catalog search, placeholder metadata, and history. Persistence and identity are deliberately separated behind boundaries that can later be replaced with Supabase and role-aware policies.

## Run locally

Prerequisites: Java 17+, Maven 3.9+, and Node.js 18+.

Start the API:

```bash
cd smartcli-web-backend
mvn spring-boot:run
```

Start the web app in another terminal:

```bash
cd smartcli-web-frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the API at `http://localhost:8080`.

For a production-equivalent frontend build:

```bash
cd smartcli-web-frontend
npm run build
npm run verify:production-integrity
```

For explicitly labeled design previews:

```bash
cd smartcli-web-frontend
npm run build:demo
```

## Verify

```bash
cd smartcli-web-frontend
npm run lint
npm run build

cd ../smartcli-web-backend
mvn test
```

## Key API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/suggestions?q=<typed>&limit=30` | GET | Find next-token extensions and matching templates. |
| `/api/placeholders?template=<template>` | GET | Resolve placeholder labels and contextual hints. |
| `/api/categories` | GET | List catalog categories. |
| `/api/templates?category=<category>` | GET | Browse templates, optionally by category. |
| `/api/history` | GET / POST / DELETE | List, save, or clear command history. |
| `/api/history/{id}` | DELETE | Remove one history entry. |

## Extend the catalog

Add a reviewed entry to `smartcli-web-backend/src/main/resources/commands.json`:

```json
{
  "category": "redis",
  "template": "redis-cli -h <host> -p <port> ping",
  "description": "Ping a Redis server"
}
```

Text inside angle brackets becomes a guided input automatically. Keep secrets out of catalog examples.

## Roadmap

- Supabase authentication and durable persistence.
- Role-based catalog governance and workspace policies.
- Explainable command segments, warnings, and source provenance.
- Reviewable team runbooks and environment profiles.
- Automated catalog schema and safety validation in CI.

The roadmap describes direction, not currently shipped functionality.
