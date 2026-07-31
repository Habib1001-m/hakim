# Hakim Operational Presence

**Status:** accepted R3.2 development architecture through F04 on moving identity `1.0.0-beta.4.post1`; the current late-bound objective-truth slice is active in design-validation and is not yet accepted. This is unreleased development, not a frozen candidate, and does not create release authorization.

Hakim is designed for capable coding agents. It should preserve model creativity and judgment while making its engineering discipline reliably present and checking objective truth only at consequential boundaries.

> **Free reasoning. Safe action. Evidence-bound claims.**

UX target:

> **Install once. Start coding. Hakim is already there.**

## Distribution identity boundary

Operational presence and distribution identity are separate concerns.

- Frozen beta.4 is `1.0.0-beta.4` at exact source `5d00039479f2f11b7fe30ccf2385e70ce24553c3`.
- Moving development reports `1.0.0-beta.4.post1` and channel `unreleased-development`.
- Moving development is not a frozen candidate and is not eligible for release, promotion, benchmark, external-evaluator, or candidate-specific acceptance evidence.
- `conformance/distribution-identity.json` is the machine-readable mapping authority.
- P0 — Truthful Immutable Distribution Identity is closed after four-host proof, exact-head Public CI #687, PR #48 merge, issue #47 closure, and post-merge reconciliation PR #49 / Public CI #690.

Operational evidence remains bounded to its exact source commit. A working lifecycle on moving development cannot be relabeled as frozen beta.4 or future beta.5 evidence.

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

Never persist raw prompts, source code, tool arguments, reasoning, credentials, private evidence, or transcript content as Hakim state.

### Fail soft

Presence or objective-truth hook failure must not corrupt the target repository or trap the coding session. Hakim must also avoid claiming guarantees when the relevant mechanism or authority is unavailable.

### Intervene on contradiction, not possibility

Do not create broad command denylists merely because commands can mutate files. Prefer one bounded correction when an observable final-state fact contradicts a consequential structured completion claim.

## Accepted Copilot topology through F04

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

F01–F04 did not authorize `preToolUse`, `postToolUse`, `agentStop`, or `subagentStop`. The transformed hook is deliberately stateless. Presence and submitted-mode persistence use host-owned `COPILOT_PLUGIN_DATA` directly; accepted Copilot CLI 1.0.75 evidence proved that path without repository-local state.

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

Public CI passed on the exact accepted F03 and F04 runtime heads before those live probes were promoted. Those refs remain development evidence and do not inherit frozen-candidate status.

Historical failed probes remain visible in GitHub issue/PR history and immutable evidence refs. They are not copied into this architecture authority line-by-line because the maintained document describes the accepted design and evidence boundaries rather than reproducing debugging transcripts.

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

The same evidence rule applies to later hooks: no lifecycle hook is accepted merely for symmetry.

## Completed prerequisite — P0 Truthful Immutable Distribution Identity

P0 is complete and closed. It reconciled which bytes normal frozen install transports deliver and what identity those bytes report before F05 began.

Final P0 boundary:

```text
HOST_PROOF      = 4/4
FINAL_HEAD_CI   = PUBLIC_CI_687_PASS
PR_48           = MERGED
ISSUE_47        = CLOSED_COMPLETED
POST_MERGE_CI   = PUBLIC_CI_690_PASS
PR_49           = MERGED
P0              = PASS
```

P0 added no runtime hook and made no new behavioral-effectiveness claim.

## Active gate — F05 Objective Completion Truth

F05 is separate from operational presence, mode control, and distribution identity.

The question remains narrow:

> Can Hakim reconcile consequential completion claims with objective repository/setup truth at a late boundary without becoming a prose linter, command blocker, or reasoning workflow?

The active F05 design hypothesis uses exactly one Copilot `agentStop` command hook as a **one-shot objective contradiction check**. This hook is development-only and remains unaccepted until deterministic gates and a bounded live Copilot probe pass.

```text
agentStop
  -> read host-provided cwd + transcriptPath ephemerally
  -> inspect only the last assistant completion
  -> parse existing structured final checkpoints
       FINAL_GIT_STATUS
       SETUP_ARTIFACTS
       UNRELATED_MUTATIONS
  -> observe git status --porcelain directly
  -> allow when no objective contradiction is established
  -> block once when a supported structured claim contradicts observable state
  -> if stop_hook_active=true, allow termination; never create a correction loop
```

F05 v1 does **not** use general prose interpretation. It reuses the structured completion checkpoints already required by the canonical Hakim policy.

Supported blocking authorities in v1 are deliberately narrower than the parsed checkpoint set:

- `FINAL_GIT_STATUS` may be contradicted when it explicitly claims a clean tree while current `git status --porcelain` is non-empty.
- `SETUP_ARTIFACTS=NONE` may be contradicted when current changed/untracked paths contain narrowly classified setup artifacts such as `.venv`, `venv`, `*.egg-info`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, `__pycache__`, or `.pyc`.
- `UNRELATED_MUTATIONS` is parsed but does **not** independently authorize blocking in v1 because whether a mutation is “unrelated” is a semantic task judgment, not a fact established by Git status alone.
- Files such as `uv.lock` are not generically classified as setup artifacts because they can be intentional product files.

F05 preserves these constraints:

- no `preToolUse` or `postToolUse` enforcement;
- no broad shell/tool denylist;
- no command-string inference of correctness;
- no mandatory tool-by-tool ceremony;
- no new completion schema solely for the hook;
- no raw prompt/source/transcript persistence;
- no unbounded correction loop;
- no second policy engine in hooks;
- no ordinary final-prose rewriting;
- no block merely because a repository is dirty when the structured completion does not claim it is clean;
- fail soft when transcript, Git, or runtime truth is unavailable.

Task boundary authority: `docs/F05_START_AND_TASK_BOUNDARY.md`. Active workstream: issue #41. Active branch: `f05-objective-completion-truth`.

## Remaining R3.2 gates

### F05 — Objective Completion Truth — active / not accepted

Required before acceptance:

1. deterministic decision/parser/repository-state fixtures;
2. existing F01–F04 operational regressions remain green;
3. canonical repository gate plus Node 22/26 compatibility on the exact F05 head;
4. bounded live Copilot probe proving true-positive, no-claim pass-through, truthful-clean pass-through, strict one-shot correction, and target-repository non-mutation;
5. explicit operator acceptance.

### F06 — Deterministic operational regressions

After F05 is accepted, freeze the combined operational contracts before candidate promotion.

### F07 — Production-like D01 rerun

Only after F05/F06 are coherent:

1. advance to a new candidate identity distinct from beta.4 and the development identity;
2. freeze the exact candidate source;
3. rerun the original production-like D01 task without explicit Hakim activation;
4. compare correctness, repository purity, claim truth, behavioral value, and ceremony with beta.2–beta.4.

## Acceptance bar

R3.2 succeeds only if Hakim becomes **more reliable and less visible at the same time**.

```text
install exact Hakim candidate
    -> open coding agent
        -> code normally
            -> Hakim is already present
                -> model keeps its freedom
                    -> objective contradictions are harder to ship
```

## Explicit exclusions

R3.2 through accepted F04 plus active F05 does not authorize:

- beta.5 or any other new frozen prerelease identity;
- external evaluator recruitment;
- stable `1.0.0`;
- npm registry or central marketplace publication;
- a cross-host runtime/service;
- copying Ponytail runtime code;
- broad tool blocking merely because a command can mutate files;
- treating F05 repository CI as live-host acceptance or operator acceptance.
