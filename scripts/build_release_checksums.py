#!/usr/bin/env python3
"""Build and verify deterministic SHA-256 metadata for Hakim release artifacts."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
ALGORITHM = "sha256"


class ContractError(Exception):
    """The requested release-artifact operation is structurally unsafe."""


class VerificationError(Exception):
    """Existing checksum metadata does not match the current artifacts."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_regular_file(path: Path, label: str) -> Path:
    if path.is_symlink():
        raise ContractError(f"{label} must not be a symlink: {path}")
    if not path.exists():
        raise ContractError(f"missing {label}: {path}")
    if not path.is_file():
        raise ContractError(f"{label} must be a regular file: {path}")
    return path.resolve()


def build_manifest(artifacts: list[Path], version: str) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    for artifact in artifacts:
        name = artifact.name
        if name in seen_names:
            raise ContractError(f"artifact basenames must be unique: {name}")
        seen_names.add(name)
        records.append(
            {
                "filename": name,
                "sha256": sha256_file(artifact),
                "size_bytes": artifact.stat().st_size,
            }
        )
    records.sort(key=lambda item: item["filename"])
    return {
        "schema_version": SCHEMA_VERSION,
        "hakim_version": version,
        "algorithm": ALGORITHM,
        "artifact_count": len(records),
        "artifacts": records,
    }


def render_checksums(manifest: dict[str, Any]) -> str:
    return "".join(
        f"{item['sha256']}  {item['filename']}\n"
        for item in manifest["artifacts"]
    )


def render_manifest(manifest: dict[str, Any]) -> str:
    return json.dumps(manifest, indent=2, sort_keys=True) + "\n"


def write_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.",
        dir=str(path.parent),
        text=True,
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_path, path)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise


def prepare_inputs(
    artifact_paths: list[Path],
    version_file: Path,
    checksums_path: Path,
    manifest_path: Path,
) -> tuple[list[Path], str, Path, Path]:
    if not artifact_paths:
        raise ContractError("at least one --artifact is required")
    artifacts = [require_regular_file(path, "artifact") for path in artifact_paths]
    version_source = require_regular_file(version_file, "version file")
    version = version_source.read_text(encoding="utf-8").strip()
    if not version:
        raise ContractError(f"version file is empty: {version_source}")

    if checksums_path.is_symlink():
        raise ContractError(f"checksum output must not be a symlink: {checksums_path}")
    if manifest_path.is_symlink():
        raise ContractError(f"manifest output must not be a symlink: {manifest_path}")

    checksums = checksums_path.resolve(strict=False)
    manifest = manifest_path.resolve(strict=False)
    if checksums == manifest:
        raise ContractError("checksum and manifest outputs must be different files")
    artifact_set = set(artifacts)
    if checksums in artifact_set or manifest in artifact_set:
        raise ContractError("checksum outputs must not overwrite an artifact")
    return artifacts, version, checksums, manifest


def generate_bundle(
    artifact_paths: list[Path],
    version_file: Path,
    checksums_path: Path,
    manifest_path: Path,
) -> dict[str, Any]:
    artifacts, version, checksums, manifest_path = prepare_inputs(
        artifact_paths,
        version_file,
        checksums_path,
        manifest_path,
    )
    manifest = build_manifest(artifacts, version)
    write_atomic(checksums, render_checksums(manifest))
    write_atomic(manifest_path, render_manifest(manifest))
    return {
        "status": "PASS",
        "mode": "GENERATE",
        "algorithm": ALGORITHM,
        "hakim_version": version,
        "artifact_count": manifest["artifact_count"],
        "checksums_path": str(checksums),
        "manifest_path": str(manifest_path),
        "artifacts": manifest["artifacts"],
    }


def verify_bundle(
    artifact_paths: list[Path],
    version_file: Path,
    checksums_path: Path,
    manifest_path: Path,
) -> dict[str, Any]:
    artifacts, version, checksums, manifest_path = prepare_inputs(
        artifact_paths,
        version_file,
        checksums_path,
        manifest_path,
    )
    require_regular_file(checksums, "checksum file")
    require_regular_file(manifest_path, "release manifest")

    expected_manifest = build_manifest(artifacts, version)
    expected_checksums = render_checksums(expected_manifest)
    observed_checksums = checksums.read_text(encoding="utf-8")
    if observed_checksums != expected_checksums:
        raise VerificationError("SHA256SUMS does not match the current release artifacts")

    try:
        observed_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise VerificationError(f"release manifest is invalid JSON: {error}") from error
    if observed_manifest != expected_manifest:
        raise VerificationError("release manifest does not match the current release artifacts")

    return {
        "status": "PASS",
        "mode": "VERIFY",
        "algorithm": ALGORITHM,
        "hakim_version": version,
        "artifact_count": expected_manifest["artifact_count"],
        "checksums_path": str(checksums),
        "manifest_path": str(manifest_path),
        "artifacts": expected_manifest["artifacts"],
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build or verify deterministic release-artifact checksums.",
    )
    parser.add_argument("--artifact", action="append", type=Path, required=True)
    parser.add_argument("--version-file", type=Path, default=Path("core/hakim-skill/VERSION"))
    parser.add_argument("--checksums", type=Path, default=Path("dist/SHA256SUMS"))
    parser.add_argument("--manifest", type=Path, default=Path("dist/release-manifest.json"))
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    operation = verify_bundle if args.verify else generate_bundle
    try:
        result = operation(
            args.artifact,
            args.version_file,
            args.checksums,
            args.manifest,
        )
    except VerificationError as error:
        print(f"verification failed: {error}", file=sys.stderr)
        return 1
    except ContractError as error:
        print(f"release checksum contract error: {error}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(
            f"release checksums {result['mode'].lower()} ok: "
            f"{result['artifact_count']} artifact(s), {result['hakim_version']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
