# Supported Hosts

Hakim is public beta software. A maintained host means Hakim ships and tests a product surface for that host; it does not imply compatibility with every host version, operating system, model/provider, organization policy, or future host behavior.

| Host | Automatic baseline | Explicit Hakim surface | Runtime boundary |
|---|---|---|---|
| Codex | Compact SessionStart core | `$hakim:hakim`, `$hakim:review`, `$hakim:audit`, `$hakim:debt`, `$hakim:status`, `$hakim:help` | Host plugin, hook trust, approval, and sandbox controls are authoritative |
| Claude Code | Compact SessionStart core | `/hakim:hakim`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:status`, `/hakim:help`; scoped execution agents | Host plugin/cache/trust/permission policy is authoritative |
| GitHub Copilot CLI | Silent parent-session presence plus bounded subagent/mode/completion hooks | Six installed skills plus five execution agents | Host plugin/settings/managed-policy behavior is authoritative |
| OpenCode | Canonical Hakim core through the project-local plugin system transform | `/hakim <mode>` plus the canonical `review`, `audit`, `debt`, `status`, and `help` surfaces | Node.js `>=22`; Hakim does not edit `opencode.json` |

## Installation identity

Use an immutable reviewed release tag for supported cross-host installation. Tags are release identity and must not be moved after publication.

Claude Code and GitHub Copilot marketplace entries use repository-relative plugin paths, so installed plugin content comes from the selected marketplace checkout. OpenCode uses the same selected Git ref through Git-backed npm/npx transport.

Repository tests check maintained source and package contracts. They do not replace a real-host install/start/invocation check for the exact release identity.

## Capability parity

All four hosts expose the same six canonical capabilities:

```text
hakim  review  audit  debt  status  help
```

`lite`, `full`, `ultra`, and `off` are modes of `hakim`; they are not separate capabilities.

Parity is semantic, not structural. Invocation syntax, startup behavior, hooks, agents, trust prompts, permissions, caches, state, and removal flows differ because Hakim uses each host's native extension model rather than adding a lowest-common-denominator runtime.

## Runtime support

The Git-backed OpenCode package declares Node.js `>=22`. Public CI exercises the maintained JavaScript/OpenCode surface on Node 22 and Node 26, while the main product/release job currently runs on Node 24.

Host-specific minimum versions are claimed only when they are maintained as an explicit tested contract. Otherwise, current host behavior and the exact release evidence define the supported scope.

Hakim does not add MCP, LSP, A2A, a daemon, or a cross-host workflow engine merely for symmetry.
