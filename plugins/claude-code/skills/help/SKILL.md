---
name: help
description: Show the six Hakim capabilities, modes, Claude-native invocation forms, and trust boundaries without embedding release history, candidate SHAs, or stale acceptance state.
disable-model-invocation: true
---

# Hakim Help

Hakim exposes six canonical capabilities in Claude Code:

- `/hakim:hakim` — core execution judgment and mode control;
- `/hakim:review` — bounded read-only complexity review;
- `/hakim:audit` — deeper evidence-backed repository audit;
- `/hakim:debt` — live deliberate-shortcut / technical-debt provenance;
- `/hakim:status` — evidence-status reporting only;
- `/hakim:help` — this reference.

## Modes

Modes belong to `/hakim:hakim`; they are not separate skills:

- `lite` — execute the request and mention a materially smaller safe alternative when one exists.
- `full` — default; apply the complete Hakim decision model with proportional verification.
- `ultra` — aggressively challenge additions, abstractions, and dependencies while preserving the required outcome and real guards.
- `off` — do not apply Hakim guidance beyond Claude Code and repository safety boundaries.

Example:

```text
/hakim:hakim ultra <task>
```

## Installed identity

Do not infer the active Hakim version, source revision, or update state from this help text.

Use Claude Code's plugin/runtime metadata, such as `/plugin` or `claude plugin details hakim@hakim`, to inspect the installed identity. Release history, candidate SHAs, and previous acceptance results do not belong in the skill contract.

## Automatic behavior

Hakim's compact core policy may be applied automatically at SessionStart after the host-native hook trust boundary is satisfied. Explicit capability invocation is for intentional mode changes and specialized work; it is not required merely to make the core coding guidance exist.

## Agents

Claude may expose Hakim reviewer, auditor, debt-analyst, evidence-verifier, or implementation agents as native scoped agents. Agents are execution contexts, not additional Hakim capabilities.

## Trust boundary

Claude Code permissions, trust prompts, sandboxing, managed policy, plugin enablement, and repository authority remain authoritative. Hakim never bypasses them.

## Boundary

This capability is read-only and changes no mode, repository state, settings, acceptance state, or release metadata.
