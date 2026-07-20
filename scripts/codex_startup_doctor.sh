#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CODEX_ROOT="${CODEX_HOME:-$HOME/.codex}"
EXPECTED_VERSION="$(tr -d '[:space:]' < "$REPO_ROOT/core/hakim-skill/VERSION")"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/codex_startup_doctor.sh

Read-only inspection of local Codex plugin/cache state for duplicate Hakim
installations, SessionStart registrations, and stale plugin metadata. The
script never deletes, moves, or edits files.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

printf 'CODEX_ROOT=%s\n' "$CODEX_ROOT"
printf 'MODE=READ_ONLY\n'
printf 'EXPECTED_HAKIM_VERSION=%s\n' "$EXPECTED_VERSION"

if [[ ! -d "$CODEX_ROOT" ]]; then
  printf 'CODEX_ROOT_PRESENT=NO\n'
  printf 'HAKIM_PLUGIN_MANIFEST_COUNT=0\n'
  printf 'HAKIM_SESSIONSTART_REGISTRATION_COUNT=0\n'
  printf 'HAKIM_SESSIONSTART_REFERENCE_COUNT=0\n'
  printf 'STARTUP_DUPLICATION_STATUS=NOT_OBSERVED\n'
  printf 'HAKIM_VERSION_STATUS=NOT_OBSERVED\n'
  printf 'NO_AUTOMATIC_CLEANUP_PERFORMED=YES\n'
  exit 0
fi

mapfile -t hakim_files < <(
  find "$CODEX_ROOT" -type f \
    \( -name 'plugin.json' -o -name 'marketplace.json' -o -name 'hooks.json' -o -name '*.toml' -o -name '*.json' \) \
    -print 2>/dev/null | while IFS= read -r file; do
      if grep -Eqi 'hakim|hakim-local|session_start\.mjs' "$file" 2>/dev/null; then
        printf '%s\n' "$file"
      fi
    done | sort -u
)

manifest_count=0
hook_registration_count=0
manifest_versions=()

printf '\n[Hakim-related configuration files]\n'
if [[ ${#hakim_files[@]} -eq 0 ]]; then
  printf '(none found)\n'
else
  printf '%s\n' "${hakim_files[@]}"
fi

for file in "${hakim_files[@]}"; do
  if [[ "$(basename "$file")" == 'plugin.json' ]] && grep -Eqi '"name"[[:space:]]*:[[:space:]]*"hakim"' "$file"; then
    manifest_count=$((manifest_count + 1))
    version="$(python - "$file" <<'PY'
import json
import sys
from pathlib import Path

try:
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError):
    print("UNREADABLE")
else:
    print(payload.get("version") or "MISSING")
PY
)"
    manifest_versions+=("$version")
  fi

  # Count actual command-path registrations. A normal hooks.json contains both
  # the SessionStart event name and one session_start.mjs command; those are one
  # registration, not two references.
  registrations="$(awk 'BEGIN { IGNORECASE=1; n=0 } { n += gsub(/session_start\.mjs/, "&") } END { print n+0 }' "$file")"
  hook_registration_count=$((hook_registration_count + registrations))
done

printf '\nHAKIM_PLUGIN_MANIFEST_COUNT=%s\n' "$manifest_count"
printf 'HAKIM_SESSIONSTART_REGISTRATION_COUNT=%s\n' "$hook_registration_count"
# Backward-compatible alias. Its value now represents actual command-path
# registrations rather than event-name plus command-reference lines.
printf 'HAKIM_SESSIONSTART_REFERENCE_COUNT=%s\n' "$hook_registration_count"

if [[ ${#manifest_versions[@]} -eq 0 ]]; then
  printf 'HAKIM_PLUGIN_VERSIONS=(none)\n'
  version_status='NOT_OBSERVED'
else
  mapfile -t unique_versions < <(printf '%s\n' "${manifest_versions[@]}" | sort -u)
  printf 'HAKIM_PLUGIN_VERSIONS=%s\n' "$(IFS=,; echo "${unique_versions[*]}")"
  version_status='MATCH'
  for version in "${unique_versions[@]}"; do
    if [[ "$version" != "$EXPECTED_VERSION" ]]; then
      version_status='MISMATCH'
    fi
  done
fi
printf 'HAKIM_VERSION_STATUS=%s\n' "$version_status"

if (( manifest_count > 1 || hook_registration_count > 1 )); then
  printf 'STARTUP_DUPLICATION_STATUS=OBSERVED\n'
  printf 'NEXT_SAFE_ACTION=Review Codex /plugins and /hooks, keep one hakim@hakim-local installation and one trusted SessionStart hook, then restart Codex and rerun this doctor.\n'
else
  printf 'STARTUP_DUPLICATION_STATUS=NOT_OBSERVED\n'
  if [[ "$version_status" == 'MISMATCH' ]]; then
    printf 'NEXT_SAFE_ACTION=Use Codex /plugins to refresh or reinstall Hakim from the hakim-local marketplace, then restart Codex and rerun this doctor. Do not delete cache files directly.\n'
  else
    printf 'NEXT_SAFE_ACTION=Restart Codex and capture one clean startup transcript.\n'
  fi
fi

printf 'NO_AUTOMATIC_CLEANUP_PERFORMED=YES\n'
