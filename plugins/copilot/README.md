# Hakim for GitHub Copilot CLI

Hakim is a native GitHub Copilot CLI plugin with six canonical skills, five bounded execution agents, and host-native lifecycle hooks. `.github/copilot-instructions.md` remains a lightweight repository fallback, not the primary product surface.

## Install

Use an immutable reviewed release tag:

```bash
export HAKIM_REF=<release-tag>
copilot plugin marketplace add "Habib1001-m/hakim#$HAKIM_REF"
copilot plugin install hakim@hakim
```

Inspect the installation with:

```bash
copilot plugin list
```

Inside Copilot CLI, `/skills list` and `/agent` expose the loaded Hakim skills and execution agents.

## Native skills

Hakim exposes exactly:

```text
hakim
review
audit
debt
status
help
```

`lite`, `full`, `ultra`, and `off` are modes of `hakim`, not separate skills. Copilot may load a matching skill through normal host-native skill routing.

## Execution agents

The plugin ships:

- `hakim-reviewer` — read/search review context routed to `review`.
- `hakim-auditor` — read/search audit context routed to `audit`.
- `hakim-debt-analyst` — read/search debt-provenance context routed to `debt`.
- `hakim-evidence-verifier` — read/search evidence-status context routed to `status`.
- `hakim-implementer` — bounded read/search/edit/execute context routed to `hakim`.

Agents are execution contexts, not duplicate skill contracts.

## Operational behavior

Hakim uses host-native hooks for silent parent-session presence, subagent continuity, bounded mode persistence/control, and a late objective-contradiction check.

Explicit mode control uses the installed Hakim mode command supported by the current Copilot host, for example:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

The late objective check intervenes only when supported observable repository/setup state contradicts a consequential structured completion claim. It does not add broad command blocking or general prose linting, and normal completion does not require structured checkpoint output.

## Update or remove

Use Copilot CLI's native plugin update/uninstall surfaces for `hakim@hakim`. The registered marketplace source remains authoritative.

## Repository fallback

`.github/copilot-instructions.md` supplies lightweight judgment guidance when the repository itself is the active source. It does not replace the installed plugin, duplicate the six skill contracts, or claim global installation.

## Product boundary

Hakim does not add MCP or LSP services to Copilot because the maintained product does not require them. Copilot permissions, policy, enabled plugins, host cache, and tool permissions remain authoritative.
