# Hakim Cross-Adapter Conformance

This directory contains Hakim's semantic conformance contracts. The runtime-profile suite in `suite.json` currently compares Codex, Claude Code, and GitHub Copilot CLI. Hakim's maintained product support set has four hosts; OpenCode remains a supported product surface but is not included in this specific runtime-profile suite host list.

## Contracts

- `policy-profiles.json` — four policy profiles that constrain existing capabilities.
- `suite.json` — ten semantic cases with required and forbidden assertions, scoped to the hosts listed in that file.
- `adapter-bindings.json` — host-specific activation forms and profile prompt text, including maintained OpenCode bindings used by broader conformance tooling.

Exact packaged copies live under `core/hakim-skill/conformance/`.

## Evidence boundary

```text
STATIC_CONFORMANCE=PASS when npm run check:conformance succeeds
RUNTIME_PROFILE_SUITE_HOSTS=codex,claude-code,github-copilot
CURRENT_LIVE_RUNTIME_PROFILE_VERDICT=NOT_CLAIMED_BY_THIS_DOCUMENT
```

Static conformance proves schema, coverage, packaged-copy parity, host bindings, and regression assertions. It does not prove live model behavior or four-host runtime-profile equivalence.

## Command

```bash
npm run check:conformance
```

The repository contains source-level conformance fixture/evidence utilities, but they are not exposed through a maintained `npm run generate:conformance` script. Do not infer an npm command from the presence of those source files.

## Verdicts

Runtime evidence uses four verdicts:

- `PASS` — all required assertions are present, forbidden assertions are absent, and the mutation boundary is respected.
- `FAIL` — a required assertion is missing, a forbidden assertion appears, or the mutation boundary is violated.
- `BLOCKED` — the host cannot execute the case because discovery, authentication, tooling, or environment prerequisites fail.
- `NOT_RUN` — no valid transcript exists yet.

A discovered capability is not automatically a conformance PASS.
