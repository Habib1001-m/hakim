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

Accepted/current R3.2 shape:

```text
native plugin install
       |
       v
sessionStart
  -> read bounded plugin-data mode
  -> default full when absent
  -> inject compact maintained Hakim context unless off
       |
       v
normal coding
  -> model reasons freely
       |
       v
optional /hakim <mode>
       |
       v
userPromptTransformed
  -> inspect only exact Hakim mode-control prompt
  -> persist only bounded mode metadata
  -> replace the host-expanded mode-control turn with one concise
     model-facing directive for the selected mode
  -> ordinary prompts remain unchanged
```

The mode-control hook is not an enforcement engine. It exists because real Copilot CLI evidence showed that a native skill invocation could load successfully while its mode argument was lost in the host-expanded model-facing payload. `userPromptTransformed` is the host boundary designed to observe the raw submitted prompt together with the transformed prompt just before model delivery.

The accepted hook topology remains two hooks:

- `sessionStart`
- `userPromptTransformed`

No `preToolUse`, `postToolUse`, or `agentStop` hook is authorized by the operational-presence work.

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

### F03 — Native mode-control UX — REMEDIATION IN PROGRESS

First frozen F03 ref:

- `evidence/r32-f03-modes-8d8acbb`
- Public CI #583 PASS repository-side.

First live probe failed because Copilot rejected the `hakim` skill: `argument-hint` had been encoded as a YAML sequence rather than the required string. The ref remains immutable evidence of that loader failure.

Loader remediation changed it to:

```yaml
argument-hint: "[lite|full|ultra|off]"
```

The next live probe proved the loader fix: `hakim` appeared as a Plugin skill and `/hakim off` was recognized. It exposed a second host-boundary defect: the model-facing expanded skill payload reported `full` and no mode state was written. The submitted mode argument therefore was not reliably carried through the pre-transform control design.

Current remediation replaces the old `userPromptSubmitted` tracker with `userPromptTransformed` mode control. Exact supported command shapes are bounded to:

- `/hakim`
- `/hakim lite|full|ultra|off`
- `/hakim/hakim lite|full|ultra|off`
- `/hakim:hakim lite|full|ultra|off`

Ordinary prompts are neither modified nor persisted.

### F04 — Subagent continuity fit

Add subagent lifecycle handling only if a real probe proves a propagation gap. Do not add it for symmetry.

### F05 — Objective completion truth

Separately test whether a completion boundary can reconcile objective repository truth with consequential claims without prose linting or correction loops. This is not part of mode control.

### F06 — Deterministic operational regressions

Before release-candidate promotion prove:

- silent default full presence;
- exact mode controls update only bounded plugin data;
- ordinary prompts create no mode state and are not rewritten;
- malformed state/input fails safely;
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
