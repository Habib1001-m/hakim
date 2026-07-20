#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
# Hakim Phase D.1 — Operator Runtime Validation Commands

# 1) Start from a clean main checkout.
git checkout main
git pull --ff-only

# 2) Confirm repository state.
git rev-parse HEAD
git status --short

# 3) Run local repository gates.
npm test
npm run check:rules
npm run check:codex-projection
npm run check:evidence-script
npm run audit:ci
npm run package:skill

# 4) Generate the local evidence packet.
bash scripts/codex_runtime_evidence_capture.sh

# 5) Inspect generated evidence directory.
ls -la dist/codex-runtime-evidence-*/

# 6) Confirm Codex CLI is available.
codex --version
codex plugin marketplace list
codex plugin list

# 7) If the Hakim local marketplace is not visible, add from repo root.
# Do not run this if the marketplace is already registered.
codex plugin marketplace add ./
codex plugin marketplace list

# 8) Open Codex plugin UI / plugin directory manually.
# Verify:
# - Marketplace: Hakim Local Plugins
# - Plugin: hakim
# - Hook review/trust prompt appears before hook activation
# - Fresh session activates Hakim guidance after trust
# - Disable/uninstall removes Hakim activation

# 9) Open a GitHub issue using:
# .github/ISSUE_TEMPLATE/codex-runtime-validation.yml
# Attach sanitized screenshots/transcripts only.
EOF
