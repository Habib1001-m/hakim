# Hakim (حَكِيم)

Hakim helps capable AI coding agents make smaller, safer, better-justified changes without turning them into workflow bots.

> **Free reasoning. Safe action. Evidence-bound claims.**

Its default decision ladder is simple:

```text
need? → reuse? → stdlib? → native platform? → existing dependency? → one clear line? → minimum custom code
```

Security, privacy, accessibility, migrations, rollback safety, data integrity, and user trust stay hard boundaries.

## Install

Hakim is public beta software. For a supported cross-host release install, use the release tag for the candidate. The release record binds that tag to the reviewed exact commit.

Set the release tag you intend to install:

```bash
export HAKIM_REF=<release-tag>
```

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, install **Hakim**, trust the SessionStart hook, and start a new thread.

### Claude Code

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$HAKIM_REF"
claude plugin install hakim@hakim
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add "Habib1001-m/hakim#$HAKIM_REF"
copilot plugin install hakim@hakim
```

### OpenCode

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install
```

Hakim installs OpenCode support project-locally, refuses unsafe or conflicting managed state, and does not edit `opencode.json`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for lifecycle details.

## Capabilities

Hakim maintains six capability IDs:

- `hakim` — apply or change Hakim mode.
- `hakim-review` — review the current diff for removable complexity.
- `hakim-audit` — audit active repository surfaces for justified simplification.
- `hakim-debt` — separate live technical debt from examples or stale records.
- `hakim-gain` — show bounded evidence status; the compatibility name does not claim quantified gain.
- `hakim-help` — show modes, capabilities, host syntax, and boundaries.

The core policy is automatically present where the host supports that lifecycle. Specialized capabilities remain explicit user actions.

## Modes

- `lite` — implement the request and name the smaller safe alternative.
- `full` — apply the complete smallest-safe-diff discipline. Default.
- `ultra` — challenge additions and prefer deletion before new code.
- `off` — do not apply Hakim guidance.

Invocation syntax differs by host; use `hakim-help` or the host's plugin UI to discover it.

## Supported hosts

Hakim maintains native product surfaces for:

- Codex
- Claude Code
- GitHub Copilot CLI
- OpenCode

See [Supported Hosts](SUPPORTED_HOSTS.md) for the exact product boundary. Host-native trust, permissions, sandboxing, managed policy, plugin lifecycle, and removal controls remain authoritative.

## Development

Repository development requires Node.js 22+ and Python 3.10+.

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

`npm test` checks the maintained product/runtime surface and release package. `npm run package:release` builds the deterministic skill ZIP, CycloneDX SBOM, checksums, and release manifest.

## Documentation

- [Install Hakim](core/hakim-skill/INSTALL.md)
- [Supported Hosts](SUPPORTED_HOSTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Versioning](VERSIONING.md)
- [Contributing](CONTRIBUTING.md)

Hakim is inspired by Ponytail. Attribution and applicable third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Claim boundary

A passing test or successful installation proves only that checked scope. Hakim does not claim universal model-quality improvement, performance gain, token savings, cost savings, security certification, or return on investment without separate evidence.
