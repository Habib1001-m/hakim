# Security Policy

## Supported versions

Security fixes are maintained on a best-effort basis for the latest public
`main` branch and the current `1.0.x` pre-release line.

Hakim does not currently provide a paid support plan, response-time guarantee,
enterprise compliance certification, or long-term-support release.

## Reporting a vulnerability

Use a GitHub private security advisory whenever possible. Do not open a public
issue containing exploit details, credentials, private source code, raw prompts,
sensitive filesystem paths, or unsanitized runtime evidence.

Include the affected version or commit, the smallest safe reproduction,
expected and observed behavior, impact, and any mitigation already tested.

## Security design boundaries

Hakim uses defensive controls including exact ownership inventories and content
hashes, real-path containment checks, refusal of unsafe path states, lifecycle
locking, quarantine, no-clobber rollback, least-privilege workflow permissions,
and immutable action references.

These controls reduce risk but do not prove the absence of vulnerabilities.
Local write access by unrelated processes remains part of the threat model.

## Privacy

Telemetry is disabled by default. Raw prompts and source code are not logged by
default. Runtime evidence must be minimized, sanitized, and free of credentials
or private customer material.

## Host boundaries

Host-native trust, approval, sandboxing, hook activation, and permission
controls remain authoritative. Hakim does not rotate credentials, repair host
configuration automatically, or bypass host security controls.
