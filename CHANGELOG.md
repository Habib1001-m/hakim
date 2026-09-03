# Changelog

Notable public Hakim product changes are recorded here.

## Unreleased — `1.0.0-beta.4.post1`

### Changed

- Added silent GitHub Copilot parent-session presence using host-native lifecycle hooks.
- Added bounded plugin-data mode state with stateless default `full` and explicit `lite`, `ultra`, and `off` modes.
- Added plugin-qualified Copilot mode control through `/hakim/hakim <mode>`.
- Added subagent continuity by reusing the same bounded presence authority on `subagentStart`.
- Added an experimental late-bound Copilot `agentStop` objective-contradiction check that reuses structured completion checkpoints, fails soft when objective truth is unavailable, and prevents correction loops.
- Kept the objective-truth mechanism narrow: no `preToolUse`/`postToolUse` command blocking, general prose linting, raw transcript persistence, or semantic blocking based only on whether a mutation appears unrelated.
- Advanced moving development to `1.0.0-beta.4.post1` while keeping frozen beta.4 immutable.
- Added `conformance/distribution-identity.json` as the machine-readable authority for moving development, the frozen candidate, effective install pins, and packet-backed host evidence.
- Pinned frozen beta.4 installation to exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3` across maintained host-native transport layers.
- Recorded accepted exact-identity beta.4 host evidence for Codex, Claude Code, GitHub Copilot CLI, and OpenCode under `conformance/history/`.
- Simplified the public documentation surface so README/install/support/architecture pages describe the product instead of internal project execution history.

## 1.0.0-beta.4

### Changed

- Added observable pre-edit checkpoints: `BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, and `PRE_EDIT_GIT_STATUS`.
- Added `SEMANTIC_CHANGE_CHECK` for decision-relevant control-flow/validator/permission/guard transformations.
- Added final-state reconciliation fields: `FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, and `UNRELATED_MUTATIONS`.
- Made broad-suite green insufficient by itself for semantic-equivalence claims on decision logic.
- Added exact prior-manifest authority required for bounded OpenCode upgrade/removal behavior.

Frozen beta.4 source: `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

## 1.0.0-beta.3

### Changed

- Classified dependency/editable installs, lockfile/package-metadata generation, local bootstrap/environment creation, code generation, formatter writes, and similar effects as mutations rather than harmless discovery.
- Made baseline discovery read-only by default and required justification before setup mutation.
- Bounded `NO_CHANGE` to inspected evidence.
- Strengthened evidence sufficiency so agents stop inspecting once decision-relevant uncertainty is resolved.
- Tightened Copilot activation ordering and made OpenCode mode selection a direct control turn.
- Added permanent regressions for baseline purity, bounded `NO_CHANGE`, Copilot activation discipline, and OpenCode direct mode activation.

## 1.0.0-beta.2

### Changed

- Advanced materially changed distributed bytes to a new prerelease identity instead of reusing beta.1.
- Made `npm test` the canonical repository/Public CI gate and consolidated Node compatibility checks.
- Promoted permanent behavior/runtime/product-truth contracts out of experiment-specific naming.
- Removed retired public reference/distribution surfaces.
- Restored compact `hakim-help` UX and clarified `hakim-gain` as an evidence-status compatibility ID.
- Added support/versioning boundaries, deterministic CycloneDX SBOM generation, checksums, and clean-room artifact verification.

## 1.0.0-beta.1

### Added

- Canonical evidence-bound coding skill and capability registry.
- Host-native integrations for Codex, Claude Code, GitHub Copilot CLI, and OpenCode.
- Doctor, host-preflight, installation planning, review, audit, PR Guardian, and live-host acceptance tooling.
- Guarded project-local OpenCode lifecycle with manifests, bounded ownership, quarantine-backed removal/rollback, transactional supported-version upgrade/removal, and no `opencode.json` mutation.
