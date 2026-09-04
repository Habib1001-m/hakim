---
name: debt
description: Inspect deliberate Hakim shortcuts and technical-debt provenance in the current repository or task without promoting examples, history, or unsupported assumptions into live debt.
---

# Hakim Debt

Use `debt` to answer: **what deliberate shortcuts are actually live, what ceiling do they have, and what observable trigger should cause them to be revisited?**

The capability is evidence-first and read-only by default.

## Live debt contract

Treat an item as live debt only when current inspectable evidence supports it, such as:

- an active `hakim:` marker in source or maintained configuration;
- an accepted issue, decision, pull request, or operator record tied to the current code;
- another repository-defined debt record whose authority is current and traceable.

Do not promote these into live debt by themselves:

- example ledgers or sample data;
- archived/historical files;
- stale planning notes;
- filenames that sound like debt;
- memory or prior conversation claims without current supporting evidence.

## Marker shape

A well-formed deliberate shortcut records:

```text
hakim: <shortcut and why it is sufficient now>
ceiling: <concrete current limit>
upgrade trigger: <observable condition that requires revisiting it>
```

Existing repositories may use an equivalent local format. Preserve repository-local conventions when they already express the same information clearly.

## Inspection method

1. Bind the requested repository/revision/scope.
2. Search active source and maintained records for explicit debt markers or accepted debt evidence.
3. For each candidate, verify that the referenced path/behavior is still active.
4. Separate live debt from examples, archives, superseded records, and unsupported claims.
5. Capture the shortcut, ceiling, upgrade trigger, and provenance that makes the claim current.
6. If a trigger or ceiling is missing, report the missing field instead of inventing it.

Skip generated output, dependency directories, caches, `.git`, archives, and historical snapshots unless the user explicitly includes them or the repository treats them as active authority.

## Output

Group live items by path or bounded scope:

```text
<path>:<line-or-record> — <shortcut>
ceiling: <known limit | NOT_ESTABLISHED>
upgrade trigger: <observable trigger | NOT_ESTABLISHED>
evidence: <current provenance>
```

End with:

```text
live_debt: <N>
missing_ceiling: <N>
missing_trigger: <N>
non_live_candidates: <N>
```

When no live debt is supported:

```text
No live Hakim debt found in the inspected scope. Historical or synthetic examples were not promoted to current repository claims.
```

## Persistence boundary

Do not create, update, normalize, or delete debt markers/ledgers during a report-only request.

Persist debt only when the user explicitly asks for it and the target repository already defines or accepts the destination. A missing central ledger is not a reason to invent one.

Every persisted live claim must remain tied to inspectable current evidence.
