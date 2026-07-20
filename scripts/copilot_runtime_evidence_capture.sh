#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_dir="dist/copilot-runtime-evidence-${stamp}"
mkdir -p "$out_dir"

cp .github/copilot-instructions.md "$out_dir/copilot-instructions.md"

if command -v git >/dev/null 2>&1; then
  git rev-parse HEAD > "$out_dir/git-head.txt" 2>/dev/null || true
  git status --short > "$out_dir/git-status-short.txt" 2>/dev/null || true
fi

node scripts/check_copilot_instructions_projection.mjs --json > "$out_dir/check-copilot-projection.json"
npm run check:copilot-projection > "$out_dir/npm-check-copilot-projection.txt" 2>&1

cat > "$out_dir/hook-and-adapter-boundary.txt" <<'EOF'
GitHub Copilot D.3B boundary
============================

This evidence packet proves repo-side readiness only:

- .github/copilot-instructions.md exists.
- The Hakim Copilot projection drift gate passes.
- The repo has a manual runtime evidence checklist.

It does not prove Copilot runtime behavior by itself.
Runtime PASS requires an operator transcript from GitHub Copilot Chat showing that Copilot used .github/copilot-instructions.md as a response reference.
EOF

cat > "$out_dir/MANUAL_COPILOT_RUNTIME_EVIDENCE_CHECKLIST.md" <<'EOF'
# Manual GitHub Copilot runtime evidence checklist

## Goal

Confirm that GitHub Copilot actually uses Hakim repository custom instructions at runtime.

## Prerequisites

- Branch or commit includes `.github/copilot-instructions.md`.
- Copilot has access to the repository.
- The test is run in a Copilot Chat surface that can show response references.

## Official evidence signal

GitHub documents that when repository custom instructions are used by Copilot Chat, the instructions file is added as a reference for the generated response. To verify use, expand the response References list and confirm `.github/copilot-instructions.md` appears.

Reference: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions

## Suggested runtime prompt

Attach or select the `Habib1001-m/hakim` repository in GitHub Copilot Chat, then ask:

```text
Review this repository and suggest the smallest safe next change. Prefer existing code, stdlib/native platform features, and minimal diffs. Do not claim runtime readiness without evidence.
```

## Evidence to capture

Paste or screenshot the following:

1. Copilot Chat surface used: GitHub.com / VS Code / JetBrains / CLI / other.
2. Repository context selected or attached.
3. Prompt sent.
4. Whether the response references list includes `.github/copilot-instructions.md`.
5. Whether the answer follows Hakim behavior:
   - smallest safe diff
   - reuse existing code first
   - stdlib/native before dependencies
   - no speculative architecture
   - no release/runtime/marketplace claim without evidence
6. Any conflicting personal, organization, or path-specific instructions observed.

## PASS criteria

```text
Copilot repository instructions reference visible: PASS
Copilot response follows Hakim projection: PASS
No unsupported surfaces claimed: PASS
```

## HOLD criteria

```text
Reference list unavailable or not captured: HOLD
Repository context not attached/selected: HOLD
Response does not mention/use Hakim constraints: HOLD
```
EOF

printf 'Created Copilot runtime evidence packet: %s\n' "$out_dir"
