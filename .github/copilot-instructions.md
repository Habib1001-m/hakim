# Hakim repository instructions

<!-- hakim-canonical-sha256: 80147e0248232c6836c62941f7a8957c3a3a131fb90b1c75f41d8ef84832db0b -->

When changing this repository:

- make the smallest safe change; in Hakim this means the smallest sufficient, coherent, safe change rather than optimizing for the fewest lines or files;
- before the first mutation in an existing runnable repository, run the smallest reasonably bounded representative baseline available; baseline discovery is read-only by default, and dependency or editable installs, lockfile or package-metadata generation, repository-local environment/bootstrap creation, code generation, formatter writes, and similar side effects count as mutations rather than harmless baseline preparation;
- inspect maintained documentation, configuration, scripts, and tool declarations first; do not mutate merely to discover or prepare a baseline when a maintained non-mutating path is available; if setup mutation is genuinely required, state why before doing it and distinguish setup mutation from product mutation;
- before the first product edit in a runnable Git repository, report observed `BASELINE_COMMAND`, `BASELINE_SOURCE`, `SETUP_MUTATION`, and `PRE_EDIT_GIT_STATUS`; do not treat a plan as a completed checkpoint;
- for boolean/control-flow/validator/permission/guard transformations, report `SEMANTIC_CHANGE_CHECK` and do not claim semantic equivalence from existing-suite green alone; enumerate decision-relevant boundary states or run a targeted regression/probe, including empty/absent/error/boundary states when they can branch differently;
- before completion, report observed `FINAL_GIT_STATUS`, `SETUP_ARTIFACTS`, and `UNRELATED_MUTATIONS`; never claim a clean tree, no artifacts, or no setup mutations when the observed state contradicts that claim;
- once the affected implementation path, local conventions/reuse candidates, material guards, and validation surface are known, stop inspecting; any additional read/search must answer a concrete unresolved question with decision value;
- do not create repository-local planning/analysis artifacts or repeat equivalent analysis merely to continue inspection when no decision-relevant question remains;
- do not default to whole-repository exploration when the affected path is already bounded; investigate material correctness or safety uncertainty before mutation;
- before simplifying or deleting validation/guard logic, identify the protected invariant; simplification must not remove a real domain/security/privacy/integrity/migration/rollback/accessibility/trust guard unless evidence shows the requirement no longer applies or is preserved elsewhere;
- do not split, omit, or defer a necessary part of the same bounded change merely to shrink the diff;
- preserve unrelated behavior and user files;
- keep claims bounded to inspectable evidence; for `NO_CHANGE`, default to `No justified change found within the inspected scope` and do not claim the implementation is globally minimal, irreducible, optimal, or free of all simplification opportunities unless the inspected evidence establishes it;
- distinguish deterministic checks from correctness or security review;
- avoid speculative architecture and unnecessary dependencies;
- add or update tests for changed behavior;
- never include credentials, private prompts, sensitive evidence, or customer source code;
- document user-visible changes and remaining limitations.

## Capability routing

- If the user explicitly requests Hakim, `/hakim`, or the native `hakim` skill, invoke the installed native `hakim` capability before any repository-affecting tool or shell command. Do not reimplement the Hakim workflow first from generic instructions.
- Use Hakim capability `hakim` for the full evidence-bound workflow.
- Use Hakim capability `hakim-review` for bounded review.
- Use Hakim capability `hakim-audit` for evidence-backed audit work.
- Use Hakim capability `hakim-debt` for focused technical-debt analysis.
- Use Hakim capability `hakim-gain` for evidence-status summaries; the `gain` ID is retained for beta compatibility and does not imply a quantified gain.
- Use Hakim capability `hakim-help` for host-aware usage guidance.

When the native `hakim` Copilot plugin is installed, prefer its matching skill or specialized custom agent over re-implementing the workflow from these baseline instructions.

These are capability names, not universal slash-command claims. Host-native permissions, repository protections, plugin enablement, and tool controls remain authoritative.
