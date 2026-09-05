---
name: audit
description: "Hakim — Use when a subsystem, adapter set, dependency surface, or repository question needs broader read-only evidence than a bounded review. Find only evidence-backed simplification, dependency, drift, and claim issues, and widen scope only when the decision earns it."
---

# Hakim Audit

Use `audit` when the question genuinely requires **broader repository evidence** than `review`: for example, a simplification audit across a subsystem, dependency surface, runtime adapter set, or product boundary.

Audit depth is earned by the decision, not by repository size. Start with the smallest explicit scope that can answer the question, widen only when evidence makes that necessary, and stop when the material uncertainty is resolved.

## Audit contract

1. Name the repository/revision and the scope being audited.
2. Identify the active implementation and authority surfaces before classifying anything as stale, dead, duplicated, or removable.
3. Inspect consumers/callers for any finding that depends on non-use or equivalence.
4. Reuse maintained repository checks, manifests, dependency metadata, and runtime evidence before inventing new scanners.
5. Separate deterministic tool output from human/manual findings.
6. Preserve real security, privacy, accessibility, integrity, migration, rollback, compatibility, and trust-boundary invariants.
7. Stop expanding once further inspection cannot materially change the finding set or confidence.

## Finding classes

Use only evidence-backed findings:

- `delete` — active product surface with no current requirement or consumer;
- `reuse` — duplicate behavior already implemented elsewhere;
- `stdlib` — custom behavior replaced by maintained standard-library support;
- `native` — custom behavior replaced by a host/platform capability;
- `dependency` — dependency can be removed or avoided without losing required behavior;
- `yagni` — speculative abstraction, configuration, or extension point without a current consumer;
- `shrink` — materially simpler implementation preserves the same required outcome;
- `claim` — product/runtime/release/security/performance wording exceeds accepted evidence;
- `drift` — active adapters, manifests, docs, or projections disagree about current behavior.

Do not infer dead code, removability, or equivalence from names, age, lack of recent edits, or a scanner result alone.

## Optional tools

Use existing repository-native analysis first. If the active Hakim distribution includes a deterministic complexity helper and it directly answers the audit question, it may be used as **candidate-finding evidence only**. Verify every candidate against source and consumers before reporting it.

Absence of an optional helper is not an audit failure. Do not assume source-repository paths exist inside an installed plugin.

## Evidence discipline

For every material finding, record enough evidence to answer:

- what was inspected;
- what current consumer/requirement was checked;
- what makes the existing implementation unnecessary or oversized;
- what replacement preserves the required outcome;
- what uncertainty remains.

If evidence conflicts, preserve the contradiction instead of forcing a finding.

## Output

Rank the largest safe reductions or drift corrections first:

```text
<tag> — <finding>. <smallest safe replacement>. [<path>:<line-or-range>]
```

End with a compact scope statement:

```text
scope: <exact inspected revision/surfaces>
findings: <count by material class>
correctness_review: PERFORMED | NOT_PERFORMED | PARTIAL:<scope>
security_review: PERFORMED | NOT_PERFORMED | PARTIAL:<scope>
remaining_uncertainty: <none or material limits>
```

Use `PERFORMED` for correctness/security only when that review was actually part of the requested scope and executed to an appropriate standard. A simplification audit does not become a correctness or security audit by accident.

When no simplification finding is supported:

```text
No evidence-backed reductions found in the inspected scope.
```

Do not convert that result into repository-wide approval, readiness, correctness, or security claims.

## Boundary

Read-only by default. Do not mutate repository state, create audit artifacts inside the target repository, remove dependencies, or apply findings unless the user explicitly authorizes implementation.
