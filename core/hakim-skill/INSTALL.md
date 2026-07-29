# Install Hakim

Hakim is public beta software distributed from public source and repository-hosted/native Git marketplace surfaces.

The latest frozen prerelease is `1.0.0-beta.4`. Current `main` also contains unreleased R3.2 development accepted through F04. Those are separate identities: R3.2 development evidence does not silently promote beta.4 and no beta.5 candidate exists yet.

No npm registry package or central marketplace/directory listing is currently claimed.

## Codex

Use Codex `0.131.0` or newer for the maintained native plugin-hook path.

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Open `/plugins`, select the **Hakim** marketplace, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread. The installed identity is `hakim@hakim`.

Explicit skills include:

```text
$hakim:hakim
$hakim:hakim-review
$hakim:hakim-audit
$hakim:hakim-debt
$hakim:hakim-gain
$hakim:hakim-help
```

`hakim-gain` is the retained beta compatibility ID for evidence-status reporting; it does not imply quantified performance gain.

`npm run launch:codex` remains a source-checkout development fallback, not the product installation path.

## Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Start Claude Code normally. If Hakim was installed while a session was already open, use `/reload-plugins`.

Maintained commands include:

```text
/hakim:full
/hakim:review
/hakim:audit
/hakim:debt
/hakim:gain
/hakim:help
```

Hakim also ships scoped specialist agents. Claude Code's own installation scope, permissions, plugin cache, approval controls, managed policy, and trust remain authoritative.

`npm run launch:claude` is a source-checkout development fallback using `--plugin-dir`; persistent product installation should use the native marketplace above.

## GitHub Copilot

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
```

Verify the installation with:

```bash
copilot plugin list
```

Inside Copilot CLI, `/skills list` and `/agent` expose Hakim's maintained skills and custom agents.

On the accepted unreleased R3.2 path, Hakim is present automatically after native installation. Explicit mode control uses the plugin-qualified skill route:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

Default `full` is stateless. Non-default modes use bounded host-owned plugin data. R3.2 also adds evidence-justified subagent continuity through the same maintained presence authority.

`.github/copilot-instructions.md` is an optional repository baseline/fallback, not the primary product distribution. The legacy `install:copilot` source-checkout command exists only for repositories that explicitly want that baseline file and never overwrites an existing file.

## OpenCode

Hakim is a guarded **project-local** OpenCode plugin. Normal installation does not require cloning Hakim first.

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

This uses npm only as Git transport/command execution for the public GitHub repository. Hakim is not published to the npm registry, creates no global Hakim/OpenCode installation, and the shipped bootstrap declares Node `>=22`.

Read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

The managed lifecycle persists `.opencode/hakim-runtime/install-manifest.json` and validates schema, adapter/version support, target inventory, path safety, and exact owned bytes before mutation.

Supported transitions are intentionally bounded:

- **create** when all Hakim-owned target paths are absent;
- **adopt** when an exact recognized pre-manifest installation already matches;
- **upgrade** when a complete verified supported older installation is present.

Partial, modified, unsafe, symlinked, malformed/unsupported-manifest, or unowned conflicting state is refused. Hakim does not edit `opencode.json`.

After installation, start OpenCode from the target repository and use `/hakim-help` or `/hakim full ...`. `/hakim <mode>` is a direct session-mode switch and must not require repository inspection merely to set the mode.

Remove project-local Hakim state with:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

Removal and rollback use bounded ownership, same-filesystem quarantine, post-move verification, and no-clobber restoration. Hakim never claims a cross-process lock or immunity from arbitrary hostile filesystem actors; conflicting concurrent state causes refusal or incomplete rollback rather than destructive guessing.

### Source-checkout fallback

For repository development or manual lifecycle inspection:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

These commands exercise the same managed project-local lifecycle used by the Git-backed bootstrap. They are not required for normal first-run use.

The frozen beta.4 OpenCode path remains `NOT_RUN` in `conformance/native-host-acceptance.json`. Older accepted evidence remains candidate-bounded and historical.

## Inspect all maintained product surfaces

From a Hakim source checkout:

```bash
npm run doctor:fast
npm run plan:install -- --host all
```

The install plan is read-only and reports the maintained Codex, Claude Code, GitHub Copilot, and OpenCode product surfaces.

## Source validation

```bash
npm test
npm run doctor
npm run package:skill
```

`npm test` is the canonical repository gate used by Public CI. Generated packages, SBOMs, and checksums prove only their checked local integrity/reproducibility scope; they do not establish registry publication, marketplace approval, signing, notarization, host acceptance, product effectiveness, or stable-release authorization.

Host-native installation, approval, trust, sandboxing, plugin enablement, managed policy, permissions, and removal controls remain authoritative.
