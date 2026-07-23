---
name: hakim-help
description: Provide the current Hakim capability map and evidence boundaries when Claude needs host-aware usage guidance.
user-invocable: false
---

# Hakim Help

Use this capability when Claude needs the current Hakim capability map. The user-facing Claude Code shortcut is `/hakim:help`.

## Modes

| Mode | Meaning |
|---|---|
| `lite` | Implement the request and name the smaller alternative. |
| `full` | Apply the complete Hakim ladder. Default. |
| `ultra` | Prefer deletion and require evidence before additions. |
| `off` | Do not apply Hakim guidance. |

## Canonical capabilities

| Capability | Function |
|---|---|
| `hakim` | Apply the smallest-safe-diff decision ladder. |
| `hakim-review` | Review an explicit diff for removable complexity. |
| `hakim-audit` | Audit an explicitly inspected repository scope. |
| `hakim-debt` | Collect live `hakim:` shortcuts and validate debt provenance. |
| `hakim-gain` | Show accepted evidence status without unsupported metrics. |
| `hakim-help` | Provide capability guidance without changing state. |

The canonical capability map is `core/hakim-skill/capabilities.json`.

## Claude Code native surface

The installed Claude plugin exposes `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:gain`, and `/hakim:help`. It also provides plugin subagents and lifecycle hooks. Inspect them with `/plugin`, `/agents`, and `/hooks`.

## Evidence boundary

Public source, structural checks, package checks, and host-local validation each prove only their inspected scope. Do not infer universal compatibility, correctness, security approval, benchmark results, performance gains, token savings, cost savings, adoption, or ROI without separate accepted evidence.

## Boundary

One-shot reference. It changes no files, settings, permissions, or runtime state.
