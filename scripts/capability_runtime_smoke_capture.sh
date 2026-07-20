#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${1:-}"
SKIP_PREFLIGHT="${HAKIM_SMOKE_SKIP_PREFLIGHT:-0}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/capability_runtime_smoke_capture.sh codex
  bash scripts/capability_runtime_smoke_capture.sh claude
  bash scripts/capability_runtime_smoke_capture.sh copilot

Creates a repo-side evidence packet and the exact manual prompts required for
Checkpoint P0.2A. It does not drive an interactive host session automatically.

Set HAKIM_SMOKE_SKIP_PREFLIGHT=1 only for the repository regression test. It
skips npm-based preflight commands but still renders the complete packet.
EOF
}

if [[ "$HOST" == "-h" || "$HOST" == "--help" ]]; then
  usage
  exit 0
fi

case "$HOST" in
  codex|claude|copilot) ;;
  *)
    usage >&2
    exit 2
    ;;
esac

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="$ROOT/dist/capability-runtime-evidence-${HOST}-${STAMP}"
mkdir -p "$OUT_DIR"

run_capture() {
  local name="$1"
  shift
  {
    echo '$' "$@"
    "$@"
  } > "$OUT_DIR/$name" 2>&1 || true
}

capture_version() {
  local command_name="$1"
  local output_name="$2"
  if command -v "$command_name" >/dev/null 2>&1; then
    run_capture "$output_name" "$command_name" --version
  else
    printf '%s is not available on PATH\n' "$command_name" > "$OUT_DIR/$output_name"
  fi
}

write_codex_prompts() {
  cat > "$OUT_DIR/PROMPTS.md" <<'EOF'
# Codex capability runtime prompts

Use a clean session after updating the repository and loading the repo-local Hakim plugin.

Run each capability separately and copy the complete response into `OPERATOR_TRANSCRIPT.md`.

```text
@hakim-help
```

```text
@hakim-review Review the current git diff only. Do not modify files.
```

```text
@hakim-audit Audit this repository for unnecessary complexity and unsupported claims. Do not modify files.
```

```text
@hakim-debt Review live Hakim debt markers in this repository. Separate live debt from synthetic examples and archived records. Do not modify files.
```

```text
@hakim-gain Show Hakim evidence status. Do not invent performance or ROI numbers.
```

Expected signals:

- every adjunct skill is discoverable or invokable;
- `hakim-help` lists six capabilities;
- review, audit, and debt remain read-only;
- debt separates live markers from synthetic/archived data;
- gain reports benchmark HOLD and no withdrawn metrics.
EOF
}

write_claude_prompts() {
  cat > "$OUT_DIR/PROMPTS.md" <<'EOF'
# Claude Code capability runtime prompts

Launch from the repository root:

```bash
claude --plugin-dir ./plugins/claude-code
```

Inspect `/plugin` or `/help`, then invoke the exposed forms of these skills. Slash syntax is preferred when shown by the active Claude Code version; natural-language activation is acceptable when the plugin skill is shown as the source.

```text
hakim-help
```

```text
hakim-review: Review the current git diff only. Do not modify files.
```

```text
hakim-audit: Audit this repository for unnecessary complexity and unsupported claims. Do not modify files.
```

```text
hakim-debt: Review live Hakim debt markers in this repository. Separate live debt from synthetic examples and archived records. Do not modify files.
```

```text
hakim-gain: Show Hakim evidence status. Do not invent performance or ROI numbers.
```

Expected signals:

- all five adjunct skills are discoverable or activated from the plugin;
- `hakim-help` lists six capabilities;
- review, audit, and debt remain read-only;
- debt separates live markers from synthetic/archived data;
- gain reports benchmark HOLD and no withdrawn metrics.
EOF
}

write_copilot_prompts() {
  cat > "$OUT_DIR/PROMPTS.md" <<'EOF'
# GitHub Copilot capability runtime prompts

Use repository context for `Habib1001-m/hakim`. Run each prompt separately and capture the complete answer plus any visible References/context-source list.

```text
Show Hakim help and list all six Hakim capabilities available in this repository.
```

```text
Hakim review the current diff only. Do not modify files.
```

```text
Run a Hakim repository audit for unnecessary complexity and unsupported claims. Do not modify files.
```

```text
Review Hakim debt in this repository. Separate live debt from synthetic examples and archived records. Do not modify files.
```

```text
Show Hakim evidence status. Do not invent performance or ROI numbers.
```

Expected signals:

- behavior follows all six capability routes in repository instructions;
- no slash-command support is promised;
- review, audit, and debt remain read-only;
- debt separates live markers from synthetic/archived data;
- gain reports benchmark HOLD and no withdrawn metrics;
- record whether `.github/copilot-instructions.md` appears as a source/reference when the surface exposes that UI.
EOF
}

write_transcript_template() {
  {
    printf '# Operator Capability Runtime Transcript\n\n'
    printf 'Host: %s  \n' "$HOST"
    printf 'Generated: %s  \n' "$STAMP"
    printf 'Repository HEAD: see `git-head.txt`\n\n'
    cat <<'EOF'
## Session discovery

Paste the host version, plugin/instruction discovery output, and any References/source list here.

## hakim-help

Prompt used:

Response:

Verdict: PENDING

## hakim-review

Prompt used:

Response:

Verdict: PENDING

## hakim-audit

Prompt used:

Response:

Verdict: PENDING

## hakim-debt

Prompt used:

Response:

Verdict: PENDING

## hakim-gain

Prompt used:

Response:

Verdict: PENDING

## Safety and truth checks

- [ ] No capability modified repository files without an explicit request.
- [ ] No withdrawn benchmark metric was presented as a Hakim result.
- [ ] No performance or ROI number was invented.
- [ ] Host syntax was described accurately.
- [ ] The response behavior matched the relevant capability contract.

## Final host verdict

EOF
    printf 'HOST=%s\n' "$HOST"
    cat <<'EOF'
DISCOVERY=PENDING
HELP=PENDING
REVIEW=PENDING
AUDIT=PENDING
DEBT=PENDING
GAIN=PENDING
HOST_RUNTIME_PASS=PENDING
EOF
  } > "$OUT_DIR/OPERATOR_TRANSCRIPT.md"
}

write_packet_readme() {
  {
    printf '# Hakim Capability Runtime Evidence Packet\n\n'
    printf 'Host: %s  \n' "$HOST"
    printf 'Generated: %s\n\n' "$STAMP"
    cat <<'EOF'
This packet captures repo-side readiness for Checkpoint P0.2A. A real interactive host transcript is still required before per-capability runtime PASS.

Included files:

- `capabilities.json`
- `capability-parity.txt`
- `npm-test.txt`
- `git-head.txt`
- `git-status-short.txt`
- `PROMPTS.md`
- `OPERATOR_TRANSCRIPT.md`
- host-specific version or instruction files

Next action:

1. Open `PROMPTS.md`.
2. Run the prompts in the selected host.
3. Paste complete outputs into `OPERATOR_TRANSCRIPT.md`.
4. Return the transcript for evidence acceptance.
EOF
  } > "$OUT_DIR/README.md"
}

cd "$ROOT"

run_capture git-head.txt git rev-parse HEAD
run_capture git-status-short.txt git status --short
run_capture node-version.txt node --version
run_capture npm-version.txt npm --version

if [[ "$SKIP_PREFLIGHT" == "1" ]]; then
  printf 'Skipped by HAKIM_SMOKE_SKIP_PREFLIGHT=1\n' > "$OUT_DIR/capability-parity.txt"
  printf 'Skipped by HAKIM_SMOKE_SKIP_PREFLIGHT=1\n' > "$OUT_DIR/npm-test.txt"
else
  run_capture capability-parity.txt npm run check:capability-parity
  run_capture npm-test.txt npm test
fi

cp core/hakim-skill/capabilities.json "$OUT_DIR/capabilities.json"

case "$HOST" in
  codex)
    capture_version codex codex-version.txt
    find plugins/codex/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print | sort > "$OUT_DIR/host-skill-files.txt"
    write_codex_prompts
    ;;
  claude)
    capture_version claude claude-version.txt
    find plugins/claude-code/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print | sort > "$OUT_DIR/host-skill-files.txt"
    write_claude_prompts
    ;;
  copilot)
    cp .github/copilot-instructions.md "$OUT_DIR/copilot-instructions.md"
    write_copilot_prompts
    ;;
esac

write_transcript_template
write_packet_readme

printf 'Capability runtime evidence packet created: %s\n' "$OUT_DIR"
