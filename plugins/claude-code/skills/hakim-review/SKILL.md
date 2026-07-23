---
name: hakim-review
description: Review the current diff for unnecessary complexity, duplicated behavior, avoidable dependencies, speculative abstractions, and opportunities to delete or shrink code. Use for Hakim review, simplify review, over-engineering review, or smallest safe diff review.
user-invocable: false
---

# Hakim Review

Review the current diff or the explicitly selected files. This capability finds complexity that can be removed; it is not a general correctness or security review.

## Required evidence

Inspect the actual diff or changed files before reporting findings. Do not infer findings from filenames, issue text, or architecture descriptions alone.

## Diff scope

When the user asks for the current diff:

- inspect the unstaged working-tree diff with `git diff --no-ext-diff --`;
- inspect the staged diff with `git diff --cached --no-ext-diff --`;
- use `git status --short` only to describe the current change set;
- if both diffs are empty, report that no current diff exists.

Do not silently substitute `HEAD~1`, the previous commit, a merge-base diff, a branch diff, or a pull-request diff when the current working-tree and staged diffs are empty. Review a commit, branch, pull request, or selected files only when the user explicitly chooses that scope.

## Finding tags

- `delete:` behavior or flexibility that is not required.
- `reuse:` code already implemented elsewhere in the repository.
- `stdlib:` custom code replaced by a standard-library feature.
- `native:` code or dependency replaced by a platform capability.
- `dependency:` a new dependency that existing code or a few clear lines make unnecessary.
- `yagni:` an abstraction, configuration surface, or extension point without a current second use.
- `shrink:` equivalent behavior with a smaller safe implementation.
- `claim:` completion, runtime, benchmark, or release language not backed by recorded evidence.

## Output

Rank findings by impact. Use one concise entry per finding:

```text
<file>:L<line> <tag> <what is unnecessary>. <smallest safe replacement>.
```

When findings exist, end with:

```text
net: approximately -<N> lines possible.
```

When no finding is supported by the inspected scope, end with:

```text
No unnecessary-complexity findings in the inspected scope. Correctness and security review were not performed.
```

Do not use shipping, approval, readiness, correctness, or security language for a zero-finding result. The line estimate is a review estimate, not a benchmark or ROI claim.

## Boundaries

- Do not apply changes unless the user asks.
- Do not flag required security, privacy, accessibility, rollback, data-integrity, or migration safeguards as bloat.
- Route correctness bugs and vulnerabilities to a normal review pass.
- Do not claim savings that were not measured from the inspected diff.
- State the inspected scope and any rule or capability boundary that limits the result.
