# Hakim (حَكِيم)

Hakim is an evidence-bound coding governance toolkit for AI-assisted development. It guides agents and reviewers toward the smallest safe change, keeps claims tied to inspectable evidence, and refuses conclusions that exceed the observed scope.

## Status

Hakim `1.0.0-beta.1` is public beta software distributed from source and host-native Git marketplaces. It is not published to npm and is not claiming a central marketplace/directory listing. `package.json` remains private to prevent accidental registry publication.

## Quick start

Choose the coding host you already use. Codex, Claude Code, and GitHub Copilot can install Hakim directly from this GitHub repository; they do not require cloning Hakim first.

### Codex

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Open `/plugins`, select **Hakim**, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Use Hakim through the installed skills, for example `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.

### Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Then start Claude Code normally. Use `/hakim:help`, `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, and `/hakim:gain`. Claude also receives Hakim plugin agents, including read-only specialists and an isolated worktree implementer.

### GitHub Copilot

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Verify with `copilot plugin list`, `/skills list`, and `/agent`. The plugin provides six Hakim skills plus specialized review, audit, debt, evidence, and implementation agents. `.github/copilot-instructions.md` remains an optional repository baseline rather than the full Hakim product.

### OpenCode

OpenCode currently uses Hakim's guarded project-local installer. From a Hakim checkout:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run install:opencode -- --target /path/to/project
npm run install:opencode -- --target /path/to/project --apply
```

Start OpenCode from the target project and use `/hakim-help` or `/hakim full ...`. The installer is create-only, verifies the canonical bundle paths and hashes, and does not edit `opencode.json`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for complete host-specific lifecycle and trust boundaries.

## Core capabilities

- A canonical coding policy focused on minimal, safe changes.
- Native host plugins for Codex, Claude Code, and GitHub Copilot.
- A guarded project-local native OpenCode plugin bundle.
- Host-specialized skills, agents, commands, and lifecycle controls where the host supports them.
- Deterministic PR Guardian checks for dependency and evidence-boundary drift.
- Bounded review, audit, doctor, host-preflight, and install-planning commands.
- OpenCode canonical-manifest hashing, create-only installation, exact-match removal, quarantine-backed removal, and rollback safeguards.
- Local packaging and verification tools that do not require a runtime service.

## Requirements

For product use, install the supported host you intend to use. Repository development and local validation additionally require:

- Node.js 18 or newer.
- Python 3.
- Git.

For the full Codex product path in this beta, use Codex `0.130.0` or newer. Earlier Codex builds had known plugin-hook discovery and trust gaps and are outside Hakim's claimed SessionStart compatibility boundary.

## Local validation

```bash
npm test
npm run doctor
npm run plan:install -- --host all
```

Build the canonical skill package:

```bash
npm run package:skill
```

Generated skill packages are local build outputs. They are not evidence of registry publication, signing, notarization, third-party attestation, or universal host compatibility.

## Supported hosts

Hakim maintains product surfaces for:

- Codex
- Claude Code
- GitHub Copilot
- OpenCode

Each host intentionally uses its strongest native extension model rather than a lowest-common-denominator adapter. Host-native approval, trust, sandboxing, activation, plugin policy, and removal controls remain authoritative. See [Supported Hosts](SUPPORTED_HOSTS.md).

## Evidence boundaries

A passing deterministic check means only that the enabled rule set found no matching violation. It is not a substitute for correctness, security, architecture, semantic review, or live host validation.

Hakim does not claim model-quality improvement, universal compatibility, performance gains, token savings, return on investment, or complete protection from unrelated local processes.

See [Known Limitations](KNOWN_LIMITATIONS.md).

## Privacy

Telemetry is disabled by default. Hakim does not enable raw prompt or source code logging by default.

Do not commit credentials, private prompts, sensitive evidence, or customer source code to bug reports or test fixtures.

## Security

Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

## Upstream relationship

Hakim is an independently maintained governance-focused derivative of Ponytail. It is not a GitHub fork, not an official Ponytail distribution, and does not claim automatic compatibility or synchronization.

See [UPSTREAM.md](UPSTREAM.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
