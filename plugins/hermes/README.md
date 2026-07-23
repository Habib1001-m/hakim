# Hakim for Hermes Agent

Hakim is packaged as a native Hermes general plugin. It uses Hermes' own plugin lifecycle, namespaced skills, slash commands, and hooks instead of copying files into `~/.hermes/skills` or overriding built-in tools.

## Install

Install directly from the Hakim repository subdirectory:

```bash
hermes plugins install Habib1001-m/hakim/plugins/hermes
```

Hermes asks whether to enable the plugin and defaults to **no**. To make the intent explicit in one command:

```bash
hermes plugins install Habib1001-m/hakim/plugins/hermes --enable
```

Then start a fresh Hermes session and verify:

```text
/plugins
/hakim-help
```

## Native commands

```text
/hakim [lite|full|ultra|off] [task]
/hakim-review [task or scope]
/hakim-audit [task or scope]
/hakim-debt [task or scope]
/hakim-gain [task or scope]
/hakim-help
```

In the interactive CLI, these commands queue a real user turn that asks Hermes to load the matching namespaced skill. In gateway sessions, Hakim's `pre_gateway_dispatch` hook rewrites the matching slash command into the same skill-backed request before agent dispatch.

## Native skills

The plugin registers six read-only skill documents through `ctx.register_skill()`:

- `hakim:hakim`
- `hakim:hakim-review`
- `hakim:hakim-audit`
- `hakim:hakim-debt`
- `hakim:hakim-gain`
- `hakim:hakim-help`

The skill files are canonical Hakim projections and are not copied into the user's editable Hermes skill directory.

## Progressive disclosure

A compact `pre_llm_call` hook adds only a first-turn discovery note. It does **not** inject the full Hakim policy on every turn. The matching skill is loaded only when the workflow is requested.

## Security boundary

Hakim's Hermes plugin intentionally registers:

- no tools;
- no MCP server;
- no environment variables or credentials;
- no built-in tool overrides;
- no model/provider overrides;
- no platform adapter.

Hermes plugin enablement, permissions, approvals, configured tools, and host security policy remain authoritative.

## Update or remove

```bash
hermes plugins update hakim
hermes plugins disable hakim
hermes plugins remove hakim
```

Structural CI validates the manifest, skill parity, command/hook wiring, and Python syntax. Live Hermes runtime validation remains environment-specific until separately executed and recorded.
