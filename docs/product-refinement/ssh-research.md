# SSH Workflows Research

## Purpose and users
Support engineers and operators who repeatedly construct SSH connection strings, jump-host chains, config snippets, tunnels, and multi-step maintenance runbooks.

## Alternatives
Native OpenSSH, terminal profiles, Warp workflows, and access platforms such as Teleport already handle interactive sessions. Teleport adds identity, RBAC, certificates, audit logs, MFA, and session recording—capabilities SmartCLI should not imitate cosmetically.

## Recommendation
Remain credential-free and copy-only. Store host labels, hostname, username, port, tags, jump-host references, and identity-file paths only. Add parameterized config snippets, ProxyJump/tunnel builders, validation, destructive-step review, and shareable team runbooks after workspace persistence. Never store private keys or open sessions.

## Competitive advantage
SmartCLI can unify SSH snippets with the same catalog, placeholders, history, sharing, and review workflow used for every other CLI domain.

## Sources
- [Teleport Linux server access](https://goteleport.com/docs/enroll-resources/server-access/)
- [Teleport platform features](https://goteleport.com/features/)
