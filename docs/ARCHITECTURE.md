# Hakim Architecture

Hakim is intentionally small: one canonical decision policy, one capability registry, and host-native product projections that preserve each host's extension and trust model.

## Authority map

Use one source of truth per question:

| Question | Authority |
|---|---|
| Coding decisions | `core/hakim-skill/SKILL.md` |
| Capability IDs and host mappings | `core/hakim-skill/capabilities.json` |
| Repository modification rules | `core/hakim-skill/AGENTS.md` |
| Installation and lifecycle | `core/hakim-skill/INSTALL.md` plus the host integration |
| Distribution identity and install pins | `conformance/distribution-identity.json` |
| Live-host acceptance projections | `conformance/native-host-acceptance.json` and `conformance/history/` |
| Supported hosts | `SUPPORTED_HOSTS.md` |
| Version/release contract | `VERSIONING.md` |
| Support boundary | `SUPPORT.md` |
| Repository health | `npm test`, `scripts/hakim_doctor.mjs`, and Public CI |

Documentation projects these authorities for readers. It is not a second project-state database.

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

Capability parity is semantic. Invocation syntax, startup behavior, agents, hooks, permissions, trust, sandboxing, and removal may differ by host.

Hakim does not add MCP, LSP, A2A, a workflow engine, telemetry service, daemon, or another cross-host runtime merely to make integrations look symmetrical.

## Canonical policy and capabilities

`core/hakim-skill/SKILL.md` contains the seven-rung smallest-safe decision ladder and the `lite`, `full`, `ultra`, and `off` modes.

`core/hakim-skill/capabilities.json` defines six maintained capability IDs:

- `hakim`
- `hakim-review`
- `hakim-audit`
- `hakim-debt`
- `hakim-gain`
- `hakim-help`

Host projections may add native metadata or UX while preserving canonical semantics. Projection checks detect drift; they do not prove universal effectiveness.

`hakim-gain` is a retained beta compatibility ID for evidence-status reporting, not a quantified performance claim.

## Host surfaces

### Codex

Repository-hosted native Git marketplace plugin with six skills and SessionStart presence. Host trust, sandbox, approval, and hook policy remain authoritative.

### Claude Code

Native marketplace plugin with explicit commands, hidden model-invocable skills, lifecycle hooks, and scoped specialist agents.

### GitHub Copilot CLI

Native marketplace plugin with six skills and five custom agents. `.github/copilot-instructions.md` is an optional repository baseline, not the primary product distribution.

Moving development uses a deliberately small lifecycle topology:

```text
sessionStart            -> silent parent-session presence
subagentStart           -> subagent continuity using the same presence authority
userPromptSubmitted     -> bounded non-default mode persistence
userPromptTransformed   -> current-turn mode-control semantics
agentStop               -> late objective contradiction check
```

The first four hooks preserve ordinary prompt freedom and keep mode state in host-owned plugin data. Default `full` is stateless.

The `agentStop` hook is a late-bound objective-truth mechanism. It reads host-provided runtime context ephemerally, reuses existing structured completion checkpoints, and may request one correction only when a supported observable repository/setup fact contradicts a consequential structured claim. It does not add broad command blocking, general prose linting, raw transcript persistence, or a second reasoning engine. When the stop hook is already active, it allows termination to prevent correction loops.

Live-host evidence remains separate from repository implementation and tests.

### OpenCode

Native project-local plugin installed by a guarded managed lifecycle. The lifecycle persists a bounded install manifest; supports create, exact adoption, supported-version upgrade, and supported older-version removal; never edits `opencode.json`; and preserves unrelated `.opencode` content.

Mutation uses same-filesystem quarantine plus post-move byte verification. Rollback restores actual quarantined bytes with no-clobber semantics.

Prompt activation uses explicit ownership sentinels so Hakim removes only its own range and refuses to guess ownership of unbounded legacy state.

## Runtime and state boundaries

Host-native permission, approval, sandbox, trust, plugin, managed-policy, and removal controls remain authoritative.

Hakim-owned state must be bounded and purpose-specific. Copilot mode state contains only schema/version mode metadata in host-owned plugin data. Hakim does not persist raw prompts, source code, tool arguments, reasoning, credentials, or transcript content as product state.

Mutation-capable code must be explicit about ownership and refuse unsafe, partial, modified, unsupported, or unowned conflicting state.

## Evidence model

Keep these claims separate:

1. **Structural/CI conformance** — checked repository contracts passed.
2. **Live-host acceptance** — a real install/start/invocation journey was observed for the exact identity being claimed.
3. **Bounded behavioral evidence** — a specific host/task behavior was observed within stated limits.
4. **Product usefulness/UX** — requires suitable dogfood or user evidence.
5. **Release authorization** — a product decision separate from ordinary CI success.
6. **Performance or quality improvement** — requires dedicated evidence and is never inferred from installation or CI.

Evidence remains tied to the exact source identity on which it was observed.

## Truth-gate policy

Structured facts have structured authorities. Versions, release channels, package metadata, capability IDs, install pins, supported-host acceptance, host versions, timestamps, and evidence references should be parsed from machine-readable or structural sources.

Free-form documentation is reader-facing projection. Tests may reject stale or unsafe public surfaces, but prose order is not a product invariant.

When a fact becomes important enough to gate product behavior, prefer a structured authority and focused test over additional status prose.

## Packaging and release

The canonical skill package uses an explicit allowlist and normalized member metadata for reproducible output.

The root package is private; its `files` allowlist bounds the Git-backed OpenCode bootstrap and is not an npm registry release.

The Git-backed package declares Node `>=22`. Public CI exercises the maintained JavaScript/OpenCode surface on Node 22, 24, and 26.

`npm run package:release` builds the canonical skill ZIP, deterministic CycloneDX SBOM, and checksum/manifest metadata. Those artifacts prove their checked integrity scope, not publication, signing, third-party attestation, host acceptance, or product effectiveness.

## Design rules

Before adding a component:

1. Prove a current product need.
2. Reuse the canonical source or an existing host-native surface.
3. Prefer standard-library and host-native capabilities.
4. Add no cross-host abstraction solely for symmetry.
5. Keep product claims narrower than the evidence.
6. Remove retired executable/product/reference surfaces instead of retaining dormant alternatives.
7. Preserve capable-model freedom: constrain objective consequences and truth boundaries before reasoning paths.
