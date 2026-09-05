#!/usr/bin/env python3
"""Verify the generated Hakim skill ZIP package."""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

FIXED_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
FIXED_FILE_MODE = 0o100644
EXPECTED = {
    "hakim-skill/SKILL.md",
    "hakim-skill/INSTALL.md",
    "hakim-skill/README.md",
    "hakim-skill/LICENSE",
    "hakim-skill/THIRD_PARTY_NOTICES.md",
    "hakim-skill/VERSION",
    "hakim-skill/capabilities.json",
    "hakim-skill/scripts/audit_complexity.py",
    "hakim-skill/skills/review/SKILL.md",
    "hakim-skill/skills/audit/SKILL.md",
    "hakim-skill/skills/debt/SKILL.md",
    "hakim-skill/skills/status/SKILL.md",
    "hakim-skill/skills/help/SKILL.md",
}
CAPABILITY_IDS = ["hakim", "review", "audit", "debt", "status", "help"]


def verify(zip_path: Path) -> list[str]:
    errors: list[str] = []
    try:
        with zipfile.ZipFile(zip_path) as archive:
            bad = archive.testzip()
            if bad:
                return [f"corrupt zip member: {bad}"]
            infos = archive.infolist()
            names = {info.filename for info in infos}
            if names != EXPECTED:
                missing = sorted(EXPECTED - names)
                extras = sorted(names - EXPECTED)
                if missing:
                    errors.append("missing package members: " + ", ".join(missing))
                if extras:
                    errors.append("unexpected package members: " + ", ".join(extras))
            if len(names) != len(infos):
                errors.append("duplicate ZIP member detected")
            for info in infos:
                if info.date_time != FIXED_ZIP_TIMESTAMP:
                    errors.append(f"non-deterministic timestamp: {info.filename}")
                if info.create_system != 3 or (info.external_attr >> 16) != FIXED_FILE_MODE:
                    errors.append(f"non-deterministic mode: {info.filename}")
                if info.filename.startswith("/") or "\\" in info.filename or ".." in Path(info.filename).parts:
                    errors.append(f"unsafe package path: {info.filename}")
            if errors:
                return errors
            version = archive.read("hakim-skill/VERSION").decode("utf-8").strip()
            if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?", version):
                errors.append("invalid packaged VERSION")
            capabilities = json.loads(archive.read("hakim-skill/capabilities.json"))
            if [item.get("id") for item in capabilities.get("capabilities", [])] != CAPABILITY_IDS:
                errors.append("capability inventory does not match the maintained six-capability contract")
            notices = archive.read("hakim-skill/THIRD_PARTY_NOTICES.md").decode("utf-8")
            if "Copyright (c) 2026 DietrichGebert" not in notices:
                errors.append("third-party notice is missing Ponytail attribution")
    except (OSError, zipfile.BadZipFile, UnicodeDecodeError, json.JSONDecodeError) as error:
        return [str(error)]
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("zip_path", type=Path)
    args = parser.parse_args()
    if not args.zip_path.is_file() or args.zip_path.is_symlink():
        print(f"missing or unsafe package: {args.zip_path}", file=sys.stderr)
        return 2
    errors = verify(args.zip_path)
    if errors:
        print("package verification failed:", *errors, sep="\n- ", file=sys.stderr)
        return 1
    print(f"package ok: {args.zip_path} ({len(EXPECTED)} members)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
