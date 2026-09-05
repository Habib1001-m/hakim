# Hakim Architecture

Hakim has one canonical judgment model, six canonical capabilities, and four host-native projections.

```text
                core/hakim-skill/
        ┌──────────────┴──────────────┐
   canonical skills             capabilities.json
        │                              │
        └──────────────┬───────────────┘
                       │
          ┌────────────┼────────────┬────────────┐
          │            │            │            │
        Codex       Claude       Copilot      OpenCode
```

## Canonical product

The capability set is exactly:

```text
hakim  review  audit  debt  status  help
```

- `core/hakim-skill/SKILL.md` defines core execution judgment and `lite`, `full`, `ultra`, and `off` modes.
- `core/hakim-skill/skills/` contains the five specialized capability contracts.
- `core/hakim-skill/capabilities.json` maps those six semantic capabilities to host-native surfaces.
- `core/hakim-skill/INSTALL.md` documents supported installation and removal journeys.

The shared root skill uses a deliberately portable frontmatter contract: `name` plus `description`. Codex, Claude Code, and Copilot root skill projections are byte-identical to that canonical source. Host projections may add native plugin metadata, hooks, agents, state, or invocation syntax around the skills, but they must not create a second capability-contract layer.

## Host integrations

**Codex** uses a native marketplace plugin with six skill projections and compact SessionStart presence.

**Claude Code** uses a native marketplace plugin with six skill projections, compact SessionStart presence, and scoped execution agents. Agents preload a canonical skill; they do not own another contract.

**GitHub Copilot CLI** uses a native marketplace plugin with six skill projections, thin execution agents, and bounded lifecycle hooks. Default `full` presence is stateless; non-default mode state is bounded to host-owned plugin data.

**OpenCode** uses a guarded project-local plugin. Its managed lifecycle supports bounded create/adopt/upgrade/remove behavior, refuses unsafe or conflicting state, does not edit `opencode.json`, and uses quarantine-backed rollback with no-clobber restoration.

Capability parity is semantic. Hakim does not add MCP, LSP, A2A, a daemon, or another cross-host abstraction simply to make the integrations look identical.

## Runtime core

Where a host supports startup/system injection, Hakim supplies only the compact core needed before the first coding decision:

- bounded understanding and stop-inspecting judgment;
- the decision ladder;
- proportional verification;
- depth earned by actual uncertainty/risk;
- preservation of real guards;
- separation of evidence from authority;
- evidence-bound consequential claims.

Specialized `review`, `audit`, `debt`, `status`, and `help` contracts are loaded when needed rather than injected into every session.

## State and trust boundaries

Host-native trust, permission, sandbox, managed-policy, cache, and removal controls remain authoritative.

Hakim-owned persistent state is intentionally small and purpose-specific. It does not persist raw prompts, source code, reasoning, credentials, or transcript content as product telemetry.

Mutation-capable lifecycle code must know what it owns and refuse partial, modified, unsupported, symlinked, or otherwise unsafe conflicting state.

## Packaging

The canonical skill ZIP is built from an explicit product allowlist: the core skill, five specialized skills, capability mapping, installation/help documentation, required notices, and the optional deterministic audit helper. Test harnesses, repository evidence, release history, and build tooling are not shipped inside the skill package.

Before artifact generation, the packager validates all six canonical skill frontmatter surfaces and rejects malformed metadata, capability name/path mismatch, unexpected skill directories, symlinked/unsafe structures, and extra files in specialized skill directories.

The Git-backed OpenCode package is separately bounded by the root `package.json` files allowlist and preserves exact prior-version lifecycle authorities needed for safe managed upgrade/remove behavior.

`npm run package:release` builds the deterministic skill ZIP, CycloneDX SBOM, checksums, and release manifest.

## Validation boundary

`npm test` checks maintained product/runtime contracts and release packaging. A green repository gate does not establish universal host compatibility, product effectiveness, or third-party approval.
