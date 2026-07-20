---
name: hakim-help
description: Show a concise host-aware quick reference for Hakim modes, capabilities, private OpenCode first-run steps, and evidence boundaries. Use for Hakim help, Hakim commands, how to use Hakim, or supported Hakim features.
---

# Hakim Help

Use this one-screen reference. Invocation syntax differs by host; capability scope does not.

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

## Host invocation

- **OpenCode native package:** `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, or `/hakim-help`.
- **Codex:** use discovered skills such as `@hakim` or ask in natural language.
- **Claude Code:** use exposed slash skills when listed by the host, or ask in natural language.
- **GitHub Copilot:** use natural-language requests; repository instructions do not promise slash commands.

The canonical capability map is `core/hakim-skill/capabilities.json`.

## Private OpenCode first run

1. Obtain the verified `habib-hakim-1.0.0-beta.1.tgz` artifact.
2. Run `npx /absolute/path/to/habib-hakim-1.0.0-beta.1.tgz install`.
3. Restart OpenCode or open a new session.
4. Run `/hakim-help`, then one bounded Hakim task.
5. Record privacy-safe feedback with the repository's `Hakim Beta Feedback` issue form.

The package is not published to npm. Do not replace the local `.tgz` path with
`npx @habib/hakim install`.

## Evidence boundary

Accepted runtime verdicts are `23/30`; the reproducible benchmark protocol is
`LEVEL_2_ACCEPTED`; the independent Hakim benchmark is `NOT_ESTABLISHED`;
external evaluator journeys remain `0`; performance and ROI claims remain `HOLD`.

## Boundary

One-shot reference. It changes no mode, files, settings, or runtime state.
