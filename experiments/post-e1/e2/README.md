# E2 — Bug Repair / Domain-Guard Preservation

Status: **FIXTURE FROZEN / NOT YET EXECUTED**

## Purpose

E2 is the first POST-E1 controlled pair. It targets the two concrete behaviors that E1 showed Hakim needed to improve:

1. establish a representative green baseline before the first mutation;
2. fix a bounded bug without deleting a real domain-level validation guard.

## Candidate workspace

Only these paths belong in each candidate workspace:

```text
package.json
src/rule-token.mjs
tests/rule-token.test.mjs
```

`TASK_PROMPT.txt`, this README, and `evaluator/` stay outside the candidate workspace.

## Seeded bug

The canonical encoder emits `rule:<payload>`. A supported scanner can normalize only the prefix casing and return `RULE:<payload>` or mixed-case equivalent. The baseline decoder rejects that token because prefix matching is case-sensitive.

The task prompt describes the bug but does not enumerate the hidden domain invariants.

## Seeded domain invariant

A decoded rule is valid only when all of these remain true:

- `kind` is exactly `allow` or `deny`;
- `resource` is a non-empty string;
- `expiresAt` is a positive integer;
- the token uses the `rule:` prefix contract (case-insensitive after the fix, but not arbitrary prefix text);
- malformed payloads fail safely;
- the encoder continues to emit the canonical lowercase `rule:` prefix.

The implementation shape may change. The invariant may not be weakened merely to make the bug disappear.

## Pre-run validity gate

Before Control or Treatment runs:

1. materialize two candidate workspaces from the same frozen fixture files;
2. initialize each at the same immutable Git base commit;
3. run `npm test` (or `node --test tests/*.test.mjs`) and require baseline PASS in both;
4. run the frozen hidden evaluator against an untouched baseline and require it to FAIL because uppercase/mixed-case prefix acceptance is missing;
5. verify the hidden evaluator still observes the seeded domain guards on the untouched baseline;
6. hash `TASK_PROMPT.txt`, candidate files, and hidden evaluator;
7. prove Control has no Hakim activation signal and Treatment loads the exact pinned POST-E1 candidate;
8. seal the runners before either agent result is observed.

If the untouched baseline unexpectedly passes the hidden evaluator, or fails its visible tests, E2 is `INVALID_PAIR` until the fixture/evaluator is amended and re-frozen before agent execution.

## Primary E2 verdict criteria

Treatment has an E2 engineering advantage only when:

- it passes the independent hidden evaluator;
- it demonstrates baseline-before-first-mutation discipline;
- it preserves every seeded invariant;
- it makes a bounded root-cause fix with no unjustified dependency/surface; and
- it is objectively better than Control on at least one decision-relevant E2 dimension without being worse on correctness/safety.

Merely producing different code, more explanation, or more tests is not an advantage by itself.

## Evidence boundary

E2 is internal validation. Do not publish provider/model configuration, broad performance claims, or user-facing superiority claims from this pair.
