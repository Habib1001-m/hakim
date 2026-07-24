# AGENTS.md: Repository Rules for Hakim

**Scope:** agents modifying the Hakim source repository or canonical skill package  
**Authority:** repository-operation rules only; product behavior remains defined by the canonical skill and capability contract.

## Purpose

Use this file when changing Hakim itself. Do not treat it as a user-facing capability specification and do not promote historical research, examples, or local development artifacts into product claims.

## Authority map

Use one authoritative source per question:

- Hakim decision behavior: `SKILL.md`.
- Capability identifiers and host mappings: `capabilities.json`.
- Repository modification rules: this file.
- Product installation: `INSTALL.md` plus the maintained host integration.
- Supported-host status and boundaries: repository `SUPPORTED_HOSTS.md`.
- Package membership and layout: the current package builder and package verification checks.
- Deterministic Python audit-helper behavior: `scripts/audit_complexity.py`.
- Live public release metadata: repository `VERSION`, manifests, changelog, and public release checks.

Tests, examples, archived evidence, and research notes are not higher authority than these sources.

## Current product boundary

Hakim `1.0.0-beta.1` is a public beta coding-governance product with maintained surfaces for Codex, Claude Code, GitHub Copilot, and OpenCode.

The maintained product does not claim or ship an MCP server, A2A runtime, LSP server, telemetry service, GRPO trainer, reward-model runtime, independent benchmark result, npm package, central marketplace/directory publication, signing, notarization, or universal host compatibility.

Do not reintroduce a historical implementation or document as a current product surface merely because it remains in source history.

## Core repository rules

### 1. Apply Hakim to Hakim

Before adding code, files, dependencies, configuration, or documentation:

1. Ask whether the change is needed.
2. Reuse an existing implementation or source of truth when possible.
3. Prefer standard-library and host-native behavior over custom infrastructure.
4. Keep the smallest safe diff that preserves security, privacy, accessibility, data integrity, rollback safety, and user trust.

### 2. Inspect before editing

Read the affected source, callers or consumers, tests, manifests, and active documentation before changing behavior. Do not infer current truth from filenames, old issue text, archived documents, or historical comments alone.

### 3. Keep product claims evidence-bound

A passing unit test, package build, structural projection check, or local smoke test proves only the scope it actually checks.

Do not convert those results into claims of:

- universal compatibility;
- correctness or security approval;
- benchmark superiority;
- performance, token, cost, adoption, or ROI improvement;
- marketplace publication or third-party approval.

Use `NOT_ESTABLISHED` when the repository does not contain accepted evidence.

### 4. Preserve host-native differences

Capability parity is semantic. Invocation syntax, lifecycle behavior, permissions, trust, sandboxing, and plugin policy may differ by host.

Do not force Codex, Claude Code, GitHub Copilot, and OpenCode into a lowest-common-denominator adapter or copy a host-specific command into canonical documentation as if it were universal.

### 5. Keep distribution-relative documentation portable

Canonical capability text may be projected into multiple installed distributions. Therefore:

- do not require a source-repository path such as `core/hakim-skill/...` from an installed capability;
- do not reference a file unless that capability can operate without it or the active distribution actually ships it;
- describe optional helpers and example assets as optional;
- keep repository-development commands in repository documentation, not in host-neutral runtime instructions.

### 6. Keep public and internal governance separate

The public repository contains public product code, documentation, tests, manifests, and CI only. Do not add private taskboards, internal worklogs, evaluator archives, operator transcripts, credentials, private evidence packets, or local control-plane artifacts.

Use public issues and pull-request descriptions only for public product work that belongs in the repository history.

## Canonical skill changes

When changing `SKILL.md` or canonical capability skills:

- preserve the seven-rung decision ladder unless an explicitly approved product change replaces it;
- preserve the four modes `lite`, `full`, `ultra`, and `off` unless an approved product change replaces them;
- update `capabilities.json` when capability identity or host mapping changes;
- update host projections when canonical behavior changes;
- keep examples host-neutral unless they are explicitly labeled for one host;
- remove stale or unavailable resource references instead of copying them across projections.

Projection equality is not sufficient evidence of correctness. A projection that faithfully copies a broken canonical reference is still broken.

## Scripts and dependencies

Prefer existing repository scripts and standard-library capabilities. Add a dependency only when the current product requirement cannot be met safely with existing code, the standard library, or the host platform.

When changing a script:

- preserve documented CLI behavior unless the change explicitly updates that contract;
- keep exit codes and error behavior documented where users or CI depend on them;
- update tests and documentation in the same change when behavior changes;
- never document an example command that has not been checked against the actual parser or implementation.

## Documentation rules

Active documentation must describe the current product, not a previous architecture.

For every command, flag, path, version, package member, host capability, and quantitative statement:

1. identify the authoritative implementation or upstream contract;
2. verify the claim against it;
3. keep the claim no broader than the evidence;
4. prefer linking to changing host behavior rather than duplicating large upstream manuals;
5. remove obsolete claims instead of preserving them for historical interest inside active product docs.

Research or prototype material that is retained must be clearly non-authoritative and must not be included in the shipped runtime package unless the maintained product actually depends on it.

## Validation

Run the smallest relevant existing checks for the change. Before proposing public release readiness, the final head must pass the repository's current public CI and package checks on that same head.

Common repository-level checks include:

```bash
npm test
npm run doctor
npm run package:skill
```

Use more focused checks when changing a host integration or lifecycle path. Do not invent legacy gate names or score thresholds that the current CI does not implement.

A generated package is a local build artifact. Package creation does not establish publication, signing, third-party attestation, or runtime compatibility.

## Security and vulnerability handling

Do not weaken permission checks, trust boundaries, path-safety checks, rollback behavior, or refusal states to reduce code.

Do not put exploit details, credentials, private source, sensitive paths, or unsanitized runtime evidence in a public issue. Follow the repository security policy for vulnerability reporting.

## Change completion

Before describing a task as complete:

- verify the final diff and affected projections;
- run the relevant checks;
- confirm active documentation matches the implementation;
- confirm packaged documentation does not reference absent resources;
- state any remaining compatibility or runtime uncertainty explicitly.

Do not mark a pull request Ready or merge it solely because documentation is internally consistent. Final acceptance requires evidence on the exact final head and explicit operator approval.
