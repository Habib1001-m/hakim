# Hakim Architecture

Hakim has one canonical coding policy, one capability registry, and four host-native projections.

```text
core/hakim-skill/SKILL.md
          |
  capabilities.json
          |
  +-------+--------+---------+
  |       |        |         |
Codex   Claude   Copilot   OpenCode
```

## Canonical product

- `core/hakim-skill/SKILL.md` defines the smallest-safe decision ladder and `lite`, `full`, `ultra`, and `off` modes.
- `core/hakim-skill/capabilities.json` defines the six maintained capability IDs and their host paths.
- `core/hakim-skill/INSTALL.md` defines the supported installation and removal journeys.

Host projections may add native metadata, hooks, agents, or invocation syntax while preserving the canonical semantics.

## Host integrations

**Codex** uses a native marketplace plugin with skills and SessionStart presence.

**Claude Code** uses a native marketplace plugin with commands, skills, hooks, and scoped specialist agents.

**GitHub Copilot CLI** uses a native marketplace plugin with skills, agents, and bounded lifecycle hooks. Default `full` presence is stateless; non-default mode state is bounded to host-owned plugin data.

**OpenCode** uses a guarded project-local plugin. Its managed lifecycle supports bounded create/adopt/upgrade/remove behavior, refuses unsafe or conflicting state, does not edit `opencode.json`, and uses quarantine-backed rollback with no-clobber restoration.

Capability parity is semantic. Hakim does not add MCP, LSP, A2A, a daemon, or another cross-host abstraction simply to make the integrations look identical.

## State and trust boundaries

Host-native trust, permission, sandbox, managed-policy, cache, and removal controls remain authoritative.

Hakim-owned persistent state is intentionally small and purpose-specific. It does not persist raw prompts, source code, reasoning, credentials, or transcript content as product telemetry.

Mutation-capable lifecycle code must know what it owns and refuse partial, modified, unsupported, symlinked, or otherwise unsafe conflicting state.

## Packaging

The canonical skill ZIP is built from an explicit product allowlist: canonical instructions, capability skills, required notices, and the optional deterministic audit helper. Test harnesses, repository evidence, release history, and build tooling are not shipped inside the skill package.

The Git-backed OpenCode package is separately bounded by the root `package.json` files allowlist.

`npm run package:release` builds the deterministic skill ZIP, CycloneDX SBOM, checksums, and release manifest.

## Validation boundary

`npm test` checks maintained product/runtime contracts and release packaging. A green repository gate does not establish universal host compatibility, product effectiveness, or third-party approval.
