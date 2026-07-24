# Supported Hosts

Hakim `1.0.0-beta.1` is public beta software. Support means the repository maintains a documented, gated product surface for the host; it does not imply universal compatibility.

| Host | Maintained product surface | Native UX | Current boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin with six skills and SessionStart activation | `codex plugin marketplace add Habib1001-m/hakim` → `/plugins` → install `hakim@hakim` | Codex `0.131.0+` is the compatibility floor for this beta's default-on plugin-hook contract; central OpenAI Plugin Directory listing is separate and not claimed; Codex trust, approvals, sandboxing, and hook policy remain authoritative |
| Claude Code | Native marketplace plugin with six user commands, hidden canonical skills, lifecycle hooks, and specialized plugin agents | `claude plugin marketplace add Habib1001-m/hakim` + `claude plugin install hakim@hakim` | Claude installation scope, managed policy, permissions, plugin cache, and trust remain authoritative |
| GitHub Copilot | Native marketplace plugin with six skills and five custom agents; repository instructions retained as optional baseline | `copilot plugin marketplace add Habib1001-m/hakim` + `copilot plugin install hakim@hakim` | Copilot policy, enabled plugins, repository access, and agent tool permissions remain authoritative |
| OpenCode | Guarded project-local native plugin bundle with create-only installation, canonical hash manifest, exact-match removal, quarantine-backed removal, and rollback | source checkout → guarded dry-run/apply installer → normal OpenCode startup | No npm/global installer or cross-process lifecycle lock is claimed; validation is bounded to documented versions/test environments; installer intentionally does not edit `opencode.json` |

## Design rule

Hakim does not force every host into the same adapter shape. Each maintained integration uses the strongest native extension model that materially improves the product while preserving the host's own permission and trust boundaries.

Unused extension surfaces are not added for symmetry. For example, Hakim does not add an MCP or LSP server to Copilot merely because plugins support them; those components require a concrete product need.

## General boundaries

- Host-native security, permission, approval, sandbox, plugin, and managed-policy controls remain authoritative.
- A structural, smoke, packaging, or CI pass proves only its checked scope.
- Compatibility with every operating system, provider, model, editor version, organization policy, or long-running interactive session is not established.
- Central marketplace/directory publication is a separate distribution action from repository-hosted Git marketplace installation.
- Candidate integrations not listed above are experimental or unsupported.
