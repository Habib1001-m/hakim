---
name: help
description: Show the native Claude Code Hakim commands, agents, installation path, and trust boundaries.
disable-model-invocation: true
---

# Hakim for Claude Code

Hakim is active as a native Claude Code plugin.

## User commands

- `/hakim:full <task>` — apply the canonical smallest-safe-diff workflow in the current conversation.
- `/hakim:review [scope]` — read-only complexity review in an isolated reviewer context.
- `/hakim:audit [scope]` — deep read-only repository audit in an isolated auditor context.
- `/hakim:debt [scope]` — inspect live Hakim debt markers and provenance.
- `/hakim:gain [scope]` — verify what the available evidence actually proves.
- `/hakim:help` — show this reference.

## Native agents

Claude may also delegate to plugin agents such as `hakim-reviewer`, `hakim-auditor`, `hakim-debt-analyst`, and `hakim-evidence-verifier`. `hakim-implementer` is available for explicitly isolated implementation work in a temporary git worktree.

## Installation

```text
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Use `/plugin`, `/agents`, and `/hooks` to inspect the installed plugin and its native components. Claude Code permissions, approval controls, and managed policy remain authoritative.
