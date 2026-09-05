---
name: help
description: "Hakim — Use when asked how to use or invoke Hakim, list its six capabilities or modes, inspect host-native usage, or understand trust boundaries. Do not infer installed version/source identity or repeat release history from the skill text."
---

# Hakim Help

Hakim exposes six canonical capabilities. Host syntax differs; capability meaning does not.

## Capabilities

- `hakim` — core execution judgment and mode control.
- `review` — bounded read-only complexity review.
- `audit` — deeper evidence-backed repository audit.
- `debt` — live deliberate-shortcut / technical-debt provenance.
- `status` — evidence-status reporting only.
- `help` — this reference.

## Modes

Modes belong to `hakim`; they are not separate skills:

- `lite` — execute the request and mention a materially smaller safe alternative when one exists.
- `full` — default; apply the complete Hakim decision model with proportional verification.
- `ultra` — aggressively challenge additions, abstractions, and dependencies while preserving the required outcome and real guards.
- `off` — do not apply Hakim guidance beyond host/repository safety boundaries.

## Host-native invocation

Invocation is host-native. Use the form exposed by the installed Hakim plugin/runtime:

```text
Codex
  $hakim:hakim
  $hakim:review
  $hakim:audit
  $hakim:debt
  $hakim:status
  $hakim:help

Claude Code
  /hakim:hakim
  /hakim:review
  /hakim:audit
  /hakim:debt
  /hakim:status
  /hakim:help

GitHub Copilot CLI
  /hakim/hakim
  /hakim/review
  /hakim/audit
  /hakim/debt
  /hakim/status
  /hakim/help

OpenCode
  /hakim
  /review
  /audit
  /debt
  /status
  /help
```

A host may expose discovery UI, scoped agent names, or command aliases in addition to these forms. Those are routing details, not extra Hakim capabilities.

## Installed identity

Do not infer the active Hakim version, source revision, or update state from this help text.

Use the current host's plugin/package/runtime metadata to inspect installed identity. Release history, candidate SHAs, and previous acceptance results do not belong in the skill contract.

## Automatic behavior

Supported Hakim installations may apply the compact core policy automatically at session start. Explicit capability invocation is for intentional mode changes and specialized work such as review, audit, debt inspection, status reporting, or help; it is not required merely to make the core coding guidance exist.

## Trust boundary

Host-native permissions, trust prompts, sandboxing, managed policy, plugin enablement, repository authority, destructive-operation controls, publication/deployment approval, and protected-data rules remain authoritative.

Hakim never bypasses those controls.

## Boundary

This capability is read-only and changes no mode, repository state, settings, acceptance state, or release metadata.
