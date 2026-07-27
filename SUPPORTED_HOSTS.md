# Supported Hosts

Hakim `1.0.0-beta.2` is public beta software. Support means the repository maintains a documented, gated product surface for the host; it does not imply universal compatibility, current live-host acceptance, or stable-release authorization.

| Host | Maintained product surface | Native UX | Current boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin with six skills and SessionStart activation | `codex plugin marketplace add Habib1001-m/hakim` → `/plugins` → install `hakim@hakim` | Codex `0.131.0+` is the compatibility floor for this beta's default-on plugin-hook contract; beta.2 live-host acceptance is currently `NOT_RUN`; central OpenAI Plugin Directory listing is separate and not claimed; Codex trust, approvals, sandboxing, and hook policy remain authoritative |
| Claude Code | Native marketplace plugin with six user commands, hidden canonical skills, lifecycle hooks, and specialized plugin agents | `claude plugin marketplace add Habib1001-m/hakim` + `claude plugin install hakim@hakim` | beta.2 live-host acceptance is currently `NOT_RUN`; Claude installation scope, managed policy, permissions, plugin cache, and trust remain authoritative |
| GitHub Copilot | Native marketplace plugin with six skills and five custom agents; repository instructions retained as optional baseline | `copilot plugin marketplace add Habib1001-m/hakim` + `copilot plugin install hakim@hakim` | beta.2 live-host acceptance is currently `NOT_RUN`; Copilot policy, enabled plugins, repository access, and agent tool permissions remain authoritative |
| OpenCode | Guarded project-local native plugin with persistent lifecycle manifest, create/adopt/transactional-upgrade paths, supported older-version removal, bounded prompt-ownership sentinels, post-move quarantine verification, and no-clobber rollback | from target repo: `npx --yes --package=github:Habib1001-m/hakim hakim-opencode install` → normal OpenCode startup | Node `>=22` for the shipped Git bootstrap; beta.2 live-host acceptance is currently `NOT_RUN`; no npm registry/global installer or `opencode.json` mutation is claimed |

## Node runtime contract

The Git-backed Hakim package declares Node `>=22`. Public CI keeps the canonical repository gate on Node 24 and separately exercises the shipped OpenCode runtime/package surface on Node 22 and Node 26 through `npm run test:node-compat`. This is a JavaScript runtime contract, not a claim of universal operating-system or OpenCode-version compatibility.

## Current native live-host acceptance

The public-safe, machine-readable projection is [`conformance/native-host-acceptance.json`](conformance/native-host-acceptance.json). It records current-path acceptance separately for Codex, Claude Code, GitHub Copilot, and OpenCode.

- `PASS` requires an observed real-host install/start/invocation journey plus a public-safe evidence reference for the exact product identity being claimed.
- `NOT_RUN` means no accepted live-host journey is recorded for the claimed current path.
- `FAIL` and `BLOCKED` require an attempted journey plus a public-safe evidence reference.
- Structural, packaging, smoke, projection, or CI success does not change a live-host status.
- A new prerelease identity or a transport/lifecycle/runtime change requires its own evidence before Hakim describes that path as accepted.
- The beta.2 candidate currently records all four maintained paths as `NOT_RUN`, so overall current acceptance is `HOLD_FOR_LIVE_HOST_EVIDENCE`.
- Accepted beta.1 host evidence remains available at [`conformance/history/native-host-acceptance-1.0.0-beta.1.json`](conformance/history/native-host-acceptance-1.0.0-beta.1.json) and must not be reused as beta.2 proof.
- Private acceptance ledgers and release authorization are intentionally outside the public repository and are not reconstructed from these projections.

## Design rule

Hakim does not force every host into the same adapter shape. Each maintained integration uses the strongest native extension model that materially improves the product while preserving the host's own permission and trust boundaries.

Unused extension surfaces are not added for symmetry. For example, Hakim does not add an MCP or LSP server to Copilot merely because plugins support them; those components require a concrete product need.

## General boundaries

- Host-native security, permission, approval, sandbox, plugin, and managed-policy controls remain authoritative.
- A structural, smoke, packaging, or CI pass proves only its checked scope.
- Compatibility with every operating system, provider, model, editor version, organization policy, or long-running interactive session is not established.
- Central marketplace/directory publication is a separate distribution action from repository-hosted Git marketplace installation.
- Candidate integrations not listed above are experimental or unsupported.
