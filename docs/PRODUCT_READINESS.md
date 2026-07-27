# Hakim Product Readiness

This document defines the maintained product-readiness gate for Hakim. It is not a release authorization record and it does not start an external evaluator campaign.

## Current candidate

- Product identity: `1.0.0-beta.2`
- Repository gate: `npm test`
- Current native live-host acceptance: `HOLD_FOR_LIVE_HOST_EVIDENCE`
- External evaluator recruitment: `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION`
- Stable `1.0.0`: `NOT_AUTHORIZED`

The current candidate deliberately does not inherit beta.1 live-host `PASS` state. Historical accepted evidence remains under `conformance/history/`.

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
3. Establish the repository's smallest representative pre-mutation baseline.
4. Record whether Hakim activation occurred before the first mutation.
5. Record material read/search, task-bookkeeping, mutation, and validation events using the strongest structured trace the host exposes without collecting private prompts or customer source.
6. Require visible and hidden correctness gates appropriate to the fixture.
7. Check the permanent runtime invariants with `scripts/check_runtime_trace.mjs` when the trace format can be normalized safely.
8. Report host-specific results separately. Do not pool them into a universal effectiveness claim merely because all hosts install successfully.

A host may remain installation-accepted while behavioral confidence for that host is `NOT_ESTABLISHED`.

## Production-like dogfood protocol

Dogfood must use deliberately selected repositories or sanitized fixtures that are materially messier than the controlled experiment fixtures. Do not use private customer code in public evidence.

For each dogfood task, record:

- immutable Hakim candidate identity;
- host/version and repository/fixture identity;
- task intent and affected surface;
- pre-mutation baseline used or the explicit reason no baseline was safe/reasonable;
- first mutation and validation sequence;
- whether a real domain/security/privacy/integrity/accessibility/trust guard was preserved;
- whether inspection stopped once the decision-relevant evidence was sufficient;
- final visible/hidden correctness result where available;
- elapsed time and tool-call counts only when measured consistently;
- qualitative ceremony/friction notes separated from correctness claims.

The dogfood result must answer three product questions without overclaiming:

1. Did Hakim preserve or improve the bounded engineering outcome without accepted correctness regression?
2. Did it avoid pathological over-inspection or unnecessary task ceremony on a naturally messy codebase?
3. Was the additional process friction proportionate to the engineering benefit on that task?

Internal dogfood does not establish independent developer preference, adoption, retention, or ROI.

## Promotion gates for beta.2

Before beta.2 current-path acceptance or release recommendation is promoted:

- [ ] Canonical repository gate passes on the exact final candidate head.
- [ ] Release ZIP, SBOM, checksums, and manifest verify on that same head.
- [ ] Codex current-path live-host evidence is accepted for beta.2.
- [ ] Claude Code current-path live-host evidence is accepted for beta.2.
- [ ] GitHub Copilot current-path live-host evidence is accepted for beta.2.
- [ ] OpenCode current-path live-host evidence is accepted for beta.2.
- [ ] Bounded cross-host behavioral checks required by the intended claim are complete.
- [ ] Production-like internal dogfood is complete with no unresolved P0/P1 finding.
- [ ] Active documentation matches the structured authorities.
- [ ] Stable-release prerequisites in `SUPPORT.md` and `VERSIONING.md` are satisfied before any stable recommendation.

## Decision rule

The final product-readiness decision must be explicit:

- `GO_FOR_BOUNDED_NEXT_EVIDENCE_STEP` when the candidate is technically coherent and the next learning step is justified;
- `HOLD_FOR_PRODUCT_REMEDIATION` when a material product/UX/correctness/safety finding remains;
- `HOLD_FOR_LIVE_HOST_EVIDENCE` when repository truth is coherent but current candidate host acceptance is incomplete.

None of these states authorizes stable release, external evaluator recruitment, registry publication, or central marketplace promotion by itself.
