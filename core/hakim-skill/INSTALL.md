# Install Hakim

Hakim `1.0.0-beta.1` is distributed from source and local build artifacts. No
npm package or public marketplace extension is currently published.

## 1. Clone and inspect

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm run doctor:fast
npm run plan:install -- --host all
```

The install plan is read-only. It reports the maintained integration surface for
Codex, Claude Code, GitHub Copilot, and OpenCode without changing host or target
files.

## 2. Choose one host

### OpenCode

Dry-run the project-local installation first:

```bash
npm run plan:install -- --host opencode --target /path/to/project
npm run install:opencode -- --target /path/to/project
```

Apply only after reviewing the manifest:

```bash
npm run install:opencode -- --target /path/to/project --apply
```

Then start OpenCode from the target repository and use `/hakim-help` or
`/hakim full ...`. Installation is create-only, refuses partial or different
existing bundles, and does not edit `opencode.json`.

### Codex

Inspect the repository-local marketplace and launch plan:

```bash
npm run plan:install -- --host codex
npm run launch:codex -- --cwd /path/to/project
```

After review, launch Codex:

```bash
npm run launch:codex -- --apply --cwd /path/to/project
```

Use Codex `/plugins` and `/hooks` to review installation, activation, and the
SessionStart hook. Hakim does not bypass Codex trust or sandbox controls.

### Claude Code

Inspect the direct plugin-directory plan:

```bash
npm run plan:install -- --host claude-code
npm run launch:claude -- --cwd /path/to/project
```

After review:

```bash
npm run launch:claude -- --apply --cwd /path/to/project
```

The launcher starts Claude Code with Hakim's plugin directory. It does not make
a persistent host installation or overwrite Claude Code configuration.

### GitHub Copilot

Compare the target repository first:

```bash
npm run plan:install -- --host github-copilot --target /path/to/project
npm run install:copilot -- --target /path/to/project
```

Apply only when the supported instruction file is absent:

```bash
npm run install:copilot -- --target /path/to/project --apply
```

The installer never overwrites or merges an existing Copilot instruction file.
Review and commit any newly created repository instruction deliberately.

## 3. Validate the source checkout

```bash
npm test
npm run doctor
npm run package:skill
npm run build:native-plugin
```

Generated packages are local outputs. They do not prove registry publication,
signing, notarization, third-party attestation, or universal host compatibility.

Host-native installation, approval, trust, sandboxing, activation, and removal
controls remain authoritative.
