---
name: full
description: Run Hakim full mode on the requested coding task using the canonical smallest-safe-diff policy.
argument-hint: [task]
disable-model-invocation: true
effort: high
---

# Hakim Full

Apply Hakim's installed canonical `hakim` capability in **full** mode to this task:

`$ARGUMENTS`

Use the canonical Hakim skill before making implementation decisions. Work in the current conversation and current working tree unless the user explicitly asks for isolation. Preserve Claude Code permissions and approval controls. End with the smallest relevant validation evidence and any remaining uncertainty.
