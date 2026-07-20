# Supported Hosts

Hakim is pre-release software. Support means that the repository maintains a
documented integration surface; it does not imply universal compatibility.

| Host | Maintained surface | Current boundary |
|---|---|---|
| Codex | Repository-local plugin, skills, and session hook | Installation, trust, activation, sandboxing, and removal remain host-managed |
| Claude Code | Local plugin directory, skills, and hook | Persistent installation and automatic host cleanup are not guaranteed |
| GitHub Copilot | Repository instructions and bounded setup/removal tooling | Repository instructions do not prove hidden host-state preservation |
| OpenCode | Native plugin package, commands, skills, and lifecycle tooling | Validation is bounded to documented versions and test environments |

## General boundaries

- Host-native security and permission controls remain authoritative.
- A structural or smoke test does not prove model quality.
- Compatibility with every operating system, provider, model, editor version,
  or long-running interactive session is not established.
- Candidate integrations not listed above are experimental or unsupported.
