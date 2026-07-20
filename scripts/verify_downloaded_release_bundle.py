#!/usr/bin/env python3
"""Independently verify a downloaded Hakim release artifact bundle."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

EXPECTED_FILES = {
    "hakim-skill.zip",
    "SHA256SUMS",
    "release-manifest.json",
}
REQUIRED_MEMBERS = {
    "hakim-skill/VERSION",
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
}
SHA256_LINE = re.compile(r"^([0-9a-f]{64})  (hakim-skill\.zip)$")
VERSION = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$")
MAX_MEMBERS = 10_000
MAX_UNCOMPRESSED_BYTES = 256 * 1024 * 1024


class ContractError(Exception):
    """The downloaded bundle is missing or structurally unsafe."""


class VerificationError(Exception):
    """The downloaded bundle does not match its declared release metadata."""


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


def prepare_bundle(bundle_dir: Path) -> dict[str, Path]:
    if bundle_dir.is_symlink():
        raise ContractError(f"bundle directory must not be a symlink: {bundle_dir}")
    if not bundle_dir.exists():
        raise ContractError(f"missing bundle directory: {bundle_dir}")
    if not bundle_dir.is_dir():
        raise ContractError(f"bundle path must be a directory: {bundle_dir}")

    observed = {entry.name for entry in bundle_dir.iterdir()}
    missing = sorted(EXPECTED_FILES - observed)
    extras = sorted(observed - EXPECTED_FILES)
    if missing:
        raise ContractError(f"bundle is missing required files: {', '.join(missing)}")
    if extras:
        raise ContractError(f"bundle contains unexpected files: {', '.join(extras)}")

    return {
        name: require_regular_file(bundle_dir / name, name)
        for name in sorted(EXPECTED_FILES)
    }


def parse_checksums(path: Path) -> dict[str, str]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise VerificationError(f"SHA256SUMS is not valid UTF-8: {error}") from error
    lines = text.splitlines()
    if len(lines) != 1:
        raise VerificationError("SHA256SUMS must contain exactly one checksum line")
    match = SHA256_LINE.fullmatch(lines[0])
    if not match:
        raise VerificationError("SHA256SUMS has an invalid or non-canonical line")
    return {match.group(2): match.group(1)}


def parse_manifest(path: Path) -> dict[str, Any]:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError as error:
        raise VerificationError(f"release manifest is not valid UTF-8: {error}") from error
    except json.JSONDecodeError as error:
        raise VerificationError(f"release manifest is invalid JSON: {error}") from error

    required_keys = {
        "schema_version",
        "hakim_version",
        "algorithm",
        "artifact_count",
        "artifacts",
    }
    if set(manifest) != required_keys:
        raise VerificationError("release manifest keys do not match schema version 1")
    if manifest["schema_version"] != 1:
        raise VerificationError("release manifest schema_version must be 1")
    if manifest["algorithm"] != "sha256":
        raise VerificationError("release manifest algorithm must be sha256")
    if manifest["artifact_count"] != 1:
        raise VerificationError("release manifest artifact_count must be 1")
    if not VERSION.fullmatch(str(manifest["hakim_version"])):
        raise VerificationError("release manifest hakim_version is invalid")
    artifacts = manifest["artifacts"]
    if not isinstance(artifacts, list) or len(artifacts) != 1:
        raise VerificationError("release manifest must contain one artifact record")
    record = artifacts[0]
    if not isinstance(record, dict) or set(record) != {"filename", "sha256", "size_bytes"}:
        raise VerificationError("release manifest artifact record is invalid")
    if record["filename"] != "hakim-skill.zip":
        raise VerificationError("release manifest filename must be hakim-skill.zip")
    if not re.fullmatch(r"[0-9a-f]{64}", str(record["sha256"])):
        raise VerificationError("release manifest artifact sha256 is invalid")
    if not isinstance(record["size_bytes"], int) or record["size_bytes"] <= 0:
        raise VerificationError("release manifest artifact size_bytes must be positive")
    return manifest


def zip_member_is_symlink(info: zipfile.ZipInfo) -> bool:
    unix_mode = (info.external_attr >> 16) & 0xFFFF
    return stat.S_ISLNK(unix_mode)


def verify_zip(path: Path, expected_version: str) -> dict[str, Any]:
    try:
        with zipfile.ZipFile(path) as archive:
            bad_member = archive.testzip()
            if bad_member:
                raise VerificationError(f"ZIP contains a corrupt member: {bad_member}")
            infos = archive.infolist()
            if not infos:
                raise VerificationError("ZIP is empty")
            if len(infos) > MAX_MEMBERS:
                raise VerificationError("ZIP member count exceeds the verification limit")

            names: set[str] = set()
            uncompressed_bytes = 0
            for info in infos:
                name = info.filename
                if name in names:
                    raise VerificationError(f"ZIP contains a duplicate member: {name}")
                names.add(name)
                uncompressed_bytes += info.file_size
                if uncompressed_bytes > MAX_UNCOMPRESSED_BYTES:
                    raise VerificationError("ZIP uncompressed size exceeds the verification limit")
                if info.flag_bits & 0x1:
                    raise VerificationError(f"ZIP contains an encrypted member: {name}")
                if zip_member_is_symlink(info):
                    raise VerificationError(f"ZIP contains a symlink member: {name}")
                if "\\" in name:
                    raise VerificationError(f"ZIP member uses a backslash path: {name}")
                parts = PurePosixPath(name).parts
                if not parts or parts[0] != "hakim-skill":
                    raise VerificationError(f"ZIP member is outside hakim-skill/: {name}")
                if PurePosixPath(name).is_absolute() or ".." in parts:
                    raise VerificationError(f"ZIP member has an unsafe path: {name}")

            missing = sorted(REQUIRED_MEMBERS - names)
            if missing:
                raise VerificationError(
                    "ZIP is missing required members: " + ", ".join(missing)
                )
            packaged_version = archive.read("hakim-skill/VERSION").decode("utf-8").strip()
            if packaged_version != expected_version:
                raise VerificationError(
                    f"packaged VERSION {packaged_version!r} does not match manifest {expected_version!r}"
                )
            return {
                "member_count": len(infos),
                "uncompressed_bytes": uncompressed_bytes,
                "packaged_version": packaged_version,
            }
    except zipfile.BadZipFile as error:
        raise VerificationError(f"hakim-skill.zip is not a valid ZIP: {error}") from error
    except UnicodeDecodeError as error:
        raise VerificationError(f"packaged VERSION is not valid UTF-8: {error}") from error


def verify_downloaded_bundle(bundle_dir: Path, expected_version: str | None = None) -> dict[str, Any]:
    files = prepare_bundle(bundle_dir)
    zip_path = files["hakim-skill.zip"]
    checksums = parse_checksums(files["SHA256SUMS"])
    manifest = parse_manifest(files["release-manifest.json"])
    record = manifest["artifacts"][0]

    observed_sha256 = sha256_file(zip_path)
    observed_size = zip_path.stat().st_size
    declared_checksum = checksums["hakim-skill.zip"]
    if observed_sha256 != declared_checksum:
        raise VerificationError("downloaded ZIP does not match SHA256SUMS")
    if observed_sha256 != record["sha256"]:
        raise VerificationError("downloaded ZIP does not match release-manifest.json sha256")
    if observed_size != record["size_bytes"]:
        raise VerificationError("downloaded ZIP size does not match release-manifest.json")
    if expected_version is not None and manifest["hakim_version"] != expected_version:
        raise VerificationError(
            f"manifest version {manifest['hakim_version']!r} does not match expected {expected_version!r}"
        )

    zip_result = verify_zip(zip_path, manifest["hakim_version"])
    return {
        "schema_version": 1,
        "status": "PASS",
        "mode": "CLEAN_ROOM_VERIFY",
        "mutation_performed": False,
        "bundle_files": sorted(EXPECTED_FILES),
        "hakim_version": manifest["hakim_version"],
        "artifact": {
            "filename": "hakim-skill.zip",
            "sha256": observed_sha256,
            "size_bytes": observed_size,
            **zip_result,
        },
        "checks": {
            "regular_files": "PASS",
            "exact_bundle_inventory": "PASS",
            "checksum": "PASS",
            "manifest": "PASS",
            "zip_integrity": "PASS",
            "zip_paths": "PASS",
            "zip_symlinks": "PASS",
            "packaged_version": "PASS",
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Independently verify a downloaded Hakim release artifact bundle.",
    )
    parser.add_argument("bundle_dir", type=Path)
    parser.add_argument("--expected-version")
    parser.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = verify_downloaded_bundle(args.bundle_dir, args.expected_version)
    except VerificationError as error:
        print(f"downloaded release verification failed: {error}", file=sys.stderr)
        return 1
    except ContractError as error:
        print(f"downloaded release contract error: {error}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        artifact = result["artifact"]
        print(
            "downloaded release bundle verified: "
            f"Hakim {result['hakim_version']}, {artifact['size_bytes']} bytes, "
            f"sha256:{artifact['sha256']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
