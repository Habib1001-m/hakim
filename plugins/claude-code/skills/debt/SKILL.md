---
name: debt
description: Inspect Hakim technical-debt markers and provenance in a read-only isolated analyst context.
argument-hint: [scope]
disable-model-invocation: true
context: fork
agent: hakim:hakim-debt-analyst
effort: high
---

# Hakim Debt

Inspect `$ARGUMENTS` using the preloaded Hakim debt contract. Distinguish live `hakim:` markers from examples and archives. Report only file-backed ceilings and upgrade triggers. Do not modify comments or ledgers.
