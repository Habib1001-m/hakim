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
| Current native live-host evidence | `conformance/native-host-acceptance.json` |
| Public repository health | `scripts/hakim_doctor.mjs` and Public CI |
| Release/version contract | `VERSIONING.md` |

Tests, examples, old issues, research notes, and generated artifacts are evidence for their checked scope; they are not higher authority than the sources above.

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
   native skills/hook   commands/skills/     skills/custom
                         agents/hooks           agents
          \                   |                   /
           \------------------+------------------/
                              |
                           OpenCode
                   project-local native plugin
```

Capability parity is semantic. Invocation syntax, startup behavior, agents, hooks, permissions, trust, sandboxing, and removal are allowed to differ by host.

Hakim does not add MCP, LSP, A2A, a workflow engine, a telemetry service, or another cross-host runtime merely to make integrations look symmetrical.

## Canonical policy and projections

`SKILL.md` contains the seven-rung smallest-safe-diff ladder and the `lite`, `full`, `ultra`, and `off` modes.

`capabilities.json` defines six current capability IDs:

- `hakim`
- `hakim-review`
- `hakim-audit`
- `hakim-debt`
- `hakim-gain`
- `hakim-help`

Host projections may add native metadata or UX, but they must preserve canonical semantics. Projection checks detect drift; they do not prove that the canonical policy itself is correct.

`hakim-gain` is retained in the current beta for compatibility even though its maintained behavior is evidence/status reporting rather than a quantified performance-gain claim. A rename would be a separate capability migration, not a cosmetic edit in this remediation slice.

## Host surfaces

### Codex

Repository-hosted native Git marketplace plugin with six skills and a compact SessionStart hook. The hook activates Hakim without injecting the complete canonical skill into every session.

### Claude Code

Native marketplace plugin with explicit commands, hidden model-invocable canonical skills, lifecycle hooks, read-only specialist agents, and an isolated-worktree implementation agent.

### GitHub Copilot CLI

Native marketplace plugin with six skills and five custom agents. `.github/copilot-instructions.md` is an optional repository baseline, not the primary product distribution.

### OpenCode

Native project-local plugin installed by the same guarded create-only lifecycle regardless of entry point. Normal first-run uses a Git-backed `npx` bootstrap from the public Hakim repository, while source-checkout `npm run` commands remain development/inspection fallbacks. The bootstrap package exposes only the OpenCode CLI, installer/remover, canonical loader/policy/capabilities, and OpenCode plugin resources through an explicit package allowlist.

The maintained lifecycle refuses conflicting or unsafe target state, verifies canonical hashes, never edits `opencode.json`, and uses exact-match removal with quarantine/rollback safeguards. The Git-backed bootstrap does not publish Hakim to the npm registry and does not create a global Hakim/OpenCode installation.

Because first-run transport is part of the observed product journey, structural tests for the new bootstrap do not silently replace the earlier live-host evidence. The exact Git-backed install/start/invocation journey requires fresh accepted real-host evidence before it is independently promoted.

## Runtime and filesystem boundaries

Host-native permission, approval, sandbox, trust, plugin, managed-policy, and removal controls remain authoritative.

Hakim's own mutation-capable code must be narrower than the user request and explicit about its mutation boundary. Current maintained OpenCode installation never overwrites an existing Hakim path or edits `opencode.json`.

Child processes used by maintained repository tooling should use bounded time/output behavior and avoid shell interpolation where possible.

## Evidence model

Keep these claims separate:

1. **Structural/CI conformance** — checked repository contracts passed.
2. **Live-host acceptance** — a real current-native install/start/invocation journey was observed.
3. **Product usefulness/UX** — requires separate real-user evidence.
4. **Release authorization** — explicit operator decision outside ordinary CI success.
5. **Performance or quality improvement** — requires dedicated accepted evidence; it is not inferred from any item above.

Current native runtime evidence for the four maintained hosts is recorded publicly. External evaluator recruitment is suspended during POST-BETA-R1 remediation and must not be inferred from native-host `PASS` status. A newly introduced first-run transport must carry its own accepted observation before that exact transport is described as live accepted.

## Packaging and release

The canonical skill package uses an explicit allowlist rather than recursively shipping the source tree. ZIP member order, timestamps, and file modes are normalized so equivalent maintained source content can produce a byte-reproducible archive.

The root repository package is private and is not an npm registry release. Its `files` allowlist exists only to make the Git-backed OpenCode bootstrap bounded when npm/npx fetches Hakim directly from GitHub.

Checksums prove artifact integrity against a recorded digest. Reproducibility is a separate claim and must be tested independently.

Any future external evaluation must identify an immutable Hakim source/tag/release reference so reports cannot silently refer to different `main` revisions under the same prerelease version string.

## Design rules for new work

Before adding a component:

1. Prove a current product need.
2. Reuse the canonical source or an existing host-native surface.
3. Prefer standard-library and host-native capabilities.
4. Add no cross-host abstraction solely for symmetry.
5. Keep product claims narrower than the evidence.
6. Delete retired executable/product surfaces instead of leaving dormant alternate architectures in the public tree.
