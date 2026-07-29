# F03f Live Evidence

F03f runtime evidence remains frozen at `6022a099518dd958d1d5d4f8f75b53b3159b34c3` (`evidence/r32-f03f-split-lifecycle-6022a09`).

## F03 verdict

- Public CI #591: PASS on exact runtime head.
- Copilot CLI 1.0.75 loaded `sessionStart`, `userPromptSubmitted`, and `userPromptTransformed` from `hakim@hakim`.
- `/hakim/hakim off` returned `Hakim mode: off`, persisted exact bounded `mode.json`, and left the target repository clean.
- `/hakim/hakim ultra` returned `Hakim mode: ultra` and persisted ultra.
- `/hakim/hakim full` returned `Hakim mode: full` and removed `mode.json`, restoring stateless default full.

Verdicts:

- `F03 = PASS_END_TO_END`
- `MODE_LIFECYCLE = PASS`

## F04 pre-remediation subagent continuity probe

The parent session was started in persisted `ultra` mode with the accepted F03f topology and no `subagentStart` hook.

A built-in Explore subagent was asked only to report the exact `HAKIM OPERATIONAL PRESENCE` mode marker present in its own context, without reading files, inspecting plugin state, running shell commands, using tools, or being told the parent mode.

Literal subagent result:

```text
MODE=NONE
```

Verdict:

- `SUBAGENT_CONTEXT_CONTINUITY = GAP_CONFIRMED`
- The evidence condition for adding `subagentStart` is satisfied.

The minimal F04 remediation candidate adds exactly one `subagentStart` hook that reuses the existing `hooks/session_start.mjs` presence authority. It adds no second policy copy, no new state schema, no prompt persistence, no repository bookkeeping, and no enforcement/tool-interception hook.

F04 acceptance gate:

1. exact-head Public CI PASS;
2. `/env` shows `subagentStart` from `hakim@hakim` alongside the accepted F03 hooks;
3. a fresh parent session in persisted `ultra` mode delegates the same bounded diagnostic to built-in Explore;
4. the literal subagent answer is `MODE=ultra`;
5. target-repository Git state remains unchanged.

Until all five pass, `F04 = REMEDIATION_CANDIDATE` and PR #42 remains Draft.

No beta.5, Ready/merge transition, D01 rerun, external evaluation, stable release, or registry publication is authorized by this evidence.
