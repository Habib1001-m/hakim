---
name: gain
description: Verify what the current Hakim evidence actually proves in an isolated read-only verifier context.
argument-hint: [scope]
disable-model-invocation: true
context: fork
agent: hakim:hakim-evidence-verifier
effort: high
---

# Hakim Gain

Evaluate `$ARGUMENTS` using the preloaded Hakim evidence-status contract. Report only inspectable evidence, keep unsupported measurements as `NOT_ESTABLISHED`, and do not modify repository state.
