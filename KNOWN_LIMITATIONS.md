# Known Limitations

Hakim is public beta software.

## Distribution

- Install releases from an immutable Git ref; moving branch state is not a release identity.
- No npm registry publication, signing, notarization, external provenance attestation, SLA, or LTS commitment is claimed.
- OpenCode uses npm/npx as Git transport and command execution; it installs Hakim project-locally rather than globally.

## Compatibility

- Hakim maintains product surfaces for Codex, Claude Code, GitHub Copilot CLI, and OpenCode, but not every host version, operating system, model/provider, or organization policy is guaranteed.
- Codex `0.131.0+` is the maintained floor for the native plugin-hook path.
- OpenCode requires Node.js `>=22`; CI exercises Node 22, 24, and 26 for the maintained JavaScript/OpenCode compatibility surface.
- Host-native approval, permissions, sandboxing, managed policy, caching, and removal remain outside Hakim's authority.

## OpenCode lifecycle

- Unsafe, partial, modified, malformed, unsupported, or unowned conflicting managed state is refused rather than force-overwritten.
- Force overwrite and force removal are not product features.
- Removal and rollback use bounded ownership, same-filesystem quarantine, verification, and no-clobber restoration.
- Hakim does not claim a cross-process filesystem lock or immunity to malicious concurrent local replacement.

## Evaluation

- Deterministic tests cover only their checked contracts.
- A green repository gate does not by itself prove real-host compatibility for every environment.
- Hakim makes no general claim about model quality, speed, token use, cost, adoption, security improvement, or return on investment.

## Privacy

Hakim does not implement a product telemetry service and does not enable raw prompt or source-code logging as a product feature. Bounded host-owned mode state does not contain raw prompts, source code, reasoning, credentials, or transcript content.

See [SECURITY.md](SECURITY.md) and [SUPPORT.md](SUPPORT.md).
