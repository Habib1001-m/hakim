# Hakim (حَكِيم)

Hakim helps capable AI coding agents make smaller, safer, better-justified changes without turning them into workflow bots.

> **Free reasoning. Safe action. Evidence-bound claims.**

Before adding code, Hakim uses a smallest-safe decision ladder:

```text
need? → reuse existing code? → stdlib? → native platform? → existing dependency? → one clear line? → minimum custom code
```

Hakim keeps security, privacy, migrations, rollback safety, accessibility, data integrity, and user trust as hard boundaries.

## Status

Hakim is public beta software.

- Frozen prerelease: `1.0.0-beta.4` at exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.
- Moving `main`: unreleased development `1.0.0-beta.4.post1`; not a frozen candidate.
- Frozen beta.4 has accepted exact-identity live-host evidence for Codex, Claude Code, GitHub Copilot CLI, and OpenCode.
- No npm registry package or central marketplace listing is claimed.

Machine-readable identity and host evidence live under [`conformance/`](conformance/).

## Quick start

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Open `/plugins`, install **Hakim**, trust the SessionStart hook, and start a new thread. Skills include `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.

### Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

The catalog entry pins the Claude plugin to the exact frozen beta.4 source. Commands include `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:gain`, and `/hakim:help`.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

The catalog entry pins the Copilot plugin to the exact frozen beta.4 source. Moving development supports `/hakim/hakim full`, `/hakim/hakim lite`, `/hakim/hakim ultra`, and `/hakim/hakim off`.

### OpenCode

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
```

Hakim installs a guarded project-local bundle, refuses unsafe/conflicting state, and does not edit `opencode.json`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for full lifecycle details.

## Core capabilities

- Canonical smallest-safe coding policy.
- Native product surfaces for Codex, Claude Code, GitHub Copilot CLI, and OpenCode.
- Quiet host-native presence and bounded `lite`, `full`, `ultra`, and `off` modes where supported.
- Review, audit, debt, help, and evidence-status capabilities.
- Deterministic doctor/preflight checks and reproducible release packaging.
- Guarded OpenCode create/adopt/upgrade/remove lifecycle with no-clobber rollback.

`hakim-gain` is an evidence-status compatibility name, not a quantified performance claim.

## Design principles

**Capable-model freedom.** Hakim constrains objective consequences and unsupported claims before reasoning paths. It is not a workflow engine.

**Host-native integration.** Capability parity is semantic; each host keeps its own trust, permissions, lifecycle, and invocation model.

**Evidence-bound truth.** Repository conformance, live-host evidence, behavioral evidence, product usefulness, release authorization, and performance claims remain separate.

## Development

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Useful checks:

```bash
npm run doctor
npm run plan:install -- --host all
npm run check:distribution-identity
npm run package:skill
```

Repository development requires Node.js 22+ and Python 3.10+.

## Documentation

- [Install Hakim](core/hakim-skill/INSTALL.md)
- [Supported Hosts](SUPPORTED_HOSTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Versioning](VERSIONING.md)
- [Contributing](CONTRIBUTING.md)

## Upstream relationship

Hakim is a governance-focused derivative inspired by Ponytail. It is not the official upstream project and does not claim inherited benchmark results. See [UPSTREAM.md](UPSTREAM.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Evidence boundaries

A passing deterministic check proves only its checked scope. Hakim does not claim universal model-quality improvement, performance gain, token savings, return on investment, or complete protection from unrelated local processes.
