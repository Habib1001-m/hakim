# Known Limitations

Hakim `1.0.0-beta.1` remains public beta software.

## Distribution

- The source repository is public.
- No npm package or central marketplace/directory listing is currently published.
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
- Hakim makes no general claims about model quality, speed, token use, cost, adoption, safety improvement, or return on investment.

## Privacy and support

- Telemetry is disabled by default.
- Raw prompts and source code are not logged by default.
- Security response and maintenance are best-effort.
