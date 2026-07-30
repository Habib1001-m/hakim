# P0 Host-Native Transport Reconciliation

**Status:** `HOLD_FOR_HOST_NATIVE_PROOF`  
**Authority:** issue #47 and Draft PR #48  
**Frozen candidate:** `1.0.0-beta.4`  
**Expected source SHA:** `5d00039479f2f11b7fe30ccf2385e70ce24553c3`

## Purpose

P0 separates moving unreleased development from the frozen beta.4 candidate. That repository-level identity split is necessary but not sufficient to prove what each host installs.

A command that contains a 40-character SHA is a transport declaration. It becomes host evidence only after a disposable real-host journey records the source actually resolved, the installed plugin bytes/version, activation, and invocation.

Repository conformance, marketplace schema support, and prior observations must not be silently promoted into exact-candidate native-host acceptance.

## Reconciled decision

```text
IDENTITY_MODEL              = PASS
METADATA_RECONCILIATION     = PASS
TRANSPORT_DECLARATIONS      = PRESENT
HOST_RESOLUTION_PROOF       = NOT_RUN
P0_OVERALL                  = HOLD_FOR_HOST_NATIVE_PROOF
```

No beta.5 candidate, release, promotion, external evaluator campaign, npm publication, central marketplace publication, or F05 implementation is authorized by this document.

## Host contract matrix

| Host | Current frozen-route declaration | Static contract boundary | Required proof |
|---|---|---|---|
| Codex | `codex plugin marketplace add https://github.com/Habib1001-m/hakim.git --ref 5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Codex documents Git marketplace checkout through `--ref`; the repository has not yet accepted a disposable journey proving that this exact full SHA is the resolved marketplace source. | Record marketplace source SHA, installed identity, hook visibility/trust state, invocation, host version, and clean disposable state. |
| Claude Code | `claude plugin marketplace add https://github.com/Habib1001-m/hakim.git#5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Claude documents marketplace refs as branch/tag selectors. Exact commit pinning is explicitly supported for plugin source objects, but the frozen beta.4 marketplace entry uses a relative in-repository source. The command therefore remains unproven until exercised. | Record registered marketplace source, installed cache/source SHA, installed version, activation, invocation, and host version. |
| GitHub Copilot CLI | `copilot plugin marketplace add Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3` | Copilot documents `owner/repo#ref` registration and exact `sha` fields for plugin source objects. The frozen beta.4 marketplace entry is still relative to its checkout, so exact full-SHA registration must be verified in a disposable journey. | Record marketplace source SHA, installed plugin source SHA/version, activation, skills/agents visibility, invocation, and host version. |
| OpenCode | `npx --yes --package=github:Habib1001-m/hakim#5d00039479f2f11b7fe30ccf2385e70ce24553c3 hakim-opencode install` | The Git package specification names an exact commit and B7 observed the lifecycle route, but B7 had `Authority: NONE` and did not promote candidate acceptance. | Run the exact-source CLI in a clean target, record resolved package/source identity, persisted manifest identity, status, invocation, Node/npm versions, and cleanup. |

## Why the marketplace manifests are not rewritten yet

Changing moving `main` marketplace entries to point at frozen beta.4 would create a second ambiguity: a development catalog could advertise or install frozen bytes while the checkout itself reports `1.0.0-beta.4.post1`.

P0 therefore does not mutate the frozen beta.4 commit, create a release tag, or replace host-native proof with a new moving-main catalog convention. The current declarations remain under test until real hosts establish which exact source they resolve.

A later deliberate candidate cut may adopt host-native source objects pinned by `sha`, a frozen tag/ref plus resolved-SHA verification, or another proven mechanism. The chosen mechanism must keep catalog identity, plugin bytes, embedded version, and acceptance evidence coherent.

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
- source identity is inferred only from command text;
- activation or invocation is not independently observed;
- the test reuses mutable host cache without proving its source;
- evidence comes from moving `main`, a different version, or a prior candidate;
- cleanup or target-state truth is unknown.

## Ordered execution

1. Run Codex in an isolated plugin home and capture the resolved marketplace checkout and installed plugin identity.
2. Run Claude Code in an isolated plugin cache/home and capture the registered marketplace source plus installed cache identity.
3. Run GitHub Copilot CLI with an isolated `COPILOT_HOME`/cache and capture marketplace plus installed plugin identity.
4. Run OpenCode against a fresh non-product target and capture the exact package/source and persisted manifest.
5. Reconcile all packets into `conformance/history/native-host-acceptance-1.0.0-beta.4.json` only after explicit operator acceptance.
6. Rerun canonical and exact-head Public CI.

## Exit criteria

P0 may leave Draft only when all are true:

- the identity authority and embedded development/frozen versions remain separated;
- every maintained normal route has a proven source-resolution mechanism;
- every included host resolves `5d00039479f2f11b7fe30ccf2385e70ce24553c3` and reports `1.0.0-beta.4`;
- accepted packets are exact-candidate, host/version/OS bounded, and independently attributable;
- deterministic tests reject a host marked verified without a resolved SHA and evidence reference;
- exact final-head Public CI passes;
- no release or promotion authority is inferred from P0 completion alone.

Until then:

```text
PR_48_READY = NO
ISSUE_47    = OPEN
F05         = BLOCKED
```
