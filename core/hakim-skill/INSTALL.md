# Install Hakim

Hakim `1.0.0-beta.1` is distributed from public source and host-native Git marketplaces. No npm registry package or central marketplace/directory listing is currently claimed.

## Codex

Use Codex `0.131.0` or newer for this beta's full native plugin path. `rust-v0.130.0` still shipped plugin-bundled hooks disabled by default; `rust-v0.131.0` is the first tagged release where `plugin_hooks` is stable and enabled by default.

Install directly from this repository:

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Open `/plugins`, select the **Hakim** marketplace, install `hakim`, review/trust the SessionStart hook from `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Use `$hakim:hakim`, `$hakim:hakim-review`, `$hakim:hakim-audit`, `$hakim:hakim-debt`, `$hakim:hakim-gain`, or `$hakim:hakim-help` when explicit skill invocation is useful.

The npm `launch:codex` command remains a development fallback for source-checkout validation only; it is not the product installation path.

## Claude Code

Install from the repository-hosted Claude marketplace:

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Start Claude Code normally. If installed during an open session, run `/reload-plugins`.

User commands:

```text
/hakim:full
/hakim:review
/hakim:audit
/hakim:debt
/hakim:gain
/hakim:help
```

Hakim also provides scoped plugin agents for read-only review/audit/debt/evidence work and an isolated worktree implementer. Claude Code's installation scope, permissions, plugin cache, approval controls, managed policy, and trust remain authoritative.

The npm `launch:claude` command remains a development fallback using `--plugin-dir`; persistent product installation should use the native marketplace above.

## GitHub Copilot

Install the native Copilot plugin:

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Verify it with:

```bash
copilot plugin list
```

Inside Copilot CLI use `/skills list` and `/agent` to inspect Hakim's six skills and specialized custom agents. Read-only specialists are intentionally limited to read/search tools; the implementation agent alone receives edit/execute tools.

`.github/copilot-instructions.md` is an optional repository baseline/fallback. Native plugin installation does not require copying that file. The legacy `install:copilot` command remains available only for repositories that explicitly want the baseline instruction file, and it never overwrites an existing file.

## OpenCode

Hakim remains a guarded **project-local** OpenCode plugin, but normal installation no longer requires cloning Hakim first.

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

This uses npm only as Git transport/command execution for the public GitHub repository. Hakim is still not published to the npm registry, and the command creates no global Hakim/OpenCode installation.

The target defaults to the current directory. Optional read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

Start OpenCode from that repository and use `/hakim-help` or `/hakim full ...`. Installation is create-only, validates the canonical file manifest and target paths, refuses unsafe partial/different bundles, and does not edit `opencode.json`.

Exact-match removal is also project-local:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

The remover quarantines and verifies the canonical files before mutation and attempts restoration on failure. Modified, partial, unsafe, or unrelated OpenCode state is preserved.

### Source-checkout fallback

For repository development or manual lifecycle inspection, a Hakim checkout exposes the underlying read-only/apply commands explicitly:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

The install command is dry-run unless `--apply` is present. These commands exercise the same project-local bundle/lifecycle implementation used by the Git-backed bootstrap; they are not a requirement for normal first-run use.

The new Git-backed bootstrap is structurally covered by repository tests, but that does not by itself promote a new live-host acceptance claim. Any release that treats this exact first-run journey as the accepted OpenCode path must carry separate accepted real-host evidence.

## Inspect all maintained product surfaces

From a Hakim source checkout:

```bash
npm run doctor:fast
npm run plan:install -- --host all
```

The install plan is read-only. It reports the maintained Codex, Claude Code, GitHub Copilot, and OpenCode product surfaces without changing host or target files.

## Source validation

```bash
npm test
npm run doctor
npm run package:skill
```

Generated skill packages are local outputs. They do not prove npm registry publication, central directory approval, signing, notarization, third-party attestation, or universal host compatibility.

Host-native installation, approval, trust, sandboxing, plugin enablement, managed policy, permissions, and removal controls remain authoritative.
