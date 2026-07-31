# Known Limitations

Hakim remains public beta software.

The latest frozen prerelease is `1.0.0-beta.4` at exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3`. Moving `main` reports `1.0.0-beta.4.post1` and contains unreleased R3.2 work through F04. It is not a frozen candidate, not beta.5, and not release/promotion evidence.

## Distribution

- `conformance/distribution-identity.json` is the machine-readable mapping authority.
- Normal frozen beta.4 install routes are pinned to the exact beta.4 source SHA; moving `main` is development-only.
- The source repository is public.
- No npm registry publication or central marketplace/directory listing is claimed.
- OpenCode uses npm/npx only as Git transport/command execution; it creates no registry publication or global Hakim/OpenCode installation.
- Local build outputs are not signed, notarized, or externally attested.
- The repository produces and verifies a deterministic CycloneDX SBOM, but no external SBOM attestation/signing is claimed.
- No public support SLA or LTS commitment is provided.

## Compatibility

- Supported-host evidence is bounded to documented environments and exact source/product identities.
- Codex `0.131.0+` is the compatibility floor for the maintained default-on bundled plugin-hook contract.
- The shipped Git-backed OpenCode package declares Node `>=22`; Public CI exercises its JavaScript/OpenCode package surface on Node 22, 24, and 26.
- R3.2 operational-presence live evidence is specific to GitHub Copilot CLI 1.0.75 and the exact immutable development refs on which the probes ran.
- Universal operating-system, editor-version, provider, model, organization-policy, and host-version compatibility is not established.
- Host-native approval, activation, sandboxing, permissions, managed policy, and removal remain authoritative.

## Security and lifecycle

- OpenCode's managed project-local lifecycle validates the canonical bundle and lifecycle manifest, refuses unsafe or conflicting state, supports bounded create/adopt/transactional-upgrade transitions, and can remove supported older verified installations with a newer CLI.
- Removal and rollback use same-filesystem quarantine and post-move verification; concurrently replaced or independently reappearing user state is preserved no-clobber.
- OpenCode prompt ownership is bounded by explicit start/end sentinels. Hakim removes only its owned range and does not destructively guess ownership of unbounded legacy state.
- The lifecycle does not claim a cross-process operation lock or immunity to malicious/concurrent filesystem replacement outside validated checkpoints.
- Force overwrite and force removal are not implemented.
- Ambiguous, mismatched, partial, unsupported-manifest, or unsafe states are intentionally refused.
- Hakim does not rotate credentials or repair host security configuration.

## Operational presence

Accepted R3.2 Copilot development behavior is deliberately narrow:

- parent-session presence uses `sessionStart`;
- subagent continuity uses one evidence-justified `subagentStart` hook reusing the same presence authority;
- explicit mode persistence is bounded to plugin-owned state;
- current-turn mode semantics use `userPromptTransformed` without state access;
- no `preToolUse`, `postToolUse`, `agentStop`, or `subagentStop` enforcement hook is accepted through F04.

This does not prove every subagent type, long-running session, future Copilot version, or other host preserves identical behavior.

P0 — Truthful Immutable Distribution Identity is the current repository gate. F05 Objective Completion Truth remains unimplemented and must not start until P0 closes. Hakim therefore does not yet claim a completed late-bound mechanism that can always reconcile consequential final claims with objective repository/setup state.

## Evaluation

- Deterministic checks cover only their enabled rules.
- Zero findings do not equal correctness, security approval, semantic equivalence, or product usefulness.
- Moving-development live-host authority: `conformance/native-host-acceptance.json`.
- Frozen beta.4 live-host authority: `conformance/history/native-host-acceptance-1.0.0-beta.4.json`.
- Both currently remain `HOLD_FOR_LIVE_HOST_EVIDENCE`, but evidence and status are not transferable between them.
- R3.2 Copilot observations are bounded development evidence and are not relabeled as beta.4 or future-candidate acceptance.
- Public CI validates repository contracts and cannot create or promote live-host evidence by itself.
- Repository health or live-host `PASS` does not imply stable-release authorization.
- External evaluator recruitment remains suspended; the withdrawn campaign accepted no external reports.
- Future external evaluation must identify an immutable Hakim source/tag/release reference.
- Hakim makes no general claims about model quality, speed, token use, cost, adoption, safety improvement, or return on investment.

## Privacy and support

- Hakim does not implement a product telemetry collection service.
- Hakim does not enable raw prompt or source-code logging.
- Repository evidence and outcome schemas are local validation artifacts, not product telemetry.
- Security response and maintenance are best-effort during public beta; see `SUPPORT.md`.
