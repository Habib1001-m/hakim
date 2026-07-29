# Support and Deprecation Policy

Hakim is currently public beta software. This policy defines the support boundary for the beta line and the minimum policy required before a stable `1.0.0` recommendation. It does not create a paid support plan, response-time SLA, or long-term-support commitment.

## Current beta support

- Best-effort maintenance applies to the latest public `main` candidate and the most recent explicitly released beta line.
- Security reports should use GitHub private security advisories as described in `SECURITY.md`.
- Host compatibility is limited to the documented maintained surfaces in `SUPPORTED_HOSTS.md`; host-native permissions, trust, policy, and lifecycle controls remain authoritative.
- A repository or live-host `PASS` is not a promise of universal compatibility or a support SLA.

## Product identities and upgrades

A prerelease version is a product identity, not a label for arbitrary moving bytes. Material product changes that affect distributed plugin/runtime bytes must advance the prerelease identity before they are promoted as a new candidate.

Current-path live-host evidence belongs to the exact candidate it observed. Accepted evidence for an older candidate may remain historical, but it must not be silently reused to promote a newer candidate.

For the managed OpenCode path, Hakim may support verified upgrades/removal from explicitly recognized older manifests. That lifecycle support is bounded by the implementation and tests; it is not a general promise that every historical development snapshot can be upgraded automatically.

## Capability deprecation

During beta:

1. A misleading but compatible capability name may remain as a compatibility ID while its maintained semantics are clarified.
2. A replacement name or capability is a separate product-contract change and must be introduced intentionally, documented, and projected across all maintained hosts before it becomes canonical.
3. A canonical capability must not be removed in the same change that first announces its deprecation.
4. Breaking removal requires an explicit compatibility-impact decision and release notes.

`hakim-gain` currently follows rule 1: the ID remains for beta compatibility, while the maintained behavior is explicitly **evidence-status reporting**, not a quantified-gain claim. A future canonical rename is not implied by this document and must pass the normal capability-change process.

## Stable-release prerequisites

Before Hakim can recommend stable `1.0.0`, the release candidate must have, at minimum:

- a green canonical repository gate on the immutable release candidate;
- accepted current-path live-host evidence for every host claimed as maintained at stable release;
- an immutable release identity and reproducible release artifacts;
- a generated, verified public SBOM for the release source/product inventory;
- current security, compatibility, installation, support, and deprecation documentation;
- no unresolved P0/P1 product-readiness findings;
- an explicit operator authorization for stable release.

Stable release does not automatically create an SLA, enterprise certification, or LTS line. Any such commitment requires a separate policy and explicit publication.

## External evaluation

External evaluator recruitment is currently suspended. This support policy does not authorize an evaluator campaign, public recruitment, registry publication, or central marketplace promotion.
