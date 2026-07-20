# Hakim repository instructions

When changing this repository:

- make the smallest safe change;
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

These are capability names, not universal slash-command claims. Host-native
permissions and repository protections remain authoritative.

Do not promise slash-command support on this surface.
