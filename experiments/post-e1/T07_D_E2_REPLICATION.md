# POST-E1 T07-D — Counterbalanced E2 Diagnostic Replication

Status: **FROZEN BEFORE EXECUTION**  
Governing issue: [#30](https://github.com/Habib1001-m/hakim/issues/30)

## Purpose

T07-C classified the accepted E2 Run-002 elapsed outlier as:

`CAUSE_NOT_IDENTIFIABLE_FROM_CURRENT_EVIDENCE`

The preserved trace proved that most of the E2 elapsed delta sits in residual/unattributed time rather than directly observable tool execution, while E3/E4 did not reproduce the same elapsed pattern. This replication exists only to test whether the large E2 elapsed delta reappears when run order is counterbalanced.

It is diagnostic evidence, not a new product benchmark and not permission to change Hakim behavior.

## Frozen treatment surface

- Hakim behavior SHA: `3147203e0c0fadf0237b82cb9ea37f633bc4bab6`
- Claude plugin tree: `fe3ceb770d1b9b082dab802662bc396da8bc3044`
- T07 analyzer implementation SHA entering replication: `8bae8297ffa2c68e5cb7a6d5deb8a2dbfeec51eb`

No Hakim product-behavior mutation is permitted before this replication completes.

## Frozen E2 task/evaluator identity

The replication reuses the corrected E2 task/evaluator semantics from accepted E2 Run-002.

- Task SHA-256: `2e15f709f1fe17e95b06732650fb25e1bf925bd556fff10a5c8d5d1c693a514a`
- Corrected hidden evaluator SHA-256: `11e93a9046733f27915e86f36a100a5f0e80b46a656889a92eee64ed359e03b7`

A fresh pair must be materialized from the same frozen E2 fixture contract. The fresh seed commit SHA may differ from accepted Run-002 if materialization metadata creates a new commit; Control and Treatment must nevertheless start from one identical immutable seed SHA and clean trees.

## Counterbalanced order

Accepted E2 Run-002 used:

`TREATMENT -> CONTROL`

T07-D diagnostic replication is deliberately fixed to:

`CONTROL -> TREATMENT`

This order is **not randomized**. Counterbalancing is the diagnostic intervention, and the order is frozen before either condition is executed.

## Required pre-execution controls

Before task execution:

1. exact Hakim behavior/plugin-tree identity must be proved;
2. fresh Control/Treatment candidate roots must share the same baseline SHA and be clean;
3. task/evaluator hashes must match the frozen values above;
4. fresh isolated execution configs must be byte-identical across conditions except for Treatment activation via the pinned `--plugin-dir` surface;
5. Control must prove no Hakim activation signal;
6. Treatment must prove the lightweight Hakim runtime kernel is active;
7. runner, runtime checker, analyzer, task, evaluator, run order, and contract must be sealed before execution;
8. no prior replication result directory may exist.

Any mismatch is a safe-stop. Do not repair a sealed pair in place.

## Runtime/functional gates

Both conditions must complete the same visible and corrected hidden evaluators used by accepted E2 Run-002.

Treatment must also retain the T06-proven runtime behavior:

- `hakim:hakim` invoked before first mutation;
- representative successful baseline before first mutation;
- TaskCreate/TaskUpdate total = `0` for this bounded task;
- runtime checker = PASS.

A correctness or safety regression invalidates any efficiency interpretation.

## Frozen interpretation rule

The replication is not judged by whether it makes Hakim look faster.

After both conditions complete, calculate the same elapsed/tool metrics and run the T07 analyzer against both new traces.

Interpretation:

- If a similarly large Treatment elapsed debit reappears under the counterbalanced order while correctness/runtime discipline remain intact, record that the E2 slowdown is **replicated under opposite order**. Do not yet claim a universal or causal Hakim latency mechanism; determine whether one additional confirmatory replication or direct remediation evidence is needed.
- If the large debit disappears, materially shrinks, or reverses, record that the original `+73.15%` result is **not replicated under opposite order**, strengthening run/order variance as a plausible explanation but not proving its exact cause.
- If execution or evidence integrity fails, mark the replication invalid and preserve the failure; do not reinterpret T06 history.

No post-result threshold may be invented. T07-D exists to test recurrence of the previously observed large E2 elapsed debit, not to establish a new universal percentage target.

## Boundaries

- No product behavior change before replication completion.
- No stable release authorization.
- No external evaluator relaunch.
- No provider/model identity in product claims.
- No universal speed, token, cost, ROI, or quality claim.
- T06 accepted results remain unchanged regardless of T07-D outcome.
