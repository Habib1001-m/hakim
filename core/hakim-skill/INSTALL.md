# Install Hakim

Hakim is public beta software distributed from its Git repository and host-native plugin surfaces.

For a supported cross-host release install, use an immutable reviewed release tag:

```bash
export HAKIM_REF=<release-tag>
```

## Codex

```bash
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, install **Hakim**, approve the host trust prompt if shown, and start a new thread.

Installed skills:

```text
$hakim:hakim
$hakim:review
$hakim:audit
$hakim:debt
$hakim:status
$hakim:help
```

## Claude Code

```bash
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$HAKIM_REF"
claude plugin install hakim@hakim
```

Installed skills:

```text
/hakim:hakim
/hakim:review
/hakim:audit
/hakim:debt
/hakim:status
/hakim:help
```

If Hakim was installed while a session was already open, reload plugins or start a new session according to the host's current plugin workflow. Approve the host hook-trust prompt if shown. Claude's trust and permission boundaries remain authoritative.

## GitHub Copilot CLI

```bash
copilot plugin marketplace add "Habib1001-m/hakim#$HAKIM_REF"
copilot plugin install hakim@hakim
```

Verify installation with:

```bash
copilot plugin list
```

Inside Copilot CLI, `/skills list` and `/agent` expose the loaded Hakim skills and execution agents. The six skills are `hakim`, `review`, `audit`, `debt`, `status`, and `help`.

Explicit mode selection uses the installed `hakim` capability; host-native syntax remains authoritative. `.github/copilot-instructions.md` is a lightweight repository fallback, not the primary plugin distribution.

## OpenCode

From the target repository:

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

Some npm 10 environments have a Git-package transport bug. If exact-Git npx transport fails with an Arborist/GitFetcher packing error, use npm 11+; do not replace the intended immutable source ref with a moving branch.

## Capability model

All supported hosts expose the same semantic capabilities:

```text
hakim  review  audit  debt  status  help
```

Modes belong to `hakim`; they are not additional skills:

- `lite` — execute the request and mention a materially smaller safe alternative when one exists.
- `full` — default; apply the complete Hakim decision model with proportional verification.
- `ultra` — challenge additions, abstractions, and dependencies aggressively; prefer deletion and reuse without weakening the required outcome or real guards.
- `off` — do not apply Hakim guidance beyond host, repository, and safety boundaries.

Invocation syntax may differ by host.

## Source development

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
npm run package:release
```

Repository development requires Node.js 22+ and Python 3.10+.

Generated packages, checksums, and tests prove only their checked scope. Host-native approval, trust, permissions, sandboxing, managed policy, caches, and removal remain authoritative.
