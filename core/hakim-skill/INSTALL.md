# Install Hakim

Hakim is public beta software distributed from public source and repository-hosted/native Git marketplace surfaces.

The latest frozen prerelease is `1.0.0-beta.4` at exact commit `5d00039479f2f11b7fe30ccf2385e70ce24553c3` (`evidence/beta4-r31-5d00039`). Moving `main` reports `1.0.0-beta.4.post1` and is explicit unreleased development, not a frozen candidate and not eligible for release or promotion evidence.

`conformance/distribution-identity.json` is the machine-readable authority for these identities, their declared normal install sources, and host-resolution proof state. P0 remains `HOLD_FOR_HOST_NATIVE_PROOF`: a command that contains the expected SHA is not evidence that a host actually resolved or installed those bytes. See [P0 Host-Native Transport Reconciliation](../../docs/P0_HOST_TRANSPORT_RECONCILIATION.md). No npm registry package or central marketplace/directory listing is currently claimed.

## Codex

Use Codex `0.131.0` or newer for the maintained native plugin-hook path.

Declare the frozen beta.4 marketplace source with its exact commit. A disposable Codex `0.145.0` P0 journey resolved this exact SHA, installed `1.0.0-beta.4`, matched all distributed plugin files byte-for-byte, completed the trusted SessionStart hook, and invoked an installed Hakim skill. That accepted evidence is bounded to the recorded host/version and does not complete P0 for the remaining hosts:

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3
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

`npm run launch:codex` remains a source-checkout development fallback, not the frozen product installation path.

## Claude Code

The exact-SHA marketplace declaration below remains pending a disposable journey that records the registered marketplace source and installed cache identity:

```bash
claude plugin marketplace add https://github.com/Habib1001-m/hakim.git#5d00039479f2f11b7fe30ccf2385e70ce24553c3
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

`npm run launch:claude` is a source-checkout development fallback using `--plugin-dir`; persistent frozen-product installation should use the declared exact-SHA marketplace route above only inside the P0 verification boundary until accepted host proof exists.

## GitHub Copilot

The exact-SHA marketplace declaration below remains pending a disposable journey that records the registered marketplace checkout and installed plugin source identity:

```bash
copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3
copilot plugin install hakim@hakim
```

Verify the installation with:

```bash
copilot plugin list
```

Inside Copilot CLI, `/skills list` and `/agent` expose Hakim's maintained skills and custom agents.

Explicit mode control uses the plugin-qualified skill route:

```text
/hakim/hakim full
/hakim/hakim lite
/hakim/hakim ultra
/hakim/hakim off
```

Default `full` is stateless. Non-default modes use bounded host-owned plugin data. Silent parent-session presence and subagent continuity are accepted on the unreleased R3.2 development path; they are not silently claimed for frozen beta.4 without exact-candidate live-host evidence.

`.github/copilot-instructions.md` is an optional repository baseline/fallback, not the primary product distribution. The legacy `install:copilot` source-checkout command exists only for repositories that explicitly want that baseline file and never overwrites an existing file.

## OpenCode

Hakim is a guarded **project-local** OpenCode plugin. Normal installation does not require cloning Hakim first.

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
```

This declares npm Git transport/command execution for the exact frozen GitHub source. Hakim is not published to the npm registry, creates no global Hakim/OpenCode installation, and the shipped bootstrap declares Node `>=22`. Candidate proof still requires recording the resolved source/package identity and persisted install manifest in a clean target.

Read-only inspection uses the same immutable declaration:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode status
```

The managed lifecycle persists `.opencode/hakim-runtime/install-manifest.json` and validates schema, adapter/version support, target inventory, path safety, and exact owned bytes before mutation.

Supported transitions are intentionally bounded:

- **create** when all Hakim-owned target paths are absent;
- **adopt** when an exact recognized pre-manifest installation already matches;
- **upgrade** when a complete verified supported older installation is present.

Partial, modified, unsafe, symlinked, malformed/unsupported-manifest, or unowned conflicting state is refused. Hakim does not edit `opencode.json`.

After installation, start OpenCode from the target repository and use `/hakim-help` or `/hakim full ...`. `/hakim <mode>` is a direct session-mode switch and must not require repository inspection merely to set the mode.

Remove project-local Hakim state with the same exact-source CLI:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode remove
```

Removal and rollback use bounded ownership, same-filesystem quarantine, post-move verification, and no-clobber restoration. Hakim never claims a cross-process lock or immunity from arbitrary hostile filesystem actors; conflicting concurrent state causes refusal or incomplete rollback rather than destructive guessing.

### Source-checkout development

Moving `main` is development-only. It is not a frozen candidate and observations from it are not release or promotion evidence. Any development observation must record the exact 40-character source commit.

For repository development or manual lifecycle inspection:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
git checkout main
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

These commands exercise the same managed project-local lifecycle used by the Git-backed bootstrap. They are not required for normal first-run use.

Frozen beta.4 and current development live-host projections remain `HOLD_FOR_LIVE_HOST_EVIDENCE`. For frozen beta.4, Codex is accepted while Claude Code, GitHub Copilot CLI, and OpenCode remain `NOT_RUN`; P0 remains `HOLD_FOR_HOST_NATIVE_PROOF` until every maintained frozen route records its resolved source identity. Older accepted evidence remains candidate-bounded and historical.

## Inspect all maintained product surfaces

From an explicit Hakim source checkout:

```bash
npm run doctor:fast
npm run plan:install -- --host all
npm run check:distribution-identity
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
