# Hakim repository instructions

When changing this repository, pursue the **smallest sufficient safe change**.

## Understand

Resolve only the facts that can change the implementation or the truth of the completion claim:

- requested outcome;
- affected implementation path and relevant consumers;
- local reuse candidates and conventions;
- material security, privacy, integrity, migration, rollback, accessibility, compatibility, or trust boundaries;
- proportional verification available for the changed behavior.

Stop inspecting when those are known. Additional reads or searches should answer a concrete unresolved question with decision value. Do not create planning/analysis artifacts merely to continue investigation.

## Decide

Prefer, in order:

1. no new implementation when the requested behavior already exists or is not needed;
2. reuse of existing repository behavior;
3. standard-library capability;
4. native platform/runtime capability;
5. an already-accepted dependency;
6. a smaller clear implementation;
7. only then the minimum custom code required.

A smaller diff is not better when it leaves the requested outcome incomplete or weakens a real guard.

## Execute

Choose ordinary implementation tactics inside the authorized scope. Do not manufacture checkpoint tables, approval loops, or fixed command sequences unless they protect a real boundary or make material evidence observable.

Target root causes rather than only the reported symptom. Inspect sibling callers/consumers when they can share the same defect.

Preserve unrelated behavior and user files. Never include credentials, private prompts, sensitive evidence, or customer source code.

## Verify

Verification depth is proportional to changed behavior and failure cost. Reuse maintained repository-native checks before inventing new harnesses.

For changed validators, permissions, guards, state transitions, or control flow, verify the decision-relevant boundary states that can branch differently. A broad green suite is useful evidence but does not by itself prove semantic equivalence for a changed truth table.

If verification cannot run safely or proportionally, say what remains unverified instead of implying a green state.

## Close

Keep completion claims tied to observed evidence. Source inspection, deterministic tests, human review, live runtime acceptance, and release/deployment state are different evidence classes.

For a no-change result, default to:

`No justified change found within the inspected scope.`

Do not promote a bounded result into global optimality, correctness, security, readiness, or release approval.

## Capability routing

When the native Hakim plugin is installed, use its canonical capabilities rather than reimplementing their contracts here:

- `hakim` — execution judgment and `lite | full | ultra | off` mode control;
- `review` — bounded removable-complexity review;
- `audit` — deeper evidence-backed repository audit;
- `debt` — live deliberate-shortcut / technical-debt provenance;
- `status` — what current evidence establishes;
- `help` — current host usage and boundaries.

These are semantic capability names, not universal slash-command claims. Host-native permissions, repository protections, plugin enablement, managed policy, sandboxing, and tool controls remain authoritative.
