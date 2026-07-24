# Hakim for OpenCode

**Status:** public beta project-local native plugin  
**Distribution:** repository-local files from a Hakim source checkout; no npm package or global installer

## What this plugin does

The plugin loads project-locally from:

```text
.opencode/plugins/hakim.js
```

It uses OpenCode configuration and prompt hooks to:

- register `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, and `/hakim-help` when a command name is not already present;
- add the installed canonical Hakim skills directory to `config.skills.paths` without duplicate entries;
- inject the canonical Hakim `SKILL.md` through `core/loaders/hakim-loader.mjs` instead of embedding another rules copy;
- keep `lite`, `full`, `ultra`, and `off` mode in process/session memory;
- remove session-local mode state when a session-deleted event is observed.

Repository tests cover the documented hook shapes and guarded project-local file lifecycle. Live host compatibility remains bounded to documented local validation and does not establish universal OpenCode compatibility.

## Project-local installed layout

```text
.opencode/
├── plugins/
│   └── hakim.js
└── hakim-runtime/
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

The installer does **not** create or modify `opencode.json`. OpenCode discovers project-local plugins from `.opencode/plugins/`; Hakim installs the adapter with a `.js` filename so it participates in OpenCode's current JavaScript/TypeScript plugin discovery, and the plugin registers the installed skill path at load time.

## Install

Inspect the unified read-only plan first:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
```

Dry-run the concrete installation manifest:

```bash
npm run install:opencode -- --target /path/to/repository
```

Apply only after reviewing the manifest:

```bash
npm run install:opencode -- --target /path/to/repository --apply
```

JSON output:

```bash
npm run install:opencode:json -- --target /path/to/repository
```

Installation is create-only. It refuses:

- a symlink target repository;
- unsafe `.opencode` directory components;
- a pre-existing different plugin or runtime file;
- a partial bundle, even when the files that exist match;
- any automatic overwrite or partial repair.

Every created file is checked against the canonical manifest. A failed partial creation attempts to roll back only the files and directories created by that operation.

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

The mode is session/process-local. It is not persisted to a user profile or shared across machines. `HAKIM_DEFAULT_MODE` may set the process default to `lite`, `full`, `ultra`, or `off`; invalid values normalize to `full` through the canonical loader.

The plugin never overwrites an existing OpenCode command with the same name.

## Remove

Dry-run exact-match verification:

```bash
npm run remove:opencode -- --target /path/to/repository
```

Apply removal:

```bash
npm run remove:opencode -- --target /path/to/repository --apply
```

Removal proceeds only when every installed Hakim file is a complete byte-identical match for the current canonical bundle. Before removal, the exact files are copied into a private quarantine directory and verified again. If removal fails after mutation starts, Hakim attempts restoration from that quarantine. Modified, partial, symlink, non-regular, or unrelated OpenCode paths are preserved. The `.opencode` directory itself and unrelated content are never removed.

## Concurrency boundary

The maintained project-local installer/remover does not claim a cross-process lifecycle lock. It validates target state at defined checkpoints and refuses unsafe or changed state, but it does not claim immunity to a malicious or concurrent filesystem replacement between every check and mutation. Treat the target repository as an operator-controlled trust boundary during install or removal.

## Validate repository-side behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
npm test
npm run check:evidence-script
```

These checks prove deterministic plugin wiring and the documented guarded project-local file lifecycle only.

## Evidence boundaries

- Project-local plugin and installer/remover behavior is covered by the public test suite.
- Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
- Public source availability does not imply npm, marketplace, global-installer, signing, or universal-runtime availability.
- Runtime or compatibility claims must remain bounded to the specific evidence collected for the tested environment.
