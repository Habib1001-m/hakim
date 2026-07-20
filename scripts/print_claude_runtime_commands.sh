#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
# Hakim Claude Code runtime validation commands

Run from the repository root:

```bash
claude --plugin-dir ./plugins/claude-code
```

Manual checks inside Claude Code:

```text
/help
/plugins
/reload-plugins
/hakim full Review this repository and suggest the smallest safe next change.
```

Expected evidence:

- Claude Code starts without plugin load errors for `plugins/claude-code`.
- The Hakim skill is visible, typically as `/hakim`.
- `/plugins` shows `hakim` enabled with one skill.
- `/reload-plugins` keeps the plugin available.
- The response follows smallest-safe-diff behavior.
- No Claude hooks are present or claimed.

Do not use local wrapper names as canonical project commands.
The official project command is always:

```bash
claude --plugin-dir ./plugins/claude-code
```
EOF
