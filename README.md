# Hakim (حَكِيم)

Hakim is an evidence-bound coding governance toolkit for AI-assisted
development. It guides agents and reviewers toward the smallest safe change,
keeps claims tied to inspectable evidence, and refuses conclusions that exceed
the observed scope.

## Status

Hakim is public source and remains pre-release software.

The repository is not currently published as an npm package or marketplace
extension. `package.json` remains marked as private to prevent accidental
registry publication.

## Core capabilities

- A canonical coding skill focused on minimal, safe changes.
- Host projections for Codex, Claude Code, GitHub Copilot, and OpenCode.
- Deterministic PR Guardian checks for dependency and evidence-boundary drift.
- Bounded review, audit, doctor, host-preflight, and install-planning commands.
- A native OpenCode package with integrity records, exact path ownership,
  containment checks, lifecycle locking, quarantine, and rollback safeguards.
- Local packaging and verification tools that do not require a runtime service.

## Requirements

- Node.js 18 or newer.
- Python 3.
- Git.
- A supported coding-agent host for host-specific integration.

## Local validation

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim

npm test
npm run doctor
```

Build the canonical skill package:

```bash
npm run package:skill
```

Build the native plugin package:

```bash
npm run build:native-plugin
```

Generated packages are local build outputs. They are not evidence of registry
publication, signing, notarization, third-party attestation, or broad host
compatibility.

## Supported hosts

Hakim maintains integration surfaces for:

- Codex
- Claude Code
- GitHub Copilot
- OpenCode

Host-native approval, trust, sandboxing, activation, and removal controls remain
authoritative. See [Supported Hosts](SUPPORTED_HOSTS.md).

## Evidence boundaries

A passing deterministic check means only that the enabled rule set found no
matching violation. It is not a substitute for correctness, security,
architecture, or semantic review.

Hakim does not claim model-quality improvement, universal compatibility,
performance gains, token savings, return on investment, or complete protection
from unrelated local processes.

See [Known Limitations](KNOWN_LIMITATIONS.md).

## Privacy

Telemetry is disabled by default. Hakim does not enable raw prompt or source
code logging by default.

Do not commit credentials, private prompts, sensitive evidence, or customer
source code to bug reports or test fixtures.

## Security

Report suspected vulnerabilities privately as described in
[SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

## Upstream relationship

Hakim is an independently maintained governance-focused derivative of
Ponytail. It is not a GitHub fork, not an official Ponytail distribution, and
does not claim automatic compatibility or synchronization.

See [UPSTREAM.md](UPSTREAM.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
