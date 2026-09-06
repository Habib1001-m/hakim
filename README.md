# Hakim (حَكِيم)

Hakim is a developer tool for AI coding agents: a compact judgment layer that helps capable agents make smaller, safer, better-justified changes without turning them into workflow bots.

> **Free reasoning. Safe action. Evidence-bound claims.**

Hakim optimizes for the **smallest sufficient safe change**, not the fewest lines. Security, privacy, accessibility, migrations, rollback safety, data integrity, compatibility, trust boundaries, and user trust remain real constraints.

Its decision ladder is deliberately small:

```text
need? → reuse? → stdlib? → native platform? → accepted dependency? → smaller clear implementation? → minimum custom code
```

## Install

Hakim is public beta software. Install a reviewed release by immutable release tag:

```bash
export HAKIM_REF=<release-tag>
```

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, install **Hakim**, approve the host trust prompt if shown, and start a new thread.

### Claude Code

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$HAKIM_REF"
claude plugin install hakim@hakim
```

Start a fresh Claude session after installation and approve the host hook-trust prompt if shown.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add "Habib1001-m/hakim#$HAKIM_REF"
copilot plugin install hakim@hakim
```

### OpenCode

From the target repository:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install
```

OpenCode support is project-local, refuses unsafe or conflicting managed state, preserves unrelated `.opencode` content, and does not edit `opencode.json`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for host-specific lifecycle details.

## Six capabilities

Hakim has one canonical capability model across all supported hosts:

- `hakim` — core execution judgment and mode control.
- `review` — bounded read-only review for removable complexity in an explicit scope.
- `audit` — deeper evidence-backed repository audit when broader evidence is materially required.
- `debt` — live deliberate-shortcut and technical-debt provenance.
- `status` — what the current evidence actually establishes.
- `help` — current-host usage, modes, capabilities, and trust boundaries.

Host syntax may differ; capability meaning does not. Where the host supports startup/system injection, the compact Hakim core is present automatically. Specialized capabilities are loaded when needed.

## Modes

Modes belong to `hakim`; they are not separate skills:

- `lite` — execute the request and mention a materially smaller safe alternative when one exists.
- `full` — default; apply the complete Hakim decision model with proportional verification.
- `ultra` — challenge additions, abstractions, and dependencies aggressively; prefer deletion and reuse without weakening the required outcome or real guards.
- `off` — do not apply Hakim guidance beyond host, repository, and safety boundaries.

Use the installed `help` capability or the host plugin UI for current host-native invocation forms.

## Operating model

```text
UNDERSTAND → DECIDE → EXECUTE → VERIFY → CLOSE
```

Hakim tells the agent what must remain true, not which fixed sequence of commands to perform. Investigation and verification depth are earned by actual scope, uncertainty, risk, and failure cost.

## Supported hosts

Hakim maintains native product surfaces for:

- Codex
- Claude Code
- GitHub Copilot CLI
- OpenCode

See [Supported Hosts](SUPPORTED_HOSTS.md). Host-native trust, permissions, sandboxing, managed policy, plugin lifecycle, caches, and removal controls remain authoritative.

## Development

Repository development requires Node.js 22+ and Python 3.10+.

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

`npm test` checks maintained product/runtime behavior and release packaging. `npm run package:release` builds the deterministic skill ZIP, CycloneDX SBOM, checksums, and release manifest.

## Documentation

- [Install Hakim](core/hakim-skill/INSTALL.md)
- [Supported Hosts](SUPPORTED_HOSTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Versioning](VERSIONING.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

Hakim is inspired by Ponytail. Attribution and applicable third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Claim boundary

A passing test or successful installation proves only the checked scope. Hakim does not claim universal model-quality improvement, performance gain, token savings, cost savings, security certification, adoption, or return on investment without separate accepted evidence.
