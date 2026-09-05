# Supported Hosts

Hakim is public beta software. Support means Hakim maintains a product surface for the host; it does not imply compatibility with every host version, operating system, model/provider, organization policy, or future host behavior.

| Host | Maintained Hakim surface | Runtime boundary |
|---|---|---|
| Codex | Native Git marketplace plugin, six skills, SessionStart presence | Host plugin, hook trust, approval, and sandbox controls are authoritative |
| Claude Code | Marketplace plugin, six skills, SessionStart presence, scoped execution agents | Host plugin/cache/trust/permission policy is authoritative |
| GitHub Copilot CLI | Marketplace plugin, six skills, five execution agents, mode/subagent/completion hooks | Host plugin/settings/managed-policy behavior is authoritative |
| OpenCode | Guarded project-local plugin and managed create/adopt/upgrade/remove lifecycle | Node.js `>=22`; Hakim does not edit `opencode.json` |

## Installation identity

Use an immutable reviewed release tag for supported cross-host installation. Claude Code and GitHub Copilot marketplace entries use repository-relative plugin paths, so installed plugin content comes from the selected marketplace checkout. OpenCode uses the same selected Git ref through Git-backed npm/npx transport.

Repository tests check maintained source and package contracts. They do not replace a real-host install/start/invocation check for the exact release identity.

## Capability parity

All four hosts expose the same six canonical capabilities:

`hakim`, `review`, `audit`, `debt`, `status`, and `help`.

Parity is semantic, not structural. Invocation syntax, startup behavior, hooks, agents, trust prompts, permissions, caches, and removal flows may differ because Hakim uses each host's native extension model rather than adding a lowest-common-denominator runtime.

`lite`, `full`, `ultra`, and `off` are modes of `hakim`; they are not separate capabilities.

## Runtime support

The Git-backed OpenCode package declares Node.js `>=22`. Public CI exercises the maintained JavaScript/OpenCode compatibility surface on Node 22, 24, and 26.

Hakim does not add MCP, LSP, A2A, a daemon, or a cross-host workflow engine merely for symmetry.
