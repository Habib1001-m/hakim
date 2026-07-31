# Hakim for GitHub Copilot

Hakim is packaged as a native GitHub Copilot plugin with reusable skills and specialized custom agents. `.github/copilot-instructions.md` remains an optional repository baseline, not the whole product surface.

## Distribution identity

The normal product route installs frozen Hakim `1.0.0-beta.4` from exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`. Moving `main` reports `1.0.0-beta.4.post1` and is unreleased development, not a frozen candidate or release/promotion evidence.

## Install frozen beta.4 in Copilot CLI

Register the Hakim marketplace and install the plugin:

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Marketplace registration discovers the catalog; it is not the immutable product pin. The `hakim` entry in `.github/plugin/marketplace.json` advertises frozen `1.0.0-beta.4` and pins the product with a GitHub plugin source object:

```text
repo = Habib1001-m/hakim
path = plugins/copilot
sha  = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

A superseded attempt to append that SHA as `#<sha>` to marketplace registration failed on Copilot CLI `1.0.71` because the host passed the value to Git as a branch selector. Do not reuse that route.

A disposable local-catalog repair probe on Copilot CLI `1.0.71` installed `v1.0.0-beta.4`, exposed six skills and five agents, and matched all 13 frozen product files byte-for-byte. The source and installed tree digest was `b1d210d97a4d1f5b119667bedf13007cbb0560a6bb1f28bcd3e232ee708d14e2`. That proves the exact-SHA source contract only; the maintained repository route still requires its own activation/invocation acceptance journey.

Inspect the installation:

```bash
copilot plugin list
```

Inside an interactive Copilot CLI session:

```text
/plugin list
/skills list
/agent
```

The plugin is cached by Copilot. Update or remove it with:

```bash
copilot plugin update hakim
copilot plugin uninstall hakim
```

An update follows the registered marketplace and its plugin-source definition. Frozen beta.4 remains pinned by the catalog entry's exact SHA; do not replace that source with moving `main` while claiming the same candidate evidence.

## Native skills

Hakim provides:

- `hakim` — full smallest-safe-diff workflow.
- `hakim-review` — read-only removable-complexity review.
- `hakim-audit` — evidence-backed read-only audit.
- `hakim-debt` — technical-debt provenance.
- `hakim-gain` — evidence-status verification.
- `hakim-help` — usage and trust boundaries.

Use `/skills list` to inspect the exact loaded names. Copilot may load a matching skill when its description fits the task.

## Native custom agents

The plugin ships:

- `hakim-reviewer` — read/search only.
- `hakim-auditor` — read/search only.
- `hakim-debt-analyst` — read/search only.
- `hakim-evidence-verifier` — read/search only.
- `hakim-implementer` — read/search/edit/execute for bounded implementation.

Use `/agent` to select one explicitly, tell Copilot to use it by name, or let Copilot infer a specialist from the agent description. Read-only specialists do not receive edit or execute tools.

## Copilot app and cloud agent

GitHub's plugin system is shared beyond the CLI. Repository-managed cloud-agent configuration must identify the exact marketplace source required by the intended candidate or development workflow and follow organization policy. Repository permissions, Copilot policy, enabled plugins, and tool permissions remain authoritative.

## Repository baseline instructions

The existing `.github/copilot-instructions.md` is useful when a repository wants lightweight Hakim guidance without a user-level plugin. It contains no plugin lifecycle logic and must not be presented as a substitute for the native plugin.

The legacy guarded installer remains available from an explicit Hakim source checkout for repositories that want to copy this baseline instruction file:

```bash
npm run plan:install -- --host github-copilot --target /path/to/repository
npm run install:copilot -- --target /path/to/repository
npm run install:copilot -- --target /path/to/repository --apply
```

That installer is create-only and never overwrites an existing instruction file.

## Moving-main development

Repository contributors may work from an explicit `main` checkout, but every observation must record the exact source commit. Moving `main` is not a frozen candidate and is not release/promotion evidence.

## Product boundary

Hakim does not add MCP or LSP services to Copilot because the current workflow does not require external data or a language server. Adding unused extension surfaces would violate Hakim's own smallest-safe-change rule.
