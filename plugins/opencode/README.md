# Hakim for OpenCode

**Status:** maintained project-local OpenCode integration. Latest frozen prerelease: `1.0.0-beta.4`; current `main` also contains unreleased R3.2 development accepted through F04. Frozen beta.4 OpenCode live-host acceptance remains `NOT_RUN` pending exact-candidate evidence.  
**Distribution:** Git-backed bootstrap into repository-local OpenCode files; no npm registry publication or global installer.

## What this plugin does

The plugin loads project-locally from:

```text
.opencode/plugins/hakim.js
```

It uses OpenCode's native configuration and prompt surfaces to:

- register `/hakim`, `/hakim-review`, `/hakim-audit`, `/hakim-debt`, `/hakim-gain`, and `/hakim-help` when the command name is not already present;
- add the installed canonical Hakim skills directory to `config.skills.paths` without duplicates;
- inject canonical Hakim policy through the installed shared loader rather than embedding another rule copy;
- keep `lite`, `full`, `ultra`, and `off` mode in process/session memory;
- make `/hakim <mode>` a direct mode-selection turn;
- keep the Hakim-owned system-prompt range idempotent and bounded by explicit start/end sentinels;
- preserve unrelated host system content;
- remove only the relevant session-local mode state when a session-deleted event is observed.

The mode-selection turn itself is intentionally not a repository task: it must not load auxiliary Hakim skills, inspect the repository, or run tools merely to change mode.

Repository tests cover documented hook shapes, package surface, managed project-local lifecycle, adversarial verification-to-mutation races, foreign system-content coexistence, multi-session state isolation, and direct mode activation. Real-host acceptance remains a separate evidence layer.

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
            ├── hakim-review/SKILL.md
            ├── hakim-audit/SKILL.md
            ├── hakim-debt/SKILL.md
            ├── hakim-gain/SKILL.md
            └── hakim-help/SKILL.md
```

`install-manifest.json` is bounded lifecycle metadata for Hakim-owned paths. It records product version plus exact target paths, sizes, and SHA-256 hashes and is treated as untrusted local input before mutation.

The installer does **not** create or modify `opencode.json`. OpenCode discovers the project-local plugin from `.opencode/plugins/`; Hakim registers the installed skill path at load time.

## Install — Git-backed bootstrap

From the target repository:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install
```

That command uses npm's Git-package transport to run the bounded `hakim-opencode` bootstrap. It does not install a published npm-registry Hakim package and creates no global Hakim/OpenCode state.

Read-only inspection:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim hakim-opencode status
```

For immutable reproduction or acceptance, pin the Git package spec to the exact commit required by the evidence workflow.

The managed installer supports only bounded safe transitions:

1. **Create** — all Hakim-owned target paths are absent.
2. **Adopt** — an exact recognized pre-manifest installation already matches and only lifecycle metadata is missing.
3. **Upgrade** — a complete verified supported older installation is present; the new payload is staged first, old owned bytes are quarantined and post-move verified, new payload is installed create-only, and the new manifest is written last.

Malformed/unsupported manifests, unsafe paths, partial or modified state, symlinks/non-regular files, unowned conflicts, and unprovable overwrites are refused.

## Use

Examples:

```text
/hakim full
/hakim ultra
/hakim off
/hakim-review Review the current diff.
/hakim-audit Inspect the explicitly requested repository scope.
/hakim-help Explain the available Hakim capabilities.
```

Use `/hakim <mode>` to set session mode, then issue the coding/review request separately.

Mode state is process-local. Explicit session IDs are isolated; a fresh plugin process resets to `HAKIM_DEFAULT_MODE` or `full` when unset/invalid. OpenCode mode state is not persisted across host restarts, projects, profiles, or machines.

The activation hook keeps at most one Hakim-owned block delimited by `<!-- hakim-system:v1 mode=... -->` and `<!-- /hakim-system:v1 -->`. Repeated transforms do not duplicate it; mode changes replace only that owned range; `off` removes only that range; unrelated system content is preserved. A legacy start marker without a matching end marker is left untouched rather than destructively guessing its boundary.

Hakim never overwrites an existing OpenCode command with the same name.

## Remove

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove
```

Optional dry run:

```bash
npx --yes --package=github:Habib1001-m/hakim hakim-opencode remove --dry-run
```

Removal accepts a complete byte-verified supported installed manifest, including supported older Hakim versions. It does not require the currently executing package bytes to equal the older installed payload.

For mutation, Hakim moves each owned live file into private same-filesystem quarantine and re-hashes the moved bytes before deletion is allowed. If bytes change in the final verify-to-rename window, removal fails and restores the actual quarantined bytes with no-clobber semantics. Independently reappearing target paths are never overwritten.

Create/upgrade rollback follows the same ownership rule: Hakim may discard only bytes it created and can still prove unchanged after they leave the live namespace.

## Concurrency boundary

The lifecycle does not claim a cross-process lock or immunity from arbitrary hostile filesystem actors. Concurrent changes may cause refusal or rollback. The narrower safety contract is that verification-to-mutation races must not silently authorize deletion of unverified bytes, and rollback must not clobber an independently reappeared path.

## Node runtime contract

The Git-backed package declares Node `>=22`. Public CI uses Node 24 for the canonical gate and exercises the shipped JavaScript/OpenCode surface on Node 22 and Node 26 through `test:node-compat`.

That is a JavaScript runtime contract, not universal OpenCode/OS compatibility.

## Source-checkout fallback

Repository development and manual lifecycle inspection can use:

```bash
npm run plan:install -- --host opencode --target /path/to/repository
npm run install:opencode -- --target /path/to/repository
npm run install:opencode -- --target /path/to/repository --apply
npm run remove:opencode -- --target /path/to/repository
```

The first two install surfaces are read-only/dry-run; the apply/remove paths use the same managed lifecycle as the Git-backed bootstrap.

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

These checks prove their deterministic repository/package scope only. They do not create real-host acceptance evidence.

## Evidence boundaries

- The Git-backed bootstrap is transport over the project-local managed lifecycle; it does not introduce global Hakim state.
- The frozen beta.4 OpenCode path is `NOT_RUN` in `conformance/native-host-acceptance.json`; exact-candidate install/start/invocation evidence is required before promotion.
- Accepted beta.1 and frozen beta.2/beta.3 evidence remains candidate-bounded historical evidence and is not reused as beta.4 proof.
- Unreleased R3.2 work on `main` is a separate development identity; no beta.5 evidence exists until a candidate is deliberately cut.
- Host-native permissions, trust, configuration, and runtime behavior remain authoritative.
- Public source availability does not imply npm registry publication, central marketplace publication, global installation, signing, or universal-runtime availability.
