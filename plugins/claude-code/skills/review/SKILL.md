---
name: review
description: Review an explicit diff or selected files for removable complexity, duplicated behavior, speculative abstractions, avoidable dependencies, and unsupported claims without modifying repository state.
argument-hint: [scope]
disable-model-invocation: true
context: fork
agent: hakim:hakim-reviewer
effort: high
---

# Hakim Review

Use `review` for a **bounded read-only complexity review**. It answers: what can be deleted, reused, replaced, or simplified in the requested change without weakening the intended behavior or real guards?

It is not a general correctness, security, architecture, or release-approval review.

## Scope contract

Use the scope the user actually selected.

When asked for the **current diff**:

- inspect the unstaged working-tree diff;
- inspect the staged diff;
- use repository status only to describe the current change set;
- if both diffs are empty, report that no current diff exists.

Do not silently substitute `HEAD~1`, a branch diff, merge-base diff, pull request, previous commit, or whole-repository audit. Review those only when they are explicitly selected or clearly required by the request.

For selected files, inspect enough callers/consumers to verify a simplification claim before reporting it.

## What to look for

Report a finding only when the inspected evidence supports one of these:

- `delete` — behavior, flexibility, layer, or file has no current requirement/consumer;
- `reuse` — equivalent behavior already exists in the repository;
- `stdlib` — standard-library behavior replaces custom code safely;
- `native` — the language/runtime/platform already provides the required behavior;
- `dependency` — a new or existing dependency is unnecessary for the bounded outcome;
- `yagni` — abstraction/configuration/extension point has no current second use or requirement;
- `shrink` — the same behavior is clearer and smaller without losing required semantics;
- `claim` — completion, runtime, benchmark, release, security, or performance language exceeds the evidence.

Do not flag code merely because it is long, unfamiliar, defensive, or stylistically different.

## Evidence rule

Every finding must identify:

1. the concrete inspected evidence;
2. why the current construct is unnecessary or oversized;
3. the smallest safe replacement;
4. any consumer, guard, or uncertainty that limits the finding.

Before removing validation, permissions, migration, rollback, security, privacy, accessibility, integrity, or compatibility logic, identify the protected invariant. If the requirement is real, it is not bloat.

## Output

Rank findings by impact and confidence. Use one concise entry per finding:

```text
<path>:<line-or-range> <tag> — <evidence-backed finding>. <smallest safe replacement>.
```

When useful, include a short `scope:` line naming exactly what was inspected.

When no finding is supported, end with:

```text
No unnecessary-complexity findings in the inspected scope. Correctness and security review were not performed.
```

Do not invent line-savings estimates, ROI, approval, readiness, correctness, or security claims from a zero-finding review.

## Boundary

Read-only by default. Do not edit, format, stage, commit, or generate repository artifacts unless the user explicitly turns the review into an implementation task.
