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

- [x] **T01 — Pre-mutation baseline discipline** ([#24](https://github.com/Habib1001-m/hakim/issues/24)) — prove-first CI failure captured, canonical/projections reconciled, exact-head Public CI green.
- [x] **T02 — Evidence sufficiency / stop-inspecting discipline** ([#25](https://github.com/Habib1001-m/hakim/issues/25)) — prove-first CI failure captured, bounded stopping rule projected across maintained hosts, exact-head Public CI green.
- [x] **T03 — Domain-guard preservation** ([#26](https://github.com/Habib1001-m/hakim/issues/26)) — prove-first regression captured; domain invariants now require evidence before guard removal; exact-head Public CI green.
- [x] **T04 — Outcome-oriented restraint** ([#27](https://github.com/Habib1001-m/hakim/issues/27)) — smallest now means sufficient/coherent/safe rather than fewest LOC/files; exact-head Public CI green.
- [x] **T05 — Behavioral regression coverage** ([#28](https://github.com/Habib1001-m/hakim/issues/28)) — dedicated POST-E1 semantic contract is enforced in Public CI; exact-head gate green.
- [ ] **T06 — Repeated controlled experiments** ([#29](https://github.com/Habib1001-m/hakim/issues/29)) — **ACTIVE**. E2/E3/E4 criteria, prompts, hidden evaluators, fixtures, and paired materializers are frozen and CI-green before agent execution.
- [ ] **T07 — Efficiency reconciliation**.
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

## Work sequence

### T01 — Pre-mutation baseline discipline

Make baseline establishment an explicit default when the repository offers a reasonably bounded validation command. When a full suite is disproportionately expensive, select a smaller representative baseline or record why no baseline was run.

### T02 — Evidence sufficiency / stop-inspecting discipline

Define a bounded stopping rule. Once the agent knows the relevant implementation path, local conventions, safety constraints, and available validation surface, further exploration needs a concrete unresolved question.

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
- evidence-bounded completion claims.

### T06 — Repeated controlled experiments

The experiment contract is frozen in `experiments/post-e1/README.md` before any POST-E1 agent execution.

The pre-registered scenario set is:

- **E2 — Bug repair / domain guard**: scanner-normalized rule-token prefix with hidden domain invariants.
- **E3 — Bounded refactor / reuse**: remove duplicated duration formatting by reusing the maintained repository helper without broad restructuring.
- **E4 — Feature work / coherent outcome**: add immutable preset removal while preserving the permanent default/active-preset invariants and public API documentation.

For all three scenarios, frozen fixture tests and paired materializers are enforced in Public CI. Each materializer creates Control and Treatment from one immutable baseline commit, keeps task/evaluator outside the candidate workspace, and proves the intended seeded condition before execution.

Phase-level T06 acceptance was frozen before E2 execution, including correctness non-regression, baseline/guard requirements, no unjustified surface, positive value in at least 2 of 3 scenarios, median elapsed overhead <=30%, and median tool-call overhead <=25%.

### T07 — Efficiency reconciliation

Measure whether T01-T05 reduce avoidable latency/tool churn while preserving the positive behavioral signals. Efficiency optimization must not weaken correctness or evidence boundaries.

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
5. New behavioral contracts have deterministic regression coverage where practical.
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
