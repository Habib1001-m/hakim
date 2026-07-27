#!/usr/bin/env python3
"""Build or verify a deterministic CycloneDX source/product inventory SBOM."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "1.5"
HASH_ALGORITHM = "SHA-256"
NAMESPACE = uuid.UUID("4ef34e60-e864-4fd4-b80f-df7a23b03c55")


class SbomError(Exception):
    """The SBOM contract could not be satisfied safely."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tracked_files(root: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "ls-files", "-z"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError as error:
        raise SbomError("git is required to build the release SBOM") from error
    except subprocess.CalledProcessError as error:
        diagnostic = error.stderr.decode("utf-8", errors="replace").strip()
        raise SbomError(f"git ls-files failed: {diagnostic or error.returncode}") from error

    paths = [item.decode("utf-8") for item in result.stdout.split(b"\0") if item]
    records: list[str] = []
    for relative in paths:
        path = root / relative
        if path.is_symlink() or not path.is_file():
            continue
        records.append(relative)
    return sorted(records)


def load_version(root: Path) -> str:
    path = root / "core" / "hakim-skill" / "VERSION"
    if path.is_symlink() or not path.is_file():
        raise SbomError("canonical VERSION must be a regular file")
    version = path.read_text(encoding="utf-8").strip()
    if not version:
        raise SbomError("canonical VERSION is empty")
    return version


def build_sbom(root: Path) -> dict[str, Any]:
    version = load_version(root)
    paths = tracked_files(root)
    file_components = []
    aggregate = hashlib.sha256()

    for relative in paths:
        digest = sha256_file(root / relative)
        aggregate.update(relative.encode("utf-8"))
        aggregate.update(b"\0")
        aggregate.update(digest.encode("ascii"))
        aggregate.update(b"\n")
        file_components.append(
            {
                "type": "file",
                "bom-ref": f"file:{relative}",
                "name": relative,
                "hashes": [{"alg": HASH_ALGORITHM, "content": digest}],
            }
        )

    inventory_digest = aggregate.hexdigest()
    serial = uuid.uuid5(NAMESPACE, f"hakim:{version}:{inventory_digest}")
    root_ref = f"pkg:github/Habib1001-m/hakim@{version}"

    return {
        "bomFormat": "CycloneDX",
        "specVersion": SCHEMA_VERSION,
        "serialNumber": f"urn:uuid:{serial}",
        "version": 1,
        "metadata": {
            "component": {
                "type": "application",
                "bom-ref": root_ref,
                "name": "hakim",
                "version": version,
                "licenses": [{"license": {"id": "MIT"}}],
                "purl": root_ref,
                "externalReferences": [
                    {
                        "type": "vcs",
                        "url": "https://github.com/Habib1001-m/hakim",
                    }
                ],
                "properties": [
                    {"name": "hakim:inventory:scope", "value": "git-tracked-source-and-product-files"},
                    {"name": "hakim:inventory:sha256", "value": inventory_digest},
                    {"name": "hakim:declared-runtime-dependencies", "value": "none-in-package-metadata"},
                ],
            }
        },
        "components": file_components,
        "dependencies": [{"ref": root_ref, "dependsOn": []}],
    }


def render(sbom: dict[str, Any]) -> str:
    return json.dumps(sbom, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def write_output(path: Path, content: str) -> None:
    if path.is_symlink():
        raise SbomError(f"SBOM output must not be a symlink: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, default=Path("dist/hakim-sbom.cdx.json"))
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    output = args.output.resolve()
    try:
        expected = render(build_sbom(root))
        if args.verify:
            if output.is_symlink() or not output.is_file():
                raise SbomError(f"missing regular SBOM output: {output}")
            observed = output.read_text(encoding="utf-8")
            if observed != expected:
                raise SbomError("SBOM output does not match the current tracked source inventory")
            mode = "verify"
        else:
            write_output(output, expected)
            mode = "build"
    except SbomError as error:
        print(f"SBOM contract error: {error}", file=sys.stderr)
        return 1

    parsed = json.loads(expected)
    print(
        f"release SBOM {mode} ok: {len(parsed['components'])} tracked file(s), "
        f"{parsed['metadata']['component']['version']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
