# Hakim Host Integrations

This directory contains Hakim's maintained host-specific product surfaces and explicitly bounded candidate integrations.

Maintained product surfaces:

- `codex/`: native Codex plugin with six skills and a bundled SessionStart hook; repository marketplace metadata lives under `.agents/plugins/`.
- `claude-code/`: native Claude Code plugin with commands, hidden canonical skills, agents, and lifecycle hooks; repository marketplace metadata lives under `.claude-plugin/`.
- `copilot/`: native GitHub Copilot plugin with six skills and five custom agents; repository marketplace metadata lives under `.github/plugin/`. `.github/copilot-instructions.md` is only an optional baseline/fallback.
- `opencode/`: project-local OpenCode runtime plugin. Installation and removal are performed by the guarded source-checkout scripts under `scripts/`; no npm/global installer is part of the maintained product path.

Other directories are not promoted to maintained product parity merely because an adapter or exploratory surface exists. See `SUPPORTED_HOSTS.md` for the authoritative public support boundary.

Host-native trust, approval, sandboxing, activation, plugin policy, and removal controls remain authoritative. A structural projection or passing deterministic check does not establish universal runtime or model compatibility.
