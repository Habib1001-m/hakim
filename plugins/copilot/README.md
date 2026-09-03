# Hakim for GitHub Copilot CLI

Hakim is a native GitHub Copilot plugin with reusable skills, custom agents, and host-native lifecycle hooks. `.github/copilot-instructions.md` remains an optional repository baseline, not the primary product surface.

## Install frozen beta.4

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Marketplace registration discovers the catalog. The Hakim catalog entry pins `plugins/copilot` to frozen source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

Inspect the installation with:

```bash
copilot plugin list
```

Inside Copilot CLI, `/skills list` and `/agent` expose the loaded Hakim skills and agents.

## Native skills

Hakim provides:

- `hakim` — full smallest-safe-diff workflow.
- `hakim-review` — bounded removable-complexity review.
- `hakim-audit` — evidence-backed audit.
- `hakim-debt` — technical-debt provenance.
- `hakim-gain` — evidence-status verification.
- `hakim-help` — usage and trust boundaries.

Copilot may load a matching skill when its description fits the task.

## Native agents

The plugin ships:

- `hakim-reviewer` — read/search only.
- `hakim-auditor` — read/search only.
- `hakim-debt-analyst` — read/search only.
- `hakim-evidence-verifier` — read/search only.
- `hakim-implementer` — bounded read/search/edit/execute implementation.

Use `/agent` to select one explicitly or allow Copilot to use its normal agent selection behavior.

## Operational behavior in moving development

Moving development uses host-native hooks for silent parent-session presence, subagent continuity, bounded non-default mode persistence, current-turn mode control, and a late objective-contradiction check.

Explicit mode control:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

The late objective check is designed to intervene only when supported observable repository/setup state contradicts a consequential structured completion claim. It does not add broad command blocking or general prose linting.

Moving-development behavior remains separate from the frozen beta.4 product identity until a later candidate is deliberately cut.

## Update or remove

```bash
copilot plugin update hakim
copilot plugin uninstall hakim
```

Updates follow the registered marketplace and its pinned plugin-source definition.

## Repository baseline instructions

`.github/copilot-instructions.md` can provide lightweight Hakim guidance to a repository without being the full plugin. The guarded source-checkout installer is create-only and does not overwrite an existing instructions file:

```bash
npm run plan:install -- --host github-copilot --target /path/to/repository
npm run install:copilot -- --target /path/to/repository
npm run install:copilot -- --target /path/to/repository --apply
```

## Product boundary

Hakim does not add MCP or LSP services to Copilot because the maintained product does not require them. Copilot permissions, policy, enabled plugins, host cache, and tool permissions remain authoritative.
