# Upstream Relationship and Synchronization Policy

## Decision

```text
UPSTREAM_PROJECT=Ponytail
RELATIONSHIP=GOVERNANCE_FOCUSED_DERIVATIVE
GIT_FORK=NO
OFFICIAL_UPSTREAM_AFFILIATION=NO
AUTOMATIC_COMPATIBILITY=NO
AUTOMATIC_SYNC=NO
UPSTREAM_BENCHMARK_TRANSFER=NO
```

Hakim is an independently maintained project derived in part from Ponytail's
published minimalist coding methodology. It is not a GitHub fork, an official
Ponytail distribution, a compatibility layer, or an endorsed successor.

The authoritative machine-readable record is `upstream/ponytail.json`.

## What Hakim inherits

Hakim acknowledges Ponytail as the source of these core concepts:

- the seven-level smallest-safe-change decision ladder;
- reuse-first and YAGNI enforcement;
- the `lite`, `full`, and `ultra` intensity model;
- the principle that minimalism must not remove safety, validation, security,
  accessibility, or data-integrity protections.

The current implementation may express these ideas differently and adds its own
runtime, evidence, and governance machinery.

## What does not transfer

The following Ponytail properties are not Hakim evidence and must not be copied
into Hakim claims:

- benchmark results, percentages, cost, speed, safety, or ROI claims;
- release, package, marketplace, or adapter availability;
- installation, update, uninstall, MCP, or workflow behavior;
- compatibility with Ponytail configuration, state, hooks, or commands;
- stars, users, community adoption, endorsements, trademarks, or branding.

A Ponytail PASS does not imply a Hakim PASS. A similar command name does not
establish implementation parity.

## Current Hakim differentiation

Hakim's implemented differentiation is governance and conformance, not broader
agent coverage or proven performance superiority:

1. **Evidence-bound status:** runtime, benchmark, release, and support claims use
   explicit PASS/HOLD boundaries.
2. **Cross-host conformance:** a machine-readable six-capability contract is
   checked across Codex, Claude Code, and GitHub Copilot repository instructions.
3. **Provenance controls:** live debt, synthetic examples, archives, and accepted
   runtime evidence are separated.
4. **Product-truth gates:** versions, metadata, projections, and active claims are
   checked in CI.
5. **Safe diagnostics:** local runtime inspection is read-only and requires
   operator evidence before acceptance.

This is a product-direction declaration, not a claim that these properties are
unique in the market or superior to Ponytail.

## Manual upstream review policy

Hakim does not continuously merge or automatically track Ponytail.

Run an upstream review:

- before changing an inherited methodology surface;
- before public release or marketplace planning;
- when Ponytail changes its license or attribution requirements;
- when a relevant upstream security or correctness fix is identified.

Each candidate must be classified as `adopt`, `adapt`, `reject`, or `defer` and
must record:

- the upstream release or commit;
- the affected Hakim surface;
- license and attribution impact;
- behavioral rationale;
- tests and projection impact;
- the final decision.

Direct cherry-picking without this review is prohibited by policy.

## Reviewed upstream snapshot

The P0.4 review recorded Ponytail release `v4.8.4`, commit `bc9ee94`, released
2026-06-29, under the MIT License. This is a review snapshot, not a promise to
remain synchronized with that release.

## Release boundary

This declaration does not establish:

- independent Hakim benchmark evidence;
- Ponytail compatibility;
- public release or marketplace readiness;
- enterprise, MCP, or A2A readiness;
- permission to use Ponytail branding as Hakim branding.
