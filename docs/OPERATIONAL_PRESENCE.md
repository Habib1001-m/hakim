# Hakim Operational Presence

**Status:** accepted R3.2 development architecture through F04. This is unreleased development and does not itself create a new prerelease identity or release authorization.

Hakim is designed for capable coding agents. It should preserve model creativity and judgment while making its engineering discipline reliably present and checking objective truth only at consequential boundaries.

> **Free reasoning. Safe action. Evidence-bound claims.**

UX target:

> **Install once. Start coding. Hakim is already there.**

## Why operational presence exists

The beta.2–beta.4 D01 sequence showed that stronger skill text alone did not guarantee timely activation or truthful final-state reporting on every host/task.

R3.2 therefore separates three concerns:

1. **Decision policy** — semantic guidance for the model.
2. **Operational presence** — host-native delivery of that guidance.
3. **Objective truth** — verification of observable consequences and consequential claims.

The model remains free to reason. Hakim should constrain objective consequences and unsupported claims before it constrains reasoning paths.

## Golden rules

### Automatic

Normal use must not require `Use Hakim`, a bootstrap prompt, or repository setup after plugin installation.

### Quiet

Successful presence adds no mandatory turn or recurring banner. Visible output is justified for explicit mode/help commands, material host failure, or bounded correction.

### Host-native

Each host should use its strongest minimal lifecycle mechanism. Semantic parity does not require identical hooks.

### One authority

Operational adapters derive behavior from the maintained Hakim policy instead of growing independent prompt copies or a second reasoning engine.

### Tiny state

Copilot mode state is bounded to one host-owned plugin-data file containing only schema version and a non-default mode. Default `full` is stateless.

Never persist raw prompts, source code, tool arguments, reasoning, credentials, or private evidence as mode state.

### Fail soft

Presence failure must not corrupt the target repository or trap the coding session. Hakim must also avoid claiming guarantees when the relevant mechanism is unavailable.

### Intervene on contradiction, not possibility

Do not create broad command denylists merely because commands can mutate files. Prefer objective correction when observable state contradicts a consequential claim.

## Accepted Copilot topology

```text
native plugin install
       |
       v
sessionStart
  -> read bounded mode from COPILOT_PLUGIN_DATA
  -> default full when absent
  -> inject compact maintained Hakim context unless off
       |
       +----------------------------+
       |                            |
       v                            v
normal parent coding          subagentStart
  -> model reasons freely       -> reuse session_start.mjs
                                -> read the same bounded mode
                                -> inject the same maintained context unless off
       |
       v
optional explicit mode control
  -> /hakim/hakim <full|lite|ultra|off>
       |
       v
userPromptSubmitted
  -> recognize only the bounded mode command
  -> persist only non-default mode metadata
  -> ordinary prompts unchanged
       |
       v
userPromptTransformed
  -> rewrite only the current model-facing mode-control turn
  -> no state access
  -> no repository work
```

Responsibilities are deliberately split:

- `sessionStart` owns silent parent-session presence.
- `subagentStart` owns subagent continuity and reuses the same presence authority.
- `userPromptSubmitted` owns persistent non-default mode metadata.
- `userPromptTransformed` owns current-turn mode-control semantics only.

No `preToolUse`, `postToolUse`, `agentStop`, or `subagentStop` enforcement hook is part of the accepted operational-presence topology.

The transformed hook is deliberately stateless. Presence and submitted-mode persistence use host-owned `COPILOT_PLUGIN_DATA` directly; accepted Copilot CLI 1.0.75 evidence proved that path without repository-local state.

## Accepted evidence

| Slice | Verdict | Bounded evidence |
|---|---|---|
| F01 — silent parent presence | **PASS** | `sessionStart` loaded automatically, no repository instructions required, no target-repository mutation |
| F02 — plugin-data mode state | **PASS** | `off` suppressed presence in a fresh session; `full` removed the override and restored stateless default behavior |
| F03 — native mode control | **PASS END-TO-END** | `/hakim/hakim off → ultra → full` passed current-turn semantics, persistence/reset, and repository isolation |
| F04 — subagent continuity | **PASS** | pre-fix Explore returned `MODE=NONE`; evidence-justified `subagentStart` reuse then returned `MODE=ultra` with a clean target repository |

Key immutable refs:

- F01: `evidence/r32-f01-copilot-3825b7c`
- F02: `evidence/r32-f02-mode-5c558d4`
- F03 runtime: `evidence/r32-f03f-split-lifecycle-6022a09`
- F04 runtime: `evidence/r32-f04-subagent-presence-5c224c7`

Public CI passed on the exact accepted F03 and F04 runtime heads before those live probes were promoted.

Historical failed probes remain visible in GitHub issue/PR history and immutable evidence refs. They are not copied into this architecture authority line-by-line because the maintained document should describe the accepted design and the evidence boundaries, not reproduce the debugging transcript.

## Why F04 added one hook

Subagent propagation was not added for symmetry.

A real Copilot CLI 1.0.75 parent session in persisted `ultra` mode delegated a bounded diagnostic to built-in Explore without revealing the parent mode and without allowing file/plugin-state/tool inspection. Explore reported:

```text
MODE=NONE
```

That live gap justified exactly one `subagentStart` hook reusing `session_start.mjs`.

The accepted rerun then reported:

```text
MODE=ultra
```

with the target repository still clean.

No further lifecycle hook is justified without another concrete host gap.

## Next gate — F05 Objective Completion Truth

F05 is separate from operational presence and mode control.

The question is narrow:

> Can Hakim reconcile consequential completion claims with objective repository/setup truth at a late boundary without becoming a prose linter, command blocker, or reasoning workflow?

F05 must preserve these constraints:

- no broad shell/tool denylist;
- no command-string inference of correctness;
- no mandatory tool-by-tool ceremony;
- no raw prompt/source persistence;
- no unbounded correction loop;
- no second policy engine in hooks;
- intervene only where objective state can contradict a consequential completion claim.

## Remaining R3.2 gates

### F05 — Objective Completion Truth

Design and test the narrow late-bound truth mechanism described above.

### F06 — Deterministic operational regressions

Before candidate promotion, freeze regressions for:

- silent default full presence;
- exact bounded mode controls;
- ordinary-prompt non-persistence/non-rewrite;
- malformed-state fail-soft behavior;
- evidence-justified subagent continuity;
- absence of unproven enforcement hooks.

### F07 — Production-like D01 rerun

Only after F05/F06 are coherent:

1. advance the prerelease identity;
2. freeze the exact candidate;
3. rerun the original production-like D01 task without explicit Hakim activation;
4. compare correctness, repository purity, claim truth, behavioral value, and ceremony with beta.2–beta.4.

## Acceptance bar

R3.2 succeeds only if Hakim becomes **more reliable and less visible at the same time**.

```text
install Hakim
    -> open coding agent
        -> code normally
            -> Hakim is already present
                -> model keeps its freedom
                    -> objective contradictions are harder to ship
```

## Explicit exclusions

R3.2 through F04 does not authorize:

- beta.5 or any other new prerelease identity;
- external evaluator recruitment;
- stable `1.0.0`;
- npm registry or central marketplace publication;
- a cross-host runtime/service;
- copying Ponytail runtime code;
- broad tool blocking merely because a command can mutate files.
