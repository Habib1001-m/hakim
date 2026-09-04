---
name: status
description: Report what the current evidence actually proves for an exact Hakim repository, task, test, or runtime scope without inventing performance, savings, security, compatibility, adoption, or ROI claims.
---

# Hakim Status

Use `status` to answer one question: **what does the available evidence currently establish, and what remains unproven?**

This capability reports evidence state. It does not score Hakim, estimate benefit, or imply that the absence of findings proves correctness.

## Evidence layers

Keep materially different evidence layers separate:

- **source/state evidence** — inspected files, manifests, revision identity, repository state;
- **deterministic checks** — tests, build, lint, type checks, package verification, hashes;
- **human review** — bounded technical, complexity, correctness, security, or product review;
- **runtime/live evidence** — behavior observed in the actual host/environment;
- **release/deployment evidence** — accepted publication, deployment, rollout, or production state.

Evidence from one layer does not automatically prove another.

## Method

1. Bind the exact repository/task/revision/runtime scope being discussed.
2. List the material evidence actually observed for that scope.
3. Separate PASS/FAIL results from unperformed checks and unresolved contradictions.
4. State the strongest supported conclusion without broadening it.
5. Mark unsupported material claims as `NOT_ESTABLISHED`.

If evidence is stale, from a different revision, or only partially applicable, say so explicitly.

## Claim discipline

Do not infer any of these without direct accepted evidence:

- performance improvement;
- token, time, or cost savings;
- security approval;
- universal compatibility;
- model-quality improvement;
- adoption or user success;
- benchmark gain;
- return on investment;
- release readiness beyond the tested/accepted scope.

A zero-finding review is not correctness or security approval. A green automated suite is not live-host acceptance. A successful implementation is not a release.

## Output

Prefer a compact evidence card:

```text
Hakim status
scope: <exact revision/task/runtime>
source_state: <established state>
deterministic_checks: <pass/fail/not run + scope>
human_review: <performed/not performed + scope>
runtime_live: <performed/not established + scope>
release_or_deploy: <established/not established>
contrary_evidence: <none or material contradiction>
conclusion: <strongest evidence-supported state>
```

Then list only material unsupported claims, for example:

```text
NOT_ESTABLISHED: universal compatibility
NOT_ESTABLISHED: quantified performance or ROI
```

Do not add `NOT_ESTABLISHED` boilerplate for claims nobody asked about unless the boundary is material to the current decision.

## Boundary

Read-only and one-shot by default. `status` does not modify files, modes, settings, test results, acceptance state, or release metadata.
