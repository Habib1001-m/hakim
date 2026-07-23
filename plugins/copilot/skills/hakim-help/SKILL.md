---
name: hakim-help
description: Explain the native GitHub Copilot Hakim plugin, available skills and agents, installation commands, and evidence boundaries.
---

# Hakim Help for GitHub Copilot

Native plugin installation:

```text
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Available skills: `hakim`, `hakim-review`, `hakim-audit`, `hakim-debt`, `hakim-gain`, and `hakim-help`.

Use `/skills list` to inspect loaded skills and `/agent` to select a specialized Hakim custom agent. Use `copilot plugin list` to inspect installed plugins.

`.github/copilot-instructions.md` remains a repository baseline for compatible Copilot surfaces; it is not the whole Hakim product anymore.

Host-native permissions, organization policy, repository access, plugin enablement, and tool controls remain authoritative.
