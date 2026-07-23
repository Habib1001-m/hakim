# Security Policy

## Supported versions

Security fixes are maintained on a best-effort basis for the latest public
`main` branch and the current `1.0.0-beta.1` public beta line.

Hakim does not currently provide a paid support plan, response-time guarantee,
enterprise compliance certification, or long-term-support release.

## Reporting a vulnerability

Use a GitHub private security advisory whenever possible. Do not open a public
issue containing exploit details, credentials, private source code, raw prompts,
sensitive filesystem paths, or unsanitized runtime evidence.

Include the affected version or commit, the smallest safe reproduction,
expected and observed behavior, impact, and any mitigation already tested.

## Security design boundaries

Hakim's maintained product paths use defensive controls appropriate to each host.
For the project-local OpenCode lifecycle these include canonical content hashes,
refusal of symlink/non-regular or conflicting target state, create-only writes,
exact-match removal, quarantine-backed removal, and rollback on failed mutation.
Public CI uses least-privilege permissions and immutable action references.

These controls reduce risk but do not prove the absence of vulnerabilities. The
project-local OpenCode lifecycle does not claim a cross-process operation lock or
immunity to malicious/concurrent filesystem replacement between every validation
and mutation checkpoint. Local write access by unrelated processes remains part
of the threat model.

## Privacy

Telemetry is disabled by default. Raw prompts and source code are not logged by
default. Runtime evidence must be minimized, sanitized, and free of credentials
or private customer material.

## Host boundaries

Host-native trust, approval, sandboxing, hook activation, and permission
controls remain authoritative. Hakim does not rotate credentials, repair host
configuration automatically, or bypass host security controls.
