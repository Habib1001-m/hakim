# AGENTS.md: Repository Rules for Hakim

**Scope:** agents modifying the Hakim source repository or canonical skill package.

Product behavior is defined by the canonical skill and capability registry. This file contains repository-operation rules only.

## Authority map

Use one maintained authority per question:

- Decision behavior: `SKILL.md`.
- Capability identifiers and host mappings: `capabilities.json`.
- Repository modification rules: this file.
- Installation: `INSTALL.md` plus the host integration.
- Distribution identity and immutable install pins: `conformance/distribution-identity.json`.
- Live-host evidence: `conformance/native-host-acceptance.json` and `conformance/history/`.
- Supported-host boundaries: `SUPPORTED_HOSTS.md`.
- Architecture: `docs/ARCHITECTURE.md`.
- Version/release contract: `VERSIONING.md` and version/manifests.
- Support/deprecation boundary: `SUPPORT.md`.

Tests and documentation verify or project these authorities; they are not separate product-state databases.

## Core rules

### 1. Apply Hakim to Hakim

Before adding code, files, dependencies, configuration, or documentation:

1. Ask whether the change is needed.
2. Reuse an existing implementation or authority when possible.
3. Prefer standard-library and host-native behavior over custom infrastructure.
4. Make the smallest sufficient, coherent, safe change.

Do not reduce security, privacy, accessibility, data integrity, migration safety, rollback safety, or user trust merely to reduce code.

### 2. Inspect before editing

Read the affected source, direct consumers/callers, focused tests, manifests, and relevant product documentation before changing behavior.

Do not infer current truth from old issues, historical evidence, filenames, or archived discussions alone.

### 3. Keep claims evidence-bound

A unit test, package build, projection check, local smoke test, or host-specific probe proves only its checked scope.

Do not turn those results into claims of universal compatibility, security approval, benchmark superiority, performance/token/cost improvement, adoption, marketplace publication, or third-party approval.

### 4. Preserve host-native differences

Capability parity is semantic. Invocation syntax, lifecycle behavior, permissions, trust, sandboxing, and plugin policy may differ by host.

Do not force Codex, Claude Code, GitHub Copilot CLI, and OpenCode through a lowest-common-denominator adapter merely for symmetry.

### 5. Preserve capable-model freedom

Do not add fixed reasoning order, mandatory tool sequences, broad denylist enforcement, or checkpoint ceremony merely because a hook can support it.

Prefer objective verification of consequential state. New lifecycle hooks require a concrete product need or observed host gap.

### 6. Keep installed documentation portable

Canonical capability text may be projected into multiple installed distributions.

- Do not require source-repository-only paths from an installed capability.
- Reference only files shipped by the active distribution or make helpers explicitly optional.
- Keep repository-development commands in repository documentation, not host-neutral runtime instructions.

### 7. Keep the public repository product-facing

The public repository contains product code, product documentation, tests, manifests, machine-readable evidence, and CI.

Do not add private taskboards, internal worklogs, operator transcripts, private prompts, credentials, provider secrets, unsanitized evidence, or phase-by-phase project-control documents.

Public issues should track real product bugs/features/support work. Public PRs should explain the product change, verification, and relevant compatibility/risk boundary without becoming execution diaries.

## Distribution identity changes

When changing version, normal install transport, candidate source, marketplace metadata, or live-host projection:

- update `conformance/distribution-identity.json`;
- keep moving development and frozen candidate identities distinct;
- pin candidate installation to an exact source identity;
- update package/host/marketplace metadata together;
- keep evidence attributable to the identity on which it was observed;
- run `npm run check:distribution-identity` and the canonical gate.

A development identity is not automatically a candidate, and candidate installation is not automatically live-host acceptance.

## Canonical skill changes

When changing `SKILL.md` or canonical capability skills:

- preserve the seven-rung decision ladder unless the product change intentionally replaces it;
- preserve `lite`, `full`, `ultra`, and `off` unless intentionally changed;
- update `capabilities.json` when capability identity or host mapping changes;
- update maintained host projections and canonical hash markers when canonical behavior changes;
- remove stale or unavailable resource references instead of copying them across projections.

Projection equality is not proof of correctness.

## Scripts and dependencies

Prefer existing repository scripts, the standard library, and host-native capabilities.

Add a dependency only when the current requirement cannot be met safely with existing code or platform behavior.

When changing a script:

- preserve documented CLI behavior unless the change updates the contract;
- keep exit/error behavior stable where users or CI depend on it;
- update focused tests and relevant documentation together;
- never document a command that has not been checked against the implementation.

## Documentation

Active documentation describes the product for its reader.

For commands, flags, paths, versions, package members, host capabilities, and compatibility claims:

1. identify the maintained structured/code authority;
2. verify the claim against it;
3. keep the claim no broader than the evidence;
4. avoid duplicating volatile upstream manuals;
5. remove obsolete product claims instead of preserving project history in active docs.

Do not make documentation chronology or milestone wording a product invariant.

## Validation

Run the smallest relevant focused checks while developing. Before merge, the final proposed head must pass the repository's current canonical gate:

```bash
npm test
```

Useful diagnostics:

```bash
npm run check:distribution-identity
npm run doctor
npm run plan:install -- --host all
```

Historical experiment fixtures remain separate from permanent product invariants.

## Security

Do not weaken permission checks, trust boundaries, path-safety checks, rollback behavior, or refusal states merely to simplify code.

Do not publish credentials, private source, sensitive paths, or exploit details in public issues. Follow `SECURITY.md`.

## Change completion

Before calling work complete:

- review the final diff;
- run relevant focused checks and the canonical gate;
- confirm maintained public documentation matches the implementation;
- confirm packaged documentation references only shipped resources;
- state remaining compatibility/runtime uncertainty accurately.
