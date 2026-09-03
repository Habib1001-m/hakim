# Hakim for Claude Code

Hakim is a native Claude Code plugin with commands, model-invocable skills, scoped specialist agents, and lifecycle hooks.

## Install frozen beta.4

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Marketplace registration discovers the catalog. The Hakim catalog entry pins `plugins/claude-code` to frozen source `5d00039479f2f11b7fe30ccf2385e70ce24553c3` through Claude Code's `git-subdir` source shape.

The default installation scope is `user`. For repository-shared installation, use Claude Code's project scope according to your repository policy.

After installation, start Claude Code normally. If you install while a session is already open, run `/reload-plugins`.

## Native UX

Run `/hakim:help` for the compact reference.

- `/hakim:full <task>` — full Hakim workflow.
- `/hakim:review [scope]` — bounded complexity review.
- `/hakim:audit [scope]` — evidence-backed audit.
- `/hakim:debt [scope]` — technical-debt provenance analysis.
- `/hakim:gain [scope]` — evidence-status verification.
- `/hakim:help` — commands, agents, installation, and trust boundaries.

The canonical Hakim capabilities also remain available for model invocation while the slash-command surface stays compact.

## Native agents

Hakim ships:

- `hakim:hakim-reviewer` — read-only complexity review.
- `hakim:hakim-auditor` — deep read-only audit.
- `hakim:hakim-debt-analyst` — read-only debt provenance analysis.
- `hakim:hakim-evidence-verifier` — independent evidence/claim verification.
- `hakim:hakim-implementer` — bounded implementation in an isolated git worktree.

Claude Code may delegate automatically or you may select an agent explicitly. Host permissions remain authoritative.

## Hooks

Hakim's SessionStart hook adds compact activation context when the plugin is enabled. The post-edit diagnostic hook remains opt-in and advisory.

Hakim does not replace Claude Code's approval, permissions, managed policy, trust, or plugin-cache controls.

## Inspect, update, or remove

```bash
claude plugin list --json
claude plugin details hakim@hakim
claude plugin update hakim@hakim
claude plugin uninstall hakim@hakim
```

Updates follow the registered catalog and its pinned plugin-source definition.

## Development fallback

Repository contributors may test an explicit moving source checkout without persistent installation:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run launch:claude -- --cwd /path/to/project
```

This exercises moving development, not the frozen product identity.
