# Security Policy

Hakim is public beta software. Security fixes are maintained on a best-effort basis for the current beta line; no paid support plan, response-time guarantee, compliance certification, or LTS release is implied.

## Report a vulnerability

Use a GitHub private security advisory whenever possible. Do not open a public issue containing exploit details, credentials, private source code, raw prompts, sensitive filesystem paths, or unsanitized runtime data.

Include the affected version or commit, the smallest safe reproduction, expected and observed behavior, impact, and any mitigation already tested.

## Security boundaries

Hakim uses the host's native trust, approval, sandbox, permission, plugin, managed-policy, and removal controls. It does not bypass or repair those controls automatically.

The managed OpenCode lifecycle additionally uses bounded ownership, content validation, symlink/non-regular-file refusal, staged mutation, quarantine-backed rollback, post-mutation verification, and no-clobber restoration. These controls reduce risk but do not create a cross-process filesystem lock or immunity to malicious concurrent local replacement.

Public CI uses least-privilege permissions and immutable action references.

## Release artifacts

The release build produces a deterministic CycloneDX JSON SBOM plus SHA-256 checksums and a release manifest. These improve inspectability but are not signing, notarization, external provenance attestation, or proof that the software is vulnerability-free.

## Privacy

Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging as a product feature. Bounded host-owned mode state does not persist raw prompts, source code, reasoning, credentials, or transcript content.
