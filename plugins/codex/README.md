# Hakim for Codex

Hakim is packaged as a native Codex plugin with six reusable skills and a SessionStart hook. The repository is also a Codex Git marketplace, so product users do not need the npm launcher.

## Compatibility

Use Codex `0.131.0` or newer for the full Hakim beta product path. In `rust-v0.130.0`, plugin-bundled hooks were still behind the disabled-by-default `plugin_hooks` feature; `rust-v0.131.0` marks that feature stable and enables it by default. Host-native hook discovery, enablement, trust, approvals, and managed policy remain authoritative.

## Install

Add the Hakim repository as a Codex marketplace:

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Then open `/plugins`, select the **Hakim** marketplace, and install the `hakim` plugin. Review and trust the single SessionStart hook from `/hooks`, then start a new thread.

The installed identity is:

```text
hakim@hakim
```

This same installation is intended to be picked up by Codex surfaces that share the same plugin configuration. Host-native availability, workspace policy, permissions, approval, sandbox, and hook trust remain authoritative.

## Native usage

Hakim is skill-first on Codex. The plugin exposes the canonical capabilities through Codex skill discovery:

- `$hakim:hakim` — full smallest-safe-diff workflow.
- `$hakim:hakim-review` — bounded removable-complexity review.
- `$hakim:hakim-audit` — evidence-backed audit.
- `$hakim:hakim-debt` — technical-debt provenance.
- `$hakim:hakim-gain` — evidence-status verification.
- `$hakim:hakim-help` — usage guidance and boundaries.

Natural-language invocation remains valid when Codex discovers the matching skill from its description.

## Startup behavior

Hakim's SessionStart hook injects only a compact activation context. It does **not** paste the full canonical skill into every session. Codex loads the matching skill progressively when needed, preserving context and reducing startup noise.

`HAKIM_DEFAULT_MODE` can be set to `lite`, `full`, `ultra`, or `off`; `full` is the default. The hook does not bypass approvals or sandbox policy.

## Validation

```bash
npm test
npm run check:conformance
npm run check:capability-parity
npm run check:codex-projection
node plugins/codex/hooks/session_start.mjs
```

## Development fallback

Repository contributors can still inspect or launch the local checkout without changing Codex plugin installation state:

```bash
npm run launch:codex -- --binary codex --cwd /path/to/workspace
npm run launch:codex -- --apply --binary codex --cwd /path/to/workspace
```

The launcher is a **development fallback**, not the product installation path. It remains shell-free and refuses `--cd`/`-C` overrides plus approval/sandbox bypass flags.

## Troubleshooting

If multiple old local registrations exist, inspect them before deleting anything:

```bash
bash scripts/codex_startup_doctor.sh
```

Retain one `hakim@hakim` installation and one trusted SessionStart hook. Preserve sessions, skills, and user configuration until any duplicate registration source is identified.

## Product boundary

Hakim's public Git marketplace makes the plugin installable from source, but it does not by itself claim an approved listing in OpenAI's central Plugin Directory. Publishing there is a separate distribution step.

Runtime validation remains scoped evidence and does not prove universal compatibility, correctness, security approval, benchmark results, performance gains, or ROI.
