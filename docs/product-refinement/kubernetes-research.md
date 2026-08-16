# Kubernetes Product Research

## Purpose and users
Help developers, SREs, and platform engineers safely compose and understand kubectl operations and repeatable diagnostic workflows without memorizing flags.

## Competitive frame
Lens and similar Kubernetes IDEs provide live multi-cluster resource browsing, logs, terminals, RBAC, and Helm workflows. Competing head-on would require cluster credentials, streaming connections, authorization, auditing, and a much larger operational surface.

## Capability decisions

- Kubeconfig management: **defer**; high secret-handling risk.
- Cluster explorer / namespace browser / workload inspection: **later metadata-only integration**, after auth and explicit cluster connectors.
- Pod logs / exec: **exclude from current product**; violates copy-only posture and duplicates terminals.
- YAML generation: **include later** with schema/version validation and diff-first review.
- Context switching: **include as command rendering**, not local kubeconfig mutation.
- RBAC inspection: **include as explainable `kubectl auth can-i` workflows** before live policy ingestion.
- Helm integration: **include command composition and values scaffolding later**, not release control.

## Differentiator
SmartCLI should be the review-first command and runbook layer: parameterized, explainable, shareable, and safe—not a cluster control plane.

## Sources
- [Lens Kubernetes overview](https://lenshq.io/blog/lens-kubernetes)
