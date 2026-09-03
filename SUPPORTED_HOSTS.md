# Supported Hosts

Hakim is public beta software. The frozen `1.0.0-beta.4` product identity is pinned to exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

Support means Hakim maintains a documented product surface for the host. It does not imply compatibility with every host version, operating system, model/provider, organization policy, or future host behavior.

| Host | Product surface | Frozen beta.4 installation | Verified boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin, six skills, SessionStart presence | `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Exact frozen journey accepted on Codex `0.145.0`; maintained compatibility floor is `0.131.0+` |
| Claude Code | Marketplace plugin, commands, skills, hooks, specialist agents | `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim` | Exact frozen journey accepted on Claude Code `2.1.220`; catalog pins `plugins/claude-code` to the frozen SHA |
| GitHub Copilot CLI | Marketplace plugin, six skills, five agents, host-native lifecycle hooks | `copilot plugin marketplace add Habib1001-m/hakim` then `copilot plugin install hakim@hakim` | Exact frozen journey accepted on Copilot CLI `1.0.71`; catalog pins `plugins/copilot` to the frozen SHA |
| OpenCode | Guarded project-local plugin and managed lifecycle | `npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install` | Exact frozen journey accepted on OpenCode `1.18.5`; Node `>=22` |

## Evidence and identity

[`conformance/distribution-identity.json`](conformance/distribution-identity.json) maps the frozen product identity, moving development identity, install pins, and packet-backed host evidence.

Frozen beta.4 acceptance is recorded in [`conformance/history/native-host-acceptance-1.0.0-beta.4.json`](conformance/history/native-host-acceptance-1.0.0-beta.4.json). Moving `main` has its own development-only projection and does not inherit frozen-candidate status automatically.

Repository tests, packaging checks, and projection checks do not substitute for real-host evidence.

## Runtime boundaries

The Git-backed OpenCode package declares Node `>=22`. Public CI exercises the maintained JavaScript/OpenCode surface on Node 22, 24, and 26.

Host-native security, permissions, approval, sandbox, plugin, managed-policy, cache, and removal controls remain authoritative.

## Design rule

Hakim preserves host-native differences. Capability parity is semantic; unused extension surfaces are not added merely for symmetry, and Hakim does not add MCP, LSP, or another cross-host runtime just because a host can support one.
