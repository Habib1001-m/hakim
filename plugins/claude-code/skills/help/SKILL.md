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

Claude may delegate automatically to plugin agents exposed under scoped names such as `hakim:hakim-reviewer`, `hakim:hakim-auditor`, `hakim:hakim-debt-analyst`, and `hakim:hakim-evidence-verifier`. `hakim:hakim-implementer` is available for explicitly isolated implementation work in a temporary git worktree.

Type `@` in Claude Code to discover and explicitly select an installed Hakim agent when you want guaranteed delegation.

## Installation

```text
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Use `/plugin` or `claude plugin details hakim@hakim` to inspect the installed component inventory. Claude Code permissions, approval controls, and managed policy remain authoritative.
