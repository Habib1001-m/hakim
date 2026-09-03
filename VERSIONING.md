# Versioning Policy

Hakim uses explicit product identities for frozen prereleases and a separate moving-development identity between candidates.

## Identity authorities

[`conformance/distribution-identity.json`](conformance/distribution-identity.json) is the machine-readable authority for:

- moving-development identity;
- latest frozen candidate version, immutable ref, and exact source SHA;
- effective frozen install pins;
- packet-backed host evidence;
- next-candidate state.

`core/hakim-skill/VERSION` is the canonical embedded version for the source tree being read. Source-tree package/plugin metadata must match it.

A marketplace catalog may advertise the frozen candidate while moving source metadata carries a development identity only when the catalog's plugin source is independently pinned to the exact frozen candidate and deterministic tests enforce that distinction.

`npm run check:distribution-identity` enforces the identity mapping and install-source contract. `npm test` includes that gate.

## Current identities

| Identity | Version | Source | Status |
|---|---|---|---|
| Frozen public beta | `1.0.0-beta.4` | `5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Frozen; exact-identity host evidence accepted for all maintained hosts |
| Moving development | `1.0.0-beta.4.post1` | moving `main` | Unreleased development; not a frozen candidate |
| Next candidate | `1.0.0-beta.5` | not cut | `NOT_CUT` |

Stable `1.0.0` remains a separate product decision.

## Version format

Hakim uses Semantic Versioning-compatible strings:

```text
MAJOR.MINOR.PATCH[-PRERELEASE]
```

The moving-development identity `1.0.0-beta.4.post1` is deliberately distinct from both frozen beta.4 and a future beta.5 candidate. It is an unreleased identity marker, not a release label.

Build metadata is not used as the sole identity distinction because Semantic Versioning does not give build metadata separate precedence.

## Frozen candidate rule

A prerelease candidate is a product identity, not a label for arbitrary moving bytes.

Before changed distributed policy/plugin/runtime bytes become a new candidate:

1. advance to a candidate version distinct from the prior frozen candidate and moving-development identity;
2. make embedded product metadata agree;
3. pass the canonical repository and release-artifact gates on the intended source;
4. freeze an immutable ref and exact 40-character source SHA;
5. point candidate install routes at effective immutable source pins;
6. collect candidate-specific live-host evidence for the hosts the candidate claims.

Documentation-only or test-only corrections do not require a candidate cut when they do not change shipped behavior or invalidate accepted evidence.

## Immutable install and evidence identity

Normal frozen-product installation must resolve one exact source SHA. A branch name, marketplace name, or version string alone is insufficient.

The pin may live at the command transport layer or a host-native plugin-source layer. Mutable catalog discovery is acceptable only when the catalog entry independently resolves immutable plugin bytes and advertises the matching product version.

Live-host, dogfood, benchmark, or external evidence must identify the exact source identity and the bounded claim being tested. Evidence does not move with a branch or version label.

## Development identity rule

Moving `main` may carry unreleased work between candidates, but it must remain truthful:

- its embedded version differs from the frozen candidate;
- its release channel is `unreleased-development`;
- normal frozen install routes do not resolve moving plugin bytes;
- development observations record the exact source SHA when source identity matters;
- a future candidate is not implied until deliberately cut.

## Compatibility classification

### Compatible correction

Examples:

- documentation corrections;
- truth-gate hardening;
- test/evidence-tool fixes;
- security fixes preserving supported behavior;
- implementation fixes behind an unchanged contract.

### Backward-compatible capability expansion

Examples:

- a new canonical capability;
- a new supported policy profile;
- a new documented CLI/product contract;
- a newly supported host surface;
- a compatible machine-readable schema version.

### Breaking change

Examples:

- removal or incompatible behavior change of a canonical capability;
- incompatible mode/profile changes;
- incompatible conformance schema changes;
- removal of a supported host surface without migration;
- changes invalidating maintained repository integration contracts.

Prerelease status does not excuse hiding known breaking changes.

## Evidence and release independence

A version change does not establish live-host acceptance, benchmark performance, publication, stable-release authorization, or enterprise support.

Likewise, accepted evidence does not force an immediate release when the product is still moving through development.

## Reproducible release identity

The maintained skill ZIP is intended to be byte-reproducible for equivalent maintained source content. The package writer normalizes member order, timestamps, and modes.

The release pipeline builds a deterministic CycloneDX JSON SBOM. `SHA256SUMS` and the release manifest cover the skill ZIP and SBOM.

Checksums and reproducibility are separate from signing, notarization, provenance attestation, publication, and host acceptance.

## Candidate review

Before recommending a new prerelease:

1. `npm test` passes on the intended immutable candidate source.
2. `npm run package:release` builds and verifies release artifacts.
3. Product metadata and effective install pins identify the same candidate.
4. Required candidate host journeys match the exact candidate source.
5. Release notes state supported hosts, known limitations, and unsupported distribution channels.
6. Security, support, installation, and documentation remain consistent with the candidate.

A successful technical review does not itself publish a tag, GitHub release, npm package, central marketplace listing, or external evaluation campaign.

## Changelog policy

- Notable product changes are recorded under `Unreleased`.
- A release moves applicable entries to a version section.
- Historical prerelease labels remain when actually used.
- Corrected claims remain discoverable in Git history and the applicable evidence records.

See [`SUPPORT.md`](SUPPORT.md) for support and deprecation policy.
