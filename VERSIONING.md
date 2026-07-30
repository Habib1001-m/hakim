# Versioning Policy

**Status:** Current public-beta and unreleased-development policy  
**Applies from:** Hakim `1.0.0-beta.1`

## Identity authorities

`conformance/distribution-identity.json` is the machine-readable authority for:

- the current moving-development identity;
- the latest frozen candidate version, immutable ref, and exact source SHA;
- normal frozen-candidate install commands;
- the next-candidate state.

`core/hakim-skill/VERSION` is the canonical embedded version for the source tree being read. Public metadata that carries the current source-tree version must match it in the same change, including:

- `package.json`;
- `pyproject.toml`;
- `core/hakim-skill/SKILL.md` frontmatter;
- `plugins/codex/.codex-plugin/plugin.json`;
- `plugins/claude-code/.claude-plugin/plugin.json`;
- `plugins/copilot/plugin.json`;
- versioned Claude Code and GitHub Copilot marketplace entries;
- `conformance/native-host-acceptance.json` product version.

`npm run check:distribution-identity` enforces the frozen/development mapping and install-source contract. `npm run check:first-run` enforces maintained public metadata and first-run parity. `npm test` includes both gates.

## Current identities

| Identity | Version | Source | Status |
|---|---|---|---|
| Latest frozen prerelease | `1.0.0-beta.4` | `5d00039479f2f11b7fe30ccf2385e70ce24553c3` / `evidence/beta4-r31-5d00039` | Historical frozen candidate; live-host acceptance remains incomplete |
| Moving `main` development | `1.0.0-beta.4.post1` | moving `main`; every observation must record the exact commit | Unreleased development; not a frozen candidate; not release/promotion evidence |
| Next possible candidate | `1.0.0-beta.5` | not cut | `NOT_CUT` |

A stable `1.0.0` version is a separate release decision. CI, development evidence, live-host evidence, or a version edit does not silently authorize it.

## Version format

Hakim uses Semantic Versioning-compatible strings and keeps Python packaging metadata parseable because both ecosystems consume repository metadata.

```text
MAJOR.MINOR.PATCH[-PRERELEASE]
```

The moving-development identity `1.0.0-beta.4.post1` is deliberately ordered after frozen beta.4 and before a future beta.5 in both maintained metadata ecosystems. It is an unreleased identity marker, not a candidate label.

Build metadata is not used as the sole identity distinction because Semantic Versioning does not give build metadata separate precedence.

## Frozen candidate rule

A prerelease candidate is a product identity, not a label for arbitrary moving bytes.

Before a changed plugin, first-run transport, lifecycle, runtime behavior, or shipped canonical policy is promoted as a candidate:

1. advance to a candidate version distinct from the prior frozen candidate and any moving-development identity;
2. make all embedded product metadata agree;
3. pass the canonical repository and release-artifact gates on the exact intended head;
4. freeze an immutable ref and record the exact 40-character source SHA;
5. point normal candidate install routes at that immutable source;
6. reset current-path live-host acceptance to no stronger than evidence collected for that exact candidate.

Repository-only documentation corrections or test-only changes do not require a new frozen candidate merely because `main` advanced, provided they do not change shipped product behavior or invalidate accepted evidence. Moving `main` must nevertheless remain explicitly development and must not reuse a frozen candidate's embedded identity.

## Immutable install and evidence identity

Normal frozen-product installation must resolve one exact source SHA. A branch name, moving default branch, marketplace name, or version string alone is insufficient.

Any external evaluator campaign, benchmark, third-party validation, live-host acceptance, production-like dogfood, or release-candidate evidence must record:

- the embedded Hakim version;
- the exact 40-character source commit;
- the immutable ref or verified artifact identity when applicable;
- the host and host version;
- the bounded claim being tested.

Two observations against different source revisions must not be pooled merely because both revisions report the same version. Moving-development observations are never candidate evidence merely because their version sorts after the latest frozen prerelease.

## Development identity rule

Moving `main` may carry unreleased work between frozen candidates, but it must remain truthful:

- its embedded version differs from the latest frozen candidate;
- its release channel is `unreleased-development`;
- active documentation calls it moving development, not the normal frozen product;
- normal frozen install commands do not resolve `main` or another mutable branch;
- development observations record the exact source SHA;
- no beta.5 or other future candidate is implied until deliberately cut.

A material new development epoch should advance the development identity rather than indefinitely reusing one identifier across unrelated shipped behavior.

## Change classification

### PATCH-level compatible change

Use a patch-level compatible change for corrections that do not expand or break the canonical capability contract, including:

- documentation corrections;
- truth-gate hardening;
- test and evidence-tool fixes;
- security fixes that preserve supported behavior;
- implementation corrections behind an unchanged command contract.

During public beta, compatible changes may be released under a later beta identifier rather than implying stable `1.0.0`.

### MINOR-level capability expansion

Use a minor-level capability change for backward-compatible product expansion, including:

- a new canonical capability;
- a new supported policy profile;
- a new documented CLI or workflow contract;
- a newly supported host adapter after its acceptance gate passes;
- a new compatible machine-readable schema version.

### MAJOR-level breaking change

Treat an intentional breaking change as major in compatibility impact, including:

- removal or incompatible behavior change of a canonical capability;
- incompatible changes to modes or policy profiles;
- incompatible evidence or conformance schema changes;
- removal of a supported host surface without a migration path;
- changes that invalidate existing repository integration contracts.

Prerelease status does not excuse hiding a known breaking change; release notes must state it explicitly.

## Evidence and release independence

A version change does not establish:

- live-host acceptance;
- benchmark performance;
- public release authorization;
- central marketplace or directory publication;
- enterprise support.

Each claim requires its own evidence. Conversely, accepted evidence does not require an immediate candidate cut when the shipped candidate contract has not changed.

## Reproducible release identity

The maintained skill ZIP is intended to be byte-reproducible for equivalent maintained source content. The package writer normalizes archive member ordering, timestamps, and file modes.

The release pipeline builds a deterministic CycloneDX JSON SBOM from the Git-tracked source/product inventory. `SHA256SUMS` and the release manifest cover both the skill ZIP and SBOM.

Checksums prove integrity against particular artifacts. Reproducibility is separate from signing, notarization, third-party provenance attestation, and host/provider dependency inventory.

## Public-beta candidate review

Before a new version tag or GitHub release is recommended for operator approval:

1. P0 distribution identity reconciliation is closed.
2. `npm test` passes on the intended immutable release commit.
3. `npm run doctor` reports bounded doctor health separately from release authorization.
4. Workflow, public-boundary, public-package, native-acceptance, and distribution-identity checks pass.
5. `npm run package:release` builds and verifies the reproducible skill ZIP, deterministic CycloneDX SBOM, checksums, and release manifest.
6. Normal candidate install routes resolve the exact candidate source SHA.
7. Current-path live-host evidence matches the exact candidate for every host the release claims as accepted.
8. Release notes state supported hosts, bounded evidence, known limitations, and unsupported distribution channels.
9. Security, support/deprecation, installation, and documentation truth remain consistent with the candidate.
10. Any external evidence identifies the exact immutable commit/tag/artifact it evaluated.

A successful review does not automatically create a tag, publish a GitHub release, publish to npm, promote to a central marketplace, or authorize external evaluation. Those remain explicit operator actions.

## Changelog policy

- User-visible and operator-visible changes are recorded under `Unreleased`.
- A release moves applicable entries to a dated version section.
- Historical prerelease labels remain as history when actually used.
- Withdrawn or corrected claims remain discoverable with their replacement and reason.

## Compatibility and deprecation policy

Frozen Hakim `1.0.0-beta.4` remains public beta software at its exact immutable source. Moving `main` is `1.0.0-beta.4.post1` unreleased development. Accepted beta.1 and frozen beta.2/beta.3 evidence remains bounded to those exact historical candidates.

Current support and capability-deprecation rules are defined in [`SUPPORT.md`](SUPPORT.md). No paid SLA, enterprise certification, or LTS line is claimed. Stable release requires explicit operator authorization in addition to satisfying documented technical gates.
