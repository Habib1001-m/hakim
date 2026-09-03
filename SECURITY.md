# Security Policy

## Supported versions

Security fixes are maintained on a best-effort basis for moving development and the current frozen `1.0.0-beta.4` public-beta line. Historical snapshots do not carry an active support guarantee merely because evidence exists for them.

Hakim does not provide a paid support plan, response-time guarantee, enterprise compliance certification, or long-term-support release. See [`SUPPORT.md`](SUPPORT.md).

## Reporting a vulnerability

Use a GitHub private security advisory whenever possible. Do not open a public issue containing exploit details, credentials, private source code, raw prompts, sensitive filesystem paths, or unsanitized runtime evidence.

Include the affected version or commit, the smallest safe reproduction, expected and observed behavior, impact, and any mitigation already tested.

## Security design boundaries

Hakim uses defensive controls appropriate to each host. For the project-local OpenCode lifecycle these include canonical content hashes, refusal of symlink/non-regular or conflicting target state, bounded manifest adoption, staged transactional upgrade with rollback, manifest-authorized removal, quarantine-backed recovery, and post-mutation verification.

Public CI uses least-privilege permissions and immutable action references.

These controls reduce risk but do not prove the absence of vulnerabilities. The OpenCode lifecycle does not claim a cross-process operation lock or immunity to malicious/concurrent filesystem replacement between every validation and mutation checkpoint. Local write access by unrelated processes remains part of the threat model.

## Supply-chain artifacts

The release pipeline builds a deterministic CycloneDX JSON SBOM from the Git-tracked source/product inventory and includes that SBOM in the release checksum manifest.

The SBOM does not claim to inventory host binaries, model providers, operating-system packages, or unrelated local tooling.

Checksums, reproducibility, and the SBOM improve inspectability but are not signing, notarization, provenance attestation, or proof that the software is vulnerability-free.

## Privacy

Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging as a product feature.

Repository conformance/evidence artifacts are validation data rather than telemetry. Any captured runtime evidence must be minimized, sanitized, and free of credentials or private customer material.

## Host boundaries

Host-native trust, approval, sandboxing, hook activation, permissions, managed policy, and removal controls remain authoritative. Hakim does not rotate credentials, repair host configuration automatically, or bypass host security controls.
