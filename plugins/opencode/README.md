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
- remove session-local mode state when a session-deleted event is observed.

Repository tests cover the documented hook shapes, Git-backed bootstrap package surface, and guarded project-local file lifecycle. The public acceptance projection separately records accepted real-host evidence for the Git-backed path on OpenCode `1.17.13`; that evidence remains bounded to the observed environment and does not establish universal OpenCode compatibility.

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

The installer does **not** create or modify `opencode.json`. OpenCode discovers project-local plugins from `.opencode/plugins/`; Hakim installs the adapter with a `.js` filename and registers the installed skill path at load time.

## Install — Git-backed bootstrap

From the repository where you want to use Hakim:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

That command fetches Hakim from GitHub through npm's Git-package transport and runs the bounded `hakim-opencode` bootstrap. It does **not** publish or install `@habib/hakim` from the npm registry, and it does not create global Hakim/OpenCode state.

The target defaults to the current directory. To inspect without writing:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
```

To inspect current state:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

For immutable reproduction, replace the moving default branch with an exact accepted Git commit or tag in the Git package spec when one is required by the evidence workflow.

Installation is create-only. It refuses:

- a missing or unsafe target repository;
- unsafe `.opencode` directory components;
- a pre-existing different plugin or runtime file;
- a partial bundle, even when the files that exist match;
- any automatic overwrite or partial repair.

Every created file is checked against the canonical manifest. A failed partial creation attempts to roll back only the files and directories created by that operation.

## Source-checkout fallback

Repository development and manual inspection can still use the underlying source-checkout commands:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
```

The first two commands are read-only/dry-run surfaces. The final command applies the same create-only project-local lifecycle used by the Git-backed bootstrap.

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

From the target repository, exact-match removal is one command:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

Dry-run first when desired:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove --dry-run
```

Removal proceeds only when every installed Hakim file is a complete byte-identical match for the current canonical bundle. Before removal, the exact files are copied into a private quarantine directory and verified again. If removal fails after mutation starts, Hakim attempts restoration from that quarantine. Modified, partial, symlink, non-regular, or unrelated OpenCode paths are preserved. The `.opencode` directory itself and unrelated content are never removed.

## Concurrency boundary

The maintained project-local installer/remover does not claim a cross-process lifecycle lock. It validates target state at defined checkpoints and refuses unsafe or changed state, but it does not claim immunity to a malicious or concurrent filesystem replacement between every check and mutation. Treat the target repository as an operator-controlled trust boundary during install or removal.

## Validate repository-side behavior

```bash
node tests/test_opencode_plugin.mjs
node tests/test_hakim_opencode_lifecycle.mjs
node tests/test_hakim_opencode_cli.mjs
npm test
npm run check:evidence-script
```

These checks prove deterministic plugin wiring, the bounded Git-package bootstrap surface, and the documented guarded project-local file lifecycle only. They do not create or replace live-host acceptance evidence.

## Evidence boundaries

- The Git-backed bootstrap is a transport layer over the same project-local installer/remover; it does not introduce a second global lifecycle architecture.
- Project-local plugin and lifecycle behavior is covered by the public test suite.
- A new or materially changed first-run transport requires separate real-host evidence before Hakim treats that exact journey as independently accepted.
- The current Git-backed journey has accepted evidence tied to immutable candidate `b442820d2803955d0f7f33b405bd096f443d4d72` and OpenCode `1.17.13`; future materially changed transports require fresh evidence.
- Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
- Public source availability does not imply npm registry publication, central marketplace publication, global installation, signing, or universal-runtime availability.
- Runtime or compatibility claims remain bounded to the specific evidence collected for the tested environment.
