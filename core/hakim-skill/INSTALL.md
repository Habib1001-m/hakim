# Install Hakim

Hakim `1.0.0-beta.4` is distributed from public source and host-native Git marketplaces. No npm registry package or central marketplace/directory listing is currently claimed. The beta.4 observable-checkpoint candidate currently requires fresh candidate-specific live-host evidence before its maintained paths are promoted as accepted.

## Codex

Use Codex `0.131.0` or newer for this beta's full native plugin path. `rust-v0.130.0` still shipped plugin-bundled hooks disabled by default; `rust-v0.131.0` is the first tagged release where `plugin_hooks` is stable and enabled by default.

Install directly from this repository:

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Open `/plugins`, select the **Hakim** marketplace, install `hakim`, review/trust the SessionStart hook from `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Use `$hakim:hakim`, `$hakim:hakim-review`, `$hakim:hakim-audit`, `$hakim:hakim-debt`, `$hakim:hakim-gain`, or `$hakim:hakim-help` when explicit skill invocation is useful. `hakim-gain` is the retained beta compatibility ID for evidence-status reporting and does not imply a quantified gain.

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

Hakim is a guarded **project-local** OpenCode plugin. Normal installation does not require cloning Hakim first.

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

This uses npm only as Git transport/command execution for the public GitHub repository. Hakim is not published to the npm registry, and the command creates no global Hakim/OpenCode installation. The shipped bootstrap declares Node `>=22`.

The target defaults to the current directory. Optional read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

The managed lifecycle persists `.opencode/hakim-runtime/install-manifest.json`, which records the installed product version plus the exact Hakim-owned target paths, sizes, and SHA-256 hashes. That file is treated as untrusted input and is validated before mutation.

Install supports only bounded verified transitions:

- **create** when all Hakim target paths are absent;
- **adopt** when a recognized exact pre-manifest installation already matches and only lifecycle metadata is missing;
- **upgrade** when a complete verified supported older Hakim installation is present. The new payload is staged first, old owned bytes are moved into same-filesystem quarantine and verified after the move, new files are installed create-only, and the new manifest is written last.

Partial, modified, unsafe, symlinked, malformed/unsupported-manifest, or unowned conflicting state is refused. Hakim never edits `opencode.json`.

After installation, start OpenCode from that repository and use `/hakim-help` or `/hakim full ...`. `/hakim <mode>` is a direct session-mode switch; it must not require auxiliary Hakim skills or repository inspection merely to set the mode.

Removal remains project-local:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

A newer CLI can remove a complete byte-verified supported older installation using its persisted/accepted lifecycle manifest; removal does not require the newer payload to equal the older installed payload.

For mutation, each owned live file is renamed into private same-filesystem quarantine and re-hashed **after the move**. Quarantine is deleted only after all owned bytes have been verified outside the live namespace. If bytes change in the final verify-to-rename window, the operation fails and restores the actual quarantined bytes no-clobber. An independently reappeared target is never overwritten.

Create/upgrade rollback follows the same rule: Hakim may discard only bytes it created and can still verify after they leave the live namespace. A concurrent replacement is preserved; rollback reports incomplete rather than deleting user state.

### Source-checkout fallback

For repository development or manual lifecycle inspection, a Hakim checkout exposes the underlying read-only/apply commands explicitly:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

The install/remove commands exercise the same managed project-local lifecycle implementation used by the Git-backed bootstrap; they are not a requirement for normal first-run use.

### Runtime and evidence boundary

OpenCode mode state is process-local and session-scoped where a session ID is present. Reused prompt outputs contain at most one bounded Hakim activation block delimited by explicit start/end sentinels; repeated transforms do not duplicate the policy, mode changes replace only that owned range, `off` removes only that range, and unrelated system content around it is preserved. An unbounded legacy marker is left untouched rather than destructively guessing where Hakim ownership ends. Fresh plugin processes reset to the configured default rather than sharing state across projects or host restarts.

Repository-side behavior is structurally and adversarially tested across the supported Node runtime contract. The current beta.4 OpenCode path is `NOT_RUN` in `conformance/native-host-acceptance.json` until fresh candidate-specific evidence is accepted. Accepted beta.1 and frozen beta.2/beta.3 evidence remains bounded to those exact candidates and is not reused to promote beta.4.

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

`npm test` is the canonical repository gate used by Public CI and includes release-package, SBOM, and checksum verification. Generated artifacts do not prove npm registry publication, central directory approval, signing, notarization, third-party attestation, or universal host compatibility.

Host-native installation, approval, trust, sandboxing, plugin enablement, managed policy, permissions, and removal controls remain authoritative.
