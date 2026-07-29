# Hakim (حَكِيم)

Hakim helps capable AI coding agents make smaller, safer, better-justified changes without turning them into workflow bots.

Its operating idea is simple:

> **Free reasoning. Safe action. Evidence-bound claims.**

Before adding code, Hakim pushes the agent through the smallest-safe decision ladder:

```text
need? → reuse existing code? → stdlib? → native platform? → existing dependency? → one clear line? → minimum custom code
```

Hakim does not treat fewer lines as an absolute goal. Security, privacy, migrations, rollback safety, accessibility, data integrity, and user trust remain hard boundaries.

## Project status

Hakim is public beta software.

| Surface | Current truth |
|---|---|
| Latest frozen prerelease | `1.0.0-beta.4` at `evidence/beta4-r31-5d00039` |
| Unreleased development | R3.2 operational-presence work accepted through F04 |
| Next development gate | F05 — Objective Completion Truth |
| Stable `1.0.0` | Not authorized |
| External evaluator campaign | Suspended pending a separate product decision |
| npm registry / central marketplace publication | Not claimed |

`main` development and a frozen prerelease identity are intentionally different things. Material work may land on `main` before the next prerelease is cut; older live-host or behavioral evidence remains bounded to the exact immutable candidate on which it was observed.

R3.2 has live Copilot CLI evidence for silent parent-session presence, bounded persisted modes, current-turn mode control, and subagent continuity. That development evidence is not silently relabeled as full release-candidate host acceptance.

See [Product Readiness](docs/PRODUCT_READINESS.md), [Operational Presence](docs/OPERATIONAL_PRESENCE.md), and [Supported Hosts](SUPPORTED_HOSTS.md) for the maintained truth.

## Quick start

Choose the coding host you already use. None of the maintained first-run paths requires manually cloning Hakim.

### Codex

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Open `/plugins`, select **Hakim**, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Use the installed skills, for example `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.

### Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Start Claude Code normally. Maintained commands include `/hakim:help`, `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, and `/hakim:gain`.

`gain` is the retained beta compatibility name for evidence-status reporting; it does not imply a quantified performance gain.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Start Copilot normally. On the accepted R3.2 development path, Hakim is present automatically through host-native lifecycle hooks; no repository instruction file is required for normal activation.

Explicit mode control uses the plugin-qualified skill route:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

Non-default modes use bounded plugin-owned state; `full` is the stateless default. The accepted R3.2 subagent path reuses the same maintained presence authority rather than introducing a second policy engine.

`.github/copilot-instructions.md` remains an optional repository baseline, not the primary Hakim product surface.

### OpenCode

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

The Git-backed bootstrap invokes Hakim's guarded project-local managed lifecycle from the public repository. It persists an exact install manifest, supports bounded create/adopt/transactional-upgrade paths, can remove supported older verified installations with a newer CLI, refuses conflicting or unsafe state, and does not edit `opencode.json` or install global Hakim state.

Start OpenCode from the same repository and use `/hakim-help` or `/hakim full ...`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for complete host-specific lifecycle, dry-run, removal, and trust boundaries.

## Core capabilities

- One canonical coding policy focused on the smallest sufficient, coherent, safe change.
- Native product surfaces for Codex, Claude Code, GitHub Copilot CLI, and OpenCode.
- Host-native skills, commands, agents, and lifecycle controls where the host supports them.
- Deterministic PR Guardian, audit, doctor, host-preflight, and installation-planning checks.
- Guarded OpenCode project-local lifecycle with bounded ownership, quarantine-backed mutation, verification, and no-clobber rollback.
- Reproducible canonical skill packaging, deterministic CycloneDX source/product-inventory SBOM, and checksum/manifest verification.
- Explicit evidence boundaries separating repository conformance, live-host acceptance, behavioral evidence, product usefulness, and release authorization.

## Requirements

For product use, install the supported host you intend to use. The OpenCode Git-backed bootstrap additionally requires Node.js/npm; the shipped package declares Node.js `>=22`.

Repository development and local validation require:

- Node.js 22 or newer. Public CI uses Node 24 for the canonical gate and Node 22/26 as compatibility edges for the shipped JavaScript/OpenCode surface.
- Python 3.10 or newer. Public CI currently validates Python 3.11.
- Git.

For the maintained Codex plugin-hook path, use Codex `0.131.0` or newer.

## Local validation

`npm test` is the canonical repository gate used by Public CI.

```bash
npm test
npm run doctor
npm run plan:install -- --host all
```

Historical controlled-experiment fixtures are intentionally separate from the permanent product gate:

```bash
npm run test:evidence:historical
```

Build the canonical skill package:

```bash
npm run package:skill
```

Generated artifacts are local build evidence. They are not proof of registry publication, signing, notarization, third-party attestation, universal host compatibility, or product effectiveness.

## Architecture

Hakim keeps one behavioral authority and projects it through host-native surfaces rather than forcing every host into a lowest-common-denominator adapter.

See:

- [Architecture](docs/ARCHITECTURE.md)
- [Operational Presence](docs/OPERATIONAL_PRESENCE.md)
- [Supported Hosts](SUPPORTED_HOSTS.md)
- [Product Readiness](docs/PRODUCT_READINESS.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)

## Evidence boundaries

A passing deterministic check means only that the enabled rule set found no matching violation. It is not a substitute for correctness, security, architecture, semantic review, live-host validation, or product usefulness.

A changed prerelease identity, first-run transport, lifecycle, or runtime behavior requires its own evidence before that exact path is promoted. Prior evidence remains historical rather than being silently inherited.

Hakim does not claim universal model-quality improvement, performance gain, token savings, return on investment, or complete protection from unrelated local processes.

## Privacy and security

Hakim does not implement a product telemetry collection service and does not enable raw prompt or source-code logging.

Do not commit credentials, private prompts, sensitive evidence, or customer source code to issues, test fixtures, or public reports.

Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

## Upstream relationship

Hakim is an independently maintained governance-focused derivative of Ponytail. It is not a GitHub fork, not an official Ponytail distribution, and does not claim automatic compatibility or synchronization.

See [UPSTREAM.md](UPSTREAM.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
