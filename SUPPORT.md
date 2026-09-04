# Support Policy

Hakim is public beta software maintained on a best-effort basis. This policy does not create a paid support plan, response-time SLA, enterprise certification, or long-term-support commitment.

## Supported product

- The current beta line is the maintained product line.
- Supported host surfaces are listed in [SUPPORTED_HOSTS.md](SUPPORTED_HOSTS.md).
- Security reports should follow [SECURITY.md](SECURITY.md).
- Host-native trust, permissions, sandboxing, managed policy, caches, and lifecycle controls remain authoritative.

## Compatibility and upgrades

A prerelease version identifies a specific product release. Breaking changes to canonical capabilities, modes, supported host surfaces, or managed lifecycle behavior require an explicit versioned product decision.

For OpenCode, Hakim may recognize selected older managed manifests for safe upgrade/removal. That support is bounded by the implementation and tests; it is not a promise that every historical development snapshot can be upgraded automatically.

`hakim-gain` remains a beta compatibility ID whose maintained behavior is bounded evidence-status reporting rather than a quantified performance claim.

## Before stable 1.0

A stable recommendation requires a green release candidate, reproducible release artifacts, current security/install/support documentation, and successful exact-source checks for every host claimed as maintained. Stable release would still not imply an SLA or LTS policy unless separately published.
