---
name: audit
description: Run a deep read-only Hakim repository audit in an isolated auditor context.
argument-hint: [scope]
disable-model-invocation: true
context: fork
agent: hakim-auditor
effort: xhigh
---

# Hakim Audit

Audit `$ARGUMENTS` using the preloaded Hakim audit contract. Inspect only explicit, readable evidence. Keep deterministic helper coverage separate from manual findings. Do not modify repository state and do not turn zero findings into correctness, security, or release approval.
