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
    "hakim-sbom.cdx.json",
    "SHA256SUMS",
    "release-manifest.json",
}
ARTIFACT_FILES = {"hakim-skill.zip", "hakim-sbom.cdx.json"}
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
SHA256_LINE = re.compile(r"^([0-9a-f]{64})  (hakim-(?:skill\.zip|sbom\.cdx\.json))$")
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
    if len(lines) != len(ARTIFACT_FILES):
        raise VerificationError(
            f"SHA256SUMS must contain exactly {len(ARTIFACT_FILES)} checksum lines"
        )

    result: dict[str, str] = {}
    for line in lines:
        match = SHA256_LINE.fullmatch(line)
        if not match:
            raise VerificationError("SHA256SUMS has an invalid or non-canonical line")
        filename = match.group(2)
        if filename in result:
            raise VerificationError(f"SHA256SUMS contains a duplicate artifact: {filename}")
        result[filename] = match.group(1)

    if set(result) != ARTIFACT_FILES:
        raise VerificationError("SHA256SUMS artifact inventory does not match the release contract")
    return result


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
    if manifest["artifact_count"] != len(ARTIFACT_FILES):
        raise VerificationError(
            f"release manifest artifact_count must be {len(ARTIFACT_FILES)}"
        )
    if not VERSION.fullmatch(str(manifest["hakim_version"])):
        raise VerificationError("release manifest hakim_version is invalid")

    artifacts = manifest["artifacts"]
    if not isinstance(artifacts, list) or len(artifacts) != len(ARTIFACT_FILES):
        raise VerificationError("release manifest artifact list has an invalid size")

    by_name: dict[str, dict[str, Any]] = {}
    for record in artifacts:
        if not isinstance(record, dict) or set(record) != {"filename", "sha256", "size_bytes"}:
            raise VerificationError("release manifest artifact record is invalid")
        filename = record["filename"]
        if filename not in ARTIFACT_FILES or filename in by_name:
            raise VerificationError("release manifest artifact inventory is invalid")
        if not re.fullmatch(r"[0-9a-f]{64}", str(record["sha256"])):
            raise VerificationError(f"release manifest artifact sha256 is invalid: {filename}")
        if not isinstance(record["size_bytes"], int) or record["size_bytes"] <= 0:
            raise VerificationError(f"release manifest artifact size_bytes is invalid: {filename}")
        by_name[filename] = record

    if set(by_name) != ARTIFACT_FILES:
        raise VerificationError("release manifest artifact inventory does not match the release contract")
    manifest["artifacts_by_name"] = by_name
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


def verify_sbom(path: Path, expected_version: str) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError as error:
        raise VerificationError(f"SBOM is not valid UTF-8: {error}") from error
    except json.JSONDecodeError as error:
        raise VerificationError(f"SBOM is invalid JSON: {error}") from error

    if payload.get("bomFormat") != "CycloneDX" or payload.get("specVersion") != "1.5":
        raise VerificationError("SBOM is not the expected CycloneDX 1.5 document")
    if not re.fullmatch(r"urn:uuid:[0-9a-fA-F-]{36}", str(payload.get("serialNumber", ""))):
        raise VerificationError("SBOM serialNumber is invalid")

    root_component = payload.get("metadata", {}).get("component", {})
    if root_component.get("name") != "hakim" or root_component.get("version") != expected_version:
        raise VerificationError("SBOM root component identity does not match the release version")

    components = payload.get("components")
    if not isinstance(components, list) or not components:
        raise VerificationError("SBOM file component inventory is empty")

    names: set[str] = set()
    for component in components:
        if not isinstance(component, dict) or component.get("type") != "file":
            raise VerificationError("SBOM contains a non-file inventory component")
        name = component.get("name")
        if not isinstance(name, str) or not name or name in names:
            raise VerificationError("SBOM contains an invalid or duplicate file component")
        names.add(name)
        hashes = component.get("hashes")
        if not isinstance(hashes, list) or len(hashes) != 1:
            raise VerificationError(f"SBOM file hash inventory is invalid: {name}")
        record = hashes[0]
        if record.get("alg") != "SHA-256" or not re.fullmatch(r"[0-9a-f]{64}", str(record.get("content", ""))):
            raise VerificationError(f"SBOM SHA-256 record is invalid: {name}")

    return {"component_count": len(components), "hakim_version": expected_version}


def verify_artifact(
    filename: str,
    path: Path,
    checksums: dict[str, str],
    records: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    observed_sha256 = sha256_file(path)
    observed_size = path.stat().st_size
    if observed_sha256 != checksums[filename]:
        raise VerificationError(f"downloaded {filename} does not match SHA256SUMS")
    record = records[filename]
    if observed_sha256 != record["sha256"]:
        raise VerificationError(f"downloaded {filename} does not match release-manifest.json sha256")
    if observed_size != record["size_bytes"]:
        raise VerificationError(f"downloaded {filename} size does not match release-manifest.json")
    return {"filename": filename, "sha256": observed_sha256, "size_bytes": observed_size}


def verify_downloaded_bundle(bundle_dir: Path, expected_version: str | None = None) -> dict[str, Any]:
    files = prepare_bundle(bundle_dir)
    checksums = parse_checksums(files["SHA256SUMS"])
    manifest = parse_manifest(files["release-manifest.json"])
    records = manifest.pop("artifacts_by_name")

    if expected_version is not None and manifest["hakim_version"] != expected_version:
        raise VerificationError(
            f"manifest version {manifest['hakim_version']!r} does not match expected {expected_version!r}"
        )

    zip_artifact = verify_artifact(
        "hakim-skill.zip", files["hakim-skill.zip"], checksums, records
    )
    sbom_artifact = verify_artifact(
        "hakim-sbom.cdx.json", files["hakim-sbom.cdx.json"], checksums, records
    )
    zip_result = verify_zip(files["hakim-skill.zip"], manifest["hakim_version"])
    sbom_result = verify_sbom(files["hakim-sbom.cdx.json"], manifest["hakim_version"])

    return {
        "schema_version": 1,
        "status": "PASS",
        "mode": "CLEAN_ROOM_VERIFY",
        "mutation_performed": False,
        "bundle_files": sorted(EXPECTED_FILES),
        "hakim_version": manifest["hakim_version"],
        "artifact": {**zip_artifact, **zip_result},
        "sbom": {**sbom_artifact, **sbom_result},
        "checks": {
            "regular_files": "PASS",
            "exact_bundle_inventory": "PASS",
            "checksums": "PASS",
            "manifest": "PASS",
            "zip_integrity": "PASS",
            "zip_paths": "PASS",
            "zip_symlinks": "PASS",
            "packaged_version": "PASS",
            "sbom_integrity": "PASS",
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
        sbom = result["sbom"]
        print(
            "downloaded release bundle verified: "
            f"Hakim {result['hakim_version']}, skill sha256:{artifact['sha256']}, "
            f"SBOM {sbom['component_count']} file component(s)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
