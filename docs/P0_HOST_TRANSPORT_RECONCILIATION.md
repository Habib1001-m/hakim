# P0 Host-Native Transport Reconciliation

**Status:** `PASS`  
**Authority:** issue #47 and Draft PR #48  
**Frozen candidate:** `1.0.0-beta.4`  
**Expected source SHA:** `5d00039479f2f11b7fe30ccf2385e70ce24553c3`

## Purpose

P0 separates moving unreleased development from the frozen beta.4 candidate and proves what every maintained host actually resolves and runs. A command containing a SHA is only a declaration until a disposable real-host journey establishes the effective source, installed version/bytes, activation, and invocation.

## Current decision

```text
IDENTITY_MODEL              = PASS
METADATA_RECONCILIATION     = PASS
CODEX_TRANSPORT_PROOF       = PASS / OPERATOR_ACCEPTED
CLAUDE_TRANSPORT_PROOF      = PASS / OPERATOR_ACCEPTED
COPILOT_TRANSPORT_PROOF     = PASS / OPERATOR_ACCEPTED
OPENCODE_TRANSPORT_PROOF    = PASS / OPERATOR_ACCEPTED
HOST_RESOLUTION_PROOF       = COMPLETE_4_OF_4
P0_OVERALL                  = HOLD_FOR_FINAL_EXACT_HEAD_CI
```

All four frozen-beta.4 transport packets are now operator accepted. This closes the host-resolution proof slice only. PR #48 remains Draft until the exact final PR head passes Public CI; issue #47 remains open and F05 remains blocked until that final gate is accepted.

No beta.5 candidate, release, promotion, external evaluator campaign, npm publication, central marketplace publication, or F05 implementation is authorized by this document.

## Host contract matrix

| Host | Effective frozen route | Static pin layer | Current proof |
|---|---|---|---|
| Codex | `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3` | marketplace checkout `--ref` | `PASS`, operator accepted, packet integrity-bound |
| Claude Code | `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim` | `.claude-plugin/marketplace.json` plugin source `{source: git-subdir, path: plugins/claude-code, sha: 5d000...}` | `PASS`, operator accepted, packet integrity-bound |
| GitHub Copilot CLI | `copilot plugin marketplace add Habib1001-m/hakim` then `copilot plugin install hakim@hakim` | `.github/plugin/marketplace.json` plugin source `{source: github, repo: Habib1001-m/hakim, path: plugins/copilot, sha: 5d000...}` | `PASS`, operator accepted, packet integrity-bound |
| OpenCode | `npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install` | npm Git package spec | `PASS`, operator accepted, packet integrity-bound |

## Accepted Codex checkpoint

```text
HOST                       = codex
HOST_VERSION               = codex-cli 0.145.0
RESOLVED_SOURCE_SHA        = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
INSTALLED_PRODUCT_VERSION  = 1.0.0-beta.4
INSTALLATION               = PASS
ACTIVATION                 = PASS
INVOCATION                 = PASS
PACKET_SHA256              = fb7cf6909fea2c901d8b940519f248539ec7b8d67cfe8ae13a1d6f9812d09cb3
PACKET                     = conformance/history/p0-host-transport/codex-1.0.0-beta.4.json
EVIDENCE                   = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5136341471
```

This acceptance is bounded to Codex `0.145.0` and does not transfer to another host.

## Claude failed route, repaired contract, and accepted rerun

A disposable Claude Code `2.1.220` journey first attempted:

```text
claude plugin marketplace add https://github.com/Habib1001-m/hakim.git#5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

The host treated the suffix as a clone branch selector and Git failed because no branch named with that commit exists.

```text
ATTEMPT_STATUS = FAIL
FAILURE_CLASS  = MARKETPLACE_SOURCE_SHA_TREATED_AS_BRANCH
EVIDENCE       = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5136565274
```

The failed declaration remains preserved. The accepted design separates catalog discovery from immutable plugin resolution: the Hakim catalog entry uses `git-subdir`, `path: plugins/claude-code`, and the exact beta.4 `sha`.

```text
HOST                       = claude-code
HOST_VERSION               = 2.1.220 (Claude Code)
RESOLVED_SOURCE_SHA        = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
INSTALLED_PRODUCT_VERSION  = 1.0.0-beta.4
SOURCE_PRODUCT_FILES       = 22
MISSING_FILES              = 0
BYTE_MISMATCHES            = 0
UNEXPECTED_PRODUCT_FILES   = 0
INSTALLATION               = PASS
ACTIVATION                 = PASS
INVOCATION                 = PASS
PACKET_SHA256              = 107a56c43f24c838b1a3e120a881bedea9618bb3636aeafecb4e54cdf63992e4
PACKET                     = conformance/history/p0-host-transport/claude-code-1.0.0-beta.4.json
EVIDENCE                   = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5137151921
```

## Copilot failed route, repaired source contract, and accepted rerun

A disposable Copilot CLI `1.0.71` journey first attempted:

```text
copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Copilot passed the suffix to Git as a branch selector. The failure remains preserved as:

```text
ATTEMPT_STATUS = FAIL
FAILURE_CLASS  = MARKETPLACE_REF_SHA_TREATED_AS_BRANCH
EVIDENCE       = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5142063851
```

The repaired design uses catalog discovery plus an immutable `source: github` plugin source with repository `Habib1001-m/hakim`, `path: plugins/copilot`, and exact beta.4 `sha`. The pre-merge branch was used only for catalog discovery; the installed plugin independently resolved the frozen source.

```text
HOST                       = github-copilot
HOST_VERSION               = GitHub Copilot CLI 1.0.71.
REQUESTED_SOURCE           = copilot plugin marketplace add Habib1001-m/hakim#p0-truthful-immutable-distribution-identity
RESOLVED_SOURCE_SHA        = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
INSTALLED_PRODUCT_VERSION  = 1.0.0-beta.4
SOURCE_PRODUCT_FILES       = 13
INSTALLED_PRODUCT_FILES    = 13
BYTE_MISMATCHES            = 0
SOURCE_TREE_SHA256         = b1d210d97a4d1f5b119667bedf13007cbb0560a6bb1f28bcd3e232ee708d14e2
INSTALLED_TREE_SHA256      = b1d210d97a4d1f5b119667bedf13007cbb0560a6bb1f28bcd3e232ee708d14e2
INSTALLATION               = PASS
ACTIVATION                 = PASS
INVOCATION                 = PASS
RUNTIME_TARGET_MUTATION    = NONE
PACKET_SHA256              = 60d7121c671e7f279a7435f07b5028827fe9113249dab09ec661f31f0c9809a6
PACKET                     = conformance/history/p0-host-transport/github-copilot-1.0.0-beta.4.json
EVIDENCE                   = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5142910571
```

## OpenCode exact-SHA acceptance

The normal OpenCode route pins the frozen candidate directly in the npm Git package spec. On system npm `10.9.8`, the exact-Git transport reproduced `GitFetcher requires an Arborist constructor to pack a tarball`. That environment/tooling blocker was preserved and did not count as a Hakim/OpenCode failure. The acceptance journey kept the same Git source and used isolated npm 11 tooling without replacing system npm.

The clean target dry-run reported `READY_TO_CREATE` with nine managed product files and no filesystem change. The actual managed install created the project-local bundle without editing `opencode.json`. Post-install and post-runtime status both returned `EXACT_MATCH` with all nine managed files exact and zero different/unsafe files. The persisted install manifest reported beta.4. Frozen-to-installed product-byte parity was `9/9` with zero mismatch.

OpenCode `1.18.5` then executed the project-local `hakim` command, reported `Hakim mode set to full`, invoked `hakim-help` through the native skill tool, and returned the frozen quick reference. OpenCode bootstrap created host-owned `.opencode/.gitignore` and dependency state; bounded Hakim-owned purity remained unchanged and the managed authority still returned `EXACT_MATCH` after runtime.

```text
HOST                       = opencode
HOST_VERSION               = 1.18.5
REQUESTED_SOURCE           = npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install
RESOLVED_SOURCE_SHA        = 5d00039479f2f11b7fe30ccf2385e70ce24553c3
INSTALLED_PRODUCT_VERSION  = 1.0.0-beta.4
MANAGED_PRODUCT_FILES      = 9
BYTE_MISMATCHES            = 0
POST_RUNTIME_STATE         = EXACT_MATCH
INSTALLATION               = PASS
ACTIVATION                 = PASS
INVOCATION                 = PASS
PACKET_SHA256              = 899e1d6cf15b4c94710438a0585fd7635fa9568d9d8622df2e90cff1347b7304
PACKET                     = conformance/history/p0-host-transport/opencode-1.0.0-beta.4.json
EVIDENCE                   = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5143738204
```

This acceptance is bounded to OpenCode `1.18.5`, the recorded WSL/Linux environment, the exact frozen source, and the observed managed lifecycle/runtime path. It does not transfer to moving development, another OpenCode version, or later candidates.

## Disposable journey requirements

Every host packet must include:

```text
HOST
HOST_VERSION
REQUESTED_SOURCE
EXPECTED_SOURCE_SHA
RESOLVED_SOURCE_SHA
INSTALLED_PRODUCT_VERSION
INSTALLATION_STATUS
ACTIVATION_STATUS
INVOCATION_STATUS
WORKSPACE_OR_TARGET_STATE
VERIFIED_AT
EVIDENCE_REF
```

The packet fails closed when the resolved SHA is missing/wrong, installed metadata does not report beta.4, source identity is inferred only from command/catalog text, activation/invocation is not independently observed, mutable cache is reused without proving its source, evidence belongs to another identity, or target-state truth is unknown.

## Create-only evidence harness

`scripts/hakim_transport_evidence.mjs` validates and renders a reviewable packet. It never installs a plugin, changes host configuration, captures raw host output, or modifies an acceptance projection. `--apply` is refused and `--output` is create-only.

A `PASS` packet remains review input until explicit operator acceptance and deterministic reconciliation. All four beta.4 packets have now crossed that boundary.

## Ordered execution

1. Codex — accepted.
2. Claude Code — accepted.
3. GitHub Copilot CLI — accepted.
4. OpenCode — accepted.
5. Four-host deterministic reconciliation — complete.
6. Exact final-head Public CI — pending.
7. Only after that gate may PR #48 leave Draft under an explicit operator decision.

## Exit criteria

Host-native transport reconciliation is complete: all four maintained routes resolve frozen beta.4 and have accepted host/version-bounded packets. P0 itself may leave Draft only when the exact final PR head also passes Public CI and the operator explicitly authorizes the transition.

Until that final gate:

```text
PR_48_READY = NO
ISSUE_47    = OPEN
F05         = BLOCKED
```
