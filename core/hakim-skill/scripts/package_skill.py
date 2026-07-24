#!/usr/bin/env python3
"""Hakim skill packager.

Creates a deterministic ZIP archive from the explicit maintained Hakim package
surface. Source-repository files are not shipped merely because they happen to
live under ``core/hakim-skill``.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = "1.2.0"
ARCHIVE_ROOT = "hakim-skill"
DEFAULT_OUTPUT = "hakim-skill-package.zip"

PACKAGE_ROOT_FILES = {
    "SKILL.md",
    "AGENTS.md",
    "INSTALL.md",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "VERSION",
    "capabilities.json",
}
PACKAGE_SUBDIRS = {"scripts", "skills", "conformance"}
REQUIRED_FILES = sorted(PACKAGE_ROOT_FILES)
REQUIRED_SUBDIRS = sorted(PACKAGE_SUBDIRS)

EXCLUDED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".tox",
    ".nox",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "__pycache__",
    "node_modules",
    "venv",
    ".venv",
    "env",
    "build",
    "dist",
}
EXCLUDED_FILENAMES = {
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    ".gitignore",
    ".gitattributes",
    "tags",
}
EXCLUDED_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".class",
    ".o",
    ".obj",
    ".swp",
    ".swo",
    ".bak",
    ".orig",
    ".tmp",
    ".temp",
    ".log",
    ".zip",
}


def is_excluded_dir(dirname: str) -> bool:
    return dirname.startswith(".") or dirname in EXCLUDED_DIRS or dirname.endswith(".egg-info")


def is_excluded_file(filename: str) -> bool:
    if filename.startswith(".") or filename.endswith("~"):
        return True
    if filename in EXCLUDED_FILENAMES:
        return True
    return Path(filename).suffix.lower() in EXCLUDED_EXTENSIONS


def validate_structure(source_dir: Path) -> tuple[bool, list[str]]:
    issues: list[str] = []
    for required in REQUIRED_FILES:
        if not (source_dir / required).is_file():
            issues.append(f"Missing required file: {required}")
    for required in REQUIRED_SUBDIRS:
        if not (source_dir / required).is_dir():
            issues.append(f"Missing required subdirectory: {required}/")
    return not issues, issues


def collect_files(source_dir: Path, output_path: Path | None = None) -> list[tuple[Path, str]]:
    source_dir = source_dir.resolve()
    resolved_output = output_path.resolve() if output_path else None
    collected: list[tuple[Path, str]] = []

    for root, dirs, files in os.walk(source_dir):
        root_path = Path(root).resolve()
        if root_path == source_dir:
            dirs[:] = sorted(dirname for dirname in dirs if dirname in PACKAGE_SUBDIRS)
            candidate_files = sorted(filename for filename in files if filename in PACKAGE_ROOT_FILES)
        else:
            dirs[:] = sorted(dirname for dirname in dirs if not is_excluded_dir(dirname))
            candidate_files = sorted(files)

        for filename in candidate_files:
            if is_excluded_file(filename):
                continue
            absolute_path = (root_path / filename).resolve()
            if resolved_output and absolute_path == resolved_output:
                continue
            relative_path = absolute_path.relative_to(source_dir)
            collected.append((absolute_path, f"{ARCHIVE_ROOT}/{relative_path.as_posix()}"))

    return collected


def create_package(
    source_dir: Path,
    output_path: Path,
    compression_level: int = 9,
    strict: bool = True,
) -> dict[str, Any]:
    source_dir = source_dir.resolve()
    output_path = output_path.resolve()
    if not source_dir.exists():
        raise FileNotFoundError(f"Source directory not found: {source_dir}")
    if not source_dir.is_dir():
        raise NotADirectoryError(f"Not a directory: {source_dir}")

    valid, issues = validate_structure(source_dir)
    if not valid and strict:
        raise ValueError("Invalid skill structure:\n  - " + "\n  - ".join(issues))
    for issue in issues:
        print(f"Warning: {issue}", file=sys.stderr)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    files = collect_files(source_dir, output_path)
    if not files:
        raise ValueError("No eligible files found to package")
    if output_path.exists():
        output_path.unlink()

    stats: dict[str, Any] = {
        "source_dir": str(source_dir),
        "output_path": str(output_path),
        "files_included": 0,
        "files_by_dir": {},
        "total_original_bytes": 0,
        "total_compressed_bytes": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    with zipfile.ZipFile(
        output_path,
        mode="w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=compression_level,
    ) as archive:
        for absolute_path, archive_path in files:
            file_size = absolute_path.stat().st_size
            archive.write(absolute_path, archive_path)
            stats["files_included"] += 1
            stats["total_original_bytes"] += file_size
            directory = Path(archive_path).parts[1] if len(Path(archive_path).parts) > 1 else "(root)"
            stats["files_by_dir"][directory] = stats["files_by_dir"].get(directory, 0) + 1

    stats["total_compressed_bytes"] = output_path.stat().st_size
    original = stats["total_original_bytes"]
    stats["compression_ratio_percent"] = (
        round((1 - stats["total_compressed_bytes"] / original) * 100, 1) if original else 0.0
    )
    return stats


def verify_package(zip_path: Path) -> tuple[bool, list[str]]:
    issues: list[str] = []
    if not zip_path.exists():
        return False, [f"Archive not found: {zip_path}"]
    try:
        with zipfile.ZipFile(zip_path) as archive:
            bad = archive.testzip()
            if bad:
                issues.append(f"Corrupt ZIP member: {bad}")
            names = {info.filename for info in archive.infolist()}
            for info in archive.infolist():
                name = info.filename
                parts = Path(name).parts
                if name.startswith("/") or (len(name) > 1 and name[1] == ":"):
                    issues.append(f"Absolute path: {name}")
                if ".." in parts:
                    issues.append(f"Parent traversal: {name}")
                if "\\" in name:
                    issues.append(f"Backslash in path: {name}")
                if any(part.startswith(".") for part in name.split("/")):
                    issues.append(f"Hidden file: {name}")
                if name.endswith(tuple(EXCLUDED_EXTENSIONS)):
                    issues.append(f"Excluded file included: {name}")
                if info.compress_type != zipfile.ZIP_DEFLATED:
                    issues.append(f"Wrong compression for {name}")
                if len(parts) < 2 or parts[0] != ARCHIVE_ROOT:
                    issues.append(f"Unexpected archive root: {name}")
                elif len(parts) == 2 and parts[1] not in PACKAGE_ROOT_FILES:
                    issues.append(f"Unapproved root package member: {name}")
                elif len(parts) > 2 and parts[1] not in PACKAGE_SUBDIRS:
                    issues.append(f"Unapproved package subdirectory: {name}")
            for required in REQUIRED_FILES:
                expected = f"{ARCHIVE_ROOT}/{required}"
                if expected not in names:
                    issues.append(f"Missing required file in archive: {expected}")
    except zipfile.BadZipFile as error:
        return False, [f"Corrupt ZIP file: {error}"]
    return not issues, issues


def list_package(zip_path: Path) -> str:
    with zipfile.ZipFile(zip_path) as archive:
        return "\n".join(info.filename for info in archive.infolist())


def format_report(stats: dict[str, Any]) -> str:
    lines = [
        "=" * 70,
        "HAKIM SKILL PACKAGE CREATED",
        "=" * 70,
        f"Source: {stats['source_dir']}",
        f"Output: {stats['output_path']}",
        f"Files included: {stats['files_included']}",
        f"Original size: {stats['total_original_bytes']:,} bytes",
        f"Compressed size: {stats['total_compressed_bytes']:,} bytes",
        f"Compression ratio: {stats['compression_ratio_percent']:.1f}%",
    ]
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Hakim Skill Packager")
    parser.add_argument("--source", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, default=Path(DEFAULT_OUTPUT))
    parser.add_argument("--compression-level", type=int, choices=range(10), default=9)
    parser.add_argument("--strict", dest="strict", action="store_true", default=True)
    parser.add_argument("--no-strict", dest="strict", action="store_false")
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--version", action="version", version=VERSION)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        if args.verify:
            valid, issues = verify_package(args.output)
            if args.json:
                print(json.dumps({"valid": valid, "issues": issues}, indent=2))
            else:
                print("Package verification passed" if valid else "Package verification failed")
                for issue in issues:
                    print(f"  - {issue}")
            return 0 if valid else 1
        if args.list:
            print(list_package(args.output))
            return 0
        if args.dry_run:
            files = collect_files(args.source.resolve(), args.output.resolve())
            payload = [archive for _, archive in files]
            print(json.dumps(payload, indent=2) if args.json else "\n".join(payload))
            return 0
        stats = create_package(args.source, args.output, args.compression_level, args.strict)
        print(json.dumps(stats, indent=2) if args.json else format_report(stats))
        valid, issues = verify_package(args.output)
        if not valid:
            for issue in issues:
                print(f"Verification error: {issue}", file=sys.stderr)
            return 1
        return 0
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
