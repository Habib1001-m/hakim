---
name: hakim-audit
description: Perform an evidence-backed manual complexity audit of an explicitly inspected repository scope, optionally using Hakim's bounded Python heuristic scan when that helper is present in the active distribution. Use for Hakim audit, repository simplification, bloat review, or over-engineering review.
---

# Hakim Audit

Inspect an explicit repository scope for evidence-backed opportunities to delete, reuse, replace, or simplify code. The manual audit is the capability. Any deterministic helper is optional and narrower than the manual review.

## Manual audit capability

A manual audit may inspect multiple languages and repository surfaces only when the agent actually reads those files, existing checks, callers, manifests, and active documentation. Every finding must name the inspected evidence and the smallest safe replacement.

Look for:

- duplicate helpers or repeated behavior;
- wrappers that only delegate;
- interfaces, factories, or extension points without a current second use;
- dead flags or configuration nobody sets;
- dependencies whose behavior is already available in the repository, standard library, or native platform;
- speculative files or layers;
- unsupported runtime, benchmark, marketplace, release, or support claims;
- stale adapters, manifests, docs, or generated projections.

Do not infer any of those findings without inspecting the relevant source and consumers.

## Optional deterministic Python helper

Some Hakim distributions include `scripts/audit_complexity.py` relative to the Hakim package root. Native host plugins are not required to bundle that helper. Do not assume a source-repository path such as `core/hakim-skill/scripts/audit_complexity.py` exists in an installed plugin.

When the active distribution actually includes the helper, resolve its real package-relative path first and then run:

```text
python <resolved-hakim-package>/scripts/audit_complexity.py <target> --output json
```

If the helper is absent, continue the manual audit and report `helper: not bundled` or `helper: not run`. The absence of the helper is not an audit failure.

The helper is a read-only Python heuristic scan. It:

- scans one `.py` file or recursively scans `.py` files under one target directory;
- ignores registered environment, cache, dependency, and VCS directories;
- parses files with Python's standard-library `ast` module;
- runs exactly two rules:
  - `known-third-party-import-review` — flags imports from the fixed review list `click`, `numpy`, `pandas`, `requests`, and `yaml` without claiming they are removable;
  - `too-many-positional-parameters` — flags functions declaring more than six positional parameters for manual interface review;
- reports parse errors separately;
- reports repository-wide complexity, dead-code analysis, duplication analysis, correctness review, and security review as `NOT_PERFORMED`;
- requires manual verification before any remediation decision.

The `lite`, `full`, and `ultra` intensity values are provenance labels only for this helper. They execute the same rules and thresholds, and the report records `intensity_semantics=PROVENANCE_LABEL_ONLY`.

## Evidence collection

1. State the exact repository, branch, commit, diff, directories, or files inspected.
2. Inspect the repository tree and active source paths relevant to that scope.
3. Reuse existing project checks before inventing new scanners.
4. Use the optional helper only when it is actually present and relevant.
5. Verify each finding against the actual file and its callers or consumers.
6. Separate helper findings from manual findings.

## Read-only boundary

Do not create, update, delete, format, or stage repository files during a read-only audit. Keep any helper output on stdout or outside the target repository unless the user explicitly authorizes generated artifacts.

Historical, archived, generated, or snapshot directories are non-authoritative unless the target repository explicitly defines them as active. Do not delete or promote them based on their names alone; inspect the repository's actual retention and authority rules first.

## Manual audit output

Rank the largest safe reductions first:

```text
<severity> <tag> <what can be cut or corrected>. <replacement>. [<path>:<line or range>]
```

Allowed manual tags:

```text
delete reuse stdlib native dependency yagni shrink claim drift
```

End with an explicit scope summary:

```text
scope: <what was actually inspected>.
helper: <not bundled | not run | bounded helper result and coverage>.
summary: <N> evidence-backed findings; estimated -<L> lines; -<D> dependencies; <C> claim/drift corrections.
correctness_review=NOT_PERFORMED
security_review=NOT_PERFORMED
```

When no manual finding is supported:

```text
No evidence-backed reductions found in the inspected scope. Correctness and security review were not performed.
```

Never convert a zero-finding helper run into a whole-repository clean, correctness, security, readiness, approval, or shipping verdict. Estimates are review estimates, not product benchmark results.

## Boundaries

- Report only; do not mutate the repository unless explicitly asked.
- Preserve security, privacy, accessibility, data integrity, migrations, rollback paths, and user trust.
- Do not infer dead code, duplication, dependency removability, correctness, or security from the two deterministic heuristics.
- Do not claim languages, rules, thresholds, helper availability, or intensity behavior that the active distribution does not implement.
