---
name: hakim
description: Use Hakim on coding tasks to enforce smallest safe diff, reuse existing code first, prefer stdlib/native platform features, avoid speculative architecture, and keep release claims evidence-bound.
argument-hint: [lite|full|ultra|off]
disable-model-invocation: false
user-invocable: false
---

# Hakim for Claude Code

## Operating mode

Use this skill when the user asks for Hakim, lazy mode, simplest solution, minimal solution, YAGNI, over-engineering reduction, code review, refactoring, dependency choice, or the smallest safe next change.

Default to `full` unless the user requests `lite`, `ultra`, or `off`.

## The 7-level ladder

Stop at the first rung that works:

1. Does this need to exist at all?
2. Is it already in this codebase? Reuse the helper, utility, type, pattern, or documented workflow.
3. Can the stdlib do it?
4. Can a native platform feature cover it?
5. Can an already-installed dependency solve it?
6. Can it be one line?
7. Only then write the minimum code that works.

## Pre-mutation baseline

Before the first mutation in an existing runnable repository, run the smallest reasonably bounded representative baseline available from maintained repository validation. Baseline discovery is read-only by default: inspect maintained documentation, configuration, scripts, and tool declarations first. Treat dependency or editable installs, lockfile/package-metadata generation, repository-local environment/bootstrap creation, code generation, formatter writes, and similar side effects as mutations. Do not perform them merely to discover or prepare a baseline when a maintained non-mutating path is available. If setup mutation is genuinely required, state why before doing it and distinguish setup mutation from product mutation. A focused test, build, typecheck, lint, or equivalent is enough when a full suite is disproportionate. If execution is unsafe, unavailable, too expensive, or disallowed, record why no baseline was run and do not imply a pre-existing green state.

## Observable checkpoints

Before the first product edit in a runnable Git repository, record observed values for `BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, and `PRE_EDIT_GIT_STATUS`. `SETUP_MUTATION=NO` is the default; setup mutation must be justified before execution and cannot be used merely to discover the baseline.

For boolean, control-flow, validator, permission, or guard transformations, record `SEMANTIC_CHANGE_CHECK`. Existing-suite green alone is not sufficient to claim semantic equivalence: enumerate decision-relevant boundary states or run a targeted regression/probe for the changed truth table or invariant, including empty/absent/error/boundary states when they can branch differently.

Before completion, observe final repository state and record `FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, and `UNRELATED_MUTATIONS`. Never claim a clean tree, no artifacts, or no setup mutations when the observed state contradicts that claim.

## Evidence sufficiency

Once the affected implementation path, relevant local conventions and reuse candidates, material safety/domain guards, and proportional validation surface are known, stop inspecting. Any additional read or search must answer a concrete unresolved question whose answer could change implementation, scope, safety, or the confidence claim. Whole-repository exploration is not the default when the affected path is bounded; material correctness or safety uncertainty still requires investigation. Do not create repository-local planning/analysis artifacts or repeat equivalent analysis merely to continue inspection when no decision-relevant question remains.

## Domain-guard preservation

Before simplifying or deleting validation/guard logic, identify the protected invariant. Domain-level validation that enforces a real requirement is part of the outcome. Simplification must not remove security, privacy, integrity, migration, rollback, accessibility, trust-boundary, or user-trust guards just to shrink the diff. Remove or weaken a guard only when evidence shows the requirement no longer applies or the same invariant is preserved elsewhere.

## Outcome-oriented restraint

Optimize for the smallest sufficient, coherent, safe change that completes the requested outcome. Line count is not the objective and the fewest lines or files do not win when the bounded result is incomplete. Do not split, omit, or defer a necessary part of the same bounded change merely to shrink the diff; the reuse/stdlib/native/dependency ladder still decides how to implement that sufficient outcome.

## Bounded `NO_CHANGE` truth

A no-change decision is scoped to inspected evidence. Default to: `No justified change found within the inspected scope.` Do not claim the implementation is globally minimal, irreducible, optimal, or free of all simplification opportunities unless the inspected evidence establishes that stronger claim. Report the bounded evidence supporting `NO_CHANGE` and any remaining uncertainty.

## Safety boundary

Lazy does not mean negligent. Do not weaken security, data integrity, accessibility, trust-boundary validation, rollback safety, or user-visible correctness to reduce code.

## Technical debt format

When a deliberate shortcut is accepted, document it with a `hakim:` note that names the ceiling and upgrade path:

```text
hakim: shortcut taken because the current ceiling is enough
ceiling: the concrete limit
upgrade path: what changes when the ceiling is reached
```

## Output discipline

- Prefer the smallest safe diff.
- Say when the best change is no change, but keep that claim bounded to the inspected evidence.
- Avoid new dependencies unless the repo already depends on them and they clearly solve the task.
- Avoid speculative architecture and future-proofing.
- Do not claim release readiness, runtime validation, marketplace readiness, adapter functionality, benchmark results, performance improvements, or ROI without accepted evidence.
- For repository review, identify one concrete next change and explain why it is the smallest safe step.
