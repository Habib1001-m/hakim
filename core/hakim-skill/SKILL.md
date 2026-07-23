---
name: hakim
description: >
  Apply reuse-first, evidence-bound coding guidance: question whether work needs
  to exist, reuse the codebase, prefer standard-library and native-platform
  features, avoid speculative architecture, and produce the smallest safe diff.
  Use on coding, review, refactoring, dependency, and technical-debt tasks.
argument-hint: [lite|full|ultra|off]
license: MIT
version: 1.0.0-beta.1
author: Habib1001-m
repository: https://github.com/Habib1001-m/hakim
tags:
  - minimalism
  - yagni
  - code-reduction
  - evidence-bound
intensity_levels:
  - lite
  - full
  - ultra
  - off
---

# Hakim Skill Package

## Persistence

Default to **full** for coding tasks when Hakim is active. Host invocation syntax
varies; use the host's discovered skill form or natural language.

- `lite`: implement the request and name the smaller alternative.
- `full`: enforce the complete smallest-safe-diff ladder.
- `ultra`: challenge additions and prefer deletion before new code.
- `off`: do not apply Hakim guidance.

## The Ladder (7-Level Decision Hierarchy)

The 7-level ladder runs after the task and affected code paths are understood.
Stop at the first rung that safely satisfies the request:

1. **Does this need to exist?** Skip speculative work and say why.
2. **Is it already in the codebase?** Reuse the existing helper, type, pattern, script, or workflow.
3. **Does the standard library do it?** Prefer it.
4. **Does the native platform do it?** Prefer platform behavior over custom code.
5. **Does an installed dependency already do it?** Reuse it before adding another.
6. **Can it be one clear line?** Keep it one line.
7. **Only then:** write the minimum custom code that works.

Two rungs work: choose the higher rung. A bug fix targets the shared root cause,
not only the reported symptom. Inspect sibling callers before editing.

## Intensity Levels

| Level | Behavior |
|---|---|
| `lite` | Build what was asked and mention the smaller safe alternative. |
| `full` | Reuse first, stdlib/native first, shortest safe diff. Default. |
| `ultra` | Prefer deletion and require evidence before abstractions or dependencies. |
| `off` | Do not apply Hakim guidance. |

## hakim: Comments (Technical Debt Documentation)

A deliberate shortcut must name its ceiling and upgrade trigger:

```text
hakim: shortcut accepted because the current ceiling is enough
ceiling: the concrete limit
upgrade path: what changes when the ceiling is reached
```

Examples or ledgers bundled by a distribution are synthetic unless repository
evidence explicitly promotes an entry to live debt.

## Deliberate Technical Debt Ledger

Live debt requires an existing repository path plus evidence such as a commit,
pull request, issue, operator transcript, or accepted `hakim:` marker. Some Hakim
distributions may include a synthetic example ledger; its presence is optional
and it does not make claims about the target repository.

## Capabilities

These are canonical capability identifiers. User-facing invocation intentionally
differs by host and is recorded in `capabilities.json` and the host integration.

| Capability | What it does |
|---|---|
| `hakim` | Apply or change Hakim intensity. |
| `hakim-review` | Review the current unstaged and staged diff for removable complexity. |
| `hakim-audit` | Audit active repository surfaces for evidence-backed simplification opportunities. |
| `hakim-debt` | Separate live debt from synthetic examples and archived records. |
| `hakim-gain` | Show accepted evidence status without unsupported metrics. |
| `hakim-help` | Show modes, capabilities, host syntax, validation, and evidence boundaries. |

## Optional Resources

Some Hakim distributions include helper scripts or example assets. Use those
resources only when they are actually present in the active distribution and
relevant to the task. Do not assume a source-repository path from an installed
plugin, and do not fail a manual capability merely because an optional helper or
example asset is absent.

## Workflow Use

The methodology can guide prompt chains, routing, parallel audits,
orchestrator-worker tasks, and evaluator loops. This is usage guidance, not a
claim that Hakim ships a workflow engine.

## Distribution Boundary

Hakim `1.0.0-beta.1` is distributed from public source. Codex, Claude Code, and
GitHub Copilot have repository-hosted native plugin marketplaces; OpenCode uses
a guarded project-local native plugin installer. No npm publication, central
plugin-directory listing, signing, notarization, or universal global installer
is claimed. Host-native installation, activation, permissions, trust, sandbox,
managed policy, and removal controls remain authoritative. No MCP or A2A
runtime/distribution is claimed.

## Evidence and Evaluation Boundaries

Public CI proves only the checked repository tests and package-build contracts.
Host runtime validation remains environment-specific and does not establish
universal compatibility. Hakim does not claim an independent benchmark result,
model-quality improvement, quantified performance gain, token saving, cost
saving, adoption result, safety improvement, or return on investment without
separate accepted evidence.

Historical Ponytail-derived values are not accepted as independent Hakim
results. Runtime validation, protocol reproducibility, external UX evidence,
model quality, and product performance remain separate claims.

## Lazy, Not Negligent

Never reduce security, privacy, accessibility, data integrity, migration
safety, rollback safety, or user trust to save code. Be minimal about the
implementation, not about rigor.
