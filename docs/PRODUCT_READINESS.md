# Hakim Product Readiness

This document is the maintained public product-readiness authority for Hakim. It separates frozen prerelease evidence from unreleased development and from release authorization.

## Current truth

| Dimension | State |
|---|---|
| Latest frozen prerelease | `1.0.0-beta.4` at `5d00039479f2f11b7fe30ccf2385e70ce24553c3` / `evidence/beta4-r31-5d00039` |
| Unreleased development | R3.2 operational-presence work accepted through F04 |
| Canonical repository gate | `npm test` |
| Next development gate | F05 — Objective Completion Truth |
| Current frozen-prerelease native acceptance | `HOLD_FOR_LIVE_HOST_EVIDENCE` |
| External evaluator recruitment | `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION` |
| Stable `1.0.0` | `NOT_AUTHORIZED` |

The frozen beta.4 candidate and current `main` development are intentionally different identities. R3.2 may land on `main` without becoming beta.5. A new prerelease identity is cut only when the next candidate is deliberately frozen.

Accepted evidence never moves with a branch or version label. Beta.1, beta.2, beta.3, beta.4, and R3.2 development observations remain bounded to the exact immutable source identity on which they were recorded.

## Readiness dimensions

Keep these claims independent:

| Dimension | Required evidence | What it does **not** prove |
|---|---|---|
| Repository integrity | Canonical `npm test` on the exact head | Live-host behavior or product value |
| Release artifacts | Reproducible skill ZIP + CycloneDX SBOM + checksums + manifest | Publication, signing, or host acceptance |
| Native host acceptance | Real install/start/invocation journey on the exact candidate | Behavioral effectiveness across tasks |
| Behavioral confidence | Bounded host/task evidence with preserved correctness | Universal model or host improvement |
| Production-like dogfood | Realistic internal task evidence with measured friction | Independent developer preference or adoption |
| External developer value | Separately authorized real-user evaluation | Stable-release authorization |
| Stable release | Required gates plus explicit operator authorization | SLA, LTS, or enterprise certification |

## R3.2 development checkpoint

R3.2 exists because beta.2–beta.4 showed that stronger policy text and explicit checkpoints did not reliably guarantee timely activation or truthful final reporting on every host/task.

The development principle is:

> **Free reasoning. Safe action. Evidence-bound claims.**

Accepted operational-presence slices:

- [x] **F01 — Silent parent-session presence.** Copilot loads Hakim automatically without repository instructions or an activation prompt.
- [x] **F02 — Bounded mode state.** `lite`, `ultra`, and `off` persist only in plugin-owned state; default `full` is stateless.
- [x] **F03 — Native mode-control lifecycle.** `/hakim/hakim off → ultra → full` passed current-turn semantics, persistence, reset, and repository-isolation checks on Copilot CLI 1.0.75.
- [x] **F04 — Subagent continuity.** A pre-remediation Explore probe returned `MODE=NONE`; the evidence-justified `subagentStart` reuse of the existing presence authority then produced `MODE=ultra` with a clean target repository.
- [ ] **F05 — Objective Completion Truth.** Test a narrow late-bound truth mechanism for consequential completion claims without command blocking, prose policing, or reasoning-path control.
- [ ] **F06 — Deterministic operational regressions.** Freeze the accepted operational contracts before candidate promotion.
- [ ] **F07 — Production-like D01 rerun.** Cut a new prerelease identity first, then rerun the original production-like task without explicit Hakim activation.

No additional lifecycle hook is justified merely for symmetry. New hooks require a concrete observed host gap.

See [`docs/OPERATIONAL_PRESENCE.md`](OPERATIONAL_PRESENCE.md) for the architecture and bounded evidence summary.

## Native-host evidence rule

The machine-readable public authority is [`conformance/native-host-acceptance.json`](../conformance/native-host-acceptance.json).

A host reaches `PASS` only when a real install/start/invocation journey is accepted for the exact product identity being claimed. Repository CI, smoke tests, projection checks, or live evidence on a different candidate do not promote that status.

R3.2 Copilot development evidence proves the bounded operational behavior it observed. It is not automatically a full beta.4 host-acceptance promotion and it will not be relabeled as beta.5 evidence before a beta.5 candidate exists.

## Behavioral and dogfood protocol

For any future behavioral claim:

1. Pin the exact Hakim source identity, host version, task intent, and repository/fixture base.
2. Discover the smallest representative baseline read-only by default.
3. Treat dependency installation, editable installs, lockfile/package-metadata generation, local bootstrap/environment creation, code generation, formatter writes, and similar side effects as mutations rather than harmless discovery.
4. Preserve material domain, security, privacy, integrity, accessibility, migration, and trust guards.
5. For decision-logic transformations, test decision-relevant boundary states rather than inferring semantic equivalence from broad-suite green alone.
6. Keep `NO_CHANGE` claims bounded to inspected evidence.
7. Reconcile completion claims with observed repository/setup state before reporting them as facts.
8. Report host-specific results separately; do not pool them into universal effectiveness claims.

Internal dogfood may establish bounded product-learning evidence. It does not establish independent developer adoption, retention, ROI, or preference.

## Promotion gate for the next prerelease

Before a new prerelease candidate is recommended for broader evidence collection:

- [ ] F05 and F06 are accepted on development `main`.
- [ ] Distributed runtime/policy bytes receive a new prerelease identity rather than reusing beta.4.
- [ ] The exact candidate head passes `npm test` and release-artifact verification.
- [ ] Active documentation, package metadata, host projections, and version authorities agree on that identity.
- [ ] An immutable candidate ref is frozen.
- [ ] Required candidate-specific live-host journeys are executed for the hosts the recommendation claims.
- [ ] Production-like D01 rerun completes without unresolved material correctness, truth, UX, or repository-purity findings.

Only after those gates may the operator decide whether another internal evidence step, an external evaluator campaign, or a stable-release path is justified.

## Decision states

Use explicit decisions:

- `GO_FOR_BOUNDED_NEXT_EVIDENCE_STEP` — current development is coherent enough for the named next learning step.
- `HOLD_FOR_PRODUCT_REMEDIATION` — a material correctness, UX, safety, or truth problem remains.
- `HOLD_FOR_LIVE_HOST_EVIDENCE` — a frozen candidate is coherent but required candidate-specific host evidence is incomplete.

None of these states authorizes stable release, external evaluator recruitment, registry publication, central marketplace promotion, SLA, or LTS by itself.
