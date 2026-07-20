# Hakim OpenCode Adapter

**Status:** implemented project-local structural pilot  
**Runtime evidence:** `NOT_PERFORMED`  
**Distribution:** repository-local files only; no npm package or global installer

## What this adapter does

The adapter loads as a project-local OpenCode plugin from:

```text
.opencode/plugins/hakim.mjs
```

It uses OpenCode configuration and prompt hooks to:

- register `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, and `/hakim-help` when a command name is not already present;
- add the installed canonical Hakim skills directory to `config.skills.paths` without duplicate entries;
- inject the canonical Hakim `SKILL.md` through `core/loaders/hakim-loader.mjs` instead of embedding another rules copy;
- keep `lite`, `full`, `ultra`, and `off` mode in process/session memory;
- remove session-local mode state when a session-deleted event is observed.

The structural tests exercise the OpenCode hook shapes without launching OpenCode. They do not establish live host compatibility.

## Project-local installed layout

```text
.opencode/
├── plugins/
│   └── hakim.mjs
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

The installer does **not** create or modify `opencode.json`. OpenCode discovers the project-local plugin from `.opencode/plugins/`; the plugin registers the installed skill path at load time.

## Install

Dry-run first:

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
- concurrent target creation;
- any automatic overwrite or partial repair.

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

The adapter never overwrites an existing OpenCode command with the same name.

## Remove

Dry-run exact-match verification:

```bash
npm run remove:opencode -- --target /path/to/repository
```

Apply removal:

```bash
npm run remove:opencode -- --target /path/to/repository --apply
```

Removal proceeds only when every installed Hakim file is a complete byte-identical match for the current canonical bundle. Modified, partial, symlink, non-regular, or unrelated OpenCode paths are preserved. The `.opencode` directory itself and unrelated content are never removed.

## Validate repository-side behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
npm test
npm run check:evidence-script
```

These checks prove deterministic plugin wiring and guarded file lifecycle behavior only.

## Explicit non-claims

```text
OPENCODE_PROJECT_PLUGIN_IMPLEMENTED=true
OPENCODE_STRUCTURAL_HOOK_TESTS=PASS
OPENCODE_LIVE_RUNTIME_VALIDATION=NOT_PERFORMED
OPENCODE_RUNTIME_CONFORMANCE=NOT_ESTABLISHED
OPENCODE_PUBLIC_DISTRIBUTION=NOT_PERFORMED
RUNTIME_VERDICTS=23_OF_30
PUBLIC_RELEASE_READINESS=HOLD
```

Do not add OpenCode to accepted runtime counts until a separately approved live evidence packet is captured and accepted.
