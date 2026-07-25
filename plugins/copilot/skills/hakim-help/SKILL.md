---
name: hakim-help
description: Show a concise host-aware quick reference for Hakim modes, native plugin surfaces, capabilities, installation, and evidence boundaries. Use for Hakim help, Hakim commands, how to use Hakim, or supported Hakim features.
---

# Hakim Help

Use this one-screen reference. Capability scope is shared; installation and invocation intentionally use each host's native extension model.

## Modes

| Mode | Meaning |
|---|---|
| `lite` | Implement the request and name the smaller alternative. |
| `full` | Apply the complete Hakim ladder. Default. |
| `ultra` | Prefer deletion and require evidence before additions. |
| `off` | Do not apply Hakim guidance. |

## Capabilities

| Capability | Function |
|---|---|
| `hakim` | Apply the smallest-safe-diff decision ladder. |
| `hakim-review` | Review an explicit diff for removable complexity. |
| `hakim-audit` | Manually audit an explicitly inspected repository scope; the optional deterministic helper scans Python only with two rules. |
| `hakim-debt` | Collect live `hakim:` shortcuts and validate debt provenance. |
| `hakim-gain` | Show accepted evidence status without unsupported metrics. |
| `hakim-help` | Show this reference without changing state. |

Hakim maintains one canonical capability registry, but installed host plugins are not required to expose the source-repository registry path. Use the active host's discovered skills, commands, or agents as the runtime surface.

## Native host surfaces

- **Codex:** `codex plugin marketplace add Habib1001-m/hakim`, install `hakim@hakim` from `/plugins`, then use skills such as `$hakim:hakim`, `$hakim:hakim-review`, and `$hakim:hakim-help`.
- **Claude Code:** `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim`; explicit commands are `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:gain`, and `/hakim:help`.
- **GitHub Copilot:** `copilot plugin marketplace add Habib1001-m/hakim` then `copilot plugin install hakim@hakim`; inspect skills with `/skills list` and specialized agents with `/agent`.
- **OpenCode:** from the target repository run `npx --yes --package=github:Habib1001-m/hakim hakim-opencode install`, then use `/hakim full`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, or `/hakim-help`.

## OpenCode managed lifecycle

OpenCode installation is project-local. The current managed lifecycle creates `.opencode/hakim-runtime/install-manifest.json`, can adopt an exact recognized pre-manifest installation, can transactionally upgrade a complete verified supported older installation, and lets a newer CLI remove a supported older verified installation. Removal and rollback move owned bytes into same-filesystem quarantine and verify after the move before deletion; changed or independently reappearing user state is preserved no-clobber.

OpenCode mode state is process-local and session-scoped where a session ID is present. Reused system outputs contain at most one Hakim-owned activation range bounded by `<!-- hakim-system:v1 mode=... -->` and `<!-- /hakim-system:v1 -->`; repeated transforms do not duplicate Hakim instructions, mode changes replace only that range, `off` removes only that range, and unrelated system content around it is preserved.

## Distribution boundary

Repository-hosted native Git marketplaces are maintained for Codex, Claude Code, and GitHub Copilot. OpenCode uses a Git-backed bootstrap that creates the guarded project-local native plugin bundle; Hakim is not published to the npm registry and does not claim a global OpenCode installer, central plugin-directory listing, signing, notarization, or universal host compatibility.

The current bounded-sentinel OpenCode runtime has accepted real-host evidence on immutable candidate `8b9c0e7011d825f5aaf60763ed874d88c0c05b62` with OpenCode `1.17.13`, covering clean managed install/start/invocation and successful Hakim runtime use. Candidate `fbfd9354f16d58ec72da1458356a1fbc0b9a37f3` with OpenCode `1.18.5` remains bounded evidence for the unchanged accepted-old-to-managed upgrade and supported older-version removal journey; it is not reused as proof of the changed sentinel runtime. Earlier candidate `b442820d2803955d0f7f33b405bd096f443d4d72` remains historical evidence for the earlier create-only lifecycle only.

Host-native permissions, approval, trust, sandbox, managed policy, plugin enablement, and removal controls remain authoritative.

## Evidence boundary

Public CI, structural checks, package checks, Node-runtime matrix checks, and host-local validation prove only their inspected scope. Independent benchmark results, universal compatibility, correctness, security approval, performance gains, token savings, cost savings, adoption, and ROI remain `NOT_ESTABLISHED` unless separate accepted evidence establishes them.

## Boundary

One-shot reference. It changes no mode, files, settings, permissions, or runtime state.
