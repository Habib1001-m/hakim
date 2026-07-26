# Hakim repository instructions

<!-- hakim-canonical-sha256: 4821268ca7afcaae795de7661caa937732da98d81da10222dbb69898f8d16b36 -->

When changing this repository:

- make the smallest sufficient, coherent, safe change rather than optimizing for the fewest lines or files;
- before the first mutation in an existing runnable repository, run the smallest reasonably bounded representative baseline available; if none is safe/reasonable, record why no baseline was run and do not imply a pre-existing green state;
- once the affected implementation path, local conventions/reuse candidates, material guards, and validation surface are known, stop inspecting; any additional read/search must answer a concrete unresolved question with decision value;
- do not default to whole-repository exploration when the affected path is already bounded; investigate material correctness or safety uncertainty before mutation;
- before simplifying or deleting validation/guard logic, identify the protected invariant; simplification must not remove a real domain/security/privacy/integrity/migration/rollback/accessibility/trust guard unless evidence shows the requirement no longer applies or is preserved elsewhere;
- do not split, omit, or defer a necessary part of the same bounded change merely to shrink the diff;
- preserve unrelated behavior and user files;
- keep claims bounded to inspectable evidence;
- distinguish deterministic checks from correctness or security review;
- avoid speculative architecture and unnecessary dependencies;
- add or update tests for changed behavior;
- never include credentials, private prompts, sensitive evidence, or customer source code;
- document user-visible changes and remaining limitations.

## Capability routing

- Use Hakim capability `hakim` for the full evidence-bound workflow.
- Use Hakim capability `hakim-review` for bounded review.
- Use Hakim capability `hakim-audit` for evidence-backed audit work.
- Use Hakim capability `hakim-debt` for focused technical-debt analysis.
- Use Hakim capability `hakim-gain` for evidence-status summaries.
- Use Hakim capability `hakim-help` for host-aware usage guidance.

When the native `hakim` Copilot plugin is installed, prefer its matching skill or specialized custom agent over re-implementing the workflow from these baseline instructions.

These are capability names, not universal slash-command claims. Host-native permissions, repository protections, plugin enablement, and tool controls remain authoritative.
