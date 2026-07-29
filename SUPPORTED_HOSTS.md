# Supported Hosts

Hakim is public beta software. The latest frozen prerelease identity is `1.0.0-beta.4`; `main` may contain unreleased development beyond that frozen candidate.

Support means the repository maintains a documented, gated product surface for the host. It does not imply universal compatibility, current release-candidate acceptance, or stable-release authorization.

| Host | Maintained product surface | Native UX | Current boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin with six skills and SessionStart activation | `codex plugin marketplace add Habib1001-m/hakim` → `/plugins` → install `hakim@hakim` | Codex `0.131.0+` is the compatibility floor for the maintained default-on plugin-hook contract; frozen beta.4 live-host acceptance remains `NOT_RUN`; central OpenAI Plugin Directory listing is separate and not claimed |
| Claude Code | Native marketplace plugin with six commands, hidden canonical skills, lifecycle hooks, and specialized agents | `claude plugin marketplace add Habib1001-m/hakim` + `claude plugin install hakim@hakim` | frozen beta.4 live-host acceptance remains `NOT_RUN`; Claude installation scope, managed policy, permissions, plugin cache, and trust remain authoritative |
| GitHub Copilot CLI | Native marketplace plugin with six skills, five custom agents, and R3.2 lifecycle presence/mode/subagent continuity | `copilot plugin marketplace add Habib1001-m/hakim` + `copilot plugin install hakim@hakim` | frozen beta.4 acceptance remains separate; unreleased R3.2 Copilot CLI 1.0.75 evidence has accepted F01–F04 operational behavior, but that bounded development evidence is not silently promoted to release-candidate acceptance |
| OpenCode | Guarded project-local native plugin with persistent lifecycle manifest, bounded create/adopt/transactional-upgrade/removal, ownership sentinels, quarantine verification, and no-clobber rollback | `npx --yes --package=github:Habib1001-m/hakim hakim-opencode install` → normal OpenCode startup | Node `>=22` for the shipped Git bootstrap; frozen beta.4 live-host acceptance remains `NOT_RUN`; no npm registry/global installer or `opencode.json` mutation is claimed |

## Node runtime contract

The Git-backed Hakim package declares Node `>=22`. Public CI uses Node 24 for the canonical repository gate and separately exercises the shipped JavaScript/OpenCode surface on Node 22 and Node 26 through `npm run test:node-compat`.

That matrix is a JavaScript runtime contract, not a claim of universal operating-system, host-version, or provider compatibility.

## Frozen-candidate native acceptance

The public-safe machine-readable authority is [`conformance/native-host-acceptance.json`](conformance/native-host-acceptance.json).

- `PASS` requires an observed real-host install/start/invocation journey plus a public-safe evidence reference for the exact product identity being claimed.
- `NOT_RUN` means no accepted journey is recorded for the claimed frozen path.
- `FAIL` and `BLOCKED` require an attempted journey plus a public-safe evidence reference.
- Structural, packaging, smoke, projection, or CI success does not change live-host status.
- A new prerelease identity or materially changed transport/lifecycle/runtime requires its own evidence.

The frozen beta.4 candidate currently records all four maintained paths as `NOT_RUN`; overall frozen-candidate acceptance remains `HOLD_FOR_LIVE_HOST_EVIDENCE`.

Accepted beta.1 and frozen beta.2/beta.3 evidence remains bounded to those exact historical candidates and must not be reused as beta.4 proof.

## Unreleased R3.2 Copilot evidence

R3.2 development has accepted bounded evidence on Copilot CLI 1.0.75 for:

- silent parent-session Hakim presence;
- bounded `lite` / `ultra` / `off` plugin-data state with stateless default `full`;
- plugin-qualified `/hakim/hakim <mode>` current-turn mode control;
- subagent continuity through an evidence-justified `subagentStart` reuse of the same presence authority;
- clean target-repository state during the accepted probes.

This is development evidence, not a claim that beta.4 or a not-yet-created beta.5 candidate has completed full native-host acceptance.

See [`docs/OPERATIONAL_PRESENCE.md`](docs/OPERATIONAL_PRESENCE.md).

## Design rule

Hakim does not force every host into the same adapter shape. Each maintained integration uses the strongest native extension model that materially improves the product while preserving the host's own permission and trust boundaries.

Unused extension surfaces are not added for symmetry. For example, Hakim does not add MCP, LSP, or another service merely because a host can support one.

## General boundaries

- Host-native security, permission, approval, sandbox, plugin, and managed-policy controls remain authoritative.
- A structural, smoke, packaging, or CI pass proves only its checked scope.
- Compatibility with every operating system, provider, model, editor version, organization policy, or long-running session is not established.
- Central marketplace/directory publication is a separate distribution action from repository-hosted Git marketplace installation.
- Candidate integrations not listed above are experimental or unsupported.
