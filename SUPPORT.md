# Support and Deprecation Policy

Hakim is public beta software. This policy defines the support boundary for the beta line and the minimum policy required before a stable `1.0.0` recommendation. It does not create a paid support plan, response-time SLA, or long-term-support commitment.

## Current beta support

- Best-effort maintenance applies to the current public beta line and moving development.
- Security reports should use GitHub private security advisories as described in `SECURITY.md`.
- Host compatibility is limited to maintained surfaces in `SUPPORTED_HOSTS.md`; host-native permissions, trust, policy, and lifecycle controls remain authoritative.
- Repository or live-host success is not a promise of universal compatibility or a support SLA.

## Product identities and upgrades

A prerelease version is a product identity, not a label for arbitrary moving bytes. Material changes to distributed plugin/runtime bytes must receive a distinct candidate identity before promotion as a new prerelease.

Live-host evidence belongs to the exact identity it observed. Evidence for an older candidate may remain historical but must not be silently reused for a newer candidate.

For the managed OpenCode path, Hakim may support verified upgrades/removal from explicitly recognized older manifests. That lifecycle support is bounded by the implementation and tests; it is not a promise that every historical development snapshot can be upgraded automatically.

## Capability deprecation

During beta:

1. A misleading but compatible capability name may remain as a compatibility ID while its maintained semantics are clarified.
2. A replacement name or capability is a separate product-contract change and must be introduced intentionally and projected across maintained hosts.
3. A canonical capability must not be removed in the same change that first announces its deprecation.
4. Breaking removal requires an explicit compatibility-impact decision and release notes.

`hakim-gain` follows rule 1: the ID remains for beta compatibility while its maintained behavior is evidence-status reporting, not a quantified-gain claim.

## Stable-release prerequisites

Before Hakim can recommend stable `1.0.0`, the intended release candidate must have, at minimum:

- a green canonical repository gate on the immutable release candidate;
- accepted current-path live-host evidence for every host claimed as maintained at stable release;
- an immutable release identity and reproducible release artifacts;
- a generated and verified public SBOM for the release source/product inventory;
- current security, compatibility, installation, support, and deprecation documentation;
- no unresolved release-blocking correctness, security, distribution, or product-truth defects;
- an explicit release decision.

Stable release does not automatically create an SLA, enterprise certification, or LTS line. Any such commitment requires a separate published policy.
