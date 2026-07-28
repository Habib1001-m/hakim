# Hakim Operational Presence Architecture

**Status:** R3.2 design/feasibility authority. This document does not claim that every described host mechanism is implemented or accepted yet.

Hakim is designed for capable coding agents. Its job is not to replace their reasoning with a workflow engine. The product should preserve model creativity and judgment while making Hakim reliably present, then verify objective engineering truth only at consequential boundaries.

The operating principle is:

> **Free reasoning. Safe action. Evidence-bound claims.**

And the UX target is:

> **Install once. Start coding. Hakim is already there.**

## Why this document exists

The beta.2 through beta.4 D01 dogfood sequence established an important boundary:

- stronger skill text can improve behavior, but it does not reliably make an installed host load or obey Hakim at the right time;
- observable checkpoint wording does not itself create operational presence;
- correctness and behavioral governance are separate dimensions;
- adding more visible ceremony would work against the intended production environment, where frontier-class models are expected to retain broad reasoning freedom.

R3.2 therefore treats **presence** as a host-runtime concern and **reasoning** as a model concern.

## Reference forensics: what Ponytail gets right operationally

Ponytail is an upstream methodology reference, not an implementation to copy. The current public repository nevertheless provides a useful operational pattern:

1. **Installation wires lifecycle presence automatically.** Its Copilot plugin manifest points directly at a hook configuration. The user does not have to invoke the main skill to make the rules available at session start.
2. **Hooks stay thin.** The Copilot hook map uses session start for activation and user-prompt submission for mode tracking. Claude/Codex add subagent propagation; OpenCode uses a native system-prompt transform on each turn.
3. **One instruction builder feeds multiple hosts.** Host adapters do not independently reinvent the behavioral rules.
4. **Mode state lives outside the target repository.** Copilot uses its plugin-data directory; other hosts use their own appropriate state locations.
5. **Failure is deliberately quiet.** Missing/invalid state and hook-output failures are generally treated as best-effort activation problems rather than reasons to break an unrelated coding session.
6. **Subagents inherit presence where the host exposes that lifecycle.** The parent agent is not assumed to be the only reasoning process.
7. **Mode commands control intensity; they are not the activation prerequisite.** Default mode is active without configuration.

Useful upstream references:

- `DietrichGebert/ponytail:hooks/copilot-hooks.json`
- `DietrichGebert/ponytail:hooks/claude-codex-hooks.json`
- `DietrichGebert/ponytail:hooks/ponytail-activate.js`
- the current Ponytail mode-tracking hook
- `DietrichGebert/ponytail:hooks/ponytail-subagent.js`
- `DietrichGebert/ponytail:hooks/ponytail-runtime.js`
- `DietrichGebert/ponytail:hooks/ponytail-instructions.js`
- `DietrichGebert/ponytail:.opencode/plugins/ponytail.mjs`
- `DietrichGebert/ponytail:docs/agent-portability.md`

These files are studied for architecture and UX philosophy. Hakim must not copy their implementation or collapse its distinct evidence/truth model into Ponytail behavior.

## Three-plane model

Hakim should separate three concerns that earlier remediation work mixed too closely.

```text
                     capable coding model
                creative reasoning and judgment
                            |
                            v
                 +---------------------+
                 |  Decision Policy    |
                 |  SOFT / semantic    |
                 +----------+----------+
                            |
                  host-native presence
                            |
                            v
                 +---------------------+
                 | Operational Presence|
                 | silent / automatic  |
                 +----------+----------+
                            |
                     real consequences
                            |
                            v
                 +---------------------+
                 | Objective Truth     |
                 | verify consequences |
                 +---------------------+
```

### 1. Decision Policy

Authority remains `core/hakim-skill/SKILL.md` and the capability registry.

This plane guides the model toward deliberate inspection, reuse, stdlib/native capabilities, the smallest sufficient/coherent/safe change, guard preservation, proportional validation, and evidence-bounded claims.

It is intentionally **not** a deterministic workflow language. Hakim does not prescribe a fixed file-read order, a fixed chain of reasoning, or a mandatory implementation recipe.

### 2. Operational Presence

This plane answers only:

> How does the active host make the relevant Hakim decision context reliably available without asking the user to prepare the session manually?

Properties:

- automatic after native plugin installation;
- default `full` unless the user deliberately selects another supported mode;
- host-native rather than cross-host emulation;
- minimal state outside the target repository;
- silent by default;
- fail-soft for presence failures that are not themselves safety violations;
- subagent propagation when the host supports it cleanly;
- no prompt/source/transcript persistence;
- no network service, daemon, MCP dependency, database, or new framework merely to keep Hakim present.

### 3. Objective Truth

This plane does not decide how the model should solve the task. It checks objective consequences when a claim or irreversible action makes that useful.

Examples of legitimate objective truth:

- actual Git status/diff;
- actual test/build exit status;
- actual package/setup artifacts;
- manifest/ownership facts;
- actual changed paths;
- whether an observed claim contradicts the repository state.

The preferred intervention model is **verify consequences, not police thought**.

## Core non-goal: no hook-based reasoning engine

R3.2 must not create a second pseudo-agent inside lifecycle hooks.

In particular, the operational-presence layer must not:

- maintain a broad shell-command denylist;
- reject `pip`, `npm`, `uv`, or other tools merely by name;
- infer architectural correctness from command strings;
- force a fixed baseline command across repositories;
- require checkpoint prose before ordinary reasoning can continue;
- log prompts or source code to reconstruct model intent;
- turn every tool call into a Hakim approval ceremony.

A command such as an editable install may be correct in one task and unnecessary in another. The frontier model should retain the judgment. Hakim should intervene only where host-native context can improve that judgment or where objective state contradicts a consequential claim.

## Golden-thread design rules

### O1 — Presence is automatic

Normal product use must not require the user to say `Use Hakim`, invoke `/hakim`, run a bootstrap prompt, or prepare a repository-specific instructions file after installing the native plugin.

Mode commands remain useful controls, not prerequisites.

### O2 — Presence is quiet

A successful activation should add no mandatory conversational turn and no recurring banner. Visible output is justified only for an explicit mode/help command, a material host failure, or a bounded corrective intervention.

### O3 — Presence follows the host

Each host uses its strongest minimal native lifecycle:

- session/startup context where available;
- per-turn system transform where that is the native extension point;
- subagent-start context where the host exposes it;
- host plugin data/state instead of repository artifacts.

Semantic parity does not require identical hook names or identical state mechanisms.

### O4 — One behavioral authority

Operational adapters must derive their context from maintained Hakim authority rather than grow independent prompt copies. A compact operational kernel may be generated/projected from canonical policy, but drift must be tested.

### O5 — State is tiny and non-sensitive

Permitted runtime state is limited to control metadata. Copilot R3.2 uses at most one plugin-data file containing exactly a schema version and selected non-default mode; default `full` remains stateless.

Do not persist:

- raw prompts;
- source code;
- tool arguments containing user data;
- model reasoning/transcripts;
- credentials;
- private evidence.

### O6 — Failure degrades gracefully

If optional presence machinery cannot run, it should not corrupt the target repository or trap the user in a broken session. Failure must be observable enough to diagnose, but normal operation should remain quiet.

A failure that would make Hakim silently claim an enforcement guarantee it no longer provides must instead downgrade that claim.

### O7 — Intelligence stays free

Hakim constrains engineering truth and consequential boundaries, not creativity.

The model remains free to:

- inspect more when a concrete unresolved question justifies it;
- invent a better solution than Hakim anticipated;
- reject an unnecessary requested abstraction;
- choose among equivalent validation methods;
- change its hypothesis during investigation;
- use dependencies or setup mutation when the task genuinely requires them.

### O8 — Intervene on contradiction, not possibility

Prefer a late objective correction over speculative early blocking when both preserve safety.

Example:

- do not deny every editable install;
- if setup artifacts remain at completion, make that state visible to the model and prevent a contradictory `no artifacts` claim from passing silently.

Hard pre-action blocking remains appropriate for narrow objective hazards such as destructive mutation of unowned/protected state when the host exposes a reliable check.

## Copilot R3.2 accepted operating shape so far

```text
native plugin install
       |
       v
sessionStart
  -> read bounded plugin-data mode (default full when absent)
  -> inject compact maintained Hakim operational context unless mode=off
       |
       v
normal coding prompt
  -> model reasons freely
       |
       v
optional /hakim <mode>
  -> native Hakim skill tells the model the selected mode for the current conversation
  -> userPromptSubmitted hook persists only that selected mode for later sessions
  -> no tool/repository work merely to change mode
```

The mode-tracking hook is not an enforcement hook. Copilot CLI does not process output from `userPromptSubmitted`; the user-visible skill invocation itself carries the current-session intent, while the hook only preserves minimal control state for future sessions.

## R3.2 feasibility sequence

### F01 — Silent auto-presence proof — PASS

Accepted evidence:

- exact experimental ref `evidence/r32-f01-copilot-3825b7c`;
- Public CI #580 PASS on the clean exact head;
- real Copilot CLI 1.0.75 loaded `sessionStart: 1 hook (sources: hakim@hakim)`;
- no repository Copilot instructions or custom instructions were loaded;
- session-state contained the Hakim operational-presence marker;
- activation produced no target-repository mutation;
- an ordinary prompt that did not mention Hakim produced a bounded no-change decision with remaining uncertainty.

### F02 — Plugin-data mode state proof — PASS

Accepted evidence:

- exact experimental ref `evidence/r32-f02-mode-5c558d4`;
- Public CI #581 PASS;
- `off` persisted only bounded plugin-data metadata and suppressed the Hakim session context in a fresh real Copilot session;
- target repository remained unchanged;
- restoring `full` removed the override file;
- a fresh full session restored the Hakim context;
- plugin-data contained no residual file after returning to default full.

The live A/B result showed a behavioral distinction as well: the off session gave a generic bounded read-only answer, while the full session explicitly used bounded `NO_CHANGE`, the Decision Ladder, and remaining uncertainty without being told to invoke Hakim.

### F03 — Native mode-control UX — LIVE FIX IN PROGRESS

Use Copilot's native skill invocation surface rather than inventing a separate command language:

- `/hakim` means `full`;
- `/hakim lite`;
- `/hakim full`;
- `/hakim ultra`;
- `/hakim off`;
- plugin-qualified `/hakim/hakim <mode>` is accepted when skill-name precedence requires it.

The `userPromptSubmitted` hook may parse only these exact Hakim control invocations. Ordinary prompts remain untouched and unpersisted. The hook stores only `{schema_version, mode}` and emits no reasoning context.

Current-session behavior comes from the native skill invocation itself; plugin-data persistence controls later session starts. This avoids trying to remove already-injected `sessionStart` context mid-session through unsupported hook behavior.

Repository-side F03 originally passed Public CI #583 at `8d8acbb3abe8693d0924b40af8ba8d5a46317098`, but the first real Copilot CLI 1.0.75 mode-command probe exposed a host-loader defect before any state mutation: the native Hakim skill failed to load and `/hakim` was therefore unknown. Root cause was an invalid frontmatter type for Copilot: `argument-hint` was written as a YAML flow sequence instead of the required string. The frozen F03 ref remains immutable evidence of this live failure. The branch fix quotes the argument hint as `"[lite|full|ultra|off]"` and adds a regression that enforces the Copilot-compatible string representation before any F03 live rerun.

### F04 — Subagent continuity fit

Use a subagent lifecycle hook only if a real Copilot probe demonstrates that main-session context does not propagate sufficiently. Do not add it for symmetry.

### F05 — Objective completion-truth spike

Separately test whether a completion-boundary hook can compare objective repository state with consequential claims without acting as a prose linter or forcing repeated correction loops.

This is not part of the operational-presence/mode-control layer.

### F06 — Deterministic operational regressions

Before release-candidate promotion, prove:

- normal install starts with silent default full presence;
- exact mode commands update only bounded plugin data;
- ordinary prompts create no mode state;
- malformed hook input/state fails safely;
- no enforcement hook is introduced without an accepted product need;
- architecture remains smaller and less visible than the failure it fixes.

### F07 — Production-like D01 rerun

Only after the preceding slices produce a coherent minimal design:

- advance the prerelease identity;
- freeze the exact candidate;
- rerun the original D01 task without telling the agent to activate Hakim;
- compare behavior, correctness, working-tree purity, claim truth, friction, and visible ceremony with beta.2/beta.3/beta.4 evidence.

## Acceptance bar for the architecture itself

R3.2 is a success only if Hakim becomes **more reliable and less visible at the same time**.

A technically effective design is rejected if it materially turns the coding session into a policy workflow for competent models.

The target user experience is:

```text
install Hakim
    -> open the coding agent
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
- a cross-host runtime or service;
- copying Ponytail implementation;
- broad tool blocking merely because a command can mutate files.
