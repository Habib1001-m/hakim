# Hakim for GitHub Copilot

Hakim is packaged as a native GitHub Copilot plugin with reusable skills and specialized custom agents. `.github/copilot-instructions.md` remains a repository baseline, but it is no longer the whole product surface.

## Install in Copilot CLI

Register the Hakim marketplace and install the plugin:

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

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

GitHub's plugin system is shared beyond the CLI. For repository-managed cloud-agent use, configure the Hakim marketplace in `extraKnownMarketplaces` and enable `hakim@hakim` through the repository's `.github/copilot/settings.json` according to your organization policy.

Repository permissions, Copilot policy, enabled plugins, and tool permissions remain authoritative.

## Repository baseline instructions

The existing `.github/copilot-instructions.md` is still useful when a repository wants lightweight Hakim guidance without requiring a user-level plugin. It contains no plugin lifecycle logic and should not be presented as a substitute for the native plugin.

The legacy guarded installer remains available from the Hakim source checkout for repositories that explicitly want to copy this baseline instruction file:

```bash
npm run plan:install -- --host github-copilot --target /path/to/repository
npm run install:copilot -- --target /path/to/repository
npm run install:copilot -- --target /path/to/repository --apply
```

That installer is create-only and never overwrites an existing instruction file.

## Product boundary

Hakim does not add MCP or LSP services to Copilot because the current Hakim workflow does not require external data or a language server. Adding unused extension surfaces would violate Hakim's own smallest-safe-change rule.
