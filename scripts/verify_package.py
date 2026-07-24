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


def verify_structure(zf: zipfile.ZipFile) -> list[str]:
    errors: list[str] = []
    bad = zf.testzip()
    if bad:
        errors.append(f"corrupt zip member: {bad}")
        return errors
    names = set(zf.namelist())
    missing = sorted(REQUIRED - names)
    if missing:
        errors.append("missing required package members: " + ", ".join(missing))
    legacy = sorted(FORBIDDEN_LEGACY_MEMBERS & names)
    if legacy:
        errors.append("legacy documentation must not ship in the public skill package: " + ", ".join(legacy))
    return errors


def verify_docs(zf: zipfile.ZipFile) -> list[str]:
    errors: list[str] = []
    names = set(zf.namelist())
    for name in sorted(item for item in names if item.endswith(".md")):
        text = zf.read(name).decode("utf-8")
        for token, reason in FORBIDDEN_ACTIVE_DOC_TOKENS.items():
            if token in text:
                errors.append(f"{name} contains {reason}: {token}")
    notices_name = "hakim-skill/THIRD_PARTY_NOTICES.md"
    if notices_name in names:
        notices = zf.read(notices_name).decode("utf-8")
        if "Copyright (c) 2026 DietrichGebert" not in notices:
            errors.append("packaged third-party notice is missing Ponytail attribution")
    return errors


def verify_conformance(zf: zipfile.ZipFile) -> list[str]:
    errors: list[str] = []
    profiles = json.loads(zf.read("hakim-skill/conformance/policy-profiles.json"))
    suite = json.loads(zf.read("hakim-skill/conformance/suite.json"))
    bindings = json.loads(zf.read("hakim-skill/conformance/adapter-bindings.json"))
    scenarios = json.loads(zf.read("hakim-skill/conformance/runtime-scenarios.json"))
    evidence_schema = json.loads(zf.read("hakim-skill/conformance/runtime-evidence.schema.json"))
    telemetry_schema = json.loads(zf.read("hakim-skill/conformance/outcome-telemetry.schema.json"))
    if len(profiles.get("profiles", [])) != 4:
        errors.append("packaged policy profile count must be 4")
    if len(suite.get("cases", [])) != 10:
        errors.append("packaged conformance case count must be 10")
    if len(scenarios.get("scenarios", [])) != 10:
        errors.append("packaged runtime scenario count must be 10")
    expected_hosts = {"codex", "claude-code", "github-copilot", "opencode"}
    if set(bindings.get("hosts", {})) != expected_hosts:
        errors.append("packaged conformance host bindings are incomplete or unexpected")
    if evidence_schema.get("schema_id") != "hakim-runtime-conformance-evidence-v2":
        errors.append("packaged runtime evidence schema is missing or stale")
    pass_requirements = evidence_schema.get("pass_requirements", {})
    if not pass_requirements.get("exact_prompt_required"):
        errors.append("packaged runtime evidence schema must require exact prompt fidelity")
    if not pass_requirements.get("no_competing_policy_context"):
        errors.append("packaged runtime evidence schema must require policy isolation")
    if telemetry_schema.get("schema_id") != "hakim-outcome-telemetry-v1":
        errors.append("packaged outcome telemetry schema is missing or stale")
    authority = telemetry_schema.get("authority", {})
    if authority.get("verdict_authority") is not False:
        errors.append("outcome telemetry must not have runtime verdict authority")
    if authority.get("benchmark_authority") is not False:
        errors.append("outcome telemetry must not have benchmark authority")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_path", type=Path)
    parser.add_argument(
        "--section",
        choices=["all", "structure", "docs", "conformance"],
        default="all",
        help="run all package checks or one named verification layer",
    )
    args = parser.parse_args()
    if not args.zip_path.exists():
        print(f"missing package: {args.zip_path}", file=sys.stderr)
        return 2

    with zipfile.ZipFile(args.zip_path) as zf:
        checks = {
            "structure": verify_structure,
            "docs": verify_docs,
            "conformance": verify_conformance,
        }
        selected = checks.items() if args.section == "all" else [(args.section, checks[args.section])]
        errors: list[str] = []
        for section, check in selected:
            for error in check(zf):
                errors.append(f"{section}: {error}")
        if errors:
            print("package verification failed:", *errors, sep="\n- ", file=sys.stderr)
            return 1
        names = set(zf.namelist())

    print(f"package ok: {args.zip_path} ({len(names)} members; section={args.section})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
