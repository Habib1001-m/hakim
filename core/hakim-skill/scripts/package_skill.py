#!/usr/bin/env python3
"""Build the deterministic Hakim skill ZIP from the maintained product surface."""
from __future__ import annotations

import argparse
import os
import sys
import zipfile
from pathlib import Path

ARCHIVE_ROOT = "hakim-skill"
FIXED_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FIXED_FILE_MODE = 0o100644
ROOT_FILES = {
    "SKILL.md",
    "AGENTS.md",
    "INSTALL.md",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "VERSION",
    "capabilities.json",
}
SCRIPT_FILES = {"audit_complexity.py"}


def _require_regular(path: Path, label: str) -> None:
    if path.is_symlink() or not path.is_file():
        raise ValueError(f"Missing or unsafe required file: {label}")


def collect_files(source: Path) -> list[tuple[Path, str]]:
    source = source.resolve()
    for name in ROOT_FILES:
        _require_regular(source / name, name)
    _require_regular(source / "scripts" / "audit_complexity.py", "scripts/audit_complexity.py")
    skills = source / "skills"
    if skills.is_symlink() or not skills.is_dir():
        raise ValueError("Missing or unsafe required directory: skills/")

    selected: list[tuple[Path, str]] = []
    for name in sorted(ROOT_FILES):
        selected.append((source / name, f"{ARCHIVE_ROOT}/{name}"))
    for name in sorted(SCRIPT_FILES):
        selected.append((source / "scripts" / name, f"{ARCHIVE_ROOT}/scripts/{name}"))
    for root, dirs, files in os.walk(skills):
        root_path = Path(root)
        dirs[:] = sorted(d for d in dirs if not d.startswith("."))
        for filename in sorted(files):
            absolute = root_path / filename
            if absolute.is_symlink():
                raise ValueError(f"Symlink is not allowed in skill package: {absolute.relative_to(source)}")
            if not absolute.is_file() or filename.startswith("."):
                continue
            relative = absolute.relative_to(source).as_posix()
            selected.append((absolute, f"{ARCHIVE_ROOT}/{relative}"))
    return selected


def build(source: Path, output: Path, compression_level: int = 9) -> int:
    source = source.resolve()
    output = output.resolve()
    files = collect_files(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        output.unlink()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=compression_level) as archive:
        for absolute, archive_name in files:
            info = zipfile.ZipInfo(archive_name, FIXED_ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = FIXED_FILE_MODE << 16
            archive.writestr(info, absolute.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=compression_level)
    print(f"package created: {output} ({len(files)} members)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=Path("hakim-skill.zip"))
    parser.add_argument("--compression-level", type=int, default=9, choices=range(1, 10))
    args = parser.parse_args()
    try:
        return build(args.source, args.output, args.compression_level)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"package failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
