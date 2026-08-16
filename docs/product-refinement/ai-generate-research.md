# AI Generate Research

## Why the page exists
SmartCLI can turn intent into a reviewable command without forcing users to leave the command library, manually extract code from prose, or lose saved/history/workspace context.

## Differentiation
General assistants optimize for open-ended conversation. SmartCLI should optimize for a structured, copy-only artifact: command, detected tool, parameters, explanation, safety findings, source/version assumptions, and save/share actions. Warp already offers natural-language command suggestions and reusable workflows inside a terminal, so a generic chat box is not defensible by itself.

## Directions considered

- **CLI Copilot — recommended:** one natural-language prompt, automatic tool/intent detection, visible correction controls, structured command candidates, warnings, and Builder/template handoff.
- Script Generator: valuable later, but multi-line scripts increase review and safety complexity.
- DevOps Workflow Builder: strong team value after shared templates/workspaces.
- Infrastructure Assistant: too broad for the initial wedge.
- Kubernetes Assistant: better as a domain experience built on the same generation contract.
- Git Workflow Builder: useful preset/domain pack, not a standalone product.
- CI/CD Generator, Docker Compose Generator, Terraform Assistant: artifact generation requires schema validation, version awareness, and diff/review UI; later expansions.

## Recommendation
Replace mandatory category selection with automatic intent/tool detection, but keep the detected tool visible and editable. Return one primary command plus alternatives only when ambiguity is material. Never execute. Require server-side quota, safety, and audit contracts before calling the preview production-ready.

## Sources
- [Warp AI](https://www.warp.dev/warp-ai)
- [Warp command completions](https://docs.warp.dev/terminal/command-completions)
