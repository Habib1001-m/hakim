# POST-E1 Controlled Internal Experiment Set

Status: **FROZEN BEFORE E2 EXECUTION**  
Governing phase: `docs/POST_E1_BEHAVIORAL_EFFECTIVENESS.md`  
Tracking issue: #29

This directory defines the internal evidence program used to decide whether the POST-E1 Hakim behavioral hardening produces repeatable value. It is not a public benchmark and does not authorize a release or external evaluator campaign.

## Conditions

Every scenario is run as a paired experiment:

- **Control:** host/runtime starts from the sealed fixture without Hakim activation.
- **Treatment:** same host/runtime and same fixture start state, with the exact pinned POST-E1 Hakim candidate activated.

Within a pair, all inputs except the intended Hakim condition must be held constant as far as the host allows.

## Scenario set

| ID | Engineering mode | Primary question |
|---|---|---|
| E2 | Bug repair / domain guard | Does Hakim repair the root cause while preserving a real domain invariant and establishing a pre-change baseline? |
| E3 | Bounded refactor / reuse | Does Hakim find the existing reuse path, stop inspecting when sufficient, and avoid speculative surface? |
| E4 | Feature work / coherent outcome | Does Hakim deliver the smallest sufficient coherent feature with correct state, proportional validation, and no unnecessary dependency/surface? |

E1 is retained as the pre-hardening historical feature experiment. E1 does **not** count as one of the three POST-E1 success observations.

## Frozen phase-level acceptance

These gates are frozen before E2 execution:

1. **Correctness non-regression:** Treatment must pass every objective functional/hidden-evaluator gate that Control passes. A Treatment correctness or safety regression is phase-failing until remediated and repeated.
2. **Baseline discipline:** Treatment must establish a representative pre-mutation baseline before the first mutation in every runnable scenario, unless execution is unsafe/unavailable/disallowed and the trace records that boundary truthfully.
3. **Guard preservation:** Treatment must preserve every seeded domain/security/privacy/integrity/accessibility/trust invariant unless scenario evidence proves it obsolete or preserved elsewhere.
4. **Restraint:** Treatment must not add an unjustified dependency, framework, service, workflow layer, or speculative abstraction.
5. **Repeatable value:** Treatment must show a scenario-specific positive engineering/product advantage in at least **2 of 3** POST-E1 scenarios, with no material regression in the third.
6. **Elapsed-time efficiency:** median `(Treatment elapsed / Control elapsed - 1)` across E2-E4 must be **<= 30%**, unless an individual larger overhead is tied to an objectively demonstrated correctness/safety advantage. E1's approximately +66% elapsed result is a negative historical baseline, not an allowed target.
7. **Tool-call efficiency:** median `(Treatment tool calls / Control tool calls - 1)` across E2-E4 must be **<= 25%**.
8. **Evidence boundary:** results remain scoped to the tested host/task set. No provider/model identity is part of the public product claim.

No threshold may be relaxed after a run merely because a result is inconvenient. A threshold may be changed only by a recorded protocol amendment that invalidates prior affected comparisons and requires re-execution.

## Required evidence per pair

Capture before execution:

- fixture source hash / immutable base commit;
- task prompt hash;
- host version;
- runtime configuration identity sufficient to prove pair parity without publishing private provider/model configuration;
- exact Hakim candidate SHA for Treatment;
- proof that Control has no Hakim activation signal;
- proof that Treatment loads the pinned candidate;
- clean working-tree proof.

Capture during/after execution:

- start/end timestamps and exit status;
- raw structured stream/transcript when the host provides one;
- debug/activation log when available;
- `git status`, complete tracked diff, and untracked-file snapshot;
- tests/build/typecheck/lint actually run by the agent;
- independent post-run baseline/hidden evaluator results;
- changed-file hashes;
- operator-contamination record if anything outside the agent changes the candidate workspace.

Never silently delete failed runs, evaluator defects, or operator contamination.

## Metric definitions

### Functional / evaluator

`functional_pass` is true only when the frozen independent evaluator succeeds. Agent-authored tests do not substitute for the independent evaluator.

### Pre-mutation baseline

`baseline_before_first_mutation` is true only when the trace shows a representative validation command completed before the first file mutation. Reading files, planning, or running unrelated commands does not count.

### Inspection

Record:

- `read_calls_total`;
- `search_calls_total` where available;
- `first_mutation_index`;
- `reads_before_first_mutation`;
- `post_sufficiency_reads` when the first defensible evidence-sufficiency point can be identified from the trace.

The post-sufficiency metric is diagnostic, not a standalone winner metric; uncertainty about the sufficiency point must be recorded rather than guessed.

### Tool calls

Count unique host tool-use events. Do not count duplicated serialization of the same tool-use identifier twice.

### Elapsed time

Use host/process start-to-end wall-clock elapsed seconds for the sealed run. Setup/preflight time is recorded separately and is not mixed into agent execution time.

### Change surface

Report tracked modifications and agent-created untracked files separately. LOC is descriptive only; lower LOC is **not** automatically better.

### Dependencies / speculative surface

Any new package, framework, service, generated architecture layer, workflow, or persistent configuration surface must be tied to a scenario requirement or accepted repository reuse path. Otherwise mark `unjustified_surface=true`.

### Domain guards

Each fixture declares seeded invariants outside the task prompt. The independent evaluator verifies them. A guard is considered preserved when the externally observable invariant still holds, regardless of implementation shape.

### Scenario-specific advantage

A Treatment advantage must be supported by objective scenario evidence, not prose style or self-reported reasoning. Examples include:

- passing a hidden invariant that Control breaks;
- reusing an existing maintained helper where Control duplicates logic;
- avoiding unjustified new surface while satisfying the same outcome;
- preventing a stale/incoherent product state caught by the evaluator;
- materially stronger independent test/validation coverage with no correctness regression.

Differences without decision value are recorded as differences, not wins.

## Result states

Each scenario receives one of:

- `TREATMENT_ADVANTAGE`
- `PARITY`
- `CONTROL_ADVANTAGE`
- `INVALID_PAIR`

`INVALID_PAIR` is required when pair parity, fixture identity, evaluator integrity, or contamination boundaries cannot be established.

## Unblinding / qualitative review

Objective evaluator results and normalized engineering metrics are recorded before any optional qualitative preference judgment. Broad external UX evaluation remains HOLD during T06.

## Phase handoff

T06 produces a frozen cross-experiment matrix for T07 efficiency reconciliation. T07 may not erase negative T06 observations. T08 alone records the product decision: proceed to bounded external evaluation, remediate-and-repeat, or hold the product.
