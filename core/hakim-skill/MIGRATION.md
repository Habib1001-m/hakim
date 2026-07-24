# Ponytail → Hakim Relationship and Migration Boundary

Hakim originated from the minimalist methodology published by Ponytail. The
current repository adds its own evidence discipline, capability contract,
host-native product surfaces, CI gates, and live-host acceptance projection.

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
- projection and capability parity gates;
- public-safe current-native live-host acceptance evidence;
- evidence-bound review, audit, debt, and release-validation tooling.

## Evidence boundary

Ponytail benchmark values, release claims, package status, and adapter support are
not inherited as Hakim evidence. Hakim performance claims remain unsupported until
an independent, reproducible benchmark is implemented and accepted.

Hakim does provide maintained installation paths for its supported hosts. That is
not the same as an automated migration from an existing Ponytail installation.
Hakim does not currently claim a cross-host migration tool that discovers,
transforms, or replaces existing Ponytail user configuration automatically.

The repository also does not claim npm publication, a central marketplace/directory
listing, MCP distribution, A2A runtime, or persistent cross-machine migration.

## Safe evaluation path

1. Back up any existing Ponytail or Hakim configuration that matters to you.
2. Review `core/hakim-skill/SKILL.md` and `capabilities.json`.
3. Validate the Hakim checkout with `npm test` and `npm run doctor`.
4. Use the maintained product path documented for the selected host in
   `core/hakim-skill/INSTALL.md`.
5. Confirm the host-native plugin or project-local bundle is active before relying
   on Hakim behavior.
6. Use `conformance/native-host-acceptance.json` only as bounded public evidence for
   the recorded product/version path; do not treat it as universal compatibility.
7. Remove or replace an older installation only after the selected Hakim path is
   working for the intended repository and host.

## Comment migration

Changing `ponytail:` comments to `hakim:` is not a blind search-and-replace. Each
marker must still describe a real shortcut, ceiling, and upgrade trigger. Synthetic
examples and archived records must not be promoted to live debt.

## Current host scope

Hakim `1.0.0-beta.1` maintains product surfaces for:

- Codex;
- Claude Code;
- GitHub Copilot;
- OpenCode.

The authoritative current-native acceptance state is
`conformance/native-host-acceptance.json`. For this beta, all four maintained
product paths have accepted real-host install/start/invocation evidence. That does
not establish compatibility with every operating system, model, provider, editor
version, organization policy, or Ponytail-supported host.

## Archive note

Historical migration drafts may contain superseded commands or claims. Archived
material is provenance, not current product documentation.

## Future migration-tool threshold

A future automated Ponytail → Hakim migration tool would require, at minimum:

- a versioned source and target contract;
- discovery rules that do not overwrite unrelated user configuration;
- install, update, disable, uninstall, and rollback tests for every mutated surface;
- preservation rules for user configuration and live debt records;
- host compatibility evidence for the migration path itself;
- release artifacts or source provenance that the operator can verify.

Until those gates pass, migration between products remains a reviewed manual
process even though Hakim's own supported-host installation paths are maintained.