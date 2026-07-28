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
| Historical accepted host evidence | `conformance/history/` |
| Public repository health | `scripts/hakim_doctor.mjs` and Public CI |
| Release/version contract | `VERSIONING.md` |
| Support and deprecation boundary | `SUPPORT.md` |
| R3.2 operational-presence design/feasibility | `docs/OPERATIONAL_PRESENCE.md` |

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

`hakim-gain` is retained in the beta capability contract for compatibility. Its maintained user-facing meaning is **evidence status**, not quantified performance gain. A canonical replacement ID would be a separate capability migration and is therefore not introduced merely as a cleanup during product-readiness hardening.

## Host surfaces

### Codex

Repository-hosted native Git marketplace plugin with six skills and a compact SessionStart hook. The hook activates Hakim without injecting the complete canonical skill into every session.

### Claude Code

Native marketplace plugin with explicit commands, hidden model-invocable canonical skills, lifecycle hooks, read-only specialist agents, and an isolated-worktree implementation agent.

### GitHub Copilot CLI

Native marketplace plugin with six skills and five custom agents. `.github/copilot-instructions.md` is an optional repository baseline, not the primary product distribution.

The frozen beta.4 Copilot surface does not yet provide reliable automatic operational presence. R3.2 is evaluating a minimal plugin-contributed lifecycle layer whose purpose is to make Hakim silently available after install without replacing model reasoning or turning ordinary tool use into a policy workflow. That design remains feasibility work until accepted evidence exists; see `docs/OPERATIONAL_PRESENCE.md`.

### OpenCode

Native project-local plugin installed by the same guarded managed lifecycle regardless of entry point. Normal first-run uses a Git-backed `npx` bootstrap from the public Hakim repository, while source-checkout `npm run` commands remain development/inspection fallbacks. The bootstrap package exposes only the OpenCode CLI, installer/remover, transaction helper, canonical loader/policy/capabilities, and OpenCode plugin resources through an explicit package allowlist.

The maintained lifecycle persists a bounded install manifest; supports create, exact legacy/current adoption, transactional supported-version upgrade, and supported older-version removal; never edits `opencode.json`; and preserves unrelated `.opencode` content. Mutation uses same-filesystem quarantine plus post-move byte verification. Rollback restores actual quarantined bytes no-clobber and does not authorize deletion from a forged same-version ownership manifest.

OpenCode prompt activation is bounded by explicit start/end sentinels and remains idempotent. Reconciliation removes only the Hakim-owned sentinel range, preserves unrelated system content before or after it, and leaves an unbounded legacy marker untouched rather than guessing its ownership boundary. Session-specific modes are isolated; deletion affects only that session; missing-session calls use process fallback; and a fresh plugin instance resets to the configured default rather than sharing state across processes or projects.

The current beta.4 OpenCode path is `NOT_RUN` in the current native-host projection. Accepted beta.1 and frozen beta.2 evidence remains historical and is not promoted to beta.4 merely because parts of the architecture are similar.

## Runtime and filesystem boundaries

Host-native permission, approval, sandbox, trust, plugin, managed-policy, and removal controls remain authoritative.

Hakim's own mutation-capable code must be narrower than the user request and explicit about its mutation boundary. Current maintained OpenCode installation never edits `opencode.json` and refuses unsafe, partial, modified, unsupported-manifest, or unowned conflicting state.

Child processes used by maintained repository tooling should use bounded time/output behavior and avoid shell interpolation where possible.

## Evidence model

Keep these claims separate:

1. **Structural/CI conformance** — checked repository contracts passed.
2. **Live-host acceptance** — a real current-native install/start/invocation journey was observed for the exact candidate.
3. **Product usefulness/UX** — requires separate real-user or production-like evidence.
4. **Release authorization** — explicit operator decision outside ordinary CI success.
5. **Performance or quality improvement** — requires dedicated accepted evidence; it is not inferred from any item above.

The current beta.4 native-host projection is intentionally `HOLD_FOR_LIVE_HOST_EVIDENCE`. Prior accepted host evidence remains inspectable only for the immutable candidate on which it was observed. External evaluator recruitment remains suspended and requires a separate explicit product decision before any relaunch; neither structural success nor native-host acceptance may reopen it automatically.

## Truth-gate policy

Structured facts have structured authorities. Version, release channel, capability IDs, package metadata, supported-host acceptance state, host version, timestamps, and evidence references must be parsed and compared from machine-readable or structural sources rather than inferred from wording in README prose.

Free-form documentation is a projection of those authorities. Exact prose or stale-token assertions are permitted only as deliberate **negative tripwires** for retired language, unsafe obsolete instructions, or known truth-drift phrases. They are **not semantic proof** that documentation is correct, they cannot promote acceptance or release state, and a harmless copy edit must not be treated as new evidence.

When a fact becomes important enough to gate product state, prefer adding or reusing a structured authority and testing the projection against it rather than expanding positive substring matching. A passing prose-tripwire test means only that the checked obsolete wording is absent; it does not prove the replacement claim.

## Packaging and release

The canonical skill package uses an explicit allowlist rather than recursively shipping the source tree. ZIP member order, timestamps, and file modes are normalized so equivalent maintained source content can produce a byte-reproducible archive.

The root repository package is private and is not an npm registry release. Its `files` allowlist exists only to make the Git-backed OpenCode bootstrap bounded when npm/npx fetches Hakim directly from GitHub.

The shipped Git-backed package declares Node `>=22`. Public CI keeps the canonical repository gate on Node 24 and separately exercises the shipped OpenCode runtime/package surface on Node 22 and Node 26. That matrix is evidence for the declared JavaScript runtime floor/range, not for universal OpenCode or operating-system compatibility.

`npm run package:release` builds the canonical skill ZIP, a deterministic CycloneDX JSON SBOM for the Git-tracked source/product inventory, and checksum/manifest metadata covering both artifacts. The SBOM does not claim to inventory host binaries, model providers, operating-system packages, or unrelated local tooling.

Checksums prove artifact integrity against recorded digests. Reproducibility, SBOM scope, signing, notarization, and third-party attestation remain separate claims.

Any future external evaluation must identify an immutable Hakim source/tag/release reference so reports cannot silently refer to different revisions under the same prerelease identity.

## Design rules for new work

Before adding a component:

1. Prove a current product need.
2. Reuse the canonical source or an existing host-native surface.
3. Prefer standard-library and host-native capabilities.
4. Add no cross-host abstraction solely for symmetry.
5. Keep product claims narrower than the evidence.
6. Delete retired executable/product or reference surfaces instead of leaving dormant material in the public product tree without an explicit maintained role.
7. Preserve capable-model freedom: constrain objective consequences and truth boundaries before constraining reasoning paths.
