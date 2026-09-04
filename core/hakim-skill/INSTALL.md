# Install Hakim

Hakim is public beta software distributed from its Git repository and host-native plugin surfaces.

Install from an immutable Git ref: a release tag or exact release commit.

```bash
export HAKIM_REF=<release-tag-or-exact-commit>
```

## Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, install **Hakim**, trust the SessionStart hook, and start a new thread.

Available skills include `$hakim:hakim`, `$hakim:hakim-review`, `$hakim:hakim-audit`, `$hakim:hakim-debt`, `$hakim:hakim-gain`, and `$hakim:hakim-help`.

## Claude Code

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$HAKIM_REF"
claude plugin install hakim@hakim
```

Commands include `/hakim:full`, `/hakim:review`, `/hakim:audit`, `/hakim:debt`, `/hakim:gain`, and `/hakim:help`.

If Hakim was installed while a session was already open, reload plugins or start a new session according to the host's current plugin workflow.

## GitHub Copilot CLI

```bash
copilot plugin marketplace add "Habib1001-m/hakim#$HAKIM_REF"
copilot plugin install hakim@hakim
```

Verify installation with:

```bash
copilot plugin list
```

Hakim supports explicit mode selection through the installed `hakim` capability; use the plugin help surface for the current host syntax.

`.github/copilot-instructions.md` is an optional repository projection, not the primary plugin distribution.

## OpenCode

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install
```

Read-only inspection:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode status
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode install --dry-run
```

Remove Hakim-managed project-local state with:

```bash
npx --yes --package="github:Habib1001-m/hakim#$HAKIM_REF" hakim-opencode remove
```

The OpenCode lifecycle supports bounded create/adopt/upgrade/remove flows, validates Hakim-owned files and manifests, refuses unsafe or conflicting state, preserves unrelated `.opencode` content, and does not edit `opencode.json`.

Some npm 10 environments have a Git-package transport bug. If exact-Git npx transport fails with an Arborist/GitFetcher packing error, use npm 11+; do not replace the intended Hakim source ref with a moving branch.

## Source development

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
npm run package:release
```

Repository development requires Node.js 22+ and Python 3.10+.

Generated packages, checksums, and tests prove only their checked scope. Host-native approval, trust, permissions, sandboxing, managed policy, and removal remain authoritative.
