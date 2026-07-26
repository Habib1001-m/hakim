# POST-E1 T06 — Accepted Controlled Evidence

Status: **ACCEPTED / INTERNAL PRODUCT EVIDENCE**  
Governing phase: [#22](https://github.com/Habib1001-m/hakim/issues/22)  
T06 tracker: [#29](https://github.com/Habib1001-m/hakim/issues/29) — completed  
Next slice: [#30](https://github.com/Habib1001-m/hakim/issues/30) — T07 efficiency reconciliation

## Scope and claim boundary

T06 tested one pinned Hakim behavior surface against paired controls on three materially different internal engineering tasks using the same host family and sealed per-pair experiment controls.

The accepted result is limited to this tested host/task set. It is **not** a universal coding-quality, speed, token, cost, ROI, or model-quality claim and does not authorize stable release or broad external evaluation.

## Pinned product evidence

- Hakim behavior SHA: `3147203e0c0fadf0237b82cb9ea37f633bc4bab6`
- Claude plugin tree: `fe3ceb770d1b9b082dab802662bc396da8bc3044`
- Final T06 harness head: `130fcd037167ab4e7ce802174421ac734390bbee`

Later T07 analysis may advance the harness head, but T06 results must remain attributed to the pinned behavior surface above.

## Historical invalid run preserved

E2 Run-001 remains `INVALID_PAIR` and is not rescored. Its frozen hidden evaluator exceeded the task contract by requiring arbitrary mixed-case prefix acceptance beyond the reported uppercase scanner normalization. The run remains useful only for independent behavioral observations that do not depend on the defective evaluator.

`e2/AMENDMENT-001.md` records the evaluator correction. T06 acceptance uses corrected E2 Run-002 plus E3 Run-001 and E4 Run-001.

## Accepted scenario matrix

| Scenario | Primary result | Control functional | Treatment functional | Treatment runtime discipline | Elapsed delta vs control | Tool-call delta vs control |
| --- | --- | --- | --- | --- | ---: | ---: |
| E2 Run-002 — bug repair / domain guard | `TREATMENT_ADVANTAGE` | PASS | PASS | PASS | `+73.15%` | `+20.00%` |
| E3 Run-001 — bounded refactor / reuse | `TREATMENT_ADVANTAGE` | PASS | PASS | PASS | `-4.47%` | `-41.67%` |
| E4 Run-001 — coherent feature work | `TREATMENT_ADVANTAGE` | PASS | PASS | PASS | `+3.21%` | `-29.17%` |
| **Median** | **3/3 Treatment advantage** | — | — | **PASS in all three** | **`+3.21%`** | **`-29.17%`** |

Additional descriptive aggregate, not a frozen acceptance criterion:

- aggregate elapsed across E2-E4: approximately `+11.87%` Treatment vs Control;
- aggregate tool calls across E2-E4: approximately `-25.86%` Treatment vs Control.

The E2 elapsed result is a material outlier and remains explicit evidence debt for T07. Passing the phase median does not erase or explain that outlier.

## Scenario evidence summary

### E2 Run-002

Both conditions completed the requested scanner-prefix repair and passed visible plus corrected hidden evaluator gates. Treatment established a successful representative baseline before first mutation, invoked `hakim:hakim` before mutation, and kept bounded-task bookkeeping at zero. Control reached the correct final outcome but mutated before completing its representative baseline.

The final implementation quality was approximately parity. E2 therefore records a process-discipline advantage with a material elapsed-time debit, not a functional correctness advantage.

### E3 Run-001

Both conditions correctly removed duplicated duration formatting by reusing the maintained repository helper and passed the hidden evaluator. Treatment established baseline-before-mutation, invoked the required Hakim skill before mutation, used zero task bookkeeping, completed with fewer tool calls, and was slightly faster.

Control added useful extra regression coverage, so the smaller Treatment diff is not treated as automatically better merely because it is smaller. The accepted advantage is process efficiency plus sufficient reuse-first completion.

### E4 Run-001

Both conditions implemented immutable preset removal, coherent active-to-default fallback, permanent-default protection, explicit unknown-preset failure, tests, documentation, and preserved existing behavior. Both passed the hidden evaluator.

Treatment established the required pre-mutation discipline, used zero task bookkeeping, and used materially fewer tool calls with only a small elapsed increase. Control used a more specific `RangeError` in one guard path, which is a minor consistency edge but not a material Treatment regression under the frozen contract.

## Frozen T06 acceptance criteria

1. **Functional/correctness non-regression — PASS.** Treatment passed every accepted visible/hidden gate that Control passed in E2/E3/E4.
2. **Pre-mutation baseline discipline — PASS.** Treatment established the representative baseline before first mutation in all three valid POST-E1 scenarios.
3. **Domain/safety/integrity guard preservation — PASS.** Seeded and existing invariants remained intact in the accepted scenarios.
4. **No unjustified dependency/framework/service/workflow/speculative abstraction — PASS.** No accepted Treatment introduced such surface.
5. **Positive advantage in at least 2 of 3 scenarios with no material regression in the third — PASS.** Accepted result: 3 of 3 `TREATMENT_ADVANTAGE`.
6. **Median elapsed overhead <= 30% — PASS.** Accepted median: `+3.21%`.
7. **Median tool-call overhead <= 25% — PASS.** Accepted median: `-29.17%`.
8. **Claim boundary preserved — PASS.** Results remain internal, host/task-bounded evidence; provider/model identity is not part of public product claims.

## T06 decision

`POST_E1_T06_ACCEPTANCE = PASS`

This decision means the hardened Hakim behavior demonstrated repeatable internal product value across the frozen three-scenario set. It does **not** authorize stable `1.0.0`, registry publication, marketplace/directory claims, or broad external evaluator recruitment.

## Handoff to T07

T07 must reconcile efficiency without weakening the behaviors T06 just proved. In particular:

- preserve skill-before-first-mutation for coding work;
- preserve representative baseline-before-mutation;
- preserve zero/default task bookkeeping for bounded work;
- preserve stop-inspecting, guard-preservation, and smallest-sufficient/coherent/safe semantics;
- diagnose the E2 `+73.15%` elapsed outlier with evidence-bounded attribution;
- do not change the product behavior surface unless diagnosis demonstrates a concrete avoidable cost.
