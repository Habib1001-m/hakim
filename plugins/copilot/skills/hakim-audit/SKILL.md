---
name: hakim-audit
description: Perform an evidence-backed manual complexity audit of an explicitly inspected repository scope, optionally using Hakim's bounded Python heuristic scan as one input. Use for Hakim audit, repository simplification, bloat review, or over-engineering review.
---

# Hakim Audit

Inspect an explicit repository scope for evidence-backed opportunities to delete, reuse, replace, or simplify code. This capability is a manual repository review contract. Its deterministic helper is narrower and must not be represented as a whole-repository verdict.

## Two distinct contracts

### Manual audit capability

A manual audit may inspect multiple languages and repository surfaces only when the agent actually reads those files, existing checks, callers, manifests, and active documentation. Every finding must name the inspected evidence and the smallest safe replacement.

The manual capability may look for:

- duplicate helpers or repeated behavior;
- wrappers that only delegate;
- interfaces, factories, or extension points without a current second use;
- dead flags or configuration nobody sets;
- dependencies whose behavior is already available in the repository, standard library, or native platform;
- speculative files or layers;
- unsupported runtime, benchmark, marketplace, release, or support claims;
- stale adapters, manifests, docs, or generated projections.

These categories are not automatically checked by the deterministic helper.

### Deterministic Python helper

`core/hakim-skill/scripts/audit_complexity.py` is a read-only **Python heuristic scan**, not a repository-wide complexity audit. It:

- scans one `.py` file or recursively scans `.py` files under one target directory;
- ignores registered environment, cache, dependency, and VCS directories;
- parses files with Python's standard-library `ast` module;
- runs exactly two rules:
  - `known-third-party-import-review` — flags imports from the fixed review list `click`, `numpy`, `pandas`, `requests`, and `yaml` without claiming they are removable;
  - `too-many-positional-parameters` — flags functions declaring more than six positional parameters for manual interface review;
- reports parse errors separately;
- reports repository-wide complexity, dead-code analysis, duplication analysis, correctness review, and security review as `NOT_PERFORMED`;
- requires manual verification before any remediation decision.

The `lite`, `full`, and `ultra` intensity values are legacy provenance labels only. They execute the same rules and thresholds. The report records `intensity_semantics=PROVENANCE_LABEL_ONLY` and `intensity_applies_to_rules=false`.

## Evidence collection

1. State the exact repository, branch, commit, diff, directories, or files inspected.
2. Inspect the repository tree and active source paths relevant to that scope.
3. Reuse existing project checks before inventing new scanners.
4. Run the smallest relevant existing helper when execution is available.
5. Verify each finding against the actual file and its callers or consumers.
6. Separate deterministic helper findings from manual findings.

## Read-only execution

Keep helper output on stdout or outside the repository:

```bash
python core/hakim-skill/scripts/audit_complexity.py \
  core/hakim-skill/scripts \
  --output json
```

`--intensity full` may be supplied for compatibility, but it does not change coverage.

Do not use `npm run audit:ci` for a read-only request because that CI command writes `dist/audit.json`. Use it only when CI validation or generated repository artifacts are explicitly permitted.

Do not create, update, delete, format, or stage repository files during a read-only audit.

## Active and archived surfaces

In Hakim, `_phase-*` directories are historical snapshots governed by `ARCHIVE_POLICY.md`. Treat them as non-authoritative evidence, not active product code and not automatic deletion targets. Report archive duplication separately from active-code complexity. Deleting, moving, or externalizing an archive requires an explicit retention decision.

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
helper: <not run | bounded Python heuristic result and coverage>.
summary: <N> evidence-backed findings; estimated -<L> lines; -<D> dependencies; <C> claim/drift corrections.
correctness_review=NOT_PERFORMED
security_review=NOT_PERFORMED
```

When no manual finding is supported, report:

```text
No evidence-backed reductions found in the inspected scope. Correctness and security review were not performed.
```

Never convert a zero-finding helper run into a whole-repository clean, correctness, security, readiness, approval, or shipping verdict. Estimates are review estimates, not product benchmark results.

## Boundaries

- Report only; do not mutate the repository unless explicitly asked.
- Preserve security, privacy, accessibility, data integrity, migrations, rollback paths, and user trust.
- Do not infer dead code, duplication, dependency removability, correctness, or security from the two deterministic heuristics.
- Do not claim languages, rules, thresholds, or intensity behavior that the helper does not implement.
