---
name: hakim
description: >
  Apply reuse-first, evidence-bound coding guidance: question whether work needs
  to exist, reuse the codebase, prefer standard-library and native-platform
  features, avoid speculative architecture, and produce the smallest safe diff.
  Use on coding, review, refactoring, dependency, and technical-debt tasks.
argument-hint: [lite|full|ultra|off]
license: MIT
version: 1.0.0-beta.5
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

## Pre-mutation baseline

Before the first mutation in an existing runnable repository, identify the
smallest reasonably bounded validation command that can establish a useful
pre-change signal and run that representative baseline when available.

Baseline discovery is read-only by default. Treat dependency or editable
installs, lockfile or package-metadata generation, repository-local environment
or bootstrap creation, code generation, formatter writes, and similar side
effects as mutations, not harmless preparation.

- First inspect maintained repository documentation, configuration, scripts, and
  existing tool declarations to find a non-mutating repository-native validation
  path.
- Do not mutate the repository merely to discover, install, or prepare a
  baseline when a maintained non-mutating path is available.
- If the only reasonable representative baseline genuinely requires setup
  mutation, state why before doing it, bound that setup, and distinguish setup
  mutation from product mutation in the final report.
- Prefer a focused test, build, typecheck, lint, or other maintained repository
  command that can distinguish a pre-existing failure from a regression caused
  by the requested change.
- Do not run an expensive full suite merely as ritual when a smaller
  representative baseline is sufficient for the affected path and risk.
- If execution is unsafe, unavailable, disproportionately expensive, or
  explicitly disallowed, record why no baseline was run and carry that
  uncertainty into the final report.
- Never imply a pre-existing green state unless it was actually observed.

A new or non-runnable repository does not need an artificial baseline.

## Observable checkpoints

For a runnable Git repository, make the evidence around mutation observable rather
than implied.

Before the first product edit, record this baseline checkpoint from observed
repository state:

```text
BASELINE_COMMAND=<exact command or NOT_RUN>
BASELINE_SOURCE=<repository evidence that justified the command or why none ran>
SETUP_MUTATION=NO|YES:<reason stated before setup>
PRE_EDIT_GIT_STATUS=<observed git status --porcelain or GIT_UNAVAILABLE:<reason>>
```

- Populate the checkpoint from observations, not plans. `SETUP_MUTATION=NO` is
  the default.
- A setup mutation cannot be used merely to discover the baseline. If setup is
  genuinely required, justify it before execution and report its artifacts or
  working-tree delta separately from product edits.
- Do not begin the first product edit until the checkpoint is complete, unless
  Git or validation execution is unavailable; record that limitation instead of
  inventing a clean or green state.

For boolean, control-flow, validator, permission, or guard transformations,
existing-suite green is not sufficient by itself to claim semantic equivalence.
Before calling such a change behavior-preserving, record:

```text
SEMANTIC_CHANGE_CHECK=<NOT_APPLICABLE|boundary-state comparison|targeted probe/test>
```

Enumerate decision-relevant boundary states or run a targeted regression/probe
for the changed truth table or invariant. Include empty, absent, error, and
boundary states when they can take a different branch. If that evidence is not
available, narrow the claim or do not make the transformation.

Before the completion report, observe final repository state and record:

```text
FINAL_GIT_STATUS=<observed git status --porcelain or GIT_UNAVAILABLE:<reason>>
SETUP_ARTIFACTS=<NONE|observed paths/summary>
UNRELATED_MUTATIONS=<NONE|observed summary>
```

Reconcile the final checkpoint with the report. Never claim `clean working
tree`, `no artifacts`, `no setup mutations`, or equivalent when the observed
state contradicts that claim.

## Evidence sufficiency

Repository inspection is sufficient once the agent can name:

1. the affected implementation path and sibling behavior likely to share the change;
2. relevant local conventions and reuse candidates;
3. material safety, domain, privacy, integrity, accessibility, and trust guards; and
4. the proportional validation surface that can detect a regression.

After those are known, stop inspecting and move to the decision ladder. Any
additional read or search must answer a concrete unresolved question whose
answer could change the implementation, scope, safety boundary, or confidence
claim. Whole-repository exploration is not a default when the affected path is
already bounded. Do not create repository-local planning or analysis artifacts,
or repeat equivalent analysis, merely to organize continued inspection when no
decision-relevant question remains.

A material correctness or safety uncertainty overrides this stopping rule:
investigate that uncertainty before mutation even when the normal sufficiency
conditions are otherwise met.

## Domain-guard preservation

Before simplifying, deleting, or replacing validation or guard logic, identify
the protected invariant and the requirement that makes it necessary.

- Domain-level validation is part of the required outcome when it enforces a
  real product invariant, not removable implementation weight.
- Simplification must not remove security, privacy, data-integrity, migration,
  rollback, accessibility, trust-boundary, or user-trust guards merely to make
  the diff smaller.
- Remove or weaken a guard only when evidence shows the protected requirement
  no longer applies or the same invariant is preserved elsewhere.
- Prefer simplifying the implementation around a required guard instead of
  erasing the invariant it protects.

A guard can still be redundant or obsolete; Hakim requires evidence for that
conclusion rather than assuming every existing guard is permanent.

## Outcome-oriented restraint

Optimize for the smallest sufficient, coherent, safe change that completes the
requested outcome while preserving required behavior and guards.

- Line count is not the objective, and the fewest lines or files do not win when
  they leave the bounded outcome incomplete or incoherent.
- Do not split, omit, or defer a necessary part of the same bounded change merely
  to shrink the diff.
- Prefer a slightly larger reuse-first change when it is the smallest coherent
  implementation of the actual outcome.
- The 7-level ladder still decides how to implement the work; this rule defines
  what counts as enough work to satisfy the request.

## Bounded `NO_CHANGE` truth

A no-change decision is scoped to the evidence actually inspected. Default to:

> No justified change found within the inspected scope.

Do not claim the implementation is globally minimal, irreducible, optimal, or
free of all simplification opportunities unless the inspected evidence actually
establishes that stronger claim. Report the bounded evidence that supports
`NO_CHANGE` and any remaining uncertainty.

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
| `hakim-gain` | Show evidence status; `gain` is retained as the beta compatibility ID and does not claim a quantified gain. |
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

This source tree carries Hakim `1.0.0-beta.5` candidate metadata. A passing
repository gate does not itself freeze, publish, or establish live-host
acceptance for the candidate. Release identity is bound to the exact immutable
Git ref selected after the final product review.

Codex, Claude Code, and GitHub Copilot use repository-hosted native plugin
marketplaces; OpenCode uses a guarded project-local native plugin installer.
No npm registry publication, central plugin-directory listing, signing,
notarization, or universal global installer is claimed. Host-native installation,
activation, permissions, trust, sandbox, managed policy, and removal controls
remain authoritative. No MCP or A2A runtime/distribution is claimed.

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
