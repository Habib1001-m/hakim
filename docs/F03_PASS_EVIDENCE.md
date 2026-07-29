# R3.2 F03 — Native Mode-Control UX PASS Evidence

**Status:** PASS end-to-end for the qualified Copilot mode-control journey.

Exact implementation:

- Head: `6022a099518dd958d1d5d4f8f75b53b3159b34c3`
- Immutable ref: `evidence/r32-f03f-split-lifecycle-6022a09`
- Product version: `1.0.0-beta.4`
- Public CI #591: PASS on the exact head.

## Accepted topology

```text
sessionStart
userPromptSubmitted
userPromptTransformed
```

Responsibilities are deliberately split:

- `sessionStart` reads persisted mode and provides silent operational presence;
- `userPromptSubmitted` persists only exact bounded mode-control state through host-owned `COPILOT_PLUGIN_DATA`;
- `userPromptTransformed` rewrites only the current model-facing mode-control turn and has no state access.

No `preToolUse`, `postToolUse`, `agentStop`, or other enforcement hook is part of F03.

## Live Copilot CLI 1.0.75 proof

The accepted live journey established:

1. `/env` loaded exactly one Hakim hook for each of `sessionStart`, `userPromptSubmitted`, and `userPromptTransformed`.
2. `/hakim/hakim off` returned exactly `Hakim mode: off`, persisted `{"schema_version":1,"mode":"off"}`, and left the frozen target fixture clean.
3. `/hakim/hakim ultra` returned exactly `Hakim mode: ultra` and persisted `{"schema_version":1,"mode":"ultra"}`.
4. `/hakim/hakim full` returned exactly `Hakim mode: full` and removed `mode.json`, restoring stateless default full.
5. The frozen target fixture remained clean under `git status --porcelain=v1 -uall` throughout the lifecycle matrix.

Verdicts:

- `F03 = PASS_END_TO_END`
- `MODE_LIFECYCLE = PASS`

## Historical failures preserved

F03 PASS does not erase the probes that isolated the final architecture:

- original F03 loader failure from wrong `argument-hint` YAML type;
- loader-fixed bare `/hakim off` losing effective mode semantics and persistence;
- F03c proving current-turn transformed semantics while failing persistence;
- F03d/F03e explicit plugin-data rebinding experiments, including F03e live failure despite repository-side CI;
- loader-fixed `userPromptSubmitted` control probe proving persistence while current-turn semantics still asked for clarification.

F03f is accepted because it composes only the two host boundaries already proven independently and then passed one clean end-to-end journey plus the bounded `off -> ultra -> full` lifecycle matrix.

## Next gate — F04 subagent continuity

A fresh persisted-`ultra` parent session delegated a bounded diagnostic to the built-in Explore subagent without telling it the parent mode and without allowing tool/file/plugin-state inspection. The literal subagent result was:

```text
MODE=NONE
```

Therefore:

- `SUBAGENT_CONTEXT_CONTINUITY = GAP_CONFIRMED`
- adding a minimal `subagentStart` presence hook is evidence-justified.

The F04 remediation candidate reuses the existing `hooks/session_start.mjs` presence authority for `subagentStart`; it adds no second policy copy, state schema, repository bookkeeping, or enforcement/tool-interception hook. F04 remains pending exact-head Public CI and one clean live Explore rerun proving `MODE=ultra` with a clean target repository.

## Boundaries

This evidence does not authorize:

- beta.5;
- merging or marking PR #42 Ready;
- private D01 rerun;
- OpenCode/D02+ expansion;
- external evaluator work;
- stable release or registry publication.
