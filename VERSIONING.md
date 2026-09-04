# Versioning Policy

Hakim uses Semantic Versioning-compatible prerelease versions:

```text
MAJOR.MINOR.PATCH[-PRERELEASE]
```

`core/hakim-skill/VERSION` is the canonical embedded version for the source tree. Package metadata and host plugin manifests must match it.

## Release identity

A prerelease is tied to immutable source, not merely to a branch name. Release installation should use a release tag or exact commit; exact commit pinning is the strongest identity.

Before a new prerelease is recommended:

1. distributed product metadata agrees on the candidate version;
2. `npm test` passes on the intended candidate source;
3. `npm run package:release` builds and verifies the release artifacts;
4. the final candidate commit is frozen and recorded;
5. claimed host journeys are checked against that exact source before broader release claims are made.

A successful repository gate does not itself publish a tag, GitHub release, npm registry package, or marketplace listing.

## Compatibility

During beta, breaking changes must still be explicit. Removal or incompatible behavior changes to a canonical capability, mode, supported host surface, or managed lifecycle require a distinct release decision and clear user-facing notes.

`hakim-gain` remains a compatibility ID whose maintained meaning is bounded evidence status, not a quantified-gain claim.

## Release artifacts

The maintained skill ZIP is byte-reproducible for equivalent maintained source content: member order, timestamps, and modes are normalized.

`npm run package:release` also builds a deterministic CycloneDX JSON SBOM plus SHA-256 checksum and manifest metadata.

Reproducibility, checksums, and an SBOM improve inspectability. They are not signing, notarization, provenance attestation, publication, or proof of security or effectiveness.
