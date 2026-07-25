# Known Limitations

Hakim `1.0.0-beta.1` remains public beta software.

## Distribution

- The source repository is public.
- No npm registry package/publication or central marketplace/directory listing is currently provided.
- OpenCode's Git-backed bootstrap uses npm/npx only as transport/command execution for the public Git repository; it does not create a registry publication or global Hakim/OpenCode installation.
- Local skill-package build outputs are not signed, notarized, or externally attested.
- No SBOM or public support SLA is currently provided.

## Compatibility

- Supported-host evidence is bounded to documented environments.
- Codex `0.131.0+` is the compatibility floor for this beta's default-on bundled plugin-hook contract. In tag `rust-v0.130.0`, `plugin_hooks` was still under development and disabled by default; in `rust-v0.131.0`, it is stable and enabled by default.
- The shipped Git-backed OpenCode package declares Node `>=22`; Public CI exercises its package/runtime surface on Node 22, 24, and 26. That is not a claim of universal OS or OpenCode-version compatibility.
- Universal operating-system, editor-version, provider, and model compatibility is not established.
- Host-native approval, activation, sandboxing, and removal remain authoritative.

## Security

- OpenCode's managed project-local lifecycle validates the canonical bundle and lifecycle manifest, refuses unsafe or conflicting state, supports bounded create/adopt/transactional-upgrade transitions, and can remove a supported older verified installation with a newer CLI.
- Removal and rollback move Hakim-owned bytes into same-filesystem quarantine and verify the moved bytes before deletion. Concurrently replaced or independently reappearing user state is preserved no-clobber.
- OpenCode prompt ownership is bounded by explicit start/end sentinels. Hakim removes only its own bounded activation range and preserves unrelated system content before or after that range; an unbounded legacy marker is not destructively guessed.
- The maintained OpenCode project-local lifecycle does not claim a cross-process operation lock or immunity to malicious/concurrent filesystem replacement outside its validated checkpoints.
- These safeguards reduce risk but do not prevent every action by unrelated local processes.
- Force overwrite and force removal are not implemented.
- Ambiguous, mismatched, partial, unsupported-manifest, or unsafe states are intentionally refused.
- Hakim does not rotate credentials or repair host security configuration.

## Evaluation

- Deterministic checks cover only their enabled rules.
- Zero findings do not equal correctness or security approval.
- All four maintained current-native product paths have accepted `PASS` evidence in `conformance/native-host-acceptance.json`.
- The current bounded-sentinel OpenCode runtime was accepted on immutable candidate `8b9c0e7011d825f5aaf60763ed874d88c0c05b62` with OpenCode `1.17.13`, covering clean managed install/start/invocation and successful `/hakim-help` plus `/hakim full ...` runtime use.
- OpenCode evidence from candidate `fbfd9354f16d58ec72da1458356a1fbc0b9a37f3` on OpenCode `1.18.5` remains bounded to the unchanged manifest-backed accepted-old-to-managed upgrade and newer-CLI removal journey; it is not reused for the changed bounded-sentinel runtime.
- OpenCode evidence from candidate `b442820d2803955d0f7f33b405bd096f443d4d72` on OpenCode `1.17.13` remains bounded historical evidence for the earlier create-only lifecycle.
- Earlier guarded source-checkout OpenCode evidence also remains bounded historical evidence.
- Public CI validates repository contracts and cannot create or promote live-host evidence by itself.
- Private release authorization remains intentionally outside the public product repository; repository health or live-host `PASS` does not imply stable-release authorization.
- POST-BETA-R1 remediation is complete. External evaluator recruitment remains suspended, the withdrawn campaign accepted no external reports, and any future relaunch requires a separate explicit product decision. Native-host acceptance must not be converted into a claim of independent product usefulness or retention.
- Any future external evaluation must identify an immutable Hakim source/tag/release reference so observations cannot silently refer to different revisions under the same prerelease version string.
- Hakim makes no general claims about model quality, speed, token use, cost, adoption, safety improvement, or return on investment.

## Privacy and support

- Hakim does not implement a product telemetry collection service.
- Hakim does not enable raw prompt or source-code logging.
- Repository evidence and outcome schemas are local validation artifacts, not product telemetry.
- Security response and maintenance are best-effort.
