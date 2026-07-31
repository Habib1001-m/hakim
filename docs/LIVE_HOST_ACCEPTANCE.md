# Exact-Identity Live Host Acceptance

This document defines the public-safe workflow for accepting a specific Hakim identity on a real supported coding host.

Current identities:

- frozen beta.4: `1.0.0-beta.4` at exact source commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`;
- moving development: `1.0.0-beta.4.post1`, which must be paired with the exact observed `main` commit and is not candidate or release/promotion evidence.

`conformance/distribution-identity.json` maps each identity to its own acceptance projection and records the effective pin layer for each host. Frozen beta.4 currently has accepted Codex, Claude Code, and GitHub Copilot CLI evidence; OpenCode remains incomplete.

## Boundary

A green repository CI run is not live-host acceptance. A marketplace name, version label, command string, or catalog declaration is not sufficient proof of the bytes a host installed.

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

Before continuing, verify `SOURCE_SHA` is a full 40-character commit and that the effective host transport under test resolves that exact object.

## 2. Inspect before running the host journey

```bash
npm run accept:host -- --host codex
npm run accept:host -- --host claude-code
npm run accept:host -- --host github-copilot
npm run accept:host -- --host opencode --target /path/to/test-project
```

The command is read-only. It resolves the binary, runs only `--version`, validates the current install-plan contract, and prints the checklist. It does not install or edit acceptance. `--apply` is intentionally refused.

## 3. Run the real exact-source product journey

### Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$SOURCE_SHA"
```

Then select Hakim in `/plugins`, install `hakim`, trust the SessionStart hook, start a new thread, and invoke an installed skill. Frozen beta.4 Codex `0.145.0` has one accepted packet; another host does not inherit it.

### Claude Code

Claude distinguishes marketplace catalog discovery from plugin source resolution. For the repaired frozen route, the catalog entry uses:

```text
source = git-subdir
url    = https://github.com/Habib1001-m/hakim.git
path   = plugins/claude-code
sha    = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

After P0 is merged, normal installation is:

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

For the pre-merge P0 journey, register the branch containing the repaired catalog:

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#p0-truthful-immutable-distribution-identity"
claude plugin install hakim@hakim
```

The branch is only catalog discovery. Inspect Claude's installed plugin cache/source and prove that the plugin itself resolves `$SOURCE_SHA`, reports `$HAKIM_VERSION`, activates, and invokes `/hakim:help`.

The superseded command that used `...hakim.git#$SOURCE_SHA` failed on Claude Code `2.1.220`; the host treated the commit as a branch. The failure classification is `MARKETPLACE_SOURCE_SHA_TREATED_AS_BRANCH`. Do not retry that route.

### GitHub Copilot CLI

Copilot also separates marketplace catalog discovery from the immutable plugin source. The maintained catalog entry uses:

```text
source = github
repo   = Habib1001-m/hakim
path   = plugins/copilot
sha    = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

After P0 is merged, normal installation is:

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
copilot plugin list
```

For the pre-merge P0 journey, register the branch containing the repaired catalog:

```bash
copilot plugin marketplace add "Habib1001-m/hakim#p0-truthful-immutable-distribution-identity"
copilot plugin install hakim@hakim
copilot plugin list
```

The branch is only catalog discovery. Verify the cached catalog checkout identity, then prove the installed plugin resolves `$SOURCE_SHA`, reports `$HAKIM_VERSION`, and matches the frozen `plugins/copilot` bytes. Inside Copilot CLI, `/skills list` and `/agent` establish the loaded Hakim surface. To force the unique frozen help skill, use an explicit instruction such as `Use the /hakim-help skill ...`; accepted beta.4 evidence recorded `skill(hakim-help)` and the expected quick reference.

The superseded command `copilot plugin marketplace add "Habib1001-m/hakim#$SOURCE_SHA"` failed on Copilot CLI `1.0.71`; the host passed the SHA to Git as a branch selector. The failure classification is `MARKETPLACE_REF_SHA_TREATED_AS_BRANCH`. Do not retry that route.

### OpenCode

Use a disposable or deliberately selected test repository:

```bash
cd /path/to/test-project
npx --yes --package="github:Habib1001-m/hakim#$SOURCE_SHA" hakim-opencode install
```

npm CLI has a known upstream exact-Git-commit issue that reproduces on npm `10.9.8` as `GitFetcher requires an Arborist constructor to pack a tarball` (`npm/cli#6723`). When that exact environment blocks acceptance, preserve the npx transport without replacing system npm:

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

This acceptance-only tooling does not upgrade or replace the system npm. Then start OpenCode and invoke `/hakim-help`.

## 4. Record an exact-identity candidate evidence packet

After observing the journey, rerun the harness with the three checkpoints and a public-safe evidence reference:

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

For the P0 transport-specific packet, use `npm run capture:transport`. `--output` is create-only and a candidate evidence packet is evidence for review, not automatic projection authority.

A tested identity reaches `PASS` only when all three observations pass, the real host/version is detected, the installed product version and `RESOLVED_SOURCE_SHA` match, and a public-safe evidence reference is reviewed.

## 5. Promote only the matching projection after review

Only explicit operator acceptance authorizes updating the matching host entry. Never broaden old evidence to another version, SHA, transport, lifecycle, runtime behavior, or host.

External evaluator recruitment remains suspended pending an explicit product decision. Live-host acceptance must not reopen it automatically.

## Upstream host references

- Claude Code marketplace/plugin source configuration: `https://code.claude.com/docs/en/plugin-marketplaces`
- GitHub Copilot CLI plugin installation: `https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing`
- OpenCode project-local plugins: `https://opencode.ai/docs/plugins/`
- Codex plugin overview: `https://help.openai.com/en/articles/20001256-plugins-in-codex/`
