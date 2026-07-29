# Hakim Architecture

Hakim is intentionally small: one canonical decision policy, one capability registry, and host-native product projections that preserve each host's own extension and trust model.

## Authority map

Use one source of truth per question:

| Question | Authority |
|---|---|
| How Hakim makes coding decisions | `core/hakim-skill/SKILL.md` |
| Capability IDs, purposes, canonical skill paths, and host mappings | `core/hakim-skill/capabilities.json` |
| How to modify Hakim itself | `core/hakim-skill/AGENTS.md` |
| Installation and lifecycle | `core/hakim-skill/INSTALL.md` plus the maintained host integration |
| Supported hosts and compatibility boundaries | `SUPPORTED_HOSTS.md` |
| Current frozen-candidate live-host evidence | `conformance/native-host-acceptance.json` |
| Historical accepted host evidence | `conformance/history/` |
| Public repository health | `scripts/hakim_doctor.mjs` and Public CI |
| Product-readiness state | `docs/PRODUCT_READINESS.md` |
| Operational-presence architecture | `docs/OPERATIONAL_PRESENCE.md` |
| Release/version contract | `VERSIONING.md` |
| Support and deprecation boundary | `SUPPORT.md` |

Tests, old issues, PR discussions, research notes, and immutable evidence refs support their checked scope; they are not higher authority than the maintained sources above.

## Product shape

```text
                    canonical decision policy
                  core/hakim-skill/SKILL.md
                              |
                      capabilities.json
                              |
          +-------------------+-------------------+
          |                   |                   |
        Codex             Claude Code         Copilot CLI
   native skills/hook   commands/skills/     skills/agents/
                         agents/hooks           hooks
          \                   |                   /
           \------------------+------------------/
                              |
                           OpenCode
                   project-local native plugin
```

Capability parity is semantic. Invocation syntax, startup behavior, agents, hooks, permissions, trust, sandboxing, and removal are allowed to differ by host.

Hakim does not add MCP, LSP, A2A, a workflow engine, telemetry service, daemon, or another cross-host runtime merely to make integrations look symmetrical.

## Canonical policy and projections

`core/hakim-skill/SKILL.md` contains the seven-rung smallest-safe decision ladder and the `lite`, `full`, `ultra`, and `off` modes.

`core/hakim-skill/capabilities.json` defines six maintained capability IDs:

- `hakim`
- `hakim-review`
- `hakim-audit`
- `hakim-debt`
- `hakim-gain`
- `hakim-help`

Host projections may add native metadata or UX, but they must preserve canonical semantics. Projection checks detect drift; they do not prove that the canonical policy itself is correct or effective on every task.

`hakim-gain` remains a beta compatibility ID. Its maintained meaning is evidence-status reporting, not quantified performance gain. A replacement ID would be a deliberate capability migration rather than opportunistic cleanup.

## Host surfaces

### Codex

Repository-hosted native Git marketplace plugin with six skills and a compact SessionStart hook. Host trust, sandbox, approval, and hook policy remain authoritative.

### Claude Code

Native marketplace plugin with explicit commands, hidden model-invocable canonical skills, lifecycle hooks, read-only specialist agents, and an isolated-worktree implementation agent.

### GitHub Copilot CLI

Native marketplace plugin with six skills and five custom agents. `.github/copilot-instructions.md` is an optional repository baseline, not the primary product distribution.

R3.2 adds a deliberately small operational-presence layer:

```text
sessionStart            -> parent-session presence
subagentStart           -> subagent continuity using the same presence authority
userPromptSubmitted     -> bounded non-default mode persistence
userPromptTransformed   -> current-turn mode-control semantics
```

The accepted development evidence through F04 proves silent parent presence, bounded mode persistence/reset, current-turn mode control, and Explore-subagent continuity on Copilot CLI 1.0.75. No `preToolUse`, `postToolUse`, `agentStop`, or `subagentStop` enforcement hook is part of the accepted topology.

This is unreleased R3.2 development, not a relabeling of frozen beta.4 live-host acceptance. See `docs/OPERATIONAL_PRESENCE.md`.

### OpenCode

Native project-local plugin installed by the same guarded managed lifecycle regardless of entry point. Normal first-run uses a Git-backed `npx` bootstrap from the public repository; source-checkout commands remain development/inspection fallbacks.

The lifecycle persists a bounded install manifest; supports create, exact legacy/current adoption, transactional supported-version upgrade, and supported older-version removal; never edits `opencode.json`; and preserves unrelated `.opencode` content. Mutation uses same-filesystem quarantine plus post-move byte verification, and rollback restores actual quarantined bytes no-clobber.

Prompt activation uses explicit start/end ownership sentinels. Reconciliation removes only the Hakim-owned range, preserves unrelated system content, and refuses to guess ownership of unbounded legacy state.

The frozen beta.4 OpenCode path remains `NOT_RUN` in the current native-host projection. Older accepted evidence remains historical and candidate-bounded.

## Runtime and filesystem boundaries

Host-native permission, approval, sandbox, trust, plugin, managed-policy, and removal controls remain authoritative.

Hakim's mutation-capable code must be narrower than the user request and explicit about ownership. The maintained OpenCode lifecycle refuses unsafe, partial, modified, unsupported-manifest, or unowned conflicting state.

Child processes used by maintained repository tooling should use bounded time/output behavior and avoid shell interpolation where possible.

Operational-presence state belongs to host-owned plugin data, never the target repository. Hakim does not persist raw prompts, source code, tool arguments, reasoning, credentials, or private evidence as mode state.

## Evidence model

Keep these claims separate:

1. **Structural/CI conformance** — checked repository contracts passed.
2. **Live-host acceptance** — a real install/start/invocation journey was observed for the exact candidate being claimed.
3. **Bounded behavioral evidence** — a particular host/task behavior was observed with its stated controls and limitations.
4. **Product usefulness/UX** — requires production-like or independent user evidence appropriate to the claim.
5. **Release authorization** — explicit operator decision outside ordinary CI success.
6. **Performance or quality improvement** — requires dedicated accepted evidence and is never inferred from installation or CI.

The latest frozen prerelease is beta.4. Current R3.2 development evidence does not silently promote beta.4 or create beta.5 evidence before a beta.5 candidate exists.

External evaluator recruitment remains suspended and requires a separate product decision.

## Truth-gate policy

Structured facts have structured authorities. Version, release channel, capability IDs, package metadata, supported-host acceptance state, host version, timestamps, and evidence references should be parsed and compared from machine-readable or structural sources rather than inferred from README wording.

Free-form documentation is a projection of those authorities. Stale-token checks may be used as negative tripwires, but positive prose matching is not semantic proof that documentation is correct.

When a fact becomes important enough to gate product state, prefer a structured authority and a projection check over additional prose assertions.

## Packaging and release

The canonical skill package uses an explicit allowlist rather than recursively shipping the source tree. ZIP member order, timestamps, and file modes are normalized for byte-reproducible output from equivalent maintained source.

The root repository package is private and is not an npm registry release. Its `files` allowlist exists only to bound the Git-backed OpenCode bootstrap when npm/npx fetches Hakim directly from GitHub.

The shipped Git-backed package declares Node `>=22`. Public CI uses Node 24 for the canonical repository gate and exercises the shipped JavaScript/OpenCode surface on Node 22 and Node 26 as compatibility edges.

`npm run package:release` builds the canonical skill ZIP, deterministic CycloneDX JSON SBOM, and checksum/manifest metadata. Checksums prove integrity against recorded digests; signing, notarization, third-party attestation, publication, and host acceptance remain separate claims.

Any future external evaluation must identify an immutable Hakim source/tag/release reference.

## Design rules for new work

Before adding a component:

1. Prove a current product need.
2. Reuse the canonical source or an existing host-native surface.
3. Prefer standard-library and host-native capabilities.
4. Add no cross-host abstraction solely for symmetry.
5. Keep product claims narrower than the evidence.
6. Delete retired executable/product/reference surfaces instead of retaining dormant alternatives without a maintained role.
7. Preserve capable-model freedom: constrain objective consequences and truth boundaries before constraining reasoning paths.
