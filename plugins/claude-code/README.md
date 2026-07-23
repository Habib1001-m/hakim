# Hakim for Claude Code

Hakim is packaged as a native Claude Code plugin with skills, plugin agents, lifecycle hooks, and a GitHub-hosted marketplace.

## Install

The repository itself is the Hakim marketplace:

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Equivalent one-line setup:

```bash
claude plugin marketplace add Habib1001-m/hakim && claude plugin install hakim@hakim
```

The default installation scope is `user`, so Hakim is available across projects. For a repository-shared installation, use `--scope project` on both commands.

After installation, start Claude Code normally. If you install while a session is already open, run `/reload-plugins`.

## Native UX

Run `/hakim:help` for the one-screen reference.

- `/hakim:full <task>` — full Hakim workflow in the current conversation and working tree.
- `/hakim:review [scope]` — isolated read-only complexity review.
- `/hakim:audit [scope]` — isolated deep read-only audit.
- `/hakim:debt [scope]` — isolated technical-debt provenance analysis.
- `/hakim:gain [scope]` — isolated evidence-status verification.
- `/hakim:help` — commands, agents, installation, and trust boundaries.

The canonical Hakim capabilities remain available to Claude for automatic model invocation but are hidden from the slash menu so the user-facing surface stays compact.

## Native agents

Hakim ships Claude Code plugin agents:

- `hakim:hakim-reviewer` — read-only complexity review.
- `hakim:hakim-auditor` — deep read-only evidence-backed audit.
- `hakim:hakim-debt-analyst` — read-only debt provenance analysis.
- `hakim:hakim-evidence-verifier` — independent evidence/claim verification.
- `hakim:hakim-implementer` — bounded implementation in an isolated git worktree.

Claude can delegate to them automatically. Type `@` in Claude Code to select a scoped Hakim agent explicitly when you want guaranteed delegation.

## Hooks

Hakim's `SessionStart` hook adds a small activation context when the plugin is enabled so Claude knows Hakim is available without requiring a wrapper launch command. The existing post-edit diagnostic hook remains opt-in.

Claude Code's plugin detail view reports the installed hook inventory.

## Inspect, update, or remove

```bash
claude plugin list --json
claude plugin details hakim@hakim
claude plugin update hakim@hakim
claude plugin uninstall hakim@hakim
```

Claude Code's own plugin cache, installation scopes, permissions, approval controls, managed policy, and trust boundaries remain authoritative.

## Development fallback

Repository contributors may still test the source checkout without installing it persistently:

```bash
npm run launch:claude -- --cwd /path/to/project
npm run launch:claude -- --apply --cwd /path/to/project
```

That launcher is a development path only. The native marketplace installation above is the product UX.
