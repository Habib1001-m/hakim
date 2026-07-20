#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${1:-$ROOT/dist/codex-runtime-evidence-$STAMP}"

mkdir -p "$OUT_DIR"

run_capture() {
  local name="$1"
  shift
  {
    echo "$ $*"
    echo
    "$@"
    local status=$?
    echo
    echo "exit_code=$status"
    return "$status"
  } > "$OUT_DIR/$name.txt" 2>&1
}

run_optional() {
  local name="$1"
  shift
  if command -v "$1" >/dev/null 2>&1; then
    run_capture "$name" "$@" || true
  else
    {
      echo "$1 not found on PATH"
      echo "exit_code=127"
    } > "$OUT_DIR/$name.txt"
  fi
}

cat > "$OUT_DIR/README.md" <<'EOF'
# Hakim Codex Runtime Evidence Packet

This packet is generated locally by `scripts/codex_runtime_evidence_capture.sh`.

It intentionally captures command output only. It does not collect prompts, private source snippets beyond normal command output, tokens, credentials, or shell history.

Manual screenshots/transcripts still required:

1. Codex plugin directory showing `Hakim Local Plugins` and plugin `hakim`.
2. Hook review/trust prompt before activation.
3. Fresh-session activation transcript.
4. Disable/uninstall transcript.
5. Marketplace removal transcript, if applicable.
EOF

run_capture git-head git -C "$ROOT" rev-parse HEAD || true
run_capture git-status git -C "$ROOT" status --short || true
run_optional node-version node --version
run_optional npm-version npm --version
run_optional python-version python --version
run_optional codex-version codex --version

(
  cd "$ROOT" || exit 1
  npm test
) > "$OUT_DIR/npm-test.txt" 2>&1 || true

(
  cd "$ROOT" || exit 1
  npm run check:rules
) > "$OUT_DIR/check-rules.txt" 2>&1 || true

(
  cd "$ROOT" || exit 1
  npm run check:codex-projection
) > "$OUT_DIR/check-codex-projection.txt" 2>&1 || true

(
  cd "$ROOT" || exit 1
  npm run audit:ci
) > "$OUT_DIR/audit-ci.txt" 2>&1 || true

(
  cd "$ROOT" || exit 1
  npm run package:skill
) > "$OUT_DIR/package-skill.txt" 2>&1 || true

run_optional codex-marketplace-list codex plugin marketplace list
run_optional codex-plugin-list codex plugin list

cat > "$OUT_DIR/MANUAL_EVIDENCE_CHECKLIST.md" <<'EOF'
# Manual Runtime Evidence Checklist

Fill this out after running Codex CLI/Desktop validation.

- [ ] Local marketplace visible: `Hakim Local Plugins`
- [ ] Plugin visible: `hakim`
- [ ] Plugin installs without manifest/marketplace parse errors
- [ ] Hook review/trust prompt appears before hook activation
- [ ] Fresh session shows Hakim guidance after install/trust
- [ ] Disable/uninstall removes Hakim activation
- [ ] Marketplace removal succeeds, if marketplace was added manually

## Notes

Paste short transcripts or attach screenshots for each checked item.
Do not paste tokens, credentials, full private prompts, or unrelated source code.
EOF

echo "Hakim Codex runtime evidence packet created: $OUT_DIR"
