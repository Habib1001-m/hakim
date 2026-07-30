# Supported Hosts

Hakim is public beta software. The latest frozen prerelease is `1.0.0-beta.4` at exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`. Moving `main` reports `1.0.0-beta.4.post1` and is explicit unreleased development, not a frozen candidate.

Support means the repository maintains a documented, gated product surface for the host. It does not imply universal compatibility, current candidate acceptance, or stable-release authorization.

| Host | Maintained product surface | Frozen beta.4 install | Current boundary |
|---|---|---|---|
| Codex | Native Git marketplace plugin with six skills and SessionStart activation | `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Codex `0.145.0` exact-candidate journey is accepted; `0.131.0+` remains the maintained compatibility floor; central directory listing is separate and not claimed |
| Claude Code | Native marketplace plugin with commands, hidden canonical skills, lifecycle hooks, and specialized agents | `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim`; catalog plugin source is `git-subdir` pinned to exact SHA `5d00039479f2f11b7fe30ccf2385e70ce24553c3` | repaired route remains `NOT_RUN`; earlier `#<commit>` marketplace registration failed because Claude treated the SHA as a branch |
| GitHub Copilot CLI | Native marketplace plugin with six skills, five custom agents, and R3.2 lifecycle presence/mode/subagent continuity | `copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3` | frozen beta.4 acceptance remains `NOT_RUN`; Copilot CLI 1.0.75 R3.2 evidence is development-only through F04 |
| OpenCode | Guarded project-local plugin with exact manifest, bounded create/adopt/transactional-upgrade/removal, ownership sentinels, quarantine verification, and no-clobber rollback | `npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install` | Node `>=22`; frozen beta.4 acceptance remains `NOT_RUN`; no npm registry/global installer or `opencode.json` mutation is claimed |

## Distribution identity authorities

The machine-readable mapping is [`conformance/distribution-identity.json`](conformance/distribution-identity.json).

It links two separate acceptance projections:

- moving unreleased development: [`conformance/native-host-acceptance.json`](conformance/native-host-acceptance.json);
- frozen beta.4: [`conformance/history/native-host-acceptance-1.0.0-beta.4.json`](conformance/history/native-host-acceptance-1.0.0-beta.4.json).

Both remain `HOLD_FOR_LIVE_HOST_EVIDENCE`, but frozen beta.4 now contains accepted Codex evidence. A host reaches `PASS` only after a real install/start/invocation journey is accepted for the exact version and source SHA being claimed.

Structural, packaging, smoke, projection, or CI success does not change live-host status. A new prerelease identity or materially changed transport/lifecycle/runtime requires its own evidence.

## Node runtime contract

The Git-backed Hakim package declares Node `>=22`. Public CI uses Node 24 for the canonical repository gate and separately exercises the shipped JavaScript/OpenCode surface on Node 22 and Node 26 through `npm run test:node-compat`.

That matrix is a JavaScript runtime contract, not a claim of universal operating-system, host-version, or provider compatibility.

## Unreleased R3.2 Copilot evidence

R3.2 development has accepted bounded evidence on Copilot CLI 1.0.75 for:

- silent parent-session presence;
- bounded `lite` / `ultra` / `off` plugin-data state with stateless default `full`;
- plugin-qualified `/hakim/hakim <mode>` current-turn control;
- subagent continuity through an evidence-justified `subagentStart` reuse of the same presence authority;
- clean target-repository state during accepted probes.

This is development evidence tied to exact immutable R3.2 refs. It does not prove beta.4 or a not-yet-created beta.5 candidate has completed native-host acceptance.

See [`docs/OPERATIONAL_PRESENCE.md`](docs/OPERATIONAL_PRESENCE.md).

## Design rule

Hakim does not force every host into the same adapter shape. Each maintained integration uses the strongest native extension model that materially improves the product while preserving the host's permission and trust boundaries.

Unused extension surfaces are not added for symmetry. Hakim does not add MCP, LSP, or another service merely because a host can support one.

## General boundaries

- Host-native security, permission, approval, sandbox, plugin, and managed-policy controls remain authoritative.
- A structural, smoke, packaging, or CI pass proves only its checked scope.
- Compatibility with every operating system, provider, model, editor version, organization policy, or long-running session is not established.
- Central marketplace/directory publication is separate from repository-hosted Git marketplace installation.
- Candidate integrations not listed above are experimental or unsupported.
