# Hakim for OpenCode

Hakim is a maintained project-local OpenCode plugin. Frozen `1.0.0-beta.4` installs from exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.

## What the plugin does

Hakim loads from:

```text
.opencode/plugins/hakim.js
```

It uses OpenCode's native configuration and prompt surfaces to:

- register `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, and `/hakim-help` when those names are free;
- add the installed canonical skills path without duplicates;
- inject canonical Hakim policy through the shared loader;
- keep `lite`, `full`, `ultra`, and `off` mode in process/session memory;
- make `/hakim <mode>` a direct mode-selection turn;
- keep Hakim-owned system context bounded by explicit sentinels;
- preserve unrelated host system content;
- remove only the relevant session-local mode state when a session is deleted.

The mode-selection turn itself is not a repository task and should not inspect the repository merely to change mode.

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
```

`install-manifest.json` records bounded Hakim-owned paths, sizes, hashes, and product version. It is validated as untrusted local input before mutation.

The installer does not create or modify `opencode.json`.

## Install frozen beta.4

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
```

Read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode status
```

The managed lifecycle supports only bounded safe transitions:

1. **Create** — all Hakim-owned paths are absent.
2. **Adopt** — a recognized exact pre-manifest installation already matches.
3. **Upgrade** — a complete verified supported older installation is present.

Malformed/unsupported manifests, unsafe paths, partial or modified state, symlinks/non-regular files, unowned conflicts, and unprovable overwrites are refused.

## Use

```text
/hakim full
/hakim ultra
/hakim off
/hakim-review Review the current diff.
/hakim-audit Inspect the requested repository scope.
/hakim-help Explain the available Hakim capabilities.
```

Use `/hakim <mode>` to select the session mode, then issue the coding or review request separately.

Mode state is process-local. Explicit session IDs are isolated; a fresh plugin process resets to `HAKIM_DEFAULT_MODE` or `full` when unset/invalid.

Hakim never overwrites an existing OpenCode command with the same name.

## Remove frozen beta.4

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode remove
```

Optional dry run:

```bash
npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode remove --dry-run
```

Removal moves Hakim-owned files into private same-filesystem quarantine and verifies moved bytes before deletion. Rollback restores verified quarantined bytes without overwriting independently reappeared paths.

## Concurrency boundary

The lifecycle does not claim a cross-process lock or immunity from hostile filesystem actors. Concurrent changes may cause refusal or rollback. The safety contract is narrower: verification-to-mutation races must not silently authorize deletion of unverified bytes, and rollback must not clobber independently reappeared state.

## Node runtime contract

The Git-backed package declares Node `>=22`. Public CI exercises the maintained JavaScript/OpenCode surface on Node 22, 24, and 26.

## Source-checkout development

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

The source-checkout install script defaults to dry-run; `--apply` performs installation. Moving `main` is development-only rather than the frozen product identity.

## Validate repository behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
node tests/test_hakim_opencode_adversarial_transactions.mjs
node tests/test_hakim_opencode_cli.mjs
node tests/test_hakim_opencode_package_surface.mjs
npm run check:distribution-identity
npm test
```

These checks prove their repository/package scope only. Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
