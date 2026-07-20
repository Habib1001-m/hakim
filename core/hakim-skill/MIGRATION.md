# Ponytail → Hakim Relationship and Migration Boundary

Hakim originated from the minimalist methodology published by Ponytail. The
current repository adds its own evidence discipline, capability contract,
platform projections, CI gates, and runtime acceptance records.

This file is a product-truth boundary, not a public installer.

## Current relationship

Shared methodology:

- question whether work needs to exist;
- reuse the codebase first;
- prefer standard-library and native-platform behavior;
- avoid speculative architecture and dependencies;
- document deliberate shortcuts with a ceiling and upgrade trigger.

Hakim-specific repository work:

- canonical and machine-readable capability contracts;
- Codex and Claude Code skill projections;
- GitHub Copilot repository instructions;
- projection and capability parity gates;
- evidence-bound runtime acceptance;
- benchmark and technical-debt provenance controls.

## Evidence boundary

Ponytail benchmark values, release claims, package status, and adapter support
are not inherited as Hakim evidence. Hakim performance claims remain on HOLD
until an independent, reproducible benchmark is implemented and accepted.

No automated install or release migration is currently claimed.

The repository does not currently publish a general-purpose installer, release
asset, public marketplace package, MCP distribution, A2A runtime, or persistent
cross-machine migration tool.

## Safe evaluation path

1. Back up any existing Ponytail or Hakim configuration.
2. Review `core/hakim-skill/SKILL.md` and `capabilities.json`.
3. Validate the repository with `npm test` and `npm run check:metadata`.
4. Load only the adapter documented for the selected host.
5. Confirm skill discovery and behavior with the runtime evidence prompts.
6. Keep the old installation until the selected host passes its smoke test.

## Comment migration

Changing `ponytail:` comments to `hakim:` is not a blind search-and-replace.
Each marker must still describe a real shortcut, ceiling, and upgrade trigger.
Synthetic examples and archived records must not be promoted to live debt.

## Host scope

Accepted evidence currently covers:

```text
Codex six-capability runtime                 PASS within recorded pilot scope
Claude Code six-capability local runtime     PASS within local validated scope
GitHub Copilot repository instructions       PASS within recorded instruction scope
```

This does not establish public distribution or general compatibility with every
Ponytail-supported host.

## Archive note

Historical migration drafts remain under `_phase-*` only for provenance. They
are non-authoritative under `ARCHIVE_POLICY.md` and may contain superseded
commands or claims.

## Next migration milestone

A future migration tool requires all of the following before it can be claimed:

- one versioned distribution channel;
- install, update, disable, and uninstall tests;
- rollback behavior;
- host compatibility evidence;
- preservation rules for user configuration and debt records;
- release artifacts with verifiable provenance.

Until those gates pass, migration remains a reviewed manual process.
