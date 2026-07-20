# Known Limitations

Hakim remains pre-release software.

## Distribution

- The source repository is public.
- No npm package or marketplace listing is currently published.
- Local build outputs are not signed, notarized, or externally attested.
- No SBOM or public support SLA is currently provided.

## Compatibility

- Supported-host evidence is bounded to documented environments.
- Universal operating-system, editor-version, provider, and model
  compatibility is not established.
- Host-native approval, activation, sandboxing, and removal remain authoritative.

## Security

- Exact ownership, containment, locks, quarantine, and rollback reduce risk but
  do not prevent every action by unrelated local processes.
- Force overwrite and force removal are not implemented.
- Ambiguous, mismatched, or unsafe states are intentionally refused.
- Hakim does not rotate credentials or repair host security configuration.

## Evaluation

- Deterministic checks cover only their enabled rules.
- Zero findings do not equal correctness or security approval.
- Hakim makes no general claims about model quality, speed, token use, cost,
  adoption, safety improvement, or return on investment.

## Privacy and support

- Telemetry is disabled by default.
- Raw prompts and source code are not logged by default.
- Security response and maintenance are best-effort.
