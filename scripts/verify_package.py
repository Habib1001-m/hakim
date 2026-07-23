#!/usr/bin/env python3
"""Verify the generated Hakim skill ZIP package."""
from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path

REQUIRED = {
    "hakim-skill/SKILL.md",
    "hakim-skill/AGENTS.md",
    "hakim-skill/LICENSE",
    "hakim-skill/THIRD_PARTY_NOTICES.md",
    "hakim-skill/conformance/policy-profiles.json",
    "hakim-skill/conformance/suite.json",
    "hakim-skill/conformance/adapter-bindings.json",
    "hakim-skill/conformance/runtime-scenarios.json",
    "hakim-skill/conformance/runtime-evidence.schema.json",
    "hakim-skill/conformance/outcome-telemetry.schema.json",
    "hakim-skill/scripts/audit_complexity.py",
    "hakim-skill/scripts/package_skill.py",
    "hakim-skill/scripts/check_rule_copies.js",
}

FORBIDDEN_LEGACY_MEMBERS = {
    "hakim-skill/references/grpo_mathematics.md",
    "hakim-skill/references/workflow_patterns.md",
    "hakim-skill/references/progressive_disclosure.md",
    "hakim-skill/references/yagni_guidelines.md",
    "hakim-skill/assets/benchmark_results.md",
    "hakim-skill/assets/technical_debt_ledger.json",
}

FORBIDDEN_ACTIVE_DOC_TOKENS = {
    "python core/hakim-skill/scripts/audit_complexity.py": "source-checkout-only audit command",
    "ARCHIVE_POLICY.md": "missing historical archive authority",
    "mcp deploy hakim-skill-package.zip": "obsolete MCP deployment instruction",
    "MCP namespace must remain": "obsolete MCP compatibility contract",
    "A2A message schema must remain": "obsolete A2A compatibility contract",
    "T-YAML-001": "obsolete private-era test taxonomy",
    "R1-R6 reviews": "obsolete private-era review taxonomy",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_path", type=Path)
    args = parser.parse_args()
    if not args.zip_path.exists():
        print(f"missing package: {args.zip_path}", file=sys.stderr)
        return 2
    with zipfile.ZipFile(args.zip_path) as zf:
        bad = zf.testzip()
        if bad:
            print(f"corrupt zip member: {bad}", file=sys.stderr)
            return 1
        names = set(zf.namelist())
        missing = sorted(REQUIRED - names)
        if missing:
            print("missing required package members:", *missing, sep="\n- ", file=sys.stderr)
            return 1
        legacy = sorted(FORBIDDEN_LEGACY_MEMBERS & names)
        if legacy:
            print("legacy documentation must not ship in the public skill package:", *legacy, sep="\n- ", file=sys.stderr)
            return 1
        for name in sorted(item for item in names if item.endswith(".md")):
            text = zf.read(name).decode("utf-8")
            for token, reason in FORBIDDEN_ACTIVE_DOC_TOKENS.items():
                if token in text:
                    print(f"{name} contains {reason}: {token}", file=sys.stderr)
                    return 1
        notices = zf.read("hakim-skill/THIRD_PARTY_NOTICES.md").decode("utf-8")
        if "Copyright (c) 2026 DietrichGebert" not in notices:
            print("packaged third-party notice is missing Ponytail attribution", file=sys.stderr)
            return 1
        profiles = json.loads(zf.read("hakim-skill/conformance/policy-profiles.json"))
        suite = json.loads(zf.read("hakim-skill/conformance/suite.json"))
        bindings = json.loads(zf.read("hakim-skill/conformance/adapter-bindings.json"))
        scenarios = json.loads(zf.read("hakim-skill/conformance/runtime-scenarios.json"))
        evidence_schema = json.loads(zf.read("hakim-skill/conformance/runtime-evidence.schema.json"))
        telemetry_schema = json.loads(zf.read("hakim-skill/conformance/outcome-telemetry.schema.json"))
        if len(profiles.get("profiles", [])) != 4:
            print("packaged policy profile count must be 4", file=sys.stderr)
            return 1
        if len(suite.get("cases", [])) != 10:
            print("packaged conformance case count must be 10", file=sys.stderr)
            return 1
        if len(scenarios.get("scenarios", [])) != 10:
            print("packaged runtime scenario count must be 10", file=sys.stderr)
            return 1
        expected_hosts = {"codex", "claude-code", "github-copilot", "opencode"}
        if set(bindings.get("hosts", {})) != expected_hosts:
            print(
                "packaged conformance host bindings are incomplete or unexpected",
                file=sys.stderr,
            )
            return 1
        if evidence_schema.get("schema_id") != "hakim-runtime-conformance-evidence-v2":
            print("packaged runtime evidence schema is missing or stale", file=sys.stderr)
            return 1
        pass_requirements = evidence_schema.get("pass_requirements", {})
        if not pass_requirements.get("exact_prompt_required"):
            print("packaged runtime evidence schema must require exact prompt fidelity", file=sys.stderr)
            return 1
        if not pass_requirements.get("no_competing_policy_context"):
            print("packaged runtime evidence schema must require policy isolation", file=sys.stderr)
            return 1
        if telemetry_schema.get("schema_id") != "hakim-outcome-telemetry-v1":
            print("packaged outcome telemetry schema is missing or stale", file=sys.stderr)
            return 1
        authority = telemetry_schema.get("authority", {})
        if authority.get("verdict_authority") is not False:
            print("outcome telemetry must not have runtime verdict authority", file=sys.stderr)
            return 1
        if authority.get("benchmark_authority") is not False:
            print("outcome telemetry must not have benchmark authority", file=sys.stderr)
            return 1
    print(f"package ok: {args.zip_path} ({len(names)} members)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
