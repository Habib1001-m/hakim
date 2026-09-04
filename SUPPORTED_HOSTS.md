# Supported Hosts

Hakim is public beta software. Support means Hakim maintains a product surface for the host; it does not imply compatibility with every host version, operating system, model/provider, organization policy, or future host behavior.

| Host | Maintained Hakim surface | Runtime boundary |
|---|---|---|
| Codex | Native Git marketplace plugin, six skills, SessionStart presence | Codex `0.131.0+` for the maintained plugin-hook path |
| Claude Code | Marketplace plugin, commands, skills, hooks, and scoped specialist agents | Host plugin/cache/trust policy is authoritative |
| GitHub Copilot CLI | Marketplace plugin, six skills, five agents, and host-native lifecycle hooks | Host plugin/settings/managed-policy behavior is authoritative |
| OpenCode | Guarded project-local plugin and managed create/adopt/upgrade/remove lifecycle | Node.js `>=22`; Hakim does not edit `opencode.json` |

## Installation identity

Install a release from an immutable Git ref. The marketplace repositories for Codex, Claude Code, and Copilot are pinned at the marketplace-source level; their plugin entries use repository-relative product paths. OpenCode installs through the Git-backed npm/npx transport.

Repository tests check maintained source and package contracts. They do not replace a real-host install/start/invocation check for the exact release identity.

## Capability parity

All four hosts expose the same six canonical capability IDs:

`hakim`, `hakim-review`, `hakim-audit`, `hakim-debt`, `hakim-gain`, and `hakim-help`.

Parity is semantic, not structural. Invocation syntax, startup behavior, hooks, agents, trust prompts, permissions, caches, and removal flows may differ because Hakim uses each host's native extension model instead of adding a lowest-common-denominator runtime.

## Runtime support

The Git-backed OpenCode package declares Node.js `>=22`. Public CI exercises the maintained JavaScript/OpenCode compatibility surface on Node 22, 24, and 26.

Hakim does not add MCP, LSP, A2A, a daemon, or a cross-host workflow engine merely for symmetry.
