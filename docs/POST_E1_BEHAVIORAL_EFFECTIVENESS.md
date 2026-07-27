# POST-E1 Behavioral Effectiveness & Efficiency Hardening

Status: **ACTIVE / RELEASE-BLOCKING**  
Tracking issue: [#22](https://github.com/Habib1001-m/hakim/issues/22)

## Why this phase exists

Hakim has reached a point where installation, native-host integration, lifecycle safety, documentation truth, and current-host acceptance are not enough to justify promotion.

The first controlled production-like A/B experiment produced a more important question: **does Hakim make the engineering process materially better, not merely different?**

The initial pair demonstrated a real behavioral delta when Hakim was enabled, including deeper repository inspection, stronger attention to product state and UX, somewhat broader test/documentation investment, and materially higher elapsed time. Basic functional completion and overall change surface were approximately parity. The control also established a pre-mutation validation baseline more explicitly.

Those findings are useful, but one pair is not a general benchmark and does not authorize a product-quality or performance claim.

## Product decision

Hakim remains **HOLD** for stable `1.0.0` and for broad external evaluator recruitment until T08 records an explicit product-value decision.

T06 established repeatable positive internal value on the tested set. T07 reconciled the alarming E2 latency outlier without finding an evidence-backed Hakim defect to remediate. Neither result is a stable-release authorization or universal superiority claim.

This phase intentionally adds no new product surface unless evidence proves that surface is required.

## Current taskboard

- [x] **T01 — Pre-mutation baseline discipline** ([#24](https://github.com/Habib1001-m/hakim/issues/24)) — contract implementation is CI-protected; the runtime-salience remediation produced successful skill-before-mutation and representative-baseline-before-mutation behavior in corrected E2 plus E3/E4.
- [x] **T02 — Evidence sufficiency / stop-inspecting discipline** ([#25](https://github.com/Habib1001-m/hakim/issues/25)) — bounded stopping rule is projected across maintained hosts; repeated T06 evidence showed bounded Treatment behavior without sacrificing completion.
- [x] **T03 — Domain-guard preservation** ([#26](https://github.com/Habib1001-m/hakim/issues/26)) — prove-first regression captured; accepted T06 scenarios preserved seeded/existing functional and integrity boundaries.
- [x] **T04 — Outcome-oriented restraint** ([#27](https://github.com/Habib1001-m/hakim/issues/27)) — smallest means sufficient/coherent/safe rather than fewest LOC/files.
- [x] **T05 — Behavioral regression coverage** ([#28](https://github.com/Habib1001-m/hakim/issues/28)) — semantic contract coverage plus real-trace runtime checking are implemented and CI-protected; corrected E2, E3, and E4 all produced Treatment runtime-checker PASS.
- [x] **T06 — Repeated controlled experiments** ([#29](https://github.com/Habib1001-m/hakim/issues/29)) — **ACCEPTED / COMPLETE**. Corrected E2 plus E3/E4 produced 3/3 `TREATMENT_ADVANTAGE`, no accepted functional regression, median elapsed overhead `+3.21%`, and median tool-call delta `-29.17%`. Accepted ledger: [`experiments/post-e1/T06_ACCEPTANCE.md`](../experiments/post-e1/T06_ACCEPTANCE.md).
- [x] **T07 — Efficiency reconciliation** ([#30](https://github.com/Habib1001-m/hakim/issues/30)) — **ACCEPTED / COMPLETE** with `EFFICIENCY_RECONCILED_NO_CHANGE`. Deterministic trace analysis classified the original E2 latency cause as unidentifiable; a fresh counterbalanced E2 replication reduced the prior `+73.15%` Treatment debit to approximately `+0.008%` / `+7ms` while Treatment used 45% fewer tool calls and preserved runtime discipline. Accepted ledger: [`experiments/post-e1/T07_ACCEPTANCE.md`](../experiments/post-e1/T07_ACCEPTANCE.md).
- [ ] **T08 — Product-value decision** ([#31](https://github.com/Habib1001-m/hakim/issues/31)) — **ACTIVE**. Reconcile evidence, score Hakim against its designed purpose, classify residual risks, then record exactly one bounded promotion decision.

Completing an individual task does not change the phase-level stable-release HOLD.

## Designed outcome

Hakim should cause a coding agent to make the **smallest sufficient, coherent, safe change** after obtaining enough repository evidence to understand the task, while preserving real domain guards and validating the result with evidence proportional to the risk.

The intended working sequence is:

```text
inspect
  -> establish a runnable pre-change baseline when reasonably available
  -> stop inspecting once evidence is sufficient
  -> choose the smallest sufficient safe change
  -> preserve domain/security/privacy/integrity/accessibility/trust guards
  -> implement
  -> validate proportionally
  -> report only what the evidence supports
```

`Smallest` does not mean minimum line count. A slightly larger coherent change can be safer and more maintainable than a smaller but incomplete one.

## E1 truth preserved by this phase

### Positive signals

- Hakim activation produced an observable change in agent behavior.
- Repository inspection depth increased.
- Product-state handling improved in at least one concrete user-facing path.
- Saved-workspace UX was integrated into the product instead of delegated to a browser prompt.
- Test breadth and feature documentation increased modestly.

### Parity / not demonstrated

- Final basic functional correctness was parity in the accepted hidden evaluator.
- Dependency restraint was parity.
- Overall implementation change surface was approximately parity after operator-contamination correction.
- Universal architecture, robustness, or quality superiority was not demonstrated.

### Negative signals / development debt

- Elapsed execution time increased materially in the first pair.
- Hakim did not establish the runnable pre-mutation baseline as explicitly as the control.
- One simplification path lost a useful domain-level validity guard.
- More inspection and tool activity did not produce a higher basic functional score in E1.

These E1 findings remain historical truth. POST-E1 hardening does not rewrite them. T01-T07 add newer bounded evidence showing that several E1 failure modes were remediated and repeatedly observable on the tested POST-E1 set.

## Work sequence

### T01 — Pre-mutation baseline discipline

Make baseline establishment an explicit default when the repository offers a reasonably bounded validation command. When a full suite is disproportionately expensive, select a smaller representative baseline or record why no baseline was run.

Corrected E2 Run-002, E3 Run-001, and E4 Run-001 all produced Treatment traces with required skill invocation and a successful representative baseline before first mutation. That is accepted repeatability for the tested POST-E1 set, not a universal host claim.

### T02 — Evidence sufficiency / stop-inspecting discipline

Define a bounded stopping rule. Once the agent knows the relevant implementation path, local conventions/reuse candidates, material safety/domain guards, and a proportional validation surface, further exploration needs a concrete unresolved question.

T06 evidence showed the hardened Treatment could remain bounded without sacrificing functional completion. E3/E4 in particular avoided the task-management expansion seen in Control while using fewer total tool calls.

### T03 — Domain-guard preservation

Make it explicit that simplification must not silently remove validation, security, privacy, integrity, migration, rollback, accessibility, or user-trust guards that encode real product requirements.

### T04 — Outcome-oriented restraint

Reconcile Hakim's canonical language so `smallest safe change` means the smallest **sufficient and coherent** change, not the fewest lines or files.

### T05 — Behavioral regression coverage

Deterministic repository checks protect the canonical/projection contract for:

- pre-mutation baseline guidance;
- evidence-sufficiency stopping behavior;
- domain-guard preservation;
- dependency/abstraction restraint;
- evidence-bounded validation/completion claim semantics.

The runtime layer reads real host traces and determines whether required skill/baseline ordering occurred before mutation and whether bounded work paid unjustified task-management overhead. Corrected E2 plus E3/E4 produced Treatment runtime-checker PASS across the accepted T06 set.

### T06 — Repeated controlled experiments

The experiment contract was frozen in `experiments/post-e1/README.md` before POST-E1 execution.

The pre-registered scenario set was:

- **E2 — Bug repair / domain guard**: scanner-normalized rule-token prefix with hidden domain invariants.
- **E3 — Bounded refactor / reuse**: remove duplicated duration formatting by reusing the maintained repository helper without broad restructuring.
- **E4 — Feature work / coherent outcome**: add immutable preset removal while preserving the permanent default/active-preset invariants and public API documentation.

E2 Run-001 remains preserved as `INVALID_PAIR`; `experiments/post-e1/e2/AMENDMENT-001.md` corrected its evaluator defect without rescoring the invalid pair.

Accepted T06 evidence is frozen in [`experiments/post-e1/T06_ACCEPTANCE.md`](../experiments/post-e1/T06_ACCEPTANCE.md):

- corrected E2 Run-002: `TREATMENT_ADVANTAGE`, elapsed `+73.15%`, tool calls `+20.00%`;
- E3 Run-001: `TREATMENT_ADVANTAGE`, elapsed `-4.47%`, tool calls `-41.67%`;
- E4 Run-001: `TREATMENT_ADVANTAGE`, elapsed `+3.21%`, tool calls `-29.17%`;
- median elapsed overhead: `+3.21%` — PASS against the frozen `<=30%` gate;
- median tool-call delta: `-29.17%` — PASS against the frozen `<=25%` gate;
- accepted functional/correctness regression: none observed.

`POST_E1_T06_ACCEPTANCE = PASS`.

### T07 — Efficiency reconciliation

T07 is complete and frozen in [`experiments/post-e1/T07_ACCEPTANCE.md`](../experiments/post-e1/T07_ACCEPTANCE.md).

A deterministic zero-dependency timing analyzer was implemented prove-first and passed Public CI. Preserved T06 analysis showed that most of the absolute E2 Run-002 elapsed delta sat in residual/unattributed time, so its cause could not be assigned from the trace:

`T07_C_CLASSIFICATION = CAUSE_NOT_IDENTIFIABLE_FROM_CURRENT_EVIDENCE`

A fresh pre-frozen counterbalanced E2 replication then reused the same pinned behavior and corrected E2 task/evaluator with order `CONTROL -> TREATMENT`.

Replication result:

- Control elapsed `87.910s`;
- Treatment elapsed `87.917s`;
- Treatment elapsed delta approximately `+0.008%` / `+7ms`;
- Control tool calls `20` vs Treatment `11` (`-45%`);
- Control task bookkeeping `9` vs Treatment `0`;
- both conditions passed visible + hidden functional gates;
- Treatment retained skill-before-mutation and representative-baseline-before-mutation; Control did not establish the representative baseline before first mutation.

The original large E2 slowdown therefore did not reproduce under opposite order. This does not prove that order caused the original result; it means current evidence does not support treating the original debit as a reproducible Hakim runtime defect.

`T07_FINAL_DECISION = EFFICIENCY_RECONCILED_NO_CHANGE`.

No product behavior was changed in T07.

### T08 — Product-value decision

T08 is active in [#31](https://github.com/Habib1001-m/hakim/issues/31).

It must reconcile the accepted evidence, score Hakim against its designed purpose, classify residual risks, and record exactly one decision:

- `PROCEED_TO_BOUNDED_EXTERNAL_EVALUATION`
- `REMEDIATE_AND_REPEAT`
- `HOLD_PRODUCT`

Any `PROCEED` decision means a small, pre-registered external evaluator campaign only. It does not authorize stable release, broad recruitment, registry publication, or marketing claims.

## Acceptance gate

POST-E1 closes only when all of the following are true:

1. Hakim explicitly establishes a pre-change baseline when reasonably available, or records why not.
2. Repository inspection has a bounded evidence-sufficiency stopping rule.
3. Real domain guards are protected from accidental removal in the name of simplification.
4. Canonical behavior and maintained host projections remain semantically aligned.
5. New behavioral contracts have deterministic regression coverage where practical, and runtime claims are backed by real host traces rather than semantic checks alone.
6. Repeated controlled experiments show reproducible positive value rather than one-pair noise.
7. Correctness and safety do not regress relative to control.
8. Execution overhead is measured and explicitly judged against the value obtained.
9. User-facing preference claims come from blind evaluation rather than maintainer preference.
10. A new explicit T08 product decision is recorded before external evaluator recruitment can resume.

## Public evidence boundaries

- Do not publish private provider/model configuration as part of experiment identity or product claims.
- Do not erase failed runs, evaluator defects, negative findings, contamination corrections, or outliers from the evidence history.
- Do not turn a single paired experiment into a universal percentage claim.
- Do not optimize to synthetic scores at the expense of product truth.
- Do not add speculative architecture merely to make Hakim appear more sophisticated.

## Release boundary

Opening or completing tasks in this phase does **not** authorize:

- stable `1.0.0`;
- a release tag or GitHub Release;
- registry publication;
- central marketplace/directory claims;
- broad external evaluator recruitment.

Those remain explicit later decisions backed by the evidence produced here.
