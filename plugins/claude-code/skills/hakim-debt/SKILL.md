---
name: hakim-debt
description: Collect deliberate Hakim shortcuts from hakim comments and review the technical-debt ledger without inventing live repository debt. Use for Hakim debt, shortcut ledger, deferred work review, or technical-debt evidence review.
user-invocable: false
---

# Hakim Debt

Collect deliberate Hakim shortcuts and distinguish live repository debt from examples, archived records, and unsupported claims.

## Scan

Search active source files for explicit comment markers such as:

```text
# hakim:
// hakim:
/* hakim:
```

Skip generated output, dependency directories, `.git`, archives, and historical phase snapshots unless the user asks to include them.

For every marker, capture:

```text
file
line
shortcut
ceiling
upgrade trigger
owner, when available from repository evidence
```

Review `assets/technical_debt_ledger.json` separately. Respect its provenance metadata. An entry classified as `synthetic_example` is not live repository debt.

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
live markers: <N>; no-trigger: <M>; ledger live claims: <L>; synthetic examples: <S>.
```

If no live markers exist:

```text
No live hakim: debt found. Synthetic or archived examples were not promoted to repository claims.
```

## Persisting changes

Default behavior is read-only. Only update or create a ledger when explicitly asked. Every persisted live claim must reference an existing path plus commit, PR, issue, or operator evidence.

## Boundaries

- Do not convert examples into live debt.
- Do not infer debt from filenames or old planning documents alone.
- Do not modify comments or ledger entries during a report-only request.
