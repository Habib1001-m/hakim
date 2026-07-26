---
name: hakim
description: Use Hakim on coding tasks to enforce smallest safe diff, reuse existing code first, prefer stdlib/native platform features, avoid speculative architecture, and keep release claims evidence-bound.
argument-hint: [lite|full|ultra|off]
disable-model-invocation: false
user-invocable: false
---

<!-- hakim-canonical-sha256: f6032abce66fb0a5071ff2775e7f3b495722c8026eaf40bab433fa84ebd66eea -->

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

Before the first mutation in an existing runnable repository, run the smallest reasonably bounded representative baseline available from maintained repository validation. A focused test, build, typecheck, lint, or equivalent is enough when a full suite is disproportionate. If execution is unsafe, unavailable, too expensive, or disallowed, record why no baseline was run and do not imply a pre-existing green state.

## Evidence sufficiency

Once the affected implementation path, relevant local conventions and reuse candidates, material safety/domain guards, and proportional validation surface are known, stop inspecting. Any additional read or search must answer a concrete unresolved question whose answer could change implementation, scope, safety, or the confidence claim. Whole-repository exploration is not the default when the affected path is bounded; material correctness or safety uncertainty still requires investigation.

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
- Say when the best change is no change.
- Avoid new dependencies unless the repo already depends on them and they clearly solve the task.
- Avoid speculative architecture and future-proofing.
- Do not claim release readiness, runtime validation, marketplace readiness, adapter functionality, benchmark results, performance improvements, or ROI without accepted evidence.
- For repository review, identify one concrete next change and explain why it is the smallest safe step.
