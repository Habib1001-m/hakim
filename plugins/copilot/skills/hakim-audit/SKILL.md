---
name: hakim-audit
description: Perform an evidence-backed read-only complexity audit of an explicitly inspected repository scope, separating deterministic helper coverage from manual findings.
---

# Hakim Audit

State the exact files, directories, diff, branch, or commit inspected. Reuse existing repository checks before inventing scanners. Verify every manual finding against actual files and callers or consumers.

Look for deletion, reuse, standard-library/native replacements, unnecessary dependencies, speculative layers, stale surfaces, and unsupported claims.

Do not mutate repository state. A zero-finding result is not correctness, security, readiness, or release approval.
