# E2 Protocol Amendment 001 — Evaluator Scope Correction

Status: **APPLIES TO THE NEXT E2 EXECUTION ONLY**

Run affected: E2 Run-001

## Why this amendment exists

The frozen E2 task describes one reported compatibility defect: a supported scanner uppercases the canonical `rule:` prefix so `rule:<payload>` can arrive as `RULE:<payload>`.

The Run-001 hidden evaluator additionally required the mixed-case form `RuLe:<payload>` to be accepted. That behavior was not stated or implied by the task contract and expanded the compatibility requirement from one scanner normalization to general case-insensitive matching.

Both Control and Treatment satisfied the reported `RULE:` behavior, preserved the seeded domain guards, and failed only the extra mixed-case assertion. Therefore Run-001 cannot provide a valid functional comparison under the frozen protocol.

## Run-001 disposition

`E2_RUN_001 = INVALID_PAIR`

The raw run evidence must remain preserved. Its behavioral traces may still be used for observations that do not depend on the defective evaluator, including pre-mutation baseline ordering, tool-call counts, elapsed time, and orchestration behavior.

## Corrected evaluator scope

The amended evaluator:

- requires `RULE:<payload>` to be accepted;
- requires the encoder to remain canonical lowercase `rule:`;
- preserves the canonical and scanner-prefix domain/malformed-payload guards;
- requires nearby unsupported prefixes such as `rules:` to remain rejected;
- does **not** require arbitrary mixed-case forms such as `RuLe:`.

The E2 preflight now seeds and probes only the reported uppercase-prefix defect.

## Re-execution rule

This amendment changes evaluator semantics after Run-001. Per the POST-E1 experiment contract, Run-001 is not rescored. E2 must be materialized, sealed, and executed again from a clean immutable pair after the Hakim runtime-behavior remediation is frozen on a new behavior SHA.

E3 and E4 remain on HOLD until the corrected E2 pair establishes the T01 runtime acceptance gate.
