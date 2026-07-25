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
- Universal operating-system, editor-version, provider, and model compatibility is not established.
- Host-native approval, activation, sandboxing, and removal remain authoritative.

## Security

- OpenCode's project-local installer validates the canonical bundle, refuses unsafe or conflicting target state, and uses create-only writes; the remover requires an exact canonical match and uses quarantine plus restoration on failure.
- The maintained OpenCode project-local lifecycle does not claim a cross-process operation lock or immunity to malicious/concurrent filesystem replacement outside its validated checkpoints.
- These safeguards reduce risk but do not prevent every action by unrelated local processes.
- Force overwrite and force removal are not implemented.
- Ambiguous, mismatched, or unsafe states are intentionally refused.
- Hakim does not rotate credentials or repair host security configuration.

## Evaluation

- Deterministic checks cover only their enabled rules.
- Zero findings do not equal correctness or security approval.
- All four maintained current-native product paths have accepted `PASS` evidence in `conformance/native-host-acceptance.json`, including the Git-backed OpenCode bootstrap observed on OpenCode `1.17.13`.
- OpenCode's accepted evidence is bounded to the immutable candidate and public-safe evidence reference recorded in the projection; it is not a universal compatibility claim.
- Earlier guarded source-checkout OpenCode evidence remains bounded historical evidence and is not substituted for the accepted Git-backed transport evidence.
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
