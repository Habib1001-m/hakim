# Hakim for OpenCode

**Status:** public beta project-local native plugin  
**Distribution:** Git-backed bootstrap into repository-local OpenCode files; no npm publication or global installer

## What this plugin does

The plugin loads project-locally from:

```text
.opencode/plugins/hakim.js
```

It uses OpenCode configuration and prompt hooks to:

- register `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, and `/hakim-help` when a command name is not already present;
- add the installed canonical Hakim skills directory to `config.skills.paths` without duplicate entries;
- inject the canonical Hakim policy through the installed shared loader instead of embedding another rules copy;
- keep `lite`, `full`, `ultra`, and `off` mode in process/session memory;
- keep system-prompt activation idempotent with one Hakim sentinel block even when OpenCode reuses the same output object or the mode changes;
- remove session-local mode state when a session-deleted event is observed.

Repository tests cover the documented hook shapes, Git-backed package surface, managed project-local lifecycle, adversarial verification-to-mutation races, and multi-session state isolation. Live-host acceptance remains a separate evidence layer.

## Project-local installed layout

```text
.opencode/
├── plugins/
│   └── hakim.js
└── hakim-runtime/
    ├── install-manifest.json
    ├── loaders/
    │   └── hakim-loader.mjs
    └── hakim-skill/
        ├── SKILL.md
        ├── capabilities.json
        └── skills/
            ├── hakim-review/SKILL.md
            ├── hakim-audit/SKILL.md
            ├── hakim-debt/SKILL.md
            ├── hakim-gain/SKILL.md
            └── hakim-help/SKILL.md
```

`install-manifest.json` is bounded lifecycle metadata for Hakim-owned paths. It records the installed product version plus exact target paths, sizes, and SHA-256 hashes. It is treated as untrusted local input: schema, adapter, version support, target inventory, and byte matches are validated before it can authorize mutation.

The installer does **not** create or modify `opencode.json`. OpenCode discovers the project-local plugin from `.opencode/plugins/`; Hakim registers the installed skill path at load time.

## Install — Git-backed bootstrap

From the repository where you want to use Hakim:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

That command fetches Hakim through npm's Git-package transport and runs the bounded `hakim-opencode` bootstrap. It does **not** publish or install `@habib/hakim` from the npm registry, and it creates no global Hakim/OpenCode state.

The target defaults to the current directory. To inspect without writing:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
```

To inspect current state:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

For immutable reproduction or acceptance, use an exact Git commit in the package spec when the evidence workflow requires one.

The managed installer supports three safe paths:

1. **Create** — all Hakim target paths are absent; write the canonical bundle and persistent manifest.
2. **Adopt** — an exact recognized pre-manifest installation already matches; add only the persistent manifest.
3. **Upgrade** — a complete verified supported older Hakim installation is present; stage the new payload, quarantine and post-move verify the old owned bytes, install the new payload create-only, write the new manifest last, and roll back no-clobber if any step fails.

It refuses malformed/unsupported manifests, unsafe directory components, partial or modified state, symlinks/non-regular files, unowned conflicts, automatic partial repair, and any overwrite that cannot be proven to be an exact supported Hakim-owned transition.

## Source-checkout fallback

Repository development and manual inspection can still use the underlying source-checkout commands:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
```

The first two commands are read-only/dry-run surfaces. The final command applies the same managed create/adopt/upgrade lifecycle used by the Git-backed bootstrap.

## Use

Examples after installation:

```text
/hakim full Review the current change.
/hakim ultra Find the smallest safe implementation.
/hakim off Continue without Hakim guidance.
/hakim-review Review the current diff.
/hakim-audit Inspect the explicitly requested repository scope.
/hakim-help Explain the available Hakim capabilities.
```

Mode state is process-local. Explicit session IDs are isolated from one another; deleting one session removes only that session's mode state. Commands without a session ID use the process fallback. A fresh plugin process resets to `HAKIM_DEFAULT_MODE` (or `full` when unset/invalid); state is not persisted across host restarts, projects, user profiles, or machines.

The activation hook keeps at most one `<!-- hakim-system:v1 mode=... -->` block in a reused system output. Repeated transforms do not duplicate Hakim instructions; changing modes replaces the previous block, and `off` removes it.

The plugin never overwrites an existing OpenCode command with the same name.

## Remove

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

Dry-run first when desired:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove --dry-run
```

Removal accepts a complete byte-verified supported installed manifest, including a supported older Hakim version; it does not require the currently executing package payload to be byte-identical to the older installed payload.

For mutation, Hakim moves each owned live file into a private same-filesystem quarantine and **re-hashes the moved bytes after the rename before deletion is allowed**. Only after all owned files have left the live namespace and their quarantined bytes are verified is the quarantine deleted. If a file changes in the final verify-to-rename window, removal fails and restores the actual changed quarantined bytes to the original path with no-clobber semantics. If the original path independently reappears, Hakim does not overwrite it and retains recovery data instead of deleting user state.

Modified, partial, malformed/unsupported-manifest, symlinked, non-regular, or unowned OpenCode paths are preserved. The `.opencode` directory itself and unrelated content are never removed.

## Rollback boundary

Create and upgrade rollback use the same ownership rule: Hakim may remove only bytes it created and can still prove unchanged. Rollback never performs a live-path `hash → unlink` sequence. An unchanged Hakim-created file is moved to private same-filesystem quarantine, verified after the move, and then discarded. A concurrent replacement is preserved in place or restored from the actual quarantined bytes; Hakim reports rollback incomplete rather than deleting it.

## Concurrency boundary

The maintained lifecycle still does not claim a cross-process lock or immunity from arbitrary hostile filesystem actors. Concurrent changes can make an operation refuse or roll back. The safety guarantee is narrower: a verification-to-mutation race must not silently authorize deletion of bytes Hakim did not verify after they left the live namespace, and rollback must not clobber an independently reappeared path.

## Node runtime contract

The shipped Git-backed package declares Node `>=22`. Public CI keeps the full repository gate on Node 24 and separately exercises the shipped OpenCode plugin, lifecycle, adversarial transaction tests, CLI/symlink path, npm package inventory, and package boundary on Node 22 and Node 26. This is a JavaScript runtime contract, not universal OpenCode/OS compatibility.

## Validate repository-side behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
node tests/test_hakim_opencode_adversarial_transactions.mjs
node tests/test_hakim_opencode_cli.mjs
node tests/test_hakim_opencode_package_surface.mjs
node tests/test_node_support_contract.mjs
npm test
npm run check:evidence-script
```

These checks prove their deterministic repository/package scope only. They do not create or replace real-host acceptance evidence.

## Evidence boundaries

- The Git-backed bootstrap is a transport layer over the project-local managed lifecycle; it does not introduce global Hakim state.
- The earlier accepted OpenCode journey at candidate `b442820d2803955d0f7f33b405bd096f443d4d72` on OpenCode `1.17.13` proves the earlier create-only path only.
- This manifest-backed create/adopt/upgrade/removal and idempotent-runtime hardening materially changes the observed product path. It requires fresh real-host install/start/invocation evidence before the changed path is promoted as accepted.
- Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
- Public source availability does not imply npm registry publication, central marketplace publication, global installation, signing, or universal-runtime availability.
- Runtime or compatibility claims remain bounded to the specific evidence collected for the tested environment.
