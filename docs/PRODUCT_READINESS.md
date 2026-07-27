# Hakim Product Readiness

This document defines the maintained product-readiness gate for Hakim. It is not a release authorization record and it does not start an external evaluator campaign.

## Current candidate

- Product identity: `1.0.0-beta.4`
- Repository gate: `npm test`
- Current native live-host acceptance: `HOLD_FOR_LIVE_HOST_EVIDENCE`
- Current behavioral confidence: `HOLD_FOR_R3_1_VALIDATION`
- External evaluator recruitment: `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION`
- Stable `1.0.0`: `NOT_AUTHORIZED`

The beta.4 observable-checkpoint candidate does not inherit live-host or behavioral `PASS` from beta.1/beta.2/beta.3. Older accepted evidence and failed behavioral observations remain bounded to those exact immutable candidates.

## Readiness dimensions

Keep these dimensions independent:

| Dimension | Required evidence | Current meaning |
|---|---|---|
| Repository integrity | Canonical `npm test` on the exact candidate | Structural/product contracts only |
| Release artifacts | Reproducible skill ZIP + CycloneDX SBOM + checksums + manifest | Artifact integrity and inventory only |
| Native host acceptance | Real install/start/invocation journey for each maintained host on the exact candidate | Host-path evidence only |
| Behavioral confidence | Bounded treatment behavior observed on the host/task being claimed | No cross-host generalization by inference |
| Production-like dogfood | Realistic repository tasks with preserved correctness and measured friction | Internal product-learning evidence only |
| External developer value | Separately authorized real-user evaluation | Not established by internal dogfood |
| Stable release | All required gates plus explicit operator authorization | Never inferred from CI or acceptance alone |

## Cross-host behavioral confidence protocol

This protocol is internal and bounded. It does not recruit external evaluators.

For each host claimed as behaviorally validated:

1. Pin the exact Hakim candidate commit and host version.
2. Use the same frozen task intent and repository fixture where host capabilities allow a fair comparison.
3. Establish the repository's smallest representative pre-mutation baseline. Baseline discovery must remain read-only unless setup mutation is explicitly necessary and justified.
4. Before the first product edit in a runnable Git repository, capture the observable baseline checkpoint: `BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, and `PRE_EDIT_GIT_STATUS`.
5. Record whether Hakim activation occurred before task mutation according to that host's native activation contract.
6. For boolean/control-flow/validator/permission/guard transformations, require `SEMANTIC_CHANGE_CHECK` backed by decision-relevant boundary-state comparison or a targeted probe/test; existing-suite green alone is insufficient evidence of semantic equivalence.
7. Record material read/search, task-bookkeeping, mutation, and validation events using the strongest structured trace the host exposes without collecting private prompts or customer source.
8. Require visible and hidden correctness gates appropriate to the fixture.
9. Before completion, capture `FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, and `UNRELATED_MUTATIONS` and reconcile those observations with the completion report.
10. Check the permanent runtime invariants with `scripts/check_runtime_trace.mjs` when the trace format can be normalized safely.
11. Keep `NO_CHANGE` claims bounded to the inspected scope; lack of a discovered change is not global proof of minimum complexity.
12. Report host-specific results separately. Do not pool them into a universal effectiveness claim merely because all hosts install successfully.

A host may remain installation-accepted while behavioral confidence for that host is `NOT_ESTABLISHED` or `HOLD_FOR_REMEDIATION`.

## Production-like dogfood protocol

Dogfood must use deliberately selected repositories or sanitized fixtures that are materially messier than the controlled experiment fixtures. Do not use private customer code in public evidence.

For each dogfood task, record:

- immutable Hakim candidate identity;
- host/version and repository/fixture identity;
- task intent and affected surface;
- pre-mutation baseline used or the explicit reason no baseline was safe/reasonable;
- observable pre-edit checkpoint (`BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, `PRE_EDIT_GIT_STATUS`);
- any setup mutation separately from product mutation;
- first task mutation and validation sequence;
- `SEMANTIC_CHANGE_CHECK` when the proposed change transforms boolean/control-flow/validator/permission/guard behavior;
- whether a real domain/security/privacy/integrity/accessibility/trust guard was preserved;
- whether inspection stopped once the decision-relevant evidence was sufficient;
- final visible/hidden correctness result where available;
- observed final-state checkpoint (`FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, `UNRELATED_MUTATIONS`);
- elapsed time and tool-call counts only when measured consistently;
- qualitative ceremony/friction notes separated from correctness claims.

The dogfood result must answer three product questions without overclaiming:

1. Did Hakim preserve or improve the bounded engineering outcome without accepted correctness regression?
2. Did it avoid pathological over-inspection, baseline pollution, or unnecessary task ceremony on a naturally messy codebase?
3. Was the additional process friction proportionate to the engineering benefit on that task?

Internal dogfood does not establish independent developer preference, adoption, retention, or ROI.

## Beta.4 R3.1 validation gates

Beta.3 remains immutable historical evidence. Its Copilot D01 rerun improved activation ordering but still performed setup mutations before a clean repository-native baseline, left `egg-info`/`uv.lock` artifacts while claiming none, and introduced a validator semantic regression that the existing 11 focused and 126 full tests did not detect. Beta.4 exists specifically to make those three evidence checkpoints observable.

Before beta.4 is considered technically coherent for the next bounded evidence step:

- [ ] Canonical repository gate passes on the exact final beta.4 candidate head.
- [ ] Release ZIP, SBOM, checksums, and manifest verify on that same head.
- [ ] Active version/documentation truth matches beta.4 and beta.1/beta.2/beta.3 evidence remains historically bounded.
- [ ] Exact persisted beta.2 and beta.3 OpenCode manifests remain the only explicitly trusted prior managed authorities for the beta.4 lifecycle.
- [ ] A new immutable beta.4 evidence ref is frozen without moving earlier refs.
- [ ] GitHub Copilot reruns the exact frozen D01 task/base with Hakim active before repository-affecting tool use.
- [ ] Copilot records the observable baseline checkpoint before the first product edit and does not use editable/dependency installation, lockfile/package-metadata generation, or repository-local bootstrap merely to discover the baseline.
- [ ] If Copilot proposes a boolean/control-flow/validator/permission/guard transformation, `SEMANTIC_CHANGE_CHECK` covers decision-relevant boundary states or a targeted regression/probe before semantic-equivalence claims are made.
- [ ] Copilot records final Git/artifact/unrelated-mutation state and the completion report matches those observations.
- [ ] Focused and full correctness gates remain green and any targeted semantic probe remains behavior-preserving.
- [ ] OpenCode remains paused until the Copilot beta.4 result materially improves or exposes a new failure mode worth cross-host replication.
- [ ] Any material host-specific failure is reconciled before D02 or external evidence expansion.

Codex remains quota-deferred until operator quota is available. Claude rerun is required only if the final remediation materially changes its effective runtime/projection contract enough that older behavioral evidence cannot remain historical-only context for the remediation decision.

## Promotion gates beyond remediation

Before a later public-beta acceptance or release recommendation is promoted:

- [ ] Current-path live-host evidence is accepted for every host the recommendation claims as accepted.
- [ ] Bounded cross-host behavioral checks required by the intended claim are complete.
- [ ] Production-like internal dogfood is complete with no unresolved material product finding.
- [ ] Active documentation matches the structured authorities.
- [ ] Stable-release prerequisites in `SUPPORT.md` and `VERSIONING.md` are satisfied before any stable recommendation.

## Decision rule

The final product-readiness decision must be explicit:

- `GO_FOR_BOUNDED_NEXT_EVIDENCE_STEP` when the candidate is technically coherent and the next learning step is justified;
- `HOLD_FOR_PRODUCT_REMEDIATION` when a material product/UX/correctness/safety finding remains;
- `HOLD_FOR_LIVE_HOST_EVIDENCE` when repository truth is coherent but current candidate host acceptance is incomplete.

None of these states authorizes stable release, external evaluator recruitment, registry publication, or central marketplace promotion by itself.
