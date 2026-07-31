# P0 Host-Native Transport Reconciliation

**Status:** `HOLD_FOR_HOST_NATIVE_PROOF`  
**Authority:** issue #47 and Draft PR #48  
**Frozen candidate:** `1.0.0-beta.4`  
**Expected source SHA:** `5d00039479f2f11b7fe30ccf2385e70ce24553c3`

## Purpose

P0 separates moving unreleased development from the frozen beta.4 candidate. That repository identity split is necessary but not sufficient to prove what each host installs.

A command containing a SHA is one possible transport declaration, not the only valid immutable-pin layer. Host evidence requires a disposable real-host journey that records the effective source actually resolved, installed version/bytes, activation, and invocation.

## Current decision

```text
IDENTITY_MODEL              = PASS
METADATA_RECONCILIATION     = PASS
CODEX_TRANSPORT_PROOF       = PASS / OPERATOR_ACCEPTED
CLAUDE_TRANSPORT_PROOF      = PASS / OPERATOR_ACCEPTED
COPILOT_TRANSPORT_PROOF     = PASS / OPERATOR_ACCEPTED
OPENCODE_TRANSPORT_PROOF    = NOT_RUN
HOST_RESOLUTION_PROOF       = PARTIAL_3_OF_4
P0_OVERALL                  = HOLD_FOR_HOST_NATIVE_PROOF
```

No beta.5 candidate, release, promotion, external evaluator campaign, npm publication, central marketplace publication, or F05 implementation is authorized by this document.

## Host contract matrix

| Host | Effective frozen route | Static pin layer | Current proof |
|---|---|---|---|
| Codex | `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3` | marketplace checkout `--ref` | `PASS`, operator accepted, packet integrity-bound |
| Claude Code | `claude plugin marketplace add Habib1001-m/hakim` then `claude plugin install hakim@hakim` | `.claude-plugin/marketplace.json` plugin source `{source: git-subdir, path: plugins/claude-code, sha: 5d000...}` | `PASS`, operator accepted, packet integrity-bound |
| GitHub Copilot CLI | `copilot plugin marketplace add Habib1001-m/hakim` then `copilot plugin install hakim@hakim` | `.github/plugin/marketplace.json` plugin source `{source: github, repo: Habib1001-m/hakim, path: plugins/copilot, sha: 5d000...}` | `PASS`, operator accepted, packet integrity-bound |
| OpenCode | `npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install` | npm Git package spec | `NOT_RUN` |

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

The failed declaration is superseded, not erased. The repaired design uses Claude Code's host-native distinction:

- **marketplace source:** catalog discovery; branch/tag semantics may apply;
- **plugin source inside the catalog:** exact immutable product source;
- **Hakim plugin source:** `git-subdir`, repository URL, `path: plugins/claude-code`, exact beta.4 `sha`;
- **catalog-advertised plugin version:** `1.0.0-beta.4`;
- **moving source-tree plugin manifest:** remains `1.0.0-beta.4.post1` and development-only.

For the pre-merge P0 journey, the branch containing the repaired catalog was registered only to obtain the catalog definition. The installed plugin source independently resolved the frozen SHA, reported beta.4, matched all 22 distributed product files byte-for-byte, activated through SessionStart, and invoked `/hakim:help` successfully.

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

This acceptance is bounded to Claude Code `2.1.220`, the recorded Linux/WSL environment, and the exact repaired route. It does not transfer to Copilot, OpenCode, another Claude version, or moving development.

## Copilot failed route, repaired source contract, and accepted rerun

A disposable authenticated Copilot CLI `1.0.71` journey first attempted the previously documented route:

```text
copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3
```

Copilot passed the suffix to Git as `--branch 5d000394...`; Git failed because no branch has that name.

```text
ATTEMPT_STATUS = FAIL
FAILURE_CLASS  = MARKETPLACE_REF_SHA_TREATED_AS_BRANCH
EVIDENCE       = https://github.com/Habib1001-m/hakim/issues/47#issuecomment-5142063851
```

The failed declaration is superseded, not erased. The repaired design uses Copilot CLI's host-native catalog/plugin-source distinction:

- **marketplace registration:** catalog discovery only;
- **Hakim plugin source:** `source: github`, `repo: Habib1001-m/hakim`, `path: plugins/copilot`, exact 40-character beta.4 `sha`;
- **catalog-advertised plugin version:** `1.0.0-beta.4`;
- **moving source-tree plugin manifest:** remains `1.0.0-beta.4.post1` and development-only.

Before changing the maintained route, a disposable local-catalog probe confirmed that Copilot CLI `1.0.71` supports this exact source shape. It installed frozen beta.4 and matched all 13 distributed Copilot product files byte-for-byte. That probe remained non-candidate evidence.

The maintained-repository acceptance journey then used the P0 branch only for catalog discovery. The cached marketplace checkout matched PR head `7fcf6c31b49d54c8015294be72f8daa36a5704e3`; its catalog entry pinned the plugin itself to frozen source SHA `5d00039479f2f11b7fe30ccf2385e70ce24553c3`. Installing `hakim@hakim` reported `1.0.0-beta.4`; all 13 installed product files matched the frozen `plugins/copilot` tree byte-for-byte with identical deterministic tree digest `b1d210d97a4d1f5b119667bedf13007cbb0560a6bb1f28bcd3e232ee708d14e2`.

Runtime activation was observed independently: Copilot loaded the Hakim plugin, all six Hakim skills, and five Hakim custom agents. Frozen beta.4 contains no Copilot hooks, so hook absence is not an activation failure. Invocation was then observed through an explicit `hakim-help` skill call; Copilot emitted `skill(hakim-help)` and returned the frozen Hakim quick reference. The disposable runtime target remained unchanged.

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

The branch-qualified marketplace registration above is pre-merge catalog discovery evidence, not the normal post-merge product command. The normal maintained command remains `copilot plugin marketplace add Habib1001-m/hakim`; immutability is enforced by the catalog plugin `source.sha`.

This acceptance is bounded to Copilot CLI `1.0.71`, the recorded WSL/Linux environment, the exact frozen plugin source, and the observed activation/invocation path. It does not transfer to OpenCode, moving R3.2 development, another Copilot version, or later candidates.

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

The packet fails closed when:

- `RESOLVED_SOURCE_SHA` is missing or differs from the expected beta.4 SHA;
- installed metadata does not report `1.0.0-beta.4`;
- source identity is inferred only from command or catalog text;
- activation or invocation is not independently observed;
- mutable cache is reused without proving its source;
- evidence comes from moving `main`, another version, or a prior candidate;
- cleanup or target-state truth is unknown.

## Create-only evidence harness

`scripts/hakim_transport_evidence.mjs` validates and renders a reviewable packet. It never installs a plugin, changes host configuration, captures raw host output, or modifies an acceptance projection. `--apply` is refused and `--output` is create-only.

```bash
npm run capture:transport -- --host github-copilot --json
```

A `PASS` packet remains review input. It is promoted only after explicit operator acceptance and deterministic reconciliation.

## Ordered execution

1. Codex — accepted.
2. Claude Code — accepted.
3. GitHub Copilot CLI — accepted.
4. OpenCode — next; record exact package/source and persisted manifest.
5. Reconcile each accepted packet independently.
6. Run exact final-head Public CI after the final evidence mutation.

## Exit criteria

P0 may leave Draft only when all are true:

- moving development and frozen candidate identities remain separated;
- every maintained route has an effective immutable source-resolution mechanism;
- all four hosts resolve `5d00039479f2f11b7fe30ccf2385e70ce24553c3` and report `1.0.0-beta.4`;
- accepted packets are host/version/OS bounded and independently attributable;
- deterministic tests reject unsupported verification claims;
- exact final-head Public CI passes;
- no release or promotion authority is inferred from P0 completion alone.

Until then:

```text
PR_48_READY = NO
ISSUE_47    = OPEN
F05         = BLOCKED
```
