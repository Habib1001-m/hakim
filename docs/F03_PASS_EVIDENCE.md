# R3.2 F03 — Native Mode-Control UX PASS Evidence

**Status:** PASS end-to-end for the qualified Copilot OFF journey.

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

The clean live journey established all required properties together:

1. `/env` loaded exactly one Hakim hook for each of `sessionStart`, `userPromptSubmitted`, and `userPromptTransformed`.
2. A clean `/hakim/hakim off` invocation returned exactly `Hakim mode: off` without clarification, repository inspection, shell commands, or other tool work.
3. Copilot plugin data contained exactly:

```json
{"schema_version":1,"mode":"off"}
```

at `~/.copilot/plugin-data/hakim/hakim/mode.json`.
4. The frozen target fixture remained clean under `git status --porcelain=v1 -uall`.

## Historical failures preserved

F03 PASS does not erase the probes that isolated the final architecture:

- original F03 loader failure from wrong `argument-hint` YAML type;
- loader-fixed bare `/hakim off` losing effective mode semantics and persistence;
- F03c proving current-turn transformed semantics while failing persistence;
- F03d/F03e explicit plugin-data rebinding experiments, including F03e live failure despite repository-side CI;
- loader-fixed `userPromptSubmitted` control probe proving persistence while current-turn semantics still asked for clarification.

F03f is accepted because it composes only the two host boundaries already proven independently and then passed one clean end-to-end journey.

## Next gate

Run a bounded lifecycle matrix on the same F03f implementation:

```text
off -> ultra -> full
```

This is a lifecycle regression gate, not a reopening of F03 architecture.

F04 subagent propagation remains evidence-gated and must not be added unless a real propagation gap appears.

## Boundaries

This PASS does not authorize:

- beta.5;
- merging or marking PR #42 Ready;
- private D01 rerun;
- OpenCode/D02+ expansion;
- external evaluator work;
- stable release or registry publication.
