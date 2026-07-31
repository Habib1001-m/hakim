# Changelog

Notable public Hakim changes are recorded here. Evidence identities remain tied to their exact immutable refs; changelog grouping does not move or relabel accepted evidence.

## Unreleased — R3.2 / `1.0.0-beta.4.post1`

### Changed

- Added silent GitHub Copilot operational presence using host-native lifecycle hooks while preserving model reasoning freedom.
- Added bounded plugin-data mode state with stateless default `full` and explicit `lite`, `ultra`, and `off` modes.
- Added plugin-qualified Copilot mode control through `/hakim/hakim <mode>` with split persistence/current-turn responsibilities.
- Added one evidence-justified `subagentStart` presence hook after a real Explore probe showed `MODE=NONE`; the accepted rerun returned `MODE=ultra` while the target repository remained clean.
- Established the R3.2 operating principle: **Free reasoning. Safe action. Evidence-bound claims.**
- Advanced moving `main` away from the frozen beta.4 identity to explicit development identity `1.0.0-beta.4.post1`.
- Added `conformance/distribution-identity.json` as the machine-readable authority for current development, frozen beta.4, its exact source SHA, effective normal-install pins, and the not-yet-cut beta.5 state.
- Pinned Codex and OpenCode beta.4 transports directly to exact source commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`; Claude Code and GitHub Copilot CLI use host-native catalog plugin-source SHA pins to the same immutable candidate.
- Reconciled Claude Code after a disposable `2.1.220` journey proved that marketplace `#<commit>` is treated as a branch selector: the catalog advertises frozen `1.0.0-beta.4` and pins `plugins/claude-code` through an exact-SHA `git-subdir` plugin source.
- Reconciled GitHub Copilot CLI after a disposable `1.0.71` journey proved that marketplace `#<sha>` is also treated as a branch selector. The repaired repository route separates catalog discovery from the immutable `source: github` plugin source, resolves frozen `1.0.0-beta.4` at the exact SHA, matches all 13 Copilot product files byte-for-byte, loads all six skills and five agents, invokes `hakim-help`, and preserves a clean runtime target.
- Added deterministic contracts that reject unsupported Claude/Copilot source shapes, catalog/source version collapse, unpinned effective routes, version/channel mismatch, frozen ref/SHA mismatch, and frozen/development identity collapse.
- Accepted exact-candidate Codex, Claude Code, and GitHub Copilot CLI transport packets, advancing P0 host proof to `3/4` while OpenCode remains independently pending.
- Reordered product readiness so P0 — Truthful Immutable Distribution Identity closes before F05 begins.

### Pending

- Complete the OpenCode P0 transport packet.
- Complete P0 validation on the exact final pull-request head.
- F05 — Objective Completion Truth.
- F06 — deterministic operational regressions.
- F07 — cut a new prerelease identity and rerun the production-like D01 task before broader promotion.

No beta.5, stable release, external evaluator campaign, npm registry publication, or central marketplace publication is authorized by these changes.

## 1.0.0-beta.4 — R3.1 observable truth

### Changed

- Advanced the remediation identity to `1.0.0-beta.4` after the beta.3 Copilot D01 rerun exposed setup-mutation baseline pollution, false clean/no-artifact completion claims, and a validator semantic regression missed by existing suites.
- Added observable pre-edit checkpoints: `BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, and `PRE_EDIT_GIT_STATUS`.
- Added `SEMANTIC_CHANGE_CHECK` for boolean/control-flow/validator/permission/guard transformations.
- Added final-state reconciliation: `FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, and `UNRELATED_MUTATIONS`.
- Made broad-suite green insufficient by itself for semantic-equivalence claims on decision logic.
- Added the exact beta.3 OpenCode prior-manifest authority required for bounded beta.4 upgrade/removal behavior.

Frozen beta.4 evidence remains at `evidence/beta4-r31-5d00039` and exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

## 1.0.0-beta.3 — R3 behavioral remediation

### Changed

- Classified dependency/editable installs, lockfile/package-metadata generation, local bootstrap/environment creation, code generation, formatter writes, and similar effects as mutations rather than harmless baseline discovery.
- Made baseline discovery read-only by default and required justification before setup mutation.
- Bounded `NO_CHANGE` to the inspected evidence rather than treating lack of a discovered change as global minimum-complexity proof.
- Strengthened evidence sufficiency so agents stop inspecting once decision-relevant uncertainty is resolved.
- Tightened Copilot activation ordering for explicit Hakim requests and made OpenCode mode selection a direct control turn.
- Added permanent regressions for baseline purity, bounded `NO_CHANGE`, Copilot activation discipline, and OpenCode direct mode activation.
- Added exact beta.2 OpenCode prior-manifest authority for bounded verified upgrade/removal.

Frozen beta.3 evidence remains at `evidence/beta3-r3-a697b5e`.

## 1.0.0-beta.2 — Product-readiness convergence

### Changed

- Advanced materially changed distributed bytes from beta.1 to `1.0.0-beta.2` instead of reusing the original prerelease identity.
- Made `npm test` the canonical repository/Public CI gate and consolidated Node 22/26 compatibility checks.
- Promoted permanent behavior/runtime/product-truth contracts out of phase-history naming while retaining controlled historical experiment fixtures separately.
- Removed the unreferenced Hitchhiker reference document and other retired public surfaces.
- Restored compact `hakim-help` UX and clarified `hakim-gain` as an evidence-status compatibility ID rather than a quantified-gain claim.
- Added `SUPPORT.md`, durable product-readiness gates, deterministic CycloneDX source/product-inventory SBOM generation, checksums, and clean-room artifact verification.

Frozen beta.2 evidence remains at `evidence/beta2-live-126a228`.

## 1.0.0-beta.1 — Public beta foundation

### Added

- Canonical evidence-bound coding skill and capability registry.
- Host-native integrations for Codex, Claude Code, GitHub Copilot, and OpenCode.
- Doctor, host-preflight, installation planning, review, audit, PR Guardian, and live-host acceptance tooling.
- Guarded project-local OpenCode lifecycle with manifests, bounded ownership, quarantine-backed removal/rollback, transactional supported-version upgrade/removal, and no `opencode.json` mutation.
- Git-backed `hakim-opencode` bootstrap so normal OpenCode first-run does not require manually cloning Hakim.
- Byte-reproducible canonical skill packaging and public-safe current-native host acceptance projection.
- Architecture, privacy, security, support, upstream-attribution, and first-run documentation for the public product.
