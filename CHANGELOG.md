# Changelog

All notable public changes to Hakim are recorded here.

## Unreleased

### Changed

- Closed the POST-BETA-R2 OpenCode sentinel-coexistence finding: prompt activation now uses explicit start/end ownership sentinels, reconciliation removes only the Hakim-owned range, unrelated trailing system content is preserved, and an unbounded legacy marker is left untouched rather than destructively guessed. The changed runtime has fresh real-host install/start/invocation evidence on immutable candidate `8b9c0e7011d825f5aaf60763ed874d88c0c05b62` with OpenCode `1.17.13`; earlier `fbfd9354...` evidence remains bounded to the unchanged manifest-backed upgrade/removal lifecycle.
- Closed the POST-BETA-R2 P1 truth-hardening findings: failed OpenCode upgrades now report the actually restored installed version after a complete rollback (and `null` when rollback is incomplete), `hakim doctor` reports bounded doctor health without claiming whole-repository health and derives native recovery guidance from the host state that actually failed, and `SECURITY.md` now describes the current manifest-backed create/adopt/transactional-upgrade/removal lifecycle.
- Closed the inherited OpenCode lifecycle safety findings on the maintained project-local path: removal and rollback now use same-filesystem quarantine plus post-move verification/no-clobber recovery; a validated persistent install manifest enables bounded adoption, transactional supported-version upgrade, and newer-CLI removal of a supported older installation.
- Made OpenCode prompt activation sentinel-backed and idempotent, expanded session-state regressions for simultaneous IDs/fallback/deletion/restart boundaries, and narrowed the shipped Node contract to `>=22` with Public CI coverage on Node 22, 24, and 26.
- Documented the F-4 truth-gate policy: machine-readable/structural authorities govern product state; prose checks are explanatory projections or negative stale-language tripwires and cannot promote acceptance or release state.
- Recorded fresh accepted real-host evidence for the hardened manifest-backed OpenCode path on immutable candidate `fbfd9354f16d58ec72da1458356a1fbc0b9a37f3` with OpenCode `1.18.5`, including clean install/start/invocation, accepted-old-to-managed transactional upgrade, and newer-CLI removal of the supported older installation. The public current-native projection is again `PASS` for all four maintained hosts; earlier `b442820d...` evidence remains historical for the earlier lifecycle only.
- Reconciled post-merge closure truth after POST-BETA-R1: evaluator recruitment remains `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION`; completion of remediation or native-host acceptance does not relaunch the withdrawn evaluator campaign or authorize stable `1.0.0`.
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
- Fixed the Git-backed OpenCode bootstrap CLI so npm's `.bin` symlink execution resolves to the real CLI path and actually enters `main()`; added a regression that executes the CLI through a symlink instead of source-direct invocation only.
- Recorded accepted real-host evidence for the Git-backed OpenCode install/start/invocation journey on immutable candidate `b442820d2803955d0f7f33b405bd096f443d4d72` with OpenCode `1.17.13`; the public current-native acceptance projection now records all four maintained product paths as `PASS` while stable release authorization remains separate.
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
