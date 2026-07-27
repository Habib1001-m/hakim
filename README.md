# Hakim (حَكِيم)

Hakim makes AI coding agents do less — deliberately. Before adding code, it asks whether the work is needed, whether the repository already solves it, and whether the standard library or host platform can do the job. The goal is the smallest safe change, with completion and quality claims tied to inspectable evidence.

## What changes with Hakim

Without a constraint like Hakim, a coding agent can satisfy a small request by adding a helper, dependency, abstraction, and tests around all of them. Hakim changes the order of decisions:

```text
need? → reuse existing code? → stdlib? → native platform? → existing dependency? → one clear line? → minimum custom code
```

For example, when a repository already has a parser that safely handles the requested format, Hakim directs the agent to reuse that parser instead of creating a second abstraction. It does not promise that fewer lines are always better: security, privacy, migrations, rollback safety, accessibility, data integrity, and user trust remain hard boundaries.

## Status

Hakim `1.0.0-beta.2` is public beta software; the current beta.2 candidate is distributed from public source and host-native Git marketplaces. It is not published to the npm registry and does not claim a central marketplace/directory listing. `package.json` remains private to prevent accidental registry publication.

The beta.2 candidate intentionally starts with current live-host acceptance at **`HOLD_FOR_LIVE_HOST_EVIDENCE`**. Structural tests and prior accepted journeys do not automatically promote a changed prerelease candidate. Accepted beta.1 host evidence is preserved under [`conformance/history/`](conformance/history/) rather than being relabeled as beta.2 evidence.

External evaluator recruitment remains suspended and requires a separate explicit product decision before any relaunch. Stable `1.0.0`, registry publication, and central marketplace promotion are not authorized by this candidate.

## Quick start

Choose the coding host you already use. None of the maintained first-run commands below requires manually cloning Hakim.

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

Then start Claude Code normally. Use `/hakim:help`, `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, and `/hakim:gain`. The `gain` command is the retained beta compatibility name for evidence-status reporting; it does not imply a quantified performance gain. Claude also receives Hakim plugin agents, including read-only specialists and an isolated worktree implementer.

### GitHub Copilot

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Verify with `copilot plugin list`, `/skills list`, and `/agent`. The plugin provides six Hakim skills plus specialized review, audit, debt, evidence, and implementation agents. `.github/copilot-instructions.md` remains an optional repository baseline rather than the full Hakim product.

### OpenCode

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

The Git-backed bootstrap invokes Hakim's guarded project-local managed lifecycle directly from the public repository. It persists an exact install manifest, supports bounded create/adopt/transactional-upgrade paths, can remove a supported older verified installation with a newer CLI, refuses conflicting or unsafe state, and does not edit `opencode.json` or install global Hakim state.

Start OpenCode from the same repository and use `/hakim-help` or `/hakim full ...`.

See [Install Hakim](core/hakim-skill/INSTALL.md) for complete host-specific lifecycle, dry-run, removal, and trust boundaries.

## Core capabilities

- A canonical coding policy focused on minimal, safe changes.
- Native host plugins for Codex, Claude Code, and GitHub Copilot.
- A guarded project-local native OpenCode plugin bundle with Git-backed bootstrap.
- Host-specialized skills, agents, commands, and lifecycle controls where the host supports them.
- Deterministic PR Guardian checks for dependency and evidence-boundary drift.
- Bounded review, audit, doctor, host-preflight, and install-planning commands.
- OpenCode persistent lifecycle manifests, create/adopt/transactional-upgrade support, supported older-version removal, same-filesystem quarantine with post-move verification, and no-clobber rollback safeguards.
- Byte-reproducible canonical skill packaging, a deterministic CycloneDX source/product-inventory SBOM, and local checksum/manifest verification without a runtime service.

## Requirements

For product use, install the supported host you intend to use. The OpenCode Git-backed bootstrap additionally requires Node.js/npm; the shipped package declares Node.js `>=22`.

Repository development and local validation additionally require:

- Node.js 22 or newer. Public CI runs the canonical repository gate on Node.js 24 and exercises the shipped OpenCode package/runtime on Node.js 22 and 26 as compatibility edges.
- Python 3.10 or newer. Maintained Python tooling uses Python 3.10+ syntax; Public CI currently validates Python 3.11.
- Git.

For the full Codex product path in this beta, use Codex `0.131.0` or newer. Codex `0.130.0` still shipped plugin-bundled hooks disabled by default; `0.131.0` is the first tagged release in which the `plugin_hooks` feature is stable and enabled by default.

## Local validation

`npm test` is the canonical repository gate used by the main Public CI job.

```bash
npm test
npm run doctor
npm run plan:install -- --host all
```

Historical controlled-experiment fixture checks are intentionally separate from the permanent product gate:

```bash
npm run test:evidence:historical
```

Build the canonical skill package:

```bash
npm run package:skill
```

The skill ZIP normalizes archive ordering, timestamps, and file modes so equivalent maintained source content can produce byte-identical output. `npm test` also builds and verifies the release SBOM, checksums, and release manifest. Generated artifacts are still local build evidence; they are not evidence of registry publication, signing, notarization, third-party attestation, or universal host compatibility.

## Supported hosts

Hakim maintains product surfaces for:

- Codex
- Claude Code
- GitHub Copilot
- OpenCode

Each host intentionally uses its strongest native extension model rather than a lowest-common-denominator adapter. Host-native approval, trust, sandboxing, activation, plugin policy, and removal controls remain authoritative. See [Supported Hosts](SUPPORTED_HOSTS.md) and [Architecture](docs/ARCHITECTURE.md).

## Product readiness

Current native runtime acceptance is not the same thing as full product readiness. The beta.2 candidate deliberately resets current-path host acceptance until fresh real-host journeys are recorded for this candidate. Prior beta.1 evidence remains historical and inspectable.

The current product-readiness work is tracked in [#32](https://github.com/Habib1001-m/hakim/issues/32): version identity, canonical local/CI gates, public-repository pruning, in-product help simplification, evidence-status naming truth, permanent contract naming, cross-host behavioral confidence, production-like dogfood, and stable-release prerequisites.

External evaluator recruitment remains suspended. A future evaluator campaign, stable release, registry publication, or broad marketplace promotion requires a separate explicit operator decision.

## Evidence boundaries

A passing deterministic check means only that the enabled rule set found no matching violation. It is not a substitute for correctness, security, architecture, semantic review, or live host validation.

The public native-host acceptance projection is current-product evidence. A new or materially changed prerelease candidate, lifecycle, first-run journey, or runtime behavior requires accepted real-host observation before that exact path is promoted by evidence. Structural or CI success alone does not create live-host acceptance.

Hakim does not claim model-quality improvement, universal compatibility, performance gains, token savings, return on investment, or complete protection from unrelated local processes.

See [Known Limitations](KNOWN_LIMITATIONS.md).

## Privacy

Hakim does not implement a product telemetry collection service. Repository conformance and evidence schemas are local validation artifacts, not product telemetry. Hakim does not enable raw prompt or source-code logging.

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
