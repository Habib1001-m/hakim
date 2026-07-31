# AGENTS.md: Repository Rules for Hakim

**Scope:** agents modifying the Hakim source repository or canonical skill package  
**Authority:** repository-operation rules only; product behavior remains defined by the canonical skill and capability contract.

## Purpose

Use this file when changing Hakim itself. Do not treat it as a user-facing capability specification and do not promote historical research, experiments, issue text, or local artifacts into current product claims.

## Authority map

Use one maintained authority per question:

- Decision behavior: `SKILL.md`.
- Capability identifiers and host mappings: `capabilities.json`.
- Repository modification rules: this file.
- Product installation: `INSTALL.md` plus the maintained host integration.
- Distribution identity, immutable install source, and frozen/development mapping: repository `conformance/distribution-identity.json`.
- Supported-host boundaries: repository `SUPPORTED_HOSTS.md`.
- Current product-readiness state: repository `docs/PRODUCT_READINESS.md`.
- Operational-presence architecture: repository `docs/OPERATIONAL_PRESENCE.md`.
- Moving-development live-host projection: repository `conformance/native-host-acceptance.json`.
- Frozen beta.4 live-host projection: repository `conformance/history/native-host-acceptance-1.0.0-beta.4.json`.
- Historical accepted host evidence: repository `conformance/history/`.
- Release/version contract: repository `VERSIONING.md` and version/manifests.
- Support/deprecation boundary: repository `SUPPORT.md`.
- Package membership/layout: current package builder and verification checks.
- Deterministic Python audit-helper behavior: `scripts/audit_complexity.py`.

Tests and documentation may verify or project these authorities; they are not a second product-state database.

## Current product boundary

The latest frozen prerelease is `1.0.0-beta.4` at exact source commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`. Moving `main` reports `1.0.0-beta.4.post1` and contains unreleased R3.2 development accepted through F04.

Those identities are deliberately separate: R3.2 evidence must not be relabeled as beta.4 candidate acceptance, and no beta.5 candidate exists until one is explicitly cut and frozen. Moving `main` is not a frozen candidate and is not eligible for release or promotion evidence.

Maintained product surfaces exist for Codex, Claude Code, GitHub Copilot, and OpenCode. Frozen beta.4 and moving development each remain `HOLD_FOR_LIVE_HOST_EVIDENCE` under their own machine-readable projections until exact-identity journeys are accepted.

P0 — Truthful Immutable Distribution Identity is the immediate repository gate. F05 must not start until P0 closes on an exact green final head.

The product does not claim or ship an MCP server, A2A runtime, LSP server, telemetry service, GRPO trainer, reward-model runtime, independent benchmark result, npm registry publication, central marketplace/directory publication, signing, notarization, or universal host compatibility. The private root package may act as bounded Git transport for OpenCode without becoming an npm registry release.

Do not reintroduce a historical implementation or document as a current product surface merely because it remains in Git history.

## Core repository rules

### 1. Apply Hakim to Hakim

Before adding code, files, dependencies, configuration, or documentation:

1. Ask whether the change is needed.
2. Reuse an existing implementation or source of truth when possible.
3. Prefer standard-library and host-native behavior over custom infrastructure.
4. Make the smallest sufficient, coherent, safe change that preserves security, privacy, accessibility, data integrity, rollback safety, and user trust.

### 2. Inspect before editing

Read the affected source, direct consumers/callers, tests, manifests, and active documentation before changing behavior. Do not infer current truth from filenames, old issue text, archived evidence, or historical comments alone.

### 3. Keep product claims evidence-bound

A passing unit test, package build, projection check, local smoke test, or host-specific probe proves only its checked scope.

Do not turn those results into claims of universal compatibility, correctness/security approval, benchmark superiority, performance/token/cost/ROI improvement, adoption, marketplace publication, or third-party approval.

Use `NOT_ESTABLISHED` when the repository does not contain accepted evidence for a requested claim.

### 4. Preserve host-native differences

Capability parity is semantic. Invocation syntax, lifecycle behavior, permissions, trust, sandboxing, and plugin policy may differ by host.

Do not force Codex, Claude Code, GitHub Copilot, and OpenCode into a lowest-common-denominator adapter or copy one host-specific command into canonical documentation as though it were universal.

### 5. Preserve capable-model freedom

Hakim targets capable coding agents. Do not add fixed reasoning order, mandatory tool sequences, broad denylist enforcement, or checkpoint ceremony merely because a hook can support it.

Prefer objective verification of consequential state over constraining reasoning paths. New lifecycle hooks require a concrete observed host gap, not symmetry.

### 6. Keep distribution-relative documentation portable

Canonical capability text may be projected into multiple installed distributions. Therefore:

- do not require source-repository-only paths from an installed capability;
- do not reference a file unless the active distribution ships it or the capability can operate without it;
- keep optional helpers explicitly optional;
- keep repository-development commands in repository documentation, not host-neutral runtime instructions.

### 7. Keep public and private governance separate

The public repository contains public product code, documentation, tests, manifests, and CI only. Do not add private taskboards, internal worklogs, evaluator archives, operator transcripts, credentials, private source, private prompts, provider/backend secrets, or unsanitized evidence packets.

Public issues and PRs should contain only public-safe product work that belongs in repository history.

## Distribution identity changes

When changing version, normal install transport, candidate source, marketplace metadata, or live-host projection:

- update `conformance/distribution-identity.json` first;
- keep moving development and frozen candidate identities distinct;
- pin normal candidate installation to an exact 40-character source SHA;
- update canonical/package/host/marketplace metadata together;
- preserve separate acceptance projections for identities whose evidence must remain attributable;
- never move evidence with a branch name or version label;
- run `npm run check:distribution-identity` and the canonical gate.

A new development identity does not create a candidate. A candidate cut does not create acceptance. Acceptance does not authorize release.

## Canonical skill changes

When changing `SKILL.md` or canonical capability skills:

- preserve the seven-rung decision ladder unless an explicitly approved product change replaces it;
- preserve `lite`, `full`, `ultra`, and `off` unless an approved product change replaces them;
- update `capabilities.json` when capability identity or host mapping changes;
- update maintained host projections and canonical hash markers when canonical behavior changes;
- keep examples host-neutral unless explicitly host-scoped;
- remove stale/unavailable resource references instead of copying them across projections.

Projection equality is not proof of correctness. A projection that faithfully copies a broken canonical statement is still broken.

## Scripts and dependencies

Prefer existing repository scripts, the standard library, and host-native capabilities. Add a dependency only when the current requirement cannot be met safely with existing code or platform behavior.

When changing a script:

- preserve documented CLI behavior unless the change explicitly updates the contract;
- keep exit/error behavior documented where users or CI depend on it;
- update focused tests and relevant documentation in the same change;
- never document a command that has not been checked against the real parser/implementation.

## Documentation truth

Active documentation describes the current product, not a previous phase.

For commands, flags, paths, versions, package members, host capabilities, readiness states, and quantitative statements:

1. identify the maintained authority;
2. verify the claim against it;
3. keep the claim no broader than the evidence;
4. prefer linking to changing host behavior rather than duplicating upstream manuals;
5. remove obsolete claims from active docs instead of preserving them for historical interest.

Prefer one current authority plus concise links over phase-specific status pages in the primary documentation surface.

## Validation

Run the smallest relevant existing checks for the change. Before merge, the final proposed head must pass the repository's current Public CI/package gates on that same content.

Canonical repository gate:

```bash
npm test
```

Useful bounded diagnostics:

```bash
npm run check:distribution-identity
npm run doctor
npm run plan:install -- --host all
```

Historical controlled-experiment fixtures remain separately runnable through `npm run test:evidence:historical`; they are evidence history, not permanent product invariants.

Generated packages/SBOMs do not establish publication, signing, third-party attestation, runtime compatibility, or stable-release authorization.

## Security and vulnerability handling

Do not weaken permission checks, trust boundaries, path-safety checks, rollback behavior, or refusal states merely to reduce code.

Do not put exploit details, credentials, private source, sensitive paths, or unsanitized runtime evidence in a public issue. Follow `SECURITY.md`.

## Change completion

Before describing work as complete:

- verify the final diff and affected projections;
- run the relevant checks;
- confirm active documentation matches the implementation;
- confirm packaged documentation does not reference absent resources;
- state remaining compatibility/runtime uncertainty explicitly;
- distinguish frozen prerelease truth from moving unreleased development;
- identify the exact final source commit whose CI result is being cited.

Do not mark a PR Ready or merge solely because documentation is internally consistent. Final acceptance requires evidence on the exact final head and explicit operator approval.
