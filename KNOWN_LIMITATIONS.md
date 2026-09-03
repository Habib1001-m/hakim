# Known Limitations

Hakim remains public beta software.

## Distribution

- Frozen `1.0.0-beta.4` is pinned to exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.
- Moving `main` is unreleased development and is not a frozen candidate.
- No npm registry package or central marketplace/directory listing is claimed.
- OpenCode uses npm/npx as Git transport/command execution; it does not create a global Hakim/OpenCode installation.
- Release artifacts are not signed, notarized, or externally attested.
- The repository generates a deterministic CycloneDX SBOM, but no external SBOM attestation is claimed.
- No public SLA or LTS commitment is provided.

## Compatibility

- Exact frozen beta.4 live-host evidence exists for Codex, Claude Code, GitHub Copilot CLI, and OpenCode, but it is bounded to the recorded host versions/environments.
- Codex `0.131.0+` is the maintained compatibility floor for the bundled plugin-hook path.
- The Git-backed OpenCode package declares Node `>=22`; Public CI exercises the maintained JavaScript/OpenCode surface on Node 22, 24, and 26.
- Universal operating-system, editor-version, provider, model, organization-policy, and future host-version compatibility is not established.
- Host-native approval, sandboxing, permissions, managed policy, cache behavior, and removal remain outside Hakim's authority.

## Operational behavior

- Moving Copilot development includes silent parent-session presence, bounded mode state, subagent continuity, and a late objective-contradiction hook.
- Repository tests do not by themselves establish that every supported Copilot version executes those hooks identically.
- The late objective-contradiction mechanism remains development behavior until its live-host path is validated on the exact source being claimed.
- Hakim fails soft when host/runtime truth required by a hook is unavailable; it does not claim a universal final-response correctness guarantee.

## OpenCode lifecycle

- The managed project-local lifecycle refuses partial, modified, unsafe, malformed, unsupported, or unowned conflicting state.
- Force overwrite and force removal are not implemented.
- Removal and rollback use same-filesystem quarantine, post-move verification, and no-clobber restoration.
- Hakim does not claim a cross-process operation lock or immunity to malicious/concurrent filesystem replacement outside validated checkpoints.
- Hakim does not edit `opencode.json`, rotate credentials, or repair host security configuration.

## Evaluation boundaries

- Deterministic checks cover only their enabled rules.
- Zero findings do not equal correctness, security approval, semantic equivalence, or product usefulness.
- Public CI cannot create live-host evidence by itself.
- Evidence recorded for one source identity is not automatically valid for another.
- Hakim makes no general claim about model quality, speed, token use, cost, adoption, safety improvement, or return on investment.

## Privacy

- Hakim does not implement a telemetry collection service.
- Hakim does not enable raw prompt or source-code logging as a product feature.
- Bounded host-owned mode state does not contain raw prompts, source code, tool arguments, reasoning, credentials, or transcript content.

Security response and maintenance are best-effort during public beta; see [SUPPORT.md](SUPPORT.md).
