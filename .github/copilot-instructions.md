# Hakim repository instructions

<!-- hakim-canonical-sha256: f6032abce66fb0a5071ff2775e7f3b495722c8026eaf40bab433fa84ebd66eea -->

When changing this repository:

- make the smallest safe change;
- before the first mutation in an existing runnable repository, run the smallest reasonably bounded representative baseline available; if none is safe/reasonable, record why no baseline was run and do not imply a pre-existing green state;
- once the affected implementation path, local conventions/reuse candidates, material guards, and validation surface are known, stop inspecting; any additional read/search must answer a concrete unresolved question with decision value;
- do not default to whole-repository exploration when the affected path is already bounded; investigate material correctness or safety uncertainty before mutation;
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
