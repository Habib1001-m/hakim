# Versioning Policy

**Status:** Current public-beta policy  
**Applies from:** Hakim `1.0.0-beta.1`

## Canonical version

`core/hakim-skill/VERSION` is the canonical Hakim version source. Public product
metadata that carries a Hakim version must match it in the same change, including:

- `package.json`;
- `pyproject.toml`;
- `core/hakim-skill/SKILL.md` frontmatter;
- `plugins/codex/.codex-plugin/plugin.json`;
- `plugins/claude-code/.claude-plugin/plugin.json`;
- `plugins/copilot/plugin.json`;
- versioned Claude Code and GitHub Copilot marketplace entries;
- `conformance/native-host-acceptance.json` product version.

`npm run check:first-run` enforces the maintained public version-parity contract,
and `npm test` includes that gate.

## Version format

Hakim uses Semantic Versioning, including prerelease identifiers while a release
channel is explicitly prerelease software:

```text
MAJOR.MINOR.PATCH[-PRERELEASE]
```

The current public-beta candidate is `1.0.0-beta.2`. A stable `1.0.0` version is
a separate release decision; live-host acceptance or repository CI does not
silently remove the prerelease label.

Build metadata is not currently used for shipped Hakim product identity.

## Candidate identity rule

A prerelease version is a product identity, not a label for arbitrary moving
distributed bytes. When a change materially changes a maintained plugin,
first-run transport, lifecycle, runtime behavior, or shipped canonical policy,
Hakim must advance the prerelease identity before that changed surface is
promoted as the current candidate.

Repository-only documentation corrections or test-only changes do not require a
new identity merely because `main` advanced, provided they do not change the
shipped product contract or invalidate accepted evidence.

A new candidate starts with current-path live-host acceptance no stronger than
the evidence collected for that exact identity. Prior accepted evidence may be
preserved under `conformance/history/`, but it must not be relabeled as evidence
for a newer candidate.

## Immutable evidence identity

A version string identifies the product line, not a moving source checkout. Any
external evaluator campaign, benchmark, third-party validation, live-host
acceptance, or release-candidate evidence must also record an immutable Hakim
identity such as:

- an exact 40-character source commit;
- an immutable Git tag that resolves to that commit; or
- a published release artifact whose manifest/checksum records the source identity.

Two observations against different source revisions must not be pooled merely
because both revisions report the same prerelease version. External evaluator
recruitment is currently suspended; this rule governs any future relaunch.

## Change classification

### PATCH-level compatible change

Use a patch-level compatible change for corrections that do not expand or break the
canonical capability contract, including:

- documentation corrections;
- truth-gate hardening;
- test and evidence-tool fixes;
- security fixes that preserve supported behavior;
- implementation corrections behind an unchanged command contract.

During the public beta, such changes may be released under a later beta identifier
instead of implying that stable `1.0.0` has been reached.

### MINOR-level capability expansion

Use a minor-level capability change for backward-compatible product expansion,
including:

- a new canonical capability;
- a new supported policy profile;
- a new documented CLI or workflow contract;
- a newly supported host adapter after its acceptance gate passes;
- a new machine-readable schema version that remains compatible with existing data.

### MAJOR-level breaking change

Treat an intentional breaking change as major in compatibility impact, including:

- removal or incompatible behavior change of a canonical capability;
- incompatible changes to modes or policy profiles;
- incompatible evidence or conformance schema changes;
- removal of a supported host surface without a migration path;
- changes that invalidate existing repository integration contracts.

Prerelease status does not excuse hiding a known breaking change; release notes must
state it explicitly.

## Evidence and release independence

A version change does not establish:

- live-host acceptance;
- benchmark performance;
- public release authorization;
- central marketplace or directory publication;
- enterprise support.

Each claim requires its own evidence. Conversely, accepted live-host evidence does
not require an immediate version change when the shipped product contract has not
changed.

## Reproducible release identity

The maintained skill ZIP is intended to be byte-reproducible for equivalent
maintained source content. The package writer therefore normalizes archive member
ordering, timestamps, and file modes instead of inheriting checkout filesystem
metadata.

The release pipeline also builds a deterministic CycloneDX JSON SBOM from the
Git-tracked source/product inventory. `SHA256SUMS` and the release manifest cover
both the skill ZIP and that SBOM.

Checksums prove integrity against particular artifacts. Reproducibility is a
separate claim and must be tested independently. The source-inventory SBOM is
also a separate claim from signing, notarization, third-party provenance
attestation, or inventory of host/provider dependencies.

## Public-beta release review

Before a new version tag or GitHub release is recommended for operator approval:

1. `npm test` passes on the intended immutable release commit.
2. `npm run doctor` reports bounded doctor health separately from release authorization.
3. `npm run check:workflow-policy` passes.
4. `npm run check:public-boundary`, `npm run check:public-package`, and
   `npm run check:native-acceptance` pass for their defined structural contracts.
5. `npm run package:release` builds and verifies the reproducible skill ZIP,
   deterministic CycloneDX SBOM, `SHA256SUMS`, and JSON release manifest.
6. Current-path live-host evidence matches the exact candidate for every host the
   release claims as accepted.
7. Release notes state supported hosts, bounded live-host evidence, known
   limitations, and unsupported distribution channels.
8. Security, support/deprecation, installation, and documentation truth remain
   consistent with the release candidate.
9. Any external or third-party evidence cited by the release identifies the exact
   immutable Hakim commit/tag/artifact it evaluated.

A successful public-beta review does not automatically authorize publication,
create a tag, publish a GitHub release, or publish to a central marketplace. Those
are explicit operator actions.

## Changelog policy

- User-visible and operator-visible changes are recorded under `Unreleased`.
- A release moves applicable entries to a dated version section.
- Historical prerelease labels may remain as history when they were actually used.
- Withdrawn or corrected claims remain discoverable with their replacement and
  reason; they are not silently rewritten as if they never existed.

## Compatibility and deprecation policy

Hakim `1.0.0-beta.2` is public beta software. Its current native acceptance is
recorded in `conformance/native-host-acceptance.json` and currently remains
`HOLD_FOR_LIVE_HOST_EVIDENCE` until fresh candidate-specific journeys are
accepted. Historical beta.1 evidence is preserved separately and is not a
universal operating-system, model, provider, editor, or organization-policy
compatibility guarantee.

The current beta support and capability-deprecation rules are defined in
[`SUPPORT.md`](SUPPORT.md). No paid SLA, enterprise certification, or LTS line is
claimed by that policy. Stable release requires an explicit operator decision in
addition to satisfying the documented technical gates.
