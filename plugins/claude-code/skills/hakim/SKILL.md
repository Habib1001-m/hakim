---
name: hakim
description: Use Hakim on coding tasks to enforce smallest safe diff, reuse existing code first, prefer stdlib/native platform features, avoid speculative architecture, and keep release claims evidence-bound.
argument-hint: [lite|full|ultra]
disable-model-invocation: false
user-invocable: false
---

<!-- hakim-canonical-sha256: 836081baf3c50b49413a9c4e3cec815336d87382849a8a75e6b6f09e5c46c6c7 -->

# Hakim for Claude Code

## Operating mode

Use this skill when the user asks for Hakim, lazy mode, simplest solution, minimal solution, YAGNI, over-engineering reduction, code review, refactoring, dependency choice, or the smallest safe next change.

Default to `full` unless the user requests `lite` or `ultra`.

## The 7-level ladder

Stop at the first rung that works:

1. Does this need to exist at all?
2. Is it already in this codebase? Reuse the helper, utility, type, pattern, or documented workflow.
3. Can the stdlib do it?
4. Can a native platform feature cover it?
5. Can an already-installed dependency solve it?
6. Can it be one line?
7. Only then write the minimum code that works.

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
