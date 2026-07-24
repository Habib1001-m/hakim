# Hakim Host Integrations

This directory contains Hakim's maintained host-specific product surfaces.

Maintained product surfaces:

- `codex/`: native Codex plugin with six skills and a bundled SessionStart hook; repository marketplace metadata lives under `.agents/plugins/`.
- `claude-code/`: native Claude Code plugin with commands, hidden canonical skills, agents, and lifecycle hooks; repository marketplace metadata lives under `.claude-plugin/`.
- `copilot/`: native GitHub Copilot plugin with six skills and five custom agents; repository marketplace metadata lives under `.github/plugin/`. `.github/copilot-instructions.md` is only an optional baseline/fallback.
- `opencode/`: project-local OpenCode runtime plugin. Normal first-run uses the bounded Git-backed `hakim-opencode` bootstrap; source-checkout lifecycle scripts under `scripts/` remain development fallbacks. No npm registry publication or global Hakim/OpenCode installer is claimed.

Candidate or exploratory host integrations should not remain in the public product tree merely as placeholders. Add a new host surface only when there is a concrete product path and an explicit support/acceptance plan. See `SUPPORTED_HOSTS.md` for the authoritative public support boundary.

Host-native trust, approval, sandboxing, activation, plugin policy, and removal controls remain authoritative. A structural projection or passing deterministic check does not establish universal runtime or model compatibility.
