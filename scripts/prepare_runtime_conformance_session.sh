#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"
if [[ "$HOST" != "codex" && "$HOST" != "claude-code" && "$HOST" != "github-copilot" ]]; then
  echo "usage: bash scripts/prepare_runtime_conformance_session.sh <codex|claude-code|github-copilot> [output-root]" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_ROOT="${2:-dist/p1-1a-runtime-$STAMP}"
PACKET="$OUTPUT_ROOT/$HOST"

npm run check:conformance >/dev/null
node scripts/generate_conformance_packets.mjs --host "$HOST" --output "$OUTPUT_ROOT" >/dev/null

while IFS= read -r exclude_file; do
  if ! grep -qxF '.hakim-fixture.json' "$exclude_file" 2>/dev/null; then
    printf '\n.hakim-fixture.json\n' >> "$exclude_file"
  fi
done < <(find "$PACKET/fixtures" -path '*/.git/info/exclude' -type f | sort)

case "$HOST" in
  codex)
    HOST_VERSION="$(codex --version 2>&1 | head -1 || true)"
    ;;
  claude-code)
    HOST_VERSION="$(claude --version 2>&1 | head -1 || true)"
    ;;
  github-copilot)
    HOST_VERSION="OPERATOR_MUST_RECORD_EDITOR_AND_EXTENSION_VERSION"
    ;;
esac

node - "$PACKET/evidence.json" "$HOST_VERSION" <<'NODE'
const fs = require('fs');
const [file, hostVersion] = process.argv.slice(2);
const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
evidence.host_version = hostVersion || 'UNKNOWN';
evidence.started_at = new Date().toISOString();
fs.writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`);
NODE

{
  echo "HOST=$HOST"
  echo "PACKET=$PACKET"
  echo "REPOSITORY_COMMIT=$(git rev-parse HEAD)"
  echo "HAKIM_VERSION=$(cat core/hakim-skill/VERSION)"
  echo "HOST_VERSION=$HOST_VERSION"
  echo "SOURCE_TREE_STATUS_BEGIN"
  git status --short
  echo "SOURCE_TREE_STATUS_END"
} > "$PACKET/PREFLIGHT.txt"

cat <<EOF
P1_1A_PACKET=$PACKET
HOST=$HOST
HOST_VERSION=$HOST_VERSION
PROMPTS=$PACKET/PROMPTS.md
SESSION=$PACKET/SESSION.md
EVIDENCE=$PACKET/evidence.json

Next:
1. Read $PACKET/SESSION.md
2. Execute the ten cases from $PACKET/PROMPTS.md
3. Save transcripts under $PACKET/transcripts/
4. Run: node scripts/capture_runtime_fixture_state.mjs --packet "$PACKET"
5. Optional advisory telemetry: node scripts/extract_hakim_outcome_telemetry.mjs --packet "$PACKET"
6. Complete assertion evidence and verdicts in $PACKET/evidence.json
7. Run: node scripts/validate_runtime_conformance_evidence.mjs --input "$PACKET/evidence.json" --require-complete
EOF
