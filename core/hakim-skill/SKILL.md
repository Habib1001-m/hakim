---
name: hakim
description: >
  Apply reuse-first, evidence-bound coding guidance: question whether work needs
  to exist, reuse the codebase, prefer standard-library and native-platform
  features, avoid speculative architecture, and produce the smallest safe diff.
  Use on coding, review, refactoring, dependency, and technical-debt tasks.
argument-hint: [lite|full|ultra|off]
license: MIT
version: 1.0.0-beta.1
author: Habib1001-m
repository: https://github.com/Habib1001-m/hakim
tags:
  - minimalism
  - yagni
  - code-reduction
  - evidence-bound
intensity_levels:
  - lite
  - full
  - ultra
  - off
progressive_disclosure:
  l1_metadata_tokens: 100
  l2_full_skill_tokens: 2500
  l3_references_unbounded: true
---

# Hakim Skill Package

## Persistence

Default to **full** for coding tasks when Hakim is active. Host invocation syntax
varies; use the host's discovered skill form or natural language.

- `lite`: implement the request and name the smaller alternative.
- `full`: enforce the complete smallest-safe-diff ladder.
- `ultra`: challenge additions and prefer deletion before new code.
- `off`: do not apply Hakim guidance.
