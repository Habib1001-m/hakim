#!/usr/bin/env python3
"""Build the deterministic Hakim skill ZIP from the maintained product surface."""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

ARCHIVE_ROOT = "hakim-skill"
FIXED_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FIXED_FILE_MODE = 0o100644
ROOT_FILES = (
    "SKILL.md",
    "INSTALL.md",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "VERSION",
    "capabilities.json",
)
SPECIALIZED_SKILLS = ("audit", "debt", "help", "review", "status")
REQUIRED_FRONTMATTER_KEYS = {"name", "description"}
SAFE_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
UNQUOTED_FORBIDDEN_PREFIXES = frozenset("-?:,[]{}#&*!|>'\"%@`")


def _require_regular(path: Path, label: str) -> None:
    if path.is_symlink() or not path.is_file():
        raise ValueError(f"Missing or unsafe required file: {label}")


def _decode_frontmatter_scalar(raw: str, label: str) -> str:
    value = raw.strip()
    if not value:
        raise ValueError(f"Invalid frontmatter in {label}: empty scalar")
    if value.startswith('"'):
        try:
            decoded = json.loads(value)
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid frontmatter in {label}: malformed quoted scalar") from error
        if not isinstance(decoded, str) or not decoded.strip():
            raise ValueError(f"Invalid frontmatter in {label}: scalar must be a non-empty string")
        return decoded
    if value.startswith("'") or value[0] in UNQUOTED_FORBIDDEN_PREFIXES:
        raise ValueError(f"Invalid frontmatter in {label}: unsupported YAML scalar form")
    if ": " in value or " #" in value or "\t" in value:
        raise ValueError(f"Invalid frontmatter in {label}: unsafe unquoted YAML scalar")
    return value


def _validate_skill_frontmatter(path: Path, expected_name: str, label: str) -> None:
    _require_regular(path, label)
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise ValueError(f"Invalid frontmatter in {label}: file is not UTF-8") from error
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise ValueError(f"Invalid frontmatter in {label}: missing opening delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError as error:
        raise ValueError(f"Invalid frontmatter in {label}: missing closing delimiter") from error

    fields: dict[str, str] = {}
    for line in lines[1:end]:
        if not line or line[0].isspace():
            raise ValueError(f"Invalid frontmatter in {label}: multiline or indented YAML is not allowed")
        key, separator, raw = line.partition(":")
        if not separator or key not in REQUIRED_FRONTMATTER_KEYS:
            raise ValueError(f"Invalid frontmatter in {label}: unsupported key or syntax")
        if key in fields:
            raise ValueError(f"Invalid frontmatter in {label}: duplicate key {key}")
        fields[key] = _decode_frontmatter_scalar(raw, label)

    if set(fields) != REQUIRED_FRONTMATTER_KEYS:
        raise ValueError(f"Invalid frontmatter in {label}: expected exactly name and description")
    if not SAFE_NAME_RE.fullmatch(fields["name"]):
        raise ValueError(f"Invalid frontmatter in {label}: unsafe skill name")
    if fields["name"] != expected_name:
        raise ValueError(
            f"Invalid frontmatter in {label}: name {fields['name']!r} does not match {expected_name!r}"
        )
    if len(fields["description"]) > 1024:
        raise ValueError(f"Invalid frontmatter in {label}: description exceeds 1024 characters")


def _collect_specialized_skill_files(source: Path) -> list[tuple[Path, str]]:
    skills = source / "skills"
    if skills.is_symlink() or not skills.is_dir():
        raise ValueError("Missing or unsafe required directory: skills/")

    entries = list(skills.iterdir())
    if any(entry.is_symlink() or not entry.is_dir() for entry in entries):
        raise ValueError("Unexpected non-directory entry or symlink in skill directories")
    observed = {entry.name for entry in entries}
    expected = set(SPECIALIZED_SKILLS)
    if observed != expected:
        raise ValueError(
            "Unexpected skill directories: "
            f"expected {sorted(expected)}, observed {sorted(observed)}"
        )

    selected: list[tuple[Path, str]] = []
    for name in SPECIALIZED_SKILLS:
        directory = skills / name
        children = list(directory.iterdir())
        if len(children) != 1 or children[0].name != "SKILL.md":
            raise ValueError(f"Unexpected files in skill directory: skills/{name}/")
        skill = directory / "SKILL.md"
        label = f"skills/{name}/SKILL.md"
        _validate_skill_frontmatter(skill, name, label)
        selected.append((skill, f"{ARCHIVE_ROOT}/{label}"))
    return selected


def collect_files(source: Path) -> list[tuple[Path, str]]:
    source = source.resolve()
    for name in ROOT_FILES:
        _require_regular(source / name, name)
    _require_regular(source / "scripts" / "audit_complexity.py", "scripts/audit_complexity.py")
    _validate_skill_frontmatter(source / "SKILL.md", "hakim", "SKILL.md")

    selected = [(source / name, f"{ARCHIVE_ROOT}/{name}") for name in ROOT_FILES]
    selected.append((source / "scripts" / "audit_complexity.py", f"{ARCHIVE_ROOT}/scripts/audit_complexity.py"))
    selected.extend(_collect_specialized_skill_files(source))
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
