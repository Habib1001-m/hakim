# Hakim Host Integrations

This directory contains Hakim's maintained host-specific product surfaces.

- `codex/` — native Codex plugin with six skills and SessionStart presence.
- `claude-code/` — native Claude Code plugin with commands, skills, agents, and lifecycle hooks.
- `copilot/` — native GitHub Copilot CLI plugin with six skills, five custom agents, and bounded host-native lifecycle hooks. `.github/copilot-instructions.md` is an optional repository baseline.
- `opencode/` — guarded project-local OpenCode plugin and managed lifecycle.

See [`SUPPORTED_HOSTS.md`](../SUPPORTED_HOSTS.md) for the maintained compatibility boundary and each integration README for installation/usage details.

Add another host surface only for a concrete supported product need. Hakim preserves host-native differences instead of creating placeholder integrations or a cross-host runtime for symmetry.

Host-native trust, approval, sandboxing, activation, plugin policy, permissions, and removal remain authoritative. Repository projection checks prove only their checked scope.
