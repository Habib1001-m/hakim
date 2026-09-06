# Versioning Policy

Hakim uses Semantic Versioning-compatible prerelease versions:

```text
MAJOR.MINOR.PATCH[-PRERELEASE]
```

`core/hakim-skill/VERSION` is the canonical embedded version for the source tree. Package metadata and host plugin manifests must match it.

## Release identity

A prerelease is tied to immutable source, not merely to a branch name. Supported installation uses an immutable reviewed release tag; the exact commit behind that tag is the auditable source identity.

Once published, a Hakim release tag must not be moved, rewritten, or reused for different bytes. A corrected candidate receives a new prerelease identity.

Before a prerelease is recommended:

1. distributed product metadata agrees on the candidate version;
2. maintained product/runtime tests pass on the intended candidate source;
3. release artifacts build and verify from that source;
4. the final candidate commit is frozen;
5. the immutable release tag resolves to that exact commit; and
6. each host claimed as maintained is checked against that exact release identity before broader compatibility claims are made.

A successful repository gate does not itself publish a tag, GitHub release, npm registry package, marketplace listing, or production deployment.

## Compatibility

During beta, breaking changes must still be explicit. Removal or incompatible behavior changes to a canonical capability, mode, supported host surface, or managed lifecycle require a distinct prerelease identity and clear user-facing documentation.

The current canonical capability registry is authoritative for invocation-level compatibility. Recognition of selected older managed installation manifests for safe upgrade/removal is lifecycle compatibility only; it does not preserve historical capability IDs as current product surface.

## Changelog policy

`CHANGELOG.md` records product-facing changes only. Internal acceptance campaigns, private governance, evidence ledgers, candidate SHAs, and operator diaries do not belong there.

## Release artifacts

The maintained skill ZIP is byte-reproducible for equivalent maintained source content: member order, timestamps, and modes are normalized.

`npm run package:release` also builds a deterministic CycloneDX JSON SBOM plus SHA-256 checksums and release-manifest metadata.

Reproducibility, checksums, and an SBOM improve inspectability. They are not signing, notarization, provenance attestation, publication, or proof of security or effectiveness.
