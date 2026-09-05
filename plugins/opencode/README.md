# Hakim for OpenCode

Hakim is a maintained project-local OpenCode plugin with a guarded managed lifecycle.

## Install

Use an immutable reviewed release tag from the target repository:

```bash
export HAKIM_REF=<release-tag>
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install
```

Read-only inspection:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install --dry-run
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode status
```

Remove Hakim-managed project-local state with:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode remove
```

The installer does not create or modify `opencode.json`.

## Product surface

Hakim loads from:

```text
.opencode/plugins/hakim.js
```

It registers the six canonical capabilities when those command names are free:

```text
hakim  review  audit  debt  status  help
```

The adapter also adds the installed canonical skill path, injects the canonical Hakim core through the shared loader, keeps `lite | full | ultra | off` mode state bounded to the plugin process/session, preserves unrelated host system content, and removes only the relevant session-local mode state when a session is deleted.

`hakim` mode selection is not a repository task and should not trigger repository inspection merely to change mode.

## Installed layout

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
            ├── review/
            ├── audit/
            ├── debt/
            ├── status/
            └── help/
```

`install-manifest.json` records bounded Hakim-owned paths, sizes, hashes, and product version. It is validated as untrusted local input before mutation.

## Managed lifecycle

The lifecycle supports bounded safe transitions:

1. **Create** — all Hakim-owned paths are absent.
2. **Adopt** — a recognized exact pre-manifest installation already matches.
3. **Upgrade** — a complete verified supported older installation is present.
4. **Remove** — only a complete verified Hakim-owned installation is eligible for managed removal.

Malformed/unsupported manifests, unsafe paths, partial or modified state, symlinks/non-regular files, unowned conflicts, and unprovable overwrites are refused.

Removal moves Hakim-owned files into private same-filesystem quarantine and verifies moved bytes before deletion. Rollback restores verified quarantined bytes without overwriting independently reappeared paths.

## Use

Mode selection:

```text
/hakim full
/hakim lite
/hakim ultra
/hakim off
```

Specialized capabilities are routed through the installed canonical skills/commands, for example `review`, `audit`, `debt`, `status`, and `help` according to the current OpenCode host surface.

Mode state is process-local. Explicit session IDs are isolated; a fresh plugin process resets to `HAKIM_DEFAULT_MODE` or `full` when unset/invalid.

Hakim never overwrites an existing OpenCode command with the same name.

## Concurrency boundary

The lifecycle does not claim a cross-process lock or immunity from hostile filesystem actors. Concurrent changes may cause refusal or rollback. The safety contract is narrower: verification-to-mutation races must not silently authorize deletion of unverified bytes, and rollback must not clobber independently reappeared state.

## Node runtime contract

The Git-backed package declares Node `>=22`. Public CI exercises the maintained JavaScript/OpenCode surface on Node 22, 24, and 26.

## Validate repository behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
node tests/test_hakim_opencode_adversarial_transactions.mjs
node tests/test_hakim_opencode_cli.mjs
node tests/test_hakim_opencode_package_surface.mjs
npm test
```

These checks prove their repository/package scope only. Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
