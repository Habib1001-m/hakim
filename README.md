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
| Latest frozen prerelease | `1.0.0-beta.4` at exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3` (`evidence/beta4-r31-5d00039`) |
| Moving `main` | `1.0.0-beta.4.post1`, explicit unreleased development; not a frozen candidate and not eligible for release/promotion evidence |
| Immediate repository gate | P0 — Truthful Immutable Distribution Identity |
| Next feature gate after P0 | F05 — Objective Completion Truth |
| Stable `1.0.0` | Not authorized |
| External evaluator campaign | Suspended pending a separate product decision |
| npm registry / central marketplace publication | Not claimed |

`conformance/distribution-identity.json` is the machine-readable authority for the frozen candidate, moving development identity, effective normal-install pins, and host-resolution proof state. P0 remains `HOLD_FOR_HOST_NATIVE_PROOF`: Codex is accepted, while Claude Code, GitHub Copilot CLI, and OpenCode still require independent accepted packets.

Frozen prerelease and unreleased development are intentionally different identities. Material work may land on `main` before the next prerelease is cut; older live-host or behavioral evidence remains bounded to the exact immutable candidate on which it was observed.

R3.2 has live Copilot CLI evidence for silent parent-session presence, bounded persisted modes, current-turn mode control, and subagent continuity. That development evidence is not silently relabeled as beta.4 release-candidate host acceptance.

See [Product Readiness](docs/PRODUCT_READINESS.md), [Operational Presence](docs/OPERATIONAL_PRESENCE.md), [P0 Host-Native Transport Reconciliation](docs/P0_HOST_TRANSPORT_RECONCILIATION.md), and [Supported Hosts](SUPPORTED_HOSTS.md) for the maintained truth.

## Quick start — frozen beta.4

The routes below are the maintained frozen beta.4 declarations. Codex, Copilot, and OpenCode place the SHA in their command-level transport. Claude Code uses a different host-native boundary: marketplace registration discovers the catalog, while the Hakim entry in `.claude-plugin/marketplace.json` pins `plugins/claude-code` with `git-subdir` and exact `sha: 5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Open `/plugins`, select **Hakim**, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Use installed skills such as `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.

### Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

The marketplace command is catalog discovery, not the immutable pin. The catalog entry advertises `1.0.0-beta.4` and uses an exact-SHA `git-subdir` plugin source for `plugins/claude-code`. A previous attempt to append the commit as `#<sha>` to the marketplace URL failed on Claude Code `2.1.220` because the host treated it as a branch; that superseded route is not documented as a normal install path.

Start Claude Code normally. Maintained commands include `/hakim:help`, `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, and `/hakim:gain`.

`gain` is the retained beta compatibility name for evidence-status reporting; it does not imply a quantified performance gain.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3
copilot plugin install hakim@hakim
```

Start Copilot normally. Explicit mode control uses the plugin-qualified skill route:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

Default `full` is stateless. Non-default modes use bounded plugin-owned state. The accepted R3.2 development path adds silent parent-session presence and subagent continuity, but that behavior is not claimed for frozen beta.4 without exact-candidate live-host evidence.

`.github/copilot-instructions.md` remains an optional repository baseline, not the primary Hakim product surface.

### OpenCode

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
```

The exact-SHA Git bootstrap invokes Hakim's guarded project-local managed lifecycle. It persists an exact install manifest, supports bounded create/adopt/transactional-upgrade paths, can remove supported older verified installations with a newer CLI, refuses conflicting or unsafe state, and does not edit `opencode.json` or install global Hakim state.

Start OpenCode from the same repository and use `/hakim-help` or `/hakim full ...`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for complete host-specific lifecycle, dry-run, removal, and trust boundaries. See [P0 Host-Native Transport Reconciliation](docs/P0_HOST_TRANSPORT_RECONCILIATION.md) for the exact evidence required before all maintained routes become accepted host-resolution proof.

## Unreleased development

Moving `main` is for source development and bounded internal validation. It reports `1.0.0-beta.4.post1`, is not a frozen candidate, and must not be used as release, promotion, benchmark, external-evaluator, or candidate-specific live-host evidence.

To work on that moving source explicitly:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
git checkout main
npm test
```

Any observation against `main` must record the exact 40-character commit it used. No beta.5 candidate exists until a later deliberate identity advance and freeze.

## Core capabilities

- One canonical coding policy focused on the smallest sufficient, coherent, safe change.
- Native product surfaces for Codex, Claude Code, GitHub Copilot CLI, and OpenCode.
- Host-native skills, commands, agents, and lifecycle controls where the host supports them.
- Deterministic PR Guardian, audit, doctor, host-preflight, and installation-planning checks.
- Guarded OpenCode project-local lifecycle with bounded ownership, quarantine-backed mutation, verification, and no-clobber rollback.
- Reproducible canonical skill packaging, deterministic CycloneDX source/product-inventory SBOM, and checksum/manifest verification.
- Explicit evidence boundaries separating repository conformance, live-host acceptance, behavioral evidence, product usefulness, and release authorization.

## Requirements

For product use, install the supported host you intend to use. The OpenCode exact-SHA bootstrap additionally requires Node.js/npm; the shipped package declares Node.js `>=22`.

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
npm run check:distribution-identity
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

Moving-development observations are never candidate evidence merely because their embedded version is ordered after the latest frozen prerelease. They require an exact commit and remain development-only until a candidate is deliberately cut.

Hakim does not claim universal model-quality improvement, performance gain, token savings, return on investment, or complete protection from unrelated local processes.
