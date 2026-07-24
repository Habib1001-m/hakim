# Changelog

All notable public changes to Hakim are recorded here.

## Unreleased

### Changed

- Withdrew the premature External Public-Beta Evaluator Campaign before any external report was accepted (`0/5`). External evaluator recruitment is suspended while product-readiness remediation is completed under GitHub issue #14; this does not change previously accepted live-host evidence.
- Repaired `hakim doctor` so current external-evaluation truth is reported as `SUSPENDED_FOR_PRODUCT_REMEDIATION` instead of the stale pre-promotion `ELIGIBLE_FOR_OPERATOR_REVIEW` state, and made `doctor --fast` a real lightweight subset rather than the full check set under a different label.
- Deleted the retired global/private-prerelease OpenCode distribution implementation, tarball/verifier tooling, global lifecycle code, smoke harness, and tests instead of leaving executable alternate architecture outside maintained CI.
- Removed obsolete Hermes/Ponytail theoretical-reference material and unsupported Hermes/Gemini placeholder plugin directories from the public product tree.
- Expanded public-boundary checks beyond a curated document list so retired product markers and forbidden public paths are rejected across the maintained public documentation/configuration tree.
- Made canonical loader activation text distribution-portable so installed OpenCode bundles no longer expose a source-checkout-only `core/hakim-skill/...` path as though it existed in every distribution.
- Made the canonical skill ZIP byte-reproducible by normalizing archive order, timestamps, and file modes, with a regression that changes source mtimes and requires byte-identical rebuild output.
- Added an immutable evidence-identity rule: future external evaluator, benchmark, third-party, or release-candidate evidence must identify the exact Hakim commit/tag/artifact rather than relying on a moving prerelease version string alone.
- Added `docs/ARCHITECTURE.md` and clarified public package/project descriptions around Hakim's actual product promise and authority/evidence model.
- Added a bounded Git-backed `hakim-opencode` bootstrap so normal OpenCode first-run no longer requires manually cloning Hakim. The private root package exposes only the project-local OpenCode bootstrap/runtime resources through an explicit `files` allowlist; no npm registry or global OpenCode publication is claimed.
- Kept the OpenCode bootstrap on the same guarded project-local lifecycle: create-only installation, hash verification, exact-match removal, quarantine-backed restoration, no `opencode.json` edits, and no global Hakim state. Structural tests do not silently promote the new first-run transport to live-host acceptance.
- Preserved accepted current-path evidence for Codex, Claude Code, and GitHub Copilot CLI while resetting OpenCode's current projection to `NOT_RUN` for the new Git-backed bootstrap. The earlier guarded project-local OpenCode journey remains bounded historical evidence and is not reused as proof that the new transport was observed.
- Fixed the OpenCode project-local runtime path discovered during live acceptance: the canonical `.mjs` source is installed as the host-discoverable `.opencode/plugins/hakim.js` runtime artifact, and zero-argument `/hakim-help` loads the native help skill without requesting missing input.
- Reconciled public-beta versioning and Ponytail-to-Hakim migration documentation with the current `1.0.0-beta.1` product, and extended the first-run truth gate to cover those release-critical documents.
- Reconciled release/readiness claims with the maintained host-native product paths after R2.
- Bounded OpenCode lifecycle claims to the project-local implementation; a cross-process lifecycle lock is not claimed.
- Added a Codex `0.131.0+` compatibility floor for this beta's default-on bundled plugin-hook/SessionStart contract; `rust-v0.130.0` still shipped `plugin_hooks` disabled by default.
- Reset the canonical skill-package documentation to current public product truth and removed legacy MCP/A2A/private-gate/benchmark-era research and synthetic example material from the shipped package surface.
- Made `hakim-audit`, `hakim-debt`, and `hakim-help` distribution-portable: installed capabilities no longer require source-checkout-only paths or absent helper/example resources.
- Changed canonical skill packaging from an implicit recursive include model to an explicit maintained root-file and subdirectory allowlist, with regression and semantic package checks that reject legacy documentation drift.
- Aligned privacy documentation with the implementation boundary: Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging.
- Added a public-safe current-native host acceptance projection that requires real-host evidence before any host can reach `PASS`; private acceptance ledgers and release authorization remain outside the public repository.
- Separated public repository health from private runtime/release authorization in `hakim doctor` and previously exposed external beta promotion as `HOLD_FOR_LIVE_HOST_EVIDENCE` until the original current-native journeys were accepted.
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
