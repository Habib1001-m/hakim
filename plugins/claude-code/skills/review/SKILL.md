---
name: review
description: Run a read-only Hakim complexity review in an isolated reviewer context.
argument-hint: [scope]
disable-model-invocation: true
context: fork
agent: hakim-reviewer
effort: high
---

# Hakim Review

Review `$ARGUMENTS` using the preloaded Hakim review contract. When no scope is supplied, review the current working-tree and staged diff only. Report evidence-backed simplifications; do not modify files and do not claim correctness or security approval.
