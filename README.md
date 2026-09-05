# Hakim (حَكِيم)

Hakim helps capable AI coding agents make smaller, safer, better-justified changes without turning them into workflow bots.

> **Free reasoning. Safe action. Evidence-bound claims.**

The core decision ladder is deliberately small:

```text
need? → reuse? → stdlib? → native platform? → accepted dependency? → smaller clear implementation? → minimum custom code
```

Hakim optimizes for the **smallest sufficient safe change**, not the fewest lines. Security, privacy, accessibility, migrations, rollback safety, data integrity, trust boundaries, and user trust remain real constraints.

## Install

Hakim is public beta software. Install a reviewed release by immutable release tag:

```bash
export HAKIM_REF=<release-tag>
```

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, install **Hakim**, review/trust the SessionStart hook, and start a new thread.

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

From the target repository:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install
```

OpenCode support is project-local, refuses unsafe or conflicting managed state, preserves unrelated `.opencode` content, and does not edit `opencode.json`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for lifecycle details.

## Six capabilities

Hakim has one canonical capability model across all supported hosts:

- `hakim` — core execution judgment and `lite | full | ultra | off` mode control.
- `review` — bounded removable-complexity review of an explicit diff or file scope.
- `audit` — deeper evidence-backed repository audit when broader evidence is materially required.
- `debt` — live deliberate-shortcut and technical-debt provenance.
- `status` — what the current evidence actually establishes.
- `help` — current-host usage, modes, capabilities, and trust boundaries.

Host syntax may differ; capability semantics do not. The core policy is automatically present where the host supports that lifecycle. Specialized capabilities are loaded when needed.

## Modes

- `lite` — keep the requested outcome, with lighter Hakim intervention.
- `full` — apply the complete judgment model. Default.
- `ultra` — challenge additions aggressively and demand stronger justification for custom code, abstractions, and dependencies.
- `off` — do not apply Hakim guidance.

Use the installed `help` capability or the host plugin UI for current host-native invocation forms.

## Operating model

```text
UNDERSTAND → DECIDE → EXECUTE → VERIFY → CLOSE
```

Hakim tells the agent what must remain true, not which fixed sequence of commands to perform. Investigation depth and verification depth are earned by actual scope, uncertainty, risk, and failure cost.

## Supported hosts

Hakim maintains native product surfaces for:

- Codex
- Claude Code
- GitHub Copilot CLI
- OpenCode

See [Supported Hosts](SUPPORTED_HOSTS.md). Host-native trust, permissions, sandboxing, managed policy, plugin lifecycle, and removal controls remain authoritative.

## Development

Repository development requires Node.js 22+ and Python 3.10+.

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

`npm test` checks maintained product/runtime behavior and the release package. `npm run package:release` builds the deterministic skill ZIP, CycloneDX SBOM, checksums, and release manifest.

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

A passing test or successful installation proves only the checked scope. Hakim does not claim universal model-quality improvement, performance gain, token savings, cost savings, security certification, or return on investment without separate accepted evidence.
