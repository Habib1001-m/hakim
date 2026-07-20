#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SMOKE_ROOT=${HAKIM_SMOKE_ROOT:-${RUNNER_TEMP:-/tmp}/hakim-native-opencode-smoke}
RUNTIME_DIR="$SMOKE_ROOT/opencode-runtime"
HOME_DIR="$SMOKE_ROOT/home"
PROJECT_DIR="$SMOKE_ROOT/consumer-project"
EVIDENCE_DIR=${HAKIM_SMOKE_EVIDENCE_DIR:-$ROOT/dist/native-plugin/opencode-smoke}
CONFIG_DIR="$HOME_DIR/.config/opencode"
PROVIDER_PORT=${HAKIM_SMOKE_PROVIDER_PORT:-17843}
PROVIDER_CAPTURE="$EVIDENCE_DIR/provider-capture.json"
PROVIDER_LOG="$EVIDENCE_DIR/provider.log"

rm -rf "$SMOKE_ROOT" "$EVIDENCE_DIR"
mkdir -p "$RUNTIME_DIR" "$HOME_DIR" "$PROJECT_DIR" "$EVIDENCE_DIR" "$CONFIG_DIR"

mapfile -t tarballs < <(find "$ROOT/dist/native-plugin" -maxdepth 1 -type f -name '*.tgz' -print | sort)
if [[ ${#tarballs[@]} -ne 1 ]]; then
  echo "expected exactly one native plugin tarball, found ${#tarballs[@]}" >&2
  exit 2
fi
TARBALL=${tarballs[0]}
printf '%s\n' "$TARBALL" > "$EVIDENCE_DIR/tarball-path.txt"
sha256sum "$TARBALL" | awk '{print $1}' > "$EVIDENCE_DIR/tarball.sha256"

npm install \
  --prefix "$RUNTIME_DIR" \
  --no-audit \
  --no-fund \
  --include=optional \
  opencode-ai@1.18.3 \
  > "$EVIDENCE_DIR/opencode-install.stdout.txt" \
  2> "$EVIDENCE_DIR/opencode-install.stderr.txt"

OPENCODE_BIN="$RUNTIME_DIR/node_modules/.bin/opencode"
if [[ ! -x "$OPENCODE_BIN" ]]; then
  echo "OpenCode binary was not installed at $OPENCODE_BIN" >&2
  exit 3
fi

HOME="$HOME_DIR" "$OPENCODE_BIN" --version | tee "$EVIDENCE_DIR/opencode-version.txt"

cat > "$PROJECT_DIR/sample.js" <<'EOF'
export function identity(value) {
  return value;
}
EOF

cat > "$PROJECT_DIR/opencode.json" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "model": "smoke/hakim-smoke",
  "small_model": "smoke/hakim-smoke",
  "enabled_providers": ["smoke"],
  "provider": {
    "smoke": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Hakim deterministic smoke provider",
      "options": {
        "baseURL": "http://127.0.0.1:${PROVIDER_PORT}/v1",
        "apiKey": "smoke-only"
      },
      "models": {
        "hakim-smoke": {
          "name": "Hakim Smoke",
          "limit": {
            "context": 32768,
            "output": 4096
          }
        }
      }
    }
  },
  "permission": {
    "bash": "deny",
    "edit": "deny",
    "write": "deny",
    "webfetch": "deny",
    "skill": "allow"
  }
}
EOF
sha256sum "$PROJECT_DIR/opencode.json" | awk '{print $1}' > "$EVIDENCE_DIR/opencode-config.before.sha256"
printf '%s\n' 'preserve-me' > "$CONFIG_DIR/unrelated.keep"

export HOME="$HOME_DIR"
export OPENCODE_CONFIG_DIR="$CONFIG_DIR"
export OPENCODE_CONFIG="$PROJECT_DIR/opencode.json"
export OPENCODE_DISABLE_AUTOUPDATE=1
export OPENCODE_DISABLE_LSP_DOWNLOAD=1
export OPENCODE_DISABLE_MODELS_FETCH=1
export HAKIM_SMOKE_PROVIDER_PORT="$PROVIDER_PORT"
export HAKIM_SMOKE_CAPTURE_PATH="$PROVIDER_CAPTURE"

node "$ROOT/tests/fixtures/opencode_mock_provider.mjs" > "$PROVIDER_LOG" 2>&1 &
PROVIDER_PID=$!
cleanup() {
  kill "$PROVIDER_PID" 2>/dev/null || true
  wait "$PROVIDER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl --silent --fail "http://127.0.0.1:${PROVIDER_PORT}/health" >/dev/null; then
    break
  fi
  sleep 0.25
done
curl --silent --fail "http://127.0.0.1:${PROVIDER_PORT}/health" >/dev/null

start_epoch=$(date +%s)
(
  cd "$PROJECT_DIR"
  npm exec --yes --package="$TARBALL" -- hakim install --json
) | tee "$EVIDENCE_DIR/hakim-install.json"

(
  cd "$PROJECT_DIR"
  "$OPENCODE_BIN" debug paths
) > "$EVIDENCE_DIR/opencode-debug-paths.txt" 2>&1

(
  cd "$PROJECT_DIR"
  "$OPENCODE_BIN" debug skill
) > "$EVIDENCE_DIR/opencode-debug-skill.txt" 2>&1

(
  cd "$PROJECT_DIR"
  "$OPENCODE_BIN" debug config
) > "$EVIDENCE_DIR/opencode-debug-config.txt" 2>&1

set +e
(
  cd "$PROJECT_DIR"
  timeout 120 "$OPENCODE_BIN" \
    --print-logs \
    --log-level DEBUG \
    run \
    --model smoke/hakim-smoke \
    "/hakim full Review sample.js. Return one bounded evidence-backed result without editing files."
) > "$EVIDENCE_DIR/opencode-run.stdout.txt" 2> "$EVIDENCE_DIR/opencode-run.stderr.txt"
run_status=$?
set -e
printf '%s\n' "$run_status" > "$EVIDENCE_DIR/opencode-run.exit.txt"
if [[ $run_status -ne 0 ]]; then
  cat "$EVIDENCE_DIR/opencode-run.stderr.txt" >&2
  exit "$run_status"
fi

end_epoch=$(date +%s)
printf '%s\n' "$((end_epoch - start_epoch))" > "$EVIDENCE_DIR/elapsed-seconds.txt"

(
  cd "$PROJECT_DIR"
  npm exec --yes --package="$TARBALL" -- hakim install --json
) | tee "$EVIDENCE_DIR/hakim-reinstall.json"

(
  cd "$PROJECT_DIR"
  npm exec --yes --package="$TARBALL" -- hakim remove --json
) | tee "$EVIDENCE_DIR/hakim-remove.json"

sha256sum "$PROJECT_DIR/opencode.json" | awk '{print $1}' > "$EVIDENCE_DIR/opencode-config.after.sha256"
find "$CONFIG_DIR" -mindepth 1 -maxdepth 4 -printf '%P\n' | sort > "$EVIDENCE_DIR/config-residual-inventory.txt"

export HAKIM_SMOKE_EVIDENCE_DIR="$EVIDENCE_DIR"
export HAKIM_SMOKE_PROJECT="$PROJECT_DIR"
export HAKIM_SMOKE_REPORT_PATH="$EVIDENCE_DIR/opencode-smoke-report.json"
node "$ROOT/tests/verify_native_plugin_opencode_smoke.mjs" | tee "$EVIDENCE_DIR/verification.stdout.txt"
