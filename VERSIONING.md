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

The current public-beta version is `1.0.0-beta.1`. A stable `1.0.0` version is a
separate release decision; live-host acceptance or repository CI does not silently
remove the prerelease label.

Build metadata is not currently used for shipped Hakim product identity.

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

## Public-beta release review

Before a new version tag or GitHub release is recommended for operator approval:

1. `npm test` passes on the intended release commit.
2. `npm run doctor` reports repository health separately from private authorization.
3. `npm run check:workflow-policy` passes.
4. `npm run check:public-boundary`, `npm run check:public-package`, and
   `npm run check:native-acceptance` pass.
5. `npm run package:release` builds and verifies the skill ZIP, `SHA256SUMS`, and
   JSON release manifest.
6. Release notes state supported hosts, the bounded live-host evidence, known
   limitations, and unsupported distribution channels.
7. Security and documentation truth remain consistent with the release candidate.

A successful public-beta review does not automatically authorize publication,
create a tag, publish a GitHub release, or publish to a central marketplace. Those
are explicit operator actions.

## Changelog policy

- User-visible and operator-visible changes are recorded under `Unreleased`.
- A release moves applicable entries to a dated version section.
- Historical prerelease labels may remain as history when they were actually used.
- Withdrawn or corrected claims remain discoverable with their replacement and
  reason; they are not silently rewritten as if they never existed.

## Compatibility policy

Hakim `1.0.0-beta.1` is public beta software with bounded current-native acceptance
recorded in `conformance/native-host-acceptance.json`. That evidence is not a
universal operating-system, model, provider, editor, or organization-policy
compatibility guarantee.

No long-term support line, formal support window, or general backward-compatibility
guarantee is currently claimed. A stable-release support and deprecation policy
must be defined before Hakim claims such guarantees.