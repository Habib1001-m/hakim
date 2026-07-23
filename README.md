# Hakim (حَكِيم)

Hakim is an evidence-bound coding governance toolkit for AI-assisted
development. It guides agents and reviewers toward the smallest safe change,
keeps claims tied to inspectable evidence, and refuses conclusions that exceed
the observed scope.

## Status

Hakim `1.0.0-beta.1` is public beta software distributed from source. The
repository is not currently published as an npm package or public marketplace
extension. `package.json` remains marked as private to prevent accidental
registry publication.

## Quick start

Clone Hakim, verify the public surface, and inspect the host-specific install
plan before making changes to another repository:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run doctor:fast
npm run plan:install -- --host all
```

Choose the host you actually use.

### OpenCode

Preview the project-local bundle first, then apply it only after reviewing the
manifest:

```bash
npm run plan:install -- --host opencode -- --target /path/to/project
npm run install:opencode -- --target /path/to/project
npm run install:opencode -- --target /path/to/project --apply
```

Start OpenCode from the target project and use `/hakim-help` or `/hakim full ...`.
The installer is create-only and does not edit `opencode.json`.

### Codex

Preview the repository-local Codex integration and launcher:

```bash
npm run plan:install -- --host codex
npm run launch:codex -- --cwd /path/to/project
```

After reviewing the plan, launch Codex with:

```bash
npm run launch:codex -- --apply --cwd /path/to/project
```

Installation, activation, and SessionStart hook trust remain managed by Codex.
Review `/plugins` and `/hooks` before enabling the integration.

### Claude Code

Preview the direct plugin-directory launch:

```bash
npm run plan:install -- --host claude-code
npm run launch:claude -- --cwd /path/to/project
```

After review:

```bash
npm run launch:claude -- --apply --cwd /path/to/project
```

Hakim does not persistently install or modify Claude Code configuration through
this launcher.

### GitHub Copilot

Compare the target repository first. The installer creates the supported
instruction file only when it is absent and never overwrites an existing one.

```bash
npm run plan:install -- --host github-copilot --target /path/to/project
npm run install:copilot -- --target /path/to/project
npm run install:copilot -- --target /path/to/project --apply
```

See [Install Hakim](core/hakim-skill/INSTALL.md) for the complete host-by-host
flow and trust boundaries.

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
