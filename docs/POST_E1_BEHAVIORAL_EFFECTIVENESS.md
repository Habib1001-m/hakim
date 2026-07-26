# POST-E1 Behavioral Effectiveness & Efficiency Hardening

Status: **ACTIVE / RELEASE-BLOCKING**  
Tracking issue: [#22](https://github.com/Habib1001-m/hakim/issues/22)

## Why this phase exists

Hakim has reached a point where installation, native-host integration, lifecycle safety, documentation truth, and current-host acceptance are not enough to justify promotion.

The first controlled production-like A/B experiment produced a more important question: **does Hakim make the engineering process materially better, not merely different?**

The initial pair demonstrated a real behavioral delta when Hakim was enabled, including deeper repository inspection, stronger attention to product state and UX, somewhat broader test/documentation investment, and materially higher elapsed time. Basic functional completion and overall change surface were approximately parity. The control also established a pre-mutation validation baseline more explicitly.

Those findings are useful, but one pair is not a general benchmark and does not authorize a product-quality or performance claim.

## Product decision

Hakim remains **HOLD** for stable `1.0.0` and for broad external evaluator recruitment.

Promotion now requires evidence that Hakim improves the engineering process and/or product outcome without unacceptable regression in correctness, safety, restraint, maintainability, or execution efficiency.

This phase intentionally adds no new product surface unless evidence proves that surface is required.

## Current taskboard

- [x] **T01 — Pre-mutation baseline discipline** ([#24](https://github.com/Habib1001-m/hakim/issues/24)) — contract implementation is CI-protected; the Claude runtime-salience remediation then produced successful skill-before-mutation and representative-baseline-before-mutation behavior in corrected E2 plus E3/E4. Runtime repeatability is accepted for the tested POST-E1 set.
- [x] **T02 — Evidence sufficiency / stop-inspecting discipline** ([#25](https://github.com/Habib1001-m/hakim/issues/25)) — bounded stopping rule is projected across maintained hosts; repeated T06 evidence showed the hardened Treatment avoided the large bounded-task bookkeeping inflation seen in Control on E3/E4 while preserving task completion.
- [x] **T03 — Domain-guard preservation** ([#26](https://github.com/Habib1001-m/hakim/issues/26)) — prove-first regression captured; domain invariants require evidence before guard removal; accepted T06 scenarios preserved their seeded/existing functional and integrity boundaries.
- [x] **T04 — Outcome-oriented restraint** ([#27](https://github.com/Habib1001-m/hakim/issues/27)) — smallest means sufficient/coherent/safe rather than fewest LOC/files; T06 accepted Treatment outcomes without treating smaller diffs as an automatic quality win.
- [x] **T05 — Behavioral regression coverage** ([#28](https://github.com/Habib1001-m/hakim/issues/28)) — semantic contract coverage plus real-trace runtime checking are implemented and CI-protected; corrected E2, E3, and E4 all produced Treatment runtime-checker PASS.
- [x] **T06 — Repeated controlled experiments** ([#29](https://github.com/Habib1001-m/hakim/issues/29)) — **ACCEPTED / COMPLETE**. Corrected E2 plus E3/E4 produced 3/3 `TREATMENT_ADVANTAGE`, no accepted functional regression, median elapsed overhead `+3.21%`, and median tool-call delta `-29.17%`. The E2 `+73.15%` elapsed result remains a visible outlier for T07. Accepted ledger: [`experiments/post-e1/T06_ACCEPTANCE.md`](../experiments/post-e1/T06_ACCEPTANCE.md).
- [ ] **T07 — Efficiency reconciliation** ([#30](https://github.com/Habib1001-m/hakim/issues/30)) — **ACTIVE**. Freeze T06 efficiency truth, diagnose the E2 latency outlier with deterministic trace/timing evidence, replicate only if causal confidence requires it, and remediate only if a concrete avoidable Hakim cost is demonstrated.
- [ ] **T08 — Product-value decision**.

Completing an individual task does not change the phase-level release or evaluator HOLD.

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

These E1 findings remain historical truth. POST-E1 hardening does not rewrite them; T06 adds newer bounded evidence showing that the runtime remediation can reverse several of those failure modes on the tested task set.

## Work sequence

### T01 — Pre-mutation baseline discipline

Make baseline establishment an explicit default when the repository offers a reasonably bounded validation command. When a full suite is disproportionately expensive, select a smaller representative baseline or record why no baseline was run.

E2 Run-001 established an important distinction: the canonical/projection rule can be green while the runtime behavior still fails. T01 therefore requires both contract implementation and host-runtime acceptance. For Claude Code, core coding behavior must be salient before the first model decision rather than depending solely on optional skill-description matching.

Corrected E2 Run-002, E3 Run-001, and E4 Run-001 all produced Treatment traces with required skill invocation and a successful representative baseline before first mutation. That is accepted repeatability for the tested POST-E1 set, not a universal host/model claim.

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

That semantic layer is necessary but not sufficient. Runtime acceptance tooling also reads real host traces and determines whether the required skill/baseline ordering occurred before mutation and whether bounded work paid unjustified task-management overhead. CI proves the checker semantics; sealed host runs prove the runtime behavior. Corrected E2 plus E3/E4 produced Treatment runtime-checker PASS across the accepted T06 set.

### T06 — Repeated controlled experiments

The experiment contract was frozen in `experiments/post-e1/README.md` before POST-E1 execution.

The pre-registered scenario set was:

- **E2 — Bug repair / domain guard**: scanner-normalized rule-token prefix with hidden domain invariants.
- **E3 — Bounded refactor / reuse**: remove duplicated duration formatting by reusing the maintained repository helper without broad restructuring.
- **E4 — Feature work / coherent outcome**: add immutable preset removal while preserving the permanent default/active-preset invariants and public API documentation.

E2 Run-001 remains preserved as `INVALID_PAIR`: the frozen hidden evaluator incorrectly added arbitrary mixed-case prefix acceptance beyond the task's reported `RULE:` scanner normalization. `experiments/post-e1/e2/AMENDMENT-001.md` corrected the evaluator without rescoring Run-001.

The same invalid run independently exposed a real runtime gap: Treatment mutated before a representative baseline because the detailed skill had not been loaded before the first mutation decision. The minimum runtime-salience remediation was implemented and checked with real structured traces before corrected E2 execution continued.

Accepted T06 evidence is frozen in [`experiments/post-e1/T06_ACCEPTANCE.md`](../experiments/post-e1/T06_ACCEPTANCE.md):

- corrected E2 Run-002: `TREATMENT_ADVANTAGE`, elapsed `+73.15%`, tool calls `+20.00%`;
- E3 Run-001: `TREATMENT_ADVANTAGE`, elapsed `-4.47%`, tool calls `-41.67%`;
- E4 Run-001: `TREATMENT_ADVANTAGE`, elapsed `+3.21%`, tool calls `-29.17%`;
- median elapsed overhead: `+3.21%` — PASS against the frozen `<=30%` gate;
- median tool-call delta: `-29.17%` — PASS against the frozen `<=25%` gate;
- accepted functional/correctness regression: none observed.

`POST_E1_T06_ACCEPTANCE = PASS`.

The E2 elapsed outlier remains explicit evidence debt. T06 completion does not explain it or authorize promotion.

### T07 — Efficiency reconciliation

T07 is tracked in [#30](https://github.com/Habib1001-m/hakim/issues/30).

The first rule is preservation: no product-behavior change is authorized merely because E2 was slow. T07 must first freeze the T06 ledger and use deterministic zero-dependency trace/timing analysis to classify what the preserved evidence can and cannot explain.

T07 then follows this order:

1. freeze the accepted T06 efficiency matrix;
2. analyze preserved E2/E3/E4 traces for tool ordering and observable timing boundaries;
3. classify the E2 `+73.15%` outlier without unsupported causal attribution;
4. replicate only if the existing evidence cannot distinguish systematic overhead from run variance;
5. remediate only if a concrete avoidable Hakim cost is demonstrated;
6. preserve skill-before-mutation, representative baseline-before-mutation, zero/default bounded-task bookkeeping, stop-inspecting, guard-preservation, and outcome-restraint behavior through any optimization.

Allowed final T07 decisions are:

- `EFFICIENCY_RECONCILED_NO_CHANGE`
- `EFFICIENCY_REMEDIATED_AND_VALIDATED`
- `EFFICIENCY_HOLD_FOR_MORE_EVIDENCE`

### T08 — Product-value decision

Record exactly one post-phase decision:

- `PROCEED_TO_BOUNDED_EXTERNAL_EVALUATION`
- `REMEDIATE_AND_REPEAT`
- `HOLD_PRODUCT`

Stable release remains separately authorized even if bounded external evaluation is approved.

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
10. A new explicit product decision is recorded before external evaluator recruitment can resume.

## Public evidence boundaries

- Do not publish private provider/model configuration as part of experiment identity or product claims.
- Do not erase failed runs, evaluator defects, negative findings, or contamination corrections from the evidence history.
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
