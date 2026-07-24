---
name: hakim-debt
description: Collect deliberate Hakim shortcuts from hakim comments and review debt provenance without inventing live repository debt. Optionally inspect a bundled example ledger when the active distribution provides one.
---

# Hakim Debt

Collect deliberate Hakim shortcuts and distinguish live repository debt from examples, archived records, and unsupported claims. The live-source scan is the capability; an example ledger is optional context, not a required runtime dependency.

## Scan live source

Search active source files for explicit comment markers such as:

```text
# hakim:
// hakim:
/* hakim:
```

Skip generated output, dependency directories, `.git`, archives, and historical snapshots unless the user explicitly asks to include them or the target repository marks them as active.

For every live marker, capture:

```text
file
line
shortcut
ceiling
upgrade trigger
owner, when available from repository evidence
```

A live debt claim must come from inspectable target-repository evidence. Do not promote a synthetic example, filename, old plan, or historical record into live debt.

## Optional ledger resource

Some Hakim distributions include `assets/technical_debt_ledger.json` relative to the Hakim package root as a synthetic example dataset. Native host plugins are not required to bundle that asset.

- If the asset is present, inspect it separately and respect its provenance metadata.
- If it is absent, continue the live-source review and report `ledger: not bundled`.
- Never treat absence of the example ledger as missing target-repository debt evidence.
- Never assume a source-repository path such as `core/hakim-skill/assets/technical_debt_ledger.json` exists in an installed plugin.

An entry classified as `synthetic_example` is not live repository debt.

## Output

Group live markers by file:

```text
<file>:<line> — <shortcut>. ceiling: <limit>. upgrade: <trigger>. evidence: <source>.
```

Flag markers without a concrete trigger as:

```text
no-trigger
```

End with:

```text
live markers: <N>; no-trigger: <M>; ledger: <not bundled | not inspected | synthetic/live counts>.
```

If no live markers exist:

```text
No live hakim: debt found in the inspected scope. Synthetic or historical examples were not promoted to repository claims.
```

## Persisting changes

Default behavior is read-only. Only create or update a target-repository debt ledger when the user explicitly asks for persistence and the repository defines or accepts that ledger location. Do not create a ledger merely because Hakim's optional example asset is absent.

Every persisted live claim must reference an existing target path plus commit, pull request, issue, operator evidence, or another inspectable source accepted by that repository.

## Boundaries

- Do not convert examples into live debt.
- Do not infer debt from filenames or old planning documents alone.
- Do not modify comments or ledger entries during a report-only request.
- Do not claim that an optional Hakim asset is bundled unless the active distribution actually contains it.
