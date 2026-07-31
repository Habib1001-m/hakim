# F05 — Objective Completion Truth: Start and Task Boundary

**Status:** `STARTED / DESIGN-VALIDATION`  
**Base main:** `c1c21d5575ae7e9a8f1d95b23f3d4ae55e75cb09`  
**Parent workstream:** issue #41  
**Prerequisite:** P0 closed through PR #48 / issue #47, with post-merge truth reconciliation through PR #49.

## Question

Can Hakim reconcile consequential completion claims with objective repository/setup truth at a late boundary without becoming a prose linter, command blocker, or reasoning workflow?

## Current design hypothesis

Use the host-native Copilot `agentStop` lifecycle boundary as a **one-shot objective contradiction check**.

The hook may read the host-provided `cwd` and `transcriptPath` ephemerally. It must not persist raw prompts, source code, tool arguments, transcript contents, or reasoning.

The first implementation slice is intentionally narrower than a general final-response validator:

1. observe only high-confidence repository/setup facts that can be checked directly;
2. inspect only the final completion turn for a small allowlist of consequential factual claim classes;
3. return `allow` when no objective contradiction is established;
4. return `block` at most once, with a bounded correction reason, when an objective contradiction is established;
5. if the hook is already active because of a prior block, return `allow` and never create a correction loop.

## Initial claim classes

Candidate v1 claim classes are limited to facts with direct local authorities:

- working tree claimed clean / no changes;
- no setup artifacts or setup mutation claimed;
- no unrelated mutations claimed.

Test-result or semantic-correctness claims are **not** in the first slice unless a trustworthy structured authority already exists for that exact claim.

## Explicit exclusions

F05 v1 must not:

- add `preToolUse` or broad command blocking;
- infer correctness from command strings;
- inspect every tool call merely for ceremony;
- require agents to emit a new structured completion schema;
- persist transcript or repository content;
- create a second Hakim policy engine inside the hook;
- rewrite ordinary final prose;
- block because the tree is dirty when the completion does not claim it is clean;
- block more than once for one completion attempt;
- silently convert development evidence into beta.4 or future beta.5 candidate evidence.

## Validation order

1. deterministic parser/decision tests with synthetic transcript and repository fixtures;
2. existing Copilot operational-presence regressions remain green;
3. canonical `npm test` / Node 22 / Node 26 gates;
4. only then a bounded live Copilot probe on the exact F05 candidate head;
5. operator acceptance remains separate from test success.

## Decision boundary

```text
P0                          = CLOSED / PASS
F05                         = STARTED / DESIGN-VALIDATION
F05_LIVE_HOST_ACCEPTANCE    = NOT_RUN
F06                         = NOT_STARTED
F07                         = NOT_STARTED
BETA5                       = NOT_CUT
EXTERNAL_EVALUATOR_CAMPAIGN = SUSPENDED
STABLE_1_0_0                = NOT_AUTHORIZED
```
