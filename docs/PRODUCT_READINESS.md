# Hakim Product Readiness

This document is the maintained public product-readiness authority for Hakim. It separates frozen prerelease evidence, moving unreleased development, and release authorization.

## Current truth

| Dimension | State |
|---|---|
| Latest frozen prerelease | `1.0.0-beta.4` at exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3` / `evidence/beta4-r31-5d00039` |
| Moving `main` development | `1.0.0-beta.4.post1`; R3.2 operational-presence work accepted through F04; not a frozen candidate and not evidence-eligible |
| Machine distribution authority | `conformance/distribution-identity.json` |
| Canonical repository gate | `npm test` |
| Immediate repository gate | P0 — Truthful Immutable Distribution Identity |
| Next feature gate after P0 | F05 — Objective Completion Truth |
| Frozen beta.4 native acceptance | `HOLD_FOR_LIVE_HOST_EVIDENCE` |
| Current development native acceptance | `HOLD_FOR_LIVE_HOST_EVIDENCE`; development-only |
| External evaluator recruitment | `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION` |
| Stable `1.0.0` | `NOT_AUTHORIZED` |

Frozen beta.4 and moving `main` are separate identities. Normal frozen-product installation must resolve the exact beta.4 source commit. Any explicit `main` observation must record its exact 40-character commit and remains development-only.

Accepted evidence never moves with a branch, version label, or marketplace name. Beta.1, beta.2, beta.3, beta.4, and R3.2 development observations remain bounded to the immutable source identity on which they were recorded.

## Readiness dimensions

Keep these claims independent:

| Dimension | Required evidence | What it does **not** prove |
|---|---|---|
| Repository integrity | Canonical `npm test` on the exact head | Live-host behavior or product value |
| Distribution identity | Executable parity between documented install source, embedded version, frozen ref, and source SHA | Host acceptance or release authorization |
| Release artifacts | Reproducible skill ZIP + CycloneDX SBOM + checksums + manifest | Publication, signing, or host acceptance |
| Native host acceptance | Real install/start/invocation journey on the exact candidate | Behavioral effectiveness across tasks |
| Behavioral confidence | Bounded host/task evidence with preserved correctness | Universal model or host improvement |
| Production-like dogfood | Realistic internal task evidence with measured friction | Independent developer preference or adoption |
| External developer value | Separately authorized real-user evaluation | Stable-release authorization |
| Stable release | Required gates plus explicit operator authorization | SLA, LTS, or enterprise certification |

## P0 — Truthful Immutable Distribution Identity

P0 is the first safe repository step before F05.

Required invariants:

- [ ] Normal Codex, Claude Code, GitHub Copilot CLI, and OpenCode frozen-beta installation routes resolve `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.
- [ ] Moving `main` metadata reports `1.0.0-beta.4.post1` and channel `unreleased-development`.
- [ ] Moving `main` is explicitly not a frozen candidate and not eligible for release, promotion, benchmark, external-evaluator, or candidate-specific acceptance evidence.
- [ ] `conformance/distribution-identity.json` is the single machine-readable mapping authority.
- [ ] Deterministic tests fail on unpinned normal routes, version mismatch, frozen ref/SHA mismatch, or frozen/development identity collapse.
- [ ] The exact P0 PR head passes `npm test` before merge.

P0 does not cut beta.5, collect live-host evidence, start F05, publish a package, or authorize promotion.

## R3.2 development checkpoint

R3.2 exists because beta.2–beta.4 showed that stronger policy text and explicit checkpoints did not reliably guarantee timely activation or truthful final reporting on every host/task.

The development principle is:

> **Free reasoning. Safe action. Evidence-bound claims.**

Accepted operational-presence slices:

- [x] **F01 — Silent parent-session presence.** Copilot loads Hakim automatically without repository instructions or an activation prompt.
- [x] **F02 — Bounded mode state.** `lite`, `ultra`, and `off` persist only in plugin-owned state; default `full` is stateless.
- [x] **F03 — Native mode-control lifecycle.** `/hakim/hakim off → ultra → full` passed current-turn semantics, persistence, reset, and repository-isolation checks on Copilot CLI 1.0.75.
- [x] **F04 — Subagent continuity.** A pre-remediation Explore probe returned `MODE=NONE`; the evidence-justified `subagentStart` reuse of the existing presence authority then produced `MODE=ultra` with a clean target repository.
- [ ] **P0 — Truthful Immutable Distribution Identity.** Complete the transport/product-identity reconciliation before feature work continues.
- [ ] **F05 — Objective Completion Truth.** Test a narrow late-bound truth mechanism for consequential completion claims without command blocking, prose policing, or reasoning-path control.
- [ ] **F06 — Deterministic operational regressions.** Freeze the accepted operational contracts before candidate promotion.
- [ ] **F07 — Production-like D01 rerun.** Cut a new prerelease identity first, then rerun the original production-like task without explicit Hakim activation.

No additional lifecycle hook is justified merely for symmetry. New hooks require a concrete observed host gap.

See [`docs/OPERATIONAL_PRESENCE.md`](OPERATIONAL_PRESENCE.md) for the architecture and bounded evidence summary.

## Native-host evidence rule

The current development projection is [`conformance/native-host-acceptance.json`](../conformance/native-host-acceptance.json). The frozen/development mapping is [`conformance/distribution-identity.json`](../conformance/distribution-identity.json).

A host reaches `PASS` only when a real install/start/invocation journey is accepted for the exact product identity and immutable source being claimed. Repository CI, smoke tests, projection checks, or live evidence on a different source do not promote that status.

R3.2 Copilot development evidence proves only the bounded operational behavior it observed. It is not full beta.4 host acceptance and will not be relabeled as beta.5 evidence before a beta.5 candidate exists.

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

- [ ] P0 is closed and its exact final head passes the canonical gate.
- [ ] F05 and F06 are accepted on development `main`.
- [ ] Distributed runtime/policy bytes receive a new prerelease identity rather than reusing beta.4 or the development identity.
- [ ] The exact candidate head passes `npm test` and release-artifact verification.
- [ ] Active documentation, package metadata, host projections, and version authorities agree on that identity.
- [ ] An immutable candidate ref and source SHA are frozen.
- [ ] Required candidate-specific live-host journeys are executed for the hosts the recommendation claims.
- [ ] Production-like D01 rerun completes without unresolved material correctness, truth, UX, or repository-purity findings.

Only after those gates may the operator decide whether another internal evidence step, an external evaluator campaign, or a stable-release path is justified.

## Decision states

Use explicit decisions:

- `GO_FOR_BOUNDED_NEXT_EVIDENCE_STEP` — current development is coherent enough for the named next learning step.
- `HOLD_FOR_PRODUCT_REMEDIATION` — a material correctness, UX, safety, distribution-identity, or truth problem remains.
- `HOLD_FOR_LIVE_HOST_EVIDENCE` — an exact frozen candidate is coherent but required candidate-specific host evidence is incomplete.

None of these states authorizes stable release, external evaluator recruitment, registry publication, central marketplace promotion, SLA, or LTS by itself.
