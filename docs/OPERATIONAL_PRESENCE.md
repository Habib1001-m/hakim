# Hakim Operational Presence Architecture

**Status:** R3.2 design/feasibility authority. This document records accepted experimental evidence and current design boundaries. It does not promote a release candidate.

Hakim is designed for capable coding agents. It should preserve model creativity and judgment while making its engineering discipline reliably present and verifying objective truth only at consequential boundaries.

> **Free reasoning. Safe action. Evidence-bound claims.**

UX target:

> **Install once. Start coding. Hakim is already there.**

## Why R3.2 exists

The beta.2-beta.4 D01 sequence proved that stronger skill text alone does not guarantee timely host activation or behavioral obedience. R3.2 therefore separates three concerns:

1. **Decision policy** — semantic guidance for the model.
2. **Operational presence** — host-native delivery of that guidance.
3. **Objective truth** — verification of consequences and claims.

R3.2 must improve reliability without turning frontier-class models into workflow bots.

## Reference forensics

Ponytail is an upstream operational reference, not an implementation to copy. Its useful lessons are:

- installation wires presence automatically;
- lifecycle hooks remain thin;
- one behavioral authority feeds multiple host adapters;
- host state lives outside the target repository;
- normal activation is quiet and fail-soft;
- subagent propagation is used where the host exposes a real lifecycle gap;
- mode commands control intensity rather than activating the product.

Hakim keeps its own evidence/truth architecture and does not copy Ponytail runtime code.

## Three-plane model

```text
capable model
creative reasoning
      |
      v
+------------------+
| Decision Policy  |
| soft / semantic  |
+--------+---------+
         |
         v
+---------------------+
| Operational Presence|
| silent / automatic  |
+----------+----------+
           |
           v
+------------------+
| Objective Truth  |
| consequences     |
+------------------+
```

### Decision policy

Authority remains `core/hakim-skill/SKILL.md` plus the capability registry.

The policy guides reuse, stdlib/native preference, smallest sufficient/coherent/safe changes, guard preservation, proportional validation, and bounded claims. It is not a deterministic reasoning workflow.

### Operational presence

Operational presence answers only:

> How does the active host make relevant Hakim context available automatically and quietly?

Required properties:

- automatic after native plugin installation;
- default `full` unless deliberately changed;
- host-native rather than cross-host emulation;
- bounded state outside the target repository;
- no prompt/source/transcript persistence;
- no network service, daemon, MCP dependency, database, or new framework merely for presence;
- fail-soft when optional presence machinery fails.

### Objective truth

Objective truth checks facts such as actual Git state, tests, changed paths, package/setup artifacts, and ownership/manifest facts. It should constrain consequential claims, not creative reasoning.

## Golden-thread rules

### O1 — Automatic

Normal use must not require `Use Hakim`, a bootstrap prompt, or repository setup after plugin installation.

### O2 — Quiet

Successful activation adds no mandatory turn or recurring banner. Visible output is justified for explicit mode/help commands, material host failure, or bounded correction.

### O3 — Host-native

Each host uses its strongest minimal lifecycle mechanism. Semantic parity does not require identical hooks.

### O4 — One authority

Operational adapters derive context from maintained Hakim policy instead of growing independent behavioral copies.

### O5 — Tiny state

Copilot R3.2 stores at most one plugin-data file containing only:

```json
{"schema_version":1,"mode":"off"}
```

or the equivalent non-default `lite`/`ultra` mode. Default `full` is stateless.

Never persist raw prompts, source code, tool arguments, reasoning, credentials, or private evidence.

### O6 — Fail soft

Presence failure must not corrupt the target repository or trap the coding session. Hakim must also avoid claiming a guarantee when the relevant mechanism is unavailable.

### O7 — Intelligence stays free

The model remains free to inspect further for a concrete unresolved question, invent a better solution, reject an unnecessary abstraction, choose validation methods, revise hypotheses, and use dependencies/setup mutation when genuinely required.

### O8 — Intervene on contradiction, not possibility

Prefer objective correction after consequences are observable over speculative blocking before ordinary actions. Do not create broad command denylists merely because a command can mutate files.

## Copilot operating shape

Current R3.2 experimental shape:

```text
native plugin install
       |
       v
sessionStart
  -> read bounded state from COPILOT_PLUGIN_DATA
  -> default full when absent
  -> inject compact maintained Hakim context unless off
       |
       +--------------------------+
       |                          |
       v                          v
normal parent coding          subagentStart
  -> model reasons freely       -> reuse session_start.mjs
                                -> read the same bounded mode
                                -> inject the same maintained context unless off
       |
       v
optional exact mode control
  -> live-proven persistent route: /hakim/hakim <mode>
       |
       v
userPromptSubmitted
  -> inspect only exact bounded mode command
  -> persist only {schema_version, mode}
  -> ordinary prompts unchanged
       |
       v
userPromptTransformed
  -> receives prompt after submitted hooks
  -> inspect the same exact bounded command
  -> rewrite only the current model-facing control turn
  -> no state access and no repository work
```

The topology is split by responsibility rather than treated as an enforcement chain:

- `sessionStart` owns silent parent-session presence;
- `subagentStart` owns continuity only when Copilot creates a subagent;
- `userPromptSubmitted` owns persistent control metadata;
- `userPromptTransformed` owns current-turn mode semantics only.

`subagentStart` does not introduce a second behavioral authority. It executes the same `session_start.mjs` used by the parent session, so parent and subagent presence derive from the same installed Hakim skill and the same persisted mode state.

GitHub's hook contract specifies that `userPromptTransformed.prompt` is the prompt after `userPromptSubmitted` hooks have run. F03f relies on that documented order, not on timing assumptions.

The transformed hook is deliberately stateless. It does not read or write plugin data. The submitted and presence hooks use the host-owned `COPILOT_PLUGIN_DATA` directly; real Copilot CLI 1.0.75 evidence proved that location by creating `~/.copilot/plugin-data/hakim/hakim/mode.json` from the submitted-prompt hook.

No `preToolUse`, `postToolUse`, `agentStop`, or `subagentStop` hook is authorized by the operational-presence work.

## Feasibility evidence

### F01 — Silent auto-presence — PASS

Evidence:

- immutable experimental ref `evidence/r32-f01-copilot-3825b7c`;
- Public CI #580 PASS;
- real Copilot CLI 1.0.75 loaded `sessionStart` from `hakim@hakim`;
- no repository Copilot instructions were required;
- session state contained the Hakim operational-presence marker;
- activation produced no target-repository mutation;
- an ordinary prompt that did not mention Hakim produced bounded Hakim-style decision behavior.

### F02 — Plugin-data mode state — PASS

Evidence:

- immutable experimental ref `evidence/r32-f02-mode-5c558d4`;
- Public CI #581 PASS;
- `off` suppressed Hakim context in a fresh real Copilot session;
- target repository remained unchanged;
- restoring `full` removed the override file;
- a new full session restored Hakim context;
- plugin-data was empty again at default full.

### F03 — Native mode-control UX — PASS END-TO-END

The F03 history is intentionally preserved because each live failure isolated a different host boundary.

1. `evidence/r32-f03-modes-8d8acbb` passed repository CI #583 but failed live because `argument-hint` was encoded as a YAML sequence. Copilot rejected the `hakim` skill and `/hakim` was unknown.
2. Quoting `argument-hint` fixed the loader. A bare `/hakim off` was recognized, but the host-expanded skill payload still reported `full`, and no persistent state appeared.
3. `evidence/r32-f03c-mode-control-67ea974` moved current-turn control to `userPromptTransformed` and passed Public CI #587. Live Copilot then produced `Hakim mode: off` and kept the target repository clean, proving the transformed boundary for current-turn semantics. A complete `COPILOT_HOME` search found no `mode.json`, so persistence still failed.
4. `evidence/r32-f03d-plugin-data-a0994ae` and `evidence/r32-f03e-safe-plugin-data-9f616e3` explored explicit hook-env rebinding of `${COPILOT_PLUGIN_DATA}`. F03e passed Public CI #590 but its live probe regressed to `Hakim mode set to: full` and still produced no state. Its safety guard did prevent repository-local pollution. The explicit rebinding approach is therefore not part of F03f.
5. A control experiment returned to the loader-fixed `userPromptSubmitted` design and used the plugin-qualified `/hakim/hakim off` route. Copilot CLI 1.0.75 wrote exactly `{"schema_version":1,"mode":"off"}` to `/home/habib1001/.copilot/plugin-data/hakim/hakim/mode.json`, while `git status --porcelain=v1 -uall` remained empty. This proved submitted-hook persistence and direct `COPILOT_PLUGIN_DATA` availability. The same turn still asked the user to disambiguate the requested action, so current-turn mode semantics remained a separate failure.
6. `evidence/r32-f03f-split-lifecycle-6022a09` composed only the two behaviors already proven live: submitted-hook persistence from step 5 and transformed-hook current-turn correction from step 3. Public CI #591 passed on runtime SHA `6022a099518dd958d1d5d4f8f75b53b3159b34c3`. A clean Copilot CLI 1.0.75 run then loaded `sessionStart + userPromptSubmitted + userPromptTransformed`, returned `Hakim mode: off`, persisted exact `off` state, and kept the frozen fixture clean.
7. The same runtime passed the bounded lifecycle matrix: `off` persisted, `ultra` persisted, and `full` removed `mode.json` to restore stateless default full.

Current parser scope intentionally excludes colon qualification because Copilot CLI 1.0.75 rejected `/hakim:hakim`. The implementation recognizes bare `/hakim` forms for compatibility, but accepted persistent live evidence uses slash-qualified `/hakim/hakim <mode>`.

Ordinary prompts are neither modified nor persisted.

### F04 — Subagent continuity fit — GAP CONFIRMED / REMEDIATION PENDING LIVE PROOF

A real Copilot CLI 1.0.75 probe established the product need before any new hook was authorized:

- the parent mode was explicitly set to `ultra`;
- the installed Hakim plugin exposed only the accepted F03 hooks (`sessionStart`, `userPromptSubmitted`, `userPromptTransformed`);
- a built-in Explore subagent was asked, without file reads, plugin-state inspection, shell commands, or mode disclosure from the parent, to report its own `HAKIM OPERATIONAL PRESENCE` marker;
- the Explore subagent returned exactly `MODE=NONE`.

This proves that parent operational presence does not propagate sufficiently into that Copilot subagent boundary by default.

The bounded remediation therefore adds exactly one `subagentStart` hook and points it at the existing `session_start.mjs`. No new runtime, prompt copy, behavioral fork, state file, tool interception, or enforcement hook is introduced. Repository regressions prove that persisted `ultra` produces the same maintained context for a synthetic subagent while leaving the target repository untouched.

F04 remains **HOLD_FOR_LIVE_PROOF** until exact-head Public CI succeeds and a real fresh Explore probe returns `MODE=ultra` under persisted ultra mode. If that live proof fails, stop and diagnose the host boundary rather than adding further hooks by symmetry.

### F05 — Objective completion truth

Separately test whether a completion boundary can reconcile objective repository truth with consequential claims without prose linting or correction loops. This is not part of mode control.

### F06 — Deterministic operational regressions

Before release-candidate promotion prove:

- silent default full presence;
- exact mode controls update only bounded plugin data;
- ordinary prompts create no mode state and are not rewritten;
- malformed state/input fails safely;
- subagent continuity exists only through the evidence-justified `subagentStart` presence hook;
- no enforcement hook appears without accepted product need.

### F07 — Production-like D01 rerun

Only after the operational layer is coherent:

- advance prerelease identity;
- freeze exact candidate;
- rerun D01 without explicit Hakim activation;
- compare correctness, working-tree purity, claim truth, behavioral value, and ceremony with beta.2-beta.4.

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

This design does not authorize:

- beta.5 yet;
- merging or marking Draft PRs Ready;
- external evaluator recruitment;
- stable `1.0.0`;
- registry or central marketplace publication;
- a cross-host runtime/service;
- copying Ponytail implementation;
- broad tool blocking merely because a command can mutate files.
