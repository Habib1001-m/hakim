# Ponytail → Hakim Relationship and Migration Boundary

Hakim originated from the minimalist methodology published by Ponytail. The current repository adds its own evidence discipline, capability contract, host-native product surfaces, CI gates, distribution identity authority, and live-host acceptance projections.

This file is a product-truth boundary, not a migration utility.

## Current relationship

Shared methodology:

- question whether work needs to exist;
- reuse the codebase first;
- prefer standard-library and native-platform behavior;
- avoid speculative architecture and dependencies;
- document deliberate shortcuts with a ceiling and upgrade trigger.

Hakim-specific product work:

- canonical and machine-readable capability contracts;
- native Git marketplace plugins for Codex, Claude Code, and GitHub Copilot;
- a guarded project-local native OpenCode plugin bundle;
- host-specialized skills, commands, agents, and lifecycle controls where supported;
- projection, capability-parity, and distribution-identity gates;
- separate public-safe acceptance projections for moving development and frozen candidates;
- evidence-bound review, audit, debt, and release-validation tooling.

## Distribution identity boundary

The latest frozen Hakim prerelease is `1.0.0-beta.4` at exact source commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

Moving `main` reports `1.0.0-beta.4.post1` and is unreleased development, not a frozen candidate and not release/promotion evidence. `conformance/distribution-identity.json` is the machine-readable mapping authority.

Normal frozen beta.4 installation uses the exact source SHA documented in `INSTALL.md`. A moving branch, marketplace name, or version label alone is not sufficient evidence identity.

## Evidence boundary

Ponytail benchmark values, release claims, package status, and adapter support are not inherited as Hakim evidence. Hakim performance claims remain unsupported until independent accepted evidence establishes them.

Hakim provides maintained installation paths for its supported hosts. That is not the same as an automated migration from an existing Ponytail installation.

Hakim does not claim a cross-host migration tool that discovers, transforms, or replaces Ponytail user configuration automatically. The repository also does not claim npm publication, a central marketplace/directory listing, MCP distribution, A2A runtime, or persistent cross-machine migration.

## Safe evaluation path

1. Back up any existing Ponytail or Hakim configuration that matters to you.
2. Review `core/hakim-skill/SKILL.md`, `capabilities.json`, and `conformance/distribution-identity.json`.
3. Choose the exact Hakim identity to evaluate: frozen beta.4 or explicit moving development.
4. For frozen beta.4, use the immutable install path in `core/hakim-skill/INSTALL.md`.
5. For moving development, record the exact 40-character commit and treat the result as non-candidate evidence.
6. Validate a source checkout with `npm test`, `npm run check:distribution-identity`, and `npm run doctor`.
7. Confirm the host-native plugin or project-local bundle is active before relying on Hakim behavior.
8. Consult the acceptance projection linked by `conformance/distribution-identity.json`; never transfer status from another version/source identity.
9. Remove or replace an older installation only after the selected Hakim path is working for the intended repository and host.

## Comment migration

Changing `ponytail:` comments to `hakim:` is not a blind search-and-replace. Each marker must still describe a real shortcut, ceiling, and upgrade trigger. Synthetic examples and archived records must not be promoted to live debt.

## Current host scope

Hakim maintains product surfaces for:

- Codex;
- Claude Code;
- GitHub Copilot;
- OpenCode.

Acceptance authorities are separate:

- moving development: `conformance/native-host-acceptance.json`;
- frozen beta.4: `conformance/history/native-host-acceptance-1.0.0-beta.4.json`.

Both currently record all four paths as `NOT_RUN` and overall `HOLD_FOR_LIVE_HOST_EVIDENCE`, but they prove different identities and cannot inherit from each other. Accepted beta.1 and frozen beta.2/beta.3 evidence remains bounded to those exact historical candidates.

None of these projections establishes universal compatibility with every operating system, model, provider, editor version, organization policy, or Ponytail-supported host.

## Archive note

Historical migration drafts may contain superseded commands or claims. Archived material is provenance, not current product documentation.

## Future migration-tool threshold

A future automated Ponytail → Hakim migration tool would require, at minimum:

- a versioned source and target contract;
- discovery rules that do not overwrite unrelated user configuration;
- install, update, disable, uninstall, and rollback tests for every mutated surface;
- preservation rules for user configuration and live debt records;
- host compatibility evidence for the migration path itself;
- release artifacts or source provenance that the operator can verify.

Until those gates pass, migration between products remains a reviewed manual process even though Hakim's own supported-host installation paths are maintained.
