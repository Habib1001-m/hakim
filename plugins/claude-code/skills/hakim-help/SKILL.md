---
name: hakim-help
description: Show a concise host-aware quick reference for Hakim modes, native plugin surfaces, capabilities, installation, and evidence boundaries. Use for Hakim help, Hakim commands, how to use Hakim, or supported Hakim features.
user-invocable: false
---

# Hakim Help

Use this one-screen reference. Capability scope is shared; installation and invocation intentionally use each host's native extension model.

## Modes

| Mode | Meaning |
|---|---|
| `lite` | Implement the request and name the smaller alternative. |
| `full` | Apply the complete Hakim ladder. Default. |
| `ultra` | Prefer deletion and require evidence before additions. |
| `off` | Do not apply Hakim guidance. |

## Capabilities

| Capability | Function |
|---|---|
| `hakim` | Apply the smallest-safe-diff decision ladder. |
| `hakim-review` | Review an explicit diff for removable complexity. |
| `hakim-audit` | Manually audit an explicitly inspected repository scope; the optional deterministic helper scans Python only with two rules. |
| `hakim-debt` | Collect live `hakim:` shortcuts and validate debt provenance. |
| `hakim-gain` | Show accepted evidence status without unsupported metrics. |
| `hakim-help` | Show this reference without changing state. |

## Native host surfaces

- **Codex:** `codex plugin marketplace add Habib1001-m/hakim`, install `hakim@hakim` from `/plugins`, then use skills such as `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.
- **Claude Code:** `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim`; explicit commands are `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:gain`, and `/hakim:help`.
- **GitHub Copilot:** `copilot plugin marketplace add Habib1001-m/hakim` then `copilot plugin install hakim@hakim`; inspect skills with `/skills list` and specialized agents with `/agent`.
- **OpenCode:** install the guarded project-local bundle from a Hakim source checkout, then use `/hakim full`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, or `/hakim-help`.

The canonical capability map is `core/hakim-skill/capabilities.json`.

## Distribution boundary

Repository-hosted native Git marketplaces are maintained for Codex, Claude Code, and GitHub Copilot. OpenCode uses a guarded project-local native plugin installer. Hakim is not published to npm and does not claim a central plugin-directory listing, signing, notarization, or universal host compatibility.

Host-native permissions, approval, trust, sandbox, managed policy, plugin enablement, and removal controls remain authoritative.

## Evidence boundary

Public CI, structural checks, package checks, and host-local validation prove only their inspected scope. Independent benchmark results, universal compatibility, correctness, security approval, performance gains, token savings, cost savings, adoption, and ROI remain `NOT_ESTABLISHED` unless separate accepted evidence establishes them.

## Boundary

One-shot reference. It changes no mode, files, settings, permissions, or runtime state.
