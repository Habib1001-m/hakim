# Versioning Policy

**Status:** Current policy  
**Applies from:** Hakim `1.0.0`

## Canonical version

`core/hakim-skill/VERSION` is the canonical Hakim version source. The following
surfaces must match it in the same change:

- `package.json`;
- `pyproject.toml`;
- `core/hakim-skill/SKILL.md` frontmatter;
- `plugins/codex/.codex-plugin/plugin.json`;
- `plugins/claude-code/.claude-plugin/plugin.json`.

`npm run check:metadata` enforces synchronization.

## Version format

Hakim uses plain semantic versions:

```text
MAJOR.MINOR.PATCH
```

The canonical version file must not contain prerelease labels or build metadata.
Release-candidate identity belongs in the Git ref, workflow run, or release note,
not in a version field that would break current metadata parity.

## Change classification

### PATCH

Use a patch increment for backward-compatible corrections that do not expand the
canonical capability contract, including:

- documentation corrections;
- truth-gate hardening;
- test and evidence-tool fixes;
- security fixes that preserve supported behavior;
- implementation corrections behind an unchanged command contract.

### MINOR

Use a minor increment for backward-compatible product capability expansion,
including:

- a new canonical capability;
- a new supported policy profile;
- a new documented CLI or workflow contract;
- a newly supported host adapter after its acceptance gate passes;
- a new machine-readable schema version that remains compatible with existing data.

### MAJOR

Use a major increment for an intentional breaking change, including:

- removal or incompatible behavior change of a canonical capability;
- incompatible changes to modes or policy profiles;
- incompatible evidence or conformance schema changes;
- removal of a supported host surface without a migration path;
- changes that invalidate existing repository integration contracts.

## Evidence and release independence

A version increment does not establish:

- runtime conformance;
- benchmark performance;
- public release readiness;
- marketplace publication;
- enterprise support.

Each claim requires its own accepted evidence. Conversely, an accepted runtime
verdict does not require an immediate version increment when no shipped contract
changed.

## Release candidate rule

Before a version tag or controlled release candidate is accepted:

1. `npm test` passes.
2. `npm run test:release` passes in the intended release environment.
3. `npm run package:release` produces and verifies the ZIP, `SHA256SUMS`, and JSON
   manifest.
4. Release notes state supported hosts, deferred cases, known limitations, and
   unsupported distribution channels.
5. Metadata versions match the canonical version.
6. Security and documentation truth gates pass.

A successful release-candidate workflow does not automatically authorize public
publication. `PUBLIC_RELEASE_READINESS` must change through an explicit accepted
decision.

## Changelog policy

- User-visible and operator-visible changes are recorded under `Unreleased`.
- A release moves applicable entries to a dated version section.
- Historical prerelease labels may remain in the changelog as history, but they are
  not current metadata.
- Withdrawn or corrected claims must remain discoverable with their replacement and
  reason; they must not be silently rewritten as if they were never published.

## Compatibility policy

Hakim currently maintains repository contracts on a best-effort private pre-release
basis. No general backward-compatibility guarantee, support window, or long-term
support line is claimed. When public distribution becomes eligible, the support
window and deprecation policy must be defined before publication.
