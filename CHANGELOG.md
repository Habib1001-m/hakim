# Changelog

All notable public changes to Hakim are recorded here.

## Unreleased

### Changed

- Reconciled release/readiness claims with the maintained host-native product paths after R2.
- Removed the obsolete global OpenCode prerelease packaging path from public package scripts and CI gates; the maintained OpenCode product path is the guarded project-local installer/remover.
- Bounded OpenCode lifecycle claims to the project-local implementation: create-only installation, canonical hash verification, exact-match removal, quarantine-backed removal, and rollback are maintained; a cross-process lifecycle lock is not claimed.
- Added a Codex `0.131.0+` compatibility floor for this beta's default-on bundled plugin-hook/SessionStart contract; `rust-v0.130.0` still shipped `plugin_hooks` disabled by default.
- Reset the canonical skill-package documentation to current public product truth and removed legacy MCP/A2A/private-gate/benchmark-era research and synthetic example material from the shipped package surface.
- Made `hakim-audit`, `hakim-debt`, and `hakim-help` distribution-portable: installed capabilities no longer require source-checkout-only paths or absent helper/example resources.
- Changed canonical skill packaging from an implicit recursive include model to an explicit maintained root-file and subdirectory allowlist, with regression and semantic package checks that reject legacy documentation drift.
- Aligned privacy documentation with the implementation boundary: Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging.

## 1.0.0-beta.1

### Added

- Canonical evidence-bound coding skill.
- Integrations for Codex, Claude Code, GitHub Copilot, and OpenCode.
- Project-local OpenCode plugin bundle with one plugin, six commands, and six skills.
- Doctor, host-preflight, installation planning, review, audit, and PR Guardian command surfaces.
- Canonical bundle manifests, exact-match lifecycle validation, quarantine-backed removal, and rollback safeguards.
- Local skill packaging and project-local OpenCode install/remove verification tools.
- Host-specific first-run instructions for Codex, Claude Code, GitHub Copilot, and OpenCode.

### Changed

- Separated the public product repository from local development governance, review archives, taskboards, and private evidence records.
- Replaced internal transition reporting with user-facing product, installation, security, host-support, and limitation documentation.
- Added a minimal public CI boundary without private evaluator or governance artifact uploads.
- Unified read-only installation planning across all four maintained hosts, including OpenCode target-state inspection.
- Aligned public release metadata and manifests on `1.0.0-beta.1`.

### Security

- Added path containment and parent-chain validation to maintained lifecycle surfaces.
- Added refusal behavior for unsafe ownership, package mismatch, path escape, and unproved restoration where those contracts apply.
- Added immutable GitHub Action references and least-privilege permissions.

### Boundaries

- No npm or central marketplace/directory package is currently published.
- No signing, notarization, SBOM, external attestation, support SLA, or general model-quality claim is provided.
