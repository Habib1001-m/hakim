# External Public-Beta Evaluation

Hakim `1.0.0-beta.1` is ready for bounded external public-beta evaluation on the four maintained hosts whose current native journeys are recorded as `PASS` in `conformance/native-host-acceptance.json`.

This campaign evaluates product usefulness and UX with real developers. It does not replace the native-host acceptance projection and does not authorize a stable release, package publication, or central marketplace listing.

## Who should participate

A useful evaluator is a developer who was not part of Hakim's maintainer live-host acceptance run and can try Hakim on a real repository task using one of:

- Codex;
- Claude Code;
- GitHub Copilot CLI;
- OpenCode.

The repository can be public or private, but submitted feedback must not contain private source code, credentials, private prompts, customer data, or other sensitive evidence.

## Evaluation journey

1. Read the host installation path in [`core/hakim-skill/INSTALL.md`](../core/hakim-skill/INSTALL.md).
2. Install and activate Hakim using that maintained path.
3. Confirm Hakim is discoverable in the host.
4. Use at least one Hakim capability on a real coding, review, audit, debt, or evidence task.
5. Judge the actual outcome rather than the documentation alone.
6. Submit the **Hakim public-beta feedback** GitHub Issue Form.

Do not change your repository solely to manufacture a successful Hakim result. A confusing, neutral, obstructive, or failed experience is valid evidence when described clearly.

## What we need to learn

The campaign is primarily looking for four things:

- **First-run clarity:** Could you install and activate Hakim without maintainer intervention?
- **First useful outcome:** Did a Hakim capability materially help on a real task?
- **Friction:** What was confusing, unnecessary, obstructive, or broken?
- **Retention intent:** After this evaluation, would you keep Hakim enabled for normal development?

## What counts as an accepted evaluator report

A report counts toward the campaign target only when all of the following are true:

1. the evaluator is external to the maintainer acceptance run;
2. Hakim was actually installed and activated on a maintained host;
3. at least one Hakim capability was invoked on a real repository task;
4. the report contains enough public-safe detail to distinguish an observed result from opinion-only feedback;
5. the report contains no credentials, private prompts, proprietary source code, customer data, or private governance material.

The campaign target is **five independent accepted evaluator reports**. Five reports are not treated as a statistically representative benchmark, and Hakim will not derive invented success percentages from them.

## Feedback outcomes

After five accepted reports are reviewed, the operator decision will use one of these semantics:

- `CONTINUE_BETA` — no release-blocking pattern; accepted feedback becomes prioritized beta backlog.
- `REMEDIATE` — one or more concrete product or UX defects should be fixed before broader promotion.
- `HOLD` — repeated severe install, activation, trust, or product-promise failures make broader promotion unsafe or misleading.

## Evidence boundary

Keep public feedback reproducible but minimal. It is usually enough to report:

- Hakim version;
- host and host version;
- maintained install path used;
- capability invoked;
- task category, without proprietary content;
- observed result;
- concrete friction or failure;
- whether you would keep Hakim enabled.

Do not upload raw prompts, repository archives, credentials, private logs, customer code, or sensitive screenshots merely to strengthen a report.

## Campaign tracker

The campaign is tracked in GitHub Issue #12. The tracker, individual evaluator reports, and resulting remediation issues are the public campaign record.