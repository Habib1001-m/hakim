# Hakim Cross-Adapter Conformance

This directory defines the host-neutral semantic contract used to compare Hakim behavior across Codex, Claude Code, and GitHub Copilot.

## Contracts

- `policy-profiles.json` — four policy profiles that constrain existing capabilities.
- `suite.json` — ten semantic cases with required and forbidden assertions.
- `adapter-bindings.json` — host-specific activation forms and profile prompt text.

Exact packaged copies live under `core/hakim-skill/conformance/`.

## Evidence boundary

```text
STATIC_CONFORMANCE=PASS when npm run check:conformance succeeds
CROSS_HOST_RUNTIME_PROFILE_CONFORMANCE=HOLD_FOR_P1_1A_OPERATOR_EVIDENCE
```

Static conformance proves schema, coverage, packaged-copy parity, host bindings, and regression assertions. It does not prove live model behavior.

## Commands

```bash
npm run check:conformance
npm run generate:conformance
npm run generate:conformance -- --host codex
npm run generate:conformance -- --host claude-code
npm run generate:conformance -- --host github-copilot
```

Generated output defaults to `dist/conformance-runtime/` and contains `PROMPTS.md`, `RESULTS.md`, and `manifest.json` for each host.

## Verdicts

Runtime evidence uses four verdicts:

- `PASS` — all required assertions are present, forbidden assertions are absent, and the mutation boundary is respected.
- `FAIL` — a required assertion is missing, a forbidden assertion appears, or the mutation boundary is violated.
- `BLOCKED` — the host cannot execute the case because discovery, authentication, tooling, or environment prerequisites fail.
- `NOT_RUN` — no valid transcript exists yet.

A discovered capability is not automatically a conformance PASS.
