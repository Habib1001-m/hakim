# Hakim for Claude Code

Hakim is a native Claude Code plugin with six canonical skills, automatic SessionStart presence, and scoped execution agents.

## Install

Use an immutable reviewed release tag:

```bash
export HAKIM_REF=<release-tag>
claude plugin marketplace add "https://github.com/Habib1001-m/hakim.git#$HAKIM_REF"
claude plugin install hakim@hakim
```

The default installation scope is `user`. For repository-shared installation, use Claude Code's project scope according to your repository policy.

After installation, start a fresh Claude session. If the host asks you to trust the Hakim SessionStart hook, review and approve it through Claude Code's native trust UI. If you install while a session is already open, reload plugins or start a new session according to the host's current workflow.

## Native skills

```text
/hakim:hakim
/hakim:review
/hakim:audit
/hakim:debt
/hakim:status
/hakim:help
```

The six user-visible skill names are the canonical capability names. There is no second `full/review/audit/debt/gain/help` wrapper layer and no hidden duplicate `hakim-*` capability set.

`lite`, `full`, `ultra`, and `off` are modes of `hakim`.

## Execution agents

Hakim also ships bounded host-native execution contexts:

- `hakim:hakim-reviewer` — read-only review context using `hakim:review`.
- `hakim:hakim-auditor` — deeper read-only audit context using `hakim:audit`.
- `hakim:hakim-debt-analyst` — read-only debt-provenance context using `hakim:debt`.
- `hakim:hakim-evidence-verifier` — read-only evidence-status context using `hakim:status`.
- `hakim:hakim-implementer` — bounded implementation context using `hakim:hakim` with worktree isolation.

Agents are execution contexts, not separate capability contracts. Claude Code may delegate according to its normal agent behavior or the user may select an agent explicitly. Host permissions remain authoritative.

## Startup behavior

SessionStart injects a compact core rather than the full skill catalog. It makes Hakim's decision model available automatically while leaving ordinary tactics to the capable worker and preserving Claude Code's permission, managed-policy, trust, and plugin-cache controls.

## Inspect, update, or remove

```bash
claude plugin list
claude plugin details hakim@hakim
claude plugin update hakim@hakim
claude plugin uninstall hakim@hakim
```

Updates follow the registered marketplace source.

## Validation

From a source checkout:

```bash
npm test
node tests/test_claude_runtime_kernel.mjs
```

Repository tests prove only their checked scope. Real-host installation, trust, SessionStart delivery, and explicit skill invocation remain separate acceptance evidence.
