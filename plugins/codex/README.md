# Hakim Codex Adapter

Status: **public beta repository-local integration, runtime validated within the recorded local pilot scope**.

This adapter contains:

- `.codex-plugin/plugin.json` — manifest;
- `skills/` — six Hakim capability skills;
- `hooks/hooks.json` — one declared SessionStart hook;
- `hooks/session_start.mjs` — session guidance loader.

## Distribution boundary

The current Codex integration is repository-local. Hakim is not currently
published as a public Codex Plugin Directory listing or other global marketplace
package.

## Local repository marketplace

The repo-scoped marketplace is:

```text
.agents/plugins/marketplace.json
```

It declares one `hakim` plugin sourced from `./plugins/codex`.

## Validation

```bash
npm test
npm run check:conformance
npm run check:capability-parity
npm run check:codex-projection
node plugins/codex/hooks/session_start.mjs
```

## Guarded launch

Preview the Codex binary, working directory, local marketplace contract, and
shell-free argv without starting Codex:

```bash
npm run launch:codex -- \
  --binary codex \
  --cwd /path/to/workspace
```

Launch only after reviewing the dry-run:

```bash
npm run launch:codex -- \
  --apply \
  --binary codex \
  --cwd /path/to/workspace \
  -- --model gpt-5.6
```

The launcher validates the canonical plugin directory, manifest name and
version, skills and hooks, repository-local marketplace name/source/policy, the
Codex executable, and working directory. It starts Codex with explicit argv and
`shell: false`. It refuses `--cd`/`-C` overrides and approval/sandbox bypass
flags. Plugin installation, activation, and hook trust remain explicitly managed
through `/plugins` and `/hooks`; the launcher does not claim or perform them.

## Startup hygiene

A runtime transcript showed multiple local SessionStart registrations even
though the repository declares one plugin and one hook. Inspect local state with:

```bash
bash scripts/codex_startup_doctor.sh
```

The doctor is read-only. When duplication is observed, review `/plugins` and
`/hooks` in Codex, retain one `hakim@hakim-local` installation and one trusted
SessionStart hook, restart Codex, then rerun the doctor.

Do not delete caches or configuration blindly. Preserve sessions, skills, and
user configuration until the duplicate registration source is identified.

## Trust boundary

Plugin hooks are not automatically trusted. The user must review and trust the
hook definition before activation.

## Evidence boundary

The compact skill projection is hash-gated against the canonical skill. Runtime
validation does not imply public marketplace, persistent installation,
benchmark, enterprise, MCP/A2A, or universal compatibility.
