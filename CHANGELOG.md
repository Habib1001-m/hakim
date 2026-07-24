# Changelog

All notable public changes to Hakim are recorded here.

## Unreleased

### Changed

- Completed current-native live-host acceptance for Codex, Claude Code, GitHub Copilot CLI, and OpenCode; the public acceptance projection now records all four maintained hosts as `PASS`, while private release authorization remains separate.
- Fixed the OpenCode project-local product path discovered during live acceptance: the canonical `.mjs` source is installed as the host-discoverable `.opencode/plugins/hakim.js` runtime artifact, and zero-argument `/hakim-help` now loads the native help skill and displays the reference without requesting missing input.
- Reconciled public-beta versioning and Ponytail-to-Hakim migration documentation with the current `1.0.0-beta.1` product, and extended the first-run truth gate to cover those release-critical documents.
- Reconciled release/readiness claims with the maintained host-native product paths after R2.
- Removed the obsolete global OpenCode prerelease packaging path from public package scripts and CI gates; the maintained OpenCode product path is the guarded project-local installer/remover.
- Bounded OpenCode lifecycle claims to the project-local implementation: create-only installation, canonical hash verification, exact-match removal, quarantine-backed removal, and rollback are maintained; a cross-process lifecycle lock is not claimed.
- Added a Codex `0.131.0+` compatibility floor for this beta's default-on bundled plugin-hook/SessionStart contract; `rust-v0.130.0` still shipped `plugin_hooks` disabled by default.
- Reset the canonical skill-package documentation to current public product truth and removed legacy MCP/A2A/private-gate/benchmark-era research and synthetic example material from the shipped package surface.
- Made `hakim-audit`, `hakim-debt`, and `hakim-help` distribution-portable: installed capabilities no longer require source-checkout-only paths or absent helper/example resources.
- Changed canonical skill packaging from an implicit recursive include model to an explicit maintained root-file and subdirectory allowlist, with regression and semantic package checks that reject legacy documentation drift.
- Aligned privacy documentation with the implementation boundary: Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging.
- Added a public-safe current-native host acceptance projection that requires real-host evidence before any host can reach `PASS`; private acceptance ledgers and release authorization remain outside the public repository.
- Separated public repository health from private runtime/release authorization in `hakim doctor` and exposed external beta promotion as `HOLD_FOR_LIVE_HOST_EVIDENCE` until current native journeys are accepted.
- Reconciled `pyproject.toml` and phase-history metadata with the public-beta product state and removed obsolete public state/readiness scripts that depended on private or deleted state.
- Added a bounded current-native live-host acceptance harness that detects host/version state, prints the exact operator journey, and creates reviewable candidate evidence without installing plugins or mutating the public acceptance projection.

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