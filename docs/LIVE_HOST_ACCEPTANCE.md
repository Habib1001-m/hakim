# Exact-Identity Live Host Acceptance

This document defines the public-safe workflow for accepting a specific Hakim identity on a real supported coding host.

Current identities:

- frozen beta.4: `1.0.0-beta.4` at exact source commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`;
- moving development: `1.0.0-beta.4.post1`, which must be paired with the exact observed `main` commit and is not candidate or release/promotion evidence.

`conformance/distribution-identity.json` maps each identity to its own acceptance projection. Frozen beta.4 and moving development both remain `HOLD_FOR_LIVE_HOST_EVIDENCE` until their own exact-source journeys are reviewed and accepted.

## Boundary

A green repository CI run is not live-host acceptance.

A host, candidate, first-run transport, lifecycle, runtime path, or development revision can be promoted by public evidence only after the exact end-to-end journey has been observed on the real host and a public-safe evidence reference has been reviewed.

Evidence never moves with `main`, a marketplace name, a version label, or a later candidate. It remains bounded to the exact embedded version and 40-character source commit actually tested.

Hakim never asks for credentials, private prompts, customer source code, authentication tokens, or private governance records as live-host evidence.

## 1. Select and record the identity

For frozen beta.4:

```bash
HAKIM_VERSION=1.0.0-beta.4
SOURCE_SHA=5d00039479f2f11b7fe30ccf2385e70ce24553c3
ACCEPTANCE_PROJECTION=conformance/history/native-host-acceptance-1.0.0-beta.4.json
```

For explicit moving development:

```bash
HAKIM_VERSION=1.0.0-beta.4.post1
SOURCE_SHA="$(git rev-parse HEAD)"
ACCEPTANCE_PROJECTION=conformance/native-host-acceptance.json
```

Before continuing, verify `SOURCE_SHA` is a full 40-character commit and that the checkout/transport under test resolves that exact object. A development observation does not become candidate evidence.

## 2. Inspect before running the host journey

From the selected Hakim checkout:

```bash
npm run accept:host -- --host codex
npm run accept:host -- --host claude-code
npm run accept:host -- --host github-copilot
npm run accept:host -- --host opencode --target /path/to/test-project
```

The command is read-only. It:

- resolves the requested host binary;
- runs only the host's `--version` probe;
- validates Hakim's current install-plan contract;
- prints the install/start/invocation checklist for the checked source;
- does not install a plugin, change host configuration, start an interactive host, or edit an acceptance projection.

`--apply` is intentionally refused.

## 3. Run the real exact-source product journey

The examples below show frozen beta.4. For development-only diagnosis, replace the SHA with the exact development commit and preserve the non-candidate boundary in the evidence.

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$SOURCE_SHA"
```

Then use the Codex plugin UI to select the Hakim marketplace, install `hakim`, review/trust the bundled SessionStart hook, start a new thread, and invoke an installed Hakim skill.

Do not mark Codex `PASS` unless that exact source path is observed to work on the recorded Codex version.

### Claude Code

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$SOURCE_SHA"
claude plugin install hakim@hakim
```

Start Claude Code with the plugin enabled. If installation occurred during an active session, use `/reload-plugins` when appropriate. Invoke `/hakim:help` or another Hakim command/agent and verify the installed plugin responds.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add "Habib1001-m/hakim#$SOURCE_SHA"
copilot plugin install hakim@hakim
copilot plugin list
```

Inside Copilot CLI, verify `/skills list` and `/agent`, then invoke a Hakim skill or agent and verify the installed plugin responds.

### OpenCode

Use a disposable or deliberately selected test repository.

Normal frozen beta.4 first-run is:

```bash
cd /path/to/test-project
npx --yes --package="github:Habib1001-m/hakim#$SOURCE_SHA" hakim-opencode install
```

npm CLI has a known upstream exact-Git-commit issue that reproduces on npm `10.9.8` as `GitFetcher requires an Arborist constructor to pack a tarball` (`npm/cli#6723`). When that exact environment blocks acceptance, preserve the npx product transport without changing system npm by installing npm 11 only into a disposable directory and invoking its bundled `npx-cli.js`:

```bash
cd /path/to/test-project
NPM11_ROOT="$(mktemp -d /tmp/hakim-npm11.XXXXXX)"

npm install --prefix "$NPM11_ROOT" --no-save --ignore-scripts --no-audit --no-fund npm@11
NPM11_NPX="$NPM11_ROOT/node_modules/npm/bin/npx-cli.js"
node "$NPM11_ROOT/node_modules/npm/bin/npm-cli.js" --version

node "$NPM11_NPX" --yes \
  --package="github:Habib1001-m/hakim#$SOURCE_SHA" \
  -- \
  hakim-opencode status --json

node "$NPM11_NPX" --yes \
  --package="github:Habib1001-m/hakim#$SOURCE_SHA" \
  -- \
  hakim-opencode install --dry-run --json

node "$NPM11_NPX" --yes \
  --package="github:Habib1001-m/hakim#$SOURCE_SHA" \
  -- \
  hakim-opencode install --json
```

This is acceptance-only tooling for exact commit evidence. It does not upgrade or replace the system npm, alter the normal quick start, or substitute a different package transport.

Then start OpenCode from that project and invoke `/hakim-help` or another Hakim command/skill.

OpenCode loads the project-local plugin from `.opencode/plugins/`. The managed lifecycle persists `.opencode/hakim-runtime/install-manifest.json`, supports bounded create/adopt/transactional-upgrade and supported older-version removal, uses same-filesystem quarantine with post-move verification and no-clobber rollback, does not edit `opencode.json`, and creates no global state.

## 4. Record an exact-identity candidate evidence packet

After actually observing the journey, rerun the harness with the three checkpoints and a public-safe evidence reference.

Example:

```bash
npm run accept:host -- --host claude-code \
  --record \
  --installation PASS \
  --activation PASS \
  --invocation PASS \
  --evidence-ref "issue:<number>#comment-version-$HAKIM_VERSION-sha-$SOURCE_SHA" \
  --output "dist/live-host-acceptance/claude-code-$SOURCE_SHA.json" \
  --json
```

For OpenCode:

```bash
npm run accept:host -- --host opencode \
  --target /path/to/test-project \
  --record \
  --installation PASS \
  --activation PASS \
  --invocation PASS \
  --evidence-ref "issue:<number>#comment-version-$HAKIM_VERSION-sha-$SOURCE_SHA" \
  --output "dist/live-host-acceptance/opencode-$SOURCE_SHA.json" \
  --json
```

The tested identity reaches `PASS` only when:

- all three observed checkpoints are `PASS`;
- the host binary is resolved;
- the host version is detected from the real binary;
- a non-empty public-safe evidence reference is supplied;
- the evidence records the embedded Hakim version and exact 40-character source commit;
- the reviewed journey matches the installation transport and product path claimed by the target acceptance projection.

`--output` is create-only. The harness refuses to overwrite an existing evidence packet; use a new path for every run so earlier evidence remains inspectable.

A candidate evidence packet is evidence for review, not authorization to edit a projection. Do not fabricate a packet that was not actually produced or observed.

## 5. Promote only the matching projection after review

Review the packet and/or public-safe evidence reference. Then, and only then, update the host entry in the projection linked to that exact identity by `conformance/distribution-identity.json`.

Do not broaden old evidence to a new version, source SHA, transport, lifecycle, runtime behavior, or journey merely because part of the payload is similar.

External evaluator recruitment is currently `SUSPENDED_PENDING_EXPLICIT_PRODUCT_DECISION`. Live-host acceptance is a separate evidence dimension and must not reopen the withdrawn campaign automatically.

## Upstream host references

Host-native behavior remains authoritative in each host's documentation:

- Claude Code plugin discovery and installation: `https://code.claude.com/docs/en/discover-plugins`
- GitHub Copilot CLI plugin installation: `https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing`
- OpenCode project-local plugins: `https://opencode.ai/docs/plugins/`
- Codex plugin overview: `https://help.openai.com/en/articles/20001256-plugins-in-codex/`
