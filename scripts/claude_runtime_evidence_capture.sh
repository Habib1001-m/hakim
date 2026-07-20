#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="$ROOT/dist/claude-runtime-evidence-$STAMP"
PLUGIN_DIR="$ROOT/plugins/claude-code"
HOOKS_JSON="$PLUGIN_DIR/hooks/hooks.json"
HOOK_HANDLER="$PLUGIN_DIR/hooks/post_tool_use_diagnostic.mjs"

mkdir -p "$OUT_DIR"

run_capture() {
  local name="$1"
  shift
  {
    echo '$' "$@"
    "$@"
  } > "$OUT_DIR/$name" 2>&1 || true
}

cd "$ROOT"

run_capture git-head.txt git rev-parse HEAD
run_capture git-status.txt git status --short
run_capture node-version.txt node --version
run_capture npm-version.txt npm --version
run_capture claude-version.txt claude --version
run_capture check-claude-projection.txt npm run check:claude-projection
run_capture test-claude-diagnostic-hook.txt node tests/test_claude_diagnostic_hook.js
run_capture npm-test.txt npm test

cp "$PLUGIN_DIR/.claude-plugin/plugin.json" "$OUT_DIR/plugin-manifest.json"
cp "$HOOKS_JSON" "$OUT_DIR/hooks.json"
cp "$HOOK_HANDLER" "$OUT_DIR/post_tool_use_diagnostic.mjs"
find "$PLUGIN_DIR" -maxdepth 3 -type f | sort > "$OUT_DIR/plugin-files.txt"

cat > "$OUT_DIR/hook-shape-summary.txt" <<'EOF'
Expected D.2G hook shape:

Event: PostToolUse
Matcher: Edit|Write
Handler: node ${CLAUDE_PLUGIN_ROOT}/hooks/post_tool_use_diagnostic.mjs
Timeout: 5 seconds
Opt-in environment variable: HAKIM_CLAUDE_DIAGNOSTIC_HOOK=1
Observable debug environment variable: HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG=1

Default behavior:
- emits hookSpecificOutput.additionalContext only when HAKIM_CLAUDE_DIAGNOSTIC_HOOK=1
- remains silent when HAKIM_CLAUDE_DIAGNOSTIC_HOOK is unset

Observable debug behavior:
- when both env vars are enabled, also emits top-level systemMessage
- systemMessage is for trigger evidence only

Safety boundary:
- no PreToolUse
- no PermissionRequest
- no PermissionDenied
- no blocking decision
- no continue:false
- no permission changes
- no updatedToolOutput
- no updatedMCPToolOutput
- no file writes by the hook handler
EOF

cat > "$OUT_DIR/MANUAL_CLAUDE_HOOK_EVIDENCE_CHECKLIST.md" <<'EOF'
# Manual Claude Hook Runtime Evidence Checklist

This checklist is for Phase D.2G observable runtime validation evidence.

The repository can capture hook shape and handler smoke tests automatically, but a real Claude Code runtime transcript is still required before calling the hook runtime PASS.

## Official command

Run from the repository root:

```bash
export HAKIM_CLAUDE_DIAGNOSTIC_HOOK=1
export HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG=1
claude --plugin-dir ./plugins/claude-code
```

Do not record local wrapper aliases as canonical project commands.

## Inside Claude Code

Capture evidence for:

```text
/plugin
/hooks
/reload-plugins
/hooks
/help
/hakim full Review this repository and suggest the smallest safe next change.
```

Expected PASS signals:

- Claude Code starts without plugin load errors for `plugins/claude-code`.
- Hakim appears as an available skill, typically `/hakim`.
- `/plugin` shows Hakim enabled for the active session.
- `/hooks` shows exactly one Hakim plugin-sourced hook.
- The hook is `PostToolUse` with matcher `Edit|Write`.
- `/reload-plugins` keeps the plugin and hook available.
- Hakim response follows smallest-safe-diff behavior.

## Observable harmless runtime trigger

To prove the hook is reachable in runtime, ask Claude Code to perform one harmless tool write outside the repository:

```text
Use Write to create /tmp/hakim-claude-hook-smoke.txt containing exactly: hakim hook smoke
Then report whether a visible Hakim diagnostic system message appeared. Do not modify repository files.
```

Expected observable PASS signal:

```text
Hakim diagnostic hook observed: Write completed for /tmp/hakim-claude-hook-smoke.txt.
```

Expected safety signals:

- The hook does not block the Write tool.
- The hook does not modify tool input.
- The hook does not replace tool output.
- Claude can continue normally after the Write.
- No repository files are changed.

## Shell cleanup after the optional trigger

```bash
rm -f /tmp/hakim-claude-hook-smoke.txt
unset HAKIM_CLAUDE_DIAGNOSTIC_HOOK
unset HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG
```
EOF

cat > "$OUT_DIR/README.md" <<EOF
# Claude Runtime Evidence Packet

Generated: $STAMP

This packet captures repo-side evidence for the Claude Code adapter and the D.2G observable diagnostic hook boundary.

Runtime interaction still requires manual Claude Code transcript capture using:

\`\`\`bash
export HAKIM_CLAUDE_DIAGNOSTIC_HOOK=1
export HAKIM_CLAUDE_DIAGNOSTIC_HOOK_DEBUG=1
claude --plugin-dir ./plugins/claude-code
\`\`\`

Files:

- \`git-head.txt\`
- \`git-status.txt\`
- \`node-version.txt\`
- \`npm-version.txt\`
- \`claude-version.txt\`
- \`check-claude-projection.txt\`
- \`test-claude-diagnostic-hook.txt\`
- \`npm-test.txt\`
- \`plugin-manifest.json\`
- \`hooks.json\`
- \`post_tool_use_diagnostic.mjs\`
- \`plugin-files.txt\`
- \`hook-shape-summary.txt\`
- \`MANUAL_CLAUDE_HOOK_EVIDENCE_CHECKLIST.md\`
EOF

printf 'Claude runtime evidence captured: %s\n' "$OUT_DIR"
