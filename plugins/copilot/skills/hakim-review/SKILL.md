---
name: hakim-review
description: Review an explicit diff or selected files for removable complexity, duplication, avoidable dependencies, speculative abstractions, and smaller safe alternatives without modifying files.
---

# Hakim Review

Inspect the actual requested scope before reporting findings. For a current-diff review, inspect unstaged and staged changes; do not silently substitute a previous commit or branch diff.

Use evidence-backed tags such as `delete`, `reuse`, `stdlib`, `native`, `dependency`, `yagni`, `shrink`, and `claim`. Rank the largest safe reductions first and give concrete file references.

This is not a correctness or security review. Do not mutate files unless the user explicitly changes the task from review to implementation.
