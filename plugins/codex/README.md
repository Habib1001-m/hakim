# Hakim for Codex

Hakim is a native Codex plugin with six canonical skills and automatic SessionStart presence. The repository also acts as a Codex Git marketplace.

## Install

Use an immutable reviewed release tag:

```bash
export HAKIM_REF=<release-tag>
codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref "$HAKIM_REF"
```

Open `/plugins`, select the **Hakim** marketplace, install `hakim`, review/trust the SessionStart hook in `/hooks`, then start a new thread.

Installed identity:

```text
hakim@hakim
```

## Native skills

```text
$hakim:hakim
$hakim:review
$hakim:audit
$hakim:debt
$hakim:status
$hakim:help
```

Natural-language skill discovery remains valid when Codex matches a skill description.

`lite`, `full`, `ultra`, and `off` are modes of `hakim`, not separate skills.

## Startup behavior

SessionStart injects only the compact Hakim core needed before the first coding decision: bounded understanding, the decision ladder, proportional verification, earned depth, real-guard preservation, evidence/authority separation, and evidence-bound claims.

It does not paste specialized review/audit/debt/status/help contracts into every session and does not force fixed checkpoint tables or command sequences. The hook never bypasses Codex approval, sandbox, plugin, or trust controls.

## Validation

From a source checkout:

```bash
npm test
node plugins/codex/hooks/session_start.mjs
```

These checks prove only the repository/runtime paths they execute. Real-host installation and invocation remain separate acceptance evidence.
