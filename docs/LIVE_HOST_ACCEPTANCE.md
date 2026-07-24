# Current-Native Live Host Acceptance

This document defines the public-safe workflow for accepting Hakim `1.0.0-beta.1` on a real supported coding host.

## Boundary

A green repository CI run is not live-host acceptance.

A host or materially changed first-run transport can be promoted by public evidence only after the exact end-to-end journey has been observed on the real host and a public-safe evidence reference has been reviewed.

Hakim never asks for credentials, private prompts, customer source code, authentication tokens, or private governance records as live-host evidence.

## 1. Inspect before running the host journey

From a current Hakim checkout:

```bash
npm run accept:host -- --host codex
npm run accept:host -- --host claude-code
npm run accept:host -- --host github-copilot
npm run accept:host -- --host opencode --target /path/to/test-project
```

The command is read-only. It:

- resolves the requested host binary;
- runs only the host's `--version` probe;
- validates Hakim's current install-plan contract;
- prints the current install/start/invocation checklist;
- does not install a plugin, change host configuration, start an interactive host, or edit the acceptance projection.

`--apply` is intentionally refused.

## 2. Run the real product journey

### Codex

Hakim's direct-repository beta path currently asks the operator to try:

```bash
codex plugin marketplace add Habib1001-m/hakim
```

Then use the Codex plugin UI to select the Hakim marketplace, install `hakim`, review/trust the bundled SessionStart hook, start a new thread, and invoke an installed Hakim skill.

Codex public plugin discovery changed materially in July 2026 and is now centered on the Plugin Directory. Therefore the repository-marketplace command above is itself part of the live acceptance question. Do not mark Codex `PASS` unless that exact beta product path is observed to work on the tested Codex version, or the product path is deliberately changed and re-reviewed.

### Claude Code

```bash
claude plugin marketplace add Habib1001-m/hakim
claude plugin install hakim@hakim
```

Start Claude Code with the plugin enabled. If installation occurred during an active session, use `/reload-plugins` when appropriate. Invoke `/hakim:help` or another Hakim command/agent and verify that the installed plugin responds.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add Habib1001-m/hakim
copilot plugin install hakim@hakim
copilot plugin list
```

Inside Copilot CLI, verify `/skills list` and `/agent`, then invoke a Hakim skill or agent and verify the installed plugin responds.

### OpenCode

Use a disposable or deliberately selected test repository. For an unreleased candidate, pin the Git package spec to the exact candidate commit instead of testing a moving branch:

```bash
cd /path/to/test-project
npx --yes --package=github:Habib1001-m/hakim#<40-char-candidate-sha> hakim-opencode install --dry-run
npx --yes --package=github:Habib1001-m/hakim#<40-char-candidate-sha> hakim-opencode install
```

Then start OpenCode from that project and invoke `/hakim-help` or another Hakim command/skill.

OpenCode loads the resulting project-local plugin from `.opencode/plugins/`. Hakim's bootstrap reuses the guarded create-only lifecycle, verifies the installed bundle, does not edit `opencode.json`, and creates no global Hakim/OpenCode state.

The previously recorded OpenCode `PASS` proves the earlier guarded project-local install/start/invocation journey. It does not automatically prove this new Git-backed first-run transport. Record separate evidence for the exact candidate commit before promoting that transport as accepted.

## 3. Record a candidate evidence packet

After actually observing the journey, rerun the harness with the three checkpoints and a public-safe evidence reference.

Example:

```bash
npm run accept:host -- --host claude-code \
  --record \
  --installation PASS \
  --activation PASS \
  --invocation PASS \
  --evidence-ref 'issue:8#claude-live' \
  --output dist/live-host-acceptance/claude-code.json \
  --json
```

For OpenCode, include the tested target repository and make the evidence reference identify the exact candidate commit used by the Git-backed command:

```bash
npm run accept:host -- --host opencode \
  --target /path/to/test-project \
  --record \
  --installation PASS \
  --activation PASS \
  --invocation PASS \
  --evidence-ref 'issue:<number>#comment-containing-exact-40-char-sha' \
  --output dist/live-host-acceptance/opencode-git-bootstrap.json \
  --json
```

The candidate becomes `PASS` only when:

- all three observed checkpoints are `PASS`;
- the host binary is resolved;
- the host version is detected from the real binary;
- a non-empty public-safe evidence reference is supplied;
- for an unreleased Git-backed OpenCode candidate, the public-safe evidence identifies the immutable candidate commit actually tested.

`--output` is create-only. The harness refuses to overwrite an existing evidence packet; use a new path for every run so earlier evidence remains inspectable.

A candidate packet is evidence for review, not authorization to change the public acceptance projection.

## 4. Promote only after review

Review the candidate packet and its evidence reference. Then, and only then, update the corresponding host/product-path evidence when the reviewed observation actually covers the claimed journey.

Do not broaden old evidence to a new transport, version, or journey merely because the runtime payload is similar.

External evaluator recruitment is currently `SUSPENDED_FOR_PRODUCT_REMEDIATION`. Live-host acceptance is a separate evidence dimension and must not reopen the withdrawn evaluator campaign automatically.

## Upstream host references

Host-native behavior remains authoritative in each host's documentation:

- Claude Code plugin discovery and installation: https://code.claude.com/docs/en/discover-plugins
- GitHub Copilot CLI plugin installation: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing
- OpenCode project-local plugins: https://opencode.ai/docs/plugins/
- Current Codex plugin overview: https://help.openai.com/en/articles/20001256-plugins-in-codex/
