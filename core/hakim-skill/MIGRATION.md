# Ponytail → Hakim Relationship and Migration Boundary

Hakim originated from the minimalist methodology published by Ponytail. Hakim now maintains its own evidence discipline, capability contract, host-native product surfaces, CI, distribution identity, and live-host evidence.

This file is a product-truth boundary, not an automated migration utility.

## Relationship

Shared methodology includes:

- question whether work needs to exist;
- reuse the codebase first;
- prefer standard-library and native-platform behavior;
- avoid speculative architecture and dependencies;
- preserve material safety and trust guards.

Hakim-specific product work includes:

- canonical and machine-readable capability contracts;
- native product surfaces for Codex, Claude Code, GitHub Copilot CLI, and OpenCode;
- host-specialized skills, commands, agents, and lifecycle controls where supported;
- distribution-identity and projection checks;
- separate evidence projections for moving development and frozen candidates;
- evidence-bound review, audit, debt, and release-validation tooling.

## Distribution identity

Frozen Hakim `1.0.0-beta.4` is exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

Moving `main` reports `1.0.0-beta.4.post1` and is unreleased development rather than a frozen candidate. `conformance/distribution-identity.json` is the machine-readable mapping authority.

Frozen installation uses the exact source identity documented in `INSTALL.md`.

## Evidence boundary

Ponytail benchmark values, release claims, package status, and adapter support are not inherited as Hakim evidence.

Hakim maintains installation paths for supported hosts, but it does not claim an automated migration from an existing Ponytail installation.

Hakim does not discover, transform, or replace Ponytail user configuration automatically.

## Safe evaluation path

1. Back up configuration that matters to you.
2. Review `SKILL.md`, `capabilities.json`, and `conformance/distribution-identity.json`.
3. Choose the Hakim identity to evaluate.
4. For frozen beta.4, use the immutable install path in `INSTALL.md`.
5. For moving development, record the exact source commit when identity matters and treat the result as development evidence.
6. Validate a source checkout with `npm test`, `npm run check:distribution-identity`, and `npm run doctor`.
7. Confirm the host-native plugin or project-local bundle is active before relying on its behavior.
8. Remove or replace an older installation only after the selected Hakim path works for the intended host/repository.

## Comment migration

Changing `ponytail:` comments to `hakim:` is not a blind search-and-replace. Each marker must still describe a real shortcut, ceiling, and upgrade trigger. Synthetic examples and historical records must not be promoted to live debt.

## Current host scope

Hakim maintains product surfaces for:

- Codex;
- Claude Code;
- GitHub Copilot CLI;
- OpenCode.

Frozen beta.4 has accepted exact-identity live-host evidence across all four maintained hosts. Moving development has a separate evidence projection and does not automatically inherit frozen-candidate acceptance.

None of these records establishes universal compatibility with every operating system, model, provider, editor version, organization policy, or Ponytail-supported host.

## Future automated migration threshold

An automated Ponytail → Hakim migration tool would require a real product need plus:

- a versioned source/target contract;
- discovery rules that preserve unrelated user configuration;
- install/update/disable/uninstall/rollback tests for every mutated surface;
- preservation rules for user configuration and live debt records;
- host evidence for the migration path itself;
- verifiable source or release provenance.

Until then, migration between the products remains a reviewed manual process.
