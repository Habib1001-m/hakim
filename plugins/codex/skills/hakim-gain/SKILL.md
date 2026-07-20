---
name: hakim-gain
description: Summarize what Hakim can and cannot claim from the evidence available in the current repository or task. Use for Hakim impact, gain, evidence status, or validated results.
---

# Hakim Gain

Provide a compact evidence-status summary without inventing performance,
adoption, safety, token, cost, speed, or return-on-investment numbers.

## Method

1. Identify the exact repository, task, test, or evidence scope being discussed.
2. Report only results supported by inspectable evidence in that scope.
3. Separate deterministic check results from human review or runtime evidence.
4. Mark absent measurements as `NOT_ESTABLISHED`.
5. State that zero findings from enabled rules are not correctness or security approval.

## Suggested card

```text
Hakim evidence status

Observed scope
  Repository or task              <exact scope>
  Deterministic checks            <pass/fail/not run>
  Human review                    <performed/not performed>
  Runtime validation              <performed/not established>

Unsupported claims
  Performance or ROI              NOT_ESTABLISHED
  Universal compatibility         NOT_ESTABLISHED
  Complete security approval      NOT_ESTABLISHED
```

## Rules

- Prefer current file-backed evidence over memory or marketing language.
- Do not reuse upstream benchmark numbers as Hakim-specific results.
- Do not estimate savings without a measured baseline.
- Keep `NOT_ESTABLISHED` boundaries explicit.
- One-shot report only; change no files, modes, settings, or runtime state.
