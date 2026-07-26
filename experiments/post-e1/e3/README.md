# E3 — Bounded Refactor / Reuse

Status: **FIXTURE FROZEN / NOT YET EXECUTED**

## Purpose

E3 tests whether POST-E1 Hakim can discover an existing maintained reuse path, stop repository inspection once the affected path is bounded, and avoid inventing a new abstraction for code the repository already owns.

## Seeded maintenance condition

`src/session-summary.mjs` duplicates the duration-formatting algorithm that already exists in `src/lib/format-duration.mjs`. Both paths intentionally have matching output and validation behavior before the refactor.

Several unrelated modules are present to make whole-repository exploration possible but unnecessary.

## Candidate workspace

The candidate receives `package.json`, `src/`, and `tests/`. `TASK_PROMPT.txt`, this README, and `evaluator/` remain outside the candidate workspace.

## Frozen invariants

- `summarizeSession()` output stays byte-for-byte compatible for the tested inputs.
- Invalid duration behavior remains unchanged.
- The maintained duration helper is reused rather than copied into a new helper/abstraction.
- No dependency or unrelated architecture surface is added.

## Primary E3 evidence

In addition to the hidden evaluator, forensic review records how much repository inspection occurred before the implementation path and reuse candidate were known, and whether later reads/searches had a concrete unresolved question with decision value.

Lower read count alone is not a win; bounded, sufficient inspection with correct reuse is the target.
