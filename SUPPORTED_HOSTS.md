# Supported Hosts

Hakim `1.0.0-beta.1` is public beta software. Support means the repository maintains a documented, gated product surface for the host; it does not imply universal compatibility or stable-release authorization.

| Host | Maintained product surface | Native UX | Current boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin with six skills and SessionStart activation | `codex plugin marketplace add Habib1001-m/hakim` → `/plugins` → install `hakim@hakim` | Codex `0.131.0+` is the compatibility floor for this beta's default-on plugin-hook contract; central OpenAI Plugin Directory listing is separate and not claimed; Codex trust, approvals, sandboxing, and hook policy remain authoritative |
| Claude Code | Native marketplace plugin with six user commands, hidden canonical skills, lifecycle hooks, and specialized plugin agents | `claude plugin marketplace add Habib1001-m/hakim` + `claude plugin install hakim@hakim` | Claude installation scope, managed policy, permissions, plugin cache, and trust remain authoritative |
| GitHub Copilot | Native marketplace plugin with six skills and five custom agents; repository instructions retained as optional baseline | `copilot plugin marketplace add Habib1001-m/hakim` + `copilot plugin install hakim@hakim` | Copilot policy, enabled plugins, repository access, and agent tool permissions remain authoritative |
| OpenCode | Guarded project-local native plugin with persistent lifecycle manifest, create/adopt/transactional-upgrade paths, supported older-version removal, post-move quarantine verification, and no-clobber rollback | from target repo: `npx --yes --package=github:Habib1001-m/hakim hakim-opencode install` → normal OpenCode startup | Node `>=22` for the shipped Git bootstrap; the managed-lifecycle candidate materially changes the previously accepted path and requires fresh real-host evidence before promotion; no npm registry/global installer or `opencode.json` mutation is claimed |

## Node runtime contract

The Git-backed Hakim package declares Node `>=22`. Public CI keeps the full repository gate on Node 24 and separately exercises the shipped OpenCode package/runtime surface on Node 22, 24, and 26. This is a JavaScript runtime contract, not a claim of universal operating-system or OpenCode-version compatibility.

## Current native live-host acceptance

The public-safe, machine-readable projection is [`conformance/native-host-acceptance.json`](conformance/native-host-acceptance.json). It records current-path acceptance separately for Codex, Claude Code, GitHub Copilot, and OpenCode.

- `PASS` requires an observed real-host install/start/invocation journey plus a public-safe evidence reference for the journey being claimed.
- `NOT_RUN` means no accepted live-host journey is recorded for the claimed path.
- `FAIL` and `BLOCKED` require an attempted journey plus a public-safe evidence reference.
- Structural, packaging, smoke, projection, or CI success does not change a live-host status.
- A transport or lifecycle change that materially changes the observed first-run/removal/runtime journey requires its own evidence before Hakim describes that changed path as accepted.
- Codex, Claude Code, and GitHub Copilot retain accepted `PASS` evidence for their maintained product paths.
- OpenCode's previously accepted evidence is bounded to candidate `b442820d2803955d0f7f33b405bd096f443d4d72`, OpenCode `1.17.13`, and its earlier create-only lifecycle. It is historical evidence for this hardening candidate and must not be reused to promote the new manifest-backed lifecycle.
- Earlier guarded source-checkout OpenCode evidence also remains bounded historical evidence.
- Private acceptance ledgers and release authorization are intentionally outside the public repository and are not reconstructed from this projection.

## Design rule

Hakim does not force every host into the same adapter shape. Each maintained integration uses the strongest native extension model that materially improves the product while preserving the host's own permission and trust boundaries.

Unused extension surfaces are not added for symmetry. For example, Hakim does not add an MCP or LSP server to Copilot merely because plugins support them; those components require a concrete product need.

## General boundaries

- Host-native security, permission, approval, sandbox, plugin, and managed-policy controls remain authoritative.
- A structural, smoke, packaging, or CI pass proves only its checked scope.
- Compatibility with every operating system, provider, model, editor version, organization policy, or long-running interactive session is not established.
- Central marketplace/directory publication is a separate distribution action from repository-hosted Git marketplace installation.
- Candidate integrations not listed above are experimental or unsupported.
