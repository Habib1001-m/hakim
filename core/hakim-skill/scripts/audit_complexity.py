#!/usr/bin/env python3
"""Bounded Python heuristic scan used by Hakim audit workflows.

This stdlib-only helper scans Python files for two explicit review heuristics. It
is not a repository-wide complexity audit, dead-code detector, duplication
analyzer, correctness review, or security review. The ``--intensity`` value is
retained as a provenance label only; it does not select a different ruleset.

Exit codes:
  0: no findings and no parse errors
  1: heuristic findings found
  2: invalid target, execution failure, or parse errors
"""
from __future__ import annotations

import argparse
import ast
import json
import sys
from pathlib import Path
from typing import Any

VERSION = "1.2.0"
TOOL_ID = "hakim-python-heuristic-scan"
IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
}
KNOWN_THIRD_PARTY_IMPORTS = {
    "click",
    "numpy",
    "pandas",
    "requests",
    "yaml",
}
RULES = (
    {
        "id": "known-third-party-import-review",
        "type": "third_party_import_review",
        "severity": "medium",
        "description": "Flag imports from the fixed known-third-party review list; necessity is not inferred.",
    },
    {
        "id": "too-many-positional-parameters",
        "type": "positional_parameter_count_review",
        "severity": "low",
        "description": "Flag functions declaring more than six positional parameters for manual interface review.",
        "maximum_positional_parameters": 6,
    },
)


def validate_target(target: Path) -> Path:
    root = target.resolve()
    if not root.exists():
        raise FileNotFoundError(f"target does not exist: {root}")
    if not root.is_file() and not root.is_dir():
        raise ValueError(f"target must be a regular file or directory: {root}")
    if root.is_file() and root.suffix != ".py":
        raise ValueError(f"target file must use the .py suffix: {root}")
    return root


def iter_python_files(root: Path) -> list[Path]:
    if root.is_file():
        return [root]
    files: list[Path] = []
    for path in root.rglob("*.py"):
        if any(part in IGNORED_DIRECTORIES for part in path.parts):
            continue
        files.append(path)
    return sorted(files)


def imported_roots(node: ast.AST) -> list[str]:
    if isinstance(node, ast.Import):
        return [alias.name.split(".")[0] for alias in node.names]
    if isinstance(node, ast.ImportFrom) and node.module:
        return [node.module.split(".")[0]]
    return []


def positional_parameter_count(node: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    return len(node.args.posonlyargs) + len(node.args.args)


def audit_file(path: Path, root: Path) -> tuple[list[dict[str, Any]], dict[str, str] | None]:
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
    except (SyntaxError, UnicodeDecodeError, OSError) as error:
        return [], {
            "file": str(path.relative_to(root)) if path.is_relative_to(root) else str(path),
            "error": f"{error.__class__.__name__}: {error}",
        }

    findings: list[dict[str, Any]] = []
    rel = str(path.relative_to(root)) if path.is_relative_to(root) else str(path)
    for node in ast.walk(tree):
        for name in imported_roots(node):
            if name in KNOWN_THIRD_PARTY_IMPORTS:
                findings.append({
                    "file": rel,
                    "line": getattr(node, "lineno", 0),
                    "rule_id": "known-third-party-import-review",
                    "type": "third_party_import_review",
                    "severity": "medium",
                    "message": (
                        f"Review whether known third-party import `{name}` is necessary; "
                        "this heuristic does not prove it is removable."
                    ),
                })
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            parameter_count = positional_parameter_count(node)
            if parameter_count > 6:
                findings.append({
                    "file": rel,
                    "line": node.lineno,
                    "rule_id": "too-many-positional-parameters",
                    "type": "positional_parameter_count_review",
                    "severity": "low",
                    "message": (
                        f"Function `{node.name}` declares {parameter_count} positional parameters; "
                        "review whether its interface can be simplified."
                    ),
                })
    return findings, None


def run_audit(target: Path, intensity: str) -> dict[str, Any]:
    root = validate_target(target)
    files = iter_python_files(root)
    findings: list[dict[str, Any]] = []
    parse_errors: list[dict[str, str]] = []

    for file_path in files:
        found, error = audit_file(file_path, root if root.is_dir() else root.parent)
        findings.extend(found)
        if error:
            parse_errors.append(error)

    return {
        "tool": TOOL_ID,
        "display_name": "Hakim Python Heuristic Scan",
        "version": VERSION,
        "mode": "READ_ONLY_DETERMINISTIC",
        "target": str(root),
        "coverage": {
            "language": "python",
            "file_extensions": [".py"],
            "file_selection": "target .py file or recursive .py files excluding registered ignored directories",
            "ignored_directories": sorted(IGNORED_DIRECTORIES),
            "rules": [dict(rule) for rule in RULES],
            "repository_wide_complexity_audit": False,
            "dead_code_analysis": "NOT_PERFORMED",
            "duplication_analysis": "NOT_PERFORMED",
            "correctness_review": "NOT_PERFORMED",
            "security_review": "NOT_PERFORMED",
            "manual_verification_required": True,
        },
        "intensity": intensity,
        "intensity_semantics": "PROVENANCE_LABEL_ONLY",
        "intensity_applies_to_rules": False,
        "summary": {
            "files_scanned": len(files),
            "total_findings": len(findings),
            "files_with_errors": len(parse_errors),
        },
        "violations": findings,
        "parse_errors": parse_errors,
    }


def format_text(payload: dict[str, Any]) -> str:
    summary = payload["summary"]
    coverage = payload["coverage"]
    lines = [
        "=" * 70,
        "HAKIM PYTHON HEURISTIC SCAN",
        "=" * 70,
        f"Target: {payload['target']}",
        "Coverage: Python .py files; 2 deterministic review heuristics",
        "Repository-wide complexity audit: NOT_PERFORMED",
        "Correctness review: NOT_PERFORMED",
        "Security review: NOT_PERFORMED",
        f"Intensity label: {payload['intensity']} ({payload['intensity_semantics']})",
        f"Rules: {', '.join(rule['id'] for rule in coverage['rules'])}",
        f"Files scanned: {summary['files_scanned']}",
        f"Findings: {summary['total_findings']}",
        f"Parse errors: {summary['files_with_errors']}",
    ]
    for error in payload["parse_errors"]:
        lines.append(f"PARSE ERROR {error['file']}: {error['error']}")
    for finding in payload["violations"]:
        lines.append(
            f"{finding['file']}:{finding['line']} [{finding['rule_id']}] {finding['message']}"
        )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Bounded Python heuristic scan; not a repository-wide complexity audit"
    )
    parser.add_argument("target", nargs="?", default=".", type=Path)
    parser.add_argument(
        "--intensity",
        choices=["lite", "full", "ultra"],
        default="full",
        help="legacy provenance label only; all values execute the same two Python heuristics",
    )
    parser.add_argument("--output", choices=["text", "json"], default="text")
    parser.add_argument("--version", action="version", version=VERSION)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        payload = run_audit(args.target, args.intensity)
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(f"scan execution error: {error}", file=sys.stderr)
        return 2

    print(json.dumps(payload, indent=2) if args.output == "json" else format_text(payload))
    if payload["summary"]["files_with_errors"]:
        return 2
    if payload["summary"]["total_findings"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
