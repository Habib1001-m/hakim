#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/run_runtime_conformance_case.sh <packet-dir> <case-id>

Example:
  bash scripts/run_runtime_conformance_case.sh \
    dist/p1-1a-runtime-20260711T034555Z/codex HC-001

Run this command from the normal shell. Do not paste it inside Codex.
EOF
}

if [[ $# -ne 2 ]]; then
  usage >&2
  exit 2
fi

PACKET="$(realpath "$1")"
CASE_ID="$2"

if [[ ! "$CASE_ID" =~ ^HC-[0-9]{3}$ ]]; then
  echo "invalid case id: $CASE_ID" >&2
  exit 2
fi

PROMPT="$PACKET/case-prompts/$CASE_ID.txt"
FIXTURE="$PACKET/fixtures/$CASE_ID"
TRANSCRIPT="$PACKET/transcripts/$CASE_ID.txt"
MANIFEST="$PACKET/manifest.json"

for required in "$PROMPT" "$FIXTURE/.git" "$MANIFEST"; do
  if [[ ! -e "$required" ]]; then
    echo "missing required packet member: $required" >&2
    exit 2
  fi
done

HOST="$(node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(String(p.host||""));' "$MANIFEST")"
if [[ "$HOST" != "codex" ]]; then
  echo "this runner currently supports Codex packets only; packet host=$HOST" >&2
  exit 2
fi

BASELINE_STATUS="$(node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.stdout.write(String(p.baseline_status||""));' "$FIXTURE/.hakim-fixture.json")"
CURRENT_STATUS="$(git -C "$FIXTURE" status --porcelain=v1)"
if [[ "$CURRENT_STATUS" != "$BASELINE_STATUS" ]]; then
  echo "fixture state does not match its recorded baseline; rebuild a fresh packet" >&2
  echo "--- recorded baseline ---" >&2
  printf '%s\n' "$BASELINE_STATUS" >&2
  echo "--- current status ---" >&2
  printf '%s\n' "$CURRENT_STATUS" >&2
  exit 1
fi

mkdir -p "$(dirname "$TRANSCRIPT")"
rm -f "$TRANSCRIPT"

copy_method=""
if command -v clip.exe >/dev/null 2>&1; then
  cat "$PROMPT" | clip.exe
  copy_method="Windows clipboard via clip.exe"
elif command -v wl-copy >/dev/null 2>&1; then
  wl-copy < "$PROMPT"
  copy_method="Wayland clipboard via wl-copy"
elif command -v xclip >/dev/null 2>&1; then
  xclip -selection clipboard < "$PROMPT"
  copy_method="X clipboard via xclip"
fi

cat <<EOF
P1.1A guarded case runner
PACKET=$PACKET
CASE=$CASE_ID
FIXTURE=$FIXTURE
PROMPT=$PROMPT
TRANSCRIPT=$TRANSCRIPT
PROMPT_SHA256=$(sha256sum "$PROMPT" | awk '{print $1}')

IMPORTANT:
- This command is already running in the shell.
- When Codex opens, paste ONLY the generated case prompt.
- Do not paste the script command into Codex.
- The transcript must show Hakim policy context only; stop if Ponytail or another policy agent appears.
EOF

if [[ -n "$copy_method" ]]; then
  echo "PROMPT_COPY=$copy_method"
  echo "ACTION=When Codex opens, press Ctrl+V once, then submit."
else
  echo "PROMPT_COPY=UNAVAILABLE"
  echo "ACTION=Copy the exact prompt printed below, then paste it into Codex."
  echo
  cat "$PROMPT"
  echo
fi

read -r -p "Press Enter to launch Codex with transcript capture, or Ctrl+C to abort: " _

cd "$FIXTURE"
script -q -f -c codex "$TRANSCRIPT"

cat <<EOF

CASE_SESSION_FINISHED=$CASE_ID
TRANSCRIPT=$TRANSCRIPT

Next, from the Hakim repository root, run:
  node scripts/capture_runtime_fixture_state.mjs --packet "$PACKET"

Then review:
  git -C "$FIXTURE" status --short
  git -C "$FIXTURE" diff --exit-code
EOF

if [[ -f "$FIXTURE/package.json" ]]; then
  echo "  npm --prefix \"$FIXTURE\" test"
else
  echo "  TEST_COMMAND=NOT_APPLICABLE_NO_PACKAGE_JSON"
fi

echo "  grep -nE 'Hakim mode|PONYTAIL|Case $CASE_ID' \"$TRANSCRIPT\""
